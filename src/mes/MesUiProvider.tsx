import { createContext, useCallback, useContext, type ReactNode } from 'react';
import type { MesDrawingFilesCapabilities } from './components/drawing-files-types';
import type { MesMasterDataQuickCreateCapabilities } from './components/master-data-quick-create-types';
import type { MesMaterialSelectCapabilities } from './components/material-select-types';
import type { MesAccountingSelectorCapabilities } from './components/accounting-selector-types';
import type { MesPurchaseReceiptCapabilities } from './components/purchase-receipt-types';
import type { MesBusinessInvoiceCoverageCapabilities } from './components/business-invoice-types';
import type { MesWarehouseRemoteSelectCapabilities } from './components/warehouse-remote-select-types';
import type { MesBatchSuggestCapabilities } from './components/batch-suggest-types';
import type { MesWorkOrderScanSelectCapabilities } from './components/work-order-scan-select-types';
import type { MesPriceControlCapabilities } from './components/price-control-types';
import type { MesProductionBomSelectCapabilities } from './components/production-bom-select-types';
import type { MesSupplierPriceTierCapabilities } from './components/supplier-price-tier-types';
import type { MesCustomFieldFormCapabilities } from './components/custom-field-form-types';
import type { MesMaterialTablePickerCapabilities } from './components/material-table-picker-types';
import type { MesDocumentDetailLedgerCapabilities } from './components/document-detail-ledger-types';
import type { MesLabelLayoutCapabilities } from './components/print-layout-types';
import type { MesApprovalCapabilities } from './components/approval-types';
import type { MesBomCostSnapshotCapabilities } from './components/bom-cost-types';
import type { MesImportWorkbenchCapabilities } from './components/import-workbench-types';
import type { MesAllowedEquipmentPriorityCapabilities } from './components/allowed-equipment-priority-types';
import type { MesDocumentBomOpenCapabilities } from './components/document-bom-open-types';
import type { MesOrderItemEditorCapabilities } from './components/order-item-editor-types';

export interface MesUiRoute {
  pathname: string;
  search: string;
  /** The host applies its router's replace operation. */
  replace: (path: string) => void;
}

export interface MesUiNavigation {
  /** The host applies its router's push operation. */
  push: (path: string) => void;
}

export interface MesCustomFieldDisplayState {
  loading: boolean;
  hasFields: boolean;
  hasError: boolean;
}

export interface MesCustomFieldPanelRenderProps {
  objectType: string;
  objectId: string;
  editable: boolean;
  showEmpty: false;
  onDisplayStateChange: (state: MesCustomFieldDisplayState) => void;
}

export interface MesUiProviderProps {
  /** MES 宿主的权限判断；权限码和权限策略由宿主维护。 */
  hasPermission: (permission: string) => boolean;
  /**
   * Format or mask a price string using the host's amount-visibility policy.
   * The MES suite never imports Umi access state or price permission codes.
   */
  maskAmount?: (
    formattedAmount: string | number | null | undefined,
  ) => string;
  /**
   * Resolve a visible row edit action from the host's action-column metadata.
   * MES keeps its permission and action definitions; the table suite only calls
   * the returned action after a valid double click.
   */
  resolveRowEditAction?: (
    columns: readonly object[] | undefined,
    record: unknown,
  ) => { onClick: () => unknown | Promise<unknown> } | undefined;
  /** Identify action columns created by the host so the suite does not nest menus. */
  isTableActionColumn?: (column: object) => boolean;
  /** Current route and replace adapter for MES action-intent deep links. */
  actionIntentRoute?: MesUiRoute;
  /** Host router bridge for MES detail and ledger actions. */
  documentNavigation?: MesUiNavigation;
  /** Render MES custom-field content while the shared shell owns visibility and identity transitions. */
  renderCustomFieldPanel?: (
    props: MesCustomFieldPanelRenderProps,
  ) => ReactNode;
  /** Material data, dictionaries, configuration links, and scanner bridge. */
  materialSelectCapabilities?: MesMaterialSelectCapabilities;
  /** Authenticated file proxy, upload, download, and original-name lookups. */
  drawingFilesCapabilities?: MesDrawingFilesCapabilities;
  /** MES-owned quick-create permissions, forms, and configuration links. */
  masterDataQuickCreateCapabilities?: MesMasterDataQuickCreateCapabilities;
  /** Accounting lists, defaulting metadata, and config-entry links stay host-owned. */
  accountingSelectorCapabilities?: MesAccountingSelectorCapabilities;
  /** Purchase receipt services stay in the MES host. */
  purchaseReceiptCapabilities?: MesPurchaseReceiptCapabilities;
  /** Invoice coverage requests, permissions, and navigation stay in the MES host. */
  businessInvoiceCoverageCapabilities?: MesBusinessInvoiceCoverageCapabilities;
  /** Warehouse list requests and option-family filtering stay in the MES host. */
  warehouseRemoteSelectCapabilities?: MesWarehouseRemoteSelectCapabilities;
  /** Batch list service and status labels stay in the MES host. */
  batchSuggestCapabilities?: MesBatchSuggestCapabilities;
  /** Work-order search and scan parsing stay in the MES host. */
  workOrderScanSelectCapabilities?: MesWorkOrderScanSelectCapabilities;
  /** Raw price permission, precheck and exception request stay in the MES host. */
  priceControlCapabilities?: MesPriceControlCapabilities;
  /** BOM requests, production field help, and configuration entry stay host-owned. */
  productionBomSelectCapabilities?: MesProductionBomSelectCapabilities;
  /** Supplier price tier requests, permissions, dictionaries, and help stay host-owned. */
  supplierPriceTierCapabilities?: MesSupplierPriceTierCapabilities;
  /** Custom-field schemas and values are read and validated by the MES host. */
  customFieldFormCapabilities?: MesCustomFieldFormCapabilities;
  /** Material/category/stock requests, unit dictionary and list pagination stay host-owned. */
  materialTablePickerCapabilities?: MesMaterialTablePickerCapabilities;
  /** MES detail-ledger export action and remembered pagination stay host-owned. */
  documentDetailLedgerCapabilities?: MesDocumentDetailLedgerCapabilities;
  /** Current label paper orientation is resolved from the host's print settings. */
  labelLayoutCapabilities?: MesLabelLayoutCapabilities;
  /** MES approval permissions and APIs remain supplied by the host. */
  approvalCapabilities?: MesApprovalCapabilities;
  /** BOM cost preview and material-unit labels remain supplied by the host. */
  bomCostSnapshotCapabilities?: MesBomCostSnapshotCapabilities;
  /** Import template, preview, row, and execute APIs remain host supplied. */
  importWorkbenchCapabilities?: MesImportWorkbenchCapabilities;
  /** Equipment and shift data, dictionary labels, and remembered pagination for the MES scheduler selector. */
  allowedEquipmentPriorityCapabilities?: MesAllowedEquipmentPriorityCapabilities;
  /** MES document BOM permissions and host data/API/rendering capabilities. */
  documentBomOpenCapabilities?: MesDocumentBomOpenCapabilities;
  /** Order-line services, dictionaries, custom-field metadata, help, and policy previews stay host-owned. */
  orderItemEditorCapabilities?: MesOrderItemEditorCapabilities;
  children: ReactNode;
}

type MesUiContextValue = Pick<
  MesUiProviderProps,
  | 'hasPermission'
  | 'maskAmount'
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

const MesUiContext = createContext<MesUiContextValue | null>(null);

export function MesUiProvider({
  hasPermission,
  maskAmount,
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
}: MesUiProviderProps) {
  return (
    <MesUiContext.Provider
      value={{
        hasPermission,
        maskAmount,
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
    </MesUiContext.Provider>
  );
}

/** Host capabilities used by MES-specific table adapters. */
export function useMesTableCapabilities(): Pick<
  MesUiContextValue,
  'resolveRowEditAction' | 'isTableActionColumn'
> {
  const host = useContext(MesUiContext);
  return {
    resolveRowEditAction: host?.resolveRowEditAction,
    isTableActionColumn: host?.isTableActionColumn,
  };
}

/**
 * Price visibility stays with the host. Missing host capability fails closed.
 */
export function useMesAmountMask(): NonNullable<MesUiContextValue['maskAmount']> {
  const host = useContext(MesUiContext);
  return (
    host?.maskAmount ??
    ((formattedAmount) => (formattedAmount == null ? '-' : '****'))
  );
}

/** Permission checks fail closed when a host has not supplied an authorization provider. */
export function useMesPermission(permission?: string): boolean {
  const host = useContext(MesUiContext);
  if (!permission) return true;
  return host?.hasPermission(permission) ?? false;
}

/** Permission predicate for compound MES UI components; absent providers deny access. */
export function useMesPermissionChecker(): (permission: string) => boolean {
  const host = useContext(MesUiContext);
  return useCallback(
    (permission: string) => host?.hasPermission(permission) ?? false,
    [host],
  );
}

/** Router capability used by document action-intent deep links. */
export function useMesActionIntentRoute(): MesUiRoute | undefined {
  return useContext(MesUiContext)?.actionIntentRoute;
}

/** Host router bridge used by MES detail and ledger actions. */
export function useMesDocumentNavigation(): MesUiNavigation | undefined {
  return useContext(MesUiContext)?.documentNavigation;
}

/** Host-owned schema, requests, and field editors for a shared document-field shell. */
export function useMesCustomFieldPanelRenderer():
  | MesUiProviderProps['renderCustomFieldPanel']
  | undefined {
  return useContext(MesUiContext)?.renderCustomFieldPanel;
}

/** Host capabilities for MES material selectors and scan-gun integration. */
export function useMesMaterialSelectCapabilities():
  | MesMaterialSelectCapabilities
  | undefined {
  return useContext(MesUiContext)?.materialSelectCapabilities;
}

/** Host capabilities for MES drawing and attachment components. */
export function useMesDrawingFilesCapabilities():
  | MesDrawingFilesCapabilities
  | undefined {
  return useContext(MesUiContext)?.drawingFilesCapabilities;
}

/** Host capabilities for MES customer/supplier quick-create selectors. */
export function useMesMasterDataQuickCreateCapabilities():
  | MesMasterDataQuickCreateCapabilities
  | undefined {
  return useContext(MesUiContext)?.masterDataQuickCreateCapabilities;
}

/** Host capabilities for accounting books, periods, accounts, and voucher words. */
export function useMesAccountingSelectorCapabilities():
  | MesAccountingSelectorCapabilities
  | undefined {
  return useContext(MesUiContext)?.accountingSelectorCapabilities;
}

/** Host-owned purchase receipt requests. */
export function useMesPurchaseReceiptCapabilities():
  | MesPurchaseReceiptCapabilities
  | undefined {
  return useContext(MesUiContext)?.purchaseReceiptCapabilities;
}

/** Host-owned business invoice coverage, permissions, and route navigation. */
export function useMesBusinessInvoiceCoverageCapabilities():
  | MesBusinessInvoiceCoverageCapabilities
  | undefined {
  return useContext(MesUiContext)?.businessInvoiceCoverageCapabilities;
}

/** Host-owned MES warehouse list service and option filtering. */
export function useMesWarehouseRemoteSelectCapabilities():
  | MesWarehouseRemoteSelectCapabilities
  | undefined {
  return useContext(MesUiContext)?.warehouseRemoteSelectCapabilities;
}

/** Host-owned MES batch listing and status labels. */
export function useMesBatchSuggestCapabilities():
  | MesBatchSuggestCapabilities
  | undefined {
  return useContext(MesUiContext)?.batchSuggestCapabilities;
}

/** Host-owned work-order search and scan parser. */
export function useMesWorkOrderScanSelectCapabilities():
  | MesWorkOrderScanSelectCapabilities
  | undefined {
  return useContext(MesUiContext)?.workOrderScanSelectCapabilities;
}

/** Host-owned price-control permission, precheck, exception request and errors. */
export function useMesPriceControlCapabilities():
  | MesPriceControlCapabilities
  | undefined {
  return useContext(MesUiContext)?.priceControlCapabilities;
}

/** Host-owned MES BOM requests, field help and authorized configuration entry. */
export function useMesProductionBomSelectCapabilities():
  | MesProductionBomSelectCapabilities
  | undefined {
  return useContext(MesUiContext)?.productionBomSelectCapabilities;
}

/** Host-owned supplier price tier dictionary labels and currency. */
export function useMesSupplierPriceTierCapabilities():
  | MesSupplierPriceTierCapabilities
  | undefined {
  return useContext(MesUiContext)?.supplierPriceTierCapabilities;
}

/** Host-owned MES custom-field schema/value requests and error formatting. */
export function useMesCustomFieldFormCapabilities():
  | MesCustomFieldFormCapabilities
  | undefined {
  return useContext(MesUiContext)?.customFieldFormCapabilities;
}

/** Host-owned material catalog, category, stock summary and unit dictionary requests. */
export function useMesMaterialTablePickerCapabilities():
  | MesMaterialTablePickerCapabilities
  | undefined {
  return useContext(MesUiContext)?.materialTablePickerCapabilities;
}

/** Host-owned MES ledger export rendering and global pagination policy. */
export function useMesDocumentDetailLedgerCapabilities():
  | MesDocumentDetailLedgerCapabilities
  | undefined {
  return useContext(MesUiContext)?.documentDetailLedgerCapabilities;
}

/** Host-owned current label paper orientation. */
export function useMesLabelLayoutCapabilities():
  | MesLabelLayoutCapabilities
  | undefined {
  return useContext(MesUiContext)?.labelLayoutCapabilities;
}

/** Host-owned MES approval permission decisions and state/actions. */
export function useMesApprovalCapabilities():
  | MesApprovalCapabilities
  | undefined {
  return useContext(MesUiContext)?.approvalCapabilities;
}

/** Host-owned MES BOM cost preview and unit labels. */
export function useMesBomCostSnapshotCapabilities():
  | MesBomCostSnapshotCapabilities
  | undefined {
  return useContext(MesUiContext)?.bomCostSnapshotCapabilities;
}

/** Host-owned MES import template, preview, row, and execution APIs. */
export function useMesImportWorkbenchCapabilities():
  | MesImportWorkbenchCapabilities
  | undefined {
  return useContext(MesUiContext)?.importWorkbenchCapabilities;
}

/** Host-owned equipment/shift queries and equipment type dictionary for scheduling. */
export function useMesAllowedEquipmentPriorityCapabilities():
  | MesAllowedEquipmentPriorityCapabilities
  | undefined {
  return useContext(MesUiContext)?.allowedEquipmentPriorityCapabilities;
}

/** Host-owned document BOM permissions and detailed BOM drawer. */
export function useMesDocumentBomOpenCapabilities():
  | MesDocumentBomOpenCapabilities
  | undefined {
  return useContext(MesUiContext)?.documentBomOpenCapabilities;
}

/** Host-owned services and metadata for MES order-line editing. */
export function useMesOrderItemEditorCapabilities():
  | MesOrderItemEditorCapabilities
  | undefined {
  return useContext(MesUiContext)?.orderItemEditorCapabilities;
}
