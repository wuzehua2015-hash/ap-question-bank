# Unit Classification Standard

## Core Rule

`primary_unit` is the latest unit a student must have completed to answer the item, including all earlier prerequisites.

This is a progression gate, not a keyword label. A term that appears in the stem, stimulus, table, visual, or answer choices is only evidence. The reviewer must decide which course model, procedure, or concept is required to solve the item.

## Required Workflow

1. Run `npm run audit:units` before repairing or certifying a subject.
2. Treat advisory findings as review candidates, not automatic edits.
3. Change `primary_unit` only after reading the full item and deciding the latest required unit.
4. Do not let distractors alone determine `primary_unit`.
5. If an item is corrected, update related indexes and add a short `classification_reasoning` that states the progression-gate reason.
6. Add high-value corrected examples to `scripts/unit_progression_reviewed_cases.json` so future validation blocks regressions.

## Blocking Validation

`npm run validate:units` is intentionally narrower than `npm run audit:units`.

It blocks:

- missing or invalid `primary_unit`
- regression of reviewed cases

It does not block every advisory signal, because broad signals can identify risk without proving that the current unit is wrong.

## Subject Startup Requirement

Every new or reopened subject must include a unit-classification risk pass during subject risk discovery:

- read the official unit sequence
- identify late-unit concepts that often appear as outputs, distractors, table labels, or stimulus context
- define which signals are advisory and which are blocking
- sample each year/set before bulk publication
- record subject-specific classification notes in the subject delivery documentation
