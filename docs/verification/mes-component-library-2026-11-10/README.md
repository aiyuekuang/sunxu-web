# MES 基线组件映射验收

## 范围

- 页面：目录路由 `/`，组件映射状态。
- 视口/主题：桌面 1440×900 浅色和深色；窄屏 375×812 浅色。
- 交互：目录导航选择、搜索 `BottomSheetContext` 与 `entity-picker-pagination`、窄屏表格横向滚动。
- 首屏任务：按来源组件找到 Web 权威实现、处理状态和宿主职责。顶部品牌/搜索区 56 px；桌面导航 224 px；主内容框桌面四周 24 px、窄屏四周 16 px；映射表在主面板中紧跟标题区。

## 结果

- Vite 页面 HTTP 200；浏览器页面异常和控制台错误均为 0。
- 两个补齐项的搜索结果均为 1 行；窄屏目录导航可切换到映射页并正常关闭。
- 桌面文档宽度 `clientWidth=scrollWidth=1440`；窄屏为 `375=375`，没有页面级横向溢出。
- 窄屏表格使用局部横向滚动：容器 `283 px`，表格 `760 px`；横向滚至 `scrollLeft=477` 后可访问 Web 实现、处理方式与职责说明列，页面宽度仍保持 375 px。
- 桌面主内容框与工作区四侧均保留 24 px；窄屏均保留 16 px。深色主题下边界和映射状态色仍清晰。
- 间距与 surface frame ledger 的校验结果为 `PASS`，包含 3 条 frame 记录和 5 条相邻模块间距记录。

## 截图与数据

- [桌面浅色映射页](./mapping-light-1440x900.png) · [桌面浅色全页](./mapping-light-1440x900-fullpage.png)
- [窄屏浅色映射页](./mapping-light-375x812.png) · [窄屏浅色全页](./mapping-light-375x812-fullpage.png)
- [窄屏横向滚动后](./mapping-light-375x812-horizontal-scroll.png)
- [桌面深色映射页](./mapping-dark-1440x900.png) · [桌面深色全页](./mapping-dark-1440x900-fullpage.png)
- [DOM 几何、溢出、查询结果和控制台记录](./render-observations.json)
- [spacing / surface frame audit](./spacing-audit.json)

## 检查命令

- `npm run typecheck`：通过。
- `npm run build`：通过。目录 chunk 约 943 kB（gzip 298 kB），构建器保留大 chunk 提示；本次没有新增运行时依赖。
- `python3 /Users/suconnect/.codex/skills/ui-ux-pro-max/scripts/validate_spacing_audit.py docs/verification/mes-component-library-2026-11-10/spacing-audit.json`：`PASS`。

MES 原始 `../mes-app` checkout 当前不在工作区。本轮 Web 映射依据是固定基线的逐文件来源账本和目标仓公开 API；原始组件行为逐项对照仍为 `UNVERIFIED`，见 [`docs/migrations/mes-components.json`](../../migrations/mes-components.json)。
