import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ACCOUNT_STATUSES, AUTH_PROVIDERS, USER_ROLES } from "@/types";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, default: null },
    role: { type: String, enum: USER_ROLES, default: "USER", index: true },
    accountStatus: {
      type: String,
      enum: ACCOUNT_STATUSES,
      default: "PENDING",
      index: true,
    },
    isVerified: { type: Boolean, default: false, index: true },
    canPostResearch: { type: Boolean, default: false, index: true },
    profileImage: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 500 },
    institution: { type: String, default: "", maxlength: 160 },
    researchInterests: { type: [String], default: [] },
    authProviders: {
      type: [String],
      enum: AUTH_PROVIDERS,
      default: ["email"],
    },
    googleAccountId: { type: String, default: null, index: true },
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true },
);

UserSchema.index({ name: "text", email: "text", institution: "text" });

export type UserDocument = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument>) ||
  mongoose.model<UserDocument>("User", UserSchema);
