import { Button, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ProColumns } from '@ant-design/pro-components';
import { DocumentDetailLedgerTable } from './DocumentDetailLedgerTable';
import { StatusDisplay } from '../../components/StatusDisplay';
import type {
  PurchaseRequisitionDetailLedgerProps,
  PurchaseRequisitionDetailLedgerQuery,
  PurchaseRequisitionDetailLedgerRow,
  PurchaseRequisitionDetailLedgerSummary,
} from './detail-ledger-components-types';

function remainingQty(row: PurchaseRequisitionDetailLedgerRow): number {
  if (row.remainingQty != null) return Number(row.remainingQty);
  const required = Number(row.requiredQty ?? 0);
  const ordered = Number(row.orderedQty ?? 0);
  return Math.max(0, (Number.isFinite(required) ? required : 0) - (Number.isFinite(ordered) ? ordered : 0));
}

/**
 * @sunxu-layer business
 * @sunxu-domain purchase-requisition-detail-ledger
 * @sunxu-reason Keeps URL-seeded requisition filters, quantity and arrival-date warnings, line columns, and row-action placement while MES requests, permissions, routing, and action state stay host supplied.
 * Embedded purchase-requisition detail ledger; the host owns route and document actions.
 */
export function PurchaseRequisitionDetailLedger({
  capabilities,
  initialStatuses = [],
  onCreate,
  onOpenRequisition,
  onViewPurchaseOrders,
  onViewChange,
  tableActionRef,
  filterFormRef,
  savedViewController,
}: PurchaseRequisitionDetailLedgerProps) {
  const [summary, setSummary] = useState<PurchaseRequisitionDetailLedgerSummary>();

  const initialFilters = useMemo(
    () => (initialStatuses.length ? { status: [...initialStatuses] } : undefined),
    [initialStatuses],
  );

  const buildQuery = (
    params: Record<string, unknown>,
    sortQuery: Pick<PurchaseRequisitionDetailLedgerQuery, 'orderBy' | 'orderDir'> = {},
  ): PurchaseRequisitionDetailLedgerQuery => {
    const statusParam = params.status;
    const statuses = Array.isArray(params.statuses)
      ? params.statuses
      : Array.isArray(statusParam)
        ? statusParam
        : undefined;
    const status = typeof statusParam === 'string' ? statusParam : undefined;
    return {
      keyword: (params.keyword as string) || undefined,
      prNo: (params.prNo as string) || undefined,
      status: statuses?.length ? undefined : status,
      statuses: statuses as string[] | undefined,
      materialId: (params.materialId as string) || undefined,
      supplierId: (params.supplierId as string) || undefined,
      orderBy: sortQuery.orderBy ?? 'businessPriority',
      orderDir: sortQuery.orderDir ?? 'ASC',
    };
  };

  const columns = useMemo<ProColumns<PurchaseRequisitionDetailLedgerRow>[]>(
    () => [
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
        title: '关键词',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: {
          placeholder: '申请编号、申请人、物料、供应商或行备注',
        },
      },
      {
        title: '物料名称',
        dataIndex: 'materialName',
        width: 180,
        ellipsis: true,
        sorter: true,
        search: false,
        render: (_value, row) => row.material?.name || '-',
      },
      {
        title: '物料编码',
        dataIndex: 'materialCode',
        width: 130,
        sorter: true,
        search: false,
        render: (_value, row) => row.material?.code || '-',
      },
      {
        title: '规格',
        dataIndex: 'materialSpec',
        width: 170,
        ellipsis: true,
        search: false,
        sorter: true,
        render: (_value, row) => row.material?.spec || '-',
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
        title: '需求数量',
        dataIndex: 'requiredQty',
        width: 110,
        align: 'right',
        search: false,
        sorter: true,
        render: (_value, row) => capabilities.format.formatQty(row.requiredQty),
      },
      {
        title: '已下单',
        dataIndex: 'orderedQty',
        width: 100,
        align: 'right',
        search: false,
        sorter: true,
        render: (_value, row) => capabilities.format.formatQty(row.orderedQty ?? 0),
      },
      {
        title: '剩余可转',
        dataIndex: 'remainingQty',
        width: 110,
        align: 'right',
        search: false,
        sorter: true,
        render: (_value, row) => capabilities.format.formatQty(remainingQty(row)),
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        valueType: 'select',
        valueEnum: capabilities.statusEnum,
        fieldProps: { mode: 'multiple' },
        sorter: true,
        render: (_value, row) =>
          row.requisition?.status ? (
            <StatusDisplay
              value={row.requisition.status}
              enumMap={capabilities.statusEnum}
            />
          ) : (
            '-'
          ),
      },
      {
        title: '行号',
        dataIndex: 'lineNo',
        width: 70,
        align: 'center',
        search: false,
        render: (_value, row, index) =>
          row.lineNo ??
          (Number.isFinite(Number(row.sortOrder))
            ? Number(row.sortOrder) + 1
            : index + 1),
      },
      {
        title: '申请编号',
        dataIndex: 'prNo',
        width: 160,
        sorter: true,
        render: (_value, row) => {
          const requisition = row.requisition;
          if (!requisition?.id) return requisition?.prNo ?? '-';
          return (
            <Button
              type="link"
              size="small"
              onClick={() => onOpenRequisition(requisition.id!)}
            >
              {requisition.prNo}
            </Button>
          );
        },
      },
      {
        title: '来源',
        dataIndex: 'sourceType',
        width: 110,
        valueType: 'select',
        valueEnum: capabilities.sourceTypeEnum,
        search: false,
        sorter: true,
        render: (_value, row) =>
          row.requisition?.sourceType ? (
            <StatusDisplay
              value={row.requisition.sourceType}
              enumMap={capabilities.sourceTypeEnum}
            />
          ) : (
            '-'
          ),
      },
      {
        title: '申请人',
        dataIndex: 'requestedByName',
        width: 120,
        search: false,
        sorter: true,
        render: (_value, row) =>
          row.requisition?.requestedBy?.realName ||
          row.requisition?.requestedBy?.username ||
          '-',
      },
      {
        title: '审批人',
        dataIndex: 'approvedByName',
        width: 120,
        search: false,
        sorter: true,
        render: (_value, row) =>
          row.requisition?.approvedBy?.realName ||
          row.requisition?.approvedBy?.username ||
          '-',
      },
      {
        title: '建议供应商',
        dataIndex: 'supplierName',
        width: 150,
        ellipsis: true,
        search: false,
        sorter: true,
        render: (_value, row) => row.supplier?.name || '-',
      },
      {
        title: '建议采购日期',
        dataIndex: 'suggestedPurchaseDate',
        width: 130,
        valueType: 'date',
        search: false,
        sorter: true,
        render: (_value, row) => capabilities.format.formatDate(row.suggestedPurchaseDate),
      },
      {
        title: '期望到货日期',
        dataIndex: 'expectedArrivalDate',
        width: 130,
        valueType: 'date',
        search: false,
        sorter: true,
        render: (_value, row) =>
          row.expectedArrivalDate ? (
            capabilities.format.formatDate(row.expectedArrivalDate)
          ) : (
            <Tag color="red">未填写</Tag>
          ),
      },
      {
        title: '行备注',
        dataIndex: 'remarks',
        width: 160,
        ellipsis: true,
        search: false,
        render: (_value, row) => row.remarks || '-',
      },
      {
        title: '创建日期',
        dataIndex: 'createdAt',
        width: 150,
        valueType: 'date',
        search: false,
        sorter: true,
        render: (_value, row) => capabilities.format.formatDate(row.createdAt),
      },
      {
        title: '更新日期',
        dataIndex: 'updatedAt',
        width: 150,
        valueType: 'date',
        search: false,
        sorter: true,
        render: (_value, row) => capabilities.format.formatDate(row.updatedAt),
      },
      ...(capabilities.materialCustomFieldColumns ?? []),
      ...(capabilities.lineCustomFieldColumns ?? []),
      ...(capabilities.canViewRequisition && capabilities.renderDocumentActions
        ? [
            {
              title: '更多操作',
              dataIndex: '__requisitionDocumentActions',
              key: '__requisitionDocumentActions',
              valueType: 'option' as const,
              width: 64,
              fixed: 'right' as const,
              search: false,
              render: (_value: ReactNode, row: PurchaseRequisitionDetailLedgerRow) =>
                row.requisition?.id
                  ? capabilities.renderDocumentActions?.(row, {
                      onViewPurchaseOrders: () =>
                        onViewPurchaseOrders(row.requisition!.id!),
                    })
                  : null,
            },
          ]
        : []),
    ],
    [capabilities, onOpenRequisition, onViewPurchaseOrders],
  );

  const lightFilter = {
    formValuesFromFilters: (filters: Record<string, unknown>) => ({
      prNo: filters.prNo,
      materialId: filters.materialId,
      supplierId: filters.supplierId,
      status: filters.statuses ?? filters.status,
    }),
  };

  return (
    <DocumentDetailLedgerTable<
      PurchaseRequisitionDetailLedgerRow,
      PurchaseRequisitionDetailLedgerQuery,
      {
        list?: PurchaseRequisitionDetailLedgerRow[];
        total?: number;
        summary: PurchaseRequisitionDetailLedgerSummary;
      }
    >
      tableActionRef={tableActionRef}
      filterFormRef={filterFormRef}
      savedView={{ controller: savedViewController }}
      initialQuery={{ orderBy: 'businessPriority', orderDir: 'ASC' }}
      initialFilters={initialFilters}
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
      resizable={{ ...capabilities.resizable, sortPersistenceKey: false }}
      serverSortFields={capabilities.serverSortFields}
      scrollX={1890}
      onViewChange={onViewChange}
      onResponse={(response) => {
        setSummary(response.summary);
        capabilities.onResponse?.(response);
      }}
      footer={
        summary ? (
          <>
            <span>申请单数 {capabilities.format.formatNumber(summary.requisitionCount)}</span>
            <span>申请明细行 {capabilities.format.formatNumber(summary.itemCount)}</span>
            <span>需求数量 {capabilities.format.formatQty(summary.requiredQty)}</span>
            <span>已下单 {capabilities.format.formatQty(summary.orderedQty)}</span>
            <span>剩余可转 {capabilities.format.formatQty(summary.remainingQty)}</span>
            {summary.missingExpectedArrivalDateCount > 0 ? (
              <Typography.Text type="danger">
                缺少到货日期 {capabilities.format.formatNumber(summary.missingExpectedArrivalDateCount)}
              </Typography.Text>
            ) : null}
          </>
        ) : null
      }
      lightFilter={lightFilter}
    />
  );
}
