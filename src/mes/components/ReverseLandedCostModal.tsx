import {
  ModalForm,
  ProFormDatePicker,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import type { ReverseLandedCostModalProps } from './reverse-landed-cost-modal-types';

interface ReverseFormValues {
  reason?: string;
  businessDate?: Dayjs | string;
}

function normalizeBusinessDate(value?: Dayjs | string): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, 10) : undefined;
  }
  const formatted = value.format('YYYY-MM-DD');
  return formatted || undefined;
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain purchasing
 * @sunxu-reason Keeps the MES landed-cost reversal warning, required reason, business date normalization, feedback, and success callback while the host owns the reversal service.
 */
export function ReverseLandedCostModal({
  landedCost,
  onOpenChange,
  onSuccess,
  reverseLandedCost,
  normalizeBusinessDate: normalizeDate = normalizeBusinessDate,
}: ReverseLandedCostModalProps) {
  const { message } = App.useApp();

  return (
    <ModalForm<ReverseFormValues>
      title="冲销"
      open={Boolean(landedCost)}
      modalProps={{
        destroyOnHidden: true,
        onCancel: () => onOpenChange(false),
      }}
      onFinish={async (values) => {
        const reason = values.reason?.trim();
        if (!landedCost?.id || !reason) {
          message.warning('请填写冲销原因');
          return false;
        }
        try {
          await reverseLandedCost({
            id: landedCost.id,
            reason,
            businessDate: normalizeDate(values.businessDate),
          });
          message.success('已生成红字冲销单');
          onSuccess();
          return true;
        } catch {
          return false;
        }
      }}
    >
      <Typography.Paragraph type="warning">
        冲销后将生成承运商贷项并反向重估库存价值。请填写冲销原因。
      </Typography.Paragraph>
      <ProFormTextArea
        name="reason"
        label="冲销原因"
        rules={[{ required: true, max: 1000 }]}
      />
      <ProFormDatePicker name="businessDate" label="冲销业务日期" />
    </ModalForm>
  );
}

export type { ReverseLandedCostModalProps };
