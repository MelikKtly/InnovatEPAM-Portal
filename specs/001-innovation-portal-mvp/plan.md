# Implementation Plan: InnovatEPAM Portal MVP

**Branch**: `001-innovation-portal-mvp` | **Date**: 2026-05-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-innovation-portal-mvp/spec.md`

## Summary

Deliver an internal innovation portal for EPAM employees that supports email/password authentication (restricted to EPAM email domains), idea submission with a single optional attachment in one of four fixed categories, role-aware browsing (Submitter vs. Admin/Evaluator), and an admin evaluation workflow (submitted → under review → accepted/rejected, with re-open support and mandatory feedback on every decision). Implementation is a single Next.js 14 App Router application backed by a local SQLite database, styled with Tailwind CSS (using the `@theme` directive for theme colours) and shadcn/ui primitives. No automated tests are produced (Constitution Principle V); quality is enforced via TypeScript strict mode, ESLint, manual acceptance against the spec's scenarios, and code review.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 20 LTS

**Primary Dependencies**:

- **Framework**: Next.js 14 (App Router) + React 18
- **Styling**: Tailwind CSS v4 (using `@theme` directive for theme colours)
- **Components**: shadcn/ui (CLI-installed into `components/ui/`)
- **Persistence**: SQLite via `better-sqlite3` (synchronous, file-backed)
- **Auth**: `bcryptjs` (password hashing), `jsonwebtoken` (signed session tokens stored in an HttpOnly cookie)
- **Dates**: `date-fns` for formatting/parsing

**Storage**: A single SQLite file at `./data/portal.db` (path configurable via `DATABASE_PATH` env var). Attachments stored on the local filesystem under `./data/attachments/<idea-id>/<original-filename>`; metadata referenced in the DB. No ORM — a thin data-access module wraps `better-sqlite3`.

**Testing**: None (per Constitution Principle V). TypeScript strict mode + ESLint (zero warnings policy) provide the only automated checks. Manual acceptance against `spec.md` acceptance scenarios.

**Target Platform**: Modern evergreen browsers (Chromium, Firefox, Safari, latest two majors). Server runs on Node.js 20 LTS, deployable to any environment that can run `next start` plus a writable local filesystem.

**Project Type**: Web application — single Next.js project hosting both server (route handlers, server actions, server components) and client (React/Tailwind/shadcn).

**Performance Goals**:

- Time-to-interactive on the ideas listing under 1.5 s on a typical office LAN.
- Newly submitted idea visible on listing/dashboard within 2 s of submit (per SC-003) — achieved by App Router cache revalidation after each mutation.

**Constraints**:

- Single-tenant, single-process deployment; `better-sqlite3` is sufficient for expected load (low hundreds of writes/day, a few concurrent users).
- Responsive 320 px – 1920 px+ without horizontal scroll (Constitution Principle II; SC-005).
- 10 MB max attachment size (spec Assumption); enforced server-side authoritatively.
- Auth session: 7-day rolling expiry, 30-day absolute cap (FR-003).

**Scale/Scope**: ~7 user-facing routes, 4 entities, ~3000 employees ceiling (well within SQLite/Next limits).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|---|---|---|
| I. Clean Code | ✅ | TypeScript strict; ESLint+Prettier configured; zero-warning gate. No magic strings — categories, statuses, roles as named const unions. |
| II. Simple & Responsive UI/UX | ✅ | Tailwind utilities + shadcn/ui primitives only; conventional patterns (form on page, list on dashboard, dialog for decision). Manual verification at 320 / 768 / 1280 / 1920 px. |
| III. Minimal Dependencies | ✅ with justifications | See **Dependency Justification** below. Every runtime dep is either the locked stack or directly demanded by spec; no transitive bloat. |
| IV. Simplicity Over Complexity | ✅ | Single Next.js app, single SQLite file, no ORM, no service layer abstraction, no event bus. Server actions + route handlers used directly. State is React `useState` / server components. |
| V. No Automated Test Suites | ✅ | No `tests/`, no test runner in `package.json`, no test tasks emitted later. Type checking + lint only. |

**Dependency Justification** (Principle III):

| Dependency | Why Needed | Why a Simpler Alternative Was Rejected |
|---|---|---|
| `next`, `react`, `react-dom`, `tailwindcss` | Locked by Constitution Technology Stack. | N/A — these are the platform. |
| shadcn/ui (CLI-installed components) | Locked by Constitution; provides accessible primitives we'd otherwise rewrite. | N/A. |
| `better-sqlite3` | Locked by Constitution (SQLite). Synchronous API keeps server actions simple. | `node:sqlite` is still experimental on Node 20; async `sqlite3` adds callback/promise plumbing for no gain at this scale. |
| `bcryptjs` | FR-001 / FR-003 require password storage and verification. Cannot implement secure password hashing in <50 LOC. | `bcrypt` (native) requires platform build tools; `argon2` is heavier and also native. `bcryptjs` is pure-JS and adequate for an internal portal. |
| `jsonwebtoken` | FR-003 needs a stateless, signed session token in an HttpOnly cookie; rolling/absolute expiry is implemented as `iat` + sliding-`exp` validation. | `iron-session` adds an extra abstraction; hand-rolling HMAC+base64url is borderline (>50 LOC of careful code). User explicitly requested `jsonwebtoken`. |
| `date-fns` | UI shows submission dates and relative times. User explicitly requested this dep. | `Intl.DateTimeFormat` handles absolute dates but not relative times cleanly across the UI. `date-fns` is tree-shakable. |

No further runtime dependencies. Dev-only tools allowed: `typescript`, `eslint`, `@types/*`, `prettier`, PostCSS plumbing.

**Complexity Tracking**: No violations to record.

## Project Structure

### Documentation (this feature)

```text
specs/001-innovation-portal-mvp/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── http-routes.md
│   └── server-actions.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
app/                          # Next.js App Router
├── (auth)/
│   ├── sign-in/page.tsx
│   ├── register/page.tsx
│   └── layout.tsx            # Public layout
├── (portal)/
│   ├── layout.tsx            # Authenticated layout (top nav, role-aware)
│   ├── ideas/
│   │   ├── page.tsx          # Listing (role-aware visibility)
│   │   ├── new/page.tsx      # Submission form
│   │   └── [id]/page.tsx     # Detail view
│   └── admin/
│       ├── page.tsx          # Admin dashboard (Admin/Evaluator only)
│       └── users/page.tsx    # Role management (Admin/Evaluator only)
├── api/
│   ├── attachments/[id]/route.ts  # Authenticated file download
│   └── auth/sign-out/route.ts     # POST to clear session cookie
├── actions/                  # Server actions
│   ├── auth.ts               # register, signIn
│   ├── ideas.ts              # createIdea
│   ├── evaluation.ts         # markUnderReview, decide, reopen
│   └── users.ts              # setRole
├── layout.tsx                # Root layout
└── globals.css               # Tailwind v4 entrypoint with @theme block

components/
├── ui/                       # shadcn-installed primitives
└── portal/                   # App-specific composites (IdeaCard, StatusBadge, ...)

lib/
├── db.ts                     # better-sqlite3 singleton + migration runner
├── schema.sql                # DDL applied at boot
├── auth.ts                   # bcryptjs + jsonwebtoken helpers, getCurrentUser()
├── session.ts                # Cookie read/write (HttpOnly, Secure in prod, SameSite=Lax)
├── attachments.ts            # File save / read / delete; size & type validation
├── visibility.ts             # Single source for "can this user see this idea?"
├── validation.ts             # Hand-rolled input validators (kept tiny)
└── constants.ts              # Categories, statuses, roles, domain allow-list

data/                         # gitignored
├── portal.db
└── attachments/

scripts/
└── seed-admin.ts             # One-shot: create initial Admin/Evaluator account

.env.example
package.json
tsconfig.json                 # strict: true
next.config.mjs
tailwind.config.ts
postcss.config.mjs
.eslintrc.cjs
.prettierrc
```

**Structure Decision**: Single Next.js application at the repo root (not a monorepo). All server logic lives in route handlers and server actions co-located under `app/`; pure logic and adapters live in `lib/`. This matches Constitution Principle IV (simplicity) and is the natural shape for a small Next.js app.

## Phase 0 — Outline & Research

Resolved in [research.md](./research.md). No unresolved `NEEDS CLARIFICATION` markers remain in Technical Context.

## Phase 1 — Design & Contracts

Produced in this run:

- [data-model.md](./data-model.md) — entities, columns, constraints, state transitions.
- [contracts/http-routes.md](./contracts/http-routes.md) — Next.js route handlers (API).
- [contracts/server-actions.md](./contracts/server-actions.md) — server actions invoked from forms.
- [quickstart.md](./quickstart.md) — bootstrap and run instructions for a fresh checkout.

### Post-Design Constitution Re-Check

| Principle | Re-check | Notes |
|---|---|---|
| I. Clean Code | ✅ | Module boundaries thin; each `lib/*.ts` has a single concern. |
| II. Simple & Responsive UI/UX | ✅ | Layouts use Tailwind responsive utilities; shadcn primitives drive form, table, dialog, badge. |
| III. Minimal Dependencies | ✅ | No new dependency added during design beyond those justified above. |
| IV. Simplicity Over Complexity | ✅ | Visibility logic centralised in `lib/visibility.ts`; no premature abstraction (no repository pattern, no DI). |
| V. No Automated Test Suites | ✅ | No test scaffolding in any artifact. |

Constitution Check passes after design. No items moved to Complexity Tracking.

## Complexity Tracking

> No violations.

## Phase 2 — Next Step

Planning complete. The next command is `/speckit.tasks`, which will read the artifacts above and emit `tasks.md`. Task generation MUST NOT emit unit/integration/E2E test tasks (Principle V).
