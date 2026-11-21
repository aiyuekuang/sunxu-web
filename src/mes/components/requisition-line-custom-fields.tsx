import { DatePicker, Input, InputNumber, Select, Switch } from 'antd';
import dayjs from 'dayjs';
import type { DocumentLineColumn } from './DocumentLineEditableTable';
import { renderCustomFieldCell } from './CustomFieldCell';
import type {
  RequisitionFormLineCustomFieldSchema,
  RequisitionOrderItemDraft,
} from './requisition-form-modal-types';

type RequisitionLine = RequisitionOrderItemDraft;
type Field = NonNullable<RequisitionFormLineCustomFieldSchema['fields']>[number];

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function visibleInputFields(
  schema: RequisitionFormLineCustomFieldSchema | null | undefined,
): Field[] {
  return (schema?.fields ?? [])
    .filter((field) => field.isActive !== false)
    .filter((field) => readObject(field.displayJson).showInForm === true)
    .filter((field) => field.fieldKind === 'input')
    .slice()
    .sort((left, right) => {
      const leftOrder = readObject(left.displayJson).sortOrder;
      const rightOrder = readObject(right.displayJson).sortOrder;
      return (
        (typeof leftOrder === 'number' ? leftOrder : left.sortOrder ?? 0) -
        (typeof rightOrder === 'number' ? rightOrder : right.sortOrder ?? 0)
      );
    });
}

function displayFields(
  schema: RequisitionFormLineCustomFieldSchema | null | undefined,
): Field[] {
  return (schema?.fields ?? [])
    .filter((field) => field.isActive !== false)
    .filter((field) => readObject(field.displayJson).showInForm === true)
    .filter((field) => field.fieldKind === 'input' || field.fieldKind === 'formula')
    .slice()
    .sort((left, right) => {
      const leftOrder = readObject(left.displayJson).sortOrder;
      const rightOrder = readObject(right.displayJson).sortOrder;
      return (
        (typeof leftOrder === 'number' ? leftOrder : left.sortOrder ?? 0) -
        (typeof rightOrder === 'number' ? rightOrder : right.sortOrder ?? 0)
      );
    });
}

function resolveWidth(field: Field): number {
  const width = readObject(field.displayJson).listWidth;
  if (typeof width === 'number' && width > 0) return width;
  if (field.dataType === 'long_text') return 200;
  if (field.dataType === 'date' || field.dataType === 'datetime') return 168;
  if (field.dataType === 'boolean') return 96;
  return 140;
}

function getOptions(field: Field) {
  const raw = readObject(field.optionsJson).options;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((option) => {
    if (typeof option === 'string') return [{ label: option, value: option }];
    if (!option || typeof option !== 'object') return [];
    const record = option as Record<string, unknown>;
    const value = typeof record.value === 'string'
      ? record.value
      : typeof record.key === 'string'
        ? record.key
        : '';
    return value
      ? [{
          label: typeof record.label === 'string' ? record.label : value,
          value,
          disabled: record.enabled === false,
        }]
      : [];
  });
}

function renderEditor(field: Field, value: unknown, onChange: (value: unknown) => void) {
  if (field.dataType === 'number' || field.dataType === 'decimal' || field.dataType === 'money') {
    return (
      <InputNumber
        value={typeof value === 'number' ? value : undefined}
        onChange={(next) => onChange(next ?? null)}
        style={{ width: '100%' }}
        controls={false}
      />
    );
  }
  if (field.dataType === 'boolean') {
    return <Switch checked={value === true} onChange={onChange} />;
  }
  if (field.dataType === 'date' || field.dataType === 'datetime') {
    const parsed = typeof value === 'string' && value ? dayjs(value) : null;
    return (
      <DatePicker
        value={parsed?.isValid() ? parsed : null}
        showTime={field.dataType === 'datetime'}
        style={{ width: '100%' }}
        onChange={(date) =>
          onChange(
            date
              ? field.dataType === 'datetime'
                ? date.toISOString()
                : date.format('YYYY-MM-DD')
              : null,
          )
        }
      />
    );
  }
  if (field.dataType === 'select' || field.dataType === 'multi_select') {
    return (
      <Select
        value={value === null ? undefined : value}
        mode={field.dataType === 'multi_select' ? 'multiple' : undefined}
        options={getOptions(field)}
        onChange={(next) => onChange(next ?? null)}
        allowClear
        showSearch
        optionFilterProp="label"
        style={{ width: '100%' }}
      />
    );
  }
  if (field.dataType === 'long_text' || field.dataType === 'file' || field.dataType === 'image') {
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

export function sumRequisitionLineCustomFieldColumnWidths(
  schema: RequisitionFormLineCustomFieldSchema | null | undefined,
): number {
  return displayFields(schema).reduce((sum, field) => sum + resolveWidth(field), 0);
}

export function buildRequisitionLineCustomValuePayload(
  row: RequisitionLine,
  schema: RequisitionFormLineCustomFieldSchema | null | undefined,
) {
  const fields = visibleInputFields(schema);
  if (!schema || fields.length === 0) return null;
  const inputKeys = new Set(
    (schema.fields ?? [])
      .filter((field) => field.isActive !== false && field.fieldKind === 'input')
      .map((field) => field.fieldKey),
  );
  const currentValues = readObject(row.customValues);
  const preservedValues = Object.fromEntries(
    Object.entries(currentValues).filter(([key]) => inputKeys.has(key)),
  );
  const visibleValues = Object.fromEntries(
    fields.flatMap((field) => {
      if (!Object.hasOwn(currentValues, field.fieldKey) && currentValues[field.fieldKey] == null) return [];
      return [[field.fieldKey, currentValues[field.fieldKey] ?? null]];
    }),
  );
  return {
    customFieldSchemaVersion: schema.schemaVersion,
    customValues: { ...preservedValues, ...visibleValues },
  };
}

export function createRequisitionLineCustomFieldColumns(
  schema: RequisitionFormLineCustomFieldSchema | null | undefined,
): DocumentLineColumn<RequisitionLine>[] {
  return displayFields(schema).map((field) => ({
    key: `line-custom-${field.fieldKey}`,
    title: field.label,
    required: field.fieldKind === 'input' && field.requiredPolicy !== 'none',
    width: resolveWidth(field),
    render: (row, _index, update) => {
      if (field.fieldKind === 'formula') {
        return renderCustomFieldCell(field, {
          computedValues: row.customComputedValues,
          rawValues: row.customValues,
          errors: row.customComputedErrors,
        });
      }
      const values = readObject(row.customValues);
      return renderEditor(field, values[field.fieldKey], (value) =>
        update({
          customFieldSchemaVersion: schema?.schemaVersion,
          customValues: { ...values, [field.fieldKey]: value },
        }),
      );
    },
  }));
}

export function buildRequisitionCustomFieldPreviewItems(
  rows: RequisitionLine[],
  schema: RequisitionFormLineCustomFieldSchema,
): Array<Record<string, unknown>> {
  return rows.map((row) => {
    const item: Record<string, unknown> = {};
    for (const field of schema.systemFields ?? []) {
      if (Object.hasOwn(row, field.key)) item[field.key] = row[field.key];
      else if (field.key === 'quantity' && Object.hasOwn(row, 'qty')) item[field.key] = row.qty;
    }
    item.customValues = readObject(row.customValues);
    return item;
  });
}

export function applyRequisitionCustomFieldPreview(
  rows: RequisitionLine[],
  previews: Array<{
    customComputedValues?: Record<string, unknown>;
    customComputedErrors?: Record<string, unknown>;
  }>,
): RequisitionLine[] {
  return rows.map((row, index) => {
    const preview = previews[index];
    if (!preview) return row;
    return {
      ...row,
      customComputedValues: readObject(preview.customComputedValues),
      customComputedErrors: readObject(preview.customComputedErrors),
    };
  });
}

export function requisitionCustomFieldRuntimeSignature(row: RequisitionLine): string {
  return JSON.stringify({
    customComputedValues: row.customComputedValues ?? {},
    customComputedErrors: row.customComputedErrors ?? {},
  });
}

export function sameRequisitionCustomFieldRuntime(
  left: RequisitionLine[],
  right: RequisitionLine[],
): boolean {
  return left.length === right.length && left.every(
    (row, index) => requisitionCustomFieldRuntimeSignature(row) === requisitionCustomFieldRuntimeSignature(right[index]),
  );
}
