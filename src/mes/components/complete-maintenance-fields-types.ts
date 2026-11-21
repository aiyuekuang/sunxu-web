import type { CSSProperties, ReactNode } from 'react';

export type MaintenanceCompletionFieldHelpKey =
  | 'maintenanceStepResult'
  | 'maintenanceStepRemark'
  | 'maintenanceCompleteRemark';

export interface MaintenanceCompletionStep {
  id?: string;
  name?: string;
  content?: string;
  required?: boolean;
  photoRequired?: boolean;
}

export interface MaintenanceCompletionRecord {
  maintenanceTemplateCode?: string | null;
  maintenanceTemplateName?: string | null;
  steps?: readonly MaintenanceCompletionStep[] | null;
}

export interface CompleteMaintenanceFieldsCapabilities {
  getFieldHelpProps: (
    label: string,
    key: MaintenanceCompletionFieldHelpKey,
  ) => {
    label: string;
    tooltip?: { title: ReactNode; overlayStyle?: CSSProperties };
  };
}

export interface CompleteMaintenanceFieldsProps {
  record: MaintenanceCompletionRecord | null;
  capabilities: CompleteMaintenanceFieldsCapabilities;
}
