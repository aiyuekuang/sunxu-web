# MES 展示组件真实渲染验收（2026-11-20）

## 范围与来源

- 路由：CatalogApp → “MES UI 套件”，验收 `AmountText`、`AmountPolicySnapshotTag`、`DateText`、`UserText`、`DefaultRouteHint`、`CustomerMaterialCell` 和 `EntityThumbnail`。
- 行为基线：`mes-admin` 固定提交 `e185f6b68b6d8ef94ed0b5312340e1952be5f2f1`。本批核对源组件、金额快照解析器、金额可见性 Hook 和真实调用方式；服务、Umi 权限和金额可见性接线由 MES 宿主注入。
- 没有修改或替换 `mes-admin` 消费页面。本记录只验收 Sunxu MES 套件和目录示例。

## 检查命令与结果

```sh
npm run typecheck
npm run build
node run.js /tmp/playwright-test-mes-display-primitives.js
python3 /Users/suconnect/.codex/skills/ui-ux-pro-max/scripts/validate_spacing_audit.py docs/verification/mes-display-primitives-2026-11-20/layout-audit.json
```

- `npm run typecheck`：通过。
- `npm run build`：ESM/CJS 组件库、声明文件和目录构建通过；目录产物有既有的 500 kB chunk advisory。
- Playwright Chromium：`pageErrors=0`、`consoleErrors=0`。
- spacing audit：2 个外框状态、4 条可见接缝，全部通过；本记录同时保存渲染观测、截图和截图 SHA-256。
- 未添加或运行测试套件。

## 实际行为

| 组件行为 | 观察结果 |
|---|---|
| `AmountText` 空值与金额 | 空值显示 `未录入`；默认金额为 `****`；宿主切换后显示 `¥12,500.50` |
| `AmountPolicySnapshotTag` | 快照 Popover 展示规则、公式、业务数量；金额隐藏时四个金额值均脱敏，显示时回读 `12500.50`、`0.00` |
| `DateText` / `UserText` | `2026-11-20 09:30`；无效日期回退“日期待补”；用户回退 `张工`、`operator01` |
| `DefaultRouteHint` | 注入候选请求后显示推荐路线、版本和推荐原因；不直接访问 MES 服务 |
| `CustomerMaterialCell` | combined 同时显示客户别名和内部物料；拆分模式分别显示内部规格与客户规格 |
| `EntityThumbnail` | 图片预览可打开并通过关闭控件退出；无图显示 Tooltip 图标占位 |
| 暗色主题 | 金额按钮文字为“显示金额”，前景 `rgb(245, 245, 245)`，背景 `rgb(28, 28, 30)` |

## 视口和空间证据

- 桌面 1440×900：页面宽度与视口同为 1440px；`.sxw-docs-main` 到 `.sxw-docs-surface` 四边各 24px。目标卡片宽 1118px，左右边界 273–1391px；前后区段的垂直间距各为 16px。
- 窄屏 375×812：`documentWidth=bodyWidth=375px`，页面没有横向溢出；`.sxw-docs-main` 到 `.sxw-docs-surface` 四边各 16px。目标卡片宽 309px，左右边界 33–342px；前后区段间距各为 16px。
- 暗色窄屏根宽仍为 375px。目标卡片无可见横向溢出。交互后的 AntD wave 有一个 0×0px 节点报告 `scrollWidth=71px`；节点没有可见几何，也没有扩大页面或卡片可视边界。
- 详见 [`layout-audit.json`](./layout-audit.json) 和 [`render-observations.json`](./render-observations.json)。

## 截图

- [MES 展示组件桌面卡片](./display-components-desktop.png) · SHA-256 `6873b81e2e37745e1dd81b5dde853ab3656d90018deb703412174c83a60aa084`
- [MES 展示组件窄屏卡片](./display-components-mobile-375.png) · SHA-256 `e9ff1bfb775b030c5be0e8efac63f2b3bdcdfef589771688b3169488b6fb61de`
- [MES 展示组件暗色窄屏](./display-components-mobile-dark-375.png) · SHA-256 `ea63fbea009c9d7774656e9b452f85d91f8d33a51707872b74068d7e0508fd35`
- [桌面金额快照脱敏态](./amount-policy-popover-desktop.png) · SHA-256 `906fcae45f143ebb3554cb82d34b0d606c36024e6a32ffb7b7d3cc66f74b9668`
- [桌面金额快照可见态](./amount-policy-popover-visible-desktop.png) · SHA-256 `2e37d8144ea0584b5503138976a373ef7eed1363dea82828c1a453a2552376eb`
- [桌面图片预览](./thumbnail-preview-desktop.png) · SHA-256 `158d5992317a59ba5c017bf4cf9d5d06849c363337fbae80ab38fcdbc439aacc`
- 完整套件上下文截图：[`display-suite-desktop-fullpage.png`](./display-suite-desktop-fullpage.png)、[`display-suite-mobile-fullpage.png`](./display-suite-mobile-fullpage.png)。

## 未验收与迁移边界

- VoiceOver/NVDA 完整流程、真实 MES 宿主权限服务组合、MES API 失败/取消请求状态仍为 `UNVERIFIED`。
- 本批组件进入 Sunxu 套件并补齐契约；MES 页面调用点仍等待全量账本清零后逐项替换。
