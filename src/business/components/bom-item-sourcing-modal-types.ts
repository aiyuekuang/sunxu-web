export interface BomSupplierSourcingPriceTier {
  id: string;
  supplierId: string;
  supplier?: { name?: string | null } | null;
  grade?: string | null;
  unitPrice?: number | null;
  currency?: string | null;
  status?: string | null;
}

export interface BomItemSourcingOption {
  materialSupplierPriceTierId: string;
  supplier?: { name?: string | null } | null;
  priceTier?: BomSupplierSourcingPriceTier | null;
  isPreferred: boolean;
  priority?: number | null;
}

export interface BomItemSourcingSavedWarning {
  message: string;
}

export interface BomItemSourcingModalCapabilities {
  loadOptions: (params: { bomItemId: string }) => Promise<{
    options?: readonly BomItemSourcingOption[] | null;
  } | null | undefined>;
  loadPriceTiers: (params: {
    materialId: string;
    page: 1;
    pageSize: 100;
  }) => Promise<{ list?: readonly BomSupplierSourcingPriceTier[] | null }>;
  saveOptions: (params: {
    bomItemId: string;
    options: Array<{
      materialSupplierPriceTierId: string;
      isPreferred: boolean;
      priority?: number;
    }>;
  }) => Promise<{ warnings?: readonly BomItemSourcingSavedWarning[] | null } | void>;
  notifyWarning: (message: string) => void;
  notifySuccess: (message: string) => void;
}

export interface BomItemSourcingModalProps {
  open: boolean;
  bomItemId?: string;
  materialId?: string;
  materialName?: string;
  capabilities: BomItemSourcingModalCapabilities;
  onClose: () => void;
}
