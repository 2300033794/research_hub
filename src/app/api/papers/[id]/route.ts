import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { isObjectId } from "@/lib/http";
import { paperInputSchema } from "@/lib/validators";
import { requireAdmin, requireUser } from "@/lib/require-user";
import { isAdmin } from "@/lib/permissions";
import { destroyCloudinaryAsset } from "@/lib/cloudinary";
import { ResearchPaper } from "@/models/ResearchPaper";
import { Comment } from "@/models/Comment";
import { Vote } from "@/models/Vote";
import { logAdminAction } from "@/lib/audit";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!isObjectId(id)) return jsonError("Invalid paper id.", 400);

  await dbConnect();
  const paper = await ResearchPaper.findById(id)
    .populate("uploadedBy", "name profileImage bio institution canPostResearch isVerified createdAt")
    .lean();
  if (!paper) return jsonError("Paper not found.", 404);

  const access = await requireUser();
  const user = "user" in access ? access.user : null;
  const visible =
    paper.status === "APPROVED" ||
    (user && (isAdmin(user) || user._id.toString() === String(paper.uploadedBy?._id || paper.uploadedBy)));

  if (!visible) {
    return jsonError("This paper is not publicly available yet.", 403);
  }

  await ResearchPaper.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

  const related = await ResearchPaper.find({
    _id: { $ne: paper._id },
    status: "APPROVED",
    $or: [{ category: paper.category }, { tags: { $in: paper.tags } }],
  })
    .sort({ likeCount: -1, createdAt: -1 })
    .limit(4)
    .select("title category authors likeCount commentCount createdAt thumbnailUrl")
    .lean();

  return jsonOk({ paper: { ...paper, viewCount: (paper.viewCount || 0) + 1 }, related });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireUser();
  if ("error" in access) return access.error;
  if (!isObjectId(id)) return jsonError("Invalid paper id.", 400);

  const body = await request.json().catch(() => null);
  const parsed = paperInputSchema.partial().safeParse(body);
  if (!parsed.success) return jsonError("Invalid paper update.", 422);

  await dbConnect();
  const paper = await ResearchPaper.findById(id);
  if (!paper) return jsonError("Paper not found.", 404);

  const owner = paper.uploadedBy.toString() === access.user._id.toString();
  if (!isAdmin(access.user) && !owner) {
    return jsonError("You cannot edit another researcher's paper.", 403);
  }
  if (!isAdmin(access.user) && paper.status === "APPROVED") {
    return jsonError("Approved papers can only be edited by an administrator.", 403);
  }

  Object.assign(paper, parsed.data);
  if (parsed.data.publicationDate) {
    paper.publicationDate = new Date(parsed.data.publicationDate);
  }
  await paper.save();
  return jsonOk({ paper });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireAdmin();
  if ("error" in access) return access.error;
  if (!isObjectId(id)) return jsonError("Invalid paper id.", 400);

  await dbConnect();
  const paper = await ResearchPaper.findById(id);
  if (!paper) return jsonError("Paper not found.", 404);

  try {
    await destroyCloudinaryAsset(paper.cloudinaryPublicId, "raw");
    if (paper.thumbnailPublicId) {
      await destroyCloudinaryAsset(paper.thumbnailPublicId, "image");
    }
  } catch {
    /* continue even if remote delete fails */
  }

  await Promise.all([
    Comment.deleteMany({ paperId: paper._id }),
    Vote.deleteMany({ paperId: paper._id }),
    paper.deleteOne(),
    logAdminAction({
      adminId: access.user._id,
      action: "PAPER_DELETED",
      targetPaperId: paper._id,
      details: paper.title,
    }),
  ]);

  return jsonOk({ ok: true });
}
