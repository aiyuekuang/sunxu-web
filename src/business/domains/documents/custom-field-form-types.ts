export type CustomFieldFormMode = 'create' | 'update';

export interface CustomFieldDefinition {
  fieldKey: string;
  label: string;
  fieldKind: string;
  dataType: string;
  requiredPolicy?: string | null;
  displayJson?: unknown;
  validationJson?: unknown;
  optionsJson?: unknown;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CustomFieldSchema {
  schemaVersion: number;
  fields?: CustomFieldDefinition[];
}

export interface CustomFieldValueDetail {
  customValues?: Record<string, unknown> | null;
  customComputedValues?: Record<string, unknown> | null;
  customComputedErrors?: Record<string, unknown> | null;
}

export interface CustomFieldFormRuntime {
  schemaVersion: number;
  inputKeys: string[];
  formFieldKeys: string[];
  currentValues: Record<string, unknown>;
}

export interface CustomFieldFormSectionProps {
  objectType: string;
  objectId?: string;
  onRuntimeChange?: (runtime: CustomFieldFormRuntime | null) => void;
}

export interface CustomFieldFormCapabilities {
  requestFormSchema: (params: {
    objectType: string;
  }) => Promise<CustomFieldSchema | null | undefined>;
  requestValueDetail: (params: {
    objectType: string;
    objectId: string;
  }) => Promise<CustomFieldValueDetail | null>;
  saveValues?: (body: {
    objectType: string;
    objectId: string;
    customFieldSchemaVersion: number;
    customValues: Record<string, unknown>;
  }) => Promise<unknown>;
  getErrorMessage: (error: unknown, fallback: string) => string;
}
