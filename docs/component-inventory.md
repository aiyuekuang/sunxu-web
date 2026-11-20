# Sunxu → Sunxu Web 组件映射

Sunxu Web 将现有 React Native 组件的稳定用户任务映射到 Web 端的权威库；不把 React Native 文件原样搬进 Web 包。`AntD/Pro direct` 代表复用上游公开 API，不另造一个导出名义相同的包装组件。

## Sunxu 自有 Web 组件

这些组件表达 Sunxu 现有契约在 Web 端的可复用缺口：

| 组件 | Web 实现 |
|---|---|
| `ScreenContainer` | Web 工作区主区和统一内边距 |
| `PageHeader` | 有条件渲染的页面标题、说明、面包屑和操作插槽 |
| `ListScreenContainer` | 标题 → 紧邻列表工具栏 → 结果区 |
| `CrudListWorkbench` | 分类/状态、轻筛选、可选高级筛选与视图、ProTable 或宿主表格适配器结果区组合；不渲染页级标题；结果卡片默认使用 16px 水平内边距；fill 模式通过上游公开语义样式槽适配表格高度和底部分页 |
| `SavedViewBar` | 受控的系统/个人视图切换和管理操作 |
| `EditableDetailTable` | 受控重复明细编辑、行选择和批量字段设置 |
| `BatchFieldSettingsButton` | 选择批量覆盖字段并在确认后生成宿主 patch |
| `RemoteSelect` | 搜索候选时由宿主请求并由组件防抖的 Select |
| `LongText` | 表格长文本截断和全文查看；按字符上限或实际宽度溢出显示全文入口 |
| `PermissionButton`（`sunxu-web/mes`） | MES 宿主注入权限判断；统一确认、异步 loading、成功提示和错误恢复 |
| `DocumentModalForm`（`sunxu-web/mes`） | MES 单据表单全屏容器、当前工作区定位、最小化草稿保留与还原 |
| `DocumentCustomFieldPanel`（`sunxu-web/mes`） | 保留单据自定义字段区的空态隐藏、错误展示和单据切换隔离；字段结构与编辑器由宿主渲染 |
| `DocumentLedgerViewSwitch`（`sunxu-web/mes`） | 单据列表与只读明细间的受控切换；页面状态、路由和列表刷新由宿主管理 |
| `DocumentLineQuantityInput`（`sunxu-web/mes`） | 可清空的数量编辑草稿；有效值由宿主控制，空值失焦时恢复最近有效值 |
| `StatusDisplay`（`sunxu-web/mes`） | 宿主注入状态字典，支持 Tag、Badge、文本三种呈现 |
| `AmountText`、`AmountPolicySnapshotTag`（`sunxu-web/mes`） | 按 MES 金额格式展示并通过宿主金额策略脱敏；金额快照可展开查看公式和计算结果 |
| `DateText`、`UserText`（`sunxu-web/mes`） | MES 日期格式与用户姓名/账号回退展示 |
| `DefaultRouteHint`（`sunxu-web/mes`） | 宿主注入工艺路线候选请求，提示未手选时的推荐路线 |
| `CustomerMaterialCell`（`sunxu-web/mes`） | 同时保留销售单据客户物料别名与内部物料身份，并提供一致排序值 |
| `MaterialFilteredSelect`、`MaterialSelectField`、`MaterialMultiSelectField`（`sunxu-web/mes`） | 保留 MES 物料远程搜索、级联筛选、扫码候选校验、单位与自定义字段摘要；API、字典、权限、配置入口和扫码设备由宿主注入 |
| `MasterDataQuickCreateSelect`（`sunxu-web/mes`） | 保留客户/供应商 ProForm 关联选择、候选内快捷新建、创建后权威 ID 与默认值回填；新建表单、API、权限和配置链接由宿主注入 |
| `AccountingBookField`、`FiscalPeriodField`、`VoucherWordField`、`AccountField`（`sunxu-web/mes`） | 会计账簿/期间/凭证字/科目远程选择、账簿联动和默认值；服务端列表、权限与基础资料配置路由由宿主注入 |
| `PurchaseReceiptCapacitySummary`（`sunxu-web/mes`） | 保留采购订单量、已收量、待收量及 MES 单位格式；数量与单位字典由宿主提供 |
| `EntityThumbnail`（`sunxu-web/mes`） | 实体缩略图、空图/损坏图回退、预览和表格行事件隔离 |
| `DrawingFilesInline`、`FileUrlsInline`、`DrawingFilesGallery`、`PdfPreviewDrawer`（`sunxu-web/mes`） | MES 图纸/附件上传、订单头附件关联、分组预览/打印和 PDF 分页缩放；文件代理、原名解析和上传由宿主注入 |
| `ResizableProTable`（`sunxu-web/mes`） | MES 分页列表表格适配：可调列宽、持久化列序/显隐/排序、全局行号、密度、空态、导出布局和单列表视口高度 |
| `ResizableTable`（`sunxu-web/mes`） | 原生 AntD Table 的 MES 明细表适配：可调列宽、可选行号、密度、空态和本地排序 |
| `TableActions`、`TableDensityOption`、`TableEmpty`（`sunxu-web/mes`） | MES 表格的行操作收纳、密度控制和带业务引导的空态 |
| `RowActions` | 表格行操作收纳为省略号菜单（来源：tel_admin `TableActions` 适配） |
| `TableSummary` | 在表格结果区末尾固定展示列合计，或以普通表格行承载多单位摘要；`fullWidth` 由 MES 表格适配器按最终可见列解析，独立适配器可调用 `withResolvedTableSummary`；不承担请求、聚合或单位换算 |
| `PaginationSummary` | 在分页栏左侧显示宿主提供的简短筛选摘要；不承担请求或聚合 |
| `FormScreenContainer` | 表单内容滚动 + 固定底部操作 |
| `DetailScreenContainer` | 详情内容滚动 + 固定底部操作 |
| `StickyActionBar` | 页面级固定动作区 |
| `SectionCard` | 基于 ProCard 的可选标题容器 |
| `StatusTabs` | 基于 AntD Segmented 的受控互斥状态筛选 |
| `StatusTag` | 固定实底样式并为自定义色提供对比文字色的只读状态标签 |
| `FilterBar` | 轻量筛选字段与同级操作组合 |
| `MetricCard` | ProCard + Statistic |
| `DetailCard` | ProCard + Descriptions |
| `SettingsRow` | 链接、单动作或静态信息行 |
| `ProfileIdentity` | Avatar + 姓名 + 宿主摘要插槽 |
| `ChartPanel` | ProCard + loading / empty / error 状态 |
| `ErrorBoundary` | React 边界 + AntD Result |
| `PermissionGuard` | 仅消费宿主授权结果 |
| `SunxuWebProvider` | AntD ConfigProvider / App + Sunxu 色彩主题 |

`CrudListWorkbench` 的 Facet 轨道负责与结果区保持单一 16px 间距并提供受限高度内的溢出滚动；宿主侧栏卡片负责自身边框和内边距，宽度应适配轨道。可运行组合示例见目录的“CRUD 列表工作台”页。

`CrudListWorkbench` 的搜索插槽约束搜索控件不超出筛选行；标准桌面基准宽度为 320px，窄工作区按可用宽度收缩。可运行组合示例见目录的“CRUD 列表工作台”页。

标准新增入口通过 `onCreate` 提供，组件统一文案和位置；`RowActions` 的 `kind` 统一查看、编辑和删除文案，领域操作仍由宿主命名。

## 直接映射到 Ant Design / Pro Components

| Sunxu 组件/任务 | Web 权威实现 |
|---|---|
| `AppText` | `Typography.Text` / `Typography.Title` |
| `ActionButton`, `IconActionButton`, `FilterActionButton` | `Button`；纯图标按钮使用 `aria-label` |
| `ActionMenu`, `PageHeader.headerActions` | `Dropdown` + `Menu` 或页面级按钮 |
| `ActionToast`, `AppToast`, `ToastHost`, `MessageAlert` | `App.useApp()` 的 message / notification |
| `Avatar`, `Badge`, `Divider`, `ProgressBar`, `Skeleton` | Ant Design 同名组件 |
| `BottomSheet`, `ChoiceSheet`, `FullScreenModal`, `EntityPickerModal` | `Drawer` / `Modal` / `Select`，按任务语义选择 |
| `ChipSelectField`, `PickerField`, `EntityPickerField` | `Select` / `Radio.Group` + `Form.Item` |
| `CheckboxField` | `Checkbox` + `Form.Item` |
| `DatePickerField`, `DateRangeQuickSelect` | `DatePicker` / `RangePicker` + `Form.Item` |
| `DateNavigator` | `DatePicker` 与 `Button` 组合，由宿主控制日期和周期 |
| `DrillDownTreePicker`, `TreePickerField` | `Cascader` / `TreeSelect` |
| `EmptyState`, `LoadingView`, `ErrorView` | `Empty`, `Spin` / `Skeleton`, `Alert` / `Result` |
| `FormField`, `FormLabel`, `FormPage` | `Form.Item` / `ProForm` + `FormScreenContainer` |
| `ListCard`, `ListSortSheet`, `MultiSelectBar` | `ProTable` / `ProCard`、table sorter、工具栏与 `rowSelection` |
| `SearchBar`, `FilterQuickControl`, `FilterBar` | `Input.Search`, `Segmented`, `QueryFilter` 或本库 `FilterBar` |
| `MetricCard`, `ChartPanel`, `DetailCard` | 本库语义容器；数据可视化引擎由宿主提供 |
| `PhotoPicker`, `ScanCameraModal`, `ImagePreviewModal` | `Upload` / 原生文件输入、宿主相机能力、`Image.PreviewGroup` |
| `QuickNumInput` | `InputNumber` |
| `ScanInput` | `Input`；扫码键盘/浏览器设备事件由宿主管理 |
| `SelectableChip`, `EntityFilterChip` | `Checkbox.Button` / `Tag.CheckableTag`、`Select` |
| `AudioPlayer` | 浏览器 `<audio controls>`，播放源由宿主提供 |
| 地图/图表控件 | 供应商视图插槽；地图 SDK 和图表引擎不进入基础 peer 列表 |

直接映射项的业务请求、日期值、表单提交、文件权限与错误恢复由宿主管理。基础库通过上游公开组件提供交互状态，不再维护同义包装层。

## 暂不作为通用 Web 控件迁入

| 来源 | 处理 |
|---|---|
| `DialPad` | 属于电话输入交互；仅在明确有跨宿主 Web 需求时作为独立可选模块评估 |
| `PersistentBottomSheet` | Web 侧吸附式常驻面板与 Drawer 生命周期不同；不做同名兼容组件 |
| `SwipeableRow` | 不要求桌面用户依赖触控滑动；使用 ProTable 行操作/Dropdown，并保留键盘入口 |
| `MapScreenContainer` | SDK/地图视图由宿主提供，Web 包不绑定地图供应商或全屏导航 |
| `ScalePressable` | Web 使用语义 button/link 与 AntD hover/focus 状态，不复制 RN 按压动画组件 |
| `ModalRequestCloseContext` | 由 Modal/Drawer 的受控 open、onCancel/onClose 契约承载 |
| 分页实体选择器与通用格式工具 | 业务数据请求、字段字典及格式口径不默认放进 UI 核心包 |

## 映射状态

- **ADAPTED**：上方 Sunxu Web 自有组件已实现，并有组件契约。
- **UPSTREAM**：由 Ant Design / Pro Components 原生 API 承担，不重复导出。
- **HOST**：由宿主的 API、权限、路由、文件/地图/图表供应商承担。
- **DEFERRED**：保留来源职责记录，等待明确的跨宿主 Web 需求。

## MES Web 旧版组件覆盖记录

本节记录早期只建设通用组件层时的边界和处理决定。来源是 MES Web 管理端固定提交 `133e8673e92c24119024f9b4fbcfe2ce5247bf79`，不是 App；当时 `src/components/**` 共盘点 193 个跟踪文件，其中 4 个 Web 交互适配为 `EditableDetailTable`、`BatchFieldSettingsButton`、`RemoteSelect`、`LongText`。

其中明细表复合组件采用受控行数据与列渲染回调；选择状态、复制/删除、最少行数、逐字段批量应用由共享层管理。字段 schema、服务请求、权限及提交副作用由宿主决定。这是当时“通用包只放跨项目组件”的实现快照。

其余来源代码当时映射到目标已有契约或 Ant Design / Pro Components，或标记为宿主/MES 领域/待评估；逐文件路径、SHA-256、旧处理决定见 [MES Web 组件迁移账本](./migrations/mes-web-components.json)。该处理决定不再作为当前迁移目标。

MES `DocumentViewBar` 的通用视图选择、脏状态切换和视图管理交互由 `SavedViewBar` 承接；`DocumentFilterDrawer` 的筛选草稿、应用/重置/取消容器由 `CrudListWorkbench` 承接。视图 API、权限、字段 schema、筛选值和持久化仍由 MES 宿主负责。

### MES 当前运行时代码组件使用快照（2026-11-19）

上面的逐文件迁移账本锁定于旧提交；为避免把旧清点误认为当前覆盖，当前 `mes-admin` 运行时代码另有 [JSX 组件使用快照](./migrations/mes-admin-component-usage-2026-11-19.json)。快照扫描了 1,066 个非生成、非测试 TS/TSX 源文件，记录 627 个导入组件条目、348 个来源模块、13,465 处 JSX 使用和 559 个调用文件；涵盖 Ant Design、Pro Components、Sunxu Web、MES 公共目录、页面局部组件及其他组件包。

当前 `src/components/**` 的逐文件快照另见 [MES 公共组件源文件清单](./migrations/mes-admin-src-components-2026-11-19.json)：共 195 个跟踪文件（146 个运行时源文件、46 个测试文件、3 个样式文件）；其中 102 个运行时文件在扫描范围内被 JSX 直接使用，共 2,137 处。文件清单记录每个文件的 SHA-256，并与使用快照的消费者统计关联。与旧账本来源比较，162 个文件内容未变、31 个文件内容已变、2 个文件新增、0 个文件删除；未变文件沿用旧处理决定，改动和新增文件均标记为需重新核对。

该快照与逐文件清单是当前迁移的完整追踪基线。现在的目标是让每项当前实现都有去向：Sunxu 通用层、Sunxu MES 套件、Sunxu 根层的 AntD/Pro/图标直通出口，或明确保留在宿主的页面控制器。MES 套件组件必须保留当前交互并通过 props/回调接收请求与权限结果；页面、路由和服务实现继续留在宿主。每个实现完成映射并补齐契约后，才进入逐项替换批次。

### 全量覆盖工作账本（2026-11-20）

用户已授权把 Sunxu Web 扩展为“通用层 + MES UI 套件”。逐个 import 条目与 195 个源文件的目标层、旧处置、源文件变化状态和迁移进度记录在 [MES 组件全量覆盖账本](./migrations/mes-admin-component-coverage-2026-11-20.json)。当前 627 个运行时组件引用中，245 项已映射至 Sunxu 通用/上游出口，48 项已有 MES/通用适配实现，1 项在工作区有 StatusTag 实现，13 项需按变更后的 MES 源文件复核契约，42 项仍待补进 `sunxu-web/mes`；另有 278 项明确属于 MES 宿主页面、框架集成或外部平台层。195 个来源文件中，35 项已实现、69 项待补、4 项待按源契约复核。当前尚未达到全量门禁，不开始 MES 页面替换。

替换门禁：每个运行时条目都必须在账本中收敛为 Sunxu 通用组件、Sunxu MES 套件、Sunxu 上游公开 API 或有明确理由的 MES 宿主/外部平台实现；`PENDING` 与 `REVIEW_SOURCE_CONTRACT` 必须清零。MES UI 组件保留现有行为，再把请求、权限、字典和业务副作用改为宿主注入；只有此门禁通过后才开始逐项替换消费者。

## 东健 CRM 列表场景

CRM 产品列表的一级产品分类、启用状态分段、关键字、列表操作及 ProTable 结果区可组合为 `CrudListWorkbench` 的分类场景；低频状态切换可以退化为轻筛选。CRM 的产品字段、字典设置、增删改表单、请求和权限仍由 CRM 宿主负责。综合示例位于目录的“CRUD 列表工作台”页，展示轻量、分类/状态、复杂视图和 ProTable 原生查询四种装配方式。
