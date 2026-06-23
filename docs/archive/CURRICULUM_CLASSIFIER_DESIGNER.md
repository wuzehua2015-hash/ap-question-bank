---
name: curriculum-classifier-designer
description: |
  在从PDF提取题目之前，先吃透官方课程大纲和考试说明，设计基于教学顺序的分类规则。
  支持AP、IB、A-Level、自定义学科。
  输出：分类规则配置文件（JSON），供question-bank-builder使用。
  核心原则："学生学完这个单元后能不能做这道题？"（不是关键词匹配）。
triggers:
  - "设计分类规则"
  - "课程大纲分析"
  - "单元分类规则"
  - "从大纲设计分类"
  - "AP课程大纲"
  - "IB课程大纲"
  - "科目分类规则"
  - "curriculum classification"
  - "before PDF extraction"
  - "classify by syllabus"
---

# Curriculum Classifier Designer Skill

## Purpose

在从PDF提取题目之前，先完成课程大纲的深度分析和分类规则设计。这是题库构建的**第一步**，必须在任何PDF处理之前完成。

**为什么必须在PDF提取之前？**
- 分类规则决定了每个单元教什么、考什么
- 如果规则不清，提取后无法正确分类，后期返工成本极高
- 不同科目、不同考纲版本的单元定义不同，不能复用通用规则

## Input Requirements

### 1. 官方课程大纲（Course and Exam Description / Subject Guide）

**AP subjects:** College Board CED (Course and Exam Description) PDF
- 来源：apcentral.collegeboard.org → [Subject] → Course and Exam Description
- 必须包含：Unit definitions, topics, skills, exam weighting table

**IB subjects:** IB Subject Guide PDF
- 来源：ibo.org → Programme resources → Subject guides
- 必须包含：Syllabus content, assessment objectives, paper structure

**A-Level:** Exam board specification PDF
- 来源：AQA / Edexcel / OCR 官网
- 必须包含：Specification content, assessment structure, topic weighting

**Custom subjects:** 自编教学大纲文档（Markdown/Word）
- 必须包含：单元定义、知识点列表、教学目标、考试结构

### 2. 考试说明（Exam Information / Assessment Details）

- 考试时长、题型、题量
- 单元占比表（Unit weighting / Topic distribution）
- 样题或历年真题结构说明

## Step 1: Extract Curriculum Structure

### 1.1 Read the CED / Subject Guide

```python
# 读取官方大纲PDF
import pdfplumber

ced_path = "AP_Macroeconomics_CED.pdf"
with pdfplumber.open(ced_path) as pdf:
    full_text = "\n".join(page.extract_text() for page in pdf.pages)

# 保存完整文本供分析
with open("ced_full_text.txt", "w", encoding="utf-8") as f:
    f.write(full_text)
```

### 1.2 Extract Unit Definitions

从CED中提取每个单元的定义。AP CED通常有以下结构：

```
UNIT 3: National Income and Price Determination
~17–27% AP Exam Weighting
Topics:
  3.1 Aggregate Demand
  3.2 Multiplier
  3.3 Short-Run Aggregate Supply
  3.4 Long-Run Aggregate Supply
  3.5 Equilibrium in the AD-AS Model
  3.6 Changes in the AD-AS Model in the Short Run
  3.7 Long-Run Self-Adjustment Mechanism
  3.8 Fiscal Policy
  3.9 The Phillips Curve
```

**提取策略：**
```python
import re

# 匹配单元定义
unit_pattern = re.compile(
    r'UNIT\s+(\d+):\s+(.+?)\s+~?([\d–]+)%\s+AP\s+Exam\s+Weighting\s+(.*?)'
    r'(?=UNIT\s+\d+:|$)',
    re.DOTALL | re.IGNORECASE
)

units = []
for match in unit_pattern.finditer(full_text):
    unit_num = match.group(1)
    unit_name = match.group(2).strip()
    weighting = match.group(3)
    content = match.group(4)
    
    # 提取topics
    topics = re.findall(r'\d+\.\d+\s+(.+)', content)
    
    units.append({
        "code": f"U{unit_num}",
        "name": unit_name,
        "weighting": weighting,
        "topics": topics
    })
```

### 1.3 Extract Exam Structure

```python
# 从CED中提取考试结构
exam_info = {}

# 查找单元占比表
weighting_table = re.search(
    r'Unit\s+Weighting.*?(%.*?)+',
    full_text, re.DOTALL
)

# 查找考试时长和题型
exam_duration = re.search(r'(Time|Duration)[\s:]+(.+?)(minutes|hours)', full_text, re.IGNORECASE)
exam_mcq = re.search(r'(Multiple\s+Choice|MCQ)[\s:]+(\d+)', full_text, re.IGNORECASE)
exam_frq = re.search(r'(Free\s+Response|FRQ|Short\s+Answer)[\s:]+(\d+)', full_text, re.IGNORECASE)

exam_info = {
    "duration": exam_duration.group(2) if exam_duration else "unknown",
    "mcq_count": int(exam_mcq.group(2)) if exam_mcq else 0,
    "frq_count": int(exam_frq.group(2)) if exam_frq else 0,
    "unit_weighting": parse_weighting_table(weighting_table.group(0)) if weighting_table else {}
}
```

## Step 2: Design Classification Rules

### 2.1 原则：教学顺序标准

**核心标准（Golden Rule）：**
> "A student who has completed ONLY this unit should be able to answer this question."

这个标准强制我们思考：
- 这道题考察的概念，学生是在哪个单元第一次学的？
- 学生做这道题时，需要用到后面单元的知识吗？
- 如果题目涉及多个单元，哪个是核心？哪个只是上下文/干扰项？

### 2.2 提取每个单元的知识边界

对于每个单元，明确列出：

```json
{
  "unit": "U3",
  "name": "National Income and Price Determination",
  "core_concepts": [
    "Aggregate Demand (AD)",
    "Short-Run Aggregate Supply (SRAS)",
    "Long-Run Aggregate Supply (LRAS)",
    "AD-AS equilibrium",
    "Fiscal policy (government spending, taxes)",
    "Spending multiplier",
    "Tax multiplier",
    "Automatic stabilizers",
    "Short-run Phillips curve (SRPC)"
  ],
  "excluded_concepts": [
    "Money demand",
    "Money supply",
    "Monetary policy",
    "Central bank actions",
    "Banking system",
    "Loanable funds",
    "Interest rate determination",
    "Long-run economic growth",
    "Production function",
    "Human capital",
    "Crowding out",
    "Long-run Phillips curve (LRPC)",
    "Fiscal + monetary policy combinations"
  ],
  "boundary_rules": [
    "LRAS in AD-AS model = U3 (taught in U3 as part of AD-AS)",
    "LRAS in growth context = U5 (growth is U5 topic)",
    "SRPC = U3 (short-run Phillips curve is taught in U3)",
    "LRPC = U5 (long-run Phillips curve is taught in U5)",
    "Fiscal policy alone = U3",
    "Fiscal policy with monetary effects (interest rates) = U3 (monetary is just side effect)",
    "Fiscal + monetary COMBINATION = U5 (explicitly testing both together)"
  ]
}
```

### 2.3 设计边界规则（最重要）

对于每个容易混淆的边界，写出明确的决策规则：

```markdown
## U3 vs U4 Boundary

### Rule: Fiscal policy with monetary keywords in options
- If the question TESTS fiscal policy (AD shift, multiplier, taxes, spending)
  and "central bank" or "money supply" appears only in ONE or TWO wrong options
  → U3 (monetary terms are distractors)
- Example: "Which will increase AD? A) increase govt spending B) decrease money supply"
  → U3 (testing fiscal policy, monetary is distractor)

### Rule: Fiscal policy causing monetary effects
- If the question asks "what happens to interest rates when govt spending increases?"
  → U4 (testing loanable funds/interest rate effects of fiscal policy)
  OR U3 (if testing AD-AS with interest rate as side effect)
  → Context matters: if AD-AS graph is shown → U3; if loanable funds market is shown → U4

### Rule: Money/banking concepts
- "Money demand", "money supply", "money market", "central bank tools"
  → ALWAYS U4 (not taught in U3)
- "Bank reserves", "excess reserves", "money multiplier"
  → ALWAYS U4

## U3 vs U5 Boundary

### Rule: AD-AS vs Long-run growth
- PPF outward shift + LRAS shift → U5 (economic growth context)
- PPF + opportunity cost → U1 (basic concepts)
- AD-AS with LRAS in equilibrium → U3

### Rule: Phillips curve
- Short-run Phillips curve (trade-off) → U3
- Long-run Phillips curve (vertical) → U5
- "Short-run Phillips curve shows" → U3
- "Long-run Phillips curve shows" → U5

### Rule: Crowding out
- "Crowding out" → U5 (explicitly taught in U5)
- Government borrowing raises interest rates → could be U3 or U4
  - If testing AD-AS with reduced investment → U3
  - If testing loanable funds market → U4

## U4 vs U5 Boundary

### Rule: Fiscal + monetary combination
- "Which combination of fiscal and monetary policy will..." → U5
- "Government spending + central bank buys bonds" → U5
- "Taxes + open market operations" → U5
- Any EXPLICIT combination of fiscal action + monetary action → U5

### Rule: Monetary policy alone
- "Central bank sells bonds. What happens to money supply?" → U4
- "Fed increases discount rate. Effect on AD?" → U4 (monetary policy affecting AD is U4)
  OR U3 (if AD-AS graph shown and testing AD shift)
  → If the question TESTS the monetary transmission mechanism → U4
  → If the question TESTS AD-AS equilibrium with monetary policy as AD shifter → U3
```

### 2.4 生成分类规则配置文件

```json
{
  "subject": "AP Macroeconomics",
  "version": "2019 CED",
  "classification_standard": "A student who has completed ONLY this unit should be able to answer this question.",
  "units": [
    {
      "code": "U1",
      "name": "Basic Economic Concepts",
      "weighting": "5–10%",
      "core_concepts": ["scarcity", "opportunity cost", "PPF", "comparative advantage", "specialization", "trade"],
      "excluded_concepts": ["GDP", "unemployment", "inflation", "AD-AS", "fiscal policy", "monetary policy", "money", "banking", "growth"],
      "distinguishing_features": ["No macroeconomic aggregates", "No government policy", "No money/banking"],
      "example_questions": ["Comparative advantage calculation", "PPF opportunity cost", "Terms of trade"]
    },
    {
      "code": "U2",
      "name": "Economic Indicators and the Business Cycle",
      "weighting": "12–17%",
      "core_concepts": ["GDP", "real vs nominal GDP", "unemployment types", "inflation", "CPI", "business cycle", "natural rate of unemployment"],
      "excluded_concepts": ["AD-AS", "fiscal policy", "monetary policy", "money supply", "banking", "growth"],
      "distinguishing_features": ["Measurement and definition", "No policy analysis", "No market models"],
      "example_questions": ["Calculate GDP", "Identify unemployment type", "CPI calculation", "Business cycle stages"]
    },
    {
      "code": "U3",
      "name": "National Income and Price Determination",
      "weighting": "17–27%",
      "core_concepts": ["AD-AS model", "SRAS", "LRAS", "AD", "fiscal policy", "multiplier", "short-run Phillips curve", "stagflation", "inflationary/recessionary gaps"],
      "excluded_concepts": ["money demand", "money supply", "monetary policy", "central bank", "banking", "loanable funds", "long-run growth", "crowding out", "LRPC", "fiscal-monetary combinations"],
      "distinguishing_features": ["AD-AS is the core model", "Fiscal policy only (no monetary)", "Short-run focus"],
      "boundary_rules": [
        "Monetary terms in options as distractors → still U3",
        "Fiscal policy causing interest rate changes → U3 (if AD-AS context) or U4 (if loanable funds context)",
        "SRPC = U3, LRPC = U5",
        "LRAS in AD-AS equilibrium = U3; LRAS in growth context = U5"
      ],
      "example_questions": ["AD shift causes", "Fiscal policy multiplier", "SRPC trade-off", "Stagflation cause"]
    },
    {
      "code": "U4",
      "name": "Financial Sector",
      "weighting": "18–23%",
      "core_concepts": ["money demand", "money supply", "money market", "banking system", "monetary policy tools", "central bank", "Fed", "interest rates", "loanable funds", "bond prices", "money multiplier"],
      "excluded_concepts": ["fiscal policy", "AD-AS equilibrium", "fiscal-monetary combinations", "long-run growth", "crowding out"],
      "distinguishing_features": ["Money/banking focus", "Monetary policy tools", "Interest rate determination", "No fiscal policy combinations"],
      "boundary_rules": [
        "Monetary policy affecting AD → U4 (monetary transmission) or U3 (AD-AS equilibrium)",
        "Fiscal policy in background + loanable funds in foreground → U4",
        "Money demand/supply = U4 (not in U3 curriculum)"
      ],
      "example_questions": ["Money demand shift", "Open market operation effect", "Money multiplier calculation", "Loanable funds market"]
    },
    {
      "code": "U5",
      "name": "Long-Run Consequences of Stabilization Policies",
      "weighting": "20–30%",
      "core_concepts": ["fiscal-monetary policy combinations", "economic growth", "production function", "human capital", "technology", "crowding out", "long-run Phillips curve", "supply-side economics", "rational expectations"],
      "excluded_concepts": ["AD-AS alone", "fiscal policy alone", "monetary policy alone", "money market mechanics"],
      "distinguishing_features": ["Policy combinations", "Long-run focus", "Growth theory", "LRPC"],
      "boundary_rules": [
        "EXPLICIT combination of fiscal + monetary → U5",
        "Long-run growth (PPF/LRAS shifting outward) → U5",
        "Crowding out → U5",
        "LRPC → U5 (SRPC is U3)"
      ],
      "example_questions": ["Policy combination for recession", "Growth from human capital", "Crowding out effect", "LRPC shape"]
    },
    {
      "code": "U6",
      "name": "Open Economy—International Trade and Finance",
      "weighting": "10–13%",
      "core_concepts": ["exchange rates", "foreign exchange market", "balance of payments", "net exports", "trade deficits/surpluses", "tariffs", "quotas", "capital flows"],
      "excluded_concepts": ["domestic AD-AS", "fiscal policy", "monetary policy", "growth", "crowding out"],
      "distinguishing_features": ["Foreign trade and finance", "Exchange rates", "International capital flows"],
      "example_questions": ["Exchange rate appreciation effect", "BOP account classification", "Tariff effect on trade"]
    }
  ],
  "cross_unit_rules": [
    {
      "situation": "Fiscal policy + monetary terms in options",
      "rule": "If monetary terms are ONLY in wrong options (distractors) → U3. If monetary terms are in the correct answer or central to the question → U4 or U5."
    },
    {
      "situation": "AD-AS with monetary policy",
      "rule": "If testing AD shift from monetary policy → U4 (monetary transmission) or U3 (AD-AS equilibrium). Default: U4 if monetary mechanism is tested; U3 if AD-AS equilibrium is tested."
    },
    {
      "situation": "Interest rate changes from fiscal policy",
      "rule": "If loanable funds market shown → U4. If AD-AS graph shown → U3."
    },
    {
      "situation": "LRAS mentioned",
      "rule": "In AD-AS equilibrium context → U3. In growth/productivity context → U5."
    },
    {
      "situation": "Phillips curve mentioned",
      "rule": "Short-run → U3. Long-run → U5."
    }
  ],
  "common_pitfalls": [
    "Do NOT classify by keyword frequency ('taxes' 5x = U3 is wrong if the question is about money supply)",
    "Do NOT classify by first keyword mentioned",
    "Do NOT let distractors determine the unit",
    "Do NOT ignore context: the same concept (e.g., interest rates) can be U3 or U4 depending on context",
    "ALWAYS check: would a student who only studied this unit know this concept?"
  ]
}
```

## Step 3: Validate Rules with Sample Questions

### 3.1 Test the rules on known questions

用官方样题或课程大纲中的例题测试分类规则：

```python
# 从CED中提取sample questions
sample_questions = extract_sample_questions(ced_path)

# 用设计的规则分类
for q in sample_questions:
    predicted = classify_by_rules(q, classification_config)
    expected = q['expected_unit']  # 从CED中标注的单元
    
    if predicted != expected:
        print(f"RULE MISMATCH: {q['id']}")
        print(f"  Text: {q['text'][:100]}")
        print(f"  Predicted: {predicted}, Expected: {expected}")
        print(f"  Adjust rule for this case")
```

### 3.2 Adjust rules until 100% match on sample questions

如果样题分类不匹配，调整规则直到完全匹配。样题是官方给出的标准答案，必须100%正确。

## Step 4: Output Classification Config

### 4.1 Save as JSON

```json
{
  "subject": "AP Macroeconomics",
  "version": "2019 CED",
  "classification_standard": "teaching_sequence",
  "units": [...],
  "cross_unit_rules": [...],
  "common_pitfalls": [...]
}
```

保存到：`classification_config.json`

### 4.2 Generate Markdown Documentation

生成人类可读的分类规则文档，供后续审核使用。

保存到：`docs/CLASSIFICATION_RULES.md`

## Step 5: Handoff to question-bank-builder

将生成的 `classification_config.json` 作为输入传给 `question-bank-builder` skill：

```
classification_config.json → question-bank-builder → Extract PDFs → Classify by rules
```

**Builder skill必须：**
1. 读取classification_config.json
2. 使用其中的规则（不是关键词权重）
3. 遇到边界情况时，参考cross_unit_rules
4. 对不确定的题目，标记为NEEDS_REVIEW而不是猜测

## Success Criteria

- [ ] 官方CED/大纲已完整读取
- [ ] 每个单元的core_concepts和excluded_concepts已明确列出
- [ ] 所有边界情况（U3/U4, U4/U5, U3/U5）有明确规则
- [ ] 样题分类100%匹配官方标注
- [ ] classification_config.json已生成
- [ ] Markdown文档已生成
- [ ] 配置已传给question-bank-builder

## Common Pitfalls

| Pitfall | Why It Happens | Prevention |
|---------|---------------|------------|
| 关键词权重分类 | 用"taxes"出现次数决定U3 | 用"教学顺序"标准：学生没学过U4/5就不应该遇到这道题 |
| 干扰项决定单元 | 选项里有U4关键词就归U4 | 只看核心概念，distractors不改变单元 |
| 忽视上下文 | "interest rates"总是U4 | 财政政策的利率效应是U3，loanable funds才是U4 |
| 不区分SR/LR Phillips | 看到Phillips就归U3 | SRPC=U3, LRPC=U5，必须区分 |
| 不区分AD-AS LRAS和Growth LRAS | LRAS总是U3 | AD-AS中的LRAS=U3，PPF/LRAS outward shift=U5 |
| 忽略样题验证 | 规则设计完不测试 | 必须用官方样题验证100%正确率 |
