# 依赖版本与兼容范围

核对时间：2026-11-21。此项目按“使用新主版本”建立，不为旧 Ant Design API 保留兼容封装。

| 依赖 | 使用版本 | 发布线 | 依据 |
|---|---:|---|---|
| React / React DOM | 19.3.1 | 最新 registry 版本 | npm registry |
| Ant Design | 6.7.0 | 最新稳定版本 | npm registry；官方主题算法通过 `ConfigProvider` 提供 |
| `@ant-design/pro-components` | 3.1.15-9 | beta | npm `beta` tag；peer 依赖 `antd: ^6.0.0` |
| `@ant-design/icons` | 6.3.4 | 最新 registry 版本 | npm registry |
| `react-pdf` | 10.4.1 | MES PDF 预览 peer | React-PDF 官方 README 的 Worker 配置契约 |
| `pdfjs-dist` | 5.4.296 | React-PDF 同版本 peer | `PdfPreviewDrawer` 使用宿主提供的版本匹配 Worker；peer 锁为精确版本 |
| TypeScript | 7.0.2 | 最新 registry 版本 | npm registry |
| Vite | 8.3.7 | 最新 registry 版本 | npm registry |
| `@vitejs/plugin-react` | 6.3.0 | 最新 registry 版本 | npm registry |
| `three` | 可选 peer `^0.185.1`；dev `^0.185.1` | 与 MES GLB 查看器锁定版本一致；组件挂载后动态导入，库构建外置 | Sunxu 与 `mes-admin` lockfile 均解析为 0.185.1；[Three.js addons 安装说明](https://threejs.org/manual/pages/installation.html) |
| `@types/three` | dev `^0.185.0` | GLB 查看器开发类型 | 与 MES 当前 `^0.185.0` 类型范围一致；[npm registry](https://www.npmjs.com/package/@types/three) |
| `@dnd-kit/core` | peer/dev `^6.3.1` | MES 列排序拖拽 | npm registry 6.3.1 |
| `@dnd-kit/sortable` | peer/dev `^10.0.0` | MES 可排序字段/列构建块 | npm registry 10.0.0 |
| `@dnd-kit/utilities` | peer/dev `^3.2.2` | dnd-kit CSS transform 工具 | npm registry 3.2.2 |
| `react-to-print` | peer/dev `^3.3.0` | MES React 内容打印 Hook | 官方包文档与 npm registry 3.3.0 |

Ant Design 6 与 Pro Components 当前稳定版 2.8.10 的 peer 范围不匹配：稳定版只声明 Ant Design 4/5；当前 beta 3.1.15-9 声明支持 Ant Design 6。项目按用户决定使用新组合，不降回 Ant Design 5。依赖升级前重新查询 npm tag 与 peerDependencies，并在安装、类型检查和构建后更新本表。

React-PDF 宿主必须将 `pdfjs-dist/build/pdf.worker.min.mjs` 作为单独资源交给 `BusinessUiProvider.drawingFilesCapabilities.pdfWorkerSrc`；不得让 Worker 与组件包解析到不同的 PDF.js 版本。

Ant Design 提供主题算法与 token 的官方 `ConfigProvider` API；ProForm 是 Ant Design Form 的高层组合，ProTable、ProCard 等承担列表和页面模板。Sunxu Web 不复制这些基础职责，只对跨项目页面契约加薄封装。

- [Ant Design theme customization](https://ant.design/docs/react/customize-theme/)
- [Pro Components overview](https://procomponents.ant.design/components/)
- [ProForm](https://procomponents.ant.design/en-US/components/form/)
- [npm: Ant Design](https://www.npmjs.com/package/antd)
- [npm: Pro Components](https://www.npmjs.com/package/@ant-design/pro-components)
- [npm: `@dnd-kit/core`](https://www.npmjs.com/package/@dnd-kit/core)
- [npm: `@dnd-kit/sortable`](https://www.npmjs.com/package/@dnd-kit/sortable)
- [npm: `@dnd-kit/utilities`](https://www.npmjs.com/package/@dnd-kit/utilities)
- [npm: `react-to-print`](https://www.npmjs.com/package/react-to-print)
