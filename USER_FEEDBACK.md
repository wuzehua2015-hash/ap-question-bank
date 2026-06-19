您截图中的题目文字是 "The economy is currently in long-run equilibrium. If the central bank increases the money supply..."，这是 **2018_Q35**，在题库中**没有图片**（image_paths为空），所以不会显示图表。

您说"图表没有正常显示"和"最后一个选项被污染"，可能是在说**另一道题**？

请帮我确认：
1. **您截图中的题目编号**是多少？（页面上方有 "Q35" 之类的编号吗？）
2. **您遇到图片不显示的是哪道题**？（比如Q54、Q32等）
3. **选项被污染的是哪道题的哪个选项**？

这样我可以直接定位修复。目前已推送到Vercel的修复包括：
- 32道图片题的 image_paths 已添加
- 30道表格选项的 option_table_data 已添加
- 48个选项末尾的 `. .`、空格、bullet points 已清理
- 前端代码已添加 BASE_URL 拼接逻辑

等您确认具体题目编号后，我可以立即修复。