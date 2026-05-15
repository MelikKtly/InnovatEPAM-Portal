import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  SESSION_COOKIE,
  SESSION_COOKIE_MAX_AGE,
  createToken,
  verifyPassword,
} from "@/lib/auth";
import { getDb, type UserRow } from "@/lib/db";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password } =
    (body as { email?: unknown; password?: unknown }) ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "Email and password required" },
      { status: 400 },
    );
  }

  const db = getDb();
  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as UserRow | undefined;

  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

  const token = createToken(user.id, user.role);

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
    user: { id: user.id, email: user.email, role: user.role },
  });
}
