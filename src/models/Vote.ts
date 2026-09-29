import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { VOTE_TYPES } from "@/types";

const VoteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    paperId: { type: Schema.Types.ObjectId, ref: "ResearchPaper", required: true },
    type: { type: String, enum: VOTE_TYPES, required: true },
  },
  { timestamps: true },
);

VoteSchema.index({ userId: 1, paperId: 1 }, { unique: true });
VoteSchema.index({ paperId: 1, type: 1 });

export type VoteDocument = InferSchemaType<typeof VoteSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Vote: Model<VoteDocument> =
  (mongoose.models.Vote as Model<VoteDocument>) ||
  mongoose.model<VoteDocument>("Vote", VoteSchema);
