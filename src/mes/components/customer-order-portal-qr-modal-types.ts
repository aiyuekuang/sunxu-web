import type { ReactNode } from 'react';

export interface CustomerOrderPortalCustomer {
  id: string;
  customerCode?: string | null;
  name: string;
}

export interface CustomerOrderPortalQrToken {
  url: string;
  inventoryVisible: boolean;
}

export interface CustomerOrderPortalConfig {
  shippedVisibleDays?: number | null;
  maxVisibleOrders?: number | null;
  visibleFields?: string[] | null;
}

export interface CustomerOrderPortalConfigFormValues {
  shippedVisibleDays: number;
  maxVisibleOrders: number;
  visibleFields: string[];
}

export interface CustomerOrderPortalFieldOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface CustomerOrderPortalQrRendererOptions {
  size: number;
  level: 'M';
  marginSize: number;
}

export interface CustomerOrderPortalQrModalLabels {
  title: string;
  qrImageDescription: string;
  privacyNotice: string;
  inventoryHeading: string;
  inventoryPermission: string;
  saveInventoryPermission: string;
  configHeading: string;
  shippedVisibleDays: string;
  shippedVisibleDaysRequired: string;
  daysSuffix: string;
  maxVisibleOrders: string;
  maxVisibleOrdersRequired: string;
  visibleFields: string;
  visibleFieldsRequired: string;
  saveConfig: string;
  refreshQr: string;
  regenerateQr: string;
  regenerateWarning: string;
  confirmRegenerate: string;
  cancel: string;
}

export interface CustomerOrderPortalQrModalMessages {
  operationFailed: string;
  updateSuccess: string;
}

export interface CustomerOrderPortalQrModalCapabilities {
  permissions: {
    canViewConfig: boolean;
    canUpdateConfig: boolean;
    canManageInventoryVisibility: boolean;
  };
  /** Public origin comes from the host deployment/environment. */
  publicOrigin: string;
  /** Host owns relative URL resolution, origin policy, and any path rewriting. */
  normalizePortalUrl: (url: string, publicOrigin: string) => string;
  /** Host/peer adapter owns QR encoding and rendering; the library has no QR dependency. */
  renderQr: (
    value: string,
    options: CustomerOrderPortalQrRendererOptions,
  ) => ReactNode;
  generateQr: (customerId: string) => Promise<CustomerOrderPortalQrToken>;
  regenerateQr: (customerId: string) => Promise<CustomerOrderPortalQrToken>;
  loadConfig: () => Promise<CustomerOrderPortalConfig>;
  updateConfig: (
    values: CustomerOrderPortalConfigFormValues,
  ) => Promise<CustomerOrderPortalConfig>;
  updateInventoryVisibility: (
    customerId: string,
    inventoryVisible: boolean,
  ) => Promise<{ inventoryVisible: boolean }>;
  defaultConfigValues: CustomerOrderPortalConfigFormValues;
  fieldOptions: readonly CustomerOrderPortalFieldOption[];
  constraints: {
    shippedVisibleDaysMin: number;
    shippedVisibleDaysMax: number;
    shippedVisibleDaysPrecision: number;
    maxVisibleOrdersMin: number;
    maxVisibleOrdersMax: number;
    maxVisibleOrdersPrecision: number;
    minimumVisibleFields: number;
  };
  qrRendererOptions: CustomerOrderPortalQrRendererOptions;
  labels: CustomerOrderPortalQrModalLabels;
  messages: CustomerOrderPortalQrModalMessages;
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
}

export interface CustomerOrderPortalQrModalProps {
  open: boolean;
  customer: CustomerOrderPortalCustomer | null;
  onOpenChange: (open: boolean) => void;
  capabilities: CustomerOrderPortalQrModalCapabilities;
}
