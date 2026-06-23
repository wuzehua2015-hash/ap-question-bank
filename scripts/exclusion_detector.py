#!/usr/bin/env python3
"""
AP Macroeconomics Question Bank Exclusion Violation Detector
只检测"排除概念违规"——最可靠的分类错误类型

标准：题目文本中出现了当前单元【绝对不应该】出现的概念
"""

import json
import sys
from collections import defaultdict

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

# ========== 核心：排除概念矩阵 ==========
# 定义每个单元"绝对不应该出现"的概念
# 这些概念如果在题目中出现，说明分类一定错误

EXCLUSION_MATRIX = {
    'U1': {
        # U1 (Basic Economic Concepts) 绝对不能有：
        'forbidden_phrases': [
            'gdp', 'gross domestic product', 'national income',
            'unemployment rate', 'unemployed', 'labor force',
            'inflation rate', 'consumer price index', 'cpi',
            'aggregate demand', 'aggregate supply', 'ad-as', 'sras', 'lras',
            'fiscal policy', 'government spending', 'multiplier',
            'monetary policy', 'central bank', 'federal reserve', 'fed',
            'money supply', 'money demand', 'money market', 'banking',
            'loanable funds', 'open market operations', 'reserve requirement',
            'discount rate', 'economic growth', 'production function',
            'human capital', 'crowding out', 'phillips curve',
            'exchange rate', 'foreign exchange', 'net exports', 'trade deficit',
            'balance of payments', 'tariff', 'quota'
        ],
        'allowed_as_distractors': [
            # 这些词在U1中可能作为干扰项出现，但通常不会
        ]
    },
    'U2': {
        # U2 (Economic Indicators) 绝对不能有：
        'forbidden_phrases': [
            'aggregate demand', 'aggregate supply', 'ad-as', 'sras', 'lras',
            'ad curve', 'as curve', 'aggregate output',
            'fiscal policy', 'government spending', 'spending multiplier', 'tax multiplier',
            'monetary policy', 'central bank', 'federal reserve', 'fed',
            'money supply', 'money demand', 'money market', 'banking',
            'loanable funds', 'open market', 'reserve requirement',
            'discount rate', 'bonds', 'securities',
            'economic growth', 'production function', 'human capital',
            'crowding out', 'long-run phillips curve', 'lrpc',
            'exchange rate', 'foreign exchange', 'currency appreciation',
            'net exports', 'trade deficit', 'balance of payments', 'tariff'
        ],
        'allowed_as_distractors': [
            'inflation', 'unemployment', 'gdp', 'business cycle', 'recession',
            'consumer price index', 'cpi', 'nominal gdp', 'real gdp'
        ]
    },
    'U3': {
        # U3 (AD-AS) 绝对不能有：
        'forbidden_phrases': [
            'money demand', 'money supply', 'money market', 'banking system',
            'bank reserves', 'excess reserves', 'money multiplier', 'money creation',
            'loanable funds market', 'loanable funds', 'real interest rate',
            'open market operations', 'buying bonds', 'selling bonds',
            'economic growth', 'production function', 'human capital', 'technology',
            'crowding out', 'long-run phillips curve', 'lrpc',
            'exchange rate', 'foreign exchange', 'net exports', 'trade deficit',
            'balance of payments', 'tariff', 'quota'
        ],
        'allowed_as_distractors': [
            'aggregate demand', 'aggregate supply', 'ad-as', 'fiscal policy',
            'government spending', 'multiplier', 'phillips curve', 'inflation',
            'unemployment', 'gdp'
        ]
    },
    'U4': {
        # U4 (Financial Sector) 绝对不能有：
        'forbidden_phrases': [
            'ad-as equilibrium', 'aggregate demand curve', 'aggregate supply curve',
            'fiscal-monetary', 'fiscal policy', 'government spending', 'tax multiplier',
            'spending multiplier', 'balanced budget multiplier',
            'economic growth', 'production function', 'human capital',
            'long-run phillips curve', 'lrpc',
            'exchange rate', 'foreign exchange market', 'currency',
            'net exports', 'trade deficit', 'balance of payments', 'tariff', 'quota'
        ],
        'allowed_as_distractors': [
            'money supply', 'money demand', 'money market', 'banking', 'central bank',
            'federal reserve', 'fed', 'open market', 'reserve requirement',
            'discount rate', 'loanable funds', 'interest rate', 'investment',
            'aggregate demand', 'inflation', 'gdp'
        ]
    },
    'U5': {
        # U5 (Long-Run Consequences) 没有绝对的排除概念
        # 因为U5是最综合的单元，很多概念都可能出现
        'forbidden_phrases': [
            # 主要是货币市场的纯技术细节不应该在U5
            'money market mechanics', 'money multiplier calculation',
            'bank reserve ratio', 'excess reserves calculation'
        ],
        'allowed_as_distractors': []
    },
    'U6': {
        # U6 (Open Economy) 绝对不能有：
        'forbidden_phrases': [
            'ad-as', 'aggregate demand', 'aggregate supply',
            'fiscal policy', 'monetary policy', 'crowding out',
            'phillips curve', 'economic growth', 'production function'
        ],
        'allowed_as_distractors': [
            'exchange rate', 'foreign exchange', 'net exports', 'trade deficit',
            'balance of payments', 'currency', 'tariff', 'quota'
        ]
    }
}

# ========== 主检测函数 ==========

def detect_exclusion_violations(text, options_text, unit):
    """
    检测题目是否包含当前单元不应该出现的概念
    返回: (has_violation, violations, suggested_unit)
    """
    if unit not in EXCLUSION_MATRIX:
        return False, [], None
    
    combined = (text + ' ' + options_text).lower()
    
    config = EXCLUSION_MATRIX[unit]
    forbidden = config['forbidden_phrases']
    allowed = config.get('allowed_as_distractors', [])
    
    violations = []
    for phrase in forbidden:
        if phrase in combined:
            # 检查是否只是作为干扰项
            # 如果这个词只在选项中出现一次，可能是干扰项
            # 简化：不判断干扰项，直接标记违规
            violations.append(phrase)
    
    if not violations:
        return False, [], None
    
    # 尝试推断正确单元
    suggested = infer_unit_from_violations(violations, combined)
    
    return True, violations, suggested

def infer_unit_from_violations(violations, combined_text):
    """根据违规概念推断可能属于哪个单元"""
    
    # 检查特定模式
    if any(v in ['aggregate demand', 'aggregate supply', 'ad-as', 'sras', 'lras'] for v in violations):
        if 'money supply' not in combined_text or 'central bank' not in combined_text:
            return 'U3'
    
    if any(v in ['money supply', 'money demand', 'money market', 'central bank', 'federal reserve', 'open market'] for v in violations):
        if 'aggregate demand' not in combined_text and 'fiscal policy' not in combined_text:
            return 'U4'
        return 'U5'  # 可能是组合
    
    if any(v in ['exchange rate', 'foreign exchange', 'net exports', 'trade deficit'] for v in violations):
        return 'U6'
    
    if any(v in ['economic growth', 'production function', 'human capital'] for v in violations):
        return 'U5'
    
    if any(v in ['inflation rate', 'unemployment rate', 'gdp', 'cpi'] for v in violations):
        return 'U2'
    
    return None

# ========== 主程序 ==========

def main():
    if len(sys.argv) < 2:
        print("Usage: python exclusion_detector.py <question_bank.json>")
        sys.exit(1)
    
    qb_path = sys.argv[1]
    
    print("=" * 60)
    print("AP Macro Question Bank - Exclusion Violation Detector")
    print("=" * 60)
    
    qb = load_json(qb_path)
    questions = qb if isinstance(qb, list) else qb.get('questions', [])
    
    print(f"\n题库题目数: {len(questions)}")
    
    violations = []
    
    for i, q in enumerate(questions):
        qid = q.get('question_id', f'Q{i}')
        text = q.get('text', '')
        options = q.get('options', {})
        options_text = ' '.join(str(v) for v in options.values())
        unit = q.get('primary_unit', 'UNKNOWN')
        
        has_violation, found_violations, suggested = detect_exclusion_violations(text, options_text, unit)
        
        if has_violation:
            violations.append({
                'qid': qid,
                'unit': unit,
                'suggested': suggested,
                'violations': found_violations,
                'text': text[:120] + '...' if len(text) > 120 else text
            })
    
    print(f"\n发现 {len(violations)} 题排除概念违规")
    
    # 保存报告
    report = {
        'total': len(questions),
        'violations': len(violations),
        'items': violations
    }
    
    report_path = qb_path.replace('.json', '_exclusion_violations.json')
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"报告保存至: {report_path}")
    
    # 打印摘要
    if violations:
        print("\n" + "=" * 60)
        print("排除概念违规题目")
        print("=" * 60)
        
        by_unit = defaultdict(list)
        for v in violations:
            by_unit[v['unit']].append(v)
        
        for unit in sorted(by_unit.keys()):
            items = by_unit[unit]
            print(f"\n{unit} 中的 {len(items)} 题违规:")
            for item in items:
                print(f"  {item['qid']}: 包含 '{item['violations'][0]}'")
                print(f"    建议: {item['unit']} → {item['suggested']}")
                print(f"    {item['text']}")
    
    print("\n" + "=" * 60)
    print(f"检测完成。{len(violations)} 题需要修正。")
    print("=" * 60)

if __name__ == '__main__':
    main()
