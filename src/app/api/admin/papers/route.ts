import { NextRequest } from "next/server";
import { FilterQuery } from "mongoose";
import { dbConnect } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdmin } from "@/lib/require-user";
import { pagination } from "@/lib/http";
import { ResearchPaper } from "@/models/ResearchPaper";
import { PAPER_STATUSES } from "@/types";
import type { ResearchPaperDocument } from "@/models/ResearchPaper";

export async function GET(request: NextRequest) {
  const access = await requireAdmin();
  if ("error" in access) return access.error;
  await dbConnect();
  const { page, limit, skip } = pagination(request, 20);
  const status = request.nextUrl.searchParams.get("status") || "";
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  const filter: FilterQuery<ResearchPaperDocument> = {};
  if (status && PAPER_STATUSES.includes(status as (typeof PAPER_STATUSES)[number])) {
    filter.status = status;
  }
  if (q) {
    filter.$or = [{ title: new RegExp(q, "i") }, { authors: new RegExp(q, "i") }, { category: new RegExp(q, "i") }];
  }
  const [items, total] = await Promise.all([
    ResearchPaper.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("uploadedBy", "name email")
      .lean(),
    ResearchPaper.countDocuments(filter),
  ]);
  return jsonOk({ items, total, page, pages: Math.ceil(total / limit) });
}
