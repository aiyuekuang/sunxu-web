import type { ProColumns } from '@ant-design/pro-components';
import { useMemo, useState } from 'react';
import { Button, Space } from 'antd';
import { DocumentDetailLedgerTable } from '../documents/DocumentDetailLedgerTable';
import { restoreDetailLedgerDateRange } from '../documents/DetailLedgerFilterDrawer';
import { StatusDisplay } from '../../../components/StatusDisplay';
import { EntityThumbnail } from '../documents/EntityThumbnail';
import { useSalesDetailLedgerBatchPrint } from './SalesDetailLedgerComponents';
import type { QuotationDetailLedgerProps, QuotationDetailLedgerQuery, QuotationDetailLedgerRow, QuotationDetailLedgerSummary, QuotationDetailLedgerResponse } from './quotation-detail-ledger-types';

/**
 * @sunxu-layer business
 * @sunxu-domain sales
 * @sunxu-reason Preserves quotation detail filters, amount display, custom columns and batch print mapping while data services, permissions, navigation and modal actions stay host supplied.
 * Quotation detail view embedded by its host route.
 */
export function QuotationDetailLedger({ capabilities: c, initialStatuses = ['draft', 'submitted', 'sent', 'accepted', 'rejected', 'expired'], initialDateRange, onCreate, onViewChange, tableActionRef, filterFormRef }: QuotationDetailLedgerProps) {
  const [summary, setSummary] = useState<QuotationDetailLedgerSummary>();
  const [priceVisible, setPriceVisible] = useState(false);
  const reload = () => tableActionRef?.current?.reload();
  const batchPrint = useSalesDetailLedgerBatchPrint({
    canPrint: c.print.canPrint,
    getRowKey: (row: QuotationDetailLedgerRow) => row.id,
    actions: [{ label: '批量打印', getPrintParams: (row: QuotationDetailLedgerRow) => row.quotationId ? { businessType: 'quotation', businessId: row.quotationId } : null }],
    openPrintBatch: c.print.openPrintBatch,
  });
  const buildQuery = (params: Record<string, unknown>, sort: Pick<QuotationDetailLedgerQuery, 'orderBy' | 'orderDir'> = {}): QuotationDetailLedgerQuery => {
    const state = params.statuses ?? params.status;
    const query: QuotationDetailLedgerQuery = {
      keyword: params.keyword || undefined,
      status: Array.isArray(state) ? undefined : state,
      statuses: Array.isArray(state) ? state : undefined,
      customerId: params.customerId || undefined, materialId: params.materialId || undefined,
      startDate: params.startDate || undefined, endDate: params.endDate || undefined,
      orderBy: sort.orderBy ?? 'quotationDate', orderDir: sort.orderDir ?? 'DESC',
    };
    if (!query.startDate && initialDateRange?.[0]) query.startDate = initialDateRange[0];
    if (!query.endDate && initialDateRange?.[1]) query.endDate = initialDateRange[1];
    return query;
  };
  const renderRate = (value?: number | null) => value == null ? '-' : `${Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 4 })}%`;
  const columns = useMemo<ProColumns<QuotationDetailLedgerRow>[]>(() => [
    { title: '客户', dataIndex: 'customerId', hideInTable: true, ...c.customerFilterColumn },
    { title: '物料', dataIndex: 'materialId', hideInTable: true, ...c.materialFilterColumn },
    { title: '关键词', dataIndex: 'keyword', hideInTable: true, fieldProps: { placeholder: '报价单号、客户、产品编码/名称/规格或行备注' } },
    { title: '报价日期', dataIndex: 'quotationDateRange', valueType: 'dateRange', hideInTable: true, fieldProps: { presets: [...c.dateRangePresets] }, search: { transform: (v: [string,string]) => ({ startDate: v[0], endDate: v[1] }) } },
    { title: '产品编码', dataIndex: 'materialCode', width: 150, sorter: true, search: false, render: (_, r) => r.customerMaterialCode || r.material?.code || '-' },
    { title: '产品名称', dataIndex: 'materialName', width: 180, ellipsis: true, sorter: true, search: false, render: (_, r) => r.customerMaterialName || r.material?.name || '-' },
    { title: '规格', dataIndex: 'materialSpec', width: 160, ellipsis: true, search: false, render: (_, r) => r.customerMaterialSpec || r.material?.spec || '-' },
    { title: '单位', dataIndex: 'materialUnit', width: 90, search: false, render: (_, r) => { const unit = r.material?.unit?.trim(); return unit ? c.unitLabelMap?.[unit] ?? c.format.formatUnit(unit) ?? unit : '-'; } },
    { title: '报价数量', dataIndex: 'quantity', width: 110, align: 'right', sorter: true, search: false, render: (_, r) => c.format.formatNumber(r.quantity) },
    ...(c.materialCustomFieldColumns ?? []), ...(c.lineCustomFieldColumns ?? []),
    { title: '报价日期', dataIndex: 'quotationDate', valueType: 'date', width: 120, sorter: true, defaultSortOrder: 'descend', search: false, render: (_, r) => c.format.formatDate(r.quotation?.quotationDate) },
    { title: '创建时间', dataIndex: 'createdAt', valueType: 'dateTime', width: 160, sorter: true, search: false, render: (_, r) => c.format.formatDateTime(r.createdAt) },
    { title: '更新时间', dataIndex: 'updatedAt', valueType: 'dateTime', width: 160, sorter: true, search: false, render: (_, r) => c.format.formatDateTime(r.updatedAt) },
    { title: '状态', dataIndex: 'status', width: 110, valueType: 'select', valueEnum: c.statusEnum, fieldProps: { mode: 'multiple' }, render: (_, r) => <StatusDisplay value={r.quotation?.status} enumMap={c.statusEnum} /> },
    { title: '报价单号', dataIndex: 'quotationNo', width: 170, sorter: true, search: false, render: (_, r) => { const q = r.quotation; if (!q) return '-'; return c.canViewQuotation && q.id ? <Button type="link" size="small" onClick={() => c.navigateToQuotation?.(q.id)}>{q.quotationNo}</Button> : q.quotationNo || '-'; } },
    { title: '客户', dataIndex: 'customerName', width: 160, ellipsis: true, sorter: true, search: false, render: (_, r) => r.quotation?.customer?.name || '-' },
    { title: '收款条件', dataIndex: 'paymentTerms', width: 120, ellipsis: true, search: false, render: (_, r) => r.quotation?.paymentTerms ? (c.paymentTermsLabelMap?.[r.quotation.paymentTerms] ?? r.quotation.paymentTerms) : '-' },
    { title: '物料图', dataIndex: 'materialThumbnail', width: 80, search: false, render: (_, r) => c.renderMaterialThumbnail ? c.renderMaterialThumbnail(r) : <EntityThumbnail thumbnailUrl={r.material?.thumbnailUrl ?? null} previewUrl={r.material?.primaryImageUrl ?? r.material?.thumbnailUrl ?? null} alt="物料图片" size={36} /> },
    ...(priceVisible ? [
      { title: '单价', dataIndex: 'unitPrice', width: 120, align: 'right' as const, sorter: true, search: false, render: (_: unknown, r: QuotationDetailLedgerRow) => r.unitPrice == null ? '-' : c.maskAmount(c.format.formatCurrency(r.unitPrice)) },
      { title: '金额', dataIndex: 'amount', width: 130, align: 'right' as const, sorter: true, search: false, render: (_: unknown, r: QuotationDetailLedgerRow) => r.amount == null ? '-' : c.maskAmount(c.format.formatCurrency(r.amount)) },
      { title: '折扣%', dataIndex: 'discountRate', width: 110, align: 'right' as const, sorter: true, search: false, render: (_: unknown, r: QuotationDetailLedgerRow) => renderRate(r.discountRate) },
      { title: '税率%', dataIndex: 'taxRate', width: 110, align: 'right' as const, sorter: true, search: false, render: (_: unknown, r: QuotationDetailLedgerRow) => renderRate(r.taxRate) },
      { title: '税额', dataIndex: 'taxAmount', width: 130, align: 'right' as const, sorter: true, search: false, render: (_: unknown, r: QuotationDetailLedgerRow) => r.taxAmount == null ? '-' : c.maskAmount(c.format.formatCurrency(r.taxAmount)) },
      { title: '总金额', dataIndex: 'totalAmount', width: 130, align: 'right' as const, sorter: true, search: false, render: (_: unknown, r: QuotationDetailLedgerRow) => r.totalAmount == null ? '-' : c.maskAmount(c.format.formatCurrency(r.totalAmount)) },
      { title: '单价含税', dataIndex: 'priceIncludesTax', width: 110, align: 'center' as const, sorter: true, search: false, render: (_: unknown, r: QuotationDetailLedgerRow) => r.priceIncludesTax == null ? '-' : r.priceIncludesTax ? '是' : '否' },
    ] : []),
    { title: '行备注', dataIndex: 'remarks', width: 180, ellipsis: true, search: false, render: (_, r) => r.remarks || '-' },
    ...(c.canViewQuotation ? [{ title: '更多操作', dataIndex: '__quotationActions', key: '__quotationActions', valueType: 'option' as const, width: 64, fixed: 'right' as const, search: false, render: (_: unknown, r: QuotationDetailLedgerRow) => r.quotation ? c.renderDocumentActions(r, reload, { onBindMaterials: c.onBindMaterials, onViewOrders: c.navigateToOrders }) : null }] : []),
  ], [c, priceVisible]);
  const lightFilter = { formValuesFromFilters: (f: Record<string, unknown>) => {
    const rawStatuses = typeof f.statuses === 'string' ? f.statuses.split(',') : f.statuses;
    const statusValues = Array.isArray(rawStatuses) ? rawStatuses : [rawStatuses];
    const statuses = statusValues.filter((value): value is string => typeof value === 'string' && value.length > 0);
    const allowedStatuses = new Set(Object.keys(c.statusEnum));
    return {
      customerId: f.customerId,
      materialId: f.materialId,
      statuses: statuses.length === 0 || statuses.some((status) => !allowedStatuses.has(status)) ? [] : statuses,
      ...restoreDetailLedgerDateRange(f, 'quotationDateRange'),
    };
  } };
  const footer = summary ? <Space wrap>
    <span>报价单数 {c.format.formatNumber(summary.quotationCount)}</span><span>报价明细行 {c.format.formatNumber(summary.itemCount)}</span><span>报价数量 {c.format.formatNumber(summary.totalQty)}</span>
    {priceVisible ? <><span>金额 {summary.amount == null ? '-' : c.maskAmount(c.format.formatCurrency(summary.amount))}</span><span>折扣金额 {summary.discountAmount == null ? '-' : c.maskAmount(c.format.formatCurrency(summary.discountAmount))}</span><span>折后金额 {summary.discountedAmount == null ? '-' : c.maskAmount(c.format.formatCurrency(summary.discountedAmount))}</span><span>税额 {summary.taxAmount == null ? '-' : c.maskAmount(c.format.formatCurrency(summary.taxAmount))}</span><span>总金额 {summary.totalAmount == null ? '-' : c.maskAmount(c.format.formatCurrency(summary.totalAmount))}</span></> : null}
  </Space> : null;
  return <>
    <DocumentDetailLedgerTable<QuotationDetailLedgerRow, QuotationDetailLedgerQuery, QuotationDetailLedgerResponse>
      tableActionRef={tableActionRef} filterFormRef={filterFormRef} savedView={c.savedViewController ? { controller: c.savedViewController } : undefined}
      initialQuery={{ orderBy: 'quotationDate', orderDir: 'DESC' }} initialFilters={{ statuses: initialStatuses, ...(initialDateRange ? { startDate: initialDateRange[0], endDate: initialDateRange[1] } : {}) }}
      apiFn={c.requestList} buildQuery={buildQuery} columns={columns} exportFn={c.exportExcel} exportFileName={c.exportFileName ?? `报价单明细_${Date.now()}.xlsx`}
      exportPermission={c.exportPermission} exportLabel={priceVisible ? '导出明细' : '导出明细（不含金额）'} showExport={c.canExport} createPermission={c.canCreate ? c.createPermission : undefined}
      onCreate={onCreate} resizable={{ ...(c.resizableForPriceVisibility?.(priceVisible) ?? c.resizable), sortPersistenceKey: false }} serverSortFields={c.serverSortFields} scrollX={3180} onViewChange={onViewChange}
      rowSelection={batchPrint.rowSelection} tableAlertOptionRender={batchPrint.tableAlertOptionRender} toolbarExtra={c.amountDisplayToggle}
      onResponse={(r) => { setPriceVisible(r.priceVisible); c.onPriceVisibilityChange?.(r.priceVisible); setSummary(r.summary); }} footer={footer} lightFilter={lightFilter}
    />
    {c.renderLifecycle?.(reload)}
  </>;
}
