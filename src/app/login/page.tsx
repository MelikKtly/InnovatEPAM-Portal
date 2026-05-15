"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LogIn } from "lucide-react";

import { AuthAside } from "@/components/auth-aside";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Sign-in failed");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen">
      <AuthAside />

      <section className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <LogIn className="h-3.5 w-3.5" /> Welcome back
            </span>
            <h1 className="text-3xl font-semibold tracking-tight">
              Sign in to <span className="text-gradient">InnovatEPAM</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Continue tracking and reviewing innovation ideas.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@epam.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link
                className="font-medium text-primary hover:underline"
                href="/register"
              >
                Create one
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
