# Sunxu Web 工程指南

## 项目目标

Sunxu Web 是面向 React Web / PC 管理端的通用 UI 组件与页面容器库。它沿用 Sunxu 的语义主题、组件职责与文档契约，在 Web 端以 Ant Design 和 Ant Design Pro Components 为基础。

## 权威组件边界

- Ant Design 负责基础控件、表单字段、反馈、覆盖层和无障碍交互；Ant Design Pro Components 负责 ProForm、ProTable、ProCard 等业务页面模板。
- 优先直接使用上游公开组件和组合能力。只有 Sunxu 现有的跨项目页面结构或主题需要 Web 专属语义时，才在 `src/**` 增加薄封装。
- 不复刻 Ant Design 已有的 Button、Input、Select、Modal、Drawer、Table 等基础控件，也不深层覆盖其内部 class。
- 组件仅消费明确的 props、插槽和回调。请求、导航、授权决定、业务字段和数据状态由宿主项目拥有。
- 列表级操作与筛选必须在列表结果区紧邻的工具栏；长表单的滚动内容与固定操作栏分离。
- 不迁入 MES 页面、MES 领域模块、宿主 App 集成或权限码。

## 设计系统与文档

- `design-system/sunxu-web/MASTER.md` 是唯一权威设计规范正文，也是 UI 设计工具读取的项目主规范；设计令牌的运行时实现位于 `src/theme/**`。
- `docs/design-system.md` 仅作文档导航，不重复定义设计规则。组件公开 API 以 `docs/component-contracts.md` 为准；使用场景和必用映射以 `docs/component-usage-policy.md` 为准；来源组件映射以 `docs/component-inventory.md` 为准；来源和适配证据以 `docs/migration-record.md` 为准；依赖版本以 `docs/dependencies.md` 为准。
- 宿主消费代码必须遵循组件使用规范。业务专用组件留在宿主业务目录，并通过 `@sunxu-component business-specific`、`@sunxu-domain` 和 `@sunxu-reason` 注释标记；Sunxu Web runtime 只收录跨项目通用组件。
- 宿主工程接入 `tooling/eslint-plugin-sunxu-web` 并在 lint/CI 启用推荐规则，检查页面容器、声明功能对应组件及业务专用组件标记。
- 新增或变更公开组件时，同步更新 `docs/component-contracts.md`、`docs/component-inventory.md` 和可运行目录 `examples/catalog/**`。
- 组件契约须说明职责、输入/事件、状态、布局、响应式、无障碍、组合边界和证据；没有实际渲染的状态标 `UNVERIFIED`。
- 文档目录页的可见文字必须帮助定位组件、理解职责或完成集成，不加装饰性说明。

## 技术与依赖

- 当前组合：React 19、Ant Design 6、Ant Design Pro Components 3 beta。Pro Components 稳定版目前 peer 范围未覆盖 Ant Design 6；版本变更前先核对官方 peer 范围并更新 `docs/dependencies.md`。
- React、React DOM、Ant Design、Pro Components 和图标库作为 peer dependencies，不捆绑进发布包；目录示例通过 devDependencies 使用同一版本。
- 发布运行时代码只放在 `src/**`；组件目录应用放在 `examples/catalog/**`。
- 新增依赖必须由当前公开代码或目录示例的直接 import 支撑。

## 基线来源

- 参考工程：`../sunxu`，仓库 HEAD `9617250e05c7dbb9413fa81053c7730bbe31fdfc`。
- 参考时发现 Sunxu 工作区有未提交改动。Web 端据其现有公开 API 和组件文档适配契约，不直接复制 React Native 源码；具体条目见 `docs/migration-record.md`。
- 不修改 `../sunxu` 或 MES 来源仓。

## 验收与交付

- 按变更风险运行类型检查和构建；除非用户明确要求，不新增或运行测试。
- UI 组件应在可运行目录的真实路由和适用视口/状态下检查渲染，记录截图、DOM 几何和溢出。缺少渲染证据时标 `UNVERIFIED`。
- 完成当前任务的本地变更后，优先创建仅包含当前任务的本地提交；除非用户明确要求，不推送远端。
