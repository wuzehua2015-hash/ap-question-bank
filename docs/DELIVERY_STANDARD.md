# Delivery Standard

Last updated: 2026-07-11

This document records release-blocking standards for the AP question bank Web package. Detailed subject workflows may live in other docs, but the rules here are mandatory before public delivery.

## Student-Surface Rule

Every item must be independently answerable from the student-facing surface where it appears.

This applies to:

- online practice;
- search results;
- score review;
- mistake book;
- mock PDF;
- exported PDF;
- FRQ practice and FRQ review.

## Grouped Questions

Grouped questions are shared-stimulus items: multiple questions reuse one prompt, figure, table, code block, experiment, scenario, or equation set.

Release-blocking rule:

- In online practice, every independent item view must render the shared material exactly once before the member-specific stem.
- `group_context` stores shared material.
- `text` or `question_text` stores only the member-specific prompt.
- The same shared material must not be duplicated inside `text` or `question_text`.
- A student must never need to remember a previous group member to answer the current item.
- Mock PDF may print shared material once for a contiguous grouped block, but the layout must make the shared context visibly and structurally available to every member item.

Required gates:

```bash
node scripts/audit_group_context_integrity.cjs
npm run validate:groups
```

Expected closeout result:

```text
P0=0, P0_CANDIDATE=0, P1=0
```

Detailed grouped-question standard: `docs/GROUPED_QUESTION_DELIVERY_STANDARD.md`.

## Browser Acceptance

For every affected subject, at least one representative grouped item must be checked on a real student surface. The check must confirm:

- shared material appears before the member-specific prompt;
- shared material appears once within the single item view;
- another member of the same group also shows the shared material once;
- the item remains answerable when opened directly from search or review.

