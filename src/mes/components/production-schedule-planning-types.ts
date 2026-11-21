import type { AlertProps, ButtonProps } from 'antd';
import type { CSSProperties, DragEvent, MouseEvent, ReactElement, ReactNode } from 'react';
import type { Dayjs } from 'dayjs';

export type ScheduleOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

export interface GanttViewState {
  startDate: string;
  endDate: string;
  zoom: string;
  groupBy: string;
  workCenterType?: string;
  statusFilter?: string[];
  customerId?: string;
  keyword?: string;
  drillPath: Array<{ id?: string; name: string }>;
}

export interface GanttDateWindow {
  startDate: string;
  endDate: string;
}

export interface GanttToolbarLabels {
  previousPeriod: string;
  nextPeriod: string;
  today: string;
  productionDate: (range: string) => string;
  dateRangeTitle: string;
  filters: string;
  refresh: string;
  export: string;
  exportTitle: string;
  fullscreen: string;
  exitFullscreen: string;
  unscheduled: string;
  unscheduledSelected: string;
  workCenterType: string;
  statusFilter: string;
  customer: string;
  keywordPlaceholder: string;
  clearFilters: string;
};

export interface GanttToolbarCapabilities {
  zoomOptions: readonly ScheduleOption[];
  groupByOptions: readonly ScheduleOption[];
  workCenterTypeOptions: readonly ScheduleOption[];
  workCenterTypeLoading: boolean;
  statusOptions: readonly ScheduleOption[];
  customerOptions: readonly ScheduleOption[];
  labels: GanttToolbarLabels;
  formatDateRange: (startDate: string, endDate: string) => string;
  shiftDateWindow: (
    state: GanttViewState,
    direction: -1 | 1,
  ) => GanttDateWindow;
  getTodayWindow: (zoom: string) => GanttDateWindow;
  getZoomWindow: (zoom: string) => GanttDateWindow;
}

export interface GanttToolbarProps {
  state: GanttViewState;
  onStateChange: (patch: Partial<GanttViewState>) => void;
  onRefresh: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  showUnscheduled: boolean;
  onToggleUnscheduled: () => void;
  onExport: () => void;
  exporting?: boolean;
  capabilities: GanttToolbarCapabilities;
}

export type GanttDragKind = 'move' | 'resize-left' | 'resize-right';

export interface GanttEntryGeometry {
  left: number;
  width: number;
  actualWidth: number;
  displayMinWidth: number;
  lane: number;
}

export interface GanttDensityMetrics {
  barHeight: number;
  barGap: number;
  rowHeight?: number;
}

export interface GanttExecutionVisual {
  label: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  trackColor: string;
  progressColor: string;
}

export interface GanttBarPresentation {
  isBuffer: boolean;
  isCritical: boolean;
  isOutsourced: boolean;
  canMove: boolean;
  canResize: boolean;
  canEdit: boolean;
  hasDependencyConflict: boolean;
  hasDependencyWarning: boolean;
  execution: GanttExecutionVisual;
  barBackgroundColor: string;
  actualTrackColor: string;
  actualProgressColor: string;
  setupBackground: string;
  setupBorderColor: string;
  outsourcingColor: string;
  outsourcingBackgroundColor: string;
  criticalShadow: string;
  bufferSuffix: string;
  scheduleStatus: { label: string; color: string };
  borderColor: string;
  borderStyle: CSSProperties['borderStyle'];
  dependencyBadgeLabel?: string;
  dependencyExplanation?: string;
  primaryLabel: string;
  compactPrimaryLabel: string;
  secondaryLabel: string;
  compactSecondaryLabel: string;
  timeRangeLabel: string;
  durationOrderLabel?: string;
  progressPercent: number;
  setupFraction: number;
  outsourcingLabel: string;
  ariaLabel: string;
  title?: string;
}

export interface GanttBarLayout<TEntry> extends GanttEntryGeometry {
  entry: TEntry;
  id: string;
  color: string;
  label: string;
}

export interface GanttBarCapabilities<TEntry> {
  onDragStart: (
    event: MouseEvent,
    entry: TEntry,
    kind: GanttDragKind,
    barLeft: number,
    actualBarWidth: number,
    displayBarWidth: number,
    displayMinWidth: number,
  ) => void;
  onSelect: (entry: TEntry) => void;
  onDoubleClick?: (entry: TEntry) => void;
  onContextMenu?: (event: MouseEvent, entry: TEntry) => void;
}

export interface GanttTooltipRow {
  key: string;
  label: string;
  value: ReactNode;
}

export interface GanttTooltipModel {
  kind: 'buffer' | 'schedule';
  rows: readonly GanttTooltipRow[];
}

export interface GanttTooltipProps {
  model: GanttTooltipModel;
  children: ReactNode;
  disabled?: boolean;
}

export interface GanttMenuAction {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export interface GanttContextMenuCapabilities<TEntry> {
  menuLabel: string;
  onAction: (entry: TEntry, actionKey: string) => void;
  restoreFocus: () => void;
}

export interface GanttContextMenuProps<TEntry> {
  visible: boolean;
  x: number;
  y: number;
  entry: TEntry | null;
  items: readonly GanttMenuAction[];
  onClose: () => void;
  capabilities: GanttContextMenuCapabilities<TEntry>;
}

export interface GanttInspectorField {
  key: string;
  label: string;
  value?: ReactNode;
}

export interface GanttInspectorSection {
  key: string;
  title: string;
  icon?: ReactNode;
  fields: readonly GanttInspectorField[];
}

export interface GanttInspectorAction {
  key: string;
  label: string;
  icon?: ReactNode;
  type?: ButtonProps['type'];
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export interface GanttInspectorModel {
  kicker: string;
  title: ReactNode;
  heroTitle: ReactNode;
  heroSubtitle?: ReactNode;
  status: { label: string; color: string };
  sections: readonly GanttInspectorSection[];
  dependency?: {
    title: string;
    fields: readonly GanttInspectorField[];
    guidance?: {
      type: NonNullable<AlertProps['type']>;
      title: string;
      description: ReactNode;
      actions?: readonly GanttInspectorAction[];
    };
  };
  footerActions: readonly GanttInspectorAction[];
  labels: { close: string };
}

export interface GanttInspectorCapabilities<TEntry> {
  onAction: (entry: TEntry, actionKey: string) => void;
}

export interface GanttInspectorProps<TEntry> {
  entry: TEntry;
  model: GanttInspectorModel;
  onClose: () => void;
  capabilities: GanttInspectorCapabilities<TEntry>;
}

export interface CapacitySummaryPoint {
  date: string;
  totalMinutes: number;
  scheduledMinutes: number;
  occupiedMinutes: number;
  utilizationRate: number;
  occupiedUtilizationRate: number;
  configuredConcurrency: number;
  effectiveConcurrency: number;
  totalEquipmentCount: number;
  availableEquipmentCount: number;
  unavailableEquipmentCount: number;
}

export interface CapacityBarLabels {
  summaryTitle: string;
  tooltipTitle: (date: string) => string;
  availableCapacity: string;
  plannedLoad: string;
  actualOccupancy: string;
  noCapacityRisk: string;
  equipmentLaneNote: string;
  equipmentSnapshot: string;
  unavailableSuffix: (count: number) => string;
  effectiveConcurrency: string;
}

export interface CapacityBarCapabilities {
  getDatePosition: (date: string) => number;
  getCapacityColor: (utilizationRate: number) => string;
  formatDuration: (minutes: number) => string;
  warningThreshold: number;
  maximumDisplayRate: number;
  labels: CapacityBarLabels;
}

export interface CapacityBarProps {
  data: readonly CapacitySummaryPoint[] | null;
  loading?: boolean;
  resourcePanelWidth: number;
  timelineWidth: number;
  dayPixelWidth: number;
  capabilities: CapacityBarCapabilities;
}

export interface UnscheduledWorkOrder {
  id: string;
  orderNo: string;
  plannedQty: number;
  planEndTime?: string;
  customer?: { name?: string };
  material?: { name: string; spec?: string; unit?: string };
  planNo?: string | null;
  sourceOrderNo?: string | null;
  customerMaterialCode?: string | null;
  customerMaterialName?: string | null;
  customerMaterialSpec?: string | null;
  sourceRemark?: string | null;
}

export interface UnscheduledPanelLabels {
  title: string;
  searchPlaceholder: string;
  empty: string;
  sourceRemark: string;
  scheduleAction: string;
}

export interface UnscheduledPanelCapabilities {
  /** Host applies the source query contract: released + unscheduled, page 1, size 100. */
  loadWorkOrders: (params: {
    keyword?: string;
    page: number;
    pageSize: number;
  }) => Promise<UnscheduledWorkOrder[]>;
  /** Host owns JSON transfer payload/effect flags and the schedule drop contract. */
  beginScheduleDrag: (
    workOrder: UnscheduledWorkOrder,
    event: DragEvent<HTMLDivElement>,
  ) => void;
  formatUnit: (unitCode?: string) => string;
  formatDueDate: (date: string) => string;
  activateWorkOrder: (workOrder: UnscheduledWorkOrder) => void;
  reportLoadError: (error: unknown) => void;
  labels: UnscheduledPanelLabels;
}

export interface UnscheduledPanelProps {
  refreshKey: number;
  capabilities: UnscheduledPanelCapabilities;
}

export interface BatchReleaseDraftLine {
  plannedQty: number | string;
  dueDate?: string | null;
}

export type BatchReleaseDateValue = Dayjs | string;

export interface BatchReleaseLineValue {
  plannedQty: number;
  dueDate?: BatchReleaseDateValue;
}

export interface BatchReleaseFormValues {
  lines?: BatchReleaseLineValue[];
}

export interface BatchReleaseLabels {
  title: (planNo: string) => string;
  linesLabel: string;
  addLine: string;
  plannedQuantity: string;
  plannedQuantityRequired: string;
  dueDate: string;
  saveSuccess: string;
}

export interface BatchReleaseCapabilities {
  /** Host loads only editable draft lines; completed/released/linked lines stay protected. */
  loadEditableDraftLines: (planId: string) => Promise<BatchReleaseDraftLine[]>;
  saveDraftLines: (
    planId: string,
    lines: readonly { plannedQty: number; dueDate?: string }[],
  ) => Promise<void>;
  serializeDate: (value?: BatchReleaseDateValue) => string | undefined;
  notifySaved: (message: string) => void;
  minimumPlannedQuantity: number;
  labels: BatchReleaseLabels;
}

export interface BatchReleaseModalProps {
  planId: string;
  planNo: string;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: () => void;
  capabilities: BatchReleaseCapabilities;
}
