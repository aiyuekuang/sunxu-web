import { Modal, Space, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { MaterialFilteredSelect } from './MaterialFilteredSelect';
import type { QuotationBindMaterialsModalProps } from './quotation-bind-materials-modal-types';

/**
 * @sunxu-component mes-specific
 * @sunxu-domain sales quotation material binding
 * @sunxu-reason Preserves temporary quotation-line binding, per-line validation, configuration-entry refresh and submit lifecycle while binding, material lookup, route UI, and messages come from the host.
 */
export function QuotationBindMaterialsModal({
  quotation,
  open,
  onClose,
  onSuccess,
  capabilities,
}: QuotationBindMaterialsModalProps) {
  const [bindMaterialIds, setBindMaterialIds] = useState<Record<string, string>>(
    {},
  );
  const [emptyMaterialBaselineIds, setEmptyMaterialBaselineIds] = useState<
    Record<string, boolean>
  >({});
  const [materialRequestVersion, setMaterialRequestVersion] = useState(0);
  const refreshMaterialAfterConfigRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const temporaryItems = (quotation?.items ?? []).filter(
    (item) => !item.materialId,
  );

  useEffect(() => {
    if (open) {
      setBindMaterialIds(
        Object.fromEntries(temporaryItems.map((item) => [item.id, ''])),
      );
      setEmptyMaterialBaselineIds({});
    }
  }, [open, quotation]);

  useEffect(() => {
    const refreshAfterReturn = () => {
      if (!refreshMaterialAfterConfigRef.current) return;
      refreshMaterialAfterConfigRef.current = false;
      setMaterialRequestVersion((version) => version + 1);
    };
    window.addEventListener('focus', refreshAfterReturn);
    return () => window.removeEventListener('focus', refreshAfterReturn);
  }, []);

  const handleSubmit = async () => {
    if (!quotation || submitting) return;
    const missing = temporaryItems.find((item) => !bindMaterialIds[item.id]);
    if (missing) {
      capabilities.notifyWarning('请为每个临时报价品选择正式物料');
      return;
    }
    setSubmitting(true);
    try {
      await capabilities.bindMaterials({
        id: quotation.id,
        items: temporaryItems.map((item) => ({
          itemId: item.id,
          materialId: bindMaterialIds[item.id],
        })),
      });
      capabilities.notifySuccess(capabilities.messages.bindSuccess);
      onClose();
      await onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="绑定正式物料"
      open={open}
      okText="确认绑定"
      cancelText="取消"
      onOk={handleSubmit}
      confirmLoading={submitting}
      okButtonProps={{ disabled: temporaryItems.length === 0 }}
      onCancel={onClose}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">
        绑定只补充下游销售订单需要的正式物料，不会修改已发送给客户的数量、单价和临时报价信息。
      </Typography.Paragraph>
      <Space orientation="vertical" style={{ width: '100%' }} size={12}>
        {temporaryItems.map((item) => (
          <div key={item.id}>
            <Typography.Text strong>
              {item.customerMaterialName ||
                item.customerMaterialCode ||
                item.customerMaterialSpec ||
                '临时报价品'}
            </Typography.Text>
            <div style={{ marginTop: 8, marginBottom: 4 }}>
              {capabilities.renderMaterialConfigEntryLabel({
                target: 'material',
                show:
                  !submitting &&
                  emptyMaterialBaselineIds[item.id] === true &&
                  !bindMaterialIds[item.id],
                onOpen: () => {
                  refreshMaterialAfterConfigRef.current = true;
                },
                children: '正式物料',
              })}
            </div>
            <div>
              <MaterialFilteredSelect
                request={capabilities.requestActiveMaterials}
                requestKey={`${item.id}:${materialRequestVersion}`}
                value={bindMaterialIds[item.id] || undefined}
                disabled={submitting}
                onBaseOptionsEmptyChange={(isEmpty) =>
                  setEmptyMaterialBaselineIds((current) => ({
                    ...current,
                    [item.id]: isEmpty,
                  }))
                }
                onChange={(materialId) =>
                  setBindMaterialIds((previous) => ({
                    ...previous,
                    [item.id]: materialId ?? '',
                  }))
                }
                placeholder="选择正式物料"
                filterMode="hidden"
              />
            </div>
          </div>
        ))}
      </Space>
    </Modal>
  );
}
