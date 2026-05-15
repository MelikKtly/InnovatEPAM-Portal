import { EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

export function IdentityHiddenBadge({
  size = "md",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 font-medium text-indigo-700 dark:text-indigo-300",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className,
      )}
    >
      <EyeOff className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      Identity Hidden
    </span>
  );
}
