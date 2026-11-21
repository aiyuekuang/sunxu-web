import { useState } from 'react';
import { Button, Form, Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  ReportDynamicFields,
  type ReportDynamicPrecheck,
} from '../../src/mes';

const reportModes: Record<string, ReportDynamicPrecheck> = {
  operation: {
    quantityInputMode: 'operation',
    operationReportUnit: '工序件',
    requiredInputs: ['batchNo', 'scheduleEntryId', 'scrapReason'],
    batchOptions: ['BATCH-2026-011', 'BATCH-2026-012'],
    scheduleOptions: [
      { id: 'entry-1', label: '加工中心 A · 08:00-12:00', remainingQty: 36 },
      { id: 'entry-2', label: '加工中心 B · 13:00-17:00', remainingQty: 18 },
    ],
  },
  abnormal: {
    quantityInputMode: 'product',
    requiredInputs: ['zeroQuantityReason', 'abnormalDurationConfirmed'],
  },
};

export function ReportDynamicFieldsDemo() {
  const [mode, setMode] = useState('operation');
  const [form] = Form.useForm();
  const [lastAction, setLastAction] = useState('尚未校验');

  return (
    <SectionCard title="动态报工字段">
      <Typography.Paragraph type="secondary">
        字段显隐由预检结果驱动；报工请求和数值格式由宿主提供。
      </Typography.Paragraph>
      <Segmented
        aria-label="报工字段场景"
        value={mode}
        options={[
          { label: '工序报工', value: 'operation' },
          { label: '零数量/异常工时', value: 'abnormal' },
        ]}
        onChange={(value) => {
          setMode(value);
          form.resetFields();
          setLastAction('尚未校验');
        }}
      />
      <Form
        form={form}
        layout="vertical"
        style={{ maxWidth: 720, marginTop: 16 }}
      >
        <ReportDynamicFields
          precheck={reportModes[mode]}
          formatNumber={(value, options) =>
            new Intl.NumberFormat('zh-CN', {
              maximumFractionDigits: options.maximumFractionDigits,
            }).format(value)
          }
        />
        <Space>
          <Button
            type="primary"
            onClick={async () => {
              try {
                const values = await form.validateFields();
                setLastAction(`字段有效：${Object.keys(values).length} 项`);
              } catch {
                setLastAction('请补齐必填报工字段');
              }
            }}
          >
            校验字段
          </Button>
          <Typography.Text type="secondary" aria-live="polite">
            {lastAction}
          </Typography.Text>
        </Space>
      </Form>
    </SectionCard>
  );
}
