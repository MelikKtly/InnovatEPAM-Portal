"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Toast, type ToastMessage } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { IdeaStatus } from "@/lib/db";

type EvaluateStatus = "under_review" | "accepted" | "rejected";

const OPTIONS: { value: EvaluateStatus; label: string }[] = [
  { value: "under_review", label: "Under review" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
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
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as EvaluateStatus)}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            {OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
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
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save evaluation"}
        </Button>
      </form>
    </>
  );
}
