import { createDocumentViewSwitch } from './DocumentViewSwitch';

/** @sunxu-component mes-specific @sunxu-domain purchase order views @sunxu-reason Preserves the purchase-order list/detail toggle label and leaves view state and refresh policy with the MES host. */
export const PurchaseOrderViewSwitch = createDocumentViewSwitch({
  ariaLabel: '采购订单视图切换',
});

export type { DocumentViewMode as PurchaseOrderViewMode } from './DocumentViewSwitch';
export type { DocumentViewSwitchProps as PurchaseOrderViewSwitchProps } from './DocumentViewSwitch';
