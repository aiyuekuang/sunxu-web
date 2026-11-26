import { ModalForm, ProFormTextArea } from '@ant-design/pro-components';
import { Alert, App, Descriptions, Typography } from 'antd';
import { StockBusinessDateField } from './StockBusinessDateField';
import type {
  CustomerMaterialDispositionReverseModalProps,
  CustomerMaterialDispositionReverseRequest,
} from './customer-material-disposition-types';

interface ReverseFormValues {
  reason?: string;
  businessDate?: unknown;
}

/**
 * @sunxu-layer business
 * @sunxu-domain inventory
 * @sunxu-reason Preserves the high-risk customer-material reversal confirmation and explains the inventory/source restoration effects while the host supplies the reverse service and date serializer.
 */
export function CustomerMaterialDispositionReverseModal({
  detail,
  onOpenChange,
  onSuccess,
  capabilities,
}: CustomerMaterialDispositionReverseModalProps) {
  const { message } = App.useApp();

  return (
    <ModalForm<ReverseFormValues>
      title="冲正客户料处置"
      open={Boolean(detail)}
      width={560}
      modalProps={{
        destroyOnHidden: true,
        onCancel: () => onOpenChange(false),
      }}
      onFinish={async (values) => {
        const reason = values.reason?.trim();
        if (!detail?.id || !reason) {
          message.warning('请填写冲正原因');
          return false;
        }
        try {
          const request: CustomerMaterialDispositionReverseRequest = {
            id: detail.id,
            reason,
            businessDate: capabilities.normalizeDateOnlyValue(
              values.businessDate,
            ),
          };
          await capabilities.reverse(request);
          message.success('客户料处置已冲正');
          onOpenChange(false);
          await onSuccess();
          return true;
        } catch {
          return false;
        }
      }}
    >
      <Alert
        type="warning"
        showIcon
        message="这是已确认处置事实的纠正动作"
        description="系统会追加反向库存流水、恢复客户料来源余额，并重新计算客户来料登记状态；原处置单、原库存流水和来源分摊记录都会保留。"
        style={{ marginBottom: 16 }}
      />
      {detail ? (
        <Descriptions
          size="small"
          column={2}
          bordered
          style={{ marginBottom: 16 }}
        >
          <Descriptions.Item label="处置单号">
            {detail.dispositionNo}
          </Descriptions.Item>
          <Descriptions.Item label="当前状态">
            {capabilities.statusEnum[detail.status]?.text ?? detail.status}
          </Descriptions.Item>
          <Descriptions.Item label="处置明细">
            {detail.items?.length ?? 0} 行
          </Descriptions.Item>
          <Descriptions.Item label="处置类型">
            {capabilities.typeEnum[detail.dispositionType]?.text ??
              detail.dispositionType}
          </Descriptions.Item>
        </Descriptions>
      ) : null}
      <Typography.Paragraph type="secondary">
        冲正完成后单据状态变为“已冲正”；如需重新处置，请等待来源余额恢复后新建处置单。
      </Typography.Paragraph>
      <ProFormTextArea
        name="reason"
        label="冲正原因"
        placeholder="请说明录入错误或需要纠正的业务原因"
        rules={[{ required: true, message: '请填写冲正原因' }, { max: 1000 }]}
        fieldProps={{ autoSize: { minRows: 3, maxRows: 6 } }}
      />
      <StockBusinessDateField
        label="冲正业务日期"
        extra="按实际冲正发生日期记账；不能选择未来日期，不能早于原业务发生日期。"
      />
    </ModalForm>
  );
}
