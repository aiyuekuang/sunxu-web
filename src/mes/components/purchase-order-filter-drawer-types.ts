import type { ProFormInstance } from '@ant-design/pro-components';
import type { Dayjs } from 'dayjs';
import type { MutableRefObject, ReactNode } from 'react';
import type { DateRangePickerPreset } from '../table/dateRangePresets';

export interface PurchaseOrderFilterSelectOption {
  label: string;
  value: string;
  code?: string | null;
  name?: string | null;
}

export type PurchaseOrderFilterSelectRequest = (params?: {
  keyWords?: string;
  [key: string]: unknown;
}) => Promise<PurchaseOrderFilterSelectOption[]>;

export type PurchaseOrderStatusValueEnum = Record<
  string,
  { text: ReactNode; status?: string; color?: string }
>;

export interface PurchaseOrderFilterCapabilities {
  requestSuppliers: PurchaseOrderFilterSelectRequest;
  requestMaterials: PurchaseOrderFilterSelectRequest;
  statusOptions: PurchaseOrderStatusValueEnum;
  dateRangePresets: DateRangePickerPreset[];
}

export interface PurchaseOrderFilterFormValues {
  orderNo?: string;
  statuses?: string[];
  supplierId?: string;
  materialId?: string;
  createdAt?: [Dayjs, Dayjs];
  expectedDate?: [Dayjs, Dayjs];
  purchasingRepName?: string;
}

export interface PurchaseOrderFilterDrawerProps {
  open: boolean;
  loading?: boolean;
  formRef: MutableRefObject<ProFormInstance | undefined>;
  onOpenChange: (open: boolean) => void;
  onFinish: (values: PurchaseOrderFilterFormValues) => Promise<boolean>;
  onReset: () => void;
  appliedCount: number;
  materialOption?: Pick<PurchaseOrderFilterSelectOption, 'value' | 'label'>;
  capabilities: PurchaseOrderFilterCapabilities;
}
