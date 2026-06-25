import fitz
import re
import json
import os
import sys

# PDF paths for each year
PDF_PATHS = {
    2012: 'D:/Lynk/翎英教育LynkEdu/真题/AP/Full_Exams/Microeconomics/AP Micro 2012.pdf',
    2013: 'D:/Lynk/翎英教育LynkEdu/真题/AP/Full_Exams/Microeconomics/AP Micro 2013.pdf',
    2014: 'D:/Lynk/翎英教育LynkEdu/真题/AP/Full_Exams/Microeconomics/AP Micro 2014.pdf',
    2015: 'D:/Lynk/翎英教育LynkEdu/真题/AP/Full_Exams/Microeconomics/AP Micro 2015.pdf',
    2016: 'D:/Lynk/翎英教育LynkEdu/真题/AP/Full_Exams/Microeconomics/AP Micro 2016.pdf',
    2017: 'D:/Lynk/翎英教育LynkEdu/真题/AP/Full_Exams/Microeconomics/AP_Microeconomics_2017_Full_Exam.pdf',
    2018: 'D:/Lynk/翎英教育LynkEdu/真题/AP/Full_Exams/Microeconomics/AP Micro 2018.pdf',
}

TOTAL_QUESTIONS = {2012: 60, 2013: 60, 2014: 60, 2015: 60, 2016: 60, 2017: 60, 2018: 60}


def find_mcq_pages(pdf_path):
    """Automatically find MCQ page range in a PDF."""
    pdf = fitz.open(pdf_path)
    mcq_pages = []

    for page_num in range(len(pdf)):
        page = pdf[page_num]
        text = get_page_text_with_blocks(page)
        cleaned = clean_page_text(text)
        if has_mcq_options(cleaned):
            mcq_pages.append(page_num)

    pdf.close()

    if not mcq_pages:
        return None, None

    return min(mcq_pages), max(mcq_pages) + 1


def has_mcq_options(text):
    """Check if page contains MCQ options (A)-(E)."""
    return '(A)' in text and '(E)' in text


def clean_page_text(text):
    """Remove PDF interference text."""
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if 'Unauthorized copying' in stripped:
            continue
        if 'GO ON TO THE NEXT PAGE' in stripped:
            continue
        if re.match(r'^-\d+-$', stripped):
            cleaned_lines.append('__NEWLINE__')
            continue
        if 'any part of this page is illegal' in stripped:
            continue
        cleaned_lines.append(line)

    text = '\n'.join(cleaned_lines)
    text = text.replace('__NEWLINE__', '\n')
    # Fix split question numbers like "4 7." → "47." but NOT "5\n2." (table data)
    # Only match when digits are separated by spaces/tabs (same line), not newlines
    text = re.sub(r'(?:^|\n)\s*(\d+)[ \t]+(\d)\s*\.', r'\n\1\2.', text)

    return text


def get_page_text_with_blocks(page):
    """Extract text from page using blocks, with two-column layout detection."""
    blocks = page.get_text('blocks')
    if not blocks:
        return page.get_text()

    # Collect all text blocks with coordinates
    text_blocks = []
    for block in blocks:
        x0, y0, x1, y1, text, block_no, block_type = block
        if text.strip():
            text_blocks.append((x0, y0, x1, y1, text))

    if not text_blocks:
        return ''

    # Detect two-column layout
    x_values = [b[0] for b in text_blocks]
    x_min = min(x_values)
    x_max = max(x_values)
    x_range = x_max - x_min
    x_mid = x_min + x_range * 0.5

    left_blocks = [b for b in text_blocks if b[0] < x_mid]
    right_blocks = [b for b in text_blocks if b[0] >= x_mid]

    # Check if both columns have substantial content with questions and/or options
    left_has_questions = sum(1 for b in left_blocks if re.search(r'(?:^|\n)\s*\d+\s*[\.\)]\s+', b[4])) >= 2
    right_has_questions = sum(1 for b in right_blocks if re.search(r'(?:^|\n)\s*\d+\s*[\.\)]\s+', b[4])) >= 2
    left_has_options = sum(1 for b in left_blocks if '(A)' in b[4] and '(E)' in b[4]) >= 1
    right_has_options = sum(1 for b in right_blocks if '(A)' in b[4] and '(E)' in b[4]) >= 1

    is_two_column = (
        len(left_blocks) > 5 and len(right_blocks) > 5 and
        left_has_questions and right_has_questions and
        (left_has_options or right_has_options)
    )

    if is_two_column:
        left_text = process_column_blocks(left_blocks)
        right_text = process_column_blocks(right_blocks)
        return left_text + '\n__COLUMN_BREAK__\n' + right_text
    else:
        return process_column_blocks(text_blocks)


def process_column_blocks(blocks):
    """Process blocks within a single column, preserving vertical order."""
    row_groups = {}
    for x0, y0, x1, y1, text in blocks:
        y_key = round(y0 / 5) * 5
        row_groups.setdefault(y_key, []).append((x0, text))

    sorted_rows = sorted(row_groups.items(), key=lambda x: x[0])
    lines = []
    for y, blocks_in_row in sorted_rows:
        blocks_in_row.sort(key=lambda x: x[0])
        for b in blocks_in_row:
            text = b[1].strip()
            if text:
                lines.append(text)
    return '\n'.join(lines)


def extract_mcqs_from_pdf(pdf_path, year, total_questions):
    """Extract all MCQs from a PDF using block-based coordinate extraction."""
    start_page, end_page = find_mcq_pages(pdf_path)
    if start_page is None:
        print(f"Warning: No MCQ pages found for {year}")
        return []

    print(f"{year}: MCQ pages {start_page+1} to {end_page}")

    pdf = fitz.open(pdf_path)
    pages = []
    for page_num in range(start_page, end_page):
        page = pdf[page_num]
        text = get_page_text_with_blocks(page)
        cleaned = clean_page_text(text)
        if has_mcq_options(cleaned):
            pages.append(cleaned)

    merged_text = '\n'.join(pages)
    questions = extract_questions_with_regex(merged_text, year)
    questions = handle_missing_questions(questions, merged_text, year, total_questions)

    pdf.close()
    return questions

    pdf.close()
    return questions


def extract_questions_with_regex(text, year):
    """Extract questions by pairing question numbers with option sequences."""
    # Handle two-column layout: split by column break and process each column separately
    if '__COLUMN_BREAK__' in text:
        columns = text.split('__COLUMN_BREAK__')
        all_questions = []
        for col_text in columns:
            col_text = col_text.strip()
            if not col_text:
                continue
            questions = extract_questions_from_single_column(col_text, year)
            all_questions.extend(questions)
        return all_questions

    return extract_questions_from_single_column(text, year)


def extract_questions_from_single_column(text, year):
    """Extract questions from a single column of text using two-step pairing."""
    questions = []

    # Find all question numbers at line start
    q_matches = list(re.finditer(r'(?:^|\n)\s*(\d+)\s*[\.\)]\s+', text))

    # Find all option sequences (A)-(E)
    option_sequences = []
    for m in re.finditer(r'(?:^|\n)\s*\(A\)\s*', text):
        a_pos = m.start()
        segment = text[a_pos:]
        b_match = re.search(r'(?:^|\n)\s*\(B\)\s*', segment)
        c_match = re.search(r'(?:^|\n)\s*\(C\)\s*', segment)
        d_match = re.search(r'(?:^|\n)\s*\(D\)\s*', segment)
        e_match = re.search(r'(?:^|\n)\s*\(E\)\s*', segment)

        if b_match and c_match and d_match and e_match:
            e_start = a_pos + e_match.end()
            next_a = re.search(r'(?:^|\n)\s*\(A\)\s*', text[e_start:])
            next_q = re.search(r'(?:^|\n)\s*\d+\s*[\.\)]\s+', text[e_start:])

            end_pos = len(text)
            if next_a:
                end_pos = min(end_pos, e_start + next_a.start())
            if next_q:
                end_pos = min(end_pos, e_start + next_q.start())

            option_sequences.append({'start': a_pos, 'end': end_pos})

    # Two-step pairing:
    # Step 1: Pair questions with close options (distance < threshold)
    # Step 2: Pair remaining questions with remaining options by order
    PROXIMITY_THRESHOLD = 1000  # characters
    
    paired_questions = set()
    paired_options = set()
    
    # Step 1: Pair close matches
    for i, seq in enumerate(option_sequences):
        opt_start = seq['start']
        best_q = None
        best_diff = float('inf')
        for qm in q_matches:
            q_num = int(qm.group(1))
            if q_num in paired_questions:
                continue
            q_start = qm.start()
            if q_start < opt_start:
                diff = opt_start - q_start
                if diff < best_diff:
                    best_diff = diff
                    best_q = qm
        if best_q and best_diff < PROXIMITY_THRESHOLD:
            q_num = int(best_q.group(1))
            paired_questions.add(q_num)
            paired_options.add(i)
            
            q_start = best_q.end()
            q_end = seq['start']
            q_text = text[q_start:q_end].strip()
            opt_segment = text[seq['start']:seq['end']]
            options = extract_options_from_segment(opt_segment)
            if options:
                options = clean_options(options)
                questions.append({
                    'question_id': f'{year}_Q{q_num}',
                    'question_number': q_num,
                    'question_text': q_text,
                    'options': options,
                    'options_as_table': is_table_options(options),
                    'group_reference': None,
                    'background_data': None,
                    'source_year': year,
                    'question_type': 'MCQ',
                    'difficulty': 'Medium',
                    'primary_unit': 'Unknown',
                    'topics': [],
                    'answer': '',
                })

    # Step 2: Pair remaining questions and options by order
    remaining_q = [qm for qm in q_matches if int(qm.group(1)) not in paired_questions]
    remaining_opt = [seq for i, seq in enumerate(option_sequences) if i not in paired_options]
    
    min_len = min(len(remaining_q), len(remaining_opt))
    for i in range(min_len):
        qm = remaining_q[i]
        seq = remaining_opt[i]
        q_num = int(qm.group(1))
        q_start = qm.end()
        q_end = seq['start']
        q_text = text[q_start:q_end].strip()
        opt_segment = text[seq['start']:seq['end']]
        options = extract_options_from_segment(opt_segment)
        if options:
            options = clean_options(options)
            questions.append({
                'question_id': f'{year}_Q{q_num}',
                'question_number': q_num,
                'question_text': q_text,
                'options': options,
                'options_as_table': is_table_options(options),
                'group_reference': None,
                'background_data': None,
                'source_year': year,
                'question_type': 'MCQ',
                'difficulty': 'Medium',
                'primary_unit': 'Unknown',
                'topics': [],
                'answer': '',
            })

    return questions


def extract_options_from_segment(segment):
    """Extract options A-E from a text segment with robust boundary detection."""
    options = {}

    for letter in ['A', 'B', 'C', 'D', 'E']:
        pattern = rf'\n\s*\({letter}\)\s*'
        m = re.search(pattern, segment)
        if not m:
            pattern = rf'\({letter}\)\s*'
            m = re.search(pattern, segment)

        if not m:
            return None

        opt_start = m.end()

        next_letter = chr(ord(letter) + 1)
        if next_letter <= 'E':
            next_pattern = rf'\n\s*\({next_letter}\)\s*'
            next_m = re.search(next_pattern, segment[opt_start:])
            if not next_m:
                next_pattern = rf'\({next_letter}\)\s*'
                next_m = re.search(next_pattern, segment[opt_start:])
            if next_m:
                opt_text = segment[opt_start:opt_start + next_m.start()].strip()
            else:
                opt_text = segment[opt_start:].strip()
        else:
            # For option E, check multiple boundary markers and use earliest
            boundary_pos = None
            
            next_a = re.search(r'\n\s*\(A\)\s*', segment[opt_start:])
            if next_a:
                boundary_pos = next_a.start()
            
            next_q = re.search(r'\n\s*\d+\s*[\.\)]\s+', segment[opt_start:])
            if next_q and (boundary_pos is None or next_q.start() < boundary_pos):
                boundary_pos = next_q.start()
            
            next_col = re.search(r'__COLUMN_BREAK__', segment[opt_start:])
            if next_col and (boundary_pos is None or next_col.start() < boundary_pos):
                boundary_pos = next_col.start()
            
            # Interference markers: table content, figure descriptions, question references
            interference_markers = [
                r'\n\s*Quantity\s+of',
                r'\n\s*Total\s+(?:Benefit|Cost)',
                r'\n\s*The figure shows a graph',
                r'\n\s*A graph with',
                r'\n\s*Questions?\s+\d+(?:-\d+)?\s+are based on',
                r'\n\s*A curved line labeled',
                r'\n\s*A straight line labeled',
                r'\n\s*Four lines appear',
                r'\n\s*Three lines appear',
                r'\n\s*Three curved lines appear',
                r'\n\s*Marginal\s+(?:Cost|Revenue|Benefit)',
                r'\n\s*Average\s+(?:Total|Variable|Fixed)\s+Cost',
                r'\n\s*Demand\s+(?:Curve|Line)',
                r'\n\s*Price\s*[,\n]',
                r'\n\s*Output\s*[,\n]',
                r'\n\s*Apples\s*[,\n]',
                r'\n\s*Benefit\s*[,\n]',
                r'\n\s*Pencils\s*[,\n]',
                r'\n\s*Books\s*[,\n]',
            ]
            
            for pattern in interference_markers:
                m_int = re.search(pattern, segment[opt_start:])
                if m_int and (boundary_pos is None or m_int.start() < boundary_pos):
                    boundary_pos = m_int.start()
            
            if boundary_pos is not None:
                opt_text = segment[opt_start:opt_start + boundary_pos].strip()
            else:
                opt_text = segment[opt_start:].strip()

        options[letter] = opt_text

    return options


def clean_options(options):
    """Remove pollution from options."""
    cleaned = {}
    for key, val in options.items():
        if not val:
            cleaned[key] = val
            continue

        lines = val.split('\n')
        clean_lines = []
        for line in lines:
            stripped = line.strip()
            if 'Unauthorized copying' in stripped:
                continue
            if 'any part of this page is illegal' in stripped:
                continue
            if 'GO ON TO THE NEXT PAGE' in stripped:
                continue
            if re.match(r'^-\d+-$', stripped):
                continue
            clean_lines.append(line)
        val = '\n'.join(clean_lines)

        val = re.sub(r'Questions?\s+\d+(?:-\d+)?\s+refer to.*', '', val, flags=re.DOTALL).strip()
        val = re.sub(r'END OF.*', '', val, flags=re.DOTALL).strip()
        val = re.sub(r'GO ON TO THE NEXT PAGE.*', '', val, flags=re.DOTALL).strip()
        val = re.sub(r'\n?\s*-\d+-\s*\n?', '\n', val).strip()

        # Remove trailing text that looks like another question start
        val = re.sub(r'(?:\s*\n\s*\d+\s*[\.\)]\s+.*)', '', val, flags=re.DOTALL).strip()
        # Remove trailing text that looks like another option (A) start
        val = re.sub(r'(?:\s*\n\s*\(A\)\s+.*)', '', val, flags=re.DOTALL).strip()

        # Remove table content
        val = re.sub(r'\n\s*Quantity\s+of.*', '', val, flags=re.DOTALL).strip()
        val = re.sub(r'\n\s*Total\s+(?:Benefit|Cost).*', '', val, flags=re.DOTALL).strip()
        val = re.sub(r'\n\s*Marginal\s+(?:Cost|Revenue|Benefit).*', '', val, flags=re.DOTALL).strip()
        val = re.sub(r'\n\s*Average\s+(?:Total|Variable|Fixed)\s+Cost.*', '', val, flags=re.DOTALL).strip()
        val = re.sub(r'\n\s*Price\s*[,\n].*', '', val, flags=re.DOTALL).strip()
        val = re.sub(r'\n\s*Output\s*[,\n].*', '', val, flags=re.DOTALL).strip()
        val = re.sub(r'\n\s*Apples\s*[,\n].*', '', val, flags=re.DOTALL).strip()
        val = re.sub(r'\n\s*Benefit\s*[,\n].*', '', val, flags=re.DOTALL).strip()
        
        # Remove figure descriptions
        val = re.sub(r'\n\s*The figure shows a graph.*', '', val, flags=re.DOTALL).strip()
        val = re.sub(r'\n\s*A graph with.*', '', val, flags=re.DOTALL).strip()
        val = re.sub(r'\n\s*A curved line labeled.*', '', val, flags=re.DOTALL).strip()
        val = re.sub(r'\n\s*A straight line labeled.*', '', val, flags=re.DOTALL).strip()
        val = re.sub(r'\n\s*Four lines appear.*', '', val, flags=re.DOTALL).strip()
        val = re.sub(r'\n\s*Three lines appear.*', '', val, flags=re.DOTALL).strip()
        val = re.sub(r'\n\s*Three curved lines appear.*', '', val, flags=re.DOTALL).strip()
        
        # Remove question reference prefixes
        val = re.sub(r'\n\s*Questions?\s+\d+(?:-\d+)?\s+are based on.*', '', val, flags=re.DOTALL).strip()
        
        # Remove column break marker
        val = re.sub(r'__COLUMN_BREAK__', '', val).strip()

        # Remove trailing incomplete sentence fragments
        val = re.sub(r'\.[\s\n]+([a-z][^\n]*)$', '.', val).strip()
        
        # Remove trailing short lowercase fragments (e.g., "selling pizza")
        lines = val.split('\n')
        if len(lines) > 1:
            last_line = lines[-1].strip()
            if len(last_line.split()) <= 3 and last_line and last_line[0].islower():
                first_word = last_line.split()[0].lower().strip('.,')
                if first_word in ['selling', 'producing', 'consuming', 'buying', 'using', 'because', 'such', 'which', 'that']:
                    val = '\n'.join(lines[:-1]).strip()

        # For option E, remove figure descriptions and question references
        # that appear on the same line (not caught by newline patterns)
        if key == 'E':
            # Find the first occurrence of a figure description or question reference
            fig_markers = ['The figure shows', 'A graph with', 'Questions? ', 'A curved line', 'A straight line', 'Four lines', 'Three lines', 'Three curved lines']
            for marker in fig_markers:
                pos = val.find(marker)
                if pos > 0:  # Must not be at the very beginning (to avoid false positives)
                    val = val[:pos].strip()
                    break
            
            # Remove trailing figure descriptions that start with a newline
            val = re.sub(r'\n\s*The figure shows.*', '', val, flags=re.DOTALL).strip()
            val = re.sub(r'\n\s*A graph with.*', '', val, flags=re.DOTALL).strip()
            val = re.sub(r'\n\s*A curved line.*', '', val, flags=re.DOTALL).strip()
            val = re.sub(r'\n\s*A straight line.*', '', val, flags=re.DOTALL).strip()

        # For all options, remove trailing table data or figure descriptions
        # that appear after the actual option text (multi-line pollution)
        lines = val.split('\n')
        clean_lines = [line.strip() for line in lines if line.strip()]
        
        if len(clean_lines) > 4:  # 5+ non-empty lines indicates possible pollution
            first_line = clean_lines[0]
            second_line = clean_lines[1] if len(clean_lines) > 1 else ''
            
            # Check if first line is a number (or dollar amount) - truncate to first line
            is_first_number = bool(re.match(r'^\d+$', first_line)) or bool(re.match(r'^\$\d+', first_line))
            
            if is_first_number:
                # First line is a number, truncate to first line
                val = first_line
            elif ' ' in first_line and second_line:
                # First line has spaces (is a sentence/phrase), check second line
                is_second_number = bool(re.match(r'^\d+$', second_line)) or bool(re.match(r'^\$\d+', second_line))
                is_second_header = len(second_line) < 25 and any(
                    word in second_line for word in ['Number', 'Total', 'Supply', 'Demand', 'Marginal', 'Average', 'Price', 'Quantity', 'Output', 'Workers', 'Product', 'Benefit', 'Cost']
                )
                
                if is_second_number or is_second_header:
                    val = first_line

        cleaned[key] = val

    return cleaned


def is_table_options(options):
    """Detect if options are in table format."""
    for key, val in options.items():
        if val and '|' in val:
            return True
        if val and '\n' in val:
            lines = val.split('\n')
            if len(lines) >= 2:
                avg_len = sum(len(l.strip()) for l in lines) / len(lines)
                if avg_len < 30:
                    return True
    return False


def handle_missing_questions(questions, text, year, total_questions):
    """Handle missing questions."""
    found_nums = {q['question_number'] for q in questions}
    missing = [n for n in range(1, total_questions + 1) if n not in found_nums]

    for missing_num in missing:
        q_text = find_question_in_text(text, missing_num)
        if q_text:
            options = extract_options_from_segment(q_text)
            if not options:
                options = {}
            else:
                options = clean_options(options)

            questions.append({
                'question_id': f'{year}_Q{missing_num}',
                'question_number': missing_num,
                'question_text': q_text.strip(),
                'options': options,
                'options_as_table': is_table_options(options),
                'group_reference': None,
                'background_data': None,
                'source_year': year,
                'question_type': 'MCQ',
                'difficulty': 'Medium',
                'primary_unit': 'Unknown',
                'topics': [],
                'answer': '',
            })

    return questions


def find_question_in_text(text, q_num):
    """Find question text for a given number."""
    patterns = [
        rf'(?:^|\n)\s*{q_num}\s*[\.\)]\s*(.*?)(?=\n\s*(?:\d+\s*[\.\)]|Questions?\s+\d+|$))',
    ]

    for pattern in patterns:
        m = re.search(pattern, text, re.DOTALL)
        if m:
            return m.group(1).strip()

    return None


def extract_answers_from_pdf(pdf_path, year, total_questions):
    """Extract answers from answer key pages anywhere in the PDF."""
    pdf = fitz.open(pdf_path)

    answer_text = ""
    for page_num in range(len(pdf)):
        text = pdf[page_num].get_text()
        normalized = re.sub(r'[\x07\x0b\x0c\x1c\x1d\x1e\x1f]', ' ', text)

        q_matches = list(re.finditer(r'Question\s+\d+\s*:\s*[A-E\s]', normalized))
        num_matches = list(re.finditer(r'(?:^|\n)\s*\d+\s*[\.\)]\s*[A-E]\s*(?:\n|$)', normalized))
        col_matches = list(re.finditer(r'(?:^|\n)\s*\d+\s+[A-E]\s+\d+\s+[A-E]', normalized))
        line_matches = list(re.finditer(r'(?:^|\n)\s*\d+\s+[A-E]\s*(?:\n|$)', normalized))

        if len(q_matches) >= 5 or len(num_matches) >= 5 or len(col_matches) >= 5 or len(line_matches) >= 5:
            answer_text += normalized + "\n"

    pdf.close()

    if not answer_text:
        return {}

    answers = {}

    for m in re.finditer(r'Question\s+(\d+)\s*:\s*([A-E]?)', answer_text):
        q_num = int(m.group(1))
        ans = m.group(2)
        if ans:
            answers[q_num] = ans

    for m in re.finditer(r'(?:^|\n)\s*(\d+)\s*[\.\)]\s*([A-E])\s*(?:\n|$)', answer_text):
        q_num = int(m.group(1))
        if q_num not in answers:
            answers[q_num] = m.group(2)

    for m in re.finditer(r'(?:^|\n)\s*(\d+)\s+([A-E])\s*(?:\n|$)', answer_text):
        q_num = int(m.group(1))
        if q_num not in answers:
            answers[q_num] = m.group(2)

    for m in re.finditer(r'(?:^|\n)\s*(\d+)\s+([A-E])\s+(\d+)\s+([A-E])', answer_text):
        q_num1 = int(m.group(1))
        q_num2 = int(m.group(3))
        answers[q_num1] = m.group(2)
        answers[q_num2] = m.group(4)

    return answers


def classify_questions(questions):
    """Classify questions by unit."""
    unit_keywords = {
        'U1': ['scarcity', 'opportunity cost', 'production possibilities', 'comparative advantage', 'absolute advantage', 'specialization', 'trade'],
        'U2': ['supply', 'demand', 'equilibrium', 'price elasticity', 'income elasticity', 'cross-price elasticity', 'consumer surplus', 'producer surplus', 'deadweight loss', 'tax', 'subsidy', 'tariff', 'quota'],
        'U3': ['production', 'cost', 'marginal cost', 'average cost', 'fixed cost', 'variable cost', 'total cost', 'profit', 'revenue', 'perfect competition', 'monopoly', 'monopolistic competition', 'oligopoly', 'market structure', 'barrier to entry', 'price discrimination', 'game theory', 'collusion', 'cartel', 'dominant strategy', 'nash equilibrium'],
        'U4': ['factor market', 'labor', 'wage', 'marginal product', 'marginal revenue product', 'monopsony', 'minimum wage', 'union', 'derived demand'],
        'U5': ['externality', 'public good', 'common resource', 'free rider', 'coase theorem', 'pigouvian tax', 'tragedy of the commons', 'positive externality', 'negative externality'],
        'U6': ['income distribution', 'gini coefficient', 'poverty', 'progressive tax', 'regressive tax', 'lorenz curve', 'quintile', 'transfer payment'],
    }

    for q in questions:
        text = q['question_text'].lower()
        scores = {unit: 0 for unit in unit_keywords}

        for unit, keywords in unit_keywords.items():
            for kw in keywords:
                if kw in text:
                    scores[unit] += 1

        for opt_text in q['options'].values():
            if opt_text:
                opt_lower = opt_text.lower()
                for unit, keywords in unit_keywords.items():
                    for kw in keywords:
                        if kw in opt_lower:
                            scores[unit] += 0.5

        best_unit = max(scores, key=scores.get)
        if scores[best_unit] > 0:
            q['primary_unit'] = best_unit
        else:
            q['primary_unit'] = 'U3'

        q['topics'] = [kw for kw in unit_keywords[best_unit] if kw in text]


if __name__ == '__main__':
    all_questions = []

    for year in [2012, 2013, 2014, 2015, 2016, 2017, 2018]:
        pdf_path = PDF_PATHS[year]
        total = TOTAL_QUESTIONS[year]

        questions = extract_mcqs_from_pdf(pdf_path, year, total)

        answers = extract_answers_from_pdf(pdf_path, year, total)
        for q in questions:
            if q['question_number'] in answers:
                q['answer'] = answers[q['question_number']]

        classify_questions(questions)

        all_questions.extend(questions)

        found = len(questions)
        missing = total - found
        with_answer = sum(1 for q in questions if q['answer'])
        print(f"{year}: {found}/{total} questions, {with_answer} with answers, {missing} missing")

    output_path = 'D:/Lynk/翎英教育LynkEdu/题库系统-web/ap-question-bank/public/data/ap/microeconomics/question_bank_v3.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_questions, f, indent=2, ensure_ascii=False)

    print(f"\nTotal: {len(all_questions)} questions saved to {output_path}")

    from collections import Counter
    units = Counter(q['primary_unit'] for q in all_questions)
    print(f"Unit distribution: {dict(units)}")
