import type { ActionType, ProColumns, ProFormInstance, ProTableProps } from '@ant-design/pro-components';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { ReactNode, RefObject } from 'react';
import type { DocumentDetailLedgerSavedViewController } from './DocumentDetailLedgerTable';
import type { DocumentViewBarView } from './DocumentViewBar';
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
export interface PurchaseReceiptLedgerMaterial {
  id?: string;
  name?: string | null;
  code?: string | null;
  spec?: string | null;
  unit?: string | null;
  [key: string]: unknown;
}

export interface PurchaseReceiptLedgerPurchaseOrder {
  id: string;
  orderNo?: string | null;
  [key: string]: unknown;
}

export interface PurchaseReceiptDetailLedgerRow {
  id: string; ledgerRowId?: string; ledgerType?: string; receiptOrderId?: string; receiptNo?: string;
  returnLedgerRow?: PurchaseReceiptReturnRow; returnLedgerRows?: PurchaseReceiptReturnRow[];
  material?: PurchaseReceiptLedgerMaterial | null;
  purchaseOrderItem?: { id?: string; order?: PurchaseReceiptLedgerPurchaseOrder | null; [key: string]: unknown } | null;
  receiptOrder?: { id?: string; purchaseOrder?: PurchaseReceiptLedgerPurchaseOrder | null; [key: string]: unknown } | null;
  status?: string; receiptDate?: string; ledgerDate?: string; receiptQty?: number | string;
  quantity?: number | string; originalQty?: number | string; returnedQty?: number | string;
  reversedQty?: number | string; effectiveQty?: number | string; rejectedQty?: number | string;
  unitPrice?: number | null; amount?: number | null; effectiveAmount?: number | null; totalAmount?: number | null;
  taxAmount?: number | null; supplierName?: string; purchaseOrderNo?: string; warehouseName?: string;
  receiptUnit?: string | null; baseUnit?: string | null;
  batchNo?: string; supplierBatchNo?: string;
  location?: { pathName?: string | null; name?: string | null; [key: string]: unknown } | string | null;
  storageLocationSnapshot?: string; grade?: string; remarks?: string;
  createdAt?: string | null; updatedAt?: string | null;
  [key: string]: unknown;
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
    dateRangePresets: NonNullable<RangePickerProps['presets']>;
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
    serverSortFields?: readonly string[]; savedViewController: DocumentDetailLedgerSavedViewController<DocumentViewBarView>;
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
