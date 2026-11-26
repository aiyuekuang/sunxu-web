import type { ReactNode } from 'react';
import type {
  FilterableSelectRequestFn,
  MaterialFilteredSelectOption,
} from '../inventory/material-select-types';

export interface InspectionTemplateSummary {
  id: string;
  code?: string | null;
  name?: string | null;
}

export interface InspectionTemplateMaterialSnapshot {
  id: string;
  code?: string | null;
  name?: string | null;
  spec?: string | null;
  unit?: string | null;
}

export interface InspectionTemplateBinding {
  materialId?: string | null;
  /** 回显快照；宿主组装提交 DTO 时按业务契约忽略该字段。 */
  material?: InspectionTemplateMaterialSnapshot | null;
  /** Read-only compatibility for historical conditional rules. */
  routeApplicabilityId?: string | null;
  templateId: string;
}

export interface ProcessOperationInspectionConfigEntryLabelProps {
  target: 'qualityTemplate' | 'material';
  label: ReactNode;
  show: boolean;
  onOpen: () => void;
}

export interface ProcessOperationInspectionTemplateListParams {
  page: 1;
  pageSize: 50;
  keyword: string;
  type: 'ipqc';
  isActive: true;
}

export interface ProcessOperationInspectionRulesCapabilities {
  /** Host adapter must preserve the source's active IPQC template list filters. */
  listTemplates: (
    params: ProcessOperationInspectionTemplateListParams,
  ) => Promise<{ list?: InspectionTemplateSummary[] | null } | null | undefined>;
  loadTemplateDetail: (id: string) => Promise<InspectionTemplateSummary>;
  /**
   * Host returns active materials and honors the keyword; dictionaries/scanner use BusinessUiProvider.
   */
  requestMaterials: FilterableSelectRequestFn;
  renderConfigEntryFieldLabel: (
    props: ProcessOperationInspectionConfigEntryLabelProps,
  ) => ReactNode;
  notifyError: (message: string) => void;
}

export interface ProcessOperationInspectionRulesFormProps {
  value?: InspectionTemplateBinding[];
  onChange?: (value: InspectionTemplateBinding[]) => void;
  /** Host-provided permission outcome; this source form has no local permission-code checks. */
  disabled?: boolean;
  capabilities: ProcessOperationInspectionRulesCapabilities;
}

export type ProcessOperationInspectionMaterialOption = MaterialFilteredSelectOption;
