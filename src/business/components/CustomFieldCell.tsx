import { WarningOutlined } from '@ant-design/icons';
import { Tooltip, Typography } from 'antd';
import type { ReactNode } from 'react';
import type { MesCustomFieldDefinition } from './custom-field-form-types';
import { formatCustomFieldDisplay } from './formatCustomFieldValue';

/** 计算属性异常的统一展示文案。 */
export const CUSTOM_FIELD_CALC_ERROR_TEXT = '计算异常';

export interface CustomFieldCellSource {
  computedValues?: unknown;
  rawValues?: unknown;
  errors?: unknown;
}

export interface CustomFieldCellResult {
  error: string | null;
  /** No error: formatted display text; empty means no value. */
  display: string;
}

export type CustomFieldCellField = Pick<
  MesCustomFieldDefinition,
  'fieldKey' | 'dataType' | 'optionsJson'
>;

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Computed formula errors take precedence; otherwise use computed then raw value. */
/** @sunxu-layer business @sunxu-domain custom-fields @sunxu-reason Preserves computed/raw fallback and the shared formula error message. */
export function resolveCustomFieldCell(
  field: CustomFieldCellField,
  source: CustomFieldCellSource,
): CustomFieldCellResult {
  const errorRaw = readObject(source.errors)[field.fieldKey];
  const error =
    errorRaw !== undefined && errorRaw !== null && errorRaw !== ''
      ? String(errorRaw)
      : null;
  if (error) return { error, display: '' };

  const computedValues = readObject(source.computedValues);
  const rawValues = readObject(source.rawValues);
  const rawValue = computedValues[field.fieldKey] ?? rawValues[field.fieldKey];
  return {
    error: null,
    display: formatCustomFieldDisplay(rawValue, field),
  };
}

/** Render formula errors as an accessible warning; empty values use the MES dash fallback. */
/** @sunxu-layer business @sunxu-domain custom-fields @sunxu-reason Preserves warning-colored formula errors and accessible error details. */
export function renderCustomFieldCell(
  field: CustomFieldCellField,
  source: CustomFieldCellSource,
): ReactNode {
  const { error, display } = resolveCustomFieldCell(field, source);
  if (error) {
    return (
      <Tooltip title={error}>
        <Typography.Text
          type="warning"
          title={error}
          aria-label={`${CUSTOM_FIELD_CALC_ERROR_TEXT}：${error}`}
          style={{ cursor: 'help' }}
        >
          <WarningOutlined /> {CUSTOM_FIELD_CALC_ERROR_TEXT}
        </Typography.Text>
      </Tooltip>
    );
  }
  return display === '' ? '-' : display;
}
