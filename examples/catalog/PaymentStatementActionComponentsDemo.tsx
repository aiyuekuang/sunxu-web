import { useMemo, useState } from 'react';
import { ProFormSelect } from '@ant-design/pro-components';
import { App, Button, Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import { PaymentRequestActionModals } from '../../src/mes/components/PaymentRequestActionModals';
import { ExportTemplateModal } from '../../src/mes/components/ExportTemplateModal';
import { SendStatementModal } from '../../src/mes/components/SendStatementModal';
import type { PaymentRequestActionCapabilities, PaymentRequestActionRecord } from '../../src/mes/components/payment-request-action-modals-types';
import type { ExportTemplateModalCapabilities, FinanceStatementType } from '../../src/mes/components/finance-statement-template-types';
import type { SendStatementCapabilities, StatementSendPayload } from '../../src/mes/components/send-statement-modal-types';

interface DemoPayment {
  id: string;
  paymentNo: string;
}

const paymentRequest: PaymentRequestActionRecord = {
  id: 'payment-request-001',
  requestNo: 'PR-2026-0418',
  partnerId: 'supplier-018',
  amount: 28600,
  businessCategory: 'supplier_payment',
  currency: 'CNY',
  exchangeRate: 1,
  plannedPaymentDate: '2026-11-25',
  paymentMethod: 'bank_transfer',
  referenceNo: 'PO-2026-018',
  fundsAccountId: 'funds-account-cny',
  description: '采购原材料结算',
  allocations: [{ invoiceId: 'invoice-ap-028', amount: 28600 }],
};

const docLineColumns = [
  { field: 'invoiceNo', header: '单据号', label: '应收/应付单号', defaultVisible: true },
  { field: 'invoiceDate', header: '单据日期', label: '单据业务日期', defaultVisible: true },
  { field: 'dueDate', header: '到期日', label: '单据到期日期', defaultVisible: false },
];

const itemLineColumns = [
  { field: 'itemName', header: '商品名称', label: '商品/物料名称', defaultVisible: true },
  { field: 'quantity', header: '数量', label: '商品数量', defaultVisible: true },
  { field: 'unitPrice', header: '单价', label: '商品单价', defaultVisible: false },
];

export function PaymentStatementActionComponentsDemo() {
  const { message } = App.useApp();
  const [canManageTemplate, setCanManageTemplate] = useState(true);
  const [accountListState, setAccountListState] = useState<'available' | 'error'>('available');
  const [customTemplate, setCustomTemplate] = useState(false);
  const [columnsConfigured, setColumnsConfigured] = useState(false);
  const [statementType, setStatementType] = useState<FinanceStatementType>('receivable');
  const [editOpen, setEditOpen] = useState(false);
  const [executeOpen, setExecuteOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [lastAction, setLastAction] = useState('尚未执行财务动作');

  const paymentCapabilities = useMemo<PaymentRequestActionCapabilities<DemoPayment>>(
    () => ({
      listFundsAccounts: async () => {
        if (accountListState === 'error') throw new Error('演示资金账户请求失败');
        return [
          { id: 'funds-account-cny', name: '招商银行基本户', code: 'BANK-CNY-01' },
          { id: 'funds-account-usd', name: '美元结算户', code: 'BANK-USD-01' },
        ];
      },
      updateRequest: async (payload) => {
        setLastAction(`已更新付款申请 ${payload.id}，金额 ${payload.amount.toFixed(2)}`);
      },
      executeRequest: async (payload) => {
        const payment = { id: 'payment-demo-001', paymentNo: 'PAY-2026-0908' };
        setLastAction(`已执行付款 ${payload.id}，生成 ${payment.paymentNo}`);
        return payment;
      },
      renderPaymentMethodField: ({ name, label, fieldProps }) => (
        <ProFormSelect
          name={name}
          label={label}
          fieldProps={fieldProps}
          options={[
            { label: '银行转账', value: 'bank_transfer' },
            { label: '现金', value: 'cash' },
          ]}
        />
      ),
      notifyError: (text) => message.error(text),
      notifySuccess: (text) => message.success(text),
    }),
    [accountListState, message],
  );

  const exportTemplateCapabilities = useMemo<ExportTemplateModalCapabilities>(
    () => ({
      canManageTemplate,
      groupLabels: {
        base: '基础信息',
        summary: '汇总数据',
        docLine: '台账带区（单据）',
        line: '台账带区（全流水）',
        paymentLine: '收付款带区',
        itemLine: '商品明细带区',
      },
      groupColors: {
        base: 'blue',
        summary: 'purple',
        docLine: 'geekblue',
        line: 'cyan',
        paymentLine: 'green',
        itemLine: 'orange',
      },
      requestTemplateInfo: async (type) => ({
        type,
        isCustom: customTemplate,
        fileName: customTemplate ? `${type}-statement-custom.xlsx` : undefined,
        updatedAt: customTemplate ? '2026-11-20T02:30:00.000Z' : undefined,
        columnConfig: columnsConfigured
          ? { docLine: ['invoiceNo', 'invoiceDate'], itemLine: ['itemName', 'quantity'] }
          : undefined,
        columnCatalog: { docLine: docLineColumns, itemLine: itemLineColumns },
        placeholders: [
          { token: '{{partnerName}}', label: '往来单位名称', group: 'base' },
          { token: '{{openingBalance}}', label: '期初余额', group: 'summary' },
          { token: '{{invoiceNo}}', label: '单据号', group: 'docLine' },
          { token: '{{paymentNo}}', label: '收付款单号', group: 'paymentLine' },
          { token: '{{itemName}}', label: '商品名称', group: 'itemLine' },
        ],
      }),
      saveColumnConfig: async ({ docLine, itemLine }) => {
        setColumnsConfigured(Boolean(docLine?.length || itemLine?.length));
        setLastAction('已保存对账单导出列配置');
      },
      downloadTemplate: async ({ fileName }) => {
        setLastAction(`已请求下载模板 ${fileName}`);
      },
      uploadTemplate: async (_type, file) => {
        setCustomTemplate(true);
        setLastAction(`已上传模板 ${file.name}`);
        return { fileName: file.name, unknownTokens: ['{{unrecognizedField}}'] };
      },
      resetTemplate: async () => {
        setCustomTemplate(false);
        setLastAction('已恢复内置对账单模板');
      },
      notifySuccess: (text) => message.success(text),
      notifyWarning: (text, duration) => message.warning(text, duration),
    }),
    [canManageTemplate, columnsConfigured, customTemplate, message],
  );

  const statementCapabilities = useMemo<SendStatementCapabilities<StatementSendPayload>>(
    () => ({
      fetchOptions: async (payload) => ({
        emailSubject: `${payload.type === 'payable' ? '应付' : '应收'}对账单 · ${payload.currency ?? 'CNY'}`,
        messageContent: `往来单位：华星精密制造\n期间：${payload.dateFrom ?? '全部'} 至 ${payload.dateTo ?? '全部'}\n期末余额：12500.00 ${payload.currency ?? 'CNY'}`,
        options: [
          {
            channel: 'email',
            label: '发送至往来单位邮箱',
            target: 'finance@example.test',
            canDirectSend: true,
          },
          {
            channel: 'copy',
            label: '复制并系统分享',
            canDirectSend: false,
          },
        ],
      }),
      send: async (payload, channel) => {
        setLastAction(`已发送${payload.type === 'payable' ? '应付' : '应收'}对账单（${channel}）`);
      },
      notifications: {
        error: (text) => message.error(text),
        success: (text) => message.success(text),
        warning: (text) => message.warning(text),
        info: (text) => message.info(text),
      },
    }),
    [message],
  );

  const statementQuery: StatementSendPayload = {
    partnerId: 'customer-001',
    currency: 'CNY',
    type: statementType,
    dateFrom: '2026-10-01',
    dateTo: '2026-10-31',
  };

  return (
    <SectionCard title="付款申请与对账单动作">
      <Typography.Paragraph type="secondary">
        演示付款申请编辑/执行、对账单列配置/自定义模板，以及邮件、复制和系统分享状态；请求、权限、消息、下载均由本页模拟注入。
      </Typography.Paragraph>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap>
          <Typography.Text>付款账户列表</Typography.Text>
          <Segmented
            aria-label="付款账户加载状态"
            value={accountListState}
            options={[
              { label: '可用', value: 'available' },
              { label: '加载失败', value: 'error' },
            ]}
            onChange={(value) => {
              if (value === 'available' || value === 'error') {
                setAccountListState(value);
              }
            }}
          />
          <Button onClick={() => setEditOpen(true)}>编辑付款申请</Button>
          <Button type="primary" onClick={() => setExecuteOpen(true)}>执行付款</Button>
        </Space>

        <Space wrap>
          <Typography.Text>对账单类型</Typography.Text>
          <Segmented
            aria-label="对账单类型"
            value={statementType}
            options={[
              { label: '应收对账单', value: 'receivable' },
              { label: '应付对账单', value: 'payable' },
            ]}
            onChange={(value) => {
              if (value === 'receivable' || value === 'payable') {
                setStatementType(value);
              }
            }}
          />
          <Typography.Text>模板维护权限</Typography.Text>
          <Segmented
            aria-label="对账单模板维护权限"
            value={canManageTemplate ? 'allowed' : 'readonly'}
            options={[
              { label: '可维护', value: 'allowed' },
              { label: '只读', value: 'readonly' },
            ]}
            onChange={(value) => setCanManageTemplate(value === 'allowed')}
          />
          <Button onClick={() => setTemplateOpen(true)}>导出模板设置</Button>
          <Button onClick={() => setSendOpen(true)}>发送对账单</Button>
        </Space>

        <Typography.Text type="secondary">{lastAction}</Typography.Text>
      </Space>

      <PaymentRequestActionModals<DemoPayment>
        key={accountListState}
        request={paymentRequest}
        editOpen={editOpen}
        executeOpen={executeOpen}
        onEditOpenChange={setEditOpen}
        onExecuteOpenChange={setExecuteOpen}
        onEditSuccess={async () => setLastAction('付款申请已刷新')}
        onExecuteSuccess={async (payment) => setLastAction(`已回读付款单 ${payment.paymentNo}`)}
        capabilities={paymentCapabilities}
      />
      <ExportTemplateModal
        open={templateOpen}
        type={statementType}
        onOpenChange={setTemplateOpen}
        capabilities={exportTemplateCapabilities}
      />
      <SendStatementModal<StatementSendPayload>
        open={sendOpen}
        query={statementQuery}
        onOpenChange={setSendOpen}
        onSuccess={() => setLastAction('对账单发送完成')}
        capabilities={statementCapabilities}
      />
    </SectionCard>
  );
}
