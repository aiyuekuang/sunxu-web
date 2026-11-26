import type { ProFormInstance } from '@ant-design/pro-components';
import type { Dayjs } from 'dayjs';
import type { MutableRefObject } from 'react';
import type {
  PurchaseOrderFilterCapabilities,
  PurchaseOrderFilterFormValues,
} from './purchase-order-filter-drawer-types';

export interface PurchaseOrderDetailFilterFormValues
  extends Pick<
    PurchaseOrderFilterFormValues,
    'orderNo' | 'statuses' | 'supplierId' | 'materialId'
  > {
  deliveryDate?: [Dayjs, Dayjs];
  hideCompletedUndated?: boolean;
}

export interface PurchaseOrderDetailFilterDrawerProps {
  open: boolean;
  loading?: boolean;
  formRef: MutableRefObject<ProFormInstance | undefined>;
  onOpenChange: (open: boolean) => void;
  onFinish: (values: PurchaseOrderDetailFilterFormValues) => Promise<boolean>;
  onReset: () => void;
  appliedCount: number;
  capabilities: PurchaseOrderFilterCapabilities;
}
