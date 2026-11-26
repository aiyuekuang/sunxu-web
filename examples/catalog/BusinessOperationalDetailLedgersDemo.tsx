import { useMemo, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { Button, Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import { BusinessUiProvider, type DocumentDetailLedgerCapabilities } from '../../src/business';
import type { ColumnsState } from '@ant-design/pro-components';
import type { DocumentDetailLedgerSavedViewController } from '../../src/business/domains/documents/DocumentDetailLedgerTable';
import type { DocumentViewBarView } from '../../src/business/domains/documents/DocumentViewBar';
import { PurchaseReturnDetailLedger } from '../../src/business/domains/procurement/PurchaseReturnDetailLedger';
import { QuotationDetailLedger } from '../../src/business/domains/sales/QuotationDetailLedger';
import { MaterialIssueDetailLedger } from '../../src/business/domains/inventory/MaterialIssueDetailLedger';
import { PurchaseReceiptDetailLedger } from '../../src/business/domains/procurement/PurchaseReceiptDetailLedger';
import type { PurchaseReturnDetailLedgerRow, PurchaseReturnDetailLedgerQuery, PurchaseReturnDetailLedgerResponse } from '../../src/business/domains/procurement/purchase-return-detail-ledger-types';
import type { QuotationDetailLedgerRow, QuotationDetailLedgerQuery, QuotationDetailLedgerResponse } from '../../src/business/domains/sales/quotation-detail-ledger-types';
import type { MaterialIssueDetailLedgerRow, MaterialIssueDetailLedgerQuery, MaterialIssueDetailLedgerResponse } from '../../src/business/domains/inventory/material-issue-detail-ledger-types';
import type { PurchaseReceiptDetailLedgerRow, PurchaseReceiptDetailLedgerQuery, PurchaseReceiptDetailLedgerResponse } from '../../src/business/domains/procurement/purchase-receipt-detail-ledger-types';

type BusinessOperationalCapabilities = {
  purchaseReturn: ComponentProps<typeof PurchaseReturnDetailLedger>['capabilities'];
  quotation: ComponentProps<typeof QuotationDetailLedger>['capabilities'];
  materialIssue: ComponentProps<typeof MaterialIssueDetailLedger>['capabilities'];
  purchaseReceipt: ComponentProps<typeof PurchaseReceiptDetailLedger>['capabilities'];
};

const statusEnum = {
  draft: { text: '草稿', status: 'Default' }, submitted: { text: '待处理', status: 'Warning' },
  completed: { text: '已完成', status: 'Success' }, cancelled: { text: '已取消', status: 'Error' },
};
const returnStatusEnum = { ...statusEnum, outbound: { text: '已退库', status: 'Success' }, reversed: { text: '已冲正', status: 'Error' } };
const typeEnum = { auto_issue: { text: '自动领料', status: 'Processing' }, manual_issue: { text: '手动领料', status: 'Default' } };
const financialActionEnum = { none: { text: '无财务动作' }, payable: { text: '形成应付', status: 'Processing' }, reversed: { text: '已冲正', status: 'Error' } };
const ledgerTypeEnum = { purchase_receipt: { text: '采购入库', status: 'Success' }, purchase_return: { text: '采购退库', status: 'Warning' }, reversal: { text: '冲正', status: 'Error' } };
const qualityGateEnum = { pending: { text: '待检', status: 'Warning' }, passed: { text: '检验合格', status: 'Success' }, failed: { text: '检验不合格', status: 'Error' } };

const returnRows: PurchaseReturnDetailLedgerRow[] = [{ id: 'return-line-1', returnOrderId: 'r1', returnNo: 'TH-2026-018', status: 'completed', returnQty: 6, outboundQty: 6, unitPrice: 14.5, totalAmount: 87, reasonCode: 'quality', reasonLabelSnapshot: '来料质量异常', supplierName: '华东铝业有限公司', sourcePurchaseOrderNo: 'CG-2026-090', sourceReceiptNo: 'RK-2026-122', outboundWarehouseName: '原料仓', returnDate: '2026-11-18', outboundDate: '2026-11-19', orderCreatedAt: '2026-11-18T09:20:00+08:00', orderUpdatedAt: '2026-11-19T10:00:00+08:00', batchNo: 'LOT-018', location: 'A区 / 01-02', financialAction: 'none', remarks: '边角损伤', material: { name: '6061 铝型材', code: 'MAT-AL-001', spec: '20×30 mm', unit: 'pcs' } }];
const quotationRows: QuotationDetailLedgerRow[] = [{ id: 'quote-line-1', quotationId: 'q1', status: 'submitted', quotation: { id: 'q1', quotationNo: 'BJ-2026-028', status: 'submitted', quotationDate: '2026-11-20', customer: { name: '启明装备有限公司' }, paymentTerms: 'net30' }, material: { name: '精密支架', code: 'MAT-032', spec: '铝合金 / 阳极氧化', unit: 'pcs', thumbnailUrl: '' }, quantity: 30, unitPrice: 42, amount: 1260, discountRate: 5, taxRate: 13, taxAmount: 155.61, totalAmount: 1352.61, priceIncludesTax: false, customerMaterialCode: 'CUS-77', customerMaterialName: '定位支架', customerMaterialSpec: '黑色阳极', remarks: '需附材质报告' }];
const issueRows: MaterialIssueDetailLedgerRow[] = [{ id: 'issue-line-1', issueNo: 'LL-2026-104', orderNo: 'MO-2026-052', status: 'completed', type: 'manual_issue', issueOrder: { id: 'i1', issueNo: 'LL-2026-104', status: 'completed', type: 'manual_issue', plannedIssueAt: '2026-11-19', confirmedAt: '2026-11-20', operator: { realName: '王师傅' }, workOrder: { orderNo: 'MO-2026-052' } }, material: { name: '不锈钢螺栓', code: 'MAT-ST-18', spec: 'M8×35', unit: 'pcs' }, requiredQty: 36, actualQty: 36, issueQty: 36, issueUnit: 'pcs', warehouse: { name: '五金仓' }, location: { pathName: 'B区 / 02-01' }, batchNo: 'BOLT-551', createdAt: '2026-11-19T14:00:00+08:00', updatedAt: '2026-11-20T09:15:00+08:00', operatorName: '王师傅', remarks: '按工单齐套领料' }];
const receiptRows: PurchaseReceiptDetailLedgerRow[] = [{ id: 'receipt-line-1', ledgerRowId: 'receipt-ledger-1', ledgerType: 'purchase_receipt', receiptOrderId: 'receipt1', receiptNo: 'RK-2026-122', receiptDate: '2026-11-18', receiptQty: 48, quantity: 48, originalQty: 48, returnedQty: 6, reversedQty: 0, effectiveQty: 42, rejectedQty: 0, unitPrice: 14.5, amount: 696, originalAmount: 696, effectiveAmount: 609, totalAmount: 786.48, taxAmount: 90.48, supplierName: '华东铝业有限公司', purchaseOrderNo: 'CG-2026-090', purchaseOrderItem: { order: { id: 'po1', orderNo: 'CG-2026-090' } }, receiptOrder: { purchaseOrder: { id: 'po1', orderNo: 'CG-2026-090' } }, warehouseName: '原料仓', batchNo: 'LOT-018', supplierBatchNo: 'SUP-AL-882', storageLocationSnapshot: 'A区 / 01-02', grade: 'A', qualityGateStatus: 'passed', createdAt: '2026-11-18T10:20:00+08:00', updatedAt: '2026-11-18T10:45:00+08:00', material: { name: '6061 铝型材', code: 'MAT-AL-001', spec: '20×30 mm', unit: 'pcs' }, returnLedgerRows: [{ ledgerRowId: 'return-ledger-1', ledgerType: 'purchase_return', returnOrderId: 'r1', returnNo: 'TH-2026-018', returnStatus: 'completed', returnDate: '2026-11-19', ledgerQty: -6, returnQty: 6, ledgerAmount: -87 }] }];

function formatNumber(value: unknown) { return value == null || value === '' ? '-' : new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 4 }).format(Number(value)); }
function formatCurrency(value: unknown) { return value == null || value === '' ? '-' : `¥${new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))}`; }
function formatDate(value?: string | null) { return value ? value.slice(0, 10) : '-'; }
function formatDateTime(value?: string | null) { return value ? value.replace('T', ' ').slice(0, 19) : '-'; }
function formatUnit(value?: string | null) { return value ? ({ pcs: '件', kg: '千克' }[value] ?? value) : ''; }
function matches(row: Record<string, any>, query: Record<string, unknown>) {
  for (const key of ['status', 'supplierId', 'customerId', 'materialId', 'warehouseId', 'batchNo', 'issueNo', 'orderNo', 'returnNo']) {
    const value = query[key];
    if (value == null || value === '') continue;
    const rowValue = row[key] ?? row.status;
    if (Array.isArray(value)) {
      if (!value.includes(rowValue)) return false;
    } else if (String(rowValue) !== String(value)) return false;
  }
  return true;
}

export function BusinessOperationalDetailLedgersDemo() {
  const [kind, setKind] = useState('purchase-return');
  const [lastAction, setLastAction] = useState('');
  const [showAmounts, setShowAmounts] = useState(true);
  const [activeViewId, setActiveViewId] = useState('all');
  const [views, setViews] = useState<DocumentViewBarView[]>([
    { id: 'all', name: '全部明细', isDefault: true },
    { id: 'recent', name: '近期明细' },
  ]);
  const [sort, setSort] = useState<{ field: string; order: 'ascend' | 'descend' }>({ field: 'receiptDate', order: 'descend' });
  const [columnState, setColumnState] = useState<Record<string, ColumnsState>>({});
  const currentSortRef = useRef(sort); currentSortRef.current = sort;
  const applyingViewRef = useRef(false);
  const savedViewController = useMemo<DocumentDetailLedgerSavedViewController<DocumentViewBarView>>(() => ({
    views, loading: false, activeViewId, dirty: false, activeFilterCount: activeViewId === 'recent' ? 1 : 0,
    currentConfig: { sort, columns: columnState }, currentSortRef, applyingViewRef,
    params: activeViewId === 'recent' ? { status: 'completed' } : {}, beforeSearchSubmit: (values) => values,
    resetFilters: () => undefined,
    changeColumns: setColumnState, changeSort: (field, order) => { if (field && order) setSort({ field, order }); }, selectView: setActiveViewId,
    save: () => true,
    saveAs: ({ name }) => { setViews((current) => [...current, { id: `view-${current.length + 1}`, name }]); return true; },
    setDefault: (view) => { setViews((current) => current.map((item) => ({ ...item, isDefault: item.id === view.id }))); return true; },
    rename: (view, name) => { setViews((current) => current.map((item) => item.id === view.id ? { ...item, name } : item)); return true; },
    remove: (view) => { setViews((current) => current.filter((item) => item.id !== view.id)); return true; },
    reorder: (ids) => { setViews((current) => ids.map((id) => current.find((view) => view.id === id)).filter((view): view is DocumentViewBarView => Boolean(view))); return true; },
    discardAndSwitch: () => true, saveAndSwitch: () => true,
  }), [activeViewId, columnState, sort, views]);
const formats = { formatNumber, formatCurrency, formatDate, formatDateTime, formatUnit, formatSignedNumber: (value: unknown) => { const n = Number(value); return value == null ? '-' : `${n > 0 ? '+' : ''}${formatNumber(value)}`; } };
  const supplierFilterColumn = { valueType: 'select' as const, valueEnum: { supplier1: { text: '华东铝业有限公司' } }, fieldProps: { placeholder: '搜索供应商' } };
  const materialFilterColumn = { valueType: 'select' as const, valueEnum: { material1: { text: '6061 铝型材' }, material2: { text: '精密支架' } } };
  const customerFilterColumn = { valueType: 'select' as const, valueEnum: { customer1: { text: '启明装备有限公司' } } };
  const warehouseFilterColumn = { valueType: 'select' as const, valueEnum: { warehouse1: { text: '原料仓' }, warehouse2: { text: '五金仓' } } };
  const purchaseOrderFilterColumn = { valueType: 'select' as const, valueEnum: { po1: { text: 'CG-2026-090 (华东铝业有限公司)' } } };
  const dateRangePresets: { label: string; value: [any, any] }[] = [];
  const common = { dateRangePresets, resizable: { enabled: false }, format: formats, savedViewController };
  const capabilities = useMemo<BusinessOperationalCapabilities>(() => ({
    purchaseReturn: {
      ...common, supplierFilterColumn, materialFilterColumn, statusEnum, financialActionEnum,
      requestList: async (q: PurchaseReturnDetailLedgerQuery): Promise<PurchaseReturnDetailLedgerResponse> => { const list = returnRows.filter((r) => matches(r, q)); return { list, total: list.length, summary: { returnCount: 1, itemCount: list.length, materialCount: 1, totalReturnQty: 6, totalOutboundQty: 6, pricedItemCount: 1, unpricedItemCount: 0, amount: 87, discountAmount: 0, discountedAmount: 87, taxAmount: 11.31, totalAmount: 98.31, pricedAmountTotal: 87 }, priceVisible: true }; },
      exportExcel: async (q: PurchaseReturnDetailLedgerQuery) => new Blob([JSON.stringify(q)]), exportPermission: 'demo:return:export', createPermission: 'demo:return:create', canViewReturn: true, canExport: true, canCreate: true,
      reasonLabelMap: { quality: '质量异常' }, legacyReasonLabelMap: {}, unitLabelMap: { pcs: '件' }, maskAmount: (v: string | number) => String(v), navigateToReturn: (id: string) => setLastAction(`打开退货单 ${id}`),
      renderDocumentActions: (_r: PurchaseReturnDetailLedgerRow, reload: () => void) => <Button size="small" onClick={() => { setLastAction('退货单编辑 / 退库 / 库存流水'); reload(); }}>更多操作</Button>,
      renderLifecycle: () => <Typography.Text type="secondary">宿主注入：编辑退货单、退库出库、库存流水和保存后刷新。</Typography.Text>,
    },
    quotation: {
      ...common, customerFilterColumn, materialFilterColumn, statusEnum,
      requestList: async (q: QuotationDetailLedgerQuery): Promise<QuotationDetailLedgerResponse> => { const list = quotationRows.filter((r) => matches(r, q)); return { list, total: list.length, summary: { quotationCount: 1, itemCount: list.length, totalQty: 30, amount: 1260, discountAmount: 63, discountedAmount: 1197, taxAmount: 155.61, totalAmount: 1352.61 }, priceVisible: true }; },
      exportExcel: async (q: QuotationDetailLedgerQuery) => new Blob([JSON.stringify(q)]), exportPermission: 'demo:quotation:export', createPermission: 'demo:quotation:create', canViewQuotation: true, canExport: true, canCreate: true,
      unitLabelMap: { pcs: '件' }, paymentTermsLabelMap: { net30: '月结 30 天' }, maskAmount: (v: string | number) => showAmounts ? String(v) : '••••', amountDisplayToggle: <Button size="small" onClick={() => setShowAmounts(v => !v)}>{showAmounts ? '隐藏金额' : '显示金额'}</Button>,
      renderMaterialThumbnail: () => <span style={{ display: 'inline-grid', placeItems: 'center', width: 36, height: 36, border: '1px solid #ddd' }}>图</span>,
      print: { canPrint: true, openPrintBatch: (requests) => setLastAction(`提交报价批量打印 ${requests.length} 张单据`) },
      navigateToQuotation: (id: string) => setLastAction(`打开报价单 ${id}`), navigateToOrders: (id: string) => setLastAction(`查看报价转订单 ${id}`),
      onBindMaterials: () => setLastAction('打开报价绑定物料弹窗'),
      renderDocumentActions: (_r: QuotationDetailLedgerRow, reload: () => void, handlers: { onBindMaterials: (quotation: Record<string, any>) => void; onViewOrders: (id: string) => void }) => <Button size="small" onClick={() => { handlers.onBindMaterials(_r.quotation ?? {}); handlers.onViewOrders(_r.quotationId ?? 'q1'); setLastAction('绑定物料 / 查看关联订单'); reload(); }}>更多操作</Button>,
      renderLifecycle: () => <Typography.Text type="secondary">宿主注入：绑定物料弹窗及批量打印任务。</Typography.Text>,
    },
    materialIssue: {
      ...common, materialFilterColumn, warehouseFilterColumn, statusEnum, typeEnum,
      requestList: async (q: MaterialIssueDetailLedgerQuery): Promise<MaterialIssueDetailLedgerResponse> => { const list = issueRows.filter((r) => matches(r, q)); return { list, total: list.length, summary: { issueOrderCount: 1, itemCount: list.length, materialCount: 1, requiredQty: 36, actualQty: 36, issueQty: 36 } }; },
      exportExcel: async (q: MaterialIssueDetailLedgerQuery) => new Blob([JSON.stringify(q)]), exportPermission: 'demo:issue:export', createPermission: 'demo:issue:create', canViewRequest: true, canExport: true, canCreate: true,
      navigateToRequest: (id: string) => setLastAction(`打开领料单 ${id}`), renderDocumentActions: (_r: MaterialIssueDetailLedgerRow, reload: () => void) => <Button size="small" onClick={() => { setLastAction('领料单完成 / 取消 / 打印 / 打印记录'); reload(); }}>更多操作</Button>,
      renderLifecycle: () => <Typography.Text type="secondary">服务端导出、视图保存及行级动作由宿主注入。</Typography.Text>,
    },
    purchaseReceipt: {
      ...common, supplierFilterColumn, materialFilterColumn, purchaseOrderFilterColumn, warehouseFilterColumn, statusEnum, returnStatusEnum, ledgerTypeEnum, qualityGateEnum,
      requestList: async (q: PurchaseReceiptDetailLedgerQuery): Promise<PurchaseReceiptDetailLedgerResponse> => { const list = receiptRows.filter((r) => matches(r, q)); return { list, total: list.length, summary: { receiptCount: 1, itemCount: 1, originalQty: 48, returnedQty: 6, reversedQty: 0, effectiveQty: 42, pricedItemCount: 1, unpricedItemCount: 0, amount: 696, discountAmount: 0, discountedAmount: 696, taxAmount: 90.48, totalAmount: 786.48, originalAmount: 696, effectiveAmount: 609 }, priceVisible: true }; },
      exportExcel: async (q: PurchaseReceiptDetailLedgerQuery) => new Blob([JSON.stringify(q)]), exportPermission: 'demo:receipt:export', createPermission: 'demo:receipt:create', canViewReceipt: true, canViewOrder: true, canViewReturn: true, canViewInspection: true, canExport: true, canCreate: true, canCreateLandedCost: true,
      initialPurchaseOrderId: undefined, initialPurchaseOrderItemId: undefined, unitLabelMap: { pcs: '件' }, maskAmount: (v: string | number) => showAmounts ? String(v) : '••••', amountDisplayToggle: <Button size="small" onClick={() => setShowAmounts(v => !v)}>{showAmounts ? '隐藏金额' : '显示金额'}</Button>,
      renderQualityGate: (r: PurchaseReceiptDetailLedgerRow) => <span>{qualityGateEnum[r.qualityGateStatus as keyof typeof qualityGateEnum]?.text ?? '-'}</span>,
      print: { canPrint: true, openPrintBatch: (requests) => setLastAction(`提交入库/退库批量打印 ${requests.length} 张单据`) },
      batchPrintActionNode: <Typography.Text type="secondary">打印参数按入库 / 退库单据类型区分</Typography.Text>, printParams: (r: PurchaseReceiptDetailLedgerRow) => r.ledgerType === 'purchase_return' ? { businessType: 'purchase_return', businessId: r.returnLedgerRow?.returnOrderId ?? '' } : { businessType: 'purchase_receipt', businessId: r.receiptOrderId ?? '' },
      navigateToReceipt: (id: string) => setLastAction(`打开入库单 ${id}`), navigateToPurchaseOrder: (id: string) => setLastAction(`打开采购订单 ${id}`), navigateToReturn: (id: string) => setLastAction(`打开退货单 ${id}`), onKeywordSearch: (v: string) => setLastAction(`关键词：${v}`), onClearSourceItemFilter: () => setLastAction('清除来源采购明细筛选'),
      renderDocumentActions: (_r: PurchaseReceiptDetailLedgerRow, reload: () => void, context: { onEditReceipt: (id: string) => void; canCreateLandedCost: boolean; canViewInspection: boolean; getPrintParams: (row: PurchaseReceiptDetailLedgerRow) => { businessType: string; businessId: string } | null }) => <Button size="small" onClick={() => { setLastAction(context.canCreateLandedCost ? '入库编辑 / 创建采购退料 / 落地成本' : '入库编辑 / 创建采购退料'); context.onEditReceipt('receipt1'); reload(); }}>更多操作</Button>,
      renderLifecycle: () => <Typography.Text type="secondary">宿主注入：退料编辑/出库、质检详情、落地成本和打印作业。</Typography.Text>,
    },
  }), [savedViewController, showAmounts]);
  const ledgerCapabilities = useMemo<DocumentDetailLedgerCapabilities>(() => ({ pagination: { defaultPageSize: 10, showSizeChanger: false }, renderExportAction: ({ exportFn, label }) => <Button onClick={async () => { const file = await exportFn(); setLastAction(`模拟导出完成：${file.size} bytes`); }}>{label}</Button> }), []);
  const action = <Button type="primary" onClick={() => setLastAction('打开新增 / 创建表单')}>新建单据</Button>;
  return <SectionCard title="采购与销售业务明细台账迁移 Demo">
    <Typography.Paragraph type="secondary">保留业务筛选、动态明细字段、状态/权限呈现、摘要、个人视图与行级操作；API、权限判断、导航、字典、格式化、导出/打印和生命周期动作均由宿主能力注入。</Typography.Paragraph>
    <Space wrap style={{ marginBottom: 12 }}><Segmented aria-label="选择明细台账" value={kind} onChange={(v) => setKind(String(v))} options={[{ label: '采购退料', value: 'purchase-return' }, { label: '销售报价', value: 'quotation' }, { label: '生产领料', value: 'material-issue' }, { label: '采购入库流水', value: 'purchase-receipt' }]} />{action}</Space>
    {lastAction ? <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>最近操作：{lastAction}</Typography.Text> : null}
    <BusinessUiProvider hasPermission={() => true} documentDetailLedgerCapabilities={ledgerCapabilities}>
      {kind === 'purchase-return' ? <PurchaseReturnDetailLedger capabilities={capabilities.purchaseReturn} onCreate={() => setLastAction('新建采购退料')} /> : null}
      {kind === 'quotation' ? <QuotationDetailLedger capabilities={capabilities.quotation} initialDateRange={['2026-11-01', '2026-11-30']} onCreate={() => setLastAction('新建报价')} /> : null}
      {kind === 'material-issue' ? <MaterialIssueDetailLedger capabilities={capabilities.materialIssue} onCreate={() => setLastAction('新建领料单')} /> : null}
      {kind === 'purchase-receipt' ? <PurchaseReceiptDetailLedger capabilities={capabilities.purchaseReceipt} initialDateRange={['2026-11-01', '2026-11-30']} onCreate={() => setLastAction('新建采购入库')} onEdit={(id) => setLastAction(`编辑入库单 ${id}`)} /> : null}
    </BusinessUiProvider>
  </SectionCard>;
}
