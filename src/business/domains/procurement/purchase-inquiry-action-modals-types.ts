import type { ReactNode } from 'react';
import type { FilterableSelectRequestFn } from '../inventory/material-select-types';

export type PurchaseInquiryAction =
  | 'register-quote'
  | 'award'
  | 'bind-materials'
  | 'convert';

export interface PurchaseInquiryMaterialSummary {
  name?: string | null;
}

export interface PurchaseInquiryItemSummary {
  id: string;
  materialId?: string | null;
  temporaryItemName?: string | null;
  temporaryItemCode?: string | null;
  material?: PurchaseInquiryMaterialSummary | null;
  purchaseQty?: number | null;
  inquiryQty?: number | null;
}

export interface PurchaseInquirySupplierSummary {
  supplierId?: string | null;
  supplier?: { name?: string | null } | null;
}

export interface PurchaseInquiryDetail {
  id: string;
  items?: PurchaseInquiryItemSummary[] | null;
  suppliers?: PurchaseInquirySupplierSummary[] | null;
}

export interface PurchaseInquiryComparisonQuote {
  id: string;
  unitPrice: number | string;
  supplierId?: string | null;
  supplier?: { name?: string | null } | null;
}

export interface PurchaseInquiryComparisonLine {
  inquiryItem: PurchaseInquiryItemSummary;
  quotes: PurchaseInquiryComparisonQuote[];
}

export interface PurchaseInquiryComparison {
  items?: PurchaseInquiryComparisonLine[] | null;
}

export interface PurchaseInquiryQuoteItemInput {
  inquiryItemId: string;
  quoteQty: number;
  unitPrice: number;
}

export interface PurchaseInquiryActionCapabilities {
  /** Permission result only; permission codes and policy remain host-owned. */
  canPerformAction: (action: PurchaseInquiryAction) => boolean;
  loadDetail: (request: { id: string }) => Promise<PurchaseInquiryDetail>;
  compareQuotes: (request: { id: string }) => Promise<PurchaseInquiryComparison>;
  bindMaterials: (request: {
    id: string;
    items: Array<{ itemId: string; materialId: string }>;
  }) => Promise<unknown>;
  award: (request: {
    id: string;
    awardReason: string;
    items: Array<{ inquiryItemId: string; quotationItemId: string }>;
  }) => Promise<unknown>;
  convertToOrders: (request: {
    id: string;
    updateMaterialSupplierPrice?: boolean;
  }) => Promise<unknown>;
  registerQuotation: (request: {
    id: string;
    supplierId: string;
    quoteDate?: string;
    validUntil?: string;
    paymentTerms?: string;
    taxRate?: number;
    freightAmount?: number;
    remarks?: string;
    items: PurchaseInquiryQuoteItemInput[];
  }) => Promise<unknown>;
  requestActiveMaterials: FilterableSelectRequestFn;
  /** Maps to the host's configuration route/link and preserves the source refresh-after-return behavior. */
  renderMaterialConfigEntryLabel: (props: {
    target: 'material';
    children: ReactNode;
    show: boolean;
    onOpen: () => void;
  }) => ReactNode;
  /** Returns an unsubscribe callback for the host window's focus event. */
  subscribeToWindowFocus: (listener: () => void) => () => void;
  notifications: {
    success: (message: string) => void;
    warning: (message: string) => void;
  };
  /** Host supplies the existing MSG constants for successful mutations. */
  messages: {
    saveSuccess: string;
    confirmSuccess: string;
    convertSuccess: string;
  };
}

export interface PurchaseInquiryActionModalsProps {
  inquiry: PurchaseInquiryDetail | null;
  action: PurchaseInquiryAction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void | Promise<void>;
  capabilities: PurchaseInquiryActionCapabilities;
}

export interface PurchaseInquiryQuoteFormValues {
  supplierId?: string;
  quoteDate?: string | { format: (pattern: string) => string };
  validUntil?: string | { format: (pattern: string) => string };
  paymentTerms?: string;
  taxRate?: number;
  freightAmount?: number;
  remarks?: string;
  quoteItems?: Record<string, { quoteQty?: number; unitPrice?: number }>;
}

export interface PurchaseInquiryAwardFormValues {
  awardReason: string;
}

export interface PurchaseInquiryConvertFormValues {
  updateMaterialSupplierPrice?: boolean;
}
