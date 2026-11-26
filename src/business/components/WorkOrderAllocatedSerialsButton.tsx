/** @sunxu-layer business @sunxu-domain manufacturing @sunxu-reason Preserves the allocated finished-serial review dialog while serial lookup, status labels, and MES error formatting remain host supplied. */
import { UnorderedListOutlined } from '@ant-design/icons';
import { App, Button, Empty, Modal, Spin, Tag, Typography } from 'antd';
import { useState } from 'react';
import { ResizableTable as Table } from './ResizableTable';
import type {
  WorkOrderAllocatedSerial,
  WorkOrderAllocatedSerialsButtonProps,
} from './work-order-allocated-serials-types';

/** Opens a read-only list of finished-product serials allocated to one work order. */
export function WorkOrderAllocatedSerialsButton({
  workOrderId,
  capabilities,
}: WorkOrderAllocatedSerialsButtonProps) {
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serials, setSerials] = useState<WorkOrderAllocatedSerial[]>([]);

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    setSerials([]);
    try {
      const result = await capabilities.listSerialsForWorkOrder(workOrderId);
      setSerials(result);
    } catch (error) {
      message.error(
        capabilities.getErrorMessage(error, '读取工单序列号失败'),
      );
    } finally {
      setLoading(false);
    }
  };

  const allocatedCount = serials.filter(
    (serial) => serial.status === capabilities.allocatedStatus,
  ).length;

  return (
    <>
      <Button type="link" icon={<UnorderedListOutlined />} onClick={handleOpen}>
        查看已分配序列号
      </Button>
      <Modal
        title="工单成品序列号"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={760}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary">
          序列号已在工单下达时按计划数量分配。良品报工时，系统会按本次数量自动绑定待报工号码。
        </Typography.Paragraph>
        <Typography.Paragraph>
          本工单共分配 {serials.length} 个号码，其中待报工 {allocatedCount} 个。
        </Typography.Paragraph>
        {loading ? (
          <Spin />
        ) : serials.length > 0 ? (
          <Table<WorkOrderAllocatedSerial>
            rowKey="id"
            size="small"
            dataSource={serials}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ y: 420, x: 560 }}
            columns={[
              {
                title: '序列号',
                dataIndex: 'serialNo',
                key: 'serialNo',
                width: 320,
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                width: 120,
                render: (status: string) => {
                  const option = capabilities.statusLabels[status] ?? {
                    label: status,
                    color: 'default',
                  };
                  return <Tag color={option.color}>{option.label}</Tag>;
                },
              },
              {
                title: '批号',
                dataIndex: 'batchNo',
                key: 'batchNo',
                ellipsis: true,
              },
            ]}
          />
        ) : (
          <Empty description="当前工单没有已分配的成品序列号" />
        )}
      </Modal>
    </>
  );
}
