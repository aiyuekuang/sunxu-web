import type { ProTableProps } from '@ant-design/pro-components';
import type { StatusMap } from '../../components/StatusDisplay';
import type { ProductCostPeriodQuery } from './product-cost-wip-types';

export interface ProductCostResultRecord {
  id: string;
  materialName?: string | null;
  materialCode?: string | null;
  workOrderNo?: string | null;
  workOrderId: string;
  openingCost: number;
  directMaterialCost: number;
  directLaborCost: number;
  manufacturingOverheadCost: number;
  completedQuantity: number;
  completedCost: number;
  completedUnitCost: number;
  closingWipCost: number;
  status: string;
}

export interface ProductCostResultsTableCapabilities {
  requestResults: (params: ProductCostPeriodQuery & {
    page: number;
    pageSize: number;
    orderBy?: string;
    orderDir?: 'ASC' | 'DESC';
  }) => Promise<{
    list?: ProductCostResultRecord[] | null;
    total?: number | null;
  }>;
  formatMoney: (value: number) => string;
  statusEnum: StatusMap;
  defaultPageSize: number;
  pagination: ProTableProps<
    ProductCostResultRecord,
    Record<string, unknown>
  >['pagination'];
}

export interface ProductCostResultsTableProps {
  query: ProductCostPeriodQuery;
  capabilities: ProductCostResultsTableCapabilities;
}
