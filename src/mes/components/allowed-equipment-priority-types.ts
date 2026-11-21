import type { ProTableProps } from '@ant-design/pro-components';

export interface MesEquipmentTimeProfile {
  equipmentId: string;
  shiftCalendarId?: string | null;
  standardTime?: number | null;
}

export interface MesEquipmentOption {
  id: string;
  code?: string | null;
  name?: string | null;
  equipmentType?: string | null;
  workCenter?: { name?: string | null } | null;
}

export interface MesShiftCalendarOption {
  id: string;
  name: string;
  isActive?: boolean;
  startTime?: string | null;
  endTime?: string | null;
}

export interface MesAllowedEquipmentPriorityCapabilities {
  requestEquipmentDetail: (params: { id: string }) => Promise<MesEquipmentOption>;
  requestEquipmentList: (params: {
    page: number;
    pageSize: number;
    keyword?: string;
    equipmentType?: string;
    workCenterId?: string;
    includeChildWorkCenters?: boolean;
  }) => Promise<{ list?: MesEquipmentOption[]; total?: number }>;
  requestShiftCalendars: (params: {
    page: number;
    pageSize: number;
  }) => Promise<{ list?: MesShiftCalendarOption[]; total?: number }>;
  equipmentTypeLabels: Record<string, string>;
  pagination?: ProTableProps<MesEquipmentOption, unknown>['pagination'];
}
