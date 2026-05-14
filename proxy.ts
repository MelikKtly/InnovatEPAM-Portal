import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth";

// NOTE: This is an *optimistic* presence check only — it does NOT verify the
// JWT signature. Real verification happens inside the API routes / server
// components where Node-runtime libraries (jsonwebtoken) are available. This
// follows the Next.js 16 recommendation that Proxy "should not be used as a
// full session management or authorization solution".
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token && token.length > 0) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Run on every route EXCEPT auth pages, auth APIs, Next internals, and
  // common static assets. Anything that matches will require a session cookie.
  matcher: [
    "/((?!login|register|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
