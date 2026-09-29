import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { jsonOk } from "@/lib/api-response";
import { requireUser } from "@/lib/require-user";
import { Notification } from "@/models/Notification";
import { pagination } from "@/lib/http";

export async function GET(request: NextRequest) {
  const access = await requireUser();
  if ("error" in access) return access.error;
  await dbConnect();
  const { page, limit, skip } = pagination(request, 20);
  const [items, total, unread] = await Promise.all([
    Notification.find({ userId: access.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments({ userId: access.user._id }),
    Notification.countDocuments({ userId: access.user._id, isRead: false }),
  ]);
  return jsonOk({ items, total, unread, page, pages: Math.ceil(total / limit) });
}

export async function PATCH() {
  const access = await requireUser();
  if ("error" in access) return access.error;
  await dbConnect();
  await Notification.updateMany({ userId: access.user._id, isRead: false }, { isRead: true });
  return jsonOk({ ok: true });
}
