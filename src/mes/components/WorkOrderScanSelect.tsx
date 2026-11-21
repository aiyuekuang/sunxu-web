import { App, Select, type SelectProps } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMesWorkOrderScanSelectCapabilities } from '../MesUiProvider';
import { useScanGun } from '../hooks/useScanGun';
import type {
  WorkOrderScanRecord,
  WorkOrderSelectOption,
  WorkOrderSelectRequest,
} from './work-order-scan-select-types';

const STALE_REMOTE_SELECT_MESSAGE = '正在按当前搜索条件加载选项，请稍候再选择';

function normalizeKeyword(keyword?: string | null) {
  return (keyword ?? '').trim().toLowerCase();
}

function isSnapshotCurrent(current?: string | null, loaded?: string | null) {
  return normalizeKeyword(current) === normalizeKeyword(loaded);
}

function sortOptionsByKeyword<T extends WorkOrderSelectOption>(
  options: T[],
  keyword?: string | null,
): T[] {
  const normalizedKeyword = normalizeKeyword(keyword);
  if (!normalizedKeyword) return options;
  const rank = (option: T) => {
    const texts = [option.code, option.name, option.label]
      .filter((value): value is string => typeof value === 'string')
      .map(normalizeKeyword);
    if (texts.some((text) => text === normalizedKeyword)) return 0;
    if (texts.some((text) => text.startsWith(normalizedKeyword))) return 1;
    return 2;
  };
  return [...options].sort((left, right) => rank(left) - rank(right));
}

export interface WorkOrderScanSelectProps<
  TWorkOrder extends WorkOrderScanRecord = WorkOrderScanRecord,
> extends Omit<
    SelectProps<string>,
    'options' | 'onChange' | 'value' | 'defaultValue'
  > {
  request?: WorkOrderSelectRequest;
  value?: string;
  onChange?: (value: string | undefined) => void;
  debounceTime?: number;
  valueMode?: 'id' | 'orderNo';
  onResolved?: (workOrder: TWorkOrder) => void | Promise<void>;
  validateScannedWorkOrder?: (
    workOrder: TWorkOrder,
  ) => boolean | string | Promise<boolean | string>;
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain manufacturing
 * @sunxu-reason Preserves MES work-order lookup and scan validation while search, scan resolution, and callbacks stay host injected.
 */
export function WorkOrderScanSelect<
  TWorkOrder extends WorkOrderScanRecord = WorkOrderScanRecord,
>({
  request,
  value,
  onChange,
  disabled = false,
  debounceTime = 300,
  placeholder = '请搜索并选择工单',
  valueMode = 'id',
  onResolved,
  validateScannedWorkOrder,
  style,
  ...selectProps
}: WorkOrderScanSelectProps<TWorkOrder>) {
  const { message } = App.useApp();
  const capabilities = useMesWorkOrderScanSelectCapabilities();
  const [options, setOptions] = useState<WorkOrderSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanEnabled, setScanEnabled] = useState(false);
  const requestRef = useRef(request);
  const requestIdRef = useRef(0);
  const searchRef = useRef('');
  const optionsKeywordRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  requestRef.current = request;

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const fetchOptions = useCallback(async (keyword?: string) => {
    const requestId = ++requestIdRef.current;
    const requestKeyword = normalizeKeyword(keyword);
    setLoading(true);
    try {
      const load = requestRef.current ?? capabilities?.requestWorkOrders;
      const nextOptions = load ? await load({ keyWords: keyword }) : [];
      if (unmountedRef.current || requestId !== requestIdRef.current) return;
      optionsKeywordRef.current = requestKeyword;
      setOptions(sortOptionsByKeyword(nextOptions, keyword));
    } finally {
      if (!unmountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [capabilities]);

  useEffect(() => {
    void fetchOptions();
  }, [fetchOptions]);

  const handleSearch = useCallback(
    (keyword: string) => {
      searchRef.current = keyword;
      if (!isSnapshotCurrent(keyword, optionsKeywordRef.current)) {
        requestIdRef.current += 1;
        setOptions([]);
        setLoading(true);
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void fetchOptions(keyword), debounceTime);
    },
    [debounceTime, fetchOptions],
  );

  const handleChange = useCallback(
    (nextValue: string | undefined) => {
      if (
        nextValue &&
        !isSnapshotCurrent(searchRef.current, optionsKeywordRef.current)
      ) {
        message.warning(STALE_REMOTE_SELECT_MESSAGE);
        return;
      }
      onChange?.(nextValue);
    },
    [message, onChange],
  );

  const handleScan = useCallback(
    async (code: string) => {
      try {
        const parse = capabilities?.parseScannedWorkOrder;
        const result = parse ? await parse({ code }) : undefined;
        const workOrder = result?.workOrder;
        if (!workOrder) throw new Error(`未识别为工单：${code}`);
        const resolvedWorkOrder = workOrder as TWorkOrder;
        const validationResult =
          await validateScannedWorkOrder?.(resolvedWorkOrder);
        if (validationResult === false) {
          message.warning('当前工单不符合页面选择条件');
          return;
        }
        if (
          typeof validationResult === 'string' &&
          validationResult.trim().length > 0
        ) {
          message.warning(validationResult);
          return;
        }

        const nextValue =
          valueMode === 'orderNo'
            ? resolvedWorkOrder.orderNo
            : resolvedWorkOrder.id;
        const label = `${resolvedWorkOrder.orderNo}${
          resolvedWorkOrder.materialName
            ? ` - ${resolvedWorkOrder.materialName}`
            : ''
        }`;

        setOptions((previous) => {
          const next = previous.filter((option) => option.value !== nextValue);
          return [{ label, value: nextValue }, ...next];
        });
        onChange?.(nextValue);
        await onResolved?.(resolvedWorkOrder);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : `未识别为工单：${code}`;
        message.warning(errorMessage);
      }
    },
    [capabilities, message, onChange, onResolved, validateScannedWorkOrder, valueMode],
  );

  useScanGun({
    enabled: scanEnabled && !disabled,
    onScan: handleScan,
  });

  return (
    <Select<string>
      {...selectProps}
      allowClear
      showSearch
      filterOption={false}
      value={value}
      onChange={handleChange}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      loading={loading}
      style={style}
      onSearch={handleSearch}
      onFocus={(event) => {
        setScanEnabled(true);
        selectProps.onFocus?.(event);
      }}
      onBlur={(event) => {
        setScanEnabled(false);
        selectProps.onBlur?.(event);
      }}
    />
  );
}
