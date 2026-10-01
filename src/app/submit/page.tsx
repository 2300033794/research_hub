import Link from "next/link";
import { auth } from "@/auth";
import { PageShell, PageTitle } from "@/components/layout/page-shell";
import { PaperForm } from "@/components/papers/paper-form";
import { buttonVariants } from "@/components/ui/button";
import { canPostPaper } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export const metadata = { title: "Submit paper" };

export default async function SubmitPage() {
  const session = await auth();
  const user = session?.user;
  const allowed = canPostPaper(user);

  return (
    <PageShell className="max-w-3xl">
      <PageTitle
        title="Submit a research paper"
        description="Upload a PDF and metadata. Authorized researchers send work for admin review; admins can publish immediately."
      />
      {allowed ? (
        <PaperForm isAdmin={user?.role === "ADMIN"} />
      ) : (
        <div className="rounded-xl border p-6 text-sm text-muted-foreground">
          <p>
            Posting is limited to administrators and users who have been granted research-posting permission.
            Ask an admin after your account is approved.
          </p>
          <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}>
            Back to feed
          </Link>
        </div>
      )}
    </PageShell>
  );
}
