import type { CSSProperties, ReactNode } from 'react';
import { StatusTag as SunxuStatusTag } from '../../components/StatusTag';

export interface MesStatusTagEnumItem {
  text?: ReactNode;
  color?: string;
  status?: string;
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

const STATUS_TOKEN_TO_COLOR: Record<string, string> = {
  Default: '#86909C',
  Processing: '#1677FF',
  Success: '#00B578',
  Warning: '#FF8F1F',
  Error: '#FF3141',
};

/**
 * @sunxu-component mes-specific
 * @sunxu-domain mes-status
 * @sunxu-reason Converts host-owned MES status dictionaries into the shared accessible status tag while keeping status values and copy in MES.
 */
export function MesStatusTag({
  value,
  enumMap,
  children,
  className,
  style,
}: MesStatusTagProps) {
  if (!value) {
    return (
      <SunxuStatusTag color="#86909C" className={className} style={style}>
        {children !== undefined ? children : '-'}
      </SunxuStatusTag>
    );
  }

  const config = enumMap[value];
  if (!config) {
    return (
      <SunxuStatusTag color="#86909C" className={className} style={style}>
        {children !== undefined ? children : '未知状态'}
      </SunxuStatusTag>
    );
  }

  const color =
    config.color ?? STATUS_TOKEN_TO_COLOR[config.status ?? 'Default'] ?? 'default';

  return (
    <SunxuStatusTag color={color} className={className} style={style}>
      {children !== undefined ? children : config.text}
    </SunxuStatusTag>
  );
}
