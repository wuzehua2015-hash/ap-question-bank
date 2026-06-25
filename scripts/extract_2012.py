"""
Extract 2012 AP Microeconomics MCQ text from PDF.
Strategy: Extract all text from MCQ pages (20-35), filter headers/footers,
parse question numbers and options using global regex.
B/C/D class questions will be manually corrected after script extraction.
"""
import fitz
import re
import json

pdf_path = 'D:/Lynk/翎英教育LynkEdu/真题/AP/Full_Exams/Microeconomics/AP Micro 2012.pdf'
pdf = fitz.open(pdf_path)

# MCQ pages: 20-35 (0-indexed: 19-34)
mcq_pages = list(range(19, 35))

all_text = ""
for page_idx in mcq_pages:
    page = pdf[page_idx]
    text = page.get_text()
    all_text += text + "\n"

# Clean headers and footers
def clean_text(text):
    lines = text.split('\n')
    cleaned = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        # Skip header/footer patterns
        if 'Unauthorized copying' in stripped:
            continue
        if 'GO ON TO THE NEXT PAGE' in stripped:
            continue
        if re.match(r'^-\d+-$', stripped):
            continue
        if 'MICROECONOMICS' in stripped:
            continue
        if 'Section I' in stripped:
            continue
        if 'Time' in stripped and 'minutes' in stripped:
            continue
        if '60 Questions' in stripped:
            continue
        if 'Directions:' in stripped:
            continue
        if 'any part of this page is illegal' in stripped:
            continue
        if 'completions. Select the one that is best' in stripped:
            continue
        if 'answer sheet.' in stripped and len(stripped) < 50:
            continue
        cleaned.append(line)
    return '\n'.join(cleaned)

cleaned_text = clean_text(all_text)

# Parse all questions using global regex
# Find all occurrences of "N. text... (A) ... (B) ... (C) ... (D) ... (E) ..."
questions = []

# Find all question start positions
q_starts = [(m.start(), int(m.group(1))) for m in re.finditer(r'\n\s*(\d+)\.\s+', cleaned_text)]
# Also check if Q1 is at the very beginning
if cleaned_text.startswith(' 1. '):
    q_starts.insert(0, (0, 1))

for i, (start_pos, q_num) in enumerate(q_starts):
    # Determine end position (start of next question or end of text)
    if i + 1 < len(q_starts):
        end_pos = q_starts[i + 1][0]
    else:
        end_pos = len(cleaned_text)
    
    block = cleaned_text[start_pos:end_pos].strip()
    
    # Extract question text
    m = re.match(r'\d+\.\s+(.*?)(?=\n\(A\))', block, re.DOTALL)
    if not m:
        continue
    
    q_text = m.group(1).strip().replace('\n', ' ')
    
    # Extract options
    opts = {}
    for letter in ['A', 'B', 'C', 'D', 'E']:
        pattern = rf'\({letter}\)\s+(.*?)(?=\n\([A-E]\)|\Z)'
        opt_m = re.search(pattern, block, re.DOTALL)
        if opt_m:
            opt_text = opt_m.group(1).strip().replace('\n', ' ')
            opts[letter] = opt_text
    
    if len(opts) == 5:
        questions.append({
            'question_number': q_num,
            'text': q_text,
            'options': opts
        })

print(f"Extracted {len(questions)} questions")
nums = sorted([q['question_number'] for q in questions])
print(f"Question numbers: {nums}")
missing = [n for n in range(1, 61) if n not in nums]
if missing:
    print(f"Missing: {missing}")
else:
    print("All 60 questions extracted!")

for q in questions[:3]:
    print(f"\nQ{q['question_number']}: {q['text'][:80]}...")
    for opt, val in q['options'].items():
        print(f"  {opt}: {val[:80]}")

# Save raw extraction
with open('public/data/ap/microeconomics/2012_raw_extraction.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print("\nSaved to 2012_raw_extraction.json")
