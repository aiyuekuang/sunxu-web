import type { ReactNode } from 'react';

export type InventoryOwnerType = 'company' | 'customer' | 'supplier';

export interface StockLocationOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface StockLocationPrecheck {
  action: string;
  warehouseId: string;
  locationControlMode: string;
  locationRequired: boolean;
  warnings: string[];
  blockers: string[];
}

export interface StockLocationTreeNode {
  id: string;
  name: string;
  pathName?: string | null;
  allowStock: boolean;
  isActive: boolean;
  children?: StockLocationTreeNode[] | null;
}

export interface StockLocationDistributionItem {
  locationId?: string | null;
  locationCode?: string | null;
  locationName?: string | null;
  locationPath?: string | null;
  availableQty?: number | string | null;
}

export interface StockLocationListItem {
  id: string;
  name: string;
  pathName?: string | null;
  allowStock: boolean;
  isActive: boolean;
}

export interface StockLocationOptionRequestParams {
  warehouseId?: string;
  keyWords?: string;
  materialId?: string;
  batchNo?: string;
  ownerType?: InventoryOwnerType;
  customerId?: string;
  ownerRefId?: string;
  minAvailableQty?: number;
}

export interface StockLocationListRequestParams {
  page: number;
  pageSize: number;
  warehouseId?: string;
  keyword?: string;
  isActive: true;
  allowStock: true;
}

export interface StockLocationTreeRequestParams {
  warehouseId: string;
  activeOnly: true;
  stockOnly: true;
}

export interface StockLocationConfigEntryFieldLabelProps {
  children: ReactNode;
  target: 'warehouseLocations';
  show: boolean;
  onOpen: () => void;
}

/**
 * host owns authorization, policy prechecks and warehouse data. The component only
 * consumes the narrowly-scoped operations needed to render and validate the field.
 */
export interface StockLocationSelectCapabilities {
  canAccessLocations: boolean;
  /**
   * Stable, non-secret key for the active authorization context. Change it when
   * the tenant, signed-in identity, or permission context changes so shared
   * in-flight policy requests cannot cross host security boundaries.
   */
  requestCacheScope: string;
  requestPrecheck: (params: {
    action: string;
    warehouseId: string;
  }) => Promise<StockLocationPrecheck>;
  requestDistribution: (params: Omit<
    StockLocationOptionRequestParams,
    'keyWords'
  > & { warehouseId: string }) => Promise<{
    locations?: StockLocationDistributionItem[] | null;
  } | null>;
  requestLocationList: (
    params: StockLocationListRequestParams,
  ) => Promise<{ list?: StockLocationListItem[] | null } | null>;
  requestLocationTree: (
    params: StockLocationTreeRequestParams,
  ) => Promise<StockLocationTreeNode[] | null>;
  /** host keeps the policy-specific blocker suppression used by this field. */
  filterDisplayBlockers: (blockers: string[]) => string[];
  renderConfigEntryFieldLabel: (
    props: StockLocationConfigEntryFieldLabelProps,
  ) => ReactNode;
}

export interface StockLocationSelectFieldProps
  extends Omit<StockLocationOptionRequestParams, 'keyWords'> {
  capabilities: StockLocationSelectCapabilities;
  name: string;
  label: string;
  action: string;
  textName?: string;
  requiredMessage?: string;
}

export interface StockLocationDependencyFieldProps
  extends Omit<StockLocationSelectFieldProps, 'warehouseId'> {
  warehouseFieldName: string;
  materialFieldName?: string;
  batchFieldName?: string;
  qtyFieldName?: string;
  availableQtyMode?: 'positive' | 'negative' | 'absolute';
}

export interface StockLocationInlineSelectorProps
  extends Omit<StockLocationOptionRequestParams, 'keyWords'> {
  capabilities: StockLocationSelectCapabilities;
  label?: string;
  action: string;
  value?: string;
  storageLocation?: string;
  disabled?: boolean;
  onChange: (patch: {
    locationId?: string;
    storageLocation?: string;
  }) => void;
}
