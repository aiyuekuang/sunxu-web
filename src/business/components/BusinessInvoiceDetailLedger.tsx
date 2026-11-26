import dayjs from 'dayjs';
import { Button } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';
import { useMemo, useState } from 'react';
import { DocumentDetailLedgerTable } from './DocumentDetailLedgerTable';
import { StatusDisplay } from '../../components/StatusDisplay';
import type {
  BusinessInvoiceDateRangePreset,
  BusinessInvoiceDetailLedgerProps,
  BusinessInvoiceDetailListResponse,
  BusinessInvoiceDetailQuery,
  BusinessInvoiceDetailRow,
  BusinessInvoiceDetailSummary,
  BusinessInvoiceDetailView,
  BusinessInvoiceMatchStatus,
  BusinessInvoiceSourceMode,
} from './business-invoice-detail-ledger-types';
import type {
  BusinessInvoiceCategory,
  BusinessInvoiceStatus,
} from './business-invoice-types';

const PRICE_SORT_FIELDS = new Set([
  'unitPrice',
  'amountWithoutTax',
  'taxRate',
  'taxAmount',
  'totalAmount',
]);

function toValueEnum(enumMap: Readonly<Record<string, { text: string }>>) {
  return Object.fromEntries(
    Object.entries(enumMap).map(([key, value]) => [key, { text: value.text }]),
  );
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

function buildPresetFieldProps(
  presets: readonly BusinessInvoiceDateRangePreset[],
) {
  return { presets: [...presets] };
}

/**
 * @sunxu-layer business
 * @sunxu-domain business-invoice
 * @sunxu-reason Preserves the MES purchase/sales invoice detail ledger while permissions, requests, dictionaries, navigation, formatting, and saved-view persistence remain host supplied.
 */
export function BusinessInvoiceDetailLedger({
  mode,
  canViewInvoice,
  canViewPrices,
  statusEnum,
  categoryEnum,
  matchStatusEnum,
  dateRangePresets,
  partnerSearchColumnProps,
  materialSearchColumnProps,
  customFieldColumns,
  listApi,
  exportApi,
  formatNumber,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatUnit,
  navigateInvoiceDetail,
  exportPermission,
  createPermission,
  resizable,
  serverSortFields,
  savedView,
  onViewChange,
  onCreate,
}: BusinessInvoiceDetailLedgerProps) {
  const [summary, setSummary] = useState<BusinessInvoiceDetailSummary>();
  const [serverPriceVisible, setServerPriceVisible] = useState(false);
  const isPurchase = mode === 'purchase';
  const businessName = isPurchase ? '采购发票' : '销售发票';
  const partnerLabel = isPurchase ? '供应商' : '客户';
  const invoicePath = `/finance/invoice-management/${mode}`;
  const isPriceVisible = canViewPrices && serverPriceVisible;

  const columns = useMemo<ProColumns<BusinessInvoiceDetailRow>[]>(
    () => [
      {
        title: '关键词',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: { placeholder: '发票号、往来单位、物料或开票项目' },
      },
      {
        title: partnerLabel,
        dataIndex: isPurchase ? 'supplierId' : 'customerId',
        hideInTable: true,
        ...partnerSearchColumnProps,
      },
      {
        title: '物料',
        dataIndex: 'materialId',
        hideInTable: true,
        ...materialSearchColumnProps,
      },
      { title: '项目编码', dataIndex: 'itemCode', hideInTable: true },
      {
        title: '开票日期',
        dataIndex: 'dateRange',
        hideInTable: true,
        valueType: 'dateRange',
        fieldProps: buildPresetFieldProps(dateRangePresets),
        search: {
          transform: (value: [string, string]) => ({
            startDate: value[0],
            endDate: value[1],
          }),
        },
      },
      {
        title: '物料/项目名称',
        dataIndex: 'itemName',
        width: 190,
        sorter: true,
        search: false,
      },
      {
        title: '物料/项目编码',
        dataIndex: 'itemCode',
        width: 160,
        sorter: true,
        search: false,
        render: (_, record) => record.itemCode ?? '-',
      },
      {
        title: '规格型号',
        dataIndex: 'itemSpec',
        width: 150,
        search: false,
        render: (_, record) => record.itemSpec ?? '-',
      },
      {
        title: '单位',
        dataIndex: 'unit',
        width: 90,
        search: false,
        render: (_, record) => formatUnit(record.unit) || '-',
      },
      {
        title: '数量',
        dataIndex: 'quantity',
        width: 110,
        align: 'right',
        sorter: true,
        search: false,
        render: (_, record) => formatNumber(record.quantity),
      },
      ...(isPriceVisible
        ? [
            {
              title: '单价',
              dataIndex: 'unitPrice',
              width: 110,
              align: 'right' as const,
              sorter: true,
              search: false,
              render: (_: unknown, record: BusinessInvoiceDetailRow) =>
                record.unitPrice == null ? '-' : formatNumber(record.unitPrice),
            },
            {
              title: '未税金额',
              dataIndex: 'amountWithoutTax',
              width: 130,
              align: 'right' as const,
              sorter: true,
              search: false,
              render: (_: unknown, record: BusinessInvoiceDetailRow) =>
                record.amountWithoutTax == null
                  ? '-'
                  : formatNumber(record.amountWithoutTax),
            },
            {
              title: '税率(%)',
              dataIndex: 'taxRate',
              width: 110,
              align: 'right' as const,
              sorter: true,
              search: false,
              render: (_: unknown, record: BusinessInvoiceDetailRow) =>
                record.taxRate == null
                  ? '-'
                  : formatNumber(Number(record.taxRate)),
            },
            {
              title: '税额',
              dataIndex: 'taxAmount',
              width: 120,
              align: 'right' as const,
              sorter: true,
              search: false,
              render: (_: unknown, record: BusinessInvoiceDetailRow) =>
                record.taxAmount == null ? '-' : formatNumber(record.taxAmount),
            },
            {
              title: '价税合计',
              dataIndex: 'totalAmount',
              width: 130,
              align: 'right' as const,
              sorter: true,
              search: false,
              render: (_: unknown, record: BusinessInvoiceDetailRow) =>
                record.totalAmount == null
                  ? '-'
                  : formatNumber(record.totalAmount),
            },
          ]
        : []),
      ...customFieldColumns,
      {
        title: '登记单号',
        dataIndex: 'documentNo',
        width: 170,
        sorter: true,
        search: false,
        render: (_, record) =>
          canViewInvoice ? (
            <Button
              type="link"
              size="small"
              onClick={() =>
                navigateInvoiceDetail(`${invoicePath}/${record.invoiceId}`)
              }
            >
              {record.documentNo}
            </Button>
          ) : (
            record.documentNo
          ),
      },
      {
        title: '真实发票号',
        dataIndex: 'invoiceNo',
        width: 170,
        sorter: true,
        search: false,
        renderText: (value) => value ?? '待回填',
      },
      { title: partnerLabel, dataIndex: 'partnerName', width: 180, search: false },
      {
        title: '状态',
        dataIndex: 'status',
        width: 105,
        valueType: 'select',
        valueEnum: toValueEnum(statusEnum),
        fieldProps: { mode: 'multiple' },
        render: (_, record) => (
          <StatusDisplay value={record.status} enumMap={statusEnum} />
        ),
      },
      {
        title: '发票类型',
        dataIndex: 'category',
        width: 110,
        valueType: 'select',
        valueEnum: toValueEnum(categoryEnum),
        render: (_, record) => (
          <StatusDisplay value={record.category} enumMap={categoryEnum} />
        ),
      },
      {
        title: '匹配状态',
        dataIndex: 'matchStatus',
        width: 120,
        valueType: 'select',
        valueEnum: toValueEnum(matchStatusEnum),
        render: (_, record) => (
          <StatusDisplay value={record.matchStatus} enumMap={matchStatusEnum} />
        ),
      },
      {
        title: '来源单号',
        dataIndex: 'externalDocumentNo',
        width: 170,
        search: false,
        render: (_, record) => record.externalDocumentNo ?? '-',
      },
      {
        title: '开票日期',
        dataIndex: 'invoiceDate',
        width: 140,
        sorter: true,
        search: false,
        render: (_, record) => formatDate(record.invoiceDate),
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        width: 160,
        sorter: true,
        search: false,
        render: (_, record) => formatDateTime(record.createdAt),
      },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        width: 160,
        sorter: true,
        search: false,
        render: (_, record) => formatDateTime(record.updatedAt),
      },
    ],
    [
      canViewInvoice,
      categoryEnum,
      customFieldColumns,
      dateRangePresets,
      formatNumber,
      formatDate,
      formatDateTime,
      formatUnit,
      invoicePath,
      isPriceVisible,
      isPurchase,
      matchStatusEnum,
      materialSearchColumnProps,
      navigateInvoiceDetail,
      partnerLabel,
      partnerSearchColumnProps,
      statusEnum,
    ],
  );

  const lightFilter = useMemo(
    () => ({
      formValuesFromFilters: (filters: Record<string, unknown>) => ({
        [isPurchase ? 'supplierId' : 'customerId']:
          filters[isPurchase ? 'supplierId' : 'customerId'],
        materialId: filters.materialId,
        itemCode: filters.itemCode,
        status: filters.status,
        category: filters.category,
        matchStatus: filters.matchStatus,
        ...restoreDateRange(filters),
      }),
    }),
    [isPurchase],
  );

  return (
    <DocumentDetailLedgerTable<
      BusinessInvoiceDetailRow,
      BusinessInvoiceDetailQuery,
      BusinessInvoiceDetailListResponse,
      BusinessInvoiceDetailView
    >
      tableActionRef={savedView.tableActionRef}
      filterFormRef={savedView.filterFormRef}
      savedView={{ controller: savedView.controller }}
      initialQuery={{ orderBy: 'invoiceDate', orderDir: 'DESC' }}
      apiFn={listApi as unknown as (query: never) => Promise<BusinessInvoiceDetailListResponse>}
      buildQuery={(params, sortQuery) => ({
        keyword: params.keyword as string | undefined,
        status: Array.isArray(params.statuses)
          ? undefined
          : ((Array.isArray(params.status) ? undefined : params.status) as
              | BusinessInvoiceStatus
              | undefined),
        statuses: (Array.isArray(params.statuses)
          ? params.statuses
          : Array.isArray(params.status)
            ? params.status
            : undefined) as BusinessInvoiceStatus[] | undefined,
        category: params.category as BusinessInvoiceCategory | undefined,
        sourceMode: params.sourceMode as BusinessInvoiceSourceMode | undefined,
        matchStatus: params.matchStatus as BusinessInvoiceMatchStatus | undefined,
        startDate: params.startDate as string | undefined,
        endDate: params.endDate as string | undefined,
        materialId: params.materialId as string | undefined,
        itemCode: params.itemCode as string | undefined,
        ...(isPurchase
          ? { supplierId: params.supplierId as string | undefined }
          : { customerId: params.customerId as string | undefined }),
        orderBy:
          !canViewPrices &&
          sortQuery.orderBy &&
          PRICE_SORT_FIELDS.has(sortQuery.orderBy)
            ? 'invoiceDate'
            : (sortQuery.orderBy ?? 'invoiceDate'),
        orderDir: sortQuery.orderDir ?? 'DESC',
      })}
      columns={columns}
      exportFn={async (query) => {
        const result = await exportApi(query);
        if (!(result instanceof Blob)) {
          throw new Error(`${businessName}明细导出响应不是文件`);
        }
        return result;
      }}
      exportFileName={`${businessName}明细_${Date.now()}.xlsx`}
      exportPermission={exportPermission}
      createPermission={createPermission}
      onCreate={isPriceVisible ? onCreate : undefined}
      resizable={resizable}
      serverSortFields={serverSortFields}
      scrollX={isPriceVisible ? 2240 : 1960}
      onViewChange={onViewChange}
      onResponse={(response) => {
        setSummary(response.summary);
        setServerPriceVisible(response.priceVisible);
      }}
      footer={
        summary ? (
          <>
            <span>发票数 {formatNumber(summary.invoiceCount)}</span>
            <span>明细行 {formatNumber(summary.itemCount)}</span>
            <span>物料/项目数 {formatNumber(summary.materialCount)}</span>
            <span>数量 {formatNumber(summary.quantity)}</span>
            {isPriceVisible ? (
              <>
                <span>不含税金额 {formatCurrency(summary.amountWithoutTax)}</span>
                <span>税额 {formatCurrency(summary.taxAmount)}</span>
                <span>价税合计 {formatCurrency(summary.totalAmount)}</span>
              </>
            ) : null}
          </>
        ) : null
      }
      lightFilter={lightFilter}
    />
  );
}
