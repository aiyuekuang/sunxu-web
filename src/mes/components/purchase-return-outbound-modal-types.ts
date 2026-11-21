import type { MesStockLocationSelectCapabilities } from './stock-location-select-field-types';
import type { StockBalancePreviewCapabilities } from './stock-balance-preview-types';

export interface PurchaseReturnOutboundLine {
  id: string;
  materialId?: string | null;
  material?: { name?: string | null } | null;
  sourceReceiptItem?: { material?: { name?: string | null } | null } | null;
  outboundQty?: number | string | null;
  returnQty?: number | string | null;
  batchNo?: string | null;
  locationId?: string | null;
  storageLocationSnapshot?: string | null;
  remarks?: string | null;
}

export interface PurchaseReturnOutboundDetail {
  id: string;
  financialAction?: string | null;
  outboundWarehouseId?: string | null;
  items?: PurchaseReturnOutboundLine[] | null;
}

export interface PurchaseReturnOutboundFormValues {
  businessDate: import('dayjs').Dayjs;
  refundAccountId?: string;
  refundDate?: import('dayjs').Dayjs;
  items: Array<{
    id: string;
    outboundQty?: number;
    batchNo?: string;
    locationId?: string;
    storageLocation?: string;
    remarks?: string;
  }>;
}

export interface PurchaseReturnOutboundRequest {
  id: string;
  businessDate?: string;
  refundAccountId?: string;
  refundDate?: string;
  items: Array<{
    id: string;
    outboundQty?: number;
    batchNo?: string;
    locationId?: string;
    storageLocation?: string;
    remarks?: string;
  }>;
}

export interface PurchaseReturnOutboundModalCapabilities {
  /** Host adapter for the active, first-page fund-account query. */
  loadActiveFundAccounts: (params: {
    isActive: true;
    page: 1;
    pageSize: 100;
  }) => Promise<{
    list?: Array<{ id: string; name: string; code?: string | null }> | null;
  } | null>;
  submitOutbound: (request: PurchaseReturnOutboundRequest) => Promise<unknown>;
  normalizeDateOnly: (value: unknown) => string | undefined;
  notifySuccess: (message: string) => void;
  stockLocation: MesStockLocationSelectCapabilities;
  stockBalancePreview: StockBalancePreviewCapabilities;
}

export interface PurchaseReturnOutboundModalProps {
  detail: PurchaseReturnOutboundDetail | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
  capabilities: PurchaseReturnOutboundModalCapabilities;
}
