import type { ProColumns } from '@ant-design/pro-components';
import type { Dayjs } from 'dayjs';
import type { ReactNode } from 'react';
import type { DocumentLineCustomFieldSchema } from '../documents/document-line-custom-field-types';
import type {
  StockCountLineFormCapabilities,
  StockCountLineFormRow,
} from './stock-count-line-form-list-types';

export type StockCountDateValue = Dayjs | Date | string;

export interface StockCountLineFormValue extends StockCountLineFormRow {
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
}

export interface StockCountLineInputPayload {
  id?: string;
  materialId: string;
  ownerType?: string;
  ownerRefId?: string;
  locationId?: string;
  storageLocation?: string;
  batchNo?: string;
  remarks?: string;
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
}

export interface StockCountSubmitLinePayload {
  id: string;
  actualQty: number;
  remarks?: string;
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
}

export interface StockCountCreateFormValues {
  warehouseId?: string;
  locationId?: string;
  storageLocation?: string;
  countMode?: string;
  countDate?: StockCountDateValue;
  remarks?: string;
  lines?: StockCountLineFormValue[];
}

export interface StockCountCreatePayload {
  warehouseId: string;
  locationId?: string;
  storageLocation?: string;
  countMode?: string;
  countDate?: string;
  remarks?: string;
  lines?: StockCountLineInputPayload[];
}

export interface StockCountDetailLine {
  id: string;
  materialId: string;
  material?: {
    name?: string | null;
    code?: string | null;
    spec?: string | null;
  };
  ownerType: string;
  ownerRefId: string;
  locationId?: string | null;
  location?: { id?: string; pathName?: string | null; name?: string | null };
  storageLocationSnapshot?: string | null;
  batchNo?: string | null;
  bookQty: number;
  reservedQty: number;
  frozenQty: number;
  actualQty?: number | null;
  varianceQty?: number | null;
  inputActualQty?: number | null;
  remarks?: string | null;
  inputRemarks?: string;
  adjustTransactionId?: string | null;
  adjustTransaction?: { transactionNo?: string | null };
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
}

export interface StockCountDetailModel {
  id: string;
  countNo: string;
  status: string;
  countMode: string;
  warehouseId: string;
  warehouse?: { name?: string | null };
  locationId?: string | null;
  location?: { id?: string; pathName?: string | null; name?: string | null };
  storageLocationSnapshot?: string | null;
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
  countDate: string;
  availableActions?: readonly string[];
  lines?: StockCountDetailLine[];
}

export interface StockCountStatusPresentation {
  label: string;
  color: string;
}

export interface StockCountOwnerPresentation {
  label: string;
  color: string;
}

export interface StockCountCreateLabels {
  title: string;
  infoMessage: string;
  infoDescription: string;
  warehouse: string;
  warehouseRequired: string;
  location: string;
  countMode: string;
  countModeRequired: string;
  countDate: string;
  remarks: string;
  manualLinesTitle: string;
  createdSuccess: string;
}

export interface StockCountCreateCapabilities {
  permissions: { canCreate: boolean };
  defaultCountMode: string;
  countModeOptions: readonly { label: string; value: string }[];
  getCurrentCountDate: () => Dayjs;
  lineCustomFieldSchema: DocumentLineCustomFieldSchema | null | undefined;
  /** StockCountLineFormList also needs BusinessUiProvider.materialTablePickerCapabilities. */
  lineFormCapabilities: StockCountLineFormCapabilities<StockCountLineFormValue>;
  renderWarehouseField: (props: {
    name: 'warehouseId';
    label: string;
    requiredMessage: string;
  }) => ReactNode;
  renderLocationField: (props: {
    name: 'locationId';
    textName: 'storageLocation';
    label: string;
    warehouseId?: string;
  }) => ReactNode;
  buildCreatePayload: (
    values: StockCountCreateFormValues,
    schema: DocumentLineCustomFieldSchema | null | undefined,
  ) => StockCountCreatePayload;
  createStockCount: (
    payload: StockCountCreatePayload,
  ) => Promise<StockCountDetailModel>;
  labels: StockCountCreateLabels;
  notifySuccess: (message: string) => void;
}

export interface CreateStockCountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (detail: StockCountDetailModel) => void;
  capabilities: StockCountCreateCapabilities;
}

export type StockCountBusinessDateFieldName = 'businessDate';

export interface StockCountBusinessDateFieldSlotProps {
  name: StockCountBusinessDateFieldName;
  label: string;
  extra: string;
  required: true;
  initialValue: Dayjs;
  disabledDate: (date: Dayjs) => boolean;
}

export interface StockCountDetailLabels {
  emptyTitle: string;
  countTitle: (countNo: string) => string;
  warehouse: string;
  location: string;
  warehouseLevel: string;
  countDate: string;
  countMode: string;
  preCountGuidanceTitle: string;
  blindPreCountGuidance: string;
  openPreCountGuidance: string;
  startCount: string;
  submitCount: string;
  maintainLines: string;
  approveAndPost: string;
  reverseCount: string;
  cancelCount: string;
  lineTable: string;
  materialName: string;
  materialCode: string;
  stockOwner: string;
  locationColumn: string;
  batchNo: string;
  bookQty: string;
  reservedQty: string;
  frozenQty: string;
  actualQty: string;
  differenceQty: string;
  remarks: string;
  differenceReason: string;
  postingTransaction: string;
  batchActualQty: string;
  batchRemarks: string;
  clearSelection: string;
  missingActualQty: string;
  lineUpdateTitle: string;
  lineUpdateWarning: string;
  lineUpdateMessage: string;
  minimumLineMessage: string;
  approveTitle: string;
  approveWarning: string;
  approveDescription: string;
  approveDateLabel: string;
  approveDateExtra: string;
  reverseTitle: string;
  reverseWarning: string;
  reverseDescription: string;
  reverseDateLabel: string;
  reverseDateExtra: string;
  reverseReason: string;
  reverseReasonRequired: string;
  reverseReasonWarning: string;
  cancelTitle: string;
  cancelReason: string;
  cancelReasonRequired: string;
  cancelReasonWarning: string;
  started: string;
  submitted: string;
  linesUpdated: string;
  approved: string;
  reversed: string;
  cancelled: string;
}

export interface StockCountDetailActionKeys {
  start: string;
  submit: string;
  update: string;
  approve: string;
  reverse: string;
  cancel: string;
}

export interface StockCountDetailPermissions {
  canPrintJob: boolean;
  canViewStockList: boolean;
  canAdjustStock: boolean;
  canReverseStock: boolean;
}

export interface StockCountDetailValidation {
  actualQtyMin: number;
  actualQtyPrecision: number;
  reasonMaxLength: number;
  remarksBatchMaxLength: number;
  minimumLineCount: number;
}

export interface StockCountDetailCapabilities {
  permissions: StockCountDetailPermissions;
  actionKeys: StockCountDetailActionKeys;
  blindCountModeValue: string;
  isPreCountStatus: (status: string) => boolean;
  lineCustomFieldSchema: DocumentLineCustomFieldSchema | null | undefined;
  /** StockCountLineFormList also needs BusinessUiProvider.materialTablePickerCapabilities. */
  lineFormCapabilities: StockCountLineFormCapabilities<StockCountLineFormValue>;
  validation: StockCountDetailValidation;
  labels: StockCountDetailLabels;
  formatDateTime: (value: string) => string;
  formatQuantity: (value?: number | null) => string;
  getStatusPresentation: (status: string) => StockCountStatusPresentation;
  getOwnerPresentation: (ownerType: string) => StockCountOwnerPresentation;
  getCountModeLabel: (countMode: string) => string;
  getPrintActionLabel: (status: string) => string;
  getBusinessDateInitialValue: () => Dayjs;
  isBusinessDateDisabled: (date: Dayjs) => boolean;
  getVarianceTextType: (value?: number | null) => 'success' | 'danger' | undefined;
  isActualQtyBlank: (value?: number | null) => boolean;
  normalizeBusinessDate: (value: StockCountDateValue) => string;
  toLineInputValues: (
    detail: StockCountDetailModel,
    schema: DocumentLineCustomFieldSchema | null | undefined,
  ) => StockCountLineFormValue[];
  buildLineInputPayload: (
    line: StockCountLineFormValue,
    schema: DocumentLineCustomFieldSchema | null | undefined,
  ) => StockCountLineInputPayload;
  buildSubmitLinePayload: (
    line: StockCountDetailLine,
    schema: DocumentLineCustomFieldSchema | null | undefined,
  ) => StockCountSubmitLinePayload;
  renderHeaderCustomFields: (
    detail: StockCountDetailModel,
    editable: boolean,
  ) => ReactNode;
  renderLineCustomFieldColumns: (
    schema: DocumentLineCustomFieldSchema | null | undefined,
  ) => ProColumns<StockCountDetailLine>[];
  renderBusinessDateField: (
    props: StockCountBusinessDateFieldSlotProps,
  ) => ReactNode;
  startStockCount: (id: string) => Promise<StockCountDetailModel>;
  submitStockCount: (
    id: string,
    lines: readonly StockCountSubmitLinePayload[],
  ) => Promise<StockCountDetailModel>;
  updateStockCountLines: (
    id: string,
    lines: readonly StockCountLineInputPayload[],
  ) => Promise<StockCountDetailModel>;
  approveStockCount: (
    id: string,
    businessDate: string,
  ) => Promise<StockCountDetailModel>;
  reverseStockCount: (
    id: string,
    businessDate: string,
    reason: string,
  ) => Promise<StockCountDetailModel>;
  cancelStockCount: (
    id: string,
    reason: string,
  ) => Promise<StockCountDetailModel>;
  notifySuccess: (message: string) => void;
  notifyWarning: (message: string) => void;
}

export interface StockCountDetailDrawerProps {
  open: boolean;
  loading?: boolean;
  detail: StockCountDetailModel | null;
  showLocationControl: boolean;
  onClose: () => void;
  onDetailChange: (detail: StockCountDetailModel) => void;
  onReloadList: () => void;
  onPrint: (id: string) => void;
  capabilities: StockCountDetailCapabilities;
}
