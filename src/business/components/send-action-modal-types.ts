import type { ReactNode } from 'react';

export type SendChannelOption<TChannel extends string> = {
  channel: TChannel;
  label: string;
  target?: string;
  canDirectSend: boolean;
};

export type SendOptionsResponse<
  TChannel extends string,
  TOption extends SendChannelOption<TChannel> = SendChannelOption<TChannel>,
> = {
  options: TOption[];
  messageContent?: string;
  emailSubject?: string;
  attachmentFilename?: string;
  attachmentPreviewable?: boolean;
};

export interface SendActionNotifications {
  error: (text: string) => void;
  success: (text: string) => void;
  warning: (text: string) => void;
  info: (text: string) => void;
}

export interface SendActionModalProps<
  TPayload,
  TChannel extends string,
  TOption extends SendChannelOption<TChannel>,
  TResponse extends SendOptionsResponse<TChannel, TOption>,
> {
  open: boolean;
  payload?: TPayload;
  title: string;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  okText?: string;
  infoMessage?: string;
  emptyOptionsMessage?: string;
  loadOptionsErrorMessage?: string;
  channelOrder?: ReadonlyArray<TChannel>;
  autoCopyChannels?: ReadonlyArray<TChannel>;
  nativeShareChannels?: ReadonlyArray<TChannel>;
  fetchOptions: (payload: TPayload) => Promise<TResponse>;
  sendAction: (payload: TPayload, channel: TChannel) => Promise<unknown>;
  /** Fetches the email attachment as a PDF blob. Omit to hide the attachment row. */
  fetchAttachmentPdf?: (payload: TPayload) => Promise<unknown>;
  /** Download adapter; if omitted, the attachment row keeps preview but hides download. */
  downloadAttachment?: (value: unknown, filename: string) => void;
  getChannelIcon: (channel: TChannel) => ReactNode;
  getTagLabel: (option: TOption) => string;
  getShareTitle: (optionsData: TResponse | null) => string;
  getSubmitSuccessMessage: (channel: TChannel) => string;
  getCopyWarningMessage?: (channel: TChannel) => string;
  notifications: SendActionNotifications;
}

export interface SendAttachmentRowProps<TPayload> {
  payload: TPayload;
  filename: string;
  /** The host has confirmed that the current user may view amount-bearing files. */
  previewable: boolean;
  /** Fetches the PDF attachment as a blob. */
  fetchPdf: (payload: TPayload) => Promise<unknown>;
  /** Starts a browser download through the host application's file adapter. */
  download?: (value: unknown, filename: string) => void;
  notifyError: (text: string) => void;
}

export type PurchaseOrderSendChannel = 'email' | 'share' | 'copy' | 'manual';

export interface PurchaseOrderSendOption
  extends SendChannelOption<PurchaseOrderSendChannel> {}

export interface PurchaseOrderSendOptions
  extends SendOptionsResponse<PurchaseOrderSendChannel, PurchaseOrderSendOption> {}

export interface PurchaseOrderSendCapabilities {
  fetchOptions: (payload: { id: string }) => Promise<PurchaseOrderSendOptions>;
  send: (
    payload: { id: string },
    channel: PurchaseOrderSendChannel,
  ) => Promise<unknown>;
  fetchAttachmentPdf: (payload: { id: string }) => Promise<unknown>;
  downloadAttachment: (value: unknown, filename: string) => void;
  notifications: SendActionNotifications;
}

export interface SendPurchaseOrderModalProps {
  open: boolean;
  orderId?: string;
  orderNo?: string;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  capabilities: PurchaseOrderSendCapabilities;
}
