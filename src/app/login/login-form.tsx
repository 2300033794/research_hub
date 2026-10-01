"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const ERRORS: Record<string, string> = {
  CredentialsSignin: "Invalid email or password.",
  rejected: "This account was rejected by an administrator.",
  AccessDenied: "Sign-in was denied.",
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const callbackUrl = params.get("callbackUrl") || "/";
  const error = params.get("error");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    const result = await signIn("credentials", {
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      toast.error(ERRORS[result.error] || "Could not sign in.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Log in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/register" className="text-foreground underline">
            Create an account
          </Link>
        </p>
      </div>
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {ERRORS[error] || "Sign-in failed. Try again."}
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <button
        type="button"
        className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        onClick={() => signIn("google", { callbackUrl })}
      >
        Continue with Google
      </button>
    </div>
  );
}
