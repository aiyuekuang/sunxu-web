import { useEffect, useRef } from 'react';

interface UseScanGunOptions {
  enabled?: boolean;
  onScan: (code: string) => void | Promise<void>;
  minLength?: number;
  maxIntervalMs?: number;
  idleResetMs?: number;
  endKeys?: string[];
}

const DEFAULT_END_KEYS: string[] = ['Enter', 'NumpadEnter', 'Tab'];

/** Keyboard-wedge scanner listener copied from the MES source contract. */
export function useScanGun({
  enabled = true,
  onScan,
  minLength = 3,
  maxIntervalMs = 40,
  idleResetMs = 200,
  endKeys = DEFAULT_END_KEYS,
}: UseScanGunOptions): void {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const bufferRef = useRef('');
  const lastTsRef = useRef(0);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const reset = () => {
      bufferRef.current = '';
      lastTsRef.current = 0;
      if (resetTimerRef.current != null) {
        window.clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };

    const commit = () => {
      const code = bufferRef.current.trim();
      reset();
      if (code.length < minLength) return;
      void Promise.resolve(onScanRef.current(code));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const key = event.key;
      const now = Date.now();

      if (endKeys.includes(key)) {
        if (bufferRef.current.length >= minLength) {
          event.preventDefault();
          commit();
        } else {
          reset();
        }
        return;
      }

      if (key.length !== 1) return;

      if (lastTsRef.current > 0 && now - lastTsRef.current > maxIntervalMs) {
        reset();
      }

      lastTsRef.current = now;
      bufferRef.current += key;

      if (resetTimerRef.current != null) {
        window.clearTimeout(resetTimerRef.current);
      }
      resetTimerRef.current = window.setTimeout(reset, idleResetMs);
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      reset();
    };
  }, [enabled, endKeys, idleResetMs, maxIntervalMs, minLength]);
}
