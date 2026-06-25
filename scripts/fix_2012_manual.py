import json
import os

# Load raw extraction
with open('public/data/ap/microeconomics/2012_raw_extraction.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

# Convert to dict by question number for easy access
q_map = {q['question_number']: q for q in questions}

# ─── B/C/D类题手动修正 ───

# Q4: C类 - 图形题 (price ceiling diagram)
q4 = q_map[4]
q4['text'] = 'In the market depicted in the diagram above, if the government imposes a price ceiling of $1.00 per gallon on gasoline, which of the following will result?'
q4['options'] = {
    'A': 'A surplus of 6 billion gallons',
    'B': 'A shortage of 6 billion gallons',
    'C': 'A surplus of 12 billion gallons',
    'D': 'A shortage of 12 billion gallons',
    'E': 'Neither a surplus nor a shortage, because the price ceiling would not be effective'
}
q4['requires_graph'] = True
q4['diagram_references'] = ['price_ceiling_diagram']

# Q13: B类 - 表格选项 (wage subsidy)
q13 = q_map[13]
q13['text'] = 'Businesses employ workers from city neighborhoods and rural areas. These workers are perfect substitutes and cannot relocate in the short run. The government offers businesses a wage subsidy if they hire workers from city neighborhoods. What is the effect of the subsidy on the wage rate of rural workers and on the total hours they work?'
q13['options'] = {
    'A': 'Increase / Decrease',
    'B': 'No change / Increase',
    'C': 'No change / Decrease',
    'D': 'Decrease / Decrease',
    'E': 'Decrease / No change'
}
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
q14['text'] = "A per-unit tax on pollution produced by a firm will affect the firm's output and pollution levels in which of the following ways?"
q14['options'] = {
    'A': 'Increase / Increase',
    'B': 'Increase / Decrease',
    'C': 'Decrease / Increase',
    'D': 'Decrease / Decrease',
    'E': 'No change / No change'
}
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
q18['text'] = 'What is the price paid by consumers and the net price received by producers after the tax is paid?'
q18['options'] = {
    'A': '$11.00 / $10.45',
    'B': '$11.00 / $10.00',
    'C': '$10.45 / $10.00',
    'D': '$10.45 / $9.45',
    'E': '$10.00 / $9.45'
}
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
q19['text'] = 'According to the diagram, what is the dollar amount of the unit tax?'
q19['options'] = {
    'A': '$0.00',
    'B': '$0.45',
    'C': '$0.55',
    'D': '$1.00',
    'E': '$1.45'
}
q19['requires_graph'] = True
q19['diagram_references'] = ['tax_incidence_diagram']

# Q24: C类 - 图形题 (profit-maximizing graph)
q24 = q_map[24]
q24['text'] = 'The profit-maximizing firm depicted in the graph above should'
q24['options'] = {
    'A': 'exit if conditions do not improve in the long run',
    'B': 'produce the output that minimizes average total cost',
    'C': 'increase price to maximize profits',
    'D': 'increase output to maximize profits',
    'E': 'use less capital and more labor to reduce cost'
}
q24['requires_graph'] = True
q24['diagram_references'] = ['profit_maximizing_graph']

# Q26: A类 - 但题干有表格 (options are simple numbers, but stem has table)
q26 = q_map[26]
q26['text'] = 'How many workers would the coal company want to hire if the price of coal were competitively priced at $5 per ton and the wage rate were $40 per day?'
q26['options'] = {
    'A': '5',
    'B': '4',
    'C': '3',
    'D': '2',
    'E': '0'
}
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
q27['text'] = 'The marginal physical product of the second worker is'
q27['options'] = {
    'A': '19',
    'B': '22',
    'C': '25',
    'D': '44',
    'E': '75'
}
q27['background_data'] = q26['background_data']  # Same table

# Q31: A类 - 但题干有表格 (comparative advantage table)
q31 = q_map[31]
q31['text'] = 'According to the information in the table above, which of the following statements is true if both countries have the same number of workers?'
q31['options'] = {
    'A': 'Country A has both an absolute and a comparative advantage in manufactured goods.',
    'B': 'Country A has an absolute advantage in manufactured goods but a comparative advantage in service goods.',
    'C': 'Country B has a comparative advantage in service goods but no absolute advantage in either good.',
    'D': 'Country A has an absolute advantage in service goods but a comparative advantage in manufactured goods.',
    'E': 'Country B has an absolute advantage in manufactured goods, but without more information, it is not possible to tell in which product it has a comparative advantage.'
}
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
q40['text'] = 'The payoff matrix below shows the per-unit profits associated with the production strategies of two utility companies, UA and UB. Each firm has two choices: to reduce production by 10 percent or by 20 percent. The first entry in each cell indicates the profits to UA, and the second, the profits to UB. Based on the information, and assuming no cooperation, which of the following statements is true?'
q40['options'] = {
    'A': 'Neither company has a dominant strategy.',
    'B': 'Both companies have an incentive to reduce production by 10%.',
    'C': 'Both companies have an incentive to reduce production by 20%.',
    'D': 'Only UA has an incentive to reduce production by 20%.',
    'E': 'Only UB has an incentive to reduce production by 20%.'
}
q40['background_data'] = {
    'payoff_matrix': {
        'players': ['UA', 'UB'],
        'strategies': ['Reduces Production by 20%', 'Reduces Production by 10%'],
        'matrix': [
            [['$150', '$150'], ['$50', '$250']],  # UA 20%, UB 20% / UB 10%
            [['$250', '$50'], ['$100', '$100']]   # UA 10%, UB 20% / UB 10%
        ]
    }
}

# Q45: A类 - 但题干有表格 (income distribution)
q45 = q_map[45]
q45['text'] = 'The table above shows the distribution of income in Country X in 2010 before and after taxes and transfer payments. Which of the following can be concluded about the effect of the government\'s tax and transfer policies on income distribution in Country X?'
q45['options'] = {
    'A': 'The distribution of income is significantly less equal after accounting for the impact of government policies.',
    'B': 'The distribution of income is about the same after accounting for the impact of government policies.',
    'C': 'The largest gainers from government policies are the third and fourth quintile groups.',
    'D': 'The only quintile to benefit from government policies is the lowest quintile.',
    'E': 'The major transfer of income is from the highest quintile to the two lowest quintiles.'
}
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
q48['text'] = 'Suppose that the market supply curve for shoes is upward sloping and the market demand curve is downward sloping. How will the imposition of a sales tax on shoes affect the consumer surplus, the producer surplus, and the total surplus?'
q48['options'] = {
    'A': 'Decrease / Decrease / Decrease',
    'B': 'Decrease / Increase / Increase',
    'C': 'Decrease / Increase / Decrease',
    'D': 'Increase / Decrease / Decrease',
    'E': 'Increase / Increase / Increase'
}
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
q52['text'] = 'The graph above shows the total revenue and total cost curves for a firm in which type of market structure and what is the profit-maximizing quantity?'
q52['options'] = {
    'A': 'Monopoly / Q2',
    'B': 'Monopoly / Q3',
    'C': 'Perfect Competition / Q1',
    'D': 'Perfect Competition / Q3',
    'E': 'Perfect Competition / Q4'
}
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
q56['text'] = 'Firm XYZ produces and sells corn in a perfectly competitive market and hires its workers in a perfectly competitive labor market. Which of the following best describes the demand curve for XYZ\'s corn and XYZ\'s demand curve for labor?'
q56['options'] = {
    'A': 'Horizontal / Horizontal',
    'B': 'Horizontal / Downward sloping',
    'C': 'Horizontal / Vertical',
    'D': 'Downward sloping / Downward sloping',
    'E': 'Downward sloping / Horizontal'
}
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

# ─── A类题清理 ───
# 确保所有A类题没有残留问题
for q in questions:
    if q['question_number'] not in [4, 13, 14, 18, 19, 24, 26, 27, 31, 40, 45, 48, 52, 56]:
        # 清理subscript问题（如果有）
        q['text'] = q['text'].replace(' sub ', '_').replace(' sub', '_').replace('sub ', '')

# ─── 添加通用字段 ───
for q in questions:
    q['question_id'] = f'2012_Q{q["question_number"]:02d}'
    q['year'] = 2012
    q['question_type'] = 'MCQ'
    q['source'] = 'AP Microeconomics 2012 Official Exam'
    q['primary_unit'] = 'U1'  # Placeholder, will be set in Phase 6
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

# ─── 保存 ───
output_dir = 'public/data/ap/microeconomics'
os.makedirs(output_dir, exist_ok=True)

with open(f'{output_dir}/2012_cleaned.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

print(f'Saved {len(questions)} questions to {output_dir}/2012_cleaned.json')

# Verify
print('\n=== Verification ===')
for q in questions:
    if q.get('option_table_data'):
        print(f"Q{q['question_number']}: option_table_data ✓")
    if q.get('requires_graph'):
        print(f"Q{q['question_number']}: requires_graph ✓")
    if q.get('background_data'):
        print(f"Q{q['question_number']}: background_data ✓")

print('\nAll done!')
