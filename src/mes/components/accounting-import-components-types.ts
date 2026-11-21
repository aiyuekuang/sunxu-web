import type { UploadFile } from 'antd';

export interface AccountingAccountImportRowResult {
  rowNo: number;
  code: string;
  accountingBookCode: string;
  status: 'valid' | 'error';
  message?: string;
}

export interface AccountingAccountImportResult {
  total: number;
  imported: number;
  rows: AccountingAccountImportRowResult[];
}

export interface AccountImportCapabilities {
  canManage: boolean;
  /** Fetches and downloads the same Excel template offered by MES. */
  downloadTemplate: () => Promise<void>;
  importAccounts: (file: File) => Promise<AccountingAccountImportResult>;
  notifyError: (message: string) => void;
  notifySuccess: (message: string) => void;
}

export interface AccountImportModalProps {
  onDone: () => void;
  capabilities: AccountImportCapabilities;
}

export type OpeningBalanceBatchStatus =
  | 'draft'
  | 'validated'
  | 'confirmed'
  | 'cancelled';

export interface OpeningBalanceImportBatch {
  id: string;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  batchNo: string;
  accountingBookCode: string;
  fiscalPeriod: string;
  openingDate: string;
  status: OpeningBalanceBatchStatus;
  debitTotal: number;
  creditTotal: number;
  rowCount: number;
  errorCount: number;
  validationMessage?: string | null;
  fileName?: string | null;
  voucherId?: string | null;
  createdByOperatorId?: string | null;
  confirmedAt?: string | null;
  confirmedByOperatorId?: string | null;
  cancelledAt?: string | null;
  cancelledByOperatorId?: string | null;
}

export interface OpeningBalanceImportLine {
  id: string;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  batchId: string;
  rowNo: number;
  accountCode?: string | null;
  accountName?: string | null;
  accountPurpose?: string | null;
  balanceDirection?: string | null;
  debitAmount: number;
  creditAmount: number;
  currency: string;
  originalAmount?: number | null;
  exchangeRate?: number | null;
  dimensions: Record<string, string | number | boolean>;
  remark?: string | null;
  validationStatus: 'valid' | 'error';
  errorMessage?: string | null;
}

export interface OpeningBalanceImportDetail {
  batch: OpeningBalanceImportBatch;
  lines: OpeningBalanceImportLine[];
}

export interface OpeningBalanceImportFormValues {
  accountingBookCode: string;
  openingDate: string;
  file: UploadFile[];
}

export interface OpeningBalanceImportCapabilities {
  canManage: boolean;
  /** Fetches and downloads the workbook for the selected accounting book. */
  downloadTemplate: (accountingBookCode: string) => Promise<void>;
  importOpeningBalances: (
    params: { accountingBookCode: string; openingDate: string },
    file: File,
  ) => Promise<OpeningBalanceImportDetail>;
  notifyWarning: (message: string) => void;
  notifyError: (message: string) => void;
  notifySuccess: (message: string) => void;
}

export interface OpeningBalanceImportModalProps {
  onImported: (detail: OpeningBalanceImportDetail) => void;
  capabilities: OpeningBalanceImportCapabilities;
}
