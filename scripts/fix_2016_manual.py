import json
import os

# Process 2016 raw extraction
with open('public/data/ap/microeconomics/2016_raw_extraction.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

q_map = {q['question_number']: q for q in questions}

# Quick fixes for known special questions in 2016
# Q1: table options (PPF)
q_map[1]['option_table_data'] = {
    'headers': ['Apples', 'Bananas'],
    'rows': {'A': ['Decrease', 'Increase'], 'B': ['Increase', 'Decrease'], 'C': ['Increase', 'Increase'], 'D': ['Decrease', 'Decrease'], 'E': ['No change', 'Decrease']}
}

# Q7: graph
q_map[7]['requires_graph'] = True
q_map[7]['diagram_references'] = ['mp_ap_curves']

# Q9: table options (monopoly)
q_map[9]['option_table_data'] = {
    'headers': ['Price', 'Output'],
    'rows': {'A': ['Increase', 'Increase'], 'B': ['Increase', 'Decrease'], 'C': ['Decrease', 'Increase'], 'D': ['Decrease', 'Decrease'], 'E': ['No change', 'No change']}
}

# Q17: table options (comparative advantage)
q_map[17]['option_table_data'] = {
    'headers': ['Computers', 'Rice'],
    'rows': {'A': ['Increase', 'Increase'], 'B': ['Increase', 'Decrease'], 'C': ['Decrease', 'Increase'], 'D': ['Decrease', 'Decrease'], 'E': ['No change', 'No change']}
}

# Q18: graph
q_map[18]['requires_graph'] = True
q_map[18]['diagram_references'] = ['supply_shift_tax']

# Q21: background table
q_map[21]['background_data'] = {'table': {'headers': ['Output', 'Total Cost'], 'rows': [['1', '$30'], ['2', '$40'], ['3', '$48'], ['4', '$60'], ['5', '$80'], ['6', '$100']]}}

# Q25: graph
q_map[25]['requires_graph'] = True
q_map[25]['diagram_references'] = ['monopoly_profit_maximizing']

# Q31: background table
q_map[31]['background_data'] = {'table': {'headers': ['Worker', 'Palm Leaves', 'Coconuts'], 'rows': [['Robert', '20', '10'], ['Frank', '10', '20']]}}

# Q42: background table
q_map[42]['background_data'] = {'table': {'headers': ['Quantity', 'Total Revenue', 'Total Cost'], 'rows': [['1', '$10', '$12'], ['2', '$20', '$21'], ['3', '$30', '$30'], ['4', '$40', '$42'], ['5', '$50', '$55']]}}

# Q45: background table
q_map[45]['background_data'] = {'table': {'headers': ['Income', 'Tax'], 'rows': [['$100,000', '$20,000'], ['$120,000', '$22,000']]}}

# Q48: graph
q_map[48]['requires_graph'] = True
q_map[48]['diagram_references'] = ['price_ceiling']

# Q53: table options
q_map[53]['option_table_data'] = {
    'headers': ['Average Variable Cost', 'Marginal Cost'],
    'rows': {'A': ['$35', '$40'], 'B': ['$35', '$35'], 'C': ['$40', '$35'], 'D': ['$40', '$40'], 'E': ['$50', '$35']}
}

# Q56: table options
q_map[56]['option_table_data'] = {
    'headers': ['Equilibrium Price', 'Equilibrium Quantity'],
    'rows': {'A': ['Decrease', 'Decrease'], 'B': ['Decrease', 'Increase'], 'C': ['Increase', 'Decrease'], 'D': ['Increase', 'Increase'], 'E': ['Indeterminate', 'Increase']}
}

# Q58: graph
q_map[58]['requires_graph'] = True
q_map[58]['diagram_references'] = ['monopsony_labor_market']

# Q59: background table
q_map[59]['background_data'] = {'table': {'headers': ['Output', 'Total Cost'], 'rows': [['0', '$24'], ['1', '$30'], ['2', '$36'], ['3', '$45'], ['4', '$60'], ['5', '$80'], ['6', '$105']]}}

# Q60: graph
q_map[60]['requires_graph'] = True
q_map[60]['diagram_references'] = ['positive_externality']

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
    q['question_id'] = f'2016_Q{q["question_number"]:02d}'
    q['year'] = 2016
    q['question_type'] = 'MCQ'
    q['source'] = 'AP Microeconomics 2016 Official Exam'
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

with open('public/data/ap/microeconomics/2016_cleaned.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

print(f'Saved {len(questions)} questions to 2016_cleaned.json')

# Verify
for q in questions:
    if q.get('option_table_data'):
        print(f"Q{q['question_number']}: option_table_data")
    if q.get('requires_graph'):
        print(f"Q{q['question_number']}: requires_graph")
    if q.get('background_data'):
        print(f"Q{q['question_number']}: background_data")

print('Done!')
