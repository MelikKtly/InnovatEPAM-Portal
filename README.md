# InnovatEPAM Portal

A full-stack innovation management platform for employees and admins. Submitters
capture, refine and submit ideas; admins review them under a blind-review
workflow and score them across multiple dimensions.

---

## Tech Stack

- **[Next.js 14](https://nextjs.org/)** — App Router, Server Components, Route Handlers
- **[TypeScript](https://www.typescriptlang.org/)** — strict mode, end-to-end types
- **[Tailwind CSS](https://tailwindcss.com/)** + **[shadcn/ui](https://ui.shadcn.com/)** — glassmorphism design system
- **[better-sqlite3](https://github.com/WiseLibs/better-sqlite3)** — embedded relational store with WAL journaling
- **[JWT](https://jwt.io/)** (`jsonwebtoken`) + **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** — stateless sessions over an httpOnly cookie
- **[lucide-react](https://lucide.dev/)** — iconography

---

## Phases Completed

| Phase | Theme | Highlights |
| ----- | ----- | ---------- |
| **Phase 1** | Core platform | Auth (JWT + bcrypt), submitter & admin dashboards, idea CRUD, evaluation history. |
| **Phase 2** | Smart submission forms | Category-aware extra field (Tech Stack / Bottleneck / Target Client) persisted as JSON in `extra_details`. |
| **Phase 3** | Multi-media support | New `attachments` table, multi-file uploads, image thumbnails + lucide download tiles. |
| **Phase 4** | Draft management | `is_draft` flag, dual “Save as Draft / Submit” actions, owner-only `PATCH` editor, drafts hidden from admins. |
| **Phase 6** | Blind review | Identity redaction at the data layer, anonymous avatars, `IdentityHiddenBadge` until accepted/rejected. |
| **Phase 7** | Scoring | Three-dimensional rubric (impact, feasibility, innovation), star input, score breakdown grid, average pill on cards. |

---

## Default Accounts

The first time the app boots, the admin account is seeded automatically. The
test submitter account is created the first time someone signs up with that
email — or you can register it manually from the login screen.

| Role | Email | Password |
| ---- | ----- | -------- |
| Admin | `admin@epam.com` | `admin123` |
| Submitter | `test@epam.com` | `test123` |

> Change these credentials before any deployment outside `localhost`.

---

## Running Locally

### Prerequisites

- **Node.js ≥ 20.9** (managed via [nvm](https://github.com/nvm-sh/nvm) is recommended)
- **npm ≥ 10**
- macOS / Linux / WSL — better-sqlite3 builds a native binding on install

### Setup

```bash
# 1. Use the right Node
nvm use 20

# 2. Install dependencies
npm install

# 3. (Optional) configure environment
cp .env.example .env.local
# Set JWT_SECRET to a long random string in .env.local

# 4. Start the dev server
npm run dev
```

The app boots at **http://localhost:3000** (or 3001 if 3000 is taken). The
SQLite database is created on first request at `./data/portal.db` and
auto-migrates idempotently.

### Common scripts

| Script | Purpose |
| ------ | ------- |
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check the entire workspace |

### Resetting local data

The DB lives at `./data/portal.db`. Delete that file (and `./data/portal.db-wal`
/ `./data/portal.db-shm`) to start from a clean state — the seed admin will
be recreated on next boot.

---

## Project Structure

```
InnovatEPAM-Portal/
├── data/                       # SQLite DB (gitignored)
├── public/
│   └── uploads/                # User-uploaded attachments (gitignored)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/login        # Login + register screens
│   │   ├── admin/              # Admin dashboard + idea evaluation
│   │   │   └── ideas/[id]/     # Evaluation page (scoring + status)
│   │   ├── api/
│   │   │   ├── auth/           # Login / register / logout route handlers
│   │   │   └── ideas/          # POST/GET, PATCH, /[id]/evaluate
│   │   ├── ideas/              # Submitter ideas list + detail
│   │   ├── submit/             # Submission form (create + edit-draft)
│   │   └── layout.tsx          # Global chrome, theme, gradients
│   ├── components/
│   │   ├── ui/                 # shadcn-style primitives (button, card, input…)
│   │   ├── attachment-gallery.tsx
│   │   ├── extra-detail-block.tsx
│   │   ├── idea-card.tsx
│   │   ├── identity-hidden-badge.tsx
│   │   ├── score-badge.tsx
│   │   ├── score-breakdown.tsx
│   │   └── star-rating.tsx
│   ├── lib/
│   │   ├── db.ts               # better-sqlite3 connection + schema migrations
│   │   ├── session.ts          # JWT issue/verify, getCurrentUser()
│   │   ├── ideas-query.ts      # Server-side idea queries
│   │   ├── attachments-query.ts
│   │   ├── extra-fields.ts     # Category-specific form definitions
│   │   ├── uploads.ts          # Multipart helpers (persist, parse removals)
│   │   ├── blind-review.ts     # Identity redaction
│   │   └── idea-constants.ts   # Categories, statuses
│   └── proxy.ts                # Cookie-presence gate (Next.js middleware)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Architecture Notes

### Database

- **Engine.** `better-sqlite3` opens a single connection cached on
  `globalThis.__portalDb` so HMR doesn't multiply file handles. WAL journal
  mode is enabled and foreign keys are turned on at boot.
- **Schema.** `users`, `ideas`, `evaluations`, `attachments`. All migrations
  are idempotent — `CREATE TABLE IF NOT EXISTS` plus `PRAGMA table_info` /
  `ALTER TABLE` blocks for new columns. Existing single-file uploads are
  backfilled into the `attachments` table on first boot after Phase 3.
- **No ORM.** Prepared statements only; types are hand-written and shared
  across the API/server-component layer.

> Restart `npm run dev` after pulling new schema changes — the cached
> connection survives HMR and won't pick up new migrations otherwise.

### Auth & sessions

- Passwords are hashed with **bcryptjs cost 12**.
- Sessions are **JWT (HS256, 7-day TTL)** stored in an `httpOnly`,
  `SameSite=Lax` cookie named `portal_session`.
- `src/proxy.ts` (Next.js middleware) only checks cookie *presence* and
  redirects unauthenticated users to `/login`. Real verification happens
  server-side in `getCurrentUser()` / route handlers, so cookies can never
  forge a role.

### Routing & data flow

- App Router with **Server Components by default**. Forms that need local
  state (`/submit`, evaluation form) are isolated client components.
- All idea/attachment writes go through **route handlers** under
  `/api/ideas/...`. Server Components read directly from `lib/*-query.ts`
  helpers — no internal HTTP calls.
- Route params are `Promise<{ id: string }>` (Next.js 14 async params).

### Drafts (Phase 4)

- `ideas.is_draft` boolean column.
- Admin queries explicitly `WHERE is_draft = 0`. Admin detail page 404s drafts.
- Owner detail page redirects drafts to `/submit?draft=<id>`.
- `PATCH /api/ideas/[id]` is owner-only and refuses to edit non-drafts (409),
  so submitted ideas are immutable once finalised.

### Blind review (Phase 6)

- `redactIdentity()` strips `submitter_email` from query results until the
  idea status is `accepted` or `rejected` — applied at the data layer so the
  email never reaches the client during blind review.
- `<Avatar anonymous />` and `<IdentityHiddenBadge />` give a clear visual
  signal in the admin UI.

### Scoring (Phase 7)

- `evaluations.{impact_score, feasibility_score, innovation_score}` (1–5,
  CHECK constraints).
- Star input on the evaluation form; cards and detail pages render a colour-
  scaled `<ScoreBadge />` plus a `<ScoreBreakdownGrid />` of the latest
  evaluation, with the average computed in SQL.

### File uploads (Phase 3)

- Multipart `FormData` parsed natively by the route handler. Each file is
  capped at **10 MB**.
- Files are stored under `public/uploads/<uuid><ext>` so Next.js serves them
  as static assets. Metadata (original name + MIME type) lives in the
  `attachments` table.
- `<AttachmentGallery />` renders image thumbnails or a lucide icon tile +
  download button per file, with the glass aesthetic shared across the app.

### UI / Design system

- Tailwind v4 with `@theme inline` for design tokens. A `.glass-card`
  utility plus fixed radial gradients on `<body>` provide the glassmorphism
  baseline.
- shadcn-equivalent primitives are hand-rolled in `src/components/ui/`
  (button with `gradient` variant, card, input, textarea, label, badge, toast).

---

## Developer

**Melikatilla** — May 2026
