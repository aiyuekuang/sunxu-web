import { createDocumentViewSwitch } from '../documents/DocumentViewSwitch';

/** @sunxu-layer business @sunxu-domain procurement order views @sunxu-reason Preserves the purchase-order list/detail toggle label and leaves view state and refresh policy with the host. */
export const PurchaseOrderViewSwitch = createDocumentViewSwitch({
  ariaLabel: '采购订单视图切换',
});

export type { DocumentViewMode as PurchaseOrderViewMode } from '../documents/DocumentViewSwitch';
export type { DocumentViewSwitchProps as PurchaseOrderViewSwitchProps } from '../documents/DocumentViewSwitch';
