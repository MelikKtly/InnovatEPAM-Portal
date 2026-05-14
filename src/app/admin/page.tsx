import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Inbox,
  Sparkles,
  XCircle,
} from "lucide-react";

import { Avatar } from "@/components/avatar";
import { categoryMeta } from "@/components/category-meta";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDb, type IdeaStatus, type IdeaWithSubmitter } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/ideas");

  const ideas = getDb()
    .prepare(
      `SELECT i.*, u.email AS submitter_email
       FROM ideas i JOIN users u ON u.id = i.submitter_id
       ORDER BY i.created_at DESC`,
    )
    .all() as IdeaWithSubmitter[];

  const counts: Record<IdeaStatus, number> = {
    submitted: 0,
    "under review": 0,
    accepted: 0,
    rejected: 0,
  };
  for (const i of ideas) counts[i.status] += 1;

  const stats = [
    {
      label: "Total ideas",
      value: ideas.length,
      icon: Inbox,
      tone: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
    },
    {
      label: "Awaiting review",
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
    {
      label: "Rejected",
      value: counts.rejected,
      icon: XCircle,
      tone: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-8">
      <div className="mb-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Admin
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Innovation <span className="text-gradient">command center</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the entire pipeline and shepherd ideas to a decision.
        </p>
      </div>

      {/* Bento stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4 transition-transform hover:scale-[1.02]">
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
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
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

      {/* Table card */}
      {ideas.length === 0 ? (
        <Card className="p-12 text-center">
          <CardContent className="p-0">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Inbox className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">No ideas yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Submissions will appear here once submitters file ideas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Idea</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Submitter</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="px-5 py-3 text-right font-medium" />
                </tr>
              </thead>
              <tbody>
                {ideas.map((idea) => {
                  const meta = categoryMeta(idea.category);
                  const Icon = meta.icon;
                  return (
                    <tr
                      key={idea.id}
                      className="group border-b border-border/40 last:border-0 transition-colors hover:bg-accent/30"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "grid h-9 w-9 place-items-center rounded-xl text-white shadow-sm ring-1 ring-white/20",
                              meta.tile,
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="font-medium">{idea.title}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {idea.category}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar email={idea.submitter_email} size="sm" />
                          <span className="text-xs text-muted-foreground">
                            {idea.submitter_email}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={idea.status} />
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {formatDate(idea.created_at)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/ideas/${idea.id}`}>
                            Evaluate
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
