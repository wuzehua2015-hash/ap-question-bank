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
- Registered account: online unit Quiz and online Mock Exam.
- `翎英学员`: full tools and downloads.

Search, mistake book, history, question sets, similar-question workflows, and PDF downloads are premium student tools.

## 2026-07-13: Search Scope

Search stays within the current subject. Cross-subject search is intentionally not implemented because it is low value for the current student workflow.

Search must reuse the production question rendering path rather than maintaining a separate simplified renderer. This prevents CS/code/table/formula display regressions.

## 2026-07-13: PDF Download Policy

PDF download is not a standalone public purchase feature at this stage. It is a `翎英学员` learning tool.

Reason:
- Lower operational complexity.
- Lower copyright/commercialization risk than selling individual AP-question PDFs.

