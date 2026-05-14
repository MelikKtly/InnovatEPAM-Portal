import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, Download, UserRound } from "lucide-react";

import { Avatar } from "@/components/avatar";
import { categoryMeta } from "@/components/category-meta";
import { ExtraDetailBlock } from "@/components/extra-detail-block";
import { IdeaProgress } from "@/components/idea-progress";
import { ScoreBreakdownGrid } from "@/components/score-breakdown";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchIdeaById } from "@/lib/ideas-query";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id: rawId } = await params;
  if (!user) redirect(`/login?next=/ideas/${rawId}`);

  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const idea = fetchIdeaById(id);

  if (!idea) notFound();
  if (user.role !== "admin" && idea.submitter_id !== user.id) notFound();
  // Admins must never see drafts; redirect owners to the editor.
  if (idea.is_draft === 1) {
    if (user.role === "admin") notFound();
    redirect(`/submit?draft=${idea.id}`);
  }

  const meta = categoryMeta(idea.category);
  const Icon = meta.icon;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-16 sm:px-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/ideas">
          <ArrowLeft className="h-4 w-4" />
          Back to ideas
        </Link>
      </Button>

      {/* Hero card */}
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
        </div>
      </Card>

      {/* Description */}
      <Card className="mt-6 p-8">
        <CardContent className="space-y-3 p-0">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Description
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {idea.description}
          </p>
        </CardContent>
      </Card>

      {/* Category-specific extra detail */}
      {idea.extra_details ? (
        <div className="mt-6">
          <ExtraDetailBlock
            category={idea.category}
            raw={idea.extra_details}
          />
        </div>
      ) : null}

      {/* Scores */}
      <Card className="mt-6 p-8">
        <CardContent className="p-0">
          <ScoreBreakdownGrid
            scores={{
              impact: idea.impact_score,
              feasibility: idea.feasibility_score,
              innovation: idea.innovation_score,
            }}
          />
        </CardContent>
      </Card>

      {/* Attachment */}
      {idea.file_path ? (
        <Card className="mt-6 p-6">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-0">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <UserRound className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Attachment
                </p>
                <p className="font-medium">{idea.file_name ?? "Attachment"}</p>
              </div>
            </div>
            <Button asChild variant="outline">
              <a href={idea.file_path} target="_blank" rel="noreferrer">
                <Download className="h-4 w-4" />
                Download
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
