# AP Macroeconomics Question Bank — 历史交付文档

> 当前生产SSoT请以 `PROJECT_STATUS.md`、`docs/GLOBAL_QUESTION_BANK_SOP.md` 和 `docs/STUDENT_ACCOUNT_MVP_2026-07-12.md` 为准。本文是早期单科目/Vercel阶段记录，不代表当前16科Cloudflare Pages生产架构。

> 文档版本: v2.1 | 更新日期: 2026-06-17 | 维护者: 翎英教育

---

## 一、项目概述

**项目名称**: AP Macroeconomics Question Bank（AP宏观经济学题库系统）
**技术栈**: React + Vite + TailwindCSS + React Router
**当前生产部署平台**: Cloudflare Pages
**当前访问地址**: https://lynkedu.com

**核心功能**:
- 按单元（U1-U6）随机抽题练习（Quiz）
- 完整模拟考试（Mock Exam: 60道MCQ + 3道FRQ）
- 做题提交后显示成绩与正确率
- 本地记录做题历史

---

## 二、题库数据资产

### 2.1 MCQ 题库

| 年份 | 题数 | 备注 |
|------|------|------|
| 2012 | 60 | 含官方Practice Exam |
| 2014 | 59 | — |
| 2015 | 58 | — |
| 2016 | 60 | — |
| 2017 | 60 | — |
| 2018 | 58 | — |
| 2019 | 59 | — |
| **合计** | **414** | 覆盖7个考试年份 |

**单元分布**:
- U1（基本经济概念）: 25题
- U2（经济指标与经济周期）: 83题
- U3（国民收入与价格决定）: 120题
- U4（金融市场）: 95题
- U5（稳定政策）: 30题
- U6（开放经济）: 61题

### 2.2 FRQ 题库

- 存储于 `public/data/macro_frq_bank.json`
- 包含各年FRQ题目及评分标准（Rubric）
- Mock Exam 中随机抽取3道

### 2.3 数据格式

每道MCQ包含以下字段:
```json
{
  "question_id": "2012_Q01",
  "year": "2012",
  "text": "题干文本",
  "options": {"A": "选项A", "B": "选项B", ...},
  "answer": "B",
  "primary_unit": "U5",
  "secondary_units": ["U3"],
  "topics": ["national debt", "budget deficit"],
  "difficulty": "Medium",
  "has_graph": false,
  "image_paths": [],
  "source": "AP Macro 2012 Official Practice Exam",
  "requires_graph": false
}
```

---

## 三、图片资产状态

### 3.1 总体情况

| 类别 | 数量 | 状态 |
|------|------|------|
| 含图片的题 | 32道 | ✅ 已关联 |
| 表格题 | 13道 | ✅ 已重新提取（纯表格） |
| 图表题 | 19道 | ✅ 已验证 |
| 标记图表但缺失图片 | 0道 | ✅ 无遗漏 |

### 3.2 表格题清单（13道）

所有表格图片已重新从PDF精确裁剪，**仅包含表格本身**（表头+数据），不包含题干文字。

| 题号 | 年份 | 表格内容 | 图片路径 |
|------|------|----------|----------|
| 2012_Q26 | 2012 | 生产可能性（Country A/B） | `/images/2012/2012_Q26_table.png` |
| 2012_Q32 | 2012 | 国民经济数据（GDP计算） | `/images/2012/2012_Q32_table.png` |
| 2015_Q46 | 2015 | 小麦供需表 | `/images/2015/2015_Q46_table.png` |
| 2015_Q47 | 2015 | 消费者价格指数（CPI） | `/images/2015/2015_Q47_table.png` |
| 2016_Q04 | 2016 | 名义GDP与价格指数 | `/images/2016/2016_Q04_table.png` |
| 2016_Q13 | 2016 | 宏观经济数据（2013） | `/images/2016/2016_Q13_table.png` |
| 2016_Q16 | 2016 | XYZ银行T账户 | `/images/2016/2016_Q16_table.png` |
| 2016_Q20 | 2016 | 巴西/秘鲁咖啡与小麦劳动时间 | `/images/2016/2016_q20_table.png` |
| 2018_Q20 | 2018 | 商品X/Y价格与数量（CPI） | `/images/2018/2018_Q20_table.png` |
| 2018_Q46 | 2018 | 人口与劳动力数据 | `/images/2018/2018_Q46_table.png` |
| 2019_Q08 | 2019 | 苹果与香蕉价格/数量（GDP） | `/images/2019/2019_Q08_table.png` |
| 2019_Q30 | 2019 | 摩托车与汽车产量 | `/images/2019/2019_Q30_table.png` |
| 2019_Q44 | 2019 | 衬衫与椅子生产可能性 | `/images/2019/2019_Q44_table.png` |

### 3.3 图表题清单（19道）

图表题图片已提取自PDF，包含AD-AS曲线、PPC曲线、货币市场图等。图片路径按原命名规则存储于各年目录下。

---

## 四、修复记录

### 4.1 已修复问题

| 日期 | 问题 | 修复内容 |
|------|------|----------|
| 2026-06-17 | BASE_URL图片路径错误 | 修复 `import.meta.env.BASE_URL` 导致Vercel部署后图片404 |
| 2026-06-17 | 2016_Q20缺失答案 | 补充 `correctAnswer` 字段，清理题干中混入的选项文本 |
| 2026-06-17 | 表格题图片缺失 | 从PDF提取13道表格题图片，更新JSON `image_paths` |
| 2026-06-17 | 表格题图片含题干文字 | 重新精确裁剪，仅保留表格数据区域 |
| 2026-06-17 | 表格题文本嵌入数据 | 清理题干中混入的表格数据（如 "Country A 24 0" 等） |
| 2026-06-17 | 假阳性"table"匹配 | 排除 "stable" 等包含table子串但无表格的题 |

### 4.2 当前代码版本

- `main` 分支: `b02cb32`
- 关键提交:
  - `6662516` fix: add BASE_URL prefix to image paths
  - `d72b99f` fix: 2016_Q20 table image extraction + text cleanup
  - `48e2be7` fix: extract table images for 13 questions
  - `b02cb32` fix: clean table images (no question text) + clean question text

---

## 五、已知问题与待办

### 5.1 已知问题

1. **网站无法访问**（Vercel部署异常）
   - 状态: 待排查
   - 现象: 部分时段无法打开，或返回超时
   - 可能原因: Vercel网络连接不稳定，或项目配置需要检查
   - 建议: 登录 Vercel Dashboard 查看 Deployment 状态

2. **图片加载方式**
   - 当前使用 `HashRouter`，图片路径为绝对路径 `/images/...`
   - 在Vercel根路径部署下应正常工作，但需确认CDN缓存是否已刷新

### 5.2 待开发功能

| 优先级 | 功能 | 说明 |
|--------|------|------|
| P1 | 批改页成绩面板 | 提交后显示分数、正确率、每题对错 |
| P1 | 错题回顾 | 标记错题，支持后续复习 |
| P2 | PDF导出 | 导出做题记录为PDF |
| P2 | 历史记录 | 持久化存储做题历史（当前用localStorage） |
| P3 | 题目筛选增强 | 按年份/单元组合筛选 |

---

## 六、维护指南

### 6.1 文件结构

```
ap-question-bank/
├── public/
│   ├── data/
│   │   ├── macro_question_bank_v4.json   ← MCQ题库（主数据源）
│   │   └── macro_frq_bank.json           ← FRQ题库
│   └── images/
│       ├── 2012/                         ← 年份目录
│       ├── 2013/
│       ├── ...
│       └── 2019/
├── src/
│   ├── components/
│   │   ├── QuestionCard.jsx              ← 题目展示（含图片渲染）
│   │   └── QuizNavigator.jsx             ← 题号导航
│   ├── pages/
│   │   ├── HomePage.jsx                  ← 首页
│   │   ├── QuizSetup.jsx                 ← Quiz配置
│   │   ├── ExamSetup.jsx                 ← Mock Exam配置
│   │   └── QuizPlayer.jsx                ← 做题页面
│   ├── utils/
│   │   └── questionBank.js               ← 数据加载与筛选逻辑
│   ├── App.jsx                           ← 路由配置
│   └── main.jsx                          ← 入口（HashRouter）
├── vite.config.js                        ← Vite配置（base: /）
└── README.md                             ← 本文档
```

### 6.2 更新题库数据

1. 修改 `public/data/macro_question_bank_v4.json`
2. 如新增图片，放入 `public/images/{year}/` 目录
3. 在JSON中更新对应题的 `image_paths` 和 `has_graph`
4. 提交并推送GitHub，Vercel自动重新部署

### 6.3 添加新图片

- 图片格式: PNG（推荐）或 JPG
- 命名规则: `{year}_Q{题号}_table.png`（表格）或 `{year}_page{页码}_img{序号}.png`（图表）
- 尺寸建议: 宽度 600-800px，DPI 150-200
- 裁剪要求: **仅包含图表/表格本身**，不包含题干文字

### 6.4 本地测试

```bash
npm install
npm run dev          # 本地开发服务器 http://localhost:5173
npm run build        # 生产构建，输出到 dist/
```

### 6.5 部署

当前配置:
- Vercel 连接 GitHub 仓库，自动部署 `main` 分支
- `vite.config.js` 中 `base: '/'`（根路径部署）
- 无需额外服务器，纯静态站点

---

## 七、交付标准

### 7.1 数据完整性

- [x] 414道MCQ全部加载正常
- [x] 所有题都有 `answer` 字段
- [x] 所有标记 `has_graph=true` 的题都有对应的 `image_paths`
- [x] 图片文件在 `public/images/` 下存在且大小 > 1KB
- [x] 表格题图片仅包含表格数据，不含题干文字
- [x] 题干文本已清理，不包含嵌入的表格数据

### 7.2 功能可用性

- [x] 首页可正常访问
- [x] Quiz Setup 页面可配置单元和题数
- [x] Mock Exam Setup 可生成60道MCQ + 3道FRQ
- [x] 做题页面可翻题、选择答案
- [x] 提交后显示成绩
- [ ] 网站稳定访问（待确认）
- [ ] 图片正确显示（部署后验证）

### 7.3 数据质量

- [x] 无重复题号
- [x] 选项格式统一（A-E）
- [x] 年份/单元标注正确
- [x] 文本无乱码或截断

---

## 八、联系与备注

- **题库原始PDF**: 存放于 `D:/Lynk/翎英教育LynkEdu/教研系统/AP/题库系统/raw_pdfs/`
- **备份数据**: 原始完整题库JSON备份在 `教研系统/AP/题库系统/macro_question_bank_v4.json`
- **前端仓库**: https://github.com/wuzehua2015-hash/ap-question-bank

> ⚠️ **重要提示**: 如果后续需要从PDF重新提取图片，原始PDF文件必须保留。当前所有图片已基于PDF原始页面精确裁剪，任何PDF替换或修改都可能导致图片位置偏移。

---

*本文档由 Kimi 维护，每次重大更新后应同步更新版本号和日期。*
