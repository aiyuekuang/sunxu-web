import { InputNumber, type InputNumberProps } from 'antd';
import { useEffect, useRef, useState } from 'react';

export type DocumentLineQuantityInputProps = Omit<
  InputNumberProps,
  'onChange' | 'value'
> & {
  value?: number;
  onChange?: (value: number) => void;
};

/**
 * Keeps the editable empty state local while a user replaces a required quantity.
 * The row remains numeric, and an empty field restores its last valid value on blur.
 */
export function DocumentLineQuantityInput({
  value,
  onChange,
  onBlur,
  ...props
}: DocumentLineQuantityInputProps) {
  const [draftValue, setDraftValue] = useState<number | null>(value ?? null);
  const lastCommittedValueRef = useRef(value);

  useEffect(() => {
    if (value === lastCommittedValueRef.current) return;
    lastCommittedValueRef.current = value;
    setDraftValue(value ?? null);
  }, [value]);

  return (
    <InputNumber
      {...props}
      value={draftValue}
      onChange={(nextValue) => {
        const normalizedValue = nextValue === null ? null : Number(nextValue);
        setDraftValue(
          normalizedValue !== null && Number.isFinite(normalizedValue)
            ? normalizedValue
            : null,
        );
        if (normalizedValue === null || !Number.isFinite(normalizedValue)) {
          return;
        }
        lastCommittedValueRef.current = normalizedValue;
        onChange?.(normalizedValue);
      }}
      onBlur={(event) => {
        if (draftValue === null) setDraftValue(value ?? null);
        onBlur?.(event);
      }}
    />
  );
}
