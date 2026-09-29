import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const AdminLogSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true, index: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    targetPaperId: { type: Schema.Types.ObjectId, ref: "ResearchPaper", default: null },
    details: { type: String, default: "" },
  },
  { timestamps: true },
);

AdminLogSchema.index({ createdAt: -1 });

export type AdminLogDocument = InferSchemaType<typeof AdminLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AdminLog: Model<AdminLogDocument> =
  (mongoose.models.AdminLog as Model<AdminLogDocument>) ||
  mongoose.model<AdminLogDocument>("AdminLog", AdminLogSchema);
