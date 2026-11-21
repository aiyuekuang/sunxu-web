import type { Dayjs } from 'dayjs';

export interface LandedCostReverseSource {
  id: string;
}

export interface ReverseLandedCostRequest {
  id: string;
  reason: string;
  businessDate?: string;
}

export interface ReverseLandedCostModalProps {
  landedCost?: LandedCostReverseSource | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  reverseLandedCost: (params: ReverseLandedCostRequest) => Promise<unknown>;
  normalizeBusinessDate?: (value?: Dayjs | string) => string | undefined;
}
