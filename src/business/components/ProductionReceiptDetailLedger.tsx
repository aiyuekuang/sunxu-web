import { Button, Typography } from 'antd';
import { useMemo, useState } from 'react';
import type { ProColumns } from '@ant-design/pro-components';
import { DocumentDetailLedgerTable } from './DocumentDetailLedgerTable';
import { restoreDetailLedgerDateRange } from './DetailLedgerFilterDrawer';
import { StatusDisplay } from '../../components/StatusDisplay';
import type {
  ProductionReceiptDetailLedgerProps,
  ProductionReceiptDetailLedgerQuery,
  ProductionReceiptDetailLedgerRow,
  ProductionReceiptDetailLedgerSummary,
} from './detail-ledger-components-types';

function fieldPropsObject<Row extends object>(
  fieldProps: ProColumns<Row>['fieldProps'],
): Record<string, unknown> {
  return fieldProps && typeof fieldProps === 'object'
    ? (fieldProps as Record<string, unknown>)
    : {};
}

/**
 * @sunxu-layer business
 * @sunxu-domain production-receipt-detail-ledger
 * @sunxu-reason Keeps production-receipt filters, material and dynamic columns, summary, permission-aware detail link, and batch-print selection visible while MES requests, dictionaries, permissions, and navigation stay host supplied.
 * Embedded production-receipt detail ledger; callers own its data and page lifecycle.
 */
export function ProductionReceiptDetailLedger({
  capabilities,
  onOpenReceipt,
  onViewChange,
  tableActionRef,
  filterFormRef,
  savedViewController,
}: ProductionReceiptDetailLedgerProps) {
  const [summary, setSummary] = useState<ProductionReceiptDetailLedgerSummary>();

  const buildQuery = (
    params: Record<string, unknown>,
    sortQuery: Pick<ProductionReceiptDetailLedgerQuery, 'orderBy' | 'orderDir'> = {},
  ): ProductionReceiptDetailLedgerQuery => ({
    keyword: params.keyword as string | undefined,
    status: Array.isArray(params.statuses)
      ? undefined
      : ((Array.isArray(params.status)
          ? undefined
          : (params.status as string | undefined)) ?? 'received'),
    statuses: (Array.isArray(params.statuses)
      ? params.statuses
      : Array.isArray(params.status)
        ? params.status
        : undefined) as string[] | undefined,
    workOrderId: params.workOrderId as string | undefined,
    materialId: params.materialId as string | undefined,
    warehouseId: params.warehouseId as string | undefined,
    locationId: params.locationId as string | undefined,
    batchNo: params.batchNo as string | undefined,
    packageNo: params.packageNo as string | undefined,
    startDate: params.startDate as string | undefined,
    endDate: params.endDate as string | undefined,
    orderBy: sortQuery.orderBy ?? 'confirmedAt',
    orderDir: sortQuery.orderDir ?? 'DESC',
  });

  const columns = useMemo<ProColumns<ProductionReceiptDetailLedgerRow>[]>(
    () => [
      {
        title: '关键词',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: { placeholder: '生产入库单编号、工单号、物料或批号' },
      },
      {
        ...capabilities.materialFilterColumn,
        title: '物料',
        dataIndex: 'materialId',
        hideInTable: true,
      },
      {
        ...capabilities.warehouseFilterColumn,
        title: '入库仓库',
        dataIndex: 'warehouseId',
        hideInTable: true,
      },
      {
        ...capabilities.locationFilterColumn,
        title: '入库仓位',
        dataIndex: 'locationId',
        hideInTable: true,
        valueType: 'select',
        fieldProps: {
          ...fieldPropsObject(capabilities.locationFilterColumn?.fieldProps),
          showSearch: true,
          filterOption: false,
        },
      },
      { title: '批号', dataIndex: 'batchNo', hideInTable: true },
      { title: '包装单元', dataIndex: 'packageNo', hideInTable: true },
      {
        title: '确认日期',
        dataIndex: 'dateRange',
        hideInTable: true,
        valueType: 'dateRange',
        fieldProps: capabilities.dateRangeFieldProps,
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
        render: (_value, row) => row.material?.name ?? '-',
      },
      {
        title: '物料编码',
        dataIndex: 'materialCode',
        width: 150,
        sorter: true,
        search: false,
        render: (_value, row) => row.material?.code ?? '-',
      },
      {
        title: '规格型号',
        dataIndex: 'materialSpec',
        width: 150,
        search: false,
        render: (_value, row) => row.material?.spec ?? '-',
      },
      {
        title: '单位',
        dataIndex: 'materialUnit',
        width: 90,
        search: false,
        render: (_value, row) =>
          capabilities.format.formatUnitLabel(
            row.material?.unit,
            capabilities.format.unitLabelMap,
          ) || '-',
      },
      {
        title: '入库数量',
        dataIndex: 'qty',
        width: 120,
        align: 'right',
        sorter: true,
        search: false,
        render: (_value, row) => capabilities.format.formatNumber(row.qty),
      },
      {
        title: '展示数量',
        dataIndex: 'displayQty',
        width: 110,
        align: 'right',
        sorter: true,
        search: false,
        render: (_value, row) =>
          row.displayQty == null
            ? '-'
            : capabilities.format.formatNumber(row.displayQty),
      },
      {
        title: '展示单位',
        dataIndex: 'displayUnit',
        width: 100,
        search: false,
        render: (_value, row) =>
          capabilities.format.formatUnitLabel(
            row.displayUnit,
            capabilities.format.unitLabelMap,
          ) || '-',
      },
      ...(capabilities.lineCustomFieldColumns ?? []),
      ...(capabilities.materialCustomFieldColumns ?? []),
      {
        title: '生产入库单编号',
        dataIndex: 'receiptNo',
        width: 170,
        sorter: true,
        search: false,
        render: (_value, row) => {
          const receiptNo = row.receiptOrder?.receiptNo;
          return receiptNo && capabilities.canViewProductionReceipt ? (
            <Button
              type="link"
              size="small"
              onClick={() => {
                onViewChange?.('orders');
                onOpenReceipt(receiptNo);
              }}
            >
              {receiptNo}
            </Button>
          ) : (
            (receiptNo ?? '-')
          );
        },
      },
      {
        title: '来源工单',
        dataIndex: 'workOrderNo',
        width: 160,
        sorter: true,
        search: false,
        render: (_value, row) => row.receiptOrder?.workOrder?.orderNo ?? '-',
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 105,
        valueType: 'select',
        valueEnum: capabilities.statusEnum,
        fieldProps: { mode: 'multiple' },
        render: (_value, row) => {
          const status = row.receiptOrder?.status;
          if (!status) return '-';
          return capabilities.statusEnum[status] ? (
            <StatusDisplay value={status} enumMap={capabilities.statusEnum} />
          ) : (
            '未知状态'
          );
        },
      },
      {
        title: '入库仓',
        dataIndex: 'warehouseName',
        width: 140,
        search: false,
        render: (_value, row) => row.receiptOrder?.warehouse?.name ?? '-',
      },
      {
        title: '入库仓位',
        dataIndex: 'locationName',
        width: 160,
        search: false,
        render: (_value, row) =>
          row.location?.pathName ||
          row.location?.name ||
          row.receiptOrder?.storageLocationSnapshot ||
          '-',
      },
      { title: '批号', dataIndex: 'batchNo', width: 130, search: false },
      { title: '包装单元', dataIndex: 'packageNo', width: 160, search: false },
      {
        title: '确认时间',
        dataIndex: 'confirmedAt',
        width: 170,
        sorter: true,
        search: false,
        valueType: 'dateTime',
        render: (_value, row) => capabilities.format.formatDateTime(row.receiptOrder?.confirmedAt),
      },
      {
        title: '生成时间',
        dataIndex: 'createdAt',
        width: 170,
        sorter: true,
        search: false,
        valueType: 'dateTime',
        render: (_value, row) => capabilities.format.formatDateTime(row.createdAt),
      },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        width: 170,
        sorter: true,
        search: false,
        valueType: 'dateTime',
        render: (_value, row) => capabilities.format.formatDateTime(row.updatedAt),
      },
    ],
    [capabilities, onOpenReceipt, onViewChange],
  );

  const lightFilter = {
    formValuesFromFilters: (filters: Record<string, unknown>) => ({
      status: filters.status,
      materialId: filters.materialId,
      warehouseId: filters.warehouseId,
      locationId: filters.locationId,
      batchNo: filters.batchNo,
      packageNo: filters.packageNo,
      ...restoreDetailLedgerDateRange(filters, 'dateRange'),
    }),
  };

  return (
    <>
      <DocumentDetailLedgerTable<
        ProductionReceiptDetailLedgerRow,
        ProductionReceiptDetailLedgerQuery,
        {
          list?: ProductionReceiptDetailLedgerRow[];
          total?: number;
          summary: ProductionReceiptDetailLedgerSummary;
        }
      >
        tableActionRef={tableActionRef}
        rowSelection={capabilities.batchPrint.rowSelection}
        tableAlertOptionRender={capabilities.batchPrint.tableAlertOptionRender}
        filterFormRef={filterFormRef}
        savedView={{ controller: savedViewController }}
        initialQuery={{
          status: 'received',
          orderBy: 'confirmedAt',
          orderDir: 'DESC',
        }}
        apiFn={capabilities.requestList}
        buildQuery={buildQuery}
        columns={columns}
        exportFn={capabilities.exportExcel}
        exportFileName={
          typeof capabilities.exportFileName === 'function'
            ? capabilities.exportFileName()
            : capabilities.exportFileName
        }
        exportPermission={capabilities.exportPermission}
        showExport={capabilities.canExport}
        resizable={capabilities.resizable}
        serverSortFields={capabilities.serverSortFields}
        scrollX={2440}
        onViewChange={onViewChange}
        onResponse={(response) => {
          setSummary(response.summary);
          capabilities.onResponse?.(response);
        }}
        footer={
          summary ? (
            <>
              <span>生产入库单笔数 {capabilities.format.formatNumber(summary.receiptOrderCount)}</span>
              <span>明细行 {capabilities.format.formatNumber(summary.itemCount)}</span>
              <span>物料数 {capabilities.format.formatNumber(summary.materialCount)}</span>
              <Typography.Text>
                入库数量 {capabilities.format.formatNumber(summary.receiptQty)}
              </Typography.Text>
            </>
          ) : null
        }
        lightFilter={lightFilter}
      />
      {capabilities.batchPrint.printJobActionNode}
    </>
  );
}
