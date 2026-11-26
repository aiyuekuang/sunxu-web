import { createContext, useCallback, useContext, type ReactNode } from 'react';
import type { DrawingFilesCapabilities } from '../domains/inventory/drawing-files-types';
import type { MasterDataQuickCreateCapabilities } from '../domains/documents/master-data-quick-create-types';
import type { MaterialSelectCapabilities } from '../domains/inventory/material-select-types';
import type { AccountingSelectorCapabilities } from '../domains/accounting/accounting-selector-types';
import type { PurchaseReceiptCapabilities } from '../domains/procurement/purchase-receipt-types';
import type { BusinessInvoiceCoverageCapabilities } from '../domains/accounting/business-invoice-types';
import type { WarehouseRemoteSelectCapabilities } from '../domains/inventory/warehouse-remote-select-types';
import type { BatchSuggestCapabilities } from '../domains/manufacturing/batch-suggest-types';
import type { WorkOrderScanSelectCapabilities } from '../domains/manufacturing/work-order-scan-select-types';
import type { PriceControlCapabilities } from '../domains/accounting/price-control-types';
import type { ProductionBomSelectCapabilities } from '../domains/manufacturing/production-bom-select-types';
import type { SupplierPriceTierCapabilities } from '../domains/procurement/supplier-price-tier-types';
import type { CustomFieldFormCapabilities } from '../domains/documents/custom-field-form-types';
import type { MaterialTablePickerCapabilities } from '../domains/inventory/material-table-picker-types';
import type { DocumentDetailLedgerCapabilities } from '../domains/documents/document-detail-ledger-types';
import type { LabelLayoutCapabilities } from '../domains/printing/print-layout-types';
import type { ApprovalCapabilities } from '../domains/documents/approval-types';
import type { BomCostSnapshotCapabilities } from '../domains/manufacturing/bom-cost-types';
import type { ImportWorkbenchCapabilities } from '../domains/documents/import-workbench-types';
import type { AllowedEquipmentPriorityCapabilities } from '../domains/manufacturing/allowed-equipment-priority-types';
import type { DocumentBomOpenCapabilities } from '../domains/documents/document-bom-open-types';
import type { OrderItemEditorCapabilities } from '../domains/sales/order-item-editor-types';

export interface HostRouteAdapter {
  pathname: string;
  search: string;
  /** The host applies its router's replace operation. */
  replace: (path: string) => void;
}

export interface HostNavigationAdapter {
  /** The host applies its router's push operation. */
  push: (path: string) => void;
}

export interface CustomFieldDisplayState {
  loading: boolean;
  hasFields: boolean;
  hasError: boolean;
}

export interface CustomFieldPanelRenderProps {
  objectType: string;
  objectId: string;
  editable: boolean;
  showEmpty: false;
  onDisplayStateChange: (state: CustomFieldDisplayState) => void;
}

export interface BusinessUiProviderProps {
  /** 宿主提供权限判断；权限码和权限策略由宿主维护。 */
  hasPermission: (permission: string) => boolean;
  /**
   * Format or mask a price string using the host's amount-visibility policy.
   * The component library never imports host access state or permission codes.
   */
  maskAmount?: (
    formattedAmount: string | number | null | undefined,
  ) => string;
  /**
   * Changes when host-controlled amount visibility changes, even when the
   * current user is not permitted to reveal prices. Resizable tables use this
   * revision to refresh custom render closures without resetting saved widths.
   */
  amountVisibilityRevision?: string | number | boolean;
  /**
   * Resolve a visible row edit action from the host's action-column metadata.
   * The host keeps its permission and action definitions; the table suite only calls
   * the returned action after a valid double click.
   */
  resolveRowEditAction?: (
    columns: readonly object[] | undefined,
    record: unknown,
  ) => { onClick: () => unknown | Promise<unknown> } | undefined;
  /** Identify action columns created by the host so the suite does not nest menus. */
  isTableActionColumn?: (column: object) => boolean;
  /** Current route and replace adapter for business action-intent deep links. */
  actionIntentRoute?: HostRouteAdapter;
  /** Host router bridge for detail and ledger actions. */
  documentNavigation?: HostNavigationAdapter;
  /** Render host custom-field content while the shared shell owns visibility and identity transitions. */
  renderCustomFieldPanel?: (
    props: CustomFieldPanelRenderProps,
  ) => ReactNode;
  /** Material data, dictionaries, configuration links, and scanner bridge. */
  materialSelectCapabilities?: MaterialSelectCapabilities;
  /** Authenticated file proxy, upload, download, and original-name lookups. */
  drawingFilesCapabilities?: DrawingFilesCapabilities;
  /** Host-owned quick-create permissions, forms, and configuration links. */
  masterDataQuickCreateCapabilities?: MasterDataQuickCreateCapabilities;
  /** Accounting lists, defaulting metadata, and config-entry links stay host-owned. */
  accountingSelectorCapabilities?: AccountingSelectorCapabilities;
  /** Purchase receipt services stay in the host. */
  purchaseReceiptCapabilities?: PurchaseReceiptCapabilities;
  /** Invoice coverage requests, permissions, and navigation stay in the host. */
  businessInvoiceCoverageCapabilities?: BusinessInvoiceCoverageCapabilities;
  /** Warehouse list requests and option-family filtering stay in the host. */
  warehouseRemoteSelectCapabilities?: WarehouseRemoteSelectCapabilities;
  /** Batch list service and status labels stay in the host. */
  batchSuggestCapabilities?: BatchSuggestCapabilities;
  /** Work-order search and scan parsing stay in the host. */
  workOrderScanSelectCapabilities?: WorkOrderScanSelectCapabilities;
  /** Price permission, precheck and exception requests stay in the host. */
  priceControlCapabilities?: PriceControlCapabilities;
  /** BOM requests, production field help, and configuration entry stay host-owned. */
  productionBomSelectCapabilities?: ProductionBomSelectCapabilities;
  /** Supplier price tier requests, permissions, dictionaries, and help stay host-owned. */
  supplierPriceTierCapabilities?: SupplierPriceTierCapabilities;
  /** Custom-field schemas and values are read and validated by the host. */
  customFieldFormCapabilities?: CustomFieldFormCapabilities;
  /** Material/category/stock requests, unit dictionary and list pagination stay host-owned. */
  materialTablePickerCapabilities?: MaterialTablePickerCapabilities;
  /** Detail-ledger export action and remembered pagination stay host-owned. */
  documentDetailLedgerCapabilities?: DocumentDetailLedgerCapabilities;
  /** Current label paper orientation is resolved from the host's print settings. */
  labelLayoutCapabilities?: LabelLayoutCapabilities;
  /** Approval permissions and APIs remain supplied by the host. */
  approvalCapabilities?: ApprovalCapabilities;
  /** BOM cost preview and material-unit labels remain supplied by the host. */
  bomCostSnapshotCapabilities?: BomCostSnapshotCapabilities;
  /** Import template, preview, row, and execute APIs remain host supplied. */
  importWorkbenchCapabilities?: ImportWorkbenchCapabilities;
  /** Equipment and shift data, dictionary labels, and remembered pagination for the scheduler selector. */
  allowedEquipmentPriorityCapabilities?: AllowedEquipmentPriorityCapabilities;
  /** Document BOM permissions and host data/API/rendering capabilities. */
  documentBomOpenCapabilities?: DocumentBomOpenCapabilities;
  /** Order-line services, dictionaries, custom-field metadata, help, and policy previews stay host-owned. */
  orderItemEditorCapabilities?: OrderItemEditorCapabilities;
  children: ReactNode;
}

type BusinessUiContextValue = Pick<
  BusinessUiProviderProps,
  | 'hasPermission'
  | 'maskAmount'
  | 'amountVisibilityRevision'
  | 'resolveRowEditAction'
  | 'isTableActionColumn'
  | 'actionIntentRoute'
  | 'documentNavigation'
  | 'renderCustomFieldPanel'
  | 'materialSelectCapabilities'
  | 'drawingFilesCapabilities'
  | 'masterDataQuickCreateCapabilities'
  | 'accountingSelectorCapabilities'
  | 'purchaseReceiptCapabilities'
  | 'businessInvoiceCoverageCapabilities'
  | 'warehouseRemoteSelectCapabilities'
  | 'batchSuggestCapabilities'
  | 'workOrderScanSelectCapabilities'
  | 'priceControlCapabilities'
  | 'productionBomSelectCapabilities'
  | 'supplierPriceTierCapabilities'
  | 'customFieldFormCapabilities'
  | 'materialTablePickerCapabilities'
  | 'documentDetailLedgerCapabilities'
  | 'labelLayoutCapabilities'
  | 'approvalCapabilities'
  | 'bomCostSnapshotCapabilities'
  | 'importWorkbenchCapabilities'
  | 'allowedEquipmentPriorityCapabilities'
  | 'documentBomOpenCapabilities'
  | 'orderItemEditorCapabilities'
>;

const BusinessUiContext = createContext<BusinessUiContextValue | null>(null);

export function BusinessUiProvider({
  hasPermission,
  maskAmount,
  amountVisibilityRevision,
  resolveRowEditAction,
  isTableActionColumn,
  actionIntentRoute,
  documentNavigation,
  renderCustomFieldPanel,
  materialSelectCapabilities,
  drawingFilesCapabilities,
  masterDataQuickCreateCapabilities,
  accountingSelectorCapabilities,
  purchaseReceiptCapabilities,
  businessInvoiceCoverageCapabilities,
  warehouseRemoteSelectCapabilities,
  batchSuggestCapabilities,
  workOrderScanSelectCapabilities,
  priceControlCapabilities,
  productionBomSelectCapabilities,
  supplierPriceTierCapabilities,
  customFieldFormCapabilities,
  materialTablePickerCapabilities,
  documentDetailLedgerCapabilities,
  labelLayoutCapabilities,
  approvalCapabilities,
  bomCostSnapshotCapabilities,
  importWorkbenchCapabilities,
  allowedEquipmentPriorityCapabilities,
  documentBomOpenCapabilities,
  orderItemEditorCapabilities,
  children,
}: BusinessUiProviderProps) {
  return (
    <BusinessUiContext.Provider
      value={{
        hasPermission,
        maskAmount,
        amountVisibilityRevision,
        resolveRowEditAction,
        isTableActionColumn,
        actionIntentRoute,
        documentNavigation,
        renderCustomFieldPanel,
        materialSelectCapabilities,
        drawingFilesCapabilities,
        masterDataQuickCreateCapabilities,
        accountingSelectorCapabilities,
        purchaseReceiptCapabilities,
        businessInvoiceCoverageCapabilities,
        warehouseRemoteSelectCapabilities,
        batchSuggestCapabilities,
        workOrderScanSelectCapabilities,
        priceControlCapabilities,
        productionBomSelectCapabilities,
        supplierPriceTierCapabilities,
        customFieldFormCapabilities,
        materialTablePickerCapabilities,
        documentDetailLedgerCapabilities,
        labelLayoutCapabilities,
        approvalCapabilities,
        bomCostSnapshotCapabilities,
        importWorkbenchCapabilities,
        allowedEquipmentPriorityCapabilities,
        documentBomOpenCapabilities,
        orderItemEditorCapabilities,
      }}
    >
      {children}
    </BusinessUiContext.Provider>
  );
}

/** Host capabilities used by business table adapters. */
export function useTableCapabilities(): Pick<
  BusinessUiContextValue,
  'resolveRowEditAction' | 'isTableActionColumn'
> {
  const host = useContext(BusinessUiContext);
  return {
    resolveRowEditAction: host?.resolveRowEditAction,
    isTableActionColumn: host?.isTableActionColumn,
  };
}

/**
 * Price visibility stays with the host. Missing host capability fails closed.
 */
export function useAmountMask(): NonNullable<BusinessUiContextValue['maskAmount']> {
  const host = useContext(BusinessUiContext);
  return (
    host?.maskAmount ??
    ((formattedAmount) => (formattedAmount == null ? '-' : '****'))
  );
}

/**
 * Host-owned amount visibility state used to refresh cached table renderers.
 * Keep this separate from `maskAmount`: a page may allow an override that
 * differs from the host's general price permission.
 */
export function useAmountVisibilityRevision():
  | BusinessUiContextValue['amountVisibilityRevision']
  | undefined {
  return useContext(BusinessUiContext)?.amountVisibilityRevision;
}

/** Permission checks fail closed when a host has not supplied an authorization provider. */
export function useHostPermission(permission?: string): boolean {
  const host = useContext(BusinessUiContext);
  if (!permission) return true;
  return host?.hasPermission(permission) ?? false;
}

/** Permission predicate for business components; absent providers deny access. */
export function useHostPermissionChecker(): (permission: string) => boolean {
  const host = useContext(BusinessUiContext);
  return useCallback(
    (permission: string) => host?.hasPermission(permission) ?? false,
    [host],
  );
}

/** Router capability used by document action-intent deep links. */
export function useActionIntentRoute(): HostRouteAdapter | undefined {
  return useContext(BusinessUiContext)?.actionIntentRoute;
}

/** Host router bridge used by detail and ledger actions. */
export function useDocumentNavigation(): HostNavigationAdapter | undefined {
  return useContext(BusinessUiContext)?.documentNavigation;
}

/** Host-owned schema, requests, and field editors for a shared document-field shell. */
export function useCustomFieldPanelRenderer():
  | BusinessUiProviderProps['renderCustomFieldPanel']
  | undefined {
  return useContext(BusinessUiContext)?.renderCustomFieldPanel;
}

/** Host capabilities for material selectors and scanner integration. */
export function useMaterialSelectCapabilities():
  | MaterialSelectCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.materialSelectCapabilities;
}

/** Host capabilities for drawing and attachment components. */
export function useDrawingFilesCapabilities():
  | DrawingFilesCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.drawingFilesCapabilities;
}

/** Host capabilities for customer/supplier quick-create selectors. */
export function useMasterDataQuickCreateCapabilities():
  | MasterDataQuickCreateCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.masterDataQuickCreateCapabilities;
}

/** Host capabilities for accounting books, periods, accounts, and voucher words. */
export function useAccountingSelectorCapabilities():
  | AccountingSelectorCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.accountingSelectorCapabilities;
}

/** Host-owned purchase receipt requests. */
export function usePurchaseReceiptCapabilities():
  | PurchaseReceiptCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.purchaseReceiptCapabilities;
}

/** Host-owned business invoice coverage, permissions, and route navigation. */
export function useBusinessInvoiceCoverageCapabilities():
  | BusinessInvoiceCoverageCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.businessInvoiceCoverageCapabilities;
}

/** Host-owned warehouse list service and option filtering. */
export function useWarehouseRemoteSelectCapabilities():
  | WarehouseRemoteSelectCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.warehouseRemoteSelectCapabilities;
}

/** Host-owned batch listing and status labels. */
export function useBatchSuggestCapabilities():
  | BatchSuggestCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.batchSuggestCapabilities;
}

/** Host-owned work-order search and scan parser. */
export function useWorkOrderScanSelectCapabilities():
  | WorkOrderScanSelectCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.workOrderScanSelectCapabilities;
}

/** Host-owned price-control permission, precheck, exception request and errors. */
export function usePriceControlCapabilities():
  | PriceControlCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.priceControlCapabilities;
}

/** Host-owned BOM requests, field help and authorized configuration entry. */
export function useProductionBomSelectCapabilities():
  | ProductionBomSelectCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.productionBomSelectCapabilities;
}

/** Host-owned supplier price tier dictionary labels and currency. */
export function useSupplierPriceTierCapabilities():
  | SupplierPriceTierCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.supplierPriceTierCapabilities;
}

/** Host-owned custom-field schema/value requests and error formatting. */
export function useCustomFieldFormCapabilities():
  | CustomFieldFormCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.customFieldFormCapabilities;
}

/** Host-owned material catalog, category, stock summary and unit dictionary requests. */
export function useMaterialTablePickerCapabilities():
  | MaterialTablePickerCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.materialTablePickerCapabilities;
}

/** Host-owned ledger export rendering and global pagination policy. */
export function useDocumentDetailLedgerCapabilities():
  | DocumentDetailLedgerCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.documentDetailLedgerCapabilities;
}

/** Host-owned current label paper orientation. */
export function useLabelLayoutCapabilities():
  | LabelLayoutCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.labelLayoutCapabilities;
}

/** Host-owned approval permission decisions and state/actions. */
export function useApprovalCapabilities():
  | ApprovalCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.approvalCapabilities;
}

/** Host-owned BOM cost preview and unit labels. */
export function useBomCostSnapshotCapabilities():
  | BomCostSnapshotCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.bomCostSnapshotCapabilities;
}

/** Host-owned import template, preview, row, and execution APIs. */
export function useImportWorkbenchCapabilities():
  | ImportWorkbenchCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.importWorkbenchCapabilities;
}

/** Host-owned equipment/shift queries and equipment type dictionary for scheduling. */
export function useAllowedEquipmentPriorityCapabilities():
  | AllowedEquipmentPriorityCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.allowedEquipmentPriorityCapabilities;
}

/** Host-owned document BOM permissions and detailed BOM drawer. */
export function useDocumentBomOpenCapabilities():
  | DocumentBomOpenCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.documentBomOpenCapabilities;
}

/** Host-owned services and metadata for order-line editing. */
export function useOrderItemEditorCapabilities():
  | OrderItemEditorCapabilities
  | undefined {
  return useContext(BusinessUiContext)?.orderItemEditorCapabilities;
}
