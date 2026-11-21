import { Badge } from 'antd';
import { StatusTag } from '../../components/StatusTag';

export interface MesStatusEnumItem {
  text: string;
  status?: 'Default' | 'Processing' | 'Success' | 'Warning' | 'Error' | string;
  color?: string;
}

export type MesStatusEnum = Readonly<Record<string, MesStatusEnumItem>>;

export interface StatusDisplayProps {
  value?: string | null;
  enumMap: MesStatusEnum;
  mode?: 'tag' | 'badge' | 'text';
  size?: 'small' | 'default';
}

const STATUS_TOKEN_COLOR: Record<string, string> = {
  Default: '#86909C',
  Processing: '#1677FF',
  Success: '#00B578',
  Warning: '#FF8F1F',
  Error: '#FF3141',
};

const STATUS_TOKEN_NAME: Record<string, string> = {
  Default: 'default',
  Processing: 'processing',
  Success: 'success',
  Warning: 'warning',
  Error: 'error',
};

export function StatusDisplay({
  value,
  enumMap,
  mode = 'tag',
  size = 'default',
}: StatusDisplayProps) {
  if (!value) return <span>-</span>;

  const config = enumMap[value];
  const label = config?.text ?? value;
  const statusToken = config?.status ?? 'Default';
  const color = config?.color ?? STATUS_TOKEN_NAME[statusToken] ?? 'default';
  const textColor = config?.color ?? STATUS_TOKEN_COLOR[statusToken] ?? '#86909C';
  const tagColor = config?.color ?? STATUS_TOKEN_COLOR[statusToken] ?? '#86909C';

  if (mode === 'badge') {
    return <Badge color={color} text={label} />;
  }
  if (mode === 'text') {
    return <span style={{ color: textColor }}>{label}</span>;
  }

  return (
    <StatusTag
      color={tagColor}
      style={
        size === 'small'
          ? { fontSize: 12, lineHeight: '18px', padding: '0 4px' }
          : undefined
      }
    >
      {label}
    </StatusTag>
  );
}
