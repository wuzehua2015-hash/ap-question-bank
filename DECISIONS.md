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