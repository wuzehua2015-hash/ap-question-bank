# Structured Prompt Delivery Contract

Last updated: 2026-07-14

This file is part of the Web SSoT for AP question-bank delivery.

## Core Rules

- Grouped-question context is part of the student prompt. A question with `group_context` must render that context in Quiz, Search/review, and PDF surfaces before the member stem.
- Source cleanup is not complete until the student-visible prompt is answerable. Audits must check `group_context + text`, not only `text`.
- Subject-specific renderer rules must be verified on the actual student path, not only by JSON inspection.

## CSA Rules

- AP Computer Science A requires fenced code blocks for referenced code, methods, classes, algorithms, and missing-code placeholders.
- CSA prompts containing `/* missing code */` or equivalent markers must include the referenced Java code block in the visible prompt, with the placeholder inside that block.
- Roman-numeral candidate lists (`I.`, `II.`, `III.`) are structured content. Normalize source labels and render them as separate rows instead of leaving them as a dense paragraph.
- Source text like `III.s1.equals(s4)` is a cleanup failure.

## Required Evidence

For any future fix touching grouped prompts, CSA code prompts, or Roman-numeral candidate lists:

- run the subject-specific audit, such as `npm run audit:csa`;
- run `npm run validate`;
- run `npm run build`;
- verify at least one actual student path in a browser, preferably Quiz plus Search/review or PDF if the affected surface is shared.
