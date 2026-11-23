# CrudListWorkbench 短数据分页填充验收

## 验收对象

- 路由：`CatalogApp` 中的“CRUD 列表工作台”真实目录页，选择“fill 模式：单列表视口页”示例；结果适配器使用 MES `ResizableProTable`。
- 状态：3 条短数据，分页开启；工作台父容器确定高度 360px。
- 视口：1470 × 1000，桌面 Chromium。
- 范围：验证共享 `CrudListWorkbench` 在宿主给定可用高度后的内部高度链；此目录页包含其他示例卡片，页面自身保持文档滚动。

## 结果

- 工作台、layout、结果容器和 ProTable 外层均为 360px 高。
- Ant Design table section 为 320px，内部滚动体为 274px；3 行内容没有把结果区压回自然行高。
- 分页底边与工作台底边同为 y=934，间隔 0px。
- 页面横向滚动宽度 1470px，与视口宽度相同。
- 截图和机器读取的 DOM 几何分别见 `screenshot.png` 与 `layout-audit.json`。

## 限制

这是共享组件目录的本地真实渲染验收，不代表 MES Admin 采购订单路由已加载新共享包。宿主包版本更新和测试环境部署后，还需在已登录采购订单页面做最终验收；此前测试环境的共享包仍是旧版本，故该路由当前状态为 `UNVERIFIED`。
