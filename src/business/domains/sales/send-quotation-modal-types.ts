import type {
  SendActionNotifications,
  SendChannelOption,
  SendOptionsResponse,
} from '../documents/send-action-modal-types';

export type QuotationSendChannel =
  | 'email'
  | 'share'
  | 'wechat'
  | 'wecom'
  | 'feishu'
  | 'copy'
  | 'manual';

export interface QuotationSendOption
  extends SendChannelOption<QuotationSendChannel> {
  target?: string;
  launchUrl?: string;
}

export interface QuotationSendOptions
  extends SendOptionsResponse<QuotationSendChannel, QuotationSendOption> {
  quotationId?: string;
  quotationNo?: string;
  customerName?: string | null;
}

export interface SendQuotationCapabilities {
  fetchOptions: (payload: { id: string }) => Promise<QuotationSendOptions>;
  send: (
    payload: { id: string },
    channel: QuotationSendChannel,
  ) => Promise<unknown>;
  fetchAttachmentPdf: (payload: { id: string }) => Promise<unknown>;
  downloadAttachment: (value: unknown, filename: string) => void;
  notifications: SendActionNotifications;
  getSubmitSuccessMessage: (channel: QuotationSendChannel) => string;
  getCopyWarningMessage: (channel: QuotationSendChannel) => string;
}

export interface SendQuotationModalProps {
  open: boolean;
  quotationId?: string;
  quotationNo?: string;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  capabilities: SendQuotationCapabilities;
}
