export type DocumentLineCustomFieldDisplayKey =
  | 'showInForm'
  | 'showInDetail'
  | 'showInList';

export interface DocumentLineCustomFieldDefinition {
  fieldKey: string;
  label: string;
  fieldKind: string;
  dataType: string;
  requiredPolicy?: string | null;
  isActive?: boolean;
  sortOrder?: number | null;
  displayJson?: unknown;
  optionsJson?: unknown;
}

export interface DocumentLineCustomFieldSchema {
  schemaVersion: number;
  fields?: DocumentLineCustomFieldDefinition[];
}
