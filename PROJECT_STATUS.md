# LynkEdu AP Question Bank Project Status

Last updated: 2026-07-22

## Current Production

- Production domain: `https://lynkedu.com`
- Alternate domain: `https://www.lynkedu.com`
- Hosting: Cloudflare Pages project `lynkedu-ap-question-bank`
- Latest Pages deployment URL observed: `https://3e28b971.lynkedu-ap-question-bank.pages.dev`
- Latest deployed bundle observed on production:
  - JS: `/assets/index-Dbek1AmI.js`
  - CSS: `/assets/index--ag2Ebom.css`
- Current Vite base for custom root-domain deployment: `base: '/'`
- Router: `BrowserRouter`

## Deployment Model

Production is currently deployed by direct Cloudflare Pages upload from the local built `dist` directory:

```powershell
npm run build
npx wrangler pages deploy dist --project-name lynkedu-ap-question-bank --branch main
```

This means production can load a newer build even if GitHub push fails. GitHub remains the desired source-control mirror, but it is not currently the only production publish path.

Hard rule: do not deploy if `npm run build` fails. Direct Pages deployment must still be followed by production URL verification.

Static data files under `/data/*` must not use long-lived edge/browser caching. `public/_headers` sets `Cache-Control: no-cache, no-store, must-revalidate` for `/data/*`; after content updates, verify both the fresh Pages deployment URL and `https://lynkedu.com/data/...` return the new question counts.

Direct production paths such as `/register`, `/login`, `/account`, and `/search` are launch-critical and must be verified on `https://lynkedu.com` after routing changes. The student app uses `BrowserRouter`; browser audit scripts must generate normal paths, not hash URLs.

## Git State

- Working branch: `prod-mock-pdf-fix`
- Latest code/data commit deployed to Pages: `abe9fa8 Complete topic-level unit classification`.
- GitHub sync status at last update: stable-push API fallback synced the local tree to remote branch `prod-mock-pdf-fix`; `npm run stable:status` is the source of truth for the latest remote commit/tree because the fallback creates API commits even when normal git push is rejected by branch-history divergence. Main remains a separate remote history.

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

Topic-classification status: 2026-07-22 all 16 active AP subjects have item-level official topic evidence for every student-visible scored item. Current student-visible scored set is 5379/5379 topic-level, 0 unit-level-only. Items outside the current official learning path are blocked from student flows rather than force-classified: Biology 36, Calculus AB 1, Physics 1 25, Physics 2 26, Physics C Mechanics 5, US Government 5. Physics 2 now has a reverse-hidden classification gate for blocked scored inventory after correcting stale Fluids migration overblocking.

## Student Account System

- Primary login: email + password.
- Fallback login: email code for legacy accounts and recovery.
- Register route: `/register`.
- Login route: `/login`.
- Password reset route: `/reset-password`.
- Account route: `/account` with profile, email verification, password, learning-data sync, and session controls.
- Email verification can be requested again from `/account` through `/api/auth/request-email-verification`; production delivery must return `delivery: "email"` and write safe provider/status metadata to `account_audit_logs`.
- D1 schema migration applied through `migrations/0002_password_auth.sql` on remote database `lynkedu-question-bank`.
- Production browser checks passed for `/login`, `/register`, `/reset-password`, and `/account` visitor account gate.
- Cloudflare Workers WebCrypto PBKDF2 iteration cap is 100000. Password hashing must stay at or below `PASSWORD_HASH_ITERATIONS = 100000`; higher stored iteration counts are treated as unverifiable instead of throwing in Functions.

## Student Rendering Contract

- Online Quiz, online Mock MCQ, FRQ player, review pages, search, and PDF surfaces must share the same `MathText` rendering path.
- Student-facing product UI is Chinese-first. Keep `public/data/subjects.json` in official/source terminology, but render course names, short names, unit names, difficulty labels, account tiers, entitlement features, and entitlement statuses through `src/utils/displayLabels.js`.
- Stable exam/product terms may remain bilingual or English when clearer: `AP`, `Quiz`, `Mock Exam`, `MCQ`, `FRQ`, `PDF`, Java/code identifiers, route names, and internal storage/API keys.
- `npm run validate:copy` blocks direct rendering of raw `subject.name`, `subject.shortName`, `unit.name`, or `unit.title` in checked student-facing files. New pages that show subjects or units must import the display-label helpers instead of reading source labels directly.
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
- Completion of all-subject classification work requires all active student-visible scored items to pass `validate:classification-coverage`, `validate:classification-accuracy`, subject-specific unit gates, `validate:topic-level-completion`, `validate:student-progression`, and `validate:classification-evidence`. `unit_level_only` must be 0 before claiming completion.
- Official framework gate: `npm run validate:official-units` is part of `npm run validate`. It checks all 16 active subjects' `classification_config.json` unit sequences against the registered official AP framework contract and requires explicit `unit_classification_authority` metadata.
- Classification accuracy contract: `npm run validate:classification-accuracy` is part of `npm run validate`. It checks hard concept-boundary regressions across active subjects, validates item-level `required_topics`/`classification_accuracy` evidence when present, and reports subjects that still have unit-level authority but no topic-level official map. Current coverage debt after the 2026-07-21 update: 13 active subjects still need full official topic-map backfill; this is not a content pass claim.
- Macro official-topic correction: current AP Macroeconomics framework places The Phillips Curve in Unit 5 Topic 5.2. Local rules and data must not classify SRPC/Phillips Curve items as U3 under the current framework unless a future official CED changes the topic map.
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
  - student Pages deployment: `https://56c101dd.lynkedu-ap-question-bank.pages.dev`;
  - admin Pages deployment: `https://c581a9af.lynkedu-admin.pages.dev`.
- Admin custom domain is live:
  - DNS record: CNAME `admin` -> `lynkedu-admin.pages.dev`, proxied, TTL Auto;
  - Pages domain status: `admin.lynkedu.com` active;
  - production check: `https://admin.lynkedu.com` returns HTTP 200 and renders `翎英教育管理后台`.
- Admin build output includes a dedicated `_headers` file from `scripts/prepare_admin_dist.cjs`: HTML is no-store and `/assets/*` is immutable. If `admin.lynkedu.com` renders blank while `pages.dev` works, verify in the real browser that the script URL returns JavaScript rather than an HTML fallback, then force a new asset hash and redeploy.
- Admin right-panel entitlement display separates active current entitlements from revoked/expired historical rows. Do not list revoked rows under “当前权益”.
- 2026-07-18 real-browser launch QA evidence:
  - `https://lynkedu.com/register` direct route renders the registration form after BrowserRouter migration;
  - test registration returned `emailVerification.delivery = "email"`;
  - account page shows `翎英学员` after admin grant and `注册会员` after admin cancellation;
  - `/search` is blocked for registered members and opens for `翎英学员`;
  - resend email verification returned `delivery: "email"` and D1 logged provider status 200;
  - admin grant, cancellation, and restore are present in `admin_audit_logs`.
- Source mirror note: latest admin-console source tree is synced to GitHub branch `prod-mock-pdf-fix` through stable API fallback. Use `npm run stable:status` for the live tree-match check; API fallback creates a remote commit id different from local Git history while preserving the same tree.

## 2026-07-20 Student Production Deploy

- GitHub source mirror is not the production closeout by itself. The live student site is Cloudflare Pages project `lynkedu-ap-question-bank`; production closeout requires direct Cloudflare Pages deployment plus `https://lynkedu.com` verification.
- Deployed student site to Cloudflare Pages:
  - Pages URL: `https://ad92b4af.lynkedu-ap-question-bank.pages.dev`;
  - production domain refreshed to `/assets/index-DKzXJdq6.js`;
  - production `QuizPlayer` chunk `/assets/QuizPlayer-La5mfC82.js` contains the `data-question-id` marker used by browser audits.
- Production verification passed on `https://lynkedu.com`:
  - `npm run audit:quiz-image-transition -- --subject macro --mobile true --url https://lynkedu.com/ --port 9674`: 0 errors;
  - `npm run audit:quiz-image-transition -- --mobile true --url https://lynkedu.com/ --port 9675`: 16 subjects, 0 errors.
- Deployment workflow rule: after GitHub source sync, still run `npx wrangler pages deploy dist --project-name lynkedu-ap-question-bank --branch main` for the student site, then verify the custom domain. Do not treat GitHub Pages status as evidence that `lynkedu.com` is current.

## 2026-07-21 Classification Accuracy Deployment

- Local commit: `a6f25b5 Add classification accuracy contract gate`.
- Remote sync: `npm run stable:status` confirms remote branch `prod-mock-pdf-fix` tree `ddccfc2a031e99bfe49f6de583432f3fdfb704b0` matches local HEAD tree; remote commit id is `f05a0ab9e75df5e5e135144a0212f836edeee498` because the stable API path creates a different commit object.
- Cloudflare Pages student deployment: `https://32233839.lynkedu-ap-question-bank.pages.dev`.
- Production data verification on `https://lynkedu.com` passed:
  - Macro `2012_Q15`, `2014_Q30`, `2015_Q17`, `2016_Q27`, `2017_Q17`, `2017_Q45`, and `2019_Q38` return `primary_unit: U5` with required topic `5.2`.
  - CSA `ap_bowl_2018_Q37` returns `primary_unit: U10`.
  - Macro `classification_config.json` returns Unit 5 topics `5.1` through `5.7`, including `5.2 The Phillips Curve`.

## 2026-07-21 Official Framework Backfill And Student-Visible Gate Hardening

- Active subject count remains 16. Every active subject now has an official topic map in `classification_config.json`.
- Current-framework migrations completed locally:
  - AP Computer Science A migrated to the Effective Fall 2025 4-unit framework: U1 Using Objects and Methods, U2 Selection and Iteration, U3 Class Creation, U4 Data Collections.
  - AP Statistics migrated to the Effective Fall 2026 5-unit framework: U1 Exploring One-Variable Data and Collecting Data, U2 Probability/Random Variables/Distributions, U3 Categorical Inference, U4 Quantitative Inference for Means, U5 Regression Analysis.
  - AP Physics 2 migrated to the Effective Fall 2024 U9-U15 sequence. Legacy Fluids items are retained only as internal blocked records with `student_visible: false` and `publish_status: blocked`.
- Validation scripts were hardened so student-facing release gates check only student-visible items. Blocked/internal records must not appear in Quiz, Mock, Search, PDF, recommendation, or student-risk outputs.
- Metadata cleanup completed for recently migrated subjects: `unit_name`, classification evidence text, and reviewed cases no longer preserve obsolete student-facing unit names.
- Local verification passed:
  - `npm run validate`: all gates passed; only the documented CSA U4 concentration warning remains in `validate:unit-distribution`.
  - `npm run build`: passed.
  - Real browser local student check on isolated preview port 4291: student home renders Chinese-first; first-visit Start Practice routes to subject settings; Settings shows 16 addable subjects; CSA Quiz uses 4 current units; generated CSA Quiz enters `/play` and displays code content with option labels and content on the same visual line.
- Remote sync:
  - Local commit `ca0fec2 Backfill official topic maps and current unit frameworks`.
  - Stable API remote commit `f5a7bad9be5f53c328e66b9d3363a64d587b6ab4`.
  - `npm run stable:status` confirmed local and remote tree `37c1546edc5d323610acb06e1cd28e6f78be2ad6` match.
- Cloudflare Pages student deployment: `https://1ac2bfcb.lynkedu-ap-question-bank.pages.dev`.
- Production verification on `https://lynkedu.com` passed:
  - HTML title returns `翎英教育题库`.
  - `subjects.json` returns 16 active subjects.
  - CSA units are U1-U4 current framework; Statistics units are U1-U5 current framework; Physics 2 units are U9-U15 current framework.
  - Student-visible old-unit residuals are 0 for CSA legacy U5-U10, Statistics legacy U6-U9, and Physics 2 legacy U1-U7.
  - Physics 2 retains 21 legacy Fluids MCQ records as blocked/internal only.
  - Real browser production check: home renders Chinese-first and `/quiz` with CSA loads from production `/data/subjects.json` and `/data/ap/computer-science-a/question_bank.json`, showing U1-U4 with current unit names.

## 2026-07-24 IB Math AA Candidate Platform Foundation

- Added non-AP assessment-model support without changing the active AP launch set.
- Active student-visible subject count remains 16. `ib-math-aa-sl` and `ib-math-aa-hl` exist only as `active:false` / `visibility:"candidate"` records.
- Added explicit `curriculum:"ap"` and `assessmentModel:"ap-mcq-frq"` metadata to existing AP subject records.
- Added IB candidate records:
  - `IB Mathematics: Analysis and Approaches SL`
  - `IB Mathematics: Analysis and Approaches HL`
- Added candidate data roots:
  - `public/data/ib/math-aa/classification_config.json`
  - `public/data/ib/math-aa/source_inventory.json`
  - `public/data/ib/math-aa-sl/paper_bank.json`
  - `public/data/ib/math-aa-hl/paper_bank.json`
- Added `scripts/assessment_model_contract_audit.cjs` and wired it into `npm run validate` as `validate:assessment-models`.
- `src/utils/questionBank.js` now separates AP MCQ/FRQ loading from IB paper-bank loading and rejects AP mock generation for non-AP assessment models.
- Verification passed:
  - `npm run validate:assessment-models`
  - `npm run validate:sop`
  - `npm run validate:data`
  - `npm run validate`
  - `npm run build`
- This is platform foundation only. Math AA is not published until canonical source selection, pilot extraction, Math AA paper-practice UI, student-surface QA, and production deployment pass.

## 2026-07-24 IB Math AA SL/HL Student-Visible Launch Candidate

- IB Math AA now uses a separate IB paper-practice model, not the AP MCQ/FRQ flow.
- Active student-facing subjects now total 18:
  - 16 AP subjects remain active under `assessmentModel: "ap-mcq-frq"`;
  - `ib-math-aa-sl` and `ib-math-aa-hl` are active under `assessmentModel: "ib-paper"`.
- Published Math AA practice inventory is LynkEdu-owned original practice content:
  - SL: `public/data/ib/math-aa-sl/paper_bank.json`, 60 paper-style items;
  - HL: `public/data/ib/math-aa-hl/paper_bank.json`, 90 paper-style items.
- Local official IB paper/markscheme inventory remains internal source-context only unless explicit publication permission is confirmed. Do not copy official IB prompt or markscheme text into the student bank without source approval.
- New student surfaces:
  - `/paper-practice` for Paper/topic/count selection;
  - `/paper-play` for IB paper-style question display, subparts, formula rendering, solution, and markscheme rows.
- New reusable evidence command:
  - `npm run audit:ib-math-aa:student-surface -- --url <fresh-preview-or-production-url> --port <port>`
  - It runs SL/HL across desktop and mobile, starts Paper training, checks formula rendering, shows solution/markscheme, advances to the next item, and blocks visible encoding damage or raw formula residue outside KaTeX output.
- Local verification passed:
  - `npm run validate`
  - `npm run audit:ib-math-aa:student-surface -- --url http://127.0.0.1:4177/ --port 9780`
  - `npm run build`
- Production deployment is still required for final上线 closeout: source sync, Cloudflare Pages deployment, and `https://lynkedu.com` production verification must be completed after this local launch candidate.
- Final production closeout completed:
  - Local content commit: `4261b3a Add IB Math AA paper practice launch candidate`.
  - Stable remote API commit: `b7d92e00e04e5e9fcdab5abc8016e3c2a42ccb43`; remote tree matched local tree `1783f1d494c5f61d995914e58159a083fc82389a`.
  - Cloudflare Pages deployment: `https://13ee85ea.lynkedu-ap-question-bank.pages.dev`.
  - Production `https://lynkedu.com/data/subjects.json`: 18 active subjects, including `ib-math-aa-sl` and `ib-math-aa-hl` with `assessmentModel: "ib-paper"`.
  - Production paper banks: SL 60 items; HL 90 items with P1/P2/P3 coverage.
  - Production student-surface audit passed: `npm run audit:ib-math-aa:student-surface -- --url https://lynkedu.com/ --port 9783`, 4 cases, 0 errors.

## 2026-07-24 Curriculum-Aware Subject Management

- Student subject management now treats curriculum as the first-level learning scope.
- Active student-facing subjects remain 18:
  - AP: 16 subjects under `curriculum: "ap"` and `assessmentModel: "ap-mcq-frq"`;
  - IB: `ib-math-aa-sl` and `ib-math-aa-hl` under `curriculum: "ib"` and `assessmentModel: "ib-paper"`.
- `SubjectContext` and `storage` now persist `currentCurriculum` alongside `currentSubject`, `defaultSubject`, and `mySubjects`.
- Home, Header, and Settings use `curriculumSubjects` so AP and IB do not appear in one mixed switcher or one mixed home list.
- Settings presents curriculum families first: AP, IB, A-Level, and international competitions. A-Level and competitions remain Coming soon until student-visible subjects are ready.
- Added reusable checks:
  - `npm run validate:curriculum-partition`
  - `npm run audit:curriculum-surface -- --url <fresh-preview-or-production-url> --port <port>`
- Local verification passed:
  - `npm run validate:curriculum-partition`: 18 active subjects across 2 curricula.
  - `npm run audit:curriculum-surface -- --url http://127.0.0.1:4321/ --port 9790`: errors 0.
  - `npm run validate`: passed.
  - `npm run build`: passed.
  - `npm run audit:ib-math-aa:student-surface -- --url http://127.0.0.1:4323/ --port 9791`: 4 cases, 0 errors.
- Production closeout completed:
  - Local commit and stable remote sync completed; final verification uses `npm run stable:status`.
  - Cloudflare Pages deployment: `https://a99ffd73.lynkedu-ap-question-bank.pages.dev`.
  - Production data check on `https://lynkedu.com`: AP 16, IB 2, SL paper bank 60, HL paper bank 90, active subjects 18.
  - Production curriculum-surface audit passed: `npm run audit:curriculum-surface -- --url https://lynkedu.com/ --port 9794`, errors 0.
  - Production IB Math AA audit passed: `npm run audit:ib-math-aa:student-surface -- --url https://lynkedu.com/ --port 9795`, 4 cases, 0 errors.
