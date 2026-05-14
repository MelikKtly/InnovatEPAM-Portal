import { NextResponse } from "next/server";

import { getDb, type IdeaRow } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const row = getDb()
    .prepare(
      `SELECT i.*, u.email AS submitter_email
       FROM ideas i JOIN users u ON u.id = i.submitter_id
       WHERE i.id = ?`,
    )
    .get(id) as (IdeaRow & { submitter_email: string }) | undefined;

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (user.role !== "admin" && row.submitter_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ idea: row });
}
