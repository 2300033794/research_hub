"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Bell, FlaskConical, Menu, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { initials } from "@/lib/format";
import { canPostPaper } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/categories", label: "Categories" },
  { href: "/trending", label: "Trending" },
  { href: "/researchers", label: "Researchers" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [unread, setUnread] = useState(0);
  const user = session?.user;
  const canSubmit = canPostPaper(user);

  useEffect(() => {
    if (!user) return;
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => setUnread(data.unread || 0))
      .catch(() => undefined);
  }, [user]);

  function onSearch(event: React.FormEvent) {
    event.preventDefault();
    const next = query.trim();
    router.push(next ? `/?q=${encodeURIComponent(next)}` : "/");
  }

  const links = (
    <nav className="flex flex-col gap-1 md:flex-row md:items-center md:gap-1">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
            pathname === item.href && "bg-muted text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Sheet>
          <SheetTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "md:hidden")}>
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-4">
            <Link href="/" className="mb-6 flex items-center gap-2 font-semibold">
              <FlaskConical className="size-5 text-primary" />
              ResearchHub
            </Link>
            {links}
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FlaskConical className="size-4" />
          </span>
          <span className="hidden sm:inline">ResearchHub</span>
        </Link>

        <div className="hidden md:block">{links}</div>

        <form onSubmit={onSearch} className="relative ml-auto hidden min-w-48 flex-1 max-w-md md:block">
          <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search papers, authors, keywords..."
            className="pl-8"
          />
        </form>

        <ThemeToggle />

        {user ? (
          <>
            <Link href="/notifications" className="relative">
              <Button type="button" variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="size-4" />
              </Button>
              {unread > 0 ? (
                <span className="absolute top-1 right-1 size-2 rounded-full bg-destructive" />
              ) : null}
            </Link>
            {canSubmit ? (
              <Link href="/submit" className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}>
                Submit paper
              </Link>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full outline-none">
                <Avatar className="size-8">
                  <AvatarImage src={user.image || ""} alt={user.name || ""} />
                  <AvatarFallback>{initials(user.name)}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/profile/${user.id}`)}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/notifications")}>Notifications</DropdownMenuItem>
                {user.role === "ADMIN" ? (
                  <DropdownMenuItem onClick={() => router.push("/admin")}>Admin dashboard</DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Log in
            </Link>
            <Link href="/register" className={buttonVariants({ size: "sm" })}>
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
