# Sunxu Web 组件使用规范

本规范将 Web 项目中的页面场景映射到 Sunxu Web、Ant Design 和 Ant Design Pro Components 的权威实现。组件使用规则约束页面结构和重复控件；API 请求、权限决策、领域字段、路由和业务副作用仍由宿主负责。

## MUST / ALLOWED / EXCEPTION

- **MUST**：同一场景已有语义和交互匹配的组件时，必须复用，不另做同义实现。
- **ALLOWED**：库中没有匹配组件，或上游组件的语义已经满足需求时，直接使用 Ant Design / Pro Components；不为调用外观相同而新增 Sunxu Web wrapper。
- **EXCEPTION**：业务语义确实不同或上游能力无法表达时，使用宿主专用组件并写明所属领域与原因。例外不应变成跨页面复制的第二套通用控件。

Sunxu Web 的基础控件权威来源是 Ant Design，复杂表单和数据页面模板使用 Ant Design Pro Components。Sunxu Web 只维护页面容器、筛选工具栏、状态选择和有明确复用契约的语义组合；不复刻 Button、Input、Select、Modal、Drawer、Table 等基础控件。

## 场景与组件映射

| 场景 | MUST 使用 | 直接上游实现 / 禁止替代 |
|---|---|---|
| CRUD 列表工作台 | `CrudListWorkbench`；字段、请求、权限和编辑流程由宿主提供 | ProTable 列能表达的查询字段优先用 `proTableSearch` 和列 schema；外部业务控件用工作台筛选插槽，不复制 ProTable 查询表单。只有现有业务确需可调整列宽等表格扩展时才使用 `renderTable`；筛选、列表标题和列表级操作仍由工作台拥有 |
| 单列表视口页（整页只有一张列表） | `CrudListWorkbench` + `layout="page" fill` | 分页和表头必须保持可见；不得用页面级 `:has()` CSS、`table-viewport-page` 类或外部高度测量控制表体 |
| 页面内嵌列表（Tab 面板、卡片、长页面中的子列表） | `CrudListWorkbench` + `layout="embedded"` | 不拥有页面外框、不渲染页头、不强制 `min-height: 100%`；不得再包一层页面容器 |
| 特殊或只读列表 | `ListScreenContainer`；若有筛选，工具须在结果区紧邻 `toolbar` 内 | 表格按场景用 ProTable 或 AntD Table；不得把列表操作单独放在远置的页头行 |
| 列表筛选 | `CrudListWorkbench` 组合 ProTable 原生查询表单、`FilterBar` 轻筛选与可选高级筛选抽屉 | 少量外部快捷筛选默认同行展示；宽度不足时自动移入可展开区域。筛选值、查询和请求仍由宿主管理 |
| 互斥状态筛选 | `StatusTabs` | 不用可导航的页面 Tab 冒充结果集合筛选；不在标签旁堆叠重复说明 |
| 标准表单页 | `FormScreenContainer` | 字段用 AntD `Form.Item` 与 Input/Select/DatePicker 等上游控件；长表单不自制滚动和固定页脚骨架 |
| 复杂表单 | `FormScreenContainer` + Pro Components `ProForm`（按场景选择） | 不在 Sunxu Web 复制 Form.Item、表单校验或字段控件 |
| 详情页 | `DetailScreenContainer` | 属性分组用 `DetailCard` 或 AntD Descriptions；不复刻页面安全区、标题和固定操作区 |
| 固定流程操作 | `FormScreenContainer` / `DetailScreenContainer` 的 `footer`（内部使用 `StickyActionBar`） | 保存、取消等操作不放入滚动内容或标题区 |
| 核心指标摘要 | `MetricCard`（需要 Sunxu 统一的指标容器契约时） | 普通 Statistic 可直接用上游，不额外包一层同义卡片 |
| 设置项行 | `SettingsRow`（当行需要统一链接/按钮/静态语义时） | 不自绘同义的图标、标题、说明和箭头组合 |
| 身份摘要 | `ProfileIdentity`（头像、姓名与宿主摘要组合） | 头像上传、资料权限和导航由宿主实现 |
| 重复明细编辑/批量覆盖 | `EditableDetailTable` 与 `BatchFieldSettingsButton` | 不在业务页面复制同义的行选择、批量设置和明细编辑机制；字段 schema 和提交由宿主管理 |
| 远程搜索候选 | `RemoteSelect` | 非远程/本地选项直接使用 AntD Select；请求和分页由宿主管理 |
| 表格长文本截断并可查看全文 | `LongText` | 不复制截断、更多入口和全文查看弹层 |
| 表格行操作收纳 | `RowActions` | 操作语义（权限、确认、跳转）由宿主决定；行内需要平铺展示的主操作直接用 AntD Button |
| 图表区域含加载/空/错误状态 | `ChartPanel` | 普通图表无需额外容器时直接渲染；图表引擎和数据由宿主提供 |
| 异步候选结果或详情内容 | AntD `Spin` / `Empty` / `Alert` / `Result`（按语义选择） | 不为每页另造通用加载、空、错误控件 |
| 短编辑/确认覆盖层 | AntD `Modal`；保留列表上下文或承载较长滚动内容时用 `Drawer` | Sunxu Web 不包一层同义 Modal/Drawer；流程操作仍需固定在覆盖层 footer |

当宿主确实已有可调整列宽等表格适配器时，通过 `renderTable` 接入结果区；适配器只消费工作台整理好的表格 props，不另画标题、筛选或列表级操作：

```tsx
<CrudListWorkbench
  layout="page"
  fill
  tableProps={{ columns, rowKey: 'id', request, pagination }}
  renderTable={(tableProps) => (
    <HostResizableTable {...tableProps} resizable />
  )}
/>
```

`HostResizableTable` 表示宿主中有明确业务价值的表格扩展。没有这类能力时使用工作台默认 ProTable，不新增同义表格组件。

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

## 业务专用组件标记

Sunxu Web 的 `src/components/**` 只放跨项目通用组件。业务专用页面、字段、卡片或流程组合留在宿主业务目录，不进入 Sunxu Web runtime；仍应使用适用的 Sunxu Web 容器、AntD 控件和主题令牌。

纳入 lint 检查的每个导出组件都标注 `@sunxu-component shared` 或 `@sunxu-component business-specific`。业务专用组件必须同时提供领域和理由：

```tsx
/**
 * @sunxu-component business-specific
 * @sunxu-domain inventory
 * @sunxu-reason 把批次追溯规则与库存记录操作组合在一起，无法作为跨业务通用卡片。
 */
export function InventoryBatchCard() {
  return <SectionCard title="批次">...</SectionCard>;
}
```

`@sunxu-reason` 要说明专用数据或交互为何不能由通用组件组合表达，不能只写“业务需要”。

## 宿主 ESLint 接入

独立工具包位于 [`tooling/eslint-plugin-sunxu-web`](../tooling/eslint-plugin-sunxu-web/README.md)，不会进入运行时包。宿主按实际目录启用推荐规则：

```js
import sunxuWeb from 'eslint-plugin-sunxu-web';

export default [
  {
    ...sunxuWeb.configs['components/recommended'],
    files: ['src/components/**/*.{ts,tsx}'],
  },
  {
    ...sunxuWeb.configs['screens/recommended'],
    files: ['src/pages/**/*.{ts,tsx}'],
  },
];
```

`component-classification` 要求共享/业务专用标记；业务专用标记必须有领域和理由。`page-container` 要求页面标记与根容器匹配。`required-components` 按 `@sunxu-use` 校验控件。规则作为 lint error 接入本地开发和 CI 后才会阻断绕用。静态规则不猜业务含义；页面/组件的场景标签应由开发者依据真实职责维护。

例外须通过 `@sunxu-page custom` 和 `@sunxu-reason` 说明，并由代码评审确认；不用长期关闭规则或悄悄新增第二套通用实现。
