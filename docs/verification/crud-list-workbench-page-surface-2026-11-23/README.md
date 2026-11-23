# CRUD 列表页面表面渲染验收

- 路由：Sunxu Web 组件目录 → CRUD 列表工作台（公开目录页，无需登录）
- 变更：页面级 `CrudListWorkbench` 使用主题 `--sxw-surface`；`layout="embedded"` 保持透明。
- 桌面视口：1440×1000；浅色与深色主题均已检查。
- 窄屏视口：390×844；检查了结果工作区边界与整页横向溢出。
- DOM：浅色页面级工作台为 `rgb(255, 255, 255)`，浅色外衬为 `rgb(245, 246, 248)`；深色分别为 `rgb(28, 28, 30)` 与 `rgb(15, 15, 15)`。窄屏页面 `scrollWidth` 等于视口 `clientWidth`；表格本身保留横向滚动。内嵌工作台计算背景仍为透明。
- 构建：`npm run build` 成功。目录构建报告既有的大包体积提示。
- 浏览器控制台：记录到 Ant Design `Space.direction` 弃用提示和 resizable-header 列宽提示；没有页面级未捕获异常。
- 业务宿主验证：MES 采购询价登录路由为 `UNVERIFIED`，当前没有已确认的测试会话。本次没有尝试登录；组件目录渲染仅验证共享组件的表面样式。

截图与 DOM 几何保存在本目录；`layout-audit.json` 由 `validate_spacing_audit.py` 校验。
