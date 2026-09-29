import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { VoteButtons } from "@/components/papers/vote-buttons";
import { prettyDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PaperCardData = {
  _id: string;
  title: string;
  abstract: string;
  authors: string[];
  category: string;
  tags?: string[];
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  createdAt: string;
  publicationDate?: string | null;
  thumbnailUrl?: string;
  uploadedBy?: { _id: string; name: string } | string;
  isFeatured?: boolean;
};

export function PaperCard({ paper }: { paper: PaperCardData }) {
  const poster =
    typeof paper.uploadedBy === "object" && paper.uploadedBy
      ? paper.uploadedBy.name
      : "Researcher";
  const posterId =
    typeof paper.uploadedBy === "object" && paper.uploadedBy ? paper.uploadedBy._id : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{paper.category}</Badge>
          {paper.isFeatured ? <Badge>Featured</Badge> : null}
        </div>
        <Link href={`/papers/${paper._id}`} className="font-heading text-xl font-semibold leading-tight hover:underline">
          {paper.title}
        </Link>
        <p className="text-sm text-muted-foreground">
          Author{paper.authors.length > 1 ? "s" : ""}: {paper.authors.join(", ")} · Posted by{" "}
          {posterId ? (
            <Link href={`/profile/${posterId}`} className="underline-offset-2 hover:underline">
              {poster}
            </Link>
          ) : (
            poster
          )}{" "}
          · {prettyDate(paper.publicationDate || paper.createdAt)}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">{paper.abstract.slice(0, 280)}{paper.abstract.length > 280 ? "…" : ""}</p>
        <div className="flex flex-wrap gap-1">
          {(paper.tags || []).slice(0, 6).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <VoteButtons
              paperId={paper._id}
              likeCount={paper.likeCount}
              dislikeCount={paper.dislikeCount}
            />
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <MessageSquare className="size-4" />
              {paper.commentCount}
            </span>
          </div>
          <div className="flex gap-2">
            <Link href={`/papers/${paper._id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              View comments
            </Link>
            <Link href={`/papers/${paper._id}#pdf`} className={cn(buttonVariants({ size: "sm" }))}>
              Read paper
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
