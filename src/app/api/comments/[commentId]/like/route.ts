import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireCommunityUser } from "@/lib/require-user";
import { isObjectId } from "@/lib/http";
import { Comment } from "@/models/Comment";
import { CommentVote } from "@/models/CommentVote";

type RouteContext = { params: Promise<{ commentId: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const { commentId } = await context.params;
  const access = await requireCommunityUser();
  if ("error" in access) return access.error;
  if (!isObjectId(commentId)) return jsonError("Invalid comment id.");

  await dbConnect();
  const comment = await Comment.findById(commentId);
  if (!comment || comment.isHidden) return jsonError("Comment not found.", 404);

  const existing = await CommentVote.findOne({
    userId: access.user._id,
    commentId: comment._id,
  });
  if (existing) {
    await existing.deleteOne();
  } else {
    await CommentVote.create({ userId: access.user._id, commentId: comment._id });
  }
  comment.likeCount = await CommentVote.countDocuments({ commentId: comment._id });
  await comment.save();
  return jsonOk({ liked: !existing, likeCount: comment.likeCount });
}
