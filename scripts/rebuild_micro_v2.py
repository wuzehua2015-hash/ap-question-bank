#!/usr/bin/env python3
"""
AP Microeconomics v2.0 Data Re-extraction Script

Follows AP_QUESTION_DATA_SPEC_v2.md:
- Distinguishes background_data from options
- Handles table options with option_table_columns + options_as_table
- FRQ rubric with structured points and contentful descriptions
- Text tables stay as text (not images); only diagrams become images
- Per-question image cropping
- UTF-8 encoding cleanup

Usage:
    python scripts/rebuild_micro_v2.py --year 2012 --test
    python scripts/rebuild_micro_v2.py --all
"""

import json
import re
import os
import fitz
import argparse
from pathlib import Path
from PIL import Image
import io

BASE_DIR = "D:/Lynk/翎英教育LynkEdu/题库系统-web/ap-question-bank"
PDF_DIR = "D:/Lynk/翎英教育LynkEdu/真题/AP/Full_Exams/Microeconomics"
OUT_DIR = f"{BASE_DIR}/public/data/ap/microeconomics"
IMG_DIR_MCQ = f"{BASE_DIR}/public/images/micro/mcq"
IMG_DIR_FRQ = f"{BASE_DIR}/public/images/micro/frq"

PDFS = {
    '2012': f'{PDF_DIR}/AP Micro 2012.pdf',
    '2013': f'{PDF_DIR}/AP Micro 2013.pdf',
    '2014': f'{PDF_DIR}/AP Micro 2014.pdf',
    '2015': f'{PDF_DIR}/AP Micro 2015.pdf',
    '2016': f'{PDF_DIR}/AP Micro 2016.pdf',
    '2017': f'{PDF_DIR}/AP_Microeconomics_2017_Full_Exam.pdf',
    '2018': f'{PDF_DIR}/AP Micro 2018.pdf',
}

# Keywords that indicate a diagram/graph reference in the question stem
DIAGRAM_KEYWORDS = [
    'diagram above', 'diagram below', 'graph above', 'graph below',
    'the graph', 'the figure', 'the diagram', 'in the diagram', 'in the graph',
    'graph shows', 'figure shows', 'shown in the', 'based on the'
]

# Table keywords that suggest background data in the stem
BACKGROUND_TABLE_KEYWORDS = [
    'payoff matrix', 'production', 'cost', 'output', 'quantity', 'price',
    'units of', 'according to the table', 'according to the information',
    'table above', 'data above'
]

# Patterns that indicate table-style options (rows with multiple columns)
TABLE_OPTION_PATTERNS = [
    r'\$\d+\.\d+.*\$\d+\.\d+',  # Two dollar values (like Q18 tax table)
    r'\w+\s+\w+.*\w+\s+\w+',     # Multiple words separated (like Q52 market structure)
]


def normalize_text(text):
    """Clean up text: replace control chars, fix Unicode quotes, remove replacement chars."""
    # Replace control characters with spaces
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', ' ', text)
    # Replace Unicode replacement character
    text = text.replace('\uFFFD', '')
    # Replace Unicode quotes with ASCII
    text = text.replace('\u2018', "'").replace('\u2019', "'")
    text = text.replace('\u201C', '"').replace('\u201D', '"')
    # Fix common encoding issues
    text = text.replace('', '')
    return text


def clean_boilerplate(text):
    """Remove PDF boilerplate text. Conservative: only remove known patterns."""
    # Remove unauthorized copying notice (common in AP exams)
    text = re.sub(r'Unauthorized copying or reuse of\s+any part of this page is illegal\.', '', text, flags=re.IGNORECASE)
    # Remove page navigation
    text = re.sub(r'GO ON TO THE NEXT PAGE\.', '', text, flags=re.IGNORECASE)
    text = re.sub(r'GO ON TO THE NEXT PAGE', '', text, flags=re.IGNORECASE)
    # Remove page numbers like -3- but be careful not to match negative numbers in math
    text = re.sub(r'\n\s*-\d+-\s*\n', '\n', text)
    # Remove College Board copyright line
    text = re.sub(r'© \d{4} The College Board\.\s*Visit the College Board on the Web: www\.collegeboard\.org\.', '', text, flags=re.IGNORECASE)
    # Remove STOP/END OF EXAM (only at end of text)
    text = re.sub(r'STOP\s+END OF EXAM.*$', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'STOP\s+END OF SECTION.*$', '', text, flags=re.DOTALL | re.IGNORECASE)
    # Remove alt-text descriptions (be more specific to avoid over-matching)
    text = re.sub(r'The figure shows [^.]*\.', '', text, flags=re.DOTALL)
    text = re.sub(r'The graph shows [^.]*\.', '', text, flags=re.DOTALL)
    text = re.sub(r'The table shows [^.]*\.', '', text, flags=re.DOTALL)
    text = re.sub(r'A figure shows [^.]*\.', '', text, flags=re.DOTALL)
    return text.strip()


def extract_page_text(page, use_two_column=True):
    """Extract text from a page using block-based reading order."""
    blocks = page.get_text('blocks')
    
    if not use_two_column:
        sorted_blocks = sorted(blocks, key=lambda b: (b[1], b[0]))
        return '\n'.join([b[4] for b in sorted_blocks])
    
    mid_x = page.rect.width / 2
    left_blocks = [b for b in blocks if (b[0] + b[2]) / 2 < mid_x]
    right_blocks = [b for b in blocks if (b[0] + b[2]) / 2 >= mid_x]
    
    left_sorted = sorted(left_blocks, key=lambda b: b[1])
    right_sorted = sorted(right_blocks, key=lambda b: b[1])
    
    left_text = '\n'.join([b[4] for b in left_sorted])
    right_text = '\n'.join([b[4] for b in right_sorted])
    
    return left_text + '\n___COLUMN_BREAK___\n' + right_text


def classify_pages(doc):
    """Classify pages in the PDF into MCQ, FRQ, answer key, and scoring.
    
    Strategy: Find the first page with actual MCQ content (has 5 options A-E),
    then include all pages until we find a page with no MCQ content or FRQ starts.
    """
    mcq_pages = []
    frq_pages = []
    answer_key_pages = []
    scoring_pages = []
    
    # Find MCQ start: first page with at least 5 options (A-E) and question numbers
    mcq_start = None
    for i in range(len(doc)):
        text = doc[i].get_text()
        option_count = len(re.findall(r'\([A-E]\)', text))
        has_qnum = bool(re.search(r'\d{1,2}\.\s+', text))
        has_directions = 'directions' in text.lower()
        
        # A real MCQ page should have at least 3 options and question numbers
        if option_count >= 3 and has_qnum and (has_directions or i > 10):
            mcq_start = i
            break
    
    # If no clear MCQ start found, try looser criteria
    if mcq_start is None:
        for i in range(len(doc)):
            text = doc[i].get_text()
            option_count = len(re.findall(r'\([A-E]\)', text))
            has_qnum = bool(re.search(r'\d{1,2}\.\s+', text))
            if option_count >= 2 and has_qnum:
                mcq_start = i
                break
    
    # Find where MCQ ends: first page after mcq_start with no options and no question numbers
    mcq_end = None
    if mcq_start is not None:
        for i in range(mcq_start + 1, len(doc)):
            text = doc[i].get_text()
            option_count = len(re.findall(r'\([A-E]\)', text))
            has_qnum = bool(re.search(r'\d{1,2}\.\s+', text))
            has_stop = 'STOP' in text
            has_end = 'END OF EXAM' in text
            has_answer_key = 'Answer Key' in text
            
            # If page has STOP/END OF EXAM or Answer Key, MCQ ends here
            if has_stop and has_end:
                mcq_end = i
                break
            if has_answer_key:
                mcq_end = i
                break
            # If page has no options and no question numbers, might be end of MCQ
            if option_count == 0 and not has_qnum and i > mcq_start + 5:
                # Check next page too
                if i + 1 < len(doc):
                    next_text = doc[i + 1].get_text()
                    next_options = len(re.findall(r'\([A-E]\)', next_text))
                    next_qnum = bool(re.search(r'\d{1,2}\.\s+', next_text))
                    if next_options == 0 and not next_qnum:
                        mcq_end = i
                        break
        
        if mcq_end is None:
            mcq_end = len(doc)
        
        mcq_pages = list(range(mcq_start, mcq_end))
    
    # Find FRQ pages: after MCQ ends, look for pages with FRQ content
    if mcq_end is not None and mcq_end < len(doc):
        for i in range(mcq_end, len(doc)):
            text = doc[i].get_text()
            lower_text = text.lower()
            has_frq = bool(re.search(r'Question\s+\d+', text))
            has_section_ii = 'section ii' in lower_text or 'free response' in lower_text
            has_answer_key = 'Answer Key' in text
            has_scoring = 'Scoring Guidelines' in text
            
            if has_answer_key or has_scoring:
                break
            
            if has_frq or has_section_ii:
                frq_pages.append(i)
    
    # Detect answer key and scoring pages
    for i in range(len(doc)):
        text = doc[i].get_text().lower()
        if 'answer key' in text and 'scoring' not in text:
            answer_key_pages.append(i)
        elif 'scoring guidelines' in text or 'free-response scoring' in text:
            scoring_pages.append(i)
    
    # Remove duplicates and sort
    mcq_pages = sorted(set(mcq_pages))
    frq_pages = sorted(set(frq_pages))
    answer_key_pages = sorted(set(answer_key_pages))
    scoring_pages = sorted(set(scoring_pages))
    
    return {
        'mcq': mcq_pages,
        'frq': frq_pages,
        'answer_key': answer_key_pages,
        'scoring': scoring_pages,
    }


def parse_answer_key(text):
    """Parse answer key from text. Returns dict {question_num: answer_letter}."""
    answers = {}
    # Pattern: "1. A 2. B 3. C..." or "1. A  2. B  3. C..."
    pattern = re.compile(r'(\d+)\.\s*([A-E])')
    for match in pattern.finditer(text):
        q_num = int(match.group(1))
        ans = match.group(2)
        if 1 <= q_num <= 60:
            answers[q_num] = ans
    return answers


def detect_table_options(text, options):
    """Detect if options are in table format (e.g., Q18, Q52).
    Returns (is_table, columns, formatted_options).
    """
    # Check if all options have a consistent delimiter-like structure
    # e.g., "$11.00 $10.45" or "Horizontal Horizontal"
    if len(options) < 5:
        return False, None, options
    
    # Try to detect column structure by looking for repeated patterns
    # Look for lines with multiple values that look like table cells
    has_table_structure = False
    column_headers = None
    
    # Check if options contain multiple space-separated tokens that look like table cells
    # For Q18 style: "(A) $11.00 $10.45"
    cell_counts = []
    for opt in options:
        # Remove option letter prefix
        content = re.sub(r'^\([A-E]\)\s*', '', opt).strip()
        # Split by common delimiters
        cells = re.split(r'\s{2,}|\t|\|', content)
        cells = [c.strip() for c in cells if c.strip()]
        cell_counts.append(len(cells))
    
    # If all options have same number of cells > 1, it's likely a table
    if len(set(cell_counts)) == 1 and cell_counts[0] > 1 and cell_counts[0] < 5:
        has_table_structure = True
        num_cols = cell_counts[0]
    
    if not has_table_structure:
        return False, None, options
    
    # Try to extract column headers from the text before options
    # Look for headers like "Paid by  \nReceived by" or "Market Structure \nQuantity"
    header_patterns = [
        r'([A-Za-z][\w\s]+)\s+([A-Za-z][\w\s]+)\s*\n\s*\(A\)',
        r'([A-Za-z][\w\s]+)\s*\n\s*([A-Za-z][\w\s]+)\s*\n\s*\(A\)',
    ]
    
    for pattern in header_patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            column_headers = [match.group(1).strip(), match.group(2).strip()]
            break
    
    if not column_headers:
        # Generate generic headers
        column_headers = [f"Column {i+1}" for i in range(num_cols)]
    
    # Format options as table rows with | separator
    formatted_options = []
    for opt in options:
        content = re.sub(r'^\([A-E]\)\s*', '', opt).strip()
        cells = re.split(r'\s{2,}|\t|\|', content)
        cells = [c.strip() for c in cells if c.strip()]
        formatted_options.append(f"({opt[1]}) " + " | ".join(cells))
    
    return True, column_headers, formatted_options


def extract_background_data(text):
    """Extract background data tables from question stem.
    Returns (cleaned_text, background_data or None).
    """
    # Look for table patterns in the text before options
    # Common patterns: production data, payoff matrix, income distribution, etc.
    
    # Check if there's a table-like structure before the first option
    option_start = text.find('(A)')
    if option_start < 0:
        return text, None
    
    stem = text[:option_start]
    
    # Look for table structures: rows of aligned data
    # Pattern: multiple lines with similar structure (e.g., "Country A 100 units 300 units")
    lines = stem.split('\n')
    table_lines = []
    in_table = False
    table_start = -1
    
    for i, line in enumerate(lines):
        # Check if line looks like table data (contains multiple values, aligned)
        if re.search(r'\w+\s+\d+', line) or re.search(r'\$\d+', line):
            if not in_table:
                in_table = True
                table_start = i
            table_lines.append(line)
        elif in_table and line.strip() and not re.match(r'^[A-Za-z]', line.strip()):
            table_lines.append(line)
        elif in_table and not line.strip():
            break
        elif in_table:
            break
    
    if len(table_lines) < 2:
        return text, None
    
    # Try to parse as table
    try:
        # Extract header (usually first line or line before data)
        header_line = None
        if table_start > 0:
            header_line = lines[table_start - 1]
        
        # Parse rows
        rows = []
        for line in table_lines:
            cells = re.split(r'\s{2,}|\t', line.strip())
            cells = [c.strip() for c in cells if c.strip()]
            if len(cells) >= 2:
                rows.append(cells)
        
        if len(rows) < 2:
            return text, None
        
        # Determine columns
        max_cols = max(len(r) for r in rows)
        if header_line:
            columns = re.split(r'\s{2,}|\t', header_line.strip())
            columns = [c.strip() for c in columns if c.strip()]
            if len(columns) < max_cols:
                columns = [f"Col {i+1}" for i in range(max_cols)]
        else:
            columns = [f"Col {i+1}" for i in range(max_cols)]
        
        # Pad rows to uniform length
        uniform_rows = []
        for row in rows:
            while len(row) < max_cols:
                row.append('')
            uniform_rows.append(row[:max_cols])
        
        # Remove table from stem
        table_text = '\n'.join(lines[table_start:table_start + len(table_lines)])
        cleaned_stem = stem.replace(table_text, '').strip()
        cleaned_text = cleaned_stem + '\n' + text[option_start:]
        
        background_data = {
            "type": "text_table",
            "description": header_line.strip() if header_line else "",
            "columns": columns,
            "rows": uniform_rows
        }
        
        return cleaned_text, background_data
    
    except Exception:
        return text, None


def crop_question_image(doc, page_idx, q_num, q_text, next_q_text=None):
    """Render a page and crop to the question's bounding box.
    Returns the image path or None if no image needed."""
    page = doc[page_idx]
    
    # Check if page has embedded images (diagrams, graphs)
    images = page.get_images()
    if not images:
        return None
    
    # Render page to image
    pix = page.get_pixmap(dpi=200)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    
    # Get text blocks to find question position
    blocks = page.get_text('blocks')
    
    # Find the y-position of the question number
    q_y_top = None
    q_y_bottom = None
    
    for b in blocks:
        text = b[4].strip()
        if text.startswith(f'{q_num}.'):
            q_y_top = b[1]
        # Find next question or end of page
        if next_q_text and text.startswith(f'{q_num + 1}.'):
            q_y_bottom = b[1]
    
    if q_y_top is None:
        return None
    
    if q_y_bottom is None:
        q_y_bottom = page.rect.height * 0.85  # Leave room for footer
    
    # Crop to question area (with some margin)
    margin = 20
    left = 0
    top = max(0, q_y_top - margin)
    right = page.rect.width
    bottom = min(page.rect.height, q_y_bottom + margin)
    
    cropped = img.crop((left, top, right, bottom))
    
    # Save
    img_path = f"micro/{q_num}.png"
    full_path = f"{IMG_DIR_MCQ}/{img_path}"
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    cropped.save(full_path, "PNG")
    
    return f"/images/micro/mcq/{img_path}"


def parse_mcqs(text, year, answers):
    """Parse MCQs from extracted text following v2.0 spec."""
    questions = []
    
    # Split by question numbers (1-60)
    # Pattern: number followed by period and space, at start of line or after blank
    q_pattern = re.compile(r'\n\s*(\d{1,2})\.\s+')
    
    matches = list(q_pattern.finditer(text))
    
    for i, match in enumerate(matches):
        q_num = int(match.group(1))
        if q_num > 60:
            continue
        
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        q_text = text[start:end]
        
        # Clean boilerplate
        q_text = clean_boilerplate(q_text)
        if not q_text.strip():
            continue
        
        # Extract options (A)-(E)
        option_pattern = re.compile(r'\n\s*\(([A-E])\)\s*(.*?)(?=\n\s*\([A-E]\)|\n\s*\d{1,2}\.|\Z)', re.DOTALL)
        option_matches = list(option_pattern.finditer(q_text))
        
        if len(option_matches) < 5:
            # Try relaxed pattern
            option_pattern = re.compile(r'\(([A-E])\)\s*(.*?)(?=\([A-E]\)|\n\s*\d{1,2}\.|\Z)', re.DOTALL)
            option_matches = list(option_pattern.finditer(q_text))
        
        if len(option_matches) < 5:
            # Cross-page question: options may be on next page
            # Try to find options in the remaining text (next page)
            if i + 1 < len(matches):
                # Get more text (next question's text too)
                extended_end = matches[i + 1].start() + 500 if i + 1 < len(matches) else len(text)
                extended_text = text[start:extended_end]
                extended_text = clean_boilerplate(extended_text)
                option_pattern = re.compile(r'\n\s*\(([A-E])\)\s*(.*?)(?=\n\s*\([A-E]\)|\n\s*\d{1,2}\.|\Z)', re.DOTALL)
                option_matches = list(option_pattern.finditer(extended_text))
            
            if len(option_matches) < 5:
                # Accept partial options for cross-page questions (will be fixed later)
                if len(option_matches) >= 2:
                    # Keep what we have, mark as incomplete
                    pass
                else:
                    continue
        
        options = []
        for om in option_matches:
            letter = om.group(1)
            opt_text = om.group(2).strip()
            # Remove line breaks within option text
            opt_text = ' '.join(opt_text.split())
            options.append(f"({letter}) {opt_text}")
        
        # Extract question stem (before first option)
        first_opt_start = option_matches[0].start()
        stem = q_text[:first_opt_start].strip()
        # Remove question number from stem
        stem = re.sub(r'^\d{1,2}\.\s*', '', stem)
        stem = ' '.join(stem.split())
        
        # Check for diagram reference
        diagram_refs = []
        has_diagram = False
        for kw in DIAGRAM_KEYWORDS:
            if kw in stem.lower():
                diagram_refs.append(kw)
                has_diagram = True
        
        # Detect table options
        is_table, table_columns, formatted_options = detect_table_options(q_text, options)
        
        # Extract background data (tables in stem)
        stem, background_data = extract_background_data(stem)
        
        # Build question object
        question = {
            "question_id": f"{year}_Q{q_num}",
            "year": int(year),
            "question_number": q_num,
            "question_type": "MCQ",
            "question_text": stem,
            "options": formatted_options if is_table else options,
            "options_as_table": is_table,
            "option_table_columns": table_columns if is_table else None,
            "background_data": background_data,
            "correct_answer": answers.get(q_num, ""),
            "images": [],
            "diagram_references": diagram_refs,
            "unit_tags": [],  # To be filled by classification
            "topic_tags": []
        }
        
        questions.append(question)
    
    return questions


def parse_frqs(text, year):
    """Parse FRQs from extracted text following v2.0 spec."""
    frqs = []
    
    # Pattern: Question number followed by text
    q_pattern = re.compile(r'(?:^|\n)\s*(\d+)\.\s+(.+?)(?=\n\s*\d+\.\s+|\Z)', re.DOTALL)
    
    matches = list(q_pattern.finditer(text))
    
    for match in matches:
        q_num = int(match.group(1))
        q_text = match.group(2).strip()
        
        # Clean boilerplate
        q_text = clean_boilerplate(q_text)
        q_text = ' '.join(q_text.split())
        
        # Extract sub-parts (a), (b), (c), etc.
        parts = []
        part_pattern = re.compile(r'\n\s*\(([a-z])\)\s*(.*?)(?=\n\s*\([a-z]\)|\Z)', re.DOTALL)
        part_matches = list(part_pattern.finditer('\n' + q_text))
        
        for pm in part_matches:
            parts.append(f"({pm.group(1)}) {pm.group(2).strip()}")
        
        # Extract background data
        q_text, background_data = extract_background_data(q_text)
        
        frq = {
            "question_id": f"{year}_FRQ{q_num}",
            "year": int(year),
            "question_number": q_num,
            "question_type": "FRQ",
            "question_text": q_text,
            "background_data": background_data,
            "parts": parts,
            "images": [],
            "rubric": {
                "points": []  # To be filled from scoring guidelines
            },
            "unit_tags": [],
            "topic_tags": []
        }
        
        frqs.append(frq)
    
    return frqs


def parse_scoring_guidelines(text, year):
    """Parse scoring guidelines into structured rubric points."""
    points = []
    
    # Pattern for scoring points: "(a) 1 point" or "(a) One point is earned"
    point_pattern = re.compile(
        r'(?:\n|^)\s*\(([a-z])\)\s*(?:\d+\s+point|\w+\s+point\s+is\s+earned)\s*(.*?)(?=\n\s*\([a-z]\)|\n\s*\(\d+\)|\Z)',
        re.DOTALL | re.IGNORECASE
    )
    
    matches = list(point_pattern.finditer(text))
    
    for match in matches:
        point_id = match.group(1)
        description = match.group(2).strip()
        description = ' '.join(description.split())
        
        # Extract criteria (bullet points or numbered items within the description)
        criteria = []
        # Look for sub-bullets like "•", "-", or numbered items
        bullet_pattern = re.compile(r'[•\-]\s*(.*?)(?=[•\-]|\Z)', re.DOTALL)
        for bm in bullet_pattern.finditer(description):
            criteria.append(bm.group(1).strip())
        
        points.append({
            "point_id": point_id,
            "value": 1,  # Default, can be adjusted
            "description": description,
            "criteria": criteria
        })
    
    return points


def extract_from_pdf(year, pdf_path, test_mode=False):
    """Extract all data from a single PDF following v2.0 spec."""
    doc = fitz.open(pdf_path)
    pages = classify_pages(doc)
    
    print(f"\n=== {year} PDF Analysis ===")
    print(f"  MCQ pages: {len(pages['mcq'])}")
    print(f"  FRQ pages: {len(pages['frq'])}")
    print(f"  Answer key pages: {len(pages['answer_key'])}")
    print(f"  Scoring pages: {len(pages['scoring'])}")
    
    # Extract MCQ text
    mcq_text = ''
    for page_idx in pages['mcq']:
        text = normalize_text(extract_page_text(doc[page_idx]))
        # More lenient check: page should have either options or question numbers
        if not re.search(r'\([A-E]\)', text) and not re.search(r'\d{1,2}\.\s+', text):
            continue
        mcq_text += '\n' + text
    
    # Extract answers
    answers = {}
    for page_idx in pages['answer_key']:
        text = normalize_text(extract_page_text(doc[page_idx]))
        page_answers = parse_answer_key(text)
        answers.update(page_answers)
    
    # Parse MCQs
    mcqs = parse_mcqs(mcq_text, year, answers)
    print(f"  Extracted {len(mcqs)} MCQs")
    
    # Extract FRQ text
    frq_text = ''
    seen_frq_nums = set()
    for page_idx in pages['frq']:
        text = normalize_text(extract_page_text(doc[page_idx]))
        if re.search(r'Additional answer page', text) or re.search(r'STOP\s+END OF EXAM', text):
            continue
        
        if re.search(r'Question\s+\d+\s+is\s+reprinted', text):
            continue
        
        # Check if this page contains a new question
        q_match = re.search(r'(?:Directions:.*?)(?:\n\s*(\d+)\.\s+)', text, re.DOTALL)
        if not q_match:
            q_match = re.search(r'^\s*(\d+)\.\s+', text)
        if not q_match:
            q_match = re.search(r'\n\s*(\d+)\.\s+', text)
        if q_match:
            q_num = int(q_match.group(1))
            if q_num not in [1, 2, 3]:
                continue
            if q_num in seen_frq_nums:
                continue
            seen_frq_nums.add(q_num)
            # Clean the page text before adding to frq_text
            cleaned_text = clean_boilerplate(text)
            frq_text += '\n' + cleaned_text
        else:
            # Page might be a continuation, but for AP exams questions are usually on separate pages
            pass
    
    # Extract scoring guidelines - use reading order (not two-column) because
    # scoring guideline headers (e.g. "AP MICROECONOMICS 2013 SCORING GUIDELINES Question 3")
    # are often in the right column, content in the left. Using two-column would put
    # the header AFTER the content, breaking the regex matching.
    scoring_text = ''
    for page_idx in pages['scoring']:
        text = normalize_text(extract_page_text(doc[page_idx], use_two_column=False))
        scoring_text += '\n' + text
    
    # Parse scoring guidelines and attach to FRQs
    for frq in frqs:
        points = parse_scoring_guidelines(scoring_text, year)
        # Match points to FRQ by question number
        frq_q_num = frq['question_number']
        frq_points = [p for p in points if p['point_id'] in [part[1] for part in frq['parts']]]
        if frq_points:
            frq['rubric']['points'] = frq_points
    
    doc.close()
    
    return mcqs, frqs


def main():
    parser = argparse.ArgumentParser(description='Re-extract AP Micro data with v2.0 spec')
    parser.add_argument('--year', type=str, help='Specific year to process (e.g., 2012)')
    parser.add_argument('--all', action='store_true', help='Process all years')
    parser.add_argument('--test', action='store_true', help='Test mode: only show first 5 questions')
    args = parser.parse_args()
    
    if args.year:
        years = [args.year]
    elif args.all:
        years = sorted(PDFS.keys())
    else:
        print("Usage: python rebuild_micro_v2.py --year 2012 --test")
        print("       python rebuild_micro_v2.py --all")
        return
    
    all_mcqs = []
    all_frqs = []
    
    for year in years:
        pdf_path = PDFS.get(year)
        if not pdf_path or not os.path.exists(pdf_path):
            print(f"Warning: PDF for {year} not found at {pdf_path}")
            continue
        
        mcqs, frqs = extract_from_pdf(year, pdf_path, test_mode=args.test)
        
        if args.test and mcqs:
            print(f"\n=== Sample {year} MCQ (Q1) ===")
            print(json.dumps(mcqs[0], indent=2, ensure_ascii=False)[:1000])
            if frqs:
                print(f"\n=== Sample {year} FRQ (Q1) ===")
                print(json.dumps(frqs[0], indent=2, ensure_ascii=False)[:1000])
        
        all_mcqs.extend(mcqs)
        all_frqs.extend(frqs)
    
    if not args.test:
        # Save output
        os.makedirs(OUT_DIR, exist_ok=True)
        
        with open(f'{OUT_DIR}/question_bank_v2.json', 'w', encoding='utf-8') as f:
            json.dump(all_mcqs, f, indent=2, ensure_ascii=False)
        
        with open(f'{OUT_DIR}/frq_bank_v2.json', 'w', encoding='utf-8') as f:
            json.dump(all_frqs, f, indent=2, ensure_ascii=False)
        
        print(f"\n=== Saved {len(all_mcqs)} MCQs and {len(all_frqs)} FRQs ===")
        print(f"  MCQ: {OUT_DIR}/question_bank_v2.json")
        print(f"  FRQ: {OUT_DIR}/frq_bank_v2.json")


if __name__ == '__main__':
    main()
