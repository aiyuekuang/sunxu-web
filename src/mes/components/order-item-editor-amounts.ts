import type {
  OrderItemCommercialAmountPreviewRequest,
  OrderItemCommercialAmountPreviewResult,
  OrderItemCommercialLineAmounts,
} from './order-item-editor-types';

export interface OrderItemAmountInput {
  qty: number;
  unitPrice?: number;
  discountRate?: number;
  taxRate?: number;
  priceIncludesTax?: boolean;
  customValues?: unknown;
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function roundToDecimal(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function normalizeRequiredNumber(
  value: number | string | null | undefined,
): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeOptionalNumber(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRate(
  value: number | string | null | undefined,
  defaultValue: number,
  fieldName: string,
): number {
  const raw = normalizeOptionalNumber(value);
  const parsed =
    raw !== null && raw > 0 && raw < 1 ? raw * 100 : (raw ?? defaultValue);
  if (parsed < 0 || parsed > 100) {
    throw new RangeError(`${fieldName} must be between 0 and 100`);
  }
  return roundToDecimal(parsed, 4);
}

/** Local fallback calculation used while the host policy preview is unavailable. */
export function calculateOrderItemAmounts(
  input: OrderItemAmountInput,
): OrderItemCommercialLineAmounts {
  const discountRate = normalizeRate(input.discountRate, 100, 'discountRate');
  const taxRate = normalizeRate(input.taxRate, 0, 'taxRate');
  const unitPrice = normalizeOptionalNumber(input.unitPrice);

  if (unitPrice === null) {
    return {
      amount: null,
      discountRate,
      discountAmount: null,
      discountedAmount: null,
      taxRate,
      taxAmount: null,
      totalAmount: null,
    };
  }

  const quantity = normalizeRequiredNumber(input.qty);
  const amount = roundToDecimal(quantity * unitPrice, 2);
  const discountedGrossOrNetAmount = roundToDecimal(
    amount * (discountRate / 100),
    2,
  );
  const discountAmount = roundToDecimal(
    amount - discountedGrossOrNetAmount,
    2,
  );

  if (input.priceIncludesTax === true && taxRate > 0) {
    const totalAmount = discountedGrossOrNetAmount;
    const taxAmount = roundToDecimal(
      totalAmount * (taxRate / (100 + taxRate)),
      2,
    );
    return {
      amount,
      discountRate,
      discountAmount,
      discountedAmount: roundToDecimal(totalAmount - taxAmount, 2),
      taxRate,
      taxAmount,
      totalAmount,
    };
  }

  const discountedAmount = discountedGrossOrNetAmount;
  const taxAmount = roundToDecimal(discountedAmount * (taxRate / 100), 2);
  return {
    amount,
    discountRate,
    discountAmount,
    discountedAmount,
    taxRate,
    taxAmount,
    totalAmount: roundToDecimal(discountedAmount + taxAmount, 2),
  };
}

export function buildOrderItemAmountPreviewSignature(
  item: OrderItemAmountInput,
): string {
  return JSON.stringify({
    quantity: item.qty,
    unitPrice: item.unitPrice ?? null,
    discountRate: item.discountRate ?? null,
    taxRate: item.taxRate ?? null,
    priceIncludesTax: item.priceIncludesTax ?? null,
    customValues: readObject(item.customValues),
  });
}

export function buildOrderItemAmountPreviewRequest(
  item: OrderItemAmountInput,
  context: {
    domain: 'sales' | 'purchase';
    documentType: string;
  },
): OrderItemCommercialAmountPreviewRequest {
  return {
    ...context,
    policyCode: 'default',
    systemValues: {
      quantity: item.qty,
      unitPrice: item.unitPrice,
      discountRate: item.discountRate,
      taxRate: item.taxRate,
      priceIncludesTax: item.priceIncludesTax,
    },
    customValues: readObject(item.customValues),
  };
}

export function normalizeOrderItemAmountPreview(
  result: OrderItemCommercialAmountPreviewResult,
): OrderItemCommercialLineAmounts {
  return {
    amount: result.amount ?? null,
    discountRate: result.discountRate,
    discountAmount: result.discountAmount ?? null,
    discountedAmount: result.discountedAmount ?? null,
    taxRate: result.taxRate,
    taxAmount: result.taxAmount ?? null,
    totalAmount: result.totalAmount ?? null,
  };
}
