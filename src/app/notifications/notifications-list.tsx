"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";

type Item = {
  _id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedPaperId?: string | null;
};

export function NotificationsList() {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);

  async function load() {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setItems(data.items || []);
    setUnread(data.unread || 0);
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead() {
    const res = await fetch("/api/notifications", { method: "PATCH" });
    if (!res.ok) {
      toast.error("Could not mark notifications as read.");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{unread} unread</p>
        <Button type="button" size="sm" variant="outline" onClick={markRead} disabled={!unread}>
          Mark all as read
        </Button>
      </div>
      <div className="divide-y rounded-xl border">
        {items.map((item) => (
          <div key={item._id} className={item.isRead ? "p-4" : "bg-primary/5 p-4"}>
            <p className="text-sm">{item.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.type.replaceAll("_", " ")} · {timeAgo(item.createdAt)}
            </p>
            {item.relatedPaperId ? (
              <Link href={`/papers/${item.relatedPaperId}`} className="mt-2 inline-block text-xs underline">
                Open paper
              </Link>
            ) : null}
          </div>
        ))}
        {!items.length ? <p className="p-6 text-sm text-muted-foreground">No notifications yet.</p> : null}
      </div>
    </div>
  );
}
