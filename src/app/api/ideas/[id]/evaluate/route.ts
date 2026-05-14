import { NextResponse } from "next/server";

import { getDb, type IdeaRow, type IdeaStatus } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

type EvaluateStatus = "under_review" | "accepted" | "rejected";

const STATUS_MAP: Record<EvaluateStatus, IdeaStatus> = {
  under_review: "under review",
  accepted: "accepted",
  rejected: "rejected",
};

function isEvaluateStatus(value: unknown): value is EvaluateStatus {
  return value === "under_review" || value === "accepted" || value === "rejected";
}

function isScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: rawId } = await params;
  const ideaId = Number(rawId);
  if (!Number.isInteger(ideaId) || ideaId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    status,
    feedback,
    impact_score,
    feasibility_score,
    innovation_score,
  } =
    (body as {
      status?: unknown;
      feedback?: unknown;
      impact_score?: unknown;
      feasibility_score?: unknown;
      innovation_score?: unknown;
    }) ?? {};

  if (!isEvaluateStatus(status)) {
    return NextResponse.json(
      { error: "status must be one of: under_review, accepted, rejected" },
      { status: 400 },
    );
  }
  if (typeof feedback !== "string" || feedback.trim().length === 0) {
    return NextResponse.json(
      { error: "feedback is required" },
      { status: 400 },
    );
  }
  if (feedback.length > 4000) {
    return NextResponse.json(
      { error: "feedback must be 4000 characters or fewer" },
      { status: 400 },
    );
  }
  if (
    !isScore(impact_score) ||
    !isScore(feasibility_score) ||
    !isScore(innovation_score)
  ) {
    return NextResponse.json(
      {
        error:
          "impact_score, feasibility_score and innovation_score must each be integers from 1 to 5",
      },
      { status: 400 },
    );
  }

  const db = getDb();
  const idea = db
    .prepare("SELECT * FROM ideas WHERE id = ?")
    .get(ideaId) as IdeaRow | undefined;
  if (!idea) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const dbStatus = STATUS_MAP[status];
  const now = Date.now();

  const tx = db.transaction(() => {
    db.prepare(
      "UPDATE ideas SET status = ?, updated_at = ? WHERE id = ?",
    ).run(dbStatus, now, ideaId);

    db.prepare(
      `INSERT INTO evaluations (idea_id, evaluator_id, feedback, impact_score, feasibility_score, innovation_score, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      ideaId,
      user.id,
      feedback.trim(),
      impact_score,
      feasibility_score,
      innovation_score,
      now,
    );
  });
  tx();

  const updated = db
    .prepare("SELECT * FROM ideas WHERE id = ?")
    .get(ideaId) as IdeaRow;

  return NextResponse.json({ ok: true, idea: updated });
}
