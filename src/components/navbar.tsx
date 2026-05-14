"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export type NavbarUser = {
  email: string;
  role: "submitter" | "admin";
};

export function Navbar({ user }: { user: NavbarUser | null }) {
  const router = useRouter();

  async function onSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold">
            InnovatEPAM
          </Link>
          {user ? (
            <nav className="hidden gap-3 text-sm text-muted-foreground sm:flex">
              <Link href="/ideas" className="hover:text-foreground">
                Ideas
              </Link>
              <Link href="/submit" className="hover:text-foreground">
                Submit
              </Link>
            </nav>
          ) : null}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden text-muted-foreground sm:inline">
                {user.email}
                {user.role === "admin" ? " (admin)" : ""}
              </span>
              <Button variant="outline" size="sm" onClick={onSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
