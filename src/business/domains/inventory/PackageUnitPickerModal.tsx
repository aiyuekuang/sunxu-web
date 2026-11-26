import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Modal, Space, Tag } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ResizableProTable } from '../shared/ResizableTable';
import type {
  PackageUnitPickerModalProps,
  SalesDeliveryPackageUnitRecord,
} from '../sales/sales-delivery-components-types';

/** @sunxu-layer business @sunxu-domain inventory @sunxu-reason Preserves eligible package selection and request states while the host supplies warehouse records and status dictionaries.*/
export function PackageUnitPickerModal({
  open,
  onOpenChange,
  warehouseId,
  materialId,
  batchNo,
  deliveryOrderId,
  value,
  onSelect,
  capabilities,
}: PackageUnitPickerModalProps) {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [selectedRowKey, setSelectedRowKey] = useState<string | undefined>(value);
  const [selectedRecord, setSelectedRecord] = useState<SalesDeliveryPackageUnitRecord | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedRowKey(undefined);
      setSelectedRecord(null);
      return;
    }
    setSelectedRowKey(value);
  }, [open, value]);

  const ready = Boolean(warehouseId && materialId);
  const columns = useMemo<ProColumns<SalesDeliveryPackageUnitRecord>[]>(
    () => [
      { title: '包装号', dataIndex: 'packageNo', width: 180 },
      { title: '批号', dataIndex: 'batchNo', width: 160, render: (_, record) => record.batchNo || '未启用批号追溯' },
      { title: '物料', dataIndex: ['material', 'name'], search: false, width: 160, render: (_, record) => record.material?.name ?? '-' },
      { title: '数量', dataIndex: 'totalQty', search: false, width: 110 },
      { title: '包装类型', dataIndex: 'packageType', search: false, width: 100, render: (_, record) => capabilities.packageTypeLabels[record.packageType] ?? record.packageType },
      {
        title: '状态', dataIndex: 'status', search: false, width: 120,
        render: (_, record) => {
          const config = capabilities.packageStatus[record.status];
          return config ? <Tag color={config.color}>{config.text}</Tag> : record.status;
        },
      },
      { title: '仓库', dataIndex: ['warehouse', 'name'], search: false, width: 120, render: (_, record) => record.warehouse?.name ?? '-' },
    ],
    [capabilities.packageStatus, capabilities.packageTypeLabels],
  );

  const request = useCallback(async (params: Record<string, unknown>) => {
    const result = await capabilities.listAvailableForDelivery({
      page: Number(params.current ?? 1),
      pageSize: Number(params.pageSize ?? 20),
      keyword: typeof params.keyword === 'string' ? params.keyword : undefined,
      deliveryOrderId,
      warehouseId,
      materialId,
      batchNo: batchNo?.trim() || undefined,
    });
    return { data: result.list ?? [], success: true, total: result.total ?? result.list?.length ?? 0 };
  }, [batchNo, capabilities.listAvailableForDelivery, deliveryOrderId, materialId, warehouseId]);

  return (
    <Modal
      title="选择包装单元"
      open={open}
      width={960}
      destroyOnHidden
      onCancel={() => onOpenChange(false)}
      footer={
        <Space>
          <Button htmlType="button" onClick={() => onOpenChange(false)}>取消</Button>
          <Button
            htmlType="button"
            type="primary"
            onClick={() => {
              if (!selectedRecord) {
                capabilities.notify.warning('请先选择一个包装单元');
                return;
              }
              onSelect(selectedRecord);
              onOpenChange(false);
            }}
          >使用该包装箱</Button>
        </Space>
      }
    >
      {!ready ? (
        <div style={{ padding: '16px 0', color: 'rgba(0, 0, 0, 0.45)' }}>请先选择出库仓库和物料，再选择包装箱。</div>
      ) : (
        <ResizableProTable<SalesDeliveryPackageUnitRecord>
          rowKey="id"
          columns={columns}
          actionRef={actionRef}
          search={false}
          pagination={capabilities.pagination ?? { defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100] }}
          fitContainerHeight={false}
          options={false}
          request={request}
          rowSelection={{
            type: 'radio',
            selectedRowKeys: selectedRowKey ? [selectedRowKey] : [],
            onChange: (keys, rows) => {
              const nextKey = typeof keys[0] === 'string' ? keys[0] : undefined;
              setSelectedRowKey(nextKey);
              setSelectedRecord(rows[0] ?? null);
            },
          }}
          onRow={(record) => ({
            onClick: () => {
              setSelectedRowKey(record.id);
              setSelectedRecord(record);
            },
          })}
          tableAlertRender={false}
          tableAlertOptionRender={false}
        />
      )}
    </Modal>
  );
}
