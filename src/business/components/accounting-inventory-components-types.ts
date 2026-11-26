import type {
  ActionType,
  ProColumns,
  ProFormSelectProps,
  ProTableProps,
} from '@ant-design/pro-components';
import type { MutableRefObject, ReactNode } from 'react';
import type { StatusMap } from '../../components/StatusDisplay';

export interface InventoryPeriodQuery {
  accountingBookCode: string;
  fiscalPeriod: string;
}

export type InventoryResultFilter = 'all' | 'receipt' | 'issue' | 'pending';

export interface InventoryOpeningBalanceRecord {
  id: string;
  materialId?: string | null;
  materialCode?: string | null;
  materialName?: string | null;
  warehouseId?: string | null;
  warehouseCode?: string | null;
  openingQuantity: number;
  openingAmount: number;
  openingUnitCost: number;
}

export interface InventoryOpeningBalanceFormValues {
  materialId: string;
  warehouseId: string;
  openingQuantity: number;
  openingAmount: number;
}

export interface InventoryCostResultRecord {
  id: string;
  materialCode?: string | null;
  materialName?: string | null;
  sourceType: string;
  sourceNo: string;
  warehouseCode?: string | null;
  costDirection: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  status: string;
  voucherId?: string | null;
  voucherNo?: string | null;
  lastErrorMessage?: string | null;
}

export interface InventoryStockSummaryRow {
  materialCode?: string | null;
  materialName?: string | null;
  warehouseCode?: string | null;
  openingQty: number;
  openingAmount: number;
  receiptQty: number;
  receiptAmount: number;
  issueQty: number;
  issueAmount: number;
  endingQty: number;
  endingAmount: number;
}

export interface InventoryOpeningBalancePanelCapabilities {
  listOpeningBalances: (
    query: InventoryPeriodQuery,
  ) => Promise<InventoryOpeningBalanceRecord[]>;
  removeOpeningBalance: (id: string) => Promise<void>;
  saveOpeningBalance: (
    values: InventoryPeriodQuery & InventoryOpeningBalanceFormValues,
  ) => Promise<void>;
  requestMaterialOptions: NonNullable<ProFormSelectProps['request']>;
  requestWarehouseOptions: NonNullable<ProFormSelectProps['request']>;
  formatMoney: (value: number) => string;
  /** Host renders the same permission-aware primary action used by the page. */
  renderCreateButton: (props: { onClick: () => void }) => ReactNode;
  notifySuccess: (message: string) => void;
}

export interface InventoryOpeningBalancePanelProps {
  canManage: boolean;
  onChanged: () => Promise<void>;
  query?: InventoryPeriodQuery | null;
  capabilities: InventoryOpeningBalancePanelCapabilities;
}

export interface InventoryCostResultQuery extends InventoryPeriodQuery {
  page: number;
  pageSize: number;
  direction?: 'receipt' | 'issue';
  status?: 'pending_cost';
}

export type InventoryCostResultValueEnum = NonNullable<
  ProColumns<InventoryCostResultRecord>['valueEnum']
>;

export interface InventoryResultTableCapabilities {
  requestCostResults: (params: InventoryCostResultQuery) => Promise<{
    list?: InventoryCostResultRecord[] | null;
    total?: number | null;
  }>;
  formatMoney: (value: number) => string;
  sourceTypeEnum: StatusMap;
  directionEnum: StatusMap;
  statusEnum: StatusMap;
  pagination: ProTableProps<
    InventoryCostResultRecord,
    Record<string, unknown>
  >['pagination'];
  defaultPageSize: number;
  navigateToVoucher: (voucherId: string) => void;
}

export interface InventoryResultTableProps {
  actionRef: MutableRefObject<ActionType | null>;
  canViewVoucher: boolean;
  filter: InventoryResultFilter;
  onFilterChange: (filter: InventoryResultFilter) => void;
  overview?: { pendingCostCount: number } | null;
  query?: InventoryPeriodQuery | null;
  capabilities: InventoryResultTableCapabilities;
}

export interface InventoryStockSummaryTableCapabilities {
  listStockSummary: (
    query: InventoryPeriodQuery,
  ) => Promise<InventoryStockSummaryRow[]>;
  formatMoney: (value: number) => string;
}

export interface InventoryStockSummaryTableProps {
  query?: InventoryPeriodQuery | null;
  capabilities: InventoryStockSummaryTableCapabilities;
}
