import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, Inbox, Sparkles } from "lucide-react";

import { IdeaCard } from "@/components/idea-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDb, type IdeaStatus, type IdeaWithSubmitter } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

function statCounts(rows: { status: IdeaStatus }[]) {
  const acc: Record<IdeaStatus, number> = {
    submitted: 0,
    "under review": 0,
    accepted: 0,
    rejected: 0,
  };
  for (const r of rows) acc[r.status] += 1;
  return acc;
}

export default async function IdeasListPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/ideas");

  const db = getDb();
  const ideas =
    user.role === "admin"
      ? (db
          .prepare(
            `SELECT i.*, u.email AS submitter_email
             FROM ideas i JOIN users u ON u.id = i.submitter_id
             ORDER BY i.created_at DESC`,
          )
          .all() as IdeaWithSubmitter[])
      : (db
          .prepare(
            `SELECT i.*, u.email AS submitter_email
             FROM ideas i JOIN users u ON u.id = i.submitter_id
             WHERE i.submitter_id = ?
             ORDER BY i.created_at DESC`,
          )
          .all(user.id) as IdeaWithSubmitter[]);

  const counts = statCounts(ideas);

  const stats = [
    {
      label: "Total",
      value: ideas.length,
      icon: Inbox,
      tone: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
    },
    {
      label: "Submitted",
      value: counts.submitted,
      icon: Sparkles,
      tone: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
    },
    {
      label: "Under review",
      value: counts["under review"],
      icon: Clock,
      tone: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    },
    {
      label: "Accepted",
      value: counts.accepted,
      icon: CheckCircle2,
      tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {user.role === "admin" ? "All submissions" : "Your ideas"}
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {user.role === "admin" ? "Innovation pipeline" : "Your innovation board"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.role === "admin"
              ? "Every idea submitted across the program — review and evaluate."
              : "Submit new ideas and follow them from review to decision."}
          </p>
        </div>
        <Button asChild variant="gradient" size="lg">
          <Link href="/submit">
            <Sparkles className="h-4 w-4" />
            Submit new idea
          </Link>
        </Button>
      </div>

      {/* Stat bento */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-xl",
                    s.tone,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="text-2xl font-semibold tracking-tight">
                    {s.value}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Bento grid of ideas */}
      {ideas.length === 0 ? (
        <Card className="p-12 text-center">
          <CardContent className="p-0">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">No ideas yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.role === "admin"
                ? "No submissions have been made yet."
                : "Submit your first innovation idea to get started."}
            </p>
            <Button asChild variant="gradient" className="mt-6">
              <Link href="/submit">Submit your first idea</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-fr">
          {ideas.map((idea, idx) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              href={
                user.role === "admin"
                  ? `/admin/ideas/${idea.id}`
                  : `/ideas/${idea.id}`
              }
              showSubmitter={user.role === "admin"}
              featured={idx === 0 && ideas.length >= 3}
            />
          ))}
        </div>
      )}
    </div>
  );
}
