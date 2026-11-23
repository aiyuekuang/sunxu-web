# 表格填充高度与底部分页验收

## 本地共享组件目录

使用 `sunxu-web` 本地 Catalog 的真实路由和 Chromium 可见浏览器，视口 `1470 × 1000`，检查短数据表格的 flex 高度链、表格滚动体、分页位置及文档横向溢出。

- `MES 表格组件`：`ResizableProTable fitContainerHeight` 的表格根高 343px，滚动体高 276px，分页与表格根底部间距 0px。
- `CRUD 列表工作台`：`CrudListWorkbench fill` 的表格根高 360px，滚动体高 274px，分页与表格根底部间距 0px。
- 两个页面的表格滚动体都实际占满分配高度；`document.scrollWidth` 等于视口宽度。
- 几何明细见 `geometry.json`；两张完整页面截图见 `fit-container-height.png` 和 `crud-workbench-fill.png`。

## 已登录业务测试页

使用已登录 Chrome 检查采购订单 `/purchase/orders`。这条业务路由目前仍显示分页上方约 298px 空白。DOM 没有本次共享组件修复新增的 `sxw-crud-list-workbench__fill-table-section` 标记，表格根高 512px、分页底部 y=413、表格根底部 y=711，确认测试站加载的是旧共享包/旧构建。这个页面不能作为修复后的验收结果；需要部署加载新 Admin 与 Sunxu 版本后再复验。

## 覆盖范围

全局扫描发现 Admin 有 34 个 `CrudListWorkbench` 调用点（会计、财务、资金、物料、生产、采购、质量、报表），全部使用 `fill`；另有 50 个显式 `fitContainerHeight` 调用点和 30 个 `ListPageShell` 调用点。修复放在 `sunxu-web` 表格/工作台共享契约中，因此由这些入口共同继承；财务账龄页自定义 `loading` 的覆盖另行修正，保留共享 Spin 布局类。其余受控高度表格多位于弹窗、抽屉、分栏或选择器，不改变其所属容器边界。

本次扫描在 `mes-node`、`mes-app`、`mes-wx`、`mes-mcp` 未发现同类 React/Ant Design Web 表格布局入口。

## 验证

- `sunxu-web`: `npm run typecheck` 通过。
- `sunxu-web`: `npm run build` 通过。
- `mes-admin`: 全量 `npm run build` 通过，Umi/Webpack 36.89s。
- Admin 业务页面的修复后视觉结果：`UNVERIFIED`，因为已登录测试站仍提供旧构建；未执行远端部署。
