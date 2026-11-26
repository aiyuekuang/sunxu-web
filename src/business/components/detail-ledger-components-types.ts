import type {
  ActionType,
  ProColumns,
  ProFormInstance,
  ProTableProps,
} from '@ant-design/pro-components';
import type { ReactNode, RefObject } from 'react';
import type { DocumentDetailLedgerSavedViewController } from './DocumentDetailLedgerTable';
import type { DocumentViewBarView } from './DocumentViewBar';
import type { DocumentViewMode } from './DocumentViewSwitch';
import type { StatusMap } from '../../components/StatusDisplay';
import type { ResizableTableConfig } from './ResizableTable';

export interface DetailLedgerQueryBase {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
}

export interface DetailLedgerResponse<TRow, TSummary> {
  list?: TRow[];
  total?: number;
  summary: TSummary;
}

export interface DetailLedgerMaterial {
  id?: string;
  name?: string | null;
  code?: string | null;
  spec?: string | null;
  unit?: string | null;
  customValues?: Record<string, unknown> | null;
  customComputedValues?: Record<string, unknown> | null;
  customComputedErrors?: Record<string, unknown> | null;
}

export interface PurchaseInquiryDetailLedgerRow {
  id: string;
  inquiryId: string;
  purchaseUnit?: string | null;
  inquiryQty?: number | string | null;
  orderedQty?: number | string | null;
  material?: DetailLedgerMaterial | null;
  temporaryItemName?: string | null;
  temporaryItemCode?: string | null;
  temporaryItemSpec?: string | null;
  inquiry?: {
    inquiryNo?: string | null;
    status?: string | null;
    requisition?: { prNo?: string | null } | null;
  } | null;
  requiredDate?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  remarks?: string | null;
  [key: string]: unknown;
}

export interface PurchaseInquiryDetailLedgerQuery extends DetailLedgerQueryBase {
  keyword?: string;
  inquiryNo?: string;
  status?: string;
  statuses?: string[];
  supplierId?: string;
  materialId?: string;
  temporaryItemCode?: string;
  startDate?: string;
  endDate?: string;
}

export interface PurchaseInquiryDetailLedgerSummary {
  inquiryCount: number;
  itemCount: number;
  materialCount: number;
  inquiryQty: number | string;
  orderedQty: number | string;
}

export interface PurchaseRequisitionDetailLedgerRow {
  id: string;
  lineNo?: number | null;
  sortOrder?: number | null;
  requiredQty?: number | string | null;
  orderedQty?: number | string | null;
  remainingQty?: number | string | null;
  material?: DetailLedgerMaterial | null;
  supplier?: { name?: string | null } | null;
  suggestedPurchaseDate?: string | null;
  expectedArrivalDate?: string | null;
  remarks?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  requisition?: {
    id?: string;
    prNo?: string | null;
    status?: string | null;
    sourceType?: string | null;
    requestedBy?: { realName?: string | null; username?: string | null } | null;
    approvedBy?: { realName?: string | null; username?: string | null } | null;
  } | null;
  [key: string]: unknown;
}

export interface PurchaseRequisitionDetailLedgerQuery extends DetailLedgerQueryBase {
  keyword?: string;
  prNo?: string;
  status?: string;
  statuses?: string[];
  materialId?: string;
  supplierId?: string;
}

export interface PurchaseRequisitionDetailLedgerSummary {
  requisitionCount: number;
  itemCount: number;
  requiredQty: number | string;
  orderedQty: number | string;
  remainingQty: number | string;
  missingExpectedArrivalDateCount: number;
}

export interface InternalIssueDetailLedgerRow {
  id: string;
  orderId: string;
  qty?: number | string | null;
  material?: DetailLedgerMaterial | null;
  order?: {
    issueNo?: string | null;
    issueType?: string | null;
    status?: string | null;
    completedAt?: string | null;
    requester?: { realName?: string | null; username?: string | null } | null;
    department?: { name?: string | null } | null;
  } | null;
  warehouse?: { name?: string | null } | null;
  location?: { name?: string | null; pathName?: string | null } | null;
  storageLocationSnapshot?: string | null;
  batchNo?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  remarks?: string | null;
  [key: string]: unknown;
}

export interface InternalIssueDetailLedgerQuery extends DetailLedgerQueryBase {
  keyword?: string;
  issueNo?: string;
  issueType?: string;
  status?: string;
  statuses?: string[];
  requesterId?: string;
  departmentId?: string;
  equipmentId?: string;
  workOrderId?: string;
  materialId?: string;
  warehouseId?: string;
  batchNo?: string;
  startDate?: string;
  endDate?: string;
}

export interface InternalIssueDetailLedgerSummary {
  issueOrderCount: number;
  itemCount: number;
  materialCount: number;
  qty: number | string;
}

export interface ProductionReceiptDetailLedgerRow {
  id: string;
  receiptOrderId: string;
  qty?: number | string | null;
  displayQty?: number | string | null;
  displayUnit?: string | null;
  material?: DetailLedgerMaterial | null;
  receiptOrder?: {
    receiptNo?: string | null;
    status?: string | null;
    confirmedAt?: string | null;
    workOrder?: { orderNo?: string | null } | null;
    warehouse?: { name?: string | null } | null;
    storageLocationSnapshot?: string | null;
  } | null;
  location?: { name?: string | null; pathName?: string | null } | null;
  batchNo?: string | null;
  packageNo?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

export interface ProductionReceiptDetailLedgerQuery extends DetailLedgerQueryBase {
  keyword?: string;
  status?: string;
  statuses?: string[];
  workOrderId?: string;
  materialId?: string;
  warehouseId?: string;
  locationId?: string;
  batchNo?: string;
  packageNo?: string;
  startDate?: string;
  endDate?: string;
}

export interface ProductionReceiptDetailLedgerSummary {
  receiptOrderCount: number;
  itemCount: number;
  materialCount: number;
  receiptQty: number | string;
}

export interface DetailLedgerFormatCapabilities {
  formatNumber: (value: number | string | null | undefined) => string;
  formatQty: (value: number | string | null | undefined) => string;
  formatDate: (value: string | null | undefined) => string;
  formatDateTime: (value: string | null | undefined) => string;
  unitLabelMap: Readonly<Record<string, string>>;
  formatUnitLabel: (
    value: string | null | undefined,
    unitLabelMap: Readonly<Record<string, string>>,
  ) => string;
}

export type DetailLedgerFilterColumn<TRow extends object> = Partial<
  Pick<
    ProColumns<TRow>,
    'request' | 'params' | 'fieldProps' | 'valueEnum' | 'valueType'
  >
>;

export interface DetailLedgerTableCapabilities<
  TRow extends object,
  TQuery extends DetailLedgerQueryBase,
  TSummary,
> {
  requestList: (
    query: TQuery,
  ) => Promise<DetailLedgerResponse<TRow, TSummary>>;
  exportExcel: (query: TQuery) => Promise<Blob>;
  canExport: boolean;
  exportPermission: string;
  exportFileName: string | (() => string);
  resizable: ResizableTableConfig;
  serverSortFields: readonly string[];
  dateRangeFieldProps: ProColumns<TRow>['fieldProps'];
  format: DetailLedgerFormatCapabilities;
  onResponse?: (
    response: DetailLedgerResponse<TRow, TSummary>,
  ) => void;
}

export interface DetailLedgerBatchPrintCapabilities<TRow extends object> {
  rowSelection?: ProTableProps<TRow, Record<string, unknown>>['rowSelection'];
  tableAlertOptionRender?: ProTableProps<
    TRow,
    Record<string, unknown>
  >['tableAlertOptionRender'];
  printJobActionNode?: ReactNode;
}

export interface DetailLedgerViewProps {
  onViewChange?: (view: DocumentViewMode) => void;
  tableActionRef: RefObject<ActionType | null>;
  filterFormRef: RefObject<ProFormInstance | undefined>;
  savedViewController: DocumentDetailLedgerSavedViewController<DocumentViewBarView>;
}

export interface PurchaseInquiryDetailLedgerCapabilities
  extends DetailLedgerTableCapabilities<
    PurchaseInquiryDetailLedgerRow,
    PurchaseInquiryDetailLedgerQuery,
    PurchaseInquiryDetailLedgerSummary
  > {
  canViewInquiry: boolean;
  canCreate: boolean;
  createPermission: string;
  statusEnum: StatusMap;
  supplierFilterColumn: DetailLedgerFilterColumn<PurchaseInquiryDetailLedgerRow>;
  materialFilterColumn: DetailLedgerFilterColumn<PurchaseInquiryDetailLedgerRow>;
  lineCustomFieldColumns?: ProColumns<PurchaseInquiryDetailLedgerRow>[];
  materialCustomFieldColumns?: ProColumns<PurchaseInquiryDetailLedgerRow>[];
  batchPrint: DetailLedgerBatchPrintCapabilities<PurchaseInquiryDetailLedgerRow>;
}

export interface PurchaseInquiryDetailLedgerProps
  extends DetailLedgerViewProps {
  capabilities: PurchaseInquiryDetailLedgerCapabilities;
  onCreate?: () => void;
  onOpenInquiry: (inquiryId: string) => void;
}

export interface PurchaseRequisitionDetailLedgerCapabilities
  extends DetailLedgerTableCapabilities<
    PurchaseRequisitionDetailLedgerRow,
    PurchaseRequisitionDetailLedgerQuery,
    PurchaseRequisitionDetailLedgerSummary
  > {
  canViewRequisition: boolean;
  canCreate: boolean;
  createPermission: string;
  statusEnum: StatusMap;
  sourceTypeEnum: StatusMap;
  supplierFilterColumn: DetailLedgerFilterColumn<PurchaseRequisitionDetailLedgerRow>;
  materialFilterColumn: DetailLedgerFilterColumn<PurchaseRequisitionDetailLedgerRow>;
  materialCustomFieldColumns?: ProColumns<PurchaseRequisitionDetailLedgerRow>[];
  lineCustomFieldColumns?: ProColumns<PurchaseRequisitionDetailLedgerRow>[];
  /** Host renders the source row's permission-aware document action menu. */
  renderDocumentActions: (
    row: PurchaseRequisitionDetailLedgerRow,
    actions: { onViewPurchaseOrders: () => void },
  ) => ReactNode;
}

export interface PurchaseRequisitionDetailLedgerProps
  extends DetailLedgerViewProps {
  capabilities: PurchaseRequisitionDetailLedgerCapabilities;
  /** URL status values are normalized by the host before injection. */
  initialStatuses?: readonly string[];
  onCreate?: () => void;
  onOpenRequisition: (requisitionId: string) => void;
  onViewPurchaseOrders: (requisitionId: string) => void;
}

export interface InternalIssueDetailLedgerCapabilities
  extends DetailLedgerTableCapabilities<
    InternalIssueDetailLedgerRow,
    InternalIssueDetailLedgerQuery,
    InternalIssueDetailLedgerSummary
  > {
  canViewInternalIssue: boolean;
  canCreate: boolean;
  createPermission: string;
  issueStatusEnum: StatusMap;
  issueTypeEnum: StatusMap;
  requesterFilterColumn: DetailLedgerFilterColumn<InternalIssueDetailLedgerRow>;
  departmentFilterColumn: DetailLedgerFilterColumn<InternalIssueDetailLedgerRow>;
  equipmentFilterColumn: DetailLedgerFilterColumn<InternalIssueDetailLedgerRow>;
  workOrderFilterColumn: DetailLedgerFilterColumn<InternalIssueDetailLedgerRow>;
  materialFilterColumn: DetailLedgerFilterColumn<InternalIssueDetailLedgerRow>;
  warehouseFilterColumn: DetailLedgerFilterColumn<InternalIssueDetailLedgerRow>;
  lineCustomFieldColumns?: ProColumns<InternalIssueDetailLedgerRow>[];
  materialCustomFieldColumns?: ProColumns<InternalIssueDetailLedgerRow>[];
  batchPrint: DetailLedgerBatchPrintCapabilities<InternalIssueDetailLedgerRow>;
}

export interface InternalIssueDetailLedgerProps extends DetailLedgerViewProps {
  capabilities: InternalIssueDetailLedgerCapabilities;
  onOpenDetail: (id: string) => void;
  onCreate?: () => void;
}

export interface ProductionReceiptDetailLedgerCapabilities
  extends DetailLedgerTableCapabilities<
    ProductionReceiptDetailLedgerRow,
    ProductionReceiptDetailLedgerQuery,
    ProductionReceiptDetailLedgerSummary
  > {
  canViewProductionReceipt: boolean;
  statusEnum: StatusMap;
  materialFilterColumn: DetailLedgerFilterColumn<ProductionReceiptDetailLedgerRow>;
  warehouseFilterColumn: DetailLedgerFilterColumn<ProductionReceiptDetailLedgerRow>;
  locationFilterColumn: DetailLedgerFilterColumn<ProductionReceiptDetailLedgerRow>;
  lineCustomFieldColumns?: ProColumns<ProductionReceiptDetailLedgerRow>[];
  materialCustomFieldColumns?: ProColumns<ProductionReceiptDetailLedgerRow>[];
  batchPrint: DetailLedgerBatchPrintCapabilities<ProductionReceiptDetailLedgerRow>;
}

export interface ProductionReceiptDetailLedgerProps
  extends DetailLedgerViewProps {
  capabilities: ProductionReceiptDetailLedgerCapabilities;
  onOpenReceipt: (receiptNo: string) => void;
}
