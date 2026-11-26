export interface WorkOrderTemporaryQrOperation {
  id?: string;
  sequence?: number | string | null;
  operationName?: string | null;
  stageName?: string | null;
  isOutsourced?: boolean | null;
  operationOutputMode?: string | null;
}

export interface WorkOrderTemporaryQrResult {
  token: string;
  portalUrl?: string | null;
  expiresAt: string | Date;
}

export interface WorkOrderTemporaryQrPrintItem {
  operation: WorkOrderTemporaryQrOperation;
  qr: WorkOrderTemporaryQrResult;
}

export interface WorkOrderTemporaryQrPrintCapabilities {
  /** Host-provided origin for temporary-report fallback URLs. */
  origin: string;
  /** Host renders QR markup so this package does not own the QR implementation or runtime dependency. */
  renderQrSvg: (value: string, options: { size: number; level: 'M' }) => string;
  /** The host owns browser/window policy and can expose its allowed print window. */
  openWindow: () => Window | null;
  formatExpiresAt?: (value: string | Date) => string;
}
