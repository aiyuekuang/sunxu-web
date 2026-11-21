import type { ReactNode } from 'react';
import type { UnitLabelMap } from '../utils/qty-unit';
import type { MesStockLocationSelectCapabilities } from './stock-location-select-field-types';
import type { WarehouseSelectOption } from './warehouse-remote-select-types';

export interface PurchaseReceiptActionMaterial {
  id?: string;
  name?: string | null;
  code?: string | null;
  spec?: string | null;
  baseType?: string | null;
  unit?: string | null;
  defaultWarehouseId?: string | null;
  defaultWarehouse?: { name?: string | null } | null;
  hasBatchTracking?: boolean | null;
  shelfLifeDays?: number | string | null;
  family?: { defaultShelfLifeDays?: number | string | null } | null;
}

export interface PurchaseReceiptSourceOrderItem {
  id: string;
  materialId: string;
  material?: PurchaseReceiptActionMaterial | null;
  purchaseUnit?: string | null;
  baseUnit?: string | null;
  grade?: string | null;
  unitPrice?: number | null;
  remarks?: string | null;
  orderedQty?: number | null;
  receivedQty?: number | null;
  overReceiptPercent?: number | null;
}

export interface PurchaseReceiptSourcePreviewItem {
  purchaseOrderItem: PurchaseReceiptSourceOrderItem;
  receiptUnit?: string | null;
  receivableReceiptQty?: number | null;
  remainingReceiptCapacityReceiptQty?: number | null;
  outstandingQty?: number | null;
  incomingInspectionRequired: boolean;
}

export interface PurchaseReceiptWarehouseRecommendation {
  status: 'resolved' | 'unresolved' | string;
  warehouseId?: string | null;
  warehouse?: { name?: string | null } | null;
  reason?: string | null;
}

export interface PurchaseReceiptPreview {
  purchaseOrderIds: string[];
  orderNos: string[];
  supplierId: string;
  supplier?: { name?: string | null } | null;
  items: PurchaseReceiptSourcePreviewItem[];
  warehouseRecommendation: PurchaseReceiptWarehouseRecommendation;
}

export interface PurchaseReceiptResultItem {
  qualityInspection?: { id?: string | null } | null;
}

export interface PurchaseReceiptActionReceipt {
  id: string;
  items: PurchaseReceiptResultItem[];
}

export interface PurchaseReceiptResult<
  TReceipt extends PurchaseReceiptActionReceipt = PurchaseReceiptActionReceipt,
> {
  id: string;
  outcome: 'received' | 'pending_approval' | 'pending_quality' | string;
  warnings: string[];
  receipt: TReceipt;
}

export interface PurchaseReceiptLineInput {
  purchaseOrderItemId: string;
  materialId: string;
  arrivalReceiptQty: number;
  rejectedReceiptQty?: number;
  rejectReason?: string;
  receiptUnit: string;
  warehouseId?: string;
  batchNo?: string;
  productionDate?: string;
  expiryDate?: string;
  grade?: string;
  supplierBatchNo?: string;
  unitPrice?: number;
  remarks?: string;
  locationId?: string;
  storageLocation?: string;
}

export interface PurchaseReceiptReceiveInput {
  purchaseOrderId?: string;
  supplierId: string;
  receiptDate?: string;
  supplierDeliveryNo?: string;
  remarks?: string;
  clientRequestId?: string;
  items: PurchaseReceiptLineInput[];
}

export interface PurchaseReceiptActionConfigLabelProps {
  target: 'dictionary' | 'warehouse';
  typeCode?: string;
  children: ReactNode;
  show: boolean;
  onOpen: () => void;
}

export interface PurchaseReceiptActionCapabilities<
  TReceipt extends PurchaseReceiptActionReceipt = PurchaseReceiptActionReceipt,
> {
  previewSource: (params: { purchaseOrderId: string }) => Promise<{
    purchaseOrderId: string;
    orderNo: string;
    supplierId: string;
    supplier?: { name?: string | null } | null;
    items: PurchaseReceiptSourcePreviewItem[];
    warehouseRecommendation: PurchaseReceiptWarehouseRecommendation;
  }>;
  previewBatchSource: (params: { ids: string[] }) => Promise<PurchaseReceiptPreview>;
  receive: (input: PurchaseReceiptReceiveInput) => Promise<PurchaseReceiptResult<TReceipt>>;
  notifyWarning: (text: string) => void;
  notifyError: (text: string) => void;
  notifySuccess: (content: ReactNode, duration?: number) => void;
  requestWarehouseOptions: (params: {
    keyWords?: string;
    scope: 'nonLineSide';
    typeFamilies: readonly string[];
  }) => Promise<WarehouseSelectOption[]>;
  stockLocation: MesStockLocationSelectCapabilities;
  permissions: {
    canExportPrices: boolean;
    canWarehouseLocations: boolean;
    canViewInspection: boolean;
  };
  unitLabelMap: UnitLabelMap;
  materialGradeOptions: Array<{ label: string; value: string }>;
  materialGradeDictLoading: boolean;
  materialGradeDictError: boolean;
  retryMaterialGradeDictionary: () => void;
  renderConfigEntryLabel: (props: PurchaseReceiptActionConfigLabelProps) => ReactNode;
}

export interface PurchaseReceiptActionModalProps<
  TReceipt extends PurchaseReceiptActionReceipt = PurchaseReceiptActionReceipt,
> {
  sourceItemIds?: string[] | null;
  sourcePurchaseOrderId?: string | null;
  onClose: () => void;
  onSuccess: (receipt: TReceipt) => void;
  onPrintReceipt?: (receiptId: string) => void;
  onOpenInspection?: (inspectionId: string) => void;
  capabilities: PurchaseReceiptActionCapabilities<TReceipt>;
}
