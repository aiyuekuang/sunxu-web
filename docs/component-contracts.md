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
| `ListScreenContainer` | 组织列表标题、紧邻工具栏和结果区 | `ScreenContainer` + `PageHeader`；ProTable 归宿主 |
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

## 组件状态验收记录

当前新增 wrapper 的 props/状态契约已记录；真实目录渲染、响应式几何、键盘操作及深色主题的最终证据在 `docs/verification/`。未记录的状态都为 `UNVERIFIED`，不能根据 API 推断为已通过。
