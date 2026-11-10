# 组件目录渲染验收

## 范围

- 路由：`/`（Vite 本地目录应用），页面标题“榫序 Web 组件目录”。
- 浏览器：Playwright Chromium 可见窗口，2026-11-10。
- 视口：桌面 1440 × 900；窄屏 375 × 812。
- 页面状态：总览；页面容器的“进行中”筛选；移动导航打开；浅色与深色主题；键盘聚焦跳转链接；表单预览操作栏。

## 结果

- 实际页面 HTTP 200；无页面异常和浏览器控制台错误。
- 桌面、窄屏文档均没有水平溢出；窄屏页面与组件映射表在各自容器内滚动。
- 状态筛选结果是 `EX-001` 和 `EX-004` 两条；列表工具栏紧邻其结果区，桌面和窄屏测得间距均为 8 px。
- 表单预览显示独立字段滚动区与底部操作栏；滚动区到 footer 的间距为 10 px，footer 上边线可见。
- 键盘首个 Tab 可聚焦“跳转到主要内容”；窄屏抽屉导航可打开，浅色/深色切换正常。
- 页面主内容框：桌面四周 24 px；窄屏四周 16 px。实际矩形、可见分隔观察和本地截图 SHA-256 见 [`spacing-audit.json`](./spacing-audit.json)，验证器结果为 `PASS`。

## 截图和数据

- [`overview-light-1440x900-final.png`](./overview-light-1440x900-final.png)：桌面总览与主内容框。
- [`containers-filtered-light-1440x900-final.png`](./containers-filtered-light-1440x900-final.png)：桌面列表工具栏、结果区和筛选状态。
- [`containers-filtered-light-375x812-final.png`](./containers-filtered-light-375x812-final.png)：窄屏首屏及无水平溢出状态。
- [`containers-filtered-light-375x812-fullpage.png`](./containers-filtered-light-375x812-fullpage.png)：窄屏整页框架、列表与表单预览。
- [`form-preview-light-375x812.png`](./form-preview-light-375x812.png)：窄屏表单滚动区和固定操作栏。
- [`mobile-navigation-open-375x812-final.png`](./mobile-navigation-open-375x812-final.png)：窄屏导航抽屉。
- [`containers-filtered-dark-375x812-final.png`](./containers-filtered-dark-375x812-final.png) 与 [`component-mappings-dark-375x812-final.png`](./component-mappings-dark-375x812-final.png)：深色主题和组件映射。
- [`keyboard-skip-link-focused-1440x900.png`](./keyboard-skip-link-focused-1440x900.png)：键盘聚焦跳转链接。
- [`render-observations-final.json`](./render-observations-final.json)：渲染状态、DOM 几何、行内容和控制台结果。

## 构建检查

`npm run typecheck` 与 `npm run build` 均通过。目录应用构建给出一个体积提示：主 JavaScript chunk 为 943.01 kB（gzip 298.18 kB）；组件包本身的 ESM/CJS 入口分别为 28.24 kB / 21.08 kB。当前只在 Chromium 实际渲染；其他浏览器尚未核对。
