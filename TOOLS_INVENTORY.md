# 工具清单 TOOLS_INVENTORY

> 本文件记录 `ap-question-bank` 项目中所有自建工具脚本，方便日后查找和复用。
> 每个工具包含：用途、路径、使用方式、已知局限。

---

## 1. precise_table_cropper.py — 通用PDF表格/图像精确裁剪器

**用途**：从PDF或图片中自动检测表格/图像区域，精确裁剪到仅包含目标内容（不包含前后问题文字）。可复用于任何科目的PDF表格/图像提取。

**路径**：`scripts/precise_table_cropper.py`

**依赖**：`opencv-python`, `numpy`, `Pillow`, `PyMuPDF` (可选，用于PDF渲染)

**使用方式**：

```bash
# 从PDF提取表格
python scripts/precise_table_cropper.py \
    --pdf "AP Micro 2012.pdf" --page 41 \
    --output public/images/micro/2012_Q18_table.png

# 对已有图片重新裁剪
python scripts/precise_table_cropper.py \
    --image "public/images/old_image.png" \
    --output "public/images/new_image.png"

# 批量处理目录
python scripts/precise_table_cropper.py \
    --batch-dir "public/images/raw/" \
    --output-dir "public/images/clean/"

# 去除水印（如TestDaily灰色水印）
python scripts/precise_table_cropper.py \
    --pdf "AP Micro 2012.pdf" --page 13 \
    --output clean_table.png \
    --remove-watermark
```

**算法原理**：
1. 水平线检测（形态学开运算 + 行最大连续白像素后备）
2. 水平线按距离分组，取最密集组作为目标区域
3. 垂直线检测，精确定位左右边界
4. 完整边框表格：用上下边框作为边界，排除问题文字
5. T-account表格：用垂直线终止点 + 文本密度确定底部
6. 可选水印去除：将亮度>200的像素设为白色

**已知局限**：
- T-account表格（无完整边框）的自动检测成功率约70%，复杂布局建议手动指定坐标
- 表格与问题文字之间无间隙时，可能无法完全排除问题文字
- 页面底部装饰线（如"GO ON TO THE NEXT PAGE"）可能被误检测为下边界

**在新Pipeline中的使用**：B/C/D类题（表格、图形、矩阵）裁剪为图片

---

## 2. remove_watermark.py — 水印去除工具

**用途**：去除PDF图片中的灰色水印（如TestDaily水印）或底部版权文字。

**路径**：`scripts/remove_watermark.py`

**使用方式**：

```bash
python scripts/remove_watermark.py input.png output.png
```

**算法原理**：
- 将亮度 > 200 的像素设为白色，去除灰色水印叠加层
- 适用于TestDaily等半透明灰色水印

**已知局限**：
- 对于底部文字水印，需结合OCR或模板匹配定位
- 可能对浅色文字内容造成误伤

---

## 3. data_validator.cjs — 数据完整性校验脚本

**用途**：自动检查 JSON 数据文件的完整性，包括必需字段、重复题号、图片存在性、pure_unit 一致性等。

**路径**：`scripts/data_validator.cjs`

**使用方式**：

```bash
# 检查默认路径
node scripts/data_validator.cjs

# 检查指定文件
node scripts/data_validator.cjs public/data/ap/microeconomics/question_bank.json
```

**检查项**：
- 必需字段（question_id, answer, primary_unit, text, options）
- 重复题号检测
- primary_unit 范围（从 classification_config.json 读取，不硬编码）
- pure_unit 与 secondary_units 一致性
- has_graph=true 时 image_paths 存在性
- image_paths 指向的文件是否存在且大小 > 1KB
- option_table_data 格式正确性

**需要补充的检查项（新Pipeline中）**：
- [ ] 空选项检查（P0）
- [ ] 文本污染检查（P0/P1）：页眉、页脚、alt-text残留
- [ ] 下标渲染检查（P1）："sub" 作为独立单词出现
- [ ] 题号完整性检查（P0）：缺失、重复、合并
- [ ] 选项截断检查（P1）：选项以 "and" / "the" / "of" 结尾
- [ ] 货币符号缺失检查（P2）
- [ ] 表格数据混入题干检查（P0）

---

## 4. image_validator.cjs — 图片完整性校验脚本

**用途**：自动检查被 JSON 数据引用的图片文件是否存在、大小是否合理。

**路径**：`scripts/image_validator.cjs`

**使用方式**：

```bash
# 检查所有被引用的图片
node scripts/image_validator.cjs

# 检查指定目录
node scripts/image_validator.cjs public/images
```

**特点**：只检查被 JSON 引用的图片，不检查未使用的图片文件。

---

## 5. env_probe.cjs + run_with_env.cjs — 环境探测工具

**用途**：探测并缓存 Node.js、Python 等工具的路径，解决 Bash PATH 与 Windows 系统 PATH 不一致的问题。

**路径**：`scripts/env_probe.cjs`, `scripts/run_with_env.cjs`

**使用方式**：

```bash
# 步骤1：探测环境（任何工作开始前必须执行）
node scripts/env_probe.cjs

# 步骤2：后续命令通过 run_with_env.cjs 执行
node scripts/run_with_env.cjs npm run build
node scripts/run_with_env.cjs node scripts/data_validator.cjs
```

**输出**：`scripts/env.json`（缓存的工具路径配置）

**关键规则**：
- 任何科目开始工作前，必须先运行 `node scripts/env_probe.cjs`
- 如果 `env.json` 不存在，后续命令应报错并提示运行 env_probe
- 不要将工具路径硬编码到任何脚本中

---

## 6. pre-deploy-check.js — 部署前检查

**用途**：部署前运行的一系列检查，包括数据验证、图像验证、构建测试等。

**路径**：`scripts/pre-deploy-check.js`

**使用方式**：

```bash
node scripts/pre-deploy-check.js
```

**检查项**：
- 数据完整性
- 图片存在性
- 构建是否成功

---

## 7. build_similarity_index.py — 相似题目索引构建

**用途**：基于题目文本和选项，构建相似度索引，用于"相似变式"功能。

**路径**：`scripts/build_similarity_index.py`

**使用方式**：

```bash
# 构建所有科目的索引
python scripts/build_similarity_index.py

# 构建指定科目
python scripts/build_similarity_index.py --subject micro
```

**在新Pipeline中的使用**：Phase 8（所有年份提取并审计完成后）

---

## 新Pipeline需要新增的工具（TODO）

| 工具名 | 用途 | 优先级 | 阶段 |
|--------|------|--------|------|
| `analyze_pdf_layout.py` | 输出PDF形态分析报告（题号格式、双栏边界、特殊题标记） | **高** | Phase 2 |
| `extract_year_text.py` | A类纯文本MCQ提取（可配置双栏参数） | **高** | Phase 3 |
| `check_question_completeness.py` | 检查某年份题号完整性（缺失/重复/合并） | **高** | Phase 4 |
| `check_empty_options.py` | 检查某年份空选项 | **高** | Phase 4 |
| `check_text_pollution.py` | 检查页眉/页脚/alt-text残留 | **高** | Phase 4 |
| `clean_subscripts.py` | 扫描并替换 `sub` 文本为正确下标格式 | **高** | Phase 6 |
| `check_rendering.py` | 前端渲染检查（启动dev server + 截图验证） | **中** | Phase 4 |

---

## 已废弃并删除的工具

以下工具已被删除，如需了解历史原因，查看 git history：

| 工具名 | 删除原因 |
|--------|----------|
| `rebuild_micro_v3.py` | 万能脚本，不同PDF格式差异导致大面积污染 |
| `rebuild_micro_v3.2.py` | 同上，补丁式修复无效 |
| `rebuild_micro_v2.py` | 同上 |
| `rebuild_micro_bank.py` | 同上 |
| `rebuild_subject.py` | 同上 |
| `extract_micro.py` | 一次性提取所有年份，无逐份审计 |
| `extract_frqs.py` | 同上 |
| `extract_frq_images.py` | 同上 |
| `parse_exams.py` | 同上 |
| `parse_2023_exams.py` | 同上 |
| `extract_2023_pdfs.py` | 同上 |
| `run_ocr.py` | OCR提取不可靠，已废弃 |
| `fix_frq_data.py` | 临时修复脚本，修修补补 |
| `fix_rebuild.py` | 同上 |
| `fix_classification.py` | 同上 |
| `final_classify_fix.py` | 同上 |
| `reclassify_micro.py` | 同上 |
| `reclassifier.py` | 同上 |
| `conservative_auditor.py` | 同上 |
| `exclusion_detector.py` | 同上 |
| `classify_micro.py` | 同上 |
| `classify_micro_v2.py` | 同上 |
| `apply_fixes.py` | 同上 |
| `apply_detailed_fixes.py` | 同上 |
| `apply_final_fixes.py` | 同上 |
| `apply_reclassification.py` | 同上 |
| `analyze_remaining.py` | 同上 |
| `debug_2018.py` | 临时调试脚本 |
| `extract_q6_spans.py` | 同上 |
| `extract_image_options.py` | 同上 |
| `fix_2013_q43.py` | 同上 |
| `fix_2015_q6.py` | 同上 |
| `fix_empty_options.py` | 同上 |
| `fix_v2_data.py` | 同上 |
| `test_2018_text.py` | 同上 |
| `test_col0.py` | 同上 |
| `build_micro_bank.py` | 旧版构建脚本，已废弃 |
| 所有 `2023_*` 临时OCR/JSON/txt文件 | 临时中间数据 |

---

## 技能维护状态（项目级）

以下 Skill 已安装到全局，供本项目使用：

| Skill | 路径 | 用途 | 状态 |
|-------|------|------|------|
| `quiz-bank-smoke-test` | `~/.kimi/daimon/skills/quiz-bank-smoke-test/` | 数据完整性验证（JSON + 图片） | 已更新至 v2 |
| `quiz-app-smoke-test` | `~/.kimi/daimon/skills/quiz-app-smoke-test/` | 前端功能手动验证清单 | 已更新至 v2 |
| `question-bank-builder` | `~/.kimi/daimon/skills/question-bank-builder/` | 题库建立完整流程 | 已更新至 v2 |
| `question-bank-audit` | `~/.kimi/daimon/skills/question-bank-audit/` | 题库质量审计 | 已更新至 v2 |
| `ap-question-bank-maintenance` | `~/.kimi/daimon/skills/ap-question-bank-maintenance/` | 项目维护指南 | 已更新至 v2 |

---

## 工具维护规范

1. **新增工具**：必须在本文档中登记，包含用途、路径、使用方式、已知局限
2. **修改工具**：如引入新的命令行参数或行为变更，同步更新本文档
3. **废弃工具**：标记为 `[DEPRECATED]`，说明替代方案，保留6个月后再删除
4. **依赖管理**：所有Python工具的依赖应在项目根目录的 `requirements.txt` 中声明
5. **Skill 管理**：全局 Skill 在 `~/.kimi/daimon/skills/` 中，项目级工具在 `scripts/` 中

---

*最后更新：2026-06-25*
（本次更新：删除35+个废弃脚本和临时文件，清理重复项，补充新Pipeline所需工具清单，修复TOOLS_INVENTORY内部矛盾）
