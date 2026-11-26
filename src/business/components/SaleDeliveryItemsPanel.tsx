import {
  ModalForm,
  type ProColumns,
  ProFormDependency,
  ProFormDigit,
  ProFormGroup,
  ProFormList,
  type ProFormRef,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Empty,
  Row,
  Space,
  Spin,
  Tooltip,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CustomerMaterialCell } from './CustomerMaterialCell';
import { ResizableProTable as ProTable } from './ResizableTable';
import { renderCustomFieldCell } from './CustomFieldCell';
import { createMaterialCustomFieldColumns } from './materialCustomFieldColumns';
import type { DocumentLineCustomFieldDefinition } from './document-line-custom-field-types';
import type {
  DeliveryLineExecutionPatch,
  DeliveryLineFormValues,
  SaleDeliveryDetailRecord,
  SaleDeliveryExecutionPayload,
  SaleDeliveryItemRecord,
  SaleDeliveryItemsPanelProps,
} from './sales-delivery-components-types';

const SCROLLABLE_MODAL_PROPS = {
  centered: true,
  styles: { body: { maxHeight: 'calc(100vh - 200px)', overflowX: 'hidden' as const, overflowY: 'auto' as const } },
};

function getOptionalText(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function getFiniteQuantity(value: unknown): number | undefined {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : undefined;
}

function formatNumber(value: number, options: { maximumFractionDigits?: number } = {}) {
  return value.toLocaleString('zh-CN', { maximumFractionDigits: options.maximumFractionDigits ?? 2 });
}

function formatCurrency(value: number | string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `¥${amount.toFixed(2)}` : String(value);
}

function formatUnitLabel(unit: string | null | undefined, unitLabelMap: Readonly<Record<string, string>>) {
  const normalized = unit?.trim();
  return normalized ? unitLabelMap[normalized] ?? normalized : '';
}

function createDetailCustomFieldColumns<T extends SaleDeliveryItemRecord>(schema?: { fields?: DocumentLineCustomFieldDefinition[] | null } | null): ProColumns<T>[] {
  return (schema?.fields ?? [])
    .filter((field) => field.isActive !== false && readObject(field.displayJson).showInDetail === true)
    .slice()
    .sort((left, right) => {
      const leftSort = readObject(left.displayJson).sortOrder;
      const rightSort = readObject(right.displayJson).sortOrder;
      return (typeof leftSort === 'number' ? leftSort : left.sortOrder ?? 0) - (typeof rightSort === 'number' ? rightSort : right.sortOrder ?? 0);
    })
    .map((field) => ({
      title: field.label,
      key: `line-custom-${field.fieldKey}`,
      width: (() => {
        const listWidth = readObject(field.displayJson).listWidth;
        if (typeof listWidth === 'number' && listWidth > 0) return listWidth;
        return field.dataType === 'long_text' ? 200 : field.dataType === 'date' || field.dataType === 'datetime' ? 168 : field.dataType === 'boolean' ? 96 : 140;
      })(),
      ellipsis: true,
      search: false,
      sorter: false,
      render: (_value, record) => renderCustomFieldCell(field, {
        computedValues: record.customComputedValues,
        rawValues: record.customValues,
        errors: record.customComputedErrors,
      }),
    }));
}

function createPriceColumns<T extends SaleDeliveryItemRecord>(mask: (value: string | number | null | undefined) => string, renderPolicyTag: (props: { priceSnapshot?: unknown; mask: (amount: string | number | null | undefined) => string }) => ReactNode): ProColumns<T>[] {
  const money = (value?: number | null, snapshot?: unknown) => {
    if (value == null) return '-';
    const currency = getSnapshotCurrency(snapshot);
    return mask(`${Number(value).toFixed(2)}${currency ? ` ${currency}` : ''}`);
  };
  const rate = (value?: number | null) => value == null ? '-' : `${Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 4 })}%`;
  return [
    { title: '单价', dataIndex: 'unitPrice', width: 120, align: 'right', search: false, render: (_value, row) => money(row.unitPrice, row.priceSnapshot) },
    { title: '金额', dataIndex: 'amount', width: 130, align: 'right', search: false, render: (_value, row) => money(row.amount, row.priceSnapshot) },
    { title: '折扣%', dataIndex: 'discountRate', width: 110, align: 'right', search: false, render: (_value, row) => rate(row.discountRate) },
    { title: '折扣金额', dataIndex: 'discountAmount', width: 130, align: 'right', search: false, render: (_value, row) => money(row.discountAmount, row.priceSnapshot) },
    { title: '折后金额', dataIndex: 'discountedAmount', width: 130, align: 'right', search: false, render: (_value, row) => money(row.discountedAmount, row.priceSnapshot) },
    { title: '税率%', dataIndex: 'taxRate', width: 110, align: 'right', search: false, render: (_value, row) => rate(row.taxRate) },
    { title: '税额', dataIndex: 'taxAmount', width: 130, align: 'right', search: false, render: (_value, row) => money(row.taxAmount, row.priceSnapshot) },
    { title: '总金额', dataIndex: 'totalAmount', width: 130, align: 'right', search: false, render: (_value, row) => money(row.totalAmount, row.priceSnapshot) },
    { title: '单价含税', dataIndex: 'priceIncludesTax', width: 110, align: 'center', search: false, render: (_value, row) => row.priceIncludesTax == null ? '-' : row.priceIncludesTax ? '是' : '否' },
    { title: '金额计算规则', dataIndex: 'priceSnapshot', width: 150, search: false, render: (_value, row) => {
      const snapshot = readObject(row.priceSnapshot);
      const policy = typeof snapshot.policyName === 'string' ? snapshot.policyName : typeof snapshot.policyCode === 'string' ? snapshot.policyCode : '';
      return (renderPolicyTag({ priceSnapshot: row.priceSnapshot, mask }) ?? policy) || '-';
    } },
  ];
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function getSaleDeliveryItemCustomValues(
  item: SaleDeliveryItemRecord,
): Record<string, unknown> | undefined {
  return item.customValues;
}

function getSnapshotCurrency(value: unknown): string | undefined {
  const snapshot =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const currency = snapshot.currency;
  return typeof currency === 'string' && currency.trim()
    ? currency.trim()
    : undefined;
}

type DeliveryBatchExecutionFormValues = {
  items: DeliveryLineExecutionPatch[];
};

function getDeliveryItemLabel(item: SaleDeliveryItemRecord): string {
  return [
    item.customerMaterialName || item.material?.name || item.materialId,
    item.customerMaterialCode || item.material?.code,
    item.customerMaterialSpec || item.material?.spec,
  ]
    .filter(Boolean)
    .join(' / ');
}

function summarizeItems(items?: readonly SaleDeliveryItemRecord[] | null) {
  let totalQuantity = 0;
  let totalAmount = 0;
  let unpricedItemCount = 0;
  for (const item of items ?? []) {
    const quantity = Number(item.quantity);
    if (Number.isFinite(quantity)) totalQuantity += quantity;
    if (item.totalAmount == null || !Number.isFinite(Number(item.totalAmount))) {
      unpricedItemCount += 1;
    } else totalAmount += Number(item.totalAmount);
  }
  return { itemCount: items?.length ?? 0, totalQuantity, totalAmount: unpricedItemCount === 0 ? totalAmount : undefined, unpricedItemCount };
}

function buildExecutionItems(items: readonly SaleDeliveryItemRecord[], patches: readonly DeliveryLineExecutionPatch[]): SaleDeliveryExecutionPayload['items'] {
  const patchById = new Map(patches.map((patch) => [patch.itemId, patch] as const));
  return items.map((item) => {
    const patch = patchById.get(item.id);
    return {
      id: item.id,
      saleOrderItemId: item.saleOrderItemId,
      materialId: item.materialId,
      quantity: patch ? patch.quantity : Number(item.quantity),
      batchNo: patch ? getOptionalText(patch.batchNo) : getOptionalText(item.batchNo),
      locationId: patch ? patch.locationId : item.locationId,
      storageLocation: patch ? getOptionalText(patch.storageLocation) : getOptionalText(item.storageLocationSnapshot),
      packageUnitId: item.packageUnitId,
      packageUnitLineId: item.packageUnitLineId,
      remarks: patch ? getOptionalText(patch.remarks) : getOptionalText(item.remarks),
      ...(patch?.customFieldSchemaVersion !== undefined ? { customFieldSchemaVersion: patch.customFieldSchemaVersion } : {}),
      ...(patch?.customValues !== undefined ? { customValues: patch.customValues } : {}),
    };
  });
}

/**
 * @sunxu-layer business
 * @sunxu-domain sales delivery
 * @sunxu-reason Keeps outbound execution detail editing and bulk selection in the reusable MES suite while the host supplies document APIs, permissions, dictionaries, and stock integrations.
 *
 * 销售出库单详情抽屉中的物料行作业面板。
 *
 * 这里不展示单据头、审批或附件等详情内容；这些属于单据级操作，统一从单据列表
 * 的“三点菜单”入口处理。草稿行只允许维护本次出库的实际执行数据，不在行上确认
 * 出库或直接扣库存。
 */
export function SaleDeliveryItemsPanel({
  deliveryId,
  onActionSuccess,
  onOpenFullEditor,
  capabilities,
}: SaleDeliveryItemsPanelProps) {
  const canViewSaleDeliveryPrices = capabilities.canViewPrices;
  const mask = capabilities.maskAmount ?? ((value: string | number | null | undefined) => String(value ?? ''));
  const { unitLabelMap, materialCustomFields, lineCustomFieldSchema } = capabilities;
  const lineCustomFieldColumns = useMemo(
    () => createDetailCustomFieldColumns<SaleDeliveryItemRecord>(lineCustomFieldSchema),
    [lineCustomFieldSchema],
  );
  const [order, setOrder] = useState<SaleDeliveryDetailRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<SaleDeliveryItemRecord>();
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [batchEditingItemIds, setBatchEditingItemIds] = useState<string[]>([]);
  const detailRequestSequence = useRef(0);
  const lineEditFormRef = useRef<
    ProFormRef<DeliveryLineFormValues> | undefined
  >(undefined);
  const batchLineEditFormRef = useRef<
    ProFormRef<DeliveryBatchExecutionFormValues> | undefined
  >(undefined);

  const loadDetail = useCallback(async () => {
    const requestId = detailRequestSequence.current + 1;
    detailRequestSequence.current = requestId;
    if (!deliveryId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const detail = await capabilities.loadDetail(deliveryId);
      if (detailRequestSequence.current !== requestId) return;
      setOrder(detail ?? null);
    } finally {
      if (detailRequestSequence.current === requestId) {
        setLoading(false);
      }
    }
  }, [capabilities.loadDetail, deliveryId]);

  useEffect(() => {
    detailRequestSequence.current += 1;
    setOrder(null);
    setLoading(Boolean(deliveryId));
    setEditingItem(undefined);
    setSelectedItemIds([]);
    setBatchEditingItemIds([]);
  }, [deliveryId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const canUpdateExecution = Boolean(order?.availableActions.includes('update') && capabilities.canUpdateExecution);
  const priceVisible =
    canViewSaleDeliveryPrices && order?.priceVisible !== false;
  const itemSummary = useMemo(
    () => summarizeItems(order?.items),
    [order?.items],
  );

  const saveLineExecution = useCallback(
    async (values: DeliveryLineFormValues) => {
      if (!order || !editingItem) return false;

      const customFieldValues =
        values.customValues !== undefined && lineCustomFieldSchema
          ? {
              customFieldSchemaVersion: lineCustomFieldSchema.schemaVersion,
              customValues: values.customValues,
            }
          : {};

      await capabilities.updateExecution({
        id: order.id,
        items: buildExecutionItems(order.items ?? [], [{
          itemId: editingItem.id,
          ...values,
          ...customFieldValues,
        }]),
      });
      capabilities.notify.success('本次出库明细已保存');
      setEditingItem(undefined);
      await loadDetail();
      onActionSuccess?.();
      return true;
    },
    [capabilities, editingItem, lineCustomFieldSchema, loadDetail, onActionSuccess, order],
  );

  const batchEditingItems = useMemo(() => {
    const batchEditingItemIdSet = new Set(batchEditingItemIds);
    return (order?.items ?? []).filter((item) =>
      batchEditingItemIdSet.has(item.id),
    );
  }, [batchEditingItemIds, order?.items]);

  const saveBatchLineExecution = useCallback(
    async (values: DeliveryBatchExecutionFormValues) => {
      if (!order || values.items.length === 0) return false;

      const items = values.items.map((item) => ({
        ...item,
        ...(item.customValues !== undefined && lineCustomFieldSchema
          ? {
              customFieldSchemaVersion: lineCustomFieldSchema.schemaVersion,
            }
          : {}),
      }));

      await capabilities.updateExecution({
        id: order.id,
        items: buildExecutionItems(order.items ?? [], items),
      });
      capabilities.notify.success(`已保存 ${values.items.length} 条出库明细`);
      setSelectedItemIds([]);
      setBatchEditingItemIds([]);
      await loadDetail();
      onActionSuccess?.();
      return true;
    },
    [capabilities, lineCustomFieldSchema, loadDetail, onActionSuccess, order],
  );

  if (loading && !order) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={deliveryId ? '未找到销售出库单' : '请选择销售出库单'}
        style={{ marginTop: 96 }}
      />
    );
  }

  const columns: ProColumns<SaleDeliveryItemRecord>[] = [
    {
      title: '物料名称',
      key: 'materialName',
      width: 180,
      render: (_, record) => (
        <CustomerMaterialCell
          item={record}
          field="name"
          displayMode="internal"
          showSpec
        />
      ),
    },
    {
      title: '客户物料名称',
      key: 'customerMaterialName',
      width: 180,
      render: (_, record) => (
        <CustomerMaterialCell
          item={record}
          field="name"
          displayMode="customer"
          showSpec
        />
      ),
    },
    {
      title: '物料编码',
      key: 'materialCode',
      width: 140,
      render: (_, record) => (
        <CustomerMaterialCell
          item={record}
          field="code"
          displayMode="internal"
        />
      ),
    },
    {
      title: '客户物料编码',
      key: 'customerMaterialCode',
      width: 140,
      render: (_, record) => (
        <CustomerMaterialCell
          item={record}
          field="code"
          displayMode="customer"
        />
      ),
    },
    {
      title: '单位',
      width: 90,
      render: (_, record) =>
        formatUnitLabel(record.material?.unit, unitLabelMap) || '-',
    },
    {
      title: '本次出库数量',
      dataIndex: 'quantity',
      width: 126,
      align: 'right',
    },
    ...createMaterialCustomFieldColumns<SaleDeliveryItemRecord>(
      [...materialCustomFields],
      { getMaterial: (record) => record.material },
    ),
    ...lineCustomFieldColumns,
    {
      title: '批号',
      dataIndex: 'batchNo',
      width: 160,
      render: (value) => value || '-',
    },
    {
      title: '出库仓位',
      width: 170,
      render: (_, record) =>
        record.location?.pathName || record.storageLocationSnapshot || '-',
    },
    {
      title: '包装箱',
      width: 160,
      render: (_, record) => record.packageUnit?.packageNo || '-',
    },
    ...(priceVisible
      ? createPriceColumns<SaleDeliveryItemRecord>(mask, capabilities.renderAmountPolicySnapshotTag)
      : []),
    {
      title: '备注',
      dataIndex: 'remarks',
      width: 180,
      ellipsis: true,
      render: (value) => value || '-',
    },
    {
      title: '操作',
      key: 'actions',
      dataIndex: '__actions',
      valueType: 'option',
      width: 112,
      fixed: 'right',
      align: 'center',
      render: (_, record) => {
        if (!canUpdateExecution) return '-';
        if (record.packageUnitId || record.packageUnitLineId) {
          return (
            <Tooltip title="已关联包装箱，编辑后需保持包装分配一致">
              <Button type="link" onClick={() => onOpenFullEditor?.(order.id)}>
                编辑
              </Button>
            </Tooltip>
          );
        }
        return (
          <Button type="link" onClick={() => setEditingItem(record)}>
            调整执行
          </Button>
        );
      },
    },
  ];

  const editingLineLabel = editingItem
    ? [
        editingItem.customerMaterialName || editingItem.material?.name,
        editingItem.customerMaterialCode || editingItem.material?.code,
      ]
        .filter(Boolean)
        .join(' / ')
    : '';

  return (
    <>
      <section aria-label="物料明细" style={{ minWidth: 0, width: '100%' }}>
        <ProTable<SaleDeliveryItemRecord>
          rowKey="id"
          resizable={{ persistenceKey: 'sale-delivery-detail-items' }}
          search={false}
          headerTitle={false}
          options={{
            reload: false,
            density: false,
            fullScreen: false,
            setting: true,
          }}
          loading={loading}
          dataSource={order.items ?? []}
          pagination={false}
          footer={() => (
            <Space size="large" wrap>
              <Typography.Text type="secondary">本单合计：</Typography.Text>
              <span>明细行 {formatNumber(itemSummary.itemCount)}</span>
              <span>
                出库数量{' '}
                {formatNumber(itemSummary.totalQuantity, {
                  maximumFractionDigits: 4,
                })}
              </span>
              {priceVisible ? (
                <span>
                  价税合计{' '}
                  {itemSummary.totalAmount == null
                    ? '-'
                    : mask(formatCurrency(itemSummary.totalAmount))}
                </span>
              ) : null}
              {priceVisible && itemSummary.unpricedItemCount > 0 ? (
                <Typography.Text type="warning">
                  未定价 {itemSummary.unpricedItemCount} 行
                </Typography.Text>
              ) : null}
            </Space>
          )}
          rowSelection={
            canUpdateExecution
              ? {
                  selectedRowKeys: selectedItemIds,
                  onChange: (keys) =>
                    setSelectedItemIds(keys.map((key) => String(key))),
                  getCheckboxProps: (record) => ({
                    disabled: Boolean(
                      record.packageUnitId || record.packageUnitLineId,
                    ),
                  }),
                }
              : undefined
          }
          tableAlertOptionRender={({ onCleanSelected }) => (
            <Space>
              <Button
                type="link"
                onClick={() => setBatchEditingItemIds([...selectedItemIds])}
              >
                批量调整执行（{selectedItemIds.length}）
              </Button>
              <Button
                type="link"
                onClick={() => {
                  onCleanSelected();
                  setSelectedItemIds([]);
                }}
              >
                取消选择
              </Button>
            </Space>
          )}
          scroll={{ x: 'max-content' }}
          columns={columns}
        />
      </section>

      <ModalForm<DeliveryLineFormValues>
        key={editingItem?.id ?? 'empty'}
        title={`调整本次出库明细${editingLineLabel ? `：${editingLineLabel}` : ''}`}
        open={Boolean(editingItem)}
        formRef={lineEditFormRef}
        modalProps={{ destroyOnHidden: true }}
        initialValues={
          editingItem
            ? {
                quantity: Number(editingItem.quantity),
                batchNo: editingItem.batchNo,
                locationId: editingItem.locationId,
                storageLocation: editingItem.storageLocationSnapshot,
                remarks: editingItem.remarks,
                customValues: getSaleDeliveryItemCustomValues(editingItem),
              }
            : undefined
        }
        onOpenChange={(open) => {
          if (!open) setEditingItem(undefined);
        }}
        submitter={{ searchConfig: { submitText: '保存明细' } }}
        onFinish={saveLineExecution}
      >
        <Typography.Paragraph type="secondary">
          保存仅更新本次出库明细草稿；库存会在单据列表“三点菜单”的“确认出库”中锁定并扣减。
        </Typography.Paragraph>
        <ProFormDigit
          name="quantity"
          label="本次出库数量"
          min={0.0001}
          fieldProps={{ precision: 4, step: 0.0001 }}
          rules={[{ required: true, message: '请输入大于 0 的本次出库数量' }]}
        />
        <ProFormText
          name="batchNo"
          label="批号"
          fieldProps={{ maxLength: 128 }}
          placeholder="启用批号追溯时按仓库规则填写"
        />
        <ProFormText name="locationId" hidden />
        <ProFormText name="storageLocation" hidden />
        <ProFormDependency name={['quantity', 'batchNo']}>
          {(values) => (
            <>
              {capabilities.renderStockLocationSelector({
                capabilities: capabilities.stockLocationCapabilities,
                action: 'stock/out',
                warehouseId: order.warehouseId,
                materialId: editingItem?.materialId,
                batchNo: getOptionalText(values.batchNo),
                minAvailableQty: getFiniteQuantity(values.quantity),
                value: typeof values.locationId === 'string' ? values.locationId : undefined,
                storageLocation: getOptionalText(values.storageLocation),
                onChange: (patch) => lineEditFormRef.current?.setFieldsValue(patch),
              })}
              {capabilities.renderStockBalancePreview({
                capabilities: capabilities.stockBalanceCapabilities,
                warehouseId: order.warehouseId,
                materialId: editingItem?.materialId,
                locationId: typeof values.locationId === 'string' ? values.locationId : undefined,
                storageLocation: getOptionalText(values.storageLocation),
                batchNo: getOptionalText(values.batchNo),
                requiredQty: getFiniteQuantity(values.quantity),
                mode: 'outbound',
              })}
            </>
          )}
        </ProFormDependency>
        <ProFormTextArea
          name="remarks"
          label="明细备注"
          fieldProps={{ rows: 3, maxLength: 1000 }}
        />
        <Row gutter={16}>
          {capabilities.renderLineCustomFieldFormItems({ schema: lineCustomFieldSchema, namePrefix: [], colSpan: 12 })}
        </Row>
      </ModalForm>

      <ModalForm<DeliveryBatchExecutionFormValues>
        key={batchEditingItemIds.join(':') || 'empty'}
        title={`批量调整本次出库明细（${batchEditingItems.length} 条）`}
        open={batchEditingItems.length > 0}
        formRef={batchLineEditFormRef}
        modalProps={{
          destroyOnHidden: true,
          ...SCROLLABLE_MODAL_PROPS,
          width: 980,
        }}
        initialValues={{
          items: batchEditingItems.map((item) => ({
            itemId: item.id,
            quantity: Number(item.quantity),
            batchNo: item.batchNo,
            locationId: item.locationId,
            storageLocation: item.storageLocationSnapshot,
            remarks: item.remarks,
            customValues: getSaleDeliveryItemCustomValues(item),
          })),
        }}
        onOpenChange={(open) => {
          if (!open) setBatchEditingItemIds([]);
        }}
        onFinish={saveBatchLineExecution}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="逐行填写每种物料的实际数量、批号、仓位和备注；保存时只更新已勾选行。库存仍在整单确认出库时扣减。"
        />
        <ProFormList<DeliveryLineExecutionPatch>
          name="items"
          creatorButtonProps={false}
          copyIconProps={false}
          deleteIconProps={false}
          alwaysShowItemLabel
          containerStyle={{ minWidth: 0, width: '100%' }}
          itemRender={({ listDom, action }) => (
            <div
              style={{
                alignItems: 'flex-start',
                display: 'flex',
                gap: 8,
                minWidth: 0,
                width: '100%',
              }}
            >
              <div style={{ flex: '1 1 auto', minWidth: 0 }}>{listDom}</div>
              {action ? (
                <div style={{ flex: '0 0 auto', paddingTop: 30 }}>{action}</div>
              ) : null}
            </div>
          )}
        >
          {(_field, index, action) => {
            const item = batchEditingItems[index];
            if (!item) return null;
            return (
              <>
                <ProFormText name="itemId" hidden />
                <ProFormText name="locationId" hidden />
                <ProFormText name="storageLocation" hidden />
                <Typography.Text strong>
                  {getDeliveryItemLabel(item)}
                </Typography.Text>
                <ProFormGroup
                  spaceProps={{
                    style: { width: '100%' },
                    wrap: true,
                  }}
                >
                  <ProFormDigit
                    name="quantity"
                    label="本次出库数量"
                    min={0.0001}
                    width={150}
                    fieldProps={{ precision: 4, step: 0.0001 }}
                    rules={[
                      {
                        required: true,
                        message: '请输入大于 0 的本次出库数量',
                      },
                    ]}
                  />
                  <ProFormText
                    name="batchNo"
                    label="批号"
                    width={180}
                    fieldProps={{ maxLength: 128 }}
                    placeholder="按追溯规则填写"
                  />
                </ProFormGroup>
                <ProFormDependency name={['quantity', 'batchNo']}>
                  {(values) => (
                    <>
                      {capabilities.renderStockLocationSelector({
                        capabilities: capabilities.stockLocationCapabilities,
                        action: 'stock/out',
                        warehouseId: order.warehouseId,
                        materialId: item.materialId,
                        batchNo: getOptionalText(values.batchNo),
                        minAvailableQty: getFiniteQuantity(values.quantity),
                        value: typeof values.locationId === 'string' ? values.locationId : undefined,
                        storageLocation: getOptionalText(values.storageLocation),
                        onChange: (patch) => action.setCurrentRowData({ ...action.getCurrentRowData(), ...patch }),
                      })}
                      {capabilities.renderStockBalancePreview({
                        capabilities: capabilities.stockBalanceCapabilities,
                        warehouseId: order.warehouseId,
                        materialId: item.materialId,
                        locationId: typeof values.locationId === 'string' ? values.locationId : undefined,
                        storageLocation: getOptionalText(values.storageLocation),
                        batchNo: getOptionalText(values.batchNo),
                        requiredQty: getFiniteQuantity(values.quantity),
                        mode: 'outbound',
                      })}
                    </>
                  )}
                </ProFormDependency>
                <ProFormTextArea
                  name="remarks"
                  label="明细备注"
                  fieldProps={{ rows: 2, maxLength: 1000 }}
                />
                <Row gutter={16}>
                  {capabilities.renderLineCustomFieldFormItems({ schema: lineCustomFieldSchema, namePrefix: ['items', _field.name], colSpan: 12 })}
                </Row>
              </>
            );
          }}
        </ProFormList>
      </ModalForm>
    </>
  );
}
