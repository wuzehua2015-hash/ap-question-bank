# LynkEdu AP Question Bank Project Status

Last updated: 2026-07-13

## Current Production

- Production domain: `https://lynkedu.com`
- Alternate domain: `https://www.lynkedu.com`
- Hosting: Cloudflare Pages project `lynkedu-ap-question-bank`
- Latest Pages deployment URL observed: `https://b89a6272.lynkedu-ap-question-bank.pages.dev`
- Latest deployed bundle observed on production:
  - JS: `/assets/index-CdPMt8hY.js`
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
- Latest local commit deployed to Pages: `4984408 Normalize registered member copy`
- GitHub push status at last update: failed due local network reset while reaching GitHub; retry required when network recovers.

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

## Current Web Product Milestone

The site has entered productization for public launch:

- Chinese-first UI is mandatory.
- Website-level feature changes must update this file, `WORKLOG.md`, `DECISIONS.md`, and durable main-session memory.
- New student-facing functionality must include:
  - access-tier decision,
  - local and account-storage behavior,
  - production build verification,
  - production URL verification when deployed.
