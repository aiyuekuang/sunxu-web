import type { DocumentDetailLedgerSavedViewController } from '../documents/DocumentDetailLedgerTable';
import type { DocumentLineCustomFieldSchema } from '../documents/document-line-custom-field-types';
import type { DocumentViewBarView } from '../documents/DocumentViewBar';
import type { StatusMap } from '../../../components/StatusDisplay';
import type { FilterableSelectRequestFn } from './material-select-types';
import type { StockLocationSelectCapabilities } from './stock-location-select-field-types';
import type { ResizableTableConfig } from '../shared/ResizableTable';

export type CustomerMaterialDispositionType = 'return' | 'loss' | 'scrap';
export type CustomerMaterialDispositionStatus = 'confirmed' | 'reversed';

export interface CustomerMaterialDispositionMaterial {
  id?: string;
  name?: string | null;
  code?: string | null;
  spec?: string | null;
  unit?: string | null;
}

export interface CustomerMaterialDispositionOrder {
  id: string;
  dispositionNo: string;
  dispositionType: CustomerMaterialDispositionType;
  status: CustomerMaterialDispositionStatus;
  disposedAt: string;
  confirmedAt?: string | null;
  customer?: { id?: string; name?: string | null } | null;
  reasonCode?: string | null;
  logisticsNo?: string | null;
  remark?: string | null;
  items?: readonly unknown[] | null;
}

export interface CustomerMaterialDispositionAvailableSource {
  sourceLayerId?: string | null;
  sourceLayerType?: string | null;
  customerInboundId?: string | null;
  stockManaged: boolean;
  sourceLabel: string;
  materialId?: string | null;
  materialLabel: string;
  batchNo?: string | null;
  remainingQty: number;
  openedAt: string;
}

export interface CustomerMaterialDispositionDetailRow {
  id: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  order?: CustomerMaterialDispositionOrder | null;
  sourceLayerId?: string | null;
  customerInboundId?: string | null;
  customerInbound?: {
    itemName?: string | null;
    registerNo?: string | null;
    itemSpec?: string | null;
    unit?: string | null;
  } | null;
  materialId?: string | null;
  material?: CustomerMaterialDispositionMaterial | null;
  warehouseId?: string | null;
  warehouse?: { name?: string | null } | null;
  locationId?: string | null;
  location?: { name?: string | null; pathName?: string | null } | null;
  batchNo?: string | null;
  qty: number;
  customFieldSchemaVersion?: number | null;
  customValues?: Record<string, unknown> | null;
  customComputedValues?: Record<string, unknown> | null;
  customComputedErrors?: Record<string, unknown> | null;
}

export interface CustomerMaterialDispositionDetailListSummary {
  itemCount: number;
  dispositionOrderCount: number;
  materialCount: number;
  qty: number;
}

export interface CustomerMaterialDispositionDetailListQuery {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
  keyword?: string;
  dispositionNo?: string;
  customerId?: string;
  dispositionType?: CustomerMaterialDispositionType;
  status?: CustomerMaterialDispositionStatus;
  statuses?: CustomerMaterialDispositionStatus[];
  materialId?: string;
  warehouseId?: string;
  batchNo?: string;
  startDate?: string;
  endDate?: string;
}

export interface CustomerMaterialDispositionDetailListResponse {
  list: CustomerMaterialDispositionDetailRow[];
  total: number;
  page: number;
  pageSize: number;
  summary: CustomerMaterialDispositionDetailListSummary;
}

export interface CustomerMaterialDispositionItemInput {
  sourceLayerId?: string;
  customerInboundId?: string;
  warehouseId?: string;
  locationId?: string;
  batchNo?: string;
  qty: number;
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
}

export interface CustomerMaterialDispositionConfirmRequest {
  idempotencyKey: string;
  customerId: string;
  dispositionType: CustomerMaterialDispositionType;
  disposedAt?: string;
  reasonCode?: string;
  logisticsNo?: string;
  remark?: string;
  items: CustomerMaterialDispositionItemInput[];
}

export interface CustomerMaterialDispositionReverseRequest {
  id: string;
  reason: string;
  businessDate?: string;
}

export interface CustomerMaterialDispositionSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface CustomerMaterialDispositionLineCustomFormValue {
  customValues?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CustomerMaterialDispositionFormValues {
  customerId?: string;
  dispositionType?: CustomerMaterialDispositionType;
  disposedAt?: unknown;
  reasonCode?: string;
  logisticsNo?: string;
  remark?: string;
  lineSourceKey?: string;
  lineWarehouseId?: string;
  lineLocationId?: string;
  lineBatchNo?: string;
  lineQty?: number;
  lineCustomValues?: CustomerMaterialDispositionLineCustomFormValue;
}

export interface CustomerMaterialDispositionFormLine {
  lineId: string;
  sourceLayerId?: string;
  customerInboundId?: string;
  stockManaged: boolean;
  sourceLabel: string;
  materialLabel: string;
  warehouseId?: string;
  locationId?: string;
  batchNo?: string;
  qty: number;
  customFieldSchemaVersion?: number;
  customValues?: CustomerMaterialDispositionLineCustomFormValue;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
}

export interface CustomerMaterialDispositionDetailLedgerCapabilities {
  requestDetailList: (
    query: CustomerMaterialDispositionDetailListQuery,
  ) => Promise<CustomerMaterialDispositionDetailListResponse>;
  exportDetailList: (
    query: CustomerMaterialDispositionDetailListQuery,
  ) => Promise<Blob>;
  canViewDisposition: boolean;
  exportPermission: string;
  createPermission: string;
  typeEnum: StatusMap;
  statusEnum: StatusMap;
  materialUnitLabelMap: Readonly<Record<string, string>>;
  formatDateTime: (value: string | null | undefined) => string;
  formatNumber: (value: number | null | undefined) => string;
  formatUnitLabel: (
    unit: string | null | undefined,
    labels: Readonly<Record<string, string>>,
  ) => string;
  requestCustomerOptions: (params?: {
    keyWords?: string;
  }) => Promise<CustomerMaterialDispositionSelectOption[]>;
  requestMaterialOptions: FilterableSelectRequestFn;
  requestWarehouseOptions: (params?: {
    keyWords?: string;
  }) => Promise<CustomerMaterialDispositionSelectOption[]>;
  lineCustomFieldSchema: DocumentLineCustomFieldSchema | null | undefined;
  resizable: ResizableTableConfig;
  serverSortFields: readonly string[];
}

export interface CustomerMaterialDispositionDetailLedgerProps {
  onViewChange?: (view: 'orders' | 'detail') => void;
  onOpenDetail: (id: string) => void;
  onCreate?: () => void;
  savedViewController: DocumentDetailLedgerSavedViewController<DocumentViewBarView>;
  capabilities: CustomerMaterialDispositionDetailLedgerCapabilities;
}

export interface CustomerMaterialDispositionFormCapabilities {
  requestAvailableSources: (params: {
    customerId: string;
    keyword?: string;
    page: 1;
    pageSize: 100;
  }) => Promise<{
    list?: CustomerMaterialDispositionAvailableSource[] | null;
  } | null>;
  confirm: (
    request: CustomerMaterialDispositionConfirmRequest,
  ) => Promise<unknown>;
  requestCustomerOptions: (params?: {
    keyWords?: string;
  }) => Promise<CustomerMaterialDispositionSelectOption[]>;
  requestWarehouseOptions: (params?: {
    keyWords?: string;
  }) => Promise<CustomerMaterialDispositionSelectOption[]>;
  requestFormSchema: (params: {
    objectType: string;
  }) => Promise<DocumentLineCustomFieldSchema | null | undefined>;
  stockLocationCapabilities: StockLocationSelectCapabilities;
  typeEnum: StatusMap;
  normalizeDateOnlyValue: (value: unknown) => string | undefined;
  getFieldHelpProps: (label: string) => Record<string, unknown>;
  notifyError: (message: string) => void;
}

export interface CustomerMaterialDispositionFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  capabilities: CustomerMaterialDispositionFormCapabilities;
}

export interface CustomerMaterialDispositionReverseCapabilities {
  reverse: (
    request: CustomerMaterialDispositionReverseRequest,
  ) => Promise<unknown>;
  normalizeDateOnlyValue: (value: unknown) => string | undefined;
  statusEnum: StatusMap;
  typeEnum: StatusMap;
}

export interface CustomerMaterialDispositionReverseModalProps {
  detail?: CustomerMaterialDispositionOrder | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void | Promise<void>;
  capabilities: CustomerMaterialDispositionReverseCapabilities;
}
