# LynkEdu AP Question Bank Project Status

Last updated: 2026-07-13

## Current Production

- Production domain: `https://lynkedu.com`
- Alternate domain: `https://www.lynkedu.com`
- Hosting: Cloudflare Pages project `lynkedu-ap-question-bank`
- Latest Pages deployment URL observed: `https://83e65ae1.lynkedu-ap-question-bank.pages.dev`
- Latest deployed bundle observed on production:
  - JS: `/assets/index-1HOTOWOv.js`
  - CSS: `/assets/index-h2m_05wC.css`
- Current Vite base for custom root-domain deployment: `base: '/'`
- Router: `HashRouter`

## Deployment Model

Production is currently deployed by direct Cloudflare Pages upload from the local built `dist` directory:

```powershell
npm run build
npx wrangler pages deploy dist --project-name lynkedu-ap-question-bank --branch main
```

This means production can load a newer build even if GitHub push fails. GitHub remains the desired source-control mirror, but it is not currently the only production publish path.

Hard rule: do not deploy if `npm run build` fails. Direct Pages deployment must still be followed by production URL verification.

## Git State

- Working branch: `prod-mock-pdf-fix`
- Latest local code deployed to Pages: subject-management flow refinement, committed locally as `Refine subject management flow`.
- GitHub sync status at last update: stable-push API fallback synced local HEAD tree to remote branch `prod-mock-pdf-fix`; main remains a separate remote history.

## Product Access Tiers

- Visitor:
  - Can use unit Quiz online.
  - Uses localStorage for local progress.
- Registered account:
  - Can use unit Quiz online.
  - Can generate and complete Mock Exam online.
  - Can view mistake book and practice history.
  - Progress syncs to D1.
  - These training records are product data infrastructure for teaching research, curriculum iteration, and future teacher-side analytics.
- Lynk Student (`翎英学员`):
  - Full question-bank tools.
  - Search.
  - Question set.
  - Similar-question practice.
  - Quiz PDF download.
  - Mock Exam PDF download.
  - Score-report PDF download.
  - Unit knowledge-point explanations.

Student-facing copy must use `翎英学员`, not internal certification/release labels.

Content-capacity backlog: Biology and some other subjects have comparatively small question pools. After launch stabilization, add a subject-by-subject expansion/backfill pass so low-volume units do not produce repetitive practice or weak mock coverage.

## Student Account System

- Primary login: email + password.
- Fallback login: email code for legacy accounts and recovery.
- Register route: `/register`.
- Login route: `/login`.
- Password reset route: `/reset-password`.
- Account route: `/account` with profile, email verification, password, learning-data sync, and session controls.
- D1 schema migration applied through `migrations/0002_password_auth.sql` on remote database `lynkedu-question-bank`.
- Production browser checks passed for `/login`, `/register`, `/reset-password`, and `/account` visitor account gate.

## Required Backlog

- SEO/GEO optimization for public acquisition and AI answer-engine discoverability.
- Subject question-pool expansion for low-volume subjects, especially Biology and sparse units flagged by unit-distribution audit.

## Question Pool Expansion Queue

Capacity audit on 2026-07-13 identified the first expansion queue:

1. AP Computer Science A: 105 MCQ / 8 FRQ; severe sparse units U1, U2, U3, U4, U7, U10.
2. AP Physics 1: 121 MCQ / 15 FRQ; sparse U5, U6, U8.
3. AP Biology: 153 MCQ / 30 FRQ; sparse U2, U4, U5, U7.
4. AP Computer Science Principles: 148 MCQ / 8 written-response items; U1 sparse and U3 over-concentrated.
5. AP Physics 2: 169 MCQ / 28 FRQ; total MCQ count below target but unit spread is less severe.
6. AP Environmental Science: 200 MCQ / 8 FRQ; medium risk with sparse U2, U4, U5.

Expansion is quality-gated work, not a count-only task. Each subject must use its subject-specific rendering strategy and delivery standard before new items reach Web.

## Subject Management Contract

- Student home and the header subject switcher show only `mySubjects`.
- First visit may have zero selected subjects; subject-dependent pages must show the choose-subject prompt instead of silently loading a default subject.
- Adding a subject immediately makes it the current/default subject.
- The UI must not allow removing the last selected subject once the student has selected one.
- Removing the current/default subject must immediately fall back to a remaining selected subject and update `currentSubject` and `defaultSubject` together.
- Direct URL access to `/quiz`, `/exam`, `/search`, `/mistakes`, or `/history` must use the same selected-subject guard as header navigation.

## Current Web Product Milestone

The site has entered productization for public launch:

- Chinese-first UI is mandatory.
- Website-level feature changes must update this file, `WORKLOG.md`, `DECISIONS.md`, and durable main-session memory.
- New student-facing functionality must include:
  - access-tier decision,
  - local and account-storage behavior,
  - production build verification,
  - production URL verification when deployed.
