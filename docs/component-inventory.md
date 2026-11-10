# Sunxu → Sunxu Web 组件映射

Sunxu Web 将现有 React Native 组件的稳定用户任务映射到 Web 端的权威库；不把 React Native 文件原样搬进 Web 包。`AntD/Pro direct` 代表复用上游公开 API，不另造一个导出名义相同的包装组件。

## Sunxu 自有 Web 组件

这些组件表达 Sunxu 现有契约在 Web 端的可复用缺口：

| 组件 | Web 实现 |
|---|---|
| `ScreenContainer` | Web 工作区主区和统一内边距 |
| `PageHeader` | 有条件渲染的页面标题、说明、面包屑和操作插槽 |
| `ListScreenContainer` | 标题 → 紧邻列表工具栏 → 结果区 |
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

## MES 基线组件覆盖

MES 固定提交 `e92d02d7cf2269cf8c564a60ff6a00255e903c8e` 的组件盘点共 393 个文件。Sunxu Web 纳入全部 49 个跨项目通用组件文件：9 个由本库现有 Web 语义组件承接，33 个直接使用 Ant Design / Pro Components，6 个由宿主组合平台能力，1 个触控滑动模式暂缓。页面私有、MES 领域和宿主集成的 344 个文件不进入共享 UI runtime。

逐文件来源路径、原始 SHA-256、目标状态和目标 API 见 [MES 组件迁移账本](./migrations/mes-components.json)。目录的“组件映射”页展示可搜索映射；Ant Design 原生组件不由 Sunxu Web 再包一层或重新导出。来源 checkout 当前不在工作区，账本沿用固定提交的来源审计哈希，并注明了本轮无法重新读取原始实现的限制。
