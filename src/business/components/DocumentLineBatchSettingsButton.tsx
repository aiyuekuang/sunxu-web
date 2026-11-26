import type { SelectProps } from 'antd';
import type {
  EditableDetailBatchField,
  EditableDetailBatchValue,
  EditableDetailDateValue,
} from '../../components/BatchFieldSettingsButton';
import {
  buildEditableDetailBatchPatches,
  BatchFieldSettingsButton,
} from '../../components/BatchFieldSettingsButton';

type DocumentLineBatchFieldValue = number | string | undefined;

type DocumentLineBatchFieldBase = {
  key: string;
  label: string;
  required?: boolean;
  help?: string;
  placeholder?: string;
};

/** MES 明细表保留的字段定义；日期 patch 始终接收 YYYY-MM-DD 字符串。 */
export type DocumentLineBatchField<T> =
  | (DocumentLineBatchFieldBase & {
      type: 'number';
      min?: number;
      max?: number;
      precision?: number;
      patch: (value: number | undefined) => Partial<T>;
    })
  | (DocumentLineBatchFieldBase & {
      type: 'date';
      patch: (value: string | undefined) => Partial<T>;
    })
  | (DocumentLineBatchFieldBase & {
      type: 'select';
      options?: NonNullable<SelectProps['options']>;
      request?: (
        params: { keyWords?: string },
        values: Readonly<Record<string, EditableDetailBatchValue>>,
      ) => Promise<NonNullable<SelectProps['options']>>;
      patch: (value: string | undefined) => Partial<T>;
    })
  | (DocumentLineBatchFieldBase & {
      type: 'text';
      maxLength?: number;
      patch: (value: string | undefined) => Partial<T>;
    });

export interface DocumentLineBatchSettingsButtonProps<T> {
  selectedCount: number;
  fields: DocumentLineBatchField<T>[];
  onApply: (patches: Array<Partial<T>>) => void;
}

function toMesDate(
  value: EditableDetailDateValue | string,
): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'format' in value && typeof value.format === 'function') {
    return value.format('YYYY-MM-DD');
  }
  return undefined;
}

function toSunxuFields<T>(
  fields: DocumentLineBatchField<T>[],
): EditableDetailBatchField<T>[] {
  return fields.map((field) => {
    if (field.type === 'date') {
      return {
        ...field,
        patch: (value: EditableDetailDateValue) => field.patch(toMesDate(value)),
      };
    }
    if (field.type === 'select') {
      return {
        ...field,
        patch: (value: string | number | undefined) =>
          field.patch(typeof value === 'string' ? value : undefined),
      };
    }
    return field;
  });
}

/** Builds the same field patches as the existing MES table adapter. */
export function buildDocumentLineBatchPatches<T>(
  fields: DocumentLineBatchField<T>[],
  enabledFieldKeys: readonly string[],
  values: Record<string, DocumentLineBatchFieldValue>,
): Array<Partial<T>> {
  return buildEditableDetailBatchPatches(
    toSunxuFields(fields),
    enabledFieldKeys,
    values,
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain document-lines
 * @sunxu-reason 保留 MES 的日期字符串 patch 和选择值兼容契约，由通用批量设置弹层处理界面状态。
 */
export function DocumentLineBatchSettingsButton<T>({
  selectedCount,
  fields,
  onApply,
}: DocumentLineBatchSettingsButtonProps<T>) {
  return (
    <BatchFieldSettingsButton<T>
      selectedCount={selectedCount}
      fields={toSunxuFields(fields)}
      onApply={onApply}
    />
  );
}
