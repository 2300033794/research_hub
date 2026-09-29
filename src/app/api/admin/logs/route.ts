import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdmin } from "@/lib/require-user";
import { pagination } from "@/lib/http";
import { AdminLog } from "@/models/AdminLog";

export async function GET(request: NextRequest) {
  const access = await requireAdmin();
  if ("error" in access) return access.error;
  await dbConnect();
  const { page, limit, skip } = pagination(request, 30);
  const [items, total] = await Promise.all([
    AdminLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("adminId", "name email")
      .populate("targetUserId", "name email")
      .populate("targetPaperId", "title")
      .lean(),
    AdminLog.countDocuments(),
  ]);
  return jsonOk({ items, total, page, pages: Math.ceil(total / limit) });
}
