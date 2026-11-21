import { ModalForm, ProFormTextArea } from '@ant-design/pro-components';
import { Alert } from 'antd';
import dayjs from 'dayjs';
import { StockBusinessDateField } from './StockBusinessDateField';
import type {
  StockTransferActionModalsProps,
  StockTransferOrderActionOrder,
} from './stock-transfer-types';

export type {
  StockTransferOrderAction,
  StockTransferOrderActionTarget,
} from './stock-transfer-types';

function defaultActualBusinessDate(order: StockTransferOrderActionOrder) {
  const plannedDate = order.plannedDate ? dayjs(order.plannedDate) : null;
  return plannedDate?.isValid() && !plannedDate.isAfter(dayjs(), 'day')
    ? plannedDate
    : dayjs();
}

function StockTransferConfirmModal({
  order,
  onClose,
  onSuccess,
  capabilities,
}: Omit<StockTransferActionModalsProps, 'target'> & {
  order: StockTransferOrderActionOrder;
}) {
  return (
    <ModalForm<{ businessDate?: unknown }>
      key={`stock-transfer-confirm-${order.id}`}
      title="确认调拨"
      open
      width={520}
      initialValues={{ businessDate: defaultActualBusinessDate(order) }}
      modalProps={{ destroyOnHidden: true }}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      onFinish={async (values) => {
        await capabilities.confirmTransfer({
          id: order.id,
          businessDate: capabilities.normalizeDateOnly(values.businessDate),
        });
        capabilities.notifySuccess('调拨已确认，库存已按调拨日期变更');
        onClose();
        void onSuccess?.();
        return true;
      }}
    >
      <Alert
        showIcon
        type="warning"
        message="确认后将同步扣减调出仓、增加调入仓，并生成库存流水；库存不足、批号不符或仓位校验失败时，整张调拨单不会确认。"
        style={{ marginBottom: 16 }}
      />
      <StockBusinessDateField
        label="调拨日期"
        extra="默认采用已到期的计划日期；可补录历史日期，不能选择未来日期。"
      />
    </ModalForm>
  );
}

function StockTransferCancelModal({
  order,
  onClose,
  onSuccess,
  capabilities,
}: Omit<StockTransferActionModalsProps, 'target'> & {
  order: StockTransferOrderActionOrder;
}) {
  return (
    <ModalForm<{ reason?: string }>
      key={`stock-transfer-cancel-${order.id}`}
      title="取消调拨草稿"
      open
      width={520}
      modalProps={{ destroyOnHidden: true }}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      onFinish={async (values) => {
        await capabilities.cancelTransfer({
          id: order.id,
          reason: values.reason?.trim() || undefined,
        });
        capabilities.notifySuccess('调拨草稿已取消，库存未发生变更');
        onClose();
        void onSuccess?.();
        return true;
      }}
    >
      <Alert
        showIcon
        type="info"
        message="取消只适用于草稿调拨单，不会产生库存流水。"
        style={{ marginBottom: 16 }}
      />
      <ProFormTextArea
        name="reason"
        label="取消原因"
        fieldProps={{ rows: 4, maxLength: 1000 }}
        placeholder="可填写计划变更或取消原因"
      />
    </ModalForm>
  );
}

function StockTransferReverseModal({
  order,
  onClose,
  onSuccess,
  capabilities,
}: Omit<StockTransferActionModalsProps, 'target'> & {
  order: StockTransferOrderActionOrder;
}) {
  return (
    <ModalForm<{ reason: string; businessDate?: unknown }>
      key={`stock-transfer-reverse-${order.id}`}
      title="撤销库存调拨"
      open
      width={520}
      modalProps={{ destroyOnHidden: true }}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      onFinish={async (values) => {
        await capabilities.reverseTransfer({
          id: order.id,
          reason: values.reason.trim(),
          businessDate: capabilities.normalizeDateOnly(values.businessDate),
        });
        capabilities.notifySuccess('调拨已撤销，已生成反向库存流水');
        onClose();
        void onSuccess?.();
        return true;
      }}
    >
      <Alert
        showIcon
        type="warning"
        message="撤销会沿原路径生成整张调拨单的反向库存流水，不会删除原调拨事实。若调入库存已被消耗或再次调出，系统会阻止撤销。"
        style={{ marginBottom: 16 }}
      />
      <ProFormTextArea
        name="reason"
        label="撤销原因"
        rules={[{ required: true, whitespace: true, message: '请填写撤销原因' }]}
        fieldProps={{ rows: 4, maxLength: 1000 }}
      />
      <StockBusinessDateField label="撤销调拨日期" />
    </ModalForm>
  );
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain warehouse stock transfer lifecycle
 * @sunxu-reason Preserves confirm, draft-cancel, and reversal workflows while the host owns transfer APIs, date serialization, success feedback, permission gating, and table refresh.
 *
 * Renders the one lifecycle modal selected by the host from the transfer order's
 * available actions.
 */
export function StockTransferActionModals({
  target,
  onClose,
  onSuccess,
  capabilities,
}: StockTransferActionModalsProps) {
  if (!target) return null;
  const shared = {
    order: target.order,
    onClose,
    onSuccess,
    capabilities,
  };
  if (target.action === 'confirm') {
    return <StockTransferConfirmModal {...shared} />;
  }
  if (target.action === 'cancel') {
    return <StockTransferCancelModal {...shared} />;
  }
  return <StockTransferReverseModal {...shared} />;
}
