import type { ProColumns } from '@ant-design/pro-components';
import { useMemo, useState } from 'react';
import { Space } from 'antd';
import { DocumentDetailLedgerTable } from '../documents/DocumentDetailLedgerTable';
import { restoreDetailLedgerDateRange } from '../documents/DetailLedgerFilterDrawer';
import { StatusDisplay } from '../../../components/StatusDisplay';
import type { MaterialIssueDetailLedgerProps, MaterialIssueDetailLedgerQuery, MaterialIssueDetailLedgerRow, MaterialIssueDetailLedgerSummary } from './material-issue-detail-ledger-types';

/**
 * @sunxu-layer business
 * @sunxu-domain inventory
 * @sunxu-reason Preserves production issue filters, quantities, status, custom fields and summary while requests, permissions, routes and document actions stay host supplied.
 * Embedded production material issue detail subview.
 */
export function MaterialIssueDetailLedger({ capabilities: c, initialFilters, onCreate, onViewChange, tableActionRef, filterFormRef }: MaterialIssueDetailLedgerProps) {
  const [summary, setSummary] = useState<MaterialIssueDetailLedgerSummary>();
  const reload = () => tableActionRef?.current?.reload();
  const buildQuery = (params: Record<string, unknown>, sort: Pick<MaterialIssueDetailLedgerQuery, 'orderBy' | 'orderDir'> = {}): MaterialIssueDetailLedgerQuery => {
    const rawStatus = params.statuses ?? params.status;
    const rawType = params.type;
    const selectedType = rawType === 'auto_issue' || rawType === 'manual_issue' ? rawType : undefined;
    return {
      keyword: params.keyword || undefined, issueNo: params.issueNo || undefined, orderNo: params.orderNo || undefined,
      status: Array.isArray(rawStatus) ? undefined : rawStatus, statuses: Array.isArray(rawStatus) ? rawStatus : undefined,
      type: selectedType, types: selectedType ? undefined : ['auto_issue', 'manual_issue'],
      materialId: params.materialId || undefined, warehouseId: params.warehouseId || undefined, batchNo: params.batchNo || undefined,
      startDate: params.startDate || undefined, endDate: params.endDate || undefined,
      plannedStartDate: params.plannedStartDate || undefined, plannedEndDate: params.plannedEndDate || undefined,
      confirmedStartDate: params.confirmedStartDate || undefined, confirmedEndDate: params.confirmedEndDate || undefined,
      operatorName: params.operatorName || undefined,
      orderBy: sort.orderBy ?? 'confirmedAt', orderDir: sort.orderDir ?? 'DESC',
    };
  };
  const columns = useMemo<ProColumns<MaterialIssueDetailLedgerRow>[]>(() => [
    { title: '关键词', dataIndex: 'keyword', hideInTable: true, fieldProps: { placeholder: '领料单号、工单号、物料、批号或行备注' } },
    { title: '领料单号', dataIndex: 'issueNo', hideInTable: true },
    { title: '关联工单号', dataIndex: 'orderNo', hideInTable: true },
    { title: '物料', dataIndex: 'materialId', hideInTable: true, ...c.materialFilterColumn },
    { title: '出库仓库', dataIndex: 'warehouseId', hideInTable: true, ...c.warehouseFilterColumn },
    { title: '批号', dataIndex: 'batchNo', hideInTable: true },
    { title: '发生日期', dataIndex: 'dateRange', hideInTable: true, valueType: 'dateRange', fieldProps: { presets: [...c.dateRangePresets] }, search: { transform: (v: [string,string]) => ({ startDate: v[0], endDate: v[1] }) } },
    { title: '计划发料日期', dataIndex: 'plannedDateRange', hideInTable: true, valueType: 'dateRange', fieldProps: { presets: [...c.dateRangePresets] }, search: { transform: (v: [string,string]) => ({ plannedStartDate: v[0], plannedEndDate: v[1] }) } },
    { title: '确认日期', dataIndex: 'confirmedDateRange', hideInTable: true, valueType: 'dateRange', fieldProps: { presets: [...c.dateRangePresets] }, search: { transform: (v: [string,string]) => ({ confirmedStartDate: v[0], confirmedEndDate: v[1] }) } },
    { title: '领料人', dataIndex: 'operatorName', hideInTable: true },
    { title: '物料名称', dataIndex: 'materialName', width: 180, ellipsis: true, sorter: true, search: false, render: (_, r) => r.material?.name || '-' },
    { title: '物料编码', dataIndex: 'materialCode', width: 150, sorter: true, search: false, render: (_, r) => r.material?.code || '-' },
    { title: '规格型号', dataIndex: 'materialSpec', width: 150, ellipsis: true, sorter: true, search: false, render: (_, r) => r.material?.spec || '-' },
    { title: '单位', dataIndex: 'materialUnit', width: 90, search: false, render: (_, r) => { const unit = r.material?.unit?.trim(); return unit ? c.unitLabelMap?.[unit] ?? c.format.formatUnit(unit) ?? unit : '-'; } },
    { title: '需求数量', dataIndex: 'requiredQty', width: 120, align: 'right', sorter: true, search: false, render: (_, r) => c.format.formatNumber(r.requiredQty) },
    { title: '实发数量', dataIndex: 'actualQty', width: 120, align: 'right', sorter: true, search: false, render: (_, r) => c.format.formatNumber(r.actualQty) },
    { title: '录入数量', dataIndex: 'issueQty', width: 120, align: 'right', sorter: true, search: false, render: (_, r) => r.issueQty == null ? '-' : c.format.formatNumber(r.issueQty) },
    { title: '录入单位', dataIndex: 'issueUnit', width: 100, search: false, render: (_, r) => { const unit = r.issueUnit?.trim(); return unit ? c.unitLabelMap?.[unit] ?? c.format.formatUnit(unit) ?? unit : '-'; } },
    ...(c.materialCustomFieldColumns ?? []), ...(c.lineCustomFieldColumns ?? []),
    { title: '领料单号', dataIndex: 'issueNo', width: 170, sorter: true, search: false, render: (_, r) => { const order = r.issueOrder; return order?.id && c.canViewRequest ? <a onClick={() => c.navigateToRequest?.(order.id)}>{order.issueNo}</a> : order?.issueNo || '-'; } },
    { title: '关联工单', dataIndex: 'orderNo', width: 170, sorter: true, search: false, render: (_, r) => r.issueOrder?.workOrder?.orderNo || '-' },
    { title: '类型', dataIndex: 'type', width: 110, valueType: 'select', valueEnum: c.typeEnum, fieldProps: { mode: 'multiple' }, search: true, render: (_, r) => r.issueOrder?.type ? <StatusDisplay value={r.issueOrder.type} enumMap={c.typeEnum} /> : '-' },
    { title: '状态', dataIndex: 'status', width: 110, valueType: 'select', valueEnum: c.statusEnum, search: true, render: (_, r) => r.issueOrder?.status ? <StatusDisplay value={r.issueOrder.status} enumMap={c.statusEnum} /> : '-' },
    { title: '出库仓库', dataIndex: 'warehouseName', width: 140, search: false, render: (_, r) => r.warehouse?.name || r.warehouseName || '-' },
    { title: '出库仓位', dataIndex: 'storageLocation', width: 160, ellipsis: true, search: false, render: (_, r) => r.location?.pathName || r.storageLocationSnapshot || '-' },
    { title: '批号', dataIndex: 'batchNo', width: 140, search: false, render: (_, r) => r.batchNo || '-' },
    { title: '计划发料日期', dataIndex: 'plannedIssueAt', width: 130, valueType: 'date', sorter: true, search: false, render: (_, r) => c.format.formatDate(r.issueOrder?.plannedIssueAt) },
    { title: '确认日期', dataIndex: 'confirmedAt', width: 130, valueType: 'date', sorter: true, search: false, render: (_, r) => c.format.formatDate(r.issueOrder?.confirmedAt) },
    { title: '创建时间', dataIndex: 'createdAt', width: 160, valueType: 'dateTime', sorter: true, search: false, render: (_, r) => c.format.formatDateTime(r.createdAt) },
    { title: '更新时间', dataIndex: 'updatedAt', width: 160, valueType: 'dateTime', sorter: true, search: false, render: (_, r) => c.format.formatDateTime(r.updatedAt) },
    { title: '领料人', dataIndex: 'operatorName', width: 110, render: (_, r) => r.issueOrder?.operator?.realName || r.issueOrder?.operator?.username || '-' },
    { title: '行备注', dataIndex: 'remarks', width: 180, ellipsis: true, search: false, render: (_, r) => r.remarks || '-' },
    ...(c.canViewRequest ? [{ title: '更多操作', dataIndex: '__issueActions', key: '__issueActions', valueType: 'option' as const, width: 64, fixed: 'right' as const, search: false, render: (_: unknown, r: MaterialIssueDetailLedgerRow) => r.issueOrder?.id ? c.renderDocumentActions(r, reload) : null }] : []),
  ], [c]);
  const lightFilter = { formValuesFromFilters: (f: Record<string, unknown>) => ({ issueNo: f.issueNo, orderNo: f.orderNo, materialId: f.materialId, warehouseId: f.warehouseId, status: f.status, type: f.type, batchNo: f.batchNo, operatorName: f.operatorName, ...restoreDetailLedgerDateRange(f, 'dateRange'), ...restoreDetailLedgerDateRange(f, 'plannedDateRange', 'plannedStartDate', 'plannedEndDate'), ...restoreDetailLedgerDateRange(f, 'confirmedDateRange', 'confirmedStartDate', 'confirmedEndDate') }) };
  const footer = summary ? <Space wrap><span>领料单数 {c.format.formatNumber(summary.issueOrderCount)}</span><span>明细行 {c.format.formatNumber(summary.itemCount)}</span><span>物料数 {c.format.formatNumber(summary.materialCount)}</span><span>需求数量 {c.format.formatNumber(summary.requiredQty)}</span><span>实发数量 {c.format.formatNumber(summary.actualQty)}</span><span>录入数量 {c.format.formatNumber(summary.issueQty)}</span></Space> : null;
  return <>
    <DocumentDetailLedgerTable<MaterialIssueDetailLedgerRow, MaterialIssueDetailLedgerQuery, import('./material-issue-detail-ledger-types').MaterialIssueDetailLedgerResponse>
      tableActionRef={tableActionRef} filterFormRef={filterFormRef} savedView={c.savedViewController ? { controller: c.savedViewController } : undefined}
      initialQuery={{ orderBy: 'confirmedAt', orderDir: 'DESC' }} initialFilters={initialFilters}
      apiFn={c.requestList} buildQuery={buildQuery} columns={columns} exportFn={async (q) => { const blob = await c.exportExcel(q); if (!(blob instanceof Blob)) throw new Error('生产领料明细导出响应不是文件'); return blob; }}
      exportFileName={c.exportFileName ?? `生产领料明细_${Date.now()}.xlsx`} exportPermission={c.exportPermission} createPermission={c.canCreate ? c.createPermission : undefined} onCreate={onCreate}
      showExport={c.canExport} resizable={{ ...c.resizable, sortPersistenceKey: false }} serverSortFields={c.serverSortFields} scrollX={2850} onViewChange={onViewChange}
      onResponse={(r) => setSummary(r.summary)} footer={footer} lightFilter={lightFilter}
    />
    {c.renderLifecycle?.(reload)}
  </>;
}
