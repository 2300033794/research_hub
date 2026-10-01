import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageShell, PageTitle } from "@/components/layout/page-shell";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { isAdmin } from "@/lib/permissions";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const session = await auth();
  if (!isAdmin(session?.user)) redirect("/");

  return (
    <PageShell>
      <PageTitle title="Admin dashboard" description="Approve users, review papers, and moderate discussion." />
      <AdminDashboard />
    </PageShell>
  );
}
