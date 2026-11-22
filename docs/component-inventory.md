# Sunxu → Sunxu Web 组件映射

Sunxu Web 将现有 React Native 组件的稳定用户任务映射到 Web 端的权威库；不把 React Native 文件原样搬进 Web 包。`AntD/Pro direct` 代表复用上游公开 API，不另造一个导出名义相同的包装组件。

## Sunxu 自有 Web 组件

这些组件表达 Sunxu 现有契约在 Web 端的可复用缺口：

| 组件 | Web 实现 |
|---|---|
| `ScreenContainer` | Web 工作区主区和统一内边距 |
| `PageHeader` | 有条件渲染的页面标题、说明、面包屑和操作插槽 |
| `ListScreenContainer` | 标题 → 紧邻列表工具栏 → 结果区 |
| `CrudListWorkbench` | 分类/状态、轻筛选、可选高级筛选与视图、ProTable 或宿主表格适配器结果区组合；不渲染页级标题；结果卡片默认使用 16px 水平内边距；fill 模式通过上游公开语义样式槽适配表格高度和底部分页 |
| `SavedViewBar` | 受控的系统/个人视图切换和管理操作 |
| `EditableDetailTable` | 受控重复明细编辑、行选择和批量字段设置 |
| `BatchFieldSettingsButton` | 选择批量覆盖字段并在确认后生成宿主 patch |
| `RemoteSelect` | 搜索候选时由宿主请求并由组件防抖的 Select |
| `LongText` | 表格长文本截断和全文查看；按字符上限或实际宽度溢出显示全文入口 |
| `PermissionButton`（`sunxu-web/mes`） | MES 宿主注入权限判断；统一确认、异步 loading、成功提示和错误恢复 |
| `DocumentModalForm`（`sunxu-web/mes`） | MES 单据表单全屏容器、当前工作区定位、最小化草稿保留与还原 |
| `mergeMesDocumentModalStyles`、`mergeMesDocumentModalPanelStyle`（`sunxu-web/mes`） | 合并 MES 单据表单、公式工作台、视口/工作区浮层和 Ant Design 语义样式槽 |
| `DocumentCustomFieldPanel`（`sunxu-web/mes`） | 保留单据自定义字段区的空态隐藏、错误展示和单据切换隔离；字段结构与编辑器由宿主渲染 |
| `DocumentLedgerViewSwitch`（`sunxu-web/mes`） | 单据列表与只读明细间的受控切换；页面状态、路由和列表刷新由宿主管理 |
| `DocumentLineQuantityInput`（`sunxu-web/mes`） | 可清空的数量编辑草稿；有效值由宿主控制，空值失焦时恢复最近有效值 |
| `StatusDisplay`（`sunxu-web/mes`） | 宿主注入状态字典，支持 Tag、Badge、文本三种呈现 |
| `MesStatusTag`（`sunxu-web/mes`） | 将宿主 MES 状态枚举映射为统一高对比只读标签；保留空/未知状态与 children 文案回退 |
| `MesReportQuickRangeButtons`（`sunxu-web/mes`） | 报表快捷范围的受控 Segmented 选择；匹配规则、日期范围和数据刷新由宿主提供 |
| `MesConfigEntryLink`、`MesConfigEntryFieldLabel`（`sunxu-web/mes`） | 在字段标签旁提供宿主授权的配置页新标签页链接；目标路由与权限结果由宿主提供 |
| `MesDetailPageContainer`、`MesDetailPageContent`、`MesDetailPageState`（`sunxu-web/mes`） | 组合 MES 详情页容器/内容/加载错误空状态；请求、路由、权限、重试决策与审批服务由宿主保留 |
| `HeaderActionButton`（`sunxu-web`） | 统一顶栏纯图标按钮的主题、焦点与按压呈现；无障碍名称必填，提示、徽标、弹层和动作由宿主组合 |
| `MesAnnouncementBanner`（`sunxu-web/mes`） | 呈现公告优先级、轮播摘要、数量和隐藏操作；公告数据、可见权限、轮询与详情路由由宿主保留 |
| `MesMenuSearchInput`（`sunxu-web/mes`） | 呈现受控菜单搜索框和上下文候选；菜单过滤、快捷键、授权和导航由宿主保留 |
| `MesBusinessSideNavView`（`sunxu-web/mes`） | 呈现业务主/次级导航、折叠态和当前选中项；菜单数据、权限过滤、路径判断和导航由宿主保留 |
| `MesNotificationPanel`（`sunxu-web/mes`） | 呈现通知列表、未读/加载/空状态和操作入口；通知服务、已读状态、权限与导航由宿主保留 |
| `MesThemeOptionsPanel`（`sunxu-web/mes`） | 呈现主题选项、色样和当前选择；主题持久化与应用配置由宿主保留 |
| `MesAppDownloadPanel`（`sunxu-web/mes`） | 呈现 App 下载二维码、版本、iOS 指引和服务器地址；发布数据、服务器地址与二维码生成由宿主保留 |
| `MesSupportQRCode`（`sunxu-web/mes`） | 呈现宿主提供的支持账号与二维码；联系信息和二维码内容由宿主保留 |
| `MesConfigurableProFormSelect`（`sunxu-web/mes`） | 保留 MES ProForm 远程候选、空候选探测与配置页回访刷新；候选请求/依赖/授权/路由由宿主提供 |
| `MesDictionaryProFormSelect`、`MesDictionaryFormItem`（`sunxu-web/mes`） | 将宿主字典选项、加载/错误/重试反馈接入 ProForm 或原生 Form Select；字典服务由宿主提供 |
| `MesExportButton`、`MesExportDropdownButton`（`sunxu-web/mes`） | 保留导出 loading、宿主表格布局准备、单项/多项结果回调；权限、请求、通知与文件下载由宿主提供 |
| `AmountText`、`AmountPolicySnapshotTag`（`sunxu-web/mes`） | 按 MES 金额格式展示并通过宿主金额策略脱敏；金额快照可展开查看公式和计算结果 |
| `DateText`、`UserText`（`sunxu-web/mes`） | MES 日期格式与用户姓名/账号回退展示 |
| `DefaultRouteHint`（`sunxu-web/mes`） | 宿主注入工艺路线候选请求，提示未手选时的推荐路线 |
| `CustomerMaterialCell`（`sunxu-web/mes`） | 同时保留销售单据客户物料别名与内部物料身份，并提供一致排序值 |
| `MaterialFilteredSelect`、`MaterialSelectField`、`MaterialMultiSelectField`（`sunxu-web/mes`） | 保留 MES 物料远程搜索、级联筛选、扫码候选校验、单位与自定义字段摘要；API、字典、权限、配置入口和扫码设备由宿主注入 |
| `MasterDataQuickCreateSelect`（`sunxu-web/mes`） | 保留客户/供应商 ProForm 关联选择、候选内快捷新建、创建后权威 ID 与默认值回填；新建表单、API、权限和配置链接由宿主注入 |
| `CustomerQuickCreateDrawer`、`CustomerFormFields`（`sunxu-web/mes`） | 保留客户名称/联系人及渠道、等级/行业/收款字典、销售员回显、信用额度和创建后客户/销售员/收款条件回填；创建服务、字段帮助和字典能力由 `MesUiProvider` 注入 |
| `SupplierQuickCreateDrawer`、`SupplierFormFields`（`sunxu-web/mes`） | 保留供应商联系人、评级/供应品类/付款条件字典、采购员回显、交货周期和创建后回填；创建服务、字段帮助和字典能力由 `MesUiProvider` 注入 |
| `AccountingBookField`、`FiscalPeriodField`、`VoucherWordField`、`AccountField`（`sunxu-web/mes`） | 会计账簿/期间/凭证字/科目远程选择、账簿联动和默认值；服务端列表、权限与基础资料配置路由由宿主注入 |
| MES 会计选项（`sunxu-web/mes`） | 会计记录状态、汇率、核算维度、财务字段用途、费用类别、分摊依据、触发事件、税类及现金/银行选项与标签映射 |
| `PurchaseReceiptCapacitySummary`（`sunxu-web/mes`） | 保留采购订单量、已收量、待收量及 MES 单位格式；数量与单位字典由宿主提供 |
| `GeneratePurchaseReceiptBatchNoButton`（`sunxu-web/mes`） | 保留采购系统批号生成按钮、禁用/loading 状态、明细回填与操作提示；批号服务由宿主注入 |
| `PurchaseReceiptSourcePicker`（`sunxu-web/mes`） | 保留可收货订单选择、待收明细顺序/筛选、数量限制、跨页选择和超限提示；来源查询与策略由宿主注入 |
| `IncomingInspectionCell`（`sunxu-web/mes`） | 展示来料检验状态与原因；状态字典、授权结果和检验单导航由宿主注入 |
| `IncomingInspectionPolicyCard`（`sunxu-web/mes`） | 保留物料档案 IQC 政策说明和检验方案维护指引 |
| `PurchaseReturnOutboundModal`（`sunxu-web/mes`） | 保留采购退货出库数量、日期、退款账户、批次/仓位及库存预览；查询、出库请求和副作用由宿主注入 |
| `PurchaseReturnEditDrawer`（`sunxu-web/mes`） | 保留采购退货来源/独立表单差异、扣款与金额校验、自定义字段和库存预览；价格权限、服务、仓位候选、字典及消息由宿主注入 |
| `ReverseLandedCostModal`（`sunxu-web/mes`） | 保留采购附加费用冲销说明、必填原因、业务日期与成功回调；冲销服务和日期转换由宿主注入 |
| `LandedCostFormDrawer`、`LandedCostDetailDrawer`、`LandedCostReceiptContextCard`（`sunxu-web/mes`） | 保留采购附加费用创建/编辑、分摊与冲销明细、采购入库上下文及会计来源处理；服务、权限、状态和金额格式由宿主注入 |
| `SaleReturnReceiveModal`、`SaleReturnReverseModal`、`SaleReturnStockConversionDrawer`、`SaleReturnEditDrawer`（`sunxu-web/mes`） | 保留销售退货实收、冲正、库存转换与编辑表单；校验、价格权限、字典、自定义字段和 API 由宿主注入 |
| `SaleOrderShipActionModal`、`SaleDeliveryDocumentActionsDropdown`、`ConvertToProductionDrawer`（`sunxu-web/mes`） | 保留销售订单出库入口、出库单动作与审批/信用额度流程、转生产数量/物料/路线交互；所有服务与权限由宿主注入 |
| `SaleDeliveryItemsPanel`、`SaleDeliveryEditorModal`、`ProductSerialPicker`、`PackageUnitPickerModal`、`SaleOrderLineEditableTable`（`sunxu-web/mes`） | 保留出库明细编辑、成品序列号及包装单元选择、订单行物料/价格/BOM/图纸编辑；接口、权限、字典、金额、自定义字段与选择器能力由宿主注入 |
| `SaleOrderDetailLedger`、`SaleReturnDetailLedger`、`SaleDeliveryDetailLedger`、`SaleDeliveryDocumentActionDrawer`（`sunxu-web/mes`） | 保留销售订单/退货/出库明细台账与出库动作抽屉；筛选、分页、打印、动作、权限和服务由宿主注入 |
| `PackageSpecManager`、`PackageUnitCreateDrawer`（`sunxu-web/mes`） | 保留包装规格维护、可包装来源筛选、箱规建议、创建校验和权限门控；数据请求、字典、配置入口和消息由宿主注入 |
| `CustomerOrderPortalQrModal`（`sunxu-web/mes`） | 保留客户门户二维码、全局展示配置、字段选择和库存可见性设置；权限、请求、门户 URL、二维码 renderer 与消息由宿主注入 |
| `VoiceBroadcastSettingsPanel`（`sunxu-web/mes`） | 保留大屏语音播报间隔、异常/生产事件类型设置、待播数量提示与清理已播记录；偏好存储和清理确认由宿主注入 |
| `SendQuotationModal`、`QuotationFormDrawer`、`QuotationBindMaterialsModal`（`sunxu-web/mes`） | 保留报价编辑、邮件/分享发送、客户料号与物料绑定流程；价格、权限、字典、API 和上传由宿主注入 |
| `PurchaseReceiptActionModal`、`PurchaseOrderViewSwitch`、`SendPurchaseOrderModal`、`RequisitionFormModal`、`CreateInquiryDrawer`、`ConvertToOrderDrawer`、`SendActionModal`、`SendAttachmentRow`（`sunxu-web/mes`） | 保留采购收货动作、采购单发送、请购编辑/询价/转订单和通用邮件附件交互；所有请求、权限、附件下载与副作用由宿主注入 |
| `PurchaseInquiryActionModals`、`PurchaseOrderFilterDrawer`、`PurchaseOrderDetailFilterDrawer`（`sunxu-web/mes`） | 保留询价报价登记/比价/定标/物料绑定/转订单，以及采购订单列表和详情筛选；服务、选项、权限、查询与重置由宿主注入 |
| `BomExpansionCreateModal`（`sunxu-web/mes`） | 保留 BOM 展开预览、来源/告警核对、物料行调整与生成请购单；预览/创建服务、物料候选、权限、单位字典和反馈由宿主注入 |
| `BomImportWorkbenchDrawer`（`sunxu-web/mes`） | 保留 BOM 映射方案、mapped data 行诊断、物料候选确认/忽略与执行；导入服务、字典、字段帮助和反馈由宿主注入 |
| `BusinessInvoiceCoverageCard`（`sunxu-web/mes`） | 保留采购/销售来源单据发票覆盖、金额权限显隐、待定价拦截、待红冲提示、草稿续填和发票生成；权限、请求及携带来源返回地址的导航由 MES 宿主注入 |
| `BusinessInvoiceCreateDrawer`、`BusinessInvoiceEditDrawer`、`BusinessInvoiceLineFormList`、`BusinessInvoiceMatchDrawer`、`InvoiceSourceCandidateTable`、`InvoiceSourceBatchModal`（`sunxu-web/mes`） | 保留发票创建/编辑、来源匹配、明细表单、候选筛选、分组拆并/移动及批量预检；API、权限、字典、格式与通知由宿主注入 |
| `BusinessInvoiceLineTable`、`BusinessInvoiceRelationsLedger`、`ProductCostResultsTable`（`sunxu-web/mes`） | 保留发票明细列、来源关系台账和产品成本结果列表；单位/金额格式、状态词条、分页请求和查看权限/导航由宿主注入 |
| `BusinessInvoiceDetailLedger`、`BusinessInvoiceOpeningImportDrawer`（`sunxu-web/mes`） | 保留业务发票台账筛选/汇总/导出/个人视图和期初发票 CSV 导入；服务、权限、状态/格式、模板下载与通知由宿主注入 |
| `InventoryOpeningBalancePanel`、`InventoryResultTable`、`InventoryStockSummaryTable`、`OpeningWipModal`、`ClosingWipModal`、`ExpenseCollectionModal`、`ProductCostCollectionsPanel`（`sunxu-web/mes`） | 保留存货期初/结果/库存汇总、期初/期末在产品及费用归集工作流；API、权限、分页、格式化、刷新和反馈由宿主注入 |
| `ExpenseBillLinesEditableTable`、`FundsTransactionDrawer`（`sunxu-web/mes`） | 保留费用明细编辑/公式预览/合计和资金流水详情；入库来源、服务、字段格式、状态文案与反馈由宿主注入 |
| `ScanAwareInput`（`sunxu-web/mes`） | 保留聚焦后键盘楔子扫码监听、原生 input 事件回填、异步扫码回调、失焦/禁用停用和 MES 源码的扫码判定参数 |
| `WarehouseRemoteSelect`（`sunxu-web/mes`） | 保留仓库远程搜索、范围/类型族筛选、历史值回显、稳定排序以及选中后 ID/名称双值回传；仓库服务由宿主注入 |
| `BatchSuggestInput`（`sunxu-web/mes`） | 保留批次搜索/回显、出入库可见性规则、定位/有效期/库存摘要、250 ms 搜索防抖、扫码精确匹配与竞态请求隔离；批次服务和状态词条由宿主注入 |
| `ReasonActionModal`（`sunxu-web/mes`） | 保留高风险业务动作原因必填、trim、最大字数、异步确认 loading、错误期间保持弹窗、关闭再打开清空原因；宿主提交具体操作 |
| `DetailDocumentActions`、`DetailLedgerDocumentActions`（`sunxu-web/mes`） | 保留详情动作直显/更多分组、主按钮样式、服务端动作态与权限过滤、台账权威单据按需加载、动作 intent 路由和宿主直办回调 |
| `WorkOrderScanSelect`（`sunxu-web/mes`） | 保留远程工单搜索、候选排序、过期搜索快照阻止选择、键盘楔子扫码解析、页面自定义校验、ID/工单号取值模式及异步解析回调；请求由宿主注入 |
| `DocumentViewLegacyRedirect`（`sunxu-web/mes`） | 保留历史深链命中判断、明细视图偏好写入、search 条件保留和宿主 replace 跳转 |
| `DocumentFilterDrawer` / `DocumentFilterButton`（`sunxu-web/mes`） | 保留已应用筛选计数、440px/全宽抽屉、QueryFilter 与 ProForm 不同内容 gutter、滚动主体、固定底栏 submitter Portal、关闭后不销毁表单 |
| `DetailLedgerFilterDrawer`（`sunxu-web/mes`） | 保留字段驱动表单、业务日期快捷范围、远程下拉默认、成功后关闭、加载禁用、重置回调以及 dateRange 与 start/end 字段双向转换 |
| `DocumentViewBar`（`sunxu-web/mes`） | 保留 SavedViewBar 与 MES 视图控制器的参数适配、未保存修改切换时序、视图管理功能以及旁边的筛选入口；带入桌面/移动弹性布局 |
| `PriceControlPrecheckButton`（`sunxu-web/mes`） | 保留后端价格规则预检、warn/block/approval 三态展示、原始权限回退、操作前校验、一次性自动运行、例外审批申请和确认失败错误弹窗 |
| `MaterialPriceSection`（`sunxu-web/mes`） | 保留参考进价/售价编辑、价格边界只读展示、移动加权平均成本、币别缺失提示和价格管理跳转；更新服务、权限结果与路由由宿主注入 |
| `ProductionBomSelect`（`sunxu-web/mes`） | 保留 BOM 远程候选、物料/销售订单依赖、唯一候选自动选中、搜索竞态隔离、字段帮助和配置页回访刷新；BOM 服务、字段帮助与配置权限/路由由宿主注入 |
| `ProcessOperationInspectionRulesForm`（`sunxu-web/mes`） | 保留工艺/标准工序默认 IPQC 模板和物料专属模板配置、历史条件规则兼容及重复物料校验；模板/物料查询、配置入口和反馈由宿主注入 |
| `FqcRulesPanel`（`sunxu-web/mes`） | 保留成品检验规则筛选、服务端列表、健康告警和规则新增/编辑/删除；规则服务、权限、字典和配置入口由宿主注入 |
| `MaterialSupplierPriceTierSummary`（`sunxu-web/mes`） | 按物料等级、默认标记和优先级展示最多三项供应商阶梯价，金额脱敏和等级字典由宿主注入 |
| `MaterialSupplierPriceTiersModal`（`sunxu-web/mes`） | 查询和维护物料-供应商阶梯价；服务请求、权限结果、币种/等级字典、单位换算和备注帮助由宿主注入 |
| `CustomFieldFormSection`（`sunxu-web/mes`） | 按 MES 自定义字段 schema 生成动态表单、校验、编辑值回填和运行时元数据；字段 schema/value API 与错误格式由宿主注入 |
| `FormulaDesigner`（`sunxu-web/mes`） | 保留字段/函数/运算符目录、表达式编辑、样例预览、类型诊断和依赖字段；schema、公式预览与错误格式由宿主注入 |
| `CustomFieldValuePanel`（`sunxu-web/mes`） | 展示详情/公式字段、计算异常、空态和编辑抽屉；schema/value 查询、保存和错误文案由宿主注入 |
| `CustomFieldCell`、`materialCustomFieldColumns`、`useDocumentCustomFieldDetailVisibility`（`sunxu-web/mes`） | 共享计算值/原始值展示、公式错误文案、物料自定义列可见性/排序/宽度，以及详情展开 schema 判定；schema 请求由宿主注入 |
| `ApprovalPanel`（`sunxu-web/mes`） | 保留审批状态、步骤时间线、提交/撤回/通过/驳回/重置流程；审批接口和实体级/全局权限决策由宿主注入 |
| `BomCostSnapshotEditor`（`sunxu-web/mes`） | 保留 BOM 成本/库存快照、替代料与订单改配能力、供应商价选择和缺料提示；成本预览 API、单位标签由宿主注入 |
| `BomEffectiveBomSelector`（`sunxu-web/mes`） | 保留系列基础/型号差异 BOM 的有效版本解析、冲突候选选择和当前展开结果；物料搜索、解析请求与文档更新回调由宿主注入 |
| `BomExplosionTree`（`sunxu-web/mes`） | 保留 BOM 树图配置、数量口径、节点摘要、警告和展开/缩放参数；ECharts renderer 由宿主提供，避免把可选图表运行时打入通用包 |
| `BomItemSourcingModal`（`sunxu-web/mes`） | 保留 BOM 行供应商价目候选、主选、优先级、移除与警告反馈；价目查询、来源读写和消息由宿主注入 |
| `BomVersionHistoryDrawer`（`sunxu-web/mes`） | 保留 BOM 版本列表、状态、变更说明、时间、选中高亮和宿主动作；权限、动作及日期格式由宿主注入 |
| `BomWorkspaceDetail`（`sunxu-web/mes`） | 保留 BOM 详情、有效版本解析、多级展开树/图、警告重试、导出和完整详情导航；BOM 服务、权限、图表 renderer 与路由由宿主注入 |
| `BomIssueOperationSelect`、`useBomIssueOperationOptions`（`sunxu-web/mes`） | 保留按候选路线展开工序、同一路线单一投料点、历史未识别绑定和搜索；路线候选/详情服务及生效日期由宿主注入 |
| `IntegrationGuideLink`（`sunxu-web/mes`） | 保留接入说明按钮和可滚动弹窗；标题、指南正文与主题内容由 MES 宿主传入 |
| `IntegrationGuideContent`（`sunxu-web/mes`） | 将 API、Webhook、群机器人、设备点位、同步与运行记录五类 MES 集成指南内容作为静态主题组件导出；页面路由/主题选择由宿主负责 |
| `ServerInfoCard`（`sunxu-web/mes`） | 展示 CPU、内存、磁盘、系统运行环境和文件存储统计，并标注实时数据；REST/WebSocket 与格式化由宿主注入 |
| `DashboardShortcutConfigModal`（`sunxu-web/mes`） | 维护仪表盘固定/自定义快捷入口、显隐/排序、编辑和权限结果；保存、入口定义和反馈由宿主注入 |
| `CompleteMaintenanceFields`（`sunxu-web/mes`） | 保留保养步骤结果/备注、必拍照片校验和整体完成备注；设备字段帮助文案由 MES 宿主注入 |
| `EquipmentFaultVerifyModal`（`sunxu-web/mes`） | 保留故障验收通过/退回维修、必填说明、提交反馈及成功回调；验收服务、字段帮助与通知由宿主注入 |
| `QualityInspectionSubmitModal`、`QualityInspectionDefectModal`（`sunxu-web/mes`） | 保留检验提交表单、数量/结论联动、缺陷覆盖校验与缺陷新增；计算、字典、服务和反馈由宿主注入 |
| `QualityInspectionItemResultFields`（`sunxu-web/mes`） | 保留数值多测量、选择/文本/人工判定、自定义字段、备注和必拍照片校验；模板规则和动态字段由宿主提供 |
| `AiAnalysisCard`（`sunxu-web/mes`） | 展示拍照质检 AI 建议、依据、照片、模型/提示词版本、失败信息与服务端拒绝项；分析查询和时间格式由宿主注入 |
| `OqcSourceDeliveryCard`（`sunxu-web/mes`） | 展示自动 OQC 关联的销售出库单/明细、出库数量/批次/位置和数据缺失/失败状态；销售出库查询、单位/状态字典与数值格式由宿主注入 |
| `QualityInspectionActionModals`（`sunxu-web/mes`） | 保留提交报工/登记缺陷前读取质检单详情、加载/失败/重试状态与两类弹窗编排；详情、字段 schema 和检验/缺陷能力由宿主注入 |
| `QualityTemplateItemsEditor`（`sunxu-web/mes`） | 保留模板检验项动态增删/复制、数值范围与测量次数校验、选择结果、自动判定提示、SPC/必检/必拍开关；规格类型字典和每项全宽扩展字段由宿主渲染 |
| `ScrapDeductionPolicySection`、`MaterialScrapDeductionPolicySection`（`sunxu-web/mes`） | 保留公司级报废扣款策略和物料覆盖/继承编辑；权限、策略 API 与保存提示由宿主注入 |
| `SelectedWorkOrdersTable`、`ProductionBatchNoField`、`WorkOrderAllocatedSerialsButton`（`sunxu-web/mes`） | 保留批量工单核对、报工批号输入/扫码和已分配序列号查询；物料显示、批号候选和序列号服务由宿主注入 |
| `WorkOrderReportModal`、`WorkOrderReportDirectModal`、`WorkOrderFormDrawer/Fields`、`WorkOrderListProgress/RiskTags`（`sunxu-web/mes`） | 保留工序/整单报工、工单表单、动态字段与列表进度风险摘要；工单 API、权限、序列/仓位/批号候选及副作用由宿主注入 |
| `WorkOrderBatchReportModal`、`WorkOrderMaterialShortageSection`（`sunxu-web/mes`） | 保留多工序批量报工和工单缺料补料闭环；数据/API、权限、上传、打印、字段帮助和消息由宿主注入 |
| `WorkOrderTemporaryReportQrPrint`（`sunxu-web/mes`） | 保留临时报工码资格、门户 URL、动态文案转义、六码分页和打印窗口；二维码 renderer 与窗口策略由宿主注入 |
| `OutsourcingOrderDetailLedger`、`OutsourcingProgressDrawer`（`sunxu-web/mes`） | 保留外协订单详情台账、批量打印、视图/筛选和供应商进度/二维码维护；台账与进度服务、权限、字典和打印/二维码能力由宿主注入 |
| `ReportLogDetailDrawer`（`sunxu-web/mes`） | 保留报工日志详情字段、权限门控、状态/日期/工价/报废率展示和来源跳转；日志数据及格式、导航由宿主注入 |
| `WorkOrderFilterDrawer`（`sunxu-web/mes`） | 保留工单状态/物料需求/交期/执行筛选、优先级范围、远程主数据候选和业务日期区间；筛选字典、候选请求、提交与重置由宿主注入 |
| `ReportDynamicFields`（`sunxu-web/mes`） | 保留预检驱动的工序/成品数量、批号、排产、报废、零报工及异常工时字段；服务端预检结果与数值格式由宿主提供 |
| `ProductionReceiptSummaryCard`、`WorkOrderSplitModal`（`sunxu-web/mes`） | 保留工单生产入库数量摘要、权限控制的列表入口和拆分数量边界/子工单回调；查询、导航、拆分服务、单位字典、字段帮助与提示由宿主注入 |
| `TraceTimelineDrawer`（`sunxu-web/mes`） | 保留批号和成品序列号追溯、方向选择、时间线关系/上下文/照片/备注、汇总和警告；查询、字典及格式化由宿主注入 |
| MES 单据视图切换预设（`sunxu-web/mes`） | 保留采购申请/退料/入库、销售订单/出库/退货、报价和生产领料各自的 `aria-label`，共享受控的明细/单据切换 |
| `ScheduleGanttWidgets`、`ShiftBreakListField`（`sunxu-web/mes`） | 保留排产当前时刻线、负荷热力格点击与班次休息时段增删；产能格式/颜色和时间字段策略由宿主提供 |
| `ProductionShiftCalendar`、`ShiftFormModal`、`ShiftTable`、`ExceptionFormModal`、`ExceptionTable`（`sunxu-web/mes`） | 保留班次及日期例外的归属、校验、分页筛选、分域权限动作、删除确认与变更历史；业务请求、主数据候选和字段级消息由宿主注入 |
| `RescheduleDrawer`、`ChangeHistoryModal`（`sunxu-web/mes`） | 保留排程策略配置、影响预览/筛选、风险入口、历史与提交刷新；权限、字典、服务、错误和导航由宿主注入 |
| 生产排程甘特组件（`sunxu-web/mes`） | 保留产能格、排程条拖拽/缩放/选择、右键菜单、详情检查器、日期筛选工具栏、提示和待排产拖放；待排产面板/容量条位置和右键选择行为可配置，时间/排产模型、颜色/文案、权限动作、数据和提交由宿主注入 |
| `AutoScheduleDrawer`、`ScheduleFromPlansDrawer`、`BottleneckPanel`、`ScenarioCompare`、`EntryFormDrawer`、`EntryList`、`ProductionScheduleGanttView`（`sunxu-web/mes`） | 保留自动/计划排产、计划与外协摘要、瓶颈/方案分析、人工排程表单与台账、甘特交互；策略/API/权限/字典/导航/提交由 MES 宿主注入 |
| `BatchReleaseModal`（`sunxu-web/mes`） | 保留生产计划批量下达草稿的增删、数量/交期编辑、受保护行过滤、日期序列化和成功刷新；草稿查询/保存与提示由宿主注入 |
| `TemplateFieldSelector`、`TemplateLayoutPresetSelect`（`sunxu-web/mes`） | 保留打印字段筛选、必选锁定、默认选择、搜索、拖拽排序与 12 种版式 SVG；打印字段、模板枚举、版式选项和字段帮助由宿主注入 |
| `GridPrintDesigner`（`sunxu-web/mes`） | 保留网格打印模板画布、字段/样例数据加载、模板 schema 兼容和预览入口；授权字段、样例数据、纸张参数与预览动作由 MES 宿主注入 |
| `StockCountLineFormList`（`sunxu-web/mes`） | 保留盘点行物料选择、货主联动、批次清理、仓位搜索、配置入口与自定义字段；表单由组件观察，物料/仓位/货主能力由 MES 宿主提供 |
| `CreateStockCountModal`、`StockCountDetailDrawer`（`sunxu-web/mes`） | 保留盘点单创建、明/盲盘详情、行维护、实盘录入、提交/审核过账/冲正/取消与自定义字段；DTO、服务、权限、字典、日期、打印和提示由宿主注入 |
| `StockCountDetailLedger`（`sunxu-web/mes`） | 保留盘点明细筛选、位置权限门控、数量/状态/动态字段列、订单详情跳转和多维汇总；列表/导出、保存视图、批量打印、权限和选择器由宿主注入 |
| `PurchaseInquiryDetailLedger`、`PurchaseRequisitionDetailLedger`、`InternalIssueDetailLedger`、`ProductionReceiptDetailLedger`（`sunxu-web/mes`） | 保留采购询价/申请、内部领用、生产入库明细台账的筛选、动态列、汇总、视图、导出/打印入口和详情动作；API、权限结果、选择器、记忆分页、格式、导航及持久化由 MES 宿主注入 |
| `PurchaseRequisitionItemsTable`（`sunxu-web/mes`） | 保留采购申请展开行的物料优先列序、数量回退、建议采购上下文和缺失到货日期提示；单位、数量、日期格式由宿主注入 |
| `PurchaseOrderDetailLedger`（`sunxu-web/mes`） | 保留采购订单筛选、价格可见性、来料质检、费用汇总权限、行操作与同供应商批量收货约束；列表/权限/动作/收货流程由 MES 宿主注入 |
| `PurchaseReturnDetailLedger`、`QuotationDetailLedger`、`MaterialIssueDetailLedger`、`PurchaseReceiptDetailLedger`（`sunxu-web/mes`） | 保留采购退料/报价/生产领料/采购入库台账的筛选、状态、汇总、自定义字段、行操作和打印；API、权限、费用/价格脱敏、来料质检、视图与生命周期弹窗由 MES 宿主注入 |
| `StockTransferDetailLedger`、`StockConversionDetailLedger`（`sunxu-web/mes`） | 保留调拨只读明细、投入/产出转换台账、筛选、列/排序、摘要和视图切换；API/导出、权限、字典、自定义字段、格式和持久化由宿主注入 |
| `StockTransferModal`、`StockTransferActionModals`（`sunxu-web/mes`） | 保留仓库调拨单编辑、物料批量加入、确认/取消/撤销流程和明细校验；仓库/物料/库存服务及权限由宿主注入 |
| `CustomerMaterialDispositionDetailLedger`、`CustomerMaterialDispositionForm`、`CustomerMaterialDispositionReverseModal`（`sunxu-web/mes`） | 保留客户料处置台账筛选/个人视图/汇总、来源余额/批次校验、自定义字段和冲正；数据、权限、字典、导航与反馈由宿主注入 |
| `ImportDrawer`（`sunxu-web/mes`） | 保留模板下载、Excel 上传、Base64 导入、导入结果/错误展示和继续导入；导入/模板服务与刷新回调由调用方提供 |
| `BackupDirectoryPicker`（`sunxu-web/mes`） | 保留服务器目录浏览、路径输入/上级跳转、失败重试、最近存在目录提示和当前目录选择；文件系统访问由宿主服务注入 |
| `ImportWorkbenchDrawer`（`sunxu-web/mes`） | 保留单/多目标快速导入、权限过滤、模板下载、Excel 预览、警告行策略、错误/警告明细和确认执行；导入服务由 `MesUiProvider` 注入 |
| `AllowedEquipmentPriorityField`（`sunxu-web/mes`） | 保留允许设备范围、设备优先级排序、默认/班次单件工时配置和工序默认工时继承；设备/班次请求、设备类型字典与分页策略由 `MesUiProvider` 注入 |
| `DocumentBomOpenButton`、`DocumentBomDrawer`（`sunxu-web/mes`） | 提供单据 BOM 权限降级、查看/编辑/导入、层级明细、文件/物料交互、校验与保存；API、字典、字段 schema、路线策略及选择器由宿主注入 |
| `InfoCard`、`DetailHeader`、`DetailTable`、`TabsPanel`、`BatchSelectionSummary`、`ContextualHelp`、`FormDrawer`（`sunxu-web/mes`） | 保留 MES 信息字段权限与格式、详情标题/状态/操作槽、明细表默认、页签内容、批量单据摘要、字段帮助，以及新增/编辑表单的消息和弹窗生命周期 |
| `OrderItemEditor`、`DocumentLineEditableTable`（`sunxu-web/mes`） | 保留物料/临时件、数量/价格/税率/折扣、金额与自定义字段预览、三种布局、列宽与密度、展开行和批量明细操作；服务与策略由宿主注入 |
| `DocumentViewSortModal`（`sunxu-web/mes`） | 支持拖动与键盘传感器调整 MES 视图顺序；保存请求由宿主处理 |
| `DocumentLineCustomFieldFormItems`（`sunxu-web/mes`） | 按单据行 schema 排序并渲染启用、可见的输入字段；字段值路径由宿主指定，表单/行布局由调用方提供 |
| `documentLineCustomFieldColumns`（`sunxu-web/mes`） | 统一单据行 schema 显隐/排序/宽度、编辑与只读列、payload、预览投影及聚合；API 数据、权限、业务计算与持久化由宿主负责 |
| `DocumentDetailLedgerTable`（`sunxu-web/mes`） | 保留单据/明细切换、轻量筛选与个人视图、服务端分页排序、当前查询导出和新增入口；请求、权限、导出下载与记忆分页由宿主注入 |
| `PrintLayout`、`DotMatrixLayout`、`LabelLayout`（`sunxu-web/mes`） | 保留 A4、针式连续纸、标签纸三种 MES 打印根布局；打印模板样式导出供打印宿主注入，标签纸方向由宿主当前设置提供 |
| MES 单据打印模板（`sunxu-web/mes`） | 送货单针打/A4、质检报告、领料单、工序流转卡、采购订单针打/A4、采购入库单、销售订单和生产工单；二维码、单位/状态/质量/付款文案及金额脱敏由宿主注入 |
| `usePrint`、`useDotMatrixPrint`、`useLabelPrint`（`sunxu-web/mes`） | 分别提供 A4、可配置连续纸和可配置标签纸打印 ref、纸型/抬头设置及隔离样式；使用 `react-to-print` |
| `PrintAction`、`PrintRecordsAction`（`sunxu-web/mes`） | 保留打印设置、预览/打印、记录确认、PDF 与历史补打工作流；请求、权限、打印状态、消息、文件名和 HTML 净化由宿主能力注入 |
| MES 打印选项适配器（`sunxu-web/mes`） | 输出打印业务/模板/纸型选项与模板类型文案；打印业务、场景、已发布模板、纸型请求由宿主注入 |
| MES 标签模板（物料、批次、设备、包装单元、工装、工单） | 保留模板字段和条码值映射；QR 绘制、单位字典与工单内部二维码编码由宿主提供 |
| `AccountingCrudPage`（`sunxu-web/mes`） | 保留会计资料服务端列表、搜索/排序/分页、权限新增/编辑、ModalForm 生命周期和成功刷新；服务、字段、权限与分页由宿主传入 |
| `AccountImportModal`、`OpeningBalanceImportModal`、`LedgerQueryContext`、`NarrativeSummaryTable`、`TrialBalanceButton`、`PurchaseAccrualDetailDrawer`、`PurchaseAccrualPreviewDrawer`（`sunxu-web/mes`） | 保留会计导入、总账筛选/摘要/试算及采购暂估详情/冲销预览；权限、请求、文件、分页、字典、导航和通知由宿主注入 |
| `AccountingReconciliationModals`、`BookModal`、`AccountModal`、`ProductCostWipPanels`（`sunxu-web/mes`） | 保留银行对账、账簿/科目表单及期初/期末在产品处理；API、字典、权限、刷新和 WIP 表单宿主能力由调用方注入 |
| `FundsTransactionModals`、`FinanceInvoiceCurrencyRepairModal`、`FinanceInvoiceCancelModal`、`CreditNoteRefundModal`（`sunxu-web/mes`） | 保留资金流水导入/记账、币别修复、发票取消和贷项退款操作；权限、API、日期和导航由宿主注入 |
| `PaymentRequestActionModals`、`ExportTemplateModal`、`SendStatementModal`（`sunxu-web/mes`） | 保留付款申请调整/执行、对账单导出模板配置与发送；付款账户/方式、权限、模板文件/上传/下载和通知由宿主注入 |
| `MaterialTablePicker`（`sunxu-web/mes`） | 支持物料分类、搜索、服务端分页单/多选、跨页记录回显、数量录入、库存汇总和缩略图预览；物料/分类/库存请求、单位字典与分页设置由宿主注入 |
| `BatchMaterialAddButton`（`sunxu-web/mes`） | 将批量选中的新物料追加为明细行，过滤已存在项、移除空占位行、保留数量并限制最大行数；行结构与明细联动由宿主提供 |
| `EntityThumbnail`（`sunxu-web/mes`） | 实体缩略图、主题控件高度默认尺寸、空图/损坏图回退、预览和表格行事件隔离 |
| `DrawingFilesInline`、`FileUrlsInline`、`DrawingFilesGallery`、`PdfPreviewDrawer`（`sunxu-web/mes`） | MES 图纸/附件上传、订单头附件关联、分组预览/打印和 PDF 分页缩放；文件代理、原名解析和上传由宿主注入 |
| `MaterialDrawingsPanel`（`sunxu-web/mes`） | 保留物料图纸/附件列表、图片/PDF/GLB 预览、受权限控制的上传/删除及上传策略校验；文件请求、授权 URL 和预览 renderer 由宿主注入，可接入套件 `GlbModelViewer` |
| `GlbModelViewer`（`sunxu-web/mes`） | 提供 GLB/GLTF 加载、旋转缩放、网格/线框切换、恢复视角、加载失败及 WebGL 资源清理；宿主传入已授权可读 URL，three 为可选 peer 且挂载后动态加载 |
| `ResizableProTable`（`sunxu-web/mes`） | MES 分页列表表格适配：可调列宽、持久化列序/显隐/排序、全局行号、密度、空态、导出布局和单列表视口高度 |
| `ResizableTable`（`sunxu-web/mes`） | 原生 AntD Table 的 MES 明细表适配：可调列宽、可选行号、密度、空态和本地排序 |
| `TableActions`、`TableDensityOption`、`TableEmpty`（`sunxu-web/mes`） | MES 表格的行操作收纳、密度控制和带业务引导的空态 |
| `RowActions` | 表格行操作收纳为省略号菜单（来源：tel_admin `TableActions` 适配） |
| `TableSummary` | 在表格结果区末尾固定展示列合计，或以普通表格行承载多单位摘要；`fullWidth` 由 MES 表格适配器按最终可见列解析，独立适配器可调用 `withResolvedTableSummary`；不承担请求、聚合或单位换算 |
| `PaginationSummary` | 在分页栏左侧显示宿主提供的简短筛选摘要；不承担请求或聚合 |
| `FormScreenContainer` | 表单内容滚动 + 固定底部操作 |
| `DetailScreenContainer` | 详情内容滚动 + 固定底部操作 |
| `StickyActionBar` | 页面级固定动作区 |
| `SectionCard` | 基于 ProCard 的可选标题容器 |
| `StatusTabs` | 基于 AntD Segmented 的受控互斥状态筛选 |
| `StatusTag` | 固定实底样式并为自定义色提供对比文字色的只读状态标签 |
| `FilterBar` | 轻量筛选字段与同级操作组合 |
| `MetricCard` | ProCard + Statistic |
| `DetailCard` | ProCard + Descriptions |
| `SettingsRow` | 链接、单动作或静态信息行 |
| `ProfileIdentity` | Avatar + 姓名 + 宿主摘要插槽 |
| `ChartPanel` | ProCard + loading / empty / error 状态 |
| `ErrorBoundary` | React 边界 + AntD Result |
| `PermissionGuard` | 仅消费宿主授权结果 |
| `SunxuWebProvider` | AntD ConfigProvider / App + Sunxu 色彩主题 |

`CrudListWorkbench` 的 Facet 轨道负责与结果区保持单一 16px 间距并提供受限高度内的溢出滚动；宿主侧栏卡片负责自身边框和内边距，宽度应适配轨道。可运行组合示例见目录的“CRUD 列表工作台”页。

`CrudListWorkbench` 的搜索插槽约束搜索控件不超出筛选行；标准桌面基准宽度为 320px，窄工作区按可用宽度收缩。可运行组合示例见目录的“CRUD 列表工作台”页。

标准新增入口通过 `onCreate` 提供，组件统一文案和位置；`RowActions` 的 `kind` 统一查看、编辑和删除文案，领域操作仍由宿主命名。

## 直接映射到 Ant Design / Pro Components

| Sunxu 组件/任务 | Web 权威实现 |
|---|---|
| `AppText` | `Typography.Text` / `Typography.Title` |
| `ActionButton`, `IconActionButton`, `FilterActionButton` | `Button`；纯图标按钮使用 `aria-label` |
| `ActionMenu`, `PageHeader.headerActions` | `Dropdown` + `Menu` 或页面级按钮 |
| `ActionToast`, `AppToast`, `ToastHost`, `MessageAlert` | `App.useApp()` 的 message / notification |
| `Avatar`, `Badge`, `Divider`, `ProgressBar`, `Skeleton` | Ant Design 同名组件 |
| `BottomSheet`, `ChoiceSheet`, `FullScreenModal`, `EntityPickerModal` | `Drawer` / `Modal` / `Select`，按任务语义选择 |
| `ChipSelectField`, `PickerField`, `EntityPickerField` | `Select` / `Radio.Group` + `Form.Item` |
| `CheckboxField` | `Checkbox` + `Form.Item` |
| `DatePickerField`, `DateRangeQuickSelect` | `DatePicker` / `RangePicker` + `Form.Item` |
| `DateNavigator` | `DatePicker` 与 `Button` 组合，由宿主控制日期和周期 |
| `DrillDownTreePicker`, `TreePickerField` | `Cascader` / `TreeSelect` |
| `EmptyState`, `LoadingView`, `ErrorView` | `Empty`, `Spin` / `Skeleton`, `Alert` / `Result` |
| `FormField`, `FormLabel`, `FormPage` | `Form.Item` / `ProForm` + `FormScreenContainer` |
| `ListCard`, `ListSortSheet`, `MultiSelectBar` | `ProTable` / `ProCard`、table sorter、工具栏与 `rowSelection` |
| `SearchBar`, `FilterQuickControl`, `FilterBar` | `Input.Search`, `Segmented`, `QueryFilter` 或本库 `FilterBar` |
| `MetricCard`, `ChartPanel`, `DetailCard` | 本库语义容器；数据可视化引擎由宿主提供 |
| `PhotoPicker`, `ScanCameraModal`, `ImagePreviewModal` | `Upload` / 原生文件输入、宿主相机能力、`Image.PreviewGroup` |
| `QuickNumInput` | `InputNumber` |
| `ScanInput` | `Input`；扫码键盘/浏览器设备事件由宿主管理 |
| `SelectableChip`, `EntityFilterChip` | `Checkbox.Button` / `Tag.CheckableTag`、`Select` |
| `AudioPlayer` | 浏览器 `<audio controls>`，播放源由宿主提供 |
| 地图/图表控件 | 供应商视图插槽；地图 SDK 和图表引擎不进入基础 peer 列表 |

直接映射项的业务请求、日期值、表单提交、文件权限与错误恢复由宿主管理。基础库通过上游公开组件提供交互状态，不再维护同义包装层。

## 暂不作为通用 Web 控件迁入

| 来源 | 处理 |
|---|---|
| `DialPad` | 属于电话输入交互；仅在明确有跨宿主 Web 需求时作为独立可选模块评估 |
| `PersistentBottomSheet` | Web 侧吸附式常驻面板与 Drawer 生命周期不同；不做同名兼容组件 |
| `SwipeableRow` | 不要求桌面用户依赖触控滑动；使用 ProTable 行操作/Dropdown，并保留键盘入口 |
| `MapScreenContainer` | SDK/地图视图由宿主提供，Web 包不绑定地图供应商或全屏导航 |
| `ScalePressable` | Web 使用语义 button/link 与 AntD hover/focus 状态，不复制 RN 按压动画组件 |
| `ModalRequestCloseContext` | 由 Modal/Drawer 的受控 open、onCancel/onClose 契约承载 |
| 分页实体选择器与通用格式工具 | 业务数据请求、字段字典及格式口径不默认放进 UI 核心包 |

## 映射状态

- **ADAPTED**：上方 Sunxu Web 自有组件已实现，并有组件契约。
- **UPSTREAM**：由 Ant Design / Pro Components 原生 API 承担，不重复导出。
- **HOST**：由宿主的 API、权限、路由、文件/地图/图表供应商承担。
- **DEFERRED**：保留来源职责记录，等待明确的跨宿主 Web 需求。

## MES Web 旧版组件覆盖记录

本节记录早期只建设通用组件层时的边界和处理决定。来源是 MES Web 管理端固定提交 `133e8673e92c24119024f9b4fbcfe2ce5247bf79`，不是 App；当时 `src/components/**` 共盘点 193 个跟踪文件，其中 4 个 Web 交互适配为 `EditableDetailTable`、`BatchFieldSettingsButton`、`RemoteSelect`、`LongText`。

其中明细表复合组件采用受控行数据与列渲染回调；选择状态、复制/删除、最少行数、逐字段批量应用由共享层管理。字段 schema、服务请求、权限及提交副作用由宿主决定。这是当时“通用包只放跨项目组件”的实现快照。

其余来源代码当时映射到目标已有契约或 Ant Design / Pro Components，或标记为宿主/MES 领域/待评估；逐文件路径、SHA-256、旧处理决定见 [MES Web 组件迁移账本](./migrations/mes-web-components.json)。该处理决定不再作为当前迁移目标。

MES `DocumentViewBar` 的通用视图选择、脏状态切换和视图管理交互由 `SavedViewBar` 承接；`DocumentFilterDrawer` 的筛选草稿、应用/重置/取消容器由 `CrudListWorkbench` 承接。视图 API、权限、字段 schema、筛选值和持久化仍由 MES 宿主负责。

### MES 当前运行时代码组件使用快照（2026-11-19）

上面的逐文件迁移账本锁定于旧提交；为避免把旧清点误认为当前覆盖，当前 `mes-admin` 运行时代码另有 [JSX 组件使用快照](./migrations/mes-admin-component-usage-2026-11-19.json)。快照扫描了 1,066 个非生成、非测试 TS/TSX 源文件，记录 627 个导入组件条目、348 个来源模块、13,465 处 JSX 使用和 559 个调用文件；涵盖 Ant Design、Pro Components、Sunxu Web、MES 公共目录、页面局部组件及其他组件包。

当前 `src/components/**` 的逐文件快照另见 [MES 公共组件源文件清单](./migrations/mes-admin-src-components-2026-11-19.json)：共 195 个跟踪文件（146 个运行时源文件、46 个测试文件、3 个样式文件）；其中 102 个运行时文件在扫描范围内被 JSX 直接使用，共 2,137 处。文件清单记录每个文件的 SHA-256，并与使用快照的消费者统计关联。与旧账本来源比较，162 个文件内容未变、31 个文件内容已变、2 个文件新增、0 个文件删除；未变文件沿用旧处理决定，改动和新增文件均标记为需重新核对。

该快照与逐文件清单是当前迁移的完整追踪基线。现在的目标是让每项当前实现都有去向：Sunxu 通用层、Sunxu MES 套件、Sunxu 根层的 AntD/Pro/图标直通出口，或明确保留在宿主的页面控制器。MES 套件组件必须保留当前交互并通过 props/回调接收请求与权限结果；页面、路由和服务实现继续留在宿主。每个实现完成映射并补齐契约后，才进入逐项替换批次。

### 全量覆盖工作账本（当前迁移快照）

用户已授权把 Sunxu Web 扩展为“通用层 + MES UI 套件”。逐个 import 条目与 `src/components` 源文件的哈希和迁移进度记录在 [MES 组件全量覆盖账本](./migrations/mes-admin-component-coverage-2026-11-20.json)，当前源快照为 `mes-admin@8f3eb022977ee3fe4bff856f1bcf1b2fd5f625e8`。627 个运行时组件引用中，245 项映射至 Sunxu 通用/上游出口，328 项标记为已实现，53 项仍在宿主页面/集成/平台层，另有 1 项工作区实现。`src/components` 的 197 个来源文件中，112 项进入 Sunxu MES 层、3 项进入 Sunxu 通用层、36 项保留在宿主集成、46 项是未发布的测试文件。237 个页面局部组件引用中，228 项已迁入 Sunxu、9 项由宿主承接；204 个页面组件源文件中，195 个已完整迁入，9 个确认为 MES 页面/内容控制器，0 个组件源文件待迁移。非 JSX 的页面局部 UI helper 单独列在覆盖账本的 `supplemental_page_local_ui_helpers`，不计入 JSX 组件引用数量。页面局部组件均已纳入 Sunxu MES 套件；MES 消费端尚未逐项替换，因此整体迁移仍未完成。

消费者替换尚未开始：`mes-admin` 仍固定在旧版 `sunxu-web` Git SHA，需先推送包含全部 MES UI 的库变更，再逐项更新消费者。页面路由、服务和控制器仍由 MES 宿主持有；属于 UI 的 MES 领域交互继续迁入 Sunxu，并通过宿主注入数据与权限。运行与视觉验收仍为 `UNVERIFIED`。

## 东健 CRM 列表场景

CRM 产品列表的一级产品分类、启用状态分段、关键字、列表操作及 ProTable 结果区可组合为 `CrudListWorkbench` 的分类场景；低频状态切换可以退化为轻筛选。CRM 的产品字段、字典设置、增删改表单、请求和权限仍由 CRM 宿主负责。综合示例位于目录的“CRUD 列表工作台”页，展示轻量、分类/状态、复杂视图和 ProTable 原生查询四种装配方式。
