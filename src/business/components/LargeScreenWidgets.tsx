import type { CSSProperties, ReactNode } from 'react';
import './large-screen-widgets.css';

export interface StatCardProps {
  /** KPI label. */
  label: string;
  /** Current metric value. */
  value?: number | string | null;
  /** Unit displayed after the value, such as "%". */
  suffix?: string;
  /** Optional per-card value color. */
  color?: string;
  /** Previous period value; a comparison is rendered when supplied. */
  prev?: number | null;
  /** Show relative percentage change instead of absolute change. */
  percentCompare?: boolean;
  /** Enable the live-metric pulse animation. */
  pulse?: boolean;
  /** Additional business context below the comparison. */
  hint?: ReactNode;
}

type CompareDirection = 'up' | 'down' | 'flat';

interface CompareResult {
  dir: CompareDirection;
  text: string;
}

function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return '-';

  const abs = Math.abs(value);
  const formatUnit = (unitValue: number, unitLabel: string, digits: number) =>
    `${(value / unitValue)
      .toLocaleString('zh-CN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: digits,
      })
      .replace(/\.0$/, '')}${unitLabel}`;

  if (abs >= 100_000_000) {
    return formatUnit(100_000_000, '亿', abs >= 1_000_000_000 ? 0 : 1);
  }
  if (abs >= 10_000) {
    return formatUnit(10_000, '万', abs >= 1_000_000 ? 0 : 1);
  }
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

function calculateCompare(
  current: number,
  previous: number,
  percent: boolean,
): CompareResult {
  const difference = current - previous;
  if (difference === 0) return { dir: 'flat', text: '持平' };

  const dir = difference > 0 ? 'up' : 'down';
  const arrow = difference > 0 ? '↑' : '↓';
  if (percent) {
    if (previous === 0) return { dir, text: `${arrow} -` };
    const percentage = Math.abs((difference / previous) * 100).toFixed(1);
    return { dir, text: `${arrow} ${percentage}%` };
  }
  return {
    dir,
    text: `${arrow} ${formatCompactNumber(Math.abs(difference))}`,
  };
}

/**
 * @sunxu-layer business
 * @sunxu-domain large-screen
 * @sunxu-reason Shares MES large-screen KPI presentation and comparison formatting without page services or runtime dependencies.
 */
export function StatCard({
  label,
  value,
  suffix,
  color,
  prev,
  percentCompare = false,
  pulse = false,
  hint,
}: StatCardProps) {
  const displayValue = value ?? 0;
  const formattedValue =
    typeof displayValue === 'number'
      ? formatCompactNumber(displayValue)
      : displayValue;
  const compare =
    prev != null && typeof value === 'number'
      ? calculateCompare(value, prev, percentCompare)
      : null;
  const valueStyle = color
    ? ({ '--sunxu-mes-large-screen-stat-value-color': color } as CSSProperties)
    : undefined;

  return (
    <div className={`sunxu-mes-screen-stat-card${pulse ? ' is-pulsing' : ''}`}>
      <div className="sunxu-mes-screen-stat-label">{label}</div>
      <div
        className="sunxu-mes-screen-stat-value"
        style={valueStyle}
      >
        {formattedValue}
        {suffix && (
          <span className="sunxu-mes-screen-stat-suffix">{suffix}</span>
        )}
      </div>
      {compare && (
        <div className={`sunxu-mes-screen-stat-compare ${compare.dir}`}>
          {compare.text}
        </div>
      )}
      {hint && <div className="sunxu-mes-screen-stat-hint">{hint}</div>}
    </div>
  );
}

export interface PanelHeaderProps {
  /** Panel title. */
  title: string;
  /** Optional context tag displayed beside the title. */
  tag?: string;
  /** Optional leading icon or other title content. */
  icon?: ReactNode;
  /** Optional trailing actions or content. */
  extra?: ReactNode;
}

/**
 * @sunxu-layer business
 * @sunxu-domain large-screen
 * @sunxu-reason Shares MES large-screen panel heading layout with host-provided icon and action slots.
 */
export function PanelHeader({ title, tag, icon, extra }: PanelHeaderProps) {
  return (
    <div className="sunxu-mes-screen-panel-header">
      {icon && <span className="sunxu-mes-screen-panel-icon">{icon}</span>}
      <span className="sunxu-mes-screen-panel-title">{title}</span>
      {tag && <span className="sunxu-mes-screen-panel-tag">{tag}</span>}
      {extra && <span className="sunxu-mes-screen-panel-extra">{extra}</span>}
    </div>
  );
}

export interface EmptyChartProps {
  /** Empty-state message. */
  text?: string;
}

function NoDataIcon() {
  return (
    <svg
      className="sunxu-mes-screen-empty-icon"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="24"
        width="6"
        height="9"
        rx="1"
        fill="currentColor"
        opacity="0.4"
      />
      <rect
        x="11"
        y="16"
        width="6"
        height="17"
        rx="1"
        fill="currentColor"
        opacity="0.4"
      />
      <rect
        x="19"
        y="20"
        width="6"
        height="13"
        rx="1"
        fill="currentColor"
        opacity="0.4"
      />
      <rect
        x="27"
        y="12"
        width="6"
        height="21"
        rx="1"
        fill="currentColor"
        opacity="0.4"
      />
      <line
        x1="2"
        y1="33.5"
        x2="34"
        y2="33.5"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.5"
      />
      <line
        x1="5"
        y1="8"
        x2="31"
        y2="28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <line
        x1="31"
        y1="8"
        x2="5"
        y2="28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain large-screen
 * @sunxu-reason Shares the MES chart and table empty state, including the existing decorative SVG and copy.
 */
export function EmptyChart({ text = '暂无数据' }: EmptyChartProps) {
  return (
    <div className="sunxu-mes-screen-empty">
      <NoDataIcon />
      <div className="sunxu-mes-screen-empty-text">{text}</div>
    </div>
  );
}
