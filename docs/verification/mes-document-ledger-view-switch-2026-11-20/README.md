# MES 单据/明细视图切换验收（2026-11-20）

## 范围与来源

- CatalogApp → “MES UI 套件” → “MES 单据与明细视图切换”，对照 `mes-admin` 固定提交 `e185f6b68b6d8ef94ed0b5312340e1952be5f2f1`。
- `DocumentViewSwitch` 保留 `detail/orders` 两态、图标、默认“明细/单据”标签和可配置无障碍名称；`DocumentLedgerViewSwitch` 使用 MES 固定名称“单据与明细视图切换”。

## 行为检查

- 点击“单据”和“明细”会分别向页面回调对应值；Ant Design Segmented 的单选组支持方向键切换。
- 页面 URL 在两种状态切换后保持不变。组件不保存偏好、不请求数据、不刷新列表；这些职责仍归页面宿主。
- Chromium 1440×900 与 375×812 渲染无页面横向溢出，`pageErrors=0`、`consoleErrors=0`。

## 空间与响应式

- 桌面工作区外框四边各 24px，视图切换卡宽 1118px；与前后 MES 卡片的间距均为 16px。
- 窄屏工作区外框四边各 16px，卡宽 309px；文案换行后控件仍在 375px 视口内。
- `layout-audit.json` 的 2 个外框状态和 4 个相邻卡片接缝经 spacing validator 检查通过；DOM 几何、切换状态、无障碍组信息和截图 SHA-256 见 `render-observations.json`。

## 截图

- [桌面目录上下文](./desktop-context.png) · [桌面切换卡](./desktop-switch-card.png)
- [窄屏目录上下文](./mobile-context.png) · [窄屏切换卡](./mobile-switch-card.png)

## 未验收与迁移边界

- MES 页面使用的本地偏好存储、列表 actionRef 延迟就绪和数据刷新策略仍由宿主实现，本批没有迁移这些页面逻辑或消费者。
