import type { ReactNode } from 'react';
import type { FilterableSelectRequestFn, MaterialFilteredSelectOption } from './material-select-types';
import type { DocumentLineCustomFieldSchema } from './document-line-custom-field-types';
import type { OrderItemDraft } from './OrderItemEditor';

export type RequisitionFormMode = 'create' | 'edit';

export interface RequisitionFormMaterial {
  id?: string;
  code?: string | null;
  name?: string | null;
  unit?: string | null;
  familyId?: string | null;
  baseType?: string | null;
  categoryId?: string | null;
  spec?: string | null;
  procurementType?: string | null;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
}

export interface RequisitionFormItem {
  id?: string;
  materialId: string;
  material?: RequisitionFormMaterial | null;
  requiredQty?: number | string | null;
  supplierId?: string | null;
  supplierPriceTierId?: string | null;
  grade?: string | null;
  suggestedPurchaseDate?: string | null;
  expectedArrivalDate?: string | null;
  remarks?: string | null;
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
}

export interface RequisitionFormRecord {
  id: string;
  prNo?: string | null;
  documentDate?: string | null;
  remarks?: string | null;
  items?: RequisitionFormItem[] | null;
  [field: string]: unknown;
}

export interface RequisitionFormResult extends RequisitionFormRecord {
  id: string;
}

export interface RequisitionFormLineCustomFieldSchema extends DocumentLineCustomFieldSchema {
  systemFields?: Array<{ key: string }>;
}

export interface RequisitionFormLinePayload {
  id?: string;
  materialId: string;
  supplierId?: string;
  supplierPriceTierId?: string;
  grade?: string;
  requiredQty: number;
  suggestedPurchaseDate?: string;
  expectedArrivalDate?: string;
  remarks?: string;
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
}

export interface RequisitionFormPayload {
  id?: string;
  documentDate?: string;
  remarks?: string;
  items: RequisitionFormLinePayload[];
}

export interface RequisitionFormCustomFieldPreviewRow {
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
}

export interface RequisitionFormModalCapabilities {
  requestMaterials: FilterableSelectRequestFn;
  create: (payload: RequisitionFormPayload) => Promise<RequisitionFormResult>;
  update: (payload: RequisitionFormPayload & { id: string }) => Promise<RequisitionFormResult>;
  submit: (request: { id: string }) => Promise<RequisitionFormResult>;
  requestLineCustomFieldSchema: (params: { objectType: string }) => Promise<RequisitionFormLineCustomFieldSchema | null | undefined>;
  previewLineCustomFields: (request: {
    objectType: string;
    customFieldSchemaVersion: number;
    items: Array<Record<string, unknown>>;
  }) => Promise<{ items?: RequisitionFormCustomFieldPreviewRow[] }>;
  notifyWarning: (text: string) => void;
  notifySuccess: (text: string) => void;
  notifyError: (text: string) => void;
  /** Opens the created requisition detail route after a submit failure. */
  onOpenCreated?: (id: string) => void;
  renderFieldHelp: (props: {
    label: ReactNode;
    helpKey: 'requisitionItems' | 'remarks';
  }) => ReactNode;
}

export interface RequisitionFormModalProps {
  open: boolean;
  mode: RequisitionFormMode;
  requisition?: RequisitionFormRecord | null;
  canSubmit?: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (result: RequisitionFormResult) => void;
  capabilities: RequisitionFormModalCapabilities;
}

export type RequisitionOrderItemDraft = OrderItemDraft & {
  id?: string;
  supplierId?: string;
  supplierPriceTierId?: string;
  grade?: string;
  suggestedPurchaseDate?: string;
  expectedArrivalDate?: string;
  remarks?: string;
  material?: RequisitionFormMaterial;
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
  materialOption?: MaterialFilteredSelectOption;
};
