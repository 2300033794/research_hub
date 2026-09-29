import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { paperModerationSchema } from "@/lib/validators";
import { requireAdmin } from "@/lib/require-user";
import { isObjectId } from "@/lib/http";
import { ResearchPaper } from "@/models/ResearchPaper";
import { notify } from "@/lib/notify";
import { logAdminAction } from "@/lib/audit";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireAdmin();
  if ("error" in access) return access.error;
  if (!isObjectId(id)) return jsonError("Invalid paper id.");

  const body = await request.json().catch(() => null);
  const parsed = paperModerationSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid moderation action.", 422);

  await dbConnect();
  const paper = await ResearchPaper.findById(id);
  if (!paper) return jsonError("Paper not found.", 404);

  const { action, details } = parsed.data;
  if (action === "approve") {
    paper.status = "APPROVED";
    paper.rejectionReason = "";
    await notify({
      userId: paper.uploadedBy,
      type: "PAPER_APPROVED",
      message: `Your paper “${paper.title}” was approved and is now public.`,
      relatedPaperId: paper._id,
    });
  } else if (action === "reject") {
    paper.status = "REJECTED";
    paper.rejectionReason = details || "Rejected by administrator.";
    await notify({
      userId: paper.uploadedBy,
      type: "PAPER_REJECTED",
      message: `Your paper “${paper.title}” was rejected.${details ? ` ${details}` : ""}`,
      relatedPaperId: paper._id,
    });
  } else if (action === "request-changes") {
    paper.status = "CHANGES_REQUESTED";
    paper.rejectionReason = details || "Please revise and resubmit.";
    await notify({
      userId: paper.uploadedBy,
      type: "PAPER_CHANGES_REQUESTED",
      message: `Changes were requested for “${paper.title}”.${details ? ` ${details}` : ""}`,
      relatedPaperId: paper._id,
    });
  } else if (action === "feature") {
    paper.isFeatured = true;
  } else if (action === "unfeature") {
    paper.isFeatured = false;
  }

  await paper.save();
  await logAdminAction({
    adminId: access.user._id,
    action: `PAPER_${action.toUpperCase()}`,
    targetPaperId: paper._id,
    details: details || paper.title,
  });

  return jsonOk({ paper });
}
