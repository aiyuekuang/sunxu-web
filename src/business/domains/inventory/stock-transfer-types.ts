import type { BatchMaterialRecord } from '../manufacturing/batch-material-add-types';
import type {
  FilterableSelectRequestFn,
  MaterialFilteredSelectOption,
} from './material-select-types';
import type { StockLocationSelectCapabilities } from './stock-location-select-field-types';

export type StockTransferOrderItemDto = {
  id?: string;
  materialId: string;
  qty: number;
  batchNo?: string;
  remarks?: string;
};

/** Local material display snapshot, stripped before a transfer payload is sent. */
export type StockTransferOrderItemFormValue = StockTransferOrderItemDto & {
  materialOption?: MaterialFilteredSelectOption;
};

export type StockTransferOrderItemRecord = StockTransferOrderItemDto & {
  material?: BatchMaterialRecord | null;
};

export type StockTransferOrderFormValues = {
  plannedDate?: unknown;
  fromWarehouseId: string;
  toWarehouseId: string;
  fromLocationId?: string;
  toLocationId?: string;
  fromStorageLocation?: string;
  toStorageLocation?: string;
  remarks?: string;
  items: StockTransferOrderItemFormValue[];
};

export type StockTransferOrderPayload = Omit<
  StockTransferOrderFormValues,
  'plannedDate' | 'items'
> & {
  plannedDate?: string;
  items: StockTransferOrderItemDto[];
};

export interface StockTransferOrderForEdit {
  id: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  fromLocationId?: string | null;
  toLocationId?: string | null;
  fromStorageLocationSnapshot?: string | null;
  toStorageLocationSnapshot?: string | null;
  plannedDate?: string | null;
  remarks?: string | null;
  items?: StockTransferOrderItemRecord[] | null;
}

export type StockTransferDateNormalizer = (
  value: unknown,
) => string | undefined;

export interface StockTransferModalCapabilities {
  /** Host request must preserve the non-line-side warehouse scope. */
  requestWarehouses: (
    params?: { keyWords?: string } & Record<string, unknown>,
  ) => Promise<Array<{ label: string; value: string }>>;
  /** Host request must preserve the source material selector's active-material scope. */
  requestMaterials: FilterableSelectRequestFn;
  createTransferOrder: (payload: StockTransferOrderPayload) => Promise<unknown>;
  updateTransferOrder: (
    request: { id: string } & StockTransferOrderPayload,
  ) => Promise<unknown>;
  normalizeDateOnly: StockTransferDateNormalizer;
  notifySuccess: (message: string) => void;
  /** Stock-location policy, permissions, requests, and configuration links stay host-owned. */
  stockLocation: StockLocationSelectCapabilities;
}

export interface StockTransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void | Promise<void>;
  editingOrder: StockTransferOrderForEdit | null;
  capabilities: StockTransferModalCapabilities;
}

export type StockTransferOrderAction = 'confirm' | 'cancel' | 'reverse';

export interface StockTransferOrderActionOrder {
  id: string;
  plannedDate?: string | null;
}

export interface StockTransferOrderActionTarget {
  action: StockTransferOrderAction;
  order: StockTransferOrderActionOrder;
}

export interface StockTransferActionModalCapabilities {
  confirmTransfer: (request: {
    id: string;
    businessDate?: string;
  }) => Promise<unknown>;
  cancelTransfer: (request: {
    id: string;
    reason?: string;
  }) => Promise<unknown>;
  reverseTransfer: (request: {
    id: string;
    reason: string;
    businessDate?: string;
  }) => Promise<unknown>;
  normalizeDateOnly: StockTransferDateNormalizer;
  notifySuccess: (message: string) => void;
}

export interface StockTransferActionModalsProps {
  target: StockTransferOrderActionTarget | null;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
  capabilities: StockTransferActionModalCapabilities;
}

export type StockTransferMaterial = BatchMaterialRecord;
