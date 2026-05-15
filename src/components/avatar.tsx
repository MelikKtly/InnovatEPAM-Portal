import { EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
} as const;

const ICON_SIZES = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

export function Avatar({
  email,
  size = "md",
  anonymous = false,
  className,
}: {
  email: string;
  size?: "sm" | "md" | "lg";
  anonymous?: boolean;
  className?: string;
}) {
  if (anonymous) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground ring-2 ring-white/30 shadow-sm",
          SIZES[size],
          className,
        )}
        aria-hidden="true"
      >
        <EyeOff className={ICON_SIZES[size]} />
      </span>
    );
  }

  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`
      : local.slice(0, 2) || "U";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#6366f1,#a855f7)] font-semibold uppercase text-white ring-2 ring-white/40 shadow-md shadow-indigo-500/20",
        SIZES[size],
        className,
      )}
      aria-hidden="true"
    >
      {initials.toUpperCase()}
    </span>
  );
}
