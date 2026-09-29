import { NextRequest } from "next/server";
import mongoose from "mongoose";

export function parseList(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function pagination(request: NextRequest, defaultLimit = 10) {
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get("limit") || defaultLimit)));
  return { page, limit, skip: (page - 1) * limit };
}

export function isObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
