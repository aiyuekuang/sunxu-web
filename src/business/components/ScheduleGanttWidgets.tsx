import { Tooltip } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { memo, useEffect, useState } from 'react';
import type {
  ScheduleHeatmapCapabilities,
  ScheduleHeatmapWeekCell,
} from './production-schedule-widget-types';
import './schedule-gantt-widgets.css';

export interface GanttNowLineProps {
  timelineStart: Dayjs;
  timelineEnd: Dayjs;
  height: number;
  /** Host supplies the MES zoom/cell-width coordinate calculation. */
  getPosition: (now: Dayjs) => number;
}

/**
 * @sunxu-layer business
 * @sunxu-domain production-schedule
 * @sunxu-reason Shares the live timeline marker while timeline coordinate calculation remains in the host.
 */
export const GanttNowLine = memo(function GanttNowLine({
  timelineStart,
  timelineEnd,
  height,
  getPosition,
}: GanttNowLineProps) {
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 60_000);
    return () => clearInterval(timer);
  }, []);

  if (now.isBefore(timelineStart) || now.isAfter(timelineEnd)) return null;

  return (
    <Tooltip title={`当前时刻: ${now.format('HH:mm')}`}>
      <div
        className="sunxu-mes-schedule-now-line"
        style={{ left: getPosition(now), height }}
      >
        <div
          className="sunxu-mes-schedule-now-marker"
          aria-hidden="true"
        />
      </div>
    </Tooltip>
  );
});

export interface GanttHeatmapCellProps {
  cell: ScheduleHeatmapWeekCell;
  width: number;
  height: number;
  /** Maximum weekly minutes in the current view, used for relative-load shading. */
  heatMax: number;
  onClick: () => void;
  capabilities: ScheduleHeatmapCapabilities;
}

/**
 * @sunxu-layer business
 * @sunxu-domain production-schedule
 * @sunxu-reason Shares the weekly load heatmap display and drill-down interaction while formatting and palette functions come from the host.
 */
export const GanttHeatmapCell = memo(function GanttHeatmapCell({
  cell,
  width,
  height,
  heatMax,
  onClick,
  capabilities,
}: GanttHeatmapCellProps) {
  const isCapacity = cell.mode === 'capacity';
  const hasCapacityLoad = cell.scheduledMinutes > 0 || cell.occupiedMinutes > 0;
  const hasData = isCapacity
    ? cell.totalMinutes > 0 || hasCapacityLoad
    : cell.loadMinutes > 0;
  const ratio = isCapacity
    ? cell.occupiedUtilizationRate
    : heatMax > 0
      ? cell.loadMinutes / heatMax
      : 0;
  const plannedOverload = isCapacity && cell.utilizationRate > 1;
  const occupiedOverload = isCapacity && cell.occupiedUtilizationRate > 1;
  const noCapacityWithLoad =
    isCapacity && cell.totalMinutes === 0 && hasCapacityLoad;
  const overload = plannedOverload || occupiedOverload || noCapacityWithLoad;
  const strong = isCapacity
    ? capabilities.getCapacityColor(
        overload
          ? Math.max(cell.occupiedUtilizationRate, 1.01)
          : cell.occupiedUtilizationRate,
      )
    : capabilities.getHeatColor(ratio);
  const fillPercent = Math.min(ratio, 1) * 100;

  const primaryText = !hasData
    ? '—'
    : isCapacity
      ? noCapacityWithLoad
        ? '无产能'
        : `${Math.round(cell.occupiedUtilizationRate * 100)}%`
      : `${cell.orderCount}单`;
  const secondaryText = !hasData
    ? ''
    : isCapacity
      ? `${cell.orderCount}单 · 计划 ${Math.round(cell.utilizationRate * 100)}%`
      : capabilities.formatDuration(cell.loadMinutes);

  const tooltip = (
    <div style={{ lineHeight: 1.7 }}>
      <div style={{ fontWeight: 600 }}>{cell.weekStart} 起这一周</div>
      {isCapacity ? (
        <>
          <div>可用产能：{capabilities.formatDuration(cell.totalMinutes)}</div>
          <div>
            计划负荷：{capabilities.formatDuration(cell.scheduledMinutes)}（
            {Math.round(cell.utilizationRate * 100)}%）
          </div>
          <div>
            实际占用：{capabilities.formatDuration(cell.occupiedMinutes)}（
            {Math.round(cell.occupiedUtilizationRate * 100)}%）
          </div>
          {noCapacityWithLoad && <div>风险：无有效产能但存在排产占用</div>}
          {(plannedOverload || occupiedOverload) && (
            <div>风险：负荷超过有效产能</div>
          )}
          <div>工单：{cell.orderCount} 单</div>
        </>
      ) : (
        <>
          <div>在制：{cell.orderCount} 单</div>
          <div>计划工时：{capabilities.formatDuration(cell.loadMinutes)}</div>
          <div style={{ opacity: 0.7 }}>
            委外无本厂产能上限，按工时热度显示
          </div>
        </>
      )}
      {hasData && (
        <div style={{ opacity: 0.7, marginTop: 4 }}>点击查看这一周的工单</div>
      )}
    </div>
  );

  return (
    <Tooltip title={tooltip} mouseEnterDelay={0.15}>
      <div
        className={`sunxu-mes-schedule-heatmap-cell${
          overload ? ' is-overloaded' : ''
        }${hasData ? '' : ' is-empty'}`}
        style={{
          width,
          height,
          background: hasData ? `${strong}14` : 'transparent',
          color: hasData ? strong : undefined,
        }}
        onClick={hasData ? onClick : undefined}
      >
        {overload && (
          <span className="sunxu-mes-schedule-heatmap-warning">⚠️</span>
        )}
        <div className="sunxu-mes-schedule-heatmap-value">
          <span className="sunxu-mes-schedule-heatmap-primary">
            {primaryText}
          </span>
          {secondaryText && (
            <span className="sunxu-mes-schedule-heatmap-secondary">
              {secondaryText}
            </span>
          )}
        </div>
        {hasData && (
          <div className="sunxu-mes-schedule-heatmap-track">
            <div
              className="sunxu-mes-schedule-heatmap-fill"
              style={{
                width: `${fillPercent}%`,
                background: overload
                  ? 'var(--sunxu-mes-schedule-heat-overload, #ff3141)'
                  : strong,
              }}
            />
          </div>
        )}
      </div>
    </Tooltip>
  );
});
