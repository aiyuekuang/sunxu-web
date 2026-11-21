import type { ProTableProps } from '@ant-design/pro-components';
import type { ReactNode } from 'react';
import type { FilterableSelectRequestFn } from './MaterialFilteredSelect';
import type { ResizableTableConfig } from './ResizableTable';
import type { MesStatusEnum } from './StatusDisplay';

export interface StockTransferDetailLedgerMaterial {
  id: string;
  code: string;
  name: string;
  spec?: string | null;
  unit?: string | null;
}

export interface StockTransferDetailLedgerWarehouse {
  id: string;
  name: string;
}

export interface StockTransferDetailLedgerLocation {
  id: string;
  code: string;
  name: string;
  pathName: string;
}

export interface StockTransferDetailLedgerRow {
  id: string;
  referenceNo: string;
  material: StockTransferDetailLedgerMaterial;
  fromWarehouse: StockTransferDetailLedgerWarehouse;
  toWarehouse: StockTransferDetailLedgerWarehouse;
  fromLocation?: StockTransferDetailLedgerLocation;
  toLocation?: StockTransferDetailLedgerLocation;
  qty: number;
  batchNo?: string | null;
  remarks?: string | null;
  operatorName?: string | null;
  businessDate?: string | null;
  status: string;
  reversed: boolean;
}

export interface StockTransferDetailLedgerQuery {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
  keyword?: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  batchNo?: string;
  businessDateStart?: string;
  businessDateEnd?: string;
}

export interface StockTransferDetailLedgerResponse {
  list?: StockTransferDetailLedgerRow[];
  total?: number;
}

export interface StockTransferDetailLedgerExportActionProps {
  exportFn: () => Promise<unknown>;
  fileName: string;
  label: ReactNode;
}

export interface StockTransferDetailLedgerCapabilities {
  requestList: (
    query: StockTransferDetailLedgerQuery,
  ) => Promise<StockTransferDetailLedgerResponse>;
  exportRows: (query: StockTransferDetailLedgerQuery) => Promise<unknown>;
  canExport: boolean;
  renderExportAction: (
    props: StockTransferDetailLedgerExportActionProps,
  ) => ReactNode;
  requestFromWarehouseOptions: FilterableSelectRequestFn;
  requestToWarehouseOptions: FilterableSelectRequestFn;
  statusEnum: MesStatusEnum;
  materialUnitLabelMap: Readonly<Record<string, string>>;
  normalizeDateOnlyValue: (value: unknown) => string | undefined;
  formatNumber: (value: number) => string;
  formatUnitLabel: (
    unit: string | null | undefined,
    labelMap: Readonly<Record<string, string>>,
  ) => string;
  formatBusinessDateValue: (value?: string | null) => string;
  pagination: ProTableProps<StockTransferDetailLedgerRow, Record<string, unknown>>['pagination'];
  resizable: ResizableTableConfig;
}

export interface StockTransferDetailLedgerProps {
  capabilities: StockTransferDetailLedgerCapabilities;
  onViewChange?: (view: 'detail' | 'orders') => void;
}
