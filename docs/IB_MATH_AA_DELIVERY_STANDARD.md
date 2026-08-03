# IB Mathematics AA Delivery Standard

## 1. Delivery definition

IB Mathematics: Analysis and Approaches SL/HL is deliverable only when the student product is based on real examination questions and the complete learning loop works. A large item count, a working page, or a passing format check is not delivery.

The standard follows the mature AP subject lifecycle but adds IB Paper structure, constructed-response scoring, uploaded work, and per-mark knowledge diagnosis.

The current authoritative count lives in `PROJECT_STATUS.md` and the item ledger; historical count snapshots in this document must not be used as progress evidence. Source locators have paired official paper/markscheme files, page ranges and fingerprints; they are not student questions and contribute zero delivered questions. A record becomes eligible for student use only after its complete structured transcription, official answer and full official markscheme are source-checked and marked `structured_reviewed`.

## 2. Real-exam source contract

Every student-visible question must have:

- an exact real exam source;
- curriculum, level, session, timezone, Paper and question number;
- the original question-file SHA-256;
- an exact paired official answer or markscheme source and SHA-256;
- page ranges for the question and answer;
- confirmed calculator rule, marks and subpart structure;
- recorded student-use status;
- a source-registry entry listing the question locator.

The following are never accepted as question content:

- self-written questions;
- template variants;
- reconstructed substitutes;
- predicted papers;
- questions remembered or paraphrased from an exam;
- third-party questions presented as official questions;
- a question without its exact official answer or markscheme pair.

Public download availability does not automatically authorize copying the full content into the student bank. Source authenticity and student-use permission are separate release gates.

## 3. Item completeness

Each admitted item must preserve:

- the complete visible stem;
- every subpart and dependency between subparts;
- figures, diagrams, graphs, tables and formula formatting;
- Paper classification and calculator rule;
- original marks and per-subpart marks;
- official final answers;
- official method, accuracy, reasoning and follow-through marks;
- alternative valid methods recorded by the markscheme;
- exact primary knowledge point and all required knowledge points derived from the prompt and correct marking path.

For the first release, knowledge-point IDs are limited to the 83 official Math AA syllabus items. SL uses the 51 items in SL scope; HL uses all 83. T1-T5 are grouping metadata only. Any finer child skill requires a separately reviewed guide-grounded specification and cannot be introduced by a keyword classifier or generated question pattern.

No question may be split, merged, shortened or rewritten in a way that changes what the student is assessed on.

For each item, the review record must trace every structured field back to the relevant paper or markscheme page. Mathematical expressions use renderable LaTex/KaTeX; tables use structured rows and columns; diagrams, graphs and geometric figures remain linked image assets with structured surrounding instructions; each labelled subpart has its official marks, final answer and complete official scoring text. A bare answer, a score list, or a short description such as “use regression” is not an answer or markscheme.

Before any bulk entry work begins, the following representative real sample set must be fully entered, rendered and checked through answer/self-check/scoring:

- SL Paper 1 and Paper 2;
- HL Paper 1, Paper 2 and Paper 3;
- at least one sample with a structured table, one with a required figure/graph, one with a multi-page markscheme, and one continuous Paper 3 investigation.

The sample set is the acceptance reference for the whole batch. A count of extracted pages, source crops, or candidate text is not sample acceptance and cannot authorize bulk entry.

## 3.1 Controlled write path

`scripts/install_ib_math_aa_structured_batch.cjs` is the only permitted writer for a reviewed Math AA item. It rejects a batch unless every stem block, table/figure, labelled part, final answer, markscheme row and scored mark point has separate page-and-hash source evidence, and every mark total reconciles. Per-item patch scripts are retired and deliberately fail if run. Extraction programs may create review-only candidates but may never change a question to `structured_reviewed`.

The operational process is the whole-paper real-source build process in `docs/GLOBAL_QUESTION_BANK_SOP.md#whole-paper-real-source-build-sop`. For Math AA specifically, `build_ib_math_aa_structured_candidates.py` may prepare reading aids from the paired official PDFs, but cannot fill a final field. Review batches must be checked with the installer's `--check` mode before writing, then installed only through the controlled writer. The representative regression set must include SL P1, SL P2, HL P1, HL P2 and HL P3, and together cover a formula, a structured table, a required diagram, a multi-page markscheme and a continuous P3 investigation.

Math AA review batches must record the source-set ID, source input hashes, candidate-output hash, reviewer, reviewed time, item state and rejection/defer reason. New examination years reuse the same batch contract, but must first pass the new-year adaptation checklist in the global SOP: the paper model, calculator rule, source pairing, formula/diagram handling, markscheme conventions and syllabus version may not be assumed unchanged.

## 4. Required inventory coverage

SL requires real P1 and P2 questions. HL requires real P1, P2 and P3 questions. The inventory must contain both short-response and long-response questions. HL P3 must retain continuous investigation structure.

Full Mock availability additionally requires the machine-readable Paper blueprint to assemble the exact official Paper roles, marks and calculator rules. Independent short questions cannot be combined and labelled as a long-response question or Paper 3 investigation.

For Papers 1 and 2, matching the total marks alone is insufficient: the Mock selector must match the approved Paper blueprint's ordered per-question mark pattern for each section. For Paper 3, it must select the required continuous-investigation mark pattern. The stored Mock order is the exact order generated from that structure.

Mock structural readiness and course release are separate checks. A reviewed real item may prove that a Paper can be assembled even while the course remains closed for student-flow, permission, or deployment checks. Student messaging must name the real pending check and must never describe a closed course as missing long questions or Paper 3 investigations.

## 5. Student workflows

Before release, all of the following must work:

1. Knowledge-point-first Quiz generation from eligible real questions.
2. Printable Quiz and answer material where student-use status permits it.
3. One persistent Mock per student, subject and Asia/Shanghai business date.
4. Fixed question order and independent resumable Paper timers.
5. Self-check mode using the official answer and markscheme.
6. Authenticated answer submission from desktop, phone or tablet.
7. Batch image/PDF submission after completing a full Mock.
8. Per-question and per-subpart attempts that never overwrite earlier attempts.
9. Manual scoring as a complete fallback.
10. Recognition-assisted transcription, formula/step confirmation and mark-point suggestions only after the upload infrastructure is configured and verified.
11. Learning-center records for Mock exams, attempts, scores, pending work, mistakes and review attempts.

## 6. Required release checks

Release requires all of these to pass:

- source registry and source-file fingerprint checks;
- canonical source inventory rebuild plus `validate_ib_math_aa_sources.py` metadata, file-integrity and PDF render-probe checks;
- exact paper/markscheme pairing and question-number checks;
- full item completeness and asset checks;
- Paper-role and Mock-assembly checks;
- answer/markscheme and per-mark scoring checks;
- item-level knowledge classification checks;
- a manual classification-ledger row keyed by `(subject_id, question_id)` with official knowledge-point codes and a current content hash;
- duplicate and unintended-content-change checks;
- database migration and API contract checks;
- account permission, timer, persistence and repeated-attempt checks;
- desktop and mobile student-flow checks;
- Quiz, Mock, PDF, upload, scoring and learning-center browser checks;
- complete validation and production build;
- production data and student-surface verification after deployment.

## 7. Stop conditions

Implementation must stop and ask the user when:

- student-use permission for a real source is not established;
- the official question and answer cannot be paired exactly;
- a delivery requirement has more than one materially different business interpretation;
- a paid service, new external account, production binding or deployment decision is required;
- a proposed shortcut would omit part of the real question, answer, scoring path or learning record.

No item count, deadline or previous implementation permits guessing past a stop condition.
