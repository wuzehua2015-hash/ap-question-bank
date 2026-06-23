import json
import os
import re

RAW_DIR = "D:/Lynk/翎英教育LynkEdu/题库系统-web/ap-question-bank/public/data/ap/microeconomics/raw_extraction"
OUTPUT_DIR = RAW_DIR

# Load cleaned data
with open(os.path.join(RAW_DIR, "all_mcqs_clean.json"), 'r', encoding='utf-8') as f:
    mcqs = json.load(f)

with open(os.path.join(RAW_DIR, "all_frqs_clean.json"), 'r', encoding='utf-8') as f:
    frqs = json.load(f)

print(f"Loaded {len(mcqs)} MCQs, {len(frqs)} FRQs for classification")

# Define unit keyword patterns for classification
UNIT_KEYWORDS = {
    'U1': [
        'scarcity', 'opportunity cost', 'production possibilities', 'PPF', 'comparative advantage',
        'absolute advantage', 'specialization', 'terms of trade', 'resource allocation', 'economic system',
        'cost-benefit', 'marginal analysis', 'marginal benefit', 'marginal cost', 'utility maximization',
        'budget constraint', 'consumer choice', 'trade-off', 'tradeoff', 'bowed out', 'linear PPF',
        'constant opportunity cost', 'increasing opportunity cost'
    ],
    'U2': [
        'demand curve', 'supply curve', 'equilibrium price', 'equilibrium quantity', 'market equilibrium',
        'shift in demand', 'shift in supply', 'movement along', 'price elasticity', 'income elasticity',
        'cross-price elasticity', 'consumer surplus', 'producer surplus', 'total surplus', 'deadweight loss',
        'price ceiling', 'price floor', 'tax incidence', 'subsidy', 'tariff', 'quota', 'trade restriction',
        'international trade', 'binding price ceiling', 'binding price floor', 'per-unit tax'
    ],
    'U3': [
        'production function', 'marginal product', 'average product', 'total product',
        'marginal cost', 'average total cost', 'average variable cost', 'average fixed cost', 'total cost',
        'fixed cost', 'variable cost', 'cost curve', 'economies of scale', 'diseconomies of scale',
        'constant returns to scale', 'profit maximization', 'MR = MC', 'MR=MC', 'economic profit',
        'perfect competition', 'price taker', 'shutdown', 'break-even', 'long-run equilibrium',
        'zero economic profit', 'entry and exit', 'short-run supply', 'perfectly competitive'
    ],
    'U4': [
        'monopoly', 'monopolistic competition', 'oligopoly', 'price discrimination',
        'game theory', 'Nash equilibrium', 'prisoner\'s dilemma', 'collusion', 'cartel',
        'barriers to entry', 'dominant strategy', 'excess capacity', 'product differentiation',
        'non-price competition', 'advertising', 'monopoly power', 'market power'
    ],
    'U5': [
        'factor market', 'derived demand', 'marginal revenue product', 'MRP', 'marginal factor cost', 'MFC',
        'labor market', 'wage', 'minimum wage', 'monopsony', 'land market', 'rent', 'capital market', 'interest',
        'wage rate', 'employment level', 'hiring', 'workers', 'labor supply', 'labor demand'
    ],
    'U6': [
        'externality', 'negative externality', 'positive externality', 'social cost', 'social benefit',
        'socially optimal', 'overproduction', 'underproduction', 'public good', 'private good',
        'common resource', 'free-rider', 'market failure', 'Pigouvian', 'Lorenz curve', 'Gini coefficient',
        'income inequality', 'government intervention', 'pollution', 'spillover'
    ]
}

# Exclusion keywords - if these are present, reduce probability of a unit
UNIT_EXCLUSIONS = {
    'U1': ['supply curve', 'demand curve', 'equilibrium', 'elasticity', 'consumer surplus', 'producer surplus',
           'production function', 'cost curve', 'perfect competition', 'monopoly', 'factor market', 'externality',
           'public good', 'tax', 'subsidy', 'price ceiling', 'price floor'],
    'U2': ['production function', 'cost curve', 'marginal product', 'perfect competition', 'monopoly', 'factor market',
           'externality', 'public good', 'MRP', 'MFC', 'labor market'],
    'U3': ['monopoly', 'monopolistic competition', 'oligopoly', 'game theory', 'factor market', 'externality',
           'public good', 'price discrimination', 'labor market', 'wage'],
    'U4': ['perfect competition', 'factor market', 'externality', 'public good', 'labor market', 'wage'],
    'U5': ['supply curve', 'demand curve', 'equilibrium price', 'consumer surplus', 'perfect competition', 'monopoly',
           'externality', 'public good'],
    'U6': ['production function', 'cost curve', 'perfect competition', 'monopoly', 'factor market']
}


def classify_question(text, options_text=''):
    """Classify a question to a unit based on keywords."""
    full_text = (text + ' ' + options_text).lower()
    
    unit_scores = {}
    for unit, keywords in UNIT_KEYWORDS.items():
        score = 0
        for kw in keywords:
            # Use word boundary matching for more accuracy
            pattern = r'\b' + re.escape(kw.lower()) + r'\b'
            matches = len(re.findall(pattern, full_text))
            score += matches
        
        # Subtract points for exclusion keywords
        if unit in UNIT_EXCLUSIONS:
            for ex_kw in UNIT_EXCLUSIONS[unit]:
                pattern = r'\b' + re.escape(ex_kw.lower()) + r'\b'
                matches = len(re.findall(pattern, full_text))
                score -= matches * 0.5
        
        unit_scores[unit] = score
    
    # Find units with positive scores
    positive_units = {u: s for u, s in unit_scores.items() if s > 0}
    
    if not positive_units:
        return 'uncategorized'
    
    # Highest unit number rule: if multiple units match, pick the highest-numbered unit
    max_score = max(positive_units.values())
    matching_units = [u for u, s in positive_units.items() if s >= max_score * 0.7]  # Allow 30% tolerance
    
    # Sort by unit number (U6 > U5 > U4 > U3 > U2 > U1)
    matching_units.sort(key=lambda u: int(u[1:]), reverse=True)
    
    return matching_units[0]


def classify_mcqs(mcqs):
    """Classify all MCQs."""
    classified = []
    unit_counts = {}
    
    for q in mcqs:
        options_text = ' '.join(q['options'].values())
        unit = classify_question(q['question'], options_text)
        
        q['unit'] = unit
        classified.append(q)
        
        unit_counts[unit] = unit_counts.get(unit, 0) + 1
    
    return classified, unit_counts


def classify_frqs(frqs):
    """Classify all FRQs."""
    classified = []
    unit_counts = {}
    
    for q in frqs:
        unit = classify_question(q['question'], q.get('scoring_guidelines', ''))
        
        q['unit'] = unit
        classified.append(q)
        
        unit_counts[unit] = unit_counts.get(unit, 0) + 1
    
    return classified, unit_counts


# Classify MCQs
mcqs_classified, mcq_counts = classify_mcqs(mcqs)
print("\nMCQ Classification:")
for unit in sorted(mcq_counts.keys(), key=lambda u: (0, int(u[1:])) if u.startswith('U') else (1, u)):
    print(f"  {unit}: {mcq_counts[unit]}")

# Classify FRQs
frqs_classified, frq_counts = classify_frqs(frqs)
print("\nFRQ Classification:")
for unit in sorted(frq_counts.keys(), key=lambda u: (0, int(u[1:])) if u.startswith('U') else (1, u)):
    print(f"  {unit}: {frq_counts[unit]}")

# Save classified data
with open(os.path.join(OUTPUT_DIR, "all_mcqs_classified.json"), 'w', encoding='utf-8') as f:
    json.dump(mcqs_classified, f, ensure_ascii=False, indent=2)

with open(os.path.join(OUTPUT_DIR, "all_frqs_classified.json"), 'w', encoding='utf-8') as f:
    json.dump(frqs_classified, f, ensure_ascii=False, indent=2)

print(f"\nSaved classified data")

# Show some examples for verification
print("\n=== Sample Classifications ===")
for unit in ['U1', 'U2', 'U3', 'U4', 'U5', 'U6']:
    unit_qs = [q for q in mcqs_classified if q['unit'] == unit]
    if unit_qs:
        q = unit_qs[0]
        print(f"\n{unit}: Q{q['question_num']} ({q['year']})")
        print(f"  {q['question'][:100]}...")
        print(f"  Answer: {q['answer']}")

main = lambda ctx: {"done": True}
