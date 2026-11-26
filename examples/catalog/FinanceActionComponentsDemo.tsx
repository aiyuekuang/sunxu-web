import { useMemo, useState } from 'react';
import { ProFormSelect } from '@ant-design/pro-components';
import { App, Button, Segmented, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import { SectionCard } from '../../src';
import { FundsTransactionImportModal, CreateFundsTransactionModal } from '../../src/business/components/FundsTransactionModals';
import { FinanceInvoiceCurrencyRepairModal } from '../../src/business/components/FinanceInvoiceCurrencyRepairModal';
import { FinanceInvoiceCancelModal } from '../../src/business/components/FinanceInvoiceCancelModal';
import { CreditNoteRefundModal } from '../../src/business/components/CreditNoteRefundModal';
import type {
  FundsTransactionCreateModalCapabilities,
  FundsTransactionImportModalCapabilities,
} from '../../src/business/components/funds-transaction-modals-types';
import type {
  FinanceInvoiceActionRecord,
  FinanceInvoiceCurrencyRepairResult,
} from '../../src/business/components/finance-invoice-action-types';
import type { FinanceInvoiceCurrencyRepairCapabilities } from '../../src/business/components/finance-invoice-currency-repair-modal-types';
import type { FinanceInvoiceCancelCapabilities } from '../../src/business/components/finance-invoice-cancel-modal-types';
import type {
  CreditNoteRefundCapabilities,
} from '../../src/business/components/credit-note-refund-modal-types';

interface DemoFinancePayment {
  id: string;
  paymentNo: string;
}

const customerInvoice: FinanceInvoiceActionRecord = {
  id: 'invoice-ar-001',
  invoiceNo: 'AR-2026-1098',
  type: 'receivable',
  partnerName: '华星精密制造',
  currency: 'CNY',
  residualAmount: 12500,
  invoiceDate: '2026-11-18',
};

const supplierInvoice: FinanceInvoiceActionRecord = {
  id: 'invoice-ap-001',
  invoiceNo: 'AP-2026-0712',
  type: 'payable',
  partnerName: '远航工业材料',
  currency: 'USD',
  residualAmount: 4800,
  invoiceDate: '2026-12-01',
};

const missingCurrencyInvoice: FinanceInvoiceActionRecord = {
  ...customerInvoice,
  id: 'invoice-legacy-001',
  invoiceNo: 'AR-OLD-0042',
  currency: null,
};

export function FinanceActionComponentsDemo() {
  const { message, notification } = App.useApp();
  const [canCreateFundsTransactions, setCanCreateFundsTransactions] =
    useState(true);
  const [canReadSourceDocument, setCanReadSourceDocument] = useState(true);
  const [accountListState, setAccountListState] = useState<'available' | 'empty' | 'error'>('available');
  const [repairOpen, setRepairOpen] = useState(false);
  const [repairInvoice, setRepairInvoice] = useState(customerInvoice);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelInvoice, setCancelInvoice] = useState(customerInvoice);
  const [refundOpen, setRefundOpen] = useState(false);
  const [creditNote, setCreditNote] = useState(customerInvoice);
  const [lastAction, setLastAction] = useState('尚未执行财务资金动作');

  const importCapabilities = useMemo<FundsTransactionImportModalCapabilities>(
    () => ({
      canCreate: canCreateFundsTransactions,
      importTransactions: async (file) => ({
        total: 1,
        imported: 1,
        rows: [{ rowNo: 1, externalTransactionNo: file.name, status: 'valid' }],
      }),
      downloadTemplate: async () => {
        setLastAction('已请求资金流水导入模板');
      },
      notifyError: (text) => message.error(text),
      notifySuccess: (text) => message.success(text),
    }),
    [canCreateFundsTransactions, message],
  );

  const transactionCapabilities = useMemo<FundsTransactionCreateModalCapabilities>(
    () => ({
      canCreate: canCreateFundsTransactions,
      directionOptions: [
        { label: '收', value: 'in' },
        { label: '支', value: 'out' },
      ],
      counterpartyTypeOptions: [
        { label: '客户', value: 'customer' },
        { label: '供应商', value: 'supplier' },
        { label: '员工', value: 'employee' },
        { label: '其他', value: 'other' },
      ],
      requestFundsAccounts: async () => [
        { id: 'funds-cny-01', name: '招商银行基本户', code: 'BANK-CNY-01', currency: 'CNY' },
      ],
      requestFundsCategories: async ({ direction }) => [
        {
          id: `category-${direction}-01`,
          name: direction === 'in' ? '客户回款' : '办公支出',
          code: direction === 'in' ? 'IN-CUSTOMER' : 'OUT-OFFICE',
          costNature: 'period_expense',
        },
        {
          id: 'category-inventory-cost',
          name: '采购附加费用',
          code: 'INVENTORY-COST',
          costNature: 'inventory_cost',
        },
      ],
      requestCounterpartyOptions: async ({ type }) => [
        {
          label:
            type === 'customer'
              ? '华星精密制造（CUS-001）'
              : type === 'supplier'
                ? '远航工业材料（SUP-018）'
                : '林晓明（EMP-028）',
          value: `${type}-001`,
        },
      ],
      renderFundsAccountSelect: ({ name, label, request, rules }) => (
        <ProFormSelect name={name} label={label} request={request} rules={rules} />
      ),
      renderFundsCategorySelect: ({
        name,
        label,
        request,
        params,
        tooltip,
        rules,
      }) => (
        <ProFormSelect
          name={name}
          label={label}
          request={request}
          params={params}
          tooltip={tooltip}
          rules={rules}
        />
      ),
      renderCounterpartySelect: ({
        key,
        name,
        label,
        request,
        showSearch,
        fieldProps,
        rules,
      }) => (
        <ProFormSelect
          key={key}
          name={name}
          label={label}
          request={request}
          showSearch={showSearch}
          fieldProps={fieldProps}
          rules={rules}
        />
      ),
      createTransaction: async (payload) => {
        setLastAction(`已记账 ${payload.direction === 'in' ? '收款' : '付款'} ${payload.amount.toFixed(2)}`);
      },
      notifySuccess: (text) => message.success(text),
      notifyError: (text) => message.error(text),
      scrollableModalProps: {
        centered: true,
        styles: {
          body: {
            maxHeight: 'calc(100vh - 200px)',
            overflowX: 'hidden',
            overflowY: 'auto',
          },
        },
      },
    }),
    [canCreateFundsTransactions, message],
  );

  const currencyRepairCapabilities = useMemo<FinanceInvoiceCurrencyRepairCapabilities>(
    () => ({
      canReadSourceDocument,
      repairInvoiceCurrency: async ({ id, currency }): Promise<FinanceInvoiceCurrencyRepairResult> => {
        setLastAction(`已修复 ${id} 的来源币别 ${currency}`);
        return {
          accounting: {
            sourceDocumentId: `source-${id}`,
            sourceDocumentStatus: 'pending_period',
            errorMessage: '当前会计期间尚未开放',
          },
        };
      },
      getSourceDocumentStatusText: (status) =>
        status === 'pending_period' ? '待期间开启' : undefined,
      notifySuccess: (text) => message.success(text),
      notifyWarning: ({ message: title, description, action }) =>
        notification.warning({
          message: title,
          description,
          btn: action ? (
            <Button
              type="link"
              size="small"
              onClick={() => {
                action.onClick();
                setLastAction(action.label);
              }}
            >
              {action.label}
            </Button>
          ) : undefined,
        }),
      openSourceDocument: (id) => setLastAction(`已打开会计来源单 ${id}`),
    }),
    [canReadSourceDocument, message, notification],
  );

  const cancelCapabilities = useMemo<FinanceInvoiceCancelCapabilities>(
    () => ({
      cancelInvoice: async ({ id, reversalDate }) => {
        setLastAction(`已取消 ${id}，冲销日期 ${reversalDate ?? '未设置'}`);
      },
      normalizeDateOnlyValue: (value) =>
        value == null ? undefined : dayjs(value).format('YYYY-MM-DD'),
      notifySuccess: (text) => message.success(text),
    }),
    [message],
  );

  const refundCapabilities = useMemo<CreditNoteRefundCapabilities<DemoFinancePayment>>(
    () => ({
      listActiveFundsAccounts: async () => {
        if (accountListState === 'error') throw new Error('演示账户请求失败');
        if (accountListState === 'empty') return [];
        return [
          { id: 'funds-cny-01', name: '招商银行基本户', code: 'BANK-CNY-01', currency: 'CNY' },
          { id: 'funds-usd-01', name: '美元结算户', code: 'BANK-USD-01', currency: 'USD' },
        ];
      },
      settleCreditNoteRefund: async (payload) => {
        const payment = { id: 'payment-demo-001', paymentNo: 'PAY-2026-0881' };
        setLastAction(`已登记贷项退款 ${payload.amount.toFixed(2)}，生成 ${payment.paymentNo}`);
        return payment;
      },
      renderPaymentMethodField: ({ name, label }) => (
        <ProFormSelect
          name={name}
          label={label}
          options={[
            { label: '银行转账', value: 'bank_transfer' },
            { label: '现金', value: 'cash' },
          ]}
        />
      ),
      normalizeDateOnlyValue: (value) =>
        value == null ? undefined : dayjs(value).format('YYYY-MM-DD'),
      notifyError: (text) => message.error(text),
      notifySuccess: (text) => message.success(text),
    }),
    [accountListState, message],
  );

  return (
    <SectionCard title="资金与发票动作组件">
      <Typography.Paragraph type="secondary">
        演示资金流水导入/新增，以及应收应付币别修复、取消和贷项退款；选择器、接口、权限、消息与导航由本页模拟注入。
      </Typography.Paragraph>
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap>
          <Typography.Text>资金流水维护</Typography.Text>
          <Segmented
            aria-label="资金流水维护权限"
            value={canCreateFundsTransactions ? 'allowed' : 'readonly'}
            options={[
              { label: '可维护', value: 'allowed' },
              { label: '只读', value: 'readonly' },
            ]}
            onChange={(value) => setCanCreateFundsTransactions(value === 'allowed')}
          />
          <FundsTransactionImportModal
            onDone={() => setLastAction('资金流水导入完成，已刷新列表')}
            capabilities={importCapabilities}
          />
          <CreateFundsTransactionModal
            onDone={() => setLastAction('资金流水已记账，已刷新列表')}
            capabilities={transactionCapabilities}
          />
        </Space>

        <Space wrap>
          <Typography.Text>历史单币别</Typography.Text>
          <Button
            onClick={() => {
              setRepairInvoice(customerInvoice);
              setRepairOpen(true);
            }}
          >
            修复来源快照
          </Button>
          <Button
            onClick={() => {
              setRepairInvoice(missingCurrencyInvoice);
              setRepairOpen(true);
            }}
          >
            补录历史币别
          </Button>
          <Typography.Text>来源单查看权限</Typography.Text>
          <Segmented
            aria-label="会计来源单查看权限"
            value={canReadSourceDocument ? 'allowed' : 'denied'}
            options={[
              { label: '可查看', value: 'allowed' },
              { label: '无权限', value: 'denied' },
            ]}
            onChange={(value) => setCanReadSourceDocument(value === 'allowed')}
          />
        </Space>

        <Space wrap>
          <Typography.Text>应收/应付取消</Typography.Text>
          <Button
            onClick={() => {
              setCancelInvoice(customerInvoice);
              setCancelOpen(true);
            }}
          >
            取消应收单
          </Button>
          <Button
            onClick={() => {
              setCancelInvoice(supplierInvoice);
              setCancelOpen(true);
            }}
          >
            取消应付单
          </Button>
        </Space>

        <Space wrap>
          <Typography.Text>贷项退款账户状态</Typography.Text>
          <Segmented
            aria-label="退款资金账户加载状态"
            value={accountListState}
            options={[
              { label: '同币种账户可用', value: 'available' },
              { label: '无同币种账户', value: 'empty' },
              { label: '加载失败', value: 'error' },
            ]}
            onChange={(value) => {
              if (value === 'available' || value === 'empty' || value === 'error') {
                setAccountListState(value);
              }
            }}
          />
          <Button
            onClick={() => {
              setCreditNote(customerInvoice);
              setRefundOpen(true);
            }}
          >
            登记客户退款
          </Button>
          <Button
            onClick={() => {
              setCreditNote(supplierInvoice);
              setRefundOpen(true);
            }}
          >
            登记供应商退款收款
          </Button>
        </Space>

        <Typography.Text type="secondary">{lastAction}</Typography.Text>
      </Space>

      <FinanceInvoiceCurrencyRepairModal
        invoice={repairInvoice}
        open={repairOpen}
        onOpenChange={setRepairOpen}
        onCompleted={async () => setLastAction('已刷新币别修复结果')}
        capabilities={currencyRepairCapabilities}
      />
      <FinanceInvoiceCancelModal
        invoice={cancelInvoice}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onCompleted={async () => setLastAction('已刷新应收/应付单状态')}
        capabilities={cancelCapabilities}
      />
      <CreditNoteRefundModal<DemoFinancePayment>
        creditNote={creditNote}
        open={refundOpen}
        onOpenChange={setRefundOpen}
        onCompleted={async (payment) => setLastAction(`已回读 ${payment.paymentNo}`)}
        capabilities={refundCapabilities}
      />
    </SectionCard>
  );
}
