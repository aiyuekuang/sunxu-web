import type { CSSProperties, ReactNode } from 'react';
import { StatusDisplay, type StatusMap } from '../../components/StatusDisplay';

export interface MesStatusTagEnumItem {
  text?: ReactNode;
  status?: string;
  color?: string;
}

export interface MesStatusTagProps {
  /** Raw MES status value, such as `in_progress`. */
  value?: string | null;
  /** MES status presentation map supplied by the host. */
  enumMap: Readonly<Record<string, MesStatusTagEnumItem | undefined>>;
  /** Preserve a host-computed label when a legacy view has custom fallback text. */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * @deprecated Use `StatusDisplay` from `sunxu-web`.
 * @sunxu-layer composite
 * Compatibility adapter for the former status-tag API. Status rendering and color semantics belong to StatusDisplay.
 */
export function MesStatusTag({
  value,
  enumMap,
  children,
  className,
  style,
}: MesStatusTagProps) {
  const normalizedEnumMap = Object.fromEntries(
    Object.entries(enumMap).map(([key, item]) => [
      key,
      item && item.text === undefined ? { ...item, text: '' } : item,
    ]),
  ) as StatusMap;
  return (
    <StatusDisplay
      value={value}
      enumMap={normalizedEnumMap}
      mode="tag"
      label={children}
      emptyLabel={children !== undefined ? children : '-'}
      unknownLabel={children !== undefined ? children : '未知状态'}
      className={className}
      style={style}
    />
  );
}
