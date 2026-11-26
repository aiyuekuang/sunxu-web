import type { ReactNode } from 'react';

export interface SupplierPriceTierOption {
  label: string;
  value: string;
}

export interface SupplierPriceTierSummaryRecord {
  id: string;
  grade?: string | null;
  isDefault: boolean;
  priority?: number | null;
  currency?: string | null;
  unitPrice: number | string;
}

export interface SupplierPriceTierRecord extends SupplierPriceTierSummaryRecord {
  materialId: string;
  supplierId: string;
  supplierMaterialId?: string | null;
  supplierMaterialCode?: string | null;
  supplierModelCode?: string | null;
  supplierSpec?: string | null;
  priceUnit?: string | null;
  taxRate?: number | null;
  priceIncludesTax: boolean;
  validFrom: string;
  validTo?: string | null;
  minOrderQty?: number | null;
  maxOrderQty?: number | null;
  leadTimeDays?: number | null;
  quotaPercent?: number | null;
  status: 'active' | 'inactive';
  remarks?: string | null;
}

export interface SupplierPriceTierContext {
  materialId: string;
  supplierId: string;
  material?: {
    id: string;
    code?: string | null;
    name?: string | null;
    unit?: string | null;
  } | null;
  supplier?: {
    id: string;
    name?: string | null;
    supplierCode?: string | null;
  } | null;
  supplierMaterialCode?: string | null;
  leadTimeDays?: number | null;
  minOrderQty?: number | null;
}

export interface SupplierPriceTierListResult {
  list?: SupplierPriceTierRecord[] | null;
  total?: number | null;
}

export interface SupplierPriceTierUnitConversion {
  unit?: string | null;
  baseUnit?: string | null;
  factorToBase: number;
}

export interface CreateSupplierPriceTierInput {
  materialId: string;
  supplierId: string;
  grade?: string;
  unitPrice: number;
  priceUnit?: string;
  supplierMaterialCode?: string;
  supplierModelCode?: string;
  supplierSpec?: string;
  taxRate?: number;
  priceIncludesTax?: boolean;
  currency: string;
  validFrom?: string;
  validTo?: string;
  priority?: number;
  quotaPercent?: number;
  minOrderQty?: number;
  maxOrderQty?: number;
  isDefault?: boolean;
  leadTimeDays?: number;
  remarks?: string;
}

export interface UpdateSupplierPriceTierInput {
  id: string;
  unitPrice?: number;
  priceUnit?: string;
  taxRate?: number;
  priceIncludesTax?: boolean;
  supplierMaterialCode?: string;
  supplierModelCode?: string;
  supplierSpec?: string;
  validTo?: string;
  priority?: number;
  quotaPercent?: number;
  minOrderQty?: number;
  maxOrderQty?: number;
  isDefault?: boolean;
  leadTimeDays?: number;
  status?: 'active' | 'inactive';
  remarks?: string;
}

export type SupplierPriceTierMutation = 'create' | 'update' | 'delete';

/** Dictionary labels, permissions, requests and mutations stay in the MES host. */
export interface MesSupplierPriceTierCapabilities {
  materialGradeOptions?: readonly SupplierPriceTierOption[];
  materialGradeLabelMap?: Readonly<Record<string, string>>;
  currencyOptions?: readonly SupplierPriceTierOption[];
  unitLabelMap?: Readonly<Record<string, string>>;
  defaultCurrency?: string;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  remarksTooltip?: ReactNode;
  requestCurrencyOptions?: () => Promise<readonly SupplierPriceTierOption[]>;
  requestPriceTiers?: (params: {
    materialId: string;
    supplierId: string;
    page: number;
    pageSize: number;
  }) => Promise<SupplierPriceTierListResult | null | undefined>;
  requestUnitConversions?: (params: {
    materialId: string;
    page: number;
    pageSize: number;
  }) => Promise<{ list?: SupplierPriceTierUnitConversion[] | null } | null | undefined>;
  createPriceTier?: (
    input: CreateSupplierPriceTierInput,
  ) => Promise<unknown>;
  updatePriceTier?: (
    input: UpdateSupplierPriceTierInput,
  ) => Promise<unknown>;
  removePriceTier?: (input: { id: string }) => Promise<unknown>;
  onMutationSuccess?: (mutation: SupplierPriceTierMutation) => void;
}

export interface MaterialSupplierPriceTierFormValues
  extends Partial<
    Omit<CreateSupplierPriceTierInput, 'unitPrice' | 'currency'> &
      Omit<UpdateSupplierPriceTierInput, 'id' | 'unitPrice'>
  > {
  id?: string;
  unitPrice?: number | null;
  currency?: string;
}
