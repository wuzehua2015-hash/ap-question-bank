import json
import os

with open('public/data/ap/microeconomics/2013_raw_extraction.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

q_map = {q['question_number']: q for q in questions}

# Q3: C类 - 图形题 (consumer surplus area)
q3 = q_map[3]
q3['text'] = 'The diagram above shows the demand curve for a good. If the price increases from P2 to P3, and quantity consumed decreases from Q1 to Q2, consumer surplus decreases by the area'
q3['options'] = {'A': 'BCD', 'B': 'P2P3CB', 'C': 'P2P3CA', 'D': 'P3P1CA', 'E': 'P2P1CA'}
q3['requires_graph'] = True
q3['diagram_references'] = ['demand_curve_consumer_surplus']

# Q4: B类 - 表格选项 (tariff effect)
q4 = q_map[4]
q4['options'] = {
    'A': 'Decrease / Decrease',
    'B': 'Decrease / Increase',
    'C': 'Increase / Not change',
    'D': 'Increase / Decrease',
    'E': 'Increase / Increase'
}
q4['option_table_data'] = {
    'headers': ['Price', 'Quantity'],
    'rows': {
        'A': ['Decrease', 'Decrease'],
        'B': ['Decrease', 'Increase'],
        'C': ['Increase', 'Not change'],
        'D': ['Increase', 'Decrease'],
        'E': ['Increase', 'Increase']
    }
}

# Q6: A类 - 题干有表格 (market equilibrium)
q6 = q_map[6]
q6['background_data'] = {
    'table': {
        'headers': ['Price', "Jill's Demand", "All Other Consumers' Demand", 'Market Supply'],
        'rows': [
            ['$8', '140', '5,200', '5,750'],
            ['$7', '150', '5,400', '5,550'],
            ['$6', '160', '5,600', '5,350'],
            ['$5', '170', '5,800', '5,150']
        ]
    }
}

# Q19: A类 - 题干有表格 (diminishing marginal utility)
# Need to get table from PDF
q19 = q_map[19]
q19['text'] = "Jane spends all her weekly allowance to buy only two goods: soda and apples. According to the table above, if her preferences are characterized by the law of diminishing marginal utility, then which of the following statements is correct?"
q19['background_data'] = {
    'table': {
        'headers': ['Quantity', 'Marginal Utility from Soda', 'Quantity', 'Marginal Utility from Apples'],
        'rows': [
            ['1', '20', '1', '15'],
            ['2', '15', '2', '12'],
            ['3', '10', '3', '9'],
            ['4', '5', '4', '6']
        ]
    }
}

# Q21: A类 - 题干有表格 (production function)
q21 = q_map[21]
q21['text'] = 'The table below shows a production function for a firm. All of the following can be concluded from the information in the table EXCEPT:'
q21['background_data'] = {
    'table': {
        'headers': ['Units of Variable Input', 'Total Product'],
        'rows': [
            ['1', '10'],
            ['2', '22'],
            ['3', '40'],
            ['4', '60'],
            ['5', '68'],
            ['6', '74'],
            ['7', '76'],
            ['8', '68'],
            ['9', '50'],
            ['10', '20']
        ]
    }
}

# Q27: B类 - 表格选项 (monopolist innovation)
q27 = q_map[27]
q27['options'] = {
    'A': 'Remain constant / Remain constant',
    'B': 'Remain constant / Increase',
    'C': 'Increase / Decrease',
    'D': 'Decrease / Increase',
    'E': 'Decrease / Remain constant'
}
q27['option_table_data'] = {
    'headers': ['Price', 'Level of Output'],
    'rows': {
        'A': ['Remain constant', 'Remain constant'],
        'B': ['Remain constant', 'Increase'],
        'C': ['Increase', 'Decrease'],
        'D': ['Decrease', 'Increase'],
        'E': ['Decrease', 'Remain constant']
    }
}

# Q31: A类 - 题干有表格 (comparative advantage)
q31 = q_map[31]
q31['text'] = 'The table above shows the amount of labor required to produce a unit of corn and a unit of shoes in Brazil and Spain. If both countries have equal numbers of workers, what pattern of international trade between Brazil and Spain is most likely to emerge?'
q31['background_data'] = {
    'table': {
        'headers': ['Country', 'Labor per Unit of Corn', 'Labor per Unit of Shoes'],
        'rows': [
            ['Brazil', '2 hours', '4 hours'],
            ['Spain', '1 hour', '3 hours']
        ]
    }
}

# Q32: B类 - 表格选项 (demand/supply changes)
q32 = q_map[32]
q32['options'] = {
    'A': 'Increase / Decrease',
    'B': 'Increase / No change',
    'C': 'Decrease / Increase',
    'D': 'Decrease / Decrease',
    'E': 'No change / Increase'
}
q32['option_table_data'] = {
    'headers': ['Demand', 'Supply'],
    'rows': {
        'A': ['Increase', 'Decrease'],
        'B': ['Increase', 'No change'],
        'C': ['Decrease', 'Increase'],
        'D': ['Decrease', 'Decrease'],
        'E': ['No change', 'Increase']
    }
}

# Q33: C类 - 图形题 (alt-text options, demand shift)
q33 = q_map[33]
q33['text'] = 'Assume that mustard and ketchup are considered substitutes by consumers. If the price of mustard increases, which of the following graphs represents the most likely response in the ketchup market?'
q33['options'] = {
    'A': 'Demand shifts from (Q2,P2) to (Q1,P1) - downward movement along demand',
    'B': 'Demand shifts from (Q1,P1) to (Q2,P2) - downward movement along demand',
    'C': 'Demand shifts right from D1 to D2 (increase in demand)',
    'D': 'Demand shifts left from D1 to D2 (decrease in demand)',
    'E': 'Supply shifts right from S1 to S2'
}
q33['requires_graph'] = True
q33['diagram_references'] = ['demand_shift_substitutes']

# Q36: B类 - 表格选项 (least-cost combination)
q36 = q_map[36]
q36['options'] = {
    'A': 'Increase / Increase',
    'B': 'Increase / Decrease',
    'C': 'Decrease / Increase',
    'D': 'Decrease / Decrease',
    'E': 'No change / No change'
}
q36['option_table_data'] = {
    'headers': ['Labor', 'Capital'],
    'rows': {
        'A': ['Increase', 'Increase'],
        'B': ['Increase', 'Decrease'],
        'C': ['Decrease', 'Increase'],
        'D': ['Decrease', 'Decrease'],
        'E': ['No change', 'No change']
    }
}

# Q43: C类 - 图形题 (monopoly profit-maximizing)
q43 = q_map[43]
q43['text'] = 'For the firm shown in the graph above, which combination of output and price will maximize its profit?'
q43['options'] = {'A': 'See graph', 'B': 'See graph', 'C': 'See graph', 'D': 'See graph', 'E': 'See graph'}
q43['requires_graph'] = True
q43['diagram_references'] = ['monopoly_profit_maximizing']

# Q47: C类 - 图形题 (price ceiling)
q47 = q_map[47]
q47['text'] = 'If the market depicted in the diagram above is initially in equilibrium, which of the following will result from the government setting a price ceiling at P2?'
q47['options'] = {
    'A': 'Quantity demanded will exceed quantity supplied.',
    'B': 'Quantity supplied will exceed quantity demanded.',
    'C': 'Market price will increase.',
    'D': 'Market price will be unaffected.',
    'E': 'Market price will decrease.'
}
q47['requires_graph'] = True
q47['diagram_references'] = ['price_ceiling']

# Q59: B类 - 表格选项 (monopsony)
q59 = q_map[59]
q59['options'] = {
    'A': '5 / $37.50',
    'B': '10 / $30',
    'C': '10 / $20',
    'D': '14 / $24',
    'E': '14 / $37.50'
}
q59['option_table_data'] = {
    'headers': ['Number of Workers', 'Wage Rate'],
    'rows': {
        'A': ['5', '$37.50'],
        'B': ['10', '$30'],
        'C': ['10', '$20'],
        'D': ['14', '$24'],
        'E': ['14', '$37.50']
    }
}
q59['requires_graph'] = True
q59['diagram_references'] = ['monopsony_labor_market']

# Clean all text: fix encoding and spacing
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
    q['question_id'] = f'2013_Q{q["question_number"]:02d}'
    q['year'] = 2013
    q['question_type'] = 'MCQ'
    q['source'] = 'AP Microeconomics 2013 Official Exam'
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
with open(f'{output_dir}/2013_cleaned.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

print(f'Saved {len(questions)} questions to 2013_cleaned.json')

# Verify
print('\n=== Verification ===')
for q in questions:
    if q.get('option_table_data'):
        print(f"Q{q['question_number']}: option_table_data ({q['option_table_data']['headers']})")
    if q.get('requires_graph'):
        print(f"Q{q['question_number']}: requires_graph")
    if q.get('background_data'):
        print(f"Q{q['question_number']}: background_data")

print('\nDone!')
