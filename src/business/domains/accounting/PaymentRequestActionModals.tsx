/** @sunxu-layer business @sunxu-domain accounting @sunxu-reason Preserves payment-request editing and execution forms, account-loading gates, allocation snapshots, and feedback while injecting account, dictionary, persistence, and message capabilities. */
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
import { useEffect, useRef, useState } from 'react';
import type {
  PaymentRequestActionModalsProps,
  PaymentRequestFundsAccountSelectOption,
  PaymentRequestUpdateFormValues,
  PaymentRequestExecuteFormValues,
} from './payment-request-action-modals-types';

/** Keeps edit and execution actions tied to the selected payment request. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable payment request action modals behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function PaymentRequestActionModals<TPayment>({
  request,
  editOpen,
  executeOpen,
  onEditOpenChange,
  onExecuteOpenChange,
  onEditSuccess,
  onExecuteSuccess,
  capabilities,
}: PaymentRequestActionModalsProps<TPayment>) {
  const [fundsAccounts, setFundsAccounts] = useState<
    PaymentRequestFundsAccountSelectOption[]
  >([]);
  const [fundsAccountsLoading, setFundsAccountsLoading] = useState(false);
  const [fundsAccountsError, setFundsAccountsError] = useState(false);
  const listFundsAccountsRef = useRef(capabilities.listFundsAccounts);
  listFundsAccountsRef.current = capabilities.listFundsAccounts;

  useEffect(() => {
    setFundsAccountsLoading(true);
    setFundsAccountsError(false);
    void listFundsAccountsRef
      .current({ pageSize: 100 })
      .then((accounts) => {
        setFundsAccounts(
          accounts.map((account) => ({
            label: `${account.name}（${account.code}）`,
            value: account.id,
          })),
        );
      })
      .catch(() => setFundsAccountsError(true))
      .finally(() => setFundsAccountsLoading(false));
  }, []);

  if (!request) return null;

  const accountUnavailable = fundsAccountsLoading || fundsAccountsError;
  const paymentMethodFieldProps = {
    name: 'paymentMethod' as const,
    label: '付款方式' as const,
    typeCode: 'payment_method' as const,
    fieldProps: { allowClear: true as const },
  };

  return (
    <>
      <ModalForm<PaymentRequestUpdateFormValues>
        key={`edit-${request.id}`}
        title="编辑"
        open={editOpen}
        onOpenChange={onEditOpenChange}
        initialValues={{
          id: request.id,
          partnerId: request.partnerId,
          amount: request.amount,
          plannedPaymentDate: request.plannedPaymentDate
            ? dayjs(request.plannedPaymentDate)
            : undefined,
          paymentMethod: request.paymentMethod,
          referenceNo: request.referenceNo,
          fundsAccountId: request.fundsAccountId,
          description: request.description,
        }}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
          await capabilities.updateRequest({
            ...values,
            id: request.id,
            partnerId: request.partnerId,
            businessCategory: request.businessCategory,
            currency: request.currency ?? undefined,
            exchangeRate: request.exchangeRate ?? undefined,
            cashBankAccountCode: request.cashBankAccountCode ?? undefined,
            allocations: request.allocations?.map((allocation) => ({
              invoiceId: allocation.invoiceId,
              amount: allocation.amount,
            })),
          });
          capabilities.notifySuccess('付款申请已更新');
          await onEditSuccess();
          return true;
        }}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="供应商和计划核销明细保持不变；如需调整核销对象，请取消本申请后重新创建。"
        />
        {fundsAccountsError ? (
          <Alert
            type="error"
            showIcon
            message="付款账户加载失败，请关闭后重试"
          />
        ) : null}
        <ProFormDigit
          name="amount"
          label="申请金额"
          fieldProps={{ precision: 2, min: 0.01 }}
          rules={[{ required: true, message: '请输入申请金额' }]}
        />
        <ProFormDatePicker name="plannedPaymentDate" label="计划付款日" />
        <ProFormSelect
          name="fundsAccountId"
          label="计划付款账户"
          options={fundsAccounts}
          fieldProps={{ loading: fundsAccountsLoading }}
        />
        {capabilities.renderPaymentMethodField(paymentMethodFieldProps)}
        <ProFormText name="referenceNo" label="参考号" />
        <ProFormTextArea name="description" label="付款事由" />
      </ModalForm>

      <ModalForm<PaymentRequestExecuteFormValues>
        key={`execute-${request.id}`}
        title={`执行付款 ${request.requestNo}`}
        open={executeOpen}
        onOpenChange={onExecuteOpenChange}
        initialValues={{
          id: request.id,
          fundsAccountId: request.fundsAccountId,
          paymentDate: request.plannedPaymentDate
            ? dayjs(request.plannedPaymentDate)
            : dayjs(),
          paymentMethod: request.paymentMethod,
          referenceNo: request.referenceNo,
        }}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
          if (accountUnavailable) {
            capabilities.notifyError('付款账户尚未加载完成，暂不能执行付款');
            return false;
          }
          const payment = await capabilities.executeRequest({
            ...values,
            id: request.id,
          });
          capabilities.notifySuccess('付款执行成功，已生成付款单');
          await onExecuteSuccess(payment);
          return true;
        }}
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="执行后将真实扣减所选资金账户并完成核销，请核对金额、账户和付款日期。"
        />
        {fundsAccountsError ? (
          <Alert
            type="error"
            showIcon
            message="付款账户加载失败，请关闭后重试"
          />
        ) : null}
        <ProFormSelect
          name="fundsAccountId"
          label="付款账户"
          options={fundsAccounts}
          fieldProps={{
            loading: fundsAccountsLoading,
            disabled: accountUnavailable,
          }}
          rules={
            !accountUnavailable
              ? [{ required: true, message: '请选择付款账户' }]
              : undefined
          }
        />
        <ProFormDatePicker
          name="paymentDate"
          label="实际付款日期"
          rules={[{ required: true }]}
        />
        {capabilities.renderPaymentMethodField(paymentMethodFieldProps)}
        <ProFormText name="referenceNo" label="银行流水号/支票号" />
      </ModalForm>
    </>
  );
}
