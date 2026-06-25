# AP Microeconomics Question Bank - Comprehensive Audit Script
# This script performs DEEP CONTENT AUDIT, not just structural checks

import json
import os
import fitz
import cv2
import numpy as np
from collections import Counter, defaultdict

# ============================================================================
# CONFIGURATION
# ============================================================================
DATA_DIR = 'public/data/ap/microeconomics'
IMAGE_DIR = 'public/images/ap/microeconomics'
PDF_DIR = 'D:/Lynk/翎英教育LynkEdu/真题/AP/Full_Exams/Microeconomics'

# P0 = Blocker (must fix before deployment)
# P1 = Serious (affects user experience)
# P2 = Minor (cosmetic or cleanup)
issues = {'P0': [], 'P1': [], 'P2': []}

def add_issue(priority, question_id, message):
    issues[priority].append(f'{question_id}: {message}')

# ============================================================================
# LAYER 1: STRUCTURAL INTEGRITY (catch missing fields)
# ============================================================================
print('=== LAYER 1: Structural Integrity ===')

with open(f'{DATA_DIR}/question_bank.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

required_fields = ['question_id', 'year', 'question_number', 'text', 'options', 
                   'question_type', 'source', 'primary_unit', 'pure_unit', 
                   'difficulty', 'difficulty_score', 'has_graph']

for q in questions:
    qid = q.get('question_id', 'UNKNOWN')
    
    for field in required_fields:
        if field not in q:
            add_issue('P0', qid, f'MISSING required field: {field}')
    
    if 'answer' not in q and 'correct_answer' not in q:
        add_issue('P0', qid, 'MISSING answer/correct_answer field')
    
    if not q.get('text', '').strip():
        add_issue('P0', qid, 'EMPTY question text')
    
    opts = q.get('options', {})
    if len(opts) != 5:
        add_issue('P0', qid, f'WRONG option count: {len(opts)} (expected 5)')
    
    for opt_letter in ['A', 'B', 'C', 'D', 'E']:
        if opt_letter not in opts:
            add_issue('P0', qid, f'MISSING option {opt_letter}')
        elif not opts[opt_letter] or not opts[opt_letter].strip():
            add_issue('P0', qid, f'EMPTY option {opt_letter}')

print(f'  P0: {len(issues["P0"])}, P1: {len(issues["P1"])}, P2: {len(issues["P2"])}')

# ============================================================================
# LAYER 2: CONTENT CORRECTNESS (catch placeholder/placeholder text)
# ============================================================================
print('=== LAYER 2: Content Correctness ===')

placeholder_patterns = ['See graph', 'See diagram', 'See table', 'Not available', 
                        'PLACEHOLDER', 'TODO', 'FIXME', 'placeholder']

for q in questions:
    qid = q.get('question_id', 'UNKNOWN')
    text = q.get('text', '')
    opts = q.get('options', {})
    
    # Check for placeholder text in options
    for opt_letter, opt_text in opts.items():
        for pattern in placeholder_patterns:
            if pattern.lower() in opt_text.lower():
                add_issue('P0', qid, f'Option {opt_letter} contains PLACEHOLDER: "{opt_text[:50]}"')
    
    # Check for placeholder text in question text
    for pattern in placeholder_patterns:
        if pattern.lower() in text.lower():
            add_issue('P0', qid, f'Question text contains PLACEHOLDER: "{pattern}"')
    
    # Check for truncated text (ends mid-sentence or mid-word)
    text_clean = text.strip()
    if text_clean and not text_clean[-1] in '.?!':
        # Check if it ends with a single letter (likely truncated)
        if len(text_clean) > 10 and text_clean[-2] == ' ' and text_clean[-1].isalpha():
            add_issue('P1', qid, f'Possibly TRUNCATED text: ends with "...{text_clean[-20:]})"')
    
    # Check for double spaces (sign of extraction issues)
    if '  ' in text:
        add_issue('P2', qid, 'Contains double spaces')
    
    # Check for unrendered subscript ("sub " as standalone word)
    if 'sub ' in text.lower() or ' sub ' in text.lower():
        add_issue('P1', qid, 'Contains unrendered subscript marker')
    
    # Check for page pollution
    pollution = ['GO ON TO THE NEXT PAGE', 'Unauthorized', 'MICROECONOMICS Section', 
                 'any part of this page is illegal']
    full_text = text + ' ' + ' '.join(opts.values())
    for p in pollution:
        if p in full_text:
            add_issue('P0', qid, f'Contains PAGE POLLUTION: "{p}"')

print(f'  P0: {len(issues["P0"])}, P1: {len(issues["P1"])}, P2: {len(issues["P2"])}')

# ============================================================================
# LAYER 3: IMAGE INTEGRITY (catch missing/broken/corrupted images)
# ============================================================================
print('=== LAYER 3: Image Integrity ===')

for q in questions:
    qid = q.get('question_id', 'UNKNOWN')
    
    if q.get('requires_graph') or q.get('has_graph'):
        img_paths = q.get('image_paths', [])
        
        if not img_paths:
            add_issue('P0', qid, 'has_graph=true but NO image_paths')
        else:
            for img_path in img_paths:
                # Resolve path
                if img_path.startswith('/'):
                    full_path = f'public{img_path}'
                else:
                    full_path = f'public/{img_path}'
                
                if not os.path.exists(full_path):
                    add_issue('P0', qid, f'Image NOT FOUND: {img_path}')
                else:
                    # Check image is valid (can be read)
                    try:
                        img = cv2.imread(full_path)
                        if img is None:
                            add_issue('P0', qid, f'Image CORRUPTED: {img_path}')
                        else:
                            h, w = img.shape[:2]
                            # Check for suspiciously small images (likely failed crop)
                            if h < 50 or w < 50:
                                add_issue('P1', qid, f'Image suspiciously small: {w}x{h}')
                            # Check for very large images (likely full page)
                            if h > 2000 or w > 2000:
                                add_issue('P2', qid, f'Image very large (may be full page): {w}x{h}')
                    except Exception as e:
                        add_issue('P0', qid, f'Image read error: {img_path} - {e}')

# Check for orphaned images (images not referenced by any question)
if os.path.exists(IMAGE_DIR):
    all_images = set(f for f in os.listdir(IMAGE_DIR) if f.endswith('.png'))
    referenced_images = set()
    for q in questions:
        for p in q.get('image_paths', []):
            referenced_images.add(os.path.basename(p))
    
    orphaned = all_images - referenced_images
    for img in orphaned:
        add_issue('P2', 'ORPHANED', f'Image not referenced by any question: {img}')

print(f'  P0: {len(issues["P0"])}, P1: {len(issues["P1"])}, P2: {len(issues["P2"])}')

# ============================================================================
# LAYER 4: LOGICAL CONSISTENCY (catch mismatched data structures)
# ============================================================================
print('=== LAYER 4: Logical Consistency ===')

for q in questions:
    qid = q.get('question_id', 'UNKNOWN')
    
    # option_table_data consistency
    if q.get('option_table_data'):
        table = q['option_table_data']
        headers = table.get('headers', [])
        rows = table.get('rows', {})
        
        if not headers:
            add_issue('P0', qid, 'option_table_data has empty headers')
        
        for opt_letter in ['A', 'B', 'C', 'D', 'E']:
            if opt_letter not in rows:
                add_issue('P0', qid, f'option_table_data missing row {opt_letter}')
            elif len(rows[opt_letter]) != len(headers):
                add_issue('P0', qid, f'option_table_data row {opt_letter} has {len(rows[opt_letter])} cells, expected {len(headers)}')
    
    # background_data consistency
    if q.get('background_data'):
        bg = q['background_data']
        if 'table' in bg:
            table = bg['table']
            if not table.get('headers'):
                add_issue('P1', qid, 'background_data.table has empty headers')
            if not table.get('rows'):
                add_issue('P1', qid, 'background_data.table has empty rows')
        if 'payoff_matrix' in bg:
            matrix = bg['payoff_matrix']
            if not matrix.get('players') or len(matrix['players']) != 2:
                add_issue('P1', qid, 'payoff_matrix missing or wrong player count')
    
    # pure_unit consistency
    has_secondary = bool(q.get('secondary_units'))
    is_pure = q.get('pure_unit', True)
    if has_secondary and is_pure:
        add_issue('P1', qid, f'pure_unit=true but has secondary_units: {q.get("secondary_units")}')
    elif not has_secondary and not is_pure:
        add_issue('P1', qid, 'pure_unit=false but no secondary_units')

print(f'  P0: {len(issues["P0"])}, P1: {len(issues["P1"])}, P2: {len(issues["P2"])}')

# ============================================================================
# LAYER 5: CROSS-VALIDATION WITH PDF (spot-check text against source)
# ============================================================================
print('=== LAYER 5: Cross-Validation with PDF (sample) ===')

pdf_map = {
    2012: 'AP Micro 2012.pdf',
    2013: 'AP Micro 2013.pdf',
    2014: 'AP Micro 2014.pdf',
    2015: 'AP Micro 2015.pdf',
    2016: 'AP Micro 2016.pdf',
    2017: 'AP_Microeconomics_2017_Full_Exam.pdf',
    2018: 'AP Micro 2018.pdf',
}

# Sample 5 questions per year for cross-validation
import random
random.seed(42)

for year in [2012, 2013, 2014, 2015, 2016, 2017, 2018]:
    year_questions = [q for q in questions if q['year'] == year]
    if not year_questions:
        continue
    
    sample = random.sample(year_questions, min(5, len(year_questions)))
    pdf_name = pdf_map.get(year)
    if not pdf_name or not os.path.exists(f'{PDF_DIR}/{pdf_name}'):
        add_issue('P1', f'YEAR{year}', f'PDF not found for cross-validation: {pdf_name}')
        continue
    
    doc = fitz.open(f'{PDF_DIR}/{pdf_name}')
    
    for q in sample:
        qid = q['question_id']
        q_num = q['question_number']
        
        # Find question in PDF
        found = False
        for page in doc:
            text = page.get_text()
            if f'{q_num}.' in text[:1000] or f' {q_num}.' in text:
                # Very basic check: first 10 words should match
                pdf_text_start = text[text.find(f'{q_num}.'):text.find(f'{q_num}.')+100]
                json_text_start = q['text'][:100]
                
                # Check if key words from JSON appear in PDF text
                json_words = set(json_text_start.lower().split()[:5])
                pdf_words = set(pdf_text_start.lower().split()[:10])
                overlap = json_words & pdf_words
                
                if len(overlap) < 2:  # Less than 2 words match
                    add_issue('P1', qid, f'PDF cross-validation FAILED: text mismatch with PDF')
                found = True
                break
        
        if not found:
            add_issue('P1', qid, f'PDF cross-validation FAILED: question not found in PDF')
    
    doc.close()

print(f'  P0: {len(issues["P0"])}, P1: {len(issues["P1"])}, P2: {len(issues["P2"])}')

# ============================================================================
# REPORT
# ============================================================================
print('\n' + '='*80)
print('AUDIT REPORT')
print('='*80)

for priority in ['P0', 'P1', 'P2']:
    count = len(issues[priority])
    print(f'\n{priority} Issues ({count} total):')
    
    # Group by issue type
    grouped = defaultdict(list)
    for issue in issues[priority]:
        # Extract issue type (text after first colon)
        if ':' in issue:
            qid, msg = issue.split(':', 1)
            # Categorize by first few words
            key = msg.strip().split(':')[0] if ':' in msg else msg.strip()[:40]
            grouped[key].append(qid)
    
    if count == 0:
        print('  None')
    else:
        for key, qids in sorted(grouped.items()):
            print(f'  {key}: {len(qids)} questions')
            if len(qids) <= 3:
                for qid in qids:
                    print(f'    - {qid}')
            else:
                print(f'    - {qids[0]}, {qids[1]}, ... (+{len(qids)-2} more)')

print('\n' + '='*80)
print(f'TOTAL: {len(issues["P0"])} P0, {len(issues["P1"])} P1, {len(issues["P2"])} P2')
print('='*80)

# Save full report
with open(f'{DATA_DIR}/audit_report.json', 'w', encoding='utf-8') as f:
    json.dump({
        'summary': {
            'P0': len(issues['P0']),
            'P1': len(issues['P1']),
            'P2': len(issues['P2']),
            'total_questions': len(questions)
        },
        'issues': issues
    }, f, indent=2, ensure_ascii=False)

print(f'\nFull report saved to: {DATA_DIR}/audit_report.json')
