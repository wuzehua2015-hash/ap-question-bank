import json, os, re

def main():
    base = r'D:\Lynk\翎英教育LynkEdu\题库系统-web\ap-question-bank'
    
    with open(os.path.join(base, 'public/data/ap/microeconomics/frq_bank.json'), 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    changes = 0
    
    for q in data:
        text = q.get('text', '')
        original_text = text
        
        # 1. 将 Unicode 引号替换为 ASCII 引号（避免浏览器显示乱码）
        # U+2019 (') -> ASCII apostrophe
        # U+2018 (') -> ASCII apostrophe
        # U+201C (") -> ASCII quote
        # U+201D (") -> ASCII quote
        text = text.replace('\u2019', "'").replace('\u2018', "'")
        text = text.replace('\u201C', '"').replace('\u201D', '"')
        
        # 2. 替换其他常见Unicode字符
        text = text.replace('\u2013', '-')  # en dash
        text = text.replace('\u2014', '--')  # em dash
        text = text.replace('\u2026', '...')  # ellipsis
        
        # 3. 去除文本末尾的空白和孤立的句号
        text = text.rstrip()
        if text.endswith('\n.'):
            text = text[:-2].rstrip()
        if text.endswith('.') and text[-2:].count('\n') > 0:
            # 句号在换行后，可能是截断
            pass
        
        # 4. 去除已知污染模式（如果存在）
        pollution_patterns = [
            r'\n?STOP\s*END OF EXAM.*?(?=\Z)',
            r'\n?THIS PAGE MAY BE USED FOR TAKING NOTES.*?(?=\Z)',
            r'\n?NOTES WRITTEN ON THIS PAGE WILL NOT BE SCORED.*?(?=\Z)',
            r'\n?WRITE ALL YOUR RESPONSES ON THE LINED PAGES.*?(?=\Z)',
            r'\n?Unauthorized copying.*?\Z',
            r'\n?College Board\. Visit the College Board.*?\Z',
            r'\n?GO ON TO THE NEXT PAGE.*?\Z',
            r'\n?Question \d+ is reprinted.*?\Z',
        ]
        for pattern in pollution_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)
        
        # 再次清理末尾空白
        text = text.rstrip()
        
        if text != original_text:
            q['text'] = text
            changes += 1
            print(f"  {q['question_id']}: cleaned text")
    
    # 5. 字段名标准化
    field_changes = 0
    for q in data:
        if 'question_num' in q and 'question_number' not in q:
            q['question_number'] = q.pop('question_num')
            field_changes += 1
            print(f"  {q['question_id']}: question_num -> question_number")
    
    # 6. rubric 结构转换
    rubric_changes = 0
    for q in data:
        rubric = q.get('rubric', {})
        if 'parts' in rubric and 'points' not in rubric:
            # Convert parts to points
            points = []
            for part in rubric['parts']:
                point = {
                    'point_id': part.get('letter', ''),
                    'value': part.get('points', 0),
                    'description': f"Part ({part.get('letter', '')})",
                    'criteria': []
                }
                # Extract criteria from subparts
                for sub in part.get('subparts', []):
                    for criterion in sub.get('criteria', []):
                        point['criteria'].append(criterion)
                    if not point['criteria'] and sub.get('letter'):
                        point['description'] += f" {sub.get('letter', '')}"
                points.append(point)
            
            rubric['points'] = points
            # Keep parts for backward compatibility but points is primary
            rubric_changes += 1
            print(f"  {q['question_id']}: converted rubric.parts -> rubric.points")
    
    print(f"\nSummary:")
    print(f"  Text cleaned: {changes}")
    print(f"  Field renamed: {field_changes}")
    print(f"  Rubric converted: {rubric_changes}")
    
    # Save
    with open(os.path.join(base, 'public/data/ap/microeconomics/frq_bank.json'), 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\nSaved to frq_bank.json")
    
    return {'text_cleaned': changes, 'field_renamed': field_changes, 'rubric_converted': rubric_changes}

if __name__ == '__main__':
    main()
