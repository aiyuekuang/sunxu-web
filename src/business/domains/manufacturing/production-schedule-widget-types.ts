import type { Dayjs } from 'dayjs';

/** Weekly aggregation consumed by the host production schedule heatmap cell. */
export interface ScheduleHeatmapWeekCell {
  weekStart: string;
  weekStartMs: number;
  mode: 'capacity' | 'heat';
  totalMinutes: number;
  scheduledMinutes: number;
  occupiedMinutes: number;
  utilizationRate: number;
  occupiedUtilizationRate: number;
  loadMinutes: number;
  orderCount: number;
}

export interface ScheduleHeatmapCapabilities {
  formatDuration: (minutes: number) => string;
  getCapacityColor: (utilizationRate: number) => string;
  getHeatColor: (relativeLoad: number) => string;
}

export interface ShiftBreakValue {
  startTime: Dayjs;
  endTime: Dayjs;
}
