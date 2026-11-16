# SavedViewBar MES 样式对齐

## 基线与范围

- 基线仓库：`../mes-main/mes-admin`，固定参考提交 `133e8673e92c24119024f9b4fbcfe2ce5247bf79`；组件为 `src/components/document-view/DocumentViewBar.tsx`，样式见该提交的 `src/global.less`。
- 本次对齐：视图管理菜单放回各自标签；保持标签间距紧凑、当前文字下方的 2px 指示线、小型默认标签和 24px 管理按钮；排序放在 Tabs 右侧扩展区，保存/另存操作位于相邻工具区；窄屏将保存操作移至下一行并右对齐。
- 不覆盖 Sunxu Web 的主题令牌；组件继续使用 `--ant-color-primary`。
- 路由：目录首页 → CRUD 列表工作台 → 复杂视图。通过真实 Vite 页面在 Chromium 检查。

## 几何与状态

- 桌面 `1440 × 1000`：页面横向溢出为 0；视图栏为 `x=273, y=382, 1118 × 42`，标签区与操作区间距 8px。排序、管理菜单、未保存、另存弹窗和切换确认均检查。
- 窄屏 `390 × 844`：页面横向溢出为 0；视图栏为 `x=33, y=418, 324 × 80`，分两行；标签选中项在标签可视区内。另存和排序弹窗为 `358px` 宽，左右边界为 `16px` / `374px`，未超出视口。
- 每个同名 `.json` 保存对应状态的 viewport、DOM 矩形、横向溢出、弹窗边界和浏览器控制台错误。
- 控制台在变更前后均出现既有警告：`antd: Space direction is deprecated`；本次没有引入页面错误。

## 导航线与按钮组间距复核

截图反馈的问题来自排序按钮原先处在独立保存操作组中，Tabs 导航底线在标签区后结束。基线 MES 将排序放入 `Tabs.tabBarExtraContent.right`。本次按基线调整后，排序按钮进入导航区，底线在按钮下方收尾；保存/另存仍在相邻操作组。

- 桌面 `1440 × 900`：Tabs 导航底线 `y=421.4`；排序按钮底部 `y=415.9`，垂直间隔 `5.5px`；保存操作组与排序按钮水平间隔 `8px`。
- 容器窄于组件的 `767px` 断点时，导航和保存操作分行。`1024 × 900` viewport 下有效容器宽 `742px`，排序按钮底部与导航线仍相隔 `5.5px`；`704 × 900` 同为 `5.5px`；`390 × 844` 为 `7px`。
- 以上视口的页面横向溢出均为 `0`；排序入口打开排序弹窗正常。

## 截图

| 状态 | 桌面 `1440 × 1000` | 窄屏 `390 × 844` |
| --- | --- | --- |
| 视图栏 | [截图](desktop-view-bar-final-1440x1000.png) · [几何](desktop-view-bar-final-1440x1000.json) | [截图](mobile-view-bar-final-390x844.png) · [几何](mobile-view-bar-final-390x844.json) |
| 标签管理菜单 | [截图](desktop-view-menu-final-1440x1000.png) · [几何](desktop-view-menu-final-1440x1000.json) | — |
| 排序 | [截图](desktop-sort-dialog-final-1440x1000.png) · [几何](desktop-sort-dialog-final-1440x1000.json) | [截图](mobile-sort-dialog-final-390x844.png) · [几何](mobile-sort-dialog-final-390x844.json) |
| 另存为 | [截图](desktop-save-as-dialog-final-1440x1000.png) · [几何](desktop-save-as-dialog-final-1440x1000.json) | [截图](mobile-save-as-dialog-final-390x844.png) · [几何](mobile-save-as-dialog-final-390x844.json) |
| 未保存/切换 | [未保存](desktop-dirty-view-final-1440x1000.png) · [切换确认](desktop-switch-confirm-final-1440x1000.png) | — |

反馈问题修正后的导航线/按钮组状态：桌面 [1440 × 900](after-dirty-1440x900.png) · [1024 × 900](after-dirty-1024x900.png)；窄屏 [704 × 900](after-dirty-704x900.png) · [390 × 844](after-dirty-390x844.png)；[排序弹窗](after-sort-dialog-1024x900.png)。对应 DOM 几何数据分别保存在同名 `.json` 文件。

键盘完整流程、读屏器、深色主题和其他窄屏宽度未覆盖，仍为 `UNVERIFIED`。
