import { Button } from 'antd';
import { useMemo, useState } from 'react';
import type { ProColumns } from '@ant-design/pro-components';
import { DocumentDetailLedgerTable } from '../documents/DocumentDetailLedgerTable';
import { restoreDetailLedgerDateRange } from '../documents/DetailLedgerFilterDrawer';
import { StatusDisplay } from '../../../components/StatusDisplay';
import type {
  InternalIssueDetailLedgerProps,
  InternalIssueDetailLedgerQuery,
  InternalIssueDetailLedgerRow,
  InternalIssueDetailLedgerSummary,
} from '../documents/detail-ledger-components-types';

/**
 * @sunxu-layer business
 * @sunxu-domain inventory
 * @sunxu-reason Keeps internal-issue filters, permission-aware detail links, custom fields, summary, and batch-print selection visible while host services, permissions, dictionaries, and navigation stay host supplied.
 * Embedded internal-issue detail ledger; callers own its data and page lifecycle.
 */
export function InternalIssueDetailLedger({
  capabilities,
  onViewChange,
  onOpenDetail,
  onCreate,
  tableActionRef,
  filterFormRef,
  savedViewController,
}: InternalIssueDetailLedgerProps) {
  const [summary, setSummary] = useState<InternalIssueDetailLedgerSummary>();

  const buildQuery = (
    params: Record<string, unknown>,
    sortQuery: Pick<InternalIssueDetailLedgerQuery, 'orderBy' | 'orderDir'> = {},
  ): InternalIssueDetailLedgerQuery => ({
    keyword: params.keyword as string | undefined,
    issueNo: params.issueNo as string | undefined,
    issueType: params.issueType as string | undefined,
    status: Array.isArray(params.statuses)
      ? undefined
      : ((Array.isArray(params.status)
          ? undefined
          : (params.status as string | undefined)) ?? 'completed'),
    statuses: (Array.isArray(params.statuses)
      ? params.statuses
      : Array.isArray(params.status)
        ? params.status
        : undefined) as string[] | undefined,
    requesterId: params.requesterId as string | undefined,
    departmentId: params.departmentId as string | undefined,
    equipmentId: params.equipmentId as string | undefined,
    workOrderId: params.workOrderId as string | undefined,
    materialId: params.materialId as string | undefined,
    warehouseId: params.warehouseId as string | undefined,
    batchNo: params.batchNo as string | undefined,
    startDate: params.startDate as string | undefined,
    endDate: params.endDate as string | undefined,
    orderBy: sortQuery.orderBy ?? 'completedAt',
    orderDir: sortQuery.orderDir ?? 'DESC',
  });

  const columns = useMemo<ProColumns<InternalIssueDetailLedgerRow>[]>(
    () => [
      {
        title: '关键词',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: { placeholder: '领用单号、领用人、物料、批号或行备注' },
      },
      { title: '领用单号', dataIndex: 'issueNo', hideInTable: true },
      {
        title: '领用类型',
        dataIndex: 'issueType',
        hideInTable: true,
        valueType: 'select',
        valueEnum: capabilities.issueTypeEnum,
      },
      {
        ...capabilities.requesterFilterColumn,
        title: '领用人',
        dataIndex: 'requesterId',
        hideInTable: true,
      },
      {
        ...capabilities.departmentFilterColumn,
        title: '部门',
        dataIndex: 'departmentId',
        hideInTable: true,
      },
      {
        ...capabilities.equipmentFilterColumn,
        title: '设备',
        dataIndex: 'equipmentId',
        hideInTable: true,
      },
      {
        ...capabilities.workOrderFilterColumn,
        title: '生产工单',
        dataIndex: 'workOrderId',
        hideInTable: true,
      },
      {
        ...capabilities.materialFilterColumn,
        title: '物料',
        dataIndex: 'materialId',
        hideInTable: true,
      },
      {
        ...capabilities.warehouseFilterColumn,
        title: '出库仓库',
        dataIndex: 'warehouseId',
        hideInTable: true,
      },
      { title: '批号', dataIndex: 'batchNo', hideInTable: true },
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
        title: '领用数量',
        dataIndex: 'qty',
        width: 120,
        align: 'right',
        sorter: true,
        search: false,
        render: (_value, row) => capabilities.format.formatNumber(row.qty),
      },
      ...(capabilities.lineCustomFieldColumns ?? []),
      ...(capabilities.materialCustomFieldColumns ?? []),
      {
        title: '领用单号',
        dataIndex: 'issueNo',
        width: 170,
        sorter: true,
        search: false,
        render: (_value, row) => {
          const issueNo = row.order?.issueNo;
          return issueNo && capabilities.canViewInternalIssue ? (
            <Button
              type="link"
              size="small"
              onClick={() => {
                onViewChange?.('orders');
                onOpenDetail(row.orderId);
              }}
            >
              {issueNo}
            </Button>
          ) : (
            (issueNo ?? '-')
          );
        },
      },
      {
        title: '领用类型',
        dataIndex: 'issueType',
        width: 120,
        valueType: 'select',
        valueEnum: capabilities.issueTypeEnum,
        render: (_value, row) =>
          row.order?.issueType ? (
            <StatusDisplay
              value={row.order.issueType}
              enumMap={capabilities.issueTypeEnum}
            />
          ) : (
            '-'
          ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 105,
        valueType: 'select',
        valueEnum: capabilities.issueStatusEnum,
        fieldProps: { mode: 'multiple' },
        render: (_value, row) =>
          row.order?.status ? (
            <StatusDisplay
              value={row.order.status}
              enumMap={capabilities.issueStatusEnum}
            />
          ) : (
            '-'
          ),
      },
      {
        title: '领用人',
        dataIndex: 'requesterName',
        width: 120,
        search: false,
        render: (_value, row) =>
          row.order?.requester?.realName ??
          row.order?.requester?.username ??
          '-',
      },
      {
        title: '部门',
        dataIndex: 'departmentName',
        width: 140,
        search: false,
        render: (_value, row) => row.order?.department?.name ?? '-',
      },
      {
        title: '出库仓',
        dataIndex: 'warehouseName',
        width: 140,
        search: false,
        render: (_value, row) => row.warehouse?.name ?? '-',
      },
      {
        title: '出库仓位',
        dataIndex: 'locationName',
        width: 160,
        search: false,
        render: (_value, row) =>
          row.location?.pathName ||
          row.location?.name ||
          row.storageLocationSnapshot ||
          '-',
      },
      { title: '批号', dataIndex: 'batchNo', width: 130, search: false },
      {
        title: '确认时间',
        dataIndex: 'completedAt',
        width: 170,
        sorter: true,
        search: false,
        valueType: 'dateTime',
        render: (_value, row) => capabilities.format.formatDateTime(row.order?.completedAt),
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
    [capabilities, onOpenDetail, onViewChange],
  );

  const lightFilter = {
    formValuesFromFilters: (filters: Record<string, unknown>) => ({
      issueNo: filters.issueNo,
      status: filters.status,
      issueType: filters.issueType,
      requesterId: filters.requesterId,
      departmentId: filters.departmentId,
      equipmentId: filters.equipmentId,
      workOrderId: filters.workOrderId,
      materialId: filters.materialId,
      warehouseId: filters.warehouseId,
      batchNo: filters.batchNo,
      ...restoreDetailLedgerDateRange(filters, 'dateRange'),
    }),
  };

  return (
    <>
      <DocumentDetailLedgerTable<
        InternalIssueDetailLedgerRow,
        InternalIssueDetailLedgerQuery,
        {
          list?: InternalIssueDetailLedgerRow[];
          total?: number;
          summary: InternalIssueDetailLedgerSummary;
        }
      >
        tableActionRef={tableActionRef}
        rowSelection={capabilities.batchPrint.rowSelection}
        tableAlertOptionRender={capabilities.batchPrint.tableAlertOptionRender}
        filterFormRef={filterFormRef}
        savedView={{ controller: savedViewController }}
        initialQuery={{
          status: 'completed',
          orderBy: 'completedAt',
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
        createPermission={
          capabilities.canCreate && onCreate
            ? capabilities.createPermission
            : undefined
        }
        onCreate={onCreate}
        showExport={capabilities.canExport}
        resizable={capabilities.resizable}
        serverSortFields={capabilities.serverSortFields}
        scrollX={2600}
        onViewChange={onViewChange}
        onResponse={(response) => {
          setSummary(response.summary);
          capabilities.onResponse?.(response);
        }}
        footer={
          summary ? (
            <>
              <span>领用单数 {capabilities.format.formatNumber(summary.issueOrderCount)}</span>
              <span>明细行 {capabilities.format.formatNumber(summary.itemCount)}</span>
              <span>物料数 {capabilities.format.formatNumber(summary.materialCount)}</span>
              <span>领用数量 {capabilities.format.formatNumber(summary.qty)}</span>
            </>
          ) : null
        }
        lightFilter={lightFilter}
      />
      {capabilities.batchPrint.printJobActionNode}
    </>
  );
}
