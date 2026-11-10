# Web 组件契约

## 共用边界

所有原子控件和 Pro 模板的状态以 Ant Design / Pro Components 当前公开 API 为准。Sunxu Web wrapper 不复制按钮、输入框、弹窗、表格或表单字段的交互状态；宿主保留数据请求、状态值、路由、权限决定和动作结果。

新增或变更 wrapper 时，同步记录职责、上游来源、API、状态、间距所有者、响应式规则、无障碍和已验证视口。本文列出的 wrapper 是当前公开自有层。

## 组件目录

| 组件 | Layer / 稳定任务 | Source of truth |
|---|---|---|
| `SunxuWebProvider` | 主题基础；应用主题和 Ant Design 上下文 | AntD `ConfigProvider` / `App` + Sunxu semantic tokens |
| `ScreenContainer` | 页面根结构；提供一致的工作区内边距 | `main` + `--sxw-space-*` |
| `PageHeader` | 识别当前页面并放置页级动作 | AntD `Breadcrumb` / `Typography`；`headingLevel` 默认 1 |
| `ListScreenContainer` | 组织特殊列表的标题、紧邻工具栏和结果区 | `ScreenContainer` + `PageHeader`；标准 CRUD 列表优先用 `CrudListWorkbench` |
| `CrudListWorkbench` | 组合分类/状态、轻筛选、高级筛选、视图插槽与 ProTable | `ListScreenContainer` + `FilterBar` + `StatusTabs` + Pro Components 3 ProTable |
| `SavedViewBar` | 选择和管理受控的系统/个人列表视图 | AntD Tabs / Dropdown / Modal；视图数据和持久化由宿主提供 |
| `FormScreenContainer` | 分离可滚动表单内容和固定 footer | `ScreenContainer` + `StickyActionBar`；ProForm 归宿主 |
| `DetailScreenContainer` | 组织详情内容和固定操作区 | `ScreenContainer` + `PageHeader` |
| `StickyActionBar` | 承载固定流程动作 | 语义 `<footer>` + AntD Button |
| `SectionCard` | 分组可选标题的内容，不制造空 header | Pro Components `ProCard` |
| `StatusTabs` | 在互斥状态中选择当前结果集合 | AntD `Segmented` |
| `FilterBar` | 收纳查询条件和其右侧同级操作 | HTML `role=search` + 宿主控件 |
| `MetricCard` | 显示一个可读的关键数值 | AntD `Statistic` + Pro `ProCard` |
| `DetailCard` | 将属性按标签和值组成信息组 | AntD `Descriptions` + Pro `ProCard` |
| `SettingsRow` | 显示设置、链接或单一行操作 | 语义 `<a>` / `<button>` / `<div>` + AntD icon |
| `ProfileIdentity` | 组合头像、姓名和宿主摘要字段 | AntD `Avatar` / `Button` / `Typography` |
| `ChartPanel` | 给宿主图表提供统一标题和数据状态 | Pro `ProCard` + AntD `Spin` / `Empty` / `Alert` |
| `ErrorBoundary` | 隔离渲染错误并提供宿主兜底/重试 | React error boundary + AntD `Result` |
| `PermissionGuard` | 消费宿主已计算的授权结果 | 受控 `permitted` prop；不做权限决策 |
| `EditableDetailTable` | 编辑重复明细行，选择多行并按字段批量设置 | AntD ProTable + 受控 `rows`；请求和业务字段由宿主提供 |
| `BatchFieldSettingsButton` | 让用户勾选要覆盖的字段并应用到已选行 | AntD Modal / 表单控件；patch builder 由宿主提供 |
| `RemoteSelect` | 用 AntD Select 展示远程候选并防抖搜索 | AntD Select；`onSearch` 由宿主提供 |
| `LongText` | 在表格单元格显示截断文本并打开完整内容 | AntD Typography + Modal |

## 关键契约

### `SunxuWebProvider`

- **API**：`children` 必填；`appearance` 为 `light | dark`，缺省 `light`；`locale` 默认 `zhCN`；`theme` 按 AntD `ThemeConfig` 做 token 合并。
- **状态与恢复**：受控，不自行读写 localStorage 或系统偏好；宿主改变 `appearance` 即切主题。
- **可访问性/组合**：只增加 AntD ConfigProvider / App 上下文，不增加可见文案或额外导航层。

### 页面容器

- **API**：`ScreenContainer` 接收 `children`、`className`、`style`。List/Form/Detail 容器接受插槽 `toolbar` / `children` / `footer`，页级 `title`、`description`、`actions` 仅在有内容时渲染；`headingLevel` 可用于嵌套预览，默认 `1`。
- **状态**：容器不管理请求、加载、空结果或表单提交；对应内容由宿主传入。Form/Detail 的 footer 单独固定，内容滚动区不得覆盖它。
- **响应式**：默认页面内边距桌面 24 px，窄屏 16 px；列表工具栏在 768 px 以下换行并保持在结果区之前。
- **可访问性**：页面根使用 `main`，标题保持单一主标题，页级操作由 AntD Button/Menu 提供语义和键盘行为。
- **邻接规则**：`ListScreenContainer` 的 `toolbar` 紧贴结果区，不接受独立远置的 list action header。

### `CrudListWorkbench`

- **职责**：标准 CRUD 列表的组合层。把分类 Tab、状态 `StatusTabs`、筛选栏、可选视图栏、可选层级筛选和 ProTable 放在统一的结果工作区；不实现基础表格、字段、查询服务或业务 CRUD。
- **首开任务**：开发者打开目录的 CRUD 列表工作台示例，先看到产品列表与分类/状态入口；场景切换器可查看轻量、分类/状态、复杂视图和 ProTable 原生查询四种组合。组件运行时本身不持有最近列表或路由；宿主决定默认筛选和深链恢复。
- **API**：`tableProps.columns` 与 `rowKey` 必填；其余公开 ProTable 参数可传入。为避免重复布局，`search`、`headerTitle`、`toolbar`、`toolBarRender` 由工作台控制。列 schema 能表达的查询字段通过 `proTableSearch` 启用 ProTable 原生查询表单；它支持 ProTable 的响应式 `span`、折叠数量和展开/收起行为。自定义 `search`、`quickFilters`、`filterActions`、`primaryTabs`、`statusFilters`、`toolbarActions`、`viewBar`、`appliedFilters`、`facetSidebar` 为可选插槽。`advancedFilters` 提供 `children`、已应用数量、受控/非受控 `open`、`onApply`、`onReset`、`onCancel` 和失败回调。
- **状态/恢复**：高级筛选抽屉打开时由宿主字段控件持有草稿；“重置”只清草稿，“取消/关闭”调用 `onCancel` 保留已应用结果，“应用”调用宿主 `onApply`。返回 `false` 或抛错时抽屉保持打开，错误时显示可恢复提示。`open` 存在时为受控模式，宿主必须响应 `onOpenChange`；省略 `open` 时由工作台管理开关。加载、空、错误、分页、排序和行选择状态由 ProTable/宿主传入。
- **Facet**：`facetSidebar` 只用于高频层级导航。工作区有效宽度低于 `facetSidebarBreakpoint`（默认 1024px）时，同一内容移入左侧 Drawer；组件用 ResizeObserver 测量列表内宽，不用浏览器 viewport 猜测。
- **布局与响应式**：主分类 Tab 在左，状态 Segmented 与列表动作在右；少量外部快捷筛选与关键字在宽度允许时保持同一行。`responsiveQuickFilters` 默认启用，工作台测量实际容器和筛选控件宽度；宽度不足时将快捷筛选折叠到“展开筛选”区域，用户可展开查看并再次收起，空间恢复后自动回到单行。ProTable 原生查询表单按自身响应式 `span` / `defaultFormItemsNumber` / `defaultCollapsed` 规则处理；两种查询方式避免重复配置同一业务字段。内容不足 900px 时主操作换行；不足 767px 时筛选区纵向组织。ProTable 的横向滚动/列配置由 `tableProps` 公共 API 控制，不覆盖内部 class。
- **状态筛选所有权**：分类由 `primaryTabs` 或 Facet 二选一；状态由 `statusFilters` 或宿主快捷条件二选一；不要在视图标签、快捷控件和抽屉重复同一字段。
- **边界**：请求与 `params`、过滤值、表单/提交/删除、批量操作权限及失败语义由宿主提供。改变外部筛选应通过宿主 `tableProps.params` 或 `dataSource`；`onApply` 负责提交抽屉草稿。列/刷新等 ProTable options 默认关闭，仅在宿主明确传入时显示。
- **可访问性**：筛选区用 `FilterBar` 的 `role=search` 和必需名称；分类 Tab 与状态 Segmented 分别提供可读名称和选中态；筛选图标按钮有 `aria-label`，Tooltip 可键盘聚焦；Drawer/ProTable 原生键盘和焦点行为不被覆盖。Facets 用具名 `<aside>` / Drawer。
- **间距与主题**：父级 `ListScreenContainer` 拥有页面内边距；工作台只管工具组间距。颜色使用 `--sxw-*` 语义变量，ProTable/AntD 控件几何遵循上游 token。
- **证据**：`examples/catalog` 的 CRUD 列表工作台真实路由覆盖自定义筛选自动折叠与 ProTable 原生查询模式；结果见 `docs/verification/crud-list-workbench-2026-11-10/`。未覆盖的状态仍为 `UNVERIFIED`。

### `SavedViewBar`

- **职责**：提供受控系统/个人视图切换、另存为、个人视图重命名/删除、设默认、相邻排序；未保存修改时提供保存并切换、放弃并切换、继续编辑。
- **API**：`views: { id, name, scope: system | personal, isDefault? }[]`、`onChange` 必填；`activeViewId`、`dirty`、`loading` 受控；`onSave`、`onSaveAs`、`onRename`、`onDelete`、`onSetDefault`、`onReorder` 可选。操作回调可以同步或返回 Promise；返回 `false` 或 reject 表示未成功。
- **状态/恢复**：加载中有 Spin 并禁止重复变更；回调失败保留当前视图，显示通用恢复提示并把原错误传给 `onActionError`。删除个人视图要求二次确认；系统视图不可重命名/删除；仅个人视图可保存覆盖。
- **持久化与快照**：不读写本地存储或调用 API。宿主提供系统/个人视图和访问权限，并只保存允许的筛选、排序、列可见性/顺序/固定状态；不保存授权决定、选择行、临时抽屉草稿或业务动作。
- **布局与可访问性**：视图选择使用 AntD Tabs；保存/另存为、管理当前视图的动作在同一工具条；按钮有可读名称，切换确认使用 AntD Modal 并提供三个明确退出路径。
- **证据**：随 `CrudListWorkbench` 复杂视图示例在上述目录记录；未验证的键盘/视口状态仍标 `UNVERIFIED`。

### `SectionCard`

- **API**：`title`、`subtitle`、`extra` 可选；`children` 必填。
- **状态**：展示型容器；交互/加载/错误由内容项自身承担。没有标题和辅助信息时由 ProCard 不生成空标题区。
- **布局**：ProCard `variant="outlined"` 管理内部边框；`styles.body` 管理公开的 body 样式入口；父级管理卡片间距。禁止页面覆盖 ProCard 内部 DOM 样式。
- **上游选择**：直接使用 `ProCard` 可以表达单个普通卡片；当需要一致地遵守 Sunxu 标题可选、无空 header 契约时使用此 wrapper。

### `StatusTabs`

- **API**：受控 `items: { key, label, count?, disabled? }[]`、`value`、`onChange`、必填 `ariaLabel`，可选 `size`。
- **状态**：选中值由宿主保存；disabled 项不可选；不含请求或数据缓存。
- **语义**：它表达互斥筛选值，因此基于 AntD `Segmented`（radiogroup 语义）而不是伪装成页面路由。数字 count 仅在帮助理解集合数量时传入。
- **响应式**：可换行的父级优先；空间不足时由宿主明确选择滚动容器，不截断标签。

### `FilterBar`

- **API**：`children` 提供筛选控件，`actions` 提供同级操作，`ariaLabel` 必填。
- **可访问性**：使用 `role=search` 并有可读标签；字段继续使用 AntD 原生 label/aria 契约。
- **状态与布局**：筛选值、提交、重置和查询请求都由宿主管理；字段区域可换行，操作区域保持在工具栏内。
- **上游选择**：复杂查询表单优先使用 Pro Components `QueryFilter`；本组件只服务于已有控件组合的轻量筛选工具栏。

### `MetricCard` 与 `DetailCard`

- `MetricCard` 只组织标题和 `Statistic` 属性；数值、单位、精度及格式化由宿主决定。值加载或错误时宿主切换外层状态组件，不能显示伪造的默认指标。
- `DetailCard` 使用 `Descriptions` 的 `items`、`column` 和响应式能力；数据映射与权限脱敏由宿主负责。字段标签和值必须可辨认。
- 两者由 ProCard 拥有容器样式；父容器拥有彼此间距。无标题时不留空 header。

### `SettingsRow` 与 `ProfileIdentity`

- `SettingsRow` 根据 API 生成原生链接、按钮或静态行；禁用只用于按钮，不将不可操作信息伪装成可点击。标签是可访问名称，description 仅在补充必要信息时传入。
- `ProfileIdentity` 默认只读。仅提供 `onAvatarPress` 才把头像变成按钮，此时 `avatarActionLabel` 是必需的语义补充（缺省文案为“更换头像”）；上传、图片选择和资料权限仍由宿主负责。

### `ChartPanel`

- **API**：`state` 为 `ready | loading | empty | error`，缺省 `ready`；`children` 是图表/数据可视化插槽。`onRetry` 决定错误态是否出现可执行的重试按钮。
- **状态反馈**：加载使用 `Spin` 且宣布 busy；空态使用 `Empty`；错误态使用 `Alert`，错误恢复由 `onRetry` 托管。
- **边界**：不包含图表引擎、数据请求、坐标/格式规则；宿主负责提供有可访问摘要及必要数据表替代的图表内容。

### `ErrorBoundary` 与 `PermissionGuard`

- `ErrorBoundary` 捕获后代 React 渲染错误，使用默认 `Result` 和重试；宿主可以提供 fallback render、`resetKey` 和日志回调。它不捕获普通异步请求错误。
- `PermissionGuard` 只接受宿主的 `permitted` 布尔结果；无权限策略、角色含义和数据范围全部留在宿主/服务端。fallback 由宿主决定，不默认制造权限文案。

### `EditableDetailTable` 与 `BatchFieldSettingsButton`

- **输入**：受控 `rows` / `onRowsChange`、`rowKey`、列 `render(row, index, update)` 和 `createRow` 必填；`cloneRow` 决定复制时如何生成新行身份。`minRows` 缺省 `0`，只在删除后补足，不因初始空数据自动创建行。
- **批量状态**：仅传入 `batchOperations` 才开启选择。`fields` 支持 text / number / date / select；每个字段须由用户单独勾选后才会覆盖。勾选后留空代表清空该字段；`required` 字段不能留空。可选 `autoSelectNewRows` 在新增行后选择新行。行顺序以 `rows` 为准，不以勾选顺序重排。
- **宿主边界**：`mapRowPatch` 可按行转换同一批量 patch；`onBatchApplied` 用于通知上层已应用行和 patch。组件不做请求、权限、业务校验、字段联动或保存。
- **删除/复制**：单行删除及批量删除都会遵守 `minRows`；`canRemoveRows` 由宿主提供额外约束。批量删除在 ProTable 选择操作区确认，批量复制需提供 `cloneRow`。操作结果仍只更新受控草稿，不自动提交。
- **布局与响应式**：使用 ProTable 原生行选择提示和 `tableAlertOptionRender`，批量操作在表格选择提示区；新增明细在紧邻表格的工具栏。列宽超过可视区时由表格局部横向滚动，并显示“左右滚动查看其余列”提示；页面本身不横向溢出。
- **可访问性**：列编辑控件按宿主提供的 AntD 控件名称呈现；行操作图标按钮带可读 `aria-label`。Modal 的焦点和键盘行为由 AntD 管理。组件须放在 `SunxuWebProvider` 或其他 AntD `App` 上下文内。
- **证据**：目录真实路由、桌面/窄屏几何、局部横向溢出提示、键盘行选择、批量设置应用和深色主题在 `docs/verification/mes-web-components-2026-11-10/` 记录；读屏器完整流程仍为 `UNVERIFIED`。

### `RemoteSelect` 与 `LongText`

- `RemoteSelect` 继承 AntD Select API，`onSearch` 存在时启用搜索、关闭本地候选过滤，并以 `searchDebounceTime`（默认 300 ms）防抖。候选加载、请求竞态、分页和错误反馈由宿主负责。
- `LongText` 接受文本或数字，按 `maxLength`（默认 64 个 Unicode code point）截断；只有超长时显示“更多”，点击打开包含完整内容的 AntD 对话框。空值显示 `-`。放入可点击表格行时，展开操作阻止事件冒泡。
- **目录示例**：`examples/catalog/TextControlsPage.tsx` 展示宿主候选搜索和长文本单元格；桌面、窄屏、搜索结果与全文弹层证据见 `docs/verification/mes-web-components-2026-11-10/`。

## 组件状态验收记录

当前新增 wrapper 的 props/状态契约已记录；真实目录渲染、响应式几何、键盘操作及深色主题的最终证据在 `docs/verification/`。未记录的状态都为 `UNVERIFIED`，不能根据 API 推断为已通过。
