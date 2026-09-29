import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CommentSchema = new Schema(
  {
    paperId: { type: Schema.Types.ObjectId, ref: "ResearchPaper", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true, maxlength: 4000 },
    parentCommentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null, index: true },
    isHidden: { type: Boolean, default: false, index: true },
    likeCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

CommentSchema.index({ paperId: 1, createdAt: -1 });

export type CommentDocument = InferSchemaType<typeof CommentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Comment: Model<CommentDocument> =
  (mongoose.models.Comment as Model<CommentDocument>) ||
  mongoose.model<CommentDocument>("Comment", CommentSchema);
