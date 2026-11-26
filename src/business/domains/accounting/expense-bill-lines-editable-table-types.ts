import type { DocumentLineCustomFieldSchema } from '../documents/document-line-custom-field-types';

export type ExpenseBillSourceType = 'purchase_receipt' | 'purchase_order';

export interface ExpenseBillLineDraft {
  _key: string;
  id?: string;
  categoryId?: string;
  amount?: number;
  description?: string;
  /** Kept on edit even though this table has no remark editor. */
  remark?: string;
  sourceType?: ExpenseBillSourceType;
  sourceId?: string;
  sourceNo?: string;
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ExpenseBillLineDetail {
  id: string;
  categoryId?: string | null;
  amount: number | string;
  description?: string | null;
  remark?: string | null;
  sourceType?: ExpenseBillSourceType | null;
  sourceId?: string | null;
  sourceNo?: string | null;
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
}

export interface ExpenseBillLinePayload {
  id?: string;
  categoryId: string;
  amount: number;
  description?: string;
  remark?: string;
  sourceType?: ExpenseBillSourceType;
  sourceId?: string;
  sourceNo?: string;
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
}

export interface ExpenseCategoryOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface ExpenseReceiptOption {
  label: string;
  value: string;
  /** Pure receipt number snapshot, kept separately from the display label. */
  receiptNo?: string;
  disabled?: boolean;
}

export interface ExpenseBillCustomFieldDefinition {
  fieldKey: string;
  label: string;
  fieldKind: string;
  dataType: string;
  requiredPolicy?: string | null;
  isActive?: boolean;
  sortOrder?: number | null;
  displayJson?: unknown;
  optionsJson?: unknown;
}

export interface ExpenseBillLineCustomFieldSchema
  extends DocumentLineCustomFieldSchema {
  systemFields?: Array<{ key: string; label?: string; dataType?: string }>;
  fields?: ExpenseBillCustomFieldDefinition[];
}

export interface ExpenseBillRuntimePreviewRequest {
  objectType: 'expense_bill_line';
  customFieldSchemaVersion: number;
  items: Array<Record<string, unknown>>;
}

export interface ExpenseBillRuntimePreviewRow {
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
}

export interface ExpenseBillLinesEditableTableCapabilities {
  /** host performs the receipt request and returns already mapped options. */
  searchReceipt?: (keyword: string) => Promise<ExpenseReceiptOption[]>;
  /** host performs runtime formula preview and owns API errors/notifications. */
  previewRuntimeValues: (
    request: ExpenseBillRuntimePreviewRequest,
  ) => Promise<{ items: ExpenseBillRuntimePreviewRow[] }>;
  notifyError: (message: string) => void;
}

export interface ExpenseBillLinesEditableTableProps {
  rows: ExpenseBillLineDraft[];
  onRowsChange: (rows: ExpenseBillLineDraft[]) => void;
  categoryOptions: ExpenseCategoryOption[];
  /** Preloaded recent receipts used before and after a remote search. */
  receiptOptions?: ExpenseReceiptOption[];
  lineCustomFieldSchema?: ExpenseBillLineCustomFieldSchema | null;
  minRows?: number;
  capabilities: ExpenseBillLinesEditableTableCapabilities;
}
