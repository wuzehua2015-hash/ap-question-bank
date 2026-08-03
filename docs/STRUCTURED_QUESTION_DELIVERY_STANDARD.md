# Structured Question Delivery Standard

This is the universal student-question delivery contract for every curriculum, subject and assessment type. It applies to MCQ, FRQ, Paper practice, Quiz, Mock Exam, review, search and PDF output.

## Highest-priority delivery rule

Making the student system genuinely usable at the highest delivery standard is the first priority. It takes priority over item counts, speed, automation, prior labels, passing non-content checks, source-image coverage, and a green build.

When a team member cannot determine the required delivery form, ordering, source-use condition, or acceptance standard with confidence, work must pause for a user decision. It must not choose a cheaper or shorter interpretation on its own.

## One delivery form

The question bank is structured student-readable data. A question is delivered only when its complete assessed text is stored as text/data fields and rendered by the product.

Original PDFs, page crops, screenshots and scans are source evidence. They may also be attached for a figure, graph, map, diagram, handwritten response area or other visual that cannot be faithfully represented as structured data. They are never a replacement for the stem, options, subparts, answer or markscheme.

## Required item content

Every delivered item must contain:

1. Complete stem, including all instructions and shared context.
2. Complete options for selected-response items, or complete labelled subparts for constructed-response items.
3. Structured formulas, code, tables and textual data in the appropriate renderable field.
4. Every required visual as an item- or group-owned asset, linked from the relevant structured text.
5. Verified answer, solution, rubric or markscheme content in structured fields.
6. Source metadata, exact locator and paired answer/markscheme evidence under the question-source policy.

For marked papers, every subpart must have its actual mark value and the full official marking content that supports it. A summary, paraphrase, extracted heading or partial answer is not a markscheme delivery.

## Forbidden substitutions

The following cannot be counted as a delivered question, an approved transcription, a completed review, or release-ready inventory:

- a full-page or cropped image presented as the only question body;
- a short accessibility summary in place of the actual stem;
- a list of marks or scoring labels in place of the official marking content;
- a source locator without structured question and answer content;
- a diagram image without the surrounding structured instruction that tells the student how to use it.

## States and counting

`source_located` means the original question and paired answer were found. It is useful preparation, but contributes zero delivered items.

`structured_transcription_pending_review` means a full text/data transcription exists but has not yet been checked against the source. It contributes zero delivered items.

`structured_reviewed` means the full structured question and official answer/markscheme were checked against the source. Only this state may be counted as a completed question, subject to the source, classification and student-surface gates.

No other state, count, source crop, page total or checklist can be described as completed student-bank content.

## Required enforcement

`npm run validate:structured-delivery` is a release-blocking global gate. It rejects any visible item with no structured stem, any visible item that uses source images as its display mode, incomplete structured subparts or structured marking rows, and any candidate that claims completed transcription while still using source images as the question display.

Each batch must also be checked in the actual student surface. A passing file check proves only that the required fields exist; it does not prove that the rendered item is readable or complete.

## Legacy-material disposition

Material collected under an earlier image-first, summary-first, or incomplete-markscheme workflow is source-location material only unless it independently satisfies every requirement above. Existing labels such as `reviewed`, `approved`, `installed`, `audited`, or `ready` do not override this rule.

For IB Mathematics AA on 2026-07-31, 413 image-first records are explicitly `source_located`: they retain useful paper pairing, page references, crops, hashes, question locators and preliminary classification notes, but contribute **zero** delivered questions. The separate non-visible structured sample `ib-math-aa-sl::P2-000046` proves the required format; it is not a course-release claim. Every remaining record stays closed to students until it has completed a source-checked structured transcription of the full question, official answer and full official markscheme.
