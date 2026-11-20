# Sunxu Web 组件使用规范

本规范将 Web 项目中的页面场景映射到 Sunxu Web 通用层、Sunxu Web MES 套件和上游 Ant Design / Ant Design Pro Components。MES 当前使用的 AntD、Pro 和图标组件从 `sunxu-web` 根出口使用；Sunxu 只直通导出上游实现，不复制其交互。MES 专用 UI 从 `sunxu-web/mes` 使用；API 请求、权限判定、路由、业务字段和副作用仍由宿主注入或负责。

## MUST / ALLOWED / EXCEPTION

- **MUST**：同一场景已有语义和交互匹配的组件时，必须复用，不另做同义实现。
- **ALLOWED**：Sunxu 根出口没有匹配的上游直通项时，可以继续使用其他上游库；新增 MES 实际使用的 AntD/Pro/图标组件时，先把它加入 Sunxu 根出口清单，再切换宿主导入。
- **EXCEPTION**：单页控制器、请求实现、路由或授权决策留在宿主。可复用的 MES 专用呈现和交互进入 `sunxu-web/mes`，通过 props、插槽和回调注入宿主能力，并说明其 MES 领域职责。

Sunxu Web 的基础控件权威来源是 Ant Design，复杂表单和数据页面模板使用 Ant Design Pro Components。通用组件放在根层，MES 专用组件放在 `src/mes/**`；Button、Input、Select、Modal、Drawer、Table 等基础控件通过根层直通出口提供，始终由上游维护实现。

消费端统一从 Sunxu Web 导入当前覆盖的 UI 组件：通用组件和 AntD/Pro/图标出口使用 `sunxu-web`，MES 专用组件使用 `sunxu-web/mes`。应用入口仍显式导入 `sunxu-web/styles.css`。新增 MES 使用的上游 UI 组件时，同步加入 `src/upstream.ts` 和当前 MES 覆盖清单。

## 场景与组件映射

| 场景 | MUST 使用 | Sunxu 上游直通出口 / 禁止替代 |
|---|---|---|
| CRUD 列表工作台 | `CrudListWorkbench`；字段、请求、权限和编辑流程由宿主提供 | ProTable 列能表达的查询字段优先用 `proTableSearch` 和列 schema；外部业务控件用工作台筛选插槽，不复制 ProTable 查询表单。只有现有业务确需可调整列宽等表格扩展时才使用 `renderTable`；筛选、列表标题和列表级操作仍由工作台拥有；新增使用 `onCreate`，由组件固定文案为“新增”；行内标准操作用 `RowActions` 的 `kind` 固定文案 |
| MES 列表/明细需要保留旧表格能力 | `ResizableProTable` / `ResizableTable`（`sunxu-web/mes`） | 组件承接列宽、列序/显隐、排序、行号、密度、空态和导出布局等 MES UI 行为；请求、查询字段、权限、动作和记录仍由宿主提供。用于工作台时仅通过 `renderTable` 接入，工作台仍拥有标题、筛选与紧邻表格的列表操作工具栏 |
| 可加字段与表格列一一对应 | `TableSummary` + AntD `Table.Summary.Cell` | 同单位/同币种等可比口径放各自列下方；汇总单元格按最终可见列顺序提供。混合单位、分类分组或不对应表格列的摘要使用 `PaginationSummary` |
| 摘要需要覆盖筛选结果并靠近分页 | `PaginationSummary` + `paginationSummary` 插槽 | 由上游同一查询返回的汇总数据渲染；不使用当前页数据累加，不与列合计重复展示同一指标 |
| 单列表视口页（整页只有一张列表） | `CrudListWorkbench` + `layout="page" fill` | 分页和表头必须保持可见；不得用页面级 `:has()` CSS、`table-viewport-page` 类或外部高度测量控制表体 |
| 页面内嵌列表（Tab 面板、卡片、长页面中的子列表） | `CrudListWorkbench` + `layout="embedded"` | 不拥有页面外框、不渲染页头、不强制 `min-height: 100%`；不得再包一层页面容器 |
| 特殊或只读列表 | `ListScreenContainer`；若有筛选，工具须在结果区紧邻 `toolbar` 内 | 表格按场景用 ProTable 或 AntD Table；不得把列表操作单独放在远置的页头行 |
| 列表筛选 | `CrudListWorkbench` 组合 ProTable 原生查询表单、`FilterBar` 轻筛选与可选高级筛选抽屉 | 少量外部快捷筛选默认同行展示；宽度不足时自动移入可展开区域。筛选值、查询和请求仍由宿主管理 |
| 互斥状态筛选 | `StatusTabs` | 不用可导航的页面 Tab 冒充结果集合筛选；不在标签旁堆叠重复说明 |
| 只读状态标签 | `StatusTag` | 状态文案和语义颜色由宿主映射；不以颜色代替状态文字；筛选使用 `StatusTabs` |
| 标准表单页 | `FormScreenContainer` | 字段用 AntD `Form.Item` 与 Input/Select/DatePicker 等上游控件；长表单不自制滚动和固定页脚骨架 |
| 复杂表单 | `FormScreenContainer` + Pro Components `ProForm`（按场景选择） | 不在 Sunxu Web 复制 Form.Item、表单校验或字段控件 |
| 详情页 | `DetailScreenContainer` | 属性分组用 `DetailCard` 或 AntD Descriptions；不复刻页面安全区、标题和固定操作区 |
| 固定流程操作 | `FormScreenContainer` / `DetailScreenContainer` 的 `footer`（内部使用 `StickyActionBar`） | 保存、取消等操作不放入滚动内容或标题区 |
| 核心指标摘要 | `MetricCard`（需要 Sunxu 统一的指标容器契约时） | 普通 Statistic 可直接用上游，不额外包一层同义卡片 |
| 设置项行 | `SettingsRow`（当行需要统一链接/按钮/静态语义时） | 不自绘同义的图标、标题、说明和箭头组合 |
| 身份摘要 | `ProfileIdentity`（头像、姓名与宿主摘要组合） | 头像上传、资料权限和导航由宿主实现 |
| 重复明细编辑/批量覆盖 | `EditableDetailTable` 与 `BatchFieldSettingsButton` | 不在业务页面复制同义的行选择、批量设置和明细编辑机制；字段 schema 和提交由宿主管理 |
| 远程搜索候选 | `RemoteSelect` | 非远程/本地选项直接使用 AntD Select；请求和分页由宿主管理 |
| 表格长文本最多显示两行并可查看全文 | `LongText` | 默认用 `displayMode="wrap"`；需要旧式截断时显式用 `displayMode="truncate"` |
| 表格行操作收纳 | `RowActions` | 操作语义（权限、确认、跳转）由宿主决定；行内需要平铺展示的主操作直接用 AntD Button |
| 图表区域含加载/空/错误状态 | `ChartPanel` | 普通图表无需额外容器时直接渲染；图表引擎和数据由宿主提供 |
| 异步候选结果或详情内容 | AntD `Spin` / `Empty` / `Alert` / `Result`（按语义选择） | 不为每页另造通用加载、空、错误控件 |
| 短编辑/确认覆盖层 | AntD `Modal`；保留列表上下文或承载较长滚动内容时用 `Drawer` | Sunxu Web 不包一层同义 Modal/Drawer；流程操作仍需固定在覆盖层 footer |

当宿主确实已有可调整列宽等表格适配器时，通过 `renderTable` 接入结果区；MES 当前依赖列宽、列设置、密度、全局行号、导出布局等既有能力时，使用 `ResizableProTable` / `ResizableTable` 保留这些交互。适配器只消费工作台整理好的表格 props，不另画标题、筛选或列表级操作；请求、权限、业务动作及页面副作用仍由宿主提供。组件覆盖门禁清零之前，不开始 MES 消费页面替换：

```tsx
import { ResizableProTable } from 'sunxu-web/mes';

<CrudListWorkbench
  layout="page"
  fill
  tableProps={{ columns, rowKey: 'id', request, pagination }}
  renderTable={(tableProps) => (
    <ResizableProTable {...tableProps} resizable />
  )}
/>
```

若项目仍有暂未迁入的旧表格能力，可短期接入宿主适配器；目标实现已由 `sunxu-web/mes` 提供。没有列宽或 MES 表格策略需求时，使用工作台默认 ProTable。

### 外框与高度所有权

- 一个页面只能有一个外框所有者。宿主 shell 已经提供工作区外框时，在应用根部声明 `<SunxuWebProvider workspaceFrame="host">`；所有页面容器随后只保留内部 gap，不再叠加 `--sxw-workspace-gutter`。
- 没有宿主外框的独立应用保持默认 `workspaceFrame="container"`，由 `ScreenContainer` 应用桌面 24 px / 窄屏 16 px 外框。
- 页面内嵌容器必须声明 `layout="embedded"`（`CrudListWorkbench`）或 `frame="none"`（其他页面容器），避免第二层页面内边距和重复页头。
- `fill` 只用于单列表视口页；长页面、图表页、多列表页不得开启，否则会把本应整页滚动的内容锁进固定高度。

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
 * @sunxu-component business-specific
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

## MES 套件组件标记

Sunxu Web 的 `src/components/**` 放跨项目通用组件，`src/mes/**` 放经当前 MES 实现核对的 MES 专用 UI。页面路由、请求服务、权限码和业务副作用留在宿主；组件通过受控 props、权限结果、服务函数和事件回调接入，不直接依赖 MES 服务或 Umi runtime。

纳入 lint 检查的每个导出组件都标注 `@sunxu-component shared`、`mes-specific` 或 `business-specific`。Sunxu MES 套件组件使用 `mes-specific`，并同时提供领域和理由：

```tsx
/**
 * @sunxu-component mes-specific
 * @sunxu-domain inventory
 * @sunxu-reason 把 MES 批次追溯展示与库存记录操作组合在一起，其他业务宿主不共用这套领域交互。
 */
export function InventoryBatchCard() {
  return <SectionCard title="批次">...</SectionCard>;
}
```

`@sunxu-reason` 要说明专用数据或交互为何不能由通用组件组合表达，不能只写“业务需要”。

金额展示组件从 `MesUiProvider.maskAmount` 接收 MES 脱敏策略，路线提示通过 `DefaultRouteHint.requestCandidates` 接收候选查询；Provider 未配置金额策略时 fail closed。物料别名、内部物料快照和用户字段仍由 MES 页面映射，图片 URL 由宿主提供。组件库不得读取 MES 服务、Umi 权限或路由状态。

## 宿主 ESLint 接入

独立工具包位于 [`tooling/eslint-plugin-sunxu-web`](../tooling/eslint-plugin-sunxu-web/README.md)，不会进入运行时包。宿主按实际目录启用推荐规则：

```js
import sunxuWeb from 'eslint-plugin-sunxu-web';

export default [
  {
    ...sunxuWeb.configs['components/recommended'],
    files: ['src/{components,mes}/**/*.{ts,tsx}'],
  },
  {
    ...sunxuWeb.configs['screens/recommended'],
    files: ['src/pages/**/*.{ts,tsx}'],
  },
];
```

`component-classification` 要求共享/MES 专用标记；MES 专用标记必须有领域和理由。`page-container` 要求页面标记与根容器匹配。`required-components` 按 `@sunxu-use` 校验控件。规则作为 lint error 接入本地开发和 CI 后才会阻断绕用。静态规则不猜业务含义；页面/组件的场景标签应由开发者依据真实职责维护。

例外须通过 `@sunxu-page custom` 和 `@sunxu-reason` 说明，并由代码评审确认；不用长期关闭规则或悄悄新增第二套通用实现。
