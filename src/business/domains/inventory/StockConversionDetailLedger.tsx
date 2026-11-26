import type { ProColumns } from '@ant-design/pro-components';
import { Button } from 'antd';
import { useMemo, useState } from 'react';
import { DocumentDetailLedgerTable } from '../documents/DocumentDetailLedgerTable';
import { restoreDetailLedgerDateRange } from '../documents/DetailLedgerFilterDrawer';
import { materialSelectColumnProps } from './MaterialFilteredSelect';
import { renderCustomFieldCell } from '../documents/CustomFieldCell';
import { StatusDisplay } from '../../../components/StatusDisplay';
import type {
  StockConversionDetailLedgerItem,
  StockConversionDetailLedgerProps,
  StockConversionDetailLedgerQuery,
  StockConversionDetailLedgerResponse,
  StockConversionDetailLedgerSummary,
  StockConversionDetailStatus,
  StockConversionDetailType,
  StockConversionDetailSourceType,
  StockConversionDetailLineRole,
} from './stock-conversion-detail-ledger-types';
import type { CustomFieldDefinition } from '../documents/custom-field-form-types';
import type { StatusMap } from '../../../components/StatusDisplay';

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readCustomFieldListWidth(field: {
  dataType: string;
  sortOrder?: number;
  displayJson?: unknown;
}) {
  const display = readObject(field.displayJson);
  const listWidth = display.listWidth;
  if (typeof listWidth === 'number' && listWidth > 0) return listWidth;
  if (field.dataType === 'long_text') return 200;
  if (field.dataType === 'date' || field.dataType === 'datetime') return 168;
  if (field.dataType === 'boolean') return 96;
  return 140;
}

function createCustomFieldColumns(
  fields: CustomFieldDefinition[] | undefined,
  prefixTitle: string,
  role: StockConversionDetailLedgerItem['lineRole'],
): ProColumns<StockConversionDetailLedgerItem>[] {
  return (fields ?? [])
    .filter((field) => readObject(field.displayJson).showInList === true)
    .sort((left, right) => {
      const leftOrder = readObject(left.displayJson).sortOrder;
      const rightOrder = readObject(right.displayJson).sortOrder;
      const a = typeof leftOrder === 'number' ? leftOrder : (left.sortOrder ?? 0);
      const b = typeof rightOrder === 'number' ? rightOrder : (right.sortOrder ?? 0);
      return a - b;
    })
    .map((field) => ({
      title: `${prefixTitle}·${field.label}`,
      key: `line-custom-${field.fieldKey}`,
      width: readCustomFieldListWidth(field),
      ellipsis: true,
      search: false,
      sorter: false,
      render: (_value, record) =>
        record.lineRole !== role
          ? '-'
          : renderCustomFieldCell(field, {
              computedValues: record.customComputedValues,
              rawValues: record.customValues,
              errors: record.customComputedErrors,
            }),
    }));
}

function toValueEnum(enumMap: StatusMap) {
  return Object.fromEntries(
    Object.entries(enumMap).map(([key, value]) => [key, { text: value.text }]),
  );
}

function createStatusColumn(
  dataIndex: keyof StockConversionDetailLedgerItem,
  title: string,
  enumMap: StatusMap,
  overrides: Partial<ProColumns<StockConversionDetailLedgerItem>> = {},
): ProColumns<StockConversionDetailLedgerItem> {
  return {
    title,
    dataIndex: dataIndex as string,
    width: 90,
    valueType: 'select',
    valueEnum: toValueEnum(enumMap),
    render: (_value, record) => (
      <StatusDisplay
        value={String(record[dataIndex] ?? '')}
        enumMap={enumMap}
      />
    ),
    ...overrides,
  };
}

function createDateColumn(
  dataIndex: keyof StockConversionDetailLedgerItem,
  title: string,
  formatDateTime: (value?: string | null) => string,
): ProColumns<StockConversionDetailLedgerItem> {
  return {
    title,
    dataIndex: dataIndex as string,
    valueType: 'dateTime',
    search: false,
    width: 180,
    sorter: true,
    render: (_value, record) =>
      formatDateTime(String(record[dataIndex] ?? '')) || '-',
  };
}

function remoteSelectColumnProps(
  request: StockConversionDetailLedgerProps['capabilities']['requestWarehouseOptions'],
  placeholder = '默认显示前50条，输入关键词可搜索更多',
) {
  return {
    valueType: 'select' as const,
    showSearch: true,
    debounceTime: 300,
    request,
    fieldProps: { showSearch: true, filterOption: false, placeholder },
  };
}

/**
 * @sunxu-layer business
 * @sunxu-domain inventory
 * @sunxu-reason Preserves the conversion detail-ledger filters, custom input/output fields, saved views, summary, permission-aware links, and table behavior while the host supplies host data, permission identifiers, dictionaries, formatting, and navigation.
 */
export function StockConversionDetailLedger({
  capabilities,
  onViewChange,
  onOpenDetail,
  onCreate,
  tableActionRef,
  filterFormRef,
}: StockConversionDetailLedgerProps) {
  const [summary, setSummary] = useState<StockConversionDetailLedgerSummary>();

  const columns = useMemo<ProColumns<StockConversionDetailLedgerItem>[]>(
    () => [
      {
        title: '关键词',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: { placeholder: '转换单号、来源单号、物料或批号' },
      },
      {
        title: '物料',
        dataIndex: 'materialId',
        hideInTable: true,
        ...materialSelectColumnProps(capabilities.requestMaterialOptions),
      },
      {
        title: '发生仓库',
        dataIndex: 'warehouseId',
        hideInTable: true,
        ...remoteSelectColumnProps(capabilities.requestWarehouseOptions),
      },
      {
        title: '发生仓位',
        dataIndex: 'locationId',
        hideInTable: true,
        valueType: 'select',
        request: capabilities.requestStockLocationOptions,
        fieldProps: { showSearch: true, filterOption: false },
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
        render: (_value, record) => record.materialSpec ?? '-',
      },
      {
        title: '单位',
        dataIndex: 'unit',
        width: 90,
        search: false,
        render: (_value, record) =>
          capabilities.formatUnitLabel(
            record.unit,
            capabilities.materialUnitLabelMap,
          ) || '-',
      },
      {
        title: '发生数量',
        dataIndex: 'qty',
        width: 120,
        align: 'right',
        sorter: true,
        search: false,
        render: (_value, record) => capabilities.formatNumber(record.qty),
      },
      ...createCustomFieldColumns(
        capabilities.inputLineSchema?.fields,
        '投入明细',
        'input',
      ),
      ...createCustomFieldColumns(
        capabilities.outputLineSchema?.fields,
        '产出明细',
        'output',
      ),
      createStatusColumn('lineRole', '角色', capabilities.lineRoleEnum, {
        width: 100,
        sorter: true,
      }),
      {
        title: '转换单号',
        dataIndex: 'conversionNo',
        width: 170,
        sorter: true,
        search: false,
        render: (_value, record) =>
          capabilities.canViewStockConversion ? (
            <Button
              type="link"
              size="small"
              onClick={() => {
                onViewChange?.('orders');
                onOpenDetail(record.conversionOrderId);
              }}
            >
              {record.conversionNo}
            </Button>
          ) : (
            record.conversionNo
          ),
      },
      createStatusColumn(
        'conversionType',
        '转换类型',
        capabilities.conversionTypeEnum,
        { width: 120 },
      ),
      createStatusColumn('status', '状态', capabilities.statusEnum, {
        width: 105,
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
        render: (_value, record) => record.locationName ?? '-',
      },
      {
        title: '批号',
        dataIndex: 'batchNo',
        width: 130,
        search: false,
        render: (_value, record) => record.batchNo ?? '-',
      },
      {
        title: '来源单号',
        dataIndex: 'sourceNo',
        width: 170,
        search: false,
        render: (_value, record) => record.sourceNo ?? '-',
      },
      createDateColumn(
        'transactionAt',
        '发生时间',
        capabilities.formatDateTime,
      ),
      createDateColumn('createdAt', '创建时间', capabilities.formatDateTime),
      createDateColumn('updatedAt', '更新时间', capabilities.formatDateTime),
    ],
    [capabilities, onOpenDetail, onViewChange],
  );

  const lightFilter = {
    formValuesFromFilters: (filters: Record<string, unknown>) => ({
      status: filters.status,
      materialId: filters.materialId,
      warehouseId: filters.warehouseId,
      locationId: filters.locationId,
      lineRole: filters.lineRole,
      conversionType: filters.conversionType,
      batchNo: filters.batchNo,
      ...restoreDetailLedgerDateRange(filters, 'dateRange'),
    }),
  };

  return (
    <DocumentDetailLedgerTable<
      StockConversionDetailLedgerItem,
      StockConversionDetailLedgerQuery,
      StockConversionDetailLedgerResponse
    >
      tableActionRef={tableActionRef}
      filterFormRef={filterFormRef}
      savedView={{ controller: capabilities.savedViewController }}
      initialQuery={{
        status: 'converted',
        orderBy: 'transactionAt',
        orderDir: 'DESC',
      }}
      apiFn={capabilities.requestDetailList}
      buildQuery={(params, sortQuery) => ({
        keyword: params.keyword as string | undefined,
        status: Array.isArray(params.statuses)
          ? undefined
          : ((Array.isArray(params.status)
              ? undefined
              : (params.status as StockConversionDetailStatus)) ??
            'converted'),
        statuses: (Array.isArray(params.statuses)
          ? params.statuses
          : Array.isArray(params.status)
            ? params.status
            : undefined) as StockConversionDetailStatus[] | undefined,
        conversionType: params.conversionType as
          | StockConversionDetailType
          | undefined,
        sourceType: params.sourceType as
          | StockConversionDetailSourceType
          | undefined,
        materialId: params.materialId as string | undefined,
        warehouseId: params.warehouseId as string | undefined,
        locationId: params.locationId as string | undefined,
        batchNo: params.batchNo as string | undefined,
        lineRole: params.lineRole as
          | StockConversionDetailLineRole
          | undefined,
        startDate: params.startDate as string | undefined,
        endDate: params.endDate as string | undefined,
        orderBy: sortQuery.orderBy ?? 'transactionAt',
        orderDir: sortQuery.orderDir ?? 'DESC',
      })}
      columns={columns}
      exportFn={capabilities.exportDetailExcel}
      exportFileName={`库存转换明细_${Date.now()}.xlsx`}
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
            <span>
              转换单数{' '}
              {capabilities.formatNumber(summary.conversionOrderCount)}
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
  );
}
