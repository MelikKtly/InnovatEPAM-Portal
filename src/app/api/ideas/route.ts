import { mkdir } from "node:fs/promises";

import { NextResponse } from "next/server";

import {
  getDb,
  IDEA_CATEGORIES,
  type IdeaCategory,
  type IdeaRow,
} from "@/lib/db";
import { fetchAttachmentsByIdeaId } from "@/lib/attachments-query";
import { buildExtraDetails, extraFieldFor } from "@/lib/extra-fields";
import { getCurrentUser } from "@/lib/session";
import {
  MAX_FILE_BYTES,
  UPLOAD_DIR,
  persistAttachments,
  pickFiles,
} from "@/lib/uploads";

function isCategory(value: unknown): value is IdeaCategory {
  return (
    typeof value === "string" &&
    (IDEA_CATEGORIES as readonly string[]).includes(value)
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "submitter" && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 },
    );
  }

  const title = (form.get("title") ?? "").toString().trim();
  const description = (form.get("description") ?? "").toString().trim();
  const category = form.get("category");
  const isDraft = form.get("is_draft") === "1";

  // Accept both "files" (preferred, multi) and legacy "file" (single).
  const files = [...pickFiles(form, "files"), ...pickFiles(form, "file")];

  if (title.length < 3 || title.length > 200) {
    return NextResponse.json(
      { error: "Title must be 3-200 characters" },
      { status: 400 },
    );
  }
  if (description.length < 10) {
    return NextResponse.json(
      { error: "Description must be at least 10 characters" },
      { status: 400 },
    );
  }
  if (!isCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const extraDef = extraFieldFor(category);
  const extraValues: Record<string, string> = {};
  if (extraDef) {
    const raw = form.get(extraDef.key);
    if (typeof raw === "string") extraValues[extraDef.key] = raw;
  }
  const extraDetails = buildExtraDetails(category, extraValues);

  // Up-front size check so we reject before writing a row.
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `"${file.name}" exceeds 10 MB limit` },
        { status: 413 },
      );
    }
  }
  if (files.length > 0) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const now = Date.now();
  const result = getDb()
    .prepare(
      `INSERT INTO ideas
        (title, description, category, status, submitter_id, is_draft, extra_details, created_at, updated_at)
       VALUES (?, ?, ?, 'submitted', ?, ?, ?, ?, ?)`,
    )
    .run(
      title,
      description,
      category,
      user.id,
      isDraft ? 1 : 0,
      extraDetails,
      now,
      now,
    );
  const ideaId = Number(result.lastInsertRowid);

  const saved = await persistAttachments(ideaId, files);
  if (!saved.ok) {
    // Roll the idea back so the user can retry without orphans.
    getDb().prepare("DELETE FROM ideas WHERE id = ?").run(ideaId);
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  const idea = getDb()
    .prepare("SELECT * FROM ideas WHERE id = ?")
    .get(ideaId) as IdeaRow;
  const attachments = fetchAttachmentsByIdeaId(ideaId);

  return NextResponse.json(
    { ok: true, idea, attachments },
    { status: 201 },
  );
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const rows =
    user.role === "admin"
      ? (db
          .prepare(
            `SELECT i.*, u.email AS submitter_email
             FROM ideas i JOIN users u ON u.id = i.submitter_id
             WHERE i.is_draft = 0
             ORDER BY i.created_at DESC`,
          )
          .all() as (IdeaRow & { submitter_email: string })[])
      : (db
          .prepare(
            `SELECT i.*, u.email AS submitter_email
             FROM ideas i JOIN users u ON u.id = i.submitter_id
             WHERE i.submitter_id = ?
             ORDER BY i.created_at DESC`,
          )
          .all(user.id) as (IdeaRow & { submitter_email: string })[]);

  return NextResponse.json({ ideas: rows });
}
