import type { FilterableSelectRequestFn } from './MaterialFilteredSelect';
import type { ActionType, ProFormInstance } from '@ant-design/pro-components';
import type { RefObject } from 'react';
import type { DocumentDetailLedgerSavedViewController } from './DocumentDetailLedgerTable';
import type { DocumentViewBarView } from './DocumentViewBar';
import type { MesCustomFieldSchema } from './custom-field-form-types';
import type { ResizableTableConfig } from './ResizableTable';
import type { MesStatusEnum } from './StatusDisplay';
import type { DateRangePickerPreset } from '../table/dateRangePresets';

export type StockConversionDetailStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'converted'
  | 'reversed'
  | 'cancelled';

export type StockConversionDetailType =
  | 'disassemble'
  | 'repack'
  | 'material_change'
  | 'combine'
  | 'rework_conversion';

export type StockConversionDetailSourceType =
  | 'sale_return'
  | 'stock_batch'
  | 'production_receipt'
  | 'manual';

export type StockConversionDetailLineRole = 'input' | 'output';

export interface StockConversionDetailLedgerQuery {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
  keyword?: string;
  conversionNo?: string;
  status?: StockConversionDetailStatus;
  statuses?: StockConversionDetailStatus[];
  conversionType?: StockConversionDetailType;
  sourceType?: StockConversionDetailSourceType;
  conversionPurpose?: string;
  convertedStartDate?: string;
  convertedEndDate?: string;
  materialId?: string;
  warehouseId?: string;
  locationId?: string;
  batchNo?: string;
  lineRole?: StockConversionDetailLineRole;
  startDate?: string;
  endDate?: string;
}

export interface StockConversionDetailLedgerItem {
  id: string;
  lineRole: StockConversionDetailLineRole;
  materialId: string;
  materialName: string;
  materialCode: string;
  materialSpec?: string | null;
  unit?: string | null;
  qty: number;
  displayQty?: number | null;
  displayUnit?: string | null;
  warehouseId: string;
  warehouseName: string;
  locationId?: string | null;
  locationName?: string | null;
  batchNo?: string | null;
  conversionOrderId: string;
  conversionNo: string;
  conversionType: StockConversionDetailType;
  status: StockConversionDetailStatus;
  sourceNo?: string | null;
  convertedAt?: string | null;
  transactionAt: string;
  createdAt: string;
  updatedAt: string;
  remarks?: string | null;
  customFieldSchemaVersion?: number | null;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
}

export interface StockConversionDetailLedgerSummary {
  itemCount: number;
  conversionOrderCount: number;
  materialCount: number;
  inputQty: number;
  outputQty: number;
}

export interface StockConversionDetailLedgerResponse {
  list: StockConversionDetailLedgerItem[];
  total: number;
  page?: number;
  pageSize?: number;
  summary: StockConversionDetailLedgerSummary;
}

export interface StockConversionDetailLedgerCapabilities {
  requestDetailList: (
    query: StockConversionDetailLedgerQuery,
  ) => Promise<StockConversionDetailLedgerResponse>;
  exportDetailExcel: (
    query: StockConversionDetailLedgerQuery,
  ) => Promise<Blob>;
  /** Permission identifiers are supplied by the host and resolved by MesUiProvider. */
  exportPermission: string;
  createPermission: string;
  canViewStockConversion: boolean;
  savedViewController: DocumentDetailLedgerSavedViewController<DocumentViewBarView>;
  requestMaterialOptions: FilterableSelectRequestFn;
  requestWarehouseOptions: FilterableSelectRequestFn;
  requestStockLocationOptions: FilterableSelectRequestFn;
  materialUnitLabelMap: Readonly<Record<string, string>>;
  lineRoleEnum: MesStatusEnum;
  conversionTypeEnum: MesStatusEnum;
  statusEnum: MesStatusEnum;
  inputLineSchema?: MesCustomFieldSchema | null;
  outputLineSchema?: MesCustomFieldSchema | null;
  dateRangePresets: DateRangePickerPreset[];
  resizable: ResizableTableConfig;
  serverSortFields: readonly string[];
  formatNumber: (value: number | null | undefined) => string;
  formatUnitLabel: (
    unit: string | null | undefined,
    labelMap: Readonly<Record<string, string>>,
  ) => string;
  formatDateTime: (value?: string | null) => string;
}

export interface StockConversionDetailLedgerProps {
  capabilities: StockConversionDetailLedgerCapabilities;
  tableActionRef: RefObject<ActionType | null>;
  filterFormRef: RefObject<ProFormInstance | undefined>;
  onViewChange?: (view: 'detail' | 'orders') => void;
  onOpenDetail: (id: string) => void;
  onCreate?: () => void;
}
