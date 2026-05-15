import { getDb, type AttachmentRow } from "@/lib/db";

export function fetchAttachmentsByIdeaId(ideaId: number): AttachmentRow[] {
  return getDb()
    .prepare(
      "SELECT * FROM attachments WHERE idea_id = ? ORDER BY created_at ASC, id ASC",
    )
    .all(ideaId) as AttachmentRow[];
}

export function fetchAttachmentById(id: number): AttachmentRow | undefined {
  return getDb()
    .prepare("SELECT * FROM attachments WHERE id = ?")
    .get(id) as AttachmentRow | undefined;
}

export function isImageType(fileType: string): boolean {
  return fileType.startsWith("image/");
}
