import { NextRequest } from "next/server";
import { FilterQuery } from "mongoose";
import { dbConnect } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdmin } from "@/lib/require-user";
import { pagination } from "@/lib/http";
import { User } from "@/models/User";
import { ResearchPaper } from "@/models/ResearchPaper";
import { Comment } from "@/models/Comment";
import type { UserDocument } from "@/models/User";
import { ACCOUNT_STATUSES } from "@/types";

export async function GET(request: NextRequest) {
  const access = await requireAdmin();
  if ("error" in access) return access.error;
  await dbConnect();
  const { page, limit, skip } = pagination(request, 20);
  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim() || "";
  const status = params.get("status") || "";
  const filter: FilterQuery<UserDocument> = {};
  if (status && ACCOUNT_STATUSES.includes(status as (typeof ACCOUNT_STATUSES)[number])) {
    filter.accountStatus = status;
  }
  if (q) {
    filter.$or = [
      { name: new RegExp(q, "i") },
      { email: new RegExp(q, "i") },
      { institution: new RegExp(q, "i") },
    ];
  }

  const users = await User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  const total = await User.countDocuments(filter);
  const ids = users.map((user) => user._id);
  const [paperCounts, commentCounts] = await Promise.all([
    ResearchPaper.aggregate([{ $match: { uploadedBy: { $in: ids } } }, { $group: { _id: "$uploadedBy", n: { $sum: 1 } } }]),
    Comment.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: "$userId", n: { $sum: 1 } } }]),
  ]);
  const paperMap = Object.fromEntries(paperCounts.map((row) => [String(row._id), row.n]));
  const commentMap = Object.fromEntries(commentCounts.map((row) => [String(row._id), row.n]));

  return jsonOk({
    users: users.map((user) => ({
      ...user,
      passwordHash: undefined,
      paperCount: paperMap[String(user._id)] || 0,
      commentCount: commentMap[String(user._id)] || 0,
      authMethod:
        user.authProviders?.includes("google") && user.authProviders?.includes("email")
          ? "Both"
          : user.authProviders?.includes("google")
            ? "Google"
            : "Email/password",
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
