import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Maps a 1–5 numeric score to a colour tier.
 * 4–5 → emerald, 3 → amber, 1–2 → rose.
 */
export function scoreTone(score: number): {
  text: string;
  bg: string;
  ring: string;
  glow: string;
} {
  if (score >= 4) {
    return {
      text: "text-emerald-700 dark:text-emerald-300",
      bg: "bg-emerald-500/15",
      ring: "ring-emerald-500/30",
      glow: "shadow-[0_0_22px_-6px_rgba(16,185,129,0.7)]",
    };
  }
  if (score >= 3) {
    return {
      text: "text-amber-700 dark:text-amber-200",
      bg: "bg-amber-500/15",
      ring: "ring-amber-500/30",
      glow: "shadow-[0_0_22px_-6px_rgba(245,158,11,0.7)]",
    };
  }
  return {
    text: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-500/15",
    ring: "ring-rose-500/30",
    glow: "shadow-[0_0_22px_-6px_rgba(244,63,94,0.7)]",
  };
}

export function ScoreBadge({
  score,
  size = "md",
  showStar = true,
  className,
}: {
  score: number | null | undefined;
  size?: "sm" | "md";
  showStar?: boolean;
  className?: string;
}) {
  if (score === null || score === undefined) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border/60",
          className,
        )}
      >
        {showStar ? <Star className="h-3 w-3" /> : null}
        Unscored
      </span>
    );
  }
  const tone = scoreTone(score);
  const padding = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold ring-1",
        padding,
        tone.text,
        tone.bg,
        tone.ring,
        tone.glow,
        className,
      )}
    >
      {showStar ? <Star className="h-3 w-3 fill-current" /> : null}
      {score.toFixed(1)}
    </span>
  );
}
