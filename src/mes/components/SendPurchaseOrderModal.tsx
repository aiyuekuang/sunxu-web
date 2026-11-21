import {
  CopyOutlined,
  InfoCircleOutlined,
  MailOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { useMemo } from 'react';
import { SendActionModal } from './SendActionModal';
import type {
  PurchaseOrderSendChannel,
  PurchaseOrderSendOption,
  PurchaseOrderSendOptions,
} from './send-action-modal-types';
import type { SendPurchaseOrderModalProps } from './send-purchase-order-modal-types';

const CHANNEL_ORDER: readonly PurchaseOrderSendChannel[] = [
  'email',
  'share',
  'copy',
  'manual',
];

function channelIcon(channel: PurchaseOrderSendChannel) {
  if (channel === 'email') return <MailOutlined aria-hidden="true" />;
  if (channel === 'share') return <ShareAltOutlined aria-hidden="true" />;
  if (channel === 'copy') return <CopyOutlined aria-hidden="true" />;
  return <InfoCircleOutlined aria-hidden="true" />;
}

function getTagLabel(option: PurchaseOrderSendOption): string {
  if (option.channel === 'copy') return '复制全文';
  if (option.channel === 'manual') return '仅留痕';
  if (option.channel === 'email') return '系统直发';
  return '系统分享';
}

/** @sunxu-component mes-specific @sunxu-domain purchase order sharing @sunxu-reason Keeps the source purchase-order send options, messages, and channel ordering while the host provides send services and PDF access. */
export function SendPurchaseOrderModal({
  open,
  orderId,
  orderNo,
  onOpenChange,
  onSuccess,
  capabilities,
}: SendPurchaseOrderModalProps) {
  const payload = useMemo(() => (orderId ? { id: orderId } : undefined), [orderId]);

  return (
    <SendActionModal<
      { id: string },
      PurchaseOrderSendChannel,
      PurchaseOrderSendOption,
      PurchaseOrderSendOptions
    >
      open={open}
      payload={payload}
      title={`发送采购单${orderNo ? ` · ${orderNo}` : ''}`}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      channelOrder={CHANNEL_ORDER}
      autoCopyChannels={['share', 'copy']}
      nativeShareChannels={['share']}
      infoMessage="支持邮件直发、复制并系统分享、复制全部采购文本。"
      fetchOptions={capabilities.fetchOptions}
      sendAction={capabilities.send}
      fetchAttachmentPdf={capabilities.fetchAttachmentPdf}
      notifications={capabilities.notifications}
      getChannelIcon={channelIcon}
      getTagLabel={getTagLabel}
      getShareTitle={(optionsData) => optionsData?.emailSubject ?? `采购订单 ${orderNo ?? ''}`}
      getSubmitSuccessMessage={(channel) => {
        if (channel === 'email') return '邮件已发送';
        if (channel === 'copy') return '已复制全部采购文本并记录发送';
        if (channel === 'manual') return '已记录为手动发送';
        return '已复制文案并调起系统分享';
      }}
      getCopyWarningMessage={(channel) =>
        channel === 'copy'
          ? '确认后将复制发送文案。'
          : '确认后将复制发送文案，并调起系统分享应用。'
      }
    />
  );
}
