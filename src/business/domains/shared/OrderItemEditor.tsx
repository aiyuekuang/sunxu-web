import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Segmented,
  Select,
  Space,
  Switch,
  Typography,
  theme,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createMaterialCustomFieldLineColumns, sumMaterialCustomFieldColumnWidths } from '../inventory/materialCustomFieldColumns';
import { MaterialFilteredSelect } from '../inventory/MaterialFilteredSelect';
import type {
  DocumentLineBatchField,
} from '../documents/DocumentLineBatchSettingsButton';
import {
  type DocumentLineBatchOperations,
  type DocumentLineColumn,
  DocumentLineEditableTable,
  type DocumentLineEditableTableProps,
} from '../documents/DocumentLineEditableTable';
import { DocumentLineQuantityInput } from '../documents/DocumentLineQuantityInput';
import { ResizableTable as Table } from './ResizableTable';
import { renderCustomFieldCell } from '../documents/CustomFieldCell';
import {
  type SharedFieldHelpKey,
  withSharedFieldHelp,
} from '../documents/shared-field-help';
import type {
  FilterableSelectRequestFn,
  MaterialFilteredSelectOption,
} from '../inventory/material-select-types';
import { useOrderItemEditorCapabilities } from '../../providers/BusinessUiProvider';
import type {
  OrderItemCommercialLineAmounts,
  OrderItemCurrencyOption,
  OrderItemDocumentLineCustomFieldSchema,
  OrderItemEditorCapabilities,
} from '../sales/order-item-editor-types';
import type { CustomFieldDefinition } from '../documents/custom-field-form-types';
import {
  buildOrderItemAmountPreviewRequest,
  buildOrderItemAmountPreviewSignature,
  calculateOrderItemAmounts,
  normalizeOrderItemAmountPreview,
} from '../sales/order-item-editor-amounts';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderItemDraft {
  _key: string;
  materialId: string;
  materialOption?: MaterialFilteredSelectOption;
  qty: number;
  itemMode?: 'material' | 'temporary';
  temporaryItemCode?: string;
  temporaryItemName?: string;
  temporaryItemSpec?: string;
  purchaseUnit?: string;
  unitPrice?: number;
  currency?: string;
  discountRate?: number;
  taxRate?: number;
  priceIncludesTax?: boolean;
  [key: string]: unknown;
}

export interface OrderItemEditorProps {
  className?: string;
  items: OrderItemDraft[];
  onChange: (items: OrderItemDraft[]) => void;
  /**
   * Prefer functional row updates when the parent owns React state. This keeps
   * material selection and nearby cell edits from overwriting one another
   * before the next render.
   */
  onRowsUpdate?: (
    updater: (items: OrderItemDraft[]) => OrderItemDraft[],
  ) => void;
  title?: React.ReactNode;
  required?: boolean;
  titleHelpKey?: SharedFieldHelpKey;
  showPrice?: boolean;
  showCurrency?: boolean;
  showCommercialAmountFields?: boolean;
  commercialAmountPreviewDocumentType?: string;
  commercialAmountPreviewDomain?: 'sales' | 'purchase';
  currencyPlaceholder?: string;
  qtyLabel?: string;
  qtyRequired?: boolean;
  qtyMin?: number;
  qtyStep?: number;
  qtyPrecision?: number;
  disableQtyInput?:
    | boolean
    | ((item: OrderItemDraft, index: number) => boolean);
  qtyErrors?: Record<string, string | undefined>;
  materialLabel?: string;
  minRows?: number;
  /** 物料选择后的额外回调（如自动填充协议价） */
  onMaterialChange?: (
    index: number,
    materialId: string,
    option?: MaterialFilteredSelectOption,
  ) => void;
  /** 数量变更后的业务联动，例如按数量阶梯重新解析销售价。 */
  onQuantityChange?: (itemKey: string, quantity: number) => void;
  materialRequest?: FilterableSelectRequestFn;
  materialPlaceholder?: string;
  materialFilterMode?: React.ComponentProps<typeof MaterialFilteredSelect>['filterMode'];
  materialSelectWidth?: number;
  materialBaseTypeWidth?: number;
  materialCategoryWidth?: number;
  allowTemporaryItem?: boolean;
  materialModeLabel?: string;
  temporaryItemLabel?: string;
  disableAdd?: boolean;
  disableMaterialSelect?:
    | boolean
    | ((item: OrderItemDraft, index: number) => boolean);
  hideMaterialSelect?:
    | boolean
    | ((item: OrderItemDraft, index: number) => boolean);
  layout?: 'inline' | 'card' | 'table';
  showRowIndex?: boolean;
  cardClassName?: string;
  cardHeaderClassName?: string;
  cardMainClassName?: string;
  cardBelowClassName?: string;
  addButtonClassName?: string;
  /** 明细表右上角扩展操作，例如批量新增物料。 */
  toolbarActions?: React.ReactNode;
  renderExtra?: (
    item: OrderItemDraft,
    index: number,
    update: (patch: Partial<OrderItemDraft>) => void,
  ) => React.ReactNode;
  buildPriceChangePatch?: (
    item: OrderItemDraft,
    unitPrice: number | undefined,
  ) => Partial<OrderItemDraft>;
  renderExtraTitle?: string;
  renderExtraWidth?: number;
  renderAfterQty?: (
    item: OrderItemDraft,
    index: number,
    update: (patch: Partial<OrderItemDraft>) => void,
  ) => React.ReactNode;
  renderAfterQtyTitle?: string;
  renderAfterQtyWidth?: number;
  scrollX?: number;
  density?: 'default' | 'compact';
  expandBelowByDefault?: boolean;
  lineCustomFieldObjectType?: string;
  tableResizable?: DocumentLineEditableTableProps<OrderItemDraft>['resizable'];
  /** 高效录入时的批量复制/删除配置；表格布局默认开启。 */
  batchOperations?: DocumentLineEditableTableProps<OrderItemDraft>['batchOperations'];
  renderBelow?: (
    item: OrderItemDraft,
    index: number,
    update: (patch: Partial<OrderItemDraft>) => void,
  ) => React.ReactNode;
}

interface OrderItemRowProps {
  item: OrderItemDraft;
  index: number;
  showPrice: boolean;
  showCurrency: boolean;
  showCommercialAmountFields: boolean;
  currencyPlaceholder: string;
  qtyLabel: string;
  qtyRequired: boolean;
  qtyMin: number;
  qtyStep?: number;
  qtyPrecision?: number;
  qtyDisabled: boolean;
  qtyError?: string;
  canDelete: boolean;
  currencyOptions: OrderItemCurrencyOption[];
  currencyLoading: boolean;
  currencyError: boolean;
  onCurrencyConfigOpen: () => void;
  editorCapabilities?: OrderItemEditorCapabilities;
  onUpdate: (index: number, patch: Partial<OrderItemDraft>) => void;
  onRemove: (index: number) => void;
  onMaterialChange?: (
    index: number,
    materialId: string,
    option?: MaterialFilteredSelectOption,
  ) => void;
  materialRequest: FilterableSelectRequestFn;
  materialPlaceholder: string;
  materialFilterMode: NonNullable<OrderItemEditorProps['materialFilterMode']>;
  materialSelectWidth: number;
  materialBaseTypeWidth: number;
  materialCategoryWidth: number;
  allowTemporaryItem: boolean;
  materialModeLabel: string;
  temporaryItemLabel: string;
  materialDisabled: boolean;
  materialHidden: boolean;
  layout: NonNullable<OrderItemEditorProps['layout']>;
  showRowIndex: boolean;
  cardClassName?: string;
  cardHeaderClassName?: string;
  cardMainClassName?: string;
  cardBelowClassName?: string;
  renderExtra?: OrderItemEditorProps['renderExtra'];
  buildPriceChangePatch?: OrderItemEditorProps['buildPriceChangePatch'];
  renderBelow?: OrderItemEditorProps['renderBelow'];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _nextKey = 0;
export function nextItemKey(): string {
  _nextKey += 1;
  return `_item_${_nextKey}_${Date.now()}`;
}

function createDefaultOrderItem(): OrderItemDraft {
  return { _key: nextItemKey(), materialId: '', qty: 1, unitPrice: undefined };
}

const emptyMaterialRequest: FilterableSelectRequestFn = async () => [];

function isEffectiveOrderItem(item: OrderItemDraft): boolean {
  return Boolean(
    item.materialId ||
      item.itemMode === 'temporary' ||
      item.temporaryItemCode ||
      item.temporaryItemName ||
      item.temporaryItemSpec ||
      item.purchaseUnit ||
      item.unitPrice ||
      item.remarks,
  );
}

function FieldError({ message: errorMessage }: { message?: string }) {
  if (!errorMessage) return null;
  return (
    <Typography.Text type="danger" style={{ fontSize: 12 }}>
      {errorMessage}
    </Typography.Text>
  );
}

function formatMoney(value: number | null): string {
  if (value === null) return '-';
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function calculateDraftAmounts(item: OrderItemDraft) {
  return calculateOrderItemAmounts({
    qty: item.qty,
    unitPrice: item.unitPrice,
    discountRate: item.discountRate,
    taxRate: item.taxRate,
    priceIncludesTax: item.priceIncludesTax,
  });
}

export function getOrderItemMaterialCode(item: OrderItemDraft): string {
  if (item.itemMode === 'temporary') {
    return item.temporaryItemCode?.trim() ?? '';
  }
  if (
    item.materialOption?.value === item.materialId &&
    item.materialOption.code
  ) {
    return item.materialOption.code.trim();
  }
  const material = item.material;
  if (material && typeof material === 'object' && !Array.isArray(material)) {
    const code = (material as Record<string, unknown>).code;
    return typeof code === 'string' ? code.trim() : '';
  }
  return '';
}

type OrderItemLineCustomField = NonNullable<
  OrderItemDocumentLineCustomFieldSchema['fields']
>[number];

interface CommercialAmountPreview {
  signature: string;
  result: OrderItemCommercialLineAmounts;
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function resolveLineFieldSortOrder(field: OrderItemLineCustomField): number {
  const displayOrder = readObject(field.displayJson).sortOrder;
  return typeof displayOrder === 'number'
    ? displayOrder
    : (field.sortOrder ?? 0);
}

function resolveLineCustomFieldWidth(field: OrderItemLineCustomField): number {
  const listWidth = readObject(field.displayJson).listWidth;
  if (typeof listWidth === 'number' && listWidth > 0) return listWidth;
  if (field.dataType === 'long_text') return 200;
  if (field.dataType === 'date' || field.dataType === 'datetime') return 168;
  if (field.dataType === 'boolean') return 96;
  return 140;
}

function getDocumentLineFormDisplayFields(
  schema: OrderItemDocumentLineCustomFieldSchema | null | undefined,
): OrderItemLineCustomField[] {
  return (schema?.fields ?? [])
    .filter(
      (field) =>
        field.isActive !== false &&
        readObject(field.displayJson).showInForm === true &&
        (field.fieldKind === 'input' || field.fieldKind === 'formula'),
    )
    .slice()
    .sort((left, right) => resolveLineFieldSortOrder(left) - resolveLineFieldSortOrder(right));
}

function sumDocumentLineCustomFieldColumnWidths(
  schema: OrderItemDocumentLineCustomFieldSchema | null | undefined,
): number {
  return getDocumentLineFormDisplayFields(schema).reduce(
    (sum, field) => sum + resolveLineCustomFieldWidth(field),
    0,
  );
}

function getLineFieldOptions(field: OrderItemLineCustomField) {
  const options = readObject(field.optionsJson).options;
  if (!Array.isArray(options)) return [];
  return options
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
      if (!value) return null;
      return {
        label: typeof record.label === 'string' ? record.label : value,
        value,
        disabled: record.enabled === false,
      };
    })
    .filter((option): option is NonNullable<typeof option> => option !== null);
}

function toDayjsValue(value: unknown): Dayjs | undefined {
  if (typeof value !== 'string' || !value) return undefined;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : undefined;
}

function renderLineCustomFieldEditor(
  field: OrderItemLineCustomField,
  value: unknown,
  onChange: (next: unknown) => void,
) {
  if (
    field.dataType === 'number' ||
    field.dataType === 'decimal' ||
    field.dataType === 'money'
  ) {
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
    return (
      <Switch checked={value === true} onChange={(checked) => onChange(checked)} />
    );
  }
  if (field.dataType === 'date' || field.dataType === 'datetime') {
    return (
      <DatePicker
        value={toDayjsValue(value)}
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
        options={getLineFieldOptions(field)}
        onChange={(next) => onChange(next ?? null)}
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

function createDocumentLineCustomFieldColumns(
  schema: OrderItemDocumentLineCustomFieldSchema | null | undefined,
): DocumentLineColumn<OrderItemDraft>[] {
  return getDocumentLineFormDisplayFields(schema).map((field) => ({
    key: `line-custom-${field.fieldKey}`,
    title: field.label,
    required: field.fieldKind === 'input' && field.requiredPolicy !== 'none',
    width: resolveLineCustomFieldWidth(field),
    render: (row, _index, update) => {
      if (field.fieldKind === 'formula') {
        return renderCustomFieldCell(field, {
          computedValues: row.customComputedValues,
          rawValues: row.customValues,
          errors: row.customComputedErrors,
        });
      }
      const currentValues = readObject(row.customValues);
      return renderLineCustomFieldEditor(
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

function buildLineCustomFieldPreviewItems(
  rows: OrderItemDraft[],
  schema: OrderItemDocumentLineCustomFieldSchema,
): Array<Record<string, unknown>> {
  return rows.map((row) => {
    const item: Record<string, unknown> = {};
    for (const field of schema.systemFields ?? []) {
      if (Object.hasOwn(row, field.key)) item[field.key] = row[field.key];
      else if (field.key === 'quantity' && Object.hasOwn(row, 'qty')) {
        item[field.key] = row.qty;
      }
    }
    item.customValues = readObject(row.customValues);
    return item;
  });
}

function applyLineCustomFieldPreview(
  rows: OrderItemDraft[],
  previews: Array<{
    customComputedValues?: Record<string, unknown>;
    customComputedErrors?: Record<string, unknown>;
  }>,
): OrderItemDraft[] {
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

function customFieldRuntimeSignature(row: OrderItemDraft): string {
  return JSON.stringify({
    customComputedValues: row.customComputedValues ?? {},
    customComputedErrors: row.customComputedErrors ?? {},
  });
}

function sameCustomFieldRuntime(
  leftRows: OrderItemDraft[],
  rightRows: OrderItemDraft[],
): boolean {
  return (
    leftRows.length === rightRows.length &&
    leftRows.every(
      (row, index) =>
        customFieldRuntimeSignature(row) ===
        customFieldRuntimeSignature(rightRows[index]),
    )
  );
}

function createMaterialCodeLineColumn(
  getCode: (item: OrderItemDraft) => string,
): DocumentLineColumn<OrderItemDraft> {
  return {
    key: 'materialCode',
    title: '物料编码',
    width: 150,
    fixed: 'left',
    render: (item) => {
      const code = getCode(item).trim();
      return (
        <Typography.Text ellipsis={{ tooltip: code || undefined }}>
          {code || '-'}
        </Typography.Text>
      );
    },
  };
}

function useCurrencyOptions(
  requestOptions: OrderItemEditorCapabilities['requestCurrencyOptions'],
) {
  const [options, setOptions] = useState<OrderItemCurrencyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const refreshAfterConfigRef = useRef(false);

  useEffect(() => {
    const refreshAfterConfig = () => {
      if (!refreshAfterConfigRef.current) return;
      refreshAfterConfigRef.current = false;
      setRequestVersion((current) => current + 1);
    };
    window.addEventListener('focus', refreshAfterConfig);
    return () => window.removeEventListener('focus', refreshAfterConfig);
  }, []);

  useEffect(() => {
    if (!requestOptions) {
      setOptions([]);
      setLoading(false);
      setError(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    requestOptions()
      .then((nextOptions) => {
        if (!cancelled) setOptions(nextOptions);
      })
      .catch(() => {
        if (!cancelled) {
          setOptions([]);
          setError(true);
          message.error('加载币种字典失败');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requestOptions, requestVersion]);

  const markConfigEntryOpened = useCallback(() => {
    refreshAfterConfigRef.current = true;
  }, []);

  return { options, loading, error, markConfigEntryOpened };
}

function renderCurrencyConfigEntry(
  capabilities: OrderItemEditorCapabilities | undefined,
  label: string,
  onOpen: () => void,
) {
  return capabilities?.renderConfigEntryLink?.({
    target: 'dictionary',
    typeCode: 'currency',
    label,
    onOpen,
  });
}

function renderOrderItemTitle(
  title: React.ReactNode,
  helpKey: SharedFieldHelpKey | undefined,
  capabilities: OrderItemEditorCapabilities | undefined,
): React.ReactNode {
  if (!helpKey) return title;
  return (
    capabilities?.renderFieldHelp?.({ label: title, helpKey }) ??
    withSharedFieldHelp(title, helpKey)
  );
}

// ─── Row Component (memoized) ─────────────────────────────────────────────────

const OrderItemRow = React.memo(function OrderItemRow({
  item,
  index,
  showPrice,
  showCurrency,
  showCommercialAmountFields,
  currencyPlaceholder,
  qtyLabel,
  qtyRequired,
  qtyMin,
  qtyStep,
  qtyPrecision,
  qtyDisabled,
  qtyError,
  canDelete,
  currencyOptions,
  currencyLoading,
  currencyError,
  onCurrencyConfigOpen,
  editorCapabilities,
  onUpdate,
  onRemove,
  onMaterialChange,
  materialRequest,
  materialPlaceholder,
  materialFilterMode,
  materialSelectWidth,
  materialBaseTypeWidth,
  materialCategoryWidth,
  allowTemporaryItem,
  materialModeLabel,
  temporaryItemLabel,
  materialDisabled,
  materialHidden,
  layout,
  showRowIndex,
  cardClassName,
  cardHeaderClassName,
  cardMainClassName,
  cardBelowClassName,
  renderExtra,
  buildPriceChangePatch,
  renderBelow,
}: OrderItemRowProps) {
  const { token } = theme.useToken();
  const itemMode =
    allowTemporaryItem && item.itemMode === 'temporary'
      ? 'temporary'
      : 'material';

  const handleModeChange = useCallback(
    (mode: 'material' | 'temporary') => {
      if (mode === 'material') {
        onUpdate(index, {
          itemMode: 'material',
          temporaryItemCode: undefined,
          temporaryItemName: undefined,
          temporaryItemSpec: undefined,
          purchaseUnit: undefined,
        });
        return;
      }
      onUpdate(index, {
        itemMode: 'temporary',
        materialId: '',
        materialOption: undefined,
        material: undefined,
      });
    },
    [index, onUpdate],
  );

  const handleMaterialChange = useCallback(
    (v: string | undefined, option?: MaterialFilteredSelectOption) => {
      onUpdate(index, {
        materialId: v ?? '',
        materialOption: option,
        material: undefined,
      });
      if (v) onMaterialChange?.(index, v, option);
    },
    [index, onUpdate, onMaterialChange],
  );

  const handleQtyChange = useCallback(
    (v: number | null) => {
      if (v !== null) onUpdate(index, { qty: v });
    },
    [index, onUpdate],
  );

  const handlePriceChange = useCallback(
    (v: number | null) => {
      const unitPrice = v ?? undefined;
      onUpdate(index, {
        unitPrice,
        ...(buildPriceChangePatch?.(item, unitPrice) ?? {}),
      });
    },
    [buildPriceChangePatch, index, item, onUpdate],
  );

  const handleCurrencyChange = useCallback(
    (value: string | undefined) =>
      onUpdate(index, {
        currency: value || undefined,
      }),
    [index, onUpdate],
  );

  const handleDiscountRateChange = useCallback(
    (v: number | null) => onUpdate(index, { discountRate: v ?? undefined }),
    [index, onUpdate],
  );

  const handleTaxRateChange = useCallback(
    (v: number | null) => onUpdate(index, { taxRate: v ?? undefined }),
    [index, onUpdate],
  );

  const handlePriceIncludesTaxChange = useCallback(
    (value: boolean) => onUpdate(index, { priceIncludesTax: value }),
    [index, onUpdate],
  );

  const handleTemporaryTextChange = useCallback(
    (field: keyof OrderItemDraft, value: string) => {
      onUpdate(index, { [field]: value });
    },
    [index, onUpdate],
  );

  const handleRemove = useCallback(() => onRemove(index), [index, onRemove]);

  const handleExtraUpdate = useCallback(
    (patch: Partial<OrderItemDraft>) => onUpdate(index, patch),
    [index, onUpdate],
  );

  const mainFields = (
    <>
      {allowTemporaryItem && !materialHidden ? (
        <Segmented
          size="small"
          value={itemMode}
          options={[
            { label: materialModeLabel, value: 'material' },
            { label: temporaryItemLabel, value: 'temporary' },
          ]}
          onChange={(value) =>
            handleModeChange(value as 'material' | 'temporary')
          }
        />
      ) : null}
      {!materialHidden && itemMode === 'material' && (
        <MaterialFilteredSelect
          request={materialRequest}
          value={item.materialId || undefined}
          selectedOption={
            item.materialOption?.value === item.materialId
              ? item.materialOption
              : undefined
          }
          onChange={handleMaterialChange}
          placeholder={materialPlaceholder}
          disabled={materialDisabled}
          filterMode={materialFilterMode}
          baseTypeWidth={materialBaseTypeWidth}
          categoryWidth={materialCategoryWidth}
          selectWidth={materialSelectWidth}
        />
      )}
      {allowTemporaryItem && itemMode === 'temporary' ? (
        <>
          <Input
            value={item.temporaryItemCode}
            onChange={(event) =>
              handleTemporaryTextChange('temporaryItemCode', event.target.value)
            }
            placeholder="临时编码/图号"
            style={{ width: 150 }}
            maxLength={128}
            disabled={materialDisabled}
          />
          <Input
            value={item.temporaryItemName}
            onChange={(event) =>
              handleTemporaryTextChange('temporaryItemName', event.target.value)
            }
            placeholder={`${temporaryItemLabel}名称 *`}
            style={{ width: 180 }}
            maxLength={256}
            disabled={materialDisabled}
          />
          <Input
            value={item.temporaryItemSpec}
            onChange={(event) =>
              handleTemporaryTextChange('temporaryItemSpec', event.target.value)
            }
            placeholder="规格"
            style={{ width: 180 }}
            maxLength={256}
            disabled={materialDisabled}
          />
          <Input
            value={item.purchaseUnit}
            onChange={(event) =>
              handleTemporaryTextChange('purchaseUnit', event.target.value)
            }
            placeholder="单位"
            style={{ width: 90 }}
            maxLength={32}
            disabled={materialDisabled}
          />
        </>
      ) : null}
      <DocumentLineQuantityInput
        value={item.qty}
        onChange={handleQtyChange}
        placeholder={qtyRequired ? `${qtyLabel} *` : qtyLabel}
        style={{ width: 100 }}
        min={qtyMin}
        step={qtyStep}
        precision={qtyPrecision}
        disabled={qtyDisabled}
        status={qtyError ? 'error' : undefined}
        controls={false}
      />
      {showPrice && (
        <InputNumber
          value={item.unitPrice}
          onChange={handlePriceChange}
          placeholder="单价"
          style={{ width: 120 }}
          min={0}
          precision={2}
          controls={false}
        />
      )}
      {showPrice && showCurrency && (
        <Space size={4}>
          <Select
            value={item.currency}
            onChange={handleCurrencyChange}
            options={currencyOptions}
            placeholder={currencyPlaceholder}
            style={{ width: 88 }}
            showSearch
            allowClear
            optionFilterProp="label"
          />
          {currencyOptions.length === 0 &&
          !currencyLoading &&
          !currencyError &&
          !item.currency ? (
            renderCurrencyConfigEntry(
              editorCapabilities,
              currencyPlaceholder,
              onCurrencyConfigOpen,
            )
          ) : null}
        </Space>
      )}
      {showPrice && showCommercialAmountFields && (
        <>
          <InputNumber
            value={item.discountRate}
            onChange={handleDiscountRateChange}
            placeholder="折扣%"
            style={{ width: 92 }}
            min={0}
            max={100}
            precision={4}
            controls={false}
          />
          <InputNumber
            value={item.taxRate}
            onChange={handleTaxRateChange}
            placeholder="税率%"
            style={{ width: 92 }}
            min={0}
            max={100}
            precision={4}
            controls={false}
          />
          <Segmented
            size="small"
            value={item.priceIncludesTax === true}
            options={[
              { label: '未税', value: false },
              { label: '含税', value: true },
            ]}
            onChange={(value) => handlePriceIncludesTaxChange(Boolean(value))}
          />
        </>
      )}
      {renderExtra?.(item, index, handleExtraUpdate)}
    </>
  );

  if (layout === 'card') {
    const showCardHeader = showRowIndex || canDelete;

    return (
      <div
        className={cardClassName}
        style={{
          width: '100%',
          marginBottom: 12,
          padding: 16,
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: token.borderRadiusLG,
          background: token.colorFillAlter,
        }}
      >
        {showCardHeader ? (
          <div
            className={cardHeaderClassName}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: token.fontSizeSM,
                fontWeight: 600,
                color: token.colorTextDescription,
              }}
            >
              {showRowIndex ? `第 ${index + 1} 行` : ''}
            </span>
            {canDelete ? (
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={handleRemove}
              />
            ) : null}
          </div>
        ) : null}
        <div
          className={cardMainClassName}
          data-material-hidden={materialHidden ? 'true' : undefined}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          {mainFields}
        </div>
        {renderBelow ? (
          <div className={cardBelowClassName} style={{ marginTop: 12 }}>
            {renderBelow(item, index, handleExtraUpdate)}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', marginBottom: 8 }}>
      <Space
        size={[8, 8]}
        wrap
        style={{ display: 'flex', width: '100%' }}
        align="start"
      >
        {mainFields}
        {canDelete ? (
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={handleRemove}
          />
        ) : null}
      </Space>
      {renderBelow ? (
        <div style={{ width: '100%', marginTop: 8 }}>
          {renderBelow(item, index, handleExtraUpdate)}
        </div>
      ) : null}
    </div>
  );
});

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @sunxu-layer business
 * @sunxu-domain shared
 * @sunxu-reason Retains material/temporary item editing, commercial controls, custom fields, and every host detail layout while all data and side effects come from host capabilities.
 */
export function OrderItemEditor({
  className,
  items,
  onChange,
  onRowsUpdate,
  title = '明细',
  required = false,
  titleHelpKey,
  showPrice = true,
  showCurrency = false,
  showCommercialAmountFields = false,
  commercialAmountPreviewDocumentType,
  commercialAmountPreviewDomain = 'sales',
  currencyPlaceholder = '币别',
  qtyLabel = '数量',
  qtyRequired = false,
  qtyMin = 1,
  qtyStep,
  qtyPrecision,
  disableQtyInput = false,
  qtyErrors,
  materialLabel = '物料',
  minRows = 1,
  onMaterialChange,
  onQuantityChange,
  materialRequest,
  materialPlaceholder = `搜索${materialLabel}`,
  materialFilterMode = 'hidden',
  materialSelectWidth = 320,
  materialBaseTypeWidth = 88,
  materialCategoryWidth = 108,
  allowTemporaryItem = false,
  materialModeLabel = `正式${materialLabel}`,
  temporaryItemLabel = '临时品',
  disableAdd = false,
  disableMaterialSelect = false,
  hideMaterialSelect = false,
  layout = 'table',
  showRowIndex = false,
  cardClassName,
  cardHeaderClassName,
  cardMainClassName,
  cardBelowClassName,
  addButtonClassName,
  toolbarActions,
  renderExtra,
  buildPriceChangePatch,
  renderExtraTitle,
  renderExtraWidth,
  renderAfterQty,
  renderAfterQtyTitle,
  renderAfterQtyWidth,
  scrollX,
  density = 'default',
  expandBelowByDefault = true,
  lineCustomFieldObjectType,
  tableResizable,
  batchOperations,
  renderBelow,
}: OrderItemEditorProps) {
  const editorCapabilities = useOrderItemEditorCapabilities();
  const resolvedMaterialRequest =
    materialRequest ?? editorCapabilities?.requestMaterials ?? emptyMaterialRequest;
  // 通过 ref 读取最新 items，避免 updateItem/addItem/removeItem 依赖 items
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const {
    options: currencyOptions,
    loading: currencyLoading,
    error: currencyError,
    markConfigEntryOpened: markCurrencyConfigOpened,
  } = useCurrencyOptions(editorCapabilities?.requestCurrencyOptions);
  const [materialCustomFields, setMaterialCustomFields] = useState<
    CustomFieldDefinition[]
  >([]);
  const [lineCustomFieldSchema, setLineCustomFieldSchema] =
    useState<OrderItemDocumentLineCustomFieldSchema | null>(null);
  const rowsRef = useRef(items);
  rowsRef.current = items;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const requestFields = editorCapabilities?.requestMaterialListCustomFields;
    if (!requestFields || layout !== 'table') {
      setMaterialCustomFields([]);
      return undefined;
    }
    let cancelled = false;
    requestFields()
      .then((fields) => {
        if (!cancelled) setMaterialCustomFields(fields);
      })
      .catch(() => {
        if (!cancelled) message.error('加载物料自定义字段失败');
      });
    return () => {
      cancelled = true;
    };
  }, [editorCapabilities?.requestMaterialListCustomFields, layout]);

  useEffect(() => {
    const requestSchema =
      editorCapabilities?.requestDocumentLineCustomFieldSchema;
    if (!lineCustomFieldObjectType || !requestSchema || layout !== 'table') {
      setLineCustomFieldSchema(null);
      return undefined;
    }
    let cancelled = false;
    requestSchema({ objectType: lineCustomFieldObjectType })
      .then((schema) => {
        if (!cancelled) setLineCustomFieldSchema(schema ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setLineCustomFieldSchema(null);
          message.error('加载明细自定义字段失败');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    editorCapabilities?.requestDocumentLineCustomFieldSchema,
    layout,
    lineCustomFieldObjectType,
  ]);

  const lineCustomFieldPreviewItems = useMemo(
    () =>
      lineCustomFieldSchema
        ? buildLineCustomFieldPreviewItems(items, lineCustomFieldSchema)
        : [],
    [items, lineCustomFieldSchema],
  );
  const hasFormulaCustomField = useMemo(
    () =>
      getDocumentLineFormDisplayFields(lineCustomFieldSchema).some(
        (field) => field.fieldKind === 'formula',
      ),
    [lineCustomFieldSchema],
  );
  const lineCustomFieldPreviewSignature = useMemo(() => {
    if (
      !lineCustomFieldObjectType ||
      !lineCustomFieldSchema ||
      !hasFormulaCustomField ||
      items.length === 0
    ) {
      return '';
    }
    return JSON.stringify({
      objectType: lineCustomFieldObjectType,
      schemaVersion: lineCustomFieldSchema.schemaVersion,
      items: lineCustomFieldPreviewItems,
    });
  }, [
    hasFormulaCustomField,
    items.length,
    lineCustomFieldObjectType,
    lineCustomFieldPreviewItems,
    lineCustomFieldSchema,
  ]);
  const lineCustomFieldPreviewSequenceRef = useRef(0);
  useEffect(() => {
    const sequence = lineCustomFieldPreviewSequenceRef.current + 1;
    lineCustomFieldPreviewSequenceRef.current = sequence;
    const preview = editorCapabilities?.previewDocumentLineCustomFields;
    if (
      !preview ||
      !lineCustomFieldPreviewSignature ||
      !lineCustomFieldObjectType ||
      !lineCustomFieldSchema
    ) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      preview({
        objectType: lineCustomFieldObjectType,
        customFieldSchemaVersion: lineCustomFieldSchema.schemaVersion,
        items: lineCustomFieldPreviewItems,
      })
        .then((result) => {
          if (lineCustomFieldPreviewSequenceRef.current !== sequence) return;
          const nextRows = applyLineCustomFieldPreview(
            rowsRef.current,
            result.items ?? [],
          );
          if (!sameCustomFieldRuntime(rowsRef.current, nextRows)) {
            onChangeRef.current(nextRows);
          }
        })
        .catch(() => {
          if (lineCustomFieldPreviewSequenceRef.current === sequence) {
            message.error('预览明细计算属性失败');
          }
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      if (lineCustomFieldPreviewSequenceRef.current === sequence) {
        lineCustomFieldPreviewSequenceRef.current += 1;
      }
    };
  }, [
    editorCapabilities?.previewDocumentLineCustomFields,
    lineCustomFieldObjectType,
    lineCustomFieldPreviewItems,
    lineCustomFieldPreviewSignature,
    lineCustomFieldSchema,
  ]);

  const materialCustomFieldScrollWidth = useMemo(
    () => sumMaterialCustomFieldColumnWidths(materialCustomFields),
    [materialCustomFields],
  );
  const lineCustomFieldScrollWidth = useMemo(
    () => sumDocumentLineCustomFieldColumnWidths(lineCustomFieldSchema),
    [lineCustomFieldSchema],
  );
  const defaultBatchFields = useMemo<DocumentLineBatchField<OrderItemDraft>[]>(
    () => [
      // 数量被锁定的明细（如包装单元关联的销售出库单行）不能从批量入口绕过。
      ...(disableQtyInput === false
        ? [
            {
              key: 'qty',
              label: qtyLabel,
              type: 'number' as const,
              required: qtyRequired,
              min: qtyMin,
              precision: qtyPrecision ?? 4,
              patch: (qty: number | undefined) => ({ qty: qty ?? 1 }),
            },
          ]
        : []),
      ...(showPrice
        ? [
            {
              key: 'unitPrice',
              label: '单价',
              type: 'number' as const,
              min: 0,
              precision: 4,
              patch: (unitPrice: number | undefined) => ({ unitPrice }),
            },
          ]
        : []),
      ...(showCurrency
        ? [
            {
              key: 'currency',
              label: '币种',
              type: 'select' as const,
              options: currencyOptions,
              patch: (currency: string | undefined) => ({ currency }),
            },
          ]
        : []),
      ...(showCommercialAmountFields
        ? [
            {
              key: 'discountRate',
              label: '折扣率',
              type: 'number' as const,
              min: 0,
              max: 100,
              precision: 4,
              patch: (discountRate: number | undefined) => ({ discountRate }),
            },
            {
              key: 'taxRate',
              label: '税率',
              type: 'number' as const,
              min: 0,
              max: 100,
              precision: 4,
              patch: (taxRate: number | undefined) => ({ taxRate }),
            },
            {
              key: 'priceIncludesTax',
              label: '计税方式',
              type: 'select' as const,
              options: [
                { label: '含税', value: 'true' },
                { label: '未税', value: 'false' },
              ],
              patch: (priceIncludesTax: string | undefined) => ({
                priceIncludesTax:
                  priceIncludesTax === undefined
                    ? undefined
                    : priceIncludesTax === 'true',
              }),
            },
          ]
        : []),
      {
        key: 'remarks',
        label: '明细备注',
        type: 'text',
        maxLength: 500,
        patch: (remarks) => ({ remarks }),
      },
    ],
    [
      currencyOptions,
      disableQtyInput,
      qtyLabel,
      qtyMin,
      qtyPrecision,
      qtyRequired,
      showCommercialAmountFields,
      showCurrency,
      showPrice,
    ],
  );
  const effectiveBatchOperations = useMemo<
    DocumentLineBatchOperations<OrderItemDraft>
  >(() => {
    const fieldsByKey = new Map<string, DocumentLineBatchField<OrderItemDraft>>(
      defaultBatchFields.map((field) => [field.key, field]),
    );
    for (const field of batchOperations?.fields ?? []) {
      fieldsByKey.set(field.key, field);
    }
    if (disableQtyInput !== false) {
      fieldsByKey.delete('qty');
    }
    return {
      enabled: batchOperations?.enabled ?? true,
      allowCopy: batchOperations?.allowCopy,
      autoSelectNewRows: batchOperations?.autoSelectNewRows,
      fields: Array.from(fieldsByKey.values()),
      mapBatchPatch: (item, patch) => {
        const callerPatch =
          batchOperations?.mapBatchPatch?.(item, patch) ?? patch;
        if (!Object.hasOwn(patch, 'unitPrice')) {
          return callerPatch;
        }
        return {
          ...callerPatch,
          ...(buildPriceChangePatch?.(item, callerPatch.unitPrice) ?? {}),
        };
      },
      onBatchPatchesApplied: (selectedRows, patch) => {
        batchOperations?.onBatchPatchesApplied?.(selectedRows, patch);
        if (typeof patch.qty === 'number') {
          for (const item of selectedRows) {
            onQuantityChange?.(item._key, patch.qty);
          }
        }
      },
    };
  }, [
    batchOperations,
    buildPriceChangePatch,
    defaultBatchFields,
    disableQtyInput,
    onQuantityChange,
  ]);
  const [commercialAmountPreviews, setCommercialAmountPreviews] = useState<
    Record<string, CommercialAmountPreview>
  >({});
  const [commercialAmountPreviewError, setCommercialAmountPreviewError] =
    useState(false);
  const commercialAmountPreviewSequenceRef = useRef(0);

  useEffect(() => {
    const sequence = commercialAmountPreviewSequenceRef.current + 1;
    commercialAmountPreviewSequenceRef.current = sequence;
    if (!showCommercialAmountFields || !commercialAmountPreviewDocumentType) {
      setCommercialAmountPreviews({});
      setCommercialAmountPreviewError(false);
      return;
    }
    const previewItems = items.filter(
      (item) => item.materialId && item.unitPrice != null,
    );
    if (previewItems.length === 0) {
      setCommercialAmountPreviews({});
      setCommercialAmountPreviewError(false);
      return;
    }
    const previewCommercialAmounts = editorCapabilities?.previewCommercialAmounts;
    if (!previewCommercialAmounts) {
      setCommercialAmountPreviews({});
      setCommercialAmountPreviewError(true);
      return;
    }
    const timer = window.setTimeout(() => {
      void Promise.all(
        previewItems.map(async (item) => {
          const signature = buildOrderItemAmountPreviewSignature(item);
          const result = await previewCommercialAmounts(
            buildOrderItemAmountPreviewRequest(item, {
              domain: commercialAmountPreviewDomain,
              documentType: commercialAmountPreviewDocumentType,
            }),
          );
          return {
            key: item._key,
            preview: {
              signature,
              result: normalizeOrderItemAmountPreview(result),
            },
          };
        }),
      )
        .then((entries) => {
          if (commercialAmountPreviewSequenceRef.current !== sequence) return;
          setCommercialAmountPreviews(
            Object.fromEntries(
              entries.map((entry) => [entry.key, entry.preview]),
            ),
          );
          setCommercialAmountPreviewError(false);
        })
        .catch(() => {
          if (commercialAmountPreviewSequenceRef.current !== sequence) return;
          setCommercialAmountPreviews({});
          setCommercialAmountPreviewError(true);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      if (commercialAmountPreviewSequenceRef.current === sequence) {
        commercialAmountPreviewSequenceRef.current += 1;
      }
    };
  }, [
    commercialAmountPreviewDocumentType,
    commercialAmountPreviewDomain,
    editorCapabilities?.previewCommercialAmounts,
    items,
    showCommercialAmountFields,
  ]);

  const updateItem = useCallback(
    (index: number, patch: Partial<OrderItemDraft>) => {
      const next = [...itemsRef.current];
      next[index] = { ...next[index], ...patch };
      onChange(next);
      if (typeof patch.qty === 'number') {
        onQuantityChange?.(next[index]._key, patch.qty);
      }
    },
    [onChange, onQuantityChange],
  );

  const addItem = useCallback(() => {
    onChange([...itemsRef.current, createDefaultOrderItem()]);
  }, [onChange]);

  const removeItem = useCallback(
    (index: number) => {
      onChange(itemsRef.current.filter((_, i) => i !== index));
    },
    [onChange],
  );

  const canDelete = items.length > minRows;
  const resolveDraftAmounts = useCallback(
    (item: OrderItemDraft) => {
      if (!commercialAmountPreviewDocumentType) {
        return calculateDraftAmounts(item);
      }
      const preview = commercialAmountPreviews[item._key];
      if (preview?.signature === buildOrderItemAmountPreviewSignature(item)) {
        return preview.result;
      }
      return {
        ...calculateDraftAmounts(item),
        amount: null,
        discountAmount: null,
        discountedAmount: null,
        taxAmount: null,
        totalAmount: null,
      };
    },
    [commercialAmountPreviewDocumentType, commercialAmountPreviews],
  );
  const tableColumns = useMemo<DocumentLineColumn<OrderItemDraft>[]>(() => {
    const columns: DocumentLineColumn<OrderItemDraft>[] = [
      createMaterialCodeLineColumn(getOrderItemMaterialCode),
    ];

    if (allowTemporaryItem) {
      columns.push({
        key: 'itemMode',
        title: '类型',
        width: 132,
        render: (item, _index, update) => {
          const itemMode =
            allowTemporaryItem && item.itemMode === 'temporary'
              ? 'temporary'
              : 'material';
          return (
            <Segmented
              size="small"
              value={itemMode}
              options={[
                { label: materialModeLabel, value: 'material' },
                { label: temporaryItemLabel, value: 'temporary' },
              ]}
              onChange={(value) => {
                const nextMode = value as 'material' | 'temporary';
                if (nextMode === 'material') {
                  update({
                    itemMode: 'material',
                    temporaryItemCode: undefined,
                    temporaryItemName: undefined,
                    temporaryItemSpec: undefined,
                    purchaseUnit: undefined,
                  });
                  return;
                }
                update({
                  itemMode: 'temporary',
                  materialId: '',
                  materialOption: undefined,
                  material: undefined,
                });
              }}
            />
          );
        },
      });
    }

    columns.push({
      key: 'materialId',
      title: materialLabel,
      required: required,
      width: allowTemporaryItem ? 420 : materialSelectWidth + 80,
      fixed: 'left',
      render: (item, index, update) => {
        const itemMode =
          allowTemporaryItem && item.itemMode === 'temporary'
            ? 'temporary'
            : 'material';
        const materialDisabled =
          typeof disableMaterialSelect === 'function'
            ? disableMaterialSelect(item, index)
            : disableMaterialSelect;
        const materialHidden =
          typeof hideMaterialSelect === 'function'
            ? hideMaterialSelect(item, index)
            : hideMaterialSelect;

        if (allowTemporaryItem && itemMode === 'temporary') {
          return (
            <Space orientation="vertical" size={6} style={{ width: '100%' }}>
              <Space wrap size={6}>
                <Input
                  value={item.temporaryItemCode}
                  onChange={(event) =>
                    update({ temporaryItemCode: event.target.value })
                  }
                  placeholder="临时编码/图号"
                  style={{ width: 150 }}
                  maxLength={128}
                  disabled={materialDisabled}
                />
                <Input
                  value={item.temporaryItemName}
                  onChange={(event) =>
                    update({ temporaryItemName: event.target.value })
                  }
                  placeholder={`${temporaryItemLabel}名称 *`}
                  style={{ width: 180 }}
                  maxLength={256}
                  disabled={materialDisabled}
                />
                <Input
                  value={item.temporaryItemSpec}
                  onChange={(event) =>
                    update({ temporaryItemSpec: event.target.value })
                  }
                  placeholder="规格"
                  style={{ width: 180 }}
                  maxLength={256}
                  disabled={materialDisabled}
                />
                <Input
                  value={item.purchaseUnit}
                  onChange={(event) =>
                    update({ purchaseUnit: event.target.value })
                  }
                  placeholder="单位"
                  style={{ width: 90 }}
                  maxLength={32}
                  disabled={materialDisabled}
                />
              </Space>
            </Space>
          );
        }

        if (materialHidden) {
          return (
            <Typography.Text type="secondary">
              {item.materialId ? '已选择物料' : '临时品'}
            </Typography.Text>
          );
        }

        return (
          <MaterialFilteredSelect
            request={resolvedMaterialRequest}
            value={item.materialId || undefined}
            selectedOption={
              item.materialOption?.value === item.materialId
                ? item.materialOption
                : undefined
            }
            onChange={(value, option) => {
              update({
                materialId: value ?? '',
                materialOption: option,
                material: undefined,
              });
              if (value) onMaterialChange?.(index, value, option);
            }}
            placeholder={materialPlaceholder}
            disabled={materialDisabled}
            filterMode={materialFilterMode}
            baseTypeWidth={materialBaseTypeWidth}
            categoryWidth={materialCategoryWidth}
            selectWidth="100%"
          />
        );
      },
    });

    columns.push(
      ...createMaterialCustomFieldLineColumns<OrderItemDraft>(
        materialCustomFields,
        {
          getMaterial: (item) => item.material,
          getSelectedOption: (item) =>
            item.materialOption?.value === item.materialId
              ? item.materialOption
              : undefined,
        },
      ),
    );

    columns.push(
      ...createDocumentLineCustomFieldColumns(lineCustomFieldSchema),
    );

    columns.push({
      key: 'qty',
      title: qtyLabel,
      required: qtyRequired,
      width: 132,
      align: 'right',
      render: (item, index, update) => {
        const qtyDisabled =
          typeof disableQtyInput === 'function'
            ? disableQtyInput(item, index)
            : disableQtyInput;
        return (
          <Space orientation="vertical" size={4} style={{ width: '100%' }}>
            <DocumentLineQuantityInput
              value={item.qty}
              onChange={(value) => update({ qty: value })}
              placeholder={qtyRequired ? `${qtyLabel} *` : qtyLabel}
              style={{ width: '100%' }}
              min={qtyMin}
              step={qtyStep}
              precision={qtyPrecision}
              disabled={qtyDisabled}
              status={qtyErrors?.[item._key] ? 'error' : undefined}
              controls={false}
            />
            <FieldError message={qtyErrors?.[item._key]} />
          </Space>
        );
      },
    });

    if (renderAfterQty) {
      columns.push({
        key: 'afterQty',
        title: renderAfterQtyTitle ?? '日期',
        width: renderAfterQtyWidth ?? 160,
        render: (item, index, update) => renderAfterQty(item, index, update),
      });
    }

    if (showPrice) {
      columns.push({
        key: 'unitPrice',
        title: '单价',
        width: 132,
        align: 'right',
        render: (item, _index, update) => (
          <InputNumber
            value={item.unitPrice}
            onChange={(value) => {
              const unitPrice = value ?? undefined;
              update({
                unitPrice,
                ...(buildPriceChangePatch?.(item, unitPrice) ?? {}),
              });
            }}
            placeholder="单价"
            style={{ width: '100%' }}
            min={0}
            precision={2}
            controls={false}
          />
        ),
      });
    }

    if (showPrice && showCurrency) {
      columns.push({
        key: 'currency',
        title: (
          <Space size={6}>
            <span>{currencyPlaceholder}</span>
            {currencyOptions.length === 0 &&
            !currencyLoading &&
            !currencyError &&
            items.some((item) => !item.currency) ? (
              renderCurrencyConfigEntry(
                editorCapabilities,
                currencyPlaceholder,
                markCurrencyConfigOpened,
              )
            ) : null}
          </Space>
        ),
        width: 104,
        render: (item, _index, update) => (
          <Select
            value={item.currency}
            onChange={(value) => update({ currency: value || undefined })}
            options={currencyOptions}
            placeholder={currencyPlaceholder}
            style={{ width: '100%' }}
            showSearch
            allowClear
            optionFilterProp="label"
          />
        ),
      });
    }

    if (showPrice && showCommercialAmountFields) {
      columns.push(
        {
          key: 'discountRate',
          title: '折扣%',
          width: 112,
          align: 'right',
          render: (item, _index, update) => (
            <InputNumber
              value={item.discountRate}
              onChange={(value) => update({ discountRate: value ?? undefined })}
              placeholder="折扣%"
              style={{ width: '100%' }}
              min={0}
              max={100}
              precision={4}
              controls={false}
            />
          ),
        },
        {
          key: 'taxRate',
          title: '税率%',
          width: 112,
          align: 'right',
          render: (item, _index, update) => (
            <InputNumber
              value={item.taxRate}
              onChange={(value) => update({ taxRate: value ?? undefined })}
              placeholder="税率%"
              style={{ width: '100%' }}
              min={0}
              max={100}
              precision={4}
              controls={false}
            />
          ),
        },
        {
          key: 'priceIncludesTax',
          title: '含税',
          width: 112,
          render: (item, _index, update) => (
            <Segmented
              size="small"
              value={item.priceIncludesTax === true}
              options={[
                { label: '未税', value: false },
                { label: '含税', value: true },
              ]}
              onChange={(value) => update({ priceIncludesTax: Boolean(value) })}
            />
          ),
        },
        {
          key: 'amount',
          title: '金额',
          width: 120,
          align: 'right',
          render: (item) => (
            <Typography.Text>
              {formatMoney(resolveDraftAmounts(item).amount)}
            </Typography.Text>
          ),
        },
        {
          key: 'discountAmount',
          title: '折扣金额',
          width: 120,
          align: 'right',
          render: (item) => (
            <Typography.Text>
              {formatMoney(resolveDraftAmounts(item).discountAmount)}
            </Typography.Text>
          ),
        },
        {
          key: 'discountedAmount',
          title: '折后金额',
          width: 120,
          align: 'right',
          render: (item) => (
            <Typography.Text>
              {formatMoney(resolveDraftAmounts(item).discountedAmount)}
            </Typography.Text>
          ),
        },
        {
          key: 'taxAmount',
          title: '税额',
          width: 120,
          align: 'right',
          render: (item) => (
            <Typography.Text>
              {formatMoney(resolveDraftAmounts(item).taxAmount)}
            </Typography.Text>
          ),
        },
        {
          key: 'totalAmount',
          title: '总金额',
          width: 120,
          align: 'right',
          render: (item) => (
            <Typography.Text strong>
              {formatMoney(resolveDraftAmounts(item).totalAmount)}
            </Typography.Text>
          ),
        },
      );
    }

    if (renderExtra) {
      columns.push({
        key: 'extra',
        title: renderExtraTitle ?? '扩展',
        width: renderExtraWidth ?? 180,
        render: (item, index, update) => renderExtra(item, index, update),
      });
    }

    return columns;
  }, [
    allowTemporaryItem,
    currencyOptions,
    currencyLoading,
    currencyError,
    items,
    currencyPlaceholder,
    disableMaterialSelect,
    disableQtyInput,
    hideMaterialSelect,
    materialBaseTypeWidth,
    materialCategoryWidth,
    materialCustomFields,
    lineCustomFieldSchema,
    materialFilterMode,
    materialLabel,
    materialModeLabel,
    materialPlaceholder,
    resolvedMaterialRequest,
    editorCapabilities,
    markCurrencyConfigOpened,
    materialSelectWidth,
    onMaterialChange,
    qtyErrors,
    qtyLabel,
    qtyMin,
    qtyPrecision,
    qtyRequired,
    qtyStep,
    renderExtra,
    renderAfterQty,
    renderAfterQtyTitle,
    renderAfterQtyWidth,
    buildPriceChangePatch,
    renderExtraTitle,
    renderExtraWidth,
    required,
    showCurrency,
    showCommercialAmountFields,
    resolveDraftAmounts,
    showPrice,
    temporaryItemLabel,
  ]);

  if (layout === 'table') {
    const content = (
      <DocumentLineEditableTable<OrderItemDraft>
        className={className}
        ariaLabel={`${materialLabel}明细`}
        rows={items}
        onRowsChange={onChange}
        onRowsUpdate={onRowsUpdate}
        onRowPatch={(item, patch) => {
          if (typeof patch.qty === 'number') {
            onQuantityChange?.(item._key, patch.qty);
          }
        }}
        columns={tableColumns}
        createRow={createDefaultOrderItem}
        cloneRow={(item) => ({ ...item, _key: nextItemKey() })}
        minRows={minRows}
        addText={`添加${materialLabel}`}
        addButtonClassName={addButtonClassName}
        toolbarActions={toolbarActions}
        disableAdd={disableAdd}
        density={density}
        resizable={tableResizable}
        batchOperations={effectiveBatchOperations}
        scrollX={
          scrollX ??
          Math.max(1130, materialSelectWidth + 910) +
            materialCustomFieldScrollWidth +
            lineCustomFieldScrollWidth
        }
        expandAllRows={Boolean(renderBelow && expandBelowByDefault)}
        expandedRowRender={
          renderBelow
            ? (item, index, update) => (
                <div
                  style={{ padding: density === 'compact' ? '2px 0' : '4px 0' }}
                >
                  {renderBelow(item, index, update)}
                </div>
              )
            : undefined
        }
        summary={(currentItems) => {
          const effectiveRows = currentItems.filter(isEffectiveOrderItem);
          const totalQty = effectiveRows.reduce(
            (sum, item) => sum + Number(item.qty ?? 0),
            0,
          );
          const errorCount = Object.values(qtyErrors ?? {}).filter(
            Boolean,
          ).length;
          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={tableColumns.length + 2}>
                <Typography.Text type={errorCount > 0 ? 'danger' : 'secondary'}>
                  共 {effectiveRows.length} 行，合计数量 {totalQty.toFixed(4)}
                  {errorCount > 0 ? `，${errorCount} 行待修正` : ''}
                  {commercialAmountPreviewError
                    ? '，金额规则试算失败，当前金额暂不展示'
                    : ''}
                </Typography.Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
    );

    return (
      <Form.Item
        label={renderOrderItemTitle(title, titleHelpKey, editorCapabilities)}
        required={required}
        style={{ marginBottom: 16 }}
      >
        {content}
      </Form.Item>
    );
  }

  const content = (
    <div className={className}>
      {items.map((item, index) => (
        <OrderItemRow
          key={item._key}
          item={item}
          index={index}
          showPrice={showPrice}
          showCurrency={showCurrency}
          showCommercialAmountFields={showCommercialAmountFields}
          currencyPlaceholder={currencyPlaceholder}
          qtyLabel={qtyLabel}
          qtyRequired={qtyRequired}
          qtyMin={qtyMin}
          qtyStep={qtyStep}
          qtyPrecision={qtyPrecision}
          qtyDisabled={
            typeof disableQtyInput === 'function'
              ? disableQtyInput(item, index)
              : disableQtyInput
          }
          qtyError={qtyErrors?.[item._key]}
          canDelete={canDelete}
          currencyOptions={currencyOptions}
          currencyLoading={currencyLoading}
          currencyError={currencyError}
          onCurrencyConfigOpen={markCurrencyConfigOpened}
          editorCapabilities={editorCapabilities}
          onUpdate={updateItem}
          onRemove={removeItem}
          onMaterialChange={onMaterialChange}
          materialRequest={resolvedMaterialRequest}
          materialPlaceholder={materialPlaceholder}
          materialFilterMode={materialFilterMode}
          materialSelectWidth={materialSelectWidth}
          materialBaseTypeWidth={materialBaseTypeWidth}
          materialCategoryWidth={materialCategoryWidth}
          allowTemporaryItem={allowTemporaryItem}
          materialModeLabel={materialModeLabel}
          temporaryItemLabel={temporaryItemLabel}
          materialDisabled={
            typeof disableMaterialSelect === 'function'
              ? disableMaterialSelect(item, index)
              : disableMaterialSelect
          }
          materialHidden={
            typeof hideMaterialSelect === 'function'
              ? hideMaterialSelect(item, index)
              : hideMaterialSelect
          }
          layout={layout}
          showRowIndex={showRowIndex}
          cardClassName={cardClassName}
          cardHeaderClassName={cardHeaderClassName}
          cardMainClassName={cardMainClassName}
          cardBelowClassName={cardBelowClassName}
          renderExtra={renderExtra}
          buildPriceChangePatch={buildPriceChangePatch}
          renderBelow={renderBelow}
        />
      ))}
      <Button
        className={addButtonClassName}
        type="dashed"
        icon={<PlusOutlined />}
        onClick={addItem}
        disabled={disableAdd}
      >
        添加{materialLabel}
      </Button>
    </div>
  );

  return (
    <Form.Item
      label={renderOrderItemTitle(title, titleHelpKey, editorCapabilities)}
      required={required}
      style={{ marginBottom: 16 }}
    >
      {content}
    </Form.Item>
  );
}
