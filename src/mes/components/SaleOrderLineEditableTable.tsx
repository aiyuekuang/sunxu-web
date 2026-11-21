import { UploadOutlined } from '@ant-design/icons';
import {
  Button,
  DatePicker,
  Input,
  InputNumber,
  Segmented,
  Select,
  Space,
  Switch,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { renderCustomFieldCell } from './CustomFieldCell';
import { RemoteSelect } from '../../components/RemoteSelect';
import { DocumentLineEditableTable, createMaterialCodeLineColumn } from './DocumentLineEditableTable';
import type { DocumentLineColumn } from './DocumentLineEditableTable';
import { DocumentLineQuantityInput } from './DocumentLineQuantityInput';
import { createMaterialCustomFieldLineColumns, sumMaterialCustomFieldColumnWidths } from './materialCustomFieldColumns';
import { getOrderItemMaterialCode, nextItemKey } from './OrderItemEditor';
import {
  calculateOrderItemAmounts,
  buildOrderItemAmountPreviewRequest,
  buildOrderItemAmountPreviewSignature,
  normalizeOrderItemAmountPreview,
} from './order-item-editor-amounts';
import { ManufactureModeSelect } from './ManufactureModeControl';
import type { DocumentLineCustomFieldDefinition, DocumentLineCustomFieldSchema } from './document-line-custom-field-types';
import type { MesCustomFieldDefinition } from './custom-field-form-types';
import type { MaterialFilteredSelectOption, FilterableSelectRequestFn } from './material-select-types';
import type { OrderItemDraft } from './OrderItemEditor';
import type { OrderItemCommercialLineAmounts, OrderItemCommercialAmountPreviewResult } from './order-item-editor-types';
import type { SaleOrderLineDocumentLineCustomFieldSchema, SaleOrderLineEditableTableProps } from './sales-delivery-components-types';
import type { DocumentLineBatchOperations } from './DocumentLineEditableTable';
import { ResizableTable as Table } from './ResizableTable';

const SALE_ORDER_MIN_QUANTITY = 0.0001;
const SALE_ORDER_QUANTITY_PRECISION = 4;
type ManufactureMode = string;
type BomSelectOption = { label: string; value: string; sourceType?: string; raw?: unknown; [key: string]: unknown };
type CommercialAmountPreview = { signature: string; result: OrderItemCommercialLineAmounts };
const createBatchOperations = (options: readonly { label: string; value: string }[]): DocumentLineBatchOperations<OrderItemDraft> => ({
  enabled: true,
  autoSelectNewRows: true,
  fields: [
    { key: 'qty', label: '数量', type: 'number', required: true, min: SALE_ORDER_MIN_QUANTITY, precision: SALE_ORDER_QUANTITY_PRECISION, patch: (qty) => ({ qty: qty ?? 1 }) },
    { key: 'deliveryDate', label: '交货日期', type: 'date', help: '留空会清除明细日期，并继续使用订单头交货日期。', patch: (deliveryDate) => ({ deliveryDate }) },
    { key: 'manufactureMode', label: '产品类型', type: 'select', options: [...options], patch: (manufactureMode) => ({ manufactureMode }) },
    { key: 'remarks', label: '明细备注', type: 'text', maxLength: 500, patch: (remarks) => ({ remarks }) },
  ],
});

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Helpers ──────────────────────────────────────────────────────────────────

const createEmptyLine = (
  manufactureMode: ManufactureMode = 'standard',
): OrderItemDraft => ({
  _key: nextItemKey(),
  materialId: '',
  qty: 1,
  unitPrice: undefined,
  manufactureMode,
});

const getDrawingUrls = (item: OrderItemDraft): string[] =>
  Array.isArray(item.drawingUrls)
    ? (item.drawingUrls as string[]).filter((url) => typeof url === 'string')
    : [];

const readText = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const formatNumber = (value: number, fractionDigits = 4) =>
  value.toLocaleString('zh-CN', {
    maximumFractionDigits: fractionDigits,
  });

const formatMoney = (value: number) =>
  value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatMoneyOrDash = (value: number | null) =>
  value == null ? '-' : formatMoney(value);

const calculateDraftAmounts = (item: OrderItemDraft) =>
  calculateOrderItemAmounts({
    qty: item.qty,
    unitPrice: item.unitPrice,
    discountRate: item.discountRate,
    taxRate: item.taxRate,
    priceIncludesTax: item.priceIncludesTax,
  });

function buildCustomerMaterialSnapshotPatch(option?: MaterialFilteredSelectOption) {
  return {
    customerMaterialCode: option?.customerMaterialCode ?? undefined,
    customerMaterialName: option?.customerMaterialName ?? undefined,
    customerMaterialSpec: option?.customerMaterialSpec ?? undefined,
  };
}

function mergeBomOptions(existing: BomSelectOption[], next: BomSelectOption[]): BomSelectOption[] {
  const seen = new Set<string>();
  return [...existing, ...next].filter((option) => {
    if (seen.has(option.value)) return false;
    seen.add(option.value);
    return true;
  });
}

function documentLineCustomFieldWidth(field: DocumentLineCustomFieldDefinition) {
  const width = readObject(field.displayJson).listWidth;
  if (typeof width === 'number' && width > 0) return width;
  if (field.dataType === 'long_text') return 200;
  if (field.dataType === 'date' || field.dataType === 'datetime') return 168;
  if (field.dataType === 'boolean') return 96;
  return 140;
}

function getLineCustomFieldOptions(field: DocumentLineCustomFieldDefinition) {
  const options = readObject(field.optionsJson).options;
  if (!Array.isArray(options)) return [];
  return options.flatMap((option) => {
    if (typeof option === 'string') return [{ label: option, value: option }];
    if (!option || typeof option !== 'object') return [];
    const record = option as Record<string, unknown>;
    const value = typeof record.value === 'string' ? record.value : typeof record.key === 'string' ? record.key : '';
    if (!value) return [];
    return [{ label: typeof record.label === 'string' ? record.label : value, value, disabled: record.enabled === false }];
  });
}

function toDateValue(value: unknown) {
  if (typeof value !== 'string' || !value) return undefined;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : undefined;
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function isNonStandardManufactureMode(value: unknown, normalize: (value: unknown) => string) {
  const mode = normalize(value);
  return value === 'custom' || (mode !== 'standard' && mode.length > 0);
}

function createDocumentLineColumns(schema?: DocumentLineCustomFieldSchema | null): DocumentLineColumn<OrderItemDraft>[] {
  return (schema?.fields ?? [])
    .filter((field) => field.isActive !== false && ['input', 'formula'].includes(field.fieldKind) && readObject(field.displayJson).showInForm === true)
    .slice()
    .sort((left, right) => {
      const leftSort = readObject(left.displayJson).sortOrder;
      const rightSort = readObject(right.displayJson).sortOrder;
      return (typeof leftSort === 'number' ? leftSort : left.sortOrder ?? 0) - (typeof rightSort === 'number' ? rightSort : right.sortOrder ?? 0);
    })
    .map((field) => ({
      key: `line-custom-${field.fieldKey}`,
      title: field.label,
      required: field.fieldKind === 'input' && field.requiredPolicy !== 'none',
      width: documentLineCustomFieldWidth(field),
      render: (row, _index, update) => {
        if (field.fieldKind === 'formula') return renderCustomFieldCell(field, { computedValues: row.customComputedValues, rawValues: row.customValues, errors: row.customComputedErrors });
        const values = readObject(row.customValues);
        const save = (value: unknown) => update({ customFieldSchemaVersion: schema?.schemaVersion, customValues: { ...values, [field.fieldKey]: value } });
        if (field.dataType === 'number' || field.dataType === 'decimal' || field.dataType === 'money') return <InputNumber value={typeof values[field.fieldKey] === 'number' ? values[field.fieldKey] as number : undefined} controls={false} style={{ width: '100%' }} onChange={save} />;
        if (field.dataType === 'boolean') return <Switch checked={values[field.fieldKey] === true} onChange={save} />;
        if (field.dataType === 'date' || field.dataType === 'datetime') {
          const text = readText(values[field.fieldKey]);
          return <DatePicker value={toDateValue(text)} showTime={field.dataType === 'datetime'} style={{ width: '100%' }} onChange={(date) => save(date ? (field.dataType === 'datetime' ? date.toISOString() : date.format('YYYY-MM-DD')) : null)} />;
        }
        if (field.dataType === 'select' || field.dataType === 'multi_select') {
          return <Select mode={field.dataType === 'multi_select' ? 'multiple' : undefined} value={values[field.fieldKey] === null ? undefined : values[field.fieldKey] as string | string[] | undefined} options={getLineCustomFieldOptions(field)} allowClear showSearch optionFilterProp="label" style={{ width: '100%' }} onChange={(value) => save(value ?? null)} />;
        }
        if (field.dataType === 'long_text' || field.dataType === 'file' || field.dataType === 'image') return <Input.TextArea value={readText(values[field.fieldKey])} autoSize={{ minRows: 1, maxRows: 3 }} onChange={(event) => save(event.target.value || null)} />;
        return <Input value={readText(values[field.fieldKey])} allowClear onChange={(event) => save(event.target.value || null)} />;
      },
    }));
}

function summarizeDocumentFields(
  rows: readonly OrderItemDraft[],
  schema?: DocumentLineCustomFieldSchema | null,
): Array<{ label: string; value: number | null }> {
  return (schema?.fields ?? []).flatMap<{ label: string; value: number | null }>(
    (field) => {
    const mode = readObject(field.displayJson).aggregateMode;
    if (!['sum', 'avg', 'min', 'max', 'count_non_empty'].includes(String(mode))) return [];
    const raw = rows.map((row) => readObject(field.fieldKind === 'formula' ? row.customComputedValues : row.customValues)[field.fieldKey]);
    const present = raw.filter((value) => value !== null && value !== undefined && value !== '');
    if (mode === 'count_non_empty') return [{ label: field.label, value: present.length }];
    const numbers = present.map(Number).filter(Number.isFinite);
    if (!present.length || numbers.length !== present.length) return [{ label: field.label, value: null }];
    const total = numbers.reduce((sum, number) => sum + number, 0);
    return [{ label: field.label, value: mode === 'sum' ? total : mode === 'avg' ? total / numbers.length : mode === 'min' ? Math.min(...numbers) : Math.max(...numbers) }];
    },
  );
}

function MaterialCell({
  item,
  materialRequest,
  materialPlaceholder,
  renderMaterialSelect,
  onChange,
}: {
  item: OrderItemDraft;
  materialRequest: FilterableSelectRequestFn;
  materialPlaceholder?: string;
  renderMaterialSelect: SaleOrderLineEditableTableProps['capabilities']['renderMaterialSelect'];
  onChange: (materialId: string, option?: MaterialFilteredSelectOption) => void;
}) {
  return renderMaterialSelect({
    request: materialRequest,
    value: item.materialId || undefined,
    selectedOption: item.materialOption,
    placeholder: materialPlaceholder,
    filterMode: 'hidden',
    selectWidth: '100%',
    style: { width: '100%', minWidth: 260 },
    onChange: (value, option) => onChange(value ?? '', option),
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

/** @sunxu-component mes-specific @sunxu-domain sales order @sunxu-reason Preserves sale-order line editing fields, batch operations, BOM and drawing interactions while the host supplies pricing, dictionaries, custom-field schema, and permissions. */
export function SaleOrderLineEditableTable({
  saleOrderId,
  items,
  onItemsChange,
  onItemsUpdate,
  materialRequest,
  materialPlaceholder = '搜索客户料号/物料',
  onMaterialAutoFill,
  onQuantityAutoFill,
  qtyErrors,
  showPrice,
  availableDrawingUrls = [],
  showCurrency = false,
  costAsOfDate,
  defaultManufactureMode = 'standard',
  headerDeliveryDate,
  requireDeliveryDate = false,
  toolbarActions,
  capabilities,
}: SaleOrderLineEditableTableProps) {
  const [currencyOptions, setCurrencyOptions] = useState<Array<{ label: string; value: string }>>([...(capabilities.currencyOptions ?? [])]);
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [currencyError, setCurrencyError] = useState(false);
  const [materialCustomFields, setMaterialCustomFields] = useState<MesCustomFieldDefinition[]>([]);
  const [lineCustomFieldSchema, setLineCustomFieldSchema] = useState<SaleOrderLineDocumentLineCustomFieldSchema | null>();
  const retryCurrencyOptions = useCallback(async () => {
    setCurrencyLoading(true);
    try {
      setCurrencyOptions(await capabilities.requestCurrencyOptions());
      setCurrencyError(false);
    } catch {
      setCurrencyError(true);
    } finally {
      setCurrencyLoading(false);
    }
  }, [capabilities.requestCurrencyOptions]);
  const refreshCurrencyOnFocusRef = useRef(false);
  useEffect(() => {
    void retryCurrencyOptions();
    void capabilities.requestMaterialListCustomFields().then(setMaterialCustomFields).catch(() => setMaterialCustomFields([]));
    void capabilities.requestDocumentLineCustomFieldSchema({ objectType: 'sale_order_item' }).then((schema) => setLineCustomFieldSchema(schema ?? null)).catch(() => setLineCustomFieldSchema(null));
  }, [capabilities.requestDocumentLineCustomFieldSchema, capabilities.requestMaterialListCustomFields, retryCurrencyOptions]);
  useEffect(() => {
    const refreshWhenReturned = () => {
      if (!refreshCurrencyOnFocusRef.current) return;
      refreshCurrencyOnFocusRef.current = false;
      void retryCurrencyOptions();
    };
    window.addEventListener('focus', refreshWhenReturned);
    return () => window.removeEventListener('focus', refreshWhenReturned);
  }, [retryCurrencyOptions]);
  const materialCustomFieldScrollWidth = useMemo(
    () => sumMaterialCustomFieldColumnWidths(materialCustomFields),
    [materialCustomFields],
  );
  const customFieldPreviewSequence = useRef(0);
  const latestItemsRef = useRef(items);
  const latestOnItemsChangeRef = useRef(onItemsChange);
  const latestOnItemsUpdateRef = useRef(onItemsUpdate);
  latestItemsRef.current = items;
  latestOnItemsChangeRef.current = onItemsChange;
  latestOnItemsUpdateRef.current = onItemsUpdate;
  const customFieldPreviewSignature = useMemo(() => {
    if (!lineCustomFieldSchema || !lineCustomFieldSchema.fields?.some((field) => field.isActive !== false && field.fieldKind === 'formula' && readObject(field.displayJson).showInForm === true) || items.length === 0) return '';
    const systemKeys = lineCustomFieldSchema.systemFields?.map((field) => field.key) ?? [];
    return JSON.stringify({
      objectType: 'sale_order_item',
      schemaVersion: lineCustomFieldSchema.schemaVersion,
      items: items.map((item) => {
        const row = item as Record<string, unknown>;
        const systemValues = Object.fromEntries(systemKeys.flatMap((key) => {
          const value = Object.hasOwn(row, key) ? row[key] : key === 'quantity' ? row.qty : undefined;
          return value === undefined ? [] : [[key, value]];
        }));
        return { ...systemValues, customValues: readObject(row.customValues) };
      }),
    });
  }, [items, lineCustomFieldSchema]);
  const lastCustomFieldPreviewSignature = useRef('');
  useEffect(() => {
    if (!lineCustomFieldSchema || !lineCustomFieldSchema.schemaVersion || !customFieldPreviewSignature || !capabilities.previewDocumentLineCustomFields || lastCustomFieldPreviewSignature.current === customFieldPreviewSignature) return;
    lastCustomFieldPreviewSignature.current = customFieldPreviewSignature;
    const sequence = ++customFieldPreviewSequence.current;
    const timer = window.setTimeout(() => {
      void capabilities.previewDocumentLineCustomFields({
        objectType: 'sale_order_item',
        customFieldSchemaVersion: lineCustomFieldSchema.schemaVersion,
        items: JSON.parse(customFieldPreviewSignature).items as Array<Record<string, unknown>>,
      }).then((result) => {
        if (customFieldPreviewSequence.current !== sequence || !result.items) return;
        const apply = (current: OrderItemDraft[]) => current.map((item, index) => ({
          ...item,
          ...(result.items?.[index]?.customComputedValues ? { customComputedValues: result.items[index]?.customComputedValues } : {}),
          ...(result.items?.[index]?.customComputedErrors ? { customComputedErrors: result.items[index]?.customComputedErrors } : {}),
        }));
        if (latestOnItemsUpdateRef.current) latestOnItemsUpdateRef.current(apply); else latestOnItemsChangeRef.current(apply(latestItemsRef.current));
      }).catch(() => capabilities.notify.error('预览明细计算属性失败'));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [capabilities.notify, capabilities.previewDocumentLineCustomFields, customFieldPreviewSignature, lineCustomFieldSchema]);
  const lineCustomFieldScrollWidth = useMemo(
    () => (lineCustomFieldSchema?.fields ?? []).filter((field) => field.isActive !== false && readObject(field.displayJson).showInForm === true).reduce((sum, field) => sum + documentLineCustomFieldWidth(field), 0),
    [lineCustomFieldSchema],
  );
  const [bomOptionsMap, setBomOptionsMap] = useState<
    Record<string, BomSelectOption[]>
  >({});
  const [amountPreviews, setAmountPreviews] = useState<
    Record<string, CommercialAmountPreview>
  >({});
  const [amountPreviewError, setAmountPreviewError] = useState(false);
  const amountPreviewSequenceRef = useRef(0);

  useEffect(() => {
    if (!showPrice) {
      setAmountPreviews({});
      setAmountPreviewError(false);
      return;
    }

    const previewItems = items.filter(
      (item) => item.materialId && item.unitPrice != null,
    );
    if (previewItems.length === 0) {
      setAmountPreviews({});
      setAmountPreviewError(false);
      return;
    }

    const sequence = amountPreviewSequenceRef.current + 1;
    amountPreviewSequenceRef.current = sequence;
    const timer = window.setTimeout(() => {
      void Promise.all(
        previewItems.map(async (item) => {
          const signature = buildOrderItemAmountPreviewSignature(item);
          const result: OrderItemCommercialAmountPreviewResult = await capabilities.previewCommercialAmounts(
            buildOrderItemAmountPreviewRequest(item, { domain: 'sales', documentType: 'sale_order_item' }),
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
          if (amountPreviewSequenceRef.current !== sequence) return;
          setAmountPreviews(
            Object.fromEntries(
              entries.map((entry) => [entry.key, entry.preview]),
            ),
          );
          setAmountPreviewError(false);
        })
        .catch(() => {
          if (amountPreviewSequenceRef.current !== sequence) return;
          setAmountPreviews({});
          setAmountPreviewError(true);
        });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [capabilities, items, showPrice]);

  const resolveDraftAmounts = useCallback(
    (item: OrderItemDraft) => {
      const preview = amountPreviews[item._key];
      return preview?.signature === buildOrderItemAmountPreviewSignature(item)
        ? preview.result
        : {
            ...calculateDraftAmounts(item),
            amount: null,
            discountAmount: null,
            discountedAmount: null,
            taxAmount: null,
            totalAmount: null,
          };
    },
    [amountPreviews],
  );

  const loadBomOptions = useCallback(
    async (itemKey: string, materialId?: string, keyword?: string) => {
      if (!materialId) return;
      const options = await capabilities.requestBomOptions({
        keyWords: keyword,
        materialId,
        saleOrderId,
      });
      setBomOptionsMap((prev) => ({
        ...prev,
        [itemKey]: mergeBomOptions(prev[itemKey] ?? [], options),
      }));
    },
    [capabilities.requestBomOptions, saleOrderId],
  );

  const handleMaterialChange = useCallback(
    (
      item: OrderItemDraft,
      materialId: string,
      option: MaterialFilteredSelectOption | undefined,
      update: (patch: Partial<OrderItemDraft>) => void,
    ) => {
      update({
        materialId,
        materialOption: option,
        material: undefined,
        ...buildCustomerMaterialSnapshotPatch(option),
        selectedBomHeaderId: undefined,
        bomHeaderId: undefined,
        bomSelectionSource: undefined,
        bomSelectionReason: undefined,
        bomCostSnapshot: undefined,
      });
      setBomOptionsMap((prev) => ({ ...prev, [item._key]: [] }));
      if (materialId) onMaterialAutoFill?.(item._key, materialId);
    },
    [onMaterialAutoFill],
  );

  const columns = useMemo<DocumentLineColumn<OrderItemDraft>[]>(() => {
    const baseColumns: DocumentLineColumn<OrderItemDraft>[] = [
      createMaterialCodeLineColumn(getOrderItemMaterialCode),
      {
        key: 'material',
        title: '产品代码/名称',
        required: true,
        width: 320,
        fixed: 'left',
        render: (item, _index, update) => (
          <MaterialCell
            item={item}
            materialRequest={materialRequest}
            materialPlaceholder={materialPlaceholder}
            renderMaterialSelect={capabilities.renderMaterialSelect}
            onChange={(materialId, option) =>
              handleMaterialChange(item, materialId, option, update)
            }
          />
        ),
      },
      {
        key: 'customerMaterialCode',
        title: '客户料号',
        width: 150,
        render: (item, _index, update) => (
          <Input
            allowClear
            value={readText(item.customerMaterialCode)}
            placeholder="客户料号"
            onChange={(event) =>
              update({
                customerMaterialCode: event.target.value || undefined,
              })
            }
          />
        ),
      },
      {
        key: 'customerMaterialName',
        title: '客户物料名称',
        width: 180,
        render: (item, _index, update) => (
          <Input
            allowClear
            value={readText(item.customerMaterialName)}
            placeholder="客户物料名称"
            onChange={(event) =>
              update({
                customerMaterialName: event.target.value || undefined,
              })
            }
          />
        ),
      },
      {
        key: 'customerMaterialSpec',
        title: '规格型号',
        width: 180,
        render: (item, _index, update) => (
          <Input
            allowClear
            value={readText(item.customerMaterialSpec)}
            placeholder="规格型号"
            onChange={(event) =>
              update({
                customerMaterialSpec: event.target.value || undefined,
              })
            }
          />
        ),
      },
      {
        key: 'drawingCount',
        title: '图纸',
        width: 88,
        render: (item) => {
          const count = getDrawingUrls(item).length;
          return count > 0 ? (
            <Typography.Text type="success">{count} 份</Typography.Text>
          ) : (
            <Typography.Text type="secondary">未关联</Typography.Text>
          );
        },
      },
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
      ...(capabilities.lineCustomFieldColumns?.(lineCustomFieldSchema) ?? createDocumentLineColumns(lineCustomFieldSchema)),
      {
        key: 'qty',
        title: '数量',
        required: true,
        width: 130,
        align: 'right',
        render: (item, _index, update) => (
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <DocumentLineQuantityInput
              min={SALE_ORDER_MIN_QUANTITY}
              step={SALE_ORDER_MIN_QUANTITY}
              precision={SALE_ORDER_QUANTITY_PRECISION}
              value={item.qty}
              status={qtyErrors?.[item._key] ? 'error' : undefined}
              style={{ width: '100%' }}
              onChange={(value) => update({ qty: value })}
            />
            {qtyErrors?.[item._key] ? (
              <Typography.Text type="danger" style={{ fontSize: 12 }}>
                {qtyErrors[item._key]}
              </Typography.Text>
            ) : null}
          </Space>
        ),
      },
      {
        key: 'deliveryDate',
        title: '交货日期',
        required: requireDeliveryDate,
        width: 160,
        render: (item, _index, update) => {
          const value = readText(item.deliveryDate);
          return (
            <DatePicker
              value={value ? dayjs(value) : undefined}
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
              allowClear
              placeholder={
                headerDeliveryDate
                  ? `默认 ${headerDeliveryDate}`
                  : '默认订单交货日期'
              }
              onChange={(date) =>
                update({
                  deliveryDate: date ? date.format('YYYY-MM-DD') : undefined,
                })
              }
            />
          );
        },
      },
    ];

    const priceColumns: DocumentLineColumn<OrderItemDraft>[] = showPrice
      ? [
          {
            key: 'unitPrice',
            title: '单价',
            width: 130,
            align: 'right',
            render: (item, _index, update) => (
              <InputNumber
                min={0}
                precision={4}
                value={item.unitPrice}
                style={{ width: '100%' }}
                onChange={(value) =>
                  update({
                    unitPrice: typeof value === 'number' ? value : undefined,
                  })
                }
              />
            ),
          },
          ...(showCurrency
            ? [
                {
                  key: 'currency',
                  title: capabilities.renderDictionaryConfigEntry?.({
                      target: 'dictionary',
                      typeCode: 'currency',
                      show: !currencyLoading && !currencyError && currencyOptions.length === 0 && items.every((item) => !item.currency),
                      onOpen: () => { refreshCurrencyOnFocusRef.current = true; },
                      children: '币别',
                    }) ?? '币别',
                  width: 104,
                  render: (item, _index, update) => (
                    <Select
                      value={item.currency}
                      onChange={(value) =>
                        update({ currency: value || undefined })
                      }
                      options={currencyOptions}
                      placeholder="币别"
                      style={{ width: '100%' }}
                      showSearch
                      allowClear
                      optionFilterProp="label"
                    />
                  ),
                } as DocumentLineColumn<OrderItemDraft>,
              ]
            : []),
          {
            key: 'discountRate',
            title: '折扣%',
            width: 112,
            align: 'right',
            render: (item, _index, update) => (
              <InputNumber
                min={0}
                max={100}
                precision={4}
                value={item.discountRate}
                placeholder="折扣%"
                style={{ width: '100%' }}
                controls={false}
                onChange={(value) =>
                  update({
                    discountRate: typeof value === 'number' ? value : undefined,
                  })
                }
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
                min={0}
                max={100}
                precision={4}
                value={item.taxRate}
                placeholder="税率%"
                style={{ width: '100%' }}
                controls={false}
                onChange={(value) =>
                  update({
                    taxRate: typeof value === 'number' ? value : undefined,
                  })
                }
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
                onChange={(value) =>
                  update({ priceIncludesTax: Boolean(value) })
                }
              />
            ),
          },
          {
            key: 'amount',
            title: '金额',
            width: 130,
            align: 'right',
            render: (item) => (
              <Typography.Text>
                {formatMoneyOrDash(resolveDraftAmounts(item).amount)}
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
                {formatMoneyOrDash(resolveDraftAmounts(item).discountAmount)}
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
                {formatMoneyOrDash(resolveDraftAmounts(item).discountedAmount)}
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
                {formatMoneyOrDash(resolveDraftAmounts(item).taxAmount)}
              </Typography.Text>
            ),
          },
          {
            key: 'totalAmount',
            title: '总金额',
            width: 130,
            align: 'right',
            render: (item) => (
              <Typography.Text strong>
                {formatMoneyOrDash(resolveDraftAmounts(item).totalAmount)}
              </Typography.Text>
            ),
          },
        ]
      : [];

    return [
      ...baseColumns,
      ...priceColumns,
      {
        key: 'manufactureMode',
        title: '产品类型',
        width: 130,
        render: (item, _index, update) => (
          <ManufactureModeSelect
            value={item.manufactureMode}
            options={capabilities.manufactureModeOptions}
            normalizeValue={capabilities.normalizeManufactureMode}
            onChange={(manufactureMode) => update({ manufactureMode })}
          />
        ),
      },
      {
        key: 'remarks',
        title: '备注',
        width: 220,
        render: (item, _index, update) => (
          <Input
            allowClear
            value={readText(item.remarks)}
            placeholder="明细备注"
            onChange={(event) =>
              update({ remarks: event.target.value || undefined })
            }
          />
        ),
      },
    ];
  }, [
    handleMaterialChange,
    materialPlaceholder,
    materialRequest,
    materialCustomFields,
    lineCustomFieldSchema,
    qtyErrors,
    showPrice,
    showCurrency,
    currencyOptions,
    headerDeliveryDate,
    requireDeliveryDate,
    resolveDraftAmounts,
    capabilities,
  ]);

  const effectiveItems = items.filter((item) => item.materialId);
  const totalQty = effectiveItems.reduce(
    (sum, item) => sum + Number(item.qty ?? 0),
    0,
  );
  const totalAmount = effectiveItems.reduce(
    (sum, item) => sum + (resolveDraftAmounts(item).totalAmount ?? 0),
    0,
  );
  const hasUnknownAmount = effectiveItems.some(
    (item) => resolveDraftAmounts(item).totalAmount == null,
  );
  const customFieldSummaries = capabilities.lineCustomFieldSummaries?.(effectiveItems, lineCustomFieldSchema) ?? summarizeDocumentFields(effectiveItems, lineCustomFieldSchema);

  return (
    <DocumentLineEditableTable<OrderItemDraft>
      rows={items}
      onRowsChange={onItemsChange}
      onRowsUpdate={onItemsUpdate}
      onRowPatch={(item, patch) => {
        if (typeof patch.qty === 'number' && item.materialId) {
          onQuantityAutoFill?.(item._key, item.materialId, patch.qty);
        }
      }}
      columns={columns}
      density="compact"
      createRow={() => createEmptyLine(defaultManufactureMode)}
      cloneRow={(item) => ({
        ...item,
        _key: nextItemKey(),
        bomCostSnapshot: undefined,
      })}
      addText="新增订单明细"
      batchOperations={createBatchOperations(capabilities.manufactureModeOptions)}
      toolbarActions={toolbarActions}
      scrollX={
        (showPrice ? (showCurrency ? 2738 : 2628) : 1758) +
        materialCustomFieldScrollWidth +
        lineCustomFieldScrollWidth
      }
      expandedRowRender={(item, _index, update) => {
        const nonStandard = isNonStandardManufactureMode(item.manufactureMode, capabilities.normalizeManufactureMode);

        return (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Space wrap size={12}>
              {capabilities.renderDrawingFiles({
                value: getDrawingUrls(item),
                availableFileUrls: availableDrawingUrls,
                editable: true,
                onChange: (drawingUrls) => update({ drawingUrls }),
              })}
              {nonStandard ? (
                item.saleOrderItemId ? (
                  capabilities.renderDocumentBomButton({
                    documentType: 'sale_order_item',
                    documentId: item.saleOrderItemId as string,
                    editable: true,
                    initialEdit: true,
                    initialImport: true,
                    productQty: item.qty,
                    title: '上传/粘贴本单 BOM',
                  })
                ) : (
                  <Tooltip title="保存订单后会生成订单行，届时可上传/粘贴本单 BOM">
                    <Button size="small" icon={<UploadOutlined />} disabled>
                      上传/粘贴 BOM
                    </Button>
                  </Tooltip>
                )
              ) : null}
              {!nonStandard ? (
                <RemoteSelect
                  allowClear
                  showSearch
                  disabled={!item.materialId}
                  filterOption={false}
                  placeholder={
                    item.materialId ? '选择标准 BOM（可选）' : '先选择产品'
                  }
                  value={
                    item.materialId
                      ? (item.selectedBomHeaderId as string | undefined) ||
                        undefined
                      : undefined
                  }
                  options={
                    item.materialId ? (bomOptionsMap[item._key] ?? []) : []
                  }
                  style={{ minWidth: 320 }}
                  onFocus={() => {
                    if (item.materialId) {
                      void loadBomOptions(item._key, item.materialId);
                    }
                  }}
                  onSearch={(keyword) => {
                    if (item.materialId) {
                      void loadBomOptions(item._key, item.materialId, keyword);
                    }
                  }}
                  onChange={(value) =>
                    update({
                      selectedBomHeaderId: value,
                      bomHeaderId: value,
                      bomSelectionSource: value ? 'manual' : undefined,
                      bomSelectionReason: value
                        ? '订单阶段人工确认'
                        : undefined,
                      bomCostSnapshot: undefined,
                    })
                  }
                />
              ) : null}
            </Space>
            {nonStandard ? (
              capabilities.renderFieldHelp({
                label: '非标订单 BOM',
                title: '保存后维护本单 BOM',
                content: '图纸可先随订单行上传；已有订单行可点“上传/粘贴 BOM”上传或粘贴 BOM 明细并展开确认，结果只写入本单 BOM，不回写标准 BOM。',
              })
            ) : (
              capabilities.renderBomCostSnapshotEditor({
                bomHeaderId: (item.selectedBomHeaderId as string | undefined) || (item.bomHeaderId as string | undefined),
                productQty: item.qty,
                asOfDate: costAsOfDate,
                value: item.bomCostSnapshot as Record<string, unknown> | undefined,
                onChange: (bomCostSnapshot) => update({ bomCostSnapshot }),
              })
            )}
          </Space>
        );
      }}
      summary={() => (
        <>
          {amountPreviewError ? (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={columns.length + 2}>
                <Typography.Text type="danger">
                  金额计算规则试算失败，当前金额暂不展示；保存时仍由后端按规则重新计算。
                </Typography.Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          ) : null}
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={columns.length + 2}>
              <Typography.Text strong>
                合计数量 {formatNumber(totalQty)}
                {showPrice
                  ? `，合计总金额 ${
                      hasUnknownAmount ? '-' : formatMoney(totalAmount)
                    }`
                  : ''}
                {customFieldSummaries.map(
                  (item) =>
                    `，${item.label} ${
                      item.value == null ? '-' : formatNumber(item.value)
                    }`,
                )}
              </Typography.Text>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </>
      )}
    />
  );
}
