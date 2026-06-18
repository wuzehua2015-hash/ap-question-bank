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
       { "code": "U3", "name": "National Income", "topics": ["AD-AS", "fiscal policy", "multiplier", "Phillips curve short-run"] },
       { "code": "U4", "name": "Financial Sector", "topics": ["money", "banking", "monetary policy", "interest rates", "loanable funds"] },
       { "code": "U5", "name": "Long-Run Consequences", "topics": ["economic growth", "production function", "long-run Phillips", "human capital"] },
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

**Two approaches (use BOTH):**

**Approach A: Extract table as image**
```python
# Crop the table region from the PDF page
# Save as PNG: public/images/[year]/[year]_Q[id]_table.png
# Add to question's image_paths
```

**Approach B: Extract table as structured data**
```python
# For table questions, parse the table headers and rows
# Store in option_table_data
{
  "option_table_data": {
    "headers": ["Government Outlays", "Tax Revenues"],
    "rows": {
      "A": ["Fall by $100 million", "Fall by $600 million"],
      "B": ["Fall by $200 million", "Fall by $200 million"],
      "C": ["Rise by $300 million", "Fall by $300 million"],
      "D": ["Rise by $400 million", "Rise by $600 million"],
      "E": ["Rise by $500 million", "Rise by $500 million"]
    }
  }
}
```

**Critical rule:**
- If a question has a table, ALWAYS extract it as an image (for visual rendering)
- ALSO extract it as structured data (for interactive table rendering)
- The `options` field should contain the text version with `/` separator: `"Fall by $100 million / Fall by $600 million"`

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
            strong = ['central bank', 'money supply', 'monetary policy', 'federal reserve']
            if any(kw in full_text for kw in strong):
                score += 10  # Heavy weight for U4 strong signals
        elif unit['code'] == 'U5':
            strong = ['economic growth', 'long-run growth', 'human capital']
            if any(kw in full_text for kw in strong):
                score += 10
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

### 4.3 Handle Cross-Unit Questions

Some questions span multiple units. Set `primary_unit` to the **main concept being tested**, and `secondary_units` to units that provide context.

Example: A question about "fiscal policy's effect on interest rates" tests U3 (fiscal policy) but mentions U4 (interest rates). Set `primary_unit: U3`, `secondary_units: [U4]`.

## Step 5: JSON Assembly & Output

### 5.1 Final JSON Schema

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

Before running the full `question-bank-audit`, perform a quick self-check:

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
    
    return issues
```

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
| Wrong unit classification | U2 question about central bank | Weak keyword matching | Use LLM verification for all borderline cases |
| Trailing dots artifact | `"end . ."` | OCR error | Auto-fix: `replace(/\s+\.\s+\.$/, '.')` |
| Embedded question numbers | Question 26 contains text from Q27 | Page boundary mid-question | Detect `\n\d+\.\s` in middle of text, split |

## Success Criteria

- [ ] All PDFs extracted and parsed
- [ ] Zero leading numbers in question text
- [ ] Zero table content leaking into options (all tables extracted as images + structured data)
- [ ] Zero page headers/footers in questions
- [ ] All graph questions have corresponding image files
- [ ] All questions have valid `primary_unit` (verified by LLM)
- [ ] Pre-audit check passes with 0 issues
- [ ] `question-bank-audit` passes with 0 issues
- [ ] JSON file committed to git
- [ ] Images committed to git
- [ ] Audit report generated
- [ ] Deployed to Vercel and verified
