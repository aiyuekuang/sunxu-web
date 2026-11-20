# Sunxu Web 初始化与复用记录

## 来源与边界

- 目标：`https://github.com/aiyuekuang/sunxu-web.git`，本地路径 `../sunxu-web`；仓库克隆时为空。
- 参考：相邻 `../sunxu` 项目，HEAD `9617250e05c7dbb9413fa81053c7730bbe31fdfc`。
- 参考 Sunxu 工作区盘点时存在未提交变更；未从中直接复制运行时代码。映射依据为其现有公开导出、`README.md`、`docs/component-migration.md` 和主题 token 定义；Web 组件均按 Ant Design / Pro Components 重新实现。
- MES Web 管理端固定提交 `133e8673e92c24119024f9b4fbcfe2ce5247bf79` 的共享组件目录最初纳入通用层盘点；其旧处理边界由 2026-11-19 的明确决策扩展，详见下方 MES UI 套件记录。

## 适配策略

| 事项 | 策略 | 目标 |
|---|---|---|
| 颜色、间距、字阶、圆角和动效 | 按 Web 单位与 AntD token 适配 | `src/theme/**`, `design-system/sunxu-web/MASTER.md` |
| 页面容器、标题、工具栏和 footer | 重新实现 Web 语义布局 | `src/components/PageContainers.tsx`, `PageHeader.tsx` |
| Pro 页面组件 | 使用 AntD/Pro 权威实现 | `SectionCard`, `MetricCard`, `DetailCard` 等 |
| 筛选、状态选择 | 按 Web radiogroup/search 语义组合 | `StatusTabs`, `FilterBar` |
| 身份摘要、设置行、错误/权限边界 | 保留通用职责，使用 Web 语义元素 | `ProfileIdentity`, `SettingsRow`, `ErrorBoundary`, `PermissionGuard` |
| RN 手势、安全区/键盘与宿主 API | 不复制到 Web runtime | 见 `component-inventory.md` |
| 文档组件目录 | 提供可运行示例和映射查询 | `examples/catalog/**` |

## 当前差异与未完成项

- 本仓库使用 Ant Design 6 与 Pro Components 3 beta；它不与 Sunxu React Native 的组件 API 或 peer dependency 兼容。
- 上游同名组件由上游拥有，不建立永久兼容包装层。
- 目录页展示的是契约示例和组件映射，不代表每个宿主页面已经接入。
- 每个可见 wrapper 的最终视口截图、DOM 几何、键盘/读屏和主题验收在 `docs/verification/` 记录；没有记录的状态标 `UNVERIFIED`。

## CRUD 列表表格适配插槽

- 组件使用评审发现：部分宿主已经有列宽拖拽等表格能力，直接用工作台内置 ProTable 会丢失有效交互；宿主另包一层列表工具栏则会复制工作台职责。
- `CrudListWorkbench` 新增可选 `renderTable`，把表格结果区交给宿主适配器，标题、筛选和列表级操作仍由工作台统一拥有。默认仍直接渲染 ProTable。
- `renderTable` 的公开 API、适配边界和目录路由示例同步更新在组件契约、使用规范和 `examples/catalog/CrudListWorkbenchPage.tsx`。表格数据请求、权限和领域行为仍由宿主负责。
- 页面容器新增 `as="main|section"` 语义根元素；工作台默认嵌入现有应用 landmark，避免 CRM / 组件目录应用中出现嵌套 `<main>`。
- ESM 发布构建将 React JSX runtimes 标记为外部依赖；真实 Umi 页面曾因打包的 `require('react')` 白屏，此次通过目录路由运行验证修正。
- 包版本提升并发布为 `sunxu-web@0.2.1`；CRM Web 已将依赖范围和 lockfile 更新到 0.2.1。
- 源码和目录需通过本仓的类型检查、构建；未实际渲染的适配状态继续标记为 `UNVERIFIED`。

## MES Web 基线组件库引入（2026-11-10）

- 正确来源是 Web 管理端仓库 `../mes-main/mes-admin`，分支 `main-买断版本`，固定提交 `133e8673e92c24119024f9b4fbcfe2ce5247bf79`；本次只从提交对象读取，未读取来源工作区中 26 个未提交文件的内容，也未修改来源仓库。
- 盘点范围为来源 `src/components/**` 的全部 193 个跟踪文件：145 个运行时代码文件、45 个测试文件、3 个样式文件。页面私有组件和 App 组件均不在来源范围内。
- 4 个可复用 Web 源文件适配为目标 API：`DocumentLineEditableTable` + `DocumentLineBatchSettings` → `EditableDetailTable` / `BatchFieldSettingsButton`；`RemoteSelect` → `RemoteSelect`；`TableLongText` → `LongText`。远程数据、行模型、字段校验、权限和业务联动由宿主提供。
- 其余源码逐文件记录为目标已有契约、Ant Design / Pro Components 原生实现、宿主职责、MES 领域排除、待评估或来源测试/样式，见 [`docs/migrations/mes-web-components.json`](./migrations/mes-web-components.json)。该清单含固定提交中每个文件的 SHA-256。
- 之前错误引用的 MES App 清单与截图已撤下；App 与这份 Web 共享组件迁移无直接关系。

## MES UI 套件扩展（2026-11-19）

- 用户决定将 Sunxu Web 扩展为“通用组件层 + MES UI 套件”，先按当前 MES 实现补全组件库，再逐项替换 MES 消费端。
- MES 当前使用的 Ant Design、Pro Components 和图标组件由 `src/upstream.ts` 直通导出；它们仍由上游实现和维护，不在 Sunxu 再造包装组件。
- MES 专用 UI 位于 `src/mes/**`，从 `sunxu-web/mes` 子路径导出。API 请求、路由、权限判断与业务副作用由 MES 宿主通过 props、回调或适配器注入；Sunxu runtime 不依赖 MES 服务、Umi runtime 或权限码。
- 页面路由和页面控制器仍留在 `mes-admin`。迁移范围以 [MES 当前组件导入快照](./migrations/mes-admin-component-usage-2026-11-19.json) 和 [MES 公共组件逐文件清单](./migrations/mes-admin-src-components-2026-11-19.json) 为准；每条记录须映射到通用层、MES 套件、上游直通出口或宿主控制器，不得静默丢弃。
- 已建立独立 `sunxu-web/mes` 运行时出口，已迁入 `TableLongText`、`DocumentLineBatchSettingsButton`、`DocumentLineQuantityInput`、`PermissionButton`、`StatusDisplay` 与 `DocumentModalForm` 等 MES 兼容适配；组件逐条覆盖仍在进行中。
- `DocumentModalForm` 按当前 MES 行为重新适配到 Sunxu 命名空间和 Ant Design tokens，保留完整 `ModalForm` props、标签工作区定位、视口全屏选项、最小化草稿保留、还原条、open 状态重置及语义样式槽合并；请求和路由仍由宿主控制。最终读屏器流程为 `UNVERIFIED`。
- MES `ResizableTable.tsx` 以 `mes-admin` 分支 `main-买断版本` 的提交 `e185f6b68b6d8ef94ed0b5312340e1952be5f2f1` 为行为基线（源文件 SHA-256 `f86cf0b9bc988036ddcce0246b48627ea80dcf25607d8db29cc721f99e542c3e`，3,699 行）。Sunxu 版本为 3,780 行的适配移植：列宽钩子、MES 表格工具、列状态/导出布局、Umi 权限接缝改为 `MesUiProvider` 能力注入；不读取或修改 `mes-admin` 工作区文件，也没有将来源文件原样不加处理地复制进通用层。
- 套件导出 `ResizableProTable` / `ResizableTable`、`TableActions`、`TableDensityOption`、`TableEmpty` 和 `useTableExportLayout`。保留源行为后，排序标记改为叠加到最终表格列，避免 ProTable 恢复已保存排序时改变列宽 hook 的输入并把已保存宽度覆盖回默认值。
- 此前表格/单据批次后，账本中已有实现的 MES/通用组件引用从 9 项增至 16 项；待补实现从 75 项降至 71 项，需按变更源契约复核从 19 项降至 16 项。
- 第二批从同一固定 MES 提交 `e185f6b68b6d8ef94ed0b5312340e1952be5f2f1` 核对并适配 `AmountText`、`AmountPolicySnapshotTag`、`DateText`、`UserText`、`DefaultRouteHint`、`CustomerMaterialCell` 和 `EntityThumbnail`。它们保留源格式、回退、快照解析、推荐路线提示、客户别名/内部物料并列、排序取值、图片 fallback/预览及行事件隔离；金额策略和路线 API 改为宿主注入。代码经契约适配，不将 MES 服务依赖或权限状态复制进 Sunxu。
- 七项均已从 `sunxu-web/mes` 导出，并加入 MES 套件目录的金额显隐、快照 Popover、日期/用户回退、推荐工艺路线、客户物料规格和图片预览示例。契约细节和完整覆盖账本同步更新；这一批没有替换 `mes-admin` 消费页面。
- 更新后账本中已有实现的 MES/通用组件引用为 23 项，待补实现为 64 项，需按变更源契约复核仍为 16 项；运行时源文件中已实现为 21 项、待补为 82 项。实现数仅表示套件已有组件契约，不代表已迁移 MES 页面调用点。
- `ResizableTable` 真实目录路由的列宽拖拽与排序后刷新、列显隐与导出列数、密度、空态、双击回调、服务端/本地排序、汇总、视口高度及窄屏键盘横向滚动证据见 [`docs/verification/mes-resizable-table-2026-11-20/README.md`](./verification/mes-resizable-table-2026-11-20/README.md)。
