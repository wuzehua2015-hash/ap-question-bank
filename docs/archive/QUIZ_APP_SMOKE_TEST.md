---
name: quiz-app-smoke-test
description: |
  Automated smoke test pipeline for quiz application frontend.
  Validates: (1) quiz generation filters correctly, (2) mock exam composition is correct,
  (3) images load correctly, (4) table options render correctly.
  Runs automatically after any application-side change (code, data, or build).
  Designed for multi-subject reuse (AP, IB, A-Level, custom).
  REQUIRED after every commit that modifies src/, public/data/, or public/images/.
triggers:
  - "测试应用"
  - "test quiz app"
  - "smoke test"
  - "测试抽题"
  - "检查应用"
  - "app test"
  - "验证应用"
  - "自测"
  - "自动测试"
  - "quiz测试"
  - "mock exam测试"
  - "测试题目"
  - "测试图片"
---

# Quiz App Smoke Test Skill

## Purpose

Catch application-level bugs (like quiz generation filtering wrong units, images not loading, or table options not rendering) **before** users see them. This is a **defensive layer** that runs after the question-bank audit is done, because the audit catches data issues, while this skill catches frontend logic issues.

**When to use:**
- After modifying `src/utils/questionBank.js` or any quiz generation logic
- After modifying `src/components/QuestionCard.jsx` or any rendering logic
- After modifying `public/data/` or `public/images/` (even if audited separately)
- After any build tool change (vite config, base URL, etc.)
- Before declaring a deployment ready for production
- After user reports a bug and you apply a fix (verify the fix actually worked)

**Full pipeline:**
```
question-bank-builder → question-bank-audit → quiz-app-smoke-test → Production
```

## Architecture

This skill tests the application in two ways:

1. **Static Logic Tests** (Node.js): Test the pure functions (`generateQuiz`, `generateMockExam`) without running the browser
2. **Browser Integration Tests** (Headless + Screenshot): Test actual rendering, image loading, and user interactions

### Test Types

| Test Type | What It Tests | When To Run | Failure = App Bug or Data Bug? |
|-----------|--------------|-------------|-------------------------------|
| **Unit Filter Test** | `generateQuiz('U2')` only returns U2 questions | Every code change | **App bug** (filter logic wrong) |
| **Mock Exam Composition** | Mock exam has exactly 10 questions per unit | Every code change | **App bug** (composition logic wrong) |
| **Image Load Test** | `image_paths` resolve to valid URLs | Every build change | **Could be either** (app base URL or missing image file) |
| **Table Option Render** | Table option questions render correctly | Every rendering change | **App bug** (component logic wrong) |
| **Quiz Completeness** | Generated quiz has exactly the requested count | Every code change | **App bug** (count logic wrong) |
| **Cross-Unit Leak** | No unit's quiz contains other-unit questions | Every data change | **Data bug** (misclassification) or **App bug** (filter wrong) |

## Critical: Distinguishing App Bugs from Data Bugs

When a test fails, the skill must determine whether it's the **application's fault** or the **question bank's fault**:

| Symptom | Likely Cause | How to Verify |
|---------|-------------|---------------|
| Quiz contains U4 questions when U2 was selected | **App bug**: `generateQuiz` filter wrong | Check `questionBank.js` filter logic |
| Quiz contains U4 questions, but U4 tags show correctly on cards | **App bug**: Filter is too broad | Check if filter includes `secondary_units` |
| Image shows broken icon, but file exists on disk | **App bug**: `BASE_URL` or path resolution wrong | Check `vite.config.js` base + `QuestionCard.jsx` image src |
| Image shows broken icon, file doesn't exist on disk | **Data bug**: Missing image file | Check `public/images/` directory |
| Table options show as plain text instead of table | **App bug**: `option_table_data` not being checked | Check `QuestionCard.jsx` rendering logic |
| Option text contains "GoodX GoodY" | **Data bug**: OCR pollution | Check `question-bank-audit` for table leak |
| All options show the same content | **App bug**: Component rendering loop wrong | Check `QuestionCard.jsx` map over options |
| Quiz has fewer questions than requested | **App bug**: Count logic or pool logic wrong | Check `generateQuiz` count vs pool length handling |
| Mock exam has 12 U2 questions and 8 U4 questions | **Data bug**: Unit imbalance | Check `question-bank-audit` distribution |

**Golden rule:** If the data looks correct in the JSON but renders wrong in the app, it's an **app bug**. If the data itself is wrong in the JSON, it's a **data bug**.

## Test 1: Unit Filter Test (Static Logic)

Test that `generateQuiz` with `unit: 'U2'` only returns U2 questions.

```javascript
// test/unit-filter.test.js
import { generateQuiz, UNITS } from '../src/utils/questionBank.js'
import data from '../public/data/macro_question_bank_v4.json'

function testUnitFilter() {
  const failures = []
  
  for (const unit of UNITS) {
    const result = generateQuiz(data, { unit: unit.id, count: 50 })
    
    // Check: every question in the quiz has primary_unit === selected unit
    const wrongUnit = result.quiz.filter(q => q.primary_unit !== unit.id)
    if (wrongUnit.length > 0) {
      failures.push({
        test: `Unit Filter: ${unit.id}`,
        severity: 'CRITICAL',
        type: 'app-bug',
        message: `${wrongUnit.length} questions from other units leaked into ${unit.id} quiz`,
        examples: wrongUnit.slice(0, 3).map(q => q.question_id)
      })
    }
    
    // Check: secondary_units do NOT cause inclusion (they're for info only)
    const wrongSecondary = result.quiz.filter(q => {
      return q.secondary_units?.includes(unit.id) && q.primary_unit !== unit.id
    })
    if (wrongSecondary.length > 0) {
      failures.push({
        test: `Unit Filter: ${unit.id} (secondary leak)`,
        severity: 'CRITICAL',
        type: 'app-bug',
        message: `${wrongSecondary.length} questions with secondary unit ${unit.id} were included`,
        examples: wrongSecondary.slice(0, 3).map(q => q.question_id)
      })
    }
  }
  
  return failures
}
```

**Expected result:** 0 failures for all 6 units.

## Test 2: Mock Exam Composition Test

Test that `generateMockExam` produces exactly the expected composition per official exam weighting.

**CRITICAL:** Mock exam unit distribution MUST match the official exam weighting for the subject. Do NOT use equal distribution (10 per unit). For AP Macroeconomics, the official weighting is:

| Unit | Official Range | Mock Exam Count |
|------|---------------|----------------|
| U1 | 5–10% | 4 |
| U2 | 12–17% | 9 |
| U3 | 17–27% | 13 |
| U4 | 18–23% | 12 |
| U5 | 20–30% | 15 |
| U6 | 10–13% | 7 |
| **Total** | **60 MCQs** | **60** |

```javascript
import { MOCK_EXAM_CONFIG, UNITS } from '../src/utils/questionBank.js'

function testMockExam() {
  const failures = []
  const result = generateMockExam(data, frqData)
  
  // Check: exactly totalMCQ MCQs
  if (result.quiz.length !== MOCK_EXAM_CONFIG.totalMCQ) {
    failures.push({
      test: 'Mock Exam: MCQ count',
      severity: 'CRITICAL',
      type: 'app-bug',
      message: `Expected ${MOCK_EXAM_CONFIG.totalMCQ} MCQs, got ${result.quiz.length}`
    })
  }
  
  // Check: unit distribution matches MOCK_EXAM_CONFIG
  for (const unit of UNITS) {
    const expectedCount = MOCK_EXAM_CONFIG.unitDistribution[unit.id]
    const unitCount = result.quiz.filter(q => q.primary_unit === unit.id).length
    if (unitCount !== expectedCount) {
      failures.push({
        test: `Mock Exam: ${unit.id} count`,
        severity: 'HIGH',
        type: unitCount < expectedCount ? 'data-bug' : 'app-bug',
        message: `Expected ${expectedCount} ${unit.id} questions, got ${unitCount}`,
        reason: unitCount < expectedCount 
          ? `Not enough questions in unit ${unit.id}. Database has ${data.filter(q => q.primary_unit === unit.id).length}, need ${expectedCount}.` 
          : 'Too many questions selected from this unit (selection logic error)'
      })
    }
  }
  
  // Check: config sum validation
  const configTotal = Object.values(MOCK_EXAM_CONFIG.unitDistribution).reduce((a, b) => a + b, 0)
  if (configTotal !== MOCK_EXAM_CONFIG.totalMCQ) {
    failures.push({
      test: 'Mock Exam: config validation',
      severity: 'CRITICAL',
      type: 'app-bug',
      message: `MOCK_EXAM_CONFIG unit counts sum to ${configTotal}, expected ${MOCK_EXAM_CONFIG.totalMCQ}`,
      reason: 'Unit distribution config is misconfigured. Check questionBank.js.'
    })
  }
  
  // Check: no duplicate questions
  const ids = result.quiz.map(q => q.question_id)
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (duplicates.length > 0) {
    failures.push({
      test: 'Mock Exam: duplicates',
      severity: 'CRITICAL',
      type: 'app-bug',
      message: `${duplicates.length} duplicate questions found`,
      examples: duplicates.slice(0, 5)
    })
  }
  
  // Check: all units represented (no empty units)
  for (const unit of UNITS) {
    const unitCount = result.quiz.filter(q => q.primary_unit === unit.id).length
    if (unitCount === 0) {
      failures.push({
        test: `Mock Exam: ${unit.id} missing`,
        severity: 'CRITICAL',
        type: 'data-bug',
        message: `Unit ${unit.id} has 0 questions in mock exam. Database has insufficient data.`,
      })
    }
  }
  
  return failures
}
```

## Test 3: Quiz Count & Completeness Test

```javascript
function testQuizCount() {
  const failures = []
  
  // Test: requesting 10 questions should return 10 (if enough available)
  for (const unit of UNITS) {
    const unitCount = data.filter(q => q.primary_unit === unit.id).length
    if (unitCount >= 10) {
      const result = generateQuiz(data, { unit: unit.id, count: 10 })
      if (result.actualCount !== 10) {
        failures.push({
          test: `Quiz Count: ${unit.id} (10 requested)`,
          severity: 'HIGH',
          type: 'app-bug',
          message: `Requested 10, got ${result.actualCount}. Pool had ${unitCount} available.`
        })
      }
    }
  }
  
  // Test: requesting more than available should return all available
  const smallUnit = UNITS.find(u => data.filter(q => q.primary_unit === u.id).length < 5)
  if (smallUnit) {
    const available = data.filter(q => q.primary_unit === smallUnit.id).length
    const result = generateQuiz(data, { unit: smallUnit.id, count: 50 })
    if (result.actualCount !== available) {
      failures.push({
        test: `Quiz Count: ${smallUnit.id} (all available)`,
        severity: 'MEDIUM',
        type: 'app-bug',
        message: `Requested 50, available ${available}, got ${result.actualCount}`
      })
    }
  }
  
  return failures
}
```

## Test 4: Image Path Resolution Test

Test that image URLs are correctly formed and files exist.

```javascript
function testImagePaths() {
  const failures = []
  const BASE_URL = '/ap-question-bank/' // From vite.config.js
  
  // Check: every image path in the database resolves correctly
  for (const q of data) {
    for (const path of q.image_paths || []) {
      // Test both resolution paths (BASE_URL + path, and direct path)
      const withBase = path.startsWith('/') ? BASE_URL + path.slice(1) : BASE_URL + path
      const withoutBase = path.startsWith('/') ? path : '/' + path
      
      // Check if file exists on disk
      const relPath = path.startsWith('/') ? path.slice(1) : path
      const fullPath = `public/${relPath}`
      
      if (!fs.existsSync(fullPath)) {
        failures.push({
          test: `Image Path: ${q.question_id}`,
          severity: 'CRITICAL',
          type: 'data-bug',
          message: `Image file missing: ${path}`
        })
      }
      
      // Check: has_graph consistency
      if (q.image_paths.length > 0 && !q.has_graph) {
        failures.push({
          test: `Image Consistency: ${q.question_id}`,
          severity: 'MEDIUM',
          type: 'data-bug',
          message: `has_graph=false but image_paths has ${q.image_paths.length} entries`
        })
      }
      if (q.image_paths.length === 0 && q.has_graph) {
        failures.push({
          test: `Image Consistency: ${q.question_id}`,
          severity: 'MEDIUM',
          type: 'data-bug',
          message: `has_graph=true but image_paths is empty`
        })
      }
    }
  }
  
  return failures
}
```

## Test 5: Table Option Rendering Test

Test that table option questions have the required data structure.

```javascript
function testTableOptions() {
  const failures = []
  
  const tableQuestions = data.filter(q => q.option_table_data)
  
  for (const q of tableQuestions) {
    // Check: headers exist and are non-empty
    if (!q.option_table_data.headers || q.option_table_data.headers.length === 0) {
      failures.push({
        test: `Table Option: ${q.question_id}`,
        severity: 'HIGH',
        type: 'data-bug',
        message: 'option_table_data.headers is missing or empty'
      })
    }
    
    // Check: rows exist for all options A-E
    for (const key of ['A', 'B', 'C', 'D', 'E']) {
      if (!q.option_table_data.rows || !q.option_table_data.rows[key]) {
        failures.push({
          test: `Table Option: ${q.question_id} row ${key}`,
          severity: 'HIGH',
          type: 'data-bug',
          message: `Missing row data for option ${key}`
        })
      }
    }
    
    // Check: options text has / separator (fallback for non-table rendering)
    for (const key of ['A', 'B', 'C', 'D', 'E']) {
      const optText = q.options[key]
      if (!optText || !optText.includes('/')) {
        failures.push({
          test: `Table Option: ${q.question_id} option ${key}`,
          severity: 'MEDIUM',
          type: 'data-bug',
          message: `Option text missing / separator: "${optText}"`
        })
      }
    }
  }
  
  return failures
}
```

## Test 6: Cross-Unit Leak Detection (The "U2 Bug" Regression Test)

This is the specific regression test for the bug that was fixed.

```javascript
function testCrossUnitLeak() {
  const failures = []
  
  // For each unit, generate a quiz and check that NO other-primary-unit questions appear
  for (const unit of UNITS) {
    // Generate 5 quizzes to account for randomness
    for (let i = 0; i < 5; i++) {
      const result = generateQuiz(data, { unit: unit.id, count: 20 })
      
      const otherUnitQuestions = result.quiz.filter(q => q.primary_unit !== unit.id)
      if (otherUnitQuestions.length > 0) {
        failures.push({
          test: `Cross-Unit Leak: ${unit.id} (run ${i+1})`,
          severity: 'CRITICAL',
          type: 'app-bug',
          message: `${otherUnitQuestions.length} questions from other units in ${unit.id} quiz`,
          examples: otherUnitQuestions.slice(0, 3).map(q => ({
            id: q.question_id,
            actualUnit: q.primary_unit,
            expectedUnit: unit.id
          }))
        })
        break // One failure is enough to flag the bug
      }
    }
  }
  
  return failures
}
```

## Test 7: Browser Integration Test (Headless)

For tests that require actual rendering, use a headless browser:

```javascript
// Using Playwright or Puppeteer
async function testBrowserRendering() {
  const failures = []
  
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  // Navigate to the deployed app (or local preview)
  await page.goto('https://ap-macroecon-question-bank.vercel.app/')
  
  // Test: Generate a U2 quiz and verify all visible cards show U2
  await page.click('text=Quiz') // Navigate to quiz setup
  await page.selectOption('select[name="unit"]', 'U2')
  await page.click('button:has-text("Start")')
  
  // Wait for question cards to appear
  await page.waitForSelector('.question-card')
  
  const unitTags = await page.$$eval('.question-card .unit-tag', tags => 
    tags.map(t => t.textContent)
  )
  
  const nonU2 = unitTags.filter(tag => tag !== 'U2')
  if (nonU2.length > 0) {
    failures.push({
      test: 'Browser: U2 Quiz Rendering',
      severity: 'CRITICAL',
      type: 'app-bug',
      message: `Browser rendered ${nonU2.length} non-U2 questions in U2 quiz`,
      examples: nonU2.slice(0, 3)
    })
  }
  
  // Test: Image loading
  const imageQuestions = data.filter(q => q.image_paths.length > 0).slice(0, 3)
  for (const q of imageQuestions) {
    // Navigate to this question
    // ... (implementation depends on app navigation)
    
    const images = await page.$$('img')
    const brokenImages = []
    for (const img of images) {
      const isVisible = await img.isVisible()
      const src = await img.getAttribute('src')
      if (!isVisible || !src) {
        brokenImages.push(src)
      }
    }
    
    if (brokenImages.length > 0) {
      failures.push({
        test: `Browser: Image Loading ${q.question_id}`,
        severity: 'HIGH',
        type: 'app-bug', // or data-bug depending on investigation
        message: `${brokenImages.length} images not loading`,
        paths: brokenImages
      })
    }
  }
  
  await browser.close()
  return failures
}
```

## Test Report Format

```markdown
# Smoke Test Report

Generated: [Date]
App Version: [Git commit hash]

## Summary
- Total tests: N
- Passed: N
- Failed: N
- App bugs: N
- Data bugs: N

## Critical Failures (Must Fix Before Deploy)
| Test | Type | Severity | Message | Root Cause |
|---|---|---|---|---|

## High Severity (Should Fix Before Deploy)
| Test | Type | Severity | Message | Root Cause |
|---|---|---|---|---|

## Medium/Low (Can Fix After Deploy)
| Test | Type | Severity | Message | Root Cause |
|---|---|---|---|---|

## App Bug Diagnosis
[For each app bug: explain the code path that caused the failure and how to fix it]

## Data Bug Diagnosis
[For each data bug: explain the data issue and which question-bank-audit check should catch it]

## Action Items
- [ ] Fix app bugs
- [ ] Fix data bugs (or re-run question-bank-audit)
- [ ] Re-run smoke test
- [ ] Deploy when all critical/high pass
```

## Execution Pipeline

```
After any code change:
  ┌─────────────────────────────────┐
  │ 1. Run static logic tests       │
  │    (Node.js, no browser needed) │
  │    - Unit filter test           │
  │    - Mock exam composition      │
  │    - Quiz count                 │
  │    - Image path resolution      │
  │    - Table option data          │
  │    - Cross-unit leak            │
  └─────────────────────────────────┘
                │
                ▼
  ┌─────────────────────────────────┐
  │ 2. If static tests pass:        │
  │    Run build                    │
  │    (vite build)                 │
  └─────────────────────────────────┘
                │
                ▼
  ┌─────────────────────────────────┐
  │ 3. If build succeeds:           │
  │    Run browser tests (optional) │
  │    - Image rendering            │
  │    - Table option rendering     │
  │    - Navigation flow            │
  └─────────────────────────────────┘
                │
                ▼
  ┌─────────────────────────────────┐
  │ 4. Generate report              │
  │    - Distinguish app vs data    │
  │    - Prioritize fixes           │
  └─────────────────────────────────┘
                │
                ▼
  ┌─────────────────────────────────┐
  │ 5. If all critical pass:        │
  │    Commit, push, deploy         │
  │    Else: Fix and re-run         │
  └─────────────────────────────────┘
```

## Integration with Git

**Recommended:** Add a pre-commit hook or CI step that runs the static tests.

```bash
#!/bin/bash
# .husky/pre-commit or CI script

echo "Running smoke tests..."
node scripts/smoke-test.js

if [ $? -ne 0 ]; then
  echo "Smoke tests failed! Fix before committing."
  exit 1
fi
```

## Multi-Subject Reuse

To use this skill for a different subject:

### 1. Update `UNITS` array

```javascript
export const UNITS = [
  { id: 'U1', name: 'Measurements and Uncertainties' },
  { id: 'U2', name: 'Mechanics' },
  // ... etc for IB Physics SL
]
```

### 2. Update `MOCK_EXAM_CONFIG`

**CRITICAL: Must match the official exam format for the subject.**

For AP subjects: Look up the official College Board Course and Exam Description (CED) for the unit weighting table. Do NOT guess or use equal distribution.

```javascript
export const MOCK_EXAM_CONFIG = {
  totalMCQ: 60,  // or whatever the official exam has
  frqCount: 3,   // or whatever the official exam has
  unitDistribution: {
    // Look up official exam weighting per unit
    // Example: IB Physics SL might have different counts
    U1: 4,
    U2: 9,
    U3: 13,
    U4: 12,
    U5: 15,
    U6: 7,
  },
}
```

**Where to find official weighting:**
- **AP**: College Board Course and Exam Description (CED) → Exam Information → Unit Weighting
- **IB**: IB Subject Guide → Assessment → Paper structure
- **A-Level**: Exam board specification → Assessment → Component weighting
- **Custom**: Define your own weighting based on curriculum importance

### 3. Update data import path

```javascript
import data from '../public/data/[subject]_question_bank.json'
```

### 4. The test logic is generic

After updating `UNITS` and `MOCK_EXAM_CONFIG`, the test functions automatically adapt. No changes needed to test logic itself.

## Success Criteria

- [ ] All static logic tests pass (0 failures)
- [ ] All critical browser tests pass (0 failures)
- [ ] Report generated with clear app vs data bug distinction
- [ ] Any app bug has a code pointer (file + function) for quick fix
- [ ] Any data bug references the relevant question-bank-audit check
- [ ] Zero cross-unit leaks in any unit's quiz
- [ ] Mock exam has exactly the expected composition
- [ ] All images referenced in the database exist on disk
