# LynkEdu Decisions

## 2026-07-13: Cloudflare Pages Is Current Production Host

Production is Cloudflare Pages, not GitHub Pages or Vercel.

Reason:
- The site now uses Cloudflare Pages Functions and D1-backed login/progress.
- Custom domains `lynkedu.com` and `www.lynkedu.com` are bound to the Pages project.

Consequence:
- `vite.config.js` must use `base: '/'` for root-domain production.
- Old docs that mention GitHub Pages `base: '/ap-question-bank/'` are historical and must not be used for current production.
- Direct `wrangler pages deploy dist` can update production even when GitHub push is unavailable.

## 2026-07-13: Access Tiers

The product access model is:

- Visitor: online unit Quiz only.
- Registered account: online unit Quiz, online Mock Exam, mistake book, and practice history.
- `翎英学员`: full tools, downloads, and knowledge-point explanations.

Search, question sets, similar-question workflows, PDF downloads, and unit knowledge-point explanations are premium student tools. Mistake book and practice history are registered-account features because they are part of the site's learning-data infrastructure.

Student-facing labels must say `注册会员` and `翎英学员`; do not expose internal account-state terms such as internal/certified student labels.

## 2026-07-13: Student Account Flow

The account system uses password login as the primary student flow. Email one-time codes remain as fallback for legacy accounts, email verification, and password recovery.

Registration must be a separate route (`/register`) with email, password, display name, and optional `翎英学员` invite code. Login must be a separate route (`/login`) with password login first and code login second. Password recovery must use `/reset-password`.

Account management must expose profile editing, learning-data sync, email verification, password setup/change, and logout-other-devices controls. Teacher-side assignment tables stay reserved; no teacher UI is exposed in this phase.

## 2026-07-13: SEO/GEO Backlog

SEO/GEO optimization is a required future workstream before broader public acquisition. It must cover classic search indexing, AI answer-engine discoverability, public landing content, metadata, structured data, sitemap/robots, performance, canonical URLs, and Chinese-first brand positioning for `lynkedu.com`.

## 2026-07-13: Search Scope

Search stays within the current subject. Cross-subject search is intentionally not implemented because it is low value for the current student workflow.

Search must reuse the production question rendering path rather than maintaining a separate simplified renderer. This prevents CS/code/table/formula display regressions.

## 2026-07-13: PDF Download Policy

PDF download is not a standalone public purchase feature at this stage. It is a `翎英学员` learning tool.

Reason:
- Lower operational complexity.
- Lower copyright/commercialization risk than selling individual AP-question PDFs.

## 2026-07-13: Student Home Layout

The student home page should be maintained as a learning dashboard, not a loose directory of cards. The first screen should make the current subject, next practice action, mock exam action, account state, selected-subject scope, and common review tools visible with clear hierarchy.

Student-facing copy must explain direct student value. Internal teaching-research, data-infrastructure, or system-iteration rationale belongs in maintenance docs, not the product UI.
## 2026-07-13: Minimal Student UI Direction

The student web UI should prefer a minimalist learning-tool style over dense dashboard cards. Home should avoid card walls, repeated metric boxes, and equal-weight tool grids. Keep the first screen focused on current subject, two primary actions, quiet account/subject context, and sparse secondary links.
## 2026-07-13: Lightweight Learning Flow

Home may use existing local/account progress data to adjust copy and the secondary action, but it should not become a heavy recommendation system. Current approved pattern: current subject, two primary actions, and one context-aware secondary link such as `复盘错题` when wrong questions exist.
## 2026-07-13: Account Page Layout

Login, registration, and password recovery should use a quiet single-column account form pattern. Do not add side panels such as `账号能保存什么` or benefits cards that feel like product-copy patches. Account pages should focus on the immediate task, with only concise helper text and route links.

## 2026-07-13: Subject Management State Contract

`mySubjects` is the student's learning scope. Home and the header switcher must show only selected subjects, while the full catalog lives in Settings.

Subject-dependent pages must not silently load a default subject when `mySubjects` is empty. They must show a clear choose-subject prompt. This applies to direct URL entry as well as header navigation.

Adding a subject sets it as current/default. Once at least one subject is selected, the UI blocks removing the final selected subject. If the current/default subject is removed while other selected subjects remain, both `currentSubject` and `defaultSubject` must fall back to a remaining selected subject in the same state update.

## 2026-07-13: Question Pool Expansion Standard

Question-pool expansion must preserve the same delivery quality as a full subject rebuild. A subject can receive new questions only through its source pack, risk discovery, rendering strategy, pipeline, validators, and student-surface checks.

The expansion target is not only total count. The main target is usable coverage by unit and by student workflow: unit Quiz, Mock Exam, search/question set, review, scoring, and PDF output. New items that weaken rendering, unit classification, answerability, scoring quality, or browser/PDF behavior are not acceptable even if they increase the count.

Network expansion is mandatory for low-volume subjects. Do not rely only on one local old source. Prefer official, current, and public reliable sources; prefer 2009-or-newer materials, and put current-course CED or AP Central materials first. Any network source must pass source reliability, timeliness, answer/scoring completeness, structure quality, permission, and deduplication checks before publication.

The current expansion priority is CSA, Physics 1, Biology, CSP, Physics 2, then Environmental Science.

## 2026-07-13: CSA Current CED Expansion

AP Computer Science A now includes the current official CED sample questions as a published source: 20 MCQ and 4 FRQ. CED items keep their official A-D option format and must not be padded to A-E.

CSA expansion must continue to use structured Java/code/table rendering rather than prompt screenshots. The mandatory CSA post-pipeline check is `npm run audit:csa`, in addition to full `npm run validate`, build, render, student-flow, and capacity audits.

The 2009 scanned released exam remains a deferred candidate until its Java code, options, answer key, FRQ prompts, and scoring rows are reconstructed from the scanned source.
