import type { ReactNode } from 'react';
import type { ProTableProps } from '@ant-design/pro-components';

export interface ProductCostPeriodQuery {
  accountingBookCode: string;
  fiscalPeriod: string;
}

export interface ProductCostOpeningWipRecord {
  id: string;
  accountingBookCode: string;
  fiscalPeriod: string;
  materialId?: string | null;
  materialName?: string | null;
  materialCode?: string | null;
  workOrderNo?: string | null;
  workOrderId: string;
  openingQuantity: number;
  openingMaterialCost: number;
  openingLaborCost: number;
  openingOverheadCost: number;
}

export interface ProductCostClosingWipRecord {
  id: string;
  accountingBookCode: string;
  fiscalPeriod: string;
  materialId?: string | null;
  materialName?: string | null;
  materialCode?: string | null;
  workOrderNo?: string | null;
  workOrderId: string;
  wipQuantity: number;
  completionRatePercent: number;
  materialCompletionRatePercent: number;
  laborCompletionRatePercent: number;
  overheadCompletionRatePercent: number;
}

export interface ProductCostWipModalRenderProps<TRecord> {
  query: ProductCostPeriodQuery;
  editingRecord: TRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
}

export interface ProductCostWipCreateButtonProps {
  onClick: () => void;
}

export interface ProductCostWipRemoveButtonProps<TRecord> {
  record: TRecord;
  confirmation: {
    title: string;
    content: string;
    okText: string;
  };
  successMessage: string;
  onConfirm: () => Promise<void>;
  onSuccess: () => Promise<void>;
}

export interface ProductCostWipCapabilities {
  listOpening: (
    query: ProductCostPeriodQuery,
  ) => Promise<ProductCostOpeningWipRecord[]>;
  removeOpening: (id: string) => Promise<void>;
  renderOpeningModal: (
    props: ProductCostWipModalRenderProps<ProductCostOpeningWipRecord>,
  ) => ReactNode;
  /** Host renders the source permission-aware primary action. */
  renderCreateButton: (
    props: ProductCostWipCreateButtonProps,
  ) => ReactNode;
  /** Host renders the source permission-aware confirm action and handles errors. */
  renderOpeningRemoveButton: (
    props: ProductCostWipRemoveButtonProps<ProductCostOpeningWipRecord>,
  ) => ReactNode;
  listClosing: (
    query: ProductCostPeriodQuery,
  ) => Promise<ProductCostClosingWipRecord[]>;
  removeClosing: (id: string) => Promise<void>;
  renderClosingModal: (
    props: ProductCostWipModalRenderProps<ProductCostClosingWipRecord>,
  ) => ReactNode;
  /** Host renders the source permission-aware confirm action and handles errors. */
  renderClosingRemoveButton: (
    props: ProductCostWipRemoveButtonProps<ProductCostClosingWipRecord>,
  ) => ReactNode;
  formatMoney: (value: number) => string;
  pagination: ProTableProps<ProductCostOpeningWipRecord, Record<string, unknown>>['pagination'];
}

export interface ProductCostWipPanelsProps {
  query: ProductCostPeriodQuery;
  canManage: boolean;
  canMaintainInput: boolean;
  onRefresh: () => Promise<void>;
  capabilities: ProductCostWipCapabilities;
}
