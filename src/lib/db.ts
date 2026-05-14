import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import bcrypt from "bcryptjs";

import type { IdeaCategory, IdeaStatus } from "@/lib/idea-constants";

export {
  IDEA_CATEGORIES,
  type IdeaCategory,
  type IdeaStatus,
} from "@/lib/idea-constants";

const DB_PATH = resolve(process.env.DATABASE_PATH ?? "./data/portal.db");

type GlobalWithDb = typeof globalThis & { __portalDb?: Database.Database };
const g = globalThis as GlobalWithDb;

function createConnection(): Database.Database {
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const conn = new Database(DB_PATH);
  conn.pragma("journal_mode = WAL");
  conn.pragma("foreign_keys = ON");
  return conn;
}

function migrate(conn: Database.Database) {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL CHECK (role IN ('submitter', 'admin')),
      created_at    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      title         TEXT NOT NULL,
      description   TEXT NOT NULL,
      category      TEXT NOT NULL CHECK (category IN (
                      'Technical Innovation',
                      'Process Improvement',
                      'Client Solutions',
                      'Cost Reduction'
                    )),
      status        TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
                      'submitted',
                      'under review',
                      'accepted',
                      'rejected'
                    )),
      submitter_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      file_path     TEXT,
      file_name     TEXT,
      is_draft      INTEGER NOT NULL DEFAULT 0 CHECK (is_draft IN (0, 1)),
      extra_details TEXT,
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ideas_submitter ON ideas(submitter_id);
    CREATE INDEX IF NOT EXISTS idx_ideas_created   ON ideas(created_at DESC);

    CREATE TABLE IF NOT EXISTS evaluations (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      idea_id           INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
      evaluator_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      feedback          TEXT NOT NULL,
      impact_score      INTEGER CHECK (impact_score      BETWEEN 1 AND 5),
      feasibility_score INTEGER CHECK (feasibility_score BETWEEN 1 AND 5),
      innovation_score  INTEGER CHECK (innovation_score  BETWEEN 1 AND 5),
      created_at        INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_evaluations_idea
      ON evaluations(idea_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS attachments (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      idea_id    INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
      file_path  TEXT NOT NULL,
      file_name  TEXT NOT NULL,
      file_type  TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_attachments_idea
      ON attachments(idea_id, created_at);
  `);

  // Idempotent column additions for existing databases.
  const cols = conn
    .prepare("PRAGMA table_info(evaluations)")
    .all() as { name: string }[];
  const have = new Set(cols.map((c) => c.name));
  if (!have.has("impact_score")) {
    conn.exec(
      "ALTER TABLE evaluations ADD COLUMN impact_score INTEGER CHECK (impact_score BETWEEN 1 AND 5)",
    );
  }
  if (!have.has("feasibility_score")) {
    conn.exec(
      "ALTER TABLE evaluations ADD COLUMN feasibility_score INTEGER CHECK (feasibility_score BETWEEN 1 AND 5)",
    );
  }
  if (!have.has("innovation_score")) {
    conn.exec(
      "ALTER TABLE evaluations ADD COLUMN innovation_score INTEGER CHECK (innovation_score BETWEEN 1 AND 5)",
    );
  }

  const ideaCols = conn
    .prepare("PRAGMA table_info(ideas)")
    .all() as { name: string }[];
  const ideaHave = new Set(ideaCols.map((c) => c.name));
  if (!ideaHave.has("is_draft")) {
    conn.exec(
      "ALTER TABLE ideas ADD COLUMN is_draft INTEGER NOT NULL DEFAULT 0 CHECK (is_draft IN (0, 1))",
    );
  }
  if (!ideaHave.has("extra_details")) {
    conn.exec("ALTER TABLE ideas ADD COLUMN extra_details TEXT");
  }

  // Backfill: any legacy single-file attachment stored on ideas should appear
  // in the attachments table exactly once. Safe to run on every boot because
  // we key on (idea_id, file_path).
  const legacyRows = conn
    .prepare(
      `SELECT id, file_path, file_name, created_at
         FROM ideas
        WHERE file_path IS NOT NULL AND file_name IS NOT NULL`,
    )
    .all() as {
      id: number;
      file_path: string;
      file_name: string;
      created_at: number;
    }[];
  if (legacyRows.length > 0) {
    const exists = conn.prepare(
      "SELECT id FROM attachments WHERE idea_id = ? AND file_path = ?",
    );
    const insert = conn.prepare(
      `INSERT INTO attachments (idea_id, file_path, file_name, file_type, created_at)
         VALUES (?, ?, ?, ?, ?)`,
    );
    const tx = conn.transaction(() => {
      for (const row of legacyRows) {
        if (exists.get(row.id, row.file_path)) continue;
        const ext = row.file_name.includes(".")
          ? row.file_name.slice(row.file_name.lastIndexOf(".") + 1).toLowerCase()
          : "";
        const fileType = guessMimeFromExt(ext);
        insert.run(row.id, row.file_path, row.file_name, fileType, row.created_at);
      }
    });
    tx();
  }
}

function guessMimeFromExt(ext: string): string {
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "pdf":
      return "application/pdf";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "xls":
      return "application/vnd.ms-excel";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "ppt":
      return "application/vnd.ms-powerpoint";
    case "pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case "txt":
      return "text/plain";
    case "csv":
      return "text/csv";
    case "zip":
      return "application/zip";
    default:
      return "application/octet-stream";
  }
}

function seedAdmin(conn: Database.Database) {
  const adminEmail = "admin@epam.com";
  const existing = conn
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(adminEmail);
  if (existing) return;

  const hash = bcrypt.hashSync("admin123", 12);
  conn
    .prepare(
      "INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, 'admin', ?)",
    )
    .run(adminEmail, hash, Date.now());
}

export function getDb(): Database.Database {
  if (!g.__portalDb) {
    const conn = createConnection();
    migrate(conn);
    seedAdmin(conn);
    g.__portalDb = conn;
  }
  return g.__portalDb;
}

export type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  role: "submitter" | "admin";
  created_at: number;
};

export type IdeaRow = {
  id: number;
  title: string;
  description: string;
  category: IdeaCategory;
  status: IdeaStatus;
  submitter_id: number;
  file_path: string | null;
  file_name: string | null;
  is_draft: 0 | 1;
  extra_details: string | null;
  created_at: number;
  updated_at: number;
};

export type IdeaWithSubmitter = IdeaRow & { submitter_email: string };

export type EvaluationRow = {
  id: number;
  idea_id: number;
  evaluator_id: number;
  feedback: string;
  impact_score: number | null;
  feasibility_score: number | null;
  innovation_score: number | null;
  created_at: number;
};

export type EvaluationWithEvaluator = EvaluationRow & {
  evaluator_email: string;
};

export type IdeaWithSubmitterAndScores = IdeaWithSubmitter & {
  avg_score: number | null;
  impact_score: number | null;
  feasibility_score: number | null;
  innovation_score: number | null;
};

export type AttachmentRow = {
  id: number;
  idea_id: number;
  file_path: string;
  file_name: string;
  file_type: string;
  created_at: number;
};
