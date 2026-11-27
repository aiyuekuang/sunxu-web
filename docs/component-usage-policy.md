# Sunxu Web 组件使用规范

本规范将 Web 项目中的页面场景映射到 Sunxu Web 原子组件、通用复合组件、业务复合组件和上游 Ant Design / Ant Design Pro Components。多个项目接入同一组件库时，同一业务任务复用同一权威组件、契约和视觉行为；业务差异由宿主提供的数据、能力接口和明确配置承接。`sunxu-web/business/<domain>` 是业务复合组件的权威入口；完整 `sunxu-web/business` 只用于跨领域组合。组件范围按稳定职责和业务领域确定，不按宿主产品划分。新增组件不得以宿主产品划分实现。

## MUST / ALLOWED / EXCEPTION

- **MUST**：同一场景已有语义和交互匹配的组件时，必须复用，不另做同义实现。
- **ALLOWED**：Sunxu 根出口没有匹配的上游直通项时，可以继续使用其他上游库；新增接入项目实际使用的 AntD/Pro/图标组件时，先把它加入 Sunxu 根出口清单，再切换宿主导入。
- **EXCEPTION**：单页控制器、请求实现、路由或授权决策留在宿主。稳定可复用的业务呈现和交互进入 Sunxu Web 业务组件层，通过 props、插槽和类型明确的能力接口接入宿主；一次性的业务组合留在宿主。

Sunxu Web 的基础控件权威来源是 Ant Design，复杂表单和数据页面模板使用 Ant Design Pro Components。原子组件和通用复合组件由 Sunxu Web 统一维护，业务复合组件按业务领域组织；Button、Input、Select、Modal、Drawer、Table 等基础控件通过根层直通出口提供，始终由上游维护实现。

消费端统一从 Sunxu Web 导入当前覆盖的 UI 组件：原子与通用复合组件、AntD/Pro/图标出口使用 `sunxu-web`；业务复合组件按稳定领域使用 `sunxu-web/business/<domain>`，例如 `sunxu-web/business/accounting`、`sunxu-web/business/inventory`。完整 `sunxu-web/business` 入口只用于确实需要多个领域的组合。库内不提供产品专属入口、旧名称别名或兼容契约。公开组件名、DOM 样式钩子、CSS 变量和存储键使用中性命名；应用品牌、文案及业务差异由 props、插槽或宿主能力提供。旧持久化数据如需保留，由消费宿主在启动时一次性迁移，组件库不识别产品旧键。应用入口仍显式导入 `sunxu-web/styles.css`。新增接入项目使用的上游 UI 组件时，同步加入 `src/upstream.ts` 和覆盖清单。

## 场景与组件映射

| 场景 | MUST 使用 | Sunxu 上游直通出口 / 禁止替代 |
|---|---|---|
| 默认当前业务日期 | `todayBusinessDate`（`sunxu-web/business`） | 按 `Asia/Shanghai` 生成 `YYYY-MM-DD`；不得从 UTC ISO 字符串截取日期 |
| CRUD 列表工作台 | `CrudListWorkbench`；字段、请求、权限和编辑流程由宿主提供 | 页面级工作台使用主题容器面，视图/筛选/操作栏与结果区保持同一表面；内嵌工作台透明并继承父面。工作台不渲染页级标题；当前导航已说明任务时不重复标题，需要标题时由宿主在工作台外组合 `PageHeader`。ProTable 列能表达的查询字段优先用 `proTableSearch` 和列 schema；外部业务控件用工作台筛选插槽，不复制 ProTable 查询表单。只有现有业务确需可调整列宽等表格扩展时才使用 `renderTable`；筛选与列表级操作由工作台紧邻结果区承载；新增使用 `onCreate`，由组件固定文案为“新增”；行内标准操作用 `RowActions` 的 `kind` 固定文案 |
| 列表/明细需要保留扩展表格能力 | `ResizableProTable` / `ResizableTable`（`sunxu-web/business/shared/table`） | 组件承接列宽、列序/显隐、排序、行号、密度、空态和导出布局等表格交互；请求、查询字段、授权、动作和记录仍由宿主提供。Ant Design 根主题若需与表格密度联动，使用共享 `useTableDensityKey` / `getTableDensityTokens`；旧产品存储键由宿主启动时一次性迁移。完整宿主菜单列需用 `markCompleteActionMenuColumn` 标记，避免再次嵌套；标准行操作使用共享菜单。用于工作台时仅通过 `renderTable` 接入，工作台不渲染页级标题，只负责筛选与紧邻表格的列表操作工具栏 |
| 列表单关键词搜索 | `CrudListWorkbench.keywordSearch`（底层唯一通用控件 `ListKeywordSearch`） | 搜索是列表的单一高频条件时用结构化插槽；字段与请求由宿主定义，关键词保留为临时查询，不能暗中加入保存视图快照。默认展开；仅在实测工具栏空间仍不足时设 `mode="collapsible"`，有生效关键词时保持可见 |
| 有单据领域草稿语义的关键词搜索 | `DocumentKeywordSearch`（`sunxu-web/business/documents`） | 这是 `ListKeywordSearch` 的薄领域适配，不另维护输入样式；只保留单据默认提示和既有草稿/提交语义。可搜索范围写在 placeholder 中，标题属于宿主页头职责 |
| 自定义复合筛选工具栏中包含单关键词 | `ListKeywordSearch`（`sunxu-web/components`） | 仅当搜索必须和 Form.Item 或其他业务控件绑定为同一组合时使用；应继续由 `CrudListWorkbench.search` 承载组合，关键词输入仍复用同一控件。其他列表不得自绘或另封同义搜索框 |
| 采购申请列表展开行的只读物料明细 | `PurchaseRequisitionItemsTable`（`sunxu-web/business`） | 固定优先显示物料身份、单位和数量，再显示供应商/采购日期等上下文，最后显示行号、备注和审计时间；宿主传入行数据和格式函数，不在展开表中复制列渲染或数量回退逻辑 |
| 同单位/同币种字段与表格列一一对应 | `TableSummary`（默认 `fixed`）+ AntD `Table.Summary.Cell` | 可加字段放在对应列下方并固定在表格底部；汇总单元格按最终可见列顺序提供 |
| 多单位/多货主汇总较长，且要跟随结果行滚动 | `TableSummary fixed={false}` + AntD `Table.Summary.Cell` | 在数据行后显示并随表格纵向、横向滚动；用合并单元格承载分组摘要，固定操作列保持空白；由上游提供全筛选结果口径 |
| 简短筛选摘要不需要跟随结果行滚动 | `PaginationSummary` + `paginationSummary` 插槽 | 放在分页栏左侧；只承载紧凑摘要。汇总来自上游同一查询，不使用当前页数据累加，也不与列合计重复展示同一指标 |
| 单列表视口页（整页只有一张列表） | `CrudListWorkbench` + `layout="page" fill` | 分页和表头必须保持可见；工作台统一拥有表体纵向滚动高度，适配器只配置横向滚动；不得用页面级 `:has()` CSS、`table-viewport-page` 类、`ResizableProTable.fitContainerHeight` 或外部高度测量控制表体 |
| 页面内嵌列表（Tab 面板、卡片、长页面中的子列表） | `CrudListWorkbench` + `layout="embedded"` | 不拥有页面外框、不渲染页头、不强制 `min-height: 100%`；不得再包一层页面容器 |
| 多模块统计/分析工作区（指标、对比、趋势、明细等并列区块） | `ScreenContainer` | 区块作为页面根容器的直接子项，由共享页面间距统一分隔；不要用 `ListScreenContainer` 包住多个页面模块，也不要为页面补局部 margin |
| 特殊或只读列表 | `ListScreenContainer`；若有筛选，工具须在结果区紧邻 `toolbar` 内 | `children` 表示一个完整结果区；若结果需要多个内部子块，由结果组件自己组合布局。不得把列表操作单独放在远置的页头行 |
| 列表筛选 | `CrudListWorkbench` 组合 ProTable 原生查询表单、`FilterBar` 轻筛选与可选高级筛选抽屉 | 少量外部快捷筛选默认同行展示；宽度不足时自动移入可展开区域。筛选值、查询和请求仍由宿主管理 |
| 互斥状态筛选 | `StatusTabs` | 不用可导航的页面 Tab 冒充结果集合筛选；不在标签旁堆叠重复说明 |
| 只读状态标签 | `StatusTag` | 状态文案和语义颜色由宿主映射；不以颜色代替状态文字；筛选使用 `StatusTabs` |
| 宿主状态字典映射成标签、徽标或文本 | `StatusDisplay`（`sunxu-web`） | 同一状态字典和呈现模式复用该组件；状态值、文案、权限和状态变更由宿主管理 |
| 标准表单页 | `FormScreenContainer` | 字段用 AntD `Form.Item` 与 Input/Select/DatePicker 等上游控件；长表单不自制滚动和固定页脚骨架 |
| 复杂表单 | `FormScreenContainer` + Pro Components `ProForm`（按场景选择） | 不在 Sunxu Web 复制 Form.Item、表单校验或字段控件 |
| 详情页 | `DetailScreenContainer` | 属性分组用 `DetailCard` 或 AntD Descriptions；不复刻页面安全区、标题和固定操作区 |
| 固定流程操作 | `FormScreenContainer` / `DetailScreenContainer` 的 `footer`（内部使用 `StickyActionBar`） | 保存、取消等操作不放入滚动内容或标题区 |
| 核心指标摘要 | `MetricCard`（需要 Sunxu 统一的指标容器契约时） | 普通 Statistic 可直接用上游，不额外包一层同义卡片 |
| 设置项行 | `SettingsRow`（当行需要统一链接/按钮/静态语义时） | 不自绘同义的图标、标题、说明和箭头组合 |
| 身份摘要 | `ProfileIdentity`（头像、姓名与宿主摘要组合） | 头像上传、资料权限和导航由宿主实现 |
| 顶栏/工具栏纯图标动作 | `HeaderActionButton`（`sunxu-web`） | 必填 `aria-label`；Tooltip、Badge、Popover、权限和动作由宿主组合，不在页面复制按钮几何与交互态 |
| 业务公告条、菜单搜索或业务侧栏 | `AnnouncementBanner` / `MenuSearchInput` / `BusinessSideNavView`（`sunxu-web/business`） | 公告/菜单数据、权限过滤、键盘快捷键、路径判断、导航和轮询由宿主提供 |
| 业务通知下拉面板 | `NotificationPanel`（`sunxu-web/business`） | 受控弹层接收通知快照、未读数和状态；读取、标记已读、权限、时间与导航由宿主提供 |
| 业务主题选择、App 下载或支持二维码 | `ThemeOptionsPanel` / `AppDownloadPanel` / `SupportQRCode`（`sunxu-web/business`） | 主题持久化、发布/服务器信息、联系数据和二维码 renderer 均由宿主提供 |
| 业务详情路由需要统一标题、审批插槽、状态和页面态 | `DetailPageContainer`；若宿主已有页面框架则用 `DetailPageContent`；加载/错误/空态用 `DetailPageState` | 路由、数据加载/重试决定、审批 API、权限和详情内容由宿主提供；避免重复 screen 与滚动容器 |
| 重复明细编辑/批量覆盖 | `EditableDetailTable` 与 `BatchFieldSettingsButton` | 不在业务页面复制同义的行选择、批量设置和明细编辑机制；字段 schema 和提交由宿主管理 |
| 业务物料单选/多选、级联筛选或表格物料查询 | `MaterialSelectField` / `MaterialMultiSelectField` / `MaterialFilteredSelect`（`sunxu-web/business`） | 注入业务候选请求、族/分类/类型字典、单位字典、扫码枪、条码查找和配置权限；不在页面自行拼物料 Select options |
| 客户/供应商关联字段需要候选内快捷新增 | `MasterDataQuickCreateSelect`（`sunxu-web/business`） | 宿主注入 `canCreate`、新增表单渲染器、配置链接和远程候选请求；新增权限、表单校验、API 与路由仍归宿主 |
| 会计账簿、期间、凭证字或科目字段 | `AccountingBookField` / `FiscalPeriodField` / `VoucherWordField` / `AccountField`（`sunxu-web/business`） | 通过 `BusinessUiProvider.accountingSelectorCapabilities` 注入基础资料请求和配置入口；ProTable 选项请求使用 `createAccountingSelectorRequests`；API、权限和配置路由由宿主负责 |
| AntD 或 ProForm 日期/日期时间范围需要通用快捷预设 | `QuickDateRangePicker` / `QuickProFormDateRangePicker` / `QuickProFormDateTimeRangePicker`（`sunxu-web`） | 调用方专用预设优先，缺少的通用预设自动补齐；业务日期条件和报表请求仍由宿主管理 |
| 业务图纸上传、订单附件行关联、图纸分组预览与打印 | `DrawingFilesInline` / `FileUrlsInline` / `DrawingFilesGallery`（`sunxu-web/business`） | 使用 `BusinessUiProvider.drawingFilesCapabilities` 注入授权上传、文件代理下载、原名解析和 PDF worker；分组打印回调、权限与业务保存由宿主决定 |
| 远程搜索候选 | `RemoteSelect` | 非远程/本地选项直接使用 AntD Select；请求和分页由宿主管理 |

### 列表工作台组合规则

`CrudListWorkbench` 是所有同类列表结构的组合根；用它的独立插槽表达场景，不按“只有 Tab”“Tab + 树”“Tab + 树 + 视图”分别造组件。上游宿主定义 Tab 项、树数据/选中值、视图范围与字段 schema；工作台只按这些公开配置组织稳定的区域。`primaryTabs` 仅代表当前结果集的范围切换；切换不同页面、权限归口或工作流的页级导航继续由宿主导航组件负责。`facetSidebar` 代表与 Tab 不同维度的目录/队列，工作台统一拥有面板表面、宽度和窄屏抽屉；传入的树内容不再自包相同卡片。`viewBar` 的快照按当前业务范围隔离，关键词保持临时条件。

```tsx
<CrudListWorkbench
  primaryTabs={scopeTabs}
  facetSidebar={<BusinessTree data={treeData} value={selectedNode} onChange={selectNode} />}
  viewBar={<SavedViewBar {...viewConfig} />}
  keywordSearch={keywordConfig}
  advancedFilters={filterConfig}
  tableProps={tableConfig}
/>
```

结果需要保留领域卡片和专属行操作时，以 `results` 替代 `tableProps`，仍复用同一 Tab、Facet、视图、搜索和工具栏区域；宿主继续拥有卡片数据、加载/错误/空态、分页及行操作。表格和卡片不是两种工作台，差异只在结果渲染器。`layout="embedded"` 仅控制是否继承外部页面面板，不改变上述组合契约。
| 表格长文本最多显示两行并可查看全文 | `LongText` | 默认用 `displayMode="wrap"`；需要旧式截断时显式用 `displayMode="truncate"` |
| 表格行操作收纳 | `RowActions` | 操作语义（权限、确认、跳转）由宿主决定；行内需要平铺展示的主操作直接用 AntD Button |
| 图表区域含加载/空/错误状态 | `ChartPanel` | 普通图表无需额外容器时直接渲染；图表引擎和数据由宿主提供 |
| 异步候选结果或详情内容 | AntD `Spin` / `Empty` / `Alert` / `Result`（按语义选择） | 不为每页另造通用加载、空、错误控件 |
| 短编辑/确认覆盖层 | AntD `Modal`；保留列表上下文或承载较长滚动内容时用 `Drawer` | Sunxu Web 不包一层同义 Modal/Drawer；流程操作仍需固定在覆盖层 footer |

当宿主确实已有可调整列宽等表格适配器时，通过 `renderTable` 接入结果区；业务当前依赖列宽、列设置、密度、全局行号、导出布局等既有能力时，使用 `ResizableProTable` / `ResizableTable` 保留这些交互。适配器只消费工作台整理好的表格 props，不另画标题、筛选或列表级操作；`fill` 模式下工作台会在最终适配器元素上重新合并 `scroll`，确保业务适配器覆盖横向宽度时不丢失工作台高度。请求、权限、业务动作及页面副作用仍由宿主提供。组件覆盖门禁清零之前，不开始业务消费页面替换：

```tsx
import { ResizableProTable } from 'sunxu-web/business/shared/table';

<CrudListWorkbench
  layout="page"
  fill
  tableProps={{ columns, rowKey: 'id', request, pagination }}
  renderTable={(tableProps) => (
    <ResizableProTable {...tableProps} resizable />
  )}
/>
```

若项目仍有暂未迁入的旧表格能力，可短期接入宿主适配器；目标实现已由 `sunxu-web/business` 提供。没有列宽或业务表格策略需求时，使用工作台默认 ProTable。

### 外框与高度所有权

- 一个页面只能有一个外框所有者。宿主 shell 已经提供工作区外框时，在应用根部声明 `<SunxuWebProvider workspaceFrame="host">`；应用默认控件尺寸也在这个根 Provider 设置，列表密集型宿主可选择 `componentSize="small"`。`host` 只取消页面容器重复提供的工作区外框；页面级 `CrudListWorkbench` 绘制的内容面仍按组件契约保留内部 padding，嵌入式列表不绘制自己的内容面或内边距。
- 没有宿主外框的独立应用保持默认 `workspaceFrame="container"`，由 `ScreenContainer` 应用桌面 24 px / 窄屏 16 px 外框。
- 页面内嵌容器必须声明 `layout="embedded"`（`CrudListWorkbench`）或 `frame="none"`（其他页面容器），避免第二层页面内边距和重复页头。
- `fill` 只用于单列表视口页；长页面、图表页、多列表页不得开启，否则会把本应整页滚动的内容锁进固定高度。
- `ResizableProTable.fitContainerHeight` 已弃用。新列表页必须迁移到 `CrudListWorkbench fill`；迁移完成前，现有宿主调用和有明确局部边界的嵌套表仍可使用兼容 API。不要为新页面增加该 prop 或依赖 AntD / Pro 内部容器选择器计算高度。

### 功能标记与 ESLint 核验

若一个导出的组件承担表格或通用语义功能，应在它的 JSDoc 用 `@sunxu-use` 声明；ESLint 会检查对应组件是否实际出现在该组件 JSX 中。将功能组合抽到独立组件时，在真正拥有该功能的组件上标记。

| `@sunxu-use` | 必须使用的组件 |
|---|---|
| `filters` | Sunxu `FilterBar` 或 Pro Components `QueryFilter` |
| `status-tabs` | Sunxu `StatusTabs` |
| `data-table` | Pro Components `ProTable` 或 AntD `Table` |
| `detail-properties` | Sunxu `DetailCard` |
| `metric-summary` | Sunxu `MetricCard` |
| `settings-row` | Sunxu `SettingsRow` |
| `profile-identity` | Sunxu `ProfileIdentity` |
| `editable-details` | Sunxu `EditableDetailTable` |
| `remote-select` | Sunxu `RemoteSelect` |
| `long-text` | Sunxu `LongText` |
| `chart-panel` | Sunxu `ChartPanel` |

例：

```tsx
/**
 * @sunxu-page list
 * @sunxu-layer business
 * @sunxu-domain inventory
 * @sunxu-reason 展示库存领域字段和权限控制；表格、筛选和页面骨架复用通用契约。
 * @sunxu-use filters
 * @sunxu-use status-tabs
 * @sunxu-use data-table
 */
export function InventoryListPage() {
  return (
    <ListScreenContainer toolbar={<FilterBar ariaLabel="库存筛选">...</FilterBar>}>
      <ProTable columns={columns} dataSource={records} />
    </ListScreenContainer>
  );
}
```

页面类型与根容器：

| `@sunxu-page` | 必须返回的最外层页面容器 |
|---|---|
| `list` | `ListScreenContainer` |
| `form` | `FormScreenContainer` |
| `detail` | `DetailScreenContainer` |
| `custom` | `ScreenContainer`，并用 `@sunxu-reason` 解释标准容器不适用的原因 |

应用路由外壳已经包含唯一 `<main>` landmark 时，Sunxu 页面容器用 `as="section"` 嵌入；不要在 `<main>` 中再渲染 `<main>`。

## 组件分层与业务领域标记

组件按原子、通用复合、业务复合分层，并按稳定业务领域归类。当前 `src/business/**` 是迁移期的历史存放位置，不代表组件只供某个产品使用；新增和重构组件不得再以宿主产品划分专用层。页面路由、请求服务、授权决策和业务副作用留在宿主；组件通过受控 props、插槽、回调或领域能力接口接入。

新建或重构的导出组件标注 `@sunxu-layer atomic`、`composite` 或 `business`。业务复合组件同时标注 `@sunxu-domain` 和 `@sunxu-reason`；理由说明它承载的稳定业务任务及跨项目复用价值，不得再用“仅供某宿主使用”作为组件归属理由：

```tsx
/**
 * @sunxu-layer business
 * @sunxu-domain inventory-traceability
 * @sunxu-reason 统一批次追溯信息和记录操作的呈现；宿主注入记录、授权结果和动作回调。
 */
export function InventoryBatchCard() {
  return <SectionCard title="批次">...</SectionCard>;
}
```

组件层级唯一使用 `@sunxu-layer atomic`、`@sunxu-layer composite` 和 `@sunxu-layer business`。业务层组件还必须声明 `@sunxu-domain` 与 `@sunxu-reason`；ESLint 不再接受旧分类标记。

主题、尺寸和语言等应用级默认值由 `SunxuWebProvider` 管理。业务服务、权限、路由、金额策略和数据由宿主提供；多个深层组件确需共享同一领域能力时，使用类型明确的领域能力 Provider，不把业务规则搬入通用原子组件，也不建立产品专属的总 Provider。

## 宿主 ESLint 接入

独立工具包位于 [`tooling/eslint-plugin-sunxu-web`](../tooling/eslint-plugin-sunxu-web/README.md)，不会进入运行时包。宿主按实际目录启用推荐规则：

```js
import sunxuWeb from 'eslint-plugin-sunxu-web';

export default [
  {
    ...sunxuWeb.configs['components/recommended'],
    files: ['src/{components,business}/**/*.{ts,tsx}'],
  },
  {
    ...sunxuWeb.configs['screens/recommended'],
    files: ['src/pages/**/*.{ts,tsx}'],
  },
];
```

`component-classification` 要求组件层级标记；业务复合组件必须有领域和复用理由。迁移期旧标记仍被接受，但新代码不得新增。`page-container` 要求页面标记与根容器匹配。`required-components` 按 `@sunxu-use` 校验控件。规则作为 lint error 接入本地开发和 CI 后才会阻断绕用。静态规则不猜业务含义；页面/组件的场景标签应由开发者依据真实职责维护。

例外须通过 `@sunxu-page custom` 和 `@sunxu-reason` 说明，并由代码评审确认；不用长期关闭规则或悄悄新增第二套通用实现。
