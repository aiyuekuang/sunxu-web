import type { ReactNode } from 'react';
import type { MouseEvent } from 'react';
import type { Dayjs } from 'dayjs';
import type { GanttViewState, GanttBarPresentation, GanttBarLayout, GanttInspectorModel, GanttMenuAction, CapacitySummaryPoint, UnscheduledPanelCapabilities, GanttToolbarCapabilities } from './production-schedule-planning-types';
import type { ScheduleHeatmapCapabilities, ScheduleHeatmapWeekCell } from './production-schedule-widget-types';

export type ScheduleAlgorithm = 'greedy' | 'critical_path';
export type ScheduleDirection = 'forward' | 'backward';
export type DispatchRule = 'edd' | 'spt' | 'cr' | 'wspt' | 'fifo';
export type ScheduleStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type ScheduleBufferSource = 'company_default' | 'manual_override' | 'legacy_migration';

export interface SchedulePageQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
  status?: string;
  executionState?: string;
}

export interface SchedulePage<T> {
  list: T[];
  total: number;
}

export interface ScheduleBufferPolicy {
  defaultBufferRatio: number;
  allowBufferRatioOverride: boolean;
  defaultRescheduleHorizonDays?: number;
  defaultRescheduleFreezeMinutes?: number;
  defaultRescheduleAllowAlternativeEquipment?: boolean;
  defaultRescheduleAllowMoveConfirmed?: boolean;
  defaultRescheduleMaxDelayMinutes?: number;
  defaultRescheduleMaxOverdueCount?: number;
  defaultRescheduleMaxReconfirmCount?: number;
  setupRuleEnabled?: boolean;
  preferSameSetupGroup?: boolean;
  setupTransitionRules?: readonly Record<string, unknown>[];
  setupStartRestriction?: Record<string, unknown>;
}

export interface ScheduleAppliedPolicy extends ScheduleBufferPolicy {
  bufferRatio: number;
  source?: ScheduleBufferSource;
}

export interface ScheduleWorkOrderRow {
  id: string;
  orderNo: string;
  plannedQty?: number;
  planEndTime?: string | null;
  status?: string;
  executionState?: string;
  material?: { id?: string; code?: string; name?: string; spec?: string; unit?: string; thumbnailUrl?: string; primaryImageUrl?: string };
  routeId?: string;
}

export interface SchedulePlanRow {
  id: string;
  planNo: string;
  plannedQty?: number;
  priority: number;
  dueDate?: string | null;
  planEndDate?: string | null;
  status?: string;
  material?: { id?: string; code?: string; name?: string; spec?: string; unit?: string };
  route?: { code?: string; name?: string } | null;
  workOrderCount?: number;
  activeWorkOrderCount?: number;
  routeId?: string;
}

export interface SchedulePreviewEntry {
  id?: string;
  workOrderId?: string;
  workOrderNo?: string;
  workOrderPlanEndTime?: string | null;
  planId?: string;
  planNo?: string;
  operationId?: string | null;
  operationName?: string | null;
  workCenterId?: string | null;
  workCenterName?: string | null;
  equipmentId?: string | null;
  equipmentName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  plannedStart: string;
  plannedEnd: string;
  setupStartTime?: string;
  productionStartTime?: string;
  durationMinutes?: number;
  setupMinutes?: number;
  setupSource?: string;
  runMinutes?: number;
  timeBreakdownSource?: 'schedule_entry_snapshot' | 'operation_snapshot' | 'manual_entry' | 'buffer_entry' | 'unknown';
  splitGroup?: string | null;
  splitQty?: number | null;
  isCritical?: boolean;
  isBuffer?: boolean;
  isOutsourced?: boolean;
  assigneeId?: string | null;
  warnings?: string[];
}

export interface ScheduleBomOutsourcingRow {
  workOrderId: string;
  workOrderNo?: string;
  planNo?: string;
  materialId: string;
  materialCode?: string | null;
  materialName?: string | null;
  materialSpec?: string | null;
  grossQty?: number | null;
  stockOffsetQty?: number | null;
  outsourceQty: number;
  unit: string;
  orderNo?: string | null;
}

export interface SchedulePreviewResult {
  total: number;
  entries: SchedulePreviewEntry[];
  warnings: string[];
  criticalPath?: string[];
  appliedPolicy?: ScheduleAppliedPolicy;
  bomOutsourcing?: ScheduleBomOutsourcingRow[];
}

export interface ScheduleAutoResult {
  total: number;
  entries: SchedulePreviewEntry[];
  appliedPolicy?: ScheduleAppliedPolicy;
  warnings?: string[];
}

export interface SchedulePlanResult {
  planCount: number;
  workOrderCount: number;
  entryCount: number;
  appliedPolicy?: ScheduleAppliedPolicy;
  warnings: string[];
  bomOutsourcing?: ScheduleBomOutsourcingRow[];
}

export interface SchedulePlanWorkOrder {
  id: string;
  parentWorkOrderId?: string | null;
  workOrderNo: string;
  workOrderType?: string;
  materialCode?: string | null;
  materialName?: string | null;
  status: string;
  statusLabel: string;
  plannedQty?: number;
  completedQty?: number;
  scrappedQty?: number;
  progress: number;
}

export interface SchedulePolicyAndActionCapabilities {
  loadPolicy: () => Promise<ScheduleBufferPolicy>;
  reportError: (error: unknown, context: { operation: string; routeIds?: readonly string[] }) => void;
  notify: (kind: 'success' | 'warning' | 'error', content: string) => void;
  formatAppliedPolicy?: (policy?: ScheduleAppliedPolicy) => string;
}

export interface AutoScheduleCapabilities extends SchedulePolicyAndActionCapabilities {
  canRun: boolean;
  loadWorkOrders: (query: SchedulePageQuery & { status: 'released'; executionState: 'unscheduled' }) => Promise<SchedulePage<ScheduleWorkOrderRow>>;
  preview: (input: { workOrderIds: string[]; algorithm: ScheduleAlgorithm; bufferRatio: number }) => Promise<SchedulePreviewResult>;
  submit: (input: { workOrderIds: string[]; algorithm: ScheduleAlgorithm; bufferRatio: number }) => Promise<ScheduleAutoResult>;
  algorithmOptions?: readonly { value: ScheduleAlgorithm; label: string; tip?: string }[];
  bufferOptions?: readonly { value: number; label: string }[];
}

export interface AutoScheduleDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onViewResult?: (focusDate?: string) => void;
  capabilities: AutoScheduleCapabilities;
}

export interface ScheduleFromPlansCapabilities extends SchedulePolicyAndActionCapabilities {
  canRun: boolean;
  loadPlans: (query: SchedulePageQuery & { status: 'confirmed' }) => Promise<SchedulePage<SchedulePlanRow>>;
  loadPlanWorkOrders: (planId: string) => Promise<SchedulePlanWorkOrder[]>;
  preview: (input: { planIds: string[]; direction: ScheduleDirection; dispatchRule: DispatchRule; bufferRatio: number; autoCreateWorkOrders: true; forceReplace?: boolean }) => Promise<SchedulePreviewResult>;
  submit: (input: { planIds: string[]; direction: ScheduleDirection; dispatchRule: DispatchRule; bufferRatio: number; autoCreateWorkOrders: true; forceReplace?: boolean }) => Promise<SchedulePlanResult>;
  directionOptions?: readonly { value: ScheduleDirection; label: string; tip?: string }[];
  dispatchRuleOptions?: readonly { value: DispatchRule; label: string; tip?: string }[];
  bufferOptions?: readonly { value: number; label: string }[];
  workOrderTypeLabels?: Readonly<Record<string, { text: string; color?: string }>>;
}

export interface ScheduleFromPlansDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialKeyword?: string;
  onViewResult?: (focusDate?: string) => void;
  capabilities: ScheduleFromPlansCapabilities;
}

export interface BottleneckItem {
  workCenterId?: string | null;
  workCenterName: string;
  avgUtilization: number;
  avgOccupiedUtilization?: number;
  peakUtilization: number;
  peakOccupiedUtilization?: number;
  peakDate: string;
  occupiedPeakDate?: string;
  overloadDays: number;
  occupiedOverloadDays?: number;
  totalEquipmentCount: number;
  availableEquipmentCount: number;
  unavailableEquipmentCount: number;
  configuredConcurrency: number;
  effectiveConcurrency: number;
  capacityConstrainedByEquipment?: boolean;
  availabilityRisk?: boolean;
  scheduledWithoutCapacity?: boolean;
  suggestions: string[];
  totalWorkingDays?: number;
}

export interface BottleneckFilters {
  startDate: string;
  endDate: string;
  zoom?: string;
  workCenterId?: string;
  workCenterType?: string;
  customerId?: string;
  keyword?: string;
  statusFilter?: string[];
}

export interface BottleneckCapabilities {
  load: (filters: BottleneckFilters) => Promise<BottleneckItem[]>;
  getAnalysisRange?: (filters: BottleneckFilters) => Pick<BottleneckFilters, 'startDate' | 'endDate'>;
  reportError: (error: unknown) => void;
  getCapacityColor: (rate: number) => string;
  formatCompactNumber?: (value: number) => string;
  presets?: readonly { label: string; value: [string, string] }[];
}

export interface BottleneckPanelProps {
  filters?: BottleneckFilters;
  capabilities: BottleneckCapabilities;
}

export interface ScenarioRecord {
  id: string;
  name: string;
  algorithm: ScheduleAlgorithm;
  createdAt: string;
  entries: SchedulePreviewEntry[];
  warnings: string[];
  criticalPath?: string[];
  appliedPolicy?: ScheduleAppliedPolicy;
}

export interface ScenarioCompareCapabilities extends SchedulePolicyAndActionCapabilities {
  canGenerate: boolean;
  canApply: boolean;
  loadWorkOrders: (query: SchedulePageQuery & { status: 'released'; executionState: 'unscheduled' }) => Promise<SchedulePage<ScheduleWorkOrderRow>>;
  preview: (input: { workOrderIds: string[]; algorithm: ScheduleAlgorithm }) => Promise<SchedulePreviewResult>;
  apply: (input: { workOrderIds: string[]; algorithm: ScheduleAlgorithm }) => Promise<void>;
  algorithmOptions?: readonly { value: ScheduleAlgorithm; label: string }[];
}

export interface ScenarioCompareProps {
  onApply: () => void;
  capabilities: ScenarioCompareCapabilities;
}

export interface ScheduleOperationOption {
  id: string;
  sequence: number;
  stageName?: string;
  operationName: string;
  status?: string;
  workCenterId?: string | null;
  allowedEquipmentIds?: string[];
  equipmentType?: string | null;
  isOutsourced?: boolean;
  scheduleSlots?: readonly unknown[];
}

export interface WorkOrderScheduleDetail {
  id: string;
  orderNo: string;
  status: string;
  operations?: ScheduleOperationOption[] | null;
  scheduleSlots?: readonly unknown[];
  hasWholeOrderSchedule?: boolean;
  supplierName?: string | null;
}

export interface ScheduleSelectOption { label: string; value: string; disabled?: boolean; routeId?: string }

export interface ScheduleWorkCenterOptionNode {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  children?: readonly ScheduleWorkCenterOptionNode[];
}

export interface ScheduleEntryRecord {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  companyId?: string;
  workOrderId?: string;
  operationId?: string | null;
  executionSource?: 'in_house' | 'outsourced';
  outsourcingOrderId?: string | null;
  planNo?: string | null;
  workOrder?: { id?: string; orderNo?: string; planNo?: string; routeId?: string; planEndTime?: string | null; plannedQty?: number; material?: { id?: string; name?: string; code?: string; spec?: string; unit?: string; thumbnailUrl?: string; primaryImageUrl?: string } };
  operation?: { id?: string; operationName?: string; sequence?: number };
  operationName?: string;
  workCenterId?: string | null;
  workCenter?: { id?: string; code?: string; name?: string; type?: string };
  equipmentId?: string | null;
  equipment?: { id?: string; code?: string; name?: string; type?: string };
  supplierId?: string | null;
  supplier?: { id?: string; name?: string };
  outsourcingOrder?: { id?: string; orderNo?: string };
  occupiedStartAt?: string | null;
  occupiedEndAt?: string | null;
  actualStartAt?: string | null;
  actualEndAt?: string | null;
  assigneeId?: string | null;
  assignee?: { realName?: string; username?: string };
  runtimeStatus?: string;
  plannedStart?: string | null;
  plannedEnd?: string | null;
  durationMinutes?: number;
  setupMinutes?: number | null;
  setupSource?: string | null;
  runMinutes?: number | null;
  isBuffer?: boolean;
  splitQty?: number;
  splitGroup?: string | null;
  status: ScheduleStatus;
  isOutsourced?: boolean;
  reconfirmRequired?: boolean;
  isFirm?: boolean;
  firmReason?: string | null;
  planningVersion?: number;
  derivedFromEntryId?: string | null;
  dependencyConflict?: boolean;
  dependencyConflictReason?: string;
  dependencyWarning?: string;
  predecessorSummary?: string;
  availableActions?: readonly string[];
  workOrderNo?: string | null;
  workOrderPlanEndTime?: string | null;
  operationSequence?: number | null;
  workCenterName?: string | null;
  equipmentName?: string | null;
  supplierName?: string | null;
  assigneeName?: string | null;
}

export interface ScheduleEntryFormValues {
  workOrderId?: string;
  operationId?: string;
  workCenterId?: string;
  equipmentId?: string;
  assigneeId?: string;
  plannedStart?: string | Date | Dayjs;
  plannedEnd?: string | Date | Dayjs;
}

export interface ScheduleEntryFormCapabilities extends SchedulePolicyAndActionCapabilities {
  canCreate: boolean;
  canUpdate: boolean;
  loadReleasedWorkOrders: (query: { keyword?: string; page: number; pageSize: number }) => Promise<ScheduleSelectOption[]>;
  resolveScannedWorkOrder: (scanValue: string) => Promise<{ id: string; status: string; label: string; routeId?: string }>;
  loadWorkOrderDetail: (workOrderId: string) => Promise<WorkOrderScheduleDetail>;
  loadWorkCenterTree: () => Promise<readonly ScheduleWorkCenterOptionNode[]>;
  loadEquipment: (query: { workCenterId?: string; equipmentType?: string; keyword?: string }) => Promise<ScheduleSelectOption[]>;
  loadAssignees: (query: { keyword?: string }) => Promise<ScheduleSelectOption[]>;
  create: (input: Required<Pick<ScheduleEntryFormValues, 'workOrderId' | 'plannedStart' | 'plannedEnd'>> & ScheduleEntryFormValues) => Promise<{ warnings?: string[]; dependencyWarning?: string; dependencyConflictReason?: string }>;
  update: (id: string, input: { plannedStart: string; plannedEnd?: string; assigneeId?: string; equipmentId?: string }) => Promise<{ warnings?: string[] }>;
  serializeDateTime: (value: string | Date | Dayjs) => string;
  getCurrentUserId?: () => string | undefined;
  openConfiguration?: (target: 'workOrders' | 'workCenter' | 'equipment') => void;
  fieldHelp?: Partial<Record<'workOrderId' | 'operationId' | 'workCenterId' | 'equipmentId' | 'plannedStart' | 'plannedEnd' | 'assigneeId', ReactNode>>;
}

export interface EntryFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEntry: ScheduleEntryRecord | null;
  onSuccess: () => void;
  prefillWorkOrderId?: string;
  prefillWorkCenterId?: string;
  prefillPlannedStart?: string;
  capabilities: ScheduleEntryFormCapabilities;
}

export interface ScheduleEntryListQuery extends SchedulePageQuery {
  entryId?: string;
  workOrderId?: string;
  operationId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface ScheduleEntryListCapabilities extends SchedulePolicyAndActionCapabilities {
  load: (query: ScheduleEntryListQuery) => Promise<SchedulePage<ScheduleEntryRecord>>;
  confirm: (ids: string[]) => Promise<void>;
  unconfirm: (ids: string[]) => Promise<void>;
  unplan: (ids: string[], input: { reasonCode: string; reason: string }) => Promise<void>;
  remove: (id: string) => Promise<{ cancelledWorkOrderNo?: string }>;
  formatStatus: (status: ScheduleStatus) => { label: string; color: string };
  formatUnit?: (unit?: string) => string;
  dateRangePresets?: readonly { label: string; value: [string, string] }[];
}

export interface EntryListProps {
  onEdit: (entry: ScheduleEntryRecord) => void;
  onRefresh: () => void;
  refreshKey: number;
  initialEntryId?: string;
  initialWorkOrderId?: string;
  initialOperationId?: string;
  canUpdate: boolean;
  canDelete: boolean;
  capabilities: ScheduleEntryListCapabilities;
}

export interface ProductionScheduleGanttRow {
  workCenter: { id: string; name: string; type?: string; workCenterId?: string | null; equipmentId?: string | null; hasChildren?: boolean };
  bars: readonly GanttBarLayout<ScheduleEntryRecord>[];
  laneCount: number;
  height?: number;
  barHeight?: number;
  barGap?: number;
  heatmap?: readonly ScheduleHeatmapWeekCell[];
}

export type ScheduleGanttInteractionWarning =
  | 'outsourcing-row'
  | 'unassigned-row'
  | 'non-leaf-work-center'
  | 'invalid-time-range';

export interface ScheduleGanttDropTarget {
  rowId: string;
  rowType?: ProductionScheduleGanttRow['workCenter']['type'];
  workCenterId?: string | null;
  equipmentId?: string | null;
}

export interface ScheduleGanttDragChanges {
  plannedStart?: string;
  plannedEnd?: string;
  workCenterId?: string;
  equipmentId?: string;
  clearEquipment?: boolean;
}

export interface ScheduleGanttDragCommit {
  entry: ScheduleEntryRecord;
  kind: 'move' | 'resize-left' | 'resize-right';
  changes: ScheduleGanttDragChanges;
  timeChanged: boolean;
  resourceChanged: boolean;
}

export interface ProductionScheduleGanttViewProps {
  state: GanttViewState;
  onStateChange: (patch: Partial<GanttViewState>) => void;
  refreshKey: number;
  focusDate?: string | null;
  onAnalysisQueryChange?: (query: { startDate: string; endDate: string; zoom: string; workCenterId?: string; workCenterType?: string; customerId?: string; keyword?: string; statusFilter?: string[] }) => void;
  getWindowAnchoredAt?: (date: string, zoom: string) => { startDate: string; endDate: string };
  loading: boolean;
  error?: ReactNode;
  rows: readonly ProductionScheduleGanttRow[];
  productionDayWarnings?: number;
  cells: readonly { date: string; label: string; isWeekend?: boolean; isToday?: boolean }[];
  cellWidth: number;
  timelineWidth: number;
  resourcePanelWidth?: number;
  timelineStart: import('dayjs').Dayjs;
  timelineEnd: import('dayjs').Dayjs;
  showCapacity?: boolean;
  capacityData?: readonly CapacitySummaryPoint[] | null;
  heatMax?: number;
  selectedEntryId?: string | null;
  canUpdate: boolean;
  onSelectEntry: (entry: ScheduleEntryRecord | null) => void;
  onEditEntry: (entry: ScheduleEntryRecord) => void;
  onRefresh: () => void;
  onExport: () => void;
  exporting?: boolean;
  onDropWorkOrder?: (workOrderId: string, target: ScheduleGanttDropTarget, plannedStart?: string) => void;
  getBarPresentation: (entry: ScheduleEntryRecord) => GanttBarPresentation;
  getTooltipModel: (entry: ScheduleEntryRecord) => { kind: 'buffer' | 'schedule'; rows: readonly { key: string; label: string; value: ReactNode }[] };
  getInspectorModel: (entry: ScheduleEntryRecord) => GanttInspectorModel;
  getContextMenuItems: (entry: ScheduleEntryRecord) => readonly GanttMenuAction[];
  onContextAction: (entry: ScheduleEntryRecord, actionKey: string) => void;
  onInspectorAction: (entry: ScheduleEntryRecord, actionKey: string) => void;
  capacityCapabilities: import('./production-schedule-planning-types').CapacityBarCapabilities;
  heatmapCapabilities: ScheduleHeatmapCapabilities;
  toolbarCapabilities: GanttToolbarCapabilities;
  unscheduledCapabilities: UnscheduledPanelCapabilities;
  onDragStart: (event: MouseEvent, entry: ScheduleEntryRecord, kind: 'move' | 'resize-left' | 'resize-right', barLeft: number, actualBarWidth: number, displayBarWidth: number, displayMinWidth: number) => void;
  onDragCommit: (input: ScheduleGanttDragCommit) => void | Promise<void>;
  onInteractionWarning: (warning: ScheduleGanttInteractionWarning) => void;
  getDatePosition: (date: string | Dayjs) => number;
  getDateAtPosition: (position: number) => string;
  getDroppedWorkOrderId: (dataTransfer: DataTransfer) => string | undefined;
  restoreContextMenuFocus: () => void;
  labels?: { empty: string; resourcePanel: string; orderCount: (count: number) => string; laneCount: (count: number) => string };
}
