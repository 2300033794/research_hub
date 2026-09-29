import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { adminUserActionSchema } from "@/lib/validators";
import { requireAdmin } from "@/lib/require-user";
import { isObjectId } from "@/lib/http";
import { User } from "@/models/User";
import { notify } from "@/lib/notify";
import { logAdminAction } from "@/lib/audit";
import { Comment } from "@/models/Comment";
import { Vote } from "@/models/Vote";
import { Notification } from "@/models/Notification";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireAdmin();
  if ("error" in access) return access.error;
  if (!isObjectId(id)) return jsonError("Invalid user id.");
  if (id === access.user._id.toString()) {
    return jsonError("You cannot apply this action to your own admin account.");
  }

  const body = await request.json().catch(() => null);
  const parsed = adminUserActionSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid admin action.", 422);

  await dbConnect();
  const user = await User.findById(id);
  if (!user) return jsonError("User not found.", 404);
  if (user.role === "ADMIN") return jsonError("Admin accounts cannot be modified here.", 403);

  const { action } = parsed.data;
  if (action === "approve") {
    user.accountStatus = "APPROVED";
    await notify({ userId: user._id, type: "ACCOUNT_APPROVED", message: "Your ResearchHub account was approved." });
  } else if (action === "reject") {
    user.accountStatus = "REJECTED";
    user.canPostResearch = false;
    await notify({ userId: user._id, type: "ACCOUNT_REJECTED", message: "Your ResearchHub account was rejected." });
  } else if (action === "verify") {
    user.isVerified = true;
    if (user.accountStatus === "PENDING" || user.accountStatus === "APPROVED") {
      user.accountStatus = "VERIFIED";
    }
    await notify({ userId: user._id, type: "ACCOUNT_VERIFIED", message: "Your ResearchHub account was verified." });
  } else if (action === "suspend") {
    user.accountStatus = "SUSPENDED";
    await notify({ userId: user._id, type: "ACCOUNT_SUSPENDED", message: "Your ResearchHub account was suspended." });
  } else if (action === "restore") {
    user.accountStatus = user.isVerified ? "VERIFIED" : "APPROVED";
    await notify({ userId: user._id, type: "ACCOUNT_APPROVED", message: "Your ResearchHub account was restored." });
  } else if (action === "grant-posting") {
    user.canPostResearch = true;
    await notify({
      userId: user._id,
      type: "POSTING_GRANTED",
      message: "You can now submit research papers for review.",
    });
  } else if (action === "revoke-posting") {
    user.canPostResearch = false;
    await notify({
      userId: user._id,
      type: "POSTING_REVOKED",
      message: "Your research posting permission was revoked.",
    });
  } else if (action === "delete") {
    await Promise.all([
      Comment.deleteMany({ userId: user._id }),
      Vote.deleteMany({ userId: user._id }),
      Notification.deleteMany({ userId: user._id }),
      user.deleteOne(),
      logAdminAction({
        adminId: access.user._id,
        action: "USER_DELETED",
        targetUserId: user._id,
        details: user.email,
      }),
    ]);
    return jsonOk({ ok: true, deleted: true });
  }

  await user.save();
  await logAdminAction({
    adminId: access.user._id,
    action: `USER_${action.toUpperCase()}`,
    targetUserId: user._id,
    details: user.email,
  });
  return jsonOk({ user });
}
