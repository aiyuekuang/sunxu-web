/** @sunxu-layer business @sunxu-domain credit-note-refund @sunxu-reason Keeps credit-note refunds as explicit cash actions with same-currency account selection, balance validation, dictionary-backed methods, and completion callbacks supplied by the host. */
import {
  ModalForm,
  ProFormDatePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import type {
  CreditNoteRefundFormValues,
  CreditNoteRefundModalProps,
} from './credit-note-refund-modal-types';

/** Records the cash settlement generated from an accounts-receivable/payable credit note. */
export function CreditNoteRefundModal<TPayment>({
  creditNote,
  open,
  onOpenChange,
  onCompleted,
  capabilities,
}: CreditNoteRefundModalProps<TPayment>) {
  const [fundsAccounts, setFundsAccounts] = useState<
    { label: string; value: string }[]
  >([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState(false);

  const isCustomerCredit = creditNote?.type === 'receivable';
  const actionLabel = isCustomerCredit ? '客户退款' : '供应商退款收款';
  const availableAmount = Math.abs(Number(creditNote?.residualAmount ?? 0));

  useEffect(() => {
    if (!open || !creditNote) return;

    let cancelled = false;
    setAccountsLoading(true);
    setAccountsError(false);
    void capabilities
      .listActiveFundsAccounts({ page: 1, pageSize: 100, isActive: true })
      .then((accounts) => {
        if (cancelled) return;
        setFundsAccounts(
          accounts
            .filter(
              (account) =>
                !creditNote.currency || account.currency === creditNote.currency,
            )
            .map((account) => ({
              label: `${account.name}（${account.code}｜${account.currency}）`,
              value: account.id,
            })),
        );
      })
      .catch(() => {
        if (!cancelled) setAccountsError(true);
      })
      .finally(() => {
        if (!cancelled) setAccountsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [capabilities, creditNote, open]);

  if (!creditNote) return null;

  return (
    <ModalForm<CreditNoteRefundFormValues>
      key={creditNote.id}
      title={`登记${actionLabel}`}
      open={open}
      width={560}
      onOpenChange={onOpenChange}
      modalProps={{ destroyOnHidden: true }}
      initialValues={{
        amount: availableAmount,
        paymentDate: dayjs(),
        description: `${actionLabel} ${creditNote.invoiceNo}`,
      }}
      onFinish={async (values) => {
        if (accountsLoading || accountsError) {
          capabilities.notifyError('资金账户尚未加载完成，暂不能登记退款');
          return false;
        }
        if (fundsAccounts.length === 0) {
          capabilities.notifyError('没有可用的同币种资金账户，请先维护资金账户');
          return false;
        }

        const amount = Number(values.amount);
        if (
          !Number.isFinite(amount) ||
          amount <= 0 ||
          amount > availableAmount
        ) {
          capabilities.notifyError('退款金额必须大于 0，且不能超过贷项可用余额');
          return false;
        }

        const payment = await capabilities.settleCreditNoteRefund({
          ...values,
          creditNoteId: creditNote.id,
          amount,
          paymentDate: capabilities.normalizeDateOnlyValue(values.paymentDate),
        });
        capabilities.notifySuccess(`${actionLabel}已登记，并已生成收付款单`);
        await onCompleted(payment);
        return true;
      }}
    >
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message={`本次会生成一张${isCustomerCredit ? '付款单' : '收款单'}，并自动核销贷项通知。`}
        description={`贷项单 ${creditNote.invoiceNo}｜${isCustomerCredit ? '客户' : '供应商'}：${creditNote.partnerName}｜可退款余额：${availableAmount.toFixed(2)} ${creditNote.currency || ''}`}
      />
      {accountsError ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="资金账户加载失败，请关闭后重试；如持续失败请检查账户查看权限。"
        />
      ) : null}
      {!accountsLoading && !accountsError && fundsAccounts.length === 0 ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="没有可用的同币种资金账户"
          description="退款是真实资金动作。请先到“经营出纳 → 资金账户”新增或启用对应币种账户。"
        />
      ) : null}
      <ProFormDigit
        name="amount"
        label="退款金额"
        fieldProps={{
          min: 0.01,
          max: availableAmount,
          precision: 2,
          controls: false,
        }}
        rules={[{ required: true, message: '请输入退款金额' }]}
      />
      <ProFormSelect
        name="fundsAccountId"
        label={isCustomerCredit ? '付款账户' : '收款账户'}
        options={fundsAccounts}
        showSearch
        fieldProps={{ loading: accountsLoading, disabled: accountsLoading }}
        rules={[{ required: true, message: '请选择资金账户' }]}
      />
      <ProFormDatePicker
        name="paymentDate"
        label={isCustomerCredit ? '实际退款日期' : '实际收款日期'}
        rules={[{ required: true, message: '请选择实际发生日期' }]}
      />
      {capabilities.renderPaymentMethodField({
        name: 'paymentMethod',
        label: '收付款方式',
        typeCode: 'payment_method',
      })}
      <ProFormText name="referenceNo" label="银行流水号/支票号" />
      <ProFormTextArea name="description" label="退款说明" />
    </ModalForm>
  );
}
