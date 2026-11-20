# MES 单据动作与深链渲染验收（2026-11-20）

## 范围与来源

- CatalogApp → “MES UI 套件” → “MES 单据动作与深链”，验收 `DocumentActionsDropdown`、`getAvailableDocumentActions` 与 `DocumentActionIntent`。
- 行为基线：`mes-admin` 固定提交 `e185f6b68b6d8ef94ed0b5312340e1952be5f2f1`。
- Sunxu 不导入 Umi。权限、权威单据加载、安全列表投影和当前路由/replace 由 `MesUiProvider` 的宿主能力注入。

## 行为检查

- 权威详情请求返回的 `availableActions` 决定显示集合；本目录实例显示“查看详情”“编辑”“提交 CG-2026-001”“仓库审核”。
- 缺少 cancel 权限的“撤销”和缺少第二项权限的“插单重排”不显示；安全列表投影只提供 `update` 时仅显示“查看详情”“编辑”。`visible(document)` 为另一列表单据过滤仓库审核动作。
- 详情请求失败后菜单保留“加载失败，点击重试”；重试成功后重新显示权威动作集合；动作回调收到 key 与对应单据。
- 键盘 Enter 可打开更多操作按钮并触发聚焦的菜单项。`?action=approve` 深链经宿主 replace 清除 query 后触发既有详情操作回调；组件实例后续重渲染不会重复触发。
- Playwright Chromium：`pageErrors=0`、`consoleErrors=0`；桌面 1440×900、窄屏 375×812。无测试套件新增或运行。

## 空间与响应式

- 桌面工作区外框四边各 24px；单据动作卡宽 1118px，前后卡片间距均为 16px。
- 窄屏工作区外框四边各 16px；动作卡宽 309px，卡片内部动作入口换行；Dropdown 菜单保持在 375px 页面视口内，目标卡与页面均无横向溢出。
- `layout-audit.json` 的 2 个外框状态及 4 个相邻卡片接缝通过 spacing validator；完整 DOM 几何、截图和 SHA-256 见 `render-observations.json`。

## 截图

- [桌面动作卡目录上下文](./desktop-context.png) · [桌面可用动作菜单](./desktop-actions-menu.png)
- [窄屏动作卡目录上下文](./mobile-context.png) · [窄屏可用动作菜单](./mobile-actions-menu.png)
- [桌面整页](./desktop-fullpage.png) · [窄屏整页](./mobile-fullpage.png)

## 未验收与迁移边界

- VoiceOver/NVDA 全流程及真实 MES Admin 的 Umi 权限、详情请求和 router replace 接线为 `UNVERIFIED`。
- 本批只补齐 Sunxu MES UI 套件和目录示例，没有修改或迁移 MES 页面消费者。
