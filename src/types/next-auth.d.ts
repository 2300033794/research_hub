import type { AccountStatus, UserRole } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      accountStatus: AccountStatus;
      canPostResearch: boolean;
      isVerified: boolean;
    };
  }

  interface User {
    role?: UserRole;
    accountStatus?: AccountStatus;
    canPostResearch?: boolean;
    isVerified?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    accountStatus?: AccountStatus;
    canPostResearch?: boolean;
    isVerified?: boolean;
  }
}
