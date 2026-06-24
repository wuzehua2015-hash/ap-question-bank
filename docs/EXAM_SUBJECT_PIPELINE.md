# AP/IB 题库科目建立完整流程 (v1)

## 核心原则

1. **配置驱动，代码不可知**：所有科目差异通过配置文件表达，提取逻辑不硬编码科目名
2. **工具复用，不从头写**：已有工具（`precise_table_cropper.py`、`data_validator.cjs`、`image_validator.cjs` 等）必须复用，新工具只能补充不能替代
3. **审计不可跳过**：任何数据变更必须通过 `data_validator.cjs` + `image_validator.cjs` 验证才能部署
4. **文档即契约**：每个阶段产生可验证的交付物，下一阶段依赖上一阶段的交付物

---

## Phase 0: 环境探测 — 在开始任何工作之前

### 0.1 为什么必须做

**问题**：Bash 的 PATH 环境变量与 Windows 系统 PATH 是隔离的。Node.js、npm、Python 可能安装在系统目录中但 Bash 找不到它们。如果在流程中突然遇到 `npm: command not found` 或 `python: command not found`，整个流程会被迫中断。

**已发生的错误**：Microeconomics 重做时，Bash 中 `npm`/`npx` 均不可用，导致 Phase 8 构建无法进行。后来发现它们安装在 `C:\Users\wuzeh\AppData\Local\Programs\kimi-desktop\resources\resources\runtime\`，但 Bash 的 PATH 不包含这个目录。

### 0.2 执行步骤

```bash
# 步骤 1：探测并缓存工具路径
node scripts/env_probe.cjs

# 输出示例：
# === Environment Probe ===
#   node: C:\Users\...\kimi-desktop\...\runtime\node.exe
#   npm: C:\Users\...\kimi-desktop\...\runtime\npm.cmd
#   python: C:\Users\...\daimon-bundle\runtime\python\cpython-3.12\python.exe
#   npx: C:\Users\...\kimi-desktop\...\runtime\npx.cmd
# Cached to: scripts/env.json
# ✅ All critical tools found
```

```bash
# 步骤 2：所有后续命令通过 run_with_env.cjs 执行
node scripts/run_with_env.cjs npm run build
node scripts/run_with_env.cjs npm run validate
node scripts/run_with_env.cjs node scripts/data_validator.cjs
```

### 0.3 交付物

- `scripts/env.json` — 缓存的工具路径配置文件
- `scripts/env_probe.cjs` — 环境探测脚本（可复用）
- `scripts/run_with_env.cjs` — 命令执行包装器（可复用）

### 0.4 关键规则

- **任何科目开始工作前，必须先运行 `node scripts/env_probe.cjs`**
- **如果 `env.json` 不存在，任何后续命令都应该报错并提示运行 env_probe**
- **不要将工具路径硬编码到任何脚本中，只读取 `env.json`**

---

## Phase 1: 前期准备 — 理解考试结构

### 1.1 阅读官方考试说明 (CED / Subject Guide)

**目的**：理解考试结构，为后续所有工作提供正确参数。

**必须收集的信息**：

| 信息项 | 来源 | 用途 |
|--------|------|------|
| 单元数量和名称 | Course and Exam Description (CED) | `classification_config.json` 的 `units` |
| 每个单元的考试权重 | CED 中的 Unit Weighting 表 | `subjects.json` 的 `mockExam.unitDistribution` |
| 考试总时长 | CED 中的 Exam Overview | `subjects.json` 的 `mockExam.mcqTimeLimit` / `frqTimeLimit` |
| 题目形式 | CED 中的 Exam Format | 决定需要提取哪些题型（MCQ/FRQ/SAQ/DBQ等） |
| MCQ 数量 | 历年真题或 CED | `subjects.json` 的 `mockExam.totalMCQ` |
| FRQ 数量 | 历年真题或 CED | `subjects.json` 的 `mockExam.frqCount` |
| 是否有 Answer Key | 真题 PDF | 决定是否需要手动收集答案 |
| 是否有 Scoring Guidelines | 真题 PDF | 决定 FRQ rubric 的提取策略 |

**交付物**：
- `docs/{subject}_ced_notes.md` — 考试结构笔记（单元、权重、时间）
- `public/data/ap/{subject}/classification_config.json` — 单元分类配置

### 1.2 创建 `classification_config.json`

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
      "excluded_concepts": ["supply curve", "demand curve", "equilibrium"],
      "distinguishing_features": ["No market supply/demand analysis"],
      "boundary_rules": ["PPF analysis = U1", "Comparative advantage = U1"],
      "example_questions": ["Comparative advantage and terms of trade"]
    }
  ],
  "cross_unit_rules": [
    {
      "name": "Highest unit number rule",
      "rule": "If a question involves concepts from multiple units, ALWAYS classify to the HIGHEST unit number."
    }
  ],
  "common_pitfalls": ["NEVER classify by keyword frequency alone"]
}
```

**关键设计**：
- `excluded_concepts`：该单元**不包含**的概念（防止误分类）。**硬性规则**：如果题目包含某单元的排除概念，该单元绝对不能被选中
- `boundary_rules`：边界判断规则（用于 LLM Prompt 和脚本验证）
- `cross_unit_rules`：跨单元规则（如最高单元优先）
- `common_pitfalls`：常见误分类模式（用于 LLM Prompt）

**⚠️ 重要：单元分布比例 ≠ 分类正确性**
- `weighting` 字段**只在** Mock Exam 抽题时使用，确保抽题数量与真实考试一致
- **绝不能**用分布比例来反向验证分类质量。分类正确性必须通过**排除概念硬检查**和**核心概念覆盖检查**来验证

---

## Phase 2: PDF 形态分析 — 学习具体题目形态

### 2.1 选择 1-2 份 PDF 进行深度分析

**目的**：理解该科目的 PDF 具体形态，识别提取难点，为后续工具选择提供依据。

**分析清单**：

| 检查项 | 记录内容 | 影响 |
|--------|----------|------|
| PDF 是原生文本还是扫描图像 | 检查 `page.get_text()` 是否返回有意义文本 | 决定是否需要 OCR |
| 是否有水印 | 查看是否有 "TestDaily" 等灰色水印覆盖 | 是否需要 `remove_watermark.py` |
| 页面布局 | 单栏还是双栏？ | 决定提取策略（`use_two_column=True/False`） |
| MCQ 选项格式 | `(A) text (B) text` 还是表格？ | 决定正则表达式和解析策略 |
| 是否有表格选项 | 选项是 Demand/Supply 两列还是矩阵？ | 需要 `option_table_data` + 表格图像 |
| 图像类型 | 嵌入图片？矢量图？图表？表格？ | 决定裁剪策略 |
| 图形是否多题共用 | 是否有 "Questions X-Y are based on" 提示 | 需要记录 `shared_graph_questions` |
| alt-text 污染 | 是否有 "The figure shows..." 等无障碍描述 | 需要过滤模式 |
| FRQ 页面布局 | 是否有 answer page、additional page、scoring guidelines | 决定 FRQ 提取策略 |
| 答案/得分标准位置 | 在 MCQ 末尾？单独文件？嵌入 FRQ 后面？ | 决定答案提取策略 |
| 是否有评分标准图像 | rubric 中是否包含表格/图表 | 需要 `precise_table_cropper.py` |

**交付物**：
- `docs/{subject}_pdf_analysis.md` — PDF 形态分析报告

### 2.2 识别该科目特有陷阱

基于 PDF 分析，列出所有已知陷阱：

```markdown
## AP Microeconomics 已知陷阱

1. **博弈论矩阵选项**（2014_Q40）：选项是 2x2 矩阵，无 (A)(B) 格式
2. **Demand/Supply 表格选项**（2015_Q04）：表头在题干末尾混入
3. **Entertainment/Medical Care 双列表格**（2017_Q33）：跨列污染
4. **成本曲线图像**（2018_Q07）："average fixed cost" 引用但未标记 has_graph
5. **多题共用图表**（Q29-30）："Questions 29-30 are based on"
6. **FRQ scoring guidelines 在右侧栏**：需要 reading-order 提取
7. **矢量图不是嵌入图片**：`get_image_rects` 检测不到，需要整页渲染
```

**每个新科目都必须产生类似的陷阱清单**。这份清单写入 `docs/{subject}_pdf_analysis.md`，并在后续提取阶段逐项验证。

---

## Phase 3: 构建科目特定 Builder — 配置驱动，不硬编码

### 3.1 设计原则

**禁止**：
- ❌ 在提取脚本中硬编码科目名（如 `macro_question_bank_v4.json`）
- ❌ 在验证脚本中硬编码单元关键词（如 `u2_exclusive = ['gdp', ...]`）
- ❌ 在提取脚本中硬编码 `GRAPH_KEYWORDS`（如 `['graph above', 'diagram above']`）

**正确做法**：
- ✅ 提取脚本接受 `--subject` 参数，读取 `classification_config.json`
- ✅ 验证脚本读取 `classification_config.json` 的 `boundary_rules` 和 `exclusive_concepts`
- ✅ `GRAPH_KEYWORDS` 从 `classification_config.json` 的 `image_keywords` 读取

### 3.2 提取脚本参数化

```python
# 提取脚本应该这样调用：
# python scripts/rebuild_subject.py --subject micro --pdf-dir ".../Microeconomics" --years 2012-2018

# 脚本内部读取配置：
import json
config = json.load(open(f'public/data/ap/{subject}/classification_config.json'))
units = config['units']
graph_keywords = config.get('image_keywords', ['graph', 'diagram', 'figure', 'table'])
# 不再硬编码任何科目特定内容
```

### 3.3 验证脚本通用化

`data_validator.cjs` 应该：
1. 读取 `subjects.json` 获取所有科目列表
2. 对每个科目，读取 `classification_config.json`
3. 从 `classification_config.json` 动态生成单元范围检查（不是硬编码 U1-U6）
4. 从 `classification_config.json` 的 `exclusive_concepts` 动态生成分类硬规则

```javascript
// data_validator.cjs 的正确设计
const subjects = JSON.parse(fs.readFileSync('public/data/subjects.json')).subjects;

for (const subject of subjects) {
  const configPath = `public/data/${subject.classificationConfig}`;
  const config = JSON.parse(fs.readFileSync(configPath));
  
  // 动态生成单元列表
  const validUnits = config.units.map(u => u.code);
  
  // 动态生成分类硬规则
  for (const unit of config.units) {
    // 检查低单元是否包含高单元关键词
    // 从 classification_config.json 读取，不硬编码
  }
}
```

---

## Phase 4: 题库抽取 — MCQ + FRQ + 图像 + 表格

### 4.1 通用提取流程

```
PDF → 文本提取 → 题目解析 → 答案匹配 → 清理 → 图像提取 → 表格提取 → 结构化数据
```

**工具链**：
- PyMuPDF (`fitz`) — 文本提取（`page.get_text('blocks')`）
- `precise_table_cropper.py` — 表格/图像裁剪（必须复用，不要重新写）
- `remove_watermark.py` — 水印去除（如需要）

**文本清理关键规则**（已发生的错误）：
1. **正则匹配前必须规范化**：`' '.join(text.split())` 去除换行符，避免词组被分割（如 "perfect\ncompetition"）
2. **clean_text 不要使用 `re.DOTALL` 跨行删除**：`re.sub(r'...', '', text, flags=re.DOTALL)` 会从匹配点开始删除到文本末尾，可能误删 Scoring Guidelines 等关键内容
3. **目录页干扰**：某些 PDF 的目录页包含题目编号伪影（如 "Contents ... 1."），需要在提取逻辑中过滤目录页

### 4.2 文本提取策略（配置驱动）

```python
def extract_page_text(page, layout_config):
    """根据 PDF 布局配置提取文本。
    
    layout_config 从 classification_config.json 读取：
    - two_column: true/false
    - header_y_threshold: 页眉高度（如 100px）
    - footer_y_threshold: 页脚高度（如 700px）
    """
    blocks = page.get_text('blocks')
    
    if layout_config.get('two_column'):
        mid_x = page.rect.width / 2
        left = sorted([b for b in blocks if (b[0]+b[2])/2 < mid_x], key=lambda b: b[1])
        right = sorted([b for b in blocks if (b[0]+b[2])/2 >= mid_x], key=lambda b: b[1])
        return '\n'.join([b[4] for b in left]) + '\n___COLUMN_BREAK___\n' + '\n'.join([b[4] for b in right])
    else:
        return page.get_text()
```

### 4.3 MCQ 解析（通用）

```python
def parse_mcqs(page_text, config):
    """解析 MCQ，从 classification_config.json 读取配置。"""
    # 1. 截断跨列污染（___COLUMN_BREAK___ 之后的内容）
    # 2. 匹配题号
    # 3. 匹配选项 (A)-(E)
    # 4. 检测表格选项（从 config['table_option_patterns']）
    # 5. 检测空选项（需要图像）
    # 6. 清理 alt-text（从 config['alt_text_patterns']）
```

### 4.4 图像提取（使用 `precise_table_cropper.py`）

**禁止**：自己重新写 `render_page_image` 或 `get_image_rects` 裁剪逻辑。

**正确做法**：
```bash
# 通用表格/图像裁剪
python scripts/precise_table_cropper.py \
    --pdf "AP Micro 2014.pdf" \
    --page 41 \
    --output "public/images/micro/frq/2014_FRQ3_table.png"

# 如果 precise_table_cropper.py 不能处理特定情况，修复它，而不是绕开它
```

### 4.5 表格选项处理

```json
// 表格题目的数据结构
{
  "question_id": "2014_Q40",
  "text": "The payoff matrix...",
  "options": {
    "A": "Agronomia: High, Farmingdale: High",
    "B": "Agronomia: High, Farmingdale: Low",
    // ...
  },
  "option_table_data": {
    "headers": ["Agronomia's Profit", "Farmingdale's Profit"],
    "rows": {
      "A": ["High", "High"],
      "B": ["High", "Low"]
    }
  },
  "image_paths": ["/images/micro/mcq/2014_Q40_table.png"]
}
```

**关键规则**：
- 表格选项**必须**同时有 `image_paths`（视觉呈现）和 `option_table_data`（结构化数据）
- 表格图像必须只包含表格，不包含题目文字
- `options` 字段是文本版本（用 `/` 分隔），用于搜索和纯文本展示

### 4.6 FRQ 提取（通用）

**重要**：FRQ 必须在 Phase 4 中与 MCQ 同时提取，不能遗漏。

```python
def extract_frq(pdf_path, page_ranges, config):
    """提取 FRQ，从 classification_config.json 读取配置。"""
    # 1. 找到 "SECTION II: Free Response" 开始页（不是目录页中的伪影）
    # 2. 找到 "STOP END OF EXAM" 结束页
    # 3. 提取 Question 1/2/3 的文本（去重：忽略 "Question X is reprinted for your convenience"）
    # 4. 提取 Scoring Guidelines（从 "Free-Response Scoring Guidelines" 页开始）
    # 5. 清理 boilerplate（从 config['frq_pollution_patterns']）
    # 6. 注意：clean_text 中的正则不要使用 re.DOTALL 跨行删除，避免误删 Scoring Guidelines
```

**FRQ 页面范围查找策略**（从后往前扫描）：
1. 找到 `STOP` + `END OF EXAM` → FRQ 结束页
2. 找到 `SECTION II` + `Free Response` + 下一页有实际题目内容 → FRQ 开始页
3. 找到 `Scoring Guidelines` 且页码 > FRQ 结束页 → 评分标准开始页

### 4.7 题号完整性检查（不可跳过）

**已发生的错误**：2016 年只提取 51 题（目标 60），缺失 11 题。原因是 PDF 目录页干扰 + 双栏解析问题。

```python
def validate_question_completeness(questions, year, expected_count=60):
    """验证某年份的题号是否完整。"""
    q_nums = sorted([q['question_num'] for q in questions if q['year'] == year])
    missing = [n for n in range(1, expected_count + 1) if n not in q_nums]
    if missing:
        raise ValueError(f"{year} 年缺失 {len(missing)} 题: {missing}")
```

**规则**：
- 每个年份提取完成后，立即运行题号完整性检查
- 如果发现缺失题号，不要继续下一步，立即分析原因并修复
- 常见原因：目录页干扰、alt-text 导致提取跳过、双栏跨页分割

### 4.8 多题共用图表处理

### 4.7 多题共用图表处理

```json
{
  "question_id": "2018_Q29",
  "text": "Questions 29-30 are based on the following graph...",
  "image_paths": ["/images/micro/mcq/2018_pageX_graph.png"],
  "shared_graph_with": ["2018_Q30"]
}
```

---

## Phase 5: 单元分类与相似度算法

### 5.1 LLM 分类流程（配置驱动）

```
classification_config.json → LLM Prompt → 结构化输出 → 脚本后验证
```

**LLM Prompt 从 `classification_config.json` 动态生成**：
- `units[].name` → LLM Prompt 中的单元定义
- `units[].core_concepts` → 单元关键词列表
- `cross_unit_rules` → 分类优先级规则
- `common_pitfalls` → 常见误分类提醒

**输出格式**：
```json
{
  "question_id": "2014_Q40",
  "identified_concepts": ["game theory", "payoff matrix", "Nash equilibrium"],
  "core_concept": "game theory",
  "unit": "U4",
  "reasoning": "This question tests game theory and payoff matrix, which is a U4 (Imperfect Competition) concept.",
  "confidence": "HIGH",
  "boundary_concern": null
}
```

### 5.2 脚本后验证（通用）

从 `classification_config.json` 动态生成验证规则：

**硬性错误（必须修复）**：
- 题目包含某单元的 `excluded_concepts` → 绝对不能分到该单元
- 这是唯一的硬性错误标准

**软警告（可接受，无需修复）**：
- 题目文本中没有明确出现该单元的 `core_concepts` → NO_CORE_CONCEPT 警告
- **这不是分类错误**：核心概念列表是抽象术语（如 "consumer choice"），但题目文本使用具体情境描述（如 "Clark spends his entire income on two goods"），不会直接出现术语本身
- 这是正常的，不需要修复

**分布比例检查（仅用于 Mock Exam 抽题）**：
- `weighting` 字段只在生成 Mock Exam 时使用，确保抽题数量与真实考试一致
- **绝不能**用分布比例来反向验证分类质量

```javascript
function validateClassification(q, config) {
  const unit = config.units.find(u => u.code === q.primary_unit);
  const higherUnits = config.units.filter(u => u.code > q.primary_unit);
  
  // 硬性错误：排除概念检查
  for (const excluded of unit.excluded_concepts) {
    if (q.text.toLowerCase().includes(excluded.toLowerCase())) {
      return {
        severity: 'CRITICAL',
        message: `${q.question_id}: EXCLUSION_VIOLATION in ${q.primary_unit} - contains '${excluded}'`
      };
    }
  }
  
  // 软警告：核心概念覆盖（仅提示，不报错）
  const hasCoreConcept = unit.core_concepts.some(c => 
    q.text.toLowerCase().includes(c.toLowerCase())
  );
  if (!hasCoreConcept) {
    return {
      severity: 'WARNING',
      message: `${q.question_id}: NO_CORE_CONCEPT in ${q.primary_unit} (acceptable)`
    };
  }
}
```

**关键规则**：
- 硬性错误数量必须为 0，否则数据不能部署
- 软警告数量可以 > 0，不需要修复
- 分布比例不需要检查（那是 Mock Exam 的事）

### 5.3 相似度索引

```bash
# 通用相似度索引构建（支持多科目）
python scripts/build_similarity_index.py --subject micro

# 读取 subjects.json 获取所有 active 科目，自动构建每个科目的索引
```

---

## Phase 6: 审计与验证 — 不可跳过的门禁

### 6.1 数据验证（`data_validator.cjs`）

**必须覆盖所有科目**（不再硬编码）：

```bash
# 验证所有科目
node scripts/data_validator.cjs

# 验证特定科目
node scripts/data_validator.cjs public/data/ap/microeconomics/question_bank.json
```

**检查项**（从 `classification_config.json` 读取规则）：

| 检查项 | 来源 | 严重级别 | 说明 |
|--------|------|----------|------|
| 字段完整性 | JSON Schema | CRITICAL | |
| 单元有效性 | `classification_config.json` 的 `units[].code` | CRITICAL | |
| 排除概念违反 | `classification_config.json` 的 `excluded_concepts` | CRITICAL | **硬性错误，必须为 0** |
| 图像关联性 | `has_graph` + `image_paths` | CRITICAL | |
| 表格格式 | `option_table_data` | CRITICAL | |
| 文本污染 | `classification_config.json` 的 `pollution_patterns` | CRITICAL | |
| 选项截断 | 通用正则（不以 "and" / "the" / "of" 结尾） | CRITICAL | |
| pure_unit 一致性 | `pure_unit` + `secondary_units` | WARNING | 旧数据可能遗留，不影响部署 |
| 核心概念覆盖 | `classification_config.json` 的 `core_concepts` | INFO | **软警告，可接受** |

**关键区分**：
- **CRITICAL / ERROR**：必须修复，否则不能部署
- **WARNING**：可以部署，但建议记录并人工抽查
- **INFO**： purely informational，不需要修复

### 6.2 图像验证（`image_validator.cjs`）

```bash
# 验证所有科目
node scripts/image_validator.cjs

# 验证特定科目
node scripts/image_validator.cjs --subject micro
```

**检查项**：

| 检查项 | 规则 | 严重级别 |
|--------|------|----------|
| 文件存在 | 所有 `image_paths` 引用存在 | CRITICAL |
| 文件大小 | 每个 > 200 bytes | CRITICAL |
| 无文字污染 | 图像不包含题目文本（抽样检查） | CRITICAL |
| 图像完整性 | 无截断 | CRITICAL |

### 6.3 烟测（前端）

```bash
# 运行 pre-deploy-check.js（已有，必须包含数据验证）
node scripts/pre-deploy-check.js

# 手动烟测清单
1. 首页加载，科目切换正常
2. MCQ 题目展示，图像正确
3. 表格选项正确渲染
4. FRQ 题目展示，rubric 完整
5. 搜索页面展示相似变式
6. Mock exam 生成，单元分布正确
```

### 6.4 审计报告（`AUDIT_REPORT.md`）

必须包含：
- 科目信息（名称、年份范围、总题数）
- 单元分布（与官方权重对比）
- `data_validator.cjs` 结果（errors + warnings）
- `image_validator.cjs` 结果
- 多题共用图表映射
- 已知陷阱检查结果（逐项验证 Phase 2 的陷阱清单）
- 人工抽查结果（5 图像 + 3 表格 + 3 FRQ）
- 行动项和状态

---

## Phase 7: 前端集成 — 新科目上线

### 7.1 更新 `subjects.json`

```json
{
  "subjects": [
    {
      "id": "micro",
      "name": "AP Microeconomics",
      "shortName": "Micro",
      "active": true,
      "hasFRQ": true,
      "questionBank": "ap/microeconomics/question_bank.json",
      "frqBank": "ap/microeconomics/frq_bank.json",
      "similarityIndex": "ap/microeconomics/similarity_index.json",
      "classificationConfig": "ap/microeconomics/classification_config.json",
      "dataVersion": "v1",
      "units": [
        { "id": "U1", "name": "Basic Economic Concepts" },
        { "id": "U2", "name": "Supply and Demand" },
        // ...
      ],
      "mockExam": {
        "totalMCQ": 60,
        "frqCount": 3,
        "mcqTimeLimit": 4200,
        "frqTimeLimit": 3600,
        "unitDistribution": { "U1": 7, "U2": 13, "U3": 15, "U4": 12, "U5": 7, "U6": 6 }
      }
    }
  ]
}
```

**关键**：`classificationConfig` 字段必须指向 `classification_config.json`，这是前端读取单元信息的来源。

### 7.2 前端多科目切换

前端代码必须：
1. 从 `subjects.json` 动态读取科目列表（不硬编码科目名）
2. 从 `classificationConfig` 读取单元信息（不硬编码单元名称）
3. 路由参数化（`/quiz/:subject` 而不是 `/quiz/macro`）

### 7.3 数据文件路径

```
public/data/
  subjects.json                        # 科目列表
  ap/{subject}/
    question_bank.json                   # MCQ 数据
    frq_bank.json                        # FRQ 数据
    similarity_index.json                # 相似度索引
    classification_config.json           # 分类配置
public/images/{subject}/
  mcq/                                  # MCQ 图像
  frq/                                  # FRQ 图像
```

---

## Phase 8: 部署与烟测

### 8.1 构建门禁

```json
// package.json
{
  "scripts": {
    "build": "npm run validate && vite build",
    "validate": "npm run validate:data && npm run validate:images",
    "validate:data": "node scripts/data_validator.cjs",
    "validate:images": "node scripts/image_validator.cjs"
  }
}
```

**构建失败条件**：
- `data_validator.cjs` 返回非 0 → 构建失败
- `image_validator.cjs` 返回非 0 → 构建失败
- `pre-deploy-check.js` 返回非 0 → 构建失败

### 8.2 部署烟测

部署后必须验证：
1. 新科目在首页可见
2. 科目切换正常
3. MCQ 题目展示，图像正确
4. 表格选项正确渲染
5. FRQ 题目和 rubric 展示正确
6. 搜索页面展示相似变式
7. Mock exam 生成正确

---

## Phase 9: 总结、推送与档案维护

### 9.1 科目总结文档

```markdown
## AP Microeconomics 科目总结

### 数据
- 年份：2012-2018
- MCQ：410 题
- FRQ：21 题
- 图像：XXX 张
- 表格题：XX 题

### 已知陷阱（Phase 2 发现）
- 博弈论矩阵：已处理
- Demand/Supply 表格：已处理
- 多题共用图表：已处理
- 矢量图检测：使用 precise_table_cropper.py

### 工具改进需求
- precise_table_cropper.py：已修复 XX 问题
- data_validator.cjs：已添加 micro 支持

### 遗留问题
- 无
```

### 9.2 推送到 GitHub（不可跳过）

**已发生的错误**：完成所有 Phase 0-8 后忘记推送到 GitHub，导致本地修改与远程不同步，后续工作可能丢失。

```bash
# 步骤 1：检查 git 状态
git status

# 步骤 2：暂存所有更改（包括新增文件和删除文件）
git add -A

# 步骤 3：提交（包含清晰的 commit message，记录所做工作）
git commit -m "feat: {Subject} 全量重建 (Phase 0-9)

- {X} MCQs + {Y} FRQs + {Z} images
- 修复 ...
- 新增 ...
- 数据验证：0 errors, 0 warnings
- 构建：vite build 通过"

# 步骤 4：推送到远程
git push origin main

# 步骤 5：验证推送成功
# 在浏览器中打开 GitHub 仓库确认 commit 已推送
```

**关键规则**：
- **Phase 9 必须包含推送步骤，不能遗漏**
- 提交信息必须包含：科目名称、数据量、关键修复、验证结果
- 如果 `backups/` 目录存在，必须将其加入 `.gitignore`（备份不应提交到 git）
- 推送后必须在 GitHub 网页确认 commit 已显示

### 9.3 工具更新

如果发现已有工具不能处理新科目的情况，**修复工具，不是绕开工具**：

- `precise_table_cropper.py` 不能处理某种图表 → 修复 `precise_table_cropper.py` 的通用逻辑
- `data_validator.cjs` 硬编码了科目 → 修复为通用化
- `build_similarity_index.py` 不支持多科目 → 修复为支持 `--subject` 参数

### 9.4 技能更新

- 更新 `question-bank-builder` 技能：添加新科目特有的陷阱和解决方案
- 更新 `ap-pdf-extraction` 技能：添加新科目的 PDF 形态特征
- 更新 `question-bank-audit` 技能：添加新科目的审计检查项
- 更新 `ap-question-bank-maintenance` 技能：更新 TOOLS_INVENTORY 和项目状态

### 9.5 流程文档更新

- 更新 `EXAM_SUBJECT_PIPELINE.md`：记录新科目执行中发现的新陷阱和修复方法
- 更新 `MICROECONOMICS_REBUILD_LOG.md`（或对应科目日志）：记录所有错误和根本原因

---

## 执行检查清单（每次新科目必须逐项打钩）

### Phase 1: 前期准备
- [ ] 已阅读 CED，记录考试结构
- [ ] 已创建 `classification_config.json`
- [ ] `classification_config.json` 包含所有单元、权重、核心概念、边界规则

### Phase 2: PDF 分析
- [ ] 已分析 1-2 份 PDF 的形态
- [ ] 已记录所有已知陷阱（OCR、表格、水印、污染、布局等）
- [ ] 已记录图像类型和检测策略
- [ ] 已记录 FRQ 和 scoring guidelines 的位置

### Phase 3: Builder 构建
- [ ] 提取脚本接受 `--subject` 参数
- [ ] 提取脚本读取 `classification_config.json`，不硬编码
- [ ] 验证脚本读取 `classification_config.json`，不硬编码
- [ ] 图像关键词从配置读取，不硬编码

### Phase 4: 数据抽取
- [ ] MCQ 提取完成，无截断、无污染
- [ ] FRQ 提取完成，无截断、无跨题污染
- [ ] 答案提取完成，与 MCQ 匹配
- [ ] Scoring guidelines 提取完成，无截断
- [ ] 图像提取完成，使用 `precise_table_cropper.py`
- [ ] 表格选项提取完成，有 `image_paths` + `option_table_data`
- [ ] 多题共用图表已记录 `shared_graph_with`

### Phase 5: 分类与相似度
- [ ] LLM 分类完成，输出 `identified_concepts` + `reasoning` + `boundary_concern`
- [ ] 黄金测试集通过（准确率 > 95%）
- [ ] 脚本后验证通过（0 分类错误）
- [ ] `build_similarity_index.py` 已运行

### Phase 6: 审计
- [ ] `data_validator.cjs` 通过（0 errors, 0 warnings）
- [ ] `image_validator.cjs` 通过（0 errors, 0 warnings）
- [ ] `pre-deploy-check.js` 通过
- [ ] 人工抽查：5 图像 + 3 表格 + 3 FRQ
- [ ] `AUDIT_REPORT.md` 已生成

### Phase 7: 前端集成
- [ ] `subjects.json` 已更新
- [ ] `classificationConfig` 字段正确
- [ ] 单元列表和 mock exam 配置正确
- [ ] 前端代码不硬编码科目名或单元名

### Phase 8: 部署
- [ ] `npm run build` 成功
- [ ] `npm run validate` 通过（构建门禁）
- [ ] 部署成功
- [ ] 烟测通过（首页、题目、搜索、mock exam）

### Phase 9: 总结
- [ ] 科目总结文档已写
- [ ] 工具改进已记录
- [ ] 技能已更新
- [ ] `PROJECT_MAINTENANCE_GUIDE.md` 已更新
- [ ] `TOOLS_INVENTORY.md` 已更新

---

## 关键文件路径

| 文件 | 路径 | 用途 |
|------|------|------|
| 科目配置 | `public/data/ap/{subject}/classification_config.json` | 单元定义、分类规则 |
| 题目数据 | `public/data/ap/{subject}/question_bank.json` | MCQ 数据 |
| FRQ 数据 | `public/data/ap/{subject}/frq_bank.json` | FRQ 数据 |
| 相似度索引 | `public/data/ap/{subject}/similarity_index.json` | 相似题索引 |
| 科目列表 | `public/data/subjects.json` | 前端读取科目信息 |
| 图像 | `public/images/{subject}/mcq/` | MCQ 图像 |
| 图像 | `public/images/{subject}/frq/` | FRQ 图像 |
| 提取脚本 | `scripts/rebuild_subject.py` | 通用提取脚本 |
| 数据验证 | `scripts/data_validator.cjs` | 通用数据验证 |
| 图像验证 | `scripts/image_validator.cjs` | 通用图像验证 |
| 表格裁剪 | `scripts/precise_table_cropper.py` | 表格图像裁剪 |
| 相似度 | `scripts/build_similarity_index.py` | 相似度索引构建 |
| 预部署 | `scripts/pre-deploy-check.js` | 预部署检查 |
| 维护指南 | `PROJECT_MAINTENANCE_GUIDE.md` | 项目维护文档 |
| 工具清单 | `TOOLS_INVENTORY.md` | 工具清单 |
| 审计报告 | `AUDIT_REPORT.md` | 按次生成 |
| 科目分析 | `docs/{subject}_pdf_analysis.md` | 科目 PDF 分析 |
| 科目总结 | `docs/{subject}_summary.md` | 科目总结 |

---

## 禁止事项（技术债红线）

1. **禁止在脚本中硬编码科目名或文件名**：所有科目信息从 `classification_config.json` 读取
2. **禁止在验证脚本中硬编码单元关键词**：分类规则从 `classification_config.json` 读取
3. **禁止跳过审计**：任何数据变更必须通过 `data_validator.cjs` + `image_validator.cjs`
4. **禁止绕开已有工具**：工具不足时修复工具，不是重写一个新工具
5. **禁止手动修改 JSON 而不运行验证**：任何手动编辑必须通过验证门禁
6. **禁止在构建流程外部署**：`npm run build` 失败则禁止部署
7. **禁止不复用技能**：启动新科目前必须读取 `question-bank-builder`、`ap-pdf-extraction`、`question-bank-audit` 技能
