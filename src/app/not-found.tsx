import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <PageShell className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="font-heading text-3xl font-semibold">Page not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        That route does not exist, or the paper is not public yet.
      </p>
      <Link href="/" className={cn(buttonVariants(), "mt-6")}>
        Back to the feed
      </Link>
    </PageShell>
  );
}
