import type { ReactNode } from 'react';

export interface OutsourcingProgressOrderRef {
  id: string;
  orderNo?: string;
  qty?: number;
  unit?: string;
}

export interface OutsourcingOrderStep {
  id: string;
  name: string;
  plannedQty?: number | null;
  latestProcessedQty: number;
  latestQualifiedQty?: number;
  latestDefectQty?: number;
  seq?: number;
}

export interface OutsourcingOrderStepInput {
  id?: string;
  name: string;
  plannedQty?: number;
}

export interface OutsourcingProgressReport {
  id: string;
  stepId?: string | null;
  step?: { id?: string; name?: string } | null;
  processedQty: number;
  qualifiedQty?: number | null;
  defectQty?: number | null;
  reportedAt: string;
  source: 'supplier_scan' | 'internal' | string;
  submitterName?: string | null;
}

export interface OutsourcingProgressReportPage {
  list?: OutsourcingProgressReport[] | null;
}

export interface OutsourcingProgressQrToken {
  token: string;
  expiresAt: string;
  portalUrl?: string;
}

export interface OutsourcingProgressQrRendererOptions {
  size: number;
  level: 'M';
  marginSize: number;
}

export interface OutsourcingProgressDrawerCapabilities {
  /** Host permission result. The drawer remains inspectable while write controls are disabled. */
  canManage: boolean;
  requestSteps: (orderId: string) => Promise<OutsourcingOrderStep[] | null | undefined>;
  requestReports: (params: {
    outsourcingOrderId: string;
    page: 1;
    pageSize: 100;
  }) => Promise<OutsourcingProgressReportPage | null | undefined>;
  generateQr: (orderId: string) => Promise<OutsourcingProgressQrToken>;
  regenerateQr: (orderId: string) => Promise<OutsourcingProgressQrToken>;
  saveSteps: (
    orderId: string,
    steps: OutsourcingOrderStepInput[],
  ) => Promise<unknown>;
  /** Host resolves portalUrl or applies the deployment's public report URL policy. */
  resolveQrUrl: (result: OutsourcingProgressQrToken) => string;
  renderQr: (
    value: string,
    options: OutsourcingProgressQrRendererOptions,
  ) => ReactNode;
  formatDateTime: (value: string | null | undefined) => string;
  notifySuccess: (message: string) => void;
}

export interface OutsourcingProgressDrawerProps {
  open: boolean;
  order: OutsourcingProgressOrderRef | null;
  onClose: () => void;
  capabilities: OutsourcingProgressDrawerCapabilities;
}

export interface OutsourcingProgressFormStep {
  id?: string;
  name?: string;
  plannedQty?: number | null;
}

export interface OutsourcingProgressFormValues {
  steps?: OutsourcingProgressFormStep[];
}
