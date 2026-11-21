import { ModalForm, ProFormTextArea } from '@ant-design/pro-components';
import { Alert, Descriptions, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import { StockBusinessDateField } from './StockBusinessDateField';
import type { SaleReturnReverseModalProps } from './sale-return-components-types';

/** @sunxu-component mes-specific @sunxu-domain sales-return-reversal @sunxu-reason Keeps the reversal impact summary, reason and business date flow while the host supplies the authoritative action, status labels, date normalization and feedback. */
export function SaleReturnReverseModal({
  detail,
  onOpenChange,
  onSuccess,
  capabilities,
}: SaleReturnReverseModalProps) {
  return (
    <ModalForm<{
      reason?: string;
      businessDate?: Dayjs | string;
    }>
      title="冲正销售退货"
      open={Boolean(detail)}
      width={560}
      modalProps={{
        destroyOnHidden: true,
        onCancel: () => onOpenChange(false),
      }}
      onFinish={async (values) => {
        const reason = values.reason?.trim();
        if (!detail?.id || !reason) {
          capabilities.notifyWarning('请填写冲正原因');
          return false;
        }
        try {
          await capabilities.reverse({
            id: detail.id,
            reason,
            businessDate: capabilities.normalizeDateOnly(values.businessDate),
          });
          capabilities.notifySuccess('销售退货已冲正');
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
        message="这是已过账事实的纠正动作"
        description="系统会追加反向库存流水，并作废本单自动生成且尚未外部核销的财务来源单；原销售退货单、原库存流水和财务审计记录都会保留。"
        style={{ marginBottom: 16 }}
      />
      {detail ? (
        <Descriptions
          size="small"
          column={2}
          bordered
          style={{ marginBottom: 16 }}
        >
          <Descriptions.Item label="退货单号">
            {detail.returnNo}
          </Descriptions.Item>
          <Descriptions.Item label="当前状态">
            {capabilities.getStatusLabel(detail.status)}
          </Descriptions.Item>
          <Descriptions.Item label="实收数量">
            {detail.totalReceivedQty ?? 0}
          </Descriptions.Item>
          <Descriptions.Item label="原库存流水">
            {detail.stockTransactions?.length ?? 0} 条
          </Descriptions.Item>
        </Descriptions>
      ) : null}
      <Typography.Paragraph type="secondary">
        冲正完成后单据状态变为“已冲正”，如需修正业务内容请基于原单重新创建草稿。
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
