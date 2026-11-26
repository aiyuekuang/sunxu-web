import { Button } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';
import { useMemo, useState } from 'react';
import { renderCustomFieldCell } from './CustomFieldCell';
import { DocumentDetailLedgerTable } from './DocumentDetailLedgerTable';
import { restoreDetailLedgerDateRange } from './DetailLedgerFilterDrawer';
import { StatusDisplay } from '../../components/StatusDisplay';
import { useSalesDetailLedgerBatchPrint } from './SalesDetailLedgerComponents';
import type {
  OutsourcingDetailLineRole,
  OutsourcingOrderDetailLedgerCapabilities,
  OutsourcingOrderDetailLedgerProps,
  OutsourcingOrderDetailLedgerQuery,
  OutsourcingOrderDetailLedgerResponse,
  OutsourcingOrderDetailLedgerRow,
  OutsourcingOrderDetailLedgerSummary,
  OutsourcingOrderStatus,
} from './outsourcing-detail-ledger-types';
import type { DocumentLineCustomFieldDefinition } from './document-line-custom-field-types';

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readDisplayJson(value: unknown): Record<string, unknown> {
  return readRecord(value);
}

function customFieldWidth(field: DocumentLineCustomFieldDefinition): number {
  const width = readDisplayJson(field.displayJson).listWidth;
  if (typeof width === 'number' && width > 0) return width;
  if (field.dataType === 'long_text') return 200;
  if (field.dataType === 'date' || field.dataType === 'datetime') return 168;
  if (field.dataType === 'boolean') return 96;
  return 140;
}

function createLineCustomFieldColumns(
  schema: OutsourcingOrderDetailLedgerCapabilities['issueLineCustomFieldSchema'],
  prefixTitle: string,
  getCarrier: (row: OutsourcingOrderDetailLedgerRow) =>
    | OutsourcingOrderDetailLedgerRow
    | undefined,
): ProColumns<OutsourcingOrderDetailLedgerRow>[] {
  const fields = (schema?.fields ?? [])
    .filter(
      (field) =>
        field.isActive !== false &&
        readDisplayJson(field.displayJson).showInList === true,
    )
    .slice()
    .sort((left, right) => {
      const leftOrder = readDisplayJson(left.displayJson).sortOrder;
      const rightOrder = readDisplayJson(right.displayJson).sortOrder;
      const leftValue =
        typeof leftOrder === 'number' ? leftOrder : (left.sortOrder ?? 0);
      const rightValue =
        typeof rightOrder === 'number' ? rightOrder : (right.sortOrder ?? 0);
      return leftValue - rightValue;
    });

  return fields.map((field) => ({
    title: `${prefixTitle}·${field.label}`,
    key: `line-custom-${field.fieldKey}`,
    width: customFieldWidth(field),
    ellipsis: true,
    search: false,
    sorter: false,
    render: (_value, row) => {
      const carrier = readRecord(getCarrier(row));
      return renderCustomFieldCell(field, {
        computedValues: carrier.customComputedValues,
        rawValues: carrier.customValues,
        errors: carrier.customComputedErrors,
      });
    },
  }));
}

function toValueEnum(enumMap: OutsourcingOrderDetailLedgerCapabilities['lineRoleEnum']) {
  return Object.fromEntries(
    Object.entries(enumMap).map(([key, value]) => [key, { text: value.text }]),
  );
}

function statusColumn(
  dataIndex: 'lineRole' | 'status',
  title: string,
  enumMap: OutsourcingOrderDetailLedgerCapabilities['lineRoleEnum'],
  overrides: Partial<ProColumns<OutsourcingOrderDetailLedgerRow>> = {},
): ProColumns<OutsourcingOrderDetailLedgerRow> {
  return {
    title,
    dataIndex,
    width: 110,
    valueType: 'select',
    valueEnum: toValueEnum(enumMap),
    render: (_value, row) => (
      <StatusDisplay value={String(row[dataIndex] ?? '')} enumMap={enumMap} />
    ),
    ...overrides,
  };
}

function dateTimeColumn(
  dataIndex: 'transactionAt' | 'createdAt' | 'updatedAt',
  title: string,
  capabilities: OutsourcingOrderDetailLedgerCapabilities,
): ProColumns<OutsourcingOrderDetailLedgerRow> {
  return {
    title,
    dataIndex,
    valueType: 'dateTime',
    width: 170,
    sorter: true,
    search: false,
    render: (_value, row) => capabilities.formatDateTime(row[dataIndex]),
  };
}

function optionalString(params: Record<string, unknown>, key: string) {
  return typeof params[key] === 'string' ? params[key] : undefined;
}

function statusValues(value: unknown): OutsourcingOrderStatus[] | undefined {
  return Array.isArray(value)
    ? value.filter((item): item is OutsourcingOrderStatus => typeof item === 'string')
    : undefined;
}

function buildQuery(
  params: Record<string, unknown>,
  sortQuery: { orderBy?: string; orderDir?: 'ASC' | 'DESC' },
): OutsourcingOrderDetailLedgerQuery {
  const statusParam = params.status;
  const statusesParam = params.statuses;
  const statuses = statusValues(statusesParam) ?? statusValues(statusParam);
  const status =
    Array.isArray(statusesParam) || Array.isArray(statusParam)
      ? undefined
      : typeof statusParam === 'string'
        ? (statusParam as OutsourcingOrderStatus)
        : undefined;
  const role = optionalString(params, 'lineRole');

  return {
    keyword: optionalString(params, 'keyword'),
    status,
    statuses,
    supplierId: optionalString(params, 'supplierId'),
    detailMaterialId: optionalString(params, 'detailMaterialId'),
    warehouseId: optionalString(params, 'warehouseId'),
    locationId: optionalString(params, 'locationId'),
    batchNo: optionalString(params, 'batchNo'),
    lineRole:
      role === 'input' || role === 'output'
        ? (role as OutsourcingDetailLineRole)
        : undefined,
    startDate: optionalString(params, 'startDate'),
    endDate: optionalString(params, 'endDate'),
    orderBy: sortQuery.orderBy ?? 'transactionAt',
    orderDir: sortQuery.orderDir ?? 'DESC',
  };
}

/**
 * @sunxu-layer business
 * @sunxu-domain outsourcing-order-detail-ledger
 * @sunxu-reason Preserves the input/output stock-transaction ledger, saved-filter semantics, custom fields, order drill-down, and batch print mapping while requests, permission outcomes, candidate selectors, formatters, and navigation stay host supplied.
 */
export function OutsourcingOrderDetailLedger({
  capabilities,
  onViewChange,
  onOpenOrder,
  onCreate,
}: OutsourcingOrderDetailLedgerProps) {
  const [summary, setSummary] = useState<OutsourcingOrderDetailLedgerSummary>();
  const batchPrint = useSalesDetailLedgerBatchPrint({
    canPrint: capabilities.print.canPrint,
    getRowKey: (row: OutsourcingOrderDetailLedgerRow) => row.id,
    actions: [
      {
        label: '批量打印委外单',
        getPrintParams: (row: OutsourcingOrderDetailLedgerRow) => ({
          businessType: 'outsourcing_order',
          businessId: row.outsourcingOrderId,
        }),
      },
      {
        label: '批量打印发货单',
        getPrintParams: (row: OutsourcingOrderDetailLedgerRow) =>
          row.lineRole === 'input'
            ? {
                businessType: 'outsourcing_issue',
                businessId: row.outsourcingOrderId,
              }
            : null,
      },
    ],
    openPrintBatch: capabilities.print.openPrintBatch,
  });

  const columns = useMemo<ProColumns<OutsourcingOrderDetailLedgerRow>[]>(
    () => [
      {
        title: '关键词',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: { placeholder: '委外单号、供应商、物料或批号' },
      },
      {
        title: '供应商',
        dataIndex: 'supplierId',
        hideInTable: true,
        ...capabilities.supplierSearchColumnProps,
      },
      {
        title: '明细物料',
        dataIndex: 'detailMaterialId',
        hideInTable: true,
        ...capabilities.materialSearchColumnProps,
      },
      {
        title: '发生仓库',
        dataIndex: 'warehouseId',
        hideInTable: true,
        ...capabilities.warehouseSearchColumnProps,
      },
      {
        title: '明细角色',
        dataIndex: 'lineRole',
        hideInTable: true,
        valueType: 'select',
        valueEnum: toValueEnum(capabilities.lineRoleEnum),
      },
      { title: '批号', dataIndex: 'batchNo', hideInTable: true },
      {
        title: '发生日期',
        dataIndex: 'dateRange',
        hideInTable: true,
        valueType: 'dateRange',
        fieldProps: { presets: [...capabilities.dateRangePresets] },
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
      },
      {
        title: '物料编码',
        dataIndex: 'materialCode',
        width: 150,
        sorter: true,
        search: false,
      },
      {
        title: '规格型号',
        dataIndex: 'materialSpec',
        width: 150,
        search: false,
        render: (_value, row) => row.materialSpec ?? '-',
      },
      {
        title: '单位',
        dataIndex: 'unit',
        width: 90,
        search: false,
        render: (_value, row) =>
          capabilities.formatUnitLabel(row.unit, capabilities.materialUnitLabelMap) || '-',
      },
      {
        title: '发生数量',
        dataIndex: 'qty',
        width: 120,
        align: 'right',
        sorter: true,
        search: false,
        render: (_value, row) => capabilities.formatNumber(row.qty),
      },
      ...createLineCustomFieldColumns(
        capabilities.issueLineCustomFieldSchema,
        '投入明细',
        (row) => (row.lineRole === 'input' ? row : undefined),
      ),
      ...createLineCustomFieldColumns(
        capabilities.receiptCustomFieldSchema,
        '收货明细',
        (row) => (row.lineRole === 'output' ? row : undefined),
      ),
      statusColumn('lineRole', '角色', capabilities.lineRoleEnum, {
        width: 100,
        sorter: true,
      }),
      {
        title: '委外单号',
        dataIndex: 'orderNo',
        width: 170,
        sorter: true,
        search: false,
        render: (_value, row) =>
          capabilities.canViewOrder ? (
            <Button
              type="link"
              size="small"
              onClick={() => {
                onViewChange?.('orders');
                onOpenOrder(row.outsourcingOrderId);
              }}
            >
              {row.orderNo}
            </Button>
          ) : (
            row.orderNo
          ),
      },
      {
        title: '供应商',
        dataIndex: 'supplierName',
        width: 170,
        search: false,
        render: (_value, row) => row.supplierName ?? '-',
      },
      statusColumn('status', '状态', capabilities.orderStatusEnum, {
        width: 110,
        fieldProps: { mode: 'multiple' },
      }),
      {
        title: '发生仓库',
        dataIndex: 'warehouseName',
        width: 140,
        search: false,
      },
      {
        title: '发生仓位',
        dataIndex: 'locationName',
        width: 160,
        search: false,
        render: (_value, row) => row.locationName ?? '-',
      },
      {
        title: '批号',
        dataIndex: 'batchNo',
        width: 130,
        search: false,
        render: (_value, row) => row.batchNo ?? '-',
      },
      {
        title: '库存流水号',
        dataIndex: 'transactionNo',
        width: 180,
        search: false,
        render: (_value, row) => row.transactionNo ?? '-',
      },
      dateTimeColumn('transactionAt', '发生时间', capabilities),
      dateTimeColumn('createdAt', '创建时间', capabilities),
      dateTimeColumn('updatedAt', '更新时间', capabilities),
    ],
    [capabilities, onOpenOrder, onViewChange],
  );

  const lightFilter = useMemo(
    () => ({
      formValuesFromFilters: (filters: Record<string, unknown>) => ({
        status: filters.status,
        supplierId: filters.supplierId,
        detailMaterialId: filters.detailMaterialId,
        warehouseId: filters.warehouseId,
        lineRole: filters.lineRole,
        batchNo: filters.batchNo,
        ...restoreDetailLedgerDateRange(filters, 'dateRange'),
      }),
    }),
    [],
  );

  return (
    <>
      <DocumentDetailLedgerTable<
        OutsourcingOrderDetailLedgerRow,
        OutsourcingOrderDetailLedgerQuery,
        OutsourcingOrderDetailLedgerResponse
      >
        tableActionRef={capabilities.savedView.tableActionRef}
        rowSelection={batchPrint.rowSelection}
        tableAlertOptionRender={batchPrint.tableAlertOptionRender}
        filterFormRef={capabilities.savedView.filterFormRef}
        savedView={{ controller: capabilities.savedView.controller }}
        initialQuery={{ orderBy: 'transactionAt', orderDir: 'DESC' }}
        apiFn={(query) => capabilities.requestDetails(query)}
        buildQuery={buildQuery}
        columns={columns}
        exportFn={async (query) => {
          const result = await capabilities.exportDetails(query);
          if (!(result instanceof Blob)) {
            throw new Error('委外加工明细导出响应不是文件');
          }
          return result;
        }}
        exportFileName={`委外加工明细_${Date.now()}.xlsx`}
        exportPermission={capabilities.exportPermission}
        createPermission={capabilities.createPermission}
        onCreate={onCreate}
        resizable={capabilities.resizable}
        serverSortFields={capabilities.serverSortFields}
        scrollX={2300}
        onViewChange={onViewChange}
        onResponse={(response) => setSummary(response.summary)}
        footer={
          summary ? (
            <>
              <span>
                委外单数 {capabilities.formatNumber(summary.outsourcingOrderCount)}
              </span>
              <span>明细行 {capabilities.formatNumber(summary.itemCount)}</span>
              <span>物料数 {capabilities.formatNumber(summary.materialCount)}</span>
              <span>投入数量 {capabilities.formatNumber(summary.inputQty)}</span>
              <span>产出数量 {capabilities.formatNumber(summary.outputQty)}</span>
            </>
          ) : null
        }
        lightFilter={lightFilter}
      />
      {capabilities.print.printJobActionNode}
    </>
  );
}
