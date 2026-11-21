import type { ReactNode } from 'react';
import type { UnitLabelMap } from '../utils/qty-unit';

export interface ConvertToOrderMaterial {
  id?: string;
  name?: string | null;
  code?: string | null;
  spec?: string | null;
  unit?: string | null;
}

export interface ConvertToOrderRequisitionItem {
  id: string;
  materialId?: string | null;
  material?: ConvertToOrderMaterial | null;
  requiredQty?: number | string | null;
  orderedQty?: number | string | null;
  sortOrder?: number | null;
  expectedArrivalDate?: string | null;
}

export interface ConvertToOrderRequisition {
  id: string;
  prNo: string;
  items?: ConvertToOrderRequisitionItem[] | null;
}

export interface ConvertToOrderSelectionItem {
  requisitionItemId: string;
  orderedQty: number;
  supplierId?: string;
}

export interface ConvertToOrderSourcingCandidateSupplier {
  id: string;
  name: string;
}

export interface ConvertToOrderResolvedItem {
  requisitionItemId: string;
  supplierName: string;
  source: string;
}

export interface ConvertToOrderUnresolvedItem {
  requisitionItemId: string;
  reason: string;
  candidateSuppliers?: ConvertToOrderSourcingCandidateSupplier[] | null;
}

export interface ConvertToOrderSourcingPreview {
  orderCount: number;
  resolvedCount: number;
  unresolvedCount: number;
  groups?: Array<{ items?: ConvertToOrderResolvedItem[] | null }> | null;
  unresolvedItems?: ConvertToOrderUnresolvedItem[] | null;
}

export interface ConvertedPurchaseOrderReference {
  id: string;
  [field: string]: unknown;
}

export interface ConvertToOrderResult {
  orders?: ConvertedPurchaseOrderReference[] | null;
  unresolvedCount?: number | null;
}

export interface ConvertToOrderDrawerCapabilities {
  preview: (request: {
    id: string;
    items: ConvertToOrderSelectionItem[];
  }) => Promise<ConvertToOrderSourcingPreview>;
  convert: (request: {
    id: string;
    items: ConvertToOrderSelectionItem[];
    generateResolvedOnly: true;
  }) => Promise<ConvertToOrderResult>;
  updateArrivalDates: (request: {
    id: string;
    items: Array<{
      requisitionItemId: string;
      expectedArrivalDate: string;
    }>;
  }) => Promise<ConvertToOrderRequisition>;
  requestSupplierOptions: (keyword?: string) => Promise<
    Array<{ label: string; value: string }>
  >;
  notifyWarning: (text: string) => void;
  notifySuccess: (text: string) => void;
  renderFieldHelp: (props: {
    label: ReactNode;
    helpKey: 'requisitionConvertQty';
  }) => ReactNode;
  unitLabelMap: UnitLabelMap;
}

export interface ConvertToOrderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requisition: ConvertToOrderRequisition;
  onSuccess: (orders: ConvertedPurchaseOrderReference[]) => void;
  onRequisitionUpdated?: (requisition: ConvertToOrderRequisition) => void;
  capabilities: ConvertToOrderDrawerCapabilities;
}
