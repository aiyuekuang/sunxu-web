export type PriceControlDomain = 'purchase' | 'sales';
export type PriceExceptionPartyType = 'customer' | 'supplier';

export interface PriceControlPrecheckLine {
  sourceItemId?: string | null;
  materialId: string;
  unitPrice: number;
  quantity?: number | null;
  estimatedCost?: number | null;
  bomCostSnapshot?: Record<string, unknown> | null;
  label?: string | null;
  taxRate?: number | null;
  priceIncludesTax?: boolean | null;
}

export interface PriceControlDecision {
  ruleId: string;
  ruleName: string;
  severity: string;
  message: string;
  sourceItemId?: string | null;
  materialId: string;
  enteredUnitPrice?: number | null;
  controlUnitPrice?: number | null;
  estimatedCost?: number | null;
  grossMarginRate?: number | null;
  approvedExceptionId?: string | null;
}

export interface PriceControlPrecheckResult {
  warnings: PriceControlDecision[];
  blockers: PriceControlDecision[];
  approvalRequired: PriceControlDecision[];
}

export interface PriceControlPrecheckRequest {
  domain: PriceControlDomain;
  sourceType: string;
  sourceId?: string | null;
  partyId?: string | null;
  partyLevel?: string | null;
  asOfDate?: string | null;
  lines: PriceControlPrecheckLine[];
}

export interface RequestPriceExceptionApproval {
  domain: PriceControlDomain;
  sourceType: string;
  sourceId: string;
  sourceItemId?: string | null;
  materialId: string;
  partyType: PriceExceptionPartyType;
  partyId?: string | null;
  ruleId: string;
  enteredUnitPrice: number;
  controlUnitPrice?: number | null;
  estimatedCost?: number | null;
  grossMarginRate?: number | null;
  reason: string;
}

export interface PriceControlCapabilities {
  /** Raw permission lookup: server rules remain active when the UI feature is hidden. */
  hasRawViewPermission: () => boolean;
  precheck: (
    params: PriceControlPrecheckRequest,
  ) => Promise<PriceControlPrecheckResult>;
  requestExceptionApproval: (
    params: RequestPriceExceptionApproval,
  ) => Promise<unknown>;
  getErrorMessage: (error: unknown) => string;
}
