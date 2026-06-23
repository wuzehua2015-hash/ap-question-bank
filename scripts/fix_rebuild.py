import re

import os
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
with open(os.path.join(BASE_DIR, 'scripts/rebuild_micro_bank.py'), 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Original file length: {len(content)}")

# 1. Fix parse_scoring_guidelines
old_scoring = '''def parse_scoring_guidelines(text):
    """Parse scoring guidelines from text."""
    # Remove weighting formulas, scoring worksheets, and College Board boilerplate
    text = re.sub(r'Question\s+\d+\s*[_\s]+×\s*\d+\.\d+\s*=\s*[_\s]+\s*\(out of \d+\)\s*\(Do not round\)', '', text)
    text = re.sub(r'Sum\s*=\s*[_\s]+Weighted\s+Section\s*II\s*Score.*', '', text, flags=re.DOTALL)
    text = re.sub(r'Composite\s*Score.*', '', text, flags=re.DOTALL)
    text = re.sub(r'AP\s+Score\s+Conversion\s+Chart.*', '', text, flags=re.DOTALL)
    text = re.sub(r'The\s+College\s+Board.*', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'©\s*\d{4}\s*The\s+College\s+Board.*', '', text, flags=re.DOTALL)
    text = re.sub(r'\d{4}\s*AP\s*Microeconomics\s*Scoring\s*Worksheet.*', '', text, flags=re.DOTALL)
    text = re.sub(r'Question\s+Descriptors\s+and\s+Performance\s*Data.*', '', text, flags=re.DOTALL)
    text = re.sub(r'Multiple-Choice\s+Questions.*', '', text, flags=re.DOTALL)
    text = re.sub(r'Visit\s+the\s+College\s+Board\s+on\s+the\s+Web.*', '', text, flags=re.DOTALL)

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
        sg_text = re.sub(r'©\s*\d{4}\s*The\s+College\s+Board\..*', '', sg_text, flags=re.DOTALL).strip()

        guidelines[q_num] = sg_text

    return guidelines'''

new_scoring = '''def parse_scoring_guidelines(text):
    """Parse scoring guidelines from text."""
    # Remove scoring worksheet, conversion chart, and everything after it FIRST.
    text = re.sub(r'(?:\d{4}\s*AP\s*Microeconomics\s+)?Scoring\s+Worksheet.*', '', text, flags=re.DOTALL)
    text = re.sub(r'AP\s+Score\s+Conversion\s+Chart.*', '', text, flags=re.DOTALL)
    text = re.sub(r'Composite\s+Score.*', '', text, flags=re.DOTALL)
    text = re.sub(r'Question\s+Descriptors\s+and\s+Performance\s*Data.*', '', text, flags=re.DOTALL)
    text = re.sub(r'Multiple-Choice\s+Questions.*', '', text, flags=re.DOTALL)
    text = re.sub(r'Question\s+\d+\s*[_\s]+×\s*\d+\.\d+\s*=\s*[_\s]+\s*\(out of \d+\)\s*\(Do not round\)', '', text)
    text = re.sub(r'Sum\s*=\s*[_\s]+Weighted\s+Section\s*II\s*Score.*', '', text, flags=re.DOTALL)
    text = re.sub(r'The\s+College\s+Board\s+is\s+a\s+mission-driven.*', '', text, flags=re.DOTALL | re.IGNORECASE)
    
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
        sg_text = re.sub(r'©\s*\d{4}\s*The\s+College\s+Board\..*', '', sg_text, flags=re.DOTALL).strip()
        sg_text = re.sub(r'Visit\s+the\s+College\s+Board\s+on\s+the\s+Web.*', '', sg_text, flags=re.DOTALL).strip()
        sg_text = re.sub(r'^AP\xae?\s+MICROECONOMICS\s+\d{4}\s+SCORING\s+GUIDELINES\s*\n?', '', sg_text, flags=re.MULTILINE).strip()
        
        if q_num in guidelines:
            guidelines[q_num] += '\n' + sg_text
        else:
            guidelines[q_num] = sg_text
    
    return guidelines'''

if old_scoring in content:
    content = content.replace(old_scoring, new_scoring)
    print('OK: parse_scoring_guidelines fixed')
else:
    print('FAIL: parse_scoring_guidelines not found')

# 2. Fix extract_page_text
old_extract = '''def extract_page_text(page):
    """Extract text from a two-column page using block-based reading order."""
    blocks = page.get_text('blocks')
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
    
    return left_text + '\n' + right_text'''

new_extract = '''def extract_page_text(page, use_two_column=True):
    """Extract text from a page using block-based reading order.
    
    For two-column layouts (MCQ/FRQ), reads left column top-to-bottom, then right column.
    For single-column or header-in-right-column layouts (scoring guidelines), 
    use use_two_column=False to read by top-to-bottom, left-to-right order.
    """
    blocks = page.get_text('blocks')
    
    if not use_two_column:
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
    
    left_sorted = sorted(left_blocks, key=lambda b: b[1])
    right_sorted = sorted(right_blocks, key=lambda b: b[1])
    
    left_text = '\n'.join([b[4] for b in left_sorted])
    right_text = '\n'.join([b[4] for b in right_sorted])
    
    return left_text + '\n___COLUMN_BREAK___\n' + right_text'''

if old_extract in content:
    content = content.replace(old_extract, new_extract)
    print('OK: extract_page_text fixed')
else:
    print('FAIL: extract_page_text not found')

# 3. Fix clean_mcq_text
old_clean = '''def clean_mcq_text(text):
    """Remove boilerplate from MCQ text."""
    text = re.sub(r'Unauthorized copying or reuse of\s+any part of this page is illegal\.', '', text)
    text = re.sub(r'GO ON TO THE NEXT PAGE\.', '', text)
    text = re.sub(r'GO ON TO THE NEXT PAGE', '', text)
    text = re.sub(r'-?\d+-', '', text)
    text = re.sub(r'© \d{4} The College Board\..*', '', text, flags=re.DOTALL)
    return text'''

new_clean = '''def clean_mcq_text(text):
    """Remove boilerplate from MCQ text."""
    text = re.sub(r'Unauthorized copying or reuse of\s+any part of this page is illegal\.', '', text)
    text = re.sub(r'GO ON TO THE NEXT PAGE\.', '', text)
    text = re.sub(r'GO ON TO THE NEXT PAGE', '', text)
    text = re.sub(r'-?\d+-', '', text)
    text = re.sub(r'© \d{4} The College Board\..*', '', text, flags=re.DOTALL)
    
    # Remove image description text (alt text from PDF) - long descriptions of figures/graphs
    text = re.sub(r'The figure shows.*?\n(?=\s*\d+\.|\n|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'The graph shows.*?\n(?=\s*\d+\.|\n|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'A figure shows.*?\n(?=\s*\d+\.|\n|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'The table shows.*?\n(?=\s*\d+\.|\n|$)', '', text, flags=re.DOTALL)
    
    return text'''

if old_clean in content:
    content = content.replace(old_clean, new_clean)
    print('OK: clean_mcq_text fixed')
else:
    print('FAIL: clean_mcq_text not found')

# 4. Fix parse_mcqs - add column break handling and image description patterns
old_parse_mcqs = '''        # Remove trailing pollution from options
        pollution_patterns = [
            r'\s*Questions?\s+\d+.*',
            r'\s*Unauthorized\s+copying.*',
            r'\s*GO\s+ON\s+TO\s+THE\s+NEXT\s+PAGE.*',
            r'\s*-?\d+-.*',
            r'\s*MICROECONOMICS\s+Section.*',
            r'\s*END\s+OF\s+SECTION.*',
            r'\s*©\s+\d{4}\s*The\s+College\s+Board.*',
            r'\s*[A-Z][a-z\']+\s+Demand\s+\$.*',  # e.g., "Mark's Demand $12 $10..."
            r'\s*\d+\s+\d+\s+\d+\s+zero\s+point.*',  # table data like "4 4 1 zero point five..."
            r'\s*[\d\s\.]+c::.*',  # graph data
            r'\s*\(\.{2,}.*',  # ellipsis followed by data
            r'\s*\d{4,}\s+\d+\s+\(\..*',  # graph data like "8100 0 (.) ..."
            r'\s*\$\d+\s+\$\d+.*',  # price data like "$12 $10 $8..."
        ]'''

new_parse_mcqs = '''        # Remove trailing pollution from options
        pollution_patterns = [
            r'\s*Questions?\s+\d+.*',
            r'\s*Unauthorized\s+copying.*',
            r'\s*GO\s+ON\s+TO\s+THE\s+NEXT\s+PAGE.*',
            r'\s*-?\d+-.*',
            r'\s*MICROECONOMICS\s+Section.*',
            r'\s*END\s+OF\s+SECTION.*',
            r'\s*©\s+\d{4}\s*The\s+College\s+Board.*',
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
        ]'''

if old_parse_mcqs in content:
    content = content.replace(old_parse_mcqs, new_parse_mcqs)
    print('OK: parse_mcqs pollution patterns updated')
else:
    print('FAIL: parse_mcqs pollution patterns not found')

# 5. Add column break handling in parse_mcqs
old_qblock = '''        if i + 1 < len(q_starts):
            next_start = q_starts[i+1][0]
            q_block = text[end_pos:next_start]
        else:
            q_block = text[end_pos:]

        # Parse options using (A)...(B)...(C)...(D)...(E)... to end of block'''

new_qblock = '''        if i + 1 < len(q_starts):
            next_start = q_starts[i+1][0]
            q_block = text[end_pos:next_start]
        else:
            q_block = text[end_pos:]

        # CRITICAL FIX: If q_block spans across columns, cut at column break
        # This prevents option E from matching text from the other column
        if '___COLUMN_BREAK___' in q_block:
            q_block = q_block.split('___COLUMN_BREAK___')[0]

        # Parse options using (A)...(B)...(C)...(D)...(E)... to end of block'''

if old_qblock in content:
    content = content.replace(old_qblock, new_qblock)
    print('OK: parse_mcqs column break handling added')
else:
    print('FAIL: parse_mcqs qblock not found')

# 6. Add render_page_image function
old_render = '''def render_page(doc, page_idx, out_path, dpi=150):
    """Render a PDF page to PNG at given DPI."""
    page = doc[page_idx]
    pix = page.get_pixmap(dpi=dpi)
    pix.save(out_path)
    return os.path.exists(out_path) and os.path.getsize(out_path) > 1024'''

new_render = '''def render_page(doc, page_idx, out_path, dpi=150):
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
    return os.path.exists(out_path) and os.path.getsize(out_path) > 1024'''

if old_render in content:
    content = content.replace(old_render, new_render)
    print('OK: render_page_image added')
else:
    print('FAIL: render_page not found')

# 7. Update MCQ rendering to use render_page_image
old_mcq_render = '''        # Render MCQ pages with graph questions
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
                    if render_page(doc, page_idx, img_path):
                        rendered_mcq_pages[page_idx] = rel_path
                        q['img_path'] = rel_path
                    else:
                        q['has_graph'] = False
                except Exception as e:
                    print(f'  Error rendering MCQ page {page_idx+1}: {e}')
                    q['has_graph'] = False'''

new_mcq_render = '''        # Render MCQ pages with graph questions - crop to image region only
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
                    q['has_graph'] = False'''

if old_mcq_render in content:
    content = content.replace(old_mcq_render, new_mcq_render)
    print('OK: MCQ rendering updated to use image cropping')
else:
    print('FAIL: MCQ rendering not found')

# 8. Update fallback rendering
old_fallback = '''        # Fallback: render images for questions with empty options that still have no page
        for q in mcqs:
            if any(not v.strip() for v in q['options'].values()) and q['page'] is None:
                for page_idx in range(len(doc)):
                    text = normalize_text(doc[page_idx].get_text('text'))
                    if re.search(rf'\n\s*{q["num"]}\.\s+', text):
                        img_name = f'{year}_page{page_idx+1}.png'
                        img_path = os.path.join(IMG_DIR_MCQ, img_name)
                        rel_path = f'images/micro/mcq/{img_name}'
                        try:
                            if render_page(doc, page_idx, img_path):
                                q['img_path'] = rel_path
                                q['page'] = page_idx
                                break
                        except Exception as e:
                            print(f'  Error rendering fallback page {page_idx+1}: {e}')
                        break'''

new_fallback = '''        # Fallback: render images for questions with empty options that still have no page
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
                        break'''

if old_fallback in content:
    content = content.replace(old_fallback, new_fallback)
    print('OK: Fallback rendering updated')
else:
    print('FAIL: Fallback rendering not found')

# 9. Update scoring text extraction to use reading order
old_scoring_extract = '''    # Extract scoring guidelines
    scoring_text = ''
    for page_idx in pages['scoring']:
        scoring_text += '\n' + normalize_text(extract_page_text(doc[page_idx]))'''

new_scoring_extract = '''    # Extract scoring guidelines - use reading order (not two-column) because
    # scoring guideline headers may appear in right column while content is in left
    scoring_text = ''
    for page_idx in pages['scoring']:
        scoring_text += '\n' + normalize_text(extract_page_text(doc[page_idx], use_two_column=False))'''

if old_scoring_extract in content:
    content = content.replace(old_scoring_extract, new_scoring_extract)
    print('OK: Scoring text extraction updated')
else:
    print('FAIL: Scoring text extraction not found')

with open(os.path.join(BASE_DIR, 'scripts/rebuild_micro_bank.py'), 'w', encoding='utf-8') as f:
    f.write(content)

print(f'\nFinal file length: {len(content)}')
print('Done!')
