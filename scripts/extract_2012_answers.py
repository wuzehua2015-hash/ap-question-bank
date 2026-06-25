import fitz
import re
import json
import os

pdf_path = 'D:/Lynk/翎英教育LynkEdu/真题/AP/Full_Exams/Microeconomics/AP Micro 2012.pdf'
doc = fitz.open(pdf_path)

# Extract answer key from page 51 (0-indexed 50)
answer_text = doc[50].get_text()

# Extract answer key - format is: line1=question_number, line2=answer_letter
answers = {}
lines = [l.strip() for l in answer_text.split('\n') if l.strip()]

i = 0
while i < len(lines) - 1:
    if lines[i].isdigit() and int(lines[i]) <= 60:
        if lines[i+1] in 'ABCDE':
            answers[int(lines[i])] = lines[i+1]
            i += 2
        else:
            i += 1
    else:
        i += 1

print(f'Extracted {len(answers)} answers from 2012')
print(f'Sample: {list(answers.items())[:5]}')

if len(answers) == 60:
    print('SUCCESS: All 60 answers extracted')

# Save for reference
with open('public/data/ap/microeconomics/2012_answers_reference.json', 'w', encoding='utf-8') as f:
    json.dump(answers, f, indent=2, ensure_ascii=False)

doc.close()
print('Done')
