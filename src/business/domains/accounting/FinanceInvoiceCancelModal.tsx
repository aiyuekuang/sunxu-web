/** @sunxu-layer business @sunxu-domain accounting @sunxu-reason Preserves invoice cancellation, reversal-date constraints, and irreversible-action warnings while injecting cancellation, date normalization, notification, and completion effects. */
import { ModalForm, ProFormDatePicker } from '@ant-design/pro-components';
import { Alert } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type {
  FinanceInvoiceCancelFormValues,
  FinanceInvoiceCancelModalProps,
} from './finance-invoice-cancel-modal-types';
import type { FinanceInvoiceActionRecord } from './finance-invoice-action-types';

function defaultReversalDate(invoice: FinanceInvoiceActionRecord): Dayjs {
  const invoiceDate = dayjs(invoice.invoiceDate);
  return invoiceDate.isValid() && invoiceDate.isAfter(dayjs(), 'day')
    ? invoiceDate
    : dayjs();
}

/** Cancels an invoice and records the actual accounting reversal date. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable finance invoice cancel modal behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function FinanceInvoiceCancelModal({
  invoice,
  open,
  onOpenChange,
  onCompleted,
  capabilities,
}: FinanceInvoiceCancelModalProps) {
  if (!invoice) return null;

  const documentLabel = invoice.type === 'receivable' ? '应收单' : '应付单';
  const invoiceDate = dayjs(invoice.invoiceDate);

  return (
    <ModalForm<FinanceInvoiceCancelFormValues>
      key={`finance-invoice-cancel-${invoice.id}`}
      title={`取消${documentLabel}`}
      open={open}
      width={560}
      initialValues={{ reversalDate: defaultReversalDate(invoice) }}
      modalProps={{ destroyOnHidden: true }}
      onOpenChange={onOpenChange}
      submitter={{
        searchConfig: { submitText: '确认取消' },
        submitButtonProps: { danger: true },
      }}
      onFinish={async (values) => {
        await capabilities.cancelInvoice({
          id: invoice.id,
          reversalDate: capabilities.normalizeDateOnlyValue(values.reversalDate),
        });
        capabilities.notifySuccess(
          `${documentLabel}已取消，并已退出未清和账龄口径`,
        );
        await onCompleted();
        return true;
      }}
    >
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="取消后不能恢复，且仅未核销的应收/应付单允许取消。"
        description="如果原会计凭证已经过账，系统会在所选冲销日期所属的开放会计期间投递红冲；期间未开放时会阻止取消。"
      />
      <ProFormDatePicker
        name="reversalDate"
        label="实际冲销日期"
        rules={[{ required: true, message: '请选择实际冲销日期' }]}
        fieldProps={{
          disabledDate: (current: Dayjs) =>
            invoiceDate.isValid() && current.isBefore(invoiceDate, 'day'),
        }}
        extra="不能早于原单据日期；已过账凭证必须选择该账簿开放会计期间内的日期。"
      />
    </ModalForm>
  );
}
