import Link from "next/link";
import { PageShell, PageTitle } from "@/components/layout/page-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appUrl } from "@/lib/app-url";
import { initials } from "@/lib/format";

export const metadata = { title: "Researchers" };

type Researcher = {
  _id: string;
  name: string;
  profileImage?: string;
  bio?: string;
  institution?: string;
  isVerified?: boolean;
  paperCount?: number;
};

export default async function ResearchersPage() {
  const res = await fetch(`${appUrl()}/api/researchers`, { cache: "no-store" });
  const data = res.ok ? await res.json() : { researchers: [] };
  const researchers: Researcher[] = data.researchers || [];

  return (
    <PageShell>
      <PageTitle
        title="Researchers"
        description="People who have been granted permission to submit papers."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {researchers.map((person) => (
          <Link key={person._id} href={`/profile/${person._id}`}>
            <Card className="h-full hover:bg-muted/40">
              <CardHeader className="flex-row items-center gap-3">
                <Avatar>
                  <AvatarImage src={person.profileImage || ""} alt={person.name} />
                  <AvatarFallback>{initials(person.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{person.name}</CardTitle>
                  {person.institution ? (
                    <p className="text-xs text-muted-foreground">{person.institution}</p>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {person.isVerified ? <Badge variant="secondary">Verified</Badge> : null}
                <p className="line-clamp-3 text-sm text-muted-foreground">{person.bio || "No bio yet."}</p>
                <p className="text-xs text-muted-foreground">{person.paperCount || 0} public papers</p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {!researchers.length ? (
          <p className="text-sm text-muted-foreground">No authorized researchers yet.</p>
        ) : null}
      </div>
    </PageShell>
  );
}
