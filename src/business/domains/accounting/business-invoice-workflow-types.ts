import type { ActionType } from '@ant-design/pro-components';
import type { Dayjs } from 'dayjs';
import type { MutableRefObject, ReactNode } from 'react';
import type { DocumentLineCustomFieldSchema } from '../documents/document-line-custom-field-types';
import type {
  BusinessInvoiceCategory,
  BusinessInvoiceMode,
  InvoiceCoverageResponse,
  InvoiceCoverageStatus,
  PurchaseInvoiceSourceType,
  SalesInvoiceSourceType,
} from './business-invoice-types';

export type BusinessInvoiceSourceType =
  | PurchaseInvoiceSourceType
  | SalesInvoiceSourceType;

export interface BusinessInvoiceAllocationRecord {
  sourceType?: BusinessInvoiceSourceType | string | null;
  sourceId?: string | null;
  sourceLineId?: string | null;
  sourceNo: string;
  settlementDocumentId?: string | null;
  allocatedQuantity: number;
  allocatedAmount: number | null;
}

export interface BusinessInvoiceWorkflowLineRecord {
  id: string;
  materialId?: string | null;
  itemCode?: string | null;
  itemName: string;
  unit?: string | null;
  quantity: number;
  unitPrice: number | null;
  amountWithoutTax: number | null;
  taxRate: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  customFieldSchemaVersion?: number | null;
  customValues?: Record<string, unknown>;
  allocations: BusinessInvoiceAllocationRecord[];
}

/** Host-normalized purchase or sales invoice used by edit and match workflows. */
export interface BusinessInvoiceWorkflowRecord {
  id: string;
  documentNo: string;
  invoiceNo?: string | null;
  category: BusinessInvoiceCategory;
  sourceMode: 'standard' | 'opening_unmatched' | 'pre_invoice';
  originalInvoiceId?: string | null;
  partnerId: string;
  invoiceDate: string;
  currency?: string | null;
  exchangeRate?: number | null;
  externalSystem?: string | null;
  externalDocumentId?: string | null;
  externalDocumentNo?: string | null;
  externalOriginalDocumentId?: string | null;
  importBatchNo?: string | null;
  remarks?: string | null;
  lines: BusinessInvoiceWorkflowLineRecord[];
}

export interface BusinessInvoiceLineAllocationInput {
  sourceId: string;
  sourceLineId: string;
  sourceNo: string;
  settlementDocumentId?: string;
  allocatedQuantity: number;
  allocatedAmount: number;
}

export interface BusinessInvoiceLineAllocationFormValue {
  sourceId: string;
  sourceLineId: string;
  sourceNo: string;
  settlementDocumentId?: string | null;
  allocatedQuantity: number;
  allocatedAmount: number | null;
}

export interface BusinessInvoiceLineFormValue {
  materialId?: string;
  itemCode?: string;
  itemName?: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number | null;
  amountWithoutTax?: number | null;
  taxRate?: number | null;
  taxAmount?: number | null;
  totalAmount?: number | null;
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
  allocations?: BusinessInvoiceLineAllocationFormValue[];
}

export interface BusinessInvoiceFormValues {
  documentNo?: string;
  invoiceNo?: string;
  category: BusinessInvoiceCategory;
  originalInvoiceId?: string;
  sourceType?: BusinessInvoiceSourceType;
  partnerId: string;
  invoiceDate: string | Dayjs;
  currency?: string;
  exchangeRate?: number;
  externalSystem?: string;
  externalDocumentId?: string;
  externalDocumentNo?: string;
  externalOriginalDocumentId?: string;
  importBatchNo?: string;
  remarks?: string;
  lines: BusinessInvoiceLineFormValue[];
}

export interface BusinessInvoicePartnerFieldProps {
  name: 'partnerId';
  mode: BusinessInvoiceMode;
  label: '供应商' | '客户';
  width: 'md';
  showSearch: true;
  debounceTime: 300;
  filterOption: false;
  searchPlaceholder?: string;
  disabled?: boolean;
  required: true;
  quickCreate: true;
}

export interface BusinessInvoiceUnitFieldProps {
  name: 'unit';
  label: '单位';
  width: 'xs';
  disabled: boolean;
  enabled: boolean;
  typeCode: 'material_unit';
  showSearch: true;
  optionFilterProp: 'label';
}

export interface BusinessInvoiceFormCapabilities {
  invoiceCategoryOptions: Array<{
    label: string;
    value: BusinessInvoiceCategory;
  }>;
  lineCustomFieldSchema?: DocumentLineCustomFieldSchema | null;
  renderPartnerField: (props: BusinessInvoicePartnerFieldProps) => ReactNode;
  renderUnitField: (props: BusinessInvoiceUnitFieldProps) => ReactNode;
}

export interface BusinessInvoiceLineFormListProps {
  objectType?: 'purchase_invoice_line' | 'sales_invoice_line';
  locked?: boolean;
  creatorText?: string;
  enabled?: boolean;
  lineCustomFieldSchema?: DocumentLineCustomFieldSchema | null;
  renderUnitField: BusinessInvoiceFormCapabilities['renderUnitField'];
}

export interface BusinessInvoiceEditDrawerProps {
  mode: BusinessInvoiceMode;
  record: BusinessInvoiceWorkflowRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish: (values: BusinessInvoiceFormValues) => Promise<boolean>;
  capabilities: BusinessInvoiceFormCapabilities;
}

export interface BusinessInvoiceOriginalInvoiceOption {
  id: string;
  documentNo: string;
  invoiceNo?: string | null;
  partnerName: string;
}

export interface BusinessInvoiceOriginalInvoiceDetailLine
  extends Omit<BusinessInvoiceLineFormValue, 'allocations'> {
  allocations: Array<{
    sourceId?: string | null;
    sourceLineId?: string | null;
    sourceNo: string;
    settlementDocumentId?: string | null;
    allocatedQuantity: number;
    allocatedAmount: number | null;
    sourceType?: BusinessInvoiceSourceType | null;
  }>;
}

export interface BusinessInvoiceOriginalInvoiceDetail {
  partnerId: string;
  currency?: string | null;
  exchangeRate?: number | null;
  lines: BusinessInvoiceOriginalInvoiceDetailLine[];
}

export interface BusinessInvoiceCreateCapabilities
  extends BusinessInvoiceFormCapabilities {
  listOriginalInvoices: (params: {
    mode: BusinessInvoiceMode;
    keyword?: string;
    partnerId?: string;
    status: 'confirmed';
    category: 'blue';
    page: 1;
    pageSize: 50;
  }) => Promise<BusinessInvoiceOriginalInvoiceOption[]>;
  getOriginalInvoiceDetail: (params: {
    mode: BusinessInvoiceMode;
    id: string;
  }) => Promise<BusinessInvoiceOriginalInvoiceDetail>;
}

export interface BusinessInvoiceCreateDrawerProps {
  mode: BusinessInvoiceMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish: (values: BusinessInvoiceFormValues) => Promise<boolean>;
  capabilities: BusinessInvoiceCreateCapabilities;
}

export interface InvoiceMatchSourceOption {
  id: string;
  documentNo: string;
  partnerName?: string | null;
}

export interface InvoiceMatchLineInput {
  invoiceLineId: string;
  allocations: BusinessInvoiceLineAllocationInput[];
}

export interface BusinessInvoiceMatchCapabilities {
  listSourceOptions: (params: {
    mode: BusinessInvoiceMode;
    keyword?: string;
    partnerId: string;
    page: 1;
    pageSize: 50;
    status: 'received' | 'delivered';
  }) => Promise<InvoiceMatchSourceOption[]>;
  requestCoverage: (params: {
    mode: BusinessInvoiceMode;
    sourceId: string;
    sourceType: 'purchase_receipt' | 'sale_delivery';
  }) => Promise<InvoiceCoverageResponse>;
  matchInvoice: (params: {
    id: string;
    mode: BusinessInvoiceMode;
    sourceType: 'purchase_receipt' | 'sale_delivery';
    lines: InvoiceMatchLineInput[];
  }) => Promise<void>;
  coverageStatusLabels: Readonly<
    Record<InvoiceCoverageStatus, { text: string; status: 'Default' | 'Warning' | 'Success' }>
  >;
  notifyError: (message: string) => void;
  notifySuccess: (message: string) => void;
}

export interface BusinessInvoiceMatchDrawerProps {
  mode: BusinessInvoiceMode;
  record: BusinessInvoiceWorkflowRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
  capabilities: BusinessInvoiceMatchCapabilities;
}

export interface BusinessInvoiceSourceCandidateLine {
  materialId?: string | null;
  itemName: string;
  itemCode?: string | null;
  unit?: string | null;
  quantity: number;
  unitPrice?: number | null;
  taxRate: number;
  amountWithoutTax?: number | null;
  taxAmount?: number | null;
  totalAmount?: number | null;
  sourceDocumentNo?: string;
}

export interface BusinessInvoiceSourceCandidate {
  id: string;
  documentNo: string;
  businessDate?: string | null;
  partnerId?: string | null;
  partnerName?: string | null;
  currency?: string | null;
  exchangeRate?: number | null;
  remainingAmount?: number | null;
  remainingLineCount: number;
  lines: BusinessInvoiceSourceCandidateLine[];
  billingStatus: 'pending' | 'completed' | 'blocked';
  blockingReasons: string[];
}

export interface InvoiceSourceCandidateTableCapabilities {
  requestCandidates: (params: {
    mode: BusinessInvoiceMode;
    page: number;
    pageSize: number;
    keyword?: string;
  }) => Promise<{ list: BusinessInvoiceSourceCandidate[]; total: number }>;
  formatNumber: (
    value: number | null | undefined,
    options?: Intl.NumberFormatOptions,
  ) => string;
  formatCurrencyAmount: (value: number | null | undefined) => string;
  formatUnitLabel: (unit: string | null | undefined) => string;
}

export interface InvoiceSourceCandidateTableProps {
  actionRef: MutableRefObject<ActionType | undefined>;
  canViewPrices: boolean;
  mode: BusinessInvoiceMode;
  onClearSelection: () => void;
  onSelectionChange: (
    ids: string[],
    sources: Record<string, BusinessInvoiceSourceCandidate>,
  ) => void;
  selectedIds: string[];
  capabilities: InvoiceSourceCandidateTableCapabilities;
}

export interface SourceInvoiceGroup {
  id: string;
  sourceIds: string[];
  invoiceNo?: string;
}

export interface SourceInvoiceGroupRow extends SourceInvoiceGroup {
  groupNo: number;
  partnerName: string;
  currency: string;
  exchangeRate: string;
  amount: number | null;
  lineCount: number;
  lines: BusinessInvoiceSourceCandidateLine[];
}

export interface InvoiceSourceBatchCapabilities {
  canViewPrices: boolean;
  candidateTable: InvoiceSourceCandidateTableCapabilities;
  previewBatchCreate: (params: {
    mode: BusinessInvoiceMode;
    ids: string[];
  }) => Promise<{ eligible: number; blocked: number; previewToken: string }>;
  batchCreate: (params: {
    mode: BusinessInvoiceMode;
    ids: string[];
    invoiceDate: string;
    groups: Array<{ sourceIds: string[]; invoiceNo?: string }>;
    previewToken: string;
    clientRequestId: string;
  }) => Promise<{ succeeded: number; failed: number }>;
  notifyWarning: (message: string) => void;
  notifyError: (message: string) => void;
  notifySuccess: (message: string) => void;
}

export interface InvoiceSourceBatchModalProps {
  mode: BusinessInvoiceMode;
  open: boolean;
  onCancel: () => void;
  onDone: () => void;
  capabilities: InvoiceSourceBatchCapabilities;
}

export type InvoiceDateValue = Dayjs | null;
