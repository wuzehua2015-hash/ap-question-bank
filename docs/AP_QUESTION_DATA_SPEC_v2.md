# AP题库数据规范 v2.0

## 1. 分析结论（基于2012 Micro PDF逐页分析）

### 1.1 MCQ 真实结构类型

AP MCQ在PDF中存在以下4种结构，必须**严格区分**：

| 结构类型 | 位置 | 示例 | 处理方式 |
|---------|------|------|----------|
| **Type A: 纯文本选项** | 选项区域 | Q1: "Which...? (A) It is... (B) It is..." | `options` array，每个是字符串 |
| **Type B: 表格选项** | 选项区域 | Q18: 带"Paid by/Received by"列头的选项 | `options` + `option_table_columns` |
| **Type C: 背景数据表** | 题干前 | Q31: Country A/B production data | `background_data` (包含在题干中) |
| **Type D: 引用图片** | 题干中 | Q4: "diagram above" | 提取为图片文件，题干保留引用文字 |

**关键区分原则**：
- `background_data` 是**题干的一部分**，描述场景数据
- `options` 是**答案选择**，无论是否以表格形式呈现
- 两者绝对不能混淆！Q31的production data是背景数据，不是选项表格

### 1.2 图片类型

| 类型 | 描述 | 提取方式 |
|------|------|----------|
| 嵌入位图 | PDF中的图片对象 | 提取原始图片 |
| 矢量图形 | 用线条/文字绘制的图表 | 页面渲染为图片后按题裁剪 |
| 文本表格 | payoff matrix等（PDF中是文本但呈表格状） | 保留为文本，不生成图片 |

### 1.3 FRQ 结构

FRQ在PDF中结构简单：
- 题号 + 问题文本
- 偶尔有表格数据嵌入在文本中（如2016 Q1的production data）
- Scoring Rubric是文本段落，按评分点分段

---

## 2. JSON Schema

### 2.1 MCQ Schema

```json
{
  "question_id": "2012_Q1",
  "year": 2012,
  "question_number": 1,
  "question_type": "MCQ",
  "question_text": "题干文本，包含背景数据描述",
  "background_data": {
    "type": "text_table",
    "description": "表格上方或周围的说明文字",
    "columns": ["列名1", "列名2"],
    "rows": [
      ["值1", "值2"]
    ]
  },
  "options": [
    "(A) 选项A文本",
    "(B) 选项B文本",
    "(C) 选项C文本",
    "(D) 选项D文本",
    "(E) 选项E文本"
  ],
  "option_table_columns": ["列名1", "列名2"],
  "options_as_table": false,
  "correct_answer": "",
  "images": ["relative/path/to/image.png"],
  "diagram_references": ["diagram above"],
  "unit_tags": ["Unit_1"],
  "topic_tags": ["Opportunity_Cost"]
}
```

#### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `question_id` | string | ✅ | 格式：`{year}_Q{number}` |
| `year` | int | ✅ | 考试年份 |
| `question_number` | int | ✅ | 题号 |
| `question_type` | string | ✅ | 固定为"MCQ" |
| `question_text` | string | ✅ | 题干文本。如果包含背景数据表，用占位符`[TABLE_DATA]`或保留描述文字 |
| `background_data` | object | ❌ | 题干中的数据表格。见2.1.1 |
| `options` | array[string] | ✅ | 5个选项，每个包含`(A)`-`(E)`前缀。如果是表格选项，每个元素是一行数据 |
| `option_table_columns` | array[string] | ❌ | 表格选项的列名。有此字段表示options是表格行 |
| `options_as_table` | boolean | ❌ | 是否以表格渲染options。默认false |
| `correct_answer` | string | ❌ | 正确答案，如"A" |
| `images` | array[string] | ❌ | 图片路径数组，相对public/data目录 |
| `diagram_references` | array[string] | ❌ | 题干中提到的diagram引用（如"above"） |
| `unit_tags` | array[string] | ✅ | 单元标签，如["Unit_1"] |
| `topic_tags` | array[string] | ❌ | 主题标签 |

#### 2.1.1 background_data 结构

```json
{
  "type": "text_table",
  "description": "根据以上表格...",
  "columns": ["Country", "Manufactured Goods", "Service Goods"],
  "rows": [
    ["A", "100 units", "300 units"],
    ["B", "75 units", "150 units"]
  ]
}
```

**规则**：
- 如果题干文本中引用了一个表格（如"According to the table above"），提取为`background_data`
- 表格数据从PDF文本中解析，不是图片
- 如果表格无法干净解析（如payoff matrix有复杂的行列结构），保留为`question_text`中的文本描述

#### 2.1.2 options 两种格式

**格式1：纯文本选项**（大多数）
```json
"options": [
  "(A) It is the cost of producing...",
  "(B) It is the cost of the input mix...",
  "(C) It is the amount of one product...",
  "(D) It is the use of the least-cost...",
  "(E) It is the cost of labor used..."
],
"options_as_table": false
```

**格式2：表格选项**（如Q18, Q52, Q56）
```json
"options": [
  "(A) $11.00 | $10.45",
  "(B) $11.00 | $10.00",
  "(C) $10.45 | $10.00",
  "(D) $10.45 | $9.45",
  "(E) $10.00 | $9.45"
],
"option_table_columns": ["Paid by Consumers", "Received by Producers"],
"options_as_table": true
```

**注意**：表格选项的`options`每个元素用`|`分隔列值，前端解析为表格行。

---

### 2.2 FRQ Schema

```json
{
  "question_id": "2012_FRQ1",
  "year": 2012,
  "question_number": 1,
  "question_type": "FRQ",
  "question_text": "问题文本",
  "background_data": {
    "type": "text_table",
    "description": "",
    "columns": [],
    "rows": []
  },
  "parts": ["(a) 子问题1", "(b) 子问题2"],
  "images": [],
  "rubric": {
    "points": [
      {
        "point_id": "a",
        "value": 1,
        "description": "Part (a) 评分说明",
        "criteria": ["标准1", "标准2"]
      }
    ]
  },
  "unit_tags": ["Unit_1"],
  "topic_tags": []
}
```

#### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `question_id` | string | ✅ | 格式：`{year}_FRQ{number}` |
| `year` | int | ✅ | 考试年份 |
| `question_number` | int | ✅ | 题号 |
| `question_type` | string | ✅ | 固定为"FRQ" |
| `question_text` | string | ✅ | 问题文本（不含子问题） |
| `background_data` | object | ❌ | 同MCQ |
| `parts` | array[string] | ❌ | 子问题列表，如["(a)...", "(b)..."] |
| `images` | array[string] | ❌ | 图片路径 |
| `rubric` | object | ✅ | 评分标准 |
| `rubric.points` | array[object] | ✅ | 每个评分点 |
| `rubric.points[].point_id` | string | ✅ | 如"a", "b", "c(i)" |
| `rubric.points[].value` | int | ✅ | 分值 |
| `rubric.points[].description` | string | ✅ | 评分说明（必须包含具体内容，不能只写"Part (a)"） |
| `rubric.points[].criteria` | array[string] | ❌ | 具体评分标准 |
| `unit_tags` | array[string] | ✅ | 单元标签 |
| `topic_tags` | array[string] | ❌ | 主题标签 |

#### rubric 规则

**必须包含具体内容**：
- `description` 不能只是 "Part (a)" 或 "Question 1"
- 必须描述该评分点的具体要求和给分标准
- 示例："One point is earned for correctly identifying the opportunity cost of producing the first unit of Good B."

---

## 3. 图片处理规范

### 3.1 提取规则

1. **MCQ图片**：按题目裁剪，每题一个图片文件
2. **FRQ图片**：按题目裁剪，每题一个图片文件
3. **表格不转图片**：文本表格（如payoff matrix, production data）保留为文本，不生成图片

### 3.2 文件命名

```
{subject}/{year}/mcq/Q{number}.png
{subject}/{year}/frq/FRQ{number}.png
```

### 3.3 大小检查

- 单张图片不应超过500KB（超过可能是整页PDF未裁剪）
- 图片尺寸应与题目区域匹配，不应包含其他题目

---

## 4. 文本处理规范

### 4.1 编码清理

1. 替换Unicode引号：`\u2018`→`'`, `\u2019`→`'`, `\u201C`→`"`, `\u201D`→`"`
2. 删除替换字符：`\uFFFD` → 尝试恢复或标记
3. 检查PDF污染模式：`STOP`, `END OF EXAM`, `Unauthorized copying`

### 4.2 文本截断检查

- 题干文本不应以不完整的单词结尾
- 选项文本不应被截断
- 检查文本中是否有 "-3-" 等页码标记

---

## 5. 验证检查清单

### 5.1 数据结构验证

- [ ] `question_id` 格式正确
- [ ] `year` 和 `question_number` 与 `question_id` 一致
- [ ] `question_type` 是 "MCQ" 或 "FRQ"
- [ ] MCQ有5个选项
- [ ] FRQ有 `rubric.points` 数组
- [ ] `unit_tags` 非空

### 5.2 内容质量验证

- [ ] 文本中无 `\uFFFD` 替换字符
- [ ] 文本中无PDF污染模式
- [ ] 图片文件存在且大小合理（<500KB）
- [ ] 图片不包含其他题目的内容
- [ ] FRQ rubric description 包含具体内容（不只是"Part (a)"）
- [ ] 无跨题污染（一个题目的文本包含另一题的题干）
- [ ] background_data 和 options 不混淆

### 5.3 分类验证

- [ ] 每个题目至少有一个单元标签
- [ ] 单元标签在预定义列表中
- [ ] 分类基于题目内容，不只是关键词匹配

---

## 6. 前端渲染规范

### 6.1 MCQ渲染

```
if (options_as_table && option_table_columns) {
  渲染为表格(<table>)
} else {
  渲染为列表(<ul>或<ol>)
}

if (background_data) {
  在题干前渲染背景数据表格
}

if (images.length > 0) {
  在题干后/前渲染图片
}
```

### 6.2 FRQ渲染

```
渲染 question_text
if (parts.length > 0) {
  按parts数组渲染子问题
}
if (rubric) {
  渲染评分标准表格
}
```

---

## 7. 多科目复用

本规范适用于所有AP科目，科目差异通过以下方式处理：

1. **单元定义**：每个科目有独立的 `classification_config.json`
2. **题型差异**：如某些科目有6个选项（已废弃），通过schema验证捕获
3. **图片比例**：不同科目的图表类型不同，但图片处理流程一致

## 8. 版本历史

- v2.0 (2026-06-20): 基于2012 Micro PDF逐页分析，区分background_data和option_table，明确图片处理规则
- v1.0 (2026-06-15): 初始版本，未区分表格类型，导致大量混淆
