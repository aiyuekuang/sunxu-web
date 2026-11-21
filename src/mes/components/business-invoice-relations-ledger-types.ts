export interface BusinessInvoiceSettlementRelation {
  settlementId: string;
  settlementNo: string;
  type: string;
  status: string;
  amount?: number | null;
  paidAmount?: number | null;
  residualAmount?: number | null;
  billingStatus: string;
  sourceNo?: string | null;
  accountingStatus?: string | null;
  voucherNo?: string | null;
  accountingError?: string | null;
}

export interface BusinessInvoiceRelations {
  settlements: BusinessInvoiceSettlementRelation[];
  priceVisible: boolean;
}

export interface BusinessInvoiceRelationStatusLabel {
  text: string;
  color?: string;
}

export type BusinessInvoiceRelationStatusMap = Readonly<
  Record<string, BusinessInvoiceRelationStatusLabel | undefined>
>;

export interface BusinessInvoiceRelationsLedgerCapabilities {
  canViewSettlement: boolean;
  canViewVoucher: boolean;
  openSettlement: (settlementId: string) => void;
  openVoucherList: () => void;
  invoiceTypeMap: BusinessInvoiceRelationStatusMap;
  settlementStatusMap: BusinessInvoiceRelationStatusMap;
  billingStatusMap: BusinessInvoiceRelationStatusMap;
  accountingStatusMap: BusinessInvoiceRelationStatusMap;
}

export interface BusinessInvoiceRelationsLedgerProps {
  canViewPrices: boolean;
  isConfirmed: boolean;
  relations?: BusinessInvoiceRelations;
  capabilities: BusinessInvoiceRelationsLedgerCapabilities;
}
