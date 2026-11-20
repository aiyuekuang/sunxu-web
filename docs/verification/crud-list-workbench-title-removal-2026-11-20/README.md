# CrudListWorkbench 无页级标题验收

## 目标与首屏空间

首屏任务是筛选并查看列表，同时可执行新增等列表操作。工作台本身只负责列表工具栏与结果表格；页面身份由宿主导航/页面上下文提供，因此工作台不再预留或渲染页级标题。

桌面实测工作台从工具栏开始，标题渲染数为 0；工具栏与表格结果区间距为 8px。组件示例宿主自己的 `CRUD 列表工作台` 页面标题仍保留，用来识别目录路由。

## 布局与接缝记录

| 视口 | 工作台位置/宽度 | 工具栏高度 | 表格结果区 | 工具栏到表格 | 页面横向溢出 | 外框 |
|---|---:|---:|---:|---:|---:|---:|
| 1470×900 | x=48, w=1374 | 98px | y=338.14, h=375px | 8px | 0px | 左右 24px |
| 390×844 | x=32, w=326 | 213px | y=437.14, h=375px | 8px | 0px | 左右 16px |

窄屏表格内容宽于视口，Ant Design 表格结果区通过 `overflow-x: auto` 提供内部横向滚动（1020px 内容 / 326px 可视宽度），页面本身不横向溢出。页面背景实测为 `rgb(245, 246, 248)`。

## 证据与限制

- [桌面截图](./desktop-1470x900.png)
- [窄屏截图](./mobile-390x844.png)
- [DOM 几何与布局数据](./layout-audit.json)
- 隔离预览实际加载 `examples/catalog/CrudListWorkbenchPage.tsx` 和库内组件。组件标题移除、工具栏/表格接缝与视口溢出检查通过。
- 正式目录路由状态为 `UNVERIFIED`：根目录 build/typecheck 被现存 `src/mes/components/OrderItemEditor.tsx:907–908` 语法错误及 `src/mes/components/BusinessPrintTemplates.tsx:1175` 重复声明阻塞。CRM 宿主路由未在本次浏览器检查中运行。
- 隔离预览报告了一条 Ant Design `Space.direction` 弃用警告和一项 404 资源；未阻止组件渲染。
