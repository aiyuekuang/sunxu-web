import type { FormItemProps, ModalProps } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import type { ReactNode } from 'react';
import type { MesStatusEnum } from './StatusDisplay';

export type QualityInspectionType = 'iqc' | 'ipqc' | 'fqc' | 'oqc';
export type QualityInspectionRecordType = 'first' | 'process' | 'last' | 'other';
export type QualityInspectionResultType =
  | 'numeric'
  | 'judgement'
  | 'selection'
  | 'text';

export interface QualityInspectionItemRecord {
  id: string;
  itemName: string;
  resultType: QualityInspectionResultType;
  requiredMeasurementCount?: number | null;
  photoRequired: boolean;
  isRequired: boolean;
  standard?: string | null;
  upperLimit?: number | null;
  lowerLimit?: number | null;
  unit?: string | null;
  options?: string[] | null;
  acceptedValues?: string[] | null;
}

export interface QualityInspectionDefectRecord {
  id: string;
  qty: number;
}

export interface QualityInspectionRecheckSource {
  id: string;
  sequenceNo: number;
  recordType: string;
}

export type QualitySubmitFormFieldValue =
  | string
  | number
  | number[]
  | boolean
  | UploadFile[]
  | Record<string, unknown>
  | undefined;

export type QualityInspectionSubmitFormValues = Record<
  string,
  QualitySubmitFormFieldValue
>;

export interface QualityInspectionSubmitItemPayload {
  id: string;
  photoUrls?: string[];
  measuredValue?: string;
  measuredValues?: number[];
  isPassed?: boolean;
  remarks?: string;
  [key: string]: unknown;
}

export interface QualityInspectionSubmitRecordPayload {
  id: string;
  recordType?: QualityInspectionRecordType;
  recheckOfRecordId?: string;
  operatorId?: string;
  sampleQty: number;
  passQty: number;
  failQty: number;
  remarks?: string;
  items: QualityInspectionSubmitItemPayload[];
}

export interface QualityInspectionDefectCreatePayload {
  inspectionId: string;
  defectCode?: string;
  description: string;
  qty: number;
  severity: string;
  remarks?: string;
}

export type QualityInspectionHelpField =
  | 'defectCode'
  | 'defectDescription'
  | 'defectQty'
  | 'defectSeverity'
  | 'defectRemarks'
  | 'sampleQty'
  | 'passQty'
  | 'failQty'
  | 'conclusion'
  | 'inspectionRemarks';

export type QualityInspectionFieldHelpProps = Pick<
  FormItemProps,
  'label' | 'tooltip'
>;

export interface QualityInspectionDictionaryFieldProps {
  field: 'defectCode' | 'severity';
  name: string;
  label: string;
  typeCode: string;
  fieldHelpProps: QualityInspectionFieldHelpProps;
  placeholder?: string;
  showSearch?: boolean;
  required?: boolean;
  requiredMessage?: string;
}

export interface QualityInspectionDefectModalCapabilities {
  inspectionQtyMin: number;
  addDefect: (
    payload: QualityInspectionDefectCreatePayload,
  ) => Promise<QualityInspectionDefectRecord>;
  renderDictionarySelect: (
    props: QualityInspectionDictionaryFieldProps,
  ) => ReactNode;
  getFieldHelpProps: (
    field: QualityInspectionHelpField,
  ) => QualityInspectionFieldHelpProps;
  notifySuccess: (message: string) => void;
}

export interface QualityInspectionDefectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspectionId: string;
  initialQty?: number;
  onSuccess: (
    defect: QualityInspectionDefectRecord,
  ) => void | Promise<void>;
  capabilities: QualityInspectionDefectModalCapabilities;
}

export interface QualityInspectionDefectCoverage {
  requiredQty: number;
  recordedQty: number;
  missingQty: number;
  isCovered: boolean;
}

export interface QualityInspectionSubmitCapabilities {
  /** Adapts the host's authoritative quality calculation and validation helpers. */
  inspectionQtyMin: number;
  normalizeInspectionQty: (value: unknown) => number | undefined;
  deriveInspectionQuantitiesFromPass: (params: {
    sampleQty?: unknown;
    passQty?: unknown;
  }) => Partial<Record<'passQty' | 'failQty', number | undefined>>;
  isInspectionQtyClosed: (
    sampleQty: number,
    passQty: number,
    failQty: number,
  ) => boolean;
  hasCompleteInspectionQuantities: (params: {
    sampleQty?: unknown;
    passQty?: unknown;
    failQty?: unknown;
  }) => boolean;
  deriveInspectionConclusion: (params: {
    passQty: number;
    failQty: number;
    hasFailedItem: boolean;
  }) => 'passed' | 'rejected';
  hasAutomaticInspectionJudgement: (
    item: QualityInspectionItemRecord,
  ) => boolean;
  evaluateInspectionItem: (
    item: QualityInspectionItemRecord,
    measuredValue?: string | number | null,
  ) => boolean | undefined;
  getRequiredMeasurementCount: (item: QualityInspectionItemRecord) => number;
  summarizeDefectCoverage: (
    failQty: unknown,
    defects: QualityInspectionDefectRecord[],
  ) => QualityInspectionDefectCoverage;
  isProcessRecordType: (
    value: unknown,
  ) => value is QualityInspectionRecordType;

  /** Host services and side effects. */
  uploadInspectionImages: (files: File[]) => Promise<string[]>;
  buildItemCustomValuePayload: (
    carrier: unknown,
    schema?: unknown,
  ) => Record<string, unknown> | undefined;
  submitRecord: (
    payload: QualityInspectionSubmitRecordPayload,
  ) => Promise<void>;
  requestUsers: (
    params?: Record<string, unknown>,
  ) => Promise<Array<{ label: string; value: string }>>;
  notifyError: (message: string) => void;
  notifySuccess: (message: string) => void;

  /** Host UI adapters for help copy, dictionaries, and template-specific item fields. */
  getFieldHelpProps: (
    field: QualityInspectionHelpField,
  ) => QualityInspectionFieldHelpProps;
  renderDictionarySelect: (
    props: QualityInspectionDictionaryFieldProps,
  ) => ReactNode;
  renderInspectionItemFields: (
    items: QualityInspectionItemRecord[],
    lineCustomFieldSchema?: unknown | null,
  ) => ReactNode;
  inspectionTypeLabels: Readonly<Record<string, string | undefined>>;
  conclusionEnum: MesStatusEnum;
  scrollableModalProps: Pick<ModalProps, 'centered' | 'styles'>;
  defectModal: QualityInspectionDefectModalCapabilities;
}

export interface QualityInspectionSubmitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspectionId: string;
  inspectionType: QualityInspectionType;
  recheckSource?: QualityInspectionRecheckSource | null;
  items: QualityInspectionItemRecord[];
  defects: QualityInspectionDefectRecord[];
  initialValues: QualityInspectionSubmitFormValues;
  lineCustomFieldSchema?: unknown | null;
  onDefectsChange: () => void | Promise<void>;
  onSuccess: () => void | Promise<void>;
  capabilities: QualityInspectionSubmitCapabilities;
}
