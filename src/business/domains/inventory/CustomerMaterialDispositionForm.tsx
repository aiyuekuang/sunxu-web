import {
  DrawerForm,
  type ProColumns,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Button, Form, Row, Tag } from 'antd';
import type { ReactElement } from 'react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { renderCustomFieldCell } from '../documents/CustomFieldCell';
import { DocumentLineCustomFieldFormItems } from '../documents/DocumentLineCustomFieldFormItems';
import { MasterDataQuickCreateSelect } from '../shared/MasterDataQuickCreateSelect';
import { ResizableProTable as ProTable } from '../shared/ResizableTable';
import { StockBusinessDateField } from './StockBusinessDateField';
import { StockLocationDependencyField } from './StockLocationSelectField';
import type { DocumentLineCustomFieldSchema } from '../documents/document-line-custom-field-types';
import type {
  CustomerMaterialDispositionAvailableSource,
  CustomerMaterialDispositionFormLine,
  CustomerMaterialDispositionFormProps,
  CustomerMaterialDispositionFormValues,
  CustomerMaterialDispositionSelectOption,
} from './customer-material-disposition-types';

interface CustomValuePayload {
  customFieldSchemaVersion: number;
  customValues: Record<string, unknown>;
}

function createClientRequestId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function formatSourceLabel(source: CustomerMaterialDispositionAvailableSource) {
  return [
    source.sourceLabel,
    source.materialLabel,
    `剩余 ${source.remainingQty}`,
    source.batchNo ? `批号 ${source.batchNo}` : undefined,
  ]
    .filter(Boolean)
    .join('｜');
}

function sourceKey(source: CustomerMaterialDispositionAvailableSource): string {
  return source.sourceLayerId ?? source.customerInboundId ?? '';
}

function sourceKeyFromLine(line: CustomerMaterialDispositionFormLine): string {
  return line.sourceLayerId ?? line.customerInboundId ?? '';
}

function isAvailableSource(
  value: object,
): value is CustomerMaterialDispositionAvailableSource {
  const record = value as Record<string, unknown>;
  return (
    (typeof record.sourceLayerId === 'string' ||
      typeof record.customerInboundId === 'string') &&
    typeof record.stockManaged === 'boolean' &&
    typeof record.sourceLabel === 'string' &&
    typeof record.materialLabel === 'string' &&
    typeof record.remainingQty === 'number'
  );
}

function visibleCustomFieldListColumns(
  schema: DocumentLineCustomFieldSchema | null | undefined,
): ProColumns<CustomerMaterialDispositionFormLine>[] {
  const fields = (schema?.fields ?? [])
    .filter(
      (field) =>
        field.isActive !== false &&
        field.displayJson !== null &&
        typeof field.displayJson === 'object' &&
        !Array.isArray(field.displayJson) &&
        (field.displayJson as Record<string, unknown>).showInList === true,
    )
    .slice()
    .sort((left, right) => {
      const leftDisplay =
        left.displayJson && typeof left.displayJson === 'object'
          ? (left.displayJson as Record<string, unknown>)
          : {};
      const rightDisplay =
        right.displayJson && typeof right.displayJson === 'object'
          ? (right.displayJson as Record<string, unknown>)
          : {};
      const leftOrder = leftDisplay.sortOrder;
      const rightOrder = rightDisplay.sortOrder;
      return (
        (typeof leftOrder === 'number' ? leftOrder : (left.sortOrder ?? 0)) -
        (typeof rightOrder === 'number' ? rightOrder : (right.sortOrder ?? 0))
      );
    });

  return fields.map((field) => {
    const display =
      field.displayJson && typeof field.displayJson === 'object'
        ? (field.displayJson as Record<string, unknown>)
        : {};
    const listWidth = display.listWidth;
    const width =
      typeof listWidth === 'number' && listWidth > 0
        ? listWidth
        : field.dataType === 'long_text'
          ? 200
          : field.dataType === 'date' || field.dataType === 'datetime'
            ? 168
            : field.dataType === 'boolean'
              ? 96
              : 140;
    return {
      title: `处置明细·${field.label}`,
      key: `line-custom-${field.fieldKey}`,
      width,
      ellipsis: true,
      search: false,
      sorter: false,
      render: (_value, record) =>
        renderCustomFieldCell(field, {
          computedValues: record.customComputedValues,
          rawValues: record.customValues,
          errors: record.customComputedErrors,
        }),
    };
  });
}

function buildCustomValuePayload(
  line: CustomerMaterialDispositionFormLine,
  schema: DocumentLineCustomFieldSchema | null | undefined,
): CustomValuePayload | null {
  const formFields = (schema?.fields ?? [])
    .filter((field) => field.isActive !== false)
    .filter((field) => {
      const display =
        field.displayJson && typeof field.displayJson === 'object'
          ? (field.displayJson as Record<string, unknown>)
          : {};
      return display.showInForm === true && field.fieldKind === 'input';
    });
  if (!schema || formFields.length === 0) return null;

  const inputKeys = new Set(
    (schema.fields ?? [])
      .filter((field) => field.isActive !== false)
      .filter((field) => field.fieldKind === 'input')
      .map((field) => field.fieldKey),
  );
  const lineFormValues = line.customValues ?? {};
  const currentValues = lineFormValues.customValues ?? {};
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

function enumOptions(
  enumMap: Readonly<Record<string, { text: string }>>,
): CustomerMaterialDispositionSelectOption[] {
  return Object.entries(enumMap).map(([value, item]) => ({
    label: item.text,
    value,
  }));
}

/**
 * @sunxu-layer business
 * @sunxu-domain inventory
 * @sunxu-reason Preserves customer-material source allocation, stock/location/batch rules, idempotent confirmation, and line custom fields while the host supplies host requests, permissions, dictionaries, and field help.
 */
export function CustomerMaterialDispositionForm({
  open,
  onClose,
  onSuccess,
  capabilities,
}: CustomerMaterialDispositionFormProps): ReactElement {
  const [form] = Form.useForm<CustomerMaterialDispositionFormValues>();
  const requestIdRef = useRef<string | null>(null);
  const capabilitiesRef = useRef(capabilities);
  capabilitiesRef.current = capabilities;
  const [lineCustomFieldSchema, setLineCustomFieldSchema] = useState<
    DocumentLineCustomFieldSchema | null
  >();
  const [availableSources, setAvailableSources] = useState<
    CustomerMaterialDispositionAvailableSource[]
  >([]);
  const [selectedSourceKey, setSelectedSourceKey] = useState<string>();
  const [lines, setLines] = useState<CustomerMaterialDispositionFormLine[]>([]);
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setLineCustomFieldSchema(undefined);
      return undefined;
    }
    let cancelled = false;
    requestIdRef.current = createClientRequestId();
    setAvailableSources([]);
    setSelectedSourceKey(undefined);
    setLines([]);
    setEditingLineIndex(null);
    form.resetFields();
    form.setFieldsValue({ dispositionType: 'return' });
    void capabilitiesRef.current
      .requestFormSchema({ objectType: 'customer_material_disposition_item' })
      .then((schema) => {
        if (!cancelled) setLineCustomFieldSchema(schema ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setLineCustomFieldSchema(null);
          capabilitiesRef.current.notifyError('加载明细自定义字段失败');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [form, open]);

  const selectedSource = useMemo(
    () =>
      availableSources.find(
        (source) => sourceKey(source) === selectedSourceKey,
      ),
    [availableSources, selectedSourceKey],
  );

  const availableLineQty = useMemo(() => {
    if (!selectedSource) return undefined;
    const queuedQty = lines.reduce(
      (total, line, index) =>
        sourceKeyFromLine(line) === sourceKey(selectedSource) &&
        index !== editingLineIndex
          ? total + line.qty
          : total,
      0,
    );
    return Math.max(0, selectedSource.remainingQty - queuedQty);
  }, [editingLineIndex, lines, selectedSource]);

  const loadAvailableSources = useCallback(
    async (customerId?: string, keyword?: string) => {
      if (!customerId) return [];
      const result = await capabilitiesRef.current.requestAvailableSources({
        customerId,
        keyword,
        page: 1,
        pageSize: 100,
      });
      const sources = (result?.list ?? []).filter(isAvailableSource);
      setAvailableSources(sources);
      return sources.map((source) => ({
        label: formatSourceLabel(source),
        value: sourceKey(source),
      }));
    },
    [],
  );

  const clearLineEditor = useCallback(() => {
    setSelectedSourceKey(undefined);
    setEditingLineIndex(null);
    form.setFieldsValue({
      lineSourceKey: undefined,
      lineWarehouseId: undefined,
      lineLocationId: undefined,
      lineBatchNo: undefined,
      lineQty: undefined,
      lineCustomValues: undefined,
    });
  }, [form]);

  const addOrUpdateLine = useCallback(async () => {
    const { lineSourceKey } = await form.validateFields(['lineSourceKey']);
    const source = availableSources.find(
      (item) => sourceKey(item) === lineSourceKey,
    );
    if (!source) return;
    const customFieldNames = (lineCustomFieldSchema?.fields ?? [])
      .filter((field) => field.isActive !== false)
      .filter((field) => {
        const display =
          field.displayJson && typeof field.displayJson === 'object'
            ? (field.displayJson as Record<string, unknown>)
            : {};
        return display.showInForm === true && field.fieldKind === 'input';
      })
      .map((field) => ['lineCustomValues', field.fieldKey] as const);
    const values = await form.validateFields([
      'lineSourceKey',
      'lineQty',
      ...(source.stockManaged
        ? (['lineWarehouseId', 'lineLocationId'] as const)
        : []),
      ...customFieldNames,
    ]);
    const qty = Number(values.lineQty);
    if (
      !Number.isFinite(qty) ||
      (source.stockManaged && !values.lineWarehouseId)
    ) {
      return;
    }
    if (availableLineQty === undefined || qty > availableLineQty) {
      form.setFields([
        {
          name: 'lineQty',
          errors: [`本次数量不能超过来源可分配余额 ${availableLineQty ?? 0}`],
        },
      ]);
      return;
    }

    const line: CustomerMaterialDispositionFormLine = {
      lineId:
        editingLineIndex === null
          ? createClientRequestId()
          : (lines[editingLineIndex]?.lineId ?? createClientRequestId()),
      sourceLayerId: source.sourceLayerId ?? undefined,
      customerInboundId: source.customerInboundId ?? undefined,
      stockManaged: source.stockManaged,
      sourceLabel: source.sourceLabel,
      materialLabel: source.materialLabel,
      warehouseId: values.lineWarehouseId ?? '',
      locationId: values.lineLocationId,
      batchNo: source.stockManaged
        ? source.sourceLayerType === 'legacy_unallocated'
          ? values.lineBatchNo?.trim() || undefined
          : (source.batchNo ?? undefined)
        : undefined,
      qty,
      customFieldSchemaVersion: lineCustomFieldSchema?.schemaVersion,
      customValues: values.lineCustomValues,
    };
    setLines((previous) =>
      editingLineIndex === null
        ? [...previous, line]
        : previous.map((item, index) =>
            index === editingLineIndex ? line : item,
          ),
    );
    clearLineEditor();
  }, [
    availableLineQty,
    availableSources,
    clearLineEditor,
    editingLineIndex,
    form,
    lineCustomFieldSchema,
    lines,
  ]);

  const editLine = useCallback(
    (index: number) => {
      const line = lines[index];
      if (!line) return;
      setEditingLineIndex(index);
      setSelectedSourceKey(sourceKeyFromLine(line));
      form.setFieldsValue({
        lineSourceKey: sourceKeyFromLine(line),
        lineWarehouseId: line.warehouseId,
        lineLocationId: line.locationId,
        lineBatchNo: line.batchNo,
        lineQty: line.qty,
        lineCustomValues: line.customValues,
      });
    },
    [form, lines],
  );

  const lineColumns = useMemo<ProColumns<CustomerMaterialDispositionFormLine>[]>(
    () => [
      { title: '来源', dataIndex: 'sourceLabel', width: 190, ellipsis: true },
      { title: '物料', dataIndex: 'materialLabel', width: 220, ellipsis: true },
      { title: '批号', dataIndex: 'batchNo', width: 130 },
      { title: '处置数量', dataIndex: 'qty', width: 110 },
      ...visibleCustomFieldListColumns(lineCustomFieldSchema),
      {
        title: '操作',
        key: 'actions',
        dataIndex: '__actions',
        valueType: 'option',
        width: 144,
        render: (_value, _record, index) => [
          <Button
            key="edit"
            type="link"
            htmlType="button"
            size="small"
            onClick={() => editLine(index)}
          >
            编辑
          </Button>,
          <Button
            key="remove"
            type="link"
            htmlType="button"
            size="small"
            danger
            onClick={() => {
              setLines((previous) =>
                previous.filter((_line, lineIndex) => lineIndex !== index),
              );
              if (editingLineIndex === index) clearLineEditor();
            }}
          >
            移除
          </Button>,
        ],
      },
    ],
    [clearLineEditor, editLine, editingLineIndex, lineCustomFieldSchema],
  );

  const dispositionTypeOptions = useMemo(
    () => enumOptions(capabilities.typeEnum),
    [capabilities.typeEnum],
  );

  return (
    <DrawerForm<CustomerMaterialDispositionFormValues>
      title="新增"
      open={open}
      form={form}
      width={920}
      drawerProps={{ destroyOnHidden: true }}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      onFinish={async (values) => {
        if (!values.customerId || !values.dispositionType) return false;
        if (lines.length === 0) {
          form.setFields([
            {
              name: 'lineSourceKey',
              errors: ['请至少添加一条客户料处置明细'],
            },
          ]);
          return false;
        }
        try {
          const idempotencyKey =
            requestIdRef.current ?? createClientRequestId();
          requestIdRef.current = idempotencyKey;
          await capabilitiesRef.current.confirm({
            idempotencyKey,
            customerId: values.customerId,
            dispositionType: values.dispositionType,
            disposedAt: capabilitiesRef.current.normalizeDateOnlyValue(
              values.disposedAt,
            ),
            reasonCode: values.reasonCode?.trim() || undefined,
            logisticsNo: values.logisticsNo?.trim() || undefined,
            remark: values.remark?.trim() || undefined,
            items: lines.map((line) => ({
              sourceLayerId: line.sourceLayerId,
              customerInboundId: line.customerInboundId,
              warehouseId: line.stockManaged ? line.warehouseId : undefined,
              locationId: line.stockManaged ? line.locationId : undefined,
              batchNo: line.stockManaged ? line.batchNo : undefined,
              qty: line.qty,
              ...(buildCustomValuePayload(line, lineCustomFieldSchema) ?? {}),
            })),
          });
          onSuccess();
          return true;
        } catch {
          // The host service owns the actionable request error; retain values and idempotency key for retry.
          return false;
        }
      }}
    >
      <MasterDataQuickCreateSelect
        name="customerId"
        quickCreateEntity="customer"
        {...capabilities.getFieldHelpProps('客户')}
        request={capabilities.requestCustomerOptions}
        rules={[{ required: true, message: '请选择客户' }]}
        showSearch
        debounceTime={300}
        fieldProps={{
          filterOption: false,
          onChange: () => {
            setAvailableSources([]);
            setLines([]);
            clearLineEditor();
          },
        }}
      />
      <ProFormSelect
        name="dispositionType"
        {...capabilities.getFieldHelpProps('处置类型')}
        options={dispositionTypeOptions}
        rules={[{ required: true, message: '请选择处置类型' }]}
      />
      <StockBusinessDateField name="disposedAt" label="处置业务日期" />

      <Form.Item label="处置明细" required>
        <ProFormSelect
          name="lineSourceKey"
          label="可处置来源"
          dependencies={['customerId']}
          request={(params) =>
            loadAvailableSources(
              form.getFieldValue('customerId'),
              params.keyWords,
            )
          }
          rules={[{ required: true, message: '请选择客户料来源' }]}
          showSearch
          debounceTime={300}
          fieldProps={{
            filterOption: false,
            onChange: (value: string) => {
              const source = availableSources.find(
                (item) => sourceKey(item) === value,
              );
              setSelectedSourceKey(value);
              form.setFieldsValue({
                lineWarehouseId: undefined,
                lineLocationId: undefined,
                lineBatchNo: source?.batchNo ?? undefined,
                lineQty: undefined,
              });
            },
          }}
          extra="历史库存会明确标记为“历史未分摊来源”，不会伪装成新的来料登记。"
        />
        {selectedSource ? (
          <Form.Item label="来源可分配余额">
            <Tag color="processing">{formatSourceLabel(selectedSource)}</Tag>
          </Form.Item>
        ) : null}
        {selectedSource?.stockManaged ? (
          <>
            <ProFormSelect
              name="lineWarehouseId"
              {...capabilities.getFieldHelpProps('实际出库仓')}
              request={capabilities.requestWarehouseOptions}
              rules={[{ required: true, message: '请选择实际出库仓' }]}
              showSearch
              debounceTime={300}
              fieldProps={{ filterOption: false }}
            />
            <StockLocationDependencyField
              name="lineLocationId"
              label="实际出库仓位"
              action="stock/out"
              warehouseFieldName="lineWarehouseId"
              requiredMessage="当前出库仓要求选择仓位"
              capabilities={capabilities.stockLocationCapabilities}
            />
            <ProFormText
              name="lineBatchNo"
              {...capabilities.getFieldHelpProps('实际出库批号')}
              fieldProps={{
                readOnly:
                  selectedSource.sourceLayerType !== 'legacy_unallocated',
              }}
              extra={
                selectedSource.sourceLayerType === 'legacy_unallocated'
                  ? '历史未分摊来源请按当前实物批号填写。'
                  : '已追溯来源的批号已锁定，处置时必须与来源批号一致。'
              }
            />
          </>
        ) : selectedSource ? (
          <Form.Item label="处置方式">
            <Tag>未转库存外来物品：仅登记处置事实，不产生库存流水</Tag>
          </Form.Item>
        ) : null}
        <ProFormDigit
          name="lineQty"
          {...capabilities.getFieldHelpProps('本次处置数量')}
          min={0.0001}
          fieldProps={{ precision: 4, max: availableLineQty }}
          rules={[
            { required: true, message: '请输入本次处置数量' },
            {
              validator: async (_rule: unknown, value?: number) => {
                if (
                  value !== undefined &&
                  availableLineQty !== undefined &&
                  value > availableLineQty
                ) {
                  throw new Error(
                    `本次数量不能超过来源可分配余额 ${availableLineQty}`,
                  );
                }
              },
            },
          ]}
        />
        <Row gutter={[16, 4]}>
          <DocumentLineCustomFieldFormItems
            schema={lineCustomFieldSchema}
            namePrefix={['lineCustomValues']}
            colSpan={8}
          />
        </Row>
        <Button
          type="dashed"
          htmlType="button"
          onClick={() => void addOrUpdateLine()}
        >
          {editingLineIndex === null ? '加入处置明细' : '更新处置明细'}
        </Button>
        {editingLineIndex !== null ? (
          <Button
            type="link"
            htmlType="button"
            onClick={clearLineEditor}
          >
            取消编辑
          </Button>
        ) : null}
      </Form.Item>

      <ProTable<CustomerMaterialDispositionFormLine>
        columns={lineColumns}
        dataSource={lines}
        rowKey="lineId"
        search={false}
        options={false}
        pagination={false}
        size="small"
        locale={{ emptyText: '请先添加至少一条处置明细' }}
      />

      <ProFormText
        name="reasonCode"
        {...capabilities.getFieldHelpProps('原因码')}
      />
      <ProFormText
        name="logisticsNo"
        {...capabilities.getFieldHelpProps('物流单号')}
      />
      <ProFormTextArea
        name="remark"
        {...capabilities.getFieldHelpProps('处置备注')}
        fieldProps={{ rows: 3 }}
      />
    </DrawerForm>
  );
}
