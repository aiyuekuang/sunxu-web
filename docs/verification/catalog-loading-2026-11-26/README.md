# 组件目录加载验收

## 范围

在 `npm run build` 生成的生产目录上，通过本机 Vite preview 验证目录首屏、路由拆分、业务示例渐进加载、三维预览请求和响应式布局。

## 结果

- 目录入口从此前 3,286.92 kB（gzip 954.78 kB）降到 129.88 kB（gzip 42.58 kB）。最终首屏加载 57 个 JS 资源，本地产物 gzip 估算约 280.6 kB；未请求页面路由或 three 资源。
- 业务复合页面路由 chunk 为 100.89 kB（gzip 24.54 kB）。119 个示例模块在接近视口时加载。渐进滚动到页面末尾后，占位模块、加载状态均归零，没有页面异常或 JS 请求失败。
- 3D 查看器在点击“打开三维预览”前没有加载 three、OrbitControls、GLTFLoader；点击后加载 3 个资源并绘制模型。
- `npm pack --dry-run` 包清单包含 13 个 `dist/node/*.mjs` 公开入口。
- 桌面 1440×900 验证了总览及全部导航路由；窄屏 390×844 验证了总览、业务复合页和 GLB 预览交互。各状态 `documentElement.scrollWidth` 与视口宽度一致。业务示例页内部内容区记录到 `scrollWidth 394` / `clientWidth 390`，文档视口没有横向滚动。
- 业务路由加载状态通过给路由 chunk 人为延迟 1.2 秒复现；等待界面位于主内容区，导航壳保留。首屏路由 JS 资源 gzip 估算使用本地构建产物计算，预览服务本身未开启压缩。
- 控制台仅有一条表格列宽建议；未捕获 `pageerror`，JS 响应没有失败。

## 证据

- [`render-evidence.json`](render-evidence.json)：资源、DOM 几何、路由、滚动加载和异常记录。
- `overview-desktop.png`、`overview-mobile.png`：首屏视图。
- `*-desktop.png`：桌面导航页面渲染。
- `business-loading-desktop.png`：强制延迟时的路由加载状态。
- `business-suite-mobile.png`、`business-suite-preview-closed.png`、`business-suite-preview-open.png`、`business-suite-mobile-bottom.png`：业务复合页、GLB 按需加载和完整滚动状态。
