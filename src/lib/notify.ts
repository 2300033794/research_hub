import { Notification } from "@/models/Notification";
import type { NotificationType } from "@/types";
import type { Types } from "mongoose";

export async function notify(options: {
  userId: Types.ObjectId | string;
  type: NotificationType;
  message: string;
  relatedPaperId?: Types.ObjectId | string | null;
  relatedCommentId?: Types.ObjectId | string | null;
}) {
  await Notification.create({
    userId: options.userId,
    type: options.type,
    message: options.message,
    relatedPaperId: options.relatedPaperId ?? null,
    relatedCommentId: options.relatedCommentId ?? null,
  });
}
