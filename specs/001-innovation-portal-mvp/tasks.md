---

description: "Implementation tasks for InnovatEPAM Portal MVP"
---

# Tasks: InnovatEPAM Portal MVP

**Input**: Design documents from `specs/001-innovation-portal-mvp/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/http-routes.md](./contracts/http-routes.md), [contracts/server-actions.md](./contracts/server-actions.md), [quickstart.md](./quickstart.md)

**Tests**: NONE. Per [Constitution Principle V](../../.specify/memory/constitution.md), automated test suites are prohibited in this repository. No unit / integration / contract / E2E test tasks are emitted. Quality is enforced via TypeScript strict mode, ESLint (zero-warning policy), and manual acceptance against `spec.md`.

**Organization**: Tasks are grouped by user story so each story can be implemented and demoed independently.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Task can run in parallel (different file, no dependency on an incomplete task).
- **[Story]**: User-story label (US1 / US2 / US3); omitted for Setup, Foundational, and Polish phases.

## Path Conventions

Single Next.js application at the repository root, exactly as specified in [plan.md](./plan.md) → "Project Structure" → "Source Code (repository root)".

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialise the Next.js project, dependency graph, and tooling.

- [ ] T001 Initialise the Next.js 14 + TypeScript project at the repository root: create `package.json` (private, `type: "module"`, scripts `dev`, `build`, `start`, `lint`, `typecheck`, `db:init`, `seed:admin`), `tsconfig.json` with `strict: true` and Next.js path aliases, `next.config.mjs`, and append `data/`, `.env.local`, `node_modules/`, `.next/` to `.gitignore`.
- [ ] T002 Install runtime dependencies pinned in [plan.md](./plan.md): `next@14`, `react@18`, `react-dom@18`, `better-sqlite3`, `bcryptjs`, `jsonwebtoken`, `date-fns`. Install dev dependencies: `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `@types/better-sqlite3`, `@types/bcryptjs`, `@types/jsonwebtoken`, `eslint`, `eslint-config-next`, `prettier`, `prettier-plugin-tailwindcss`, `tailwindcss@4`, `@tailwindcss/postcss`, `postcss`. Commit the lockfile.
- [ ] T003 [P] Configure linting and formatting: create `.eslintrc.cjs` extending `next/core-web-vitals` with `--max-warnings=0` wired into the `lint` script, and `.prettierrc` with the tailwind plugin enabled.
- [ ] T004 [P] Configure Tailwind v4: create `postcss.config.mjs` registering `@tailwindcss/postcss`, create `tailwind.config.ts` (content globs for `app/**`, `components/**`), and create `app/globals.css` containing `@import "tailwindcss";` plus a `@theme { ... }` block that declares portal theme colour CSS variables (`--color-background`, `--color-foreground`, `--color-primary`, `--color-primary-foreground`, `--color-muted`, `--color-muted-foreground`, `--color-accent`, `--color-destructive`, `--color-border`, `--color-ring`).
- [ ] T005 [P] Create `.env.example` listing `DATABASE_PATH`, `EPAM_ALLOWED_EMAIL_DOMAINS`, `SESSION_SECRET`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (values left blank with brief comments) so a fresh checkout matches [quickstart.md](./quickstart.md) Section 2.
- [ ] T006 [P] Initialise shadcn/ui: create `components.json` (style `new-york`, base colour neutral, RSC enabled, tailwind v4 config) and install the primitives the MVP needs into `components/ui/`: `button`, `input`, `label`, `textarea`, `select`, `card`, `badge`, `dialog`, `table`, `dropdown-menu`, `form`, `toast`, `separator`, `alert`.

**Checkpoint**: `npm run dev` boots a blank Next.js app on `http://localhost:3000` with Tailwind classes working and shadcn primitives importable.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database, auth, visibility, attachments, and shared layouts that every user story depends on.

**⚠️ CRITICAL**: No user-story work begins until this phase is complete.

- [ ] T007 Create `lib/constants.ts` exporting: `CATEGORIES` (`'technical_innovation' | 'process_improvement' | 'client_solutions' | 'cost_reduction'`) with display labels, `IDEA_STATUSES` (`'submitted' | 'under_review' | 'accepted' | 'rejected'`) with display labels, `ROLES` (`'submitter' | 'admin'`), `ALLOWED_TRANSITIONS` map from [research.md](./research.md) R7, `ALLOWED_ATTACHMENT_MIME_TYPES` array from [data-model.md](./data-model.md) validation rules, and `MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024`.
- [ ] T008 Create `lib/schema.sql` containing the full DDL from [data-model.md](./data-model.md): tables `users`, `ideas`, `attachments`, `evaluations`, `schema_version`; all `CHECK` constraints; indexes `idx_ideas_submitted_at`, `idx_ideas_submitter_id`, `idx_ideas_status`, `idx_evaluations_idea_id`. Every `CREATE` statement MUST use `IF NOT EXISTS`. Initialise `schema_version` with `INSERT OR IGNORE INTO schema_version(version) VALUES (1);`.
- [ ] T009 Create `lib/db.ts`: better-sqlite3 singleton bound to `process.env.DATABASE_PATH` (default `./data/portal.db`), runs `PRAGMA foreign_keys = ON`, executes `lib/schema.sql` via `db.exec()` on first connect, exports the connection plus typed prepared-statement helpers used elsewhere. Depends on T007, T008.
- [ ] T010 [P] Create `lib/validation.ts` exporting hand-rolled validators that return `{ ok: true, value } | { ok: false, errors }`: `validateEmail(raw, allowedDomains)` (RFC-5322-light + domain allow-list parsed from `EPAM_ALLOWED_EMAIL_DOMAINS`, lowercases), `validatePassword(raw)` (≥10 chars, ≥1 letter, ≥1 digit), `validateIdeaInput({title, description, category})`, `validateFeedback(raw)`, `validateAttachmentMeta({type, size})`. No external schema library.
- [ ] T011 [P] Create `lib/session.ts`: `readSessionCookie()` (server-only) using `next/headers` `cookies()`, `writeSessionCookie(token, maxAgeSeconds)` and `clearSessionCookie()` setting `portal_session` HttpOnly, `SameSite=Lax`, `Secure` when `process.env.NODE_ENV === 'production'`, `Path=/`.
- [ ] T012 Create `lib/auth.ts`: `hashPassword(plain)` via `bcryptjs.hash(plain, 12)`, `verifyPassword(plain, hash)`, `issueSessionToken({sub, role})` signing with `jsonwebtoken.sign` HS256 using `SESSION_SECRET`, payload `{sub, role, iat, exp: iat + 7*24*3600, abs: iat + 30*24*3600}`, `verifySessionToken(token)` enforcing `exp` AND `abs` (rejects if `now > abs`), `getCurrentUser()` (reads cookie via T011, verifies, returns `{id, email, role}` or `null`, refreshes the cookie when more than 24 h have passed since `iat` but `now < abs`), `requireUser()`/`requireAdmin()` throwing `redirect('/sign-in?next=…')` or `forbidden()` respectively. Depends on T010, T011.
- [ ] T013 [P] Create `lib/visibility.ts` exporting `canSeeIdea(viewer, idea)` (rules from [research.md](./research.md) R6) and `buildListingWhere(viewer)` returning `{ sql: string; params: Record<string, unknown> }` consumed by the listing query in T025. Depends on T007.
- [ ] T014 [P] Create `lib/attachments.ts`: `sanitizeFilename(raw)`, `saveAttachment({ideaId, file})` (validates MIME and size via `lib/validation.ts`, writes to `data/attachments/<ideaId>/<sanitized>` via `node:fs/promises`, inserts the `attachments` row), `getAttachmentForDownload(attachmentId, viewer)` (joins parent idea, applies `canSeeIdea`, returns `{stream, contentType, originalFilename, size}` or sentinel `'not_found' | 'forbidden' | 'gone'`), `deleteAttachmentsForIdea(ideaId)`. Depends on T009, T010, T013.
- [ ] T015 Create `app/layout.tsx`: root HTML/body, set `lang="en"`, import `app/globals.css`, configure a single self-hosted font via `next/font/local` or `next/font/google` (one family, two weights — keep deps minimal), include a single `<Toaster />` slot from shadcn.
- [ ] T016 [P] Create the two route-group layouts: `app/(auth)/layout.tsx` (centered card layout, no nav; redirects to `/ideas` if `getCurrentUser()` already returns a user) and `app/(portal)/layout.tsx` (calls `requireUser()`, renders a top nav with links "Ideas", "New Idea", and conditionally "Admin" + "Users" when role is `admin`, plus a sign-out form posting to `/api/auth/sign-out`).
- [ ] T017 [P] Create `components/portal/StatusBadge.tsx` (client-safe; maps each `IDEA_STATUSES` value to a shadcn Badge variant + label) and `components/portal/CategoryLabel.tsx` (renders the display label for a `CATEGORIES` value). Depends on T007.
- [ ] T018 [P] Create `components/portal/FormError.tsx` (renders a single inline error message styled via Tailwind/shadcn `Alert`) used by every form for `ActionResult.error` and per-field `fieldErrors` rendering.
- [ ] T019 [P] Create `scripts/seed-admin.ts`: reads `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD`, aborts if either is missing or a user with that email already exists, otherwise inserts a user with `role='admin'` and hashed password via `lib/auth.ts`. Wire `npm run db:init` to a tiny `scripts/db-init.ts` that just imports `lib/db.ts` (which runs the schema), and `npm run seed:admin` to `scripts/seed-admin.ts`. Depends on T009, T012.

**Checkpoint**: `npm run db:init && npm run seed:admin` creates `data/portal.db` with all tables/indexes and a seeded admin row. `npm run typecheck` and `npm run lint` both pass.

---

## Phase 3: User Story 1 — Submit and browse innovation ideas (Priority: P1) 🎯 MVP

**Goal**: A signed-in user can submit ideas (with optional attachment) and browse the listing / detail pages, with visibility rules from Q2 applied.

**Independent Test**: With only the seeded admin available, sign in, submit ideas in each of the four categories (with and without a 10 MB-cap PDF attachment), and confirm each appears on `/ideas`, opens at `/ideas/[id]`, and that the attachment downloads with its original filename.

### Implementation for User Story 1

- [ ] T020 [US1] Implement `app/actions/auth.ts` `signIn` server action per [contracts/server-actions.md](./contracts/server-actions.md): validates email + password via `lib/validation.ts`, looks up the user (case-insensitive on `users.email`), `bcryptjs.compare`, on success calls `issueSessionToken` and `writeSessionCookie`, redirects to `/admin` when role is `admin` else `/ideas`. Returns `{ok: false, error: 'invalid_credentials'}` for any mismatch (no enumeration). Depends on T009, T010, T011, T012.
- [ ] T021 [US1] Create `app/(auth)/sign-in/page.tsx`: a form bound to the `signIn` action using shadcn `Input`, `Label`, `Button`, `Card`, with `FormError` for the top-level error. Includes a link to `/register` (the page itself ships in US3; in US1 the link can render — it 404s until US3 is done, which is acceptable for incremental delivery). Depends on T016, T018, T020.
- [ ] T022 [US1] Implement `app/api/auth/sign-out/route.ts` per [contracts/http-routes.md](./contracts/http-routes.md) `POST /api/auth/sign-out`: clears the cookie via `lib/session.clearSessionCookie()` and returns `204 No Content` (the calling `<form>` in the top nav then triggers a navigation to `/sign-in` via `redirect('/sign-in')` if the request was a form post). Depends on T011.
- [ ] T023 [US1] Implement `app/actions/ideas.ts` `createIdea` server action per [contracts/server-actions.md](./contracts/server-actions.md): calls `requireUser()`, validates `title`, `description`, `category`, and (if present) the attachment file; inserts the `ideas` row inside a transaction; if attachment present calls `lib/attachments.saveAttachment`; calls `revalidatePath('/ideas')` and `revalidatePath('/admin')`; redirects to `/ideas/<newId>`. Depends on T009, T010, T012, T014.
- [ ] T024 [US1] Create `app/(portal)/ideas/new/page.tsx`: client form using shadcn `Input` (title), `Textarea` (description), `Select` (category — four options from `CATEGORIES`), `Input type="file"` (attachment), `Button` (submit), bound to `createIdea`. Renders per-field errors from `ActionResult.fieldErrors` via `FormError`. Enforces `MAX_ATTACHMENT_BYTES` client-side as an early reject (the server remains authoritative per T023). Depends on T007, T016, T018, T023.
- [ ] T025 [US1] Create `lib/ideas.ts` (data-access helpers) exposing `listIdeasForViewer(viewer)` (uses `lib/visibility.buildListingWhere`, joins submitter email, orders by `submitted_at DESC`) and `getIdeaForViewer(id, viewer)` (joins submitter, current evaluation, attachment metadata; applies `canSeeIdea`; returns `null` if forbidden). Then create `app/(portal)/ideas/page.tsx`: server component that calls `listIdeasForViewer`, renders a responsive shadcn `Table` (collapses to a stacked card list under `md:` breakpoint via Tailwind utilities) with columns title (linked to detail), category (`CategoryLabel`), submitter, submission date formatted by `date-fns.format`, status (`StatusBadge`). Depends on T013, T017, T009.
- [ ] T026 [US1] Create `app/(portal)/ideas/[id]/page.tsx`: server component that calls `getIdeaForViewer`; renders `notFound()` (Next 404) when the helper returns `null` for any reason (covers both "missing" and "forbidden" to avoid leaking existence per Principle II; or returns a 403 page if the caller is signed in and the idea exists but is hidden — implementer's choice, must be consistent). Renders title, description, category, submitter, submission date (date-fns), `StatusBadge`, and the attachment download link to `/api/attachments/<attachmentId>` when present. Decision feedback rendering is added in US2 (T033). Depends on T017, T025.
- [ ] T027 [US1] Implement `app/api/attachments/[id]/route.ts` per [contracts/http-routes.md](./contracts/http-routes.md) `GET /api/attachments/[id]`: calls `getCurrentUser()` (401 if absent), looks up attachment + parent idea, applies `canSeeIdea` (403 if hidden), streams the file with `Content-Type`, `Content-Length`, and `Content-Disposition: attachment; filename="..."` (RFC-5987-encoded when needed); returns 404 when the row is missing and 410 with `{"error":"attachment_unavailable"}` when the file is absent on disk. Depends on T012, T013, T014.
- [ ] T028 [P] [US1] Add an empty state to `app/(portal)/ideas/page.tsx` rendered when the viewer's filtered listing is empty: shadcn `Card` reading "No ideas yet — be the first to submit one." with a primary `Button` linking to `/ideas/new`. Depends on T025.
- [ ] T029 [P] [US1] Add the listing's sort/visibility verification by extending `lib/ideas.ts` with explicit `ORDER BY ideas.submitted_at DESC` and confirming the SQL is parameterised through prepared statements (no string interpolation of `viewerId`). Depends on T025.

**Checkpoint — US1 demo**: Sign in as the seeded admin → submit two ideas (one with a PDF, one without) → both appear on `/ideas` (newest first), open at `/ideas/[id]`, attachment downloads. Acceptance scenarios 1–5 of [spec.md](./spec.md) Story 1 pass.

---

## Phase 4: User Story 2 — Admin evaluates and decides on ideas (Priority: P2)

**Goal**: An Admin/Evaluator can move ideas through the status graph, record decisions with feedback, and re-open decided ideas. Non-admins are denied.

**Independent Test**: With several submitted ideas (from US1), sign in as the seeded admin, advance one to "under review" → "accepted" with feedback, another to "rejected" with feedback, then re-open one and re-decide it the opposite way; verify status and feedback render on detail pages and that a non-admin gets 403 on `/admin`.

### Implementation for User Story 2

- [ ] T030 [US2] Implement `app/actions/evaluation.ts` exporting `markUnderReview(ideaId)`, `decide(ideaId, decision, feedback)`, and `reopen(ideaId)` per [contracts/server-actions.md](./contracts/server-actions.md): each calls `requireAdmin()`, looks up the idea, consults `ALLOWED_TRANSITIONS` (T007), inside a transaction inserts an `evaluations` row when `decide` and updates `ideas.status`, `ideas.current_evaluation_id` (NULL on `reopen`), `ideas.updated_at`. Forbids `accepted → rejected` and `rejected → accepted` directly. Validates feedback via `lib/validation.validateFeedback`. Calls `revalidatePath('/admin')`, `revalidatePath('/ideas')`, `revalidatePath(\`/ideas/${ideaId}\`)`. Depends on T007, T009, T010, T012.
- [ ] T031 [US2] Create `app/(portal)/admin/page.tsx`: server component that calls `requireAdmin()` and queries every idea joined with submitter email and current evaluation feedback. Renders a shadcn `Table` (stacks on small viewports) with columns title (link to detail), category, submitter, submitted-at, current status badge. Provides per-row action buttons that open `DecisionDialog` (T032) for accept/reject (when status is `submitted` or `under_review`) and inline buttons for "Mark under review" (when `submitted`) and "Re-open" (when `accepted` or `rejected`). A status filter (shadcn `Select`) at the top filters rows client-side. Depends on T009, T012, T017, T032.
- [ ] T032 [P] [US2] Create `components/portal/DecisionDialog.tsx`: client component wrapping shadcn `Dialog` with a `Textarea` for feedback and Accept/Cancel buttons; receives `{ideaId, decision: 'accepted'|'rejected'}` props, invokes `decide()` from T030 via a form-action, renders `fieldErrors.feedback` via `FormError`, and closes on success. Depends on T018, T030.
- [ ] T033 [US2] Extend `app/(portal)/ideas/[id]/page.tsx` (built in T026) to render the current decision feedback when `ideas.current_evaluation_id` is present (shows decider, decided-at via date-fns, decision badge, feedback text in a shadcn `Card`). Add an admin-only action bar (visible only when `getCurrentUser().role === 'admin'`) with "Mark under review" / "Accept" / "Reject" / "Re-open" buttons gated by `ALLOWED_TRANSITIONS` for the idea's current status; decision buttons open `DecisionDialog`, others call the corresponding action directly via a form. Depends on T030, T032.
- [ ] T034 [P] [US2] Verify and document non-admin denial: `requireAdmin()` is called inside every evaluation action (T030) AND inside `app/(portal)/admin/page.tsx` (T031); add a short JSDoc comment on each entry point noting the FR-008 contract so future readers understand the defence-in-depth. Depends on T030, T031.

**Checkpoint — US2 demo**: All acceptance scenarios 1–6 of [spec.md](./spec.md) Story 2 pass. Re-open flow verified (T030+T033): an accepted idea moves back to `under_review`, prior `evaluations` row remains in DB, current feedback is hidden until a new decision is recorded.

---

## Phase 5: User Story 3 — Self-service registration and role assignment (Priority: P3)

**Goal**: A visitor can register (subject to EPAM email and password rules), is created as a Submitter, and an Admin can promote/demote other users without leaving zero admins.

**Independent Test**: From a signed-out state, register `someone@epam.com` with a valid password → land on `/ideas` as a Submitter (verified by absence of admin links). Then as the seeded admin, promote that user via `/admin/users`; the user signs in again and now sees admin pages. Attempting to register with `someone@gmail.com` is rejected; attempting to demote the last remaining admin is rejected.

### Implementation for User Story 3

- [ ] T035 [US3] Extend `app/actions/auth.ts` (T020) with a `register(formData)` server action per [contracts/server-actions.md](./contracts/server-actions.md): validates email (domain allow-list via `lib/validation.validateEmail`) and password (`validatePassword`), checks uniqueness against `users` (returns `fieldErrors.email='already_registered'` if taken), inserts a row with `role='submitter'` and `password_hash` from `lib/auth.hashPassword`, issues a session cookie, redirects to `/ideas`. Depends on T010, T012.
- [ ] T036 [US3] Create `app/(auth)/register/page.tsx`: form mirroring the sign-in page using shadcn `Input`, `Label`, `Button`, `Card`, bound to `register` (T035). Renders per-field errors via `FormError`. Includes a link back to `/sign-in`. Depends on T016, T018, T035.
- [ ] T037 [P] [US3] Update the sign-in page (T021) to link to `/register` and the register page (T036) to link to `/sign-in`; verify both links work without authentication. Depends on T021, T036.
- [ ] T038 [US3] Implement `app/actions/users.ts` `setRole(targetUserId, role)` server action per [contracts/server-actions.md](./contracts/server-actions.md): calls `requireAdmin()`, validates `role` against `ROLES`, blocks the demote-the-last-admin case (`SELECT COUNT(*) FROM users WHERE role='admin'` must remain ≥ 1 after the change), updates the row, calls `revalidatePath('/admin/users')`. Returns `'forbidden' | 'not_found' | 'invalid_role' | 'would_leave_no_admin'`. Depends on T007, T009, T012.
- [ ] T039 [US3] Create `app/(portal)/admin/users/page.tsx`: admin-only (via the `(portal)` layout + `requireAdmin()`) server component listing every user (email, role, created-at via date-fns). Each row exposes a shadcn `Select` of `ROLES` submitting through a tiny `<form action={setRole}>` wrapper; renders `would_leave_no_admin` errors inline via `FormError`. Depends on T038, T018.
- [ ] T040 [P] [US3] Update the portal layout (T016) so the top-nav "Admin" and "Users" links use `getCurrentUser().role === 'admin'` to gate visibility — already partially implemented in T016; verify the "Users" link routes to `/admin/users` and the link is hidden for Submitters. Depends on T016, T039.

**Checkpoint — US3 demo**: All acceptance scenarios 1–5 of [spec.md](./spec.md) Story 3 pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, gates, and acceptance pass. No new features.

- [ ] T041 [P] Run `npm run typecheck` and fix every TypeScript error; the command MUST exit 0.
- [ ] T042 [P] Run `npm run lint` and fix every warning and error; the command MUST exit 0 (zero-warning policy from Constitution Principle I).
- [ ] T043 [P] Responsive verification per Constitution Principle II / SC-005: open every page (`/sign-in`, `/register`, `/ideas`, `/ideas/new`, `/ideas/[id]`, `/admin`, `/admin/users`) at viewport widths 320 px, 768 px, 1280 px, 1920 px in the browser; confirm no horizontal scroll and all primary actions remain reachable. Adjust Tailwind responsive utilities where needed.
- [ ] T044 Manual acceptance walk-through against [quickstart.md](./quickstart.md) Section 5 (every scenario for Story 1, Story 2, Story 3). Capture failures as fixup tasks here before declaring the feature complete.
- [ ] T045 [P] Create a minimal `README.md` at repo root with a one-paragraph project description and a link to [quickstart.md](specs/001-innovation-portal-mvp/quickstart.md). Do not duplicate quickstart content.

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (Setup)**: no dependencies; start immediately.
- **Phase 2 (Foundational)**: requires Phase 1 complete; BLOCKS all user stories.
- **Phase 3 (US1)**, **Phase 4 (US2)**, **Phase 5 (US3)**: each requires Phase 2 complete. They can run in parallel by separate developers; US2 (T033) and US3 (T040) touch files first created in US1 (T026 detail page) and Phase 2 (T016 portal layout) respectively, so when running in parallel co-ordinate around those two files.
- **Phase 6 (Polish)**: requires all desired user stories complete (minimum: US1 for an MVP demo).

### User-story dependency notes

- **US1**: ships sign-in (T020/T021) which is the only auth flow available pre-US3. The seeded admin (Phase 2 T019) is the first user that can sign in.
- **US2**: structurally depends on US1's idea pages (T026, T031 reads same data) but is functionally independent — adds status-change verbs.
- **US3**: structurally independent of US2; depends on US1's auth scaffold (T020) for the `register` action's session-cookie reuse and the layout (T016) for role-aware nav.

### Within each user story

- Server action(s) before the page(s) that bind to them.
- Page server components before the dialog/client components they embed.
- DB / data-access helpers (`lib/ideas.ts`) before pages that query them.
- Polish phase is strictly last.

### Parallel opportunities

- Phase 1: T003, T004, T005, T006 are all `[P]`.
- Phase 2: T010, T011, T013, T014, T016, T017, T018, T019 are all `[P]` and can be tackled simultaneously after T007–T009 land.
- Phase 3: T028 and T029 are `[P]` after T025.
- Phase 4: T032 and T034 are `[P]` once T030 is in place.
- Phase 5: T037 and T040 are `[P]`.
- Phase 6: T041, T042, T043, T045 are `[P]`.

---

## Parallel Example — Phase 2

```text
Once T007, T008, T009 are merged, dispatch the following in parallel:
  T010  Create lib/validation.ts
  T011  Create lib/session.ts
  T013  Create lib/visibility.ts
  T014  Create lib/attachments.ts
  T016  Create app/(auth)/layout.tsx and app/(portal)/layout.tsx
  T017  Create components/portal/StatusBadge.tsx and CategoryLabel.tsx
  T018  Create components/portal/FormError.tsx
  T019  Create scripts/seed-admin.ts and wire npm scripts
T012 (lib/auth.ts) sits in the critical path — schedule it as soon as T010 and T011 land.
```

---

## Implementation Strategy

### MVP first (User Story 1 only)

1. Phase 1 → Phase 2 → Phase 3 (US1) → Phase 6.
2. **Stop and validate**: Story 1 acceptance scenarios pass. Demo.

### Incremental delivery

1. After MVP: add Phase 4 (US2). Re-run Phase 6. Demo.
2. Add Phase 5 (US3). Re-run Phase 6. Demo.
3. Each story extends the portal without breaking the previous demo.

### Parallel team strategy

1. Whole team completes Phase 1 + Phase 2.
2. After T019: developer A on US1, developer B on US2, developer C on US3.
3. Merges coordinate around the three shared files (`app/(portal)/layout.tsx`, `app/(portal)/ideas/[id]/page.tsx`, `app/actions/auth.ts`).

---

## Notes

- No test tasks are or will be added (Constitution Principle V). The single automated gates are `npm run typecheck` and `npm run lint` (zero warnings).
- Every task lists the exact files it produces or touches; reviewers can verify scope from this list alone.
- Status transitions, visibility rules, password rule, email-domain rule, session lifetime, and attachment limits are all referenced back to their canonical definitions in [research.md](./research.md), [data-model.md](./data-model.md), or [contracts/server-actions.md](./contracts/server-actions.md) so no task re-states the rule from memory.
- Commit after each task (or after a tight `[P]` cluster). Squash on merge to `main`.
