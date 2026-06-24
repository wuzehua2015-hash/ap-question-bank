#!/usr/bin/env python3
"""
Final classification fix with text normalization.
- Normalizes whitespace before matching (handles line breaks in PDF text)
- Exclusion concepts checked only in question text (not options)
- Boundary rules only boost eligible units
- Regenerates similarity index
"""
import json, re
from pathlib import Path
from collections import Counter
from itertools import combinations

OUT_DIR = Path("D:/Lynk/翎英教育LynkEdu/题库系统-web/ap-question-bank/public/data/ap/microeconomics")

with open(OUT_DIR / 'classification_config.json', encoding='utf-8') as f:
    config = json.load(f)

with open(OUT_DIR / 'question_bank.json', encoding='utf-8') as f:
    questions = json.load(f)

units = config['units']

def main(ctx):
    for q in questions:
        # Normalize whitespace: remove line breaks and normalize spaces
        text = ' '.join(q['text'].lower().split())
        opts = ' '.join(' '.join(q['options'].values()).lower().split())
        full = f"{text} {opts}"
        
        # Step 1: Exclusion — only in question text, normalized
        eligible = set(u['code'] for u in units)
        for unit in units:
            for excl in unit.get('excluded_concepts', []):
                excl_lower = ' '.join(excl.lower().split())
                pattern = r'(?:^|[^a-z])' + re.escape(excl_lower) + r'(?:[^a-z]|$)'
                if re.search(pattern, text):
                    eligible.discard(unit['code'])
        
        if not eligible:
            eligible = {'U1'}
        
        # Step 2: Score eligible units
        scores = {}
        for unit in units:
            uid = unit['code']
            if uid not in eligible:
                continue
            score = 0
            for kw in unit.get('core_concepts', []):
                kw_lower = ' '.join(kw.lower().split())
                pattern = r'(?:^|[^a-z])' + re.escape(kw_lower) + r'(?:[^a-z]|$)'
                if re.search(pattern, full):
                    score += 3
            for kw in unit.get('weight_keywords', []):
                kw_lower = ' '.join(kw.lower().split())
                pattern = r'(?:^|[^a-z])' + re.escape(kw_lower) + r'(?:[^a-z]|$)'
                if re.search(pattern, full):
                    score += 2
            scores[uid] = score
        
        # Step 3: Boundary rules only for eligible units
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
        q['topics'] = [kw for kw in unit.get('core_concepts', []) if re.search(r'(?:^|[^a-z])' + re.escape(' '.join(kw.lower().split())) + r'(?:[^a-z]|$)', full)][:3]
        q['pure_unit'] = len(secondary) == 0
    
    with open(OUT_DIR / 'question_bank.json', 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    
    # Audit with normalized text
    hard_errors = []
    warnings = []
    for q in questions:
        qid = q['question_id']
        text = ' '.join(q['text'].lower().split())
        primary = q['primary_unit']
        
        for unit in units:
            if unit['code'] == primary:
                for excl in unit.get('excluded_concepts', []):
                    excl_lower = ' '.join(excl.lower().split())
                    pattern = r'(?:^|[^a-z])' + re.escape(excl_lower) + r'(?:[^a-z]|$)'
                    if re.search(pattern, text):
                        hard_errors.append(f"{qid}: EXCLUSION_VIOLATION in {primary} - '{excl}'")
        
        opts = ' '.join(' '.join(q['options'].values()).lower().split())
        full = f"{text} {opts}"
        unit = next(u for u in units if u['code'] == primary)
        core_found = any(re.search(r'(?:^|[^a-z])' + re.escape(' '.join(kw.lower().split())) + r'(?:[^a-z]|$)', full) for kw in unit.get('core_concepts', []))
        if not core_found:
            warnings.append(f"{qid}: NO_CORE_CONCEPT in {primary}")
    
    dist = Counter(q['primary_unit'] for q in questions)
    print(f"=== Final Classification ===")
    print(f"Total: {len(questions)}")
    print(f"Hard errors: {len(hard_errors)}")
    print(f"Warnings: {len(warnings)}")
    for u in units:
        print(f"  {u['code']} ({u['name']}): {dist.get(u['code'], 0)} (target {u['weighting']})")
    
    if hard_errors:
        print(f"\nHard errors:")
        for e in hard_errors:
            print(f"  {e}")
    if warnings:
        print(f"\nWarnings (first 10):")
        for w in warnings[:10]:
            print(f"  {w}")
    
    # Regenerate similarity index
    sim_index = {}
    for q in questions:
        sim_index[q['question_id']] = {
            'similar_questions': [],
            'unit': q['primary_unit'],
            'topics': q['topics']
        }
    
    for a, b in combinations(questions, 2):
        if a['primary_unit'] == b['primary_unit']:
            overlap = len(set(a['topics']) & set(b['topics']))
            if overlap >= 1:
                sim = 0.6 + 0.1 * overlap
                sim_index[a['question_id']]['similar_questions'].append({
                    'question_id': b['question_id'], 'similarity': sim,
                    'reason': f"Shared: {list(set(a['topics']) & set(b['topics']))}"
                })
                sim_index[b['question_id']]['similar_questions'].append({
                    'question_id': a['question_id'], 'similarity': sim,
                    'reason': f"Shared: {list(set(a['topics']) & set(b['topics']))}"
                })
    
    for qid in sim_index:
        sim_index[qid]['similar_questions'] = sorted(
            sim_index[qid]['similar_questions'], 
            key=lambda x: x['similarity'], reverse=True
        )[:3]
    
    with open(OUT_DIR / 'similarity_index.json', 'w', encoding='utf-8') as f:
        json.dump(sim_index, f, ensure_ascii=False, indent=2)
    
    print(f"Similarity index: {len(sim_index)} entries")
    
    return {'hard_errors': len(hard_errors), 'warnings': len(warnings), 'distribution': dict(dist)}
