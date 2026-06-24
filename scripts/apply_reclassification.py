import json, os

def main():
    base = r'D:\Lynk\翎英教育LynkEdu\题库系统-web\ap-question-bank'
    
    # Load current data
    with open(os.path.join(base, 'public/data/ap/microeconomics/question_bank.json'), 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Load proposals
    with open(os.path.join(base, 'public/data/ap/microeconomics/reclassification_proposal.json'), 'r', encoding='utf-8') as f:
        proposals = json.load(f)
    
    # Build a lookup map
    proposal_map = {p['id']: p['to'] for p in proposals}
    
    # Apply changes
    changes_applied = 0
    for q in data:
        qid = q['question_id']
        if qid in proposal_map:
            new_unit = proposal_map[qid]
            
            # Override: monopolistic competition long-run equilibrium should be U4, not U3
            text = q.get('text', '').lower()
            if 'monopolistic' in text and new_unit == 'U3':
                new_unit = 'U4'
                print(f"  Override: {qid} -> U4 (monopolistic competition)")
            
            if q.get('primary_unit') != new_unit:
                print(f"  {qid}: {q.get('primary_unit')} -> {new_unit}")
                q['primary_unit'] = new_unit
                changes_applied += 1
    
    # Save
    with open(os.path.join(base, 'public/data/ap/microeconomics/question_bank.json'), 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\nApplied {changes_applied} reclassifications")
    
    # Show new distribution
    unit_counts = {}
    for q in data:
        u = q.get('primary_unit', 'UNKNOWN')
        unit_counts[u] = unit_counts.get(u, 0) + 1
    
    print("\nNew unit distribution:")
    total = len(data)
    for u in sorted(unit_counts.keys()):
        pct = unit_counts[u] / total * 100
        print(f"  {u}: {unit_counts[u]} ({pct:.1f}%)")
    
    return {'changes': changes_applied}

if __name__ == '__main__':
    main()
