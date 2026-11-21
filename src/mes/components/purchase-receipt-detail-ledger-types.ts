import type { ActionType, ProColumns, ProFormInstance, ProTableProps } from '@ant-design/pro-components';
import type { ReactNode, RefObject } from 'react';
import type { DocumentDetailLedgerSavedViewController } from './DocumentDetailLedgerTable';
import type { MesStatusEnum } from './StatusDisplay';
import type { ResizableTableConfig } from './ResizableTable';
import type { DocumentViewMode } from './DocumentViewSwitch';
import type { SalesDetailLedgerPrintParam } from './sales-detail-ledger-types';

export interface PurchaseReceiptReturnRow {
  ledgerRowId: string;
  ledgerType: string;
  sourceReceiptItemId?: string;
  returnOrderId: string;
  returnNo: string;
  returnStatus?: string | null;
  returnDate?: string | null;
  returnQty: number;
  returnAmount?: number | null;
  ledgerQty: number;
  ledgerAmount?: number | null;
}
export interface PurchaseReceiptDetailLedgerRow extends Record<string, any> {
  id: string; ledgerRowId?: string; ledgerType?: string; receiptOrderId?: string; receiptNo?: string;
  returnLedgerRow?: PurchaseReceiptReturnRow; returnLedgerRows?: PurchaseReceiptReturnRow[];
  material?: Record<string, any>; purchaseOrderItem?: Record<string, any>; receiptOrder?: Record<string, any>;
  status?: string; receiptDate?: string; ledgerDate?: string; receiptQty?: number | string;
  quantity?: number | string; originalQty?: number | string; returnedQty?: number | string;
  reversedQty?: number | string; effectiveQty?: number | string; rejectedQty?: number | string;
  unitPrice?: number | null; amount?: number | null; effectiveAmount?: number | null; totalAmount?: number | null;
  taxAmount?: number | null; supplierName?: string; purchaseOrderNo?: string; warehouseName?: string;
  batchNo?: string; supplierBatchNo?: string; location?: Record<string, any> | string;
  storageLocationSnapshot?: string; grade?: string; remarks?: string;
}
export interface PurchaseReceiptDetailLedgerQuery extends Record<string, unknown> { orderBy?: string; orderDir?: 'ASC' | 'DESC'; }
export interface PurchaseReceiptDetailLedgerSummary extends Record<string, number | null | undefined> {
  receiptCount?: number; itemCount?: number; originalQty?: number; totalQty?: number; returnedQty?: number;
  reversedQty?: number; effectiveQty?: number; pricedItemCount?: number; unpricedItemCount?: number;
  amount?: number; discountAmount?: number; discountedAmount?: number; taxAmount?: number; totalAmount?: number;
  originalAmount?: number; effectiveAmount?: number;
}
export interface PurchaseReceiptDetailLedgerResponse { list?: PurchaseReceiptDetailLedgerRow[]; total?: number; summary: PurchaseReceiptDetailLedgerSummary; priceVisible: boolean; }
export interface PurchaseReceiptDetailLedgerProps {
  capabilities: {
    requestList(query: PurchaseReceiptDetailLedgerQuery): Promise<PurchaseReceiptDetailLedgerResponse>;
    exportExcel(query: PurchaseReceiptDetailLedgerQuery): Promise<Blob>;
    supplierFilterColumn: Partial<ProColumns<PurchaseReceiptDetailLedgerRow>>;
    materialFilterColumn: Partial<ProColumns<PurchaseReceiptDetailLedgerRow>>;
    purchaseOrderFilterColumn: Partial<ProColumns<PurchaseReceiptDetailLedgerRow>>;
    warehouseFilterColumn: Partial<ProColumns<PurchaseReceiptDetailLedgerRow>>;
    dateRangePresets: readonly any[];
    statusEnum: MesStatusEnum; returnStatusEnum: MesStatusEnum; ledgerTypeEnum: MesStatusEnum; qualityGateEnum?: MesStatusEnum;
    unitLabelMap?: Readonly<Record<string, string>>;
    materialCustomFieldColumns?: ProColumns<PurchaseReceiptDetailLedgerRow>[];
    lineCustomFieldColumns?: ProColumns<PurchaseReceiptDetailLedgerRow>[];
    format: { formatNumber(value: unknown): string; formatCurrency(value: unknown): string; formatDate(value?: string | null): string; formatDateTime(value?: string | null): string; formatSignedNumber(value: unknown): string; formatUnit(value?: string | null): string; };
    maskAmount: (value: string | number) => string; onPriceVisibilityChange?: (visible: boolean) => void; canViewReceipt: boolean; canViewOrder: boolean;
    canViewReturn: boolean; canViewInspection: boolean; canExport: boolean; canCreate: boolean;
    navigateToReceipt: (id: string) => void; navigateToPurchaseOrder: (id: string) => void; navigateToReturn: (id: string) => void;
    exportPermission: string; createPermission?: string; resizable: ResizableTableConfig;
    resizableForPriceVisibility?: (visible: boolean) => ResizableTableConfig;
    serverSortFields?: readonly string[]; savedViewController: DocumentDetailLedgerSavedViewController<any>;
    renderQualityGate: (row: PurchaseReceiptDetailLedgerRow) => ReactNode;
    renderDocumentActions: (row: PurchaseReceiptDetailLedgerRow, reload: () => void, context: { onEditReceipt: (id: string) => void; canCreateLandedCost: boolean; canViewInspection: boolean; getPrintParams: (row: PurchaseReceiptDetailLedgerRow) => { businessType: string; businessId: string } | null }) => ReactNode;
    canCreateLandedCost: boolean; onKeywordSearch: (value: string) => void;
    onClearSourceItemFilter: () => void; amountDisplayToggle: ReactNode;
    printParams?: (row: PurchaseReceiptDetailLedgerRow) => { businessType: string; businessId: string } | null;
    renderLifecycle: (reload: () => void) => ReactNode;
    print: { canPrint: boolean; openPrintBatch: (requests: readonly SalesDetailLedgerPrintParam[]) => void };
    batchPrintActionNode: ReactNode;
    pagination?: ProTableProps<object, Record<string, unknown>>['pagination']; exportFileName?: string;
    initialPurchaseOrderId?: string; initialPurchaseOrderItemId?: string;
  };
  initialDateRange: [string, string]; onCreate?: () => void; onEdit?: (receiptId: string) => void;
  onViewChange?: (view: DocumentViewMode) => void;
  tableActionRef?: RefObject<ActionType | null>; filterFormRef?: RefObject<ProFormInstance | undefined>;
}
