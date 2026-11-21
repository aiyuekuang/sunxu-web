import { Card, Col, Form, Input, InputNumber, Row, Select } from 'antd';
import { useEffect, useState } from 'react';
import { DocumentModalForm } from './DocumentModalForm';
import type {
  SaleReturnReceiveFormValues,
  SaleReturnReceiveModalProps,
} from './sale-return-components-types';

/** @sunxu-component mes-specific @sunxu-domain sales-return-receiving @sunxu-reason Keeps per-line receive quantities, disposition, batch tracking and location notes while the host supplies the receiving API and success feedback. */
export function SaleReturnReceiveModal({
  detail,
  open,
  onClose,
  onSuccess,
  capabilities,
}: SaleReturnReceiveModalProps) {
  const [form] = Form.useForm<SaleReturnReceiveFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const watchedItems = Form.useWatch('items', form) ?? [];
  const receiveDispositionOptions = capabilities.dispositionOptions.filter(
    (option) => option.value !== 'pending',
  );

  useEffect(() => {
    if (!open || !detail) return;
    form.setFieldsValue({
      items: (detail.items ?? []).map((item) => ({
        id: item.id,
        receivedQty:
          Number(item.receivedQty ?? 0) > 0
            ? Number(item.receivedQty)
            : Number(item.returnQty ?? 0),
        disposition: item.disposition ?? 'resellable',
        batchNo: item.batchNo ?? undefined,
        storageLocation: item.storageLocationSnapshot ?? undefined,
        remarks: item.remarks ?? undefined,
      })),
    });
  }, [detail, form, open]);

  return (
    <DocumentModalForm<SaleReturnReceiveFormValues>
      title="确认退货收货"
      open={open}
      width={860}
      form={form}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      submitter={{ searchConfig: { submitText: '确认收货' } }}
      onFinish={async (values) => {
        if (!detail || submitting) return false;
        setSubmitting(true);
        try {
          await capabilities.receive({
            id: detail.id,
            items: (values.items ?? []).map((item) => ({
              id: item.id,
              receivedQty: item.receivedQty,
              disposition: item.disposition || undefined,
              batchNo: item.batchNo?.trim() || undefined,
              storageLocation: item.storageLocation?.trim() || undefined,
              remarks: item.remarks?.trim() || undefined,
            })),
          });
          capabilities.notifySuccess(capabilities.receiveSuccessMessage);
          onClose();
          await onSuccess?.();
          return true;
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div>
        <Form.List name="items">
          {(fields) => (
            <>
              {fields.map((field) => {
                const item = detail?.items?.[field.name];
                const watchedItem = watchedItems[field.name];
                const returnQty = Number(item?.returnQty ?? 0);
                const receivedQty = Number(
                  watchedItem?.receivedQty ?? item?.receivedQty ?? returnQty,
                );
                const disposition =
                  watchedItem?.disposition ?? item?.disposition ?? 'resellable';
                const hasBatchTracking =
                  item?.material?.hasBatchTracking ??
                  item?.sourceDeliveryItem?.material?.hasBatchTracking ??
                  false;
                const batchRequired =
                  hasBatchTracking &&
                  receivedQty > 0 &&
                  disposition !== 'reject_to_customer';

                return (
                  <Card
                    key={field.key}
                    size="small"
                    style={{ marginBottom: 12 }}
                    title={
                      item?.material?.name ||
                      item?.sourceDeliveryItem?.material?.name ||
                      item?.materialId ||
                      '退货明细'
                    }
                  >
                    <Form.Item name={[field.name, 'id']} hidden>
                      <Input />
                    </Form.Item>
                    <Row gutter={12}>
                      <Col span={6}>
                        <Form.Item
                          label="处置方式"
                          name={[field.name, 'disposition']}
                          rules={[
                            { required: true, message: '请选择处置方式' },
                          ]}
                        >
                          <Select
                            options={receiveDispositionOptions}
                            placeholder="请选择"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          label={`实收数量 / 申请 ${returnQty}`}
                          name={[field.name, 'receivedQty']}
                          rules={[
                            { required: true, message: '请输入实收数量' },
                            {
                              type: 'number',
                              min: 0,
                              max: returnQty,
                              message: '实收数量不能小于0且不超过申请数量',
                            },
                          ]}
                        >
                          <InputNumber
                            min={0}
                            max={returnQty}
                            precision={4}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          label={batchRequired ? '批号（必填）' : '批号'}
                          name={[field.name, 'batchNo']}
                          rules={
                            batchRequired
                              ? [
                                  {
                                    required: true,
                                    message: '该物料需填写批号',
                                  },
                                ]
                              : []
                          }
                        >
                          <Input maxLength={128} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          label="存放位置"
                          name={[field.name, 'storageLocation']}
                        >
                          <Input maxLength={1000} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="备注" name={[field.name, 'remarks']}>
                          <Input maxLength={1000} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                );
              })}
            </>
          )}
        </Form.List>
      </div>
    </DocumentModalForm>
  );
}
