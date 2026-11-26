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
import {
  getDocumentLineCustomFieldOptions,
  getDocumentLineCustomFieldRequiredRules,
  getDocumentLineCustomFormFields,
  normalizeDocumentLineCustomFieldDateValue,
  toDocumentLineCustomFieldDateValue,
} from './documentLineCustomFieldColumns';
import type {
  DocumentLineCustomFieldDefinition,
  DocumentLineCustomFieldSchema,
} from './document-line-custom-field-types';

type FormNamePrefix = Array<string | number>;

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
        options={getDocumentLineCustomFieldOptions(field)}
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

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Renders host document-line custom fields from the host schema while document persistence and business rules remain in the host.
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
              rules={getDocumentLineCustomFieldRequiredRules(field)}
              valuePropName={field.dataType === 'boolean' ? 'checked' : 'value'}
              getValueProps={
                dateField
                  ? (value: unknown) => ({
                      value: toDocumentLineCustomFieldDateValue(value),
                    })
                  : undefined
              }
              normalize={
                dateField
                  ? (value: Dayjs | null) =>
                      normalizeDocumentLineCustomFieldDateValue(value, field)
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
