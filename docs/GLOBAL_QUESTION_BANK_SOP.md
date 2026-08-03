# Global Question Bank SOP

Last updated: 2026-08-01

This is the top-level SSoT for adding, expanding, rebuilding, diagnosing, and publishing question-bank content across AP subjects and future A-Level, IB, and competition subjects. Older subject notes remain useful evidence, but this SOP is the entry contract.

## Non-Negotiable Principles

- Quality beats count. A target such as "add 100-200 MCQ" is not complete until every accepted item passes source approval, reconstruction, unit classification, student rendering, and release checks.
- The student surface is the truth. Data that exists in JSON but is not visible in Quiz, Search/review, Mock, FRQ, or PDF is not delivered.
- Student actual usability and highest-standard delivery are the first priority above quantity, speed, automation, file existence, or a passing script. Structured question text is the only delivery form: PDFs, screenshots and crops are evidence or necessary visual attachments, never substitutes for stems, options/subparts, answers or markschemes. The binding rules are in `docs/STRUCTURED_QUESTION_DELIVERY_STANDARD.md`.
- Every subject gets its own risk discovery. Generic extraction cannot certify a subject with code, formulas, tables, diagrams, grouped stimuli, visual answer choices, FRQ rubrics, or unusual option layouts.
- New curriculum families must define their assessment model before any item import. AP `MCQ/FRQ` is only one model; IB, A-Level, and competition subjects may be paper/marks/level/component driven and must not be forced into AP fields.
- Unit classification follows official learning order. `primary_unit` is the latest official unit a student must have completed to answer the item, not a keyword label.
- Official exam and subject framework materials are the only authority for unit classification. Third-party maps, existing labels, generated topic names, or keyword tables can suggest review candidates but cannot justify the final unit.
- Every student-visible item must carry item-level required-learning evidence in `classification_accuracy.required_topics`. Subject-level topic maps, old `reviewed` flags, broad student-flow gates, and successful rendering are not substitutes for per-item evidence.
- Bridging prior official review evidence into `classification_accuracy` is a compatibility step, not fresh reclassification. It may satisfy the data contract only when prior official-progression evidence exists, and it must leave topic-level backfill status visible.
- Grouped items stay together. Shared context, figures, tables, and code must be represented once as `group_context` or equivalent structured fields, and every member must render that context.
- Cross-unit grouped MCQ buckets are not unit-Quiz eligible. A single-unit Quiz may include a grouped bucket only when every member has that same `primary_unit`; cumulative/all-subject/Mock flows may include the bucket only as a complete group.
- Rebuild pipelines must preserve reviewed per-item metadata such as visual, rendering, answerability, and classification review fields unless the pipeline explicitly regenerates and revalidates that field.
- Source decisions are recorded. Accepted, rejected, deferred, and future-work candidates must be documented with reasons.
- No publication without a fresh build and student-path check. JSON validation alone is insufficient.
- "Full" means every active student-visible item is in an item-level ledger. Sampling, screenshots, and representative browser checks are useful evidence, but they never replace the full ledger.
- Release closeout requires `npm run validate:student-risk` with P0=0, P1=0, and P2=0 across the full active item set. Any unresolved required prompt, table, figure, code block, option structure, scoring support, or unit-classification issue must be fixed or hidden before release.
- Release closeout also requires `npm run validate:structured-delivery` with zero errors. Source-located, screenshot-only or summary-only records contribute zero completed student-bank items.

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

For each source batch, `docs/QUESTION_SOURCE_POLICY.md` is the higher-priority admission rule. Self-written questions, template variants, reconstructed substitutes, and capacity-filling questions are prohibited.

- Identify source type: official exam, official sample, open-licensed exam, explicitly licensed exam, legacy released material, or scanned legacy material.
- Record source credit, license/usage notes where applicable, source URL/file path, acquisition date, year, and curriculum fit.
- Prefer 2009-and-later AP material unless a subject-specific reason supports older content.
- Reject or defer items that are obsolete, outside current curriculum, incomplete, too noisy to reconstruct confidently, or lacking reliable answers.
- A new student-visible item must have a verified question-source fingerprint, paired answer-source fingerprint, exact exam locator, and approved student-use status in `public/data/question_source_registry.json`.
- Internal-only material must remain blocked until student-use permission is recorded.
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
- every grouped bucket has complete `group_id`, `group_members`, `group_role`, and `group_context` metadata;
- shared tables inside `group_context` are rendered as structured tables through `MathText`, not left as unreadable flattened text;
- visual assets are precise and owned by the item or group;
- no broad page image or crop is used as a substitute for structured text/data;
- FRQ rubrics have subject-specific solution outlines and scoring rows, without repeated template text.
- items that cannot yet meet the above student-delivery contract must be marked `publish_status: "blocked"` and `student_visible: false`; they must not remain available to Quiz, Mock, Search/review, mistake-book, history, question-set, similar-practice, or PDF flows.

Subject-specific examples:

- CSA: Java code blocks, missing-code placeholders inside code, Roman-numeral candidate rows.
- Chemistry: formula/subscript consistency and clean chemical notation.
- Biology: FRQ figure/caption relationships and non-duplicative scoring criteria.
- Economics: graph/table distinction, balance-sheet image precision, normal-form tables.
- CSP: algorithm blocks, database/list/table structures, visual options.
- Math/Physics/Statistics: formula rendering, graph precision, tables, and PDF pagination.
- IB Mathematics: level (`SL`/`HL`), paper (`P1`/`P2`/`P3`), calculator status, marks, subpart marks, timezone, syllabus version, and markscheme pairing are required delivery fields.

## Whole-Paper Real-Source Build SOP

This is the required build method whenever a source consists of examination papers and paired answers or markschemes. It is designed to keep the reliable speed of the established AP paper workflow without allowing automation to change what a student sees.

### 1. Set up a source set before touching its questions

For every new year, paper family, or subject, create one source-set record containing:

- official framework and assessment version;
- every paper and paired answer/markscheme file, its SHA-256, page count, session, level/component and usage decision;
- the paper's marks, timing, calculator or tool rule, question numbering and any optional-choice rule;
- known risks: formulas, tables, diagrams, multi-page prompts, continued markschemes, alternative methods, follow-through rules, zero-mark conditions and answer figures;
- a deliberately chosen sample paper/year and representative questions that cover those risks.

The sample is the test for the process, not a shortcut around the rest of the source set. Its approved records become regression samples: every later process change must still preserve their displayed text, marks, answers, scoring points, source pages and assets.

### 2. Program work: create review material, never student content

The program may process a complete paper set in bulk to:

- confirm file fingerprints, page counts, paper/markscheme pairing, numbering and total marks;
- locate each question and all continuation pages;
- extract text candidates, observed part labels, mark labels and possible figure/table regions;
- create an empty review batch with the question ID, source pages, hashes, assets and required audit-field checklist;
- compare a completed batch with its source-set inventory and report missing pages, missing pairings, repeated locators, mark-total conflicts and stale inputs.

The program must not fill, rewrite, shorten, translate, infer or approve student-visible question text, answer text, markscheme text, knowledge points or scoring points. Candidate text is a reading aid only. A candidate, page image or empty batch has completed-question count zero.

### 3. Human review: fill one complete item at a time inside a small batch

For each item, review the rendered official question and every relevant answer/markscheme page side by side. Enter the complete official text, all parts, mathematical notation, structured tables and required figure assets. Then enter the official answer and every scoring condition, note, alternative method, follow-through condition and total mark.

Classify from the full prompt and the correct scoring path against the current official framework. A keyword, an old label, or a candidate-text guess cannot decide the knowledge point. Record the exact source page, source-file hash and asset hash for every student-visible field.

Before an item is accepted, one reviewer must explicitly confirm all of the following:

- no question continuation page, subpart, formula, table, figure or instruction is missing;
- no markscheme continuation, alternative method, condition, note or scoring point is missing;
- every part total and the whole-question total reconcile with the official paper;
- the displayed figure contains only the needed official visual material, not neighbouring questions, scoring text, page furniture or unreadable detail;
- the answer, markscheme and classification allow a student to self-check or receive later scoring without guessing.

### 4. Batch acceptance and progress tracking

Use small safe batches (normally 5–10 items after the sample is proven). Every batch must have a machine-readable ledger with:

- `pipeline_version`, `source_set_id`, input file hashes and candidate-output hash;
- the ordered question IDs and the current state of each item: `queued`, `in_review`, `accepted`, `rejected`, or `deferred`;
- reviewer, review timestamp, exact rejection/defer reason and links to all generated evidence;
- counts for source locators, accepted structured items, exact duplicates, rejected and deferred items; and
- the checks run and their results.

Only the controlled writer may change an accepted item to `structured_reviewed`. It must support a no-write check mode so the complete batch is validated before any bank file is changed. An accepted item remains hidden until the course's release gate passes.

For Math AA, `scripts/create_real_source_review_batch.cjs` creates this review-only ledger from the canonical queue. It intentionally creates no student-visible fields; the reviewer adds the final payload in a separate reviewed batch file, checks it with `scripts/install_ib_math_aa_structured_batch.cjs --check <batch-file>`, and only then runs the same command without `--check`.

After every item run the lightweight data check. After every safe batch, run the subject validation chain and one student-surface check covering the content type newly added. If memory is temporarily insufficient for the browser, record that check as pending and continue reviewing; do not treat it as approval or as a reason to abandon the batch. Run browser work in one instance only and confirm its process and preview port are gone afterward.

### 5. Improve safely and reuse the process

When a defect is found, record the failure class, the affected source sets, the corrected rule, the validator added or changed, and the regression samples used to prove the correction. Do not silently alter a process or rewrite previously accepted records.

Any new subject or year reuses this flow only after completing the adaptation checklist below. A source-set-specific renderer, parser or validator is allowed, but it must produce the same audit ledger and obey the same rule: automation prepares evidence; human review approves complete student content.

### New subject / new year adaptation checklist

Before bulk work, record the answers to these questions in the subject delivery standard:

1. What are the exact official assessment components, timing rules, marks and question structures?
2. Which source files form a complete question-and-answer pair, and do any answers continue across pages?
3. Which content must be structured as text/table/formula and which official visuals must remain assets?
4. What assessment-specific scoring details exist (for example alternative methods, follow-through, method marks, annotations, code execution or diagram requirements)?
5. What is the official knowledge-point authority and how will prompt plus correct solution path determine the primary point?
6. Which representative sample questions prove each risk is handled?
7. Which student flows can use the content: practice, paper, mock, download, self-check, scoring, uploads, history and mistake review?
8. Which new validators and browser checks are required before the first batch can be accepted?

An unanswered item keeps the source set in preparation. It is not a reason to invent a convenient default.

## Non-AP Assessment Model SOP

Before adding a non-AP subject:

- Decide the student-facing subject split. For example, IB Math AA is two student-facing subjects, `IB Mathematics: Analysis and Approaches SL` and `IB Mathematics: Analysis and Approaches HL`, not one AP-style subject.
- Define the assessment components that control practice and mock generation: paper, component, level, marks, time, calculator mode, optional choices, and timezone/session where relevant.
- Define the official syllabus/topic authority and version. Add `syllabus_version` to every item where the curriculum has a known revision cycle.
- Record source pair requirements. If a subject uses markschemes, a paper without a matched markscheme is deferred unless a reliable scoring source is separately approved.
- Design student surfaces before importing content: topic practice, paper practice, full mock, review/search, scoring display, and PDF export.
- Add validators that fail when AP-only assumptions are used for a non-AP subject.

## Unit Classification SOP

Classification must follow `docs/UNIT_CLASSIFICATION_STANDARD.md`.

For every new or changed item:

- Confirm the current official subject framework and unit sequence before classification.
- Confirm whether the subject already has a topic-level official map in `classification_config.json`. If not, create the needed topic map slice before accepting the batch, or record a coverage-debt finding and keep the batch out of publication until a reviewer can map it.
- Read the full item, options, shared context, and any visual.
- Determine the latest unit required to solve it with all prior units available.
- Ignore keyword-only evidence if the concept is only a label, distractor, or background.
- Record required-solving evidence when the item is newly added, repaired, or previously risky:
  - official authority source;
  - `required_topics` with unit, topic code when available, topic name, and reason;
  - `why_not_earlier_unit` for later-unit placement;
  - `classification_reasoning` that refers to the official framework boundary, not a third-party course map.
- Automated candidate scans may use the stem, shared stimulus, tables/figure captions, and the correct-answer path to find conflicts. They cannot decide the final unit by themselves, and wrong-option-only concepts cannot raise the unit.
- Treat `reviewed` status as metadata only. It never exempts an item from hard concept-boundary checks.
- Distinguish topic-level evidence from unit-level bridge evidence. Newly added, repaired, or high-risk items require topic-level evidence whenever the official topic map exists. Legacy bridge evidence cannot be used to claim a subject has been freshly reclassified item by item.
- For grouped questions, do not allow a member to appear in an earlier cumulative scope than its shared context and group members allow.
- For single-unit Quiz, grouped buckets must be filtered by `every(member.primary_unit === selectedUnit)`, never by "any member matches selected unit".
- For cumulative progression scopes, grouped buckets must be filtered by `every(member.primary_unit in learnedUnits)`.

Required gates:

- `npm run validate:official-units`
- `npm run validate:assessment-models`
- `npm run validate:classification-coverage`
- `npm run validate:classification-accuracy`
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
- Run student-surface checks under the correct account tier. Premium surfaces such as Search, question sets, similar-practice tools, and PDF export must be checked as Lynk Student, not as a visitor page.
- A gated access page is not valid evidence for PDF/search/render delivery. Render checks must fail clearly if they see the access gate while the test claims to cover premium content.
- Student-surface checks must include the content classes actually present in the subject: grouped context, code, formulas, tables, visual options, diagrams, FRQ scoring, and PDF pagination where applicable.
- Student-facing labels must be Chinese-first through the central display layer (`src/utils/displayLabels.js`). Source metadata can keep official English terms, but visible subject names, unit names, difficulty labels, account tiers, feature names, and entitlement statuses must not render raw source fields.
- Use the correct production router path for the deployed app. The current Cloudflare root-domain student app uses normal paths such as `/quiz`, `/register`, `/account`, and `/search`; do not use legacy `/#/...` paths for launch evidence.
- Use a fresh build and isolated preview port for local evidence.
- Production deployment must be followed by `lynkedu.com` verification.
- If a local preview port already serves an older student or admin build, do not reuse it as evidence. Start an isolated preview with `--strictPort`, confirm the page title and route, and verify that `/data/subjects.json` is loaded from the same origin.
- Student-facing gates must filter out internal blocked records consistently: any item with `student_visible: false`, `publish_status: blocked`, or `scoring_status: not_scored` is an internal record and must not participate in Quiz, Mock, Search, PDF, recommendation, student-flow, student-progression, data-validation, or student-risk release checks.
- Keeping blocked internal records is allowed only when every student-facing loader and gate excludes them. A blocked record with an obsolete unit is acceptable as historical inventory, but it cannot appear in student-visible counts or release ledgers.
- Hiding a scored item is itself a classification decision. For any subject with hidden/blocked scored inventory, closeout must include a reverse-hidden review that proves each hidden item is truly outside the current official framework or otherwise not deliverable. This review must prioritize stem/shared-context evidence over answer-choice distractors and must restore any item that maps to a current official topic.

The check must include DOM/text evidence for structured content, not only screenshots.

## Expansion Closeout SOP

An expansion is not complete unless all are true:

- source inventory and decisions are recorded;
- accepted items are published through the subject pipeline;
- rejected/deferred items remain out of Web data with reasons;
- source counts match subject-specific checks;
- capacity and unit distribution are reviewed;
- the full item-level student-risk ledger has P0=0/P1=0/P2=0;
- full validation/build passed;
- student-surface evidence exists;
- production data check passed if deployed;
- `PROJECT_STATUS.md`, `WORKLOG.md`, and durable main-session memory are updated;
- remote tree sync is verified.

Minimum commands:

```powershell
npm run audit:sop
npm run validate:official-units
npm run validate:student-risk
npm run validate
npm run build
npm run audit:render:all
npm run audit:capacity
npm run audit:expansion-closeout -- --subject=<subject-id> --status=partial|complete
```

Add subject-specific commands such as `npm run audit:csa` whenever they exist.

Current subject-specific classification gates include:

- `npm run validate:macro-units`
- `npm run validate:micro-units`
- `npm run validate:csa-units`
- `npm run validate:ib-math-aa`

For IB Math AA, AP MCQ/FRQ assumptions are invalid. Closeout must use the IB paper-practice model:

- subject metadata must set `curriculum: "ib"` and `assessmentModel: "ib-paper"`;
- SL and HL must be separate student-facing subject IDs when both are offered;
- paper banks must record level, paper, marks, subpart marks, calculator status, session/timezone, required official topic area, source decision, solution, and markscheme rows;
- official IB paper/markscheme files may be used for internal structure/source inventory only unless publication permission is confirmed;
- student-surface QA must include `/paper-practice` and `/paper-play`, not AP Quiz/Mock-only routes;
- closeout must run `npm run audit:ib-math-aa:student-surface -- --url <fresh-preview-or-production-url> --port <port>` for desktop and mobile evidence.

For all multi-curriculum releases, subject management is a product contract, not only a data label:

- every student-visible subject must declare `curriculum` and `assessmentModel`;
- `currentCurriculum` is the first-level student learning scope and must be persisted with the student's selected subjects;
- Home, Header, Settings, direct practice routes, and future account sync must not mix AP and IB subjects in one visible switcher or one visible home list;
- adding A-Level, IB, competition, or any future curriculum requires a curriculum-specific assessment model, route decision, renderer decision, and student-surface audit before publication;
- closeout must run `npm run validate:curriculum-partition` and a real-browser `npm run audit:curriculum-surface -- --url <fresh-preview-or-production-url> --port <port>`;
- audit reports must verify both directions: AP view does not show IB subjects, and IB view does not show AP subjects.

## Full-Diagnosis SOP

Use this before launch, after major renderer changes, after source expansion, or whenever repeated defects appear.

Run a multi-angle pass:

- data schema and answer completeness;
- image and visual precision;
- grouped context integrity;
- unit-Quiz grouped-bucket scope;
- item-level review metadata preservation after rebuild;
- subject risk signals;
- unit progression and student learning sequence;
- student flow on desktop and mobile;
- Mock and Quiz PDF export;
- search/question-set/similar-practice paths;
- access-tier boundaries;
- Chinese-first copy, UTF-8 encoding, and centralized Chinese/English label mapping;
- production data and asset freshness;
- remote tree synchronization.

Do not stop at the first fixed example. If a defect reveals a class of failures, reopen the whole class for the affected subject and decide whether the same class applies globally.

Full-diagnosis closeout must report the ledger totals: active subjects, MCQ count, FRQ count, total active items, and P0/P1/P2 counts. A response that only reports sampled subjects, sampled questions, or browser screenshots is not a full-diagnosis closeout.

## Multi-Subject Adaptation Matrix

Every new subject must explicitly answer these questions:

- Is MCQ-only, FRQ-only, or mixed delivery required?
- Does FRQ sampling need year-based or question-number-type grouping?
- Are there subject-specific renderers for code, equations, chemical notation, graphs, tables, maps, datasets, or passages?
- Are grouped prompts common?
- Can grouped prompts span units, and if so which student paths may include them?
- Are answer choices visual, tabular, or multi-line?
- What is the current official unit sequence, and which official framework source is used as the classification authority?
- Does unit classification need special boundary rules under that official framework?
- Are official sources enough, or is approved external expansion required?
- What student-path checks are mandatory for this subject?
- Has the official framework changed since the source material was published, and do any legacy units need migration or student-visible blocking?
- If legacy units are blocked, what reverse-hidden gate proves that current-framework items were not removed by stale labels or broad keyword rules?

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
