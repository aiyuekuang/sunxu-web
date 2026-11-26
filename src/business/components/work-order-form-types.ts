import type { ReactNode } from 'react';
import type { FormItemProps } from 'antd';
import type { ProFormSelectProps } from '@ant-design/pro-components';
import type { FilterableSelectRequestFn } from './material-select-types';
import type { WorkOrderReportUser } from './work-order-report-types';

export interface WorkOrderDetailRecord {
  id: string;
  status: string;
  materialId?: string | null;
  material?: { id?: string | null } | null;
  plannedQty?: number | null;
  priority?: number | null;
  planStartTime?: string | null;
  planEndTime?: string | null;
  routeId?: string | null;
  bomHeaderId?: string | null;
  bomCostSnapshot?: unknown;
  assigneeId?: string | null;
  assignee?: WorkOrderReportUser | null;
  customerId?: string | null;
  customer?: { id?: string | null } | null;
  receiptWarehouseId?: string | null;
  dueDate?: string | null;
  drawingUrls?: string[] | null;
  description?: string | null;
  plan?: { saleOrderId?: string | null; saleOrderItemId?: string | null } | null;
}

export interface WorkOrderListRiskSummary {
  overdueMinutes?: number;
  dueInMinutes?: number;
}

export type WorkOrderRiskTag =
  | 'urgent'
  | 'due_today'
  | 'due_soon'
  | 'overdue'
  | 'material_shortage'
  | 'quality_blocked'
  | 'pending_finished_inbound'
  | 'schedule_unconfirmed'
  | 'paused';

export type WorkOrderProgressNodeStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'blocked';

export interface WorkOrderProgressNode {
  operationId: string;
  operationName: string;
  sequence: number;
  percent: number;
  reportedQty: number;
  plannedQty: number;
  status: WorkOrderProgressNodeStatus;
}

export interface WorkOrderListProgressSummary {
  overallPercent?: number;
  completedOperationCount?: number;
  operationCount?: number;
  currentOperationIds?: string[];
  nodes?: WorkOrderProgressNode[];
}

export interface WorkOrderListExecutionRecord {
  isOverdue?: boolean;
  overallProgress?: number;
  riskSummary?: { tags?: WorkOrderRiskTag[]; overdueMinutes?: number; dueInMinutes?: number };
  progressSummary?: WorkOrderListProgressSummary;
}

export interface WorkOrderFormValues extends Record<string, unknown> {
  materialId?: string;
  plannedQty?: number;
  priority?: number;
  planStartTime?: string | Date | null;
  planEndTime?: string | Date | null;
  routeId?: string;
  bomHeaderId?: string;
  bomCostSnapshot?: unknown;
  assigneeId?: string;
  customerId?: string;
  receiptWarehouseId?: string | null;
  dueDate?: string | Date | null;
  drawingUrls?: string[];
  description?: string;
  status?: string;
}

export interface WorkOrderFormFieldsCapabilities {
  currentUser: WorkOrderReportUser | null;
  requirePlanStartTimeOnManualCreate: boolean;
  getAutoFieldHelpProps: (label: string) => WorkOrderFormFieldHelpProps;
  getProductionFieldHelpProps: (label: string, fieldName: string) => WorkOrderFormFieldHelpProps;
  requestMaterialOptions: FilterableSelectRequestFn;
  requestRouteOptions: (params: {
    keyWords?: string;
    materialId: string;
    routeSelectionDate?: unknown;
  }) => Promise<Array<{ label: string; value: string }>>;
  requestCustomerOptions: NonNullable<ProFormSelectProps['request']>;
  requestUserOptions: NonNullable<ProFormSelectProps['request']>;
  requestReceiptWarehouseOptions: (
    params: { keyWords?: string },
    materialId: string,
  ) => Promise<Array<{ label: string; value: string }>>;
  renderConfigEntryFieldLabel?: (params: {
    target: 'processRoute' | 'customer' | 'warehouse';
    children: ReactNode;
    show: boolean;
    onOpen: () => void;
  }) => ReactNode;
  openConfiguration?: (target: 'processRoute' | 'customer' | 'warehouse') => void;
}

/** Form item metadata is spread onto ProForm controls; its children render callback belongs to Form.Item only. */
export type WorkOrderFormFieldHelpProps = Omit<
  Partial<FormItemProps>,
  'children'
>;

export interface WorkOrderFormDrawerCapabilities extends WorkOrderFormFieldsCapabilities {
  createWorkOrder: (values: WorkOrderFormValues) => Promise<{ id: string }>;
  updateWorkOrder: (values: Record<string, unknown>) => Promise<void>;
  getWorkOrderDetailsHref: (workOrderId: string) => string;
  openWorkOrderDetails: (workOrderId: string) => void;
  getErrorMessage: (error: unknown, fallback: string) => string;
}

export interface WorkOrderFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: WorkOrderDetailRecord | null;
  onSuccess?: () => void;
  capabilities: WorkOrderFormDrawerCapabilities;
}

export interface WorkOrderFormFieldsProps {
  record: WorkOrderDetailRecord | null;
  capabilities: WorkOrderFormFieldsCapabilities;
}
