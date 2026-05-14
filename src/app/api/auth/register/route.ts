import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  SESSION_COOKIE,
  SESSION_COOKIE_MAX_AGE,
  createToken,
  hashPassword,
} from "@/lib/auth";
import { getDb, type UserRow } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password } =
    (body as { email?: unknown; password?: unknown }) ?? {};

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  const db = getDb();
  const normalisedEmail = email.trim().toLowerCase();

  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(normalisedEmail) as Pick<UserRow, "id"> | undefined;
  if (existing) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const result = db
    .prepare(
      "INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, 'submitter', ?)",
    )
    .run(normalisedEmail, passwordHash, Date.now());

  const userId = Number(result.lastInsertRowid);
  const token = createToken(userId, "submitter");

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });

  return NextResponse.json({
    ok: true,
    user: { id: userId, email: normalisedEmail, role: "submitter" },
  });
}
