# DEPRECATED: This script uses character-level two-column extraction which causes
# option truncation and text pollution. Use scripts/rebuild_micro_bank.py instead,
# which uses PyMuPDF block-based extraction for robust reading order.
import pdfplumber
import re
import json
import os
import sys

BASE_DIR = "D:/Lynk/翎英教育LynkEdu/真题/AP/Full_Exams/Microeconomics"
OUTPUT_DIR = "D:/Lynk/翎英教育LynkEdu/题库系统-web/ap-question-bank/public/data/ap/microeconomics/raw_extraction"

PDF_FILES = [
    ("AP Micro 2012.pdf", 2012),
    ("AP Micro 2013.pdf", 2013),
    ("AP Micro 2014.pdf", 2014),
    ("AP Micro 2015.pdf", 2015),
    ("AP Micro 2016.pdf", 2016),
    ("AP_Microeconomics_2016_Full_Exam.pdf", 2016),
    ("AP_Microeconomics_2017_Full_Exam.pdf", 2017),
    ("AP Micro 2018.pdf", 2018),
    # 扫描版，暂无法提取：("AP Micro 2017.pdf", 2017), ("AP Micro 2019.pdf", 2019)
]


def extract_two_columns(page):
    """Extract text from a two-column page."""
    chars = page.chars
    if not chars:
        return page.extract_text() or ""
    
    width = page.width
    mid_x = width / 2
    
    left_lines = {}
    right_lines = {}
    
    for char in chars:
        y = round(char['top'], 1)
        x = char['x0']
        text = char['text']
        
        if x < mid_x:
            if y not in left_lines:
                left_lines[y] = []
            left_lines[y].append((x, text))
        else:
            if y not in right_lines:
                right_lines[y] = []
            right_lines[y].append((x, text))
    
    left_text = ""
    for y in sorted(left_lines.keys()):
        chars_sorted = sorted(left_lines[y], key=lambda c: c[0])
        left_text += "".join(c[1] for c in chars_sorted) + "\n"
    
    right_text = ""
    for y in sorted(right_lines.keys()):
        chars_sorted = sorted(right_lines[y], key=lambda c: c[0])
        right_text += "".join(c[1] for c in chars_sorted) + "\n"
    
    return left_text + "\n" + right_text


def find_section_pages(pdf):
    """Find page ranges for Section I (MCQ) and Section II (FRQ)."""
    mcq_start = None
    mcq_end = None
    frq_start = None
    frq_end = None
    answer_key_page = None
    answer_key_end_page = None
    scoring_start = None
    
    for i, page in enumerate(pdf.pages):
        text = page.extract_text() or ""
        page_num = i + 1
        
        # Skip pages with no text (scanned images)
        if not text.strip():
            continue
        
        # Detect MCQ start: page with both "60 Questions" and time reference
        # Use more specific detection to avoid false positives from Contents pages
        has_60q = '60 Questions' in text
        has_time = ('70 minutes' in text or '1 hour and 10 minutes' in text) and 'Time' in text
        has_directions = 'Directions:' in text and 'Select' in text
        
        # True MCQ content page has multiple indicators
        if has_60q and has_time and has_directions and mcq_start is None:
            mcq_start = page_num
        
        # Detect FRQ start: must have specific FRQ time markers
        # Old format: "Planning time" + "Writing time"
        # New format: "Reading Period" + "Writing Period" + "Total Time—60 minutes"
        has_plan = 'Planning time' in text and '10 minutes' in text
        has_reading = 'Reading Period' in text and '10 minutes' in text
        has_write = 'Writing time' in text and '50 minutes' in text
        has_writing_period = 'Writing Period' in text and '50 minutes' in text
        has_frq_directions = 'Directions:' in text and 'free-response' in text.lower()
        has_total_time_60 = 'Total Time' in text and '60 minutes' in text
        has_at_glance = 'At a Glance' in text
        has_mcq_section = 'Section I: Multiple Choice' in text or 'Section I: Multiple-Choice' in text
        
        # Old format: Planning time + Writing time (must be after MCQ start)
        is_old_format = has_plan and has_write
        # New format: Reading Period + Writing Period + not an At a Glance page + not an MCQ section
        is_new_format = (has_reading and has_writing_period) or (has_total_time_60 and 'Section II' in text)
        is_new_format = is_new_format and not has_at_glance and not has_mcq_section
        
        is_after_mcq = (mcq_start is not None and page_num > mcq_start) or mcq_start is None
        
        if (is_old_format or is_new_format) and frq_start is None and is_after_mcq:
            frq_start = page_num
            if mcq_end is None and mcq_start is not None:
                mcq_end = page_num - 1
        
        # Detect answer key - more strict: must have actual answer content, not just a Contents reference
        # Skip if it's a Contents page or has instructions text
        if 'Contents' in text or 'Exam Instructions' in text or 'Student Answer Sheet' in text:
            pass  # Don't detect answer key on Contents pages
        elif ('Answer Key' in text or 'Multiple-Choice Answer Key' in text) and not has_frq_directions:
            if answer_key_page is None:
                answer_key_page = page_num
            answer_key_end_page = page_num
        
        # Detect scoring guidelines - must have actual question scoring content
        if ('SCORING GUIDELINES' in text or 'Scoring Guidelines' in text) and 'Question' in text:
            if scoring_start is None:
                scoring_start = page_num
            if frq_end is None and frq_start is not None:
                frq_end = page_num - 1
    
    # Final estimates if still not found
    if mcq_start and not mcq_end:
        if frq_start:
            mcq_end = frq_start - 1
        elif scoring_start:
            mcq_end = scoring_start - 1
        elif answer_key_page:
            mcq_end = answer_key_page - 1
        else:
            mcq_end = len(pdf.pages)
    
    if frq_start and not frq_end:
        if scoring_start:
            frq_end = scoring_start - 1
        elif answer_key_page:
            frq_end = answer_key_page - 1
        else:
            frq_end = len(pdf.pages)
    
    return {
        'mcq_start': mcq_start,
        'mcq_end': mcq_end,
        'frq_start': frq_start,
        'frq_end': frq_end,
        'answer_key_page': answer_key_page,
        'answer_key_end_page': answer_key_end_page,
        'scoring_start': scoring_start
    }


def extract_mcq_text(pdf, section_info):
    """Extract all MCQ text from the PDF pages."""
    mcq_text = ""
    if section_info['mcq_start'] and section_info['mcq_end']:
        for page_num in range(section_info['mcq_start'], section_info['mcq_end'] + 1):
            page = pdf.pages[page_num - 1]
            text = extract_two_columns(page)
            mcq_text += text + "\n"
    return mcq_text


def parse_answer_key(text):
    """Parse answer key from text. Supports multiple formats including two-column."""
    answers = {}
    normalized = re.sub(r'\s+', ' ', text)
    
    # Format 1: "Question 1: C" (common in 2013-2018 AP exams)
    pairs = re.findall(r'Question\s+(\d{1,2})\s*:\s*([A-E])', normalized)
    for q_num_str, ans in pairs:
        q_num = int(q_num_str)
        if 1 <= q_num <= 60:
            answers[q_num] = ans
    
    # Format 2: "1 C" (older format, or standalone answers)
    if not answers:
        pairs = re.findall(r'\b(\d{1,2})\s+([A-E])\b', normalized)
        for q_num_str, ans in pairs:
            q_num = int(q_num_str)
            if 1 <= q_num <= 60:
                answers[q_num] = ans
    
    return answers


def extract_answer_key(pdf, section_info):
    """Extract answer key from PDF."""
    if not section_info['answer_key_page']:
        return {}
    
    start_page = section_info['answer_key_page']
    end_page = section_info['answer_key_end_page'] or start_page
    
    text = ""
    for page_num in range(start_page, end_page + 1):
        if page_num <= len(pdf.pages):
            page = pdf.pages[page_num - 1]
            text += (page.extract_text() or "") + "\n"
    
    return parse_answer_key(text)


def split_into_questions(mcq_text):
    """Split MCQ text into individual questions."""
    # Remove header/footer lines
    lines = mcq_text.split('\n')
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Skip header/footer lines
        if any(skip in line for skip in [
            'MICROECONOMICS', 'Section I', 'Time', 'Questions', 'Directions:',
            'Unauthorized copying', 'GO ON TO THE NEXT PAGE', '-',
            'This is the multiple-choice', 'It includes cover material'
        ]):
            continue
        cleaned_lines.append(line)
    
    text = '\n'.join(cleaned_lines)
    
    # Find question positions
    # Pattern: question number at start of line, followed by text
    questions = []
    
    # Find all question positions, including at the start of the text
    positions = []
    for m in re.finditer(r'(?:^|\n)\s*(\d+)\.', text):
        positions.append((int(m.group(1)), m.start()))
    
    # Sort by question number
    positions.sort(key=lambda x: x[0])
    
    for i, (q_num, start) in enumerate(positions):
        end = positions[i + 1][1] if i + 1 < len(positions) else len(text)
        q_text = text[start:end].strip()
        
        # Remove the leading number and dot
        q_text = re.sub(r'^\d+\.', '', q_text).strip()
        
        questions.append({
            'num': q_num,
            'text': q_text
        })
    
    return questions


def parse_question(q_text):
    """Parse a single question text into body and options."""
    # Find options pattern (A) (B) (C) (D) (E)
    option_pattern = r'\(A\)(.*?)\(B\)(.*?)\(C\)(.*?)\(D\)(.*?)\(E\)(.*?)(?=\n\s*\d+\.|\Z)'
    match = re.search(option_pattern, q_text, re.DOTALL)
    
    if not match:
        # Try without the lookahead
        option_pattern2 = r'\(A\)(.*?)\(B\)(.*?)\(C\)(.*?)\(D\)(.*?)\(E\)(.*)'
        match = re.search(option_pattern2, q_text, re.DOTALL)
    
    if match:
        # Question body is everything before (A)
        body_end = q_text.find('(A)')
        body = q_text[:body_end].strip()
        
        options = {
            'A': match.group(1).strip(),
            'B': match.group(2).strip(),
            'C': match.group(3).strip(),
            'D': match.group(4).strip(),
            'E': match.group(5).strip()
        }
        
        # Clean up options - remove trailing text that might be from next question
        for k in options:
            options[k] = re.sub(r'\s+', ' ', options[k]).strip()
        
        return body, options
    
    return None, None


def extract_frq_text(pdf, section_info):
    """Extract FRQ section text."""
    frq_text = ""
    if section_info['frq_start'] and section_info['frq_end']:
        for page_num in range(section_info['frq_start'], section_info['frq_end'] + 1):
            page = pdf.pages[page_num - 1]
            text = extract_two_columns(page)
            frq_text += text + "\n"
    return frq_text


def extract_frq_scoring(pdf, section_info):
    """Extract FRQ scoring guidelines."""
    scoring_text = ""
    if section_info['scoring_start']:
        for page_num in range(section_info['scoring_start'], len(pdf.pages) + 1):
            page = pdf.pages[page_num - 1]
            text = page.extract_text() or ""
            scoring_text += text + "\n"
    return scoring_text


def parse_frq_questions(frq_text):
    """Parse FRQ text into individual questions."""
    # Remove header/footer
    lines = frq_text.split('\n')
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if any(skip in line for skip in [
            'MICROECONOMICS', 'Section II', 'Planning time', 'Writing time', 'Directions:',
            'Unauthorized copying', 'GO ON TO THE NEXT PAGE', '-',
            'This is the free-response', 'It includes cover material',
            'Additional answer page'
        ]):
            continue
        cleaned_lines.append(line)
    
    text = '\n'.join(cleaned_lines)
    
    # Find FRQ question numbers (1, 2, 3)
    questions = []
    
    # Pattern for FRQ questions
    positions = []
    for m in re.finditer(r'\n\s*(\d+)\.', text):
        q_num = m.group(1)
        if q_num in ['1', '2', '3']:
            positions.append((int(q_num), m.start()))
    
    # Also look for "Question 1 is reprinted" etc.
    for m in re.finditer(r'Question\s+(\d+)\s+is\s+reprinted', text):
        # Skip these - they're duplicates
        pass
    
    for i, (q_num, start) in enumerate(positions):
        end = positions[i + 1][1] if i + 1 < len(positions) else len(text)
        q_text = text[start:end].strip()
        
        # Remove the leading number
        q_text = re.sub(r'^\d+\.', '', q_text).strip()
        
        questions.append({
            'num': q_num,
            'text': q_text
        })
    
    return questions


def parse_frq_scoring(scoring_text):
    """Parse scoring guidelines text."""
    # Remove header/footer
    lines = scoring_text.split('\n')
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if any(skip in line for skip in [
            'Free-Response Scoring Guidelines', 'Unauthorized copying',
            'AP® MICROECONOMICS', 'SCORING GUIDELINES'
        ]):
            continue
        cleaned_lines.append(line)
    
    text = '\n'.join(cleaned_lines)
    
    # Find scoring for each question
    scoring = {}
    
    # Pattern: "Question 1" or "Question 2" etc.
    positions = []
    for m in re.finditer(r'Question\s+(\d+)', text):
        q_num = int(m.group(1))
        positions.append((q_num, m.start()))
    
    for i, (q_num, start) in enumerate(positions):
        end = positions[i + 1][1] if i + 1 < len(positions) else len(text)
        q_text = text[start:end].strip()
        scoring[q_num] = q_text
    
    return scoring


def process_pdf(filename, year):
    """Process a single PDF file."""
    pdf_path = os.path.join(BASE_DIR, filename)
    
    if not os.path.exists(pdf_path):
        print(f"  WARNING: File not found: {pdf_path}")
        return None
    
    print(f"Processing {filename} ({year})...")
    
    with pdfplumber.open(pdf_path) as pdf:
        # Find sections
        section_info = find_section_pages(pdf)
        print(f"  Section I: pages {section_info['mcq_start']}-{section_info['mcq_end']}")
        print(f"  Section II: pages {section_info['frq_start']}-{section_info['frq_end']}")
        print(f"  Answer Key: page {section_info['answer_key_page']}")
        print(f"  Scoring: page {section_info['scoring_start']}")
        
        # Extract MCQs
        mcq_text = extract_mcq_text(pdf, section_info)
        questions = split_into_questions(mcq_text)
        
        # Extract answers
        answers = extract_answer_key(pdf, section_info)
        
        # Parse questions
        mcqs = []
        for q in questions:
            body, options = parse_question(q['text'])
            if body and options:
                mcqs.append({
                    'question_num': q['num'],
                    'year': year,
                    'question': body,
                    'options': options,
                    'answer': answers.get(q['num'], ''),
                    'source': f'AP Micro {year}'
                })
        
        print(f"  Extracted {len(mcqs)} MCQs")
        
        # Extract FRQs
        frq_text = extract_frq_text(pdf, section_info)
        frq_questions = parse_frq_questions(frq_text)
        
        # Extract scoring
        scoring_text = extract_frq_scoring(pdf, section_info)
        scoring = parse_frq_scoring(scoring_text)
        
        frqs = []
        for q in frq_questions:
            frqs.append({
                'question_num': q['num'],
                'year': year,
                'question': q['text'],
                'scoring_guidelines': scoring.get(q['num'], ''),
                'source': f'AP Micro {year}'
            })
        
        print(f"  Extracted {len(frqs)} FRQs")
        
        return {
            'mcqs': mcqs,
            'frqs': frqs,
            'section_info': section_info
        }


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    all_mcqs = []
    all_frqs = []
    
    for filename, year in PDF_FILES:
        result = process_pdf(filename, year)
        if result:
            all_mcqs.extend(result['mcqs'])
            all_frqs.extend(result['frqs'])
    
    # Save extracted data
    mcq_output = os.path.join(OUTPUT_DIR, "all_mcqs_raw.json")
    with open(mcq_output, 'w', encoding='utf-8') as f:
        json.dump(all_mcqs, f, ensure_ascii=False, indent=2)
    
    frq_output = os.path.join(OUTPUT_DIR, "all_frqs_raw.json")
    with open(frq_output, 'w', encoding='utf-8') as f:
        json.dump(all_frqs, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*50}")
    print(f"Total MCQs extracted: {len(all_mcqs)}")
    print(f"Total FRQs extracted: {len(all_frqs)}")
    print(f"Saved to {OUTPUT_DIR}")


if __name__ == '__main__':
    main()
