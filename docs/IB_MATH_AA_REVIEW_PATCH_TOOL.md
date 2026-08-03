# IB Math AA Review Patch Tool

This is the front-half batch tool for the AP-style IB Math AA workflow.

It replaces manual edits to `reviewed_skeleton_items` with a standard patch file:

```powershell
node scripts\apply_ib_math_aa_review_patch.cjs `
  --input <review-batch.review-draft.compact-spec.json> `
  --patch <review-patch.json> `
  --output <patched-review-batch.json> `
  --report <report.json> `
  --ready-check `
  --ready-batch-id <ready-id>
```

The script does not install formal bank records. With `--ready-check`, it only runs the existing ready gate and installer `--check`.

## Patch Shape

```json
{
  "schema_version": 1,
  "reviewer": "Codex",
  "reviewed_at": "2026-08-02",
  "default_review_method": "Checked against rendered question and markscheme assets.",
  "default_classification_method": "Confirmed from the verified scoring path.",
  "items": [
    {
      "subject_id": "ib-math-aa-sl",
      "question_id": "P1-000001",
      "text": "Full student-facing stem.",
      "stem_blocks": [
        { "type": "paragraph", "text": "Full student-facing stem.", "source_asset_indexes": [0] }
      ],
      "parts": [
        { "label": "a", "marks": 2, "text": "Question part text.", "source_asset_indexes": [0] }
      ],
      "answers": [
        { "part": "a", "text": "Final answer.", "markscheme_asset_indexes": [0] }
      ],
      "markscheme_rows": [
        {
          "part": "a",
          "marks": 2,
          "text": "Official scoring path in compact form.",
          "markscheme_asset_indexes": [0],
          "mark_points": [
            {
              "id": "MP1",
              "code": "M1",
              "description": "Method point.",
              "marks": 1,
              "knowledge_point_codes": ["AA-1.1"]
            },
            {
              "id": "MP2",
              "code": "A1",
              "description": "Final answer point.",
              "marks": 1,
              "knowledge_point_codes": ["AA-1.1"]
            }
          ]
        }
      ],
      "solution_outline": ["Short solving outline."],
      "primary_knowledge_point": "AA-1.1",
      "required_knowledge_points": ["AA-1.1"],
      "why_not_earlier_topic": "Earliest viable knowledge point.",
      "classification_evidence": "Visible solving path requires AA-1.1.",
      "solving_path_steps": ["Step 1", "Step 2"]
    }
  ]
}
```

## Built-In Checks

- Every patch item must match an existing `reviewed_skeleton_items` record.
- Every part must have a matching answer and markscheme row.
- Part marks and markscheme row marks must agree.
- Mark point marks must add up to the row marks.
- Question and markscheme asset refs are required.
- Knowledge point codes must exist in `classification_config.json`.
- Pending review markers and auto metadata are removed before validation.
- Review and classification certification are filled and checked.

## Regression Evidence

Both 5-item regression batches passed through this tool with ready gate and installer `--check`:

```powershell
node scripts\apply_ib_math_aa_review_patch.cjs --input tmp\ib-math-aa-review-patches\regression-v142-review-batch-08.base-from-items.json --patch tmp\ib-math-aa-review-patches\regression-v142-review-batch-08.patch.json --output tmp\ib-math-aa-review-patches\regression-v142-review-batch-08.patched.json --report tmp\ib-math-aa-review-patches\regression-v142-review-batch-08.report.json --ready-check --ready-batch-id review-patch-regression-v142-b08

node scripts\apply_ib_math_aa_review_patch.cjs --input tmp\ib-math-aa-review-patches\regression-v144-review-batch-10.base-from-items.json --patch tmp\ib-math-aa-review-patches\regression-v144-review-batch-10.patch.json --output tmp\ib-math-aa-review-patches\regression-v144-review-batch-10.patched.json --report tmp\ib-math-aa-review-patches\regression-v144-review-batch-10.report.json --ready-check --ready-batch-id review-patch-regression-v144-b10
```

Results:

- v142 batch-08: 5 patched, 5 ready, 0 rejected, installer check passed.
- v144 batch-10: 5 patched, 5 ready, 0 rejected, installer check passed.

## Rule

Do not manually edit formal IB Math AA bank files or continue new item installation until source review output has gone through this patch tool, ready gate, and installer `--check`.
