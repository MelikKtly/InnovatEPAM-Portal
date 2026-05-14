import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import bcrypt from "bcryptjs";

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
  `);
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
