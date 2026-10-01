"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function PaperAdminActions({ paperId }: { paperId: string }) {
  const router = useRouter();
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  async function moderate(action: string) {
    setLoading(true);
    const res = await fetch(`/api/papers/${paperId}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, details: details || undefined }),
    });
    const payload = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(payload.error || "Moderation failed.");
      return;
    }
    toast.success("Paper updated.");
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this paper and its comments?")) return;
    setLoading(true);
    const res = await fetch(`/api/papers/${paperId}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      const payload = await res.json();
      toast.error(payload.error || "Could not delete paper.");
      return;
    }
    toast.success("Paper deleted.");
    router.push("/admin");
  }

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <h2 className="font-semibold">Admin moderation</h2>
      <Textarea
        value={details}
        onChange={(event) => setDetails(event.target.value)}
        placeholder="Optional note for reject / request changes"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={loading} onClick={() => moderate("approve")}>
          Approve
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => moderate("request-changes")}>
          Request changes
        </Button>
        <Button type="button" size="sm" variant="destructive" disabled={loading} onClick={() => moderate("reject")}>
          Reject
        </Button>
        <Button type="button" size="sm" variant="secondary" disabled={loading} onClick={() => moderate("feature")}>
          Feature
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={loading} onClick={() => moderate("unfeature")}>
          Unfeature
        </Button>
        <Button type="button" size="sm" variant="destructive" disabled={loading} onClick={remove}>
          Delete
        </Button>
      </div>
    </div>
  );
}
