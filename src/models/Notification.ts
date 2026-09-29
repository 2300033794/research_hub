import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { NOTIFICATION_TYPES } from "@/types";

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    message: { type: String, required: true },
    relatedPaperId: { type: Schema.Types.ObjectId, ref: "ResearchPaper", default: null },
    relatedCommentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof NotificationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Notification: Model<NotificationDocument> =
  (mongoose.models.Notification as Model<NotificationDocument>) ||
  mongoose.model<NotificationDocument>("Notification", NotificationSchema);
