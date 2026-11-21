import { createDocumentViewSwitch } from './DocumentViewSwitch';

/** @sunxu-component mes-specific @sunxu-domain document-workflow @sunxu-reason Preserves the MES page-specific accessible names for the shared document/detail view switch. */
export const PurchaseRequisitionViewSwitch = createDocumentViewSwitch({
  ariaLabel: '采购申请视图切换',
});

export const PurchaseReturnViewSwitch = createDocumentViewSwitch({
  ariaLabel: '采购退料视图切换',
});

export const SaleDeliveryViewSwitch = createDocumentViewSwitch({
  ariaLabel: '销售出库单视图切换',
});

export const SaleOrderViewSwitch = createDocumentViewSwitch({
  ariaLabel: '销售订单视图切换',
});

export const QuotationViewSwitch = createDocumentViewSwitch({
  ariaLabel: '报价单视图切换',
});

export const SaleReturnViewSwitch = createDocumentViewSwitch({
  ariaLabel: '销售退货视图切换',
});

export const MaterialIssueViewSwitch = createDocumentViewSwitch({
  ariaLabel: '生产领料视图切换',
});

export const PurchaseReceiptViewSwitch = createDocumentViewSwitch({
  ariaLabel: '采购入库单视图切换',
});
