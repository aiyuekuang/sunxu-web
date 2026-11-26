import type { FormItemProps, ModalProps } from 'antd';
import type { UploadFile } from 'antd/es/upload';
import type { Dayjs } from 'dayjs';
import type { ProFormSelectProps } from '@ant-design/pro-components';
import type { StockLocationSelectCapabilities } from '../inventory/stock-location-select-field-types';
import type { ProductionBatchNoFieldCapabilities } from './production-batch-no-field-types';
import type { WorkOrderAllocatedSerialsButtonCapabilities } from './work-order-allocated-serials-types';

export type WorkOrderReportTimeSource = 'manual' | 'session' | 'iot' | 'derived';
export type WorkOrderOperationOutputMode =
  | 'quantity'
  | 'quantity_time'
  | 'execution_quantity'
  | 'non_output_execution';
export type WorkOrderPayMode = 'none' | 'piece' | 'time';
export type WorkOrderTimeCaptureMode = 'manual' | 'session_optional' | 'session_required' | 'iot';
export type WorkOrderTraceabilityMode = 'quantity' | 'batch' | 'serial';

export interface WorkOrderReportUser {
  id: string;
  realName?: string | null;
  username?: string | null;
}

export interface WorkOrderReportWarehouse {
  id: string;
  name: string;
  code?: string | null;
}

export interface WorkOrderReportScheduleSlot {
  id: string;
  plannedStart: string;
  plannedEnd: string;
  occupiedStartAt?: string | null;
  occupiedEndAt?: string | null;
  actualStartAt?: string | null;
  actualEndAt?: string | null;
  status?: string | null;
  runtimeStatus?: string | null;
  equipmentId?: string | null;
  equipmentName?: string | null;
  splitQty?: number | null;
  durationMinutes?: number | null;
  reconfirmRequired?: boolean;
  isFirm?: boolean;
  firmReason?: string | null;
  planningVersion?: number;
}

export interface WorkOrderDemandAllocation {
  allocationId: string;
  demandLineId: string;
  demandLineNo: number;
  sourceType: string;
  sourceOrderNo?: string | null;
  sourceRemarkSnapshot?: string | null;
  saleOrderId?: string | null;
  saleOrderItemId?: string | null;
  customerMaterialCode?: string | null;
  customerMaterialName?: string | null;
  customerMaterialSpec?: string | null;
  materialCode?: string | null;
  materialName?: string | null;
  drawingUrls: string[];
  customerId?: string | null;
  customerName?: string | null;
  dueDate?: string | null;
  demandStatus: string;
  productionRequiredQty: number;
  allocatedRequiredQty: number;
  allocatedPlannedQty: number;
  completedGoodQty: number;
  scrappedQty: number;
  fulfilledQty: number;
  createdAt: string;
}

export interface WorkOrderExecutionCapability {
  canRecord: boolean;
  blockReason?: string | null;
  maxAllowedQty?: number | null;
  reasonRequiredBeyond?: number | null;
  inputScale: number;
  isTerminalOperation: boolean;
}

export interface WorkOrderOperation {
  id: string;
  workOrderId: string;
  sequence: number;
  operationName: string;
  processOperationId?: string | null;
  assigneeId?: string | null;
  assignee?: WorkOrderReportUser;
  plannedQty?: number | null;
  completedQty?: number | null;
  scrappedQty?: number | null;
  executionQty?: number | null;
  executionQtyTarget?: number | null;
  executionUnit?: string | null;
  operationOutputMode?: WorkOrderOperationOutputMode | string | null;
  operationReportAffectsOutput?: boolean | null;
  operationReportUnit?: string | null;
  operationReportBaseProductQty?: number | null;
  operationReportTargetQty?: number | null;
  operationReportRoundingMode?: 'none' | 'ceil' | 'round' | 'floor' | string | null;
  operationReportPrecision?: number | null;
  operationReportRemainingQty?: number | null;
  operationReportReportedQty?: number | null;
  operationReportTargetQtySnapshot?: number | null;
  payModeSnapshot?: WorkOrderPayMode | string | null;
  payPreview?: unknown;
  timeCaptureMode?: WorkOrderTimeCaptureMode | string | null;
  allowZeroQuantityReport?: boolean;
  maxReportQty?: number | null;
  workCenterId?: string | null;
  equipmentType?: string | null;
  allowedEquipmentIds?: string[] | null;
  scheduleSlots?: WorkOrderReportScheduleSlot[];
  executionCapability?: WorkOrderExecutionCapability;
}

export interface WorkOrderEquipmentSession {
  id: string;
  equipmentId: string;
  startedAt: string;
}

export interface WorkOrderReportResult {
  toolingLifeWarnings?: Array<{ message: string }> | null;
}

export interface WorkOrderReportOperationPayload {
  workOrderId: string;
  operationId: string;
  demandLineId?: string;
  scheduleEntryId?: string;
  completedQty: number;
  scrappedQty?: number;
  reportedOperationQty?: number;
  reportedOperationScrappedQty?: number;
  actualSetupMinutes?: number;
  durationMinutes?: number;
  abnormalDurationConfirmed?: boolean;
  abnormalDurationNote?: string;
  equipmentSessionId?: string;
  startedAt?: string;
  endedAt?: string;
  timeSource?: WorkOrderReportTimeSource;
  zeroQuantityReason?: string;
  equipmentId?: string;
  occurredAt?: string;
  remark?: string;
  scrapReason?: string;
  scrapPhotoUrls?: string[];
  photoUrls?: string[];
  scrappedSerialNumbers?: string[];
  workCenterId?: string;
  batchNo?: string;
  reporterId?: string;
  isAuxiliary?: boolean;
  overrideReceiptWarehouseId?: string;
  receiptLocationId?: string;
  storageLocation?: string;
  receiptWarehouseChangeReason?: string;
}

export interface WorkOrderRecordExecutionPayload {
  workOrderId: string;
  operationId: string;
  scheduleEntryId?: string;
  equipmentSessionId?: string;
  equipmentId?: string;
  workCenterId?: string;
  reporterId?: string;
  startedAt?: string;
  endedAt?: string;
  durationMinutes?: number;
  actualSetupMinutes?: number;
  executionQty?: number;
  executionUnit?: string;
  timeSource?: WorkOrderReportTimeSource;
  executionReason?: string;
  remark?: string;
  occurredAt?: string;
}

export interface WorkOrderDirectReportPayload {
  id: string;
  scheduleEntryId?: string;
  equipmentId?: string;
  occurredAt?: string;
  completedQty: number;
  scrappedQty?: number;
  scrappedSerialNumbers?: string[];
  demandLineId?: string;
  scrapReason?: string;
  scrapPhotoUrls?: string[];
  photoUrls?: string[];
  batchNo?: string;
  remark?: string;
  reporterId?: string;
  overrideReceiptWarehouseId?: string;
  receiptLocationId?: string;
  storageLocation?: string;
  receiptWarehouseChangeReason?: string;
}

export interface WorkOrderScrapPolicyPreview {
  matched: boolean;
  policyName: string | null;
  requiresPhoto: boolean;
  requiresQualityJudgement: boolean;
  requiresRootCause: boolean;
  holdBatch: boolean;
  actionMessage: string;
}

export interface WorkOrderScrapPolicyRequest {
  materialId: string;
  customerId?: string;
  operationId?: string;
  processOperationId?: string;
  scrapReason?: string;
  completedQty: number;
  scrappedQty: number;
  plannedQty?: number;
}

export interface WorkOrderSelectOption {
  label: string;
  value: string;
  [key: string]: unknown;
}

export type WorkOrderSelectRequest = NonNullable<ProFormSelectProps['request']>;
/** Form item metadata is spread onto ProForm controls; children belongs to Form.Item composition. */
export type WorkOrderFieldHelpProps = Omit<Partial<FormItemProps>, 'children'>;

export interface WorkOrderReportCapabilities {
  currentUser: WorkOrderReportUser | null;
  operationUnitOptions: WorkOrderSelectOption[];
  operationUnitLoading: boolean;
  operationUnitLabelMap: Readonly<Record<string, string>>;
  materialUnitLabelMap: Readonly<Record<string, string>>;
  outputModeLabels: Readonly<Record<string, { text: string; status?: string; color?: string }>>;
  payModeLabels: Readonly<Record<string, { text: string; status?: string; color?: string }>>;
  timeCaptureModeLabels: Readonly<Record<string, { text: string; status?: string; color?: string }>>;
  reportTimeSourceOptions: Array<{ label: string; value: string }>;
  formatUnitLabel: (unit?: string | null, labels?: Readonly<Record<string, string>>) => string;
  convertOperationQtyToProductQty: (qty: number, operation: WorkOrderOperation) => number;
  convertProductQtyToOperationQty: (qty: number, operation: WorkOrderOperation) => number;
  getOperationReportUnitLabel: (
    operation: WorkOrderOperation,
    productUnit?: string | null,
    maps?: { productUnitLabelMap: Readonly<Record<string, string>>; operationUnitLabelMap: Readonly<Record<string, string>> },
  ) => string;
  buildOperationReportSummary: (
    operation: WorkOrderOperation,
    productUnit?: string | null,
    maps?: { productUnitLabelMap: Readonly<Record<string, string>>; operationUnitLabelMap: Readonly<Record<string, string>> },
  ) => string;
  formatPayPreviewText: (value: unknown, emptyText?: string) => string;
  formatScheduleSlotLabel: (slot: WorkOrderReportScheduleSlot) => string;
  formatScheduleSlotHint: (slot: WorkOrderReportScheduleSlot) => string;
  formatReportMinutesDaysHint: (minutes: number) => string;
  reasonableReportMinutesMax: number;
  statusColor: (
    value: string,
    map: Readonly<Record<string, { text: string; status?: string; color?: string }>>,
  ) => string;
  toStatusOptions: (
    map: Readonly<Record<string, { text: string; status?: string; color?: string }>>,
  ) => Array<{ label: string; value: string }>;
  getAutoFieldHelpProps: (label: string) => WorkOrderFieldHelpProps;
  getReportFieldHelpProps: (label: string, fieldName: string) => WorkOrderFieldHelpProps;
  scrollableModalProps: ModalProps;
  requestReporterOptions: WorkOrderSelectRequest;
  requestAvailableEquipmentOptions: WorkOrderSelectRequest;
  loadCurrentEquipmentSession: () => Promise<WorkOrderEquipmentSession | null>;
  loadDemandAllocations: (workOrderId: string) => Promise<WorkOrderDemandAllocation[]>;
  reportOperation: (payload: WorkOrderReportOperationPayload) => Promise<WorkOrderReportResult>;
  endSessionAndReportOperation: (
    payload: WorkOrderReportOperationPayload & { equipmentSessionId: string },
  ) => Promise<WorkOrderReportResult>;
  recordOperationExecution: (payload: WorkOrderRecordExecutionPayload) => Promise<void>;
  reportDirect: (payload: WorkOrderDirectReportPayload) => Promise<void>;
  uploadPhotos: (files: UploadFile[]) => Promise<string[]>;
  previewScrapPolicy: (
    params: WorkOrderScrapPolicyRequest,
  ) => Promise<WorkOrderScrapPolicyPreview | null>;
  getErrorMessage: (error: unknown, fallback: string) => string;
  reportSuccessMessage: string;
  stockLocationCapabilities: StockLocationSelectCapabilities;
  productionBatchNoCapabilities: ProductionBatchNoFieldCapabilities;
  allocatedSerialCapabilities: WorkOrderAllocatedSerialsButtonCapabilities;
}

// Names mirror the host OpenAPI symbols so the migrated source's payload shapes remain recognizable.
export type WorkOrderDemandAllocationTraceDto = WorkOrderDemandAllocation;
export type OperationScheduleSlotDto = WorkOrderReportScheduleSlot;
export type Warehouse = WorkOrderReportWarehouse;
export type EquipmentSession = WorkOrderEquipmentSession;
export type WorkOrderOperationExecutionCapabilityDto = WorkOrderExecutionCapability;
export type ReportTimeSource = WorkOrderReportTimeSource;
export type RecordOperationExecutionDto = WorkOrderRecordExecutionPayload;
export type ReportOperationDto = WorkOrderReportOperationPayload;
export type WorkOrderReportResultVo = WorkOrderReportResult;
