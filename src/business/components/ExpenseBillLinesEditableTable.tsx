/** @sunxu-layer business @sunxu-domain funds-expense-bills @sunxu-reason Preserves expense-line editing, purchase receipt traceability, custom fields, formula previews, row batching, validation, and totals while injecting host requests and notifications. */
import {
  DatePicker,
  Input,
  InputNumber,
  Select,
  Switch,
  Typography,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RemoteSelect } from '../../components/RemoteSelect';
import { renderCustomFieldCell } from './CustomFieldCell';
import {
  type DocumentLineBatchOperations,
  type DocumentLineColumn,
  DocumentLineEditableTable,
} from './DocumentLineEditableTable';
import { ResizableTable as Table } from './ResizableTable';
import type {
  ExpenseBillCustomFieldDefinition,
  ExpenseBillLineCustomFieldSchema,
  ExpenseBillLineDetail,
  ExpenseBillLineDraft,
  ExpenseBillLinePayload,
  ExpenseBillLinesEditableTableProps,
  ExpenseBillRuntimePreviewRow,
  ExpenseReceiptOption,
} from './expense-bill-lines-editable-table-types';

type CustomFieldCarrier = Pick<
  ExpenseBillLineDraft,
  | 'customFieldSchemaVersion'
  | 'customValues'
  | 'customComputedValues'
  | 'customComputedErrors'
>;

type CustomValuePayload = {
  customFieldSchemaVersion: number;
  customValues: Record<string, unknown>;
};

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function resolveFieldSortOrder(field: ExpenseBillCustomFieldDefinition): number {
  const displayOrder = readObject(field.displayJson).sortOrder;
  return typeof displayOrder === 'number'
    ? displayOrder
    : (field.sortOrder ?? 0);
}

function resolveFieldWidth(field: ExpenseBillCustomFieldDefinition): number {
  const listWidth = readObject(field.displayJson).listWidth;
  if (typeof listWidth === 'number' && listWidth > 0) return listWidth;
  if (field.dataType === 'long_text') return 200;
  if (field.dataType === 'date' || field.dataType === 'datetime') return 168;
  if (field.dataType === 'boolean') return 96;
  return 140;
}

function getVisibleFormFields(
  schema: ExpenseBillLineCustomFieldSchema | null | undefined,
): ExpenseBillCustomFieldDefinition[] {
  return (schema?.fields ?? [])
    .filter((field) => field.isActive !== false)
    .filter((field) => readObject(field.displayJson).showInForm === true)
    .slice()
    .sort((left, right) => resolveFieldSortOrder(left) - resolveFieldSortOrder(right));
}

function getFormInputFields(
  schema: ExpenseBillLineCustomFieldSchema | null | undefined,
): ExpenseBillCustomFieldDefinition[] {
  return getVisibleFormFields(schema).filter(
    (field) => field.fieldKind === 'input',
  );
}

function getFormDisplayFields(
  schema: ExpenseBillLineCustomFieldSchema | null | undefined,
): ExpenseBillCustomFieldDefinition[] {
  return getVisibleFormFields(schema).filter(
    (field) => field.fieldKind === 'input' || field.fieldKind === 'formula',
  );
}

function sumCustomFieldWidths(
  schema: ExpenseBillLineCustomFieldSchema | null | undefined,
): number {
  return getVisibleFormFields(schema).reduce(
    (sum, field) => sum + resolveFieldWidth(field),
    0,
  );
}

function getCustomFieldOptions(field: ExpenseBillCustomFieldDefinition) {
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
    .filter((option): option is NonNullable<typeof option> => option !== null);
}

function toDayjsValue(value: unknown): Dayjs | undefined {
  if (typeof value !== 'string' || !value) return undefined;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : undefined;
}

function renderCustomFieldEditor(
  field: ExpenseBillCustomFieldDefinition,
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
    return <Switch checked={value === true} onChange={onChange} />;
  }
  if (field.dataType === 'date' || field.dataType === 'datetime') {
    return (
      <DatePicker
        value={toDayjsValue(value)}
        showTime={field.dataType === 'datetime'}
        style={{ width: '100%' }}
        onChange={(date) => {
          if (!date) {
            onChange(null);
            return;
          }
          onChange(
            field.dataType === 'datetime'
              ? date.toISOString()
              : date.format('YYYY-MM-DD'),
          );
        }}
      />
    );
  }
  if (field.dataType === 'select' || field.dataType === 'multi_select') {
    return (
      <Select
        value={value === null ? undefined : value}
        mode={field.dataType === 'multi_select' ? 'multiple' : undefined}
        options={getCustomFieldOptions(field)}
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

function createCustomFieldColumns(
  schema: ExpenseBillLineCustomFieldSchema | null | undefined,
): DocumentLineColumn<ExpenseBillLineDraft>[] {
  return getFormDisplayFields(schema).map((field) => ({
    key: `line-custom-${field.fieldKey}`,
    title: field.label,
    required: field.fieldKind === 'input' && field.requiredPolicy !== 'none',
    width: resolveFieldWidth(field),
    render: (row, _index, update) => {
      if (field.fieldKind === 'formula') {
        return renderCustomFieldCell(
          field,
          {
            computedValues: row.customComputedValues,
            rawValues: row.customValues,
            errors: row.customComputedErrors,
          },
        );
      }
      const currentValues = readObject(row.customValues);
      return renderCustomFieldEditor(
        field,
        currentValues[field.fieldKey],
        (value) =>
          update({
            customFieldSchemaVersion: schema?.schemaVersion,
            customValues: { ...currentValues, [field.fieldKey]: value },
          }),
      );
    },
  }));
}

function buildCustomValuePayload(
  row: unknown,
  schema: ExpenseBillLineCustomFieldSchema | null | undefined,
): CustomValuePayload | null {
  const formFields = getFormInputFields(schema);
  if (!schema || formFields.length === 0) return null;

  const inputKeys = new Set(
    (schema.fields ?? [])
      .filter((field) => field.isActive !== false)
      .filter((field) => field.fieldKind === 'input')
      .map((field) => field.fieldKey),
  );
  const currentValues = readObject(readObject(row).customValues);
  const preservedValues = Object.fromEntries(
    Object.entries(currentValues).filter(([key]) => inputKeys.has(key)),
  );
  const visibleValues = Object.fromEntries(
    formFields.flatMap((field) => {
      const hasCurrentValue = Object.hasOwn(currentValues, field.fieldKey);
      const currentValue = currentValues[field.fieldKey];
      if (!hasCurrentValue && currentValue == null) return [];
      return [[field.fieldKey, currentValue ?? null]];
    }),
  );
  return {
    customFieldSchemaVersion: schema.schemaVersion,
    customValues: { ...preservedValues, ...visibleValues },
  };
}

function buildRuntimePreviewItems(
  rows: readonly ExpenseBillLineDraft[],
  schema: ExpenseBillLineCustomFieldSchema,
): Array<Record<string, unknown>> {
  return rows.map((row) => {
    const item: Record<string, unknown> = {};
    for (const field of schema.systemFields ?? []) {
      const value =
        field.key === 'quantity' && row.qty !== undefined
          ? row.qty
          : row[field.key];
      if (value !== undefined) item[field.key] = value;
    }
    item.customValues = readObject(row.customValues);
    return item;
  });
}

function applyRuntimePreview(
  rows: ExpenseBillLineDraft[],
  previewItems: ExpenseBillRuntimePreviewRow[],
): ExpenseBillLineDraft[] {
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

function runtimeSignature(row: CustomFieldCarrier): string {
  return JSON.stringify({
    customComputedValues: row.customComputedValues ?? {},
    customComputedErrors: row.customComputedErrors ?? {},
  });
}

function sameRuntime(
  leftRows: ExpenseBillLineDraft[],
  rightRows: ExpenseBillLineDraft[],
): boolean {
  return (
    leftRows.length === rightRows.length &&
    leftRows.every((row, index) => {
      const nextRow = rightRows[index];
      return nextRow !== undefined && runtimeSignature(row) === runtimeSignature(nextRow);
    })
  );
}

let nextExpenseLineIndex = 0;

export function nextExpenseLineKey(): string {
  nextExpenseLineIndex += 1;
  return `_expense_line_${nextExpenseLineIndex}_${Date.now()}`;
}

export function createEmptyExpenseLine(): ExpenseBillLineDraft {
  return { _key: nextExpenseLineKey(), amount: 0 };
}

/** Maps detail rows to editable drafts and keeps one blank row for an empty bill. */
export function buildExpenseLinesFromDetail(
  lines?: ExpenseBillLineDetail[] | null,
): ExpenseBillLineDraft[] {
  const rows = (lines ?? []).map((line) => ({
    _key: nextExpenseLineKey(),
    id: line.id,
    categoryId: line.categoryId ?? undefined,
    amount: Number(line.amount),
    description: line.description ?? undefined,
    remark: line.remark ?? undefined,
    sourceType: line.sourceType ?? undefined,
    sourceId: line.sourceId ?? undefined,
    sourceNo: line.sourceNo ?? undefined,
    customFieldSchemaVersion: line.customFieldSchemaVersion,
    customValues: line.customValues,
    customComputedValues: line.customComputedValues,
    customComputedErrors: line.customComputedErrors,
  }));
  return rows.length > 0 ? rows : [createEmptyExpenseLine()];
}

/** Filters blank rows and preserves the source validation and payload rules. */
export function buildExpenseLinesPayload(
  rows: ExpenseBillLineDraft[],
  lineCustomFieldSchema?: ExpenseBillLineCustomFieldSchema | null,
): ExpenseBillLinePayload[] {
  return rows
    .filter((row) => row.amount != null && Number(row.amount) > 0)
    .map((row) => {
      if (!row.categoryId) {
        throw new Error('每条有效费用明细都必须选择费用类别');
      }
      return {
        id: row.id,
        categoryId: row.categoryId,
        amount: Number(row.amount),
        description: row.description?.trim() || undefined,
        remark: row.remark?.trim() || undefined,
        sourceType: row.sourceId ? row.sourceType : undefined,
        sourceId: row.sourceId || undefined,
        sourceNo: row.sourceId ? row.sourceNo?.trim() || undefined : undefined,
        ...(buildCustomValuePayload(row, lineCustomFieldSchema) ?? {}),
      };
    });
}

function sumLineAmount(rows: readonly ExpenseBillLineDraft[]): number {
  return rows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
}

function formatLineAmount(value: number): string {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function useExpenseBillRuntimePreview(
  schema: ExpenseBillLineCustomFieldSchema | null | undefined,
  rows: ExpenseBillLineDraft[],
  onRowsChange: (rows: ExpenseBillLineDraft[]) => void,
  capabilities: ExpenseBillLinesEditableTableProps['capabilities'],
) {
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const onRowsChangeRef = useRef(onRowsChange);
  onRowsChangeRef.current = onRowsChange;
  const capabilitiesRef = useRef(capabilities);
  capabilitiesRef.current = capabilities;
  const requestSeqRef = useRef(0);
  const displayFields = useMemo(() => getFormDisplayFields(schema), [schema]);
  const hasFormulaFields = displayFields.some(
    (field) => field.fieldKind === 'formula',
  );
  const previewItems = useMemo(
    () => (schema ? buildRuntimePreviewItems(rows, schema) : []),
    [rows, schema],
  );
  const previewItemsRef = useRef(previewItems);
  previewItemsRef.current = previewItems;
  const schemaVersion = schema?.schemaVersion;
  const previewSignature = useMemo(() => {
    if (
      !schema ||
      !hasFormulaFields ||
      rows.length === 0
    ) {
      return '';
    }
    return JSON.stringify({
      objectType: 'expense_bill_line',
      schemaVersion,
      items: previewItems,
    });
  }, [
    hasFormulaFields,
    previewItems,
    rows.length,
    schemaVersion,
  ]);

  useEffect(() => {
    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;
    if (
      !previewSignature ||
      !schemaVersion
    ) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      void capabilitiesRef.current.previewRuntimeValues({
        objectType: 'expense_bill_line',
        customFieldSchemaVersion: schemaVersion,
        items: previewItemsRef.current,
      })
        .then((result) => {
          if (requestSeqRef.current !== requestSeq) return;
          const currentRows = rowsRef.current;
          const nextRows = applyRuntimePreview(currentRows, result.items);
          if (!sameRuntime(currentRows, nextRows)) {
            onRowsChangeRef.current(nextRows);
          }
        })
        .catch(() => {
          if (requestSeqRef.current === requestSeq) {
            capabilitiesRef.current.notifyError('预览明细计算属性失败');
          }
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      if (requestSeqRef.current === requestSeq) {
        requestSeqRef.current += 1;
      }
    };
  }, [previewSignature, schemaVersion]);
}

export function ExpenseBillLinesEditableTable({
  rows,
  onRowsChange,
  categoryOptions,
  receiptOptions = [],
  lineCustomFieldSchema,
  minRows = 1,
  capabilities,
}: ExpenseBillLinesEditableTableProps) {
  useExpenseBillRuntimePreview(
    lineCustomFieldSchema,
    rows,
    onRowsChange,
    capabilities,
  );

  const [receiptSearchOptions, setReceiptSearchOptions] = useState<
    ExpenseReceiptOption[]
  >([]);
  const receiptSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleReceiptSearch = useCallback(
    (keyword: string) => {
      if (receiptSearchTimer.current) clearTimeout(receiptSearchTimer.current);
      if (!keyword || !capabilities.searchReceipt) {
        setReceiptSearchOptions([]);
        return;
      }
      const searchReceipt = capabilities.searchReceipt;
      receiptSearchTimer.current = setTimeout(() => {
        void searchReceipt(keyword)
          .then(setReceiptSearchOptions)
          .catch(() => capabilities.notifyError('搜索采购入库单失败'));
      }, 300);
    },
    [capabilities],
  );
  useEffect(
    () => () => {
      if (receiptSearchTimer.current) clearTimeout(receiptSearchTimer.current);
    },
    [],
  );

  const columns = useMemo<DocumentLineColumn<ExpenseBillLineDraft>[]>(
    () => [
      {
        key: 'categoryId',
        title: '费用类别',
        required: true,
        width: 220,
        render: (row, _index, update) => (
          <Select
            showSearch
            value={row.categoryId}
            options={categoryOptions}
            placeholder="选择费用类别"
            optionFilterProp="label"
            style={{ width: '100%' }}
            onChange={(value) => update({ categoryId: value || undefined })}
          />
        ),
      },
      {
        key: 'amount',
        title: '金额',
        required: true,
        width: 140,
        align: 'right',
        render: (row, _index, update) => (
          <InputNumber
            min={0.01}
            precision={2}
            value={row.amount}
            placeholder="0.00"
            style={{ width: '100%' }}
            onChange={(value) => update({ amount: value ?? undefined })}
          />
        ),
      },
      {
        key: 'description',
        title: '说明',
        width: 260,
        render: (row, _index, update) => (
          <Input
            allowClear
            value={row.description}
            placeholder="费用说明（可选）"
            onChange={(event) =>
              update({ description: event.target.value || undefined })
            }
          />
        ),
      },
      {
        key: 'sourceId',
        title: '关联采购入库单',
        width: 220,
        render: (row, _index, update) => {
          const base = receiptSearchOptions.length
            ? receiptSearchOptions
            : receiptOptions;
          const options =
            row.sourceId &&
            row.sourceNo &&
            !base.some((option) => option.value === row.sourceId)
              ? [{ label: row.sourceNo, value: row.sourceId }, ...base]
              : base;
          return (
            <RemoteSelect<string, ExpenseReceiptOption>
              allowClear
              showSearch
              value={row.sourceId}
              options={options}
              placeholder="采购入库单（可选，可搜索编号/供应商）"
              filterOption={false}
              onSearch={handleReceiptSearch}
              style={{ width: '100%' }}
              onChange={(value, option) => {
                if (!value) {
                  update({
                    sourceId: undefined,
                    sourceType: undefined,
                    sourceNo: undefined,
                  });
                  return;
                }
                const picked = Array.isArray(option) ? option[0] : option;
                update({
                  sourceId: value,
                  sourceType: 'purchase_receipt',
                  sourceNo: picked?.receiptNo ?? row.sourceNo,
                });
              }}
            />
          );
        },
      },
      ...createCustomFieldColumns(lineCustomFieldSchema),
    ],
    [
      categoryOptions,
      receiptOptions,
      receiptSearchOptions,
      handleReceiptSearch,
      lineCustomFieldSchema,
    ],
  );
  const customFieldScrollWidth = useMemo(
    () => sumCustomFieldWidths(lineCustomFieldSchema),
    [lineCustomFieldSchema],
  );
  const batchOperations = useMemo<DocumentLineBatchOperations<ExpenseBillLineDraft>>(
    () => ({
      enabled: true,
      fields: [
        {
          key: 'categoryId',
          label: '费用类别',
          type: 'select',
          options: categoryOptions,
          patch: (categoryId) => ({ categoryId }),
        },
        {
          key: 'amount',
          label: '金额',
          type: 'number',
          min: 0.01,
          precision: 2,
          patch: (amount) => ({ amount }),
        },
        {
          key: 'description',
          label: '费用说明',
          type: 'text',
          maxLength: 500,
          patch: (description) => ({ description }),
        },
      ],
    }),
    [categoryOptions],
  );

  return (
    <DocumentLineEditableTable<ExpenseBillLineDraft>
      ariaLabel="费用单明细表"
      rows={rows}
      onRowsChange={onRowsChange}
      columns={columns}
      createRow={createEmptyExpenseLine}
      cloneRow={(row) => ({ ...row, _key: nextExpenseLineKey(), id: undefined })}
      minRows={Math.max(1, minRows)}
      batchOperations={batchOperations}
      addText="添加费用行"
      scrollX={840 + customFieldScrollWidth}
      summary={(currentRows) => (
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} colSpan={2}>
            <Typography.Text type="secondary">
              共 {currentRows.length} 行
            </Typography.Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} align="right">
            <Typography.Text strong>
              {formatLineAmount(sumLineAmount(currentRows))}
            </Typography.Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell
            index={3}
            colSpan={Math.max(1, columns.length - 1)}
          />
        </Table.Summary.Row>
      )}
    />
  );
}
