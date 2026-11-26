import { createDocumentViewSwitch } from './DocumentViewSwitch';

/** @sunxu-layer business @sunxu-domain documents @sunxu-reason Preserves the host page-specific accessible names for the shared document/detail view switch. */
export const PurchaseRequisitionViewSwitch = createDocumentViewSwitch({
  ariaLabel: '采购申请视图切换',
});

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Keeps procurement return list and detail-ledger labels consistent. The host supplies selected view state and navigation.
 */
export const PurchaseReturnViewSwitch = createDocumentViewSwitch({
  ariaLabel: '采购退料视图切换',
});

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Keeps sales delivery list and detail-ledger labels consistent. The host supplies selected view state and navigation.
 */
export const SaleDeliveryViewSwitch = createDocumentViewSwitch({
  ariaLabel: '销售出库单视图切换',
});

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Keeps sales order list and detail-ledger labels consistent. The host supplies selected view state and navigation.
 */
export const SaleOrderViewSwitch = createDocumentViewSwitch({
  ariaLabel: '销售订单视图切换',
});

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Keeps quotation list and detail-ledger labels consistent. The host supplies selected view state and navigation.
 */
export const QuotationViewSwitch = createDocumentViewSwitch({
  ariaLabel: '报价单视图切换',
});

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Keeps sales return list and detail-ledger labels consistent. The host supplies selected view state and navigation.
 */
export const SaleReturnViewSwitch = createDocumentViewSwitch({
  ariaLabel: '销售退货视图切换',
});

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Keeps material issue list and detail-ledger labels consistent. The host supplies selected view state and navigation.
 */
export const MaterialIssueViewSwitch = createDocumentViewSwitch({
  ariaLabel: '生产领料视图切换',
});

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Keeps purchase receipt list and detail-ledger labels consistent. The host supplies selected view state and navigation.
 */
export const PurchaseReceiptViewSwitch = createDocumentViewSwitch({
  ariaLabel: '采购入库单视图切换',
});
