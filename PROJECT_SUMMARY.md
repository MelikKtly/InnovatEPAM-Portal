# InnovatEPAM Portal - Project Summary

## Overview
InnovatEPAM Portal is a web application built with Next.js 14 that enables EPAM employees
to submit innovative ideas and allows administrators to evaluate and track them from
submission to final decision.

## Phases Completed

### Phase 1: Core Portal ✅
- [x] User registration with email/password
- [x] User login/logout
- [x] Role-based access (submitter/admin)
- [x] Idea submission form with file attachment
- [x] Idea listing page
- [x] Status tracking (submitted → under review → accepted/rejected)
- [x] Admin evaluation workflow with feedback

## Technical Decisions

### Technology Stack
- Framework: Next.js 14 (App Router)
- UI: React + Tailwind CSS + shadcn/ui
- Storage: SQLite (better-sqlite3)
- Auth: JWT (jsonwebtoken) + bcryptjs
- Key Libraries: date-fns, uuid

### Key Architecture Decisions
- Used SQLite for simplicity (no external DB setup needed)
- JWT stored in httpOnly cookies for security
- App Router with Server Components for data fetching

## Challenges & Solutions

### Challenge 1: File Upload in Next.js App Router
**Solution:** Used native FormData API with Next.js route handlers

### Challenge 2: Role-based Route Protection
**Solution:** Implemented middleware.ts to check JWT on every protected route

## AI Collaboration

### Tools Used
- GitHub Copilot (VS Code)
- SpecKit CLI for specification-driven development

### What Worked Well
SpecKit's spec → plan → tasks workflow kept the implementation focused.
Copilot generated accurate code when given detailed context from specs.

### What Could Be Improved
Initial prompts needed more specific context about file structure.

## Time Breakdown

| Phase | Actual |
|-------|--------|
| Setup & SpecKit | 30 min |
| Phase 1: Core Portal | 6 hours |
| Documentation | 30 min |

## Reflection

### Key Learning
Specification-driven development with SpecKit forced me to think through requirements
before coding, which resulted in fewer rewrites and cleaner architecture.

### SDD vs Vibe Coding
With SpecKit, I had clear acceptance criteria before writing any code.
This made AI prompts much more effective because I could reference specific requirements.

---
*Submitted by: Melikatilla*
*Date: 14 May 2026*
*Course: A201 - Beyond Vibe Coding*
