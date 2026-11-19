# MES `DocumentModalForm` 渲染验收（2026-11-20）

## 页面与范围

- 真实目录页面：CatalogApp → “MES UI 套件”，交互示例位于“MES 单据编辑弹窗”卡片。
- 覆盖 `sunxu-web/mes` 的 `DocumentModalForm`：工作区全屏、显式视口全屏、固定宽度、遮罩行为、最小化、还原、关闭和宿主提交回调。
- 截图由本机 Chrome 和 Playwright 采集；完整截图路径、SHA-256 与 DOM 几何在 [`render-observations.json`](./render-observations.json)。

执行命令：

```sh
TARGET_URL=http://127.0.0.1:4173 node run.js /tmp/mes-document-modal-visual.js
```

## 已核对状态

- 桌面 1280×720：默认工作区全屏弹窗与示例工作区重合；表单页没有横向溢出。
- 桌面 1280×720：聚焦最小化按钮后按 Space，弹窗和遮罩隐藏，Textarea 仍挂载且内容未变；左下角还原条可见。聚焦还原条后按 Enter，弹窗恢复并保留草稿。
- 桌面 1280×720：调用方关闭按钮关闭受控 Modal；重新打开后宿主提交回调收到备注并更新页面状态。
- 桌面 1280×720：`viewportFullscreen` 模式填满 1280×720 视口，视口右缘无 32px 空带。
- 桌面 1280×720：固定 520px 弹窗居中显示；默认遮罩外点击不关闭；最小化、还原和自定义关闭均可用。
- 触摸窄屏 375×812：工作区弹窗为 309×480，落在当前示例工作区内；`bodyScrollWidth` 与 `htmlScrollWidth` 均为 375px；最小化后还原条仍在视口内。
- 浏览器 Console error 与 page error 均为 0。

## 关键几何

- 桌面工作区：`left=273, top=191.2, width=958, height=480`；Modal root 与工作区四边对齐。
- 桌面视口全屏：Modal root 和对话框均为 `1280×720`，四边均为 `0`。
- 桌面固定宽度：对话框宽 `520px`，左边界 `380px`，视口宽度 `1280px`。
- 触摸窄屏：工作区和对话框宽 `309px`，页面总宽仍为 `375px`。
- 最小化后表单字段仍留在 DOM 中；遮罩节点卸载；还原条为 `151×31px`，左边距 `16px`、底边距 `16px`。

## 截图

- [桌面工作区全屏](./document-modal-desktop-open-1280x720.png)
- [桌面最小化与草稿保留](./document-modal-desktop-minimized-1280x720.png)
- [桌面还原草稿](./document-modal-desktop-restored-1280x720.png)
- [桌面宿主提交回调](./document-modal-desktop-submitted-1280x720.png)
- [桌面视口全屏](./document-modal-desktop-viewport-fullscreen-1280x720.png)
- [桌面固定宽度](./document-modal-desktop-fixed-width-1280x720.png)
- [375px 工作区全屏](./document-modal-mobile-open-375x812.png)
- [375px 最小化与还原条](./document-modal-mobile-minimized-375x812.png)

## 未验收

- 自定义 `modalProps.getContainer` 与第三方容器的组合：`UNVERIFIED`。
- VoiceOver/NVDA 等读屏器完整操作流程：`UNVERIFIED`。

本记录只验收 `DocumentModalForm` 和上述目录状态，不代表 MES Web 的 627 项组件引用已全量迁入。
