import type { ReactNode, RefObject } from 'react';
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import type { Dayjs } from 'dayjs';
import type { DocumentDetailLedgerSavedViewController } from '../documents/DocumentDetailLedgerTable';
import type { DocumentViewBarView } from '../documents/DocumentViewBar';
import type { DocumentViewMode } from '../documents/DocumentViewSwitch';
import type { StatusMap } from '../../../components/StatusDisplay';
import type { ResizableTableConfig } from '../shared/ResizableTable';
import type {
  BusinessInvoiceCategory,
  BusinessInvoiceMode,
  BusinessInvoiceStatus,
} from './business-invoice-types';

export type BusinessInvoiceSourceMode =
  | 'standard'
  | 'opening_unmatched'
  | 'pre_invoice';
export type BusinessInvoiceMatchStatus =
  | 'not_applicable'
  | 'unmatched'
  | 'partial_matched'
  | 'matched';

export interface BusinessInvoiceDetailRow {
  id: string;
  createdAt: string;
  updatedAt: string;
  invoiceId: string;
  lineNo: number;
  materialId?: string | null;
  itemName: string;
  itemCode?: string | null;
  itemSpec?: string | null;
  unit?: string | null;
  quantity: number;
  documentNo: string;
  invoiceNo?: string | null;
  invoiceDate: string;
  status: BusinessInvoiceStatus;
  category: BusinessInvoiceCategory;
  sourceMode: BusinessInvoiceSourceMode;
  matchStatus: BusinessInvoiceMatchStatus;
  partnerName: string;
  externalDocumentNo?: string | null;
  unitPrice?: number | null;
  amountWithoutTax?: number | null;
  taxRate?: number | null;
  taxAmount?: number | null;
  totalAmount?: number | null;
  customFieldSchemaVersion?: number | null;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
}

export interface BusinessInvoiceDetailSummary {
  itemCount: number;
  invoiceCount: number;
  materialCount: number;
  quantity: number;
  amountWithoutTax?: number | null;
  taxAmount?: number | null;
  totalAmount?: number | null;
}

export interface BusinessInvoiceDetailListResponse {
  list: BusinessInvoiceDetailRow[];
  total: number;
  page: number;
  pageSize: number;
  summary: BusinessInvoiceDetailSummary;
  /** Server-side visibility for invoice prices. */
  priceVisible: boolean;
}

export interface BusinessInvoiceDetailQuery {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
  keyword?: string;
  status?: BusinessInvoiceStatus;
  statuses?: BusinessInvoiceStatus[];
  category?: BusinessInvoiceCategory;
  sourceMode?: BusinessInvoiceSourceMode;
  matchStatus?: BusinessInvoiceMatchStatus;
  startDate?: string;
  endDate?: string;
  materialId?: string;
  itemCode?: string;
  supplierId?: string;
  customerId?: string;
  exportColumns?: Array<{ dataIndex: string; title?: string }>;
}

export type BusinessInvoiceDetailView = DocumentViewBarView;

export interface BusinessInvoiceDateRangePreset {
  label: ReactNode;
  value:
    | [Dayjs | null | undefined, Dayjs | null | undefined]
    | (() => [Dayjs | null | undefined, Dayjs | null | undefined]);
}

export interface BusinessInvoiceDetailLedgerProps {
  mode: BusinessInvoiceMode;
  canViewInvoice: boolean;
  canViewPrices: boolean;
  statusEnum: StatusMap;
  categoryEnum: StatusMap;
  matchStatusEnum: StatusMap;
  dateRangePresets: readonly BusinessInvoiceDateRangePreset[];
  partnerSearchColumnProps: Partial<ProColumns<BusinessInvoiceDetailRow>>;
  materialSearchColumnProps: Partial<ProColumns<BusinessInvoiceDetailRow>>;
  customFieldColumns: readonly ProColumns<BusinessInvoiceDetailRow>[];
  listApi: (
    query: BusinessInvoiceDetailQuery,
  ) => Promise<BusinessInvoiceDetailListResponse>;
  exportApi: (query: BusinessInvoiceDetailQuery) => Promise<unknown>;
  formatNumber: (value: number | null | undefined) => string;
  formatCurrency: (value: number | null | undefined) => string;
  formatDate: (value: string | null | undefined) => string;
  formatDateTime: (value: string | null | undefined) => string;
  formatUnit: (unit?: string | null) => string;
  navigateInvoiceDetail: (path: string) => void;
  exportPermission: string;
  createPermission: string;
  resizable: ResizableTableConfig;
  serverSortFields: readonly string[];
  /**
   * Host's `useDetailLedgerSavedViews` result. Preserve the source resource
   * `detail-ledger.business-invoice-purchase` / `detail-ledger.business-invoice-sales`,
   * label `${采购发票|销售发票}明细`, filter keys for mode-specific partnerId,
   * status/statuses/category/matchStatus/materialId/itemCode/startDate/endDate,
   * and default `invoiceDate DESC` sort when building its controller.
   */
  savedView: {
    controller: DocumentDetailLedgerSavedViewController<BusinessInvoiceDetailView>;
    tableActionRef: RefObject<ActionType | null>;
    filterFormRef: RefObject<ProFormInstance | undefined>;
  };
  onViewChange?: (view: DocumentViewMode) => void;
  onCreate?: () => void;
}
