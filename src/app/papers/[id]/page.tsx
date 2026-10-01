import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { CommentSection } from "@/components/comments/comment-section";
import { PageShell } from "@/components/layout/page-shell";
import { PaperAdminActions } from "@/components/papers/paper-admin-actions";
import { PaperFeed } from "@/components/papers/paper-feed";
import { VoteButtons } from "@/components/papers/vote-buttons";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { dbConnect } from "@/lib/db";
import { prettyDate } from "@/lib/format";
import { isAdmin } from "@/lib/permissions";
import { ResearchPaper } from "@/models/ResearchPaper";
import { isObjectId } from "@/lib/http";
import type { PaperCardData } from "@/components/papers/paper-card";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await dbConnect();
  const paper = await ResearchPaper.findById(id).select("title").lean();
  return { title: paper?.title || "Paper" };
}

export default async function PaperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isObjectId(id)) notFound();

  const session = await auth();
  await dbConnect();
  const paper = await ResearchPaper.findById(id)
    .populate("uploadedBy", "name profileImage bio institution canPostResearch isVerified")
    .lean();
  if (!paper) notFound();

  const uploader = paper.uploadedBy as unknown as { _id: { toString(): string }; name: string } | null;
  const owner = session?.user?.id && uploader?._id?.toString() === session.user.id;
  const admin = isAdmin(session?.user);
  const visible = paper.status === "APPROVED" || owner || admin;
  if (!visible) notFound();

  if (paper.status === "APPROVED") {
    await ResearchPaper.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
  }

  const related = (await ResearchPaper.find({
    _id: { $ne: paper._id },
    status: "APPROVED",
    $or: [{ category: paper.category }, { tags: { $in: paper.tags || [] } }],
  })
    .sort({ likeCount: -1, createdAt: -1 })
    .limit(4)
    .populate("uploadedBy", "name")
    .lean()) as unknown as PaperCardData[];

  return (
    <PageShell className="max-w-5xl space-y-8">
      {paper.status !== "APPROVED" ? (
        <Alert>
          <AlertTitle>Status: {paper.status.replaceAll("_", " ")}</AlertTitle>
          <AlertDescription>
            {paper.rejectionReason || "This paper is not public yet. Only you and administrators can view it."}
          </AlertDescription>
        </Alert>
      ) : null}

      <article className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{paper.category}</Badge>
          {paper.isFeatured ? <Badge>Featured</Badge> : null}
          {paper.researchField ? <Badge variant="outline">{paper.researchField}</Badge> : null}
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">{paper.title}</h1>
        <p className="text-sm text-muted-foreground">
          {paper.authors.join(", ")}
          {uploader ? (
            <>
              {" · Posted by "}
              <Link href={`/profile/${uploader._id.toString()}`} className="underline">
                {uploader.name}
              </Link>
            </>
          ) : null}
          {" · "}
          {prettyDate(paper.publicationDate || paper.createdAt)}
          {paper.doi ? (
            <>
              {" · DOI "}
              <span className="font-mono text-xs">{paper.doi}</span>
            </>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-1">
          {(paper.tags || []).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
        <VoteButtons paperId={id} likeCount={paper.likeCount} dislikeCount={paper.dislikeCount} />
        <p className="leading-7">{paper.abstract}</p>
        {(paper.keywords || []).length ? (
          <p className="text-sm text-muted-foreground">Keywords: {paper.keywords.join(", ")}</p>
        ) : null}
      </article>

      {admin ? <PaperAdminActions paperId={id} /> : null}

      <section id="pdf" className="space-y-3">
        <h2 className="text-lg font-semibold">Full paper</h2>
        <div className="overflow-hidden rounded-xl border">
          <iframe title={paper.title} src={paper.fileUrl} className="h-[80vh] w-full bg-muted" />
        </div>
        <a href={paper.fileUrl} target="_blank" rel="noreferrer" className="text-sm underline">
          Open PDF in a new tab
        </a>
      </section>

      <CommentSection paperId={id} />

      {related.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Related papers</h2>
          <PaperFeed papers={related} />
        </section>
      ) : null}
    </PageShell>
  );
}
