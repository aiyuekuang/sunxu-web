import { useCallback, useMemo, useState } from 'react';
import { Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { SectionCard } from '../../src';
import {
  GanttHeatmapCell,
  GanttNowLine,
  ShiftBreakListField,
} from '../../src/business';
import type {
  ScheduleHeatmapWeekCell,
  ShiftBreakValue,
} from '../../src/business/components/production-schedule-widget-types';

const TIMELINE_WIDTH = 960;
const noop = () => undefined;

const heatmapCells: ScheduleHeatmapWeekCell[] = [
  {
    weekStart: '2026-11-02',
    weekStartMs: Date.UTC(2026, 10, 2),
    mode: 'capacity',
    totalMinutes: 2400,
    scheduledMinutes: 2040,
    occupiedMinutes: 2180,
    utilizationRate: 0.85,
    occupiedUtilizationRate: 0.91,
    loadMinutes: 2040,
    orderCount: 18,
  },
  {
    weekStart: '2026-11-09',
    weekStartMs: Date.UTC(2026, 10, 9),
    mode: 'capacity',
    totalMinutes: 2400,
    scheduledMinutes: 3100,
    occupiedMinutes: 2860,
    utilizationRate: 1.29,
    occupiedUtilizationRate: 1.19,
    loadMinutes: 3100,
    orderCount: 23,
  },
  {
    weekStart: '2026-11-16',
    weekStartMs: Date.UTC(2026, 10, 16),
    mode: 'capacity',
    totalMinutes: 0,
    scheduledMinutes: 0,
    occupiedMinutes: 180,
    utilizationRate: 0,
    occupiedUtilizationRate: 0,
    loadMinutes: 0,
    orderCount: 2,
  },
  {
    weekStart: '2026-11-23',
    weekStartMs: Date.UTC(2026, 10, 23),
    mode: 'heat',
    totalMinutes: 0,
    scheduledMinutes: 0,
    occupiedMinutes: 0,
    utilizationRate: 0,
    occupiedUtilizationRate: 0,
    loadMinutes: 760,
    orderCount: 12,
  },
];

const heatmapCapabilities = {
  formatDuration: (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder ? `${hours}小时${remainder}分` : `${hours}小时`;
  },
  getCapacityColor: (utilizationRate: number) =>
    utilizationRate >= 1
      ? '#cf1322'
      : utilizationRate >= 0.85
        ? '#d48806'
        : '#237804',
  getHeatColor: (relativeLoad: number) =>
    relativeLoad >= 0.8
      ? '#237804'
      : relativeLoad >= 0.5
        ? '#389e0d'
        : '#95de64',
};

const timeAt = (clockTime: string) => dayjs(`2000-01-01T${clockTime}:00`);

const initialBreaks: ShiftBreakValue[] = [
  { startTime: timeAt('10:00'), endTime: timeAt('10:15') },
  { startTime: timeAt('12:00'), endTime: timeAt('13:00') },
];

const defaultBreak: ShiftBreakValue = {
  startTime: timeAt('15:00'),
  endTime: timeAt('15:15'),
};

export function ScheduleComponentsDemo() {
  const timeline = useMemo(() => {
    const start = dayjs().startOf('day');
    return { start, end: start.add(1, 'day') };
  }, []);
  const getPosition = useCallback(
    (time: Dayjs) => {
      const ratio =
        (time.valueOf() - timeline.start.valueOf()) /
        (timeline.end.valueOf() - timeline.start.valueOf());
      return Math.max(0, Math.min(TIMELINE_WIDTH, ratio * TIMELINE_WIDTH));
    },
    [timeline],
  );
  const [selectedWeek, setSelectedWeek] = useState(heatmapCells[0].weekStart);
  const [focusedWeek, setFocusedWeek] = useState<string>();
  const [breaks, setBreaks] = useState(initialBreaks);
  const activeCell =
    heatmapCells.find((cell) => cell.weekStart === focusedWeek) ??
    heatmapCells.find((cell) => cell.weekStart === selectedWeek);

  return (
    <SectionCard title="生产排班组件">
      <Typography.Paragraph type="secondary">
        当前时刻线跟随本地时钟；周热力数据与格式、配色能力均由固定 mock 提供。可切换周热力格，并编辑、添加或移除休息时段。
      </Typography.Paragraph>

      <section aria-labelledby="schedule-timeline-heading">
        <Typography.Title level={5} id="schedule-timeline-heading">
          24 小时排程时间轴
        </Typography.Title>
        <Typography.Text type="secondary">
          红色竖线表示当前本地时刻；悬停可查看具体时间。
        </Typography.Text>
        <div
          role="region"
          aria-label="生产排程时间轴，可横向滚动"
          tabIndex={0}
          style={{ maxWidth: '100%', overflowX: 'auto' }}
        >
          <div
            style={{
              height: 92,
              minWidth: TIMELINE_WIDTH,
              position: 'relative',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(24, minmax(0, 1fr))',
                height: 24,
              }}
            >
              {Array.from({ length: 24 }, (_, hour) => (
                <div
                  key={hour}
                  style={{
                    borderInlineStart: '1px solid var(--ant-color-border)',
                    color: 'var(--ant-color-text-secondary)',
                    fontSize: 12,
                    paddingInlineStart: 3,
                  }}
                >
                  {hour % 4 === 0 ? `${String(hour).padStart(2, '0')}:00` : null}
                </div>
              ))}
            </div>
            <div
              aria-hidden="true"
              style={{
                background: 'var(--ant-color-fill-quaternary)',
                borderRadius: 4,
                height: 58,
                marginTop: 5,
                position: 'relative',
              }}
            >
              <div
                style={{
                  background: 'var(--sxw-primary-surface, #e6f7ec)',
                  borderRadius: 4,
                  color: 'var(--ant-color-primary)',
                  height: 20,
                  left: '16%',
                  lineHeight: '20px',
                  overflow: 'hidden',
                  paddingInline: 8,
                  position: 'absolute',
                  textOverflow: 'ellipsis',
                  top: 6,
                  whiteSpace: 'nowrap',
                  width: '22%',
                }}
              >
                工单 WO-2026-0182 · 车削
              </div>
              <div
                style={{
                  background: 'var(--sxw-primary-surface, #e6f7ec)',
                  borderRadius: 4,
                  color: 'var(--ant-color-primary)',
                  height: 20,
                  left: '53%',
                  lineHeight: '20px',
                  overflow: 'hidden',
                  paddingInline: 8,
                  position: 'absolute',
                  textOverflow: 'ellipsis',
                  top: 32,
                  whiteSpace: 'nowrap',
                  width: '28%',
                }}
              >
                工单 WO-2026-0196 · 装配
              </div>
            </div>
            <GanttNowLine
              timelineStart={timeline.start}
              timelineEnd={timeline.end}
              height={92}
              getPosition={getPosition}
            />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="schedule-heatmap-heading"
        style={{ marginBlockStart: 24 }}
      >
        <Typography.Title level={5} id="schedule-heatmap-heading">
          周负荷热力
        </Typography.Title>
        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            maxWidth: 760,
          }}
        >
          {heatmapCells.map((cell) => {
            const selected = selectedWeek === cell.weekStart;
            return (
              <div
                key={cell.weekStart}
                role="button"
                tabIndex={0}
                aria-label={`选择 ${cell.weekStart} 开始的一周`}
                aria-pressed={selected}
                onClick={() => setSelectedWeek(cell.weekStart)}
                onFocus={() => setFocusedWeek(cell.weekStart)}
                onBlur={() => setFocusedWeek(undefined)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedWeek(cell.weekStart);
                  }
                }}
                style={{
                  border: selected
                    ? '2px solid var(--ant-color-primary)'
                    : '2px solid transparent',
                  borderRadius: 8,
                  cursor: 'pointer',
                  minWidth: 0,
                  outlineOffset: 2,
                  padding: 3,
                }}
              >
                <GanttHeatmapCell
                  cell={cell}
                  width={140}
                  height={72}
                  heatMax={1000}
                  onClick={noop}
                  capabilities={heatmapCapabilities}
                />
                <Typography.Text
                  type="secondary"
                  style={{ display: 'block', fontSize: 12, marginTop: 4 }}
                >
                  {cell.weekStart} 起
                </Typography.Text>
              </div>
            );
          })}
        </div>
        <Typography.Text type="secondary">
          已选：{selectedWeek} 起这一周。悬停可查看负荷明细，点击热力格可切换选择。
        </Typography.Text>
        {activeCell ? (
          <Typography.Paragraph type="secondary" style={{ marginBlock: 4 }}>
            {activeCell.mode === 'capacity'
              ? `产能 ${heatmapCapabilities.formatDuration(activeCell.totalMinutes)} · 计划 ${heatmapCapabilities.formatDuration(activeCell.scheduledMinutes)} · 实际占用 ${heatmapCapabilities.formatDuration(activeCell.occupiedMinutes)} · ${activeCell.orderCount} 单`
              : `计划工时 ${heatmapCapabilities.formatDuration(activeCell.loadMinutes)} · ${activeCell.orderCount} 单`}
          </Typography.Paragraph>
        ) : null}
      </section>

      <section
        aria-labelledby="shift-break-heading"
        style={{ marginBlockStart: 24 }}
      >
        <Typography.Title level={5} id="shift-break-heading">
          班次休息时段
        </Typography.Title>
        <ShiftBreakListField
          value={breaks}
          onChange={setBreaks}
          timeFormat="HH:mm"
          defaultBreak={defaultBreak}
          startPlaceholder="开始时间"
          endPlaceholder="结束时间"
          betweenLabel="至"
          addLabel="添加休息时段"
        />
        <Typography.Text type="secondary">
          当前 {breaks.length} 段：
          {breaks
            .map(
              ({ startTime, endTime }) =>
                `${startTime.format('HH:mm')}–${endTime.format('HH:mm')}`,
            )
            .join('，') || '暂无休息时段'}
        </Typography.Text>
      </section>
    </SectionCard>
  );
}
