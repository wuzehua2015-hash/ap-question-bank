import json
import os

with open('public/data/ap/microeconomics/2015_raw_extraction.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

q_map = {q['question_number']: q for q in questions}

# Q3: background table (gasoline supply/demand)
q_map[3]['background_data'] = {'table': {'headers': ['Price', 'Quantity Supplied', 'Quantity Demanded'], 'rows': [['$2.50', '6,000', '10,000'], ['$2.75', '7,000', '8,000'], ['$3.00', '8,000', '6,000'], ['$3.25', '9,000', '4,000']]}}

# Q4: table options (price elasticity)
q_map[4]['option_table_data'] = {'headers': ['Price', 'Quantity'], 'rows': {'A': ['Increase', 'Increase'], 'B': ['Increase', 'Decrease'], 'C': ['Decrease', 'Increase'], 'D': ['Decrease', 'Decrease'], 'E': ['No change', 'No change']}}

# Q6: already fixed

# Q31: background table (Kim/Maria hours)
q_map[31]['background_data'] = {'table': {'headers': ['Task', 'Kim', 'Maria'], 'rows': [['Cooking', '2 hours', '3 hours'], ['Cleaning', '4 hours', '6 hours']]}}

# Q32: graph
q_map[32]['requires_graph'] = True
q_map[32]['diagram_references'] = ['price_elasticity_points']

# Q36: background table (total cost)
q_map[36]['background_data'] = {'table': {'headers': ['Output', 'Total Cost'], 'rows': [['0', '$10'], ['1', '$14'], ['2', '$19'], ['3', '$25'], ['4', '$32'], ['5', '$42'], ['6', '$55']]}}

# Q38: graph (already fixed)

# Q42: table options (minimum wage)
q_map[42]['option_table_data'] = {'headers': ['Quantity of Labor Demanded', 'Quantity of Labor Supplied'], 'rows': {'A': ['Decrease', 'Increase'], 'B': ['Decrease', 'Decrease'], 'C': ['Increase', 'Increase'], 'D': ['Increase', 'Decrease'], 'E': ['No change', 'No change']}}

# Q57: graph
q_map[57]['requires_graph'] = True
q_map[57]['diagram_references'] = ['monopoly_profit_maximizing']

# Q60: table options (already fixed)

# Clean encoding and spacing
for q in questions:
    q['text'] = q['text'].replace('\u2019', "'").replace('\u2013', '-').replace('\u2014', '-').replace(' sub ', '_').replace('sub ', '_')
    while '  ' in q['text']:
        q['text'] = q['text'].replace('  ', ' ')
    q['text'] = q['text'].strip()
    for opt, val in q['options'].items():
        val = val.replace('\u2019', "'").replace('\u2013', '-').replace('\u2014', '-').replace(' sub ', '_').replace('sub ', '_')
        while '  ' in val:
            val = val.replace('  ', ' ')
        q['options'][opt] = val.strip()

# Add common fields
for q in questions:
    q['question_id'] = f'2015_Q{q["question_number"]:02d}'
    q['year'] = 2015
    q['question_type'] = 'MCQ'
    q['source'] = 'AP Microeconomics 2015 Official Exam'
    q['primary_unit'] = 'U1'
    q['secondary_units'] = []
    q['pure_unit'] = True
    q['topics'] = []
    q['difficulty'] = 'medium'
    q['difficulty_source'] = 'official'
    q['difficulty_score'] = 3
    q['skills'] = []
    q['has_graph'] = q.get('requires_graph', False)
    q['image_paths'] = q.get('image_paths', [])
    q['classification_reasoning'] = ''

with open('public/data/ap/microeconomics/2015_cleaned.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

print(f'Saved {len(questions)} questions to 2015_cleaned.json')

# Verify
for q in questions:
    if q.get('option_table_data'):
        print(f"Q{q['question_number']}: option_table_data")
    if q.get('requires_graph'):
        print(f"Q{q['question_number']}: requires_graph")
    if q.get('background_data'):
        print(f"Q{q['question_number']}: background_data")

print('Done!')
