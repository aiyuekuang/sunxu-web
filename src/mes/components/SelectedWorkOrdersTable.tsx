/** @sunxu-component mes-specific @sunxu-domain manufacturing @sunxu-reason Keeps selected work-order identity and planned-quantity review consistent while MES material and unit formatting stay host supplied. */
import { Space, Typography } from 'antd';
import { ResizableTable as Table } from './ResizableTable';
import type {
  SelectedWorkOrderRecord,
  SelectedWorkOrdersTableProps,
} from './selected-work-orders-table-types';

/** Compact review table used before a host performs a work-order action. */
export function SelectedWorkOrdersTable({
  workOrders,
  capabilities,
}: SelectedWorkOrdersTableProps) {
  return (
    <Table<SelectedWorkOrderRecord>
      rowKey="id"
      size="small"
      pagination={false}
      dataSource={workOrders}
      scroll={{ x: 730, y: 220 }}
      columns={[
        {
          title: '生产工单号',
          dataIndex: 'orderNo',
          width: 190,
          render: (_, record) => (
            <Typography.Text copyable>{record.orderNo}</Typography.Text>
          ),
        },
        {
          title: '物料名称 / 编码',
          width: 220,
          render: (_, record) => {
            const name =
              capabilities.getMaterialName(record) ||
              record.temporaryItemName ||
              '—';
            const code =
              capabilities.getMaterialCode(record) || record.temporaryItemCode;
            return (
              <Space direction="vertical" size={0}>
                <Typography.Text ellipsis={{ tooltip: name }}>
                  {name}
                </Typography.Text>
                {code ? (
                  <Typography.Text
                    type="secondary"
                    ellipsis={{ tooltip: `编码：${code}` }}
                  >
                    编码：{code}
                  </Typography.Text>
                ) : null}
              </Space>
            );
          },
        },
        {
          title: '规格型号',
          width: 190,
          render: (_, record) => {
            const spec =
              capabilities.getMaterialSpec(record) ||
              record.temporaryItemSpec ||
              '—';
            return (
              <Typography.Text ellipsis={{ tooltip: spec }}>
                {spec}
              </Typography.Text>
            );
          },
        },
        {
          title: '计划数量',
          dataIndex: 'plannedQty',
          width: 130,
          align: 'right',
          render: (_, record) => {
            const quantity = capabilities.formatPlannedQuantity(
              record.plannedQty,
            );
            const unit = capabilities.formatMaterialUnit(record);
            return unit ? `${quantity} ${unit}` : quantity;
          },
        },
      ]}
    />
  );
}
