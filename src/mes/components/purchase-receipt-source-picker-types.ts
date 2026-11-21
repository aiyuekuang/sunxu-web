import type { ReactNode } from 'react';
import type { ProTableProps } from '@ant-design/pro-components';

export interface PurchaseReceiptSourceRow {
  id: string;
  orderNo?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  baseUnit?: string | null;
  orderedQty?: number | null;
  receivedQty?: number | null;
  reservedReceiptQty?: number | null;
  receivableQty?: number | null;
  remainingReceiptCapacityQty?: number | null;
  effectiveDeliveryDate?: string | null;
  material?: {
    name?: string | null;
    code?: string | null;
    spec?: string | null;
  } | null;
}

export interface PurchaseReceiptSourceRequestParams {
  current: number;
  pageSize: number;
  keyword?: string;
  supplierId?: string;
}

export interface PurchaseReceiptSourcePickerCapabilities {
  /**
   * The host owns the pending-order scope, server ordering, API adapter, and
   * request error reporting; the component only supplies paging/search/supplier.
   */
  requestRows: (params: PurchaseReceiptSourceRequestParams) => Promise<{
    data: PurchaseReceiptSourceRow[];
    total: number;
    success?: boolean;
  }>;
  pagination: ProTableProps<PurchaseReceiptSourceRow, Record<string, unknown>>['pagination'];
  formatQuantity: (value?: number | null) => ReactNode;
  formatUnit: (value?: string | null) => ReactNode;
  getSelectionBlockReason: (
    row: PurchaseReceiptSourceRow,
    selectedSupplierId?: string,
  ) => string | undefined;
  maxSelectionCount: number;
  warnTooManySelected: (count: number, max: number) => void;
}

export interface PurchaseReceiptSourcePickerProps {
  /** Current receipt supplier; the host filters pending orders to this supplier. */
  supplierId?: string;
  selectedOrderNo?: string;
  sourceOrderNos?: string[];
  disabled?: boolean;
  canChangeSource?: boolean;
  onChangeSource?: () => Promise<boolean>;
  onSelectItems: (purchaseOrderItemIds: string[]) => Promise<void>;
  capabilities: PurchaseReceiptSourcePickerCapabilities;
}
