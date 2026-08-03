# IB Math AA 主观题、Mock 与学习中心差距及实施计划

日期：2026-07-29  
状态：IB Math AA 紧急实施基线  
范围：先完成 IB Mathematics: Analysis and Approaches SL / HL；底层保留以后接入 AP FRQ 的能力

## 1. 已冻结的产品规则

### 题目定位

- 现有题目 ID 不重编。
- 唯一定位使用 `(subject_id, question_id)`。
- 新 AP 题使用 `MCQ-000001` / `FRQ-000001`。
- 新 IB 题使用 `P1-000001` / `P2-000001` / `P3-000001`。
- 小问定位使用 `(subject_id, question_id, part_label)`。

### Quiz

- Quiz 不保存整套随机题目组合。
- 不限制每名学生每天生成次数。
- 登录学生只要提交了答案，就保存该次题目作答。
- MCQ 与主观题进入同一套逐题作答记录。
- 游客可以使用允许的 Quiz，但不保存账号学习记录，也不能上传手写答案。

### Mock Exam

- 登录用户每科每天最多生成一套。
- 生成前先查询资格；当日已有时引导继续或进入学习中心。
- Mock 保存固定题目 ID 和顺序，不复制完整题目内容。
- Mock 可重命名、隐藏、恢复、继续和复习。
- 隐藏或删除当天 Mock 不恢复当天生成次数。
- IB Mock 包含独立 Paper。每个 Paper 保存自己的总时长和剩余时间，进入该 Paper 后开始计时，退出后从保存值继续。

### 主观题模式

- 自主核对：查看答案、手动填分、选择失分点，不调用识别服务。
- 系统辅助评阅：上传图片或 PDF，转录、建议得分和知识点诊断，学生确认后入库。
- 首期系统辅助评阅对所有已登录注册用户开放；未来收费或翎英学员限制只调整能力授权。

### 设备

- 产品是响应式网页答卷提交中心，不是手机专用功能。
- PC 支持图片、扫描件和 PDF。
- 手机和平板支持拍照、相册和文件选择。
- 后续支持 PC 打开 Mock、手机接力上传到同一份答卷。

## 2. 当前实际状态

### 内容与编号

- SL 60 道：P1 30、P2 30。
- HL 90 道：P1 40、P2 40、P3 10。
- 150 道题全部有 `question_id`、小问和小问评分说明。
- 缺少小问：0。
- 同题重复小问标签：0。
- 缺少小问 `scheme`：0。
- 小问与 `markscheme.rows` 数量不一致：0。
- 包含显式逐分 `mark_points` 的题目：0。
- 全部 5,627 道现有题中，同一科目内部重复 ID 为 0；跨科目重复 ID 值为 659，因此所有新学习记录必须同时保存 `subject_id`。

### 学生页面

- `/paper-practice` 支持知识点优先筛选和可选 Paper。
- `/paper-play` 只支持上一题、下一题和显示解析。
- 当前练习题放在 `sessionStorage.currentPaper`，关闭会话后不能恢复。
- 没有学生答案输入、图片上传、小问得分确认或逐题记录。

### IB Mock

- SL/HL 的 `subjects.json` 均为 `mockExam.status: "paper_practice_only"`。
- 现有 AP Mock 由浏览器抽题并写入 `sessionStorage`，不能直接承担 IB 每日唯一、跨设备继续和历史保存。
- IB 没有 Mock 生成、资格判断、Paper 计时、恢复或个人命名页面。
- 当前公开题库是知识点练习题库，不是已经组装好的完整 Mock 题库：
  - SL P1/P2 各 30 题、总分各 144；
  - HL P1/P2 各 40 题、总分各 186；
  - HL P3 共 10 题，每题均为 8 分，总分 80。
- 在开发 Mock 抽题器前，必须建立 Paper 组卷合同：目标总分、时长、题型结构、选题范围和计算器规则。尤其 HL P3 当前只能由多个 8 分短任务拼接，尚不能直接称为完整正式结构的 Paper 3 Mock。

### 学习记录

- 当前学习历史主要使用 localStorage 的 `doneQuestions`、`wrongQuestions`、`questionHistory` 和 `quizHistory`。
- 登录后整体同步到 D1 `progress_snapshots.snapshot` JSON。
- 没有独立 `question_attempt`，无法保存同一道题的多次答案、简答题图片、部分得分或待确认状态。
- 现有 `HistoryPage` 主要读取 MCQ 题库和正确率汇总，不适合 IB 主观题。
- 没有统一学习中心。

### 后端与文件

- 当前线上 Pages 项目只有 D1 绑定 `DB`。
- 没有 R2 绑定。
- 没有处理队列。
- 没有主观题上传、Mock 或逐题作答 API。
- D1 迁移目前到 `0003_admin_entitlements.sql`。

## 3. 差距矩阵

| 能力 | 当前状态 | IB 首期要求 | 优先级 |
| --- | --- | --- | --- |
| 题目定位 | 题目 ID 仅在科目内唯一 | 所有记录保存 `subject_id + question_id` | P0 |
| IB Quiz | 临时题目浏览 | 登录学生逐题保存答案；游客保持临时 | P0 |
| IB Mock | 不存在，仅 Paper Practice | 每日资格、固定题目、Paper 状态、继续 | P0 |
| Mock 组卷合同 | 当前只有知识点练习题 | 每个 Paper 的目标分值、时长、结构和可入选题规则 | P0 |
| Mock 计时 | IB 无计时 | 每个 Paper 保存剩余秒数并断点继续 | P0 |
| 学习历史 | localStorage 汇总 | 逐次 `question_attempt` | P0 |
| 学习中心 | 不存在 | Mock、做题记录、待处理、错题复习 | P0 |
| 自主核对 | 仅显示整题解析 | 小问手动得分和错误原因 | P0 |
| 打印训练 | IB 无完整流程 | Quiz/Mock 试卷与答案分离下载 | P1 |
| 图片上传 | 不存在 | PC/手机/平板图片与 PDF | P1 |
| 私有文件保存 | 不存在 | R2 与登录检查 | P1 |
| 批量 Mock 答卷 | 不存在 | 多文件、排序、题目映射、草稿 | P1 |
| Agnes 转录 | 不存在 | 文字、LaTeX、步骤和可信程度 | P2 |
| 逐分评分 | 0/150 有 mark points | 小问评分点拆分与建议得分 | P2 |
| 数学检查 | 不存在 | 数值、表达式、精度和单位检查 | P2 |
| AP FRQ 扩展 | 未接入 | IB 稳定后复用 | P3 |

## 4. 首期最小数据结构

### `mock_exams`

```text
id
user_id
subject_id
business_date
user_title
status
created_at
updated_at
archived_at
```

唯一约束：

```text
UNIQUE(user_id, subject_id, business_date)
```

### `mock_exam_papers`

```text
id
mock_exam_id
paper
time_limit_seconds
remaining_seconds
status
last_saved_at
submitted_at
```

SL 建立 P1、P2；HL 建立 P1、P2、P3。

### `mock_exam_questions`

```text
id
mock_exam_id
paper
subject_id
question_id
order_index
marks
```

### `learning_sessions`

```text
id
user_id
subject_id
session_type
source_id
created_at
completed_at
```

`session_type` 支持 `quiz`、`mock`、`review`。

### `question_attempts`

```text
id
learning_session_id
user_id
subject_id
question_id
part_label
answer_type
answer_json
score
max_score
status
submitted_at
confirmed_at
```

### `attempt_assets`

```text
id
attempt_id
r2_key
mime_type
size_bytes
page_order
status
created_at
```

R2 接入前该表可以先存在但不产生记录。

## 5. 分阶段实施

### 阶段 A：立即可用的无识别闭环

目标：不依赖 R2 和 Agnes，先让 IB Mock、断点计时、学习中心和逐题记录真正可用。

交付：

1. 根据官方考试结构和本地合规题库建立 SL/HL Paper 组卷合同。
2. 给题目标注是否适合进入 Mock 及所属 Paper 结构位置。
3. 新增 D1 表和服务端 API。
4. IB Mock 资格查询与每日唯一生成。
5. SL P1/P2、HL P1/P2/P3 独立 Paper 状态和剩余时间。
6. Mock 固定保存题目 ID 与顺序。
7. 学习中心：继续 Mock、Mock 历史、做题记录。
8. Quiz/Mock 自主核对：学生手动填写小问得分和错误原因。
9. 登录学生每次实际答案写入 `question_attempts`。
10. 游客继续使用临时 Quiz，不写账号记录。

完成标准：

- 同一学生同一科目同一天只能生成一套 Mock。
- 同日再次进入返回原 Mock。
- Paper 退出后可以从保存的剩余秒数继续。
- Mock 题目顺序跨刷新和跨设备不变。
- Quiz 不保存整套组合，但已提交答案出现在学习中心。
- 同一道题重做产生新记录，不覆盖旧记录。

### 阶段 B：答卷文件上传

目标：学生可以从 PC、手机或平板提交简答题图片/PDF，不依赖自动评分。

交付：

1. 配置私有 R2。
2. 图片/PDF 上传、查看和删除 API。
3. Quiz 按小问上传。
4. Mock 批量上传草稿、排序和手动题目映射。
5. 上传后允许学生自行对照答案并手动评分。
6. 原图自动清理规则。

完成标准：

- 文件不写入 D1。
- 游客不能创建上传批次。
- 关闭页面后上传草稿仍可从学习中心继续。
- 单页失败不影响其他页面。

### 阶段 C：Agnes 转录

目标：先识别学生写了什么，不直接决定正式得分。

交付：

1. 处理队列和 Worker。
2. Agnes Provider。
3. 文字、LaTeX、步骤和可信程度输出。
4. 学生修改识别结果并确认。

### 阶段 D：逐分建议与知识点诊断

目标：在真实验证数据达标后增加系统建议得分。

交付：

1. 为 150 道现有题逐小问补 `mark_points`。
2. 每个评分点关联具体知识点。
3. 数学检查和评分点匹配。
4. 至少 200 份手写答案验证集。
5. 学生确认后的知识点与错题记录。

## 6. 当前首个开发切片

首个切片只做阶段 A，不同时引入 R2、Agnes 和逐分自动评分。

建议施工顺序：

1. `ib_math_aa_mock_blueprint.json` 与组卷验证脚本。
2. `0004_ib_learning_sessions.sql`。
3. Mock 资格、创建、列表、详情、计时保存、重命名和归档 API。
4. 通用逐题作答 API。
5. IB Mock 生成与 Paper 页面。
6. `/learning-center`。
7. IB Quiz/Mock 手动小问评分。
8. API、数据约束、刷新恢复和跨设备验证。

### 2026-07-29 组卷合同落地状态

第 1 项已完成：

- 新增 `public/data/ib/math-aa/mock_blueprint.json`，固定 SL/HL 各 Paper 的时长、总分、计算器规则和官方样卷结构参考。
- 新增 `public/data/ib/math-aa/mock_question_eligibility.json`，逐题记录当前可承担的 Mock 结构角色。
- 新增可重复执行的构建与检查：
  - `npm run build:ib-math-aa:mock-contract`
  - `npm run validate:ib-math-aa:mock-contract`
- 当前四个 P1/P2 的 Section A 都能从现有短题中精确组成参考分值。
- 当前四个 P1/P2 的 Section B 候选均为 0，因为现有题全部为 4-6 分短题，没有 13-21 分连续长题。
- 当前 HL P3 的完整结构候选为 0，因为现有十道题均为独立 8 分题，没有 30 分与 25 分连续研究题。
- 因此 SL/HL 继续保持 `mockExam.status: "paper_practice_only"`。检查脚本会阻止题库结构未达标时提前开启完整 Mock。

下一施工项为 `0004_ib_learning_sessions.sql` 与阶段 A 的服务端持久化接口。内容补充需要与底层开发并行推进，但在长题补齐前，学生端不得把当前短题组合称为完整结构 Mock。

### 2026-07-29 持久化底层进度

- `0004_ib_learning_sessions.sql` 已建立但尚未应用到D1。
- Mock资格、创建、列表、详情、改名、归档和Paper计时接口已完成第一版。
- Quiz/Mock/复习统一逐题作答接口已完成第一版。
- `learning_sessions`保留为一次学习过程的容器；`question_attempts`保存该过程中的每次实际答案，重复作答不会覆盖旧记录。
- 数据库迁移链、每日唯一、固定顺序、得分范围和重复作答追加规则已通过自动检查。
- 下一步为IB持久化Mock学生页面和学习中心，随后把人工小问评分接入逐题作答接口。

### 2026-07-29 阶段A学生流程完成状态

- 持久化Mock生成、详情、分Paper进入和断点计时页面已实现。
- 学习中心、Mock改名/归档和逐题历史已实现。
- Quiz与Mock人工小问评分已接入统一作答记录。
- 游客限制和登录后保存规则已接入页面与接口。
- 本地真实HTTP流程、完整校验和生产构建已通过。
- 完整Mock内容仍未达组卷合同，因此生成入口会如实显示未开放；需要补齐长题后才能从“系统完成”进入“学生可生成完整Mock”。
- 阶段B可以开始实施R2图片/PDF上传，但正式部署前仍需补做真实浏览器视觉检查并应用D1迁移。

该切片完成后，IB学生即使不上传图片，也已经可以生成每日 Mock、分 Paper 作答、暂停继续、保存每次答案和在学习中心复习。这是最急、依赖最少、能够独立上线的一段。

## 7. 暂不阻塞阶段 A 的事项

- 题库知识点覆盖仍然不足：SL 5/60、HL 5/101 达到每点 8 道目标，但这不阻止先完成学习系统。
- 逐分 `mark_points` 尚未补齐，不阻止手动小问得分。
- R2 与 Agnes 尚未配置，不阻止 Mock、计时、学习中心和逐题记录。
- 未来收费规则未决定，首期按已登录注册用户开放即可。
