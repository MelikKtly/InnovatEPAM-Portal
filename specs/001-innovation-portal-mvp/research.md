# Phase 0 — Research

**Feature**: InnovatEPAM Portal MVP
**Date**: 2026-05-14
**Status**: Complete — no unresolved `NEEDS CLARIFICATION` items.

The Technical Context in [plan.md](./plan.md) pinned every choice to the locked stack (Next.js 14, Tailwind, shadcn/ui, SQLite, bcryptjs, jsonwebtoken, date-fns). The items below document the non-trivial decisions made within that stack.

---

## R1 — Tailwind CSS v4 with `@theme` directive

- **Decision**: Use Tailwind CSS v4 and declare theme colours via the `@theme` directive in `app/globals.css`. No `theme.extend.colors` in `tailwind.config.ts`.
- **Rationale**: The user explicitly requested `@theme` for theme colours. Tailwind v4 makes this the idiomatic spot; CSS variables emitted by `@theme` are consumable from arbitrary CSS without bouncing through JS config. Matches shadcn/ui v4 guidance.
- **Alternatives considered**:
  - Tailwind v3 with `theme.extend.colors` — rejected: explicit user requirement is v4-style `@theme`.
  - Plain CSS variables without Tailwind colour utilities — rejected: loses utility ergonomics and shadcn integration.

## R2 — SQLite driver: `better-sqlite3`

- **Decision**: `better-sqlite3` (synchronous, file-backed).
- **Rationale**: Synchronous API simplifies server actions — no Promise plumbing for trivial reads. Adequate for the portal's scale (a handful of concurrent users). User-requested.
- **Alternatives considered**:
  - `node:sqlite` — experimental on Node 20 LTS; promoting forces Node 22.
  - `sqlite3` (async) — adds Promise/callback wrappers throughout for no concurrency gain at this load.

## R3 — Auth model: JWT in HttpOnly cookie

- **Decision**: Sessions are JSON Web Tokens (HS256) issued by `jsonwebtoken`, stored in an HttpOnly, `SameSite=Lax`, `Secure` (in production) cookie. Payload: `{ sub: userId, role, iat, exp }`. Sliding expiry implemented by re-issuing the cookie on every authenticated request whose token is older than ~24 h, capped by an absolute `nbf`-derived 30-day ceiling encoded as a separate `abs` claim.
- **Rationale**: FR-003 requires 7-day rolling + 30-day absolute. JWT is stateless (no server-side session table needed for MVP), aligns with the user-requested `jsonwebtoken` dep, and meshes naturally with Next.js middleware / `cookies()` API.
- **Alternatives considered**:
  - Server-side session table — adds a `sessions` table, an opaque token, and revocation logic. Heavier for the MVP threat model; revocation isn't required by spec.
  - `iron-session` — would replace `jsonwebtoken`, violating user's explicit dep choice; also opinionated about cookie shape that complicates the sliding-window logic.

## R4 — Password hashing: `bcryptjs` cost factor

- **Decision**: `bcryptjs.hash(password, 12)`.
- **Rationale**: Cost 12 is the current OWASP-aligned default for bcrypt on modern hardware (~250–400 ms per hash); acceptable for a registration/sign-in path that is not high-throughput. `bcryptjs` (pure JS) avoids native build hassles at the cost of speed — acceptable since the rate of auth events is low.
- **Alternatives considered**: native `bcrypt` (faster but needs build tools); `argon2` (stronger; heavier dep). Neither justified at MVP scale.

## R5 — Email domain enforcement (Q1 clarification)

- **Decision**: Allow-list of domains (default `["epam.com"]`) read from `EPAM_ALLOWED_EMAIL_DOMAINS` env var (comma-separated). Domain comparison is case-insensitive on the part after the final `@`. Subdomain matches require an explicit entry (`teams.epam.com` does not match `epam.com`).
- **Rationale**: Clarification 1 said "configurable allow-list of EPAM subdomains". Env-var config is the simplest, deploy-time-changeable mechanism; storing in DB is overkill.
- **Alternatives considered**: hard-code `epam.com` only (rejected — spec wants configurable); wildcard match (`*.epam.com`) (rejected — adds parsing complexity for zero current need).

## R6 — Idea visibility rule (Q2 clarification)

- **Decision**: A single function `canSeeIdea(viewer, idea)` lives in `lib/visibility.ts` and is called from every place that surfaces an idea (listing query filter, detail page guard, attachment download guard). Rules:
  - If `viewer.role === 'admin'` → always visible.
  - Else if `idea.status !== 'rejected'` → visible.
  - Else if `idea.submitterId === viewer.id` → visible.
  - Else → not visible.
- **Rationale**: Centralising the rule avoids drift between the list query and detail/attachment guards (a classic source of authorization bugs). Implemented twice — once as a SQL `WHERE` predicate for the listing query and once as an in-memory check for detail / download — both derived from the same constant in `lib/constants.ts`.
- **Alternatives considered**: scatter the rule per route (rejected — Principle I and IV both prefer one source).

## R7 — Status transitions (Q5 clarification)

- **Decision**: Allowed transitions are encoded as a constant adjacency map in `lib/constants.ts`:

  | From | Allowed To |
  |---|---|
  | `submitted` | `under_review`, `accepted`, `rejected` |
  | `under_review` | `accepted`, `rejected` |
  | `accepted` | `under_review` (re-open) |
  | `rejected` | `under_review` (re-open) |

  Direct `accepted` ↔ `rejected` is forbidden (FR-021b). Every transition into `accepted` or `rejected` requires a non-empty `feedback` field (FR-022) and creates a new row in `evaluations` (preserving history); the idea's `current_evaluation_id` is updated. Re-opening (transition to `under_review` from a decided state) sets `current_evaluation_id` to `NULL` but does **not** delete the old evaluation row.
- **Rationale**: Adjacency map keeps the rule auditable in one place. Preserving evaluation history covers Q5's "latest decision is what is displayed" while satisfying the spec's note about tracking status changes.
- **Alternatives considered**: full audit log table (rejected — Spec Assumption explicitly says audit history beyond current status and the Evaluation record is not required); allow free-form transitions with admin discretion (rejected — clarification Q5 picked Option B).

## R8 — Attachment storage

- **Decision**: Store the binary on the local filesystem at `data/attachments/<idea-id>/<sanitized-original-filename>`; store `original_filename`, `content_type`, `size_bytes` in the `attachments` table. Download is served via an authenticated route handler (`/api/attachments/[id]`) that calls `canSeeIdea` for the requesting user.
- **Rationale**: Keeps SQLite DB small and backups fast (SQLite has a row-size limit and storing blobs hurts read perf). Filesystem is the simplest storage; deployment is single-process so no shared-storage concern. Type & size validation happens in `lib/attachments.ts` server-side authoritatively.
- **Alternatives considered**: store as `BLOB` in SQLite (rejected — adds DB bloat and complicates streaming for ~10 MB files); external object store (rejected — violates Principle IV and adds a runtime dep).

## R9 — Input validation library

- **Decision**: Hand-rolled validators in `lib/validation.ts` (small functions returning `{ ok: true, value } | { ok: false, errors }`).
- **Rationale**: Principle III: a runtime schema lib (zod, valibot) would add a dep for ~5 forms whose rules are short (title length, description length, category enum, email regex, password rule). Hand-rolled fits in well under 50 LOC.
- **Alternatives considered**: `zod` (rejected per Principle III — not justified by the rule complexity).

## R10 — Date formatting

- **Decision**: Use `date-fns` (`format`, `formatDistanceToNow`) for all displayed dates. Persist all timestamps as ISO-8601 UTC strings (or as `INTEGER` Unix epoch ms in SQLite — see [data-model.md](./data-model.md)).
- **Rationale**: User-requested. Tree-shaking keeps bundle small.
- **Alternatives considered**: `Intl.DateTimeFormat` (rejected — relative-time helper missing).

## R11 — Database migrations

- **Decision**: At application boot, `lib/db.ts` executes `lib/schema.sql` against the database using `db.exec()`. The schema file uses `CREATE TABLE IF NOT EXISTS` so it is idempotent. A `schema_version` table holds a single row; if its value is below the current schema's, the migration block runs.
- **Rationale**: We have one schema version at MVP; a full migration tool (`drizzle-kit`, `prisma migrate`) is unjustified per Principle III. Idempotent DDL is sufficient.
- **Alternatives considered**: dedicated migration tool (rejected — no second migration scheduled yet).
