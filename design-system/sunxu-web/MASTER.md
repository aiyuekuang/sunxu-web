# Sunxu Web Design System

> 本文件是 Sunxu Web 设计规范的唯一权威正文，也是 UI 设计工具读取的 Master。[`docs/design-system.md`](../../docs/design-system.md) 只提供导航，不重复维护规则。组件 API、迁移映射和依赖版本分别以 [`docs/component-contracts.md`](../../docs/component-contracts.md)、[`docs/component-inventory.md`](../../docs/component-inventory.md) 和 [`docs/dependencies.md`](../../docs/dependencies.md) 为准。

**产品：** 榫序 Web / Sunxu Web  
**用途：** React Web / PC 管理端共享组件库与可运行文档目录  
**维护日期：** 2026-11-10

## 目标和首屏任务

前端开发者和组件库维护者在目录中定位规范组件，理解其 API/状态/边界，并判断应直接用 Ant Design、Pro Components 还是 Sunxu Web 薄封装。目录预览必须真实运行；组件映射必须明确上游权威和宿主职责。

目录首屏组成：

```text
顶部品牌/搜索/主题/窄屏导航入口（56px）
└─ 工作区
   ├─ 桌面分类导航（224px；窄屏收进抽屉）
   └─ 内容面板（四侧保留可见 workspace frame）
      ├─ 当前规范/分类标题
      ├─ 组件搜索结果或最相关预览
      └─ API、状态和宿主组合边界
```

搜索和分类切换优先，目录内容不以营销型 Hero、虚构指标或纯装饰卡片占首屏空间。桌面外框间距 24px；窄屏 16px。

## 上游与组件层级

- Ant Design 6.7.0 拥有基础控件、样式与交互状态。
- `@ant-design/pro-components` 3.1.15-9 beta 提供 ProTable / ProForm / ProCard 等较高层组合。
- Sunxu Web 只拥有自己的设计 token、页面容器邻接关系、固定操作区、身份摘要和必要语义 wrapper。
- 宿主拥有数据请求、业务状态、路由、授权结果、领域文案和副作用。
- 上游组件具备相同职责时直接使用，不复制 Button、Input、Select、Modal、Drawer 或 Table。

## 语义颜色

保留 Sunxu 当前绿色品牌语义；本地检索到的靛蓝/橙配色没有匹配既有品牌事实，因此不采纳。

| Role | Light | Dark | Token |
|---|---|---|---|
| Primary | `#007D35` | `#1F7A45` | `colorPrimary` |
| Primary surface | `#E6F7EC` | `#10271A` | `--sxw-primary-surface` |
| Workspace | `#F5F6F8` | `#0F0F0F` | `colorBgLayout` |
| Surface | `#FFFFFF` | `#1C1C1E` | `colorBgContainer` |
| Text | `#1A1A1A` | `#F5F5F5` | `colorText` |
| Text secondary | `#666666` | `#ABABAB` | `colorTextSecondary` |
| Border | `#EBEBEB` | `#2C2C2E` | `colorBorderSecondary` |
| Success | `#00B578` | `#00D68F` | `colorSuccess` |
| Warning | `#FF8F1F` | `#FFAA00` | `colorWarning` |
| Error | `#FF3141` | `#FF4D4F` | `colorError` |
| Info | `#1677FF` | `#4096FF` | `colorInfo` |

日夜配色通过 AntD ConfigProvider 的官方算法应用。状态不能只用颜色表达；浅灰字只用于 disabled 或非关键信息。

## 排版、间距和几何

- 系统 UI 字体栈，中文使用平台现有字体；不强制远程字体下载。
- 正文 14px；说明 12–13px；页面标题 24px / 32px line height。
- 间距基准 `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48px`。
- 标准控件 36px 高；紧凑 32px；舒适 40px。
- 最低 Web pointer target 24×24 CSS px；图标大小与按钮命中尺寸分离。
- 圆角 `4 / 6 / 10 / 14px`；边线 1px；交互动效 `150 / 220 / 300ms`。
- 父布局拥有组件间 gap，组件只拥有内部 padding。
- 工作区背景和内容面板分离时，边框或背景框在四侧都要保持可见；不要让面板隐去本应表达层级的背景。

## 页面结构

- 列表级新建、刷新、导入、筛选、视图切换和批量操作放在当前结果区紧邻工具栏。
- ProTable 拥有表格布局、筛选/排序/分页原生交互；宿主提供数据和权限过滤。
- 页面标题只识别当前任务；导航、Tab 或相邻筛选已说明的上下文不再用标题重复。
- 筛选、分页和选择状态遵守宿主 API 契约；加载、空、错误、成功或过期状态在影响用户决策时明确呈现。
- 卡片只承载可辨认的信息组或独立任务，不给所有控件额外套一层卡片。
- 表单正文单独滚动；保存/取消固定在底部操作区，不放入标题区或滚动内容。
- 字段按填写逻辑分组，校验规则与接口契约一致；错误显示在用户能理解和修复的位置。
- 短小且独立的新增/编辑使用 Modal；需保留列表上下文或承载较长滚动内容时使用 Drawer；多步或需要完整工作区时才使用独立页面。
- 详情容器按任务信息分组，底部操作独立于详情滚动区域。
- 标题/副标题/提示逐条提供任务价值；不重复当前导航已经明确的上下文。

## Responsive

| Effective width | Rule |
|---:|---|
| ≥ 1280px | 224px 分类导航 + 单内容主列 |
| 768–1279px | 208px 导航；内容减小 padding，必要时预览和 API 纵向排列 |
| < 768px | 导航进入 Drawer；外框 16px；工具栏换行；表格在结果面板局部滚动 |

Responsive 由有效可用宽度决定；不可隐藏核心信息，也不允许页面整体横向溢出。

## 状态与可访问性

- 交互模式遵循 AntD 的焦点、键盘、disabled、loading 和 overlay 契约。
- 图标按钮提供 `aria-label`；装饰图标从无障碍树隐藏。
- 重要规则和风险不只放在 Tooltip 中；必要提示贴近对象，并支持键盘和辅助技术访问。
- 状态同时用文字、图标、结构或位置传达。
- 深色模式独立验收文本、边界、输入态、弹层和状态色对比度。
- 尊重 `prefers-reduced-motion`；关键任务不依赖 hover。
- 保留 AntD 原生焦点、禁用、加载和弹层行为；不用通用 CSS 选择器覆盖其内部状态。
- 新组件有职责、API、状态、token、响应式、a11y、组合边界和运行证据记录。

## 版本基线

| Package | Version | Channel |
|---|---:|---|
| React / React DOM | 19.3.1 | latest |
| Ant Design | 6.7.0 | latest stable |
| Pro Components | 3.1.15-9 | beta, AntD 6 compatible |
| Ant Design Icons | 6.3.4 | latest |
| TypeScript | 7.0.2 | latest |
| Vite | 8.3.7 | latest |

升级前查询 registry 最新版本及 peerDependencies；Pro Components 3 当前为 beta，版本变化需在 `docs/dependencies.md` 记录兼容证据。详见 [`docs/dependencies.md`](../../docs/dependencies.md)。
