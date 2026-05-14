# Phase 1 — Data Model

**Feature**: InnovatEPAM Portal MVP
**Database**: SQLite (single file at `./data/portal.db`)
**Driver**: `better-sqlite3`
**Date**: 2026-05-14

All timestamps are stored as `INTEGER` (Unix epoch milliseconds, UTC). All IDs are `TEXT` UUID v4 strings generated server-side. Foreign keys are enabled at connection open (`PRAGMA foreign_keys = ON`).

---

## Tables

### `users`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | UUID v4. |
| `email` | TEXT | NOT NULL, UNIQUE COLLATE NOCASE | Lowercased on insert; uniqueness is case-insensitive. |
| `password_hash` | TEXT | NOT NULL | `bcryptjs.hash(plain, 12)`. |
| `role` | TEXT | NOT NULL, CHECK (`role IN ('submitter','admin')`) | Two-role model (FR-006). |
| `created_at` | INTEGER | NOT NULL | epoch ms. |

Index: implicit on `email` (unique).

### `ideas`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | UUID v4. |
| `submitter_id` | TEXT | NOT NULL, REFERENCES `users(id)` ON DELETE RESTRICT | The author. |
| `title` | TEXT | NOT NULL, CHECK (`length(trim(title)) > 0`) | Trimmed before insert. |
| `description` | TEXT | NOT NULL, CHECK (`length(trim(description)) > 0`) | |
| `category` | TEXT | NOT NULL, CHECK (`category IN ('technical_innovation','process_improvement','client_solutions','cost_reduction')`) | FR-010. |
| `status` | TEXT | NOT NULL, CHECK (`status IN ('submitted','under_review','accepted','rejected')`), DEFAULT `'submitted'` | FR-019. |
| `current_evaluation_id` | TEXT | NULL, REFERENCES `evaluations(id)` ON DELETE SET NULL | Points to the latest decision row; `NULL` when status is `submitted` or `under_review`. |
| `submitted_at` | INTEGER | NOT NULL | epoch ms. Sortable. |
| `updated_at` | INTEGER | NOT NULL | epoch ms; bumped on every status / evaluation change. |

Indexes:

- `CREATE INDEX idx_ideas_submitted_at ON ideas(submitted_at DESC);` — drives the listing's sort.
- `CREATE INDEX idx_ideas_submitter_id ON ideas(submitter_id);` — drives "my own rejected ideas" visibility query.
- `CREATE INDEX idx_ideas_status ON ideas(status);` — drives admin dashboard filtering.

### `attachments`

One-to-one with `ideas`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | UUID v4. |
| `idea_id` | TEXT | NOT NULL, UNIQUE, REFERENCES `ideas(id)` ON DELETE CASCADE | One attachment per idea (FR-011). |
| `original_filename` | TEXT | NOT NULL | Display name; sanitised on disk. |
| `content_type` | TEXT | NOT NULL | MIME type as detected at upload. |
| `size_bytes` | INTEGER | NOT NULL, CHECK (`size_bytes > 0 AND size_bytes <= 10485760`) | 10 MB cap (FR-013). |
| `storage_path` | TEXT | NOT NULL | Relative path under `data/attachments/`. |
| `created_at` | INTEGER | NOT NULL | epoch ms. |

### `evaluations`

History-preserving; one row per recorded accept/reject decision.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | UUID v4. |
| `idea_id` | TEXT | NOT NULL, REFERENCES `ideas(id)` ON DELETE CASCADE | |
| `decider_id` | TEXT | NOT NULL, REFERENCES `users(id)` ON DELETE RESTRICT | Must be a user with role `admin` at decision time (enforced in app code, not at DB level). |
| `decision` | TEXT | NOT NULL, CHECK (`decision IN ('accepted','rejected')`) | |
| `feedback` | TEXT | NOT NULL, CHECK (`length(trim(feedback)) > 0`) | FR-022. |
| `decided_at` | INTEGER | NOT NULL | epoch ms. |

Index: `CREATE INDEX idx_evaluations_idea_id ON evaluations(idea_id, decided_at DESC);` — quick lookup of "latest" decision per idea (also referenced via `ideas.current_evaluation_id`).

### `schema_version`

| Column | Type | Constraints |
|---|---|---|
| `version` | INTEGER | PRIMARY KEY |

Single row; current value: `1`.

---

## Entity-to-Spec Mapping

| Spec entity | Tables |
|---|---|
| **User** | `users` |
| **Idea** | `ideas` |
| **Attachment** | `attachments` |
| **Evaluation** | `evaluations` (history) + `ideas.current_evaluation_id` (pointer to latest) |

---

## State Machine — Idea Status

Encoded as `ALLOWED_TRANSITIONS` in `lib/constants.ts` and enforced by `app/actions/evaluation.ts`:

```text
submitted ──► under_review ──► accepted ──┐
    │              │              ▲       │
    │              │              │       │
    │              ▼              │       │ (re-open)
    ├──► accepted ─┘              │       │
    │              ◄──────────────┘       │
    │                                     │
    └──► rejected ◄──── under_review      │
                  ◄──── submitted         │
            ▲                             │
            └─────────────────────────────┘
                    (re-open ──► under_review only)
```

Concrete rules:

- `submitted → under_review | accepted | rejected`
- `under_review → accepted | rejected`
- `accepted → under_review` (re-open; clears `current_evaluation_id`)
- `rejected → under_review` (re-open; clears `current_evaluation_id`)
- **Forbidden**: `accepted → rejected`, `rejected → accepted` (FR-021b)
- **Forbidden**: anything → `submitted` (no way back to initial state)
- Every transition into `accepted` or `rejected` MUST insert a new `evaluations` row and update `ideas.current_evaluation_id` to point at it.

---

## Validation Rules (server-authoritative)

| Field | Rule |
|---|---|
| `users.email` | Matches RFC-5322-light regex; domain is in allow-list (Q1, R5). Lowercased before storage. |
| `users.password` (plain, pre-hash) | Length ≥ 10; matches `/[A-Za-z]/` and matches `/\d/` (FR-001 after Q4). |
| `ideas.title` | Trimmed length 1–200. |
| `ideas.description` | Trimmed length 1–10000. |
| `ideas.category` | One of the four fixed values. |
| `attachments.content_type` | One of: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`, `text/markdown`, `image/png`, `image/jpeg`, `image/gif`, `image/webp`. |
| `attachments.size_bytes` | `0 < size ≤ 10 * 1024 * 1024`. |
| `evaluations.feedback` | Trimmed length 1–4000. |

---

## Visibility Predicate (used by listing query)

The `lib/visibility.ts` predicate compiles to SQL for the listing:

```sql
-- viewer is admin
SELECT * FROM ideas ORDER BY submitted_at DESC;

-- viewer is submitter (id = :viewerId)
SELECT * FROM ideas
WHERE status != 'rejected' OR submitter_id = :viewerId
ORDER BY submitted_at DESC;
```

Detail page and `/api/attachments/[id]` re-apply the same predicate in JS before returning.

---

## Lifecycle Notes

- `users` rows are never hard-deleted (we'd lose attribution); `ON DELETE RESTRICT` enforces this.
- Deleting an `idea` (not exposed in MVP) would cascade-delete its `attachments` row and `evaluations` rows; the corresponding file under `data/attachments/<id>/` would need to be removed by application code.
- `ideas.updated_at` is bumped on every status change so a future "Recently updated" filter is cheap.

---

## Initial Data

A single Admin/Evaluator is seeded by `scripts/seed-admin.ts` on first deployment (spec Assumption). Email and initial password are supplied via environment variables `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`; the script aborts if either is missing or if a user with that email already exists.
