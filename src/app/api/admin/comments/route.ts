import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdmin } from "@/lib/require-user";
import { pagination } from "@/lib/http";
import { Comment } from "@/models/Comment";

export async function GET(request: NextRequest) {
  const access = await requireAdmin();
  if ("error" in access) return access.error;
  await dbConnect();
  const { page, limit, skip } = pagination(request, 20);
  const hidden = request.nextUrl.searchParams.get("hidden");
  const filter = hidden === "true" ? { isHidden: true } : {};
  const [items, total] = await Promise.all([
    Comment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email")
      .populate("paperId", "title")
      .lean(),
    Comment.countDocuments(filter),
  ]);
  return jsonOk({ items, total, page, pages: Math.ceil(total / limit) });
}
