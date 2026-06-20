# AP题库项目常见问题与维护清单

> 本文档记录AP题库项目开发过程中遇到的所有问题，按类别分类，供后续新项目（微观经济学、其他学科）参考。
> 最后更新: 2026-06-17

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

**待开发功能**:
1. 批改页成绩面板（分数、正确率、每题对错）
2. 错题回顾
3. PDF导出（部分实现：ScorePage有MathText + 图像显示）
4. 历史记录持久化

---

*本文档由 Kimi 维护。每次遇到新问题后应更新到本文档中。*
