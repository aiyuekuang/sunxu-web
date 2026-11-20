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
| `CrudListWorkbench` | 组合分类/状态、轻筛选、高级筛选、视图插槽与表格结果适配器 | `ListScreenContainer` + `FilterBar` + `StatusTabs` + Pro Components 3 ProTable |
| `PaginationSummary` | 在分页栏左侧显示宿主提供的筛选结果摘要 | AntD `Pagination.showTotal`；统计口径由宿主提供 |
| `SavedViewBar` | 选择和管理受控的系统/个人列表视图 | AntD Tabs / Dropdown / Modal；视图数据和持久化由宿主提供 |
| `FormScreenContainer` | 分离可滚动表单内容和固定 footer | `ScreenContainer` + `StickyActionBar`；ProForm 归宿主 |
| `DetailScreenContainer` | 组织详情内容和固定操作区 | `ScreenContainer` + `PageHeader` |
| `StickyActionBar` | 承载固定流程动作 | 语义 `<footer>` + AntD Button |
| `SectionCard` | 分组可选标题的内容，不制造空 header | Pro Components `ProCard` |
| `StatusTabs` | 在互斥状态中选择当前结果集合 | AntD `Segmented` |
| `StatusTag` | 以实底高对比样式呈现单条只读状态 | AntD `Tag`，固定 `variant="solid"` |
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
| `MaterialFilteredSelect` / `MaterialSelectField` / `MaterialMultiSelectField` | 保留 MES 物料筛选、单/多选字段和扫码候选校验 | AntD Select + Pro Components `ProForm.Item`；数据和宿主集成由 `MesUiProvider` 注入 |
| `LongText` | 在表格单元格显示多行预览并按需查看全文 | AntD Popover + Typography / Modal |
| `RowActions` | 把表格行操作收纳进省略号菜单 | AntD Dropdown + Button；操作语义由宿主提供 |
| `TableSummary` | 按列对齐并固定展示宿主提供的表格字段合计 | AntD `Table.Summary.Row/Cell`；聚合口径由宿主提供 |

## 关键契约

### `SunxuWebProvider`

- **API**：`children` 必填；`appearance` 为 `light | dark`，缺省 `light`；`locale` 默认 `zhCN`；`theme` 按 AntD `ThemeConfig` 做 token 合并；`workspaceFrame` 为 `container | host`，缺省 `container`。
- **外框所有权**：`workspaceFrame="container"` 表示 Sunxu 页面容器拥有工作区外框并应用 `--sxw-workspace-gutter`；`workspaceFrame="host"` 表示宿主 shell 已经提供外框，页面容器不再叠加内边距。宿主只能有一个外框所有者。
- **状态与恢复**：受控，不自行读写 localStorage 或系统偏好；宿主改变 `appearance` 即切主题。
- **可访问性/组合**：只增加 AntD ConfigProvider / App 上下文，不增加可见文案或额外导航层。

### 页面容器

- **API**：`ScreenContainer` 接收 `children`、`className`、`style`、语义根元素 `as`（`main | section`，默认 `main`）、`frame`（`inherit | page | none`，默认 `inherit`）和 `fill`（布尔，默认 `false`）。List/Form/Detail 容器同样接受 `frame` / `fill`，以及插槽 `toolbar` / `children` / `footer`；页级 `title`、`description`、`actions` 仅在有内容时渲染；`headingLevel` 可用于嵌套预览，默认 `1`。
- **外框**：`frame="inherit"` 跟随 `SunxuWebProvider.workspaceFrame`；`frame="page"` 自己拥有外框；`frame="none"` 假定父级/宿主拥有外框。嵌套容器必须使用 `frame="none"` 或 `layout="embedded"`，不得叠加第二层页面内边距。
- **填充高度**：`fill` 让容器成为确定高度的纵向 flex 容器（`height: 100%; min-height: 0; overflow: hidden`），`ListScreenContainer` 的 results 区同时成为可收缩的 flex 子项。仅在单列表视口页使用；长页面保持默认，由页面整体滚动。
- **状态**：容器不管理请求、加载、空结果或表单提交；对应内容由宿主传入。Form/Detail 的 footer 单独固定，内容滚动区不得覆盖它。
- **响应式**：外框由 `--sxw-workspace-gutter` 控制（桌面 24 px，窄屏 16 px）；列表工具栏在 768 px 以下换行并保持在结果区之前。
- **可访问性**：页面根使用 `main`，标题保持单一主标题，页级操作由 AntD Button/Menu 提供语义和键盘行为。
- **组合语义**：应用外壳已经提供唯一 `<main>` 时，内层容器使用 `as="section"`；同一页面不得嵌套多个 main landmark。
- **邻接规则**：`ListScreenContainer` 的 `toolbar` 紧贴结果区，不接受独立远置的 list action header。

### `CrudListWorkbench`

- **职责**：标准 CRUD 列表的组合层。把分类 Tab、状态 `StatusTabs`、筛选栏、可选视图栏、可选层级筛选和 ProTable 放在统一的结果工作区；不实现基础表格、字段、查询服务或业务 CRUD。
- **首开任务**：开发者打开目录的 CRUD 列表工作台示例，先看到产品列表与分类/状态入口；场景切换器可查看轻量、分类/状态、复杂视图和 ProTable 原生查询四种组合。组件运行时本身不持有最近列表或路由；宿主决定默认筛选和深链恢复。
- **API**：`tableProps.columns` 与 `rowKey` 必填；其余公开 ProTable 参数可传入。为避免重复布局，`search`、`headerTitle`、`toolbar`、`toolBarRender` 由工作台控制。`layout` 为 `page | embedded`，默认 `page`；`layout="embedded"` 不拥有页面外框、不渲染页头，用于 Tab 面板、卡片或长页面中的子列表。`fill` 为布尔，默认 `false`；`fill` 让工作台成为确定高度的单列表视口页，表格体滚动而表头和分页保持可见。列 schema 能表达的查询字段通过 `proTableSearch` 启用 ProTable 原生查询表单；它支持 ProTable 的响应式 `span`、折叠数量和展开/收起行为。自定义 `search`、`quickFilters`、`filterActions`、`primaryTabs`、`statusFilters`、`toolbarActions`、`viewBar`、`appliedFilters`、`facetSidebar` 为可选插槽。`onCreate` 可选，传入回调后工作台提供统一“新增”主按钮；宿主控制权限及回调，`onCreateDisabled` 控制按钮禁用状态。`toolbarActions` 承载其他列表级动作，不重复渲染新增。`advancedFilters` 提供 `children`、已应用数量、受控/非受控 `open`、`onApply`、`onReset`、`onCancel` 和失败回调。
- **表格适配插槽**：缺省直接渲染 ProTable；宿主需要可调整列宽等扩展时，可传 `renderTable` 接入宿主适配器。回调收到完整的 `tableProps`、工作台选定的 `search`、`options`，且 `headerTitle=false`、`toolBarRender=false`、`toolbar=undefined`。适配器只负责结果表格，不重复绘制列表标题、筛选和列表级操作；工作台仍拥有这些区域并将适配器放在结果区。`fill` 模式下工作台会测量结果区并把解析后的 `scroll.y` 放进 `tableProps.scroll`，同时通过 ProCard `cardProps` 与 Ant Design Table/Spin 的公开语义 `styles`、`classNames` API 建立可收缩的填充链；适配器必须把收到的属性传给 ProTable，不得再自行实现页面级高度测量或删除分页。
- **结果摘要插槽**：`paginationSummary` 由宿主提供，工作台缺省 ProTable 会将其放入分页器的 `showTotal` 公开插槽；自定义 `renderTable` 会收到 `paginationSummary`，适配器应将它传入相应表格组件。原有范围/总数文案保留；关闭分页时不显示摘要。
- **结果卡片内边距**：为避免 ProTable 默认左右 24 px 内边距挤压宽表格，工作台在未显式提供 `tableProps.cardProps` 时，通过 ProTable 公共 `cardProps.styles.body` 将结果卡片的水平内边距统一为 16 px；纵向间距继续由 ProTable 管理。显式传入 `cardProps`（包括 `false`）时由宿主接管结果卡片外观；宿主需用该公开 API 设置样式，不覆盖内部 DOM class。页面工作区外框仍只由 `ListScreenContainer` 或宿主 shell 中的一方拥有。
- **状态/恢复**：高级筛选抽屉打开时由宿主字段控件持有草稿；“重置”只清草稿，“取消/关闭”调用 `onCancel` 保留已应用结果，“应用”调用宿主 `onApply`。返回 `false` 或抛错时抽屉保持打开，错误时显示可恢复提示。`open` 存在时为受控模式，宿主必须响应 `onOpenChange`；省略 `open` 时由工作台管理开关。加载、空、错误、分页、排序和行选择状态由 ProTable/宿主传入；**`fill` 模式下分页的可见位置和表体高度由工作台负责**，宿主不得再用页面级 `:has()` CSS 或外部高度测量控制表体。
- **高度与分页契约**：`fill` 只用于单列表视口页，宿主必须给工作台提供确定的可用高度。工作台根节点、results、layout、table 容器、适配器和 ProTable 的公开卡片/表格/Spin 语义槽形成可收缩的纵向 flex 链；测量只查询工作台注入的语义 class，不依赖 Ant Design 或 Pro Components 的内部类名。工作台用 `ResizeObserver` + `MutationObserver` 测量表头、footer、分页和额外结果内容之外的可滚动高度，并作为 `scroll.y` 传给 ProTable。表头保持其内容所需的自然高度，不参与 flex 收缩；分页始终渲染在结果区底部且不参与收缩，短数据也不会让表格和分页停在结果区上方；表格体在内部滚动。长页面（多卡片、图表或多个列表）不得开启 `fill`，保持默认文档流由页面整体滚动。
- **Facet**：`facetSidebar` 只用于高频层级导航。工作区有效宽度低于 `facetSidebarBreakpoint`（默认 1024px）时，同一内容移入左侧 Drawer；组件用 ResizeObserver 测量列表内宽，不用浏览器 viewport 猜测。桌面侧栏与结果区由 16px grid gap 分隔，间距由工作台单独拥有，Facet 不再叠加末端留白；竖向填充布局中 Facet 受结果区高度约束，超出内容在 Facet 内滚动。侧栏卡片的边框、内边距和内容布局由宿主负责，子内容不得超出 Facet 轨道宽度。
- **布局与响应式**：主分类 Tab 在左，状态 Segmented 在右；列表动作与新增位于紧邻结果区的搜索/筛选行右侧，即使没有筛选也右对齐；少量外部快捷筛选与关键字在宽度允许时保持同一行。`responsiveQuickFilters` 默认启用，工作台测量实际容器和筛选控件宽度；宽度不足时将快捷筛选折叠到“展开筛选”区域，用户可展开查看并再次收起，空间恢复后自动回到单行。ProTable 原生查询表单按自身响应式 `span` / `defaultFormItemsNumber` / `defaultCollapsed` 规则处理；两种查询方式避免重复配置同一业务字段。内容不足 900px 时分类和状态换行；不足 767px 时筛选区纵向组织。ProTable 的横向滚动/列配置由 `tableProps` 公共 API 控制，不覆盖内部 class。
- **状态筛选所有权**：分类由 `primaryTabs` 或 Facet 二选一；状态由 `statusFilters` 或宿主快捷条件二选一；不要在视图标签、快捷控件和抽屉重复同一字段。
- **边界**：请求与 `params`、过滤值、表单/提交/删除、批量操作权限及失败语义由宿主提供。改变外部筛选应通过宿主 `tableProps.params` 或 `dataSource`；`onApply` 负责提交抽屉草稿。列/刷新等 ProTable options 默认关闭，仅在宿主明确传入时显示。`renderTable` 不接管筛选、页面工具栏或数据请求，宿主的表格扩展不得删减当前业务仍需的列、行选择、排序、分页或恢复路径。
- **可访问性**：筛选区用 `FilterBar` 的 `role=search` 和必需名称；分类 Tab 与状态 Segmented 分别提供可读名称和选中态；筛选图标按钮有 `aria-label`，Tooltip 可键盘聚焦；Drawer/ProTable 原生键盘和焦点行为不被覆盖。Facets 用具名 `<aside>` / Drawer。
- **间距与主题**：父级 `ListScreenContainer` 拥有页面内边距；工作台默认使用 `section` 根元素并只管工具组间距。应用外壳不提供 main landmark 时可显式传 `as="main"`。颜色使用 `--sxw-*` 语义变量，ProTable/AntD 控件几何遵循上游 token。
- **证据**：`examples/catalog` 的 CRUD 列表工作台真实路由覆盖自定义筛选自动折叠、ProTable 原生查询和宿主表格适配插槽；原组合验收见 `docs/verification/crud-list-workbench-2026-11-10/`，Facet 间距与目录轨道几何见 `docs/verification/crud-list-workbench-spacing-2026-11-11/`。未覆盖的状态仍标为 `UNVERIFIED`。

- **搜索插槽宽度**：桌面搜索区以 `320px` 为宽度基准、最小 `180px`；搜索控件根节点受插槽宽度约束，不得溢出。工作区窄于 `767px` 时筛选区改为纵向布局，搜索控件仍限于可用宽度。

### `SavedViewBar`

- **职责**：提供受控系统/个人视图切换、另存为、个人视图重命名/删除、设默认、相邻排序；未保存修改时提供保存并切换、放弃并切换、继续编辑。
- **API**：`views: { id, name, scope: system | personal, isDefault? }[]`、`onChange` 必填；`activeViewId`、`dirty`、`loading` 受控；`onSave`、`onSaveAs`、`onRename`、`onDelete`、`onSetDefault`、`onReorder` 可选。操作回调可以同步或返回 Promise；返回 `false` 或 reject 表示未成功。
- **状态/恢复**：加载中有 Spin 并禁止重复变更；回调失败保留当前视图，显示通用恢复提示并把原错误传给 `onActionError`。删除个人视图要求二次确认；系统视图不可重命名/删除；仅个人视图可保存覆盖。
- **持久化与快照**：不读写本地存储或调用 API。宿主提供系统/个人视图和访问权限，并只保存允许的筛选、排序、列可见性/顺序/固定状态；不保存授权决定、选择行、临时抽屉草稿或业务动作。
- **布局与可访问性**：视图标签按基线 MES 的紧凑间距排列，当前标签文字下方显示主题色指示线；每个可管理视图在标签内提供菜单，排序按钮放在 AntD Tabs 右侧扩展区，与导航底线共同布局；保存/另存操作紧邻标签区。窄屏下导航操作与保存操作分行，保存操作右对齐，选中标签自动滚动到可见位置；管理菜单、排序和命名弹窗提供可读名称及键盘可操作的按钮。
- **证据**：`examples/catalog` CRUD 列表工作台的复杂视图真实路由，以及桌面/窄屏标签栏、管理菜单、排序、未保存、另存和切换确认的截图与 DOM 几何数据记录于 `docs/verification/saved-view-bar-mes-alignment-2026-11-16/`；排序控件与导航底线间距在宽/窄视口验证。未覆盖的键盘读屏流程、深色主题和其他视口仍标 `UNVERIFIED`。

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

### `StatusTag`

- **API**：`children` 提供可见状态文案；`color` 接受 AntD 预设色或 CSS 颜色；可选 `icon`、`className`、`style`。缺少颜色或传入 `default` 时使用中性灰底。
- **视觉与可读性**：固定使用 AntD `Tag` 的 `variant="solid"`；自定义颜色使用 `contrast-color()` 选择黑/白前景，并提供十六进制色的前景回退值，避免浅色实底上的白字难读。
- **状态与边界**：展示型、不可关闭、不可点击；状态文案和颜色映射由宿主提供，颜色不是唯一状态线索。筛选交互由 `StatusTabs` 或宿主控件承担。
- **布局与主题**：标签自身不拥有相邻间距；父级用 `Space`、行内流式布局或表格单元格管理间隔。保留 AntD 圆角、字号及主题焦点/禁用规范。
- **目录示例**：`examples/catalog` 的“信息与状态”页展示灰、紫、蓝、橙、青、绿、红色标签；桌面、窄屏和深色主题以目录真实渲染记录。

### `FilterBar`

- **API**：`children` 提供筛选控件，`actions` 提供同级操作，`ariaLabel` 必填。
- **可访问性**：使用 `role=search` 并有可读标签；字段继续使用 AntD 原生 label/aria 契约。
- **状态与布局**：筛选值、提交、重置和查询请求都由宿主管理；字段区域可换行，操作区域保持在工具栏内。
- **上游选择**：复杂查询表单优先使用 Pro Components `QueryFilter`；本组件只服务于已有控件组合的轻量筛选工具栏。

### `RowActions`

- **API**：`actions` 为行操作数组（`key`、`onClick`、`danger`、`disabled`、`icon`、`children` 子菜单；标准操作通过 `kind: view | edit | delete` 统一显示“查看 / 编辑 / 删除”，不可另传 `label`。领域操作传入自定义 `label`，不从 `key` 推断语义；`delete` 默认危险样式）；全部操作收进单个竖向省略号菜单。`ariaLabel` 缺省“更多操作”。
- **可访问性**：触发按钮有可读名称并通过 `title` 补充悬停说明；键盘走 AntD Dropdown 原生行为。
- **状态与布局**：危险操作自动在其前加分隔线（首个之前不加）；操作列表为空时渲染 `null`，不留空按钮。
- **边界**：不做权限判断、不弹确认框、不做跳转；这些语义由宿主在 `onClick` / `label` 中表达。行内主操作（如“编辑”链接）若需要平铺展示，直接用 AntD Button，不用本组件收纳。

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
- **布局与响应式**：使用 ProTable 原生行选择提示和 `tableAlertOptionRender`，批量操作在表格选择提示区；新增明细在紧邻表格的工具栏。列宽超过可视区时由表格局部横向滚动，并显示“左右滚动查看其余列”提示；溢出检测通过 Ant Design Table 的公开 `classNames.content` 语义槽标记滚动容器，不查询内部类名；页面本身不横向溢出。
- **批量设置弹层**：Modal 垂直居中；标题和操作区固定可见，字段区最大高度为 `calc(100dvh - 200px)` 并在内部滚动，滚动边界不传递到背景页。短视口下仍可到达全部字段和底部操作。
- **可访问性**：列编辑控件按宿主提供的 AntD 控件名称呈现；行操作图标按钮带可读 `aria-label`。Modal 的焦点和键盘行为由 AntD 管理；其字段区使用原生滚动容器。组件须放在 `SunxuWebProvider` 或其他 AntD `App` 上下文内。
- **证据**：目录真实路由、桌面/窄屏几何、局部横向溢出提示、键盘行选择、批量设置应用和深色主题在 `docs/verification/mes-web-components-2026-11-10/` 记录；读屏器完整流程仍为 `UNVERIFIED`。

### `RemoteSelect` 与 `LongText`

- `RemoteSelect` 继承 AntD Select API，`onSearch` 存在时启用搜索、关闭本地候选过滤，并以 `searchDebounceTime`（默认 300 ms）防抖。候选加载、请求竞态、分页和错误反馈由宿主负责。
- `LongText` 接受文本或数字。`displayMode="wrap"` 将文本最多显示为 `maxLines` 行（默认 2 行），仅在内容被截断时显示 Popover；完整原文保留在 DOM，悬停或点击可查看全文，触发单元格的点击不会冒泡到可点击行。Popover 内容保留换行并可滚动。`displayMode="truncate"` 按 `maxLength`（默认 64 个 Unicode code point）截断；当字符数超过上限或当前宽度触发省略时，显示“更多”并打开完整内容对话框。宽度溢出由 ResizeObserver 依据文本元素的 `scrollWidth > clientWidth` 检查，文本或容器宽度变化后重新测量。空值显示 `-`。
- **目录示例**：`examples/catalog/TextControlsPage.tsx` 展示长于字数上限、短于上限但在 180px 列宽下溢出的备注，以及无需展开的短文本；桌面、窄屏、搜索结果与全文弹层证据见当前组件验收记录。

### `TableSummary`

- **职责**：将宿主提供的可加字段放入与业务列一一对齐的汇总单元格；默认固定在表格底部。
- **API**：`children` 是按最终可见列顺序排列的 `TableSummary.Cell`；`fixed` 默认 `true`，可显式关闭。
- **数据边界**：不请求数据、不按当前页累加、不判断字段能否相加、不做单位或币种换算、不处理权限。筛选范围和各单元格的值由宿主提供；不同单位/币种不得直接相加，比例和单价须由宿主按业务公式计算。
- **布局与可访问性**：使用 Ant Design `Table.Summary.Row/Cell` 原生表格语义；单元格与最终可见列同序，横向滚动由表格原生处理。使用可调整列序/显隐的表格时，宿主需同步汇总单元格顺序；此组件不读取 ProTable 私有列结构。
- **目录示例**：`examples/catalog/TableSummaryPage.tsx` 展示同单位数据的账面数量与可用数量列合计。
- **证据**：目录“表格合计与结果摘要”路由的桌面、窄屏截图和单元格几何见 [`docs/verification/table-summary-2026-11-20/README.md`](./verification/table-summary-2026-11-20/README.md)。库存业务页当前环境缺少可用登录/API 会话，页面级渲染仍为 `UNVERIFIED`。

### `PaginationSummary`

- **职责**：在分页栏左侧呈现筛选结果摘要；空间不足时摘要自动换到分页控件上方，不截断内容。
- **API**：`label` 可选，默认“筛选结果合计：”；`children` 必填，承载宿主提供的指标、单位或分组值。通过 `ResizableProTable` / `ResizableTable` 的 `paginationSummary` 插槽使用；`CrudListWorkbench` 也接受同名属性。
- **数据边界**：不请求数据、不执行聚合、不按当前页求和、不推断单位或币种。分页器继续显示原有范围/总数文案；summary 内容的筛选范围必须与当前列表查询一致。
- **布局与可访问性**：宽容器时摘要位于分页栏左侧、分页控件右侧；有效宽度不超过 56rem 时摘要换到上方独立行，计数范围和页码位于后续行。组件不隐藏或替换页码、条数选择器或总数范围；静态摘要不使用实时播报。
- **目录示例**：`examples/catalog/TableSummaryPage.tsx` 展示跨分页、按单位分组的库存流水净变动。
- **证据**：与 `TableSummary` 共用桌面、768px 和 390px 实际渲染记录；容器几何、溢出值和截图路径见组件验收记录。

### `ResizableProTable` 与 `ResizableTable`

- **职责与入口**：`ResizableProTable<T, U>` 保留 ProTable API，`ResizableTable<T>` 保留 Ant Design Table API；列 schema、数据源、查询请求、权限、业务动作及分页策略仍由宿主提供。从 `sunxu-web/mes` 导入。`resizable={false}` 关闭宽度拖拽适配，但仍保留适用的 MES 表格行为。
- **宽度和布局持久化**：`resizable` 可设为布尔值或 `ResizableTableConfig`。默认列宽 120px、最小 48px、最大不限、拖拽结束防抖 500ms；`defaultWidth`、`minConstraints`、`maxConstraints`、`debounceWaitTime` 可覆盖。`persistenceKey` 默认按列生成，也可提供稳定业务 key 或设为 `false`；`persistenceType` 默认 `localStorage`，可选 `sessionStorage`。ProTable 的列宽状态与可见/顺序状态分别保存，排序状态由独立的 `sortPersistenceKey` 保存；`sortMigration` 可只替换已知旧默认排序。用户显式重置列设置时，宽度缓存同步重置。
- **行号与列策略**：分页列表默认增加固定左侧“序号”列，跨页使用全局行号；可用 `showRowIndex={false}` 关闭。`materialColumnPriority` 缺省按物料名称、编码、规格、单位、主数量、辅助数量、业务上下文、扩展列、辅助信息和操作列整理默认列序；`'preserve'` 或 `{ mode: 'preserve' }` 保留声明次序，`false` 完全关闭整理，ProTable 用户保存的显式列序仍优先。不会把隐藏查询字段导出为业务列。
- **排序与查询**：ProTable 的 `request` 由宿主实现。默认对可排序业务字段发出服务端排序参数；设置 `serverSortFields` 后，仅白名单字段可排序。使用本地 `dataSource` 时按日期、数值和中文自然顺序比较；AntD Table 列可用 `sortValue`、`sortable` 控制。排序状态使用单独 key 持久化。外部 `params` 的 `undefined`、`null`、空字符串和空数组会在请求前移除；日期范围列合并通用快捷日期选项，`createdAt` / `updatedAt` 字段可补充仅日期展示列。表单 transform 和接口字段映射由宿主继续控制。
- **筛选、空态和汇总**：保留 ProTable 查询表单与列设置 API；列变更会同步导出布局。`emptyGuidance` 可提供业务空态下一步建议，默认 `TableEmpty` 展示“暂无数据”和筛选/上游数据提示；宿主传入 `locale.emptyText` 时完全覆盖。`summary` 仍是 AntD/ProTable 的宿主回调；自动行号存在时组件为汇总行补齐首列。`paginationSummary` 将宿主摘要放在分页栏左侧并保留分页范围文案，窄容器下换到分页控件上方；关闭分页时不显示该插槽。
- **高度适配**：`fitContainerHeight` 缺省关闭；设为 `true` 或 `{ enabled, bottomOffset, minBodyHeight, maxBodyHeight }` 后，组件结合视口、`fitContainerHeight` 所在结果边界、表头、分页、汇总和 footer 动态计算纵向滚动高度。单列表视口页的外部父级必须提供确定高度和可收缩的 flex 布局；长页面/多表页面不启用。
- **导出布局**：有 `request` 的表默认产出当前可见列、列序和排序布局；仅用本地 `dataSource` 的表需显式设 `exportLayoutEnabled`。`useTableExportLayout()` 读取当前表布局，表格边界在导出按钮点击捕获阶段激活对应布局，避免同一路由多个表格串用。导出 API 和服务仍由宿主实现；布局只能表达用户选择，不能扩大后端允许导出的字段集合。
- **行操作和编辑宿主接缝**：`TableActions` 将有效按钮、链接、权限按钮和确认操作统一收入“更多”菜单；权限判断、确认和结果仍归动作节点/宿主。`MesUiProvider` 可选注入 `isTableActionColumn(column)` 识别宿主操作列，避免嵌套菜单；`resolveRowEditAction(columns, record)` 只返回宿主当前可见且允许执行的编辑回调，表格双击才调用它。未提供时不产生编辑副作用。不得在 Sunxu 中硬编码 Umi `useAccess`、权限码、MES API、路由或业务动作。
- **密度和局部溢出**：ProTable 工具栏提供“宽松 / 中等 / 紧凑 / 0 间距”密度菜单，存储键为 `mes-admin:table-density`；主题 token 同步控制单元格纵向间距。列宽总和超过可视区时，仅表格容器横向滚动，页面保持视口宽度；宿主若需要纯键盘浏览，应提供命名且可聚焦的表格滚动区域。`TableActions` 的 `max` 只为旧调用签名兼容，不改变全动作收纳策略。
- **本次行为边界**：排序恢复与宽度持久化使用稳定的列 schema 输入，排序指示在最终渲染列上合并，避免服务端排序状态更新把已保存列宽重置为默认值。此项是适配层修正，保留 MES 排序与列宽行为。
- **目录示例和证据**：真实 Catalog 路由“MES 表格组件”覆盖 ProTable 与原生 Table、服务端/本地排序、列宽拖拽和刷新、列显隐与导出列数、密度、双击编辑回调、空态、汇总、视口内纵向高度及 375px 键盘横向滚动。截图、几何、接缝审计、build/typecheck 与未验收项见 [`docs/verification/mes-resizable-table-2026-11-20/README.md`](./verification/mes-resizable-table-2026-11-20/README.md)。宿主 MES 权限解析接线、读屏器、深色主题、844×390 横屏和自定义溢出容器仍为 `UNVERIFIED`。

### `sunxu-web/mes` 兼容组件

- `MesUiProvider` 接受 MES 宿主的 `hasPermission(permission)` 函数；`PermissionButton` 的 `permission` 由此函数判断，无 Provider 或无权限时 fail closed 并不渲染动作。确认文案、危险标记、异步 `onConfirm`、loading、成功提示和成功回调沿用 MES 当前实现；异步错误从 `info.msg`、`data.msg`、`response.data.msg` 或 `Error.message` 提取并显示可确认错误弹窗。请求和权限码的含义由宿主负责。
- `MaterialFilteredSelect` 是 MES 物料业务复合控件；`MaterialSelectField` 与 `MaterialMultiSelectField` 将其接入 ProForm 字段，`materialSelectColumnProps(request, placeholder?)` 用作 ProTable 查询列。筛选模式为 `always/collapsible/hidden`，默认 hidden；保留 `requestKey` 外部刷新、300ms 防抖、族/系统类型/业务分类级联、选中项保留、关键词精确/前缀排序、旧搜索结果丢弃和选中后清空搜索。多选使用 `values/onValuesChange`，单选保留 `value/onChange` 契约；ProForm 注入的 `fieldProps.value/onChange` 会继续参与表单提交。
- 远程 `request({ keyWords, baseType?, categoryId?, familyId? })` 由调用方提供。`MesUiProvider.materialSelectCapabilities` 提供系统类型选项、单位标签、族/分类加载、条码查询、扫码枪注册、自定义字段 schema 和配置入口渲染；Sunxu 不调用 MES API、字典、权限或路由。扫码仅在 Select 聚焦且未禁用时启用；解析出的物料必须再次命中调用方当前候选请求，否则不触发字段变更并提示“该物料不在当前可选范围内”。多选扫码去重，已选项在搜索结果刷新后仍保留。
- 候选副信息显示规格、单位标签及最多 3 个启用且 `displayJson.showInSelector=true` 的自定义字段；按 `displayJson.sortOrder` 回退到字段 `sortOrder` 排序。自定义字段显示保留 MES 的 select/multi-select 选项映射、布尔“是/否”、日期/时间格式和计算异常原因提示；schema 加载失败可重试，错误提示“物料选择器副信息加载失败，请刷新后重试”。
- `renderConfigEntryLabel` 由宿主实现可见权限和配置页链接。来源 `ConfigEntryFieldLabel` 接受的 `show` 是已弃用兼容参数，来源实际忽略它；宿主应按授权决定是否返回链接，`onOpen` 用于回到表单时触发候选刷新。未提供此能力时只显示原标签。调用方拥有表单标签、必填/校验规则、字段间距和 ProTable 查询状态。
- **状态与布局**：远程查询 loading、空候选、disabled、过期搜索拦截 warning、无候选的配置入口和扫码失败提示均由组件保留；筛选控件在容器变窄时换行，候选弹层最小宽度 320px，长副信息截断并通过 title 提供全文。族/系统类型/业务分类筛选器宽度默认 168/112/128px；系统类型默认宽度由来源的 92px 调为 112px，确保 Ant Design 6 下“系统分类”标签完整可见，可由 `baseTypeWidth` 覆盖。Form 标签用 ProForm.Item，基础键盘交互由 AntD Select 承担；扫码键盘监听由宿主注册并应在失焦/禁用时注销。
- **目录和证据**：Catalog 的“MES UI 套件 → MES 物料选择器”覆盖桌面/375px 搜索、筛选、单/多选、单位与自定义字段、扫码验证和宿主配置权限。真实 MES API/权限/设备接线以及读屏器完整流程仍为 `UNVERIFIED`；证据见 [`docs/verification/mes-material-selector-2026-11-20/README.md`](./verification/mes-material-selector-2026-11-20/README.md)。
- `MesUiProvider.actionIntentRoute` 接收宿主当前 `pathname`、`search` 及路由 `replace(path)` 回调；Sunxu 不依赖 Umi。缺少该路由能力时 `DocumentActionIntent` 不触发操作。
- `DocumentActionsDropdown<T>` 保留 `documentId`、`documentNo`、`loadDocument`、`fallbackDocument`、`actions` 和 `onAction`。打开菜单时优先按 ID 加载权威单据，否则使用宿主提供的安全列表投影；依次按单项 `permission`、全部 `requiredPermissions`、后端 `availableActions` 中的 `requiredAvailableAction` 和 `visible(document)` 过滤。菜单保留动态 label、danger、loading、未找到和失败重试状态；动作回调收到选中的 key 和单据。当前用户权限和单据请求由宿主提供；页面不在 Sunxu 中复制 MES 状态机。
- `DocumentCustomFieldPanel` 保留 `objectType/objectId/editable/title`；无 `objectId` 或宿主未注入渲染能力时返回 `null`，字段为空时隐藏整个面板，字段加载错误时仍显示错误内容，切换单据身份时在新状态到达前先隐藏旧字段。`MesUiProvider.renderCustomFieldPanel` 接收 `objectType/objectId/editable/showEmpty: false/onDisplayStateChange`；局部 `title` 只由外层容器渲染。MES 提供字段 schema、请求、编辑器和内容。切换身份会重置宿主渲染子树；可见性仅由 `hasFields || hasError` 决定，加载中和无字段不占布局。字段权限、保存与验证仍归 MES。
- `DocumentViewSwitch` 用 Ant Design `Segmented` 提供 `detail/orders` 两态切换、默认“明细/单据”文案、对应图标和必填 `ariaLabel`；`createDocumentViewSwitch` 可配置无障碍名称和标签，缺省标签不变。`DocumentLedgerViewSwitch` 预设无障碍名称“单据与明细视图切换”。值由宿主控制，未知切换值被忽略；该组件不改变路由、不保存偏好，也不主动刷新列表。
- `DocumentActionIntent` 保留 `action/enabled/onTrigger`；路由 query 中的首个 `action` 匹配且 enabled 时先通过宿主 replace 到当前 pathname 清除 query，再调用详情页已有流程；组件实例只处理一次，深链不得绕过权威详情和预检。
- `DocumentModalForm<T, U>` 保持 Pro `ModalForm` 的泛型和其余 props 透传。默认宽度为 `100vw` 并实际铺满当前工作区，默认 `getContainer` 为 `false`，不穿透 keep-alive 标签容器；只有显式 `viewportFullscreen` 且仍采用默认标签容器时才固定到视口。最小化时取消遮罩并隐藏弹窗，但保持表单挂载与草稿；左下角还原条回到同一组件所在工作区。`open` 变化时清除最小化状态。默认 `destroyOnHidden=true`、`mask.closable=false`、`closable=false`，标题栏提供带无障碍名称的最小化和关闭按钮；可通过调用方 `modalProps.mask` 覆盖遮罩行为。完整宽度子节点由组件提供 `20px 24px 24px` 内边距，render-function children 原样透传；调用方自定义 Modal 语义样式槽及浮层 `style` 会与默认布局合并。固定数值宽度使用普通 Modal 布局；显式自定义 `getContainer` 保留自定义挂载容器，但仍应用完整宽度布局。完整宽度 Modal 保留 `document-form-modal` class 供 MES 宿主现有全局样式过渡使用。组件不负责草稿保存、请求、权限、路由或业务校验。
- `DocumentLineQuantityInput` 是受控数值编辑器：有效数值变化立即交给宿主，清空时只保留本地空草稿、不发送 `null`；失焦时恢复宿主当前值。`InputNumber` 的范围、精度、步长和外观 props 继续透传。
- `StatusDisplay` 只消费宿主传入的 `enumMap`，不内置 MES 状态常量；按 `mode` 呈现 `StatusTag`、Ant Design `Badge` 或彩色文本，未知枚举回退原始值、空值显示 `-`。令牌颜色和显式色值沿用 MES 当前映射规则。
- `TableLongText` 保留 MES 表格现有的 `mes-table-long-text` class，默认使用 `LongText` 的两行换行模式；可用 `maxLines` 调整行数，也可显式选择 `displayMode="truncate"` 使用 64 字符截断和对话框。两行模式的全文 Popover 支持鼠标悬停、触摸点击和键盘 Enter/Space 打开，Escape 关闭；点击不冒泡到可点击表格行。`isTableLongTextValue` 只接受 string/number。
- `AmountText` 保留 `value/prefix/precision/placeholder` API；默认前缀为 `¥`、精度为 2、占位符为 `-`，使用 `zh-CN` 分组格式化，空值和非数字显示占位符。格式化后的字符串交给 `MesUiProvider.maskAmount`；没有宿主能力时 fail closed，空值为 `-`、金额为 `****`。金额显隐状态和权限仍由 MES 宿主管理。
- `AmountPolicySnapshotTag` 保留嵌套快照解析、默认规则文案、版本展示、公式回退、数量/金额详情 Popover；显式 `mask` 优先，否则使用宿主金额脱敏能力。快照输入接受根对象、`priceSnapshot`、`amountPolicySnapshot` 与 `result` 嵌套形态，未识别有效 `policyCode` 时显示 `-`。
- `DateText` 保留 `date/datetime/time` 三种格式（`YYYY-MM-DD`、`YYYY-MM-DD HH:mm`、`HH:mm`），默认 datetime；空值和无效日期显示 `-` 或调用方占位符。`UserText` 优先显示 `realName`，回退 `username`，再回退 `—` 或调用方占位符。
- `DocumentKeywordSearch` 保留受控 `value`（默认 `''`）、`placeholder`（默认“输入单号、客户、供应商或物料搜索”）、`loading`（默认 `false`）和必填 `onSearch`。`value` 变化会同步草稿；输入只暂存在组件状态，清空立即回调空字符串，提交时 trim 首尾空格。AntD `Input.Search` 继续提供 Enter/搜索按钮提交及清除按钮，输入的 `aria-label` 为“关键字搜索”，宽度为 `clamp(160px, 20vw, 256px)`。关键词只用于当前查询，不写入个人视图或持久筛选状态；查询与保存行为归宿主。
- `DocumentTableTitle` 必填 `title`（`ReactNode`）和 `onKeywordSearch`，并保留 `keyword`、`keywordPlaceholder`、`keywordLoading`（默认 `false`）。标题与关键词入口按 AntD `Space` 居中对齐、12px 间距并允许换行；业务字段筛选仍使用宿主自己的唯一入口。
- `DefaultRouteHint` 仅在有 `materialId` 且没有 `routeId` 时调用必填的 `requestCandidates({ materialId, customerId, routeSelectionDate })`；取首个 `recommended` 候选，组合路线编码/名称、版本和原因。没有推荐路线时显示 MES 指引；请求错误静默隐藏，条件变化或卸载会丢弃迟到响应。服务请求和错误策略留在宿主。
- `CustomerMaterialCell` 支持 `combined/internal/customer` 三种模式。combined 时客户别名优先并在下一行保留内部物料值；缺少别名或两者相同则不重复显示。拆分模式可仅在名称字段按对应来源显示规格。`customerMaterialSortValue` 与主值一致，别名优先回落内部快照。内部 `materialId` 是权威身份；客户别名是销售单据的冻结快照，客户输出打印模板不应使用此比较单元格。
- `EntityThumbnail` 保留缩略图优先、预览图回退、默认 40px 方形样式、无图 Tooltip 图标、损坏图 SVG fallback 和 AntD 图片预览。图片存在时点击/双击停止冒泡，避免触发行选择或编辑；无图提示沿用源实现，不截断行事件。
- `DocumentLineBatchSettingsButton` 保留 MES 明细字段 schema；`number` 支持 `min/max/precision`，`date` 的 patch 收到 `YYYY-MM-DD` 字符串，`select` 的 patch 只接收字符串（数值选项仍归一为 `undefined`），`text` 保留最大长度。字段需独立勾选，勾选后留空表示清空；`required` 字段为空时阻止应用并提示。远程选择字段通过 `request(params, values)` 加载候选，竞态结果会丢弃；请求中对应 Select 显示 loading，失败在字段旁显示错误和“重试”入口，重试后清除错误。
- MES 适配组件不请求 MES API、不查权限；远程候选请求、权限判断、状态字典和 `onApply` patch 提交由宿主提供。它们位于 `src/mes/**`，从 `sunxu-web/mes` 导入。
- MES 套件目录中的表格固定列宽为 566px；窄屏将横向溢出限制在表格内，并提供可聚焦命名区域，以左右方向键、Home 和 End 浏览列。
- 两个适配器的桌面/375px 触摸窄屏/844×390 横屏渲染、全文查看、批量字段区滚动、键盘表格滚动与 DOM 几何记录见 `docs/verification/mes-ui-suite-2026-11-19/README.md`。读屏器完整流程仍为 `UNVERIFIED`。
- `DocumentModalForm` 的工作区全屏、视口全屏、固定宽度、遮罩点击不关闭、最小化保留草稿、键盘 Space/Enter 还原、关闭和宿主提交已在目录真实页面完成渲染验收；截图、DOM 几何和横向溢出数据见 `docs/verification/mes-document-modal-form-2026-11-20/README.md`。自定义 `getContainer` 组合和读屏器流程标为 `UNVERIFIED`。
- `DocumentCustomFieldPanel` 在 Catalog 真实路由覆盖有字段、空字段、加载错误、无单据和身份切换；桌面/375px 几何、截图与 DOM 状态记录见 `docs/verification/mes-document-custom-field-panel-2026-11-20/README.md`。真实 MES API/编辑器宿主接线与读屏器流程标为 `UNVERIFIED`。
- `DocumentLedgerViewSwitch` 在 Catalog 真实路由覆盖“明细/单据”受控切换、无障碍名称与窄屏布局；状态只在页面内变化，URL 不变。截图、几何和 DOM 状态见 `docs/verification/mes-document-ledger-view-switch-2026-11-20/README.md`。MES 各页面的本地偏好、列表 ref 刷新时机与数据读取为宿主行为，未迁移或验收。

## 组件状态验收记录

当前新增 wrapper 的 props/状态契约已记录；真实目录渲染、响应式几何、键盘操作及深色主题的最终证据在 `docs/verification/`。未记录的状态都为 `UNVERIFIED`，不能根据 API 推断为已通过。
