# AP Question Bank - 架构设计原则与约束

> 创建时间：2026-06-21
> 用途：记录多科目扩展的核心约束，防止后续实施中遗忘或偏离

---

## 一、绝对原则（不可违反）

### 1.1 不捏造任何不存在的数据

- **当前只存在 AP Macroeconomics 数据**（`macro_question_bank_v4.json`、`macro_frq_bank.json`）
- **AP Microeconomics、AP Statistics 等科目目前不存在**
- 任何方案中不能出现 Micro、Stats 或其他科目的 demo 数据、假卡片、假进度
- 如果方案需要展示多科目，只显示已存在的 Macro，其余位置用"添加科目"占位按钮，不可显示具体科目名称

### 1.2 不添加任何未实现的功能

- **不添加营销内容**：课程介绍、师资力量、学生成绩、备考资源等现在一律不显示
- **不添加学习进度**：没有学习系统，不要显示"45%进度"等捏造数字
- **不添加备考指南**：考试介绍、FRQ 技巧等文档内容现在不展示
- **不添加在线报名**：报名表单、支付等系统现在不存在
- 架构上预留接口（路由注释、组件占位），但 UI 上不显示任何相关内容

### 1.3 路由不变，现有功能不破坏

- 当前路由：`/quiz`、`/exam`、`/play`、`/frq`、`/frq-score`、`/score`、`/search`、`/mistakes`、`/history`
- **这些路由完全不变**，不需要改成 `/:subject/quiz` 等嵌套路由
- 预留路由用注释标记，不实际注册：
  ```jsx
  {/* 预留：未来营销页 <Route path="/about" element={<AboutPage />} /> */}
  ```
- HashRouter 不变，base 不变（`/ap-question-bank/`），部署到 GitHub Pages 的约束不变

### 1.4 文件路径不变

- `public/data/macro_question_bank_v4.json` 保持原路径
- `public/data/macro_frq_bank.json` 保持原路径
- `public/images/2012/`、`public/images/2013/` 保持原路径
- 不要创建 `data/macro/` 等子目录，不要移动文件

---

## 二、实施策略

### 2.1 只改机制，不填内容

| 层级 | 改什么（机制） | 不改什么（内容） |
|------|--------------|----------------|
| 数据配置 | 引入 `subjects.json` 声明当前科目 | 不在 JSON 里添加不存在的科目 |
| 存储层 | 封装 `storage.js`，加科目前缀 + 自动迁移 | 不创建新科目数据 |
| 状态层 | 引入 `SubjectContext` 管理当前科目 | 不切换不存在的数据 |
| UI 层 | 首页科目卡片 + 导航栏科目切换器 | 不显示不存在的内容 |
| 路由层 | 不变 + 预留注释 | 不注册新路由 |

### 2.2 增量改造，每步可独立测试

1. **数据层**：引入 `subjects.json`，代码从配置读取而非硬编码
2. **存储层**：封装 storage 函数，加 `macro_` 前缀，自动迁移旧数据
3. **状态层**：引入 `SubjectContext`，默认 `macro`
4. **UI 层**：首页改造、导航栏加科目切换器
5. **功能页接入**：各功能页通过 Context 获取当前科目

每步完成后构建测试，确保不破坏现有功能。

### 2.3 自动迁移旧数据

首次加载时检查：
```js
if (localStorage.getItem('doneQuestions') && !localStorage.getItem('macro_doneQuestions')) {
  localStorage.setItem('macro_doneQuestions', localStorage.getItem('doneQuestions'))
  // 旧 key 不删除，保留备份
}
```

---

## 三、当前真实状态（参考）

### 3.1 数据文件

```
public/data/macro_question_bank_v4.json  ← 180 道 MCQ
public/data/macro_frq_bank.json          ← 15 道 FRQ
public/data/classification_config.json   ← 分类配置
public/images/2012/...                   ← 2012 年真题图片
public/images/2013/...                   ← 2013 年真题图片
```

### 3.2 当前功能页

- `/` → 首页
- `/quiz` → Quiz 设置
- `/exam` → Mock 设置
- `/play` → Quiz 做题
- `/frq` → FRQ 做题
- `/frq-score` → FRQ 评分
- `/score` → 分数统计
- `/search` → 搜索
- `/mistakes` → 错题本
- `/history` → 记录

### 3.3 技术栈

- React 18 + Vite + TailwindCSS
- React Router（HashRouter）
- GitHub Pages 部署（`base: '/ap-question-bank/'`）
- 纯前端，无后端，数据用 JSON 文件 + localStorage

---

## 四、用户明确的需求记录

> 原话整理：
> "通过开源免费题库获取流量，推广翎英教育。网站要留出空间做更多内容（业务介绍、在线报名），但不一定什么时候做。多科目架构要合理科学、容易维护，考虑可复用组件。每个科目除了 quiz、mock、错题、搜索、记录，未来还会放科目介绍、考试介绍。但这些都先不做，只是架构要预留。"

**关键理解：**
- 架构是长期的，但内容是渐进的
- 先做好题库系统本身，再逐步扩展
- 所有扩展功能现在不显示，但架构要能支持
- 不要"画大饼"——把未来的功能画到当前 UI 上

---

## 五、如果违反这些原则时的自检清单

在提交任何方案前，检查：

- [ ] 是否捏造了不存在的数据（如 Micro 题库、Stats 卡片）？
- [ ] 是否添加了未实现的功能（营销、进度、备考）？
- [ ] 是否改变了现有路由？
- [ ] 是否移动了数据文件？
- [ ] 是否一次修改了过多文件？
- [ ] 是否考虑了 GitHub Pages 的 HashRouter + base 约束？
- [ ] 是否设计了旧数据迁移方案？

---

## 六、相关文档

- `docs/multi-subject-research.md` — 多科目技术调研
- `docs/platform-architecture-research.md` — 全局平台架构调研
- `docs/maintenance.md` — 维护指南（如存在）

---

> 最后更新：2026-06-21
> 确认人：用户（wuzeh）
