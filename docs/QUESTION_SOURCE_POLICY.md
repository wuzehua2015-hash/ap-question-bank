# Question Source Policy

## Hard rule

Student-visible question content must come from a real, reviewable source. The system and its maintainers must not write substitute questions, template variants, capacity-filling questions, reconstructed questions, or newly invented practice questions.

This rule applies to every curriculum, subject, item type, Quiz, Paper practice, Mock Exam, PDF, search result, review page, and future import workflow.

## New-question admission

A new or scoring-relevant changed question may become student-visible only when all of the following are recorded in `public/data/question_source_registry.json`:

1. A stable source registry ID and exact question locators.
2. The real question source title, year/session, Paper or form, and question number.
3. A SHA-256 fingerprint for the question source file.
4. A SHA-256 fingerprint for the paired answer or markscheme source file.
5. A completed verification status confirming the question and answer were transcribed from those files.
6. A student-use rights status of official public release, open license, or explicit licensed permission.
7. A named approval record and approval time.

Internal-only source material may be indexed and reviewed, but it must remain hidden from students until student-use permission is recorded.

## Historical content

The existing non-IB banks contain older content whose source fields are inconsistent. Their current assessed content is locked by `scripts/question_source_legacy_baseline.json`:

- the recorded content may remain unchanged while it is audited subject by subject;
- it cannot be used as a template for more questions;
- adding a question or changing prompt, answer, options, solution, marks, markscheme, parts, stimulus, or assessed assets requires the new-question admission record above;
- hiding or retiring an item remains allowed.

The 150 Math AA template-generated items are not included in this historical allowance. They are blocked and Math AA remains a candidate subject until real sourced questions and paired answers are admitted.

## Enforcement

`npm run validate:question-source` is part of `npm run validate`, `prebuild`, and `predev`. It rejects:

- any student-visible self-written source signal;
- any new question without a verified registry record;
- any changed historical assessed content without a verified registry record;
- any source without a paired answer fingerprint;
- any source that is not approved for student-visible use.

Changing this policy or replacing the historical baseline requires the user's explicit decision. Passing formatting, rendering, classification, or answer checks never substitutes for source admission.

