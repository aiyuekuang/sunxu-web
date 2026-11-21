export interface SelectedWorkOrderRecord {
  id: string;
  orderNo: string;
  plannedQty: number;
  material?: {
    code?: string | null;
    name?: string | null;
    spec?: string | null;
    unit?: string | null;
  } | null;
  materialCode?: string | null;
  materialName?: string | null;
  materialSpec?: string | null;
  spec?: string | null;
  materialUnit?: string | null;
  unit?: string | null;
  baseUnit?: string | null;
  temporaryItemName?: string | null;
  temporaryItemCode?: string | null;
  temporaryItemSpec?: string | null;
}

export interface SelectedWorkOrdersTableCapabilities {
  getMaterialName: (record: SelectedWorkOrderRecord) => string;
  getMaterialCode: (record: SelectedWorkOrderRecord) => string;
  getMaterialSpec: (record: SelectedWorkOrderRecord) => string;
  formatMaterialUnit: (record: SelectedWorkOrderRecord) => string;
  formatPlannedQuantity: (quantity: number) => string;
}

export interface SelectedWorkOrdersTableProps {
  workOrders: SelectedWorkOrderRecord[];
  capabilities: SelectedWorkOrdersTableCapabilities;
}
