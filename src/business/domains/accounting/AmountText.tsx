import React from 'react';
import { useAmountMask } from '../../providers/BusinessUiProvider';

export interface AmountTextProps {
  value?: number | string | null;
  prefix?: string;
  precision?: number;
  placeholder?: string;
}

/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Uses the host's price visibility policy while formatting amount values.
 */
export function AmountText({
  value,
  prefix = '¥',
  precision = 2,
  placeholder = '-',
}: AmountTextProps) {
  const maskAmount = useAmountMask();

  if (value == null || value === '') return <span>{placeholder}</span>;

  const numericValue = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (Number.isNaN(numericValue)) return <span>{placeholder}</span>;

  const formatted = `${prefix}${numericValue.toLocaleString('zh-CN', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })}`;

  return <span>{maskAmount(formatted)}</span>;
}
