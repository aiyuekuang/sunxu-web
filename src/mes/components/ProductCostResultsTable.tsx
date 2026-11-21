/** @sunxu-component mes-specific @sunxu-domain product-cost @sunxu-reason Preserves the product-cost result columns and paging while the host supplies query access, money formatting, and status labels. */
import type { ProColumns } from '@ant-design/pro-components';
import { StatusTag } from '../../components/StatusTag';
import { ResizableProTable as ProTable } from './ResizableTable';
import { StatusDisplay } from './StatusDisplay';
import type {
  ProductCostResultsTableProps,
  ProductCostResultRecord,
} from './product-cost-results-table-types';

/** Lists calculated cost results for the host-selected accounting period. */
export function ProductCostResultsTable({
  query,
  capabilities,
}: ProductCostResultsTableProps) {
  const columns: ProColumns<ProductCostResultRecord>[] = [
    {
      title: '产品名称',
      dataIndex: 'materialName',
      width: 180,
      ellipsis: true,
      render: (_, record) => record.materialName || '-',
    },
    {
      title: '产品编码',
      dataIndex: 'materialCode',
      width: 130,
      copyable: true,
      render: (_, record) => record.materialCode || '-',
    },
    {
      title: '工单号',
      dataIndex: 'workOrderNo',
      width: 150,
      copyable: true,
      render: (_, record) => record.workOrderNo || record.workOrderId,
    },
    {
      title: '期初成本',
      dataIndex: 'openingCost',
      width: 120,
      align: 'right',
      search: false,
      render: (_, record) => capabilities.formatMoney(record.openingCost),
    },
    {
      title: '直接材料',
      dataIndex: 'directMaterialCost',
      width: 120,
      align: 'right',
      search: false,
      render: (_, record) =>
        capabilities.formatMoney(record.directMaterialCost),
    },
    {
      title: '直接人工',
      dataIndex: 'directLaborCost',
      width: 120,
      align: 'right',
      search: false,
      render: (_, record) => capabilities.formatMoney(record.directLaborCost),
    },
    {
      title: '制造费用',
      dataIndex: 'manufacturingOverheadCost',
      width: 120,
      align: 'right',
      search: false,
      render: (_, record) =>
        capabilities.formatMoney(record.manufacturingOverheadCost),
    },
    {
      title: '完工数量',
      dataIndex: 'completedQuantity',
      width: 110,
      align: 'right',
      search: false,
      render: (_, record) => Number(record.completedQuantity).toFixed(6),
    },
    {
      title: '完工成本',
      dataIndex: 'completedCost',
      width: 120,
      align: 'right',
      search: false,
      render: (_, record) => capabilities.formatMoney(record.completedCost),
    },
    {
      title: '完工单位成本',
      dataIndex: 'completedUnitCost',
      width: 130,
      align: 'right',
      search: false,
      render: (_, record) =>
        capabilities.formatMoney(record.completedUnitCost),
    },
    {
      title: '月末在产品成本',
      dataIndex: 'closingWipCost',
      width: 140,
      align: 'right',
      search: false,
      render: (_, record) => capabilities.formatMoney(record.closingWipCost),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(capabilities.statusEnum).map(([key, value]) => [
          key,
          { text: value.text },
        ]),
      ),
      render: (_, record) =>
        record.status ? (
          <StatusDisplay
            value={record.status}
            enumMap={capabilities.statusEnum}
          />
        ) : (
          <StatusTag color="#86909C">-</StatusTag>
        ),
    },
  ];

  return (
    <ProTable<ProductCostResultRecord>
      rowKey="id"
      search={false}
      options={false}
      fitContainerHeight={false}
      pagination={capabilities.pagination}
      scroll={{ x: 1680 }}
      columns={columns}
      request={async (params, sort) => {
        const activeSort = Object.entries(sort ?? {}).find(
          ([, value]) => value === 'ascend' || value === 'descend',
        );
        const result = await capabilities.requestResults({
          ...query,
          page: params.current ?? 1,
          pageSize: params.pageSize ?? capabilities.defaultPageSize,
          ...(activeSort
            ? {
                orderBy: activeSort[0],
                orderDir: activeSort[1] === 'ascend' ? 'ASC' : 'DESC',
              }
            : {}),
        });
        return {
          data: result.list ?? [],
          total: result.total ?? 0,
          success: true,
        };
      }}
    />
  );
}
