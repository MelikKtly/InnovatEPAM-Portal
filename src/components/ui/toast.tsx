"use client";

import { useEffect } from "react";

import { cn } from "@/lib/utils";

export type ToastTone = "success" | "error";

export type ToastMessage = {
  tone: ToastTone;
  text: string;
} | null;

export function Toast({
  toast,
  onDismiss,
  durationMs = 4000,
}: {
  toast: ToastMessage;
  onDismiss: () => void;
  durationMs?: number;
}) {
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(id);
  }, [toast, durationMs, onDismiss]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed right-4 top-4 z-50 max-w-sm rounded-md border p-4 text-sm shadow-md",
        toast.tone === "success" &&
          "border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
        toast.tone === "error" &&
          "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
      )}
    >
      {toast.text}
    </div>
  );
}
