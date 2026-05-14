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
import { getDb, type IdeaRow } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString();
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

  const idea = getDb()
    .prepare(
      `SELECT i.*, u.email AS submitter_email
       FROM ideas i JOIN users u ON u.id = i.submitter_id
       WHERE i.id = ?`,
    )
    .get(id) as (IdeaRow & { submitter_email: string }) | undefined;

  if (!idea) notFound();
  if (user.role !== "admin" && idea.submitter_id !== user.id) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-8">
      <div className="mb-4">
        <Button asChild variant="link" className="px-0">
          <Link href="/ideas">← Back to ideas</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{idea.title}</CardTitle>
              <CardDescription className="mt-1">
                {idea.category}
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

          <section className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Submitted by</p>
              <p>{idea.submitter_email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Submitted</p>
              <p>{formatDateTime(idea.created_at)}</p>
            </div>
            {idea.updated_at !== idea.created_at ? (
              <div>
                <p className="text-muted-foreground">Last updated</p>
                <p>{formatDateTime(idea.updated_at)}</p>
              </div>
            ) : null}
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
    </main>
  );
}
