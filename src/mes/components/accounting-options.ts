/** @sunxu-component mes-specific @sunxu-domain mes-accounting @sunxu-reason Preserves MES accounting option labels and statuses as package-owned domain metadata. */
export const ACCOUNTING_ACCOUNT_PURPOSE_OPTIONS: Opt[] = [
  { label: '应收', value: 'receivable' },
  { label: '应付', value: 'payable' },
  { label: '暂估应付', value: 'accrued_payable' },
  { label: '收入', value: 'revenue' },
  { label: '销项税', value: 'sales_tax_output' },
  { label: '进项税', value: 'purchase_tax_input' },
  { label: '存货', value: 'inventory' },
  { label: '存货成本', value: 'inventory_cost' },
  { label: '在产品', value: 'wip' },
  { label: '制造费用', value: 'manufacturing_overhead' },
  { label: '现金/银行', value: 'cash_bank' },
  { label: '费用', value: 'expense' },
  { label: '尾差', value: 'rounding_difference' },
  { label: '采购价差', value: 'purchase_variance' },
];

// 会计域共用下拉/枚举选项
export interface Opt {
  label: string;
  value: string;
}

export const RECORD_STATUS_OPTIONS: Opt[] = [
  { label: '草稿', value: 'draft' },
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
  { label: '归档', value: 'archived' },
];
export const RECORD_STATUS_VALUE_ENUM = {
  draft: { text: '草稿' },
  active: { text: '启用' },
  inactive: { text: '停用' },
  archived: { text: '归档' },
};

export const EXCHANGE_RATE_TYPE_OPTIONS: Opt[] = [
  { label: '即期', value: 'spot' },
  { label: '月均', value: 'monthly_average' },
  { label: '自定义', value: 'custom' },
];
export const EXCHANGE_RATE_TYPE_VALUE_ENUM = {
  spot: { text: '即期' },
  monthly_average: { text: '月均' },
  custom: { text: '自定义' },
};
export const EXCHANGE_RATE_SOURCE_OPTIONS: Opt[] = [
  { label: '手工', value: 'manual' },
  { label: '央行', value: 'central_bank' },
  { label: 'ERP导入', value: 'erp_import' },
  { label: '集成', value: 'integration' },
];

export const DIMENSION_TYPE_OPTIONS: Opt[] = [
  { label: '客户', value: 'customer' },
  { label: '供应商', value: 'supplier' },
  { label: '部门', value: 'department' },
  { label: '成本中心', value: 'cost_center' },
  { label: '物料', value: 'material' },
  { label: '仓库', value: 'warehouse' },
  { label: '工单', value: 'work_order' },
  { label: '项目', value: 'project' },
  { label: '员工', value: 'employee' },
  { label: '银行账户', value: 'bank_account' },
  { label: '税码', value: 'tax_code' },
  { label: '其他', value: 'other' },
];

export const DIMENSION_REQUIREMENT_OPTIONS: Opt[] = [
  { label: '可选', value: 'optional' },
  { label: '必填', value: 'required' },
];

export const ACCOUNT_PURPOSE_OPTIONS: Opt[] =
  ACCOUNTING_ACCOUNT_PURPOSE_OPTIONS;

export const FINANCIAL_FIELD_USAGE_OPTIONS: Opt[] = [
  { label: '仅作金额参考', value: 'reference_only' },
  { label: '影响订单毛利', value: 'order_margin' },
  { label: '生成费用待处理草稿', value: 'expense_draft' },
  {
    label: '生成采购附加费用分摊待处理草稿',
    value: 'purchase_landed_cost_draft',
  },
  {
    label: '生成生产费用归集待处理草稿',
    value: 'production_cost_collection_draft',
  },
  { label: '生成成本调整待处理草稿', value: 'cost_adjustment_draft' },
];

export const FINANCIAL_FIELD_USAGE_VALUE_ENUM = {
  reference_only: { text: '仅作金额参考' },
  order_margin: { text: '影响订单毛利' },
  expense_draft: { text: '生成费用待处理草稿' },
  purchase_landed_cost_draft: { text: '生成采购附加费用分摊待处理草稿' },
  production_cost_collection_draft: { text: '生成生产费用归集待处理草稿' },
  cost_adjustment_draft: { text: '生成成本调整待处理草稿' },
};

export const MONEY_FIELD_IMPACT_DRAFT_STATUS_OPTIONS: Opt[] = [
  { label: '待处理', value: 'draft' },
  { label: '已处理', value: 'processed' },
  { label: '已忽略', value: 'ignored' },
  { label: '已过期', value: 'obsolete' },
];

export const MONEY_FIELD_IMPACT_DRAFT_STATUS_VALUE_ENUM = {
  draft: { text: '待处理', status: 'Processing' },
  processed: { text: '已处理', status: 'Success' },
  ignored: { text: '已忽略', status: 'Default' },
  obsolete: { text: '已过期', status: 'Warning' },
};

export const EXPENSE_CATEGORY_OPTIONS: Opt[] = [
  { label: '采购附加成本', value: 'purchase_additional_cost' },
  { label: '生产成本', value: 'production_cost' },
  { label: '销售费用', value: 'sales_expense' },
  { label: '管理费用', value: 'management_expense' },
  { label: '项目费用', value: 'project_expense' },
  { label: '其他', value: 'other' },
];

export const EXPENSE_CATEGORY_VALUE_ENUM = {
  purchase_additional_cost: { text: '采购附加成本' },
  production_cost: { text: '生产成本' },
  sales_expense: { text: '销售费用' },
  management_expense: { text: '管理费用' },
  project_expense: { text: '项目费用' },
  other: { text: '其他' },
};

export const COST_ALLOCATION_BASIS_OPTIONS: Opt[] = [
  { label: '按数量', value: 'quantity' },
  { label: '按金额', value: 'amount' },
  { label: '按重量', value: 'weight' },
  { label: '手工分摊', value: 'manual' },
];

/** 产品成本费用归集单采用金蝶订单法的受益分配标准。 */
export const PRODUCT_COST_ALLOCATION_BASIS_OPTIONS: Opt[] = [
  { label: '按完工数量', value: 'output_quantity' },
  { label: '按实际工时', value: 'actual_labor_hours' },
  { label: '按直接材料金额', value: 'direct_material_amount' },
  { label: '按工单手工分配', value: 'manual' },
];

export const MONEY_FIELD_TRIGGER_EVENT_OPTIONS: Opt[] = [
  { label: '手工触发', value: 'manual' },
  { label: '单据创建', value: 'document_created' },
  { label: '单据审核', value: 'document_approved' },
  { label: '采购收货', value: 'purchase_receipt_confirmed' },
  { label: '采购发票确认', value: 'purchase_invoice_confirmed' },
  { label: '生产报工确认', value: 'production_report_confirmed' },
  { label: '工单完工', value: 'work_order_completed' },
];

export const TAX_TYPE_OPTIONS: Opt[] = [
  { label: '销项税', value: 'sales_output' },
  { label: '进项税', value: 'purchase_input' },
  { label: '进口税', value: 'import' },
  { label: '免税', value: 'exempt' },
  { label: '其他', value: 'other' },
];

export const CASH_BANK_ACCOUNT_TYPE_OPTIONS: Opt[] = [
  { label: '银行', value: 'bank' },
  { label: '现金', value: 'cash' },
  { label: '支付宝', value: 'alipay' },
  { label: '微信', value: 'wechat' },
  { label: '其他', value: 'other' },
];

export const CASH_BANK_DIRECTION_OPTIONS: Opt[] = [
  { label: '收款', value: 'receipt' },
  { label: '付款', value: 'payment' },
];
export const CASH_BANK_TXN_SOURCE_OPTIONS: Opt[] = [
  { label: '手工', value: 'manual' },
  { label: '银行导入', value: 'bank_import' },
];
export const CASH_BANK_RECONCILE_STATUS_VALUE_ENUM = {
  unreconciled: { text: '未对账' },
  matched: { text: '已匹配' },
  cancelled: { text: '已取消' },
};

export const labelOf = (opts: Opt[], v: string): string =>
  opts.find((o) => o.value === v)?.label ?? v;

export const money = (v: number | undefined | null): string =>
  Number(v ?? 0).toFixed(2);
