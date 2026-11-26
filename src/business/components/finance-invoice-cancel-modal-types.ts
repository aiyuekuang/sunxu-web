import type { Dayjs } from 'dayjs';
import type {
  FinanceDateOnlyNormalizer,
  FinanceInvoiceActionRecord,
} from './finance-invoice-action-types';

export interface FinanceInvoiceCancelFormValues {
  reversalDate?: Dayjs;
}

export interface FinanceInvoiceCancelCapabilities {
  cancelInvoice: (params: {
    id: string;
    reversalDate?: string;
  }) => Promise<void>;
  normalizeDateOnlyValue: FinanceDateOnlyNormalizer;
  notifySuccess: (message: string) => void;
}

export interface FinanceInvoiceCancelModalProps {
  invoice: FinanceInvoiceActionRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void | Promise<void>;
  capabilities: FinanceInvoiceCancelCapabilities;
}
