export type ReportDynamicRequiredInput =
  | 'batchNo'
  | 'scheduleEntryId'
  | 'zeroQuantityReason'
  | 'scrapReason'
  | 'abnormalDurationConfirmed';

export interface ReportScheduleOption {
  id: string;
  label: string;
  remainingQty?: number | null;
}

export interface ReportDynamicPrecheck {
  quantityInputMode?: string | null;
  operationReportUnit?: string | null;
  requiredInputs?: readonly ReportDynamicRequiredInput[];
  batchOptions?: readonly string[];
  scheduleOptions?: readonly ReportScheduleOption[];
}

export interface ReportDynamicFieldsProps {
  precheck: ReportDynamicPrecheck | null;
  formatNumber: (
    value: number,
    options: { maximumFractionDigits: number },
  ) => string;
}
