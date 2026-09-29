import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { commentSchema } from "@/lib/validators";
import { requireAdmin, requireCommunityUser } from "@/lib/require-user";
import { isAdmin } from "@/lib/permissions";
import { isObjectId } from "@/lib/http";
import { Comment } from "@/models/Comment";
import { ResearchPaper } from "@/models/ResearchPaper";
import { logAdminAction } from "@/lib/audit";

type RouteContext = { params: Promise<{ commentId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { commentId } = await context.params;
  const access = await requireCommunityUser();
  if ("error" in access) return access.error;
  if (!isObjectId(commentId)) return jsonError("Invalid comment id.");

  const body = await request.json().catch(() => null);
  const parsed = commentSchema.pick({ content: true }).safeParse(body);
  if (!parsed.success) return jsonError("Invalid comment.", 422);

  await dbConnect();
  const comment = await Comment.findById(commentId);
  if (!comment || comment.isHidden) return jsonError("Comment not found.", 404);
  if (comment.userId.toString() !== access.user._id.toString()) {
    return jsonError("You can only edit your own comments.", 403);
  }
  comment.content = parsed.data.content;
  await comment.save();
  return jsonOk({ comment });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { commentId } = await context.params;
  const access = await requireCommunityUser();
  if ("error" in access) return access.error;
  if (!isObjectId(commentId)) return jsonError("Invalid comment id.");

  await dbConnect();
  const comment = await Comment.findById(commentId);
  if (!comment) return jsonError("Comment not found.", 404);

  const owner = comment.userId.toString() === access.user._id.toString();
  if (!owner && !isAdmin(access.user)) {
    return jsonError("You can only delete your own comments.", 403);
  }

  await comment.deleteOne();
  const count = await Comment.countDocuments({ paperId: comment.paperId, isHidden: false });
  await ResearchPaper.findByIdAndUpdate(comment.paperId, { commentCount: count });
  return jsonOk({ ok: true });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { commentId } = await context.params;
  const access = await requireAdmin();
  if ("error" in access) return access.error;
  if (!isObjectId(commentId)) return jsonError("Invalid comment id.");

  const body = await request.json().catch(() => ({}));
  await dbConnect();
  const comment = await Comment.findById(commentId);
  if (!comment) return jsonError("Comment not found.", 404);
  comment.isHidden = Boolean(body.hidden ?? !comment.isHidden);
  await comment.save();
  const count = await Comment.countDocuments({ paperId: comment.paperId, isHidden: false });
  await ResearchPaper.findByIdAndUpdate(comment.paperId, { commentCount: count });
  await logAdminAction({
    adminId: access.user._id,
    action: comment.isHidden ? "COMMENT_HIDDEN" : "COMMENT_RESTORED",
    details: comment._id.toString(),
  });
  return jsonOk({ comment });
}
