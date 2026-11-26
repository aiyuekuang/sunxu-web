import type { ProColumns } from '@ant-design/pro-components';
import { DatePicker, Input, InputNumber, Select, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type {
  DocumentLineColumn,
  DocumentLineRow,
} from './materialCustomFieldColumns';
import { renderCustomFieldCell } from './CustomFieldCell';
import type {
  DocumentLineCustomFieldDefinition,
  DocumentLineCustomFieldDisplayKey,
  DocumentLineCustomFieldSchema,
} from './document-line-custom-field-types';

/** @sunxu-layer business @sunxu-domain document-line-custom-fields @sunxu-reason Shares MES document-line custom-field rules and editors; schema, data loading, permissions, and persistence stay in the host. */

export type DocumentLineCustomFieldCarrier = {
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
};

export type DocumentLineCustomValuePayload = {
  customFieldSchemaVersion: number;
  customValues: Record<string, unknown>;
};

export type DocumentLineCustomFieldRuntimePreviewItem = {
  customComputedValues: Record<string, unknown>;
  customComputedErrors: Record<string, unknown>;
};

export type DocumentLineCustomFieldSummary = {
  fieldKey: string;
  label: string;
  mode: 'sum' | 'avg' | 'min' | 'max' | 'count_non_empty';
  value: number | null;
};

export type DocumentLineCustomFieldFormValues = Record<string, unknown>;

type FieldOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

interface CreateDocumentLineCustomFieldColumnsOptions<T> {
  displayKey?: DocumentLineCustomFieldDisplayKey;
  prefixTitle?: string;
  getCarrier?: (record: T) => unknown;
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function fieldVisible(
  field: DocumentLineCustomFieldDefinition,
  displayKey: DocumentLineCustomFieldDisplayKey,
): boolean {
  return readObject(field.displayJson)[displayKey] === true;
}

function resolveSortOrder(field: DocumentLineCustomFieldDefinition): number {
  const displaySortOrder = readObject(field.displayJson).sortOrder;
  return typeof displaySortOrder === 'number'
    ? displaySortOrder
    : (field.sortOrder ?? 0);
}

export function getVisibleDocumentLineCustomFields(
  schema: DocumentLineCustomFieldSchema | null | undefined,
  displayKey: DocumentLineCustomFieldDisplayKey,
): DocumentLineCustomFieldDefinition[] {
  return (schema?.fields ?? [])
    .filter((field) => field.isActive !== false)
    .filter((field) => fieldVisible(field, displayKey))
    .slice()
    .sort((left, right) => resolveSortOrder(left) - resolveSortOrder(right));
}

export function getDocumentLineCustomFormFields(
  schema: DocumentLineCustomFieldSchema | null | undefined,
): DocumentLineCustomFieldDefinition[] {
  return getVisibleDocumentLineCustomFields(schema, 'showInForm').filter(
    (field) => field.fieldKind === 'input',
  );
}

export function getDocumentLineCustomFormDisplayFields(
  schema: DocumentLineCustomFieldSchema | null | undefined,
): DocumentLineCustomFieldDefinition[] {
  return getVisibleDocumentLineCustomFields(schema, 'showInForm').filter(
    (field) => field.fieldKind === 'input' || field.fieldKind === 'formula',
  );
}

export function resolveDocumentLineCustomFieldWidth(
  field: DocumentLineCustomFieldDefinition,
): number {
  const listWidth = readObject(field.displayJson).listWidth;
  if (typeof listWidth === 'number' && listWidth > 0) return listWidth;
  if (field.dataType === 'long_text') return 200;
  if (field.dataType === 'date' || field.dataType === 'datetime') return 168;
  if (field.dataType === 'boolean') return 96;
  return 140;
}

export function sumDocumentLineCustomFieldColumnWidths(
  schema: DocumentLineCustomFieldSchema | null | undefined,
  displayKey: DocumentLineCustomFieldDisplayKey,
): number {
  return getVisibleDocumentLineCustomFields(schema, displayKey).reduce(
    (sum, field) => sum + resolveDocumentLineCustomFieldWidth(field),
    0,
  );
}

export function summarizeDocumentLineCustomFields<T>(
  rows: readonly T[],
  schema: DocumentLineCustomFieldSchema | null | undefined,
): DocumentLineCustomFieldSummary[] {
  return (schema?.fields ?? []).reduce<DocumentLineCustomFieldSummary[]>(
    (result, field) => {
      const display = readObject(field.displayJson);
      const mode = display.aggregateMode;
      if (
        mode !== 'sum' &&
        mode !== 'avg' &&
        mode !== 'min' &&
        mode !== 'max' &&
        mode !== 'count_non_empty'
      ) {
        return result;
      }
      const rawValues = rows.map((row) => {
        const carrier = readObject(row);
        const values =
          field.fieldKind === 'formula'
            ? readObject(carrier.customComputedValues)
            : readObject(carrier.customValues);
        return values[field.fieldKey];
      });
      const nonEmpty = rawValues.filter(
        (value) => value !== null && value !== undefined && value !== '',
      );
      if (mode === 'count_non_empty') {
        result.push({
          fieldKey: field.fieldKey,
          label: field.label,
          mode,
          value: nonEmpty.length,
        });
        return result;
      }
      const numbers = nonEmpty
        .map((value) => (typeof value === 'number' ? value : Number(value)))
        .filter((value) => Number.isFinite(value));
      if (numbers.length !== nonEmpty.length || numbers.length === 0) {
        result.push({
          fieldKey: field.fieldKey,
          label: field.label,
          mode,
          value: null,
        });
        return result;
      }
      const sum = numbers.reduce((total, value) => total + value, 0);
      const value =
        mode === 'sum'
          ? sum
          : mode === 'avg'
            ? sum / numbers.length
            : mode === 'min'
              ? Math.min(...numbers)
              : Math.max(...numbers);
      result.push({ fieldKey: field.fieldKey, label: field.label, mode, value });
      return result;
    },
    [],
  );
}

export function toDocumentLineCustomFieldFormValues(
  value: unknown,
): DocumentLineCustomFieldFormValues {
  return Object.fromEntries(
    Object.entries(readObject(value)).map(([key, fieldValue]) => [
      key,
      fieldValue == null ? undefined : fieldValue,
    ]),
  );
}

function getInputFieldKeys(
  schema: DocumentLineCustomFieldSchema,
): Set<string> {
  return new Set(
    (schema.fields ?? [])
      .filter((field) => field.isActive !== false)
      .filter((field) => field.fieldKind === 'input')
      .map((field) => field.fieldKey),
  );
}

export function buildDocumentLineCustomValuePayload(
  row: unknown,
  schema: DocumentLineCustomFieldSchema | null | undefined,
): DocumentLineCustomValuePayload | null {
  const formFields = getDocumentLineCustomFormFields(schema);
  if (!schema || formFields.length === 0) return null;

  const inputKeys = getInputFieldKeys(schema);
  const currentValues = readObject(readObject(row).customValues);
  const preservedValues = Object.fromEntries(
    Object.entries(currentValues).filter(([key]) => inputKeys.has(key)),
  );
  const visibleValues = Object.fromEntries(
    formFields.flatMap((field) => {
      const hasCurrentValue = Object.hasOwn(currentValues, field.fieldKey);
      const currentValue = currentValues[field.fieldKey];

      // Omit unset downstream values so source mappings remain eligible; keep
      // explicit nulls so users can intentionally clear a mapped value.
      if (!hasCurrentValue && currentValue == null) return [];
      return [[field.fieldKey, currentValue ?? null]];
    }),
  );

  return {
    customFieldSchemaVersion: schema.schemaVersion,
    customValues: { ...preservedValues, ...visibleValues },
  };
}

function resolveDraftSystemFieldValue(
  record: Record<string, unknown>,
  fieldKey: string,
): unknown {
  if (Object.hasOwn(record, fieldKey)) return record[fieldKey];
  if (fieldKey === 'quantity' && Object.hasOwn(record, 'qty')) {
    return record.qty;
  }
  return undefined;
}

export function buildDocumentLineCustomFieldRuntimePreviewItems<T>(
  rows: T[],
  schema: DocumentLineCustomFieldSchema | null | undefined,
): Record<string, unknown>[] {
  const systemFields = schema?.systemFields ?? [];
  return Array.from(rows, (row) => {
    const record = readObject(row);
    const item: Record<string, unknown> = {};
    for (const field of systemFields) {
      const value = resolveDraftSystemFieldValue(record, field.key);
      if (value !== undefined) item[field.key] = value;
    }
    item.customValues = readObject(record.customValues);
    return item;
  });
}

export function applyDocumentLineCustomFieldRuntimePreview<
  T extends DocumentLineRow,
>(rows: T[], previewItems: DocumentLineCustomFieldRuntimePreviewItem[]): T[] {
  return rows.map((row, index) => {
    const preview = previewItems[index];
    if (!preview) return row;
    return {
      ...row,
      customComputedValues: readObject(preview.customComputedValues),
      customComputedErrors: readObject(preview.customComputedErrors),
    };
  });
}

export function getDocumentLineCustomFieldOptions(
  field: DocumentLineCustomFieldDefinition,
): FieldOption[] {
  const rawOptions = readObject(field.optionsJson).options;
  if (!Array.isArray(rawOptions)) return [];
  return rawOptions
    .map((option) => {
      if (typeof option === 'string') return { label: option, value: option };
      if (!option || typeof option !== 'object') return null;
      const record = option as Record<string, unknown>;
      const value =
        typeof record.value === 'string'
          ? record.value
          : typeof record.key === 'string'
            ? record.key
            : '';
      const label = typeof record.label === 'string' ? record.label : value;
      return value
        ? { label, value, disabled: record.enabled === false }
        : null;
    })
    .filter((option): option is FieldOption => option !== null);
}

export function toDocumentLineCustomFieldDateValue(
  value: unknown,
): Dayjs | undefined {
  if (typeof value !== 'string' || !value) return undefined;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : undefined;
}

export function normalizeDocumentLineCustomFieldDateValue(
  value: Dayjs | null,
  field: DocumentLineCustomFieldDefinition,
): string | null {
  if (!value) return null;
  return field.dataType === 'datetime'
    ? value.toISOString()
    : value.format('YYYY-MM-DD');
}

export function getDocumentLineCustomFieldRequiredRules(
  field: DocumentLineCustomFieldDefinition,
) {
  return field.requiredPolicy === 'none'
    ? []
    : [{ required: true, message: `请输入${field.label}` }];
}

export function renderDocumentLineCustomFieldEditor(
  field: DocumentLineCustomFieldDefinition,
  value: unknown,
  onChange: (value: unknown) => void,
) {
  if (
    field.dataType === 'number' ||
    field.dataType === 'decimal' ||
    field.dataType === 'money'
  ) {
    return (
      <InputNumber
        value={typeof value === 'number' ? value : undefined}
        onChange={(nextValue) => onChange(nextValue ?? null)}
        style={{ width: '100%' }}
        controls={false}
      />
    );
  }
  if (field.dataType === 'boolean') {
    return (
      <Switch
        checked={value === true}
        onChange={(checked) => onChange(checked)}
      />
    );
  }
  if (field.dataType === 'date' || field.dataType === 'datetime') {
    return (
      <DatePicker
        value={toDocumentLineCustomFieldDateValue(value)}
        showTime={field.dataType === 'datetime'}
        style={{ width: '100%' }}
        onChange={(date) =>
          onChange(normalizeDocumentLineCustomFieldDateValue(date, field))
        }
      />
    );
  }
  if (field.dataType === 'select' || field.dataType === 'multi_select') {
    return (
      <Select
        value={value === null ? undefined : value}
        mode={field.dataType === 'multi_select' ? 'multiple' : undefined}
        options={getDocumentLineCustomFieldOptions(field)}
        onChange={(nextValue) => onChange(nextValue ?? null)}
        allowClear
        showSearch
        optionFilterProp="label"
        style={{ width: '100%' }}
      />
    );
  }
  if (
    field.dataType === 'long_text' ||
    field.dataType === 'file' ||
    field.dataType === 'image'
  ) {
    return (
      <Input.TextArea
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value || null)}
        autoSize={{ minRows: 1, maxRows: 3 }}
      />
    );
  }
  return (
    <Input
      value={typeof value === 'string' ? value : ''}
      onChange={(event) => onChange(event.target.value || null)}
      allowClear
    />
  );
}

function renderDocumentLineCustomFieldCell<T>(
  field: DocumentLineCustomFieldDefinition,
  record: T,
  getCarrier: (record: T) => unknown,
) {
  const carrier = readObject(getCarrier(record));
  return renderCustomFieldCell(field, {
    computedValues: carrier.customComputedValues,
    rawValues: carrier.customValues,
    errors: carrier.customComputedErrors,
  });
}

export function createDocumentLineCustomFieldLineColumns<
  T extends DocumentLineRow & DocumentLineCustomFieldCarrier,
>(schema: DocumentLineCustomFieldSchema | null | undefined): DocumentLineColumn<T>[] {
  const displayFields = getDocumentLineCustomFormDisplayFields(schema);
  if (!schema || displayFields.length === 0) return [];

  return displayFields.map((field) => ({
    key: `line-custom-${field.fieldKey}`,
    title: field.label,
    required: field.fieldKind === 'input' && field.requiredPolicy !== 'none',
    width: resolveDocumentLineCustomFieldWidth(field),
    render: (row, _index, update) => {
      if (field.fieldKind === 'formula') {
        return renderDocumentLineCustomFieldCell(
          field,
          row,
          (record) => record,
        );
      }
      const currentValues = readObject(row.customValues);
      const nextUpdate = (value: unknown) => {
        update({
          customFieldSchemaVersion: schema.schemaVersion,
          customValues: { ...currentValues, [field.fieldKey]: value },
        } as Partial<T>);
      };
      return renderDocumentLineCustomFieldEditor(
        field,
        currentValues[field.fieldKey],
        nextUpdate,
      );
    },
  }));
}

export function createDocumentLineCustomFieldColumns<T>(
  schema: DocumentLineCustomFieldSchema | null | undefined,
  options: CreateDocumentLineCustomFieldColumnsOptions<T> = {},
): ProColumns<T>[] {
  const {
    displayKey = 'showInDetail',
    prefixTitle,
    getCarrier = (record: T) => record,
  } = options;
  const titlePrefix = prefixTitle ? `${prefixTitle}·` : '';
  return getVisibleDocumentLineCustomFields(schema, displayKey).map(
    (field) => ({
      title: `${titlePrefix}${field.label}`,
      key: `line-custom-${field.fieldKey}`,
      width: resolveDocumentLineCustomFieldWidth(field),
      ellipsis: true,
      search: false,
      sorter: false,
      render: (_value: unknown, record: T) =>
        renderDocumentLineCustomFieldCell(field, record, getCarrier),
    }),
  );
}

export function createDocumentLineCustomFieldColumnsForAntd<T>(
  schema: DocumentLineCustomFieldSchema | null | undefined,
  options: CreateDocumentLineCustomFieldColumnsOptions<T> = {},
): ColumnsType<T> {
  const {
    displayKey = 'showInDetail',
    prefixTitle,
    getCarrier = (record: T) => record,
  } = options;
  const titlePrefix = prefixTitle ? `${prefixTitle}·` : '';
  return getVisibleDocumentLineCustomFields(schema, displayKey).map(
    (field) => ({
      title: `${titlePrefix}${field.label}`,
      key: `line-custom-${field.fieldKey}`,
      width: resolveDocumentLineCustomFieldWidth(field),
      ellipsis: true,
      render: (_value: unknown, record: T) =>
        renderDocumentLineCustomFieldCell(field, record, getCarrier),
    }),
  );
}
