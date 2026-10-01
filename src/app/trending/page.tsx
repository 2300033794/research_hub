import { PageShell, PageTitle } from "@/components/layout/page-shell";
import { PaperFeed } from "@/components/papers/paper-feed";
import { fetchPapers } from "@/lib/app-url";

export const metadata = { title: "Trending" };

export default async function TrendingPage() {
  const [liked, viewed, featured] = await Promise.all([
    fetchPapers({ sort: "liked", limit: "8" }),
    fetchPapers({ sort: "viewed", limit: "8" }),
    fetchPapers({ featured: "true", limit: "6" }),
  ]);

  return (
    <PageShell className="space-y-10">
      <PageTitle title="Trending research" description="Most liked, most viewed, and featured papers." />
      {featured.items?.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Featured</h2>
          <PaperFeed papers={featured.items} />
        </section>
      ) : null}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Most liked</h2>
        <PaperFeed papers={liked.items || []} />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Most viewed</h2>
        <PaperFeed papers={viewed.items || []} />
      </section>
    </PageShell>
  );
}
