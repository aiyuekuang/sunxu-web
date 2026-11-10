import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  App,
  Button,
  Checkbox,
  DatePicker,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Typography,
  type DatePickerProps,
  type SelectProps,
} from 'antd';

export type EditableDetailDateValue = Exclude<
  DatePickerProps['value'],
  unknown[]
>;

export type EditableDetailBatchValue =
  | string
  | number
  | EditableDetailDateValue
  | undefined;

type EditableDetailBatchFieldBase = {
  key: string;
  label: string;
  required?: boolean;
  help?: string;
  placeholder?: string;
};

export type EditableDetailBatchField<T> =
  | (EditableDetailBatchFieldBase & {
      type: 'number';
      min?: number;
      max?: number;
      precision?: number;
      patch: (value: number | undefined) => Partial<T>;
    })
  | (EditableDetailBatchFieldBase & {
      type: 'date';
      patch: (value: EditableDetailDateValue) => Partial<T>;
    })
  | (EditableDetailBatchFieldBase & {
      type: 'select';
      options?: NonNullable<SelectProps['options']>;
      request?: (
        params: { keyWords?: string },
        values: Readonly<Record<string, EditableDetailBatchValue>>,
      ) => Promise<NonNullable<SelectProps['options']>>;
      patch: (value: string | number | undefined) => Partial<T>;
    })
  | (EditableDetailBatchFieldBase & {
      type: 'text';
      maxLength?: number;
      patch: (value: string | undefined) => Partial<T>;
    });

export interface BatchFieldSettingsButtonProps<T> {
  selectedCount: number;
  fields: EditableDetailBatchField<T>[];
  onApply: (patches: Array<Partial<T>>) => void;
}

export function buildEditableDetailBatchPatches<T>(
  fields: EditableDetailBatchField<T>[],
  enabledFieldKeys: readonly string[],
  values: Record<string, EditableDetailBatchValue>,
): Array<Partial<T>> {
  const enabledKeys = new Set(enabledFieldKeys);

  return fields.flatMap((field) => {
    if (!enabledKeys.has(field.key)) return [];
    const value = values[field.key];

    if (field.type === 'number') {
      return [field.patch(typeof value === 'number' ? value : undefined)];
    }
    if (field.type === 'date') {
      return [field.patch(value as EditableDetailDateValue)];
    }
    if (field.type === 'select') {
      return [
        field.patch(
          typeof value === 'string' || typeof value === 'number'
            ? value
            : undefined,
        ),
      ];
    }
    return [field.patch(typeof value === 'string' ? value : undefined)];
  });
}

function isMissingRequiredValue(value: EditableDetailBatchValue): boolean {
  return value === undefined || value === null || value === '';
}

export function BatchFieldSettingsButton<T>({
  selectedCount,
  fields,
  onApply,
}: BatchFieldSettingsButtonProps<T>) {
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [enabledFieldKeys, setEnabledFieldKeys] = useState<string[]>([]);
  const [values, setValues] = useState<
    Record<string, EditableDetailBatchValue>
  >({});
  const [requestedOptions, setRequestedOptions] = useState<
    Record<string, NonNullable<SelectProps['options']>>
  >({});
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const requestIds = useRef(new Map<string, number>());

  const enabledFields = useMemo(
    () => new Set(enabledFieldKeys),
    [enabledFieldKeys],
  );

  const reset = useCallback(() => {
    setEnabledFieldKeys([]);
    setValues({});
    setRequestedOptions({});
    requestIds.current.clear();
  }, []);

  const loadSelectOptions = useCallback(
    async (
      field: Extract<EditableDetailBatchField<T>, { type: 'select' }>,
      keyWords?: string,
    ) => {
      if (!field.request) return;
      const requestId = (requestIds.current.get(field.key) ?? 0) + 1;
      requestIds.current.set(field.key, requestId);
      try {
        const options = await field.request({ keyWords }, valuesRef.current);
        if (requestIds.current.get(field.key) !== requestId) return;
        setRequestedOptions((current) => ({ ...current, [field.key]: options }));
      } catch (error) {
        if (requestIds.current.get(field.key) !== requestId) return;
        message.error(
          error instanceof Error ? error.message : `加载${field.label}失败`,
        );
      }
    },
    [message],
  );

  useEffect(() => {
    if (!open) return;
    fields.forEach((field) => {
      if (field.type === 'select' && field.request) {
        void loadSelectOptions(field);
      }
    });
  }, [fields, loadSelectOptions, open]);

  const updateValue = useCallback(
    (key: string, value: EditableDetailBatchValue) => {
      setValues((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const renderFieldControl = (field: EditableDetailBatchField<T>) => {
    const enabled = enabledFields.has(field.key);
    const value = values[field.key];

    if (field.type === 'number') {
      return (
        <InputNumber
          min={field.min}
          max={field.max}
          precision={field.precision}
          value={typeof value === 'number' ? value : undefined}
          placeholder={field.placeholder ?? `请输入${field.label}`}
          disabled={!enabled}
          controls={false}
          style={{ width: '100%' }}
          onChange={(nextValue) => updateValue(field.key, nextValue ?? undefined)}
        />
      );
    }

    if (field.type === 'date') {
      return (
        <DatePicker
          value={value as EditableDetailDateValue}
          placeholder={field.placeholder ?? `请选择${field.label}`}
          disabled={!enabled}
          allowClear
          style={{ width: '100%' }}
          onChange={(nextValue) => updateValue(field.key, nextValue ?? undefined)}
        />
      );
    }

    if (field.type === 'select') {
      return (
        <Select
          value={
            typeof value === 'string' || typeof value === 'number'
              ? value
              : undefined
          }
          options={field.options ?? requestedOptions[field.key] ?? []}
          placeholder={field.placeholder ?? `请选择${field.label}`}
          disabled={!enabled}
          allowClear
          showSearch={Boolean(field.request)}
          filterOption={field.request ? false : undefined}
          style={{ width: '100%' }}
          onSearch={
            field.request
              ? (keyWords) => void loadSelectOptions(field, keyWords || undefined)
              : undefined
          }
          onChange={(nextValue: string | number | undefined) =>
            updateValue(field.key, nextValue)
          }
        />
      );
    }

    return (
      <Input
        value={typeof value === 'string' ? value : undefined}
        maxLength={field.maxLength}
        placeholder={field.placeholder ?? `请输入${field.label}`}
        disabled={!enabled}
        allowClear
        onChange={(event) =>
          updateValue(field.key, event.target.value || undefined)
        }
      />
    );
  };

  if (fields.length === 0 || selectedCount === 0) return null;

  const handleApply = () => {
    if (enabledFieldKeys.length === 0) {
      message.warning('请先勾选需要设置的字段');
      return;
    }
    const missingRequiredField = fields.find(
      (field) =>
        enabledFields.has(field.key) &&
        field.required === true &&
        isMissingRequiredValue(values[field.key]),
    );
    if (missingRequiredField) {
      message.warning(`请填写${missingRequiredField.label}`);
      return;
    }

    onApply(
      buildEditableDetailBatchPatches(fields, enabledFieldKeys, values),
    );
    setOpen(false);
    reset();
  };

  return (
    <>
      <Button
        type="link"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        批量设置 ({selectedCount})
      </Button>
      <Modal
        title={`批量设置（${selectedCount} 行）`}
        open={open}
        width={560}
        okText={`应用至 ${selectedCount} 行`}
        cancelText="取消"
        onCancel={() => {
          setOpen(false);
          reset();
        }}
        onOk={handleApply}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary">
          仅更新当前勾选的行。勾选字段后才会应用；勾选后留空表示清空该字段。
        </Typography.Paragraph>
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          {fields.map((field) => (
            <div key={field.key} style={{ width: '100%' }}>
              <Space align="center" style={{ marginBottom: 6 }}>
                <Checkbox
                  checked={enabledFields.has(field.key)}
                  onChange={(event) =>
                    setEnabledFieldKeys((current) =>
                      event.target.checked
                        ? [...current, field.key]
                        : current.filter((key) => key !== field.key),
                    )
                  }
                >
                  设置{field.label}
                </Checkbox>
                {field.help ? (
                  <Typography.Text type="secondary">{field.help}</Typography.Text>
                ) : null}
              </Space>
              {renderFieldControl(field)}
            </div>
          ))}
        </Space>
      </Modal>
    </>
  );
}
