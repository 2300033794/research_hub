import Link from "next/link";
import { PaperFeed } from "@/components/papers/paper-feed";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { dbConnect } from "@/lib/db";
import { Category } from "@/models/Category";
import { cn } from "@/lib/utils";

async function getPapers(searchParams: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value) query.set(key, value);
  }
  const base = process.env.AUTH_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/papers?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) return { items: [], page: 1, pages: 1, total: 0 };
  return res.json();
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  await dbConnect();
  const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
  const data = await getPapers(params);
  const sort = params.sort || "latest";

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-4">
        <div>
          <h2 className="mb-2 text-sm font-semibold">Categories</h2>
          <div className="flex flex-wrap gap-2 lg:flex-col">
            <Link href="/" className={cn(!params.category && "font-semibold")}>
              All fields
            </Link>
            {categories.map((category) => (
              <Link
                key={category._id.toString()}
                href={`/?category=${encodeURIComponent(category.name)}`}
                className={cn(
                  "text-sm text-muted-foreground hover:text-foreground",
                  params.category === category.name && "font-semibold text-foreground",
                )}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </aside>
      <section className="space-y-4">
        <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-transparent p-6">
          <Badge variant="secondary">Reddit for research papers</Badge>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight">Discover, discuss, and review scientific work.</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Browse peer-shared PDFs, vote on impact, and leave methodology-focused comments. Posting is reserved for admin-approved researchers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ["latest", "Latest"],
            ["liked", "Most liked"],
            ["discussed", "Most discussed"],
            ["viewed", "Most viewed"],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={`/?${new URLSearchParams({ ...params, sort: value }).toString()}`}
              className={cn(buttonVariants({ variant: sort === value ? "default" : "outline", size: "sm" }))}
            >
              {label}
            </Link>
          ))}
        </div>
        {params.q ? <p className="text-sm text-muted-foreground">Results for “{params.q}”</p> : null}
        <PaperFeed papers={data.items || []} />
        {data.pages > 1 ? (
          <div className="flex justify-center gap-2">
            {Array.from({ length: data.pages }).map((_, index) => (
              <Link
                key={index}
                href={`/?${new URLSearchParams({ ...params, page: String(index + 1) }).toString()}`}
                className={cn(buttonVariants({ variant: data.page === index + 1 ? "default" : "outline", size: "sm" }))}
              >
                {index + 1}
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
