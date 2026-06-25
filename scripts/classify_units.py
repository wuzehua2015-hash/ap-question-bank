import json
import re

with open('public/data/ap/microeconomics/question_bank.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

# AP Microeconomics unit classification rules based on keywords
unit_rules = {
    'U1': {
        'keywords': ['opportunity cost', 'production possibilities', 'scarcity', 'trade-off', 'comparative advantage', 'absolute advantage', 'marginal utility', 'budget constraint', 'allocate', 'efficiency', 'equity', 'economic profit', 'accounting profit'],
        'patterns': [r'\bPPF\b', r'\bproduction possibility\b', r'\bopportunity cost\b']
    },
    'U2': {
        'keywords': ['supply', 'demand', 'equilibrium', 'price ceiling', 'price floor', 'elasticity', 'consumer surplus', 'producer surplus', 'tax', 'tariff', 'subsidy', 'quota', 'deadweight loss', 'market price', 'quantity demanded', 'quantity supplied'],
        'patterns': [r'\belastic\b', r'\binelastic\b', r'\bprice ceiling\b', r'\bprice floor\b', r'\bconsumer surplus\b', r'\bproducer surplus\b']
    },
    'U3': {
        'keywords': ['production function', 'marginal product', 'average product', 'total product', 'cost', 'total cost', 'average total cost', 'average variable cost', 'marginal cost', 'fixed cost', 'variable cost', 'perfectly competitive', 'profit-maximizing', 'shutdown', 'break-even', 'long-run equilibrium', 'short-run', 'constant returns', 'economies of scale', 'diseconomies of scale'],
        'patterns': [r'\bperfectly competitive\b', r'\bmarginal cost\b', r'\baverage total cost\b', r'\bproduction function\b']
    },
    'U4': {
        'keywords': ['monopoly', 'monopolistic competition', 'oligopoly', 'cartel', 'collusion', 'game theory', 'dominant strategy', 'Nash equilibrium', 'price discrimination', 'natural monopoly', 'barriers to entry', 'market power', 'monopolist', 'duopoly', 'payoff matrix'],
        'patterns': [r'\bmonopol(?:y|ist|istic)\b', r'\boligopol(?:y|ist|istic)\b', r'\bgame theory\b', r'\bpayoff matrix\b']
    },
    'U5': {
        'keywords': ['labor market', 'wage', 'marginal revenue product', 'monopsony', 'minimum wage', 'union', 'derived demand', 'factor market', 'human capital', 'compensating differentials', 'marginal product of labor', 'marginal product of capital', 'least-cost combination'],
        'patterns': [r'\blabor market\b', r'\bwage\b', r'\bmonopsony\b', r'\bmarginal revenue product\b', r'\bderived demand\b']
    },
    'U6': {
        'keywords': ['externality', 'public good', 'free-rider', 'common resource', 'tragedy of the commons', 'government intervention', 'regulation', 'antitrust', 'property rights', 'Coase theorem', 'positive externality', 'negative externality', 'socially optimal', 'market failure', 'income distribution', 'Gini coefficient', 'Lorenz curve', 'poverty'],
        'patterns': [r'\bexternality\b', r'\bpublic good\b', r'\bmarket failure\b', r'\bsocially optimal\b']
    }
}

for q in questions:
    text = (q['text'] + ' ' + ' '.join(q['options'].values())).lower()
    
    # Score each unit
    scores = {unit: 0 for unit in unit_rules}
    for unit, rules in unit_rules.items():
        for kw in rules['keywords']:
            if kw.lower() in text:
                scores[unit] += 1
        for pattern in rules['patterns']:
            if re.search(pattern, text, re.IGNORECASE):
                scores[unit] += 2
    
    # Assign primary unit (highest score)
    if max(scores.values()) > 0:
        primary = max(scores, key=scores.get)
        q['primary_unit'] = primary
        
        # Find secondary units (score > 0 but not primary)
        secondaries = [u for u, s in scores.items() if s > 0 and u != primary]
        # Sort by score descending
        secondaries.sort(key=lambda u: scores[u], reverse=True)
        q['secondary_units'] = secondaries[:2]  # Max 2 secondary units
        q['pure_unit'] = len(secondaries) == 0
        
        # Classification reasoning
        q['classification_reasoning'] = f'Primary: {primary} (score {scores[primary]}). Secondary: {secondaries} (scores {[scores[s] for s in secondaries]})'
    else:
        q['primary_unit'] = 'U1'
        q['secondary_units'] = []
        q['pure_unit'] = True
        q['classification_reasoning'] = 'Default: U1 (no matching keywords)'

# Save
with open('public/data/ap/microeconomics/question_bank.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

print('Unit classification complete!')

# Summary
unit_counts = {}
for q in questions:
    u = q['primary_unit']
    unit_counts[u] = unit_counts.get(u, 0) + 1

print('\nUnit distribution:')
for u in ['U1', 'U2', 'U3', 'U4', 'U5', 'U6']:
    print(f'  {u}: {unit_counts.get(u, 0)} questions')

print(f'\nTotal: {len(questions)} questions')
print('Done!')
