import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { commentSchema } from "@/lib/validators";
import { requireCommunityUser } from "@/lib/require-user";
import { isObjectId, clientIp } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { ResearchPaper } from "@/models/ResearchPaper";
import { Comment } from "@/models/Comment";
import { notify } from "@/lib/notify";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!isObjectId(id)) return jsonError("Invalid paper id.");
  await dbConnect();
  const comments = await Comment.find({ paperId: id, isHidden: false })
    .sort({ createdAt: 1 })
    .populate("userId", "name profileImage canPostResearch isVerified")
    .lean();
  return jsonOk({ comments });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const limited = rateLimit(`comment:${clientIp(request)}`, 20, 60 * 1000);
  if (!limited.ok) return jsonError("You are commenting too quickly.", 429);

  const access = await requireCommunityUser();
  if ("error" in access) return access.error;
  if (!isObjectId(id)) return jsonError("Invalid paper id.");

  const body = await request.json().catch(() => null);
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) return jsonError("Comment must be between 3 and 4000 characters.", 422);

  await dbConnect();
  const paper = await ResearchPaper.findOne({ _id: id, status: "APPROVED" });
  if (!paper) return jsonError("Paper not found.", 404);

  let parent = null;
  if (parsed.data.parentCommentId) {
    if (!isObjectId(parsed.data.parentCommentId)) return jsonError("Invalid parent comment.");
    parent = await Comment.findOne({ _id: parsed.data.parentCommentId, paperId: paper._id });
    if (!parent) return jsonError("Parent comment not found.", 404);
  }

  const comment = await Comment.create({
    paperId: paper._id,
    userId: access.user._id,
    content: parsed.data.content,
    parentCommentId: parent?._id ?? null,
  });

  paper.commentCount = await Comment.countDocuments({ paperId: paper._id, isHidden: false });
  await paper.save();

  if (paper.uploadedBy.toString() !== access.user._id.toString()) {
    await notify({
      userId: paper.uploadedBy,
      type: "PAPER_COMMENTED",
      message: `${access.user.name} commented on “${paper.title}”.`,
      relatedPaperId: paper._id,
      relatedCommentId: comment._id,
    });
  }

  if (parent && parent.userId.toString() !== access.user._id.toString()) {
    await notify({
      userId: parent.userId,
      type: "COMMENT_REPLIED",
      message: `${access.user.name} replied to your comment.`,
      relatedPaperId: paper._id,
      relatedCommentId: comment._id,
    });
  }

  const populated = await comment.populate("userId", "name profileImage canPostResearch isVerified");
  return jsonOk({ comment: populated }, 201);
}
