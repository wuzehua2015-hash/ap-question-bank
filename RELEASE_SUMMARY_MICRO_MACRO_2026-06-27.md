# Micro/Macro Release Summary - 2026-06-27

## Scope

This release closes the AP Microeconomics and AP Macroeconomics Web publish cleanup.

## Completed

- Published AP Microeconomics 2012-2019 data and images into the unified Web structure.
- Migrated AP Macroeconomics data and images into the same unified Web structure.
- Removed legacy tracked Web duplicates and backup artifacts from Git tracking.
- Kept raw PDFs, source materials, local production files, and backups local-only.
- Added a local audit page for non-code browser review and feedback export.
- Cleaned visible Chinese mojibake in Web UI and local audit flow.
- Strengthened validators for active subjects, image references, option pollution, FRQ/rubric assets, and Macro unit consistency.

## Canonical Web Publish Paths

- `public/data/ap/microeconomics/`
- `public/images/ap/microeconomics/`
- `public/data/ap/macroeconomics/`
- `public/images/ap/macroeconomics/`

Legacy paths such as `public/data/macro_*.json`, `public/images/2012/`, `public/images/frq/`, and `public/images/micro/` are no longer Web truth sources.

## Verification

Run from `ap-question-bank/`:

```bash
npm run validate:data
npm run validate:images
npm run build
node scripts/pre-deploy-check.js
```

Latest local result:

- Data validation: Macro 432 questions, 0 errors, 0 warnings; Micro 480 questions, 0 errors, 0 warnings.
- Image validation: 181 referenced images checked, 0 errors, 0 warnings.
- Build: passed.
- Pre-deploy check: passed.

## Remaining Non-Blocking Notes

- `npm run lint` has React development warnings only, with 0 errors.
- Macro is currently documented as a stable Web publish baseline. A full Macro production rebuild should follow the global single-subject workflow if it is reprocessed later.
- The production source PDFs and local subject workspaces remain outside this GitHub repository by design.
