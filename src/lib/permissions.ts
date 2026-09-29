import type { AccountStatus, UserRole } from "@/types";

export type PermissionUser = {
  role: UserRole;
  accountStatus: AccountStatus;
  canPostResearch: boolean;
  isVerified?: boolean;
} | null | undefined;

export function isAdmin(user: PermissionUser) {
  return user?.role === "ADMIN";
}

export function isSuspended(user: PermissionUser) {
  return user?.accountStatus === "SUSPENDED";
}

export function canUseCommunity(user: PermissionUser) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (isSuspended(user) || user.accountStatus === "REJECTED" || user.accountStatus === "PENDING") {
    return false;
  }
  return user.accountStatus === "APPROVED" || user.accountStatus === "VERIFIED";
}

export function canPostPaper(user: PermissionUser) {
  if (!user) return false;
  if (isAdmin(user) && !isSuspended(user) && user.accountStatus !== "REJECTED") return true;
  if (!canUseCommunity(user)) return false;
  return user.role === "USER" && user.canPostResearch === true;
}

export function accessMessage(user: PermissionUser) {
  if (!user) return "Sign in to continue.";
  if (user.accountStatus === "PENDING") {
    return "Your account is pending admin approval. You can browse papers, but community actions are locked.";
  }
  if (user.accountStatus === "REJECTED") {
    return "This account was rejected by an administrator.";
  }
  if (user.accountStatus === "SUSPENDED") {
    return "This account is suspended and cannot interact with the platform.";
  }
  return null;
}
