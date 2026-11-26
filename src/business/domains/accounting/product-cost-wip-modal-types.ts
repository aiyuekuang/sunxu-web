import type { ProFormSelectProps } from '@ant-design/pro-components';
import type { ReactNode } from 'react';
import type {
  ProductCostPeriodQuery,
  ProductCostOpeningWipRecord,
  ProductCostClosingWipRecord,
} from './product-cost-wip-types';

export interface ProductCostWipPeriodFieldProps {
  name: 'accountingBookCode' | 'fiscalPeriod';
  label: '账簿编码' | '会计期间';
  disabled: true;
  required: true;
  width: 'md';
}

export interface ProductCostOpeningWipFormValues extends ProductCostPeriodQuery {
  id?: string;
  workOrderId: string;
  workOrderNo?: string | null;
  materialId?: string | null;
  materialCode?: string | null;
  materialName?: string | null;
  openingQuantity: number;
  openingMaterialCost: number;
  openingLaborCost: number;
  openingOverheadCost: number;
}

export interface ProductCostClosingWipFormValues extends ProductCostPeriodQuery {
  id?: string;
  workOrderId: string;
  workOrderNo?: string | null;
  materialId?: string | null;
  materialCode?: string | null;
  materialName?: string | null;
  wipQuantity: number;
  completionRatePercent: number;
  materialCompletionRatePercent?: number;
  laborCompletionRatePercent?: number;
  overheadCompletionRatePercent?: number;
}

export interface ProductCostWipModalCapabilities {
  requestWorkOrderOptions: NonNullable<ProFormSelectProps['request']>;
  renderAccountingBookField: (props: ProductCostWipPeriodFieldProps) => ReactNode;
  renderFiscalPeriodField: (props: ProductCostWipPeriodFieldProps) => ReactNode;
  saveOpeningWip: (values: ProductCostOpeningWipFormValues) => Promise<void>;
  saveClosingWip: (values: ProductCostClosingWipFormValues) => Promise<void>;
  notifySuccess: (message: string) => void;
}

interface ProductCostWipModalBaseProps<TRecord> {
  query: ProductCostPeriodQuery | null;
  editingRecord: TRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
  capabilities: ProductCostWipModalCapabilities;
}

export type OpeningWipModalProps = ProductCostWipModalBaseProps<ProductCostOpeningWipRecord>;
export type ClosingWipModalProps = ProductCostWipModalBaseProps<ProductCostClosingWipRecord>;
