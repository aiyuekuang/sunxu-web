# 列表关键词搜索组件验收（2026-11-27）

## 范围与环境

- 目标：`sunxu-web` CatalogApp → “业务复合组件” → “列表关键词搜索”。
- 本地 Vite `http://127.0.0.1:4173/`，Playwright Chromium；仅一次初始导航，页面为公开本地组件目录，无登录页/认证重定向。
- 视口：桌面 1440×1000、窄屏 375×812；浅色主题。
- 未迁移任何 `mes-admin` 消费者；Catalog 使用确定性本地宿主状态，不请求 MES API。

## 已验证

- `mode="collapsible"` 初始显示 36×36px 放大镜按钮，输入容器处于 `display:none`；展开后焦点进入输入框。
- 输入 `  临时工  ` 并按 Enter，宿主得到 `临时工`；已提交关键词时收起按钮消失，查询词保持可见。
- 清空立即回调空字符串并保持展开；点击收起后输入隐藏，焦点回到“展开关键词搜索”按钮。
- 桌面目标卡宽 1118px；375px 下目标卡宽 309px，文档宽 375px，无水平溢出。
- Playwright 未捕获页面异常；Catalog 输出一个现有 Ant Design `List` 弃用提示，与本次组件无关。
- `npm run typecheck` 与 `npm run build` 通过；构建仍有既有大 chunk advisory。未运行测试套件。

## UNVERIFIED

- 精确的展开态输入框与收起按钮 DOM 接缝矩形未在本次脚本中逐项采集；workspace 主面板的上下边缘未同时出现在目标卡视口截图中。因此没有运行完整 surface-frame / spacing-seam validator，相关视觉门禁为 `UNVERIFIED`，不能据此宣称完整 UI 验收通过。
- 深色主题、读屏器、加载态和真实 `mes-admin` 消费路由未覆盖。

## 证据

- [桌面收起态](./desktop-collapsed.png)
- [桌面展开态](./desktop-expanded.png)
- [窄屏收起态](./mobile-collapsed.png)
- [窄屏展开态](./mobile-expanded.png)
- [DOM 与交互观测](./render-observations.json)
