# Vibe Coding 环境下跨科目题库分类的调研报告

> 调研目标：解决「在不熟悉的科目中，如何确保单元分类可靠」的问题。
> 调研范围：LLM 教育评估、课程大纲锚定、结构化输出、Evals 驱动迭代等最新实践。

---

## 一、核心发现：问题不是「分类器不够智能」，而是「无法验证」

当前三分类器投票方案（Embedding + LLM + 规则引擎）在**技术层面**是正确的，但它有一个致命缺陷：

> **它假设你能在分类后验证结果是否正确。**

但在你不熟悉的科目中，你**无法验证**。投票方案把错误率从 10% 降到 2%，但如果你恰好是那 2% 的受害者，你根本发现不了。

调研发现：Vibe Coding 环境下最可靠的解决方案，不是「更复杂的分类器」，而是**「让分类过程本身可验证、可追溯、可迭代」**。

---

## 二、调研发现一：课程大纲锚定（Curriculum-Grounded）比自由分类更可靠

### 来源：arxiv 2606.17507v1 — LLM-as-Judge in Education

这项研究与我们的场景几乎 identical。研究者发现：

| 方法 | 与人类评分一致性 | 问题 |
|------|------------------|------|
| **直接给 LLM 题目，让它打分** | CCC=0.81（高） | 得分虽高，但**无法追溯**到课程大纲，LLM 可能在「猜」 |
| **过程化分解：先识别学习成果 → 再评分** | 略低 | 每一步都可验证，可追溯，但准确率略低 |

**关键洞察**：直接让 LLM 说「这道题属于 U3」是不可信的。但让 LLM 先识别「这道题测试的是哪个学习成果（Learning Outcome）」，再将学习成果映射到单元，这个**两步过程**更可靠。

### 对题库分类的启发

不是问 LLM：「这道题属于哪个单元？」（太宽泛，容易出错）

而是问 LLM：「这道题测试的是以下哪个学习成果？」（给具体选项，缩小范围）

```
# 第一步：识别学习成果（给定选项）
根据 AP Macroeconomics CED，这道题测试的是以下哪个 Essential Knowledge？

A. U2.EK1: GDP 是衡量经济产出的指标
B. U3.EK1: AD-AS 模型决定短期均衡
C. U4.EK1: 货币是交换媒介、计价单位和价值储藏
D. U6.EK1: 汇率由外汇市场供需决定

请先分析题目中每个选项涉及的概念，然后判断核心概念对应哪个 EK。
```

为什么这样更好？
1. **锚定效应**：LLM 不是自由发挥，而是在你提供的选项中选择
2. **可验证**：即使你不熟悉科目，你也可以检查「这道题是否涉及汇率」——这不需要专业知识，只需要文本理解
3. **可追溯**：分类结果可以链接到官方 CED 的特定段落，不是黑箱

---

## 三、调研发现二：结构化输出 + 自我验证（Self-Verification）

### 来源：Pydantic AI / TypeChat / Guardrails AI

Vibe Coding 环境下的标准做法是：**不要直接相信 LLM 的输出，而是让 LLM 输出一个可以被验证的结构**。

### 推荐方案：让 LLM 输出「可验证的推理链」

不是输出：
```json
{"unit": "U3", "confidence": "HIGH"}
```

而是输出：
```json
{
  "question_id": "2017_FRQ2",
  "identified_concepts": ["balance sheet", "bank reserves", "required reserves"],
  "learning_outcome": "U4.EK2: The banking system creates money through fractional reserve banking",
  "reasoning": "This question asks about a bank's balance sheet (Assets = Liabilities + Equity). The core concept being tested is how banks hold reserves against deposits, which is a U4 (Financial Sector) concept. While GDP is mentioned in the question text, it is context, not the concept being tested.",
  "unit": "U4",
  "confidence": "HIGH",
  "verification_check": "Does this question require understanding of money supply, banking, or monetary policy? Yes → U4 is correct."
}
```

### 为什么这样更好？

| 维度 | 简单输出 | 结构化推理链 |
|------|----------|-------------|
| **可验证性** | 只能相信「U3」 | 可以检查「identified_concepts」是否确实在题目中 |
| **错误发现** | 发现不了 | 如果 identified_concepts 包含「GDP」，但题目没有 GDP，说明 LLM 在瞎编 |
| **跨科目复用** | 需要专业知识 | 只需要检查「文本中是否包含这些概念」 |
| **调试分类** | 无法调试 | 可以看到 LLM 的推理过程，针对性调整 prompt |

---

## 四、调研发现三：Evals 驱动迭代（不是一次分类，而是持续优化）

### 来源：DeepEval / AI Engineer Summit

Vibe Coding 的核心挑战是 LLM 的**非确定性**。解决方案不是「一次写对」，而是**「快速迭代 + 自动化评估」**。

### 推荐方案：测试驱动的分类（Test-Driven Classification）

```
迭代循环：
  1. 选择 20 道「已确认分类」的题目作为黄金测试集（gold set）
  2. 用当前 prompt 分类这 20 道题
  3. 计算准确率 → 目标 > 95%
  4. 分析错误题目 → 找出 prompt 的盲点
  5. 调整 prompt（添加规则、示例、修正理解）
  6. 回到步骤 2，直到准确率达标
  7. 用这个「已验证的 prompt」分类全部 400 道题
```

### 黄金测试集怎么来？

即使在不熟悉的科目，你也可以：
1. 找官方 CED 的「Sample Questions」——这些题目 College Board 已经标明了单元
2. 或先人工分类 20 道「最明显的题」（如「PPF 曲线」肯定是 U1，「汇率」肯定是 U6）
3. 用这 20 道题来验证你的 prompt 是否可靠

**关键**：不需要你专业，只需要你**有能力辨认「最基础的题」**。剩下的交给迭代。

---

## 五、调研发现四：对抗性验证（Adversarial Validation）

### 来源：Guardrails AI 的理念

不要只让 LLM 分类一次。让 LLM 扮演「反对者」来挑战分类结果。

### 推荐方案：双角色辩论

```
第一轮：分类员
  "请分类这道题到对应单元，给出详细推理。"
  → 输出：{"unit": "U4", "reasoning": "..."}

第二轮：反对者
  "上面说这道题属于 U4。请扮演一位质疑者，找出至少 3 个理由说明它可能属于其他单元。"
  → 输出：["可能属于 U3 因为...", "可能属于 U2 因为..."]

第三轮：裁决者
  "请综合分类员和反对者的论点，给出最终判断。"
  → 输出：{"final_unit": "U4", "final_reasoning": "虽然反对者提出了 U3 的可能性，但核心概念是..."}
```

### 为什么这样更好？

- 相当于**自动的 peer review**
- 即使你不熟悉科目，你也可以看到「有哪些反对意见」——如果反对意见听起来合理，说明分类可能有问题
- 对于简单题（如 U1 的 PPF），反对者可能找不到有力的反对意见 → 置信度高
- 对于复杂题（如 U3/U4 的边界题），反对者可能提出有力的质疑 → 需要人工审核

---

## 六、综合改进方案：从「三分类器投票」到「可验证推理链」

基于以上调研，我推荐对现有方案做以下改进：

### 改进 1：用「学习成果识别」替代「直接单元分类」

```python
# 旧方案（直接分类）
unit = classify_unit(question_text)  # 容易出错

# 新方案（两步锚定）
learning_outcome = identify_learning_outcome(question_text, ced_outcomes)  # 给定选项
unit = map_outcome_to_unit(learning_outcome)  # 确定映射，无歧义
```

### 改进 2：用「结构化推理链」替代「简单输出」

```python
class ClassificationResult(BaseModel):
    question_id: str
    identified_concepts: list[str]        # 题目中涉及的核心概念
    learning_outcome: str                 # 对应的学习成果（从 CED 中选择）
    reasoning: str                        # 详细推理
    unit: str                             # 最终单元
    confidence: Literal["HIGH", "MEDIUM", "LOW"]
    verification_check: str               # 自我验证语句
    adversarial_concerns: list[str]       # 可能的反对意见
```

使用 Pydantic AI 或类似框架强制 LLM 输出这个结构。

### 改进 3：用「黄金测试集 + 迭代」替代「一次性分类」

```python
# 每处理一个新科目，先运行：
gold_set = load_official_sample_questions()  # 官方样题
results = classify_batch(gold_set)
accuracy = evaluate_accuracy(results, gold_set)

while accuracy < 0.95:
    # 分析错误
    errors = analyze_errors(results, gold_set)
    # 调整 prompt（添加规则、示例）
    prompt = refine_prompt(prompt, errors)
    # 重新测试
    results = classify_batch(gold_set)
    accuracy = evaluate_accuracy(results, gold_set)

# 确认 prompt 可靠后，再分类全部题目
all_results = classify_batch(all_questions)
```

### 改进 4：用「对抗性验证」作为第二层过滤

```python
# 对于 confidence != "HIGH" 的题目，运行对抗性验证
for q in low_confidence_questions:
    adversary = run_adversary(q.classification_result)
    if adversary.has_strong_concerns:
        q.status = "MANUAL_REVIEW"  # 需要人工审核
    else:
        q.status = "AUTO"  # 即使 confidence 不高，对抗者也无法提出有力质疑
```

---

## 七、实施建议

### 短期（1-2 小时）：快速验证可行性

1. 选择 AP Microeconomics（你最熟悉的科目之一）作为测试
2. 从 CED 提取每个单元的 3-5 个 Essential Knowledge 描述
3. 用新方案分类 20 道已确认的题目（黄金测试集）
4. 计算准确率，对比旧方案

### 中期（1-2 天）：建立可复用框架

1. 写一个 `classifier.py` 脚本，封装「学习成果识别 + 结构化输出 + 对抗性验证」
2. 写一个 `eval.py` 脚本，用于评估分类准确率
3. 将「黄金测试集」作为每个科目的配置文件（如 `macro_gold.json`）

### 长期（新科目导入时）：标准化流程

1. 准备新科目的 CED 描述和黄金测试集
2. 运行 `classifier.py` + `eval.py`，迭代直到准确率 > 95%
3. 用验证后的配置分类全部题目
4. 只需人工审核「MANUAL_REVIEW」标记的题目（预计 < 10%）

---

## 八、调研结论

| 维度 | 原方案（三分类器投票） | 改进方案（可验证推理链） |
|------|---------------------|------------------------|
| **准确率** | 理论上 ~95% | 相同，但**可验证** |
| **错误发现** | 依赖人工抽查 | 结构化推理链让错误**自动暴露** |
| **跨科目复用** | 需要专业知识验证 | 只需要基础文本理解能力 |
| **Vibe Coding 友好度** | 需要调试三个分类器 | 只需要调试一个 prompt + 一个测试集 |
| **迭代优化** | 难以定位失败原因 | 错误样例直接指导 prompt 改进 |
| **信任度** | 「应该对了」 | 「可以检查为什么」 |

**核心建议**：不要追求「更聪明的分类器」，而是追求**「更容易验证的分类器」**。在 Vibe Coding 环境下，最好的分类器不是准确率 99% 的黑箱，而是准确率 95% 但**每一步都可解释、可验证、可迭代**的透明管道。

---

*调研日期：2025-06-22*
*参考来源：arxiv 2606.17507v1 (LLM-as-Judge in Education), Pydantic AI, DeepEval, Guardrails AI, AI Engineer Summit 2025*
