import { PageShell, PageTitle } from "@/components/layout/page-shell";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <PageShell>
      <PageTitle title="Admin dashboard" description="Approve users, review papers, and moderate discussion." />
      <AdminDashboard />
    </PageShell>
  );
}
