import type { SaleOrderShipActionModalProps } from './sale-order-ship-action-types';

/** @sunxu-layer business @sunxu-domain sales @sunxu-reason Keeps the sales-order-context shipping entry wired to the host's sole sales-delivery editor without embedding page or route code in the component library.*/
export function SaleOrderShipActionModal({
  open,
  order,
  onClose,
  onSuccess,
  capabilities,
}: SaleOrderShipActionModalProps) {
  return capabilities.renderDeliveryEditor({
    open: open && Boolean(order?.id),
    saleOrderId: order?.id ?? undefined,
    onClose,
    onSuccess,
  });
}
