import json, os, re

# AP Microeconomics classification rules for script-based reclassification
# These rules are more precise than the LLM-based classification to catch obvious errors

UNIT_KEYWORDS = {
    'U1': {
        'strong': ['scarcity', 'opportunity cost', 'production possibilities', 'ppf', 'comparative advantage', 'absolute advantage', 'terms of trade', 'specialization and trade', 'resource allocation', 'economic systems', 'consumer choice', 'budget constraint', 'utility maximization'],
        'weak': ['marginal benefit', 'marginal cost'],  # These can be U1 or U3
        'exclude': ['supply curve', 'demand curve', 'equilibrium price', 'equilibrium quantity', 'elasticity', 'consumer surplus', 'producer surplus', 'tax', 'subsidy', 'price ceiling', 'price floor', 'tariff', 'quota', 'monopoly', 'oligopoly', 'monopolistic competition', 'perfect competition', 'labor market', 'wage', 'externality', 'public good', 'social cost', 'social benefit']
    },
    'U2': {
        'strong': ['supply and demand', 'demand curve', 'supply curve', 'equilibrium price', 'equilibrium quantity', 'market equilibrium', 'price elasticity', 'income elasticity', 'cross-price elasticity', 'consumer surplus', 'producer surplus', 'deadweight loss', 'price ceiling', 'price floor', 'tax incidence', 'subsidy', 'tariff', 'quota', 'international trade'],
        'exclude': ['monopoly', 'oligopoly', 'monopolistic competition', 'perfect competition', 'cost curves', 'marginal cost', 'average total cost', 'labor market', 'wage', 'externality', 'public good']
    },
    'U3': {
        'strong': ['production function', 'marginal product', 'average product', 'total product', 'marginal cost', 'average total cost', 'average variable cost', 'average fixed cost', 'total cost', 'fixed cost', 'variable cost', 'economies of scale', 'diseconomies of scale', 'constant returns to scale', 'perfect competition', 'price taker', 'short-run supply', 'shutdown', 'break-even', 'long-run equilibrium', 'entry and exit', 'zero economic profit'],
        'exclude': ['monopoly', 'oligopoly', 'monopolistic competition', 'game theory', 'labor market', 'wage', 'externality', 'public good']
    },
    'U4': {
        'strong': ['monopoly', 'monopoly power', 'barriers to entry', 'price discrimination', 'monopolistic competition', 'product differentiation', 'excess capacity', 'oligopoly', 'game theory', 'nash equilibrium', 'prisoner', 'collusion', 'cartel', 'dominant strategy', 'non-price competition', 'advertising'],
        'exclude': ['perfect competition', 'labor market', 'wage', 'externality', 'public good']
    },
    'U5': {
        'strong': ['factor markets', 'derived demand', 'marginal revenue product', 'marginal factor cost', 'labor market', 'wage determination', 'minimum wage', 'monopsony', 'land market', 'rent', 'capital market', 'interest'],
        'exclude': ['monopoly', 'oligopoly', 'externality', 'public good']
    },
    'U6': {
        'strong': ['externality', 'negative externality', 'positive externality', 'marginal social cost', 'marginal social benefit', 'socially optimal', 'overproduction', 'underproduction', 'public good', 'free-rider', 'common resource', 'pigouvian', 'government intervention', 'lorenz curve', 'gini coefficient'],
        'exclude': []
    }
}

def classify_question(text):
    """Classify a question based on keyword rules. Returns (unit, confidence, reason)"""
    text_lower = text.lower()
    # 将文本分词，避免子串匹配（如"different"匹配"rent"）
    words = set(re.findall(r'\b[a-z]+\b', text_lower))
    
    scores = {}
    reasons = {}
    
    for unit, rules in UNIT_KEYWORDS.items():
        score = 0
        reason_parts = []
        
        # Strong keywords: must match as whole word in text
        for kw in rules['strong']:
            # 检查关键词是否作为完整词或短语出现
            kw_clean = kw.lower()
            if kw_clean in text_lower:  # 短语匹配
                # 额外检查：确保不是子串匹配
                if re.search(r'\b' + re.escape(kw_clean) + r'\b', text_lower):
                    score += 3
                    reason_parts.append(kw)
                elif len(kw_clean) > 4:  # 长词短语，直接匹配
                    score += 3
                    reason_parts.append(kw)
        
        # Check excluded keywords (-2 each) - must be whole word
        for kw in rules.get('exclude', []):
            kw_clean = kw.lower()
            if len(kw_clean) > 4 and re.search(r'\b' + re.escape(kw_clean) + r'\b', text_lower):
                score -= 2
        
        scores[unit] = score
        reasons[unit] = reason_parts
    
    # Find best unit
    best_unit = max(scores, key=scores.get)
    best_score = scores[best_unit]
    
    # Only reclassify if score is high enough (> 3) and clearly better than others
    if best_score < 3:
        return None, 0, "ambiguous"
    
    # Check if it's clearly the best
    second_best = sorted(scores.values(), reverse=True)[1] if len(scores) > 1 else 0
    if best_score - second_best < 2:
        return None, 0, "too close"
    
    return best_unit, best_score, f"keywords: {', '.join(reasons[best_unit][:3])}"

def main():
    base = r'D:\Lynk\翎英教育LynkEdu\题库系统-web\ap-question-bank'
    
    with open(os.path.join(base, 'public/data/ap/microeconomics/question_bank.json'), 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    changes = []
    no_change = []
    
    for q in data:
        current_unit = q.get('primary_unit', '')
        text = q.get('text', '')
        
        if not text:
            continue
        
        new_unit, confidence, reason = classify_question(text)
        
        if new_unit and new_unit != current_unit:
            changes.append({
                'id': q['question_id'],
                'from': current_unit,
                'to': new_unit,
                'confidence': confidence,
                'reason': reason,
                'text': text[:60]
            })
        elif new_unit == current_unit:
            no_change.append(q['question_id'])
    
    print(f"Questions to reclassify: {len(changes)}")
    print(f"Questions staying same: {len(no_change)}")
    
    # Group by target unit
    by_target = {}
    for c in changes:
        by_target.setdefault(c['to'], []).append(c)
    
    for unit, items in sorted(by_target.items()):
        print(f"\n=== {unit}: {len(items)} questions ===")
        for item in items[:10]:
            print(f"  {item['id']}: {item['from']} -> {item['to']} (conf={item['confidence']}, {item['reason']})")
            print(f"    {item['text']}")
    
    # Save changes for review
    output_path = os.path.join(base, 'public/data/ap/microeconomics/reclassification_proposal.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(changes, f, indent=2, ensure_ascii=False)
    
    print(f"\nSaved {len(changes)} proposed changes to {output_path}")
    
    return {'changes': len(changes), 'by_target': {k: len(v) for k, v in by_target.items()}}

if __name__ == '__main__':
    main()
