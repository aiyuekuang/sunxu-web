import type { ReactNode } from 'react';
import type {
  FilterableSelectRequestFn,
  MaterialFilteredSelectOption,
} from '../inventory/material-select-types';
import type { CustomFieldDefinition } from '../documents/custom-field-form-types';
import type { DocumentLineCustomFieldSchema } from '../documents/document-line-custom-field-types';

export type OrderItemFieldHelpKey = 'formDrawer' | 'orderItems';

export interface OrderItemCurrencyOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface OrderItemConfigEntryLinkProps {
  target: 'dictionary';
  typeCode: string;
  label: string;
  onOpen: () => void;
}

export interface OrderItemDocumentLineCustomFieldSchema
  extends DocumentLineCustomFieldSchema {
  systemFields?: Array<{ key: string }>;
}

export interface OrderItemCustomFieldRuntimePreviewRequest {
  objectType: string;
  customFieldSchemaVersion: number;
  items: Array<Record<string, unknown>>;
}

export interface OrderItemCustomFieldRuntimePreviewRow {
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
}

export interface OrderItemCommercialAmountPreviewRequest {
  domain: 'sales' | 'purchase';
  documentType: string;
  policyCode: 'default';
  systemValues: {
    quantity: number;
    unitPrice?: number;
    discountRate?: number;
    taxRate?: number;
    priceIncludesTax?: boolean;
  };
  customValues: Record<string, unknown>;
}

export interface OrderItemCommercialAmountPreviewResult {
  amount?: number | null;
  discountRate: number;
  discountAmount?: number | null;
  discountedAmount?: number | null;
  taxRate: number;
  taxAmount?: number | null;
  totalAmount?: number | null;
}

export interface OrderItemCommercialLineAmounts {
  amount: number | null;
  discountRate: number;
  discountAmount: number | null;
  discountedAmount: number | null;
  taxRate: number;
  taxAmount: number | null;
  totalAmount: number | null;
}

/** Host-owned host services and catalogs needed by OrderItemEditor. */
export interface OrderItemEditorCapabilities {
  /** Active material search; a per-instance request prop can override this. */
  requestMaterials?: FilterableSelectRequestFn;
  /** Currency dictionary options; dictionary storage and refresh remain host-owned. */
  requestCurrencyOptions?: () => Promise<OrderItemCurrencyOption[]>;
  /** Material fields configured for list display, including their source metadata. */
  requestMaterialListCustomFields?: () => Promise<CustomFieldDefinition[]>;
  /** Current editable document-line custom-field schema. */
  requestDocumentLineCustomFieldSchema?: (params: {
    objectType: string;
  }) => Promise<OrderItemDocumentLineCustomFieldSchema | null | undefined>;
  /** Host's formula-preview endpoint for visible line custom fields. */
  previewDocumentLineCustomFields?: (
    request: OrderItemCustomFieldRuntimePreviewRequest,
  ) => Promise<{ items?: OrderItemCustomFieldRuntimePreviewRow[] }>;
  /** Host's commercial policy preview endpoint; policy and DTO mapping stay host-owned. */
  previewCommercialAmounts?: (
    request: OrderItemCommercialAmountPreviewRequest,
  ) => Promise<OrderItemCommercialAmountPreviewResult>;
  /** host field-help catalog renderer; shared suite only supplies the label and key. */
  renderFieldHelp?: (props: {
    label: ReactNode;
    helpKey: OrderItemFieldHelpKey;
  }) => ReactNode;
  /** Permission-aware dictionary configuration link and route behavior. */
  renderConfigEntryLink?: (
    props: OrderItemConfigEntryLinkProps,
  ) => ReactNode;
}

export type OrderItemMaterialOption = MaterialFilteredSelectOption;
