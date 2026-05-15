# Contract — Server Actions

**Feature**: InnovatEPAM Portal MVP
**Scope**: Next.js server actions invoked by `<form action={…}>` and progressive-enhancement clients. Each action is a typed async function exported from `app/actions/*.ts`.

All actions return a discriminated-union result:

```ts
type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
```

Errors are surfaced as inline form messages (FR-026). On success, the action calls `revalidatePath()` for the affected routes and returns; the form's redirect (if any) is handled with `redirect()` after revalidation.

---

## `actions/auth.ts`

### `register(formData: FormData): Promise<ActionResult<{ userId: string }>>`

Self-service employee registration (Story 3, FR-001, FR-002, FR-005).

- **Inputs (FormData fields)**:
  - `email` — required, EPAM domain (R5).
  - `password` — required, ≥10 chars, ≥1 letter, ≥1 digit.
- **Effects**:
  - Lowercases `email`.
  - Inserts a row in `users` with `role='submitter'`, `password_hash = bcryptjs.hash(password, 12)`.
  - Issues a session cookie (`portal_session`) and `redirect('/ideas')`.
- **Errors**:
  - `fieldErrors.email`: `"invalid_email"` | `"domain_not_allowed"` | `"already_registered"`.
  - `fieldErrors.password`: `"too_short"` | `"missing_letter"` | `"missing_digit"`.

### `signIn(formData: FormData): Promise<ActionResult>`

- **Inputs**: `email`, `password`.
- **Effects**: looks up user (case-insensitive); compares password via `bcryptjs.compare`. On success, issues a session cookie and `redirect('/admin')` if role is `admin`, else `redirect('/ideas')`.
- **Errors**:
  - `error: "invalid_credentials"` — covers both unknown email and bad password (no enumeration leak).

> Sign-out is an HTTP route (see `http-routes.md`) because it must be a `POST` from a tiny non-form button and benefits from being callable without a server-action token.

---

## `actions/ideas.ts`

### `createIdea(formData: FormData): Promise<ActionResult<{ ideaId: string }>>`

Submitter creates a new idea (Story 1, FR-009 – FR-015).

- **Auth**: requires a signed-in user (any role).
- **Inputs**:
  - `title` — required, trimmed length 1–200.
  - `description` — required, trimmed length 1–10000.
  - `category` — required, one of the four fixed values.
  - `attachment` — optional `File`; if present must be a supported type and ≤10 MB.
- **Effects**:
  - Inserts a row in `ideas` with `status='submitted'`, `submitted_at=now`, `submitter_id=session.userId`.
  - If `attachment` is present: writes the bytes under `data/attachments/<ideaId>/<sanitized-filename>`, inserts an `attachments` row.
  - `revalidatePath('/ideas')`, `revalidatePath('/admin')`.
  - `redirect('/ideas/<ideaId>')`.
- **Errors**:
  - `fieldErrors.title`: `"required"` | `"too_long"`.
  - `fieldErrors.description`: `"required"` | `"too_long"`.
  - `fieldErrors.category`: `"required"` | `"invalid"`.
  - `fieldErrors.attachment`: `"unsupported_type"` | `"too_large"`.

> Listing and detail are read-only and fetched by server components directly via `lib/db.ts`; they are not server actions and have no separate contract.

---

## `actions/evaluation.ts`

All actions in this file require the caller's role to be `admin`. Any non-admin caller receives `{ ok: false, error: "forbidden" }` (FR-008).

### `markUnderReview(ideaId: string): Promise<ActionResult>`

- **Preconditions**: idea exists; current status is `submitted` (per `ALLOWED_TRANSITIONS` in R7).
- **Effects**: sets `ideas.status='under_review'`, `updated_at=now`. Revalidates `/admin`, `/ideas`, `/ideas/[id]`.
- **Errors**: `"not_found"`, `"invalid_transition"`.

### `decide(ideaId: string, decision: 'accepted' | 'rejected', feedback: string): Promise<ActionResult>`

- **Preconditions**: idea exists; current status is one of `submitted | under_review` (forward decision) OR is the *opposite* decision after a re-open back through `under_review` (re-decision). Direct `accepted → rejected` is forbidden (FR-021b).
- **Inputs**: `feedback` trimmed length 1–4000 (FR-022).
- **Effects**:
  - Inserts a new row in `evaluations` (`decision`, `feedback`, `decider_id=session.userId`, `decided_at=now`).
  - Updates `ideas.status=decision`, `ideas.current_evaluation_id=<new row id>`, `ideas.updated_at=now`.
  - Revalidates `/admin`, `/ideas`, `/ideas/[id]`.
- **Errors**: `"not_found"`, `"invalid_transition"`, `fieldErrors.feedback: "required"`.

### `reopen(ideaId: string): Promise<ActionResult>`

Implements FR-021a (re-open a decided idea back to `under_review`).

- **Preconditions**: idea exists; current status is `accepted` or `rejected`.
- **Effects**:
  - Sets `ideas.status='under_review'`, `ideas.current_evaluation_id=NULL`, `ideas.updated_at=now`.
  - Historical `evaluations` rows are preserved untouched.
  - Revalidates `/admin`, `/ideas`, `/ideas/[id]`.
- **Errors**: `"not_found"`, `"invalid_transition"`.

---

## `actions/users.ts`

### `setRole(targetUserId: string, role: 'submitter' | 'admin'): Promise<ActionResult>`

Promote/demote a user (Story 3, FR-007).

- **Auth**: caller's role MUST be `admin`.
- **Preconditions**: target user exists; caller is not demoting themselves to `submitter` if they would become the only remaining admin (the action returns `"would_leave_no_admin"`). The check uses `SELECT COUNT(*) FROM users WHERE role='admin'`.
- **Effects**: updates `users.role` for the target.
- **Errors**: `"forbidden"`, `"not_found"`, `"invalid_role"`, `"would_leave_no_admin"`.

---

## Notes

- Every server action that mutates state calls `revalidatePath` for the affected routes so the App Router cache reflects changes within the SC-003 budget.
- All actions enforce auth + authorization *inside* the function body (not via middleware) so that direct invocation (e.g., from a future React Server Component) is also protected.
