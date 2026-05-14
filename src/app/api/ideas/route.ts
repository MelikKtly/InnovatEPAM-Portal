import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getDb, IDEA_CATEGORIES, type IdeaCategory, type IdeaRow } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

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
  const file = form.get("file");
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

  let filePath: string | null = null;
  let fileName: string | null = null;

  if (file && file instanceof File && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 10 MB limit" },
        { status: 413 },
      );
    }
    await mkdir(UPLOAD_DIR, { recursive: true });
    const ext = extname(file.name).slice(0, 16); // keep extension, defensive cap
    const storedName = `${randomUUID()}${ext}`;
    const absolute = join(UPLOAD_DIR, storedName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolute, buffer);
    filePath = `/uploads/${storedName}`;
    fileName = file.name;
  }

  const now = Date.now();
  const result = getDb()
    .prepare(
      `INSERT INTO ideas
        (title, description, category, status, submitter_id, file_path, file_name, is_draft, created_at, updated_at)
       VALUES (?, ?, ?, 'submitted', ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      title,
      description,
      category,
      user.id,
      filePath,
      fileName,
      isDraft ? 1 : 0,
      now,
      now,
    );

  const idea = getDb()
    .prepare("SELECT * FROM ideas WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as IdeaRow;

  return NextResponse.json({ ok: true, idea }, { status: 201 });
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
