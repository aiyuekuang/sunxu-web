import type {
  ActionType,
  ProColumns,
  ProFormSelectProps,
  ProFormInstance,
  ProTableProps,
} from '@ant-design/pro-components';
import type { Dayjs } from 'dayjs';
import type { ComponentProps, ReactNode, MutableRefObject, RefObject } from 'react';
import type { QuickProFormDateRangePicker } from '../../../components/QuickDateRangePicker';
import type { DocumentDetailLedgerSavedViewController } from '../documents/DocumentDetailLedgerTable';
import type { DocumentViewBarView } from '../documents/DocumentViewBar';
import type { DocumentViewMode } from '../documents/DocumentViewSwitch';
import type { StatusMap } from '../../../components/StatusDisplay';
import type { ResizableTableConfig } from '../shared/ResizableTable';

export interface PurchaseOrderDetailLedgerQuery {
  [key: string]: unknown;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
  keyword?: string;
  orderNo?: string;
  status?: string;
  statuses?: string[];
  supplierId?: string;
  materialId?: string;
  startDate?: string;
  endDate?: string;
  overdueOnly?: boolean | 'true';
  onlyInTransit?: boolean;
  hideCompletedUndated?: boolean;
}

export interface PurchaseOrderDetailLedgerSavedFilters {
  orderNo?: string;
  statuses?: string[];
  supplierId?: string;
  materialId?: string;
  startDate?: string;
  endDate?: string;
  overdueOnly?: 'true';
  onlyInTransit?: 'true';
  hideCompletedUndated?: 'true' | 'false';
}

/** ProTable retains saved filter flags as string literals before request normalization. */
export interface PurchaseOrderDetailLedgerTableParams
  extends PurchaseOrderDetailLedgerSavedFilters {
  [key: string]: unknown;
  keyword?: string;
}

export interface PurchaseOrderDetailLedgerFilterFormValues {
  orderNo?: string;
  statuses?: string[];
  supplierId?: string;
  materialId?: string;
  deliveryDate?: [Dayjs, Dayjs];
  hideCompletedUndated?: boolean;
}

export interface PurchaseOrderDetailLedgerMaterial {
  id?: string;
  name?: string | null;
  code?: string | null;
  spec?: string | null;
  unit?: string | null;
  customValues?: Record<string, unknown> | null;
  customComputedValues?: Record<string, unknown> | null;
  customComputedErrors?: Record<string, unknown> | null;
}

export interface PurchaseOrderIncomingInspectionStatusCount {
  status: string;
  count: number;
}

export interface PurchaseOrderIncomingInspection {
  inspectionCount: number;
  unreportedReceiptCount: number;
  inspectionStatusCounts: PurchaseOrderIncomingInspectionStatusCount[];
  status?: string | null;
  inspectionId?: string | null;
}

export interface PurchaseOrderDetailLedgerRow {
  id: string;
  purchaseOrderId: string;
  orderNo?: string | null;
  status?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  materialId?: string | null;
  material?: PurchaseOrderDetailLedgerMaterial | null;
  orderedQty?: number | string | null;
  receivedQty?: number | string | null;
  outstandingQty?: number | string | null;
  purchaseQty?: number | string | null;
  purchaseUnit?: string | null;
  baseUnit?: string | null;
  purchaseOutstandingQty?: number | string | null;
  deliveryDate?: string | null;
  expectedDate?: string | null;
  effectiveDeliveryDate?: string | null;
  purchasingRep?: { realName?: string | null; username?: string | null } | null;
  remarks?: string | null;
  orderCreatedAt?: string | null;
  orderUpdatedAt?: string | null;
  availableActions?: string[];
  incomingInspection?: PurchaseOrderIncomingInspection | null;
  [key: string]: unknown;
}

export interface PurchaseOrderDetailLedgerSummary {
  lineCount: number;
  materialCount: number;
  orderedQty: number | string;
  receivedQty: number | string;
  outstandingQty: number | string;
  amount?: number | string | null;
  discountAmount?: number | string | null;
  discountedAmount?: number | string | null;
  taxAmount?: number | string | null;
  totalAmount?: number | string | null;
}

export interface PurchaseOrderDetailLedgerResponse {
  list?: PurchaseOrderDetailLedgerRow[];
  total?: number;
  page?: number;
  pageSize?: number;
  summary: PurchaseOrderDetailLedgerSummary;
  priceVisible: boolean;
}

export interface PurchaseOrderDetailLedgerFormatCapabilities {
  formatNumber: (value: number | string | null | undefined) => string;
  formatCurrency: (value: number | string | null | undefined) => string;
  formatDate: (value: string | null | undefined) => string;
  formatDateTime: (value: string | null | undefined) => string;
  unitLabelMap: Readonly<Record<string, string>>;
  formatUnitLabel: (
    value: string | null | undefined,
    unitLabelMap: Readonly<Record<string, string>>,
  ) => string;
}

export type PurchaseOrderDetailLedgerFilterColumn = Partial<
  Pick<
    ProColumns<PurchaseOrderDetailLedgerRow>,
    'request' | 'params' | 'valueEnum' | 'valueType'
  >
> & {
  fieldProps?: ProFormSelectProps['fieldProps'];
};

export interface PurchaseOrderDetailLedgerDocumentActions {
  canViewOrder: boolean;
  canReceiveRow: boolean;
  onOpenOrder: () => void;
  onViewReceipts: () => void;
  onReceive: () => void;
}

export interface PurchaseOrderDetailLedgerReceiptActionProps {
  sourceItemIds: string[] | null;
  onClose: () => void;
  onSuccess: () => void;
  onPrintReceipt?: (receiptId: string) => void;
}

export interface PurchaseOrderDetailLedgerCapabilities {
  requestList: (
    query: PurchaseOrderDetailLedgerQuery,
  ) => Promise<PurchaseOrderDetailLedgerResponse>;
  exportExcel: (query: PurchaseOrderDetailLedgerQuery) => Promise<Blob>;
  canExport: boolean;
  exportPermission: string;
  exportFileName: string | (() => string);
  canCreate: boolean;
  createPermission: string;
  canViewOrder: boolean;
  canViewInspectionDetail: boolean;
  canListInspections: boolean;
  canReceive: boolean;
  receivePermission: string;
  canPrintPurchaseReceipt: boolean;
  onPrintReceipt?: (receiptId: string) => void;
  renderExportAction: (props: {
    getCurrentQuery: () => PurchaseOrderDetailLedgerQuery;
    exportExcel: (
      query: PurchaseOrderDetailLedgerQuery,
    ) => Promise<Blob>;
    fileName: string | (() => string);
    permission: string;
  }) => ReactNode;
  orderStatusEnum: StatusMap;
  inspectionStatusEnum: StatusMap;
  inspectionTrackingEnum: StatusMap;
  format: PurchaseOrderDetailLedgerFormatCapabilities;
  supplierFilterColumn: PurchaseOrderDetailLedgerFilterColumn;
  materialFilterColumn: PurchaseOrderDetailLedgerFilterColumn;
  dateRangeFieldProps: ComponentProps<typeof QuickProFormDateRangePicker>['fieldProps'];
  lineCustomFieldColumns?: ProColumns<PurchaseOrderDetailLedgerRow>[];
  materialCustomFieldColumns?: ProColumns<PurchaseOrderDetailLedgerRow>[];
  resizable: ResizableTableConfig;
  serverSortFields: readonly string[];
  getReceiptSelectionBlockReason: (
    row: PurchaseOrderDetailLedgerRow,
    selectedSupplierId?: string,
  ) => string | undefined;
  renderDocumentActions: (
    row: PurchaseOrderDetailLedgerRow,
    actions: PurchaseOrderDetailLedgerDocumentActions,
  ) => ReactNode;
  renderPurchaseReceiptAction: (
    props: PurchaseOrderDetailLedgerReceiptActionProps,
  ) => ReactNode;
  printJobActionNode?: ReactNode;
  initialFilters?: PurchaseOrderDetailLedgerSavedFilters;
  onResponse?: (response: PurchaseOrderDetailLedgerResponse) => void;
}

export interface PurchaseOrderDetailLedgerProps {
  capabilities: PurchaseOrderDetailLedgerCapabilities;
  savedViewController: DocumentDetailLedgerSavedViewController<DocumentViewBarView> & {
    captureFilters: (filters: PurchaseOrderDetailLedgerSavedFilters) => void;
  };
  tableActionRef: RefObject<ActionType | null>;
  filterFormRef: MutableRefObject<ProFormInstance | undefined>;
  initialOnlyInTransit?: boolean;
  onViewChange?: (view: DocumentViewMode) => void;
  onCreate?: () => void;
  onOpenOrder: (purchaseOrderId: string) => void;
  onViewReceipts: (purchaseOrderId: string) => void;
  onOpenInspection: (inspectionId: string) => void;
  onListInspections: (purchaseOrderItemId: string) => void;
}

export type PurchaseOrderDetailLedgerRowSelection = NonNullable<
  ProTableProps<
    PurchaseOrderDetailLedgerRow,
    PurchaseOrderDetailLedgerTableParams
  >['rowSelection']
>;
