# LynkEdu AP Question Bank Project Status

Last updated: 2026-07-13

## Current Production

- Production domain: `https://lynkedu.com`
- Alternate domain: `https://www.lynkedu.com`
- Hosting: Cloudflare Pages project `lynkedu-ap-question-bank`
- Pages production deployment: `03e773eb-034b-4d11-b256-4095c77a35b1`
- Latest deployed bundle observed on production:
  - JS: `/assets/index-BfOc4GGt.js`
  - CSS: `/assets/index-BgNSD0mB.css`
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
- Latest local commit deployed to Pages: `77d2fa5 Gate premium tools and upgrade search workbench`
- GitHub push status at last update: failed due local network inability to reach `github.com:443`; retry required when network recovers.

## Product Access Tiers

- Visitor:
  - Can use unit Quiz online.
  - Uses localStorage for local progress.
- Registered account:
  - Can use unit Quiz online.
  - Can generate and complete Mock Exam online.
  - Progress syncs to D1.
- Lynk Student (`翎英学员`):
  - Full question-bank tools.
  - Search.
  - Question set.
  - Similar-question practice.
  - Mistake book.
  - History.
  - Quiz PDF download.
  - Mock Exam PDF download.

Student-facing copy must use `翎英学员`, not internal certification/release labels.

## Current Web Product Milestone

The site has entered productization for public launch:

- Chinese-first UI is mandatory.
- Website-level feature changes must update this file, `WORKLOG.md`, `DECISIONS.md`, and durable main-session memory.
- New student-facing functionality must include:
  - access-tier decision,
  - local and account-storage behavior,
  - production build verification,
  - production URL verification when deployed.

