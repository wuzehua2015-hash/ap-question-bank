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

1. AP Computer Science A: first pass completed; now 125 MCQ / 12 FRQ after adding current CED. Still sparse U1, U2, U3, U7, U10.
2. AP Physics 1: 121 MCQ / 15 FRQ; sparse U5, U6, U8.
3. AP Biology: 153 MCQ / 30 FRQ; sparse U2, U4, U5, U7.
4. AP Computer Science Principles: 148 MCQ / 8 written-response items; U1 sparse and U3 over-concentrated.
5. AP Physics 2: 169 MCQ / 28 FRQ; total MCQ below target.
6. AP Environmental Science: 200 MCQ / 8 FRQ; sparse U2, U4, U5.

Executable audit:

```powershell
npm run audit:capacity
```

Report path:

```text
.workspace/subject-capacity-audit/subject-capacity-report.json
```

## CSA Expansion Closeout: Current CED

Status: partial source-batch closeout, not full CSA expansion completion.

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
