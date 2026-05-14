import { Lightbulb, Sparkles, Wrench } from "lucide-react";

import { ScoreBadge, scoreTone } from "@/components/score-badge";
import { cn } from "@/lib/utils";

export type ScoreBreakdown = {
  impact: number | null;
  feasibility: number | null;
  innovation: number | null;
};

export function averageOf(scores: ScoreBreakdown): number | null {
  const values = [scores.impact, scores.feasibility, scores.innovation].filter(
    (v): v is number => typeof v === "number",
  );
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

const DIMENSIONS = [
  { key: "impact" as const, label: "Impact", icon: Sparkles },
  { key: "feasibility" as const, label: "Feasibility", icon: Wrench },
  { key: "innovation" as const, label: "Innovation", icon: Lightbulb },
];

export function ScoreBreakdownGrid({
  scores,
  className,
}: {
  scores: ScoreBreakdown;
  className?: string;
}) {
  const avg = averageOf(scores);
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Evaluation scores
        </p>
        <ScoreBadge score={avg} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {DIMENSIONS.map((d) => {
          const value = scores[d.key];
          const tone = value ? scoreTone(value) : null;
          const Icon = d.icon;
          return (
            <div
              key={d.key}
              className="rounded-xl border border-border/60 bg-muted/30 p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-lg",
                      tone ? `${tone.bg} ${tone.text}` : "bg-muted/60 text-muted-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm font-medium">{d.label}</span>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    tone ? tone.text : "text-muted-foreground",
                  )}
                >
                  {value !== null ? `${value} / 5` : "— / 5"}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    value ? tone?.bg : "",
                  )}
                  style={{
                    width: `${value ? (value / 5) * 100 : 0}%`,
                    backgroundColor: value
                      ? value >= 4
                        ? "rgb(16 185 129)"
                        : value >= 3
                          ? "rgb(245 158 11)"
                          : "rgb(244 63 94)"
                      : undefined,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
