import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CommentVoteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    commentId: { type: Schema.Types.ObjectId, ref: "Comment", required: true },
  },
  { timestamps: true },
);

CommentVoteSchema.index({ userId: 1, commentId: 1 }, { unique: true });

export type CommentVoteDocument = InferSchemaType<typeof CommentVoteSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CommentVote: Model<CommentVoteDocument> =
  (mongoose.models.CommentVote as Model<CommentVoteDocument>) ||
  mongoose.model<CommentVoteDocument>("CommentVote", CommentVoteSchema);
