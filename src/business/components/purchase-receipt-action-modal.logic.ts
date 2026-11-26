export type ReceiptArrivalQuantityInput = {
  arrivalReceiptQty?: number | null;
  rejectedReceiptQty?: number | null;
};

/** Uses the source preview's server-calculated receivable quantity as the default. */
export function getDefaultReceiptQuantity(receivableReceiptQty?: number | null): number {
  const quantity = Number(receivableReceiptQty ?? 0);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
}

export function selectSubmittedReceiptItems<T extends ReceiptArrivalQuantityInput>(items: T[]): T[] {
  return items.filter(
    (item) =>
      Number(item.arrivalReceiptQty ?? 0) > 0 ||
      Number(item.rejectedReceiptQty ?? 0) > 0,
  );
}

export type ReceiptCapacityItemInput = ReceiptArrivalQuantityInput & {
  purchaseOrderItemId: string;
  warehouseId?: string | null;
  maxQuantity?: number | null;
  hasBatchTracking?: boolean;
  requiresBatchNo?: boolean;
  requiresShelfLifeDate?: boolean;
  batchNo?: string | null;
  productionDate?: string | null;
  expiryDate?: string | null;
  rejectReason?: string | null;
  incomingInspectionRequired?: boolean;
};

export type ReceiptCapacityValidationReason =
  | 'invalid_quantity'
  | 'negative_quantity'
  | 'source_capacity_exceeded'
  | 'rejected_quantity_exceeds_arrival'
  | 'warehouse_required'
  | 'reject_reason_required'
  | 'batch_required'
  | 'batch_date_required';

export type ReceiptCapacityValidationResult<T> = {
  item: T;
  reason: ReceiptCapacityValidationReason;
};

export function getReceiptSourceAllocation<
  T extends Pick<ReceiptCapacityItemInput, 'purchaseOrderItemId'> & ReceiptArrivalQuantityInput,
>(items: readonly T[], purchaseOrderItemId: string): number {
  return items
    .filter((item) => item.purchaseOrderItemId === purchaseOrderItemId)
    .reduce((total, item) => {
      const quantity = Number(item.arrivalReceiptQty ?? 0);
      return total + (Number.isFinite(quantity) ? quantity : 0);
    }, 0);
}

export function getAcceptedReceiptQuantity(
  item: ReceiptArrivalQuantityInput & { incomingInspectionRequired?: boolean },
): number | undefined {
  if (item.incomingInspectionRequired) return undefined;
  const arrivalReceiptQty = Number(item.arrivalReceiptQty ?? 0);
  const rejectedReceiptQty = Number(item.rejectedReceiptQty ?? 0);
  if (!Number.isFinite(arrivalReceiptQty) || !Number.isFinite(rejectedReceiptQty)) return undefined;
  return Math.max(arrivalReceiptQty - rejectedReceiptQty, 0);
}

export function findInvalidReceiptItem<T extends ReceiptCapacityItemInput>(
  items: readonly T[],
): ReceiptCapacityValidationResult<T> | undefined {
  const sourceAllocations = new Map<string, number>();

  for (const item of items) {
    const arrivalReceiptQty = Number(item.arrivalReceiptQty ?? 0);
    const rejectedReceiptQty = Number(item.rejectedReceiptQty ?? 0);
    if (!Number.isFinite(arrivalReceiptQty) || !Number.isFinite(rejectedReceiptQty)) {
      return { item, reason: 'invalid_quantity' };
    }
    if (arrivalReceiptQty < 0 || rejectedReceiptQty < 0) {
      return { item, reason: 'negative_quantity' };
    }
    if (rejectedReceiptQty > arrivalReceiptQty) {
      return { item, reason: 'rejected_quantity_exceeds_arrival' };
    }
    const acceptedReceiptQty = getAcceptedReceiptQuantity(item);
    if (acceptedReceiptQty && !item.warehouseId?.trim()) {
      return { item, reason: 'warehouse_required' };
    }
    if (rejectedReceiptQty > 0 && !item.rejectReason?.trim()) {
      return { item, reason: 'reject_reason_required' };
    }
    if (
      (item.requiresBatchNo ?? item.hasBatchTracking) &&
      arrivalReceiptQty > rejectedReceiptQty &&
      !item.batchNo?.trim()
    ) {
      return { item, reason: 'batch_required' };
    }
    if (
      item.requiresShelfLifeDate &&
      arrivalReceiptQty > rejectedReceiptQty &&
      !item.productionDate &&
      !item.expiryDate
    ) {
      return { item, reason: 'batch_date_required' };
    }

    const maxQuantity = item.maxQuantity == null ? undefined : Number(item.maxQuantity);
    if (maxQuantity !== undefined && !Number.isFinite(maxQuantity)) {
      return { item, reason: 'invalid_quantity' };
    }
    const sourceAllocation = (sourceAllocations.get(item.purchaseOrderItemId) ?? 0) + arrivalReceiptQty;
    sourceAllocations.set(item.purchaseOrderItemId, sourceAllocation);
    if (maxQuantity !== undefined && (arrivalReceiptQty > maxQuantity || sourceAllocation > maxQuantity)) {
      return { item, reason: 'source_capacity_exceeded' };
    }
  }
  return undefined;
}
