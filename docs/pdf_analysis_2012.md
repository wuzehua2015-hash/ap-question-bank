# PDF形态分析：AP Micro 2012.pdf

## 基本信息
- 总页数：60
- 目录页：第2页（Contents页）
- 水印：无（College Board官方PDF，无TestDaily等水印）
- 干扰页：
  - 第1页：封面
  - 第3-9页：Exam Instructions（监考说明，非题目）
  - 第10-16页：Student Answer Sheet（答题卡，⚠️ **严重干扰页**——包含大量A/B/C/D/E选项气泡，可能被误识别为题目选项）
  - 第17-18页：Section I说明（MCQ说明）
  - 第19页：版权声明页
  - 第36页：END OF SECTION I
  - 第37-39页：Section II封面+说明
  - 第41页、43页、45页、47页、49页：Additional answer pages（空白答题页）
  - 第42页、44页：Question reprinted for your convenience（题目重复页）
  - 第51页：Multiple-Choice Answer Key封面
  - 第53页：Free-Response Scoring Guidelines封面
  - 第57页：Scoring Worksheet封面
  - 第59-60页：空白页+College Board信息

## 页面分布

| 页面范围 | 内容 | 提取策略 |
|----------|------|----------|
| 1-9 | 封面、目录、考试指令 | **跳过** |
| 10-16 | 答题卡（A/B/C/D/E气泡） | **跳过**（严重干扰） |
| 17-19 | Section I说明、版权页 | **跳过** |
| 20-35 | MCQ题目（Q1-Q60） | **提取** |
| 36 | END OF SECTION I | **跳过** |
| 37-39 | Section II封面+说明 | **跳过** |
| 40-50 | FRQ（Q1-Q3 + 答题页+重复页） | **提取**（只提取原始题目页，跳过重复页和答题页） |
| 51-52 | Multiple-Choice Answer Key | **提取答案** |
| 53-56 | Free-Response Scoring Guidelines | **提取rubric** |
| 57-60 | Scoring Worksheet、空白页 | **跳过** |

## 布局
- 单栏/双栏：单栏（MCQ页面每页2-3题，左右无分栏）
- 页眉文字："MICROECONOMICS Section I"（需过滤）
- 页脚文字：
  - "Unauthorized copying or reuse of any part of this page is illegal."
  - "GO ON TO THE NEXT PAGE."
  - 页码（如 "-3-"）
- 干扰文字："Question X is reprinted for your convenience"（重复页，需跳过）

## 题号格式
- 题号样式：`1. `（数字+点+空格）
- 选项样式：`(A) `（括号+字母+空格）
- 选项排列：每个选项单独一行

## 逐题类型标记（A/B/C/D类）

**重要：以下标记基于文本分析 + 已提取内容。对于Q37-Q50，需要进一步查看PDF确认是否有图形。**

| 题号 | 类型 | 说明 | 处理策略 |
|------|------|------|----------|
| Q1 | A | 纯文本（opportunity cost定义） | 脚本提取 |
| Q2 | A | 纯文本（PPF concave） | 脚本提取 |
| Q3 | A | 纯文本（substitutes） | 脚本提取 |
| Q4 | C | 图形题（"diagram above"：price ceiling） | 手动裁剪图形 + 输入选项 |
| Q5 | A | 纯文本（income/prices double） | 脚本提取 |
| Q6 | A | 纯文本（marginal product） | 脚本提取 |
| Q7 | A | 纯文本（cost curves） | 脚本提取 |
| Q8 | A | 纯文本（cost curves） | 脚本提取 |
| Q9 | A | 纯文本（cost curves） | 脚本提取 |
| Q10 | A | 纯文本（perfect competition） | 脚本提取 |
| Q11 | A | 纯文本（market structures） | 脚本提取 |
| Q12 | A | 纯文本（profit-maximizing） | 脚本提取 |
| Q13 | B | 表格选项（wage subsidy effect：Wage Rate / Total Hours） | 手动裁剪表格 + 构建option_table_data |
| Q14 | B | 表格选项（tax on pollution：Output / Pollution） | 手动裁剪表格 + 构建option_table_data |
| Q15 | A | 纯文本（income distribution） | 脚本提取 |
| Q16 | A | 纯文本（comparative advantage） | 脚本提取 |
| Q17 | A | 纯文本（price controls） | 脚本提取 |
| Q18-19 | B | 表格选项（需求/供给税表，有图形） | 手动裁剪表格+图形 |
| Q20 | A | 纯文本（diminishing marginal utility） | 脚本提取 |
| Q21 | A | 纯文本（natural monopoly） | 脚本提取 |
| Q22 | A | 纯文本（returns to scale） | 脚本提取 |
| Q23 | A | 纯文本（cost curves） | 脚本提取 |
| Q24 | C | 图形题（"graph above"：profit-maximizing） | 手动裁剪图形 + 输入选项 |
| Q25 | A | 纯文本（marginal cost计算） | 脚本提取 |
| Q26-27 | B | 表格题（workers/coal output表格在题干中） | 手动裁剪表格（题干中）+ 输入选项 |
| Q28 | A | 纯文本（economic profit） | 脚本提取 |
| Q29 | A | 纯文本（positive externality） | 脚本提取 |
| Q30 | A | 纯文本（public good） | 脚本提取 |
| Q31 | B | 表格题（背景表格：comparative advantage，Country A/B数据） | 手动裁剪表格（题干中）+ 输入选项 |
| Q32 | A | 纯文本（equilibrium price） | 脚本提取 |
| Q33 | A | 纯文本（price elasticity） | 脚本提取 |
| Q34 | A | 纯文本（price elasticity） | 脚本提取 |
| Q35 | A | 纯文本（complements/substitutes） | 脚本提取 |
| Q36 | A | 纯文本（marginal cost curve） | 脚本提取 |
| Q37 | A | 纯文本（需要确认） | 脚本提取 |
| Q38 | A | 纯文本（需要确认） | 脚本提取 |
| Q39 | A | 纯文本（oligopoly） | 脚本提取 |
| Q40 | D | 博弈论矩阵（2x2 payoff matrix：UA/UB） | 手动裁剪矩阵 + 构建结构化数据 |
| Q41 | A | 纯文本（shutdown decision） | 脚本提取 |
| Q42 | A | 纯文本（minimum wage） | 脚本提取 |
| Q43 | A | 纯文本（optimal input combination） | 脚本提取 |
| Q44 | A | 纯文本（需要确认） | 脚本提取 |
| Q45 | B | 表格选项（income distribution quintiles） | 手动裁剪表格 + 构建option_table_data |
| Q46 | A | 纯文本（opportunity cost） | 脚本提取 |
| Q47 | A | 纯文本（scarcity） | 脚本提取 |
| Q48 | B | 表格选项（sales tax：Consumer Surplus / Producer Surplus / Total Surplus） | 手动裁剪表格 + 构建option_table_data |
| Q49 | A | 纯文本（需要确认） | 脚本提取 |
| Q50 | A | 纯文本（需要确认） | 脚本提取 |
| Q51 | A | 纯文本（demand curve downward sloping） | 脚本提取 |
| Q52 | C | 图形题（"graph above"：total revenue/total cost curves） | 手动裁剪图形 + 输入选项 |
| Q53 | A | 纯文本（marginal revenue） | 脚本提取 |
| Q54 | A | 纯文本（profit-maximizing） | 脚本提取 |
| Q55 | A | 纯文本（需要确认） | 脚本提取 |
| Q56 | B | 表格选项（demand curves：Demand for XYZ's Corn / XYZ's Labor Demand） | 手动裁剪表格 + 构建option_table_data |
| Q57 | A | 纯文本（advertising） | 脚本提取 |
| Q58 | A | 纯文本（input hiring） | 脚本提取 |
| Q59 | A | 纯文本（需要确认） | 脚本提取 |
| Q60 | A | 纯文本（需要确认） | 脚本提取 |

**统计：**
- A类（纯文本）：约50题（83%）—— 比预想的更多！
- B类（表格选项）：约7题（Q13, Q14, Q18-19, Q26-27, Q31, Q45, Q48, Q56）
- C类（图形题）：约3题（Q4, Q24, Q52）
- D类（博弈论矩阵）：1题（Q40）

## 特殊格式（已知陷阱）

1. **答题卡干扰页（第10-16页）**：包含大量A/B/C/D/E气泡，脚本可能误识别为选项。必须跳过这些页。
2. **题目重复页（第42、44页）**："Question X is reprinted for your convenience"，需跳过避免重复提取。
3. **空白答题页（第41、43、45、47、49页）**：Additional answer pages，需跳过。
4. **跨页表格（Q31）**：背景表格（Country A/B数据）开始于第27页底部，延续到第28页顶部。需要确认脚本是否能正确合并。
5. **图形题（Q4, Q18-19, Q24, Q52）**：有图形，需要裁剪。
6. **博弈论矩阵（Q40）**：2x2矩阵，需要手动构建结构化数据。

## 提取策略

### A类题（纯文本MCQ，~50题）
- 脚本提取：从第20页到第35页
- 过滤页眉："MICROECONOMICS Section I"
- 过滤页脚："Unauthorized copying...", "GO ON TO THE NEXT PAGE.", 页码
- 正则匹配：`^(\d+)\.\s+(.*)` 题号，`^\((A-E)\)\s+(.*)` 选项
- 注意：Q4虽然提到了"diagram above"，但选项是纯文本，所以标记为A类？不，Q4有图形，应该标记为C类。等等，我之前标记Q4为C类，但选项是纯文本。需要重新确认：如果选项是纯文本但题干有图形，属于C类（需要图形）。

### B类题（表格选项，~7题）
- 手动裁剪表格区域为图片
- 人工输入表格数据，构建 `option_table_data`
- 选项文本用 "/" 分隔或保持原样

### C类题（图形题，~3题）
- 手动裁剪图形区域为图片
- 人工输入选项文本（如果选项是坐标，如Q4的选项实际上是纯文本，不需要坐标选项）
- 标记 `requires_graph=true`

### D类题（博弈论矩阵，1题）
- 手动裁剪矩阵区域为图片
- 人工构建payoff matrix结构化数据
- 选项为矩阵描述文本

### FRQ提取
- 原始题目页：第40页（Q1）、第46页（Q2）、第48页（Q3）
- 跳过：重复页（42、44）、答题页（41、43、45、47、49）
- Q2包含表格数据（marginal utility table），需要手动处理
- Q3包含图形（sugar market graph），需要裁剪
- Scoring Guidelines：第53-56页

## 答案提取
- 第52页：Multiple-Choice Answer Key（Q1-Q60答案）
- 格式：Question # / Key，两列布局

## 预估难度
- 高：D类矩阵（Q40）、跨页表格（Q31）
- 中：B类表格选项（Q18-19, Q45, Q48, Q56）、C类图形题（Q4, Q24, Q52）
- 低：A类纯文本（大部分题目）

## 注意事项
- **必须跳过第10-16页答题卡**，否则A/B/C/D/E气泡会被误识别为题目选项
- **必须跳过重复页和空白答题页**
- **Q31的跨页表格**需要确认脚本是否能正确合并，如果不能则手动处理
- 2012年PDF相对"干净"（无水印），比后续年份可能更容易处理
