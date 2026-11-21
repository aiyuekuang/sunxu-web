import type { FormItemProps } from 'antd';
import type { ReactNode } from 'react';
import type { CalendarAuditRecord, CalendarHistoryTarget } from './schedule-reschedule-types';

export type CalendarResourceScope = 'company' | 'workCenter' | 'supplier';
export type CalendarExceptionType = 'holiday' | 'maintenance' | 'overtime';
export type CalendarWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface CalendarSelectOption {
  label: string;
  value: string;
}

export interface CalendarResourceSummary {
  id: string;
  name?: string | null;
  code?: string | null;
}

export interface ShiftCalendarRecord {
  id: string;
  code?: string | null;
  name: string;
  shiftType?: string | null;
  wageMultiplier?: number | null;
  workCenterId?: string | null;
  workCenter?: CalendarResourceSummary | null;
  supplierId?: string | null;
  supplier?: CalendarResourceSummary | null;
  startTime: string;
  endTime: string;
  workingDays?: Array<number | string> | null;
  crossDay?: boolean | null;
  breaks?: Array<{ startTime?: string | null; endTime?: string | null }> | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isActive?: boolean | null;
}

export interface CalendarExceptionRecord {
  id: string;
  workCenterId?: string | null;
  workCenter?: CalendarResourceSummary | null;
  supplierId?: string | null;
  supplier?: CalendarResourceSummary | null;
  exceptionDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isAllDay?: boolean | null;
  startTime?: string | null;
  endTime?: string | null;
  type: CalendarExceptionType;
  shiftCalendarId?: string | null;
  shiftCalendar?: Pick<ShiftCalendarRecord, 'id' | 'name'> | null;
  remarks?: string | null;
}

export interface CalendarPage<T> {
  list?: T[];
  total?: number;
}

export interface ShiftCalendarListParams {
  page: number;
  pageSize: number;
  workCenterId?: string;
  supplierId?: string;
  name?: string;
  type?: CalendarExceptionType;
}

export interface ShiftCalendarUpsertPayload {
  code?: string;
  name?: string;
  shiftType?: string;
  wageMultiplier?: number;
  workCenterId?: string | null;
  supplierId?: string | null;
  startTime?: string;
  endTime?: string;
  workingDays?: number[];
  crossDay?: boolean;
  breaks?: Array<{ startTime: string; endTime: string }>;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isActive?: boolean;
}

export interface CalendarExceptionUpsertPayload {
  workCenterId?: string | null;
  supplierId?: string | null;
  exceptionDate?: string;
  startDate?: string;
  endDate?: string;
  isAllDay?: boolean;
  startTime?: string;
  endTime?: string;
  type: CalendarExceptionType;
  shiftCalendarId?: string | null;
  remarks?: string | null;
}

export type ShiftCalendarFieldHelpKey =
  | 'code'
  | 'name'
  | 'shiftType'
  | 'wageMultiplier'
  | 'resourceScope'
  | 'workCenterId'
  | 'supplierId'
  | 'startTime'
  | 'endTime'
  | 'crossDay'
  | 'breaks'
  | 'workingDays'
  | 'effectiveFrom'
  | 'effectiveTo'
  | 'isActive'
  | 'exceptionStartDate'
  | 'exceptionEndDate'
  | 'exceptionIsAllDay'
  | 'exceptionStartTime'
  | 'exceptionEndTime'
  | 'exceptionType'
  | 'exceptionWorkCenterId'
  | 'exceptionSupplierId'
  | 'exceptionShiftCalendarId'
  | 'remarks';

export type CalendarFieldHelpProps = Pick<FormItemProps, 'label' | 'tooltip' | 'extra'>;

export interface CalendarResourceSelectFieldProps {
  name: 'workCenterId' | 'supplierId';
  target: 'workCenter' | 'supplier';
  label: string;
  placeholder: string;
  options: readonly CalendarSelectOption[];
  requestOptions: (keyword?: string) => Promise<CalendarSelectOption[]>;
  fieldHelpProps: CalendarFieldHelpProps;
  requiredMessage: string;
}

export interface CalendarExceptionTypeDisplay {
  label: string;
  color: string;
}

export type CalendarExceptionTypeDisplayMap = Readonly<
  Record<CalendarExceptionType, CalendarExceptionTypeDisplay>
>;

export type CalendarMessageKey =
  | 'shiftCreated'
  | 'shiftUpdated'
  | 'exceptionCreated'
  | 'exceptionUpdated'
  | 'deleted'
  | 'shiftNameRequired'
  | 'wageMultiplierRequired'
  | 'scopeRequired'
  | 'workCenterRequired'
  | 'supplierRequired'
  | 'startTimeRequired'
  | 'endTimeRequired'
  | 'workingDaysRequired'
  | 'effectiveEndBeforeStart'
  | 'startDateRequired'
  | 'endDateRequired'
  | 'dateRangeRequired'
  | 'typeRequired'
  | 'endDateBeforeStart'
  | 'allDayTimeRequired'
  | 'timeFormatInvalid'
  | 'timeRangeEqual';

export type CalendarShiftMessageSet = Readonly<Record<CalendarMessageKey, string>>;

export type CalendarPermission = 'create' | 'edit' | 'delete' | 'viewHistory';

export interface CalendarDeleteConfirmation {
  title: string;
  content: ReactNode;
  okText: string;
  danger: boolean;
}

export interface ProductionShiftCalendarCapabilities {
  listShiftCalendars: (params: ShiftCalendarListParams) => Promise<CalendarPage<ShiftCalendarRecord>>;
  listCalendarExceptions: (params: ShiftCalendarListParams) => Promise<CalendarPage<CalendarExceptionRecord>>;
  createShiftCalendar: (payload: ShiftCalendarUpsertPayload) => Promise<unknown>;
  updateShiftCalendar: (id: string, payload: ShiftCalendarUpsertPayload) => Promise<unknown>;
  deleteShiftCalendar: (id: string) => Promise<unknown>;
  createCalendarException: (payload: CalendarExceptionUpsertPayload) => Promise<unknown>;
  updateCalendarException: (id: string, payload: CalendarExceptionUpsertPayload) => Promise<unknown>;
  deleteCalendarException: (id: string) => Promise<unknown>;
  confirmDelete: (confirmation: CalendarDeleteConfirmation) => Promise<boolean>;
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
  permissions: Readonly<Record<CalendarPermission, boolean>>;
  workCenterOptions: readonly CalendarSelectOption[];
  supplierOptions: readonly CalendarSelectOption[];
  requestResourceOptions: (
    target: 'workCenter' | 'supplier',
    keyword?: string,
  ) => Promise<CalendarSelectOption[]>;
  scopeLabels: Readonly<Record<CalendarResourceScope, string>>;
  workingDayLabels: Readonly<Record<CalendarWeekday, string>>;
  exceptionTypeDisplay: CalendarExceptionTypeDisplayMap;
  messages: CalendarShiftMessageSet;
  getFieldHelpProps: (field: ShiftCalendarFieldHelpKey) => CalendarFieldHelpProps;
  renderResourceSelect: (props: CalendarResourceSelectFieldProps) => ReactNode;
  loadHistory: (params: {
    kind: CalendarHistoryTarget['kind'];
    resourceId: string;
    page: number;
    pageSize: number;
  }) => Promise<{ list?: CalendarAuditRecord[]; total?: number }>;
  historyActionLabels: Readonly<Record<string, string>>;
  deleteConfirmation: (kind: CalendarHistoryTarget['kind'], record: ShiftCalendarRecord | CalendarExceptionRecord) => CalendarDeleteConfirmation;
  defaultBreak?: { startTime: string; endTime: string };
}

export interface ProductionShiftCalendarProps {
  capabilities: ProductionShiftCalendarCapabilities;
  refreshKey?: number;
  supplierId?: string;
}

export interface CalendarTableProps {
  capabilities: ProductionShiftCalendarCapabilities;
  refreshKey?: number;
  supplierId?: string;
}

export interface ShiftCalendarFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingShift: ShiftCalendarRecord | null;
  fixedSupplierId?: string;
  capabilities: ProductionShiftCalendarCapabilities;
  onSuccess: () => void;
}

export interface CalendarExceptionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingException: CalendarExceptionRecord | null;
  fixedSupplierId?: string;
  capabilities: ProductionShiftCalendarCapabilities;
  onSuccess: () => void;
}
