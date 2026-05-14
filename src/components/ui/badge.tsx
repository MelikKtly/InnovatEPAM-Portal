import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide transition-colors backdrop-blur",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        indigo:
          "border-indigo-400/30 bg-indigo-500/15 text-indigo-700 shadow-[0_0_18px_-6px_rgba(99,102,241,0.55)] dark:text-indigo-200",
        amber:
          "border-amber-400/30 bg-amber-400/15 text-amber-800 shadow-[0_0_18px_-6px_rgba(251,191,36,0.6)] dark:text-amber-200",
        emerald:
          "border-emerald-400/30 bg-emerald-400/15 text-emerald-700 shadow-[0_0_22px_-6px_rgba(16,185,129,0.7)] dark:text-emerald-200",
        rose: "border-rose-400/30 bg-rose-500/15 text-rose-700 shadow-[0_0_22px_-6px_rgba(244,63,94,0.65)] dark:text-rose-200",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
