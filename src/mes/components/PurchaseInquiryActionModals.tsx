import {
  ProFormCheckbox,
  ProFormDatePicker,
  ProFormDigit,
  ProFormGroup,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Modal,
  Select,
  Space,
  Spin,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MaterialFilteredSelect } from './MaterialFilteredSelect';
import { DocumentModalForm } from './DocumentModalForm';
import type {
  PurchaseInquiryActionModalsProps,
  PurchaseInquiryAwardFormValues,
  PurchaseInquiryConvertFormValues,
  PurchaseInquiryQuoteFormValues,
} from './purchase-inquiry-action-modals-types';

function normalizeDateValue(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value.slice(0, 10) || undefined;
  if (
    typeof value === 'object' &&
    value !== null &&
    'format' in value &&
    typeof value.format === 'function'
  ) {
    const formatted = value.format('YYYY-MM-DD');
    return typeof formatted === 'string' ? formatted : undefined;
  }
  return undefined;
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain purchase-inquiry
 * @sunxu-reason Keeps inquiry quote registration, award comparison, material binding and conversion interactions while all requests, permissions, feedback and configuration links stay host-owned.
 */
export function PurchaseInquiryActionModals({
  inquiry,
  action,
  open,
  onOpenChange,
  onSuccess,
  capabilities,
}: PurchaseInquiryActionModalsProps) {
  const [detail, setDetail] = useState<
    PurchaseInquiryActionModalsProps['inquiry']
  >(null);
  const [compare, setCompare] = useState<Awaited<
    ReturnType<typeof capabilities.compareQuotes>
  > | null>(null);
  const [bindMaterialIds, setBindMaterialIds] = useState<Record<string, string>>(
    {},
  );
  const [emptyMaterialBaselineIds, setEmptyMaterialBaselineIds] = useState<
    Record<string, boolean>
  >({});
  const [materialRequestVersion, setMaterialRequestVersion] = useState(0);
  const refreshMaterialAfterConfigRef = useRef(false);
  const [awardSelections, setAwardSelections] = useState<Record<string, string>>(
    {},
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [bindSubmitting, setBindSubmitting] = useState(false);

  const actionAllowed = action !== null && capabilities.canPerformAction(action);
  const { loadDetail, compareQuotes, subscribeToWindowFocus } = capabilities;

  useEffect(() => {
    if (!inquiry || !open || !actionAllowed) return;
    let active = true;
    setDetail(null);
    setCompare(null);
    setDetailError(null);
    setAwardSelections({});
    setBindMaterialIds({});
    setEmptyMaterialBaselineIds({});
    setDetailLoading(true);
    Promise.all([
      loadDetail({ id: inquiry.id }),
      action === 'award'
        ? compareQuotes({ id: inquiry.id })
        : Promise.resolve(null),
    ])
      .then(([nextDetail, nextCompare]) => {
        if (!active) return;
        setDetail(nextDetail);
        setCompare(nextCompare);
        if (action === 'bind-materials') {
          setBindMaterialIds(
            Object.fromEntries(
              (nextDetail.items ?? [])
                .filter((item) => !item.materialId)
                .map((item) => [item.id, '']),
            ),
          );
        }
      })
      .catch(() => {
        if (active) setDetailError('单据加载失败，请重试');
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [action, actionAllowed, compareQuotes, inquiry, loadDetail, open]);

  useEffect(
    () =>
      subscribeToWindowFocus(() => {
        if (!refreshMaterialAfterConfigRef.current) return;
        refreshMaterialAfterConfigRef.current = false;
        setMaterialRequestVersion((version) => version + 1);
      }),
    [subscribeToWindowFocus],
  );

  const retryLoad = useCallback(() => {
    setDetailError(null);
    setDetail(null);
    setDetailLoading(true);
    setAwardSelections({});
    setBindMaterialIds({});
    setEmptyMaterialBaselineIds({});
    void Promise.all([
      loadDetail({ id: inquiry?.id ?? '' }),
      action === 'award'
        ? compareQuotes({ id: inquiry?.id ?? '' })
        : Promise.resolve(null),
    ])
      .then(([nextDetail, nextCompare]) => {
        setDetail(nextDetail);
        setCompare(nextCompare);
        if (action === 'bind-materials') {
          setBindMaterialIds(
            Object.fromEntries(
              (nextDetail.items ?? [])
                .filter((item) => !item.materialId)
                .map((item) => [item.id, '']),
            ),
          );
        }
      })
      .catch(() => setDetailError('单据加载失败，请重试'))
      .finally(() => setDetailLoading(false));
  }, [action, compareQuotes, inquiry?.id, loadDetail]);

  const supplierOptions = useMemo(
    () =>
      (detail?.suppliers ?? [])
        .filter((item) => item.supplierId)
        .map((item) => ({
          label: item.supplier?.name ?? item.supplierId,
          value: item.supplierId as string,
        })),
    [detail?.suppliers],
  );

  const closeAndReload = useCallback(async () => {
    onOpenChange(false);
    await onSuccess();
  }, [onOpenChange, onSuccess]);

  if (!inquiry || !open || !actionAllowed || !action) return null;
  if (detailLoading || !detail)
    return (
      <Modal
        open
        title="加载单据"
        footer={null}
        onCancel={() => onOpenChange(false)}
      >
        {detailError ? (
          <Space orientation="vertical">
            <Alert type="error" showIcon message={detailError} />
            <Button onClick={retryLoad}>重试</Button>
          </Space>
        ) : (
          <Space>
            <Spin />
            <Typography.Text>正在加载…</Typography.Text>
          </Space>
        )}
      </Modal>
    );

  const temporaryItems = (detail.items ?? []).filter(
    (item) => !item.materialId,
  );

  if (action === 'bind-materials') {
    return (
      <Modal
        title="绑定正式物料"
        open
        okText="确认绑定"
        confirmLoading={bindSubmitting}
        okButtonProps={{ disabled: temporaryItems.length === 0 }}
        onOk={async () => {
          if (bindSubmitting) return;
          const items = temporaryItems.map((item) => ({
            itemId: item.id,
            materialId: bindMaterialIds[item.id] ?? '',
          }));
          if (items.some((item) => !item.materialId)) {
            capabilities.notifications.warning('请为所有临时询价品选择正式物料');
            return;
          }
          setBindSubmitting(true);
          try {
            await capabilities.bindMaterials({ id: detail.id, items });
            capabilities.notifications.success(capabilities.messages.saveSuccess);
            await closeAndReload();
          } finally {
            setBindSubmitting(false);
          }
        }}
        onCancel={() => onOpenChange(false)}
      >
        <Typography.Paragraph type="secondary">
          绑定只补充采购订单和库存履约需要的正式物料，不会修改询价和报价快照。
        </Typography.Paragraph>
        <Space orientation="vertical" style={{ width: '100%' }} size={12}>
          {temporaryItems.map((item) => (
            <div key={item.id}>
              <Typography.Text strong>
                {item.temporaryItemName ?? item.temporaryItemCode ?? item.id}
              </Typography.Text>
              <div style={{ marginTop: 8, marginBottom: 4 }}>
                {capabilities.renderMaterialConfigEntryLabel({
                  target: 'material',
                  show:
                    !bindSubmitting &&
                    emptyMaterialBaselineIds[item.id] === true &&
                    !bindMaterialIds[item.id],
                  onOpen: () => {
                    refreshMaterialAfterConfigRef.current = true;
                  },
                  children: '正式物料',
                })}
              </div>
              <MaterialFilteredSelect
                request={capabilities.requestActiveMaterials}
                requestKey={`${item.id}:${materialRequestVersion}`}
                value={bindMaterialIds[item.id] || undefined}
                disabled={bindSubmitting}
                onBaseOptionsEmptyChange={(isEmpty) =>
                  setEmptyMaterialBaselineIds((current) => ({
                    ...current,
                    [item.id]: isEmpty,
                  }))
                }
                onChange={(value) =>
                  setBindMaterialIds((current) => ({
                    ...current,
                    [item.id]: value ?? '',
                  }))
                }
                placeholder="选择正式物料"
                filterMode="hidden"
              />
            </div>
          ))}
        </Space>
      </Modal>
    );
  }

  if (action === 'award') {
    return (
      <DocumentModalForm<PurchaseInquiryAwardFormValues>
        title="比价定标"
        open
        onOpenChange={onOpenChange}
        onFinish={async (values) => {
          const lines = compare?.items ?? [];
          if (lines.length === 0) {
            capabilities.notifications.warning('暂无可定标的报价明细，请先登记供应商报价');
            return false;
          }
          if (lines.some((line) => !awardSelections[line.inquiryItem.id])) {
            capabilities.notifications.warning('请为所有询价明细选择中标报价');
            return false;
          }
          await capabilities.award({
            id: detail.id,
            awardReason: values.awardReason,
            items: lines.map((line) => ({
              inquiryItemId: line.inquiryItem.id,
              quotationItemId: awardSelections[line.inquiryItem.id],
            })),
          });
          capabilities.notifications.success(capabilities.messages.confirmSuccess);
          await closeAndReload();
          return true;
        }}
      >
        <Space orientation="vertical" style={{ width: '100%' }}>
          {(compare?.items ?? []).map((line) => (
            <Space
              key={line.inquiryItem.id}
              orientation="vertical"
              style={{ width: '100%' }}
            >
              <Typography.Text strong>
                {line.inquiryItem.material?.name ??
                  line.inquiryItem.temporaryItemName ??
                  line.inquiryItem.id}
              </Typography.Text>
              <Select
                style={{ width: '100%' }}
                placeholder="选择供应商报价"
                value={awardSelections[line.inquiryItem.id]}
                options={line.quotes.map((quote) => ({
                  label: `${quote.supplier?.name ?? quote.supplierId} · ${quote.unitPrice}`,
                  value: quote.id,
                }))}
                onChange={(value) =>
                  setAwardSelections((current) => ({
                    ...current,
                    [line.inquiryItem.id]: value,
                  }))
                }
              />
            </Space>
          ))}
          <ProFormTextArea
            name="awardReason"
            label="定标原因"
            rules={[{ required: true, message: '请填写定标原因' }]}
          />
        </Space>
      </DocumentModalForm>
    );
  }

  if (action === 'convert') {
    return (
      <DocumentModalForm<PurchaseInquiryConvertFormValues>
        title="定标转采购订单"
        open
        onOpenChange={onOpenChange}
        onFinish={async (values) => {
          await capabilities.convertToOrders({
            id: detail.id,
            updateMaterialSupplierPrice: values.updateMaterialSupplierPrice,
          });
          capabilities.notifications.success(capabilities.messages.convertSuccess);
          await closeAndReload();
          return true;
        }}
      >
        <Typography.Paragraph type="secondary">
          系统会按中标供应商拆分生成采购订单，并保留询价、定标和报价追溯。
        </Typography.Paragraph>
        <ProFormCheckbox name="updateMaterialSupplierPrice">
          转单时同步保存中标价到物料供应商价格资料
        </ProFormCheckbox>
      </DocumentModalForm>
    );
  }

  return (
    <DocumentModalForm<PurchaseInquiryQuoteFormValues>
      title="登记供应商报价"
      open
      onOpenChange={onOpenChange}
      onFinish={async (values) => {
        if (!values.supplierId) return false;
        const items = (detail.items ?? []).map((item) => ({
          inquiryItemId: item.id,
          quoteQty: Number(
            values.quoteItems?.[item.id]?.quoteQty ??
              item.purchaseQty ??
              item.inquiryQty,
          ),
          unitPrice: Number(values.quoteItems?.[item.id]?.unitPrice ?? 0),
        }));
        if (items.some((item) => item.unitPrice <= 0)) {
          capabilities.notifications.warning('请填写所有询价明细的有效报价单价');
          return false;
        }
        await capabilities.registerQuotation({
          id: detail.id,
          supplierId: values.supplierId,
          quoteDate: normalizeDateValue(values.quoteDate),
          validUntil: normalizeDateValue(values.validUntil),
          paymentTerms: values.paymentTerms,
          taxRate: values.taxRate,
          freightAmount: values.freightAmount,
          remarks: values.remarks,
          items,
        });
        capabilities.notifications.success(capabilities.messages.saveSuccess);
        await closeAndReload();
        return true;
      }}
    >
      <ProFormGroup size={[24, 0]}>
        <ProFormSelect
          name="supplierId"
          label="报价供应商"
          options={supplierOptions}
          rules={[{ required: true, message: '请选择报价供应商' }]}
        />
        <ProFormDatePicker name="quoteDate" label="报价日期" />
        <ProFormDatePicker name="validUntil" label="有效期至" />
        <ProFormDigit name="taxRate" label="税率（%）" min={0} max={100} />
        <ProFormDigit name="freightAmount" label="运费" min={0} />
      </ProFormGroup>
      <Space orientation="vertical" style={{ width: '100%' }} size={12}>
        {(detail.items ?? []).map((item) => (
          <Space key={item.id} align="start" style={{ width: '100%' }}>
            <Typography.Text style={{ width: 220 }}>
              {item.material?.name ?? item.temporaryItemName ?? item.id}
            </Typography.Text>
            <ProFormDigit
              name={['quoteItems', item.id, 'quoteQty']}
              label="报价数量"
              initialValue={item.purchaseQty ?? item.inquiryQty}
              min={0.0001}
              fieldProps={{ precision: 4 }}
            />
            <ProFormDigit
              name={['quoteItems', item.id, 'unitPrice']}
              label="报价单价"
              min={0.0001}
              fieldProps={{ precision: 4 }}
              rules={[{ required: true, message: '请输入报价单价' }]}
            />
          </Space>
        ))}
      </Space>
      <ProFormTextArea name="remarks" label="报价备注" />
    </DocumentModalForm>
  );
}
