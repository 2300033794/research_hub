"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Stats = {
  totalUsers: number;
  pendingUsers: number;
  verifiedUsers: number;
  authorizedResearchers: number;
  totalPapers: number;
  pendingPapers: number;
  totalComments: number;
  totalLikes: number;
  totalDislikes: number;
};

type Tab = "users" | "papers" | "comments" | "logs" | "categories";

const USER_ACTIONS = [
  ["approve", "Approve"],
  ["reject", "Reject"],
  ["verify", "Verify"],
  ["suspend", "Suspend"],
  ["restore", "Restore"],
  ["grant-posting", "Grant posting"],
  ["revoke-posting", "Revoke posting"],
  ["delete", "Delete"],
] as const;

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("users");
  const [stats, setStats] = useState<Stats | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [papers, setPapers] = useState<Record<string, unknown>[]>([]);
  const [comments, setComments] = useState<Record<string, unknown>[]>([]);
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [categories, setCategories] = useState<Record<string, unknown>[]>([]);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  const loadUsers = useCallback(async () => {
    const params = new URLSearchParams();
    if (appliedQ) params.set("q", appliedQ);
    if (appliedStatus) params.set("status", appliedStatus);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users || []);
  }, [appliedQ, appliedStatus]);

  const loadPapers = useCallback(async () => {
    const params = new URLSearchParams();
    if (appliedQ) params.set("q", appliedQ);
    if (appliedStatus) params.set("status", appliedStatus);
    const res = await fetch(`/api/admin/papers?${params}`);
    const data = await res.json();
    setPapers(data.items || []);
  }, [appliedQ, appliedStatus]);

  const loadComments = useCallback(async () => {
    const res = await fetch(`/api/admin/comments${appliedStatus === "hidden" ? "?hidden=true" : ""}`);
    const data = await res.json();
    setComments(data.items || []);
  }, [appliedStatus]);

  const loadLogs = useCallback(async () => {
    const res = await fetch("/api/admin/logs");
    const data = await res.json();
    setLogs(data.items || []);
  }, []);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories || []);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (tab === "users") loadUsers();
    if (tab === "papers") loadPapers();
    if (tab === "comments") loadComments();
    if (tab === "logs") loadLogs();
    if (tab === "categories") loadCategories();
  }, [tab, loadUsers, loadPapers, loadComments, loadLogs, loadCategories]);

  async function userAction(id: string, action: string) {
    if (action === "delete" && !confirm("Delete this user and their comments/votes?")) return;
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Action failed.");
      return;
    }
    toast.success("User updated.");
    await Promise.all([loadUsers(), loadStats()]);
  }

  async function paperAction(id: string, action: string) {
    if (action === "delete") {
      const res = await fetch(`/api/papers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Could not delete paper.");
        return;
      }
    } else {
      const res = await fetch(`/api/papers/${id}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Moderation failed.");
        return;
      }
    }
    toast.success("Paper updated.");
    await Promise.all([loadPapers(), loadStats()]);
  }

  async function toggleComment(id: string, hidden: boolean) {
    const res = await fetch(`/api/comments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Could not update comment.");
      return;
    }
    toast.success(hidden ? "Comment hidden." : "Comment restored.");
    await loadComments();
  }

  async function addCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") || ""),
        description: String(form.get("description") || ""),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Could not create category.");
      return;
    }
    event.currentTarget.reset();
    toast.success("Category created.");
    await loadCategories();
  }

  return (
    <div className="space-y-6">
      {stats ? (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            ["Users", stats.totalUsers],
            ["Pending users", stats.pendingUsers],
            ["Researchers", stats.authorizedResearchers],
            ["Pending papers", stats.pendingPapers],
            ["Comments", stats.totalComments],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(["users", "papers", "comments", "logs", "categories"] as Tab[]).map((item) => (
          <Button key={item} size="sm" variant={tab === item ? "default" : "outline"} onClick={() => setTab(item)}>
            {item}
          </Button>
        ))}
      </div>

      {tab === "users" || tab === "papers" || tab === "comments" ? (
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedQ(q);
            setAppliedStatus(status);
          }}
        >
          {tab !== "comments" ? (
            <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search" className="max-w-xs" />
          ) : null}
          <Input
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            placeholder={
              tab === "users"
                ? "PENDING, APPROVED..."
                : tab === "comments"
                  ? "hidden"
                  : "PENDING_REVIEW, APPROVED..."
            }
            className="max-w-xs"
          />
          <Button type="submit" size="sm" variant="outline">
            Apply
          </Button>
        </form>
      ) : null}

      {tab === "users" ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Posting</TableHead>
              <TableHead>Auth</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const id = String(user._id);
              return (
                <TableRow key={id}>
                  <TableCell>
                    <div>
                      <Link href={`/profile/${id}`} className="font-medium underline">
                        {String(user.name)}
                      </Link>
                      <p className="text-xs text-muted-foreground">{String(user.email)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{String(user.accountStatus)}</Badge>
                  </TableCell>
                  <TableCell>{user.canPostResearch ? "Yes" : "No"}</TableCell>
                  <TableCell>{String(user.authMethod || "")}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {USER_ACTIONS.map(([action, label]) => (
                        <Button
                          key={action}
                          type="button"
                          size="xs"
                          variant={action === "delete" ? "destructive" : "outline"}
                          onClick={() => userAction(id, action)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : null}

      {tab === "papers" ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uploader</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {papers.map((paper) => {
              const id = String(paper._id);
              const uploader = paper.uploadedBy as { name?: string; email?: string } | undefined;
              return (
                <TableRow key={id}>
                  <TableCell>
                    <Link href={`/papers/${id}`} className="underline">
                      {String(paper.title)}
                    </Link>
                  </TableCell>
                  <TableCell>{String(paper.status)}</TableCell>
                  <TableCell>
                    {uploader?.name}
                    <p className="text-xs text-muted-foreground">{uploader?.email}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {["approve", "reject", "request-changes", "feature", "unfeature", "delete"].map((action) => (
                        <Button
                          key={action}
                          type="button"
                          size="xs"
                          variant={action === "delete" || action === "reject" ? "destructive" : "outline"}
                          onClick={() => paperAction(id, action)}
                        >
                          {action}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : null}

      {tab === "comments" ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Comment</TableHead>
              <TableHead>Paper</TableHead>
              <TableHead>Hidden</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {comments.map((comment) => {
              const id = String(comment._id);
              const paper = comment.paperId as { _id?: string; title?: string } | undefined;
              const user = comment.userId as { name?: string } | undefined;
              return (
                <TableRow key={id}>
                  <TableCell className="max-w-sm whitespace-normal">
                    <p className="text-xs text-muted-foreground">{user?.name}</p>
                    {String(comment.content)}
                  </TableCell>
                  <TableCell>
                    {paper?._id ? (
                      <Link href={`/papers/${paper._id}`} className="underline">
                        {paper.title}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{comment.isHidden ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => toggleComment(id, !comment.isHidden)}
                    >
                      {comment.isHidden ? "Restore" : "Hide"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : null}

      {tab === "logs" ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const admin = log.adminId as { name?: string } | undefined;
              return (
                <TableRow key={String(log._id)}>
                  <TableCell>{String(log.action)}</TableCell>
                  <TableCell>{admin?.name}</TableCell>
                  <TableCell className="whitespace-normal">{String(log.details || "")}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : null}

      {tab === "categories" ? (
        <div className="space-y-4">
          <form onSubmit={addCategory} className="flex flex-wrap gap-2">
            <Input name="name" placeholder="New category name" required className="max-w-xs" />
            <Input name="description" placeholder="Description" className="max-w-sm" />
            <Button type="submit" size="sm">
              Add
            </Button>
          </form>
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={String(category._id)} className="rounded-lg border px-3 py-2">
                <p className="font-medium">{String(category.name)}</p>
                <p className="text-sm text-muted-foreground">{String(category.description || "")}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
