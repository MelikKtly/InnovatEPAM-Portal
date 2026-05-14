import { cn } from "@/lib/utils";

export function Avatar({
  email,
  size = "md",
  className,
}: {
  email: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`
      : local.slice(0, 2) || "U";

  const sizes = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-sm",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#6366f1,#a855f7)] font-semibold uppercase text-white ring-2 ring-white/40 shadow-md shadow-indigo-500/20",
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      {initials.toUpperCase()}
    </span>
  );
}
