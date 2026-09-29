import { PaperCard, type PaperCardData } from "@/components/papers/paper-card";
import { Skeleton } from "@/components/ui/skeleton";

export function PaperFeed({ papers }: { papers: PaperCardData[] }) {
  if (!papers.length) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        No research papers match these filters yet.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {papers.map((paper) => (
        <PaperCard key={paper._id} paper={paper} />
      ))}
    </div>
  );
}

export function PaperFeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-3 rounded-xl border p-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}
