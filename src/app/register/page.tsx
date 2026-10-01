import { PageShell } from "@/components/layout/page-shell";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Sign up" };

export default function RegisterPage() {
  return (
    <PageShell className="flex min-h-[60vh] items-center">
      <RegisterForm />
    </PageShell>
  );
}
