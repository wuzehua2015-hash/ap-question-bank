# Question Pool Expansion Ledger

Date: 2026-07-13

## Global Rule

Question-pool expansion is a delivery-quality task, not a count-only task. New items must enter through the subject source pack, risk discovery, rendering strategy, source pipeline, validators, and student-facing checks.

Expansion completion is also not a "one-source published" event. A source batch can be accepted while the subject expansion remains unfinished.

## Expansion Goal Closeout Contract

There are two allowed closeout states:

- `partial`: one or more source batches were published, but the subject still has material capacity risk, incomplete source inventory, or deferred usable sources.
- `complete`: the expansion objective is actually achieved; capacity risk is cleared or explicitly accepted by a written product decision after full source inventory.

Hard rules:

- A goal cannot be marked complete only because one high-quality source was published.
- A subject with capacity risk `High` or `Medium` cannot be closed as complete by default.
- A subject with sparse units still listed by capacity audit cannot be closed as complete unless the remaining shortage is intentionally accepted in writing.
- A low-volume subject must have a completed network source inventory before any complete closeout.
- Every candidate source must have one of these states recorded: `published`, `deferred`, `rejected`, or `needs reconstruction`.
- If the result is only a first pass, the final status must say `partial`, list residual capacity risk, list next source candidates, and keep the goal open or open a follow-up goal.
- "Validation passed" only means the published batch is technically acceptable; it does not mean the expansion objective is complete.

Executable closeout check:

```powershell
npm run audit:expansion-closeout -- --subject=computer-science-a --status=partial
npm run audit:expansion-closeout -- --subject=computer-science-a --status=complete
```

For CSA after the CED pass, `--status=partial` is the only valid status because capacity risk remains High.

Every low-volume subject must also run a network source inventory before choosing expansion sources. Use this priority order:

1. Official current-course materials, especially current CED sample questions.
2. Official AP Central recent exam questions and scoring materials.
3. Local official released exams from 2009 or later.
4. Other public reliable sources only after source-origin, answer/scoring, publication-rights, and duplicate checks.

Do not publish a third-party-hosted PDF or question set only because it is reachable. Treat it as a lead until its source origin, completeness, answer/scoring materials, permissions, and current-course relevance are confirmed.

Every expansion pass must preserve subject-specific rendering:

- CSA: Java code blocks, structured candidate tables, complete A-E options, code-aware FRQ rubrics.
- Biology: figures, experiment tables, caption/label placement, FRQ rubric by biological claim/evidence/reasoning.
- Physics: figures, graphs, equations, variables, units, answer-option layouts.
- CSP: algorithm blocks, pseudocode, data tables, image-option ownership, Create written-response slots.
- APES: data tables, figures, grouped stimuli, source-context placement.

## Capacity Queue

1. AP Computer Science A: capacity expansion completed; now 291 MCQ / 12 FRQ after adding current CED, AP Bowl 2018, CSAwesome open practice, and a small LynkEdu U1 original batch. Capacity risk OK; no sparse units.
2. AP Physics 1: capacity reinforcement completed on 2026-07-16; now 250 MCQ / 15 FRQ; capacity risk OK.
3. AP Biology: capacity reinforcement completed on 2026-07-16; now 250 MCQ / 30 FRQ; capacity risk OK.
4. AP Computer Science Principles: capacity reinforcement completed on 2026-07-16; now 250 MCQ / 8 written-response items; U1 sparse and U3 concentration cleared.
5. AP Physics 2: capacity reinforcement completed on 2026-07-16; now 250 MCQ / 28 FRQ; capacity risk OK.
6. AP Environmental Science: capacity reinforcement completed on 2026-07-16; now 250 MCQ / 8 FRQ; sparse U2/U4/U5 cleared.

Executable audit:

```powershell
npm run audit:capacity
```

Report path:

```text
.workspace/subject-capacity-audit/subject-capacity-report.json
```

## Multi-Subject Capacity Reinforcement: LynkEdu Owned Practice

Status: complete for capacity-risk clearance on 2026-07-16.

Published source:

- Source set: `lynkedu_capacity_20260716`.
- Source type: LynkEdu owned original practice.
- Scope: MCQ only, structured text, no external visual dependency.
- Purpose: clear pre-launch capacity risk and sparse-unit risk for five low-volume active subjects.

Published counts:

- AP Computer Science Principles: +102 MCQ; final 250 MCQ / 8 written-response items.
- AP Biology: +97 MCQ; final 250 MCQ / 30 FRQ.
- AP Physics 1: +129 MCQ; final 250 MCQ / 15 FRQ.
- AP Physics 2: +81 MCQ; final 250 MCQ / 28 FRQ.
- AP Environmental Science: +50 MCQ; final 250 MCQ / 8 FRQ.

Source reports:

- `subjects/AP/Computer-Science-Principles/02-data/lynkedu_capacity_20260716/source_report.json`
- `subjects/AP/Biology/02-data/lynkedu_capacity_20260716/source_report.json`
- `subjects/AP/Physics-1/02-data/lynkedu_capacity_20260716/source_report.json`
- `subjects/AP/Physics-2/02-data/lynkedu_capacity_20260716/source_report.json`
- `subjects/AP/Environmental-Science/02-data/lynkedu_capacity_20260716/source_report.json`

Reusable mechanism:

- `scripts/add_capacity_reinforcement_20260716.cjs` is an idempotent upsert publisher for this source set.
- Items carry `source_set`, `provenance`, `classification_reasoning`, `rendering_review`, and `answerability_review`.
- Similarity indexes are updated for new items and same-unit recommendations.

Validation evidence:

- `npm run audit:capacity`: all 16 active subjects risk OK.
- `npm run validate:unit-distribution`: 0 warnings.
- `npm run validate:student-progression -- --skip-browser`: 0 errors / 0 warnings / 0 findings.
- `npm run validate`: passed.
- `npm run build`: passed.
- Student-flow audits for Biology, CSP, APES, Physics 1, and Physics 2: 0 errors.

## CSA Expansion Closeout: Current CED

Status: superseded by full CSA capacity closeout below. The CED batch remains a published official-current source batch.

Published source:

```text
2025 AP Computer Science A Course and Exam Description
```

Published scope:

- 20 MCQ.
- 4 FRQ.
- Structured Java/code/table/list reconstruction.
- A-D answer options preserved for CED items.
- CSA FRQ scoring rows plus fenced Java reference solutions.

Pipeline and audit assets:

```text
subjects/AP/Computer-Science-A/tools/build_ced_2025_data.py
subjects/AP/Computer-Science-A/tools/csa_pipeline.py
subjects/AP/Computer-Science-A/02-data/ced_2025/
scripts/csa_content_audit.cjs
npm run audit:csa
```

Validation evidence:

- `npm run audit:csa`: pass.
- `npm run validate`: pass.
- `npm run build`: pass.
- `npm run audit:render -- --subject=computer-science-a`: pass, all 125 MCQ and 12 FRQ selected, 0 errors / 0 warnings.
- `npm run audit:student-flow -- --subject=computer-science-a`: pass, 0 errors; internal question-id visibility warnings are non-blocking because content is visible.
- `npm run audit:capacity`: CSA remains high risk because total MCQ count is still 125 and multiple units remain sparse.

## CSA Deferred Source: 2009 Scanned Released Exam

Candidate source:

```text
D:\Lynk\翎英教育LynkEdu\subjects\AP\Computer-Science-A\01-exams\AP_Computer_Science_A_2009_Released_Exam.pdf
```

Current 2009 status:

- 135-page scanned released exam.
- No embedded text layer.
- OCR probe confirms the package includes MCQ, answer key, FRQ prompts, general scoring guidelines, question-specific scoring guidelines, student responses, and commentary.
- OCR artifacts are local workspace assets under:

```text
D:\Lynk\翎英教育LynkEdu\.workspace\csa_2009_probe
```

Additional network source candidates:

- Current official CED: `https://apcentral.collegeboard.org/media/pdf/ap-computer-science-a-course-and-exam-description.pdf`
  - high priority for timeliness and current framework alignment;
  - must be inventoried, deduplicated against current package, and checked for answer/explanation availability.
- AP Central past CSA questions: `https://apcentral.collegeboard.org/courses/ap-computer-science-a/exam/past-exam-questions`
  - useful for recent FRQ expansion and scoring style;
  - does not solve the CSA MCQ pool shortage by itself.
- Third-party mirrors of practice exams:
  - deferred unless source origin, rights, answer key, and completeness are confirmed.

Observed page map:

- Page 20: Section I starts, 40 MCQ.
- Pages 60-73: Java / GridWorld appendix material.
- Pages 74-90: Section II FRQ prompts.
- Page 91: Section I answer key table.
- Page 96: general scoring guidelines.
- Pages 98, 108, 114, 122: question-specific scoring guidelines for FRQ 1-4.

Publish gate:

- Do not publish raw OCR or broad screenshots.
- Segment 40 MCQ and 4 FRQ.
- Restore Java code punctuation, indentation, and identifiers.
- Restore complete A-E options and answer key.
- Rebuild FRQ prompt/rubric with CSA reference solutions and part-level rows.
- Reclassify units by required learning sequence.
- Run validation, capacity audit, real-browser Search/Quiz/FRQ/Mock/PDF sampling.

## Current 2009 Non-Publishable State

The current CED expansion has been published. No 2009 items are publishable yet. The next 2009 implementation step is a scanned-source reconstruction pipeline for the 2009 source.

## CSA Full Capacity Closeout

Status: complete.

Published additional sources after the CED partial batch:

- AP Bowl 2018 / Georgia Tech public practice: 38 MCQ accepted, 2 excluded before publish.
- CSAwesome / Runestone open-curriculum practice: 122 MCQ accepted from 135 candidates; GFDL 1.3 license and source credit retained in provenance.
- LynkEdu original U1 practice: 6 MCQ added only to clear Primitive Types sparse coverage.

Final CSA package:

- 291 MCQ.
- 12 FRQ.
- +186 MCQ relative to the pre-expansion 105-item package.
- Capacity audit: OK; no sparse units.

Reusable mechanism lessons:

- A complete expansion can combine official samples, public practice, open-curriculum items, and a small owned-content patch, but each source must carry a distinct `source_set`, provenance, license/credit where applicable, and source decision.
- Open curriculum is not official exam content; it must be labeled as practice and may require license metadata.
- Item classification must follow the required learning sequence. Do not classify by broad keywords such as a method name.
- Structure-risk scanning must distinguish true tabular/record prompts from abstract uses of words like `database`.

Closeout evidence:

- `npm run audit:csa`: pass.
- `npm run validate`: pass, 0 errors / 0 warnings.
- `npm run build`: pass.
- `npm run audit:render -- --subject=computer-science-a`: pass, all 291 MCQ and 12 FRQ covered.
- `npm run audit:student-flow -- --subject=computer-science-a`: pass, 0 errors / 5 non-blocking internal-ID visibility warnings.
- `npm run audit:capacity`: CSA OK.
- `npm run audit:expansion-closeout -- --subject=computer-science-a --status=complete`: pass.
- Production data check: `lynkedu.com` returns 291 CSA MCQ and 12 CSA FRQ.
- Source mirror check: stable push completed; `npm run stable:status` confirms the remote tree matches the local HEAD tree.

## Deferred Source Curated Follow-Up

Date: 2026-07-14.

Sources rechecked:

- AP Computer Science A 2009 released exam.
- AP Bowl 2015.
- AP Bowl 2016.

Outcome:

- CSA package is now 302 MCQ / 12 FRQ.
- AP Bowl 2015 published 5 high-confidence MCQ; 35 candidates remain rejected/deferred in `source_report.json`.
- AP Bowl 2016 published 4 high-confidence MCQ; 36 candidates remain rejected/deferred in `source_report.json`.
- 2009 released exam published 2 high-confidence current-course-compatible MCQ; 38 MCQ remain rejected/deferred.
- 2009 FRQ remains deferred until prompt cleanup, reference solutions, and part-level scoring rows meet CSA standard.

Quality rule:

- Scanned/OCR sources must not be published by count target alone. Only items with complete stem, complete options, verified answer, stable Java/code text, current-course fit, and required-learning-sequence unit classification may enter Web data.

Evidence:

- `npm run audit:csa`: pass, 302 MCQ / 12 FRQ.
- `npm run validate`: pass.
- `npm run audit:capacity`: CSA OK.
- `node scripts/unit_progression_audit.cjs --subject=computer-science-a --blocking --fail-on-findings`: pass.
- `npm run audit:render -- --subject=computer-science-a`: pass.
- `npm run audit:student-flow -- --subject=computer-science-a`: pass, 0 errors / 5 non-blocking warnings.
- `npm run build`: pass.

## CSA Rendering And Student-Surface Contract Follow-Up

Date: 2026-07-14.

The deferred-source follow-up exposed two reusable delivery rules:

- Shared materials for grouped questions must be represented as `group_context` plus formal group metadata, and they must be rendered on the student surface. It is not enough for the data to contain `group_context`; `QuestionCard`, `QuestionDisplay`, review, and PDF surfaces must display it before the member stem.
- CSA candidate lists using `I.`, `II.`, `III.` are structured content. Source cleanup must normalize labels such as `III.s1.equals(s4)` to `III. s1.equals(s4)`, and rendering must display each candidate as its own row.

Concrete repair:

- `2014_sample_Q08` and `2014_sample_Q09` now share a consistent `TimeRecord` class declaration through `group_context`.
- `ap_bowl_2018_Q33` now renders the code block and Roman-numeral candidate statements in the online Quiz card.
- `scripts/csa_content_audit.cjs` now checks the full student-visible prompt (`group_context + text`) before accepting missing-code prompts or Roman-numeral candidate lists.

Evidence:

- `npm run audit:csa`: pass.
- `npm run validate`: pass.
- `npm run build`: pass.
- Real-browser Quiz check passed for `2014_sample_Q08` and `ap_bowl_2018_Q33` on local built preview.
