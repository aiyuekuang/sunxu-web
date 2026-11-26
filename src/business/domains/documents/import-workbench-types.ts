export type ImportTargetType =
  | 'bom'
  | 'process_route'
  | 'material'
  | 'customer'
  | 'supplier'
  | 'equipment'
  | 'tooling'
  | 'work_order'
  | 'quality_template'
  | 'material_supplier'
  | 'material_supplier_price'
  | 'sales_price_list';

export type ImportWorkbenchTargetOption = {
  value: ImportTargetType;
  label: string;
  templateFileName?: string;
  description?: string;
  allowWarningsByDefault?: boolean;
  requiredPermission?: string;
};

export interface ImportWorkbenchRow {
  id?: string;
  sourceRowNo: number;
  status?: 'valid' | 'warning' | 'error' | 'imported' | string;
  errors?: string[];
  warnings?: string[];
  errorJson?: string[];
  warningJson?: string[];
}

export interface ImportWorkbenchPreview {
  jobId?: string;
  summary?: {
    totalRows?: number;
    validRows?: number;
    warningRows?: number;
    errorRows?: number;
  };
  rows?: ImportWorkbenchRow[];
}

export interface ImportWorkbenchCapabilities {
  requestTemplate: (params: {
    targetType: ImportTargetType;
    profileId?: string;
  }) => Promise<unknown>;
  preview: (params: {
    targetType: ImportTargetType;
    profileId?: string;
    base64: string;
    fileName: string;
  }) => Promise<ImportWorkbenchPreview>;
  requestRows: (params: {
    jobId: string;
    page: number;
    pageSize: number;
  }) => Promise<{ list?: ImportWorkbenchRow[] }>;
  execute: (params: {
    id: string;
    allowWarnings: boolean;
  }) => Promise<{ importedRows?: number; errors?: string[] }>;
}
