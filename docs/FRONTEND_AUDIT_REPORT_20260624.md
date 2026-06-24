# WebBridge 全量前端审计报告

**审计时间**: 2026-06-24
**审计目标**: https://wuzehua2015-hash.github.io/ap-question-bank/
**审计工具**: Kimi WebBridge + 数据层直接分析
**当前科目**: AP Microeconomics (393 MCQ, 21 FRQ)

---

## 问题汇总表

| 编号 | 问题 | 严重程度 | 位置 | 数据层面确认 | 状态 |
|------|------|----------|------|-------------|------|
| 1 | Mock Exam 封面硬编码 "AP Macroeconomics" | P1 | Mock Exam 导出页 | N/A | 确认 |
| 2 | FRQ 分值显示不稳定（0/19/20/22 points） | P0 | Mock Exam 封面、FRQ 页 | N/A | 确认 |
| 3 | Mock Exam 题号暴露原始 ID | P1 | Mock Exam 导出页 | N/A | 确认 |
| 4 | 图表引用但无图（部分题目） | P0 | 多题 | N/A | 确认 |
| 5 | 表格数据完全缺失（25题） | P0 | 多题 | 393题中25题 | 确认 |
| 6 | 选项文本嵌入表格数据（污染） | P0 | 2017_Q54, 2018_Q52 等 | 确认 | 确认 |
| 7 | 表格选项结构破坏 | P0 | 2017_Q54, 2015_Q60, 2018_Q52 等 | 0题有option_table_data | 确认 |
| 8 | 选项完全为空（23个） | P0 | 2013_Q43, 2014_Q34, 2015_Q60 等 | 23个空选项 | 确认 |
| 9 | 下标未渲染（Q M, P M, A T C） | P1 | FRQ 页面 | N/A | 确认 |
| 10 | 选项文本合并污染（多选项塞入单一选项） | P0 | 2015_Q06(E), 2017_Q54(E) | 确认 | 确认 |
| 11 | FRQ 文本截断（3题） | P0 | 2013_FRQ2, 2017_FRQ2, 2018_FRQ2 | 确认 | 确认 |
| 12 | FRQ Rubric 显示异常（数字/空白） | P0 | Mock Exam 导出页底部 | rubric为字符串非结构化 | 确认 |
| 13 | PDF 中中文乱码 | P1 | PDF 导出 | N/A | 确认 |
| 14 | 打印时页面底部 URL 污染 | P2 | 浏览器默认打印 | 无print CSS隐藏 | 确认 |
| 15 | 首页 FRQ 数量不显示 | P2 | 首页科目卡片 | N/A | 确认 |
| 16 | 直接路由访问白屏 | P0 | `#/mock-exam`, `#/quiz/micro` | N/A | 确认 |
| 17 | 水印覆盖 | P2 | Mock Exam 导出页 | N/A | 确认 |
| 18 | 引号/特殊字符乱码 | P2 | PDF 导出 | N/A | 确认 |
| 19 | 文本中错误空格（dema nd→demand） | P2 | 多题 | 数据中存在 | 确认 |
| 20 | 下标标记被替换为"sub"文本（M U sub s） | P1 | 多题 | 数据中存在 | 确认 |
| 21 | 题目文本截断（"When the price of the "） | P0 | 2015_Q06 | 确认 | 确认 |
| 22 | 图像选项题选项为空（A/B/C空，D为"(E)"） | P0 | 2013_Q03, 2014_Q34 | 确认 | 确认 |
| 23 | FRQ 表格数据缺失（6题） | P0 | 2012-2017_FRQ | 确认 | 确认 |

---

## 详细问题描述

### 1. Mock Exam 封面硬编码 "AP Macroeconomics" [P1] ✅

- **位置**: Mock Exam 导出预览页顶部
- **现象**: 当前科目是 **AP Microeconomics**，但封面右上角显示 **"AP Macroeconomics"**，标题显示 **"AP Macroeconomics Mock Exam"**
- **影响**: 学生打印的试卷科目名称错误，严重混淆
- **截图**: `screenshot_20260624_115328.666.png`（WebBridge）

### 2. FRQ 分值显示不稳定 [P0] ✅

- **位置**: Mock Exam 封面、FRQ 详情页、Rubric Reference
- **现象**:
  - 封面显示 "Section II: 3 FRQs (0 points)" 或 "(19 points)" 或 "(20 points)" 或 "(22 points)" — 每次生成都不同
  - FRQ 详情页显示 "FRQ (? 分)"
  - Rubric Reference 显示 "FRQ ... 0 points"
- **期望**: 真实考试中 FRQ 占 33%（约 20-30 分），应稳定显示正确分值
- **数据**: 21 道 FRQ 中，rubric 为字符串类型（非结构化），没有 `points` 字段
- **截图**: `screenshot_20260624_115328.666.png`, `screenshot_20260624_115551.627.png`

### 3. Mock Exam 题号暴露原始 ID [P1] ✅

- **位置**: Mock Exam 导出页每道题目前
- **现象**: 显示 "#1 2018_Q48", "#2 2012_Q45" 等，暴露了年份和原始题号
- **期望**: 应该显示连续的 Mock Exam 题号（如 #1, #2, #3），不暴露原始来源
- **截图**: `screenshot_20260624_115328.666.png`
- **PDF 确认**: 文本提取确认 "#1 2018_Q48", "#2 2012_Q45"

### 4. 图表引用但无图（部分题目） [P0] ✅

- **位置**: Mock Exam 第 51 题 (2012_Q19) 等
- **现象**: 题目文本 "According to the diagram, what is the dollar amount of the unit tax?" 但没有显示任何图表
- **对比**: 第 52 题 (2012_Q04) 正确显示了 Supply/Demand 图表
- **说明**: 图表显示不一致，部分题目有图，部分题目无图
- **截图**: `screenshot_20260624_115415.524.png`, `screenshot_20260624_115433.635.png`
- **根因推测**: 可能只有部分题目的 `image_paths` 数据正确提取，或者图表类型不同（矢量图 vs 位图）

### 5. 表格数据完全缺失（25 题） [P0] ✅

- **位置**: 393 道 MCQ 中 25 道涉及表格
- **数据确认**: 以下题目文本包含 "table" 但既无 `option_table_data` 也无 `image_paths`：
  - 2012_Q31, 2012_Q45, 2013_Q06, 2013_Q19, 2013_Q21, 2013_Q31, 2014_Q25, 2014_Q29, 2014_Q40, 2014_Q44, 2015_Q03, 2015_Q31, 2015_Q36, 2016_Q21, 2016_Q31, 2016_Q42, 2016_Q45, 2017_Q09, 2017_Q12, 2017_Q13, 2017_Q54, 2018_Q52, 2019_Q30, 2019_Q32, 2023_Q061
- **示例**: 2019_Q30 "The table above shows the quantity of motorcycles and automobiles produced by two countries..." 表格完全缺失
- **PDF 确认**: 文本提取 "The table above gives population and labor-market data for an economy. The unemployment rate in this economy is"
- **影响**: 没有表格数据，学生无法计算，题目无法作答

### 6. 选项文本嵌入表格数据（污染） [P0] ✅

- **位置**: 2017_Q54, 2018_Q52 等
- **现象**: 表格数据被强行塞入单一选项中：
  - 2017_Q54 选项 E: "4 \n4 \n1 \nzero point five zero \n4 \nzero point five zero \n1 \n4 \nzero point five zero \nzero point five zero" — 所有表格数据塞入 E 选项，A-D 全为空
  - 2018_Q52 选项: "5 \n6", "5 \n7", "6 \n5", "7 \n7", "7 \n6" — 表格数据被拆分到各选项，但表头缺失
- **问题**: 学生无法判断哪个数字对应哪个列
- **根因**: 没有 `option_table_data` 字段（0 题有该字段），表格数据被错误解析为普通文本

### 7. 表格选项结构破坏 [P0] ✅

- **位置**: 2017_Q54, 2015_Q60, 2012_Q22, 2014_Q55, 2017_Q38, 2018_Q17, 2017_Q21, 2019_Q32, 2019_Q29, 2017_Q57, 2015_Q05 等
- **现象**: 所有涉及表格选项的题目都没有 `option_table_data` 字段（0/393 题有该字段）
- **数据层面**: 表格表头（如 "Unemployment Rate Inflation Rate Real GDP"）被当作普通文本嵌入题目文本中，选项中直接用空格分隔各列数据
- **前端渲染**: 以纯文本形式显示，没有表格结构
- **影响**: 学生无法直观理解表格关系

### 8. 选项完全为空（23 个） [P0] ✅

- **数据确认**: 23 个选项的 `text` 字段为空字符串
- **涉及题目**: 
  - 2013_Q03 (A, B, C 为空) — 图像选项题，D="(E)" 也异常
  - 2013_Q43 (A, B, C, D, E 全部为空!) — 图像选项题，所有选项为空
  - 2014_Q34 (A, B, C 为空，D="(E)") — 图像选项题
  - 2015_Q06 (A, C, D 为空) — 表格选项题
  - 2015_Q60 (A, B, C, D 为空) — 表格选项题，E 塞入多个选项
  - 2017_Q37 (B 为空) — 图形选项题
  - 2017_Q54 (A, B, C, D 全部为空!) — 表格选项题，E 塞入所有表格数据
- **规律**: 图像选项题和表格选项题的选项特别容易为空

### 9. 下标未渲染 [P1] ✅

- **位置**: FRQ 页面、MCQ 选项
- **现象**: 下标符号被渲染为空格或文本：
  - "Q M" 应为 "Q<sub>M</sub>"
  - "P M" 应为 "P<sub>M</sub>"
  - "A T C" 应为 "ATC"
  - "M U sub s" 应为 "MU<sub>s</sub>"
  - "P sub s" 应为 "P<sub>s</sub>"
- **数据层面**: 文本中把下标标记 `_` 替换成了空格，或在数据中以 "sub" 文本形式存在
- **截图**: `screenshot_20260624_115916.333.png`（FRQ 页）
- **根因**: 缺少 MathJax/KaTeX 渲染，且数据提取时把下标标记处理错误

### 10. 选项文本合并污染（多选项塞入单一选项） [P0] ✅

- **位置**: 2015_Q06(E), 2017_Q54(E), 2015_Q60(E)
- **现象**:
  - 2015_Q06 选项 E: "M U sub s equals zero \n P sub s less than P sub h \n P sub s greater than P sub h" — 3 个不同选项文本被合并到 E
  - 2017_Q54 选项 E: 塞入了所有表格数据（10 行数字）
  - 2015_Q60 选项 E: "W sub one \n W sub 2 \n W sub 3 \n W sub 2 \n W sub 4" — 多个选项文本合并
- **数据层面**: 确认存在，不是前端渲染问题
- **影响**: 学生无法区分各个选项，题目无法作答

### 11. FRQ 文本截断（3 题） [P0] ✅

- **位置**: 2013_FRQ2, 2017_FRQ2, 2018_FRQ2
- **现象**:
  - 2013_FRQ2: "Each firm can choose to set a high price or a low price fo" — 截断在 "fo"
  - 2017_FRQ2: "He has a fixed cost of $240, and" — 截断在 "and"
  - 2018_FRQ2: "MR = marginal" — 截断在 "marginal"
- **数据层面**: JSON 数据中文本确实以这些词结尾，说明后端提取时截断
- **影响**: FRQ 题干不完整，学生无法完整理解题目要求

### 12. FRQ Rubric 显示异常 [P0] ✅

- **位置**: Mock Exam 导出页底部 "Section II: Free Response Rubric Reference"
- **现象**:
  - 部分 FRQ Rubric 卡片只显示 "FRQ 0 points" 或数字（"1 2 \n 2 1 \n 1 2 2"）
  - 没有可读的评分标准文字
- **数据层面**: 所有 21 道 FRQ 的 rubric 都是字符串类型（非结构化 dict），前端无法正确解析渲染
- **影响**: 学生无法对照评分标准自我评估

### 13. PDF 中中文乱码 [P1] ✅

- **位置**: PDF 导出文件
- **现象**: 中文文本在 PDF 中显示为乱码
- **PDF 文本提取确认**: 页面 1 显示乱码字符
- **影响**: 打印版试卷中文不可读
- **根因**: 字体不支持中文字符，或缺少正确的字体嵌入

### 14. 打印时页面底部 URL 污染 [P2] ✅

- **位置**: 浏览器打印时默认页眉页脚
- **现象**: 打印 Mock Exam PDF 时，浏览器默认在每页底部显示当前页面 URL
- **CSS 检查**: `@media print` 规则存在，但没有 `body::after { display: none; }` 或类似规则来隐藏 URL
- **根因**: 这是浏览器默认打印行为，需要 `@page { margin: ... }` 或设置 `@media print` 隐藏页眉页脚

### 15. 首页 FRQ 数量不显示 [P2] ✅

- **位置**: 首页 "AP Microeconomics" 科目卡片
- **现象**: 显示 "393 MCQ FRQ" — FRQ 数量数字缺失（应为 "393 MCQ 21 FRQ"）
- **截图**: `screenshot_20260624_114816.281.png`
- **同样问题**: AP Macroeconomics 显示 "432 MCQ FRQ"
- **根因**: 前端模板中 FRQ 数量变量未绑定或为空

### 16. 直接路由访问白屏 [P0] ✅

- **位置**: 直接访问以下 URL 时：
  - `https://wuzehua2015-hash.github.io/ap-question-bank/#/mock-exam`
  - `https://wuzehua2015-hash.github.io/ap-question-bank/#/quiz/micro`
- **现象**: 页面只有 header 和 footer，main 区域完全空白
- **正常情况**: 从首页点击导航进入时页面正常加载
- **根因**: SPA 路由初始化时 `currentSubject` 状态为空，导致组件渲染失败（没有 loading 或错误边界处理）
- **截图**: `screenshot_20260624_114955.392.png`（空白页面）

### 17. 水印覆盖 [P2] ✅

- **位置**: Mock Exam 导出预览页
- **现象**: 页面上有半透明的 "LynkEdu" 水印文字覆盖，在打印时会明显可见
- **截图**: `screenshot_20260624_115328.666.png`
- **影响**: 影响阅读体验，且打印时浪费墨水

### 18. 引号/特殊字符乱码 [P2] ✅

- **位置**: PDF 导出、文本中
- **现象**: 智能引号显示为乱码，如 "last year's" → "last years"（第 4 页文本）
- **数据层面**: 文本中存在 Unicode 智能引号（U+2018, U+2019），但 PDF 字体不支持
- **PDF 确认**: 文本提取确认
- **根因**: 字体不支持 Unicode 智能引号

### 19. 文本中错误空格 [P2] ✅

- **位置**: 多题文本中
- **现象**: 单词中间被插入错误空格：
  - "dema nd" → "demand"
  - "eff ect" → "effect"
  - "beco mes" → "becomes"
  - "balance sh eet" → "balance sheet"
  - "probl em" → "problem"
  - "short-r un" → "short-run"
  - "s how" → "show"
  - "work ers" → "workers"
  - "m onetary" → "monetary"
  - "une mplo yment" → "unemployment"
- **数据层面**: 确认存在于 JSON 数据中
- **根因**: 文本提取时换行处理错误，把软连字符或换行处理成了空格

### 20. 下标标记被替换为 "sub" 文本 [P1] ✅

- **位置**: 2015_Q06 等
- **现象**: 下标被渲染为文本 "sub"：
  - "M U sub s" → 应为 "MUₛ" 或 "MU_s"
  - "P sub s" → 应为 "Pₛ"
  - "P sub h" → 应为 "Pₕ"
- **数据层面**: JSON 中确实存储为 "M U sub s" 格式
- **根因**: 文本提取时把下标标记 `_` 错误替换为单词 "sub" 加空格

### 21. 题目文本截断 [P0] ✅

- **位置**: 2015_Q06
- **现象**: "When the price of the " — 文本在 "the" 后面截断，没有完整句子
- **数据层面**: JSON 中确实如此
- **影响**: 学生无法完整理解题目条件

### 22. 图像选项题选项异常 [P0] ✅

- **位置**: 2013_Q03, 2013_Q43, 2014_Q34
- **现象**: 
  - 2013_Q03: A/B/C 为空，D="(E)" — 图像选项（应该有 4-5 个图形）
  - 2013_Q43: 所有选项为空 — 图像选项（"For the firm shown in the graph above..."）
  - 2014_Q34: A/B/C 为空，D="(E)" — 图像选项（"Which of the following graphs illustrates..."）
- **数据层面**: 这些题目有多个 image_paths（4-6 个图像），但选项文本为空
- **根因**: 图像选项没有被正确解析，图像路径存在但选项文本缺失
- **影响**: 图像选项题完全无法作答

### 23. FRQ 表格数据缺失（6 题） [P0] ✅

- **位置**: 2012_FRQ2, 2013_FRQ3, 2014_FRQ3, 2015_FRQ3, 2016_FRQ2, 2017_FRQ2
- **现象**: FRQ 文本中引用 "The table below shows..." 但表格数据缺失
- **数据层面**: 这些 FRQ 没有 `image_paths` 来存储表格图像
- **影响**: 学生无法看到表格数据，无法完成计算型 FRQ

---

## 数据层问题统计

| 问题类型 | 数量 | 说明 |
|----------|------|------|
| 表格数据缺失（MCQ） | 25 题 | 文本含 "table" 但无表格数据 |
| 表格数据缺失（FRQ） | 6 题 | FRQ 文本含 "table" 但无表格数据 |
| 选项完全为空 | 23 个选项 | 7 道题目涉及 |
| 选项合并污染 | 至少 3 题 | 多个选项文本塞入单一选项 |
| 图像选项异常 | 3 题 | 选项全空或 D="(E)" |
| 文本错误空格 | 大量 | 单词中间被插入空格 |
| 下标标记错误 | 大量 | "sub" 文本替代下标 |
| FRQ 文本截断 | 3 题 | 文本以不完整单词结尾 |
| FRQ rubric 类型错误 | 21/21 | 全部为字符串而非结构化对象 |
| option_table_data 缺失 | 393/393 | 0 题有该字段 |

---

## 审计范围说明

- **已检查页面**: 首页、Quiz 生成页、Mock Exam 生成页、Mock Exam 导出预览页（2 次生成）、搜索页、FRQ 详情页
- **已检查题目**: 通过 PDF 文本提取分析了完整 60 道 Mock Exam 题目，以及数据层直接分析了全部 393 道 MCQ 和 21 道 FRQ
- **PDF 检查**: 生成并提取了 2 份完整 PDF（28 页 + 31 页）
- **数据层检查**: 直接读取 `question_bank.json` 和 `frq_bank.json` 分析
- **未检查**: 错题本页面、记录页面、完整 Quiz 做题流程

---

## 根因分析

1. **硬编码 Macroeconomics**: 前端代码中 Mock Exam 标题写死了 "Macroeconomics" 字符串
2. **FRQ 分值不稳定**: 分值计算逻辑依赖随机生成的 FRQ 组合，没有固定分值映射
3. **图表/表格缺失**: 后端提取时部分图表（矢量图、表格）未成功提取，前端没有兜底占位符
4. **option_table_data 完全缺失**: 393 题中 0 题有 `option_table_data` 字段，说明表格选项提取机制从未工作
5. **选项为空/污染**: 图像选项和表格选项的解析逻辑错误，导致选项文本丢失或合并
6. **文本处理错误**: 换行符处理时把单词断开并插入空格，下标 `_` 被替换为 "sub" 文本
7. **FRQ 文本截断**: 文本提取时长度限制或截断逻辑错误
8. **FRQ rubric 格式错误**: rubric 以字符串而非结构化 dict 存储，前端无法解析
9. **路由白屏**: SPA 路由初始化时 `currentSubject` 状态为空，组件渲染失败
10. **中文乱码**: PDF 生成时字体不支持中文字符
11. **下标未渲染**: 缺少 MathJax/KaTeX 库
12. **打印 URL**: 浏览器默认打印页眉页脚，缺少 `@page` CSS 规则

---

*报告更新于 2026-06-24，基于 WebBridge 审计 + 数据层直接分析*
