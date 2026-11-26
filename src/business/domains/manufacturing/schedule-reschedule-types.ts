import type { CSSProperties, ReactNode } from 'react';

export interface RescheduleSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface RescheduleFieldHelpProps {
  label: string;
  tooltip?: {
    title: ReactNode;
    styles?: { root?: CSSProperties };
  };
}

export interface RescheduleFormValues {
  sourceType: string;
  sourceId: string;
  reasonCode: string;
  triggerMode?: string;
  previousPriority?: number;
  targetPriority?: number;
  horizonDays?: number;
  freezeMinutes?: number;
  protectConfirmed?: boolean;
  allowMoveConfirmed?: boolean;
  protectedWorkOrderIds?: string[];
  allowAlternativeEquipment?: boolean;
  allowSplit?: boolean;
  maxDelayMinutes?: number;
  maxOverdueCount?: number;
  maxReconfirmCount?: number;
  scopeWorkCenterIds?: string[];
  remark?: string;
}

export interface ReschedulePolicyDefaults {
  defaultRescheduleHorizonDays: number;
  defaultRescheduleFreezeMinutes: number;
  defaultRescheduleAllowAlternativeEquipment: boolean;
  defaultRescheduleAllowMoveConfirmed: boolean;
  defaultRescheduleMaxDelayMinutes: number;
  defaultRescheduleMaxOverdueCount: number;
  defaultRescheduleMaxReconfirmCount: number;
}

export interface RescheduleImpactEntry {
  entryId?: string | null;
  action: string;
  workOrderId: string;
  workOrderNo?: string | null;
  operationId?: string | null;
  operationSequence?: number | null;
  operationName?: string | null;
  oldStart?: string | null;
  oldEnd?: string | null;
  newStart?: string | null;
  newEnd?: string | null;
  oldWorkCenterId?: string | null;
  oldWorkCenterName?: string | null;
  newWorkCenterId?: string | null;
  newWorkCenterName?: string | null;
  oldEquipmentId?: string | null;
  oldEquipmentName?: string | null;
  newEquipmentId?: string | null;
  newEquipmentName?: string | null;
  durationMinutes: number;
  delayMinutes: number;
  reconfirmRequired: boolean;
  reason?: string | null;
  remainingQty?: number | null;
}

export interface RescheduleSummary {
  insertedEntryCount: number;
  shiftedEntryCount: number;
  reconfirmCount: number;
  overdueCount: number;
  maxDelayMinutes: number;
}

export interface ReschedulePreview {
  feasible: boolean;
  runId: string;
  previewToken: string;
  warnings: string[];
  materialReadiness: string;
  supplyRisk: string;
  summary: RescheduleSummary;
  insertedEntries: RescheduleImpactEntry[];
  shiftedEntries: RescheduleImpactEntry[];
}

export interface RescheduleRun {
  id: string;
  createdAt: string;
  status: string;
  reasonCode: string;
  insertedEntryCount: number;
  shiftedEntryCount: number;
  reconfirmCount: number;
  materialReadiness: string;
  supplyRisk: string;
  warnings: string[];
}

export interface RescheduleRunDetail {
  run: RescheduleRun;
  details: RescheduleImpactEntry[];
}

export interface RescheduleHistoryPage {
  list?: RescheduleRun[];
  total?: number;
}

export interface RescheduleCommitResult {
  summary: Pick<RescheduleSummary, 'insertedEntryCount' | 'shiftedEntryCount'>;
}

export interface RescheduleSourceRef {
  sourceType: string;
  sourceId: string;
}

export interface RescheduleDisplayStatus {
  text: string;
  color?: string;
  status?: string;
}

export interface ScheduleRescheduleDictionary {
  sourceTypes: {
    plan: string;
    workOrder: string;
    scheduleEntry: string;
    equipmentFault: string;
  };
  sourceTypeOptions: readonly RescheduleSelectOption[];
  sourceTypeLabels: Readonly<Record<string, string>>;
  /** Host values for the source and temporary-protection candidate status queries. */
  eligibleWorkOrderStatuses: {
    rescheduleSource: readonly string[];
    protectionCandidates: readonly string[];
  };
  reasonCodes: {
    urgentOrder: string;
    manualAdjustment: string;
    equipmentFault: string;
  };
  reasonOptions: readonly RescheduleSelectOption[];
  reasonLabels: Readonly<Record<string, RescheduleDisplayStatus>>;
  triggerModes: {
    manual: string;
    priorityChange: string;
  };
  impactActions: {
    inserted: string;
    shifted: string;
    unplanned: string;
    all: string;
  };
  impactActionOptions: readonly RescheduleSelectOption[];
  impactActionLabels: Readonly<Record<string, string>>;
  runStatuses: Readonly<Record<string, RescheduleDisplayStatus>>;
  materialReadiness: Readonly<Record<string, RescheduleDisplayStatus>>;
  materialReadinessValues: {
    ready: string;
    blockedByShortage: string;
  };
  supplyRisk: Readonly<Record<string, RescheduleDisplayStatus>>;
  supplyRiskValues: {
    none: string;
    blocked: string;
  };
  thresholdWarningMarker: string;
}

export interface RescheduleNotification {
  type: 'success' | 'warning' | 'info' | 'error';
  content: string;
}

export interface RescheduleActionErrorContext {
  stage: 'policy' | 'preview' | 'commit';
  fallback: string;
  routeAction?: 'process-routes';
}

export interface RescheduleCapabilities {
  permissions: {
    canPreview: boolean;
    canCommit: boolean;
    canMoveConfirmed: boolean;
  };
  dictionary: ScheduleRescheduleDictionary;
  fieldHelp: (field: string) => RescheduleFieldHelpProps;
  loadPolicy: () => Promise<ReschedulePolicyDefaults>;
  /** Returns the original plan/work-order search options, including disabled labels/reasons. */
  loadSourceOptions: (params: {
    sourceType: string;
    keyword?: string;
    page: number;
    pageSize: number;
    eligibleWorkOrderStatuses: readonly string[];
  }) => Promise<RescheduleSelectOption[]>;
  /** Returns only eligible released/in-progress work orders, excluding the current source. */
  loadProtectedWorkOrderOptions: (params: {
    keyword?: string;
    page: number;
    pageSize: number;
    statuses: readonly string[];
    excludedWorkOrderIds: string[];
  }) => Promise<RescheduleSelectOption[]>;
  preview: (values: RescheduleFormValues & {
    protectedWorkOrderIds: string[];
  }) => Promise<ReschedulePreview>;
  commit: (params: { previewToken: string }) => Promise<RescheduleCommitResult>;
  loadHistory: (params: {
    sourceType: string;
    sourceId: string;
    page: number;
    pageSize: number;
  }) => Promise<RescheduleHistoryPage>;
  loadRunDetail: (runId: string) => Promise<RescheduleRunDetail>;
  notify: (notification: RescheduleNotification) => void;
  reportActionError: (
    error: unknown,
    context: RescheduleActionErrorContext,
  ) => void;
  openMaterialRisk: (source: RescheduleSourceRef) => void;
  openSupplyRisk: (source: RescheduleSourceRef) => void;
}

export interface RescheduleDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  capabilities: RescheduleCapabilities;
  sourceType?: string;
  sourceId?: string;
  sourceLabel?: string;
  initialReasonCode?: string;
  followUpReplan?: boolean;
  triggerMode?: string;
  previousPriority?: number;
  targetPriority?: number;
  equipmentFaultRecovery?: boolean;
}

export interface CalendarHistoryTarget {
  kind: 'shift' | 'exception';
  id: string;
  name: string;
}

export interface CalendarAuditRecord {
  id: string;
  createdAt: string;
  action: string;
  userName?: string | null;
  description?: string | null;
}

export interface CalendarHistoryPage {
  list?: CalendarAuditRecord[];
  total?: number;
}

export interface CalendarHistoryCapabilities {
  loadHistory: (params: {
    kind: CalendarHistoryTarget['kind'];
    resourceId: string;
    page: number;
    pageSize: number;
  }) => Promise<CalendarHistoryPage>;
  actionLabels: Readonly<Record<string, string>>;
}

export interface ChangeHistoryModalProps {
  target: CalendarHistoryTarget | null;
  onClose: () => void;
  capabilities: CalendarHistoryCapabilities;
}
