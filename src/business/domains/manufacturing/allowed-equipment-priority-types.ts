import type { ProTableProps } from '@ant-design/pro-components';

export interface EquipmentTimeProfile {
  equipmentId: string;
  shiftCalendarId?: string | null;
  standardTime?: number | null;
}

export interface EquipmentOption {
  id: string;
  code?: string | null;
  name?: string | null;
  equipmentType?: string | null;
  workCenter?: { name?: string | null } | null;
}

export interface ShiftCalendarOption {
  id: string;
  name: string;
  isActive?: boolean;
  startTime?: string | null;
  endTime?: string | null;
}

export interface AllowedEquipmentPriorityCapabilities {
  requestEquipmentDetail: (params: { id: string }) => Promise<EquipmentOption>;
  requestEquipmentList: (params: {
    page: number;
    pageSize: number;
    keyword?: string;
    equipmentType?: string;
    workCenterId?: string;
    includeChildWorkCenters?: boolean;
  }) => Promise<{ list?: EquipmentOption[]; total?: number }>;
  requestShiftCalendars: (params: {
    page: number;
    pageSize: number;
  }) => Promise<{ list?: ShiftCalendarOption[]; total?: number }>;
  equipmentTypeLabels: Record<string, string>;
  pagination?: ProTableProps<EquipmentOption, unknown>['pagination'];
}
