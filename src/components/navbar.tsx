"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, PlusCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NavbarUser = {
  email: string;
  role: "submitter" | "admin";
};

function initials(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/).filter(Boolean);
  const letters =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`
      : local.slice(0, 2) || "U";
  return letters.toUpperCase();
}

export function Navbar({ user }: { user: NavbarUser | null }) {
  const router = useRouter();
  const pathname = usePathname();

  async function onSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const links =
    user?.role === "admin"
      ? [{ href: "/admin", label: "Admin Dashboard", icon: LayoutDashboard }]
      : user
        ? [
            { href: "/submit", label: "Submit Idea", icon: PlusCircle },
            { href: "/ideas", label: "My Ideas", icon: LayoutDashboard },
          ]
        : [];

  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-5xl items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/70 px-4 py-2.5 shadow-[0_8px_40px_-12px_rgba(15,23,42,0.25)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/5 dark:bg-slate-950/60">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-[linear-gradient(120deg,#4f46e5,#a855f7,#ec4899)] text-white shadow-md shadow-indigo-500/30">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            InnovatEPAM
          </span>
        </Link>

        {links.length > 0 ? (
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((l) => {
              const Icon = l.icon;
              const active =
                pathname === l.href || pathname.startsWith(`${l.href}/`);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition-all",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6366f1,#a855f7)] text-xs font-semibold text-white shadow-sm">
                  {initials(user.email)}
                </div>
                <div className="text-right leading-tight">
                  <p className="text-xs font-medium">{user.email}</p>
                  {user.role === "admin" ? (
                    <p className="text-[10px] uppercase tracking-wider text-primary">
                      Admin
                    </p>
                  ) : null}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onSignOut}
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" variant="gradient">
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
