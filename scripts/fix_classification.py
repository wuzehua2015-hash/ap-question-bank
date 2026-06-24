#!/usr/bin/env python3
"""Fix classification bug: boundary rules must respect eligible set."""
import json, re
from pathlib import Path
from collections import Counter

OUT_DIR = Path("D:/Lynk/翎英教育LynkEdu/题库系统-web/ap-question-bank/public/data/ap/microeconomics")

with open(OUT_DIR / 'classification_config.json', encoding='utf-8') as f:
    config = json.load(f)

with open(OUT_DIR / 'question_bank.json', encoding='utf-8') as f:
    questions = json.load(f)

units = config['units']

def main(ctx):
    for q in questions:
        text = q['text'].lower()
        opts = ' '.join(q['options'].values()).lower()
        full = f"{text} {opts}"
        
        # Step 1: 排除法 — 只在题干中检查排除概念
        eligible = set(u['code'] for u in units)
        for unit in units:
            for excl in unit.get('excluded_concepts', []):
                excl_lower = excl.lower()
                pattern = r'(?:^|[^a-z])' + re.escape(excl_lower) + r'(?:[^a-z]|$)'
                if re.search(pattern, text):
                    eligible.discard(unit['code'])
        
        if not eligible:
            eligible = {'U1'}
        
        # Step 2: 在 eligible 单元中按核心概念匹配计分（题干+选项）
        scores = {}
        for unit in units:
            uid = unit['code']
            if uid not in eligible:
                continue
            score = 0
            for kw in unit.get('core_concepts', []):
                kw_lower = kw.lower()
                pattern = r'(?:^|[^a-z])' + re.escape(kw_lower) + r'(?:[^a-z]|$)'
                if re.search(pattern, full):
                    score += 3
            for kw in unit.get('weight_keywords', []):
                kw_lower = kw.lower()
                pattern = r'(?:^|[^a-z])' + re.escape(kw_lower) + r'(?:[^a-z]|$)'
                if re.search(pattern, full):
                    score += 2
            scores[uid] = score
        
        # Step 3: 边界规则增强（只给 eligible 单元加分）
        if 'perfectly competitive' in text and 'U3' in eligible:
            scores['U3'] = scores.get('U3', 0) + 20
        elif 'monopolistic competition' in text and 'U4' in eligible:
            scores['U4'] = scores.get('U4', 0) + 20
        elif 'oligopoly' in text and 'U4' in eligible:
            scores['U4'] = scores.get('U4', 0) + 20
        elif 'game' in text or 'payoff' in text or 'dominant strategy' in text:
            if 'U4' in eligible:
                scores['U4'] = scores.get('U4', 0) + 20
        if 'external' in text or 'spillover' in text:
            if 'U6' in eligible:
                scores['U6'] = scores.get('U6', 0) + 20
        if 'public good' in text or 'free rider' in text:
            if 'U6' in eligible:
                scores['U6'] = scores.get('U6', 0) + 20
        if 'common resource' in text or 'tragedy' in text:
            if 'U6' in eligible:
                scores['U6'] = scores.get('U6', 0) + 20
        if 'tax' in text or 'subsidy' in text or 'tariff' in text:
            if 'U5' in eligible:
                scores['U5'] = scores.get('U5', 0) + 20
        if 'government' in text and ('price' in text or 'ceiling' in text or 'floor' in text or 'quota' in text):
            if 'U5' in eligible:
                scores['U5'] = scores.get('U5', 0) + 20
        if 'deadweight' in text or 'dead weight' in text:
            if 'U5' in eligible:
                scores['U5'] = scores.get('U5', 0) + 20
        if 'opportunity' in text or 'ppc' in text or ('production' in text and 'possibility' in text):
            if 'U1' in eligible:
                scores['U1'] = scores.get('U1', 0) + 20
        if 'consumer' in text and 'surplus' in text:
            if 'U2' in eligible:
                scores['U2'] = scores.get('U2', 0) + 20
        if 'producer' in text and 'surplus' in text:
            if 'U2' in eligible:
                scores['U2'] = scores.get('U2', 0) + 20
        if 'demand' in text and 'supply' in text and 'equilibrium' in text:
            if 'U2' in eligible:
                scores['U2'] = scores.get('U2', 0) + 20
        if 'supply' in text and 'elastic' in text:
            if 'U2' in eligible:
                scores['U2'] = scores.get('U2', 0) + 20
        if 'factor' in text and 'market' in text:
            if 'U2' in eligible:
                scores['U2'] = scores.get('U2', 0) + 20
        if 'labor' in text or 'wage' in text or 'capital' in text:
            if 'U2' in eligible:
                scores['U2'] = scores.get('U2', 0) + 15
        if 'cost' in text and 'curve' in text:
            if 'U3' in eligible:
                scores['U3'] = scores.get('U3', 0) + 20
        if 'profit' in text and 'maxim' in text:
            if 'U3' in eligible:
                scores['U3'] = scores.get('U3', 0) + 20
        if 'marginal' in text and 'revenue' in text and 'cost' in text:
            if 'U3' in eligible:
                scores['U3'] = scores.get('U3', 0) + 20
        
        # 选择最高分
        if not scores or max(scores.values()) < 0:
            primary = 'U1'
        else:
            primary = max(scores, key=scores.get)
        
        secondary = sorted([uid for uid, s in scores.items() if s > 0 and uid != primary], 
                            key=lambda u: scores[u], reverse=True)[:2]
        
        q['primary_unit'] = primary
        q['secondary_units'] = secondary
        q['classification_reasoning'] = f"Eligible: {eligible}, Scores: {scores}"
        unit = next(u for u in units if u['code'] == primary)
        q['topics'] = [kw for kw in unit.get('core_concepts', []) if re.search(r'(?:^|[^a-z])' + re.escape(kw.lower()) + r'(?:[^a-z]|$)', full)][:3]
        q['pure_unit'] = len(secondary) == 0
    
    with open(OUT_DIR / 'question_bank.json', 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    
    # 重新审计
    hard_errors = []
    warnings = []
    for q in questions:
        qid = q['question_id']
        text = q['text'].lower()
        primary = q['primary_unit']
        
        for unit in units:
            if unit['code'] == primary:
                for excl in unit.get('excluded_concepts', []):
                    pattern = r'(?:^|[^a-z])' + re.escape(excl.lower()) + r'(?:[^a-z]|$)'
                    if re.search(pattern, text):
                        hard_errors.append(f"{qid}: EXCLUSION_VIOLATION in {primary} - '{excl}'")
        
        opts = ' '.join(q['options'].values()).lower()
        full = f"{text} {opts}"
        unit = next(u for u in units if u['code'] == primary)
        core_found = any(re.search(r'(?:^|[^a-z])' + re.escape(kw.lower()) + r'(?:[^a-z]|$)', full) 
                         for kw in unit.get('core_concepts', []))
        if not core_found:
            warnings.append(f"{qid}: NO_CORE_CONCEPT in {primary}")
    
    dist = Counter(q['primary_unit'] for q in questions)
    print(f"=== 修复后审计 ===")
    print(f"总题数: {len(questions)}")
    print(f"硬性错误: {len(hard_errors)}")
    print(f"警告: {len(warnings)}")
    print(f"\n单元分布:")
    for u in units:
        print(f"  {u['code']} ({u['name']}): {dist.get(u['code'], 0)} (目标 {u['weighting']})")
    
    if hard_errors:
        print(f"\n❌ 硬性错误 (前10):")
        for e in hard_errors[:10]:
            print(f"  {e}")
    if warnings:
        print(f"\n⚠️ 警告 (前10):")
        for w in warnings[:10]:
            print(f"  {w}")
    
    return {
        'hard_errors': len(hard_errors),
        'warnings': len(warnings),
        'distribution': dict(dist)
    }
