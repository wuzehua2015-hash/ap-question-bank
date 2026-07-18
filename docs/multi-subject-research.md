# 多科目架构调研报告

> 针对 AP Question Bank 从单科目（Macro）扩展到多科目（Macro + Micro）的架构调研
> 
> 调研维度：部署环境、数据隔离、前端合理性、竞品方案
> 当前状态：历史研究文档。生产SSoT请以 `../PROJECT_STATUS.md` 和 `GLOBAL_QUESTION_BANK_SOP.md` 为准；当前线上部署为 Cloudflare Pages 根域名 + `BrowserRouter`，不再使用 GitHub Pages 子路径/HashRouter 方案。

---

## 一、部署环境调研：GitHub Pages 的约束

### 1.1 当前部署配置

- **部署平台**：GitHub Pages
- **访问地址**：`https://wuzehua2015-hash.github.io/ap-question-bank/`
- **Vite base**：`base: '/ap-question-bank/'`（正确，必须匹配仓库名）
- **路由方式**：`HashRouter`（正确，GitHub Pages 纯静态托管只能用它）

### 1.2 GitHub Pages 的关键约束

| 约束项 | 说明 | 对我们的影响 |
|--------|------|-----------|
| **纯静态托管** | 不支持服务器端路由重写 | 不能用 `BrowserRouter`，只能用 `HashRouter` |
| **子路径部署** | 地址是 `username.github.io/repo-name/` | `base` 必须设为 `/repo-name/`，否则 JS/CSS 404 |
| **无 404 处理** | 访问不存在的路径返回真正的 404 | 深层路由直接访问会白屏 |
| **#hash 路由** | `HashRouter` 用 `/#/path` 格式 | 切换路径时不会发请求到服务器，安全可靠 |

### 1.3 上次改造失败的根本原因

```
问题链：
1. 数据路径从 /data/question_bank_v4.json → /data/macro/question_bank_v4.json
2. 代码中 loadMCQBank() 默认参数改为 'macro'
3. 但 fetch 的 URL 没有加 base 路径前缀
4. 在 GitHub Pages 上，fetch('/data/macro/...') → 404
5. 应该是 fetch('/ap-question-bank/data/macro/...')
```

**结论：如果改文件路径，必须同步改所有 fetch 逻辑 + 图片路径，极易遗漏。**

---

## 二、数据隔离调研：localStorage 策略

### 2.1 竞品数据隔离方式

| 产品 | 隔离方式 | 多科目切换体验 |
|------|---------|-------------|
| **Anki** | 每个 Deck 独立数据库，切换 Deck 数据全隔离 | 主界面是 Deck 列表，点击即切换，无混淆 |
| **Quizlet** | Study Sets 按 Folder/Tag 组织，用户数据统一存储 | 用户主动选择 Set，数据自然隔离 |
| **Duolingo** | 每个 Course 独立进度，用户数据按 Course 前缀隔离 | 顶部旗帜切换，所有进度自动切换 |
| **Sestara** | 数据库表隔离：`subjects` 表 + `quiz_attempts` 表关联 | 课程选择后所有功能在该课程上下文下 |

### 2.2 我们的数据现状

当前存储的 key（单科目时代）：
```
doneQuestions        → 已做题目 ID 数组
wrongQuestions       → 错题 ID 数组
questionHistory      → 每道题的历史记录
quizHistory          → 测验历史
```

**问题：如果直接加前缀，旧数据会"丢失"（变成 macro 的，但用户看到的是空数据）。**

### 2.3 数据隔离方案对比

| 方案 | 实现方式 | 优点 | 缺点 |
|------|---------|------|------|
| **A. 科目前缀** | `macro_doneQuestions`, `micro_doneQuestions` | 彻底隔离，互不干扰 | 需要迁移旧数据，否则旧数据"丢失" |
| **B. 统一存储+科目字段** | 所有数据存一个对象，里面按科目分键 | 不用改 key 结构 | 查询复杂，容易数据膨胀 |
| **C. 每个科目独立 namespace** | 类似 Anki 的 Deck，完全隔离 | 最清晰 | 需要迁移旧数据 |

**推荐：方案 A（科目前缀）+ 自动迁移旧数据。**

迁移逻辑：
```js
// 首次加载时检查：如果存在旧 key 但没有前缀版本，自动迁移
if (localStorage.getItem('doneQuestions') && !localStorage.getItem('macro_doneQuestions')) {
  localStorage.setItem('macro_doneQuestions', localStorage.getItem('doneQuestions'))
}
```

---

## 三、前端合理性调研：路由与架构

### 3.1 上次改造的路由问题

```jsx
// 改造后的路由（有问题）
<Route path="/:subject" element={<SubjectLayout />}>
  <Route path="quiz" element={<QuizSetup />} />
  <Route path="exam" element={<ExamSetup />} />
  ...
</Route>
```

**问题：**
1. 路径变成 `/#/macro/quiz`，但用户从 `/#/quiz` 跳转时，需要手动替换路径
2. `SubjectLayout` 做路由守卫，如果 URL 没有 subject，跳转到 `/`
3. 切换科目时，需要把 `/#/macro/quiz` 改成 `/#/micro/quiz`，路径操作复杂
4. `useParams()` 在某些组件中拿不到 `subject`（因为不是嵌套路由的子组件）

### 3.2 路由方案对比

| 方案 | URL 示例 | 优点 | 缺点 |
|------|---------|------|------|
| **A. 嵌套路由（上次用的）** | `/#/macro/quiz` | 路径语义清晰 | 实现复杂，切换科目需手动替换路径 |
| **B. URL 参数** | `/#/quiz?subject=macro` | 不改路由结构，简单 | URL 不美观，刷新后参数保留 |
| **C. Context 状态（推荐）** | `/#/quiz` | 路由完全不变，最简单 | 刷新后需要重新选科目（可用 localStorage 记住） |
| **D. 首页选择后进入** | 首页选科目 → `/#/quiz` | 最自然，符合 Anki 模式 | 需要多一步操作 |

### 3.3 前端架构原则

根据调研，多科目前端应遵循以下原则：

1. **路由不动**：不要改变现有的 `/quiz`、`/exam` 等路由，保持 URL 简洁
2. **状态隔离**：用 React Context 或全局状态管理当前科目，不反映在 URL 中
3. **一键切换**：像 Duolingo 的旗帜一样，顶部有一个科目切换器，切换后所有数据自动刷新
4. **首页选择**：像 Anki 的 Deck 列表，首页显示科目卡片，点击进入该科目
5. **数据迁移**：自动将旧数据迁移到 `macro_` 前缀，用户无感知

---

## 四、竞品调研：多科目切换 UX

### 4.1 Anki（桌面/移动端）

**模式：Deck 列表 → 选择 Deck → 学习**

- **主界面**：Deck 列表，显示每个 Deck 的进度统计
- **切换方式**：点击 Deck 即可进入，无需确认
- **数据隔离**：每个 Deck 完全独立，进度、统计互不干扰
- **对我们的启示**：
  - 首页应该像 Anki 的 Deck 列表，显示科目卡片
  - 每个卡片显示该科目的进度（已做多少题、正确率等）
  - 点击科目卡片后进入该科目的功能菜单

### 4.2 Duolingo（语言学习）

**模式：顶部旗帜切换 → 所有功能在同一界面**

- **切换方式**：顶部旗帜/下拉菜单，点击切换语言
- **数据隔离**：每种语言的进度完全独立，但切换时界面不变
- **用户体验**：切换语言后，学习路径、进度、统计全部自动切换
- **对我们的启示**：
  - 顶部导航栏可以放一个科目切换器（下拉或旗帜）
  - 切换科目后，当前页面的数据自动刷新
  - 不需要跳转到新页面，用户体验更流畅

### 4.3 Quizlet（学习卡片）

**模式：Folder/Tag 组织 → 用户主动选择**

- **组织方式**：Study Sets 放在 Folders 中，用 Tags 标记科目
- **切换方式**：用户从 Folder 或搜索中选择 Set，没有全局"科目切换器"
- **对我们的启示**：
  - 如果科目很多，可以用 Folder 概念组织
  - 但我们目前只有 2-3 个科目，不需要 Folder，直接卡片列表即可

### 4.4 Khan Academy（课程学习）

**模式：左侧菜单 + 顶部课程切换**

- **切换方式**：左侧菜单选择课程，顶部显示当前课程
- **数据隔离**：每个课程独立进度，但可以在同一界面看到多个课程
- **对我们的启示**：
  - 首页可以展示多个科目，但每个科目有独立的入口
  - 不需要强制用户"先选一个科目"，可以同时看到所有科目进度

### 4.5 竞品对比总结

| 产品 | 切换方式 | 数据可见性 | 适合我们？ |
|------|---------|-----------|----------|
| **Anki** | 主界面选择 Deck | 只能看到一个 Deck 的数据 | ✅ 适合首页设计 |
| **Duolingo** | 顶部旗帜切换 | 切换后数据自动刷新 | ✅ 适合导航栏设计 |
| **Quizlet** | Folder/Tag 选择 | 需要主动选择 Set | ❌ 不适合（我们科目少） |
| **Khan Academy** | 左侧菜单 | 多个课程同时可见 | ❌ 不适合（太复杂） |

**最佳组合：Anki 的 Deck 列表（首页）+ Duolingo 的顶部切换器（导航栏）。**

---

## 五、上次改造的失败复盘

### 5.1 错误清单

| 错误 | 影响 | 如何避免 |
|------|------|---------|
| 改变数据文件路径（`data/` → `data/macro/`） | fetch 404，图片加载失败 | **不要改路径，在数据内部加 subject 字段** |
| 嵌套路由（`/:subject/quiz`） | 路由复杂，切换科目需手动替换路径 | **路由不变，用 Context 管理当前科目** |
| 使用 `window.location.href` 切换科目 | 破坏 HashRouter，页面白屏 | **用 `navigate()` 或只改 Context 状态** |
| 没有自动迁移旧数据 | 用户历史记录、错题全部"丢失" | **加迁移逻辑，首次加载自动迁移** |
| 改动范围过大（一次改所有文件） | 难以测试，bug 难以定位 | **增量改造，先改数据层，再改 UI 层** |
| 没有考虑 GitHub Pages 的 base 路径 | 资源文件 404 | **保持 base 不变，fetch 时动态拼接** |

### 5.2 核心教训

> **"不要为了解决一个问题而引入十个新问题。"**

多科目扩展应该是**增量改造**，而不是**推倒重来**：
- 保留现有路由（`/quiz`、`/exam` 等）
- 保留现有文件路径（`data/question_bank_v4.json`）
- 在数据内部增加 `subject` 字段，而不是按科目分目录
- 在 UI 层增加科目切换器，而不是改变路由结构
- 在存储层加科目前缀，而不是改变存储结构

---

## 六、推荐方案："Context + 科目前缀" 架构

### 6.1 核心思路

1. **数据层**：在 JSON 题目中增加 `subject` 字段，但文件路径不变
2. **存储层**：localStorage key 加科目前缀（`macro_doneQuestions`），自动迁移旧数据
3. **状态层**：React Context 管理当前科目，不反映在 URL 中
4. **UI 层**：
   - 首页：科目卡片列表（像 Anki 的 Deck 列表）
   - 导航栏：科目下拉切换器（像 Duolingo 的旗帜）
   - 功能页：所有现有页面不变，通过 Context 获取当前科目
5. **路由层**：完全不变，保持 `/quiz`、`/exam` 等

### 6.2 实现步骤（增量）

**步骤 1：数据层改造（低风险）**
- 在 `question_bank_v4.json` 的每道题中增加 `"subject": "macro"` 字段
- 新增 `micro_question_bank_v1.json`，同样包含 `subject` 字段
- 合并加载：加载时把两个文件的数据合并，按 `subject` 过滤

**步骤 2：存储层改造（中风险）**
- 封装 `storage.js`：所有读写函数增加 `subject` 参数
- 自动迁移：首次加载时检查旧 key，自动迁移到 `macro_` 前缀
- 旧数据保留：迁移后旧 key 不删除，用户随时可以回退

**步骤 3：状态层改造（低风险）**
- 新建 `SubjectContext`：提供 `currentSubject` 和 `setSubject`
- 初始化：从 localStorage 读取上次选择的科目，默认 `macro`
- 切换：修改 Context 状态，触发页面重新渲染

**步骤 4：UI 层改造（低风险）**
- 首页：显示科目卡片（Macro / Micro），点击设置当前科目并进入首页
- 导航栏：增加科目下拉切换器，切换后当前页面数据自动刷新
- 功能页：接入 `useSubject()`，根据当前科目加载对应数据

**步骤 5：测试与部署**
- 本地测试：验证科目切换、数据隔离、旧数据迁移
- 烟测：检查所有功能页在切换科目后正常工作
- 部署：推送到 GitHub，验证 GitHub Pages 正常

### 6.3 方案优点

| 优点 | 说明 |
|------|------|
| **路由不动** | `/quiz`、`/exam` 等完全不变，不会引入路由 bug |
| **文件路径不动** | `data/question_bank_v4.json` 保持原样，fetch 不会 404 |
| **旧数据不丢** | 自动迁移到 `macro_` 前缀，用户无感知 |
| **增量改造** | 每步可以独立测试，降低风险 |
| **用户体验好** | 像 Duolingo 一样，顶部切换科目，数据自动刷新 |
| **扩展性强** | 新增科目只需增加数据文件 + 配置，不用改代码 |

---

## 七、调研结论

1. **部署环境**：GitHub Pages 必须保持 `HashRouter` + `base: '/ap-question-bank/'`，不要改变
2. **数据隔离**：用科目前缀（`macro_`/`micro_`）+ 自动迁移旧数据
3. **前端架构**：路由不变，用 Context 管理当前科目，顶部切换器切换
4. **用户体验**：Anki 式首页（科目卡片）+ Duolingo 式顶部切换器
5. **实现策略**：增量改造，先数据层，再存储层，再状态层，最后 UI 层

**下一步：用户确认方案后，按步骤 1-5 增量实施。**
