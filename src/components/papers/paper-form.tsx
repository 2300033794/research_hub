"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Category = { _id: string; name: string; slug: string };

export function PaperForm({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => undefined);
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setLoading(true);
    const res = await fetch("/api/papers", { method: "POST", body: data });
    const payload = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(payload.error || "Upload failed.");
      return;
    }
    toast.success(isAdmin && data.get("publishNow") === "true" ? "Paper published." : "Paper submitted for review.");
    router.push(payload.paper?._id ? `/papers/${payload.paper._id}` : "/");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Title" name="title" required />
      <div className="space-y-2">
        <Label htmlFor="abstract">Abstract</Label>
        <Textarea id="abstract" name="abstract" required minLength={40} rows={6} />
      </div>
      <Field label="Authors (comma separated)" name="authors" required placeholder="Dr. Ada Lovelace, Dr. Alan Turing" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select id="category" name="category" required className="h-9 w-full rounded-lg border bg-transparent px-2 text-sm">
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category._id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <Field label="Subcategory" name="subcategory" />
        <Field label="Institution / Organization" name="institution" />
        <Field label="Research field" name="researchField" />
        <div className="space-y-2">
          <Label htmlFor="publicationDate">Publication date</Label>
          <Input id="publicationDate" name="publicationDate" type="date" />
        </div>
        <Field label="DOI (optional)" name="doi" />
      </div>
      <Field label="Keywords (comma separated)" name="keywords" placeholder="cancer, imaging, deep learning" />
      <Field label="Tags (comma separated)" name="tags" placeholder="AI, Medical" />
      <div className="space-y-2">
        <Label htmlFor="pdf">Research PDF</Label>
        <Input id="pdf" name="pdf" type="file" accept="application/pdf" required />
        <p className="text-xs text-muted-foreground">PDF only, 20MB maximum. The file is uploaded to Cloudinary from the server.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="thumbnail">Cover image (optional)</Label>
        <Input id="thumbnail" name="thumbnail" type="file" accept="image/*" />
      </div>
      {isAdmin ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="publishNow" value="true" defaultChecked />
          Publish immediately (admin)
        </label>
      ) : (
        <p className="text-sm text-muted-foreground">
          Submissions from authorized researchers are sent to an administrator for review before they appear on the feed.
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Uploading..." : "Submit research paper"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required={required} placeholder={placeholder} />
    </div>
  );
}
