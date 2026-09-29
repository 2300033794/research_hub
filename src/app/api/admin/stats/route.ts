import { dbConnect } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdmin } from "@/lib/require-user";
import { User } from "@/models/User";
import { ResearchPaper } from "@/models/ResearchPaper";
import { Comment } from "@/models/Comment";
import { Vote } from "@/models/Vote";

export async function GET() {
  const access = await requireAdmin();
  if ("error" in access) return access.error;
  await dbConnect();
  const [
    totalUsers,
    pendingUsers,
    verifiedUsers,
    authorizedResearchers,
    totalPapers,
    pendingPapers,
    totalComments,
    totalLikes,
    totalDislikes,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ accountStatus: "PENDING" }),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ canPostResearch: true, role: "USER" }),
    ResearchPaper.countDocuments(),
    ResearchPaper.countDocuments({ status: "PENDING_REVIEW" }),
    Comment.countDocuments(),
    Vote.countDocuments({ type: "LIKE" }),
    Vote.countDocuments({ type: "DISLIKE" }),
  ]);

  return jsonOk({
    totalUsers,
    pendingUsers,
    verifiedUsers,
    authorizedResearchers,
    totalPapers,
    pendingPapers,
    totalComments,
    totalLikes,
    totalDislikes,
  });
}
