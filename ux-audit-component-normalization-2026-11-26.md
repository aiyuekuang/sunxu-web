# 组件归一化改造最终审查

**基线：** `HEAD 8b4fa27` 加当前工作区的组件归一化改动。

**审查范围：** `src/business` 目录与领域入口、组件分层和契约、旧 `/mes` 兼容、目录示例、公开包产物、相关消费端边界。
**结论：** 本仓组件库改造已完成，未发现已确认的公开组件丢失、兼容断链或重复状态实现。API 与目录按中性领域组织，原子 / 通用复合 / 业务复合边界已写入工程规范。消费端尚未升级，所以只能确认组件库契约闭环，不能宣称真实业务 API / 权限流程端到端闭环。

## 方案核对

- `src/components/**` 继续维护原子和通用复合组件；业务组件按 `accounting`、`application`、`documents`、`inventory`、`manufacturing`、`printing`、`procurement`、`quality`、`sales`、`shared` 十个稳定领域放在 `src/business/domains/**`。归属依据是职责和领域任务，不按宿主产品拆分。
- 根层仍直通导出 Ant Design / Pro Components 上游组件，不复制基础 Button、Input、Select、Modal、Drawer 或 Table。业务组合可复用原子与通用复合组件；宿主注入请求、权限结果、路由和副作用。
- 新入口为 `sunxu-web/business/<domain>`，`sunxu-web/business` 保留聚合 API。旧 `sunxu-web/mes` 只从 `src/business/compat/mesEntry.ts` 转发，旧组件名和 Provider 名在 `compat/mesAliases.ts` 中适配。
- 254 个带业务元数据的组件文件均具备 `@sunxu-layer`、`@sunxu-domain` 和 `@sunxu-reason`。组件状态展示只由根层 `StatusDisplay` 负责；`MesStatusTag` 仅作向后兼容委托。
- `AppDownloadPanel` 的应用名称和商店搜索名称已由消费端提供；业务 UI Provider 与目录示例均使用中性能力名。PDF 查看器只在打开预览时动态加载。

## 回归与功能闭环

没有发现这次迁移丢失已存在的业务行为。旧 `/mes` 仍提供 602 个兼容出口，通用 `/business` 不再导出 `Mes*` 名称；列宽、密度、排序和列显示等存量偏好继续使用原持久化键，键名集中在 `src/business/compat/legacyStorageKeys.ts`，避免升级后重置用户设置。`StatusDisplay` 行为测试覆盖已知、空值、未知值、文案覆盖，以及 tag / badge / text 呈现。

这次没有后端接口或数据库需求：组件库按契约由宿主提供服务、授权结果和动作。但已知消费端仍停在旧版本，MES Admin 有 395 个源码文件导入 `sunxu-web/mes`，依赖锁定在 `8b4fa27`；其他已知消费者也还没有切换到新领域入口。因此真实消费端页面及请求、权限、成功 / 失败反馈链路均为 **UNVERIFIED**。在消费端迁移之前，保留旧入口是防回归必需条件。

另一个迁移兼容点是历史 CSS 钩子：MES Admin 的 `global.less` 直接依赖 `.mes-document-line-editable-table`、`.mes-fit-pro-table` 和 `--mes-*` 变量。为避免让既有页面失去样式，这些选择器与变量暂时保留；工程规范现已说明其只属于历史兼容，不得用于新组件，待已知消费端完成样式迁移后再于主版本清理。

## 验证结果

- `npm test`：78 项通过，0 失败。
- `npm run typecheck`：通过。检查中发现目录示例的 `resolveFileDisplayNames` 拼写错误并已修复。
- `npm run build`：组件库 ESM / CJS、类型声明和组件目录均构建成功。包导出清单的类型、ESM、CJS 目标都存在；10 个领域 CJS 出口均非空；旧 `/mes` 与新 `/business` 实际加载结果符合兼容边界。
- 浏览器目录证据见 `docs/verification/ux-audit-component-normalization-2026-11-26-evidence/committed-render-evidence/`。状态映射与帮助提示覆盖桌面 1280×900 和窄屏 390×844，页面无横向溢出、没有运行时异常；窄屏帮助触发区为 44×44px。业务复合组件目录另有桌面 1440×900 与窄屏 390×844 的真实渲染记录，页面无横向溢出。
- 业务组件示例页面总高约 59,506px（桌面）/83,534px（窄屏）；记录截图是滚动到宿主集成演示区，不代表首屏。Ant Design 弃用、表格适配、重复 key 和表单状态警告仍在目录控制台出现，没有捕获 `pageerror`；本次未对其作基线归因。
- 目录生产包主 chunk 为 3,286.92 kB（gzip 954.78 kB），超过 Vite 500 kB 建议值；这是可运行组件目录，不是发布的业务域包。目录仍可构建，但首次加载与长页面导航值得后续单独优化。

## 未验证边界

- 直接用 Node 原生 ESM 加载 `dist/business.js` 会在上游 `@ant-design/pro-components` 的 `antd/locale/zh_CN` 扩展名解析处失败。组件库构建、CJS 加载和目录浏览器构建通过；原生 Node ESM / SSR 兼容未验证，当前项目也未声明此能力范围。
- 真实消费项目的运行页面、CSS 迁移和后端服务链路未在本仓变更中验证。完成它们需要消费端切换到 `sunxu-web/business/<domain>` 后按各自 API 与权限状态验收；本次未修改 MES 来源仓或其他消费端。

## 后续迁移门槛

所有已知消费端迁到中性领域入口并移除对旧 CSS 钩子的依赖后，方可在下一主版本删除 `/mes`、`Mes*` 别名、历史 DOM class 和 `--mes-*` 变量。目录 chunk 与原生 Node ESM 需要分别确认产品支持范围，再决定是否单独优化；不应把它们误认为这次业务组件迁移已完成的消费端验收。
