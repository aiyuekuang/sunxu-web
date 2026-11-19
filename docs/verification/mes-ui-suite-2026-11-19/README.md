# MES UI 套件渲染验收

## 覆盖范围

本记录验收当前 `sunxu-web/mes` 中的 `TableLongText`、`DocumentLineBatchSettingsButton`、`DocumentLineQuantityInput`、`PermissionButton`、`StatusDisplay` 和 `MesUiProvider`，使用目录真实页面“MES UI 套件”。截图由本机可见 Chrome 经 Playwright 采集；DOM 几何与页面横向溢出写入 `render-observations.json`，间距边界写入 `spacing-audit.json`。

执行命令：

```sh
TARGET_URL=http://127.0.0.1:4173 node run.js /tmp/mes-ui-suite-visual.js
```

## 已核对状态

- 桌面 1280×720：默认明细、悬停全文 Popover、批量设置弹窗、四字段应用结果、深色主题。
- 桌面 1280×720：宿主权限注入后的可见/隐藏操作、普通回调、确认弹窗、成功提示。
- 桌面 1280×720：数量输入接受有效小数；清空草稿后失焦恢复最近有效值。
- 桌面 1280×720：Tag、Badge、文本及空状态四种状态显示方式。
- 触摸 375×812：默认明细、触摸打开全文 Popover、再次触摸关闭、表格 `End` 键横向滚动、批量设置弹窗。
- 横屏 844×390：默认明细、批量设置弹窗顶部和字段区滚动到底部。
- 批量 patch 内容：`quantity: 10`、`dueDate: "2026-12-03"`、`warehouse: "line-side"`、`note: "来料检验后入库"`。
- 权限按钮截图：`suite-desktop-permission-buttons-1280x720.png`、`suite-desktop-permission-confirm-dialog-1280x720.png`、`suite-desktop-permission-confirmed-1280x720.png`。

## 关键渲染数据

- 桌面页面外框四侧间距均为 24px；375px 与 844px 视口四侧间距均为 16px。
- 375px 视口的表格滚动容器为 275px，表格内容宽 566px；按 `End` 后 `scrollLeft` 为 291px。文档宽度仍为 375px。
- 触摸全文 Popover 位于 `left=3` 至 `right=354`，375px 页面没有横向溢出，触发器 `aria-expanded=true`。
- 844×390 弹窗固定在 `top=40` 至 `bottom=350`；字段区高 190px、内容高 328px，底部“应用至 3 行”按钮保持可见。
- `spacing-audit.json` 经 `validate_spacing_audit.py` 验证通过，包含 3 个页面标题到首个内容卡片的间距接缝。

## 尚未验收

- 读屏器完整操作流程为 `UNVERIFIED`。
- 远程仓库候选的失败、重试和请求竞态由组件契约覆盖，但本次截图脚本未执行这些状态。
- 本记录只覆盖以上 MES 组件，不代表 627 项 MES 组件使用快照已经全部迁入或完成逐项验收。
