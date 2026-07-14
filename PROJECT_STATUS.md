# LynkEdu AP Question Bank Project Status

Last updated: 2026-07-14

## Current Production

- Production domain: `https://lynkedu.com`
- Alternate domain: `https://www.lynkedu.com`
- Hosting: Cloudflare Pages project `lynkedu-ap-question-bank`
- Latest Pages deployment URL observed: `https://d5c8f7c8.lynkedu-ap-question-bank.pages.dev`
- Latest deployed bundle observed on production:
  - JS: `/assets/index-Be2xE0yd.js`
  - CSS: `/assets/index-Bqxh0FeN.css`
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
- Cloudflare Workers WebCrypto PBKDF2 iteration cap is 100000. Password hashing must stay at or below `PASSWORD_HASH_ITERATIONS = 100000`; higher stored iteration counts are treated as unverifiable instead of throwing in Functions.

## Student Rendering Contract

- Online Quiz, online Mock MCQ, FRQ player, review pages, search, and PDF surfaces must share the same `MathText` rendering path.
- CSA code must render through code elements (`.math-code-block` or `.math-inline-code`); raw Markdown code fences must never be visible to students.
- Grouped MCQ context is student-visible content, not audit-only metadata. If a question has `group_context`, Quiz, Search, review, and PDF displays must render `group_context` before the member stem through the same `MathText` path.
- CSA missing-code prompts must be answerable from the student surface. A prompt containing `/* missing code */` or equivalent must include the referenced Java block in `text` or `group_context`, and the placeholder must appear inside a fenced Java block.
- CSA Roman-numeral candidate lists (`I.`, `II.`, `III.`) must render as structured rows, with the label column separated from the expression/content column. Source text like `III.s1.equals(s4)` is a hard cleanup failure.
- Formula-heavy subjects must render LaTeX through KaTeX (`.katex`) on student answer paths, not as raw delimiters or flattened text.
- `scripts/student_flow_audit.cjs` now samples subject-specific render-risk questions and fails on missing code/formula render layers for Quiz, Mock MCQ, and FRQ player.
- Representative evidence on 2026-07-14: CSA student-flow audit passed with 0 errors on a fresh preview port; Calculus AB student-flow audit passed with 0 errors on a fresh preview port.

## Required Backlog

- SEO/GEO optimization for public acquisition and AI answer-engine discoverability.
- Subject question-pool expansion for low-volume subjects, especially Biology and sparse units flagged by unit-distribution audit.

## Global Content Delivery SOP

- Top-level SOP: `docs/GLOBAL_QUESTION_BANK_SOP.md`.
- Structured rendering contract: `docs/STRUCTURED_PROMPT_DELIVERY_CONTRACT.md`.
- Unit classification contract: `docs/UNIT_CLASSIFICATION_STANDARD.md`.
- Expansion ledger: `docs/QUESTION_POOL_EXPANSION_2026-07-13.md`.
- `npm run validate` now starts with `validate:sop`, which checks that these SSoT files and the required delivery gates remain present.
- Any new subject, source expansion, item batch, or major diagnosis must follow the lifecycle in `GLOBAL_QUESTION_BANK_SOP.md`: source approval, subject risk discovery, reconstruction, unit review, student-surface verification, local publish, deployment verification, SSoT update, and remote tree sync.
- A count increase is not completion. Completion requires accepted/rejected/deferred source decisions, subject-specific rendering checks, learning-sequence unit review, full validation/build, student-path evidence, and closeout notes.

## Question Pool Expansion Queue

Capacity audit on 2026-07-13 identified the first expansion queue:

1. AP Computer Science A: completed; now 291 MCQ / 12 FRQ and capacity risk OK.
2. AP Physics 1: 121 MCQ / 15 FRQ; sparse U5, U6, U8.
3. AP Biology: 153 MCQ / 30 FRQ; sparse U2, U4, U5, U7.
4. AP Computer Science Principles: 148 MCQ / 8 written-response items; U1 sparse and U3 over-concentrated.
5. AP Physics 2: 169 MCQ / 28 FRQ; total MCQ count below target but unit spread is less severe.
6. AP Environmental Science: 200 MCQ / 8 FRQ; medium risk with sparse U2, U4, U5.

Expansion is quality-gated work, not a count-only task. Each subject must use its subject-specific rendering strategy and delivery standard before new items reach Web.

CSA expansion closeout on 2026-07-13:

- Published 186 net-new MCQ relative to the pre-expansion 105-item CSA package.
- Final package: 291 MCQ / 12 FRQ.
- Sources added: 2025 current CED, AP Bowl 2018 public practice, CSAwesome / Runestone open-curriculum practice, and a small LynkEdu U1 original practice batch.
- Added and updated `npm run audit:csa` for CSA-specific structured-content and source-metadata checks.
- Validation passed: `npm run audit:csa`, `npm run validate`, `npm run build`, CSA render audit, CSA student-flow audit, capacity audit, and `npm run audit:expansion-closeout -- --subject=computer-science-a --status=complete`.
- 2009 scanned released exam and AP Bowl 2015/2016 remain deferred candidates until OCR/code reconstruction is complete.
- Production data verified on `lynkedu.com`: CSA `question_bank.json` returns 291 MCQ and `frq_bank.json` returns 12 FRQ.
- GitHub source mirror: remote branch `prod-mock-pdf-fix` was synced through stable API fallback; `npm run stable:status` confirms the remote tree matches the local HEAD tree.

CSA deferred-source curated follow-up on 2026-07-14:

- Final local package: 302 MCQ / 12 FRQ.
- Added only 11 high-confidence MCQ from previously deferred scanned/OCR sources:
  - AP Bowl 2015: 5.
  - AP Bowl 2016: 4.
  - 2009 released exam: 2.
- Remaining AP Bowl 2015/2016 and 2009 candidates are not published; each is recorded in source reports with reject/defer reasons.
- 2009 GridWorld-era items are blocked from current CSA practice unless a separate legacy mode is explicitly created.
- 2009 FRQ is still deferred until CSA-specific FRQ prompt/reference-solution/scoring-row reconstruction passes.
- Latest validation passed: CSA audit, full validate, capacity, unit progression, render, student-flow, and build.

CSA rendering/answerability repair on 2026-07-14:

- Repaired `2014_sample_Q08` and `2014_sample_Q09` so the shared `TimeRecord` class declaration is published as consistent `group_context` with `group_id`, `group_members`, `group_role`, and `requires_group_context`.
- Repaired `ap_bowl_2018_Q33` candidate statements so `I.`, `II.`, and `III.` are normalized and rendered as structured rows.
- Updated `QuestionCard` and `QuestionDisplay` so grouped context appears in Quiz, Search/review, and PDF surfaces.
- Updated `scripts/csa_content_audit.cjs` so CSA answerability checks use the full student-visible prompt (`group_context + text`) and block missing-code prompts without Java context plus malformed Roman candidate labels.
- Verification passed: `npm run audit:csa`, `npm run validate`, `npm run build`, and real-browser Quiz checks for `2014_sample_Q08` plus `ap_bowl_2018_Q33`.
- Deployed to Cloudflare Pages: `https://d5c8f7c8.lynkedu-ap-question-bank.pages.dev`; production `lynkedu.com` data check confirms 302 CSA MCQ, Q08/Q09 `group_context`, and Q33 Roman label cleanup.

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
