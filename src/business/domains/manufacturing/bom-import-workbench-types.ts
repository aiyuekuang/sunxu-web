import type { ReactNode } from 'react';

export type BomImportMessageType = 'success' | 'warning' | 'error';

export type BomImportFieldHelpKey =
  | 'materialBaseType'
  | 'materialProcurementType'
  | 'categoryCode'
  | 'categoryName'
  | 'importMaterialCandidateRemark';

export interface BomImportMappingProfile {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface BomImportPreviewRow {
  id?: string;
  sourceRowNo?: number;
  status?: string;
  errorJson?: string[];
  warningJson?: string[];
  errors?: string[];
  warnings?: string[];
  mappedJson?: Record<string, unknown>;
  rawJson?: Record<string, unknown>;
}

export interface BomImportPreview {
  jobId?: string;
  summary?: {
    totalRows?: number;
    validRows?: number;
    warningRows?: number;
    errorRows?: number;
  };
  rows?: BomImportPreviewRow[];
}

export type BomImportCandidateStatus =
  | 'pending'
  | 'created'
  | 'ignored'
  | 'failed'
  | string;

export interface BomImportMaterialCandidate {
  id: string;
  materialName: string;
  materialCode: string;
  materialSpec?: string | null;
  unit: string;
  baseType?: string;
  type?: string | null;
  category?: string | null;
  procurementType?: string;
  status: BomImportCandidateStatus;
  errorJson?: string[];
}

export interface BomImportConfirmCandidateValues {
  baseType?: string;
  type?: string;
  category?: string;
  procurementType?: string;
  remark?: string;
}

export interface BomImportStatusLabel {
  text: string;
  color: string;
}

export interface BomImportSelectOption {
  label: string;
  value: string;
}

export interface BomImportWorkbenchCapabilities {
  requestProfiles: (params: {
    page: 1;
    pageSize: 100;
    targetType: 'bom';
    status: 'active';
  }) => Promise<{ list?: BomImportMappingProfile[] | null } | null>;
  requestTemplate: (params: {
    targetType: 'bom';
    profileId: string;
  }) => Promise<Blob>;
  preview: (params: {
    targetType: 'bom';
    profileId: string;
    base64: string;
    fileName: string;
  }) => Promise<BomImportPreview>;
  requestRows: (params: {
    jobId: string;
    page: 1;
    pageSize: 100;
  }) => Promise<{ list?: BomImportPreviewRow[] | null } | null>;
  requestCandidates: (params: {
    importJobId: string;
    page: 1;
    pageSize: 100;
  }) => Promise<{ list?: BomImportMaterialCandidate[] | null } | null>;
  confirmCandidates: (params: {
    ids: string[];
    baseType?: string;
    type?: string;
    category?: string;
    procurementType?: string;
    remark?: string;
  }) => Promise<{ errors?: string[] | null; created?: number | null } | null>;
  ignoreCandidates: (params: {
    ids: string[];
    remark: string;
  }) => Promise<unknown>;
  execute: (params: {
    id: string;
    allowWarnings: boolean;
  }) => Promise<{ errors?: string[] | null; importedRows?: number | null }>;
  notify: (type: BomImportMessageType, content: string) => void;
  unitLabelMap: Readonly<Record<string, string>>;
  rowStatusLabels: Readonly<Record<string, BomImportStatusLabel>>;
  candidateStatusLabels: Readonly<Record<string, BomImportStatusLabel>>;
  materialTypeOptions: BomImportSelectOption[];
  procurementTypeOptions: BomImportSelectOption[];
  renderFieldHelp: (
    label: string,
    key: BomImportFieldHelpKey,
  ) => ReactNode;
}

export interface BomImportWorkbenchDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  capabilities: BomImportWorkbenchCapabilities;
}
