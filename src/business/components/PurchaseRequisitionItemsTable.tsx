import type { ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import { useMemo } from 'react';
import { ResizableProTable as ProTable } from './ResizableTable';

export interface PurchaseRequisitionItemTableRow {
  id?: string;
  lineNo?: number | null;
  sortOrder?: number | string | null;
  requiredQty?: number | string | null;
  orderedQty?: number | string | null;
  remainingQty?: number | string | null;
  material?: {
    name?: string | null;
    code?: string | null;
    spec?: string | null;
    unit?: string | null;
  } | null;
  supplier?: { name?: string | null } | null;
  suggestedPurchaseDate?: string | null;
  expectedArrivalDate?: string | null;
  remarks?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PurchaseRequisitionItemsTableFormatters {
  formatUnit: (unit?: string | null) => string;
  formatQty: (value?: number | string | null) => string;
  formatDate: (value?: string | null) => string;
}

export interface PurchaseRequisitionItemsTableProps<
  Row extends PurchaseRequisitionItemTableRow,
> {
  items?: Row[] | null;
  formatters: PurchaseRequisitionItemsTableFormatters;
}

function toFiniteQuantity(value: number | string | null | undefined): number {
  if (value == null || value === '') return 0;
  const parsed = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : 0;
}

function getRemainingQty(row: PurchaseRequisitionItemTableRow): number {
  if (row.remainingQty != null) return Number(row.remainingQty);
  return Math.max(
    0,
    toFiniteQuantity(row.requiredQty) - toFiniteQuantity(row.orderedQty),
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain purchase-requisition
 * @sunxu-reason Renders the expanded purchase-requisition item rows with stable material-first columns and arrival-date warnings; quantity, unit, and date display formatting are supplied by the MES host.
 */
export function PurchaseRequisitionItemsTable<
  Row extends PurchaseRequisitionItemTableRow,
>({ items, formatters }: PurchaseRequisitionItemsTableProps<Row>) {
  const columns = useMemo<ProColumns<Row>[]>(
    () => [
      {
        title: '物料名称',
        dataIndex: 'materialName',
        width: 180,
        ellipsis: true,
        search: false,
        render: (_value, row) => row.material?.name || '-',
      },
      {
        title: '物料编码',
        dataIndex: 'materialCode',
        width: 130,
        search: false,
        render: (_value, row) => row.material?.code || '-',
      },
      {
        title: '规格',
        dataIndex: 'materialSpec',
        width: 170,
        ellipsis: true,
        search: false,
        render: (_value, row) => row.material?.spec || '-',
      },
      {
        title: '单位',
        dataIndex: 'materialUnit',
        width: 90,
        search: false,
        render: (_value, row) => formatters.formatUnit(row.material?.unit) || '-',
      },
      {
        title: '需求数量',
        dataIndex: 'requiredQty',
        width: 110,
        align: 'right',
        search: false,
        render: (_value, row) => formatters.formatQty(row.requiredQty),
      },
      {
        title: '已下单',
        dataIndex: 'orderedQty',
        width: 100,
        align: 'right',
        search: false,
        render: (_value, row) => formatters.formatQty(row.orderedQty ?? 0),
      },
      {
        title: '剩余可转',
        dataIndex: 'remainingQty',
        width: 110,
        align: 'right',
        search: false,
        render: (_value, row) => formatters.formatQty(getRemainingQty(row)),
      },
      {
        title: '建议供应商',
        dataIndex: 'supplierName',
        width: 150,
        ellipsis: true,
        search: false,
        render: (_value, row) => row.supplier?.name || '-',
      },
      {
        title: '建议采购日期',
        dataIndex: 'suggestedPurchaseDate',
        width: 130,
        valueType: 'date',
        search: false,
        render: (_value, row) => formatters.formatDate(row.suggestedPurchaseDate),
      },
      {
        title: '期望到货日期',
        dataIndex: 'expectedArrivalDate',
        width: 130,
        valueType: 'date',
        search: false,
        render: (_value, row) =>
          row.expectedArrivalDate ? (
            formatters.formatDate(row.expectedArrivalDate)
          ) : (
            <Tag color="red">未填写</Tag>
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
        render: (_value, row) => formatters.formatDate(row.createdAt),
      },
      {
        title: '更新日期',
        dataIndex: 'updatedAt',
        width: 150,
        valueType: 'date',
        search: false,
        render: (_value, row) => formatters.formatDate(row.updatedAt),
      },
    ],
    [formatters],
  );

  return (
    <ProTable<Row>
      rowKey="id"
      className="mes-expanded-detail-table"
      search={false}
      options={false}
      headerTitle={false}
      dataSource={items ?? []}
      pagination={false}
      fitContainerHeight={false}
      resizable={false}
      size="small"
      scroll={{ x: 'max-content' }}
      columns={columns}
    />
  );
}
