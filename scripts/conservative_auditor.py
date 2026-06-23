#!/usr/bin/env python3
"""
AP Macroeconomics Question Bank Conservative Auditor
保守审核策略：只标记"明显错误"，不猜测边界题目

核心标准："学生只学完这个单元能不能做这道题？"
策略：
1. 检查每道题文本是否包含当前单元不可能出现的概念
2. 如果包含排除概念 → 标记为错误，建议正确单元
3. 如果无法确定 → 保留原分类，不猜测

用法：python conservative_auditor.py <question_bank.json> <classification_config.json>
"""

import json
import sys
import re
from collections import defaultdict

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

# ========== 核心：排除概念检测 ==========

# 对每个单元，定义"这个单元绝对不应该出现的概念"
UNIT_EXCLUSIONS = {
    'U1': {
        'concepts': [
            'gdp', 'gross domestic product', 'national income',
            'unemployment', 'inflation', 'consumer price index', 'cpi',
            'aggregate demand', 'aggregate supply', 'ad-as', 'sras', 'lras',
            'fiscal policy', 'government spending', 'multiplier',
            'monetary policy', 'central bank', 'federal reserve', 'fed',
            'money supply', 'money demand', 'money market', 'banking',
            'loanable funds', 'open market', 'bonds', 'reserve requirement',
            'discount rate', 'economic growth', 'production function',
            'human capital', 'crowding out', 'phillips curve',
            'exchange rate', 'net exports', 'trade deficit', 'tariff'
        ],
        'exceptions': [
            # 这些词在U1中可能作为干扰项出现，但不是核心概念
        ]
    },
    'U2': {
        'concepts': [
            'aggregate demand', 'aggregate supply', 'ad-as', 'sras', 'lras',
            'fiscal policy', 'government spending', 'multiplier',
            'monetary policy', 'central bank', 'federal reserve', 'fed',
            'money supply', 'money demand', 'money market', 'banking',
            'loanable funds', 'open market', 'reserve requirement',
            'discount rate', 'economic growth', 'production function',
            'human capital', 'crowding out', 'phillips curve',
            'exchange rate', 'net exports', 'trade deficit'
        ],
        'exceptions': [
            'inflation rate', 'unemployment rate', 'natural rate', 'business cycle',
            'frictional unemployment', 'structural unemployment', 'cyclical unemployment',
            'nominal gdp', 'real gdp', 'gdp deflator', 'consumer price index', 'cpi'
        ]
    },
    'U3': {
        'concepts': [
            'money demand', 'money supply', 'money market', 'banking system',
            'bank reserves', 'excess reserves', 'money multiplier',
            'loanable funds market', 'open market operations',
            'economic growth', 'production function', 'human capital',
            'crowding out', 'long-run phillips curve', 'lrpc',
            'exchange rate', 'net exports', 'trade deficit'
        ],
        'exceptions': [
            'aggregate demand', 'aggregate supply', 'ad-as', 'sras', 'lras',
            'fiscal policy', 'government spending', 'multiplier', 'tax multiplier',
            'short-run phillips curve', 'srpc', 'stagflation',
            'inflationary gap', 'recessionary gap'
        ]
    },
    'U4': {
        'concepts': [
            'fiscal policy', 'government spending', 'tax multiplier', 'spending multiplier',
            'ad-as equilibrium', 'fiscal-monetary', 'economic growth',
            'production function', 'human capital', 'long-run phillips curve',
            'exchange rate', 'net exports', 'trade deficit'
        ],
        'exceptions': [
            'money demand', 'money supply', 'money market', 'banking',
            'central bank', 'federal reserve', 'fed', 'open market',
            'reserve requirement', 'discount rate', 'loanable funds',
            'investment', 'interest rate'
        ]
    },
    'U5': {
        'concepts': [
            'money market mechanics', 'banking system details',
            'ad-as alone', 'fiscal policy alone', 'monetary policy alone'
        ],
        'exceptions': [
            'fiscal-monetary', 'policy mix', 'government spending', 'taxes',
            'central bank', 'buy bonds', 'sell bonds', 'economic growth',
            'production function', 'human capital', 'crowding out',
            'long-run phillips curve', 'supply-side'
        ]
    },
    'U6': {
        'concepts': [
            'fiscal policy', 'monetary policy', 'ad-as', 'crowding out',
            'economic growth', 'production function'
        ],
        'exceptions': [
            'exchange rate', 'currency', 'appreciation', 'depreciation',
            'foreign exchange', 'net exports', 'trade deficit', 'trade surplus',
            'balance of payments', 'tariff', 'quota', 'capital flows'
        ]
    }
}

# 正向概念：如果题目包含这些概念，它大概率属于某个单元
UNIT_INDICATORS = {
    'U1': [
        'market for', 'bushels of', 'equilibrium price', 'equilibrium quantity',
        'comparative advantage', 'opportunity cost', 'ppf', 'production possibilities',
        'supply and demand', 'specific product', 'consumer surplus', 'producer surplus'
    ],
    'U2': [
        'gdp calculation', 'nominal gdp', 'real gdp', 'gdp deflator',
        'unemployment rate', 'labor force', 'natural rate of unemployment',
        'frictional unemployment', 'structural unemployment', 'cyclical unemployment',
        'inflation rate', 'cpi increased', 'consumer price index', 'cost-push inflation',
        'demand-pull inflation', 'business cycle', 'recession', 'expansion'
    ],
    'U3': [
        'aggregate demand', 'aggregate supply', 'ad-as', 'sras', 'lras',
        'ad curve', 'as curve', 'fiscal policy', 'government spending', 'multiplier',
        'tax multiplier', 'spending multiplier', 'automatic stabilizers',
        'short-run phillips curve', 'srpc', 'stagflation', 'inflationary gap',
        'recessionary gap', 'self-adjustment', 'wage-price flexibility'
    ],
    'U4': [
        'money demand', 'money supply', 'money market', 'nominal interest rate',
        'bank reserves', 'excess reserves', 'required reserve', 'money multiplier',
        'monetary policy', 'central bank', 'federal reserve', 'fed',
        'open market operations', 'buying bonds', 'selling bonds', 'buy bonds', 'sell bonds',
        'discount rate', 'federal funds rate', 'reserve requirement',
        'loanable funds', 'real interest rate'
    ],
    'U5': [
        'fiscal-monetary', 'policy mix', 'combination of fiscal and monetary',
        'government spending and the central bank', 'economic growth',
        'production function', 'human capital', 'physical capital', 'technology',
        'crowding out', 'crowding-out', 'long-run phillips curve', 'lrpc',
        'supply-side economics', 'rational expectations'
    ],
    'U6': [
        'exchange rate', 'foreign exchange', 'currency appreciation',
        'currency depreciation', 'balance of payments', 'net exports',
        'trade deficit', 'trade surplus', 'tariff', 'quota'
    ]
}

def check_exclusion_violations(text, options_text, unit):
    """检查题目是否包含当前单元不应该出现的概念"""
    combined = (text + ' ' + options_text).lower()
    violations = []
    
    if unit not in UNIT_EXCLUSIONS:
        return violations
    
    exclusions = UNIT_EXCLUSIONS[unit]
    for concept in exclusions['concepts']:
        if concept in combined:
            # 检查是否在例外列表中
            is_exception = any(exc in combined for exc in exclusions.get('exceptions', []))
            if not is_exception:
                violations.append(concept)
    
    return violations

def check_unit_indicators(text, options_text):
    """检查题目包含哪些单元的正向指标"""
    combined = (text + ' ' + options_text).lower()
    indicators = {}
    
    for unit, concepts in UNIT_INDICATORS.items():
        matches = []
        for concept in concepts:
            if concept in combined:
                matches.append(concept)
        if matches:
            indicators[unit] = matches
    
    return indicators

def classify_by_rules(text, options_text, current_unit):
    """
    基于规则判断题目分类
    返回: (is_error, correct_unit, confidence, reasons)
    """
    combined = (text + ' ' + options_text).lower()
    reasons = []
    
    # 检查1：微观 vs 宏观均衡
    # 如果题目提到特定产品市场且没有宏观概念 → U1
    if any(phrase in combined for phrase in [
        'market for bottled water', 'market for wheat', 'market for a good',
        'bushels of', 'bottled water', 'supply of and the demand for a good'
    ]):
        if 'aggregate' not in combined and 'ad-as' not in combined and 'gdp' not in combined:
            if current_unit != 'U1':
                return True, 'U1', 0.95, ['特定产品市场的供需分析 → U1（微观）']
            return False, current_unit, 1.0, ['确认为U1：特定产品市场']
    
    # 检查2：供需同时移动（微观）
    if 'supply' in combined and 'demand' in combined and 'equilibrium' in combined:
        if 'aggregate' not in combined and 'ad-as' not in combined and 'gdp' not in combined:
            if current_unit != 'U1':
                return True, 'U1', 0.9, ['微观供需均衡分析 → U1']
    
    # 检查3：央行买/卖债券（单独）
    if any(phrase in combined for phrase in [
        'central bank sells', 'central bank buys', 'fed sells', 'fed buys',
        'open market purchase', 'open market sale', 'sell bonds', 'buy bonds'
    ]):
        has_fiscal = any(phrase in combined for phrase in [
            'government spending', 'decrease spending', 'increase spending',
            'decrease taxes', 'increase taxes', 'taxation'
        ])
        if not has_fiscal:
            if current_unit not in ['U4', 'U5']:
                return True, 'U4', 0.9, ['央行公开市场操作（无财政政策） → U4']
    
    # 检查4：财政+货币组合 → U5
    has_fiscal = any(phrase in combined for phrase in [
        'government spending', 'decrease spending', 'increase spending',
        'decrease taxes', 'increase taxes', 'taxes'
    ])
    has_monetary = any(phrase in combined for phrase in [
        'central bank', 'fed', 'federal reserve', 'buy bonds', 'sell bonds',
        'open market', 'reserve requirement', 'discount rate', 'money supply'
    ])
    if has_fiscal and has_monetary:
        if current_unit != 'U5':
            return True, 'U5', 0.95, ['财政政策 + 货币政策组合 → U5']
    
    # 检查5：AD-AS模型
    if any(phrase in combined for phrase in [
        'ad-as', 'aggregate demand', 'aggregate supply', 'ad curve', 'as curve'
    ]):
        # 如果有货币政策关键词但AD-AS是核心 → U3
        if 'money supply' not in combined or 'aggregate' in combined:
            if current_unit in ['U2', 'U4', 'U1']:
                return True, 'U3', 0.85, ['AD-AS模型 → U3']
    
    # 检查6：通胀定义 vs 分析
    if 'inflation' in combined and not any(phrase in combined for phrase in [
        'ad-as', 'aggregate demand', 'aggregate supply', 'fiscal policy',
        'monetary policy', 'central bank'
    ]):
        if 'phillips curve' not in combined:
            if current_unit not in ['U2', 'U3']:
                return True, 'U2', 0.8, ['通胀定义/测量（无政策分析） → U2']
    
    # 检查7：菲利普斯曲线
    if 'phillips curve' in combined:
        if 'long-run' in combined or 'lrpc' in combined:
            if current_unit != 'U5':
                return True, 'U5', 0.9, ['长期菲利普斯曲线 → U5']
        else:
            if current_unit != 'U3':
                return True, 'U3', 0.9, ['短期菲利普斯曲线 → U3']
    
    # 检查8：排除概念违规
    violations = check_exclusion_violations(text, options_text, current_unit)
    if violations:
        # 找到题目实际属于哪个单元
        indicators = check_unit_indicators(text, options_text)
        if indicators:
            # 选择匹配最多的单元
            best_unit = max(indicators.keys(), key=lambda u: len(indicators[u]))
            if best_unit != current_unit:
                return True, best_unit, 0.7, [
                    f'当前单元{current_unit}包含不应出现的概念: {violations[0]}',
                    f'题目实际包含{best_unit}的指标: {indicators[best_unit][:3]}'
                ]
        return False, current_unit, 0.5, [f'包含排除概念但无法确定正确单元: {violations[0]}']
    
    return False, current_unit, 1.0, ['无规则触发']


def main():
    if len(sys.argv) < 3:
        print("Usage: python conservative_auditor.py <question_bank.json> <classification_config.json>")
        sys.exit(1)
    
    qb_path = sys.argv[1]
    config_path = sys.argv[2]
    
    print("=" * 60)
    print("AP Macroeconomics Question Bank Conservative Auditor")
    print("=" * 60)
    
    # 加载数据
    print("\n[1/4] 加载数据...")
    qb = load_json(qb_path)
    config = load_json(config_path)
    
    questions = qb if isinstance(qb, list) else qb.get('questions', [])
    print(f"    题库题目数: {len(questions)}")
    
    # 统计当前分布
    print("\n[2/4] 当前分类分布:")
    dist = defaultdict(int)
    for q in questions:
        dist[q.get('primary_unit', 'UNKNOWN')] += 1
    for unit in sorted(dist.keys()):
        print(f"    {unit}: {dist[unit]} 题")
    
    # 审核每道题
    print("\n[3/4] 审核题目...")
    errors = []
    needs_review = []
    
    for i, q in enumerate(questions):
        qid = q.get('question_id', f'Q{i}')
        text = q.get('text', '')
        options = q.get('options', {})
        options_text = ' '.join(str(v) for v in options.values())
        current = q.get('primary_unit', 'UNKNOWN')
        
        is_error, new_unit, confidence, reasons = classify_by_rules(text, options_text, current)
        
        if is_error:
            errors.append({
                'qid': qid,
                'old': current,
                'new': new_unit,
                'confidence': confidence,
                'text': text[:100] + '...' if len(text) > 100 else text,
                'reasons': reasons
            })
        elif confidence < 0.8:
            needs_review.append({
                'qid': qid,
                'current': current,
                'confidence': confidence,
                'text': text[:100] + '...' if len(text) > 100 else text,
                'reasons': reasons
            })
        
        if (i + 1) % 100 == 0:
            print(f"    已处理 {i+1}/{len(questions)} 题...")
    
    print(f"\n    发现 {len(errors)} 题明显分类错误")
    print(f"    发现 {len(needs_review)} 题需要审核")
    
    # 输出报告
    print("\n[4/4] 生成报告...")
    report = {
        'summary': {
            'total_questions': len(questions),
            'errors': len(errors),
            'needs_review': len(needs_review)
        },
        'errors': errors,
        'needs_review': needs_review
    }
    
    report_path = qb_path.replace('.json', '_audit_report.json')
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"    报告保存至: {report_path}")
    
    # 打印错误摘要
    print("\n" + "=" * 60)
    print("明显分类错误")
    print("=" * 60)
    
    if errors:
        # 按单元分组
        by_old_unit = defaultdict(list)
        for e in errors:
            by_old_unit[e['old']].append(e)
        
        for old_unit in sorted(by_old_unit.keys()):
            items = by_old_unit[old_unit]
            print(f"\n从 {old_unit} 移出的 {len(items)} 题:")
            for e in items:
                print(f"  {e['qid']}: {e['old']} → {e['new']} (confidence={e['confidence']:.2f})")
                print(f"    原因: {e['reasons'][0]}")
                print(f"    文本: {e['text']}")
    else:
        print("\n未发现明显分类错误")
    
    if needs_review:
        print(f"\n\n需要审核的题目（前10道）:")
        for r in needs_review[:10]:
            print(f"  {r['qid']}: {r['current']} (confidence={r['confidence']:.2f})")
            print(f"    {r['text']}")
    
    print("\n" + "=" * 60)
    print("审核完成。请检查上述错误并手动修正。")
    print("=" * 60)

if __name__ == '__main__':
    main()
