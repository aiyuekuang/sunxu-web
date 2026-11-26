/** @sunxu-layer business @sunxu-domain accounting @sunxu-reason Reuses the shared send-channel experience for receivable and payable statements while the host injects statement requests, send actions, notifications, and document context. */
import {
  CopyOutlined,
  InfoCircleOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { useMemo } from 'react';
import { SendActionModal } from '../documents/SendActionModal';
import type {
  SendStatementModalProps,
  StatementSendChannel,
  StatementSendOption,
  StatementSendOptions,
  StatementSendPayload,
} from './send-statement-modal-types';

function channelIcon(channel: StatementSendChannel) {
  if (channel === 'email') return <MailOutlined />;
  if (channel === 'copy') return <CopyOutlined />;
  return <InfoCircleOutlined />;
}

function getTagLabel(option: StatementSendOption): string {
  if (option.channel === 'copy') return '复制并分享';
  return '系统直发';
}

/** Sends the selected receivable or payable statement through host channels. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable send statement modal behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function SendStatementModal<TPayload extends StatementSendPayload>(
  props: SendStatementModalProps<TPayload>,
) {
  const { open, query, onOpenChange, onSuccess, capabilities } = props;
  const payload = useMemo<TPayload | undefined>(
    () => query ?? undefined,
    [query],
  );
  const statementTypeLabel =
    query?.type === 'payable' ? '应付对账单' : '应收对账单';

  return (
    <SendActionModal<
      TPayload,
      StatementSendChannel,
      StatementSendOption,
      StatementSendOptions
    >
      open={open}
      payload={payload}
      title={`发送对账单 · ${statementTypeLabel}`}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      channelOrder={['email', 'copy']}
      autoCopyChannels={['copy']}
      nativeShareChannels={['copy']}
      infoMessage="支持邮件直发、复制并调起系统分享（微信/企微/飞书等）。"
      fetchOptions={capabilities.fetchOptions}
      sendAction={capabilities.send}
      getChannelIcon={channelIcon}
      getTagLabel={getTagLabel}
      getShareTitle={(optionsData) =>
        optionsData?.emailSubject ?? statementTypeLabel
      }
      getSubmitSuccessMessage={(channel) => {
        if (channel === 'email') return '邮件已发送';
        if (channel === 'copy') return '已复制对账文本并调起系统分享';
        return '已发送';
      }}
      getCopyWarningMessage={() => '确认后将复制发送文案，并尝试调起系统分享。'}
      notifications={capabilities.notifications}
    />
  );
}
