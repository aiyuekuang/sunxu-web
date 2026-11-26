import { WarningOutlined } from '@ant-design/icons';
import {
  DrawerForm,
  ProDescriptions,
  ProFormDatePicker,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Empty,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMesCustomFieldFormCapabilities } from '../MesUiProvider';
import { formatCustomFieldDisplay } from '../utils/materialSelectorCustomField';
import type {
  MesCustomFieldDefinition,
  MesCustomFieldSchema,
  MesCustomFieldValueDetail,
} from './custom-field-form-types';
import './CustomFieldValuePanel.css';

export interface CustomFieldValuePanelProps {
  objectType: string;
  objectId?: string;
  editable?: boolean;
  title?: ReactNode;
  emptyExtra?: ReactNode;
  /** Whether to show the empty state when no detail fields exist. */
  showEmpty?: boolean;
  onDisplayStateChange?: (state: {
    loading: boolean;
    hasFields: boolean;
    hasError: boolean;
  }) => void;
}

type FieldOption = { label: string; value: string; disabled?: boolean };
type CustomFieldFormMode = 'create' | 'update';

const CALC_ERROR_TEXT = '计算异常';

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function fieldVisible(
  field: MesCustomFieldDefinition,
  displayKey: 'showInDetail' | 'showInForm',
) {
  return readRecord(field.displayJson)[displayKey] === true;
}

function getInputFields(schema: MesCustomFieldSchema | null) {
  return (schema?.fields ?? []).filter((field) => field.fieldKind === 'input');
}

function getFormFields(schema: MesCustomFieldSchema | null) {
  return getInputFields(schema).filter((field) =>
    fieldVisible(field, 'showInForm'),
  );
}

function getFieldOptions(field: MesCustomFieldDefinition): FieldOption[] {
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

function readValidationNumber(
  validationJson: unknown,
  key: string,
): number | undefined {
  const raw = readRecord(validationJson)[key];
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined;
}

function CustomFieldFormItem({
  field,
  mode,
}: {
  field: MesCustomFieldDefinition;
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

function formatValue(
  value: unknown,
  field: MesCustomFieldDefinition,
): ReactNode {
  if (value === undefined || value === null || value === '') return '-';
  if (field.dataType === 'boolean') {
    return value === true ? <Tag color="success">是</Tag> : <Tag>否</Tag>;
  }
  const display = formatCustomFieldDisplay(value, field);
  return display === '' ? '-' : display;
}

function getCustomFieldValue(
  detail: MesCustomFieldValueDetail | null,
  field: MesCustomFieldDefinition,
) {
  return field.fieldKind === 'formula'
    ? detail?.customComputedValues?.[field.fieldKey]
    : detail?.customValues?.[field.fieldKey];
}

/**
 * @sunxu-layer business
 * @sunxu-domain custom-fields
 * @sunxu-reason Preserves MES custom-field detail display, formula errors, edit drawer, required rules, and value preservation while schema/value APIs stay host injected.
 * Custom-field detail and edit panel.
 */
export function CustomFieldValuePanel({
  objectType,
  objectId,
  editable = true,
  title,
  emptyExtra,
  showEmpty = true,
  onDisplayStateChange,
}: CustomFieldValuePanelProps) {
  const { message } = App.useApp();
  const capabilities = useMesCustomFieldFormCapabilities();
  const [loading, setLoading] = useState(Boolean(objectId));
  const [schema, setSchema] = useState<MesCustomFieldSchema | null>(null);
  const [values, setValues] = useState<MesCustomFieldValueDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    if (!objectId) {
      setSchema(null);
      setValues(null);
      setLoadError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    if (!capabilities) {
      setSchema(null);
      setValues(null);
      setLoadError('自定义字段服务未配置');
      setLoading(false);
      return;
    }
    try {
      const [nextSchema, nextValues] = await Promise.all([
        capabilities.requestFormSchema({ objectType }),
        capabilities.requestValueDetail({ objectType, objectId }),
      ]);
      if (requestId !== requestIdRef.current) return;
      setSchema(nextSchema ?? null);
      setValues(nextValues ?? null);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setSchema(null);
      setValues(null);
      setLoadError(
        capabilities.getErrorMessage(error, '自定义字段加载失败'),
      );
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [capabilities, objectId, objectType]);

  useEffect(() => {
    void load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  const detailFields = useMemo(
    () =>
      (schema?.fields ?? []).filter((field) =>
        fieldVisible(field, 'showInDetail'),
      ),
    [schema?.fields],
  );
  const formFields = useMemo(() => getFormFields(schema), [schema]);

  useEffect(() => {
    onDisplayStateChange?.({
      loading,
      hasFields: detailFields.length > 0,
      hasError: Boolean(loadError),
    });
  }, [detailFields.length, loadError, loading, onDisplayStateChange]);

  if (!objectId) return null;
  if (!loading && !loadError && detailFields.length === 0 && !showEmpty) {
    return null;
  }

  const canEditValues =
    editable && formFields.length > 0 && Boolean(capabilities?.saveValues);
  const editButton = canEditValues ? (
    <Button type="link" onClick={() => setDrawerOpen(true)}>
      编辑
    </Button>
  ) : null;
  const emptyDescription =
    schema && (schema.fields ?? []).length > 0
      ? '暂无可展示字段'
      : '暂无自定义字段';
  const showStandaloneHeader =
    Boolean(title) || (detailFields.length === 0 && Boolean(editButton));

  return (
    <Spin spinning={loading}>
      <div className="mes-custom-field-panel">
        {showStandaloneHeader ? (
          <div className="mes-custom-field-panel-header">
            {title ? <Typography.Text strong>{title}</Typography.Text> : <span />}
            {editButton}
          </div>
        ) : null}

        {loadError ? (
          <Alert type="error" showIcon message={loadError} />
        ) : detailFields.length === 0 ? (
          <div className="mes-custom-field-panel-empty">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescription}>
              {emptyExtra}
            </Empty>
          </div>
        ) : (
          <ProDescriptions<Record<string, unknown>>
            column={2}
            dataSource={{}}
            extra={!showStandaloneHeader ? editButton : null}
            style={{ marginBlock: 0 }}
            columns={detailFields.map((field) => ({
              key: field.fieldKey,
              title: field.label,
              render: () => {
                const error = values?.customComputedErrors?.[field.fieldKey];
                return error !== undefined && error !== null && error !== '' ? (
                  <Tooltip title={String(error)}>
                    <Typography.Text
                      type="warning"
                      title={String(error)}
                      aria-label={`${CALC_ERROR_TEXT}：${String(error)}`}
                      style={{ cursor: 'help' }}
                    >
                      <WarningOutlined /> {CALC_ERROR_TEXT}
                    </Typography.Text>
                  </Tooltip>
                ) : (
                  formatValue(getCustomFieldValue(values, field), field)
                );
              },
            }))}
          />
        )}
      </div>

      <DrawerForm<{ customValues: Record<string, unknown> }>
        title={title ?? '自定义字段'}
        width="min(520px, calc(100vw - 24px))"
        open={drawerOpen}
        initialValues={{ customValues: values?.customValues ?? {} }}
        drawerProps={{
          destroyOnHidden: true,
          onClose: () => setDrawerOpen(false),
        }}
        submitter={{ searchConfig: { submitText: '保存' } }}
        onFinish={async (formValues) => {
          if (!schema || !objectId || !capabilities?.saveValues) return false;
          const inputKeys = new Set(
            (schema.fields ?? [])
              .filter((field) => field.fieldKind === 'input')
              .map((field) => field.fieldKey),
          );
          const preservedValues = Object.fromEntries(
            Object.entries(values?.customValues ?? {}).filter(([key]) =>
              inputKeys.has(key),
            ),
          );
          await capabilities.saveValues({
            objectType,
            objectId,
            customFieldSchemaVersion: schema.schemaVersion,
            customValues: {
              ...preservedValues,
              ...(formValues.customValues ?? {}),
            },
          });
          message.success('保存成功');
          setDrawerOpen(false);
          await load();
          return true;
        }}
        request={async () => ({ customValues: values?.customValues ?? {} })}
        readonly={!editable}
      >
        {formFields.map((field) => (
          <CustomFieldFormItem key={field.fieldKey} field={field} mode="update" />
        ))}
      </DrawerForm>
    </Spin>
  );
}

export default CustomFieldValuePanel;
