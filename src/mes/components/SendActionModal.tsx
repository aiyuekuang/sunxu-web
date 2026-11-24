import {
  Alert,
  Modal,
  Radio,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import type {
  SendActionModalProps,
  SendChannelOption,
  SendOptionsResponse,
} from './send-action-modal-types';
import { SendAttachmentRow } from './SendAttachmentRow';

function pickDefaultChannel<
  TChannel extends string,
  TOption extends { channel: TChannel },
>(
  options: TOption[],
  channelOrder?: ReadonlyArray<TChannel>,
): TChannel | undefined {
  if (channelOrder?.length) {
    for (const channel of channelOrder) {
      if (options.some((option) => option.channel === channel)) return channel;
    }
  }
  return options[0]?.channel;
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (!text || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

async function openNativeShare(
  title: string,
  messageContent: string,
  showUnsupportedMessage: () => void,
): Promise<void> {
  if (!messageContent || typeof navigator === 'undefined') return;
  if (!navigator.share) {
    showUnsupportedMessage();
    return;
  }
  try {
    await navigator.share({ title, text: messageContent });
  } catch {
    // Dismissing the native share sheet is an expected user action.
  }
}

/** @sunxu-component mes-specific @sunxu-domain document sharing @sunxu-reason Preserves the MES send-channel selection, copy/share feedback, and optional PDF preview while injecting all document services. */
export function SendActionModal<
  TPayload,
  TChannel extends string,
  TOption extends SendChannelOption<TChannel>,
  TResponse extends SendOptionsResponse<TChannel, TOption>,
>({
  open,
  payload,
  title,
  onOpenChange,
  onSuccess,
  okText = '确认发送',
  infoMessage,
  emptyOptionsMessage = '暂无可用发送方式',
  loadOptionsErrorMessage = '获取发送方式失败，请稍后重试',
  channelOrder,
  autoCopyChannels = [],
  nativeShareChannels = [],
  fetchOptions,
  sendAction,
  fetchAttachmentPdf,
  downloadAttachment,
  getChannelIcon,
  getTagLabel,
  getShareTitle,
  getSubmitSuccessMessage,
  getCopyWarningMessage,
  notifications,
}: SendActionModalProps<TPayload, TChannel, TOption, TResponse>) {
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [sending, setSending] = useState(false);
  const [optionsData, setOptionsData] = useState<TResponse | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<TChannel>();

  useEffect(() => {
    if (!open || payload === undefined) return;
    let alive = true;
    setLoadingOptions(true);
    setOptionsData(null);
    setSelectedChannel(undefined);
    fetchOptions(payload)
      .then((result) => {
        if (!alive) return;
        const options = result?.options ?? [];
        setOptionsData(result ?? null);
        setSelectedChannel(pickDefaultChannel(options, channelOrder));
      })
      .catch(() => {
        if (alive) notifications.error(loadOptionsErrorMessage);
      })
      .finally(() => {
        if (alive) setLoadingOptions(false);
      });
    return () => {
      alive = false;
    };
  }, [
    open,
    payload,
    fetchOptions,
    channelOrder,
    loadOptionsErrorMessage,
    notifications,
  ]);

  const handleSubmit = async () => {
    if (payload === undefined || !selectedChannel) return;
    setSending(true);
    try {
      const messageContent = optionsData?.messageContent ?? '';
      await sendAction(payload, selectedChannel);

      if (autoCopyChannels.includes(selectedChannel)) {
        const copied = await copyToClipboard(messageContent);
        if (copied) {
          notifications.success('发送文案已复制，可直接粘贴');
        } else {
          notifications.warning('自动复制失败，请手动复制发送文案');
        }
      }

      if (nativeShareChannels.includes(selectedChannel)) {
        await openNativeShare(getShareTitle(optionsData), messageContent, () => {
          notifications.info('当前浏览器不支持系统分享，文案已复制，请手动粘贴发送');
        });
      }

      notifications.success(getSubmitSuccessMessage(selectedChannel));
      onOpenChange(false);
      onSuccess?.();
    } finally {
      setSending(false);
    }
  };

  const warningMessage =
    selectedChannel && autoCopyChannels.includes(selectedChannel)
      ? getCopyWarningMessage?.(selectedChannel)
      : undefined;

  return (
    <Modal
      title={title}
      open={open}
      onCancel={() => onOpenChange(false)}
      onOk={() => void handleSubmit()}
      okText={okText}
      destroyOnHidden
      okButtonProps={{
        loading: sending,
        disabled: loadingOptions || payload === undefined || !selectedChannel,
      }}
      cancelButtonProps={{ disabled: sending }}
    >
      {loadingOptions ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <Spin />
        </div>
      ) : (
        <>
          {infoMessage ? (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message={infoMessage}
            />
          ) : null}

          {(optionsData?.options?.length ?? 0) > 0 ? (
            <Radio.Group
              value={selectedChannel}
              onChange={(event) => setSelectedChannel(event.target.value as TChannel)}
              style={{ width: '100%' }}
              aria-label="发送方式"
            >
              <Space orientation="vertical" style={{ width: '100%' }} size={10}>
                {(optionsData?.options ?? []).map((option) => (
                  <Radio
                    key={option.channel}
                    value={option.channel}
                    style={{ width: '100%' }}
                  >
                    <Space wrap>
                      {getChannelIcon(option.channel)}
                      <Typography.Text>{option.label}</Typography.Text>
                      {option.target ? (
                        <Typography.Text type="secondary">
                          {option.target}
                        </Typography.Text>
                      ) : null}
                      {option.canDirectSend ? (
                        <Tag color="success">系统直发</Tag>
                      ) : (
                        <Tag>{getTagLabel(option)}</Tag>
                      )}
                    </Space>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          ) : (
            <Alert type="warning" showIcon message={emptyOptionsMessage} />
          )}

          {warningMessage ? (
            <Alert
              type="warning"
              showIcon
              style={{ marginTop: 12 }}
              message={warningMessage}
            />
          ) : null}

          {optionsData?.messageContent ? (
            <Typography.Paragraph
              style={{ marginTop: 12, marginBottom: 0, whiteSpace: 'pre-wrap' }}
              copyable
            >
              {optionsData.messageContent}
            </Typography.Paragraph>
          ) : null}

          {payload !== undefined && fetchAttachmentPdf && optionsData?.attachmentFilename ? (
            <SendAttachmentRow
              payload={payload}
              filename={optionsData.attachmentFilename}
              previewable={optionsData.attachmentPreviewable ?? false}
              fetchPdf={fetchAttachmentPdf}
              download={downloadAttachment}
              notifyError={notifications.error}
            />
          ) : null}
        </>
      )}
    </Modal>
  );
}
