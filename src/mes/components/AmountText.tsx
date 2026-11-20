import React from 'react';
import { useMesAmountMask } from '../MesUiProvider';

export interface AmountTextProps {
  value?: number | string | null;
  prefix?: string;
  precision?: number;
  placeholder?: string;
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain finance
 * @sunxu-reason Uses the MES host's price visibility policy while formatting amount values.
 */
export function AmountText({
  value,
  prefix = '¥',
  precision = 2,
  placeholder = '-',
}: AmountTextProps) {
  const maskAmount = useMesAmountMask();

  if (value == null || value === '') return <span>{placeholder}</span>;

  const numericValue = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (Number.isNaN(numericValue)) return <span>{placeholder}</span>;

  const formatted = `${prefix}${numericValue.toLocaleString('zh-CN', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })}`;

  return <span>{maskAmount(formatted)}</span>;
}
