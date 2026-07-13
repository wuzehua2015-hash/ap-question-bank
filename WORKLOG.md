# LynkEdu Worklog

## 2026-07-13

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
  - mistake book,
  - history,
  - Quiz PDF download,
  - Mock Exam PDF download.
- Kept online Mock Exam available to registered accounts.
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
- GitHub push of local commit `77d2fa5` failed because the local machine could not connect to `github.com:443`; production was still updated through Cloudflare Pages direct deploy.

