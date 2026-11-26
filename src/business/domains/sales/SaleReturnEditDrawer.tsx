import { DeleteOutlined } from '@ant-design/icons';
import {
  DrawerForm,
  ProFormDatePicker,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DocumentLineCustomFieldFormItems } from '../documents/DocumentLineCustomFieldFormItems';
import type {
  SaleReturnEditDrawerProps,
  SaleReturnEditFormValues,
  SaleReturnLineCustomFormValues,
  SaleReturnUpdateDeductionPayload,
  SaleReturnUpdateItemPayload,
} from './sale-return-components-types';

/** @sunxu-layer business @sunxu-domain sales @sunxu-reason Preserves source-linked and manual return editing, negotiated prices, deductions, custom line fields and validations while the host supplies update, dictionary, schema and feedback capabilities.*/
export function SaleReturnEditDrawer({
  detail,
  open,
  onClose,
  onSuccess,
  capabilities,
}: SaleReturnEditDrawerProps) {
  const [form] = Form.useForm<SaleReturnEditFormValues>();
  const [loading, setLoading] = useState(false);
  const lineCustomFieldSchema = capabilities.lineCustomFieldSchema;
  const watchedItems =
    (Form.useWatch('items', form) ?? []) as SaleReturnEditFormValues['items'];
  const watchedDeductions = (Form.useWatch('deductionLines', form) ??
    []) as NonNullable<SaleReturnEditFormValues['deductionLines']>;
  const unitPriceByDeliveryItem = useMemo(
    () =>
      new Map(
        (detail?.items ?? []).map((item) => [
          item.sourceDeliveryItemId ?? item.id,
          Number(item.unitPriceSnapshot ?? 0),
        ]),
      ),
    [detail],
  );
  const editReturnAmount = watchedItems.reduce(
    (sum, item) =>
      sum +
      Number(item?.returnQty ?? 0) *
        Number(
          item?.unitPrice ??
            unitPriceByDeliveryItem.get(
              item?.sourceDeliveryItemId ?? item?.id ?? '',
            ) ??
            0,
        ),
    0,
  );
  const editDeductionTotal = watchedDeductions.reduce(
    (sum, line) => sum + Number(line?.amount ?? 0),
    0,
  );

  useEffect(() => {
    if (!open || !detail) return;
    form.setFieldsValue({
      receiveDate: detail.receiveDate ?? undefined,
      reasonCode: detail.reasonCode ?? undefined,
      financialAction:
        detail.financialAction === 'receivable_offset'
          ? 'credit_note'
          : detail.financialAction ?? 'none',
      remarks: detail.remarks ?? undefined,
      items: (detail.items ?? []).map((item) => ({
        id: item.id,
        materialLabel:
          item.material?.name ||
          item.sourceDeliveryItem?.material?.name ||
          item.materialId,
        materialId: item.materialId,
        sourceDeliveryItemId: item.sourceDeliveryItemId ?? undefined,
        returnQty: Number(item.returnQty ?? 0),
        unitPrice:
          item.unitPriceSnapshot == null
            ? undefined
            : Number(item.unitPriceSnapshot),
        batchNo: item.batchNo ?? undefined,
        locationId: item.locationId ?? undefined,
        storageLocation: item.storageLocationSnapshot ?? undefined,
        disposition: item.disposition ?? undefined,
        financialAction:
          item.financialAction === 'receivable_offset'
            ? 'credit_note'
            : item.financialAction ?? undefined,
        customValues: toLineCustomFormValues(item.customValues),
        remarks: item.remarks ?? undefined,
      })),
      deductionLines: (detail.deductionLines ?? []).map((line) => ({
        deductionItemCode: line.deductionItemCode,
        basis: line.basis ?? undefined,
        amount: Number(line.amount ?? 0),
        remarks: line.remarks ?? undefined,
      })),
    });
  }, [detail, form, open]);

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

  const handleUpdate = async (values: SaleReturnEditFormValues) => {
    if (!detail) return false;
    const isSourceLinked = Boolean(detail.sourceDeliveryId);
    const items = (values.items ?? []).filter(
      (item) =>
        (isSourceLinked ? item.sourceDeliveryItemId : item.materialId) &&
        Number(item.returnQty ?? 0) > 0,
    );
    if (items.length === 0) {
      capabilities.notifyWarning(capabilities.messages.itemsRequired);
      return false;
    }
    if (
      !isSourceLinked &&
      detail.priceVisible &&
      (values.financialAction ?? detail.financialAction) === 'credit_note' &&
      items.some((item) => item.unitPrice == null)
    ) {
      capabilities.notifyWarning(
        capabilities.messages.manualCreditUnitPriceRequired,
      );
      return false;
    }

    const deductionLines: SaleReturnUpdateDeductionPayload[] = (
      values.deductionLines ?? []
    ).flatMap((line) => {
      const deductionItemCode = line?.deductionItemCode;
      const amount = Number(line?.amount ?? 0);
      if (!deductionItemCode || !(amount > 0)) return [];
      return [
        {
          deductionItemCode,
          amount,
          basis: line.basis?.trim() || undefined,
          remarks: line.remarks?.trim() || undefined,
        },
      ];
    });

    if (detail.priceVisible && deductionLines.length > 0) {
      if (
        !isSourceLinked &&
        (values.financialAction ?? detail.financialAction) !== 'credit_note'
      ) {
        capabilities.notifyWarning(
          capabilities.messages.deductionRequiresCredit,
        );
        return false;
      }
      const deductionTotal = deductionLines.reduce(
        (sum, line) => sum + line.amount,
        0,
      );
      const returnAmount = items.reduce(
        (sum, item) =>
          sum +
          Number(item.returnQty ?? 0) *
            Number(
              item.unitPrice ??
                (item.sourceDeliveryItemId
                  ? unitPriceByDeliveryItem.get(item.sourceDeliveryItemId)
                  : 0) ??
                0,
            ),
        0,
      );
      if (deductionTotal - returnAmount > 0.005) {
        capabilities.notifyWarning(
          capabilities.messages.deductionExceedsReturn,
        );
        return false;
      }
    }

    const payloadItems: SaleReturnUpdateItemPayload[] = items.map((item) => ({
      id: item.id,
      ...(isSourceLinked
        ? { sourceDeliveryItemId: item.sourceDeliveryItemId }
        : { materialId: item.materialId }),
      returnQty: Number(item.returnQty),
      ...(!isSourceLinked &&
      detail.priceVisible &&
      item.unitPrice !== undefined
        ? { unitPrice: Number(item.unitPrice) }
        : {}),
      batchNo: item.batchNo?.trim() || undefined,
      locationId: item.locationId || undefined,
      storageLocation: item.storageLocation?.trim() || undefined,
      disposition: item.disposition,
      financialAction: item.financialAction,
      remarks: item.remarks?.trim() || undefined,
      ...(capabilities.buildLineCustomValuePayload(
        item,
        lineCustomFieldSchema,
      ) ?? {}),
    }));

    setLoading(true);
    try {
      await capabilities.update({
        id: detail.id,
        sourceDeliveryId: detail.sourceDeliveryId ?? undefined,
        customerId: detail.customerId ?? undefined,
        receiveWarehouseId: detail.receiveWarehouseId ?? undefined,
        reasonCode: values.reasonCode?.trim() || undefined,
        ...(detail.priceVisible
          ? {
              financialAction: values.financialAction ?? detail.financialAction,
            }
          : {}),
        remarks: values.remarks?.trim() || undefined,
        items: payloadItems,
        ...(detail.priceVisible ? { deductionLines } : {}),
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

  const financialActionOptions = capabilities.financialActionOptions.filter(
    (option) =>
      option.value !== 'refund' && option.value !== 'receivable_offset',
  );

  return (
    <DrawerForm<SaleReturnEditFormValues>
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
        <Col span={6}>
          <ProFormDatePicker name="receiveDate" label="收货日期" />
        </Col>
        <Col span={6}>
          {capabilities.renderReasonField({
            name: 'reasonCode',
            label: '退货原因',
            typeCode: 'sale_return_reason',
            rules: [{ required: true, message: '请选择退货原因' }],
          })}
        </Col>
        {detail?.priceVisible ? (
          <Col span={6}>
            <ProFormSelect
              name="financialAction"
              label="财务动作"
              options={financialActionOptions}
              tooltip="生成贷项后，可在财务单据中选择核销或登记实际退款。普通实物退货可选择不处理财务。"
              fieldProps={{ allowClear: false }}
            />
          </Col>
        ) : (
          <Form.Item name="financialAction" hidden>
            <Input />
          </Form.Item>
        )}
        <Col span={6}>
          <ProFormText
            name="remarks"
            label="备注"
            fieldProps={{ maxLength: 1000 }}
          />
        </Col>
      </Row>
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
                    htmlType="button"
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
                <Form.Item name={[field.name, 'materialId']} hidden>
                  <Input />
                </Form.Item>
                <Form.Item name={[field.name, 'sourceDeliveryItemId']} hidden>
                  <Input />
                </Form.Item>
                <Form.Item name={[field.name, 'locationId']} hidden>
                  <Input />
                </Form.Item>
                <Form.Item name={[field.name, 'disposition']} hidden>
                  <Input />
                </Form.Item>
                <Form.Item name={[field.name, 'financialAction']} hidden>
                  <Input />
                </Form.Item>
                <Row gutter={12}>
                  <Col
                    span={detail?.priceVisible && !detail.sourceDeliveryId ? 6 : 8}
                  >
                    <Form.Item
                      label="物料"
                      name={[field.name, 'materialLabel']}
                    >
                      <Input disabled />
                    </Form.Item>
                  </Col>
                  <Col
                    span={detail?.priceVisible && !detail.sourceDeliveryId ? 3 : 4}
                  >
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
                  {detail?.priceVisible && !detail.sourceDeliveryId ? (
                    <Col span={4}>
                      <Form.Item
                        label="协商含税退货单价"
                        name={[field.name, 'unitPrice']}
                      >
                        <InputNumber
                          min={0}
                          precision={4}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                  ) : null}
                  <Col
                    span={detail?.priceVisible && !detail.sourceDeliveryId ? 4 : 5}
                  >
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
      {detail?.priceVisible ? (
        <Card size="small" title="扣减项（协商扣款，可选）">
          <Form.List name="deductionLines">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Row gutter={12} key={field.key} align="top">
                    <Col span={6}>
                      {capabilities.renderDeductionItemField({
                        name: [field.name, 'deductionItemCode'],
                        label: field.name === 0 ? '扣款项目' : '',
                        typeCode: 'deduction_item',
                        showConfigEntry: field.name === 0,
                        rules: [
                          { required: true, message: '请选择扣款项目' },
                        ],
                        onChange: (value) =>
                          syncDeductionBasis(field.name, value),
                      })}
                    </Col>
                    <Col span={7}>
                      <Form.Item
                        label={field.name === 0 ? '计算依据' : ''}
                        name={[field.name, 'basis']}
                      >
                        <Input
                          maxLength={256}
                          placeholder="如：专用材料不可回用"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        label={field.name === 0 ? '金额' : ''}
                        name={[field.name, 'amount']}
                        rules={[
                          { required: true, message: '请输入扣款金额' },
                        ]}
                      >
                        <InputNumber
                          min={0.01}
                          precision={2}
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
                          htmlType="button"
                          icon={<DeleteOutlined />}
                          aria-label={`删除第 ${field.name + 1} 条扣款`}
                          onClick={() => remove(field.name)}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  htmlType="button"
                  block
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
                  <strong>
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

function toLineCustomFormValues(
  value: unknown,
): SaleReturnLineCustomFormValues | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined;
  const result: SaleReturnLineCustomFormValues = {};
  for (const [key, fieldValue] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (
      typeof fieldValue === 'string' ||
      typeof fieldValue === 'number' ||
      typeof fieldValue === 'boolean' ||
      fieldValue === null ||
      (Array.isArray(fieldValue) &&
        fieldValue.every((item) => typeof item === 'string'))
    ) {
      result[key] = fieldValue as SaleReturnLineCustomFormValues[string];
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
