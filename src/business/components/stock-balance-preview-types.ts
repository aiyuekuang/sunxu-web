import type { ReactNode } from 'react';

export type StockBalancePreviewMode = 'adjust' | 'outbound';

export type StockBalancePreviewAlertType = 'error' | 'info' | 'warning';

/** Query arguments delegated to the MES host. */
export interface StockBalancePreviewQuery {
  warehouseId: string;
  materialId: string;
  locationId?: string;
  storageLocation?: string;
  batchNo?: string;
  requiredQty?: number;
  adjustQty?: number;
}

/** The inventory values consumed by the summary and status presentation. */
export interface StockBalancePreviewSnapshot {
  warnings: readonly string[];
  blockers: readonly string[];
  bookQty: number;
  reservedQty: number;
  frozenQty: number;
  availableQty: number;
  batchAvailableQty?: number | null;
  shortageQty?: number | null;
  sufficient?: boolean | null;
  batchShortageQty?: number | null;
  batchSufficient?: boolean | null;
  bookQtyAfterAdjust?: number | null;
}

/** Visible copy stays with the host so units and MES wording remain host-owned. */
export interface StockBalancePreviewCopy {
  loading: string;
  errorFallback: string;
  currentStock: string;
  bookQty: string;
  availableQty: string;
  reservedQty: string;
  frozenQty: string;
  batchAvailableQty: string;
  adjustedQty: string;
  shortageQty: string;
  batchShortageQty: string;
  outboundShortage: string;
}

/** Host-owned inventory access, permission result, formatting, and copy. */
export interface StockBalancePreviewCapabilities {
  canRead: boolean;
  /** Change when the tenant, identity, or authorization context changes. */
  requestContextKey: string;
  loadPreview: (
    query: StockBalancePreviewQuery,
  ) => Promise<StockBalancePreviewSnapshot>;
  formatQuantity: (value: number) => ReactNode;
  formatError: (error: unknown) => string | undefined;
  copy: StockBalancePreviewCopy;
}

export interface StockBalancePreviewProps {
  warehouseId?: string;
  materialId?: string;
  locationId?: string;
  storageLocation?: string;
  batchNo?: string;
  requiredQty?: number;
  adjustQty?: number;
  mode?: StockBalancePreviewMode;
  capabilities: StockBalancePreviewCapabilities;
}
