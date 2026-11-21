import {
  Alert,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { DocumentModalForm } from './DocumentModalForm';
import { StockBalancePreview } from './StockBalancePreview';
import { StockBusinessDateField } from './StockBusinessDateField';
import { StockLocationInlineSelector } from './StockLocationSelectField';
import type {
  PurchaseReturnOutboundFormValues,
  PurchaseReturnOutboundModalProps,
} from './purchase-return-outbound-modal-types';

/**
 * @sunxu-component mes-specific
 * @sunxu-domain purchasing return inventory outbound
 * @sunxu-reason Preserves return outbound quantity, batch/location, stock preview, and refund-date rules while the MES host supplies account data, authorization-aware inventory capabilities, date normalization, and submission.
 *
 * Collects stock-out details for a purchase return. The host remains the
 * authority for the return service, available accounts, and inventory policy.
 */
export function PurchaseReturnOutboundModal({
  detail,
  open,
  onClose,
  onSuccess,
  capabilities,
}: PurchaseReturnOutboundModalProps) {
  const [form] = Form.useForm<PurchaseReturnOutboundFormValues>();
  const [fundAccountOptions, setFundAccountOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const watchedItems = Form.useWatch('items', form) ?? [];
  const watchedBusinessDate = Form.useWatch('businessDate', form);
  const watchedRefundDate = Form.useWatch('refundDate', form);
  const needRefundAccount = detail?.financialAction === 'refund';

  useEffect(() => {
    if (!open || !detail) return;
    const initialBusinessDate = dayjs();
    form.setFieldsValue({
      businessDate: initialBusinessDate,
      refundAccountId: undefined,
      refundDate:
        detail.financialAction === 'refund' ? initialBusinessDate : undefined,
      items: (detail.items ?? []).map((item) => ({
        id: item.id,
        outboundQty:
          Number(item.outboundQty ?? 0) > 0
            ? Number(item.outboundQty)
            : Number(item.returnQty ?? 0),
        batchNo: item.batchNo ?? undefined,
        locationId: item.locationId ?? undefined,
        storageLocation: item.storageLocationSnapshot ?? undefined,
        remarks: item.remarks ?? undefined,
      })),
    });
  }, [detail, form, open]);

  useEffect(() => {
    if (
      !needRefundAccount ||
      !watchedBusinessDate ||
      !watchedRefundDate ||
      !watchedRefundDate.isBefore(watchedBusinessDate, 'day')
    ) {
      return;
    }
    form.setFieldValue('refundDate', watchedBusinessDate);
  }, [form, needRefundAccount, watchedBusinessDate, watchedRefundDate]);

  useEffect(() => {
    if (!open || !needRefundAccount) return;
    setAccountLoading(true);
    setAccountError(null);
    void capabilities
      .loadActiveFundAccounts({ isActive: true, page: 1, pageSize: 100 })
      .then((response) => {
        setFundAccountOptions(
          (response?.list ?? []).map((account) => ({
            label: account.code
              ? `${account.name}（${account.code}）`
              : account.name,
            value: account.id,
          })),
        );
      })
      .catch(() => setAccountError('退款账户加载失败，请关闭后重试'))
      .finally(() => setAccountLoading(false));
  }, [capabilities, needRefundAccount, open]);

  return (
    <DocumentModalForm<PurchaseReturnOutboundFormValues>
      title="退库出库"
      open={open}
      width={920}
      form={form}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      submitter={{
        searchConfig: { submitText: '确认退库出库' },
        submitButtonProps: { loading },
      }}
      onFinish={async (values) => {
        if (!detail || loading) return false;
        setLoading(true);
        try {
          await capabilities.submitOutbound({
            id: detail.id,
            businessDate: capabilities.normalizeDateOnly(values.businessDate),
            refundAccountId: values.refundAccountId || undefined,
            refundDate: capabilities.normalizeDateOnly(values.refundDate),
            items: (values.items ?? []).map((item) => ({
              id: item.id,
              outboundQty: item.outboundQty,
              batchNo: item.batchNo?.trim() || undefined,
              locationId: item.locationId || undefined,
              storageLocation: item.storageLocation?.trim() || undefined,
              remarks: item.remarks?.trim() || undefined,
            })),
          });
          capabilities.notifySuccess('已完成退库出库');
          onClose();
          await onSuccess?.();
          return true;
        } finally {
          setLoading(false);
        }
      }}
    >
      <div>
        <StockBusinessDateField label="退库出库日期" />
        {needRefundAccount && (
          <Card
            size="small"
            title="退款（财务动作=退款）"
            style={{ marginBottom: 12 }}
          >
            {accountError ? (
              <Alert
                type="error"
                showIcon
                message={accountError}
                style={{ marginBottom: 12 }}
              />
            ) : null}
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label="退款收款账户"
                  name="refundAccountId"
                  rules={[{ required: true, message: '退款需选择收款账户' }]}
                >
                  <Select
                    options={fundAccountOptions}
                    loading={accountLoading}
                    disabled={accountLoading || Boolean(accountError)}
                    placeholder="选择收款账户"
                    showSearch
                    optionFilterProp="label"
                    allowClear
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="退款入账日期"
                  name="refundDate"
                  rules={[{ required: true, message: '请选择退款入账日期' }]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    allowClear={false}
                    disabledDate={(date: Dayjs) =>
                      (watchedBusinessDate !== undefined &&
                        date.isBefore(watchedBusinessDate, 'day')) ||
                      date.isAfter(dayjs(), 'day')
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        )}
        <Form.List name="items">
          {(fields) => (
            <>
              {fields.map((field) => {
                const item = detail?.items?.[field.name];
                const returnQty = Number(item?.returnQty ?? 0);
                const outboundItem = watchedItems[field.name];
                return (
                  <Card
                    key={field.key}
                    size="small"
                    style={{ marginBottom: 12 }}
                    title={
                      item?.material?.name ||
                      item?.sourceReceiptItem?.material?.name ||
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
                          label={`退库数量 / 申请 ${returnQty}`}
                          name={[field.name, 'outboundQty']}
                          rules={[
                            { required: true, message: '请输入退库数量' },
                            {
                              type: 'number',
                              min: 0,
                              max: returnQty,
                              message: '退库数量不能小于0且不超过申请数量',
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
                        <Form.Item label="批号" name={[field.name, 'batchNo']}>
                          <Input maxLength={128} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <StockLocationInlineSelector
                          capabilities={capabilities.stockLocation}
                          action="stock/out"
                          warehouseId={detail?.outboundWarehouseId ?? undefined}
                          materialId={item?.materialId ?? undefined}
                          batchNo={outboundItem?.batchNo}
                          minAvailableQty={
                            Number(outboundItem?.outboundQty) || undefined
                          }
                          value={outboundItem?.locationId}
                          storageLocation={outboundItem?.storageLocation}
                          onChange={(patch) => {
                            const currentItems = form.getFieldValue('items') ?? [];
                            form.setFieldsValue({
                              items: currentItems.map(
                                (
                                  currentItem: PurchaseReturnOutboundFormValues['items'][number],
                                  index: number,
                                ) =>
                                  index === field.name
                                    ? { ...currentItem, ...patch }
                                    : currentItem,
                              ),
                            });
                          }}
                        />
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          label="存放位置"
                          name={[field.name, 'storageLocation']}
                        >
                          <Input maxLength={1000} />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <StockBalancePreview
                          capabilities={capabilities.stockBalancePreview}
                          warehouseId={detail?.outboundWarehouseId ?? undefined}
                          materialId={item?.materialId ?? undefined}
                          locationId={outboundItem?.locationId}
                          storageLocation={outboundItem?.storageLocation}
                          batchNo={outboundItem?.batchNo}
                          requiredQty={
                            Number(outboundItem?.outboundQty) || undefined
                          }
                          mode="outbound"
                        />
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
