import type { ProColumns } from '@ant-design/pro-components';

export type BusinessInvoiceLineTableMode = 'purchase' | 'sales';

export interface BusinessInvoiceLineTableRecord {
  id: string;
  itemName: string;
  itemCode?: string | null;
  material?: { spec?: string | null } | null;
  unit?: string | null;
  quantity: number;
  unitPrice: number | null;
  amountWithoutTax: number | null;
  taxRate: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
  allocations: readonly { sourceNo: string }[];
}

export interface BusinessInvoiceLineTableCapabilities {
  formatNumber: (value: number | null | undefined) => string;
  formatUnitLabel: (unit: string | null | undefined) => string;
  getCustomFieldColumns: (
    mode: BusinessInvoiceLineTableMode,
  ) => ProColumns<BusinessInvoiceLineTableRecord>[];
}

export interface BusinessInvoiceLineTableProps {
  canViewPrices: boolean;
  lines: BusinessInvoiceLineTableRecord[];
  mode: BusinessInvoiceLineTableMode;
  capabilities: BusinessInvoiceLineTableCapabilities;
}
