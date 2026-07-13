# AP题库项目常见问题与维护清单

## 2026-07-13 当前权威部署说明

当前线上生产环境是 Cloudflare Pages 项目 `lynkedu-ap-question-bank`，自定义域名是 `lynkedu.com` 和 `www.lynkedu.com`。当前根域名部署要求 `vite.config.js` 使用 `base: '/'`。

当前生产发布可以通过本地构建产物直接上传：

```powershell
npm run build
npx wrangler pages deploy dist --project-name lynkedu-ap-question-bank --branch main
```

因此，GitHub 推送失败并不代表线上不会更新；只要 Wrangler 上传成功，Cloudflare Pages 就会发布新的 `dist` 资源。GitHub 仍然必须作为源码追踪目标补推，但不能再把“GitHub Pages 自动部署”当作当前生产事实。

每次网站功能或部署方式变更后，必须同步更新：

- `PROJECT_STATUS.md`
- `WORKLOG.md`
- `DECISIONS.md`
- `C:\Users\wuzeh\.codex\main-session\MEMORY.md`

旧文档中关于 GitHub Pages `base: '/ap-question-bank/'` 或 Vercel 的内容只作为历史排障参考；当前生产以本节为准。

> 本文档记录AP题库项目开发过程中遇到的所有问题，按类别分类，供后续新项目（微观经济学、其他学科）参考。
> 最后更新: 2026-06-25

---

## 一、部署与路径问题 ⚠️ 高频

### 1.1 Vite `base` 配置与部署平台不匹配

**问题描述**:
- Vite 配置 `base: '/ap-question-bank/'` 时，生产构建会在所有资源路径前加 `/ap-question-bank/` 前缀
- Vercel 部署在根路径下，导致 JS/CSS/图片全部 404
- 表现为：页面空白、图片不显示、控制台报404错误

**判断方法**:
```bash
# 检查 dist/index.html 中的路径
cat dist/index.html | grep "src="
# 如果看到 /ap-question-bank/assets/... 但部署在根路径，就会出问题
```

**解决方案**:
| 部署平台 | 路径类型 | base配置 |
|---------|---------|---------|
| Vercel (根路径) | `vercel.app/` | `base: '/'` |
| GitHub Pages | `user.github.io/repo-name/` | `base: '/repo-name/'` |
| 自定义域名根路径 | `domain.com/` | `base: '/'` |
| 自定义域名子路径 | `domain.com/app/` | `base: '/app/'` |

**检查清单**:
- [ ] 确认部署平台的实际访问URL
- [ ] 检查 `vite.config.js` 中 `base` 配置是否匹配
- [ ] 构建后检查 `dist/index.html` 中的资源路径
- [ ] 部署后在浏览器 DevTools → Network 中确认无404

---

### 1.2 图片路径404

**问题描述**:
- 图片文件存在于 `public/images/` 目录
- 但网页中请求路径错误，导致图片不显示
- 可能被 `onError` 处理隐藏，表现为空白区域

**常见原因**:
1. `base` 配置不匹配（见1.1）
2. 使用了相对路径 `./images/...` 而不是绝对路径 `/images/...`
3. BASE_URL 拼接逻辑错误（如重复添加前缀）

**正确做法**:
```javascript
// JSON中存储绝对路径（不带base前缀）
"image_paths": ["/images/2016/2016_page18_img1.png"]

// 前端必须拼接BASE_URL（因为Vite base配置会影响资源路径）
const BASE_URL = import.meta.env.BASE_URL || '/'
<img src={path.startsWith('/') ? BASE_URL + path.slice(1) : path} />

// 示例：
// base='/' 时：/images/2016/... → /images/2016/...（不变）
// base='/ap-question-bank/' 时：/images/2016/... → /ap-question-bank/images/2016/...
```

**为什么必须拼接BASE_URL？**
- JSON中存储的路径是绝对路径（以 `/` 开头）
- 浏览器解析绝对路径时，始终以域名根为基准，**忽略 Vite 的 base 配置**
- 如果 Vite base 是 `/ap-question-bank/`，图片实际部署在 `/ap-question-bank/images/...`
- 但浏览器请求 `/images/...` 会指向 `domain.com/images/...`，导致 404
- **所有32道图片题都有这个问题**

**错误做法**:
```javascript
// 错误1：直接拼接BASE_URL + imagePath（会重复路径）
const path = `${BASE_URL}${imagePath}`  // 如果BASE_URL=/ap-question-bank/，结果是 /ap-question-bank//images/...

// 错误2：不拼接BASE_URL，直接使用JSON中的绝对路径
<img src={imagePath} />  // 当base≠/时图片404

// 错误3：使用相对路径 ./images/...
"image_paths": ["./images/2016/..."]  // 在HashRouter下会随URL变化，不稳定
```

**检查清单**:
- [ ] JSON中 `image_paths` 使用绝对路径 `/images/...`（不带base前缀，保持部署无关）
- [ ] 前端代码必须拼接 `BASE_URL`：`<img src={path.startsWith('/') ? BASE_URL + path.slice(1) : path} />`
- [ ] 开发时开启 `console.error` 在 `onError` 中，方便调试
- [ ] 部署后在 DevTools → Network 中检查图片请求状态（确认无404）
- [ ] 检查所有图片题（32道）是否正确显示
- [ ] 如果图片仍然不显示，检查 `vite.config.js` 中 `base` 配置是否匹配部署路径
- [ ] 如果图片仍然不显示，尝试在浏览器直接访问图片URL，确认路径正确
- [ ] **特别注意：如果 base 是 `/ap-question-bank/`，图片URL必须是 `/ap-question-bank/images/...`

---

## 二、图片裁剪问题 ⚠️ 高频

### 2.1 裁剪包含不该有的文字

**问题描述**:
- 从PDF提取的图片包含了题干文字、题号、选项等
- 导致网页上文字重复（JSON中有文字，图片中也有文字）

**正确标准**:
- 图表题：图片只包含图表/曲线本身（不含"The graph above shows..."等）
- 表格题：图片只包含表格（表头+数据行），不含题干和问题
- 所有图片：不含页码、"GO ON TO THE NEXT PAGE"等页面元素

**PDF页面定位方法**:
1. 先用 PyMuPDF 获取整页渲染图
2. 肉眼确认表格/图表的精确像素位置
3. 裁剪时只保留数据区域，不要包含上方/下方的文字
4. 裁剪后再次目视确认

**检查清单**:
- [ ] 提取后目视检查每个图片
- [ ] 确认图片中不含题干文字
- [ ] 确认图片中不含选项文字
- [ ] 确认图片中不含页码或页脚文字
- [ ] 表格题图片只包含表格数据，不含 "Which of the following..." 等

---

### 2.2 表格题图片不完整

**问题描述**:
- 图片裁剪太小，只包含部分表格行
- 或裁剪太大，包含多余内容

**常见PDF排版**:
- 单页两栏：左侧Q1-2，右侧Q3-4，表格可能在右侧或上方
- 单页一栏：表格可能居中，上方是题干，下方是选项
- 两题共享表格：表格在上方，Q1和Q2都引用同一个表格

**检查清单**:
- [ ] 确认表格完整（包含所有行和列）
- [ ] 确认表头完整（没有被截断）
- [ ] 确认数据行完整（没有漏行）
- [ ] 表格题注意：如果两题共享一个表格，只需提取一次，两个题引用同一张图片

---

### 2.3 图片尺寸与质量

**标准**:
- DPI: 150-200（足够清晰，文件大小合理）
- 宽度: 600-1200px（适配各种屏幕）
- 格式: PNG（无损，适合文字/线条图表）
- 文件大小: 一般 10-100KB，超过200KB需要检查是否过大

**检查清单**:
- [ ] 图片清晰度足够，数字和文字可辨认
- [ ] 文件大小不过大（影响加载速度）
- [ ] 图片没有被拉伸或变形

---

## 三、数据文本问题 ⚠️ 高频

### 3.1 表格数据混入题干文本

**问题描述**:
- PDF文本提取时，表格数据被当作普通文本提取
- 导致JSON中 `text` 字段包含表格数据，如:
  ```
  Country Computers Cars
  A 24 0
  0 12
  ```
- 网页上文字重复：JSON文本中有一套数据，图片中还有一套

**解决方案**:
- 手动清理：遍历所有包含 "table" 的题目，检查text中是否混入数据行
- 如果混入，手动重写 `text` 字段，只保留描述性文字
- 表格数据只保留在图片中

**检查清单**:
- [ ] 所有包含 "table" 的题目，检查text字段是否干净
- [ ] text字段只包含题干描述，不含表格数据
- [ ] 检查是否有数字和换行混合的异常文本

---

### 3.2 文本格式问题

**常见问题**:
- 换行过多（`\n` 被保留成多个换行）
- 选项和题干混在一起（A-E出现在text字段中）
- 缺少空格：如 "andquantity" 应该是 "and quantity"
- 特殊字符乱码

**检查清单**:
- [ ] 题干文本中不包含选项（A-E）
- [ ] 文本中单词间有空格
- [ ] 文本没有多余空行
- [ ] 文本没有乱码

---

### 3.3 缺失必要字段

**问题描述**:
- JSON中缺少 `answer` 字段
- 缺少 `correctAnswer` 字段（如果使用不同字段名）
- 缺少 `has_graph` 或 `image_paths` 字段
- **缺少 `option_table_data` 字段**：表格选项题没有结构化数据，导致选项渲染为纯文本（如 "Increase Increase"），学生无法判断列含义

**检查清单**:
- [ ] 所有题目都有 `answer` 字段（A-E之一）
- [ ] 有图表的题 `has_graph` 为 `true`
- [ ] 有图表的题 `image_paths` 非空且路径正确
- [ ] `question_id` 格式统一（如 `2016_Q01`）
- [ ] 无重复 `question_id`
- [ ] **表格选项题有 `option_table_data` 字段（包含 `headers` 和 `rows`）**
- [ ] 表格选项题有 `option_headers` 字段（备用渲染方式）

---

### 3.5 表格选项题（Table-Format Options）

**问题描述**:
AP考试中很多题目的选项是表格格式，有明确的列标题。例如：

```
M1        M2
(A) Increases   Decreases
(B) Increases   No change
```

但文本提取器会将这些表格的每行合并为纯文本：
```json
"A": "Increase Increase",
"B": "Increase Decrease"
```

学生无法判断每个词对应哪一列，严重影响理解。

**解决方案**:
在JSON中新增 `option_table_data` 字段，包含结构化的表头和每行数据：

```json
{
  "question_id": "2019_Q32",
  "text": "Fred Jones withdraws $1,000...",
  "options": {
    "A": "Increases | Decreases",
    "B": "Increases | No change",
    "C": "Decreases | No change",
    "D": "No change | Decreases",
    "E": "No change | No change"
  },
  "option_table_data": {
    "headers": ["M1", "M2"],
    "rows": {
      "A": ["Increases", "Decreases"],
      "B": ["Increases", "No change"],
      "C": ["Decreases", "No change"],
      "D": ["No change", "Decreases"],
      "E": ["No change", "No change"]
    }
  }
}
```

前端渲染时检测 `option_table_data`，以表格形式展示（带列标题）。

**表格选项识别方法**:
1. 所有选项长度一致（2-4个词）
2. 选项以"Increase/Decrease/No change/Indeterminate"等词汇为主
3. 平均词长度很短（<12字符）
4. 需要查看PDF确认实际列标题（M1/M2, Price/Quantity, Output/Price Level等）

**常见表格选项类型**:
| 列数 | 典型表头 | 年份示例 |
|------|---------|---------|
| 2列 | Price / Quantity | 2015_Q14, 2019_Q53 |
| 2列 | M1 / M2 | 2019_Q32 |
| 2列 | Output / Price Level | 2014_Q36, 2019_Q43 |
| 2列 | Bond Prices / Interest Rates | 2012_Q43 |
| 2列 | Real GDP / Price Level | 2018_Q41 |
| 2列 | Fiscal Policy / Monetary Policy | 2017_Q14 |
| 3列 | Money Supply / Interest Rate / Aggregate Demand | 2016_Q06 |
| 3列 | Reserves / Demand Deposits / Loans | 2015_Q13 |
| 3列 | Total Reserves / Money Multiplier / Money Supply | 2017_Q21 |

**检查清单**:
- [ ] 遍历所有选项，识别表格模式（2-4个短词，变化类词汇）
- [ ] 查看PDF原文确认列标题
- [ ] 为表格选项添加 `option_table_data` 字段
- [ ] 确认 `option_table_data.headers` 和 `rows` 的列数一致
- [ ] 前端支持表格渲染（带表头、可点击、颜色反馈）
- [ ] 测试表格选项的选中/正确/错误状态显示正常


**问题描述**:
- 使用 `text.includes('table')` 搜索时，"stable" 也会被匹配
- 导致没有表格的题被标记为表格题
- 产生不必要的图片提取工作

**正确做法**:
- 使用正则表达式匹配完整单词：`\btable\b`
- 或检查上下文：匹配 "table" 后确认附近是否有数字或表格结构
- 或人工复核所有匹配结果

**检查清单**:
- [ ] 字符串搜索使用整词匹配或上下文确认
- [ ] 手动抽查搜索结果，确认无假阳性

### 3.6 文本污染（多题文本串混）

**问题描述**:
PDF文本提取时，由于相邻题目之间没有明确分隔，导致下一个题目的文本混入当前题目，或当前题目选项被混入其他题目内容。表现为：
- 选项文本异常长（>120字符）且包含不相关词汇
- 选项中包含 "END OF"、"GO ON TO"、"BANK A"、"Production Point" 等页脚/表格文字
- 选项中包含其他题目的选项文字（如Q26的选项混入Q25的选项E中）

**常见污染模式**:
| 污染标志 | 说明 | 示例 |
|---------|------|------|
| `END OF` | 页面末尾文字 | 混入选项E |
| `GO ON TO THE NEXT PAGE` | 翻页提示 | 混入选项E |
| `BANK A` / `BANK B` | 下一个题目的表格 | 混入当前选项 |
| `Production Point` | 下一个题目的表格 | 混入当前选项 |
| `Year Nominal GDP` | 下一个题目的表格 | 混入当前选项 |
| `ANNUAL CONSUMER` | 下一个题目的表格 | 混入当前选项 |
| `SRAS1` / `AD1` | 图表题的文字标记 | 混入上一个选项E |
| `Item X was not scored` | 未计分题目标记（含任意编号） | 混入相邻选项 |
| `Unauthorized copying` | 版权页脚 | 混入文本和选项 |
| `PLACED YOUR AP NUMBER` | 考试说明 | 混入文本 |
| `MACROECONOMICS` / `Section I` | 考试标题 | 混入题干文本 |
| `Directions: Each of the questions` | 考试说明 | 混入题干文本 |
| `Time—70 minutes` | 考试时长 | 混入题干文本 |
| `fill in the corresponding circle` | 答题说明 | 混入题干文本 |
| `Answer Key` | 答案页 | 混入末尾题目 |

**特殊注意：Item scored 污染**

AP考试PDF中某些题目标记为 "Item X was not scored"（不计入成绩），这些文字在PDF中紧跟在相邻题目后面，极易混入。

| 实例 | 污染位置 | 正确内容 |
|------|---------|---------|
| `2015_Q21` E | `Decrease No change Item 22 was not scored.` | `Decrease No change` |
| `2015_Q42` E | `$4,500 Item 43 was not scored.` | `$4,500` |

**题干文本污染（之前完全遗漏！）**

除了选项污染，**题干文本**也可能被严重污染。例如 `2017_Q07` 的text混入了整段考试说明：
```
MACROECONOMICS 
Section I 
Time—70 minutes
60 Questions 
Directions: Each of the questions or incomplete statements below is followed by five suggested answers...
```

**自动检测脚本**（必须同时检查选项和题干）：
```javascript
const pollution_keywords = [
  // 选项污染关键词
  'END OF', 'GO ON TO', 'BANK A', 'Production Point', 'Year Nominal GDP',
  'ANNUAL CONSUMER', 'Item', 'was not scored', 'PLACED YOUR AP',
  'Unauthorized copying', 'BANK B', 'BANK C', 'Assets Liabilities',
  'GO ON T O THE NEXT PAGE', 'If you finish before time',
  // 题干污染关键词
  'MACROECONOMICS', 'Section I', 'Section II', 'Directions:',
  'Time—70', 'Time-70', 'fill in the corresponding',
  'Select the one that is best', 'Pencil required', 'Total Time:',
  'Calculator not', 'Writing Instrument', 'Reading Period',
  'Suggested Time', 'mark is erased', 'collect all materials',
  'Answer Key', 'AP NUMBER', 'AP Exam', 'Answer sheet'
];

for (const q of data) {
  // 检查选项
  for (const [key, val] of Object.entries(q.options || {})) {
    for (const kw of pollution_keywords) {
      if (val.includes(kw)) {
        console.log('OPTION POLLUTION:', q.question_id, key, 'contains', kw);
      }
    }
  }
  // 检查题干（重要！不能遗漏）
  for (const kw of pollution_keywords) {
    if (q.text.includes(kw)) {
      console.log('TEXT POLLUTION:', q.question_id, 'text contains', kw);
    }
  }
}
```

**手动检测方法**:
1. 检查所有选项长度 > 120 字符的选项
2. 检查选项末尾是否有句号+空格+大写字母开头（可能是下一个题目的文本）
3. 检查选项中是否有与题目无关的词汇
4. **检查题干文本末尾是否有多余空行+大写单词**（如 MACROECONOMICS、Section I）
5. **检查题干中是否混入考试说明**（Directions、Time—70 minutes等）

**修复方案**:
1. 查找PDF原文确认正确选项和题干
2. 用PDF文本定位精确内容，只保留当前题目的文本
3. 如果无法确认，从PDF中重新读取该题页面

**检查清单**:
- [ ] 运行自动检测脚本（**同时检查选项和题干**）
- [ ] 检查所有长度 > 120 的选项，确认是自然长文本还是污染
- [ ] 检查选项末尾是否有多余字符
- [ ] 特别检查每个选项E（污染最常出现在最后一个选项）
- [ ] **检查题干文本末尾是否有多余空行+大写标题**
- [ ] **检查题干中是否混入考试说明**（Directions、Time—70、Section I等）
- [ ] 确认无 "Item X was not scored" 残留（任意X）


### 4.1 构建目录 vs 源代码目录混淆

**问题描述**:
- `public/` 下的文件是部署文件（会被复制到dist）
- `dist/` 是构建输出（.gitignore中，不提交到Git）
- 修改了 `dist/data/` 但忘了修改 `public/data/`
- 提交后Vercel部署的还是旧文件

**正确做法**:
- 始终修改 `public/` 下的文件
- `dist/` 由Vercel自动构建，不要手动修改
- 提交前检查 `git status` 确认修改的文件在 `public/` 下

**检查清单**:
- [ ] 修改JSON时编辑 `public/data/` 下的文件
- [ ] 添加图片时放入 `public/images/` 目录
- [ ] 不手动修改 `dist/` 下的任何文件
- [ ] 提交前确认 `git status` 显示的文件在 `public/` 下

---

### 4.4 Git 提交遗漏（本次核心bug）

**问题描述**:
- 修复了 JSON 数据（添加 image_paths、表格选项、清理文本污染）
- 修改了前端代码（BASE_URL 拼接、表格渲染）
- 但忘记 `git commit` 和 `git push`
- Vercel 从 GitHub 拉取的是旧版本代码
- 导致线上部署仍然是旧数据，图片不显示、表格选项不渲染、文本污染仍存在

**本次遗漏的文件**:
- `public/data/macro_question_bank_v4.json`（1188行新增，包含 image_paths、option_table_data、文本清理）
- `src/components/QuestionCard.jsx`（BASE_URL 拼接修复、表格选项渲染）
- `PROJECT_MAINTENANCE_GUIDE.md`（维护文档更新）

**根本原因**:
- 修复了数据但没有提交到 Git
- Git 状态显示 `M`（修改未提交）
- Vercel 自动构建基于 GitHub 上的代码，不是本地文件

**正确做法**:
每次修改数据后必须执行：
```bash
git add public/data/macro_question_bank_v4.json src/components/QuestionCard.jsx
git commit -m "fix: add image_paths and table options"
git push
```

**检查清单**:
- [ ] 修改 JSON 后执行 `git status` 确认文件被标记为修改
- [ ] `git add` 所有修改的文件（包括 JSON、JSX、CSS）
- [ ] `git commit` 提交修改
- [ ] `git push` 推送到 GitHub
- [ ] 在 GitHub 仓库确认最新提交包含修改
- [ ] 等待 Vercel 自动构建完成（1-3分钟）
- [ ] 部署后测试验证

**验证命令**:
```bash
git status              # 查看未提交修改
git diff --stat         # 查看修改了多少行
git log --oneline -5    # 查看最近5次提交
```

---

### 4.5 .gitignore 导致文件遗漏

**问题描述**:
- `.gitignore` 中排除了 `dist/`，但图片也放在 `dist/` 导致不提交
- 或者某些图片格式被排除

**检查清单**:
- [ ] 确认图片在 `public/` 目录下，不在 `dist/`
- [ ] 确认 `.gitignore` 没有排除 `public/images/`
- [ ] 提交后确认 GitHub 仓库中包含图片文件

---

### 4.3 文件大小超限

**问题描述**:
- GitHub 对单个文件有100MB限制
- 大量图片文件可能导致仓库过大
- Vercel 部署也有大小限制

**建议**:
- 图片压缩：使用PNG优化工具（如TinyPNG）
- 合理DPI：150-200足够，不需要300+
- 总图片数控制在合理范围（当前2861张，约1.5GB，需注意）

---

## 五、前端渲染问题

### 5.1 图片加载失败自动隐藏

**问题描述**:
- 图片路径错误时，`onError` 事件触发 `display: none`
- 用户看不到任何错误提示，只看到空白区域
- 难以排查问题

**建议做法**:
- 开发时保留错误日志：
  ```jsx
  onError={e => { console.error('Image failed:', e.target.src); e.target.style.display = 'none' }}
  ```
- 生产环境可显示占位图或错误提示

**检查清单**:
- [ ] 开发时开启图片加载错误日志
- [ ] 部署后在 DevTools 检查是否有图片404

---

### 5.2 路由模式问题

**问题描述**:
- 使用 `BrowserRouter` 时，刷新页面可能404（Vercel需要配置rewrite）
- 使用 `HashRouter` 时，URL有 `#`，但不需要服务器配置

**建议**:
- 静态部署（Vercel/GitHub Pages）使用 `HashRouter`
- 如果需要 `BrowserRouter`，需要配置服务器rewrite规则

**检查清单**:
- [ ] 确认使用 HashRouter 或 BrowserRouter
- [ ] 如果使用 BrowserRouter，确认服务器rewrite规则

---

## 六、PDF处理问题

### 6.1 页面索引混淆

**问题描述**:
- PDF页面索引从0开始（PyMuPDF: `page(0)` 是第一页）
- 但用户看到PDF显示的是page 1
- 容易混淆导致裁剪到错误的页面

**检查清单**:
- [ ] 代码中使用 `page.load_page(index)` 时确认index从0开始
- [ ] 搜索文本时先确认找到的页面编号是否正确

---

### 6.2 坐标系理解

**问题描述**:
- PyMuPDF的坐标系原点(0,0)在左上角
- 裁剪时容易把上下左右搞反
- 使用相对比例（百分比）比绝对像素更安全

**建议**:
- 先渲染整页为图片，目视确认位置
- 使用相对坐标（x=0.5表示50%宽度处）
- 从大到小逐步缩小裁剪范围

---

## 七、品牌化硬编码问题 ⚠️

### 7.1 学科名称写死在代码中

**问题描述**:
- Footer、HomePage、index.html 中硬编码了 "AP Macroeconomics"
- 未来要支持 IB、Alevel 等学科时，需要到处修改

**正确做法**:
- 所有显示文本使用通用名称（如"智能题库"）
- 学科名称放入配置文件，不要写死在 JSX 中
- 版权信息也使用通用表述（"原出题机构"而不是"College Board"）

**检查清单**:
- [ ] Footer 中无硬编码学科名称
- [ ] HomePage 标题无硬编码学科名称
- [ ] index.html title 无硬编码学科名称
- [ ] 版权信息使用通用表述

---

## 七、网络与部署问题

### 7.1 Git推送失败

**常见原因**:
- 网络不稳定（中国大陆访问GitHub）
- 文件过大（大量图片导致timeout）
- 认证问题

**解决方案**:
- 重试 `git push`
- 减小单次提交的文件数量
- 使用代理或镜像

---

### 7.2 Vercel部署延迟

**问题描述**:
- Git推送后Vercel需要1-5分钟构建
- 用户立即刷新看到的是旧版本
- 新图片可能还没有同步到CDN

**建议**:
- 推送后等待2-3分钟再测试
- 在Vercel Dashboard查看Deployment状态
- 如果部署失败，查看Build Logs

---

## 八、新学科启动检查清单

启动新项目（如微观经济学、其他学科）时，按以下顺序检查:

### 第一阶段：数据准备
- [ ] 确认PDF文件完整且可读取
- [ ] 提取JSON时确认字段完整性（id, text, options, answer, unit, year）
- [ ] 检查文本是否有混入数据/格式问题
- [ ] 确认所有题有正确 answer
- [ ] 检查是否有重复 question_id

### 第二阶段：图片处理
- [ ] 识别所有含图表/表格的题（使用整词匹配，避免假阳性）
- [ ] 从PDF提取图片，使用整页预览确认位置
- [ ] 精确裁剪：只包含图表/表格，不含题干文字
- [ ] 检查图片清晰度（文字/数字可辨认）
- [ ] 检查文件大小（不过大）
- [ ] 在JSON中更新 `image_paths` 和 `has_graph`
- [ ] 目视检查每个图片确认质量

### 第三阶段：前端配置
- [ ] 确认 `vite.config.js` 中 `base` 匹配部署平台
- [ ] 确认路由使用 HashRouter（静态部署）
- [ ] 确认图片路径使用绝对路径 `/images/...`
- [ ] 添加图片加载错误日志（开发时）
- [ ] **确认无硬编码学科名称**（见第7节）

### 第四阶段：部署验证（每次提交后必须执行）
- [ ] 在 Vercel Dashboard 确认构建成功（无红色错误）
- [ ] 部署后等待 2-3 分钟再测试
- [ ] 在浏览器 DevTools → Network 中检查无 404
- [ ] **检查图片题**：打开任意有图片的题目，确认 "含图表" 标签显示且图片正确显示
- [ ] **检查表格选项题**：打开任意表格选项题，确认选项渲染为带表头的表格
- [ ] **检查文本污染**：检查题干末尾是否有多余空行/考试说明文字
- [ ] **检查答案**：提交一套 quiz，确认答案正确、成绩计算正确
- [ ] 检查 Footer/HomePage 无硬编码学科名称

---

## 九、问题排查速查表

| 症状 | 可能原因 | 排查方法 |
|------|---------|---------|
| 页面空白 | JS/CSS 404 | 检查 `base` 配置；检查 `dist/index.html` 路径 |
| 图片不显示 | 图片路径404 | DevTools → Network 检查图片请求；检查 `base` 配置；检查 `image_paths` |
| 图片区域空白 | 图片被 `onError` 隐藏 | 检查 `onError` 日志；确认图片文件存在 |
| 文字重复 | 题干包含表格数据 | 检查JSON中 `text` 字段是否混入数据 |
| 图片含文字 | 裁剪不精确 | 重新从PDF裁剪，只保留表格/图表区域 |
| 提交无反应 | JS错误 | DevTools → Console 查看错误日志 |
| 选项缺失 | JSON格式错误 | 检查 `options` 字段是否完整 |
| 答案错误 | 数据缺失 | 检查 `answer` 字段是否存在且正确 |

---

## 十、当前项目状态摘要

**项目**: AP Macroeconomics Question Bank
**最后更新**: 2026-06-18
**题库状态**:
- MCQ: 432题（8个年份：2012, 2014, 2015, 2016, 2017, 2018, 2019, 2023）
- FRQ: 30题
- 有图片的题: 39道（图表 + 表格）
- 图片缺失: 0道
- 表格选项题: 54道（含 `option_table_data`）

**已修复问题**:
1. ✅ Vite base配置（改为 `/` 匹配Vercel）
2. ✅ 2016_Q20缺失答案
3. ✅ 13道表格题图片提取
4. ✅ 表格题文本清理（移除嵌入的数据）
5. ✅ 表格题图片精确裁剪（移除题干文字）
6. ✅ 图片路径简化（移除BASE_URL拼接）→ **后又修复：必须拼接BASE_URL**
7. ✅ 移除硬编码学科名称（Footer、HomePage、title）
8. ✅ **54道表格选项结构化**（添加 `option_table_data` 含表头和行数据）
9. ✅ **文本污染清理**（27道FRQ text + 8道MCQ选项修复）
10. ✅ **前端表格选项渲染**（QuestionCard.jsx 支持表格布局）
11. ✅ **图片路径BASE_URL修复**（JSON存绝对路径，前端拼接BASE_URL）
12. ✅ **图像视觉审核**（39道图像全部检查，修复2个多余text裁剪）
13. ✅ **表格选项一致性**（修复2道题选项格式：2023_Q063/Q067）
14. ✅ **共用图像检查**（确认2组共用图像：2015_Q16/Q18, 2016_Q01/Q02）

**待确认问题**:
- ⏳ Vercel网站稳定访问（网络间歇性问题）
- ⏳ 图片在网页中正确显示（需部署后验证BASE_URL拼接是否生效）
- ⏳ 表格选项题在网页中正确渲染为表格（带表头）
- ⏳ FRQ评分细项显示（147条rubric criteria已去重，需验证渲染）

15. ✅ **题目搜索/筛选**（SearchPage.jsx：关键词搜索、单元/年份/难度/图表/表格/已做/错题筛选）
16. ✅ **错题本功能**（MistakeBook.jsx：记录错题、按单元筛选、练习错题、移除错题）
17. ✅ **答题历史统计**（HistoryPage.jsx：总览、单元正确率、难度正确率、最近套题记录）
19. ✅ **Mock Exam 计时系统**（Timer 组件 + MCQ 70min + FRQ 60min + 超时自动提交 + 过渡页面）
20. ✅ **FRQ 跳转 bug 修复**（清理 currentFRQ 残留）
21. ✅ **Mock Exam 白屏修复**（await generateMockExam）
22. ✅ **Table header 污染修复**（3 道题的表头文字从题干中移除）
23. ✅ **QuizSession 架构重构**（集中管理 sessionStorage + useSubject Hook）

**待确认问题**:
- ⏳ Vercel网站稳定访问（网络间歇性问题）
- ⏳ GitHub push 网络问题（中国大陆访问）

**待开发功能**:
1. ✅ 批改页成绩面板（ScorePage 已有：AP分数预估、单元正确率、PDF导出）
2. ✅ 错题回顾（MistakeBook 已实现）
3. ✅ PDF导出（ScorePage 已实现：html2pdf.js 导出完整成绩单）
4. ✅ 历史记录持久化（HistoryPage 已实现：localStorage 持久化 + 趋势分析）

---

## 十一、前端架构：QuizSession 状态管理（2026-06-22 新增）

### 11.1 问题：sessionStorage 分布式清理导致跨流程 bug

**问题描述**:
- `sessionStorage` 被多个入口点（ExamSetup、QuizSetup、MistakeBook、SearchPage、SimilarQuestionsBlock）直接读写
- 每次新增一个 key（如 `currentFRQ`），需要在 N 个入口点分别加 `removeItem('currentFRQ')`
- 典型 bug：先做 Mock Exam → 未做完 → 去 Search 练习变式 → 提交后错误跳转到 FRQ（因为 `currentFRQ` 残留）
- 修复方式是"在 5 个入口点分别加 removeItem"——这是打地鼠式修复，新加一个入口就会漏掉

**根本原因**:
- 没有生命周期所有权：谁负责创建 session，谁负责清理？
- 分布式清理：每个入口点都知道要清理哪些 key，但新入口点不知道
- 隐式状态机：`quizInfo` 在不同入口点的形状不一致（有的有 `isMock`，有的没有）

### 11.2 解决方案：QuizSession 集中管理器

**新建 `src/utils/quizSession.js`**：所有 quiz 相关的 sessionStorage 操作收归一处。

```javascript
// 启动 Mock Exam（自动清理所有旧状态）
startMockExam({
  mcq: result.quiz,
  frq: result.frq,
  config: { type: 'mock' },
  info: { mcqTimeLimit, frqTimeLimit },
})

// 启动普通 quiz
startQuiz({ questions, config, info })

// 启动错题练习
startWrongQuiz({ questions, config, info })

// 启动自定义 quiz（SearchPage / MistakeBook 单题）
startCustomQuiz({ questions, config, info })

// 启动相似题练习
startSimilarQuiz({ questions, config, info })

// 读取
const quiz = getCurrentQuiz()
const frq = getCurrentFRQ()
const info = getQuizInfo()
const answers = getMCQAnswers()

// 写入
setMCQAnswers(finalAnswers)

// 完全清理
clearQuizSession()
```

**关键设计**:
- `clearAll()` 在每次启动新 quiz 时自动执行，无需入口点手动清理
- `quizInfo` 由 `start*Quiz` 统一写入，保证 `mode` 和 `isMock` 字段始终存在
- 新入口点只需调用 `startXxxQuiz`，不需要知道有哪些 key 需要清理

### 11.3 解决方案：useSubject Hook

**新建 `src/hooks/useSubject.js`**：为后续多科目扩展预留接口。

```javascript
const { loadMCQ, loadFRQ, getMockConfig } = useSubject()
// 当前默认 'macro'，未来从 URL 参数或 React Context 读取
```

**为什么现在不做完整多科目？**
- 当前项目只有 macro 一个科目，完整多科目架构（Context + Router + Subject Switcher）是过度工程
- `useSubject` 作为**预留接口**，后续加科目时只需修改 Hook 内部实现，调用点不需要改

### 11.4 检查清单（必须遵守）

- [ ] 任何新入口点启动 quiz 时，**必须**使用 `startQuiz` / `startMockExam` / `startWrongQuiz` / `startCustomQuiz` / `startSimilarQuiz`
- [ ] 禁止在任何入口点直接写 `sessionStorage.setItem('currentQuiz', ...)`
- [ ] QuizPlayer / FRQPlayer 读取时**必须**使用 `getCurrentQuiz` / `getCurrentFRQ` / `getQuizInfo`
- [ ] 禁止在 QuizPlayer 中写 `sessionStorage.removeItem('currentFRQ')`（quizSession 已处理）
- [ ] pre-deploy-check 会自动验证以上规则

### 11.5 已知状态 key（quizSession 管理）

| key | 用途 | 写入者 | 读取者 |
|-----|------|--------|--------|
| currentQuiz | MCQ 题目数组 | start*Quiz | getCurrentQuiz → QuizPlayer |
| currentFRQ | FRQ 题目数组 | startMockExam | getCurrentFRQ → FRQPlayer |
| quizConfig | 配置（unit, count, type） | start*Quiz | 未使用（保留） |
| quizInfo | 元数据（mode, isMock, timeLimit） | start*Quiz | getQuizInfo → QuizPlayer/FRQPlayer |
| mcqAnswers | 用户答案 | setMCQAnswers | getMCQAnswers → ScorePage |

**不属于 quizSession 的 key**（各自独立管理）：
- `mock_mcq_timer` / `mock_frq_timer` → Timer 组件自身管理
- `frqScores` → FRQScorePage → ScorePage 传递（评分中间状态）
- `macro_doneQuestions` / `frqSubmissions` / `quizHistory` → localStorage 持久化数据

---

## 十二、pre-deploy-check 规则说明（2026-06-22 更新）

当前 pre-deploy-check 包含 5 项检查：

1. **Build check**: `dist/index.html` 存在
2. **Data files**: `dist/data/` 下 4 个必需文件存在
3. **Async audit**: 扫描所有 `src/` 下的 JS/JSX，检查 `async` 函数调用是否缺少 `await`（排除 `hooks/` 目录，因为 factory methods 返回 Promise 是设计意图）
4. **Session lifecycle audit**: 
   - 所有入口点必须 `import` 自 `quizSession`
   - 所有入口点禁止直接操作 `sessionStorage` 的 quiz 核心状态
   - QuizPlayer / FRQPlayer 必须使用 `getCurrentQuiz` / `getCurrentFRQ` 读取
   - QuizPlayer 禁止保留旧的 `removeItem('currentFRQ')` hack
   - **MockPdfPage 必须同时读取 `getCurrentQuiz` + `getCurrentFRQ`（不能漏 FRQ）**
   - **FRQDisplay.jsx 组件必须存在**
   - **App.jsx 必须包含 `/mock-pdf` 路由和 `MockPdfPage` 导入**
5. **Mock exam config**: subjects.json 中 mockExam 的单元分布加总等于 totalMCQ

**新增检查规则**（未来可扩展）：
- 检查 `getMockExamConfig` 是否传了参数（防止 `undefined` 错误）
- 检查 `quizInfo` 在所有入口点都有 `mode` 和 `isMock` 字段

## 十三、AP Macroeconomics 交付标准（2026-06-22 新增）

> 基于当前项目实际状态，定义"可以对外发布"的最低标准。
> 每次提交前必须逐项确认，不能跳过。

### 13.1 数据质量（通过 quiz-bank-smoke-test）

| 检查项 | 当前状态 | 标准 |
|--------|---------|------|
| MCQ 总数 | 432 题 | ≥ 432，不减少 |
| FRQ 总数 | 30 题 | ≥ 30，不减少 |
| 图片题 | 39 道 | 图片文件存在，无 0 字节 |
| 表格选项题 | 54 道 | 含 `option_table_data`（headers + rows） |
| 文本污染 | 0 CRITICAL | 无 MACROECONOMICS/Section I/Directions 等混入 |
| 表格 header 污染 | 0 | 题干末尾不含 `option_table_data.headers` 文字 |
| 重复 question_id | 0 | 无重复 |
| 选项缺失 answer | 0 | 每题都有有效 answer（A-E） |
| 共用图像引用 | 已确认 | 共用图像的题目已正确引用 |
| 图像空白/截断 | 0 | 无空白图像，无截断 |

**验证命令：**
```bash
node scripts/quiz-bank-smoke-test.js
# 或运行 Python 烟测脚本
```

### 13.2 功能完整性（所有入口点可正常启动）

| 入口点 | 操作路径 | 验证方法 |
|--------|---------|---------|
| 首页生成 Quiz | 首页 → 生成 Quiz | 能生成 10/20/30 题，进入 QuizPlayer |
| 单元练习 | 首页 → 选择单元 → 生成 | 按单元过滤正确，排除已做生效 |
| Mock Exam | 首页 → Mock Exam → 开始 | 60 道 MCQ + 3 道 FRQ，计时器正常 |
| 错题本练习 | 错题本 → 练习错题 | 只包含错题，进入 QuizPlayer |
| 单题重练 | 错题本 → 展开 → 重新练习 | 单题进入 QuizPlayer |
| 搜索练习 | 搜索 → 练习这 N 题 | 筛选结果正确进入 QuizPlayer |
| 相似题练习 | 搜索/错题本 → 相关变式 → 练习这组变式 | 原题 + 相似题进入 QuizPlayer |
| 提交成绩 | QuizPlayer → 提交 | 非 Mock 显示成绩、单元统计、相似题推荐 |
| FRQ 评分 | FRQPlayer → 完成 → 自评 → 进入成绩 | FRQ 细项评分 + 总分正确 |
| 历史记录 | 历史记录页 | 显示最近套题、单元趋势、难度趋势 |
| PDF 导出（Quiz） | QuizSetup → 导出 PDF | 生成纯 MCQ 试卷 PDF（含答案）
| PDF 导出（Mock） | Mock Exam → 导出完整试卷 | 生成 MCQ + FRQ 完整试卷 PDF（含答案 + Rubric） |

### 13.3 跨流程验证（状态泄漏 bug 检查）

> **这是最容易漏的 bug。** 必须按顺序手动测试以下流程：

| 测试编号 | 操作序列 | 预期结果 | 历史 bug |
|---------|---------|---------|---------|
| C1 | Mock Exam → 做 3 题 → 返回首页 → 生成 Quiz → 提交 | 提交后显示成绩，**不**跳转 FRQ | 曾经：currentFRQ 残留导致跳转 FRQ |
| C2 | 生成 Quiz → 提交 → Mock Exam → 提交 MCQ → 确认 → FRQ | FRQ 正常显示，有计时器 | 曾经：白屏（await 缺失） |
| C3 | Mock Exam → 超时（或手动提交 MCQ）→ 过渡页面 → 确认 | 进入 FRQ，计时器 60min 启动 | 曾经：直接跳转无过渡页面 |
| C4 | 搜索 → 练习一组变式 → 提交 | 提交后显示成绩，**不**跳转 FRQ | 曾经：currentFRQ 残留导致跳转 FRQ |
| C5 | 错题本 → 练习错题 → 提交 → 再做 Mock Exam | Mock Exam FRQ 正常显示 | 曾经：状态泄漏 |
| C6 | Mock Exam → 刷新页面（MCQ 中） | 计时器继续，不丢失进度 | 曾经：Timer 不持久化 |
| C7 | Mock Exam → 提交 MCQ → 刷新（过渡页面） | 仍显示过渡页面，不白屏 | 曾经：phase 状态丢失 |
| C8 | 任意 quiz → 用浏览器返回 → 再进入新 quiz | 新 quiz 状态干净，无旧数据 | 曾经：currentFRQ 残留 |

### 13.4 Mock Exam 专项验证

| 检查项 | 标准 | 验证方法 |
|--------|------|---------|
| MCQ 计时 | 70 分钟（4200 秒） | 进入 QuizPlayer 后右上角显示倒计时 |
| FRQ 计时 | 60 分钟（3600 秒） | 进入 FRQPlayer 后右上角显示倒计时 |
| 超时自动提交 | 计时结束自动提交 MCQ | 将计时器改短（如 5 秒）测试 |
| 超时跳转 FRQ | MCQ 超时后自动进入 FRQ | 同上 |
| 过渡页面 | 提交 MCQ 后显示确认页 | 有"确认进入 FRQ"按钮，非直接跳转 |
| 刷新恢复 | 刷新页面后计时器继续 | 不重置为 70 分钟 |
| 单元分布 | 60 题按官方占比 | U1:4, U2:9, U3:13, U4:12, U5:15, U6:7 |
| FRQ 同一年份 | 3 道来自同一年 | 查看 FRQ 题号年份是否一致 |
| 评分标准 | 每道 FRQ 有 rubric | FRQScorePage 显示评分细项 |
| 总分计算 | MCQ + FRQ = 正确数 + 自评分 | ScorePage 总分正确 |

### 13.5 代码检查（pre-deploy-check 必须全绿）

```bash
# 1. 构建
node node_modules/vite/bin/vite.js build

# 2. 运行检查
node scripts/pre-deploy-check.js
```

**必须全部通过：**
- [ ] Build check: dist/index.html 存在
- [ ] Data files: 4 个必需文件在 dist/data/
- [ ] Async audit: 无 suspicious async 调用
- [ ] Session lifecycle: 所有入口点 import quizSession，无直接 sessionStorage 操作
- [ ] Mock exam config: 单元分布加总 = 60

**如果任一检查失败，禁止提交。**

### 13.6 手动最终检查（推荐每次大更新后）

1. **清空 localStorage**（在 DevTools → Application → Local Storage → 清除）
2. 刷新页面，确认首页正常加载
3. 做一套完整 Mock Exam（从生成到成绩页）
4. 做一套普通 Quiz（从生成到成绩页）
5. 搜索一道题，练习相似变式，提交
6. 检查错题本是否有正确记录
7. 检查历史记录页是否有正确记录
8. 检查 ScorePage 的 PDF 导出是否正常

---

## 十四、Mock Exam PDF vs Quiz PDF 的架构分离（2026-06-25 新增）

### 14.1 问题：Mock 和 Quiz 共享同一套 PDF 生成逻辑

**问题描述**:
- `QuizPdfPage` 被所有入口共用（QuizSetup、MistakeBook、SearchPage、ExamSetup）
- 但 Mock Exam 的数据结构是 `{mcq, frq}`，而 Quiz 是 `{questions}`（纯 MCQ）
- 结果：`ExamSetup` 的 "导出 PDF" 按钮只能传 MCQ 给 `QuizPdfPage`，FRQ 被丢弃
- 按钮文字被迫写成 "导出 MCQ PDF"，但用户期望的是完整试卷

**技术债表现**:
- 若未来其他科目有不同 Mock 结构（如 2 道 FRQ 而非 3 道，或 FRQ 类型不同），当前架构无法扩展
- 每新增一个 PDF 需求，都要在 `QuizPdfPage` 里加 `if (isMock)` 分支——代码会迅速腐化

### 14.2 解决方案：两套独立页面 + 独立展示组件

**核心原则**：Mock Exam 和 Quiz 是两种独立的 session type，必须有独立的 PDF 页面。

```
src/pages/
├── QuizPdfPage.jsx    ← 纯 MCQ 试卷（Quiz / 错题 / 搜索 / 相似题）
├── MockPdfPage.jsx    ← MCQ + FRQ 完整试卷（Mock Exam 专用）

src/components/
├── QuestionDisplay.jsx  ← MCQ 纯展示（web / pdf 双模式）
├── FRQDisplay.jsx      ← FRQ 纯展示（web / pdf 双模式）
```

**路由分离**:
| 入口点 | 存储方式 | 路由 | 页面 |
|--------|---------|------|------|
| QuizSetup | `startQuiz({questions})` | `/quiz-pdf` | `QuizPdfPage` |
| MistakeBook | `startQuiz({questions})` | `/quiz-pdf` | `QuizPdfPage` |
| SearchPage | `startQuiz({questions})` | `/quiz-pdf` | `QuizPdfPage` |
| SimilarQuestions | `startQuiz({questions})` | `/quiz-pdf` | `QuizPdfPage` |
| ExamSetup | `startMockExam({mcq, frq})` | `/mock-pdf` | `MockPdfPage` |

**关键设计**:
- `MockPdfPage` 同时读取 `getCurrentQuiz()` + `getCurrentFRQ()` + `getQuizInfo()`
- `QuizPdfPage` 只读取 `getCurrentQuiz()`，不感知 FRQ 存在
- `FRQDisplay` 与 `QuestionDisplay` 是同级组件，各自独立渲染，不互相耦合

### 14.3 检查清单（必须遵守）

- [ ] Mock Exam 的 PDF 导出入口必须导航到 `/mock-pdf`，不是 `/quiz-pdf`
- [ ] Mock Exam 的 PDF 存储必须使用 `startMockExam({mcq, frq})`，不是 `startQuiz({questions})`
- [ ] `MockPdfPage` 必须同时读取 MCQ 和 FRQ 数据，渲染完整试卷
- [ ] `QuizPdfPage` 保持只处理 MCQ，不引入 `if (isMock)` 分支
- [ ] 新科目如需不同 Mock 结构（如不同数量 FRQ），只需修改 `MockPdfPage` 的渲染逻辑，不影响 `QuizPdfPage`
- [ ] pre-deploy-check 会自动验证 `/mock-pdf` 路由、`MockPdfPage` 存在、`FRQDisplay` 组件存在

---

## 十五、PDF 防截断统一标准（2026-06-25 新增）

### 15.1 问题：html2pdf.js 截断不一致

**问题描述**:
- MCQ 用 `className="pdf-avoid-break"` 保护整题，效果好（短内容，一页可放下）
- FRQ 也用同样的 `pdf-avoid-break` 保护整题，但 FRQ 内容太长（多道子问题），整题比一页还长
- html2pdf.js 的 `break-inside: avoid` 在元素比页面长时会**强制在内部截断**，导致子问题被拦腰切断
- 答案页 rubric 条目完全没有保护，每个条目被截断在任意位置（截图中 `b` 部分丢失）

**根因**: 没有区分"短内容"和"长内容"的保护策略。所有内容用同一种保护方式，导致长内容失效。

### 15.2 解决方案：Break Guard System（4 级保护层级）

**新建 `src/utils/pdfBreakGuard.js`**：定义 PDF 防截断统一标准。

```javascript
// 4 级保护层级
const BREAK_GUARD = {
  WHOLE_QUESTION: { breakInside: 'avoid' },  // 短内容：整题保护（MCQ）
  PARAGRAPH: { breakInside: 'avoid' },      // 段落：单个条目保护（rubric）
  BLOCK: { breakInside: 'avoid' },          // 内容块：子问题保护（FRQ）
  MEDIA: { breakInside: 'avoid' },           // 媒体：图片/表格保护
}
```

**使用策略**:

| 内容类型 | 长度 | 保护层级 | 说明 |
|---------|------|---------|------|
| MCQ 整题 | 短（1页内） | WHOLE_QUESTION | 父容器加 `break-inside: avoid` |
| FRQ 子问题 | 中（可能跨页） | BLOCK | 子问题标记行+后续行打包为一个块 |
| Rubric 条目 | 短（1行-2行） | PARAGRAPH | 每个条目独立保护 |
| 图片/表格 | 短 | MEDIA | 元素本身保护 |

**关键规则**:
- 长内容（FRQ）**不要**用 WHOLE_QUESTION（整题保护不可行）
- 长内容用 BLOCK 级别：每个子问题是一个块，块之间允许分页
- 不要在外层和内层同时加 `break-inside: avoid`（冲突）

### 15.3 复用工具：FRQ 文本解析

```javascript
// parseFRQBlocks: 将 FRQ 文本按子问题拆分为块
const blocks = parseFRQBlocks(text)
// 返回: [{type: 'preface', lines: [...]}, {type: 'subquestion', lines: [...]}, ...]

// isSubQuestionLine: 检测子问题标记 (a), (b), (i), (ii), (d)(i) 等
// isMainQuestionLine: 检测主问题标记 1., 2., 3. 等
```

**复用**: AP Microeconomics、IB Economics、任何有简答题的科目都可以直接使用 `parseFRQBlocks` + `BREAK_GUARD.BLOCK`。

### 15.4 检查清单（必须遵守）

- [ ] MCQ 用 `WHOLE_QUESTION`（整题保护）
- [ ] FRQ 用 `BLOCK`（子问题块保护），不用 `WHOLE_QUESTION`
- [ ] Rubric 条目用 `PARAGRAPH`（每个条目保护）
- [ ] 图片/表格用 `MEDIA`（元素保护）
- [ ] 不要同时在外层和内层加 `break-inside: avoid`
- [ ] 新科目复用 `pdfBreakGuard.js`，不重复造轮子

---

*本文档由 Kimi 维护。每次遇到新问题后应更新到本文档中。*

---

## 十七、Mock PDF 分段导出标准（2026-07-11 新增）

### 17.1 核心原则

Mock PDF 不能把整份长页面交给 `html2pdf.js` 自动分页。不同科目的 MCQ/FRQ 会包含长题干、图片、表格、代码块、评分细则等，整页截图式分页容易造成题目、答案、表格或评分项被页面边界切开。

`MockPdfPage` 必须使用分段导出：
- 封面/章节标题作为独立段落。
- 每道 MCQ 作为独立段落，顺排到当前页，放不下再进入下一页。
- 每道 FRQ 作为独立段落，并从新页开始；长 FRQ 可以自然跨页，但不能把多道 FRQ 挤在同一页。
- MCQ 答案页从新页开始。
- 每道 FRQ 评分参考从新页开始；评分项过长时允许延续到下一页。

### 17.2 实现约束

- 模考 PDF 使用 `exportToPdf(element, filename, { segmented: true })`。
- 可分页段落必须标记 `data-pdf-segment="true"`。
- 必须新起页的段落标记 `data-pdf-start-page="true"`。
- 不要在 FRQ 子块或评分子块上堆叠 `pdf-page-break`、`breakBefore`、`pageBreakBefore`、`pdf-avoid-break` 等多层分页控制；这会让导出库在长 DOM 中计算失败。
- `QuizPdfPage`、`ScorePage` 仍可使用普通 `html2pdf.js` 路径；Mock PDF 是独立产品路径。

### 17.3 验收要求

修改 PDF 相关代码后，必须真实下载一份 Mock PDF，并用 PyMuPDF 渲染全页缩略图检查：
- 文件不能是异常小文件或空白页。
- MCQ 题块、图片题、表格题、答案页不能有明显内容缺失。
- FRQ 每题必须从新页开始；长题允许延续，但页面边界不能斩断关键文字、表格或图片。
- 每道 FRQ 评分参考必须从新页开始。
- 至少用一个包含 FRQ、图表和表格的科目做验收；经济学、科学、数学、CSA/CSP 都可能暴露不同分页风险。

---

## 十六、单元分类错误与缺失图片（2026-06-22 新增）

### 16.1 问题：GDP/经济成长题被错分到 U1

**问题描述**:
- `2023_Q075`（Country X apples/bananas GDP 题）被标记为 `U1`，但实际是 `U2`
- `2017_Q05`（Economic growth measurement）被标记为 `U1`，但实际是 `U2`
- `2023_Q061`（Real GDP 比较）被标记为 `U1`，但实际是 `U2`
- `2017_Q09`（Real GDP 比较，2017 年版本）被标记为 `U3`，但实际是 `U2`
- 用户发现："U1 的知识点还做不了这个题"

**根本原因**:
- 单元分类算法把 "economy" 相关关键词都当作 U1（基础概念）
- 但 GDP、real GDP、nominal GDP、economic growth 都是 U2（经济指标）的内容
- 分类器没有区分 "基本经济概念"（U1）和 "经济指标"（U2）

**规则**:
| 关键词 | 正确单元 | 错误示例 |
|--------|---------|---------|
| GDP, real GDP, nominal GDP, gross domestic product | U2 | 不能分到 U1 |
| Economic growth, per capita real GDP | U2 | 不能分到 U1 |
| Business cycle, unemployment rate, inflation rate | U2 | 不能分到 U1 |
| Aggregate demand, aggregate supply, fiscal policy | U3 | 不能分到 U1/U2 |
| Money demand, money supply, monetary policy, central bank | U4 | 不能分到 U1/U2/U3 |
| Fiscal + monetary combination | U5 | 不能分到 U3/U4 |

**修复方法**:
1. 在 `quiz-bank-smoke-test` 中新增 `test_unit_misclassification` 测试
2. 在 `question-bank-builder` 的 `pre_audit_check` 中新增单元分类检查
3. 扫描所有 U1 题目，检查是否包含 U2/U3/U4 关键词
4. 扫描重复题目，确保不同副本的单元一致

**已修复题目**:
- `2023_Q075`: U1 → U2（添加缺失的 apples/bananas 表格图片）
- `2017_Q05`: U1 → U2
- `2023_Q061`: U1 → U2
- `2017_Q09`: U3 → U2

### 16.2 问题：题目提到表格但图片缺失

**问题描述**:
- `2023_Q075` 的题干包含 "The following table shows prices and quantities..."
- 但 `image_paths` 为空，导致表格没有显示
- 用户看到的是选项表格（Nominal GDP / Real GDP），但缺少题目中的数据表格（Apples/Bananas 价格和数量）

**根本原因**:
- 2019 年版本（`2019_Q08`）已有该表格图片，但 2023 年版本（`2023_Q075`）没有复制图片
- 数据导入时只复制了文本，没有复制图片路径

**修复方法**:
1. 从 2019 年 PDF 中提取表格图片（或复用 `2019_Q08` 的图片）
2. 保存为 `public/images/2023/2023_Q075_table.png`
3. 更新 `2023_Q075` 的 `image_paths` 和 `has_graph`

**检查清单**:
- [ ] 所有提到 "The following table shows" 的题目必须有 `image_paths`
- [ ] 重复题目（不同年份的相同题）必须同步图片和单元分类
- [ ] 在 `quiz-bank-smoke-test` 中检测重复题目的一致性

### 16.3 新增技术债记录

| 技术债 | 说明 | 优先级 |
|--------|------|--------|
| `option_table_data` 与 `image_paths` 并存 | 表格选项题同时用结构化数据和图片，需确认是否冗余 | 低 |
| 重复题目同步机制 | 2019_Q08 和 2023_Q075 是同一题的不同副本，需要手动同步 | 中 |
| 单元分类批量验证 | 当前依赖烟测，建议添加自动化分类验证脚本 | 中 |
| FRQ rubric 示例图提取 | 需要画图题的 rubric 中应包含参考图（从 Scoring Guidelines 提取） | 高 |
---

## Production Mock PDF Acceptance Addendum (2026-07-11)

- Final Mock PDF acceptance must run against the GitHub Pages production URL, not localhost or a local build preview.
- The tester must click the production page's "Download PDF" button and verify the actual downloaded file.
- Record the deployed JS bundle name, PDF filename, file size, page count, blank-page result, and PyMuPDF contact-sheet path.
- Mock PDF segmented export must expose browser-visible progress so a stalled segment can be identified by segment index and text.
- A single MCQ/FRQ/table/code segment must never leave the export stuck indefinitely. If DOM-to-canvas rendering times out, the export must fall back to a readable segment rendering instead of dropping content or blocking the whole PDF.
