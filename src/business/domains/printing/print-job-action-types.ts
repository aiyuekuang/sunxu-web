import type {
  PaperProfile,
  PrintBusiness,
  PrintSceneOptions,
  PrintTemplate,
  PrintTemplateType,
} from './print-options';

export interface PrintJobActionParams {
  businessType: string;
  businessId: string;
  templateType?: PrintTemplateType;
  templateId?: string;
  copyCount?: number;
  /** Serial labels are rendered one per selected finished-good serial number. */
  serialIds?: string[];
}

export interface PrintRecordQueryParams {
  businessType: string;
  businessId: string;
  title?: string;
}

export interface PrintJobPaperProfile extends PaperProfile {
  orientation?: 'portrait' | 'landscape';
  preferredPrinterName?: string | null;
}

export interface PrintJobBusiness extends PrintBusiness {
  defaultTemplateType: PrintTemplateType;
}

export interface PrintJobTemplate extends Omit<PrintTemplate, 'currentVersion'> {
  templateType?: PrintTemplateType;
  paperProfileId?: string | null;
  paperProfile?: PrintJobPaperProfile | null;
  currentVersion?: { versionNo?: number | string | null } | null;
}

export interface PrintJobSceneOptions
  extends Omit<PrintSceneOptions, 'business' | 'templates' | 'paperProfiles'> {
  business: PrintJobBusiness;
  templates: PrintJobTemplate[];
  paperProfiles: PrintJobPaperProfile[];
  templateType?: PrintTemplateType;
}

export interface PrintJobPrintOptionsCapabilities {
  getSceneOptions: (params: {
    businessType: string;
    templateType?: PrintTemplateType;
  }) => Promise<PrintJobSceneOptions>;
}

export interface PrintJobRecord {
  id: string;
  businessType: string;
  businessId: string;
  status?: string;
  createdAt?: string | null;
  printedAt?: string | null;
  copyCount?: number | null;
  reprintOfJobId?: string | null;
  reprintReason?: string | null;
  template?: { name?: string | null } | null;
  templateVersion?: { versionNo?: number | string | null } | null;
  paperProfile?: PrintJobPaperProfile | null;
  renderSnapshotJson?: Record<string, unknown> | null;
  templateSnapshotJson?: Record<string, unknown> | null;
  dataSnapshotJson?: Record<string, unknown> | null;
}

export interface PrintJobBatchFailure {
  params: PrintJobActionParams;
  message: string;
}

export interface PrintJobListParams {
  page: number;
  pageSize: number;
  businessType: string;
  businessId: string;
}

export interface PrintJobActionMessages {
  info(content: string): void;
  warning(content: string): void;
  error(content: string): void;
  success(content: string): void;
}

export interface PrintJobStatusPresentation {
  text: string;
  color?: string;
}

export interface PrintJobActionCapabilities {
  /** Print option loading is supplied by the host; this component only adapts it to UI. */
  printOptions: PrintJobPrintOptionsCapabilities;
  /** Permission results are computed by the host and never inferred from permission codes here. */
  permissions: {
    canDownloadPdf: boolean;
    canConfirmPrinted: boolean;
    canReprint: boolean;
  };
  messages: PrintJobActionMessages;
  submitPrintJob: (params: PrintJobActionParams) => Promise<PrintJobRecord>;
  listPrintJobs: (
    params: PrintJobListParams,
  ) => Promise<{ list?: PrintJobRecord[] }>;
  getPrintJobDetail: (params: { id: string }) => Promise<PrintJobRecord>;
  confirmPrintJob: (params: { id: string; message: string }) => Promise<PrintJobRecord>;
  downloadPrintJobPdf: (params: { id: string }) => Promise<unknown>;
  requestPrintJobReprint: (params: {
    id: string;
    reprintReason: string;
  }) => Promise<PrintJobRecord>;
  /** The host owns state meaning and visible status wording. */
  isRendered: (record: PrintJobRecord) => boolean;
  isPrinted: (record: PrintJobRecord) => boolean;
  getStatusPresentation: (status?: string) => PrintJobStatusPresentation;
  /** Preserve host-specific filenames without embedding business rules in the library. */
  getPdfFilename?: (record: PrintJobRecord) => string;
  /** Sanitize trusted server-rendered markup before it reaches srcDoc or document.write. */
  sanitizeRenderedHtml: (html: string) => string;
  formatDateTime: (value?: string | null) => string;
  /** Mirrors the previous ActionType.reload integration point. */
  onReload?: () => void;
  onRecordsChanged?: (records: PrintJobRecord[]) => void;
  onPrintJobsCreated?: (
    records: PrintJobRecord[],
    failures: PrintJobBatchFailure[],
  ) => void;
}

export interface PrintJobActionReloadRef {
  current?: { reload?: () => unknown } | null;
}
