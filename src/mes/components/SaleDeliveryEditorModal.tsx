import type { SaleDeliveryEditorModalProps } from './sales-delivery-components-types';

/** @sunxu-component mes-specific @sunxu-domain sales @sunxu-reason Provides the embedded sales-delivery editor entry point while the host supplies its page-level implementation. */
export function SaleDeliveryEditorModal({
  open,
  saleOrderId,
  onClose,
  onSuccess,
  capabilities,
}: SaleDeliveryEditorModalProps) {
  return <>{capabilities.renderEmbeddedEditor({ open, saleOrderId, onClose, onSuccess })}</>;
}
