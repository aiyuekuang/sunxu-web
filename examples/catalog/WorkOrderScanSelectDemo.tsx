import { useMemo, useState } from 'react';
import { Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  MesUiProvider,
  WorkOrderScanSelect,
  type MesWorkOrderScanSelectCapabilities,
  type WorkOrderScanRecord,
} from '../../src/mes';

const demoWorkOrders: WorkOrderScanRecord[] = [
  {
    id: 'work-order-1',
    orderNo: 'WO-2026-0418',
    status: 'in_progress',
    plannedQty: 120,
    completedQty: 36,
    scrappedQty: 0,
    reportedQty: 36,
    progress: 0.3,
    materialName: '6061 铝型材',
    materialUnit: '件',
  },
  {
    id: 'work-order-2',
    orderNo: 'WO-2026-0420',
    status: 'scheduled',
    plannedQty: 80,
    completedQty: 0,
    scrappedQty: 0,
    reportedQty: 0,
    progress: 0,
    materialName: '不锈钢支架',
    materialUnit: '件',
  },
];

export function WorkOrderScanSelectDemo() {
  const [value, setValue] = useState<string>();
  const [valueMode, setValueMode] = useState<'id' | 'orderNo'>('id');
  const [resolved, setResolved] = useState('尚未扫码解析');
  const capabilities = useMemo<MesWorkOrderScanSelectCapabilities>(
    () => ({
      async requestWorkOrders({ keyWords } = {}) {
        await new Promise((resolve) => window.setTimeout(resolve, 120));
        const query = keyWords?.trim().toLocaleLowerCase();
        return demoWorkOrders
          .filter(
            (workOrder) =>
              !query ||
              workOrder.orderNo.toLocaleLowerCase().includes(query) ||
              workOrder.materialName?.toLocaleLowerCase().includes(query),
          )
          .map((workOrder) => ({
            label: `${workOrder.orderNo} - ${workOrder.materialName ?? ''}`,
            value: valueMode === 'orderNo' ? workOrder.orderNo : workOrder.id,
            code: workOrder.orderNo,
            name: workOrder.materialName,
          }));
      },
      async parseScannedWorkOrder({ code }) {
        await new Promise((resolve) => window.setTimeout(resolve, 100));
        return {
          workOrder: demoWorkOrders.find((workOrder) => workOrder.orderNo === code),
        };
      },
    }),
    [valueMode],
  );

  return (
    <SectionCard title="工单搜索与扫码选择">
      <Typography.Paragraph type="secondary">
        支持远程工单搜索、精确/前缀候选排序和键盘楔子扫码解析。页面校验可阻止不符合当前业务条件的扫码结果。
      </Typography.Paragraph>
      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
        <Segmented
          aria-label="工单值模式"
          value={valueMode}
          options={[
            { label: '存储工单 ID', value: 'id' },
            { label: '存储工单号', value: 'orderNo' },
          ]}
          onChange={(mode) => {
            setValueMode(mode as 'id' | 'orderNo');
            setValue(undefined);
          }}
        />
        <MesUiProvider
          hasPermission={() => true}
          workOrderScanSelectCapabilities={capabilities}
        >
          <WorkOrderScanSelect
            value={value}
            valueMode={valueMode}
            onChange={setValue}
            onResolved={(workOrder) =>
              setResolved(`${workOrder.orderNo} / ${workOrder.materialName ?? '未关联物料'}`)
            }
            validateScannedWorkOrder={(workOrder) =>
              workOrder.status === 'cancelled' ? '已取消工单不可选择' : true
            }
          />
        </MesUiProvider>
        <Typography.Text type="secondary" aria-live="polite">
          当前值：{value ?? '空'}；解析结果：{resolved}
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}
