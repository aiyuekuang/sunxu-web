import type { ReactNode } from 'react';
import type {
  CreditNoteRefundPayload,
  FinanceFundsAccountRecord,
  FinanceInvoiceActionRecord,
  FinanceDateOnlyNormalizer,
} from './finance-invoice-action-types';

export type { CreditNoteRefundFormValues } from './finance-invoice-action-types';

export interface CreditNotePaymentMethodFieldProps {
  name: 'paymentMethod';
  label: '收付款方式';
  typeCode: 'payment_method';
}

export interface CreditNoteRefundCapabilities<TPayment> {
  listActiveFundsAccounts: (params: {
    page: 1;
    pageSize: 100;
    isActive: true;
  }) => Promise<FinanceFundsAccountRecord[]>;
  settleCreditNoteRefund: (
    payload: CreditNoteRefundPayload,
  ) => Promise<TPayment>;
  renderPaymentMethodField: (
    props: CreditNotePaymentMethodFieldProps,
  ) => ReactNode;
  normalizeDateOnlyValue: FinanceDateOnlyNormalizer;
  notifyError: (message: string) => void;
  notifySuccess: (message: string) => void;
}

export interface CreditNoteRefundModalProps<TPayment> {
  creditNote: FinanceInvoiceActionRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: (payment: TPayment) => void | Promise<void>;
  capabilities: CreditNoteRefundCapabilities<TPayment>;
}
