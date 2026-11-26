import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import type { Dayjs } from 'dayjs';
import type { ReactNode, RefObject } from 'react';
import type { DocumentDetailLedgerSavedViewController } from '../documents/DocumentDetailLedgerTable';
import type { DocumentViewBarView } from '../documents/DocumentViewBar';
import type { DocumentViewMode } from '../documents/DocumentViewSwitch';
import type { DocumentLineCustomFieldSchema } from '../documents/document-line-custom-field-types';
import type { StatusMap } from '../../../components/StatusDisplay';
import type { ResizableTableConfig } from '../shared/ResizableTable';
import type { SalesDetailLedgerPrintParam } from '../sales/sales-detail-ledger-types';

export type OutsourcingDetailLineRole = 'input' | 'output';

export type OutsourcingOrderStatus =
  | 'draft'
  | 'in_progress'
  | 'partial_received'
  | 'received'
  | 'repairing'
  | 'qualified'
  | 'unqualified'
  | 'closed'
  | 'cancelled';

export interface OutsourcingOrderDetailLedgerRow {
  id: string;
  lineRole: OutsourcingDetailLineRole;
  transactionType: string;
  materialId: string;
  materialName: string;
  materialCode: string;
  materialSpec?: string | null;
  unit?: string | null;
  qty: number;
  displayQty?: number | null;
  displayUnit?: string | null;
  outsourcingOrderId: string;
  orderNo: string;
  status: OutsourcingOrderStatus;
  supplierId?: string | null;
  supplierName?: string | null;
  warehouseId: string;
  warehouseName: string;
  locationId?: string | null;
  locationName?: string | null;
  batchNo?: string | null;
  transactionNo?: string | null;
  transactionAt: string;
  createdAt: string;
  updatedAt: string;
  remarks?: string | null;
  customFieldSchemaVersion?: number | null;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface OutsourcingOrderDetailLedgerSummary {
  itemCount: number;
  outsourcingOrderCount: number;
  materialCount: number;
  inputQty: number;
  outputQty: number;
}

export interface OutsourcingOrderDetailLedgerResponse {
  list?: OutsourcingOrderDetailLedgerRow[];
  total?: number;
  page?: number;
  pageSize?: number;
  summary: OutsourcingOrderDetailLedgerSummary;
}

/** Pagination and sort are added by DocumentDetailLedgerTable before the host request. */
export interface OutsourcingOrderDetailLedgerQuery {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
  keyword?: string;
  status?: OutsourcingOrderStatus;
  statuses?: OutsourcingOrderStatus[];
  supplierId?: string;
  detailMaterialId?: string;
  warehouseId?: string;
  locationId?: string;
  batchNo?: string;
  lineRole?: OutsourcingDetailLineRole;
  startDate?: string;
  endDate?: string;
  exportColumns?: Array<{ dataIndex: string; title?: string }>;
}

export interface OutsourcingDetailLedgerDatePreset {
  label: ReactNode;
  value:
    | [Dayjs | null | undefined, Dayjs | null | undefined]
    | (() => [Dayjs | null | undefined, Dayjs | null | undefined]);
}

export type OutsourcingDetailLedgerPrintParam = SalesDetailLedgerPrintParam;

export interface OutsourcingDetailLedgerPrintCapabilities {
  canPrint: boolean;
  openPrintBatch: (
    requests: readonly OutsourcingDetailLedgerPrintParam[],
  ) => void;
  printJobActionNode?: ReactNode;
}

export interface OutsourcingOrderDetailLedgerSavedView {
  controller: DocumentDetailLedgerSavedViewController<DocumentViewBarView>;
  tableActionRef: RefObject<ActionType | null>;
  filterFormRef: RefObject<ProFormInstance | undefined>;
}

export interface OutsourcingOrderDetailLedgerCapabilities {
  /** Host permission outcome for linking the row to the owning outsourcing order. */
  canViewOrder: boolean;
  lineRoleEnum: StatusMap;
  orderStatusEnum: StatusMap;
  dateRangePresets: readonly OutsourcingDetailLedgerDatePreset[];
  supplierSearchColumnProps: Partial<
    ProColumns<OutsourcingOrderDetailLedgerRow>
  >;
  materialSearchColumnProps: Partial<
    ProColumns<OutsourcingOrderDetailLedgerRow>
  >;
  warehouseSearchColumnProps: Partial<
    ProColumns<OutsourcingOrderDetailLedgerRow>
  >;
  issueLineCustomFieldSchema?: DocumentLineCustomFieldSchema | null;
  receiptCustomFieldSchema?: DocumentLineCustomFieldSchema | null;
  materialUnitLabelMap: Readonly<Record<string, string>>;
  formatNumber: (value: number | null | undefined) => string;
  formatDateTime: (value: string | null | undefined) => string;
  formatUnitLabel: (
    unit: string | null | undefined,
    labelMap: Readonly<Record<string, string>>,
  ) => string;
  requestDetails: (
    query: OutsourcingOrderDetailLedgerQuery,
  ) => Promise<OutsourcingOrderDetailLedgerResponse>;
  exportDetails: (
    query: OutsourcingOrderDetailLedgerQuery,
  ) => Promise<unknown>;
  exportPermission: string;
  createPermission: string;
  resizable: ResizableTableConfig;
  serverSortFields: readonly string[];
  savedView: OutsourcingOrderDetailLedgerSavedView;
  print: OutsourcingDetailLedgerPrintCapabilities;
}

export interface OutsourcingOrderDetailLedgerProps {
  capabilities: OutsourcingOrderDetailLedgerCapabilities;
  onViewChange?: (view: DocumentViewMode) => void;
  onOpenOrder: (id: string) => void;
  onCreate?: () => void;
}
