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

## MES 组件覆盖扩展（2026-11-21）

- 本轮来源固定为 `mes-admin@8f3eb022977ee3fe4bff856f1bcf1b2fd5f625e8`；来源工作区仅用于读取和哈希核对，不修改来源代码。逐条映射与每个页面组件源文件的当前状态见 [覆盖账本](./migrations/mes-admin-component-coverage-2026-11-20.json)。
- 新增的 MES UI 套件实现继续使用 AntD/Pro 能力，并把数据服务、权限结果、路由、上传/打印窗口、字典和业务反馈通过 types 明确注入。目录示例用于展示消费接法；非 JSX 的工单临时报工二维码打印 helper 单独登记在 `supplemental_page_local_ui_helpers`，不混入 JSX 引用计数。
- 本轮完成的页面局部迁移包括仪表盘快捷入口、公式设计器、FQC 规则面板、BOM 展开请购与 BOM 专属导入工作台、GLB 模型查看器、MES 集成指南内容、网格打印设计器、采购询价/申请/订单/退料、销售报价、生产领料/入库明细台账、库存盘点/调拨/转换明细台账、7 项生产排程工作流、工单批量报工、工单缺料/供料处理、外协订单台账/进度抽屉及临时报工二维码打印 helper；服务器信息卡、工艺 IPQC 配置和班次日历等同批组件的能力边界与来源哈希同步记入组件契约和目录。当前账本覆盖 627 个运行时组件引用：328 项实现于 Sunxu MES 套件，245 项映射至通用/上游公开出口，53 项当前标记在宿主层，1 项为工作区实现。页面局部组件源文件中 195/204 完整迁入，9 项确认为页面/内容控制器留在 MES，组件源文件待迁移数为 0。MES 消费端替换与真实宿主视觉验收仍待后续完成。
- 页面源文件 `coverage_state` 中，`MIGRATED_TO_SUNXU_MES` 表示 UI 已迁入；`HOST_SCOPE_CONFIRMED` 表示经源码核对属于完整 MES 路由/控制器，继续由宿主拥有；`REVIEW_PENDING_OR_PARTIAL` 才表示组件迁移仍待处理。9 个确认保留项是 BusinessInvoice 详情/列表、采购价目表、集成 API 凭据/内核/Webhook 页面及销售交付/订单/价目表路由；集成指南正文和网格打印设计器已迁入 Sunxu，模板保存/发布与页面路由仍由 MES 宿主负责。
- 以上新组件尚未完成真实 MES 宿主接线与浏览器视口/DOM 几何验收，均保持 `UNVERIFIED`。当前批次先补齐套件和契约，MES 消费端替换仍按用户确认的顺序后续逐项执行。

### MES 消费端逐项替换清单（套件 push 后执行）

完整替换范围以覆盖账本 `page_component_source_snapshot.files` 为准：195 个页面局部组件源、228 个组件符号引用、518 处 JSX 使用；9 个 `HOST_SCOPE_CONFIRMED` 页面/控制器不替换。账本为每个迁入源文件记录了对应 Sunxu 目标文件。下表 10 项是近期补齐、宿主接线复杂度较高的首批组件，不代表完整迁移范围。其余组件按业务域逐批处理，并在账本中逐条核销：

| 业务域 | 源组件文件 | 符号引用 | JSX 使用 |
|---|---:|---:|---:|
| 生产 | 40 | 46 | 60 |
| 销售 | 27 | 36 | 52 |
| 仓库 | 25 | 27 | 90 |
| 采购 | 22 | 24 | 34 |
| 会计 | 19 | 22 | 24 |
| 物料 | 13 | 16 | 17 |
| 业务发票 | 11 | 11 | 14 |
| 质量 | 8 | 9 | 11 |
| 系统 | 8 | 11 | 95 |
| 大屏 | 7 | 8 | 94 |
| 财务 | 6 | 6 | 9 |
| 资金 | 3 | 4 | 4 |
| 设备 | 2 | 3 | 5 |
| 集成 | 2 | 3 | 7 |
| 仪表盘 | 1 | 1 | 1 |
| 临时报工 | 1 | 1 | 1 |

替换调用点时保留现有页面/本地 `detail-ledger` 的服务、权限、URL、保存视图、路由和副作用；可保留薄宿主适配层，再把 Sunxu 组件渲染在原调用位置。

| Sunxu 组件 | MES 调用点 | 必须由宿主保留或注入 |
|---|---|---|
| `GridPrintDesigner` | `src/pages/system/print/templates/index.tsx` | 稳定引用的字段/样例 `dataSource`，先按权限筛字段；纸张参数、预览、模板保存/发布、打印和路由 |
| `PurchaseInquiryDetailLedger` | `src/pages/purchase/inquiries/index.tsx` | 列表/导出、权限、供应商/物料候选、动态列、保存视图、批量打印和询价单导航 |
| `PurchaseRequisitionDetailLedger` | `src/pages/purchase/requisitions/index.tsx` + `detail-ledger.tsx` | URL 状态校验、keep-alive 回页刷新、数量/状态视图、行操作权限、查看订单回调和保存视图 |
| `InternalIssueDetailLedger` | `src/pages/warehouse/internal-issue/index.tsx` | 列表/导出、权限、动态字段、保存视图、详情/新建及行操作、打印 |
| `ProductionReceiptDetailLedger` | `src/pages/warehouse/production-receipts/index.tsx` | 列表/导出、物料/仓库/仓位候选、权限、动态列、保存视图、详情和批量打印 |
| `PurchaseReturnDetailLedger` | `src/pages/purchase/returns/index.tsx` | 列表/导出、详情/交易导航、权限、保存视图和 keep-alive 刷新；编辑/退库弹窗与成功刷新、价格权限、字典/动态字段 |
| `QuotationDetailLedger` | `src/pages/sales/quotations/index.tsx` | URL 状态规范化与业务月日期、列表/导出/打印、保存视图和 keep-alive 刷新、价格权限、绑定物料弹窗和查看订单 |
| `MaterialIssueDetailLedger` | `src/pages/warehouse/material-issue/index.tsx` | 列表/导出、权限/动态字段、保存视图、完成/取消/打印等行操作、详情/新建导航 |
| `PurchaseReceiptDetailLedger` | `src/pages/warehouse/receipts/index.tsx` | URL 采购单/明细筛选、列表/导出、保存视图和 keep-alive 刷新；收货/退货展开、价格权限、质检、成本/编辑/退库动作和分类型打印 |
| `PurchaseOrderDetailLedger` | `src/pages/purchase/orders/index.tsx` | `onlyInTransit` 初始化、保存视图和 keep-alive 刷新、价格权限；同供应商批量收货限制/表单、费用/质检权限、行操作和打印 |

本地 detail-ledger 适配及结构还被 `src/pages/detail-ledger-filter-layout.test.ts`、`src/pages/purchase/requisitions/detail-ledger.test.tsx`、`src/pages/warehouse/internal-issue/InternalIssueDetailLedger.test.ts`、`src/pages/system/print/components/grid-designer/GridPrintDesigner.test.tsx`、`src/pages/sales/quotations/detail-ledger.test.tsx`、`src/pages/warehouse/material-issue/detail-ledger.test.tsx`、`src/pages/warehouse/receipts/detail-ledger.test.tsx`、`src/pages/purchase/orders/layout.test.ts` 引用。替换时保留其适配入口或更新引用；这些测试本轮未运行。
