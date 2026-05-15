import type { IdeaStatus } from "@/lib/idea-constants";
import { cn } from "@/lib/utils";

const STAGES: { key: IdeaStatus | "review"; label: string }[] = [
  { key: "submitted", label: "Submitted" },
  { key: "review", label: "In review" },
  { key: "accepted", label: "Decision" },
];

const PROGRESS_PCT: Record<IdeaStatus, number> = {
  submitted: 33,
  "under review": 66,
  accepted: 100,
  rejected: 100,
};

const BAR_COLOR: Record<IdeaStatus, string> = {
  submitted: "bg-[linear-gradient(90deg,#6366f1,#818cf8)]",
  "under review": "bg-[linear-gradient(90deg,#f59e0b,#fbbf24)]",
  accepted: "bg-[linear-gradient(90deg,#10b981,#34d399)]",
  rejected: "bg-[linear-gradient(90deg,#e11d48,#fb7185)]",
};

export function IdeaProgress({ status }: { status: IdeaStatus }) {
  const pct = PROGRESS_PCT[status];
  return (
    <div className="space-y-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", BAR_COLOR[status])}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        {STAGES.map((s) => (
          <span key={s.key}>{s.label}</span>
        ))}
      </div>
    </div>
  );
}
