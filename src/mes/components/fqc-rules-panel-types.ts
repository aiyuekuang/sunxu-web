import type { ReactNode } from 'react';
import type { MaterialFilteredSelectOption } from './material-select-types';

export type FqcLotFormationMode =
  | 'work_order_completed'
  | 'output_batch'
  | 'shift'
  | 'day'
  | 'report';

export type FqcReceiptGateMode = 'non_blocking' | 'blocking';
export type FqcRuleScopeType = 'material' | 'family';
export type FqcRulesConfigurationTarget = 'materialFamilies' | 'qualityTemplate';

export interface FqcRulesDictionaryOption<TValue extends string | boolean = string> {
  label: string;
  value: TValue;
  status?: 'Default' | 'Processing' | 'Success' | 'Warning' | 'Error';
  color?: string;
}

export interface FqcRulesSelectOption {
  label: string;
  value: string;
}

export interface FqcRuleMaterial {
  id: string;
  code?: string | null;
  name: string;
}

export interface FqcRuleFamily {
  id: string;
  code?: string | null;
  name: string;
}

export interface FqcRuleTemplate {
  id: string;
  name: string;
}

export interface FqcControlRuleRecord {
  id: string;
  code: string;
  name: string;
  materialId?: string | null;
  material?: FqcRuleMaterial | null;
  familyId?: string | null;
  family?: FqcRuleFamily | null;
  templateId: string;
  template?: FqcRuleTemplate | null;
  lotFormationMode: FqcLotFormationMode;
  receiptGateMode: FqcReceiptGateMode;
  isActive: boolean;
}

export interface FqcRulesHealthIssue {
  ruleId: string;
  ruleCode: string;
  level: 'error' | 'warning';
  message: string;
}

export interface FqcRulesHealth {
  healthy: boolean;
  activeRuleCount: number;
  uncoveredMaterialCount: number;
  issues: readonly FqcRulesHealthIssue[];
}

export interface FqcRulesListQuery {
  page: number;
  pageSize: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
  keyword?: string;
  materialId?: string;
  familyId?: string;
  lotFormationMode?: FqcLotFormationMode;
  receiptGateMode?: FqcReceiptGateMode;
  isActive?: boolean;
}

export interface FqcRulesListResponse {
  list?: readonly FqcControlRuleRecord[];
  total?: number;
}

export interface FqcRuleMutationPayload {
  code?: string;
  name: string;
  /** Retained from edit initial values; create forms do not set it. */
  id?: string;
  materialId?: string | null;
  familyId?: string | null;
  templateId: string;
  lotFormationMode: FqcLotFormationMode;
  receiptGateMode: FqcReceiptGateMode;
  isActive?: boolean;
}

export interface FqcRuleFormValues extends FqcRuleMutationPayload {
  scopeType?: FqcRuleScopeType;
}

export interface FqcRulesConfigEntryLabelProps {
  target: FqcRulesConfigurationTarget;
  children: ReactNode;
  /** True only when the initial, unfiltered option set is empty and no value is selected. */
  show: boolean;
  onOpen: () => void;
}

export interface FqcRulesPanelCapabilities {
  requestRules: (query: FqcRulesListQuery) => Promise<FqcRulesListResponse>;
  requestHealth: () => Promise<FqcRulesHealth>;
  createRule: (payload: Omit<FqcRuleMutationPayload, 'id'>) => Promise<unknown>;
  updateRule: (payload: FqcRuleMutationPayload & { id: string }) => Promise<unknown>;
  removeRule: (params: { id: string }) => Promise<unknown>;
  /** Host request returns active material options and preserves the selector's display metadata. */
  requestMaterialOptions: (
    params?: { keyWords?: string } & Record<string, unknown>,
  ) => Promise<MaterialFilteredSelectOption[]>;
  /** Host request returns active material families, page 1 / 50, filtered by keyWords. */
  requestFamilyOptions: (params?: {
    keyWords?: string;
  }) => Promise<FqcRulesSelectOption[]>;
  /** Host request returns active FQC templates, page 1 / 50, filtered by keyWords. */
  requestTemplateOptions: (params?: {
    keyWords?: string;
  }) => Promise<FqcRulesSelectOption[]>;
  permissions: {
    create: string;
    update: string;
    delete: string;
  };
  /** Host operation-feature result; controls all family-scope filters and fields. */
  familyManagementVisible: boolean;
  dictionaries: {
    lotFormationModes: readonly FqcRulesDictionaryOption<FqcLotFormationMode>[];
    receiptGateModes: readonly FqcRulesDictionaryOption<FqcReceiptGateMode>[];
    activeStates: readonly FqcRulesDictionaryOption<boolean>[];
  };
  /** Host maps mutation outcomes to its message service and localized message catalog. */
  notifySuccess: (action: 'create' | 'update') => void;
  messages: {
    deleteConfirmTitle: string;
    deleteSuccess: string;
  };
  /** Host owns route, access policy, and refresh-after-navigation for master-data links. */
  renderConfigEntryLabel: (
    props: FqcRulesConfigEntryLabelProps,
  ) => ReactNode;
}

export interface FqcRulesPanelProps {
  /** Render within the host's MesUiProvider for PermissionButton and material config links. */
  capabilities: FqcRulesPanelCapabilities;
  layout?: 'page' | 'embedded';
}
