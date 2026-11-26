import type { ReactNode } from 'react';
import type { StatusMap } from '../../../components/StatusDisplay';

export type TraceIdentifierType = 'batch' | 'serial';
export type TraceTimelineDirection = 'forward' | 'backward' | 'both';

export interface TraceMaterialReference {
  name?: string | null;
  code?: string | null;
  spec?: string | null;
  unit?: string | null;
}

export interface TraceBatchLookup {
  id: string;
  batchNo: string;
  status: string;
  qty: number;
  material?: TraceMaterialReference | null;
  warehouse?: { name?: string | null } | null;
}

export interface TraceContextItem {
  role: string;
  label: string;
}

export interface TraceEnvironmentItem {
  dataType: string;
  count: number;
  unit?: string | null;
  min?: number | null;
  max?: number | null;
}

export interface TraceMeasurementItem {
  label: string;
  measuredValue?: string | null;
  unit?: string | null;
  passed?: boolean | null;
}

export interface TraceGraphNodeContext {
  man?: TraceContextItem[] | null;
  machine?: TraceContextItem[] | null;
  material?: TraceContextItem[] | null;
  method?: TraceContextItem[] | null;
  environment?: TraceEnvironmentItem[] | null;
  measurement?: TraceMeasurementItem[] | null;
}

export interface TraceGraphNode {
  id: string;
  type: string;
  title: string;
  subtitle?: string | null;
  occurredAt?: string | null;
  status?: string | null;
  qty?: number | null;
  unit?: string | null;
  remarks?: string | null;
  photoUrls?: string[] | null;
  context?: TraceGraphNodeContext | null;
  missingContext?: string[] | null;
}

export interface TraceGraphEdge {
  from: string;
  to: string;
  label?: string | null;
}

export interface TraceGraphSummary {
  batchCount: number;
  workOrderCount: number;
  qualityCount: number;
  customerCount: number;
}

export interface TraceGraphWarning {
  message: string;
}

export interface TraceGraph {
  root: TraceGraphNode;
  nodes: TraceGraphNode[];
  edges: TraceGraphEdge[];
  summary: TraceGraphSummary;
  warnings: TraceGraphWarning[];
}

export interface TraceBatchGraphRequest {
  batchId: string;
  direction: TraceTimelineDirection;
  maxDepth: 10;
  contextLevel: 'summary';
  includeDocs: true;
  includeEnvironment: boolean;
  includeMeasurement: true;
}

export interface TraceSerialMovement {
  id: string;
  movementType: string;
  fromStatus?: string | null;
  toStatus: string;
  referenceType?: string | null;
  referenceId?: string | null;
  batchNo?: string | null;
  remarks?: string | null;
  createdAt: string;
}

export interface TraceSerialShipment {
  deliveryItemId?: string | null;
  deliveryNo?: string | null;
  customerName?: string | null;
  shipmentRecordedAt: string;
  remarks?: string | null;
}

export interface TraceSerialProductionReport {
  reportLogId: string;
  occurredAt?: string | null;
  operationName?: string | null;
  scrappedQty: number;
  equipmentName?: string | null;
  remarks?: string | null;
  photoUrls?: string[] | null;
}

export interface TraceSerialProductionReceipt {
  receiptNo: string;
  confirmedAt?: string | null;
  remarks?: string | null;
}

export interface TraceSerialRecord {
  serialNo: string;
  status: string;
  batchId?: string | null;
  batchNo?: string | null;
  material?: TraceMaterialReference | null;
  workOrder?: { orderNo?: string | null } | null;
  sourceDemand?: {
    sourceType: string;
    sourceOrderNo?: string | null;
    demandLineNo: number;
  } | null;
  warehouse?: { name?: string | null } | null;
  productionReport?: TraceSerialProductionReport | null;
  productionReceipt?: TraceSerialProductionReceipt | null;
  shipments: TraceSerialShipment[];
  movements: TraceSerialMovement[];
}

export interface TraceTimelineStatusDictionaries {
  batch: StatusMap;
  workOrder: StatusMap;
  operation: StatusMap;
  inspection: StatusMap;
  disposal: StatusMap;
  productionScrap: StatusMap;
  packageUnit: StatusMap;
  saleDelivery: StatusMap;
  inspectionType: StatusMap;
  disposalType: StatusMap;
  packageType: StatusMap;
}

export interface TraceTimelineDictionaries {
  status: TraceTimelineStatusDictionaries;
  eventLabels: Readonly<Record<string, string>>;
  serialStatusLabels: Readonly<Record<string, string>>;
  reportLogTypeLabels: Readonly<Record<string, string>>;
  serialReferenceLabels: Readonly<Record<string, string>>;
  /** Source contract currently includes batch/work-order/operation/report/stock/receipt/issue/quality/disposal/scrap/package/delivery nodes. */
  batchGraphEventTypes: ReadonlySet<string>;
  unknownStatus: string;
  unknownType: string;
  unknownInspectionType: string;
  unknownDisposalType: string;
  unknownPackageType: string;
  unknownReference: string;
  pendingDisposalLabel: string;
}

export interface TraceTimelineCapabilities {
  /** The host owns lookup APIs and response/error normalization. */
  loadBatchByNumber: (params: { batchNo: string }) => Promise<TraceBatchLookup>;
  loadBatchGraph: (params: TraceBatchGraphRequest) => Promise<TraceGraph>;
  loadSerialTrace: (params: { serialNo: string }) => Promise<TraceSerialRecord>;
  dictionaries: TraceTimelineDictionaries;
  formatDateTimeSeconds: (value: string) => ReactNode;
  formatUnitLabel: (unit?: string | null) => ReactNode;
}

export interface TraceTimelineDrawerProps {
  open: boolean;
  initialIdentifierType?: TraceIdentifierType;
  initialIdentifier?: string;
  onClose: () => void;
  capabilities: TraceTimelineCapabilities;
}
