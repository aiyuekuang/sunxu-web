# Sunxu Web 初始化与复用记录

## 来源与边界

- 目标：`https://github.com/aiyuekuang/sunxu-web.git`，本地路径 `../sunxu-web`；仓库克隆时为空。
- 参考：相邻 `../sunxu` 项目，HEAD `9617250e05c7dbb9413fa81053c7730bbe31fdfc`。
- 参考 Sunxu 工作区盘点时存在未提交变更；未从中直接复制运行时代码。映射依据为其现有公开导出、`README.md`、`docs/component-migration.md` 和主题 token 定义；Web 组件均按 Ant Design / Pro Components 重新实现。
- MES 固定提交 `e92d02d7cf2269cf8c564a60ff6a00255e903c8e` 的 49 个通用组件文件纳入 Web 端映射；按 Web 契约适配或由 Ant Design / Pro Components 原生 API 承担，不复制 React Native 运行时代码。MES 页面、领域模块和宿主集成仍排除。

## 适配策略

| 事项 | 策略 | 目标 |
|---|---|---|
| 颜色、间距、字阶、圆角和动效 | 按 Web 单位与 AntD token 适配 | `src/theme/**`, `design-system/sunxu-web/MASTER.md` |
| 页面容器、标题、工具栏和 footer | 重新实现 Web 语义布局 | `src/components/PageContainers.tsx`, `PageHeader.tsx` |
| Pro 页面组件 | 使用 AntD/Pro 权威实现 | `SectionCard`, `MetricCard`, `DetailCard` 等 |
| 筛选、状态选择 | 按 Web radiogroup/search 语义组合 | `StatusTabs`, `FilterBar` |
| 身份摘要、设置行、错误/权限边界 | 保留通用职责，使用 Web 语义元素 | `ProfileIdentity`, `SettingsRow`, `ErrorBoundary`, `PermissionGuard` |
| RN 手势、安全区/键盘与宿主 API | 不复制到 Web runtime | 见 `component-inventory.md` |
| 文档组件目录 | 提供可运行示例和映射查询 | `examples/catalog/**` |

## 当前差异与未完成项

- 本仓库使用 Ant Design 6 与 Pro Components 3 beta；它不与 Sunxu React Native 的组件 API 或 peer dependency 兼容。
- 上游同名组件由上游拥有，不建立永久兼容包装层。
- 目录页展示的是契约示例和组件映射，不代表每个宿主页面已经接入。
- 每个可见 wrapper 的最终视口截图、DOM 几何、键盘/读屏和主题验收在 `docs/verification/` 记录；没有记录的状态标 `UNVERIFIED`。

## MES 基线组件库引入（2026-11-10）

- 来源仓库：`../mes-app`，分支 `main-买断版本`，固定提交 `e92d02d7cf2269cf8c564a60ff6a00255e903c8e`。来源盘点范围为 `src/components/**` 和 `src/screens/**/components/**`，共 393 个文件。
- 范围决策：纳入这份基线清单中全部 49 个跨项目通用组件文件；其余 344 个页面私有、MES 领域或宿主集成文件不进入共享 Web UI runtime。逐文件状态、SHA-256、映射目标和排除理由记录在 [`docs/migrations/mes-components.json`](./migrations/mes-components.json)。
- Web 侧处理：9 项由现有 `src/**` 公共语义组件承接；33 项使用 Ant Design / Pro Components 公开组件；6 项将浏览器相机、扫描、网络或上传状态留给宿主；`SwipeableRow` 作为触控专属交互暂缓，桌面结果行由宿主组合明确的可点击/键盘操作。
- 选择依据：React Native 官方支持将复杂平台差异拆成平台专属实现；Ant Design 是其 React 组件库官方实现。因此保留同一用户职责与语义，用 Web 原生交互重新映射，不把 React Native 样式、手势或安全区 API 复制进 Web 包。[React Native 平台专属代码](https://reactnative.dev/docs/platform-specific-code)、[Ant Design 介绍](https://ant.design/docs/spec/introduce/)
- 来源限制：当前工作区不存在 `../mes-app` checkout。本账本沿用 Sunxu 固定提交审计记录中的 393 项来源路径、哈希和筛选理由；本次按目标仓公开 API 与组件映射核对 Web 归属，没有重新读取 MES 原始实现。若要对每个原始组件行为做差异级核验，需要恢复该固定提交的只读 checkout；来源行为的逐项比较目前为 `UNVERIFIED`。
