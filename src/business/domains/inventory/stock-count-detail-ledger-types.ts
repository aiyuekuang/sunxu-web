import type {
  ActionType,
  ProColumns,
  ProFormInstance,
  ProTableProps,
} from '@ant-design/pro-components';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { ReactNode, RefObject } from 'react';
import type { DocumentDetailLedgerSavedViewController } from '../documents/DocumentDetailLedgerTable';
import type { DocumentViewBarView } from '../documents/DocumentViewBar';
import type { ResizableTableConfig } from '../shared/ResizableTable';
import type { StatusMap } from '../../../components/StatusDisplay';
import type { DocumentViewMode } from '../documents/DocumentViewSwitch';

export type StockCountDetailLedgerStatus =
  | 'draft'
  | 'counting'
  | 'submitted'
  | 'approved'
  | 'reversed'
  | 'cancelled';

export interface StockCountDetailLedgerExportColumnSelection {
  key?: string;
  header?: string;
}

export interface StockCountDetailLedgerMaterial {
  id?: string;
  name?: string | null;
  code?: string | null;
  spec?: string | null;
  unit?: string | null;
  [key: string]: unknown;
}

export interface StockCountDetailLedgerRow {
  id: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  order?: {
    countNo?: string | null;
    status?: string | null;
    approvedAt?: string | null;
  } | null;
  warehouse?: { name?: string | null } | null;
  location?: { pathName?: string | null; name?: string | null } | null;
  storageLocationSnapshot?: string | null;
  material?: StockCountDetailLedgerMaterial | null;
  bookQty: number;
  actualQty?: number | null;
  varianceQty?: number | null;
  batchNo?: string | null;
  remarks?: string | null;
  [key: string]: unknown;
}

export interface StockCountDetailLedgerQuery {
  page?: number;
  pageSize?: number;
  exportColumns?: StockCountDetailLedgerExportColumnSelection[];
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
  keyword?: string;
  countNo?: string;
  status?: StockCountDetailLedgerStatus;
  statuses?: StockCountDetailLedgerStatus[];
  warehouseId?: string;
  locationId?: string;
  materialId?: string;
  batchNo?: string;
  startDate?: string;
  endDate?: string;
}

export interface StockCountDetailLedgerSummary {
  itemCount: number;
  stockCountOrderCount: number;
  materialCount: number;
  bookQty: number;
  actualQty: number;
  varianceQty: number;
}

export interface StockCountDetailLedgerResponse {
  list: StockCountDetailLedgerRow[];
  total: number;
  page: number;
  pageSize: number;
  summary: StockCountDetailLedgerSummary;
}

export interface StockCountDetailLedgerCapabilities {
  requestList: (
    query: StockCountDetailLedgerQuery,
  ) => Promise<StockCountDetailLedgerResponse>;
  exportExcel: (query: StockCountDetailLedgerQuery) => Promise<Blob>;
  canViewStockCount: boolean;
  showLocationControl: boolean;
  statusMap: StatusMap;
  dateRangePresets: RangePickerProps['presets'];
  materialUnitLabelMap: Readonly<Record<string, string>>;
  formatNumber: (value?: number | string | null) => string;
  formatDateTime: (value?: string | null) => string;
  filterColumnProps?: {
    material?: Partial<ProColumns<StockCountDetailLedgerRow>>;
    warehouse?: Partial<ProColumns<StockCountDetailLedgerRow>>;
    location?: Partial<ProColumns<StockCountDetailLedgerRow>>;
  };
  documentLineCustomFieldColumns: ProColumns<StockCountDetailLedgerRow>[];
  materialCustomFieldColumns: ProColumns<StockCountDetailLedgerRow>[];
  exportPermission: string;
  createPermission: string;
  resizable: ResizableTableConfig;
  serverSortFields: readonly string[];
}

export interface StockCountDetailLedgerProps {
  onViewChange?: (view: DocumentViewMode) => void;
  onOpenDetail: (id: string) => void;
  onCreate?: () => void;
  tableActionRef: RefObject<ActionType | null>;
  filterFormRef: RefObject<ProFormInstance | undefined>;
  savedViewController: DocumentDetailLedgerSavedViewController<DocumentViewBarView>;
  rowSelection?: ProTableProps<StockCountDetailLedgerRow, StockCountDetailLedgerQuery>['rowSelection'];
  tableAlertOptionRender?: ProTableProps<StockCountDetailLedgerRow, StockCountDetailLedgerQuery>['tableAlertOptionRender'];
  printJobActionNode?: ReactNode;
  capabilities: StockCountDetailLedgerCapabilities;
}
