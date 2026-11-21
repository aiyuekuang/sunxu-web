import {
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type {
  DocumentLineCustomFieldDefinition,
  DocumentLineCustomFieldSchema,
} from './document-line-custom-field-types';

type FieldOption = { label: string; value: string; disabled?: boolean };
type FormNamePrefix = Array<string | number>;

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function fieldVisible(field: DocumentLineCustomFieldDefinition): boolean {
  return readObject(field.displayJson).showInForm === true;
}

function resolveSortOrder(field: DocumentLineCustomFieldDefinition): number {
  const displaySortOrder = readObject(field.displayJson).sortOrder;
  return typeof displaySortOrder === 'number'
    ? displaySortOrder
    : (field.sortOrder ?? 0);
}

function getDocumentLineCustomFormFields(
  schema: DocumentLineCustomFieldSchema | null | undefined,
): DocumentLineCustomFieldDefinition[] {
  return (schema?.fields ?? [])
    .filter((field) => field.isActive !== false)
    .filter(fieldVisible)
    .filter((field) => field.fieldKind === 'input')
    .slice()
    .sort((left, right) => resolveSortOrder(left) - resolveSortOrder(right));
}

function getFieldOptions(
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

function toDateValue(value: unknown): Dayjs | undefined {
  if (typeof value !== 'string' || !value) return undefined;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : undefined;
}

function getRequiredRules(field: DocumentLineCustomFieldDefinition) {
  return field.requiredPolicy === 'none'
    ? []
    : [{ required: true, message: `请输入${field.label}` }];
}

function renderFormControl(field: DocumentLineCustomFieldDefinition) {
  if (
    field.dataType === 'number' ||
    field.dataType === 'decimal' ||
    field.dataType === 'money'
  ) {
    return <InputNumber style={{ width: '100%' }} controls={false} />;
  }
  if (field.dataType === 'boolean') return <Switch />;
  if (field.dataType === 'date' || field.dataType === 'datetime') {
    return (
      <DatePicker
        showTime={field.dataType === 'datetime'}
        style={{ width: '100%' }}
      />
    );
  }
  if (field.dataType === 'select' || field.dataType === 'multi_select') {
    return (
      <Select
        mode={field.dataType === 'multi_select' ? 'multiple' : undefined}
        options={getFieldOptions(field)}
        allowClear
        showSearch
        optionFilterProp="label"
      />
    );
  }
  if (
    field.dataType === 'long_text' ||
    field.dataType === 'file' ||
    field.dataType === 'image'
  ) {
    return <Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} />;
  }
  return <Input allowClear />;
}

function normalizeDateFormValue(
  value: Dayjs | null,
  field: DocumentLineCustomFieldDefinition,
) {
  if (!value) return null;
  return field.dataType === 'datetime'
    ? value.toISOString()
    : value.format('YYYY-MM-DD');
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain mes-document-lines
 * @sunxu-reason Renders MES document-line custom fields from the host schema while document persistence and business rules remain in the host.
 * Renders one Col per visible input field; the caller places it in an AntD Row.
 */
export function DocumentLineCustomFieldFormItems({
  schema,
  namePrefix,
  colSpan = 6,
}: {
  schema: DocumentLineCustomFieldSchema | null | undefined;
  namePrefix: FormNamePrefix;
  colSpan?: number;
}) {
  const fields = getDocumentLineCustomFormFields(schema);
  if (fields.length === 0) return null;

  return (
    <>
      {fields.map((field) => {
        const name = [...namePrefix, 'customValues', field.fieldKey];
        const dateField =
          field.dataType === 'date' || field.dataType === 'datetime';
        return (
          <Col span={colSpan} key={field.fieldKey}>
            <Form.Item
              label={field.label}
              name={name}
              rules={getRequiredRules(field)}
              valuePropName={field.dataType === 'boolean' ? 'checked' : 'value'}
              getValueProps={
                dateField
                  ? (value: unknown) => ({ value: toDateValue(value) })
                  : undefined
              }
              normalize={
                dateField
                  ? (value: Dayjs | null) =>
                      normalizeDateFormValue(value, field)
                  : undefined
              }
            >
              {renderFormControl(field)}
            </Form.Item>
          </Col>
        );
      })}
    </>
  );
}
