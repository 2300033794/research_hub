import Link from "next/link";
import { PaperFeed } from "@/components/papers/paper-feed";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { fetchPapers, queryString } from "@/lib/app-url";
import { dbConnect, hasMongoUri } from "@/lib/db";
import { Category } from "@/models/Category";
import { cn } from "@/lib/utils";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const categories = hasMongoUri()
    ? (await dbConnect(), await Category.find({ isActive: true }).sort({ name: 1 }).lean())
    : [];
  const data = await fetchPapers(params);
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
          {!hasMongoUri() ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Set <code>MONGODB_URI</code> in <code>.env.local</code> and run <code>npm run seed</code> to load categories and an admin account.
            </p>
          ) : null}
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
              href={`/?${queryString({ ...params, sort: value })}`}
              className={cn(buttonVariants({ variant: sort === value ? "default" : "outline", size: "sm" }))}
            >
              {label}
            </Link>
          ))}
        </div>
        {params.q ? <p className="text-sm text-muted-foreground">Results for &ldquo;{params.q}&rdquo;</p> : null}
        <PaperFeed papers={data.items || []} />
        {data.pages > 1 ? (
          <div className="flex justify-center gap-2">
            {Array.from({ length: data.pages }).map((_, index) => (
              <Link
                key={index}
                href={`/?${queryString({ ...params, page: String(index + 1) })}`}
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
