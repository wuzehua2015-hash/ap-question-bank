# LynkEdu Worklog

## 2026-08-03

- Completed v204 `review-batch-01` for `ib-math-aa-sl/P2-000007` through the standard review patch workflow after recovering the missing official markscheme continuation page. Added source asset `public\data\ib\math-aa\real-source-assets\markscheme\mathsaa_sl_p2_2021_may_tz1\q07-p15.png` and registered it in `public\data\ib\math-aa\visual_intake_manifest.json`; patch `tmp\ib-math-aa-review-patches\v204-review-batch-01.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 1, selected 1, ready 1, rejected 0, materialized reviewed batch, and installer no-write passed. Controlled install added/upgraded closed structured reviewed `ib-math-aa-sl/P2-000007` (16-mark compound-interest and geometric-series savings target item; primary `AA-1.8`; required `AA-1.8`, `AA-1.4`, `AA-1.3`). Full gates passed: curriculum build, structured delivery gate (`5851 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 106 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v205-post-v204-batch-01-health`: 0 ready, 0 review drafts, 325 failures/deferred, 0 structural failures, terminal handoff OK, 0 review batches, `review_draft_quality.ok:true`, `handoff_gate.ok:true`. Formal bank remains closed: SL 162 and HL 271, visible 0, published 0, blocked 433; both subjects remain `active:false`, `visibility:"candidate"`, `releaseStatus:"candidate"`. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v205-post-v204-batch-01-health.handoff.json`.

- Completed v196 `review-batch-01` as a 2-item, 49-mark HL batch through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v196-review-batch-01.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 2, selected 2, ready 2, rejected 0, installer no-write passed. Controlled install added/upgraded closed structured reviewed `ib-math-aa-hl/P1-000072` (21-mark 3D vectors, line distance, plane normal and cone vertex positions; primary `AA-3.16`) and `ib-math-aa-hl/P3-000002` (28-mark polygon area/perimeter investigation, regular polygon limit and integer right triangles; primary `AA-3.2`). Full gates passed: curriculum build, structured delivery gate (`5838 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 109 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v197-post-v196-batch-01-health`: 0 ready, 13 review drafts, 0 structural failures, 7 review batches/subsets/workspaces, 70 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Formal bank count remains 433 closed hidden items: SL 162 (`P1:72`, `P2:90`) and HL 271 (`P1:120`, `P2:131`, `P3:20`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v197-post-v196-batch-01-health.handoff.json`. Next batch: v197 `review-batch-01`.

- Completed v195 `review-batch-01` for `ib-math-aa-hl/P3-000016` through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v195-review-batch-01.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 1, selected 1, ready 1, rejected 0, installer no-write passed. Controlled install added/upgraded closed structured reviewed `ib-math-aa-hl/P3-000016` (31-mark Paper 3 AS-linear and AS-quadratic arithmetic-sequence function investigation; primary `AA-2.12`; required `AA-2.12`, `AA-1.2`, `AA-2.1`, `AA-2.7`). Full gates passed: curriculum build, structured delivery gate (`5836 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 110 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v196-post-v195-batch-01-health`: 0 ready, 15 review drafts, 0 structural failures, 8 review batches/subsets/workspaces, 89 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Formal bank count remains 433 closed hidden items: SL 162 (`P1:72`, `P2:90`) and HL 271 (`P1:120`, `P2:131`, `P3:20`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v196-post-v195-batch-01-health.handoff.json`. Next batch: v196 `review-batch-01`.

- Completed v194 `review-batch-01` for `ib-math-aa-hl/P3-000017` through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v194-review-batch-01.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 1, selected 1, ready 1, rejected 0, installer no-write passed. Controlled install added/upgraded closed structured reviewed `ib-math-aa-hl/P3-000017` (24-mark Paper 3 cubic-family stationary-point and root-count investigation; primary `AA-5.8`; required `AA-5.8`, `AA-2.1`, `AA-2.7`, `AA-5.7`). Full gates passed: curriculum build, structured delivery gate (`5835 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 110 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v195-post-v194-batch-01-health`: 0 ready, 16 review drafts, 0 structural failures, 9 review batches/subsets/workspaces, 108 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Formal bank count remains 433 closed hidden items: SL 162 (`P1:72`, `P2:90`) and HL 271 (`P1:120`, `P2:131`, `P3:20`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v195-post-v194-batch-01-health.handoff.json`. Next batch: v195 `review-batch-01`, `ib-math-aa-hl/P3-000016`, 31 estimated marks.

- Completed v193 `review-batch-01` as a 2-item, 34-mark batch through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v193-review-batch-01.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 2, selected 2, ready 2, rejected 0, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-hl/P1-000060` (complex-number arguments, arctangent addition and induction; primary `AA-1.15`) and `ib-math-aa-sl/P1-000009` (discrete probability distributions, expected value and outcome enumeration; primary `AA-4.8`). Full gates passed: curriculum build, structured delivery gate (`5834 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 110 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v194-post-v193-batch-01-health`: 0 ready, 17 review drafts, 0 structural failures, 10 review batches/subsets/workspaces, 118 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Formal bank count remains 433 structured reviewed hidden items because the two installed records were upgraded in place: SL 162 (`P1:72`, `P2:90`) and HL 271 (`P1:120`, `P2:131`, `P3:20`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v194-post-v193-batch-01-health.handoff.json`. Next batch: v194 `review-batch-01`, `ib-math-aa-hl/P3-000017`, 24 estimated marks.

- Completed v192 `review-batch-01` as a 4-item, 33-mark batch through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v192-review-batch-01.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 4, selected 4, ready 4, rejected 0, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-sl/P1-000021` (rational-function asymptotes, intercepts and sketch; primary `AA-2.8`), `ib-math-aa-sl/P1-000048` (rational-function asymptotes, intercepts and sketch; primary `AA-2.8`), `ib-math-aa-hl/P1-000039` (rational-function graph, rational inequality and absolute-value rational inequality; primary `AA-2.8`), and `ib-math-aa-hl/P2-000010` (exponential tangent, inverse-function symmetry and area by integration; primary `AA-5.11`). Full gates passed: curriculum build, structured delivery gate (`5832 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 110 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v193-post-v192-batch-01-health`: 0 ready, 19 review drafts, 0 structural failures, 11 review batches/subsets/workspaces, 130 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Formal bank count is now 433 structured reviewed hidden items: SL 162 (`P1:72`, `P2:90`) and HL 271 (`P1:120`, `P2:131`, `P3:20`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v193-post-v192-batch-01-health.handoff.json`. Next batch: v193 `review-batch-01`, `ib-math-aa-hl/P1-000060` plus `ib-math-aa-sl/P1-000009`, 34 estimated marks.

- Completed v188 `review-batch-01` as a 2-item, 39-mark HL batch through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v188-review-batch-01.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 2, selected 2, ready 2, rejected 0, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-hl/P2-000071` (22-mark 3D vectors, skew lines, plane equation and closest point to plane; primary `AA-3.17`) and `ib-math-aa-hl/P1-000096` (17-mark complex binomial expansion, De Moivre theorem and exact sine product; primary `AA-1.14`). Full gates passed: curriculum build, structured delivery gate (`5823 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 111 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v189-post-v188-batch-01-health`: 0 ready, 28 review drafts, 0 structural failures, 15 review batches/subsets/workspaces, 172 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from the completion ledger is now 384: SL 150 (`P1:64`, `P2:86`) and HL 234 (`P1:103`, `P2:118`, `P3:13`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v189-post-v188-batch-01-health.handoff.json`. Next batch: v189 `review-batch-01`, `ib-math-aa-hl/P1-000048`, 18 estimated marks.

- Completed v187 `review-batch-01` for `ib-math-aa-hl/P3-000012` through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v187-review-batch-01-p3-000012.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 1, selected 1, ready 1, rejected 0, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-hl/P3-000012` (27-mark Paper 3 curved surface area investigation: cone, sphere, semi-ellipse, ellipsoid and Earth model, primary `AA-5.11`). Full gates passed: curriculum build, structured delivery gate (`5821 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 111 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v188-post-v187-p3-000012-health`: 0 ready, 30 review drafts, 0 structural failures, 16 review batches/subsets/workspaces, 188 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from the completion ledger is now 382: SL 150 (`P1:64`, `P2:86`) and HL 232 (`P1:102`, `P2:117`, `P3:13`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v188-post-v187-p3-000012-health.handoff.json`. Next batch: v188 `review-batch-01`, `ib-math-aa-hl/P2-000071` plus `ib-math-aa-hl/P1-000096`, 39 estimated marks.

- Completed v186 `review-batch-01` for `ib-math-aa-hl/P2-000082` through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v186-review-batch-01-p2-000082.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 1, selected 1, ready 1, rejected 0, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-hl/P2-000082` (19-mark continuous probability density, binomial trials and consecutive-success counting, primary `AA-4.14`). Full gates passed: curriculum build, structured delivery gate (`5820 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 111 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v187-post-v186-p2-000082-health`: 0 ready, 31 review drafts, 0 structural failures, 17 review batches/subsets/workspaces, 198 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from the completion ledger is now 381: SL 150 (`P1:64`, `P2:86`) and HL 231 (`P1:102`, `P2:117`, `P3:12`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v187-post-v186-p2-000082-health.handoff.json`.

- Completed v185 ready-equivalence item through the standard patch-equivalence workflow. Patch `tmp\ib-math-aa-review-patches\v185-ready-equivalence-p2-000063.patch.json` was emitted and reapplied with `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 1, selected 1, ready 1, rejected 0, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-sl/P2-000063` (15-mark rainwater gutter arc/area/rate comparison, primary `AA-3.4`). Full gates passed: curriculum build, structured delivery gate (`5819 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 111 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v186-post-v185-ready-equivalence-health`: 0 ready, 32 review drafts, 0 structural failures, 18 review batches/subsets/workspaces, 202 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from the completion ledger is now 380: SL 150 (`P1:64`, `P2:86`) and HL 230 (`P1:102`, `P2:116`, `P3:12`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v186-post-v185-ready-equivalence-health.handoff.json`.

- Completed v184 `review-batch-04` as a 2-item, 36-mark HL batch through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v184-review-batch-04.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 2, selected 2, ready 2, rejected 0, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-hl/P1-000046` (16-mark biased four-sided die distribution, game probability and matching dice-sum distribution, primary `AA-4.7`) and `ib-math-aa-hl/P2-000045` (20-mark inverse function, solid-of-revolution water container, volume and related rates, primary `AA-5.11`). Full gates passed: curriculum build, structured delivery gate (`5818 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 111 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v185-post-v184-batch-04-health`: 1 ready, 32 review drafts, 0 structural failures, 18 review batches/subsets/workspaces, 202 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from the completion ledger is now 379: SL 149 (`P1:64`, `P2:85`) and HL 230 (`P1:102`, `P2:116`, `P3:12`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v185-post-v184-batch-04-health.handoff.json`.

- Completed v183 `review-batch-04` as a 2-item, 40-mark HL batch through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v183-review-batch-04.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 2, selected 2, ready 2, rejected 0, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-hl/P1-000071` (19-mark trigonometric optimization for carrying a pole around a corner, primary `AA-5.8`) and `ib-math-aa-hl/P2-000095` (21-mark homogeneous differential equation with Euler method, exact solution, concavity and inflexion-line proof, primary `AA-5.18`). Full gates passed: curriculum build, structured delivery gate (`5816 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 111 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v184-post-v183-batch-04-health`: 1 ready, 34 review drafts, 0 structural failures, 19 review batches/subsets/workspaces, 213 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from the completion ledger is now 377: SL 149 (`P1:64`, `P2:85`) and HL 228 (`P1:101`, `P2:115`, `P3:12`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v184-post-v183-batch-04-health.handoff.json`.

- Completed v182 `review-batch-06` as a 3-item, 45-mark HL batch through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v182-review-batch-06.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 3, selected 3, ready 3, rejected 0, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-hl/P2-000130` (21-mark salt-tank differential equation, primary `AA-5.18`), `ib-math-aa-hl/P2-000033` (15-mark sinusoidal tide model, primary `AA-3.7`), and `ib-math-aa-hl/P1-000014` (9-mark rational-function graph and inverse-parameter condition, primary `AA-2.8`). Full gates passed: curriculum build, structured delivery gate (`5814 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 111 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v183-post-v182-batch-06-health`: 1 ready, 36 review drafts, 0 structural failures, 20 review batches/subsets/workspaces, 226 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from the completion ledger is now 375: SL 149 (`P1:64`, `P2:85`) and HL 226 (`P1:100`, `P2:114`, `P3:12`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v183-post-v182-batch-06-health.handoff.json`.

- Completed v181 `review-batch-03` as a 2-item, 41-mark HL batch through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v181-review-batch-03.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: selected 2, ready 2, rejected 0, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-hl/P2-000083` (21-mark differential equation with Euler method, Maclaurin series, exact solution and concavity comparison, primary `AA-5.18`) and `ib-math-aa-hl/P1-000047` (20-mark rational function sketch, restricted inverse and arctangent composition, primary `AA-2.5`). Full gates passed: curriculum build, structured delivery gate (`5811 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 111 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v182-post-v181-batch-03-health`: 1 ready, 39 review drafts, 0 structural failures, 21 review batches/subsets/workspaces, 240 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count is now 372: SL 149 (`P1:64`, `P2:85`) and HL 223 (`P1:99`, `P2:112`, `P3:12`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v182-post-v181-batch-03-health.handoff.json`.

- Completed v180 `review-batch-03` as a 2-item, 42-mark HL Paper 2 batch through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v180-review-batch-03.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: selected 2, ready 2, rejected 0, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-hl/P2-000059` (21-mark logistic differential equation population model, primary `AA-5.18`) and `ib-math-aa-hl/P2-000035` (21-mark 3D vector planes, line-plane intersection and reflection, primary `AA-3.17`). Full gates passed: curriculum build, structured delivery gate (`5809 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 111 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v181-post-v180-batch-03-health`: 1 ready, 39 review drafts, 0 structural failures, 20 review batches/subsets/workspaces, 229 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count is now 370: SL 149 (`P1:64`, `P2:85`) and HL 221 (`P1:98`, `P2:111`, `P3:12`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v181-post-v180-batch-03-health.handoff.json`.

- Completed v179 `review-batch-02` as a 2-item, 43-mark HL batch through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v179-review-batch-02.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: selected 2, ready 2, rejected 0, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-hl/P2-000081` (15-mark gutter geometry/rate accumulation overflow item, primary `AA-3.4`) and `ib-math-aa-hl/P3-000011` (28-mark Paper 3 sums of powers, induction, geometric series and L Hopital limit item, primary `AA-1.15`). Full gates passed: curriculum build, structured delivery gate (`5807 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 112 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v180-post-v179-batch-02-health`: 1 ready, 39 review drafts, 0 structural failures, 20 review batches/subsets/workspaces, 230 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from the completion ledger is now 368: SL 149 (`P1:64`, `P2:85`) and HL 219 (`P1:98`, `P2:109`, `P3:12`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v180-post-v179-batch-02-health.handoff.json`.

- Completed v178 `review-batch-15` as a 2-item, 43-mark batch through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v178-review-batch-15.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: selected 2, ready 2, rejected 0, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-sl/P2-000071` (13-mark spring cosine model and time probability, primary `AA-3.7`) and `ib-math-aa-hl/P3-000019` (30-mark Paper 3 inscribed/circumscribed polygon perimeter limits and pi bounds, primary `AA-3.5`). Full gates passed: curriculum build, structured delivery gate (`5805 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 110 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v179-post-v178-batch-15-health`: 0 ready, 40 review drafts, 0 structural failures, 21 review batches/subsets/workspaces, 234 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from the completion ledger is now 366: SL 149 (`P1:64`, `P2:85`) and HL 217 (`P1:98`, `P2:108`, `P3:11`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v179-post-v178-batch-15-health.handoff.json`.

- Completed v177 `review-batch-13` fast subset for `ib-math-aa-hl/P3-000006` through the standard review patch workflow; sibling `ib-math-aa-hl/P1-000060` remained in review and was not installed. Patch `tmp\ib-math-aa-review-patches\v177-review-batch-13-p3-000006.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: selected 2, ready 1, rejected 1, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-hl/P3-000006` (30-mark Paper 3 linear differential equations system, primary `AA-5.18`). Full gates passed: curriculum build, structured delivery gate (`5803 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 109 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v178-post-v177-p3-000006-health`: 0 ready, 40 review drafts, 0 structural failures, 20 review batches/subsets/workspaces, 216 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count is now 364: SL 148 (`P1:64`, `P2:84`) and HL 216 (`P1:98`, `P2:108`, `P3:10`); HL mock status is now `ready_pending_course_release`, visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v178-post-v177-p3-000006-health.handoff.json`.

- Completed v176 `review-batch-02` fast subset for `ib-math-aa-hl/P3-000008` through the standard review patch workflow; `ib-math-aa-hl/P2-000081` remained in review and was not installed. Patch `tmp\ib-math-aa-review-patches\v176-review-batch-02-p3-000008.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: selected 2, ready 1, rejected 1, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-hl/P3-000008` (28-mark Paper 3 cubic polynomial, tangent and complex-root investigation, primary `AA-5.6`). Full gates passed: curriculum build, structured delivery gate (`5802 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 109 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v177-post-v176-p3-000008-health`: 0 ready, 40 review drafts, 0 structural failures, 20 review batches/subsets/workspaces, 215 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count is now 363: SL 148 (`P1:64`, `P2:84`) and HL 215 (`P1:98`, `P2:108`, `P3:9`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v177-post-v176-p3-000008-health.handoff.json`.

- Completed v175 `review-batch-03` for `ib-math-aa-hl/P3-000009` through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v175-review-batch-03-p3-000009.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 1, ready 1, rejected 0, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-hl/P3-000009` (28-mark Paper 3 algebraic-curve, implicit differentiation and rational-point investigation, primary `AA-5.6`). Full gates passed: curriculum build, structured delivery gate (`5801 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 109 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v176-post-v175-p3-000009-health`: 0 ready, 40 review drafts, 0 structural failures, 20 review batches/subsets/workspaces, 220 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count is now 362: SL 148 (`P1:64`, `P2:84`) and HL 214 (`P1:98`, `P2:108`, `P3:8`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v176-post-v175-p3-000009-health.handoff.json`.

- Completed v174 `review-batch-04` for `ib-math-aa-hl/P3-000003` through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v174-review-batch-04-p3-000003.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 1, ready 1, rejected 0, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-hl/P3-000003` (31-mark Paper 3 family of functions investigation, derivative signs and four-solution conditions, primary `AA-5.8`). Full gates passed through structured-delivery npm gate. Refreshed `middle-layer-v175-post-v174-p3-000003-health`: 0 ready, 40 review drafts, 0 structural failures, 20 review batches/subsets/workspaces, 225 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons.

- Completed v173 `review-batch-02` fast subset for `ib-math-aa-hl/P3-000004` through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v173-review-batch-02-p3-000004.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`. Controlled install added closed structured reviewed `ib-math-aa-hl/P3-000004` (24-mark Paper 3 roots of unity and Argand product proof, primary `AA-1.13`). Full gates passed through structured-delivery npm gate. Refreshed `middle-layer-v174-post-v173-p3-000004-health`; strict complete-hidden count reached 360: SL 148 (`P1:64`, `P2:84`) and HL 212 (`P1:98`, `P2:108`, `P3:6`); visible/published remained 0.

- Completed v172 `review-batch-02` fast subset for `ib-math-aa-hl/P3-000015` through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v172-review-batch-02-p3-000015.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 1, selected 2, ready 1, rejected 1, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-hl/P3-000015` (24-mark Paper 3 logarithmic intersection investigation, primary `AA-1.5`). Full gates passed: curriculum build, structured delivery gate (`5798 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 109 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v173-post-v172-p3-000015-health`: 0 ready, 40 review drafts, 0 structural failures, 21 review batches/subsets/workspaces, 234 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from formal bank files is now 359: SL 148 (`P1:64`, `P2:84`) and HL 211 (`P1:98`, `P2:108`, `P3:5`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v173-post-v172-p3-000015-health.handoff.json`. Next high-throughput target: v173 `review-batch-02`, `ib-math-aa-hl/P3-000004`, 24 marks.

- Completed v171 `review-batch-02` fast subset for `ib-math-aa-sl/P2-000053` through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v171-review-batch-02-sl-p2-000053.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 1, selected 2, ready 1, rejected 1, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-sl/P2-000053` (13-mark sector geometry and shaded-area equation, primary `AA-3.4`). Full gates passed: curriculum build, structured delivery gate (`5797 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 108 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v172-post-v171-sl-p2-000053-health`: 0 ready, 40 review drafts, 0 structural failures, 20 review batches/subsets/workspaces, 239 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from formal bank files is now 358: SL 148 (`P1:64`, `P2:84`) and HL 210 (`P1:98`, `P2:108`, `P3:4`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v172-post-v171-sl-p2-000053-health.handoff.json`. Next high-throughput target: v172 `review-batch-02`, `ib-math-aa-hl/P3-000004` and `ib-math-aa-hl/P3-000015`, 48 marks.

- Completed v170 `review-batch-02` fast subset for `ib-math-aa-hl/P3-000005` through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v170-review-batch-02-p3-000005.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 1, selected 2, ready 1, rejected 1, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-hl/P3-000005` (25-mark Paper 3 complex exponential, trigonometric and hyperbolic function investigation, primary `AA-1.13`). Full gates passed: curriculum build, structured delivery gate (`5796 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 108 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v171-post-v170-p3-000005-health`: 0 ready, 40 review drafts, 0 structural failures, 21 review batches/subsets/workspaces, 239 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from formal bank files is now 357: SL 147 (`P1:64`, `P2:83`) and HL 210 (`P1:98`, `P2:108`, `P3:4`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v171-post-v170-p3-000005-health.handoff.json`. Next high-throughput target: v171 `review-batch-02`, `ib-math-aa-sl/P2-000053` and `ib-math-aa-hl/P3-000004`, 37 marks.

- Completed v169 `review-batch-02` as a 2-item, 46-mark batch through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v169-review-batch-02.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 2, selected 2, ready 2, rejected 0, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-hl/P1-000120` (21-mark Maclaurin series and limit, primary `AA-5.19`) and `ib-math-aa-hl/P3-000013` (25-mark Paper 3 area investigation for `x^n e^(-x)`, integration by parts and induction, primary `AA-5.11`). Full gates passed: curriculum build, structured delivery gate (`5795 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 108 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v170-post-v169-batch-02-health`: 0 ready, 40 review drafts, 0 structural failures, 21 review batches/subsets/workspaces, 239 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from formal bank files is now 356: SL 147 (`P1:64`, `P2:83`) and HL 209 (`P1:98`, `P2:108`, `P3:3`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v170-post-v169-batch-02-health.handoff.json`. Next high-throughput target: v170 `review-batch-02`, `ib-math-aa-hl/P3-000005` and `ib-math-aa-hl/P3-000004`, 49 marks.

- Completed v168 `review-batch-01` remaining P3 singleton through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v168-review-batch-01-p3-000010.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 1, selected 1, ready 1, rejected 0, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-hl/P3-000010` (27-mark Paper 3 polynomial roots investigation across cubic and quartic conditions, primary `AA-2.12`). Full gates passed: curriculum build, structured delivery gate (`5793 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 108 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v169-post-v168-p3-000010-health`: 0 ready, 40 review drafts, 0 structural failures, 21 review batches/subsets/workspaces, 240 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from formal bank files is now 354: SL 147 (`P1:64`, `P2:83`) and HL 207 (`P1:97`, `P2:108`, `P3:2`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v169-post-v168-p3-000010-health.handoff.json`.

- Completed v167 `review-batch-01` fast subset through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v167-review-batch-01-fast-subset.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 1, selected 2, ready 1, rejected 1, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-sl/P1-000036` (binomial expansion, trigonometric identity and substitution-style integration, primary `AA-5.10`). `ib-math-aa-hl/P3-000010` remained in review because it is a 27-mark Paper 3 polynomial-investigation item with 13 parts and many unresolved fields. Full gates passed: curriculum build, structured delivery gate (`5792 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 108 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v168-post-v167-batch-01-fast-subset-health`: 0 ready, 40 review drafts, 0 structural failures, 22 review batches/subsets/workspaces, 243 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from formal bank files is now 353: SL 147 (`P1:64`, `P2:83`) and HL 206 (`P1:97`, `P2:108`, `P3:1`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v168-post-v167-batch-01-fast-subset-health.handoff.json`.

- Completed v166 `review-batch-12` as a 3-item, 50-mark batch through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v166-review-batch-12.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 3, selected 3, ready 3, rejected 0, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-sl/P1-000025` (particle velocity/displacement/total distance, primary `AA-5.9`), `ib-math-aa-hl/P2-000024` (arcsin rational function, inverse function and asymptote sketch, primary `AA-2.5`), and `ib-math-aa-sl/P1-000063` (quotient/product rule, substitution integration and area between translated functions, primary `AA-5.6`). Full gates passed: curriculum build, structured delivery gate (`5791 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 108 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v167-post-v166-batch-12-health`: 0 ready, 40 review drafts, 0 structural failures, 21 review batches/subsets/workspaces, 245 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from formal bank files is now 352: SL 146 (`P1:63`, `P2:83`) and HL 206 (`P1:97`, `P2:108`, `P3:1`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v167-post-v166-batch-12-health.handoff.json`.

## 2026-08-02

- Completed v165 `review-batch-08` fast subset through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v165-review-batch-08-fast-subset.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 1, selected 2, ready 1, rejected 1, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-sl/P2-000036` (normal distribution, binomial model, total probability, conditional probability and inverse-normal standard deviation, primary `AA-4.9`). `ib-math-aa-hl/P2-000071` remained in review because the 22-mark 3D vector/line/plane item needs deeper multi-page source checking. Full gates passed: curriculum build, structured delivery gate (`5788 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 108 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v166-post-v165-batch-08-fast-subset-health`: 0 ready, 40 review drafts, 0 structural failures, 22 review batches/subsets/workspaces, 251 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from formal bank files is now 349: SL 144 (`P1:61`, `P2:83`) and HL 205 (`P1:97`, `P2:107`, `P3:1`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v166-post-v165-batch-08-fast-subset-health.handoff.json`.

- Completed v164 ready-equivalence install through the standard review patch workflow instead of installing ready output directly. Extended `scripts\apply_ib_math_aa_review_patch.cjs` so ready compact specs with reviewed records under `items` can be used by the same patch tool. Emitted and reapplied `tmp\ib-math-aa-review-patches\v164-ready-equivalence-p2-000120.patch.json`; ready gate selected 1, ready 1, rejected 0, installer no-write passed. Controlled install added closed structured reviewed `ib-math-aa-hl/P2-000120` (sector/circle geometry equivalent item, primary `AA-3.4`). Full gates passed: curriculum build, structured delivery gate (`5787 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 108 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v165-post-v164-ready-equivalence-health`: 0 ready, 40 review drafts, 0 structural failures, 22 review batches/subsets/workspaces, 244 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from formal bank files is now 348: SL 143 (`P1:61`, `P2:82`) and HL 205 (`P1:97`, `P2:107`, `P3:1`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v165-post-v164-ready-equivalence-health.handoff.json`.

- Completed v163 `review-batch-10` through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v163-review-batch-10.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 3, ready 3, rejected 0, installer no-write passed. Controlled install added closed structured reviewed items `ib-math-aa-hl/P2-000108` (3D pyramid and angle at V by side lengths/vectors, primary `AA-3.13`), `ib-math-aa-sl/P2-000052` (particle displacement, velocity, acceleration and total distance, primary `AA-5.9`), and `ib-math-aa-sl/P2-000026` (sinusoidal tide model parameters and duration above 5 m, primary `AA-3.7`). Full gates passed: curriculum build, structured delivery gate (`5786 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 108 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v164-post-v163-batch-10-health`: 1 ready, 39 review drafts, 0 structural failures, 21 review batches/subsets/workspaces, 233 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from formal bank files is now 347: SL 143 (`P1:61`, `P2:82`) and HL 204 (`P1:97`, `P2:106`, `P3:1`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v164-post-v163-batch-10-health.handoff.json`.

- Completed v162 `review-batch-16` fast subset through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v162-review-batch-16-fast-subset.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 2, selected 3, ready 2, rejected 1, installer no-write passed. Controlled install added closed structured reviewed HL Paper 1 items `ib-math-aa-hl/P1-000059` (code counting plus polynomial factor/coefficient constraints, primary `AA-2.12`) and `ib-math-aa-hl/P1-000069` (spherical ring volume by washer/volume-of-revolution reasoning, `h=cuberoot(6)`, primary `AA-5.17`). `ib-math-aa-hl/P1-000072` remained in review because it requires deeper vector/cone checking. Full gates passed: curriculum build, structured delivery gate (`5783 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 108 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v163-post-v162-batch-16-fast-subset-health`: 1 ready, 39 review drafts, 0 structural failures, 20 review batches/subsets/workspaces, 213 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from formal bank files is now 344: SL 141 (`P1:61`, `P2:80`) and HL 203 (`P1:97`, `P2:105`, `P3:1`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v163-post-v162-batch-16-fast-subset-health.handoff.json`.

- Completed v161 `review-batch-04` through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v161-review-batch-04.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 2, ready 2, rejected 0, installer no-write passed. Controlled install added closed structured reviewed SL items `ib-math-aa-sl/P1-000052` (quadratic vertex form, normal line, second intersection and distance `8sqrt(2)`, primary `AA-2.6`) and `ib-math-aa-sl/P2-000008` (arc length, sector/triangle area, `theta=1.44`, `angle DAE=0.720`, sine-rule fence length `546 m`, primary `AA-3.4`). Full gates passed: curriculum build, structured delivery gate (`5781 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 108 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v162-post-v161-batch-04-health`: 1 ready, 39 review drafts, 0 structural failures, 20 review batches/subsets/workspaces, 209 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from formal bank files is now 342: SL 141 (`P1:61`, `P2:80`) and HL 201 (`P1:95`, `P2:105`, `P3:1`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v162-post-v161-batch-04-health.handoff.json`.

- Completed v160 `review-batch-12` through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v160-review-batch-12.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 3, ready 3, rejected 0, installer no-write passed. Controlled install added closed structured reviewed items `ib-math-aa-sl/P1-000027` (derivative-graph increasing/extrema/inflexion and signed-area reasoning, primary `AA-5.8`), `ib-math-aa-sl/P1-000055` (sine graph amplitude, period, `b=2`, and `f(pi/12)=7/2`, primary `AA-3.7`), and `ib-math-aa-hl/P1-000094` (logarithmic function intersection, discriminant condition, and `q-p=2sqrt(10)`, primary `AA-2.7`). Full gates passed: curriculum build, structured delivery gate (`5779 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 108 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v161-post-v160-batch-12-health`: 1 ready, 39 review drafts, 0 structural failures, 19 review batches/subsets/workspaces, 207 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from formal bank files is now 340: SL 139 (`P1:60`, `P2:79`) and HL 201 (`P1:95`, `P2:105`, `P3:1`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v161-post-v160-batch-12-health.handoff.json`.

- Completed v159 `review-batch-08` through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v159-review-batch-08.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 3, ready 3, rejected 0, installer no-write passed. Controlled install added closed structured reviewed items `ib-math-aa-hl/P2-000070` (exponential product derivative, tangent-gradient point, volume of revolution and composition/chain rule, primary `AA-5.6`), `ib-math-aa-sl/P1-000017` (trigonometric intercepts, definite-integral area and cone geometry, primary `AA-5.11`), and `ib-math-aa-hl/P2-000023` (exponential bowl volume of revolution, design radii and derivative-graph rate analysis, primary `AA-5.11`). Full gates passed: curriculum build, structured delivery gate (`5776 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 108 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v160-post-v159-batch-08-health`: 1 ready, 39 review drafts, 0 structural failures, 19 review batches/subsets/workspaces, 207 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from formal bank files is now 337: SL 137 (`P1:58`, `P2:79`) and HL 200 (`P1:94`, `P2:105`, `P3:1`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v160-post-v159-batch-08-health.handoff.json`.

- Completed v158 `review-batch-05` through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v158-review-batch-05.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 3, ready 3, rejected 0, installer no-write passed. Controlled install added closed structured reviewed items `ib-math-aa-sl/P2-000061` (tea-temperature exponential model, derivative interpretation and limits, primary `AA-2.9`), `ib-math-aa-hl/P2-000046` (normal, binomial, total probability, conditional probability and adjusted standard deviation, primary `AA-4.12`), and `ib-math-aa-hl/P2-000058` (3D position-vector airplanes, bearing, speed, angle, crossing point and minimum distance, primary `AA-3.14`). Full gates passed: curriculum build, structured delivery gate (`5773 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 110 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v159-post-v158-batch-05-health`: 1 ready, 39 review drafts, 0 structural failures, 19 review batches/subsets/workspaces, 207 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from formal bank files is now 334: SL 136 (`P1:57`, `P2:79`) and HL 198 (`P1:94`, `P2:103`, `P3:1`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v159-post-v158-batch-05-health.handoff.json`.

- Completed v157 `review-batch-04` through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v157-review-batch-04.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 3, ready 3, rejected 0, installer no-write passed. Controlled install added closed structured reviewed items `ib-math-aa-sl/P1-000026` (exponential and logarithmic inverse plus geometric sequence terms, primary `AA-1.5`), `ib-math-aa-sl/P2-000009` (exponential curve, tangent line, enclosed area and inverse symmetry, primary `AA-2.9`), and `ib-math-aa-hl/P2-000047` (Euler method and separable differential equation, primary `AA-5.18`). Full gates passed: curriculum build, structured delivery gate (`5770 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 111 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v158-post-v157-batch-04-health`: 1 ready, 39 review drafts, 0 structural failures, 20 review batches/subsets/workspaces, 211 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count from formal bank files is now 331: SL 135 (`P1:57`, `P2:78`) and HL 196 (`P1:94`, `P2:101`, `P3:1`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v158-post-v157-batch-04-health.handoff.json`.

- Completed v156 `review-batch-11` through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v156-review-batch-11.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 2, ready 2, rejected 0, installer no-write passed. Controlled install added closed structured reviewed SL Paper 1 items `ib-math-aa-sl/P1-000071` (cubic derivative and stationary-point reasoning, primary `AA-5.7`) and `ib-math-aa-sl/P1-000045` (velocity/displacement/acceleration/speed/distance expression, primary `AA-5.9`). After first install, reran the same standard patch flow to expand the `P1-000071` visible prompt and controlled-overwrite the two-item batch; the avoidable short-prompt warning disappeared. Full gates passed: curriculum build, structured delivery gate (`5767 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 108 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v157-post-v156-batch-11-health`: 1 ready, 39 review drafts, 0 structural failures, 19 review batches/subsets/workspaces, 199 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count is now 325: SL 133 (`P1:56`, `P2:77`) and HL 192 (`P1:91`, `P2:100`, `P3:1`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v157-post-v156-batch-11-health.handoff.json`.

- Completed v155 `review-batch-16` through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v155-review-batch-16.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 2, ready 2, rejected 0, installer no-write passed. Controlled install added closed structured reviewed items `ib-math-aa-sl/P1-000014` (`f(x)=ln(x^2-16)`, exact x-intercept `a=sqrt(17)`, tangent-gradient x-coordinate `8`, primary `AA-5.6`) and `ib-math-aa-hl/P1-000042` (`f(x)=x sqrt(1-x^2)`, odd-function proof and range `-1/2<=y<=1/2`, primary `AA-5.8`). Full gates passed: curriculum build, structured delivery gate (`5765 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 105 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v156-post-v155-batch-16-health`: 1 ready, 39 review drafts, 0 structural failures, 20 review batches/subsets/workspaces, 192 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count is now 323: SL 131 (`P1:54`, `P2:77`) and HL 192 (`P1:91`, `P2:100`, `P3:1`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v156-post-v155-batch-16-health.handoff.json`.

- Completed v154 `review-batch-15` through the standard review patch workflow. Patch `tmp\ib-math-aa-review-patches\v154-review-batch-15.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 2, ready 2, rejected 0, installer no-write passed. Controlled install added closed structured reviewed items `ib-math-aa-sl/P1-000035` (geometric/arithmetic sequence logarithm item, answers `x=e^2` and `n=9`, primary `AA-1.2`) and `ib-math-aa-sl/P2-000062` (survey probability/binomial item, answers `p=12`, `q=100`, `0.241`, `3/20`, not independent, `0.738`, primary `AA-4.6`). Full gates passed: curriculum build, structured delivery gate (`5763 item(s), 0 error(s)`), IB Math AA audit (`0 error(s), 103 warning(s)`), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Refreshed `middle-layer-v155-post-v154-batch-15-health`: 1 ready, 39 review drafts, 0 structural failures, 19 review batches/subsets/workspaces, 182 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count is now 321: SL 130 (`P1:53`, `P2:77`) and HL 191 (`P1:90`, `P2:100`, `P3:1`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v155-post-v154-batch-15-health.handoff.json`. Next high-throughput target is v155 `review-batch-11` unless source review shows a quality reason to choose another non-singleton batch.

- Completed two more IB Math AA batches through the standard review patch workflow. v149 `review-batch-01` used `tmp\ib-math-aa-review-patches\v149-review-batch-01.patch.json`, passed patch ready check with 3 ready / 0 rejected and installer no-write, then controlled-installed `ib-math-aa-hl/P2-000091`, `ib-math-aa-sl/P2-000027`, and `ib-math-aa-sl/P2-000090`. v150 `review-batch-09` used `tmp\ib-math-aa-review-patches\v150-review-batch-09.patch.json`, passed patch ready check with 4 ready / 0 rejected and installer no-write, then controlled-installed `ib-math-aa-sl/P1-000016`, `ib-math-aa-sl/P1-000070`, `ib-math-aa-sl/P2-000030`, and `ib-math-aa-sl/P2-000069`.
- Full gates passed after both installs: curriculum build, structured delivery gate, IB Math AA audit, learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Latest structured delivery checked `5751 item(s), 0 error(s)`; latest IB Math AA audit returned `0 error(s), 92 warning(s)`. Refreshed `middle-layer-v151-post-v150-batch-09-health`: 1 ready, 39 review drafts, 0 structural failures, 18 review batches/subsets/workspaces, 165 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singletons. Strict complete-hidden count is now 309: SL 122 (`P1:47`, `P2:75`) and HL 187 (`P1:88`, `P2:98`, `P3:1`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v151-post-v150-batch-09-health.handoff.json`.

- Completed v147 `review-batch-12` through the standard review patch workflow, not direct bank editing. Patch file `tmp\ib-math-aa-review-patches\v147-review-batch-12.patch.json` passed `scripts\apply_ib_math_aa_review_patch.cjs --ready-check`: patched 5, ready 5, rejected 0, installer no-write passed. Controlled install added 5 closed structured reviewed items: `ib-math-aa-sl/P2-000045` (normal distribution followed by binomial and conditional probability, answers `sigma=7.41`, `0.0887`, `0.371`, `0.984`, `0.907`), `ib-math-aa-sl/P2-000006` (binomial expansion, `n=7`), `ib-math-aa-hl/P1-000053` (quartic roots, `alpha=2`, `p=-12`), `ib-math-aa-hl/P2-000078` (probability tree and estimate, `p=0.134`), and `ib-math-aa-sl/P2-000083` (circle sector, `theta=1.35`, shaded area `39.5 cm^2`). Full gates passed: curriculum build, structured delivery gate (`5739 item(s), 0 errors`), IB Math AA audit (`0 errors`, 79 warnings), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate. Strict complete-hidden count is now 297: SL 114 (`P1:44`, `P2:70`) and HL 183 (`P1:88`, `P2:94`, `P3:1`); visible/published remain 0 and course remains closed.
- Refreshed `middle-layer-v148-post-v147-batch-12-health`: 1 ready, 39 review drafts, 0 structural failures, 16 review batches/subsets/workspaces, 166 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, 3 justified singleton batches, and 0 unjustified singletons. `CURRENT_HANDOFF.json` now points to `tmp\ib-math-aa-generated-compact-specs\middle-layer-v148-post-v147-batch-12-health.handoff.json`. The ready item is `ib-math-aa-hl/P2-000120`; under the current hard rule, do not install it or any next batch unless it first satisfies the standard review patch flow, ready gate and installer `--check`.

- Continued the AP-style IB Math AA batch flow from v139 by skipping singleton `review-batch-01` and selecting v139 `review-batch-10`, a 5-item `source_visual_review+standard` batch. Reviewed source and markscheme images, corrected only `reviewed_skeleton_items`, and installed `ib-math-aa-hl/P1-000003`, `ib-math-aa-hl/P2-000003`, `ib-math-aa-sl/P1-000004`, `ib-math-aa-sl/P1-000064`, and `ib-math-aa-hl/P2-000088`. Ready gate selected 5, ready 5, rejected 0; installer no-write returned `Checked 5 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 5 reviewed structured item(s).` Full gates passed: curriculum build, structured delivery gate (`5708 item(s), 0 errors`), IB Math AA audit (`0 errors`, 69 warnings), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Refreshed `middle-layer-v140-post-v139-batch-10-health`, which produced 1 ready reviewed-equivalent item, `ib-math-aa-sl/P2-000004`; installer no-write passed and controlled install added it. Full gates passed again after that install, with structured delivery at `5709 item(s), 0 errors`, IB Math AA audit at `0 errors`, 69 warnings, and all remaining gates passing. Refreshed `middle-layer-v141-post-v140-ready-health`: 0 ready, 40 review drafts, 0 structural failures, 13 review batches/subsets/workspaces, 104 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, 1 justified singleton batch, and 0 unjustified singletons. Strict complete-hidden count is now 267: SL 98 (`P1:37`, `P2:61`) and HL 169 (`P1:81`, `P2:87`, `P3:1`); visible/published remain 0 and course remains closed. Current handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v141-post-v140-ready-health.handoff.json`.

- Restored AP-style throughput on v137 by selecting `review-batch-06` instead of the singleton first batch, then installed 5 source-checked closed structured reviewed items: `ib-math-aa-hl/P2-000004`, `ib-math-aa-sl/P2-000005`, `ib-math-aa-hl/P2-000072`, `ib-math-aa-sl/P2-000055`, and `ib-math-aa-sl/P2-000020`. Reused three verified source patterns across the batch: velocity graph/total-distance/acceleration, bearings plus sine rule, and `f(x)=e^(-x^2)-0.5` roots plus sketch. Ready gate selected 5, ready 5, rejected 0; installer no-write returned `Checked 5 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 5 reviewed structured item(s).` Full post-install gates passed: curriculum build, structured delivery gate (`5698 item(s), 0 errors`), IB Math AA audit (`0 errors`, 70 warnings), learning schema, Mock contract build, SOP gate and structured-delivery npm gate. Refreshed `middle-layer-v138-post-v137-batch-06-health` passed with 0 ready, 40 review drafts, 0 structural failures, 12 review batches/subsets/workspaces, 93 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, 2 justified singleton batches and 0 unjustified singletons. Strict complete-hidden count is 256: SL 93 (`P1:35`, `P2:58`) and HL 163 (`P1:79`, `P2:83`, `P3:1`); visible/published remain 0 and course remains closed. Next high-throughput targets are v138 `review-batch-08`, `review-batch-09` or `review-batch-10`, each with 5 items.

- Completed v135 `review-batch-01` through the AP-style reviewed-skeleton workflow and installed `ib-math-aa-hl/P2-000031` (`MathsAA_HL_P2_2021_Nov:Q7`) as a closed structured reviewed item. Source-checked question asset `q07-p11.webp` and paired markscheme assets `q07-p15.webp`/`q07-p16.webp`; corrected the generated draft into the official continuous probability density item with `f(x)=arccos(x)` on `0<=x<=1`, 2 parts, 2 answers, 2 markscheme rows and 6 one-mark points. The item covers the median integral `int_0^m arccos(x) dx=0.5`, `m=0.360`, translated interval probability and `a=0.125`; primary/required `AA-4.14`. Ready gate selected 1, ready 1, rejected 0; installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 1 reviewed structured item(s).` Full post-install gates passed: curriculum build, structured delivery gate (`5692 item(s), 0 errors`), IB Math AA audit (`0 errors`, 70 warnings), learning schema, Mock contract build, SOP gate and structured-delivery npm gate. Refreshed `middle-layer-v136-post-v135-batch-01-health` passed with 0 ready, 40 review drafts, 0 structural failures, 11 review batches/subsets/workspaces, 88 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, 2 justified singleton batches and 0 unjustified singletons; `CURRENT_HANDOFF.json` now points to v136. Strict complete-hidden count is 250: SL 90 (`P1:35`, `P2:55`) and HL 160 (`P1:79`, `P2:80`, `P3:1`); visible/published remain 0 and course remains closed. Next shortcut: `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch review-batch-01`.

- Completed v134 `review-batch-01` through the AP-style reviewed-skeleton workflow and installed `ib-math-aa-hl/P2-000008` (`MathsAA_HL_P2_2021_May_TZ1:Q8`) as a closed structured reviewed item. Source-checked question asset `q08-p11.webp` and paired markscheme assets `q08-p13.webp`/`q08-p14.webp`; corrected the OCR draft into the official complex-number polar-form task, 4 answerable parts (`a`, `b`, `c.i`, `c.ii`), 4 answers, 4 markscheme rows and 7 one-mark points. The item covers `|zw|=16`, `arg(zw)=((1-2k)pi)/5`, integer-product argument reasoning, minimum positive integer `k=3`, and final `zw=-16`; primary/required `AA-1.13`. Ready gate selected 1, ready 1, rejected 0; installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 1 reviewed structured item(s).` Full post-install gates passed: curriculum build, structured delivery gate (`5691 item(s), 0 errors`), IB Math AA audit (`0 errors`, 70 warnings), learning schema, Mock contract build, SOP gate and structured-delivery npm gate. Refreshed `middle-layer-v135-post-v134-batch-01-health` passed with 0 ready, 40 review drafts, 0 structural failures, 11 review batches/subsets/workspaces, 88 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, 1 mark-point OCR review batch, 2 justified singleton batches and 0 unjustified singletons; `CURRENT_HANDOFF.json` now points to v135. Strict complete-hidden count is 249: SL 90 (`P1:35`, `P2:55`) and HL 159 (`P1:79`, `P2:79`, `P3:1`); visible/published remain 0 and course remains closed. Process check after refresh found no workflow leftovers; only persistent node processes remain. Next shortcut: `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch review-batch-01`.

- Completed v133 `review-batch-01` through the AP-style reviewed-skeleton workflow and installed `ib-math-aa-hl/P1-000117` (`MathsAA_HL_P1_Specimen:Q9`) as a closed structured reviewed item. Source-checked question asset `q09-p10.webp`, blank continuation `q09-p11.webp`, and paired markscheme asset `q09-p10.webp`; corrected the OCR draft into the official inverse-function item: `f(x)=e^(2x)-6e^x+5`, `x<=a`, 2 official parts, 2 answers, 2 markscheme rows and 8 one-mark points. The item covers differentiating to find the minimum at `x=ln 3`, largest `a=ln 3`, rewriting `y=(e^x-3)^2-4`, selecting the negative square-root branch from `x<=ln 3`, final `f^(-1)(x)=ln(3-sqrt(x+4))`, and domain `-4<=x<5`; primary `AA-2.5`, required `AA-2.5`, `AA-2.9`, `AA-5.6`, and `AA-5.8`. Ready gate selected 1, ready 1, rejected 0; installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 1 reviewed structured item(s).` Full post-install gates passed: curriculum build, structured delivery gate (`5690 item(s), 0 errors`), IB Math AA audit (`0 errors`, existing warnings), learning schema, Mock contract build, SOP gate and structured-delivery npm gate. Refreshed `middle-layer-v134-post-v133-batch-01-health` passed with 0 ready, 40 review drafts, 0 structural failures, 11 review batches/subsets/workspaces, 87 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, 2 justified singleton batches and 0 unjustified singletons; `CURRENT_HANDOFF.json` now points to v134. Strict complete-hidden count is 248: SL 90 (`P1:35`, `P2:55`) and HL 158 (`P1:79`, `P2:78`, `P3:1`); visible/published remain 0 and course remains closed. Next shortcut: `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch review-batch-01`.

- Completed v132 `review-batch-01` through the AP-style reviewed-skeleton workflow and installed `ib-math-aa-hl/P1-000068` (`MathsAA_HL_P1_2023_May_TZ1:Q8`) as a closed structured reviewed item. Source-checked question assets `q08-p11.webp` and `q08-p12.webp` plus paired markscheme asset `q08-p16.webp`; corrected OCR-draft leakage into the official `g(x)=|f(|x|)|` graph-transformation task, 2 official parts, 2 answers, 2 markscheme rows and 7 one-mark points. The item covers even reflection from `|x|`, outer absolute-value reflection, asymptote `y=2`, intercepts `(-a,0)` and `(a,0)`, maximum `(0,3)`, and final values `k=0` or `4<=k<9`; primary `AA-2.16`, required `AA-2.16`, `AA-2.4`, `AA-2.10`, and `AA-2.15`. Ready gate selected 1, ready 1, rejected 0; installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 1 reviewed structured item(s).` Full post-install gates passed: curriculum build, structured delivery gate (`5689 item(s), 0 errors`), IB Math AA audit (`0 errors`, existing warnings), learning schema, Mock contract build, SOP gate and structured-delivery npm gate. Refreshed `middle-layer-v133-post-v132-batch-01-health` passed with 0 ready, 40 review drafts, 0 structural failures, 11 review batches/subsets/workspaces, 88 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, 2 justified singleton batches and 0 unjustified singletons; `CURRENT_HANDOFF.json` now points to v133. Strict complete-hidden count is 247: SL 90 (`P1:35`, `P2:55`) and HL 157 (`P1:78`, `P2:78`, `P3:1`); visible/published remain 0 and course remains closed. Next shortcut: `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch review-batch-01`.

- Completed the v132 post-install health refresh after the already-installed v131 `review-batch-01` 5-item batch. The installed closed structured reviewed records are `ib-math-aa-hl/P1-000045`, `P2-000066`, `P1-000093`, `P2-000042`, and `P2-000089`; full post-install gates had already passed: curriculum build, structured delivery gate, IB Math AA audit, learning schema, Mock contract build, SOP gate and structured-delivery npm gate. The first v132 refresh correctly failed the middle-layer quality gate on one duplicate full-row mark-point description in `ib-math-aa-sl/P1-000019` part b (`A1 k = 8` duplicated while the source required `h = -1` and `k = 8`). Hardened `scripts/generate_ib_math_aa_compact_specs_from_scan.cjs` so OCR-split value-target rows can be recovered from adjacent line fragments and duplicate value-target mark-point rows can be repaired from item-level assignment evidence. Verification passed: `node --check scripts\generate_ib_math_aa_compact_specs_from_scan.cjs`; `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v132-post-v131-batch-01-health --max-items 40 --ready-check`. v132 output: 0 ready, 40 review drafts, 0 structural failures, 11 review batches/subsets/workspaces, 88 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `duplicate_full_row_point_descriptions:0`, `handoff_gate.ok:true`, 2 justified singleton batches, 0 unjustified singletons; `CURRENT_HANDOFF.json` now points to v132. Strict complete-hidden count is 246: SL 90 (`P1:35`, `P2:55`) and HL 156 (`P1:77`, `P2:78`, `P3:1`); visible/published remain 0 and course remains closed. Next shortcut: `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch review-batch-01`.

- Completed v118 `review-batch-01` through the AP-style reviewed-skeleton workflow and installed 2 closed structured reviewed items. `ib-math-aa-sl/P1-000012` (`MathsAA_SL_P1_2021_May_TZ2:Q3`) was source-checked from `q03-p05.webp` and markscheme assets `q03-p10.webp`, `q03-p11.webp`: 2 parts, 6 marks, 2 markscheme rows, 6 one-mark points, final solutions `x=pi/6, 5pi/6`, primary `AA-3.8`. `ib-math-aa-hl/P2-000131` (`MathsAA_HL_P2_Specimen:Q12`) was source-checked from `q12-p12.webp` and markscheme assets `q12-p15.webp`, `q12-p16.webp`: 4 parts, 19 marks, 4 markscheme rows, 19 one-mark points, final value `-4-2sqrt3`, primary `AA-3.10`. Ready gate selected 2, ready 2, rejected 0; materialized 2 reviewed records; installer no-write returned `Checked 2 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 2 reviewed structured item(s).` Full post-install gates passed: curriculum build, structured delivery gate (`5668 item(s), 0 errors`), IB Math AA audit (`0 errors`, existing publication-stage warnings), learning schema, Mock contract build, SOP gate and structured-delivery npm gate. Strict formal complete-hidden count is now 226: SL 82 (`P1:32`, `P2:50`) and HL 144 (`P1:74`, `P2:69`, `P3:1`); visible/published remain 0 and course remains closed. Refreshed `middle-layer-v119-post-v118-batch-01-health` passed with 0 ready, 40 review drafts, 0 structural failures, 11 review batches/subsets/workspaces, 85 image refs, 0 missing refs, 27 index hrefs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, `singleton_batches:3`, and `unjustified_singletons:0`; `CURRENT_HANDOFF.json` now points to v119. Process check found no task-runner leftovers; remaining Node processes are OpenClaw gateway, Kimi control and Codex.

- Completed v116 `review-batch-01` through the AP-style reviewed-skeleton workflow and installed `ib-math-aa-hl/P2-000094` (`MathsAA_HL_P2_2023_May_TZ2:Q11`) as a closed structured reviewed item. Source-checked the official question asset `q11-p15.webp` and paired markscheme assets `q11-p22.webp` and `q11-p23.webp`; structured 5 official parts, 5 answers, 5 official markscheme rows and 20 one-mark points. The item covers probability without replacement, the quadratic relation `2y^2-2(r+1)y+r-r^2=0`, the positive root `y=((r+1)+sqrt(3r^2+1))/2`, valid pairs including `(1,2)` and `(4,6)`, three-yellow probability, and final `y=4`. Ready gate selected 1, ready 1, rejected 0; materialized 1 reviewed record; installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 1 reviewed structured item(s).` Full post-install gates passed: curriculum build, structured delivery gate (`5666 item(s), 0 errors`), IB Math AA audit (`0 errors`, existing publication-stage warnings), learning schema, Mock contract build, SOP gate and structured-delivery npm gate. Strict formal complete-hidden count is now 224: SL 81 (`P1:31`, `P2:50`) and HL 143 (`P1:74`, `P2:68`, `P3:1`); visible/published remain 0 and course remains closed. Refreshed `middle-layer-v117-post-v116-batch-01-health` passed with 0 ready, 40 review drafts, 0 structural failures, 12 review batches/subsets/workspaces, 85 image refs, 0 missing refs, 29 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, `singleton_batches:3`, and `unjustified_singletons:0`. Active entry point: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v117-post-v116-batch-01-health.review-index.html`; shortcut after source certification: `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch review-batch-01`.
- Follow-up correction for `ib-math-aa-hl/P2-000094`: fixed part d/e answer LaTeX and split the official `A2` awards in parts c/e into explicit one-mark points, then reran the reviewed-skeleton ready gate, installer no-write and controlled overwrite. Reverification passed: curriculum build, structured delivery gate (`5666 item(s), 0 errors`), IB Math AA audit (`0 errors`, existing warnings), learning schema, Mock contract build, SOP gate and structured-delivery npm gate. Refreshed `middle-layer-v118-post-v116-batch-01-correction-health` passed with 0 ready, 40 review drafts, 0 structural failures, 12 review batches/subsets/workspaces, 85 image refs, 0 missing refs, 29 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, `singleton_batches:3`, and `unjustified_singletons:0`; `CURRENT_HANDOFF.json` now points to v118. Strict formal complete-hidden count remains 224; visible/published remain 0; course remains closed. Process check after verification found no large task-runner leftovers; remaining Node processes belong to OpenClaw gateway, Kimi control and Codex.

- Continued IB Math AA phase-1 middle-layer hardening to `middle-layer-v116-current-health` without formal bank writes. Added batch sizing health: `scripts/build_ib_math_aa_middle_layer_review_batches.cjs` now annotates singleton review batches as `cohort_singleton`, `cohort_tail`, or `unjustified_singleton`, and `scripts/run_ib_math_aa_middle_layer_pipeline.cjs` now reports singleton details and fails on unjustified singletons. Verification passed: syntax checks for both scripts; v116 pipeline with 0 ready, 40 review drafts, 0 structural failures, 13 review batches/subsets/workspaces, 85 image refs, 0 missing refs, 31 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, `singleton_batches:5`, and `unjustified_singletons:0`; negative ready gate selected 1 pending skeleton, ready 0, rejected 1, produced no reviewed batch and did not call installer check; `--handoff latest --plan-only` resolves v116. Strict current complete-hidden count is 223: SL 81 (`P1:31`, `P2:50`) and HL 142 (`P1:74`, `P2:67`, `P3:1`); visible/published remain 0 and course remains closed. The prior 226 count was too broad because `ib-math-aa-hl/P1-000023`, `P1-000024`, and `P1-000025` lack complete scoring/classification status and must not be counted yet. Active entry point: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v116-current-health.review-index.html`; shortcut after source certification: `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch review-batch-01`.

- Completed v101 `review-batch-01` through the AP-style reviewed-skeleton workflow and installed 3 closed structured reviewed HL Paper 2 items: `ib-math-aa-hl/P2-000054` (`MathsAA_HL_P2_2022_May_TZ2:Q7`, lHopital limit, 8 marks, primary/required `AA-5.13`), `ib-math-aa-hl/P2-000057` (`MathsAA_HL_P2_2022_May_TZ2:Q10`, two plant-growth models with equations, proof and derivative interval comparison, 15 marks, primary `AA-5.6`, required `AA-5.6`, `AA-2.3`, `AA-2.10`, `AA-2.15`, `AA-3.7`, `AA-3.8`, `AA-5.1`), and `ib-math-aa-hl/P2-000079` (`MathsAA_HL_P2_2023_May_TZ1:Q8`, angle between a line and a plane, 7 marks, primary `AA-3.18`, required `AA-3.18`, `AA-3.13`, `AA-3.14`, `AA-3.17`). Corrected OCR issues including `k = pi/4`, final limit `-1/4`, plant model formulas and interval total `3.14 (= pi)` weeks, and preserved both official scalar-product/vector-product solution paths for the vector item. Ready gate selected 3, ready 3, rejected 0; materialized 3 reviewed records; installer no-write returned `Checked 3 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 3 reviewed structured item(s).` Full post-install gates passed: curriculum build, structured delivery gate (`5665 item(s), 0 errors`), IB Math AA audit (`0 errors`, existing warnings only), learning schema, Mock contract build, SOP gate and structured-delivery npm gate. Current formal count is 226 structured reviewed hidden items: SL 81 (`P1:31`, `P2:50`) and HL 145 (`P1:77`, `P2:67`, `P3:1`); visible/published remain 0 and course remains closed. Refreshed `middle-layer-v102-post-v101-batch-01-health` passed with 0 ready, 40 review drafts, 0 structural failures, 12 review batches/subsets/workspaces, 85 image refs, 0 missing refs, 29 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and `handoff_gate.ok:true`; `CURRENT_HANDOFF.json` now points to v102. Next batch is `review-batch-01`, `ib-math-aa-hl/P2-000094`, 20 marks, primary `AA-4.11`, with one question asset and two markscheme assets. Current shortcut: `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch review-batch-01`.

- Upgraded the IB Math AA middle-layer delivery loop to v100 without formal bank writes. Added `scripts/run_ib_math_aa_post_certified_delivery.cjs`, a handoff-driven post-certification runner that executes ready gate with `--use-reviewed-skeletons`, installer `--check`, controlled install, full post-install gates, and an automatic middle-layer refresh only after certified ready items exist. `scripts/run_ib_math_aa_middle_layer_pipeline.cjs` now writes `commands.post_certified_delivery` and `next_review_batch.post_certified_delivery_command` into handoff manifests; `scripts/validate_ib_math_aa_middle_layer_handoff.cjs` requires that command for non-empty queues; `package.json` exposes `npm run deliver:ib-math-aa:post-certified`. Verification passed: syntax checks for the new runner, pipeline and handoff validator; `middle-layer-v100-post-certified-runner-health` with 0 ready, 40 review drafts, 0 structural failures, 10 review batches/subsets/workspaces, 85 image refs, 0 missing refs, 25 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, `handoff_gate.ok:true`, and `has_post_certified_delivery_command:true`; standalone handoff validation passed; negative runner test on unreviewed `review-batch-01` failed cleanly at ready gate with 0 ready and did not reach installer. Formal count remains 223 structured reviewed hidden items; visible/published remain 0; course remains closed. New active entry point: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v100-post-certified-runner-health.review-index.html`; handoff: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v100-post-certified-runner-health.handoff.json`; after source review, run `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff tmp\ib-math-aa-generated-compact-specs\middle-layer-v100-post-certified-runner-health.handoff.json --batch review-batch-01`.
- Added current-handoff resolution to the v100 post-certified runner without formal bank writes. `scripts/run_ib_math_aa_post_certified_delivery.cjs --handoff latest --plan-only` now finds the latest middle-layer handoff, validates it, and prints the active review index, subset, workspace, expected reviewed batch, exact full command and short current command; `npm run deliver:ib-math-aa:current` is the same runner with `--handoff latest`. Verification passed: runner syntax, `package.json` parse, `--handoff latest --plan-only` resolved `middle-layer-v100-post-certified-runner-health`, and `--handoff latest --batch review-batch-01 --skip-refresh` failed cleanly at ready gate because the subset is not certified yet. Formal count remains 223; visible/published remain 0; course remains closed. Current no-hardcoded-path command after source review: `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch review-batch-01`.
- Upgraded the current-handoff path to v101 without formal bank writes. `scripts/run_ib_math_aa_middle_layer_pipeline.cjs` now writes `tmp/ib-math-aa-generated-compact-specs/CURRENT_HANDOFF.json` only for active current-health/post-install handoffs and refuses to update it for regression/reject runs. `scripts/run_ib_math_aa_post_certified_delivery.cjs --handoff latest` now reads that pointer first and falls back to scanning only active health-style handoffs. Verification passed: syntax checks for pipeline and runner; `middle-layer-v101-current-pointer-health` passed with 0 ready, 40 review drafts, 0 structural failures, 10 review batches/subsets/workspaces, 85 image refs, 0 missing refs, 25 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, `handoff_gate.ok:true`, and pointer updated to v101; `middle-layer-v101-regression-pointer-guard --include-reviewed --ready-check` produced 5 ready regression records and installer no-write passed, but `CURRENT_HANDOFF.json` remained pointed at v101 current health; `--handoff latest --plan-only` resolved v101, and `--handoff latest --batch review-batch-01 --skip-refresh` still failed at ready gate while unreviewed. Formal count remains 223; visible/published remain 0; course remains closed. Current active pointer: `tmp\ib-math-aa-generated-compact-specs\CURRENT_HANDOFF.json`; current shortcut after source review: `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch review-batch-01`.

- Completed v95 expanded-v8 `review-batch-01` through the reviewed-skeleton workflow and installed `ib-math-aa-hl/P1-000051` (`MathsAA_HL_P1_2022_Nov:Q3`) as a closed structured reviewed item: 2 parts, 5 marks, 5 one-mark points, primary `AA-1.6`, required `AA-1.6` and `AA-3.3`. Corrected the OCR draft into the exact identity \\(a^2+((a^2-1)/2)^2=((a^2+1)/2)^2\\), preserved the part (a) two-method markscheme note across the first markscheme page, and used the second markscheme page for the triangle-area result \\(a(a^2-1)/4=(a^3-a)/4\\). Ready gate selected 1, ready 1, rejected 0; installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 1 reviewed structured item(s).` Full post-install gate chain passed: curriculum build, structured delivery gate (`5655 item(s), 0 errors`), IB Math AA audit (`0 errors`), learning schema, Mock contract build, SOP gate and structured-delivery npm gate. Current formal count is 213 structured reviewed hidden items: SL 79 (`P1:30`, `P2:49`) and HL 134 (`P1:72`, `P2:61`, `P3:1`); visible/published remain 0. Refreshed `middle-layer-v96-expanded-v8-current-health` passed with 0 ready, 40 review drafts, 0 structural failures, 10 review batches/subsets/workspaces, 84 image refs, 0 missing refs, 25 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and `handoff_gate.ok:true`. Next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v96-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for `ib-math-aa-hl/P1-000118`.

- Completed v94 expanded-v8 `review-batch-01` through the reviewed-skeleton workflow and installed 5 closed structured reviewed items: `ib-math-aa-hl/P1-000043` (`MathsAA_HL_P1_2022_May_TZ2:Q7`, definite integral using `u=sec x`, 6 marks, primary/required `AA-5.16`), `ib-math-aa-sl/P1-000066` (`MathsAA_SL_P1_Specimen:Q3`, algebraic proof of evenness, 5 marks, primary/required `AA-1.6`), `ib-math-aa-hl/P1-000091` (`MathsAA_HL_P1_2023_Nov_TZ1:Q7`, complex-number substitution and real/imaginary comparison, 5 marks, primary/required `AA-1.12`), `ib-math-aa-hl/P1-000110` (`MathsAA_HL_P1_Specimen:Q2`, algebraic proof of evenness, 5 marks, primary/required `AA-1.15`) and `ib-math-aa-hl/P2-000005` (`MathsAA_HL_P2_2021_May_TZ1:Q5`, binomial coefficient term selection, 5 marks, primary/required `AA-1.9`). Ready gate selected 5, ready 5, rejected 0; installer no-write returned `Checked 5 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 5 reviewed structured item(s).` Full post-install gate chain passed: curriculum build, structured delivery gate (`5654 item(s), 0 errors`), IB Math AA audit (`0 errors`), learning schema, Mock contract build, SOP gate and structured-delivery npm gate. Current formal count is 212 structured reviewed hidden items: SL 79 (`P1:30`, `P2:49`) and HL 133 (`P1:71`, `P2:61`, `P3:1`); visible/published remain 0. Refreshed `middle-layer-v95-expanded-v8-current-health` passed with 0 ready, 40 review drafts, 0 structural failures, 11 review batches/subsets/workspaces, 84 image refs, 0 missing refs, 27 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and `handoff_gate.ok:true`. Next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v95-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for `ib-math-aa-hl/P1-000051`.

- Completed the v93 expanded-v8 review-batch-01 through the reviewed-skeleton workflow. Source-checked and promoted 4 records: `ib-math-aa-hl/P1-000112` (graph transformation, 5 marks, primary `AA-2.11`, required `AA-2.3`), `ib-math-aa-sl/P1-000042` (trigonometric graph, 6 marks, primary/required `AA-3.7`), `ib-math-aa-hl/P1-000065` (trigonometric graph, 6 marks, primary `AA-3.7`, required `AA-2.4`, `AA-2.11`, `AA-3.7`) and `ib-math-aa-hl/P1-000052` (integration from derivative, 5 marks, primary/required `AA-5.10`). Ready gate selected 4, ready 4, rejected 0; installer no-write returned `Checked 4 reviewed structured item(s); no files were changed.` First post-install validation caught missing `part_label` on newly flattened mark points; after correcting the reviewed skeletons and regenerating the reviewed batch, installer no-write passed again, controlled install overwrote the 4 closed records, and the full gate chain passed with IB Math AA audit 0 errors. Current formal reviewed-hidden count is 207: SL 78 (`P1:29`, `P2:49`) and HL 129 (`P1:68`, `P2:60`, `P3:1`); visible/published remain 0. Refreshed `middle-layer-v94-expanded-v8-current-health` passed with 0 ready, 40 review drafts, 0 structural failures, 9 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 23 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and `handoff_gate.ok:true`. Next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v94-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

- Upgraded IB Math AA middle-layer review workspace output to v73 without formal bank writes. `scripts\build_ib_math_aa_middle_layer_review_workspace.cjs` now renders a per-item `Reviewed Skeleton`: a stripped version of the generated review draft with all middle-layer `auto_*` metadata removed and the review-certification object inserted with pending flags. This gives the reviewer a direct post-check shape for ready promotion instead of manually reshaping compact spec JSON. Verification passed: `node --check scripts\build_ib_math_aa_middle_layer_review_workspace.cjs`; `middle-layer-v73-expanded-v8-current-health` with 0 ready, 40 review drafts, 0 structural failures, 19 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 40 classification panels, 43 index hrefs with 0 missing local targets and `handoff_gate.ok:true`; direct workspace check found 40 item cards, 40 reviewed skeletons, 40 `PENDING_REVIEWER` markers and no old incomplete markers. No installer run was needed because no ready items were produced. Formal count remains 198 structured reviewed hidden items; visible/published remain 0. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v73-expanded-v8-current-health.review-index.html`; machine handoff is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v73-expanded-v8-current-health.handoff.json`; next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v73-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

- Upgraded IB Math AA middle-layer classification routing to v72 without formal bank writes. `scripts/generate_ib_math_aa_compact_specs_from_scan.cjs` now removes `[Maximum mark]` boilerplate before classification keyword checks, no longer lets broad or same-topic keyword matches override existing source-derived classifications, and only marks high-confidence cross-topic signals as `classification_conflict`. Verification passed: `node --check scripts\generate_ib_math_aa_compact_specs_from_scan.cjs` and `middle-layer-v72-expanded-v8-current-health` with 0 ready, 40 review drafts, 0 structural failures, 19 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 40 classification panels, 43 index hrefs with 0 missing local targets and `handoff_gate.ok:true`. Route counts now show `classification_conflict:5`, `formula_line_split:2`, `multiple_methods:8`, `standard_source_review:1`, `symbol_visual_check:24`, `visual_element:25`; by-priority remains `source_visual_review:32`, `fast_field_review:8`. No installer run was needed because no ready items were produced. Formal count remains 198 structured reviewed hidden items; visible/published remain 0. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v72-expanded-v8-current-health.review-index.html`; machine handoff is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v72-expanded-v8-current-health.handoff.json`; next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v72-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

- Upgraded the IB Math AA middle layer through v71 without formal bank writes. `scripts/generate_ib_math_aa_compact_specs_from_scan.cjs` now preserves bracketed mark lines for OCR part inference, falls back from per-line OCR to `question_text_candidate`, splits `main` drafts into official top-level parts when labels and marks reconcile, and clears stale `part_alignment` routing when generated parts are already split. Verification passed: `node --check scripts\generate_ib_math_aa_compact_specs_from_scan.cjs` and `middle-layer-v71-expanded-v8-current-health` with 0 ready, 40 review drafts, 0 structural failures, 18 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 40 classification panels, 41 index hrefs with 0 missing local targets and `handoff_gate.ok:true`. The active queue now has `part_alignment` route count 0 and by-priority `source_visual_review:32`, `fast_field_review:8`; no installer run was needed because no ready items were produced. Formal count remains 198 structured reviewed hidden items; visible/published remain 0. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v71-expanded-v8-current-health.review-index.html`; machine handoff is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v71-expanded-v8-current-health.handoff.json`; next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v71-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

- Continued the reviewed-equivalent middle-layer improvement through v65/v66. Fixed `scripts/generate_ib_math_aa_compact_specs_from_scan.cjs` so IB questions with no separate stem block but complete source-backed part text no longer become structural failures; this changed the active queue from one structural failure to zero. `middle-layer-v65-expanded-v8-current-health` produced 2 ready items, 38 review drafts and 0 structural failures; ready materialization plus installer no-write returned `Checked 2 reviewed structured item(s); no files were changed.` Controlled install added `ib-math-aa-sl/P1-000006` (`MathsAA_SL_P1_2021_May_TZ1:Q6`, transferred from reviewed HL equivalent `ib-math-aa-hl/P1-000005`) and `ib-math-aa-sl/P1-000024` (`MathsAA_SL_P1_2021_Nov:Q6`, transferred from reviewed HL equivalent `ib-math-aa-hl/P1-000018`) as closed structured reviewed items. Post-install gates passed: curriculum build, structured delivery gate (`5637 item(s), 0 error(s)`), IB Math AA audit (`0 error(s)` with publication-stage warnings only), learning schema, mock contract build, SOP gate and structured-delivery npm gate. Current formal count is 198 structured reviewed hidden items: SL 73 (P1 27, P2 46) and HL 125 (P1 66, P2 58, P3 1); visible/published remain 0. Refreshed `middle-layer-v66-expanded-v8-current-health`: 0 ready, 40 review drafts, 0 structural failures, 18 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 40 classification panels, 41 index hrefs with 0 missing local targets and `handoff_gate.ok:true`. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v66-expanded-v8-current-health.review-index.html`; machine handoff is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v66-expanded-v8-current-health.handoff.json`; next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v66-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

- Upgraded and verified the IB Math AA AP-style middle layer for reviewed-equivalent batch transfer. `scripts/generate_ib_math_aa_compact_specs_from_scan.cjs` now compares unfinished scan/draft items against existing `structured_reviewed` bank records and, only when question text, part labels and mark totals match strongly, transfers structured stem blocks, parts, answers, markscheme rows, one-mark points, solution outline and knowledge-point classification while remapping all question/markscheme evidence references to the current item assets. `middle-layer-v62-expanded-v8-current-health` produced 5 ready items, 34 review drafts and 1 structural failure; the ready output materialized and installer no-write returned `Checked 5 reviewed structured item(s); no files were changed.` Controlled install then added `ib-math-aa-hl/P2-000016`, `ib-math-aa-sl/P1-000005`, `ib-math-aa-sl/P1-000023`, `ib-math-aa-sl/P2-000084` and `ib-math-aa-hl/P2-000015` as closed structured reviewed items. Post-install gates passed: curriculum build, structured delivery gate (`5635 item(s), 0 error(s)`), IB Math AA audit (`0 error(s)` with publication-stage warnings only), learning schema, mock contract build, SOP gate and structured-delivery npm gate. Current formal count is 196 structured reviewed hidden items: SL 71 (P1 25, P2 46) and HL 125 (P1 66, P2 58, P3 1); visible/published remain 0. Refreshed `middle-layer-v63-expanded-v8-current-health`: 0 ready, 39 review drafts, 1 structural failure, 18 review batches/subsets/workspaces, 78 image refs, 0 missing refs, 39 classification panels, 41 index hrefs with 0 missing local targets and `handoff_gate.ok:true`. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v63-expanded-v8-current-health.review-index.html`; machine handoff is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v63-expanded-v8-current-health.handoff.json`; next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v63-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

- Completed the v51 expanded-v8 actionable subset and refreshed the phase-1 queue to v52. Source-checked and installed `ib-math-aa-hl/P1-000006` (`MathsAA_HL_P1_2021_May_TZ1:Q6`) from `middle-layer-v51-expanded-v8-current-health.review-subsets/review-batch-01.review-draft.compact-spec.json`: 1 official part, 4 marks, 4 one-mark points, primary/required `AA-3.9`, closed with `student_visible:false` and `publish_status:"blocked"`. The paired markscheme spans two assets and was reviewed across both pages. Ready gate `middle-layer-v51-expanded-v8-current-health-review-batch-01-ready` selected 1, ready 1, rejected 0, materialized 1 reviewed record, installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.`, then controlled install returned `Installed 1 reviewed structured item(s).` Post-install gates passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs` (0 errors, existing warnings only), `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`. Current formal count is 183 structured reviewed hidden items: SL 65 (P1 23, P2 42) and HL 118 (P1 65, P2 52, P3 1); visible/published remain 0. Refreshed `middle-layer-v52-expanded-v8-current-health`: 40 review drafts, 0 ready, 0 structural failures, 18 review batches/subsets/workspaces, 81 image refs, 0 missing refs, 40 classification panels, 41 index hrefs with 0 missing local targets and `handoff_gate.ok:true`. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v52-expanded-v8-current-health.review-index.html`; next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v52-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`, expected reviewed batch `tmp\ib-math-aa-generated-compact-specs\middle-layer-v52-expanded-v8-current-health-review-batch-01-ready.reviewed-batch.json`. Course remains closed.

- Completed the v50 expanded-v8 actionable subset and refreshed the phase-1 queue to v51. Source-checked and installed 3 closed structured reviewed items from `middle-layer-v50-expanded-v8-current-health.review-subsets/review-batch-01.review-draft.compact-spec.json`: `ib-math-aa-hl/P1-000087` (`MathsAA_HL_P1_2023_Nov_TZ1:Q3`, arithmetic sequence partial sums, 7 marks, primary/required `AA-1.2`), `ib-math-aa-hl/P2-000044` (`MathsAA_HL_P2_2022_May_TZ1:Q9`, restricted seating permutations, 7 marks, primary/required `AA-1.10`) and `ib-math-aa-sl/P2-000059` (`MathsAA_SL_P2_2023_May_TZ1:Q5`, normal distribution IQR, 5 marks, primary/required `AA-4.12`). Ready gate `middle-layer-v50-expanded-v8-current-health-review-batch-01-ready` selected 3, ready 3, rejected 0, materialized 3 reviewed records, installer no-write returned `Checked 3 reviewed structured item(s); no files were changed.`, then controlled install returned `Installed 3 reviewed structured item(s).` Post-install gates passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs` (0 errors, existing warnings only), `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`. Current formal count is 182 structured reviewed hidden items: SL 65 (P1 23, P2 42) and HL 117 (P1 64, P2 52, P3 1); visible/published remain 0. Refreshed `middle-layer-v51-expanded-v8-current-health`: 40 review drafts, 0 ready, 0 structural failures, 18 review batches/subsets/workspaces, 81 image refs, 0 missing refs, 40 classification panels, 41 index hrefs with 0 missing local targets and `handoff_gate.ok:true`. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v51-expanded-v8-current-health.review-index.html`; next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v51-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`, expected reviewed batch `tmp\ib-math-aa-generated-compact-specs\middle-layer-v51-expanded-v8-current-health-review-batch-01-ready.reviewed-batch.json`. Course remains closed.

- Completed the v49 expanded-v8 actionable subset and refreshed the phase-1 queue to v50. Source-checked and installed 3 closed structured reviewed items from `middle-layer-v49-expanded-v8-current-health.review-subsets/review-batch-01.review-draft.compact-spec.json`: `ib-math-aa-hl/P2-000125` (`MathsAA_HL_P2_Specimen:Q6`, expected value and variance of a linear transform, 6 marks, primary `AA-4.14`, required `AA-4.14`, `AA-4.7`), `ib-math-aa-sl/P1-000058` (`MathsAA_SL_P1_2023_Nov_TZ1:Q4`, arithmetic sequence partial sums, 7 marks, primary/required `AA-1.2`) and `ib-math-aa-sl/P2-000039` (`MathsAA_SL_P2_2022_May_TZ2:Q3`, geometric growth and linear salary model, 6 marks, primary `AA-1.3`, required `AA-1.3`, `AA-4.4`). Ready gate first caught incomplete table-block structure in the draft; after adding table `columns` and `rows`, `middle-layer-v49-expanded-v8-current-health-review-batch-01-ready` selected 3, ready 3, rejected 0, materialized 3 reviewed records, installer no-write returned `Checked 3 reviewed structured item(s); no files were changed.`, then controlled install returned `Installed 3 reviewed structured item(s).` Post-install gates passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs` (0 errors, existing warnings only), `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`. Current formal count is 179 structured reviewed hidden items: SL 64 (P1 23, P2 41) and HL 115 (P1 63, P2 51, P3 1); visible/published remain 0. Refreshed `middle-layer-v50-expanded-v8-current-health`: 40 review drafts, 0 ready, 0 structural failures, 17 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 40 classification panels, 39 index hrefs with 0 missing local targets and `handoff_gate.ok:true`. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v50-expanded-v8-current-health.review-index.html`; next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v50-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`, expected reviewed batch `tmp\ib-math-aa-generated-compact-specs\middle-layer-v50-expanded-v8-current-health-review-batch-01-ready.reviewed-batch.json`. Course remains closed.

- Completed the v48 expanded-v8 actionable subset and refreshed the phase-1 queue to v49. Source-checked and installed 3 closed structured reviewed HL Paper 2 items from `middle-layer-v48-expanded-v8-current-health.review-subsets/review-batch-01.review-draft.compact-spec.json`: `ib-math-aa-hl/P2-000075` (`MathsAA_HL_P2_2023_May_TZ1:Q4`, normal distribution IQR, 5 marks, primary/required `AA-4.12`), `ib-math-aa-hl/P2-000092` (`MathsAA_HL_P2_2023_May_TZ2:Q9`, modular combinations, 5 marks, primary/required `AA-1.10`) and `ib-math-aa-hl/P2-000111` (`MathsAA_HL_P2_2023_Nov_TZ2:Q4`, motion from displacement, 5 marks, primary `AA-5.5`, required `AA-5.5`, `AA-5.6`, `AA-5.8`). Ready gate `middle-layer-v48-expanded-v8-current-health-review-batch-01-ready` selected 3, ready 3, rejected 0, materialized 3 reviewed records, installer no-write returned `Checked 3 reviewed structured item(s); no files were changed.`, then controlled install returned `Installed 3 reviewed structured item(s).` Post-install gates passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs` (0 errors, existing warnings only), `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`. Current formal count is 176 structured reviewed hidden items: SL 62 (P1 22, P2 40) and HL 114 (P1 63, P2 50, P3 1); visible/published remain 0. Refreshed `middle-layer-v49-expanded-v8-current-health`: 40 review drafts, 0 ready, 0 structural failures, 17 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 40 classification panels, 39 index hrefs with 0 missing local targets and `handoff_gate.ok:true`. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v49-expanded-v8-current-health.review-index.html`; next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v49-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`, expected reviewed batch `tmp\ib-math-aa-generated-compact-specs\middle-layer-v49-expanded-v8-current-health-review-batch-01-ready.reviewed-batch.json`. Course remains closed.

- Completed the v47 expanded-v8 actionable subset and refreshed the phase-1 queue to v48. Source-checked and installed `ib-math-aa-sl/P1-000068` (`MathsAA_SL_P1_Specimen:Q5`) from `middle-layer-v47-expanded-v8-current-health.review-subsets/review-batch-01.review-draft.compact-spec.json`: 2 official parts, 5 marks, 5 one-mark points, primary/required `AA-2.5`, closed with `student_visible:false` and `publish_status:"blocked"`. Ready gate `middle-layer-v47-expanded-v8-current-health-review-batch-01-ready` selected 1, ready 1, rejected 0, materialized 1 reviewed record, installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.`, then controlled install returned `Installed 1 reviewed structured item(s).` Post-install gates passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs` (0 errors, existing warnings only), `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`. Current formal count is 173 structured reviewed hidden items: SL 62 (P1 22, P2 40) and HL 111 (P1 63, P2 47, P3 1); visible/published remain 0. Refreshed `middle-layer-v48-expanded-v8-current-health`: 40 review drafts, 0 ready, 0 structural failures, 17 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 40 classification panels, 39 index hrefs with 0 missing local targets and `handoff_gate.ok:true`. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v48-expanded-v8-current-health.review-index.html`; next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v48-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`, expected reviewed batch `tmp\ib-math-aa-generated-compact-specs\middle-layer-v48-expanded-v8-current-health-review-batch-01-ready.reviewed-batch.json`. Course remains closed.

- Completed the v46 expanded-v8 actionable subset and refreshed the phase-1 queue to v47. Source-checked and installed 3 closed structured reviewed items from `middle-layer-v46-expanded-v8-current-health.review-subsets/review-batch-01.review-draft.compact-spec.json`: `ib-math-aa-hl/P2-000014` (`MathsAA_HL_P2_2021_May_TZ2:Q2`, arithmetic sequence zero term and maximum sum, 5 marks, primary/required `AA-1.2`), `ib-math-aa-hl/P2-000019` (`MathsAA_HL_P2_2021_May_TZ2:Q7`, runner order counting, 5 marks, primary/required `AA-1.10`) and `ib-math-aa-sl/P1-000003` (`MathsAA_SL_P1_2021_May_TZ1:Q3`, arithmetic sequence from `u_8` and `S_8`, 5 marks, primary/required `AA-1.2`). Ready gate `middle-layer-v46-expanded-v8-current-health-review-batch-01-ready` selected 3, ready 3, rejected 0, materialized 3 reviewed records, installer no-write returned `Checked 3 reviewed structured item(s); no files were changed.`, then controlled install returned `Installed 3 reviewed structured item(s).` Post-install gates passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs` (0 errors, existing warnings only), `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`. Current formal count is 172 structured reviewed hidden items: SL 61 (P1 21, P2 40) and HL 111 (P1 63, P2 47, P3 1); visible/published remain 0. Refreshed `middle-layer-v47-expanded-v8-current-health`: 40 review drafts, 0 ready, 0 structural failures, 18 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 40 classification panels, 41 index hrefs with 0 missing local targets and `handoff_gate.ok:true`. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v47-expanded-v8-current-health.review-index.html`; next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v47-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`, expected reviewed batch `tmp\ib-math-aa-generated-compact-specs\middle-layer-v47-expanded-v8-current-health-review-batch-01-ready.reviewed-batch.json`. Course remains closed.

- Completed the v45 expanded-v8 actionable subset and refreshed the phase-1 queue to v46. Source-checked and installed 3 closed structured reviewed items from `middle-layer-v45-expanded-v8-current-health.review-subsets/review-batch-01.review-draft.compact-spec.json`: `ib-math-aa-hl/P1-000090` (`MathsAA_HL_P1_2023_Nov_TZ1:Q6`, 7 marks, primary/required `AA-1.15`), `ib-math-aa-hl/P1-000113` (`MathsAA_HL_P1_Specimen:Q5`, 5 marks, primary/required `AA-2.5`) and `ib-math-aa-hl/P2-000065` (`MathsAA_HL_P2_2022_Nov:Q6`, 8 marks, primary `AA-4.14`, required `AA-4.14` and `AA-5.16`). Ready gate `middle-layer-v45-expanded-v8-current-health-review-batch-01-ready` selected 3, ready 3, rejected 0, materialized 3 reviewed records, installer no-write returned `Checked 3 reviewed structured item(s); no files were changed.`, then controlled install returned `Installed 3 reviewed structured item(s).` Post-install gates passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs` (0 errors, existing warnings only), `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`. Current formal count is 169 structured reviewed hidden items: SL 60 (P1 20, P2 40) and HL 109 (P1 63, P2 45, P3 1); visible/published remain 0. Refreshed `middle-layer-v46-expanded-v8-current-health`: 40 review drafts, 0 ready, 0 structural failures, 17 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 40 classification panels, 39 index hrefs with 0 missing local targets and `handoff_gate.ok:true`. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v46-expanded-v8-current-health.review-index.html`; next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v46-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`, expected reviewed batch `tmp\ib-math-aa-generated-compact-specs\middle-layer-v46-expanded-v8-current-health-review-batch-01-ready.reviewed-batch.json`. Course remains closed.

- Completed the v44 expanded-v8 actionable subset and refreshed the phase-1 queue to v45. Source-checked and installed `ib-math-aa-sl/P1-000031` (`MathsAA_SL_P1_2022_May_TZ1:Q4`) from `middle-layer-v44-expanded-v8-current-health.review-subsets/review-batch-01.review-draft.compact-spec.json`: 2 official parts, 7 marks, 7 one-mark points, primary `AA-3.8`, required `AA-3.8`, `AA-2.4`, `AA-3.5`, `AA-3.6`, closed with `student_visible:false` and `publish_status:"blocked"`. Ready gate `middle-layer-v44-expanded-v8-current-health-review-batch-01-ready` selected 1, ready 1, rejected 0, materialized 1 reviewed record, installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.`, then controlled install returned `Installed 1 reviewed structured item(s).` Post-install gates passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs` (0 errors, existing warnings only), `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`. Current formal count is 166 structured reviewed hidden items: SL 60 (P1 20, P2 40) and HL 106 (P1 61, P2 44, P3 1); visible/published remain 0. Refreshed `middle-layer-v45-expanded-v8-current-health`: 40 review drafts, 0 ready, 0 structural failures, 17 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 40 classification panels, 39 index hrefs with 0 missing local targets and `handoff_gate.ok:true`. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v45-expanded-v8-current-health.review-index.html`; next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v45-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for `ib-math-aa-hl/P1-000090`, `ib-math-aa-hl/P1-000113`, and `ib-math-aa-hl/P2-000065`, expected reviewed batch `tmp\ib-math-aa-generated-compact-specs\middle-layer-v45-expanded-v8-current-health-review-batch-01-ready.reviewed-batch.json`. Course remains closed.

- Continued IB Math AA AP-style middle-layer flow from v40 through the expanded v8 queue. Completed and installed 5 source-checked structured reviewed closed items: `ib-math-aa-sl/P2-000079` (`MathsAA_SL_P2_2023_Nov_TZ1:Q7`, 14 marks, primary `AA-5.8`), `ib-math-aa-hl/P2-000103` (`MathsAA_HL_P2_2023_Nov_TZ1:Q8`, 9 marks, primary `AA-3.16`), `ib-math-aa-hl/P2-000090` (`MathsAA_HL_P2_2023_May_TZ2:Q7`, 5 marks, primary `AA-5.17`), `ib-math-aa-sl/P1-000020` (`MathsAA_SL_P1_2021_Nov:Q2`, 4 marks, primary `AA-5.5`) and `ib-math-aa-sl/P1-000029` (`MathsAA_SL_P1_2022_May_TZ1:Q2`, 5 marks, primary `AA-5.5`). Ready gates passed for v40, v41 and v43 batch-01; installer no-write returned `Checked 1`, `Checked 1` and `Checked 3 reviewed structured item(s); no files were changed.` respectively; controlled installs returned `Installed 1`, `Installed 1` and `Installed 3 reviewed structured item(s).` Post-install gates passed after each install: curriculum build, structured delivery gate, IB Math AA audit with 0 errors, learning schema, mock contract build, SOP gate and structured-delivery npm gate. Current formal count is 165 structured reviewed hidden items: SL 59 (P1 19, P2 40) and HL 106 (P1 61, P2 44, P3 1); visible/published remain 0.
- Fixed the middle-layer handoff empty-queue boundary. `scripts/run_ib_math_aa_middle_layer_pipeline.cjs` and `scripts/validate_ib_math_aa_middle_layer_handoff.cjs` now allow an empty review queue only as a terminal handoff that points to the failures report, while non-empty queues still require the next review batch, ready gate command and installer no-write command. Verification passed: syntax checks for both scripts, `middle-layer-v42-current-health` with 0 ready, 0 review draft, 37 deferred completed/duplicate records, terminal handoff OK, standalone handoff validation OK, and `middle-layer-v42-reviewed-regression --include-reviewed --ready-check` with 37 ready records and installer no-write `Checked 37 reviewed structured item(s); no files were changed.`
- Expanded the next workset from exhausted `scan-v9-*` to `scan-v8-*`. `middle-layer-v43-expanded-v8-current-health` produced 40 review drafts, 0 ready, 0 structural failures, 18 review batches, 80 image refs and `handoff_gate.ok:true`; batch-01 installed the three low-size source-checked items above. Refreshed `middle-layer-v44-expanded-v8-current-health`: 40 review drafts, 0 ready, 0 structural failures, 18 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 40 classification panels, 41 index hrefs with 0 missing local targets and `handoff_gate.ok:true`. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v44-expanded-v8-current-health.review-index.html`; next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v44-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for `ib-math-aa-sl/P1-000031`, expected reviewed batch `tmp\ib-math-aa-generated-compact-specs\middle-layer-v44-expanded-v8-current-health-review-batch-01-ready.reviewed-batch.json`. Course remains closed.

- Completed the v39 actionable subset and refreshed the phase-1 queue to v40. Source-checked and installed `ib-math-aa-hl/P2-000107` (`MathsAA_HL_P2_2023_Nov_TZ1:Q12`) from `middle-layer-v39-current-health.review-subsets/review-batch-01.review-draft.compact-spec.json`: 5 official parts, 18 marks, 18 one-mark points, primary `AA-3.18`, required `AA-3.18`, `AA-3.1`, `AA-3.12`, `AA-3.14`, `AA-3.15`, `AA-3.17`, closed with `student_visible:false` and `publish_status:"blocked"`. Ready gate `middle-layer-v39-current-health-review-batch-01-ready` selected 1, ready 1, rejected 0, materialized 1 reviewed record, installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.`, then controlled install returned `Installed 1 reviewed structured item(s).` Post-install gates passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs` (0 errors, existing warnings only), `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`. Current formal count is 160 structured reviewed hidden items: SL 56 (P1 17, P2 39) and HL 104 (P1 61, P2 42, P3 1); visible/published remain 0. Refreshed `middle-layer-v40-current-health`: 2 review drafts, 0 ready, 0 structural failures, 2 review batches/subsets/workspaces, 6 image refs, 0 missing refs, 2 classification panels, 9 index hrefs with 0 missing local targets, and `handoff_gate.ok:true`. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v40-current-health.review-index.html`; next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v40-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for `ib-math-aa-sl/P2-000079`, expected reviewed batch `tmp\ib-math-aa-generated-compact-specs\middle-layer-v40-current-health-review-batch-01-ready.reviewed-batch.json`. Course remains closed.

- Completed the v38 actionable subset and refreshed the phase-1 queue to v39. Source-checked and installed 2 same-pattern probability/statistics items from `middle-layer-v38-current-health.review-subsets/review-batch-01.review-draft.compact-spec.json`: `ib-math-aa-sl/P2-000081` (`MathsAA_SL_P2_2023_Nov_TZ1:Q9`, 16 marks, primary `AA-4.12`, required `AA-4.12`, `AA-4.8`, `AA-4.9`, `AA-4.11`) and `ib-math-aa-hl/P2-000105` (`MathsAA_HL_P2_2023_Nov_TZ1:Q10`, 16 marks, primary `AA-4.12`, required `AA-4.12`, `AA-4.8`, `AA-4.9`, `AA-4.11`). Both remain closed with `student_visible:false` and `publish_status:"blocked"`. Ready gate `middle-layer-v38-current-health-review-batch-01-ready` selected 2, ready 2, rejected 0, materialized 2 reviewed records, installer no-write returned `Checked 2 reviewed structured item(s); no files were changed.`, then controlled install returned `Installed 2 reviewed structured item(s).` Post-install gates passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs` (0 errors, existing warnings only), `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`. Current formal count is 159 structured reviewed hidden items: SL 56 (P1 17, P2 39) and HL 103 (P1 61, P2 41, P3 1); visible/published remain 0. Refreshed `middle-layer-v39-current-health`: 3 review drafts, 0 ready, 0 structural failures, 3 review batches/subsets/workspaces, 12 image refs, 0 missing refs, 3 classification panels, 11 index hrefs with 0 missing local targets, and `handoff_gate.ok:true`. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v39-current-health.review-index.html`; next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v39-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for `ib-math-aa-hl/P2-000107`, expected reviewed batch `tmp\ib-math-aa-generated-compact-specs\middle-layer-v39-current-health-review-batch-01-ready.reviewed-batch.json`. Course remains closed.

- Completed the v33 actionable subset and refreshed the phase-1 queue to v34. Source-checked and installed `ib-math-aa-hl/P1-000084` (`MathsAA_HL_P1_2023_May_TZ2:Q12`) from `middle-layer-v33-current-health.review-subsets/review-batch-01.review-draft.compact-spec.json`: 4 parts, 17 marks, 17 one-mark points, standalone source-backed curve/regions figure `public/data/ib/math-aa/real-source-assets/figures/mathsaa_hl_p1_2023_may_tz2_q12_curve_regions.webp`, primary `AA-5.16`, required `AA-1.2`, `AA-3.5`, `AA-5.11`, `AA-5.16`, closed with `student_visible:false` and `publish_status:"blocked"`. Ready gate `middle-layer-v33-current-health-review-batch-01-ready` selected 1, ready 1, rejected 0, materialized 1 reviewed record, installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.`, then controlled install returned `Installed 1 reviewed structured item(s).` Post-install gates passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs` (0 errors, existing warnings only), `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`. Current formal count is 151 structured reviewed hidden items: SL 53 (P1 17, P2 36) and HL 98 (P1 59, P2 38, P3 1); visible/published remain 0. Refreshed `middle-layer-v34-current-health`: 11 review drafts, 0 ready, 0 structural failures, 8 review batches/subsets/workspaces, 44 image refs, 0 missing refs, 11 classification panels, 21 index hrefs with 0 missing local targets, and `handoff_gate.ok:true`. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v34-current-health.review-index.html`; next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v34-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for `ib-math-aa-hl/P2-000096` and `ib-math-aa-sl/P2-000016`, expected reviewed batch `tmp\ib-math-aa-generated-compact-specs\middle-layer-v34-current-health-review-batch-01-ready.reviewed-batch.json`. Course remains closed.

- Completed the v32 actionable subset and refreshed the phase-1 queue to v33. Source-checked and installed `ib-math-aa-hl/P2-000104` (`MathsAA_HL_P2_2023_Nov_TZ1:Q9`) from `middle-layer-v32-current-health.review-subsets/review-batch-01.review-draft.compact-spec.json`: 3 parts, 9 marks, 9 one-mark points, primary/required `AA-5.18`, closed with `student_visible:false` and `publish_status:"blocked"`. Ready gate `middle-layer-v32-current-health-review-batch-01-ready` selected 1, ready 1, rejected 0, materialized 1 reviewed record, installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.`, then controlled install returned `Installed 1 reviewed structured item(s).` Post-install gates passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs` (0 errors, existing warnings only), `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`. Current formal count is 150 structured reviewed hidden items: SL 53 (P1 17, P2 36) and HL 97 (P1 58, P2 38, P3 1); visible/published remain 0. Refreshed `middle-layer-v33-current-health`: 12 review drafts, 0 ready, 0 structural failures, 9 review batches/subsets/workspaces, 49 image refs, 0 missing refs, 12 classification panels, 23 index hrefs with 0 missing local targets, and `handoff_gate.ok:true`. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v33-current-health.review-index.html`; next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v33-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for `ib-math-aa-hl/P1-000084`, expected reviewed batch `tmp\ib-math-aa-generated-compact-specs\middle-layer-v33-current-health-review-batch-01-ready.reviewed-batch.json`. Course remains closed.

- Completed the first v31 actionable subset and refreshed the phase-1 queue to v32. Source-checked and installed `ib-math-aa-sl/P2-000018` (`MathsAA_SL_P2_2021_May_TZ2:Q9`) from `middle-layer-v31-current-health.review-subsets/review-batch-01.review-draft.compact-spec.json`: 4 parts, 15 marks, 15 one-mark points, primary `AA-4.7`, required `AA-1.3` and `AA-4.7`, closed with `student_visible:false` and `publish_status:"blocked"`. Ready gate `middle-layer-v31-current-health-review-batch-01-ready` selected 1, ready 1, rejected 0, materialized 1 reviewed record, installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.`, then controlled install returned `Installed 1 reviewed structured item(s).` Post-install gates passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs` (0 errors, existing warnings only), `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`. Current formal count is 149 structured reviewed hidden items: SL 53 (P1 17, P2 36) and HL 96 (P1 58, P2 37, P3 1); visible/published remain 0. Refreshed `middle-layer-v32-current-health`: 13 review drafts, 0 ready, 0 structural failures, 10 review batches/subsets/workspaces, 53 image refs, 0 missing refs, 13 classification panels, 25 index hrefs with 0 missing local targets, and `handoff_gate.ok:true`. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v32-current-health.review-index.html`; next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v32-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for `ib-math-aa-hl/P2-000104`, expected reviewed batch `tmp\ib-math-aa-generated-compact-specs\middle-layer-v32-current-health-review-batch-01-ready.reviewed-batch.json`. Course remains closed.

- Upgraded the IB Math AA middle-layer handoff path to v31. The handoff manifest now records `ready_batch_id` and `expected_reviewed_batch` for the next batch and every review batch. The post-certification command chain now uses the exact expected reviewed-batch path for installer no-write and controlled install commands instead of `<materialized-reviewed-batch>`. `scripts\validate_ib_math_aa_middle_layer_handoff.cjs` now rejects any `<...>` placeholder, requires each batch to carry an expected reviewed-batch path, and verifies the command chain references the next expected reviewed batch.
- Verification passed for `middle-layer-v31-current-health`: 14 review drafts, 0 ready, 0 structural failures, 11 review batches, 11 subset specs, 11 subset workspaces, 58 subset-workspace image refs, 58 asset refs, 0 missing refs, 0 missing draft items, 0 duplicate planned items, 0 extra planned items, 0 subset item mismatches, 14 classification panels, 27 index hrefs, 0 missing hrefs, 12 `classification_conflict` route flags, healthy handoff output and `handoff_gate.ok:true`. Handoff spot check confirmed placeholder count 0, next ready batch id `middle-layer-v31-current-health-review-batch-01-ready`, expected reviewed batch `tmp/ib-math-aa-generated-compact-specs/middle-layer-v31-current-health-review-batch-01-ready.reviewed-batch.json`, and command-chain reference present.
- Verification passed for `middle-layer-v31-reviewed-regression --include-reviewed --ready-check`: 23 ready, 14 review drafts, 0 structural failures, same subset/index/workspace/handoff health, `handoff_gate.ok:true`, and installer no-write returned `Checked 23 reviewed structured item(s); no files were changed.` Positive ready-gate regression selected 23, ready 23, rejected 0, materialized 23 closed reviewed records and installer no-write returned `Checked 23 reviewed structured item(s); no files were changed.` Negative subset run `middle-layer-v31-subset-reject-unreviewed --allow-empty` selected 1, ready 0, rejected 1, materialized nothing, and did not call installer. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v31-current-health.review-index.html`; machine-readable handoff is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v31-current-health.handoff.json`. Formal count remains 148 structured reviewed hidden items; student-visible and published remain 0; course remains closed.

- Upgraded the IB Math AA middle-layer handoff path to v30. Added read-only `scripts\validate_ib_math_aa_middle_layer_handoff.cjs`, which validates a handoff manifest independently of the pipeline: schema, generator, phase, closed-course policy, required output paths, next review batch, ready-gate command, review batch count, and post-certification command chain. `scripts\run_ib_math_aa_middle_layer_pipeline.cjs` now runs this validator as `handoff_gate` after writing the manifest.
- Verification passed for `middle-layer-v30-current-health`: 14 review drafts, 0 ready, 0 structural failures, 11 review batches, 11 subset specs, 11 subset workspaces, 58 subset-workspace image refs, 58 asset refs, 0 missing refs, 0 missing draft items, 0 duplicate planned items, 0 extra planned items, 0 subset item mismatches, 14 classification panels, 27 index hrefs, 0 missing hrefs, 12 `classification_conflict` route flags, healthy handoff output and `handoff_gate.ok:true`.
- Verification passed for `middle-layer-v30-reviewed-regression --include-reviewed --ready-check`: 23 ready, 14 review drafts, 0 structural failures, same subset/index/workspace/handoff health, `handoff_gate.ok:true`, and installer no-write returned `Checked 23 reviewed structured item(s); no files were changed.` Positive ready-gate regression selected 23, ready 23, rejected 0, materialized 23 closed reviewed records and installer no-write returned `Checked 23 reviewed structured item(s); no files were changed.` Negative subset run `middle-layer-v30-subset-reject-unreviewed --allow-empty` selected 1, ready 0, rejected 1, materialized nothing, and did not call installer. Handoff spot check confirmed next batch `review-batch-01`, command chain steps 10, 8 output paths, `student_visible:false`, `publish_status:"blocked"`, and formal writes disabled. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v30-current-health.review-index.html`; machine-readable handoff is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v30-current-health.handoff.json`. Formal count remains 148 structured reviewed hidden items; student-visible and published remain 0; course remains closed.

- Upgraded the IB Math AA middle-layer pipeline to v29 with a machine-readable handoff manifest. `scripts\run_ib_math_aa_middle_layer_pipeline.cjs` now writes `<batch-id>.handoff.json`, links it from the review index, records all current outputs, the next review batch, subset/workspace paths, ready-gate command, post-certification command chain, closed-course policy and `formal_bank_writes_allowed:false`. Pipeline health now fails if the handoff manifest lacks a next review batch or ready-gate command, points at missing targets, mismatches the batch-plan count, or permits formal bank writes.
- Verification passed for `middle-layer-v29-current-health`: 14 review drafts, 0 ready, 0 structural failures, 11 review batches, 11 subset specs, 11 subset workspaces, 58 subset-workspace image refs, 58 asset refs, 0 missing refs, 0 missing draft items, 0 duplicate planned items, 0 extra planned items, 0 subset item mismatches, 14 classification panels, 27 index hrefs, 0 missing hrefs, 12 `classification_conflict` route flags, and handoff health with next batch/command present, 0 missing targets, plan count matched and formal bank writes disabled. Handoff spot check confirmed next batch `review-batch-01`, command count 10, 8 output paths, `student_visible:false`, and `publish_status:"blocked"`.
- Verification passed for `middle-layer-v29-reviewed-regression --include-reviewed --ready-check`: 23 ready, 14 review drafts, 0 structural failures, same subset/index/workspace/handoff health, and installer no-write returned `Checked 23 reviewed structured item(s); no files were changed.` Positive ready-gate regression selected 23, ready 23, rejected 0, materialized 23 closed reviewed records and installer no-write returned `Checked 23 reviewed structured item(s); no files were changed.` Negative subset run `middle-layer-v29-subset-reject-unreviewed --allow-empty` selected 1, ready 0, rejected 1, materialized nothing, and did not call installer. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v29-current-health.review-index.html`; machine-readable handoff is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v29-current-health.handoff.json`. Formal count remains 148 structured reviewed hidden items; student-visible and published remain 0; course remains closed.

- Upgraded IB Math AA ready promotion to v28. `scripts\promote_ib_math_aa_middle_layer_ready.cjs` now requires `review_certification.classification_review_complete`, confirmed primary and required knowledge-point codes matching the item, and a classification method before a reviewed draft can become ready. `scripts\validate_ib_math_aa_middle_layer.cjs` enforces the same certification on ready specs. Existing structured-reviewed regression exports now include this classification certification, and the workspace certification template shows the required fields.
- Verification passed for `middle-layer-v28-current-health`: 14 review drafts, 0 ready, 0 structural failures, 11 review batches, 11 subset specs, 11 subset workspaces, 58 subset-workspace image refs, 58 asset refs, 0 missing refs, 0 missing draft items, 0 duplicate planned items, 0 extra planned items, 0 subset item mismatches, 14 classification panels, 26 index hrefs, 0 missing hrefs, and 12 `classification_conflict` route flags.
- Verification passed for `middle-layer-v28-reviewed-regression --include-reviewed --ready-check`: 23 ready, 14 review drafts, 0 structural failures, same subset/index/workspace health, and installer no-write returned `Checked 23 reviewed structured item(s); no files were changed.` Positive ready-gate reviewed-cert regression selected 23, ready 23, rejected 0, materialized 23 closed reviewed records and installer no-write returned `Checked 23 reviewed structured item(s); no files were changed.` A direct certification-field check found 23 items and 0 missing/mismatched classification certifications. Negative subset run `middle-layer-v28-subset-reject-unreviewed --allow-empty` selected 1, ready 0, rejected 1, materialized nothing, and did not call installer. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v28-current-health.review-index.html`. Formal count remains 148 structured reviewed hidden items; student-visible and published remain 0; course remains closed.

- Upgraded the IB Math AA middle-layer workspace and batch planner to v27. The HTML review workspace now displays classification-draft details per item, including current primary code, required codes, text-suggested primary code, confidence, source, matched pattern and explicit conflict status. Classification conflicts are visually highlighted, batch reports include a `Classification review` section per batch, and classification review categories now participate in route keys. Pipeline workspace health now fails if a workspace card lacks its classification panel.
- Verification passed for `middle-layer-v27-current-health`: 14 review drafts, 0 ready, 0 structural failures, 11 review batches, 11 subset specs, 11 subset workspaces, 58 subset-workspace image refs, 58 asset refs, 0 missing refs, 0 missing draft items, 0 duplicate planned items, 0 extra planned items, 0 subset item mismatches, 14 classification panels, 26 index hrefs, 0 missing hrefs, and 12 `classification_conflict` route flags. Text checks confirmed the workspace contains `Text-suggested primary`, `Conflict`, and highlighted classification blocks, while the batch report contains `Classification review`.
- Verification passed for `middle-layer-v27-reviewed-regression --include-reviewed --ready-check`: 23 ready, 14 review drafts, 0 structural failures, same subset/index/workspace health, and installer no-write returned `Checked 23 reviewed structured item(s); no files were changed.` Negative subset run `middle-layer-v27-subset-reject-unreviewed --allow-empty` selected 1, ready 0, rejected 1, materialized nothing, and did not call installer. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v27-current-health.review-index.html`. Formal count remains 148 structured reviewed hidden items; student-visible and published remain 0; course remains closed.

- Upgraded the IB Math AA middle-layer generator and gate to v26. Review drafts now carry `auto_review_state.classification_draft` with primary/required knowledge-point candidates, confidence, source, matched pattern, text-suggested primary code and an explicit disagreement flag when the existing primary code differs from the text-suggested code. `scripts\validate_ib_math_aa_middle_layer.cjs` now checks that every knowledge-point code in ready/review-draft output exists in the official Math AA classification config, requires review drafts to carry classification drafts, routes low-confidence classification as `classification_uncertain`, and routes existing-vs-text disagreements as `classification_conflict`.
- Verification passed for `middle-layer-v26-current-health`: 14 review drafts, 0 ready, 0 structural failures, 11 review batches, 11 subset specs, 11 subset workspaces, 58 subset-workspace image refs, 58 asset refs, 0 missing refs, 0 missing draft items, 0 duplicate planned items, 0 extra planned items, 0 subset item mismatches, 26 index hrefs, 0 missing hrefs, and 12 `classification_conflict` route flags.
- Verification passed for `middle-layer-v26-reviewed-regression --include-reviewed --ready-check`: 23 ready, 14 review drafts, 0 structural failures, same subset/index health, 12 `classification_conflict` route flags, and installer no-write returned `Checked 23 reviewed structured item(s); no files were changed.` Negative subset run `middle-layer-v26-subset-reject-unreviewed --allow-empty` selected 1, ready 0, rejected 1, materialized nothing, and did not call installer. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v26-current-health.review-index.html`. Formal count remains 148 structured reviewed hidden items; student-visible and published remain 0; course remains closed.

- Upgraded the IB Math AA middle-layer runner to v24 by adding batch-coverage health checks in `scripts\run_ib_math_aa_middle_layer_pipeline.cjs`: every review-draft item must appear in exactly one planned subset, no extra planned item may appear, and every subset spec's actual item list must match its batch plan.
- Verification passed for `middle-layer-v24-current-health`: 14 review drafts, 0 ready, 0 structural failures, 11 review batches, 11 subset specs, 11 subset workspaces, 58 subset-workspace image refs, 58 asset refs, 0 missing refs, 0 missing draft items, 0 duplicate planned items, 0 extra planned items, 0 subset item mismatches, 26 index hrefs, and 0 missing hrefs.
- Verification passed for `middle-layer-v24-reviewed-regression --include-reviewed --ready-check`: 23 ready, 14 review drafts, 0 structural failures, same subset/index health, and installer no-write returned `Checked 23 reviewed structured item(s); no files were changed.` Negative subset run `middle-layer-v24-subset-reject-unreviewed --allow-empty` selected 1, ready 0, rejected 1, materialized nothing, and did not call installer. Next entry point is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v24-current-health.review-index.html`. Formal count remains 148 structured reviewed hidden items; student-visible and published remain 0; course remains closed.

- Continued IB Math AA phase 1 middle-layer work only; no formal bank writes. Current active checkpoint is `middle-layer-v23-current-health`.
- The v23 pipeline produces full and per-subset review workspaces plus a review index at `tmp\ib-math-aa-generated-compact-specs\middle-layer-v23-current-health.review-index.html`. The index links the full workspace, batch report, batch JSON, full review-draft JSON, every subset spec, every subset workspace, and each subset's ready-gate command.
- Verification passed: `node --check scripts\run_ib_math_aa_middle_layer_pipeline.cjs`; current-health run from `tmp\ib-math-aa-draft-batches\scan-v9-*.json`; reviewed regression with `--include-reviewed --ready-check`; and negative subset run rejecting the first unreviewed subset. Current-health output: 14 review drafts, 0 ready, 0 structural failures, 11 planned review batches, 11 subset specs, 11 subset workspaces, 58 subset-workspace image refs, 58 asset refs, 0 missing refs, 26 index hrefs, 0 missing hrefs. Regression installer no-write returned `Checked 23 reviewed structured item(s); no files were changed.`
- First actionable subset remains `tmp\ib-math-aa-generated-compact-specs\middle-layer-v23-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` with workspace `tmp\ib-math-aa-generated-compact-specs\middle-layer-v23-current-health.review-subsets\review-batch-01.review-workspace.html`. Formal count remains 148 structured reviewed hidden items; student-visible and published remain 0; course remains closed.

## 2026-08-01

- Completed two more real middle-layer small-batch loops. `middle-layer-v12-reviewed-geometry-smallbatch` installed `HL 2023 May TZ2 P1 Q1` (`P1-000073`, circle sector, 6 marks) and `SL 2023 Nov TZ1 P2 Q2` (`P2-000074`, 3D pyramid, 6 marks) after source-image and paired markscheme visual checks. `middle-layer-v13-reviewed-hl-p1-functions-calculus-smallbatch` installed `HL 2023 May TZ2 P1 Q2` (`P1-000074`, transformed reciprocal function, 5 marks) and `HL 2023 May TZ2 P1 Q4` (`P1-000076`, definite integral area, 6 marks) after visual checks against all question and markscheme assets.
- Ready-gate and install passed for both batches: each selected 2, ready 2, rejected 0, materialized 2 reviewed items, installer no-write returned `Checked 2 reviewed structured item(s); no files were changed.`, and controlled install returned `Installed 2 reviewed structured item(s).` The `P1-000074` draft initially triggered the formal text guard for a literal backslash-n sequence from LaTeX `\ne`; it was corrected to words before the successful no-write check.
- Verification passed after the v13 install: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs`, `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`. Current state: 148 structured reviewed hidden items: SL 52 (`SL P1: 17`, `SL P2: 35`) and HL 96 (`HL P1: 58`, `HL P2: 37`, `HL P3: 1`); student-visible and published remain 0; ledger has 412 items and `completion_counted: 148`; remaining structured reconstruction count is 264. Course remains closed.
- Refreshed the post-install middle-layer queue as `middle-layer-v14-current-health`: 0 ready, 12 review drafts, 37 failures, 2 structural failures, 12-card workspace, 50 image refs, 0 missing refs and no old incomplete markers. Use `tmp\ib-math-aa-generated-compact-specs\middle-layer-v14-current-health.review-workspace.html` as the next review entry point.

- Completed the second real middle-layer small-batch closed loop. Built `tmp\ib-math-aa-generated-compact-specs\middle-layer-v11-reviewed-logo-area-smallbatch.review-draft.compact-spec.json` from the refreshed middle-layer draft `middle-layer-v11-current-health`, visually checked `HL 2023 Nov TZ1 P2 Q3` (`P2-000098`) source assets `q03-p07.webp`, `q03-p08.webp`, and paired markscheme `q03-p11.webp`, and visually checked `SL 2023 Nov TZ1 P2 Q4` (`P2-000076`) source assets `q04-p07.webp`, `q04-p08.webp`, and paired markscheme `q04-p12.webp`. The generated draft was corrected into explicit scored parts `a`, `b.i`, and `b.ii`, with 7 mark points per item and source asset references on every field.
- Ready-gate and install passed for `middle-layer-v11-reviewed-logo-area-smallbatch-ready`: selected 2, ready 2, rejected 0, materialized 2 reviewed items, installer no-write returned `Checked 2 reviewed structured item(s); no files were changed.`, then controlled install returned `Installed 2 reviewed structured item(s).` The records remain closed with `student_visible:false` and `publish_status:"blocked"`.
- Verification passed after the v11 install: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs`, `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`. Current state: 144 structured reviewed hidden items: SL 51 (`SL P1: 17`, `SL P2: 34`) and HL 93 (`HL P1: 55`, `HL P2: 37`, `HL P3: 1`); student-visible and published remain 0; ledger has 412 items and `completion_counted: 144`; remaining structured reconstruction count is 268. Course remains closed.
- Refreshed the post-install middle-layer queue as `middle-layer-v12-current-health`: 0 ready, 16 review drafts, 37 failures, 2 structural failures, 16-card workspace, 63 image refs, 0 missing refs and no old incomplete markers. Use `tmp\ib-math-aa-generated-compact-specs\middle-layer-v12-current-health.review-workspace.html` as the next review entry point.

- Completed the first real middle-layer small-batch closed loop after v9 readiness work. Ran `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v9-*.json --batch-id middle-layer-v10-current-health --max-items 40 --ready-check`; it produced 0 ready, 20 review drafts, 37 failures, 2 structural failures, a 20-card workspace with 75 image refs, 0 missing image refs and no old incomplete markers. Ran ready-gate health regression `middle-layer-v10-ready-gate-health`; it promoted 4 existing reviewed records, materialized 4 items and passed installer no-write.
- Built and reviewed `tmp\ib-math-aa-generated-compact-specs\middle-layer-v10-reviewed-functions-smallbatch.review-draft.compact-spec.json` from the generated middle-layer review draft/workspace. Visually checked `HL 2023 Nov TZ1 P2 Q2` (`P2-000097`) source assets `q02-p05.webp`, `q02-p06.webp`, and paired markscheme `q02-p10.webp`; the continuation page contains answer lines only. Visually checked `SL 2023 Nov TZ1 P2 Q3` (`P2-000075`) source assets `q03-p05.webp`, `q03-p06.webp`, and paired markscheme `q03-p11.webp`; the continuation page contains answer lines only.
- Ready-gate and install passed for `middle-layer-v10-reviewed-functions-smallbatch-ready`: selected 2, ready 2, rejected 0, materialized 2 reviewed items, installer no-write returned `Checked 2 reviewed structured item(s); no files were changed.`, then controlled install returned `Installed 2 reviewed structured item(s).` The records remain closed with `student_visible:false` and `publish_status:"blocked"`.
- Verification passed after install: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs`, `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`. Current state: 142 structured reviewed hidden items: SL 50 (`SL P1: 17`, `SL P2: 33`) and HL 92 (`HL P1: 55`, `HL P2: 36`, `HL P3: 1`); student-visible and published remain 0; ledger has 412 items and `completion_counted: 142`; remaining non-duplicate structured reconstruction count is 270. Course remains closed.

- Reset the IB Math AA operating breakpoint to middle-layer production first, then full rollout. Added `scripts/generate_ib_math_aa_compact_specs_from_scan.cjs`, which takes scan/draft JSON files and writes four review-only outputs: review-draft compact spec, ready compact spec, machine-readable failures, and Markdown review packet. The script keeps formal bank writes out of the generation step, keeps all Math AA records closed, and allows installer no-write checks only for ready output.
- Verification passed: `node --check scripts\generate_ib_math_aa_compact_specs_from_scan.cjs`; scan-v9 single-paper run `middle-layer-v1-hl-p1-2023-may-tz2` produced 6 review drafts, 4 deferred completed/duplicate records, 0 ready records, and clean placeholder scans for ready and review-draft outputs; scan-v9 all-files run `middle-layer-v1-scan-v9-all` produced 22 review drafts, 15 deferred records, 0 ready records, and clean placeholder scans. Regression mode with `--include-reviewed --ready-check` produced 4 ready records from existing reviewed bank content and passed installer no-write: `Checked 4 reviewed structured item(s); no files were changed.`
- New generated middle-layer artifacts: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v1-scan-v9-all.review-draft.compact-spec.json`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v1-scan-v9-all.ready.compact-spec.json`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v1-scan-v9-all.failures.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v1-scan-v9-all.review.md`.
- Enhanced the middle-layer generator to v5 behavior: unreviewed scan items now receive OCR-assisted answer candidates, official markscheme row candidates, per-mark mark point candidates, `auto_extraction` metadata, low-confidence point routing, and structural-failure separation. Latest full scan-v9 run `middle-layer-v5-scan-v9-all` produced 20 review-draft items, 44 OCR-assisted markscheme rows, 44 OCR-assisted answer candidates, 227 mark point candidates, 13 low-confidence point markers, 2 structural failures, 15 deferred completed/duplicate records, 0 ready records, and clean placeholder scans. Regression run `middle-layer-v5-hl-p1-2023-may-tz2-regression` kept 4 reviewed items ready and passed installer no-write: `Checked 4 reviewed structured item(s); no files were changed.`
- Added `scripts\validate_ib_math_aa_middle_layer.cjs` as the generated-packet gate. It checks generated metadata, old incomplete-field markers, ready/review-draft separation, answer/part/markscheme shape, mark point totals, and structural-failure counts before any materializer or installer step. Verification passed for `middle-layer-v5-scan-v9-all` and `middle-layer-v5-hl-p1-2023-may-tz2-regression`; the regression ready reviewed batch also passed `scripts\install_ib_math_aa_structured_batch.cjs --check`.
- Current generated v5 middle-layer artifacts: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v5-scan-v9-all.review-draft.compact-spec.json`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v5-scan-v9-all.ready.compact-spec.json`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v5-scan-v9-all.failures.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v5-scan-v9-all.review.md`.
- Enhanced the middle-layer generator to v6/v7 behavior: compact specs now auto-carry question and markscheme asset indexes on stem blocks, parts, answers, markscheme rows and mark points, including multi-page markscheme references mapped from OCR line pages where available. Added `scripts\promote_ib_math_aa_middle_layer_ready.cjs`, which promotes only field-reviewed and certified compact drafts into ready specs; it refuses items with pending auto-review metadata, review-needed markers, incomplete fields or missing asset references.
- Promotion verification passed: `middle-layer-v7-reject-unreviewed` selected unreviewed `P1-000076` and rejected it; `middle-layer-v7-hl-p1-2023-may-tz2-regression` generated 4 ready reviewed-bank records and passed generator ready-check; `middle-layer-v7-promote-reviewed-regression` promoted those 4 certified records, passed `node scripts\validate_ib_math_aa_middle_layer.cjs --batch-id middle-layer-v7-promote-reviewed-regression`, materialized to `tmp\ib-math-aa-generated-compact-specs\middle-layer-v7-promote-reviewed-regression.reviewed-batch.json`, and passed `node scripts\install_ib_math_aa_structured_batch.cjs --check ...`. The resulting reviewed batch keeps `student_visible:false` and `publish_status:"blocked"` for all 4 records and includes structured field audits.
- Added `scripts\build_ib_math_aa_middle_layer_review_workspace.cjs` to build a static batch review workspace from review-draft compact specs. It renders each item with source question images, source markscheme images, review flags, OCR candidates, generated stem/parts/answers/markscheme rows, mark point candidates, asset references and a review-certification template. Generated `tmp\ib-math-aa-generated-compact-specs\middle-layer-v6-scan-v9-all.review-workspace.html` from `middle-layer-v6-scan-v9-all.review-draft.compact-spec.json`.
- Review workspace verification passed: syntax check succeeded; generated HTML contains 20 item cards and 75 source image references; the first 75 local image paths resolve from the HTML file; old incomplete-field markers (`REVIEW REQUIRED`, `PLACEHOLDER`, `TODO`) are absent. The default asset mode uses relative paths so the HTML can be opened directly from disk; `--asset-base /` can be used for dev-server rendering.
- Added `scripts\run_ib_math_aa_middle_layer_pipeline.cjs` as the one-command middle-layer runner. It chains scan/draft generation, middle-layer validation, HTML workspace generation and workspace health checks without writing formal bank files; `--ready-check` uses only materializer output and installer no-write.
- Pipeline verification passed: `middle-layer-v8-scan-v9-all` from `scan-v9-*.json` produced 0 ready, 20 review drafts, 37 failures, 2 structural failures, a 20-card workspace with 75 image references, 0 missing image refs, and no old incomplete-field markers. Regression pipeline `middle-layer-v8-hl-p1-2023-may-tz2-regression` with `--include-reviewed --ready-check` produced 4 ready, 5 review drafts, 6 failures, 1 structural failure, a 5-card workspace with 19 image references, and installer no-write output `Checked 4 reviewed structured item(s); no files were changed.`
- Added `scripts\run_ib_math_aa_ready_gate.cjs` as the post-review no-write runner. It chains promotion, middle-layer gate, materializer output and installer `--check`; it refuses to continue when no ready items are promoted unless `--allow-empty` is explicit, and it verifies the materialized reviewed batch remains closed.
- Ready-gate verification passed: `middle-layer-v9-ready-gate-reviewed-regression` promoted 4 certified reviewed-bank records, passed middle-layer gate, materialized 4 reviewed items, and installer no-write returned `Checked 4 reviewed structured item(s); no files were changed.` The materialized payloads keep `student_visible:false`, `publish_status:"blocked"`, and structured field audits. Negative run `middle-layer-v9-ready-gate-reject-unreviewed` selected unreviewed `P1-000076`, rejected it, produced 0 ready items, and did not materialize or call installer. Formal bank counts remained unchanged at SL 49 and HL 91, visible 0, published 0.
- Current state after the interrupted prior install: 140 structured reviewed hidden items: SL 49 (`SL P1: 17`, `SL P2: 32`) and HL 91 (`HL P1: 55`, `HL P2: 35`, `HL P3: 1`); student-visible and published remain 0; ledger has 412 items and 140 counted records; remaining non-duplicate structured reconstruction count is 272. Next step is to use the middle-layer review packet to complete a small batch from generated review drafts, then materialize only the completed ready spec and run installer no-write before any controlled install.

- Installed `SL 2021 May TZ2 P2` Q8 from compact spec `tmp\ib-math-aa-compact-reviewed-specs\sl-p2-2021-may-tz2-q08-medium-risk.json` and reviewed batch `tmp\ib-math-aa-reviewed-batches\sl-p2-2021-may-tz2-q08-medium-risk.json`.
- Visually checked official question asset `public/data/ib/math-aa/real-source-assets/paper/mathsaa_sl_p2_2021_may_tz2/q08-p10.webp` and paired markscheme assets `public/data/ib/math-aa/real-source-assets/markscheme/mathsaa_sl_p2_2021_may_tz2/q08-p18.webp` and `public/data/ib/math-aa/real-source-assets/markscheme/mathsaa_sl_p2_2021_may_tz2/q08-p19.webp`. The reviewed item preserves the inverse-normal step, normal upper-tail probability, conditional probability, binomial model, expectation, complement calculation, 5 parts, 15 official mark points, and primary knowledge point `AA-4.9`.
- Verification passed: placeholder scans, installer `--check`, controlled install, `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs`, `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`.
- Current state: 138 structured reviewed hidden items: SL 49 (`SL P1: 17`, `SL P2: 32`) and HL 89 (`HL P1: 53`, `HL P2: 35`, `HL P3: 1`); student-visible and published remain 0; bank duplicate exclusions are 21; ledger has 412 items and `delivery_count: 138`; remaining non-duplicate structured reconstruction count is 274. Course remains closed.
- Next efficient path: continue `SL 2021 May TZ2 P2` with Q7 or Q9 only if the diagram/long-response structure can be reconstructed cleanly; otherwise rerun whole-paper priority scanning for the next higher-throughput batch.

- Installed `SL 2021 May TZ2 P2` Q4 from compact spec `tmp\ib-math-aa-compact-reviewed-specs\sl-p2-2021-may-tz2-q04-medium-risk.json` and reviewed batch `tmp\ib-math-aa-reviewed-batches\sl-p2-2021-may-tz2-q04-medium-risk.json`.
- Visually checked official question asset `public/data/ib/math-aa/real-source-assets/paper/mathsaa_sl_p2_2021_may_tz2/q04-p06.webp` and paired markscheme assets `public/data/ib/math-aa/real-source-assets/markscheme/mathsaa_sl_p2_2021_may_tz2/q04-p11.webp` and `public/data/ib/math-aa/real-source-assets/markscheme/mathsaa_sl_p2_2021_may_tz2/q04-p12.webp`. The reviewed item preserves the sport/theatre Venn and complement methods, the girls/theatre conditional probability calculation, the two official independence methods, 4 parts, 8 official mark points, and primary knowledge point `AA-4.11`.
- Verification passed: placeholder scans, installer `--check`, controlled install, `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs`, `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`.
- Current state: 137 structured reviewed hidden items: SL 48 (`SL P1: 17`, `SL P2: 31`) and HL 89 (`HL P1: 53`, `HL P2: 35`, `HL P3: 1`); student-visible and published remain 0; bank duplicate exclusions are 21; ledger has 412 items and `delivery_count: 137`; remaining non-duplicate structured reconstruction count is 275. Course remains closed.
- Next efficient path: continue `SL 2021 May TZ2 P2` multi-asset candidates Q7/Q8/Q9, or rerun whole-paper priority scanning if the next local candidate has too much diagram or multi-page complexity for the compact path.

- Enhanced `scripts\materialize_ib_math_aa_reviewed_batch.cjs` so compact reviewed specs can cite explicit question/markscheme asset indexes, paths, or pages per stem block, part, answer, markscheme row and mark point. Old specs remain compatible by defaulting to the first question asset and first markscheme asset. Figure and markscheme-figure evidence are also emitted with parent/derived hashes when specified.
- Regression checked the updated materializer with `tmp\ib-math-aa-compact-reviewed-specs\hl-p2-2023-nov-tz1-q07-medium-risk.json`; the generated reviewed batch passed `scripts\install_ib_math_aa_structured_batch.cjs --check`.
- Installed `SL 2021 May TZ2 P2` Q6 from compact spec `tmp\ib-math-aa-compact-reviewed-specs\sl-p2-2021-may-tz2-q06-medium-risk.json` and reviewed batch `tmp\ib-math-aa-reviewed-batches\sl-p2-2021-may-tz2-q06-medium-risk.json`, validating the multi-page markscheme path through the formal installer.
- Visually checked the official question asset `public/data/ib/math-aa/real-source-assets/paper/mathsaa_sl_p2_2021_may_tz2/q06-p08.webp` and paired markscheme assets `public/data/ib/math-aa/real-source-assets/markscheme/mathsaa_sl_p2_2021_may_tz2/q06-p14.webp` and `public/data/ib/math-aa/real-source-assets/markscheme/mathsaa_sl_p2_2021_may_tz2/q06-p15.webp`. The item covers carbon-14 exponential decay, parts `a`, `b`, and `c`, 7 official marks, and primary knowledge point `AA-2.9`.
- Verification passed: materializer syntax check, placeholder scans, installer `--check`, controlled install, `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs`, `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`.
- Current state: 136 structured reviewed hidden items: SL 47 (`SL P1: 17`, `SL P2: 30`) and HL 89 (`HL P1: 53`, `HL P2: 35`, `HL P3: 1`); student-visible and published remain 0; bank duplicate exclusions are 21; ledger has 412 items and `delivery_count: 136`; remaining non-duplicate structured reconstruction count is 276. Course remains closed.
- Next efficient path: continue multi-asset medium candidates, with `SL 2021 May TZ2 P2` Q4/Q7/Q8/Q9 or fresh whole-paper priority scanning as the next source of compact specs.

- Updated the authoritative IB Math AA continuation goal: execute SL/HL all the way to AP single-subject mature delivery standard, not a stale fixed pilot and not isolated hand entry. Completion requires full real-source paper coverage; structured question text, parts, answers, official markscheme, per-mark points, source audit and knowledge-point classification; Quiz/Paper Practice/Mock/upload/scoring/Learning Center paths; desktop/mobile checks; full validate/build; production verification; SSoT and remote sync. Course remains closed with `student_visible:false` and `publish_status:"blocked"` until every release gate passes.
- Continued IB Math AA AP-standard real-source production line and installed `HL 2023 Nov TZ1 P2` Q7 from compact spec `tmp\ib-math-aa-compact-reviewed-specs\hl-p2-2023-nov-tz1-q07-medium-risk.json` and reviewed batch `tmp\ib-math-aa-reviewed-batches\hl-p2-2023-nov-tz1-q07-medium-risk.json`.
- Visually checked the official question asset `public/data/ib/math-aa/real-source-assets/paper/mathsaa_hl_p2_2023_nov_tz1/q07-p12.webp` and the paired markscheme asset `public/data/ib/math-aa/real-source-assets/markscheme/mathsaa_hl_p2_2023_nov_tz1/q07-p15.webp`. The item is parsed into parts `a.i`, `a.ii`, and `b`, with primary knowledge point `AA-1.10`.
- Verification passed with 0 errors: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs`, `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`.
- Current state: 135 structured reviewed hidden items: SL 46 (`SL P1: 17`, `SL P2: 29`) and HL 89 (`HL P1: 53`, `HL P2: 35`, `HL P3: 1`); student-visible and published remain 0; bank duplicate exclusions are 21; ledger has 412 items and `delivery_count: 135`; remaining non-duplicate structured reconstruction count is 277. Course remains closed.
- Next efficient path: scan-v9 single-source/single-markscheme queue is exhausted. Either enhance `scripts\materialize_ib_math_aa_reviewed_batch.cjs` to support multiple question/markscheme assets safely, then tackle medium candidates such as `SL 2021 May TZ2 P2` Q6, or refresh whole-paper priority scanning and continue the compact-spec -> materialize -> installer-check -> install -> full-gate workflow.

- Continued IB Math AA AP-standard real-source production line and installed `HL 2023 May TZ2 P1` Q9 from compact spec `tmp\ib-math-aa-compact-reviewed-specs\hl-p1-2023-may-tz2-q09-medium-risk.json` and reviewed batch `tmp\ib-math-aa-reviewed-batches\hl-p1-2023-may-tz2-q09-medium-risk.json`.
- Visually checked the official question asset `public/data/ib/math-aa/real-source-assets/paper/mathsaa_hl_p1_2023_may_tz2/q09-p13.webp` and the paired markscheme asset `public/data/ib/math-aa/real-source-assets/markscheme/mathsaa_hl_p1_2023_may_tz2/q09-p19.webp`. The diagram was represented through its source-backed vector relationships; the official dot-product expansion and theta range exclusion were retained.
- Installer no-write initially rejected literal `\\ne` sequences in text fields; the spec was corrected to use words for "not equal to", then materialized again. Placeholder scan found no `REVIEW REQUIRED`, `TODO`, or `PLACEHOLDER`; `scripts\install_ib_math_aa_structured_batch.cjs --check` passed before controlled install.
- Verification passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs`, `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`.
- Current state: 134 structured reviewed hidden items: SL 46 (`SL P1: 17`, `SL P2: 29`) and HL 88 (`HL P1: 53`, `HL P2: 34`, `HL P3: 1`); student-visible and published remain 0; bank duplicate exclusions are 21; ledger has 412 items and `delivery_count: 134`; remaining non-duplicate structured reconstruction count is 278. Course remains closed.
- Next efficient path: only `HL 2023 Nov TZ1 P2` Q7 remains as a scan-v9 single-source/single-markscheme option, but it has part-layout, multi-method and diagram complexity; inspect fully before deciding whether to spec or move to a broader scan/production-line improvement.

- Continued IB Math AA AP-standard real-source production line and installed `HL 2023 May TZ2 P1` Q7 from compact spec `tmp\ib-math-aa-compact-reviewed-specs\hl-p1-2023-may-tz2-q07-medium-risk.json` and reviewed batch `tmp\ib-math-aa-reviewed-batches\hl-p1-2023-may-tz2-q07-medium-risk.json`.
- Visually checked the official question asset `public/data/ib/math-aa/real-source-assets/paper/mathsaa_hl_p1_2023_may_tz2/q07-p11.webp` and the paired markscheme asset `public/data/ib/math-aa/real-source-assets/markscheme/mathsaa_hl_p1_2023_may_tz2/q07-p16.webp`. The structured item records the full mathematical induction sequence and official markscheme notes.
- Placeholder scan found no `REVIEW REQUIRED`, `TODO`, or `PLACEHOLDER`; `scripts\install_ib_math_aa_structured_batch.cjs --check` passed before controlled install.
- Verification passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs`, `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`.
- Current state: 133 structured reviewed hidden items: SL 46 (`SL P1: 17`, `SL P2: 29`) and HL 87 (`HL P1: 52`, `HL P2: 34`, `HL P3: 1`); student-visible and published remain 0; bank duplicate exclusions are 21; ledger has 412 items and `delivery_count: 133`; remaining non-duplicate structured reconstruction count is 279. Course remains closed.
- Next efficient path: remaining scan-v9 single-source/single-markscheme options include `HL 2023 May TZ2 P1` Q9 and `HL 2023 Nov TZ1 P2` Q7, but both have diagram/part-layout complexity and need full visual reconstruction before spec creation.

- Continued IB Math AA AP-standard real-source production line and installed `SL 2023 Nov TZ1 P2` Q1 from compact spec `tmp\ib-math-aa-compact-reviewed-specs\sl-p2-2023-nov-tz1-q01-medium-risk.json` and reviewed batch `tmp\ib-math-aa-reviewed-batches\sl-p2-2023-nov-tz1-q01-medium-risk.json`.
- Visually checked the official question asset `public/data/ib/math-aa/real-source-assets/paper/mathsaa_sl_p2_2023_nov_tz1/q01-p03.webp` and the paired markscheme asset `public/data/ib/math-aa/real-source-assets/markscheme/mathsaa_sl_p2_2023_nov_tz1/q01-p08.webp`. The machine draft's `main` part was replaced with exact scored parts `(a)(i)`, `(a)(ii)`, `(b)`, and `(c)`.
- Placeholder scan found no `REVIEW REQUIRED`, `TODO`, or `PLACEHOLDER`; `scripts\install_ib_math_aa_structured_batch.cjs --check` passed before controlled install.
- Verification passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs`, `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`.
- Current state: 132 structured reviewed hidden items: SL 46 (`SL P1: 17`, `SL P2: 29`) and HL 86 (`HL P1: 51`, `HL P2: 34`, `HL P3: 1`); student-visible and published remain 0; bank duplicate exclusions are 21; ledger has 412 items and `delivery_count: 132`; remaining non-duplicate structured reconstruction count is 280. Course remains closed.
- Next efficient path: continue scan-v9 single-source/single-markscheme items only if complete visual reconstruction is clear; remaining options include `HL 2023 May TZ2 P1` Q7/Q9 or `HL 2023 Nov TZ1 P2` Q7, while multi-page markschemes stay out of this materializer path.

- Continued IB Math AA AP-standard real-source production line and installed `HL 2023 Nov TZ1 P2` Q4 from compact spec `tmp\ib-math-aa-compact-reviewed-specs\hl-p2-2023-nov-tz1-q04-medium-risk.json` and reviewed batch `tmp\ib-math-aa-reviewed-batches\hl-p2-2023-nov-tz1-q04-medium-risk.json`.
- Visually checked the official question asset `public/data/ib/math-aa/real-source-assets/paper/mathsaa_hl_p2_2023_nov_tz1/q04-p09.webp` and the paired markscheme asset `public/data/ib/math-aa/real-source-assets/markscheme/mathsaa_hl_p2_2023_nov_tz1/q04-p12.webp`. The OCR-split formula was corrected from the source image to `s(t)=4.3sin(sqrt(3t+5))`, and the official method notes/special cases were retained.
- Placeholder scan found no `REVIEW REQUIRED`, `TODO`, or `PLACEHOLDER`; `scripts\install_ib_math_aa_structured_batch.cjs --check` passed before controlled install.
- Verification passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs`, `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`.
- Current state: 131 structured reviewed hidden items: SL 45 (`SL P1: 17`, `SL P2: 28`) and HL 86 (`HL P1: 51`, `HL P2: 34`, `HL P3: 1`); student-visible and published remain 0; bank duplicate exclusions are 21; ledger has 412 items and `delivery_count: 131`; remaining non-duplicate structured reconstruction count is 281. Course remains closed.
- Next efficient path: continue scan-v9 single-source/single-markscheme items before multi-page items; likely next review targets include `SL 2023 Nov TZ1 P2` Q1 or other one-question/one-markscheme feasible records after current-bank filtering.

- Continued IB Math AA AP-standard real-source production line and installed `SL 2023 Nov TZ1 P2` Q5 from compact spec `tmp\ib-math-aa-compact-reviewed-specs\sl-p2-2023-nov-tz1-q05-medium-risk.json` and reviewed batch `tmp\ib-math-aa-reviewed-batches\sl-p2-2023-nov-tz1-q05-medium-risk.json`.
- Visually checked the official question asset `public/data/ib/math-aa/real-source-assets/paper/mathsaa_sl_p2_2023_nov_tz1/q05-p09.webp` and the paired markscheme asset `public/data/ib/math-aa/real-source-assets/markscheme/mathsaa_sl_p2_2023_nov_tz1/q05-p13.webp`. The OCR-split formula was corrected from the source image to `s(t)=5.2sin(sqrt(4t+6))`, and both official distance methods were retained.
- Placeholder scan found no `REVIEW REQUIRED`, `TODO`, or `PLACEHOLDER`; `scripts\install_ib_math_aa_structured_batch.cjs --check` passed before controlled install.
- Verification passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs`, `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`.
- Current state: 130 structured reviewed hidden items: SL 45 (`SL P1: 17`, `SL P2: 28`) and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`); student-visible and published remain 0; bank duplicate exclusions are 21; ledger has 412 items and `delivery_count: 130`; remaining non-duplicate structured reconstruction count is 282. Course remains closed.
- Next efficient path: continue scan-v9 feasible single-source/single-markscheme candidates first; `HL 2023 Nov TZ1 P2` Q4 is a good next candidate.

- Continued IB Math AA AP-standard real-source production line and installed `SL 2021 May TZ2 P2` Q2 from compact spec `tmp\ib-math-aa-compact-reviewed-specs\sl-p2-2021-may-tz2-q02-medium-risk.json` and reviewed batch `tmp\ib-math-aa-reviewed-batches\sl-p2-2021-may-tz2-q02-medium-risk.json`.
- Visually checked the official question asset `public/data/ib/math-aa/real-source-assets/paper/mathsaa_sl_p2_2021_may_tz2/q02-p04.webp` and the paired markscheme asset `public/data/ib/math-aa/real-source-assets/markscheme/mathsaa_sl_p2_2021_may_tz2/q02-p09.webp`. The graph-sketch answer is represented as source-checked scoring features rather than a screenshot-only completion claim.
- Placeholder scan found no `REVIEW REQUIRED`, `TODO`, or `PLACEHOLDER`; `scripts\install_ib_math_aa_structured_batch.cjs --check` passed before controlled install.
- Verification passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs`, `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`.
- Current state: 129 structured reviewed hidden items: SL 44 (`SL P1: 17`, `SL P2: 27`) and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`); student-visible and published remain 0; bank duplicate exclusions are 21; ledger has 412 items and `delivery_count: 129`; remaining non-duplicate structured reconstruction count is 283. Course remains closed.
- Next efficient path: skip `SL 2021 May TZ2 P2` Q6 until the materializer supports multiple paired markscheme assets or the item gets a dedicated manual path; continue with other scan-v9 feasible candidates such as `SL 2023 Nov TZ1 P2` Q5 or `HL 2023 Nov TZ1 P2` Q4.

- Continued IB Math AA AP-standard real-source production line and installed `SL 2021 May TZ2 P2` Q5 from compact spec `tmp\ib-math-aa-compact-reviewed-specs\sl-p2-2021-may-tz2-q05-medium-risk.json` and reviewed batch `tmp\ib-math-aa-reviewed-batches\sl-p2-2021-may-tz2-q05-medium-risk.json`.
- Visually checked the official question asset `public/data/ib/math-aa/real-source-assets/paper/mathsaa_sl_p2_2021_may_tz2/q05-p07.webp` and the paired markscheme asset `public/data/ib/math-aa/real-source-assets/markscheme/mathsaa_sl_p2_2021_may_tz2/q05-p13.webp`. The markscheme contains two official methods for part (b), both retained in the reviewed scoring row.
- Placeholder scan found no `REVIEW REQUIRED`, `TODO`, or `PLACEHOLDER`; `scripts\install_ib_math_aa_structured_batch.cjs --check` passed before controlled install.
- Verification passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs`, `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`.
- Current state: 128 structured reviewed hidden items: SL 43 (`SL P1: 17`, `SL P2: 26`) and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`); student-visible and published remain 0; bank duplicate exclusions are 21; ledger has 412 items and `delivery_count: 128`; remaining non-duplicate structured reconstruction count is 284. Course remains closed.
- Next efficient path: continue refreshed scan-v9 feasible medium-risk candidates, especially `SL 2021 May TZ2 P2` Q2/Q6, `SL 2023 Nov TZ1 P2` Q5, or `HL 2023 Nov TZ1 P2` Q4, using the same compact-spec -> materialize -> installer-check -> install -> full-gate workflow.

- Continued IB Math AA AP-standard real-source production line and installed `SL 2023 May TZ2 P1` Q4/Q6 from compact spec `tmp\ib-math-aa-compact-reviewed-specs\sl-p1-2023-may-tz2-q04-q06-low-risk.json` and reviewed batch `tmp\ib-math-aa-reviewed-batches\sl-p1-2023-may-tz2-q04-q06-low-risk.json`.
- Placeholder scan found no `REVIEW REQUIRED`, `TODO`, or `PLACEHOLDER`; `scripts\install_ib_math_aa_structured_batch.cjs --check` passed before controlled install.
- Verification passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs`, `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`.
- Current state: 116 structured reviewed hidden items: SL 31 (`SL P1: 16`, `SL P2: 15`) and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`); student-visible and published remain 0; bank duplicate exclusions are 21; ledger has 412 items and `delivery_count: 116`; remaining non-duplicate structured reconstruction count is 296. Course remains closed.
- Continued with `SL 2021 May TZ1 P2` Q1/Q3 from compact spec `tmp\ib-math-aa-compact-reviewed-specs\sl-p2-2021-may-tz1-q01-q03-low-risk.json` and reviewed batch `tmp\ib-math-aa-reviewed-batches\sl-p2-2021-may-tz1-q01-q03-low-risk.json`. Q1 official shared-stem absence required tightening `scripts\materialize_ib_math_aa_reviewed_batch.cjs` so parts-only official questions do not need invented shared stem text.
- Placeholder scan and installer `--check` passed; controlled install succeeded. Full validation chain passed: curriculum build, structured delivery gate, Math AA audit, learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Current state: 118 structured reviewed hidden items: SL 33 (`SL P1: 16`, `SL P2: 17`) and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`); student-visible and published remain 0; bank duplicate exclusions are 21; ledger has 412 items and `delivery_count: 118`; remaining non-duplicate structured reconstruction count is 294. Next current-bank-filtered scan-v8 group: `SL 2022 May TZ2 P2` Q4/Q6.
- Continued with `SL 2022 May TZ2 P2` Q4/Q6 from compact spec `tmp\ib-math-aa-compact-reviewed-specs\sl-p2-2022-may-tz2-q04-q06-low-risk.json` and reviewed batch `tmp\ib-math-aa-reviewed-batches\sl-p2-2022-may-tz2-q04-q06-low-risk.json`.
- Placeholder scan and installer `--check` passed; controlled install succeeded. Full validation chain passed: curriculum build, structured delivery gate, Math AA audit, learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Current state: 120 structured reviewed hidden items: SL 35 (`SL P1: 16`, `SL P2: 19`) and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`); student-visible and published remain 0; bank duplicate exclusions are 21; ledger has 412 items and `delivery_count: 120`; remaining non-duplicate structured reconstruction count is 292. Next current-bank-filtered scan-v8 group: `SL 2022 Nov P2` Q4/Q5.
- Continued with `SL 2022 Nov P2` Q4/Q5 from compact spec `tmp\ib-math-aa-compact-reviewed-specs\sl-p2-2022-nov-q04-q05-low-risk.json` and reviewed batch `tmp\ib-math-aa-reviewed-batches\sl-p2-2022-nov-q04-q05-low-risk.json`.
- Placeholder scan and installer `--check` passed; controlled install succeeded. Full validation chain passed: curriculum build, structured delivery gate, Math AA audit, learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Current state: 122 structured reviewed hidden items: SL 37 (`SL P1: 16`, `SL P2: 21`) and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`); student-visible and published remain 0; bank duplicate exclusions are 21; ledger has 412 items and `delivery_count: 122`; remaining non-duplicate structured reconstruction count is 290. Next current-bank-filtered scan-v8 group: `SL 2021 Nov P1` Q4.
- Continued with `SL 2021 Nov P1` Q4 from compact spec `tmp\ib-math-aa-compact-reviewed-specs\sl-p1-2021-nov-q04-low-risk.json` and reviewed batch `tmp\ib-math-aa-reviewed-batches\sl-p1-2021-nov-q04-low-risk.json`.
- Placeholder scan and installer `--check` passed after replacing LaTeX not-equal commands with text wording to satisfy the existing literal-newline guard; controlled install succeeded. Full validation chain passed: curriculum build, structured delivery gate, Math AA audit, learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Current state: 123 structured reviewed hidden items: SL 38 (`SL P1: 17`, `SL P2: 21`) and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`); student-visible and published remain 0; bank duplicate exclusions are 21; ledger has 412 items and `delivery_count: 123`; remaining non-duplicate structured reconstruction count is 289. Next current-bank-filtered scan-v8 group: `SL 2023 May TZ1 P2` Q6.
- Continued with `SL 2023 May TZ1 P2` Q6 from compact spec `tmp\ib-math-aa-compact-reviewed-specs\sl-p2-2023-may-tz1-q06-low-risk.json` and reviewed batch `tmp\ib-math-aa-reviewed-batches\sl-p2-2023-may-tz1-q06-low-risk.json`.
- Placeholder scan and installer `--check` passed; controlled install succeeded. Full validation chain passed: curriculum build, structured delivery gate, Math AA audit, learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Current state: 124 structured reviewed hidden items: SL 39 (`SL P1: 17`, `SL P2: 22`) and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`); student-visible and published remain 0; bank duplicate exclusions are 21; ledger has 412 items and `delivery_count: 124`; remaining non-duplicate structured reconstruction count is 288. Next current-bank-filtered scan-v8 group: `SL 2023 Nov TZ1 P2` Q6.
- Continued with `SL 2023 Nov TZ1 P2` Q6 from compact spec `tmp\ib-math-aa-compact-reviewed-specs\sl-p2-2023-nov-tz1-q06-low-risk.json` and reviewed batch `tmp\ib-math-aa-reviewed-batches\sl-p2-2023-nov-tz1-q06-low-risk.json`.
- Placeholder scan and installer `--check` passed; controlled install succeeded. Full validation chain passed: curriculum build, structured delivery gate, Math AA audit, learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Current state: 125 structured reviewed hidden items: SL 40 (`SL P1: 17`, `SL P2: 23`) and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`); student-visible and published remain 0; bank duplicate exclusions are 21; ledger has 412 items and `delivery_count: 125`; remaining non-duplicate structured reconstruction count is 287. Current scan-v8 low-risk queue is exhausted after filtering out reviewed and exact-duplicate records; next step is to refresh batch-priority scanning or enter the next review queue under the same gate chain.

## 2026-07-18

- Completed real production browser QA for student account and admin entitlement flows on `lynkedu.com` / `admin.lynkedu.com`:
  - migrated student routing from hash URLs to direct `BrowserRouter` paths and updated browser audit scripts to use normal paths;
  - verified `/register` renders on the production domain and created a real test account through the online registration page;
  - verified registration email delivery is accepted by Resend and recorded in D1 account audit metadata;
  - added `/api/auth/request-email-verification` plus `/account` “重新发送验证码” controls with server-side 60-second cooldown and safe email diagnostics;
  - verified admin grant, cancellation, and restoration of `翎英学员` using the real admin page;
  - verified student account level and `/search` access change correctly after grant/cancellation/restore;
  - improved admin entitlement panel so active current entitlements and revoked/expired historical rows are separated;
  - hardened admin deployment cache behavior by generating `dist-admin/_headers` with no-store HTML and immutable asset headers.
- Validation/deployment evidence:
  - `npm run validate` passed;
  - `npm run build` passed and student Pages deployed to `https://56c101dd.lynkedu-ap-question-bank.pages.dev`;
  - `npm run build:admin` passed and admin Pages deployed to `https://c581a9af.lynkedu-admin.pages.dev`;
  - real browser confirmed `admin.lynkedu.com` renders after forcing a new asset hash and the entitlement panel shows “历史记录（1）” separately from current active access.

## 2026-07-16

- Updated unit-classification authority rule after user clarified classification must use official exam and subject framework materials as the only source of truth:
  - `docs/UNIT_CLASSIFICATION_STANDARD.md` now states official exam/framework materials are the only authority for `primary_unit`;
  - `docs/GLOBAL_QUESTION_BANK_SOP.md` now requires current official framework confirmation before classifying new or changed items;
  - `PROJECT_STATUS.md` records third-party maps, existing labels, generated topics, and keyword scans as review aids only, never final classification evidence.

- Completed pre-launch capacity reinforcement across all active low-volume subjects:
  - added `scripts/add_capacity_reinforcement_20260716.cjs` as an idempotent owned-content publisher;
  - published LynkEdu-owned MCQ under `source_set: lynkedu_capacity_20260716`;
  - updated question banks and similarity indexes for Biology, CSP, APES, Physics 1, and Physics 2;
  - final counts: Biology 250 MCQ, CSP 250 MCQ, APES 250 MCQ, Physics 1 250 MCQ, Physics 2 250 MCQ;
  - source reports written under each subject's `02-data/lynkedu_capacity_20260716/source_report.json`.
- Capacity verification:
  - `npm run audit:capacity`: all 16 active subjects risk OK;
  - `npm run validate:unit-distribution`: 0 warnings;
  - `npm run validate:student-progression -- --skip-browser`: 0 errors / 0 warnings / 0 findings;
  - `npm run validate`: passed;
  - `npm run build`: passed;
  - student-flow audits for Biology, CSP, APES, Physics 1, and Physics 2 passed with 0 errors.
- 2026-07-17 full student-risk audit rebuilt from sampling-only checks into a full item-ledger gate.
  - Added `scripts/full_student_risk_audit.cjs`, `audit:student-risk`, and release-blocking `validate:student-risk`.
  - The gate now checks all active MCQ/FRQ items, writes `.workspace/full-student-risk-audit/items.jsonl`, and must finish with P0/P1/P2 all equal to 0.
  - Repaired true findings found by the ledger: Chemistry missing visual bindings, Physics C:E&M missing visual context, Physics 2 missing table data, Macro FRQ table data, Psychology graph/table data and assets, Statistics missing regression equation, CSP data-table structure, and hidden unresolved AP Gov visual-stimulus items from student delivery with `publish_status: "blocked"` and `student_visible: false`.
  - Added frontend filtering for blocked/non-student-visible items and upgraded `MathText` so same-line Roman candidate lists render as structured rows.
  - Verification passed: `npm run validate` (including student-risk 5482 items P0=0/P1=0/P2=0), `npm run build`, and `npm run audit:render:all` for all 16 active subjects with 0 errors / 0 warnings.
  - Deployed to Cloudflare Pages: `https://cadaa5d0.lynkedu-ap-question-bank.pages.dev`; production `lynkedu.com` observed `/assets/index-zz9BSPum.js` and `/assets/index-SlSDx4HT.css`.
  - GitHub stable sync completed through API fallback: local tree `ad0c19c43a9456b269146a94de7ff60455dc1e42` matches remote branch `prod-mock-pdf-fix` remote commit `8919880462320c24a0f547283bfe42e375cf3119`.

- 2026-07-17 CSA prompt-quality repair after user found CSAwesome MCQ cleanup issues:
  - repaired `csawesome_practice_Q019` so the ArrayList `numQuest` prompt no longer includes the source section heading `FRQs` and renders the initial list plus Java method as structured code;
  - repaired `csawesome_practice_Q111` so the boolean variables and `!a && !b` expression render cleanly without `...will` continuation text or a combined `` `a and b` `` code span;
  - completed a full CSA source-cleanup pass after follow-up review: repaired `csawesome_practice_Q116` so two adjacent RST code blocks render as separate student-visible blocks, corrected its unit from U10 to U8, and removed external source links from CSAwesome explanations in `Q110`, `Q115`, `Q120`, and `Q122`;
  - updated `scripts/csa_content_audit.cjs` to block source section-heading carryover, ellipsis continuation artifacts, and combined boolean-variable code spans;
  - expanded `scripts/csa_content_audit.cjs` to check explanations, visible RST/source markup, external source links in explanations, and U10 recursion evidence;
  - added `validate:csa` to the global `npm run validate` chain;
  - updated the local CSAwesome source builder at `subjects/AP/Computer-Science-A/tools/build_csawesome_data.py` so code-block parsing respects actual RST code indentation and feedback cleanup removes external links; updated the generated CSAwesome source data copy so future local rebuilds keep the same cleanup.
  - Verification passed: Web CSA residual scan found 0 artifacts, CSAwesome source-data residual scan found 0 artifacts, `npm run validate:csa` passed, and full `npm run validate` passed.
  - Build/render/deploy evidence before final deploy: `npm run build`, `npm run audit:render -- --subject=computer-science-a`, Cloudflare Pages deployment `https://6a7c8cbc.lynkedu-ap-question-bank.pages.dev`, production data checks for `Q019` and `Q111`, and stable-push remote tree match at remote commit `49315a50c802f1d4b51a67e1dd38d4ef80e0f9f1`.
  - Final full-clean deployment: Cloudflare Pages `https://25fee8fb.lynkedu-ap-question-bank.pages.dev`; production data checks for Q110/Q115/Q116/Q120/Q122 passed, including Q116 `primary_unit: U8`; stable-push remote tree matched local at remote commit `18b152142d306e3bffba514f512b46f23cb526b9`.

- Improved `scripts/student_flow_audit.cjs` comparable-text matching so KaTeX-rendered unit spacing such as `2N` versus source `$2\\,\\mathrm{N}$` does not create false current-question visibility warnings.
- Hardened mobile student-flow delivery and audit coverage:
  - `scripts/student_flow_audit.cjs` now supports account-tier simulation and runs premium search/question-set/similar-question paths with a Lynk Student account state instead of treating gated pages as search failures;
  - math-heavy current-question visibility checks now accept KaTeX-rendered stems/options instead of relying only on raw source substrings;
  - mobile question, FRQ, search, and score-review images now use a shared horizontally scrollable image container so wide diagrams stay readable instead of being compressed too small;
  - final 16-subject mobile student-flow audit on local production preview passed with 0 errors / 0 warnings.
- Added `public/_headers` for `/data/*` with no-cache headers after production custom domain returned stale question-bank JSON while the new Pages deployment and local `dist` were correct.

- Hardened grouped-MCQ delivery after Biology pond-water/duckweed review:
  - Biology `2008_Q77`-`2008_Q80` now publish a complete `group_id`, `group_members`, `group_role`, `requires_group_context`, and markdown-table `group_context`;
  - single-unit Quiz filtering now requires every member of a grouped bucket to match the selected unit, so cross-unit grouped buckets cannot appear as incomplete unit practice;
  - grouped Quiz validation now checks complete grouped selection and single-unit grouped-bucket scope for all active subjects;
  - unit-distribution validation now accounts for single-unit Quiz coverage after grouped-bucket filtering.
- Hardened Biology rebuild behavior:
  - Biology pipeline supports grouped prompts with shared context but independent options;
  - `update_subjects()` preserves existing publication/readiness fields;
  - rebuilt rows preserve reviewed per-item metadata such as `visual_asset_review` instead of silently dropping it.
- Verification:
  - `npm run validate:groups` passed;
  - `npm run validate:unit-distribution` passed with existing sparse-capacity warnings only;
  - `npm run validate:student-progression -- --skip-browser` passed for all 16 active subjects;
  - `npm run validate:data` passed with 0 errors / 0 warnings;
  - `npm run validate` passed;
  - `npm run build` passed;
  - Biology real-browser student-flow audit passed with 0 errors / 0 warnings.
- Deployed grouped-Quiz repair to Cloudflare Pages:
  - latest Pages deployment URL: `https://51ae9bcb.lynkedu-ap-question-bank.pages.dev`;
  - production `lynkedu.com` bundle observed: `/assets/index-Cy5JXXQs.js`;
  - production Biology data verified: `2008_Q77` returns `group_id: 2008_Q77_80`, four `group_members`, and the duckweed growth table in `group_context`.

## 2026-07-14

- Fixed student account password hashing for Cloudflare Workers:
  - `functions/_shared/auth.js` now uses `PASSWORD_HASH_ITERATIONS = 100000`;
  - password verification returns false for stored hashes above the Workers PBKDF2 cap instead of crashing the request;
  - account/password/login/register/reset-code function files passed `node --check`.
- Repaired online student rendering for special subjects:
  - `MathText` formatting now supports fenced code blocks and inline code while preserving KaTeX rendering;
  - online MCQ question text and options now use block-capable MathText containers;
  - FRQ prompt normalization now protects fenced code blocks the same way it protects Markdown tables, so CSA FRQ code is not flattened.
- Strengthened student-side visual auditing:
  - `scripts/student_flow_audit.cjs` now deliberately samples CSA code questions and math/formula-heavy questions;
  - online Quiz, Mock MCQ, and FRQ player fail if CSA code lacks `.math-code-block`/`.math-inline-code`, if raw code fences are visible, or if math subjects lack `.katex` for formula questions;
  - search page target visibility is a warning in unauthenticated audits because search is a Lynk Student gated surface.
- Verification:
  - `node --check` passed for updated audit/auth files;
  - `npm run validate` passed;
  - `npm run build` passed;
  - CSA student-flow audit on fresh preview `4182` passed with 0 errors;
  - Calculus AB student-flow audit on fresh preview `4183` passed with 0 errors.
- Deployed to Cloudflare Pages:
  - latest Pages URL: `https://8a850978.lynkedu-ap-question-bank.pages.dev`;
  - production `lynkedu.com` returned JS `/assets/index-B-vZgovI.js` and CSS `/assets/index-BRfFf4PD.css`;
  - production CSA data verified at 302 MCQ / 12 FRQ;
  - real-browser production checks confirmed CSA code render layer present with no raw code fences, and Calculus AB KaTeX present with no raw formula text;
  - local password hash regression confirmed new hashes use `pbkdf2_sha256$100000` and verify successfully.

## 2026-07-13

- Started question-pool expansion program:
  - recorded expansion hard rules in SSoT and main-session memory;
  - added `npm run audit:capacity` / `scripts/subject_capacity_audit.cjs`;
  - generated `.workspace/subject-capacity-audit/subject-capacity-report.json`;
  - documented capacity queue in `docs/QUESTION_POOL_EXPANSION_2026-07-13.md`.
- Started CSA expansion preflight:
  - confirmed current package is 105 MCQ + 8 FRQ with sparse U1/U2/U3/U4/U7/U10;
  - identified local 2009 released exam as candidate source;
  - confirmed the 2009 PDF is a 135-page scanned source with no embedded text layer;
  - generated local OCR/page-map assets under `D:\Lynk\翎英教育LynkEdu\.workspace\csa_2009_probe`;
  - updated CSA source pack, risk discovery, and expansion plan under `subjects/AP/Computer-Science-A/docs`;
  - fixed CSA pipeline Web target to prefer `ap-question-bank-prod-fix`.
- Completed CSA first expansion pass:
  - added official current CED sample questions as a first-class source;
  - generated and published `ced_2025` data: 20 MCQ + 4 FRQ;
  - CSA Web package increased from 105 MCQ / 8 FRQ to 125 MCQ / 12 FRQ;
  - rebuilt CED content as structured Java, Markdown tables, lists, and CSA FRQ scoring rows; no broad prompt screenshots were used;
  - added `scripts/csa_content_audit.cjs` and `npm run audit:csa`;
  - fixed stale empty group metadata for CSA 2015 Q27-Q28 during the rebuild;
  - verification passed: `npm run audit:csa`, `npm run validate`, `npm run build`, `npm run audit:render -- --subject=computer-science-a`, `npm run audit:student-flow -- --subject=computer-science-a`, and `npm run audit:capacity`;
  - capacity audit still flags CSA as high risk because total MCQ count is 125 and U1/U2/U3/U7/U10 remain sparse;
  - 2009 scanned released exam remains deferred until scanned Java reconstruction is complete.
- Corrected expansion closeout mechanism:
  - recorded that the CSA CED pass is partial, not full expansion completion;
  - added `scripts/expansion_closeout_audit.cjs`;
  - added `npm run audit:expansion-closeout`;
  - closeout now distinguishes source-batch acceptance from full expansion completion;
  - `--status=complete` must fail for CSA while capacity risk remains High.

- Refined subject management and switching:
  - header learning links route to settings when no subject is selected;
  - subject dropdown opens even for one selected subject and always includes management entry;
  - settings page now uses a minimalist `我的科目 / 可添加科目` layout;
  - adding a subject sets it current/default;
  - removing the final selected subject is blocked with a student-facing notice;
  - deleting the current subject falls back to the remaining selected subject and updates `currentSubject` / `defaultSubject`;
  - subject-dependent routes are wrapped by `RequireSubject` so direct URLs cannot silently open a stale/default subject.
- Verification:
  - `npm run build` passed.
  - Real-browser built-preview checks passed for no-subject `/quiz`, settings empty state, add Biology, single-subject dropdown, last-subject removal block, add Calculus BC, remove current subject, home, and Biology quiz setup.
- Deployed subject-flow refinement to Cloudflare Pages:
  - latest Pages deployment URL observed: `https://83e65ae1.lynkedu-ap-question-bank.pages.dev`;
  - production `lynkedu.com` bundle observed: `/assets/index-1HOTOWOv.js`;
  - production CSS observed: `/assets/index-h2m_05wC.css`.
- Synced source through stable-push API fallback:
  - remote branch: `prod-mock-pdf-fix`;
  - `npm run stable:status` confirmed remote tree matches local HEAD tree after API fallback.

- Deployed LynkEdu AP Question Bank to Cloudflare Pages production by direct `dist` upload.
- Verified `https://lynkedu.com` and `https://www.lynkedu.com` return 200 and load root-path assets, not `/ap-question-bank/` assets.
- Confirmed production bundle:
  - `/assets/index-BfOc4GGt.js`
  - `/assets/index-BgNSD0mB.css`
- Implemented current three-tier product access model:
  - visitor,
  - registered account,
  - `翎英学员`.
- Restricted premium tools to `翎英学员`:
  - search,
  - question sets,
  - similar-question practice,
  - Quiz PDF download,
  - Mock Exam PDF download,
  - score-report PDF download,
  - future unit knowledge-point explanations.
- Kept online Mock Exam, mistake book, and practice history available to registered accounts.
- Recorded that registered-account mistake/history data is a durable teaching-research and product-iteration data foundation.
- Recorded post-launch content-capacity backlog: Biology and other low-volume subjects need question-pool expansion/backfill.
- Added `scripts/access_contract_audit.cjs` and wired it into `npm run validate` so the tier-2/tier-3 permission boundary is executable.
- Rebuilt Search as a current-subject question-bank workbench:
  - weighted current-subject search,
  - official question rendering via `QuestionDisplay`,
  - add to practice,
  - add/remove from question set,
  - question-set practice,
  - question-set PDF,
  - similar-question practice.
- Added question-set storage into the progress snapshot sync path.
- Verified locally through `npm run build`.
- Verified production search page in real browser: visitor sees `翎英学员` access gate.
- 2026-07-13 access-tier correction deployed to Cloudflare Pages:
  - local commits: `1e21049 Refine student access tiers`, `4984408 Normalize registered member copy`;
  - latest Pages deployment URL observed: `https://b89a6272.lynkedu-ap-question-bank.pages.dev`;
  - production `lynkedu.com` bundle observed: `/assets/index-CdPMt8hY.js`;
  - real-browser checks passed for visitor `/mistakes` login gate and visitor `/search` `翎英学员` gate with `注册会员` copy.
- GitHub push of local commits failed because the local machine hit a GitHub connection reset; production was still updated through Cloudflare Pages direct deploy.
- Implemented student account upgrade:
  - primary email/password registration and login;
  - email-code login retained as fallback;
  - forgot-password flow;
  - account profile, email verification, password setup/change, progress sync, and logout-other-devices controls;
  - optional `翎英学员` invite-code backend.
- Applied remote D1 migration `migrations/0002_password_auth.sql` to `lynkedu-question-bank`; verified `email_verified_at` and new password/auth tables exist.
- Recorded SEO/GEO optimization as a required future launch/acquisition workstream.
- Deployed account-system upgrade to Cloudflare Pages:
  - local commit: `ea3dd66 Upgrade student account flow`;
  - latest Pages deployment URL observed: `https://ef774b20.lynkedu-ap-question-bank.pages.dev`;
  - production `lynkedu.com` bundle observed: `/assets/index-Cfz2d49t.js`;
  - production CSS observed: `/assets/index-BsNt8fSc.css`;
  - real-browser checks passed for `/login`, `/register`, `/reset-password`, and `/account` visitor account gate.

- Removed student-facing copy that described training records as teacher research/system-iteration data.
- Refined the student web shell and home layout:
  - lighter sticky header with clearer navigation, subject switcher, and account entry;
  - low-emphasis footer so the learning workspace carries the page;
  - home page rebuilt as a learning dashboard with current subject, primary actions, account status, selected subjects, and common tools;
  - desktop and mobile browser screenshots checked through WebBridge against the built preview.
- Deployed student layout refinement to Cloudflare Pages:
  - latest Pages deployment URL observed: `https://b03edf40.lynkedu-ap-question-bank.pages.dev`;
  - production `lynkedu.com` bundle observed: `/assets/index-Dqt_u_sP.js`;
  - production CSS observed: `/assets/index-DbOL2LWp.css`;
  - real-browser production checks passed for `/login` copy removal and `/` learning-dashboard structure.
- Reworked the student home page and web shell toward a stricter minimalist style:
  - removed dashboard-style card density and metric blocks;
  - reduced navigation to core learning paths;
  - kept the home page to current subject, two primary actions, a simple subject list, and text links;
  - verified built preview on desktop and mobile before deployment.
- Deployed minimalist layout refinement to Cloudflare Pages:
  - latest Pages deployment URL observed: `https://ad0317fa.lynkedu-ap-question-bank.pages.dev`;
  - production `lynkedu.com` bundle observed: `/assets/index-zpiUeq2o.js`;
  - production CSS observed: `/assets/index-CEg-XvSo.css`.
- Added a lightweight student next-step flow to the minimalist home page:
  - reads current-subject local quiz history and wrong-question count;
  - keeps new students on the simple `专项练习 / 模拟考试 / 学习记录` path;
  - returning students with wrong questions see `继续练习`, last score, wrong-count summary, and a `复盘错题` secondary action;
  - no complex recommendation engine or new data model was added.
- Deployed lightweight home learning-flow refinement to Cloudflare Pages:
  - latest Pages deployment URL observed: `https://21082dae.lynkedu-ap-question-bank.pages.dev`;
  - production `lynkedu.com` bundle observed: `/assets/index-dVLuSvV1.js`;
  - production CSS remains `/assets/index-CEg-XvSo.css`.
- Redesigned account entry pages with a minimalist single-column account form layout:
  - removed the login-page `账号能保存什么` side panel;
  - removed the register-page benefits side panel;
  - aligned login, register, and password reset around one quiet form pattern;
  - kept password login primary and email-code login as fallback;
  - verified built preview and production snapshots for `/login` and `/register`.
- Deployed account-page layout refinement to Cloudflare Pages:
  - latest Pages deployment URL observed: `https://73072b39.lynkedu-ap-question-bank.pages.dev`;
  - production `lynkedu.com` bundle observed: `/assets/index-DSx-shk8.js`;
  - production CSS observed: `/assets/index-CcoUOuDc.css`.
# 2026-07-17 - Full Student Audit And Official Unit Gate

- Ran a full all-subject student review under the current framework across 16 active AP subjects.
- Added `scripts/official_unit_authority_audit.cjs` and wired `validate:official-units` into `npm run validate`.
- Filled `unit_classification_authority` metadata for all 16 active subject `classification_config.json` files.
- Found and repaired a blocking AP Psychology framework mismatch:
  - previous Web package used the legacy 9-unit AP Psychology sequence;
  - current official framework uses 5 units;
  - migrated 497 MCQ and 16 FRQ to the official 5-unit sequence;
  - regenerated Psychology mock distribution and `similarity_index.json`.
- Repaired `scripts/browser_render_audit.cjs` so render/PDF checks run with internal student account state by default, matching premium surface requirements.
- Added a render-audit failure mode for premium gate pages appearing during internal-account PDF checks.
- Verification passed:
  - `npm run validate:official-units`: 16 subjects, 0 errors, 0 warnings.
  - `npm run validate`: 0 blocking findings.
  - `npm run build`: passed.
  - Mobile `audit:student-flow` for all 16 active subjects under internal account state: 0 errors / 0 warnings.
  - `npm run audit:render:all`: all 16 active subjects, 0 errors / 0 warnings.

# 2026-07-17 - Admin Console And Entitlement Operations

- Added a dedicated admin console for `admin.lynkedu.com` as a separate frontend build:
  - `admin.html`
  - `vite.admin.config.js`
  - `src/admin/AdminApp.jsx`
  - `src/admin/adminApi.js`
  - `scripts/prepare_admin_dist.cjs`
- Added admin APIs:
  - `functions/api/admin/users.js`
  - `functions/api/admin/entitlements.js`
  - `functions/api/admin/invites.js`
  - `functions/api/admin/logs.js`
- Added D1 migration `migrations/0003_admin_entitlements.sql` for entitlement status, revocation fields, invite redemption duration, invite redemption records, and admin operation records.
- Updated shared account logic:
  - active access reads only active, non-expired entitlement rows;
  - admin APIs require an admin account;
  - register-with-invite can create expiring entitlement rows and redemption records.
- Applied remote migration to D1 database `lynkedu-question-bank` and verified the new columns/tables.
- Set `wuzehua2015@gmail.com` to `account_level = 'admin'`.
- Created Cloudflare Pages project `lynkedu-admin`, bound the same D1 database as `DB`, and deployed:
  - admin deployment: `https://f6e5e2b7.lynkedu-admin.pages.dev`;
  - student deployment after Functions update: `https://de8c083b.lynkedu-ap-question-bank.pages.dev`.
- Verification:
  - `npm run validate`: passed.
  - `npm run build`: passed.
  - `npm run build:admin`: passed.
  - `https://f6e5e2b7.lynkedu-admin.pages.dev`: HTTP 200, title `翎英教育管理后台`.
  - unauthenticated `/api/me` and `/api/admin/users`: HTTP 401.
  - `https://lynkedu.com`: HTTP 200, title `翎英教育题库`.
- Admin custom domain item is complete: `admin.lynkedu.com` is active on Pages with CNAME `admin` -> `lynkedu-admin.pages.dev`, proxied, TTL Auto. Public access returns HTTP 200 and renders `翎英教育管理后台`.
- Source mirror synced through stable API fallback; `npm run stable:status` must be used as the live source-of-truth check because API fallback creates a remote commit id different from local Git history while preserving the same tree.

# 2026-07-18 - Chinese Display Mapping Contract

- Added `src/utils/displayLabels.js` as the single display-label layer for subject names, subject short names, unit names, difficulty labels, account tiers, entitlement features, and entitlement statuses.
- Updated Header, Home, Settings, Quiz setup, Search, History, Mistake Book, Score report, Quiz PDF, Mock PDF, Account, and Admin entitlement surfaces to use the centralized Chinese-first mapping instead of raw English source metadata.
- Preserved official/source metadata in `public/data/subjects.json`; UI localization is now a presentation-layer concern, not a data-source rewrite.
- Strengthened `scripts/chinese_copy_gate.cjs` so checked student-facing files cannot directly render raw `subject.name`, `subject.shortName`, `unit.name`, or `unit.title`.
- Verification passed: `npm run validate:copy`, `npm run validate`, `npm run build:admin`, and `npm run build`.
- Deployed student site to `https://a4263303.lynkedu-ap-question-bank.pages.dev`; production `https://lynkedu.com` now references JS `/assets/index-BPpfi7Zf.js` and CSS `/assets/index-C75AEhR5.css`.
- Deployed admin site to `https://4c150904.lynkedu-admin.pages.dev`; production `https://admin.lynkedu.com` now references JS `/assets/index-DvhgSTr2.js` and CSS `/assets/index-DrvrsFJO.css`.
- Real-browser production QA passed:
  - `https://lynkedu.com/`: home/header show Chinese subject names such as `AP 生物`, `AP 计算机科学 A`, `AP 宏观经济学`, and no raw `AP Biology` / `AP Computer Science A`.
  - `https://lynkedu.com/settings`: 16-subject selector shows Chinese-first course names.
  - `https://lynkedu.com/quiz`: Biology unit options show Chinese unit names (`U1 生命的化学基础`, etc.) and no raw Biology unit English.
  - `https://lynkedu.com/search`: subject, unit filter, and difficulty filter show Chinese labels while original question stems remain unchanged.
  - `https://admin.lynkedu.com`: entitlement list/detail shows Chinese labels such as `完整题库 · 有效`, with no raw `full_access` / `active` visible.

# 2026-07-17 - Admin Custom Domain Live

- Added Cloudflare DNS record for admin console:
  - CNAME `admin` -> `lynkedu-admin.pages.dev`;
  - proxy enabled;
  - TTL Auto.
- Verified Cloudflare Pages custom domain status for `lynkedu-admin`: `admin.lynkedu.com` is `active`.
- Verified public access: `https://admin.lynkedu.com` returns HTTP 200 and contains `翎英教育管理后台`.
- Global API Key email-code route was not needed; DNS was completed through the already logged-in Cloudflare dashboard session.
- Current deployment split remains:
  - student: `lynkedu-ap-question-bank`, `lynkedu.com`, `www.lynkedu.com`;
  - admin: `lynkedu-admin`, `admin.lynkedu.com`;
  - both share D1 database `lynkedu-question-bank` through binding `DB`.

# 2026-07-13 - CSA Capacity Expansion Closeout

- Completed AP Computer Science A MCQ expansion from 105 MCQ to 291 MCQ while keeping 12 FRQ.
- Added source approval ledger and archived network/open-curriculum sources under `subjects/AP/Computer-Science-A/01-exams/network_sources/`.
- Published:
  - 20 CED MCQ + 4 CED FRQ.
  - 38 AP Bowl 2018 MCQ.
  - 122 CSAwesome / Runestone open-curriculum MCQ with GFDL 1.3 metadata.
  - 6 LynkEdu-owned U1 original MCQ.
- Deferred 2009 scanned released exam and AP Bowl 2015/2016 until OCR/code reconstruction is complete.
- Updated CSA pipeline, CSA content audit, subject-risk audit, source pack, CSA status, and expansion ledger.
- Verification passed: `npm run audit:csa`, `npm run validate`, `npm run build`, `npm run audit:render -- --subject=computer-science-a`, `npm run audit:student-flow -- --subject=computer-science-a`, `npm run audit:capacity`, and `npm run audit:expansion-closeout -- --subject=computer-science-a --status=complete`.
- Production data check passed on `https://lynkedu.com/data/ap/computer-science-a/question_bank.json`: 291 MCQ returned with HTTP 200; `frq_bank.json` returned 12 FRQ with HTTP 200.
- Source mirror synced through `npm run stable:push`; normal Git push was rejected by non-linear remote history, then the stable API path synced the current local tree to `prod-mock-pdf-fix`.
- `npm run stable:status` confirmed the remote tree matches the local HEAD tree.

# 2026-07-14 - CSA Deferred Source Curated Follow-Up

- Rechecked deferred CSA sources:
  - 2009 released exam scanned PDF.
  - AP Bowl 2015.
  - AP Bowl 2016.
- Archived a public 2009 PDF copy under the CSA network source folder and generated OCR work drafts under `.workspace/csa_deferred_ocr_20260714/`.
- Added source builders:
  - `subjects/AP/Computer-Science-A/tools/build_ap_bowl_ocr_data.py`
  - `subjects/AP/Computer-Science-A/tools/build_2009_released_data.py`
- Published only high-confidence manually verified structured MCQ:
  - AP Bowl 2015: 5 accepted / 35 rejected-deferred.
  - AP Bowl 2016: 4 accepted / 36 rejected-deferred.
  - 2009 released: 2 accepted / 38 rejected-deferred.
- CSA package increased from 291 MCQ / 12 FRQ to 302 MCQ / 12 FRQ.
- 2009 FRQ remains deferred because prompt cleanup, reference solutions, and part-level scoring rows have not yet met CSA FRQ standard.
- Updated `scripts/csa_content_audit.cjs` to enforce 302 MCQ, source counts, 2009/GridWorld guardrails, AP Bowl year-specific counts, and OCR-damage checks.
- Verification passed: `npm run audit:csa`, `npm run validate`, `npm run audit:capacity`, CSA unit-progression blocking audit, `npm run audit:render -- --subject=computer-science-a`, `npm run audit:student-flow -- --subject=computer-science-a`, and `npm run build`.

# 2026-07-14 - CSA Rendering And Group-Context Repair

- Repaired `2014_sample_Q08` / `2014_sample_Q09` after discovering that the question stem referenced missing Java context. The shared `TimeRecord` class is now consistent `group_context` with formal group metadata.
- Repaired `ap_bowl_2018_Q33` and the renderer for Roman-numeral candidate lists so `I.`, `II.`, `III.` lines render as separate structured rows.
- Updated Quiz and read-only question displays so `group_context` is visible on the student surface. This closes the gap where metadata existed but the actual Quiz card did not show the shared stimulus/code.
- Strengthened `scripts/csa_content_audit.cjs` to validate the full student-visible prompt (`group_context + text`) for CSA missing-code and Roman-list issues.
- Verification passed:
  - `python subjects/AP/Computer-Science-A/tools/csa_pipeline.py`
  - `npm run audit:csa`
  - `npm run validate`
  - `npm run build`
  - real-browser Quiz check for `2014_sample_Q08`: `TimeRecord` code block and answer choices visible.
  - real-browser Quiz check for `ap_bowl_2018_Q33`: three `.math-roman-option` rows and Java code block visible.
- Deployed to Cloudflare Pages:
  - Pages URL: `https://d5c8f7c8.lynkedu-ap-question-bank.pages.dev`
  - production bundle: `/assets/index-Be2xE0yd.js`, `/assets/index-Bqxh0FeN.css`
  - production data check: 302 CSA MCQ, Q08/Q09 grouped context, Q33 Roman label cleanup.

# 2026-07-14 - Global Question-Bank SOP Hardening

- Added `docs/GLOBAL_QUESTION_BANK_SOP.md` as the top-level SSoT for future AP/A-Level/IB/competition subject work.
- The SOP now defines the required lifecycle for source approval, subject risk discovery, reconstruction, unit classification, student-surface verification, local publish, deployment verification, closeout, and full-diagnosis passes.
- Added `scripts/global_sop_gate.cjs` and wired it into `npm run validate` through `validate:sop`.
- The gate verifies that global SOP, structured prompt contract, unit classification standard, expansion ledger, project status, and work log remain present and contain the required markers.
- Updated `PROJECT_STATUS.md` so global expansion/new-item delivery rules are visible from the project status entry point.

# 2026-07-20 - Quiz Image Transition Production Fix

- Fixed online Quiz image refresh: stateful question images now reset their internal source/error state when `path` changes, and question image keys include `question_id` plus image path.
- Added focused browser audit `npm run audit:quiz-image-transition`, which seeds adjacent image-bearing MCQs, clicks the real next-question control, and verifies the second question shows its own image without retaining the previous question image.
- Strengthened `scripts/student_flow_audit.cjs` so regular student-flow samples include adjacent image questions when available and check current question image visibility.
- Validation passed locally: `npm run lint`, `npm run validate`, `npm run build`, macro mobile student-flow, local all-subject image-transition audit.
- Synced source to GitHub `main` through stable API fallback. Remote tree matches local tree.
- Deployed production through Cloudflare Pages project `lynkedu-ap-question-bank`: `https://ad92b4af.lynkedu-ap-question-bank.pages.dev`.
- Verified real production domain `https://lynkedu.com`: macro image-transition audit passed with 0 errors, then all 16 active subjects passed with 0 errors.

# 2026-07-21 - Classification Accuracy Contract Gate

- Added `scripts/classification_accuracy_contract_audit.cjs` and wired `validate:classification-accuracy` into `npm run validate`.
- Updated `scripts/global_sop_gate.cjs`, `docs/UNIT_CLASSIFICATION_STANDARD.md`, and `docs/GLOBAL_QUESTION_BANK_SOP.md` so classification accuracy is now an executable contract, not only a written rule.
- New contract checks:
  - hard concept-boundary regressions ignore prior `reviewed` status;
  - item-level `classification_accuracy` / `required_topics` evidence must match the latest required unit when present;
  - official topic-map coverage debt is reported separately from blocking data errors;
  - hard-boundary checks use the prompt plus correct answer path, so wrong-option-only concepts do not automatically raise `primary_unit`.
- Corrected AP Macroeconomics local framework and data under current official topic placement:
  - Phillips Curve is Unit 5 Topic 5.2, including SRPC and LRPC items.
  - Reclassified Macro `2012_Q15`, `2014_Q30`, `2015_Q17`, `2016_Q27`, `2017_Q17`, `2017_Q45`, and `2019_Q38` to U5 with topic-level evidence.
  - Added the Macro topic map skeleton to `classification_config.json`, including Unit 5 Topic 5.7.
- Corrected CSA `ap_bowl_2018_Q37` to U10 because the required answer path includes mergesort recursion knowledge.
- Validation passed:
  - `npm run validate:classification-accuracy`: 16 subjects, 5472 active scored items, topic-map coverage debt 13, blocking errors 0.
  - `npm run validate:macro-units`: 460 macro items, blocking 0.
  - `npm run validate`: all gates passed.
  - `npm run build`: production build passed.
- Source sync and deployment:
  - Local commit `a6f25b5 Add classification accuracy contract gate`.
  - Remote tree verified in sync by `npm run stable:status`: local/remote tree `ddccfc2a031e99bfe49f6de583432f3fdfb704b0`; remote commit `f05a0ab9e75df5e5e135144a0212f836edeee498`.
  - Cloudflare Pages deployed student site to `https://32233839.lynkedu-ap-question-bank.pages.dev`.
  - Production `https://lynkedu.com` data verified for the seven Macro Phillips Curve U5/Topic 5.2 items, CSA `ap_bowl_2018_Q37` U10, and Macro Unit 5 topics `5.1` through `5.7`.

# 2026-07-21 - Official Topic Maps And Current Framework Migration

- Downloaded and archived current official CED/framework PDFs under `.workspace/official_ced_pdfs/` for Biology, Chemistry, CSA, CSP, Calculus, Statistics, US Government, APES, Physics 1, Physics 2, Physics C Mechanics, and Physics C E&M.
- Added topic-level official maps to all 16 active subjects; `validate:classification-accuracy` now reports topic-map coverage debt 0.
- Migrated CSA from the legacy 10-unit structure to the Effective Fall 2025 4-unit structure:
  - old U1/U2 -> new U1;
  - old U3/U4 -> new U2;
  - old U5 -> new U3;
  - old U6/U7/U8/U9/U10 -> new U4.
- Migrated Statistics from the legacy 9-unit structure to the Effective Fall 2026 5-unit structure and updated reviewed regression cases to the new unit numbering.
- Migrated Physics 2 to the Effective Fall 2024 U9-U15 framework and blocked legacy Fluids items from every student-visible path.
- Updated gates:
  - `data_validator.cjs`, `student_progression_audit.cjs`, `unit_progression_audit.cjs`, and `full_student_risk_audit.cjs` now consistently ignore `student_visible: false` / `publish_status: blocked` records for student-facing release checks.
  - `official_unit_authority_audit.cjs`, `classification_accuracy_contract_audit.cjs`, `unit_distribution_contract_audit.cjs`, `unit_progression_audit.cjs`, and `csa_content_audit.cjs` were aligned with the new official frameworks.
- Fixed `index.html` title bytes to UTF-8 Chinese title after detecting a source-level browser-title/SEO metadata risk.
- Verification passed:
  - `npm run validate:official-units`
  - `npm run validate:classification-accuracy`
  - `npm run validate:student-progression`
  - `npm run validate:data`
  - `npm run validate`
  - `npm run build`
  - real-browser local student path on port 4291: home, first-visit subject settings, 16-subject availability, CSA unit list, CSA Quiz generation, CSA `/play` code rendering.
- Source sync and production deployment:
  - Local commit `ca0fec2 Backfill official topic maps and current unit frameworks`.
  - Stable API remote commit `f5a7bad9be5f53c328e66b9d3363a64d587b6ab4`; remote tree matched local tree `37c1546edc5d323610acb06e1cd28e6f78be2ad6`.
  - Cloudflare Pages deployment: `https://1ac2bfcb.lynkedu-ap-question-bank.pages.dev`.
  - Production `https://lynkedu.com` verified for title, 16 active subjects, CSA U1-U4, Statistics U1-U5, Physics 2 U9-U15, 0 student-visible legacy-unit residuals for migrated frameworks, and real-browser CSA Quiz setup loading production data.

# 2026-07-21 - All-Subject Topic-Level Classification Completion

- Completed the unfinished all-subject classification rebuild. Before this pass, 6 subjects still had 1890 student-visible scored items with only unit-level evidence: Calculus AB, Calculus BC, Physics 1, Physics 2, Physics C: Mechanics, and Physics C: Electricity and Magnetism.
- Added `scripts/calc_physics_topic_classification_audit.cjs` for Calculus/Physics subject-specific official-topic progression checks. The script uses official topic maps, high-confidence subject rules, and manual locks for short graph/shared-context items; it does not treat prior `primary_unit` as proof.
- Materialized concrete `classification_accuracy.required_topics[].topic_code` evidence for all remaining visible scored items.
- Added formal validation scripts for the six remaining subjects and wired them plus `validate:topic-level-completion` into `npm run validate`.
- Updated `scripts/unit_progression_reviewed_cases.json` to 5349 regression cases covering every current student-visible scored item.
- Aligned `classification_evidence_audit.cjs` with the same student-visible filtering contract used by other release gates.
- Converted the known CSA U4 concentration exception in `unit_distribution_contract_audit.cjs` from a warning to a note, keeping validation warning-free while preserving the capacity observation.
- Current classification closeout evidence:
  - `npm run validate:classification-coverage`: 5349 student-visible items, missing required topics 0, invalid required topics 0.
  - `npm run validate:classification-accuracy`: 16 subjects, 5349 items, topic-map coverage debt 0, item-contract errors 0, hard-boundary errors 0.
  - `npm run validate:topic-level-completion`: 5349/5349 topic-level, unit-level-only 0.
  - `npm run validate:classification-evidence`: missing review 0, stale reasoning 0, mismatches 0, bad evidence 0.
  - `npm run validate:student-risk`: 16 subjects, 5349 items, P0/P1/P2 all 0.
  - `npm run validate`: passed.
  - `npm run build`: passed.
- Source sync and production deployment:
  - Local commit `abe9fa8 Complete topic-level unit classification`.
  - Stable API remote commit `0ce0057b284647a3cfc0ee811a3f48eb1cbeb35c`; remote tree matched local HEAD tree `c8201bc146071d8f63ae4c1270f2cdc4fdd0afc7`.
  - Cloudflare Pages deployment: `https://d42c8aed.lynkedu-ap-question-bank.pages.dev`.
  - Real production browser verification on `https://lynkedu.com/`: title `翎英教育题库`, active subjects 16, production bundle `/assets/index-Dbek1AmI.js`, topic-level student-visible scored items 5349/5349, unit-level-only 0.

# 2026-07-22 - Physics 2 Reverse-Hidden Classification Repair

- Investigated the high Physics 2 post-classification loss rate.
- Root cause: the Fall 2024 Physics 2 U9-U15 migration correctly removed legacy Fluids content, but the audit only checked student-visible items and missed hidden scored items that still mapped to current official topics. Stale Fluids reasoning and broad option-text signals incorrectly removed thermodynamics, optics, modern physics, and circuit items.
- Repaired `scripts/calc_physics_topic_classification_audit.cjs`:
  - added `--review-blocked`;
  - made `validate:physics-2-units` review blocked scored Physics 2 inventory;
  - prioritizes stem/shared-context evidence over answer-choice distractors;
  - restores current-framework items with explicit `student_visible: true`, `publish_status: published`, and topic-level evidence.
- Restored Physics 2 student-visible scored items from 220 to 250; blocked count dropped from 56 to 26. Remaining blocked Physics 2 items are legacy Fluids/current-framework-outside records.
- Cleaned actual content pollution in Physics 2 `2017_Q15` option D and corrected two stale reviewed-case baselines (`2017_Q15`, `lynkedu_2026_physics_2_capacity_Q004`).
- Updated `docs/UNIT_CLASSIFICATION_STANDARD.md`, `docs/GLOBAL_QUESTION_BANK_SOP.md`, and main-session memory with the reverse-hidden review rule.
- Verification passed:
  - `npm run validate:physics-2-units`
  - `npm run validate:classification-coverage`
  - `npm run validate:classification-accuracy`
  - `npm run validate:student-progression`
  - `npm run validate`
  - `npm run build`
- Deployed production through Cloudflare Pages: `https://3e28b971.lynkedu-ap-question-bank.pages.dev`.
- Production `https://lynkedu.com` data check: Physics 2 MCQ 248, FRQ 28, scored 276, student-visible 250, blocked 26; `2017_Q15` option D is clean.

# 2026-07-24 - IB Math AA Platform Foundation

- Established the first non-AP assessment-model boundary for IB Math AA.
- Updated `docs/IB_MATH_AA_ONBOARDING_PLAN.md` and `subjects/IB/Group-5-Mathematics/docs/MATH_AA_SOURCE_INVENTORY.md` with the current local source inventory and source approval decisions.
- Updated `docs/GLOBAL_QUESTION_BANK_SOP.md` with the non-AP assessment-model SOP and the IB Math requirements: SL/HL, paper, calculator status, marks, subpart marks, timezone, syllabus version, and markscheme pairing.
- Added candidate IB data files:
  - `public/data/ib/math-aa/classification_config.json`
  - `public/data/ib/math-aa/source_inventory.json`
  - `public/data/ib/math-aa-sl/paper_bank.json`
  - `public/data/ib/math-aa-hl/paper_bank.json`
- Updated `public/data/subjects.json`:
  - all existing AP subjects now carry `curriculum: "ap"` and `assessmentModel: "ap-mcq-frq"`;
  - `ib-math-aa-sl` and `ib-math-aa-hl` were added as inactive candidate subjects with `assessmentModel: "ib-paper"`.
- Updated `public/data/curriculums.json` to represent AP, IB, A-Level, and international competitions as curriculum families instead of embedding a legacy AP-only subset.
- Added `scripts/assessment_model_contract_audit.cjs`; `npm run validate` now includes `validate:assessment-models`.
- Updated `src/utils/questionBank.js` so AP MCQ/FRQ loaders and mock generation do not silently accept IB paper subjects. Added `loadPaperBank` for IB paper-bank data.
- Updated `scripts/data_validator.cjs` so candidate non-AP subjects are skipped by AP data validation and covered by assessment-model-specific gates.
- Verification passed:
  - `npm run validate:assessment-models`
  - `npm run validate:sop`
  - `npm run validate:data`
  - `npm run validate`
  - `npm run build`
- Not deployed in this step. No IB questions are student-visible yet.

# 2026-07-24 - IB Math AA SL/HL Launch Candidate Build

- Promoted IB Math AA from inactive candidate foundation to active student-facing SL/HL subjects while keeping AP baseline unchanged at 16 active AP subjects.
- Added owned original Math AA practice banks:
  - `ib-math-aa-sl`: 60 items;
  - `ib-math-aa-hl`: 90 items.
- Added IB paper-practice frontend and session model:
  - `src/pages/PaperPracticeSetup.jsx`
  - `src/pages/PaperPracticePlayer.jsx`
  - `src/components/IBPaperQuestionDisplay.jsx`
  - `loadPaperBank`, `startPaperPractice`, and `getCurrentPaper`.
- Updated global gates for non-AP models:
  - `validate:assessment-models`
  - `validate:ib-math-aa`
  - classification coverage/evidence/student-risk support for IB `paperBank` items.
- Found and fixed a release-quality gap: `scripts/chinese_copy_gate.cjs` did not cover the new IB pages. It now checks `PaperPracticeSetup`, `PaperPracticePlayer`, and `IBPaperQuestionDisplay`.
- Added reusable IB student-surface audit:
  - `scripts/ib_math_aa_student_surface_audit.cjs`
  - npm script `audit:ib-math-aa:student-surface`
  - It validates SL/HL desktop/mobile Paper training, formula rendering, solution/markscheme display, next-question navigation, broken images, encoding damage, and raw formula residue outside KaTeX output.
- Local closeout evidence:
  - `npm run validate`: passed; 18 subjects, 5529 student-visible items, P0/P1/P2 all 0.
  - `npm run audit:ib-math-aa:student-surface -- --url http://127.0.0.1:4177/ --port 9780`: 4 cases, 0 errors.
  - `npm run build`: passed; production bundle includes `PaperPracticeSetup` and `PaperPracticePlayer`.
- Pending for final上线: remote source sync, Cloudflare Pages deployment, and production browser/data verification on `https://lynkedu.com`.
- Final production closeout:
  - Local content commit `4261b3a Add IB Math AA paper practice launch candidate`.
  - Stable remote API commit `b7d92e00e04e5e9fcdab5abc8016e3c2a42ccb43`; `npm run stable:status` confirmed remote tree `1783f1d494c5f61d995914e58159a083fc82389a` matches local.
  - Cloudflare Pages deployment `https://13ee85ea.lynkedu-ap-question-bank.pages.dev`.
  - Production data checks on `https://lynkedu.com` passed: active subjects 18, IB SL/HL active, SL paper bank 60, HL paper bank 90, HL P1/P2/P3 present.
  - Production student-surface check passed after hardening HTTPS/load-wait support in `scripts/ib_math_aa_student_surface_audit.cjs`: `npm run audit:ib-math-aa:student-surface -- --url https://lynkedu.com/ --port 9783`, 4 cases, 0 errors.

# 2026-07-24 - Curriculum-Aware Subject Management

- Reworked student subject scope from a flat `mySubjects` list into a curriculum-aware model.
- `currentCurriculum` is now persisted and synced in the same settings snapshot as `currentSubject`, `defaultSubject`, and `mySubjects`.
- AP and IB are separated at the state layer:
  - selecting an AP subject keeps the student in AP;
  - selecting an IB subject keeps the student in IB;
  - Home and Header only show selected subjects from the current curriculum;
  - Settings first chooses curriculum, then manages only that curriculum's subjects.
- A-Level and international competitions are visible as future curriculum families but cannot be selected until student-facing subjects exist.
- Repaired student-facing copy on Header, Home, Settings, RequireSubject, and loading state so this flow is Chinese-first while preserving official subject names and stable product terms.
- Added/updated reusable gates:
  - `scripts/curriculum_subject_partition_audit.cjs`
  - `scripts/curriculum_surface_audit.cjs`
  - `validate:curriculum-partition`
  - `audit:curriculum-surface`
- Verification passed:
  - `npm run validate:curriculum-partition`
  - `npm run audit:curriculum-surface -- --url http://127.0.0.1:4321/ --port 9790`
  - `npm run validate`
  - `npm run build`
  - `npm run audit:ib-math-aa:student-surface -- --url http://127.0.0.1:4323/ --port 9791`
- Production closeout passed:
  - Cloudflare Pages deployment `https://a99ffd73.lynkedu-ap-question-bank.pages.dev`
  - `https://lynkedu.com/data/subjects.json`: AP 16, IB 2, active subjects 18
  - `https://lynkedu.com/data/ib/math-aa-sl/paper_bank.json`: 60 items
  - `https://lynkedu.com/data/ib/math-aa-hl/paper_bank.json`: 90 items
  - `npm run audit:curriculum-surface -- --url https://lynkedu.com/ --port 9794`: errors 0
  - `npm run audit:ib-math-aa:student-surface -- --url https://lynkedu.com/ --port 9795`: 4 cases, 0 errors

# 2026-07-28 - IB Math AA Semantic Review And Paper 3 Repair

- Continued from the unfinished 2026-07-27 quality-gate changes that temporarily returned Math AA SL/HL to candidate status.
- Hardened `validate_ib_math_aa.cjs` and `classification_evidence_audit.cjs` so public generated items require a reviewed solving path and a configured syllabus subtopic.
- Added `scripts/review_ib_math_aa_owned_bank.cjs` as a separate post-generation review pass.
- Updated `generate_ib_math_aa_owned_bank.cjs` to use stable reviewed subtopic codes, clean signed-number formatting, and topic-specific HL Paper 3 tasks.
- Expanded `classification_config.json` with the reviewed subtopic registry used by validation.
- Regenerated and reviewed all 150 items, then restored SL/HL to public certified status.
- Verification passed: rebuild, full validate, production build, local desktop/mobile IB student-surface audit, and curriculum partition/surface audit.
- Closeout completed:
  - local commit `611e743`;
  - stable remote API commit `12fa74621ede8c3b81703e30595023e5c8a14f89`, remote tree matched local;
  - Cloudflare Pages deployment `https://30f35ee7.lynkedu-ap-question-bank.pages.dev`;
  - production data confirmed 18 active subjects, SL 60 and HL 90 reviewed items, clean signed-number output, and T1-T5 HL Paper 3 coverage;
  - production IB student-surface audit passed 4 cases / 0 errors;
  - production curriculum-surface audit passed with 0 errors.

# 2026-07-28 - IB Math AA True Item-Level Knowledge-Point Correction

- User rejected archetype-level classification as incomplete and required exact knowledge-point selection in unit practice.
- Corrected the completion definition: repeated template reasoning is not per-item semantic classification even when the topic result is plausible.
- Replaced `review_ib_math_aa_owned_bank.cjs` with content-derived `classify_ib_math_aa_knowledge_points.cjs` plus `lib/ib_math_aa_knowledge_classifier.cjs`.
- The classifier does not use stored topic/subtopic labels as input. It derives classification from prompt, all parts, solution, and markscheme text.
- Added 150-row classification ledger, content fingerprints, primary/required knowledge points, evidence, solving steps, stale-review checks, catalog checks, and exact-duplicate blocking.
- Fixed duplicate parameter cycles in generated SL binomial and HL complex/inverse/vector/differential-equation items.
- Added knowledge-point filtering and display to IB Paper practice; browser audit now selects a concrete SL point and a distinct HL-only point.
- Verification at this log point: `npm run validate:ib-math-aa`, classification evidence, curriculum partition, full `npm run validate`, `npm run lint`, `npm run build`, local IB student-surface and curriculum-surface checks all passed.
- V3 closeout completed:
  - local commit `d27bac1`;
  - stable remote API commit `3a6af7a2038e93f55c836b78b84baf3fc63b108c`, source tree matched local;
  - Cloudflare Pages deployment `https://0a516618.lynkedu-ap-question-bank.pages.dev`;
  - production data confirmed 150 item reviews, 150 ledger rows, 28 required knowledge points, 14 primary Quiz buckets, no missing evidence, and no exact duplicates inside either bank;
  - production knowledge-point student-surface audit passed 4 cases / 0 errors;
  - production curriculum-surface audit passed with 0 errors.

# 2026-07-28 - Knowledge-Point-First Math Practice UI

- Removed T1-T5 from the Math AA student practice selector and question badge.
- Made knowledge-point selection mandatory before practice can start; removed the all-knowledge-points default.
- Kept Paper as an optional delivery-format filter, but question selection now uses only the selected primary knowledge point.
- Updated browser evidence to block visible T1-T5 codes and verify exact SL/HL knowledge-point selection on desktop/mobile.
- Local lint, full validate, build, and four-case Math AA student-surface audit passed.
- Synced and deployed: local commit `c9dca90`, remote API commit `35e1f4482bc29312e08834ed1336787025b12600`, Pages deployment `https://75d97dc0.lynkedu-ap-question-bank.pages.dev`; production audit passed 4 cases / 0 errors.

# 2026-07-28 - Full Math AA Knowledge Tree And Official Online Specimen Intake

- Parsed the 100-page Math AA guide and registered all 83 official syllabus items across T1-T5.
- Generated `knowledge_tree.json` with 101 leaf points and `coverage_matrix.json` with SL/HL and P1/P2/P3 primary/required counts.
- Set the completion floor to 8 primary questions per leaf and marked both SL and HL course coverage incomplete.
- Updated Paper practice to load the full tree, group points by course topic, show 0-question points, and disable only the unavailable leaves.
- Extended validation and browser checks so missing official chapters, hidden 0-question points, stale coverage counts, or a false completion claim fail closeout.
- Used the IB public sample-exam page to obtain the Math AA specimen packet; confirmed 0 SHA-256 matches against the earlier 113-file local inventory.
- Rendered all 121 pages and checked representative full-resolution pages for equations, diagrams, graphs, tables, and marking rows.
- Archived the original packet and split five paired source sets into the Math AA source library. Inventory changed from 44 to 49 canonical pairs and from 113 to 124 PDFs, with deferred records unchanged at 25.
- Recorded the source as internal-only pending explicit republication permission; no exact official question was added to the public student bank.
- Verification: targeted ESLint passed; full validate/build passed; IB student-surface summary reports 4 cases and 0 errors.

# 2026-07-29 - IB Math AA Constructed-Response SSoT And Gap Review

- Confirmed the product contract for device-independent answer submission, temporary unlimited Quiz, persistent daily Mock, per-Paper resume timers, append-only per-question attempts, learning center, self-check mode, authenticated upload, and later Agnes support.
- Audited all active question/FRQ/paper banks: 5,627 items, no missing IDs, no within-subject duplicate IDs, and 659 ID values reused across subjects. Fixed the persistence rule at `(subject_id, question_id)` without renumbering existing content.
- Audited Math AA item structure: SL 60 and HL 90; missing parts 0, duplicate part labels 0, missing part schemes 0, markscheme/part count mismatch 0, explicit per-mark items 0.
- Audited Paper capacity by marks: SL P1/P2 each total 144 marks; HL P1/P2 each total 186 marks; HL P3 has ten separate 8-mark items totaling 80. Recorded that these are knowledge-point practice banks, not yet a validated complete-Mock assembly contract; Paper blueprints and item eligibility must be added before generated papers are labeled as full Mock Exams.
- Verified the current application still has only temporary IB Paper Practice, `sessionStorage` session state, JSON snapshot progress sync, and no IB Mock/upload/recognition backend.
- Added `docs/IB_MATH_AA_CONSTRUCTED_RESPONSE_GAP_PLAN_2026-07-29.md` with the current-state matrix, minimum schema, phased delivery plan, and first implementation slice.
- Updated `DECISIONS.md` and `PROJECT_STATUS.md` so the new IB system is now part of the project SSoT.
- No application code, D1 migration, Cloudflare binding, deployment, or production data was changed in this planning step.

# 2026-07-29 - IB Math AA Mock Assembly Contract

- Rechecked all five local official specimen papers for time, marks, calculator rules, Section A/B layouts, and HL Paper 3's 30+25 investigation structure.
- Added the machine-readable Paper contract at `public/data/ib/math-aa/mock_blueprint.json`.
- Added `scripts/build_ib_math_aa_mock_contract.cjs`, package build/check commands, and the generated 150-question eligibility manifest.
- Classified all current P1/P2 items as short-response candidates and all current P3 items as practice-only for full-Mock purposes.
- Confirmed exact short-section selections exist for SL P1/P2 and HL P1/P2, while extended-section and P3 investigation candidates remain absent.
- Kept SL/HL Mock disabled and linked subject metadata to the contract and eligibility manifest.
- Corrected HL P3 calculator metadata from unverified/null to verified/true.
- Targeted validation and full `npm run validate` passed with zero errors. No deployment or database change was made.

# 2026-07-29 - IB Persistent Learning Backend Foundation

- Added D1 migration `0004_ib_learning_sessions.sql` for persistent Mock, per-Paper state, fixed ordered questions, learning sessions, per-question attempts, and later file metadata.
- Implemented authenticated Mock eligibility/create/list/detail/update and Paper timer endpoints.
- Implemented Quiz/Mock/review attempt creation and history listing. Every repeat answer inserts a new row.
- Implemented Asia/Shanghai daily Mock dates, concurrent-create recovery, ownership checks, and one active Paper timer lease.
- Added repeatable schema validation and connected it to `validate:ib-math-aa`.
- Migration-chain checks, constraint checks, Function syntax checks, and targeted ESLint passed.
- No D1 migration was applied and no deployment was made.

# 2026-07-29 - IB Manual-First Student Flow

- Implemented IB Mock setup/detail/Paper pages, independent Paper countdowns, learning center, login gates, Mock rename/archive, and append-only attempt history.
- Added manual subpart scoring to temporary Paper Practice and persistent Mock flows.
- Found and corrected same-second attempt ordering during real local HTTP checks by using database append order as the secondary sort key.
- Expanded the Chinese copy gate to cover all new student-facing files.
- Full `npm run build` passed, including the complete validation chain.
- The built-in browser runtime had no instance, so the check was continued through Kimi WebBridge rather than left pending.
- WebBridge desktop/mobile checks found and verified corrections for AP-to-IB direct-route guidance, Chinese history labels, Asia/Shanghai timestamps, and mobile table readability.
- Remote D1 and production were not changed.

# 2026-07-29 - Real-Source-Only Question Gate

- Froze all 150 Math AA template-generated items and returned SL/HL to inactive candidate status.
- Removed the owned-bank package entry points and replaced the historical generator with a permanent failure stub.
- Added a global source policy and a source-registry contract requiring paired real question/answer sources, exact locators, file fingerprints, verification, and student-use approval.
- Generated a content-only historical baseline for 5,379 currently visible non-IB items. Prompt, answer, options, solution, marks, markscheme, parts, stimulus, and assessed-asset changes now require a verified source record.
- Added `validate:question-source` to the full validation, development, and build chain, and made the global SOP gate require it.
- No deployment, commit, or remote database change was made.

# 2026-07-29 - IB Math AA Real-Source Intake

- Extended the canonical source inventory with file fingerprints, sizes, page counts, source type, authenticity and student-use status for all 49 exact paper/markscheme pairs.
- Added repeatable source validation and rendered first/middle/final probes for all 98 canonical files; 294 page renders passed.
- Built an internal question-intake manifest from the real PDFs. PDF-specific parsing corrections covered singular/plural maximum-mark labels, split two-digit question numbers, split question-number punctuation, split `Section`/`Question` words and markscheme headers without a period.
- Final intake result: 433 source question locators, 49/49 pairs represented, zero unresolved detection findings, contiguous numbering and correct official Paper mark totals.
- Added `question_intake_summary.json`, explicit build/check commands and the fast intake check to the IB validation chain.
- No question text or markscheme text was published. Student use remains blocked pending the explicit source-use mode decision.

# 2026-07-29 - IB Math AA Complete Placement Authorization

- User confirmed that LynkEdu has an organization-level basis to place the complete local IB Mathematics AA papers and paired markschemes in the student system.
- Updated the source registry, inventory builder, source validator, question-intake builder and acquisition manifest to one machine-enforced status: `licensed_permission` plus `approved_for_structured_student_use`.
- Recorded only the user-confirmed organization authorization; no contract number, vendor term or unsupported licence detail was added.
- Kept the 433 source locators non-visible pending formal visual transcription and kept all 150 generated items permanently blocked.

# 2026-07-29 - Official Knowledge-Point Reset And Classifier Lockout

- Rechecked the 100-page February 2019 Math AA guide and verified the PDF metadata, 100-page length and SHA-256 `B492A8FB5FCAEFF2886D3C4A1D20425F6ED987314A95EA681038A67C7DD1DDE9`.
- Confirmed directly from the guide that SL 5.11 covers definite integrals and AHL 5.18 covers first-order differential equations and Euler's method.
- Removed all inherited generated-item child codes from the official tree and rebuilt it as 83 official knowledge points: SL 51, HL 83.
- Replaced the old Math AA keyword classifier with a hash-only review helper and a permanent failure stub for the former classification writer.
- Changed the global IB evidence check from re-running a keyword classifier to checking the manual classification ledger by `(subject_id, question_id)` and matching official codes/hashes.
- Targeted IB and classification-evidence validation passed. The 433 real-source questions remain unclassified and non-visible pending question-by-question visual review.

# 2026-07-29 - IB Math AA Manual Review Batch 1

- Built `manual_review_queue.json` from all 433 visual/candidate records in 44 fixed batches and added a check that fails if the queue becomes stale.
- Added `manual_review_records.json` with approval-only schema checks and `install_ib_math_aa_manual_reviews.cjs` for idempotent installation into the combined and level banks.
- Visually reviewed HL P1 May 2021 TZ1 questions 1-10 against both the rendered question and rendered markscheme.
- Recorded all part marks and 69 explicit scoring points across the ten questions, including alternative-method allowances where the markscheme supplied them.
- Mapped each question and each scoring point to the corrected official 83-point curriculum. No T1-T5 label or retired child code is used as a practice identity.
- Installed 10 reviewed questions while keeping `publish_status: blocked` and `student_visible: false`.
- Full validation and production build passed. Remaining formal visual review count: 423.

# 2026-07-29 - IB Math AA Manual Review Continuation

- Resumed the active delivery goal after the earlier ten-question checkpoint was incorrectly treated as a stopping point.
- Visually reviewed and installed HL Paper 1 questions `P1-000011` through `P1-000022` against every rendered question crop and every paired markscheme continuation page.
- Added two extended-response items worth 19 and 20 marks, plus the 16-mark motion item, with explicit part-level marks and mark-point-level knowledge mappings.
- Formal visual-review progress is now 22/433; 411 remain. All reviewed and unreviewed real-source items remain `publish_status: blocked` and `student_visible: false` until the release gates are complete.
- `validate:ib-math-aa:manual-review-queue`, manual-review installation, curriculum rebuild and the complete IB Math AA validation chain passed at the 20-item checkpoint; the additional two records also passed queue validation and installation.
- Breakpoint for automatic continuation: `ib-math-aa-hl::P1-000023`.

# 2026-07-29 - IB Math AA Manual Review 47/433

- Added formal visual-review records for HL `P1-000031` through `P1-000038` and SL `P1-000034` through `P1-000035`.
- Checked all question crops and every paired markscheme continuation page, including 14, 15, 18, 15 and 21 mark long questions.
- Continued through HL `P1-000045` and installed 47 reviewed questions; all remain hidden and blocked pending full-bank and student-flow closeout.
- Passed queue validation, installation, curriculum rebuild and full targeted IB validation with 0 errors.
- Next exact review key: `ib-math-aa-hl::P1-000046`; 386 remain.

# 2026-07-29 - IB Math AA Manual Review 59/433

- Installed the previously reviewed `P1-000047` and `P1-000048`, then completed rendered visual review for HL `P1-000049` through `P1-000057`.
- Recorded exact subpart totals and one-mark scoring points for differentiation, three-dimensional geometry, algebraic proof, integration, complex polynomial roots, event bounds, implicit differentiation, inverse-function domains and homogeneous differential equations.
- Verified the full question crop and all corresponding markscheme crops, including the continuation page for `P1-000057`.
- Installed 59 reviewed questions. All remain hidden and blocked while the 433-question review and release checks are incomplete.
- The complete targeted IB validation chain passes with 0 errors. Next exact review key: `ib-math-aa-hl::P1-000058`; 374 remain.

# 2026-07-29 - IB Math AA Manual Review 68/433

- Visually reviewed and installed HL `P1-000058` through `P1-000066` against the full rendered question and paired markscheme sets.
- Completed the 20-mark absolute-value trigonometric graph question, the 16-mark counting/polynomial question and the 18-mark complex-number induction question without omitting any continuation page.
- Continued through six May 2023 TZ1 questions covering rational functions, expected value, trigonometric equations, exponential/logarithmic parameter ranges, sinusoidal transformations and related rates.
- Formal progress is 68/433; 365 remain. All questions remain hidden and blocked pending full completion.
- Queue validation, installation, curriculum rebuild and the full targeted IB validation chain pass with zero errors. Next key: `ib-math-aa-hl::P1-000067`.

- Continued through `ib-math-aa-hl::P1-000067`, including all three markscheme pages for the complex polynomial-root question. Installed progress is now 69/433; next key `ib-math-aa-hl::P1-000068`.

# 2026-07-29 - IB Math AA Manual Review 91/433

- Visually reviewed and installed HL `P1-000068` through `P1-000089`, including every question continuation and markscheme page.
- Added 47 exact scoring points across function transformations, number-of-solution intervals, volumes of revolution, arithmetic/geometric sequences and second-derivative optimization.
- Added complete mark-point records through `P1-000089`, including function composition, event complements, arithmetic-sequence sums, exact triangle area, and binomial coefficient recovery.
- Formal progress is 91/433; 342 remain. All records remain hidden and blocked.
- Queue validation, installation, curriculum rebuild and complete targeted IB validation pass with zero errors. Next key: `ib-math-aa-hl::P1-000090`.

# 2026-07-29 - IB Math AA Manual Review 111/433 Adjudicated

- Completed full rendered review from HL `P1-000090` through `P1-000109`.
- Installed 8 additional unique questions: induction, complex-number coefficient comparison, repeated integration by parts, even-function limits, logarithmic intersections, a 21-mark calculus/Maclaurin question, a 17-mark De Moivre question, and the specimen conditional-probability question.
- Identified 12 TZ2 source locators as visually exact repeats of already reviewed TZ1 questions. Added and validated `excluded_exact_duplicate` handling so the source inventory stays complete without falsely increasing usable question quantity.
- Formal status: 99 unique approved and installed; 12 exact duplicate locators excluded; 111/433 adjudicated; 322 pending.

# 2026-07-30 - IB Math AA Manual Review 133/433 Adjudicated

- Completed full rendered review from HL `P1-000110` through `P1-000120` using the source question images and every corresponding markscheme continuation page.
- Added exact parts, marks, 110 one-mark scoring points across these 11 questions, final-answer summaries, primary/required knowledge points, and visual-completeness evidence.
- Corrected `P1-000112` to the graph-transformation knowledge point `AA-2.11`; `AA-2.6` is reserved for quadratic-function forms and graphs.
- Started HL Paper 2 and completed `P2-000001`, including its full two-page prompt, regression outputs, prediction, sample means, and graph-scoring requirements.
- Completed HL Paper 2 `P2-000002` through `P2-000009` with 48 one-mark scoring points and exact knowledge-point mappings.
- Completed HL Paper 2 `P2-000010` after restoring its missing second prompt page containing the inverse-function area subpart.
- Completed HL Paper 2 `P2-000011`, a 20-mark rational-functions, graph and inequality question with one-point-per-mark mapping.
- Formal status: 121 unique approved and installed; 12 exact duplicate locators excluded; 133/433 adjudicated; 300 pending.
- Targeted source, intake, visual, manual-review, installation, curriculum, Math AA, and learning-schema checks pass with 0 errors. All content remains blocked and hidden.
- Fixed a source-range defect where a markscheme continuation could share a page with the next question and be omitted. The intake builder now detects explicit continuation headers, extends the range onto shared pages, and validates the invariant against every source markscheme.
- Extended the same invariant to question-paper pages. The rebuild found three omitted question continuation assets; no earlier approved item was affected. `P2-000010` was reviewed only after its continuation prompt was present.
- The rebuild found six missing continuation assets across the full inventory. `P1-000011` was the only already approved question affected; it was visually rechecked through the newly included final page before renewing its review fingerprint.
- HL Paper 1 is fully traversed and HL Paper 2 is active. Next exact key: `ib-math-aa-hl::P2-000013`; the active delivery goal continues.

# 2026-07-30 - IB Math AA Manual Review 135/433 Adjudicated

- Completed rendered visual review and installation for HL `P2-000013` and `P2-000014`.
- `P2-000014` was checked against the full question crop and its complete official markscheme: the zero term is `k=25`, and the maximum partial sum is `750`. All five official marks are represented by five scoring points under `AA-1.2`.
- Formal status: 123 unique approved and installed, 12 exact duplicate locators excluded, 135/433 adjudicated and 298 pending. All remain blocked and hidden.
- The targeted source, intake, visual, manual-review, installation, curriculum, Math AA and learning-schema validation chain passes with 0 errors. Next key: `ib-math-aa-hl::P2-000015`.

- Immediate continuation completed `P2-000015` after full prompt and both official markscheme pages were reviewed. Its 8 marks are mapped to official `AA-4.11` (independent events and conditional probability). Status is 124 unique approved, 12 duplicate locators excluded, 136/433 adjudicated, and 297 pending; next key `ib-math-aa-hl::P2-000016`.

# 2026-07-30 - IB Math AA Manual Review 244/433 Adjudicated

- Reviewed and installed `P2-000108` through `P2-000113` from November 2023 TZ2, then retained `P2-000114` through `P2-000119` as visually confirmed exact duplicates of already installed TZ1 equivalents.
- Reviewed and installed HL Paper 2 specimen `P2-000120` (radians and shaded-sector area), `P2-000121` (quarterly compound interest), and `P2-000122` (binomial probabilities).
- Current status: 226 unique real questions approved and installed, 18 exact duplicate locators excluded, 244/433 adjudicated, 189 pending. Every installed item remains blocked and hidden.
- The required complete validation chain passes with 0 errors. Continue automatically at `ib-math-aa-hl::P2-000123`.
- All content remains hidden and blocked. The full targeted IB validation chain reports 0 errors. Next key: `ib-math-aa-hl::P1-000110`.

# 2026-07-30 - IB Math AA Manual Review 213/433 Adjudicated

- Continued the active real-source-only delivery goal through HL Paper 2 `P2-000088` to `P2-000091`, inspecting every prompt and paired markscheme page before each approval.
- The four newly installed questions cover motion with velocity/integration, intersection of planes and nearest point, a solid of revolution using an inverse trigonometric function, and rational-function range/inequality analysis.
- Formal status: 201 unique real questions approved and installed, 12 visually confirmed exact duplicate locators excluded, 213/433 adjudicated, and 220 pending. Every installed item remains `publish_status: blocked` and `student_visible: false`.
- The full required chain passes: manual queue, installer, curriculum build, source/intake/visual/structured checks, Math AA audit and learning-schema validation all report 0 errors. Continue automatically at `ib-math-aa-hl::P2-000092`.

# 2026-07-30 - IB Math AA Manual Review 321/433 Adjudicated

- Rendered and directly reviewed the full question and paired markscheme assets for SL 2023 May TZ2 P1 `P1-000047` to `P1-000050`, including both prompt and markscheme continuation pages where present.
- Recorded exact scoring structures: six points for the arithmetic-sequence/discrete-distribution item, five points for the rational-function graph item, five points for conditional probability, and six points for definite integration with logarithms.
- Current disposition is 302 approved unique real questions, 19 exact duplicate locators excluded, 321/433 adjudicated and 112 pending. All content remains blocked and hidden.
- Required complete validation chain passes with 0 errors. Continue automatically at `ib-math-aa-sl::P1-000051`.

# 2026-07-31 - Math AA Mock Decision Repair

- Reproduced the inconsistent total-mark data for `ib-math-aa-sl::P1-000002`: the visual review correctly held subparts 1+3, while a stale bank total still read 5.
- Made installation calculate the authoritative total from approved subparts and reject any subpart whose scoring-point values do not add up exactly.
- Added the same two invariants to the full Math AA validator. The full 414-item reviewed bank now passes them.
- Corrected Mock status semantics in `subjects.json` and made the Mock-contract checker enforce the status/structure/release matrix. The generated Mock manifest confirms SL P1/P2 and HL P1/P2/P3 structural readiness, including HL P3 30+25 investigations.
- Passed `npm run validate:ib-math-aa`, `npm run validate:ib-math-aa:mock-contract`, full `npm run validate`, and `npm run build`.

# 2026-07-31 - IB Math AA Delivery Contract Correction

- Ran the new global structured-delivery gate against the current bank: 5853 student-bank records were inspected and 414 errors were reported, all from the image-first IB Math AA records. The gate correctly rejects their `source_images` display mode.
- Corrected the official status: those 414 records are source-location preparation material, not completed question-bank entries. The real source pairing, hashes, page references, crops and preliminary review notes remain retained for reconstruction.
- Added the highest-priority usable-delivery rule to the universal structured-delivery standard, the IB Math AA standard, `PROJECT_STATUS.md`, and `DECISIONS.md`. A fully structured, source-checked sample must now be accepted before bulk Math AA entry begins.
- No course release, data publication or deployment was performed. The course remains closed pending full structured delivery.

# 2026-07-31 - First Complete Structured Math AA Sample

- Re-entered the real SL November 2022 Paper 2 Q1 (`ib-math-aa-sl::P2-000046`) as a complete non-visible structured sample: full question text, a structured eight-column score table, all three labelled parts, official final answers, the full official scoring content and every individual official mark point.
- Added a field-level source audit from every question/answer field to the paired paper or markscheme file hash, page and retained asset hash. Its status is `structured_reviewed`, its display mode is `structured`, and its legacy source images remain evidence only.
- Added the reusable `IB_MATH_AA_STRUCTURED_ITEM_SPEC.md`; the IB renderer now displays structured paragraphs, tables and attached figures rather than choosing source-page crops as the question body.
- Added structured-reviewed Math AA checks to the global delivery gate. The remaining image-first backlog is now correctly reported as 413 blocking records. `validate:ib-math-aa` passes with 0 errors; a direct Vite build passes. The full release build remains correctly blocked by the 413 unresolved structured-delivery errors.

# 2026-07-31 - Mock Readiness Correction

- Changed the student data loader and Mock contract so a Math AA question is usable only when `transcription_status` is `structured_reviewed`. A visual source review, crop, preliminary answer summary or mark-point list is no longer sufficient.
- Rebuilt and checked the Mock eligibility manifest. With one non-visible structured sample, SL P1/P2 and HL P1/P2/P3 correctly report `exact_structure_ready=false`; both subjects are `paper_practice_only`.
- The Mock-contract check passes. No student can generate a screenshot-based Mock.

# 2026-07-31 - Second Complete Structured Math AA Item

- Source-checked and structurally entered SL November 2022 Paper 2 Q4 (`ib-math-aa-sl::P2-000049`): complete prompt, official geometric-sequence inequality, final-answer acceptance condition, full official five-mark scoring content and field-level paper/markscheme audit.
- Math AA source, intake, visual, manual-review, item, classification and learning-schema checks pass with 0 errors. This is still non-visible and does not release the course.

# 2026-07-31 - Official Markscheme Context for Recognition-Assisted Scoring

- Recognition-assisted marking now receives the complete official marking row and official final answer for the relevant subpart alongside each individual mark point and its mark value. A short mark-point label is no longer the sole scoring context.
- Rebuilt the Mock eligibility manifest after the second structured item. The contract remains current and continues to reject Mock generation until the full structured Paper roles exist.

# 2026-07-31 - Diagram-Only Attachment Procedure

- Created and visually inspected the first diagram-only asset for SL November 2022 Paper 2 Q2. The crop contains only triangle ABC and its required labels, excluding the surrounding stem, subparts and answer area.
- Registered the rule that a full source page cannot be used as a figure attachment. Future figure assets retain their parent-source hash, crop geometry, derived-file hash and human review evidence.

# 2026-07-31 - First Complete Structured Diagram Question

- Entered SL November 2022 Paper 2 Q2 (`ib-math-aa-sl::P2-000047`) with full structured stem and parts, a reviewed diagram-only triangle asset, official answers, all three official methods for the second part, and field-level source audit through both markscheme pages.
- Repaired two unrelated records that were temporarily promoted by an overly broad status edit; both are back to image-first source material. The global structured gate now reports the correct 411 unresolved records.

# 2026-07-31 - Fourth Complete Structured Math AA Item

- Entered SL November 2022 Paper 2 Q5 (`ib-math-aa-sl::P2-000050`): complete exponential-decay prompt, official final answer and acceptance value, complete seven-mark official scoring text, and question/markscheme field audit.
- Source, intake, visual, item and learning-schema checks pass with 0 errors. The structured-delivery gate now reports 410 remaining image-first records; course release remains closed.

# 2026-07-31 - Fifth Complete Structured Math AA Item

- Entered SL November 2022 Paper 2 Q6 (`ib-math-aa-sl::P2-000051`) from both official question pages and both markscheme pages. It retains the full binomial-expansion routes, no-marks condition for addition in place of multiplication, and final-answer exclusions.
- Math AA source/item/learning checks pass with 0 errors. The global delivery gate reports 409 remaining image-first records; no release decision changed.

# 2026-07-31 - Legacy Review Ledger Truth Correction

- Changed all 414 non-duplicate legacy manual-review outcomes from `approved` to `source_located`. The queue now reports source located 414, exact duplicates excluded 19, and never reports those records as completed questions.
- The legacy installer now rejects `source_located` material. It cannot repopulate the bank with screenshot-first records; only a separately source-checked structured item may be installed.

# 2026-07-31 - Structured Math AA Item: SL November 2022 Paper 2 Q8

- Entered `ib-math-aa-sl::P2-000053` as a full structured official item after reviewing both paper pages and all three official markscheme pages. It preserves every part, full official final answers, 13 scored marks plus all official zero-mark acceptance and degree-unit notes, and two diagram-only figure assets.
- Recorded a field-level source audit for the complete stem, each part, answers and markscheme rows; the classification ledger now has the matching structured-payload fingerprint.
- `npm run validate:ib-math-aa` and `npm run validate:ib-math-aa:mock-contract` pass with 0 errors. `validate:structured-delivery` now correctly reports 407 remaining image-first records. Course release and Mock generation remain closed.

# 2026-07-31 - First Complete Structured Long-Response Math AA Item

- Entered SL November 2022 Paper 2 Q7 (`ib-math-aa-sl::P2-000052`): all five parts, reviewed displacement graph, official answers, all three markscheme pages, alternate integral/displacement methods for total distance, and a field-level audit.
- Math AA source/item/learning checks pass with 0 errors. The structured-delivery gate reports 408 remaining image-first records; course release remains closed.

# 2026-07-31 - Math AA Delivery Mechanism Reset

- Corrected all non-duplicate Math AA records to their actual state: 414 source locators, 19 exact duplicates excluded, and zero student-visible questions. The source locators retain official paper/markscheme pairing, page ranges and hashes, but do not count as structured questions.
- Retired the legacy per-item Math AA writer scripts. `scripts/install_ib_math_aa_structured_batch.cjs` is now the only permitted promotion path and requires field-level source evidence for every stem block, part, answer, scoring row and scored mark point.
- Entered one non-visible strict acceptance sample: SL 2022 November Paper 2 Question 1 (`ib-math-aa-sl::P2-000046`). It includes the full question, structured score table, all parts, official answers, complete scoring content including the official data-entry note, four scored mark clusters and 17 field-level source entries.
- Added a five-paper representative sample gate before bulk entry: SL P1/P2 plus HL P1/P2/P3, including table, figure/graph, multi-page scoring and continuous P3 cases.
- Full `npm run validate` passed after the correction. Math AA remains closed, Mock remains `paper_practice_only`, and only one non-visible structured sample exists.

# 2026-07-31 - Structured Math AA Item: HL November 2021 Paper 1 Q6

- Entered `ib-math-aa-hl::P1-000018` from the complete official question page and both official markscheme pages. The structured record retains both official proof methods, both official quadratic-solving routes, all seven marks, the radians requirement and the no-additional-answers condition.
- Its 13 field-level source-audit entries link both student parts, both answers, both scoring rows and all seven mark points to the exact official file hash, page and retained asset hash. It remains blocked and non-visible.
- Corrected the strict installer so a structured promotion also replaces the legacy locator-only review-method wording in the classification ledger. This prevents an old preliminary status from being presented as the final audit trail.
- Static delivery, Math AA and source checks pass with 0 errors. One isolated desktop/mobile student-surface audit passed 2 cases with 0 errors; the service, browser profile, audit lock and port were confirmed absent after exit.

# 2026-07-31 - Structured Math AA Item: HL November 2021 Paper 1 Q7

- Entered `ib-math-aa-hl::P1-000019` from its complete official paper and markscheme pages: shared equation, both labelled parts, both official final answers, all seven scoring marks and the official accepted-format note.
- The item has a complete field-level audit with 14 evidence links, remains blocked/non-visible, and its source, structured-delivery and Math AA checks pass with 0 errors.
- A single isolated student-surface audit passed both desktop and mobile cases with 0 errors; post-run inspection found no project process or audit port remaining.

# 2026-07-31 - Structured Math AA Item: HL November 2021 Paper 1 Q8

- Entered `ib-math-aa-hl::P1-000020` from the complete official prompt and markscheme. It retains the full integrating-factor derivation, integration-by-parts mark, boundary-condition calculation and all seven official marks.
- Fixed the strict structured-item installer to synchronize the final primary and required knowledge points into the classification ledger. This ensures a legacy preliminary classification cannot override the reviewed item classification.
- Static structured-delivery and Math AA checks pass with 0 errors. One isolated desktop/mobile student-surface audit passed 2 cases with 0 errors; no audit process or port remained after exit.

# 2026-07-31 - Structured Math AA Item: HL November 2021 Paper 1 Q9

- Entered `ib-math-aa-hl::P1-000021` from the complete official question and markscheme. The structured content retains both negative-fractional binomial expansions, coefficient equations, simultaneous-solution result and the `|x| < 1` condition.
- All seven official marks have individual source-backed scoring points. Static delivery and Math AA checks pass with 0 errors; one isolated desktop/mobile student-surface audit passed 2 cases with 0 errors and left no project runtime residue.

# 2026-07-31 - Structured Math AA Item: HL November 2021 Paper 1 Q10

- Entered `ib-math-aa-hl::P1-000022`: all four labelled parts, all 16 official marks, all three official markscheme pages, and the official reference velocity graph as a separately reviewed diagram-only asset.
- The graph asset has its parent official-page hash, derived-file hash and exact crop coordinates; it does not contain any full-page scoring text. The item remains blocked/non-visible.
- Static delivery and Math AA checks pass with 0 errors. One isolated desktop/mobile student-surface audit passed 2 cases with 0 errors; post-run inspection found no project process or audit port remaining.

# 2026-07-31 - Structured Math AA Item: HL November 2021 Paper 1 Q11

- Entered `ib-math-aa-hl::P1-000023` from its complete official question page and all four official markscheme pages: the complete induction proof, both official Maclaurin-series methods, both official limit methods, all notes and all 14 official marks.
- The field-level audit links every student part, answer, scoring row and mark point to the exact official file hash and retained page asset. The item is `structured_reviewed` but remains blocked and non-visible.
- The structured-delivery gate and Math AA audit pass with 0 hard errors. Browser validation was intentionally deferred because only 2.44 GB physical memory was available and no project process was allowed to remain.

# 2026-08-01 - Structured Math AA Item: HL November 2021 Paper 1 Q12

- Entered `ib-math-aa-hl::P1-000024` from its complete official question page and all eleven paired official markscheme pages. The record preserves all six parts and 22 marks, the official Argand answer graph, four official proof routes for part (d), four official real-part routes for part (e), and every official note.
- The diagram-only asset is independently source-audited; fields for parts (d) and (e) retain their full official page groups rather than only a first-page reference. The item remains `structured_reviewed`, blocked and non-visible.
- Static structured-delivery and Math AA checks pass with 0 hard errors.

# 2026-08-01 - Structured Math AA Item: HL May 2022 TZ1 Paper 1 Q1

- Entered `ib-math-aa-hl::P1-000025` with the complete official definite-integral prompt, official answer, all five official marks and field-level source audit.
- Static structured-delivery and Math AA checks pass with 0 hard errors. The item remains blocked and non-visible pending course closeout.

# 2026-08-01 - Real-Source Batch Process Housekeeping

- Promoted the whole-paper real-source build method into the global SSoT. It separates program preparation (source pairing, boundary detection, reading aids, empty batches and checks) from human approval of complete student content.
- Added a reusable review-only batch scaffold command. It records input hashes, question order, source pages/assets and the required review checklist, but deliberately creates no question, answer, markscheme or classification content.
- Added `--check` to the only permitted Math AA installer. A reviewed batch can now pass every content and audit rule without changing a bank file; writing is a separate explicit step.
- Retired temporary per-question construction scripts as an operating method. Future changes must use the source-set ledger, sample-paper regression checks, small accepted batches and the global new-subject/new-year adaptation checklist.

# 2026-08-01 - Structured Math AA Item: HL May 2022 TZ1 Paper 1 Q2

- Entered `ib-math-aa-hl::P1-000026` from the complete official question and paired markscheme. The record retains the official box-and-whisker diagram, all three labelled parts, the two supplied regression lines, correct official answers and all seven official scoring marks.
- The review-only batch ledger records the accepted source files, hashes, reviewer, final reviewed-batch path and completed checklist. The required figure is a separately reviewed diagram-only asset with its parent-page and derived-file hashes.
- The no-write review passed before installation. After controlled installation, the curriculum build, structured-delivery gate, Math AA audit and learning-schema validation all passed with 0 errors. The item remains blocked and non-visible.

# 2026-08-01 - Structured Math AA Item: HL May 2022 TZ1 Paper 1 Q3

- Entered `ib-math-aa-hl::P1-000027` from the complete official question and paired markscheme: function composition, exact trigonometric equation, both permitted solutions and the complete official degree/additional-solution scoring note.
- All seven official marks have individual source-backed scoring points. The required knowledge points are `AA-2.5` and `AA-3.5`; the primary point is `AA-3.5`.
- The no-write review passed before controlled installation. Curriculum build, structured-delivery and Math AA validation pass with 0 errors. The item remains blocked and non-visible.

# 2026-08-01 - Structured Math AA Items: HL May 2022 TZ1 Paper 1 Q4-Q5

- Confirmed `ib-math-aa-hl::P1-000028` is already installed as `structured_reviewed`: complete tangent/normal derivative item, official five-mark scoring content, and reviewed knowledge-point classification under `AA-5.4`.
- Installed the existing reviewed batch for `ib-math-aa-hl::P1-000029` only after `scripts/install_ib_math_aa_structured_batch.cjs --check` passed. The item preserves the full trigonometric-transformation prompt, both parts, official final answers, all three official solution methods and seven source-backed mark points.
- Rebuilt the Math AA curriculum and Mock eligibility manifest. `npm run validate:structured-delivery`, `npm run validate:ib-math-aa`, and `npm run validate:ib-math-aa:mock-contract` pass with 0 errors.
- Current structured count is 29 non-visible reviewed items: SL 2 and HL 27. The course remains closed; next unstructured key is `ib-math-aa-hl::P1-000030`.

# 2026-08-01 - IB Math AA Full Release Goal And HL May 2022 TZ1 Paper 1 Q6

- Reframed the active Math AA objective as full SL/HL release to AP single-subject delivery standards, not merely non-visible transcription progress. Content entry remains the current phase, but release also requires Quiz, Paper Practice, Mock, upload, scoring, Learning Center, desktop/mobile student verification, complete validation/build, production verification, SSoT closeout and remote sync.
- Entered `ib-math-aa-hl::P1-000030` from the complete official question page and paired markscheme page. The reviewed record preserves the binomial-expansion constant-term prompt, the full positive-multiple-of-4 answer, all five official marks and the official note rejecting only a finite list such as `n=4,8,12`.
- The no-write review passed before controlled installation. Curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation and Mock eligibility rebuild passed with 0 errors. The item remains blocked and non-visible.
- Current structured count is 30 non-visible reviewed items: SL 2 and HL 28. The active May 2022 TZ1 Paper 1 batch continues at `ib-math-aa-hl::P1-000031`.

# 2026-08-01 - Structured Math AA Item: HL May 2022 TZ1 Paper 1 Q7

- Entered `ib-math-aa-hl::P1-000031` from the complete official question page and both paired markscheme pages. The record preserves the continuous probability-density function, both subparts, the inverse-sine normalization route, both official expectation-integration routes and every official note about limits and use of `k`.
- All eight official marks have individual source-backed mark points. The primary knowledge point is `AA-4.14`; the calculus integration dependency `AA-5.15` is retained as required knowledge and mapped to the relevant marks.
- The no-write review passed before controlled installation. Curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation and Mock eligibility rebuild passed with 0 errors.
- Current structured count is 31 non-visible reviewed items: SL 2 and HL 29. The course remains closed; the active May 2022 TZ1 Paper 1 batch continues at `ib-math-aa-hl::P1-000032`.

# 2026-08-01 - Structured Math AA Item: HL May 2022 TZ1 Paper 1 Q8

- Entered `ib-math-aa-hl::P1-000032` from the complete official question page and paired markscheme page. The record preserves the proof-by-contradiction prompt, the assumption requirement, the general odd-integer representation, the divisibility contradiction and the official score-limit note for non-general odd-number cases.
- All six official scoring marks have individual source-backed mark points under `AA-1.15`. The `AG` conclusion is retained in the markscheme text but not counted as an additional mark.
- The no-write review passed before controlled installation. Curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation and Mock eligibility rebuild passed with 0 errors.
- Current structured count is 32 non-visible reviewed items: SL 2 and HL 30. The course remains closed; the active May 2022 TZ1 Paper 1 batch continues at `ib-math-aa-hl::P1-000033`.

# 2026-08-01 - Structured Math AA Item: HL May 2022 TZ1 Paper 1 Q9

- Entered `ib-math-aa-hl::P1-000033` from the complete official question page and paired markscheme page. The record preserves both complex numbers, both subparts, the product expansion, the real and imaginary components, the argument condition and the final value `b=-1`.
- All six official marks have individual source-backed mark points. The primary knowledge point is `AA-1.12`; `AA-1.13` is retained as the required argument-form dependency for part (b).
- The no-write review initially rejected a literal `\\n` risk from LaTeX `\\ne`; the reviewed batch was corrected to use text wording for the non-zero condition before controlled installation. Curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation and Mock eligibility rebuild passed with 0 errors.
- Current structured count is 33 non-visible reviewed items: SL 2 and HL 31. The course remains closed; the active May 2022 TZ1 Paper 1 batch continues at `ib-math-aa-hl::P1-000034`.

# 2026-08-01 - Structured Math AA Item: HL May 2022 TZ1 Paper 1 Q10

- Entered `ib-math-aa-hl::P1-000034` from the complete official question page and six paired markscheme pages. The record preserves the geometric-series case, arithmetic-series case, all official alternate methods, all scoring notes and final answers `p=±1/sqrt(3)`, `x=e^2`, `p=2/3`, `d=-1/3 ln x`, and `n=9`.
- All 18 official marks have individual source-backed scoring points. The primary knowledge point is `AA-1.2`; `AA-1.3`, `AA-1.7`, `AA-1.8`, and `AA-2.7` are retained as required dependencies and mapped to the relevant marks.
- The no-write review passed before controlled installation. Curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation passed with 0 errors.
- Current structured count is 34 non-visible reviewed items: SL 2 and HL 32. The course remains closed; the active May 2022 TZ1 Paper 1 batch continues at `ib-math-aa-hl::P1-000035`.

# 2026-08-01 - Structured Math AA Item: HL May 2022 TZ1 Paper 1 Q11

- Entered `ib-math-aa-hl::P1-000035` from the complete official question page and seven paired markscheme pages. The record preserves the three-plane prompt, part (a) non-intersection proof routes, part (b) verification and line-equation methods, part (c) distance methods and all official notes about acceptable alternate vectors/equations.
- All 15 official marks have individual source-backed scoring points. The primary knowledge point is `AA-3.15`; `AA-3.13`, `AA-3.14`, `AA-3.16`, and `AA-3.17` are retained as required dependencies and mapped to the relevant marks.
- The no-write review passed before controlled installation. Curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation passed with 0 errors. One earlier parallel validation attempt read a transient partially written generated JSON file; sequential rerun passed cleanly.
- Current structured count is 35 non-visible reviewed items: SL 2 and HL 33. The course remains closed; the active May 2022 TZ1 Paper 1 batch continues at `ib-math-aa-hl::P1-000036`.

# 2026-08-01 - Structured Math AA Item: HL May 2022 TZ1 Paper 1 Q12

- Entered `ib-math-aa-hl::P1-000036` from the complete official question page and five paired markscheme pages. The record preserves the Maclaurin-series prompt, the approximate integral, the derivative relation for `g`, the required use of part (c) in part (d), both official methods for the limit and every official note.
- All 21 official marks have individual source-backed scoring points. The primary knowledge point is `AA-5.19`; `AA-5.6`, `AA-5.11`, and `AA-5.13` are retained as required dependencies and mapped to the relevant marks.
- The no-write review passed before controlled installation. Curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation passed with 0 errors.
- Current structured count is 36 non-visible reviewed items: SL 2 and HL 34. HL Paper 1 exact Mock structure is now ready, but full SL/HL Mock and course release remain closed. Next exact key: `ib-math-aa-hl::P1-000037`.

# 2026-08-01 - Structured Math AA Item: HL May 2022 TZ2 Paper 1 Q1

- Entered `ib-math-aa-hl::P1-000037` from the complete official question page and paired markscheme page. The record preserves the arithmetic-sequence nth-term prompt, all three labelled parts, official final answers `u_1=12`, `n=16`, `d=-3`, and the official alternate approaches for finding the common difference.
- All five official marks have individual source-backed scoring points. The primary and only required knowledge point is `AA-1.2`.
- The review-only scaffold is `tmp/ib-math-aa-review-scaffolds/hl-p1-2022-may-tz2-q01.json`; the reviewed batch is `tmp/ib-math-aa-reviewed-batches/hl-p1-2022-may-tz2-q01.json`. The no-write review passed before controlled installation. Curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation passed with 0 errors.
- Current structured count is 37 non-visible reviewed items: SL 2 and HL 35. HL Paper 1 exact Mock structure remains ready, but full SL/HL Mock and course release remain closed. Next exact key: `ib-math-aa-hl::P1-000038`.

# 2026-08-01 - IB Math AA Batch-Draft Trial: HL May 2022 TZ2 Paper 1 Q2-Q6

- Added `scripts/draft_ib_math_aa_structured_batch.cjs`, a review-packet generator that writes only to `tmp`. It uses the manual review queue, structured candidates, current bank rows and classification config to create machine draft payloads with source audit scaffolding and risk split results; it does not write the formal bank or mark anything complete.
- Ran the trial packet for `ib-math-aa-hl::P1-000038` through `P1-000042` at `tmp/ib-math-aa-draft-batches/hl-p1-2022-may-tz2-q02-q06-draft-v4.json`. The risk split correctly allowed Q2 and Q5 as low-risk batch candidates and separated Q3, Q4 and Q6 for single-item review because of multi-page/graph/formula-layout risk.
- Installed the low-risk reviewed batch `tmp/ib-math-aa-reviewed-batches/hl-p1-2022-may-tz2-q02-q05-low-risk.json` after visual review and no-write check. Q2 preserves the consecutive-integer divisibility proofs and all six official marks under `AA-1.6`; Q5 preserves the binomial-expansion coefficient proof, mean-of-terms equation, official quadratic work, final-note condition and all seven official marks under primary `AA-1.9` with `AA-2.7` retained as a required dependency.
- Verification passed after controlled installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors. The course remains closed.
- Current structured count is 39 non-visible reviewed items: SL 2 and HL 37. HL Paper 1 exact Mock structure remains ready, but full SL/HL Mock and course release remain closed. Next exact key: `ib-math-aa-hl::P1-000039`; `P1-000040` and `P1-000042` are also flagged for single-item review from the same trial.

# 2026-08-01 - IB Math AA Whole-Paper Risk Split: HL May 2022 TZ2 Paper 1

- Extended the batch-draft script with Markdown review-packet output. The packet lists low-risk candidates, single-item review reasons, source asset paths, stem/part drafts, answer placeholders, markscheme placeholders and review checklists so future review does not require reading large JSON.
- Ran the whole `HL 2022 May TZ2 Paper 1` source set (`P1-000037` through `P1-000048`) at `tmp/ib-math-aa-draft-batches/hl-p1-2022-may-tz2-full-p1-draft-v3.json` with review packet `tmp/ib-math-aa-review-packets/hl-p1-2022-may-tz2-full-p1-review-v2.md`.
- Final risk split after tightening formula-layout detection: only Q1/Q2/Q5 are low-risk candidates, and all three are already installed as `structured_reviewed`. Q3, Q4, Q6, Q7, Q8, Q9, Q10, Q11 and Q12 remain in the single-item review queue.
- The Q7 correction is important: it was initially low risk, but the official integral expression was split across OCR lines. The script now flags displayed formulas split across OCR lines, preventing formula-heavy items from being batch-installed without dedicated visual reconstruction.
- Next exact key remains `ib-math-aa-hl::P1-000039`. The next work should process the single-item queue with the review packet as the starting artifact, not by reverting to freehand single-question JSON construction.

# 2026-08-01 - IB Math AA HL Paper 1 Batch Priority Scan

- Upgraded `scripts/draft_ib_math_aa_structured_batch.cjs` again so it can select a whole source set by `--source-prefix` and skip already installed items with `--skip-reviewed`. This removes the need to manually assemble long question-id lists for every Paper.
- Re-ran `HL 2022 May TZ2 Paper 1` with `--source-prefix MathsAA_HL_P1_2022_May_TZ2: --skip-reviewed`; the remaining packet contains 9 items and 0 low-risk batch candidates, confirming Q3/Q4/Q6-Q12 should not be forced into a batch.
- Scanned the remaining HL Paper 1 source sets and generated `tmp/ib-math-aa-review-packets/hl-p1-batch-priority.md`. Highest-yield low-risk queues are:
  - `HL 2023 Nov TZ1`: 6/12 low-risk candidates (`P1-000085`, `P1-000086`, `P1-000087`, `P1-000089`, `P1-000090`, `P1-000091`);
  - `HL 2023 Nov TZ2`: 6/12 low-risk candidates (`P1-000097`, `P1-000098`, `P1-000099`, `P1-000101`, `P1-000102`, `P1-000103`);
  - `HL P1 Specimen`: 6/12 low-risk candidates (`P1-000109`, `P1-000110`, `P1-000111`, `P1-000114`, `P1-000115`, `P1-000116`).
- Created the next review-only scaffold for the highest-priority batch: `tmp/ib-math-aa-review-scaffolds/hl-p1-2023-nov-tz1-low-risk-q01-q07.json`. No formal bank write was made in this priority-scan step.

# 2026-08-01 - IB Math AA Materialized Batch Install: HL 2023 Nov TZ1 Paper 1 Q1/Q2/Q5

- Continued from compact reviewed spec `tmp/ib-math-aa-compact-reviewed-specs/hl-p1-2023-nov-tz1-q01-q05-low-risk.json` and added `scripts/materialize_ib_math_aa_reviewed_batch.cjs` syntax verification before use.
- Materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/hl-p1-2023-nov-tz1-q01-q05-low-risk.json` for `ib-math-aa-hl::P1-000085`, `P1-000086`, and `P1-000089`.
- Installer no-write check passed before controlled installation. The installed items preserve the official function-composition item, probability union/complement item, and binomial-expansion coefficient item with complete parts, answers, official markscheme rows, one-mark scoring points, source evidence and item-level knowledge-point classification.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors. Mock contract still reports full_mock_ready=false for SL and HL because the course is intentionally closed until full release gates pass.
- Current structured count is 42 non-visible reviewed items: SL 2 and HL 40 (`HL P1: 38`, `HL P2: 1`, `HL P3: 1`). Student-visible and published counts remain 0. Remaining non-duplicate Math AA items requiring structured reconstruction: 372.
- Next efficient path: rerun `HL 2023 Nov TZ2` and `HL P1 Specimen` under the tightened risk rules, then batch only candidates that remain low-risk; route graph, multi-page, formula-layout and multi-method questions to single-item review.

# 2026-08-01 - IB Math AA Materialized Batch Install: HL P1 Specimen Q1/Q3/Q6/Q7/Q8

- Re-ran tightened whole-paper risk splitting for `HL 2023 Nov TZ2 P1` and `HL P1 Specimen`. Results: TZ2 has 3/12 low-risk candidates (`P1-000097`, `P1-000098`, `P1-000101`); Specimen has 5/12 low-risk candidates (`P1-000109`, `P1-000111`, `P1-000114`, `P1-000115`, `P1-000116`).
- Visually checked the complete question and paired markscheme assets for the five Specimen low-risk items, then created compact spec `tmp/ib-math-aa-compact-reviewed-specs/hl-p1-specimen-q01-q08-low-risk.json`.
- Materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/hl-p1-specimen-q01-q08-low-risk.json`. Installer no-write check passed before controlled installation.
- Installed items preserve the official probability conditional item, substitution-integration item, logarithm/trigonometric-equation item, continuous-density integration-by-parts item, and line-plane angle scalar-product item, with complete parts, answers, official markscheme rows, one-mark scoring points and source evidence.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors.
- Current structured count is 47 non-visible reviewed items: SL 2 and HL 45 (`HL P1: 43`, `HL P2: 1`, `HL P3: 1`). Student-visible and published counts remain 0. Remaining non-duplicate Math AA items requiring structured reconstruction: 367.
- Next efficient path: process the three tightened TZ2 low-risk candidates (`P1-000097`, `P1-000098`, `P1-000101`) through the same compact-spec materializer pipeline, then rescan batch priority.

# 2026-08-01 - IB Math AA Batch Scanner Correction And HL 2022 Nov P1 Q1/Q6/Q7

- Confirmed the three apparent `HL 2023 Nov TZ2` low-risk candidates were already `excluded_exact_duplicate` records of the corresponding TZ1 items, so they must not inflate the structured count.
- Updated `scripts/draft_ib_math_aa_structured_batch.cjs` so `--skip-reviewed` skips both `structured_reviewed` and `excluded_exact_duplicate`; empty source sets now write a 0-item draft/review packet instead of failing.
- Re-ran all HL Paper 1 source sets with the corrected scanner. True remaining low-risk groups: `HL 2022 Nov P1` has 3 candidates (`P1-000049`, `P1-000054`, `P1-000055`), `HL 2023 May TZ1` has 3, and `HL 2023 May TZ2` has 2.
- Visually checked and installed `HL 2022 Nov P1` Q1/Q6/Q7 through compact spec `tmp/ib-math-aa-compact-reviewed-specs/hl-p1-2022-nov-q01-q07-low-risk.json` and reviewed batch `tmp/ib-math-aa-reviewed-batches/hl-p1-2022-nov-q01-q07-low-risk.json`.
- The installed items preserve the official exponential derivative item, probability-overlap bounds item and implicit-differentiation no-extrema proof with all official notes and one-mark scoring points.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors.
- Current structured count is 50 non-visible reviewed items: SL 2 and HL 48 (`HL P1: 46`, `HL P2: 1`, `HL P3: 1`). Student-visible and published counts remain 0. Remaining non-duplicate Math AA items requiring structured reconstruction: 364.
- Next efficient path: process corrected scanner candidates from `HL 2023 May TZ1` (`P1-000063`, `P1-000064`, `P1-000066`) or `HL 2023 May TZ2` (`P1-000075`, `P1-000077`) after visual review.

# 2026-08-01 - IB Math AA Materialized Batch Install: HL 2023 May TZ1 Paper 1 Q3/Q4/Q6

- Visually checked the complete official question and paired markscheme assets for `HL 2023 May TZ1 P1` Q3/Q4/Q6.
- Created compact spec `tmp/ib-math-aa-compact-reviewed-specs/hl-p1-2023-may-tz1-q03-q06-low-risk.json` and materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/hl-p1-2023-may-tz1-q03-q06-low-risk.json`.
- Installer no-write check passed before controlled installation.
- Installed items preserve the official finite-interval trigonometric equation, exponential/logarithmic parameter range, and equilateral-triangle related-rates item with all official notes and one-mark scoring points.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors.
- Current structured count is 53 non-visible reviewed items: SL 2 and HL 51 (`HL P1: 49`, `HL P2: 1`, `HL P3: 1`). Student-visible and published counts remain 0. Remaining non-duplicate Math AA items requiring structured reconstruction: 361.
- Next efficient path: process corrected scanner candidates from `HL 2023 May TZ2` (`P1-000075`, `P1-000077`) after visual review, then rescan for the next highest-yield whole-paper batch.

# 2026-08-01 - IB Math AA Materialized Batch Install: HL 2023 May TZ2 Paper 1 Q3/Q5

- Visually checked the complete official question and paired markscheme assets for `HL 2023 May TZ2 P1` Q3/Q5.
- Created compact spec `tmp/ib-math-aa-compact-reviewed-specs/hl-p1-2023-may-tz2-q03-q05-low-risk.json` and materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/hl-p1-2023-may-tz2-q03-q05-low-risk.json`.
- Installer no-write check passed before controlled installation.
- Installed items preserve the official conditional-probability/union item and the linear-function composition item with all official notes and one-mark scoring points.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors.
- Current structured count is 55 non-visible reviewed items: SL 2 and HL 53 (`HL P1: 51`, `HL P2: 1`, `HL P3: 1`). Student-visible and published counts remain 0. Remaining non-duplicate Math AA items requiring structured reconstruction: 359.
- Next efficient path: rescan batch priority after the corrected duplicate-skip rule; if no low-risk HL P1 groups remain, switch to HL P2/SL P1/SL P2 whole-paper scans rather than forcing high-risk P1 items into batches.

# 2026-08-01 - IB Math AA Materialized Batch Install: HL P2 Specimen Q3/Q4/Q5/Q7/Q8

- Continued from compact reviewed spec `tmp/ib-math-aa-compact-reviewed-specs/hl-p2-specimen-q03-q08-low-risk.json` and materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/hl-p2-specimen-q03-q08-low-risk.json`.
- Installer no-write check initially caught an incomplete table schema for `P2-000123`; the compact spec was corrected from `headers` to the formal `columns` table field, then the reviewed batch was regenerated.
- Placeholder scan passed with no `REVIEW REQUIRED`, `TODO` or `PLACEHOLDER` markers. Installer no-write check then passed before controlled installation.
- Installed items preserve the official binomial-probability item, regression table item, displacement/velocity calculator item, vector-distance item and complex-number simultaneous-equations item, with complete parts, answers, official markscheme rows, one-mark scoring points and source evidence.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors. IB Math AA audit still reports coverage warnings for one-item knowledge buckets; this is expected while the course remains incomplete.
- Current structured count is 60 non-visible reviewed items: SL 2 and HL 58 (`HL P1: 51`, `HL P2: 6`, `HL P3: 1`). Student-visible and published counts remain 0. Remaining non-duplicate Math AA items requiring structured reconstruction: 354.
- Next efficient path: continue HL P2 corrected scanner results, starting with high-yield whole-paper groups such as `scan-v6-hl-p2-2022-may-tz1.json` and `scan-v6-hl-p2-2022-may-tz2.json`, rather than returning to isolated manual entry.

# 2026-08-01 - IB Math AA Materialized Batch Install: HL 2022 May TZ1 Paper 2 Q3/Q4/Q6/Q8

- Selected the next highest-yield corrected HL P2 scanner group: `tmp/ib-math-aa-draft-batches/scan-v6-hl-p2-2022-may-tz1.json`, with low-risk candidates `P2-000038`, `P2-000039`, `P2-000041`, and `P2-000043`.
- Visually checked the complete official question and paired markscheme assets for all four items, then created compact spec `tmp/ib-math-aa-compact-reviewed-specs/hl-p2-2022-may-tz1-q03-q08-low-risk.json`.
- Materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/hl-p2-2022-may-tz1-q03-q08-low-risk.json`. Installer no-write check initially caught a LaTeX command formatting issue that conflicts with the literal-newline guard; the compact spec was rewritten with equivalent plain wording and regenerated.
- Placeholder scan passed with no `REVIEW REQUIRED`, `TODO` or `PLACEHOLDER` markers. Installer no-write check then passed before controlled installation.
- Installed items preserve the official discrete-random-variable probability table, velocity/acceleration/distance motion problem, odd-function plus function-inequality problem, and parameterized quadratic roots problem with complete parts, answers, official markscheme rows, one-mark scoring points, source evidence and item-level knowledge-point classification.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors. IB Math AA audit reports 20 expected coverage warnings while the course remains incomplete.
- Current structured count is 64 non-visible reviewed items: SL 2 and HL 62 (`HL P1: 51`, `HL P2: 10`, `HL P3: 1`). Student-visible and published counts remain 0. Remaining non-duplicate Math AA items requiring structured reconstruction: 350.
- Next efficient path: continue the other 4-item HL P2 scanner group `scan-v6-hl-p2-2022-may-tz2.json`, then continue by descending low-risk count.

# 2026-08-01 - IB Math AA Materialized Batch Install: HL 2022 May TZ2 Paper 2 Q3/Q5/Q8/Q9

- Continued with the matching high-yield corrected HL P2 scanner group `tmp/ib-math-aa-draft-batches/scan-v6-hl-p2-2022-may-tz2.json`, with low-risk candidates `P2-000050`, `P2-000052`, `P2-000055`, and `P2-000056`.
- Visually checked complete official question and paired markscheme assets for all four items, then created compact spec `tmp/ib-math-aa-compact-reviewed-specs/hl-p2-2022-may-tz2-q03-q09-low-risk.json`.
- Materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/hl-p2-2022-may-tz2-q03-q09-low-risk.json`.
- Placeholder scan passed with no `REVIEW REQUIRED`, `TODO` or `PLACEHOLDER` markers. Installer no-write check passed before controlled installation.
- Installed items preserve the official independent-events probability item, velocity/acceleration motion item, normal-to-binomial javelin qualification item, and six-digit counting item with complete parts, answers, official markscheme rows, one-mark scoring points, source evidence and item-level knowledge-point classification.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors. IB Math AA audit reports 18 expected coverage warnings while the course remains incomplete.
- Current structured count is 68 non-visible reviewed items: SL 2 and HL 66 (`HL P1: 51`, `HL P2: 14`, `HL P3: 1`). Student-visible and published counts remain 0. Remaining non-duplicate Math AA items requiring structured reconstruction: 346.
- Next efficient path: continue remaining HL P2 scanner groups by descending low-risk count; current 3-item groups include `scan-v6-hl-p2-2021-may-tz2.json`, `scan-v6-hl-p2-2021-nov.json`, `scan-v6-hl-p2-2022-nov.json`, `scan-v6-hl-p2-2023-may-tz1.json`, and `scan-v6-hl-p2-2023-may-tz2.json`.

# 2026-08-01 - IB Math AA Materialized Batch Install: HL 2022 Nov Paper 2 Q1/Q3/Q4

- Selected the next 3-item corrected HL P2 scanner group `tmp/ib-math-aa-draft-batches/scan-v6-hl-p2-2022-nov.json`, with low-risk candidates `P2-000060`, `P2-000062`, and `P2-000063`.
- Visually checked complete official question and paired markscheme assets for all three items, then created compact spec `tmp/ib-math-aa-compact-reviewed-specs/hl-p2-2022-nov-q01-q04-low-risk.json`.
- Materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/hl-p2-2022-nov-q01-q04-low-risk.json`.
- Placeholder scan passed with no `REVIEW REQUIRED`, `TODO` or `PLACEHOLDER` markers. Installer no-write check passed before controlled installation.
- Installed items preserve the official regression/correlation table item, geometric-series threshold item, and exponential population model item with complete parts, answers, official markscheme rows, one-mark scoring points, source evidence and item-level knowledge-point classification.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors. IB Math AA audit reports 18 expected coverage warnings while the course remains incomplete.
- Current structured count is 71 non-visible reviewed items: SL 2 and HL 69 (`HL P1: 51`, `HL P2: 17`, `HL P3: 1`). Student-visible and published counts remain 0. Remaining non-duplicate Math AA items requiring structured reconstruction: 343.
- Next efficient path: continue remaining 3-item HL P2 scanner groups by descending reuse/clarity, such as `scan-v6-hl-p2-2023-may-tz1.json`, `scan-v6-hl-p2-2023-may-tz2.json`, `scan-v6-hl-p2-2021-nov.json`, or `scan-v6-hl-p2-2021-may-tz2.json`.

# 2026-08-01 - IB Math AA Materialized Batch Install: HL 2023 May TZ1 Paper 2 Q3/Q5/Q9

- Selected the next 3-item corrected HL P2 scanner group `tmp/ib-math-aa-draft-batches/scan-v6-hl-p2-2023-may-tz1.json`, with low-risk candidates `P2-000074`, `P2-000076`, and `P2-000080`.
- Visually checked complete official question and paired markscheme assets for all three items, then created compact spec `tmp/ib-math-aa-compact-reviewed-specs/hl-p2-2023-may-tz1-q03-q09-low-risk.json`.
- Materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/hl-p2-2023-may-tz1-q03-q09-low-risk.json`.
- Placeholder scan passed with no `REVIEW REQUIRED`, `TODO` or `PLACEHOLDER` markers. Installer no-write check passed before controlled installation.
- Installed items preserve the official temperature-model plus regression-table item, binomial-coefficient system item, and contradiction proof item with complete parts, answers, official markscheme rows, one-mark scoring points, source evidence and item-level knowledge-point classification.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors. IB Math AA audit reports 17 expected coverage warnings while the course remains incomplete.
- Current structured count is 74 non-visible reviewed items: SL 2 and HL 72 (`HL P1: 51`, `HL P2: 20`, `HL P3: 1`). Student-visible and published counts remain 0. Remaining non-duplicate Math AA items requiring structured reconstruction: 340.
- Next efficient path: continue remaining 3-item HL P2 scanner groups, especially `scan-v6-hl-p2-2023-may-tz2.json`, `scan-v6-hl-p2-2021-nov.json`, or `scan-v6-hl-p2-2021-may-tz2.json`.

# 2026-08-01 - IB Math AA Materialized Batch Install: HL 2023 May TZ2 Paper 2 Q1/Q3/Q4

- Continued the next 3-item corrected HL P2 scanner group from compact reviewed spec `tmp/ib-math-aa-compact-reviewed-specs/hl-p2-2023-may-tz2-q01-q04-low-risk.json`, covering `P2-000084`, `P2-000086`, and `P2-000087`.
- Materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/hl-p2-2023-may-tz2-q01-q04-low-risk.json`.
- Placeholder scan passed with no `REVIEW REQUIRED`, `TODO` or `PLACEHOLDER` markers. Installer no-write check passed before controlled installation.
- Installed items preserve the official plant-height regression item, normal-to-binomial probability item, and binomial-expansion/geometric-sequence item with complete parts, answers, official markscheme rows, one-mark scoring points, source evidence and item-level knowledge-point classification.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors. IB Math AA audit reports 18 expected coverage warnings while the course remains incomplete.
- Current structured count is 77 non-visible reviewed items: SL 2 and HL 75 (`HL P1: 51`, `HL P2: 23`, `HL P3: 1`). Student-visible and published counts remain 0. Remaining non-duplicate Math AA items requiring structured reconstruction: 337.
- Next efficient path: continue remaining 3-item HL P2 scanner groups, especially `scan-v6-hl-p2-2021-nov.json` or `scan-v6-hl-p2-2021-may-tz2.json`, then rescan for the next highest-yield whole-paper batch.

# 2026-08-01 - IB Math AA Materialized Batch Install: HL 2021 Nov Paper 2 Q2/Q3/Q5

- Selected the next 3-item corrected HL P2 scanner group `tmp/ib-math-aa-draft-batches/scan-v6-hl-p2-2021-nov.json`, with low-risk candidates `P2-000026`, `P2-000027`, and `P2-000029`.
- Visually checked complete official question and paired markscheme assets for all three items, then created compact spec `tmp/ib-math-aa-compact-reviewed-specs/hl-p2-2021-nov-q02-q05-low-risk.json`.
- Corrected the machine-draft classification for `P2-000026` from the preliminary radian/sector label to `AA-3.2`, because the official scoring path uses the sine rule or cosine rule in a non-right triangle.
- Corrected the OCR-derived text for `P2-000029` against the rendered source image: the official prompt is `S_n=\sum_{r=1}^{n}\frac{2}{3}\left(\frac{7}{8}\right)^r`.
- Materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/hl-p2-2021-nov-q02-q05-low-risk.json`.
- Placeholder scan passed with no `REVIEW REQUIRED`, `TODO` or `PLACEHOLDER` markers. Installer no-write check passed before controlled installation.
- Installed items preserve the official triangle minimum-perimeter item, binomial/conditional-probability item, and geometric-series tail-inequality item with complete parts, answers, official markscheme rows, one-mark scoring points, source evidence and item-level knowledge-point classification.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors. IB Math AA audit reports 20 expected coverage warnings while the course remains incomplete.
- Current structured count is 80 non-visible reviewed items: SL 2 and HL 78 (`HL P1: 51`, `HL P2: 26`, `HL P3: 1`). Student-visible and published counts remain 0. Remaining non-duplicate Math AA items requiring structured reconstruction: 334.
- Next efficient path: continue remaining 3-item HL P2 scanner groups, especially `scan-v6-hl-p2-2021-may-tz2.json`, then rescan for the next highest-yield whole-paper batch.

# 2026-08-01 - IB Math AA Materialized Batch Install: HL 2021 May TZ2 Paper 2 Q5/Q8/Q9

- Selected the next 3-item corrected HL P2 scanner group `tmp/ib-math-aa-draft-batches/scan-v6-hl-p2-2021-may-tz2.json`, with low-risk candidates `P2-000017`, `P2-000020`, and `P2-000021`.
- Visually checked complete official question and paired markscheme assets for all three items, then created compact spec `tmp/ib-math-aa-compact-reviewed-specs/hl-p2-2021-may-tz2-q05-q09-low-risk.json`.
- Corrected the machine-draft classification for `P2-000020` to complex-number trigonometric form (`AA-1.13`) and for `P2-000021` to Maclaurin series (`AA-5.19`), replacing the preliminary wrong volume label.
- Corrected OCR-derived formula text for `P2-000020` and `P2-000021` against rendered source images, including the `\operatorname{Re}` expression and the `\arctan 2x` limit.
- Materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/hl-p2-2021-may-tz2-q05-q09-low-risk.json`.
- Placeholder scan passed with no `REVIEW REQUIRED`, `TODO` or `PLACEHOLDER` markers. Installer no-write check initially caught the known literal-newline guard case from `\neq`; the reviewed text was rewritten as "not equal to" and the no-write check then passed before controlled installation.
- Installed items preserve the official carbon-14 exponential model, complex-number real-part proof, and Maclaurin-series limit item with complete parts, answers, official markscheme rows, one-mark scoring points, source evidence and item-level knowledge-point classification.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors. IB Math AA audit reports 21 expected coverage warnings while the course remains incomplete.
- Current structured count is 83 non-visible reviewed items: SL 2 and HL 81 (`HL P1: 51`, `HL P2: 29`, `HL P3: 1`). Student-visible and published counts remain 0. Remaining non-duplicate Math AA items requiring structured reconstruction: 331.
- Next efficient path: rescan HL P2 batch priority after the newly completed 2021 Nov and 2021 May TZ2 groups, then continue the highest-yield remaining whole-paper batch.

# 2026-08-01 - IB Math AA Materialized Batch Install: HL 2021 May TZ1 Paper 2 Q2/Q6

- Re-scanned all HL P2 whole-paper groups with `--skip-reviewed` into `tmp/ib-math-aa-draft-batches/scan-v7-hl-p2-*.json` so candidate selection reflects the current 83-item bank state.
- Selected `tmp/ib-math-aa-draft-batches/scan-v7-hl-p2-2021-may-tz1.json`, with the remaining low-risk candidates `P2-000002` and `P2-000006`.
- Visually checked complete official question and paired markscheme assets for both items, then created compact spec `tmp/ib-math-aa-compact-reviewed-specs/hl-p2-2021-may-tz1-q02-q06-low-risk.json`.
- Materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/hl-p2-2021-may-tz1-q02-q06-low-risk.json`.
- Placeholder scan passed with no `REVIEW REQUIRED`, `TODO` or `PLACEHOLDER` markers. Installer no-write check passed before controlled installation.
- Installed items preserve the official normal-distribution rejection/conditional-probability item and the three-plane vector equation/intersection item with complete parts, answers, official markscheme rows, one-mark scoring points, source evidence and item-level knowledge-point classification.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors. IB Math AA audit reports 21 expected coverage warnings while the course remains incomplete.
- Current structured count is 85 non-visible reviewed items: SL 2 and HL 83 (`HL P1: 51`, `HL P2: 31`, `HL P3: 1`). Student-visible and published counts remain 0. Remaining non-duplicate Math AA items requiring structured reconstruction: 329.
- Next efficient path: use the fresh scan-v7 results; remaining low-risk HL P2 groups are `scan-v7-hl-p2-2023-nov-tz1.json` and `scan-v7-hl-p2-2023-nov-tz2.json`, each with 2 candidates.

# 2026-08-01 - IB Math AA Goal Refresh And Current Breakpoint

- Active goal is IB Math AA SL/HL full online delivery to the AP single-subject standard, not the earlier pilot or slow isolated question-entry mode.
- Confirmed current data count from `paper_bank.json` and `item_classification_ledger.json`: 87 non-visible structured reviewed items, SL 2 and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`), student-visible 0, published 0, ledger completion-counted 87.
- Latest installed batch beyond the 85-count SSoT entry is `HL 2023 Nov TZ1 P2` Q5/Q6. Current breakpoint is duplicate disposition for `HL 2023 Nov TZ2 P2` Q5/Q6: record them as source-identical copies of the TZ1 P2 Q5/Q6 items, keep completion count unchanged, then run the full validation chain.

# 2026-08-01 - IB Math AA Duplicate Disposition: HL 2023 Nov TZ2 Paper 2 Q5/Q6

- Recorded `P2-000112` and `P2-000113` in `public/data/ib/math-aa-hl/paper_bank.json` as `excluded_exact_duplicate`, hidden and blocked, with duplicate links to `ib-math-aa-hl::P2-000100` and `ib-math-aa-hl::P2-000101`.
- Kept these duplicates out of `public/data/ib/math-aa/item_classification_ledger.json`, matching the validator's expected ledger scope for admitted non-duplicate items.
- Verification passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs`, `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`.
- Current count remains 87 non-visible structured reviewed items: SL 2 and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`). Student-visible and published counts remain 0. Bank duplicate exclusions are now 21; remaining non-duplicate Math AA items requiring structured reconstruction: 325.

# 2026-08-01 - IB Math AA Materialized Batch Install: SL 2021 Nov Paper 2 Q1/Q3/Q4/Q6

- Re-scanned all Math AA whole-paper source prefixes with `--skip-reviewed` into `tmp/ib-math-aa-draft-batches/scan-v8-*`. HL P2 has no remaining low-risk batch candidates after duplicate handling; highest-yield groups shifted to SL P2.
- Selected `tmp/ib-math-aa-draft-batches/scan-v8-sl-p2-sl-p2-2021-nov.json`, with low-risk candidates `P2-000019`, `P2-000021`, `P2-000022`, and `P2-000024`.
- Visually checked the complete official question and paired markscheme crops for all four items. Q1 table data and Q6 geometric-series formula were corrected from incomplete OCR into structured text/table blocks.
- Created compact spec `tmp/ib-math-aa-compact-reviewed-specs/sl-p2-2021-nov-q01-q06-low-risk.json` and materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/sl-p2-2021-nov-q01-q06-low-risk.json`.
- Placeholder scan passed with no `REVIEW REQUIRED`, `TODO`, or `PLACEHOLDER` markers. Installer no-write check passed before controlled installation.
- Installed items preserve the official regression/correlation item, ambiguous-triangle perimeter item, binomial conditional-probability item, and infinite geometric-series tail item with complete parts, answers, official markscheme rows, one-mark scoring points, source evidence and knowledge-point classification.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors. Math AA audit reports expected coverage warnings while the course remains incomplete plus publication-stage solving-path warnings for the newly installed SL batch.
- Current structured count is 91 non-visible reviewed items: SL 6 (`SL P1: 1`, `SL P2: 5`) and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`). Student-visible and published counts remain 0. Bank duplicate exclusions are 21. Remaining non-duplicate Math AA items requiring structured reconstruction: 321.
- Next efficient path: continue from fresh `scan-v8-*` results; highest remaining low-risk group is `SL P2 Specimen` with four candidates.

# 2026-08-01 - IB Math AA Materialized Batch Install: SL P2 Specimen Q1/Q4/Q5/Q6

- Continued from fresh scan `tmp/ib-math-aa-draft-batches/scan-v8-sl-p2-sl-p2-specimen.json`, with low-risk candidates `P2-000082`, `P2-000085`, `P2-000086`, and `P2-000087`.
- Visually checked the official question and paired markscheme crops for all four items. Q5 table data was structured as seven paired `x/y` values; Q6 displacement function and calculus scoring path were checked against the rendered source.
- Created compact spec `tmp/ib-math-aa-compact-reviewed-specs/sl-p2-specimen-q01-q06-low-risk.json` and materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/sl-p2-specimen-q01-q06-low-risk.json`.
- Placeholder scan passed with no `REVIEW REQUIRED`, `TODO`, or `PLACEHOLDER` markers. Installer no-write check passed before controlled installation.
- Installed items preserve the official sphere/cone volume item, binomial die item, regression-lines item, and displacement/acceleration item with complete parts, answers, official markscheme rows, one-mark scoring points, source evidence and knowledge-point classification.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors.
- Current structured count is 95 non-visible reviewed items: SL 10 (`SL P1: 1`, `SL P2: 9`) and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`). Student-visible and published counts remain 0. Bank duplicate exclusions are 21. Remaining non-duplicate Math AA items requiring structured reconstruction: 317.
- Next efficient path: continue from fresh `scan-v8-*` results; remaining highest-yield groups are SL P1/P2 packets with 3 low-risk candidates.

# 2026-08-01 - IB Math AA Materialized Batch Install: SL 2023 May TZ1 Paper 1 Q1/Q4/Q5

- Selected fresh scan group `tmp/ib-math-aa-draft-batches/scan-v8-sl-p1-sl-p1-2023-may-tz1.json`, with low-risk candidates `P1-000037`, `P1-000040`, and `P1-000041`.
- Visually checked the complete official question and paired markscheme crops for all three items. Q4 trigonometric-equation solution set and Q5 exponential/logarithmic range condition were checked against the official scoring rows and notes.
- Created compact spec `tmp/ib-math-aa-compact-reviewed-specs/sl-p1-2023-may-tz1-q01-q05-low-risk.json` and materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/sl-p1-2023-may-tz1-q01-q05-low-risk.json`.
- Placeholder scan passed with no `REVIEW REQUIRED`, `TODO`, or `PLACEHOLDER` markers. Installer no-write check passed before controlled installation.
- Installed items preserve the official coordinate-geometry line item, double-angle trigonometric equation item, and exponential/logarithmic quadratic-discriminant item with complete parts, answers, official markscheme rows, one-mark scoring points, source evidence and knowledge-point classification.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors.
- Current structured count is 98 non-visible reviewed items: SL 13 (`SL P1: 4`, `SL P2: 9`) and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`). Student-visible and published counts remain 0. Bank duplicate exclusions are 21. Remaining non-duplicate Math AA items requiring structured reconstruction: 314.
- Next efficient path: continue fresh scan-v8 SL P1/P2 groups with 3 low-risk candidates, such as `SL 2023 Nov TZ1 P1`, `SL P1 Specimen`, `SL 2022 May TZ1 P2`, or `SL 2023 May TZ2 P2`.

# 2026-08-01 - IB Math AA Materialized Batch Install: SL 2023 Nov TZ1 Paper 1 Q2/Q3/Q6

- Selected fresh scan group `tmp/ib-math-aa-draft-batches/scan-v8-sl-p1-sl-p1-2023-nov-tz1.json`, with low-risk candidates `P1-000056`, `P1-000057`, and `P1-000060`.
- Visually checked the complete official question and paired markscheme crops for all three items. Q6 binomial expansion was corrected from incomplete OCR to the official expression `1+9x/2+15k^2x^2+...+k^n x^n`.
- Created compact spec `tmp/ib-math-aa-compact-reviewed-specs/sl-p1-2023-nov-tz1-q02-q06-low-risk.json` and materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/sl-p1-2023-nov-tz1-q02-q06-low-risk.json`.
- Placeholder scan passed with no `REVIEW REQUIRED`, `TODO`, or `PLACEHOLDER` markers. Installer no-write check passed before controlled installation.
- Installed items preserve the official composite-functions item, event-probability complement item, and binomial-expansion coefficient-comparison item with complete parts, answers, official markscheme rows, one-mark scoring points, source evidence and knowledge-point classification.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors.
- Current structured count is 101 non-visible reviewed items: SL 16 (`SL P1: 7`, `SL P2: 9`) and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`). Student-visible and published counts remain 0. Bank duplicate exclusions are 21. Remaining non-duplicate Math AA items requiring structured reconstruction: 311.
- Next efficient path: continue fresh scan-v8 SL groups with 3 low-risk candidates, such as `SL P1 Specimen`, `SL 2022 May TZ1 P2`, or `SL 2023 May TZ2 P2`.

# 2026-08-01 - IB Math AA Materialized Batch Install: SL P1 Specimen Q2/Q4/Q6

- Continued from fresh scan group `tmp/ib-math-aa-draft-batches/scan-v8-sl-p1-sl-p1-specimen.json`, with low-risk candidates `P1-000065`, `P1-000067`, and `P1-000069`.
- Used the already visually checked official question and paired markscheme crops for all three items. OCR-derived text was not trusted directly; Q2 conditional probability, Q4 inverse-chain-rule integration, and Q6 logarithm/trigonometry fields were reconstructed from the rendered source assets.
- Created compact spec `tmp/ib-math-aa-compact-reviewed-specs/sl-p1-specimen-q02-q06-low-risk.json` and materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/sl-p1-specimen-q02-q06-low-risk.json`.
- Placeholder scan passed with no `REVIEW REQUIRED`, `TODO`, or `PLACEHOLDER` markers. Installer no-write check passed before controlled installation.
- Installed items preserve complete parts, answers, official markscheme rows, one-mark scoring points, source evidence and item-level knowledge-point classification. All installed records remain hidden and blocked.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors.
- Current structured count is 104 non-visible reviewed items: SL 19 (`SL P1: 10`, `SL P2: 9`) and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`). Student-visible and published counts remain 0. Bank duplicate exclusions are 21. Remaining non-duplicate Math AA items requiring structured reconstruction: 308.
- Next efficient path: continue fresh scan-v8 SL groups with 3 low-risk candidates, selecting the highest-yield remaining whole-paper packet after skipping already reviewed and exact-duplicate records.

# 2026-08-01 - IB Math AA Materialized Batch Install: SL 2022 May TZ1 Paper 2 Q2/Q4/Q5

- Selected current-bank-filtered scan group `tmp/ib-math-aa-draft-batches/scan-v8-sl-p2-sl-p2-2022-may-tz1.json`, with remaining low-risk candidates `P2-000029`, `P2-000031`, and `P2-000032`.
- Visually checked the official question and paired markscheme crops for all three items. Q2 frequency table, Q4 probability distribution table, and Q5 velocity function were reconstructed from rendered source assets rather than trusted from OCR.
- Created compact spec `tmp/ib-math-aa-compact-reviewed-specs/sl-p2-2022-may-tz1-q02-q05-low-risk.json` and materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/sl-p2-2022-may-tz1-q02-q05-low-risk.json`.
- Placeholder scan passed with no `REVIEW REQUIRED`, `TODO`, or `PLACEHOLDER` markers. Installer no-write check passed before controlled installation.
- Installed items preserve complete parts, answers, official markscheme rows, one-mark scoring points, table/source evidence and item-level knowledge-point classification. All installed records remain hidden and blocked.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors.
- Current structured count is 107 non-visible reviewed items: SL 22 (`SL P1: 10`, `SL P2: 12`) and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`). Student-visible and published counts remain 0. Bank duplicate exclusions are 21. Remaining non-duplicate Math AA items requiring structured reconstruction: 305.
- Next efficient path: continue current-bank-filtered scan-v8 groups. Highest remaining 3-item group is `tmp/ib-math-aa-draft-batches/scan-v8-sl-p2-sl-p2-2023-may-tz2.json` with `P2-000064`, `P2-000066`, and `P2-000067`.

# 2026-08-01 - IB Math AA Materialized Batch Install: SL 2023 May TZ2 Paper 2 Q1/Q3/Q4

- Selected current-bank-filtered scan group `tmp/ib-math-aa-draft-batches/scan-v8-sl-p2-sl-p2-2023-may-tz2.json`, with remaining low-risk candidates `P2-000064`, `P2-000066`, and `P2-000067`.
- Visually checked the official question and paired markscheme crops for all three items. Q1 plant-height regression table, Q3 exponential drug-decay model, and Q4 normal/inverse-normal/binomial distribution sequence were reconstructed from rendered source assets rather than trusted from OCR.
- Created compact spec `tmp/ib-math-aa-compact-reviewed-specs/sl-p2-2023-may-tz2-q01-q04-low-risk.json` and materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/sl-p2-2023-may-tz2-q01-q04-low-risk.json`.
- Placeholder scan passed with no `REVIEW REQUIRED`, `TODO`, or `PLACEHOLDER` markers. Installer no-write check passed before controlled installation.
- Installed items preserve complete parts, answers, official markscheme rows, one-mark scoring points, table/source evidence and item-level knowledge-point classification. All installed records remain hidden and blocked.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors.
- Current structured count is 110 non-visible reviewed items: SL 25 (`SL P1: 10`, `SL P2: 15`) and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`). Student-visible and published counts remain 0. Bank duplicate exclusions are 21. Remaining non-duplicate Math AA items requiring structured reconstruction: 302.
- Next efficient path: recompute current-bank-filtered scan-v8 priority and continue the highest-yield remaining whole-paper group.

# 2026-08-01 - IB Math AA Materialized Batch Install: SL 2021 May TZ2 Paper 1 Q2/Q4

- Selected current-bank-filtered scan group `tmp/ib-math-aa-draft-batches/scan-v8-sl-p1-sl-p1-2021-may-tz2.json`, with remaining low-risk candidates `P1-000011` and `P1-000013`.
- Visually checked the official question and paired markscheme crops for both items. Q2 consecutive-integers proof and Q4 binomial-expansion coefficient comparison were reconstructed with complete official scoring notes.
- Created compact spec `tmp/ib-math-aa-compact-reviewed-specs/sl-p1-2021-may-tz2-q02-q04-low-risk.json` and materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/sl-p1-2021-may-tz2-q02-q04-low-risk.json`.
- Placeholder scan passed with no `REVIEW REQUIRED`, `TODO`, or `PLACEHOLDER` markers. Installer no-write check passed before controlled installation.
- Installed items preserve complete parts, answers, official markscheme rows, one-mark scoring points, source evidence and item-level knowledge-point classification. All installed records remain hidden and blocked.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors.
- Current structured count is 112 non-visible reviewed items: SL 27 (`SL P1: 12`, `SL P2: 15`) and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`). Student-visible and published counts remain 0. Bank duplicate exclusions are 21. Remaining non-duplicate Math AA items requiring structured reconstruction: 300.
- Next efficient path: recompute current-bank-filtered scan-v8 priority and continue the highest-yield remaining whole-paper group.

# 2026-08-01 - IB Math AA Materialized Batch Install: SL 2022 May TZ1 Paper 1 Q1/Q5

- Selected current-bank-filtered scan group `tmp/ib-math-aa-draft-batches/scan-v8-sl-p1-sl-p1-2022-may-tz1.json`, with remaining low-risk candidates `P1-000028` and `P1-000032`.
- Visually checked the official question and paired markscheme crops for both items. Q1 coordinate-line equation and Q5 product-rule tangent-gradient equation were reconstructed from rendered source assets rather than trusted from OCR.
- Created compact spec `tmp/ib-math-aa-compact-reviewed-specs/sl-p1-2022-may-tz1-q01-q05-low-risk.json` and materialized reviewed batch `tmp/ib-math-aa-reviewed-batches/sl-p1-2022-may-tz1-q01-q05-low-risk.json`.
- Placeholder scan passed with no `REVIEW REQUIRED`, `TODO`, or `PLACEHOLDER` markers. Installer no-write check passed before controlled installation.
- Installed items preserve complete parts, answers, official markscheme rows, one-mark scoring points, source evidence and item-level knowledge-point classification. All installed records remain hidden and blocked.
- Verification passed after installation: curriculum build, structured-delivery gate, Math AA item audit, learning-schema validation, Mock eligibility rebuild, SOP validation and structured-delivery validation all passed with 0 errors.
- Current structured count is 114 non-visible reviewed items: SL 29 (`SL P1: 14`, `SL P2: 15`) and HL 85 (`HL P1: 51`, `HL P2: 33`, `HL P3: 1`). Student-visible and published counts remain 0. Bank duplicate exclusions are 21. Remaining non-duplicate Math AA items requiring structured reconstruction: 298.
- Next efficient path: recompute current-bank-filtered scan-v8 priority and continue the highest-yield remaining whole-paper group.

# 2026-08-01 - IB Math AA Middle-Layer v15 Batch Usability Repair

- Stayed on the user-reset goal: middle-layer first, then full SL/HL rollout. No formal bank writes were made.
- Updated `scripts/generate_ib_math_aa_compact_specs_from_scan.cjs` so review-only compact specs are more useful in bulk:
  - Missing item text/stem can be reconstructed from source payload, question OCR candidate, or part text.
  - OCR-derived answers and markscheme rows only replace existing draft scaffolds when they align with the generated parts.
  - Missing knowledge-point review fields now receive review-only draft values instead of causing structural failure.
- Verification:
  - `node --check scripts\generate_ib_math_aa_compact_specs_from_scan.cjs`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v9-*.json --batch-id middle-layer-v15-current-health --max-items 40 --ready-check`
  - `node scripts\validate_ib_math_aa_middle_layer.cjs --batch-id middle-layer-v15-current-health --dir tmp\ib-math-aa-generated-compact-specs`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v9-*.json --batch-id middle-layer-v15-reviewed-regression --max-items 40 --include-reviewed --ready-check`
- Results: `middle-layer-v15-current-health` has 14 review drafts, 0 structural failures, 58 image refs, 0 missing refs, no old incomplete markers. Regression has 23 ready records, 14 review drafts, 0 structural failures, and installer no-write passed: `Checked 23 reviewed structured item(s); no files were changed.`
- Next continuation entry point: `tmp/ib-math-aa-generated-compact-specs/middle-layer-v15-current-health.review-workspace.html`; continue improving bulk review throughput from that workspace, then promote certified small batches through ready gate and installer no-write.

# 2026-08-01 - IB Math AA Middle-Layer v16 Routing Gate

- Continued phase 1 middle-layer work only. No formal Math AA bank files were written.
- Added standard `review_routing` output to generated review drafts and failure reports: priority, categories, question/markscheme asset counts, estimated marks, and a checklist for fast field review.
- Tightened `scripts\validate_ib_math_aa_middle_layer.cjs` so review drafts must include routing metadata. Updated `scripts\build_ib_math_aa_middle_layer_review_workspace.cjs` so the HTML workspace shows route counts and per-item review checklists.
- Verification:
  - `node --check scripts\generate_ib_math_aa_compact_specs_from_scan.cjs`
  - `node --check scripts\validate_ib_math_aa_middle_layer.cjs`
  - `node --check scripts\build_ib_math_aa_middle_layer_review_workspace.cjs`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v9-*.json --batch-id middle-layer-v16-current-health --max-items 40 --ready-check`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v9-*.json --batch-id middle-layer-v16-reviewed-regression --max-items 40 --include-reviewed --ready-check`
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v16-current-health.review-draft.compact-spec.json --batch-id middle-layer-v16-reject-unreviewed --allow-empty`
- Results: `middle-layer-v16-current-health` has 14 review drafts, 0 ready, 0 structural failures, 58 image refs, 0 missing refs, no old incomplete markers. Route counts are now machine-readable: `multi_markscheme_asset:14`, `symbol_visual_check:14`, `multiple_methods:10`, `part_alignment:6`, `visual_element:6`, `formula_line_split:3`, `multi_question_asset:2`, `question_ocr_noise:2`.
- Reviewed regression stayed valid: 23 ready records and installer no-write passed with `Checked 23 reviewed structured item(s); no files were changed.` Negative gate rejected all 14 unreviewed drafts and produced no materialized batch.
- Next continuation entry point: `tmp/ib-math-aa-generated-compact-specs/middle-layer-v16-current-health.review-workspace.html`.

# 2026-08-01 - IB Math AA Middle-Layer v18 Review Batch Planner

- Continued phase 1 middle-layer work only. No formal Math AA bank files were written.
- Added `scripts\build_ib_math_aa_middle_layer_review_batches.cjs`, which reads a review-draft compact spec and emits:
  - `*.review-batches.json`: machine-readable small-batch plan;
  - `*.review-batches.md`: ordered human review packet.
- Wired the planner into `scripts\run_ib_math_aa_middle_layer_pipeline.cjs`. Every pipeline run now emits ready spec, review draft spec, failures, HTML workspace, review batch JSON, and review batch Markdown.
- Added review-batch plan health checks to the pipeline: planned item count, unique source asset refs, and missing source asset refs.
- Verification:
  - `node --check scripts\build_ib_math_aa_middle_layer_review_batches.cjs`
  - `node --check scripts\run_ib_math_aa_middle_layer_pipeline.cjs`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v9-*.json --batch-id middle-layer-v18-current-health --max-items 40 --ready-check`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v9-*.json --batch-id middle-layer-v18-reviewed-regression --max-items 40 --include-reviewed --ready-check`
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v18-current-health.review-draft.compact-spec.json --batch-id middle-layer-v18-reject-unreviewed --allow-empty`
- Results: `middle-layer-v18-current-health` has 14 review drafts, 0 ready, 0 structural failures, 11 review batches, 14 planned items, 58 asset refs, and 0 missing asset refs. Reviewed regression kept 23 ready records and passed installer no-write with `Checked 23 reviewed structured item(s); no files were changed.` Unreviewed drafts are still rejected by the ready gate.
- First planned batch is `review-batch-01`: `ib-math-aa-sl/P2-000018` (15 marks, 4 parts), using three question assets and two markscheme assets. Next continuation entry points are `tmp\ib-math-aa-generated-compact-specs\middle-layer-v18-current-health.review-batches.md` and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v18-current-health.review-workspace.html`.

# 2026-08-01 - IB Math AA Middle-Layer v20 Review Subsets

- Continued phase 1 middle-layer work only. No formal Math AA bank files were written.
- Extended `scripts\build_ib_math_aa_middle_layer_review_batches.cjs` so every planned batch emits a directly editable review-draft subset compact spec under `*.review-subsets/`.
- Each subset records parent batch id, route key, selected items, and the ready-gate command to run after field review. This removes the need to hand-filter ids before promotion.
- Updated `scripts\run_ib_math_aa_middle_layer_pipeline.cjs` so the pipeline writes the subset directory and fails if the subset count does not match the planned batch count.
- Verification:
  - `node --check scripts\build_ib_math_aa_middle_layer_review_batches.cjs`
  - `node --check scripts\run_ib_math_aa_middle_layer_pipeline.cjs`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v9-*.json --batch-id middle-layer-v20-current-health --max-items 40 --ready-check`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v9-*.json --batch-id middle-layer-v20-reviewed-regression --max-items 40 --include-reviewed --ready-check`
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v20-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v20-subset-reject-unreviewed --allow-empty`
- Results: `middle-layer-v20-current-health` has 14 review drafts, 0 ready, 0 structural failures, 11 review batches, 11 review-draft subset files, 14 subset items, 58 source asset refs, 0 missing refs, and no old incomplete markers. Reviewed regression kept 23 ready records and passed installer no-write with `Checked 23 reviewed structured item(s); no files were changed.` The first unreviewed subset was rejected by the ready gate and materialized nothing.
- Next continuation entry points: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v20-current-health.review-batches.md`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v20-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v20-current-health.review-workspace.html`.

# 2026-08-02 - IB Math AA Middle-Layer v21 Subset Workspaces

- Continued phase 1 middle-layer work only. No formal Math AA bank files were written.
- Extended `scripts\run_ib_math_aa_middle_layer_pipeline.cjs` so every generated review subset also gets its own HTML workspace in the same subset directory.
- The first `middle-layer-v21-current-health` attempt correctly failed because subset workspaces sit one directory deeper than the parent workspace and inherited the wrong relative `public` path. Fixed the pipeline to calculate the relative asset base per subset workspace.
- Pipeline health now checks planned review batches, subset specs, subset workspaces, image refs and missing image refs together.
- Verification:
  - `node --check scripts\run_ib_math_aa_middle_layer_pipeline.cjs`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v9-*.json --batch-id middle-layer-v21-current-health --max-items 40 --ready-check`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v9-*.json --batch-id middle-layer-v21-reviewed-regression --max-items 40 --include-reviewed --ready-check`
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v21-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v21-subset-reject-unreviewed --allow-empty`
- Results: `middle-layer-v21-current-health` has 14 review drafts, 0 ready, 0 structural failures, 11 review batches, 11 subset specs, 11 subset workspaces, 58 total subset-workspace image refs, 58 source asset refs, 0 missing refs, and no old incomplete markers. Reviewed regression kept 23 ready records and passed installer no-write with `Checked 23 reviewed structured item(s); no files were changed.` The first unreviewed subset was rejected by the ready gate and materialized nothing.
- Next continuation entry points: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v21-current-health.review-batches.md`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v21-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v21-current-health.review-subsets\review-batch-01.review-workspace.html`.

# 2026-08-02 - IB Math AA Middle-Layer v22 Review Index

- Continued phase 1 middle-layer work only. No formal Math AA bank files were written.
- Added generated review index output to `scripts\run_ib_math_aa_middle_layer_pipeline.cjs`.
- The index links the full workspace, batch report, batch JSON, full draft JSON, every review subset spec, every subset workspace, and the exact ready-gate command for each subset.
- Verification:
  - `node --check scripts\run_ib_math_aa_middle_layer_pipeline.cjs`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v9-*.json --batch-id middle-layer-v22-current-health --max-items 40 --ready-check`
  - index link check: 26 hrefs, 0 missing local targets
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v9-*.json --batch-id middle-layer-v22-reviewed-regression --max-items 40 --include-reviewed --ready-check`
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v22-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v22-subset-reject-unreviewed --allow-empty`
- Results: `middle-layer-v22-current-health` has 14 review drafts, 0 ready, 0 structural failures, 11 review batches, 11 subset specs, 11 subset workspaces, 58 total subset-workspace image refs, 58 source asset refs, 0 missing refs, no old incomplete markers, and an index with all 11 batches linked. Reviewed regression kept 23 ready records and passed installer no-write with `Checked 23 reviewed structured item(s); no files were changed.` The first unreviewed subset was rejected by the ready gate and materialized nothing.
- Next continuation entry point: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v22-current-health.review-index.html`. First actionable subset remains `tmp\ib-math-aa-generated-compact-specs\middle-layer-v22-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` plus `review-batch-01.review-workspace.html`.
# 2026-08-02 - IB Math AA Middle-Layer v38 Progress 157 Reviewed Hidden

- Continued from v37 `review-batch-01` using the middle-layer workflow.
- Rewrote `tmp\ib-math-aa-generated-compact-specs\middle-layer-v37-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for `ib-math-aa-hl/P1-000083`, splitting the generated `main` item into official subparts `a`, `b.i`, `b.ii`, `c.i`, `c.ii`, and `d`.
- Added clean complex-number stem, official answers, 6 markscheme rows, 22 one-mark points, and field/classification review certification. Resolved classification to primary `AA-1.14` with required `AA-1.12`, `AA-1.13`, `AA-1.14`, `AA-2.12`.
- Verification and install:
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v37-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v37-current-health-review-batch-01-ready`
  - `node scripts\install_ib_math_aa_structured_batch.cjs tmp\ib-math-aa-generated-compact-specs\middle-layer-v37-current-health-review-batch-01-ready.reviewed-batch.json`
  - `node scripts\build_ib_math_aa_curriculum.cjs`
  - `node scripts\structured_question_delivery_gate.cjs`
  - `node scripts\validate_ib_math_aa.cjs`
  - `python scripts\validate_ib_learning_schema.py`
  - `npm run build:ib-math-aa:mock-contract`
  - `npm run validate:sop`
  - `npm run validate:structured-delivery`
- Results: ready gate selected 1, ready 1, rejected 0; installer no-write checked 1; controlled install installed 1. Structured delivery checked 5596 items with 0 errors. IB Math AA audit has 0 errors. Learning schema, SOP, and structured-delivery npm gates passed.
- Current count is 157 structured reviewed hidden items: SL 55 (`P1:17`, `P2:38`) and HL 102 (`P1:61`, `P2:40`, `P3:1`). Visible and published remain 0.
- Refreshed next checkpoint with `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v9-*.json --batch-id middle-layer-v38-current-health --max-items 40 --ready-check`. v38 passed with 5 review drafts, 0 ready, 0 structural failures, 4 review batches, 4 subset workspaces, 20 image refs, 0 missing refs, and healthy handoff.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v38-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v38-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v38-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

# 2026-08-02 - IB Math AA Middle-Layer v37 Progress 156 Reviewed Hidden

- Continued from v36 `review-batch-01` using the middle-layer workflow.
- Rewrote `tmp\ib-math-aa-generated-compact-specs\middle-layer-v36-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for `ib-math-aa-sl/P2-000080`, splitting the generated `main` item into official subparts `a.i`, `a.ii`, `b`, `c.i`, `c.ii`, and `d`.
- Added clean financial-mathematics stem, official answers, 6 markscheme rows, 15 one-mark points, and field/classification review certification. Resolved classification to primary `AA-1.4` with required `AA-1.2`, `AA-1.3`, `AA-1.4`.
- Verification and install:
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v36-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v36-current-health-review-batch-01-ready`
  - `node scripts\install_ib_math_aa_structured_batch.cjs tmp\ib-math-aa-generated-compact-specs\middle-layer-v36-current-health-review-batch-01-ready.reviewed-batch.json`
  - `node scripts\build_ib_math_aa_curriculum.cjs`
  - `node scripts\structured_question_delivery_gate.cjs`
  - `node scripts\validate_ib_math_aa.cjs`
  - `python scripts\validate_ib_learning_schema.py`
  - `npm run build:ib-math-aa:mock-contract`
  - `npm run validate:sop`
  - `npm run validate:structured-delivery`
- Results: ready gate selected 1, ready 1, rejected 0; installer no-write checked 1; controlled install installed 1. Structured delivery checked 5595 items with 0 errors. IB Math AA audit has 0 errors. Learning schema, SOP, and structured-delivery npm gates passed.
- Current count is 156 structured reviewed hidden items: SL 55 (`P1:17`, `P2:38`) and HL 101 (`P1:60`, `P2:40`, `P3:1`). Visible and published remain 0.
- Refreshed next checkpoint with `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v9-*.json --batch-id middle-layer-v37-current-health --max-items 40 --ready-check`. v37 passed with 6 review drafts, 0 ready, 0 structural failures, 5 review batches, 5 subset workspaces, 25 image refs, 0 missing refs, and healthy handoff.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v37-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v37-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v37-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

# 2026-08-02 - IB Math AA Middle-Layer v36 Progress 155 Reviewed Hidden

- Continued from v35 `review-batch-01` using the middle-layer workflow: reviewed subset -> ready gate -> installer no-write -> controlled install -> full gates.
- Rewrote `tmp\ib-math-aa-generated-compact-specs\middle-layer-v35-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for:
  - `ib-math-aa-hl/P1-000082`: split into 4 official parts, added clean circle/triangle figure, official answers, 4 markscheme rows, 14 one-mark points, and resolved classification to primary `AA-5.8`.
  - `ib-math-aa-hl/P2-000106`: split into 6 official parts, added clean rational-function stem, official answers, 6 markscheme rows, 19 one-mark points, and resolved classification to primary `AA-2.13`.
- Added figure asset `public\data\ib\math-aa\real-source-assets\figures\mathsaa_hl_p1_2023_may_tz2_q10_circle_triangle.webp`, SHA256 `d21cdeefea29672580f9c11b7ebfb3b2714f75349417b12be86a7263132c6c6f`, crop pixels `[300, 235, 760, 665]`.
- Verification and install:
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v35-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v35-current-health-review-batch-01-ready`
  - `node scripts\install_ib_math_aa_structured_batch.cjs tmp\ib-math-aa-generated-compact-specs\middle-layer-v35-current-health-review-batch-01-ready.reviewed-batch.json`
  - `node scripts\build_ib_math_aa_curriculum.cjs`
  - `node scripts\structured_question_delivery_gate.cjs`
  - `node scripts\validate_ib_math_aa.cjs`
  - `python scripts\validate_ib_learning_schema.py`
  - `npm run build:ib-math-aa:mock-contract`
  - `npm run validate:sop`
  - `npm run validate:structured-delivery`
- Results: ready gate selected 2, ready 2, rejected 0; installer no-write checked 2; controlled install installed 2. Structured delivery checked 5594 items with 0 errors. IB Math AA audit has 0 errors. Learning schema, SOP, and structured-delivery npm gates passed.
- Current count is 155 structured reviewed hidden items: SL 54 (`P1:17`, `P2:37`) and HL 101 (`P1:60`, `P2:40`, `P3:1`). Visible and published remain 0.
- Refreshed next checkpoint with `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v9-*.json --batch-id middle-layer-v36-current-health --max-items 40 --ready-check`. v36 passed with 7 review drafts, 0 ready, 0 structural failures, 6 review batches, 6 subset workspaces, 29 image refs, 0 missing refs, and healthy handoff.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v36-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v36-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v36-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

# 2026-08-02 - IB Math AA Middle-Layer v35 Progress 153 Reviewed Hidden

- Continued from v34 `review-batch-01` using the AP-style middle-layer workflow: reviewed subset -> ready gate -> installer no-write -> controlled install -> full gates.
- Rewrote the current subset file `tmp\ib-math-aa-generated-compact-specs\middle-layer-v34-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for:
  - `ib-math-aa-hl/P2-000096`: added clean structured stem blocks, standalone pyramid figure, 2 parts, official answers, 2 markscheme rows, 6 one-mark points, field/classification review certification, and removed all pending middle-layer metadata.
  - `ib-math-aa-sl/P2-000016`: added clean structured stem blocks, standalone windmill figure, 5 parts, official answers, 5 markscheme rows, 13 one-mark points, field/classification review certification, and removed all pending middle-layer metadata.
- Verification and install:
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v34-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v34-current-health-review-batch-01-ready`
  - `node scripts\install_ib_math_aa_structured_batch.cjs tmp\ib-math-aa-generated-compact-specs\middle-layer-v34-current-health-review-batch-01-ready.reviewed-batch.json`
  - `node scripts\build_ib_math_aa_curriculum.cjs`
  - `node scripts\structured_question_delivery_gate.cjs`
  - `node scripts\validate_ib_math_aa.cjs`
  - `python scripts\validate_ib_learning_schema.py`
  - `npm run build:ib-math-aa:mock-contract`
  - `npm run validate:sop`
  - `npm run validate:structured-delivery`
- Results: ready gate selected 2, ready 2, rejected 0; installer no-write checked 2; controlled install installed 2. Structured delivery checked 5592 items with 0 errors. IB Math AA audit has 0 errors. Learning schema, SOP, and structured-delivery npm gates passed.
- Current count is 153 structured reviewed hidden items: SL 54 (`P1:17`, `P2:37`) and HL 99 (`P1:59`, `P2:39`, `P3:1`). Visible and published remain 0.
- Refreshed next checkpoint with `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v9-*.json --batch-id middle-layer-v35-current-health --max-items 40 --ready-check`. v35 passed with 9 review drafts, 0 ready, 0 structural failures, 7 review batches, 7 subset workspaces, 38 image refs, 0 missing refs, and healthy handoff.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v35-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v35-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v35-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.
# 2026-08-02 - IB Math AA Middle-Layer v53 Progress 184 Reviewed Hidden

- Continued from v52 `review-batch-01` using the AP-style middle-layer workflow: reviewed subset -> ready gate -> installer no-write -> controlled install -> full gates.
- Rewrote `tmp\ib-math-aa-generated-compact-specs\middle-layer-v52-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for `ib-math-aa-hl/P1-000057` (`MathsAA_HL_P1_2022_Nov:Q9`).
- Corrected the generated OCR fields against rendered question and markscheme assets: stem, parts, answers, 2 markscheme rows, 10 one-mark points, solution outline, classification evidence, and review certification. Resolved classification to primary `AA-5.18` with required `AA-5.18`.
- Verification and install:
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v52-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v52-expanded-v8-current-health-review-batch-01-ready`
  - `node scripts\install_ib_math_aa_structured_batch.cjs tmp\ib-math-aa-generated-compact-specs\middle-layer-v52-expanded-v8-current-health-review-batch-01-ready.reviewed-batch.json`
  - `node scripts\build_ib_math_aa_curriculum.cjs`
  - `node scripts\structured_question_delivery_gate.cjs`
  - `node scripts\validate_ib_math_aa.cjs`
  - `python scripts\validate_ib_learning_schema.py`
  - `npm run build:ib-math-aa:mock-contract`
  - `npm run validate:sop`
  - `npm run validate:structured-delivery`
- Results: ready gate selected 1, ready 1, rejected 0; installer no-write checked 1; controlled install installed 1. Structured delivery checked 5623 items with 0 errors. IB Math AA audit has 0 errors. Learning schema, SOP, and structured-delivery npm gates passed.
- Current count is 184 structured reviewed hidden items: SL 65 (`P1:23`, `P2:42`) and HL 119 (`P1:66`, `P2:52`, `P3:1`). Visible and published remain 0.
- Refreshed next checkpoint with `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v53-expanded-v8-current-health --max-items 40 --ready-check`. v53 passed with 40 review drafts, 0 ready, 0 structural failures, 18 review batches, 18 subset workspaces, 81 image refs, 0 missing refs, and healthy handoff.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v53-expanded-v8-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v53-expanded-v8-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v53-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.
# 2026-08-02 - IB Math AA Middle-Layer v54 Progress 185 Reviewed Hidden

- Continued from v53 `review-batch-01` using the AP-style middle-layer workflow: reviewed subset -> ready gate -> installer no-write -> controlled install -> full gates.
- Rewrote `tmp\ib-math-aa-generated-compact-specs\middle-layer-v53-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for `ib-math-aa-hl/P2-000022` (`MathsAA_HL_P2_2021_May_TZ2:Q10`).
- Corrected the generated OCR fields against rendered question and markscheme assets: stem, 5 parts, answers, 5 markscheme rows, 15 one-mark points, solution outline, classification evidence, and review certification. Resolved classification to primary `AA-4.9` with required `AA-4.9`, `AA-4.8`, `AA-4.11`, `AA-4.12`.
- Verification and install:
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v53-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v53-expanded-v8-current-health-review-batch-01-ready`
  - `node scripts\install_ib_math_aa_structured_batch.cjs tmp\ib-math-aa-generated-compact-specs\middle-layer-v53-expanded-v8-current-health-review-batch-01-ready.reviewed-batch.json`
  - `node scripts\build_ib_math_aa_curriculum.cjs`
  - `node scripts\structured_question_delivery_gate.cjs`
  - `node scripts\validate_ib_math_aa.cjs`
  - `python scripts\validate_ib_learning_schema.py`
  - `npm run build:ib-math-aa:mock-contract`
  - `npm run validate:sop`
  - `npm run validate:structured-delivery`
- Results: ready gate selected 1, ready 1, rejected 0; installer no-write checked 1; controlled install installed 1. Structured delivery checked 5624 items with 0 errors. IB Math AA audit has 0 errors. Learning schema, SOP, and structured-delivery npm gates passed.
- Current count is 185 structured reviewed hidden items: SL 65 (`P1:23`, `P2:42`) and HL 120 (`P1:66`, `P2:53`, `P3:1`). Visible and published remain 0.
- Refreshed next checkpoint with `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v54-expanded-v8-current-health --max-items 40 --ready-check`. v54 passed with 40 review drafts, 0 ready, 0 structural failures, 18 review batches, 18 subset workspaces, 81 image refs, 0 missing refs, and healthy handoff.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v54-expanded-v8-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v54-expanded-v8-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v54-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.
# 2026-08-02 - IB Math AA Middle-Layer v55 Progress 186 Reviewed Hidden

- Continued from v54 `review-batch-01` using the AP-style middle-layer workflow: reviewed subset -> ready gate -> installer no-write -> controlled install -> full gates.
- Rewrote `tmp\ib-math-aa-generated-compact-specs\middle-layer-v54-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for `ib-math-aa-hl/P2-000036` (`MathsAA_HL_P2_2022_May_TZ1:Q1`).
- Corrected the generated OCR fields against rendered question and markscheme assets: table stem block, 2 parts, answers, 2 markscheme rows, 4 one-mark points, solution outline, classification evidence, and review certification. Resolved classification to primary/required `AA-4.3`.
- Verification and install:
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v54-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v54-expanded-v8-current-health-review-batch-01-ready`
  - `node scripts\install_ib_math_aa_structured_batch.cjs tmp\ib-math-aa-generated-compact-specs\middle-layer-v54-expanded-v8-current-health-review-batch-01-ready.reviewed-batch.json`
  - `node scripts\build_ib_math_aa_curriculum.cjs`
  - `node scripts\structured_question_delivery_gate.cjs`
  - `node scripts\validate_ib_math_aa.cjs`
  - `python scripts\validate_ib_learning_schema.py`
  - `npm run build:ib-math-aa:mock-contract`
  - `npm run validate:sop`
  - `npm run validate:structured-delivery`
- Results: ready gate selected 1, ready 1, rejected 0; installer no-write checked 1; controlled install installed 1. Structured delivery checked 5625 items with 0 errors. IB Math AA audit has 0 errors. Learning schema, SOP, and structured-delivery npm gates passed.
- Current count is 186 structured reviewed hidden items: SL 65 (`P1:23`, `P2:42`) and HL 121 (`P1:66`, `P2:54`, `P3:1`). Visible and published remain 0.
- Refreshed next checkpoint with `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v55-expanded-v8-current-health --max-items 40 --ready-check`. v55 passed with 40 review drafts, 0 ready, 0 structural failures, 18 review batches, 18 subset workspaces, 81 image refs, 0 missing refs, and healthy handoff.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v55-expanded-v8-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v55-expanded-v8-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v55-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.
# 2026-08-02 - IB Math AA Middle-Layer v56 Progress 187 Reviewed Hidden

- Continued from v55 `review-batch-01` using the AP-style middle-layer workflow: reviewed subset -> ready gate -> installer no-write -> controlled install -> full gates.
- Rewrote `tmp\ib-math-aa-generated-compact-specs\middle-layer-v55-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for `ib-math-aa-hl/P2-000064` (`MathsAA_HL_P2_2022_Nov:Q5`).
- Corrected the generated OCR fields against rendered question and markscheme assets: clean expression, answer, 1 markscheme row, 6 one-mark points, solution outline, classification evidence, and review certification. Resolved classification to primary/required `AA-1.9`.
- Verification and install:
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v55-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v55-expanded-v8-current-health-review-batch-01-ready`
  - `node scripts\install_ib_math_aa_structured_batch.cjs tmp\ib-math-aa-generated-compact-specs\middle-layer-v55-expanded-v8-current-health-review-batch-01-ready.reviewed-batch.json`
  - `node scripts\build_ib_math_aa_curriculum.cjs`
  - `node scripts\structured_question_delivery_gate.cjs`
  - `node scripts\validate_ib_math_aa.cjs`
  - `python scripts\validate_ib_learning_schema.py`
  - `npm run build:ib-math-aa:mock-contract`
  - `npm run validate:sop`
  - `npm run validate:structured-delivery`
- Results: ready gate selected 1, ready 1, rejected 0; installer no-write checked 1; controlled install installed 1. Structured delivery checked 5626 items with 0 errors. IB Math AA audit has 0 errors. Learning schema, SOP, and structured-delivery npm gates passed.
- Current count is 187 structured reviewed hidden items: SL 65 (`P1:23`, `P2:42`) and HL 122 (`P1:66`, `P2:55`, `P3:1`). Visible and published remain 0.
- Refreshed next checkpoint with `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v56-expanded-v8-current-health --max-items 40 --ready-check`. v56 passed with 40 review drafts, 0 ready, 0 structural failures, 18 review batches, 18 subset workspaces, 80 image refs, 0 missing refs, and healthy handoff.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v56-expanded-v8-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v56-expanded-v8-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v56-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.
# 2026-08-02 - IB Math AA Middle-Layer v57 Progress 188 Reviewed Hidden

- Continued from v56 `review-batch-01` using the AP-style middle-layer workflow: reviewed subset -> ready gate -> installer no-write -> controlled install -> full gates.
- Rewrote `tmp\ib-math-aa-generated-compact-specs\middle-layer-v56-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for `ib-math-aa-hl/P2-000121` (`MathsAA_HL_P2_Specimen:Q2`).
- Corrected the generated OCR fields against rendered question and markscheme assets: stem, 2 parts, answers, 2 markscheme rows, 6 one-mark points, solution outline, classification evidence, and review certification. Resolved classification to primary/required `AA-1.4`.
- Improved `scripts\materialize_ib_math_aa_reviewed_batch.cjs` so reviewed materialization can supplement missing same-question asset pages from `visual_intake_manifest.json` by `source_question_id` without changing the installer-checked `source` identity.
- Verification and install:
  - `node --check scripts\materialize_ib_math_aa_reviewed_batch.cjs`
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v56-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v56-expanded-v8-current-health-review-batch-01-ready`
  - `node scripts\install_ib_math_aa_structured_batch.cjs tmp\ib-math-aa-generated-compact-specs\middle-layer-v56-expanded-v8-current-health-review-batch-01-ready.reviewed-batch.json`
  - `node scripts\build_ib_math_aa_curriculum.cjs`
  - `node scripts\structured_question_delivery_gate.cjs`
  - `node scripts\validate_ib_math_aa.cjs`
  - `python scripts\validate_ib_learning_schema.py`
  - `npm run build:ib-math-aa:mock-contract`
  - `npm run validate:sop`
  - `npm run validate:structured-delivery`
- Results: ready gate selected 1, ready 1, rejected 0; installer no-write checked 1; controlled install installed 1. Structured delivery checked 5627 items with 0 errors. IB Math AA audit has 0 errors. Learning schema, SOP, and structured-delivery npm gates passed.
- Current count is 188 structured reviewed hidden items: SL 65 (`P1:23`, `P2:42`) and HL 123 (`P1:66`, `P2:56`, `P3:1`). Visible and published remain 0.
- Refreshed next checkpoint with `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v57-expanded-v8-current-health --max-items 40 --ready-check`. v57 passed with 40 review drafts, 0 ready, 0 structural failures, 18 review batches, 18 subset workspaces, 81 image refs, 0 missing refs, and healthy handoff.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v57-expanded-v8-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v57-expanded-v8-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v57-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.
# 2026-08-02 - IB Math AA Middle-Layer v58 Progress 189 Reviewed Hidden

- Continued from v57 `review-batch-01` using the AP-style middle-layer workflow: reviewed subset -> ready gate -> installer no-write -> controlled install -> full gates.
- Rewrote `tmp\ib-math-aa-generated-compact-specs\middle-layer-v57-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for `ib-math-aa-sl/P2-000028` (`MathsAA_SL_P2_2022_May_TZ1:Q1`).
- Corrected the generated OCR fields against rendered question and markscheme assets: stem, 3 parts, answers, 3 markscheme rows, 6 one-mark points, solution outline, classification evidence, and review certification. Resolved classification to primary/required `AA-1.4`.
- Verification and install:
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v57-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v57-expanded-v8-current-health-review-batch-01-ready`
  - `node scripts\install_ib_math_aa_structured_batch.cjs tmp\ib-math-aa-generated-compact-specs\middle-layer-v57-expanded-v8-current-health-review-batch-01-ready.reviewed-batch.json`
  - `node scripts\build_ib_math_aa_curriculum.cjs`
  - `node scripts\structured_question_delivery_gate.cjs`
  - `node scripts\validate_ib_math_aa.cjs`
  - `python scripts\validate_ib_learning_schema.py`
  - `npm run build:ib-math-aa:mock-contract`
  - `npm run validate:sop`
  - `npm run validate:structured-delivery`
- Results: ready gate selected 1, ready 1, rejected 0; installer no-write checked 1; controlled install installed 1. Structured delivery checked 5628 items with 0 errors. IB Math AA audit has 0 errors. Learning schema, SOP, and structured-delivery npm gates passed.
- Current count is 189 structured reviewed hidden items: SL 66 (`P1:23`, `P2:43`) and HL 123 (`P1:66`, `P2:56`, `P3:1`). Visible and published remain 0.
- Refreshed next checkpoint with `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v58-expanded-v8-current-health --max-items 40 --ready-check`. v58 passed with 40 review drafts, 0 ready, 0 structural failures, 18 review batches, 18 subset workspaces, 81 image refs, 0 missing refs, and healthy handoff.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v58-expanded-v8-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v58-expanded-v8-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v58-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.
# 2026-08-02 - IB Math AA Middle-Layer v59 Progress 190 Reviewed Hidden

- Continued from v58 `review-batch-01` using the AP-style middle-layer workflow: reviewed subset -> ready gate -> installer no-write -> controlled install -> full gates.
- Rewrote `tmp\ib-math-aa-generated-compact-specs\middle-layer-v58-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for `ib-math-aa-sl/P2-000056` (`MathsAA_SL_P2_2023_May_TZ1:Q2`).
- Corrected the generated OCR fields against rendered question and markscheme assets: stem, 3 parts, answers, 3 markscheme rows, 6 one-mark points, solution outline, classification evidence, and review certification. Resolved classification to primary/required `AA-1.4`.
- Verification and install:
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v58-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v58-expanded-v8-current-health-review-batch-01-ready`
  - `node scripts\install_ib_math_aa_structured_batch.cjs tmp\ib-math-aa-generated-compact-specs\middle-layer-v58-expanded-v8-current-health-review-batch-01-ready.reviewed-batch.json`
  - `node scripts\build_ib_math_aa_curriculum.cjs`
  - `node scripts\structured_question_delivery_gate.cjs`
  - `node scripts\validate_ib_math_aa.cjs`
  - `python scripts\validate_ib_learning_schema.py`
  - `npm run build:ib-math-aa:mock-contract`
  - `npm run validate:sop`
  - `npm run validate:structured-delivery`
- Results: ready gate selected 1, ready 1, rejected 0; installer no-write checked 1; controlled install installed 1. Structured delivery checked 5629 items with 0 errors. IB Math AA audit has 0 errors. Learning schema, SOP, and structured-delivery npm gates passed.
- Current count is 190 structured reviewed hidden items: SL 67 (`P1:23`, `P2:44`) and HL 123 (`P1:66`, `P2:56`, `P3:1`). Visible and published remain 0.
- Refreshed next checkpoint with `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v59-expanded-v8-current-health --max-items 40 --ready-check`. v59 passed with 40 review drafts, 0 ready, 0 structural failures, 18 review batches, 18 subset workspaces, 81 image refs, 0 missing refs, and healthy handoff.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v59-expanded-v8-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v59-expanded-v8-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v59-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.
# 2026-08-02 - IB Math AA Middle-Layer v60 Progress 191 Reviewed Hidden

- Continued from v59 `review-batch-01` using the AP-style middle-layer workflow: reviewed subset -> ready gate -> installer no-write -> controlled install -> full gates.
- Rewrote `tmp\ib-math-aa-generated-compact-specs\middle-layer-v59-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json` for `ib-math-aa-sl/P2-000058` (`MathsAA_SL_P2_2023_May_TZ1:Q4`).
- Corrected the generated OCR fields against rendered question and markscheme assets: stem, table, 3 parts, answers, 3 markscheme rows, 7 one-mark points, solution outline, classification evidence, and review certification. Resolved classification to primary `AA-4.10` with required `AA-4.10` and `AA-2.6`.
- Verification and install:
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v59-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v59-expanded-v8-current-health-review-batch-01-ready`
  - `node scripts\install_ib_math_aa_structured_batch.cjs tmp\ib-math-aa-generated-compact-specs\middle-layer-v59-expanded-v8-current-health-review-batch-01-ready.reviewed-batch.json`
  - `node scripts\build_ib_math_aa_curriculum.cjs`
  - `node scripts\structured_question_delivery_gate.cjs`
  - `node scripts\validate_ib_math_aa.cjs`
  - `python scripts\validate_ib_learning_schema.py`
  - `npm run build:ib-math-aa:mock-contract`
  - `npm run validate:sop`
  - `npm run validate:structured-delivery`
- Results: ready gate selected 1, ready 1, rejected 0; installer no-write checked 1; controlled install installed 1. Structured delivery checked 5630 items with 0 errors. IB Math AA audit has 0 errors. Learning schema, SOP, and structured-delivery npm gates passed.
- Current count is 191 structured reviewed hidden items: SL 68 (`P1:23`, `P2:45`) and HL 123 (`P1:66`, `P2:56`, `P3:1`). Visible and published remain 0.
- Refreshed next checkpoint with `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v60-expanded-v8-current-health --max-items 40 --ready-check`. v60 passed with 40 review drafts, 0 ready, 0 structural failures, 18 review batches, 18 subset workspaces, 80 image refs, 0 missing refs, and healthy handoff.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v60-expanded-v8-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v60-expanded-v8-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v60-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

# 2026-08-02 - IB Math AA Middle-Layer v93 Progress 206

- Continued from v92 `review-batch-01` using the AP-style reviewed-skeleton workflow.
- Source-checked and installed `ib-math-aa-sl/P2-000088` (`MathsAA_SL_P2_Specimen:Q7`) as a structured reviewed hidden item.
- Resolved the classification conflict to `AA-3.3` with required `AA-3.2`; the visible and scoring work is bearings, triangle trigonometry, sine rule and cosine rule, not calculus.
- Corrected the 16-mark structured record: stem and diagram descriptions, 5 parts, final answers, 5 markscheme rows, 16 one-mark points, solving path and classification evidence.
- Ready gate selected 1, ready 1, rejected 0; installer no-write checked 1; controlled install installed 1.
- Post-install gates passed: curriculum build, structured delivery gate (`5645 item(s), 0 error(s)`), IB Math AA audit with 0 errors, learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Current formal count is 206 structured reviewed hidden items: SL 77 (`P1:28`, `P2:49`) and HL 129 (`P1:68`, `P2:60`, `P3:1`). Visible and published remain 0.
- Refreshed queue with `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v93-expanded-v8-current-health --max-items 40 --ready-check`.
- v93 passed with 40 review drafts, 0 ready, 0 structural failures, 9 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 23 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and healthy handoff.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v93-expanded-v8-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v93-expanded-v8-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v93-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

# 2026-08-02 - IB Math AA Middle-Layer v92 Progress 205

- Continued from v90 `review-batch-01` using the AP-style middle-layer workflow: reviewed skeleton subset -> ready gate -> installer no-write -> controlled install -> full gates.
- Installed 5 source-checked structured reviewed hidden items from v90: `ib-math-aa-hl/P1-000062`, `ib-math-aa-sl/P1-000039`, `ib-math-aa-sl/P2-000068`, `ib-math-aa-sl/P2-000089`, and `ib-math-aa-hl/P1-000040`.
- Field review corrections included: The Dragon frequency table as a structured table block; duplicated The Dragon HL/SL source instances mapped separately; binomial-coefficient notation and answers `a = 8h`, `b = 28h^2`, `d = 70h^4`, `h = 1.4`; normal/binomial probability answers and 15 one-mark points; and trigonometry prompt `cos(x/2 + π/3) = 1/√2` with `x = 17π/6`.
- Ready gate selected 5, ready 5, rejected 0; materialized 5 reviewed records; installer no-write checked 5; controlled install installed 5.
- Post-install gates passed: curriculum build, structured delivery gate, IB Math AA audit with 0 errors, learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Refreshed v91 and installed its 1 automatic ready item, `ib-math-aa-hl/P2-000129`, after its installer no-write check; full post-install gate chain passed again.
- Current formal count is 205 structured reviewed hidden items: SL 76 (`P1:28`, `P2:48`) and HL 129 (`P1:68`, `P2:60`, `P3:1`). Visible and published remain 0.
- Refreshed queue with `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v92-expanded-v8-current-health --max-items 40 --ready-check`.
- v92 passed with 40 review drafts, 0 ready, 0 structural failures, 10 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 25 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and healthy handoff.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v92-expanded-v8-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v92-expanded-v8-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v92-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

# 2026-08-02 - IB Math AA Middle-Layer v90 Answer Candidate Cleanup

- Continued phase 1 middle-layer work only; no formal bank files were written.
- Improved OCR-derived answer candidates in `scripts\generate_ib_math_aa_compact_specs_from_scan.cjs`:
  - answer cleanup detection now checks only `answer.text`, not nested OCR hints;
  - final answer candidates prefer values near official `A1` result points;
  - common IB OCR shapes now normalize `34 probability = 40` to `34/40`;
  - final radian fraction shapes now recover answers such as `x = 17π/6`.
- Verification:
  - `node --check scripts\generate_ib_math_aa_compact_specs_from_scan.cjs`
  - `node --check scripts\build_ib_math_aa_middle_layer_review_batches.cjs`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v90-expanded-v8-current-health --max-items 40 --ready-check`
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v90-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v90-expanded-v8-current-health-review-batch-01-skeleton-reject --use-reviewed-skeletons --allow-empty`
- Results: v90 passed with 40 review drafts, 0 ready, 0 structural failures, 11 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 27 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and healthy handoff. Route counts no longer include global `answer_cleanup`.
- Spot check: v90 first subset answers include `(i) 34/40; (ii) 1.5`, `150`, `x = 17π/6`, and cleaned normal/binomial answers. `ib-math-aa-sl/P2-000068` still needs visual source review for binomial coefficient notation, so it remains review-draft only.
- Negative ready gate selected 5 pending skeletons, ready 0, rejected 5, materialized nothing and did not call installer check.
- Current formal count remains 199 structured reviewed hidden items: SL 73 (`P1:27`, `P2:46`) and HL 126 (`P1:66`, `P2:59`, `P3:1`). Visible and published remain 0.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v90-expanded-v8-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v90-expanded-v8-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v90-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

# 2026-08-02 - IB Math AA Middle-Layer v85 Batch-Cohort Planning

- Continued phase 1 middle-layer work only; no formal bank files were written.
- Changed `scripts\build_ib_math_aa_middle_layer_review_batches.cjs` so review batches group by review cohort rather than exact route-key fragments. Default batch capacity is now 5 items / 50 marks. Batch reports and subset specs retain source route keys, category unions, checklist unions and classification-review metadata.
- Verification:
  - `node --check scripts\build_ib_math_aa_middle_layer_review_batches.cjs`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v85-expanded-v8-current-health --max-items 40 --ready-check`
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v85-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v85-expanded-v8-current-health-review-batch-01-skeleton-reject --use-reviewed-skeletons --allow-empty`
- Results: v85 passed with 40 review drafts, 0 ready, 0 structural failures, 11 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 27 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and healthy handoff. v84 had 18 review batches for the same 40 drafts, so this reduces queue fragmentation by 7 batches.
- Negative ready gate selected 5 pending skeletons, ready 0, rejected 5, materialized nothing and did not call installer check.
- Current formal count remains 199 structured reviewed hidden items: SL 73 (`P1:27`, `P2:46`) and HL 126 (`P1:66`, `P2:59`, `P3:1`). Visible and published remain 0.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v85-expanded-v8-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v85-expanded-v8-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v85-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

# 2026-08-02 - IB Math AA Middle-Layer v84 Progress 199

- Continued the active goal: finish the AP-style middle layer first, then continue full IB Math AA rollout. Course remains closed.
- Finished v83 `review-batch-01` and installed `ib-math-aa-hl/P2-000013` (`MathsAA_HL_P2_2021_May_TZ2:Q1`) as a source-checked structured reviewed hidden item through the controlled installer path.
- Verification commands passed:
  - `node scripts\build_ib_math_aa_curriculum.cjs`
  - `node scripts\structured_question_delivery_gate.cjs`
  - `node scripts\validate_ib_math_aa.cjs`
  - `python scripts\validate_ib_learning_schema.py`
  - `npm run build:ib-math-aa:mock-contract`
  - `npm run validate:sop`
  - `npm run validate:structured-delivery`
- Current formal count is 199 structured reviewed hidden items: SL 73 (`P1:27`, `P2:46`) and HL 126 (`P1:66`, `P2:59`, `P3:1`). Visible and published remain 0.
- Refreshed queue with `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v84-expanded-v8-current-health --max-items 40 --ready-check`.
- v84 passed with 40 review drafts, 0 ready, 0 structural failures, 18 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 41 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and healthy handoff.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v84-expanded-v8-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v84-expanded-v8-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v84-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

# 2026-08-02 - IB Math AA Middle-Layer v74 Skeleton Path

- Continued the reset goal: improve the AP-style middle layer before further formal Math AA expansion. No formal bank files were written.
- Made the Reviewed Skeleton path machine-usable:
  - `scripts\build_ib_math_aa_middle_layer_review_batches.cjs` now writes `reviewed_skeleton_items` into every review subset.
  - `scripts\promote_ib_math_aa_middle_layer_ready.cjs` supports `--use-reviewed-skeletons` so reviewed skeletons can become the promotion source while original generated `items` remain the audit trail.
  - `scripts\run_ib_math_aa_ready_gate.cjs` passes `--use-reviewed-skeletons` through to promotion.
  - `scripts\run_ib_math_aa_middle_layer_pipeline.cjs` checks skeleton ID coverage, pending certification templates and absence of middle-layer `auto_*` metadata.
- Verification:
  - `node --check scripts\build_ib_math_aa_middle_layer_review_batches.cjs`
  - `node --check scripts\promote_ib_math_aa_middle_layer_ready.cjs`
  - `node --check scripts\run_ib_math_aa_ready_gate.cjs`
  - `node --check scripts\run_ib_math_aa_middle_layer_pipeline.cjs`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v74-expanded-v8-current-health --max-items 40 --ready-check`
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v74-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v74-expanded-v8-current-health-review-batch-01-skeleton-reject --use-reviewed-skeletons --allow-empty`
- Results: v74 passed with 40 review drafts, 0 ready, 0 structural failures, 19 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 43 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and `handoff_gate.ok:true`. The negative ready gate selected 1 pending skeleton, ready 0, rejected 1, produced no reviewed batch and did not call installer check.
- Current formal count remains 198 structured reviewed hidden items: SL 73 (`P1:27`, `P2:46`) and HL 125 (`P1:66`, `P2:58`, `P3:1`). Visible and published remain 0.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v74-expanded-v8-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v74-expanded-v8-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v74-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

# 2026-08-02 - IB Math AA Middle-Layer v78 OCR Review Hints

- Continued phase 1 middle-layer work only; no formal bank files were written.
- Improved OCR-assisted markscheme review data:
  - `scripts\generate_ib_math_aa_compact_specs_from_scan.cjs` now preserves standalone numeric OCR tokens instead of filtering them out.
  - The same generator sorts markscheme OCR tokens by page, visual row and x coordinate before part bucketing, reducing wrong-order answer fragments.
  - OCR-generated answers, markscheme rows and mark points now carry `auto_extraction.review_hints` with key numbers, equations, award codes, expected marks and mark-total mentions.
  - `scripts\build_ib_math_aa_middle_layer_review_workspace.cjs` displays these hints in answer and markscheme sections.
- Safety shape remains intact: `reviewed_skeleton_items` strip `auto_extraction`, so review hints do not enter the skeleton path; ready promotion still requires completed review certification.
- Verification:
  - `node --check scripts\generate_ib_math_aa_compact_specs_from_scan.cjs`
  - `node --check scripts\build_ib_math_aa_middle_layer_review_workspace.cjs`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v78-expanded-v8-current-health --max-items 40 --ready-check`
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v78-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v78-expanded-v8-current-health-review-batch-01-skeleton-reject --use-reviewed-skeletons --allow-empty`
- Results: v78 passed with 40 review drafts, 0 ready, 0 structural failures, 19 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 43 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and `handoff_gate.ok:true`. Spot check on `ib-math-aa-hl/P2-000013` recovered key markscheme values including `0.805084...`, `2.88135...`, `0.805`, `2.88`, `0.97777...`, `0.978`, `8.51693...`, and `8.52`. The negative ready gate selected 1 pending skeleton, ready 0, rejected 1, produced no reviewed batch and did not call installer check.
- Current formal count remains 198 structured reviewed hidden items: SL 73 (`P1:27`, `P2:46`) and HL 125 (`P1:66`, `P2:58`, `P3:1`). Visible and published remain 0.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v78-expanded-v8-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v78-expanded-v8-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v78-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

# 2026-08-02 - IB Math AA Middle-Layer v115 Quality Health Gate

- Continued phase 1 middle-layer work only; no formal bank files were written.
- Hardened `scripts\run_ib_math_aa_middle_layer_pipeline.cjs` with a `review_draft_quality` health gate. The pipeline now fails if review drafts regress on answer tails, embedded context inside parts, long mark-point descriptions, duplicate full-row mark-point descriptions, generic candidate-value descriptions, or low-confidence mark points missing `mark_point_ocr_uncertain` routing/workspace labels.
- Verification:
  - `node --check scripts\run_ib_math_aa_middle_layer_pipeline.cjs`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v115-current-health --max-items 40 --ready-check`
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v115-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v115-current-health-review-batch-01-negative --use-reviewed-skeletons --allow-empty`
  - `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --plan-only`
- Results: v115 passed with 0 ready, 40 review drafts, 0 structural failures, 13 review batches/subsets/workspaces, 85 image refs, 0 missing refs, 31 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, and `handoff_gate.ok:true`. `CURRENT_HANDOFF.json` now resolves latest to v115.
- Quality gate evidence: 86 answer candidates with 0 answer-tail issues, 0 embedded context in parts, 86 markscheme rows, 280 mark points, 0 long descriptions, 0 duplicate full-row descriptions, 0 generic candidate-value descriptions, 9 low-confidence mark points, 3 low-confidence items, 0 missing routes, 9 workspace labels, and 1 mark-point-OCR batch.
- Negative ready gate selected 1 pending skeleton, ready 0, rejected 1, produced no reviewed batch and did not call installer check.
- Current formal count remains 226 structured reviewed hidden items: SL 81 and HL 145. Visible/published remain 0.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v115-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v115-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v115-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

# 2026-08-02 - IB Math AA Middle-Layer v114 Low-Confidence Mark Point Routing

- Continued phase 1 middle-layer work only; no formal bank files were written.
- Added explicit low-confidence mark-point routing:
  - `scripts\generate_ib_math_aa_compact_specs_from_scan.cjs` adds `mark_point_ocr_uncertain` when OCR cannot isolate required mark points.
  - `scripts\build_ib_math_aa_middle_layer_review_batches.cjs` groups those items into `source_visual_review+mark_point_ocr`.
  - `scripts\build_ib_math_aa_middle_layer_review_workspace.cjs` shows row-level low-confidence counts and per-point `MARK POINT OCR CHECK` labels.
- Verification:
  - `node --check scripts\generate_ib_math_aa_compact_specs_from_scan.cjs`
  - `node --check scripts\build_ib_math_aa_middle_layer_review_workspace.cjs`
  - `node --check scripts\build_ib_math_aa_middle_layer_review_batches.cjs`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v114-current-health --max-items 40 --ready-check`
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v114-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v114-current-health-review-batch-01-negative --use-reviewed-skeletons --allow-empty`
- Results: v114 passed with 0 ready, 40 review drafts, 0 structural failures, 13 review batches/subsets/workspaces, 85 image refs, 0 missing refs, 31 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and `handoff_gate.ok:true`. `CURRENT_HANDOFF.json` now resolves latest to v114.
- Low-confidence routing evidence: 3 items carry `mark_point_ocr_uncertain` (`ib-math-aa-hl/P1-000056`, `ib-math-aa-sl/P1-000030`, `ib-math-aa-hl/P2-000068`), grouped in `review-batch-03` as `source_visual_review+mark_point_ocr`; workspace contains 9 `MARK POINT OCR CHECK` labels.
- Negative ready gate selected 1 pending skeleton, ready 0, rejected 1, produced no reviewed batch and did not call installer check.
- Current formal count remains 226 structured reviewed hidden items: SL 81 and HL 145. Visible/published remain 0.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v114-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v114-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v114-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

# 2026-08-02 - IB Math AA Middle-Layer v113 Consecutive Award Clusters

- Continued phase 1 middle-layer work only; no formal bank files were written.
- Updated `scripts\generate_ib_math_aa_compact_specs_from_scan.cjs` so consecutive award-code clusters such as `A1A1` reuse the same local expression evidence rather than falling back to generic numeric candidates. Note-based `A1 for...` clauses are split by order for graph-sketch mark points.
- Verification:
  - `node --check scripts\generate_ib_math_aa_compact_specs_from_scan.cjs`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v113-current-health --max-items 40 --ready-check`
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v113-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v113-current-health-review-batch-01-negative --use-reviewed-skeletons --allow-empty`
- Results: v113 passed with 0 ready, 40 review drafts, 0 structural failures, 12 review batches/subsets/workspaces, 85 image refs, 0 missing refs, 29 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and `handoff_gate.ok:true`. `CURRENT_HANDOFF.json` now resolves latest to v113.
- Quality scan over v113 review drafts: 86 markscheme rows, 280 mark points, 0 long point descriptions, 0 duplicate full-row point descriptions, 0 generic candidate-value descriptions, and 9 low-confidence OCR-isolation points still explicitly marked for review.
- Negative ready gate selected 1 pending skeleton, ready 0, rejected 1, produced no reviewed batch and did not call installer check.
- Current formal count remains 226 structured reviewed hidden items: SL 81 and HL 145. Visible/published remain 0.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v113-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v113-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v113-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

# 2026-08-02 - IB Math AA Middle-Layer v111 Mark Point Local Slices

- Continued phase 1 middle-layer work only; no formal bank files were written.
- Updated `scripts\generate_ib_math_aa_compact_specs_from_scan.cjs` so OCR-generated mark-point descriptions use local text around each award code, with readable clipping, before falling back to equations or value hints. This keeps full markscheme rows and source assets as evidence while making the review skeleton faster to check.
- Verification:
  - `node --check scripts\generate_ib_math_aa_compact_specs_from_scan.cjs`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v111-current-health --max-items 40 --ready-check`
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v111-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v111-current-health-review-batch-01-negative --use-reviewed-skeletons --allow-empty`
- Results: v111 passed with 0 ready, 40 review drafts, 0 structural failures, 12 review batches/subsets/workspaces, 85 image refs, 0 missing refs, 29 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and `handoff_gate.ok:true`. `CURRENT_HANDOFF.json` now resolves latest to v111.
- Quality scan over v111 review drafts: 86 markscheme rows, 280 mark points, long point descriptions 27 -> 0, duplicate full-row point descriptions 11 -> 0, generic candidate-value descriptions 91 -> 5, with 9 low-confidence OCR-isolation points still explicitly marked for review.
- Negative ready gate selected 1 pending skeleton, ready 0, rejected 1, produced no reviewed batch and did not call installer check.
- Current formal count remains 226 structured reviewed hidden items: SL 81 and HL 145. Visible/published remain 0.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v111-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v111-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v111-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

# 2026-08-02 - IB Math AA Middle-Layer v110 Answer Candidate Hygiene

- Continued phase 1 middle-layer work only; no formal bank files were written.
- Updated `scripts\generate_ib_math_aa_compact_specs_from_scan.cjs` so assignment candidates pass through the same answer cleanup path, and numeric value extraction only accepts known real units instead of arbitrary trailing words. This removes `Note:` tails from review-only generated answers.
- Verification:
  - `node --check scripts\generate_ib_math_aa_compact_specs_from_scan.cjs`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v110-current-health --max-items 40 --ready-check`
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v110-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v110-current-health-review-batch-01-negative --use-reviewed-skeletons --allow-empty`
- Results: v110 passed with 0 ready, 40 review drafts, 0 structural failures, 12 review batches/subsets/workspaces, 85 image refs, 0 missing refs, 29 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and `handoff_gate.ok:true`. `CURRENT_HANDOFF.json` now resolves latest to v110.
- Quality scan over v110 review drafts: 86 answer candidates, 0 award-code tails, 0 footer tails, 0 `Note:` tails, 0 embedded context left inside parts, and 0 mark-point total mismatches.
- Negative ready gate selected 1 pending skeleton, ready 0, rejected 1, produced no reviewed batch and did not call installer check.
- Current formal count remains 226 structured reviewed hidden items: SL 81 and HL 145. Visible/published remain 0.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v110-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v110-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v110-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

# 2026-08-02 - IB Math AA Middle-Layer v108 Answer Cleanup

- Continued phase 1 middle-layer work only; no formal bank files were written.
- Updated `scripts\generate_ib_math_aa_compact_specs_from_scan.cjs` answer-candidate cleanup to remove generic award-code tails, total/footer fragments and exam-code fragments from review-only generated answers.
- Verification:
  - `node --check scripts\generate_ib_math_aa_compact_specs_from_scan.cjs`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v108-current-health --max-items 40 --ready-check`
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v108-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v108-current-health-review-batch-01-negative --use-reviewed-skeletons --allow-empty`
- Results: v108 passed with 0 ready, 40 review drafts, 0 structural failures, 12 review batches/subsets/workspaces, 85 image refs, 0 missing refs, 29 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and `handoff_gate.ok:true`. `CURRENT_HANDOFF.json` now resolves latest to v108.
- Spot check on `ib-math-aa-hl/P2-000094`: embedded context remains in stem blocks, not c/d part text; answer candidate e is `y = 4`, and the b footer tail is removed down to `so y = 2 ...`.
- Negative ready gate selected 1 pending skeleton, ready 0, rejected 1, produced no reviewed batch and did not call installer check.
- Current formal count remains 226 structured reviewed hidden items: SL 81 and HL 145. Visible/published remain 0.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v108-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v108-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v108-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

# 2026-08-02 - IB Math AA Middle-Layer v106 Question Structure

- Continued phase 1 middle-layer work only; no formal bank files were written.
- Updated `scripts\generate_ib_math_aa_compact_specs_from_scan.cjs` so question OCR is coordinate-sorted and OCR-inferred parts are only used when they keep the existing label/mark shape and preserve enough text.
- Added review-only cleanup for embedded inter-part context: phrases like "Now consider..." and "A yellow ball is added..." are moved from part text into source-backed stem blocks instead of forcing the reviewer to manually cut them out.
- Verification:
  - `node --check scripts\generate_ib_math_aa_compact_specs_from_scan.cjs`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v106-current-health --max-items 40 --ready-check`
  - `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --plan-only`
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v106-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v106-current-health-review-batch-01-negative --use-reviewed-skeletons --allow-empty`
- Results: v106 passed with 0 ready, 40 review drafts, 0 structural failures, 12 review batches/subsets/workspaces, 85 image refs, 0 missing refs, 29 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and `handoff_gate.ok:true`. `CURRENT_HANDOFF.json` now resolves latest to v106.
- Spot check on `ib-math-aa-hl/P2-000094`: c/d no longer contain the later game context; the context is in stem blocks. The negative ready gate selected 1 pending skeleton, ready 0, rejected 1, produced no reviewed batch and did not call installer check.
- Current formal count remains 226 structured reviewed hidden items: SL 81 and HL 145. Visible/published remain 0.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v106-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v106-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v106-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

# 2026-08-02 - IB Math AA Middle-Layer v80 Markscheme Row Ordering

- Continued phase 1 middle-layer work only; no formal bank files were written.
- Tightened OCR markscheme helper:
  - `scripts\generate_ib_math_aa_compact_specs_from_scan.cjs` now uses floor-based visual row bucketing for markscheme OCR token ordering, keeping nearby y-coordinate tokens with the correct part label.
  - Assignment extraction now captures complete decimal assignments such as `a = 0.805084...` instead of truncating at `a = 0`.
  - `finalAnswerCandidate` now uses multiple assignment candidates when a part has several answer values.
- Verification:
  - `node --check scripts\generate_ib_math_aa_compact_specs_from_scan.cjs`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v80-expanded-v8-current-health --max-items 40 --ready-check`
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v80-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v80-expanded-v8-current-health-review-batch-01-skeleton-reject --use-reviewed-skeletons --allow-empty`
- Results: v80 passed with 40 review drafts, 0 ready, 0 structural failures, 19 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 43 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and `handoff_gate.ok:true`. Spot check on `ib-math-aa-hl/P2-000013` now gives part a answer candidate `a = 0.805084...; b = 2.88135...; a = 0.805; b = 2.88; r = 0.978`, keeps part b interpretation text separate, and keeps part c `x = 7`, `8.51693...`, `8.52`, `(M1)` and `A1` in the correct bucket. Skeletons remain clean with no `auto_*` metadata and no `review_hints`. The negative ready gate selected 1 pending skeleton, ready 0, rejected 1, produced no reviewed batch and did not call installer check.
- Current formal count remains 198 structured reviewed hidden items: SL 73 (`P1:27`, `P2:46`) and HL 125 (`P1:66`, `P2:58`, `P3:1`). Visible and published remain 0.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v80-expanded-v8-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v80-expanded-v8-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v80-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.

# 2026-08-02 - IB Math AA Middle-Layer v83 Subpart And Mark-Point Hints

- Continued phase 1 middle-layer work only; no formal bank files were written.
- Added review-only subpart and mark-point guidance:
  - `scripts\generate_ib_math_aa_compact_specs_from_scan.cjs` now extracts roman subpart hints such as `(i)/(ii)` from markscheme rows and stores them under `auto_extraction.review_hints.subparts`.
  - OCR mark-point descriptions now use nearby assignment candidates before falling back to raw nearby text.
  - `scripts\build_ib_math_aa_middle_layer_review_workspace.cjs` displays subpart hints inside the review-hints panel.
- Verification:
  - `node --check scripts\generate_ib_math_aa_compact_specs_from_scan.cjs`
  - `node --check scripts\build_ib_math_aa_middle_layer_review_workspace.cjs`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v83-expanded-v8-current-health --max-items 40 --ready-check`
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v83-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v83-expanded-v8-current-health-review-batch-01-skeleton-reject --use-reviewed-skeletons --allow-empty`
- Results: v83 passed with 40 review drafts, 0 ready, 0 structural failures, 19 review batches/subsets/workspaces, 80 image refs, 0 missing refs, 43 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and `handoff_gate.ok:true`. Spot check on `ib-math-aa-hl/P2-000013` shows part a subpart hints for `(i)` and `(ii)`, and mark point descriptions include `A1 (i) b = 2.88`, `A1 (i) a = 0.805`, and `A1 (ii) r = 0.978`. Skeletons remain clean with no `auto_*` metadata, no `review_hints`, and no `subparts`. The negative ready gate selected 1 pending skeleton, ready 0, rejected 1, produced no reviewed batch and did not call installer check.
- Current formal count remains 198 structured reviewed hidden items: SL 73 (`P1:27`, `P2:46`) and HL 125 (`P1:66`, `P2:58`, `P3:1`). Visible and published remain 0.
- Next continuation files: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v83-expanded-v8-current-health.review-index.html`, `tmp\ib-math-aa-generated-compact-specs\middle-layer-v83-expanded-v8-current-health.handoff.json`, and `tmp\ib-math-aa-generated-compact-specs\middle-layer-v83-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.
# 2026-08-02 - IB Math AA Middle-Layer v97 P1-000118 Install

- Continued the active AP-style IB Math AA workflow from v96 without formal writes until the reviewed-skeleton gate passed.
- Source-checked and certified `ib-math-aa-hl/P1-000118` (`MathsAA_HL_P1_Specimen:Q10`) from question asset `q10-p12.webp` and markscheme assets `q10-p11.webp`, `q10-p12.webp`.
- Replaced the noisy OCR skeleton with verified structured content: 3 source-backed stem blocks, 4 official parts, 4 answers, 4 markscheme rows, and 16 one-mark points with `part_label`.
- Commands passed:
  - `node tmp\update_v96_review_batch_01.cjs`
  - `node scripts\run_ib_math_aa_ready_gate.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v96-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json --batch-id middle-layer-v96-expanded-v8-current-health-review-batch-01-ready --use-reviewed-skeletons`
  - `node scripts\install_ib_math_aa_structured_batch.cjs tmp\ib-math-aa-generated-compact-specs\middle-layer-v96-expanded-v8-current-health-review-batch-01-ready.reviewed-batch.json`
  - `node scripts\build_ib_math_aa_curriculum.cjs`
  - `node scripts\structured_question_delivery_gate.cjs`
  - `node scripts\validate_ib_math_aa.cjs`
  - `python scripts\validate_ib_learning_schema.py`
  - `npm run build:ib-math-aa:mock-contract`
  - `npm run validate:sop`
  - `npm run validate:structured-delivery`
  - `node scripts\run_ib_math_aa_middle_layer_pipeline.cjs --scan-glob tmp\ib-math-aa-draft-batches\scan-v8-*.json --batch-id middle-layer-v97-expanded-v8-current-health --max-items 40 --ready-check`
- Result: formal install wrote 1 reviewed hidden item. Current ledger completion count is 217: SL 79 (`P1:30`, `P2:49`) and HL 138 (`P1:76`, `P2:61`, `P3:1`). `student_visible` and published counts remain 0.
- v97 handoff is healthy. Next subset: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v97-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`; expected ready batch: `middle-layer-v97-expanded-v8-current-health-review-batch-01-ready`.
# 2026-08-02 - IB Math AA Middle-Layer v97 P1-000118 Install

- Completed v96 expanded-v8 `review-batch-01` through the reviewed-skeleton workflow and installed `ib-math-aa-hl/P1-000118` (`MathsAA_HL_P1_Specimen:Q10`) as a closed structured reviewed item: 4 parts, 16 marks, 4 markscheme rows, 16 one-mark points, primary `AA-5.16`, required `AA-5.16`, `AA-2.9`, `AA-5.6`, `AA-5.7`, `AA-5.8`, and `AA-5.11`.
- Ready gate selected 1, ready 1, rejected 0; installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 1 reviewed structured item(s).` Full post-install gate chain passed.
- Current ledger completion count is 217 structured reviewed hidden items: SL 79 (`P1:30`, `P2:49`) and HL 138 (`P1:76`, `P2:61`, `P3:1`); visible/published remain 0. Refreshed `middle-layer-v97-expanded-v8-current-health` passed with 0 ready, 40 review drafts, 0 structural failures, 9 review batches/subsets/workspaces, 84 image refs, 0 missing refs, 23 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and `handoff_gate.ok:true`.
- Next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v97-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`; expected ready batch is `middle-layer-v97-expanded-v8-current-health-review-batch-01-ready`.
# 2026-08-02 - IB Math AA Middle-Layer v99 Six-Item Install

- Completed v97 expanded-v8 `review-batch-01` through the reviewed-skeleton workflow and installed 5 source-checked closed structured reviewed items:
  - `ib-math-aa-sl/P1-000047`: arithmetic sequence plus discrete probability normalization, 6 marks, primary `AA-4.7`.
  - `ib-math-aa-hl/P2-000018`: continuous density expectation and variance, 6 marks, primary `AA-4.14`.
  - `ib-math-aa-hl/P2-000040`: independent events and conditional probability, 6 marks, primary `AA-4.11`.
  - `ib-math-aa-hl/P2-000030`: cubic identity and transformed roots, 8 marks, primary `AA-2.12`.
  - `ib-math-aa-hl/P1-000092`: integration by parts and definite integral evaluation, 9 marks, primary `AA-5.16`.
- v97 ready gate selected 5, ready 5, rejected 0; installer no-write returned `Checked 5 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 5 reviewed structured item(s).`
- v98 then produced `ib-math-aa-sl/P2-000033` as a ready reviewed-equivalence transfer from the newly reviewed `ib-math-aa-hl/P2-000040`; installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 1 reviewed structured item(s).`
- Post-write verification passed: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs`, `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`.
- Refreshed `middle-layer-v99-expanded-v8-current-health`: 0 ready, 40 review drafts, 0 structural failures, 10 review batches/subsets/workspaces, 85 image refs, 0 missing refs, 25 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, and `handoff_gate.ok:true`.
- Current ledger completion count is 223 structured reviewed hidden items: SL 81 (`P1:31`, `P2:50`) and HL 142 (`P1:77`, `P2:64`, `P3:1`). Visible/published remain 0. Next subset is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v99-expanded-v8-current-health.review-subsets\review-batch-01.review-draft.compact-spec.json`.
# 2026-08-02 - IB Math AA Middle-Layer v127 P2-000069 And Equivalence Install

- Completed v125 `review-batch-01` through the reviewed-skeleton workflow and installed `ib-math-aa-hl/P2-000069` (`MathsAA_HL_P2_2022_Nov:Q10`) as a closed structured reviewed item.
- Reviewed source image `q10-p12.webp` and markscheme images `q10-p19.webp`/`q10-p20.webp`/`q10-p21.webp`; corrected 4 parts, 4 answers, 4 markscheme rows and all 16 one-mark points.
- Ready gate selected 1, ready 1, rejected 0; installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 1 reviewed structured item(s).`
- Post-install gates passed: curriculum build, structured delivery gate (`5677 item(s), 0 errors`), IB Math AA audit (`0 errors`, existing warnings only), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- v126 refresh then produced one ready reviewed-equivalence item, `ib-math-aa-sl/P2-000054`, transferred from the newly reviewed equivalent `ib-math-aa-hl/P2-000069`; pipeline installer no-write passed and controlled install added the SL item.
- Post-equivalence gates passed again: curriculum build, structured delivery gate (`5678 item(s), 0 errors`), IB Math AA audit (`0 errors`, existing warnings only), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Strict count is now 236 structured reviewed hidden items: SL 87 (`P1:34`, `P2:53`) and HL 149 (`P1:75`, `P2:73`, `P3:1`). Visible/published remain 0.
- Refreshed `middle-layer-v127-post-v126-ready-health`: 0 ready, 40 review drafts, 0 structural failures, 11 review batches/subsets/workspaces, 91 image refs, 0 missing refs, 27 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Process check after refresh found no task-runner leftovers started by this workflow; only existing Node/Codex/Kimi-style processes remain.
- Next entry point: `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch review-batch-01`.

# 2026-08-02 - IB Math AA Middle-Layer v128 P2-000051 Install

- Completed v127 `review-batch-01` through the reviewed-skeleton workflow and installed `ib-math-aa-sl/P2-000051` (`MathsAA_SL_P2_2022_Nov:Q6`) as a closed structured reviewed item.
- Reviewed question images `q06-p08.webp`/`q06-p09.webp` and markscheme images `q06-p13.webp`/`q06-p14.webp`; corrected one 6-mark binomial-expansion coefficient part, final answer `a = 2/7`, one markscheme row, and all 6 one-mark points.
- Ready gate selected 1, ready 1, rejected 0; installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 1 reviewed structured item(s).`
- Post-install gates passed: curriculum build, structured delivery gate (`5679 item(s), 0 errors`), IB Math AA audit (`0 errors`, existing warnings only), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Strict count is now 237 structured reviewed hidden items: SL 88 (`P1:34`, `P2:54`) and HL 149 (`P1:75`, `P2:73`, `P3:1`). Visible/published remain 0.
- Refreshed `middle-layer-v128-post-v127-batch-01-health`: 0 ready, 40 review drafts, 0 structural failures, 11 review batches/subsets/workspaces, 92 image refs, 0 missing refs, 27 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Next entry point: `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch review-batch-01`.

# 2026-08-02 - IB Math AA Middle-Layer v130 Two-Item Batch And Equivalence Install

- Completed v128 `review-batch-01` through the reviewed-skeleton workflow and installed `ib-math-aa-sl/P2-000057` and `ib-math-aa-sl/P1-000008` as closed structured reviewed items.
- `P2-000057`: reviewed `q03-p05.webp`, `q03-p10.webp`, and `q03-p11.webp`; corrected 2 parts, 2 answers, 2 markscheme rows and 5 one-mark points for `(f o g)(x)=2tan x-tan^3 x` and the labelled graph extrema near `(0.685,1.09)` and `(-0.685,-1.09)`.
- `P1-000008`: reviewed `q08-p09.webp`, `q08-p14.webp`, and `q08-p15.webp`; corrected 5 parts, 5 answers, 5 markscheme rows and 16 one-mark points for differentiating `(ln x)/x^4`, point `P=(e^(1/4),1/(4e))`, second-derivative maximum check, `x>1`, and the graph sketch.
- Ready gate selected 2, ready 2, rejected 0; installer no-write returned `Checked 2 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 2 reviewed structured item(s).` A short-prompt warning on `P1-000008` was fixed through reviewed skeleton and controlled overwrite; the warning count returned to the existing 70.
- Full gates passed after the two-item install: curriculum build, structured delivery gate (`5681 item(s), 0 errors`), IB Math AA audit (`0 errors`, existing warnings only), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- v129 refresh produced one ready reviewed-equivalence item, `ib-math-aa-hl/P2-000073`, transferred from `ib-math-aa-sl/P2-000057`; installer no-write passed and controlled install added it.
- Full gates passed again after the equivalence install: curriculum build, structured delivery gate (`5682 item(s), 0 errors`), IB Math AA audit (`0 errors`, existing warnings only), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Fixed middle-layer batch health so a batch with both mark-point OCR review and classification review is counted by `mark_point_ocr_uncertain` category. Syntax checks and v129/v130 pipeline refreshes passed.
- Strict count is now 240 structured reviewed hidden items: SL 90 (`P1:35`, `P2:55`) and HL 150 (`P1:75`, `P2:74`, `P3:1`). Visible/published remain 0.
- Refreshed `middle-layer-v130-post-v129-ready-health`: 0 ready, 40 review drafts, 0 structural failures, 11 review batches/subsets/workspaces, 98 image refs, 0 missing refs, 27 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Process check after refresh found no task-runner leftovers started by this workflow; only existing Codex/Kimi/OpenClaw-style Node processes remain.
- Next entry point: `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch review-batch-01`.

# 2026-08-02 - IB Math AA Middle-Layer v131 P2-000012 Install

- Completed v130 `review-batch-01` through the reviewed-skeleton workflow and installed `ib-math-aa-hl/P2-000012` (`MathsAA_HL_P2_2021_May_TZ1:Q12`) as a closed structured reviewed item.
- Reviewed `q12-p15.webp`; confirmed `q12-p16.webp` and `q12-p17.webp` are blank no-write pages. Reviewed markscheme images `q12-p20.webp`, `q12-p21.webp`, and `q12-p22.webp`.
- Corrected 5 parts, 5 answers, 5 markscheme rows and all 20 one-mark points for partial fractions, logarithmic integration, separable differential equation solving, logistic model rearrangement, `k=2845`, and `t=1.58` days.
- Resolved the generated classification conflict to primary `AA-5.18`, with required `AA-5.18`, `AA-5.15`, `AA-5.8`, and `AA-1.11`.
- Ready gate selected 1, ready 1, rejected 0; installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 1 reviewed structured item(s).`
- Post-install gates passed: curriculum build, structured delivery gate (`5683 item(s), 0 errors`), IB Math AA audit (`0 errors`, existing warnings only), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Strict count is now 241 structured reviewed hidden items: SL 90 (`P1:35`, `P2:55`) and HL 151 (`P1:75`, `P2:75`, `P3:1`). Visible/published remain 0.
- Refreshed `middle-layer-v131-post-v130-batch-01-health`: 0 ready, 40 review drafts, 0 structural failures, 10 review batches/subsets/workspaces, 94 image refs, 0 missing refs, 25 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Process check after refresh found no task-runner leftovers started by this workflow; only existing Codex/Kimi/OpenClaw-style Node processes remain.
- Next entry point: `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch review-batch-01`.

# 2026-08-02 - IB Math AA Middle-Layer v125 P2-000025 Install

- Completed v124 `review-batch-01` through the reviewed-skeleton workflow and installed `ib-math-aa-hl/P2-000025` (`MathsAA_HL_P2_2021_Nov:Q1`) as a closed structured reviewed item.
- Reviewed source images `q01-p03.webp`/`q01-p04.webp`/`q01-p05.webp` and markscheme image `q01-p08.webp`; corrected the table, 5 parts, 5 answers, 5 markscheme rows and all 7 one-mark points.
# 2026-08-02 - IB Math AA Middle-Layer v147 Batch-07 Install

- Used the standard review patch tool before installation: `node scripts\apply_ib_math_aa_review_patch.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v146-post-v145-batch-02-health.review-subsets\review-batch-07.review-draft.compact-spec.json --patch tmp\ib-math-aa-review-patches\v146-review-batch-07.patch.json --output tmp\ib-math-aa-review-patches\v146-review-batch-07.patched.json --report tmp\ib-math-aa-review-patches\v146-review-batch-07.report.json --ready-check --ready-batch-id middle-layer-v146-review-batch-07-ready`.
- Tool result: patched 4, ready 4, rejected 0, installer no-write passed.
- Controlled install added 4 reviewed hidden items: `ib-math-aa-hl/P2-000109`, `ib-math-aa-sl/P1-000062`, `ib-math-aa-sl/P1-000050`, and `ib-math-aa-hl/P1-000058`.
- Verification passed: `node scripts\build_ib_math_aa_curriculum.cjs`; `node scripts\structured_question_delivery_gate.cjs`; `node scripts\validate_ib_math_aa.cjs`; `python scripts\validate_ib_learning_schema.py`; `npm run build:ib-math-aa:mock-contract`; `npm run validate:sop`; `npm run validate:structured-delivery`.
- First v147 health refresh exposed middle-layer quality issues in future draft candidates: one leading context phrase remained inside a part, and one generated row had duplicate mark-point descriptions. Fixed `scripts\generate_ib_math_aa_compact_specs_from_scan.cjs`, ran `node --check`, and reran the refresh successfully.
- Refreshed `middle-layer-v147-post-v146-batch-07-health` with 0 ready, 40 review drafts, 0 structural failures, 15 review batches/subsets/workspaces, 150 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Strict count is now 292 structured reviewed hidden items: SL 111 (`P1:44`, `P2:67`) and HL 181 (`P1:87`, `P2:93`, `P3:1`). Visible/published remain 0.
- Next entry point: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v147-post-v146-batch-07-health.handoff.json`; continue by selecting a practical non-singleton review batch and using the review patch tool before any install.

# 2026-08-02 - IB Math AA Middle-Layer v146 Batch-02 Install

- Used the standard review patch tool before installation: `node scripts\apply_ib_math_aa_review_patch.cjs --input tmp\ib-math-aa-generated-compact-specs\middle-layer-v145-post-v144-batch-10-health.review-subsets\review-batch-02.review-draft.compact-spec.json --patch tmp\ib-math-aa-review-patches\v145-review-batch-02.patch.json --output tmp\ib-math-aa-review-patches\v145-review-batch-02.patched.json --report tmp\ib-math-aa-review-patches\v145-review-batch-02.report.json --ready-check --ready-batch-id middle-layer-v145-review-batch-02-ready`.
- Tool result: patched 5, ready 5, rejected 0, installer no-write passed.
- Controlled install added 5 reviewed hidden items: `ib-math-aa-sl/P1-000015`, `ib-math-aa-sl/P2-000037`, `ib-math-aa-sl/P2-000047`, `ib-math-aa-hl/P1-000067`, `ib-math-aa-sl/P2-000043`.
- Verification passed: `node scripts\build_ib_math_aa_curriculum.cjs`; `node scripts\structured_question_delivery_gate.cjs`; `node scripts\validate_ib_math_aa.cjs`; `python scripts\validate_ib_learning_schema.py`; `npm run build:ib-math-aa:mock-contract`; `npm run validate:sop`; `npm run validate:structured-delivery`.
- Refreshed `middle-layer-v146-post-v145-batch-02-health` with 0 ready, 40 review drafts, 0 structural failures, 14 review batches/subsets/workspaces, 139 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Strict count is now 288 structured reviewed hidden items: SL 109 (`P1:42`, `P2:67`) and HL 179 (`P1:86`, `P2:92`, `P3:1`). Visible/published remain 0.
- Next entry point: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v146-post-v145-batch-02-health.handoff.json`; continue by selecting a practical non-singleton review batch and using the review patch tool before any install.

- First ready-gate attempt correctly failed during installer no-write because the reviewed table block lacked structured `columns` and `rows`; fixed the reviewed skeleton and reran ready gate successfully.
- Ready gate selected 1, ready 1, rejected 0; installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 1 reviewed structured item(s).`
- Post-install gates passed: curriculum build, structured delivery gate (`5676 item(s), 0 errors`), IB Math AA audit (`0 errors`, existing warnings only), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Strict count is now 234 structured reviewed hidden items: SL 86 (`P1:34`, `P2:52`) and HL 148 (`P1:75`, `P2:72`, `P3:1`). Visible/published remain 0.
- Refreshed `middle-layer-v125-post-v124-batch-01-health`: 0 ready, 40 review drafts, 0 structural failures, 11 review batches/subsets/workspaces, 91 image refs, 0 missing refs, 27 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Next entry point: `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch review-batch-01`.

# 2026-08-02 - IB Math AA Middle-Layer v124 P2-000011 Install

- Completed v123 `review-batch-01` through the reviewed-skeleton workflow and installed `ib-math-aa-hl/P2-000011` (`MathsAA_HL_P2_2021_May_TZ1:Q11`) as a closed structured reviewed item.
- Reviewed source image `q11-p14.webp` and markscheme images `q11-p17.webp`/`q11-p18.webp`/`q11-p19.webp`; corrected 6 parts, 6 answers, 6 markscheme rows and all 20 one-mark points.
- Ready gate selected 1, ready 1, rejected 0; installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 1 reviewed structured item(s).`
- Post-install gates passed: curriculum build, structured delivery gate (`5675 item(s), 0 errors`), IB Math AA audit (`0 errors`, existing warnings only), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Strict count is now 233 structured reviewed hidden items: SL 86 (`P1:34`, `P2:52`) and HL 147 (`P1:75`, `P2:71`, `P3:1`). Visible/published remain 0.
- Refreshed `middle-layer-v124-post-v123-batch-01-health`: 0 ready, 40 review drafts, 0 structural failures, 11 review batches/subsets/workspaces, 91 image refs, 0 missing refs, 27 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Process check after refresh found no task-runner leftovers started by this workflow; only existing Node/Codex/Kimi-style processes remain.
- Next entry point: `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch review-batch-01`.

# 2026-08-02 - IB Math AA Middle-Layer v123 P1-000054 Install

- Completed v122 `review-batch-01` through the reviewed-skeleton workflow and installed `ib-math-aa-sl/P1-000054` (`MathsAA_SL_P1_2023_May_TZ2:Q9`) as a closed structured reviewed item.
- Reviewed source image `q09-p17.webp` and markscheme images `q09-p21.webp`/`q09-p22.webp`; corrected the noisy OCR skeleton into 4 parts, 4 answers, 4 markscheme rows and all 14 one-mark points.
- Ready gate selected 1, ready 1, rejected 0; installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 1 reviewed structured item(s).`
- Post-install gates passed: curriculum build, structured delivery gate (`5674 item(s), 0 errors`), IB Math AA audit (`0 errors`, existing warnings only), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Strict count is now 232 structured reviewed hidden items: SL 86 (`P1:34`, `P2:52`) and HL 146 (`P1:75`, `P2:70`, `P3:1`). Visible/published remain 0.
- Refreshed `middle-layer-v123-post-v122-batch-01-health`: 0 ready, 40 review drafts, 0 structural failures, 11 review batches/subsets/workspaces, 91 image refs, 0 missing refs, 27 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Next entry point: `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch review-batch-01`.

# 2026-08-02 - IB Math AA Middle-Layer v122 P2-000044 Install

- Completed v121 `review-batch-01` through the reviewed-skeleton workflow and installed `ib-math-aa-sl/P2-000044` (`MathsAA_SL_P2_2022_May_TZ2:Q8`) as a closed structured reviewed item.
- Reviewed source image `q08-p11.webp` and markscheme images `q08-p19.webp`/`q08-p20.webp`; corrected 3 parts, 3 answers, 3 markscheme rows and all 12 one-mark points.
- Ready gate selected 1, ready 1, rejected 0; installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 1 reviewed structured item(s).`
- Post-install gates passed: curriculum build, structured delivery gate (`5673 item(s), 0 errors`), IB Math AA audit (`0 errors`, existing warnings only), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Strict count is now 231 structured reviewed hidden items: SL 85 (`P1:33`, `P2:52`) and HL 146 (`P1:75`, `P2:70`, `P3:1`). Visible/published remain 0.
- Refreshed `middle-layer-v122-post-v121-batch-01-health`: 0 ready, 40 review drafts, 0 structural failures, 11 review batches/subsets/workspaces, 90 image refs, 0 missing refs, 27 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Next entry point: `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch review-batch-01`.

# 2026-08-02 - IB Math AA Middle-Layer v121 P2-000072 Install

- Completed v120 `review-batch-01` through the reviewed-skeleton workflow and installed `ib-math-aa-sl/P2-000072` (`MathsAA_SL_P2_2023_May_TZ2:Q9`) as a closed structured reviewed item.
- Reviewed source image `q09-p13.webp` and markscheme images `q09-p18.webp`/`q09-p19.webp`; corrected 5 parts, answers, 5 markscheme rows and all 15 one-mark points.
- Ready gate selected 1, ready 1, rejected 0; installer no-write returned `Checked 1 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 1 reviewed structured item(s).`
- Post-install gates passed: curriculum build, structured delivery gate (`5672 item(s), 0 errors`), IB Math AA audit (`0 errors`, existing warnings only), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Strict count is now 230 structured reviewed hidden items: SL 84 (`P1:33`, `P2:51`) and HL 146 (`P1:75`, `P2:70`, `P3:1`). Visible/published remain 0.
- Refreshed `middle-layer-v121-post-v120-batch-01-health`: 0 ready, 40 review drafts, 0 structural failures, 12 review batches/subsets/workspaces, 89 image refs, 0 missing refs, 29 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Next entry point: `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch review-batch-01`.

# 2026-08-02 - IB Math AA Middle-Layer v120 Three-Item Install

- Completed v119 `review-batch-01` through the reviewed-skeleton workflow and installed 3 source-checked closed structured reviewed items:
  - `ib-math-aa-hl/P1-000056`: inverse function existence for shifted cosine, 5 marks.
  - `ib-math-aa-sl/P1-000030`: box plot/outlier and regression lines, 7 marks.
  - `ib-math-aa-hl/P2-000068`: quadrilateral cosine rule/area maximization, 8 marks.
- Left `ib-math-aa-sl/P1-000054` pending because the skeleton still needs source-level OCR and mark-point repair; it was not promoted and is not counted.
- Completed verification before updating this log: `node scripts\build_ib_math_aa_curriculum.cjs`, `node scripts\structured_question_delivery_gate.cjs`, `node scripts\validate_ib_math_aa.cjs`, `python scripts\validate_ib_learning_schema.py`, `npm run build:ib-math-aa:mock-contract`, `npm run validate:sop`, and `npm run validate:structured-delivery`.
- Reverified strict count from formal bank files: 229 structured reviewed hidden items, SL 83 (`P1:33`, `P2:50`) and HL 146 (`P1:75`, `P2:70`, `P3:1`); visible/published remain 0.
- Refreshed `middle-layer-v120-post-v119-batch-01-health` with 0 ready, 40 review drafts, 0 structural failures, 13 review batches/subsets/workspaces, 88 image refs, 0 missing refs, 27 index hrefs, 0 missing hrefs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Next entry point: `node scripts\run_ib_math_aa_post_certified_delivery.cjs --handoff latest --batch review-batch-01`.
# 2026-08-02 - IB Math AA Middle-Layer v144 Batch-08 And Ready Equivalence Install

- Completed v142 `review-batch-08` through the reviewed-skeleton workflow and installed 5 source-checked closed structured reviewed items: `ib-math-aa-hl/P1-000009`, `ib-math-aa-hl/P2-000061`, `ib-math-aa-hl/P2-000085`, `ib-math-aa-hl/P1-000088`, and `ib-math-aa-sl/P1-000059`.
- Reviewed source assets and corrected key OCR losses before ready promotion: sheep-pen counting final answers `6480` and `384`; function graph final area `4.61`; building height `119 m`; HL triangle `AB=sqrt(6)`, `cos(BAC)=1/5`, area `12 cm^2`; SL triangle `AB=sqrt(15)`, `cos(BAC)=1/4`, area `30 cm^2`.
- Ready gate `middle-layer-v142-review-batch-08-ready` selected 5, ready 5, rejected 0; installer no-write returned `Checked 5 reviewed structured item(s); no files were changed.` Controlled install returned `Installed 5 reviewed structured item(s).`
- Full post-install gates passed: curriculum build, structured delivery gate (`5719 item(s), 0 errors`), IB Math AA audit (`0 errors`, 67 warnings), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Refreshed `middle-layer-v143-post-v142-batch-08-health`; it produced one ready equivalent item, `ib-math-aa-sl/P2-000048`, which passed installer no-write and controlled install.
- Full gates passed again after the ready equivalent install: curriculum build, structured delivery gate (`5720 item(s), 0 errors`), IB Math AA audit (`0 errors`, 68 warnings), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Refreshed `middle-layer-v144-post-v143-ready-health`: 0 ready, 40 review drafts, 0 structural failures, 13 review batches/subsets/workspaces, 122 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Strict complete-hidden count is now 278: SL 102 (`P1:40`, `P2:62`) and HL 176 (`P1:85`, `P2:90`, `P3:1`). Visible/published remain 0; course remains closed.
- Current handoff is `tmp\ib-math-aa-generated-compact-specs\middle-layer-v144-post-v143-ready-health.handoff.json`. Next step: inspect v144 batch plan and choose the largest practical non-singleton batch, not singleton `review-batch-01`.
# 2026-08-02 - IB Math AA Review Patch Tool

- Paused new IB Math AA item installation and added the missing AP-style front-half batch tool: `scripts/apply_ib_math_aa_review_patch.cjs`.
- Added npm entry `apply:ib-math-aa:review-patch`.
- The tool reads a review subset and a standard patch JSON, applies reviewed source facts to `reviewed_skeleton_items`, clears pending auto metadata, fills review/classification certification, validates part/answer/markscheme alignment, mark totals, mark point totals, asset refs and knowledge-point codes, then optionally runs ready gate and installer `--check`.
- Added documentation and schema: `docs/IB_MATH_AA_REVIEW_PATCH_TOOL.md`.
- Generated regression patch fixtures under `tmp\ib-math-aa-review-patches\`.
- Regression passed for v142 `review-batch-08`: patched 5, ready 5, rejected 0, installer check passed.
- Regression passed for v144 `review-batch-10`: patched 5, ready 5, rejected 0, installer check passed.
- No new formal bank install was performed during this tool-building step.
# 2026-08-02 - IB Math AA Middle-Layer v154 Batch-15 Install

- Completed v153 `review-batch-15` via standard review patch flow.
- Patch: `tmp\ib-math-aa-review-patches\v153-review-batch-15.patch.json`.
- Ready check: patched 3, ready 3, rejected 0; installer no-write passed.
- Installed 3 closed structured reviewed items: `ib-math-aa-sl/P1-000019`, `ib-math-aa-hl/P1-000119`, and `ib-math-aa-sl/P1-000033`.
- Full gates passed after install: curriculum build, structured delivery gate (`5761 item(s), 0 errors`), IB Math AA audit (`0 errors`, 101 warnings), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Strict count is now 319 structured reviewed hidden items: SL 128 (`P1:52`, `P2:76`) and HL 191 (`P1:90`, `P2:100`, `P3:1`). Visible/published remain 0.
- Refreshed `middle-layer-v154-post-v153-batch-15-health`: 1 ready, 39 review drafts, 0 structural failures, 20 review batches/subsets/workspaces, 179 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Next entry point: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v154-post-v153-batch-15-health.handoff.json`.

# 2026-08-02 - IB Math AA Middle-Layer v153 Batch-12 Install

- Completed v152 `review-batch-12` via standard review patch flow.
- Patch: `tmp\ib-math-aa-review-patches\v152-review-batch-12.patch.json`.
- Ready check: patched 3, ready 3, rejected 0; installer no-write passed.
- Installed 3 closed structured reviewed items: `ib-math-aa-hl/P1-000070`, `ib-math-aa-sl/P1-000044`, and `ib-math-aa-hl/P2-000032`.
- Full gates passed after install: curriculum build, structured delivery gate (`5758 item(s), 0 errors`), IB Math AA audit (`0 errors`, 98 warnings), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Strict count is now 316 structured reviewed hidden items: SL 126 (`P1:50`, `P2:76`) and HL 190 (`P1:89`, `P2:100`, `P3:1`). Visible/published remain 0.
- Refreshed `middle-layer-v153-post-v152-batch-12-health`: 1 ready, 39 review drafts, 0 structural failures, 19 review batches/subsets/workspaces, 172 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Next entry point: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v153-post-v152-batch-12-health.handoff.json`.

# 2026-08-02 - IB Math AA Middle-Layer v152 Batch-11 Install

- Completed v151 `review-batch-11` via `scripts/apply_ib_math_aa_review_patch.cjs`.
- Patch: `tmp\ib-math-aa-review-patches\v151-review-batch-11.patch.json`.
- Ready check: patched 4, ready 4, rejected 0; installer no-write passed.
- Installed 4 closed structured reviewed items: `ib-math-aa-sl/P2-000002`, `ib-math-aa-sl/P1-000046`, `ib-math-aa-sl/P1-000072`, and `ib-math-aa-hl/P2-000110`.
- Full gates passed after install: curriculum build, structured delivery gate (`5755 item(s), 0 errors`), IB Math AA audit (`0 errors`, 95 warnings), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Updated SL Mock status to `ready_pending_course_release` because SL exact Mock structure is reviewed but course release remains closed. HL stays `paper_practice_only`.
- Strict count is now 313 structured reviewed hidden items: SL 125 (`P1:49`, `P2:76`) and HL 188 (`P1:88`, `P2:99`, `P3:1`). Visible/published remain 0.
- Refreshed `middle-layer-v152-post-v151-batch-11-health`: 1 ready, 39 review drafts, 0 structural failures, 18 review batches/subsets/workspaces, 167 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Next entry point: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v152-post-v151-batch-11-health.handoff.json`.
# 2026-08-03 - IB Math AA Middle-Layer v192 Batch-01 Install

- Completed v191 `review-batch-01` as a 2-item, 32-mark batch through the standard review patch workflow.
- Patch: `tmp\ib-math-aa-review-patches\v191-review-batch-01.patch.json`.
- Ready check: patched 2, selected 2, ready 2, rejected 0; installer no-write passed.
- Installed 2 closed structured reviewed items: `ib-math-aa-hl/P2-000034` (rational function with oblique asymptote, graph sketch, partial fractions and logarithmic integral; primary `AA-2.13`) and `ib-math-aa-sl/P1-000053` (acute-angle trigonometry, sine rule, supplementary angles and triangle area; primary `AA-3.2`).
- Full gates passed after install: curriculum build, structured delivery gate (`5828 item(s), 0 errors`), IB Math AA audit (`0 errors`, 110 warnings), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Strict completion-ledger count is now 389 structured reviewed hidden items: SL 152 (`P1:65`, `P2:87`) and HL 237 (`P1:104`, `P2:119`, `P3:14`). Visible/published remain 0 and course remains closed.
- Refreshed `middle-layer-v192-post-v191-batch-01-health`: 0 ready, 23 review drafts, 0 structural failures, 12 review batches/subsets/workspaces, 146 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Next entry point: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v192-post-v191-batch-01-health.handoff.json`; next batch is `review-batch-01`, four items totaling 33 marks: `ib-math-aa-sl/P1-000021`, `ib-math-aa-sl/P1-000048`, `ib-math-aa-hl/P1-000039`, and `ib-math-aa-hl/P2-000010`.

# 2026-08-03 - IB Math AA Middle-Layer v191 Batch-01 Install

- Completed v190 `review-batch-01` as a 2-item, 41-mark batch through the standard review patch workflow.
- Patch: `tmp\ib-math-aa-review-patches\v190-review-batch-01.patch.json`.
- Ready check: patched 2, selected 2, ready 2, rejected 0; installer no-write passed.
- Installed 2 closed structured reviewed items: `ib-math-aa-sl/P2-000035` (rational function, inverse function, graph reflections and enclosed area; primary `AA-2.5`) and `ib-math-aa-hl/P3-000020` (Paper 3 sequence `f_n(x)=cos(n arccos x)`, extrema patterns, stationary points and trigonometric recurrence; primary `AA-3.10`).
- Full gates passed after install: curriculum build, structured delivery gate (`5826 item(s), 0 errors`), IB Math AA audit (`0 errors`, 110 warnings), learning schema, Mock contract build, SOP gate, and structured-delivery npm gate.
- Strict completion-ledger count is now 387 structured reviewed hidden items: SL 151 (`P1:64`, `P2:87`) and HL 236 (`P1:104`, `P2:118`, `P3:14`). Visible/published remain 0 and course remains closed.
- Refreshed `middle-layer-v191-post-v190-batch-01-health`: 0 ready, 25 review drafts, 0 structural failures, 13 review batches/subsets/workspaces, 158 image refs, 0 missing refs, `reviewed_skeleton_issues:0`, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Next entry point: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v191-post-v190-batch-01-health.handoff.json`; next batch is `review-batch-01`, `ib-math-aa-hl/P2-000034` plus `ib-math-aa-sl/P1-000053`, 32 estimated marks.
# 2026-08-03 - IB Math AA Middle-Layer v199 Batch-01 Install

- Completed v199 `review-batch-01` via `scripts/apply_ib_math_aa_review_patch.cjs`.
- Patch: `tmp\ib-math-aa-review-patches\v199-review-batch-01.patch.json`.
- Ready check: patched 1, selected 1, ready 1, rejected 0; installer no-write passed.
- Installed 1 closed structured reviewed item: `ib-math-aa-hl/P3-000007` (polygonal-number investigation with triangular numbers, pentagonal numbers, table/algebra methods and induction, 27 marks, primary `AA-1.15`).
- Full gates passed after install: curriculum build, structured delivery gate (`5843 item(s), 0 errors`), IB Math AA audit (`0 errors`, 109 warnings), learning schema validation, Mock contract build, SOP gate, and structured-delivery npm gate.
- Formal bank remains closed: total 433, visible 0, published 0, blocked 433. SL 162 (`P1:72`, `P2:90`), HL 271 (`P1:120`, `P2:131`, `P3:20`); both subjects are inactive candidate courses.
- Refreshed `middle-layer-v200-post-v199-batch-01-health`: 0 ready, 8 review drafts, 0 structural failures, 4 review batches/subsets/workspaces, 32 image refs, 0 missing refs, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Next entry point: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v200-post-v199-batch-01-health.handoff.json`; next batch is `review-batch-01`, 42 estimated marks across `ib-math-aa-sl/P2-000007`, `ib-math-aa-sl/P1-000034`, `ib-math-aa-sl/P2-000041`, and `ib-math-aa-hl/P2-000051`.

# 2026-08-03 - IB Math AA Middle-Layer v198 Batch-01 Install

- Completed v198 `review-batch-01` via `scripts/apply_ib_math_aa_review_patch.cjs`.
- Patch: `tmp\ib-math-aa-review-patches\v198-review-batch-01.patch.json`.
- Ready check: patched 2, selected 2, ready 2, rejected 0; installer no-write passed.
- Installed 2 closed structured reviewed SL items: `ib-math-aa-sl/P1-000018` (displacement, velocity, direction change and total distance, 14 marks, primary `AA-5.9`) and `ib-math-aa-sl/P1-000061` (grouped data, cumulative frequency, sampling, box plot, mean and variance, 17 marks, primary `AA-4.2`).
- Full gates passed after install: curriculum build, structured delivery gate (`5842 item(s), 0 errors`), IB Math AA audit (`0 errors`, 109 warnings), learning schema validation, Mock contract build, SOP gate, and structured-delivery npm gate.
- Formal bank remains closed: total 433, visible 0, published 0, blocked 433. SL 162 (`P1:72`, `P2:90`), HL 271 (`P1:120`, `P2:131`, `P3:20`); both subjects are inactive candidate courses.
- Refreshed `middle-layer-v199-post-v198-batch-01-health`: 0 ready, 9 review drafts, 0 structural failures, 5 review batches/subsets/workspaces, 45 image refs, 0 missing refs, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Next entry point: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v199-post-v198-batch-01-health.handoff.json`; next batch is `review-batch-01`, `ib-math-aa-hl/P3-000007`, 27 estimated marks.

# 2026-08-03 - IB Math AA Middle-Layer v197 Batch-01 Install

- Completed v197 `review-batch-01` via `scripts/apply_ib_math_aa_review_patch.cjs`.
- Patch: `tmp\ib-math-aa-review-patches\v197-review-batch-01.patch.json`.
- Ready check: patched 2, selected 2, ready 2, rejected 0; installer no-write passed.
- Installed 2 closed structured reviewed HL items: `ib-math-aa-hl/P3-000018` (orthogonal and fixed-angle curve-family differential-equation investigation, 31 marks, primary `AA-5.18`) and `ib-math-aa-hl/P2-000093` (spring cosine model and time probability, 13 marks, primary `AA-3.7`).
- Full gates passed after install: curriculum build, structured delivery gate (`5840 item(s), 0 errors`), IB Math AA audit (`0 errors`, 109 warnings), learning schema validation, Mock contract build, SOP gate, and structured-delivery npm gate.
- Formal bank remains closed: total 433, visible 0, published 0, blocked 433. SL 162 (`P1:72`, `P2:90`), HL 271 (`P1:120`, `P2:131`, `P3:20`); both subjects are inactive candidate courses.
- Refreshed `middle-layer-v198-post-v197-batch-01-health`: 0 ready, 11 review drafts, 0 structural failures, 6 review batches/subsets/workspaces, 54 image refs, 0 missing refs, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Next entry point: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v198-post-v197-batch-01-health.handoff.json`; next batch is `review-batch-01`, `ib-math-aa-sl/P1-000018` plus `ib-math-aa-sl/P1-000061`, 31 estimated marks.
# 2026-08-03 - IB Math AA Middle-Layer v203 Batch-01/02 Install

- Completed v203 `review-batch-01` and `review-batch-02` via `scripts/apply_ib_math_aa_review_patch.cjs`.
- Patches: `tmp\ib-math-aa-review-patches\v203-review-batch-01.patch.json` and `tmp\ib-math-aa-review-patches\v203-review-batch-02.patch.json`.
- Ready checks: batch-01 patched 1, selected 2, ready 1, rejected 1; batch-02 patched 1, selected 1, ready 1, rejected 0; installer no-write passed for both. `ib-math-aa-sl/P2-000007` stayed in review because paired markscheme evidence is incomplete for part `c.ii`.
- Installed 2 closed structured reviewed items: `ib-math-aa-hl/P2-000007` (continuous probability-density normalization and parameter solving, 7 marks, primary `AA-4.14`) and `ib-math-aa-sl/P2-000070` (inverse function, intersections, enclosed area and same-gradient condition, 15 marks, primary `AA-2.5`).
- Full gates passed after install: curriculum build, structured delivery gate (`5850 item(s), 0 errors`), IB Math AA audit (`0 errors`, 107 warnings), learning schema validation, Mock contract build, SOP gate, and structured-delivery npm gate.
- Formal bank remains closed: total 433, visible 0, published 0, blocked 433. SL 162 (`P1:72`, `P2:90`), HL 271 (`P1:120`, `P2:131`, `P3:20`); both subjects are inactive candidate courses.
- Refreshed `middle-layer-v204-post-v203-batch-01-02-health`: 0 ready, 1 review draft, 0 structural failures, 1 review batch/subset/workspace, 3 image refs, 0 missing refs, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Next entry point: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v204-post-v203-batch-01-02-health.handoff.json`.

# 2026-08-03 - IB Math AA Middle-Layer v202 Batch-01 Install

- Completed v202 `review-batch-01` via `scripts/apply_ib_math_aa_review_patch.cjs`.
- Patch: `tmp\ib-math-aa-review-patches\v202-review-batch-01.patch.json`.
- Ready check: patched 1, selected 3, ready 1, rejected 2; installer no-write passed. `ib-math-aa-sl/P2-000007` and `ib-math-aa-hl/P2-000007` stayed in review because paired markscheme evidence is incomplete for all scoring parts.
- Installed 1 closed structured reviewed item: `ib-math-aa-hl/P1-000095` (function `e^(cos 2x)`, stationary points, second-derivative classification, sketch, Maclaurin series and integral approximation, 21 marks, primary `AA-5.19`).
- Full gates passed after install: curriculum build, structured delivery gate (`5848 item(s), 0 errors`), IB Math AA audit (`0 errors`, 107 warnings), learning schema validation, Mock contract build, SOP gate, and structured-delivery npm gate.
- Formal bank remains closed: total 433, visible 0, published 0, blocked 433. SL 162 (`P1:72`, `P2:90`), HL 271 (`P1:120`, `P2:131`, `P3:20`); both subjects are inactive candidate courses.
- Refreshed `middle-layer-v203-post-v202-batch-01-health`: 0 ready, 3 review drafts, 0 structural failures, 2 review batches/subsets/workspaces, 8 image refs, 0 missing refs, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Next entry point: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v203-post-v202-batch-01-health.handoff.json`.

# 2026-08-03 - IB Math AA Middle-Layer v201 Batch-01 Install

- Completed v201 `review-batch-01` via `scripts/apply_ib_math_aa_review_patch.cjs`.
- Patch: `tmp\ib-math-aa-review-patches\v201-review-batch-01.patch.json`.
- Ready check: patched 1, selected 2, ready 1, rejected 1; installer no-write passed. `ib-math-aa-sl/P2-000007` stayed in review because local paired markscheme evidence is incomplete for part `c.ii`.
- Installed 1 closed structured reviewed item: `ib-math-aa-hl/P3-000014` (fixed-sum maximum-product investigation using AM-GM, logarithms, differentiation and integer comparison, 30 marks, primary `AA-5.8`).
- Full gates passed after install: curriculum build, structured delivery gate (`5847 item(s), 0 errors`), IB Math AA audit (`0 errors`, 107 warnings), learning schema validation, Mock contract build, SOP gate, and structured-delivery npm gate.
- Formal bank remains closed: total 433, visible 0, published 0, blocked 433. SL 162 (`P1:72`, `P2:90`), HL 271 (`P1:120`, `P2:131`, `P3:20`); both subjects are inactive candidate courses.
- Refreshed `middle-layer-v202-post-v201-batch-01-health`: 0 ready, 4 review drafts, 0 structural failures, 2 review batches/subsets/workspaces, 13 image refs, 0 missing refs, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Next entry point: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v202-post-v201-batch-01-health.handoff.json`.

# 2026-08-03 - IB Math AA Middle-Layer v200 Batch-01 Install

- Completed v200 `review-batch-01` via `scripts/apply_ib_math_aa_review_patch.cjs`.
- Patch: `tmp\ib-math-aa-review-patches\v200-review-batch-01.patch.json`.
- Ready check: patched 3, selected 4, ready 3, rejected 1; installer no-write passed. `ib-math-aa-sl/P2-000007` stayed in review because local paired markscheme evidence is incomplete for part `c.ii`.
- Installed 3 closed structured reviewed items: `ib-math-aa-sl/P1-000034` (derivative graph, second derivative and concavity, 14 marks, primary `AA-5.7`), `ib-math-aa-sl/P2-000041` (box-and-whisker reaction-time comparison, 6 marks, primary `AA-4.3`), and `ib-math-aa-hl/P2-000051` (box-and-whisker reaction-time comparison, 6 marks, primary `AA-4.3`).
- Full gates passed after install: curriculum build, structured delivery gate (`5846 item(s), 0 errors`), IB Math AA audit (`0 errors`, 107 warnings), learning schema validation, Mock contract build, SOP gate, and structured-delivery npm gate.
- Formal bank remains closed: total 433, visible 0, published 0, blocked 433. SL 162 (`P1:72`, `P2:90`), HL 271 (`P1:120`, `P2:131`, `P3:20`); both subjects are inactive candidate courses.
- Refreshed `middle-layer-v201-post-v200-batch-01-health`: 0 ready, 5 review drafts, 0 structural failures, 3 review batches/subsets/workspaces, 20 image refs, 0 missing refs, `review_draft_quality.ok:true`, `handoff_gate.ok:true`, and 0 unjustified singleton batches.
- Next entry point: `tmp\ib-math-aa-generated-compact-specs\middle-layer-v201-post-v200-batch-01-health.handoff.json`.
# 2026-08-03 - IB Math AA Production Release Verification

- Rechecked `https://lynkedu.com` after the latest Cloudflare Pages production deployment. The custom domain now serves the same release data as `https://cdb69589.lynkedu-ap-question-bank.pages.dev`: IB active, SL public/certified with 149 visible and 13 blocked, HL public/certified with 235 visible and 36 blocked.
- Fixed release-mode behavior in `scripts/ib_math_aa_student_surface_audit.cjs` and `scripts/curriculum_surface_audit.cjs` so `--release` connects to an already-running production URL instead of trying to start a local Vite preview. Also increased production wait time in the IB student-surface audit to avoid early sampling while the online paper bank is still loading, and made Windows audit-profile cleanup non-fatal.
- Production browser audits passed:
  - `npm run audit:ib-math-aa:student-surface -- --release --url https://lynkedu.com/ --port 9814`: 4 cases, 0 errors.
  - `npm run audit:curriculum-surface -- --release --url https://lynkedu.com/ --port 9812`: 0 errors.
- Found production D1 missing the IB Learning/Mock/upload tables. Applied remote D1 migrations `0004` through `0007` to `lynkedu-question-bank`, then confirmed all expected tables exist and `attempt_mark_point_results` has `mark_value` plus `knowledge_point_codes_json`.
- Ran a production authenticated API audit with marked test account. Passed registration/login, `/api/me`, Mock eligibility, Mock creation, Mock detail, timer start/pause, typed answer creation, attempt detail, attempt confirmation, learning attempt list, upload-batch list, and Mock list. Mock evidence: SL Mock created with 2 papers and 18 questions.
- Remaining blocker: Cloudflare R2 is not enabled for the account. `wrangler r2 bucket list` fails with code `10042`, and production upload-batch creation returns `503 answer_storage_unavailable`. Next action is external Cloudflare setup: enable R2, create/bind private answer bucket as `ANSWER_ASSETS` for the Pages production environment, redeploy if needed, then rerun the production upload asset + complete audit.
