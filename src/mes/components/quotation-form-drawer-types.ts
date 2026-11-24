import type { CSSProperties, ReactNode } from 'react';
import type { Dayjs } from 'dayjs';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import type {
  DocumentLineCustomFieldSchema,
} from './document-line-custom-field-types';
import type {
  MaterialFilteredSelectOption,
} from './material-select-types';
import type { OrderItemDraft } from './OrderItemEditor';
import type { ProductionBomOption } from './production-bom-select-types';

export type QuotationFieldHelpKey =
  | 'quotationCustomerId'
  | 'quotationDate'
  | 'quotationValidUntil'
  | 'quotationPaymentTerms'
  | 'quotationItems';

export interface QuotationFieldHelpProps {
  label: string;
  tooltip?: { title: ReactNode; styles?: { root?: CSSProperties } };
}

export interface QuotationMaterial {
  id: string;
  code?: string | null;
  name?: string | null;
  unit?: string | null;
  spec?: string | null;
  familyId?: string | null;
  baseType?: string | null;
  categoryId?: string | null;
  materialCategory?: { id?: string; baseType?: string } | null;
  category?: string | null;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
}

export interface QuotationItemRecord {
  id: string;
  materialId?: string | null;
  material?: QuotationMaterial | null;
  selectedBomHeaderId?: string | null;
  bomSelectionSource?: string | null;
  bomSelectionReason?: string | null;
  bomCostSnapshot?: Record<string, unknown> | null;
  quantity: number;
  unitPrice?: number | null;
  taxRate?: number | null;
  priceIncludesTax?: boolean | null;
  currency?: string | null;
  priceSnapshot?: Record<string, unknown> | null;
  customerMaterialCode?: string | null;
  customerMaterialName?: string | null;
  customerMaterialSpec?: string | null;
  remarks?: string | null;
  imageUrls?: string[] | null;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
}

export interface QuotationRecord {
  id: string;
  quotationNo?: string;
  customerId?: string | null;
  salesRepId?: string | null;
  quotationDate?: string | null;
  validUntil?: string | null;
  totalAmount?: number;
  paymentTerms?: string | null;
  remarks?: string | null;
  items?: QuotationItemRecord[] | null;
}

export interface QuotationItemDraft extends OrderItemDraft {
  id?: string;
  isCustom?: boolean;
  customerMaterialCode?: string;
  customerMaterialName?: string;
  customerMaterialSpec?: string;
  selectedBomHeaderId?: string;
  bomSelectionSource?: string;
  bomSelectionReason?: string;
  bomCostSnapshot?: Record<string, unknown>;
  remarks?: string;
  imageUrls?: string[];
  imageFiles?: UploadFile[];
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
}

export interface QuotationFormValues {
  customerId?: string;
  salesRepId?: string;
  paymentTerms?: string;
  quotationDate?: Dayjs;
  validUntil?: Dayjs;
  remark?: string;
  customValues?: Record<string, unknown>;
}

export interface QuotationCustomValuesPayload {
  schemaVersion: number;
  customValues: Record<string, unknown>;
}

export interface QuotationItemPayload {
  id?: string;
  materialId?: string;
  selectedBomHeaderId?: string;
  bomSelectionSource?: string;
  bomSelectionReason?: string;
  bomCostSnapshot?: Record<string, unknown>;
  quantity: number;
  unitPrice?: number;
  discountRate?: number;
  taxRate?: number;
  priceIncludesTax?: boolean;
  currency?: string;
  customerMaterialCode?: string;
  customerMaterialName?: string;
  customerMaterialSpec?: string;
  remarks?: string;
  imageUrls?: string[];
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
}

export interface QuotationMutationPayload {
  customerId?: string;
  salesRepId?: string;
  quotationDate?: string;
  validUntil?: string;
  paymentTerms?: string;
  remarks?: string;
  items: QuotationItemPayload[];
}

export interface QuotationSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  salesRepId?: string | null;
  paymentTerms?: string | null;
}

export interface CustomerMaterialRecord {
  materialId: string;
  customerMaterialCode?: string | null;
  customerMaterialName?: string | null;
  customerMaterialSpec?: string | null;
}

export interface ResolvedQuotationPriceContext {
  customerMaterial?: CustomerMaterialRecord | null;
  price: {
    unitPrice?: number | null;
    currency?: string | null;
    taxRate?: number | null;
    taxMode?: 'tax_included' | 'tax_excluded' | string | null;
  };
}

export interface QuotationDictionaryConfigEntryProps {
  target: 'dictionary';
  typeCode: 'payment_terms';
  children: ReactNode;
  show: boolean;
  onOpen: () => void;
}

export interface QuotationFormDrawerCapabilities {
  canViewPrices: boolean;
  loadQuotation: (id: string) => Promise<QuotationRecord>;
  createQuotation: (payload: QuotationMutationPayload) => Promise<QuotationRecord>;
  updateQuotation: (
    payload: QuotationMutationPayload & { id: string },
  ) => Promise<QuotationRecord>;
  uploadImages: (files: readonly RcFile[]) => Promise<string[]>;
  requestCustomerPriorityMaterialOptions: (params: {
    query?: { keyWords?: string; [key: string]: unknown };
    customerId?: string;
    asOfDate?: string;
  }) => Promise<MaterialFilteredSelectOption[]>;
  listCustomerMaterials: (
    customerId: string,
    asOfDate?: string,
  ) => Promise<CustomerMaterialRecord[]>;
  requestBomOptions: (params: {
    keyWords?: string;
    materialId: string;
  }) => Promise<ProductionBomOption[]>;
  resolvePriceContext: (params: {
    customerId: string;
    materialId: string;
    quantity: number;
    asOfDate?: string;
  }) => Promise<ResolvedQuotationPriceContext>;
  requestActiveCustomerOptions: (
    params?: { keyWords?: string } & Record<string, unknown>,
  ) => Promise<QuotationSelectOption[]>;
  requestSalesRepOptions: (
    params?: { keyWords?: string } & Record<string, unknown>,
  ) => Promise<QuotationSelectOption[]>;
  requestPaymentTermsOptions: () => Promise<QuotationSelectOption[]>;
  requestQuotationItemCustomFieldSchema: (
    objectType: 'quotation_item',
  ) => Promise<DocumentLineCustomFieldSchema | null | undefined>;
  validateCustomValues: (request: {
    objectType: 'quotation';
    customFieldSchemaVersion: number;
    customValues: Record<string, unknown>;
  }) => Promise<unknown>;
  saveCustomValues: (request: {
    objectType: 'quotation';
    objectId: string;
    customFieldSchemaVersion: number;
    customValues: Record<string, unknown>;
  }) => Promise<unknown>;
  renderPaymentTermsConfigEntryLabel: (
    props: QuotationDictionaryConfigEntryProps,
  ) => ReactNode;
  fieldHelp: {
    salesProps: (
      label: string,
      key: QuotationFieldHelpKey,
    ) => QuotationFieldHelpProps;
    salesLabel: (
      label: ReactNode,
      key: QuotationFieldHelpKey,
    ) => ReactNode;
    automaticProps: (label: string) => QuotationFieldHelpProps;
  };
  notifySuccess: (content: string) => void;
  notifyWarning: (content: string) => void;
  notifyError: (content: string) => void;
  messages: {
    createSuccess: string;
    updateSuccess: string;
    loadDetailError: string;
    customerMaterialsLoadError: string;
    customerPriceLoadError: string;
    lineCustomFieldsLoadError: string;
  };
}

export interface QuotationFormDrawerProps {
  open: boolean;
  quotationId?: string;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (createdQuotation?: QuotationRecord) => void;
  capabilities: QuotationFormDrawerCapabilities;
}
