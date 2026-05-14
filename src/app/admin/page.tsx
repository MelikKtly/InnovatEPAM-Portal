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
import { getDb, type IdeaWithSubmitter } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

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

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Review and evaluate submitted ideas.
        </p>
      </div>

      {ideas.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No ideas yet</CardTitle>
            <CardDescription>
              Submissions will appear here once submitters file ideas.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30 text-left">
                  <tr>
                    <th className="p-3 font-medium">Title</th>
                    <th className="p-3 font-medium">Category</th>
                    <th className="p-3 font-medium">Submitter</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Submitted</th>
                    <th className="p-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ideas.map((idea) => (
                    <tr
                      key={idea.id}
                      className="border-b last:border-0 hover:bg-accent/30"
                    >
                      <td className="p-3 font-medium">{idea.title}</td>
                      <td className="p-3 text-muted-foreground">
                        {idea.category}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {idea.submitter_email}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={idea.status} />
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {formatDate(idea.created_at)}
                      </td>
                      <td className="p-3 text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/ideas/${idea.id}`}>Evaluate</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
