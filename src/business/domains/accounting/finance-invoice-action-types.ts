import type { Dayjs } from 'dayjs';

export type FinanceInvoiceType = 'receivable' | 'payable';

/** Minimal host invoice identity and business facts consumed by the action modals. */
export interface FinanceInvoiceActionRecord {
  id: string;
  invoiceNo: string;
  type: FinanceInvoiceType;
  partnerName: string;
  currency?: string | null;
  residualAmount: number;
  invoiceDate: string;
}

export type FinanceDateOnlyInput = Dayjs | Date | string | undefined;
export type FinanceDateOnlyNormalizer = (
  value: FinanceDateOnlyInput,
) => string | undefined;

export type AccountingSourceDocumentStatus =
  | 'received'
  | 'pending_account_rule'
  | 'pending_amount'
  | 'pending_tax_rule'
  | 'pending_exchange_rate'
  | 'pending_cost'
  | 'pending_period'
  | 'pending_template'
  | 'voucher_draft'
  | 'voucher_posted'
  | 'posted'
  | 'failed'
  | 'adjusted'
  | 'ignored';

export interface FinanceInvoiceCurrencyRepairResult {
  accounting: {
    sourceDocumentId: string;
    sourceDocumentStatus: AccountingSourceDocumentStatus;
    errorCode?: string;
    errorMessage?: string;
  };
}

export interface FinanceInvoiceWarningAction {
  label: string;
  onClick: () => void;
}

export interface FinanceInvoiceWarningNotice {
  message: string;
  description: string;
  action?: FinanceInvoiceWarningAction;
}

export interface FinanceFundsAccountRecord {
  id: string;
  name: string;
  code: string;
  currency: string;
}

export interface CreditNoteRefundPayload {
  creditNoteId: string;
  amount: number;
  fundsAccountId: string;
  paymentDate?: string;
  paymentMethod?: string;
  referenceNo?: string;
  description?: string;
}

export interface CreditNoteRefundFormValues
  extends Omit<CreditNoteRefundPayload, 'creditNoteId' | 'paymentDate'> {
  paymentDate?: Dayjs;
}
