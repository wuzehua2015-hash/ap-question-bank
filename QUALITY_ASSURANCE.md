# 质量保证流程 QUALITY_ASSURANCE.md

> 每次修改题库系统任何部分之前，必须先运行此清单。
> 目的：防止「修好A，崩坏B」的回归问题。

---

## 一、核心原则

1. **不直接修改 main 分支** — 所有修改必须在 feature branch 上进行
2. **修改前必须做影响分析** — 回答「可能影响什么」
3. **修改后必须跑回归测试** — 不是只测改的部分
4. **数据修改必须运行校验脚本** — 自动化检查，不依赖人工

---

## 二、修改前：影响分析模板

每次创建新分支时，在 PR 描述中填写：

```markdown
## 修改内容
要改什么：________

## 可能影响
- [ ] 数据文件（JSON）
- [ ] 图片文件（PNG）
- [ ] PDF导出功能
- [ ] 前端渲染
- [ ] 分类/筛选逻辑
- [ ] 其他：________

## 回归测试项
- [ ] 数据完整性（运行 data_validator.js）
- [ ] 图片完整性（运行 image_validator.js）
- [ ] PDF分页测试（导出含图+无图各5题）
- [ ] 单元分类抽查（每单元5题）
```

---

## 三、回归测试清单

### 3.1 数据完整性（必跑）

```bash
node scripts/data_validator.js
```

检查项：
- [ ] 所有题目都有 `question_id`
- [ ] 所有题目都有 `answer`
- [ ] 所有题目都有 `primary_unit`（U1-U6）
- [ ] 所有题目都有 `text`
- [ ] 没有重复 `question_id`
- [ ] `pure_unit=true` 的题没有空的 `secondary_units`
- [ ] `pure_unit=false` 的题有 `secondary_units`
- [ ] `has_graph=true` 的题都有 `image_paths`
- [ ] `option_table_data` 格式正确（headers + rows）

### 3.2 图片完整性（必跑）

```bash
node scripts/image_validator.js
```

检查项：
- [ ] 所有 `image_paths` 指向的文件都存在
- [ ] 所有图片文件大小 > 1KB
- [ ] 所有表格图片不包含题干文字（人工抽查）
- [ ] 所有图片分辨率合理（宽 400-3000px）

### 3.3 PDF导出测试（修改PDF相关代码后必跑）

手动测试：
- [ ] 导出5道**无图**MCQ → 检查无截断
- [ ] 导出5道**有图**MCQ → 检查图片完整、无截断
- [ ] 导出5道**表格选项**MCQ → 检查表格完整
- [ ] 导出1套Mock Exam（60MCQ+3FRQ）→ 检查全面无截断
- [ ] 检查答案页 → 无截断、无遗漏

通过标准：**没有任何元素被分页截断**（题目、图片、表格、答案完整显示）

### 3.4 单元分类抽查（修改分类后必跑）

```bash
node scripts/unit_classification_checker.js
```

检查项：
- [ ] 每单元抽查5题，人工确认分类正确
- [ ] 检查 `pure_unit` 标记是否准确
- [ ] 检查 `topics` 字段是否与实际内容匹配

### 3.5 前端功能测试（修改前端代码后必跑）

- [ ] Quiz Setup 页面正常加载
- [ ] Mock Exam Setup 正常生成
- [ ] QuizPlayer 正常翻题、选择答案
- [ ] 有图片的题正确显示图片
- [ ] 表格选项题正确渲染表格
- [ ] FRQPlayer 正常显示题目
- [ ] 提交后成绩页面正常显示

---

## 四、数据校验脚本

### 4.1 用法

```bash
# 校验MCQ数据
node scripts/data_validator.js --file public/data/macro_question_bank_v4.json

# 校验FRQ数据
node scripts/data_validator.js --file public/data/macro_frq_bank.json

# 校验图片
node scripts/image_validator.js --dir public/images
```

### 4.2 脚本实现（scripts/data_validator.js）

```javascript
const fs = require('fs')
const path = require('path')

function validate(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const errors = []
  const warnings = []
  
  const seenIds = new Set()
  
  for (const q of data) {
    // 必需字段
    if (!q.question_id) errors.push('Missing question_id')
    if (!q.answer) errors.push(`${q.question_id}: Missing answer`)
    if (!q.primary_unit) errors.push(`${q.question_id}: Missing primary_unit`)
    if (!q.text) errors.push(`${q.question_id}: Missing text`)
    
    // 重复检查
    if (seenIds.has(q.question_id)) errors.push(`Duplicate: ${q.question_id}`)
    seenIds.add(q.question_id)
    
    // 单元范围
    if (q.primary_unit && !['U1','U2','U3','U4','U5','U6'].includes(q.primary_unit)) {
      errors.push(`${q.question_id}: Invalid unit ${q.primary_unit}`)
    }
    
    // pure_unit 一致性
    if (q.pure_unit) {
      if (q.secondary_units && q.secondary_units.length > 0) {
        warnings.push(`${q.question_id}: pure_unit=true but has secondary_units`)
      }
    } else {
      if (!q.secondary_units || q.secondary_units.length === 0) {
        warnings.push(`${q.question_id}: pure_unit=false but no secondary_units`)
      }
    }
    
    // 图片存在性
    if (q.has_graph && (!q.image_paths || q.image_paths.length === 0)) {
      errors.push(`${q.question_id}: has_graph=true but no image_paths`)
    }
    
    if (q.image_paths) {
      for (const imgPath of q.image_paths) {
        const fullPath = path.join('public', imgPath)
        if (!fs.existsSync(fullPath)) {
          errors.push(`${q.question_id}: Image not found: ${imgPath}`)
        } else {
          const stats = fs.statSync(fullPath)
          if (stats.size < 1024) {
            warnings.push(`${q.question_id}: Image too small: ${imgPath}`)
          }
        }
      }
    }
    
    // option_table_data 格式
    if (q.option_table_data) {
      if (!q.option_table_data.headers || !q.option_table_data.rows) {
        errors.push(`${q.question_id}: Invalid option_table_data format`)
      }
    }
  }
  
  console.log(`=== Validation Results ===`)
  console.log(`Total: ${data.length} questions`)
  console.log(`Errors: ${errors.length}`)
  console.log(`Warnings: ${warnings.length}`)
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:')
    errors.forEach(e => console.log('  ', e))
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️ Warnings:')
    warnings.forEach(w => console.log('  ', w))
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ All checks passed')
  }
  
  return { errors, warnings, passed: errors.length === 0 }
}

const filePath = process.argv[2] || 'public/data/macro_question_bank_v4.json'
const result = validate(filePath)
process.exit(result.passed ? 0 : 1)
```

### 4.3 图片校验脚本（scripts/image_validator.js）

```javascript
const fs = require('fs')
const path = require('path')

function validateImages(dir) {
  const errors = []
  const warnings = []
  
  function walk(dir) {
    const items = fs.readdirSync(dir)
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        walk(fullPath)
      } else if (item.endsWith('.png') || item.endsWith('.jpg')) {
        if (stat.size < 1024) {
          errors.push(`Image too small: ${fullPath}`)
        }
        if (stat.size > 5 * 1024 * 1024) {
          warnings.push(`Image very large: ${fullPath}`)
        }
      }
    }
  }
  
  walk(dir)
  
  console.log(`=== Image Validation ===`)
  console.log(`Errors: ${errors.length}`)
  console.log(`Warnings: ${warnings.length}`)
  
  errors.forEach(e => console.log('❌', e))
  warnings.forEach(w => console.log('⚠️', w))
  
  return { errors, warnings, passed: errors.length === 0 }
}

const dir = process.argv[2] || 'public/images'
const result = validateImages(dir)
process.exit(result.passed ? 0 : 1)
```

---

## 五、Git Workflow

```
main（只接受通过回归测试的代码）
  └─ feature/fix-table-images
        ├─ 修改图片
        ├─ 运行 data_validator.js + image_validator.js
        ├─ 运行 PDF分页测试
        ├─ 人工抽查表格图片
        └─ PR → 合并到 main
  └─ feature/reclassify-mcq
        ├─ 修改分类
        ├─ 运行 data_validator.js
        ├─ 运行 unit_classification_checker.js
        └─ PR → 合并到 main
```

**禁止**：直接在 main 上修改任何数据或代码。

---

## 六、常见回归陷阱

| 修改 | 常见崩坏 | 预防措施 |
|------|---------|---------|
| 重新提取图片 | 图片路径不匹配、JSON中未更新 | 运行 image_validator.js |
| 修改分类 | 之前修好的分类被覆盖 | 运行 unit_classification_checker.js |
| 修改PDF配置 | 分页失效、内容截断 | 导出测试PDF，人工检查 |
| 修改前端组件 | 其他页面渲染异常 | 检查所有使用此组件的页面 |
| 修改数据结构 | 旧数据格式不兼容 | 更新 data_validator.js 检查规则 |

---

## 七、故障排查速查

### 问题：之前修好的bug又出现了
**排查步骤**：
1. `git log` 查看最近的修改是否覆盖了之前的修复
2. 检查是否有多个数据文件版本不一致（public vs dist vs GitHub）
3. 检查是否是缓存问题（浏览器/Vercel CDN）

### 问题：PDF导出截断
**排查步骤**：
1. 检查 `pagebreak` 配置是否被修改
2. 检查题目容器是否有 `page-break-inside: avoid`
3. 检查图片是否过大（超过页面高度）
4. 导出测试PDF，逐步增加题目数量定位问题

### 问题：图片不显示
**排查步骤**：
1. 检查 `image_paths` 是否为空或错误
2. 检查图片文件是否存在（public vs dist）
3. 检查 BASE_URL 配置是否正确
4. 检查浏览器控制台是否有 404 错误

---

*最后更新：2025-06-22*
*责任人：每次修改前必须阅读并执行此清单*
