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

### 4.1 Automatic Classification (Rule-based)

```python
from curriculum_spec import units  # Load the curriculum spec

def classify_question(text, options):
    full_text = (text + ' ' + ' '.join(options.values())).lower()
    scores = {}
    
    for unit in units:
        score = 0
        for topic in unit['topics']:
            # Count topic keyword matches
            matches = len(re.findall(r'\b' + re.escape(topic.lower()) + r'\b', full_text))
            score += matches * 2  # weight for topic matches
            
        # Also check for strong keywords (unit-specific, high-confidence)
        if unit['code'] == 'U4':
            strong = ['central bank', 'money supply', 'money demand', 'monetary policy', 'federal reserve', 'open market operations', 'buy government bonds', 'sell government bonds', 'discount rate', 'reserve requirements']
            if any(kw in full_text for kw in strong):
                score += 15  # Heavy weight for U4 strong signals - MUST NOT be overridden by fiscal policy keywords alone
        elif unit['code'] == 'U5':
            strong = ['economic growth', 'long-run growth', 'human capital', 'crowding out', 'stabilization policy', 'fiscal and monetary', 'fiscal-monetary combination', 'government spending and central bank']
            if any(kw in full_text for kw in strong):
                score += 15  # Heavy weight for U5 strong signals
            # U5 combo questions: both fiscal and monetary policy present
            has_fiscal = any(kw in full_text for kw in ['taxes', 'government spending', 'fiscal policy'])
            has_monetary = any(kw in full_text for kw in ['money supply', 'monetary policy', 'central bank', 'federal reserve', 'bonds'])
            if has_fiscal and has_monetary:
                score += 20  # VERY strong signal: combination policy question
        elif unit['code'] == 'U3':
            strong = ['aggregate demand', 'aggregate supply', 'AD-AS', 'multiplier', 'government spending', 'taxes']
            if any(kw in full_text for kw in strong):
                score += 8  # Moderate weight for U3 signals - can be overridden by U4/U5 strong signals
        # ... etc for other units
        
        scores[unit['code']] = score
    
    # Pick the highest score
    best_unit = max(scores, key=scores.get)
    return best_unit, scores
```

**Important:** This rule-based classification is a **first pass only**. It will have errors. The next step is LLM verification.

### 4.2 LLM Verification (Batch Review)

Use the same LLM prompt template as in `question-bank-audit`:

```
You are an expert in [SUBJECT]. Review these questions and verify their unit classification.

Unit definitions:
[CURRICULUM SPEC]

For each question, determine:
1. What unit does this question primarily belong to? (Select ONE from the unit codes)
2. Why? (1-2 sentences)
3. Does it have secondary units? (Select 0-2 from the unit codes)

Output: { question_id, correct_unit, secondary_units, confidence, reasoning }
```

**Batch size:** 10 questions per LLM call
**Coverage:** For a 400-question bank, sample 100 questions (25%) for LLM review. If systematic errors are found, expand to full review.

**U4 vs U5 combination rule:** Questions that involve **both fiscal policy and monetary policy** in combination (e.g., "Which combination of fiscal and monetary policy will...?") belong to **U5**, not U3 or U4. These are called **stabilization policy combination** questions.

Examples:
- "Increase taxes + Sell government bonds" → U5 (combination of fiscal and monetary)
- "Government spending + Central bank sells bonds" → U5
- "Decrease taxes + Buy government bonds" → U5

**U4 standalone:** If the question only tests monetary policy concepts (money demand, money supply, central bank tools, interest rates, loanable funds) **without** combining with fiscal policy, it belongs to U4.

Examples:
- "What happens to money demand when nominal GDP increases?" → U4
- "The central bank sells government bonds. What happens to the money supply?" → U4
- "If the budget deficit increases, what happens to interest rates?" → U4 (loanable funds)

### 4.3 Handle Cross-Unit Questions

Some questions span multiple units. Set `primary_unit` to the **main concept being tested**, and `secondary_units` to units that provide context.

Example: A question about "fiscal policy's effect on interest rates" tests U3 (fiscal policy) but mentions U4 (interest rates). Set `primary_unit: U3`, `secondary_units: [U4]`.

**Exception:** If a question tests a combination of fiscal and monetary policy (e.g., "Which combination of fiscal and monetary policy will achieve full employment without changing the interest rate?"), the primary unit is U5 (stabilization policy combination), with secondary_units [U3, U4].

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
| Page headers in questions | `"MACROECONOMICS Section I"` in text | Header is extracted as part of text | Remove known header/footer patterns post-extraction |
| Missing dollar signs | `"100 million"` instead of `"$100 million"` | OCR strips `$` or converts to `\` | Post-process: detect monetary values without `$`, add it |
| Graph questions without images | `has_graph=true` but no image file | Forgot to extract graph image | Flag graph questions during extraction, manually crop |
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
