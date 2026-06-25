import json

with open('public/data/ap/microeconomics/2012_question_bank.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

q_map = {q['question_number']: q for q in questions}

# Fix Q30 option E - remove Q31 table data
q30 = q_map[30]
q30['options']['E'] = 'Imported oil'

# Fix Q44 option E - remove Q45 table data
q44 = q_map[44]
q44['options']['E'] = 'usually produces unsafe products if not regulated by government'

with open('public/data/ap/microeconomics/2012_question_bank.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

print('Fixed Q30 and Q44 pollution')
