# Global Question Bank SOP

Last updated: 2026-07-14

This is the top-level SSoT for adding, expanding, rebuilding, diagnosing, and publishing question-bank content across AP subjects and future A-Level, IB, and competition subjects. Older subject notes remain useful evidence, but this SOP is the entry contract.

## Non-Negotiable Principles

- Quality beats count. A target such as "add 100-200 MCQ" is not complete until every accepted item passes source approval, reconstruction, unit classification, student rendering, and release checks.
- The student surface is the truth. Data that exists in JSON but is not visible in Quiz, Search/review, Mock, FRQ, or PDF is not delivered.
- Every subject gets its own risk discovery. Generic extraction cannot certify a subject with code, formulas, tables, diagrams, grouped stimuli, visual answer choices, FRQ rubrics, or unusual option layouts.
- Unit classification follows learning order. `primary_unit` is the latest unit a student must have completed to answer the item, not a keyword label.
- Grouped items stay together. Shared context, figures, tables, and code must be represented once as `group_context` or equivalent structured fields, and every member must render that context.
- Source decisions are recorded. Accepted, rejected, deferred, and future-work candidates must be documented with reasons.
- No publication without a fresh build and student-path check. JSON validation alone is insufficient.

## Global Lifecycle

Every subject or source batch must move through these states:

1. `candidate`: source located, not approved for extraction.
2. `source_approved`: source ownership/usage, relevance, currency, and format risk reviewed.
3. `risk_discovered`: subject and source-specific rendering/classification risks recorded.
4. `reconstructed`: items rebuilt as structured text/data/images, not broad page images.
5. `unit_reviewed`: each item classified by required learning sequence.
6. `student_surface_verified`: Quiz plus at least one review/Search/PDF path checked for the affected content type.
7. `published_local`: Web data regenerated and local validation/build passed.
8. `deployed`: Cloudflare Pages deployment completed and production URL/data verified.
9. `closed`: SSoT, work log, source reports, and remote tree sync completed.

Do not mark a goal complete before state `closed`.

## Source Approval SOP

For each source batch:

- Identify source type: official, public practice, open curriculum, owned content, legacy released material, or scanned legacy material.
- Record source credit, license/usage notes where applicable, source URL/file path, acquisition date, year, and curriculum fit.
- Prefer 2009-and-later AP material unless a subject-specific reason supports older content.
- Reject or defer items that are obsolete, outside current curriculum, incomplete, too noisy to reconstruct confidently, or lacking reliable answers.
- For non-official practice sources, label `source_set` clearly and keep provenance metadata.
- Do not mix source batches silently. Each batch needs a distinct `source_set` and source report.

Required output:

- source inventory entry;
- accepted/rejected/deferred counts;
- reasoned decisions for rejected/deferred items;
- retained raw/source files in the subject source archive when legally and operationally appropriate.

## Subject Risk Discovery SOP

Before bulk extraction or expansion, inspect representative items from every year/source set. Record whether the subject needs specialized handling for:

- grouped prompts and shared figures/tables/code;
- tables in prompt versus tables in answer choices;
- visual answer choices;
- formula rendering, chemical notation, subscripts/superscripts, or units;
- code or pseudocode blocks;
- graph/diagram precision;
- FRQ prompt layout and scoring-rubric structure;
- multi-part questions and year-based FRQ sampling;
- current-course compatibility;
- unit-classification boundary cases;
- PDF export pagination risks;
- Chinese-first UI/copy implications.

Required output:

- subject risk file or section;
- renderer strategy;
- unit-classification notes;
- validation additions or explicit reviewer checklist items.

## Reconstruction SOP

An item may enter Web data only when:

- stem is complete and readable;
- options are complete and mapped to the correct labels;
- answer key is verified;
- all referenced visuals/tables/code/formulas are present;
- grouped context is represented as structured shared context;
- visual assets are precise and owned by the item or group;
- no broad page image is used as a substitute for clean structure unless explicitly approved as the only faithful representation;
- FRQ rubrics have subject-specific solution outlines and scoring rows, without repeated template text.

Subject-specific examples:

- CSA: Java code blocks, missing-code placeholders inside code, Roman-numeral candidate rows.
- Chemistry: formula/subscript consistency and clean chemical notation.
- Biology: FRQ figure/caption relationships and non-duplicative scoring criteria.
- Economics: graph/table distinction, balance-sheet image precision, normal-form tables.
- CSP: algorithm blocks, database/list/table structures, visual options.
- Math/Physics/Statistics: formula rendering, graph precision, tables, and PDF pagination.

## Unit Classification SOP

Classification must follow `docs/UNIT_CLASSIFICATION_STANDARD.md`.

For every new or changed item:

- Read the full item, options, shared context, and any visual.
- Determine the latest unit required to solve it with all prior units available.
- Ignore keyword-only evidence if the concept is only a label, distractor, or background.
- Record `classification_reasoning` when the item is newly added, repaired, or previously risky.
- For grouped questions, do not allow a member to appear in an earlier cumulative scope than its shared context and group members allow.

Required gates:

- `npm run audit:units`
- `npm run validate:units`
- `npm run validate:student-progression`

## Student-Surface SOP

For every source batch or renderer-affecting change:

- Test Quiz rendering for representative items.
- Test Search/review rendering if the content can appear there.
- Test Mock path when the subject supports Mock.
- Test FRQ and FRQ scoring pages for FRQ changes.
- Test PDF generation/download when PDF output can contain the changed content.
- Use the correct router path (`/#/...`) for the deployed app.
- Use a fresh build and isolated preview port for local evidence.
- Production deployment must be followed by `lynkedu.com` verification.

The check must include DOM/text evidence for structured content, not only screenshots.

## Expansion Closeout SOP

An expansion is not complete unless all are true:

- source inventory and decisions are recorded;
- accepted items are published through the subject pipeline;
- rejected/deferred items remain out of Web data with reasons;
- source counts match subject-specific checks;
- capacity and unit distribution are reviewed;
- full validation/build passed;
- student-surface evidence exists;
- production data check passed if deployed;
- `PROJECT_STATUS.md`, `WORKLOG.md`, and durable main-session memory are updated;
- remote tree sync is verified.

Minimum commands:

```powershell
npm run audit:sop
npm run validate
npm run build
npm run audit:capacity
npm run audit:expansion-closeout -- --subject=<subject-id> --status=partial|complete
```

Add subject-specific commands such as `npm run audit:csa` whenever they exist.

## Full-Diagnosis SOP

Use this before launch, after major renderer changes, after source expansion, or whenever repeated defects appear.

Run a multi-angle pass:

- data schema and answer completeness;
- image and visual precision;
- grouped context integrity;
- subject risk signals;
- unit progression and student learning sequence;
- student flow on desktop and mobile;
- Mock and Quiz PDF export;
- search/question-set/similar-practice paths;
- access-tier boundaries;
- Chinese-first copy;
- production data and asset freshness;
- remote tree synchronization.

Do not stop at the first fixed example. If a defect reveals a class of failures, reopen the whole class for the affected subject and decide whether the same class applies globally.

## Multi-Subject Adaptation Matrix

Every new subject must explicitly answer these questions:

- Is MCQ-only, FRQ-only, or mixed delivery required?
- Does FRQ sampling need year-based or question-number-type grouping?
- Are there subject-specific renderers for code, equations, chemical notation, graphs, tables, maps, datasets, or passages?
- Are grouped prompts common?
- Are answer choices visual, tabular, or multi-line?
- Does unit classification need special boundary rules?
- Are official sources enough, or is approved external expansion required?
- What student-path checks are mandatory for this subject?

If any answer is "unknown", the subject stays in `risk_discovered` and cannot move to publication.

## SSoT Update Rules

Every meaningful content or product change must update:

- `PROJECT_STATUS.md` for current state and deployment facts;
- `WORKLOG.md` for what changed and what evidence passed;
- the relevant subject source report or expansion ledger;
- `docs/GLOBAL_QUESTION_BANK_SOP.md` only when the global contract changes;
- `docs/STRUCTURED_PROMPT_DELIVERY_CONTRACT.md` for rendering-contract changes;
- `docs/UNIT_CLASSIFICATION_STANDARD.md` for unit-classification changes;
- `C:\Users\wuzeh\.codex\main-session\MEMORY.md` for durable cross-session rules.

## Stop Conditions

Stop and repair the mechanism before continuing if:

- a named defect appears in more than one item;
- a student path shows different content from the JSON expectation;
- a subject-specific rule was handled by manual patch only;
- a validation pass does not cover the actual failure class;
- a source batch increases count but leaves deferred candidates unrecorded;
- a goal is being marked complete without production or remote-sync evidence when deployment was part of the work.
