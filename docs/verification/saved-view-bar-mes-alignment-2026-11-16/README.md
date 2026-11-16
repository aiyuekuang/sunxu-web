# SavedViewBar MES 样式对齐

## 基线与范围

- 基线仓库：`../mes-main/mes-admin`，固定参考提交 `133e8673e92c24119024f9b4fbcfe2ce5247bf79`；组件为 `src/components/document-view/DocumentViewBar.tsx`，样式见该提交的 `src/global.less`。
- 本次对齐：视图管理菜单放回各自标签；保持标签间距紧凑、当前文字下方的 2px 指示线、小型默认标签和 24px 管理按钮；排序与保存/另存操作靠近视图标签；窄屏将操作区移至下一行并右对齐。
- 不覆盖 Sunxu Web 的主题令牌；组件继续使用 `--ant-color-primary`。
- 路由：目录首页 → CRUD 列表工作台 → 复杂视图。通过真实 Vite 页面在 Chromium 检查。

## 几何与状态

- 桌面 `1440 × 1000`：页面横向溢出为 0；视图栏为 `x=273, y=382, 1118 × 42`，标签区与操作区间距 8px。排序、管理菜单、未保存、另存弹窗和切换确认均检查。
- 窄屏 `390 × 844`：页面横向溢出为 0；视图栏为 `x=33, y=418, 324 × 80`，分两行；标签选中项在标签可视区内。另存和排序弹窗为 `358px` 宽，左右边界为 `16px` / `374px`，未超出视口。
- 每个同名 `.json` 保存对应状态的 viewport、DOM 矩形、横向溢出、弹窗边界和浏览器控制台错误。
- 控制台在变更前后均出现既有警告：`antd: Space direction is deprecated`；本次没有引入页面错误。

## 截图

| 状态 | 桌面 `1440 × 1000` | 窄屏 `390 × 844` |
| --- | --- | --- |
| 视图栏 | [截图](desktop-view-bar-final-1440x1000.png) · [几何](desktop-view-bar-final-1440x1000.json) | [截图](mobile-view-bar-final-390x844.png) · [几何](mobile-view-bar-final-390x844.json) |
| 标签管理菜单 | [截图](desktop-view-menu-final-1440x1000.png) · [几何](desktop-view-menu-final-1440x1000.json) | — |
| 排序 | [截图](desktop-sort-dialog-final-1440x1000.png) · [几何](desktop-sort-dialog-final-1440x1000.json) | [截图](mobile-sort-dialog-final-390x844.png) · [几何](mobile-sort-dialog-final-390x844.json) |
| 另存为 | [截图](desktop-save-as-dialog-final-1440x1000.png) · [几何](desktop-save-as-dialog-final-1440x1000.json) | [截图](mobile-save-as-dialog-final-390x844.png) · [几何](mobile-save-as-dialog-final-390x844.json) |
| 未保存/切换 | [未保存](desktop-dirty-view-final-1440x1000.png) · [切换确认](desktop-switch-confirm-final-1440x1000.png) | — |

键盘完整流程、读屏器、深色主题和其他窄屏宽度未覆盖，仍为 `UNVERIFIED`。
