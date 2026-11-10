# 榫序 Web 设计规范入口

Sunxu Web 面向多个 React Web / PC 管理端项目，提供共享 UI 组件和页面容器。基础控件与交互状态由 Ant Design 提供，Pro Components 提供页面组合；本库维护跨项目设计语义和必要的页面契约，宿主项目拥有数据、路由、权限判断与业务规则。

## 规范权威来源

设计系统只有一份规范正文：[`design-system/sunxu-web/MASTER.md`](../design-system/sunxu-web/MASTER.md)。它涵盖产品定位、Ant Design 与 Pro Components 的职责、颜色与排版、间距、页面结构、响应式、无障碍和主题规则。维护设计规范时只修改该正文，不在本页复制规则。

其他事项按主题读取各自权威文档：

| 内容 | 权威来源 |
|---|---|
| 公开组件 API、状态与组合契约 | [`component-contracts.md`](./component-contracts.md) |
| 来源组件及 Web 端映射状态 | [`component-inventory.md`](./component-inventory.md) |
| 来源、适配决策和验收证据 | [`migration-record.md`](./migration-record.md) |
| 依赖版本与 peer 范围 | [`dependencies.md`](./dependencies.md) |
| 运行时主题 token | [`src/theme`](../src/theme) |

当前目录示例和视觉验收材料分别位于 [`examples/catalog`](../examples/catalog) 与 [`docs/verification`](./verification)。
