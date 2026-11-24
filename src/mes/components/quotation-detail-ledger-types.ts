import type { ActionType, ProColumns, ProFormInstance, ProTableProps } from '@ant-design/pro-components';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { ReactNode, RefObject } from 'react';
import type { DocumentDetailLedgerSavedViewController } from './DocumentDetailLedgerTable';
import type { DocumentViewBarView } from './DocumentViewBar';
import type { MesStatusEnum } from './StatusDisplay';
import type { ResizableTableConfig } from './ResizableTable';
import type { DocumentViewMode } from './DocumentViewSwitch';
import type { SalesDetailLedgerPrintParam } from './sales-detail-ledger-types';

export interface QuotationDetailLedgerMaterial {
  id?: string;
  code?: string | null;
  name?: string | null;
  spec?: string | null;
  unit?: string | null;
  thumbnailUrl?: string | null;
  primaryImageUrl?: string | null;
  [key: string]: unknown;
}

export interface QuotationDetailLedgerBinding {
  id?: string;
  quotationNo?: string | null;
  status?: string | null;
  quotationDate?: string | null;
  customer?: { id?: string; name?: string | null; [key: string]: unknown } | null;
  paymentTerms?: string | null;
  [key: string]: unknown;
}

export interface QuotationDetailLedgerQuotation extends QuotationDetailLedgerBinding {
  id: string;
}

export interface QuotationDetailLedgerRow {
  id: string; quotationId?: string; quotationNo?: string; status?: string;
  quotation?: QuotationDetailLedgerQuotation | null;
  material?: QuotationDetailLedgerMaterial | null;
  customerMaterialCode?: string; customerMaterialName?: string; customerMaterialSpec?: string;
  materialCode?: string; materialName?: string; materialSpec?: string; quantity?: number | string;
  unitPrice?: number | null; amount?: number | null; discountRate?: number | null;
  taxRate?: number | null; taxAmount?: number | null; totalAmount?: number | null;
  priceIncludesTax?: boolean | null; remarks?: string;
  quotationDate?: string | null; createdAt?: string | null; updatedAt?: string | null;
  [key: string]: unknown;
}
export interface QuotationDetailLedgerQuery extends Record<string, unknown> { orderBy?: string; orderDir?: 'ASC' | 'DESC'; }
export interface QuotationDetailLedgerSummary extends Record<string, number | null | undefined> {
  quotationCount?: number; itemCount?: number; totalQty?: number; amount?: number;
  discountAmount?: number; discountedAmount?: number; taxAmount?: number; totalAmount?: number;
}
export interface QuotationDetailLedgerResponse { list?: QuotationDetailLedgerRow[]; total?: number; summary: QuotationDetailLedgerSummary; priceVisible: boolean; }
export interface QuotationDetailLedgerProps {
  capabilities: {
    requestList(query: QuotationDetailLedgerQuery): Promise<QuotationDetailLedgerResponse>;
    exportExcel(query: QuotationDetailLedgerQuery): Promise<Blob>;
    customerFilterColumn: Partial<ProColumns<QuotationDetailLedgerRow>>;
    materialFilterColumn: Partial<ProColumns<QuotationDetailLedgerRow>>;
    dateRangePresets: NonNullable<RangePickerProps['presets']>;
    statusEnum: MesStatusEnum; unitLabelMap?: Readonly<Record<string, string>>;
    paymentTermsLabelMap?: Readonly<Record<string, string>>;
    materialCustomFieldColumns?: ProColumns<QuotationDetailLedgerRow>[];
    lineCustomFieldColumns?: ProColumns<QuotationDetailLedgerRow>[];
    format: { formatNumber(value: unknown): string; formatCurrency(value: unknown): string; formatDate(value?: string | null): string; formatDateTime(value?: string | null): string; formatUnit(value?: string | null): string; };
    maskAmount: (value: string | number) => string;
    onPriceVisibilityChange?: (visible: boolean) => void;
    canViewQuotation: boolean; canExport: boolean; canCreate: boolean;
    exportPermission: string; createPermission?: string; resizable: ResizableTableConfig;
    resizableForPriceVisibility?: (visible: boolean) => ResizableTableConfig;
    serverSortFields?: readonly string[]; savedViewController: DocumentDetailLedgerSavedViewController<DocumentViewBarView>;
    renderDocumentActions: (row: QuotationDetailLedgerRow, reload: () => void, handlers: { onBindMaterials: (quotation: QuotationDetailLedgerBinding) => void; onViewOrders: (id: string) => void }) => ReactNode;
    navigateToQuotation: (id: string) => void; navigateToOrders: (id: string) => void;
    onBindMaterials: (quotation: QuotationDetailLedgerBinding) => void;
    renderLifecycle: (reload: () => void) => ReactNode; amountDisplayToggle: ReactNode;
    renderMaterialThumbnail?: (row: QuotationDetailLedgerRow) => ReactNode;
    print: { canPrint: boolean; openPrintBatch: (requests: readonly SalesDetailLedgerPrintParam[]) => void };
    pagination?: ProTableProps<object, Record<string, unknown>>['pagination']; exportFileName?: string;
  };
  initialStatuses?: string[]; initialDateRange: [string, string]; onCreate?: () => void;
  onViewChange?: (view: DocumentViewMode) => void;
  tableActionRef?: RefObject<ActionType | null>; filterFormRef?: RefObject<ProFormInstance | undefined>;
}
