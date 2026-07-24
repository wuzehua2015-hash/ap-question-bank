# IB Mathematics: Analysis and Approaches Onboarding Plan

Last updated: 2026-07-24

## Decision

IB Mathematics: Analysis and Approaches must be onboarded as an IB paper-based subject family, not as another AP MCQ/FRQ subject.

Student-facing subjects:

- `IB Mathematics: Analysis and Approaches SL`
- `IB Mathematics: Analysis and Approaches HL`

Shared internal course key:

- `curriculum: "ib"`
- `course: "math-aa"`

Required per-item metadata:

- `level`: `SL`, `HL`, or `shared`
- `paper`: `P1`, `P2`, or `P3`
- `calculator_allowed`: `false` for Paper 1, `true` for Paper 2, and paper-specific for HL Paper 3 when verified from the source
- `session`: e.g. `2023-May`
- `timezone`: `TZ1`, `TZ2`, or `TZ0`
- `marks`
- `part_marks`
- `syllabus_version`
- `topic_area`
- `subtopic_code`
- `required_topics`
- `source_paper_path`
- `source_markscheme_path`

## Current Local Source Inventory

Primary local source root:

- `subjects/IB/Group-5-Mathematics/01-exams/Maths AA`

Backup mirror:

- `backups/真题/IB/Group 5 - Mathematics/Maths AA`

Both roots currently contain 113 PDF files with the same session-level counts.

External authority references for onboarding decisions:

- IB DP mathematics curriculum page: `https://ibo.org/programmes/diploma-programme/curriculum/mathematics/`
- IB Math AA curriculum update page: `https://ibo.org/university-admission/latest-curriculum-updates/dp-mathematics-analysis-and-approaches-updates/`
- Local/current guide candidate found through public search: `Mathematics - Analysis and Approaches Subject Guide.pdf`, first assessment 2021. Treat this as a syllabus authority candidate only after the local/legal source decision is recorded.

Local AA coverage found:

| Level | Kind | Count |
| --- | ---: | ---: |
| HL | Paper | 34 |
| HL | Markscheme | 35 |
| SL | Paper | 24 |
| SL | Markscheme | 20 |

Session coverage:

| Session | HL files | SL files | Notes |
| --- | ---: | ---: | --- |
| 2021-May | 11 | 8 | mostly paired; HL P1 TZ2 markscheme has no paper in primary root |
| 2021-Nov | 6 | 4 | paired |
| 2022-May | 12 | 7 | SL P1 TZ2 paper missing markscheme |
| 2022-Nov | 6 | 2 | SL only has P2 |
| 2023-May | 24 | 16 | many duplicate `_2` files |
| 2023-Nov | 10 | 6 | SL TZ2 P1/P2 missing marksheets |
| 2024-May | 0 | 1 | SL P2 TZ1 paper only; no markscheme |

Pairing gaps to resolve before extraction:

- Missing markscheme for `Standard/2022-May/Paper 1/MathsAA_SL_P1_2022_May_TZ2.pdf`
- Missing markscheme for `Standard/2023-Nov/Paper 1/MathsAA_SL_P1_2023_Nov_TZ2.pdf`
- Missing markscheme for `Standard/2023-Nov/Paper 2/MathsAA_SL_P2_2023_Nov_TZ2.pdf`
- Missing markscheme for `Standard/2024-May/Paper 2/MathsAA_SL_P2_2024_May_TZ1.pdf`
- Missing paper for `Higher/2021-May/Markscheme/MathsAA_HL_P1_2021_May_TZ2_MS.pdf`

Duplicate class:

- 2023-May HL and SL Paper 1/2/3 contain `_2` copies for both paper and markscheme. These must be deduplicated or explicitly selected before extraction.

## Source Approval Rules

Accepted candidate sources:

- Current Math AA files from the 2021-first-assessment syllabus family.
- Paper and markscheme pairs with verified level, paper, session, timezone, and readable pages.

Deferred sources:

- Paper without markscheme, unless manually reviewed and a reliable scoring source is added.
- Markscheme without paper.
- Duplicate files until one canonical copy is selected.
- `Maths AI`, `Maths (Old Syllabus)`, `Maths Studies (Old Syllabus)`, and `Further Maths (Old Syllabus)` for this AA launch.

Rejected for Math AA launch:

- Old syllabus mathematics files unless a separate legacy mode is intentionally created.
- AI materials, because they belong to a different IB mathematics course.
- Non-English alternate-language papers unless the product intentionally adds multilingual delivery.

## Web Platform Changes Needed

Data model:

- Generalize `subjects.json` from AP-only fields to curriculum-aware subject records.
- Keep AP paths unchanged.
- Add IB paths under `public/data/ib/math-aa-sl/` and `public/data/ib/math-aa-hl/`, or one shared `public/data/ib/math-aa/` package with two student-facing subject entries.
- Add an assessment model field such as `assessmentModel: "ib-paper"` so AP MCQ/FRQ logic is not reused by mistake.

Student flows:

- Topic Practice: filter by `level` plus official Math AA topics.
- Paper Practice: choose level, paper, session, timezone, and optionally question number.
- Mock: build by official IB paper structure and marks, not AP unit distribution.
- Review/Search: show marks, paper, level, calculator status, and markscheme-derived solution.
- PDF: preserve marks and subparts; avoid splitting mathematical working and answer lines across pages.

Rendering:

- KaTeX is mandatory for formulas.
- Tables, graphs, coordinate diagrams, and geometric diagrams require visual QA.
- Broad full-page images are not acceptable as the default delivery form. Use cropped figures only when they are the faithful representation of a diagram, graph, table, or source visual.
- Markschemes need Math AA scoring/working layout, not AP FRQ rubric templates.

Validation:

- Source pair completeness gate.
- Duplicate canonical-source gate.
- Paper metadata gate.
- Marks-sum gate.
- Formula/rendering token gate.
- Figure-reference gate.
- Official-topic classification gate.
- Student-surface gate for Topic Practice, Paper Practice, Mock, Search/review, and PDF.

## Implementation Sequence

1. Approve source set.
2. Build canonical source inventory JSON.
3. Add IB subject/schema support without changing AP behavior.
4. Build Math AA extraction pipeline on one complete paper pair.
5. Manually inspect extracted questions, marks, formulas, and visuals.
6. Add Math AA classification config from official syllabus topics.
7. Publish a small reviewed pilot set.
8. Run student-surface QA.
9. Scale extraction only after the pilot passes.
10. Close with validation, build, production check, SSoT update, and remote sync.

## Launch Recommendation

Do not begin by importing all 113 PDFs. Start with one complete SL paper pair and one complete HL paper pair, because that tests all core risks: formulas, diagrams, markscheme structure, paper metadata, student paper-practice flow, and PDF output. After the pilot is clean, expand by canonical paper pairs.
