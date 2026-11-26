import { useRef, useState } from 'react';
import { Button, Space, Typography } from 'antd';
import type { ProFormInstance } from '@ant-design/pro-components';
import { SectionCard } from '../../src';
import {
  DetailLedgerFilterDrawer,
  type DetailLedgerFilterField,
  type DetailLedgerFilterFormValues,
} from '../../src/business';

const fields: DetailLedgerFilterField[] = [
  { type: 'text', name: 'invoiceNo', label: '发票号', placeholder: '输入发票号' },
  {
    type: 'select',
    name: 'status',
    label: '状态',
    valueEnum: {
      draft: { text: '草稿' },
      confirmed: { text: '已确认' },
      cancelled: { text: '已取消' },
    },
  },
  { type: 'dateRange', name: 'dateRange', label: '开票日期' },
  { type: 'switch', name: 'includeRed', label: '包含红字发票' },
];

export function DetailLedgerFilterDrawerDemo() {
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appliedCount, setAppliedCount] = useState(0);
  const [lastFilter, setLastFilter] = useState('尚未应用筛选');

  return (
    <SectionCard title="明细台账筛选表单">
      <Typography.Paragraph type="secondary">
        统一提供文本、远程/枚举下拉、业务日期范围和开关字段；应用成功后关闭，重置回调与远程请求由宿主提供。
      </Typography.Paragraph>
      <Space orientation="vertical" size={8}>
        <Button onClick={() => setOpen(true)}>打开台账筛选</Button>
        <Typography.Text type="secondary" aria-live="polite">
          {lastFilter}；已应用筛选项 {appliedCount}
        </Typography.Text>
      </Space>
      <DetailLedgerFilterDrawer
        open={open}
        loading={loading}
        fields={fields}
        formRef={formRef}
        appliedCount={appliedCount}
        onOpenChange={setOpen}
        onFinish={async (values: DetailLedgerFilterFormValues) => {
          setLoading(true);
          await new Promise((resolve) => window.setTimeout(resolve, 200));
          const count = Object.values(values).filter(
            (value) => value != null && value !== '' && value !== false,
          ).length;
          setAppliedCount(count);
          setLastFilter(`已应用：${JSON.stringify(values)}`);
          setLoading(false);
          return true;
        }}
        onReset={() => {
          formRef.current?.resetFields();
          setAppliedCount(0);
          setLastFilter('筛选已重置');
        }}
      />
    </SectionCard>
  );
}
