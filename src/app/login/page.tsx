import { Suspense } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { LoginForm } from "./login-form";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <PageShell className="flex min-h-[60vh] items-center">
      <Suspense>
        <LoginForm />
      </Suspense>
    </PageShell>
  );
}
