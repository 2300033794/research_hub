"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { canUseCommunity } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export function VoteButtons({
  paperId,
  likeCount,
  dislikeCount,
  initialVote,
}: {
  paperId: string;
  likeCount: number;
  dislikeCount: number;
  initialVote?: "LIKE" | "DISLIKE" | null;
}) {
  const { data } = useSession();
  const [vote, setVote] = useState<"LIKE" | "DISLIKE" | null>(initialVote ?? null);
  const [likes, setLikes] = useState(likeCount);
  const [dislikes, setDislikes] = useState(dislikeCount);
  const allowed = canUseCommunity(data?.user);

  async function send(next: "LIKE" | "DISLIKE" | null) {
    if (!data?.user) {
      toast.error("Sign in to vote.");
      return;
    }
    if (!allowed) {
      toast.error("Your account must be approved before you can vote.");
      return;
    }
    const type = vote === next ? null : next;
    const res = await fetch(`/api/papers/${paperId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    const payload = await res.json();
    if (!res.ok) {
      toast.error(payload.error || "Could not save vote.");
      return;
    }
    setVote(payload.vote);
    setLikes(payload.likeCount);
    setDislikes(payload.dislikeCount);
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(vote === "LIKE" && "text-primary")}
        onClick={() => send("LIKE")}
      >
        <ThumbsUp className="size-4" />
        {likes}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(vote === "DISLIKE" && "text-destructive")}
        onClick={() => send("DISLIKE")}
      >
        <ThumbsDown className="size-4" />
        {dislikes}
      </Button>
    </div>
  );
}
