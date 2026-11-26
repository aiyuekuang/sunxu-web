import type { ProColumns } from '@ant-design/pro-components';
import { useMemo, useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { DocumentDetailLedgerTable } from '../documents/DocumentDetailLedgerTable';
import { restoreDetailLedgerDateRange } from '../documents/DetailLedgerFilterDrawer';
import { StatusDisplay } from '../../../components/StatusDisplay';
import type { PurchaseReturnDetailLedgerProps, PurchaseReturnDetailLedgerQuery, PurchaseReturnDetailLedgerRow, PurchaseReturnDetailLedgerSummary } from './purchase-return-detail-ledger-types';

/**
 * @sunxu-layer business
 * @sunxu-domain procurement
 * @sunxu-reason Keeps purchase-return filters, amount-gated columns, custom fields and summary together while requests, permissions, navigation, dictionaries and lifecycle UI stay host supplied.
 * Embedded purchase-return detail ledger.
 */
export function PurchaseReturnDetailLedger({ capabilities: c, onCreate, onViewChange, tableActionRef, filterFormRef }: PurchaseReturnDetailLedgerProps) {
  const [summary, setSummary] = useState<PurchaseReturnDetailLedgerSummary>();
  const [priceVisible, setPriceVisible] = useState(false);
  const reload = () => tableActionRef?.current?.reload();
  const buildQuery = (params: Record<string, unknown>, sort: Pick<PurchaseReturnDetailLedgerQuery, 'orderBy' | 'orderDir'> = {}): PurchaseReturnDetailLedgerQuery => ({
    keyword: params.keyword || undefined, returnNo: params.returnNo || undefined,
    status: Array.isArray(params.statuses) || Array.isArray(params.status) ? undefined : params.status,
    statuses: Array.isArray(params.statuses) ? params.statuses : Array.isArray(params.status) ? params.status : undefined,
    supplierId: params.supplierId || undefined, materialId: params.materialId || undefined,
    sourcePurchaseOrderId: params.sourcePurchaseOrderId || undefined, sourceReceiptId: params.sourceReceiptId || undefined,
    returnDateStart: params.returnDateStart || undefined, returnDateEnd: params.returnDateEnd || undefined,
    createdAtStart: params.createdAtStart || undefined, createdAtEnd: params.createdAtEnd || undefined,
    orderBy: sort.orderBy ?? 'orderCreatedAt', orderDir: sort.orderDir ?? 'DESC',
  });
  const columns = useMemo<ProColumns<PurchaseReturnDetailLedgerRow>[]>(() => [
    { title: '供应商', dataIndex: 'supplierId', hideInTable: true, ...c.supplierFilterColumn },
    { title: '物料', dataIndex: 'materialId', hideInTable: true, ...c.materialFilterColumn },
    { title: '关键词', dataIndex: 'keyword', hideInTable: true, fieldProps: { placeholder: '退货单号、供应商、来源单号、物料编码/名称/规格或行备注' } },
    { title: '申请日期', dataIndex: 'returnDateRange', valueType: 'dateRange', hideInTable: true, fieldProps: { presets: [...c.dateRangePresets] }, search: { transform: (v: [string,string]) => ({ returnDateStart: v[0], returnDateEnd: v[1] }) } },
    { title: '创建时间', dataIndex: 'createdAtRange', valueType: 'dateRange', hideInTable: true, fieldProps: { presets: [...c.dateRangePresets] }, search: { transform: (v: [string,string]) => ({ createdAtStart: v[0], createdAtEnd: v[1] }) } },
    { title: '状态', dataIndex: 'status', valueType: 'select', valueEnum: c.statusEnum, hideInTable: true, fieldProps: { mode: 'multiple' } },
    { title: '物料名称', dataIndex: 'materialName', width: 180, ellipsis: true, sorter: true, search: false, render: (_, r) => r.material?.name || '-' },
    { title: '物料编码', dataIndex: 'materialCode', width: 150, sorter: true, search: false, render: (_, r) => r.material?.code || '-' },
    { title: '规格', dataIndex: 'materialSpec', width: 150, ellipsis: true, search: false, render: (_, r) => r.material?.spec || '-' },
    { title: '单位', dataIndex: 'unit', width: 95, search: false, render: (_, r) => (r.unit?.trim() ? c.unitLabelMap?.[r.unit.trim()] ?? c.format.formatUnit(r.unit) ?? r.unit.trim() : '-') },
    { title: '退货数量', dataIndex: 'returnQty', width: 110, align: 'right', sorter: true, search: false, render: (_, r) => c.format.formatNumber(r.returnQty) },
    { title: '出库数量', dataIndex: 'outboundQty', width: 110, align: 'right', sorter: true, search: false, render: (_, r) => c.format.formatNumber(r.outboundQty) },
    { title: '状态', dataIndex: 'status', width: 110, valueType: 'select', valueEnum: c.statusEnum, fieldProps: { mode: 'multiple' }, search: false, render: (_, r) => <StatusDisplay value={r.status} enumMap={c.statusEnum} /> },
    ...(priceVisible ? [
      { title: '单价', dataIndex: 'unitPrice', width: 110, align: 'right' as const, search: false, render: (_: unknown, r: PurchaseReturnDetailLedgerRow) => r.unitPrice == null ? '-' : (c.maskAmount?.(c.format.formatCurrency(r.unitPrice)) ?? c.format.formatCurrency(r.unitPrice)) },
      { title: '总金额', dataIndex: 'totalAmount', width: 120, align: 'right' as const, sorter: true, search: false, render: (_: unknown, r: PurchaseReturnDetailLedgerRow) => r.totalAmount == null ? '-' : (c.maskAmount?.(c.format.formatCurrency(r.totalAmount)) ?? c.format.formatCurrency(r.totalAmount)) },
    ] : []),
    ...(c.lineCustomFieldColumns ?? []), ...(c.materialCustomFieldColumns ?? []),
    { title: '批号', dataIndex: 'batchNo', width: 140, search: false, render: (_, r) => r.batchNo || '-' },
    { title: '仓位', dataIndex: 'location', width: 150, ellipsis: true, search: false, render: (_, r) => r.location || '-' },
    { title: '退货单号', dataIndex: 'returnNo', width: 170, sorter: true, search: false, copyable: true, render: (_, r) => c.canViewReturn && r.returnOrderId ? <Button type="link" size="small" onClick={() => c.navigateToReturn?.(r.returnOrderId!)}>{r.returnNo}</Button> : r.returnNo || '-' },
    { title: '退货原因', dataIndex: 'reasonCode', width: 180, ellipsis: true, search: false, render: (_, r) => r.reasonLabelSnapshot || c.reasonLabelMap?.[r.reasonCode ?? ''] || c.legacyReasonLabelMap?.[r.reasonCode ?? ''] || r.reasonCode || '-' },
    { title: '供应商', dataIndex: 'supplierName', width: 170, ellipsis: true, sorter: true, search: false, render: (_, r) => r.supplierName || '-' },
    { title: '来源采购订单', dataIndex: 'sourcePurchaseOrderNo', width: 170, search: false, render: (_, r) => r.sourcePurchaseOrderNo || '-' },
    { title: '来源采购入库单', dataIndex: 'sourceReceiptNo', width: 170, search: false, render: (_, r) => r.sourceReceiptNo || '-' },
    { title: '退库仓库', dataIndex: 'outboundWarehouseName', width: 140, ellipsis: true, search: false, render: (_, r) => r.outboundWarehouseName || '-' },
    { title: '申请日期', dataIndex: 'returnDate', valueType: 'date', width: 120, sorter: true, search: false, render: (_, r) => c.format.formatDate(r.returnDate) },
    { title: '退库出库日期', dataIndex: 'outboundDate', valueType: 'date', width: 120, search: false, render: (_, r) => c.format.formatDate(r.outboundDate) },
    { title: '冲正日期', dataIndex: 'reversalDate', valueType: 'date', width: 120, search: false, render: (_, r) => c.format.formatDate(r.reversalDate) },
    { title: '财务动作', dataIndex: 'financialAction', width: 110, search: false, render: (_, r) => r.financialAction ? <StatusDisplay value={r.financialAction} enumMap={c.financialActionEnum} /> : '-' },
    { title: '创建时间', dataIndex: 'orderCreatedAt', valueType: 'dateTime', width: 160, sorter: true, search: false, render: (_, r) => c.format.formatDateTime(r.orderCreatedAt) },
    { title: '更新时间', dataIndex: 'orderUpdatedAt', valueType: 'dateTime', width: 160, sorter: true, search: false, render: (_, r) => c.format.formatDateTime(r.orderUpdatedAt) },
    { title: '行备注', dataIndex: 'remarks', width: 180, ellipsis: true, search: false, render: (_, r) => r.remarks || '-' },
    ...(c.canViewReturn && c.renderDocumentActions ? [{ title: '更多操作', key: '__returnActions', dataIndex: '__returnActions', valueType: 'option' as const, width: 64, fixed: 'right' as const, search: false, render: (_: unknown, r: PurchaseReturnDetailLedgerRow) => r.returnOrderId ? c.renderDocumentActions?.(r, reload) : null }] : []),
  ], [c, priceVisible]);
  const lightFilter = { formValuesFromFilters: (f: Record<string, unknown>) => ({ returnNo: f.returnNo, supplierId: f.supplierId, materialId: f.materialId, status: f.status, ...restoreDetailLedgerDateRange(f, 'returnDateRange', 'returnDateStart', 'returnDateEnd'), ...restoreDetailLedgerDateRange(f, 'createdAtRange', 'createdAtStart', 'createdAtEnd') }) };
  const fallbackSavedView = c.savedViewController;
  const formatAmount = (value: number | null | undefined) =>
    value == null
      ? '-'
      : (c.maskAmount?.(c.format.formatCurrency(value)) ??
        c.format.formatCurrency(value));
  const footer = summary ? <Space wrap>
    <span>退货单数 {c.format.formatNumber(summary.returnCount)}</span><span>明细行 {c.format.formatNumber(summary.itemCount)}</span><span>物料数 {c.format.formatNumber(summary.materialCount)}</span><span>退货量 {c.format.formatNumber(summary.totalReturnQty)}</span><span>出库量 {c.format.formatNumber(summary.totalOutboundQty)}</span><span>已定价行 {c.format.formatNumber(summary.pricedItemCount)}</span><span>未定价行 {c.format.formatNumber(summary.unpricedItemCount)}</span>
    {priceVisible ? <><span>金额 {formatAmount(summary.amount)}</span><span>折扣金额 {formatAmount(summary.discountAmount)}</span><span>折后金额 {formatAmount(summary.discountedAmount)}</span><span>税额 {formatAmount(summary.taxAmount)}</span><span>总金额 {formatAmount(summary.totalAmount)}</span><span>已定价折后金额 {formatAmount(summary.pricedAmountTotal)}</span></> : null}
  </Space> : null;
  return <>
    <DocumentDetailLedgerTable<PurchaseReturnDetailLedgerRow, PurchaseReturnDetailLedgerQuery, import('./purchase-return-detail-ledger-types').PurchaseReturnDetailLedgerResponse>
      tableActionRef={tableActionRef} filterFormRef={filterFormRef} savedView={fallbackSavedView ? { controller: fallbackSavedView } : undefined}
      initialQuery={{ orderBy: 'orderCreatedAt', orderDir: 'DESC' }} apiFn={c.requestList} buildQuery={buildQuery} columns={columns} exportFn={c.exportExcel}
      exportFileName={c.exportFileName ?? `采购退料明细_${Date.now()}.xlsx`} exportPermission={c.exportPermission} createPermission={c.canCreate ? c.createPermission : undefined} onCreate={onCreate}
      showExport={c.canExport} resizable={{ ...c.resizable, sortPersistenceKey: false }} serverSortFields={c.serverSortFields} scrollX={2300} onViewChange={onViewChange}
      onResponse={(r) => { setSummary(r.summary); setPriceVisible(r.priceVisible); }} footer={footer} lightFilter={lightFilter}
    />
    {c.renderLifecycle?.(reload)}
  </>;
}
