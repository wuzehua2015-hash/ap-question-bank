#!/usr/bin/env python3
"""
Generic subject rebuild script — configuration-driven, zero hardcoding.
Reads classification_config.json for all subject-specific settings.

Usage:
  python scripts/rebuild_subject.py --subject micro --pdf-dir ".../Microeconomics" --years 2012-2018
"""
import argparse
import json
import re
import os
import fitz
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent.resolve()

def load_config(subject_path):
    config_path = BASE_DIR / 'public' / 'data' / subject_path / 'classification_config.json'
    with open(config_path, encoding='utf-8') as f:
        return json.load(f)

def parse_years(years_str):
    """Parse '2012-2018' or '2012,2013,2014' into list."""
    if '-' in years_str:
        start, end = years_str.split('-')
        return [str(y) for y in range(int(start), int(end)+1)]
    return [y.strip() for y in years_str.split(',')]

def extract_page_text(page, layout_config):
    """Extract text from a PDF page using block-based reading order."""
    blocks = page.get_text('blocks')
    if not blocks:
        return page.get_text()
    
    if layout_config.get('two_column', True):
        mid_x = page.rect.width / 2
        left = sorted([b for b in blocks if (b[0]+b[2])/2 < mid_x], key=lambda b: b[1])
        right = sorted([b for b in blocks if (b[0]+b[2])/2 >= mid_x], key=lambda b: b[1])
        return '\n'.join([b[4] for b in left]) + '\n___COLUMN_BREAK___\n' + '\n'.join([b[4] for b in right])
    else:
        return page.get_text()

def clean_text(text, pollution_patterns):
    """Remove boilerplate, headers, footers, alt-text."""
    # Remove known pollution patterns from config
    for pattern in pollution_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)
    
    # Generic cleanup
    text = re.sub(r'Unauthorized copying or reuse of\s+any part of this page is illegal\.', '', text)
    text = re.sub(r'GO ON TO THE NEXT PAGE\.?', '', text)
    text = re.sub(r'-?\d+-', '', text)
    text = re.sub(r'© \d{4} The College Board\..*', '', text, flags=re.DOTALL)
    text = re.sub(r'Visit the College Board on the Web: www\.collegeboard\.org', '', text)
    text = re.sub(r'Item \d+ was not scored', '', text)
    
    # Alt-text (image descriptions)
    text = re.sub(r'The figure shows.*?\n(?=\s*\d+\.|\n|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'The graph shows.*?\n(?=\s*\d+\.|\n|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'The diagram shows.*?\n(?=\s*\d+\.|\n|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'The table shows.*?\n(?=\s*\d+\.|\n|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'A figure shows.*?\n(?=\s*\d+\.|\n|$)', '', text, flags=re.DOTALL)
    
    return text.strip()

def parse_mcqs_from_text(page_text, year):
    """Parse MCQ questions from extracted page text."""
    # Split at column break — options should only come from the same column as the question
    parts = page_text.split('___COLUMN_BREAK___')
    
    questions = []
    
    for part in parts:
        part = part.strip()
        if not part:
            continue
        
        # Find all question blocks: number + text + options
        # Pattern: number. text... (A) ... (B) ... (C) ... (D) ... (E) ...
        q_pattern = re.compile(
            r'(?P<num>\d+)\.\s*(?P<text>.*?)(?=\n\s*\([A-E]\)\s+)',
            re.DOTALL
        )
        opt_pattern = re.compile(
            r'\n\s*\((?P<letter>[A-E])\)\s+(?P<text>.*?)(?=\n\s*\([A-E]\)\s+|\n\s*\d+\.|\Z)',
            re.DOTALL
        )
        
        # Find all question starts in this part
        for qm in q_pattern.finditer(part):
            q_num = int(qm.group('num'))
            q_text = qm.group('text').strip()
            
            # Find options after this question's text
            opts = {}
            # Get text from this question start to next question start or end
            start_pos = qm.end()
            next_q = re.search(r'\n\s*\d+\.', part[start_pos:])
            if next_q:
                option_text = part[start_pos:start_pos + next_q.start()]
            else:
                option_text = part[start_pos:]
            
            for om in opt_pattern.finditer(option_text):
                letter = om.group('letter')
                text = om.group('text').strip()
                # Truncate if it contains table keywords or next question content
                if re.search(r'\n\s*\d+\.', text):
                    text = text[:re.search(r'\n\s*\d+\.', text).start()].strip()
                opts[letter] = text
            
            if len(opts) >= 3:  # At least 3 options to be valid
                questions.append({
                    'year': year,
                    'question_num': q_num,
                    'text': q_text,
                    'options': opts,
                    'raw_page_text': part[:200]  # For debugging
                })
    
    return questions

def detect_has_graph(text, graph_keywords):
    """Detect if a question references a graph/diagram."""
    text_lower = text.lower()
    return any(kw.lower() in text_lower for kw in graph_keywords)

def detect_table_options(text, options):
    """Detect if options are table-based."""
    # Check if any option contains table-like content (multiple short words separated by spaces)
    table_keywords = ['GoodX', 'GoodY', 'Agronomia', 'Entertainment', 'Medical Care',
                       'Price', 'Quantity', 'Supply', 'Demand']
    for opt_text in options.values():
        if any(kw in opt_text for kw in table_keywords):
            return True
    return False

def extract_images_for_question(doc, page_idx, question_num, year, img_dir, graph_keywords):
    """Extract images for a question that needs them."""
    page = doc[page_idx]
    images = page.get_images(full=True)
    
    img_paths = []
    for img_idx, img in enumerate(images):
        xref = img[0]
        rects = page.get_image_rects(xref)
        for rect in rects:
            # Skip tiny images (likely icons)
            if rect.width < 50 or rect.height < 50:
                continue
            
            zoom = 200 / 72
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(clip=rect, matrix=mat)
            
            out_path = img_dir / f"{year}_Q{question_num}_img{img_idx}.png"
            pix.save(str(out_path))
            
            rel_path = f"/images/{img_dir.name}/{year}_Q{question_num}_img{img_idx}.png"
            img_paths.append(rel_path)
    
    return img_paths

def extract_answer_key(doc, start_page, end_page, max_question):
    """Extract answer key from MCQ answer pages."""
    answers = {}
    for page_idx in range(start_page, min(end_page, len(doc))):
        page = doc[page_idx]
        text = page.get_text()
        
        # Look for "Question X: A" patterns
        for m in re.finditer(r'Question\s+(\d{1,2})\s*[:#]\s*([A-E])', text):
            q_num = int(m.group(1))
            if q_num <= max_question:
                answers[q_num] = m.group(2)
    
    return answers

def extract_frq(doc, page_ranges, pollution_patterns):
    """Extract FRQ texts and scoring guidelines."""
    frqs = []
    
    for q_num, pages in page_ranges.items():
        texts = []
        for page_idx in pages:
            if page_idx >= len(doc):
                continue
            page = doc[page_idx]
            text = page.get_text()
            text = clean_text(text, pollution_patterns)
            texts.append(text)
        
        full_text = '\n'.join(texts)
        frqs.append({
            'question_num': q_num,
            'text': full_text,
            'year': page_ranges.get('year', 0)
        })
    
    return frqs

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--subject', required=True, help='Subject ID (e.g., micro)')
    parser.add_argument('--pdf-dir', required=True, help='Directory containing PDF files')
    parser.add_argument('--years', required=True, help='Years to process, e.g., 2012-2018 or 2012,2013,2014')
    parser.add_argument('--subject-path', help='Data path under public/data/, defaults to ap/{subject}')
    args = parser.parse_args()
    
    subject_path = args.subject_path or f'ap/{args.subject}'
    out_dir = BASE_DIR / 'public' / 'data' / subject_path
    img_dir = BASE_DIR / 'public' / 'images' / args.subject / 'mcq'
    img_dir_frq = BASE_DIR / 'public' / 'images' / args.subject / 'frq'
    
    out_dir.mkdir(parents=True, exist_ok=True)
    img_dir.mkdir(parents=True, exist_ok=True)
    img_dir_frq.mkdir(parents=True, exist_ok=True)
    
    # Load config
    config = load_config(subject_path)
    graph_keywords = config.get('image_keywords', ['graph', 'diagram', 'figure', 'table', 'curve', 'above', 'below'])
    pollution_patterns = config.get('pollution_patterns', [])
    layout_config = config.get('layout', {'two_column': True})
    
    years = parse_years(args.years)
    
    all_mcqs = []
    all_frqs = []
    
    for year in years:
        pdf_path = Path(args.pdf_dir) / f'AP Micro {year}.pdf'
        if not pdf_path.exists():
            # Try alternative naming
            alt_names = [
                f'AP_Microeconomics_{year}_Full_Exam.pdf',
                f'AP Micro {year}.pdf',
                f'AP_Micro_{year}.pdf'
            ]
            for alt in alt_names:
                pdf_path = Path(args.pdf_dir) / alt
                if pdf_path.exists():
                    break
        
        if not pdf_path.exists():
            print(f"Warning: PDF not found for {year}")
            continue
        
        print(f"Processing {year}...")
        doc = fitz.open(str(pdf_path))
        
        # --- MCQ Extraction ---
        mcq_pages = []  # (page_idx, question_nums_on_this_page)
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            text = extract_page_text(page, layout_config)
            
            # Detect questions on this page
            q_nums = re.findall(r'\n(\d+)\.\s+', text)
            if q_nums:
                mcq_pages.append((page_idx, [int(n) for n in q_nums]))
        
        # Extract MCQs page by page
        year_mcqs = []
        for page_idx, q_nums in mcq_pages:
            page = doc[page_idx]
            text = extract_page_text(page, layout_config)
            text = clean_text(text, pollution_patterns)
            
            questions = parse_mcqs_from_text(text, year)
            for q in questions:
                if q['question_num'] in q_nums:
                    q['has_graph'] = detect_has_graph(q['text'], graph_keywords)
                    q['is_table'] = detect_table_options(q['text'], q['options'])
                    
                    # Extract images if needed
                    if q['has_graph'] or q['is_table'] or any(not v.strip() for v in q['options'].values()):
                        img_paths = extract_images_for_question(doc, page_idx, q['question_num'], year, img_dir, graph_keywords)
                        q['image_paths'] = img_paths
                    else:
                        q['image_paths'] = []
                    
                    year_mcqs.append(q)
        
        # Deduplicate by question_num
        seen = set()
        for q in year_mcqs:
            if q['question_num'] not in seen:
                seen.add(q['question_num'])
                all_mcqs.append(q)
        
        doc.close()
    
    # Save raw extraction
    raw_dir = out_dir / 'raw_extraction'
    raw_dir.mkdir(exist_ok=True)
    with open(raw_dir / 'all_mcqs_raw.json', 'w', encoding='utf-8') as f:
        json.dump(all_mcqs, f, ensure_ascii=False, indent=2)
    
    print(f"Extracted {len(all_mcqs)} MCQs")
    print(f"Saved to {raw_dir / 'all_mcqs_raw.json'}")
    
    # --- Post-processing: match answers, clean further ---
    # This will be done in a separate script or manually
    
    print("Done. Next: run match_answers.py and classify.py")

if __name__ == '__main__':
    main()
