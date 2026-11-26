export interface WorkOrderSelectOption {
  label: string;
  value: string;
  code?: string | null;
  name?: string | null;
}

export interface WorkOrderScanRecord {
  id: string;
  orderNo: string;
  status: string;
  executionState?: string;
  plannedQty: number;
  completedQty: number;
  scrappedQty: number;
  reportedQty: number;
  progress: number;
  materialName?: string | null;
  materialUnit?: string | null;
}

export type WorkOrderSelectRequest = (params?: {
  keyWords?: string;
}) => Promise<WorkOrderSelectOption[]>;

export interface WorkOrderScanSelectCapabilities {
  requestWorkOrders: WorkOrderSelectRequest;
  parseScannedWorkOrder: (params: {
    code: string;
  }) => Promise<{ workOrder?: WorkOrderScanRecord | null }>;
}
