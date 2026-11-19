# UX audit — sunxu-web shared components

对 `sunxu-web` 当前工作树做了组件实现与 MES 调用点的审计和修复，重点检查覆盖层、表格滚动和长文本查看。目标用户是使用 MES 管理端处理单据和列表的业务/运营人员；源码结论与目录应用运行态证据分开记录。

## 1. 范围与证据

**审计范围：** `sunxu-web` 的 `CrudListWorkbench`、`EditableDetailTable`、`BatchFieldSettingsButton`、`LongText` 与 MES 适配器；对照 MES Admin 的长文本和批量设置调用点。

**平台：** PC/Web 管理端。**证据：** 当前 `sunxu-web` 工作树 HEAD `79b669a`（工作区有未提交改动）；MES Admin 当前依赖锁定在 `sunxu-web` commit `6e40be2` / `0.4.8`，安装包没有 `sunxu-web/mes` 出口。因此报告结论针对本地正在演进的库源码，不能直接当作 MES Admin 已运行该工作树的结论。

**sunxu-web 目录应用 UI 验收：** 已验证 2026-11-20 工作树。真实目录路由在 1440×1000 与 375px 宽视口检查了长文本、列表填充滚动、批量设置弹窗和保存视图栏；截图及 DOM 几何数据见 `docs/verification/sunxu-web-component-fixes-2026-11-20/`。

**MES Admin 消费端：** `UNVERIFIED`。MES Admin 当前仍锁定 `sunxu-web` commit `6e40be2` / `0.4.8`，未消费本工作树中的修复。需更新依赖版本后再对 MES Admin 路由验收。

**未审计：** 每个 MES 页面/视口中的完整交互、生产数据状态、读屏和全键盘流程。未运行测试套件；类型检查与构建已通过。

### 证据记录

**已查看：** `src/components/CrudListWorkbench.tsx`、`EditableDetailTable.tsx`、`BatchFieldSettingsButton.tsx`、`LongText.tsx`、`SavedViewBar.tsx`、`src/mes/**`、`src/styles.css`、组件契约/使用政策，以及 MES Admin 对应调用点。另查看了 2026-11-10 历史验收材料和本次目录应用截图、几何记录。

**未查看：** MES Admin 更新到本工作树修复后的消费端运行结果、生产数据、读屏和全键盘流程。

## Appendix — reuse inventory

| 职责 | 搜索范围与权威实现 | 近似实现 / 差异 | 处理结论 |
|---|---|---|---|
| 弹窗、抽屉 | `sunxu-web/src/components/**` 的 Modal/Drawer 调用；基础覆盖层由 AntD `Modal` / `Drawer` 提供 | `LongText` 使用 `App.useApp().modal.info`；`SavedViewBar`、`BatchFieldSettingsButton` 直接用 `Modal`；`CrudListWorkbench` 直接用 `Drawer`。无自制通用 Modal 壳，也未找到 modal 内部类覆盖 | `reuse/extend`：继续使用 AntD 公开 API；宿主特定外观放在 scoped semantic styles |
| 表格长文本 | `src/components/LongText.tsx` 是通用截断和全文查看实现 | `src/mes/components/TableLongText.tsx` 保留 MES class；MES Admin 仍有 `src/components/patterns/TableLongText.tsx` 包装根层 `LongText`，并由 `ResizableTable` 和费用单列表调用 | `thin adapter`：MES class hook 是明确差异；发布并切换 `/mes` 后，应合并到库内适配器并移除宿主重复包装 |
| 明细批量设置 | `src/components/BatchFieldSettingsButton.tsx` 是字段选择、校验与 patch 应用的通用实现 | `src/mes/components/DocumentLineBatchSettingsButton.tsx` 将 MES 日期转换成字符串；MES Admin `src/components/patterns/DocumentLineBatchSettings.tsx` 仍有相似转换层，另外 StockCountDetailDrawer 有直接消费调用 | `thin adapter`：日期字符串契约是实际差异；当前包版本没有 `/mes`，迁移完成前重复层可解释，之后应只保留库内适配 |
| 列表/表格容器 | `CrudListWorkbench` 负责列表筛选和结果区；`EditableDetailTable` 负责可编辑明细 | MES Admin 多处导入 `CrudListWorkbench`；单据明细仍由宿主页面组件组合。库内 `renderTable` 插槽保留宿主可调整列宽能力 | `reuse/extend`：保留结果区/业务控制器边界；优先修复滚动适配的上游结构耦合 |

## 2. 摘要

审计确认并修复了三个主要问题：表格滚动/溢出逻辑依赖 AntD/ProTable 内部 DOM 类名；`LongText` 宽度省略时缺少全文入口；批量设置的远程 Select 缺少加载、字段级错误和重试反馈。定向扫描另发现 `SavedViewBar` 与主分类 Tabs 的间距和响应式样式也依赖内部类名，已一并改为公开语义类名。弹窗圆角问题没有发现 `sunxu-web` 自有 `.ant-modal-*` 覆盖；目录应用的批量弹窗窄屏滚动已实际检查。

## 3. 修复状态

本报告列出的 DS-01、STATE-01、DATA-01 均已在 `sunxu-web` 工作树修复并完成目录应用验证。MES Admin 消费端仍锁定旧版本，升级依赖后需再验收对应业务路由。

## 4. 发现

### D10 · Design system consistency

#### DS-01 · 列表填充与横向溢出依赖上游生成的 DOM 类名

| | |
|---|---|
| **Dimension** | Design system consistency（涉及响应式与滚动） |
| **Severity** | **Medium** |
| **Confidence** | Observed (code); 当前升级后的用户影响 Inferred |
| **Effort** | M |
| **Location** | `src/components/CrudListWorkbench.tsx:134–160`、`src/components/EditableDetailTable.tsx:325–349`、`src/styles.css:202–270` |

**Evidence (修复前)。** `CrudListWorkbench` 通过 `.ant-table-wrapper`、`.ant-table-thead`、`.ant-table-footer` 和 `.ant-table-pagination` 查找元素后计算 `scroll.y`；`EditableDetailTable` 通过 `.ant-table-content` 判断横向溢出。`styles.css` 又对 `.ant-pro-card-body`、`.ant-spin-container`、`.ant-table-container`、`.ant-table-body` 等多个上游节点强制设置 flex、overflow 和高度。定向扫描还命中 `SavedViewBar` 的 `.ant-spin-*` 和 `.ant-tabs-*` 布局选择器。

**Why it matters.** 用户依赖表头、分页和表体滚动来处理长列表；上游调整内部节点名称或嵌套层级后，这些测量可能找不到元素，或把 `overflow:hidden` 应用到不再合适的节点，导致表体高度错误、横向滚动提示消失或内容被裁切。当前源码检查不能证明这类故障已经发生；它证明的是共享组件将这项关键行为绑定在了非公开结构上。

**Resolution.** 已使用 Table、Spin、ProCard、Tabs 的公开 `classNames` 语义插槽标记滚动根节点、表头、分页、横向内容区和加载容器；测量逻辑只查询组件自己定义的标记，样式也只依赖这些标记。SavedViewBar 与主分类 Tabs 的间距、活动状态和窄屏宽度样式也改用语义插槽。目录应用验证填充表格内部滚动到末行时表头与分页仍可见，横向表格保留内部滚动；SavedViewBar 在窄屏没有造成页面横向溢出。

### D7 · State coverage / system status

#### STATE-01 · 批量设置的异步候选没有加载中状态

| | |
|---|---|
| **Dimension** | State coverage（涉及 System status & feedback） |
| **Severity** | **Medium** |
| **Confidence** | Observed (code); 用户等待时的影响 Inferred |
| **Effort** | S |
| **Location** | `src/components/BatchFieldSettingsButton.tsx:133–162`、`204–227` |

**Evidence.** 组件在弹窗打开时为远程 Select 请求候选，也在搜索时再次请求；组件只保存返回的 options，没有相应的 loading state。渲染 `<Select>` 时设置了 `showSearch` 和 `filterOption`，但没有传 `loading`。失败时只通过全局 `message.error` 提示。

**Why it matters.** 候选请求尚未完成时，用户看到的是空/旧候选列表，无法区分“没有匹配项”和“还在加载”；在单据批量修改中，用户可能重复搜索或误以为字段配置为空。

**Recommendation.** 按字段维护请求状态，将 `loading` 传给对应 Select；请求失败时在该字段附近显示可恢复提示，并保留重试路径。继续保留现有 request id 检查，避免旧请求覆盖新搜索结果。

**Resolution.** 已按字段维护 loading/error 状态，Select 展示加载状态，失败提示贴近字段并提供重试；请求序号避免旧搜索结果覆盖新结果。目录应用实际观察到 loading、错误与重试入口。

### D11 · Data display

#### DATA-01 · 长文本按宽度省略时可能没有全文入口

| | |
|---|---|
| **Dimension** | Data display（涉及 Responsive & platform conventions） |
| **Severity** | **Medium** |
| **Confidence** | Observed (code); 180px 调用点的实际裁切 Inferred |
| **Effort** | S |
| **Location** | `src/components/LongText.tsx:20–26, 49–56`；`../mes-main/mes-admin/src/pages/funds/expense-bills/index.tsx:437–440` |

**Evidence.** `LongText` 只在 `Array.from(text).length > maxLength` 时显示“更多”；预览文本同时交给 `Typography.Text ellipsis={{ tooltip: false }}`。MES Admin 的费用单“备注”列宽为 180px，调用 `maxLength={18}`。因此，长度不超过 18 个字符但实际宽度放不下的值会触发视觉省略，却不显示“更多”，Tooltip 也被明确关闭。历史目录截图只覆盖长于其 `maxLength` 的文本，不覆盖此边界。

**Why it matters.** 用户在表格里无法查看备注完整内容，必须另找编辑或详情路径；这让用于核对的业务信息在窄列中变成不可读的片段。

**Recommendation.** 统一“何时省略”和“如何查看全文”的判断：可以让省略文本本身提供可访问的全文查看，也可以检测实际宽度后显示明确的“更多”按钮。不要让宽度产生的第二种截断路径没有恢复入口。

**Resolution.** 已通过 `ResizeObserver` 比较预览区域的 `scrollWidth` 与 `clientWidth`，把宽度溢出和字符超长合并为同一“更多”入口；宽度或文本变化时重新测量。180px 表格列实测预览区域 120px、文本宽度 214px，“更多”可见且能打开完整内容。

## 5. 修复与验收结果

以下目录应用证据来自 `http://127.0.0.1:8087/`，截图目录为 `docs/verification/sunxu-web-component-fixes-2026-11-20/`，完整测量数据为 `dom-geometry.json`：

- **长文本：** 180px 列中，120px 预览区域对比 214px 文本宽度，宽度溢出时出现“更多”；点击后完整文本对话框可见。页面宽度仍为 1440px，没有横向溢出。截图：`01-long-text-180px-column.png`、`02-long-text-full-content.png`。
- **列表填充滚动：** 1084×360 工作区内表体高度 260px、内容高度 423px；实际滚轮后 `scrollTop=163`，第 9 行完全可见，表头 47px 和分页 27px 保持可见。截图：`03-crud-fill-scroll-end.png`。
- **批量远程 Select：** 加载指示、字段错误和重试按钮均可见。375×390 窄屏中弹窗 body 为 311×190px、内容高度 350px，滚到底后末字段与页脚均可见，文档宽度仍为 375px。截图：`04-batch-select-loading.png`、`05-batch-select-error-retry.png`、`06-batch-modal-narrow-bottom.png`。
- **保存视图栏：** Spin/Tabs 使用公开语义插槽。375px 视口中栏宽与内容宽均为 309px，文档宽 375px，没有页面级横向溢出。截图：`07-saved-view-bar-narrow.png`。
- 浏览器页面错误：`[]`。`npm run typecheck` 和 `npm run build` 均通过；构建只有现有的 catalog 1.1MB chunk 体积提示。

## 6. 保留项与未确认问题

**做得合理的部分：** 多数基础控件和 Modal/Drawer 直接由 AntD 承担；本次源码检索没有发现 `sunxu-web` 自己覆盖 `.ant-modal-content` 或其他 `.ant-modal-*` 类。`TableLongText` 和 `DocumentLineBatchSettingsButton` 保留 MES 的 class/date-string 契约并复用通用能力，属于有明确差异的薄适配方向。目录应用的长文本、滚动和窄屏弹窗截图与本次工作树相符。

**待确认：** MES Admin 当前安装包仍锁定 `0.4.8`，没有消费已修复的工作树；其 `sunxu-web/mes` 适配器切换和 MES 实际页面验收须在依赖更新后进行。本次修复没有修改或发布 MES Admin 依赖。
