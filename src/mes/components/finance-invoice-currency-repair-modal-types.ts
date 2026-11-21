import type {
  FinanceInvoiceActionRecord,
  FinanceInvoiceCurrencyRepairResult,
  FinanceInvoiceWarningNotice,
} from './finance-invoice-action-types';

export interface FinanceInvoiceCurrencyRepairFormValues {
  currency?: string;
}

export interface FinanceInvoiceCurrencyRepairCapabilities {
  canReadSourceDocument: boolean;
  repairInvoiceCurrency: (params: {
    id: string;
    currency: string;
  }) => Promise<FinanceInvoiceCurrencyRepairResult>;
  getSourceDocumentStatusText: (
    status: string,
  ) => string | undefined;
  notifySuccess: (message: string) => void;
  notifyWarning: (notice: FinanceInvoiceWarningNotice) => void;
  openSourceDocument: (sourceDocumentId: string) => void;
}

export interface FinanceInvoiceCurrencyRepairModalProps {
  invoice: FinanceInvoiceActionRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void | Promise<void>;
  capabilities: FinanceInvoiceCurrencyRepairCapabilities;
}
