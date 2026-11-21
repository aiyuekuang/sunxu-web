import type { ColumnsType } from 'antd/es/table';
import type { ModalProps } from 'antd';
import type { ReactNode } from 'react';
import type { DocumentLineCustomFieldSchema } from './document-line-custom-field-types';
import type { ResizableTableProps } from './ResizableTable';
import type { WorkOrderFieldHelpProps, WorkOrderSelectRequest } from './work-order-report-types';

export type MaterialShortageSupplyBizType = 'replenish' | 'return';
export type MaterialShortageSupplyAction = 'execute' | 'cancel' | 'reverse';

export interface MaterialShortageMaterial {
  id?: string;
  name?: string | null;
  code?: string | null;
  spec?: string | null;
  unit?: string | null;
}

export interface MaterialShortageWarehouse {
  id?: string;
  name?: string | null;
}

export interface MaterialShortageLineCapabilities {
  canChangeQuantity?: boolean;
  canDelete?: boolean;
  canCustomize?: boolean;
  canSubstitute?: boolean;
}

export interface MaterialShortageRequirement {
  id: string;
  materialId?: string | null;
  material?: MaterialShortageMaterial | null;
  requiredQty?: number | string | null;
  issuedQty?: number | string | null;
  returnedQty?: number | string | null;
  issueMode?: string | null;
  warehouse?: MaterialShortageWarehouse | null;
  lineSideWarehouse?: MaterialShortageWarehouse | null;
  requiredGrade?: string | null;
  requiredSupplierId?: string | null;
  lineCapabilities?: MaterialShortageLineCapabilities | null;
}

export interface MaterialReadinessItem {
  materialReqId: string;
  sufficient: boolean;
  netRequired?: number | string | null;
  sourceAvailable?: number | string | null;
  lineSideAvailable?: number | string | null;
  pendingSupplyQty?: number | string | null;
  pendingReturnQty?: number | string | null;
  readyStatus: string;
  nextActionHint?: string | null;
}

export interface MaterialReadinessResult {
  ready: boolean;
  message?: string | null;
  items?: MaterialReadinessItem[];
}

export interface MaterialShortageProductionPlan {
  id: string;
  planNo: string;
  status?: string | null;
  customerId?: string | null;
  planStartDate?: string | null;
  priority?: number | null;
  saleOrderId?: string | null;
  saleOrderItemId?: string | null;
}

export interface MaterialShortageSupplyItem {
  id: string;
  materialId?: string | null;
  material?: MaterialShortageMaterial | null;
  sourceWarehouse?: MaterialShortageWarehouse | null;
  lineSideWarehouse?: MaterialShortageWarehouse | null;
  plannedQty?: number | string | null;
  actualQty?: number | string | null;
  batchNo?: string | null;
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MaterialShortageSupplyOrder {
  id: string;
  supplyNo: string;
  bizType?: MaterialShortageSupplyBizType | string | null;
  status?: string | null;
  operation?: { sequence: number; operationName: string } | null;
  remarks?: string | null;
  createdAt?: string | null;
  availableActions?: MaterialShortageSupplyAction[] | null;
  items?: MaterialShortageSupplyItem[];
}

export interface WorkOrderMaterialShortageDetail {
  id: string;
  status?: string | null;
  bomHeaderId?: string | null;
  bomHeader?: { id?: string } | null;
  planId?: string | null;
  plan?: MaterialShortageProductionPlan | null;
  materialId?: string | null;
  material?: MaterialShortageMaterial | null;
  materialRequisitions?: MaterialShortageRequirement[];
  plannedQty?: number | string | null;
  planStartTime?: string | null;
  planEndTime?: string | null;
  dueDate?: string | null;
  priority?: number | string | null;
  customerId?: string | null;
  customer?: { id?: string; name?: string | null } | null;
  routeId?: string | null;
  route?: { id?: string } | null;
  description?: string | null;
}

export interface MaterialShortagePriceTier {
  id: string;
  grade?: string | null;
  supplierModelCode?: string | null;
  supplierMaterialCode?: string | null;
  supplier?: { name?: string | null } | null;
}

export interface MaterialShortageCustomFieldCarrier {
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
}

export interface MaterialShortageCapabilities {
  permissions: {
    productionSupplyView: boolean;
    printJobSubmit: boolean;
    printJobView: boolean;
    productionSupplyCreate: boolean;
    productionSupplyExecute: boolean;
    productionSupplyCancel: boolean;
    productionSupplyReverse: boolean;
    materialRequirementUpdate: boolean;
    materialRequirementDelete: boolean;
    workOrderSourcingResolve: boolean;
    workOrderSourcingOverride: boolean;
    mrpListOrCalculate: boolean;
    planView: boolean;
    workOrderUpdate: boolean;
    planList: boolean;
    planCreate: boolean;
  };
  materialGradeLabelMap: Readonly<Record<string, string>>;
  unitLabelMap: Readonly<Record<string, string>>;
  customFieldSchema: DocumentLineCustomFieldSchema | null;
  scrollableModalProps: ModalProps;
  statusMaps: {
    plan: Readonly<Record<string, { text: string; color?: string }>>;
    issueMode: Readonly<Record<string, { text: string; color?: string }>>;
    materialReady: Readonly<Record<string, { text: string; color?: string }>>;
    supplyStatus: Readonly<Record<string, { text: string; color?: string }>>;
    supplyBizType: Readonly<Record<string, { text: string; color?: string }>>;
  };
  isMrpEligiblePlanStatus: (status?: string | null) => boolean;
  statusColor: (value: string, map: Readonly<Record<string, { text: string; color?: string }>>) => string;
  formatUnitLabel: (unit?: string | null, labels?: Readonly<Record<string, string>>) => string;
  normalizeDateOnlyValue: (value: unknown) => string | undefined;
  normalizeDatePickerValue: (value: unknown) => string | undefined;
  requestEffectiveRouteOptions: (params: { keyWords?: string; materialId?: string; routeSelectionDate?: unknown }) => Promise<Array<{ label: string; value: string }>>;
  requestCustomerOptions: WorkOrderSelectRequest;
  requestProductionPlanList: (params: { page: number; pageSize: number; keyword?: string; materialId?: string | null; statuses?: string[] }) => Promise<{ list?: MaterialShortageProductionPlan[]; total?: number }>;
  createProductionPlan: (params: { materialId: string; plannedQty: number; planStartDate?: string; planEndDate?: string; dueDate?: string; priority: number; customerId?: string; bomHeaderId?: string; routeId?: string; description?: string }) => Promise<{ id: string }>;
  updateWorkOrder: (params: { id: string; planId?: string }) => Promise<unknown>;
  checkMaterialReadiness: (params: { workOrderId: string }) => Promise<MaterialReadinessResult>;
  listProductionSupplyOrders: (params: { workOrderId: string; page: number; pageSize: number }) => Promise<{ list?: MaterialShortageSupplyOrder[]; total?: number }>;
  getProductionSupplyOrder: (params: { id: string }) => Promise<MaterialShortageSupplyOrder>;
  createProductionSupplyOrder: (params: { bizType: MaterialShortageSupplyBizType; workOrderId: string; items: Array<{ materialReqId: string; plannedQty: number; batchNo?: string } & MaterialShortageCustomFieldCarrier>; remarks?: string }) => Promise<unknown>;
  executeProductionSupplyOrder: (params: { id: string; businessDate?: string; items: Array<{ itemId: string; actualQty: number; batchNo?: string } & MaterialShortageCustomFieldCarrier> }) => Promise<unknown>;
  cancelProductionSupplyOrder: (params: { id: string }) => Promise<unknown>;
  reverseProductionSupplyOrder: (params: { id: string; businessDate?: string; reason: string }) => Promise<unknown>;
  deleteRequirementLine: (params: { materialReqId: string }) => Promise<unknown>;
  changeRequirementQuantity: (params: { materialReqId: string; requiredQty: number; reason?: string }) => Promise<unknown>;
  resolveWorkOrderSourcing: (params: { workOrderId: string }) => Promise<{ total: number; resolved: number; skippedIssued: number }>;
  overrideWorkOrderSourcing: (params: { materialReqId: string; requiredPriceTierId: string; reason: string }) => Promise<unknown>;
  listSupplierPriceTiers: (params: { page: number; pageSize: number; keyword?: string; materialId: string; supplierId?: string; status: 'active' }) => Promise<{ list?: MaterialShortagePriceTier[] }>;
  requestSupplyLineCustomFieldColumns: (schema: DocumentLineCustomFieldSchema | null) => ColumnsType<MaterialShortageSupplyItem>;
  buildCustomValuePayload: (carrier: MaterialShortageCustomFieldCarrier | undefined, schema: DocumentLineCustomFieldSchema | null) => MaterialShortageCustomFieldCarrier | null;
  renderPrintActionNode: ReactNode;
  openPrintBatch: (records: Array<{ businessType: string; businessId: string; templateType: string }>) => Promise<unknown>;
  openPrintRecords: (params: { businessType: string; businessId: string; title: string }) => Promise<unknown>;
  navigate: (path: string) => void;
  getAutoFieldHelpProps: (label: string) => WorkOrderFieldHelpProps;
  getProductionFieldHelpProps: (label: string, fieldName: string) => WorkOrderFieldHelpProps;
  getErrorMessage: (error: unknown, fallback: string) => string;
  notify: { success: (message: string) => void; warning: (message: string) => void; error: (message: string) => void };
}

export type MaterialShortageRequirementRow = MaterialShortageRequirement & {
  readiness?: MaterialReadinessItem;
  replenishableQty: number;
  returnableQty: number;
  netIssuedQty: number;
};

export type MaterialShortageSupplyColumns = ResizableTableProps<MaterialShortageSupplyOrder>['columns'];
