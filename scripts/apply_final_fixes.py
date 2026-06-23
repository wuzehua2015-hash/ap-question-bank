import json

with open('public/data/ap/macroeconomics/question_bank.json', 'r', encoding='utf-8') as f:
    qb = json.load(f)

# U4中的government spending题目 - 需要看上下文判断
# 如果同时有货币政策 → U5, 否则 → U3
FIXES_U4 = [
    ('2014_Q06', 'U5', 'Policy actions in recession with both fiscal and monetary options → U5'),
    ('2014_Q60', 'U6', 'Currency/appreciation with reserve requirement → U6 (exchange rate context)'),
    ('2015_Q08', 'U3', 'Cost-push inflation with AD-AS context → U3'),
    ('2016_Q26', 'U5', 'Interest rates with government spending and trade deficit → U5'),
    ('2017_Q10', 'U3', 'Tax reduction with AD-AS context → U3'),
    ('2017_Q55', 'U5', 'Budget deficit with interest rates → U5 (crowding out context)'),
    ('2018_Q12', 'U5', 'Money supply + government spending → U5'),
    ('2018_Q17', 'U5', 'Government spending + borrowing + interest rates → U5 (crowding out)'),
    ('2023_Q068', 'U5', 'Government spending + private savings + interest rates → U5'),
]

FIXES_U3 = [
    ('2017_Q17', 'U4', 'Movement on SRPC with real interest rate → U4 (monetary policy effect)'),
    ('2017_Q18', 'U4', 'Fiscal policy reducing inflation with interest rate effects → U4 (loanable funds)'),
    ('2019_Q45', 'U4', 'Increase in AD and inflation with real interest rate → U4 (monetary transmission)'),
]

fixed = 0
for qid, new_unit, reason in FIXES_U4 + FIXES_U3:
    for q in qb:
        if q.get('question_id') == qid:
            old = q.get('primary_unit')
            q['primary_unit'] = new_unit
            q['classification_reasoning'] = f'Fixed: {reason}. Moved from {old} to {new_unit}.'
            fixed += 1
            print(f'Fixed {qid}: {old} → {new_unit}')
            break

with open('public/data/ap/macroeconomics/question_bank.json', 'w', encoding='utf-8') as f:
    json.dump(qb, f, indent=2, ensure_ascii=False)

print(f'\nFixed: {fixed} questions')
