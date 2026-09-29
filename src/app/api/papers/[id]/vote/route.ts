import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { voteSchema } from "@/lib/validators";
import { requireCommunityUser } from "@/lib/require-user";
import { isObjectId, clientIp } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { ResearchPaper } from "@/models/ResearchPaper";
import { Vote } from "@/models/Vote";

type RouteContext = { params: Promise<{ id: string }> };

async function recount(paperId: string) {
  const [likeCount, dislikeCount] = await Promise.all([
    Vote.countDocuments({ paperId, type: "LIKE" }),
    Vote.countDocuments({ paperId, type: "DISLIKE" }),
  ]);
  await ResearchPaper.findByIdAndUpdate(paperId, { likeCount, dislikeCount });
  return { likeCount, dislikeCount };
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const limited = rateLimit(`vote:${clientIp(request)}`, 40, 60 * 1000);
  if (!limited.ok) return jsonError("You are voting too quickly.", 429);

  const access = await requireCommunityUser();
  if ("error" in access) return access.error;
  if (!isObjectId(id)) return jsonError("Invalid paper id.");

  const body = await request.json().catch(() => null);
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) return jsonError("Vote type must be LIKE, DISLIKE, or null.");

  await dbConnect();
  const paper = await ResearchPaper.findOne({ _id: id, status: "APPROVED" });
  if (!paper) return jsonError("Paper not found.", 404);

  const existing = await Vote.findOne({ userId: access.user._id, paperId: paper._id });

  if (parsed.data.type === null) {
    if (existing) await existing.deleteOne();
  } else if (!existing) {
    await Vote.create({
      userId: access.user._id,
      paperId: paper._id,
      type: parsed.data.type,
    });
  } else if (existing.type === parsed.data.type) {
    await existing.deleteOne();
  } else {
    existing.type = parsed.data.type;
    await existing.save();
  }

  const counts = await recount(paper._id.toString());
  const current = await Vote.findOne({ userId: access.user._id, paperId: paper._id });
  return jsonOk({ vote: current?.type ?? null, ...counts });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireCommunityUser();
  if ("error" in access) return jsonOk({ vote: null });
  if (!isObjectId(id)) return jsonError("Invalid paper id.");
  await dbConnect();
  const vote = await Vote.findOne({ userId: access.user._id, paperId: id });
  return jsonOk({ vote: vote?.type ?? null });
}
