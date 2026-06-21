# AP Question Bank — 开发工作流

> 最后更新：2026-06-21
> 适用项目：ap-question-bank (React 18 + Vite + GitHub Pages)

---

## 一、完整交付流水线

```
┌─────────────────────────────────────────────────────────────────────┐
│  数据变更（题库修改、OCR导入、新增题目）                                │
│  OR 代码变更（src/、vite config、构建脚本）                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ① 题库烟测（quiz-bank-smoke-test）                                  │
│     - 读取 subjects.json 动态适配题型                                 │
│     - Schema 验证、图片存在性、污染检测、选项重复                      │
│     - CRITICAL 必须清零后才能继续                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (数据变更时)
┌─────────────────────────────────────────────────────────────────────┐
│  ② 重建相似度索引（build_similarity_index.py）                        │
│     - python scripts/build_similarity_index.py --subject macro      │
│     - 生成 public/data/similarity_index.json（1.6MB）                │
│     - 生成 public/data/macro_question_bank_v4_with_embeddings.json    │
│     - 只有 similarity_index.json 参与前端构建（嵌入文件不打包）         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ③ 应用烟测（quiz-app-smoke-test）                                    │
│     - 静态逻辑测试（generateQuiz、generateMockExam）                   │
│     - 构建验证（vite build → dist/）                                  │
│     - 浏览器测试（页面加载、图片渲染、表格渲染、相似度索引加载）         │
│     - CRITICAL 必须清零后才能部署                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ④ Git 提交 + 推送 + GitHub Pages 部署                                 │
│     - git add -A && git commit -m "..."                                │
│     - git push origin main                                           │
│     - GitHub Actions 自动构建部署（约 1-2 分钟）                       │
│     - 验证：https://wuzehua2015-hash.github.io/ap-question-bank/    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 二、数据变更工作流

### 场景 A：新增/修改题目（手动编辑 JSON）

```bash
# 1. 编辑 public/data/macro_question_bank_v4.json

# 2. 运行题库烟测
python scripts/quiz-bank-smoke-test.py --subject macro
# 或触发 Kimi skill: "题库烟测"

# 3. 修复所有 CRITICAL 问题（参考烟测报告）
# - 选项重复 → 修正选项文本
# - 缺少 option_table_data → 补充表格数据
# - 图片缺失 → 添加图片或删除 image_paths

# 4. 重新运行烟测，确认 CRITICAL = 0

# 5. 重建相似度索引
python scripts/build_similarity_index.py --subject macro

# 6. 运行应用烟测
# 或触发 Kimi skill: "测试应用"

# 7. Git 提交
```

### 场景 B：OCR 批量导入新试卷

```bash
# 1. 运行 OCR 提取脚本（已有脚本在 scripts/ 目录）
# 2. 运行题库烟测（通常会报告大量问题）
# 3. 按报告优先级修复：
#    P0: 选项重复、缺少 option_table_data、图片缺失
#    P1: 文本污染、表格结构错误
#    P2: primary_unit 在 secondary_units 中重复
# 4. 确认 CRITICAL = 0 后重建相似度索引
# 5. 应用烟测 → 部署
```

### 场景 C：新增科目（如 AP Microeconomics）

```bash
# 1. 在 subjects.json 中添加新科目配置
#    {
#      "id": "micro",
#      "name": "AP Microeconomics",
#      "active": true,
#      "questionTypes": ["mcq", "frq"],
#      "dataFiles": { "mcq": "micro_question_bank.json", "frq": "micro_frq_bank.json" }
#    }

# 2. 准备数据文件 public/data/micro_question_bank.json
# 3. 准备 FRQ 数据文件 public/data/micro_frq_bank.json
# 4. 运行题库烟测（自动检测新科目）
# 5. 修复 CRITICAL 问题
# 6. 重建相似度索引
# 7. 应用烟测 → 部署
```

---

## 三、前端代码变更工作流

### 场景 D：修改组件/页面/样式

```bash
# 1. 修改 src/ 下的代码

# 2. 本地预览（可选）
npm run dev

# 3. 构建验证
npm run build

# 4. 运行应用烟测（不需要重建相似度索引，数据未变）
# 或触发 Kimi skill: "测试应用"

# 5. Git 提交 → 推送 → 部署
```

### 场景 E：修改相似度索引前端集成（SearchPage 显示相似题）

```bash
# 1. 修改 src/pages/SearchPage.jsx 或其他相关组件
# 2. 确保 similarity_index.json 在 vite 构建时被正确处理
#    - 检查 vite.config.js 中 publicDir 包含 public/data/
# 3. 构建验证
# 4. 应用烟测（特别关注 Similarity Index 测试）
# 5. Git 提交 → 推送 → 部署
```

---

## 四、关键文件清单

| 文件 | 作用 | 变更触发重建 |
|------|------|------------|
| `public/data/subjects.json` | 科目配置中心 | 是（影响所有科目） |
| `public/data/macro_question_bank_v4.json` | MCQ 数据 | 是 |
| `public/data/macro_frq_bank.json` | FRQ 数据 | 否（FRQ 不参与相似度） |
| `public/data/similarity_index.json` | 相似度索引 | 自动生成 |
| `public/images/` | 图片资产 | 否（仅影响图片渲染测试） |
| `scripts/build_similarity_index.py` | 相似度索引构建脚本 | 否 |
| `src/` | 前端代码 | 否（只需应用烟测） |
| `vite.config.js` | 构建配置 | 否（需应用烟测） |

---

## 五、烟测触发方式

| 烟测类型 | 触发词 | 工具 |
|---------|--------|------|
| 题库烟测 | "题库烟测" / "数据质量检查" / "OCR后检查" | Kimi Skill `quiz-bank-smoke-test` |
| 应用烟测 | "测试应用" / "测试前端" / "验证前端" | Kimi Skill `quiz-app-smoke-test` |

---

## 六、已知限制与注意事项

1. **图片空白检测阈值**：小表格在白色背景上（如 2012_Q26）的 non-white 比例约 2-3%，已将"空白"阈值从 5% 收紧到 0.5%
2. **mixed_table 误报**：SRAS1/AD2 等经济学曲线标签被误报为污染，已移除该规则
3. **选项过短误报**：计算题的数值/百分比选项（如 "3%"、"0.2"）已豁免
4. **similarity_index.json 大小**：1.6MB，GitHub Pages 完全支持，但未来多科目时可能需要分科目加载
5. **构建脚本依赖**：`build_similarity_index.py` 需要 `sentence-transformers` + `torch`，首次运行需安装（约 5 分钟）

---

## 七、Git 提交规范

```
feat: 添加/修改题目数据
fix: 修复数据质量问题（如选项重复、表格缺失）
chore: 重建相似度索引
refactor: 重构前端代码
style: 样式调整（不影响功能）
```
