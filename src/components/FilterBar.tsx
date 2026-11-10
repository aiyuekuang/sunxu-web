import type { ReactNode } from 'react';

export type FilterBarProps = {
  children: ReactNode;
  actions?: ReactNode;
  ariaLabel: string;
  className?: string;
};

export function FilterBar({ children, actions, ariaLabel, className }: FilterBarProps) {
  return (
    <div
      className={['sxw-filter-bar', className].filter(Boolean).join(' ')}
      role="search"
      aria-label={ariaLabel}
    >
      <div className="sxw-filter-bar__fields">{children}</div>
      {actions ? <div className="sxw-filter-bar__actions">{actions}</div> : null}
    </div>
  );
}
