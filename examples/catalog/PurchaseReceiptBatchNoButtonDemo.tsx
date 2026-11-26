import { useMemo, useState } from 'react';
import { Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  GeneratePurchaseReceiptBatchNoButton,
  MesUiProvider,
  type MesPurchaseReceiptCapabilities,
} from '../../src/business';

export function PurchaseReceiptBatchNoButtonDemo() {
  const [batchNo, setBatchNo] = useState('');
  const [generatedBatchNo, setGeneratedBatchNo] = useState('');
  const [requestCount, setRequestCount] = useState(0);
  const capabilities = useMemo<MesPurchaseReceiptCapabilities>(
    () => ({
      async generateSystemBatchNo({ materialId }) {
        setRequestCount((current) => current + 1);
        await new Promise((resolve) => window.setTimeout(resolve, 250));
        if (materialId === 'material-error') {
          throw new Error('批号编号规则暂未配置');
        }
        if (materialId === 'material-empty') return { batchNo: '  ' };
        if (materialId === 'material-non-error') throw '网络暂不可用';
        return { batchNo: 'RCV-2026-0001' };
      },
    }),
    [],
  );

  return (
    <SectionCard title="采购收货系统批号写入">
      <Typography.Paragraph type="secondary">
        服务由宿主注入。成功后把系统批号回填当前明细；已有批号或未选择物料时不可生成。
      </Typography.Paragraph>
      <MesUiProvider
        hasPermission={() => true}
        purchaseReceiptCapabilities={capabilities}
      >
        <Space orientation="vertical" size={12}>
          <Space wrap align="center">
            <GeneratePurchaseReceiptBatchNoButton
              materialId="material-demo"
              batchNo={batchNo}
              onGenerated={(value) => {
                setBatchNo(value);
                setGeneratedBatchNo(value);
              }}
            />
            <Typography.Text type="secondary">
              当前批号：{batchNo || '未填写'}
            </Typography.Text>
            <Typography.Text aria-live="polite">
              {generatedBatchNo ? `已回填：${generatedBatchNo}` : ''}
            </Typography.Text>
          </Space>
          <Space wrap align="center">
            <GeneratePurchaseReceiptBatchNoButton
              materialId="material-error"
              onGenerated={() => undefined}
            />
            <Typography.Text type="secondary">模拟服务错误</Typography.Text>
          </Space>
          <Space wrap align="center">
            <GeneratePurchaseReceiptBatchNoButton
              materialId="material-empty"
              onGenerated={() => undefined}
            />
            <Typography.Text type="secondary">服务未返回批号</Typography.Text>
          </Space>
          <Space wrap align="center">
            <GeneratePurchaseReceiptBatchNoButton
              materialId="material-non-error"
              onGenerated={() => undefined}
            />
            <Typography.Text type="secondary">非 Error 服务拒绝</Typography.Text>
          </Space>
          <Space wrap align="center">
            <GeneratePurchaseReceiptBatchNoButton onGenerated={() => undefined} />
            <Typography.Text type="secondary">未选择物料，按钮禁用</Typography.Text>
          </Space>
          <Space wrap align="center">
            <GeneratePurchaseReceiptBatchNoButton
              materialId="material-demo"
              batchNo="MANUAL-2026-001"
              onGenerated={() => undefined}
            />
            <Typography.Text type="secondary">已有手工批号，按钮禁用</Typography.Text>
          </Space>
          <Typography.Text type="secondary" aria-live="polite">
            服务请求次数：{requestCount}
          </Typography.Text>
        </Space>
      </MesUiProvider>
      <Space wrap align="center">
        <GeneratePurchaseReceiptBatchNoButton
          materialId="material-no-provider"
          onGenerated={() => undefined}
        />
        <Typography.Text type="secondary">
          未注入服务时显示配置错误
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}
