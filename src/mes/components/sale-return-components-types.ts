import type { FormItemProps } from 'antd';
import type { ProFormSelectProps } from '@ant-design/pro-components';
import type { ReactNode } from 'react';
import type { DocumentLineCustomFieldSchema } from './document-line-custom-field-types';

export type SaleReturnDisposition =
  | 'resellable'
  | 'pending'
  | 'defective'
  | 'scrap'
  | 'rework'
  | 'reject_to_customer';

export type SaleReturnFinancialAction =
  | 'none'
  | 'credit_note'
  | 'receivable_offset'
  | 'refund';

export type SaleReturnOption<TValue extends string = string> = {
  label: ReactNode;
  value: TValue;
  disabled?: boolean;
};

export interface SaleReturnMaterialSummary {
  id?: string;
  name?: string | null;
  hasBatchTracking?: boolean | null;
}

export interface SaleReturnItemRecord {
  id: string;
  materialId: string;
  material?: SaleReturnMaterialSummary | null;
  sourceDeliveryItemId?: string | null;
  sourceDeliveryItem?: {
    material?: SaleReturnMaterialSummary | null;
  } | null;
  returnQty?: number | null;
  receivedQty?: number | null;
  batchNo?: string | null;
  locationId?: string | null;
  storageLocationSnapshot?: string | null;
  disposition?: SaleReturnDisposition | null;
  financialAction?: SaleReturnFinancialAction | null;
  unitPriceSnapshot?: number | null;
  customValues?: unknown;
  remarks?: string | null;
}

export interface SaleReturnDeductionLineRecord {
  deductionItemCode: string;
  basis?: string | null;
  amount: number;
  remarks?: string | null;
}

/** The host passes the authoritative detail DTO and its computed permission result. */
export interface SaleReturnDetail {
  id: string;
  returnNo: string;
  status: string;
  totalReceivedQty?: number | null;
  stockTransactions?: readonly unknown[] | null;
  items?: readonly SaleReturnItemRecord[] | null;
  deductionLines?: readonly SaleReturnDeductionLineRecord[] | null;
  sourceDeliveryId?: string | null;
  customerId?: string | null;
  receiveWarehouseId?: string | null;
  receiveDate?: string | null;
  returnType?: string | null;
  reasonCode?: string | null;
  financialAction: SaleReturnFinancialAction;
  remarks?: string | null;
  priceVisible: boolean;
}

export interface SaleReturnReceiveItemValue {
  id: string;
  receivedQty?: number;
  disposition?: SaleReturnDisposition;
  batchNo?: string;
  locationId?: string;
  targetWarehouseId?: string;
  storageLocation?: string;
  remarks?: string;
}

export interface SaleReturnReceiveFormValues {
  items: SaleReturnReceiveItemValue[];
}

export interface SaleReturnReceivePayload {
  id: string;
  items: SaleReturnReceiveItemValue[];
}

export interface SaleReturnReceiveCapabilities {
  receive: (payload: SaleReturnReceivePayload) => Promise<unknown>;
  dispositionOptions: readonly SaleReturnOption<SaleReturnDisposition>[];
  notifySuccess: (message: string) => void;
  receiveSuccessMessage: string;
}

export interface SaleReturnReceiveModalProps {
  detail: SaleReturnDetail | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
  capabilities: SaleReturnReceiveCapabilities;
}

export interface SaleReturnReversePayload {
  id: string;
  reason: string;
  businessDate?: string;
}

export interface SaleReturnReverseCapabilities {
  reverse: (payload: SaleReturnReversePayload) => Promise<unknown>;
  normalizeDateOnly: (value: unknown) => string | undefined;
  getStatusLabel: (status: string) => string;
  notifySuccess: (message: string) => void;
  notifyWarning: (message: string) => void;
}

export interface SaleReturnReverseModalProps {
  detail?: SaleReturnDetail | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void | Promise<void>;
  capabilities: SaleReturnReverseCapabilities;
}

export type StockConversionType =
  | 'disassemble'
  | 'repack'
  | 'material_change'
  | 'combine'
  | 'rework_conversion';

export type StockConversionCostAllocationMethod =
  | 'by_standard_cost'
  | 'by_qty'
  | 'by_weight_or_measure'
  | 'manual_ratio'
  | 'manual_amount';

export interface SaleReturnStockConversionFormValues {
  conversionType?: StockConversionType;
  conversionPurpose?: string;
  warehouseId?: string;
  costAllocationMethod?: StockConversionCostAllocationMethod;
  remarks?: string;
}

export interface SaleReturnStockConversionPayload {
  id: string;
  conversionType?: StockConversionType;
  conversionPurpose?: string;
  warehouseId?: string;
  costAllocationMethod?: StockConversionCostAllocationMethod;
  remarks?: string;
}

export interface SaleReturnStockConversionResult {
  id: string;
  conversionNo: string;
}

export interface SaleReturnStockConversionCapabilities {
  createFromSaleReturn: (
    payload: SaleReturnStockConversionPayload,
  ) => Promise<SaleReturnStockConversionResult>;
  requestWarehouses: NonNullable<ProFormSelectProps['request']>;
  conversionTypeOptions: readonly SaleReturnOption<StockConversionType>[];
  costAllocationMethodOptions: readonly SaleReturnOption<StockConversionCostAllocationMethod>[];
  notifySuccess: (message: string) => void;
}

export interface SaleReturnStockConversionDrawerProps {
  detail: SaleReturnDetail | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: (
    conversion: SaleReturnStockConversionResult,
  ) => void | Promise<void>;
  capabilities: SaleReturnStockConversionCapabilities;
}

export type SaleReturnLineCustomFormValues = Record<
  string,
  string | number | boolean | string[] | null | undefined
>;

export interface SaleReturnEditLineFormValue {
  materialLabel?: string;
  id?: string;
  materialId?: string;
  sourceDeliveryItemId?: string;
  returnQty?: number;
  unitPrice?: number;
  batchNo?: string;
  locationId?: string;
  storageLocation?: string;
  disposition?: SaleReturnDisposition;
  financialAction?: SaleReturnFinancialAction;
  customValues?: SaleReturnLineCustomFormValues;
  remarks?: string;
}

export interface SaleReturnEditDeductionFormValue {
  deductionItemCode?: string;
  basis?: string;
  amount?: number;
  remarks?: string;
}

export interface SaleReturnEditFormValues {
  receiveDate?: string;
  reasonCode?: string;
  financialAction?: SaleReturnFinancialAction;
  remarks?: string;
  items: SaleReturnEditLineFormValue[];
  deductionLines?: SaleReturnEditDeductionFormValue[];
}

export interface SaleReturnUpdateItemPayload {
  id?: string;
  sourceDeliveryItemId?: string;
  materialId?: string;
  returnQty: number;
  unitPrice?: number;
  batchNo?: string;
  locationId?: string;
  storageLocation?: string;
  disposition?: SaleReturnDisposition;
  financialAction?: SaleReturnFinancialAction;
  remarks?: string;
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
}

export interface SaleReturnUpdateDeductionPayload {
  deductionItemCode: string;
  amount: number;
  basis?: string;
  remarks?: string;
}

export interface SaleReturnUpdatePayload {
  id: string;
  sourceDeliveryId?: string;
  customerId?: string;
  receiveWarehouseId?: string;
  reasonCode?: string;
  financialAction?: SaleReturnFinancialAction;
  remarks?: string;
  items: SaleReturnUpdateItemPayload[];
  deductionLines?: SaleReturnUpdateDeductionPayload[];
}

export interface SaleReturnDictionarySelectProps {
  name: string;
  label: string;
  typeCode: 'sale_return_reason';
  rules: NonNullable<FormItemProps['rules']>;
}

export interface SaleReturnDeductionDictionaryFieldProps {
  name: Array<string | number>;
  label: string;
  typeCode: 'deduction_item';
  showConfigEntry: boolean;
  rules: NonNullable<FormItemProps['rules']>;
  onChange: (value?: string) => void;
}

export interface SaleReturnEditMessages {
  itemsRequired: string;
  manualCreditUnitPriceRequired: string;
  deductionRequiresCredit: string;
  deductionExceedsReturn: string;
  updateSuccess: string;
}

export interface SaleReturnEditCapabilities {
  update: (payload: SaleReturnUpdatePayload) => Promise<unknown>;
  financialActionOptions: readonly SaleReturnOption<SaleReturnFinancialAction>[];
  lineCustomFieldSchema?: DocumentLineCustomFieldSchema | null;
  renderReasonField: (props: SaleReturnDictionarySelectProps) => ReactNode;
  renderDeductionItemField: (
    props: SaleReturnDeductionDictionaryFieldProps,
  ) => ReactNode;
  buildLineCustomValuePayload: (
    item: SaleReturnEditLineFormValue,
    schema: DocumentLineCustomFieldSchema | null | undefined,
  ) =>
    | Pick<
        SaleReturnUpdateItemPayload,
        'customFieldSchemaVersion' | 'customValues'
      >
    | undefined;
  getNextDeductionBasisForItem: (
    itemCode: string | undefined,
    currentBasis: unknown,
  ) => string | null | undefined;
  notifyWarning: (message: string) => void;
  notifySuccess: (message: string) => void;
  messages: SaleReturnEditMessages;
}

export interface SaleReturnEditDrawerProps {
  detail: SaleReturnDetail | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
  capabilities: SaleReturnEditCapabilities;
}
