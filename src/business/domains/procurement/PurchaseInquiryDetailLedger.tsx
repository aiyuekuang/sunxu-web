import { Button } from 'antd';
import { useMemo, useState } from 'react';
import type { ProColumns } from '@ant-design/pro-components';
import { DocumentDetailLedgerTable } from '../documents/DocumentDetailLedgerTable';
import { restoreDetailLedgerDateRange } from '../documents/DetailLedgerFilterDrawer';
import { StatusDisplay } from '../../../components/StatusDisplay';
import type {
  PurchaseInquiryDetailLedgerProps,
  PurchaseInquiryDetailLedgerQuery,
  PurchaseInquiryDetailLedgerRow,
  PurchaseInquiryDetailLedgerSummary,
} from '../documents/detail-ledger-components-types';

/**
 * @sunxu-layer business
 * @sunxu-domain procurement
 * @sunxu-reason Keeps inquiry line filters, material snapshots, custom fields, summaries, and batch-print selection visible while host data, authorization, navigation, and actions stay host supplied.
 * Embedded purchase-inquiry detail ledger; callers own its services and page lifecycle.
 */
export function PurchaseInquiryDetailLedger({
  capabilities,
  onCreate,
  onOpenInquiry,
  onViewChange,
  tableActionRef,
  filterFormRef,
  savedViewController,
}: PurchaseInquiryDetailLedgerProps) {
  const [summary, setSummary] = useState<PurchaseInquiryDetailLedgerSummary>();

  const buildQuery = (
    params: Record<string, unknown>,
    sortQuery: Pick<PurchaseInquiryDetailLedgerQuery, 'orderBy' | 'orderDir'> = {},
  ): PurchaseInquiryDetailLedgerQuery => {
    const statusParam = params.statuses ?? params.status;
    return {
      keyword: (params.keyword as string) || undefined,
      inquiryNo: (params.inquiryNo as string) || undefined,
      status: !Array.isArray(statusParam)
        ? (statusParam as string | undefined)
        : undefined,
      statuses: Array.isArray(statusParam)
        ? (statusParam as string[])
        : undefined,
      supplierId: (params.supplierId as string) || undefined,
      materialId: (params.materialId as string) || undefined,
      temporaryItemCode: (params.temporaryItemCode as string) || undefined,
      startDate: params.startDate as string | undefined,
      endDate: params.endDate as string | undefined,
      orderBy: sortQuery.orderBy ?? 'createdAt',
      orderDir: sortQuery.orderDir ?? 'DESC',
    };
  };

  const columns = useMemo<ProColumns<PurchaseInquiryDetailLedgerRow>[]>(
    () => [
      {
        title: '关键词',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: {
          placeholder: '询价单号、供应商、物料、临时询价品或行备注',
        },
      },
      { title: '询价单号', dataIndex: 'inquiryNo', hideInTable: true },
      {
        ...capabilities.supplierFilterColumn,
        title: '供应商',
        dataIndex: 'supplierId',
        hideInTable: true,
      },
      {
        ...capabilities.materialFilterColumn,
        title: '物料',
        dataIndex: 'materialId',
        hideInTable: true,
      },
      {
        title: '临时询价品编码',
        dataIndex: 'temporaryItemCode',
        hideInTable: true,
      },
      {
        title: '发起日期',
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
        render: (_value, row) => row.material?.name ?? row.temporaryItemName ?? '-',
      },
      {
        title: '物料编码',
        dataIndex: 'materialCode',
        width: 150,
        sorter: true,
        search: false,
        render: (_value, row) => row.material?.code ?? row.temporaryItemCode ?? '-',
      },
      {
        title: '规格型号',
        dataIndex: 'materialSpec',
        width: 150,
        search: false,
        render: (_value, row) => row.material?.spec ?? row.temporaryItemSpec ?? '-',
      },
      {
        title: '单位',
        dataIndex: 'unit',
        width: 90,
        search: false,
        render: (_value, row) =>
          capabilities.format.formatUnitLabel(
            row.purchaseUnit ?? row.material?.unit,
            capabilities.format.unitLabelMap,
          ) || '-',
      },
      {
        title: '询价数量',
        dataIndex: 'inquiryQty',
        width: 120,
        align: 'right',
        sorter: true,
        search: false,
        render: (_value, row) => capabilities.format.formatNumber(row.inquiryQty),
      },
      {
        title: '已转订单数量',
        dataIndex: 'orderedQty',
        width: 130,
        align: 'right',
        sorter: true,
        search: false,
        render: (_value, row) => capabilities.format.formatNumber(row.orderedQty),
      },
      ...(capabilities.lineCustomFieldColumns ?? []),
      ...(capabilities.materialCustomFieldColumns ?? []),
      {
        title: '询价单号',
        dataIndex: 'inquiryNo',
        width: 170,
        sorter: true,
        search: false,
        render: (_value, row) => {
          const inquiryNo = row.inquiry?.inquiryNo;
          return inquiryNo && row.inquiryId && capabilities.canViewInquiry ? (
            <Button
              type="link"
              size="small"
              onClick={() => onOpenInquiry(row.inquiryId)}
            >
              {inquiryNo}
            </Button>
          ) : (
            (inquiryNo ?? '-')
          );
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 105,
        valueType: 'select',
        valueEnum: capabilities.statusEnum,
        fieldProps: { mode: 'multiple' },
        render: (_value, row) => {
          const status = row.inquiry?.status;
          return status ? (
            <StatusDisplay value={status} enumMap={capabilities.statusEnum} />
          ) : (
            '-'
          );
        },
      },
      {
        title: '来源申请',
        dataIndex: 'prNo',
        width: 160,
        search: false,
        render: (_value, row) => row.inquiry?.requisition?.prNo ?? '-',
      },
      {
        title: '需求日期',
        dataIndex: 'requiredDate',
        width: 140,
        sorter: true,
        search: false,
        valueType: 'dateTime',
        render: (_value, row) => capabilities.format.formatDateTime(row.requiredDate),
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        width: 160,
        sorter: true,
        search: false,
        valueType: 'dateTime',
        render: (_value, row) => capabilities.format.formatDateTime(row.createdAt),
      },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        width: 160,
        sorter: true,
        search: false,
        valueType: 'dateTime',
        render: (_value, row) => capabilities.format.formatDateTime(row.updatedAt),
      },
      {
        title: '行备注',
        dataIndex: 'remarks',
        width: 180,
        ellipsis: true,
        search: false,
      },
    ],
    [capabilities, onOpenInquiry],
  );

  const lightFilter = {
    formValuesFromFilters: (filters: Record<string, unknown>) => ({
      inquiryNo: filters.inquiryNo,
      supplierId: filters.supplierId,
      materialId: filters.materialId,
      temporaryItemCode: filters.temporaryItemCode,
      status: filters.statuses ?? filters.status,
      ...restoreDetailLedgerDateRange(filters, 'dateRange'),
    }),
  };

  return (
    <>
      <DocumentDetailLedgerTable<
        PurchaseInquiryDetailLedgerRow,
        PurchaseInquiryDetailLedgerQuery,
        {
          list?: PurchaseInquiryDetailLedgerRow[];
          total?: number;
          summary: PurchaseInquiryDetailLedgerSummary;
        }
      >
        tableActionRef={tableActionRef}
        filterFormRef={filterFormRef}
        savedView={{ controller: savedViewController }}
        rowSelection={capabilities.batchPrint.rowSelection}
        tableAlertOptionRender={capabilities.batchPrint.tableAlertOptionRender}
        initialQuery={{ orderBy: 'createdAt', orderDir: 'DESC' }}
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
        createPermission={
          capabilities.canCreate && onCreate
            ? capabilities.createPermission
            : undefined
        }
        onCreate={onCreate}
        showExport={capabilities.canExport}
        resizable={capabilities.resizable}
        serverSortFields={capabilities.serverSortFields}
        scrollX={2260}
        onViewChange={onViewChange}
        onResponse={(response) => {
          setSummary(response.summary);
          capabilities.onResponse?.(response);
        }}
        footer={
          summary ? (
            <>
              <span>询价单数 {capabilities.format.formatNumber(summary.inquiryCount)}</span>
              <span>明细行 {capabilities.format.formatNumber(summary.itemCount)}</span>
              <span>物料/临时询价品数 {capabilities.format.formatNumber(summary.materialCount)}</span>
              <span>询价数量 {capabilities.format.formatNumber(summary.inquiryQty)}</span>
              <span>已转订单数量 {capabilities.format.formatNumber(summary.orderedQty)}</span>
            </>
          ) : null
        }
        lightFilter={lightFilter}
      />
      {capabilities.batchPrint.printJobActionNode}
    </>
  );
}
