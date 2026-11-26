export type WarehouseSelectScope = 'all' | 'nonLineSide';

export interface WarehouseSelectOption {
  label: string;
  value: string;
  warehouseType: string;
  sortOrder: number;
  code?: string | null;
  name?: string | null;
  createdAt?: string | null;
}

/** The host owns the authenticated warehouse list and option factory. */
export interface WarehouseRemoteSelectCapabilities {
  requestOptions: (params: {
    keyWords?: string;
    scope: WarehouseSelectScope;
    typeFamilies?: readonly string[];
  }) => Promise<WarehouseSelectOption[]>;
}
