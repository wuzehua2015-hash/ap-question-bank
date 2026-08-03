# LynkEdu Decisions

## 2026-07-13: Cloudflare Pages Is Current Production Host

Production is Cloudflare Pages, not GitHub Pages or Vercel.

Reason:
- The site now uses Cloudflare Pages Functions and D1-backed login/progress.
- Custom domains `lynkedu.com` and `www.lynkedu.com` are bound to the Pages project.

Consequence:
- `vite.config.js` must use `base: '/'` for root-domain production.
- Old docs that mention GitHub Pages `base: '/ap-question-bank/'` are historical and must not be used for current production.
- Direct `wrangler pages deploy dist` can update production even when GitHub push is unavailable.

## 2026-07-13: Access Tiers

The product access model is:

- Visitor: online unit Quiz only.
- Registered account: online unit Quiz, online Mock Exam, mistake book, and practice history.
- `翎英学员`: full tools, downloads, and knowledge-point explanations.

Search, question sets, similar-question workflows, PDF downloads, and unit knowledge-point explanations are premium student tools. Mistake book and practice history are registered-account features because they are part of the site's learning-data infrastructure.

Student-facing labels must say `注册会员` and `翎英学员`; do not expose internal account-state terms such as internal/certified student labels.

## 2026-07-13: Student Account Flow

The account system uses password login as the primary student flow. Email one-time codes remain as fallback for legacy accounts, email verification, and password recovery.

Registration must be a separate route (`/register`) with email, password, display name, and optional `翎英学员` invite code. Login must be a separate route (`/login`) with password login first and code login second. Password recovery must use `/reset-password`.

Account management must expose profile editing, learning-data sync, email verification, password setup/change, and logout-other-devices controls. Teacher-side assignment tables stay reserved; no teacher UI is exposed in this phase.

## 2026-07-13: SEO/GEO Backlog

SEO/GEO optimization is a required future workstream before broader public acquisition. It must cover classic search indexing, AI answer-engine discoverability, public landing content, metadata, structured data, sitemap/robots, performance, canonical URLs, and Chinese-first brand positioning for `lynkedu.com`.

## 2026-07-13: Search Scope

Search stays within the current subject. Cross-subject search is intentionally not implemented because it is low value for the current student workflow.

Search must reuse the production question rendering path rather than maintaining a separate simplified renderer. This prevents CS/code/table/formula display regressions.

## 2026-07-13: PDF Download Policy

PDF download is not a standalone public purchase feature at this stage. It is a `翎英学员` learning tool.

Reason:
- Lower operational complexity.
- Lower copyright/commercialization risk than selling individual AP-question PDFs.

## 2026-07-13: Student Home Layout

The student home page should be maintained as a learning dashboard, not a loose directory of cards. The first screen should make the current subject, next practice action, mock exam action, account state, selected-subject scope, and common review tools visible with clear hierarchy.

Student-facing copy must explain direct student value. Internal teaching-research, data-infrastructure, or system-iteration rationale belongs in maintenance docs, not the product UI.
## 2026-07-13: Minimal Student UI Direction

The student web UI should prefer a minimalist learning-tool style over dense dashboard cards. Home should avoid card walls, repeated metric boxes, and equal-weight tool grids. Keep the first screen focused on current subject, two primary actions, quiet account/subject context, and sparse secondary links.
## 2026-07-13: Lightweight Learning Flow

Home may use existing local/account progress data to adjust copy and the secondary action, but it should not become a heavy recommendation system. Current approved pattern: current subject, two primary actions, and one context-aware secondary link such as `复盘错题` when wrong questions exist.
## 2026-07-13: Account Page Layout

Login, registration, and password recovery should use a quiet single-column account form pattern. Do not add side panels such as `账号能保存什么` or benefits cards that feel like product-copy patches. Account pages should focus on the immediate task, with only concise helper text and route links.

## 2026-07-13: Subject Management State Contract

`mySubjects` is the student's learning scope. Home and the header switcher must show only selected subjects, while the full catalog lives in Settings.

Subject-dependent pages must not silently load a default subject when `mySubjects` is empty. They must show a clear choose-subject prompt. This applies to direct URL entry as well as header navigation.

Adding a subject sets it as current/default. Once at least one subject is selected, the UI blocks removing the final selected subject. If the current/default subject is removed while other selected subjects remain, both `currentSubject` and `defaultSubject` must fall back to a remaining selected subject in the same state update.

## 2026-07-13: Question Pool Expansion Standard

Question-pool expansion must preserve the same delivery quality as a full subject rebuild. A subject can receive new questions only through its source pack, risk discovery, rendering strategy, pipeline, validators, and student-surface checks.

The expansion target is not only total count. The main target is usable coverage by unit and by student workflow: unit Quiz, Mock Exam, search/question set, review, scoring, and PDF output. New items that weaken rendering, unit classification, answerability, scoring quality, or browser/PDF behavior are not acceptable even if they increase the count.

Network expansion is mandatory for low-volume subjects. Do not rely only on one local old source. Prefer official, current, and public reliable sources; prefer 2009-or-newer materials, and put current-course CED or AP Central materials first. Any network source must pass source reliability, timeliness, answer/scoring completeness, structure quality, permission, and deduplication checks before publication.

The current expansion priority is CSA, Physics 1, Biology, CSP, Physics 2, then Environmental Science.

## 2026-07-13: Expansion Closeout Semantics

Publishing one accepted source batch is not the same as completing a subject expansion goal. Expansion work must distinguish:

- `partial`: a source batch was added and passed delivery checks, but capacity risk, sparse units, source inventory, or deferred candidates remain.
- `complete`: the full expansion objective is achieved after network source inventory, source decisions, capacity review, and student-surface checks.

If capacity audit remains `High` or `Medium`, do not close the expansion goal as complete unless there is an explicit written product decision accepting the remaining shortage. The required guard is:

```powershell
npm run audit:expansion-closeout -- --subject=<subject-id> --status=partial|complete
```

CSA after the 2025 CED batch is `partial`, not complete.

## 2026-07-13: CSA Current CED Expansion

AP Computer Science A now includes the current official CED sample questions as a published source: 20 MCQ and 4 FRQ. CED items keep their official A-D option format and must not be padded to A-E.

CSA expansion must continue to use structured Java/code/table rendering rather than prompt screenshots. The mandatory CSA post-pipeline check is `npm run audit:csa`, in addition to full `npm run validate`, build, render, student-flow, and capacity audits.

The 2009 scanned released exam remains a deferred candidate until its Java code, options, answer key, FRQ prompts, and scoring rows are reconstructed from the scanned source.

## 2026-07-22: Reverse-Hidden Classification Gate

When a scored item is hidden or blocked from student surfaces, that state must be reviewed as a first-class classification decision. A subject closeout is not complete if validation only checks visible items while hidden scored inventory may still map to current official topics.

For framework migrations, use this decision order:

1. Check prompt/shared-context evidence against current official topics.
2. Restore any item that maps to current official topics.
3. Block only items whose required solving knowledge is outside the current official framework or otherwise not deliverable.
4. Do not let stale labels, old `classification_reasoning`, or wrong-option-only concepts determine either blocking or unit placement.

Physics 2 now enforces this through `validate:physics-2-units`, which runs `calc_physics_topic_classification_audit.cjs --review-blocked`.

## 2026-07-28: Generated Math AA Banks Require Separate Semantic Review

Owned-original generation is not publication evidence by itself. A generated Math AA item may become student-visible only after a separate review pass records the visible solving path, maps the item to a subtopic registered in `classification_config.json`, and explains why an earlier topic area is insufficient.

HL Paper 3 topic labels must follow the actual investigation method. One generic derivative task cannot be duplicated under T1-T4 labels merely to create even topic counts.

The reproducible publication path is:

`npm run rebuild:ib-math-aa:owned`

If that review or validation fails, Math AA SL/HL return to candidate status until the content is repaired and all release checks pass.

## 2026-07-28: Knowledge-Point Classification Must Be Content-Derived

The earlier archetype review is not accepted as full item-level classification. For Math AA and future curricula, a publication-grade classification must be derived from the visible prompt, every scored subpart, and the correct solution path without using the stored unit/topic label as the deciding input.

Each item must have a content fingerprint, primary knowledge point, all required knowledge points, visible evidence, and ordered solving steps. Any prompt, solution, or markscheme change invalidates the fingerprint and requires reclassification.

Unit or Paper practice must filter on the primary knowledge point. A term appearing incidentally in a prompt or non-primary dependency cannot place the item into that knowledge-point Quiz bucket.

Exact prompt-and-solution duplicates inside one bank are release-blocking. Parameter changes count as distinct items only when the resulting visible problem is actually different.

## 2026-07-28: Math AA Completion Means Full Knowledge-Point Coverage

Bank-derived dropdown entries are not a curriculum tree. Math AA must keep all 83 official syllabus items and every registered granular leaf visible, including leaves with zero questions.

Full-course coverage may be reported only when every in-scope leaf has at least 8 primary questions. Required/dependency counts are reported separately and do not substitute for primary practice capacity. Until that threshold is met, subject metadata must remain `curriculumCoverageStatus: "incomplete"` even if the currently published subset passes item-level quality checks.

## 2026-07-28: Official Online Papers Require Separate Source And Publication Decisions

A source may be complete, official, paired with a markscheme, visually verified, and new relative to local inventory while still being ineligible for the public student bank. Source qualification and republication permission are separate gates.

The IB Math AA specimen packet is accepted into the internal source inventory because all 121 pages, five paper/markscheme pairs, and 44 questions were verified. The public page describes the material as provided for information only, so exact question text remains non-public until explicit republication permission is recorded. This restriction does not prevent using the source for internal curriculum analysis or answer-path review.

## 2026-07-29: IB Math AA Learning, Quiz, And Mock SSoT

IB Math AA is the first constructed-response implementation. Quiz and Mock share one append-only per-question attempt model, but they do not share the same lifecycle.

Quiz is temporary and unlimited. The generated set is not persisted. For an authenticated student, each submitted MCQ or constructed response is persisted as a separate question attempt; unanswered generated Quiz items are not persisted. Visitors may use allowed Quiz flows but cannot upload files or create account learning records.

Mock Exam is persistent and account-only. Each authenticated student may generate at most one Mock per subject per Asia/Shanghai business date. Generation stores ordered `(subject_id, question_id)` references, not full question content. Re-entry returns the same Mock. Archiving or deleting it from the visible list does not restore the daily generation allowance.

IB Paper timers are independent inside one Mock: SL P1/P2 and HL P1/P2/P3 each store their own total and remaining seconds. Entering a Paper starts its countdown; periodic and exit saves allow the student to continue from the stored remaining time.

The canonical question locator is `(subject_id, question_id)`. Existing IDs remain unchanged. New AP IDs use `MCQ-######` or `FRQ-######`; new IB IDs use `P1-######`, `P2-######`, or `P3-######`. Subparts use `part_label` together with the question locator.

The first implementation is deliberately manual-first: persistent Mock, timers, learning center, per-question history, and manual subpart scoring precede R2, Agnes transcription, and automatic mark-point suggestions. Full gap and delivery details live in `docs/IB_MATH_AA_CONSTRUCTED_RESPONSE_GAP_PLAN_2026-07-29.md`.

## 2026-07-29: A Full IB Mock Requires Structural Roles, Not Only The Correct Total Mark

Math AA Mock readiness is determined by `public/data/ib/math-aa/mock_blueprint.json` plus the generated per-question eligibility manifest. Having enough aggregate marks is not completion evidence.

P1/P2 short-response and extended-response sections are separate selection pools. A collection of independent 4-6 mark practice items cannot replace the official-style 13-21 mark extended-response questions even if the total equals 80 or 110. HL Paper 3 requires continuous 30-mark and 25-mark investigations; independent 8-mark tasks cannot be combined and presented as that structure.

Until every Paper passes its exact structural gate, student metadata must remain `paper_practice_only`. The Mock contract validator is part of the full validation chain and prevents an early status change.

## 2026-07-29: Real-Source Questions Only

This decision supersedes every earlier allowance for LynkEdu-owned, independently written, template-generated, reconstructed-substitute, or capacity-filling questions. The system must never create question content itself.

Every new or scoring-relevant changed student-visible item requires a real question source, a paired answer or markscheme source, exact exam location, both source-file fingerprints, verified transcription status, and approved student-use rights in `public/data/question_source_registry.json`.

The current 150 Math AA generated items are blocked and excluded from the historical allowance. Math AA SL/HL return to inactive candidate status until real-source questions are admitted. Older non-IB content is locked at its current assessed-content fingerprints while it is audited; it cannot be expanded or rewritten without passing the new source rule.

## 2026-07-29: IB Math AA Direct-Delivery Standard And Stop Rule

`docs/IB_MATH_AA_DELIVERY_STANDARD.md` is the executable acceptance standard for the Math AA goal. It follows the mature AP delivery lifecycle and adds exact IB Paper structure, paired markschemes, constructed-response submission, per-mark scoring, knowledge-point diagnosis, persistent Mock records and the learning center.

The official IB sample-exam page was rechecked in the browser on 2026-07-29. It identifies the files as actual past/specimen papers and states that they are provided for information only. Therefore authenticity is confirmed, but copying full question content into the student bank is not automatically approved. Exact student-facing reproduction remains blocked until the user confirms an authorized basis or explicitly chooses a reference-mode workflow that opens the official source without copying it into the bank.

When source use, paid infrastructure, deployment authority or materially different delivery interpretations are unresolved, implementation stops and asks the user. No item-count target permits an inferred decision.

## 2026-07-29: Real-Source Intake Is Metadata, Not Publication

The 49 canonical Math AA paper/markscheme pairs and their 433 detected question locators form the internal intake foundation. A locator proves that an exact real question and paired scoring source exist; it does not prove that the question has been faithfully transcribed, classified, approved for student use or connected to scoring.

Release counts must include only items that pass visual transcription, asset preservation, subpart/mark-point extraction, knowledge classification and the source-use gate. Internal locators must never be reported as student-bank completion.

## 2026-07-29: Math AA Complete Placement Authorization Confirmed

The user confirmed that LynkEdu has an organization-level basis to place the complete local IB Mathematics AA papers and paired markschemes in the student system. Machine records use `licensed_permission`, `approved_for_structured_student_use`, and `user_confirmed_organization_authorization`; they do not invent a contract number, supplier term, or any permission detail beyond the user's confirmation.

This removes the source-use decision blocker only. Each question must still pass exact source registration, visual transcription, formula/figure preservation, full subpart and mark-point extraction, knowledge-point classification, and release validation before it becomes student-visible. The 150 generated items remain permanently blocked and cannot be restored.

## 2026-07-29: Math AA First-Release Knowledge Points Are The 83 Official Syllabus Items

The earlier 101-leaf tree is retired because some child identifiers came from the invalid generated-item classifier and did not match the official syllabus numbering. In particular, differential equations were incorrectly placed under `AA-5.11`; the guide places definite integrals at SL 5.11 and first-order differential equations at AHL 5.18.

For the first release, the only approved student practice knowledge-point IDs are the 83 official syllabus-item IDs `AA-1.1` through `AA-5.19` in their actual SL/HL scope. SL exposes 51 and HL exposes all 83. T1-T5 remain internal grouping labels and are not student practice choices.

Any future child skill below an official syllabus item requires a separate guide-grounded specification, its own stable identifier and explicit review. A generated question, keyword rule or historical classifier may not define or approve that child skill.

The former automatic Math AA classification writer is permanently disabled. Formal classification requires a manual ledger row keyed by `(subject_id, question_id)`, the rendered question and paired markscheme, all scored subparts, official knowledge-point codes and a current review-basis hash.

## 2026-07-31: Mock Structure Must Not Be Confused With Course Release

The Math AA Mock contract records two independent facts: whether reviewed real questions can form every required Paper structure, and whether those questions are currently released to students. A closed course cannot be described as lacking long questions or continuous Paper 3 investigations.

For P1/P2, the contract verifies the ordered official per-question mark pattern in each section, not merely a matching total. For HL P3, it verifies the required 30-mark and 25-mark continuous-investigation pattern. The Mock generator may only select released items, but the structural audit remains valid while the course is safely closed.

## 2026-07-31: Mock Status Is a Three-State Contract

`paper_practice_only` means the approved real-question inventory cannot yet reproduce every required Paper structure. `ready_pending_course_release` means that structural check has passed, but student release remains closed for other delivery checks. `ready` means the released inventory and public-course state both permit one-per-day Mock creation.

The build-time contract must reject any mismatch between those statuses and the reviewed inventory. The item installation and Math AA audit must reject a total-mark mismatch or any mismatch between a subpart and its scoring-point values before a Mock may rely on that item.
# 2026-07-31: Structured Delivery Is the Universal Release Standard

Student usefulness at the highest deliverable standard is the overriding priority for every curriculum and assessment format. Counts, prior review labels, source screenshots, passing metadata checks and a successful build cannot override missing student-readable content.

Every student-visible question must be a source-checked structured record containing the full assessed text, all options or labelled parts, required formulas/tables/figures, verified answer, and complete official scoring content. Original PDFs and images are evidence or necessary visual attachments only; they cannot stand in for question text, answers or markschemes. An answer summary, marks list or abbreviated marking description is not a markscheme.

The original 414 IB Mathematics AA records are source-located preparation material and count as zero delivered questions until structured. One non-visible sample, `ib-math-aa-sl::P2-000046`, now passes the complete structured source-checking contract; every other record remains closed to students until it has a full source-checked structured transcription marked `structured_reviewed`.

Only `scripts/install_ib_math_aa_structured_batch.cjs` may promote a Math AA record to `structured_reviewed`. Legacy per-item writer scripts are retired and fail by design. Candidate extraction, page crops, source review and preliminary classification never change completion counts.

Mock Paper structure uses the same threshold: only `structured_reviewed` real questions can establish a required Paper role or be generated for a student. Image-first records cannot establish Mock readiness. Until enough structured questions are present, both SL and HL remain `paper_practice_only`.

The original manual-review ledger is source-location evidence, not an approval ledger. Its only valid non-duplicate outcome is `source_located`. The former `approved` value is retired, and the legacy installer must reject source-located records rather than rebuilding them into the student bank.

No self-written, generated, reconstructed, shortened, paraphrased, screenshot-only or summary-only item may enter any student question bank. If the required delivery form, ordering or acceptance standard is uncertain, work must ask the user before making a choice.

## 2026-08-01: Whole-Paper Batch Process Is the Only Scaling Method

The normal way to expand a real-source bank is a complete-paper batch process, not one-off content-writing scripts. A program may locate and pair official files, detect question/page boundaries, prepare candidate reading aids, create empty review batches, calculate hashes and run consistency checks. It may not write or approve visible question text, answers, markschemes, scoring points or classifications.

Human review fills those fields only after checking every relevant official question and markscheme page. The controlled installer is the only writer that can make an item `structured_reviewed`, and it must first be run in no-write check mode. Every batch has a ledger with input hashes, reviewer, item state, reasons, results and counts. Any process change must pass regression checks on already accepted representative questions before use on new work.

Temporary per-question construction scripts are retired as a normal workflow. Existing files may remain as historical evidence but may not be copied forward as the operating method. The governing operational detail is `docs/GLOBAL_QUESTION_BANK_SOP.md#whole-paper-real-source-build-sop`.

# 2026-07-13 - CSA Expansion Source Policy (Retired 2026-07-29)

- This section is retained only as historical context and is fully superseded by `2026-07-29: Real-Source Questions Only`.
- CSA expansion may use only admitted real-source material with paired answers and complete source records.
- CSAwesome / Runestone content is acceptable as open-curriculum practice only with GFDL 1.3 metadata retained; it is not official released exam content.
- CSA item classification must use required learning sequence. Method names such as `mystery` are not sufficient evidence for recursion.
- Structure-risk scanning should distinguish true record/table prompts from abstract terms such as “database containing sorted integers.”
