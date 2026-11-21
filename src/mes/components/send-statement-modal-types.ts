import type {
  SendActionNotifications,
  SendChannelOption,
  SendOptionsResponse,
} from './send-action-modal-types';

export type StatementSendChannel = 'email' | 'copy';

export interface StatementSendPayload {
  type: 'receivable' | 'payable';
  partnerId?: string;
  partnerKeyword?: string;
  currency?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface StatementSendOption
  extends SendChannelOption<StatementSendChannel> {}

export interface StatementSendOptions
  extends SendOptionsResponse<StatementSendChannel, StatementSendOption> {
  emailSubject?: string;
}

export interface SendStatementCapabilities<TPayload extends StatementSendPayload> {
  fetchOptions: (payload: TPayload) => Promise<StatementSendOptions>;
  send: (
    payload: TPayload,
    channel: StatementSendChannel,
  ) => Promise<unknown>;
  notifications: SendActionNotifications;
}

export interface SendStatementModalProps<TPayload extends StatementSendPayload> {
  open: boolean;
  query?: TPayload | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  capabilities: SendStatementCapabilities<TPayload>;
}
