import { Segmented } from 'antd';
import type { SegmentedProps } from 'antd';
import type { ReactNode } from 'react';

export type StatusTabItem = {
  key: string;
  label: ReactNode;
  count?: number;
  disabled?: boolean;
};

export type StatusTabsProps = {
  items: StatusTabItem[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
  size?: SegmentedProps['size'];
};

export function StatusTabs({
  items,
  value,
  onChange,
  ariaLabel,
  className,
  size = 'middle',
}: StatusTabsProps) {
  return (
    <Segmented
      aria-label={ariaLabel}
      className={['sxw-status-tabs', className].filter(Boolean).join(' ')}
      value={value}
      size={size}
      onChange={(next) => onChange(String(next))}
      options={items.map(({ key, label, count, disabled }) => ({
        value: key,
        disabled,
        label: (
          <span className="sxw-status-tabs__label">
            {label}
            {count !== undefined ? <span className="sxw-status-tabs__count">{count}</span> : null}
          </span>
        ),
      }))}
    />
  );
}
