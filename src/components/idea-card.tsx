import Link from "next/link";

import { Avatar } from "@/components/avatar";
import { categoryMeta } from "@/components/category-meta";
import { IdeaProgress } from "@/components/idea-progress";
import { IdentityHiddenBadge } from "@/components/identity-hidden-badge";
import { ScoreBadge } from "@/components/score-badge";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import type { IdeaWithSubmitterAndScores } from "@/lib/db";
import { isIdentityRevealed } from "@/lib/blind-review";
import { cn } from "@/lib/utils";

function relativeDate(ms: number): string {
  const diff = Date.now() - ms;
  const day = 86_400_000;
  if (diff < day) return "today";
  if (diff < 2 * day) return "yesterday";
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`;
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function IdeaCard({
  idea,
  showSubmitter,
  href,
  featured = false,
}: {
  idea: IdeaWithSubmitterAndScores;
  showSubmitter?: boolean;
  href: string;
  featured?: boolean;
}) {
  const meta = categoryMeta(idea.category);
  const Icon = meta.icon;
  const revealed = isIdentityRevealed(idea.status);
  const blind = showSubmitter && !revealed;

  return (
    <Link
      href={href}
      className={cn(
        "group relative block focus-visible:outline-none",
        featured && "sm:col-span-2 sm:row-span-2",
      )}
    >
      <Card className="relative h-full overflow-hidden p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-500/10 group-hover:scale-[1.01]">
        {/* Halo */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-60 blur-3xl transition-opacity duration-500 group-hover:opacity-80",
            meta.halo,
          )}
        />

        <CardHeader className="p-0">
          <div className="flex items-start justify-between gap-3">
            <span
              className={cn(
                "grid h-11 w-11 place-items-center rounded-xl text-white shadow-md ring-1 ring-white/20",
                meta.tile,
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="flex items-center gap-2">
              <ScoreBadge score={idea.avg_score} size="sm" />
              <StatusBadge status={idea.status} />
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {idea.category}
            </p>
            <h3
              className={cn(
                "font-semibold tracking-tight",
                featured ? "text-2xl" : "text-lg",
              )}
            >
              {idea.title}
            </h3>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-0 pt-5">
          {featured ? (
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {idea.description}
            </p>
          ) : null}

          <IdeaProgress status={idea.status} />

          <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar
                email={idea.submitter_email}
                size="sm"
                anonymous={blind}
              />
              {showSubmitter ? (
                blind ? (
                  <IdentityHiddenBadge size="sm" />
                ) : (
                  <span className="font-medium text-foreground">
                    {idea.submitter_email}
                  </span>
                )
              ) : (
                <span>You</span>
              )}
            </div>
            <span>{relativeDate(idea.created_at)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
