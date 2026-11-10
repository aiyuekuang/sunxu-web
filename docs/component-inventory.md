# Sunxu → Sunxu Web 组件映射

Sunxu Web 将现有 React Native 组件的稳定用户任务映射到 Web 端的权威库；不把 React Native 文件原样搬进 Web 包。`AntD/Pro direct` 代表复用上游公开 API，不另造一个导出名义相同的包装组件。

## Sunxu 自有 Web 组件

这些组件表达 Sunxu 现有契约在 Web 端的可复用缺口：

| 组件 | Web 实现 |
|---|---|
| `ScreenContainer` | Web 工作区主区和统一内边距 |
| `PageHeader` | 有条件渲染的页面标题、说明、面包屑和操作插槽 |
| `ListScreenContainer` | 标题 → 紧邻列表工具栏 → 结果区 |
| `CrudListWorkbench` | 分类/状态、轻筛选、可选高级筛选与视图、ProTable 或宿主表格适配器结果区组合 |
| `SavedViewBar` | 受控的系统/个人视图切换和管理操作 |
| `EditableDetailTable` | 受控重复明细编辑、行选择和批量字段设置 |
| `BatchFieldSettingsButton` | 选择批量覆盖字段并在确认后生成宿主 patch |
| `RemoteSelect` | 搜索候选时由宿主请求并由组件防抖的 Select |
| `LongText` | 表格长文本截断和全文查看 |
| `FormScreenContainer` | 表单内容滚动 + 固定底部操作 |
| `DetailScreenContainer` | 详情内容滚动 + 固定底部操作 |
| `StickyActionBar` | 页面级固定动作区 |
| `SectionCard` | 基于 ProCard 的可选标题容器 |
| `StatusTabs` | 基于 AntD Segmented 的受控互斥状态筛选 |
| `FilterBar` | 轻量筛选字段与同级操作组合 |
| `MetricCard` | ProCard + Statistic |
| `DetailCard` | ProCard + Descriptions |
| `SettingsRow` | 链接、单动作或静态信息行 |
| `ProfileIdentity` | Avatar + 姓名 + 宿主摘要插槽 |
| `ChartPanel` | ProCard + loading / empty / error 状态 |
| `ErrorBoundary` | React 边界 + AntD Result |
| `PermissionGuard` | 仅消费宿主授权结果 |
| `SunxuWebProvider` | AntD ConfigProvider / App + Sunxu 色彩主题 |

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

## MES Web 基线组件覆盖

来源是 MES Web 管理端 `../mes-main/mes-admin` 的固定提交 `133e8673e92c24119024f9b4fbcfe2ce5247bf79`，不是 App。`src/components/**` 共盘点 193 个跟踪文件；其中 4 个通用 Web 源文件适配为 `EditableDetailTable`、`BatchFieldSettingsButton`、`RemoteSelect`、`LongText` 四项共享 API。

明细表复合组件采用受控行数据与列渲染回调；选择状态、复制/删除、最少行数、逐字段批量应用由共享层管理。字段 schema、校验、逐行 patch 转换、服务请求、权限及提交副作用由宿主决定。MES 物料选择/价格联动、单据台账、打印、审批、权限码和页面容器不迁入通用 runtime。

其余来源代码映射到目标已有契约或 Ant Design / Pro Components，或标记为宿主/MES 领域/待评估；来源测试和样式只作盘点，不复制。逐文件路径、SHA-256、处理决定见 [MES Web 组件迁移账本](./migrations/mes-web-components.json)。

MES `DocumentViewBar` 的通用视图选择、脏状态切换和视图管理交互由 `SavedViewBar` 承接；`DocumentFilterDrawer` 的筛选草稿、应用/重置/取消容器由 `CrudListWorkbench` 承接。视图 API、权限、字段 schema、筛选值和持久化仍由 MES 宿主负责，来源账本中的页面/领域代码仍标为 HOST。

## 东健 CRM 列表场景

CRM 产品列表的一级产品分类、启用状态分段、关键字、列表操作及 ProTable 结果区可组合为 `CrudListWorkbench` 的分类场景；低频状态切换可以退化为轻筛选。CRM 的产品字段、字典设置、增删改表单、请求和权限仍由 CRM 宿主负责。综合示例位于目录的“CRUD 列表工作台”页，展示轻量、分类/状态、复杂视图和 ProTable 原生查询四种装配方式。
