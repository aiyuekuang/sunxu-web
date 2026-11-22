import type {
  LandedCostAllocationBasis,
  LandedCostAllocationDraft,
  LandedCostAllocationPreview,
  LandedCostAllocationPreviewLine,
} from './landed-cost-components-types';

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isFiniteNumber(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value);
}

/**
 * Builds the estimate shown in the landed-cost form. The server remains the
 * authority for the final allocation bases and amounts.
 */
export function buildLandedCostAllocationPreview(
  allocations: readonly LandedCostAllocationDraft[],
  allocationBasis: LandedCostAllocationBasis | undefined,
  capitalizableAmount: number | undefined,
): LandedCostAllocationPreview | undefined {
  if (!allocationBasis) return undefined;

  const normalizedAmount = isFiniteNumber(capitalizableAmount)
    ? Math.abs(capitalizableAmount)
    : undefined;
  if (allocationBasis === 'manual') {
    const lines = allocations.map((allocation) => ({
      receiptItemId: allocation.receiptItemId,
      display: allocation.display,
      manualAllocationAmount: isFiniteNumber(allocation.allocationAmount)
        ? roundCurrency(allocation.allocationAmount)
        : undefined,
    }));
    const allocatedAmount = roundCurrency(
      lines.reduce((sum, line) => sum + (line.manualAllocationAmount ?? 0), 0),
    );
    return {
      allocationBasis,
      capitalizableAmount: normalizedAmount,
      allocatedAmount,
      pendingAmount:
        normalizedAmount === undefined
          ? undefined
          : roundCurrency(normalizedAmount - allocatedAmount),
      lines,
    };
  }

  const lines: LandedCostAllocationPreviewLine[] = allocations.map(
    (allocation) => ({
      receiptItemId: allocation.receiptItemId,
      display: allocation.display,
      allocationBase: allocation.previewBases?.[allocationBasis],
    }),
  );
  const totalBase = lines.reduce((sum, line) => sum + (line.allocationBase ?? 0), 0);
  const previewLines = lines.map((line, index) => {
    if (normalizedAmount === undefined || totalBase <= 0) return line;
    const previousAmount = lines.slice(0, index).reduce((sum, previous) => {
      return (
        sum +
        roundCurrency(
          (normalizedAmount * (previous.allocationBase ?? 0)) / totalBase,
        )
      );
    }, 0);
    const estimatedAllocationAmount =
      index === lines.length - 1
        ? roundCurrency(normalizedAmount - previousAmount)
        : roundCurrency(
            (normalizedAmount * (line.allocationBase ?? 0)) / totalBase,
          );
    return { ...line, estimatedAllocationAmount };
  });

  return {
    allocationBasis,
    capitalizableAmount: normalizedAmount,
    totalBase: totalBase > 0 ? totalBase : undefined,
    allocatedAmount:
      normalizedAmount !== undefined && totalBase > 0
        ? roundCurrency(
            previewLines.reduce(
              (sum, line) => sum + (line.estimatedAllocationAmount ?? 0),
              0,
            ),
          )
        : undefined,
    pendingAmount:
      normalizedAmount !== undefined && totalBase > 0 ? 0 : undefined,
    lines: previewLines,
  };
}
