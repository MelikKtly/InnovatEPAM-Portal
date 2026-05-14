# Feature Specification: InnovatEPAM Portal MVP

**Feature Branch**: `001-innovation-portal-mvp`

**Created**: 2026-05-14

**Status**: Draft

**Input**: User description: "InnovatEPAM Portal is a comprehensive digital platform designed to streamline the innovation process within EPAM, enabling employees to submit creative ideas, facilitating expert evaluation, and managing the implementation of top-tier innovations. High-Level Features: (1) User Authentication System — employee registration with email and password, login/logout, role-based access (Submitter, Admin/Evaluator). (2) Intelligent Idea Submission System — title, description, category (Technical Innovation, Process Improvement, Client Solutions, Cost Reduction), single file attachment per idea, listing page, detail view. (3) Admin Evaluation Workflow — status tracking (submitted → under review → accepted/rejected), accept/reject with written feedback, admin dashboard."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit and browse innovation ideas (Priority: P1)

An EPAM employee signs in to the portal, fills out an idea submission form (title, description, category, optional single attachment), and submits it. The idea immediately appears in a portal-wide listing where the employee — and any other signed-in user — can open it to see the full details, attachment, current status, and category.

**Why this priority**: This is the core value proposition of the portal. Without the ability to capture and surface ideas, no other workflow has meaning. A minimal Submitter login (single seeded account is acceptable for this slice) plus the submission and listing flow already constitutes a usable MVP that employees can demo and use to start collecting ideas.

**Independent Test**: A signed-in Submitter creates an idea with each of the four categories and with/without an attachment, then opens the listing and confirms each idea is visible with correct title, category, status of "submitted", and that the detail view exposes the description and downloadable attachment. Delivers value: ideas are captured and discoverable.

**Acceptance Scenarios**:

1. **Given** a signed-in Submitter on the submission form, **When** they enter a title, description, choose a category, attach a single PDF, and submit, **Then** the system stores the idea, redirects to the new idea's detail page, shows status "submitted", and displays the attachment as downloadable.
2. **Given** at least one submitted idea exists, **When** any signed-in user opens the ideas listing, **Then** every submitted idea appears with title, category, submitter identity, submission date, and current status, sorted with most recent first.
3. **Given** a Submitter on the submission form, **When** they leave the title or description empty and try to submit, **Then** the system blocks submission and shows an inline message identifying each missing field.
4. **Given** a Submitter on the submission form, **When** they attach a second file before submitting, **Then** the second file replaces the first (only one attachment per idea is retained).
5. **Given** an idea has been submitted with an attachment, **When** any signed-in user opens its detail view and clicks the attachment, **Then** the original file is delivered with its original filename and content type.

---

### User Story 2 - Admin evaluates and decides on ideas (Priority: P2)

An Admin/Evaluator signs in, opens an admin dashboard listing every submitted idea with its current status, picks an idea to review, moves it to "under review", and ultimately either accepts or rejects it with written feedback. The submitter and any other viewer of the idea can see the updated status and the feedback text on the idea's detail view.

**Why this priority**: Capturing ideas (P1) is only useful if there is a transparent path to a decision. This story turns the portal from a suggestion box into an innovation pipeline. It depends on P1 but is independently shippable once P1 exists.

**Independent Test**: With several ideas already submitted, an Admin signs in, opens the dashboard, advances one idea through "under review" then "accepted" with feedback, and advances another to "rejected" with feedback. Then any user opens each idea's detail page and confirms the new status, the decision, and the feedback text are visible. Delivers value: ideas reach a documented decision.

**Acceptance Scenarios**:

1. **Given** an Admin on the admin dashboard, **When** the page loads, **Then** all ideas across all statuses are listed with filters or grouping by status, each row showing title, submitter, category, current status, and submission date.
2. **Given** an Admin viewing an idea in status "submitted", **When** they mark it as "under review", **Then** the idea's status becomes "under review" everywhere it is displayed, including the submitter's view.
3. **Given** an Admin viewing an idea in status "submitted" or "under review", **When** they choose "accept" and enter feedback text, **Then** the idea's status becomes "accepted", the feedback is stored, and the idea's detail view shows both the new status and the feedback to all viewers.
4. **Given** an Admin viewing an idea, **When** they choose "reject" with feedback text, **Then** the idea's status becomes "rejected" and the feedback is shown on the detail view to all viewers.
5. **Given** an Admin attempts to accept or reject an idea, **When** the feedback field is empty, **Then** the system blocks the decision and prompts the Admin to enter feedback.
6. **Given** a Submitter (non-admin) is signed in, **When** they try to open the admin dashboard or invoke any status/decision action, **Then** the system denies access and shows an authorization error.

---

### User Story 3 - Self-service registration and role assignment (Priority: P3)

A new EPAM employee registers an account with email and password, signs in, and lands in the portal as a Submitter. Admins can elevate selected accounts to the Admin/Evaluator role so the evaluation workflow can scale beyond the initially seeded admin.

**Why this priority**: P1 and P2 can launch with a small set of seeded accounts. Self-service registration and role management are required for the portal to scale to the wider EPAM employee base but are not required to prove the core flow. This slice depends on the auth scaffold introduced in P1 and the admin context introduced in P2.

**Independent Test**: A fresh visitor opens the registration page, creates an account with an EPAM-style email and a password, signs in, and confirms they can submit ideas (Submitter capabilities only). An existing Admin then promotes that account to Admin/Evaluator, the newly promoted user signs in again, and confirms they now see the admin dashboard. Delivers value: the portal can onboard new employees and operate without manual database seeding.

**Acceptance Scenarios**:

1. **Given** a visitor on the registration page, **When** they submit a valid email and a password that meets the password rules, **Then** an account is created with the Submitter role, they are signed in, and redirected to the ideas listing.
2. **Given** a visitor attempts to register, **When** the email is already in use, **Then** registration is rejected with a clear message and no duplicate account is created.
3. **Given** a registered user on the sign-in page, **When** they enter correct credentials, **Then** they are signed in and routed to the ideas listing (Submitter) or admin dashboard (Admin/Evaluator).
4. **Given** a signed-in user on any page, **When** they click "sign out", **Then** their session ends and they are returned to the sign-in page; protected pages are no longer reachable without signing in again.
5. **Given** an Admin on a user-management view, **When** they change another user's role from Submitter to Admin/Evaluator and save, **Then** that user gains admin capabilities on their next page load or sign-in.

---

### Edge Cases

- An attachment exceeds the maximum allowed file size (see Assumptions) — submission is blocked with a message stating the limit; the rest of the form is preserved.
- An attachment uses an unsupported file type — submission is blocked with a message listing supported types (documents, PDFs, images).
- A Submitter edits the form and navigates away without submitting — unsaved input is discarded (no draft persistence in this release).
- Two Admins act on the same idea simultaneously — the last decision saved wins; the resulting status and feedback reflect the most recent action.
- A user attempts to access an idea detail URL while signed out — they are redirected to sign-in and, after authenticating, returned to the requested idea.
- An attachment file is missing on disk when a viewer clicks download — the system surfaces a clear "attachment unavailable" error without crashing the detail page.
- A password reset is not in scope for this release — users who forget their password must contact an Admin to issue a new one.

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & Authorization**

- **FR-001**: System MUST allow visitors to register an account using an email address and a password.
- **FR-002**: System MUST reject registration when the email is already associated with an existing account.
- **FR-003**: System MUST authenticate users by email and password and maintain a signed-in session until the user signs out or the session expires.
- **FR-004**: System MUST provide a sign-out action that ends the current session.
- **FR-005**: System MUST assign every newly registered account the Submitter role by default.
- **FR-006**: System MUST support exactly two roles in this release: Submitter and Admin/Evaluator.
- **FR-007**: System MUST allow an Admin/Evaluator to change another account's role.
- **FR-008**: System MUST restrict admin-only actions (admin dashboard, status changes, accept/reject, role management) to accounts with the Admin/Evaluator role.

**Idea Submission**

- **FR-009**: Users with the Submitter role MUST be able to submit a new idea consisting of a title, a description, and a category.
- **FR-010**: System MUST require the category to be one of: Technical Innovation, Process Improvement, Client Solutions, Cost Reduction.
- **FR-011**: System MUST allow at most one file attachment per idea; uploading a new attachment before submission MUST replace any previously selected file.
- **FR-012**: System MUST accept attachments of document, PDF, and image types; other types MUST be rejected with a clear message.
- **FR-013**: System MUST enforce a maximum attachment size (see Assumptions) and reject larger files with a clear message.
- **FR-014**: System MUST validate that title and description are non-empty before accepting a submission.
- **FR-015**: System MUST record the submitter identity, submission timestamp, and initial status of "submitted" on every accepted submission.

**Listing & Detail**

- **FR-016**: System MUST provide an ideas listing visible to any signed-in user, showing every idea with title, category, submitter, submission date, and current status.
- **FR-017**: System MUST sort the listing with most recently submitted ideas first.
- **FR-018**: System MUST provide an idea detail view showing the full title, description, category, submitter, submission date, current status, attachment (if any, downloadable), and evaluator feedback (if any).

**Evaluation Workflow**

- **FR-019**: System MUST track each idea's status as one of: submitted, under review, accepted, rejected.
- **FR-020**: System MUST allow an Admin/Evaluator to move an idea from "submitted" to "under review".
- **FR-021**: System MUST allow an Admin/Evaluator to move an idea from "submitted" or "under review" to "accepted" or "rejected".
- **FR-022**: System MUST require non-empty written feedback when an Admin/Evaluator records an "accepted" or "rejected" decision, and MUST persist that feedback with the idea.
- **FR-023**: System MUST show the current status and stored evaluator feedback on the idea detail view to all signed-in viewers.
- **FR-024**: System MUST provide an admin dashboard, restricted to Admin/Evaluator accounts, that lists every idea with status, with the ability to filter or group by status and to open each idea for action.

**General**

- **FR-025**: System MUST return signed-out visitors who request a protected page to the sign-in page, and after successful sign-in route them to the originally requested page.
- **FR-026**: System MUST surface validation and authorization failures with human-readable messages rather than generic errors.

### Key Entities

- **User**: An EPAM employee account. Attributes: unique identifier, email (unique), password credential, role (Submitter or Admin/Evaluator), creation timestamp. Relationships: a User authors zero or more Ideas; an Admin/Evaluator User records zero or more Evaluation decisions.
- **Idea**: A submitted innovation proposal. Attributes: unique identifier, title, description, category (one of the four fixed values), current status (submitted | under review | accepted | rejected), submission timestamp, last-updated timestamp. Relationships: belongs to one submitting User; has at most one Attachment; has at most one current Evaluation outcome.
- **Attachment**: A single file associated with an Idea. Attributes: original filename, content type, size, stored location reference. Relationships: belongs to exactly one Idea.
- **Evaluation**: The decision an Admin/Evaluator records on an Idea. Attributes: decision (accepted | rejected), feedback text, decision timestamp, decider identity. Relationships: belongs to exactly one Idea; references the deciding Admin/Evaluator User. (Status transitions to "under review" do not require an Evaluation record but MUST be tracked as a status change.)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A Submitter can complete a new idea submission — from opening the form to seeing the idea on the listing — in under 2 minutes on a typical connection.
- **SC-002**: An Admin can open the dashboard, review an idea, and record a decision with feedback in under 3 minutes per idea.
- **SC-003**: 100% of submitted ideas appear on the listing and on the admin dashboard within 2 seconds of submission, without a manual refresh other than navigating to the page.
- **SC-004**: Every accepted or rejected idea displays its evaluator feedback to all viewers; zero decisions are recorded without feedback.
- **SC-005**: The portal is fully usable (submission, listing, detail, dashboard, decisions) at viewport widths from 320px through 1920px without horizontal scrolling.
- **SC-006**: No Submitter can reach the admin dashboard or invoke a status change or decision action; authorization is denied in 100% of such attempts.
- **SC-007**: A new employee can complete registration and submit their first idea, with no manual admin intervention, in under 5 minutes from landing on the portal.

## Assumptions

- The portal is for EPAM employees; the registration form does not need third-party identity providers (SSO) in this release.
- Password rules follow common modern practice (minimum length around 8 characters with at least one letter and one digit); the exact policy will be finalized during planning but is not part of feature scope.
- Password reset / "forgot password" is explicitly out of scope for this release; a forgotten password is handled by an Admin re-issuing credentials.
- A single seeded Admin/Evaluator account will exist at launch to bootstrap evaluations until other accounts are promoted.
- The maximum attachment size is 10 MB per file; this is a sensible default and may be tightened or relaxed during planning without changing the feature's intent.
- Supported attachment types are: PDF, common office document formats (DOC, DOCX, TXT, MD), and common image formats (PNG, JPG, JPEG, GIF, WEBP). Any other type is rejected.
- Email notifications (e.g., notifying submitter on decision) are out of scope for this release; users see status changes by visiting the portal.
- Comments/discussion threads, voting, search, idea editing after submission, and idea deletion are out of scope for this release.
- Drafts (saving an unsubmitted idea) are out of scope for this release.
- The portal serves a single tenant (EPAM); multi-tenant isolation is not required.
- Audit history beyond "current status" and the stored Evaluation record is not required in this release.
