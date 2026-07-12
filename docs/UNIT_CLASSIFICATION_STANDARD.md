# Unit Classification Standard

## Core Rule

`primary_unit` is the latest unit a student must have completed to answer the item, including all earlier prerequisites.

This is a progression gate, not a keyword label. A term that appears in the stem, stimulus, table, visual, or answer choices is only evidence. The reviewer must decide which course model, procedure, or concept is required to solve the item.

## Required Workflow

1. Run `npm run audit:units` before repairing or certifying a subject.
2. Run `npm run audit:student-progression -- --skip-browser` during data repair, then run `npm run audit:student-progression` before release.
3. Treat advisory findings as review candidates, not automatic edits.
4. Change `primary_unit` only after reading the full item and deciding the latest required unit.
5. Do not let distractors alone determine `primary_unit`.
6. If an item is corrected, update related indexes and add a short `classification_reasoning` that states the progression-gate reason.
7. Add high-value corrected examples to `scripts/unit_progression_reviewed_cases.json` so future validation blocks regressions.

## Student Progression Simulation

The student progression check is required because unit labels are not just metadata. They control what a student sees after completing each unit.

For each active subject, the simulator must:

- walk the official unit sequence in order
- build cumulative scopes such as `U1`, `U1..U2`, and so on
- use the Quiz sampler contract with `allowedUnits`
- require grouped MCQ buckets to stay wholly inside the learned scope
- check that sampled questions, options, submission, report, and similar-practice paths work on the student side
- write the result to `.workspace/student-progression-audit/summary.json`

If a grouped item spans multiple units, it cannot appear in a cumulative stage until every member of the group is inside the learned scope. This prevents a split-screen Quiz session from showing unlearned material through a shared stimulus or grouped option set.

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
