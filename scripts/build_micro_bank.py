import json
import os
import re

RAW_DIR = "D:/Lynk/翎英教育LynkEdu/题库系统-web/ap-question-bank/public/data/ap/microeconomics/raw_extraction"
OUTPUT_DIR = "D:/Lynk/翎英教育LynkEdu/题库系统-web/ap-question-bank/public/data/ap/microeconomics"

with open(os.path.join(RAW_DIR, "all_mcqs_classified.json"), 'r', encoding='utf-8') as f:
    mcqs = json.load(f)

with open(os.path.join(RAW_DIR, "all_frqs_classified.json"), 'r', encoding='utf-8') as f:
    frqs = json.load(f)

print(f"Loaded {len(mcqs)} MCQs, {len(frqs)} FRQs for bank building")

# Topics map for each unit (common keywords)
UNIT_TOPICS = {
    'U1': ['scarcity', 'opportunity cost', 'PPF', 'comparative advantage', 'trade', 'consumer choice', 'utility'],
    'U2': ['supply', 'demand', 'equilibrium', 'elasticity', 'consumer surplus', 'producer surplus', 'tax', 'tariff', 'subsidy'],
    'U3': ['cost curves', 'production function', 'profit maximization', 'perfect competition', 'shutdown', 'break-even'],
    'U4': ['monopoly', 'monopolistic competition', 'oligopoly', 'game theory', 'price discrimination', 'collusion'],
    'U5': ['factor markets', 'labor market', 'wage', 'MRP', 'monopsony', 'derived demand'],
    'U6': ['externality', 'public good', 'market failure', 'social cost', 'income inequality', 'Lorenz curve']
}

def extract_topics(question_text, options_text, unit):
    """Extract topics from question text."""
    full_text = (question_text + ' ' + options_text).lower()
    topics = []
    for topic in UNIT_TOPICS.get(unit, []):
        if topic.lower() in full_text:
            topics.append(topic)
    return topics[:5]  # Max 5 topics


def infer_difficulty(text, options_text):
    """Infer difficulty from question text."""
    full_text = (text + ' ' + options_text).lower()
    
    # Hard indicators
    hard_signals = ['calculate', 'compute', 'determine', 'explain', 'diagram', 'graph', 'show that', 'if and only if']
    # Easy indicators
    easy_signals = ['which of the following', 'best describes', 'most likely', 'always true', 'never true']
    
    hard_count = sum(1 for s in hard_signals if s in full_text)
    easy_count = sum(1 for s in easy_signals if s in full_text)
    
    if hard_count > 0:
        return 'Hard', 3
    elif easy_count > 0:
        return 'Easy', 2
    else:
        return 'Medium', 4


def build_question_bank(mcqs):
    """Build standard question bank format."""
    bank = []
    
    for q in mcqs:
        # Clean question text (remove newlines, normalize whitespace)
        text = re.sub(r'\s+', ' ', q['question']).strip()
        
        # Clean options
        options = {}
        for k, v in q['options'].items():
            options[k] = re.sub(r'\s+', ' ', v).strip()
        
        options_text = ' '.join(options.values())
        
        # Build question ID
        q_num = str(q['question_num']).zfill(2)
        question_id = f"{q['year']}_Q{q_num}"
        
        # Extract topics
        topics = extract_topics(text, options_text, q['unit'])
        
        # Infer difficulty
        difficulty, difficulty_score = infer_difficulty(text, options_text)
        
        entry = {
            "question_id": question_id,
            "year": str(q['year']),
            "text": text,
            "options": options,
            "answer": q['answer'],
            "primary_unit": q['unit'],
            "secondary_units": [],
            "topics": topics,
            "difficulty": difficulty,
            "has_graph": False,
            "image_paths": [],
            "source": q['source'],
            "pure_unit": False,
            "classification_reasoning": f"Auto-classified to {q['unit']}",
            "difficulty_source": "inferred",
            "difficulty_score": difficulty_score,
            "skills": ["identify"],
            "requires_graph": False
        }
        
        bank.append(entry)
    
    return bank


def build_frq_bank(frqs):
    """Build standard FRQ bank format."""
    bank = []
    
    for q in frqs:
        text = re.sub(r'\s+', ' ', q['question']).strip()
        
        question_id = f"{q['year']}_FRQ{q['question_num']}"
        
        topics = extract_topics(text, q.get('scoring_guidelines', ''), q['unit'])
        
        entry = {
            "question_id": question_id,
            "year": q['year'],
            "question_number": q['question_num'],
            "text": text,
            "source": q['source'],
            "primary_unit": q['unit'],
            "secondary_units": [],
            "pure_unit": False,
            "difficulty": "Hard",
            "topics": topics,
            "rubric": {
                "total_points": 10,
                "points": [],
                "scoring_guidelines": q.get('scoring_guidelines', '')
            }
        }
        
        bank.append(entry)
    
    return bank


# Build banks
question_bank = build_question_bank(mcqs)
frq_bank = build_frq_bank(frqs)

print(f"\nBuilt question bank with {len(question_bank)} entries")
print(f"Built FRQ bank with {len(frq_bank)} entries")

# Save
with open(os.path.join(OUTPUT_DIR, "question_bank.json"), 'w', encoding='utf-8') as f:
    json.dump(question_bank, f, ensure_ascii=False, indent=2)

with open(os.path.join(OUTPUT_DIR, "frq_bank.json"), 'w', encoding='utf-8') as f:
    json.dump(frq_bank, f, ensure_ascii=False, indent=2)

# Print unit distribution
from collections import Counter
unit_counts = Counter(q['primary_unit'] for q in question_bank)
print("\nMCQ Unit Distribution:")
for unit in sorted(unit_counts.keys(), key=lambda u: int(u[1:])):
    print(f"  {unit}: {unit_counts[unit]}")

frq_counts = Counter(q['primary_unit'] for q in frq_bank)
print("\nFRQ Unit Distribution:")
for unit in sorted(frq_counts.keys(), key=lambda u: int(u[1:])):
    print(f"  {unit}: {frq_counts[unit]}")

print(f"\nSaved to {OUTPUT_DIR}")

main = lambda ctx: {"done": True}
