import { useEffect, useRef, useState } from 'react';
import type {
  WorkOrderScrapPolicyPreview,
  WorkOrderScrapPolicyRequest,
  WorkOrderSelectRequest,
  WorkOrderSelectOption,
} from './work-order-report-types';

export function withKnownWorkOrderOptions(
  base: WorkOrderSelectRequest,
  known: Array<{ value?: string | null; label?: string | null }>,
): WorkOrderSelectRequest {
  return async (...args) => {
    const options = await base(...args);
    const existing = new Set(options.map((option) => option.value));
    const seen = new Set<string>();
    const prepend: WorkOrderSelectOption[] = [];
    for (const item of known) {
      const value = item.value;
      const label = item.label;
      if (!value || !label || existing.has(value) || seen.has(value)) continue;
      seen.add(value);
      prepend.push({ label, value });
    }
    return prepend.length ? [...prepend, ...options] : options;
  };
}

export interface WorkOrderScrapPolicyPreviewParams
  extends Omit<WorkOrderScrapPolicyRequest, 'materialId'> {
  enabled: boolean;
  materialId?: string | null;
}

/** Debounced, race-safe preview; policy enforcement remains authoritative on the host service. */
export function useWorkOrderScrapPolicyPreview(
  params: WorkOrderScrapPolicyPreviewParams,
  requestPreview: (
    params: WorkOrderScrapPolicyRequest,
  ) => Promise<WorkOrderScrapPolicyPreview | null>,
): WorkOrderScrapPolicyPreview | null {
  const {
    enabled,
    materialId,
    customerId,
    operationId,
    processOperationId,
    scrapReason,
    completedQty,
    scrappedQty,
    plannedQty,
  } = params;
  const [preview, setPreview] = useState<WorkOrderScrapPolicyPreview | null>(null);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    if (!enabled || scrappedQty <= 0 || !materialId) {
      requestSeqRef.current += 1;
      setPreview(null);
      return;
    }

    const sequence = ++requestSeqRef.current;
    const timer = window.setTimeout(() => {
      void requestPreview({
        materialId,
        customerId: customerId ?? undefined,
        operationId: operationId ?? undefined,
        processOperationId: processOperationId ?? undefined,
        scrapReason: scrapReason ?? undefined,
        completedQty,
        scrappedQty,
        plannedQty,
      })
        .then((result) => {
          if (sequence === requestSeqRef.current) setPreview(result);
        })
        .catch(() => {
          if (sequence === requestSeqRef.current) setPreview(null);
        });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [
    enabled,
    materialId,
    customerId,
    operationId,
    processOperationId,
    scrapReason,
    completedQty,
    scrappedQty,
    plannedQty,
    requestPreview,
  ]);

  return preview;
}
