import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Space, Typography } from 'antd';
import { PaginationSummary, SectionCard, TableSummary } from '../../src';
import { ResizableProTable } from '../../src/mes';

type InventoryDemoRow = {
  id: string;
  material: string;
  unit: string;
  quantity: number;
  availableQty: number;
};

const rows: InventoryDemoRow[] = [
  { id: 'kit-a', material: '示例固定组件 A', unit: '件', quantity: 3, availableQty: 3 },
  { id: 'kit-b', material: '示例固定组件 B', unit: '件', quantity: 6, availableQty: 5 },
  { id: 'kit-c', material: '示例固定组件 C', unit: '件', quantity: 2, availableQty: 1 },
  { id: 'kit-d', material: '示例固定组件 D', unit: '件', quantity: 8, availableQty: 7 },
  { id: 'kit-e', material: '示例固定组件 E', unit: '件', quantity: 4, availableQty: 4 },
  { id: 'kit-f', material: '示例固定组件 F', unit: '件', quantity: 5, availableQty: 4 },
];

type TransactionDemoRow = {
  id: string;
  material: string;
  transaction: string;
  quantity: number;
};

const transactionRows: TransactionDemoRow[] = Array.from(
  { length: 12 },
  (_, index) => ({
    id: `transaction-${index + 1}`,
    material: `示例物料 ${String(index + 1).padStart(2, '0')}`,
    transaction: index % 2 === 0 ? '采购入库' : '生产领料',
    quantity: index % 2 === 0 ? 12 : 8,
  }),
);

const inventoryColumns: ProColumns<InventoryDemoRow>[] = [
  { title: '物料', dataIndex: 'material', width: 220, ellipsis: true },
  { title: '单位', dataIndex: 'unit', width: 72 },
  { title: '账面数量', dataIndex: 'quantity', align: 'right', width: 130 },
  { title: '可用数量', dataIndex: 'availableQty', align: 'right', width: 130 },
];

const transactionColumns: ProColumns<TransactionDemoRow>[] = [
  { title: '物料', dataIndex: 'material', width: 220 },
  { title: '业务类型', dataIndex: 'transaction', width: 140 },
  { title: '数量', dataIndex: 'quantity', align: 'right', width: 120 },
  { title: '操作', key: 'actions', width: 100, fixed: 'right' },
];

export function TableSummaryPage() {
  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      <SectionCard title="列对齐的固定合计行">
        <Typography.Paragraph type="secondary">
          同单位的可加字段按表格列对齐，并固定在表格底部。
        </Typography.Paragraph>
        <ProTable<InventoryDemoRow>
          rowKey="id"
          columns={inventoryColumns}
          dataSource={rows}
          search={false}
          options={false}
          pagination={false}
          scroll={{ x: 552, y: 240 }}
          summary={() => (
            <TableSummary>
              <TableSummary.Cell index={0}>
                <Typography.Text strong>合计</Typography.Text>
              </TableSummary.Cell>
              <TableSummary.Cell index={1}>件</TableSummary.Cell>
              <TableSummary.Cell index={2} align="right">
                {rows.reduce((sum, row) => sum + row.quantity, 0)}
              </TableSummary.Cell>
              <TableSummary.Cell index={3} align="right">
                {rows.reduce((sum, row) => sum + row.availableQty, 0)}
              </TableSummary.Cell>
            </TableSummary>
          )}
        />
      </SectionCard>

      <SectionCard title="跟随数据行的多单位汇总">
        <Typography.Paragraph type="secondary">
          多单位净变动属于表格结果，放在数据行之后并随表格滚动。
        </Typography.Paragraph>
        <ResizableProTable<TransactionDemoRow>
          rowKey="id"
          columns={transactionColumns}
          dataSource={transactionRows}
          search={false}
          options={{ density: true, setting: true, reload: false, fullScreen: false }}
          pagination={{ pageSize: 5, showSizeChanger: false }}
          scroll={{ x: 480 }}
          resizable={{ persistenceKey: 'sxw_catalog_table_summary_full_width' }}
          summary={() => (
            <TableSummary fixed={false} fullWidth>
              <Space wrap size={[16, 4]}>
                <Typography.Text type="secondary">
                  筛选结果净变动：
                </Typography.Text>
                <span>+47,397.04 个</span>
                <span>+110 升</span>
                <span>+919 件</span>
                <span>+1,970 张</span>
              </Space>
            </TableSummary>
          )}
        />
      </SectionCard>

      <SectionCard title="与分页共用的简要结果摘要">
        <Typography.Paragraph type="secondary">
          简短、无需与数据行一起滚动的筛选结果概览放在分页左侧。
        </Typography.Paragraph>
        <ResizableProTable<TransactionDemoRow>
          rowKey="id"
          columns={transactionColumns}
          dataSource={transactionRows}
          search={false}
          options={false}
          pagination={{ pageSize: 5, showSizeChanger: false }}
          scroll={{ x: 480 }}
          paginationSummary={
            <PaginationSummary label="筛选结果：">
              <span>净变动 +919 件</span>
            </PaginationSummary>
          }
        />
      </SectionCard>
    </Space>
  );
}
