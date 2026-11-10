# Sunxu Web 组件发布验收

状态：`PASS`。目录应用 `/` 的“可编辑明细”和“选择与文本”页面已在 1440×900 与 375×812 实际渲染。所有检查状态无页面异常；两个页面均无整页横向溢出。桌面暗色主题也已检查。

## 可复核截图

- [可编辑明细：桌面](./editable-table-verified-1440x900.png)
- [可编辑明细：键盘选中行](./editable-table-keyboard-selected-verified-1440x900.png)
- [可编辑明细：批量设置弹窗](./batch-settings-verified-1440x900.png)
- [可编辑明细：批量应用数量 8](./editable-table-batch-applied-verified-1440x900.png)
- [可编辑明细：手机](./editable-table-verified-375x812.png)
- [可编辑明细：桌面暗色主题](./editable-table-dark-verified-1440x900.png)
- [选择与文本：桌面](./text-controls-desktop-1440x900.png)
- [选择与文本：长文本弹窗及已选候选](./text-controls-long-text-dialog-1440x900.png)
- [选择与文本：手机](./text-controls-mobile-375x812.png)

## 检查结果

- `npm run typecheck`：通过。
- `npm run build`：通过。目录应用产物超过 Vite 默认单 chunk 体积提示阈值（约 1.08 MB，gzip 约 342 KB）。
- `EditableDetailTable`：键盘 Space 选中行、批量打开并设置数量为 8、应用回表格均通过；375px 下表格局部横向滚动提示可见，整页无横向溢出。
- `RemoteSelect`：搜索“王”后只显示两个匹配候选，并选择“王明 · 仓储”。
- `LongText`：展开“更多”后弹窗显示完整配送说明。
- [渲染观察与交互记录](./render-observations.json)；[选择与文本渲染记录](./text-controls-render-observations.json)。
- [间距及可见分隔审计](./spacing-audit.json)：8 个 seam 和 4 个 surface frame 均由审计校验器判定 `PASS`。
