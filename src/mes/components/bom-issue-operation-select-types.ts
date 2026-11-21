export interface BomIssueOperationBindingSelection {
  routeMasterId: string;
  operationCode: string;
  phaseCode?: string;
}

export interface IssueOperationOption {
  label: string;
  value: string;
  searchText: string;
  selection: BomIssueOperationBindingSelection;
}

export interface BomIssueRouteCandidate {
  routeMasterId: string;
  routeId: string;
  code: string;
  name: string;
  versionLabel: string;
}

export interface BomIssueOperationCapabilities {
  listRouteCandidates: (params: {
    materialId: string;
    routeSelectionDate: string;
  }) => Promise<{ candidates?: readonly BomIssueRouteCandidate[] | null }>;
  getRouteDetail: (params: { id: string }) => Promise<{
    operations?: readonly unknown[] | null;
  }>;
  getRouteSelectionDate?: () => string;
}

export interface BomIssueOperationSelectProps {
  materialId?: string;
  options: readonly IssueOperationOption[];
  loading?: boolean;
  value?: readonly BomIssueOperationBindingSelection[];
  onChange: (selections: BomIssueOperationBindingSelection[]) => void;
}
