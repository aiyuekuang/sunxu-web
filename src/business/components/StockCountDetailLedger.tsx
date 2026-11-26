import { Button } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { DocumentDetailLedgerTable } from './DocumentDetailLedgerTable';
import { StatusDisplay } from '../../components/StatusDisplay';
import { formatUnitLabel } from '../utils/qty-unit';
import type {
  StockCountDetailLedgerCapabilities,
  StockCountDetailLedgerProps,
  StockCountDetailLedgerQuery,
  StockCountDetailLedgerResponse,
  StockCountDetailLedgerRow,
  StockCountDetailLedgerStatus,
} from './stock-count-detail-ledger-types';

function formatStatusLabel(
  status: string | null | undefined,
  statusMap: StockCountDetailLedgerCapabilities['statusMap'],
) {
  if (!status) return '-';
  return <StatusDisplay value={status} enumMap={statusMap} />;
}

function restoreDateRange(filters: Record<string, unknown>) {
  const startDate = filters.startDate;
  const endDate = filters.endDate;
  return {
    dateRange:
      typeof startDate === 'string' && typeof endDate === 'string'
        ? [dayjs(startDate), dayjs(endDate)]
        : undefined,
  };
}

async function exportStockCountDetails(
  capabilities: StockCountDetailLedgerCapabilities,
  query: StockCountDetailLedgerQuery,
) {
  const result: unknown = await capabilities.exportExcel(query);
  if (!(result instanceof Blob)) {
    throw new Error('库存盘点明细导出响应不是文件');
  }
  return result;
}

/**
 * @sunxu-layer business
 * @sunxu-domain warehouse-stock-count-detail-ledger
 * @sunxu-reason Preserves the inventory-count detail ledger UI while the MES host supplies list/export APIs, permission results, selectors, dynamic field columns, saved views, batch printing, formatting, and document actions.
 */
export function StockCountDetailLedger({
  onViewChange,
  onOpenDetail,
  onCreate,
  tableActionRef,
  filterFormRef,
  savedViewController,
  rowSelection,
  tableAlertOptionRender,
  printJobActionNode,
  capabilities,
}: StockCountDetailLedgerProps) {
  const [summary, setSummary] = useState<{
    itemCount: number;
    stockCountOrderCount: number;
    materialCount: number;
    bookQty: number;
    actualQty: number;
    varianceQty: number;
  }>();

  const columns = useMemo<ProColumns<StockCountDetailLedgerRow>[]>(
    () => [
      {
        title: '关键词',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: { placeholder: '盘点单号、物料、批号或行备注' },
      },
      { title: '盘点单号', dataIndex: 'countNo', hideInTable: true },
      {
        title: '物料',
        dataIndex: 'materialId',
        hideInTable: true,
        ...capabilities.filterColumnProps?.material,
      },
      {
        title: '仓库',
        dataIndex: 'warehouseId',
        hideInTable: true,
        ...capabilities.filterColumnProps?.warehouse,
      },
      {
        title: '仓位',
        dataIndex: 'locationId',
        hideInTable: true,
        search: capabilities.showLocationControl,
        valueType: 'select',
        ...capabilities.filterColumnProps?.location,
        fieldProps: { showSearch: true, filterOption: false },
      },
      { title: '批号', dataIndex: 'batchNo', hideInTable: true },
      {
        title: '盘点日期',
        dataIndex: 'dateRange',
        hideInTable: true,
        valueType: 'dateRange',
        fieldProps: { presets: capabilities.dateRangePresets },
        search: {
          transform: (value: [string, string]) => ({
            startDate: value[0],
            endDate: value[1],
          }),
        },
      },
      {
        title: '物料名称',
        dataIndex: 'materialName',
        width: 180,
        sorter: true,
        search: false,
        render: (_: unknown, record: StockCountDetailLedgerRow) =>
          record.material?.name ?? '-',
      },
      {
        title: '物料编码',
        dataIndex: 'materialCode',
        width: 150,
        sorter: true,
        search: false,
        render: (_: unknown, record: StockCountDetailLedgerRow) =>
          record.material?.code ?? '-',
      },
      {
        title: '规格型号',
        dataIndex: 'materialSpec',
        width: 150,
        search: false,
        render: (_: unknown, record: StockCountDetailLedgerRow) =>
          record.material?.spec ?? '-',
      },
      {
        title: '单位',
        dataIndex: 'materialUnit',
        width: 90,
        search: false,
        render: (_: unknown, record: StockCountDetailLedgerRow) =>
          formatUnitLabel(
            record.material?.unit,
            capabilities.materialUnitLabelMap,
          ) || '-',
      },
      {
        title: '账面数量',
        dataIndex: 'bookQty',
        width: 120,
        align: 'right',
        sorter: true,
        search: false,
        render: (_: unknown, record: StockCountDetailLedgerRow) =>
          capabilities.formatNumber(record.bookQty),
      },
      {
        title: '实盘数量',
        dataIndex: 'actualQty',
        width: 120,
        align: 'right',
        sorter: true,
        search: false,
        render: (_: unknown, record: StockCountDetailLedgerRow) =>
          record.actualQty == null
            ? '-'
            : capabilities.formatNumber(record.actualQty),
      },
      {
        title: '差异数量',
        dataIndex: 'varianceQty',
        width: 120,
        align: 'right',
        sorter: true,
        search: false,
        render: (_: unknown, record: StockCountDetailLedgerRow) =>
          record.varianceQty == null
            ? '-'
            : capabilities.formatNumber(record.varianceQty),
      },
      ...capabilities.documentLineCustomFieldColumns,
      ...capabilities.materialCustomFieldColumns,
      {
        title: '盘点单号',
        dataIndex: 'countNo',
        width: 170,
        sorter: true,
        search: false,
        render: (_: unknown, record: StockCountDetailLedgerRow) => {
          const countNo = record.order?.countNo;
          return countNo && capabilities.canViewStockCount ? (
            <Button
              type="link"
              size="small"
              onClick={() => {
                onViewChange?.('orders');
                onOpenDetail(record.orderId);
              }}
            >
              {countNo}
            </Button>
          ) : (
            (countNo ?? '-')
          );
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 105,
        valueType: 'select',
        valueEnum: capabilities.statusMap,
        fieldProps: { mode: 'multiple' },
        render: (_: unknown, record: StockCountDetailLedgerRow) =>
          formatStatusLabel(record.order?.status, capabilities.statusMap),
      },
      {
        title: '仓库',
        dataIndex: 'warehouseName',
        width: 140,
        search: false,
        render: (_: unknown, record: StockCountDetailLedgerRow) =>
          record.warehouse?.name ?? '-',
      },
      {
        title: '仓位',
        dataIndex: 'locationName',
        width: 160,
        search: false,
        render: (_: unknown, record: StockCountDetailLedgerRow) =>
          record.location?.pathName ||
          record.location?.name ||
          record.storageLocationSnapshot ||
          '-',
      },
      { title: '批号', dataIndex: 'batchNo', width: 130, search: false },
      {
        title: '审核时间',
        dataIndex: 'approvedAt',
        valueType: 'dateTime',
        width: 170,
        sorter: true,
        search: false,
        render: (_: unknown, record: StockCountDetailLedgerRow) =>
          capabilities.formatDateTime(record.order?.approvedAt),
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        valueType: 'dateTime',
        width: 170,
        sorter: true,
        search: false,
        render: (_: unknown, record: StockCountDetailLedgerRow) =>
          capabilities.formatDateTime(record.createdAt),
      },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        valueType: 'dateTime',
        width: 170,
        sorter: true,
        search: false,
        render: (_: unknown, record: StockCountDetailLedgerRow) =>
          capabilities.formatDateTime(record.updatedAt),
      },
      {
        title: '行备注',
        dataIndex: 'remarks',
        width: 180,
        ellipsis: true,
        search: false,
      },
    ],
    [capabilities, onOpenDetail, onViewChange],
  );

  const lightFilter = useMemo(
    () => ({
      formValuesFromFilters: (filters: Record<string, unknown>) => ({
        countNo: filters.countNo,
        status: filters.status,
        materialId: filters.materialId,
        warehouseId: filters.warehouseId,
        locationId: capabilities.showLocationControl
          ? filters.locationId
          : undefined,
        batchNo: filters.batchNo,
        ...restoreDateRange(filters),
      }),
    }),
    [capabilities.showLocationControl],
  );

  return (
    <>
      <DocumentDetailLedgerTable<
        StockCountDetailLedgerRow,
        StockCountDetailLedgerQuery,
        StockCountDetailLedgerResponse
      >
        tableActionRef={tableActionRef}
        rowSelection={rowSelection}
        tableAlertOptionRender={tableAlertOptionRender}
        filterFormRef={filterFormRef}
        savedView={{ controller: savedViewController }}
        initialQuery={{
          status: 'approved',
          orderBy: 'approvedAt',
          orderDir: 'DESC',
        }}
        apiFn={capabilities.requestList}
        buildQuery={(params, sortQuery) => ({
          keyword: params.keyword as string | undefined,
          countNo: params.countNo as string | undefined,
          status: Array.isArray(params.statuses)
            ? undefined
            : Array.isArray(params.status)
              ? undefined
              : ((params.status as StockCountDetailLedgerStatus | undefined) ??
                'approved'),
          statuses: (Array.isArray(params.statuses)
            ? params.statuses
            : Array.isArray(params.status)
              ? params.status
              : undefined) as StockCountDetailLedgerStatus[] | undefined,
          warehouseId: params.warehouseId as string | undefined,
          locationId: capabilities.showLocationControl
            ? (params.locationId as string | undefined)
            : undefined,
          materialId: params.materialId as string | undefined,
          batchNo: params.batchNo as string | undefined,
          startDate: params.startDate as string | undefined,
          endDate: params.endDate as string | undefined,
          orderBy: sortQuery.orderBy ?? 'approvedAt',
          orderDir: sortQuery.orderDir ?? 'DESC',
        })}
        columns={columns}
        exportFn={(query) => exportStockCountDetails(capabilities, query)}
        exportFileName={`库存盘点明细_${Date.now()}.xlsx`}
        exportPermission={capabilities.exportPermission}
        createPermission={capabilities.createPermission}
        onCreate={onCreate}
        resizable={capabilities.resizable}
        serverSortFields={capabilities.serverSortFields}
        scrollX={2440}
        onViewChange={onViewChange}
        onResponse={(response) => setSummary(response.summary)}
        footer={
          summary ? (
            <>
              <span>盘点单数 {capabilities.formatNumber(summary.stockCountOrderCount)}</span>
              <span>明细行 {capabilities.formatNumber(summary.itemCount)}</span>
              <span>物料数 {capabilities.formatNumber(summary.materialCount)}</span>
              <span>账面数量 {capabilities.formatNumber(summary.bookQty)}</span>
              <span>实盘数量 {capabilities.formatNumber(summary.actualQty)}</span>
              <span>差异数量 {capabilities.formatNumber(summary.varianceQty)}</span>
            </>
          ) : null
        }
        lightFilter={lightFilter}
      />
      {printJobActionNode}
    </>
  );
}
