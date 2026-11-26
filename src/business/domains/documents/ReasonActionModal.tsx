import { App, Input, Modal } from 'antd';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

export type ReasonActionModalProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmText?: string;
  placeholder?: string;
  maxLength?: number;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
};

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Keeps host reason-required action validation and reset behavior while the host performs the business operation.
 * host confirmation modal that requires an explicit, auditable reason.
 */
export function ReasonActionModal({
  open,
  title,
  description,
  confirmText = '确认操作',
  placeholder = '请输入原因',
  maxLength = 500,
  onCancel,
  onConfirm,
}: ReasonActionModalProps) {
  const { message } = App.useApp();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('');
      setSubmitting(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      message.warning('请输入原因');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(normalizedReason);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      okText={confirmText}
      cancelText="取消"
      okButtonProps={{ danger: true, loading: submitting }}
      confirmLoading={submitting}
      destroyOnHidden
      onCancel={onCancel}
      onOk={() => void handleConfirm()}
    >
      {description}
      <Input.TextArea
        value={reason}
        rows={4}
        maxLength={maxLength}
        showCount
        placeholder={placeholder}
        onChange={(event) => setReason(event.target.value)}
      />
    </Modal>
  );
}
