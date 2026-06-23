import json

# 加载题库
with open('public/data/ap/macroeconomics/question_bank.json', 'r', encoding='utf-8') as f:
    qb = json.load(f)

# 加载违规报告
with open('public/data/ap/macroeconomics/question_bank_exclusion_violations.json', 'r', encoding='utf-8') as f:
    report = json.load(f)

# 高置信度修复规则
HIGH_CONFIDENCE_FIXES = {
    'economic growth': {'from': ['U1', 'U3', 'U6'], 'to': 'U5'},
    'crowding out': {'from': ['U3', 'U6'], 'to': 'U5'},
    'long-run phillips curve': {'from': ['U4'], 'to': 'U5'},
    'labor force': {'from': ['U1'], 'to': 'U2'},
}

fixed = 0
skipped = []

for item in report['items']:
    qid = item['qid']
    old_unit = item['unit']
    violations = item['violations']
    
    for violation in violations:
        if violation in HIGH_CONFIDENCE_FIXES:
            rule = HIGH_CONFIDENCE_FIXES[violation]
            if old_unit in rule['from']:
                new_unit = rule['to']
                for q in qb:
                    if q.get('question_id') == qid:
                        q['primary_unit'] = new_unit
                        q['classification_reasoning'] = f'Fixed by exclusion rule: {violation} in {old_unit} → {new_unit}. A student in {old_unit} would never encounter this concept.'
                        fixed += 1
                        print(f'Fixed {qid}: {old_unit} → {new_unit} ({violation})')
                        break
                break
    else:
        skipped.append(item)

# 保存修复后的题库
with open('public/data/ap/macroeconomics/question_bank.json', 'w', encoding='utf-8') as f:
    json.dump(qb, f, indent=2, ensure_ascii=False)

print(f'\nFixed: {fixed} questions')
print(f'Skipped (needs manual review): {len(skipped)} questions')
