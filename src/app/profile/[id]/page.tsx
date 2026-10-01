import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { PageShell } from "@/components/layout/page-shell";
import { PaperFeed } from "@/components/papers/paper-feed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { dbConnect } from "@/lib/db";
import { initials, prettyDate } from "@/lib/format";
import { isObjectId } from "@/lib/http";
import { isAdmin } from "@/lib/permissions";
import { ResearchPaper } from "@/models/ResearchPaper";
import { User } from "@/models/User";
import { Comment } from "@/models/Comment";
import type { PaperCardData } from "@/components/papers/paper-card";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await dbConnect();
  const user = await User.findById(id).select("name").lean();
  return { title: user?.name || "Profile" };
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isObjectId(id)) notFound();
  const session = await auth();
  await dbConnect();
  const user = await User.findById(id)
    .select("name profileImage bio institution researchInterests canPostResearch isVerified accountStatus role createdAt")
    .lean();
  if (!user || user.accountStatus === "REJECTED") notFound();

  const viewerIsOwner = session?.user?.id === id;
  const viewerIsAdmin = isAdmin(session?.user);
  const paperFilter =
    viewerIsOwner || viewerIsAdmin
      ? { uploadedBy: user._id }
      : { uploadedBy: user._id, status: "APPROVED" as const };

  const [papers, paperCount, commentCount] = await Promise.all([
    ResearchPaper.find(paperFilter).sort({ createdAt: -1 }).limit(20).lean(),
    ResearchPaper.countDocuments({ uploadedBy: user._id, status: "APPROVED" }),
    Comment.countDocuments({ userId: user._id, isHidden: false }),
  ]);

  return (
    <PageShell className="max-w-4xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar size="lg" className="size-16">
          <AvatarImage src={user.profileImage || ""} alt={user.name} />
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-3xl font-semibold">{user.name}</h1>
            {user.canPostResearch ? <Badge>Research Contributor</Badge> : null}
            {user.isVerified ? <Badge variant="secondary">Verified</Badge> : null}
            {user.role === "ADMIN" ? <Badge variant="outline">Admin</Badge> : null}
          </div>
          {user.institution ? <p className="text-muted-foreground">{user.institution}</p> : null}
          {user.bio ? <p className="max-w-2xl leading-6">{user.bio}</p> : null}
          <p className="text-sm text-muted-foreground">
            Joined {prettyDate(user.createdAt)} · {paperCount} papers · {commentCount} comments
          </p>
          {viewerIsOwner ? (
            <Link href="/settings" className="text-sm underline">
              Edit profile
            </Link>
          ) : null}
          {(user.researchInterests || []).length ? (
            <div className="flex flex-wrap gap-1">
              {user.researchInterests.map((interest) => (
                <Badge key={interest} variant="outline">
                  {interest}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Papers</h2>
        <PaperFeed papers={papers as unknown as PaperCardData[]} />
      </section>
    </PageShell>
  );
}
