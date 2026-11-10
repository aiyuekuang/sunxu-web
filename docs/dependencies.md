# 依赖版本与兼容范围

核对时间：2026-11-10。此项目按“使用新主版本”建立，不为旧 Ant Design API 保留兼容封装。

| 依赖 | 使用版本 | 发布线 | 依据 |
|---|---:|---|---|
| React / React DOM | 19.3.1 | 最新 registry 版本 | npm registry |
| Ant Design | 6.7.0 | 最新稳定版本 | npm registry；官方主题算法通过 `ConfigProvider` 提供 |
| `@ant-design/pro-components` | 3.1.15-9 | beta | npm `beta` tag；peer 依赖 `antd: ^6.0.0` |
| `@ant-design/icons` | 6.3.4 | 最新 registry 版本 | npm registry |
| TypeScript | 7.0.2 | 最新 registry 版本 | npm registry |
| Vite | 8.3.7 | 最新 registry 版本 | npm registry |
| `@vitejs/plugin-react` | 6.3.0 | 最新 registry 版本 | npm registry |

Ant Design 6 与 Pro Components 当前稳定版 2.8.10 的 peer 范围不匹配：稳定版只声明 Ant Design 4/5；当前 beta 3.1.15-9 声明支持 Ant Design 6。项目按用户决定使用新组合，不降回 Ant Design 5。依赖升级前重新查询 npm tag 与 peerDependencies，并在安装、类型检查和构建后更新本表。

Ant Design 提供主题算法与 token 的官方 `ConfigProvider` API；ProForm 是 Ant Design Form 的高层组合，ProTable、ProCard 等承担列表和页面模板。Sunxu Web 不复制这些基础职责，只对跨项目页面契约加薄封装。

- [Ant Design theme customization](https://ant.design/docs/react/customize-theme/)
- [Pro Components overview](https://procomponents.ant.design/components/)
- [ProForm](https://procomponents.ant.design/en-US/components/form/)
- [npm: Ant Design](https://www.npmjs.com/package/antd)
- [npm: Pro Components](https://www.npmjs.com/package/@ant-design/pro-components)
