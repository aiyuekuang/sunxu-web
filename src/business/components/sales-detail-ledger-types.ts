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
import type { DocumentLineCustomFieldSchema } from './document-line-custom-field-types';
import type { MesCustomFieldDefinition } from './custom-field-form-types';
import type { StatusMap } from '../../components/StatusDisplay';
import type {
  SaleDeliveryDocumentActionsCapabilities,
} from './sale-delivery-document-actions-dropdown-types';
import type {
  SaleDeliveryItemsPanelCapabilities,
  SaleDeliveryDetailRecord,
} from './sales-delivery-components-types';
import type {
  SaleReturnDetail,
  SaleReturnEditCapabilities,
  SaleReturnReceiveCapabilities,
  SaleReturnStockConversionCapabilities,
} from './sale-return-components-types';
import type { ResizableTableConfig } from './ResizableTable';

export interface SalesDetailLedgerMaterial {
  id?: string;
  name?: string | null;
  code?: string | null;
  spec?: string | null;
  unit?: string | null;
  thumbnailUrl?: string | null;
  primaryImageUrl?: string | null;
  hasBatchTracking?: boolean | null;
  customValues?: Record<string, unknown> | null;
  customComputedValues?: Record<string, unknown> | null;
  customComputedErrors?: Record<string, unknown> | null;
}

export interface SalesDetailLedgerCustomer {
  id?: string;
  name?: string | null;
}

export interface SaleOrderLedgerDocument {
  id: string;
  orderNo: string;
  status: string;
  availableActions?: string[];
  customer?: SalesDetailLedgerCustomer | null;
  partnerNameSnapshot?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

export interface SaleDeliveryLedgerDocument {
  id: string;
  deliveryNo: string;
  status: string;
  availableActions?: string[];
  saleOrder?: SaleOrderLedgerDocument | null;
  customer?: SalesDetailLedgerCustomer | null;
  partnerNameSnapshot?: string | null;
  warehouse?: { name?: string | null } | null;
}

export interface SaleReturnLedgerDocument extends SaleReturnDetail {
  reasonLabelSnapshot?: string | null;
  customer?: SalesDetailLedgerCustomer | null;
  partnerNameSnapshot?: string | null;
  sourceSaleOrder?: SaleOrderLedgerDocument | null;
  sourceDelivery?: SaleDeliveryLedgerDocument | null;
  sourceDeliveryId?: string | null;
  receiveDate?: string | null;
  availableActions?: string[];
  items?: SaleReturnDetail['items'];
  [key: string]: unknown;
}

export interface SaleDeliveryDetailLedgerRow {
  id: string;
  material?: SalesDetailLedgerMaterial | null;
  deliveryOrder?: SaleDeliveryLedgerDocument | null;
  customValues?: Record<string, unknown> | null;
  customComputedValues?: Record<string, unknown> | null;
  customComputedErrors?: Record<string, unknown> | null;
  ledgerDate?: string | null;
  originalQty?: number | string | null;
  reversedQty?: number | string | null;
  batchNo?: string | null;
  storageLocationSnapshot?: string | null;
  location?: { pathName?: string | null } | null;
  ledgerAmount?: number | null;
  unitPrice?: number | null;
  amount?: number | null;
  discountRate?: number | null;
  discountAmount?: number | null;
  discountedAmount?: number | null;
  taxRate?: number | null;
  taxAmount?: number | null;
  totalAmount?: number | null;
  priceIncludesTax?: boolean | null;
  priceSnapshot?: unknown;
  originalAmount?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  remarks?: string | null;
  [key: string]: unknown;
}

export interface SaleOrderDetailLedgerRow {
  id: string;
  order?: SaleOrderLedgerDocument | null;
  material?: SalesDetailLedgerMaterial | null;
  customValues?: Record<string, unknown> | null;
  customComputedValues?: Record<string, unknown> | null;
  customComputedErrors?: Record<string, unknown> | null;
  lineNo?: number | string | null;
  quantity?: number | string | null;
  shippedQty?: number | string | null;
  remainingQty?: number | string | null;
  returnedQty?: number | string | null;
  unitPrice?: number | null;
  amount?: number | null;
  discountRate?: number | null;
  discountAmount?: number | null;
  discountedAmount?: number | null;
  taxRate?: number | null;
  taxAmount?: number | null;
  totalAmount?: number | null;
  effectiveDeliveryDate?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  remarks?: string | null;
  [key: string]: unknown;
}

export interface SaleReturnDetailLedgerRow {
  id: string;
  returnOrderId: string;
  returnOrder?: SaleReturnLedgerDocument | null;
  material?: SalesDetailLedgerMaterial | null;
  customValues?: Record<string, unknown> | null;
  customComputedValues?: Record<string, unknown> | null;
  customComputedErrors?: Record<string, unknown> | null;
  returnQty?: number | string | null;
  receivedQty?: number | string | null;
  acceptedQty?: number | string | null;
  rejectedQty?: number | string | null;
  netRefundAmount?: number | null;
  reasonCode?: string | null;
  returnType?: string | null;
  status?: string | null;
  receiveDate?: string | null;
  batchNo?: string | null;
  storageLocationSnapshot?: string | null;
  location?: { pathName?: string | null } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  remarks?: string | null;
  [key: string]: unknown;
}

export interface SaleDeliveryDetailLedgerSummary {
  deliveryOrderCount: number;
  itemCount: number;
  originalQty: number | string;
  reversedQty: number | string;
  amount?: number | null;
  discountAmount?: number | null;
  discountedAmount?: number | null;
  taxAmount?: number | null;
  totalAmount?: number | null;
  customFieldSummaries?: readonly {
    fieldKey: string;
    label: string;
    value: number | null;
  }[];
}

export interface SaleOrderDetailLedgerSummary {
  orderCount: number;
  itemCount: number;
  totalQty: number | string;
  shippedQty: number | string;
  amount?: number | null;
  discountAmount?: number | null;
  discountedAmount?: number | null;
  taxAmount?: number | null;
  totalAmount?: number | null;
  customFieldSummaries?: readonly {
    fieldKey: string;
    label: string;
    mode?: 'sum' | 'avg' | 'min' | 'max' | 'count_non_empty' | string;
    value: number | null;
  }[];
}

export interface SaleReturnDetailLedgerSummary {
  returnOrderCount: number;
  itemCount: number;
  totalReturnQty: number | string;
  totalReceivedQty: number | string;
  totalAcceptedQty: number | string;
  totalRejectedQty: number | string;
  amount?: number | null;
  discountAmount?: number | null;
  discountedAmount?: number | null;
  taxAmount?: number | null;
  totalAmount?: number | null;
  netRefundAmount?: number | null;
}

export interface SalesDetailLedgerResponse<TRow, TSummary> {
  list?: TRow[];
  total?: number;
  priceVisible: boolean;
  summary: TSummary;
}

export interface SalesDetailLedgerQueryBase {
  /** Pagination fields are added by DocumentDetailLedgerTable before host requests. */
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
}

export interface SaleDeliveryDetailLedgerQuery extends SalesDetailLedgerQueryBase {
  keyword?: string;
  deliveryNo?: string;
  saleOrderNo?: string;
  status?: string;
  statuses?: string[];
  customerId?: string;
  materialId?: string;
  warehouseId?: string;
  batchNo?: string;
  startDate?: string;
  endDate?: string;
}

export interface SaleOrderDetailLedgerQuery extends SalesDetailLedgerQueryBase {
  keyword?: string;
  status?: string;
  statuses?: string[];
  customerId?: string;
  materialId?: string;
  startDate?: string;
  endDate?: string;
  effectiveDeliveryStartDate?: string;
  effectiveDeliveryEndDate?: string;
}

export interface SaleReturnDetailLedgerQuery extends SalesDetailLedgerQueryBase {
  keyword?: string;
  status?: string;
  statuses?: string[];
  returnType?: string;
  customerId?: string;
  materialId?: string;
  startDate?: string;
  endDate?: string;
}

export type SalesDetailLedgerFilterColumns<T extends object> = Partial<
  Record<'customer' | 'material' | 'warehouse', Partial<ProColumns<T>>>
>;

export interface SalesDetailLedgerFormatCapabilities {
  formatCurrency: (value: number | string | null | undefined) => string;
  formatNumber: (value: number | string | null | undefined) => string;
  formatDate: (value: string | null | undefined) => string;
  formatUnitLabel: (
    value: string | null | undefined,
    unitLabelMap: Readonly<Record<string, string>>,
  ) => string;
  unitLabelMap: Readonly<Record<string, string>>;
  maskAmount: (
    value: string | number | null | undefined,
    priceAllowed: boolean,
  ) => string;
  renderAmountVisibilityToggle: (priceAllowed: boolean) => ReactNode;
}

export interface SalesDetailLedgerBaseProps {
  onCreate?: () => void;
  onViewChange?: (view: DocumentViewMode) => void;
  showHeaderTitle?: boolean;
  tableActionRef?: RefObject<ActionType | null>;
  filterFormRef?: RefObject<ProFormInstance | undefined>;
  savedViewController?: DocumentDetailLedgerSavedViewController<DocumentViewBarView>;
}

export interface SalesDetailLedgerBaseCapabilities<
  TRow extends object,
  TQuery extends { orderBy?: string; orderDir?: 'ASC' | 'DESC' },
  TResponse extends { list?: TRow[]; total?: number },
> extends SalesDetailLedgerFormatCapabilities {
  requestList: (query: TQuery) => Promise<TResponse>;
  exportExcel: (query: TQuery) => Promise<Blob>;
  canCreate: boolean;
  canExport: boolean;
  createPermission: string;
  exportPermission: string;
  exportFileNamePrefix: string;
  resizable: ResizableTableConfig;
  serverSortFields: readonly string[];
  statusEnum: StatusMap;
  filterColumns?: SalesDetailLedgerFilterColumns<TRow>;
  materialCustomFields: MesCustomFieldDefinition[];
  lineCustomFieldSchema?: DocumentLineCustomFieldSchema | null;
}

export interface SaleDeliveryDetailLedgerCapabilities
  extends SalesDetailLedgerBaseCapabilities<
    SaleDeliveryDetailLedgerRow,
    SaleDeliveryDetailLedgerQuery,
    SalesDetailLedgerResponse<
      SaleDeliveryDetailLedgerRow,
      SaleDeliveryDetailLedgerSummary
    >
  > {
  permissions: { canViewDelivery: boolean; canViewSaleOrder: boolean };
  navigateToDelivery: (deliveryId: string) => void;
  navigateToDeliveryEditor: (deliveryId: string) => void;
  navigateToSaleOrder: (saleOrderId: string) => void;
  documentActions: SaleDeliveryDocumentActionsCapabilities;
}

export interface SaleOrderDetailLedgerCapabilities
  extends SalesDetailLedgerBaseCapabilities<
    SaleOrderDetailLedgerRow,
    SaleOrderDetailLedgerQuery,
    SalesDetailLedgerResponse<
      SaleOrderDetailLedgerRow,
      SaleOrderDetailLedgerSummary
    >
  > {
  permissions: {
    canViewOrder: boolean;
    canCreateDelivery: boolean;
    canViewDelivery: boolean;
    canCreateProcurementDemand: boolean;
    canCreateProductionPlan: boolean;
    canCreateWorkOrder: boolean;
    canCopy: boolean;
    canPrint: boolean;
    canPrintRecords: boolean;
    canCancel: boolean;
    canCloseRemaining: boolean;
    canUpdate: boolean;
    canConfirm: boolean;
  };
  permissionCodes: Record<
    | 'update'
    | 'confirm'
    | 'createDelivery'
    | 'viewDelivery'
    | 'procurementDemand'
    | 'convertToProductionPlan'
    | 'convertToWorkOrder'
    | 'viewProductionPlans'
    | 'copy'
    | 'print'
    | 'printRecords'
    | 'cancel'
    | 'closeRemaining',
    string
  >;
  navigateToOrder: (orderId: string) => void;
  getOrderPath: (orderId: string) => string;
  loadOrderDetail: (orderId: string) => Promise<SaleOrderLedgerDocument | null>;
  navigateToDeliveryLedger: (orderId: string) => void;
  navigateToProcurementDemand: (orderId: string) => void;
  navigateToProductionPlans: (orderId: string) => void;
  shipActionCapabilities: {
    renderDeliveryEditor: (props: {
      open: boolean;
      saleOrderId?: string;
      onClose: () => void;
      onSuccess: () => void;
    }) => ReactNode;
  };
}

export interface SalesDetailLedgerPrintParam {
  businessType: string;
  businessId: string;
  templateType?: 'document_flow' | 'continuous_fixed';
}

export interface SalesDetailLedgerBatchPrintAction<TRow extends object> {
  label: string;
  getPrintParams: (record: TRow) => SalesDetailLedgerPrintParam | null;
}

export interface SalesDetailLedgerBatchPrintCapabilities<TRow extends object> {
  canPrint: boolean;
  actions: readonly SalesDetailLedgerBatchPrintAction<TRow>[];
  openPrintBatch: (requests: readonly SalesDetailLedgerPrintParam[]) => void;
  printJobActionNode?: ReactNode;
}

export interface SaleReturnDetailLedgerCapabilities
  extends SalesDetailLedgerBaseCapabilities<
    SaleReturnDetailLedgerRow,
    SaleReturnDetailLedgerQuery,
    SalesDetailLedgerResponse<
      SaleReturnDetailLedgerRow,
      SaleReturnDetailLedgerSummary
    >
  > {
  returnTypeEnum: StatusMap;
  reasonLabelMap: Readonly<Record<string, string>>;
  permissions: {
    canViewReturn: boolean;
    canViewSaleOrder: boolean;
    canViewSaleDelivery: boolean;
    canPrint: boolean;
  };
  permissionCodes: {
    update: string;
    submit: string;
    receive: string;
    stockConversion: string;
    cancel: string;
    reverse: string;
    print: string;
    printRecords: string;
  };
  navigateToReturn: (returnId: string) => void;
  getReturnPath: (returnId: string) => string;
  navigateToSaleOrder: (saleOrderId: string) => void;
  navigateToSaleDelivery: (deliveryId: string) => void;
  requestReturnDetail: (id: string) => Promise<SaleReturnLedgerDocument | null>;
  batchPrint: SalesDetailLedgerBatchPrintCapabilities<SaleReturnDetailLedgerRow>;
  editCapabilities: SaleReturnEditCapabilities;
  receiveCapabilities: SaleReturnReceiveCapabilities;
  stockConversionCapabilities: SaleReturnStockConversionCapabilities;
}

export interface SaleDeliveryActionDrawerModel extends SaleDeliveryDetailRecord {
  deliveryNo?: string | null;
  customer?: SalesDetailLedgerCustomer | null;
  partnerNameSnapshot?: string | null;
  saleOrder?: SaleOrderLedgerDocument | null;
  warehouse?: { name?: string | null } | null;
  deliveryDate?: string | null;
  remarks?: string | null;
  attachmentUrls?: string[] | null;
}

export interface SaleDeliveryDocumentActionDrawerProps {
  open: boolean;
  deliveryId?: string;
  onClose: () => void;
  onActionSuccess?: () => void;
  onOpenFullEditor?: (deliveryId: string) => void;
  capabilities: SaleDeliveryDocumentActionDrawerCapabilities;
}

export interface SaleDeliveryDocumentActionDrawerCapabilities {
  loadDetail: (deliveryId: string) => Promise<SaleDeliveryActionDrawerModel | null>;
  statusEnum: StatusMap;
  canEditCustomFields: boolean;
  actions: SaleDeliveryDocumentActionsCapabilities;
  items: SaleDeliveryItemsPanelCapabilities;
}

export type SalesLedgerRowSelection<TRow extends object, TQuery> = NonNullable<
  ProTableProps<TRow, TQuery>['rowSelection']
>;

export type SalesLedgerAlertOptionRender<TRow extends object, TQuery> = Exclude<
  NonNullable<ProTableProps<TRow, TQuery>['tableAlertOptionRender']>,
  false
>;
