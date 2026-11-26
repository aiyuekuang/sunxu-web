/** @sunxu-layer business @sunxu-domain accounting @sunxu-reason Preserves host bank statement create, line maintenance, and match flows while injecting requests, permission results, formatting, notifications, and detail refresh. */
import {
  type ProFormSelectProps,
  ModalForm,
  ProFormDatePicker,
  ProFormDigit,
  ProFormGroup,
  ProFormList,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { Button, Descriptions } from 'antd';
import type {
  AccountingReconciliationCapabilities,
  AccountingReconciliationCreateValues,
  AccountingReconciliationDirection,
  AccountingReconciliationLineForm,
  CreateReconciliationModalProps,
  EditLinesModalProps,
  MatchLineModalProps,
} from './accounting-reconciliation-types';

const DIRECTION_OPTIONS = [
  { label: '收款', value: 'receipt' },
  { label: '付款', value: 'payment' },
] satisfies Array<{ label: string; value: AccountingReconciliationDirection }>;

/** Adds source line order before submitting the manually entered statement rows. */
function withLineNo(lines?: AccountingReconciliationLineForm[]) {
  return (lines ?? [])
    .filter(
      (line) => line?.transactionDate && line.direction && line.amount != null,
    )
    .map((line, index) => ({ ...line, lineNo: index + 1 }));
}

function ReconciliationLinesField() {
  return (
    <ProFormList
      name="lines"
      label="对账明细（按银行对账单逐行录入）"
      creatorButtonProps={{ creatorButtonText: '添加对账行' }}
      copyIconProps={false}
      alwaysShowItemLabel
      containerStyle={{ minWidth: 0, width: '100%' }}
      itemRender={({ listDom, action }) => (
        <div
          style={{
            alignItems: 'flex-start',
            display: 'flex',
            gap: 8,
            minWidth: 0,
            width: '100%',
          }}
        >
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>{listDom}</div>
          {action ? (
            <div style={{ flex: '0 0 auto', paddingTop: 30 }}>{action}</div>
          ) : null}
        </div>
      )}
    >
      <ProFormGroup
        spaceProps={{
          style: { width: '100%' },
          wrap: true,
        }}
      >
        <ProFormDatePicker
          name="transactionDate"
          label="日期"
          width="sm"
          rules={[{ required: true, message: '请选择交易日期' }]}
        />
        <ProFormSelect
          name="direction"
          label="方向"
          width="xs"
          options={DIRECTION_OPTIONS}
          rules={[{ required: true, message: '请选择收付方向' }]}
        />
        <ProFormDigit
          name="amount"
          label="金额"
          width="sm"
          min={0.000001}
          fieldProps={{ precision: 2 }}
          rules={[{ required: true, message: '请填写金额' }]}
        />
        <ProFormText name="summary" label="摘要" width="sm" />
        <ProFormText name="counterpartyName" label="对方户名" width="sm" />
        <ProFormText name="counterpartyAccountNo" label="对方账号" width="sm" />
        <ProFormText
          name="externalTransactionNo"
          label="银行流水号"
          width="sm"
        />
      </ProFormGroup>
    </ProFormList>
  );
}

function createAvailableFundsTransactionRequest<TDetail>(
  lineId: string,
  capabilities: AccountingReconciliationCapabilities<TDetail>,
): NonNullable<ProFormSelectProps['request']> {
  return async ({ keyWords }) => {
    const transactions = await capabilities.requestAvailableFundsTransactions({
      lineId,
      keyword: keyWords,
      pageSize: 50,
    });
    return transactions.map((transaction) => ({
      label: `${transaction.transactionNo}｜${transaction.bizDate}｜${capabilities.formatMoney(transaction.amount)}｜${
        transaction.counterpartyName || transaction.sourceNo || '-'
      }`,
      value: transaction.id,
    }));
  };
}

/** Hand-entered statement lines use the same field set for create and edit. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable edit lines modal behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function EditLinesModal<TDetail>({
  reconciliationId,
  lines,
  onDone,
  capabilities,
}: EditLinesModalProps<TDetail>) {
  if (!capabilities.canEditLines) return null;

  return (
    <ModalForm<{ lines: AccountingReconciliationLineForm[] }>
      title="编辑对账明细"
      width={960}
      trigger={<Button>编辑明细</Button>}
      modalProps={{ destroyOnHidden: true }}
      initialValues={{
        lines: lines.map((line) => ({
          transactionDate: line.transactionDate,
          direction: line.direction,
          amount: line.amount,
          summary: line.summary ?? undefined,
          counterpartyName: line.counterpartyName ?? undefined,
          counterpartyAccountNo: line.counterpartyAccountNo ?? undefined,
          externalTransactionNo: line.externalTransactionNo ?? undefined,
        })),
      }}
      onFinish={async (values) => {
        const detail = await capabilities.updateLines({
          id: reconciliationId,
          lines: withLineNo(values.lines),
        });
        onDone(detail);
        capabilities.notifySuccess('对账明细已保存');
        return true;
      }}
    >
      <ReconciliationLinesField />
    </ModalForm>
  );
}

/** Displays the current line context and asks the host for eligible matches. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable match line modal behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function MatchLineModal<TDetail>({
  line,
  onDone,
  capabilities,
}: MatchLineModalProps<TDetail>) {
  return (
    <ModalForm<{ fundsTransactionId: string }>
      title="匹配资金流水"
      width={560}
      trigger={<a>匹配</a>}
      modalProps={{ destroyOnHidden: true }}
      onFinish={async (values) => {
        const detail = await capabilities.matchLine({
          lineId: line.id,
          fundsTransactionId: values.fundsTransactionId,
        });
        onDone(detail);
        capabilities.notifySuccess('已匹配');
        return true;
      }}
    >
      <Descriptions size="small" column={2} style={{ marginBottom: 12 }}>
        <Descriptions.Item label="对账行方向">
          {line.direction === 'receipt' ? '收款' : '付款'}
        </Descriptions.Item>
        <Descriptions.Item label="对账行金额">
          {capabilities.formatMoney(line.amount)}
        </Descriptions.Item>
      </Descriptions>
      <ProFormSelect
        name="fundsTransactionId"
        label="系统资金流水"
        tooltip="仅显示同账户、同对账期间、同方向、同金额且未匹配的资金流水"
        rules={[{ required: true, message: '请选择要匹配的资金流水' }]}
        showSearch
        debounceTime={300}
        fieldProps={{ filterOption: false }}
        placeholder="输入流水号 / 对方名称搜索"
        request={createAvailableFundsTransactionRequest(
          line.id,
          capabilities,
        )}
      />
    </ModalForm>
  );
}

/** Creates a statement and returns its authoritative detail to the host. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable create reconciliation modal behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function CreateReconciliationModal<TDetail>({
  onDone,
  capabilities,
}: CreateReconciliationModalProps<TDetail>) {
  if (!capabilities.canCreate) return null;

  return (
    <ModalForm<AccountingReconciliationCreateValues>
      title="新增银行对账单"
      width={960}
      trigger={
        <Button type="primary">
          新增
        </Button>
      }
      modalProps={{ destroyOnHidden: true }}
      onFinish={async (values) => {
        const lines = withLineNo(values.lines);
        const detail = await capabilities.create({
          ...values,
          lines,
        });
        capabilities.notifySuccess(
          lines.length
            ? '已创建，可继续逐行匹配资金流水'
            : '已创建，请补录对账行后再匹配',
        );
        onDone(detail);
        return true;
      }}
    >
      <ProFormText
        name="code"
        label="对账单编码"
        rules={[{ required: true }]}
      />
      <ProFormText
        name="name"
        label="对账单名称"
        rules={[{ required: true }]}
      />
      <ProFormSelect
        name="fundsAccountId"
        label="银行资金账户"
        request={capabilities.requestBankFundsAccountOptions}
        showSearch
        debounceTime={300}
        fieldProps={{ filterOption: false }}
        rules={[{ required: true, message: '请选择银行资金账户' }]}
      />
      <ProFormText
        name="statementNo"
        label="银行对账单号"
        rules={[{ required: true }]}
      />
      <ProFormDatePicker
        name="statementStartDate"
        label="对账期间起"
        rules={[{ required: true }]}
      />
      <ProFormDatePicker
        name="statementEndDate"
        label="对账期间止"
        rules={[{ required: true }]}
      />
      <ProFormDatePicker
        name="statementDate"
        label="对账日期"
        rules={[{ required: true }]}
      />
      <ProFormDigit
        name="openingBalance"
        label="期初余额"
        fieldProps={{ precision: 2 }}
        rules={[{ required: true }]}
      />
      <ProFormDigit
        name="endingBalance"
        label="期末余额"
        fieldProps={{ precision: 2 }}
        rules={[{ required: true }]}
      />
      <ReconciliationLinesField />
    </ModalForm>
  );
}
