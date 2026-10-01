import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageShell, PageTitle } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  await dbConnect();
  const user = await User.findById(session.user.id).lean();
  if (!user) redirect("/login");

  return (
    <PageShell className="max-w-3xl space-y-6">
      <PageTitle title="Profile settings" description="Update how other researchers see you on ResearchHub." />
      <div className="flex flex-wrap gap-2 text-sm">
        <Badge variant="secondary">{user.accountStatus}</Badge>
        {user.canPostResearch ? <Badge>Can submit papers</Badge> : <Badge variant="outline">Cannot submit papers</Badge>}
        {user.isVerified ? <Badge variant="outline">Verified</Badge> : null}
      </div>
      <SettingsForm
        userId={user._id.toString()}
        name={user.name}
        bio={user.bio || ""}
        institution={user.institution || ""}
        researchInterests={user.researchInterests || []}
      />
    </PageShell>
  );
}
