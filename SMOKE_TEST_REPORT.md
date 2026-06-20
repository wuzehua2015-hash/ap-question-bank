# AP Macroeconomics Question Bank - Full Smoke Test Report

Generated: 2026-06-20 20:42:42

## Summary

| Metric | Value | Status |
|--------|-------|--------|
| Total MCQ | 432 | OK |
| Total FRQ | 30 | OK |
| MCQ with images | 39 | OK |
| MCQ with tables | 54 | OK |
| Total image files | 39 | OK |
| Missing image files | 0 | PASS |
| FRQ set issues | 0 | PASS |
| Shared image references | 0 | PASS |

## Unit Distribution

| Unit | Count | Mock Exam Required | Status |
|------|-------|-------------------|--------|
| U1 | 30 | 4 | PASS |
| U2 | 55 | 9 | PASS |
| U3 | 103 | 13 | PASS |
| U4 | 122 | 12 | PASS |
| U5 | 59 | 15 | PASS |
| U6 | 63 | 7 | PASS |

## Year Distribution

| Year | MCQ Count |
|------|----------|
| 2012 | 60 |
| 2014 | 59 |
| 2015 | 58 |
| 2016 | 60 |
| 2017 | 60 |
| 2018 | 58 |
| 2019 | 59 |
| 2023 | 18 |

## Image Integrity Check

Using PIL/numpy to detect truncation and vertical splits.

| Question | Image | Issue | Verdict |
|----------|-------|-------|---------|
| 2023_Q076 | 2023_Q076_graph.png | vertically split - missing top | **FALSE POSITIVE** - Business Cycle graph is complete with all labels visible |

## Build Test

```bash
vite build
# Result: SUCCESS (3.20s)
```

## Overall Result

**PASS** - All critical checks passed. No data bugs, no missing files, no shared image references missing.

One image integrity false positive detected (2023_Q076_graph.png) due to the Business Cycle graph's natural top-to-bottom layout where the upper half is predominantly blank. The graph is complete and readable.
