/** @sunxu-component mes-specific @sunxu-domain mes-finance-invoice-currency-repair @sunxu-reason Keeps historical invoice currency repair and accounting-source outcomes in the invoice context while the host supplies persistence, permission result, notifications, status labels, and navigation. */
import { ModalForm, ProFormText } from '@ant-design/pro-components';
import { Alert, Button } from 'antd';
import type {
  FinanceInvoiceCurrencyRepairFormValues,
  FinanceInvoiceCurrencyRepairModalProps,
} from './finance-invoice-currency-repair-modal-types';

/** Repairs a stored source snapshot or backfills a missing historical currency. */
export function FinanceInvoiceCurrencyRepairModal({
  invoice,
  open,
  onOpenChange,
  onCompleted,
  capabilities,
}: FinanceInvoiceCurrencyRepairModalProps) {
  if (!invoice) return null;

  const storedCurrency = invoice.currency?.trim().toUpperCase();
  const repairingSourceSnapshot = Boolean(storedCurrency);

  return (
    <ModalForm<FinanceInvoiceCurrencyRepairFormValues>
      key={`finance-invoice-currency-repair-${invoice.id}`}
      title={repairingSourceSnapshot ? '修复会计来源快照' : '补录历史币别'}
      open={open}
      width={560}
      modalProps={{ destroyOnHidden: true }}
      onOpenChange={onOpenChange}
      submitter={{
        searchConfig: {
          submitText: repairingSourceSnapshot
            ? '确认修复来源快照'
            : '确认补录并修复来源单',
        },
      }}
      onFinish={async (values) => {
        const currency = storedCurrency ?? values.currency?.trim().toUpperCase();
        if (!currency) return false;

        const result = await capabilities.repairInvoiceCurrency({
          id: invoice.id,
          currency,
        });
        const { accounting } = result;
        const accountingCompleted =
          !accounting.errorCode &&
          ['voucher_draft', 'voucher_posted', 'posted'].includes(
            accounting.sourceDocumentStatus,
          );
        if (accountingCompleted) {
          capabilities.notifySuccess(
            repairingSourceSnapshot
              ? '会计来源快照已重新处理'
              : '币别已补录，会计来源快照已重新处理',
          );
        } else {
          const sourceDocumentStatusText =
            capabilities.getSourceDocumentStatusText(
              accounting.sourceDocumentStatus,
            ) ?? '未知状态';
          capabilities.notifyWarning({
            message: repairingSourceSnapshot
              ? '会计来源快照已修复，会计仍待处理'
              : '币别已补录，会计仍待处理',
            description:
              accounting.errorMessage ??
              `来源单当前状态：${sourceDocumentStatusText}`,
            action: capabilities.canReadSourceDocument
              ? {
                  label: '查看来源单',
                  onClick: () =>
                    capabilities.openSourceDocument(
                      accounting.sourceDocumentId,
                    ),
                }
              : undefined,
          });
        }
        await onCompleted();
        return true;
      }}
    >
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message={
          repairingSourceSnapshot
            ? `按应收/应付单已维护币种 ${storedCurrency} 修复待补金额来源快照`
            : '仅用于修复旧版手工单遗漏的币别'
        }
        description={
          repairingSourceSnapshot
            ? '系统只会回填尚未形成凭证的历史会计来源快照；不会改写当前应收/应付单金额、币种或已生成的凭证。'
            : '请按原始业务事实填写币种。系统会同步修复尚未形成凭证的会计来源快照；已核销、已取消、非手工单或已生成凭证的记录会被后端拒绝。'
        }
      />
      {!repairingSourceSnapshot ? (
        <ProFormText
          name="currency"
          label="币种代码"
          placeholder="例如 CNY"
          rules={[
            { required: true, message: '请输入币种代码' },
            {
              pattern: /^[A-Za-z]{3,8}$/,
              message: '请输入 3 到 8 位英文字母代码，例如 CNY',
            },
          ]}
          fieldProps={{ maxLength: 8, autoComplete: 'off' }}
          extra="不会自动套用公司默认币别，必须以该历史单据的实际币别为准。"
        />
      ) : null}
    </ModalForm>
  );
}
