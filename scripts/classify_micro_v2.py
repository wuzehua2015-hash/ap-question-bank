import json
import os
import re

RAW_DIR = "D:/Lynk/翎英教育LynkEdu/题库系统-web/ap-question-bank/public/data/ap/microeconomics/raw_extraction"
OUTPUT_DIR = RAW_DIR

with open(os.path.join(RAW_DIR, "all_mcqs_clean.json"), 'r', encoding='utf-8') as f:
    mcqs = json.load(f)

with open(os.path.join(RAW_DIR, "all_frqs_clean.json"), 'r', encoding='utf-8') as f:
    frqs = json.load(f)

print(f"Loaded {len(mcqs)} MCQs, {len(frqs)} FRQs for re-classification")

# Revised keyword system with broader matching and more concepts
UNIT_KEYWORDS = {
    'U1': {
        # Strong keywords (high confidence)
        'strong': [
            'scarcity', 'opportunity cost', 'production possibilities', 'PPF', 'comparative advantage',
            'absolute advantage', 'terms of trade', 'resource allocation', 'economic system',
            'cost-benefit', 'marginal benefit', 'marginal cost', 'utility maximization',
            'budget constraint', 'consumer choice', 'diminishing marginal utility', 'total utility',
            'marginal utility', 'trade-off', 'tradeoff', 'bowed out', 'PPF', 'constant opportunity cost',
            'increasing opportunity cost', 'basic economic problem', 'wants and needs'
        ],
        # Moderate keywords (need context)
        'moderate': [
            'income doubles', 'prices double', 'budget', 'consumer', 'spends entire income',
            'scarce', 'not scarce', 'best use of', 'limited resources', 'unlimited wants'
        ]
    },
    'U2': {
        'strong': [
            'equilibrium price', 'equilibrium quantity', 'market equilibrium',
            'price elasticity', 'income elasticity', 'cross-price elasticity', 'elasticity of demand',
            'elasticity of supply', 'consumer surplus', 'producer surplus', 'total surplus', 'deadweight loss',
            'price ceiling', 'price floor', 'binding price ceiling', 'binding price floor',
            'tax incidence', 'per-unit tax', 'unit tax', 'specific tax', 'ad valorem tax',
            'tariff', 'quota', 'trade restriction', 'international trade', 'import quota',
            'subsidy', 'excise tax', 'sales tax'
        ],
        'moderate': [
            'supply and demand', 'supply of', 'demand for', 'supply decreases', 'demand increases',
            'shift in supply', 'shift in demand', 'movement along', 'market price', 'market quantity',
            'substitutes', 'complements', 'complementary', 'inferior good', 'normal good',
            'elastic', 'inelastic', 'unit elastic', 'perfectly elastic', 'perfectly inelastic',
            'price increases', 'price decreases', 'quantity demanded', 'quantity supplied',
            'cotton price', 'supply curve', 'demand curve', 'supply schedule', 'demand schedule'
        ]
    },
    'U3': {
        'strong': [
            'production function', 'marginal product', 'average product', 'total product',
            'marginal cost', 'average total cost', 'average variable cost', 'average fixed cost', 'total cost',
            'fixed cost', 'variable cost', 'cost curve', 'MC curve', 'ATC curve', 'AVC curve',
            'economies of scale', 'diseconomies of scale', 'constant returns to scale', 'minimum efficient scale',
            'profit maximization', 'MR = MC', 'MR=MC', 'economic profit', 'accounting profit', 'normal profit',
            'perfect competition', 'price taker', 'shutdown', 'break-even', 'long-run equilibrium',
            'zero economic profit', 'entry and exit', 'short-run supply', 'perfectly competitive',
            'constant-cost industry', 'increasing-cost industry', 'decreasing-cost industry',
            'marginal revenue', 'average revenue', 'total revenue', 'profit per unit'
        ],
        'moderate': [
            'producing', 'output', 'output increases', 'output produced', 'firm produces',
            'revenue is increasing', 'marginal revenue', 'total revenue', 'profit', 'profits',
            'average cost', 'cost', 'costs', 'short run', 'long run', 'plant size', 'firm hires'
        ]
    },
    'U4': {
        'strong': [
            'monopoly', 'monopolistic competition', 'oligopoly', 'price discrimination',
            'game theory', 'Nash equilibrium', 'prisoner\'s dilemma', 'collusion', 'cartel',
            'barriers to entry', 'dominant strategy', 'excess capacity', 'product differentiation',
            'non-price competition', 'advertising', 'monopoly power', 'market power',
            'single seller', 'mutual interdependence', 'kinked demand curve'
        ],
        'moderate': [
            'market structure', 'market structures', 'concentrated market', 'few firms',
            'price setter', 'price maker', 'no close substitutes', 'control over price'
        ]
    },
    'U5': {
        'strong': [
            'factor market', 'derived demand', 'marginal revenue product', 'MRP', 'marginal factor cost', 'MFC',
            'labor market', 'minimum wage', 'monopsony', 'land market', 'rent', 'capital market', 'interest',
            'wage rate', 'employment level', 'hiring', 'labor supply', 'labor demand',
            'marginal product of labor', 'value of marginal product', 'VMPL',
            'wage subsidy', 'wage rate', 'total hours worked', 'rural workers'
        ],
        'moderate': [
            'workers', 'workers from', 'employ workers', 'hire workers', 'wage', 'wages',
            'labor', 'employment', 'unemployment', 'nominal wage', 'real wage'
        ]
    },
    'U6': {
        'strong': [
            'negative externality', 'positive externality', 'marginal social cost', 'marginal social benefit',
            'socially optimal', 'socially efficient', 'overproduction', 'underproduction',
            'public good', 'private good', 'common resource', 'free-rider', 'free rider',
            'market failure', 'Pigouvian', 'Pigovian', 'Lorenz curve', 'Gini coefficient',
            'income inequality', 'income distribution', 'distribution of income',
            'government intervention', 'pollution', 'spillover', 'external cost', 'external benefit',
            'regressive tax', 'progressive tax', 'proportional tax', 'transfer payment'
        ],
        'moderate': [
            'externality', 'social cost', 'social benefit', 'external', 'third party',
            'tragedy of the commons', 'non-excludable', 'non-rival', 'regressive', 'progressive'
        ]
    }
}

# U2-specific context: if "supply" or "demand" appears without U3/U4/U5/U6 strong signals, it's U2
U2_DEMAND_SUPPLY = ['supply', 'demand', 'market price', 'quantity']

# U3-specific: "profit" without monopoly context
U3_PROFIT_CONTEXT = ['economic profit', 'profit maximization', 'MR = MC', 'MR=MC', 'perfectly competitive']

# U1-specific: "income" with "prices" or "budget" context
U1_INCOME_CONTEXT = ['income', 'budget', 'consumer', 'utility', 'scarcity']


def classify_question(text, options_text=''):
    """Enhanced classification with better keyword matching."""
    full_text = (text + ' ' + options_text).lower()
    
    unit_scores = {'U1': 0, 'U2': 0, 'U3': 0, 'U4': 0, 'U5': 0, 'U6': 0}
    
    # Score strong keywords (weight 2)
    for unit, kw_groups in UNIT_KEYWORDS.items():
        for kw in kw_groups['strong']:
            pattern = r'\b' + re.escape(kw.lower()) + r'\b'
            matches = len(re.findall(pattern, full_text))
            unit_scores[unit] += matches * 2
        
        for kw in kw_groups['moderate']:
            pattern = r'\b' + re.escape(kw.lower()) + r'\b'
            matches = len(re.findall(pattern, full_text))
            unit_scores[unit] += matches * 1
    
    # Special U2 detection: if "supply" or "demand" appears without other strong signals
    has_supply_demand = any(word in full_text for word in ['supply', 'demand'])
    has_strong_u3_u4_u5_u6 = any(unit_scores[u] > 0 for u in ['U3', 'U4', 'U5', 'U6'])
    if has_supply_demand and not has_strong_u3_u4_u5_u6:
        unit_scores['U2'] += 1
    
    # Special U3 detection: if "profit" or "revenue" appears without monopoly/oligopoly context
    has_profit_revenue = any(word in full_text for word in ['profit', 'revenue'])
    has_strong_u4 = unit_scores['U4'] > 0
    if has_profit_revenue and not has_strong_u4:
        unit_scores['U3'] += 1
    
    # Special U1 detection: "income" + "prices" or "scarcity" related
    has_income = 'income' in full_text
    has_prices = 'prices' in full_text or 'price' in full_text
    has_scarcity = 'scarcity' in full_text or 'scarce' in full_text or 'limited resources' in full_text
    has_budget = 'budget' in full_text
    has_utility = 'utility' in full_text
    has_consumer = 'consumer' in full_text
    if (has_income and has_prices) or has_scarcity or has_budget or has_utility or has_consumer:
        if unit_scores['U2'] < 3:  # Only if U2 doesn't have strong signals
            unit_scores['U1'] += 1
    
    # Penalize false positives: if a U1 question has strong U2 signals, don't classify as U1
    if unit_scores['U2'] >= 3:
        unit_scores['U1'] = 0
    
    # Find highest scoring unit
    max_score = max(unit_scores.values())
    if max_score == 0:
        return 'uncategorized'
    
    # Get all units with score >= max_score * 0.5
    matching_units = [u for u, s in unit_scores.items() if s >= max_score * 0.5]
    
    # Highest unit number rule
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
print("\nMCQ Classification (improved):")
for unit in sorted(mcq_counts.keys(), key=lambda u: (0, int(u[1:])) if u.startswith('U') else (1, u)):
    print(f"  {unit}: {mcq_counts[unit]}")

# Classify FRQs
frqs_classified, frq_counts = classify_frqs(frqs)
print("\nFRQ Classification (improved):")
for unit in sorted(frq_counts.keys(), key=lambda u: (0, int(u[1:])) if u.startswith('U') else (1, u)):
    print(f"  {unit}: {frq_counts[unit]}")

# Save classified data
with open(os.path.join(OUTPUT_DIR, "all_mcqs_classified.json"), 'w', encoding='utf-8') as f:
    json.dump(mcqs_classified, f, ensure_ascii=False, indent=2)

with open(os.path.join(OUTPUT_DIR, "all_frqs_classified.json"), 'w', encoding='utf-8') as f:
    json.dump(frqs_classified, f, ensure_ascii=False, indent=2)

print(f"\nSaved re-classified data")

# Show uncategorized examples
uncategorized = [q for q in mcqs_classified if q['unit'] == 'uncategorized']
print(f"\nRemaining uncategorized: {len(uncategorized)}")
if uncategorized:
    print("\nSample uncategorized:")
    for q in uncategorized[:5]:
        print(f"  Q{q['question_num']} ({q['year']}): {q['question'][:100]}...")

main = lambda ctx: {"done": True}
