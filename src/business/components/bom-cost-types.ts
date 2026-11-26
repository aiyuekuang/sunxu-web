export interface BomCostApprovedSubstitute {
  substituteMaterialId: string;
  substituteMaterialCode?: string | null;
  substituteMaterialName?: string | null;
  conversionFactor?: number | null;
}

export interface BomCostPreviewCandidate {
  priceTierId: string;
  isPreferred?: boolean;
  isDefault?: boolean;
  grade?: string | null;
  supplierName?: string | null;
  supplierId: string;
  unitPrice?: number | null;
  currency?: string | null;
}

export interface BomCostPreviewLine {
  bomItemId: string;
  materialId: string;
  materialCode?: string | null;
  materialName?: string | null;
  originalMaterialId?: string | null;
  originalMaterialName?: string | null;
  substituteMaterialId?: string | null;
  unit?: string | null;
  removed?: boolean;
  requiredQty?: number | null;
  computedQty?: number | null;
  overrideQty?: number | null;
  availableQty?: number | null;
  stockQty?: number | null;
  reservedQty?: number | null;
  frozenQty?: number | null;
  shortageQty?: number | null;
  adjustReason?: string | null;
  lineCost?: number | null;
  unitPrice?: number | null;
  currency?: string | null;
  selectedPriceTierId?: string | null;
  selectedSupplierId?: string | null;
  selectedGrade?: string | null;
  priceSource?: string | null;
  candidates?: BomCostPreviewCandidate[];
  approvedSubstitutes: BomCostApprovedSubstitute[];
  lineCapabilities?: {
    canChangeQuantity?: boolean;
    canDelete?: boolean;
    canSubstitute?: boolean;
  };
}

export interface BomCostPreviewSnapshot {
  lines: BomCostPreviewLine[];
  totalMaterialCost?: number | null;
  hasUnpriced?: boolean;
  warnings?: string[];
}

export interface MesBomCostSnapshotCapabilities {
  requestCostPreview: (params: {
    bomHeaderId: string;
    productQty?: number;
    asOfDate?: string;
    bomCostSnapshot?: BomCostPreviewSnapshot;
  }) => Promise<{ snapshot?: BomCostPreviewSnapshot | null }>;
  unitLabelMap?: Readonly<Record<string, string>>;
}
