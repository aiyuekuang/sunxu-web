# Workbench 首屏查询证据

- 路由：组件目录中的「CRUD 列表工作台」
- 视口：1280 × 720
- 状态：「ProTable 查询」模式；工作台关闭 ProTable 内置工具栏；列表请求由目录示例宿主提供
- 结果：首屏查询表单可见，工作台表格显示 5 行，第 1 页共 7 条；空态未显示
- 溢出：查询区、表格和工作台容器的 `scrollWidth` 均不大于 `clientWidth`，`scrollHeight` 均不大于 `clientHeight`

截图和 DOM 几何数据分别见 [catalog-1280x720.png](./catalog-1280x720.png) 与 [dom-geometry.json](./dom-geometry.json)。

该目录验证 `sunxu-web` 共享组件及其目录复现页。`mes-admin` 的工艺路线页已完成类型检查和生产构建；需要真实登录态及客户业务数据的页面运行状态未在本机验证。
