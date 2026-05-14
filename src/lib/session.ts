import { cookies } from "next/headers";

import { SESSION_COOKIE, verifyToken, type Role } from "@/lib/auth";
import { getDb, type UserRow } from "@/lib/db";

export type CurrentUser = {
  id: number;
  email: string;
  role: Role;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = getDb()
    .prepare("SELECT id, email, role FROM users WHERE id = ?")
    .get(payload.sub) as Pick<UserRow, "id" | "email" | "role"> | undefined;

  if (!user) return null;
  return { id: user.id, email: user.email, role: user.role };
}
