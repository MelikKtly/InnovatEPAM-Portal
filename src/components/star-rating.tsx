"use client";

import { Star } from "lucide-react";
import { useState } from "react";

import { scoreTone } from "@/components/score-badge";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  label,
  hint,
}: {
  value: number;
  onChange: (next: number) => void;
  label: string;
  hint?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const displayed = hover ?? value;
  const tone = displayed > 0 ? scoreTone(displayed) : null;

  return (
    <div className="rounded-xl border border-input bg-background/40 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {hint ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "text-xs font-semibold tabular-nums",
            tone ? tone.text : "text-muted-foreground",
          )}
        >
          {displayed > 0 ? `${displayed} / 5` : "— / 5"}
        </span>
      </div>
      <div
        className="flex items-center gap-1.5"
        onMouseLeave={() => setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const active = n <= displayed;
          const starTone = active && tone ? tone.text : "text-muted-foreground/40";
          return (
            <button
              key={n}
              type="button"
              aria-label={`${label} ${n} of 5`}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(null)}
              onClick={() => onChange(n)}
              className={cn(
                "rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                starTone,
              )}
            >
              <Star
                className={cn("h-6 w-6", active ? "fill-current" : "fill-none")}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
