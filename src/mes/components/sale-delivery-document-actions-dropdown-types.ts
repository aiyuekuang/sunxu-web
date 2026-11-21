import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';

export type SaleDeliveryAction =
  | 'cancel'
  | 'confirm'
  | 'detail'
  | 'edit'
  | 'loading'
  | 'print'
  | 'printContinuous'
  | 'printRecords'
  | 'recallApproval'
  | 'reverse'
  | 'return'
  | 'submitApproval';

export interface SaleDeliveryActionItem {
  unitPrice?: number | string | null;
}

export interface SaleDeliveryActionDetail {
  id: string;
  deliveryNo?: string | null;
  status: string;
  availableActions?: readonly string[] | null;
  items?: readonly SaleDeliveryActionItem[] | null;
}

export interface SaleDeliveryApprovalStatus {
  status: string;
  totalSteps: number;
  canRecall: boolean;
}

export interface SaleDeliveryMenuOption {
  label: ReactNode;
  value: string;
  disabled?: boolean;
}

export interface SaleDeliveryDocumentActionPermissions {
  loadApprovalStatus: boolean;
  edit: boolean;
  confirm: boolean;
  submitApproval: boolean;
  recallApproval: boolean;
  print: boolean;
  printRecords: boolean;
  cancel: boolean;
  reverse: boolean;
  createSaleReturn: boolean;
}

export interface SaleDeliveryPrintRequest {
  businessType: 'sale_delivery';
  businessId: string;
  templateType: 'document_flow' | 'continuous_fixed';
}

export interface SaleDeliveryPrintRecordsRequest {
  businessType: 'sale_delivery';
  businessId: string;
  title: string;
}

export interface SaleDeliveryDocumentActionsCapabilities {
  permissions: SaleDeliveryDocumentActionPermissions;
  loadDetail: (deliveryId: string) => Promise<SaleDeliveryActionDetail | null>;
  loadApprovalStatus: (
    deliveryId: string,
  ) => Promise<SaleDeliveryApprovalStatus | null>;
  cancelDelivery: (request: { id: string }) => Promise<unknown>;
  confirmDelivery: (request: {
    id: string;
    skipCreditCheck?: boolean;
  }) => Promise<unknown>;
  reverseDelivery: (request: { id: string; reason: string }) => Promise<unknown>;
  submitApproval: (request: { id: string }) => Promise<unknown>;
  recallApproval: (request: { id: string }) => Promise<unknown>;
  createSaleReturnFromDelivery: (request: {
    sourceDeliveryId: string;
    reasonCode: string;
  }) => Promise<{ id?: string | null }>;
  returnReasonOptions: readonly SaleDeliveryMenuOption[];
  returnReasonLoading: boolean;
  openPrint: (request: SaleDeliveryPrintRequest) => void;
  openPrintRecords: (request: SaleDeliveryPrintRecordsRequest) =>
    | void
    | Promise<void>;
  printJobActionNode?: ReactNode;
  navigateToSaleReturn: (returnId: string) => void;
  getErrorCode: (error: unknown) => number | undefined;
  getErrorMessage: (error: unknown, fallback?: string) => string;
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
  notifyWarning: (message: string) => void;
  messages: {
    createSuccess: string;
    confirmSuccess: string;
    submitApprovalSuccess: string;
    recallApprovalSuccess: string;
    cancelSuccess: string;
    reverseSuccess: string;
  };
}

export interface SaleDeliveryDocumentActionsDropdownProps {
  deliveryId: string;
  deliveryNo?: string | null;
  /** The detail drawer already owns this document context. */
  hideDetailAction?: boolean;
  onActionSuccess?: () => void;
  onEdit: (deliveryId: string) => void;
  onOpenDetail: (deliveryId: string) => void;
  capabilities: SaleDeliveryDocumentActionsCapabilities;
}

export type SaleDeliveryMenuItems = NonNullable<MenuProps['items']>;
