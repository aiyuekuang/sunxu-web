# 组件归一化目录验收

- 页面：Catalog →“宿主注入能力”→“状态映射组件”；Catalog →“业务复合组件”中的“字段口径”提示。
- 状态映射状态：已映射、空值、未知值、自定义颜色、文案覆盖，以及 tag、badge、text 三种呈现。
- 视口：桌面 1280×900；窄屏 390×844。
- 状态映射截图：[桌面](./status-display-desktop-1280x900.png)、[窄屏](./status-display-mobile-390x844.png)。
- 字段口径提示截图：[桌面](./contextual-help-desktop-1280x900.png)、[窄屏触摸](./contextual-help-mobile-390x844.png)。
- 几何与浏览器记录：[状态映射](./render-observations.json)、[字段口径提示](./contextual-help-observations.json)。
- 结果：两个视口下页面 `scrollWidth` 均等于 `clientWidth`；状态卡片内部没有横向溢出；提示气泡在两个视口内完整显示。窄屏用触摸模拟点击后，44×44px 触发区域仍能显示提示。状态映射路由没有浏览器错误。业务复合组件路由的控制台有 Ant Design 弃用、表格适配、重复 key 和表单警告；没有观察到 `pageerror`。
- 范围：本地目录用宿主注入的确定性状态字典展示组件契约；真实业务服务和授权接线不在此验收范围。
