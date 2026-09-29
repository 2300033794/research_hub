"use client";

import { useSession } from "next-auth/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { accessMessage } from "@/lib/permissions";

export function AccountBanner() {
  const { data } = useSession();
  const message = accessMessage(data?.user);
  if (!data?.user || !message) return null;
  if (data.user.accountStatus === "APPROVED" || data.user.accountStatus === "VERIFIED") return null;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4">
      <Alert>
        <AlertTitle>Account status: {data.user.accountStatus}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  );
}
