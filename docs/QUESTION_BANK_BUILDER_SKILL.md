---
name: question-bank-builder
description: |
  End-to-end pipeline for building a clean, validated question bank from raw PDFs
  and curriculum specs. Covers: PDF extraction, OCR error prevention, structured data
  generation, unit classification, table/image handling, and pre-audit validation.
  Designed for multi-subject reuse (AP, IB, A-Level, custom).
  REQUIRED output: clean JSON file ready for question-bank-audit.
triggers:
  - "建立题库"
  - "build question bank"
  - "从PDF导入题库"
  - "导入新科目"
  - "新科目题库"
  - "pdf to question bank"
  - "整理真题"
  - "题库生成"
  - "OCR导入题库"
---

# Question Bank Builder Skill

## Purpose

Build a clean, validated question bank from raw exam PDFs and curriculum specs. This skill is the **upstream companion** to `question-bank-audit`. Together they form the full pipeline:

```
Raw PDFs + Curriculum Spec → question-bank-builder → Clean JSON → question-bank-audit → Production
```

**When to use:**
- Importing a new subject's exam PDFs (first time)
- Adding a new year's exam PDFs to an existing question bank
- Rebuilding an existing question bank after discovering systematic errors
- Migrating from a different format (Word, Excel, etc.) to JSON

## Prerequisites

Before starting, you need:

1. **Curriculum Spec File** (JSON): Unit definitions for this subject
   ```json
   {
     "subject": "AP Macroeconomics",
     "units": [
       { "code": "U1", "name": "Basic Economic Concepts", "topics": ["scarcity", "opportunity cost", "comparative advantage", "PPF"] },
       { "code": "U2", "name": "Economic Indicators", "topics": ["GDP", "unemployment", "inflation", "CPI"] },
       { "code": "U3", "name": "National Income and Price Determination", "topics": ["AD-AS", "fiscal policy", "multiplier", "short-run Phillips curve"] },
       { "code": "U4", "name": "Financial Sector", "topics": ["money", "banking", "monetary policy", "interest rates", "loanable funds", "money market", "money demand", "money supply", "central bank", "federal reserve", "open market operations", "bonds", "reserve requirements", "discount rate"] },
       { "code": "U5", "name": "Long-Run Consequences of Stabilization Policies", "topics": ["economic growth", "production function", "long-run Phillips curve", "human capital", "crowding out", "stabilization policy", "fiscal and monetary policy combination", "fiscal-monetary mix", "federal reserve action with fiscal policy", "aggregate demand and aggregate supply with monetary policy"] },
       { "code": "U6", "name": "Open Economy", "topics": ["exchange rates", "balance of payments", "trade", "capital flows"] }
     ]
   }
   ```
   - Any number of units is acceptable
   - `topics` array helps with automatic classification
   - `code` can be any string (U1, Unit1, TopicA, etc.)

2. **Raw PDF files**: Official practice exam PDFs, organized by year
   - Naming convention: `2017_practice_exam.pdf`, `2018_practice_exam.pdf`, etc.
   - One PDF per year (or per exam session)
   - PDFs should be the original released exams (not screenshots)

3. **Output directory structure** (to be created):
   ```
   public/
     data/
       [subject]_question_bank.json     # ← final output
     images/
       [year]/
         [year]_Q[id]_table.png         # table images
         [year]_page[N]_img[M].png      # graph/chart images
   ```

## Step 1: PDF Extraction & Text Parsing

### 1.1 Extract text from PDFs

Use a reliable PDF text extraction tool:
- **Python**: `pdfplumber` (best for structured text + table detection)
- **Node.js**: `pdf-parse` or `pdftotext` (poppler-utils)
- **Python + OCR**: `pdf2image` + `pytesseract` (only for scanned/image-based PDFs)

**Recommended tool chain:**
```bash
# Python extraction pipeline
pip install pdfplumber pillow
```

```python
import pdfplumber
import json
import re
import os

pdf_path = "raw_pdfs/2017_practice_exam.pdf"
with pdfplumber.open(pdf_path) as pdf:
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        # Store text with page number for debugging
        print(f"Page {i+1}: {text[:200]}")
```

### 1.2 Parse MCQ structure from extracted text

AP exams typically follow this structure:
```
1. Question text that may span
multiple lines?
(A) Option A
(B) Option B
(C) Option C
(D) Option D
(E) Option E

2. Next question text...
```

**Parsing strategy:**
```python
# Regex pattern for AP MCQ structure
mcq_pattern = re.compile(
    r'(?P<num>\d+)\.\s+(?P<text>.*?)(?=\n\([A-E]\))',
    re.DOTALL
)
option_pattern = re.compile(
    r'\n\((?P<letter>[A-E])\)\s+(?P<text>.*?)(?=\n\([A-E]\)|\n\n\d+\.|\Z)',
    re.DOTALL
)
```

**Critical: Extract in raw form first, then clean in later steps. Do NOT try to clean during extraction.**

### 1.3 Handle multi-line questions and options

Common issue: Questions span multiple lines with line breaks inside the text.

**Strategy:**
- Extract all text from a page
- Replace `\n` with a temporary placeholder (e.g., `¶`) during parsing
- Identify question boundaries by the pattern `\d+\. ` followed by options `(A)`–`(E)`
- After parsing, replace `¶` back with `\n` (or ` `) for the final output

## Step 2: OCR Error Prevention & Known Pitfalls

This is the **most critical step**. Based on the Macroeconomics experience, these are the common errors and their prevention strategies.

### 2.1 Leading Question Numbers (Most Common)

**Problem:** Extracted text includes the question number as part of the text:
```json
{
  "text": "26. Suppose countries Alphania and Betania produce..."
}
```

**Prevention:**
```python
# During parsing: store question number separately
text = re.sub(r'^\d+\.\s+', '', text)
# Store question number in a separate field for debugging
question_number = extracted_num  # 26
```

**Validation:** After extraction, scan ALL `text` fields for `^\d+\.\s+` pattern. If any match, extraction parser is broken.

### 2.2 Table Content Leaking into Options (Critical)

**Problem:** Option E of one question contains the table data of the NEXT question:
```json
{
  "E": "Increasing the minimum wage . GoodX GoodY Price Quantity..."
}
```

**Root Cause:** PDF page boundaries cut through a table. The table header (for the next question) is extracted after the current question's option E.

**Prevention:**
```python
# Strategy 1: Detect table boundaries
# Tables typically have repeated columns with short values
# If an option contains "GoodX", "GoodY", "Price", "Quantity" → it's a table leak

table_keywords = ['GoodX', 'GoodY', 'Price', 'Quantity', 'SRAS1', 'SRAS2', 
                   'AD1', 'AD2', 'Motorcycles', 'Automobiles', 'Total Population']

def is_table_leak(text):
    return any(kw in text for kw in table_keywords)

# During extraction: if option E is >150 chars or contains table keywords,
# truncate it and flag for table image extraction instead.
```

**Strategy 2: Extract table questions as images**
- For any question with a table in the PDF, do NOT extract the table text as part of the options
- Instead, extract the table as a PNG image and store `image_paths`
- Use `option_table_data` for structured table options (see Section 3)

### 2.3 Page Header/Footer Leaking into Questions

**Problem:** Questions contain "MACROECONOMICS Section I", "Time—70 minutes", "GO ON TO THE NEXT PAGE", or copyright text.

**Prevention:**
```python
# Define known header/footer patterns
header_footer_patterns = [
    r'MACROECONOMICS\s+Section\s+I',
    r'Time[—-]70\s+minutes',
    r'GO ON TO THE NEXT PAGE',
    r'Unauthorized copying',
    r'Item\s+\d+\s+was\s+not\s+scored',
    r'\d+\s+\w+\s+\d{4}\s+\d+:\d+\s*(AM|PM)?',  # date/time patterns
]

# After extracting text, remove these patterns
def clean_headers(text):
    for pattern in header_footer_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    return text.strip()
```

### 2.4 Mixed Question Content (Page Boundary Issues)

**Problem:** One question's text contains the beginning of the next question because the page break occurred mid-question.

**Prevention:**
- Parse questions in order, do NOT allow a question's text to start with a number that doesn't match the expected sequence
- If question 26 is followed by question 28 (missing 27), check if 27's content was merged into 26
- If the extracted text contains `\n\d+\.\s` in the middle, split it:
```python
# Detect embedded question numbers in the middle of text
embedded = re.search(r'\n(\d+)\.\s+', text)
if embedded:
    # Split the text at the embedded question number
    text = text[:embedded.start()]
    # The part after embedded.start() belongs to the next question
```

### 2.5 Dollar Signs ($) Stripped or Corrupted

**Problem:** `$` signs are extracted as `\` or missing entirely (e.g., "$100 million" becomes "100 million" or "\100 million").

**Prevention:**
- After extraction, scan for monetary values without `$`:
```python
# If a number is followed by "million", "billion", "thousand", etc. 
# and there is no $ before it, check if it's a known currency question
monetary_pattern = re.compile(r'(?<!\$)\b(\d+)\s+(million|billion|trillion)')
# Flag these for manual review or apply $ if the question is known to be about currency
```
- Also check for the reverse: stray `\` characters that might be corrupted `$` signs

### 2.6 Trailing Artifacts (Dots, Spaces)

**Problem:** Text ends with ` . .` or `...` or extra spaces.

**Prevention:**
```python
# Auto-fix trailing artifacts
def clean_trailing(text):
    text = re.sub(r'\s+\.\s+\.$', '.', text)      # "end . ." → "end."
    text = re.sub(r'\.{3,}$', '.', text)          # "end..." → "end."
    text = re.sub(r'\s+$', '', text)              # remove trailing spaces
    return text
```

### 2.7 Multi-line Text with Unnecessary Line Breaks

**Problem:** PDF line breaks are preserved inside a sentence, creating hard newlines where they don't belong.

**Prevention:**
```python
# Strategy: preserve intentional newlines (paragraph breaks) but remove
# newlines that break a sentence mid-line
# Heuristic: if a line ends with a word and the next line starts with a lowercase letter, 
# it's likely a continuation, not a new paragraph

def fix_line_breaks(text):
    lines = text.split('\n')
    result = []
    for i, line in enumerate(lines):
        if i == 0:
            result.append(line)
            continue
        prev = result[-1]
        # If previous line doesn't end with sentence-ending punctuation, 
        # and current line starts with lowercase (or specific words like "when", "which"), 
        # merge them
        if prev and not re.search(r'[.!?]$', prev.strip()) and line[0].islower():
            result[-1] = prev + ' ' + line.strip()
        else:
            result.append(line)
    return '\n'.join(result)
```

## Step 3: Image & Table Extraction

### 3.1 Extract Graphs and Charts

```python
from pdf2image import convert_from_path
from PIL import Image
import os

pdf_path = "raw_pdfs/2017_practice_exam.pdf"
pages = convert_from_path(pdf_path, dpi=200)

for i, page in enumerate(pages):
    # For each page that contains a question with a graph:
    # 1. Crop the region of the graph (use coordinates or auto-detect)
    # 2. Save as PNG
    
    # Auto-detect: graphs are typically images embedded in the PDF
    # pdfplumber can detect images with page.images
    # But manual cropping is often more reliable for exam PDFs
    
    # Example: save the whole page for manual cropping later
    page.save(f"temp_pages/2017_page{i+1}.png")
```

**Image naming convention:**
```
public/images/[year]/[year]_page[N]_img[M].png
```
- `[year]`: 4-digit year
- `[N]`: page number in the PDF
- `[M]`: image number on that page (1, 2, 3...)

### 3.2 Table Questions: Extract as Images + Structured Data

**Table questions** are questions where the options are structured as a table (e.g., columns for "Government Outlays" and "Tax Revenues").

**CRITICAL: Table options must be split correctly by column.** A common error is splitting multi-word phrases incorrectly. For example:
- ❌ Wrong: `["Increase", "taxes Sell government bonds"]` ("taxes" belongs in first column)
- ✅ Correct: `["Increase taxes", "Sell government bonds"]` ("Increase taxes" is a single fiscal policy action)

**Two approaches (use BOTH):**

**Approach A: Extract table as image**
```python
# Crop the table region from the PDF page
# Save as PNG: public/images/[year]/[year]_Q[id]_table.png
# Add to question's image_paths
```

**Approach B: Extract table as structured data**

```python
# Step 1: Identify the table headers from the PDF
# The question text usually references the table headers,
# and the table itself has column headers above the option rows

# For example, a question about fiscal and monetary policy:
# Text: "Which of the following combinations of fiscal and monetary policy..."
# Table headers: "Fiscal Policy" | "Monetary Policy"
# Row A: "Increase taxes" | "Sell government bonds"
# Row B: "Decrease taxes" | "Buy government bonds"
# Row C: "Decrease taxes" | "Lower margin requirements"
# Row D: "Decrease government spending" | "Lower discount rate"
# Row E: "Increase government spending" | "Raise discount rate"

# Step 2: Build option_table_data
{
  "option_table_data": {
    "headers": ["Fiscal Policy", "Monetary Policy"],
    "rows": {
      "A": ["Increase taxes", "Sell government bonds"],
      "B": ["Decrease taxes", "Buy government bonds"],
      "C": ["Decrease taxes", "Lower margin requirements"],
      "D": ["Decrease government spending", "Lower discount rate"],
      "E": ["Increase government spending", "Raise discount rate"]
    }
  }
}
```

**How to determine correct column splits:**

1. **Read the question text** to understand what each column represents
   - "combinations of fiscal and monetary policy" → Column 1 = Fiscal Policy, Column 2 = Monetary Policy
   
2. **Look at the original PDF table** (not just extracted text) to see the column headers and where the boundaries are

3. **Use natural phrase boundaries**:
   - "Increase taxes" → one column (a complete fiscal policy action)
   - "Decrease government spending" → one column (a complete fiscal policy action)
   - "Sell government bonds" → one column (a complete monetary policy action)
   - "Lower discount rate" → one column (a complete monetary policy action)

4. **Common multi-word phrases that must stay together**:
   - `Increase taxes` / `Decrease taxes` / `No change` / `Not change`
   - `Lower discount rate` / `Raise discount rate` / `Decrease discount rate`
   - `Buy government bonds` / `Sell government bonds`
   - `Lower margin requirements`
   - `Decrease government spending` / `Increase government spending`
   - `Shift to the right` / `Shift to the left` / `No change`
   - `Fall by $X million` / `Rise by $X million`

5. **NEVER split by single word**:
   - ❌ `["Increase", "taxes Sell government bonds"]` ("taxes" belongs to first column)
   - ❌ `["Decrease", "government Lower discount rate spending"]` (all words belong to one column)
   - ❌ `["Shift", "to the left Shift to the left"]` ("Shift to the left" is a single phrase)

**Critical rule:**
- If a question has a table, ALWAYS extract it as an image (for visual rendering)
- ALSO extract it as structured data (for interactive table rendering)
- The `options` field should contain the text version with `/` separator: `"Increase taxes / Sell government bonds"`

### 3.3 Detect Which Questions Need Images

After text extraction, identify questions that reference a graph:

```python
graph_keywords = ['graph above', 'diagram above', 'the figure', 'the table above', 
                   'the curve', 'the line', 'aggregate demand', 'aggregate supply']

def needs_image(question_text):
    return any(kw in question_text.lower() for kw in graph_keywords)
```

Then manually review each flagged question to:
1. Determine which page of the PDF contains the image
2. Crop the image from that page
3. Save with the naming convention
4. Add `image_paths` to the question JSON
5. Set `has_graph = true` and `requires_graph = true`

## Step 4: Unit Classification (Automatic + Manual)

### 4.1 Knowledge-Based Classification (NOT Keyword Matching)

**CRITICAL:** Unit classification is based on **AP Macro CED knowledge ranges**, NOT keyword frequency. The standard is: "Would a student who has ONLY studied this unit be able to answer this question?"

**U1: Basic Economic Concepts**
- Scarcity, opportunity cost, PPF, comparative advantage, specialization, trade
- Does NOT include: aggregate demand, GDP, unemployment, inflation, money, banking

**U2: Economic Indicators**
- GDP (real/nominal), unemployment types, inflation, CPI, business cycle
- Does NOT include: AD-AS, fiscal policy, monetary policy, growth

**U3: National Income and Price Determination**
- AD-AS model (AD, SRAS, LRAS), short-run equilibrium, inflationary/recessionary gaps
- Fiscal policy (government spending, taxes, multiplier, automatic stabilizers)
- Short-run Phillips curve (trade-off between unemployment and inflation)
- Does NOT include: money demand, money supply, monetary policy, central bank, banking, loanable funds, long-run growth, crowding out, LR Phillips curve

**U4: Financial Sector**
- Money, money demand, money supply, money market
- Banking system, reserves, excess reserves, money multiplier
- Monetary policy tools: open market operations, discount rate, reserve requirements
- Central bank / Federal Reserve actions
- Interest rates, bond prices, loanable funds market
- Does NOT include: fiscal policy, AD-AS (unless testing monetary policy effects on AD), long-run growth, crowding out

**U5: Long-Run Consequences of Stabilization Policies**
- Fiscal + monetary policy COMBINATIONS (simultaneous actions, policy mix)
- Long-run economic growth: production function, technology, human capital, physical capital
- Crowding out (government borrowing raises interest rates, reduces private investment)
- Long-run Phillips curve (vertical at natural rate)
- Supply-side economics, rational expectations, sacrifice ratio
- Does NOT include: AD-AS model alone, fiscal policy alone, monetary policy alone

**U6: Open Economy**
- Exchange rates, foreign exchange market, balance of payments
- Net exports, trade deficits/surpluses, tariffs, quotas
- Capital flows, appreciation/depreciation

### 4.2 Classification Rules (Apply in Order)

```python
def classify_question(text, options):
    """
    Classify by CED knowledge range. NOT keyword frequency.
    Standard: Can a student answer this after studying ONLY this unit?
    """
    full = (text + ' ' + ' '.join(options.values())).lower()
    
    # RULE 1: U6 (most specific - foreign trade markers)
    u6_markers = ['exchange rate', 'foreign exchange', 'balance of payments', 
                  'net exports', 'trade deficit', 'trade surplus', 'tariff', 'quota',
                  'appreciation', 'depreciation', 'foreign country', 'canada', 'japan']
    if any(m in full for m in u6_markers):
        return 'U6'
    
    # RULE 2: U5 fiscal+monetary COMBINATION (explicit combo)
    combo_markers = [
        'which of the following combinations of fiscal and monetary',
        'which of the following combinations of policies',
        'fiscal policy and monetary policy',
        'government spending increases and at the same time the central bank',
        'government spending decreases and at the same time the central bank',
        'taxes increase and at the same time the central bank',
        'taxes decrease and at the same time the central bank',
        'government decreases spending while the country\'s central bank',
        'government increases spending while the country\'s central bank'
    ]
    if any(m in full for m in combo_markers):
        return 'U5'
    
    # RULE 3: U5 long-run growth / crowding out / LR Phillips
    u5_growth = ['long-run economic growth', 'production function', 'human capital',
                 'physical capital', 'technological progress', 'technology with',
                 'crowding out', 'crowding-out', 'supply-side policy', 'supply side policy',
                 'long-run phillips', 'long run phillips', 'sacrifice ratio', 
                 'rational expectations', 'adaptive expectations']
    if any(m in full for m in u5_growth):
        return 'U5'
    
    # RULE 4: U4 monetary / banking (pure money/banking concepts)
    # BUT: if a question is about fiscal policy with monetary terms only in options as distractors → U3
    u4_core = ['money demand', 'money supply', 'transaction demand', 'precautionary demand',
               'monetary policy', 'central bank', 'federal reserve', 'fed ', 'fed\'s',
               'open market operation', 'open market purchase', 'open market sale',
               'buy government bonds', 'sell government bonds',
               'discount rate', 'reserve requirement', 'required reserve', 'excess reserves',
               'loanable funds', 'money market', 'banking system', 'bank reserves',
               'bond prices', 'price of bonds', 'velocity of money', 'quantity theory']
    
    # Check if U4 terms are the CORE concept being tested
    u4_count = sum(1 for m in u4_core if m in full)
    u3_fiscal = any(m in full for m in ['fiscal policy', 'government spending', 'taxes', 'aggregate demand', 'aggregate supply'])
    
    if u4_count >= 2 and not u3_fiscal:
        # Pure monetary/banking question
        return 'U4'
    elif u4_count >= 2 and u3_fiscal:
        # Both fiscal and monetary present, but not a combo question → check if testing monetary effects
        if 'interest rate' in full or 'loanable funds' in full or 'bond' in full:
            return 'U4'  # Fiscal policy causes U4 effects (loanable funds, interest rates)
        # Otherwise stays U3 (fiscal is main concept, monetary terms are distractors)
    elif u4_count == 1 and not u3_fiscal:
        # Single strong U4 term, no fiscal context
        return 'U4'
    
    # RULE 5: U3 AD-AS / fiscal policy
    u3_markers = ['aggregate demand', 'aggregate supply', 'short-run aggregate supply', 'sras',
                  'fiscal policy', 'government spending', 'government purchases', 'taxes',
                  'multiplier', 'spending multiplier', 'tax multiplier', 'automatic stabilizer',
                  'short-run phillips', 'short run phillips', 'stagflation', 'cost-push', 'demand-pull',
                  'inflationary gap', 'recessionary gap', 'output gap']
    if any(m in full for m in u3_markers):
        return 'U3'
    
    # RULE 6: U2 indicators
    u2_markers = ['gross domestic product', 'gdp', 'unemployment', 'inflation', 'cpi',
                  'consumer price index', 'business cycle', 'recession', 'deflation',
                  'labor force', 'participation rate', 'natural rate of unemployment']
    if any(m in full for m in u2_markers):
        return 'U2'
    
    # RULE 7: U1 basic concepts
    u1_markers = ['scarcity', 'opportunity cost', 'production possibilities', 'ppf',
                  'comparative advantage', 'absolute advantage', 'specialization']
    if any(m in full for m in u1_markers):
        return 'U1'
    
    return 'UNKNOWN'
```

**Critical principles:**
1. **Keyword frequency is irrelevant.** "taxes" appearing 5 times doesn't make it U3 if the question is about monetary policy.
2. **Teaching sequence matters.** A question about "money demand" is U4 even if it mentions "taxes" in one option. Students don't learn money demand until U4.
3. **Distractors don't change the unit.** If a question tests fiscal policy (U3) but has "central bank" in one wrong option, it's still U3.
4. **U5 combo questions are distinct.** If BOTH fiscal and monetary actions appear in the SAME correct answer or as an explicit combination, it's U5.
5. **When in doubt, classify by the MOST ADVANCED concept tested.** If a question requires understanding both U3 and U4 to answer, it's the higher-numbered unit (U4 or U5).

### 4.3 LLM Verification (Batch Review)

Use the LLM prompt with CED knowledge ranges:

```
You are an AP Macroeconomics curriculum expert. Review these questions and verify their unit classification based on the College Board CED knowledge ranges.

STANDARD: "Would a student who has ONLY studied this unit be able to answer this question?"

Unit knowledge ranges:
U1: Basic concepts (scarcity, PPF, comparative advantage, trade)
U2: Economic indicators (GDP, unemployment, inflation, CPI, business cycle)
U3: AD-AS model, fiscal policy (spending/taxes/multiplier), short-run Phillips curve, inflationary/recessionary gaps
U4: Money, banking, monetary policy (Fed/central bank tools), interest rates, loanable funds, bond prices
U5: Fiscal+monetary policy COMBINATIONS, long-run growth (technology/human capital/production function), crowding out, long-run Phillips curve, supply-side economics
U6: Open economy (exchange rates, BOP, trade, capital flows)

For each question, determine:
1. What is the CORE concept being tested? (Which unit teaches this?)
2. Are there keywords from other units that are just distractors/context?
3. Would a student who hasn't studied U4/U5 be able to answer this?

Output: { question_id, correct_unit, reasoning }
```

**Batch size:** 10 questions per LLM call
**Coverage:** For a 400-question bank, sample 100 questions (25%). If systematic errors found, expand to full review.

**Specific checks for common errors:**
- U3 questions with "money supply" or "central bank" in options: Are these distractors or core concepts?
- U5 questions with only AD-AS: Are these actually U3 with U5 distractors?
- U4 questions with "fiscal policy": Is the question testing monetary effects of fiscal policy (U4) or fiscal policy itself (U3)?

## Step 5: Mock Exam Configuration

Before assembling the final JSON, define the `MOCK_EXAM_CONFIG` for the subject. This is **critical** and must match the official exam format.

### 5.1 Mock Exam Configuration (Must Match Official Exam)

```javascript
// AP Macroeconomics official weighting (from College Board CED)
// Source: https://apcentral.collegeboard.org/courses/ap-macroeconomics/exam
export const MOCK_EXAM_CONFIG = {
  totalMCQ: 60,
  frqCount: 3,
  unitDistribution: {
    // Unit: count (must sum to totalMCQ)
    // Official ranges: U1 5-10%, U2 12-17%, U3 17-27%, U4 18-23%, U5 20-30%, U6 10-13%
    U1: 4,  // 4/60 = 6.7%  (official: 5-10%)
    U2: 9,  // 9/60 = 15%   (official: 12-17%)
    U3: 13, // 13/60 = 21.7% (official: 17-27%)
    U4: 12, // 12/60 = 20%  (official: 18-23%)
    U5: 15, // 15/60 = 25%  (official: 20-30%)
    U6: 7,  // 7/60 = 11.7% (official: 10-13%)
  },
}
```

**For other subjects:** Look up the official exam format and weighting:
- AP: College Board CED → Exam Information → Unit Weighting table
- IB: IB Subject Guide → Assessment → Paper structure
- A-Level: Exam board specification → Assessment → Component weighting
- Custom: Define based on curriculum priorities

**NEVER use equal distribution (10 per unit) unless the official exam explicitly uses equal weighting.**

## Step 6: JSON Assembly & Output

### 6.1 Final JSON Schema

```json
{
  "question_id": "2017_Q26",
  "year": 2017,
  "text": "Clean question text without prefixes or suffixes\nor embedded numbers.",
  "options": {
    "A": "Option A text.",
    "B": "Option B text.",
    "C": "Option C text.",
    "D": "Option D text.",
    "E": "Option E text."
  },
  "answer": "B",
  "primary_unit": "U1",
  "secondary_units": [],
  "topics": ["comparative advantage", "trade"],
  "difficulty": "Easy",
  "has_graph": false,
  "image_paths": [],
  "source": "AP Macro 2017 Official Practice Exam",
  "pure_unit": true,
  "classification_reasoning": "Primary: U1 (score=8.0), Secondary: [], Matched: ['comparative advantage', 'trade']",
  "difficulty_source": "official_stats",
  "difficulty_score": 5,
  "percent_correct": 85,
  "skills": ["evaluate", "identify"],
  "requires_graph": false,
  "option_table_data": null
}
```

### 5.2 Required Fields vs Optional Fields

| Field | Required | Notes |
|-------|----------|-------|
| `question_id` | ✅ | Format: `[year]_Q[number]`, e.g., `2017_Q26` |
| `year` | ✅ | Integer or string |
| `text` | ✅ | Clean text, no leading numbers, no pollution |
| `options` | ✅ | Object with keys A–E (or A–D for some formats) |
| `answer` | ✅ | Single letter matching an option key |
| `primary_unit` | ✅ | Must match a unit code from curriculum spec |
| `secondary_units` | ✅ | Array (can be empty) |
| `topics` | ✅ | Array of matched topic keywords |
| `has_graph` | ✅ | Boolean |
| `image_paths` | ✅ | Array of strings (can be empty) |
| `source` | ✅ | Human-readable source description |
| `pure_unit` | ✅ | Boolean (true if only one unit is involved) |
| `difficulty` | ✅ | "Easy", "Medium", "Hard" (or inferred) |
| `difficulty_source` | ✅ | "official_stats" or "inferred" |
| `difficulty_score` | ✅ | Integer 0–5 (or inferred score) |
| `classification_reasoning` | ✅ | String explaining why this unit was chosen |
| `skills` | ✅ | Array of skill tags (e.g., "identify", "evaluate", "calculate") |
| `requires_graph` | ✅ | Boolean (true if question requires understanding the graph) |
| `percent_correct` | ❌ | If available from official stats |
| `option_table_data` | ❌ | Only for table questions |
| `option_headers` | ❌ | Deprecated, use `option_table_data` |

### 5.3 Output File Structure

```
public/
  data/
    [subject]_question_bank.json      # Main output file
  images/
    2017/
      2017_Q26_table.png              # Table images (if applicable)
      2017_page12_img1.png            # Graph images
      2017_page12_img2.png
    2018/
      ...
```

## Step 6: Pre-Audit Validation (Before Handoff to Audit)

Before running the full `question-bank-audit`, perform a quick self-check.
**This is the last line of defense before errors enter the production question bank.**

```python
def pre_audit_check(data):
    issues = []
    
    # 1. All question_ids are unique
    ids = [q['question_id'] for q in data]
    if len(ids) != len(set(ids)):
        issues.append("Duplicate question_ids found")
    
    # 2. All options have A-E (or A-D for 4-option questions)
    for q in data:
        if not all(k in q['options'] for k in ['A', 'B', 'C', 'D']):
            issues.append(f"{q['question_id']}: Missing options A-D")
        if 'E' not in q['options'] and len(q['options']) == 4:
            pass  # 4-option format is okay
        elif 'E' not in q['options']:
            issues.append(f"{q['question_id']}: Missing option E")
    
    # 3. Answer is in options
    for q in data:
        if q['answer'] not in q['options']:
            issues.append(f"{q['question_id']}: Answer '{q['answer']}' not in options")
    
    # 4. No leading numbers in text
    for q in data:
        if re.search(r'^\d+\.\s+', q['text']):
            issues.append(f"{q['question_id']}: Leading number in text")
    
    # 5. No obvious pollution in text or options
    pollution_patterns = [r'MACROECONOMICS', r'Time[—-]70', r'GO ON TO', r'Unauthorized']
    for q in data:
        for pattern in pollution_patterns:
            if re.search(pattern, q['text']):
                issues.append(f"{q['question_id']}: Pollution in text")
            for opt in q['options'].values():
                if re.search(pattern, opt):
                    issues.append(f"{q['question_id']}: Pollution in options")
    
    # 5.1 NEW: Option artifact check (leading dashes, dots, etc.)
    for q in data:
        for opt, text in q['options'].items():
            if text.startswith('—') or text.startswith('....') or text.startswith('..'):
                issues.append(f"{q['question_id']}: Option {opt} starts with artifact '{text[:20]}...'")
    
    # 5.2 NEW: Word concatenation check
    for q in data:
        for opt, text in q['options'].items():
            if 'arightward' in text or 'Nochange' in text or 'Aincrease' in text.lower():
                issues.append(f"{q['question_id']}: Option {opt} has word concatenation '{text[:30]}...'")
    
    # 5.3 NEW: Graph consistency check (comprehensive)
    for q in data:
        text_lower = q['text'].lower()
        graph_keywords = ['graph above', 'the graph', 'business cycle above', 'diagram above', 'figure above', 'the figure']
        if any(kw in text_lower for kw in graph_keywords):
            if not q.get('has_graph', False):
                issues.append(f"{q['question_id']}: Text mentions graph/diagram/figure/business cycle but has_graph=False")
    
    # 5.4 NEW: Data/table reference check
    for q in data:
        text_lower = q['text'].lower()
        data_keywords = ['table above', 'data above', 'the data', 'the table']
        if any(kw in text_lower for kw in data_keywords):
            if not q.get('has_graph', False) and not q.get('option_table_data'):
                issues.append(f"{q['question_id']}: Text mentions table/data but has_graph=False and no option_table_data")
    
    # 5.5 NEW: has_graph must have image_paths
    for q in data:
        if q.get('has_graph', False) and not q.get('image_paths'):
            issues.append(f"{q['question_id']}: has_graph=True but image_paths is empty")
    
    # 5.6 NEW: Table headers mixed into text check
    for q in data:
        words = q['text'].split()
        if len(words) >= 4 and not q.get('option_table_data'):
            last_4 = words[-4:]
            capitalized = [w for w in last_4 if w and w[0].isupper() and len(w) > 2 and w.isalpha()]
            if len(capitalized) >= 2:
                opt_texts = list(q['options'].values())
                if opt_texts and all(len(opt.split()) == len(capitalized) for opt in opt_texts[:3]):
                    issues.append(f"{q['question_id']}: Text ends with疑似表头 '{ ' '.join(capitalized) }' and options are equal-length phrases, likely missing option_table_data")
    
    # 6. Image files exist
    for q in data:
        for path in q.get('image_paths', []):
            rel = path.lstrip('/')
            if not os.path.exists(f'public/{rel}'):
                issues.append(f"{q['question_id']}: Missing image {path}")
    
    # 7. All years have consistent data
    years = set(q['year'] for q in data)
    for year in years:
        count = len([q for q in data if q['year'] == year])
        print(f"Year {year}: {count} questions")
    
    # 8. Verify all table options have matching option_table_data and text options
    for q in data:
        if q.get('option_table_data'):
            headers = q['option_table_data']['headers']
            for opt, cells in q['option_table_data']['rows'].items():
                text = ' / '.join(cells)
                if text != q['options'][opt]:
                    issues.append(f"Table-text mismatch: {q['id']} option {opt}: '{text}' != '{q['options'][opt]}'")
    
    return issues
```

**Critical Rule:** If `pre_audit_check` returns any issues, **DO NOT proceed** to `question-bank-audit`. Fix all issues first, then re-run until it returns an empty list.

**If pre-audit check passes with 0 issues, run `question-bank-audit` for the final validation.**

## Step 7: Handoff to question-bank-audit

After building the JSON:

1. Run `question-bank-audit` skill on the generated JSON
2. Address all flagged issues
3. Re-run until the audit report shows 0 issues
4. Commit the final JSON + images + audit report to git
5. Deploy to Vercel

## Common Pitfalls & Solutions (Macroeconomics Lessons Learned)

| Pitfall | Symptom | Root Cause | Prevention |
|---------|---------|------------|------------|
| Leading numbers in text | `"26. Suppose..."` | PDF extraction includes question number | Remove `^\d+\.\s+` during parsing |
| Table leak into options | Option E contains `GoodX GoodY Price...` | Page boundary cuts through table | Detect table keywords, truncate option, extract as image |
| **Multi-line table data pollution** | Option contains `5\n2.` or `10\nPrice\nQuantity` | Table header leaks into previous question's option as multi-line text | Detect multi-line options where first line is number and second line is table header; truncate to first line |
| **Question number duplication (Q2/Q52)** | Questions 2 and 52 merged into one | Regex `\d+\s+\d+\.` matches newline-separated table data as split question number | Only match space-separated split numbers with `[ \t]+`, not `\s+` |
| **Missing question (Q47)** | Question 47 skipped entirely | Regex `\d+\s+\d+\.` incorrectly matches table data `5\n2.` as `52.` | Use `[ \t]+` instead of `\s+` in split-number regex |
| Page headers in questions | `"MACROECONOMICS Section I"` in text | Header is extracted as part of text | Remove known header/footer patterns post-extraction |
| Missing dollar signs | `"100 million"` instead of `"$100 million"` | OCR strips `$` or converts to `\` | Post-process: detect monetary values without `$`, add it |
| Graph questions without images | `has_graph=true` but no image file | Forgot to extract graph image | Flag graph questions during extraction, manually crop |
| **Graph-based options empty** | All options A-E are empty | Options are graph coordinates (e.g., Q₁,P₄) not extractable text | Manually reconstruct from graph description or mark as `requires_graph=true` |
| **Graph label misinterpretation** | Option text contains `B=Q₂` or `A=P₁` | Graph labels on axes misread as option text | Filter out axis labels during option extraction; use coordinate-based extraction |
| Wrong unit classification | U2 question about central bank; U3 question about money demand; fiscal+monetary combo in U3 | 1. U4/U5 strong keywords underweighted (e.g., "money demand" only +2, "taxes" +5) 2. U5 combo rule missing: fiscal+monetary policy together should be U5, not U3 or U4 | 1. U4 strong keywords: weight +15 (money demand, money supply, monetary policy, central bank, open market operations, bonds, discount rate, reserve requirements) 2. U5 strong keywords: weight +15 (crowding out, stabilization policy, fiscal-monetary combination, "fiscal and monetary" together) 3. U5 combo rule: if both fiscal AND monetary keywords present → +20, forcing U5 4. U3 signals: weight +8 (aggregate demand, fiscal policy, taxes, government spending) - can be overridden by U4/U5 5. NEVER classify a question as U3 just because it mentions "taxes" or "government spending" if it also contains "money supply", "monetary policy", or "central bank" |
| Trailing dots artifact | `"end . ."` | OCR error | Auto-fix: `replace(/\s+\.\s+\.$/, '.')` |
| **Word broken across lines** | `"invent\nories"` | PDF line break splits word | Detect and merge word fragments: `"invent"+"ories"` → `"inventories"` |
| **Table headers mixed into text** | `"...expansionary?\nGovernment\nSpending\nTaxes"` | OCR extracts table headers as part of question text | Extract trailing header lines, remove from text, create `option_table_data` |
| **Table option split wrong** | Option A: `["Increase", "taxes Sell government bonds"]` ("taxes" belongs to first column) | Multi-word phrases split by incorrect word boundary | Read PDF table carefully; use natural phrase boundaries (e.g., "Increase taxes" is one phrase); verify with table-image cross-check |
| Embedded question numbers | Question 26 contains text from Q27 | Page boundary mid-question | Detect `\n\d+\.\s` in middle of text, split |

## Success Criteria

- [ ] All PDFs extracted and parsed
- [ ] Zero leading numbers in question text
- [ ] Zero table content leaking into options (all tables extracted as images + structured data)
- [ ] Zero page headers/footers in questions
- [ ] **Zero option artifacts** (no leading dashes, dots, or word concatenation like "arightward" or "Nochange")
- [ ] **Zero graph inconsistencies** (text mentions "graph above" → has_graph must be True)
- [ ] All graph questions have corresponding image files
- [ ] All questions have valid `primary_unit` (verified by LLM)
- [ ] **Mock exam config matches official exam weighting** (not equal distribution)
- [ ] **All table options correctly split** (multi-word phrases stay together; e.g., "Increase taxes" is one phrase)
- [ ] **Pre-merge check passes with 0 issues** (pollution, artifacts, graph consistency, word concatenation)
- [ ] Pre-audit check passes with 0 issues
- [ ] `question-bank-audit` passes with 0 issues
- [ ] JSON file committed to git
- [ ] Images committed to git
- [ ] Audit report generated
- [ ] Deployed to Vercel and verified
