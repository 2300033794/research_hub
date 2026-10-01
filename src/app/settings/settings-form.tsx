"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SettingsForm({
  userId,
  name,
  bio,
  institution,
  researchInterests,
}: {
  userId: string;
  name: string;
  bio: string;
  institution: string;
  researchInterests: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const interests = String(form.get("researchInterests") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    setLoading(true);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") || ""),
        bio: String(form.get("bio") || ""),
        institution: String(form.get("institution") || ""),
        researchInterests: interests,
      }),
    });
    const payload = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(payload.error || "Could not save profile.");
      return;
    }
    toast.success("Profile updated.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={name} required minLength={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="institution">Institution</Label>
        <Input id="institution" name="institution" defaultValue={institution} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={bio} rows={5} maxLength={500} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="researchInterests">Research interests (comma separated)</Label>
        <Input id="researchInterests" name="researchInterests" defaultValue={researchInterests.join(", ")} />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
