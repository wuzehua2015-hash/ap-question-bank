# Image-Based PDF OCR Processor

> 对应 Skill: `image-pdf-ocr-processor`
> 
> 用途：处理图片式（扫描版/无文本层）PDF的OCR提取、题目解析、去重与合并。
> 适用于 College Board AP Practice Exam、旧版真题扫描件、NEC 练习册等图片式 PDF。

---

## 核心原则

1. **图片式PDF必须双页拆分**：AP考试PDF是双页排版（左右并排），不拆分直接OCR会导致两页文本交错，无法解析。
2. **PSM 6是考试PDF首选**：`--psm 6`（统一文本块模式）避免题目编号被遗漏。
3. **Tesseract路径必须显式指定**：不要依赖环境变量，每次PythonRun都要设置绝对路径。
4. **答案key必须单独处理**：表格形式的答案key OCR质量差，建议高DPI+手动校对。

---

## 环境准备

### Tesseract OCR 安装

**Windows:**
1. 下载：https://github.com/UB-Mannheim/tesseract/wiki
2. 安装到 `C:\Program Files\Tesseract-OCR`
3. 验证：`tesseract --version`（应显示 v5.x）

**Python 依赖：**
```bash
pip install pytesseract PyMuPDF Pillow
```

**Tesseract 路径配置：**
```python
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
```

---

## 步骤1：检测PDF是否为图片式

```python
import fitz

def is_image_based_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    for page in doc:
        text = page.get_text().strip()
        if len(text) > 100:
            return False
    return True
```

---

## 步骤2：双页拆分OCR

```python
import fitz, pytesseract, io
from PIL import Image

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def split_and_ocr(pdf_path, dpi=300):
    doc = fitz.open(pdf_path)
    all_text = []
    
    for page_num, page in enumerate(doc, 1):
        rect = page.rect
        left = fitz.Rect(0, 0, rect.width / 2, rect.height)
        right = fitz.Rect(rect.width / 2, 0, rect.width, rect.height)
        
        for side, clip in [("LEFT", left), ("RIGHT", right)]:
            pix = page.get_pixmap(dpi=dpi, clip=clip)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            text = pytesseract.image_to_string(img, lang='eng', config='--psm 6')
            all_text.append(f"=== PAGE {page_num} {side} ===\n{text}\n")
    
    return "\n".join(all_text)
```

### PSM 模式选择

| PSM | 模式 | 适用场景 |
|-----|------|----------|
| 3 | 自动分页 | 多列文本 |
| 4 | 单列变量 | 单列排版 |
| 6 | **统一文本块** | **考试PDF首选** |
| 11 | 稀疏文本 | 表格、零散文字 |

---

## 步骤3：文本解析与清洗

### 解析MCQ结构

```python
import re

def parse_questions(ocr_text, set_name):
    questions = []
    pages = re.split(r'=== PAGE (\d+) (\w+) ===', ocr_text)
    
    for i in range(1, len(pages), 3):
        page_num, side, content = pages[i], pages[i+1], pages[i+2]
        lines = content.strip().split('\n')
        j = 0
        while j < len(lines):
            line = lines[j].strip()
            match = re.match(r'^(\d+)\s+(.+)', line)
            if match:
                q_num = int(match.group(1))
                q_text = match.group(2)
                j += 1
                while j < len(lines) and not re.match(r'\s*\(?[A-E]\)?', lines[j].strip()):
                    q_text += ' ' + lines[j].strip()
                    j += 1
                
                options = {}
                opt_letters = ['A', 'B', 'C', 'D', 'E']
                opt_idx = 0
                while j < len(lines) and opt_idx < 5:
                    if re.match(r'\s*\(?' + opt_letters[opt_idx] + r'\)?', lines[j].strip()):
                        opt_text = re.sub(r'^[\s(A-E)]*[A-E][).\s]+', '', lines[j].strip())
                        j += 1
                        while j < len(lines) and not re.match(r'\s*\(?[A-E]\)?', lines[j].strip()):
                            opt_text += ' ' + lines[j].strip()
                            j += 1
                        options[opt_letters[opt_idx]] = opt_text.strip()
                        opt_idx += 1
                    else:
                        j += 1
                
                if len(options) == 5 and q_num <= 60:
                    questions.append({'set': set_name, 'page': page_num, 'side': side,
                                      'question_number': q_num, 'text': q_text.strip(), 'options': options})
            else:
                j += 1
    return questions
```

### 文本清洗

```python
def clean_ocr_text(text):
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'any part of this page is illegal\.?', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Unauthorized copying.*?illegal\.?', '', text, flags=re.IGNORECASE)
    text = re.sub(r'SECTION\s*I.*?ANSWER SHEET', '', text, flags=re.IGNORECASE|re.DOTALL)
    text = re.sub(r'GO ON TO THE NEXT PAGE', '', text, flags=re.IGNORECASE)
    text = re.sub(r'([a-zA-Z])-\s+([a-zA-Z])', r'\1\2', text)
    return re.sub(r'\s+', ' ', text).strip()
```

---

## 步骤4：答案Key提取

```python
def extract_answer_key(ocr_text):
    match = re.search(r'Answer Key.*?(?=AP\(r\) Macroeconomics|\Z)', ocr_text, re.DOTALL|re.IGNORECASE)
    if not match:
        return {}
    
    answers = {}
    for m in re.finditer(r'Question\s+(\d+):\s*([A-E])', match.group(0), re.IGNORECASE):
        answers[int(m.group(1))] = m.group(2).upper()
    return answers
```

**注意：** 答案key表格OCR质量差，建议：
1. 单独高DPI（400）OCR答案key页
2. 使用PSM 3或4（表格模式）
3. 人工抽查校对
4. 若OCR失败，标记为 `answer: null`，后续手动补充

---

## 步骤5：与现有题库去重

```python
import difflib

def find_duplicates(new_questions, existing_data, threshold=0.85):
    duplicates = []
    unique = []
    existing_texts = [' '.join(q['text'].split()) for q in existing_data]
    
    for q in new_questions:
        q_text = ' '.join(q['text'].split())
        is_dup = False
        for idx, existing_text in enumerate(existing_texts):
            if existing_text == q_text or difflib.SequenceMatcher(None, q_text, existing_text).ratio() > threshold:
                is_dup = True
                duplicates.append({'new_q': q, 'existing_q': existing_data[idx]})
                break
        if not is_dup:
            unique.append(q)
    return unique, duplicates

def merge_duplicate_sources(existing_q, new_source):
    current = existing_q.get('source', '')
    if new_source not in current:
        existing_q['source'] = current + ' | ' + new_source if current else new_source
    return existing_q
```

**原则：不重复放入题库，而是标注多个来源。**

---

## 步骤6：图形提取

```python
import fitz
from PIL import Image
import io

def extract_graph(pdf_path, page_num, bbox, output_path):
    """bbox: (x0, y0, x1, y1) in PDF coordinates"""
    doc = fitz.open(pdf_path)
    page = doc[page_num - 1]
    rect = fitz.Rect(bbox)
    pix = page.get_pixmap(dpi=300, clip=rect)
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    img.save(output_path, "PNG")
    return output_path
```

**命名规范：** `public/images/[year]/[year]_Q[id]_graph.png`

---

## 常见陷阱

| 陷阱 | 症状 | 解决方案 |
|------|------|----------|
| 双页文本交错 | 两页题目混合 | **必须拆分LEFT/RIGHT** |
| PSM 3遗漏题目 | 编号缺失 | 使用 **PSM 6** |
| 答案key损坏 | 表格乱码 | 高DPI+手动校对 |
| 选项截断 | 末尾缺失 | 增加行缓冲，合并到下一选项标记 |
| CID字符 | `(cid:2)` | 替换为 `-`（负号） |
| 图形未提取 | `has_graph=true` 无图片 | 检测 "graph above" 必提取 |

---

## 完整工作流

```python
# 1. 检测 → 2. OCR拆分 → 3. 解析 → 4. 答案key → 5. 去重 → 6. 转换 → 7. 合并 → 8. 审计
```

**输出：** 通过 `question-bank-audit` 的干净 JSON 文件。
