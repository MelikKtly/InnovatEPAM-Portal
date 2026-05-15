# Contract — HTTP Route Handlers

**Feature**: InnovatEPAM Portal MVP
**Scope**: Only endpoints exposed as Next.js route handlers under `app/api/`. Form-driven mutations are documented in [server-actions.md](./server-actions.md). Page renders (server components) are not contracts.

All responses use JSON unless noted. All routes are server-rendered/handled; the cookie `portal_session` (HttpOnly, `SameSite=Lax`, `Secure` in production) is used for authentication.

---

## `GET /api/attachments/[id]`

Authenticated download of an idea's attachment.

- **Auth**: requires a valid `portal_session` cookie.
- **Authorization**: caller MUST be allowed to see the parent idea per `canSeeIdea(viewer, idea)` (see `lib/visibility.ts`).
- **Path params**:
  - `id` (string, required) — the `attachments.id`.
- **Responses**:
  - `200 OK` — body is the binary file contents.
    Headers: `Content-Type: <stored content_type>`, `Content-Length: <size_bytes>`, `Content-Disposition: attachment; filename="<original_filename>"` (filename is RFC-5987-encoded if it contains non-ASCII).
  - `401 Unauthorized` — no session or expired session. JSON: `{ "error": "unauthorized" }`.
  - `403 Forbidden` — caller cannot see the parent idea. JSON: `{ "error": "forbidden" }`.
  - `404 Not Found` — no such attachment. JSON: `{ "error": "not_found" }`.
  - `410 Gone` — DB row exists but file is missing on disk. JSON: `{ "error": "attachment_unavailable" }`. (Spec edge case.)

## `POST /api/auth/sign-out`

Terminates the current session.

- **Auth**: no requirement (idempotent for already-signed-out callers).
- **Body**: none.
- **Behaviour**: clears the `portal_session` cookie by setting it to an empty value with `Max-Age=0`.
- **Responses**:
  - `204 No Content` — always, on success.

---

## Notes

- No public/unauthenticated read endpoints exist. All idea data is fetched server-side during page rendering; the browser does not call a JSON API for ideas in this release.
- No CORS configuration is needed; same-origin only.
- Rate limiting is out of scope for the MVP (deferred clarification).
