import type { ProFormSelectProps, ProTableProps } from '@ant-design/pro-components';
import type { ReactNode } from 'react';
import type { StatusMap } from '../../../components/StatusDisplay';
import type { ProductCostPeriodQuery } from './product-cost-wip-types';

export type ProductCostAllocationBasis =
  | 'output_quantity'
  | 'actual_labor_hours'
  | 'direct_material_amount'
  | 'manual';

export interface ProductCostExpenseTypeOption {
  code: string;
  name: string;
}

export interface ProductCostManualAllocationItem {
  workOrderId: string;
  allocatedAmount: number;
}

export interface ProductCostExpenseCollectionRecord {
  id: string;
  collectionNo: string;
  accountingBookCode: string;
  fiscalPeriod: string;
  businessDate?: string | null;
  expenseTypeCode: string;
  expenseTypeName: string;
  allocationBasis: ProductCostAllocationBasis;
  amount: number;
  status: 'draft' | 'confirmed' | 'cancelled';
  sourceLabel?: string | null;
  remark?: string | null;
}

export interface ProductCostExpenseCollectionAllocationDetail {
  collection: ProductCostExpenseCollectionRecord;
  manualAllocations: ProductCostManualAllocationItem[];
}

export interface ProductCostExpenseDraftRecord {
  id: string;
  sourceObjectType: string;
  sourceObjectId: string;
  sourceObjectLabel?: string | null;
  expenseTypeCode: string;
  expenseTypeName: string;
  allocationBasis?: string | null;
  amount: number;
  amountExcludingTax?: number | null;
  lastResolvedAt?: string | null;
}

export interface CreateProductCostExpenseCollectionValues {
  accountingBookCode: string;
  fiscalPeriod: string;
  businessDate: string;
  expenseTypeCode: string;
  allocationBasis?: ProductCostAllocationBasis;
  amount: number;
  sourceLabel?: string;
  remark?: string;
  manualAllocations?: ProductCostManualAllocationItem[];
}

export interface AllocateProductCostExpenseCollectionValues {
  id: string;
  businessDate: string;
  allocationBasis?: ProductCostAllocationBasis;
  manualAllocations?: ProductCostManualAllocationItem[];
}

export interface ProductCostPeriodFieldProps {
  name: 'accountingBookCode' | 'fiscalPeriod';
  label: '账簿编码' | '会计期间';
  disabled: true;
  required: true;
  width: 'md';
}

export interface ProductCostExpenseModalCapabilities {
  requestWorkOrderOptions: NonNullable<ProFormSelectProps['request']>;
  renderAccountingBookField: (props: ProductCostPeriodFieldProps) => ReactNode;
  renderFiscalPeriodField: (props: ProductCostPeriodFieldProps) => ReactNode;
  createExpenseCollection: (
    values: CreateProductCostExpenseCollectionValues,
  ) => Promise<void>;
  allocateExpenseCollection: (
    values: AllocateProductCostExpenseCollectionValues,
  ) => Promise<void>;
  normalizeDateOnlyValue: (value: unknown) => string | undefined;
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
}

export interface ExpenseCollectionModalProps {
  query: ProductCostPeriodQuery | null;
  expenseTypes: ProductCostExpenseTypeOption[];
  editingDetail: ProductCostExpenseCollectionAllocationDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
  capabilities: ProductCostExpenseModalCapabilities;
}

export interface ProductCostCollectionListCapabilities
  extends ProductCostExpenseModalCapabilities {
  requestExpenseDrafts: (params: {
    financialUsage: 'production_cost_collection_draft';
    status: 'draft';
    page: number;
    pageSize: number;
  }) => Promise<{
    list?: ProductCostExpenseDraftRecord[] | null;
    total?: number | null;
  }>;
  requestExpenseCollections: (params: ProductCostPeriodQuery & {
    page: number;
    pageSize: number;
  }) => Promise<{
    list?: ProductCostExpenseCollectionRecord[] | null;
    total?: number | null;
  }>;
  requestExpenseCollectionDetail: (
    id: string,
  ) => Promise<ProductCostExpenseCollectionAllocationDetail>;
  collectExpenseDrafts: (
    query: ProductCostPeriodQuery & { draftIds: string[] },
  ) => Promise<void>;
  confirmExpenseCollection: (id: string) => Promise<void>;
  cancelExpenseCollection: (id: string) => Promise<void>;
  formatMoney: (value: number) => string;
  statusEnum: StatusMap;
  pagination: NonNullable<
    ProTableProps<ProductCostExpenseDraftRecord, Record<string, unknown>>['pagination']
  >;
  defaultPageSize: number;
}

export interface ProductCostCollectionsPanelProps {
  query: ProductCostPeriodQuery;
  expenseTypes: ProductCostExpenseTypeOption[];
  canManage: boolean;
  canMaintainInput: boolean;
  onRefresh: () => Promise<void>;
  capabilities: ProductCostCollectionListCapabilities;
}
