import { useCallback, useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  ProductionReceiptSummaryCard,
  WorkOrderSplitModal,
} from '../../src/mes';

export function WorkOrderSupportComponentsDemo() {
  const [splitOpen, setSplitOpen] = useState(false);
  const [result, setResult] = useState('');
  const requestSummary = useCallback(async () => ({
    receivedQty: 42,
    pendingReceiptCount: 1,
    pendingReceiptQty: 8,
    outputBufferOpenQty: 2,
    disposedQty: 3,
  }), []);

  return (
    <SectionCard title="工单辅助组件">
      <Typography.Paragraph type="secondary">
        展示工单生产入库摘要和拆分弹窗。权限、摘要查询、列表导航、拆分请求、单位字典、字段帮助与成功提示均由 MES 宿主注入。
      </Typography.Paragraph>
      <ProductionReceiptSummaryCard
        workOrderId="work-order-001"
        canView
        canNavigate
        requestSummary={requestSummary}
        onNavigate={(id) => setResult(`打开生产入库列表：${id}`)}
      />
      <Space orientation="vertical" size={8}>
        <Button onClick={() => setSplitOpen(true)}>拆分当前工单</Button>
        <Typography.Text type="secondary" aria-live="polite">
          {result || '尚未执行操作'}
        </Typography.Text>
      </Space>
      <WorkOrderSplitModal
        open={splitOpen}
        workOrderId="work-order-001"
        orderNo="WO-2026-0108"
        maxQty={48}
        allowFullSplit={false}
        unit="PCS"
        unitLabelMap={{ PCS: '件' }}
        splitQtyFieldHelp={{
          label: '拆分数量',
          tooltip: { title: '填写要从当前工单拆出的数量。' },
        }}
        descriptionFieldHelp={{ label: '备注' }}
        splitWorkOrder={async ({ splitQty }) => ({
          child: { id: `work-order-child-${splitQty}` },
        })}
        onClose={() => setSplitOpen(false)}
        onSuccess={(childId) => setResult(`已创建子工单：${childId}`)}
        notifySuccess={() => setResult('拆分成功')}
      />
    </SectionCard>
  );
}
