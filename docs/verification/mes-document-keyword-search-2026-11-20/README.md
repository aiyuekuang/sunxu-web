# MES 单据关键词搜索渲染验收（2026-11-20）

## 范围与来源

- 目录真实路由：CatalogApp → “MES UI 套件”，验收 `DocumentKeywordSearch` 和 `DocumentTableTitle`。
- 行为基线：`mes-admin` 固定提交 `e185f6b68b6d8ef94ed0b5312340e1952be5f2f1`。按源契约保留受控值同步、本地草稿、清空即时回调、提交 trim、加载态和标题/搜索可换行分组。
- Sunxu 组件不调用 MES API、不写个人视图；查询值和任何保存策略由宿主提供。

## 检查结果

- `npm run typecheck`：通过。
- `npm run build`：组件库、声明文件和 Catalog 构建通过；Catalog 保留既有 500 kB chunk advisory。
- Playwright Chromium：桌面 1440×900 和窄屏 375×812；`pageErrors=0`、`consoleErrors=0`。
- 输入 `  PO-42  ` 并提交后，宿主回调值为 `PO-42`；点击带“清除”无障碍名称的按钮立即回调空值；标题搜索和独立搜索入口同步受控值；加载态可见。
- `layout-audit.json` 的 2 个外框状态和 4 个相邻卡片接缝均由 spacing validator 判定 `PASS`。完整 DOM 几何、可见溢出、截图和 SHA-256 见 `render-observations.json`。
- 未添加或运行测试套件。

## 空间与响应式

- 桌面工作区外框四边各 24px；目标卡宽 1118px，前后卡片间距分别 16px。
- 375px 窄屏工作区外框四边各 16px；目标卡宽 309px，关键词与标题可按可用宽度换行；前后卡片间距分别 16px。页面、目标卡均无横向溢出。
- 窄屏背景表格长文本仍位于原有表格结果区内；页面总宽仍为 375px。

## 截图

- [桌面目录上下文](./desktop-context.png)
- [桌面整页](./desktop-fullpage.png)
- [窄屏目录上下文](./mobile-context.png)
- [窄屏整页](./mobile-fullpage.png)

## 未验收与迁移边界

- VoiceOver/NVDA 完整流程与真实 MES 宿主查询/个人视图状态组合为 `UNVERIFIED`。
- 本批只补齐 Sunxu MES UI 套件和目录示例，没有迁移任何 `mes-admin` 消费者。
