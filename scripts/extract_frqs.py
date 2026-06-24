#!/usr/bin/env python3
"""Extract FRQ data from AP Microeconomics PDFs (2012-2018)."""
import fitz, re, json
from pathlib import Path
from collections import defaultdict

PDF_DIR = Path("D:/Lynk/翎英教育LynkEdu/真题/AP/Full_Exams/Microeconomics")
OUT_DIR = Path("D:/Lynk/翎英教育LynkEdu/题库系统-web/ap-question-bank/public/data/ap/microeconomics")
IMG_OUT = Path("D:/Lynk/翎英教育LynkEdu/题库系统-web/ap-question-bank/public/images/micro/frq")

# Year-specific PDF mappings and FRQ page ranges
# Format: {year: (pdf_filename, frq_start_page, frq_end_page, scoring_start_page)}
# Pages are 1-indexed
YEAR_CONFIG = {
    2012: ('AP Micro 2012.pdf', 40, 50, 53),
    2013: ('AP Micro 2013.pdf', 35, 50, 53),
    2014: ('AP Micro 2014.pdf', 24, 38, 42),
    2015: ('AP Micro 2015.pdf', 35, 50, 53),
    2016: ('AP Micro 2016.pdf', 35, 50, 53),
    2017: ('AP_Microeconomics_2017_Full_Exam.pdf', 35, 49, 53),
    2018: ('AP Micro 2018.pdf', 28, 43, 47),
}

def clean_text(text):
    """Remove pollution from extracted text."""
    # Remove control characters (except newlines)
    text = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]', ' ', text)
    # Remove headers/footers
    text = re.sub(r'Unauthorized copying or reuse of\s+any part of this page is illegal\.', '', text)
    text = re.sub(r'GO ON TO THE NEXT PAGE\.?', '', text)
    text = re.sub(r'-?\d+-', '', text)
    # CRITICAL FIX: Do NOT use DOTALL for copyright removal - it deletes too much
    text = re.sub(r'© \d{4} The College Board\..*', '', text)
    text = re.sub(r'Visit the College Board on the Web: www\.collegeboard\.org', '', text)
    text = re.sub(r'AP\s*®\s*MICROECONOMICS\s+\d{4}\s+SCORING GUIDELINES', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Question\s+\d+\s+\(\s*continued\s*\)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Question\s+\d+\s+is\s+reprinted\s+for\s+your\s+convenience', '', text, flags=re.IGNORECASE)
    # Remove answer pages and additional pages (student response pages, not questions)
    text = re.sub(r'Additional answer page for Question \d+\.?', '', text, flags=re.IGNORECASE)
    text = re.sub(r'ANSWER PAGE FOR QUESTION \d+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'ADDITIONAL PAGE FOR ANSWERING QUESTION \d+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'THIS PAGE MAY BE USED FOR TAKING NOTES AND PLANNING YOUR ANSWERS\..*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'NOTES WRITTEN ON THIS PAGE WILL NOT BE SCORED\.', '', text)
    text = re.sub(r'WRITE ALL YOUR RESPONSES ON THE LINED PAGES\.', '', text)
    # Remove extra whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def extract_frqs_from_pages(doc, start_page, end_page, year):
    """Extract individual FRQ questions from page range."""
    full_text = ''
    for i in range(start_page - 1, end_page - 1):  # 0-indexed
        full_text += doc[i].get_text() + '\n'
    
    full_text = clean_text(full_text)
    
    # Split into individual questions
    # AP FRQ format: "1. ... (a) ... (b) ..." or "1. ... (i) ... (ii) ..."
    questions = []
    
    # Find question boundaries - match "1. " at start of line
    q_pattern = r'(?:^|\n)\s*(\d+)\s*\.\s*(.*?)(?=\n\s*\d+\s*\.|\Z)'
    matches = list(re.finditer(q_pattern, full_text, re.DOTALL))
    
    for match in matches:
        q_num = int(match.group(1))
        q_text = match.group(2).strip()
        
        if q_num <= 3 and len(q_text) > 200:  # AP Micro has 3 FRQs
            questions.append({
                'question_id': f"{year}_FRQ{q_num}",
                'year': year,
                'question_num': q_num,
                'text': q_text,
                'primary_unit': 'U1',  # Will be classified later
                'topics': [],
                'difficulty': 'Medium',
                'image_paths': [],
                'source': f"AP Micro {year}",
                'has_graph': False,  # Will be updated
                'rubric': ''  # Will be filled from scoring guidelines
            })
    
    return questions

def extract_scoring_guidelines(doc, scoring_start_page, year):
    """Extract scoring guidelines for each FRQ.
    
    CRITICAL FIX: Handles control characters (\x07) used in some years (e.g., 2018)
    as separators between "Question" and the number. Also stops at 
    "Scoring Worksheet" or "Question Descriptors" to avoid pulling in garbage.
    """
    full_text = ''
    for i in range(scoring_start_page - 1, len(doc)):
        text = doc[i].get_text()
        # Stop before scoring worksheet or question descriptors
        if 'Scoring Worksheet' in text or 'Question Descriptors' in text:
            break
        full_text += text + '\n'
    
    full_text = clean_text(full_text)
    
    # CRITICAL FIX: Use a more flexible pattern that matches:
    # - "Question 1" (space)
    # - "Question\x071\x07" (control chars used in 2018)
    # - "Question\t3\t" (tabs used in some years)
    # And stop at the next question or end of text
    rubrics = {}
    q_pattern = r'Question[\s\x07\t]+(\d+)[\s\x07\t]*(.*?)(?=Question[\s\x07\t]+\d+[\s\x07\t]*|\Z)'
    matches = re.finditer(q_pattern, full_text, re.DOTALL)
    
    for match in matches:
        q_num = int(match.group(1))
        rubric_text = match.group(2).strip()
        # Clean up the rubric further
        rubric_text = re.sub(r'\s+', ' ', rubric_text)
        rubric_text = re.sub(r'\n\s*\n', '\n\n', rubric_text)
        rubric_text = rubric_text.strip()
        if rubric_text:
            rubrics[q_num] = rubric_text
    
    return rubrics

def extract_images_for_frq(doc, frq_start_page, frq_end_page, year, q_num):
    """Extract images from FRQ pages.
    
    Strategy:
    1. For each page in the FRQ section, extract all images above a minimum size
    2. Name them by year and question number
    3. Return relative paths for the JSON
    
    Note: FRQ questions span multiple pages, and we can't easily determine which
    image belongs to which question without analyzing the page text. We use a
    simple heuristic: assign images to the question based on the page they appear on
    and the order of questions.
    """
    img_paths = []
    
    # Calculate approximate page range for this specific question
    # Each FRQ typically takes 1-2 pages, so we distribute evenly
    total_frq_pages = frq_end_page - frq_start_page + 1
    pages_per_question = total_frq_pages / 3
    
    q_start = frq_start_page + int((q_num - 1) * pages_per_question)
    q_end = min(frq_start_page + int(q_num * pages_per_question), frq_end_page + 1)
    
    page_range = range(q_start - 1, q_end - 1)  # convert to 0-indexed
    
    img_idx = 0
    for page_idx in page_range:
        if page_idx >= len(doc):
            continue
        page = doc[page_idx]
        
        # Extract embedded images
        images = page.get_images(full=True)
        for img_info in images:
            xref = img_info[0]
            rects = page.get_image_rects(xref)
            for rect in rects:
                # Skip tiny images (likely icons or watermarks)
                if rect.width < 80 or rect.height < 80:
                    continue
                # Skip images that look like they might be watermarks or logos
                if rect.width < 150 and rect.height < 150:
                    continue
                
                zoom = 200 / 72
                mat = fitz.Matrix(zoom, zoom)
                try:
                    pix = page.get_pixmap(clip=rect, matrix=mat)
                    out_path = IMG_OUT / f"{year}_FRQ{q_num}_img{img_idx}.png"
                    pix.save(str(out_path))
                    rel_path = f"/images/micro/frq/{year}_FRQ{q_num}_img{img_idx}.png"
                    img_paths.append(rel_path)
                    img_idx += 1
                except Exception as e:
                    print(f"  Warning: Failed to extract image on page {page_idx+1}: {e}")
        
        # Also extract drawings/vector graphics (graphs, charts)
        # CRITICAL FIX: AP FRQ graphs are composed of many small vector lines.
        # Individual drawings are tiny (<100x100), but their combined bounding box
        # forms the actual graph. We cluster drawings by vertical proximity and
        # pick the largest cluster to extract the graph region.
        drawings = page.get_drawings()
        if drawings:
            # Step 1: Filter out header/footer and tiny noise
            candidates = []
            for d in drawings:
                rect = fitz.Rect(d['rect'])
                w, h = rect.width, rect.height
                if w < 3 or h < 3:
                    continue
                # Exclude header (top ~130px) and footer (bottom ~60px)
                if rect.y0 < 130 or rect.y1 > page.rect.height - 60:
                    continue
                candidates.append(d)
            
            if candidates:
                # Step 2: Group by vertical proximity (within 80px)
                candidates.sort(key=lambda d: d['rect'][1])
                groups = []
                current_group = []
                last_y = None
                
                for d in candidates:
                    y = d['rect'][1]
                    if last_y is None or y - last_y < 80:
                        current_group.append(d)
                    else:
                        if current_group:
                            groups.append(current_group)
                        current_group = [d]
                    last_y = y
                
                if current_group:
                    groups.append(current_group)
                
                # Step 3: Find largest group by area
                def group_area(g):
                    min_x = min(d['rect'][0] for d in g)
                    min_y = min(d['rect'][1] for d in g)
                    max_x = max(d['rect'][2] for d in g)
                    max_y = max(d['rect'][3] for d in g)
                    return (max_x - min_x) * (max_y - min_y)
                
                best_group = max(groups, key=group_area)
                
                min_x = min(d['rect'][0] for d in best_group)
                min_y = min(d['rect'][1] for d in best_group)
                max_x = max(d['rect'][2] for d in best_group)
                max_y = max(d['rect'][3] for d in best_group)
                
                margin = 20
                clip_rect = fitz.Rect(
                    max(0, min_x - margin), max(0, min_y - margin),
                    min(page.rect.width, max_x + margin),
                    min(page.rect.height, max_y + margin)
                )
                
                # Only save if the cluster is reasonably large and not the whole page
                if (clip_rect.width > 200 and clip_rect.height > 100 and
                    clip_rect.width < page.rect.width * 0.95 and
                    clip_rect.height < page.rect.height * 0.70):
                    zoom = 200 / 72
                    mat = fitz.Matrix(zoom, zoom)
                    try:
                        pix = page.get_pixmap(clip=clip_rect, matrix=mat)
                        out_path = IMG_OUT / f"{year}_FRQ{q_num}_drawing.png"
                        pix.save(str(out_path))
                        rel_path = f"/images/micro/frq/{year}_FRQ{q_num}_drawing.png"
                        img_paths.append(rel_path)
                    except Exception as e:
                        print(f"  Warning: Failed to extract drawing on page {page_idx+1}: {e}")
    
    return img_paths

def main():
    IMG_OUT.mkdir(parents=True, exist_ok=True)
    
    all_frqs = []
    
    for year, (pdf_name, frq_start, frq_end, scoring_start) in YEAR_CONFIG.items():
        pdf_path = PDF_DIR / pdf_name
        if not pdf_path.exists():
            print(f"SKIP {year}: {pdf_name} not found")
            continue
        
        print(f"\nProcessing {year}...")
        doc = fitz.open(pdf_path)
        
        # Extract FRQ questions
        questions = extract_frqs_from_pages(doc, frq_start, frq_end, year)
        print(f"  Extracted {len(questions)} FRQ questions (raw)")
        
        # CRITICAL FIX: Deduplicate by question_num, keep the one with longest text
        # (Real questions have more text than answer page fragments)
        seen = {}
        for q in questions:
            qn = q['question_num']
            if qn not in seen or len(q['text']) > len(seen[qn]['text']):
                seen[qn] = q
        questions = [seen[qn] for qn in sorted(seen.keys())]
        
        # CRITICAL FIX: Validate against CED knowledge - AP Micro has exactly 3 FRQs
        expected_frqs = 3
        if len(questions) != expected_frqs:
            print(f"  ERROR: Expected {expected_frqs} FRQs for {year}, got {len(questions)}. This is a BLOCKER.")
            # List what we found
            for q in questions:
                print(f"    FRQ{q['question_num']}: {len(q['text'])} chars")
            # Continue but mark as error
        
        print(f"  After deduplication: {len(questions)} FRQ questions")
        
        # Extract scoring guidelines
        rubrics = extract_scoring_guidelines(doc, scoring_start, year)
        print(f"  Extracted {len(rubrics)} rubrics")
        
        # Assign rubrics to questions and extract images
        for q in questions:
            q_num = q['question_num']
            if q_num in rubrics:
                q['rubric'] = rubrics[q_num]
            else:
                print(f"  WARNING: No rubric found for {year}_FRQ{q_num}")
            
            # Detect graphs from text
            q['has_graph'] = any(kw in q['text'].lower() for kw in 
                ['graph', 'figure', 'diagram', 'curve', 'below shows', 'above shows', 'the graph'])
            
            # Extract images
            img_paths = extract_images_for_frq(doc, frq_start, frq_end, year, q_num)
            q['image_paths'] = img_paths
            if img_paths:
                print(f"  {year}_FRQ{q_num}: extracted {len(img_paths)} image(s)")
        
        all_frqs.extend(questions)
        doc.close()
    
    # Save FRQ bank
    with open(OUT_DIR / 'frq_bank.json', 'w', encoding='utf-8') as f:
        json.dump(all_frqs, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*50}")
    print(f"Total FRQs extracted: {len(all_frqs)}")
    
    # Summary stats
    with_rubric = sum(1 for q in all_frqs if q['rubric'])
    with_images = sum(1 for q in all_frqs if q['image_paths'])
    total_images = sum(len(q['image_paths']) for q in all_frqs)
    
    print(f"With rubric: {with_rubric}/{len(all_frqs)}")
    print(f"With images: {with_images}/{len(all_frqs)}")
    print(f"Total images: {total_images}")
    print(f"Saved to: {OUT_DIR / 'frq_bank.json'}")

if __name__ == '__main__':
    main()
