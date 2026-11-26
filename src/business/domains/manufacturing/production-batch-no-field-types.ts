import type { FormItemProps } from 'antd';

export interface ProductionBatchOptionItem {
  batchNo: string;
  source: 'current' | 'inherited';
  sourceWorkOrderNo?: string | null;
  lastReportedAt?: string | null;
  reportedQty: number;
  hasOutput: boolean;
}

export interface ProductionBatchOptions {
  batchRequired: boolean;
  suggestedBatchNo?: string | null;
  options: ProductionBatchOptionItem[];
}

export type ProductionBatchFieldHelpProps = Pick<
  FormItemProps,
  'label' | 'tooltip'
>;

export interface ProductionBatchNoFieldCapabilities {
  loadOptions: (workOrderId: string) => Promise<ProductionBatchOptions>;
  /** Host retains the host batch-selection policy and may use backend snapshots only. */
  choosePreferredBatchNo: (
    options: ProductionBatchOptions,
  ) => string | null | undefined;
  getErrorMessage: (error: unknown, fallback: string) => string;
  getFieldHelpProps: (label: string) => ProductionBatchFieldHelpProps;
  maxBatchNoLength: number;
}

export interface ProductionBatchNoFieldProps {
  workOrderId?: string | null;
  open: boolean;
  name?: string;
  label?: string;
  onLoadingChange?: (loading: boolean) => void;
  capabilities: ProductionBatchNoFieldCapabilities;
}
