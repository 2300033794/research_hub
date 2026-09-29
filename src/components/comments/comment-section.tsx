"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { canUseCommunity } from "@/lib/permissions";
import { timeAgo } from "@/lib/format";
import Link from "next/link";

type CommentUser = { _id: string; name: string; profileImage?: string; canPostResearch?: boolean };
type CommentNode = {
  _id: string;
  content: string;
  createdAt: string;
  likeCount: number;
  parentCommentId?: string | null;
  userId: CommentUser;
};

export function CommentSection({ paperId }: { paperId: string }) {
  const { data } = useSession();
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const allowed = canUseCommunity(data?.user);

  async function load() {
    const res = await fetch(`/api/papers/${paperId}/comments`);
    const payload = await res.json();
    setComments(payload.comments || []);
  }

  useEffect(() => {
    load();
  }, [paperId]);

  async function submit() {
    if (!allowed) {
      toast.error("Your account must be approved before commenting.");
      return;
    }
    const res = await fetch(`/api/papers/${paperId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, parentCommentId: replyTo }),
    });
    const payload = await res.json();
    if (!res.ok) {
      toast.error(payload.error || "Could not post comment.");
      return;
    }
    setContent("");
    setReplyTo(null);
    await load();
  }

  async function saveEdit(id: string, next: string) {
    const res = await fetch(`/api/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: next }),
    });
    if (!res.ok) {
      const payload = await res.json();
      toast.error(payload.error || "Could not edit comment.");
      return;
    }
    setEditing(null);
    await load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const payload = await res.json();
      toast.error(payload.error || "Could not delete comment.");
      return;
    }
    await load();
  }

  async function like(id: string) {
    await fetch(`/api/comments/${id}/like`, { method: "POST" });
    await load();
  }

  const roots = comments.filter((comment) => !comment.parentCommentId);
  const repliesOf = (id: string) => comments.filter((comment) => String(comment.parentCommentId) === id);

  function Thread({ comment, depth = 0 }: { comment: CommentNode; depth?: number }) {
    const mine = data?.user?.id === comment.userId?._id;
    return (
      <div className={depth ? "ml-6 border-l pl-4" : ""}>
        <div className="rounded-lg py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/profile/${comment.userId?._id}`} className="font-medium hover:underline">
              {comment.userId?.name}
            </Link>
            {comment.userId?.canPostResearch ? (
              <span className="text-xs text-primary">Research Contributor</span>
            ) : null}
            <span className="text-muted-foreground">{timeAgo(comment.createdAt)}</span>
          </div>
          {editing === comment._id ? (
            <EditForm
              initial={comment.content}
              onCancel={() => setEditing(null)}
              onSave={(value) => saveEdit(comment._id, value)}
            />
          ) : (
            <p className="mt-1 text-sm leading-6">{comment.content}</p>
          )}
          <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
            <button type="button" onClick={() => like(comment._id)}>
              Like {comment.likeCount || 0}
            </button>
            <button type="button" onClick={() => setReplyTo(comment._id)}>
              Reply
            </button>
            {mine ? (
              <>
                <button type="button" onClick={() => setEditing(comment._id)}>
                  Edit
                </button>
                <button type="button" onClick={() => remove(comment._id)}>
                  Delete
                </button>
              </>
            ) : null}
          </div>
        </div>
        {repliesOf(comment._id).map((reply) => (
          <Thread key={reply._id} comment={reply} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Discussion</h2>
      {data?.user ? (
        <div className="space-y-2">
          {replyTo ? (
            <p className="text-xs text-muted-foreground">
              Replying to a comment.{" "}
              <button type="button" className="underline" onClick={() => setReplyTo(null)}>
                Cancel
              </button>
            </p>
          ) : null}
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Share methodology questions, limitations, or ideas for future work..."
          />
          <Button type="button" onClick={submit} disabled={!content.trim()}>
            Post comment
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sign in to join the discussion.</p>
      )}
      <div className="divide-y">
        {roots.map((comment) => (
          <Thread key={comment._id} comment={comment} />
        ))}
        {!roots.length ? <p className="text-sm text-muted-foreground">No comments yet. Start the scientific discussion.</p> : null}
      </div>
    </section>
  );
}

function EditForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <div className="mt-2 space-y-2">
      <Textarea value={value} onChange={(event) => setValue(event.target.value)} />
      <div className="flex gap-2">
        <Button size="sm" type="button" onClick={() => onSave(value)}>
          Save
        </Button>
        <Button size="sm" type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
