import { Badge, theme } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import { StatusTag } from './StatusTag';

export type StatusDisplayMode = 'tag' | 'badge' | 'text';

export interface StatusMapItem {
  text: string;
  status?: string;
  /** Explicit Ant Design preset name or CSS color supplied by the host. */
  color?: string;
}

export type StatusMap = Readonly<Record<string, StatusMapItem>>;

export interface StatusDisplayProps {
  value?: string | null;
  enumMap: StatusMap;
  mode?: StatusDisplayMode;
  size?: 'small' | 'default';
  /** Override the resolved label while retaining the mapped status appearance. */
  label?: ReactNode;
  emptyLabel?: ReactNode;
  unknownLabel?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const STATUS_TOKEN_COLOR: Record<string, string> = {
  Default: 'default',
  Processing: 'processing',
  Success: 'success',
  Warning: 'warning',
  Error: 'error',
};

type AntdTextColorToken =
  | 'colorTextSecondary'
  | 'colorInfo'
  | 'colorSuccess'
  | 'colorWarning'
  | 'colorError';

const ANTD_TEXT_COLOR: Partial<Record<string, AntdTextColorToken>> = {
  default: 'colorTextSecondary',
  processing: 'colorInfo',
  success: 'colorSuccess',
  warning: 'colorWarning',
  error: 'colorError',
};

/**
 * @sunxu-layer composite
 * Presents a host-owned status map with the library's canonical status colors.
 * The host owns status values, labels, permissions, and state transitions.
 */
export function StatusDisplay({
  value,
  enumMap,
  mode = 'tag',
  size = 'default',
  label,
  emptyLabel = '-',
  unknownLabel,
  className,
  style,
}: StatusDisplayProps) {
  const { token } = theme.useToken();
  const hasValue = Boolean(value);
  const config = hasValue ? enumMap[value!] : undefined;
  const status = config?.status ?? 'Default';
  const semanticColor = config?.color ?? STATUS_TOKEN_COLOR[status] ?? 'default';
  const explicitTextToken = config?.color
    ? ANTD_TEXT_COLOR[config.color]
    : undefined;
  const colorValue = config?.color && !explicitTextToken
    ? config.color
    : token[explicitTextToken ?? ANTD_TEXT_COLOR[semanticColor] ?? 'colorTextSecondary'];
  const resolvedLabel =
    label !== undefined
      ? label
      : !hasValue
        ? emptyLabel
        : config
          ? config.text ?? value
          : unknownLabel ?? value;

  if (mode === 'badge') {
    return (
      <Badge
        color={colorValue}
        text={resolvedLabel}
        className={className}
        style={style}
      />
    );
  }

  if (mode === 'text') {
    return (
      <span className={className} style={{ color: colorValue, ...style }}>
        {resolvedLabel}
      </span>
    );
  }

  return (
    <StatusTag
      color={semanticColor}
      className={className}
      style={
        size === 'small'
          ? { fontSize: 12, lineHeight: '18px', padding: '0 4px', ...style }
          : style
      }
    >
      {resolvedLabel}
    </StatusTag>
  );
}
