"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { Toast, type ToastMessage } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { IdeaStatus } from "@/lib/idea-constants";

type EvaluateStatus = "under_review" | "accepted" | "rejected";

const OPTIONS: {
  value: EvaluateStatus;
  label: string;
  icon: typeof Clock;
  active: string;
}[] = [
  {
    value: "under_review",
    label: "Under review",
    icon: Clock,
    active:
      "border-amber-400/60 bg-amber-400/15 text-amber-700 dark:text-amber-200",
  },
  {
    value: "accepted",
    label: "Accepted",
    icon: CheckCircle2,
    active:
      "border-emerald-400/60 bg-emerald-400/15 text-emerald-700 dark:text-emerald-200",
  },
  {
    value: "rejected",
    label: "Rejected",
    icon: XCircle,
    active:
      "border-rose-400/60 bg-rose-500/15 text-rose-700 dark:text-rose-200",
  },
];

function toEvaluateStatus(status: IdeaStatus): EvaluateStatus {
  if (status === "under review") return "under_review";
  if (status === "accepted") return "accepted";
  if (status === "rejected") return "rejected";
  return "under_review";
}

export function EvaluationForm({
  ideaId,
  currentStatus,
}: {
  ideaId: number;
  currentStatus: IdeaStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<EvaluateStatus>(
    toEvaluateStatus(currentStatus),
  );
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastMessage>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (feedback.trim().length === 0) {
      setToast({ tone: "error", text: "Feedback is required." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/evaluate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, feedback: feedback.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setToast({ tone: "error", text: data.error ?? "Evaluation failed" });
        return;
      }
      setToast({ tone: "success", text: "Evaluation saved." });
      setFeedback("");
      router.refresh();
    } catch {
      setToast({ tone: "error", text: "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label>Status</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {OPTIONS.map((o) => {
              const Icon = o.icon;
              const active = status === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setStatus(o.value)}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? o.active
                      : "border-input bg-background/40 text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="feedback">Feedback</Label>
          <Textarea
            id="feedback"
            required
            rows={5}
            maxLength={4000}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share rationale for this decision…"
          />
        </div>

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          disabled={submitting}
          className="w-full sm:w-auto"
        >
          {submitting ? "Saving…" : "Save evaluation"}
        </Button>
      </form>
    </>
  );
}
