import fitz
from PIL import Image
import pytesseract
import re
import json
import os
import sys

# Configure Tesseract path
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

PDF_DIR = "D:/Lynk/翎英教育LynkEdu/教研系统/AP/题库系统/raw_pdfs"
OUTPUT_DIR = "D:/Lynk/翎英教育LynkEdu/题库系统-web/ap-question-bank/scripts"

PDFS = [
    ("2023_Practice_1.pdf", "extracted_2023_set1.json"),
    ("2023_Practice_2.pdf", "extracted_2023_set2.json"),
    ("2023_Practice_3.pdf", "extracted_2023_set3.json"),
]

# Page artifacts to remove
PAGE_ARTIFACTS = [
    r"Unauthorized copying or reuse of\s*any part of this page is illegal\.",
    r"GO ON TO THE NEXT PAGE\.",
    r"GO ON\s*TO\s*THE\s*NEXT\s*PAGE",
    r"STOP\s*\.*",
    r"MACROECONOMICS\s*Section\s*I",
    r"Time-\s*70\s*minutes",
    r"SECTION\s*I\s*Time-\s*70\s*minutes",
    r"AP\s*Macroeconomics\s*-\s*\d{4}\s*Practice\s*Exam\s*\d+",
    r"AP\s*Macroeconomics\s*Practice\s*Exam\s*\d+",
    r"AP\s*Macroeconomics\s*-\s*Practice\s*Exam\s*\d+",
    r"Item\s+\d+\s+was\s+not\s+scored",
    r"-\s*\d+\s*-\s*",  # page numbers like -10-
    r"\d+\s*/\s*\d+",  # page numbers like 10/20
    r"Questions?\s*Visit\s*apcentral\.collegeboard\.org\s*\.\s*AP\s*Macroeconomics\s*-\s*Practice\s*Exam\s*\d+",
    r"Directions:\s*Each\s*of\s*the\s*questions\s*or\s*incomplete\s*statements\s*below\s*is\s*followed\s*by\s*five\s*suggested\s*answers\s*or\s*completions\.\s*Select\s*the\s*one\s*that\s*is\s*best\s*in\s*each\s*case\s*and\s*then\s*fill\s*in\s*the\s*corresponding\s*circle\s*on\s*the\s*answer\s*sheet\.",
    r"60\s*Questions",
]

GRAPH_KEYWORDS = [
    "graph above", "diagram above", "figure above", "table above",
    "graph below", "diagram below", "figure below", "table below",
    "the graph", "the diagram", "the figure", "the table",
    "graph shows", "diagram shows", "figure shows", "table shows",
    "graph illustrates", "diagram illustrates",
]

TABLE_KEYWORDS = [
    "based on the table", "according to the table", "the table above",
    "the table below", "table shows", "table gives",
]


def clean_text(text):
    """Apply all OCR cleaning rules."""
    # Remove page artifacts
    for pattern in PAGE_ARTIFACTS:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)
    
    # Handle CID characters
    text = text.replace("(cid:2)", "−")
    text = text.replace("(cid:0)", "")
    text = text.replace("(cid:3)", "")
    text = text.replace("(cid:1)", "")
    text = re.sub(r"\(cid:\d+\)", "", text)
    
    # Remove "Item X was not scored"
    text = re.sub(r"Item\s+\d+\s+was\s+not\s+scored", "", text, flags=re.IGNORECASE)
    
    # Fix common OCR artifacts
    text = text.replace("©", "(C)")
    text = text.replace("(Cc)", "(C)")
    text = text.replace("(C)", "(C)")
    text = text.replace("Cc)", "(C)")
    text = text.replace("(c)", "(C)")
    
    # Merge word fragments broken by line breaks
    # e.g., "invent\nories" -> "inventories"
    # Pattern: word ending at line break continues on next line
    text = re.sub(r"([a-zA-Z])\n([a-zA-Z])", r"\1\2", text)
    
    # Remove trailing artifacts
    text = re.sub(r"\s+\.\s*\.\s*\.?", "", text)
    text = re.sub(r"\.{3,}", "", text)
    
    # Remove excessive blank lines but keep paragraph breaks
    text = re.sub(r"\n{3,}", "\n\n", text)
    
    # Remove extra spaces
    text = re.sub(r"[ \t]+", " ", text)
    text = text.replace(" \n", "\n")
    text = text.replace("\n ", "\n")
    
    return text.strip()


def extract_questions_from_text(text):
    """Split text into individual question blocks."""
    # Pattern: question number followed by text
    # Match things like "14. ", "15. ", "1. ", etc.
    pattern = r'(?:\n|\A)\s*(\d+)\s*\.\s*(.*?)(?=(?:\n|\A)\s*\d+\s*\.|\Z)'
    matches = list(re.finditer(pattern, text, re.DOTALL))
    
    questions = []
    for m in matches:
        qnum = int(m.group(1))
        qtext = m.group(2).strip()
        questions.append((qnum, qtext))
    
    return questions


def split_options(question_text):
    """Split question text into stem and options A-E."""
    # Options are marked with (A), (B), (C), (D), (E)
    # Sometimes OCR produces (A) with variations
    option_pattern = r'\(([A-E])\)'
    
    parts = re.split(option_pattern, question_text)
    if len(parts) < 3:
        return question_text, {}
    
    stem = parts[0].strip()
    options = {}
    for i in range(1, len(parts), 2):
        if i+1 < len(parts):
            label = parts[i]
            opt_text = parts[i+1].strip()
            options[label] = opt_text
    
    return stem, options


def detect_table_question(stem, options):
    """Detect if a question has table-like options."""
    # Table questions have options that look like rows with multiple columns
    # Or contain headers like "Interest Rate | Private Investment"
    if not options:
        return False, None
    
    # Check if options have pipe-like separators or multiple column-like words
    table_headers = None
    table_rows = []
    
    # Look for multi-line options that seem to have column structures
    for label, opt_text in options.items():
        lines = [l.strip() for l in opt_text.split('\n') if l.strip()]
        if len(lines) >= 2:
            # Could be a table row
            pass
    
    # Check if any option text contains pipe-like separation or multiple distinct phrases
    # A simpler heuristic: if multiple options have the same number of "words" or similar structure
    opt_lines_counts = [len([l for l in opt.split('\n') if l.strip()]) for opt in options.values()]
    if any(c >= 2 for c in opt_lines_counts):
        # Check for table-like headers in stem
        # If stem contains words that look like column headers
        pass
    
    # Check for explicit table keywords in stem
    for kw in TABLE_KEYWORDS:
        if kw.lower() in stem.lower():
            return True, None
    
    # Heuristic: if options contain repeated multi-word patterns separated by line breaks
    # e.g., "Increase\nDecrease" structure
    table_data = None
    for label, opt_text in options.items():
        # Check for patterns like "Word1 Word2\nWord3 Word4" or tabular structures
        lines = [l.strip() for l in opt_text.split('\n') if l.strip()]
        if len(lines) >= 2 and all(len(l.split()) <= 4 for l in lines):
            table_data = True
    
    # Also check if stem contains headers like "Interest Rate" and "Investment" or "Fiscal Policy" and "Monetary Policy"
    header_patterns = [
        r'Interest\s*Rate.*Investment',
        r'Fiscal\s*Policy.*Monetary\s*Policy',
        r'Total\s*Reserves.*Money\s*Multiplier',
        r'Value\s*of\s*the\s*Dollar.*Exports',
        r'Income\s*Taxes.*Interest\s*Rate.*Investment',
        r'Real\s*Interest\s*Rate.*Interest[-\s]Sensitive',
    ]
    for pat in header_patterns:
        if re.search(pat, stem, re.IGNORECASE):
            return True, None
    
    # Detect options that look like table rows (multiple short lines per option)
    tabular_count = 0
    for opt_text in options.values():
        lines = [l.strip() for l in opt_text.split('\n') if l.strip()]
        if len(lines) >= 2 and len(lines) <= 4:
            # Check if lines look like short values (not sentences)
            if all(len(l.split()) <= 5 for l in lines):
                tabular_count += 1
    
    if tabular_count >= 3:
        return True, None
    
    return False, None


def extract_table_data(stem, options):
    """Extract table data from table-like options."""
    # Try to infer headers from stem and rows from options
    table_data = {"headers": [], "rows": []}
    
    # Extract headers from stem text
    # Look for patterns: "X and Y will change in which ways?" or "X | Y"
    header_patterns = [
        (r'(Interest\s*Rate).*(Private\s*Investment\s*(?:in\s*P&E)?)', ['Interest Rate', 'Private Investment']),
        (r'(Fiscal\s*Policy).*(Monetary\s*Policy)', ['Fiscal Policy', 'Monetary Policy']),
        (r'(Total\s*Reserves).*(Money\s*Multiplier).*(Money\s*Supply)', ['Total Reserves', 'Money Multiplier', 'Money Supply']),
        (r'(Value\s*of\s*the\s*Dollar).*(Exports)', ['Value of the Dollar', 'Exports']),
        (r'(Income\s*Taxes).*(Interest\s*Rate).*(Investment)', ['Income Taxes', 'Interest Rate', 'Investment']),
        (r'(Real\s*Interest\s*Rate).*(Interest[-\s]Sensitive\s*Spending)', ['Real Interest Rate', 'Interest-Sensitive Spending']),
    ]
    
    headers_found = None
    for pat, default_headers in header_patterns:
        if re.search(pat, stem, re.IGNORECASE):
            headers_found = default_headers
            break
    
    if not headers_found:
        # Try to infer from option text structure
        # If all options have the same number of short lines, use generic headers
        first_opt = list(options.values())[0] if options else ""
        lines = [l.strip() for l in first_opt.split('\n') if l.strip()]
        headers_found = [f"Column {i+1}" for i in range(len(lines))]
    
    table_data["headers"] = headers_found
    
    for label in ['A', 'B', 'C', 'D', 'E']:
        if label in options:
            opt_text = options[label]
            lines = [l.strip() for l in opt_text.split('\n') if l.strip()]
            table_data["rows"].append({
                "option": label,
                "cells": lines
            })
    
    return table_data


def detect_graph(stem, options):
    """Detect if question references a graph/diagram."""
    full_text = (stem + " " + " ".join(options.values())).lower()
    for kw in GRAPH_KEYWORDS:
        if kw.lower() in full_text:
            return True
    return False


def ocr_pdf(pdf_path, dpi=200):
    """OCR all pages of a PDF and return combined text."""
    doc = fitz.open(pdf_path)
    zoom = dpi / 72
    mat = fitz.Matrix(zoom, zoom)
    
    all_text = []
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        pix = page.get_pixmap(matrix=mat)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        text = pytesseract.image_to_string(img)
        all_text.append(f"\n---PAGE {page_idx+1}---\n{text}")
    
    doc.close()
    return "\n".join(all_text)


def extract_from_pdf(pdf_name):
    """Extract questions from a single PDF."""
    pdf_path = os.path.join(PDF_DIR, pdf_name)
    print(f"Processing {pdf_name}...")
    
    raw_text = ocr_pdf(pdf_path)
    
    # Save raw OCR for debugging
    debug_path = os.path.join(OUTPUT_DIR, pdf_name.replace(".pdf", "_raw_ocr.txt"))
    with open(debug_path, "w", encoding="utf-8") as f:
        f.write(raw_text)
    print(f"  Saved raw OCR to {debug_path}")
    
    # Clean text
    cleaned = clean_text(raw_text)
    
    # Extract questions
    questions = extract_questions_from_text(cleaned)
    print(f"  Found {len(questions)} raw question blocks")
    
    results = []
    warnings = []
    
    for qnum, qtext in questions:
        try:
            qdata = process_question(qnum, qtext)
            results.append(qdata)
        except Exception as e:
            warnings.append(f"Q{qnum}: processing error - {str(e)}")
            results.append({
                "question_number": qnum,
                "text": qtext,
                "options": {},
                "has_graph": False,
                "is_table": False,
                "error": str(e)
            })
    
    return results, warnings


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    summary = {
        "sets": [],
        "total_questions": 0,
        "total_with_graphs": 0,
        "total_with_tables": 0,
        "warnings": []
    }
    
    for pdf_name, json_name in PDFS:
        questions, warnings = extract_from_pdf(pdf_name)
        
        json_path = os.path.join(OUTPUT_DIR, json_name)
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        print(f"  Saved {json_name} ({len(questions)} questions)")
        
        graph_count = sum(1 for q in questions if q.get("has_graph"))
        table_count = sum(1 for q in questions if q.get("is_table"))
        
        summary["sets"].append({
            "pdf": pdf_name,
            "json": json_name,
            "question_count": len(questions),
            "graph_count": graph_count,
            "table_count": table_count,
            "warnings": warnings
        })
        summary["total_questions"] += len(questions)
        summary["total_with_graphs"] += graph_count
        summary["total_with_tables"] += table_count
        summary["warnings"].extend([f"{pdf_name}: {w}" for w in warnings])
        print()
    
    # Save summary
    summary_path = os.path.join(OUTPUT_DIR, "extraction_summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    # Print summary
    print("=" * 60)
    print("EXTRACTION SUMMARY")
    print("=" * 60)
    for s in summary["sets"]:
        print(f"\n{s['pdf']}:")
        print(f"  Questions: {s['question_count']}")
        print(f"  With graphs: {s['graph_count']}")
        print(f"  With tables: {s['table_count']}")
        if s['warnings']:
            print(f"  Warnings ({len(s['warnings'])}):")
            for w in s['warnings'][:5]:
                print(f"    - {w}")
    
    print(f"\n{'='*60}")
    print(f"TOTAL: {summary['total_questions']} questions")
    print(f"TOTAL with graphs: {summary['total_with_graphs']}")
    print(f"TOTAL with tables: {summary['total_with_tables']}")
    print(f"Summary saved to: {summary_path}")


if __name__ == "__main__":
    main()
