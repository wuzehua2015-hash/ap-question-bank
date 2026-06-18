---
name: question-bank-audit
description: |
  Comprehensive audit pipeline for any subject's question bank JSON files.
  Validates: (1) text pollution, (2) unit classification accuracy, (3) image integrity.
  Designed for multi-subject, multi-curriculum reuse (AP, IB, A-Level, custom).
  REQUIRED for every new subject import or question bank update before deployment.
triggers:
  - "审查题库"
  - "audit question bank"
  - "检查题目质量"
  - "题库质量审查"
  - "question bank quality check"
  - "检查污染"
  - "检查分类"
  - "检查图表"
  - "新科目导入"
  - "添加新题目"
  - "题库更新"
---

# Question Bank Audit Skill

## Purpose

Ensure every question in a JSON question bank is clean, correctly classified, and has valid image references. This skill is a **mandatory quality gate** in the delivery pipeline.

**When to use:**
- Importing a new subject's question bank (AP, IB, A-Level, etc.)
- Adding new questions to an existing question bank
- Suspecting pollution or misclassification after OCR or batch processing
- Periodic quality checks (recommended quarterly)

## Input Format

The JSON file follows this schema:
```json
{
  "question_id": "2017_Q26",
  "year": 2017,
  "text": "Clean question text without prefixes or suffixes",
  "options": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." },
  "answer": "B",
  "primary_unit": "U1",
  "secondary_units": ["U3"],
  "image_paths": ["/images/2017/2017_page12_img1.png"],
  "option_table_data": { "headers": [...], "rows": {...} }
}
```

**Unit system is flexible:**
- Any number of units (not limited to 6)
- Any naming convention (U1, U2, Unit 1, Topic A, Chapter 3, etc.)
- Units can be defined per subject in the curriculum spec file

## Curriculum Spec File (Required per Subject)

Before auditing, define the curriculum spec file:

```json
{
  "subject": "AP Macroeconomics",
  "units": [
    { "code": "U1", "name": "Basic Economic Concepts", "topics": ["scarcity", "opportunity cost", "comparative advantage", "PPF"] },
    { "code": "U2", "name": "Economic Indicators and the Business Cycle", "topics": ["GDP", "unemployment", "inflation", "CPI"] },
    { "code": "U3", "name": "National Income and Price Determination", "topics": ["AD-AS", "fiscal policy", "multiplier", "Phillips curve short-run"] },
    { "code": "U4", "name": "Financial Sector", "topics": ["money", "banking", "monetary policy", "interest rates", "loanable funds"] },
    { "code": "U5", "name": "Long-Run Consequences", "topics": ["economic growth", "production function", "long-run Phillips", "human capital"] },
    { "code": "U6", "name": "Open Economy", "topics": ["exchange rates", "balance of payments", "trade", "capital flows"] }
  ]
}
```

**For non-AP subjects:** Adjust the units array. For example, IB Physics SL might have:
- U1: Measurements and Uncertainties
- U2: Mechanics
- U3: Thermal Physics
- U4: Waves
- U5: Electricity and Magnetism
- U6: Circular Motion and Gravitation
- U7: Atomic, Nuclear and Particle Physics
- U8: Energy Production

## Audit Dimensions

### 1. Text Pollution Detection & Auto-Fix (Rule-based)

**Step 1: Scan for known pollution patterns**

**Question text pollution patterns:**
- Leading number prefix: `^\d+\.\s+` (e.g., "26. Suppose...")
- Section headers: `MACROECONOMICS\s+Section\s+I`, `Time[—-]70\s+minutes`
- Copyright text: `Unauthorized copying`
- Page footers: `GO ON TO THE NEXT PAGE`
- Item scored text: `Item\s+\d+\s+was\s+not\s+scored`
- Trailing artifacts: `\s\.+\s*$` (multiple dots), `\s+\.\s+\.$` (dot artifacts)
- Next question table leak: `GoodX|GoodY|Price\s+\d+|Quantity\s+\d+|SRAS1|SRAS2|AD1|AD2|Year\s+\d+\s+\$\d+`
- Embedded question numbers: `\n\d+\.\s+` inside text (multi-line contamination)

**Option pollution patterns:**
- Same patterns as above
- Mixed options: one option contains text from another option or next question
- Table data mixed into plain text options (when `option_table_data` does NOT exist)
- Missing `$` signs (e.g., "100 million" instead of "$100 million")
- Trailing dots ` . .` or `...` artifacts
- `\s+\.\s+\.$` at the end of any option

**Step 2: Auto-fix safe issues (no human confirmation needed)**

| Issue | Auto-fix Rule | Example |
|-------|--------------|---------|
| Leading number prefix in text | `q.text = q.text.replace(/^\d+\.\s+/, '')` | `"26. Suppose..."` → `"Suppose..."` |
| Leading number prefix in option | `q.options[key] = val.replace(/^\d+\.\s+/, '')` | `"26. The..."` → `"The..."` |
| Trailing dots in text | `q.text = q.text.replace(/\s+\.\s+\.$/, '.')` | `"end. . ."` → `"end."` |
| Trailing dots in option | `q.options[key] = val.replace(/\s+\.\s+\.$/, '.')` | `"end. . ."` → `"end."` |

**Step 3: Flag non-auto-fixable issues for LLM review**

Flag for manual review (DO NOT auto-fix):
- Options containing table data from another question (mixed content)
- Options containing "Item X was not scored"
- Options containing next question's option labels (e.g., SRAS/AD mixed in)
- Options with `$` signs missing (e.g., "100 million" → may need context to determine if it should be "$100 million")
- Text or options with unusual length (>150 chars for non-table options)
- Text containing multiple question numbers (e.g., "Question 1 text. Question 2 text")

### 2. Unit Classification Verification & Auto-Fix (LLM-based)

**Why LLM, not keywords:**
- Keywords overlap across units (GDP, inflation, unemployment appear in U2, U3, U5)
- LLM can understand context: "Phillips curve in the short run" = U3, "Phillips curve in the long run" = U5
- LLM can be reused across subjects with different unit definitions
- Keywords are for pre-filtering, LLM is for authoritative classification

**Step 1: Rule-based pre-filtering (flag candidates for LLM review)**

For each question, check if its current `primary_unit` matches the topics it actually discusses:
- If text contains ≥2 topics strongly associated with a DIFFERENT unit → flag for LLM review
- If the question has keywords from a unit it is NOT assigned to → flag
- Example: A question marked U2 but discussing "central bank", "money supply", "monetary policy" → flag for U4 review

**Step 2: LLM batch review (fixes are applied automatically after review)**

LLM Prompt Template (per batch of 10 questions):
```
You are an expert in [SUBJECT NAME]. I have a question bank with the following unit definitions:

[CURRICULUM SPEC FILE content]

For each question below, determine:
1. What unit does this question primarily belong to? (Select ONE from the unit codes above)
2. Why? (1-2 sentences explaining the key concept tested)

For each question, output:
{
  "question_id": "...",
  "current_unit": "...",
  "correct_unit": "..." (one of the unit codes, or SAME if current is correct),
  "confidence": "HIGH" or "MEDIUM" or "LOW",
  "reasoning": "..."
}

Questions:
[JSON array of 10 questions]

Rules:
- If the question tests multiple units, choose the unit where the core concept lives
- "Short-run Phillips curve" → U3 (AD-AS), "Long-run Phillips curve" → U5 (growth)
- "Central bank + money supply" → U4 (financial sector), regardless of context
- "Economic growth + human capital" → U5 (growth)
- Be strict: if the classification is wrong, say so even if it was a close call
```

**Step 3: Apply LLM-verified fixes (automatic)**

| LLM Confidence | Action |
|--------------|--------|
| HIGH | Auto-fix: Update primary_unit, add old unit to secondary_units if not already there |
| MEDIUM | Auto-fix with note: Update primary_unit, log as "medium-confidence fix" in report |
| LOW | Flag for manual review: Do NOT auto-fix, add to report as "requires manual review" |

Fix logic:
```javascript
if (confidence === 'HIGH' || confidence === 'MEDIUM') {
  q.primary_unit = correct_unit;
  // If old unit was meaningful, add it to secondary_units
  if (oldUnit !== correct_unit && !secondary_units.includes(oldUnit)) {
    secondary_units.push(oldUnit);
  }
  // Remove duplicate or same-as-primary from secondary_units
  secondary_units = secondary_units.filter(u => u !== correct_unit);
}
```

**Step 4: Re-run rule-based scan after LLM fixes**
- Verify no new cross-unit keyword mismatches were introduced
- Check for any remaining flagged questions

**Batching strategy:**
- Process 10 questions per LLM call to balance cost and context
- Prioritize: flagged questions from rule-based phase > random sample
- For 400+ questions, sample 20% (80 questions) for LLM review
- Full LLM review only for high-stakes deployments or new subject imports

### 3. Image Integrity Verification & Auto-Fix

**Rule-based checks (auto-fix where possible):**

| Check | Severity | Auto-fix? | Action |
|-------|----------|-----------|--------|
| `image_paths` file does not exist | CRITICAL | No | Flag for re-extraction or re-upload |
| `image_paths` file is 0 bytes | CRITICAL | No | Flag for re-extraction |
| `has_graph=true` but `image_paths` empty | HIGH | Yes | Set `has_graph=false` |
| `image_paths` has entries but `has_graph=false` | MEDIUM | Yes | Set `has_graph=true` |
| Table option without `option_table_data` | HIGH | No | Flag for table data extraction |
| `option_table_data` exists but headers don't match options | HIGH | No | Flag for data re-extraction |
| Image file corrupt or unreadable | HIGH | No | Flag for re-extraction |

**Visual LLM check (optional, for critical images):**
- Feed image to LLM vision model
- Ask: "Does this image match the question text?"
- Useful for catching OCR errors, wrong crops, wrong page segments
- Run only for images flagged as suspicious (e.g., wrong aspect ratio, very small file)

### 4. Output: Audit Report & Action Items

Generate an audit report saved as `AUDIT_REPORT.md`:

```markdown
# Question Bank Audit Report — [Subject Name]

Generated: [Date]

## Summary
- Total questions: N
- Pollution issues: N (auto-fixed: N, flagged: N)
- Unit misclassifications: N (auto-fixed: N, flagged: N)
- Image issues: N (auto-fixed: N, flagged: N)
- Requires manual review: N

## Pollution Issues (Auto-fixed)
| question_id | field | type | original → fixed |
|---|---|---|---|

## Pollution Issues (Flagged for Manual Review)
| question_id | field | type | snippet | recommended action |
|---|---|---|---|---|

## Unit Classification Changes (Auto-fixed)
| question_id | old_unit | new_unit | confidence | reasoning |
|---|---|---|---|---|

## Unit Classification (Flagged for Manual Review)
| question_id | current | suggested | confidence | reasoning |
|---|---|---|---|---|

## Image Issues
| question_id | path | issue | severity | action |
|---|---|---|---|---|

## Action Items
- [ ] Review flagged pollution issues
- [ ] Confirm unit classification changes
- [ ] Fix missing/corrupt images
- [ ] Re-run audit after fixes
- [ ] Commit changes to git
- [ ] Deploy to Vercel and verify

## Success Criteria
- [ ] Zero text pollution (auto-fixable issues resolved)
- [ ] Zero unit misclassification with HIGH confidence
- [ ] 100% image file existence and consistency
- [ ] Audit report generated and saved
- [ ] Changes committed to git
- [ ] Deployed and verified in production
```

## Execution Pipeline (Standard Delivery Flow)

```
┌─────────────────────────────────────────┐
│  1. New subject import or update        │
│     (JSON file + curriculum spec file)  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  2. Rule-based pollution scan           │
│     - Auto-fix safe issues              │
│     - Flag non-auto-fixable issues      │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  3. Unit classification pre-filter      │
│     - Flag cross-unit keyword mismatches│
│     - Flag questions with no clear unit │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  4. LLM batch review (10 questions)     │
│     - Verify flagged questions         │
│     - Verify random sample (20%)       │
│     - Auto-fix HIGH/MEDIUM confidence   │
│     - Flag LOW confidence for manual    │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  5. Image integrity check               │
│     - Verify file existence             │
│     - Auto-fix has_graph consistency    │
│     - Flag missing/corrupt images        │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  6. Generate audit report               │
│     - Save to AUDIT_REPORT.md           │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  7. Apply fixes to JSON file            │
│     - Commit to git                     │
│     - Push to GitHub                    │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  8. Deploy and verify                   │
│     - Wait for Vercel build             │
│     - Force refresh test               │
│     - Spot-check 5 questions           │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  9. PASS / FAIL                         │
│     - PASS: Report is clean, deploy     │
│     - FAIL: Re-run from step 2          │
└─────────────────────────────────────────┘
```

## Mandatory Delivery Checklist

Before declaring a question bank ready for production, verify:

- [ ] **Pollution scan**: Zero CRITICAL or HIGH severity issues remaining
- [ ] **Unit classification**: All HIGH confidence fixes applied, LOW confidence flagged for review
- [ ] **Images**: 100% file existence, has_graph consistency verified
- [ ] **Audit report**: Generated and saved as `AUDIT_REPORT.md` in repo
- [ ] **Git commit**: All changes committed with descriptive message
- [ ] **Git push**: Pushed to GitHub, Vercel deployment triggered
- [ ] **Production verification**: Spot-checked 5 questions in deployed app
- [ ] **Skill compliance**: This audit was performed using the question-bank-audit skill

## Success Criteria

- **Zero text pollution**: No leading numbers, no mixed content, no artifacts, no page headers/footers
- **Zero unit misclassification**: As verified by LLM with HIGH confidence (or MEDIUM confidence with documented reasoning)
- **100% image integrity**: Every image file exists, is not corrupt, has_graph flag is correct
- **Audit report generated**: `AUDIT_REPORT.md` exists in the repo root
- **Standardized process**: Every new subject or update follows this pipeline
- **No exceptions**: Even for "urgent" updates, the minimum required steps are: pollution scan + LLM unit spot-check + image verification + commit
