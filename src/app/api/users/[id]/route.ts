import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { profileSchema } from "@/lib/validators";
import { requireUser } from "@/lib/require-user";
import { isObjectId } from "@/lib/http";
import { User } from "@/models/User";
import { ResearchPaper } from "@/models/ResearchPaper";
import { Comment } from "@/models/Comment";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!isObjectId(id)) return jsonError("Invalid user id.");
  await dbConnect();
  const user = await User.findById(id).select(
    "name profileImage bio institution researchInterests canPostResearch isVerified accountStatus role createdAt authProviders",
  );
  if (!user) return jsonError("User not found.", 404);
  if (user.accountStatus === "REJECTED") return jsonError("User not found.", 404);

  const [paperCount, commentCount, papers] = await Promise.all([
    ResearchPaper.countDocuments({ uploadedBy: user._id, status: "APPROVED" }),
    Comment.countDocuments({ userId: user._id, isHidden: false }),
    ResearchPaper.find({ uploadedBy: user._id, status: "APPROVED" })
      .sort({ createdAt: -1 })
      .limit(12)
      .select("title category likeCount commentCount createdAt authors")
      .lean(),
  ]);

  return jsonOk({
    user: {
      id: user._id.toString(),
      name: user.name,
      profileImage: user.profileImage,
      bio: user.bio,
      institution: user.institution,
      researchInterests: user.researchInterests,
      canPostResearch: user.canPostResearch,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      role: user.role,
      paperCount,
      commentCount,
    },
    papers,
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireUser();
  if ("error" in access) return access.error;
  if (access.user._id.toString() !== id) {
    return jsonError("You can only update your own profile.", 403);
  }
  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid profile data.", 422);
  await dbConnect();
  Object.assign(access.user, parsed.data);
  await access.user.save();
  return jsonOk({ ok: true });
}
