import json
import os

with open('public/data/ap/microeconomics/2012_manual_entry.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

q_map = {q['question_number']: q for q in questions}

# Add special type markers and fix data structures

# Q4: C类 - 图形题 (price ceiling diagram)
q4 = q_map[4]
q4['requires_graph'] = True
q4['diagram_references'] = ['price_ceiling_diagram']

# Q13: B类 - 表格选项 (wage subsidy)
q13 = q_map[13]
q13['option_table_data'] = {
    'headers': ['Wage Rate of Rural Workers', 'Total Hours Worked by Rural Workers'],
    'rows': {
        'A': ['Increase', 'Decrease'],
        'B': ['No change', 'Increase'],
        'C': ['No change', 'Decrease'],
        'D': ['Decrease', 'Decrease'],
        'E': ['Decrease', 'No change']
    }
}

# Q14: B类 - 表格选项 (tax on pollution)
q14 = q_map[14]
q14['option_table_data'] = {
    'headers': ['Output', 'Pollution'],
    'rows': {
        'A': ['Increase', 'Increase'],
        'B': ['Increase', 'Decrease'],
        'C': ['Decrease', 'Increase'],
        'D': ['Decrease', 'Decrease'],
        'E': ['No change', 'No change']
    }
}

# Q18: B类 - 表格选项+图形 (tax diagram)
q18 = q_map[18]
q18['option_table_data'] = {
    'headers': ['Paid by Consumers', 'Received by Producers'],
    'rows': {
        'A': ['$11.00', '$10.45'],
        'B': ['$11.00', '$10.00'],
        'C': ['$10.45', '$10.00'],
        'D': ['$10.45', '$9.45'],
        'E': ['$10.00', '$9.45']
    }
}
q18['requires_graph'] = True
q18['diagram_references'] = ['tax_incidence_diagram']

# Q19: C类 - 图形题 (same diagram as Q18)
q19 = q_map[19]
q19['requires_graph'] = True
q19['diagram_references'] = ['tax_incidence_diagram']

# Q24: C类 - 图形题 (profit-maximizing graph)
q24 = q_map[24]
q24['requires_graph'] = True
q24['diagram_references'] = ['profit_maximizing_graph']

# Q26: A类 - 但题干有表格 (options are simple numbers, stem has table)
q26 = q_map[26]
q26['background_data'] = {
    'table': {
        'headers': ['Number of Workers', 'Total Output of Coal'],
        'rows': [
            ['0', '0'],
            ['1', '25'],
            ['2', '44'],
            ['3', '60'],
            ['4', '70'],
            ['5', '75']
        ]
    }
}

# Q27: A类 - 但题干有表格 (same table as Q26)
q27 = q_map[27]
q27['background_data'] = q26['background_data']

# Q31: A类 - 但题干有表格 (comparative advantage table)
q31 = q_map[31]
q31['background_data'] = {
    'table': {
        'headers': ['Country', 'Manufactured Goods', 'Service Goods'],
        'rows': [
            ['A', '100 units', '300 units'],
            ['B', '75 units', '150 units']
        ]
    }
}

# Q40: D类 - 博弈论矩阵
q40 = q_map[40]
q40['background_data'] = {
    'payoff_matrix': {
        'players': ['UA', 'UB'],
        'strategies': ['Reduces Production by 20%', 'Reduces Production by 10%'],
        'matrix': [
            [['$150', '$150'], ['$50', '$250']],
            [['$250', '$50'], ['$100', '$100']]
        ]
    }
}

# Q45: A类 - 但题干有表格 (income distribution)
q45 = q_map[45]
q45['background_data'] = {
    'table': {
        'headers': ['Quintile', 'Before Taxes and Transfers', 'After Taxes and Transfers'],
        'rows': [
            ['Lowest 20 percent', '1.1', '5.1'],
            ['Second 20 percent', '7.9', '11.1'],
            ['Third 20 percent', '15.5', '16.5'],
            ['Fourth 20 percent', '24.7', '23.8'],
            ['Highest 20 percent', '50.7', '43.5']
        ]
    }
}

# Q48: B类 - 表格选项 (sales tax effect)
q48 = q_map[48]
q48['option_table_data'] = {
    'headers': ['Consumer Surplus', 'Producer Surplus', 'Total Surplus'],
    'rows': {
        'A': ['Decrease', 'Decrease', 'Decrease'],
        'B': ['Decrease', 'Increase', 'Increase'],
        'C': ['Decrease', 'Increase', 'Decrease'],
        'D': ['Increase', 'Decrease', 'Decrease'],
        'E': ['Increase', 'Increase', 'Increase']
    }
}

# Q52: B类 - 表格选项+图形 (market structure + quantity)
q52 = q_map[52]
q52['option_table_data'] = {
    'headers': ['Market Structure', 'Quantity'],
    'rows': {
        'A': ['Monopoly', 'Q2'],
        'B': ['Monopoly', 'Q3'],
        'C': ['Perfect Competition', 'Q1'],
        'D': ['Perfect Competition', 'Q3'],
        'E': ['Perfect Competition', 'Q4']
    }
}
q52['requires_graph'] = True
q52['diagram_references'] = ['tr_tc_curves']

# Q56: B类 - 表格选项 (demand curves)
q56 = q_map[56]
q56['option_table_data'] = {
    'headers': ["Demand for XYZ's Corn", "XYZ's Labor Demand"],
    'rows': {
        'A': ['Horizontal', 'Horizontal'],
        'B': ['Horizontal', 'Downward sloping'],
        'C': ['Horizontal', 'Vertical'],
        'D': ['Downward sloping', 'Downward sloping'],
        'E': ['Downward sloping', 'Horizontal']
    }
}

# Add common fields for all questions
for q in questions:
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
output_dir = 'public/data/ap/microeconomics'
with open(f'{output_dir}/2012_question_bank.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

print(f'Saved {len(questions)} MCQ questions to 2012_question_bank.json')
print('Done with special types!')
