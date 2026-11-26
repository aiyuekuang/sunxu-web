export type MesApprovalCapability = 'view' | 'submit' | 'recall' | 'handle';

export interface MesApprovalRecord {
  createdAt?: string;
  comment?: string | null;
}

export interface MesApprovalStep {
  step: number;
  label: string;
  assigneeName?: string | null;
  status: 'approved' | 'rejected' | 'pending' | 'waiting';
  isMyTurn?: boolean;
  record?: MesApprovalRecord;
}

export interface ApprovalPanelStatusData {
  status: 'pending_approval' | 'approved' | 'rejected' | 'cancelled' | 'none';
  currentStep: number;
  totalSteps: number;
  isMyTurn?: boolean;
  canRecall?: boolean;
  steps: MesApprovalStep[];
}

export interface MesApprovalCapabilities {
  canAccess: (
    entityType: string,
    capability: MesApprovalCapability,
  ) => boolean;
  /** Global approval-handler permission required by source action buttons. */
  canHandle: () => boolean;
  canLoadStatus: (entityType: string) => boolean;
  requestStatus: (params: {
    entityType: string;
    entityId: string;
  }) => Promise<ApprovalPanelStatusData>;
  submit: (params: { entityType: string; entityId: string }) => Promise<unknown>;
  recall: (params: { entityType: string; entityId: string }) => Promise<unknown>;
  reset: (params: { entityType: string; entityId: string }) => Promise<unknown>;
  handle: (params: {
    entityType: string;
    entityId: string;
    action: 'approved' | 'rejected';
    comment?: string;
  }) => Promise<unknown>;
}
