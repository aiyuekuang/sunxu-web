import type { ProColumns } from '@ant-design/pro-components';
import { Button, Space, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { DocumentDetailLedgerTable } from '../documents/DocumentDetailLedgerTable';
import { ListKeywordSearch } from '../../../components/ListKeywordSearch';
import { restoreDetailLedgerDateRange } from '../documents/DetailLedgerFilterDrawer';
import { StatusDisplay } from '../../../components/StatusDisplay';
import { useSalesDetailLedgerBatchPrint } from '../sales/SalesDetailLedgerComponents';
import type { PurchaseReceiptDetailLedgerProps, PurchaseReceiptDetailLedgerQuery, PurchaseReceiptDetailLedgerRow, PurchaseReceiptDetailLedgerResponse, PurchaseReceiptDetailLedgerSummary } from './purchase-receipt-detail-ledger-types';

function isReturnRow(row: PurchaseReceiptDetailLedgerRow) { return row.ledgerType === 'purchase_return'; }
function expandLedgerRows(rows: PurchaseReceiptDetailLedgerRow[]): PurchaseReceiptDetailLedgerRow[] {
  return rows.flatMap((row) => [row, ...(row.returnLedgerRows ?? []).map((item) => ({
    ...row, ledgerRowId: item.ledgerRowId, ledgerType: item.ledgerType, ledgerDate: item.returnDate ?? undefined,
    ledgerQty: item.ledgerQty, ledgerAmount: item.ledgerAmount, returnLedgerRow: item, returnLedgerRows: [],
  }))]);
}
function buildPrintParams(row: PurchaseReceiptDetailLedgerRow, resolver?: PurchaseReceiptDetailLedgerProps['capabilities']['printParams']) {
  if (resolver) return resolver(row);
  if (isReturnRow(row)) return row.returnLedgerRow?.returnOrderId ? { businessType: 'purchase_return', businessId: row.returnLedgerRow.returnOrderId } : null;
  return row.receiptOrderId ? { businessType: 'purchase_receipt', businessId: row.receiptOrderId } : null;
}

/**
 * @sunxu-layer business
 * @sunxu-domain procurement
 * @sunxu-reason Preserves purchase-receipt, return and reversal rows, amount visibility, quality and print selection while data services, permissions, routes and lifecycle actions remain host supplied.
 * Embedded purchase receipt ledger subview.
 */
export function PurchaseReceiptDetailLedger({ capabilities: c, initialDateRange, onCreate, onEdit, onViewChange, tableActionRef, filterFormRef }: PurchaseReceiptDetailLedgerProps) {
  const [summary, setSummary] = useState<PurchaseReceiptDetailLedgerSummary>();
  const [priceVisible, setPriceVisible] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [keywordDraft, setKeywordDraft] = useState('');
  const reload = () => tableActionRef?.current?.reload();
  const batchPrint = useSalesDetailLedgerBatchPrint({
    canPrint: c.print.canPrint,
    getRowKey: (row: PurchaseReceiptDetailLedgerRow) => row.ledgerRowId ?? row.id,
    actions: [{ label: '批量打印', getPrintParams: (row: PurchaseReceiptDetailLedgerRow) => buildPrintParams(row, c.printParams) }],
    openPrintBatch: c.print.openPrintBatch,
  });
  const buildQuery = (params: Record<string, unknown>, sort: Pick<PurchaseReceiptDetailLedgerQuery, 'orderBy' | 'orderDir'> = {}): PurchaseReceiptDetailLedgerQuery => ({
    keyword: keyword || params.keyword || undefined,
    status: Array.isArray(params.statuses) ? undefined : params.status,
    statuses: Array.isArray(params.statuses) ? params.statuses : Array.isArray(params.status) ? params.status : undefined,
    supplierId: params.supplierId || undefined, purchaseOrderId: c.initialPurchaseOrderId || params.purchaseOrderId || undefined,
    purchaseOrderItemId: c.initialPurchaseOrderItemId || params.purchaseOrderItemId || undefined,
    materialId: params.materialId || undefined, warehouseId: params.warehouseId || undefined,
    batchNo: params.batchNo || undefined, startDate: params.startDate || initialDateRange?.[0] || undefined,
    endDate: params.endDate || initialDateRange?.[1] || undefined, orderBy: sort.orderBy ?? 'receiptDate', orderDir: sort.orderDir ?? 'DESC',
  });
  const columns = useMemo<ProColumns<PurchaseReceiptDetailLedgerRow>[]>(() => {
    const priceColumns: ProColumns<PurchaseReceiptDetailLedgerRow>[] = priceVisible ? [
      { title: '发生金额', dataIndex: 'ledgerAmount', width: 130, align: 'right', search: false, render: (_, r) => r.ledgerAmount == null ? '-' : <Typography.Text type={Number(r.ledgerAmount) < 0 ? 'danger' : undefined}>{c.maskAmount(c.format.formatCurrency(r.ledgerAmount))}</Typography.Text> },
      { title: '采购入库单位价格', dataIndex: 'unitPrice', width: 120, align: 'right', sorter: true, search: false, render: (_, r) => isReturnRow(r) || r.unitPrice == null ? '-' : c.maskAmount(c.format.formatCurrency(r.unitPrice)) },
      { title: '原入库金额', dataIndex: 'amount', width: 130, align: 'right', sorter: true, search: false, render: (_, r) => isReturnRow(r) || r.originalAmount == null ? '-' : c.maskAmount(c.format.formatCurrency(r.originalAmount)) },
      { title: '有效入库金额', dataIndex: 'effectiveAmount', width: 140, align: 'right', search: false, render: (_, r) => isReturnRow(r) || r.effectiveAmount == null ? '-' : c.maskAmount(c.format.formatCurrency(r.effectiveAmount)) },
      { title: '价税合计', dataIndex: 'totalAmount', width: 130, align: 'right', sorter: true, search: false, render: (_, r) => isReturnRow(r) || r.totalAmount == null ? '-' : c.maskAmount(c.format.formatCurrency(r.totalAmount)) },
      { title: '税额', dataIndex: 'taxAmount', width: 120, align: 'right', search: false, render: (_, r) => isReturnRow(r) || r.taxAmount == null ? '-' : c.maskAmount(c.format.formatCurrency(r.taxAmount)) },
    ] : [];
    return [
      { title: '供应商', dataIndex: 'supplierId', hideInTable: true, ...c.supplierFilterColumn },
      { title: '物料', dataIndex: 'materialId', hideInTable: true, ...c.materialFilterColumn },
      { title: '关键词', dataIndex: 'keyword', hideInTable: true, search: false },
      { title: '入库日期', dataIndex: 'receiptDateRange', valueType: 'dateRange', hideInTable: true, fieldProps: { presets: [...c.dateRangePresets] }, search: { transform: (v: [string,string]) => ({ startDate: v[0], endDate: v[1] }) } },
      { title: '采购订单', dataIndex: 'purchaseOrderId', valueType: 'select', hideInTable: true, ...c.purchaseOrderFilterColumn },
      { title: '仓库', dataIndex: 'warehouseId', valueType: 'select', hideInTable: true, ...c.warehouseFilterColumn },
      { title: '状态', dataIndex: 'status', valueType: 'select', valueEnum: c.statusEnum, hideInTable: true, fieldProps: { mode: 'multiple' } },
      { title: '批号', dataIndex: 'batchNo', hideInTable: true },
      { title: '物料名称', dataIndex: 'materialName', width: 180, ellipsis: true, sorter: true, search: false, render: (_, r) => r.material?.name || '-' },
      { title: '物料编码', dataIndex: 'materialCode', width: 150, sorter: true, search: false, render: (_, r) => r.material?.code || '-' },
      { title: '规格', dataIndex: 'materialSpec', width: 150, ellipsis: true, search: false, render: (_, r) => r.material?.spec || '-' },
      { title: '状态', dataIndex: 'status', width: 110, valueType: 'select', valueEnum: c.statusEnum, search: false, render: (_, r) => <StatusDisplay value={isReturnRow(r) ? r.returnLedgerRow?.returnStatus : r.status} enumMap={isReturnRow(r) ? c.returnStatusEnum : c.statusEnum} /> },
      { title: '来料质检', dataIndex: 'qualityGateStatus', width: 210, search: false, render: (_, r) => isReturnRow(r) ? '-' : c.canViewInspection ? c.renderQualityGate(r) : '-' },
      { title: '收货数量', dataIndex: 'receiptQty', width: 110, align: 'right', sorter: true, search: false, render: (_, r) => isReturnRow(r) ? '-' : c.format.formatNumber(r.receiptQty ?? r.quantity) },
      { title: '收货单位', dataIndex: 'receiptUnit', width: 95, search: false, render: (_, r) => { const unit = (r.receiptUnit ?? r.baseUnit ?? r.material?.unit)?.trim(); return isReturnRow(r) ? '-' : unit ? c.unitLabelMap?.[unit] ?? c.format.formatUnit(unit) ?? unit : '-'; } },
      { title: '发生数量', dataIndex: 'ledgerQty', width: 110, align: 'right', search: false, render: (_, r) => r.ledgerQty == null ? '-' : <Typography.Text type={Number(r.ledgerQty) < 0 ? 'danger' : undefined}>{c.format.formatSignedNumber(r.ledgerQty)}</Typography.Text> },
      { title: '原入库数量', dataIndex: 'quantity', width: 110, align: 'right', sorter: true, search: false, render: (_, r) => isReturnRow(r) ? '-' : c.format.formatNumber(r.originalQty) },
      { title: '已退货数量', dataIndex: 'returnedQty', width: 115, align: 'right', search: false, render: (_, r) => isReturnRow(r) ? '-' : c.format.formatNumber(r.returnedQty) },
      { title: '冲正数量', dataIndex: 'reversedQty', width: 110, align: 'right', search: false, render: (_, r) => isReturnRow(r) ? '-' : c.format.formatNumber(r.reversedQty) },
      { title: '有效入库数量', dataIndex: 'effectiveQty', width: 125, align: 'right', search: false, render: (_, r) => isReturnRow(r) ? '-' : c.format.formatNumber(r.effectiveQty) },
      ...(c.lineCustomFieldColumns ?? []), ...(c.materialCustomFieldColumns ?? []),
      { title: '拒收数量', dataIndex: 'rejectedQty', width: 110, align: 'right', search: false, render: (_, r) => isReturnRow(r) ? '-' : c.format.formatNumber(r.rejectedQty) },
      { title: '业务日期', dataIndex: 'receiptDate', valueType: 'date', width: 120, sorter: true, defaultSortOrder: 'descend', search: false, tooltip: '显示本行实际发生日：入库、退库和冲正各自独立；当前筛选与排序仍按原入库业务日期。', render: (_, r) => c.format.formatDate(r.ledgerDate ?? r.receiptDate) },
      { title: '创建时间', dataIndex: 'createdAt', valueType: 'dateTime', width: 160, sorter: true, search: false, render: (_, r) => c.format.formatDateTime(r.createdAt) },
      { title: '更新时间', dataIndex: 'updatedAt', valueType: 'dateTime', width: 160, sorter: true, search: false, render: (_, r) => c.format.formatDateTime(r.updatedAt) },
      { title: '类型', dataIndex: 'ledgerType', width: 110, search: false, render: (_, r) => <StatusDisplay value={r.ledgerType} enumMap={c.ledgerTypeEnum} /> },
      { title: '入库/退货单号', dataIndex: 'receiptNo', width: 170, sorter: true, search: false, copyable: true, render: (_, r) => { if (isReturnRow(r)) { const ret = r.returnLedgerRow; if (!ret) return '-'; return c.canViewReturn && ret.returnOrderId ? <Button type="link" size="small" onClick={() => c.navigateToReturn?.(ret.returnOrderId!)}>{ret.returnNo}</Button> : ret.returnNo || '-'; } return c.canViewReceipt && r.receiptOrderId ? <Button type="link" size="small" onClick={() => c.navigateToReceipt?.(r.receiptOrderId!)}>{r.receiptNo}</Button> : r.receiptNo || '-'; } },
      { title: '来源采购入库单', dataIndex: 'sourceReceiptNo', width: 170, sorter: true, search: false, copyable: true, render: (_, r) => isReturnRow(r) && c.canViewReceipt && r.receiptOrderId ? <Button type="link" size="small" onClick={() => c.navigateToReceipt?.(r.receiptOrderId!)}>{r.receiptNo}</Button> : isReturnRow(r) ? r.receiptNo || '-' : '-' },
      { title: '供应商', dataIndex: 'supplierName', width: 170, ellipsis: true, sorter: true, search: false, render: (_, r) => r.supplierName || '-' },
      { title: '采购订单', dataIndex: 'purchaseOrderNo', width: 170, sorter: true, search: false, render: (_, r) => { const order = r.purchaseOrderItem?.order ?? r.receiptOrder?.purchaseOrder; return order?.id ? c.canViewOrder ? <Button type="link" size="small" onClick={() => c.navigateToPurchaseOrder?.(order.id)}>{order.orderNo}</Button> : order.orderNo : r.purchaseOrderNo || '-'; } },
      { title: '入库仓库', dataIndex: 'warehouseName', width: 140, ellipsis: true, sorter: true, search: false, render: (_, r) => r.warehouseName || '-' },
      ...priceColumns,
      { title: '批号', dataIndex: 'batchNo', width: 140, sorter: true, search: false, render: (_, r) => r.batchNo || '-' },
      { title: '供应商批号', dataIndex: 'supplierBatchNo', width: 140, search: false, render: (_, r) => r.supplierBatchNo || '-' },
      { title: '仓位/位置', dataIndex: 'location', width: 170, ellipsis: true, search: false, render: (_, r) => r.storageLocationSnapshot ?? (typeof r.location === 'string' ? r.location : r.location?.pathName) ?? '-' },
      { title: '等级', dataIndex: 'grade', width: 90, search: false, render: (_, r) => r.grade || '-' },
      { title: '行备注', dataIndex: 'remarks', width: 180, ellipsis: true, search: false, render: (_, r) => r.remarks || '-' },
      { title: '更多操作', key: '__receiptActions', dataIndex: '__receiptActions', valueType: 'option', width: 64, fixed: 'right', search: false, render: (_: unknown, r: PurchaseReceiptDetailLedgerRow) => (isReturnRow(r) ? (c.canViewReturn && r.returnLedgerRow?.returnOrderId ? c.renderDocumentActions(r, reload, { onEditReceipt: (id) => onEdit ? onEdit(id) : c.navigateToReceipt(id), canCreateLandedCost: c.canCreateLandedCost, canViewInspection: c.canViewInspection, getPrintParams: (row) => buildPrintParams(row, c.printParams) }) : null) : (c.canViewReceipt && r.receiptOrderId ? c.renderDocumentActions(r, reload, { onEditReceipt: (id) => onEdit ? onEdit(id) : c.navigateToReceipt(id), canCreateLandedCost: c.canCreateLandedCost, canViewInspection: c.canViewInspection, getPrintParams: (row) => buildPrintParams(row, c.printParams) }) : null)) },
    ];
  }, [c, priceVisible]);
  const lightFilter = { formValuesFromFilters: (f: Record<string, unknown>) => ({ supplierId: f.supplierId, purchaseOrderId: f.purchaseOrderId, materialId: f.materialId, warehouseId: f.warehouseId, status: f.status, batchNo: f.batchNo, ...restoreDetailLedgerDateRange(f, 'receiptDateRange') }) };
  const footer = summary ? <Space wrap>
    <span>采购入库单笔数 {c.format.formatNumber(summary.receiptCount)}</span><span>入库明细行 {c.format.formatNumber(summary.itemCount)}</span><span>原入库量 {c.format.formatNumber(summary.originalQty ?? summary.totalQty)}</span><span>已退货量 {c.format.formatNumber(summary.returnedQty)}</span><span>冲正量 {c.format.formatNumber(summary.reversedQty)}</span><span>有效入库量 {c.format.formatNumber(summary.effectiveQty)}</span><span>已定价行 {c.format.formatNumber(summary.pricedItemCount)}</span><span>未定价行 {c.format.formatNumber(summary.unpricedItemCount)}</span>
    {priceVisible ? <><span>金额 {summary.amount == null ? '-' : c.maskAmount(c.format.formatCurrency(summary.amount))}</span><span>折扣金额 {summary.discountAmount == null ? '-' : c.maskAmount(c.format.formatCurrency(summary.discountAmount))}</span><span>折后金额 {summary.discountedAmount == null ? '-' : c.maskAmount(c.format.formatCurrency(summary.discountedAmount))}</span><span>税额 {summary.taxAmount == null ? '-' : c.maskAmount(c.format.formatCurrency(summary.taxAmount))}</span><span>总金额 {summary.totalAmount == null ? '-' : c.maskAmount(c.format.formatCurrency(summary.totalAmount))}</span><span>原入库折后金额 {summary.originalAmount == null ? '-' : c.maskAmount(c.format.formatCurrency(summary.originalAmount))}</span><span>有效入库折后金额 {summary.effectiveAmount == null ? '-' : c.maskAmount(c.format.formatCurrency(summary.effectiveAmount))}</span></> : null}
  </Space> : null;
  const initialFilters = { startDate: initialDateRange?.[0], endDate: initialDateRange?.[1] };
  const responseAdapter = async (query: PurchaseReceiptDetailLedgerQuery): Promise<PurchaseReceiptDetailLedgerResponse> => {
    const result = await c.requestList(query);
    return { ...result, list: expandLedgerRows(result.list ?? []) };
  };
  const clearSourceDetail = c.initialPurchaseOrderItemId ? <Button onClick={() => { c.onClearSourceItemFilter(); reload(); }}>清除明细来源筛选</Button> : null;
  return <>
    <DocumentDetailLedgerTable<PurchaseReceiptDetailLedgerRow, PurchaseReceiptDetailLedgerQuery, PurchaseReceiptDetailLedgerResponse>
      tableActionRef={tableActionRef} filterFormRef={filterFormRef} savedView={c.savedViewController ? { controller: c.savedViewController } : undefined} rowKey="ledgerRowId"
      rowSelection={batchPrint.rowSelection} tableAlertOptionRender={batchPrint.tableAlertOptionRender} headerTitle={<Space wrap><Typography.Text strong>入库流水</Typography.Text><div style={{ width: 320, maxWidth: '100%' }}><ListKeywordSearch ariaLabel="搜索采购入库流水" placeholder="输入采购入库单号、采购订单、供应商或物料搜索" value={keywordDraft} onChange={(e) => { setKeywordDraft(e.target.value); if (!e.target.value) { setKeyword(''); c.onKeywordSearch(''); } }} onSearch={(v, _event, info) => { if (info?.source === 'clear') return; setKeyword(v); setKeywordDraft(v); c.onKeywordSearch(v); }} /></div></Space>}
      showHeaderTitle initialQuery={{ orderBy: 'receiptDate', orderDir: 'DESC' }} initialFilters={initialFilters} transientQueryParams={{ keyword }} onTransientQueryReset={() => { setKeyword(''); setKeywordDraft(''); c.onKeywordSearch(''); }}
      apiFn={responseAdapter} buildQuery={buildQuery} columns={columns} exportFn={async (q) => { const blob = await c.exportExcel(q); if (!(blob instanceof Blob)) throw new Error('采购入库单明细导出响应不是文件'); return blob; }}
      exportFileName={c.exportFileName ?? `采购入库单明细_${Date.now()}.xlsx`} exportPermission={c.exportPermission} createPermission={c.canCreate ? c.createPermission : undefined} onCreate={onCreate} showExport={c.canExport}
      resizable={{ ...(c.resizableForPriceVisibility?.(priceVisible) ?? c.resizable), sortPersistenceKey: false }} serverSortFields={c.serverSortFields} scrollX={priceVisible ? 3390 : 2790} onViewChange={onViewChange}
      toolbarExtra={<Space wrap>{c.amountDisplayToggle}{c.initialPurchaseOrderItemId ? <Typography.Text type="secondary">已按来源明细精确筛选，并兼容历史无明细关联的入库记录；历史重复物料行按订单、物料和品质等级归组展示。</Typography.Text> : null}{clearSourceDetail}</Space>}
      onResponse={(r) => { setPriceVisible(r.priceVisible); c.onPriceVisibilityChange?.(r.priceVisible); setSummary(r.summary); }} footer={footer} lightFilter={lightFilter}
    />
    {c.batchPrintActionNode}{c.renderLifecycle?.(reload)}
  </>;
}
