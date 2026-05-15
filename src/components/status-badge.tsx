import { Badge } from "@/components/ui/badge";
import type { IdeaStatus } from "@/lib/idea-constants";
import { cn } from "@/lib/utils";

const VARIANT: Record<
  IdeaStatus,
  "indigo" | "amber" | "emerald" | "rose"
> = {
  submitted: "indigo",
  "under review": "amber",
  accepted: "emerald",
  rejected: "rose",
};

const DOT: Record<IdeaStatus, string> = {
  submitted: "bg-indigo-500 shadow-[0_0_8px_2px_rgba(99,102,241,0.6)]",
  "under review": "bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.6)]",
  accepted: "bg-emerald-400 shadow-[0_0_10px_2px_rgba(16,185,129,0.7)]",
  rejected: "bg-rose-500 shadow-[0_0_10px_2px_rgba(244,63,94,0.65)]",
};

const LABEL: Record<IdeaStatus, string> = {
  submitted: "Submitted",
  "under review": "Under review",
  accepted: "Accepted",
  rejected: "Rejected",
};

export function StatusBadge({ status }: { status: IdeaStatus }) {
  return (
    <Badge variant={VARIANT[status]}>
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[status])} />
      {LABEL[status]}
    </Badge>
  );
}
