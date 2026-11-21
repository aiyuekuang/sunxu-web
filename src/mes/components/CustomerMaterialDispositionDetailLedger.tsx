import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import { Button } from 'antd';
import { useMemo, useRef, useState } from 'react';
import { renderCustomFieldCell } from './CustomFieldCell';
import { DocumentDetailLedgerTable } from './DocumentDetailLedgerTable';
import { restoreDetailLedgerDateRange } from './DetailLedgerFilterDrawer';
import { MaterialFilteredSelect } from './MaterialFilteredSelect';
import { StatusDisplay } from './StatusDisplay';
import { BUSINESS_DATE_RANGE_PRESETS } from '../table/dateRangePresets';
import type {
  CustomerMaterialDispositionDetailLedgerCapabilities,
  CustomerMaterialDispositionDetailLedgerProps,
  CustomerMaterialDispositionDetailListQuery,
  CustomerMaterialDispositionDetailRow,
  CustomerMaterialDispositionDetailListResponse,
} from './customer-material-disposition-types';

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function lineCustomFieldWidth(field: {
  dataType: string;
  displayJson?: unknown;
}): number {
  const listWidth = readRecord(field.displayJson).listWidth;
  if (typeof listWidth === 'number' && listWidth > 0) return listWidth;
  if (field.dataType === 'long_text') return 200;
  if (field.dataType === 'date' || field.dataType === 'datetime') return 168;
  if (field.dataType === 'boolean') return 96;
  return 140;
}

function createLineCustomFieldColumns(
  schema: CustomerMaterialDispositionDetailLedgerCapabilities['lineCustomFieldSchema'],
): ProColumns<CustomerMaterialDispositionDetailRow>[] {
  const fields = (schema?.fields ?? [])
    .filter(
      (field) =>
        field.isActive !== false &&
        readRecord(field.displayJson).showInList === true,
    )
    .slice()
    .sort((left, right) => {
      const leftOrder = readRecord(left.displayJson).sortOrder;
      const rightOrder = readRecord(right.displayJson).sortOrder;
      const leftSort =
        typeof leftOrder === 'number' ? leftOrder : (left.sortOrder ?? 0);
      const rightSort =
        typeof rightOrder === 'number' ? rightOrder : (right.sortOrder ?? 0);
      return leftSort - rightSort;
    });

  return fields.map((field) => ({
    title: `客户料处置明细·${field.label}`,
    key: `line-custom-${field.fieldKey}`,
    width: lineCustomFieldWidth(field),
    ellipsis: true,
    search: false,
    sorter: false,
    render: (_value, record) =>
      renderCustomFieldCell(field, {
        computedValues: record.customComputedValues,
        rawValues: record.customValues,
        errors: record.customComputedErrors,
      }),
  }));
}

function createStatusLedgerColumn(
  dataIndex: string,
  title: string,
  enumMap: CustomerMaterialDispositionDetailLedgerCapabilities['typeEnum'],
  renderValue: (record: CustomerMaterialDispositionDetailRow) =>
    | string
    | null
    | undefined,
  overrides: Partial<ProColumns<CustomerMaterialDispositionDetailRow>> = {},
): ProColumns<CustomerMaterialDispositionDetailRow> {
  return {
    title,
    dataIndex,
    width: 110,
    valueType: 'select',
    valueEnum: Object.fromEntries(
      Object.entries(enumMap).map(([key, item]) => [key, { text: item.text }]),
    ),
    render: (_value, record) => {
      const value = renderValue(record);
      return value ? <StatusDisplay value={value} enumMap={enumMap} /> : '-';
    },
    ...overrides,
  };
}

function createLedgerDateColumn(
  dataIndex: string,
  title: string,
  formatDateTime: CustomerMaterialDispositionDetailLedgerCapabilities['formatDateTime'],
  options: {
    width?: number;
    sorter?: boolean;
    value?: (record: CustomerMaterialDispositionDetailRow) =>
      | string
      | null
      | undefined;
  } = {},
): ProColumns<CustomerMaterialDispositionDetailRow> {
  return {
    title,
    dataIndex,
    valueType: 'dateTime',
    width: options.width ?? 120,
    sorter: options.sorter,
    search: false,
    render: (value, record) =>
      formatDateTime(
        options.value ? options.value(record) : String(value ?? ''),
      ),
  };
}

function formatDateRangeValue(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as { format?: (template: string) => string };
  return typeof candidate.format === 'function'
    ? candidate.format('YYYY-MM-DD')
    : undefined;
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain warehouse-customer-material-disposition
 * @sunxu-reason Preserves the customer-material detail ledger, its searchable source context, personal views, custom fields, totals and drill-through while the host supplies services and authorization results.
 */
export function CustomerMaterialDispositionDetailLedger({
  onViewChange,
  onOpenDetail,
  onCreate,
  savedViewController,
  capabilities,
}: CustomerMaterialDispositionDetailLedgerProps) {
  const tableRef = useRef<ActionType>(null);
  const detailLedgerFilterFormRef = useRef<ProFormInstance | undefined>(
    undefined,
  );
  const [summary, setSummary] =
    useState<CustomerMaterialDispositionDetailListResponse['summary']>();

  const columns = useMemo<ProColumns<CustomerMaterialDispositionDetailRow>[]>(
    () => [
      {
        title: '关键词',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: { placeholder: '处置单号、客户、物料或批号' },
      },
      { title: '处置单号', dataIndex: 'dispositionNo', hideInTable: true },
      {
        title: '客户',
        dataIndex: 'customerId',
        hideInTable: true,
        valueType: 'select',
        showSearch: true,
        debounceTime: 300,
        request: capabilities.requestCustomerOptions,
        fieldProps: {
          filterOption: false,
          placeholder: '输入客户名称或编码搜索',
        },
      },
      {
        title: '物料',
        dataIndex: 'materialId',
        hideInTable: true,
        renderFormItem: () => (
          <MaterialFilteredSelect
            request={capabilities.requestMaterialOptions}
            placeholder="搜索物料编码或名称"
            filterMode="hidden"
            size="small"
          />
        ),
      },
      {
        title: '实际出库仓',
        dataIndex: 'warehouseId',
        hideInTable: true,
        valueType: 'select',
        showSearch: true,
        debounceTime: 300,
        request: capabilities.requestWarehouseOptions,
        fieldProps: {
          filterOption: false,
          placeholder: '默认显示前50条，输入关键词可搜索更多',
        },
      },
      { title: '批号', dataIndex: 'batchNo', hideInTable: true },
      {
        title: '处置日期',
        dataIndex: 'dateRange',
        hideInTable: true,
        valueType: 'dateRange',
        fieldProps: { presets: BUSINESS_DATE_RANGE_PRESETS },
        search: {
          transform: (value: unknown) => {
            if (!Array.isArray(value)) return {};
            return {
              startDate: formatDateRangeValue(value[0]),
              endDate: formatDateRangeValue(value[1]),
            };
          },
        },
      },
      {
        title: '物料名称',
        dataIndex: 'materialName',
        width: 180,
        sorter: true,
        search: false,
        render: (_value, record) =>
          record.material?.name ?? record.customerInbound?.itemName ?? '-',
      },
      {
        title: '物料编码',
        dataIndex: 'materialCode',
        width: 150,
        sorter: true,
        search: false,
        render: (_value, record) =>
          record.material?.code ?? record.customerInbound?.registerNo ?? '-',
      },
      {
        title: '规格型号',
        dataIndex: 'materialSpec',
        width: 150,
        search: false,
        render: (_value, record) =>
          record.material?.spec ?? record.customerInbound?.itemSpec ?? '-',
      },
      {
        title: '单位',
        dataIndex: 'materialUnit',
        width: 90,
        search: false,
        render: (_value, record) =>
          capabilities.formatUnitLabel(
            record.material?.unit ?? record.customerInbound?.unit,
            capabilities.materialUnitLabelMap,
          ) || '-',
      },
      {
        title: '处置数量',
        dataIndex: 'qty',
        width: 120,
        align: 'right',
        sorter: true,
        search: false,
        render: (_value, record) => capabilities.formatNumber(record.qty),
      },
      ...createLineCustomFieldColumns(capabilities.lineCustomFieldSchema),
      {
        title: '处置单号',
        dataIndex: 'dispositionNo',
        width: 180,
        sorter: true,
        search: false,
        render: (_value, record) => {
          const dispositionNo = record.order?.dispositionNo;
          return dispositionNo && capabilities.canViewDisposition ? (
            <Button
              type="link"
              size="small"
              onClick={() => {
                onViewChange?.('orders');
                onOpenDetail(record.orderId);
              }}
            >
              {dispositionNo}
            </Button>
          ) : (
            (dispositionNo ?? '-')
          );
        },
      },
      {
        title: '客户',
        dataIndex: 'customerName',
        width: 170,
        search: false,
        render: (_value, record) => record.order?.customer?.name ?? '-',
      },
      createStatusLedgerColumn(
        'dispositionType',
        '处置类型',
        capabilities.typeEnum,
        (record) => record.order?.dispositionType,
        { width: 120 },
      ),
      createStatusLedgerColumn(
        'status',
        '单据状态',
        capabilities.statusEnum,
        (record) => record.order?.status,
        { width: 110, search: false },
      ),
      {
        title: '实际出库仓',
        dataIndex: 'warehouseName',
        width: 150,
        search: false,
        render: (_value, record) => record.warehouse?.name ?? '非库存处置',
      },
      {
        title: '实际出库仓位',
        dataIndex: 'locationName',
        width: 170,
        search: false,
        render: (_value, record) =>
          record.location?.pathName || record.location?.name || '-',
      },
      { title: '批号', dataIndex: 'batchNo', width: 130, search: false },
      createLedgerDateColumn(
        'disposedAt',
        '处置时间',
        capabilities.formatDateTime,
        {
          width: 170,
          sorter: true,
          value: (record) => record.order?.disposedAt,
        },
      ),
      createLedgerDateColumn(
        'createdAt',
        '创建时间',
        capabilities.formatDateTime,
        { width: 160, sorter: true },
      ),
      createLedgerDateColumn(
        'updatedAt',
        '更新时间',
        capabilities.formatDateTime,
        { width: 160, sorter: true },
      ),
    ],
    [capabilities, onOpenDetail, onViewChange],
  );

  const lightFilter = useMemo(
    () => ({
      formValuesFromFilters: (filters: Record<string, unknown>) => ({
        dispositionNo: filters.dispositionNo,
        customerId: filters.customerId,
        materialId: filters.materialId,
        warehouseId: filters.warehouseId,
        batchNo: filters.batchNo,
        dispositionType: filters.dispositionType,
        status: filters.status,
        statuses: filters.statuses,
        ...restoreDetailLedgerDateRange(filters, 'dateRange'),
      }),
    }),
    [],
  );

  const buildQuery = (
    params: Record<string, unknown>,
    sortQuery: { orderBy?: string; orderDir?: 'ASC' | 'DESC' },
  ): CustomerMaterialDispositionDetailListQuery => {
    const statusValues = Array.isArray(params.statuses)
      ? params.statuses
      : Array.isArray(params.status)
        ? params.status
        : [];
    const statuses = statusValues.filter(
      (value): value is NonNullable<CustomerMaterialDispositionDetailListQuery['status']> =>
        value === 'confirmed' || value === 'reversed',
    );
    const rawStatus = Array.isArray(params.status)
      ? params.status[0]
      : params.status;
    return {
      keyword: params.keyword as string | undefined,
      dispositionNo: params.dispositionNo as string | undefined,
      customerId: params.customerId as string | undefined,
      dispositionType:
        params.dispositionType as CustomerMaterialDispositionDetailListQuery['dispositionType'],
      status: statuses.length
        ? undefined
        : rawStatus === 'confirmed' || rawStatus === 'reversed'
          ? rawStatus
          : undefined,
      statuses: statuses.length ? statuses : undefined,
      materialId: params.materialId as string | undefined,
      warehouseId: params.warehouseId as string | undefined,
      batchNo: params.batchNo as string | undefined,
      startDate: params.startDate as string | undefined,
      endDate: params.endDate as string | undefined,
      orderBy: sortQuery.orderBy ?? 'disposedAt',
      orderDir: sortQuery.orderDir ?? 'DESC',
    };
  };

  return (
    <DocumentDetailLedgerTable<
      CustomerMaterialDispositionDetailRow,
      CustomerMaterialDispositionDetailListQuery,
      CustomerMaterialDispositionDetailListResponse
    >
      tableActionRef={tableRef}
      filterFormRef={detailLedgerFilterFormRef}
      savedView={{ controller: savedViewController }}
      initialQuery={{ orderBy: 'disposedAt', orderDir: 'DESC' }}
      apiFn={capabilities.requestDetailList}
      buildQuery={buildQuery}
      columns={columns}
      exportFn={capabilities.exportDetailList}
      exportFileName={`客户料处置明细_${Date.now()}.xlsx`}
      exportPermission={capabilities.exportPermission}
      createPermission={capabilities.createPermission}
      onCreate={onCreate}
      resizable={capabilities.resizable}
      serverSortFields={capabilities.serverSortFields}
      scrollX={2380}
      onViewChange={onViewChange}
      onResponse={(response) => setSummary(response.summary)}
      footer={
        summary ? (
          <>
            <span>处置单数 {capabilities.formatNumber(summary.dispositionOrderCount)}</span>
            <span>明细行 {capabilities.formatNumber(summary.itemCount)}</span>
            <span>物料/外来物品数 {capabilities.formatNumber(summary.materialCount)}</span>
            <span>处置数量 {capabilities.formatNumber(summary.qty)}</span>
          </>
        ) : null
      }
      lightFilter={lightFilter}
    />
  );
}
