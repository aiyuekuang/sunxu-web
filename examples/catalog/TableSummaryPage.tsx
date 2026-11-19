import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { TableSummary } from '../../src';

type InventoryDemoRow = {
  id: string;
  material: string;
  unit: string;
  quantity: number;
  availableQty: number;
};

const rows: InventoryDemoRow[] = [
  {
    id: 'material-kit',
    material: '示例组件包',
    unit: '套',
    quantity: 3,
    availableQty: 3,
  },
  {
    id: 'material-label',
    material: '示例标签',
    unit: '件',
    quantity: 6,
    availableQty: 6,
  },
];

const columns: ProColumns<InventoryDemoRow>[] = [
  { title: '物料', dataIndex: 'material', width: 220, ellipsis: true },
  { title: '单位', dataIndex: 'unit', width: 72 },
  {
    title: '账面数量',
    dataIndex: 'quantity',
    align: 'right',
    width: 130,
  },
  {
    title: '可用数量',
    dataIndex: 'availableQty',
    align: 'right',
    width: 130,
  },
];

export function TableSummaryPage() {
  return (
    <ProTable<InventoryDemoRow>
      rowKey="id"
      headerTitle="库存数量合计示例"
      columns={columns}
      dataSource={rows}
      search={false}
      options={false}
      pagination={false}
      scroll={{ x: 552 }}
      summary={() => (
        <TableSummary>
          <span>账面数量 3 套 / 6 件</span>
          <span>可用数量 3 套 / 6 件</span>
        </TableSummary>
      )}
    />
  );
}
