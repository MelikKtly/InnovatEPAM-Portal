import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { randomUUID } from "node:crypto";

import { getDb } from "@/lib/db";

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

/**
 * Pulls every `File` from the FormData under the given key, ignoring empty
 * slots that browsers sometimes emit when the user clears the input.
 */
export function pickFiles(form: FormData, key: string): File[] {
  return form
    .getAll(key)
    .filter((v): v is File => v instanceof File && v.size > 0);
}

/**
 * Persists the given uploaded files to disk and records a row per file in the
 * `attachments` table. Returns a structured result the route can either
 * forward to the client (`error`) or use (`count`).
 */
export async function persistAttachments(
  ideaId: number,
  files: File[],
): Promise<{ ok: true; count: number } | { ok: false; error: string; status: number }> {
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      return {
        ok: false,
        status: 413,
        error: `"${file.name}" exceeds 10 MB limit`,
      };
    }
  }
  if (files.length === 0) return { ok: true, count: 0 };

  await mkdir(UPLOAD_DIR, { recursive: true });
  const db = getDb();
  const insert = db.prepare(
    `INSERT INTO attachments (idea_id, file_path, file_name, file_type, created_at)
       VALUES (?, ?, ?, ?, ?)`,
  );
  const now = Date.now();
  for (const file of files) {
    const ext = extname(file.name).slice(0, 16);
    const storedName = `${randomUUID()}${ext}`;
    const absolute = join(UPLOAD_DIR, storedName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolute, buffer);
    insert.run(
      ideaId,
      `/uploads/${storedName}`,
      file.name,
      file.type || "application/octet-stream",
      now,
    );
  }
  return { ok: true, count: files.length };
}

/**
 * Parses a multi-valued `remove_attachment_ids` form field (each entry may be
 * a single id or comma-separated). Returns a deduplicated list of positive
 * integers.
 */
export function parseRemovalIds(form: FormData): number[] {
  const out = new Set<number>();
  for (const raw of form.getAll("remove_attachment_ids")) {
    if (typeof raw !== "string") continue;
    for (const piece of raw.split(",")) {
      const n = Number(piece.trim());
      if (Number.isInteger(n) && n > 0) out.add(n);
    }
  }
  return [...out];
}
