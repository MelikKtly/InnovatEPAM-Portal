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
