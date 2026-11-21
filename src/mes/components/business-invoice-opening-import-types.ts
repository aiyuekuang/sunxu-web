import type { BusinessInvoiceMode } from './business-invoice-types';

export interface BusinessInvoiceBatchResultRow {
  rowNo: number;
  success: boolean;
  invoiceId?: string;
  documentNo?: string;
  invoiceNo?: string;
  error?: string;
  duplicate: boolean;
}

export interface BusinessInvoiceBatchResult {
  total: number;
  succeeded: number;
  failed: number;
  rows: BusinessInvoiceBatchResultRow[];
}

export interface BusinessInvoiceOpeningImportRequest {
  base64: string;
  fileName: string;
}

export interface BusinessInvoiceOpeningImportCapabilities {
  importOpeningInvoices: (
    mode: BusinessInvoiceMode,
    request: BusinessInvoiceOpeningImportRequest,
  ) => Promise<BusinessInvoiceBatchResult>;
  /** Host owns downloading the generated CSV template. */
  downloadTemplate: (fileName: string, csv: string) => void;
  notify: (
    type: 'success' | 'warning',
    message: string,
  ) => void;
}

export interface BusinessInvoiceOpeningImportDrawerProps {
  mode: BusinessInvoiceMode;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  capabilities: BusinessInvoiceOpeningImportCapabilities;
}
