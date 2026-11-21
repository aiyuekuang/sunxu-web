import { useMemo, useState } from 'react';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import {
  App,
  Button,
  Col,
  Row,
  Segmented,
  Space,
  Typography,
} from 'antd';
import { SectionCard } from '../../src';
import { MesUiProvider } from '../../src/mes/MesUiProvider';
import {
  AccountModal,
} from '../../src/mes/components/AccountModal';
import {
  BookModal,
} from '../../src/mes/components/BookModal';
import {
  ClosingWipPanel,
  OpeningWipPanel,
} from '../../src/mes/components/ProductCostWipPanels';
import {
  CreateReconciliationModal,
  EditLinesModal,
  MatchLineModal,
} from '../../src/mes/components/AccountingReconciliationModals';
import type {
  AccountingReconciliationCapabilities,
  AccountingReconciliationLineRecord,
} from '../../src/mes/components/accounting-reconciliation-types';
import type {
  AccountingBookModalCapabilities,
  AccountingBookRecord,
} from '../../src/mes/components/accounting-book-modal-types';
import type {
  AccountingAccountModalCapabilities,
  AccountingAccountRecord,
} from '../../src/mes/components/accounting-account-modal-types';
import type {
  ProductCostClosingWipRecord,
  ProductCostOpeningWipRecord,
  ProductCostWipCapabilities,
} from '../../src/mes/components/product-cost-wip-types';
import {
  ACCOUNTING_ACCOUNT_NORMAL_BALANCE_OPTIONS,
  ACCOUNTING_ACCOUNT_STATUS_OPTIONS,
  ACCOUNTING_ACCOUNT_TYPE_OPTIONS,
  ACCOUNTING_BOOK_STATUS_OPTIONS,
  ACCOUNTING_BOOK_TYPE_OPTIONS,
  ACCOUNTING_DIMENSION_REQUIREMENT_OPTIONS,
  ACCOUNTING_DIMENSION_TYPE_OPTIONS,
} from '../../src/mes/components/accounting-master-data-options';

interface DemoReconciliationDetail {
  id: string;
  code: string;
  lines: AccountingReconciliationLineRecord[];
}

const demoReconciliationLine: AccountingReconciliationLineRecord = {
  id: 'bank-line-001',
  transactionDate: '2026-11-18',
  direction: 'receipt',
  amount: 12500,
  summary: '客户回款',
  counterpartyName: '华星精密制造',
  counterpartyAccountNo: '622202********1234',
  externalTransactionNo: 'BANK-20261118-01',
};

const demoBook: AccountingBookRecord = {
  id: 'book-001',
  code: 'MAIN-CN',
  name: '中国区主账簿',
  accountingOrganizationCode: 'CN-HQ',
  bookType: 'primary',
  isPrimary: true,
  baseCurrencyCode: 'CNY',
  status: 'active',
  remark: '本位币账簿',
};

const demoAccount: AccountingAccountRecord = {
  id: 'account-001',
  code: '1122',
  name: '应收账款',
  accountingBookCode: 'MAIN-CN',
  parentCode: '1120',
  accountType: 'asset',
  normalBalance: 'debit',
  level: 2,
  isLeaf: true,
  allowPosting: true,
  currencyCode: 'CNY',
  dimensionRequirements: [{ dimensionType: 'customer', requirement: 'required' }],
  status: 'active',
  remark: '客户往来核算',
};

const openingWipSeed: ProductCostOpeningWipRecord[] = [
  {
    id: 'opening-wip-001',
    accountingBookCode: 'MAIN-CN',
    fiscalPeriod: '2026-10',
    workOrderId: 'work-order-001',
    workOrderNo: 'WO-2026-1088',
    materialName: '精密铝合金支架',
    materialCode: 'AL-BR-018',
    openingQuantity: 12,
    openingMaterialCost: 8400,
    openingLaborCost: 1500,
    openingOverheadCost: 900,
  },
];

const closingWipSeed: ProductCostClosingWipRecord[] = [
  {
    id: 'closing-wip-001',
    accountingBookCode: 'MAIN-CN',
    fiscalPeriod: '2026-10',
    workOrderId: 'work-order-001',
    workOrderNo: 'WO-2026-1088',
    materialName: '精密铝合金支架',
    materialCode: 'AL-BR-018',
    wipQuantity: 7,
    completionRatePercent: 65,
    materialCompletionRatePercent: 80,
    laborCompletionRatePercent: 55,
    overheadCompletionRatePercent: 55,
  },
];

export function AccountingWorkflowComponentsDemo() {
  const { message, modal } = App.useApp();
  const [canManage, setCanManage] = useState(true);
  const [openingRows, setOpeningRows] = useState(openingWipSeed);
  const [closingRows, setClosingRows] = useState(closingWipSeed);
  const [lastAction, setLastAction] = useState('尚未执行会计工作流操作');
  const query = { accountingBookCode: 'MAIN-CN', fiscalPeriod: '2026-10' };

  const reconciliationCapabilities = useMemo<
    AccountingReconciliationCapabilities<DemoReconciliationDetail>
  >(
    () => ({
      canCreate: canManage,
      canEditLines: canManage,
      create: async (payload) => {
        const detail = {
          id: 'reconciliation-demo-001',
          code: payload.code,
          lines: payload.lines.map((line, index) => ({
            ...line,
            id: `new-line-${index + 1}`,
          })),
        };
        setLastAction(`已创建对账单 ${detail.code}`);
        return detail;
      },
      updateLines: async ({ id, lines }) => {
        const detail = {
          id,
          code: 'BANK-2026-11',
          lines: lines.map((line, index) => ({ ...line, id: `line-${index + 1}` })),
        };
        setLastAction('已保存银行对账明细');
        return detail;
      },
      matchLine: async ({ lineId, fundsTransactionId }) => {
        setLastAction(`已将 ${lineId} 匹配到 ${fundsTransactionId}`);
        return {
          id: 'reconciliation-demo-001',
          code: 'BANK-2026-11',
          lines: [demoReconciliationLine],
        };
      },
      requestBankFundsAccountOptions: async () => [
        { label: '招商银行 · 6222 **** 1234', value: 'funds-account-001' },
      ],
      requestAvailableFundsTransactions: async () => [
        {
          id: 'funds-transaction-001',
          transactionNo: 'FT-2026-0118',
          bizDate: '2026-11-18',
          amount: 12500,
          counterpartyName: '华星精密制造',
        },
      ],
      formatMoney: (amount) => Number(amount).toFixed(2),
      notifySuccess: (text) => message.success(text),
    }),
    [canManage, message],
  );

  const bookCapabilities = useMemo<AccountingBookModalCapabilities>(
    () => ({
      canManage,
      bookTypeOptions: ACCOUNTING_BOOK_TYPE_OPTIONS,
      statusOptions: ACCOUNTING_BOOK_STATUS_OPTIONS,
      requestOrganizationOptions: async () => [
        { label: '中国区总部', value: 'CN-HQ' },
      ],
      requestCurrencyOptions: async () => [
        { label: '人民币 CNY', value: 'CNY' },
        { label: '美元 USD', value: 'USD' },
      ],
      renderOrganizationSelect: ({
        name,
        label,
        disabled,
        tooltip,
        rules,
        fieldProps,
        request,
      }) => (
        <ProFormSelect
          name={name}
          label={label}
          disabled={disabled}
          tooltip={tooltip}
          rules={rules}
          fieldProps={fieldProps}
          request={request}
        />
      ),
      renderBaseCurrencySelect: ({
        name,
        label,
        disabled,
        tooltip,
        rules,
        fieldProps,
        request,
      }) => (
        <ProFormSelect
          name={name}
          label={label}
          disabled={disabled}
          tooltip={tooltip}
          rules={rules}
          fieldProps={fieldProps}
          request={request}
        />
      ),
      create: async (values) => setLastAction(`已创建账簿 ${values.code}`),
      update: async (id, values) => setLastAction(`已更新账簿 ${id} ${values.name}`),
      notifySuccess: (text) => message.success(text),
    }),
    [canManage, message],
  );

  const accountCapabilities = useMemo<AccountingAccountModalCapabilities>(
    () => ({
      canManage,
      accountTypeOptions: ACCOUNTING_ACCOUNT_TYPE_OPTIONS,
      normalBalanceOptions: ACCOUNTING_ACCOUNT_NORMAL_BALANCE_OPTIONS,
      statusOptions: ACCOUNTING_ACCOUNT_STATUS_OPTIONS,
      dimensionTypeOptions: ACCOUNTING_DIMENSION_TYPE_OPTIONS,
      dimensionRequirementOptions: ACCOUNTING_DIMENSION_REQUIREMENT_OPTIONS,
      renderAccountingBookField: ({ name, label, disabled, required }) => (
        <ProFormSelect
          name={name}
          label={label}
          disabled={disabled}
          rules={required ? [{ required: true }] : undefined}
          options={[{ label: '中国区主账簿', value: 'MAIN-CN' }]}
        />
      ),
      requestParentAccountOptions: async () => [
        { label: '1120 应收款项', value: '1120' },
      ],
      renderParentAccountSelect: ({
        name,
        label,
        disabled,
        placeholder,
        tooltip,
        fieldProps,
        request,
        debounceTime,
      }) => (
        <ProFormSelect
          name={name}
          label={label}
          disabled={disabled}
          placeholder={placeholder}
          tooltip={tooltip}
          fieldProps={fieldProps}
          request={request}
          debounceTime={debounceTime}
        />
      ),
      requestCurrencyOptions: async () => [
        { label: '人民币 CNY', value: 'CNY' },
        { label: '美元 USD', value: 'USD' },
      ],
      renderCurrencySelect: ({
        name,
        label,
        request,
        fieldProps,
        placeholder,
      }) => (
        <ProFormSelect
          name={name}
          label={label}
          request={request}
          fieldProps={fieldProps}
          placeholder={placeholder}
        />
      ),
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
      create: async (values) => setLastAction(`已创建科目 ${values.code}`),
      update: async (id, values) => setLastAction(`已更新科目 ${id} ${values.name}`),
      notifyError: (text) => message.error(text),
      notifySuccess: (text) => message.success(text),
    }),
    [canManage, message],
  );

  const wipCapabilities = useMemo<ProductCostWipCapabilities>(
    () => ({
      listOpening: async () => openingRows,
      removeOpening: async (id) => {
        setOpeningRows((current) => current.filter((row) => row.id !== id));
      },
      renderOpeningModal: ({ query: period, editingRecord, open, onOpenChange, onSuccess }) => (
        <ModalForm<{
          accountingBookCode: string;
          fiscalPeriod: string;
          workOrderId: string;
          openingQuantity: number;
          openingMaterialCost: number;
          openingLaborCost: number;
          openingOverheadCost: number;
        }>
          key={`opening-${editingRecord?.id ?? 'new'}`}
          title={editingRecord ? '编辑期初在产品' : '新增期初在产品'}
          width={720}
          open={open}
          onOpenChange={onOpenChange}
          initialValues={{ ...period, ...(editingRecord ?? {}) }}
          modalProps={{ destroyOnHidden: true }}
          onFinish={async () => {
            message.success('期初在产品已保存');
            await onSuccess();
            return true;
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <ProFormText name="accountingBookCode" label="账簿" disabled />
            </Col>
            <Col span={12}>
              <ProFormText name="fiscalPeriod" label="会计期间" disabled />
            </Col>
            <Col span={24}>
              <ProFormSelect
                name="workOrderId"
                label="工单成本对象"
                disabled={Boolean(editingRecord)}
                options={[{ label: 'WO-2026-1088 · 精密铝合金支架', value: 'work-order-001' }]}
                fieldProps={{ showSearch: true, optionFilterProp: 'label' }}
                rules={[{ required: true }]}
              />
            </Col>
            <Col span={12}>
              <ProFormDigit name="openingQuantity" label="期初在产品数量" min={0} fieldProps={{ precision: 6 }} rules={[{ required: true }]} />
            </Col>
            <Col span={12}>
              <ProFormDigit name="openingMaterialCost" label="期初直接材料成本" min={0} fieldProps={{ precision: 6 }} rules={[{ required: true }]} />
            </Col>
            <Col span={12}>
              <ProFormDigit name="openingLaborCost" label="期初直接人工成本" min={0} fieldProps={{ precision: 6 }} rules={[{ required: true }]} />
            </Col>
            <Col span={12}>
              <ProFormDigit name="openingOverheadCost" label="期初制造费用" min={0} fieldProps={{ precision: 6 }} rules={[{ required: true }]} />
            </Col>
          </Row>
        </ModalForm>
      ),
      renderCreateButton: ({ onClick }) => (
        <Button key="create-opening" type="primary" onClick={onClick}>
          新增
        </Button>
      ),
      renderOpeningRemoveButton: ({
        confirmation,
        successMessage,
        onConfirm,
        onSuccess,
      }) => (
        <Button
          key="remove-opening"
          type="link"
          size="small"
          danger
          onClick={() =>
            modal.confirm({
              ...confirmation,
              onOk: async () => {
                await onConfirm();
                message.success(successMessage);
                await onSuccess();
              },
            })
          }
        >
          删除
        </Button>
      ),
      listClosing: async () => closingRows,
      removeClosing: async (id) => {
        setClosingRows((current) => current.filter((row) => row.id !== id));
      },
      renderClosingModal: ({ query: period, editingRecord, open, onOpenChange, onSuccess }) => (
        <ModalForm<{
          accountingBookCode: string;
          fiscalPeriod: string;
          workOrderId: string;
          wipQuantity: number;
          completionRatePercent: number;
          materialCompletionRatePercent?: number;
          laborCompletionRatePercent?: number;
          overheadCompletionRatePercent?: number;
        }>
          key={`closing-${editingRecord?.id ?? 'new'}`}
          title={editingRecord ? '编辑月末在产品' : '新增月末在产品'}
          width={720}
          open={open}
          onOpenChange={onOpenChange}
          initialValues={{ ...period, ...(editingRecord ?? {}) }}
          modalProps={{ destroyOnHidden: true }}
          onFinish={async () => {
            message.success('月末在产品已保存');
            await onSuccess();
            return true;
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <ProFormText name="accountingBookCode" label="账簿" disabled />
            </Col>
            <Col span={12}>
              <ProFormText name="fiscalPeriod" label="会计期间" disabled />
            </Col>
            <Col span={24}>
              <ProFormSelect
                name="workOrderId"
                label="工单成本对象"
                disabled={Boolean(editingRecord)}
                options={[{ label: 'WO-2026-1088 · 精密铝合金支架', value: 'work-order-001' }]}
                fieldProps={{ showSearch: true, optionFilterProp: 'label' }}
                rules={[{ required: true }]}
              />
            </Col>
            <Col span={12}>
              <ProFormDigit name="wipQuantity" label="月末在产品数量" min={0} fieldProps={{ precision: 6 }} rules={[{ required: true }]} />
            </Col>
            <Col span={12}>
              <ProFormDigit name="completionRatePercent" label="完工程度" min={0} max={100} fieldProps={{ precision: 4 }} rules={[{ required: true }]} tooltip="未单独填写各成本项目时，三类成本均按此比例计算。" />
            </Col>
            <Col span={8}>
              <ProFormDigit name="materialCompletionRatePercent" label="材料完工程度" min={0} max={100} fieldProps={{ precision: 4 }} />
            </Col>
            <Col span={8}>
              <ProFormDigit name="laborCompletionRatePercent" label="人工完工程度" min={0} max={100} fieldProps={{ precision: 4 }} />
            </Col>
            <Col span={8}>
              <ProFormDigit name="overheadCompletionRatePercent" label="制造费用完工程度" min={0} max={100} fieldProps={{ precision: 4 }} />
            </Col>
          </Row>
        </ModalForm>
      ),
      renderClosingRemoveButton: ({
        confirmation,
        successMessage,
        onConfirm,
        onSuccess,
      }) => (
        <Button
          key="remove-closing"
          type="link"
          size="small"
          danger
          onClick={() =>
            modal.confirm({
              ...confirmation,
              onOk: async () => {
                await onConfirm();
                message.success(successMessage);
                await onSuccess();
              },
            })
          }
        >
          删除
        </Button>
      ),
      formatMoney: (value) => Number(value ?? 0).toFixed(2),
      pagination: { defaultPageSize: 20, showSizeChanger: false },
    }),
    [closingRows, message, modal, openingRows],
  );

  return (
    <SectionCard title="会计工作流组件">
      <Typography.Paragraph type="secondary">
        演示对账、账簿、科目和在产品成本组件的新增、编辑、只读权限、表格及确认操作；接口和权限状态由本页模拟注入。
      </Typography.Paragraph>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap>
          <Typography.Text>维护权限</Typography.Text>
          <Segmented
            aria-label="会计工作流维护权限"
            value={canManage ? 'manage' : 'read-only'}
            options={[
              { label: '可维护', value: 'manage' },
              { label: '只读', value: 'read-only' },
            ]}
            onChange={(value) => setCanManage(value === 'manage')}
          />
          <Typography.Text type="secondary">{lastAction}</Typography.Text>
        </Space>

        <Space wrap>
          <CreateReconciliationModal<DemoReconciliationDetail>
            onDone={(detail) => setLastAction(`已回读对账单 ${detail.code}`)}
            capabilities={reconciliationCapabilities}
          />
          <EditLinesModal<DemoReconciliationDetail>
            reconciliationId="reconciliation-demo-001"
            lines={[demoReconciliationLine]}
            onDone={() => setLastAction('已刷新对账单明细')}
            capabilities={reconciliationCapabilities}
          />
          <MatchLineModal<DemoReconciliationDetail>
            line={demoReconciliationLine}
            onDone={() => setLastAction('已刷新匹配状态')}
            capabilities={reconciliationCapabilities}
          />
          <BookModal
            onDone={() => setLastAction('已刷新账簿列表')}
            capabilities={bookCapabilities}
          />
          <BookModal
            record={demoBook}
            onDone={() => setLastAction('已刷新账簿列表')}
            capabilities={bookCapabilities}
          />
          <AccountModal
            onDone={() => setLastAction('已刷新科目列表')}
            capabilities={accountCapabilities}
          />
          <AccountModal
            record={demoAccount}
            onDone={() => setLastAction('已刷新科目列表')}
            capabilities={accountCapabilities}
          />
        </Space>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Typography.Title level={5}>期初在产品</Typography.Title>
            <OpeningWipPanel
              query={query}
              canManage={canManage}
              canMaintainInput={canManage}
              onRefresh={async () => undefined}
              capabilities={wipCapabilities}
            />
          </Col>
          <Col xs={24} xl={12}>
            <Typography.Title level={5}>月末在产品</Typography.Title>
            <ClosingWipPanel
              query={query}
              canManage={canManage}
              canMaintainInput={canManage}
              onRefresh={async () => undefined}
              capabilities={wipCapabilities}
            />
          </Col>
        </Row>
      </Space>
    </SectionCard>
  );
}
