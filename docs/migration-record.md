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
- `EntityThumbnail` 未传 `size` 时读取 Ant Design 主题 `controlHeight`，与 MES 原有主题尺寸保持一致；调用方传入的显式尺寸仍优先。
- 七项均已从 `sunxu-web/mes` 导出，并加入 MES 套件目录的金额显隐、快照 Popover、日期/用户回退、推荐工艺路线、客户物料规格和图片预览示例。契约细节和完整覆盖账本同步更新；这一批没有替换 `mes-admin` 消费页面。
- 更新后账本中已有实现的 MES/通用组件引用为 23 项，待补实现为 64 项，需按变更源契约复核仍为 16 项；运行时源文件中已实现为 21 项、待补为 82 项。实现数仅表示套件已有组件契约，不代表已迁移 MES 页面调用点。
- `ResizableTable` 真实目录路由的列宽拖拽与排序后刷新、列显隐与导出列数、密度、空态、双击回调、服务端/本地排序、汇总、视口高度及窄屏键盘横向滚动证据见 [`docs/verification/mes-resizable-table-2026-11-20/README.md`](./verification/mes-resizable-table-2026-11-20/README.md)。

## MES 组件覆盖扩展（2026-11-21）

- 本轮来源固定为 `mes-admin@8f3eb022977ee3fe4bff856f1bcf1b2fd5f625e8`；来源工作区仅用于读取和哈希核对，不修改来源代码。逐条映射与每个页面组件源文件的当前状态见 [覆盖账本](./migrations/mes-admin-component-coverage-2026-11-20.json)。
- 新增的 MES UI 套件实现继续使用 AntD/Pro 能力，并把数据服务、权限结果、路由、上传/打印窗口、字典和业务反馈通过 types 明确注入。目录示例用于展示消费接法；非 JSX 的工单临时报工二维码打印 helper 单独登记在 `supplemental_page_local_ui_helpers`，不混入 JSX 引用计数。
- 本轮完成的页面局部迁移包括仪表盘快捷入口、公式设计器、FQC 规则面板、BOM 展开请购与 BOM 专属导入工作台、GLB 模型查看器、MES 集成指南内容、网格打印设计器、采购询价/申请/订单/退料、销售报价、生产领料/入库明细台账、库存盘点/调拨/转换明细台账、7 项生产排程工作流、工单批量报工、工单缺料/供料处理、外协订单台账/进度抽屉及临时报工二维码打印 helper；服务器信息卡、工艺 IPQC 配置和班次日历等同批组件的能力边界与来源哈希同步记入组件契约和目录。当前账本覆盖 627 个运行时组件引用：328 项实现于 Sunxu MES 套件，245 项映射至通用/上游公开出口，53 项当前标记在宿主层，1 项为工作区实现。页面局部组件源文件中 195/204 完整迁入，9 项确认为页面/内容控制器留在 MES，组件源文件待迁移数为 0。MES 消费端替换与真实宿主视觉验收仍待后续完成。
- 页面源文件 `coverage_state` 中，`MIGRATED_TO_SUNXU_MES` 表示 UI 已迁入；`HOST_SCOPE_CONFIRMED` 表示经源码核对属于完整 MES 路由/控制器，继续由宿主拥有；`REVIEW_PENDING_OR_PARTIAL` 才表示组件迁移仍待处理。9 个确认保留项是 BusinessInvoice 详情/列表、采购价目表、集成 API 凭据/内核/Webhook 页面及销售交付/订单/价目表路由；集成指南正文和网格打印设计器已迁入 Sunxu，模板保存/发布与页面路由仍由 MES 宿主负责。
- 以上新组件尚未完成真实 MES 宿主接线与浏览器视口/DOM 几何验收，均保持 `UNVERIFIED`。当前批次先补齐套件和契约，MES 消费端替换仍按用户确认的顺序后续逐项执行。

### MES 消费端首批高复杂度清单（10/10 已接入）

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

| Sunxu 组件 | MES 调用点 | 必须由宿主保留或注入 | 状态 |
|---|---|---|---|
| `GridPrintDesigner` | `src/pages/system/print/templates/index.tsx` | 稳定引用的字段/样例 `dataSource`，先按权限筛字段；纸张参数、预览、模板保存/发布、打印和路由 | 已接入 |
| `PurchaseInquiryDetailLedger` | `src/pages/purchase/inquiries/index.tsx` | 列表/导出、权限、供应商/物料候选、动态列、保存视图、批量打印和询价单导航 | 已接入 |
| `PurchaseRequisitionDetailLedger` | `src/pages/purchase/requisitions/index.tsx` + `detail-ledger.tsx` | URL 状态校验、keep-alive 回页刷新、数量/状态视图、行操作权限、查看订单回调和保存视图 | 已接入 |
| `InternalIssueDetailLedger` | `src/pages/warehouse/internal-issue/index.tsx` | 列表/导出、权限、动态字段、保存视图、详情/新建及行操作、打印 | 已接入 |
| `ProductionReceiptDetailLedger` | `src/pages/warehouse/production-receipts/index.tsx` | 列表/导出、物料/仓库/仓位候选、权限、动态列、保存视图、详情和批量打印 | 已接入 |
| `PurchaseReturnDetailLedger` | `src/pages/purchase/returns/index.tsx` | 列表/导出、详情/交易导航、权限、保存视图和 keep-alive 刷新；编辑/退库弹窗与成功刷新、价格权限、字典/动态字段 | 已接入 |
| `QuotationDetailLedger` | `src/pages/sales/quotations/index.tsx` | URL 状态规范化与业务月日期、列表/导出/打印、保存视图和 keep-alive 刷新、价格权限、绑定物料弹窗和查看订单 | 已接入 |
| `MaterialIssueDetailLedger` | `src/pages/warehouse/material-issue/index.tsx` | 列表/导出、权限/动态字段、保存视图、完成/取消/打印等行操作、详情/新建导航 | 已接入 |
| `PurchaseReceiptDetailLedger` | `src/pages/warehouse/receipts/index.tsx` | URL 采购单/明细筛选、列表/导出、保存视图和 keep-alive 刷新；收货/退货展开、价格权限、质检、成本/编辑/退库动作和分类型打印 | 已接入 |
| `PurchaseOrderDetailLedger` | `src/pages/purchase/orders/index.tsx` | `onlyInTransit` 初始化、保存视图和 keep-alive 刷新、价格权限；同供应商批量收货限制/表单、费用/质检权限、行操作和打印 | 已接入 |

## MES 消费端替换进展（2026-11-22）

- 本批已把采购订单筛选/视图、采购退料、销售报价物料绑定、入库质检、质量检验动作、销售退货、销售出库详情/明细/动作、库存盘点明细、生产工单表单/批量报工、生产班次日历和排程甘特视图接到 `sunxu-web/mes`。各调用点保留在原路由与原结果区；MES 继续提供服务请求、权限、字典/自定义字段、导航、打印和成功后的刷新。
- 销售出库编辑入口由 Sunxu `SaleDeliveryEditorModal` 承载，MES 页面通过 `renderEmbeddedEditor` 渲染宿主编辑器；旧出库菜单、抽屉、行面板和台账重复 UI 已删除。Sunxu 目标保留本地用户布局：详情抽屉 `90vw`，明细按 max-content 横向滚动，且不用额外 Card 包装。
- 生产甘特使用 Sunxu `ProductionScheduleGanttView`。宿主可配置待排产面板位置、容量条位置和右键是否选择记录；MES 设置为旧版右侧待排产面板、底部容量条及右键清空选择。Sunxu 未排产卡片的单击排产动作可选，MES 未提供时不显示，以维持旧版拖放交互。
- 本批验证：mes-admin 相关 Jest 20 suites / 244 tests 通过；Admin 生产构建通过；Sunxu `npm run build`、`npm run typecheck` 和 Admin `check:sunxu-contract` 通过。Sunxu 当前组件契约版本仍需在消费端更新到本批新提交后，Admin 最终锁定类型检查再复核。
- 本地开发 UI 因 `useAmountDisplay` 从未就绪的 access provider 读取 `canViewPrices` 而崩溃，且后端代理 `127.0.0.1:6033` 不可用；本批真实业务路由的截图、视口和 DOM 几何验收为 `UNVERIFIED`。Gantt 排程面板的响应式几何也需要在正常宿主会话中复核。
- 这只是消费端替换进展，不代表 MES 所有共享组件引用都已迁完。尚余组件继续按原固定覆盖账本和逐模块 AST 导入盘点核销；迁移期间不得把 `HOST` 分类视为排除理由，宿主能力仍可通过 Sunxu capabilities 注入。

## 单据行自定义字段列 helper（2026-11-22）

- 将 Admin 本地 `documentLineCustomFieldColumns.tsx` 的单据行自定义字段规则与列 UI helper 迁入 `src/mes/components/documentLineCustomFieldColumns.tsx` 并从 `sunxu-web/mes` 导出；FormItems 与新列 helper 共用字段显隐/排序、选项、必填和日期转换规则。schema、API、权限、行数据策略和持久化仍由 MES 宿主负责。
- 公共契约保留显隐/宽度、表单值、payload、公式只读列、AntD/Pro 列、systemFields 投影、稀疏行密集化、quantity→qty 回退、按行序应用预览及聚合非法值返回 null；9 条 Node 契约测试覆盖 Admin 原有 helper 断言。
- 验证：9/9 契约测试、`npm run typecheck`、`npm run build:lib`、`npm run build:catalog` 通过。Catalog 浏览器示例在 1440×960 与 390×844 视口呈现；DOM 读数分别为页面宽度 1440/390 且 `scrollWidth` 均等于视口宽度，卡片宽 1118/324px、卡片内容 `scrollWidth` 均未超过自身宽度；应用模拟公式预览可见行值更新，未捕获页面级 JS 错误。截图与几何记录见 [`docs/verification/document-line-custom-fields-2026-11-22/README.md`](./verification/document-line-custom-fields-2026-11-22/README.md)。
- 该浏览器证据只覆盖组件目录的本地确定性示例；真实 MES 路由、宿主 API 接线、键盘路径、深色主题及真实页面内表格横向滚动仍未验收，保持 `UNVERIFIED`。当前开发宿主启动会被未初始化的 access provider 与不可用的本地 API 代理阻断。

## MES 公共控件与详情容器收口（2026-11-22）

- 表单/字典控件复核确认请求、权限、字典状态、帮助文案、校验、只读与禁用属性均由既有 `sunxu-web/mes` 控件完整承载；修复配置入口链接可访问名称缺少可见操作文案的问题，并加入 SSR 回归覆盖权限隐藏与名称包含可见文案。
- `SendAttachmentRow` 不再直接调用库内文件下载 helper。采购单和报价的附件下载由 Admin 宿主 `downloadAttachment` capability 执行；没有下载 capability 时仍可预览授权附件，但不显示下载按钮。无附件的对账单发送流程无需额外 capability。
- 新增 `MesDetailPageContainer`，用于组合 `DetailScreenContainer`、MES 标题/状态/操作、面包屑、宿主审批节点、正文和固定页脚；数据加载、keep-alive、路由、权限与审批 API 仍由宿主拥有。`ListScreenContainer` 工具栏补齐窄宽换行约束，并保持在结果区紧邻位置。
- SSR 呈现验证 10 项通过；Sunxu 类型检查和构建通过。MES 类型检查与生产构建在更新依赖提交后执行。真实浏览器点击流程、实际 MES 页面截图与 DOM 几何仍为 `UNVERIFIED`。

## MES 宿主壳层与顶栏组件收口（2026-11-22）

- `AnnouncementBanner`、`MenuSearch`、`BusinessSideNav` 的公告、搜索框和侧栏呈现已由 `MesAnnouncementBanner`、`MesMenuSearchInput`、`MesBusinessSideNavView` 承载。公告请求/轮询、菜单搜索快捷键、权限过滤、路径判断、导航与菜单历史仍由 Admin 注入。
- MES 的纯图标顶栏操作统一使用通用 `HeaderActionButton`；提示、徽标、弹层、权限、请求、主题持久化和 ProLayout 更新仍由宿主控制。通知、主题选项、应用下载和支持联系方式呈现分别由 `MesNotificationPanel`、`MesThemeOptionsPanel`、`MesAppDownloadPanel`、`MesSupportQRCode` 提供，二维码 renderer 与值由宿主注入。
- `DetailPageShell` 的公共详情标题、状态、审批插槽、正文、操作区和加载/错误/空态使用 `MesDetailPageContainer`。数据加载、重试、路由、keep-alive、授权结果、审批服务和页面差异仍归 Admin。
- `MesNotificationPanel` 用 Ant Design `Listy` 重组通知项，保持小列表非虚拟化、标题/摘要/时间布局及单条已读按钮语义，避免继续使用 AntD 6 已弃用的 `List`。
- 新增组件均在 `MesPatternComponentsDemo` 有可运行的宿主注入示例，并同步更新组件映射与契约。定向 SSR/契约测试 25 项、Sunxu 类型检查及通用层/MES 套件/目录构建通过；Admin 精确依赖锁定后的类型检查、契约检查和生产构建待完成。
- 真实 MES 页面仍无法启动：`useAmountDisplay` 在 access provider 尚未初始化时读取权限导致崩溃，且 API 代理 `127.0.0.1:6033` 不可用；工具链不能读取此前授权测试会话的 DOM。因此真实路由、视口截图、键盘流程和几何/溢出为 `UNVERIFIED`。

detail-ledger 适配仍由 `src/pages/purchase/requisitions/detail-ledger.test.tsx`、`src/pages/warehouse/internal-issue/InternalIssueDetailLedger.test.ts`、`src/pages/system/print/components/grid-designer/GridPrintDesigner.test.tsx`、`src/pages/warehouse/material-issue/detail-ledger.test.tsx` 覆盖；本轮运行了 `src/pages/detail-ledger-filter-layout.test.ts`、销售报价明细、采购订单布局及采购入库明细相关测试。后续迁移继续复用这些宿主行为用例。
