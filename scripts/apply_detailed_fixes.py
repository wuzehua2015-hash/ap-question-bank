import json

# 加载题库
with open('public/data/ap/macroeconomics/question_bank.json', 'r', encoding='utf-8') as f:
    qb = json.load(f)

# 加载违规报告
with open('public/data/ap/macroeconomics/question_bank_exclusion_violations.json', 'r', encoding='utf-8') as f:
    report = json.load(f)

# 精细修复规则
FIX_RULES = [
    # U4中明确有AD-AS曲线的 → U3（U4不应该有AD-AS分析）
    {'qids': ['2014_Q13', '2014_Q42', '2015_Q03', '2015_Q48', '2018_Q15'], 'from': 'U4', 'to': 'U3', 'reason': 'U4 contains AD-AS curve analysis, which belongs to U3'},
    
    # U4中明确有fiscal policy且没有货币政策的 → U3
    {'qids': ['2012_Q29', '2012_Q49', '2014_Q10', '2014_Q20', '2016_Q14', '2018_Q04', '2018_Q44', '2019_Q46'], 'from': 'U4', 'to': 'U3', 'reason': 'Fiscal policy without monetary combination belongs to U3'},
    
    # U4中明确有fiscal+monetary组合的 → U5
    {'qids': ['2014_Q35', '2019_Q26'], 'from': 'U4', 'to': 'U5', 'reason': 'Fiscal-monetary policy combination belongs to U5'},
    
    # U4中的foreign exchange/currency → U6
    {'qids': ['2015_Q16', '2016_Q09'], 'from': 'U4', 'to': 'U6', 'reason': 'Foreign exchange/currency belongs to U6'},
    
    # U4中的balance of payments → U6
    {'qids': ['2019_Q34'], 'from': 'U4', 'to': 'U6', 'reason': 'Balance of payments belongs to U6'},
    
    # U6中的aggregate demand/supply → U3（如果是纯AD-AS分析）
    {'qids': ['2012_Q17', '2012_Q51', '2014_Q52', '2014_Q59', '2019_Q03'], 'from': 'U6', 'to': 'U3', 'reason': 'Pure AD-AS analysis belongs to U3, not U6'},
    
    # U3中的money supply但题目是AD-AS相关 → U4（货币政策工具）
    {'qids': ['2014_Q06', '2015_Q08', '2016_Q27', '2018_Q19', '2019_Q06'], 'from': 'U3', 'to': 'U4', 'reason': 'Monetary policy tools (money supply) belong to U4'},
    
    # U3中的net exports → U6
    {'qids': ['2014_Q41'], 'from': 'U3', 'to': 'U6', 'reason': 'Net exports belong to U6'},
    
    # U3中的tariff → U6
    {'qids': ['2016_Q56'], 'from': 'U3', 'to': 'U6', 'reason': 'Tariff belongs to U6'},
    
    # U3中的loanable funds → U4
    {'qids': ['2017_Q10'], 'from': 'U3', 'to': 'U4', 'reason': 'Loanable funds market belongs to U4'},
    
    # U1中的government spending → U5
    {'qids': ['2019_Q01'], 'from': 'U1', 'to': 'U5', 'reason': 'Government spending with PPC/growth context belongs to U5'},
    
    # U2中的economic growth → U5
    {'qids': ['2017_Q05'], 'from': 'U2', 'to': 'U5', 'reason': 'Economic growth measurement belongs to U5'},
    
    # U4中的economic growth → U5
    {'qids': ['2017_Q38'], 'from': 'U4', 'to': 'U5', 'reason': 'Economic growth belongs to U5'},
]

fixed = 0

for rule in FIX_RULES:
    for qid in rule['qids']:
        for q in qb:
            if q.get('question_id') == qid:
                if q.get('primary_unit') == rule['from']:
                    q['primary_unit'] = rule['to']
                    q['classification_reasoning'] = f'Fixed by exclusion rule: {rule["reason"]}. Moved from {rule["from"]} to {rule["to"]}. '
                    fixed += 1
                    print(f'Fixed {qid}: {rule["from"]} → {rule["to"]}')
                break

# 保存修复后的题库
with open('public/data/ap/macroeconomics/question_bank.json', 'w', encoding='utf-8') as f:
    json.dump(qb, f, indent=2, ensure_ascii=False)

print(f'\nFixed: {fixed} questions total')
