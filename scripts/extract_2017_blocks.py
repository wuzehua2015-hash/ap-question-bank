import fitz
import re
import json

pdf_path = 'D:/Lynk/翎英教育LynkEdu/真题/AP/Full_Exams/Microeconomics/AP_Microeconomics_2017_Full_Exam.pdf'
doc = fitz.open(pdf_path)

# Extract text blocks with positions and sort by reading order
all_blocks = []
for page_num in range(19, 31):  # pages 20-31
    page = doc[page_num]
    blocks = page.get_text("blocks")
    for block in blocks:
        x0, y0, x1, y1, text, block_no, block_type = block
        all_blocks.append({
            'page': page_num,
            'y0': y0,
            'x0': x0,
            'text': text
        })

doc.close()

# Sort blocks by page, then by y0 (top to bottom), then by x0 (left to right)
all_blocks.sort(key=lambda b: (b['page'], b['y0'], b['x0']))

# Reconstruct text in reading order
full_text = ''
for block in all_blocks:
    full_text += block['text'] + '\n'

# Clean
lines = full_text.split('\n')
cleaned_lines = []
for line in lines:
    line = line.strip()
    if not line:
        continue
    if line.startswith('Unauthorized') or line.startswith('GO ON TO THE NEXT PAGE') or line.startswith('-'):
        continue
    if line in ['MICROECONOMICS', 'Section I', 'Time-70 minutes', '60 Questions', 'MICROECONOMICS Section I']:
        continue
    if 'Directions:' in line and 'Each of the questions' in line:
        continue
    cleaned_lines.append(line)

cleaned_text = '\n'.join(cleaned_lines)

# Extract questions
q_starts = [(m.start(), int(m.group(1))) for m in re.finditer(r'\n\s*(\d+)\.\s+', cleaned_text)]
if cleaned_text.startswith(' 1. ') or cleaned_text.startswith('1. '):
    q_starts.insert(0, (0, 1))

questions = []
for i, (start_idx, q_num) in enumerate(q_starts):
    if q_num > 60:
        continue
    end_idx = q_starts[i + 1][0] if i + 1 < len(q_starts) else len(cleaned_text)
    q_text = cleaned_text[start_idx:end_idx].strip()
    
    text_match = re.search(r'^\d+\.\s+(.*?)(?=\n\(A\)\s|\n\(a\)\s|\nA\s|\nA\.)', q_text, re.DOTALL)
    if not text_match:
        continue
    question_text = text_match.group(1).replace('\n', ' ').strip()
    
    options = {}
    for opt_match in re.finditer(r'\n\(([A-E])\)\s+(.*?)(?=\n\([A-E]\)\s+|\n\d+\.\s+|$)', q_text, re.DOTALL):
        opt_letter = opt_match.group(1)
        opt_text = opt_match.group(2).replace('\n', ' ').strip()
        options[opt_letter] = opt_text
    
    if len(options) == 5:
        questions.append({'question_number': q_num, 'text': question_text, 'options': options})

print(f'Extracted {len(questions)} questions')
print(f'Numbers: {[q["question_number"] for q in questions]}')

with open('public/data/ap/microeconomics/2017_raw_extraction.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)
print('Saved 2017_raw_extraction.json')
