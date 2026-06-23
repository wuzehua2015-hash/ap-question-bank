import json
import re
import os
import fitz  # pymupdf
from pathlib import Path

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

GRAPH_KEYWORDS = ['diagram above', 'graph above', 'graph below', 'the graph', 'the figure', 'in the diagram', 'in the graph', 'graph shows', 'figure shows', 'shown in the']


def normalize_text(text):
    """Replace control characters with spaces."""
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', ' ', text)
    return text


def load_classifications():
    with open(f'{OUT_DIR}/raw_extraction/all_mcqs_classified.json', encoding='utf-8') as f:
        mcq_data = json.load(f)
    with open(f'{OUT_DIR}/raw_extraction/all_frqs_classified.json', encoding='utf-8') as f:
        frq_data = json.load(f)

    mcq_map = {}
    for q in mcq_data:
        key = (str(q['year']), q['question_num'])
        mcq_map[key] = q.get('unit', 'U1')

    frq_map = {}
    for q in frq_data:
        key = (str(q['year']), q['question_num'])
        frq_map[key] = q.get('unit', 'U1')

    return mcq_map, frq_map


def clean_mcq_text(text):
    """Remove boilerplate from MCQ text."""
    text = re.sub(r'Unauthorized copying or reuse of\s+any part of this page is illegal\.', '', text)
    text = re.sub(r'GO ON TO THE NEXT PAGE\.', '', text)
    text = re.sub(r'GO ON TO THE NEXT PAGE', '', text)
    text = re.sub(r'-?\d+-', '', text)
    text = re.sub(r'© \d{4} The College Board\..*', '', text, flags=re.DOTALL)
    
    # Remove image description text (alt text from PDF) - long descriptions of figures/graphs
    # These are added to the end of the question text block by PDF accessibility tools
    text = re.sub(r'The figure shows.*?\n(?=\s*\d+\.|\n|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'The graph shows.*?\n(?=\s*\d+\.|\n|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'A figure shows.*?\n(?=\s*\d+\.|\n|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'The table shows.*?\n(?=\s*\d+\.|\n|$)', '', text, flags=re.DOTALL)
    
    return text


def parse_answer_key_block(page):
    """Parse answer key from a single page using block-based extraction."""
    answers = {}
    blocks = page.get_text('blocks')
    
    q_blocks = []  # (center_y, question_num, has_answer, answer)
    a_blocks = []  # (center_y, answer)
    
    for b in blocks:
        text = b[4].strip()
        if not text:
            continue
        y = (b[1] + b[3]) / 2
        x = (b[0] + b[2]) / 2
        
        # Match "Question X: A" or "Question X: A"
        match = re.search(r'Question\s+(\d{1,2})\s*[:#]\s*([A-E])', text)
        if match:
            q_blocks.append((y, int(match.group(1)), True, match.group(2)))
            continue
        
        # Match "Question X:" without answer
        match = re.search(r'Question\s+(\d{1,2})\s*[:#]', text)
        if match:
            q_blocks.append((y, int(match.group(1)), False, None))
            continue
        
        # Match standalone answer letter
        if re.match(r'^[A-E]$', text):
            a_blocks.append((y, text))
        
        # Match "X Y" format (e.g., "1 C" or "1\nC")
        match = re.search(r'^(\d{1,2})\s+([A-E])$', text)
        if match:
            q_blocks.append((y, int(match.group(1)), True, match.group(2)))
    
    # Match questions with answers
    for q_y, q_num, has_answer, ans in q_blocks:
        if has_answer:
            answers[q_num] = ans
        else:
            # Find closest answer block within y tolerance
            for a_y, a_ans in a_blocks:
                if abs(a_y - q_y) < 10:
                    answers[q_num] = a_ans
                    break
    
    return answers


def parse_answer_key_text(text):
    """Parse answer key from text using regex."""
    answers = {}
    pattern = r'(?:Question\s*)?(\d{1,2})\s*[:#]?\s*([A-E])'
    for match in re.finditer(pattern, text):
        num = int(match.group(1))
        ans = match.group(2)
        if 1 <= num <= 60:
            answers[num] = ans
    return answers


def parse_answer_key(page, text):
    """Parse answer key from a page. Try text first, then block-based to fill gaps."""
    answers = parse_answer_key_text(text)
    if len(answers) == 60:
        return answers
    # Use block-based extraction to fill in missing answers
    block_answers = parse_answer_key_block(page)
    answers.update(block_answers)
    return answers


def parse_mcqs(text, answers, page_map):
    """Parse MCQ questions from text."""
    text = clean_mcq_text(text)

    # Remove section header
    text = re.sub(r'MICROECONOMICS\s+Section I.*?answer sheet\.', '', text, flags=re.DOTALL)

    # Trim text after the MCQ section ends
    end_markers = ['END OF SECTION I', 'Answer Key', r'STOP\s+END OF EXAM', r'MICROECONOMICS\s+Section II']
    for marker in end_markers:
        match = re.search(marker, text)
        if match:
            text = text[:match.start()]
            break

    # Find all question starts
    q_starts = [(m.start(), m.end(), int(m.group(1))) for m in re.finditer(r'\n\s*(\d{1,2})\.\s+', text)]

    questions = []
    for i, (start_pos, end_pos, q_num) in enumerate(q_starts):
        if q_num > 60 or q_num < 1:
            continue

        if i + 1 < len(q_starts):
            next_start = q_starts[i+1][0]
            q_block = text[end_pos:next_start]
        else:
            q_block = text[end_pos:]

        # CRITICAL FIX: If q_block spans across columns, cut at column break
        # This prevents option E from matching text from the other column
        if '___COLUMN_BREAK___' in q_block:
            q_block = q_block.split('___COLUMN_BREAK___')[0]

        # Parse options using (A)...(B)...(C)...(D)...(E)... to end of block
        opt_pattern = r'\(A\)(.*?)\(B\)(.*?)\(C\)(.*?)\(D\)(.*?)\(E\)(.*?)$'
        match = re.search(opt_pattern, q_block, re.DOTALL)
        if not match:
            continue

        q_text = q_block[:match.start()].strip()

        # CRITICAL FIX: Remove image description text that leaks into question text
        # This happens when PDF alt-text gets mixed with the question text
        # Match "There is/are X figure(s)" where X can be digit or word
        q_text = re.sub(r'There (?:is|are) (?:\d+|one|two|three|four|five) figures?.*$', '', q_text, flags=re.DOTALL)
        q_text = re.sub(r'Figure \d+ shows.*?$', '', q_text, flags=re.DOTALL)
        q_text = re.sub(r'The figure shows.*?$', '', q_text, flags=re.DOTALL)
        q_text = re.sub(r'The graph shows.*?$', '', q_text, flags=re.DOTALL)
        q_text = re.sub(r'The table shows.*?$', '', q_text, flags=re.DOTALL)
        q_text = re.sub(r'A figure shows.*?$', '', q_text, flags=re.DOTALL)
        q_text = q_text.strip()

        opt_a = match.group(1).strip()
        opt_b = match.group(2).strip()
        opt_c = match.group(3).strip()
        opt_d = match.group(4).strip()
        opt_e = match.group(5).strip()

        # Clean up whitespace
        q_text = ' '.join(q_text.split())
        opt_a = ' '.join(opt_a.split())
        opt_b = ' '.join(opt_b.split())
        opt_c = ' '.join(opt_c.split())
        opt_d = ' '.join(opt_d.split())
        opt_e = ' '.join(opt_e.split())

        # Remove trailing pollution from options
        pollution_patterns = [
            r'\s*Questions?\s+\d+.*',
            r'\s*Unauthorized\s+copying.*',
            r'\s*GO\s+ON\s+TO\s+THE\s+NEXT\s+PAGE.*',
            r'\s*-\d+-.*',
            r'\s*MICROECONOMICS\s+Section.*',
            r'\s*END\s+OF\s+SECTION.*',
            r'\s*©\s+\d{4}\s+The\s+College\s+Board.*',
            r'\s*[A-Z][a-z\']+\s+Demand\s+\$.*',  # e.g., "Mark's Demand $12 $10..."
            r'\s*\d+\s+\d+\s+\d+\s+zero\s+point.*',  # table data like "4 4 1 zero point five..."
            r'\s*[\d\s\.]+c::.*',  # graph data
            r'\s*\(\.{2,}.*',  # ellipsis followed by data
            r'\s*\d{4,}\s+\d+\s+\(\..*',  # graph data like "8100 0 (.) ..."
            r'\s*\$\d+\s+\$\d+.*',  # price data like "$12 $10 $8..."
            r'\s*The figure shows.*',  # image description text
            r'\s*The graph shows.*',  # image description text
            r'\s*A figure shows.*',  # image description text
            r'\s*The table shows.*',  # image description text
        ]
        for pattern in pollution_patterns:
            opt_a = re.sub(pattern, '', opt_a, flags=re.IGNORECASE | re.DOTALL).strip()
            opt_b = re.sub(pattern, '', opt_b, flags=re.IGNORECASE | re.DOTALL).strip()
            opt_c = re.sub(pattern, '', opt_c, flags=re.IGNORECASE | re.DOTALL).strip()
            opt_d = re.sub(pattern, '', opt_d, flags=re.IGNORECASE | re.DOTALL).strip()
            opt_e = re.sub(pattern, '', opt_e, flags=re.IGNORECASE | re.DOTALL).strip()

        # Check if question references a graph
        has_graph = any(kw.lower() in q_text.lower() for kw in GRAPH_KEYWORDS)

        questions.append({
            'num': q_num,
            'text': q_text,
            'options': {'A': opt_a, 'B': opt_b, 'C': opt_c, 'D': opt_d, 'E': opt_e},
            'answer': answers.get(q_num, ''),
            'has_graph': has_graph,
            'page': page_map.get(q_num, None)
        })

    return questions


def clean_frq_text(text):
    """Clean FRQ text by removing boilerplate."""
    patterns = [
        r'Unauthorized copying or reuse of\s+any part of this page is illegal\.',
        r'GO ON TO THE NEXT PAGE\.',
        r'GO ON TO THE NEXT PAGE',
        r'Question \d+ is reprinted for your convenience\.',
        r'THIS PAGE MAY BE USED FOR TAKING NOTES.*?\n',
        r'NOTES WRITTEN ON THIS PAGE WILL NOT BE SCORED\.',
        r'WRITE ALL YOUR RESPONSES ON THE LINED PAGES\.',
        r'WRITE ALL YOUR RESPONSES ON THE LINED PAGES',
        r'ADDITIONAL PAGE FOR ANSWERING QUESTION \d+',
        r'ANSWER PAGE FOR QUESTION \d+',
        r'-?\d+-',
        r'MICROECONOMICS\s+Section II.*?(?=\n\s*\d+\.|STOP|END)',
        r'Directions: You have \d+ minutes to read all of the questions.*?(?=\n\s*\d+\.|STOP|END)',
        r'Planning time[—\-]\d+ minutes\s+Writing time[—\-]\d+ minutes',
        r'STOP\s+END OF EXAM.*',
        r'THE FOLLOWING INSTRUCTIONS APPLY TO THE COVERS OF THE SECTION II BOOKLET\..*',
        r'• MAKE SURE YOU HAVE COMPLETED THE IDENTIFICATION INFORMATION AS REQUESTED ON THE FRONT AND BACK COVERS OF THE SECTION II BOOKLET\.',
        r'• CHECK TO SEE THAT YOUR AP NUMBER LABEL APPEARS IN THE BOX\(ES\) ON THE COVER\(S\)\.',
        r'• MAKE SURE YOU HAVE USED THE SAME SET OF AP NUMBER LABELS ON ALL AP EXAMS YOU HAVE TAKEN THIS YEAR\.',
        r'© \d{4} The College Board\..*',
    ]
    for pattern in patterns:
        text = re.sub(pattern, '', text, flags=re.DOTALL)

    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def parse_frqs(text):
    """Parse FRQ questions from text."""
    text = clean_frq_text(text)

    questions = []
    q_matches = list(re.finditer(r'(?:^|\n)\s*(\d+)\.\s+', text))

    for i, match in enumerate(q_matches):
        q_num = int(match.group(1))
        start = match.end()
        if i + 1 < len(q_matches):
            end = q_matches[i+1].start()
        else:
            end = len(text)

        q_text = text[start:end].strip()
        q_text = re.sub(r'\n\s*(?:Answer|Section|STOP|END|Unauthorized|GO ON|©|The following contains|Key).*', '', q_text, flags=re.DOTALL).strip()

        questions.append({'num': q_num, 'text': q_text})

    return questions


def parse_scoring_guidelines(text):
    """Parse scoring guidelines from text."""
    # Remove scoring worksheet, conversion chart, and everything after it FIRST.
    # This is critical: if we remove "The College Board" globally with DOTALL first,
    # it will greedily match from the first occurrence (between Q1 and Q2) all the
    # way to the end of the document, deleting Q2 and Q3 entirely.
    text = re.sub(r'(?:\d{4}\s*AP\s*Microeconomics\s+)?Scoring\s+Worksheet.*', '', text, flags=re.DOTALL)
    text = re.sub(r'AP\s+Score\s+Conversion\s+Chart.*', '', text, flags=re.DOTALL)
    text = re.sub(r'Composite\s+Score.*', '', text, flags=re.DOTALL)
    text = re.sub(r'Question\s+Descriptors\s+and\s+Performance\s*Data.*', '', text, flags=re.DOTALL)
    text = re.sub(r'Multiple-Choice\s+Questions.*', '', text, flags=re.DOTALL)
    
    # Remove weighting formulas from worksheet
    text = re.sub(r'Question\s+\d+\s*[_\s]+×\s*\d+\.\d+\s*=\s*[_\s]+\s*\(out of \d+\)\s*\(Do not round\)', '', text)
    text = re.sub(r'Sum\s*=\s*[_\s]+Weighted\s+Section\s*II\s*Score.*', '', text, flags=re.DOTALL)
    
    # Remove global College Board boilerplate (footer from last page only)
    text = re.sub(r'The\s+College\s+Board\s+is\s+a\s+mission-driven.*', '', text, flags=re.DOTALL | re.IGNORECASE)
    # NOTE: Do NOT remove 'Visit the College Board on the Web' globally here.
    # It appears between each question's guidelines, so a global DOTALL removal
    # would greedily delete everything from Q1 to the end of the document.
    # We remove it per-question in the loop below instead.
    
    guidelines = {}
    q_matches = list(re.finditer(r'(?:AP\xae?\s+MICROECONOMICS\s+\d{4}\s+SCORING\s+GUIDELINES\s+)?Question\s+(\d+)', text))
    
    for i, match in enumerate(q_matches):
        q_num = int(match.group(1))
        start = match.start()
        if i + 1 < len(q_matches):
            end = q_matches[i+1].start()
        else:
            end = len(text)
        
        sg_text = text[start:end].strip()
        # Remove trailing copyright/boilerplate from each guideline individually
        sg_text = re.sub(r'©\s*\d{4}\s*The\s+College\s+Board\..*', '', sg_text, flags=re.DOTALL).strip()
        sg_text = re.sub(r'Visit\s+the\s+College\s+Board\s+on\s+the\s+Web.*', '', sg_text, flags=re.DOTALL).strip()
        # Only remove the scoring guidelines header if it appears at the START of the segment
        # (not greedily to the end). Use ^ to anchor at start of string.
        sg_text = re.sub(r'^AP\xae?\s+MICROECONOMICS\s+\d{4}\s+SCORING\s+GUIDELINES\s*\n?', '', sg_text, flags=re.MULTILINE).strip()
        
        # Merge with existing content if this question was already seen (e.g. "Question 1 (continued)")
        if q_num in guidelines:
            guidelines[q_num] += '\n' + sg_text
        else:
            guidelines[q_num] = sg_text
    
    return guidelines

def classify_pages(doc):
    """Classify each page of the PDF into sections."""
    pages = {
        'mcq': [],
        'answer_key': [],
        'frq': [],
        'scoring': [],
    }

    page_labels = {}

    for i in range(len(doc)):
        text = normalize_text(doc[i].get_text('text'))
        labels = []

        if 'SCORING GUIDELINES' in text and 'MICROECONOMICS' in text:
            labels.append('scoring')
        elif 'Answer Key' in text and 'Contents' not in text:
            # Check if page has actual answer patterns (multiple)
            matches = list(re.finditer(r'(?:Question\s*)?\d{1,2}\s*[:#]?\s*[A-E]', text))
            if len(matches) >= 3:
                labels.append('answer_key')
        elif 'MICROECONOMICS' in text and 'Section II' in text:
            labels.append('frq')
        elif 'MICROECONOMICS' in text and 'Section I' in text and ('60 Questions' in text or 'Directions:' in text):
            labels.append('mcq')
        elif re.search(r'\(A\)', text) and re.search(r'\d{1,2}\.\s+', text) and not re.search(r'Section II|Answer Key|SCORING', text):
            labels.append('maybe_mcq')
        elif re.search(r'(?:Question\s+\d+\s+is\s+reprinted|Additional answer page|ANSWER PAGE)', text):
            labels.append('maybe_frq')
        elif re.search(r'\n\s*\d+\.\s+', text) and not re.search(r'\(A\)', text) and not re.search(r'Answer Key|SCORING', text):
            labels.append('maybe_frq')

        page_labels[i] = labels

    # Find section start pages
    mcq_start = None
    frq_start = None
    answer_key_start = None
    scoring_start = None

    for i in range(len(doc)):
        labels = page_labels[i]
        if 'mcq' in labels and mcq_start is None:
            mcq_start = i
        if 'frq' in labels and frq_start is None:
            frq_start = i
        if 'answer_key' in labels and answer_key_start is None:
            answer_key_start = i
        if 'scoring' in labels and scoring_start is None:
            scoring_start = i

    # Build page ranges
    if mcq_start is not None:
        end = len(doc)
        for s in [frq_start, answer_key_start, scoring_start]:
            if s is not None and s > mcq_start:
                end = min(end, s)
        pages['mcq'] = list(range(mcq_start, end))
        for i in range(mcq_start, end):
            if 'maybe_mcq' in page_labels[i]:
                pages['mcq'].append(i)
        pages['mcq'] = sorted(set(pages['mcq']))

    if frq_start is not None:
        end = len(doc)
        for s in [answer_key_start, scoring_start]:
            if s is not None and s > frq_start:
                end = min(end, s)
        pages['frq'] = list(range(frq_start, end))
        for i in range(frq_start, end):
            if 'maybe_frq' in page_labels[i]:
                pages['frq'].append(i)
        pages['frq'] = sorted(set(pages['frq']))

    if answer_key_start is not None:
        end = len(doc)
        if scoring_start is not None and scoring_start > answer_key_start:
            end = scoring_start
        pages['answer_key'] = list(range(answer_key_start, end))

    if scoring_start is not None:
        pages['scoring'] = list(range(scoring_start, len(doc)))

    return pages


def extract_page_text(page, use_two_column=True):
    """Extract text from a page using block-based reading order.
    
    For two-column layouts (MCQ/FRQ), reads left column top-to-bottom, then right column.
    For single-column or header-in-right-column layouts (scoring guidelines), 
    use use_two_column=False to read by top-to-bottom, left-to-right order.
    """
    blocks = page.get_text('blocks')
    
    if not use_two_column:
        # Reading order: sort by y then x (top-to-bottom, left-to-right)
        sorted_blocks = sorted(blocks, key=lambda b: (b[1], b[0]))
        return '\n'.join([b[4] for b in sorted_blocks])
    
    mid_x = page.rect.width / 2
    
    left_blocks = []
    right_blocks = []
    for b in blocks:
        x = (b[0] + b[2]) / 2
        if x < mid_x:
            left_blocks.append(b)
        else:
            right_blocks.append(b)
    
    # Sort by y coordinate (top to bottom)
    left_sorted = sorted(left_blocks, key=lambda b: b[1])
    right_sorted = sorted(right_blocks, key=lambda b: b[1])
    
    left_text = '\n'.join([b[4] for b in left_sorted])
    right_text = '\n'.join([b[4] for b in right_sorted])
    
    return left_text + '\n___COLUMN_BREAK___\n' + right_text


def extract_from_pdf(year, pdf_path):
    """Extract all data from a single PDF."""
    doc = fitz.open(pdf_path)
    pages = classify_pages(doc)

    # Extract MCQ text and build page mapping using block-based two-column extraction
    mcq_text = ''
    page_map = {}
    for page_idx in pages['mcq']:
        text = normalize_text(extract_page_text(doc[page_idx]))
        # Skip pages without actual MCQ content
        if not re.search(r'\(A\)', text) and not re.search(r'\d{1,2}\.\s+', text):
            continue
        mcq_text += '\n' + text

        # Find question numbers on this page
        for match in re.finditer(r'\n\s*(\d{1,2})\.\s+', text):
            q_num = int(match.group(1))
            if 1 <= q_num <= 60 and q_num not in page_map:
                page_map[q_num] = page_idx

    # Extract answer key
    answers = {}
    for page_idx in pages['answer_key']:
        text = normalize_text(extract_page_text(doc[page_idx]))
        page_answers = parse_answer_key(doc[page_idx], text)
        answers.update(page_answers)

    # Extract FRQ text - clean each page individually before concatenating
    frq_text = ''
    seen_frq_nums = set()

    for page_idx in pages['frq']:
        text = normalize_text(extract_page_text(doc[page_idx]))

        # Skip pages with "Additional answer page" or "STOP" or "END OF EXAM"
        if re.search(r'Additional answer page', text) or re.search(r'STOP\s+END OF EXAM', text):
            continue

        # Skip reprints
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
            cleaned_text = clean_frq_text(text)
            frq_text += '\n' + cleaned_text
        else:
            # Page might be a continuation, but for AP exams questions are usually on separate pages
            pass

    # Extract scoring guidelines - use reading order (not two-column) because
    # scoring guideline headers (e.g. "AP MICROECONOMICS 2013 SCORING GUIDELINES Question 3")
    # sometimes appear in the right column at the top, while content is in the left column.
    # Two-column extraction would place the header AFTER the content, breaking parsing.
    scoring_text = ''
    for page_idx in pages['scoring']:
        scoring_text += '\n' + normalize_text(extract_page_text(doc[page_idx], use_two_column=False))

    # Parse
    mcqs = parse_mcqs(mcq_text, answers, page_map)
    frqs = parse_frqs(frq_text)
    scoring = parse_scoring_guidelines(scoring_text)

    doc.close()

    return mcqs, frqs, scoring, pages


def render_page(doc, page_idx, out_path, dpi=150):
    """Render a PDF page to PNG at given DPI."""
    page = doc[page_idx]
    pix = page.get_pixmap(dpi=dpi)
    pix.save(out_path)
    return os.path.exists(out_path) and os.path.getsize(out_path) > 1024


def render_page_image(doc, page_idx, out_path, dpi=200):
    """Render only the image region from a PDF page (for graph questions).
    
    Finds the largest image on the page and crops to that region.
    This avoids showing the entire page with other questions/text.
    """
    page = doc[page_idx]
    images = page.get_images(full=True)
    if not images:
        return render_page(doc, page_idx, out_path, dpi)
    
    image_rects = []
    for img in images:
        xref = img[0]
        rects = page.get_image_rects(xref)
        for rect in rects:
            image_rects.append(rect)
    
    if not image_rects:
        return render_page(doc, page_idx, out_path, dpi)
    
    # Use largest image (this is the main graph/figure)
    img_rect = max(image_rects, key=lambda r: r.width * r.height)
    
    zoom = dpi / 72
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(clip=img_rect, matrix=mat)
    pix.save(out_path)
    return os.path.exists(out_path) and os.path.getsize(out_path) > 1024


def main():
    mcq_map, frq_map = load_classifications()

    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(IMG_DIR_MCQ, exist_ok=True)
    os.makedirs(IMG_DIR_FRQ, exist_ok=True)

    all_mcqs = []
    all_frqs = []

    for year, pdf_path in PDFS.items():
        print(f'Processing {year}...')
        if not os.path.exists(pdf_path):
            print(f'  SKIP: {pdf_path} not found')
            continue

        mcqs, frqs, scoring, pages = extract_from_pdf(year, pdf_path)
        print(f'  MCQs: {len(mcqs)}, FRQs: {len(frqs)}, Scoring: {len(scoring)}')

        # Re-open doc for image rendering
        doc = fitz.open(pdf_path)

        # Fix missing page numbers and detect empty options
        for q in mcqs:
            if q['page'] is None:
                for page_idx in pages['mcq']:
                    text = normalize_text(extract_page_text(doc[page_idx]))
                    if re.search(rf'\n\s*{q["num"]}\.\s+', text):
                        q['page'] = page_idx
                        break
            # If any option is empty, mark as graph question (options embedded in image)
            if any(not v.strip() for v in q['options'].values()):
                q['has_graph'] = True

        # Render MCQ pages with graph questions
        rendered_mcq_pages = {}  # page_idx -> rel_path
        for q in mcqs:
            if q['has_graph'] and q['page'] is not None:
                page_idx = q['page']
                if page_idx in rendered_mcq_pages:
                    q['img_path'] = rendered_mcq_pages[page_idx]
                    continue

                img_name = f'{year}_page{page_idx+1}.png'
                img_path = os.path.join(IMG_DIR_MCQ, img_name)
                rel_path = f'images/micro/mcq/{img_name}'

                try:
                    if render_page_image(doc, page_idx, img_path, dpi=200):
                        rendered_mcq_pages[page_idx] = rel_path
                        q['img_path'] = rel_path
                    else:
                        q['has_graph'] = False
                except Exception as e:
                    print(f'  Error rendering MCQ page {page_idx+1}: {e}')
                    q['has_graph'] = False

        # Render all FRQ pages
        for page_idx in pages['frq']:
            img_name = f'{year}_page{page_idx+1}.png'
            img_path = os.path.join(IMG_DIR_FRQ, img_name)
            try:
                render_page(doc, page_idx, img_path)
            except Exception as e:
                print(f'  Error rendering FRQ page {page_idx+1}: {e}')

        # Fallback: render images for questions with empty options that still have no page
        for q in mcqs:
            if any(not v.strip() for v in q['options'].values()) and q['page'] is None:
                for page_idx in range(len(doc)):
                    text = normalize_text(doc[page_idx].get_text('text'))
                    if re.search(rf'\n\s*{q["num"]}\.\s+', text):
                        img_name = f'{year}_page{page_idx+1}.png'
                        img_path = os.path.join(IMG_DIR_MCQ, img_name)
                        rel_path = f'images/micro/mcq/{img_name}'
                        try:
                            if render_page_image(doc, page_idx, img_path, dpi=200):
                                q['img_path'] = rel_path
                                q['page'] = page_idx
                                break
                        except Exception as e:
                            print(f'  Error rendering fallback page {page_idx+1}: {e}')
                        break

        doc.close()

        # Build MCQ output
        for q in mcqs:
            key = (year, q['num'])
            unit = mcq_map.get(key, 'U1')

            img_paths = []
            if q.get('img_path'):
                img_paths.append(q['img_path'])

            all_mcqs.append({
                'question_id': f'{year}_Q{q["num"]:02d}',
                'year': year,
                'text': q['text'],
                'options': q['options'],
                'answer': q['answer'],
                'primary_unit': unit,
                'secondary_units': [],
                'topics': [],
                'difficulty': 'Medium',
                'has_graph': q['has_graph'] and len(img_paths) > 0,
                'image_paths': img_paths,
                'source': f'AP Micro {year}',
                'pure_unit': True,
                'classification_reasoning': 'From classified data' if key in mcq_map else f'Auto-classified to {unit}',
                'difficulty_source': 'inferred',
                'difficulty_score': 3,
                'skills': ['identify'],
                'requires_graph': False
            })

        # Build FRQ output
        for q in frqs:
            key = (year, q['num'])
            unit = frq_map.get(key, 'U1')
            sg = scoring.get(q['num'], '')

            # Extract scoring points
            points = []
            for line in sg.split('\n'):
                line = line.strip()
                if line.startswith('•') and ('point' in line.lower() or 'earned' in line.lower()):
                    points.append(line)

            total_points = 0
            tp_match = re.search(r'(\d+)\s*points?\s*\(', sg)
            if tp_match:
                total_points = int(tp_match.group(1))
            elif points:
                total_points = len(points)

            all_frqs.append({
                'question_id': f'{year}_FRQ{q["num"]}',
                'year': int(year),
                'question_number': q['num'],
                'text': q['text'],
                'source': f'AP Micro {year}',
                'primary_unit': unit,
                'secondary_units': [],
                'pure_unit': True,
                'difficulty': 'Hard',
                'topics': [],
                'answer': sg,
                'rubric': {
                    'total_points': total_points,
                    'points': points,
                    'scoring_guidelines': sg
                },
                'has_graph': False,
                'image_paths': [],
                'requires_graph': False
            })

    # Sort
    all_mcqs.sort(key=lambda x: (x['year'], int(x['question_id'].split('_Q')[1])))
    all_frqs.sort(key=lambda x: (x['year'], x['question_number']))

    # Save
    with open(f'{OUT_DIR}/question_bank.json', 'w', encoding='utf-8') as f:
        json.dump(all_mcqs, f, indent=2, ensure_ascii=False)

    with open(f'{OUT_DIR}/frq_bank.json', 'w', encoding='utf-8') as f:
        json.dump(all_frqs, f, indent=2, ensure_ascii=False)

    print(f'\nDone! MCQs: {len(all_mcqs)}, FRQs: {len(all_frqs)}')

    # Validation preview
    print('\nValidation preview:')
    errors = []
    seen_ids = set()
    for q in all_mcqs + all_frqs:
        qid = q.get('question_id', 'UNKNOWN')
        if not q.get('answer') and not q.get('rubric'):
            errors.append(f'{qid}: Missing answer')
        if not q.get('primary_unit'):
            errors.append(f'{qid}: Missing primary_unit')
        if not q.get('text'):
            errors.append(f'{qid}: Missing text')
        if qid in seen_ids:
            errors.append(f'Duplicate: {qid}')
        seen_ids.add(qid)
        if q.get('primary_unit') and q['primary_unit'] not in ['U1', 'U2', 'U3', 'U4', 'U5', 'U6']:
            errors.append(f'{qid}: Invalid unit {q["primary_unit"]}')

    if errors:
        print(f'Errors: {len(errors)}')
        for e in errors[:10]:
            print(f'  {e}')
    else:
        print('No validation errors found!')


if __name__ == '__main__':
    main()
