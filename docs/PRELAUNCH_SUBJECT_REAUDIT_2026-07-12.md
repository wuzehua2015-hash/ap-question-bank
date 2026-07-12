# Prelaunch Subject Reaudit 2026-07-12

## Scope

This pass rechecked the 16 active public AP subjects from multiple student-facing angles: grouped-question context, structured prompts, code/algorithm blocks, table/list rendering, FRQ figures, rubric text, Chinese-first UI copy, and broad subject-specific risk patterns.

AP English Language remains excluded by product decision.

## Hardened Gates

- `npm run validate:copy` blocks visible encoding damage, internal release-state labels, and core English UI copy in Chinese-first student flows.
- `npm run validate:groups` blocks grouped MCQ items without complete metadata, thin shared context, inconsistent members, or duplicated shared context inside member stems.
- `npm run validate:subject-risk` scans all public subjects for known cross-subject failure classes: split OCR text, missing code/procedure structure, missing FRQ figures/tables, flattened database/table/list prompts, repeated rubric outlines, and unbound option visuals.

These gates are part of `npm run validate`.

## Fixes From This Pass

- Chemistry: restored grouped metadata for chemistry shared-stimulus ranges, removed duplicated shared context from member stems, cleaned split formula text in selected MCQ, and bound the 2019 Q35-Q38 calibration graph.
- Computer Science Principles: repaired structured program/procedure prompts, restored the 2016 Q17 logical expression, added the missing 2016 Q53 grid visual, and structured database/list procedure prompts.
- AP U.S. Government and Politics: replaced placeholder passage contexts for 2018 Q11-Q13 and Q14-Q17 with the actual source passages.
- Psychology: added group metadata for shared-definition/shared-perspective/ear-diagram items and removed repeated instruction text from stems.
- Physics C E&M and Physics C Mechanics: removed repeated shared-context prefixes from grouped item stems.
- Physics 2: added precise 2023 FRQ3 and 2024 FRQ2-FRQ4 figure/graph assets and bound them to FRQ records.
- Macroeconomics: cleaned FRQ prompt OCR artifacts in 2012 FRQ1 and rebuilt the scrambled 2017 FRQ3 prompt.
- Calculus BC: normalized a literal newline artifact in a Markdown table prompt.
- Score report: restored Chinese-first report title and footer copy.

## Subject-Specific Lessons

- Code-heavy subjects must treat code/procedure/algorithm blocks as first-class content. If the stem references a block, it must be represented as a fenced block, `background_data.code`, a structured table, or an owned visual.
- Science FRQs that reference `Figure N` must have bound, precise figure assets unless the figure is fully reconstructed as structured data.
- Grouped items are not complete just because every member carries `group_id`; the shared context must be visible exactly once per standalone item view and must not be repeated in the member stem.
- Database/list prompts in CSP should preserve bullet/list structure, preferably through `background_data.list` when the list is semantically part of the stimulus.
- Formula/table prompts using Markdown tables must contain real newlines, not literal `\n` text.
- Rubric cleanup must include scoring rows, not just the prompt.

## Future Subject Entry Rule

Every new or reopened subject must run a subject-specific risk discovery before production. The discovery must decide whether that subject needs special handling for:

- grouped shared stimulus
- code/procedure blocks
- formulas and subscripts
- tables/lists/databases
- FRQ figure and graph layouts
- visual answer choices
- rubric point structure
- unit classification by learning order
- PDF/mock page-break behavior

The subject cannot be marked ready until the relevant risks are represented in data, renderer behavior, and validation gates.
