import dayjs from 'dayjs';
import type { MaterialSelectorCustomFieldDefinition } from '../domains/inventory/material-select-types';

export interface MaterialSelectorCustomFieldSource {
  computedValues?: unknown;
  rawValues?: unknown;
  errors?: unknown;
}

export interface MaterialSelectorCustomFieldResult {
  error: string | null;
  display: string;
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function buildOptionLabelMap(optionsJson: unknown): Map<string, string> {
  const map = new Map<string, string>();
  const rawOptions = readRecord(optionsJson).options;
  if (!Array.isArray(rawOptions)) return map;
  for (const option of rawOptions) {
    if (typeof option === 'string') {
      map.set(option, option);
      continue;
    }
    if (!option || typeof option !== 'object') continue;
    const record = option as Record<string, unknown>;
    const value =
      typeof record.value === 'string'
        ? record.value
        : typeof record.key === 'string'
          ? record.key
          : '';
    if (!value) continue;
    const label = typeof record.label === 'string' ? record.label : value;
    map.set(value, label);
  }
  return map;
}

function toOptionLabel(value: unknown, optionMap: Map<string, string>): string {
  const key = typeof value === 'string' ? value : String(value);
  return optionMap.get(key) ?? key;
}

export function formatCustomFieldDisplay(
  value: unknown,
  field: Pick<MaterialSelectorCustomFieldDefinition, 'dataType' | 'optionsJson'>,
): string {
  if (value === undefined || value === null || value === '') return '';

  switch (field.dataType) {
    case 'boolean':
      return value === true ? '是' : '否';
    case 'select':
      return toOptionLabel(value, buildOptionLabelMap(field.optionsJson));
    case 'multi_select': {
      const optionMap = buildOptionLabelMap(field.optionsJson);
      const values = Array.isArray(value) ? value : [value];
      return values.map((item) => toOptionLabel(item, optionMap)).join('、');
    }
    case 'date': {
      const parsed = dayjs(value as string | number | Date);
      return parsed.isValid() ? parsed.format('YYYY-MM-DD') : String(value);
    }
    case 'datetime': {
      const parsed = dayjs(value as string | number | Date);
      return parsed.isValid()
        ? parsed.format('YYYY-MM-DD HH:mm')
        : String(value);
    }
    default:
      return String(value);
  }
}

/** MES custom-field display contract shared by selector options. */
export function resolveMaterialSelectorCustomField(
  field: MaterialSelectorCustomFieldDefinition,
  source: MaterialSelectorCustomFieldSource,
): MaterialSelectorCustomFieldResult {
  const errorRaw = readRecord(source.errors)[field.fieldKey];
  const error =
    errorRaw !== undefined && errorRaw !== null && errorRaw !== ''
      ? String(errorRaw)
      : null;
  if (error) return { error, display: '' };

  const computedValues = readRecord(source.computedValues);
  const rawValues = readRecord(source.rawValues);
  const rawValue = computedValues[field.fieldKey] ?? rawValues[field.fieldKey];
  return {
    error: null,
    display: formatCustomFieldDisplay(rawValue, field),
  };
}
