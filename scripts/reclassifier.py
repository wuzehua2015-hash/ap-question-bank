#!/usr/bin/env python3
"""
AP Macroeconomics Question Bank Reclassifier
基于教学顺序的分类器 — 核心标准："学生只学完这个单元能不能做这道题？"

用法：python reclassifier.py <question_bank.json> <classification_config.json>
输出：变更报告 + 更新后的JSON
"""

import json
import sys
import re
from collections import defaultdict
import copy

# ========== 加载规则配置 ==========

def load_config(config_path):
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_question_bank(qb_path):
    with open(qb_path, 'r', encoding='utf-8') as f:
        return json.load(f)

# ========== 文本预处理 ==========

def normalize_text(text):
    """标准化文本用于匹配"""
    text = text.lower()
    # 保留数字和字母，其他转为空格
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def tokenize(text):
    """分词"""
    return set(normalize_text(text).split())

# ========== 核心概念匹配器 ==========

def build_unit_matcher(units):
    """为每个单元构建匹配器"""
    matchers = {}
    for unit in units:
        code = unit['code']
        # 核心概念（正向匹配）
        core_patterns = []
        for concept in unit.get('core_concepts', []):
            # 将概念拆分为关键短语，支持多词匹配
            phrases = concept.lower().split(', ')
            for phrase in phrases:
                phrase = phrase.strip()
                if phrase:
                    core_patterns.append(phrase)
        
        # 排除概念（负向匹配）
        exclude_patterns = []
        for concept in unit.get('excluded_concepts', []):
            phrases = concept.lower().split(', ')
            for phrase in phrases:
                phrase = phrase.strip()
                if phrase:
                    exclude_patterns.append(phrase)
        
        matchers[code] = {
            'core': core_patterns,
            'exclude': exclude_patterns,
            'name': unit['name']
        }
    return matchers

def score_text_against_unit(text, matcher):
    """
    计算文本与单元的匹配分数
    返回: (score, matches, exclusions, reasons)
    """
    text_lower = text.lower()
    words = tokenize(text)
    score = 0
    matches = []
    exclusions = []
    reasons = []
    
    # 核心概念匹配（加权）
    for pattern in matcher['core']:
        if pattern in text_lower:
            # 多词短语权重更高
            weight = 1 + len(pattern.split()) * 0.5
            score += weight
            matches.append(pattern)
            reasons.append(f"+ 核心概念匹配: '{pattern}' (+{weight:.1f})")
    
    # 排除概念匹配（大幅减分）
    for pattern in matcher['exclude']:
        if pattern in text_lower:
            score -= 3.0  # 排除概念大幅减分
            exclusions.append(pattern)
            reasons.append(f"- 排除概念命中: '{pattern}' (-3.0)")
    
    return score, matches, exclusions, reasons

# ========== 特殊规则引擎 ==========

def apply_special_rules(text, options_text, current_unit, all_scores):
    """
    应用跨单元边界规则
    返回: (new_unit, confidence, reasons)
    """
    text_lower = text.lower()
    combined = text_lower + ' ' + options_text.lower()
    reasons = []
    
    # 规则1: 特定产品市场 = U1（不是U3）
    specific_markets = [
        'market for bottled water', 'market for wheat', 'market for cars',
        'market for oil', 'market for gasoline', 'market for coffee',
        'market for corn', 'market for rice', 'market for soybeans',
        'market for apples', 'market for oranges', 'market for bananas',
        'bottled water', 'bushels of wheat', 'wheat at various prices',
        'market for a good', 'price of a good', 'demand for a good',
        'supply of a good', 'demand for bottled water', 'supply of bottled water'
    ]
    if any(market in combined for market in specific_markets):
        if 'aggregate demand' not in combined and 'ad-as' not in combined and 'aggregate supply' not in combined:
            if 'gdp' not in combined and 'inflation' not in combined and 'unemployment' not in combined:
                return 'U1', 0.95, ['[RULE] 特定产品市场 → U1（微观供需，不是宏观AD-AS）']
    
    # 规则2: 供需同时移动且是微观市场 = U1
    if 'supply' in combined and 'demand' in combined and 'equilibrium' in combined:
        if 'aggregate' not in combined and 'ad-as' not in combined:
            if 'gdp' not in combined and 'unemployment' not in combined:
                return 'U1', 0.9, ['[RULE] 微观供需均衡分析 → U1']
    
    # 规则3: 通胀的定义/类型/测量 = U2（不是U3）
    if any(phrase in text_lower for phrase in [
        'measure of inflation', 'inflation rate', 'cpi increased',
        'consumer price index', 'gdp deflator', 'nominal gdp', 'real gdp',
        'type of unemployment', 'natural rate', 'labor force', 'frictional',
        'structural', 'cyclical unemployment', 'business cycle'
    ]):
        if 'ad-as' not in combined and 'aggregate demand' not in combined and 'aggregate supply' not in combined:
            if 'fiscal policy' not in combined and 'monetary policy' not in combined and 'central bank' not in combined:
                return 'U2', 0.85, ['[RULE] 通胀/失业的定义和测量 → U2（无AD-AS分析）']
    
    # 规则4: 央行买/卖债券（单独出现）= U4
    if any(phrase in combined for phrase in [
        'central bank sells', 'central bank buys', 'fed sells', 'fed buys',
        'federal reserve sells', 'federal reserve buys',
        'open market purchase', 'open market sale',
        'open market operations', 'selling bonds', 'buying bonds',
        'sell bonds', 'buy bonds', 'sell government bonds', 'buy government bonds'
    ]):
        # 检查是否同时有财政政策
        has_fiscal = any(phrase in combined for phrase in [
            'government spending', 'decrease spending', 'increase spending',
            'decrease taxes', 'increase taxes', 'taxes', 'fiscal policy'
        ])
        if not has_fiscal:
            return 'U4', 0.9, ['[RULE] 央行公开市场操作（无财政政策）→ U4']
    
    # 规则5: 财政政策 + 货币政策 = U5
    if has_fiscal := any(phrase in combined for phrase in [
        'government spending', 'decrease spending', 'increase spending',
        'decrease taxes', 'increase taxes', 'taxes'
    ]):
        if any(phrase in combined for phrase in [
            'central bank', 'fed', 'federal reserve', 'buy bonds', 'sell bonds',
            'open market', 'reserve requirement', 'discount rate', 'money supply'
        ]):
            return 'U5', 0.95, ['[RULE] 财政政策 + 货币政策组合 → U5']
    
    # 规则6: AD-AS模型相关 = U3
    if any(phrase in combined for phrase in [
        'ad-as', 'aggregate demand', 'aggregate supply', 'sas', 'lras', 'sras',
        'ad curve', 'as curve', 'aggregate output', 'price level', 'real gdp'
    ]):
        # 排除货币政策单独考察的情况
        if not any(phrase in combined for phrase in [
            'money demand', 'money supply', 'money market', 'bank reserves',
            'open market', 'buy bonds', 'sell bonds', 'central bank'
        ]) or 'ad' in combined or 'aggregate demand' in combined:
            # 如果同时有AD-AS和通胀，优先U3（因为AD-AS分析框架是U3）
            if 'inflation' in combined and any(phrase in combined for phrase in ['ad-as', 'aggregate demand', 'aggregate supply']):
                return 'U3', 0.9, ['[RULE] AD-AS模型分析通胀 → U3（不是U2的定义性通胀）']
            if current_unit == 'U2':
                return 'U3', 0.85, ['[RULE] 含有AD-AS模型 → U3（不是U2）']
    
    # 规则7: 汇率/国际贸易 = U6
    if any(phrase in combined for phrase in [
        'exchange rate', 'currency', 'appreciation', 'depreciation',
        'foreign exchange', 'net exports', 'trade deficit', 'trade surplus',
        'balance of payments', 'tariff', 'quota', 'capital flows'
    ]):
        return 'U6', 0.85, ['[RULE] 汇率/国际贸易 → U6']
    
    # 规则8: 长期增长 = U5
    if any(phrase in combined for phrase in [
        'long-run growth', 'economic growth', 'production function',
        'human capital', 'physical capital', 'technology', 'labor productivity',
        'crowding out', 'long-run phillips curve'
    ]):
        if 'ad-as' not in combined or 'growth' in combined:
            return 'U5', 0.85, ['[RULE] 长期增长/生产函数/挤出效应 → U5']
    
    # 规则9: 钱/银行/利率（货币政策的利率） = U4
    if any(phrase in combined for phrase in [
        'money demand', 'money supply', 'money market', 'nominal interest rate',
        'bank reserves', 'excess reserves', 'required reserve', 'money multiplier',
        'loanable funds', 'discount rate', 'federal funds rate'
    ]):
        if not any(phrase in combined for phrase in ['government spending', 'taxes', 'fiscal policy']):
            return 'U4', 0.85, ['[RULE] 货币/银行/利率 → U4']
    
    # 规则10: 菲利普斯曲线区分
    if 'phillips curve' in combined:
        if 'long-run' in combined or 'lrpc' in combined:
            return 'U5', 0.9, ['[RULE] 长期菲利普斯曲线 → U5']
        else:
            return 'U3', 0.9, ['[RULE] 短期菲利普斯曲线 → U3']
    
    # 规则11: 财政政策的乘数效应 = U3
    if any(phrase in combined for phrase in [
        'multiplier', 'spending multiplier', 'tax multiplier',
        'government spending increases', 'government spending decreases'
    ]):
        if not any(phrase in combined for phrase in ['central bank', 'fed', 'buy bonds', 'sell bonds', 'monetary policy']):
            return 'U3', 0.85, ['[RULE] 财政政策乘数效应 → U3']
    
    # 规则12: 货币政策影响AD（但核心是货币传导机制）
    if 'aggregate demand' in combined and any(phrase in combined for phrase in ['money supply', 'central bank', 'fed']):
        if 'money market' in combined or 'loanable funds' in combined:
            return 'U4', 0.8, ['[RULE] 货币政策传导机制 → U4']
    
    return None, 0, reasons

# ========== 主分类器 ==========

def classify_question(q, config, matchers):
    """
    对单道题进行分类
    返回: (new_unit, confidence, reasons, needs_review)
    """
    text = q.get('text', '')
    options = q.get('options', {})
    options_text = ' '.join(str(v) for v in options.values())
    combined = text + ' ' + options_text
    current = q.get('primary_unit', '')
    
    # 第一步：应用特殊规则
    special_unit, special_conf, special_reasons = apply_special_rules(text, options_text, current, {})
    if special_unit:
        return special_unit, special_conf, special_reasons, False
    
    # 第二步：基于概念匹配打分
    scores = {}
    all_reasons = []
    for code, matcher in matchers.items():
        score, matches, exclusions, reasons = score_text_against_unit(combined, matcher)
        scores[code] = {
            'score': score,
            'matches': matches,
            'exclusions': exclusions
        }
        all_reasons.extend([f"[{code}] {r}" for r in reasons])
    
    # 第三步：选择最高分
    sorted_units = sorted(scores.items(), key=lambda x: x[1]['score'], reverse=True)
    best_unit, best_data = sorted_units[0]
    best_score = best_data['score']
    
    # 如果最高分为负或0，说明规则无法匹配，需要人工审核
    if best_score <= 0:
        return current, 0.0, all_reasons + ['[NEEDS_REVIEW] 规则无法确定分类'], True
    
    # 检查第二名的分数差距
    if len(sorted_units) > 1:
        second_unit, second_data = sorted_units[1]
        second_score = second_data['score']
        if best_score - second_score < 1.0:
            # 分数接近，需要审核
            return best_unit, 0.5, all_reasons + [
                f'[NEEDS_REVIEW] 分数接近: {best_unit}={best_score:.1f} vs {second_unit}={second_score:.1f}'
            ], True
    
    confidence = min(0.7 + best_score * 0.1, 0.95)
    return best_unit, confidence, all_reasons, False

# ========== 主程序 ==========

def main():
    if len(sys.argv) < 3:
        print("Usage: python reclassifier.py <question_bank.json> <classification_config.json>")
        sys.exit(1)
    
    qb_path = sys.argv[1]
    config_path = sys.argv[2]
    
    print("=" * 60)
    print("AP Macroeconomics Question Bank Reclassifier")
    print("=" * 60)
    
    # 加载数据
    print("\n[1/5] 加载题库和规则配置...")
    qb = load_question_bank(qb_path)
    config = load_config(config_path)
    
    questions = qb if isinstance(qb, list) else qb.get('questions', [])
    print(f"    题库题目数: {len(questions)}")
    
    units = config['units']
    print(f"    规则单元数: {len(units)}")
    
    # 构建匹配器
    print("\n[2/5] 构建分类匹配器...")
    matchers = build_unit_matcher(units)
    
    # 统计当前分类分布
    print("\n[3/5] 当前分类分布:")
    current_dist = defaultdict(int)
    for q in questions:
        current_dist[q.get('primary_unit', 'UNKNOWN')] += 1
    for unit in sorted(current_dist.keys()):
        print(f"    {unit}: {current_dist[unit]} 题")
    
    # 重新分类
    print("\n[4/5] 重新分类题目...")
    changes = []
    needs_review = []
    
    for i, q in enumerate(questions):
        qid = q.get('question_id', f'Q{i}')
        old_unit = q.get('primary_unit', 'UNKNOWN')
        
        new_unit, confidence, reasons, review = classify_question(q, config, matchers)
        
        if review:
            needs_review.append({
                'qid': qid,
                'old': old_unit,
                'proposed': new_unit,
                'confidence': confidence,
                'text': q.get('text', '')[:120] + '...',
                'reasons': reasons
            })
        elif new_unit != old_unit:
            changes.append({
                'qid': qid,
                'old': old_unit,
                'new': new_unit,
                'confidence': confidence,
                'text': q.get('text', '')[:120] + '...',
                'reasons': reasons
            })
            # 更新题目
            q['primary_unit'] = new_unit
            q['classification_reasoning'] = f"Reclassified by rule engine: {new_unit} (confidence={confidence:.2f}). " + ' | '.join([r for r in reasons if not r.startswith('[') or '[RULE]' in r])
            if 'secondary_units' in q and old_unit in q['secondary_units']:
                q['secondary_units'].remove(old_unit)
            if 'secondary_units' in q and new_unit not in q['secondary_units']:
                q['secondary_units'].append(new_unit)
        
        if (i + 1) % 100 == 0:
            print(f"    已处理 {i+1}/{len(questions)} 题...")
    
    print(f"    完成！发现 {len(changes)} 处变更，{len(needs_review)} 题需要审核")
    
    # 输出变更报告
    print("\n[5/5] 生成报告...")
    
    # 新分布
    new_dist = defaultdict(int)
    for q in questions:
        new_dist[q.get('primary_unit', 'UNKNOWN')] += 1
    
    # 保存报告
    report = {
        'summary': {
            'total_questions': len(questions),
            'changes': len(changes),
            'needs_review': len(needs_review),
            'old_distribution': dict(current_dist),
            'new_distribution': dict(new_dist)
        },
        'changes': changes,
        'needs_review': needs_review
    }
    
    report_path = qb_path.replace('.json', '_reclassification_report.json')
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"    报告保存至: {report_path}")
    
    # 保存更新后的题库
    updated_path = qb_path
    with open(updated_path, 'w', encoding='utf-8') as f:
        json.dump(qb, f, indent=2, ensure_ascii=False)
    print(f"    更新题库保存至: {updated_path}")
    
    # 打印变更摘要
    print("\n" + "=" * 60)
    print("分类变更摘要")
    print("=" * 60)
    
    if changes:
        print(f"\n共 {len(changes)} 题分类变更:")
        for c in changes:
            print(f"  {c['qid']}: {c['old']} → {c['new']} (confidence={c['confidence']:.2f})")
            print(f"    {c['text']}")
    else:
        print("\n无分类变更")
    
    if needs_review:
        print(f"\n共 {len(needs_review)} 题需要人工审核:")
        for r in needs_review[:20]:  # 只显示前20个
            print(f"  {r['qid']}: {r['old']} → {r['proposed']}? (confidence={r['confidence']:.2f})")
            print(f"    {r['text']}")
        if len(needs_review) > 20:
            print(f"    ... 还有 {len(needs_review) - 20} 题")
    else:
        print("\n无需要审核的题目")
    
    print("\n" + "=" * 60)
    print("处理完成")
    print("=" * 60)

if __name__ == '__main__':
    main()
