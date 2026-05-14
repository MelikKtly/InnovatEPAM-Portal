import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  MessageSquare,
} from "lucide-react";

import { Avatar } from "@/components/avatar";
import { categoryMeta } from "@/components/category-meta";
import { IdeaProgress } from "@/components/idea-progress";
import { ScoreBadge } from "@/components/score-badge";
import { ScoreBreakdownGrid } from "@/components/score-breakdown";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getDb,
  type EvaluationWithEvaluator,
} from "@/lib/db";
import { fetchIdeaById } from "@/lib/ideas-query";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

import { EvaluationForm } from "./evaluation-form";

function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminEvaluatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id: rawId } = await params;
  if (!user) redirect(`/login?next=/admin/ideas/${rawId}`);
  if (user.role !== "admin") redirect("/ideas");

  const ideaId = Number(rawId);
  if (!Number.isInteger(ideaId) || ideaId <= 0) notFound();

  const db = getDb();
  const idea = fetchIdeaById(ideaId);
  if (!idea) notFound();

  const evaluations = db
    .prepare(
      `SELECT e.*, u.email AS evaluator_email
       FROM evaluations e JOIN users u ON u.id = e.evaluator_id
       WHERE e.idea_id = ?
       ORDER BY e.created_at DESC`,
    )
    .all(ideaId) as EvaluationWithEvaluator[];

  const meta = categoryMeta(idea.category);
  const Icon = meta.icon;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-16 sm:px-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/admin">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>

      {/* Hero */}
      <Card className="relative overflow-hidden p-8">
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl opacity-70",
            meta.halo,
          )}
        />
        <div className="relative space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span
                className={cn(
                  "grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg ring-1 ring-white/20",
                  meta.tile,
                )}
              >
                <Icon className="h-6 w-6" />
              </span>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {idea.category}
                </p>
                <h1 className="text-3xl font-semibold leading-tight tracking-tight">
                  {idea.title}
                </h1>
              </div>
            </div>
            <StatusBadge status={idea.status} />
          </div>

          <IdeaProgress status={idea.status} />

          <ScoreBreakdownGrid
            scores={{
              impact: idea.impact_score,
              feasibility: idea.feasibility_score,
              innovation: idea.innovation_score,
            }}
          />

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
              <Avatar email={idea.submitter_email} size="md" />
              <div className="leading-tight">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Submitted by
                </p>
                <p className="font-medium">{idea.submitter_email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
                <CalendarDays className="h-4 w-4" />
              </span>
              <div className="leading-tight">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Submitted
                </p>
                <p className="font-medium">{formatDateTime(idea.created_at)}</p>
              </div>
            </div>
          </div>

          {idea.description ? (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Description
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {idea.description}
              </p>
            </div>
          ) : null}

          {idea.file_path ? (
            <Button asChild variant="outline">
              <a href={idea.file_path} target="_blank" rel="noreferrer">
                <Download className="h-4 w-4" />
                Download {idea.file_name ?? "attachment"}
              </a>
            </Button>
          ) : null}
        </div>
      </Card>

      {/* Evaluation form */}
      <Card className="mt-6 p-8">
        <CardContent className="p-0">
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight">
              Evaluate this idea
            </h2>
            <p className="text-sm text-muted-foreground">
              Update the status and leave feedback for the submitter.
            </p>
          </div>
          <EvaluationForm
            ideaId={idea.id}
            currentStatus={idea.status}
            initialScores={{
              impact: idea.impact_score,
              feasibility: idea.feasibility_score,
              innovation: idea.innovation_score,
            }}
          />
        </CardContent>
      </Card>

      {/* History */}
      {evaluations.length > 0 ? (
        <Card className="mt-6 p-8">
          <CardContent className="space-y-4 p-0">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <MessageSquare className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Evaluation history
                </h2>
                <p className="text-xs text-muted-foreground">
                  Most recent feedback first
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {evaluations.map((ev) => {
                const scoreVals = [
                  ev.impact_score,
                  ev.feasibility_score,
                  ev.innovation_score,
                ].filter((v): v is number => typeof v === "number");
                const avg =
                  scoreVals.length > 0
                    ? scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length
                    : null;
                return (
                  <div
                    key={ev.id}
                    className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Avatar email={ev.evaluator_email} size="sm" />
                        <span className="font-medium text-foreground">
                          {ev.evaluator_email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ScoreBadge score={avg} size="sm" />
                        <span>{formatDateTime(ev.created_at)}</span>
                      </div>
                    </div>
                    {scoreVals.length === 3 ? (
                      <div className="mb-2 flex flex-wrap gap-2 text-[11px]">
                        <span className="rounded-full bg-background/60 px-2 py-0.5">
                          Impact {ev.impact_score}/5
                        </span>
                        <span className="rounded-full bg-background/60 px-2 py-0.5">
                          Feasibility {ev.feasibility_score}/5
                        </span>
                        <span className="rounded-full bg-background/60 px-2 py-0.5">
                          Innovation {ev.innovation_score}/5
                        </span>
                      </div>
                    ) : null}
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {ev.feedback}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
