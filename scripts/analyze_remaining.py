import json

with open('public/data/ap/macroeconomics/question_bank.json', 'r', encoding='utf-8') as f:
    qb = json.load(f)

with open('public/data/ap/macroeconomics/question_bank_exclusion_violations.json', 'r', encoding='utf-8') as f:
    report = json.load(f)

# 真正的分类错误：学生只学完这个单元，绝对不可能知道这个概念
# 排除"跨单元综合题"（题目同时包含多个单元的概念，无法完全避免）

def is_true_error(item):
    qid = item['qid']
    unit = item['unit']
    violations = item['violations']
    text = item['text'].lower()
    
    # 1. 微观市场概念出现在宏观单元 → 100%错误
    if 'market for bottled water' in text or 'bushels of' in text or 'market for wheat' in text:
        if unit != 'U1':
            return True, 'U1', 'Micro market analysis in macro unit'
    
    # 2. economic growth 出现在 U1/U2/U3/U6 → 100%错误
    if 'economic growth' in violations:
        if unit in ['U1', 'U2', 'U3', 'U6']:
            return True, 'U5', 'Economic growth is U5 only'
    
    # 3. crowding out 出现在 U3/U6 → 100%错误
    if 'crowding out' in violations:
        if unit in ['U3', 'U6']:
            return True, 'U5', 'Crowding out is U5 only'
    
    # 4. long-run phillips curve 出现在 U3/U4 → 100%错误
    if 'long-run phillips curve' in violations:
        if unit in ['U3', 'U4']:
            return True, 'U5', 'LRPC is U5 only'
    
    # 5. 货币政策工具（open market operations）出现在 U2/U3 → 100%错误
    if 'open market' in text or 'buying bonds' in text or 'selling bonds' in text:
        if unit in ['U2', 'U3'] and 'fiscal policy' not in text and 'government spending' not in text:
            return True, 'U4', 'Monetary policy tools are U4 only'
    
    # 6. 汇率/外汇出现在 U3/U4 → 100%错误
    if 'foreign exchange' in violations or 'exchange rate' in violations:
        if unit in ['U3', 'U4']:
            return True, 'U6', 'Exchange rate is U6 only'
    
    # 7. 财政政策（fiscal policy）单独出现在 U4 → 可能是U3或U5
    if 'fiscal policy' in violations and unit == 'U4':
        # 如果有货币政策组合 → U5
        if 'monetary policy' in text or 'central bank' in text or 'buy bonds' in text:
            return True, 'U5', 'Fiscal-monetary combination is U5'
        else:
            return True, 'U3', 'Fiscal policy alone is U3'
    
    # 8. 劳动力市场概念出现在 U1 → 100%错误
    if 'labor force' in violations or 'unemployment rate' in violations:
        if unit == 'U1':
            return True, 'U2', 'Labor market concepts are U2'
    
    return False, None, None

# 统计
true_errors = []
cross_unit = []

for item in report['items']:
    is_error, new_unit, reason = is_true_error(item)
    if is_error:
        true_errors.append({**item, 'new_unit': new_unit, 'reason': reason})
    else:
        cross_unit.append(item)

print(f"True errors (must fix): {len(true_errors)}")
print(f"Cross-unit questions (expected): {len(cross_unit)}")

print("\n=== True Errors ===")
for e in true_errors:
    print(f"  {e['qid']}: {e['unit']} → {e['new_unit']} ({e['reason']})")

print("\n=== Cross-Unit (expected, not errors) ===")
for c in cross_unit:
    print(f"  {c['qid']}: {c['unit']} has '{c['violations'][0]}' (cross-unit)")
