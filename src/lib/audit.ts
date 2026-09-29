import { AdminLog } from "@/models/AdminLog";
import type { Types } from "mongoose";

export async function logAdminAction(options: {
  adminId: Types.ObjectId | string;
  action: string;
  targetUserId?: Types.ObjectId | string | null;
  targetPaperId?: Types.ObjectId | string | null;
  details?: string;
}) {
  await AdminLog.create({
    adminId: options.adminId,
    action: options.action,
    targetUserId: options.targetUserId ?? null,
    targetPaperId: options.targetPaperId ?? null,
    details: options.details ?? "",
  });
}
