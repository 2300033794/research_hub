import Link from "next/link";
import { PageShell, PageTitle } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dbConnect, hasMongoUri } from "@/lib/db";
import { Category } from "@/models/Category";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = hasMongoUri()
    ? (await dbConnect(), await Category.find({ isActive: true }).sort({ name: 1 }).lean())
    : [];

  return (
    <PageShell>
      <PageTitle title="Research categories" description="Browse papers by field." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link key={category._id.toString()} href={`/?category=${encodeURIComponent(category.name)}`}>
            <Card className="h-full hover:bg-muted/40">
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{category.description || "Explore papers in this field."}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {!categories.length ? (
          <p className="text-sm text-muted-foreground">No categories yet. Run `npm run seed` after configuring MongoDB.</p>
        ) : null}
      </div>
    </PageShell>
  );
}
