import {
  CopyOutlined,
  InfoCircleOutlined,
  MailOutlined,
  ShareAltOutlined,
  WechatOutlined,
} from '@ant-design/icons';
import { useMemo } from 'react';
import { SendActionModal } from './SendActionModal';
import type {
  QuotationSendChannel,
  QuotationSendOption,
  QuotationSendOptions,
  SendQuotationModalProps,
} from './send-quotation-modal-types';

const CHANNEL_ORDER: QuotationSendChannel[] = [
  'email',
  'share',
  'copy',
  'manual',
  'wechat',
  'wecom',
  'feishu',
];

const nativeShareChannels: ReadonlyArray<QuotationSendChannel> = [
  'share',
  'wechat',
  'wecom',
  'feishu',
];

const autoCopyChannels: ReadonlyArray<QuotationSendChannel> = [
  ...nativeShareChannels,
  'copy',
];

function channelIcon(channel: QuotationSendChannel) {
  if (channel === 'email') return <MailOutlined />;
  if (channel === 'share') return <ShareAltOutlined />;
  if (channel === 'wechat' || channel === 'wecom') return <WechatOutlined />;
  if (channel === 'feishu') return <ShareAltOutlined />;
  if (channel === 'copy') return <CopyOutlined />;
  return <InfoCircleOutlined />;
}

function getTagLabel(option: QuotationSendOption): string {
  if (option.channel === 'copy') return '复制全文';
  if (option.channel === 'manual') return '仅标记';
  if (option.channel === 'email') return '系统直发';
  return '系统分享';
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain sales quotation communication
 * @sunxu-reason Preserves quotation channel ordering, copy/native-share behavior, PDF attachment access and confirmation feedback while send requests and permission-aware attachment access remain host supplied.
 */
export function SendQuotationModal({
  open,
  quotationId,
  quotationNo,
  onOpenChange,
  onSuccess,
  capabilities,
}: SendQuotationModalProps) {
  const payload = useMemo(
    () => (quotationId ? { id: quotationId } : undefined),
    [quotationId],
  );

  return (
    <SendActionModal<
      { id: string },
      QuotationSendChannel,
      QuotationSendOption,
      QuotationSendOptions
    >
      open={open}
      payload={payload}
      title={`发送报价${quotationNo ? ` · ${quotationNo}` : ''}`}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      channelOrder={CHANNEL_ORDER}
      autoCopyChannels={autoCopyChannels}
      nativeShareChannels={nativeShareChannels}
      infoMessage="支持邮件直发、复制并系统分享、复制全部报价文本。"
      fetchOptions={capabilities.fetchOptions}
      sendAction={capabilities.send}
      fetchAttachmentPdf={capabilities.fetchAttachmentPdf}
      downloadAttachment={capabilities.downloadAttachment}
      getChannelIcon={channelIcon}
      getTagLabel={getTagLabel}
      getShareTitle={(optionsData) =>
        optionsData?.emailSubject ?? `报价单 ${quotationNo ?? ''}`
      }
      getSubmitSuccessMessage={capabilities.getSubmitSuccessMessage}
      getCopyWarningMessage={capabilities.getCopyWarningMessage}
      notifications={capabilities.notifications}
    />
  );
}
