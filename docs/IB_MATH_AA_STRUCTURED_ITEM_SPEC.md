# IB Mathematics AA Structured Item Specification

This specification is the only permitted format for a Math AA item that can become student-visible. It implements the global structured-delivery standard. It applies to SL and HL, every Paper, Quiz, Mock, review, self-check and submitted-answer record.

## 1. Canonical identifier and source identity

The permanent item identity is `(subject_id, question_id)`. Math AA question IDs are `P1-######`, `P2-######` or `P3-######`; a labelled subpart is identified by `(subject_id, question_id, part_label)`.

Each record carries `source` with the level, session, timezone, Paper, official question number, both source-file SHA-256 values, source page ranges and approved student-use status. `source_evidence` retains original crops solely as proof and as a visual attachment where a separate diagram, graph or figure is necessary.

## 2. Structured question content

`content.stem_blocks` is an ordered array of shared prompt blocks, each of which is one of:

- `paragraph`: complete instructions or shared context in renderable text. Inline and display mathematics use KaTeX-compatible LaTex delimiters.
- `table`: `caption`, ordered `columns`, and ordered `rows`; each cell is renderable text. A table image never substitutes for these cells.
- `figure`: a required diagram/graph asset, a complete alt description and the surrounding structured instructions that establish how it is used.

`content.parts` is ordered and contains every labelled part exactly once. Each part holds `label`, `marks` and its own ordered `blocks`. Dependent parts state their dependency in `depends_on` without repeating or shortening shared context. When an official question has no shared preamble, `stem_blocks` is empty and every student-visible word must appear in the ordered part blocks; no invented heading or empty placeholder is permitted.

The compatibility `text` and `parts[].text` fields are rendered from the same structured content. They must not contain a shorter alternative question.

When an official source page contains both a figure and question text, the figure asset must be a reviewed diagram-only crop. Its audit entry records the parent source asset hash, crop rectangle, derived-file hash and reviewer. A full question-page crop cannot be relabelled as a figure attachment.

## 3. Answers and official scoring content

`answers` contains one record per labelled part, with the official final answer in renderable form and accepted rounding/format conditions where the official markscheme provides them.

`markscheme.rows` is ordered as the official markscheme presents it. Every row contains:

- `part`, `marks`, and the complete official marking text in `text`;
- every individual mark point in order, with its official code (`M1`, `A1`, `AG`, and so on), exact mark value and the complete official wording;
- explicit official notes, alternative routes, follow-through conditions, accuracy/rounding conditions or exclusions, when supplied.

Paraphrasing an official scoring rule is not acceptable. The only permitted normalization is non-semantic formatting: LaTex delimiters, table cell boundaries, labels and Unicode cleanup necessary for rendering. `solution.outline` may be a navigation aid only and can never substitute for `answers` or `markscheme`.

## 4. Classification and audit trail

`knowledge_point_classification` has one official primary Math AA syllabus code and all required official codes. Each mark point stores the full applicable code list.

`structured_field_audit` maps every student/scoring field to its source role, source file fingerprint, source page and source asset hash. At minimum it covers the stem, every table/figure, every part, every final answer and every markscheme row. The transcription review records the reviewer, date, rendered comparison method and a hash over the structured payload.

## 5. Statuses and promotion

`source_located` means only source pairing/crops exist. `structured_transcription_pending_review` means the complete structured payload has been entered but is not source-checked. `structured_reviewed` means the full payload, including all official scoring text, has been checked against the cited source assets.

Only `structured_reviewed` may enter course-release, Quiz, Mock, search, PDF, self-check or system-scoring eligibility. A representative item must also pass desktop and mobile rendering plus answer/self-check/scoring verification before a batch using its format begins.

## 6. Paper-specific rules

- P1 and P2 retain the calculator rule from the exact source and preserve every short or extended response as one official question.
- P3 remains a continuous investigation: context, all parts, figures, data and scoring rules stay in one item and cannot be split or recombined.
- Figures, graphs and geometry diagrams may be attached assets, but instructions, labels, numerical data and assessment requirements remain structured fields.

## 7. Sample acceptance reference

`ib-math-aa-sl::P2-000046` (November 2022, Paper 2, Q1) is the first complete structured sample. It contains a two-row data table, three labelled parts and the complete paired official scoring content. It remains non-visible until the full course passes release gates, and its format is the required reference for the first bulk transcription batch.
