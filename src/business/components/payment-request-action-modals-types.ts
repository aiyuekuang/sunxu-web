import type { ReactNode } from 'react';
import type { Dayjs } from 'dayjs';

export interface PaymentRequestAllocationSnapshot {
  invoiceId: string;
  amount: number;
}

export interface PaymentRequestActionRecord {
  id: string;
  requestNo: string;
  partnerId: string;
  amount: number;
  businessCategory: string;
  currency?: string | null;
  exchangeRate?: number | null;
  plannedPaymentDate?: string | null;
  paymentMethod?: string | null;
  referenceNo?: string | null;
  cashBankAccountCode?: string | null;
  fundsAccountId?: string | null;
  description?: string | null;
  allocations?: PaymentRequestAllocationSnapshot[] | null;
}

export interface PaymentRequestFundsAccountRecord {
  id: string;
  name: string;
  code: string;
}

export interface PaymentRequestFundsAccountSelectOption {
  label: string;
  value: string;
}

export interface PaymentRequestUpdateFormValues {
  id: string;
  partnerId: string;
  amount: number;
  plannedPaymentDate?: Dayjs | string;
  paymentMethod?: string;
  referenceNo?: string;
  fundsAccountId?: string;
  description?: string;
}

export interface PaymentRequestUpdatePayload extends PaymentRequestUpdateFormValues {
  businessCategory: string;
  currency?: string;
  exchangeRate?: number;
  cashBankAccountCode?: string;
  allocations?: PaymentRequestAllocationSnapshot[];
}

export interface PaymentRequestExecuteFormValues {
  id: string;
  fundsAccountId?: string;
  paymentDate?: Dayjs | string;
  paymentMethod?: string;
  referenceNo?: string;
}

export type PaymentRequestExecutePayload = PaymentRequestExecuteFormValues;

export interface PaymentRequestPaymentMethodFieldProps {
  name: 'paymentMethod';
  label: '付款方式';
  typeCode: 'payment_method';
  fieldProps: { allowClear: true };
}

export interface PaymentRequestActionCapabilities<TPayment> {
  listFundsAccounts: (params: {
    pageSize: 100;
  }) => Promise<PaymentRequestFundsAccountRecord[]>;
  updateRequest: (payload: PaymentRequestUpdatePayload) => Promise<void>;
  executeRequest: (payload: PaymentRequestExecutePayload) => Promise<TPayment>;
  renderPaymentMethodField: (
    props: PaymentRequestPaymentMethodFieldProps,
  ) => ReactNode;
  notifyError: (message: string) => void;
  notifySuccess: (message: string) => void;
}

export interface PaymentRequestActionModalsProps<TPayment> {
  request: PaymentRequestActionRecord | null;
  editOpen: boolean;
  executeOpen: boolean;
  onEditOpenChange: (open: boolean) => void;
  onExecuteOpenChange: (open: boolean) => void;
  onEditSuccess: () => void | Promise<void>;
  onExecuteSuccess: (payment: TPayment) => void | Promise<void>;
  capabilities: PaymentRequestActionCapabilities<TPayment>;
}
