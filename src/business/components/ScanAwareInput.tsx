import { Input, type InputProps, type InputRef } from 'antd';
import { useCallback, useRef, useState } from 'react';
import { useScanGun } from '../hooks/useScanGun';

export interface ScanAwareInputProps extends InputProps {
  onScan?: (code: string) => void | Promise<void>;
}

/**
 * @sunxu-layer business
 * @sunxu-domain scanning
 * @sunxu-reason Retains MES keyboard-wedge scan recognition while input value and asynchronous scan handling remain host controlled.
 */
export function ScanAwareInput({
  disabled,
  onFocus,
  onBlur,
  onScan,
  ...inputProps
}: ScanAwareInputProps) {
  const inputRef = useRef<InputRef>(null);
  const [scanEnabled, setScanEnabled] = useState(false);

  const handleScan = useCallback(
    async (code: string) => {
      const input = inputRef.current?.input;
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value',
        )?.set;
        setter?.call(input, code);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }

      await onScan?.(code);
    },
    [onScan],
  );

  useScanGun({
    enabled: scanEnabled && !disabled,
    onScan: handleScan,
  });

  return (
    <div data-scan-scope="scan-aware-input" style={{ display: 'contents' }}>
      <Input
        {...inputProps}
        disabled={disabled}
        ref={inputRef}
        onFocus={(event) => {
          setScanEnabled(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setScanEnabled(false);
          onBlur?.(event);
        }}
      />
    </div>
  );
}
