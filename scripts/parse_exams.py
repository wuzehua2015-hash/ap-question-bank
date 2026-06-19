#!/usr/bin/env python3
"""
Parse OCR text from AP Macroeconomics practice exams into structured JSON.
Handles double-page spread interleaving, missing question numbers, tables, and graphs.
"""

import re
import json
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple


class OcrParser:
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.raw_text = ""
        self.lines: List[str] = []
        self.questions: List[Dict[str, Any]] = []
        self.issues: List[str] = []
        self.used_option_lines: set = set()
    
    def parse(self) -> Tuple[List[Dict[str, Any]], List[str]]:
        self.read_file()
        self.preprocess()
        self.extract_all_questions()
        self.sort_and_fill_missing_numbers()
        self.detect_features()
        self.validate()
        return self.questions, self.issues
    
    def read_file(self):
        with open(self.filepath, 'r', encoding='utf-8') as f:
            self.raw_text = f.read()
    
    def preprocess(self):
        text = self.raw_text
        
        # Remove page markers
        text = re.sub(r'=== PAGE \d+ ===', '\n', text)
        
        # Remove footers and page numbers
        text = re.sub(r'Unauthorized copying or reuse of\s*any part of this page is illegal\.', '', text, flags=re.IGNORECASE)
        text = re.sub(r'GO ON TO THE NEXT PAGE\.', '', text)
        text = re.sub(r'-+\d+-+', '', text)
        text = re.sub(r'Item \d+ was not scored', '', text, flags=re.IGNORECASE)
        
        # Remove exam cover pages and instructions
        # Keep only the MCQ section (Section I)
        start_match = re.search(r'(?:MACROECONOMICS|AP\*? Macroeconomics).*?Section I', text, re.IGNORECASE | re.DOTALL)
        if start_match:
            text = text[start_match.start():]
        
        # Find the end of Section I MCQs
        end_patterns = [
            r'END OF SECTION I',
            r'SECTION II',
            r'AP\*? Macroeconomics Exam\s*SECTION II',
            r'Answer Key for AP Macroeconomics',
            r'Question 1 begins on',  # Free response section
            r'AP\s*Macroeconomics\s*-\s*2022\s*Practice\s*Exam\s*\d+\s*Scoring\s*Worksheet',
            r'AP\®? Macroeconomics 2022 Scoring Guidelines',
            r'AP\®? Macroeconomics 2022 Question Descriptors',
        ]
        for pattern in end_patterns:
            m = re.search(pattern, text, re.IGNORECASE)
            if m:
                text = text[:m.start()]
                break
        
        # Remove common instruction text
        text = re.sub(r'Directions:.*?Select the one that is best.*?answer sheet\.', '', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'Use your time effectively.*?unanswered questions\.', '', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'Your total score on the multiple-choice section.*?unanswered questions\.', '', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'At a Glance.*?Pencil required', '', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'Electronic Device.*?None allowed', '', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'Instructions.*?notes or scratch work\.', '', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'WRITE ALL YOUR RESPONSES ON THE LINED PAGES\.', '', text)
        text = re.sub(r'THIS PAGE MAY BE USED FOR TAKING NOTES AND PLANNING YOUR ANSWERS\.', '', text)
        text = re.sub(r'NOTES WRITTEN ON THIS PAGE WILL NOT BE SCORED\.', '', text)
        text = re.sub(r'Question \d+ is reprinted for your convenience\.', '', text)
        
        # Remove stray noise lines
        text = re.sub(r'^\s*Fare\s+\d+.*?$', '', text, flags=re.MULTILINE)
        text = re.sub(r'^\s*[eE]\.@\s*$', '', text, flags=re.MULTILINE)
        text = re.sub(r'^\s*Ke\s*$', '', text, flags=re.MULTILINE)
        text = re.sub(r'^\s*oe\s*$', '', text, flags=re.MULTILINE)
        
        # Clean up whitespace
        lines = [line.strip() for line in text.split('\n')]
        lines = [line for line in lines if line]
        
        self.lines = lines
    
    def extract_all_questions(self):
        """Find all question starts and extract questions."""
        # First, find all question starts
        starts = self.find_all_question_starts()
        
        # Then, extract each question
        for start in starts:
            q = self.extract_question_from_start(start)
            if q:
                self.questions.append(q)
        
        # Find orphan questions (text without explicit numbers but with options)
        self.find_orphan_questions()
    
    def find_all_question_starts(self) -> List[Dict[str, Any]]:
        """Find all question starts in the text, including splitting lines with multiple numbers."""
        starts = []
        
        for i, line in enumerate(self.lines):
            # Check for explicit numbers in the line
            # Pattern: number followed by space and text (not just a bare number)
            matches = list(re.finditer(r'(\d+)\.\s+', line))
            
            # Filter out matches that are just year numbers or page numbers
            valid_matches = []
            for m in matches:
                num = int(m.group(1))
                if 1 <= num <= 60:
                    valid_matches.append(m)
            
            if len(valid_matches) > 1:
                # Multiple numbers on one line - split them
                for j, match in enumerate(valid_matches):
                    num = int(match.group(1))
                    start_pos = match.start()
                    end_pos = valid_matches[j+1].start() if j+1 < len(valid_matches) else len(line)
                    text = line[start_pos + len(match.group(0)):end_pos].strip()
                    
                    # Only add if there's actual text or it's the first occurrence on this line
                    if text or j == 0:
                        starts.append({
                            'line': i,
                            'pos': start_pos,
                            'num': num,
                            'text': text,
                            'type': 'explicit'
                        })
            elif len(valid_matches) == 1:
                num = int(valid_matches[0].group(1))
                text = line[valid_matches[0].end():].strip()
                
                # Check if this is a bare number (no text after it)
                if not text:
                    starts.append({
                        'line': i,
                        'pos': valid_matches[0].start(),
                        'num': num,
                        'text': None,
                        'type': 'bare'
                    })
                else:
                    starts.append({
                        'line': i,
                        'pos': valid_matches[0].start(),
                        'num': num,
                        'text': text,
                        'type': 'explicit'
                    })
            
            # Check for missing number (starts with . followed by space)
            if re.match(r'^\.\s+', line):
                text = line[2:].strip()
                # Only add if the text looks like a question start
                if text and re.match(r'^[A-Z]', text):
                    starts.append({
                        'line': i,
                        'pos': 0,
                        'num': None,
                        'text': text,
                        'type': 'missing'
                    })
        
        # Sort by line, then by position
        starts.sort(key=lambda x: (x['line'], x['pos']))
        return starts
    
    def extract_question_from_start(self, start: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extract a question from a start marker."""
        line_idx = start['line']
        num = start['num'] or -1
        text = start['text'] or ""
        
        # Collect question text lines
        text_lines = []
        if text:
            text_lines.append(text)
        
        # Find the next question start or option marker
        i = line_idx + 1
        while i < len(self.lines):
            line = self.lines[i]
            # Stop at next question start (explicit number with text or missing number)
            if re.match(r'^(\d+)\.\s+.+$', line) or re.match(r'^\.\s+', line):
                # But don't stop at bare numbers or year numbers
                if not re.match(r'^(\d+)\.\s*$', line):
                    break
            # Stop at option marker
            if re.match(r'^\([A-E]\)', line):
                break
            # Don't stop at bare numbers - they might be before the actual text
            text_lines.append(line)
            i += 1
        
        question_text = ' '.join(text_lines).strip()
        
        # Clean up question text
        question_text = self.clean_question_text(question_text, start)
        
        # If this is a bare number with no text, look ahead for the text
        if start['type'] == 'bare' and not question_text:
            # Look ahead for text that doesn't have a number
            i = line_idx + 1
            while i < len(self.lines):
                line = self.lines[i]
                if re.match(r'^(\d+)\.\s*', line) or re.match(r'^\.\s+', line):
                    break
                if re.match(r'^\([A-E]\)', line):
                    break
                if len(line) > 20 and re.match(r'^[A-Z]', line):
                    question_text = line
                    # Check if there's more text
                    j = i + 1
                    while j < len(self.lines):
                        if re.match(r'^(\d+)\.\s*', self.lines[j]) or re.match(r'^\.\s+', self.lines[j]):
                            break
                        if re.match(r'^\([A-E]\)', self.lines[j]):
                            break
                        question_text += ' ' + self.lines[j]
                        j += 1
                    i = j
                    break
                i += 1
        
        if not question_text:
            return None
        
        # Find options using the "follow the sequence" method
        options = self.find_options_by_sequence(i, num)
        
        if not options or len(options) < 3:
            return None
        
        return {
            'number': num,
            'text': question_text,
            'options': options,
            'marker_line': line_idx,
            'marker_type': start['type']
        }
    
    def clean_question_text(self, text: str, start: Dict[str, Any]) -> str:
        """Clean up question text."""
        # Remove leading stray words from interleaving
        graph_labels = ['Supply', 'Demand', 'YEN/DOLLAR', 'QUANTITY OF DOLLARS', 'PRICE LEVEL', 'REAL OUTPUT', 'Money Supply', 'Increase', 'Decrease']
        for label in graph_labels:
            if text.startswith(label + ' '):
                # Only remove if it looks like an interleaved label
                next_word = text[len(label):].strip().split()[0] if len(text) > len(label) else ""
                if next_word and next_word[0].islower():
                    text = text[len(label):].strip()
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove trailing incomplete sentences from interleaving
        text = re.sub(r'\s+(A|An|The|Which|What|How|If|Assume|In|When|All)\s*$', '', text)
        
        return text.strip()
    
    def find_options_by_sequence(self, start_line: int, q_num: int) -> Optional[Dict[str, str]]:
        """
        Find options by looking for the closest (A) after the question text,
        then following (B), (C), (D), (E) in sequence.
        """ 
        # Find the first (A) after start_line that hasn't been used
        a_line = self.find_next_option(start_line, 'A', q_num)
        if a_line is None:
            return None
        
        options = {}
        options['A'] = self.extract_option_text(a_line, 'A')
        
        # Find next (B) after (A)
        b_line = self.find_next_option(a_line + 1, 'B', q_num)
        if b_line is not None:
            options['B'] = self.extract_option_text(b_line, 'B')
        
        # Find next (C) after (B)
        c_line = self.find_next_option((b_line or a_line) + 1, 'C', q_num) if b_line else None
        if c_line is not None:
            options['C'] = self.extract_option_text(c_line, 'C')
        
        # Find next (D) after (C)
        d_line = self.find_next_option((c_line or b_line or a_line) + 1, 'D', q_num) if c_line else None
        if d_line is not None:
            options['D'] = self.extract_option_text(d_line, 'D')
        
        # Find next (E) after (D)
        e_line = self.find_next_option((d_line or c_line or b_line or a_line) + 1, 'E', q_num) if d_line else None
        if e_line is not None:
            options['E'] = self.extract_option_text(e_line, 'E')
        
        # We need at least 3 options to consider it a valid question
        if len(options) >= 3:
            # Mark these option lines as used
            used_lines = [a_line]
            if b_line: used_lines.append(b_line)
            if c_line: used_lines.append(c_line)
            if d_line: used_lines.append(d_line)
            if e_line: used_lines.append(e_line)
            for u in used_lines:
                self.used_option_lines.add(u)
            return options
        
        return None
    
    def find_next_option(self, start_line: int, letter: str, q_num: int) -> Optional[int]:
        """Find the next occurrence of an option letter after start_line."""
        pattern = re.compile(r'^\(' + letter + r'\)')
        for i in range(start_line, len(self.lines)):
            line = self.lines[i]
            if pattern.match(line):
                # Check if this line is already used by another question
                if i not in self.used_option_lines:
                    return i
        return None
    
    def extract_option_text(self, line_idx: int, letter: str) -> str:
        """Extract the text for an option, merging multi-line options."""
        line = self.lines[line_idx]
        text = re.sub(r'^\(' + letter + r'\)\s*', '', line)
        
        # Merge with next lines if they don't start with a new option or question
        i = line_idx + 1
        while i < len(self.lines):
            next_line = self.lines[i]
            # Stop at next option or question marker
            if re.match(r'^\([A-E]\)', next_line):
                break
            if re.match(r'^(\d+)\.\s+', next_line) and not re.match(r'^(\d+)\.\s*$', next_line):
                break
            if re.match(r'^\.\s+', next_line):
                break
            # Stop at table headers that look like new question starts
            if re.match(r'^(\w+\s+){2,}', next_line) and '|' in next_line:
                break
            text += ' ' + next_line
            i += 1
        
        return text.strip()
    
    def find_orphan_questions(self):
        """Find questions that have no marker but have option sets."""
        # Find all option (A) lines that haven't been used
        for i, line in enumerate(self.lines):
            if not re.match(r'^\(A\)', line):
                continue
            if i in self.used_option_lines:
                continue
            
            # Look backward to find question text
            text_lines = []
            j = i - 1
            while j >= 0:
                prev_line = self.lines[j]
                if re.match(r'^(\d+)\.\s+', prev_line) and not re.match(r'^(\d+)\.\s*$', prev_line):
                    break
                if re.match(r'^\.\s+', prev_line):
                    break
                if re.match(r'^\([A-E]\)', prev_line):
                    break
                text_lines.insert(0, prev_line)
                j -= 1
            
            text = ' '.join(text_lines).strip()
            if text and len(text) > 20:
                # Try to find options for this orphan
                options = self.find_options_by_sequence(i, -1)
                if options and len(options) >= 3:
                    self.questions.append({
                        'number': -1,
                        'text': text,
                        'options': options,
                        'marker_line': j + 1,
                        'marker_type': 'orphan'
                    })
                    self.issues.append(f"Found orphan question at line {j+1}: '{text[:80]}...'")
    
    def sort_and_fill_missing_numbers(self):
        """Sort questions by number and fill in missing numbers."""
        # Separate questions with known numbers from those without
        known = [q for q in self.questions if q.get('number', -1) > 0]
        unknown = [q for q in self.questions if q.get('number', -1) <= 0]
        
        # Sort known by number and then by line position
        known.sort(key=lambda q: (q['number'], q['marker_line']))
        
        # Remove duplicates (same number, keep the one with more complete options)
        deduped = []
        for q in known:
            if deduped and deduped[-1]['number'] == q['number']:
                # Keep the one with more options or longer text
                if len(q['options']) > len(deduped[-1]['options']):
                    deduped[-1] = q
                elif len(q['text']) > len(deduped[-1]['text']):
                    deduped[-1] = q
            else:
                deduped.append(q)
        known = deduped
        
        # For each known question, check if there are unknown questions between it and the next known one
        result = []
        
        for i, q in enumerate(known):
            result.append(q)
            
            # Check for unknown questions between this and the next known
            if i + 1 < len(known):
                next_q = known[i + 1]
                # Find unknowns between these two
                between = [u for u in unknown if q['marker_line'] < u['marker_line'] < next_q['marker_line']]
                
                if between:
                    # Sort by line position
                    between.sort(key=lambda x: x['marker_line'])
                    
                    # Assign numbers to these unknowns
                    expected_count = next_q['number'] - q['number'] - 1
                    if len(between) == expected_count:
                        for j, u in enumerate(between):
                            u['number'] = q['number'] + j + 1
                            result.append(u)
                        unknown = [u for u in unknown if u not in between]
                    elif len(between) < expected_count:
                        # Some questions are missing entirely
                        for j, u in enumerate(between):
                            u['number'] = q['number'] + j + 1
                            result.append(u)
                        for j in range(len(between), expected_count):
                            self.issues.append(
                                f"Missing question {q['number'] + j + 1} between Q{q['number']} and Q{next_q['number']}"
                            )
                        unknown = [u for u in unknown if u not in between]
                    else:
                        # Too many unknowns - assign sequentially and log
                        for j, u in enumerate(between):
                            assigned_num = q['number'] + j + 1
                            if assigned_num >= next_q['number']:
                                self.issues.append(
                                    f"Ambiguous question at line {u['marker_line']}: too many orphan questions between Q{q['number']} and Q{next_q['number']}"
                                )
                                assigned_num = -1
                            u['number'] = assigned_num
                            if assigned_num > 0:
                                result.append(u)
                        unknown = [u for u in unknown if u not in between]
        
        # Handle remaining unknowns at the beginning or end
        for u in unknown:
            if u.get('number', -1) <= 0:
                self.issues.append(f"Could not assign number to orphan question at line {u['marker_line']}: '{u['text'][:80]}...'")
        
        # Re-sort by number, removing unassigned
        result = [q for q in result if q.get('number', -1) > 0]
        result.sort(key=lambda q: q['number'])
        
        self.questions = result
    
    def detect_features(self):
        """Detect table questions and graph questions."""
        for q in self.questions:
            text = q['text'].lower()
            options = q['options']
            
            # Detect graph questions
            q['has_graph'] = False
            graph_keywords = ['graph above', 'diagram above', 'figure above', 'the graph', 'the diagram', 'the figure', 'curve above', 'shown in the graph', 'shown in the diagram', 'graph shows', 'diagram shows']
            for kw in graph_keywords:
                if kw in text:
                    q['has_graph'] = True
                    break
            # Also check if options reference graph elements
            if not q['has_graph']:
                for opt in options.values():
                    if any(kw in opt.lower() for kw in ['curve', 'shift', 'graph', 'diagram', 'supply curve', 'demand curve', 'phillips curve']):
                        q['has_graph'] = True
                        break
            
            # Detect table questions
            q['is_table'] = False
            q['option_table_data'] = None
            
            # Check if any option contains multiple columns or pipe separators
            table_indicators = [' | ', '    ', '\t', 'Increase Decrease', 'No change', 'Increase Increase', 'Decrease Increase', 'Increase No change']
            for opt_text in options.values():
                if ' | ' in opt_text or ('  ' in opt_text and len(opt_text.split('  ')) > 1):
                    q['is_table'] = True
                    break
                # Check for common table patterns (two words separated by spaces that look like columns)
                words = opt_text.split()
                if len(words) >= 2 and words[0] in ['Increase', 'Decrease', 'No', 'Fall', 'Rise', 'Appreciate', 'Depreciate', 'Indeterminate', 'Shifts', 'Nochange']:
                    if words[1] in ['Increase', 'Decrease', 'No', 'change', 'Fall', 'Rise', 'Appreciate', 'Depreciate', 'Indeterminate', 'to', 'the', 'left', 'right', 'Nochange', 'Shifts']:
                        q['is_table'] = True
                        break
            
            # Check if the question text mentions a table or data
            if 'table' in text or 'data above' in text or 'according to the' in text or 'the data' in text:
                q['is_table'] = True
            
            if q['is_table']:
                q['option_table_data'] = self.extract_table_data(options)
    
    def extract_table_data(self, options: Dict[str, str]) -> Optional[List[Dict[str, str]]]:
        """Extract table data from options."""
        table_data = []
        for letter, text in options.items():
            # Split by pipe or multiple spaces
            if ' | ' in text:
                cols = [c.strip() for c in text.split(' | ')]
            elif '  ' in text:
                cols = [c.strip() for c in text.split('  ') if c.strip()]
            else:
                cols = text.split()
            table_data.append({'option': letter, 'columns': cols})
        return table_data
    
    def validate(self):
        """Validate the parsed questions and log issues."""
        # Check for missing question numbers
        expected = set(range(1, 61))
        found = {q['number'] for q in self.questions}
        missing = expected - found
        for m in sorted(missing):
            self.issues.append(f"Missing question {m} - not found in OCR text")
        
        # Check for duplicate numbers
        from collections import Counter
        counts = Counter(q['number'] for q in self.questions)
        for num, count in counts.items():
            if count > 1:
                self.issues.append(f"Duplicate question {num} - found {count} times")
        
        # Check for questions with incomplete options
        for q in self.questions:
            if len(q['options']) < 5:
                self.issues.append(f"Question {q['number']} has only {len(q['options'])} options")
            
            # Check for truncated options (end with "of" or "and")
            for letter, opt in q['options'].items():
                if re.search(r'\b(of|and|the|a|an)\s*$', opt, re.IGNORECASE):
                    self.issues.append(f"Question {q['number']} option {letter} may be truncated: '{opt[:80]}...'")
        
        # Check for questions with very short text
        for q in self.questions:
            if len(q['text']) < 30:
                self.issues.append(f"Question {q['number']} has very short text: '{q['text'][:100]}'")
        
        # Check for questions with very long text (might be interleaved)
        for q in self.questions:
            if len(q['text']) > 500:
                self.issues.append(f"Question {q['number']} has very long text ({len(q['text'])} chars) - possible interleaving")


def parse_exam(input_path: str, output_path: str, log_path: str):
    """Parse a single OCR file and save JSON output."""
    parser = OcrParser(input_path)
    questions, issues = parser.parse()
    
    # Prepare output
    output = []
    for q in questions:
        output.append({
            'number': q['number'],
            'text': q['text'],
            'options': q['options'],
            'has_graph': q.get('has_graph', False),
            'is_table': q.get('is_table', False),
            'option_table_data': q.get('option_table_data', None)
        })
    
    # Save JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    # Save log
    with open(log_path, 'w', encoding='utf-8') as f:
        f.write(f"Parsing log for {input_path}\n")
        f.write(f"Total questions found: {len(questions)}\n")
        f.write(f"Issues found: {len(issues)}\n")
        f.write("=" * 60 + "\n")
        for issue in issues:
            f.write(issue + "\n")
    
    print(f"Parsed {len(questions)} questions from {input_path}")
    print(f"Saved output to {output_path}")
    print(f"Saved log to {log_path}")
    print(f"Issues: {len(issues)}")
    
    return questions, issues


def main():
    base_dir = Path("D:/Lynk/翎英教育LynkEdu/题库系统-web/ap-question-bank/scripts")
    
    files = [
        ("ocr_2023_set1.txt", "parsed_2023_set1.json", "log_2023_set1.txt"),
        ("ocr_2023_set2.txt", "parsed_2023_set2.json", "log_2023_set2.txt"),
        ("ocr_2023_set3.txt", "parsed_2023_set3.json", "log_2023_set3.txt"),
    ]
    
    for input_file, output_file, log_file in files:
        input_path = str(base_dir / input_file)
        output_path = str(base_dir / output_file)
        log_path = str(base_dir / log_file)
        
        parse_exam(input_path, output_path, log_path)
        print()


if __name__ == '__main__':
    main()
