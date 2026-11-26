import type { FormItemProps } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import type { ProFormSelectProps } from '@ant-design/pro-components';
import type { ReactNode } from 'react';
import type { DocumentLineCustomFieldSchema } from './document-line-custom-field-types';
import type { MesStockLocationSelectCapabilities } from './stock-location-select-field-types';
import type { StockBalancePreviewCapabilities } from './stock-balance-preview-types';

export type PurchaseReturnFinancialAction =
  | 'none'
  | 'payable_offset'
  | 'refund';

export type PurchaseReturnOption<TValue extends string = string> = {
  label: ReactNode;
  value: TValue;
  disabled?: boolean;
};

export interface PurchaseReturnSourceReceiptItem {
  amount?: number | null;
  quantity?: number | string | null;
  material?: { name?: string | null } | null;
}

export interface PurchaseReturnEditItemRecord {
  id: string;
  materialId?: string | null;
  material?: { name?: string | null } | null;
  sourceReceiptItemId?: string | null;
  sourceReceiptItem?: PurchaseReturnSourceReceiptItem | null;
  returnQty?: number | string | null;
  unitPriceSnapshot?: number | null;
  taxRateSnapshot?: number | null;
  priceIncludesTaxSnapshot?: boolean | null;
  sourceSnapshot?: Record<string, unknown> | null;
  batchNo?: string | null;
  locationId?: string | null;
  storageLocationSnapshot?: string | null;
  remarks?: string | null;
  customFieldSchemaVersion?: number | null;
  customValues?: unknown;
}

export interface PurchaseReturnDeductionLineRecord {
  deductionItemCode?: string | null;
  basis?: string | null;
  amount?: number | string | null;
  remarks?: string | null;
}

export interface PurchaseReturnEditDetail {
  id: string;
  sourceReceiptId?: string | null;
  sourceReceipt?: { receiptDate?: string | null } | null;
  supplierId?: string | null;
  sourcePurchaseOrderId?: string | null;
  outboundWarehouseId?: string | null;
  returnType: string;
  inspectionRequired: boolean;
  financialAction: PurchaseReturnFinancialAction;
  returnDate?: string | null;
  reasonCode?: string | null;
  remarks?: string | null;
  items?: PurchaseReturnEditItemRecord[] | null;
  deductionLines?: PurchaseReturnDeductionLineRecord[] | null;
  /** Permission result returned with the purchase-return detail. */
  priceVisible: boolean;
}

export type PurchaseReturnLineCustomValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined;

export interface PurchaseReturnEditLineFormValue {
  id?: string;
  materialLabel?: string;
  materialId?: string;
  sourceReceiptItemId?: string;
  returnQty?: number;
  unitPrice?: number;
  currency?: string;
  exchangeRate?: number;
  taxRate?: number;
  priceIncludesTax?: boolean;
  batchNo?: string;
  locationId?: string;
  storageLocation?: string;
  remarks?: string;
  customValues?: Record<string, PurchaseReturnLineCustomValue>;
}

export interface PurchaseReturnEditDeductionFormValue {
  deductionItemCode?: string;
  basis?: string;
  amount?: number;
  remarks?: string;
}

export interface PurchaseReturnEditFormValues {
  supplierId?: string;
  sourcePurchaseOrderId?: string;
  outboundWarehouseId?: string;
  financialAction?: PurchaseReturnFinancialAction;
  returnDate?: unknown;
  reasonCode?: string;
  remarks?: string;
  items: PurchaseReturnEditLineFormValue[];
  deductionLines?: PurchaseReturnEditDeductionFormValue[];
}

export interface PurchaseReturnUpdateItemPayload {
  id?: string;
  sourceReceiptItemId?: string;
  materialId?: string;
  returnQty: number;
  unitPrice?: number;
  currency?: string;
  exchangeRate?: number;
  taxRate?: number;
  priceIncludesTax?: boolean;
  batchNo?: string;
  locationId?: string;
  storageLocation?: string;
  remarks?: string;
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
}

export interface PurchaseReturnUpdateDeductionPayload {
  deductionItemCode: string;
  amount: number;
  basis?: string;
  remarks?: string;
}

export interface PurchaseReturnUpdatePayload {
  id: string;
  sourceReceiptId?: string;
  supplierId?: string;
  sourcePurchaseOrderId?: string;
  returnType: string;
  outboundWarehouseId?: string;
  returnDate?: string;
  reasonCode?: string;
  inspectionRequired: boolean;
  financialAction: PurchaseReturnFinancialAction;
  remarks?: string;
  items: PurchaseReturnUpdateItemPayload[];
  deductionLines?: PurchaseReturnUpdateDeductionPayload[];
}

export interface PurchaseReturnCommercialAmountInput {
  quantity: number | string | null | undefined;
  unitPrice: number | string | null | undefined;
  taxRate?: number | string | null;
  priceIncludesTax?: boolean | null;
}

export interface PurchaseReturnCommercialAmountResult {
  totalAmount: number | null;
}

export type PurchaseReturnSelectRequest = NonNullable<
  ProFormSelectProps['request']
>;

export type PurchaseReturnConfigTarget =
  | 'supplier'
  | 'warehouse'
  | 'purchaseOrders';

export interface PurchaseReturnConfiguredSelectProps {
  name: string;
  label: string;
  configTarget: PurchaseReturnConfigTarget;
  request: PurchaseReturnSelectRequest;
  showSearch: true;
  debounceTime: 300;
  fieldProps: { filterOption: false; allowClear?: boolean };
  rules?: FormItemProps['rules'];
  onOpenConfig: () => void;
}

export interface PurchaseReturnReasonFieldProps {
  name: string;
  label: string;
  typeCode: 'purchase_return_reason';
  rules: NonNullable<FormItemProps['rules']>;
  onOpenConfig: () => void;
}

export interface PurchaseReturnDictionaryFormItemProps {
  typeCode: 'currency' | 'deduction_item';
  name: NamePath;
  label?: string;
  showConfigEntry?: boolean;
  rules?: FormItemProps['rules'];
  children: ReactNode;
  onOpenConfig: () => void;
}

export interface PurchaseReturnOrderOptionRecord {
  id: string;
  orderNo: string;
  supplier?: { name?: string | null } | null;
}

export interface PurchaseReturnEditMessages {
  itemsRequired: string;
  independentSupplierWarehouseRequired: string;
  pricePermissionRequired: string;
  financialItemPricesRequired: string;
  deductionExceedsReturn: string;
  updateSuccess: string;
}

export interface PurchaseReturnEditCapabilities {
  update: (payload: PurchaseReturnUpdatePayload) => Promise<unknown>;
  requestActiveSuppliers: PurchaseReturnSelectRequest;
  requestNonLineSideWarehouses: PurchaseReturnSelectRequest;
  requestPurchaseOrders: (params: {
    keyword?: string;
    page: 1;
    pageSize: 20;
  }) => Promise<{ list?: PurchaseReturnOrderOptionRecord[] | null } | null>;
  financialActionOptions: readonly PurchaseReturnOption<PurchaseReturnFinancialAction>[];
  lineCustomFieldSchema?: DocumentLineCustomFieldSchema | null;
  buildLineCustomValuePayload: (
    item: PurchaseReturnEditLineFormValue,
    schema: DocumentLineCustomFieldSchema | null | undefined,
  ) =>
    | Pick<PurchaseReturnUpdateItemPayload, 'customFieldSchemaVersion' | 'customValues'>
    | undefined;
  getNextDeductionBasisForItem: (
    itemCode: string | undefined,
    currentBasis: unknown,
  ) => string | null | undefined;
  normalizeDateOnlyValue: (value: unknown) => string | undefined;
  calculateCommercialLineAmounts: (
    input: PurchaseReturnCommercialAmountInput,
  ) => PurchaseReturnCommercialAmountResult;
  stockLocation: MesStockLocationSelectCapabilities;
  stockBalancePreview: StockBalancePreviewCapabilities;
  canViewPrices: boolean;
  openConfigEntry: (target: PurchaseReturnConfigTarget | 'dictionary') => void;
  renderConfiguredSelect: (
    props: PurchaseReturnConfiguredSelectProps,
  ) => ReactNode;
  renderReasonField: (props: PurchaseReturnReasonFieldProps) => ReactNode;
  renderDictionaryFormItem: (
    props: PurchaseReturnDictionaryFormItemProps,
  ) => ReactNode;
  notifyWarning: (message: string) => void;
  notifySuccess: (message: string) => void;
  messages: PurchaseReturnEditMessages;
}

export interface PurchaseReturnEditDrawerProps {
  detail: PurchaseReturnEditDetail | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
  capabilities: PurchaseReturnEditCapabilities;
}
