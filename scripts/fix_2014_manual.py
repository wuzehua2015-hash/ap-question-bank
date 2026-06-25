import json
import os

with open('public/data/ap/microeconomics/2014_raw_extraction.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

q_map = {q['question_number']: q for q in questions}

# Q4: B类 - 表格选项 (substitution/income effect)
q4 = q_map[4]
q4['options'] = {
    'A': 'Increase / Decrease',
    'B': 'Increase / Increase',
    'C': 'Increase / No change',
    'D': 'Decrease / Increase',
    'E': 'Decrease / No change'
}
q4['option_table_data'] = {
    'headers': ['Substitution Effect', 'Income Effect'],
    'rows': {
        'A': ['Increase', 'Decrease'],
        'B': ['Increase', 'Increase'],
        'C': ['Increase', 'No change'],
        'D': ['Decrease', 'Increase'],
        'E': ['Decrease', 'No change']
    }
}

# Q11: C类 - 图形题
q11 = q_map[11]
q11['requires_graph'] = True
q11['diagram_references'] = ['profit_maximizing']

# Q18: B类 - 表格选项 (price elasticity)
q18 = q_map[18]
q18['options'] = {
    'A': 'Increase / Increase',
    'B': 'Decrease / Increase',
    'C': 'Decrease / Decrease',
    'D': 'Decrease / Remain constant',
    'E': 'Remain constant / Increase'
}
q18['option_table_data'] = {
    'headers': ['Number of People Riding', "City's Revenues"],
    'rows': {
        'A': ['Increase', 'Increase'],
        'B': ['Decrease', 'Increase'],
        'C': ['Decrease', 'Decrease'],
        'D': ['Decrease', 'Remain constant'],
        'E': ['Remain constant', 'Increase']
    }
}

# Q27: B类 - 表格选项 (monopoly tax)
q27 = q_map[27]
q27['options'] = {
    'A': 'Shift down / Increase / Decrease',
    'B': 'Shift down / Decrease / Decrease',
    'C': 'No shift / Decrease / Decrease',
    'D': 'Shift up / Decrease / Increase',
    'E': 'Shift up / Increase / Increase'
}
q27['option_table_data'] = {
    'headers': ['Marginal Cost', 'Output', 'Price'],
    'rows': {
        'A': ['Shift down', 'Increase', 'Decrease'],
        'B': ['Shift down', 'Decrease', 'Decrease'],
        'C': ['No shift', 'Decrease', 'Decrease'],
        'D': ['Shift up', 'Decrease', 'Increase'],
        'E': ['Shift up', 'Increase', 'Increase']
    }
}

# Q29: A类 - 题干有表格 (production function)
q29 = q_map[29]
q29['background_data'] = {
    'table': {
        'headers': ['Number of Workers', 'Total Output'],
        'rows': [
            ['0', '0'],
            ['1', '50'],
            ['2', '110'],
            ['3', '170'],
            ['4', '220'],
            ['5', '260'],
            ['6', '290'],
            ['7', '310']
        ]
    }
}

# Q33: C类 - 图形题 (rent control)
q33 = q_map[33]
q33['requires_graph'] = True
q33['diagram_references'] = ['rent_control']

# Q34: C类 - 图形题 (already set)

# Q40: D类 - 博弈论矩阵
q40 = q_map[40]
q40['text'] = 'The following table shows the profits associated with the pricing strategies of two oligopolistic firms, Agronomia and Farmingdale. Each firm has two possible strategies: to charge a low price or a high price. The first entry in each cell shows the profits to Agronomia and the second the profits to Farmingdale.'
q40['options'] = {
    'A': '$50 / $100',
    'B': '$150 / $150',
    'C': '$50 / $50',
    'D': '$100 / $150',
    'E': '$100 / $50'
}
q40['background_data'] = {
    'payoff_matrix': {
        'players': ['Agronomia', 'Farmingdale'],
        'strategies': ['High Price', 'Low Price'],
        'matrix': [
            [['$150', '$150'], ['$50', '$200']],
            [['$200', '$50'], ['$100', '$100']]
        ]
    }
}

# Q42: C类 - 图形题
q42 = q_map[42]
q42['requires_graph'] = True
q42['diagram_references'] = ['mrp_labor_market']

# Q45: B类 - 表格选项 (pollution tax)
q45 = q_map[45]
q45['options'] = {
    'A': 'Increase / Decrease',
    'B': 'Increase / Increase',
    'C': 'Decrease / Increase',
    'D': 'Decrease / Decrease',
    'E': 'No change / No change'
}
q45['option_table_data'] = {
    'headers': ['Price', 'Quantity'],
    'rows': {
        'A': ['Increase', 'Decrease'],
        'B': ['Increase', 'Increase'],
        'C': ['Decrease', 'Increase'],
        'D': ['Decrease', 'Decrease'],
        'E': ['No change', 'No change']
    }
}

# Clean encoding and spacing
for q in questions:
    q['text'] = q['text'].replace('\u2019', "'").replace('\u2013', '-').replace('\u2014', '-')
    while '  ' in q['text']:
        q['text'] = q['text'].replace('  ', ' ')
    q['text'] = q['text'].strip()
    for opt, val in q['options'].items():
        val = val.replace('\u2019', "'").replace('\u2013', '-').replace('\u2014', '-')
        while '  ' in val:
            val = val.replace('  ', ' ')
        q['options'][opt] = val.strip()

# Add common fields
for q in questions:
    q['question_id'] = f'2014_Q{q["question_number"]:02d}'
    q['year'] = 2014
    q['question_type'] = 'MCQ'
    q['source'] = 'AP Microeconomics 2014 Official Exam'
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

# Save
with open('public/data/ap/microeconomics/2014_cleaned.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

print(f'Saved {len(questions)} questions to 2014_cleaned.json')

# Verify
print('\n=== Verification ===')
for q in questions:
    if q.get('option_table_data'):
        print(f"Q{q['question_number']}: option_table_data")
    if q.get('requires_graph'):
        print(f"Q{q['question_number']}: requires_graph")
    if q.get('background_data'):
        print(f"Q{q['question_number']}: background_data")

print('Done!')
