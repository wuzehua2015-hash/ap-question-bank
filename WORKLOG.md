# LynkEdu Worklog

## 2026-07-18

- Completed real production browser QA for student account and admin entitlement flows on `lynkedu.com` / `admin.lynkedu.com`:
  - migrated student routing from hash URLs to direct `BrowserRouter` paths and updated browser audit scripts to use normal paths;
  - verified `/register` renders on the production domain and created a real test account through the online registration page;
  - verified registration email delivery is accepted by Resend and recorded in D1 account audit metadata;
  - added `/api/auth/request-email-verification` plus `/account` “重新发送验证码” controls with server-side 60-second cooldown and safe email diagnostics;
  - verified admin grant, cancellation, and restoration of `翎英学员` using the real admin page;
  - verified student account level and `/search` access change correctly after grant/cancellation/restore;
  - improved admin entitlement panel so active current entitlements and revoked/expired historical rows are separated;
  - hardened admin deployment cache behavior by generating `dist-admin/_headers` with no-store HTML and immutable asset headers.
- Validation/deployment evidence:
  - `npm run validate` passed;
  - `npm run build` passed and student Pages deployed to `https://56c101dd.lynkedu-ap-question-bank.pages.dev`;
  - `npm run build:admin` passed and admin Pages deployed to `https://c581a9af.lynkedu-admin.pages.dev`;
  - real browser confirmed `admin.lynkedu.com` renders after forcing a new asset hash and the entitlement panel shows “历史记录（1）” separately from current active access.

## 2026-07-16

- Updated unit-classification authority rule after user clarified classification must use official exam and subject framework materials as the only source of truth:
  - `docs/UNIT_CLASSIFICATION_STANDARD.md` now states official exam/framework materials are the only authority for `primary_unit`;
  - `docs/GLOBAL_QUESTION_BANK_SOP.md` now requires current official framework confirmation before classifying new or changed items;
  - `PROJECT_STATUS.md` records third-party maps, existing labels, generated topics, and keyword scans as review aids only, never final classification evidence.

- Completed pre-launch capacity reinforcement across all active low-volume subjects:
  - added `scripts/add_capacity_reinforcement_20260716.cjs` as an idempotent owned-content publisher;
  - published LynkEdu-owned MCQ under `source_set: lynkedu_capacity_20260716`;
  - updated question banks and similarity indexes for Biology, CSP, APES, Physics 1, and Physics 2;
  - final counts: Biology 250 MCQ, CSP 250 MCQ, APES 250 MCQ, Physics 1 250 MCQ, Physics 2 250 MCQ;
  - source reports written under each subject's `02-data/lynkedu_capacity_20260716/source_report.json`.
- Capacity verification:
  - `npm run audit:capacity`: all 16 active subjects risk OK;
  - `npm run validate:unit-distribution`: 0 warnings;
  - `npm run validate:student-progression -- --skip-browser`: 0 errors / 0 warnings / 0 findings;
  - `npm run validate`: passed;
  - `npm run build`: passed;
  - student-flow audits for Biology, CSP, APES, Physics 1, and Physics 2 passed with 0 errors.
- 2026-07-17 full student-risk audit rebuilt from sampling-only checks into a full item-ledger gate.
  - Added `scripts/full_student_risk_audit.cjs`, `audit:student-risk`, and release-blocking `validate:student-risk`.
  - The gate now checks all active MCQ/FRQ items, writes `.workspace/full-student-risk-audit/items.jsonl`, and must finish with P0/P1/P2 all equal to 0.
  - Repaired true findings found by the ledger: Chemistry missing visual bindings, Physics C:E&M missing visual context, Physics 2 missing table data, Macro FRQ table data, Psychology graph/table data and assets, Statistics missing regression equation, CSP data-table structure, and hidden unresolved AP Gov visual-stimulus items from student delivery with `publish_status: "blocked"` and `student_visible: false`.
  - Added frontend filtering for blocked/non-student-visible items and upgraded `MathText` so same-line Roman candidate lists render as structured rows.
  - Verification passed: `npm run validate` (including student-risk 5482 items P0=0/P1=0/P2=0), `npm run build`, and `npm run audit:render:all` for all 16 active subjects with 0 errors / 0 warnings.
  - Deployed to Cloudflare Pages: `https://cadaa5d0.lynkedu-ap-question-bank.pages.dev`; production `lynkedu.com` observed `/assets/index-zz9BSPum.js` and `/assets/index-SlSDx4HT.css`.
  - GitHub stable sync completed through API fallback: local tree `ad0c19c43a9456b269146a94de7ff60455dc1e42` matches remote branch `prod-mock-pdf-fix` remote commit `8919880462320c24a0f547283bfe42e375cf3119`.

- 2026-07-17 CSA prompt-quality repair after user found CSAwesome MCQ cleanup issues:
  - repaired `csawesome_practice_Q019` so the ArrayList `numQuest` prompt no longer includes the source section heading `FRQs` and renders the initial list plus Java method as structured code;
  - repaired `csawesome_practice_Q111` so the boolean variables and `!a && !b` expression render cleanly without `...will` continuation text or a combined `` `a and b` `` code span;
  - completed a full CSA source-cleanup pass after follow-up review: repaired `csawesome_practice_Q116` so two adjacent RST code blocks render as separate student-visible blocks, corrected its unit from U10 to U8, and removed external source links from CSAwesome explanations in `Q110`, `Q115`, `Q120`, and `Q122`;
  - updated `scripts/csa_content_audit.cjs` to block source section-heading carryover, ellipsis continuation artifacts, and combined boolean-variable code spans;
  - expanded `scripts/csa_content_audit.cjs` to check explanations, visible RST/source markup, external source links in explanations, and U10 recursion evidence;
  - added `validate:csa` to the global `npm run validate` chain;
  - updated the local CSAwesome source builder at `subjects/AP/Computer-Science-A/tools/build_csawesome_data.py` so code-block parsing respects actual RST code indentation and feedback cleanup removes external links; updated the generated CSAwesome source data copy so future local rebuilds keep the same cleanup.
  - Verification passed: Web CSA residual scan found 0 artifacts, CSAwesome source-data residual scan found 0 artifacts, `npm run validate:csa` passed, and full `npm run validate` passed.
  - Build/render/deploy evidence before final deploy: `npm run build`, `npm run audit:render -- --subject=computer-science-a`, Cloudflare Pages deployment `https://6a7c8cbc.lynkedu-ap-question-bank.pages.dev`, production data checks for `Q019` and `Q111`, and stable-push remote tree match at remote commit `49315a50c802f1d4b51a67e1dd38d4ef80e0f9f1`.
  - Final full-clean deployment: Cloudflare Pages `https://25fee8fb.lynkedu-ap-question-bank.pages.dev`; production data checks for Q110/Q115/Q116/Q120/Q122 passed, including Q116 `primary_unit: U8`; stable-push remote tree matched local at remote commit `18b152142d306e3bffba514f512b46f23cb526b9`.

- Improved `scripts/student_flow_audit.cjs` comparable-text matching so KaTeX-rendered unit spacing such as `2N` versus source `$2\\,\\mathrm{N}$` does not create false current-question visibility warnings.
- Hardened mobile student-flow delivery and audit coverage:
  - `scripts/student_flow_audit.cjs` now supports account-tier simulation and runs premium search/question-set/similar-question paths with a Lynk Student account state instead of treating gated pages as search failures;
  - math-heavy current-question visibility checks now accept KaTeX-rendered stems/options instead of relying only on raw source substrings;
  - mobile question, FRQ, search, and score-review images now use a shared horizontally scrollable image container so wide diagrams stay readable instead of being compressed too small;
  - final 16-subject mobile student-flow audit on local production preview passed with 0 errors / 0 warnings.
- Added `public/_headers` for `/data/*` with no-cache headers after production custom domain returned stale question-bank JSON while the new Pages deployment and local `dist` were correct.

- Hardened grouped-MCQ delivery after Biology pond-water/duckweed review:
  - Biology `2008_Q77`-`2008_Q80` now publish a complete `group_id`, `group_members`, `group_role`, `requires_group_context`, and markdown-table `group_context`;
  - single-unit Quiz filtering now requires every member of a grouped bucket to match the selected unit, so cross-unit grouped buckets cannot appear as incomplete unit practice;
  - grouped Quiz validation now checks complete grouped selection and single-unit grouped-bucket scope for all active subjects;
  - unit-distribution validation now accounts for single-unit Quiz coverage after grouped-bucket filtering.
- Hardened Biology rebuild behavior:
  - Biology pipeline supports grouped prompts with shared context but independent options;
  - `update_subjects()` preserves existing publication/readiness fields;
  - rebuilt rows preserve reviewed per-item metadata such as `visual_asset_review` instead of silently dropping it.
- Verification:
  - `npm run validate:groups` passed;
  - `npm run validate:unit-distribution` passed with existing sparse-capacity warnings only;
  - `npm run validate:student-progression -- --skip-browser` passed for all 16 active subjects;
  - `npm run validate:data` passed with 0 errors / 0 warnings;
  - `npm run validate` passed;
  - `npm run build` passed;
  - Biology real-browser student-flow audit passed with 0 errors / 0 warnings.
- Deployed grouped-Quiz repair to Cloudflare Pages:
  - latest Pages deployment URL: `https://51ae9bcb.lynkedu-ap-question-bank.pages.dev`;
  - production `lynkedu.com` bundle observed: `/assets/index-Cy5JXXQs.js`;
  - production Biology data verified: `2008_Q77` returns `group_id: 2008_Q77_80`, four `group_members`, and the duckweed growth table in `group_context`.

## 2026-07-14

- Fixed student account password hashing for Cloudflare Workers:
  - `functions/_shared/auth.js` now uses `PASSWORD_HASH_ITERATIONS = 100000`;
  - password verification returns false for stored hashes above the Workers PBKDF2 cap instead of crashing the request;
  - account/password/login/register/reset-code function files passed `node --check`.
- Repaired online student rendering for special subjects:
  - `MathText` formatting now supports fenced code blocks and inline code while preserving KaTeX rendering;
  - online MCQ question text and options now use block-capable MathText containers;
  - FRQ prompt normalization now protects fenced code blocks the same way it protects Markdown tables, so CSA FRQ code is not flattened.
- Strengthened student-side visual auditing:
  - `scripts/student_flow_audit.cjs` now deliberately samples CSA code questions and math/formula-heavy questions;
  - online Quiz, Mock MCQ, and FRQ player fail if CSA code lacks `.math-code-block`/`.math-inline-code`, if raw code fences are visible, or if math subjects lack `.katex` for formula questions;
  - search page target visibility is a warning in unauthenticated audits because search is a Lynk Student gated surface.
- Verification:
  - `node --check` passed for updated audit/auth files;
  - `npm run validate` passed;
  - `npm run build` passed;
  - CSA student-flow audit on fresh preview `4182` passed with 0 errors;
  - Calculus AB student-flow audit on fresh preview `4183` passed with 0 errors.
- Deployed to Cloudflare Pages:
  - latest Pages URL: `https://8a850978.lynkedu-ap-question-bank.pages.dev`;
  - production `lynkedu.com` returned JS `/assets/index-B-vZgovI.js` and CSS `/assets/index-BRfFf4PD.css`;
  - production CSA data verified at 302 MCQ / 12 FRQ;
  - real-browser production checks confirmed CSA code render layer present with no raw code fences, and Calculus AB KaTeX present with no raw formula text;
  - local password hash regression confirmed new hashes use `pbkdf2_sha256$100000` and verify successfully.

## 2026-07-13

- Started question-pool expansion program:
  - recorded expansion hard rules in SSoT and main-session memory;
  - added `npm run audit:capacity` / `scripts/subject_capacity_audit.cjs`;
  - generated `.workspace/subject-capacity-audit/subject-capacity-report.json`;
  - documented capacity queue in `docs/QUESTION_POOL_EXPANSION_2026-07-13.md`.
- Started CSA expansion preflight:
  - confirmed current package is 105 MCQ + 8 FRQ with sparse U1/U2/U3/U4/U7/U10;
  - identified local 2009 released exam as candidate source;
  - confirmed the 2009 PDF is a 135-page scanned source with no embedded text layer;
  - generated local OCR/page-map assets under `D:\Lynk\翎英教育LynkEdu\.workspace\csa_2009_probe`;
  - updated CSA source pack, risk discovery, and expansion plan under `subjects/AP/Computer-Science-A/docs`;
  - fixed CSA pipeline Web target to prefer `ap-question-bank-prod-fix`.
- Completed CSA first expansion pass:
  - added official current CED sample questions as a first-class source;
  - generated and published `ced_2025` data: 20 MCQ + 4 FRQ;
  - CSA Web package increased from 105 MCQ / 8 FRQ to 125 MCQ / 12 FRQ;
  - rebuilt CED content as structured Java, Markdown tables, lists, and CSA FRQ scoring rows; no broad prompt screenshots were used;
  - added `scripts/csa_content_audit.cjs` and `npm run audit:csa`;
  - fixed stale empty group metadata for CSA 2015 Q27-Q28 during the rebuild;
  - verification passed: `npm run audit:csa`, `npm run validate`, `npm run build`, `npm run audit:render -- --subject=computer-science-a`, `npm run audit:student-flow -- --subject=computer-science-a`, and `npm run audit:capacity`;
  - capacity audit still flags CSA as high risk because total MCQ count is 125 and U1/U2/U3/U7/U10 remain sparse;
  - 2009 scanned released exam remains deferred until scanned Java reconstruction is complete.
- Corrected expansion closeout mechanism:
  - recorded that the CSA CED pass is partial, not full expansion completion;
  - added `scripts/expansion_closeout_audit.cjs`;
  - added `npm run audit:expansion-closeout`;
  - closeout now distinguishes source-batch acceptance from full expansion completion;
  - `--status=complete` must fail for CSA while capacity risk remains High.

- Refined subject management and switching:
  - header learning links route to settings when no subject is selected;
  - subject dropdown opens even for one selected subject and always includes management entry;
  - settings page now uses a minimalist `我的科目 / 可添加科目` layout;
  - adding a subject sets it current/default;
  - removing the final selected subject is blocked with a student-facing notice;
  - deleting the current subject falls back to the remaining selected subject and updates `currentSubject` / `defaultSubject`;
  - subject-dependent routes are wrapped by `RequireSubject` so direct URLs cannot silently open a stale/default subject.
- Verification:
  - `npm run build` passed.
  - Real-browser built-preview checks passed for no-subject `/quiz`, settings empty state, add Biology, single-subject dropdown, last-subject removal block, add Calculus BC, remove current subject, home, and Biology quiz setup.
- Deployed subject-flow refinement to Cloudflare Pages:
  - latest Pages deployment URL observed: `https://83e65ae1.lynkedu-ap-question-bank.pages.dev`;
  - production `lynkedu.com` bundle observed: `/assets/index-1HOTOWOv.js`;
  - production CSS observed: `/assets/index-h2m_05wC.css`.
- Synced source through stable-push API fallback:
  - remote branch: `prod-mock-pdf-fix`;
  - `npm run stable:status` confirmed remote tree matches local HEAD tree after API fallback.

- Deployed LynkEdu AP Question Bank to Cloudflare Pages production by direct `dist` upload.
- Verified `https://lynkedu.com` and `https://www.lynkedu.com` return 200 and load root-path assets, not `/ap-question-bank/` assets.
- Confirmed production bundle:
  - `/assets/index-BfOc4GGt.js`
  - `/assets/index-BgNSD0mB.css`
- Implemented current three-tier product access model:
  - visitor,
  - registered account,
  - `翎英学员`.
- Restricted premium tools to `翎英学员`:
  - search,
  - question sets,
  - similar-question practice,
  - Quiz PDF download,
  - Mock Exam PDF download,
  - score-report PDF download,
  - future unit knowledge-point explanations.
- Kept online Mock Exam, mistake book, and practice history available to registered accounts.
- Recorded that registered-account mistake/history data is a durable teaching-research and product-iteration data foundation.
- Recorded post-launch content-capacity backlog: Biology and other low-volume subjects need question-pool expansion/backfill.
- Added `scripts/access_contract_audit.cjs` and wired it into `npm run validate` so the tier-2/tier-3 permission boundary is executable.
- Rebuilt Search as a current-subject question-bank workbench:
  - weighted current-subject search,
  - official question rendering via `QuestionDisplay`,
  - add to practice,
  - add/remove from question set,
  - question-set practice,
  - question-set PDF,
  - similar-question practice.
- Added question-set storage into the progress snapshot sync path.
- Verified locally through `npm run build`.
- Verified production search page in real browser: visitor sees `翎英学员` access gate.
- 2026-07-13 access-tier correction deployed to Cloudflare Pages:
  - local commits: `1e21049 Refine student access tiers`, `4984408 Normalize registered member copy`;
  - latest Pages deployment URL observed: `https://b89a6272.lynkedu-ap-question-bank.pages.dev`;
  - production `lynkedu.com` bundle observed: `/assets/index-CdPMt8hY.js`;
  - real-browser checks passed for visitor `/mistakes` login gate and visitor `/search` `翎英学员` gate with `注册会员` copy.
- GitHub push of local commits failed because the local machine hit a GitHub connection reset; production was still updated through Cloudflare Pages direct deploy.
- Implemented student account upgrade:
  - primary email/password registration and login;
  - email-code login retained as fallback;
  - forgot-password flow;
  - account profile, email verification, password setup/change, progress sync, and logout-other-devices controls;
  - optional `翎英学员` invite-code backend.
- Applied remote D1 migration `migrations/0002_password_auth.sql` to `lynkedu-question-bank`; verified `email_verified_at` and new password/auth tables exist.
- Recorded SEO/GEO optimization as a required future launch/acquisition workstream.
- Deployed account-system upgrade to Cloudflare Pages:
  - local commit: `ea3dd66 Upgrade student account flow`;
  - latest Pages deployment URL observed: `https://ef774b20.lynkedu-ap-question-bank.pages.dev`;
  - production `lynkedu.com` bundle observed: `/assets/index-Cfz2d49t.js`;
  - production CSS observed: `/assets/index-BsNt8fSc.css`;
  - real-browser checks passed for `/login`, `/register`, `/reset-password`, and `/account` visitor account gate.

- Removed student-facing copy that described training records as teacher research/system-iteration data.
- Refined the student web shell and home layout:
  - lighter sticky header with clearer navigation, subject switcher, and account entry;
  - low-emphasis footer so the learning workspace carries the page;
  - home page rebuilt as a learning dashboard with current subject, primary actions, account status, selected subjects, and common tools;
  - desktop and mobile browser screenshots checked through WebBridge against the built preview.
- Deployed student layout refinement to Cloudflare Pages:
  - latest Pages deployment URL observed: `https://b03edf40.lynkedu-ap-question-bank.pages.dev`;
  - production `lynkedu.com` bundle observed: `/assets/index-Dqt_u_sP.js`;
  - production CSS observed: `/assets/index-DbOL2LWp.css`;
  - real-browser production checks passed for `/login` copy removal and `/` learning-dashboard structure.
- Reworked the student home page and web shell toward a stricter minimalist style:
  - removed dashboard-style card density and metric blocks;
  - reduced navigation to core learning paths;
  - kept the home page to current subject, two primary actions, a simple subject list, and text links;
  - verified built preview on desktop and mobile before deployment.
- Deployed minimalist layout refinement to Cloudflare Pages:
  - latest Pages deployment URL observed: `https://ad0317fa.lynkedu-ap-question-bank.pages.dev`;
  - production `lynkedu.com` bundle observed: `/assets/index-zpiUeq2o.js`;
  - production CSS observed: `/assets/index-CEg-XvSo.css`.
- Added a lightweight student next-step flow to the minimalist home page:
  - reads current-subject local quiz history and wrong-question count;
  - keeps new students on the simple `专项练习 / 模拟考试 / 学习记录` path;
  - returning students with wrong questions see `继续练习`, last score, wrong-count summary, and a `复盘错题` secondary action;
  - no complex recommendation engine or new data model was added.
- Deployed lightweight home learning-flow refinement to Cloudflare Pages:
  - latest Pages deployment URL observed: `https://21082dae.lynkedu-ap-question-bank.pages.dev`;
  - production `lynkedu.com` bundle observed: `/assets/index-dVLuSvV1.js`;
  - production CSS remains `/assets/index-CEg-XvSo.css`.
- Redesigned account entry pages with a minimalist single-column account form layout:
  - removed the login-page `账号能保存什么` side panel;
  - removed the register-page benefits side panel;
  - aligned login, register, and password reset around one quiet form pattern;
  - kept password login primary and email-code login as fallback;
  - verified built preview and production snapshots for `/login` and `/register`.
- Deployed account-page layout refinement to Cloudflare Pages:
  - latest Pages deployment URL observed: `https://73072b39.lynkedu-ap-question-bank.pages.dev`;
  - production `lynkedu.com` bundle observed: `/assets/index-DSx-shk8.js`;
  - production CSS observed: `/assets/index-CcoUOuDc.css`.
# 2026-07-17 - Full Student Audit And Official Unit Gate

- Ran a full all-subject student review under the current framework across 16 active AP subjects.
- Added `scripts/official_unit_authority_audit.cjs` and wired `validate:official-units` into `npm run validate`.
- Filled `unit_classification_authority` metadata for all 16 active subject `classification_config.json` files.
- Found and repaired a blocking AP Psychology framework mismatch:
  - previous Web package used the legacy 9-unit AP Psychology sequence;
  - current official framework uses 5 units;
  - migrated 497 MCQ and 16 FRQ to the official 5-unit sequence;
  - regenerated Psychology mock distribution and `similarity_index.json`.
- Repaired `scripts/browser_render_audit.cjs` so render/PDF checks run with internal student account state by default, matching premium surface requirements.
- Added a render-audit failure mode for premium gate pages appearing during internal-account PDF checks.
- Verification passed:
  - `npm run validate:official-units`: 16 subjects, 0 errors, 0 warnings.
  - `npm run validate`: 0 blocking findings.
  - `npm run build`: passed.
  - Mobile `audit:student-flow` for all 16 active subjects under internal account state: 0 errors / 0 warnings.
  - `npm run audit:render:all`: all 16 active subjects, 0 errors / 0 warnings.

# 2026-07-17 - Admin Console And Entitlement Operations

- Added a dedicated admin console for `admin.lynkedu.com` as a separate frontend build:
  - `admin.html`
  - `vite.admin.config.js`
  - `src/admin/AdminApp.jsx`
  - `src/admin/adminApi.js`
  - `scripts/prepare_admin_dist.cjs`
- Added admin APIs:
  - `functions/api/admin/users.js`
  - `functions/api/admin/entitlements.js`
  - `functions/api/admin/invites.js`
  - `functions/api/admin/logs.js`
- Added D1 migration `migrations/0003_admin_entitlements.sql` for entitlement status, revocation fields, invite redemption duration, invite redemption records, and admin operation records.
- Updated shared account logic:
  - active access reads only active, non-expired entitlement rows;
  - admin APIs require an admin account;
  - register-with-invite can create expiring entitlement rows and redemption records.
- Applied remote migration to D1 database `lynkedu-question-bank` and verified the new columns/tables.
- Set `wuzehua2015@gmail.com` to `account_level = 'admin'`.
- Created Cloudflare Pages project `lynkedu-admin`, bound the same D1 database as `DB`, and deployed:
  - admin deployment: `https://f6e5e2b7.lynkedu-admin.pages.dev`;
  - student deployment after Functions update: `https://de8c083b.lynkedu-ap-question-bank.pages.dev`.
- Verification:
  - `npm run validate`: passed.
  - `npm run build`: passed.
  - `npm run build:admin`: passed.
  - `https://f6e5e2b7.lynkedu-admin.pages.dev`: HTTP 200, title `翎英教育管理后台`.
  - unauthenticated `/api/me` and `/api/admin/users`: HTTP 401.
  - `https://lynkedu.com`: HTTP 200, title `翎英教育题库`.
- Admin custom domain item is complete: `admin.lynkedu.com` is active on Pages with CNAME `admin` -> `lynkedu-admin.pages.dev`, proxied, TTL Auto. Public access returns HTTP 200 and renders `翎英教育管理后台`.
- Source mirror synced through stable API fallback; `npm run stable:status` must be used as the live source-of-truth check because API fallback creates a remote commit id different from local Git history while preserving the same tree.

# 2026-07-18 - Chinese Display Mapping Contract

- Added `src/utils/displayLabels.js` as the single display-label layer for subject names, subject short names, unit names, difficulty labels, account tiers, entitlement features, and entitlement statuses.
- Updated Header, Home, Settings, Quiz setup, Search, History, Mistake Book, Score report, Quiz PDF, Mock PDF, Account, and Admin entitlement surfaces to use the centralized Chinese-first mapping instead of raw English source metadata.
- Preserved official/source metadata in `public/data/subjects.json`; UI localization is now a presentation-layer concern, not a data-source rewrite.
- Strengthened `scripts/chinese_copy_gate.cjs` so checked student-facing files cannot directly render raw `subject.name`, `subject.shortName`, `unit.name`, or `unit.title`.
- Verification passed: `npm run validate:copy`, `npm run validate`, `npm run build:admin`, and `npm run build`.
- Deployed student site to `https://a4263303.lynkedu-ap-question-bank.pages.dev`; production `https://lynkedu.com` now references JS `/assets/index-BPpfi7Zf.js` and CSS `/assets/index-C75AEhR5.css`.
- Deployed admin site to `https://4c150904.lynkedu-admin.pages.dev`; production `https://admin.lynkedu.com` now references JS `/assets/index-DvhgSTr2.js` and CSS `/assets/index-DrvrsFJO.css`.
- Real-browser production QA passed:
  - `https://lynkedu.com/`: home/header show Chinese subject names such as `AP 生物`, `AP 计算机科学 A`, `AP 宏观经济学`, and no raw `AP Biology` / `AP Computer Science A`.
  - `https://lynkedu.com/settings`: 16-subject selector shows Chinese-first course names.
  - `https://lynkedu.com/quiz`: Biology unit options show Chinese unit names (`U1 生命的化学基础`, etc.) and no raw Biology unit English.
  - `https://lynkedu.com/search`: subject, unit filter, and difficulty filter show Chinese labels while original question stems remain unchanged.
  - `https://admin.lynkedu.com`: entitlement list/detail shows Chinese labels such as `完整题库 · 有效`, with no raw `full_access` / `active` visible.

# 2026-07-17 - Admin Custom Domain Live

- Added Cloudflare DNS record for admin console:
  - CNAME `admin` -> `lynkedu-admin.pages.dev`;
  - proxy enabled;
  - TTL Auto.
- Verified Cloudflare Pages custom domain status for `lynkedu-admin`: `admin.lynkedu.com` is `active`.
- Verified public access: `https://admin.lynkedu.com` returns HTTP 200 and contains `翎英教育管理后台`.
- Global API Key email-code route was not needed; DNS was completed through the already logged-in Cloudflare dashboard session.
- Current deployment split remains:
  - student: `lynkedu-ap-question-bank`, `lynkedu.com`, `www.lynkedu.com`;
  - admin: `lynkedu-admin`, `admin.lynkedu.com`;
  - both share D1 database `lynkedu-question-bank` through binding `DB`.

# 2026-07-13 - CSA Capacity Expansion Closeout

- Completed AP Computer Science A MCQ expansion from 105 MCQ to 291 MCQ while keeping 12 FRQ.
- Added source approval ledger and archived network/open-curriculum sources under `subjects/AP/Computer-Science-A/01-exams/network_sources/`.
- Published:
  - 20 CED MCQ + 4 CED FRQ.
  - 38 AP Bowl 2018 MCQ.
  - 122 CSAwesome / Runestone open-curriculum MCQ with GFDL 1.3 metadata.
  - 6 LynkEdu-owned U1 original MCQ.
- Deferred 2009 scanned released exam and AP Bowl 2015/2016 until OCR/code reconstruction is complete.
- Updated CSA pipeline, CSA content audit, subject-risk audit, source pack, CSA status, and expansion ledger.
- Verification passed: `npm run audit:csa`, `npm run validate`, `npm run build`, `npm run audit:render -- --subject=computer-science-a`, `npm run audit:student-flow -- --subject=computer-science-a`, `npm run audit:capacity`, and `npm run audit:expansion-closeout -- --subject=computer-science-a --status=complete`.
- Production data check passed on `https://lynkedu.com/data/ap/computer-science-a/question_bank.json`: 291 MCQ returned with HTTP 200; `frq_bank.json` returned 12 FRQ with HTTP 200.
- Source mirror synced through `npm run stable:push`; normal Git push was rejected by non-linear remote history, then the stable API path synced the current local tree to `prod-mock-pdf-fix`.
- `npm run stable:status` confirmed the remote tree matches the local HEAD tree.

# 2026-07-14 - CSA Deferred Source Curated Follow-Up

- Rechecked deferred CSA sources:
  - 2009 released exam scanned PDF.
  - AP Bowl 2015.
  - AP Bowl 2016.
- Archived a public 2009 PDF copy under the CSA network source folder and generated OCR work drafts under `.workspace/csa_deferred_ocr_20260714/`.
- Added source builders:
  - `subjects/AP/Computer-Science-A/tools/build_ap_bowl_ocr_data.py`
  - `subjects/AP/Computer-Science-A/tools/build_2009_released_data.py`
- Published only high-confidence manually verified structured MCQ:
  - AP Bowl 2015: 5 accepted / 35 rejected-deferred.
  - AP Bowl 2016: 4 accepted / 36 rejected-deferred.
  - 2009 released: 2 accepted / 38 rejected-deferred.
- CSA package increased from 291 MCQ / 12 FRQ to 302 MCQ / 12 FRQ.
- 2009 FRQ remains deferred because prompt cleanup, reference solutions, and part-level scoring rows have not yet met CSA FRQ standard.
- Updated `scripts/csa_content_audit.cjs` to enforce 302 MCQ, source counts, 2009/GridWorld guardrails, AP Bowl year-specific counts, and OCR-damage checks.
- Verification passed: `npm run audit:csa`, `npm run validate`, `npm run audit:capacity`, CSA unit-progression blocking audit, `npm run audit:render -- --subject=computer-science-a`, `npm run audit:student-flow -- --subject=computer-science-a`, and `npm run build`.

# 2026-07-14 - CSA Rendering And Group-Context Repair

- Repaired `2014_sample_Q08` / `2014_sample_Q09` after discovering that the question stem referenced missing Java context. The shared `TimeRecord` class is now consistent `group_context` with formal group metadata.
- Repaired `ap_bowl_2018_Q33` and the renderer for Roman-numeral candidate lists so `I.`, `II.`, `III.` lines render as separate structured rows.
- Updated Quiz and read-only question displays so `group_context` is visible on the student surface. This closes the gap where metadata existed but the actual Quiz card did not show the shared stimulus/code.
- Strengthened `scripts/csa_content_audit.cjs` to validate the full student-visible prompt (`group_context + text`) for CSA missing-code and Roman-list issues.
- Verification passed:
  - `python subjects/AP/Computer-Science-A/tools/csa_pipeline.py`
  - `npm run audit:csa`
  - `npm run validate`
  - `npm run build`
  - real-browser Quiz check for `2014_sample_Q08`: `TimeRecord` code block and answer choices visible.
  - real-browser Quiz check for `ap_bowl_2018_Q33`: three `.math-roman-option` rows and Java code block visible.
- Deployed to Cloudflare Pages:
  - Pages URL: `https://d5c8f7c8.lynkedu-ap-question-bank.pages.dev`
  - production bundle: `/assets/index-Be2xE0yd.js`, `/assets/index-Bqxh0FeN.css`
  - production data check: 302 CSA MCQ, Q08/Q09 grouped context, Q33 Roman label cleanup.

# 2026-07-14 - Global Question-Bank SOP Hardening

- Added `docs/GLOBAL_QUESTION_BANK_SOP.md` as the top-level SSoT for future AP/A-Level/IB/competition subject work.
- The SOP now defines the required lifecycle for source approval, subject risk discovery, reconstruction, unit classification, student-surface verification, local publish, deployment verification, closeout, and full-diagnosis passes.
- Added `scripts/global_sop_gate.cjs` and wired it into `npm run validate` through `validate:sop`.
- The gate verifies that global SOP, structured prompt contract, unit classification standard, expansion ledger, project status, and work log remain present and contain the required markers.
- Updated `PROJECT_STATUS.md` so global expansion/new-item delivery rules are visible from the project status entry point.

# 2026-07-20 - Quiz Image Transition Production Fix

- Fixed online Quiz image refresh: stateful question images now reset their internal source/error state when `path` changes, and question image keys include `question_id` plus image path.
- Added focused browser audit `npm run audit:quiz-image-transition`, which seeds adjacent image-bearing MCQs, clicks the real next-question control, and verifies the second question shows its own image without retaining the previous question image.
- Strengthened `scripts/student_flow_audit.cjs` so regular student-flow samples include adjacent image questions when available and check current question image visibility.
- Validation passed locally: `npm run lint`, `npm run validate`, `npm run build`, macro mobile student-flow, local all-subject image-transition audit.
- Synced source to GitHub `main` through stable API fallback. Remote tree matches local tree.
- Deployed production through Cloudflare Pages project `lynkedu-ap-question-bank`: `https://ad92b4af.lynkedu-ap-question-bank.pages.dev`.
- Verified real production domain `https://lynkedu.com`: macro image-transition audit passed with 0 errors, then all 16 active subjects passed with 0 errors.

# 2026-07-21 - Classification Accuracy Contract Gate

- Added `scripts/classification_accuracy_contract_audit.cjs` and wired `validate:classification-accuracy` into `npm run validate`.
- Updated `scripts/global_sop_gate.cjs`, `docs/UNIT_CLASSIFICATION_STANDARD.md`, and `docs/GLOBAL_QUESTION_BANK_SOP.md` so classification accuracy is now an executable contract, not only a written rule.
- New contract checks:
  - hard concept-boundary regressions ignore prior `reviewed` status;
  - item-level `classification_accuracy` / `required_topics` evidence must match the latest required unit when present;
  - official topic-map coverage debt is reported separately from blocking data errors;
  - hard-boundary checks use the prompt plus correct answer path, so wrong-option-only concepts do not automatically raise `primary_unit`.
- Corrected AP Macroeconomics local framework and data under current official topic placement:
  - Phillips Curve is Unit 5 Topic 5.2, including SRPC and LRPC items.
  - Reclassified Macro `2012_Q15`, `2014_Q30`, `2015_Q17`, `2016_Q27`, `2017_Q17`, `2017_Q45`, and `2019_Q38` to U5 with topic-level evidence.
  - Added the Macro topic map skeleton to `classification_config.json`, including Unit 5 Topic 5.7.
- Corrected CSA `ap_bowl_2018_Q37` to U10 because the required answer path includes mergesort recursion knowledge.
- Validation passed:
  - `npm run validate:classification-accuracy`: 16 subjects, 5472 active scored items, topic-map coverage debt 13, blocking errors 0.
  - `npm run validate:macro-units`: 460 macro items, blocking 0.
  - `npm run validate`: all gates passed.
  - `npm run build`: production build passed.
