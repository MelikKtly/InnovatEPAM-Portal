import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import {
  getDb,
  IDEA_CATEGORIES,
  type IdeaCategory,
  type IdeaRow,
} from "@/lib/db";
import { buildExtraDetails, extraFieldFor } from "@/lib/extra-fields";
import { getCurrentUser } from "@/lib/session";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

function isCategory(value: unknown): value is IdeaCategory {
  return (
    typeof value === "string" &&
    (IDEA_CATEGORIES as readonly string[]).includes(value)
  );
}

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
  // Admins cannot read drafts; only the owner can.
  if (row.is_draft === 1 && row.submitter_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (user.role !== "admin" && row.submitter_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ idea: row });
}

/**
 * Owner-only edit. Used to update a draft, or to "finalise" a draft into a
 * submission (when `is_draft=0` is sent). Submitted (non-draft) ideas can no
 * longer be edited.
 */
export async function PATCH(
  request: Request,
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

  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM ideas WHERE id = ?")
    .get(id) as IdeaRow | undefined;
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.submitter_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (existing.is_draft !== 1) {
    return NextResponse.json(
      { error: "Only drafts can be edited" },
      { status: 409 },
    );
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
  const file = form.get("file");
  const remove = form.get("remove_file") === "1";
  const isDraft = form.get("is_draft") === "1";

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

  let filePath: string | null = existing.file_path;
  let fileName: string | null = existing.file_name;

  if (file && file instanceof File && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 10 MB limit" },
        { status: 413 },
      );
    }
    await mkdir(UPLOAD_DIR, { recursive: true });
    const ext = extname(file.name).slice(0, 16);
    const storedName = `${randomUUID()}${ext}`;
    const absolute = join(UPLOAD_DIR, storedName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolute, buffer);
    filePath = `/uploads/${storedName}`;
    fileName = file.name;
  } else if (remove) {
    filePath = null;
    fileName = null;
  }

  const now = Date.now();
  db.prepare(
    `UPDATE ideas
        SET title = ?, description = ?, category = ?,
            file_path = ?, file_name = ?, is_draft = ?,
            extra_details = ?, updated_at = ?
      WHERE id = ?`,
  ).run(
    title,
    description,
    category,
    filePath,
    fileName,
    isDraft ? 1 : 0,
    extraDetails,
    now,
    id,
  );

  const idea = db.prepare("SELECT * FROM ideas WHERE id = ?").get(id) as IdeaRow;
  return NextResponse.json({ ok: true, idea });
}
