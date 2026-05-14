import { Sparkles } from "lucide-react";

import { readExtraDetail } from "@/lib/extra-fields";
import type { IdeaCategory } from "@/lib/idea-constants";

/**
 * Renders the category-specific extra detail (Technical Stack / Current
 * Bottleneck / Target Client Group) inside a soft glass panel. Returns `null`
 * if the idea has no extra detail stored.
 */
export function ExtraDetailBlock({
  category,
  raw,
  variant = "panel",
}: {
  category: IdeaCategory;
  raw: string | null;
  variant?: "panel" | "inline";
}) {
  const detail = readExtraDetail(category, raw);
  if (!detail) return null;

  if (variant === "inline") {
    return (
      <div>
        <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-primary">
          <Sparkles className="h-3 w-3" />
          {detail.label}
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {detail.value}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-5 backdrop-blur-sm">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-primary">
        <Sparkles className="h-3 w-3" />
        {detail.label}
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">
        {detail.value}
      </p>
    </div>
  );
}
