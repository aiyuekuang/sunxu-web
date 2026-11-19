# Sunxu Web 工程指南

## 项目目标

Sunxu Web 面向 React Web / PC 管理端，包含 Sunxu 通用 UI 层和按宿主注入能力的 MES UI 套件。它沿用 Sunxu 的语义主题、组件职责与文档契约，在 Web 端以 Ant Design 和 Ant Design Pro Components 为基础。

## 权威组件边界

- Ant Design 负责基础控件、表单字段、反馈、覆盖层和无障碍交互；Ant Design Pro Components 负责 ProForm、ProTable、ProCard 等业务页面模板。MES 当前实际使用的上游 UI 组件通过 `src/upstream.ts` 从 Sunxu Web 根出口直接再导出，不复制或包装其实现。
- `src/**` 存放跨项目通用组件；`src/mes/**` 存放经过 MES 当前实现核对的 MES UI 套件，并从 `sunxu-web/mes` 导出。两层共享 AntD/Pro 与主题，但各自维护清楚的组件契约。
- 不复刻 Ant Design 已有的 Button、Input、Select、Modal、Drawer、Table 等基础控件，也不深层覆盖其内部 class。
- 组件仅消费明确的 props、插槽和回调。MES API 请求、路由导航、权限判断结果、业务副作用和页面数据加载由宿主注入；库内不调用 MES 服务、不依赖 Umi 运行时，也不保存 MES 权限码。
- 列表级操作与筛选必须在列表结果区紧邻的工具栏；长表单的滚动内容与固定操作栏分离。
- MES 页面路由、服务实现、宿主 App 集成仍留在 `mes-admin`；属于组件 UI 的 MES 领域呈现与交互进入 `src/mes/**`，业务数据和动作通过 props、回调或明确的宿主适配器接入。

## 设计系统与文档

- `design-system/sunxu-web/MASTER.md` 是唯一权威设计规范正文，也是 UI 设计工具读取的项目主规范；设计令牌的运行时实现位于 `src/theme/**`。
- `docs/design-system.md` 仅作文档导航，不重复定义设计规则。组件公开 API 以 `docs/component-contracts.md` 为准；使用场景和必用映射以 `docs/component-usage-policy.md` 为准；来源组件映射以 `docs/component-inventory.md` 为准；来源和适配证据以 `docs/migration-record.md` 为准；依赖版本以 `docs/dependencies.md` 为准。
- 宿主消费代码必须遵循组件使用规范。通用组件从 `sunxu-web` 根出口使用；MES 专用 UI 从 `sunxu-web/mes` 使用；MES 页面和控制器仍留在宿主。MES UI 组件标注 `@sunxu-component mes-specific`、`@sunxu-domain` 和 `@sunxu-reason`，并在 props 中声明宿主注入的请求、权限结果与副作用。
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
