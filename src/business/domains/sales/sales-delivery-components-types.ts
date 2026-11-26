import type { CSSProperties, ReactNode } from 'react';
import type { ProTableProps } from '@ant-design/pro-components';
import type { DocumentLineColumn } from '../documents/DocumentLineEditableTable';
import type { CustomFieldDefinition } from '../documents/custom-field-form-types';
import type { DocumentLineCustomFieldSchema } from '../documents/document-line-custom-field-types';
import type { FilterableSelectRequestFn, MaterialFilteredSelectOption } from '../inventory/material-select-types';
import type { OrderItemDraft } from '../shared/OrderItemEditor';
import type { StockLocationSelectCapabilities } from '../inventory/stock-location-select-field-types';
import type { StockBalancePreviewCapabilities } from '../inventory/stock-balance-preview-types';
import type { OrderItemCommercialAmountPreviewRequest, OrderItemCommercialAmountPreviewResult } from './order-item-editor-types';
import type { ManufactureModeNormalizer } from './sale-order-field-types';

export interface SaleOrderLineDocumentLineCustomFieldSchema extends DocumentLineCustomFieldSchema {
  systemFields?: Array<{ key: string }>;
}

export interface SaleDeliveryMaterialSnapshot {
  id?: string;
  code?: string | null;
  name?: string | null;
  spec?: string | null;
  unit?: string | null;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
}

export interface SaleDeliveryItemRecord {
  id: string;
  saleOrderItemId?: string | null;
  materialId: string;
  quantity: number | string;
  batchNo?: string | null;
  locationId?: string | null;
  storageLocationSnapshot?: string | null;
  remarks?: string | null;
  customerMaterialCode?: string | null;
  customerMaterialName?: string | null;
  customerMaterialSpec?: string | null;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
  amount?: number | null;
  unitPrice?: number | null;
  totalAmount?: number | null;
  discountRate?: number | null;
  discountAmount?: number | null;
  discountedAmount?: number | null;
  taxRate?: number | null;
  taxAmount?: number | null;
  priceIncludesTax?: boolean | null;
  priceSnapshot?: unknown;
  packageUnitId?: string | null;
  packageUnitLineId?: string | null;
  material?: SaleDeliveryMaterialSnapshot | null;
  location?: { pathName?: string | null } | null;
  packageUnit?: { packageNo?: string | null } | null;
  [key: string]: unknown;
}

export interface SaleDeliveryDetailRecord {
  id: string;
  deliveryNo?: string | null;
  status?: string;
  warehouseId: string;
  availableActions: string[];
  priceVisible?: boolean;
  items?: SaleDeliveryItemRecord[] | null;
  [key: string]: unknown;
}

export interface DeliveryLineFormValues {
  quantity: number;
  batchNo?: string;
  locationId?: string;
  storageLocation?: string;
  remarks?: string;
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
}

export interface DeliveryLineExecutionPatch extends DeliveryLineFormValues {
  itemId: string;
}

export interface SaleDeliveryExecutionPayload {
  id: string;
  items: Array<{
    id: string;
    saleOrderItemId?: string | null;
    materialId: string;
    quantity: number;
    batchNo?: string;
    locationId?: string | null;
    storageLocation?: string;
    packageUnitId?: string | null;
    packageUnitLineId?: string | null;
    remarks?: string;
    customFieldSchemaVersion?: number;
    customValues?: Record<string, unknown>;
  }>;
}

export interface SaleDeliveryItemsPanelProps {
  deliveryId?: string;
  onActionSuccess?: () => void;
  onOpenFullEditor?: (deliveryId: string) => void;
  capabilities: SaleDeliveryItemsPanelCapabilities;
}

export interface SaleDeliveryItemsPanelCapabilities {
  loadDetail: (id: string) => Promise<SaleDeliveryDetailRecord | null | undefined>;
  updateExecution: (payload: SaleDeliveryExecutionPayload) => Promise<unknown>;
  canViewPrices: boolean;
  canUpdateExecution: boolean;
  unitLabelMap: Readonly<Record<string, string>>;
  materialCustomFields: readonly CustomFieldDefinition[];
  lineCustomFieldSchema?: DocumentLineCustomFieldSchema | null;
  maskAmount?: (value: string | number | null | undefined) => string;
  renderAmountPolicySnapshotTag: (props: { priceSnapshot?: unknown; mask: (amount: string | number | null | undefined) => string }) => ReactNode;
  notify: { success: (message: string) => void };
  renderStockLocationSelector: (props: {
    capabilities: StockLocationSelectCapabilities;
    action: 'stock/out';
    warehouseId?: string;
    materialId?: string;
    batchNo?: string;
    minAvailableQty?: number;
    value?: string;
    storageLocation?: string;
    onChange: (patch: { locationId?: string; storageLocation?: string }) => void;
  }) => ReactNode;
  stockLocationCapabilities: StockLocationSelectCapabilities;
  renderStockBalancePreview: (props: {
    capabilities: StockBalancePreviewCapabilities;
    warehouseId?: string;
    materialId?: string;
    locationId?: string;
    storageLocation?: string;
    batchNo?: string;
    requiredQty?: number;
    mode: 'outbound';
  }) => ReactNode;
  stockBalanceCapabilities: StockBalancePreviewCapabilities;
  renderLineCustomFieldFormItems: (props: {
    schema?: DocumentLineCustomFieldSchema | null;
    namePrefix: Array<string | number>;
    colSpan: number;
  }) => ReactNode;
}

export interface ProductSerialOption {
  serialNo: string;
  batchNo?: string | null;
}

export interface ProductSerialPickerProps {
  materialId?: string;
  warehouseId?: string;
  batchNo?: string;
  deliveryOrderId?: string;
  quantity: number;
  value: string[];
  onChange: (serialNumbers: string[]) => void;
  capabilities: ProductSerialPickerCapabilities;
}

export interface ProductSerialPickerCapabilities {
  listAvailableForShipment: (params: {
    materialId: string;
    warehouseId: string;
    batchNo: string;
    deliveryOrderId?: string;
  }) => Promise<readonly ProductSerialOption[] | null | undefined>;
}

export interface SalesDeliveryPackageUnitRecord {
  id: string;
  packageNo: string;
  batchNo?: string | null;
  materialId?: string | null;
  totalQty?: number | string | null;
  packageType: string;
  status: string;
  material?: { name?: string | null } | null;
  warehouse?: { name?: string | null } | null;
  [key: string]: unknown;
}

export interface PackageUnitPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId?: string;
  materialId?: string;
  batchNo?: string;
  deliveryOrderId?: string;
  value?: string;
  onSelect: (record: SalesDeliveryPackageUnitRecord) => void;
  capabilities: PackageUnitPickerModalCapabilities;
}

export interface PackageUnitPickerModalCapabilities {
  pagination?: ProTableProps<SalesDeliveryPackageUnitRecord, Record<string, unknown>>['pagination'];
  listAvailableForDelivery: (params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    deliveryOrderId?: string;
    warehouseId?: string;
    materialId?: string;
    batchNo?: string;
  }) => Promise<{ list?: SalesDeliveryPackageUnitRecord[] | null; total?: number | null }>;
  packageTypeLabels: Readonly<Record<string, string>>;
  packageStatus: Readonly<Record<string, { text: string; color: string }>>;
  notify: { warning: (message: string) => void };
}

export interface SaleDeliveryEditorModalProps {
  open: boolean;
  saleOrderId?: string;
  onClose: () => void;
  onSuccess: () => void;
  capabilities: SaleDeliveryEditorModalCapabilities;
}

export interface SaleDeliveryEditorModalCapabilities {
  renderEmbeddedEditor: (props: {
    open: boolean;
    saleOrderId?: string;
    onClose: () => void;
    onSuccess: () => void;
  }) => ReactNode;
}

export interface SaleOrderLineEditableTableProps {
  saleOrderId?: string;
  items: OrderItemDraft[];
  onItemsChange: (items: OrderItemDraft[]) => void;
  onItemsUpdate?: (updater: (items: OrderItemDraft[]) => OrderItemDraft[]) => void;
  materialRequest: FilterableSelectRequestFn;
  materialPlaceholder?: string;
  onMaterialAutoFill?: (itemKey: string, materialId: string) => void;
  onQuantityAutoFill?: (itemKey: string, materialId: string, quantity: number) => void;
  qtyErrors?: Record<string, string>;
  showPrice: boolean;
  availableDrawingUrls?: string[];
  showCurrency?: boolean;
  costAsOfDate?: string;
  defaultManufactureMode?: string;
  headerDeliveryDate?: string;
  requireDeliveryDate?: boolean;
  toolbarActions?: ReactNode;
  capabilities: SaleOrderLineEditableTableCapabilities;
}

export interface SaleOrderLineEditableTableCapabilities {
  renderMaterialSelect: (props: {
    request: FilterableSelectRequestFn;
    value?: string;
    selectedOption?: MaterialFilteredSelectOption;
    placeholder?: string;
    filterMode: 'hidden';
    selectWidth: '100%';
    style: CSSProperties;
    onChange: (materialId: string | undefined, option?: MaterialFilteredSelectOption) => void;
  }) => ReactNode;
  requestCurrencyOptions: () => Promise<Array<{ label: string; value: string }>>;
  requestMaterialListCustomFields: () => Promise<CustomFieldDefinition[]>;
  requestDocumentLineCustomFieldSchema: (params: { objectType: string }) => Promise<SaleOrderLineDocumentLineCustomFieldSchema | null | undefined>;
  previewDocumentLineCustomFields: (request: {
    objectType: string;
    customFieldSchemaVersion: number;
    items: Array<Record<string, unknown>>;
  }) => Promise<{ items?: Array<{ customComputedValues?: Record<string, unknown>; customComputedErrors?: Record<string, unknown> } | null> }>;
  previewCommercialAmounts: (request: OrderItemCommercialAmountPreviewRequest) => Promise<OrderItemCommercialAmountPreviewResult>;
  requestBomOptions: (params: { keyWords?: string; materialId: string; saleOrderId?: string }) => Promise<Array<{ label: string; value: string; sourceType?: string; [key: string]: unknown }>>;
  currencyOptions?: readonly { label: string; value: string }[];
  renderDictionaryConfigEntry?: (props: { target: 'dictionary'; typeCode: 'currency'; show: boolean; onOpen: () => void; children: ReactNode }) => ReactNode;
  renderDrawingFiles: (props: { value: string[]; availableFileUrls: string[]; editable: true; onChange: (urls: string[]) => void }) => ReactNode;
  renderDocumentBomButton: (props: { documentType: 'sale_order_item'; documentId?: string; editable: true; initialEdit: true; initialImport: true; productQty: number; title: string; onSaved?: () => void }) => ReactNode;
  renderBomCostSnapshotEditor: (props: { bomHeaderId?: string; productQty: number; asOfDate?: string; value?: Record<string, unknown>; onChange: (value: Record<string, unknown> | undefined) => void }) => ReactNode;
  renderFieldHelp: (props: { label: string; title: string; content: string }) => ReactNode;
  manufactureModeOptions: readonly { label: string; value: string }[];
  normalizeManufactureMode: ManufactureModeNormalizer<string>;
  lineCustomFieldColumns?: (schema: DocumentLineCustomFieldSchema | null | undefined) => DocumentLineColumn<OrderItemDraft>[];
  lineCustomFieldSummaries?: (rows: readonly OrderItemDraft[], schema: DocumentLineCustomFieldSchema | null | undefined) => Array<{ label: string; value: number | null }>;
  notify: { error: (message: string) => void };
}
