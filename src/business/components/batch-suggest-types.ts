export type BatchSuggestionMode = 'outbound' | 'inbound';

export interface BatchSuggestionRecord {
  id?: string;
  batchNo: string;
  status?: string | null;
  expiryDate?: string | null;
  qty?: number | string | null;
  warehouse?: { name?: string | null } | null;
  location?: { pathName?: string | null } | null;
  storageLocationSnapshot?: string | null;
  locationId?: string | null;
  [field: string]: unknown;
}

export interface BatchSuggestionRequest {
  page: 1;
  pageSize: number;
  keyword?: string;
  materialId: string;
  warehouseId?: string;
  ownerType?: string;
  customerId?: string;
  ownerRefId?: string;
  status?: 'available';
  excludeExpired?: boolean;
  sourceDocType?: string;
}

export interface MesBatchSuggestCapabilities {
  listBatches: (
    params: BatchSuggestionRequest,
  ) => Promise<{ list?: BatchSuggestionRecord[] | null }>;
  statusText?: Readonly<Record<string, string>>;
}
