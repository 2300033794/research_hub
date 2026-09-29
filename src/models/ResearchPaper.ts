import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { PAPER_STATUSES } from "@/types";

const ResearchPaperSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 220 },
    abstract: { type: String, required: true, maxlength: 6000 },
    authors: { type: [String], required: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, default: "", index: true },
    tags: { type: [String], default: [], index: true },
    keywords: { type: [String], default: [] },
    institution: { type: String, default: "", index: true },
    researchField: { type: String, default: "", index: true },
    publicationDate: { type: Date, default: null },
    doi: { type: String, default: "" },
    fileUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    thumbnailUrl: { type: String, default: "" },
    thumbnailPublicId: { type: String, default: "" },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: PAPER_STATUSES,
      default: "PENDING_REVIEW",
      index: true,
    },
    rejectionReason: { type: String, default: "" },
    isFeatured: { type: Boolean, default: false, index: true },
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    dislikeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

ResearchPaperSchema.index({
  title: "text",
  abstract: "text",
  authors: "text",
  tags: "text",
  keywords: "text",
  institution: "text",
  researchField: "text",
  category: "text",
});
ResearchPaperSchema.index({ createdAt: -1 });
ResearchPaperSchema.index({ likeCount: -1 });
ResearchPaperSchema.index({ commentCount: -1 });
ResearchPaperSchema.index({ viewCount: -1 });
ResearchPaperSchema.index({ status: 1, category: 1, createdAt: -1 });

export type ResearchPaperDocument = InferSchemaType<typeof ResearchPaperSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ResearchPaper: Model<ResearchPaperDocument> =
  (mongoose.models.ResearchPaper as Model<ResearchPaperDocument>) ||
  mongoose.model<ResearchPaperDocument>("ResearchPaper", ResearchPaperSchema);
