import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getDb,
  type EvaluationWithEvaluator,
  type IdeaWithSubmitter,
} from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

import { EvaluationForm } from "./evaluation-form";

function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString();
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
  const idea = db
    .prepare(
      `SELECT i.*, u.email AS submitter_email
       FROM ideas i JOIN users u ON u.id = i.submitter_id
       WHERE i.id = ?`,
    )
    .get(ideaId) as IdeaWithSubmitter | undefined;
  if (!idea) notFound();

  const evaluations = db
    .prepare(
      `SELECT e.*, u.email AS evaluator_email
       FROM evaluations e JOIN users u ON u.id = e.evaluator_id
       WHERE e.idea_id = ?
       ORDER BY e.created_at DESC`,
    )
    .all(ideaId) as EvaluationWithEvaluator[];

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-8">
      <div className="mb-4">
        <Button asChild variant="link" className="px-0">
          <Link href="/admin">← Back to dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{idea.title}</CardTitle>
              <CardDescription className="mt-1">
                {idea.category} · submitted by {idea.submitter_email} on{" "}
                {formatDateTime(idea.created_at)}
              </CardDescription>
            </div>
            <StatusBadge status={idea.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">
              Description
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {idea.description}
            </p>
          </section>

          {idea.file_path ? (
            <section>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                Attachment
              </h2>
              <Button asChild variant="outline">
                <a href={idea.file_path} target="_blank" rel="noreferrer">
                  Download {idea.file_name ?? "attachment"}
                </a>
              </Button>
            </section>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Evaluation</CardTitle>
          <CardDescription>
            Update the status and leave feedback for the submitter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EvaluationForm ideaId={idea.id} currentStatus={idea.status} />
        </CardContent>
      </Card>

      {evaluations.length > 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Previous evaluations</CardTitle>
            <CardDescription>
              Most recent feedback first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {evaluations.map((ev) => (
              <div
                key={ev.id}
                className="rounded-md border bg-muted/20 p-3 text-sm"
              >
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{ev.evaluator_email}</span>
                  <span>{formatDateTime(ev.created_at)}</span>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {ev.feedback}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
