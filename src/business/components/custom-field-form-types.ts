export type CustomFieldFormMode = 'create' | 'update';

export interface MesCustomFieldDefinition {
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

export interface MesCustomFieldSchema {
  schemaVersion: number;
  fields?: MesCustomFieldDefinition[];
}

export interface MesCustomFieldValueDetail {
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

export interface MesCustomFieldFormCapabilities {
  requestFormSchema: (params: {
    objectType: string;
  }) => Promise<MesCustomFieldSchema | null | undefined>;
  requestValueDetail: (params: {
    objectType: string;
    objectId: string;
  }) => Promise<MesCustomFieldValueDetail | null>;
  saveValues?: (body: {
    objectType: string;
    objectId: string;
    customFieldSchemaVersion: number;
    customValues: Record<string, unknown>;
  }) => Promise<unknown>;
  getErrorMessage: (error: unknown, fallback: string) => string;
}
