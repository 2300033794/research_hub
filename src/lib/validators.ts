import { z } from "zod";
import { ACCOUNT_STATUSES, PAPER_STATUSES, VOTE_TYPES } from "@/types";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  bio: z.string().trim().max(500).optional(),
  institution: z.string().trim().max(160).optional(),
  researchInterests: z.array(z.string().trim().max(60)).max(12).optional(),
});

export const paperInputSchema = z.object({
  title: z.string().trim().min(8).max(220),
  abstract: z.string().trim().min(40).max(6000),
  authors: z.array(z.string().trim().min(2).max(120)).min(1).max(20),
  category: z.string().trim().min(2).max(80),
  subcategory: z.string().trim().max(80).optional().default(""),
  tags: z.array(z.string().trim().min(1).max(40)).max(16).optional().default([]),
  keywords: z.array(z.string().trim().min(1).max(40)).max(16).optional().default([]),
  institution: z.string().trim().max(160).optional().default(""),
  researchField: z.string().trim().max(80).optional().default(""),
  publicationDate: z.string().optional(),
  doi: z.string().trim().max(120).optional().default(""),
  publishNow: z.boolean().optional().default(false),
});

export const commentSchema = z.object({
  content: z.string().trim().min(3).max(4000),
  parentCommentId: z.string().optional().nullable(),
});

export const voteSchema = z.object({
  type: z.enum(VOTE_TYPES).nullable(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional().default(""),
  isActive: z.boolean().optional().default(true),
});

export const adminUserActionSchema = z.object({
  action: z.enum([
    "approve",
    "reject",
    "verify",
    "suspend",
    "restore",
    "delete",
    "grant-posting",
    "revoke-posting",
  ]),
});

export const paperModerationSchema = z.object({
  action: z.enum(["approve", "reject", "request-changes", "feature", "unfeature", "delete"]),
  details: z.string().trim().max(500).optional(),
});

export const accountStatusFilter = z.enum(ACCOUNT_STATUSES).optional();
export const paperStatusFilter = z.enum(PAPER_STATUSES).optional();
