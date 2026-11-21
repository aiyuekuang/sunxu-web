import type { ModalProps } from 'antd';
import type { UploadFile } from 'antd/es/upload';
import type { WorkOrderDemandAllocation, WorkOrderOperation, WorkOrderReportScheduleSlot, WorkOrderSelectRequest, WorkOrderFieldHelpProps, WorkOrderEquipmentSession } from './work-order-report-types';

export interface WorkOrderBatchOperation extends WorkOrderOperation {
  status?: string | null;
  remainingQty?: number | null;
  reportedQty?: number | null;
  inputQty?: number | null;
  isOutsourced?: boolean | null;
  readyState?: string | null;
  qualityBlockReason?: string | null;
  reportBlockReason?: string | null;
  predecessorOperationIds?: string[] | null;
  predecessorDependencies?: Array<{
    predecessorOperationId: string;
    transferBatchQty?: number | null;
    minGoodQty?: number | null;
  }> | null;
  transferBatchQty?: number | null;
  scheduleSlots?: WorkOrderReportScheduleSlot[];
}

export interface WorkOrderBatchReportDemandAllocation extends WorkOrderDemandAllocation {}

export interface WorkOrderBatchReportItemPayload {
  operationId: string;
  scheduleEntryId?: string;
  equipmentId?: string;
  occurredAt: string;
  completedQty: number;
  demandLineId?: string;
  scrappedQty?: number;
  scrapReason?: string;
  scrapPhotoUrls?: string[];
  photoUrls?: string[];
  remark?: string;
  isAuxiliary?: boolean;
  reporterId?: string;
}

export interface WorkOrderBatchReportResult {
  summary: { success: number; failed: number };
  results: Array<{ operationId: string; success: boolean; error?: string | null }>;
}

export interface WorkOrderBatchReportCapabilities {
  currentUser: { id: string; realName?: string | null; username?: string | null } | null;
  requestReporterOptions: WorkOrderSelectRequest;
  requestAvailableEquipmentOptions: WorkOrderSelectRequest;
  loadCurrentEquipmentSession: () => Promise<WorkOrderEquipmentSession | null>;
  uploadPhotos: (files: UploadFile[]) => Promise<string[]>;
  batchReport: (input: { workOrderId: string; items: WorkOrderBatchReportItemPayload[] }) => Promise<WorkOrderBatchReportResult>;
  getAutoFieldHelpProps: (label: string) => WorkOrderFieldHelpProps;
  getReportFieldHelpProps: (label: string, fieldName: string) => WorkOrderFieldHelpProps;
  formatScheduleSlotLabel: (slot: WorkOrderReportScheduleSlot) => string;
  formatScheduleSlotHint: (slot: WorkOrderReportScheduleSlot) => string;
  ceilAllocatedQty: (value: number) => number;
  scrollableModalProps: ModalProps;
  getErrorMessage: (error: unknown, fallback: string) => string;
  notify: {
    info: (message: string) => void;
    success: (message: string) => void;
    error: (message: string) => void;
  };
  showPartialFailure: (input: {
    success: number;
    failed: number;
    failures: Array<{ operationId: string; operationName: string; error: string }>;
  }) => void;
}
