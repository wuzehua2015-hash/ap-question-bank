# 工具清单 TOOLS_INVENTORY

> 本文件记录 `ap-question-bank` 项目中所有自建工具脚本，方便日后查找和复用。
> 每个工具包含：用途、路径、使用方式、已知局限。

---

## 1. precise_table_cropper.py — 通用PDF表格精确裁剪器

**用途**：从PDF或图片中自动检测表格区域，精确裁剪到仅包含表格本身（不包含前后问题文字）。可复用于任何科目的PDF表格提取。

**路径**：`scripts/precise_table_cropper.py`

**依赖**：`opencv-python`, `numpy`, `Pillow`, `PyMuPDF` (可选，用于PDF渲染)

**使用方式**：

```bash
# 从PDF提取
python scripts/precise_table_cropper.py \
    --pdf "AP Macro 2014.pdf" --page 41 \
    --output 2014_frq3_table.png

# 对已有图片重新裁剪
python scripts/precise_table_cropper.py \
    --image "public/images/frq/old_image.png" \
    --output "public/images/frq/new_image.png"

# 批量处理目录
python scripts/precise_table_cropper.py \
    --batch-dir "public/images/frq/" \
    --output-dir "public/images/frq/clean/"

# 去除水印（如TestDaily灰色水印）
python scripts/precise_table_cropper.py \
    --pdf "AP宏观经济2023年参考试卷1 .pdf" --page 13 \
    --output 2023_table.png \
    --remove-watermark
```

**算法原理**：
1. 水平线检测（形态学开运算 + 行最大连续白像素后备）
2. 水平线按距离分组（max_gap=150px），取最密集组作为表格区域
3. 垂直线检测，精确定位左右边界
4. **完整边框表格**（2+条水平线）：用上下边框作为边界，检测文本间隙排除问题文字
5. **T-account表格**（仅1条水平线）：用垂直线终止点 + 文本密度确定底部
6. 可选水印去除：将亮度>200的像素设为白色

**已知局限**：
- T-account表格（无完整边框）的自动检测成功率约70%，对于复杂布局仍建议手动坐标
- 表格与问题文字之间无间隙时，可能无法完全排除问题文字
- 页面底部装饰线（如"GO ON TO THE NEXT PAGE"）可能被误检测为表格下边界

**示例坐标参考**（AP宏观经济，300 DPI）：

| 文件名 | PDF | 页码 | 坐标 (x, y, w, h) |
|--------|-----|------|-------------------|
| 2012_FRQ2 | AP Macro 2012.pdf | 40 | (400, 250, 1600, 500) |
| 2012_FRQ3 | AP Macro 2012.pdf | 40 | (500, 250, 1500, 480) |
| 2014_FRQ2 | AP Macro 2014.pdf | 37 | (400, 300, 1600, 350) |
| 2014_FRQ3 | AP Macro 2014.pdf | 41 | (400, 370, 1600, 330) |
| 2016_FRQ3 | AP Macro 2016.pdf | 41 | (400, 250, 1600, 380) |
| 2017_FRQ2 | AP Macro 2017.pdf | 39 | (400, 250, 1700, 600) |
| 2018_FRQ3 | AP Macro 2018.pdf | 37 | (0, 607, 2480, 386) |
| 2023_FRQ2_S1 | AP宏观经济2023年参考试卷1 .pdf | 13 | (400, 530, 1750, 510) |
| 2023_FRQ3_S2 | AP宏观经济2023年参考试卷2 .pdf | 22 | (0, 619, 2549, 399) |
| 2023_FRQ3_S3 | AP宏观经济2023年参考试卷3 .pdf | 21 | (0, 361, 2549, 246) |

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
- 对于底部文字水印，可结合OCR或模板匹配定位

---

## 3. 分类器方案（文档，未实现）

**路径**：`docs/CLASSIFICATION_SOLUTION.md`

**用途**：多分类器投票方案设计文档，用于题目类型自动分类（MCQ/FRQ/Table/Graph）。

**状态**：设计文档已完成，代码未实现。

---

## 工具维护规范

1. **新增工具**：必须在本文档中登记，包含用途、路径、使用方式、已知局限
2. **修改工具**：如引入新的命令行参数或行为变更，同步更新本文档
3. **废弃工具**：标记为 `[DEPRECATED]`，说明替代方案，保留6个月后再删除
4. **依赖管理**：所有Python工具的依赖应在项目根目录的 `requirements.txt` 中声明

---

*最后更新：2025-06-22*（本次更新：修正 2018_FRQ3 命名，新增 2012_FRQ2，统一 2023 命名格式）
