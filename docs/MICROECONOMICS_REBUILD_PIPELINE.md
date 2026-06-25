# AP Microeconomics 题库重建 Pipeline（v1.0 已审批）

> **核心原则**：逐份研究、逐份提取、逐份审计、增量推进。取缔万能脚本。P0/P1/P2必须全部归零。

---

## 一、失败复盘

| 错误 | 根本原因 |
|------|----------|
| 依赖一个万能脚本提取所有年份 | 不同PDF格式差异导致大面积污染 |
| 全局正则修修补补 | 没有理解PDF读取顺序的底层机制 |
| 一次性提取全部再全局检查 | 不同年份问题互相掩盖，无法排查 |
| 没有人工逐题检查 | 过度依赖脚本，跳过了人工审核 |
| 前端渲染检查缺失 | 数据"对"但前端展示全错 |

---

## 二、线性流程

```
Phase 0: 环境探测
  ↓
Phase 1: 前期准备（CED + classification_config.json）
  ↓
Phase 2: PDF形态分析（逐份研究，标记每道题类型）
  ↓
Phase 3: 逐份提取（一年一做）
  │
  ├─ 步骤3a: A类纯文本题 → 脚本提取
  ├─ 步骤3b: B/C/D类复杂题 → 手动处理（裁剪图片 + 人工输入数据）
  ├─ 步骤3c: FRQ → 脚本提取文字 + 手动处理表格
  └─ 步骤3d: 合并A类+B/C/D类+FRQ → 输出该年份JSON
  ↓
Phase 4: 逐份审计（一年的数据做完就做审计）
  │
  ├─ 步骤4a: 数据层审计（题号完整性、空选项、污染、下标）
  ├─ 步骤4b: 即时数据清理（下标、货币符号、空格）
  ├─ 步骤4c: 再次审计（确认P0/P1/P2归零）
  └─ 步骤4d: 前端渲染审计（WebBridge截图，抽查5题）
  ↓
  （P0/P1/P2全部归零？→ 是：进入下一年；→ 否：回到步骤3修复）
  ↓
Phase 5: 进入下一年PDF（重复Phase 2-4）
  ↓
（所有年份完成后）
  ↓
Phase 6: 单元分类（LLM辅助 + 人工抽查）
  ↓
Phase 7: 相似题目索引
  ↓
Phase 8: 构建门禁（data_validator + image_validator + build）
  ↓
Phase 9: 前端全量审计（WebBridge逐页检查）
  ↓
Phase 10: 推送GitHub
```

---

## 三、Phase 0: 环境探测

```bash
node scripts/env_probe.cjs
```

**交付物**：`scripts/env.json`（缓存工具路径）

**关键规则**：任何工作开始前必须先运行，否则后续命令报错。

---

## 四、Phase 1: 前期准备

### 4.1 阅读AP Microeconomics CED

收集：单元数量、考试权重、MCQ/FRQ数量、题目形式、Answer Key位置、Scoring Guidelines位置。

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
      "core_concepts": ["scarcity", "opportunity cost", "PPF", "comparative advantage"],
      "excluded_concepts": ["supply curve", "demand curve", "equilibrium"]
    },
    {
      "code": "U2",
      "name": "Supply and Demand",
      "weighting": "20-25%",
      "core_concepts": ["supply", "demand", "equilibrium", "price elasticity"],
      "excluded_concepts": ["tax incidence beyond U2", "international trade"]
    },
    {
      "code": "U3",
      "name": "Production, Cost, and the Perfect Competition Model",
      "weighting": "22-25%",
      "core_concepts": ["production function", "cost curves", "perfect competition"]
    },
    {
      "code": "U4",
      "name": "Imperfect Competition",
      "weighting": "15-22%",
      "core_concepts": ["monopoly", "oligopoly", "game theory", "Nash equilibrium", "payoff matrix"]
    },
    {
      "code": "U5",
      "name": "Factor Markets",
      "weighting": "10-13%",
      "core_concepts": ["derived demand", "marginal revenue product", "wage determination"]
    },
    {
      "code": "U6",
      "name": "Market Failure and the Role of Government",
      "weighting": "8-12%",
      "core_concepts": ["externalities", "public goods", "income distribution"]
    }
  ]
}
```

**交付物**：`public/data/ap/microeconomics/classification_config.json`

---

## 五、Phase 2: PDF形态分析（逐份，不可跳过）

### 5.1 为什么必须逐份研究

每份PDF格式不同。不研究就直接提取 = 盲提取 = 大面积污染。

### 5.2 分析清单

对每份PDF（如 `AP Micro 2012.pdf`），检查：

| 检查项 | 方法 | 记录内容 |
|--------|------|----------|
| 页面布局 | 打开PDF，查看第1-3页 | 单栏/双栏？左右栏宽度比例？ |
| 水印 | 检查灰色文字覆盖 | TestDaily？其他？ |
| 题号格式 | 查看MCQ首页 | `1. text` 还是 `1 text`？选项是 `(A)` 还是 `A.`？ |
| 双栏边界 | 测量左右栏x坐标分界点 | 左栏x范围、右栏x范围 |
| 页眉/页脚 | 每页顶部和底部 | 需过滤的重复文字 |
| 图形类型 | 查看含图形的题目 | 嵌入图片？矢量文本？`get_text`能否拿到？ |
| 表格选项 | 查看表格题 | 表格在题干中还是选项中？列数？ |
| 博弈论矩阵 | 查看Q40等 | 矩阵是文本还是图片？ |
| 坐标选项 | 查看图形题选项 | 选项是 `Q1, P1` 还是文本？ |
| 跨页表格 | 检查表格是否跨页 | 跨页时表头是否会泄漏到前一页？ |
| alt-text | 查看图形附近 | 是否有 "The figure shows..." 等无障碍描述？ |
| 目录页 | 查看PDF开头 | 是否有伪题目编号？ |
| FRQ位置 | 从后往前翻 | FRQ从哪页开始？Scoring Guidelines从哪页开始？ |
| 答案位置 | 查看PDF末尾 | 答案在MCQ末尾？单独文件？ |

### 5.3 逐题标记类型（Phase 2核心输出）

**在分析PDF时，逐题标记以下类型：**

| 类型 | 特征 | 占比 | 处理方式 |
|------|------|------|----------|
| **A类** | 纯文本MCQ，无表格/图形/下标/矩阵 | 60-70% | **脚本提取**（`page.get_text('blocks')` + 正则） |
| **B类** | 表格选项（需求/供给表、税收表） | 10-15% | **手动处理**：裁剪表格图片 + 人工输入 `option_table_data` |
| **C类** | 图形题、坐标选项（如Q₁,P₁）、选项混入alt-text | 10-15% | **手动处理**：裁剪图形图片 + 人工输入选项文本 |
| **D类** | 博弈论矩阵（2x2） | 1-2% | **手动处理**：裁剪矩阵图片 + 人工构建矩阵数据 |
| **FRQ** | 文字 + 可能含表格数据 | 3题/年 | 脚本提取文字 + 手动处理表格 |

**关键规则**：如果一道题包含任何表格、图形、矩阵、坐标选项、下标/上标 → **直接标记为B/C/D类，不尝试脚本提取。** B/C/D类题的脚本提取结果直接丢弃，使用手动输入的数据。

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

## 逐题类型标记（A/B/C/D类）
| 题号 | 类型 | 说明 |
|------|------|------|
| Q1 | A | 纯文本 |
| Q2 | A | 纯文本 |
| ... | ... | ... |
| Q18 | B | 表格选项（需求/供给表） |
| Q32 | C | 图形题，选项可能混入alt-text |
| Q40 | D | 博弈论矩阵 |
| Q43 | C | 坐标选项（Q1,P1） |
| Q60 | B | 表格跨页，表头可能泄漏 |

## 提取策略
- A类题：脚本提取，双栏分割，x坐标分界点=330
- B类题：手动裁剪表格为图片，构建option_table_data
- C类题：手动裁剪图形为图片，输入选项文本
- D类题：手动裁剪矩阵为图片，构建结构化数据
- 页眉过滤：移除 "MICROECONOMICS Section I" 等
- 页脚过滤：移除 "GO ON TO THE NEXT PAGE" 等

## 预估难度
- 高：D类矩阵、C类坐标选项、B类跨页表格
- 中：双栏布局、alt-text
- 低：A类标准MCQ
```

**交付物**：`docs/pdf_analysis_2012.md` ~ `docs/pdf_analysis_2018.md`

---

## 六、Phase 3: 逐份提取（一年一做）

### 6.1 步骤3a: A类纯文本题提取（60-70%）

```python
# 按双栏布局提取
blocks = page.get_text('blocks')
left = sorted([b for b in blocks if b[0] < mid_x], key=lambda b: b[1])
right = sorted([b for b in blocks if b[0] >= mid_x], key=lambda b: b[1])
text = '\n'.join([b[4] for b in left + right])

# 正则解析题号和选项
# 过滤页眉/页脚
# 这类题提取可靠，但仍需审计验证
```

**A类题特点**：
- 题干是连续文本，无表格数据混入
- 选项是标准文本（如 `(A) increase`），无坐标、无矩阵
- 无下标/上标（或极少，不影响理解）

### 6.2 步骤3b: B/C/D类复杂题手动处理（30-40%）

**对于每道B/C/D类题，执行以下步骤：**

1. **确定题目在PDF的哪一页**（在Phase 2分析时标记）
2. **裁剪相关区域为图片**（使用 `precise_table_cropper.py`）：
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

**示例：B类表格题**
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

**示例：C类图形题**
```python
{
  "question_id": "2013_Q43",
  "text": "A monopolist is currently producing at the profit-maximizing output level. Which of the following correctly identifies the output and price?",
  "options": {
    "A": "Q₁, P₁",
    "B": "Q₁, P₂",
    "C": "Q₁, P₃",
    "D": "Q₁, P₄",
    "E": "Q₂, P₃"
  },
  "answer": "D",
  "requires_graph": true,
  "image_paths": ["/images/micro/2013_Q43_graph.png"]
}
```

### 6.3 步骤3c: FRQ提取

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

### 6.4 步骤3d: 合并输出

将A类题（脚本提取）+ B/C/D类题（手动处理）+ FRQ 合并为完整年份JSON：
- `public/data/ap/microeconomics/2012_question_bank.json`（MCQ）
- `public/data/ap/microeconomics/2012_frq_bank.json`（FRQ）

---

## 七、Phase 4: 逐份审计（一年的数据做完就做审计）

### 7.1 步骤4a: 数据层审计

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
pollution = ['MICROECONOMICS', 'GO ON TO THE NEXT PAGE', 'Unauthorized copying', 'Time-']
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
        print(f"WARNING: 'sub' found in {q['question_id']}")

# 5. 表格数据混入检查
# 如果题干文本包含大量数字且后面紧跟选项，可能是表格数据混入
```

### 7.2 步骤4b: 即时数据清理

在单份PDF提取并通过数据层审计后，立即对该年份数据进行清理：

**下标处理**：
- `MU sub s` → `MU_s`（前端渲染为下标）
- `P sub h` → `P_h`
- `Q sub 1` → `Q₁`（Unicode下标）
- 扫描所有文本，找到 "sub" 作为独立单词出现的情况，人工确认并修复

**货币符号**：
- 检查所有数字前是否有 `$`，缺失的补全

**空格和换行**：
- 修复词组断裂（如 `invent\nories` → `inventories`）
- 修复多余空格

**选项文本统一**：
- 确保所有选项以句号或合适标点结尾
- 确保选项没有前导空格或特殊字符

**页眉/页脚残留检查**：
- 再次扫描是否还有 "MICROECONOMICS"、"GO ON TO THE NEXT PAGE" 等残留

### 7.3 步骤4c: 再次审计（确认P0/P1/P2归零）

清理后，再次运行：
- 空选项检查
- 污染检查
- 下标检查（确保没有 "sub" 残留）
- 货币符号检查
- 空格检查

**如果仍有P0/P1/P2问题，回到步骤3修复。不能进入下一年。**

### 7.4 步骤4d: 前端渲染审计（WebBridge）

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

### 7.5 问题分级

| 级别 | 定义 | 修复要求 | 示例 |
|------|------|----------|------|
| **P0** | 学生无法正确完成这道题 | **必须修复，否则不能进入下一年** | 空选项、题干截断、表格数据完全丢失、图形缺失、FRQ为空 |
| **P1** | 学生可能给出错误答案 | **必须修复** | 下标变"sub"文本、选项混入其他题目数据、坐标选项错误、alt-text被当作选项 |
| **P2** | 不影响做题正确性但体验差 | **必须修复** | 文本换行错误、货币符号缺失、多余空格 |
| **P3** | 优化建议 | 可记录但不阻塞 | 字体、排版微调 |

### 7.6 交付物

- `public/data/ap/microeconomics/2012_question_bank.json`（该年份MCQ）
- `public/data/ap/microeconomics/2012_frq_bank.json`（该年份FRQ）
- `docs/audit_2012.md`（该年份审计报告）

---

## 八、Phase 5: 进入下一年PDF（重复Phase 2-4）

对2013-2018年PDF，逐个重复：
1. Phase 2: 分析PDF格式，标记A/B/C/D类题
2. Phase 3: 提取（A类脚本，B/C/D手动，FRQ混合）
3. Phase 4: 审计（P0/P1/P2归零）

**每做完一年，这一年的数据就是"干净"的，随时可以单独使用。**

---

## 九、Phase 6: 单元分类（所有年份完成后）

### 9.1 原则

基于CED知识范围，NOT关键词频率。

标准："Would a student who has ONLY studied this unit be able to answer this question?"

### 9.2 流程

```
classification_config.json → LLM Prompt（批次处理）→ 结构化输出 → 脚本后验证
```

### 9.3 脚本后验证

```python
# 硬性错误：题目包含某单元的 excluded_concepts → 绝对不能分到该单元
# 软警告：题目文本中没有出现该单元的 core_concepts → 可接受（可能是情境描述）
```

### 9.4 人工抽查

- 每个单元抽查5-10题
- 检查分类是否正确
- 如果错误率 > 5%，扩大抽查范围或重新分类

---

## 十、Phase 7: 相似题目索引

```bash
python scripts/build_similarity_index.py --subject micro
```

验证：随机抽取10题，检查相似题目是否真正相关。

---

## 十一、Phase 8: 构建门禁

### 11.1 数据验证

```bash
node scripts/data_validator.cjs public/data/ap/microeconomics/question_bank.json
```

检查项：
- 字段完整性（CRITICAL）
- 单元有效性（CRITICAL）
- 排除概念违反（CRITICAL）
- 图像关联性（CRITICAL）
- 背景数据与选项区分（CRITICAL）
- 表格格式（CRITICAL）
- 文本污染（CRITICAL）
- 选项截断（CRITICAL）
- 下标渲染（CRITICAL）
- 编码检查（CRITICAL）
- FRQ rubric 结构（CRITICAL）

### 11.2 图像验证

```bash
node scripts/image_validator.cjs --subject micro
```

检查项：
- 文件存在（CRITICAL）
- 文件大小 > 200 bytes（CRITICAL）
- 无文字污染（抽样检查）（CRITICAL）
- 图像完整性（CRITICAL）

### 11.3 构建

```bash
npm run build
```

构建失败条件：
- `data_validator.cjs` 返回非0 → 失败
- `image_validator.cjs` 返回非0 → 失败

---

## 十二、Phase 9: 前端全量审计（不可跳过）

### 12.1 WebBridge全量检查

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

### 12.2 条件循环

```
Phase 9 启动
  → 全量审计
  → 生成问题报告
  → 有 P0/P1/P2 问题？
    → 是：修复问题 → 重新构建部署 → 重新执行完整全量审计
    → 否：通过，Phase 9 结束
```

**硬性规则**：
- 每次修复后必须重新执行完整全量审计
- **循环终止条件**：P0、P1、P2 问题数均为 0
- 只有 P3 可以遗留

### 12.3 交付物

`docs/FRONTEND_AUDIT_REPORT_YYYYMMDD.md`

---

## 十三、Phase 10: 推送与档案维护

### 13.1 科目总结文档

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
- 表格数据污染：已处理（B类手动处理）
- 坐标选项：已手动标注（C类手动处理）
- 下标渲染：已统一处理（即时清理）
- 博弈论矩阵：已提取为图片+结构化数据（D类手动处理）

### 遗留问题
- 无（或列出P3问题）
```

### 13.2 推送到 GitHub

```bash
git add -A
git commit -m "feat: AP Microeconomics 全量重建

- 年份：2012-2018
- MCQ：XXX 题 + FRQ：XXX 题 + 图像：XXX 张
- 逐份提取、逐份审计
- 数据验证：0 errors, 0 warnings
- 前端审计：0 P0, 0 P1, 0 P2"
git push origin main
```

### 13.3 更新技能和文档

- 更新 `QUESTION_BANK_BUILDER_SKILL.md`
- 更新 `EXAM_SUBJECT_PIPELINE.md`
- 记录 Microeconomics 特有陷阱和解决方案

---

## 十四、执行检查清单

### Phase 1: 前期准备
- [ ] 已阅读 CED，记录考试结构
- [ ] 已创建 `classification_config.json`

### Phase 2: PDF形态分析（每份PDF）
- [ ] 2012年PDF分析完成，逐题标记A/B/C/D类
- [ ] 2013年PDF分析完成
- [ ] 2014年PDF分析完成
- [ ] 2015年PDF分析完成
- [ ] 2016年PDF分析完成
- [ ] 2017年PDF分析完成
- [ ] 2018年PDF分析完成

### Phase 3-4: 逐份提取与审计（每份PDF）
- [ ] 2012年提取完成，审计通过（0 P0, 0 P1, 0 P2）
- [ ] 2013年提取完成，审计通过（0 P0, 0 P1, 0 P2）
- [ ] 2014年提取完成，审计通过（0 P0, 0 P1, 0 P2）
- [ ] 2015年提取完成，审计通过（0 P0, 0 P1, 0 P2）
- [ ] 2016年提取完成，审计通过（0 P0, 0 P1, 0 P2）
- [ ] 2017年提取完成，审计通过（0 P0, 0 P1, 0 P2）
- [ ] 2018年提取完成，审计通过（0 P0, 0 P1, 0 P2）

### Phase 5: 图像/表格提取（已包含在Phase 3中）
- [ ] 所有图形题已裁剪为图片
- [ ] 所有表格题已裁剪为图片+构建structured_data
- [ ] 所有博弈论矩阵已裁剪为图片+构建矩阵数据

### Phase 6: 即时数据清理（已包含在Phase 4中）
- [ ] 每份PDF提取后立即清理下标
- [ ] 每份PDF提取后立即补全货币符号
- [ ] 每份PDF提取后立即修复空格和换行

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
