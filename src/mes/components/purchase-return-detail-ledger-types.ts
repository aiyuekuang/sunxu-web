import type { ActionType, ProColumns, ProFormInstance, ProTableProps } from '@ant-design/pro-components';
import type { ReactNode, RefObject } from 'react';
import type { DocumentDetailLedgerSavedViewController } from './DocumentDetailLedgerTable';
import type { MesStatusEnum } from './StatusDisplay';
import type { ResizableTableConfig } from './ResizableTable';
import type { DocumentViewMode } from './DocumentViewSwitch';

export interface PurchaseReturnDetailLedgerRow extends Record<string, any> {
  id: string; returnOrderId?: string; returnNo?: string; status?: string;
  material?: Record<string, any>; returnQty?: number | string; outboundQty?: number | string;
  unitPrice?: number | null; totalAmount?: number | null; reasonCode?: string;
  reasonLabelSnapshot?: string; supplierName?: string; sourcePurchaseOrderNo?: string;
  sourceReceiptNo?: string; outboundWarehouseName?: string; returnDate?: string;
  outboundDate?: string; reversalDate?: string; financialAction?: string;
  orderCreatedAt?: string; orderUpdatedAt?: string; remarks?: string;
}
export interface PurchaseReturnDetailLedgerQuery extends Record<string, unknown> { orderBy?: string; orderDir?: 'ASC' | 'DESC'; }
export interface PurchaseReturnDetailLedgerSummary extends Record<string, number | null | undefined> {
  returnCount?: number; itemCount?: number; materialCount?: number; totalReturnQty?: number;
  totalOutboundQty?: number; pricedItemCount?: number; unpricedItemCount?: number;
  amount?: number; discountAmount?: number; discountedAmount?: number; taxAmount?: number;
  totalAmount?: number; pricedAmountTotal?: number;
}
export interface PurchaseReturnDetailLedgerResponse { list?: PurchaseReturnDetailLedgerRow[]; total?: number; summary: PurchaseReturnDetailLedgerSummary; priceVisible: boolean; }
export interface PurchaseReturnDetailLedgerFormat {
  formatNumber(value: unknown): string; formatCurrency(value: unknown): string;
  formatDate(value?: string | null): string; formatDateTime(value?: string | null): string;
  formatUnit(value?: string | null): string;
}
export interface PurchaseReturnDetailLedgerProps {
  capabilities: {
    requestList(query: PurchaseReturnDetailLedgerQuery): Promise<PurchaseReturnDetailLedgerResponse>;
    exportExcel(query: PurchaseReturnDetailLedgerQuery): Promise<Blob>;
    supplierFilterColumn: Partial<ProColumns<PurchaseReturnDetailLedgerRow>>;
    materialFilterColumn: Partial<ProColumns<PurchaseReturnDetailLedgerRow>>;
    dateRangePresets: readonly any[];
    statusEnum: MesStatusEnum; financialActionEnum: MesStatusEnum;
    unitLabelMap?: Readonly<Record<string, string>>;
    reasonLabelMap?: Readonly<Record<string, string>>;
    legacyReasonLabelMap?: Readonly<Record<string, string>>;
    materialCustomFieldColumns?: ProColumns<PurchaseReturnDetailLedgerRow>[];
    lineCustomFieldColumns?: ProColumns<PurchaseReturnDetailLedgerRow>[];
    format: PurchaseReturnDetailLedgerFormat;
    maskAmount?: (value: string | number) => string;
    canViewReturn: boolean; canExport: boolean; canCreate: boolean;
    exportPermission: string; createPermission?: string;
    resizable: ResizableTableConfig; serverSortFields?: readonly string[];
    savedViewController: DocumentDetailLedgerSavedViewController<any>;
    permission?: string;
    navigateToReturn: (id: string) => void;
    renderDocumentActions: (row: PurchaseReturnDetailLedgerRow, reload: () => void) => ReactNode;
    renderLifecycle: (reload: () => void) => ReactNode;
    pagination?: ProTableProps<object, Record<string, unknown>>['pagination'];
    exportFileName?: string;
  };
  onCreate?: () => void; onViewChange?: (view: DocumentViewMode) => void;
  tableActionRef?: RefObject<ActionType | null>; filterFormRef?: RefObject<ProFormInstance | undefined>;
}
