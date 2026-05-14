<!--
SYNC IMPACT REPORT
==================
Version change: (uninitialized template) → 1.0.0
Bump rationale: MAJOR — initial ratification of project constitution from template.

Modified principles:
- [PRINCIPLE_1_NAME] → I. Clean Code
- [PRINCIPLE_2_NAME] → II. Simple & Responsive UI/UX
- [PRINCIPLE_3_NAME] → III. Minimal Dependencies
- [PRINCIPLE_4_NAME] → IV. Simplicity Over Complexity
- [PRINCIPLE_5_NAME] → V. No Automated Test Suites

Added sections:
- Technology Stack (mandatory stack)
- Development Workflow (review process, quality gates)
- Governance

Removed sections:
- None (template placeholders fully replaced)

Templates requiring updates:
- ✅ .specify/templates/plan-template.md — Constitution Check section will be evaluated against
  these principles at /speckit.plan time. No structural edits required; the gate language is
  already principle-agnostic. Plans MUST verify: clean code, minimal deps, fixed stack,
  no test scaffolding tasks.
- ✅ .specify/templates/spec-template.md — Generic; no mandatory section additions needed.
- ✅ .specify/templates/tasks-template.md — Task generators MUST NOT emit unit/integration/E2E
  test task categories per Principle V. Existing template is principle-agnostic; enforcement
  is delegated to /speckit.tasks.
- ✅ .specify/templates/checklist-template.md — Generic; no changes required.
- ⚠ README.md / docs/quickstart.md — Not yet present in repository; no propagation needed
  until created.

Follow-up TODOs:
- None.
-->

# InnovatEPAM-Portal Constitution

## Core Principles

### I. Clean Code

All code MUST be readable, self-explanatory, and consistent. Functions and components
MUST have a single, clearly named responsibility; names MUST describe intent (no
abbreviations, no Hungarian notation). Dead code, commented-out blocks, and unused
imports MUST be removed before merge. Files MUST be formatted with the project's
configured Prettier/ESLint rules with zero warnings. Magic numbers and inline strings
that carry semantic meaning MUST be promoted to named constants.

**Rationale**: A small team and minimal dependencies make code quality the primary
defense against regressions; legibility is the cheapest substitute for an absent
automated test suite.

### II. Simple & Responsive UI/UX

Every screen MUST be usable on viewport widths from 320px (mobile) up to 1920px+
(desktop) without horizontal scrolling. Layouts MUST use Tailwind's responsive
utilities and shadcn/ui primitives; custom CSS is permitted ONLY when shadcn/ui and
Tailwind cannot express the requirement. Interactions MUST have visible states
(hover, focus, disabled, loading). UI MUST favor obvious, conventional patterns over
novel ones; if a feature requires explanation in the UI, the design MUST be
revisited.

**Rationale**: Responsive, conventional interfaces reduce user confusion and remove
the need for extensive documentation, training, or support.

### III. Minimal Dependencies

Adding a runtime dependency requires explicit justification in the plan's
Complexity Tracking table. A new dependency MUST NOT be introduced if (a) the
required functionality is already available in Next.js, React, Tailwind, or
shadcn/ui, or (b) the required functionality can be implemented in fewer than ~50
lines of clear code. Dev-only tooling (formatters, linters, type definitions) is
exempt from justification but still SHOULD be kept lean. Transitive bloat (large
packages pulled in for a single helper) MUST be rejected.

**Rationale**: Each dependency is a supply-chain, maintenance, and bundle-size
liability; minimizing them keeps the portal fast, secure, and easy to upgrade.

### IV. Simplicity Over Complexity

When two designs satisfy the same requirement, the simpler one MUST be chosen.
Premature abstraction (factories, generic wrappers, plugin systems) is prohibited
until at least two real call sites demand it. Working, shipped features take
priority over architectural elegance; refactoring is permitted only after the
feature works end-to-end. State management MUST start with React's built-in
primitives (`useState`, `useReducer`, server components); external state libraries
require justification per Principle III.

**Rationale**: The portal's value comes from delivered functionality; complexity
spent without a concrete user-facing payoff is waste.

### V. No Automated Test Suites

Unit tests, integration tests, and end-to-end test suites MUST NOT be added to this
repository. Task generators (e.g., `/speckit.tasks`) MUST NOT emit testing tasks.
Quality is upheld through Principle I (Clean Code), manual verification against the
acceptance criteria in each feature spec, and code review. Type checking via
TypeScript is REQUIRED and is not considered an automated test. Ad-hoc verification
scripts MAY exist in `scripts/` but MUST NOT be wired into a test runner or CI test
stage.

**Rationale**: The project optimizes for delivery velocity at small scale; the cost
of building and maintaining a test suite outweighs its benefit for the portal's
current scope. This principle is explicit so contributors do not silently
reintroduce it.

## Technology Stack

The following stack is fixed and MUST be used for all features:

- **Framework**: Next.js (App Router) with React.
- **Language**: TypeScript (strict mode).
- **Styling**: Tailwind CSS. No other CSS frameworks. Inline `style` props only when
  Tailwind cannot express the rule.
- **Components**: shadcn/ui as the default component library. Components MUST be
  installed via the shadcn CLI into the local `components/ui` directory and
  customized in place rather than wrapped.
- **Persistence**: SQLite (single file, local to the deployment). Access MUST be
  through a single, thin data-access module; no ORM unless justified per
  Principle III.
- **Package Manager**: One package manager per repository (chosen at init and not
  mixed). Lockfile MUST be committed.

Deviations from this stack require a documented amendment to this constitution
(MAJOR or MINOR bump, see Governance).

## Development Workflow

- Features begin with `/speckit.specify`, proceed through `/speckit.plan` and
  `/speckit.tasks`, and end with `/speckit.implement`. The Constitution Check gate
  in `plan.md` MUST pass before implementation tasks are executed.
- Pull requests MUST be reviewed by at least one contributor other than the author.
  Reviewers MUST verify: (a) compliance with all five Core Principles, (b) no new
  unjustified dependencies, (c) responsive behavior at mobile and desktop widths,
  (d) no test-suite scaffolding has been introduced.
- TypeScript compilation MUST succeed with zero errors before merge. Lint MUST
  pass with zero warnings.
- Manual acceptance: each feature spec's acceptance criteria MUST be walked through
  in the running application before the feature is marked complete.
- Commits SHOULD be small and descriptive; squash on merge is the default.

## Governance

This constitution supersedes ad-hoc practice. When a conflict arises between this
document and any other guideline, this document wins until amended.

**Amendment procedure**:

1. Propose the change via PR that edits `.specify/memory/constitution.md`.
2. Include a Sync Impact Report (as an HTML comment at the top of this file)
   describing version bump rationale, modified/added/removed sections, and any
   template files that need follow-up.
3. Update dependent templates (`plan-template.md`, `spec-template.md`,
   `tasks-template.md`, `checklist-template.md`) in the same PR when affected.
4. Merge requires the same review rules as the Development Workflow.

**Versioning policy** (semantic versioning of this document):

- **MAJOR**: Backward-incompatible governance changes or principle
  removal/redefinition.
- **MINOR**: New principle or materially expanded section added.
- **PATCH**: Clarifications, wording fixes, typo corrections, non-semantic
  refinements.

**Compliance review**: Every `/speckit.plan` execution MUST evaluate the feature
against the Core Principles in its Constitution Check gate. Violations MUST either
be removed or recorded in the plan's Complexity Tracking table with explicit
justification; unjustified violations block implementation.

**Version**: 1.0.0 | **Ratified**: 2026-05-14 | **Last Amended**: 2026-05-14
