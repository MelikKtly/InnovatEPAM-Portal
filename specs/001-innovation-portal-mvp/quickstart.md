# Quickstart — InnovatEPAM Portal MVP

A local-dev walkthrough for getting from a fresh clone to a running portal.

## Prerequisites

- Node.js 20 LTS
- A package manager of your choice (this repo uses **npm**; pick one and stick with it per Constitution).
- Git
- macOS or Linux (Windows works via WSL2)

## 1. Install

```bash
git clone <repo-url> InnovatEPAM-Portal
cd InnovatEPAM-Portal
git checkout 001-innovation-portal-mvp
npm install
```

## 2. Configure

Copy the example env file and edit:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_PATH` | SQLite file location. | `./data/portal.db` |
| `EPAM_ALLOWED_EMAIL_DOMAINS` | Comma-separated allow-list. | `epam.com,intern.epam.com` |
| `SESSION_SECRET` | HMAC key for JWT sessions; ≥32 random bytes. | `openssl rand -hex 32` |
| `SEED_ADMIN_EMAIL` | Initial admin's email. | `admin@epam.com` |
| `SEED_ADMIN_PASSWORD` | Initial admin's password (≥10 chars, letter+digit). | `Change-Me-On-First-Login-1` |

## 3. Initialize the database

Schema runs automatically on first server start, but you can pre-create it:

```bash
npm run db:init        # runs lib/schema.sql via better-sqlite3
npm run seed:admin     # creates the initial Admin/Evaluator
```

(Both commands are idempotent: re-running them is a no-op if state is already correct.)

## 4. Run

```bash
npm run dev            # http://localhost:3000
```

Open `http://localhost:3000` — you should land on the sign-in page.

## 5. Manual acceptance walk-through

Per Constitution Principle V there is no automated test suite. Validate the build by exercising each acceptance scenario from `spec.md`:

**Story 1 — Submit & browse**

1. Sign in as the seeded admin → navigate to **Ideas → New Idea** → submit a title, description, category `Technical Innovation`, no attachment. → Idea appears on `/ideas/<id>` with status **submitted**.
2. Repeat with a PDF attachment ≤10 MB; confirm the download link on the detail page returns the file with its original name.
3. Try submitting with an empty title → inline error appears, no row created.
4. Try uploading a `.exe` file → blocked with "unsupported_type".
5. Try uploading a 15 MB file → blocked with "too_large".

**Story 2 — Admin evaluation**

1. From `/admin`, mark an idea **Under review** → status updates everywhere.
2. **Accept** an idea with feedback "Great fit for Q3 roadmap." → status flips to `accepted`, feedback appears on detail page.
3. Try **Accept** with empty feedback → blocked.
4. **Reopen** the accepted idea → status returns to `under_review`, current feedback hidden; prior evaluation still stored.
5. **Reject** the re-opened idea with new feedback → status flips, new feedback shown.
6. Sign in as a non-admin → `/admin` returns 403.

**Story 3 — Registration & role management**

1. Sign out → go to **Register** → register with `someone@epam.com` and a 10-char password containing a letter and a digit → land on `/ideas` as a Submitter.
2. Try registering with `someone@gmail.com` → blocked with "domain_not_allowed".
3. Try registering with the same EPAM email twice → second attempt blocked with "already_registered".
4. As the seeded admin, promote the new user via **Admin → Users**. Sign back in as that user → they now see `/admin`.
5. Verify rejected-idea visibility: as a Submitter, create an idea; admin rejects it; submitter sees it on their listing; another non-admin submitter does **not**.

**Responsive check**: at viewport widths 320 / 768 / 1280 / 1920 px, no horizontal scrollbar, all primary actions reachable.

## 6. Type-check & lint (only automated gates)

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # eslint . — must show zero warnings
```

These are the only checks that run before merge.

## 7. Reset

```bash
rm -rf data/           # wipes DB and attachments
npm run db:init && npm run seed:admin
```

## 8. Build & start (production-like)

```bash
npm run build
npm start
```

Confirm the same acceptance walk-through behaves identically on `npm start`.
