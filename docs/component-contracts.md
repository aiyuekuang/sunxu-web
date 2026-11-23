# Web 组件契约

## 共用边界

所有原子控件和 Pro 模板的状态以 Ant Design / Pro Components 当前公开 API 为准。Sunxu Web wrapper 不复制按钮、输入框、弹窗、表格或表单字段的交互状态；宿主保留数据请求、状态值、路由、权限决定和动作结果。

新增或变更 wrapper 时，同步记录职责、上游来源、API、状态、间距所有者、响应式规则、无障碍和已验证视口。本文列出的 wrapper 是当前公开自有层。

## 组件目录

| 组件 | Layer / 稳定任务 | Source of truth |
|---|---|---|
| `SunxuWebProvider` | 主题基础；应用主题和 Ant Design 上下文 | AntD `ConfigProvider` / `App` + Sunxu semantic tokens |
| `ScreenContainer` | 页面根结构；提供一致的工作区内边距 | `main` + `--sxw-space-*` |
| `PageHeader` | 识别当前页面并放置页级动作 | AntD `Breadcrumb` / `Typography`；`headingLevel` 默认 1 |
| `ListScreenContainer` | 组织特殊列表的标题、紧邻工具栏和结果区 | `ScreenContainer` + `PageHeader`；标准 CRUD 列表优先用 `CrudListWorkbench` |
| `CrudListWorkbench` | 组合分类/状态、轻筛选、高级筛选、视图插槽与表格结果适配器；不渲染页级标题 | `ListScreenContainer` + `FilterBar` + `StatusTabs` + Pro Components 3 ProTable |
| `PaginationSummary` | 在分页栏左侧显示宿主提供的筛选结果摘要 | AntD `Pagination.showTotal`；统计口径由宿主提供 |
| `SavedViewBar` | 选择和管理受控的系统/个人列表视图 | AntD Tabs / Dropdown / Modal；视图数据和持久化由宿主提供 |
| `FormScreenContainer` | 分离可滚动表单内容和固定 footer | `ScreenContainer` + `StickyActionBar`；ProForm 归宿主 |
| `DetailScreenContainer` | 组织详情内容和固定操作区 | `ScreenContainer` + `PageHeader` |
| `MesDetailPageContainer` / `MesDetailPageContent` / `MesDetailPageState` | 组合 MES 详情页面框架、纯内容插槽及加载/错误/空状态 | `DetailScreenContainer` + `DetailHeader` / AntD `Spin`、`Empty`、`Button`；状态与重试决策由宿主提供 |
| `HeaderActionButton` | 统一纯图标顶栏/工具栏操作的尺寸、颜色和交互态；必填 `aria-label` | AntD `Button` + AntD semantic tokens；Tooltip、Popover、Badge 和动作由宿主组合 |
| `MesAnnouncementBanner` | 轮播呈现公告摘要、优先级、数量和当前项隐藏操作 | AntD `Button` / `NotificationOutlined` + 语义公告样式；数据、权限、轮询与导航由宿主提供 |
| `MesMenuSearchInput` | 呈现受控菜单搜索输入与候选上下文 | AntD `AutoComplete` / `Input`；过滤、键盘导航、菜单授权和路由由宿主提供 |
| `MesBusinessSideNavView` | 呈现一级业务导航、分组子导航和折叠弹出菜单 | 语义 `nav` / `a` / `button` + AntD Popover/Tooltip；可见项、选中状态与导航由宿主提供 |
| `MesNotificationPanel` | 呈现通知 Popover、未读/加载/空列表和已读/全部/查看全部入口 | AntD `Popover` / `Listy` / `Empty` / `Spin`；通知数据和所有动作由宿主提供 |
| `MesThemeOptionsPanel` | 呈现主题选项、色样、当前选择和键盘焦点 | 语义 `<button aria-pressed>` + AntD semantic tokens；主题应用/持久化由宿主提供 |
| `MesAppDownloadPanel` | 呈现 App 下载状态、二维码、版本、iOS 指引和服务器地址 | AntD `Typography` / `Spin` / `Empty`；发布信息、地址与二维码由宿主提供 |
| `MesSupportQRCode` | 呈现支持账号、复制入口和宿主生成的二维码 | AntD `Typography.Text` copyable + AntD theme tokens；联系信息和二维码由宿主提供 |
| `StickyActionBar` | 承载固定流程动作 | 语义 `<footer>` + AntD Button |
| `SectionCard` | 分组可选标题的内容，不制造空 header | Pro Components `ProCard` |
| `StatusTabs` | 在互斥状态中选择当前结果集合 | AntD `Segmented` |
| `StatusTag` | 以 Ant Design 实底颜色呈现单条只读状态 | AntD `Tag`，固定 `variant="solid"` |
| `MesStatusTag` | 将宿主 MES 状态字典映射为统一只读标签，并处理空值/未知值 | `StatusTag` + 宿主 `enumMap`；状态词条与业务值由宿主提供 |
| `MesReportQuickRangeButtons` | 受控选择报表快捷范围；只报告被选中的选项 key | AntD `Segmented`；日期范围匹配和日期语义由宿主提供 |
| `MesConfigEntryLink` / `MesConfigEntryFieldLabel` | 在授权且有目标地址时，把配置入口附在字段标签旁 | AntD `Typography.Link` / `Space`；路由与权限结果由宿主传入 |
| `MesConfigurableProFormSelect` | 将 MES ProForm 远程选择器与空候选配置入口及回访刷新组合 | Pro Components `ProFormSelect`；请求、依赖规则、权限和路由由宿主传入 |
| `MesDictionaryProFormSelect` / `MesDictionaryFormItem` | 将宿主字典加载/错误/重试状态接入 ProForm 或原生 Form Select | Pro Components `ProFormSelect` / AntD `Form.Item` + `Select`；字典服务由宿主传入 |
| `MesExportButton` / `MesExportDropdownButton` | 保留单项/多项导出 loading、布局准备回调和下载结果回调 | AntD `Button` / `Dropdown`；权限、导出请求、布局与下载由宿主传入 |
| `QuickDateRangePicker` / `QuickProFormDateRangePicker` / `QuickProFormDateTimeRangePicker` | 给 AntD 和 ProForm 日期范围字段保留调用方快捷范围，并补齐通用快捷日期 | AntD `RangePicker` / Pro Components 日期范围字段；窄屏日历面板由公开语义样式限宽并支持横向滚动 |
| `FilterBar` | 收纳查询条件和其右侧同级操作 | HTML `role=search` + 宿主控件 |
| `MetricCard` | 显示一个可读的关键数值 | AntD `Statistic` + Pro `ProCard` |
| `DetailCard` | 将属性按标签和值组成信息组 | AntD `Descriptions` + Pro `ProCard` |
| `SettingsRow` | 显示设置、链接或单一行操作 | 语义 `<a>` / `<button>` / `<div>` + AntD icon |
| `ProfileIdentity` | 组合头像、姓名和宿主摘要字段 | AntD `Avatar` / `Button` / `Typography` |
| `ChartPanel` | 给宿主图表提供统一标题和数据状态 | Pro `ProCard` + AntD `Spin` / `Empty` / `Alert` |
| `ErrorBoundary` | 隔离渲染错误并提供宿主兜底/重试 | React error boundary + AntD `Result` |
| `PermissionGuard` | 消费宿主已计算的授权结果 | 受控 `permitted` prop；不做权限决策 |
| `EditableDetailTable` | 编辑重复明细行，选择多行并按字段批量设置 | AntD ProTable + 受控 `rows`；请求和业务字段由宿主提供 |
| `BatchFieldSettingsButton` | 让用户勾选要覆盖的字段并应用到已选行 | AntD Modal / 表单控件；patch builder 由宿主提供 |
| `RemoteSelect` | 用 AntD Select 展示远程候选并防抖搜索 | AntD Select；`onSearch` 由宿主提供 |
| `MaterialFilteredSelect` / `MaterialSelectField` / `MaterialMultiSelectField` | 保留 MES 物料筛选、单/多选字段和扫码候选校验 | AntD Select + Pro Components `ProForm.Item`；数据和宿主集成由 `MesUiProvider` 注入 |
| `MasterDataQuickCreateSelect` | 在客户/供应商关联候选下拉中新增主数据并回填当前 ProForm 字段 | Pro Components `ProFormSelect` + AntD Select / Drawer；新建表单、权限和配置路由由 `MesUiProvider` 注入 |
| `AccountingBookField` / `FiscalPeriodField` / `VoucherWordField` / `AccountField` | 会计账簿、期间、凭证字和科目字段；按账簿联动候选、默认值与空数据配置入口 | Pro Components `ProFormSelect`；MES 列表服务和配置路由由 `MesUiProvider.accountingSelectorCapabilities` 注入 |
| `PurchaseReceiptCapacitySummary` | 显示采购订单量、已收量和待收量，并按 MES 数量/单位口径格式化 | AntD `Space` / `Typography.Text`；单位标签映射由宿主传入 |
| `GeneratePurchaseReceiptBatchNoButton` | 按采购收货批号规则请求系统批号，并回填当前明细 | AntD `Button` / `Tooltip` / `App`；批号请求由 `MesUiProvider.purchaseReceiptCapabilities` 注入 |
| `PurchaseReceiptSourcePicker` | 分页选择待收采购来源行，保留来源排序、剩余数量、跨页已选和数量限制 | MES `ResizableProTable`；列表请求、选择判定、格式化与超限提示由宿主注入 |
| `IncomingInspectionCell` | 显示来料检验结果和原因；有权限时提供检验单导航 | AntD Tag / Tooltip / Button；状态标签、权限结果和导航回调由宿主提供 |
| `IncomingInspectionPolicyCard` | 提醒物料档案不再控制 IQC 触发，检验方案配置入口由业务维护 | AntD `Card` / `Typography.Text`；由 MES 套件保留的静态政策说明 |
| `PurchaseReturnOutboundModal` | 录入采购退货出库、退款账户、日期、批次/仓位并显示库存预览 | AntD `Modal` / ProForm + MES 库存选择器；账户/出库服务、权限、日期规范化和成功提示由宿主注入 |
| `PurchaseReturnEditDrawer` | 编辑采购退货来源行/独立退货明细、扣款及自定义字段 | Pro `DrawerForm` / AntD Form / MES 库存选择器；订单与仓位候选、服务、价格权限、金额计算、字典和提示由宿主注入 |
| `PurchaseReceiptActionModal` / `PurchaseOrderViewSwitch` / `SendPurchaseOrderModal` | 承载采购入库动作、采购订单视图切换和发送采购订单 | Pro `ModalForm` / AntD；采购动作 API、授权结果、邮件发送/附件、通知与刷新由宿主注入 |
| `RequisitionFormModal` / `CreateInquiryDrawer` / `ConvertToOrderDrawer` | 编辑请购单、从请购创建询价和转换采购订单 | ProForm / AntD Drawer；字典、候选查询、权限、路由及提交服务由宿主注入 |
| `BomExpansionCreateModal` | 从选定物料预览 BOM 展开结果与来源/警告，并生成请购单 | MES `OrderItemEditor` / `BatchMaterialAddButton` / `ResizableTable` / `DocumentModalForm`；预览/创建、物料候选、权限、字典与反馈由宿主注入 |
| `BomImportWorkbenchDrawer` | 选择 BOM 导入映射方案，预览源/映射行，确认或忽略待建物料候选并执行导入 | AntD Drawer / `ModalForm` / MES `ResizableTable`；映射/预览/执行/候选服务、字典、字段帮助和消息由宿主注入 |
| `PurchaseInquiryActionModals` | 登记报价、比价定标、绑定物料并从询价转换订单 | ProForm / AntD Modal + MES `MaterialFilteredSelect`；详情/比价/报价/绑定/转换服务、权限、配置入口和提示由宿主注入 |
| `PurchaseOrderFilterDrawer` / `PurchaseOrderDetailFilterDrawer` | 编辑采购订单列表和详情台账的筛选条件 | AntD Drawer / ProForm；远程候选、状态选项、条件值与查询/重置回调由宿主注入 |
| `SendActionModal` / `SendAttachmentRow` | 发送业务单据并管理附件预览与下载 | AntD Modal / Upload；收件人、邮件服务、附件授权和下载能力由宿主注入 |
| `SaleReturnReceiveModal` / `SaleReturnReverseModal` / `SaleReturnStockConversionDrawer` / `SaleReturnEditDrawer` | 处理销售退货收货、冲正、库存转换和退货编辑 | AntD / ProForm + MES 字段适配；服务、选项/字典、价格权限、自定义字段和反馈由宿主注入 |
| `SaleOrderShipActionModal` / `SaleDeliveryDocumentActionsDropdown` / `ConvertToProductionDrawer` | 提供销售订单出库入口、出库单动作菜单和转生产抽屉 | AntD / MES `DocumentModalForm`；编辑器、单据/审批/转换 API、权限、字典、打印和导航由宿主注入 |
| `SaleDeliveryItemsPanel` / `SaleDeliveryEditorModal` / `ProductSerialPicker` / `PackageUnitPickerModal` / `SaleOrderLineEditableTable` | 编辑销售出库明细和订单行，选择可用成品序列号及包装单元 | ProForm / AntD / MES 表格；出库/订单记录、库存/价格、权限、字典、自定义字段与物料/BOM/图纸选择器由宿主注入 |
| `CustomerOrderPortalQrModal` | 展示客户订单门户二维码，维护门户字段/可见订单数量/已发货订单天数，并切换客户库存可见性 | AntD Modal / Form；二维码生成/重生成、配置、权限、URL 与 QR renderer 由宿主注入 |
| `SendQuotationModal` / `QuotationFormDrawer` / `QuotationBindMaterialsModal` | 编辑/发送报价、选择绑定的客户物料并生成分享/发送内容 | Sunxu MES 单据表单与明细编辑器；客户/人员/价格/字典/权限/上传/发送与绑定 API 由宿主注入 |
| MES 单据视图切换预设 | 为采购申请/订单/退料/入库、销售订单/出库/退货、报价和生产领料保留各自的无障碍名称 | `createDocumentViewSwitch` 工厂；受控视图状态由宿主管理 |
| `BusinessInvoiceCoverageCard` | 展示采购/销售来源单据的开票覆盖、关联发票、待定价与待红冲信息，并续填草稿或生成发票 | AntD `Card` / `Alert` / `Modal` / `App` + MES `ResizableProTable`；权限、覆盖/生成请求及保留返回地址的发票导航由 `MesUiProvider.businessInvoiceCoverageCapabilities` 注入 |
| `BusinessInvoiceLineTable` | 显示业务发票行、金额/数量及自定义字段；保留采购/销售列变体 | MES `ResizableTable`；金额/单位格式、明细列和价格可见性由宿主提供 |
| `BusinessInvoiceRelationsLedger` | 分页呈现往来关系与会计/发票状态，提供授权详情入口 | MES `ResizableProTable`；数据、字典、权限和导航由宿主提供 |
| `BusinessInvoiceCreateDrawer` / `BusinessInvoiceEditDrawer` / `BusinessInvoiceLineFormList` | 创建/编辑业务发票及动态明细 | ProForm / AntD `Form.List`；来源字段、自定义字段 schema、字典、金额/数量格式、API 与成功回调由宿主注入 |
| `BusinessInvoiceMatchDrawer` / `InvoiceSourceCandidateTable` / `InvoiceSourceBatchModal` | 单笔来源匹配、候选筛选与多来源批量发票分组 | MES `ResizableTable` / ProForm / AntD Drawer；来源查询、预检、价格权限、分组提交和通知由宿主注入 |
| `BusinessInvoiceDetailLedger` / `BusinessInvoiceOpeningImportDrawer` | 查看采购/销售业务发票台账并按 CSV 模板导入期初发票 | MES `ResizableProTable` / AntD Drawer / Upload；筛选、分页、保存视图、导出、模板下载、导入请求和权限由宿主注入 |
| `ProductCostResultsTable` | 服务端分页、排序呈现产品成本结果和汇总状态 | MES `ResizableProTable`；查询、金额格式、状态词条和分页配置由宿主提供 |
| `InventoryOpeningBalancePanel` / `InventoryResultTable` / `InventoryStockSummaryTable` | 维护存货期初、查看核算结果和库存余额汇总 | MES `ResizableProTable` / AntD；查询/导入服务、权限、分页、数量/金额格式和提示由宿主注入 |
| `OpeningWipModal` / `ClosingWipModal` | 按在产品类型维护期初与期末金额、数量及明细 | Pro `ModalForm` / `Form.List`；字典、金额汇总、服务、权限与刷新由宿主注入 |
| `ExpenseCollectionModal` / `ProductCostCollectionsPanel` | 维护费用归集记录并触发成本归集，展示当期已归集状态 | ProForm / MES `ResizableProTable`；服务、权限、状态/科目格式、分页和提示由宿主注入 |
| `ScanAwareInput` | 输入框聚焦时识别键盘楔子扫码流，写回扫描码并通知宿主；失焦或禁用后停止监听 | AntD `Input`；按键间隔、最短码长、空闲重置与结束键采用 MES `useScanGun` 源码契约 |
| `WarehouseRemoteSelect` | 远程搜索仓库并按候选范围/类型族收窄；当前值缺少首屏选项时仍显示历史名称，变更时回传仓库 ID 与名称 | 通用 `RemoteSelect`；仓库请求与类型族合并由 `MesUiProvider.warehouseRemoteSelectCapabilities` 注入 |
| `BatchSuggestInput` | 按物料/仓库/货主条件远程搜索批次；出库过滤已耗尽/过期批次，入库排除已耗用批次；扫码精确匹配时回传批次记录 | AntD `AutoComplete` / `Spin` + MES `useScanGun`；批次列表和状态文案由 `MesUiProvider.batchSuggestCapabilities` 注入 |
| `ReasonActionModal` | 对需要审计原因的高风险动作收集非空原因；提交时去除首尾空格，异步执行时显示确认 loading，重新打开时清空草稿 | AntD `Modal` / `Input.TextArea` / `App`；操作执行与关闭由宿主控制 |
| `DetailDocumentActions` | 根据服务端可用动作、宿主权限及页面可见条件筛选详情动作；主操作直显，其余收进带文字的“更多操作” | AntD `Button` / `Dropdown`；权限和操作回调由 `MesUiProvider` / 宿主提供 |
| `DetailLedgerDocumentActions` | 在台账中按需加载权威单据动作；直连配置动作、交给宿主处理的业务动作或返回单据详情 | 复用 `DocumentActionsDropdown`；详情加载、动作处理和路由由宿主提供 |
| `WorkOrderScanSelect` | 远程搜索工单并按精确/前缀候选排序；搜索快照未跟上时阻止旧候选选择；扫码解析后执行宿主校验并按 ID/工单号回填 | AntD `Select` + MES `useScanGun`；工单列表和扫码解析由 `MesUiProvider.workOrderScanSelectCapabilities` 注入 |
| `DocumentViewLegacyRedirect` | 将历史明细台账路径重定向到目标单据页，先写入“明细”视图偏好并保留当前 query | AntD `Empty`；当前路径、查询串和路由替换由 `MesUiProvider.actionIntentRoute` 提供 |
| `DocumentFilterDrawer` / `DocumentFilterButton` | 汇总已应用筛选项并打开单据筛选抽屉；筛选内容独立滚动，查询/重置 submitter 传送到固定底栏，关闭后保留内容 | AntD `Drawer` / `Tag` / `Button` + React Portal；提供 `createDocumentFilterSearchConfig` 和 `renderDocumentFilterDrawerActions` 适配 QueryFilter/ProForm |
| `DetailLedgerFilterDrawer` | 通过字段定义组合文本、下拉、日期范围、开关筛选；应用成功关闭、加载时禁用表单；提供日期范围与 start/end 请求参数的捕获/恢复 | ProForm + `DocumentFilterDrawer`；选项请求、提交和重置由宿主提供 |
| `DocumentViewBar` | 组合 MES 单据个人视图与筛选按钮；把视图对象、另存参数和脏切换流程适配到 `SavedViewBar` | Sunxu `SavedViewBar` + `DocumentFilterButton`；视图控制器和筛选开关由宿主提供 |
| `PriceControlPrecheckButton` | 确认/发送前展示服务端价格提醒、阻断和审批结果；支持页面前置校验、无原始预检权限回退、例外申请、二次确认与失败对话框 | MES `PermissionButton` + AntD `Modal` / `Alert`；原始权限、预检/例外 API 和错误消息由 `MesUiProvider.priceControlCapabilities` 注入 |
| `MaterialPriceSection` | 编辑物料参考进价/售价并展示有权限的价格上下界、币别、移动加权平均成本及币别提示；跳转到物料价格规则或销售价目 | Ant Design `Form` / `InputNumber`；价格更新服务、权限结果和路由导航由宿主 props 注入 |
| `SaleOrderDetailLedger` / `SaleReturnDetailLedger` / `SaleDeliveryDetailLedger` / `SaleDeliveryDocumentActionDrawer` | 展示销售订单、退货、出库明细与出库单动作抽屉；订单交期和出库日期读取明细记录的原始日期字段；行菜单首次点击即展开动作 | MES `ResizableProTable` / `DocumentDetailLedgerTable` / AntD Drawer；请求、格式、权限、动作和刷新由宿主 capabilities 注入 |
| `PackageSpecManager` / `PackageUnitCreateDrawer` | 管理物料包装规格，并按批次/生产入库/库存来源创建包装单元；保留查询、删除确认、字段校验、建议箱规和来源筛选 | AntD / ProForm / MES `ResizableProTable`；服务、权限、字段选项、配置入口及反馈由宿主 capabilities 注入 |
| `ExpenseBillLinesEditableTable` / `FundsTransactionDrawer` | 编辑费用单明细并展示资金流水详情；保留必填/数值校验、来源快照、自定义字段、公式预览、合计与空值回退 | MES `DocumentLineEditableTable` / AntD Drawer；入库单搜索、公式预览、流水查询与格式化由宿主 capabilities 注入 |
| `ProductionBomSelect` | 提供 MES BOM ProForm 字段；保留物料/销售订单联动、唯一候选自动选中、关键词参数、请求竞态保护、字段说明及返回配置页后的重新请求 | Pro Components `ProFormSelect`；BOM 请求、`bomHeaderId` 字段帮助和有权限时的 BOM 配置标签由 `MesUiProvider.productionBomSelectCapabilities` 注入 |
| `MaterialSupplierPriceTierSummary` | 供应商阶梯价只读摘要；等级、默认状态和优先级排序后显示前三项与剩余项数量 | Ant Design `Space` / `Tag`；等级字典、默认币种和金额脱敏由 `MesUiProvider.supplierPriceTierCapabilities` / `maskAmount` 提供 |
| `MaterialSupplierPriceTiersModal` | 查询并维护物料-供应商阶梯价；保留新建/编辑字段、权限门控、价格脱敏、删除确认和保存后刷新 | AntD `Modal` / Pro `ModalForm` / `ResizableProTable`；请求、权限结果、字典、单位换算与备注帮助由 `MesUiProvider.supplierPriceTierCapabilities` 注入 |
| `CustomFieldFormSection` | 按 MES 字段 schema 生成 ProForm 字段；保留 create/update 必填规则、数值范围、选项禁用、详情值回填、加载重试和 runtime 回调 | ProForm 字段；schema、值详情和错误文案由 `MesUiProvider.customFieldFormCapabilities` 提供 |
| `DocumentLineCustomFieldFormItems` | 按单据行自定义字段 schema 生成 `Form.Item` / `Col`；过滤停用、隐藏和非输入字段，保留排序、字段类型、必填和日期字符串契约 | Ant Design `Row` / `Col` / `Form.Item`；schema 与 NamePath 由宿主传入，行布局由调用方提供 |
| `documentLineCustomFieldColumns` helpers | 按同一单据行 schema 生成编辑列、只读 Pro/AntD 列、payload、运行时预览行和聚合汇总 | AntD / ProTable 列契约与 `CustomFieldCell`；schema、行数据、预览响应、权限及保存由宿主提供 |
| `DocumentDetailLedgerTable` | 统一单据物料明细台账外壳；保留视图切换、筛选、个人视图排序/列配置、分页列表、汇总、导出与新增入口 | Sunxu `ResizableProTable` / MES `DocumentViewBar` / `DocumentFilterDrawer` / `PermissionButton`；请求、导出动作/下载、权限判断和记忆分页由 `MesUiProvider.documentDetailLedgerCapabilities` 及调用方提供 |
| `PrintLayout` | A4 打印根容器，含公司 Logo、单据标题/编号、元信息、打印日期、内容和 MES 页脚 | 内联 `PRINT_STYLES`；打印执行与模板数据由宿主提供 |
| `DotMatrixLayout` | 针式连续纸根容器，含公司抬头、单据标题/编号/日期和内容 | `DOT_MATRIX_STYLES` 由宿主注入打印 iframe，组件不在主文档插入打印样式 |
| `LabelLayout` | 小尺寸标签打印根容器，按宿主保存的纸张方向添加 `horizontal` / `vertical` 类 | `MesUiProvider.labelLayoutCapabilities` 提供当前方向；`LABEL_STYLES` 由宿主注入打印 iframe |
| `AccountingCrudPage` | 会计类基础资料服务端 CRUD 台账；复用列、搜索、排序、权限按钮和新增/编辑 ModalForm | MES `ResizableProTable` / `PermissionButton` / Pro `ModalForm`；服务、权限结果、字段及分页由调用方提供 |
| `AccountImportModal` / `OpeningBalanceImportModal` | 导入会计科目和期初余额文件，展示模板/校验及导入结果 | Pro `ModalForm` / AntD Upload；模板下载、权限、导入服务和反馈由宿主注入 |
| `LedgerQueryContext` / `NarrativeSummaryTable` / `TrialBalanceButton` | 共享总账筛选与导航上下文、分页摘要台账和试算动作 | MES `ResizableProTable` / AntD；筛选字典、分页配置、试算请求、权限和导航由宿主注入 |
| `PurchaseAccrualDetailDrawer` / `PurchaseAccrualPreviewDrawer` | 查看暂估单详情和冲销预览并承载冲销操作 | AntD Drawer / MES `ResizableProTable`；权限、服务、状态/来源字典、暂估来源导航和通知由宿主注入 |
| `ReverseLandedCostModal` | 说明采购附加费用冲销的承运商贷项和库存重估影响，录入必填原因/业务日期并回调成功 | Pro `ModalForm` / ProForm；冲销服务、日期规范化与完成后刷新由宿主注入 |
| `LandedCostFormDrawer` / `LandedCostDetailDrawer` / `LandedCostReceiptContextCard` | 创建或编辑采购附加费用、查看分摊及会计来源、从采购入库查看相关费用 | AntD Drawer / ProForm / MES `ResizableProTable`；费用/入库服务、权限、字典、金额/日期格式和通知由宿主注入 |
| `AccountingReconciliationModals` / `BookModal` / `AccountModal` / `ProductCostWipPanels` | 对账创建/明细/匹配、账簿/科目编辑及期初/期末在产品处理 | AntD / ProForm；账务服务、权限、字典、远程选择器、刷新和 WIP 宿主表单由调用方注入 |
| `FundsTransactionModals` / `FinanceInvoiceCurrencyRepairModal` / `FinanceInvoiceCancelModal` / `CreditNoteRefundModal` | 创建/导入资金流水、修复发票币别、取消发票与贷项退款 | ProForm / AntD；资金/发票服务、权限、字典、模板下载、来源导航和消息由宿主注入 |
| `PaymentRequestActionModals` / `ExportTemplateModal` / `SendStatementModal` | 调整并执行付款申请、配置对账单导出模板、发送往来对账单 | ProForm / AntD；权限、账户/方式选项、模板查询/上传/下载、发送请求和通知由宿主注入 |
| `CustomFieldValuePanel` | 查询并展示 MES 自定义详情/公式字段，必要时打开动态字段编辑抽屉 | Pro `ProDescriptions` / `DrawerForm` + AntD 状态/空态；schema/value 查询、保存与错误格式由 `MesUiProvider.customFieldFormCapabilities` 注入 |
| `FormulaDesigner` | 编辑自定义字段公式，浏览字段/函数/运算符目录并预览结果、类型和依赖 | AntD Modal / Tabs / Input + ProFormTextArea；schema、公式预览、权限结果与错误格式由宿主注入 |
| `ApprovalPanel` | 展示审批状态与步骤时间线，并根据权限和当前节点提供提交、撤回、通过、驳回及重新审批 | AntD `Card` / `Timeline` / `Alert` / `Modal`；实体审批状态、动作 API、实体权限策略和全局审批处理权限由 `MesUiProvider.approvalCapabilities` 注入 |
| `BomCostSnapshotEditor` | 按本单 BOM 快照查看成本/库存；支持可授权的数量调整、删除/恢复、批准替代料和供应商价选择 | Sunxu `MaterialFilteredSelect` / `ResizableTable`；BOM 成本预览和单位标签由 `MesUiProvider.bomCostSnapshotCapabilities` 提供 |
| `BomEffectiveBomSelector` | 解析系列基础/型号差异 BOM 的有效型号版本；保留多候选处理、展开确认与解析提示 | Sunxu `MaterialFilteredSelect` + AntD `Alert` / `Select`；物料查询、BOM resolver 与选中版本回写由宿主 capabilities/回调提供 |
| `BomWorkspaceDetail` | 展示 BOM 详情、有效版本解析、多级展开树/图、警告重试与导出/详情入口 | AntD / MES BOM 组件；BOM 请求、导出许可、状态/单位标签、图表 renderer 与路由由宿主提供 |
| `BomExplosionTree` | 把递归 BOM 展开节点、数量口径和警告转换为 MES 树图配置与摘要 | AntD 状态/提示组件；宿主 `renderChart` 接收 chart option、尺寸、loading 和无障碍名称并提供 ECharts renderer |
| `BomItemSourcingModal` | 维护 BOM 位允许的供应商价目、主选、优先级和移除操作 | AntD `Modal` / `Select` + Sunxu `ResizableTable`；候选/来源读写和成功/警告消息由宿主注入 |
| `BomVersionHistoryDrawer` | 展示 BOM 版本号、状态、变更说明和更新时间；行或版本号点击均回调当前版本，并支持权限过滤的动作列 | AntD Drawer / `ResizableProTable` / `TableActions`；版本数据、状态文案、动作、权限判断和日期格式由宿主提供 |
| `BomIssueOperationSelect` / `useBomIssueOperationOptions` | 查询并选择“路线主数据 + 稳定工序编码”映射；每条路线仅保留一个投料工序并显示无法识别的历史绑定 | AntD `Select`；路线候选/详情请求和路线选择日期由宿主 `BomIssueOperationCapabilities` 提供 |
| `IntegrationGuideLink` | 以接入说明按钮打开标题与正文可注入的滚动弹窗 | AntD `Button` / `Modal`；指南内容与主题路由由宿主提供 |
| `ServerInfoCard` | 展示 CPU/内存/磁盘、操作系统/Node 运行信息和文件存储统计，并标注 WebSocket 实时数据 | AntD `Card` / `Progress` / `Statistic`；REST/WebSocket、文件统计与数字/平台/错误格式由宿主注入 |
| `DashboardShortcutConfigModal` | 管理固定/自定义首页快捷入口的显示、排序、增删改和模块权限状态 | AntD Modal / Pro `ResizableProTable` / ProForm；入口目录、权限结果、偏好读写与通知由宿主注入 |
| `VoiceBroadcastSettingsPanel` | 维护语音播报最小间隔、按异常/生产分组的事件开关、待播队列提示，并确认清理播报记录 | 语义 HTML / MES Large Screen tokens；设置持久化、清理动作和确认由宿主回调提供 |
| `CompleteMaintenanceFields` | 渲染设备保养步骤结果、备注、必拍照片和整体完成备注字段 | Pro `ProFormTextArea` + AntD `Form.List` / `Upload`；设备字段 help copy 由宿主提供 |
| `EquipmentFaultVerifyModal` | 对维修完成的故障单记录通过/退回结论及必填验收说明 | Pro `ModalForm` / ProForm；故障验收服务、设备字段帮助、成功消息和父级刷新由宿主注入 |
| `QualityInspectionSubmitModal` / `QualityInspectionDefectModal` | 录入检验数量、结论、检验项与缺陷；保留模板字段、覆盖校验和表单联动 | Pro `ModalForm` / ProForm + AntD `Form`；质检计算、缺陷服务、字典字段、字段帮助、消息与提交由宿主注入 |
| `QualityInspectionItemResultFields` | 在宿主表单中按检验模板渲染数值/多次测量、选择、文本、人工判定、备注、自定义字段与必拍照片 | ProForm / AntD Form；检验标准格式、自动判定策略和动态字段 renderer 由宿主注入 |
| `AiAnalysisCard` | 只读展示拍照质检的 AI 建议、依据照片、模型与提示词版本、错误和被拒结果 | Pro `DetailTable` / AntD `Image.PreviewGroup`；分析查询和日期格式化由宿主注入 |
| `OqcSourceDeliveryCard` | 对自动 OQC 质检展示并验证来源销售出库单与精确关联明细 | Pro `Descriptions` / AntD `Card` / `Alert`；出库详情、状态字典、单位字典和数量格式由宿主注入 |
| `QualityInspectionActionModals` | 打开提交或登记缺陷前加载质检单；支持失败提示、重试和关闭 | AntD `Alert` / `Spin` + MES `QualityInspectionSubmitModal` / `QualityInspectionDefectModal`；详情查询、字段 schema、检验与缺陷能力由宿主注入 |
| `FqcRulesPanel` | 管理成品检验规则，支持健康告警、物料/系列筛选、服务端列表、配置入口与规则维护 | MES `CrudListWorkbench` / `ResizableProTable` / Pro `ModalForm`；规则服务、权限结果、字典与配置导航由宿主注入 |
| `QualityTemplateItemsEditor` | 编辑质量模板检验项，按结果类型切换数值范围或可选结果字段并清理不适用值；可由宿主注入每项的全宽扩展字段 | AntD `Form.List` / `InputNumber` / `Select`；规格类型字典和扩展字段由宿主注入，扩展字段位于检验标准之后、结果专属设置之前；扩展表单项使用相对名称 `[itemIndex, field]` |
| `ScrapDeductionPolicySection` / `MaterialScrapDeductionPolicySection` | 配置公司级报废扣款/结算策略与物料级规则覆盖、继承及金额模式 | ProForm / `ProFormDependency`；权限、策略详情/更新和消息由宿主注入 |
| `TemplateFieldSelector` | 加载并筛选打印字段，锁定模板必选项，支持默认选择、检索和拖拽排序 | `@dnd-kit` + AntD；字段定义、模板/业务枚举、默认优先序和加载请求由宿主注入 |
| `GridPrintDesigner` | 编辑 MES 网格打印模板，生成并归一化 schema，按样例预览草稿 | AntD 网格画布 + MES grid schema/factory；授权字段、样例数据、纸张配置和预览回调由宿主注入 |
| `TemplateLayoutPresetSelect` | 以单选卡片和内联 SVG 展示可用打印版式 | Pro `ProForm.Item` + AntD Radio；版式值、标签、说明、图示映射和字段帮助由宿主提供 |
| `StockCountLineFormList` | 维护盘点单物料明细、货主、仓位、批次、行备注和自定义字段 | ProForm 字段 + AntD `Form.List` / Sunxu `MaterialTablePicker` / `BatchMaterialAddButton`；表单数据、主数据请求和配置入口由宿主注入 |
| `CreateStockCountModal` / `StockCountDetailDrawer` | 创建盘点单并展示盘点详情、明/盲盘行维护与审核动作 | ProForm / AntD Modal、Drawer 与 MES `StockCountLineFormList`；DTO、仓位/仓库字段、日期、权限、状态/货主文案、服务、打印和通知由宿主注入 |
| `StockCountDetailLedger` | 查询盘点明细，展示账面/实盘/差异数量、动态字段、汇总与详情入口 | MES `DocumentDetailLedgerTable`；列表/导出、权限结果、选择器、自定义列、保存视图、批量打印和格式由宿主注入 |
| `PurchaseOrderDetailLedger` | 查询采购订单明细，保留状态/关键词/供应商/物料/日期筛选、价格与质检列、费用汇总权限、批量收货约束、操作菜单、导出/新增和打印 | MES `CrudListWorkbench` / `ResizableProTable`；列表/导出、权限、选项、保存视图、动作/弹窗、收货流程与打印由宿主注入 |
| `PurchaseInquiryDetailLedger` / `PurchaseRequisitionDetailLedger` / `InternalIssueDetailLedger` / `ProductionReceiptDetailLedger` | 查询采购询价、采购申请、内部领用、生产入库明细，保留筛选、动态列、汇总、视图、导出/打印和导航 | MES `DocumentDetailLedgerTable`、状态/筛选/格式组件；请求、权限结果、字段选择器、保存视图、动作、打印和导航由宿主注入 |
| `PurchaseRequisitionItemsTable` | 展示采购申请展开行物料，固定物料优先列序并提示未填写的期望到货日期 | MES `ResizableProTable` / AntD `Tag`；行数据和单位、数量、日期格式由宿主提供；组件不请求数据或判断权限 |
| `PurchaseReturnDetailLedger` / `QuotationDetailLedger` / `MaterialIssueDetailLedger` / `PurchaseReceiptDetailLedger` | 查询采购退料、销售报价、生产领料、采购入库流水；保留筛选、汇总、明细/自定义字段、视图、导出/打印和行操作 | MES `DocumentDetailLedgerTable` 与业务列；请求/导出、权限、费用/价格可见性、来料质检、生命周期动作和保存视图由宿主注入 |
| `StockTransferDetailLedger` / `StockConversionDetailLedger` | 展示调拨只读明细及库存转换投入/产出行，保留筛选、排序、摘要、视图和导航 | MES `DocumentDetailLedgerTable`；列表/导出 API、权限、选项、动态字段、保存视图和格式由宿主注入 |
| `StockTransferModal` / `StockTransferActionModals` | 编辑调拨单并承载确认、取消草稿和撤销弹窗 | MES 物料/仓位/库存组件 + AntD Modal；请求、权限、日期规范化、提示和刷新由宿主注入 |
| `CustomerMaterialDispositionDetailLedger` / `CustomerMaterialDispositionForm` / `CustomerMaterialDispositionReverseModal` | 查看客户料处置台账并维护处置/冲正；保留来源余额扣除、批号追溯、库存校验、自定义字段和个人视图 | MES `ResizableProTable` / ProForm / AntD Modal；查询/保存/冲正、权限、字典、字段帮助、导航与视图持久化由宿主注入 |
| `SelectedWorkOrdersTable` / `ProductionBatchNoField` / `WorkOrderAllocatedSerialsButton` | 核对选中工单、录入/扫码报工批号、查看分配序列号 | MES 表格 / ProForm / AntD Modal；物料显示、批号候选和序列号服务由宿主注入 |
| `WorkOrderReportModal` / `WorkOrderReportDirectModal` / `WorkOrderFormDrawer` / `WorkOrderFormFields` / `WorkOrderListProgress` / `WorkOrderRiskTags` | 工序/整单报工、工单新增编辑、执行摘要和风险标签 | ProForm / AntD；工单服务、规则、字典、权限、上传、扫码候选、导航和字段帮助由宿主注入 |
| `ReportLogDetailDrawer` | 展示报工日志工单/操作、数量、工时、状态、计件工资、报废率和关联单据 | AntD Drawer / `Descriptions`；详情数据、查看权限、状态/日期/数值格式与来源导航由宿主注入 |
| `WorkOrderFilterDrawer` | 工单状态、物料需求、执行状态、交期风险、物料/客户/计划/负责人、优先级及五类日期范围筛选 | ProForm / `DocumentFilterDrawer`；状态选项、远程候选、查询和重置由宿主注入 |
| `ReportDynamicFields` | 根据正式报工预检结果渲染工序/成品数量、生产批号、排产、工时、报废及异常工时说明字段 | Ant Design `Form.Item` / `InputNumber` / `Select`；预检结果和数值格式由宿主传入 |
| `WorkOrderBatchReportModal` / `WorkOrderMaterialShortageSection` | 批量登记工单多工序报工，并处理 BOM 缺料检查、补料/退回单及执行状态 | ProForm / MES 表格与物料能力；工单/库存/上传/打印服务、权限、字典、帮助和消息由宿主注入 |
| `WorkOrderTemporaryReportQrPrint` | 按工序及工单状态判定临时报工码打印资格，转义动态文案并生成 A4 标签页 | 纯 HTML 构造工具；门户 origin、二维码 SVG renderer 和 window.open 由宿主提供 |
| `OutsourcingOrderDetailLedger` / `OutsourcingProgressDrawer` | 查询外协业务明细、筛选/汇总/批量打印并维护供应商进度步骤和临时报告二维码 | MES `DocumentDetailLedgerTable` / `DetailLedgerFilterDrawer` / `ResizableTable` / AntD Drawer；查询、权限、保存/二维码及打印能力由宿主注入 |
| `ProductionReceiptSummaryCard` / `WorkOrderSplitModal` | 展示工单生产入库汇总，并录入工单拆分数量与备注 | AntD Card / Statistic + Pro `ModalForm`；权限、摘要查询、列表导航、单位标签、拆分请求、字段帮助和成功提示由宿主注入 |
| `TraceTimelineDrawer` | 按批号或成品序列号查询追溯，展示批号谱系、单件流转、上下文、照片、关系、汇总与警告 | AntD `Drawer` / `Timeline` / `Image.PreviewGroup`；追溯请求、状态/事件字典、日期和单位格式由宿主注入 |
| `ScheduleGanttWidgets` / `ShiftBreakListField` | 展示当前时刻线/产能热力格并维护班次休息时段 | AntD / 语义 HTML；位置、颜色、时间格式与默认休息时段由宿主提供 |
| `ProductionShiftCalendar` / `ShiftFormModal` / `ShiftTable` / `ExceptionFormModal` / `ExceptionTable` | 维护按公司/工作中心/供应商归属的班次和日期例外，保留校验、服务端分页筛选、权限动作及历史入口 | ProForm / AntD Table / `ShiftBreakListField` / `ChangeHistoryModal`；CRUD、选项、权限、字段帮助、通知与删除确认由宿主注入 |
| `ProcessOperationInspectionRulesForm` | 配置工艺/标准工序的默认 IPQC 模板与物料专属模板，保留历史条件规则 | AntD Form / `MaterialFilteredSelect` / `RemoteSelect`；活动物料/IPQC 模板查询、配置入口与错误反馈由宿主注入 |
| `RescheduleDrawer` / `ChangeHistoryModal` | 配置生产重排策略、预览影响并筛选风险明细，查看排程历史 | AntD Drawer / Modal + ProForm / MES 表格；权限、状态/原因字典、来源查询、预览/提交/历史服务和导航由宿主注入 |
| `CapacityBar` / `GanttBar` / `GanttContextMenu` / `GanttInspector` / `GanttToolbar` / `GanttTooltip` / `UnscheduledPanel` | 绘制产能与排程条，支持条目拖拽/缩放/选择、上下文动作、详情检查、时间窗口与筛选，以及待排产区拖放；待排产区和产能条位置、右键是否选择条目由宿主配置 | 语义 HTML / AntD；几何、时间、状态/颜色/标签、权限过滤后的动作、数据查询、拖放提交和路由由宿主注入 |
| 排程工作流组件（自动/计划排产、瓶颈、方案比较、手工排程、台账、甘特） | 保留排程参数与策略选择、计划工单/委外摘要、瓶颈计划/实际比较、What-if 方案采纳、工序/资源/班次选择、台账筛选/排序/状态动作与甘特拖放/缩放/下钻 | AntD / Pro Components 与 MES 甘特子组件；排产/计划 API、权限、字典、导航、错误/消息、刷新和拖拽提交由宿主 capabilities 注入 |
| `BatchReleaseModal` | 编辑生产计划批量下达草稿的数量与交期，保留受保护行筛选和提交后刷新 | Pro `ModalForm` / `ProFormList`；草稿查询/保存、日期序列化和成功提示由宿主注入 |
| `ImportDrawer` | 下载模板、上传 Excel、提交 Base64 文件、显示导入计数/错误并允许继续导入 | AntD `Drawer` / `Upload.Dragger` / `Result`；模板/导入服务及成功刷新由调用方提供 |
| `BackupDirectoryPicker` | 浏览 MES 服务机器的子目录、跳转上级/输入绝对路径、重试失败路径、展示回退上级路径并选择当前目录 | AntD Modal / `List` / `Spin`；服务端目录访问请求由宿主提供 |
| `MaterialTablePicker` | 弹窗内按物料分类、名称/编码搜索和服务端分页选择；支持单选/多选、跨页快照、选中数量、库存摘要和缩略图预览 | AntD `Modal` / `Tree` / `Tabs` / `InputNumber` + MES `ResizableProTable`；目录、分类、客户库存、单位字典与全局分页配置由 `MesUiProvider.materialTablePickerCapabilities` 注入 |
| `BatchMaterialAddButton` | 用 `MaterialTablePicker` 批量追加新物料行；剔除已有 ID 和重复项、成功添加时移除空占位行、数量随选料传入，并报告行数上限溢出 | MES `MaterialTablePicker` + AntD `App.message`；行生成、ID/空行识别和明细联动由调用方提供 |
| `DrawingFilesInline` / `FileUrlsInline` / `DrawingFilesGallery` / `PdfPreviewDrawer` | 保留 MES 附件、图纸行关联、分组预览/打印和 PDF 预览操作 | AntD Upload / Image / Drawer + React-PDF；授权文件能力由 `MesUiProvider` 注入 |
| `MaterialDrawingsPanel` | 管理物料图纸/附件列表，选中预览图片/PDF/GLB，并执行有权限门控的上传/删除 | AntD Image / Upload / Modal + MES `PdfPreviewDrawer`；策略、文件服务、权限结果、名称/URL解析由宿主注入，GLB 可使用套件 `GlbModelViewer` |
| `GlbModelViewer` | 加载 GLB/GLTF 模型并提供旋转缩放、网格/线框切换、恢复视角和错误状态 | AntD 状态 UI + three `WebGLRenderer` / `OrbitControls` / `GLTFLoader`；宿主提供浏览器可读文件 URL 和名称 |
| `LongText` | 在表格单元格显示多行预览并按需查看全文 | AntD Popover + Typography / Modal |
| `RowActions` | 把表格行操作收纳进省略号菜单 | AntD Dropdown + Button；操作语义由宿主提供 |
| `TableSummary` | 按列对齐并固定展示宿主提供的表格字段合计 | AntD `Table.Summary.Row/Cell`；聚合口径由宿主提供 |

## 关键契约

### `SunxuWebProvider`

- **API**：`children` 必填；`appearance` 为 `light | dark`，缺省 `light`；`locale` 默认 `zhCN`；`componentSize` 使用 AntD `ConfigProviderProps['componentSize']`，缺省 `middle`，应用可在根 Provider 统一选择 `small` / `middle` / `large`；单个控件仍可用其公开 `size` 属性覆盖；`theme` 按 AntD `ThemeConfig` 做 token 合并；`workspaceFrame` 为 `container | host`，缺省 `container`。
- **尺寸 token**：默认主题将 `small` / `middle` / `large` 控件高度分别映射到 Sunxu 紧凑 32px / 标准 36px / 舒适 40px；宿主传入的 `theme.token` 可按公开 AntD token API 覆盖。
- **外框所有权**：`workspaceFrame="container"` 表示 Sunxu 页面容器拥有工作区外框并应用 `--sxw-workspace-gutter`；`workspaceFrame="host"` 表示宿主 shell 已经提供外框，页面容器不再叠加内边距。宿主只能有一个外框所有者。
- **状态与恢复**：受控，不自行读写 localStorage 或系统偏好；宿主改变 `appearance` 即切主题。
- **可访问性/组合**：只增加 AntD ConfigProvider / App 上下文，不增加可见文案或额外导航层。

### 页面容器

- **API**：`ScreenContainer` 接收 `children`、`className`、`style`、语义根元素 `as`（`main | section`，默认 `main`）、`frame`（`inherit | page | none`，默认 `inherit`）和 `fill`（布尔，默认 `false`）。List/Form/Detail 容器同样接受 `frame` / `fill`，以及插槽 `toolbar` / `children` / `footer`；页级 `title`、`description`、`actions` 仅在有内容时渲染，`PageHeader` 也可只显示有业务价值的描述或面包屑；`headingLevel` 可用于嵌套预览，默认 `1`。
- **外框**：`frame="inherit"` 跟随 `SunxuWebProvider.workspaceFrame`；`frame="page"` 自己拥有外框；`frame="none"` 假定父级/宿主拥有外框。嵌套容器必须使用 `frame="none"` 或 `layout="embedded"`，不得叠加第二层页面内边距。
- **填充高度**：`fill` 让容器成为确定高度的纵向 flex 容器（`height: 100%; min-height: 0; overflow: hidden`），`ListScreenContainer` 的 results 区同时成为可收缩的 flex 子项。仅在单列表视口页使用；长页面保持默认，由页面整体滚动。
- **状态**：容器不管理请求、加载、空结果或表单提交；对应内容由宿主传入。Form/Detail 的 footer 单独固定，内容滚动区不得覆盖它。
- **响应式**：外框由 `--sxw-workspace-gutter` 控制（桌面 24 px，窄屏 16 px）；列表工具栏在 768 px 以下换行并保持在结果区之前。
- **可访问性**：页面根使用 `main`，标题保持单一主标题，页级操作由 AntD Button/Menu 提供语义和键盘行为。
- **组合语义**：应用外壳已经提供唯一 `<main>` 时，内层容器使用 `as="section"`；同一页面不得嵌套多个 main landmark。
- **邻接规则**：`ListScreenContainer` 的 `toolbar` 紧贴结果区，不接受独立远置的 list action header。

### `CrudListWorkbench`

- **职责**：标准 CRUD 列表的组合层。把分类 Tab、状态 `StatusTabs`、筛选栏、可选视图栏、可选层级筛选和 ProTable 放在统一的结果工作区；不实现基础表格、字段、查询服务或业务 CRUD。
- **首开任务**：开发者打开目录的 CRUD 列表工作台示例，先看到产品列表与分类/状态入口；场景切换器可查看轻量、分类/状态、复杂视图和 ProTable 原生查询四种组合。组件运行时本身不持有最近列表或路由；宿主决定默认筛选和深链恢复。
- **API**：`tableProps.columns` 与 `rowKey` 必填；其余公开 ProTable 参数可传入。为避免重复布局，`search`、`headerTitle`、`toolbar`、`toolBarRender` 由工作台控制。历史 `title` 属性暂时保留以兼容现有调用，但已弃用且不会渲染；新代码应省略它。页面任务由宿主导航识别，确需独立标题时由宿主在工作台外组合 `PageHeader`。`layout` 为 `page | embedded`，默认 `page`；页面级默认以 `--sxw-surface` 绘制统一内容面，将视图/筛选/操作栏与结果区归在同一工作面；`layout="embedded"` 不绘制自身内容面、不拥有页面外框、不渲染页头，用于 Tab 面板、卡片或长页面中的子列表。`fill` 为布尔，默认 `false`；`fill` 让工作台成为确定高度的单列表视口页，表格体滚动而表头和分页保持可见。列 schema 能表达的查询字段通过 `proTableSearch` 启用 ProTable 原生查询表单；它支持 ProTable 的响应式 `span`、折叠数量和展开/收起行为。自定义 `search`、`quickFilters`、`filterActions`、`primaryTabs`、`statusFilters`、`toolbarActions`、`viewBar`、`appliedFilters`、`facetSidebar` 为可选插槽。`onCreate` 可选，传入回调后工作台提供统一“新增”主按钮；宿主控制权限及回调，`onCreateDisabled` 控制按钮禁用状态。`toolbarActions` 承载其他列表级动作，不重复渲染新增。`advancedFilters` 提供 `children`、已应用数量、受控/非受控 `open`、`onApply`、`onReset`、`onCancel` 和失败回调。
- **表格适配插槽**：缺省直接渲染 ProTable；宿主需要可调整列宽等扩展时，可传 `renderTable` 接入宿主适配器。回调收到完整的 `tableProps`、工作台选定的 `search`、`options`，且 `headerTitle=false`、`toolBarRender=false`、`toolbar=undefined`。适配器只负责结果表格，不重复绘制筛选和列表级操作；工作台不渲染页级标题，并把适配器放在结果区。`renderTable` 应返回单个根表格元素，由工作台合并其 `scroll` 配置；`fill` 模式下工作台拥有纵向滚动高度，即使适配器重设 `scroll` 以指定 `x`，最终渲染仍保留工作台传入的 `scroll.y`。横向宽度以适配器配置为准。工作台通过 ProCard `cardProps` 与 Ant Design Table/Spin 的公开语义 `styles`、`classNames` API 建立可收缩的填充链；适配器不得另行测量页面高度或删除分页。非 `fill` 模式保留适配器自身的完整 `scroll` 配置。
- **结果摘要插槽**：`paginationSummary` 由宿主提供，工作台缺省 ProTable 会将其放入分页器的 `showTotal` 公开插槽；自定义 `renderTable` 会收到 `paginationSummary`，适配器应将它传入相应表格组件。原有范围/总数文案保留；关闭分页时不显示摘要。
- **结果卡片内边距**：为避免 ProTable 默认左右 24 px 内边距挤压宽表格，工作台在未显式提供 `tableProps.cardProps` 时，通过 ProTable 公共 `cardProps.styles.body` 将结果卡片的水平内边距统一为 16 px；纵向间距继续由 ProTable 管理。显式传入 `cardProps`（包括 `false`）时由宿主接管结果卡片外观；宿主需用该公开 API 设置样式，不覆盖内部 DOM class。页面工作区外框仍只由 `ListScreenContainer` 或宿主 shell 中的一方拥有。
- **状态/恢复**：高级筛选抽屉打开时由宿主字段控件持有草稿；“重置”只清草稿，“取消/关闭”调用 `onCancel` 保留已应用结果，“应用”调用宿主 `onApply`。返回 `false` 或抛错时抽屉保持打开，错误时显示可恢复提示。`open` 存在时为受控模式，宿主必须响应 `onOpenChange`；省略 `open` 时由工作台管理开关。加载、空、错误、分页、排序和行选择状态由 ProTable/宿主传入；**`fill` 模式下分页的可见位置和表体高度由工作台负责**，宿主不得再用页面级 `:has()` CSS 或外部高度测量控制表体。
- **高度与分页契约**：`fill` 只用于单列表视口页，宿主必须给工作台提供确定的可用高度。工作台根节点、results、layout、table 容器、适配器和 ProTable 的公开卡片/表格/Spin 语义槽形成可收缩的纵向 flex 链；测量只查询工作台注入的语义 class，不依赖 Ant Design 或 Pro Components 的内部类名。工作台用 `ResizeObserver` + `MutationObserver` 测量表头、footer、分页和额外结果内容之外的可滚动高度，并作为 `scroll.y` 传给 ProTable。表头保持其内容所需的自然高度，不参与 flex 收缩；分页始终渲染在结果区底部且不参与收缩，短数据也不会让表格和分页停在结果区上方；表格体在内部滚动。长页面（多卡片、图表或多个列表）不得开启 `fill`，保持默认文档流由页面整体滚动。
- **短数据分页填充实现**：Ant Design Table 没有为内层 Table 和滚动表体分别暴露语义样式槽；工作台通过公开 Table `classNames.root`、Spin `classNames.container`、Table `classNames.section` 标记边界，在标记范围内让内层表格及表头后的滚动内容参与 flex-grow。分页保持在结果区底部，短表体仍保留内部滚动行为。
- **Facet**：`facetSidebar` 只用于高频层级导航。工作区有效宽度低于 `facetSidebarBreakpoint`（默认 1024px）时，同一内容移入左侧 Drawer；组件用 ResizeObserver 测量列表内宽，不用浏览器 viewport 猜测。桌面侧栏与结果区由 16px grid gap 分隔，间距由工作台单独拥有，Facet 不再叠加末端留白；竖向填充布局中 Facet 受结果区高度约束，超出内容在 Facet 内滚动。侧栏卡片的边框、内边距和内容布局由宿主负责，子内容不得超出 Facet 轨道宽度。
- **布局与响应式**：主分类 Tab 在左，状态 Segmented 在右；存在分类/状态行时，视图栏紧随其后；没有该行时视图栏排在搜索/筛选行之前。视图栏不再浮在主分类上方。列表动作与新增位于紧邻结果区的搜索/筛选行右侧，即使没有筛选也右对齐；少量外部快捷筛选与关键字在宽度允许时保持同一行。`responsiveQuickFilters` 默认启用，工作台测量实际容器和筛选控件宽度；宽度不足时将快捷筛选折叠到“展开筛选”区域，用户可展开查看并再次收起，空间恢复后自动回到单行。ProTable 原生查询表单按自身响应式 `span` / `defaultFormItemsNumber` / `defaultCollapsed` 规则处理；两种查询方式避免重复配置同一业务字段。内容不足 900px 时分类和状态换行；不足 767px 时筛选区纵向组织。ProTable 的横向滚动/列配置由 `tableProps` 公共 API 控制，不覆盖内部 class。
- **状态筛选所有权**：分类由 `primaryTabs` 或 Facet 二选一；状态由 `statusFilters` 或宿主快捷条件二选一；不要在视图标签、快捷控件和抽屉重复同一字段。
- **边界**：请求与 `params`、过滤值、表单/提交/删除、批量操作权限及失败语义由宿主提供。改变外部筛选应通过宿主 `tableProps.params` 或 `dataSource`；`onApply` 负责提交抽屉草稿。列/刷新等 ProTable options 默认关闭，仅在宿主明确传入时显示。`renderTable` 不接管筛选、页面工具栏或数据请求，宿主的表格扩展不得删减当前业务仍需的列、行选择、排序、分页或恢复路径。
- **可访问性**：筛选区用 `FilterBar` 的 `role=search` 和必需名称；分类 Tab 与状态 Segmented 分别提供可读名称和选中态；筛选图标按钮有 `aria-label`，Tooltip 可键盘聚焦；Drawer/ProTable 原生键盘和焦点行为不被覆盖。Facets 用具名 `<aside>` / Drawer。
- **间距与主题**：父级 `ListScreenContainer` 拥有页面内边距；工作台默认使用 `section` 根元素并只管工具组间距。应用外壳不提供 main landmark 时可显式传 `as="main"`。颜色使用 `--sxw-*` 语义变量，ProTable/AntD 控件几何遵循上游 token。
- **证据**：`examples/catalog` 的 CRUD 列表工作台真实路由覆盖自定义筛选自动折叠、ProTable 原生查询和宿主表格适配插槽；视图栏顺序与桌面/窄工作区几何验收见 `docs/verification/crud-list-workbench-viewbar-2026-11-23/README.md`；原组合验收见 `docs/verification/crud-list-workbench-2026-11-10/`，Facet 间距与目录轨道几何见 `docs/verification/crud-list-workbench-spacing-2026-11-11/`。未覆盖的状态仍标为 `UNVERIFIED`。
- **fill 分页视觉验收**：3 行短数据下工作台 360px 高、表格体 255px，分页底边与结果区底边相差 0px；截图和几何数据见 [`docs/verification/crud-list-workbench-fill-pagination-2026-11-23/`](./verification/crud-list-workbench-fill-pagination-2026-11-23/README.md)。MES Admin 采购订单真实路由仍需加载更新后的宿主构建后验收。

- **搜索插槽宽度**：桌面搜索区以 `320px` 为宽度基准、最小 `180px`；搜索控件根节点受插槽宽度约束，不得溢出。工作区窄于 `767px` 时筛选区改为纵向布局，搜索控件仍限于可用宽度。

### `SavedViewBar`

- **职责**：提供受控系统/个人视图切换、另存为、个人视图重命名/删除、设默认、相邻排序；未保存修改时提供保存并切换、放弃并切换、继续编辑。
- **API**：`views: { id, name, scope: system | personal, isDefault? }[]`、`onChange` 必填；`activeViewId`、`dirty`、`loading` 受控；`onSave`、`onSaveAs`、`onRename`、`onDelete`、`onSetDefault`、`onReorder` 可选。操作回调可以同步或返回 Promise；返回 `false` 或 reject 表示未成功。
- **状态/恢复**：加载中有 Spin 并禁止重复变更；回调失败保留当前视图，显示通用恢复提示并把原错误传给 `onActionError`。删除个人视图要求二次确认；系统视图不可重命名/删除；仅个人视图可保存覆盖。
- **持久化与快照**：不读写本地存储或调用 API。宿主提供系统/个人视图和访问权限，并只保存允许的筛选、排序、列可见性/顺序/固定状态；不保存授权决定、选择行、临时抽屉草稿或业务动作。
- **布局与可访问性**：视图标签按基线 MES 的紧凑间距排列，当前标签文字下方显示主题色指示线；每个可管理视图在标签内提供菜单，排序按钮放在 AntD Tabs 右侧扩展区，与导航底线共同布局；保存/另存操作紧邻标签区。窄屏下导航操作与保存操作分行，保存操作右对齐，选中标签自动滚动到可见位置；管理菜单、排序和命名弹窗提供可读名称及键盘可操作的按钮。
- **证据**：`examples/catalog` CRUD 列表工作台的复杂视图真实路由，以及桌面/窄屏标签栏、管理菜单、排序、未保存、另存和切换确认的截图与 DOM 几何数据记录于 `docs/verification/saved-view-bar-mes-alignment-2026-11-16/`；排序控件与导航底线间距在宽/窄视口验证。未覆盖的键盘读屏流程、深色主题和其他视口仍标 `UNVERIFIED`。

### `SectionCard`

- **API**：`title`、`subtitle`、`extra` 可选；`children` 必填。
- **状态**：展示型容器；交互/加载/错误由内容项自身承担。没有标题和辅助信息时由 ProCard 不生成空标题区。
- **布局**：ProCard `variant="outlined"` 管理内部边框；`styles.body` 管理公开的 body 样式入口；父级管理卡片间距。禁止页面覆盖 ProCard 内部 DOM 样式。
- **上游选择**：直接使用 `ProCard` 可以表达单个普通卡片；当需要一致地遵守 Sunxu 标题可选、无空 header 契约时使用此 wrapper。

### 快捷日期范围选择器

- `QuickDateRangePicker`、`QuickProFormDateRangePicker` 和 `QuickProFormDateTimeRangePicker` 分别包装 AntD `DatePicker.RangePicker`、ProForm 日期范围与日期时间范围字段；除合并 `presets` 外，其余调用方 props 原样透传。
- `DateRangePickerPreset` 接受 `Dayjs` 起止值或返回该值的回调。调用方预设保持在前；追加今天、昨天、本周、上周、近 7 天、近 30 天、本月、上月和本年度共 9 个通用预设。相同字符串标签只保留首个，非字符串 ReactNode 标签不做语义猜测或去重。
- 周从周一开始；完整日范围包含起止日，近 N 天包括今天，本年度从 1 月 1 日至今天结束。日期值由调用方和浏览器本地日期生成；组件不发起查询或改写业务 DTO。
- 公开 DatePicker semantic `styles` 与宿主自定义样式合并。范围弹层最大宽度为 `calc(100vw - 64px)`，双月面板保持内容宽度并由弹层横向滚动；桌面双月布局保持不变，375px 手机视口弹层完整留在视口内。
- **目录和证据**：MES UI 套件 Catalog 同时渲染三种字段包装器，验证自定义 `近7天` 覆盖同名默认预设、其他通用预设补齐、ProForm 日期/日期时间字段提交值，以及手机双月日历横向滚动。桌面和手机视口、弹层边界与 16 个相邻间距接缝见 [`docs/verification/quick-date-range-picker-2026-11-20/README.md`](./verification/quick-date-range-picker-2026-11-20/README.md)；MES 报表服务/权限接线和读屏器完整流程为 `UNVERIFIED`。

### 采购入库履约摘要

- **API**：必填 `orderedQty`、`receivedQty`、`outstandingQty`；`baseUnit` 与 `unitLabelMap` 可选。数量按 `zh-CN` 分组并最多保留 3 位小数，单位标签由宿主字典传入；字典未命中时显示单位原值。
- **显示**：沿用两行次序“订单数量”与“已收数量 · 待收数量”，AntD 次要文字、12px 字号和零间距垂直布局保持来源行为。
- **边界**：组件不推导履约量、不查询采购单或字典、不执行权限判断；三个数量和单位字典由宿主提供。MES `qty-unit` 工具同时保留单位归一化、标签回退、双单位数量展示和基础量还原函数，供后续 MES 组件复用。
- **证据**：Catalog 的 MES UI 套件展示已收/待收数及宿主单位标签。桌面/手机渲染、文本、几何与间距证据见 [`docs/verification/purchase-receipt-capacity-summary-2026-11-20/README.md`](./verification/purchase-receipt-capacity-summary-2026-11-20/README.md)。

### 采购收货系统批号写入

- **API**：`materialId`、`batchNo` 可选，`onGenerated(batchNo)` 必填。宿主通过 `MesUiProvider.purchaseReceiptCapabilities.generateSystemBatchNo({ materialId })` 提供服务端请求。
- **状态与恢复**：缺少物料或已有非空批号时禁用；请求中显示 Button loading 并防止重复请求。返回批号 trim 后为空时按“系统未返回批号”失败；有当前批号时不覆盖。成功回调后提示“系统批号已写入当前明细”；服务错误显示原 Error 文案，非 Error 拒绝显示“自动生成系统批号失败”。宿主未注入服务时显示“系统批号服务未配置”。
- **边界**：Sunxu 不调用 MES URL、不持有鉴权或批号生成规则；服务端负责批号追踪资格和编号规则，宿主负责把 onGenerated 接回当前明细。
- **证据**：Catalog 通过确定性注入适配器覆盖成功回填、Error/非 Error 拒绝、空批号响应、缺少物料、已有批号及缺少服务七种状态。桌面/手机视口、交互结果和间距证据见 [`docs/verification/purchase-receipt-batch-no-button-2026-11-20/README.md`](./verification/purchase-receipt-batch-no-button-2026-11-20/README.md)。

### 采购附加费用

- `LandedCostFormDrawer` 保留普通费用/供应商贷项表单、仅可资本化费用类型、启用供应商、已收货采购入库候选、含税/未税金额、税率/币别/汇率、分摊依据与手工金额校验，并区分新增和编辑 payload。候选、保存/更新、日期与金额格式、字段帮助和权限由宿主能力注入。
- `LandedCostDetailDrawer` 保留单据详情、状态/可用动作、入库分摊行和会计来源；会计来源详情与重放按独立查看/重放权限呈现。`LandedCostReceiptContextCard` 按采购入库展示相关费用和会计来源，并回调打开对应费用详情。服务、权限、状态词条、格式化和通知均由宿主提供。
- `LandedCostComponentsDemo` 使用确定性数据覆盖表单、详情和采购入库上下文。MES 服务/权限接线及真实视口和交互验收为 `UNVERIFIED`。

### `StatusTabs`

- **API**：受控 `items: { key, label, count?, disabled? }[]`、`value`、`onChange`、必填 `ariaLabel`，可选 `size`。
- **状态**：选中值由宿主保存；disabled 项不可选；不含请求或数据缓存。
- **语义**：它表达互斥筛选值，因此基于 AntD `Segmented`（radiogroup 语义）而不是伪装成页面路由。数字 count 仅在帮助理解集合数量时传入。
- **响应式**：可换行的父级优先；空间不足时由宿主明确选择滚动容器，不截断标签。

### `StatusTag`

- **API**：`children` 提供可见状态文案；`color` 接受 AntD 预设色或 CSS 颜色；可选 `icon`、`className`、`style`。缺少颜色时使用 AntD `grey` 预设。
- **视觉与可读性**：固定使用 AntD `Tag` 的 `variant="solid"`，颜色和文字颜色交给 AntD `Tag.color` 与主题 token 处理；缺省颜色使用 AntD `grey` 预设。支持 AntD 预设状态色、彩色标签色和自定义 CSS 颜色，不计算或改写背景及文字颜色。
- **状态与边界**：展示型、不可关闭、不可点击；状态文案和颜色映射由宿主提供，颜色不是唯一状态线索。筛选交互由 `StatusTabs` 或宿主控件承担。
- **布局与主题**：标签自身不拥有相邻间距；父级用 `Space`、行内流式布局或表格单元格管理间隔。保留 AntD 圆角、字号及主题焦点/禁用规范。
- **目录示例**：`examples/catalog` 的“信息与状态”页展示灰、紫、蓝、橙、青、绿、红色标签；桌面、窄屏和深色主题以目录真实渲染记录。

### `FilterBar`

- **API**：`children` 提供筛选控件，`actions` 提供同级操作，`ariaLabel` 必填。
- **可访问性**：使用 `role=search` 并有可读标签；字段继续使用 AntD 原生 label/aria 契约。
- **状态与布局**：筛选值、提交、重置和查询请求都由宿主管理；字段区域可换行，操作区域保持在工具栏内。
- **上游选择**：复杂查询表单优先使用 Pro Components `QueryFilter`；本组件只服务于已有控件组合的轻量筛选工具栏。

### `RowActions`

- **API**：`actions` 为行操作数组（`key`、`onClick`、`danger`、`disabled`、`icon`、`children` 子菜单；标准操作通过 `kind: view | edit | delete` 统一显示“查看 / 编辑 / 删除”，不可另传 `label`。领域操作传入自定义 `label`，不从 `key` 推断语义；`delete` 默认危险样式）；全部操作收进单个竖向省略号菜单。`ariaLabel` 缺省“更多操作”。
- **可访问性**：触发按钮有可读名称并通过 `title` 补充悬停说明；键盘走 AntD Dropdown 原生行为。
- **状态与布局**：危险操作自动在其前加分隔线（首个之前不加）；操作列表为空时渲染 `null`，不留空按钮。
- **边界**：不做权限判断、不弹确认框、不做跳转；这些语义由宿主在 `onClick` / `label` 中表达。行内主操作（如“编辑”链接）若需要平铺展示，直接用 AntD Button，不用本组件收纳。

### `MetricCard` 与 `DetailCard`

- `MetricCard` 只组织标题和 `Statistic` 属性；数值、单位、精度及格式化由宿主决定。值加载或错误时宿主切换外层状态组件，不能显示伪造的默认指标。
- `DetailCard` 使用 `Descriptions` 的 `items`、`column` 和响应式能力；数据映射与权限脱敏由宿主负责。字段标签和值必须可辨认。
- 两者由 ProCard 拥有容器样式；父容器拥有彼此间距。无标题时不留空 header。

### `SettingsRow` 与 `ProfileIdentity`

- `SettingsRow` 根据 API 生成原生链接、按钮或静态行；禁用只用于按钮，不将不可操作信息伪装成可点击。标签是可访问名称，description 仅在补充必要信息时传入。
- `ProfileIdentity` 默认只读。仅提供 `onAvatarPress` 才把头像变成按钮，此时 `avatarActionLabel` 是必需的语义补充（缺省文案为“更换头像”）；上传、图片选择和资料权限仍由宿主负责。

### `ChartPanel`

- **API**：`state` 为 `ready | loading | empty | error`，缺省 `ready`；`children` 是图表/数据可视化插槽。`onRetry` 决定错误态是否出现可执行的重试按钮。
- **状态反馈**：加载使用 `Spin` 且宣布 busy；空态使用 `Empty`；错误态使用 `Alert`，错误恢复由 `onRetry` 托管。
- **边界**：不包含图表引擎、数据请求、坐标/格式规则；宿主负责提供有可访问摘要及必要数据表替代的图表内容。

### `ErrorBoundary` 与 `PermissionGuard`

- `ErrorBoundary` 捕获后代 React 渲染错误，使用默认 `Result` 和重试；宿主可以提供 fallback render、`resetKey` 和日志回调。它不捕获普通异步请求错误。
- `PermissionGuard` 只接受宿主的 `permitted` 布尔结果；无权限策略、角色含义和数据范围全部留在宿主/服务端。fallback 由宿主决定，不默认制造权限文案。

### `EditableDetailTable` 与 `BatchFieldSettingsButton`

- **输入**：受控 `rows` / `onRowsChange`、`rowKey`、列 `render(row, index, update)` 和 `createRow` 必填；`cloneRow` 决定复制时如何生成新行身份。`minRows` 缺省 `0`，只在删除后补足，不因初始空数据自动创建行。
- **批量状态**：仅传入 `batchOperations` 才开启选择。`fields` 支持 text / number / date / select；每个字段须由用户单独勾选后才会覆盖。勾选后留空代表清空该字段；`required` 字段不能留空。可选 `autoSelectNewRows` 在新增行后选择新行。行顺序以 `rows` 为准，不以勾选顺序重排。
- **宿主边界**：`mapRowPatch` 可按行转换同一批量 patch；`onBatchApplied` 用于通知上层已应用行和 patch。组件不做请求、权限、业务校验、字段联动或保存。
- **删除/复制**：单行删除及批量删除都会遵守 `minRows`；`canRemoveRows` 由宿主提供额外约束。批量删除在 ProTable 选择操作区确认，批量复制需提供 `cloneRow`。操作结果仍只更新受控草稿，不自动提交。
- **布局与响应式**：使用 ProTable 原生行选择提示和 `tableAlertOptionRender`，批量操作在表格选择提示区；新增明细在紧邻表格的工具栏。列宽超过可视区时由表格局部横向滚动，并显示“左右滚动查看其余列”提示；溢出检测通过 Ant Design Table 的公开 `classNames.content` 语义槽标记滚动容器，不查询内部类名；页面本身不横向溢出。
- **批量设置弹层**：Modal 垂直居中；标题和操作区固定可见，字段区最大高度为 `calc(100dvh - 200px)` 并在内部滚动，滚动边界不传递到背景页。短视口下仍可到达全部字段和底部操作。
- **可访问性**：列编辑控件按宿主提供的 AntD 控件名称呈现；行操作图标按钮带可读 `aria-label`。Modal 的焦点和键盘行为由 AntD 管理；其字段区使用原生滚动容器。组件须放在 `SunxuWebProvider` 或其他 AntD `App` 上下文内。
- **证据**：目录真实路由、桌面/窄屏几何、局部横向溢出提示、键盘行选择、批量设置应用和深色主题在 `docs/verification/mes-web-components-2026-11-10/` 记录；读屏器完整流程仍为 `UNVERIFIED`。

### `RemoteSelect` 与 `LongText`

- `RemoteSelect` 继承 AntD Select API，`onSearch` 存在时启用搜索、关闭本地候选过滤，并以 `searchDebounceTime`（默认 300 ms）防抖。候选加载、请求竞态、分页和错误反馈由宿主负责。
- `LongText` 接受文本或数字。`displayMode="wrap"` 将文本最多显示为 `maxLines` 行（默认 2 行），仅在内容被截断时显示 Popover；完整原文保留在 DOM，悬停或点击可查看全文，触发单元格的点击不会冒泡到可点击行。Popover 内容保留换行并可滚动。`displayMode="truncate"` 按 `maxLength`（默认 64 个 Unicode code point）截断；当字符数超过上限或当前宽度触发省略时，显示“更多”并打开完整内容对话框。宽度溢出由 ResizeObserver 依据文本元素的 `scrollWidth > clientWidth` 检查，文本或容器宽度变化后重新测量。空值显示 `-`。
- **目录示例**：`examples/catalog/TextControlsPage.tsx` 展示长于字数上限、短于上限但在 180px 列宽下溢出的备注，以及无需展开的短文本；桌面、窄屏、搜索结果与全文弹层证据见当前组件验收记录。

### `TableSummary`

- **职责**：将宿主提供的汇总值放入表格结果区末尾；默认固定在表格底部，也可设为跟随数据行滚动。
- **API**：`children` 是按最终可见列顺序排列的 `TableSummary.Cell`；`fixed` 默认 `true`，可显式关闭。
- **布局与可访问性**：`fixed={false}` 在数据行后按普通表格内容渲染，并随表格纵向、横向滚动。多单位/多货主长摘要使用 `fullWidth`，适配器按最终可见列动态计算合并范围，并为固定序号列、操作列留空；无需宿主手工维护 `colSpan`。通过 `ResizableProTable` 或 `ResizableTable` 显示自动序号时，适配器会正确处理序号列。自行封装表格适配器时，在掌握最终可见列后调用 `withResolvedTableSummary(summary, columns)`，再将返回回调传给 Ant Design Table。
- **适配器接口**：`withResolvedTableSummary` 与 `TableSummary` 一同从组件库导出；它只负责把 `fullWidth` 转为 Ant Design 原生汇总单元格，不请求数据、不计算业务合计。
- **数据边界**：不请求数据、不按当前页累加、不判断字段能否相加、不做单位或币种换算、不处理权限。筛选范围和各单元格的值由宿主提供；不同单位/币种不得直接相加，比例和单价须由宿主按业务公式计算。
- **目录示例**：`examples/catalog/TableSummaryPage.tsx` 展示固定列合计、跟随数据行的多单位摘要，以及简短的分页摘要。
- **证据**：目录“表格合计与结果摘要”路由的桌面、窄屏截图和单元格几何见 [`docs/verification/table-summary-2026-11-20/README.md`](./verification/table-summary-2026-11-20/README.md)。实际 MES 库存页仍需结合目标环境登录态和业务数据复核。

### `PaginationSummary`

- **职责**：在分页栏左侧呈现简短筛选结果摘要；空间不足时摘要自动换到分页控件上方。
- **API**：`label` 可选，默认“筛选结果合计：”；`children` 必填，承载宿主提供的指标、单位或分组值。通过 `ResizableProTable` / `ResizableTable` 的 `paginationSummary` 插槽使用；`CrudListWorkbench` 也接受同名属性。
- **数据边界**：不请求数据、不执行聚合、不按当前页求和、不推断单位或币种。分页器继续显示原有范围/总数文案；summary 内容的筛选范围必须与当前列表查询一致。多单位/多货主的长摘要改用 `TableSummary fixed={false}`，避免把多行内容挤入分页栏。
- **布局与可访问性**：宽容器时摘要位于分页栏左侧、分页控件右侧；有效宽度不超过 56rem 时摘要换到上方独立行，计数范围和页码位于后续行。组件不隐藏或替换页码、条数选择器或总数范围；静态摘要不使用实时播报。
- **目录示例**：`examples/catalog/TableSummaryPage.tsx` 展示简短的筛选结果摘要。
- **证据**：与 `TableSummary` 共用桌面、768px 和 390px 实际渲染记录；容器几何、溢出值和截图路径见组件验收记录。

### `ResizableProTable` 与 `ResizableTable`

- **职责与入口**：`ResizableProTable<T, U>` 保留 ProTable API，`ResizableTable<T>` 保留 Ant Design Table API；列 schema、数据源、查询请求、权限、业务动作及分页策略仍由宿主提供。从 `sunxu-web/mes` 导入。`resizable={false}` 关闭宽度拖拽适配，但仍保留适用的 MES 表格行为。
- **宽度和布局持久化**：`resizable` 可设为布尔值或 `ResizableTableConfig`。默认列宽 120px、最小 48px、最大不限、拖拽结束防抖 500ms；`defaultWidth`、`minConstraints`、`maxConstraints`、`debounceWaitTime` 可覆盖。`persistenceKey` 默认按列生成，也可提供稳定业务 key 或设为 `false`；`persistenceType` 默认 `localStorage`，可选 `sessionStorage`。ProTable 的列宽状态与可见/顺序状态分别保存，排序状态由独立的 `sortPersistenceKey` 保存；`sortMigration` 可只替换已知旧默认排序。用户显式重置列设置时，宽度缓存同步重置。
- **行号与列策略**：分页列表默认增加固定左侧“序号”列，跨页使用全局行号；可用 `showRowIndex={false}` 关闭。`materialColumnPriority` 缺省按物料名称、编码、规格、单位、主数量、辅助数量、业务上下文、扩展列、辅助信息和操作列整理默认列序；`'preserve'` 或 `{ mode: 'preserve' }` 保留声明次序，`false` 完全关闭整理，ProTable 用户保存的显式列序仍优先。不会把隐藏查询字段导出为业务列。
- **完整行菜单**：从 `sunxu-web/mes` 导入 `markCompleteActionMenuColumn(column)`，用于标记 renderer 已经提供完整菜单的操作列（例如宿主的单据动作下拉菜单）。被标记列不会再由表格适配器转换并套入 `TableActions`；普通按钮操作继续交给适配器收纳，标准列优先使用共享 `RowActions`/`TableActions`。
- **排序与查询**：ProTable 的 `request` 由宿主实现。默认对可排序业务字段发出服务端排序参数；设置 `serverSortFields` 后，仅白名单字段可排序。使用本地 `dataSource` 时按日期、数值和中文自然顺序比较；AntD Table 列可用 `sortValue`、`sortable` 控制。排序状态使用单独 key 持久化。外部 `params` 的 `undefined`、`null`、空字符串和空数组会在请求前移除；日期范围列合并通用快捷日期选项，`createdAt` / `updatedAt` 字段可补充仅日期展示列。表单 transform 和接口字段映射由宿主继续控制。
- **筛选、空态和汇总**：保留 ProTable 查询表单与列设置 API；列变更会同步导出布局。`emptyGuidance` 可提供业务空态下一步建议，默认 `TableEmpty` 展示“暂无数据”和筛选/上游数据提示；宿主传入 `locale.emptyText` 时完全覆盖。`summary` 仍是 AntD/ProTable 的宿主回调；自动行号存在时组件为汇总行补齐首列。`paginationSummary` 将宿主摘要放在分页栏左侧并保留分页范围文案，窄容器下换到分页控件上方；关闭分页时不显示该插槽。
- **高度适配**：`fitContainerHeight` 缺省关闭；设为 `true` 或 `{ enabled, bottomOffset, minBodyHeight, maxBodyHeight }` 后，组件结合视口、`fitContainerHeight` 所在结果边界、表头、分页、汇总和 footer 动态计算纵向滚动高度。单列表视口页的外部父级必须提供确定高度和可收缩的 flex 布局；长页面/多表页面不启用。
- **fit 短数据布局**：高度计算值作为 `scroll.y` 传入后，适配器也会通过 Ant Design Table/Spin 公开语义 `classNames` 和工作台自有 flex 规则撑开内层表格与滚动体；分页固定在结果边界底部，表头保持自然高度。宿主自定义 `loading` 时应合并 `tableProps.loading` 并只更新 `spinning`，保留共享 Spin 布局语义类。
- **导出布局**：有 `request` 的表默认产出当前可见列、列序和排序布局；仅用本地 `dataSource` 的表需显式设 `exportLayoutEnabled`。`useTableExportLayout()` 读取当前表布局，表格边界在导出按钮点击捕获阶段激活对应布局，避免同一路由多个表格串用。导出 API 和服务仍由宿主实现；布局只能表达用户选择，不能扩大后端允许导出的字段集合。
- **行操作和编辑宿主接缝**：`TableActions` 将有效按钮、链接、权限按钮和确认操作统一收入“更多”菜单；权限判断、确认和结果仍归动作节点/宿主。`MesUiProvider` 可选注入 `isTableActionColumn(column)` 识别宿主操作列，避免嵌套菜单；列渲染器已提供完整菜单时使用内部标记跳过通用二次包装。`resolveRowEditAction(columns, record)` 只返回宿主当前可见且允许执行的编辑回调，表格双击才调用它。未提供时不产生编辑副作用。不得在 Sunxu 中硬编码 Umi `useAccess`、权限码、MES API、路由或业务动作。
- **密度和局部溢出**：ProTable 工具栏提供“宽松 / 中等 / 紧凑 / 0 间距”密度菜单，存储键为 `mes-admin:table-density`；主题 token 同步控制单元格纵向间距。列宽总和超过可视区时，仅表格容器横向滚动，页面保持视口宽度；宿主若需要纯键盘浏览，应提供命名且可聚焦的表格滚动区域。`TableActions` 的 `max` 只为旧调用签名兼容，不改变全动作收纳策略。
- **本次行为边界**：排序恢复与宽度持久化使用稳定的列 schema 输入，排序指示在最终渲染列上合并，避免服务端排序状态更新把已保存列宽重置为默认值。此项是适配层修正，保留 MES 排序与列宽行为。
- **fill 分页视觉验收**：真实 Catalog 路由“MES 表格组件”的 `fitContainerHeight` 表格与“CRUD 列表工作台”的 `fill` 适配器均验证短数据；截图和几何数据见 [`docs/verification/resizable-fill-pagination-2026-11-23/README.md`](./verification/resizable-fill-pagination-2026-11-23/README.md)。Admin 真实业务路由需由测试环境加载更新后的共享包后复验。
- **目录示例和证据**：真实 Catalog 路由“MES 表格组件”覆盖 ProTable 与原生 Table、服务端/本地排序、列宽拖拽和刷新、列显隐与导出列数、密度、双击编辑回调、空态、汇总、视口内纵向高度及 375px 键盘横向滚动。截图、几何、接缝审计、build/typecheck 与未验收项见 [`docs/verification/mes-resizable-table-2026-11-20/README.md`](./verification/mes-resizable-table-2026-11-20/README.md)。宿主 MES 权限解析接线、读屏器、深色主题、844×390 横屏和自定义溢出容器仍为 `UNVERIFIED`。

### `todayBusinessDate`

- **职责 / API**：从 `sunxu-web/mes` 导入 `todayBusinessDate(): string`，返回 `Asia/Shanghai` 下的当前业务日期 `YYYY-MM-DD`。
- **使用边界**：用于日期默认值和纯日期业务比较。不要用 `new Date().toISOString().slice(0, 10)`，因为该结果按 UTC 切日。

### `sunxu-web/mes` 兼容组件

#### 状态、报表范围、配置入口、字典字段与导出

- **`MesStatusTag`**：API 为 `value?: string | null`、必填 `enumMap: Readonly<Record<string, { text?: ReactNode; color?: string; status?: string } | undefined>>`、可选 `children/className/style`。空值显示 children 或 `-`；未映射值显示 children 或“未知状态”；命中映射时 children 优先于 `text`，两者均未提供时标签内容为空。未提供显式 `color` 时按 `Default/Processing/Success/Warning/Error` 映射到 AntD 的 `grey/processing/success/warning/error` 预设色，未知令牌回退 AntD `grey`。它只呈现文本，不监听状态变化、不提供状态字典或业务动作；文字和颜色表现由基础 AntD `Tag` 的 `solid` 变体与颜色 API 决定，不额外计算或改写颜色。文本本身可被辅助技术读取，但不添加 live region 或状态 role。标签宽度由内容决定，列表内是否换行由宿主布局控制。
- **`MesReportQuickRangeButtons`**：受控 API 为可选 `value?: [string, string]`、`label`（默认“快捷筛选”）、必填 `options: readonly { key, label }[]`、`matchValue(value) => key | null` 和 `onSelect(key)`。当前范围是否匹配某选项及 key 的日期含义完全由宿主定义；组件仅用 AntD `Segmented` 展示选择并回传存在于 options 的字符串 key。无匹配时不选中；不解析日期、不自动刷新报表、不拥有清空或请求动作。`label` 作为 Segmented 的 `aria-label`；选项沿用上游键盘行为。组件不额外包装选项，宿主需确保选项数和标签长度适合其可用宽度，窄容器可在外层安排换行或横向滚动。
- **`MesConfigEntryLink` / `MesConfigEntryFieldLabel`**：Link 接收 `href?`、`permitted?`（默认 false）、必填 `label`、`actionText?`（默认“去配置”）和 `onOpen?`；仅当权限为真且 href 非空时渲染。它使用新标签页链接、`rel="noreferrer"`、阻止点击冒泡，并调用宿主 `onOpen`。可访问名称包含可见操作文案和目标说明（“${actionText}：新标签页打开${label}”）。FieldLabel 接收 `children` 及同一 href/permission/onOpen，另有可选 `show`（默认 true）；通过 Space 将字段文字与链接并排显示，仅当 `show && permitted && href` 时显示链接，否则原样渲染 children。`MesConfigurableProFormSelect` 与两个字典选择器通过 `show` 传递已计算的候选/字段显示状态。FieldLabel 的 Space 不换行，长标签应由宿主检查窄宽度。组件不做权限计算、不生成 URL、不执行导航状态更新或返回后刷新。
- **`MesConfigurableProFormSelect`**：保留 ProFormSelect 的其他公开 props，另需 `label: ReactNode`、必填宿主 `request` 和 `configEntry`，可选 `configWhen(params)` 与 `emptyText`（默认“暂无可选数据”）。在字段无值、非禁用/只读且依赖条件成立时，用移除 `keyWords/keyword/search/searchText` 的参数向宿主 request 探测基础候选；仅空数组显示配置标签，请求失败隐藏入口并继续向 ProForm 抛出查询错误。实际候选搜索保留其余参数和错误；搜索中不以关键词结果切换配置标签。配置标签打开时记录回访意图，窗口重新获得 focus 后递增刷新版本以重新请求；源请求前移除内部 `configEntryRefreshVersion`。字段校验、候选服务、路由和授权由宿主提供；组件内的 focus listener 在卸载时清理。ProForm 标签和 Select 键盘/表单状态由上游提供；目录无障碍名称来自表单 label。
- **`MesDictionaryProFormSelect` / `MesDictionaryFormItem`**：共享 `dictionary: { options, loading?, error?, retry }`、配置入口 props 和 `showConfigEntry?`（默认 true）。前者使用 ProFormSelect，后者用于原生 `Form.Item`/`Form.List` 并克隆一个 AntD Select 子元素，把 options/loading 注入；子元素已有 `notFoundContent` 优先于组件默认内容。未覆盖时按 loading/error/空候选显示“正在加载字典项”/“字典项加载失败 + 重试”/“暂无可选字典项”。只有 `showConfigEntry` 为真、无当前值、无候选、无 loading/error、字段未禁用且授权/href 有效时才显示配置入口；返回窗口 focus 后调用宿主 retry。字典请求、错误分类、权限、路由及真实重试都归宿主；Select 下拉与 Form 的键盘、label、校验由 AntD/ProForm 管理，目录无障碍名称需使用明确字段 label。配置标签并排区不换行，宿主应检查长字段名。
- **`MesExportButton` / `MesExportDropdownButton`**：`MesExportButton` 接收 `canExport?`（默认 true）、必填 `exportFn/fileName/download`，以及 `onPrepareExport/onSuccess/onError`；`canExport=false` 时不渲染。点击后进入 loading，顺序调用请求、下载、成功回调；捕获请求或下载错误交给 `onError`，最终清除 loading。Dropdown 接收 items（每项 `key/label/exportFn/fileName`，可选 `disabled/applyTableLayout`）、`download` 和相同结果回调；禁用项不可选，同 key 应唯一；`applyTableLayout` 默认 true，选中条目时先回调宿主布局意图再执行请求/下载。按钮本身的 click-capture 也会在打开菜单时调用 `onPrepareExport(true)`，所以宿主应将其视为菜单打开阶段的布局激活信号，选择条目后会再收到一次带条目值的信号。二者均不拥有权限判定、API、文件编码/实际下载、表格列授权或用户通知。可见按钮文字为可访问名称，图标不替代文字；AntD 提供按钮 loading、菜单键盘和禁用状态。目录下载只记录回调，不制造文件。布局适配由宿主表格在按钮捕获阶段激活；窄工具栏的按钮排列由宿主控制。
- **目录示例**：Catalog “MES 宿主注入控件”展示九个组件的已映射/空值/未知/自定义状态文案、受控范围、配置入口权限/候选/请求失败、ProForm/原生 Form 字典的空/错误/重试/就绪状态、单项和多项导出的权限/loading/成功/错误回调及禁用菜单项。示例使用本地确定性宿主回调，不调用 MES 服务，也不下载文件。本次在本地 `http://127.0.0.1:4173/` 选中此 Catalog 页面；已实测报表范围选择、配置入口授权开关、远程候选空/有候选/请求错误显隐、ProForm/原生字典错误后重试、导出单项成功/错误与下拉项回调；AX 树已检查控件角色/可访问名称。截图未归档，精确视口尺寸未记录，且没有 DOM 几何数据，故间距/溢出/窄视口与完整键盘/读屏器流程均为 `UNVERIFIED`；真实 MES API/权限接线也未验证。

- `MesUiProvider` 接受 MES 宿主的 `hasPermission(permission)` 函数；`PermissionButton` 的 `permission` 由此函数判断，无 Provider 或无权限时 fail closed 并不渲染动作。确认文案、危险标记、异步 `onConfirm`、loading、成功提示和成功回调沿用 MES 当前实现；异步错误从 `info.msg`、`data.msg`、`response.data.msg` 或 `Error.message` 提取并显示可确认错误弹窗。请求和权限码的含义由宿主负责。
- `MaterialFilteredSelect` 是 MES 物料业务复合控件；`MaterialSelectField` 与 `MaterialMultiSelectField` 将其接入 ProForm 字段，`materialSelectColumnProps(request, placeholder?)` 用作 ProTable 查询列。筛选模式为 `always/collapsible/hidden`，默认 hidden；保留 `requestKey` 外部刷新、300ms 防抖、族/系统类型/业务分类级联、选中项保留、关键词精确/前缀排序、旧搜索结果丢弃和选中后清空搜索。多选使用 `values/onValuesChange`，单选保留 `value/onChange` 契约；ProForm 注入的 `fieldProps.value/onChange` 会继续参与表单提交。
- 远程 `request({ keyWords, baseType?, categoryId?, familyId? })` 由调用方提供。`MesUiProvider.materialSelectCapabilities` 提供系统类型选项、单位标签、族/分类加载、条码查询、扫码枪注册、自定义字段 schema 和配置入口渲染；Sunxu 不调用 MES API、字典、权限或路由。扫码仅在 Select 聚焦且未禁用时启用；解析出的物料必须再次命中调用方当前候选请求，否则不触发字段变更并提示“该物料不在当前可选范围内”。多选扫码去重，已选项在搜索结果刷新后仍保留。
- 候选副信息显示规格、单位标签及最多 3 个启用且 `displayJson.showInSelector=true` 的自定义字段；按 `displayJson.sortOrder` 回退到字段 `sortOrder` 排序。自定义字段显示保留 MES 的 select/multi-select 选项映射、布尔“是/否”、日期/时间格式和计算异常原因提示；schema 加载失败可重试，错误提示“物料选择器副信息加载失败，请刷新后重试”。
- `renderConfigEntryLabel` 由宿主实现可见权限和配置页链接。来源 `ConfigEntryFieldLabel` 接受的 `show` 是已弃用兼容参数，来源实际忽略它；宿主应按授权决定是否返回链接，`onOpen` 用于回到表单时触发候选刷新。未提供此能力时只显示原标签。调用方拥有表单标签、必填/校验规则、字段间距和 ProTable 查询状态。
- **状态与布局**：远程查询 loading、空候选、disabled、过期搜索拦截 warning、无候选的配置入口和扫码失败提示均由组件保留；筛选控件在容器变窄时换行，候选弹层最小宽度 320px，长副信息截断并通过 title 提供全文。族/系统类型/业务分类筛选器宽度默认 168/112/128px；系统类型默认宽度由来源的 92px 调为 112px，确保 Ant Design 6 下“系统分类”标签完整可见，可由 `baseTypeWidth` 覆盖。Form 标签用 ProForm.Item，基础键盘交互由 AntD Select 承担；扫码键盘监听由宿主注册并应在失焦/禁用时注销。
- **目录和证据**：Catalog 的“MES UI 套件 → MES 物料选择器”覆盖桌面/375px 搜索、筛选、单/多选、单位与自定义字段、扫码验证和宿主配置权限。真实 MES API/权限/设备接线以及读屏器完整流程仍为 `UNVERIFIED`；证据见 [`docs/verification/mes-material-selector-2026-11-20/README.md`](./verification/mes-material-selector-2026-11-20/README.md)。
- `MasterDataQuickCreateSelect` 保留客户/供应商 `ProFormSelect` 字段和原有 `request/params/fieldProps`；只允许 customer/supplier 两种实体。客户创建返回的权威 `value/label` 以及可选 `salesRepId/paymentTerms` 回填当前字段；单选 `fieldProps.onChange(nextValue, option)`，多选/tags 将 ID 去重追加并回调 `fieldProps.onChange(values, [option])`，使宿主现有销售联动继续运行。新建后把返回选项保留在首屏候选未命中的情况下，并递增刷新参数；候选请求只用去掉 `keyWords/keyword/search/searchText` 后的参数探测基础候选是否为空，搜索与探测状态丢弃迟到响应。禁用/只读字段不展示新建入口；无 `renderDrawer` 或 `canCreate(entity)` 返回 false 时不渲染新建动作。打开宿主抽屉前收起当前选择下拉，避免候选弹层盖住抽屉；配置标签由宿主渲染，收到来源兼容 `show` 信号和返回配置后的刷新回调。`MesUiProvider.masterDataQuickCreateCapabilities` 提供 `canCreate`、`renderDrawer({entity,open,onOpenChange,onCreated})` 与可选 `renderConfigEntryLabel`。MES 客户/供应商抽屉与表单字段是账本中的独立来源组件，仍待后续迁移；真实 MES API、权限码、默认值、路由以及读屏器流程为 `UNVERIFIED`。
- **目录和证据**：Catalog 的“MES UI 套件 → MES 主数据快捷新增选择器”覆盖配置入口回调、客户权限门控、创建后客户默认值/权威 ID、候选第一页未命中时保留新选项、供应商多选追加、禁用门控和 375px 下拉边界。目录使用本地确定性表单模拟宿主抽屉；真实 MES 抽屉/API/权限/路由与读屏器完整流程仍为 `UNVERIFIED`。证据见 [`docs/verification/mes-master-data-quick-create-2026-11-20/README.md`](./verification/mes-master-data-quick-create-2026-11-20/README.md)。
- 会计选择器完整保留来源字段名、标签、tooltip、required、disabled、autoDefault、宽度和 `bookFieldName`；`AccountingBookField` 取主账簿，无主账簿时仅在唯一选项下默认。`FiscalPeriodField` 将账簿编码放进 request `params` 以触发依赖变化后的请求，按期间编码倒序显示状态；只自动选择覆盖浏览器本地业务日期的期间，状态优先级为 open、soft_closed、not_opened、closed、locked，同级取期间编码较新者，不因未来期间已开启而默认未来期间。`VoucherWordField` 同样把账簿编码放入 params，按 `createdAt` 升序并默认首个启用项；当前凭证字无效时也回退到首项，无候选时不虚构默认值。`AccountField` 支持根字段名或 ProFormList 相对 NamePath，禁用/要求先选账簿、仅请求启用且允许记账的科目，后端按关键词搜索并保留 50 条页大小、300ms 防抖和关闭本地过滤。
- `createAccountingSelectorRequests(capabilities)` 为 ProTable 搜索列提供来源原有七类选项适配：启用账簿、组织、币别，账簿期间，允许记账科目，按创建时间排序的凭证字，以及非末级/不可记账且排除当前编码的上级科目。固定状态、账簿条件和页大小由适配器补齐，实际服务请求由 `MesUiProvider.accountingSelectorCapabilities` 注入。`renderConfigEntryLabel` 接收来源配置目标和空候选 `show` 信号；表单字段未选值、可用且基础候选为空时才允许宿主显示配置入口，受账簿依赖的期间/凭证/科目还需有当前账簿。配置标签返回后的窗口 focus 会递增请求版本；搜索错误和旧请求不显示陈旧配置入口。真实 MES API/权限/配置页面由宿主提供。
- **目录和证据**：Catalog “MES 会计账簿与期间选择器”覆盖主账簿默认、当前期间优先于未来已开启期间、凭证字排序默认、账簿参数联动、七类 ProTable 候选 helper、科目远程搜索、空账簿配置入口及手机下拉边界。真实 MES 服务、授权、配置路由和读屏器流程仍为 `UNVERIFIED`；截图、DOM 间距与交互记录见 [`docs/verification/mes-accounting-selector-fields-2026-11-20/README.md`](./verification/mes-accounting-selector-fields-2026-11-20/README.md)。
- `MesUiProvider.actionIntentRoute` 接收宿主当前 `pathname`、`search` 及路由 `replace(path)` 回调；Sunxu 不依赖 Umi。缺少该路由能力时 `DocumentActionIntent` 不触发操作。
- `DocumentActionsDropdown<T>` 保留 `documentId`、`documentNo`、`loadDocument`、`fallbackDocument`、`actions` 和 `onAction`。打开菜单时优先按 ID 加载权威单据，否则使用宿主提供的安全列表投影；依次按单项 `permission`、全部 `requiredPermissions`、后端 `availableActions` 中的 `requiredAvailableAction` 和 `visible(document)` 过滤。菜单保留动态 label、danger、loading、未找到和失败重试状态；动作回调收到选中的 key 和单据。当前用户权限和单据请求由宿主提供；页面不在 Sunxu 中复制 MES 状态机。
- `DocumentCustomFieldPanel` 保留 `objectType/objectId/editable/title`；无 `objectId` 或宿主未注入渲染能力时返回 `null`，字段为空时隐藏整个面板，字段加载错误时仍显示错误内容，切换单据身份时在新状态到达前先隐藏旧字段。`MesUiProvider.renderCustomFieldPanel` 接收 `objectType/objectId/editable/showEmpty: false/onDisplayStateChange`；局部 `title` 只由外层容器渲染。MES 提供字段 schema、请求、编辑器和内容。切换身份会重置宿主渲染子树；可见性仅由 `hasFields || hasError` 决定，加载中和无字段不占布局。字段权限、保存与验证仍归 MES。
- `DocumentViewSwitch` 用 Ant Design `Segmented` 提供 `detail/orders` 两态切换、默认“明细/单据”文案、对应图标和必填 `ariaLabel`；`createDocumentViewSwitch` 可配置无障碍名称和标签，缺省标签不变。`DocumentLedgerViewSwitch` 预设无障碍名称“单据与明细视图切换”。值由宿主控制，未知切换值被忽略；该组件不改变路由、不保存偏好，也不主动刷新列表。
- `DocumentActionIntent` 保留 `action/enabled/onTrigger`；路由 query 中的首个 `action` 匹配且 enabled 时先通过宿主 replace 到当前 pathname 清除 query，再调用详情页已有流程；组件实例只处理一次，深链不得绕过权威详情和预检。
- `DocumentModalForm<T, U>` 保持 Pro `ModalForm` 的泛型和其余 props 透传。默认宽度为 `100vw` 并实际铺满当前工作区，默认 `getContainer` 为 `false`，不穿透 keep-alive 标签容器；只有显式 `viewportFullscreen` 且仍采用默认标签容器时才固定到视口。最小化时取消遮罩并隐藏弹窗，但保持表单挂载与草稿；左下角还原条回到同一组件所在工作区。`open` 变化时清除最小化状态。默认 `destroyOnHidden=true`、`mask.closable=false`、`closable=false`，标题栏提供带无障碍名称的最小化和关闭按钮；可通过调用方 `modalProps.mask` 覆盖遮罩行为。完整宽度子节点由组件提供 `20px 24px 24px` 内边距，render-function children 原样透传；调用方自定义 Modal 语义样式槽及浮层 `style` 会与默认布局合并。固定数值宽度使用普通 Modal 布局；显式自定义 `getContainer` 保留自定义挂载容器，但仍应用完整宽度布局。完整宽度 Modal 保留 `document-form-modal` class 供 MES 宿主现有全局样式过渡使用。组件不负责草稿保存、请求、权限、路由或业务校验。
- `DocumentLineQuantityInput` 是受控数值编辑器：有效数值变化立即交给宿主，清空时只保留本地空草稿、不发送 `null`；失焦时恢复宿主当前值。`InputNumber` 的范围、精度、步长和外观 props 继续透传。
- `StatusDisplay` 只消费宿主传入的 `enumMap`，不内置 MES 状态常量；按 `mode` 呈现 `StatusTag`、Ant Design `Badge` 或彩色文本，未知枚举回退原始值、空值显示 `-`。令牌颜色和显式色值沿用 MES 当前映射规则。
- `TableLongText` 保留 MES 表格现有的 `mes-table-long-text` class，默认使用 `LongText` 的两行换行模式；可用 `maxLines` 调整行数，也可显式选择 `displayMode="truncate"` 使用 64 字符截断和对话框。两行模式的全文 Popover 支持鼠标悬停、触摸点击和键盘 Enter/Space 打开，Escape 关闭；点击不冒泡到可点击表格行。`isTableLongTextValue` 只接受 string/number。
- `AmountText` 保留 `value/prefix/precision/placeholder` API；默认前缀为 `¥`、精度为 2、占位符为 `-`，使用 `zh-CN` 分组格式化，空值和非数字显示占位符。格式化后的字符串交给 `MesUiProvider.maskAmount`；没有宿主能力时 fail closed，空值为 `-`、金额为 `****`。金额显隐状态和权限仍由 MES 宿主管理。
- `AmountPolicySnapshotTag` 保留嵌套快照解析、默认规则文案、版本展示、公式回退、数量/金额详情 Popover；显式 `mask` 优先，否则使用宿主金额脱敏能力。快照输入接受根对象、`priceSnapshot`、`amountPolicySnapshot` 与 `result` 嵌套形态，未识别有效 `policyCode` 时显示 `-`。
- `DateText` 保留 `date/datetime/time` 三种格式（`YYYY-MM-DD`、`YYYY-MM-DD HH:mm`、`HH:mm`），默认 datetime；空值和无效日期显示 `-` 或调用方占位符。`UserText` 优先显示 `realName`，回退 `username`，再回退 `—` 或调用方占位符。
- `DocumentKeywordSearch` 是单一关键词快捷搜索的唯一公开控件，保留受控 `value`（默认 `''`）、`placeholder`（默认“输入单号、客户、供应商或物料搜索”）、`loading`（默认 `false`）和必填 `onSearch`。`value` 变化会同步草稿；输入只暂存在组件状态，清空立即回调空字符串，提交时 trim 首尾空格。AntD `Input.Search` 提供 Enter/搜索按钮提交及清除按钮，输入通过 `aria-label="关键字搜索"` 提供稳定名称，宽度为 `clamp(160px, 20vw, 256px)`。跨字段搜索范围写入 placeholder；关键词只用于当前查询，不写入个人视图或持久筛选状态。业务字段筛选、查询执行与保存行为归宿主。
- `DocumentTableTitle` 已弃用，仅作为旧调用的兼容适配器保留。`title` prop 仍接受 `ReactNode` 以保持旧调用可编译，但不再渲染；新代码直接使用 `DocumentKeywordSearch` 并提供搜索范围 placeholder。
- `DefaultRouteHint` 仅在有 `materialId` 且没有 `routeId` 时调用必填的 `requestCandidates({ materialId, customerId, routeSelectionDate })`；取首个 `recommended` 候选，组合路线编码/名称、版本和原因。没有推荐路线时显示 MES 指引；请求错误静默隐藏，条件变化或卸载会丢弃迟到响应。服务请求和错误策略留在宿主。
- `CustomerMaterialCell` 支持 `combined/internal/customer` 三种模式。combined 时客户别名优先并在下一行保留内部物料值；缺少别名或两者相同则不重复显示。拆分模式可仅在名称字段按对应来源显示规格。`customerMaterialSortValue` 与主值一致，别名优先回落内部快照。内部 `materialId` 是权威身份；客户别名是销售单据的冻结快照，客户输出打印模板不应使用此比较单元格。
- `EntityThumbnail` 保留缩略图优先、预览图回退、主题 `controlHeight` 默认方形尺寸（显式 `size` 覆盖）、无图 Tooltip 图标、损坏图 SVG fallback 和 AntD 图片预览。图片存在时点击/双击停止冒泡，避免触发行选择或编辑；无图提示沿用源实现，不截断行事件。
- `FileUrlsInline` 以受控 URL 数组管理附件，先 trim、去重并忽略空项；保留仅查看、空态、编辑删除和多文件上传。默认最多 20 个、单文件 20 MB；默认允许 jpg/jpeg/png/webp/pdf/doc/docx/xls/xlsx/csv，可通过 `maxCount`、`maxSize`、`maxSizeByExtension`、`accept`、`allowedExtensions` 覆盖。上传将文件放入 `FormData.files`，保留扩展名、大小和并发上传数量校验，上传 URL 交给 `onChange`；未注入上传能力时阻止上传并提示配置缺失。图片通过 AntD `Image.PreviewGroup` 预览；PDF 在当前标签工作区内打开 Drawer，普通附件走授权代理下载。
- `DrawingFilesInline` 沿用 `FileUrlsInline` 的值与上传契约，默认只收 jpg/jpeg/png/pdf；可传 `availableFileUrls` 展示订单头附件选择器，候选仅含图片/PDF。已关联订单附件仍写回当前明细行值；移除旧关联时保留该行独立上传的 URL。源字段名、回调和空态/上传提示均可覆盖。
- `DrawingFilesGallery` 以 `groups[{key,title,description?,urls}]` 按来源分组，空组被过滤；每组显示附件数和图片数，只把图片 URL 交给 `onPrint`，且需同时启用 `canPrint` 和回调。图片打开 Image Preview，PDF 打开 PDF Drawer，其他文件点击下载；文件名优先使用宿主原名解析能力，否则从 URL 解码并回退标签名。
- `PdfPreviewDrawer` 保留页码、上一页/下一页、60%–200%（每次 20%）缩放、PDF 下载和加载/解析错误的下载恢复。页面按预览区域可用宽度渲染；Drawer 留在当前 keep-alive 容器，不用新窗口或裸 URL iframe。宿主通过 `MesUiProvider.drawingFilesCapabilities` 提供授权 `fetchFileBlob` / `downloadUrl` / `downloadBlob`、上传 `uploadFiles`、`resolveFileDisplayNames` 与 `pdfWorkerSrc`；Worker 必须和宿主解析到的 `pdfjs-dist` 完全同版本。缺少代理或 worker 时显示明确错误，Sunxu 不调用 MES API、鉴权或文件服务。Catalog 用本地确定性能力适配器覆盖这些回调，真实 MES 代理接线仍归宿主。
- `MaterialDrawingsPanel` 保留物料图纸列表、默认首项选中、当前文件切换和图片/PDF/GLB预览；所有文件下载、仅有编辑权限时的上传/删除、上传策略加载与失败状态、扩展名/大小/数量限制、待上传列表、普通文件与 GLB 分别上传及按选择顺序恢复 URL。未返回 URL、请求失败、只读空态、删除确认和成功后清空/选中首项/刷新回调都保留。图片使用 AntD `Image.PreviewGroup`、PDF 复用 `PdfPreviewDrawer`，GLB 通过 `renderModelPreview(url, name)` 注入；文件服务、策略、权限结果、文件名/URL、消息与错误格式均由 `MaterialDrawingsPanelCapabilities` 注入。Catalog Demo 覆盖编辑权限切换、策略错误与预览类型；真实宿主文件代理接线及视口为 `UNVERIFIED`。源文件 SHA-256：`716b4db60255de468da108b58381c0efdcdea77233f5e637a9c4566b797b3b12`。
- `GlbModelViewer` 接收宿主已授权且浏览器可读取的 `url` 与名称；保留 GLTF 场景加载、轨道旋转/缩放、网格显示、材质线框、恢复相机、加载中/失败状态及卸载、URL 变化和加载竞态时的 renderer/controls/geometry/material/texture 清理。与 `MaterialDrawingsPanel.renderModelPreview` 插槽可组合；three 及 OrbitControls / GLTFLoader 是可选 peer，仅在组件挂载时动态导入，Vite 库构建将其外置，未使用 Viewer 的消费者不会因静态 MES 入口加载 three。依赖版本与 MES 当前 `0.185.1` 对齐。源组件 SHA-256：`9e6ae482a3e1fb61cafc08e8153e7896478785d24b08328bfcde861c0fd985d5`。Catalog 独立展示正常/错误状态；实际渲染及无 three 消费端打包验证因 UV 暂停为 `UNVERIFIED`。
- `DocumentLineBatchSettingsButton` 保留 MES 明细字段 schema；`number` 支持 `min/max/precision`，`date` 的 patch 收到 `YYYY-MM-DD` 字符串，`select` 的 patch 只接收字符串（数值选项仍归一为 `undefined`），`text` 保留最大长度。字段需独立勾选，勾选后留空表示清空；`required` 字段为空时阻止应用并提示。直接调用 `buildDocumentLineBatchPatches` 时可传日期字符串，UI 日期控件产生的 Dayjs 值会格式化为同一字符串。远程选择字段通过 `request(params, values)` 加载候选，竞态结果会丢弃；请求中对应 Select 显示 loading，失败在字段旁显示错误和“重试”入口，重试后清除错误。
- MES 适配组件不请求 MES API、不查权限；远程候选请求、权限判断、状态字典和 `onApply` patch 提交由宿主提供。它们位于 `src/mes/**`，从 `sunxu-web/mes` 导入。
- MES 套件目录中的表格固定列宽为 566px；窄屏将横向溢出限制在表格内，并提供可聚焦命名区域，以左右方向键、Home 和 End 浏览列。
- 两个适配器的桌面/375px 触摸窄屏/844×390 横屏渲染、全文查看、批量字段区滚动、键盘表格滚动与 DOM 几何记录见 `docs/verification/mes-ui-suite-2026-11-19/README.md`。读屏器完整流程仍为 `UNVERIFIED`。
- `DocumentModalForm` 的工作区全屏、视口全屏、固定宽度、遮罩点击不关闭、最小化保留草稿、键盘 Space/Enter 还原、关闭和宿主提交已在目录真实页面完成渲染验收；截图、DOM 几何和横向溢出数据见 `docs/verification/mes-document-modal-form-2026-11-20/README.md`。自定义 `getContainer` 组合和读屏器流程标为 `UNVERIFIED`。
- `DocumentCustomFieldPanel` 在 Catalog 真实路由覆盖有字段、空字段、加载错误、无单据和身份切换；桌面/375px 几何、截图与 DOM 状态记录见 `docs/verification/mes-document-custom-field-panel-2026-11-20/README.md`。真实 MES API/编辑器宿主接线与读屏器流程标为 `UNVERIFIED`。
- `DocumentLedgerViewSwitch` 在 Catalog 真实路由覆盖“明细/单据”受控切换、无障碍名称与窄屏布局；状态只在页面内变化，URL 不变。截图、几何和 DOM 状态见 `docs/verification/mes-document-ledger-view-switch-2026-11-20/README.md`。MES 各页面的本地偏好、列表 ref 刷新时机与数据读取为宿主行为，未迁移或验收。
- `ProductionBomSelect` 保留 `name`（默认 `bomHeaderId`）、`label`、`materialId`、`saleOrderId`、`saleOrderItemId`、`autoSelectSingle`（默认 true）、`dependencies`、`params`、`fieldProps` 和其余 ProFormSelect props；默认依赖物料、销售订单及订单明细。显式 ID 优先于同名表单字段。关键词读取 `keyWords/keyword/search/searchText` 并统一传为 `keyWords`；请求同时携带物料和订单上下文。基础请求恰有一个候选且字段仍为空时自动回填，已有选择不会覆盖；查询和自动探测共用请求序号，迟到结果不覆盖新状态。Select 保留远程搜索、关闭本地过滤、清空和“可选，不选则自动使用默认BOM”提示。字段名用于 ProForm 校验消息，显式 `tooltip` 覆盖 MES 默认 `bomHeaderId` 字段帮助。`MesUiProvider.productionBomSelectCapabilities` 注入候选请求、原字段帮助和配置标签；宿主标签负责 `canBom` 权限与 `/material/bom` 新标签页导航。来源当前 `ConfigEntryFieldLabel` 将 `show` 保留为弃用兼容参数并忽略，因此即使候选不为空，有 BOM 配置权限仍显示配置入口；从配置页返回 focus 后重发候选请求。未注入能力时只显示字段标签，不自行请求、授权或路由。Catalog 覆盖空/唯一/多候选、自动选择、权限标签和字段帮助；由于当前 UV 构建/测试暂停，真实路由渲染、375px 几何与浏览器证据为 `UNVERIFIED`。
- `MaterialSupplierPriceTierSummary` 复制价目数组后按等级字典码升序、默认价目优先、`priority` 升序排序；最多显示前三个等级 Tag，尾部用 `+N` 汇总其余项。无等级显示“无等级”，默认价目蓝色标记，币种优先价目币种并回退 `CNY`，单价按四位小数显示后交给宿主金额脱敏。Catalog 覆盖金额显隐、等级名称、默认价目、币种与折叠；桌面/窄屏真实渲染仍为 `UNVERIFIED`。同源的 `MaterialSupplierPriceTiersModal` 作为独立读写组件单独迁移与追踪。
- `MaterialSupplierPriceTiersModal` 保留物料/供应商上下文、新增立即开表单、按当前关系请求首 100 条、物料等级与单位回显、权限门控、三点操作、删除确认、成功提示和列表/宿主刷新。表格字段包括等级、采购价（币种/计价单位/四位金额脱敏）、税率/含税、数量区间、有效期、优先级、默认、状态和供应商料号；表单保留新增 18 项、编辑 19 项（状态仅编辑），编辑时锁定等级/币种/生效日期，新增时默认 CNY、UTC 今天、active 与上下文供应商字段。创建/更新/删除、字典/单位列表、权限结果和备注 help 由宿主注入；请求错误继续由 ProTable/ModalForm 按源端 Promise 行为处理。Catalog 覆盖读写权限、表单直接打开、删除确认、金额脱敏和单位换算；真实浏览器渲染及几何/键盘证据为 `UNVERIFIED`。
- `CustomFieldFormSection` 并发请求字段 schema 与编辑态当前值，按 `fieldKind=input` 和 `displayJson.showInForm=true` 生成输入字段；保留 number/decimal、boolean、date、datetime、select、multi-select、long text/file/image 和普通文本映射，尊重 `optionsJson.enabled=false`、validation `min/max/maxLength` 及 `requiredPolicy=create/update`。详情值写入 `customValues`；向宿主回传 schema 版本、全部输入 key、表单可见 key 和当前值。请求序号会丢弃旧对象的迟到响应；加载失败显示宿主错误及“重新加载”。未注册能力时显示明确的服务未配置错误，不访问 MES API。目录覆盖创建/编辑必填差异、值回填、无字段和加载失败；由于当前 UV 构建/测试暂停，真实路由渲染、视口几何及浏览器证据为 `UNVERIFIED`。同一源文件的 `CustomFieldValuePanel` 详情/编辑侧栏仍待迁移，因此该源文件不计为完成。
- `DocumentLineCustomFieldFormItems` 按 `isActive !== false`、`displayJson.showInForm === true` 与 `fieldKind=input` 过滤字段；复制 schema 后按 `displayJson.sortOrder` 回退 `sortOrder` 升序。每项生成 `Col(span=colSpan ?? 6)`，字段路径为 `[...namePrefix, 'customValues', fieldKey]`；保留 MES number/decimal/money、boolean、date/datetime、select/multi-select、long text/file/image 和普通 Input 映射、`optionsJson.enabled=false`、`requiredPolicy=none` 与日期 ISO/`YYYY-MM-DD` 序列化。组件无内部请求/权限/持久化；宿主提供 schema 和前缀，父级提供 AntD `Row` 与表单实例，校验展示由 `Form.Item` 管理。Catalog 覆盖可见/停用/公式/隐藏字段、类型、排序、禁用选项、初始值回填、提交和空字段。UV 已解锁；真实 MES 路由、窄视口几何、键盘和深色主题验收尚未完成，保持 `UNVERIFIED`。
- `MaterialTablePicker<TMaterial>` 保留默认单选、受控/非受控弹窗、初次打开时按 `value/values/selectedRecords` 回填、单选 radio/行点击、多选 checkbox/跨页保留、双击切换多选、选中清单移除和确定前数量大于零校验。左侧系统分类映射 `baseType`、自定义分类映射 `categoryId`；物料目录搜索按名称/编码关键词请求，固定筛选参数优先于 UI 筛选。可选客户口径按当前页物料批量覆写库存，请求失败保留公司口径。多选数量摘要按单位分组，库存/订购数各自汇总；预览表显示已选物料、数量、库存、规格、单位、缩略图和删除入口。`MesUiProvider.materialTablePickerCapabilities` 要求宿主提供当前 MES 默认分页对象，以保留全局 page size 记忆与浮层挂载策略；物料服务、分类、客户库存与单位字典也由宿主注入。Catalog 用本地确定性服务覆盖分类筛选、搜索、单双选、数量、客户口径与缩略图；当前 UV 暂停期间未做真实路由渲染与视口验收，证据为 `UNVERIFIED`。
- `BatchMaterialAddButton<TRow>` 复用物料表格选择弹窗，并保留 `buildBatchMaterialOption` 的物料字段/自定义字段运行时快照映射。已有 ID、同次重复选择会跳过；仅当至少新增一行时去掉空白占位行；`maxRows` 基于有效旧行计算剩余名额，完整保留默认数量 1、用户录入数量、重复提示和超限提示。先将 `nextRows` 交给 `onRowsChange`，再回调 `onAdded(addedRows, materials, nextRows)`。目录场景覆盖空占位清理、已有物料去重、数量透传和最大行数提醒；浏览器实测仍为 `UNVERIFIED`。

#### `MaterialSupplierPriceTiersModal` 组件规格

- **职责 / 层级**：MES 采购领域复合组件；查看并维护单个物料与供应商关系下的阶梯价。
- **非目标 / 可见所有者**：不实现价格匹配或采购业务规则；页面负责何时打开组件及上下文，MES 宿主负责读写、权限解析、字典、单位换算和跨区刷新。
- **来源真相 / 组成**：AntD `Modal`、`Popconfirm`、`App.message`，Pro `ModalForm` 与 MES `ResizableProTable`；结构为列表弹窗、三点行操作和条件显示的新增/编辑弹窗。
- **API**：`materialSupplier: SupplierPriceTierContext | null` 控制列表弹窗；`createImmediately` 默认 `false`；`onClose` 必填；`onChanged` 可选。能力由 `MesUiProvider.supplierPriceTierCapabilities` 提供，包含 `requestPriceTiers`、`requestUnitConversions`、币种请求/选项、权限布尔值、创建/更新/删除及字典和 help 数据。
- **权限 / 状态**：没有请求能力时显示配置错误；列表读取权限不限制展示。仅 `canCreate` 可显示新增动作，仅 `canUpdate` 可显示编辑，仅 `canDelete` 可显示删除确认。创建、更新、删除成功后显示消息，重载当前表格并调用 `onChanged`；请求失败保留 ProForm/ProTable Promise 错误行为。`createImmediately` 在上下文打开时直接进入新增表单。
- **表单契约**：新增有 18 项、编辑多一个状态字段；编辑锁定等级、币别、生效日期。数量精度、税率范围、价格四位精度、税含口径、报价单位转换、默认价目、有效区间和供应商物料字段沿用 MES 源映射；新增价格为空时返回错误且不关闭表单。
- **令牌 / 布局 / 响应式**：列表弹窗宽 1040px，横向滚动 `x=1160`；维护表单宽 560px、垂直居中，主体最大高度为视口减 200px 并单独滚动。遵守 AntD 宿主主题；窄屏弹窗折叠行为仍待真实渲染确认。
- **无障碍 / 组合边界**：AntD Modal、ProForm 字段标签和 `TableActions` 菜单提供基础命名及键盘行为；删除使用 `Popconfirm`。外层页面必须提供 MES 上下文和 `MesUiProvider`，组件不读取 Umi 或 MES 服务。
- **证据**：对应 MES 当前源文件 SHA-256 为 `5ca8b6975876eab916fc53440b6673ee3b9fd7c2ccc31315eb65f9a0f4529cfb`；Catalog 使用本地 mock 服务和权限切换。真实路由、窄屏布局、键盘路径及深色主题为 `UNVERIFIED`。

#### `DocumentLineCustomFieldFormItems` 组件规格

- **职责 / 层级**：MES 单据明细业务表单组合；依据宿主传入的字段 schema，在已有表单中渲染可编辑字段。
- **非目标 / 可见所有者**：不加载 schema、不保存值、不执行权限或业务校验、不提交单据；字段行、分组与间距由包含它的 MES 表单负责。
- **来源真相 / 组成**：Ant Design `Row` / `Col` / `Form.Item` 及 `Input`、`InputNumber`、`Switch`、`DatePicker`、`Select` 是控件与交互真相；Day.js 负责日期值转换。结构为 `Fragment → Col → Form.Item → 对应字段控件`。
- **API**：`schema` 可为对象、`null` 或 `undefined`；`namePrefix` 必填，类型为 `(string | number)[]`；`colSpan` 可选，默认 `6`。无输出事件；值通过父级 AntD Form 的 NamePath 提交到 `[..., 'customValues', fieldKey]`。
- **字段规则 / 变体**：只展示 `isActive !== false`、`showInForm === true`、`fieldKind === 'input'` 的字段；排序使用 `displayJson.sortOrder`，不存在时回退 `sortOrder`。数字/小数/金额、布尔、日期/时间、单/多选、长文本/文件/图片及普通文本映射沿用 MES 源实现；只有 `requiredPolicy === 'none'` 时不添加必填规则。无可见字段时返回 `null`。
- **状态矩阵**：默认字段及值由 schema / Form 提供；聚焦、选中、禁用及校验状态由 AntD 控件和父 Form 承担。空 schema 为无输出。加载、请求错误、提交成功/失败不适用，因为本组件不发请求或提交；错误恢复由父表单负责。目录示例覆盖可见字段、空字段和提交。
- **令牌 / 布局 / 响应式**：不定义独立颜色、间距、边框或动画 token；控件遵守宿主 AntD 主题。每个字段按 `colSpan` 放入调用方 `Row`，组件不创建 Row、不设置 gutter 或断点；父级控制有效宽度与窄屏重排。
- **无障碍**：字段标签通过 `Form.Item label` 与控件关联；必填规则由 Form 校验；键盘操作与焦点态由 AntD 控件提供。组件不额外设置 ARIA live region 或覆盖焦点样式。
- **组合 / 数据边界**：必须位于有效 AntD Form 和调用方 Row 内。schema、NamePath 前缀及初值由 MES 宿主传入；Sunxu 不导入 MES 服务、权限码、路由或持久化逻辑。
- **证据**：MES 源文件 SHA-256 为 `f4995364497d5a689c390a93421a9949c198ba963e0aa59ef382c4ae36f3039b`，与盘点时一致；Catalog 有可运行示例。UV 已解锁；真实渲染、窄屏几何、键盘路径与深色主题尚未完成验收，均为 `UNVERIFIED`。

#### `documentLineCustomFieldColumns` helpers 契约

- **职责 / 数据边界**：为 MES 单据行自定义字段复用 schema 显隐、排序、默认宽度、编辑器、列、保存 payload、公式预览投影和汇总规则。所有函数都是纯呈现或数据转换；schema、业务行、API 请求/响应、权限过滤和保存由宿主提供。
- **公开 API / 签名**：导出 `DocumentLineCustomFieldCarrier`、`DocumentLineCustomFieldFormValues`、`DocumentLineCustomFieldRuntimePreviewItem`、`DocumentLineCustomFieldSummary`、`DocumentLineCustomValuePayload`；并导出 `getVisibleDocumentLineCustomFields(schema, displayKey)`、`getDocumentLineCustomFormFields(schema)`、`getDocumentLineCustomFormDisplayFields(schema)`、`resolveDocumentLineCustomFieldWidth(field)`、`sumDocumentLineCustomFieldColumnWidths(schema, displayKey)`、`summarizeDocumentLineCustomFields(rows, schema)`、`toDocumentLineCustomFieldFormValues(value)`、`buildDocumentLineCustomValuePayload(row, schema)`、`buildDocumentLineCustomFieldRuntimePreviewItems(rows, schema)`、`applyDocumentLineCustomFieldRuntimePreview(rows, previewItems)`、`renderDocumentLineCustomFieldEditor(field, value, onChange)`、`createDocumentLineCustomFieldLineColumns(schema)`、`createDocumentLineCustomFieldColumns(schema, options)` 与 `createDocumentLineCustomFieldColumnsForAntd(schema, options)`。继续复用公开 `DocumentLineCustomFieldDefinition`、`DocumentLineCustomFieldSchema`、`MesDocumentLineColumn` 与 `MesDocumentLineRow` 类型。
- **字段 / 列规则**：显隐要求 `isActive !== false` 且对应 `displayJson.showInForm/showInDetail/showInList === true`；排序取 `displayJson.sortOrder`，缺失时回退 `sortOrder ?? 0`。列宽使用正数 `displayJson.listWidth`，否则 long_text=200、date/datetime=168、boolean=96、其他=140。编辑行列展示 input 与 formula；formula 通过 `CustomFieldCell` 只读呈现，保存 payload 只包含启用 input。编辑器沿用 MES number/decimal/money、boolean、date/datetime、select/multi-select、长文本/file/image 和普通 Input 映射；日期读字符串、写 datetime ISO 或 `YYYY-MM-DD`。
- **payload / 预览 / 汇总**：payload 保留所有启用 input 的既有值（包含隐藏 input），过滤停用/公式/过期 key；下游新行未设置的可见空值省略，显式 `null` 保留。Runtime preview 使用 schema `systemFields` 投影记录值，quantity 缺失时读取 qty；`Array.from` 保留稀疏数组的密集顺序，预览结果按数组索引原序回填，缺少结果的行原样返回。汇总公式字段读取 `customComputedValues`，普通字段读取 `customValues`；空值不参加计算，count_non_empty 统计剩余项，数值聚合遇到非法值或没有有效值时返回 `null`，不伪装成 0。
- **列组合 / 无障碍**：AntD 与 ProColumns builders 默认生成 detail 列，可通过 `displayKey`、`prefixTitle`、`getCarrier` 调整展示来源；普通 AntD 列不附加 ProTable 的 search/sorter 配置。编辑器只返回原生 AntD 控件，标签、Form.Item、校验布局和可访问名称由调用方提供；单据行编辑列以 `required` 标记必填，不创建表单或提交。
- **目录证据 / 限制**：`DocumentLineCustomFieldColumnsDemo` 使用本地确定性 schema/行数据，覆盖隐藏值保留、空值省略、显式清空、formula readonly、聚合非法值、`quantity <- qty` 和按行序应用预览；请求、权限与持久化不在演示组件内。Catalog 已在 1440px 和 390px 视口渲染；本批几何/点击证据见迁移记录。真实 MES 路由与宿主 API 接线仍为 `UNVERIFIED`。

#### `DocumentDetailLedgerTable` 组件规格

- **职责 / 层级**：MES 单据明细台账列表外壳；统一同一菜单中的单据/明细切换、筛选表单、个人视图、服务端列表和汇总展示。
- **非目标 / 可见所有者**：不定义具体筛选字段、后端查询契约、导出格式或新增表单；页面提供 `columns`、`buildQuery`、服务 API、导出回调、权限码和新增处理。
- **来源真相 / 组成**：MES `ResizableProTable`、`DocumentLedgerViewSwitch`、`DocumentViewBar`、`DocumentFilterDrawer` 与 `PermissionButton`；能力缺省时导出按钮关闭并明确显示未配置状态。
- **API / 查询**：`initialFilters` 同时用于搜索初值及首屏请求，查询合并初始/个人视图/临时参数与 ProTable 表单值；分页默认 `page=1/pageSize=20`，标量过滤值透传。ProTable 排序字段会规范化关系字段前缀、逗号和点号路径。导出读取表单格式化值，合并临时条件并保留当前或个人视图排序。
- **状态 / 权限**：个人视图控制器由调用方传入，控制视图、排序、列设置、变更保存及筛选；新增通过 `PermissionButton` 由宿主权限判定。导出渲染器接收导出回调、文件名、权限码和标签，宿主负责下载能力。请求仅最新响应更新汇总，避免迟到响应覆盖当前状态。
- **布局 / 交互**：复用 MES `ResizableProTable`，由调用方定义列宽、滚动宽度、表格 footer、行选择和工具栏扩展；筛选复杂时使用固定底栏抽屉，轻筛选保留 ProTable 的 light 模式。
- **证据**：MES 源文件 SHA-256 为 `a3719a086a7a33f71ab8825d4203fb571b9102979f413fb316c1f39b876cb98b`，Catalog 覆盖轻筛选/个人视图、权限、导出、创建、行选择、分页与汇总。UV 暂停期间未做真实目录路由渲染和几何/键盘验收，均为 `UNVERIFIED`。

#### MES 打印布局规格

- **`PrintLayout`**：保留 `title`、`docNo`、`metaLines`、`printDate` 和 `children` 契约；默认日期与打印时间均使用 `zh-CN` 本地化格式。包含 `/logo.png`、右侧元信息、正文和“本文档由 MES 系统生成”页脚，并按源实现渲染 A4 `PRINT_STYLES`。
- **`DotMatrixLayout`**：保留可选 `companyName/docNo/docDate`、必填 `title/children`；缺少编号显示 `—`，缺少日期时使用当前中文日期。只渲染 `.dm-root`、抬头和正文，针打黑白宋体/连续纸样式作为 `DOT_MATRIX_STYLES` 导出，由打印宿主放进 iframe。
- **`LabelLayout`**：保留 ref 与 children，按 `orientation` prop 优先级、宿主 `getOrientation()`、默认横版依次选取 `.horizontal/.vertical` 类。标签纸尺寸偏好仍由 MES 宿主维护；组件不访问 localStorage。`LABEL_STYLES` 保持从源端复制并导出，供打印宿主独立注入。
- **组合 / 边界**：三种布局均为 ref-forwarding 容器，不负责读取单据、调用打印、选择打印机或保存纸张设置。打印样式字符串可从 `sunxu-web/mes` 导入；标签方向通过 `MesUiProvider.labelLayoutCapabilities` 提供，单次展示可用 `orientation` 覆盖。
- **证据**：三个 MES 源文件 SHA-256 分别见迁移账本，Catalog 覆盖标题元数据、A4 表格、针打表格和标签横/竖版切换。UV 暂停期间没有真实打印 iframe/页面几何和打印设备验收，均为 `UNVERIFIED`。

#### `AccountingCrudPage` 组件规格

- **职责 / 层级**：MES 会计基础资料共用 CRUD 列表；调用方传入实体列和表单字段，组件统一承载服务端查询、新增与编辑流程。
- **查询 / 数据**：默认按 ProTable 当前页、每页 20 条、当前排序及标量筛选组装服务请求；`listParamMapper` 覆盖业务查询字段。响应映射 `list/total`，失败遵循请求 Promise 拒绝行为。服务由宿主提供 `list/create/update`。
- **状态 / 权限**：`canManage` 决定操作列“编辑”链接是否出现；工具栏新增仍经 `PermissionButton` 校验 `managePermission`。成功创建/更新后分别提示“已创建/已更新”、刷新当前列表并关闭 ModalForm。表单销毁后重开，初值为记录或 `createInitial`。
- **布局 / 交互**：复用 `ResizableProTable`，默认横向滚动 1200px、fit container height；分页设置可由调用方传入以保留 MES 全局记忆策略。ModalForm 宽 640px，提交值可由 `submitValueMapper(values, record)` 规范化。
- **边界**：服务、授权结果、分页策略、列定义、字段和业务值映射均由页面提供；组件不导入会计 API、MES 权限模块或字段帮助配置。`entityLabel` 保留源端兼容参数，界面动作统一显示“新增/编辑”。
- **证据**：MES 源 SHA-256 为 `81b6d6829fc63cfb08f77efaa3b0deb57484241e2c83cb9ac12deea1381dea2c`；Catalog 覆盖搜索、分页、创建/编辑、表单校验和只读/可维护切换。由于当前 UV 暂停，真实路由、视口几何和键盘/主题验收为 `UNVERIFIED`。

#### `CustomFieldValuePanel` 组件规格

- **职责 / 层级**：显示单个 MES 对象的自定义详情字段、公式结果和计算错误；可编辑时打开 DrawerForm 编辑可输入字段。
- **查询 / 展示**：并发请求 schema 与对象值；详情只筛 `displayJson.showInDetail=true`，输入表单只筛 `fieldKind=input` 且 `showInForm=true`。公式值读取 `customComputedValues`，普通字段读取 `customValues`；保留布尔 Tag、选项 label、多选、日期/日期时间本地格式、空值占位和公式异常 tooltip/ARIA 标签。
- **状态 / 保存**：无对象 ID 时不渲染；切换对象后请求序号丢弃迟到响应。保留 loading、错误、无字段/无可见字段空态、`showEmpty`、`emptyExtra` 和 display state 回调。编辑按钮仅在 `editable`、存在可输入字段且宿主配置 `saveValues` 时出现。保存时携带 schema 版本，并保留当前 schema 下所有输入字段已有值与表单值，成功后关闭并刷新详情。
- **表单字段**：number/decimal、boolean、date、datetime、select/multi-select、long text/file/image 和普通文本；必填遵循 `create/update` 规则，保留 min/max/maxLength 验证。
- **边界**：`MesUiProvider.customFieldFormCapabilities` 提供 schema/value 请求、保存与错误文案。组件不读 MES API、Umi 权限或路由；没有保存能力时仍可查看，不提供编辑入口。
- **证据**：基于当前 MES `CustomFieldValuePanel.tsx` 的显示、抽屉和保存行为；Catalog 覆盖有字段、空字段、加载错误、只读/可编辑和保存。UV 暂停期间真实路由、视口几何和键盘/主题验收为 `UNVERIFIED`。

#### `FormulaDesigner` 组件规格

- **职责 / 层级**：在自定义字段表单中编辑公式表达式，查看系统/自定义字段、可用函数和运算符；父级表单拥有表达式字段和最终保存。
- **目录 / 预览**：按对象类型请求字段 schema，支持搜索、字段/函数/运算符插入和样例数据编辑；预览展示结果、依赖字段、标准化/可读表达式与服务端类型诊断。公式计算和错误文案由 `FormulaDesignerCapabilities` 注入。
- **状态 / 权限**：保留 schema 与预览 loading/error 状态、当前字段不能自引用、公式字段等不可引用候选及只读权限；只读时仍可检查目录和公式预览，不提交保存。
- **边界**：`getExpression/setExpression` 与宿主表单字段绑定；组件不保存自定义字段、不调用 MES API/权限模块。`FormulaDesignerDemo` 通过本地 schema 与确定性预览展示编辑、预览和只读切换。
- **证据**：来源 `FormulaDesigner.tsx` SHA-256：`b4c4dc318febd2e1e42447a5773bc0cde6d331908601b3306a2251043006f9d0`。真实 schema/计算服务、路由、视口几何、键盘和读屏验收为 `UNVERIFIED`。

#### `ApprovalPanel` 组件规格

- **职责 / 层级**：在业务详情中显示审批状态、当前步骤、处理意见时间线和审批动作；审批流未配置或宿主实体已不在可提交前置态时按 MES 规则隐藏。
- **状态 / 权限**：保留 `none/pending_approval/approved/rejected/cancelled` 状态、`draft/submitted` 前置态判断、待提交/无提交权限提示、提交动作、仅提交人撤回、全局审批处理权限与当前节点双重限制、驳回原因必填、重置/撤回/提交确认。
- **数据 / 请求**：加载状态通过请求序号隔离迟到响应；动作成功后显示源端提示、刷新审批状态并回调 `onStatusChange`。`onDataChange` 只接收当前实体最新状态。
- **边界**：`MesUiProvider.approvalCapabilities` 注入实体级权限判定、全局审批处理判定、状态查询、提交/撤回/重置/处理 API；Sunxu 不导入 Umi、权限常量或 MES API。
- **证据**：MES 源 SHA-256 记于覆盖账本；Catalog 覆盖待提交、审批中、驳回、通过、终止和可操作/只读切换。UV 暂停期间真实路由、视口几何及键盘/主题验收为 `UNVERIFIED`。

#### `BomCostSnapshotEditor` 组件规格

- **职责 / 层级**：展示并调整当前单据 BOM 成本快照或库存快照；业务规则和服务端二次校验仍由 BOM API 执行。
- **API / 状态**：保留 `bomHeaderId`、`productQty`、`asOfDate`、`variant=cost|inventory`、受控 `value/onChange`。BOM ID 变化或刷新时请求服务端预览；缺少 BOM ID 时清空快照。成本与库存模式显示不同列/摘要，库存模式统计未删除行缺料数量。
- **交互 / 行能力**：仅服务端 `lineCapabilities` 允许时开放需求量调整、删除、批准替代料切换。删除行可恢复；保留调整原因失焦保存、供应商价候选优先/默认/等级标签、多候选人工选择提示、缺价说明、成本合计和警告。每次改配以更新后快照再次请求服务端预览。
- **边界**：`MesUiProvider.bomCostSnapshotCapabilities` 提供 `requestCostPreview` 和物料单位标签；组件不访问 BOM API、字典 hook 或 MES 页面权限。替代料选择复用 Sunxu `MaterialFilteredSelect`。
- **证据**：MES 源 SHA-256 为 `d59d443b9e79d2b5e2d5573792a1fff3e61f713e7846d99464a4fa7e5cc54d82`；Catalog 覆盖成本/库存模式、缺料、价格选择和行改配。UV 暂停期间真实路由、页面几何和键盘/主题验收为 `UNVERIFIED`。

#### `ImportDrawer` 组件规格

- **职责 / 层级**：通用 Excel 导入抽屉，提供模板下载、文件选择、Base64 提交、结果统计和错误明细。
- **状态 / 交互**：保持 `upload/importing/result` 三阶段；关闭会清空文件和结果，结果页“继续导入”重置回上传。开始导入仅在有文件时可用；失败回到上传并显示错误。模板下载显示 loading，成功提示开始下载，下载失败保留错误文案。
- **结果契约**：保留新建/更新/跳过/错误计数及物料档案、系列新建/更新/复用统计；有创建或更新时调用 `onSuccess`，单纯跳过/错误不会刷新。
- **边界**：`downloadTemplateFn` 与 `importFn(base64)` 由调用方提供；Sunxu 负责 FileReader 与通用浏览器文件下载，不调用 MES API。保留文件类型 `.xlsx/.xls`、`maxRows`、tips 与结果错误滚动区。
- **证据**：MES 源 SHA-256 为 `6ce3bf1b8adaf23e578c5829be3eac310071f6040c9d267c742e262130468d7c`；Catalog 覆盖成功/部分失败/请求错误场景与导入回调。UV 暂停期间真实目录路由、视口几何和键盘/主题验收为 `UNVERIFIED`。

#### `ImportWorkbenchDrawer` 组件规格

- **职责 / 层级**：MES 快速导入工作台；支持单目标与多目标模式，按宿主权限过滤目标，并提供模板下载、Excel 预览、确认导入与逐行诊断。
- **状态 / 交互**：抽屉开关时初始化首个可用目标并重置文件、预览、行和警告策略；切换目标时清空当前预览。保留模板下载、预览、执行各自的 loading，预览失败经宿主请求拦截器反馈，成功后显示汇总及最多 100 条诊断行；执行返回 errors 时保留抽屉并展示错误，否则提示导入行数、调用 `onSuccess` 并关闭。
- **警告策略 / 数据**：目标可分别设置 `allowWarningsByDefault`；用户可以勾选允许警告行导入。预览优先使用响应内 rows，没有 rows 但有 jobId 时再请求第一页 100 行；行错误和警告兼容数组字段与 JSON 字段。
- **边界**：`MesUiProvider.importWorkbenchCapabilities` 注入模板、预览、诊断行及执行服务；权限布尔结果由 `MesUiProvider.hasPermission` 提供。组件不依赖 Umi、MES 请求模块或权限 API。
- **证据**：MES 源 SHA-256 为 `b0fd04fe287fe3fc5a34ef90ea85a6594afc2b53e7b22632012eddb0ba51bf20`；Catalog 展示多目标、权限过滤、警告行和诊断行。UV 暂停期间真实目录路由、视口几何和键盘/主题验收为 `UNVERIFIED`。

#### `BomImportWorkbenchDrawer` 组件规格

- **职责 / 层级**：BOM 专属导入抽屉。通用 `ImportWorkbenchDrawer` 不包含 BOM 映射方案选择、映射后数据列和待建物料候选确认/忽略，因此此组件保留这些领域交互，并固定请求目标为 `bom`。
- **映射 / 预览**：抽屉打开时读取启用的 BOM 映射方案，默认选择默认方案或首个方案；支持按当前方案下载模板和上传 Excel 预览。优先显示预览响应中的行，没有行但有任务 ID 时读取首 100 行；保留源行、映射 JSON、状态、错误及警告明细和汇总，允许配置是否导入警告行。
- **候选 / 执行**：预览产生任务 ID 后读取首 100 条待建料候选；支持选择候选后批量确认建料（基础类型、物料类型、分类、采购类型、备注）或忽略，并在操作后刷新候选。只有预览任务存在时可执行导入；执行错误保留工作台并提示，成功回传 `onSuccess` 并关闭。
- **边界**：`BomImportWorkbenchCapabilities` 注入映射方案、模板、预览、行诊断、候选读取/确认/忽略、执行、单位和状态标签、物料选项、字段帮助及消息；组件不读取 MES API、字典 hook 或权限常量。文件读取和通用 Blob 下载留在 Sunxu。
- **证据**：MES 源 SHA-256 为 `1ac565f675d9ebb69adaa3bb2e034e7135bc0dd55ccfd1527553a1c1a83b5697`；目录示例为 `BomImportWorkbenchDrawerDemo`。真实 MES 路由、视口几何、键盘和主题验收因 UV 暂停保持 `UNVERIFIED`。

#### `AllowedEquipmentPriorityField` 组件规格

- **职责 / 层级**：在工序表单中维护允许参与排产的设备范围、优先级、设备默认单件工时和按班次覆盖的工时。
- **状态 / 交互**：允许设备为空时表示按设备类型/工作中心匹配全范围；有设备时按用户排序优先级参与排程。设备选择弹窗保留分页搜索、工作中心及下级设备过滤、多页选中、确认后去重；删除允许设备时同步清理其班次工时配置。已配置设备详情失败时提示并保留移除能力。
- **工时规则**：默认设备工时和班次工时均按分钟/件输入，精度 4 位；班次值覆盖设备默认值，设备默认值为空时继承工序默认值。班次不得重复配置；班次列表分页全量加载，空余班次可新增，已有配置可改班次或删除。
- **边界**：设备与班次列表、设备详情、设备类型字典标签和 MES 记忆分页配置由 `MesUiProvider.allowedEquipmentPriorityCapabilities` 提供；设备范围和工时仍写入当前 AntD 表单字段 `value` 与 `equipmentTimeProfiles`。
- **证据**：MES 源 SHA-256 为 `7e068d2c25047e24820ea3a313e9dd500014fa24c6cc847e66f51899efee75ef`；Catalog 展示设备候选、优先级和班次配置。UV 暂停期间真实目录路由、视口几何和键盘/主题验收为 `UNVERIFIED`。

#### 生产排程工作流组件

- **自动/计划排产**：`AutoScheduleDrawer` 保留排产算法、方向、派工规则与缓冲策略，候选工单分页搜索、预览/结果、工序安排和 BOM 外协摘要；`ScheduleFromPlansDrawer` 保留计划/工单树、筛选、已排状态、委外行、结果和刷新回调。策略、查询/预览/提交 API、权限、状态标签和错误消息由宿主注入。
- **分析/方案**：`BottleneckPanel` 保留日期范围、瓶颈计划/实际工时与利用率；`ScenarioCompare` 保留方案指标比较、当前基线、风险/改进量、选择并采纳回调。方案组件维持 MES 请求契约，不额外提交仅用于展示的 `bufferRatio`。
- **手工排程/台账**：`EntryFormDrawer` 保留工单扫码/选择、工序、资源、日期、班次、设备与工作中心联动、加载/验证和提交回调；`EntryList` 保留搜索/状态筛选、服务端分页/排序、复制/编辑/删除/批量状态动作及确认。工单/工序/资源/班次请求、状态与权限、字段帮助、消息、删除确认、刷新和路由由宿主注入。
- **甘特**：`ProductionScheduleGanttView` 与现有 `ProductionSchedulePlanningWidgets`、`ScheduleGanttWidgets` 组合，保留时间窗口/缩放/下钻、热力/产能、条目拖拽/缩放/选择、资源泳道、待排项拖入、上下文动作与阻止行告警；跨资源拖拽按最终资源分别提交，清空设备时保留合法空资源状态。待排产面板位置、容量条位置及右键选中行为可由宿主配置。甘特数据、日期计算、资源/状态呈现、权限动作、路由与拖拽提交由宿主注入。
- **来源证据**：7 个源文件 SHA-256：AutoScheduleDrawer `08941101d38bff06dc7328c25b226865b4e8165e8809fb9996870b64122a93c8`；BottleneckPanel `de6e647cd338866ea5323c1da7aa80c39de42aeefc9a385420756d3f1445d3fa`；EntryFormDrawer `a46a491d26461ce576df623c63565fcbc3db3c0f485b506c4d25f56690bafbd2`；EntryList `9a529de6083995d161179bb318f0a6be6162daf9063a1f5948be2d3d179bb284`；ScenarioCompare `6ab0eec2a4f0daaa3c4a0393c7315f7d43655871e4492b7fe84837f63bab7047`；ScheduleFromPlansDrawer `b7b4ae680ae2a67c2e47ddf84985defb2e54e35699aecd799931e2fb96513437`；GanttView `b5b628b32bcf2a75e1a115222565fc24111e4d0f3113f03eea81a32fbd2e2e16`。Catalog `ProductionScheduleWorkflowsDemo` 以七个标签页和本地 capabilities 展示工作流；真实 MES 路由、API/权限接线和视口验收因 UV 暂停保持 `UNVERIFIED`。

#### `ProductionShiftCalendar` 班次与例外日历

- 班次表单保留归属范围、班次名称/类型、计薪系数、工作日、开始/结束时间、跨天、休息时段、生效日期和启用状态；结束日期早于开始日期时阻止提交。工作中心/供应商切换及空值序列化沿用 MES 行为。
- 例外表单保留固定节假日/维护/加班类型、单日或日期范围、全天/时段及班次关联；日期顺序、必填日期/时间和非全天时段校验不变。班次和例外列表都保留服务端筛选/分页、刷新、授权创建/编辑/删除、删除确认与变更记录入口。
- `ProductionShiftCalendarCapabilities` 注入读写 API、归属/班次选项、权限、字段帮助、消息、删除确认和历史查询；UI 不访问 MES API 或权限码。`shiftPermissions` 与 `exceptionPermissions` 分别控制两张表的新增、编辑、删除和历史入口；未提供时兼容使用 `permissions`。非全天例外的开始/结束时间必填消息可分别通过 `messages.exceptionStartTimeRequired` 与 `messages.exceptionEndTimeRequired` 覆盖；未提供时沿用 `messages.allDayTimeRequired`。Catalog 的 `ProductionShiftCalendarComponentsDemo` 使用本地确定性数据。
- 五个源文件 SHA-256：日历 `274ea16f10ed7b30152f6c4bf21752808b9a60efe65ae44a26e423c47418d163`、班次表单 `888ef4738315e6d45de2027e3977c7778cfb226bd54b8bfa873fd234aaea32b2`、班次列表 `c832820b47e7367af04be59f6c8aea480ab765e5470b857c8eabb05cc7ebad54`、例外表单 `dd7ab48d0d3843f855197bf2a8c833c7dacafcf987a28e207a74b865add19ce7`、例外列表 `0dfe53bf40ebca8eab167d63a9612312f018aae11c05c07e143055463c1ac715`。真实 API/权限接线和浏览器视口验收为 `UNVERIFIED`。

#### MES 首页快捷入口与工单生产组件

- `DashboardShortcutConfigModal` 打开时读取固定入口偏好和自定义入口；读取失败可重试。保留按业务模块排序、固定入口显隐、不可访问状态提示、自定义入口新增/编辑/确认删除、最多 20 个自定义项，以及名称/模块/平台/HTTP(S) URL 校验。显隐、排序和增删改成功后立即保存并回写偏好；入口目录、访问权限结果、读写服务和通知由宿主注入。Modal 在窄视口使用视口内宽度并限制正文高度。源文件 SHA-256：`c389ddb6c9fce449cf0bd472cf62c050524755015e0de864e0d03e4bd23117dc`。
- `WorkOrderBatchReportModal` 仅呈现可批量报工工序，按前置依赖排序；保留外协/跳过/无剩余量/质检阻断/非产出/需工时会话等过滤、上下游转移批量与合格数量门槛、报工人/排班/设备/时间/完成量/报废量/原因/备注、报废照片与现场照片上传，以及部分成功/失败结果。工单与工序、候选请求、照片上传、批量提交、字段帮助和反馈由 `WorkOrderBatchReportCapabilities` 注入。源文件 SHA-256：`b09a10d2d73b56aebbcc6b7381c466f3542f52adbc5503a988c787fe368604cd`。
- `WorkOrderMaterialShortageSection` 保留 BOM/物料就绪检查、需求行数量调整/删除、供料来源解算/按行覆盖、生产计划关联/创建、补料及退回单创建、执行/取消/冲正、分页供料记录与打印动作。权限结果、库存/工单/计划/供料/打印服务、选项字典、单位和数量格式、自定义字段、表单帮助与错误反馈由 `MaterialShortageCapabilities` 注入；宿主仍需提供 BOM 选择与单据自定义字段能力。源文件 SHA-256：`0b836a865d3355c6638e620ec9e3226b39e3e17469d161675232f9e035e154d0`。
- `WorkOrderTemporaryReportQrPrint` 是非 JSX UI helper：保留工序/工单状态打印资格、临时报工门户 URL fallback、动态文字转义、每张 A4 六个标签分页、有效期与打印窗口流程。门户 origin、二维码 SVG renderer、日期格式和窗口策略由宿主注入；该来源不是 JSX import 组件，因此在覆盖账本的 `supplemental_page_local_ui_helpers` 单独登记，不计入 627/237 组件引用。源文件 SHA-256：`3927f816c1b0d728d4a5eba0798c63757121a91bbf6cc7b4a2be37f667b34587`。
- `DashboardShortcutConfigModalDemo` 与 `WorkOrderProductionComponentsDemo` 已接入 Catalog 并使用确定性宿主能力。以上迁移的真实 MES API/权限接线、浏览器页面/打印窗口、键盘交互和视口几何受 UV 暂停影响，均为 `UNVERIFIED`。

#### 外协订单台账与进度抽屉

- `OutsourcingOrderDetailLedger` 保留多状态筛选、排序/分页/导出参数校验、个人视图与保存视图、汇总、全部来源列、状态/权限导航以及投入/收货行自定义字段显隐门控；批量打印按来源行映射不同外协业务类型。查询、权限结果、字典格式、下载、打印与视图控制器由 `OutsourcingOrderDetailLedgerCapabilities` 注入。
- `OutsourcingProgressDrawer` 打开时并行加载工序步骤和首 100 条进度记录，并展示当前二维码。步骤支持增删、名称/数量上限校验，计划量不得低于已上报量；保存后刷新步骤/记录/二维码。重生成二维码前保留旧码失效确认；进度记录保留步骤、加工数量、合格/缺陷量、来源、提交人和时间。空态与只读权限仍可查看历史。
- 台账服务、步骤/进度/二维码服务、权限结果、二维码 URL/renderer、日期格式、打印能力和成功反馈均由宿主注入。`OutsourcingComponentsDemo` 使用确定性数据覆盖视图/筛选、批量打印映射、步骤维护和二维码。台账/抽屉来源 SHA-256 分别为 `3d8cad75b57cffd2f4db8f6f715e29d48f0016d9c777a10941561de236785cd5`、`a07690a8655eb87024e96650a5a5a6aa7b619e63b06ac4e5e51982a44452dfe4`；真实宿主、浏览器及视口验收为 `UNVERIFIED`。

#### `CustomerQuickCreateDrawer` / `CustomerFormFields` 与 `SupplierQuickCreateDrawer` / `SupplierFormFields`

- **职责 / 层级**：在客户/供应商选择器中创建主数据；Sunxu MES 套件承载字段表单、抽屉生命周期、校验与创建成功后的选择值适配。
- **字段 / 校验**：客户保留名称必填、邮箱格式、简称/联系人/电话/邮箱/微信/企业微信/飞书、等级/行业/收款条件字典、销售员远程搜索与当前值回显、非负两位信用额度、地址及备注。供应商保留名称必填、邮箱格式、简称/联系人/电话/邮箱、评级/供应品类/付款条件字典、采购员搜索与回显、非负整数交货天数、地址及备注。
- **提交 / 状态**：提交失败保持抽屉打开；请求层已处理的业务/HTTP 错误不重复弹 toast，其他客户端异常显示错误；字段校验失败提示数量且保留字段内联错误；成功回传实体 ID/名称，客户另回传销售员 ID 和收款条件，再显示成功消息并关闭。
- **边界**：MES 创建请求、字典下拉实现、用户候选、字段帮助文案和配置入口由 `MesUiProvider.masterDataQuickCreateCapabilities.forms` 注入；表单字段值、名称和校验规则由 Sunxu MES 组件统一维护。
- **证据**：客户源 SHA-256 为 `7cef4989aef55b5342d6d8b15e2d8b973d65fa949dce2b2b82a3397dddacbad2`；供应商源 SHA-256 为 `604dd2be3cb7344a423958bde5d82ce0991e12c272ad019c13321f6b4e385ccb`。Catalog 展示两类表单和创建回调；UV 暂停期间真实目录路由、视口几何和键盘/主题验收为 `UNVERIFIED`。

#### 自定义字段展示与物料列表列适配

- `CustomFieldCell` 优先显示计算异常原因，其次用计算值回退原始值；布尔、单选、多选、日期和日期时间格式统一，空值为 `-`，异常展示带 Tooltip 的告警文案。
- `materialCustomFieldColumns` 仅显示启用且配置为列表可见的字段，按显示排序排序并按配置宽度生成只读 ProColumns 或明细行列；选项 label、计算字段和错误回退共用 CustomFieldCell。
- `useDocumentCustomFieldDetailVisibility` 在启用且对象类型有效时请求 schema，只有含启用详情字段才展示展开入口；禁用/对象切换时隐藏，组件卸载或参数变化后忽略迟到响应。schema 请求使用 `MesUiProvider.customFieldFormCapabilities.requestFormSchema`。

#### `DocumentBomOpenButton` 组件规格

- **职责 / 层级**：以链接按钮打开当前单据 BOM；无单据 ID 或宿主无查看权限时显示 `—`。
- **交互 / 权限**：保留“查看单据 BOM”默认文案、按钮属性覆盖及 `initialEdit` / `initialImport` 快捷入口；快捷入口无更新权限时降级为只读文案并清除编辑/导入意图，且保留文件图标。可编辑能力只在 `editable` 与更新权限同时满足时传入抽屉。
- **边界**：Sunxu MES 套件提供查看/编辑/导入抽屉、层级明细、排除/恢复、路线、单位、自定义字段、粘贴与 Excel 导入、校验和两阶段保存交互。宿主通过 `MesUiProvider.documentBomOpenCapabilities` 注入权限、API、字典、字段 schema、路线策略、文件和物料选择器；`searchMaterials` 用于导入匹配，`searchSelectableMaterials` 用于仅展示启用物料的人工选择，保持两条业务路径的筛选口径；宿主也可暂时提供旧式 `renderDrawer` 适配器。
- **证据**：MES 源 SHA-256 为 `fe7024f884b319177797c329b9c80d962e49455db42e074f790163dbefebf2fe`；组件类型检查与库/目录构建通过，Catalog 接入完整抽屉与只读权限状态。真实 MES 路由和浏览器视觉验收为 `UNVERIFIED`。

#### 单据 Modal 样式适配

- `mergeMesDocumentModalStyles` 合并调用方语义槽与 MES 单据表单默认样式，支持工作区/视口 overlay、公式工作台和带内边距的表单 body；`mergeMesDocumentModalPanelStyle` 将全屏尺寸落在对话框面板并保留调用方覆盖。
- 完整宽度 `DocumentModalForm` 的 Pro 包装层、内部表单布局和 Modal 语义插槽共同参与高度分配；表单 body 自己滚动，视口层使用 `100dvh`。
- **边界**：样式只定义布局；业务字段、公式 schema、保存状态和路由由 MES 宿主控制。未运行浏览器验收，视口和嵌套 keep-alive 几何为 `UNVERIFIED`。

#### `DocumentViewSortModal` 组件规格

- **职责 / 状态**：以 Modal 展示保存视图顺序；打开或视图数组变化时重新初始化草稿顺序，取消不修改宿主数据。
- **交互**：保留 PointerSensor（移动阈值 4px）和键盘传感器，使用垂直列表策略与最近中心碰撞检测；只有至少两个视图时可保存。提交返回 `true` 才关闭，`false` 时保留弹层与草稿；loading 状态由宿主传入。
- **边界**：组件只管理重排草稿和拖动交互；视图权限、持久化、请求和错误由宿主 `onSubmit(ids)` 负责。目标包将 `@dnd-kit/core`、`@dnd-kit/sortable` 和 `@dnd-kit/utilities` 声明为 peer dependencies。
- **证据**：MES 源 SHA-256 为 `baa11731acb1bd7fb86c813ef8e1f24bc0758e16e5a242c807c6902effc58484`；Catalog 展示重排与保存回调。UV 暂停期间真实路由、窄视口和键盘拖拽验收为 `UNVERIFIED`。

#### MES 标签模板

- **模板字段**：物料标签显示名称、编码、可选规格、字典单位和物料条码（无条码时回退编码）；批次标签显示批号、可选物料/供应商/生产日期/有效期；设备标签显示名称、编码、可选型号/工作中心；包装单元显示包装号、可选产品/编码/批次/数量单位/包装类型/仓库；工装显示名称、编码、可选类型/规格；工单显示工单号、可选产品/编码/数量单位。
- **条码 / 格式**：所有二维码尺寸 48、容错级别 M；工单 QR 值按 `work_order` 与 ID 由 MES 宿主编码。包装和工单数量最多显示 4 位小数；物料单位用宿主传入字典标签。
- **边界**：组件只布局标签内容；`renderBarcode`、`unitLabelMap` 和工单 `buildQrValue` 由宿主注入。`LabelLayout` 的打印纸张方向仍由 `MesUiProvider.labelLayoutCapabilities` 决定。
- **证据**：六个 MES 标签模板源码分别迁入 `src/mes/components/LabelTemplates.tsx`。Catalog 展示模板字段与宿主 adapter 插槽；UV 暂停期间打印机/纸张真实预览为 `UNVERIFIED`。

#### MES 打印 Hooks

- **`usePrint`**：返回 `contentRef` 与 `handlePrint`，使用 A4、10mm 页边距和调用方提供的文档标题。
- **`useDotMatrixPrint`**：返回打印 ref/回调；保留 241×140、241×93、241×279、190×140、210×140mm 预设，自定义纸张尺寸、本地公司抬头设置，并在打印 iframe 使用连续纸专属样式。
- **`useLabelPrint`**：返回打印 ref/回调；保留横/竖版标签纸预设、自定义宽高、本地纸型设置、自动方向和标签专属打印样式。
- **依赖 / 边界**：三个 Hook 使用 `react-to-print` peer dependency；纸型/公司抬头偏好使用 MES 约定的 localStorage key。打印模板数据、浏览器打印目标和打印操作由宿主控制。
- **证据**：对应 MES 源文件及 `LabelTemplates/index.ts` 汇总出口已迁入 `src/mes`。UV 暂停期间浏览器打印预览和实际标签机输出为 `UNVERIFIED`。

#### MES 打印动作与记录

- **`PrintAction`**：保留模板/纸型设置加载、份数上限、提交并发保护、批量逐项创建与失败重试、打印预览、纸张尺寸、打印确认和可选 PDF 下载。
- **`PrintRecordsAction`**：保留打印历史列表、详情请求竞态隔离、预览、补打原因必填/字数限制和授权补打。
- **宿主能力**：`PrintJobActionsProvider` 接收打印选项和记录 API、权限结果、状态判断与文案、文件名策略、HTML 净化、消息和刷新回调；MES 请求、权限码和文件命名规则不写入 Sunxu。
- **安全与限制**：预览 iframe 使用 sandbox，进入预览/打印前必须经过宿主 HTML 净化。Catalog 使用确定性 mock 能力；真实 MES 接口、PDF 文件、打印窗口和打印机输出未验收，当前均为 `UNVERIFIED`。

#### MES 单据打印模板

- **模板**：送货单针打、送货单 A4、质检报告、领料单、工序流转卡、采购订单针打、采购订单 A4、采购入库单、销售订单和生产工单。
- **保留内容**：各模板的来源字段、单据与关联信息、明细表、数量/金额汇总、二维码位置、备注和签字区域；针打版继续使用 `DotMatrixLayout`，A4 版继续使用 `PrintLayout`。
- **宿主能力**：二维码绘制与内部二维码载荷、单位/质量/单据/工序/付款条件文案、金额脱敏和可选公司抬头由模板 props 提供；组件不访问 MES API、权限或路由。
- **目录和证据**：`BusinessPrintTemplatesDemo` 覆盖 10 种模板及确定性宿主 adapters。因当前 UV 暂停，真实打印视口、浏览器打印预览与打印设备输出为 `UNVERIFIED`。

#### MES 打印选项适配器

- 保留四类模板类型的固定标签和业务支持范围筛选；业务选项过滤停用业务并显示“业务名称（业务类型）”；模板选项显示默认标记与当前版本；纸型选项显示毫米尺寸和默认标记。
- 已发布模板、打印业务场景和纸型服务均由 `MesPrintOptionsCapabilities` 提供；分页上限也由宿主传入。适配器只负责过滤/映射与请求参数，不包含 MES URL 或请求客户端。

### 打印模板字段与盘点明细组件

- `TemplateFieldSelector` 的 `value/onChange` 为受控字段路径；`businessType/templateType/layoutPreset/disabled` 决定字段候选与可编辑状态。宿主 `capabilities.loadFields({businessType,templateType})` 提供 MES 字段；枚举值、条码字段、偏好字段列表、默认数量上限和代码版式规则均由宿主提供。组件保留不可见/数组/条码过滤、必选项锁定、序列号模板默认字段、优先字段与数量上限、分组搜索和 `@dnd-kit` 拖拽排序。源文件 SHA-256：`e9f2e04937971025227bb40727f3dab8363dd809960126a35c8de43d1cd38536`。
- `TemplateLayoutPresetSelect` 保留必填 ProForm.Item `layoutPreset`、响应式单选卡片和全部 12 种内联 SVG 图示；调用方按模板类型筛选 `options` 并映射真实模板值到对应 thumbnail。`formItemProps` 承载 MES 字段帮助，`rules` 可覆写默认必填校验。来源 SHA-256：`2e661e65dc2bfd084bdad07bea95fe4868239c3e3c647ee4398e13d650905e80`。
- `GridPrintDesigner` 保留 MES 网格设计画布、八类模板预设、v2/v3 schema 归一化、旧 detail schema 迁移、单元格/明细 band 编辑、合并/拖动/缩放/撤销重做、沉浸编辑、纸宽辅助线和草稿预览。字段权限过滤和字段/样例数据、纸张参数、预览动作由宿主提供；保存、发布、实际打印和路由继续由宿主控制。`dataSource` 引用应稳定，避免父级重渲染触发重复加载。来源组件 SHA-256：`bd641249aa0aa247a4f1a3363d1f8831a295a62b2e8458daf68fd5018a090b02`；factory：`6f43164a29088b7fe6127d51313cdb33dcb4f2bac63e7353b78acbcd9d92e708`；schema：`71753ff5bcbfdf6916e4d191c37d0efaf234b9aa3fe0ecfaceaa8062207e790b`。Catalog 示例已接入；浏览器视觉验收为 `UNVERIFIED`。
- `TemplatePrintComponentsDemo` 在 Catalog 中切换标签、单据和连续纸类型，覆盖字段搜索/锁定/默认值，以及宿主映射的版式和 12 个预览图。真实模板 API/保存接线、浏览器渲染与视口验收为 `UNVERIFIED`。
- `StockCountLineFormList` 现在从传入 Form 实例内部 `Form.useWatch('lines')` 读取行数据，与当前 MES 源实现一致；调用方不再向组件重复传递 `lines` 快照。其余 props 提供自定义字段 schema、仓库/库位状态、最小行数和 capability。保留物料表格选择/批量加入、空行判定、客户/供应商货主字段、货主和物料切换后的引用清空、仓位候选、批次及自定义字段、配置页返回刷新。来源文件 SHA-256（包含当前源工作区改动）：`283c6383c79ed0220792dc2c6bcb1fac98e0c9a71d49549f196941951837ae57`。目录示例也已改为依赖组件内部观察。
- `CreateStockCountModal` 保留仓库/仓位、盘点方式/日期/备注、手工明细、动态行自定义字段、创建 payload 映射及成功回调；warehouse/location 字段、默认日期/方式、payload builder、创建 API、权限与提示由宿主提供。
- `StockCountDetailDrawer` 保留明盘/盲盘账面字段显隐、计数状态和动作授权、行自定义字段、明细维护、实盘数量/备注批量设置，以及提交、审核过账、冲正、取消的校验和确认流程；业务服务、日期字段、状态/货主文案、单位和权限由宿主提供。组件需要与 `StockCountLineFormList` 一起使用，且宿主在 `MesUiProvider` 注入物料选择器能力。
- `StockCountDetailLedger` 保留关键词/盘点单号/物料/仓库/仓位/批号/日期筛选，仓位筛选权限门控、多选状态与默认“已审核”、动态明细/物料字段、物料/数量/单号/状态/仓库/仓位/时间列、详情跳转、服务端分页/排序、当前视图导出、保存视图、批量打印插槽和六项汇总。列表/导出请求、权限结果、远程选择器、动态字段列、保存视图 controller、批量打印 props、导出/新建权限码和格式由 MES 宿主注入。源 SHA-256：`f9678041e3063aed4f90ca08594cd88fffccd14bf08391013004eac7f1426f13`。Catalog 使用本地确定性响应；真实 API/权限接线和浏览器视口验收为 `UNVERIFIED`。
- `PurchaseInquiryDetailLedger` 保留关键词、询价单号、供应商、物料/临时代码、日期与多状态筛选，物料回退、行/物料动态列、五项汇总、详情权限门控、导出/新建、批量打印和默认排序。`PurchaseRequisitionDetailLedger` 保留宿主 URL 初始状态、数量汇总、缺失到货日期提示、申请单导航、权限感知行菜单和采购订单查看回调。`InternalIssueDetailLedger` 保留筛选、物料/动态列、汇总、权限门控详情、视图切换、导出/新建和批量打印。`ProductionReceiptDetailLedger` 保留物料/仓库/远程仓位/批号/包装/日期/状态筛选、动态列、多维汇总、未知状态提示、详情、导出和批量打印。四者均以 `DocumentDetailLedgerTable` 复用列表请求/错误状态；请求、导出、授权结果、候选选择器、字典、格式、动态列、保存视图、打印和导航由宿主 capability 注入。宿主还需通过 `MesUiProvider.documentDetailLedgerCapabilities.pagination` 提供 MES `DEFAULT_PAGINATION` 等价配置，保留记忆页长与页数选项。源 SHA-256：询价 `df2ae1714e38903d8e4777af9fc583ec95c05dededd7caa07c75a1723f2a69ca`；申请 `29980efbb5d4635584a6bc15af0f4688808dc9725494223bbf29ec41b3e6d080`；内部领用 `edae6a5116aa40c72566356ddef0e596eea82aae5d5cd73321e9d06a7e002cd8`；生产入库 `a1ca16b7c769b0a8e728b06e3cbe59dcee191d2a61883706c58242e42acb9837`。Catalog 以本地 capabilities 演示；真实服务/权限接线和视觉验收为 `UNVERIFIED`。
- `StockTransferDetailLedger` 保留已发生调拨只读明细、调出/调入仓库/批号/日期筛选、服务端排序、导出入口和父级单据/明细视图切换；列表/导出请求、授权结果、仓库候选、日期规范化、格式与文件下载反馈由 MES 宿主提供，外层路由和视图状态仍由宿主控制。源 SHA-256：`dcb629319f20e01840a11d64c7d91d2205870eb8a9f74a2359e7e33b5f62e627`。
- `StockConversionDetailLedger` 保留转换单状态/日期/物料筛选、投入与产出行、自定义字段、状态列、数量汇总、保存视图、服务端排序、单据打开与新建/打印回调；列表/导出请求、权限、状态字典、动态字段 schema、保存视图 controller/shared refs、格式与路由由宿主注入。源 SHA-256：`ff3e1ce1c6a1cd2e49cd927031035644a8ec41c982cd66c71b1d656952574ea8`。两项 Catalog Demo 使用本地数据；真实 API/权限与视口验收因 UV 暂停为 `UNVERIFIED`。
- `StockCountDocumentComponentsDemo` 使用确定性本地仓库/物料/盘点数据覆盖创建和详情动作。真实 MES 服务、权限与打印接线、视口/键盘/屏幕阅读器验收为 `UNVERIFIED`。
- 组件的 MES 数据、策略、字段文案与路由能力由宿主注入。当前 UV 暂停期间未运行浏览器/类型检查，组件类型兼容、真实表单联动和实际视口均为 `UNVERIFIED`。

### 采购、报价、领用与入库明细台账

- `PurchaseOrderDetailLedger` 保留关键词/单号/供应商/物料/状态/日期筛选、汇总与价格可见性、来料检验入口、权限感知行操作、同供应商批量收货勾选限制、收货成功刷新、导出/新增和打印入口。批量收货表单、行操作菜单、列表/导出请求、权限、远程选项、格式、保存视图和打印由 MES 宿主注入。来源 SHA-256：`bd701f1af1f14e09dca4a6c09c4639c5596792332e2f5c31a08f821e9d31fe14`；Catalog `PurchaseOrderDetailLedgerDemo` 使用本地数据，真实服务/权限接线及视口验收为 `UNVERIFIED`。
- `PurchaseRequisitionItemsTable` 是采购申请列表展开行的只读物料表。列序为物料名称、编码、规格、单位、需求/已下单/剩余数量、建议供应商和采购/到货日期、行号、备注和审计日期；行号优先使用 `lineNo`，缺失时按 `sortOrder + 1` 或当前行序回退。缺少期望到货日期时显示红色“未填写”标签。单位、数量和日期格式函数由宿主传入；剩余数量缺失时按 `max(0, 需求数量 - 已下单数量)` 计算，非法数量按 0 处理。组件不读取 MES 服务、不判断权限，也不拥有采购申请列表/展开状态。Catalog 示例和 SSR 行为测试覆盖列序、格式注入、行号及缺失日期提示；Catalog 浏览器 E2 在 1280×900 与 390×844 视口通过，DOM 几何、横向滚动和截图见 [`verification/purchase-requisition-items-table-2026-11-22/`](./verification/purchase-requisition-items-table-2026-11-22/)。实际 MES Admin 路由视觉验收仍为 `UNVERIFIED`；目录其他示例造成的整体溢出已单独记录。
- `PurchaseReturnDetailLedger` 保留退料单筛选/默认排序、物料与行自定义字段、价格权限遮罩、退料汇总、详情/来源动作和批量打印；列表/导出、权限、候选项、价格可见性、格式、保存视图及打印由宿主注入。
- `QuotationDetailLedger` 保留报价状态/客户/物料/日期筛选、报价行明细、自定义字段、报价汇总、绑定材料/详情导航和打印入口；查询/导出、绑定动作、权限、动态列、格式与保存视图由宿主注入。
- `MaterialIssueDetailLedger` 保留生产领料类型/状态/人员/部门/设备/工单/物料/仓库/批号/日期筛选、动态字段、数量汇总、生命周期动作与打印入口；请求、动作/弹窗、权限、候选项、视图和格式由宿主注入。
- `PurchaseReceiptDetailLedger` 保留收货记录及展开的退货流水、采购来源明细筛选、价格显示/遮罩、质检状态、动态字段与不同入库/退货打印参数；API、权限、质检文案/跳转、字段、筛选候选、生命周期动作和打印由宿主注入。
- 四项 Catalog 示例使用本地确定性 capabilities。源 SHA-256：采购退料 `3ec221312e274a91993a38a34a9908c601b5a453fc5ac55e6fd58fe1f412905b`；报价 `c16f961d6c1c689db117bdd40ce9360b23244957226bbc86efa4efff5ec772f9`；生产领料 `09a67d33779c3243da46f3fcd6714eaaa1ea986636def420a2b7d8c178094342`；采购入库流水 `933497679520b4f8e656944faefe277416c56902581517e5e97417681ad05df2`。宿主 service/permission/action wiring 和浏览器视觉验收为 `UNVERIFIED`。
- `PurchaseRequisitionDetailLedger`、`PurchaseOrderDetailLedger`、`PurchaseReturnDetailLedger`、`QuotationDetailLedger` 和 `PurchaseReceiptDetailLedger` 的 MES 路由继续负责 URL 状态解析（报价状态需按有效枚举过滤）、保存视图资源/筛选键/默认排序、单据动作权限/状态门槛和 KeepAlive 回页刷新。来源路由对这五页调用 `useReloadOnKeepAliveReturn`；宿主替换调用时应把 hook 接到对应的 `tableActionRef.reload()`。Sunxu 组件不引入 Umi 或路由运行时。

### BOM 与集成说明组件

- `BomEffectiveBomSelector` 收到系列基础/型号差异 BOM、已解析 BOM 和 `resolutionKey`。系列基础场景保留 MES `MaterialFilteredSelect` 的物料型号搜索与 `familyId` 请求键；查询和解析分别通过 `requestMaterialOptions`、`resolveBom` 注入。单一有效版本直接交给 `onResolved`；多个候选先显示方案/版本选择，再按所选 header ID 重新请求，只有后端仍返回 matched 才提交。重置源 BOM 或 `resolutionKey` 时清除选中物料、候选及错误。模块不做客户端 BOM 合并或默认方案选择。来源 `BomEffectiveBomSelector.tsx` SHA-256：`b85b9d2f0ecbc762a5912e322aff1f4383ae572f0ac857008bb2a54a572965a2`。
- `BomWorkspaceDetail` 按 `bomId/refreshKey` 请求并展示 BOM 主档；请求版本号隔离过期详情/展开响应。标准型号 BOM 直接以最大深度 20 展开；系列基础或型号差异 BOM 经 `BomEffectiveBomSelector` 解析后展开，保留失败提示/重试、4 位数量、单位、版本/循环/缺失/截断标记、树/图切换、授权导出和打开完整详情。详情/展开/导出、直接展开判定、导出许可、状态词条、单位标签、导航和图表 renderer 由宿主 capability/props 提供，模块不持有 MES API、权限或路由。`BomWorkspaceDetailDemo` 覆盖有效版本选择、展开树/图、导出和刷新；真实服务/权限接线及浏览器视口为 `UNVERIFIED`。源文件 SHA-256：`3f63e2372b04b45ada43a0658dfa614baf054fe56103c6b8f3fc24ceffa9ea97`。
- `BomItemSourcingModal` 的列表候选只包含状态不是 inactive 的采购价目，已配置价目不重复列出；新增首个价目时设为主选，移除、主选切换和优先级编辑保留 MES 原逻辑。打开时并行读取 BOM 位来源及该物料前 100 条供应商价目，取消/上下文切换后忽略迟到结果。保存请求、警告/成功通知和关闭由 `BomItemSourcingModalCapabilities` / `onClose` 注入。弹窗宽 680px，列表保留 MES `ResizableTable`。来源文件 SHA-256：`06cd53824e106e60553926ae0944cb70b363b9421449d6a4842b693fb3ab8de3`。
- `BomExpansionCreateModal` 默认展开深度 8；打开时重置物料行、数量错误、预览和建议日期。保留物料批量添加、重复料/非正数量/空行校验、预览来源明细、来源排序与前两条摘要、警告前五条和总数、需求汇总、建议采购/到货日期、备注，以及必须先预览并有结果才可创建请购单。物料请求、预览/创建、权限、单位字典、数量格式、字段帮助和消息由 capabilities / `MesUiProvider` 注入；复用 `OrderItemEditor`、`BatchMaterialAddButton`、`ResizableTable` 与 `DocumentModalForm`。`BomExpansionCreateModalDemo` 展示预览与请购回调；真实宿主接线及视口验收为 `UNVERIFIED`。来源 SHA-256：`33790018f0fab4c7b42ab3defda57dd351873ea61f6cf8ded0bc30356f335cf3`。
- `BomExplosionTree` 复制来源节点颜色、4 位数量格式、万/亿摘要、前 5 条展开告警、Tooltip 文案和 LR 方向、初始 3 层、节点展开/收起与 roam 参数；图高限制为 520–1800px。用户偏好减少动态效果时将图表动画时长设为 0。为避免将来源的 ECharts runtime 加入 Sunxu 包，宿主必须提供 `renderChart({ option, style, notMerge, lazyUpdate, showLoading, ariaLabel })`；组件仍生成完整图表配置，不在 Sunxu 调用 MES API 或直接依赖 ECharts。`loading` 且无数据时显示 Spin，无数据时显示 Empty。来源文件 SHA-256：`3b787f4224bd677ebbc214d8c054d5de87becf492c4bc5d0c59e7842abcb564b`。
- `IntegrationGuideLink` 默认保留来源“接入说明”按钮、840px 弹窗、滚动正文和“关闭”按钮；宿主通过 `title`、`children` 注入主题内容，可覆写标签和宽度。来源 `IntegrationGuideLink.tsx` SHA-256：`8299c0a8bd4209dbac50692fea06635f4681f1deba1eb1353c0e353c4c62fd06`。
- `IntegrationGuideContent` 完整保留 API、Webhook、群机器人、设备点位、同步与运行记录五类指南正文及每类内容的 Ant Design 呈现；`topic` 由宿主路由选择，组件只提供静态 MES 集成知识，不读 API、不持有路由。Catalog 以 Tabs 展示五类内容。来源 `content.tsx` SHA-256：`5abe2e47d6dec9f7ac5b871808516efdc79c084de5101a25652a2f5aedf2a3bd`；视觉/路由验收 `UNVERIFIED`。
- `ServerInfoCard` 在挂载时请求一次主机指标并订阅实时推送，卸载时取消订阅；首次加载显示 Spinner，请求失败显示宿主格式化的错误，实时到达后标记“实时”并覆盖旧值。保留 CPU/内存/磁盘使用率、负载、OS/Node 运行信息、文件总量、各实体/MIME 分布与孤儿文件统计。REST/WebSocket 订阅（包括重连后重订阅）、文件统计、字节/数量/运行时间/平台/错误格式均由 `ServerInfoCardCapabilities` 或 props 提供。Catalog Demo 覆盖本地数据、实时推送和请求失败；真实服务器接线与视口为 `UNVERIFIED`。源文件 SHA-256：`abbf2799e34a40b1245f38278686aaa67b6a2a99378fcfce66ae9da373baf689`。
- `CompleteMaintenanceFields` 必须位于有效 ProForm/Form 上下文；模板步骤按来源顺序生成结果和备注字段，`required !== false` 的步骤要求填写结果，`photoRequired` 步骤要求上传至少 1 张现场照片且最多 5 张，照片不自动上传。整体备注始终保留；无步骤时显示可直接完成的提示。父级提交负责上传图片和构造维护完成 DTO；字段 help 三个 key 由 `getFieldHelpProps` 注入。源文件 SHA-256：`c5221d428efe4d4c5bc8b5e705deee24696dbccac0b9a5ef50ed20c0c8edcec4`。
- `BomComponentsDemo` 与 `IntegrationGuideLinkDemo` 已接入 Catalog；图表 renderer 示例用原生可展开树验证宿主插槽的数据形状。受当前 UV 暂停约束，所有新组件的真实浏览器渲染、视口几何、键盘/读屏和 MES 宿主能力接线仍为 `UNVERIFIED`。
- `CompleteMaintenanceFieldsDemo` 已接入 Catalog，覆盖模板来源、必填/可选步骤与必拍照片。真实 MES 上传/提交接线、视口几何、键盘/读屏和组件渲染均为 `UNVERIFIED`。

#### MES 批号与成品追溯

- `TraceTimelineDrawer` 在打开时按 `initialIdentifierType/initialIdentifier` 初始化，可切换批号/成品序列号；批号查询支持正向、反向和双向。每个查询使用递增请求版本，输入变化、类型切换、关闭或组件卸载后忽略过期响应。
- 批号先按编号读取批次，再以深度 10、完整单据、测量上下文和环境数据请求谱系图。成品序列号展示自身流转，并在有关联批次时追加反向批次谱系；谱系加载失败或无批次时保留单件记录并显示警告。
- 时间线按发生时间正序显示状态/类型、来源关系、最多三条节点关联、数量/单位、4M1E 上下文、缺失上下文、备注和图片预览；批号摘要展示批号、工单、质检和客户数量。请求 API、业务状态/事件字典、日期与单位格式由 `TraceTimelineCapabilities` 注入。
- Catalog 的 `TraceTimelineDrawerDemo` 用本地批次和序列号数据演示两种入口。真实 MES 请求/字典接线、照片服务、视口和读屏流程为 `UNVERIFIED`。

#### MES 质量检验工作流

- `QualityInspectionSubmitModal` 保留抽检/合格/不合格数量联动、模板检验项自动结论、总检查结论、过程检验方式和作业人、缺陷覆盖提示与新增缺陷、备注及复检来源说明。提交校验数量合法性、数量闭合、结论、数值测量和必拍照片；照片上传后将 URL 与检验值、自定义字段 payload 一并交给宿主提交。
- `QualityInspectionDefectModal` 收集缺陷编码、描述、数量、严重程度和备注；新增服务、字典字段、字段帮助、成功消息与父级刷新由宿主注入。
- `QualityInspectionItemResultFields` 保留数值多次测量、选择、文本、人工判定、自动判定标签、备注、自定义字段插槽和必拍照片校验。模板未配置自动判定规则时使用人工选择；`isRequired` 沿用来源实现，只显示“必检”标签，不额外改变必填契约。
- Catalog 的 `QualityInspectionWorkflowDemo` 展示提交弹窗、数量/结论联动和缺陷流程；`QualityInspectionItemResultFieldsDemo` 展示各类字段。真实计算、上传、服务、读屏和表单布局验收为 `UNVERIFIED`。

#### 工艺路线 IPQC 模板规则

- `ProcessOperationInspectionRulesForm` 是受控表单字段：保留默认 IPQC 模板、按物料配置专属模板、暂存中的新增/取消、删除已有项、模板/物料快照回显和重复物料拦截。更新时兼容并原样保留历史 `routeApplicabilityId` 条件规则，但只展示直接默认/物料绑定。
- 模板候选限定为启用的 IPQC 模板，首屏最多 50 条并支持 300ms 搜索；当前绑定模板可单独读取详情补齐选项。物料候选由宿主提供，切换到相同物料时阻止重复并给出错误反馈。
- 字段帮助/配置入口、IPQC 模板和物料请求、通知及 disabled 权限结果通过 `ProcessOperationInspectionRulesCapabilities` / props 注入；组件不拼装 MES 提交 DTO，宿主保存时忽略只用于回显的 material 快照。源文件 SHA-256：`be512d7ca085a18b28a0c56a23d8780933ba995133d77ef43dc54acfc0ff841b`。Catalog Demo 已覆盖默认、物料专属与历史条件规则；服务接线及浏览器视口为 `UNVERIFIED`。

#### 成品检验规则面板

- `FqcRulesPanel` 保留健康问题 Alert、关键词/物料/系列/批次形成方式/入库拦截/启用筛选、服务端排序分页和完整历史规则列；物料与系列筛选互斥，规则不存在范围时仍展示来源文案。
- 新增/编辑保留必填字段、范围联动、物料预选、模板/系列远程候选、空选项时配置入口和配置页返回刷新。提交 payload 排除仅用于编辑的 scopeType；创建/编辑/删除按宿主授权布尔值呈现，删除确认、成功反馈及保存后刷新沿用来源行为。
- `FqcRulesPanelCapabilities` 注入列表/详情/增删改、health、候选/字典、权限结果、配置导航、日期/状态映射和反馈。Panel 支持 page 与 embedded 两种标题边界；Catalog Demo 覆盖筛选、健康提示、权限及表单。源文件 SHA-256：`586752a80483f33a53ba9b61213aad86910251931168e249557b5a556abc7fc8`。真实 API/权限接线、浏览器状态和视口几何为 `UNVERIFIED`。

#### MES 销售退货

- `SaleReturnReceiveModal` 按退货明细收集实收数量、处置、批号、存放位置与备注；批次跟踪物料保留批号校验，数量和状态由宿主接收服务确认。
- `SaleReturnReverseModal` 显示单据/库存影响摘要并要求填写冲正原因和业务日期；日期归一化、状态文案、冲正服务和反馈由宿主提供。
- `SaleReturnStockConversionDrawer` 保留转换类型、仓库远程搜索和转换提交；成本分摊方式沿用来源禁用状态，仓库服务、字典、转换 API 与成功消息由宿主注入。
- `SaleReturnEditDrawer` 保留来源退货/手工退货的字段差异、价格可见权限、扣款项目与金额计算、原因/数量校验、明细自定义字段和字典配置插槽；更新服务、价格权限、字段 schema、金额规则、字典与消息由宿主提供。
- Catalog 的 `SaleReturnComponentsDemo` 展示四种 UI 并使用本地确定性 adapters。MES 数据、权限、服务和实际视口验收为 `UNVERIFIED`。

## 组件状态验收记录

#### MES 信息与表单模式

- **`InfoCard`**：字段按宿主权限逐项过滤，支持嵌套字段、日期/日期时间、金额脱敏、用户、状态和自定义渲染；复制字段保留可选中内容。卡片、字段排列及 children 由调用方配置。
- **`DetailHeader`**：保留可选返回、标题、状态、children 操作和 extra 插槽；没有任何可见内容时返回 `null`。
- **`MesDetailPageContainer`**：接收 `title/onBack/status/actions/extra/breadcrumbs/approval/children/footer`，组合 `DetailScreenContainer`、面包屑、`DetailHeader`、审批展示槽、正文和固定操作区。审批槽接收宿主渲染好的节点；API、路由、权限和审批生命周期均由宿主控制。父应用已有 main landmark 或容器时通过 `as="section"` 与 `frame="none"` 避免重复语义根和页面留白；窄屏详情操作由 `DetailHeader` 换行处理。
- **`DetailTable`**：复用 MES `ResizableProTable`，默认关闭搜索/分页/序号、关闭刷新和密度菜单、开启列设置；可选服务端分页适配器保留 `remoteFn({page,pageSize})` 契约。远程适配器不接收排序参数，因此默认关闭隐式排序；调用方显式配置的 sorter 保留。固定列默认横向滚动。
- **`TabsPanel`**：保留每项自定义渲染或 `DetailTable` 内容、基于当前本地数据长度生成标签、默认首项激活和外部刷新 `actionRef`。
- **`BatchSelectionSummary`**：展示批次中每张单据编号、可复制入口和可选摘要；它不替代 ProTable 的选择计数/清空工具栏。
- **`ContextualHelp` / `withSharedFieldHelp`**：图标触发器有稳定读屏名称；MES 表单和明细行说明沿用原始“作用/口径/怎么用”文案，错误和可执行状态仍应直接可见。
- **`FormDrawer`**：保留 create/update 转换、记录切换后 reset 与初值回填、成功回调、BizError/HTTP toast 去重、校验失败提示和首个错误定位；支持普通 `DrawerForm` 与 MES `DocumentModalForm` 两种变体。
- **宿主边界**：`AvatarDropdown`、`AvatarName`、`HeaderDropdown` 依赖 Umi 用户模型、退出登录、MES 支持联系方式和应用导航，留在 MES 应用壳；`DetailPageShell` 与 `ListPageShell` 的请求、路由 keepalive、审批/权限、批量操作、导入导出编排留在宿主，页面容器和可复用子组件使用 Sunxu Web/MES 契约。
- **目录和证据**：`MesPatternComponentsDemo` 覆盖信息字段权限、详情头、明细表、页签、批次摘要、帮助提示及抽屉表单。当前 UV 暂停期间未执行真实浏览器几何/键盘验收，视觉状态为 `UNVERIFIED`。

#### MES 顶栏与宿主壳层呈现

- **`HeaderActionButton`**：只承载一个图标操作，必须提供 `aria-label`；尺寸、颜色、hover/focus-visible/pressed 由 AntD Button 和语义主题 token 决定。Tooltip、Popover、Badge、权限和动作由宿主组合；禁用态及 ref 继续透传给 AntD Button。控件宽高随应用 `controlHeight` token，间距由父级工具栏拥有。
- **`MesNotificationPanel`**：宿主以受控 `open/onOpenChange` 注入弹层状态，以 `items/unreadCount/loading` 提供当前通知快照，并注入单条已读、全部已读和查看全部动作。组件覆盖加载、空、已读/未读及按钮状态；时间文案和通知跳转由宿主生成。通知列表固定最多 5 条时关闭虚拟滚动，弹层宽度为 `min(360px, 视口宽度 - 16px)`；重复行由 `Listy` 项和原生按钮表达。
- **`MesThemeOptionsPanel`**：`options/currentKey/onSelect` 控制主题标签、色样和选中按钮；组件只呈现 `aria-pressed`、主题 token hover/focus/selected 状态，不写入主题偏好或修改 ProLayout。面板宽度为 `min(260px, 视口宽度 - 16px)`。
- **`MesAppDownloadPanel`** 与 **`MesSupportQRCode`**：二维码始终由宿主通过 `qrCode` slot 提供；前者接收加载、下载地址、版本和服务器地址，后者接收支持账号及 vertical/horizontal 布局。未加载、加载中、无下载项及可复制文本由组件呈现，发布请求、二维码内容和联系数据仍由宿主拥有。下载面板宽度上限 280px；支持卡片受父容器限制，横向模式可换行。
- **`MesAnnouncementBanner`**：接收公告快照、可见状态和 `onOpen`；保留优先级标签、多个公告轮播、数量、关闭当前公告和读屏名称。空列表/宿主隐藏时不渲染。
- **`MesMenuSearchInput`** 与 **`MesBusinessSideNavView`**：菜单搜索为受控输入，宿主传入过滤候选及路径选择回调；侧栏只呈现宿主给出的主次菜单、当前选中项、折叠状态和导航回调，权限过滤、路由判断与菜单快捷键留在宿主。
- **目录和证据**：`MesPatternComponentsDemo` 展示以上组件的公开 props 和宿主注入边界；SSR 契约测试覆盖 accessible name、通知加载/空/未读、主题选择语义、二维码 slot、公告隐藏/优先级、搜索候选和侧栏折叠。真实 MES 路由截图、键盘交互、窄屏几何和 DOM 溢出未取得，均为 `UNVERIFIED`。

#### MES `OrderItemEditor`

- **布局与行行为**：保留 inline/card/table 三种布局，新增行、最小行数、复制/删除门控、临时件/档案物料切换、数量错误提示、物料选择后的联动回调、展开内容插槽、紧凑密度、列宽记忆与汇总行。
- **业务字段**：保留单价/币种、商业金额折扣与税率、含税/未税口径、物料字段摘要、单据行自定义字段与公式预览、批量复制/删除和批量字段覆盖。
- **`DocumentLineEditableTable`**：共享表格能力不足以覆盖 MES 列宽 key、展开行、Summary、compact 样式及来源行删除校验，因此在 MES suite 增加适配器；仍复用 Sunxu `ResizableTable` / `ResizableProTable`、`DocumentLineBatchSettingsButton` 和 `BatchFieldSettingsButton`。
- **宿主能力**：物料/币种服务、字典与配置入口、客户/单据字段 schema、公式预览、金额策略试算与可选字段帮助通过 `MesUiProvider.orderItemEditorCapabilities` 注入。组件不直接访问 MES API 或权限码。
- **目录和证据**：`OrderItemEditorDemo` 可切换三种布局，使用确定性物料/币种/金额 mock。当前 UV 暂停期间未执行真实浏览器视口、键盘表格滚动和业务 API 对接验收，状态为 `UNVERIFIED`。

当前新增 wrapper 的 props/状态契约已记录；真实目录渲染、响应式几何、键盘操作及深色主题的最终证据在 `docs/verification/`。未记录的状态都为 `UNVERIFIED`，不能根据 API 推断为已通过。
