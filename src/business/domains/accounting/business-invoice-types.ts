export type BusinessInvoiceMode = 'purchase' | 'sales';
export type PurchaseInvoiceSourceType = 'purchase_order' | 'purchase_receipt';
export type SalesInvoiceSourceType = 'sale_order' | 'sale_delivery';
export type BusinessInvoiceCategory = 'blue' | 'red';
export type BusinessInvoiceStatus = 'draft' | 'confirmed' | 'cancelled';
export type InvoiceCoverageStatus = 'not_billed' | 'partial_billed' | 'billed';

export interface InvoiceCoverageAllocation {
  invoiceId: string;
  invoiceLineId: string;
  invoiceNo: string;
  invoiceDate: string;
  status: BusinessInvoiceStatus;
  category: BusinessInvoiceCategory;
  invoiceTotalAmount?: number | null;
  allocatedQuantity: number;
  allocatedAmount?: number | null;
}

export interface InvoiceCoverageReference {
  invoiceId: string;
  invoiceNo: string;
  invoiceDate: string;
  status: BusinessInvoiceStatus;
  category: BusinessInvoiceCategory;
  invoiceTotalAmount?: number | null;
  allocatedQuantity: number;
  allocatedAmount?: number | null;
}

export interface InvoiceCoverageLine {
  sourceLineId: string;
  materialId?: string | null;
  itemName: string;
  itemCode?: string | null;
  billableQuantity: number;
  billedQuantity: number;
  remainingQuantity: number;
  billableAmount?: number | null;
  billedAmount?: number | null;
  remainingAmount?: number | null;
  returnedQuantity: number;
  returnedAmount?: number | null;
  pendingRedAmount?: number | null;
  status: InvoiceCoverageStatus;
  pricingStatus: 'priced' | 'unpriced';
  invoiceAllocations: InvoiceCoverageAllocation[];
}

export interface InvoiceReadinessIssue {
  code: 'missing_price' | 'draft_occupied';
  message: string;
  sourceLineId: string;
  materialId?: string | null;
  itemCode?: string | null;
  itemName: string;
  missingFields: ('unitPrice' | 'amount')[];
}

export interface InvoiceCoverageResponse {
  sourceId: string;
  sourceNo: string;
  invoiceCount: number;
  billableQuantity: number;
  billedQuantity: number;
  billableAmount?: number | null;
  billedAmount?: number | null;
  pendingRedAmount?: number | null;
  status: InvoiceCoverageStatus;
  pricingStatus: 'priced' | 'partially_priced' | 'unpriced';
  canCreateDraft: boolean;
  blockingReasons?: InvoiceReadinessIssue[];
  invoices: InvoiceCoverageReference[];
  lines: InvoiceCoverageLine[];
  priceVisible: boolean;
}

export interface BusinessInvoiceCoverageCapabilities {
  canView: (mode: BusinessInvoiceMode) => boolean;
  canCreate: (mode: BusinessInvoiceMode) => boolean;
  requestPurchaseCoverage: (params: {
    sourceType: PurchaseInvoiceSourceType;
    sourceId: string;
  }) => Promise<InvoiceCoverageResponse>;
  requestSalesCoverage: (params: {
    sourceType: SalesInvoiceSourceType;
    sourceId: string;
  }) => Promise<InvoiceCoverageResponse>;
  createPurchaseFromSource: (params: {
    sourceType: PurchaseInvoiceSourceType;
    sourceId: string;
  }) => Promise<{ id: string }>;
  createSalesFromSource: (params: {
    sourceType: SalesInvoiceSourceType;
    sourceId: string;
  }) => Promise<{ id: string }>;
  /** The host must preserve its current location as the invoice returnTo state. */
  openInvoice: (params: {
    mode: BusinessInvoiceMode;
    invoiceId: string;
  }) => void;
}
