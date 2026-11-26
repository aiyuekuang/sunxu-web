import type { UnitLabelMap } from '../../utils/qty-unit';

export type ReportLogType = 'report' | 'revoke';
export type ReportLogPieceworkQtyBasis = 'product_qty' | 'operation_report_qty';
export type ReportLogTimeSource = 'manual' | 'session' | 'iot' | 'derived';
export type ReportLogScrapStatus =
  | 'pending_quality'
  | 'mixed'
  | 'confirmed'
  | 'cancelled';

export interface ReportLogPayPreview {
  visible: boolean;
  payMode: 'none' | 'piece' | 'time';
  priceConfigured: boolean;
  unitPrice?: number;
  unitName?: string;
  estimatedAmount?: number;
  message?: string;
}

/** The fields consumed by the host report-log detail view. */
export interface ReportLogDetailRecord {
  id: string;
  type: ReportLogType;
  completedQty: number;
  scrappedQty: number;
  createdAt: string;
  workOrderId: string;
  reportedBy: string;
  operationId?: string;
  scheduleEntryId?: string;
  operationName?: string;
  quantityRole?: string;
  executionQty?: number;
  executionUnit?: string;
  reportedOperationQty?: number;
  reportedOperationUnit?: string;
  convertedCompletedQty?: number;
  convertedScrappedQty?: number;
  batchNo?: string;
  equipmentName?: string;
  timeSource?: ReportLogTimeSource;
  equipmentSessionId?: string;
  workCenterId?: string;
  payPreview?: ReportLogPayPreview;
  durationMinutes?: number;
  isAuxiliary?: boolean;
  pieceworkQtyBasisSnapshot?: ReportLogPieceworkQtyBasis;
  zeroQuantityReason?: string;
  executionReason?: string;
  scrapReason?: string;
  scrapPhotoUrls?: string[];
  photoUrls?: string[];
  startedAt?: string;
  endedAt?: string;
  occurredAt?: string;
  productionScrapId?: string;
  productionScrapNo?: string;
  productionScrapStatus?: ReportLogScrapStatus;
  productionScrapResolvedScrapQty?: number;
  productionScrapResolvedNonScrapQty?: number;
  productionScrapResolvedConcessionQty?: number;
  productionScrapPendingQty?: number;
  remark?: string;
  reporterName?: string;
  orderNo?: string;
  workOrderStatus?: string;
  materialName?: string;
  materialCode?: string;
  materialSpec?: string;
  materialUnit?: string;
}

export interface ReportLogStatusOption {
  text: string;
  color?: string;
}

export type ReportLogStatusDictionary = Readonly<
  Record<string, ReportLogStatusOption | undefined>
>;

export interface ReportLogDetailStatusDictionaries {
  workOrder: ReportLogStatusDictionary;
  productionScrap: ReportLogStatusDictionary;
  quantityRole: ReportLogStatusDictionary;
  timeSource: ReportLogStatusDictionary;
  pieceworkQtyBasis: ReportLogStatusDictionary;
}

export interface ReportLogScrapRatePresentation {
  text: string;
  color?: string;
}

export interface ReportLogScrapRateInput {
  type: ReportLogType;
  completedQty: number;
  scrappedQty: number;
}

export interface ReportLogDetailDrawerProps {
  open: boolean;
  record: ReportLogDetailRecord | null;
  materialUnitLabelMap: UnitLabelMap;
  operationUnitLabelMap: UnitLabelMap;
  statusDictionaries: ReportLogDetailStatusDictionaries;
  canViewProductionScrap: boolean;
  formatDateTimeSeconds: (value?: string | null) => string;
  formatPayPreviewText: (value?: ReportLogPayPreview | null) => string;
  getScrapRatePresentation: (
    input: ReportLogScrapRateInput,
  ) => ReportLogScrapRatePresentation | null;
  navigate: (path: string) => void;
  onClose: () => void;
}

export type { UnitLabelMap };
