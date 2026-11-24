import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { App, Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import { ExpenseBillLinesEditableTable } from '../../src/mes/components/ExpenseBillLinesEditableTable';
import { FundsTransactionDrawer } from '../../src/mes/components/FundsTransactionDrawer';
import type {
  ExpenseBillLineCustomFieldSchema,
  ExpenseBillLineDraft,
  ExpenseBillLinesEditableTableCapabilities,
  ExpenseReceiptOption,
} from '../../src/mes/components/expense-bill-lines-editable-table-types';
import type { FundsTransactionDrawerCapabilities } from '../../src/mes/components/funds-transaction-drawer-types';

const receiptOptions: ExpenseReceiptOption[] = [
  {
    label: '入库单 RK-2026-0312 / 远航工业材料',
    value: 'receipt-0312',
    receiptNo: 'RK-2026-0312',
  },
  {
    label: '入库单 RK-2026-0298 / 北辰包装',
    value: 'receipt-0298',
    receiptNo: 'RK-2026-0298',
  },
];

const lineCustomFieldSchema: ExpenseBillLineCustomFieldSchema = {
  schemaVersion: 3,
  systemFields: [{ key: 'amount', label: '金额', dataType: 'money' }],
  fields: [
    {
      fieldKey: 'allocationNote',
      label: '分摊说明',
      fieldKind: 'input',
      dataType: 'long_text',
      requiredPolicy: 'none',
      sortOrder: 10,
      displayJson: { showInForm: true, sortOrder: 1 },
    },
    {
      fieldKey: 'taxEstimate',
      label: '含税估算',
      fieldKind: 'formula',
      dataType: 'money',
      sortOrder: 20,
      displayJson: { showInForm: true, sortOrder: 2 },
    },
  ],
};

export function FundsExpenseComponentsDemo() {
  const { message } = App.useApp();
  const [rows, setRows] = useState<ExpenseBillLineDraft[]>([
    {
      _key: 'expense-demo-1',
      categoryId: 'freight',
      amount: 380,
      description: '采购运费',
      sourceType: 'purchase_receipt',
      sourceId: 'receipt-0312',
      sourceNo: 'RK-2026-0312',
      customValues: { allocationNote: '按采购物料金额分摊。' },
    },
    {
      _key: 'expense-demo-2',
      categoryId: 'packing',
      amount: 120,
      description: '防潮包装材料',
      customValues: {},
    },
  ]);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [lastPreviewCount, setLastPreviewCount] = useState(0);

  const tableCapabilities = useMemo<ExpenseBillLinesEditableTableCapabilities>(
    () => ({
      searchReceipt: async (keyword) =>
        receiptOptions.filter((option) =>
          option.label.toLowerCase().includes(keyword.toLowerCase()),
        ),
      previewRuntimeValues: async ({ items }) => {
        setLastPreviewCount(items.length);
        return {
          items: items.map((item) => {
            const amount = Number(item.amount ?? 0);
            return {
              customComputedValues: {
                taxEstimate: Number((amount * 1.13).toFixed(2)),
              },
              customComputedErrors: {},
            };
          }),
        };
      },
      notifyError: (text) => message.error(text),
    }),
    [message],
  );

  const drawerCapabilities = useMemo<FundsTransactionDrawerCapabilities>(
    () => ({
      loadDetail: async () => ({
        transactionNo: 'FT-2026-00816',
        status: 'posted',
        account: { name: '招商银行基本户' },
        direction: 'out',
        amount: 500,
        currency: 'CNY',
        bizDate: '2026-11-18',
        counterpartyName: '远航工业材料',
        sourceNo: 'FY-2026-0051',
        createdAt: '2026-11-18T10:30:00+08:00',
        remark: '费用单付款流水',
      }),
      statusLabel: (status) => (status === 'posted' ? '已记账' : '已冲正'),
      directionLabel: (direction) => (direction === 'in' ? '收入' : '支出'),
      formatAmount: (amount) => Number(amount).toFixed(2),
      formatDate: (value) => dayjs(value).format('YYYY-MM-DD'),
      formatDateTime: (value) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
      notifyLoadError: () => message.error('加载资金流水失败'),
    }),
    [message],
  );

  return (
    <SectionCard title="费用明细与资金流水组件">
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary">
          演示费用类别、金额校验、采购入库单搜索、自定义字段与公式预览、批量编辑和合计，以及宿主加载的资金流水详情。
        </Typography.Paragraph>
        <Button onClick={() => setTransactionOpen(true)}>查看资金流水</Button>
        <ExpenseBillLinesEditableTable
          rows={rows}
          onRowsChange={setRows}
          categoryOptions={[
            { label: '采购运费', value: 'freight' },
            { label: '采购包装费', value: 'packing' },
            { label: '办公支出', value: 'office' },
          ]}
          receiptOptions={receiptOptions}
          lineCustomFieldSchema={lineCustomFieldSchema}
          capabilities={tableCapabilities}
        />
        <Typography.Text type="secondary" role="status" aria-live="polite">
          最近预览明细行数：{lastPreviewCount}
        </Typography.Text>
      </Space>
      <FundsTransactionDrawer
        open={transactionOpen}
        transactionId="transaction-demo-0816"
        onClose={() => setTransactionOpen(false)}
        capabilities={drawerCapabilities}
      />
    </SectionCard>
  );
}
