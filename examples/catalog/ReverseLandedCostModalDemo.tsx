import { useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import { ReverseLandedCostModal } from '../../src/mes';

export function ReverseLandedCostModalDemo() {
  const [open, setOpen] = useState(false);
  const [lastAction, setLastAction] = useState('尚未冲销');

  return (
    <SectionCard title="采购附加费用冲销">
      <Space>
        <Button type="primary" onClick={() => setOpen(true)}>
          打开冲销表单
        </Button>
        <Typography.Text type="secondary" aria-live="polite">
          {lastAction}
        </Typography.Text>
      </Space>
      <ReverseLandedCostModal
        landedCost={open ? { id: 'landed-cost-demo-001' } : null}
        onOpenChange={setOpen}
        onSuccess={() => {
          setLastAction('宿主已收到冲销成功回调');
          setOpen(false);
        }}
        reverseLandedCost={async (params) => {
          await new Promise((resolve) => window.setTimeout(resolve, 150));
          setLastAction(
            `已模拟冲销：${params.id}，业务日期 ${params.businessDate ?? '未填写'}`,
          );
        }}
      />
    </SectionCard>
  );
}
