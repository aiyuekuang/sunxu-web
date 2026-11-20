import dayjs, { type Dayjs } from 'dayjs';
import type { ReactNode } from 'react';

export type DateRangePickerPreset = {
  label: ReactNode;
  value:
    | [Dayjs | null | undefined, Dayjs | null | undefined]
    | (() => [Dayjs | null | undefined, Dayjs | null | undefined]);
};

export const DEFAULT_DATE_RANGE_PRESETS: DateRangePickerPreset[] = [
  { label: '今天', value: () => recentDays(1) },
  {
    label: '昨天',
    value: () => {
      const yesterday = dayjs().subtract(1, 'day');
      return dayRange(yesterday, yesterday);
    },
  },
  {
    label: '本周',
    value: () => {
      const weekStart = currentWeekStart();
      return dayRange(weekStart, weekStart.add(6, 'day'));
    },
  },
  {
    label: '上周',
    value: () => {
      const weekStart = currentWeekStart(dayjs().subtract(7, 'day'));
      return dayRange(weekStart, weekStart.add(6, 'day'));
    },
  },
  { label: '近7天', value: () => recentDays(7) },
  { label: '近30天', value: () => recentDays(30) },
  {
    label: '本月',
    value: () => dayRange(dayjs().startOf('month'), dayjs().endOf('month')),
  },
  { label: '上月', value: lastMonthRange },
  {
    label: '本年度',
    value: () => dayRange(dayjs().startOf('year'), dayjs()),
  },
];

/** Keep caller presets first, then add any missing common ranges by string label. */
export function mergeDateRangePresets(
  presets?: ReadonlyArray<DateRangePickerPreset>,
): DateRangePickerPreset[] {
  const merged: DateRangePickerPreset[] = [];
  const labels = new Set<string>();

  for (const preset of [...(presets ?? []), ...DEFAULT_DATE_RANGE_PRESETS]) {
    if (typeof preset.label === 'string') {
      if (labels.has(preset.label)) continue;
      labels.add(preset.label);
    }
    merged.push(preset);
  }

  return merged;
}

function dayRange(startDate: Dayjs, endDate: Dayjs): [Dayjs, Dayjs] {
  return [startDate.startOf('day'), endDate.endOf('day')];
}

function currentWeekStart(baseDate = dayjs()): Dayjs {
  const dayOfWeek = baseDate.day();
  return baseDate.add(dayOfWeek === 0 ? -6 : 1 - dayOfWeek, 'day');
}

function lastMonthRange(): [Dayjs, Dayjs] {
  const lastMonth = dayjs().subtract(1, 'month');
  return dayRange(lastMonth.startOf('month'), lastMonth.endOf('month'));
}

function recentDays(days: number): [Dayjs, Dayjs] {
  const today = dayjs();
  return dayRange(today.subtract(days - 1, 'day'), today);
}
