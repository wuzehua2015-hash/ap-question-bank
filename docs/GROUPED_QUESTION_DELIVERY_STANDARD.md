# Grouped Question Delivery Standard

Last updated: 2026-07-11

This standard applies to every subject that contains shared-stimulus question groups, including MCQ groups and any FRQ sets that reuse the same prompt, figure, table, code block, experiment, scenario, or source material.

## Required Student Behavior

For online practice, every grouped item must be independently answerable.

- Each individual question view must render the shared material exactly once before the member-specific question stem.
- The shared material must live in `group_context`.
- The member-specific prompt must live in `text` or `question_text`.
- The same shared material must not also be duplicated at the beginning of `text` or `question_text`.
- If a student opens only one member of the group, that page must still include all required shared context, tables, figures, and formulas.

Correct online rendering for a group member:

```text
[group_context]
Questions 30-31 ...
Shared figure/table/scenario/equation description...

[text]
At which labeled point is ...

[options]
A. ...
B. ...
```

Incorrect online rendering:

```text
[text]
Shared figure/table/scenario/equation description...

At which labeled point is ...

[group_context]
Shared figure/table/scenario/equation description...
```

## Mock PDF Rule

Mock PDF output may choose a compact grouped layout, but it must preserve answerability.

- It is acceptable for a mock PDF to print shared material once for a contiguous grouped block, followed by each member item.
- It is also acceptable for a mock PDF to repeat shared material per item.
- It is not acceptable for a mock PDF to omit shared material for any item unless the PDF layout makes the grouping visually and structurally unambiguous.

Online practice has the stricter rule: every independent item view must include `group_context` once.

## Data Contract

Every grouped item must satisfy the following:

- `group_id` is present and stable.
- `group_members` lists all member `question_id` values in question order.
- Every member has the same normalized `group_context`.
- `requires_group_context` is `true` when the item cannot be answered without the shared material.
- `group_context` contains only shared material, not the stem unique to one member.
- `text` or `question_text` starts with the member-specific task, not with a repeated copy of the shared material.

## Release Gate

Before delivery, grouped-question checks must pass:

```bash
node scripts/audit_group_context_integrity.cjs
npm run validate:groups
```

Expected result:

```text
P0=0, P0_CANDIDATE=0, P1=0
```

For at least one representative grouped item in each affected subject, a real student surface check must confirm:

- shared material appears before the member stem;
- shared material appears once within that single item view;
- switching to another group member still shows the shared material once;
- no page depends on the student having seen a previous member of the group.

## Severity

- P0: a group member is missing required shared material, has broken `group_members`, has inconsistent `group_context`, or cannot be answered independently online.
- P1: shared material is duplicated in both `group_context` and member `text`, or the member stem still contains group marker text.
- P2: mock PDF grouped layout is readable but inconsistent with the preferred compact format.

