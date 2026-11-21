import type { ProFormSelectProps } from '@ant-design/pro-components';

export type AccountingReconciliationDirection = 'receipt' | 'payment';

export interface AccountingReconciliationLineForm {
  transactionDate: string;
  direction: AccountingReconciliationDirection;
  amount: number;
  summary?: string;
  counterpartyName?: string;
  counterpartyAccountNo?: string;
  externalTransactionNo?: string;
}

export interface AccountingReconciliationLineRecord {
  id: string;
  transactionDate: string;
  direction: AccountingReconciliationDirection;
  amount: number;
  summary?: string | null;
  counterpartyName?: string | null;
  counterpartyAccountNo?: string | null;
  externalTransactionNo?: string | null;
}

export interface AccountingAvailableFundsTransactionOption {
  id: string;
  transactionNo: string;
  bizDate: string;
  amount: number;
  counterpartyName?: string | null;
  sourceNo?: string | null;
}

export interface AccountingReconciliationCreateValues {
  code: string;
  name: string;
  fundsAccountId: string;
  statementNo: string;
  statementStartDate: string;
  statementEndDate: string;
  statementDate: string;
  openingBalance: number;
  endingBalance: number;
  lines?: AccountingReconciliationLineForm[];
}

export interface AccountingReconciliationCreatePayload extends Omit<
  AccountingReconciliationCreateValues,
  'lines'
> {
  lines: Array<AccountingReconciliationLineForm & { lineNo: number }>;
}

export interface AccountingReconciliationCapabilities<TDetail> {
  canCreate: boolean;
  canEditLines: boolean;
  create: (payload: AccountingReconciliationCreatePayload) => Promise<TDetail>;
  updateLines: (params: {
    id: string;
    lines: Array<AccountingReconciliationLineForm & { lineNo: number }>;
  }) => Promise<TDetail>;
  matchLine: (params: {
    lineId: string;
    fundsTransactionId: string;
  }) => Promise<TDetail>;
  requestBankFundsAccountOptions: NonNullable<ProFormSelectProps['request']>;
  requestAvailableFundsTransactions: (params: {
    lineId: string;
    keyword?: string;
    pageSize: number;
  }) => Promise<AccountingAvailableFundsTransactionOption[]>;
  formatMoney: (amount: number) => string;
  notifySuccess: (message: string) => void;
}

export interface EditLinesModalProps<TDetail> {
  reconciliationId: string;
  lines: AccountingReconciliationLineRecord[];
  onDone: (detail: TDetail) => void;
  capabilities: AccountingReconciliationCapabilities<TDetail>;
}

export interface MatchLineModalProps<TDetail> {
  line: AccountingReconciliationLineRecord;
  onDone: (detail: TDetail) => void;
  capabilities: AccountingReconciliationCapabilities<TDetail>;
}

export interface CreateReconciliationModalProps<TDetail> {
  onDone: (detail: TDetail) => void;
  capabilities: AccountingReconciliationCapabilities<TDetail>;
}
