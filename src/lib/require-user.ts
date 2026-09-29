import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { jsonError } from "@/lib/api-response";
import { canPostPaper, canUseCommunity, isAdmin } from "@/lib/permissions";
import { User } from "@/models/User";
import type { UserDocument } from "@/models/User";

export async function requireUser(): Promise<
  { user: UserDocument } | { error: ReturnType<typeof jsonError> }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: jsonError("Sign in required.", 401) };
  }
  await dbConnect();
  const user = await User.findById(session.user.id);
  if (!user) {
    return { error: jsonError("Account not found.", 401) };
  }
  return { user };
}

export async function requireCommunityUser() {
  const result = await requireUser();
  if ("error" in result) return result;
  if (!canUseCommunity(result.user)) {
    return {
      error: jsonError(
        result.user.accountStatus === "PENDING"
          ? "Your account is pending admin approval."
          : "You cannot perform this action with the current account status.",
        403,
      ),
    };
  }
  return result;
}

export async function requirePoster() {
  const result = await requireUser();
  if ("error" in result) return result;
  if (!canPostPaper(result.user)) {
    return {
      error: jsonError(
        "You do not have permission to upload research papers. An administrator must grant posting permission.",
        403,
      ),
    };
  }
  return result;
}

export async function requireAdmin() {
  const result = await requireUser();
  if ("error" in result) return result;
  if (!isAdmin(result.user)) {
    return { error: jsonError("Admin access required.", 403) };
  }
  return result;
}
