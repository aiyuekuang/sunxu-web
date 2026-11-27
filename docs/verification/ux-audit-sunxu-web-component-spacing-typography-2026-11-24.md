# Sunxu Web 组件间距与排版审查

2026-11-24 · 只读源码审查 + 目录站点真实渲染抽查。审查目标是判断组件间距、排版和密度是否延续项目已选的设计系统。

## 结论

通用组件、页面容器、CRUD 工作台和文本控件在目录示例中的桌面/窄屏排版总体连贯：常规正文为 14px、辅助文字为 12px、页面标题为 24px；桌面与小屏的工作区外框分别为 24px 和 16px，父布局负责组间距、卡片内部留白保持 16px。320px 视口下，检查的 5 个页面根节点宽度仍与视口相等，表格的横向内容留在表格结果区内。

需要收口的主要是系统定义与实现之间的缝隙：间距 token 未被组件消费，源码反复出现未命名的 6px、10px 间距；字体 token 中 `base=15px` 与运行时 14px 正文定义冲突。生产排程甘特图的订单号和状态 chip 使用 10px，实际渲染可见但偏小。以上以一致性/可读性改进为主，没有证据表明通用组件普遍出现错位或整体排版失控。

这不是全部组件和全部状态的视觉通过证明。当前真实渲染来自组件目录示例；宿主 MES 页面、每个组件的条件分支、错误/空数据/长文案及大字号状态未逐一验证，因此“所有组件 UI 已验收”仍为 **UNVERIFIED**。

## 系统与方法

- **权威设计基线：** [`MASTER.md`](../../design-system/sunxu-web/MASTER.md)、[`tokens.ts`](../../src/theme/tokens.ts)、[`SunxuWebProvider.tsx`](../../src/theme/SunxuWebProvider.tsx)。主规范定义正文 14px、说明 12–13px、页面标题 24px/32px、间距刻度 4/8/12/16/20/24/32/40/48px，以及父布局拥有组件间 gap 的规则。
- **源码范围：** 检查 `src/components`（24 个 TSX）、`src/mes/components`（255 个 TSX、18 个 CSS）及关联样式；对 457 个 TS/TSX/CSS 文件扫描间距与字号声明，并人工复核通用页面骨架、卡片、CRUD/表格、文本控件、MES 排程与状态容器。
- **真实渲染：** Vite 目录应用 `http://127.0.0.1:4174/`；12 个目录专题页 1440×900，8 页 390×844，组件总览、页面容器、选择与文本、CRUD 工作台、MES 表格页 320×844。另检查 MES UI 套件内生产排程片段的桌面与窄屏截图。
- **测量：** Playwright 采集截图、页面根宽度、可见排版尺寸和组件矩形；测量数据保存在证据目录的 `geometry.json`、`320-geometry.json` 与排程几何 JSON。
- **限制：** 组件目录是示例环境，不等同于宿主生产页面。未核验真实宿主路由、各权限/业务状态、键盘与读屏流程、200% 缩放、用户侧字体放大和跨浏览器表现。MES UI 套件在 390px 下 `documentElement.scrollWidth=390`、`body.scrollWidth=394`；根页面没有横向滚动，但有 4px 的 body 溢出信号，尚未定位来源。目录遍历期间还记录到一条 `Cannot read properties of null (reading 'nativeElement')` 运行时错误及 Ant Design/React 警告；本轮没有隔离其触发组件，相关交互态仍为 UNVERIFIED。MES UI 套件是很长的聚合示例页，排程只抽取其代表性片段。

## 间距漂移

项目已定义 4px 基准刻度，但 `SunxuWebTokens.spacing` 除类型声明外没有运行时消费者。扫描记录到 6px 间距值 40 次、10px 值 30 次、14px 值 5 次；这些是源码中的数值出现次数，包含不同组件/布局场景，不代表同等数量的可见缺陷。比如通用工作台筛选 chip 使用 6px gap，排程甘特图使用 6px gap/芯片内边距，热力图单元格使用 7px 与 6px 纵向 padding、5px gap。已有主刻度中的 8/12/16px 仍是常见值。

**判断：中等优先级的一致性机会。** 高密度控件的小间隔可能是有意取舍；问题在于这些取舍没有共享语义名，无法区分“紧凑密度”与随手写入的值，后续组件容易继续分叉。

**建议：** 先确认确实需要保留的 5/6/7/10/14px 密度值，为其定义少量具名例外或语义 token；其余重复间距再统一映射到现有刻度。不要仅为让数字落在 4 的倍数上而扩大控件或破坏紧凑表格密度。

证据：[`styles.css:708`](../../src/styles.css#L708)、[`production-schedule-planning.css:128`](../../src/mes/components/production-schedule-planning.css#L128)、[`production-schedule-planning.css:142`](../../src/mes/components/production-schedule-planning.css#L142)、[`schedule-gantt-widgets.css:28`](../../src/mes/components/schedule-gantt-widgets.css#L28)、[`schedule-gantt-widgets.css:57`](../../src/mes/components/schedule-gantt-widgets.css#L57)。

## 字号与排版漂移

### 实际字号基线基本一致

目录常规页的主要可见字号为 12/14/16/24px，与说明文字、正文和标题基线相符；MES 聚合页增加了 10/13/18px 等局部层级。页面采用系统字体栈，数字展示在共享样式中使用 `tabular-nums`。没有发现通用正文普遍使用多套字体或错误的标题层级。

### `base` 字号 token 与实际正文不同

`SunxuWebTokens.fontSize.base` 是 15px（[`tokens.ts:14-18`](../../src/theme/tokens.ts#L14)），但 Provider 的 Ant Design 默认字号为 14px（[`SunxuWebProvider.tsx:55-57`](../../src/theme/SunxuWebProvider.tsx#L55)），且项目主规范同样规定正文 14px。当前页面实际呈现仍是 14px，所以这是**定义歧义而非已观察到的字号错乱**；后续直接消费 `base` token 的组件可能引入 1px 偏差。

**建议：** 将 `base` 明确对齐到 14px，或将 15px 改为语义更明确的局部尺寸，避免 `base` 被误解为正文默认值。

### 甘特图关键信息采用 10px

生产排程图中的订单号 `.sunxu-mes-gantt-order-no` 和状态 chip 使用 10px；热力图辅助文字使用 11px（[`production-schedule-planning.css:95-108`](../../src/mes/components/production-schedule-planning.css#L95)、[`production-schedule-planning.css:142-150`](../../src/mes/components/production-schedule-planning.css#L142)、[`schedule-gantt-widgets.css:49-75`](../../src/mes/components/schedule-gantt-widgets.css#L49)）。在 390×844 的真实渲染中，甘特条内订单号高 12px，能看到但明显小于附近正文；项目说明文字基线是 12–13px。图表空间紧张可以解释该取舍，但编号/状态会影响识别和判断，当前值处在偏小一侧。

**建议：** 在条宽允许时将编号与状态至少提升至 12px；空间不足时保留主标识并把次要信息交给已有详情面板，不要继续压小字号。先核对长编号、密集条形与 320–390px 状态下的实际折行和详情路径。

证据：[`390x844-schedule-components.png`](ux-audit-sunxu-web-component-spacing-typography-2026-11-24-evidence/390x844-schedule-components.png)、[`1440x900-schedule-components.png`](ux-audit-sunxu-web-component-spacing-typography-2026-11-24-evidence/1440x900-schedule-components.png)、[`schedule-mobile-geometry.json`](ux-audit-sunxu-web-component-spacing-typography-2026-11-24-evidence/schedule-mobile-geometry.json)。测得订单号字号 10px、可见高度 12px；状态 chip 字号 10px、高 14px。

## 状态留白：待渲染确认

源码中的详情加载/空/错误容器使用 80px padding（[`MesDetailPageContainer.tsx:56-81`](../../src/mes/components/MesDetailPageContainer.tsx#L56)），BOM 加载占位使用 72px（[`BomWorkspaceDetail.tsx:256-257`](../../src/mes/components/BomWorkspaceDetail.tsx#L256)），导入抽屉加载状态使用 60px（[`ImportDrawer.tsx:289-295`](../../src/mes/components/ImportDrawer.tsx#L289)）。这些值高于 token 刻度顶端 48px，但分别处于整页状态、详情加载和抽屉内状态，不能只凭源码认定它们视觉上过松。**相关条件状态没有在本轮真实渲染，需在实际页面容器与抽屉中检查它们是否占用不必要的垂直空间；目前标为 UNVERIFIED，不计作确认缺陷。**

## 已验证与未验证

| 项目 | 状态 | 证据/边界 |
|---|---|---|
| 目录示例 12 个主要专题页，1440×900 | 已渲染抽查 | 截图 `1440x900-*.png`；DOM 几何在 `geometry.json` |
| 页面容器、状态、文本、可编辑表格、CRUD、MES 注入、MES 表格，390×844 | 已渲染抽查 | 截图 `390x844-*.png`；聚合 MES UI 套件只检查首屏和排程片段 |
| 目录总览、页面容器、文本、CRUD、MES 表格，320×844 | 已渲染抽查 | `320x844-*.png` 和 `320-geometry.json`；检查的页面根宽度均为 320px |
| 排程甘特条字号和窄屏布局 | 已渲染 | 1440×900 与 390×844 排程截图；编号 10px、高 12px |
| 组件默认数据态 | 部分渲染 | 目录示例数据；没有真实宿主请求或权限 |
| 每个公开组件的全部 props/状态组合 | **UNVERIFIED** | 目录页面未覆盖全部导出组件及组合 |
| loading / empty / error 的主机路由状态 | **UNVERIFIED** | 当前仅从源码发现部分条件分支，未逐一触发 |
| 真实 MES 宿主路由、长文案、200% 缩放、系统字体放大、其他浏览器 | **UNVERIFIED** | 本次没有接入这些环境/状态 |

## 优先处理顺序

1. 给重复的紧凑间距建立明确的语义例外或 token，并明确哪些值仍应使用 4px 刻度。
2. 消除 `fontSize.base=15px` 与正文 14px 的定义冲突。
3. 在排程图表中复核 10/11px 的识别信息，并按空间将可见关键标识提升到 12px 或交由详情面板承载。
4. 对 60/72/80px 的加载与空状态留白补充页面/抽屉渲染证据，再决定是否需要统一。

## 复用与权威组件盘点

| 责任族 | 搜索范围 | 权威实现/来源 | 本次观察 | 处置 |
|---|---|---|---|---|
| 基础输入、按钮、表格、覆盖层 | `src/upstream.ts`、`src/components/**`、目录示例 | Ant Design 6 / Pro Components 3 beta | Sunxu Web 根出口直通上游基础控件，当前未发现需复制基础实现的间距理由 | 保持上游控件几何与 Provider 主题；本次未作全量交互复用审计 |
| 页面容器与内容卡片 | `src/components/PageContainers.tsx`、`PageHeader.tsx`、`SectionCard.tsx`、`DetailCard.tsx`；容器示例 | `ListScreenContainer`、`FormScreenContainer`、`DetailScreenContainer`、`SectionCard`、`DetailCard` | 真实示例使用统一外框与卡片内边距 | 复用现有实现；间距规则以 MASTER 为准 |
| 列表、筛选和摘要 | `CrudListWorkbench.tsx`、`FilterBar.tsx`、`StatusTabs.tsx`、MES 表格与筛选组件；CRUD/表格示例 | `CrudListWorkbench`、`FilterBar`、`StatusTabs`、`ResizableProTable`/`ResizableTable` | 查询与操作紧邻结果区；窄屏表格横向内容在结果区内滚动 | 继续使用既有组合；相同语义的 6px 微间距应先归并为明确密度规则 |
| 文本与远程选择 | `LongText.tsx`、`RemoteSelect.tsx`、MES `TableLongText`/选择器；文本示例 | `LongText`、`RemoteSelect` 及 MES 专用选择组件 | 目录常规文案使用 12/14px；长文本按列宽截断 | 保持文本组件契约；完整窄屏触发状态未覆盖 |
| 生产排程甘特图与热力图 | `ProductionSchedulePlanningWidgets.tsx`、`ProductionScheduleGanttView.tsx`、对应 CSS/目录示例 | MES 排程组件 | 10/11px 图表小字与常规基线存在密度取舍 | 不复制实现；先按图表信息优先级调整或保留具名的紧凑例外 |

## 证据目录

所有截图和几何数据在 [`ux-audit-sunxu-web-component-spacing-typography-2026-11-24-evidence/`](ux-audit-sunxu-web-component-spacing-typography-2026-11-24-evidence/)；该目录包括 1440px、390px、320px 视口截图，以及 `geometry.json`、`320-geometry.json`、`schedule-geometry.json` 和 `schedule-mobile-geometry.json`。
