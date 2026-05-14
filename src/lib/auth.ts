import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export type Role = "submitter" | "admin";

export type SessionPayload = {
  sub: number;
  role: Role;
};

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set (>= 16 chars) in production");
    }
    return "dev-only-insecure-secret-change-me-please";
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(userId: number, role: Role): string {
  return jwt.sign({ sub: userId, role }, getSecret(), {
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret());
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      typeof (decoded as jwt.JwtPayload).sub === "number" &&
      ((decoded as jwt.JwtPayload).role === "submitter" ||
        (decoded as jwt.JwtPayload).role === "admin")
    ) {
      const d = decoded as jwt.JwtPayload & SessionPayload;
      return { sub: d.sub, role: d.role };
    }
    return null;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "portal_session";
export const SESSION_COOKIE_MAX_AGE = TOKEN_TTL_SECONDS;
