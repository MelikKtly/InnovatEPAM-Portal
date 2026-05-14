import Link from "next/link";
import { redirect } from "next/navigation";

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

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
          .all() as (IdeaRow & { submitter_email: string })[])
      : (db
          .prepare(
            `SELECT i.*, u.email AS submitter_email
             FROM ideas i JOIN users u ON u.id = i.submitter_id
             WHERE i.submitter_id = ?
             ORDER BY i.created_at DESC`,
          )
          .all(user.id) as (IdeaRow & { submitter_email: string })[]);

  return (
    <main className="mx-auto w-full max-w-5xl p-4 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Ideas</h1>
          <p className="text-sm text-muted-foreground">
            {user.role === "admin"
              ? "All submitted ideas"
              : "Ideas you have submitted"}
          </p>
        </div>
        <Button asChild>
          <Link href="/submit">Submit idea</Link>
        </Button>
      </div>

      {ideas.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No ideas yet</CardTitle>
            <CardDescription>
              {user.role === "admin"
                ? "No submissions have been made yet."
                : "Submit your first innovation idea to get started."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <Link
              key={idea.id}
              href={`/ideas/${idea.id}`}
              className="block focus-visible:outline-none"
            >
              <Card className="h-full transition-colors hover:bg-accent/40">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{idea.title}</CardTitle>
                    <StatusBadge status={idea.status} />
                  </div>
                  <CardDescription>{idea.category}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>Submitted {formatDate(idea.created_at)}</p>
                  {user.role === "admin" ? (
                    <p className="mt-1">by {idea.submitter_email}</p>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
