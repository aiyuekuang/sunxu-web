import {
  ProFormDatePicker,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert, Button, Form, Spin } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCustomFieldFormCapabilities } from '../../providers/BusinessUiProvider';
import type {
  CustomFieldFormMode,
  CustomFieldFormSectionProps,
  CustomFieldDefinition,
  CustomFieldSchema,
} from './custom-field-form-types';

type FieldOption = { label: string; value: string; disabled?: boolean };

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readValidationNumber(
  validationJson: unknown,
  key: string,
): number | undefined {
  const raw = readRecord(validationJson)[key];
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined;
}

function getFieldOptions(field: CustomFieldDefinition): FieldOption[] {
  const rawOptions = readRecord(field.optionsJson).options;
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

function isFormFieldVisible(field: CustomFieldDefinition): boolean {
  return readRecord(field.displayJson).showInForm === true;
}

function getInputFields(schema: CustomFieldSchema | null) {
  return (schema?.fields ?? []).filter((field) => field.fieldKind === 'input');
}

function getFormFields(schema: CustomFieldSchema | null) {
  return getInputFields(schema).filter(isFormFieldVisible);
}

function CustomFieldFormItem({
  field,
  mode,
}: {
  field: CustomFieldDefinition;
  mode: CustomFieldFormMode;
}) {
  const name = ['customValues', field.fieldKey];
  const required =
    field.requiredPolicy === 'update' ||
    (field.requiredPolicy === 'create' && mode === 'create');
  const rules = required
    ? [{ required: true, message: `请输入${field.label}` }]
    : [];

  if (field.dataType === 'number' || field.dataType === 'decimal') {
    return (
      <ProFormDigit
        name={name}
        label={field.label}
        rules={rules}
        fieldProps={{
          min: readValidationNumber(field.validationJson, 'min'),
          max: readValidationNumber(field.validationJson, 'max'),
        }}
      />
    );
  }
  if (field.dataType === 'boolean') {
    return <ProFormSwitch name={name} label={field.label} />;
  }
  if (field.dataType === 'date') {
    return <ProFormDatePicker name={name} label={field.label} rules={rules} />;
  }
  if (field.dataType === 'datetime') {
    return (
      <ProFormDateTimePicker
        name={name}
        label={field.label}
        rules={rules}
      />
    );
  }
  if (field.dataType === 'select') {
    return (
      <ProFormSelect
        name={name}
        label={field.label}
        options={getFieldOptions(field)}
        rules={rules}
      />
    );
  }
  if (field.dataType === 'multi_select') {
    return (
      <ProFormSelect
        name={name}
        label={field.label}
        mode="multiple"
        options={getFieldOptions(field)}
        rules={rules}
      />
    );
  }
  const maxLength = readValidationNumber(field.validationJson, 'maxLength');
  const textRules =
    maxLength !== undefined
      ? [
          ...rules,
          {
            max: maxLength,
            message: `${field.label}不能超过 ${maxLength} 个字符`,
          },
        ]
      : rules;
  if (
    field.dataType === 'long_text' ||
    field.dataType === 'file' ||
    field.dataType === 'image'
  ) {
    return (
      <ProFormTextArea
        name={name}
        label={field.label}
        rules={textRules}
        fieldProps={{ maxLength }}
      />
    );
  }
  return (
    <ProFormText
      name={name}
      label={field.label}
      rules={textRules}
      fieldProps={{ maxLength }}
    />
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Preserves host custom-field schema rendering and request lifecycle while schema/value services remain host injected.
 */
export function CustomFieldFormSection({
  objectType,
  objectId,
  onRuntimeChange,
}: CustomFieldFormSectionProps) {
  const form = Form.useFormInstance();
  const capabilities = useCustomFieldFormCapabilities();
  const [loading, setLoading] = useState(false);
  const [schema, setSchema] = useState<CustomFieldSchema | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setLoadError(null);
    onRuntimeChange?.(null);
    if (!capabilities) {
      setSchema(null);
      setLoadError('自定义字段服务未配置');
      setLoading(false);
      return;
    }
    try {
      const [nextSchema, nextValues] = await Promise.all([
        capabilities.requestFormSchema({ objectType }),
        objectId
          ? capabilities.requestValueDetail({ objectType, objectId })
          : Promise.resolve(null),
      ]);
      if (requestId !== requestIdRef.current) return;
      const currentValues = nextValues?.customValues ?? {};
      const inputFields = getInputFields(nextSchema ?? null);
      const formFields = getFormFields(nextSchema ?? null);
      setSchema(nextSchema ?? null);
      if (objectId) form.setFieldsValue({ customValues: currentValues });
      onRuntimeChange?.({
        schemaVersion: nextSchema?.schemaVersion ?? 0,
        inputKeys: inputFields.map((field) => field.fieldKey),
        formFieldKeys: formFields.map((field) => field.fieldKey),
        currentValues,
      });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setSchema(null);
      setLoadError(
        capabilities.getErrorMessage(error, '自定义字段加载失败'),
      );
      onRuntimeChange?.(null);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [capabilities, form, objectId, objectType, onRuntimeChange]);

  useEffect(() => {
    void load();
    return () => {
      requestIdRef.current += 1;
      onRuntimeChange?.(null);
    };
  }, [load, onRuntimeChange]);

  const formFields = useMemo(() => getFormFields(schema), [schema]);
  if (loading) return <Spin size="small" />;
  if (loadError) {
    return (
      <Alert
        type="error"
        showIcon
        message={loadError}
        action={
          <Button size="small" onClick={() => void load()}>
            重新加载
          </Button>
        }
      />
    );
  }
  if (formFields.length === 0) return null;

  return (
    <>
      {formFields.map((field) => (
        <CustomFieldFormItem
          key={field.fieldKey}
          field={field}
          mode={objectId ? 'update' : 'create'}
        />
      ))}
    </>
  );
}
