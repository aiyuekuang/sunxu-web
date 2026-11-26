export type ApprovalCapability = 'view' | 'submit' | 'recall' | 'handle';

export interface ApprovalRecord {
  createdAt?: string;
  comment?: string | null;
}

export interface ApprovalStep {
  step: number;
  label: string;
  assigneeName?: string | null;
  status: 'approved' | 'rejected' | 'pending' | 'waiting';
  isMyTurn?: boolean;
  record?: ApprovalRecord;
}

export interface ApprovalPanelStatusData {
  status: 'pending_approval' | 'approved' | 'rejected' | 'cancelled' | 'none';
  currentStep: number;
  totalSteps: number;
  isMyTurn?: boolean;
  canRecall?: boolean;
  steps: ApprovalStep[];
}

export interface ApprovalCapabilities {
  canAccess: (
    entityType: string,
    capability: ApprovalCapability,
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
