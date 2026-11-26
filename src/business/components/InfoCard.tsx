import { Descriptions, type DescriptionsProps } from 'antd';
import React, { useMemo } from 'react';
import { SectionCard } from '../../components/SectionCard';
import { useMesPermissionChecker } from '../MesUiProvider';
import { AmountText } from './AmountText';
import { DateText } from './DateText';
import { StatusDisplay } from '../../components/StatusDisplay';
import { UserText } from './UserText';

export interface InfoField<T = Record<string, unknown>> {
  label: string;
  dataIndex: (keyof T & string) | string[];
  valueType?: 'text' | 'date' | 'datetime' | 'amount' | 'user' | 'status' | 'custom';
  enumMap?: Record<string, { text: string; status?: string; color?: string }>;
  render?: (record: T) => React.ReactNode;
  span?: number;
  permission?: string;
  copyable?: boolean;
}

export interface InfoCardProps<T = Record<string, unknown>> {
  title?: React.ReactNode;
  data: T;
  fields: InfoField<T>[];
  column?: number;
  extra?: React.ReactNode;
  children?: React.ReactNode;
  labelStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
}

function getNestedValue(obj: Record<string, unknown>, path: string | string[]): unknown {
  const keys = Array.isArray(path) ? path : [path];
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function renderFieldValue<T>(field: InfoField<T>, record: T): React.ReactNode {
  const raw = getNestedValue(record as Record<string, unknown>, field.dataIndex);
  switch (field.valueType) {
    case 'date':
      return <DateText value={raw == null ? null : String(raw)} format="date" />;
    case 'datetime':
      return <DateText value={raw == null ? null : String(raw)} format="datetime" />;
    case 'amount':
      return <AmountText value={typeof raw === 'number' || typeof raw === 'string' ? raw : null} />;
    case 'user':
      return <UserText user={raw && typeof raw === 'object' ? raw as { realName?: string; username?: string } : null} />;
    case 'status':
      return field.enumMap ? (
        <StatusDisplay value={raw == null ? null : String(raw)} enumMap={field.enumMap} />
      ) : <span>{String(raw ?? '-')}</span>;
    case 'custom':
      return field.render ? field.render(record) : <span>-</span>;
    default:
      return <span>{raw != null && raw !== '' ? String(raw) : '-'}</span>;
  }
}

/**
 * @sunxu-layer business
 * @sunxu-domain detail-information
 * @sunxu-reason Keeps MES permission-filtered descriptions and value formatting in one reusable card.
 */
export function InfoCard<T = Record<string, unknown>>({
  title,
  data,
  fields,
  column = 3,
  extra,
  children,
  labelStyle,
  contentStyle,
}: InfoCardProps<T>) {
  const hasPermission = useMesPermissionChecker();
  const items = useMemo<NonNullable<DescriptionsProps['items']>>(
    () => fields.filter((field) => !field.permission || hasPermission(field.permission)).map((field) => ({
      key: Array.isArray(field.dataIndex) ? field.dataIndex.join('.') : field.dataIndex,
      label: field.label,
      span: field.span,
      children: renderFieldValue(field, data),
      styles: field.copyable ? { content: { ...contentStyle, userSelect: 'all' } } : undefined,
    })),
    [fields, data, hasPermission, contentStyle],
  );

  return (
    <div style={{ marginBottom: 16 }}>
      <SectionCard title={title} extra={extra}>
        <Descriptions
          column={column}
          colon={false}
          items={items}
          styles={{
            ...(labelStyle ? { label: labelStyle } : {}),
            ...(contentStyle ? { content: contentStyle } : {}),
          }}
        />
        {children}
      </SectionCard>
    </div>
  );
}
