# Sunxu Web 初始化与复用记录

## 来源与边界

- 目标：`https://github.com/aiyuekuang/sunxu-web.git`，本地路径 `../sunxu-web`；仓库克隆时为空。
- 参考：相邻 `../sunxu` 项目，HEAD `9617250e05c7dbb9413fa81053c7730bbe31fdfc`。
- 参考 Sunxu 工作区盘点时存在未提交变更；未从中直接复制运行时代码。映射依据为其现有公开导出、`README.md`、`docs/component-migration.md` 和主题 token 定义；Web 组件均按 Ant Design / Pro Components 重新实现。
- MES 固定提交和 MES 业务代码不是本次来源。Sunxu 原有的 MES 清单仅用于解释 Sunxu 自身筛选历史，不迁移到 Web runtime。

## 适配策略

| 事项 | 策略 | 目标 |
|---|---|---|
| 颜色、间距、字阶、圆角和动效 | 按 Web 单位与 AntD token 适配 | `src/theme/**`, `docs/design-system.md` |
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
