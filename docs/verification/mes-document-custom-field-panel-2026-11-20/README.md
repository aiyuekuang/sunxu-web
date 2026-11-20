# MES 单据自定义字段容器验收（2026-11-20）

## 范围与来源

- CatalogApp → “MES UI 套件” → “MES 单据自定义字段容器”，对照 `mes-admin` 固定提交 `e185f6b68b6d8ef94ed0b5312340e1952be5f2f1`。
- Sunxu 提供面板可见性与单据身份隔离；MES 通过 `MesUiProvider.renderCustomFieldPanel` 提供字段 schema、数据请求和编辑器。

## 行为检查

- 有字段时显示局部标题和宿主字段内容；`editable` 原样交给宿主渲染器。
- 空字段和加载中均隐藏整个区域；发生加载错误时仍显示错误内容；无 `objectId` 时组件返回 `null`。
- 从一个单据切到另一个单据时，旧字段先隐藏，等待新单据的异步状态结果；更换身份会重置宿主内容子树。
- 1440×900 与 375×812 Chromium 渲染无页面级横向溢出，`pageErrors=0`、`consoleErrors=0`。

## 空间与响应式

- 桌面工作区外框四边各 24px，组件卡宽 1118px；上下相邻卡片间距均为 16px。
- 375px 窄屏工作区外框四边各 16px，组件卡宽 309px；字段内容可换行，页面仍无横向溢出。
- `layout-audit.json` 的 2 个外框状态和 4 个相邻卡片接缝经 spacing validator 检查通过。DOM 几何、交互状态和截图 SHA-256 见 `render-observations.json`。

## 截图

- [桌面目录上下文](./desktop-context.png) · [桌面自定义字段卡](./desktop-custom-fields.png) · [桌面加载错误状态](./desktop-error-state.png)
- [窄屏目录上下文](./mobile-context.png) · [窄屏自定义字段卡](./mobile-custom-fields.png)

## 未验收与迁移边界

- MES Admin 的真实 schema/API、字段编辑权限与保存回调接线，以及 VoiceOver/NVDA 全流程仍为 `UNVERIFIED`。
- 本批只补齐 Sunxu MES UI 套件与目录示例，没有修改或迁移 MES 页面消费者。
