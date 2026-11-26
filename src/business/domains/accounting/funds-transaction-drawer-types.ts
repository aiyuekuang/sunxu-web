export type FundsTransactionDirection = 'in' | 'out';
export type FundsTransactionStatus = 'posted' | 'voided';

export interface FundsTransactionDetail {
  transactionNo: string;
  status: FundsTransactionStatus;
  account?: { name?: string | null } | null;
  direction: FundsTransactionDirection;
  amount: number | string;
  currency: string;
  bizDate: string;
  counterpartyName?: string | null;
  sourceNo?: string | null;
  createdAt: string;
  remark?: string | null;
}

export interface FundsTransactionDrawerCapabilities {
  loadDetail: (params: { id: string }) => Promise<FundsTransactionDetail>;
  statusLabel: (status: FundsTransactionStatus) => string | undefined;
  directionLabel: (direction: FundsTransactionDirection) => string | undefined;
  /** Host formatter should preserve the host amount precision and currency policy. */
  formatAmount: (amount: number | string) => string;
  formatDate: (value: string) => string;
  formatDateTime: (value: string) => string;
  notifyLoadError: (error: unknown) => void;
}

export interface FundsTransactionDrawerProps {
  open: boolean;
  transactionId: string;
  onClose: () => void;
  capabilities: FundsTransactionDrawerCapabilities;
}
