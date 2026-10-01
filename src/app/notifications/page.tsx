import { PageShell, PageTitle } from "@/components/layout/page-shell";
import { NotificationsList } from "./notifications-list";

export const metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <PageShell className="max-w-3xl">
      <PageTitle title="Notifications" description="Account, paper review, and discussion updates." />
      <NotificationsList />
    </PageShell>
  );
}
