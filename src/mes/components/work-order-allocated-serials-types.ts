export interface WorkOrderAllocatedSerial {
  id: string;
  serialNo: string;
  status: string;
  batchNo?: string | null;
}

export interface WorkOrderAllocatedSerialStatusLabel {
  label: string;
  color: string;
}

export type WorkOrderAllocatedSerialStatusMap = Readonly<
  Record<string, WorkOrderAllocatedSerialStatusLabel | undefined>
>;

export interface WorkOrderAllocatedSerialsButtonCapabilities {
  listSerialsForWorkOrder: (
    workOrderId: string,
  ) => Promise<WorkOrderAllocatedSerial[]>;
  getErrorMessage: (error: unknown, fallback: string) => string;
  statusLabels: WorkOrderAllocatedSerialStatusMap;
  allocatedStatus: string;
}

export interface WorkOrderAllocatedSerialsButtonProps {
  workOrderId: string;
  capabilities: WorkOrderAllocatedSerialsButtonCapabilities;
}
