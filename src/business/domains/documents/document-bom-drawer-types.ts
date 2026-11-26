import type { ReactNode } from 'react';
import type { CustomFieldDefinition } from './custom-field-form-types';
import type { DocumentBomDocumentType } from './document-bom-open-types';
import type {
  DocumentLineCustomFieldDefinition,
  DocumentLineCustomFieldSchema,
} from './document-line-custom-field-types';
import type { MaterialFilteredSelectOption } from '../inventory/material-select-types';

export type { DocumentBomDocumentType };

export type BomItemPartType =
  | 'self_made'
  | 'standard_part'
  | 'purchased'
  | 'outsourced'
  | 'customer_supplied';
export type MaterialProcurementType = 'buy' | 'make' | 'both' | 'outsource';
export type MaterialConsumptionMode =
  | 'manual_issue'
  | 'backflush_on_report';
export type BomLineIssueRequirementMode = 'required' | 'not_required';
export type DocumentBomLineState = 'active' | 'excluded';
export type DocumentBomItemSource = 'material' | 'temporary';

export interface ProcessRouteSelectOption {
  value: string;
  label: string;
}

export interface DocumentBomMaterialRef {
  id: string;
  code?: string | null;
  name?: string | null;
  unit?: string | null;
  spec?: string | null;
  procurementType?: MaterialProcurementType | null;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
}

export interface DocumentBomLineCustomFieldCarrier {
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
  customComputedValues?: Record<string, unknown>;
  customComputedErrors?: Record<string, unknown>;
}

export interface DocumentBomLine extends DocumentBomLineCustomFieldCarrier {
  id?: string;
  lineNo?: number | null;
  parentLineId?: string | null;
  lineState?: DocumentBomLineState | null;
  itemSource?: DocumentBomItemSource | null;
  materialId?: string | null;
  material?: DocumentBomMaterialRef | null;
  sourceStandardBomItemId?: string | null;
  sourceDocumentBomLineId?: string | null;
  temporaryItemCode?: string | null;
  temporaryItemName?: string | null;
  temporaryItemSpec?: string | null;
  partType?: BomItemPartType | null;
  lineCapabilities?: { canCustomize?: boolean } | null;
  routeId?: string | null;
  route?: {
    id?: string;
    code?: string | null;
    name?: string | null;
    materialId?: string | null;
    familyId?: string | null;
  } | null;
  quantity?: number | null;
  unit?: string | null;
  lossRate?: number | null;
  roundingMode?: string | null;
  roundingPrecision?: number | null;
  operationSequence?: number | null;
  issueRequirementMode?: BomLineIssueRequirementMode | null;
  materialConsumptionMode?: MaterialConsumptionMode | null;
  originalMaterialId?: string | null;
  adjustReason?: string | null;
  sourceAttributes?: Record<string, unknown> | null;
  drawingUrls?: string[] | null;
  imageUrls?: string[] | null;
}

export interface DocumentBomHeader {
  id: string;
  documentType: DocumentBomDocumentType;
  documentId: string;
  versionNo?: string | null;
  status?: string | null;
  manufactureMode?: string | null;
  sourceStandardBom?: {
    version?: string | null;
    material?: { code?: string | null; name?: string | null } | null;
  } | null;
  lines?: DocumentBomLine[] | null;
}

export interface DocumentBomLineInput {
  id?: string;
  sourceStandardBomItemId?: string;
  sourceDocumentBomLineId?: string;
  lineNo?: number;
  parentLineId?: string;
  lineState?: DocumentBomLineState;
  itemSource?: DocumentBomItemSource;
  materialId?: string;
  temporaryItemCode?: string;
  temporaryItemName?: string;
  temporaryItemSpec?: string;
  routeId?: string;
  originalMaterialId?: string;
  quantity: number;
  unit: string;
  lossRate?: number;
  operationSequence?: number;
  partType?: BomItemPartType;
  issueRequirementMode?: BomLineIssueRequirementMode;
  materialConsumptionMode?: MaterialConsumptionMode;
  drawingUrls?: string[];
  imageUrls?: string[];
  adjustReason?: string;
  customFieldSchemaVersion?: number;
  customValues?: Record<string, unknown>;
  sourceAttributes?: Record<string, unknown>;
}

export interface DocumentBomImportPreviewRow {
  sourceRowNo?: number;
  code: string;
  lineKey?: string;
  parentLineKey?: string;
  level?: number;
  name?: string;
  quantity?: number;
  unit?: string;
  lossRate?: number;
  operationSequence?: number;
  routeCode?: string;
  routeName?: string;
  routeId?: string;
  issueRequirementMode?: BomLineIssueRequirementMode;
  materialConsumptionMode?: MaterialConsumptionMode;
  parentCode?: string;
  drawingUrls?: string[];
  imageUrls?: string[];
  materialId?: string;
  itemSource?: DocumentBomItemSource;
  temporaryItemCode?: string;
  temporaryItemName?: string;
  temporaryItemSpec?: string;
  materialCode?: string;
  materialName?: string;
  materialSpec?: string;
  materialUnit?: string;
  materialProcurementType?: MaterialProcurementType;
  matched: boolean;
  errors?: string[];
  warnings?: string[];
}

export type DocumentBomImportDefaultsRow = Pick<
  DocumentBomImportPreviewRow,
  | 'sourceRowNo'
  | 'code'
  | 'lineKey'
  | 'parentLineKey'
  | 'level'
  | 'name'
  | 'quantity'
  | 'unit'
  | 'lossRate'
  | 'operationSequence'
  | 'routeCode'
  | 'routeName'
  | 'routeId'
  | 'issueRequirementMode'
  | 'materialConsumptionMode'
  | 'parentCode'
  | 'drawingUrls'
  | 'imageUrls'
> & {
  routeOption?: ProcessRouteSelectOption;
};

export interface DocumentBomDrawerMessageApi {
  error: (content: string) => void;
  warning: (content: string) => void;
  success: (content: string) => void;
}

export interface DocumentBomDrawingFilesProps {
  value?: string[] | null;
  onChange?: (value: string[]) => void;
  editable?: boolean;
  emptyText?: string;
  uploadText?: string;
  maxCount?: number;
}

export interface DocumentBomMaterialSelectorProps {
  request: (params?: { keyWords?: string }) => Promise<DocumentBomMaterialSelectOption[]>;
  value?: string;
  selectedOption?: DocumentBomMaterialSelectOption;
  filterMode: 'hidden';
  style: { width: '100%' };
  onChange: (
    value: string | undefined,
    option?: DocumentBomMaterialSelectOption,
  ) => void;
}

export interface DocumentBomDrawerConfiguration {
  editableDocumentTypes: readonly DocumentBomDocumentType[];
  isEditableStatus: (status?: string | null) => boolean;
  resolveDocumentLineItemSource: (line: {
    itemSource?: string | null;
    materialId?: string | null;
  }) => DocumentBomItemSource;
  resolveLoadedIssueRequirementMode: (
    mode?: BomLineIssueRequirementMode | null,
  ) => BomLineIssueRequirementMode;
  resolveLoadedLineState: (
    state?: DocumentBomLineState | null,
  ) => DocumentBomLineState;
  isManualRouteSelectableLine: (line: {
    sourceStandardBomItemId?: string | null;
    itemSource?: DocumentBomItemSource | string | null;
    partType?: BomItemPartType | null;
  }) => boolean;
  resolveDefaultPartTypeFromProcurement: (
    procurementType?: string | null,
  ) => BomItemPartType;
  resolveImportDefaults: (input: {
    itemSource: DocumentBomItemSource;
    material?: DocumentBomMaterialRef;
    row: DocumentBomImportDefaultsRow;
  }) => {
    partType: BomItemPartType;
    quantity: number;
    issueRequirementMode: BomLineIssueRequirementMode;
    lineState: DocumentBomLineState;
  };
  createNewLineDefaults: (key: string) => {
    itemSource: DocumentBomItemSource;
    unit: string;
    partType: BomItemPartType;
    lineState: DocumentBomLineState;
    issueRequirementMode: BomLineIssueRequirementMode;
    materialConsumptionMode?: MaterialConsumptionMode;
  };
  resolveItemSourceSwitchDefaults: (
    itemSource: DocumentBomItemSource,
    previous: {
      issueRequirementMode?: BomLineIssueRequirementMode;
      materialConsumptionMode?: MaterialConsumptionMode;
    },
  ) => {
    partType: BomItemPartType | undefined;
    issueRequirementMode: BomLineIssueRequirementMode;
    materialConsumptionMode: MaterialConsumptionMode | undefined;
  };
  isTemporaryLineSaveable: (line: {
    partType?: BomItemPartType | null;
    issueRequirementMode?: BomLineIssueRequirementMode | null;
  }) => boolean;
  isIssueRequirementGenerated: (
    mode?: BomLineIssueRequirementMode | null,
  ) => boolean;
  resolveIssueRequirementModeFromToggle: (
    checked: boolean,
  ) => BomLineIssueRequirementMode;
  resolveLineSubmissionDefaults: (input: {
    itemSource: DocumentBomItemSource;
    issueRequirementMode?: BomLineIssueRequirementMode;
    materialConsumptionMode?: MaterialConsumptionMode;
  }) => {
    issueRequirementMode: BomLineIssueRequirementMode;
    materialConsumptionMode: MaterialConsumptionMode | undefined;
  };
  parseIssueRequirementMode: (
    value?: string,
  ) => BomLineIssueRequirementMode | undefined;
  parseMaterialConsumptionMode: (
    value?: string,
  ) => MaterialConsumptionMode | undefined;
  documentBomStatusLabels: Readonly<Record<string, string>>;
  documentBomStatusColors: Readonly<Record<string, string>>;
  lineStateLabels: Readonly<Record<string, string>>;
  lineStateColors: Readonly<Record<string, string>>;
  partTypeLabels: Readonly<Record<string, string>>;
  partTypeColors: Readonly<Record<string, string>>;
  partTypeOptions: readonly { label: string; value: BomItemPartType }[];
  temporaryPartTypeOptions: readonly {
    label: string;
    value: BomItemPartType;
  }[];
  itemSourceLabels: Readonly<Record<string, string>>;
  itemSourceColors: Readonly<Record<string, string>>;
  itemSourceOptions: readonly { label: string; value: DocumentBomItemSource }[];
  issueRequirementModeDisplay: Readonly<
    Record<BomLineIssueRequirementMode, { label: string; color: string }>
  >;
  materialConsumptionModeOptions: readonly {
    label: string;
    value: MaterialConsumptionMode;
  }[];
  materialConsumptionModeDisplay: Readonly<
    Record<MaterialConsumptionMode, { label: string; color: string }>
  >;
  manufactureModeLabels: Readonly<Record<string, string>>;
  formatBomQuantityRounding: (
    mode?: string | null,
    precision?: number | null,
  ) => string | null | undefined;
  materialColumnWidth: number;
  viewTableScrollWidth: number;
  editTableScrollWidth: number;
  importTemplateHeaders: readonly string[];
  importPlaceholder: string;
  importTemplateFileName: string;
  saveReason: string;
  parentLinkSaveReason: string;
  temporaryItemFallbackLabel: string;
  unfilledTemporaryItemLabel: string;
  unselectedMaterialLabel: string;
  standardBomFallbackLabel: string;
  routeByMaterialRuleLabel: string;
  unknownStatusLabel: string;
}

export interface DocumentBomDrawerCapabilities {
  permissions: {
    canView: () => boolean;
    canUpdate: () => boolean;
  };
  api: {
    current: (params: {
      documentType: DocumentBomDocumentType;
      documentId: string;
    }) => Promise<DocumentBomHeader | null>;
    ensure: (params: {
      documentType: DocumentBomDocumentType;
      documentId: string;
      productQty?: number;
    }) => Promise<DocumentBomHeader>;
    updateLines: (params: {
      id: string;
      lines: DocumentBomLineInput[];
      reason: string;
    }) => Promise<DocumentBomHeader>;
    parseExcel: (params: {
      base64: string;
      fileName: string;
      uploadEmbeddedImages: true;
    }) => Promise<{ rows?: DocumentBomImportPreviewRow[] | null }>;
    downloadImportTemplate: () => Promise<Blob>;
    searchMaterials: (params: {
      keyword: string;
      page: 1;
      pageSize: 10;
    }) => Promise<DocumentBomMaterialRef[]>;
    searchSelectableMaterials: (params: {
      keyword: string;
      page: 1;
      pageSize: 10;
    }) => Promise<DocumentBomMaterialRef[]>;
  };
  dictionaries: {
    unitOptions: readonly { label: string; value: string }[];
    unitLabelMap: Readonly<Record<string, string>>;
  };
  customFields: {
    materialFields: readonly CustomFieldDefinition[];
    documentLineSchema: DocumentLineCustomFieldSchema | null;
  };
  routes: {
    requestEffectiveRouteOptions: (params: {
      keyWords?: string;
      materialId?: string;
    }) => Promise<ProcessRouteSelectOption[]>;
  };
  files: {
    renderDrawingFiles: (props: DocumentBomDrawingFilesProps) => ReactNode;
  };
  materials: {
    renderSelector: (props: DocumentBomMaterialSelectorProps) => ReactNode;
  };
  messages: DocumentBomDrawerMessageApi;
  downloadBlob: (blob: Blob, fileName: string) => void;
  configuration: DocumentBomDrawerConfiguration;
}

export interface DocumentBomDrawerProps {
  open: boolean;
  documentType: DocumentBomDocumentType;
  documentId?: string;
  title?: string;
  onClose: () => void;
  editable?: boolean;
  productQty?: number;
  onSaved?: () => void;
  initialEdit?: boolean;
  initialImport?: boolean;
  capabilities: DocumentBomDrawerCapabilities;
}

export type DocumentBomLineWithCustomFields = DocumentBomLine &
  DocumentBomLineCustomFieldCarrier;
export type DocumentBomMaterialSelectOption = MaterialFilteredSelectOption;
export type DocumentBomCustomFieldSchema = DocumentLineCustomFieldSchema;
export type DocumentBomCustomFieldDefinition = DocumentLineCustomFieldDefinition;
