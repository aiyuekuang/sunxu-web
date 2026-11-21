import type { ReactNode } from 'react';

export type FormulaDataType =
  | 'text'
  | 'long_text'
  | 'number'
  | 'decimal'
  | 'money'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multi_select'
  | 'file'
  | 'image'
  | 'user_ref'
  | 'department_ref';

export interface FormulaCustomFieldDefinition {
  id?: string;
  objectType?: string;
  fieldKey: string;
  label: string;
  dataType: FormulaDataType;
  fieldKind: 'input' | 'formula' | 'system' | string;
  helpText?: string | null;
  defaultValueJson?: Record<string, unknown>;
  optionsJson?: Record<string, unknown>;
  validationJson?: Record<string, unknown>;
  moneyJson?: Record<string, unknown>;
  requiredPolicy?: string;
  displayJson?: Record<string, unknown>;
  permissionJson?: Record<string, unknown>;
  queryJson?: Record<string, unknown>;
  formulaJson?: Record<string, unknown>;
  dependencyKeys?: string[];
  sortOrder?: number;
  isActive?: boolean;
  version?: number;
  [key: string]: unknown;
}

export interface FormulaReferenceField {
  key: string;
  label: string;
  dataType: FormulaDataType;
  source: 'system' | 'custom';
  disabled?: boolean;
  disabledReason?: string;
}

export interface FormulaSystemFieldDefinition {
  key: string;
  label: string;
  dataType: FormulaDataType;
}

export interface FormulaFormSchema {
  systemFields?: FormulaSystemFieldDefinition[];
  fields?: FormulaCustomFieldDefinition[];
}

export interface FormulaPreviewRequest {
  objectType: string;
  expression: string;
  sampleData: Record<string, unknown>;
}

export interface FormulaPreviewResult {
  value?: unknown;
  dependencyKeys?: string[];
  resultType?: string | null;
  typeError?: string | null;
  normalizedExpression?: string | null;
  readableExpression?: string | null;
}

/** Host adapter for schema loading, evaluation, permissions, and error wording. */
export interface FormulaDesignerCapabilities {
  requestFormSchema: (
    params: { objectType: string },
  ) => Promise<FormulaFormSchema | null | undefined>;
  previewFormula: (
    params: FormulaPreviewRequest,
  ) => Promise<FormulaPreviewResult>;
  getErrorMessage: (error: unknown, fallback: string) => string;
}

export interface FormulaDesignerProps {
  objectType?: string;
  currentFieldKey?: string;
  expression?: string;
  fieldName?: string;
  label?: ReactNode;
  placeholder?: string;
  required?: boolean;
  dataType?: FormulaDataType;
  systemFields?: FormulaReferenceField[];
  customFieldFilter?: (field: FormulaCustomFieldDefinition) => boolean;
  availableFunctionNames?: string[];
  availableOperatorTokens?: string[];
  getReferenceExpression?: (field: FormulaReferenceField) => string;
  getExpression: () => unknown;
  setExpression: (expression: string) => void;
  /** Host permission result. Disabled mode retains preview and read-only inspection. */
  disabled?: boolean;
  capabilities: FormulaDesignerCapabilities;
}
