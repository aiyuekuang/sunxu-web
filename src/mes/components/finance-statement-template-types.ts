export type FinanceStatementType = 'receivable' | 'payable';

export interface StatementTemplateColumnOption {
  field: string;
  header: string;
  label: string;
  defaultVisible: boolean;
}

export interface StatementTemplateColumnConfig {
  docLine?: string[];
  itemLine?: string[];
}

export interface StatementTemplatePlaceholder {
  token: string;
  label: string;
  group: string;
}

export interface StatementTemplateInfo {
  type: FinanceStatementType;
  isCustom: boolean;
  fileName?: string | null;
  updatedAt?: string | null;
  columnConfig?: StatementTemplateColumnConfig | null;
  columnCatalog: {
    docLine: StatementTemplateColumnOption[];
    itemLine: StatementTemplateColumnOption[];
  };
  placeholders: StatementTemplatePlaceholder[];
}

export interface StatementTemplateUploadResult {
  fileName: string;
  unknownTokens: string[];
}

export interface ExportTemplateColumnConfigPayload {
  type: FinanceStatementType;
  docLine?: string[];
  itemLine?: string[];
}

export interface ExportTemplateModalCapabilities {
  canManageTemplate: boolean;
  groupLabels: Readonly<Record<string, string>>;
  groupColors: Readonly<Record<string, string>>;
  requestTemplateInfo: (
    type: FinanceStatementType,
  ) => Promise<StatementTemplateInfo>;
  saveColumnConfig: (
    payload: ExportTemplateColumnConfigPayload,
  ) => Promise<void>;
  downloadTemplate: (params: {
    type: FinanceStatementType;
    fileName: string;
  }) => Promise<void>;
  uploadTemplate: (
    type: FinanceStatementType,
    file: File,
  ) => Promise<StatementTemplateUploadResult>;
  resetTemplate: (type: FinanceStatementType) => Promise<void>;
  notifySuccess: (message: string) => void;
  notifyWarning: (message: string, durationSeconds?: number) => void;
}

export interface ExportTemplateModalProps {
  open: boolean;
  type: FinanceStatementType;
  onOpenChange: (open: boolean) => void;
  capabilities: ExportTemplateModalCapabilities;
}
