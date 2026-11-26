import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  DrawerForm,
  ProFormDatePicker,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DocumentLineCustomFieldFormItems } from '../documents/DocumentLineCustomFieldFormItems';
import { StockBalancePreview } from '../inventory/StockBalancePreview';
import { StockLocationInlineSelector } from '../inventory/StockLocationSelectField';
import type {
  PurchaseReturnEditDrawerProps,
  PurchaseReturnEditFormValues,
  PurchaseReturnSourceReceiptItem,
} from './purchase-return-edit-drawer-types';

type LineCustomValue = string | number | boolean | string[] | null | undefined;
type LineCustomValues = Record<string, LineCustomValue>;

function toLineCustomValues(
  value?: Record<string, unknown>,
): LineCustomValues | undefined {
  if (!value) return undefined;
  const result: LineCustomValues = {};
  for (const [key, rawValue] of Object.entries(value)) {
    if (
      rawValue === null ||
      rawValue === undefined ||
      typeof rawValue === 'string' ||
      typeof rawValue === 'number' ||
      typeof rawValue === 'boolean'
    ) {
      result[key] = rawValue;
      continue;
    }
    if (
      Array.isArray(rawValue) &&
      rawValue.every((item) => typeof item === 'string')
    ) {
      result[key] = rawValue;
    }
  }
  return result;
}

function calcReturnAmountFromSource(
  source: PurchaseReturnSourceReceiptItem | null | undefined,
  returnBaseQty: number,
): number | null {
  const amount = source?.amount;
  const baseQty = Number(source?.quantity ?? 0);
  if (amount === null || amount === undefined || !(baseQty > 0)) return null;
  return Number(amount) * (returnBaseQty / baseQty);
}

type EditFormValues = PurchaseReturnEditFormValues;

type DocumentLineCustomFieldCarrier = {
  customValues?: Record<string, unknown>;
};

/**
 * @sunxu-layer business
 * @sunxu-domain procurement
 * @sunxu-reason Presents reusable purchase return edit drawer behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function PurchaseReturnEditDrawer({
  detail,
  open,
  onClose,
  onSuccess,
  capabilities,
}: PurchaseReturnEditDrawerProps) {
  const [form] = Form.useForm<EditFormValues>();
  const [loading, setLoading] = useState(false);
  const lineCustomFieldSchema = capabilities.lineCustomFieldSchema;
  const watchedItems = Form.useWatch('items', form) ?? [];
  const watchedDeductions = Form.useWatch('deductionLines', form) ?? [];
  const watchedWarehouseId = Form.useWatch('outboundWarehouseId', form);
  const watchedFinancialAction = Form.useWatch('financialAction', form);
  const isIndependentReturn = !detail?.sourceReceiptId;
  const priceVisible =
    (detail?.priceVisible ?? false) && capabilities.canViewPrices;
  const sourceItemByReceiptItem = useMemo(
    () =>
      new Map(
        (detail?.items ?? []).map((item) => [
          item.sourceReceiptItemId,
          item.sourceReceiptItem,
        ]),
      ),
    [detail],
  );
  const editReturnAmount = (watchedItems as EditFormValues['items']).reduce(
    (sum, item) =>
      sum +
      (item?.sourceReceiptItemId
        ? (calcReturnAmountFromSource(
            sourceItemByReceiptItem.get(item.sourceReceiptItemId),
            Number(item.returnQty ?? 0),
          ) ?? 0)
        : (capabilities.calculateCommercialLineAmounts({
            quantity: item?.returnQty,
            unitPrice: item?.unitPrice,
            taxRate: item?.taxRate,
            priceIncludesTax: item?.priceIncludesTax,
          }).totalAmount ?? 0)),
    0,
  );
  const editDeductionTotal = (
    watchedDeductions as NonNullable<EditFormValues['deductionLines']>
  ).reduce((sum, line) => sum + Number(line?.amount ?? 0), 0);

  useEffect(() => {
    if (!open || !detail) return;
    form.setFieldsValue({
      supplierId: detail.supplierId ?? undefined,
      sourcePurchaseOrderId: detail.sourcePurchaseOrderId ?? undefined,
      outboundWarehouseId: detail.outboundWarehouseId ?? undefined,
      financialAction: detail.financialAction,
      returnDate: detail.returnDate ?? undefined,
      reasonCode: detail.reasonCode ?? undefined,
      remarks: detail.remarks ?? undefined,
      items: (detail.items ?? []).map((item) => {
        const customFieldCarrier = item as DocumentLineCustomFieldCarrier;
        return {
          id: item.id,
          materialLabel:
            item.material?.name ||
            item.sourceReceiptItem?.material?.name ||
            item.materialId ||
            undefined,
          materialId: item.materialId ?? undefined,
          sourceReceiptItemId: item.sourceReceiptItemId ?? undefined,
          returnQty: Number(item.returnQty ?? 0),
          ...(priceVisible
            ? {
                unitPrice:
                  item.unitPriceSnapshot === null ||
                  item.unitPriceSnapshot === undefined
                    ? undefined
                    : Number(item.unitPriceSnapshot),
                currency:
                  typeof item.sourceSnapshot?.currency === 'string'
                    ? item.sourceSnapshot.currency
                    : undefined,
                exchangeRate:
                  typeof item.sourceSnapshot?.exchangeRate === 'number'
                    ? item.sourceSnapshot.exchangeRate
                    : undefined,
                taxRate:
                  item.taxRateSnapshot === null ||
                  item.taxRateSnapshot === undefined
                    ? undefined
                    : Number(item.taxRateSnapshot),
                priceIncludesTax: item.priceIncludesTaxSnapshot ?? undefined,
              }
            : {}),
          batchNo: item.batchNo ?? undefined,
          locationId: item.locationId ?? undefined,
          storageLocation: item.storageLocationSnapshot ?? undefined,
          remarks: item.remarks ?? undefined,
          customValues: toLineCustomValues(customFieldCarrier.customValues),
        };
      }),
      deductionLines: priceVisible
        ? (detail.deductionLines ?? []).map((line) => ({
            deductionItemCode: line.deductionItemCode ?? undefined,
            basis: line.basis ?? undefined,
            amount: line.amount == null ? undefined : Number(line.amount),
            remarks: line.remarks ?? undefined,
          }))
        : undefined,
    });
  }, [detail, form, open, priceVisible]);

  const syncDeductionBasis = useCallback(
    (fieldName: number, itemCode: string | undefined) => {
      const nextBasis = capabilities.getNextDeductionBasisForItem(
        itemCode,
        form.getFieldValue(['deductionLines', fieldName, 'basis']),
      );
      if (nextBasis !== undefined) {
        form.setFieldValue(
          ['deductionLines', fieldName, 'basis'],
          nextBasis ?? undefined,
        );
      }
    },
    [capabilities, form],
  );

  const handleUpdate = async (values: EditFormValues) => {
    if (!detail) return false;
    const items = (values.items ?? []).filter(
      (item) =>
        Number(item.returnQty ?? 0) > 0 &&
        (item.sourceReceiptItemId || item.materialId),
    );
    if (items.length === 0) {
      capabilities.notifyWarning(capabilities.messages.itemsRequired);
      return false;
    }
    if (
      isIndependentReturn &&
      (!values.supplierId || !values.outboundWarehouseId)
    ) {
      capabilities.notifyWarning(
        capabilities.messages.independentSupplierWarehouseRequired,
      );
      return false;
    }
    const financialAction = values.financialAction ?? detail.financialAction;
    if (!priceVisible && isIndependentReturn && financialAction !== 'none') {
      capabilities.notifyWarning(capabilities.messages.pricePermissionRequired);
      return false;
    }
    if (
      financialAction !== 'none' &&
      items.some(
        (item) =>
          !item.sourceReceiptItemId &&
          (item.unitPrice === undefined ||
            item.unitPrice === null ||
            Number(item.unitPrice) <= 0 ||
            !item.currency ||
            item.exchangeRate === undefined ||
            Number(item.exchangeRate) <= 0 ||
            item.taxRate === undefined ||
            item.priceIncludesTax === undefined),
      )
    ) {
      capabilities.notifyWarning(
        capabilities.messages.financialItemPricesRequired,
      );
      return false;
    }

    const deductionLines = priceVisible
      ? (values.deductionLines ?? [])
          .filter(
            (line) => line?.deductionItemCode && Number(line?.amount ?? 0) > 0,
          )
          .map((line) => ({
            deductionItemCode: line.deductionItemCode as string,
            amount: Number(line.amount),
            basis: line.basis?.trim() || undefined,
            remarks: line.remarks?.trim() || undefined,
          }))
      : undefined;
    if (deductionLines && deductionLines.length > 0) {
      const deductionTotal = deductionLines.reduce(
        (sum, line) => sum + line.amount,
        0,
      );
      const returnAmount = items.reduce(
        (sum, item) =>
          sum +
          (item.sourceReceiptItemId
            ? (calcReturnAmountFromSource(
                sourceItemByReceiptItem.get(item.sourceReceiptItemId),
                Number(item.returnQty ?? 0),
              ) ?? 0)
            : (capabilities.calculateCommercialLineAmounts({
                quantity: item.returnQty,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate,
                priceIncludesTax: item.priceIncludesTax,
              }).totalAmount ?? 0)),
        0,
      );
      if (deductionTotal - returnAmount > 0.005) {
        capabilities.notifyWarning(
          capabilities.messages.deductionExceedsReturn,
        );
        return false;
      }
    }

    setLoading(true);
    try {
      await capabilities.update({
        id: detail.id,
        sourceReceiptId: detail.sourceReceiptId ?? undefined,
        supplierId: values.supplierId || undefined,
        sourcePurchaseOrderId: values.sourcePurchaseOrderId || undefined,
        returnType: detail.returnType,
        outboundWarehouseId: values.outboundWarehouseId || undefined,
        returnDate: capabilities.normalizeDateOnlyValue(values.returnDate),
        reasonCode: values.reasonCode || undefined,
        inspectionRequired: detail.inspectionRequired,
        financialAction,
        remarks: values.remarks?.trim() || undefined,
        items: items.map((item) => ({
          id: item.id || undefined,
          sourceReceiptItemId: item.sourceReceiptItemId || undefined,
          materialId: item.materialId || undefined,
          returnQty: Number(item.returnQty),
          ...(priceVisible
            ? {
                unitPrice:
                  item.unitPrice === undefined || item.unitPrice === null
                    ? undefined
                    : Number(item.unitPrice),
                currency: item.currency?.trim() || undefined,
                exchangeRate:
                  item.exchangeRate === undefined || item.exchangeRate === null
                    ? undefined
                    : Number(item.exchangeRate),
                taxRate:
                  item.taxRate === undefined || item.taxRate === null
                    ? undefined
                    : Number(item.taxRate),
                priceIncludesTax: item.priceIncludesTax,
              }
            : {}),
          batchNo: item.batchNo?.trim() || undefined,
          locationId: item.locationId || undefined,
          storageLocation: item.storageLocation?.trim() || undefined,
          remarks: item.remarks?.trim() || undefined,
          ...(capabilities.buildLineCustomValuePayload(
            item,
            lineCustomFieldSchema,
          ) ?? {}),
        })),
        ...(priceVisible ? { deductionLines } : {}),
      });
      capabilities.notifySuccess(capabilities.messages.updateSuccess);
      onClose();
      await onSuccess?.();
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrawerForm<EditFormValues>
      title="编辑"
      form={form}
      open={open}
      width={920}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      onFinish={handleUpdate}
      submitter={{
        searchConfig: { submitText: '保存', resetText: '取消' },
        submitButtonProps: { loading },
      }}
      drawerProps={{ destroyOnHidden: true }}
    >
      <Row gutter={12}>
        {isIndependentReturn ? (
          <>
            <Col span={8}>
              {capabilities.renderConfiguredSelect({
                name: 'supplierId',
                label: '供应商',
                configTarget: 'supplier',
                request: capabilities.requestActiveSuppliers,
                showSearch: true,
                debounceTime: 300,
                fieldProps: { filterOption: false },
                rules: [{ required: true, message: '请选择供应商' }],
                onOpenConfig: () => capabilities.openConfigEntry('supplier'),
              })}
            </Col>
            <Col span={8}>
              {capabilities.renderConfiguredSelect({
                name: 'outboundWarehouseId',
                label: '退库仓库',
                configTarget: 'warehouse',
                request: capabilities.requestNonLineSideWarehouses,
                showSearch: true,
                debounceTime: 300,
                fieldProps: { filterOption: false },
                rules: [{ required: true, message: '请选择退库仓库' }],
                onOpenConfig: () => capabilities.openConfigEntry('warehouse'),
              })}
            </Col>
            <Col span={8}>
              {capabilities.renderConfiguredSelect({
                name: 'sourcePurchaseOrderId',
                label: '来源采购订单',
                configTarget: 'purchaseOrders',
                onOpenConfig: () => capabilities.openConfigEntry('purchaseOrders'),
                showSearch: true,
                debounceTime: 300,
                fieldProps: { filterOption: false, allowClear: true },
                request: async (params) => {
                  const response = await capabilities.requestPurchaseOrders({
                    keyword:
                      typeof params?.keyWords === 'string'
                        ? params.keyWords
                        : undefined,
                    page: 1,
                    pageSize: 20,
                  });
                  return (response?.list ?? []).map((order) => ({
                    label: `${order.orderNo}${
                      order.supplier?.name ? ` / ${order.supplier.name}` : ''
                    }`,
                    value: order.id,
                  }));
                },
              })}
            </Col>
          </>
        ) : null}
        <Col span={8}>
          <ProFormDatePicker
            name="returnDate"
            label="申请日期"
            rules={[{ required: true, message: '请选择申请日期' }]}
            fieldProps={{
              allowClear: false,
              disabledDate: (date: Dayjs) =>
                date.isAfter(dayjs(), 'day') ||
                Boolean(
                  detail?.sourceReceipt?.receiptDate &&
                    date.isBefore(
                      dayjs(detail.sourceReceipt.receiptDate),
                      'day',
                    ),
                ),
            }}
          />
        </Col>
        <Col span={8}>
          {isIndependentReturn ? (
            <ProFormSelect
              name="financialAction"
              label="财务动作"
              options={[...capabilities.financialActionOptions]}
              disabled={!priceVisible}
            />
          ) : null}
        </Col>
        <Col span={8}>
          {capabilities.renderReasonField({
            name: 'reasonCode',
            label: '退货原因',
            typeCode: 'purchase_return_reason',
            rules: [{ required: true, message: '请选择退货原因' }],
            onOpenConfig: () => capabilities.openConfigEntry('dictionary'),
          })}
        </Col>
        <Col span={8}>
          <ProFormText
            name="remarks"
            label="备注"
            fieldProps={{ maxLength: 1000 }}
          />
        </Col>
      </Row>
      {isIndependentReturn && watchedFinancialAction === 'none' ? (
        <Alert
          type="warning"
          showIcon
          message="风险操作：不处理财务不会生成应付冲减或退款记录。请确认已由其他业务单据处理，避免货款账实不符。"
          style={{ marginBottom: 12 }}
        />
      ) : null}
      <Form.List name="items">
        {(fields, { remove }) => (
          <>
            {fields.map((field) => (
              <Card
                key={field.key}
                size="small"
                style={{ marginBottom: 12 }}
                title={`明细 ${field.name + 1}`}
                extra={
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    disabled={fields.length <= 1}
                    onClick={() => remove(field.name)}
                  >
                    删除
                  </Button>
                }
              >
                <Form.Item name={[field.name, 'id']} hidden>
                  <Input />
                </Form.Item>
                <Form.Item name={[field.name, 'sourceReceiptItemId']} hidden>
                  <Input />
                </Form.Item>
                <Form.Item name={[field.name, 'materialId']} hidden>
                  <Input />
                </Form.Item>
                <Form.Item name={[field.name, 'locationId']} hidden>
                  <Input />
                </Form.Item>
                <Row gutter={12}>
                  <Col span={8}>
                    <Form.Item
                      label="物料"
                      name={[field.name, 'materialLabel']}
                    >
                      <Input disabled />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      label="申请退货"
                      name={[field.name, 'returnQty']}
                      rules={[
                        { required: true, message: '请输入申请退货数量' },
                        {
                          type: 'number',
                          min: 0.0001,
                          message: '申请退货数量必须大于0',
                        },
                      ]}
                    >
                      <InputNumber
                        min={0.0001}
                        precision={4}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  {isIndependentReturn && priceVisible ? (
                    <>
                      <Col span={4}>
                        <Form.Item
                          label="单价（基础单位）"
                          name={[field.name, 'unitPrice']}
                          rules={[
                            ({ getFieldValue }) => ({
                              validator: async (_rule, value) => {
                                const action = getFieldValue('financialAction');
                                if (
                                  action !== 'none' &&
                                  (value === undefined ||
                                    value === null ||
                                    Number(value) <= 0)
                                ) {
                                  throw new Error(
                                    '冲减应付或退款时必须填写单价',
                                  );
                                }
                              },
                            }),
                          ]}
                        >
                          <InputNumber
                            min={0.000001}
                            precision={6}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        {capabilities.renderDictionaryFormItem({
                          typeCode: 'currency',
                          name: [field.name, 'currency'],
                          label: '币别',
                          onOpenConfig: () => capabilities.openConfigEntry('dictionary'),
                          rules: [
                            ({ getFieldValue }) => ({
                              validator: async (_rule, value) => {
                                if (getFieldValue('financialAction') === 'none')
                                  return;
                                if (!value) throw new Error('请选择币别');
                              },
                            }),
                          ],
                          children: (
                            <Select
                              placeholder="请选择"
                              showSearch
                              optionFilterProp="label"
                            />
                          ),
                        })}
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          name={[field.name, 'exchangeRate']}
                          label="汇率"
                          rules={[
                            ({ getFieldValue }) => ({
                              validator: async (_rule, value) => {
                                if (getFieldValue('financialAction') === 'none')
                                  return;
                                if (
                                  value === undefined ||
                                  value === null ||
                                  Number(value) <= 0
                                ) {
                                  throw new Error('请输入大于 0 的汇率');
                                }
                              },
                            }),
                          ]}
                        >
                          <InputNumber
                            min={0.00000001}
                            precision={8}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          name={[field.name, 'taxRate']}
                          label="税率（%）"
                          rules={[
                            ({ getFieldValue }) => ({
                              validator: async (_rule, value) => {
                                if (getFieldValue('financialAction') === 'none')
                                  return;
                                if (value === undefined || value === null) {
                                  throw new Error('请输入税率，可填 0');
                                }
                              },
                            }),
                          ]}
                        >
                          <InputNumber
                            min={0}
                            max={100}
                            precision={4}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          name={[field.name, 'priceIncludesTax']}
                          label="单价含税"
                          rules={[
                            ({ getFieldValue }) => ({
                              validator: async (_rule, value) => {
                                if (getFieldValue('financialAction') === 'none')
                                  return;
                                if (value === undefined || value === null) {
                                  throw new Error('请选择含税口径');
                                }
                              },
                            }),
                          ]}
                        >
                          <Select
                            options={[
                              { label: '含税', value: true },
                              { label: '未税', value: false },
                            ]}
                            placeholder="请选择"
                          />
                        </Form.Item>
                      </Col>
                    </>
                  ) : null}
                  <Col span={5}>
                    <Form.Item label="批号" name={[field.name, 'batchNo']}>
                      <Input maxLength={128} />
                    </Form.Item>
                  </Col>
                  <Col span={7}>
                    <Form.Item
                      label="存放位置"
                      name={[field.name, 'storageLocation']}
                    >
                      <Input maxLength={1000} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label="备注" name={[field.name, 'remarks']}>
                      <Input maxLength={1000} />
                    </Form.Item>
                  </Col>
                  {isIndependentReturn ? (
                    <Col span={24}>
                      <Form.Item noStyle shouldUpdate>
                        {() => {
                          const item = form.getFieldValue([
                            'items',
                            field.name,
                          ]) as EditFormValues['items'][number] | undefined;
                          return (
                            <Row gutter={12}>
                              <Col span={12}>
                                <StockLocationInlineSelector
                                  capabilities={capabilities.stockLocation}
                                  action="stock/out"
                                  warehouseId={watchedWarehouseId}
                                  materialId={item?.materialId}
                                  batchNo={item?.batchNo}
                                  minAvailableQty={
                                    Number(item?.returnQty) || undefined
                                  }
                                  value={item?.locationId}
                                  storageLocation={item?.storageLocation}
                                  onChange={(patch) =>
                                    form.setFieldsValue({
                                      items: (
                                        form.getFieldValue('items') ?? []
                                      ).map(
                                        (
                                          currentItem: EditFormValues['items'][number],
                                          index: number,
                                        ) =>
                                          index === field.name
                                            ? { ...currentItem, ...patch }
                                            : currentItem,
                                      ),
                                    })
                                  }
                                />
                              </Col>
                              <Col span={12}>
                                <StockBalancePreview
                                  capabilities={capabilities.stockBalancePreview}
                                  warehouseId={watchedWarehouseId}
                                  materialId={item?.materialId}
                                  locationId={item?.locationId}
                                  storageLocation={item?.storageLocation}
                                  batchNo={item?.batchNo}
                                  requiredQty={
                                    Number(item?.returnQty) || undefined
                                  }
                                  mode="outbound"
                                />
                              </Col>
                            </Row>
                          );
                        }}
                      </Form.Item>
                    </Col>
                  ) : null}
                  <DocumentLineCustomFieldFormItems
                    schema={lineCustomFieldSchema}
                    namePrefix={['items', field.name]}
                  />
                </Row>
              </Card>
            ))}
          </>
        )}
      </Form.List>

      {priceVisible ? (
        <Card
          size="small"
          title="扣减项（协商扣款，可选）"
          style={{ marginBottom: 12 }}
        >
          <Form.List name="deductionLines">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Row gutter={12} key={field.key} align="top">
                    <Col span={6}>
                      {capabilities.renderDictionaryFormItem({
                        typeCode: 'deduction_item',
                        showConfigEntry: field.name === 0,
                        label: field.name === 0 ? '扣款项目' : '',
                        name: [field.name, 'deductionItemCode'],
                        onOpenConfig: () => capabilities.openConfigEntry('dictionary'),
                        rules: [{ required: true, message: '请选择扣款项目' }],
                        children: (
                          <Select
                            placeholder="选择扣款项目"
                            showSearch
                            optionFilterProp="label"
                            allowClear
                            onChange={(value?: string) =>
                              syncDeductionBasis(field.name, value)
                            }
                          />
                        ),
                      })}
                    </Col>
                    <Col span={7}>
                      <Form.Item
                        label={field.name === 0 ? '计算依据' : ''}
                        name={[field.name, 'basis']}
                      >
                        <Input
                          maxLength={256}
                          placeholder="如：开模费/物流费不可退"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        label={field.name === 0 ? '金额' : ''}
                        name={[field.name, 'amount']}
                        rules={[
                          { required: true, message: '请输入扣款金额' },
                          {
                            type: 'number',
                            min: 0.01,
                            message: '扣款金额必须大于0',
                          },
                        ]}
                      >
                        <InputNumber
                          min={0.01}
                          precision={2}
                          placeholder="0.00"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item
                        label={field.name === 0 ? '备注' : ''}
                        name={[field.name, 'remarks']}
                      >
                        <Input maxLength={1000} />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item label={field.name === 0 ? ' ' : ''}>
                        <Button
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => add({})}
                >
                  添加扣款行
                </Button>
                <div style={{ marginTop: 12, textAlign: 'right' }}>
                  <span style={{ marginRight: 16 }}>
                    退货金额：{editReturnAmount.toFixed(2)}
                  </span>
                  <span style={{ marginRight: 16 }}>
                    扣款合计：{editDeductionTotal.toFixed(2)}
                  </span>
                  <strong
                    style={{
                      color:
                        editDeductionTotal > editReturnAmount
                          ? '#ff4d4f'
                          : undefined,
                    }}
                  >
                    实退：{(editReturnAmount - editDeductionTotal).toFixed(2)}
                  </strong>
                </div>
              </>
            )}
          </Form.List>
        </Card>
      ) : null}
    </DrawerForm>
  );
}
