# AP Microeconomics 题库重建 Pipeline（审批版）

> **版本**：v1.0（待审批）
> **定位**：基于 Macroeconomics 成功经验和 Microeconomics 失败教训的完整重建流程
> **核心原则**：逐份研究、逐份提取、逐份审计、增量推进；取缔万能脚本；人工审核不可跳过

---

## 一、失败复盘与核心原则

### 1.1 为什么改了4遍还是出问题

| 错误 | 后果 | 根本原因 |
|------|------|----------|
| 依赖一个万能脚本提取所有年份 | 不同PDF格式差异导致大面积污染 | 没有先研究每份PDF的独立格式 |
| 全局正则修修补补 | 修A坏B，越修越乱 | 没有理解PDF读取顺序的底层机制 |
| 一次性提取全部再全局检查 | 不同年份问题互相掩盖 | 没有逐份审计，问题累积到无法排查 |
| 没有人工逐题检查 | 下标变"sub"、alt-text混入、表格破坏等低级错误未被发现 | 过度依赖脚本自动化，跳过了人工审核 |
| 前端渲染检查缺失 | 数据"看起来对"但前端展示全错 | 没有将数据正确性和前端展示正确性分开验证 |

### 1.2 核心原则（不可违背）

1. **逐份研究**：每份PDF独立分析格式，输出独立文档
2. **逐份提取**：一年一提取，不共用脚本，格式差异通过配置或手动处理
3. **逐份审计**：提取一年的题目，立即审计这一年的题目，通过后才进入下一年
4. **人工审核**：数据层检查（脚本）+ 前端渲染检查（WebBridge截图）+ 人工抽查（每份PDF至少抽查5题）
5. **问题分级**：P0（无法做题）、P1（可能做错）、P2（体验差）**必须全部归零**，只有P3（优化建议）可遗留
6. **取缔万能脚本**：没有 `rebuild_all_years.py`，只有 `extract_2012.py`、`extract_2013.py` 等，或基于配置的一年一运行
7. **所有年份完成后才做分类**：不边提取边分类，避免分类错误和提取错误互相干扰
8. **分层提取策略**：明确区分"可脚本提取的纯文本题"和"必须手动处理的复杂格式题"

---

## 二、Pipeline 总览

```
Phase 0: 环境探测 → 确保工具可用
Phase 1: 前期准备 → 阅读CED，建立分类配置
Phase 2: PDF形态分析 → 逐份研究，每份输出独立分析报告
Phase 3: 逐份提取 → 一年一提取，人工审核
Phase 4: 逐份审计 → 数据层 + 前端渲染 + 人工抽查
Phase 5: 图像/表格提取 → 针对有图/表的题目单独处理
Phase 6: 即时数据清理 → 每份PDF提取后立即清理（下标、货币符号、空格等）
Phase 7: 单元分类 → 所有年份提取完成后，LLM辅助+人工审核
Phase 8: 相似题目索引 → 所有分类完成后
Phase 9: 构建门禁 → 数据验证 + 图像验证
Phase 10: 前端全量审计 → WebBridge逐页检查
Phase 11: 推送与档案维护
```

---

## 三、Phase 0: 环境探测

**目的**：确保 Node.js、Python、PyMuPDF 等工具可用，避免中途因环境问题中断。

**步骤**：
```bash
# 1. 检查 Python 和 PyMuPDF
"C:\Users\wuzeh\AppData\Roaming\kimi-desktop\daimon-bundle\runtime\python\cpython-3.12\python.exe" -c "import fitz; print(fitz.__doc__[:50])"

# 2. 检查 Node.js
node --version

# 3. 检查项目目录
cd /d/Lynk/翎英教育LynkEdu/题库系统-web/ap-question-bank
```

**交付物**：`scripts/env_ready.txt`（确认环境OK）

---

## 四、Phase 1: 前期准备

### 4.1 阅读 AP Microeconomics CED

**必须收集的信息**：

| 信息项 | 来源 | 用途 |
|--------|------|------|
| 单元数量和名称 | CED | `classification_config.json` 的 `units` |
| 每个单元考试权重 | CED Unit Weighting | `subjects.json` 的 `mockExam.unitDistribution` |
| 考试总时长 | CED Exam Overview | `subjects.json` 的 `mockExam.mcqTimeLimit` / `frqTimeLimit` |
| MCQ 数量 | 历年真题 | `subjects.json` 的 `mockExam.totalMCQ` |
| FRQ 数量 | 历年真题 | `subjects.json` 的 `mockExam.frqCount` |
| 题目形式 | CED | 决定需要提取哪些题型 |
| 是否有 Answer Key | 真题PDF | 决定是否需要手动收集答案 |
| 是否有 Scoring Guidelines | 真题PDF | 决定 FRQ rubric 提取策略 |

**交付物**：`docs/micro_ced_notes.md`

### 4.2 创建/更新 `classification_config.json`

```json
{
  "subject": "AP Microeconomics",
  "version": "2022 CED",
  "classification_standard": "A student who has completed ONLY this unit should be able to answer this question.",
  "units": [
    {
      "code": "U1",
      "name": "Basic Economic Concepts",
      "weighting": "12-15%",
      "core_concepts": ["scarcity", "opportunity cost", "PPF", "comparative advantage", "marginal analysis"],
      "excluded_concepts": ["supply curve", "demand curve", "equilibrium"],
      "distinguishing_features": ["No market supply/demand analysis"],
      "boundary_rules": ["PPF analysis = U1", "Comparative advantage = U1"]
    },
    {
      "code": "U2",
      "name": "Supply and Demand",
      "weighting": "20-25%",
      "core_concepts": ["supply", "demand", "equilibrium", "price elasticity", "consumer surplus", "producer surplus"],
      "excluded_concepts": ["tax incidence beyond U2", "international trade"]
    },
    {
      "code": "U3",
      "name": "Production, Cost, and the Perfect Competition Model",
      "weighting": "22-25%",
      "core_concepts": ["production function", "marginal product", "cost curves", "perfect competition", "profit maximization"]
    },
    {
      "code": "U4",
      "name": "Imperfect Competition",
      "weighting": "15-22%",
      "core_concepts": ["monopoly", "monopolistic competition", "oligopoly", "game theory", "Nash equilibrium", "payoff matrix"]
    },
    {
      "code": "U5",
      "name": "Factor Markets",
      "weighting": "10-13%",
      "core_concepts": ["derived demand", "marginal revenue product", "wage determination", "monopsony"]
    },
    {
      "code": "U6",
      "name": "Market Failure and the Role of Government",
      "weighting": "8-12%",
      "core_concepts": ["externalities", "public goods", "income distribution", "taxes", "subsidies"]
    }
  ]
}
```

**交付物**：`public/data/ap/microeconomics/classification_config.json`

---

## 五、Phase 2: PDF形态分析（逐份，不可跳过）

### 5.1 为什么必须逐份研究

每份PDF的格式可能不同：
- 2012年：单栏？双栏？页眉内容？
- 2013年：是否有水印？图形是矢量还是图片？
- 2014年：是否有博弈论矩阵？表格选项如何排列？
- 2015-2018年：是否有目录页干扰？FRQ页面如何分布？

**不研究就直接提取 = 盲提取 = 大面积污染。**

### 5.2 每份PDF的分析清单

对每份PDF（如 `AP Micro 2012.pdf`），必须人工检查以下项目：

| 检查项 | 方法 | 记录内容 |
|--------|------|----------|
| 页面布局 | 打开PDF，查看第1-3页 | 单栏/双栏？左右栏宽度比例？ |
| 水印 | 检查是否有灰色文字覆盖 | TestDaily？其他水印？ |
| 题号格式 | 查看MCQ首页 | `1. text` 还是 `1 text`？选项是 `(A)` 还是 `A.`？ |
| 双栏边界 | 测量左右栏的x坐标分界点 | 左栏x范围、右栏x范围（用于提取时分割） |
| 页眉/页脚 | 每页顶部和底部 | 哪些文字会在每页重复出现？需要过滤？ |
| 图形类型 | 查看含图形的题目 | 嵌入图片？矢量文本？`get_text`能否拿到？ |
| 表格选项 | 查看表格题（如Q18） | 表格在题干中还是选项中？列数？ |
| 博弈论矩阵 | 查看Q40等 | 矩阵是文本形式还是图片？ |
| 坐标选项 | 查看图形题选项 | 选项是 `Q1, P1` 这种坐标还是文本描述？ |
| 跨页表格 | 检查表格是否跨页 | 跨页时表头是否会泄漏到前一页选项？ |
| alt-text | 查看图形附近 | 是否有 "The figure shows..." 等无障碍描述？ |
| 目录页 | 查看PDF开头 | 是否有目录页包含伪题目编号？ |
| FRQ位置 | 从后往前翻 | FRQ从哪页开始？Scoring Guidelines从哪页开始？ |
| 答案位置 | 查看PDF末尾 | 答案在MCQ末尾？单独文件？ |

### 5.3 分析方法（具体步骤）

```python
# 步骤1：查看PDF总页数、目录页
import fitz
pdf = fitz.open("AP Micro 2012.pdf")
print(f"Total pages: {len(pdf)}")
# 人工检查第1页是否为目录页

# 步骤2：提取前3页文本，观察格式
for i in range(3):
    text = pdf[i].get_text()
    print(f"=== Page {i+1} ===")
    print(text[:1000])
    print()

# 步骤3：提取MCQ页面（如第4-15页），观察双栏布局
# 人工判断左右栏的x坐标分界点

# 步骤4：查看图形页面
# 提取含 "graph" / "figure" 的页面，人工判断图形类型

# 步骤5：查看表格页面
# 提取含表格的页面，观察表格在文本中的表现形式
```

### 5.4 交付物

每份PDF输出一份独立文档：

```markdown
# PDF形态分析：AP Micro 2012.pdf

## 基本信息
- 页数：XX
- 目录页：第1-2页（是/否）
- 水印：无 / TestDaily / 其他

## 布局
- 单栏/双栏：双栏
- 左栏x范围：50-320
- 右栏x范围：340-620
- 页眉文字："MICROECONOMICS Section I"（需过滤）
- 页脚文字："GO ON TO THE NEXT PAGE"（需过滤）

## 题号格式
- 题号样式：`1. text`
- 选项样式：`(A) text`（注意空格）

## 特殊格式（已知陷阱）
- 表格选项：Q18（需求/供给表），Q31（生产数据表）
- 博弈论矩阵：Q40（2x2矩阵，无(A)(B)格式）
- 坐标选项：Q43（图形坐标 Q1,P1）
- 跨页表格：Q60（表格跨页，表头可能泄漏）
- alt-text：Q32（图形有无障碍描述 "Two quantities appear on the horizontal axis..."）

## 提取策略
- 双栏提取：使用x坐标分割，先左栏后右栏
- 表格处理：提取为结构化数据 + 图片
- 图形处理：提取为图片，标记 `requires_graph=true`
- 坐标选项：手动标注，无法自动提取
- 页眉过滤：移除 "MICROECONOMICS Section I" 等

## 预估难度
- 高：博弈论矩阵、坐标选项、跨页表格
- 中：双栏布局、alt-text
- 低：标准MCQ
```

**交付物**：`docs/pdf_analysis_2012.md`、`docs/pdf_analysis_2013.md`、...、`docs/pdf_analysis_2018.md`

---

## 六、Phase 3: 分层提取策略（核心改变）

> **根本问题：30-40%的复杂格式题用脚本提取不可靠。**
> **解决方案：明确区分"可脚本提取的纯文本题"（A类）和"必须手动处理的复杂格式题"（B类）。**

### 6.1 题目分类（每份PDF分析阶段确定）

在Phase 2分析PDF时，逐题标记类型：

| 类型 | 特征 | 占比 | 处理方式 |
|------|------|------|----------|
| **A类：纯文本MCQ** | 无表格、无图形、无下标/上标、无博弈论矩阵 | 60-70% | **脚本提取**（`page.get_text('blocks')` + 正则解析） |
| **B类：表格选项MCQ** | 选项区域有表格（如需求/供给表、税收表） | 10-15% | **手动处理**：裁剪表格图片 + 人工输入结构化数据 |
| **C类：图形MCQ** | 含图形、坐标选项（如Q₁,P₁）、或选项混入alt-text | 10-15% | **手动处理**：裁剪图形图片 + 人工输入选项文本 |
| **D类：博弈论矩阵** | 2x2矩阵，无(A)(B)选项格式 | 1-2% | **手动处理**：裁剪矩阵图片 + 人工构建结构化数据 |
| **FRQ** | 文字 + 可能含表格数据 | 3题/年 | 脚本提取文本 + 手动处理表格数据 |

**关键规则：**
- 如果一道题包含任何表格、图形、矩阵、坐标选项、下标/上标 → **直接标记为B/C/D类，不尝试脚本提取**
- B/C/D类题的文本提取结果直接丢弃，使用手动输入的数据

### 6.2 A类题提取（纯文本MCQ）

```python
# 适用于：无表格、无图形、无下标/上标的纯文本题
# 提取方式：按双栏布局，先左栏后右栏，按y坐标排序
blocks = page.get_text('blocks')
left = sorted([b for b in blocks if b[0] < mid_x], key=lambda b: b[1])
right = sorted([b for b in blocks if b[0] >= mid_x], key=lambda b: b[1])
text = '\n'.join([b[4] for b in left + right])

# 然后正则解析题号和选项
# 这类题提取可靠，但仍需审计验证
```

**A类题特点（可脚本提取）：**
- 题干是连续文本，无表格数据混入
- 选项是标准文本（如 `(A) increase`），无坐标、无矩阵
- 无下标/上标（或极少，不影响理解）

### 6.3 B/C/D类题手动处理（复杂格式题）

**对于每道B/C/D类题，执行以下步骤：**

1. **确定题目在PDF的哪一页**（在Phase 2分析时标记）
2. **裁剪相关区域为图片**：
   - 表格题：裁剪表格区域
   - 图形题：裁剪图形区域
   - 矩阵题：裁剪矩阵区域
3. **人工阅读图片，手动构建数据**：
   - 表格题：输入表格列名、行数据，构建 `option_table_data`
   - 图形题：输入图形选项文本（如 `Q₁, P₁`），标记 `requires_graph=true`
   - 矩阵题：输入矩阵行/列标签和payoff值
4. **手动输入题干文本**（从PDF中直接复制，避免脚本提取错误）
5. **手动输入选项文本**（A-E，确保正确）
6. **标记特殊类型**：`has_table=true`, `requires_graph=true`, 等

**示例：B类表格题手动处理**
```python
{
  "question_id": "2012_Q18",
  "text": "What is the price paid by consumers and the net price received by producers after the tax is paid?",
  "options": {
    "A": "$11.00 | $10.45",
    "B": "$11.00 | $10.00",
    "C": "$10.45 | $10.00",
    "D": "$10.45 | $9.45",
    "E": "$10.00 | $9.45"
  },
  "answer": "D",
  "has_table": true,
  "option_table_data": {
    "headers": ["Paid by Consumers", "Received by Producers"],
    "rows": {
      "A": ["$11.00", "$10.45"],
      "B": ["$11.00", "$10.00"],
      "C": ["$10.45", "$10.00"],
      "D": ["$10.45", "$9.45"],
      "E": ["$10.00", "$9.45"]
    }
  },
  "image_paths": ["/images/micro/2012_Q18_table.png"]
}
```

**示例：C类图形题手动处理**
```python
{
  "question_id": "2013_Q43",
  "text": "A monopolist is currently producing at the profit-maximizing output level. Which of the following correctly identifies the output and price?",
  "options": {
    "A": "Q₁, P₁",
    "B": "Q₁, P₂",
    "C": "Q₁, P₃",
    "D": "Q₁, P₄",  # 正确答案
    "E": "Q₂, P₃"
  },
  "answer": "D",
  "requires_graph": true,
  "image_paths": ["/images/micro/2013_Q43_graph.png"]
}
```

### 6.4 FRQ提取

**FRQ文本部分：脚本提取**
- 从 "SECTION II: Free Response" 页开始
- 提取 Question 1/2/3 的文本
- 清理 boilerplate（页眉、页脚）

**FRQ表格部分：手动处理**
- 如果FRQ包含表格数据（如production data），裁剪表格为图片
- 手动构建结构化数据，存入 `background_data`

**FRQ Scoring Guidelines：脚本提取 + 手动校对**
- 提取 "Free-Response Scoring Guidelines" 部分
- 将 rubric 解析为结构化 dict（`points` 数组）
- 每个 `description` 必须包含具体评分标准，不能只是题号
- 手动校对确保没有截断或遗漏

### 6.5 为什么这样有效

| 之前（万能脚本） | 现在（分层策略） |
|------------------|------------------|
| 脚本试图提取所有题目（包括表格、图形、矩阵） | 脚本只提取纯文本题，复杂题手动处理 |
| 表格结构被脚本破坏，列信息丢失 | 表格数据人工输入，列结构完全正确 |
| 图形alt-text被当作选项文本 | 图形选项人工输入，避免alt-text污染 |
| 坐标选项（如Q₁,P₁）无法自动提取 | 坐标选项人工输入，确保正确 |
| 下标变"sub"文本 | 纯文本题中的下标在即时清理阶段处理，复杂题中的下标在手动输入时直接写正确格式 |

**结论：30-40%的复杂题不再依赖脚本，从根本上杜绝了提取错误。

### 6.3 人工审核步骤（每份PDF提取后必做）

**数据层审核**：
```python
# 1. 题号完整性检查
nums = sorted([q['question_number'] for q in questions])
missing = [n for n in range(1, 61) if n not in nums]
assert len(missing) == 0, f"Missing questions: {missing}"

# 2. 空选项检查
for q in questions:
    for opt, val in q['options'].items():
        assert val and val.strip(), f"Empty option {opt} in {q['question_id']}"

# 3. 文本污染检查
pollution = ['MACROECONOMICS', 'GO ON TO THE NEXT PAGE', 'Unauthorized copying', 'Time-']
for q in questions:
    for p in pollution:
        assert p not in q['text'], f"Pollution in text: {q['question_id']}"
        for opt, val in q['options'].items():
            assert p not in val, f"Pollution in option {opt}: {q['question_id']}"

# 4. 下标检查
for q in questions:
    text = q['text'] + ' '.join(q['options'].values())
    # 检查 "sub" 是否作为独立单词出现（可能是未渲染的下标）
    if 'sub' in text.lower():
        # 标记为需要检查
        print(f"WARNING: 'sub' found in {q['question_id']}")

# 5. 表格数据混入检查
# 如果题干文本包含大量数字，且后面紧跟选项，可能是表格数据混入
```

**前端渲染审核**（使用 WebBridge）：
```
1. 启动本地 dev server: npm run dev
2. 用 WebBridge 打开 http://localhost:5173
3. 切换到 Microeconomics 科目
4. 逐页查看题目，截图
5. 检查项：
   - 题目文本是否完整？
   - 选项是否完整？
   - 下标/上标是否正确渲染？（MU_s 而不是 MU sub s）
   - 表格题是否正确渲染为表格？
   - 图形题是否显示图片？
   - 是否有文本污染？（页眉、页脚、下一题数据）
6. 每份PDF至少抽查5题（含1道图形题、1道表格题）
```

### 6.4 问题分级与修复策略

| 级别 | 定义 | 修复要求 | 示例 |
|------|------|----------|------|
| **P0** | 学生无法正确完成这道题 | **必须修复，否则不能进入下一年** | 空选项、题干截断、表格数据完全丢失、图形缺失 |
| **P1** | 学生可能给出错误答案，或体验严重受损 | **必须修复** | 下标变"sub"文本、选项混入其他题目数据、坐标选项错误 |
| **P2** | 不影响做题正确性但体验差 | **必须修复** | 文本换行错误、货币符号缺失、多余空格 |
| **P3** | 优化建议 | 可记录但不阻塞 | 字体、排版微调 |

### 6.5 交付物

每份PDF提取后输出：
- `public/data/ap/microeconomics/2012_question_bank.json`（该年份的MCQ）
- `public/data/ap/microeconomics/2012_frq_bank.json`（该年份的FRQ）
- `docs/audit_2012.md`（该年份的审计报告）

---

## 七、Phase 4: 题号完整性验证（每份PDF提取后）

**验证清单**：
- [ ] 该年份MCQ数量 = 60（或官方规定的数量）
- [ ] 题号从1到60连续无缺失
- [ ] 没有合并的题号（如Q2和Q52变成一道题）
- [ ] 没有跳过的题号（如Q47不存在）
- [ ] FRQ数量正确（通常3道）
- [ ] FRQ rubric 已提取且为结构化dict（非字符串）

**如果有任何一项失败，立即停止，分析原因，修复后重新提取该年份。**

---

## 八、Phase 5: 图像/表格提取（与Phase 3同步进行）

### 8.1 图形提取

对于所有标记 `requires_graph=true` 或 `has_graph=true` 的题目：
1. 确定该图形在PDF的哪一页
2. 使用 `precise_table_cropper.py` 或手动裁剪提取图形区域
3. 保存为 `public/images/micro/mcq/2012_Q43_graph.png`
4. 在JSON中记录 `image_paths`

### 8.2 表格提取

对于所有表格题：
1. 提取表格区域为图片（用于前端展示）
2. 手动构建结构化数据（用于交互）
3. 保存为 `public/images/micro/mcq/2012_Q18_table.png`
4. 在JSON中记录 `option_table_data` 和 `image_paths`

### 8.3 博弈论矩阵提取

对于博弈论矩阵题：
1. 提取矩阵为图片
2. 手动构建 payoff matrix 结构化数据
3. 选项文本为矩阵描述

---

## 九、Phase 6: 即时数据清理（每份PDF提取后立即进行）

> **核心原则：做完一年的，先确保这一年的能用。**
> 数据清理不等到所有年份完成，而是每份PDF提取并审计后立即进行。

### 9.1 每份PDF结束后的即时清理

在单份PDF（如2012年）提取并通过Phase 4的审计后，立即对该年份的数据进行清理：

**下标处理**：
- 将所有 `MU sub s` 替换为 `MU_s`（前端渲染为下标）
- 将所有 `P sub h` 替换为 `P_h`
- 将所有 `Q sub 1` 替换为 `Q₁`（Unicode下标）
- 使用脚本扫描所有文本，找到 "sub" 作为独立单词出现的情况，人工确认并修复

**货币符号**：
- 检查所有数字前是否有 `$`，缺失的补全

**空格和换行**：
- 修复词组内的多余空格（如 `a rightward` → `a rightward` 应该是正确的，但如果变成 `a right ward` 就需要修复）
- 修复换行导致的词组断裂（如 `invent\nories` → `inventories`）

**选项文本统一**：
- 确保所有选项以句号或合适标点结尾
- 确保选项没有前导空格或特殊字符

**页眉/页脚残留检查**：
- 再次扫描是否还有 "MICROECONOMICS"、"GO ON TO THE NEXT PAGE" 等残留

### 9.2 验证

清理后，对该年份再次运行：
- 空选项检查
- 污染检查
- 下标检查（确保没有 "sub" 残留）
- 货币符号检查
- 空格检查

**只有该年份的P0/P1/P2全部归零，才允许进入下一年PDF的提取。**

---

## 十、Phase 7: 单元分类（所有年份提取完成后）

### 10.1 分类原则

基于 CED 知识范围，NOT 关键词频率。

标准："Would a student who has ONLY studied this unit be able to answer this question?"

### 10.2 分类流程

```
classification_config.json → LLM Prompt（批次处理）→ 结构化输出 → 脚本后验证
```

**LLM Prompt 从 `classification_config.json` 动态生成**：
- `units[].name` → 单元定义
- `units[].core_concepts` → 关键词列表
- `units[].excluded_concepts` → 排除概念（硬性检查）

### 10.3 脚本后验证（硬性检查）

```python
# 硬性错误：题目包含某单元的 excluded_concepts → 绝对不能分到该单元
# 软警告：题目文本中没有出现该单元的 core_concepts → 可接受（可能是情境描述）
```

### 10.4 人工抽查

- 每个单元抽查5-10题
- 检查分类是否正确
- 如果错误率 > 5%，扩大抽查范围或重新分类

---

## 十一、Phase 8: 相似题目索引

### 11.1 构建索引

```bash
python scripts/build_similarity_index.py --subject micro
```

### 11.2 验证

- 随机抽取10题，检查相似题目是否真正相关
- 如果相似度算法不准确，调整参数或更换算法

---

## 十二、Phase 9: 构建门禁

### 12.1 数据验证

```bash
node scripts/data_validator.cjs public/data/ap/microeconomics/question_bank.json
```

**检查项**：
- 字段完整性（CRITICAL）
- 单元有效性（CRITICAL）
- 排除概念违反（CRITICAL）
- 图像关联性（CRITICAL）
- 背景数据与选项区分（CRITICAL）
- 表格格式（CRITICAL）
- 文本污染（CRITICAL）
- 选项截断（CRITICAL）
- 下标渲染（CRITICAL）—— 新增：检查是否有未渲染的 "sub" 文本
- 编码检查（CRITICAL）
- FRQ rubric 结构（CRITICAL）

### 12.2 图像验证

```bash
node scripts/image_validator.cjs --subject micro
```

**检查项**：
- 文件存在（CRITICAL）
- 文件大小 > 200 bytes（CRITICAL）
- 无文字污染（抽样检查）（CRITICAL）
- 图像完整性（CRITICAL）

### 12.3 构建

```bash
npm run build
```

**构建失败条件**：
- `data_validator.cjs` 返回非0 → 失败
- `image_validator.cjs` 返回非0 → 失败

---

## 十三、Phase 10: 前端全量审计（不可跳过）

### 13.1 使用 WebBridge 进行全量检查

```
1. 启动本地 dev server: npm run dev
2. 用 WebBridge 打开 http://localhost:5173
3. 系统检查：
   - 首页加载，科目切换正常
   - MCQ 浏览页：逐页检查（不是抽查）
     - 题目文本完整性（截断 = P0）
     - 选项完整性（空选项 = P0）
     - 下标/数学符号正确渲染（MU_s 不是 MU sub s）
     - 表格题正确渲染为表格（不是纯文本）
     - 图形题显示图片
   - 搜索功能：搜索结果、相似变式
   - Mock Exam：生成至少2次，检查题号、图表、选项、下标
   - FRQ：题目文本完整性、rubric结构、分值
4. 移动端检查（可选）
```

### 13.2 数据层直接分析

```python
# 检查空选项
# 检查 option_table_data 缺失
# 检查下标标记
# 检查 FRQ rubric 结构
# 检查坐标选项是否正确
```

### 13.3 问题记录

每个问题记录：
- 问题描述
- 页面位置（URL + 具体位置）
- 截图（WebBridge截图）
- 严重程度（P0/P1/P2/P3）
- 根因分析（前端问题还是数据问题）
- 修复建议
- 涉及题目ID

**报告**：`docs/FRONTEND_AUDIT_REPORT_YYYYMMDD.md`

### 13.4 条件循环

```
Phase 10 启动
  → 全量审计
  → 生成问题报告
  → 有 P0/P1/P2 问题？
    → 是：修复问题 → 重新构建部署 → 重新执行完整全量审计
    → 否：通过，Phase 10 结束
```

**硬性规则**：
- 每次修复后必须重新执行完整全量审计
- **循环终止条件**：P0、P1、P2 问题数均为 0
- 只有 P3 可以遗留

---

## 十四、Phase 11: 推送与档案维护

### 14.1 科目总结文档

```markdown
## AP Microeconomics 科目总结

### 数据
- 年份：2012-2018
- MCQ：XXX 题
- FRQ：XXX 题
- 图像：XXX 张
- 表格题：XX 题
- 坐标选项题：XX 题
- 博弈论矩阵：XX 题

### 已知陷阱（已处理）
- 表格数据污染：已处理（多行截断）
- 坐标选项：已手动标注
- 下标渲染：已统一处理
- 博弈论矩阵：已提取为图片+结构化数据

### 遗留问题
- 无（或列出P3问题）
```

### 14.2 推送到 GitHub

```bash
git add -A
git commit -m "feat: AP Microeconomics 全量重建

- 年份：2012-2018
- MCQ：XXX 题 + FRQ：XXX 题 + 图像：XXX 张
- 逐份提取、逐份审计
- 数据验证：0 errors, 0 warnings
- 前端审计：0 P0, 0 P1, 0 P2
git push origin main
```

### 14.3 更新技能和文档

- 更新 `QUESTION_BANK_BUILDER_SKILL.md`
- 更新 `EXAM_SUBJECT_PIPELINE.md`
- 记录 Microeconomics 特有陷阱和解决方案

---

## 十五、执行检查清单

### Phase 1: 前期准备
- [ ] 已阅读 CED，记录考试结构
- [ ] 已创建 `classification_config.json`

### Phase 2: PDF形态分析（每份PDF）
- [ ] 2012年PDF分析完成
- [ ] 2013年PDF分析完成
- [ ] 2014年PDF分析完成
- [ ] 2015年PDF分析完成
- [ ] 2016年PDF分析完成
- [ ] 2017年PDF分析完成
- [ ] 2018年PDF分析完成

### Phase 3-4: 逐份提取与审计（每份PDF）
- [ ] 2012年提取完成，审计通过（0 P0, 0 P1）
- [ ] 2013年提取完成，审计通过（0 P0, 0 P1）
- [ ] 2014年提取完成，审计通过（0 P0, 0 P1）
- [ ] 2015年提取完成，审计通过（0 P0, 0 P1）
- [ ] 2016年提取完成，审计通过（0 P0, 0 P1）
- [ ] 2017年提取完成，审计通过（0 P0, 0 P1）
- [ ] 2018年提取完成，审计通过（0 P0, 0 P1）

### Phase 5: 图像/表格提取
- [ ] 所有图形题已提取为图片
- [ ] 所有表格题已提取为图片+结构化数据
- [ ] 所有博弈论矩阵已提取为图片+结构化数据

### Phase 6: 即时数据清理（每份PDF提取后立即进行）
- [ ] 下标统一处理完成（无 "sub" 残留）
- [ ] 货币符号补全完成
- [ ] 空格和换行修复完成
- [ ] 页眉/页脚残留检查完成
- [ ] 该年份P0/P1/P2全部归零

### Phase 7-8: 分类与相似度
- [ ] 单元分类完成
- [ ] 分类人工抽查通过（错误率 < 5%）
- [ ] 相似题目索引构建完成

### Phase 9: 构建门禁
- [ ] `data_validator.cjs` 通过（0 errors, 0 warnings）
- [ ] `image_validator.cjs` 通过（0 errors, 0 warnings）
- [ ] `npm run build` 成功

### Phase 10: 前端全量审计
- [ ] MCQ浏览页全量检查通过（0 P0, 0 P1）
- [ ] FRQ检查通过（0 P0, 0 P1）
- [ ] Mock Exam检查通过（0 P0, 0 P1）
- [ ] 搜索功能检查通过

### Phase 11: 推送
- [ ] 科目总结文档已写
- [ ] 已推送到 GitHub
- [ ] 技能和文档已更新

---

## 十六、审批请求

请审批以下事项：

1. **Pipeline 整体流程**是否合理？是否有遗漏的Phase或步骤？
2. **Phase 2 的PDF分析清单**是否完整？是否有Microeconomics特有的格式需要额外检查？
3. **Phase 3 的提取策略**是否合适？是否需要增加更多策略？
4. **问题分级标准**（P0/P1/P2/P3）是否合理？
5. **是否同意取缔万能脚本**，改为逐份提取？
6. **从哪一年开始**？建议从2012年开始，还是从中选一年先做试点？

审批通过后，我将按此Pipeline执行。