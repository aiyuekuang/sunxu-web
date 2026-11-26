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
- 当时目录生产包主 chunk 为 3,286.92 kB（gzip 954.78 kB），超过 Vite 500 kB 建议值；后续拆分和加载验收见下方“二次完善”。

## 未验证边界

- 原始 ESM 产物 `dist/business.js` 不能被 Node 原生 ESM 直接加载；二次完善新增 Node 条件入口并验证了所有公开包子路径。直接导入内部 `dist/*.js` 文件仍不属于公开包契约。
- 真实消费项目的运行页面、CSS 迁移和后端服务链路未在本仓变更中验证。完成它们需要消费端切换到 `sunxu-web/business/<domain>` 后按各自 API 与权限状态验收；本次未修改 MES 来源仓或其他消费端。

## 后续迁移门槛

所有已知消费端迁到中性领域入口并移除对旧 CSS 钩子的依赖后，方可在下一主版本删除 `/mes`、`Mes*` 别名、历史 DOM class 和 `--mes-*` 变量。目录加载与包入口修复不会替代真实消费端验收。

## 二次完善：目录加载与 Node ESM（2026-11-26）

- 目录主入口直接加载 CSS，不再导入完整组件根出口；12 个导航页面均按路由加载，119 个业务示例按距视口 900 px 的范围渐进加载，并以占位卡保留长页面的大致布局。GLB 示例只有在点击“打开三维预览”后才挂载查看器。
- 最新生产目录入口为 129.88 kB（gzip 42.58 kB）；业务复合页路由 chunk 为 100.89 kB（gzip 24.54 kB）。首屏实际请求 57 个 JS 资源，按本地产物重新 gzip 的总量约 280.6 kB；没有请求路由页面 chunk 或 three 资源。Vite 仍提示 three 动态 chunk 为 724.07 kB（gzip 184.65 kB），其请求被限制在打开三维预览之后。
- Node 条件出口为根入口、业务聚合、十个业务领域和兼容 `/mes` 共 13 个 JS 子路径。`build:lib` 依据 CJS 入口生成显式命名导出 ESM 桥接文件；所有 13 个子路径均通过 Node 原生 ESM 按包名实际导入验证，根入口与业务聚合的 CommonJS `require` 也通过，`npm pack --dry-run` 包清单包含 13 个桥接入口。浏览器继续走原有 ESM 入口。
- `npm test`：80 项通过；`npm run typecheck` 与 `npm run build` 通过。构建仍报告 three 动态 chunk 超过 Vite 的 500 kB 提示阈值。
- 生产预览实测桌面 1440×900 的 12 个导航页面，以及窄屏 390×844 的组件总览和业务复合页。路由加载提示通过 1.2 秒延迟复现并截图；渐进滚动加载了 119 个示例模块，最终无占位项或加载项，JS 响应无失败、无页面异常。三维预览打开前未请求 three / OrbitControls / GLTFLoader，打开后加载 3 个资源并绘制模型。所有状态下 `documentElement.scrollWidth` 等于视口宽度；业务长页的内部 `.sxw-docs-main` 在全部模块加载后的 `scrollWidth` 为 394 px / `clientWidth` 390 px，页面本身没有横向溢出。
- 目录控制台保留一条 `use-antd-resizable-header` 关于所有表格列均设置 `width` 的既有建议；无 `pageerror`。截图和完整 DOM / 资源记录见 [`docs/verification/catalog-loading-2026-11-26/`](docs/verification/catalog-loading-2026-11-26/)。

真实消费项目的请求、权限、成功 / 失败流程仍为 **UNVERIFIED**：本仓工程约束明确禁止修改 MES 来源仓，且本次没有后端接口或数据库变更。该边界不能由目录预览代替。
