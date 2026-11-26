import dayjs, { type Dayjs } from 'dayjs';
import type { DateRangePickerPreset } from '../../components/dateRangePresets';

export {
  DEFAULT_DATE_RANGE_PRESETS,
  mergeDateRangePresets,
  type DateRangePickerPreset,
} from '../../components/dateRangePresets';

/**
 * 个人视图使用的相对日期预设。它只保存用户意图，列表请求前再展开为真实日期，
 * 不能写入业务 DTO 的 startDate/endDate。
 */
export const RELATIVE_DATE_PRESET_TODAY = 'today';

export type RelativeDatePreset = typeof RELATIVE_DATE_PRESET_TODAY;

export function isRelativeDatePreset(
  value: unknown,
): value is RelativeDatePreset {
  return value === RELATIVE_DATE_PRESET_TODAY;
}

export function resolveRelativeDatePresetRange(
  value: unknown,
): { startDate: string; endDate: string } | undefined {
  if (!isRelativeDatePreset(value)) return undefined;
  const today = dayjs().format('YYYY-MM-DD');
  return { startDate: today, endDate: today };
}

export type FinanceDateRangeKey =
  | 'today'
  | 'last7Days'
  | 'currentMonth'
  | 'lastMonth'
  | 'currentQuarter'
  | 'lastQuarter'
  | 'currentYear'
  | 'lastYear';

function dayRange(startDate: Dayjs, endDate: Dayjs): [Dayjs, Dayjs] {
  return [startDate.startOf('day'), endDate.endOf('day')];
}

function currentWeekStart(baseDate = dayjs()): Dayjs {
  const dayOfWeek = baseDate.day();
  return baseDate.add(dayOfWeek === 0 ? -6 : 1 - dayOfWeek, 'day');
}

function currentQuarterStart(baseDate = dayjs()): Dayjs {
  return baseDate.month(Math.floor(baseDate.month() / 3) * 3).startOf('month');
}

function lastMonthRange(): [Dayjs, Dayjs] {
  const lastMonth = dayjs().subtract(1, 'month');
  return dayRange(lastMonth.startOf('month'), lastMonth.endOf('month'));
}

function currentQuarterRange(): [Dayjs, Dayjs] {
  return dayRange(currentQuarterStart(), dayjs());
}

function lastQuarterRange(): [Dayjs, Dayjs] {
  const lastQuarter = dayjs().subtract(3, 'month');
  const startDate = currentQuarterStart(lastQuarter);
  return dayRange(startDate, startDate.add(2, 'month').endOf('month'));
}

function lastYearRange(): [Dayjs, Dayjs] {
  const lastYear = dayjs().subtract(1, 'year');
  return dayRange(lastYear.startOf('year'), lastYear.endOf('year'));
}

function recentDays(days: number): [Dayjs, Dayjs] {
  const today = dayjs();
  return dayRange(today.subtract(days - 1, 'day'), today);
}

function recentMonths(months: number): [Dayjs, Dayjs] {
  const today = dayjs();
  return dayRange(today.subtract(months, 'month'), today);
}

function nextDays(days: number): [Dayjs, Dayjs] {
  const today = dayjs();
  return dayRange(today, today.add(days - 1, 'day'));
}

function toDateRangeString([startDate, endDate]: [Dayjs, Dayjs]): [
  string,
  string,
] {
  return [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')];
}

export const FINANCE_QUICK_RANGE_OPTIONS: ReadonlyArray<{
  key: FinanceDateRangeKey;
  label: string;
}> = [
  { key: 'today', label: '今天' },
  { key: 'last7Days', label: '近7天' },
  { key: 'currentMonth', label: '本月' },
  { key: 'lastMonth', label: '上月' },
  { key: 'currentQuarter', label: '本季度' },
  { key: 'lastQuarter', label: '上季度' },
  { key: 'currentYear', label: '本年度' },
  { key: 'lastYear', label: '上年度' },
];

export function getFinanceDateRangeValue(
  key: FinanceDateRangeKey,
): [Dayjs, Dayjs] {
  switch (key) {
    case 'today':
      return recentDays(1);
    case 'last7Days':
      return recentDays(7);
    case 'lastMonth':
      return lastMonthRange();
    case 'currentQuarter':
      return currentQuarterRange();
    case 'lastQuarter':
      return lastQuarterRange();
    case 'currentYear':
      return dayRange(dayjs().startOf('year'), dayjs());
    case 'lastYear':
      return lastYearRange();
    default:
      return dayRange(dayjs().startOf('month'), dayjs());
  }
}

export function resolveFinanceDateRange(
  key: FinanceDateRangeKey,
): [string, string] {
  return toDateRangeString(getFinanceDateRangeValue(key));
}

export const BUSINESS_DATE_RANGE_PRESETS: DateRangePickerPreset[] = [
  { label: '今天', value: () => recentDays(1) },
  { label: '近7天', value: () => recentDays(7) },
  { label: '近30天', value: () => recentDays(30) },
  { label: '本月', value: () => dayRange(dayjs().startOf('month'), dayjs()) },
  { label: '上月', value: lastMonthRange },
  { label: '本季度', value: currentQuarterRange },
  { label: '上季度', value: lastQuarterRange },
  { label: '本年度', value: () => dayRange(dayjs().startOf('year'), dayjs()) },
  { label: '上年度', value: lastYearRange },
];

export const FINANCE_DATE_RANGE_PRESETS: DateRangePickerPreset[] =
  FINANCE_QUICK_RANGE_OPTIONS.map((option) => ({
    label: option.label,
    value: () => getFinanceDateRangeValue(option.key),
  }));

export const PLAN_DATE_RANGE_PRESETS: DateRangePickerPreset[] = [
  { label: '今天', value: () => nextDays(1) },
  { label: '未来7天', value: () => nextDays(7) },
  { label: '未来14天', value: () => nextDays(14) },
  {
    label: '本周',
    value: () => {
      const weekStart = currentWeekStart();
      return dayRange(weekStart, weekStart.add(6, 'day'));
    },
  },
  {
    label: '本月',
    value: () => dayRange(dayjs().startOf('month'), dayjs().endOf('month')),
  },
  {
    label: '下月',
    value: () => {
      const nextMonth = dayjs().add(1, 'month');
      return dayRange(nextMonth.startOf('month'), nextMonth.endOf('month'));
    },
  },
];

export const FORECAST_HISTORY_DATE_RANGE_PRESETS: DateRangePickerPreset[] = [
  { label: '近3个月', value: () => recentMonths(3) },
  { label: '近6个月', value: () => recentMonths(6) },
  { label: '近12个月', value: () => recentMonths(12) },
  { label: '近24个月', value: () => recentMonths(24) },
  {
    label: '本年累计',
    value: () => dayRange(dayjs().startOf('year'), dayjs()),
  },
  { label: '去年全年', value: lastYearRange },
];

export const IOT_DATE_TIME_RANGE_PRESETS: DateRangePickerPreset[] = [
  { label: '近1小时', value: () => [dayjs().subtract(1, 'hour'), dayjs()] },
  { label: '近6小时', value: () => [dayjs().subtract(6, 'hour'), dayjs()] },
  { label: '近24小时', value: () => [dayjs().subtract(24, 'hour'), dayjs()] },
  { label: '今天', value: () => [dayjs().startOf('day'), dayjs()] },
  {
    label: '近7天',
    value: () => [dayjs().subtract(6, 'day').startOf('day'), dayjs()],
  },
];
