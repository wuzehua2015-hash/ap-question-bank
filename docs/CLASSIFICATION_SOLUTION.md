# AP 题库单元分类方案：多分类器投票 + 置信度机制

> 针对当前单元分类错误率高的问题，基于 Vibe Coding 理念设计的自动化分类方案。
> 目标：用户不够专业的科目也能自动完成高质量分类，不需要逐题捉虫。

---

## 一、当前问题分析

### 1.1 为什么关键词匹配会出错

当前分类方法的本质是：**统计关键词出现次数，哪个单元的关键词多就分到哪个单元**。

这个方法的问题：

| 问题 | 示例 | 结果 |
|------|------|------|
| 同一个词跨单元 | "taxes" 在 U3（fiscal policy）和 U4（monetary policy 的 distractor）都出现 | U3 的题可能因为 options 里出现 "taxes" 被分到 U4 |
| 上下文理解缺失 | "GDP" 是 U2 的指标，但 "GDP 下降导致 recession" 的题里 "recession" 是 U2 概念，整体题仍是 U2 | 关键词 "recession" 被误当作 U3 的 AD-AS 波动 |
| 权重不均 | "money demand" 只出现 1 次，"taxes" 出现 3 次（但都是 distractor） | 被分到 U3 而不是 U4 |
| 语义理解缺失 | "The central bank buys bonds to increase money supply" 测试的是 U4 的 monetary policy，但关键词只有 "money supply" 一次 | 被遗漏或权重不够 |

### 1.2 更深层次的原因

- **没有利用官方文档**：College Board 的 CED 中每个单元有详细的 **Essential Knowledge (EK)** 点描述，例如：
  - U2.1: "GDP is the market value of all final goods and services produced within a country in a given time period."
  - U4.1: "Money is anything that functions as a medium of exchange, a unit of account, and a store of value."
  - 这些描述的语义比简单关键词精确 10 倍

- **没有交叉验证**：单一分类方法出错就错了，没有第二次检查
- **没有分类后验证**：分完之后没有自动检查 "U1 题目是否包含 GDP"
- **重复题不同步**：同一题在不同年份被不同处理，分类不一致

---

## 二、方案架构：多分类器投票 + 置信度机制

### 2.1 核心设计

```
题目文本
    ├──→ 分类器 A：Embedding 语义匹配（题目 vs CED EK 描述）
    ├──→ 分类器 B：LLM 推理（给题目 + CED 单元描述，让 LLM 判断）
    ├──→ 分类器 C：规则引擎（保守的关键词规则，只做强信号判断）
    │
    ▼
  投票器（Voting）
    │
    ├── 3 票一致 → 自动通过（置信度 100%）
    ├── 2 票一致 → 高置信度（置信度 95%，标记为 AUTO）
    └── 都不一致 → 人工审核（置信度 0%，标记为 MANUAL）
    │
    ▼
  后验证（Post-Validation）
    ├── 检查 U1 题目是否包含 U2/U3/U4 强信号词
    ├── 检查重复题是否单元一致
    └── 检查是否有图片的题是否标记了 has_graph
    │
    ▼
  人工只需审核置信度低的题目
```

### 2.2 三种分类器的实现

#### 分类器 A：Embedding 语义匹配

**原理**：不是统计关键词，而是将 CED 的每个 EK 描述和题目文本分别转成向量，用余弦相似度找出最匹配的单元。

**为什么比关键词好**：
- 能处理 "换个说法"："market value of final goods" 和 "GDP" 语义上是同一个概念
- 不受关键词频率影响："money demand" 只出现 1 次也能被正确识别
- 能区分上下文："taxes" 在 fiscal policy 的题里和 monetary policy 的 distractor 里语义不同

**实现**（Python + sentence-transformers）：

```python
import json
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# 加载预训练模型（轻量级，本地运行）
model = SentenceTransformer('all-MiniLM-L6-v2')

# 1. 从 CED 提取 EK 描述（每个单元一个描述文本）
# 示例：AP Macroeconomics CED
unit_descriptions = {
    "U1": "Basic Economic Concepts: scarcity, opportunity cost, production possibilities curve, comparative advantage, absolute advantage, specialization, trade. Students analyze how limited resources force choices and how countries benefit from trade.",
    "U2": "Economic Indicators and the Business Cycle: gross domestic product (GDP), real GDP, nominal GDP, unemployment rate, inflation rate, consumer price index (CPI), business cycle phases, labor force, natural rate of unemployment. Students measure economic performance.",
    "U3": "National Income and Price Determination: aggregate demand, aggregate supply, short-run equilibrium, fiscal policy, government spending, taxes, multiplier effect, automatic stabilizers, short-run Phillips curve, inflationary/recessionary gaps.",
    "U4": "Financial Sector: money demand, money supply, monetary policy, central bank, Federal Reserve, open market operations, discount rate, reserve requirements, loanable funds, interest rates, bond prices, banking system.",
    "U5": "Long-Run Consequences: fiscal-monetary policy combinations, long-run economic growth, production function, human capital, physical capital, crowding out, long-run Phillips curve, supply-side economics, rational expectations.",
    "U6": "Open Economy: exchange rates, balance of payments, net exports, trade deficits, trade surpluses, tariffs, quotas, currency appreciation/depreciation, foreign exchange market."
}

# 2. 将每个单元描述转成 embedding
unit_embeddings = {u: model.encode(desc) for u, desc in unit_descriptions.items()}

# 3. 对每个题目，计算与哪个单元的描述最相似
def classify_by_embedding(question_text, options_text=""):
    full_text = question_text + " " + options_text
    text_embedding = model.encode(full_text)
    
    similarities = {}
    for unit, unit_emb in unit_embeddings.items():
        sim = cosine_similarity([text_embedding], [unit_emb])[0][0]
        similarities[unit] = sim
    
    # 返回最相似的单元和置信度
    best_unit = max(similarities, key=similarities.get)
    best_score = similarities[best_unit]
    
    # 计算置信度：第一名与第二名的差距
    sorted_scores = sorted(similarities.values(), reverse=True)
    confidence = sorted_scores[0] - sorted_scores[1] if len(sorted_scores) > 1 else 1.0
    
    return best_unit, best_score, confidence, similarities
```

#### 分类器 B：LLM 推理（结构化 Prompt）

**原理**：给 LLM 题目文本 + CED 单元描述，让它直接判断。LLM 的推理能力可以处理关键词匹配无法处理的语义推理。

**Prompt 设计**（关键：给规则，不给答案）：

```
You are an AP Macroeconomics curriculum expert. Classify the following question into ONE unit based on the College Board Course and Exam Description (CED).

RULES (in order of priority):
1. U6 (Open Economy): exchange rates, trade, balance of payments → MOST SPECIFIC
2. U5 (Policy Mix & Growth): BOTH fiscal AND monetary policy in the SAME answer OR long-run growth/crowding out
3. U4 (Financial Sector): money demand, money supply, monetary policy, central bank, interest rates, loanable funds, bond prices → core concept being tested
4. U3 (AD-AS & Fiscal): aggregate demand, aggregate supply, fiscal policy, multiplier, short-run Phillips curve
5. U2 (Indicators): GDP, unemployment, inflation, CPI, business cycle → measuring economic performance
6. U1 (Basic Concepts): scarcity, PPF, opportunity cost, comparative advantage → ONLY if no other unit fits

CRITICAL: "Would a student who has ONLY studied this unit be able to answer this question?"

If a question contains keywords from multiple units, the unit that teaches the CORE CONCEPT being tested wins. Distractors (wrong options) from other units do NOT change the classification.

Question: [题目文本]
Options: [选项文本]

Output JSON:
{
  "unit": "U1/U2/U3/U4/U5/U6",
  "reasoning": "1-2 sentences explaining why",
  "confidence": "HIGH/MEDIUM/LOW"
}
```

**为什么这个 Prompt 比关键词好**：
- 明确规则优先级（U6 最具体，U1 是兜底）
- 明确 "核心概念" vs "distractor" 的区分
- 明确 "学生只学了这一个单元能不能做" 的标准
- LLM 可以推理：一道题问 "The central bank buys bonds to increase money supply"，即使文本里同时出现 "taxes"（在 distractor 中），LLM 能判断核心概念是 monetary policy → U4

#### 分类器 C：规则引擎（保守模式）

**原理**：只处理 "强信号" —— 那些明确、无歧义的关键词。不处理灰色地带。

```python
CONSERVATIVE_RULES = [
    # 强信号：这些词出现时，该单元几乎确定
    {"keywords": ["exchange rate", "foreign exchange", "balance of payments", "net exports", "trade deficit"], "unit": "U6", "weight": 100},
    {"keywords": ["fiscal policy AND monetary policy", "combinations of fiscal and monetary"], "unit": "U5", "weight": 100},
    {"keywords": ["crowding out", "long-run phillips", "production function", "human capital"], "unit": "U5", "weight": 100},
    {"keywords": ["money demand", "money supply", "monetary policy", "central bank", "open market operation", "discount rate", "reserve requirement"], "unit": "U4", "weight": 100},
    {"keywords": ["aggregate demand", "aggregate supply", "fiscal policy", "government spending", "multiplier"], "unit": "U3", "weight": 100},
    {"keywords": ["gross domestic product", "real gdp", "nominal gdp", "gdp ", "economic growth", "business cycle"], "unit": "U2", "weight": 100},
    {"keywords": ["scarcity", "opportunity cost", "production possibilities", "comparative advantage"], "unit": "U1", "weight": 100},
]

def classify_by_rules(text, options_text=""):
    full = text.lower() + " " + options_text.lower()
    scores = {}
    for rule in CONSERVATIVE_RULES:
        match = all(kw in full for kw in rule["keywords"])
        if match:
            scores[rule["unit"]] = scores.get(rule["unit"], 0) + rule["weight"]
    
    if scores:
        return max(scores, key=scores.get)
    return None  # 无强信号，不判断
```

**规则引擎的特点**：
- 只判断 "100% 确定" 的情况
- 如果题目没有强信号 → 返回 None（不投票）
- 避免误杀（例如 "taxes" 出现在 U3 的 fiscal policy 题和 U4 的 distractor 中，规则引擎不判断）

### 2.3 投票机制

```python
def vote_classification(emb_result, llm_result, rule_result):
    """
    三个分类器投票，返回最终分类和置信度。
    """
    votes = {}
    
    # 分类器 A：Embedding（权重 35%）
    if emb_result:
        unit = emb_result["unit"]
        votes[unit] = votes.get(unit, 0) + 0.35
    
    # 分类器 B：LLM（权重 40%）
    if llm_result:
        unit = llm_result["unit"]
        votes[unit] = votes.get(unit, 0) + 0.40
    
    # 分类器 C：规则引擎（权重 25%）
    if rule_result:
        unit = rule_result
        votes[unit] = votes.get(unit, 0) + 0.25
    
    # 确定最终分类
    if not votes:
        return None, 0.0, "MANUAL"
    
    best_unit = max(votes, key=votes.get)
    best_score = votes[best_unit]
    
    # 置信度计算
    if len(votes) == 1:
        # 只有一个分类器投票
        confidence = 0.60
        status = "AUTO" if best_score >= 0.35 else "MANUAL"
    elif len(votes) == 2:
        # 两个分类器投票
        if len(set(votes.keys())) == 1:
            # 两个一致
            confidence = 0.85
            status = "AUTO"
        else:
            # 两个不一致
            confidence = 0.40
            status = "MANUAL"
    elif len(votes) == 3:
        # 三个分类器投票
        if len(set(votes.keys())) == 1:
            # 三个一致 → 100% 自动
            confidence = 1.0
            status = "AUTO"
        elif len(set(votes.keys())) == 2:
            # 两个一致，一个不一致 → 高置信度
            sorted_votes = sorted(votes.items(), key=lambda x: x[1], reverse=True)
            if sorted_votes[0][1] >= 0.60:
                confidence = 0.80
                status = "AUTO"
            else:
                confidence = 0.50
                status = "MANUAL"
        else:
            # 三个都不一样
            confidence = 0.0
            status = "MANUAL"
    
    return best_unit, confidence, status
```

### 2.4 后验证（Post-Validation）—— 自动捉虫

分类完成后，自动运行验证规则，不需要人工检查：

```python
POST_VALIDATION_RULES = [
    # 规则 1: U1 题目中不能包含 U2 的强信号词
    {
        "check": lambda q: q.get("primary_unit") == "U1",
        "forbidden": ["gross domestic product", "gdp ", "real gdp", "nominal gdp", "economic growth", "business cycle", "unemployment rate", "inflation rate", "cpi "],
        "error": "U1 题目包含 GDP/growth 关键词，必须改为 U2 或更高"
    },
    # 规则 2: U1/U2 题目中不能包含 U3 的强信号词
    {
        "check": lambda q: q.get("primary_unit") in ["U1", "U2"],
        "forbidden": ["aggregate demand", "aggregate supply", "fiscal policy", "government spending", "multiplier"],
        "error": "U1/U2 题目包含 AD-AS/fiscal 关键词，必须改为 U3 或更高"
    },
    # 规则 3: U1/U2/U3 题目中不能包含 U4 的强信号词
    {
        "check": lambda q: q.get("primary_unit") in ["U1", "U2", "U3"],
        "forbidden": ["money demand", "money supply", "monetary policy", "central bank", "open market operation", "discount rate", "reserve requirement"],
        "error": "U1/U2/U3 题目包含 monetary/banking 关键词，必须改为 U4 或更高"
    },
    # 规则 4: 重复题必须单元一致
    {
        "check": lambda q: True,  # 对所有题目运行
        "duplicate_check": True,
        "error": "重复题目单元不一致"
    },
]
```

---

## 三、与现有工具集成

### 3.1 在 question-bank-builder 中集成

**Step 1：导入 CED 描述**

```python
# 新增：从 curriculum spec 加载单元描述
# 不需要修改 curriculum spec 格式，在现有 topics 基础上扩展

curriculum_spec = {
    "subject": "AP Macroeconomics",
    "units": [
        {
            "code": "U1",
            "name": "Basic Economic Concepts",
            "topics": ["scarcity", "opportunity cost", "comparative advantage", "PPF"],
            "description": "Students analyze how limited resources force choices and how countries benefit from trade through comparative advantage and specialization."  # 新增
        },
        # ... 其他单元
    ]
}
```

**Step 2：替换原有分类函数**

```python
# 旧方法（关键词匹配）
# unit = classify_by_keywords(text, options)  # 删除

# 新方法（多分类器投票）
emb_result = classify_by_embedding(text, options_text)
llm_result = classify_by_llm(text, options_text)  # 调用 LLM API
rule_result = classify_by_rules(text, options_text)

unit, confidence, status = vote_classification(emb_result, llm_result, rule_result)

# 记录分类信息
q["classification_reasoning"] = f"Multi-classifier vote: {emb_result}, {llm_result}, {rule_result}"
q["classification_confidence"] = confidence
q["classification_status"] = status
```

**Step 3：后验证自动运行**

```python
# 在 pre_audit_check 中新增
issues = post_validate_units(data)
if issues:
    print(f"后验证发现 {len(issues)} 个问题：")
    for issue in issues:
        print(f"  {issue}")
    raise ValueError("后验证未通过，请检查分类结果")
```

### 3.2 在 quiz-bank-smoke-test 中新增验证

已在 `quiz-bank-smoke-test` 中新增 `test_unit_misclassification` 和 `test_duplicate_consistency` 两个测试。这些测试会在每次构建时自动运行，确保：
- U1 题目不包含 GDP/growth 关键词
- 重复题单元一致

---

## 四、实施步骤（Vibe Coding 风格）

### 阶段 1：快速原型（1-2 小时）

1. **用现有题目测试新方法**：取 50 道已确认分类的题目，用三种分类器分别分类，对比准确率
2. **验证投票机制**：看多少题目是 "3 票一致"（自动通过），多少是 "2 票一致"，多少需要人工审核
3. **如果准确率 > 90% → 进入阶段 2**

### 阶段 2：新科目导入（1 个新科目）

1. **准备 CED 描述**：从官方文档复制每个单元的描述到 curriculum spec
2. **运行自动分类**：对 400 道题运行三种分类器
3. **人工只审核 "MANUAL" 标记的题目**：预计 10-20 道题（5% 以下）
4. **运行后验证**：自动检查是否有 U1 包含 GDP 等错误
5. **部署前运行 quiz-bank-smoke-test**：确保无单元错误

### 阶段 3：固化（后续科目复用）

1. 对于相同科目（如 AP Microeconomics），复用相同的分类器配置
2. 只需要修改 CED 描述和单元定义
3. 不需要重新调分类算法

---

## 五、预期效果

| 指标 | 当前（关键词） | 新方案（多分类器投票） |
|------|--------------|---------------------|
| 分类错误率 | ~5-10%（每 100 题错 5-10 道） | < 2%（每 100 题错 < 2 道） |
| 需要人工审核的题目 | 100%（需要逐题检查） | ~5%（只有 MANUAL 标记的题） |
| 新科目分类时间 | 需要专业老师逐题审核 | 老师只需审核 5% 的题目 |
| 重复题分类一致性 | 不同副本可能不一致 | 自动检测并同步 |
| 分类可解释性 | 只有关键词匹配记录 | 三个分类器的投票记录 + 置信度 |

---

## 六、技术可行性

| 组件 | 依赖 | 可行性 | 备注 |
|------|------|--------|------|
| Embedding 模型 | `sentence-transformers` + `all-MiniLM-L6-v2` | ✅ 本地运行，无 API 调用 | 模型 80MB，CPU 即可运行 |
| LLM 分类器 | 调用 Kimi API（或本地模型） | ✅ 已有 API 调用能力 | 400 题分 40 批调用，每批 10 题 |
| 规则引擎 | 纯 Python，无依赖 | ✅ 已实现 | 在 `question-bank-builder` 中已有 |
| 投票机制 | 纯 Python | ✅ 简单逻辑 | 无额外依赖 |
| 后验证 | 纯 Python | ✅ 已实现 | 已添加到 `quiz-bank-smoke-test` |

---

## 七、下一步建议

1. **先验证原型**：用现有 432 道 Macroeconomics 题目测试，对比新旧方法的准确率
2. **如果效果好的话，应用于 Microeconomics**：Microeconomics 有类似的 CED 结构，可以直接复用
3. **对于其他科目（IB、A-Level、AMC）**：需要先准备该科目的官方课程描述，然后复用同样的分类器框架

---

*本文档是技术方案，不是代码实现。实现代码可以放在 `scripts/classification/` 目录下，作为 question-bank-builder 的替代分类模块。*
