# LynkEdu AP Question Bank Project Status

Last updated: 2026-07-17

## Current Production

- Production domain: `https://lynkedu.com`
- Alternate domain: `https://www.lynkedu.com`
- Hosting: Cloudflare Pages project `lynkedu-ap-question-bank`
- Latest Pages deployment URL observed: `https://25fee8fb.lynkedu-ap-question-bank.pages.dev`
- Latest deployed bundle observed on production:
  - JS: `/assets/index-zz9BSPum.js`
  - CSS: `/assets/index-SlSDx4HT.css`
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

Static data files under `/data/*` must not use long-lived edge/browser caching. `public/_headers` sets `Cache-Control: no-cache, no-store, must-revalidate` for `/data/*`; after content updates, verify both the fresh Pages deployment URL and `https://lynkedu.com/data/...` return the new question counts.

## Git State

- Working branch: `prod-mock-pdf-fix`
- Latest local code deployed to Pages: full CSA source-cleanup pass, local commit `e951d24 Complete CSA source cleanup pass`.
- GitHub sync status at last update: stable-push API fallback synced local HEAD tree `0f85edde29220e5d41d8fa00ffad1a8f6dfee8f9` to remote branch `prod-mock-pdf-fix` at remote commit `18b152142d306e3bffba514f512b46f23cb526b9`; main remains a separate remote history.

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

Content-capacity status: 2026-07-16 capacity reinforcement cleared the pre-launch capacity audit for all 16 active subjects. Biology, CSP, APES, Physics 1, and Physics 2 now have at least 250 MCQ each and no sparse units under the current capacity audit.

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
- Cross-unit grouped MCQ buckets are excluded from single-unit Quiz. They may appear only in cumulative/all-subject/Mock flows, and only as complete grouped buckets.
- Subject rebuild pipelines must preserve reviewed per-item metadata such as `visual_asset_review` unless the pipeline explicitly regenerates and revalidates the replacement.
- CSA missing-code prompts must be answerable from the student surface. A prompt containing `/* missing code */` or equivalent must include the referenced Java block in `text` or `group_context`, and the placeholder must appear inside a fenced Java block.
- CSA Roman-numeral candidate lists (`I.`, `II.`, `III.`) must render as structured rows, with the label column separated from the expression/content column. Source text like `III.s1.equals(s4)` is a hard cleanup failure.
- CSA open-curriculum source cleanup must remove section-heading carryover such as `FRQs`, ellipsis continuation artifacts such as `...will`, and incorrect combined variable code spans such as `` `a and b` ``. `npm run validate` includes `validate:csa`, so these CSA-specific prompt-quality checks are release-blocking.
- CSA source cleanup also covers explanations and unit classification: student-facing explanations must not contain external source links or source UI text; visible RST markup such as `.. code-block::` is a release blocker; U10 classification must have explicit recursion wording or self-call evidence in the visible prompt/code.
- Formula-heavy subjects must render LaTeX through KaTeX (`.katex`) on student answer paths, not as raw delimiters or flattened text.
- `scripts/student_flow_audit.cjs` now samples subject-specific render-risk questions and fails on missing code/formula render layers for Quiz, Mock MCQ, and FRQ player.
- `scripts/full_student_risk_audit.cjs` is now the release-blocking full item ledger for all active subjects. It checks every active MCQ/FRQ for missing prompts/options/answers, invalid units, classification mismatch, visible OCR/text corruption, table/visual references without student-visible support, code/pseudocode structure, FRQ rubric availability, and blocked/excluded item status. It writes `.workspace/full-student-risk-audit/items.jsonl`, `summary.json`, and `p1_review_pack.json`.
- Delivery completion for launch content means `npm run validate:student-risk` reports P0=0, P1=0, P2=0 across the full active item set. Sampling audits are additional evidence, not substitutes for the full ledger.
- Items with unresolved required stimulus material must be marked `publish_status: "blocked"` and `student_visible: false`, and the frontend loader must filter them before Quiz, Mock, Search, review, mistake-book, and question-set use.
- Representative evidence on 2026-07-14: CSA student-flow audit passed with 0 errors on a fresh preview port; Calculus AB student-flow audit passed with 0 errors on a fresh preview port.
- Mobile student-flow release gate must run with explicit URL, mobile viewport, and account tier. For premium surfaces, use Lynk Student account state so search, question set, similar-question practice, PDF gates, and review pages are actually exercised.
- Mobile topic images use `.question-image-wrap` / `.question-image`: wide diagrams are horizontally scrollable at a minimum readable width and must preserve natural aspect ratio. Do not add per-page image rules that compress wide figures below readability thresholds.
- Latest evidence on 2026-07-16: all 16 active subjects passed mobile student-flow audit with 0 errors / 0 warnings under Lynk Student account state.
- Latest evidence on 2026-07-17: all 16 active subjects passed mobile student-flow audit again under Lynk Student account state after the official-unit framework check was added. `npm run audit:render:all` also passed for all 16 active subjects with 0 errors / 0 warnings after `browser_render_audit.cjs` was aligned to premium account-state simulation.
- 2026-07-17 full item-ledger evidence: `npm run validate:student-risk` checked 16 active subjects and 5482 active items with P0=0 / P1=0 / P2=0. `npm run validate`, `npm run build`, and `npm run audit:render:all` passed afterward; render audit covered all 16 active subjects with 0 errors / 0 warnings.
- Browser/PDF render checks must never inspect a visitor access gate while claiming to validate premium surfaces. `browser_render_audit.cjs` now defaults to `--account internal`, seeds the same local account state used by student-flow checks, and reports a dedicated access-gate finding if a PDF page is blocked during internal-account render validation.

## Required Backlog

- SEO/GEO optimization for public acquisition and AI answer-engine discoverability.
- Subject question-pool expansion for low-volume subjects, especially Biology and sparse units flagged by unit-distribution audit.

## Global Content Delivery SOP

- Top-level SOP: `docs/GLOBAL_QUESTION_BANK_SOP.md`.
- Structured rendering contract: `docs/STRUCTURED_PROMPT_DELIVERY_CONTRACT.md`.
- Inline Roman-numeral candidate lists such as `I. ... II. ... III. ...` must render as separate structured rows even when source text stores them on one line. `MathText` owns this behavior globally.
- Unit classification contract: `docs/UNIT_CLASSIFICATION_STANDARD.md`.
- Expansion ledger: `docs/QUESTION_POOL_EXPANSION_2026-07-13.md`.
- `npm run validate` now starts with `validate:sop`, which checks that these SSoT files and the required delivery gates remain present.
- Any new subject, source expansion, item batch, or major diagnosis must follow the lifecycle in `GLOBAL_QUESTION_BANK_SOP.md`: source approval, subject risk discovery, reconstruction, unit review, student-surface verification, local publish, deployment verification, SSoT update, and remote tree sync.
- A count increase is not completion. Completion requires accepted/rejected/deferred source decisions, subject-specific rendering checks, learning-sequence unit review, full validation/build, student-path evidence, and closeout notes.
- Unit classification authority: every subject's `primary_unit` decisions must use official exam and official subject-framework materials as the only authority. For AP, use the current official Course and Exam Description/course framework plus official released/sample questions and official scoring guidelines where relevant. Third-party maps, existing labels, generated topics, and keyword scans are review aids only; they cannot justify final classification.
- Official framework gate: `npm run validate:official-units` is part of `npm run validate`. It checks all 16 active subjects' `classification_config.json` unit sequences against the registered official AP framework contract and requires explicit `unit_classification_authority` metadata.
- Psychology framework migration: AP Psychology has been migrated from the legacy 9-unit sequence to the current official 5-unit sequence. Legacy released questions are remapped to the earliest official unit after which a student can answer with prior knowledge available; pure research-method/statistics items are treated as cross-unit course skills and assigned to the earliest viable stage rather than preserving a non-official standalone unit.

## Question Pool Expansion Queue

Capacity audit on 2026-07-13 identified the first expansion queue:

1. AP Computer Science A: completed; now 291 MCQ / 12 FRQ and capacity risk OK.
2. AP Physics 1: completed 2026-07-16; now 250 MCQ / 15 FRQ; capacity risk OK.
3. AP Biology: completed 2026-07-16; now 250 MCQ / 30 FRQ; capacity risk OK.
4. AP Computer Science Principles: completed 2026-07-16; now 250 MCQ / 8 written-response items; capacity risk OK.
5. AP Physics 2: completed 2026-07-16; now 250 MCQ / 28 FRQ; capacity risk OK.
6. AP Environmental Science: completed 2026-07-16; now 250 MCQ / 8 FRQ; capacity risk OK.

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

## Admin Console Status

- Admin console architecture is separate from the student site:
  - student site: Cloudflare Pages project `lynkedu-ap-question-bank`, domains `lynkedu.com` and `www.lynkedu.com`;
  - admin site: Cloudflare Pages project `lynkedu-admin`, intended domain `admin.lynkedu.com`;
  - both projects share D1 database `lynkedu-question-bank` through binding name `DB`.
- Admin frontend build entry:
  - source entry: `admin.html`;
  - build config: `vite.admin.config.js`;
  - command: `npm run build:admin`;
  - deployment output: `dist-admin/index.html`, normalized by `scripts/prepare_admin_dist.cjs`.
- Admin APIs live under `functions/api/admin/*` and require `users.account_level = 'admin'`.
- `翎英学员` access is not an account-level string. It is determined by active `entitlements` rows, normally `feature_key = 'full_access'`, with optional `expires_at`.
- Admin capabilities now implemented:
  - direct grant, extend, and revoke of `翎英学员`;
  - invitation-code creation and deactivation;
  - redemption duration through `membership_invites.redemption_days`;
  - redemption records in `invite_redemptions`;
  - admin operation records in `admin_audit_logs`.
- Remote D1 migration `migrations/0003_admin_entitlements.sql` was applied on 2026-07-17 and verified.
- Initial admin account: `wuzehua2015@gmail.com` has `account_level = 'admin'`.
- Latest deployments:
  - student Pages deployment: `https://de8c083b.lynkedu-ap-question-bank.pages.dev`;
  - admin Pages deployment: `https://f6e5e2b7.lynkedu-admin.pages.dev`.
- Custom domain note: `admin.lynkedu.com` has been added to the Pages project, but DNS creation is still pending because the current Cloudflare login has Zone read but not DNS write permission. Required DNS record: CNAME `admin` -> `lynkedu-admin.pages.dev`, proxied.
