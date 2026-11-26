import { AutoComplete, Spin } from 'antd';
import dayjs from 'dayjs';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useMesBatchSuggestCapabilities } from '../MesUiProvider';
import { useScanGun } from '../hooks/useScanGun';
import type {
  BatchSuggestionMode,
  BatchSuggestionRecord,
} from './batch-suggest-types';

interface BatchOption {
  value: string;
  label: ReactNode;
  batch: BatchSuggestionRecord;
}

export interface BatchSuggestInputProps {
  materialId?: string;
  warehouseId?: string;
  ownerType?: string;
  customerId?: string;
  ownerRefId?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSelectBatch?: (batch: BatchSuggestionRecord) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: CSSProperties;
  pageSize?: number;
  mode?: BatchSuggestionMode;
  sourceDocType?: string;
}

function formatQty(value: number | string | null | undefined): string {
  const normalized = Number(value ?? 0);
  if (!Number.isFinite(normalized)) return '0';
  return normalized.toFixed(4).replace(/\.?0+$/, '');
}

function buildOptionLabel(
  batch: BatchSuggestionRecord,
  statusText?: Readonly<Record<string, string>>,
): ReactNode {
  const batchStatusText = batch.status
    ? statusText?.[batch.status]
    : undefined;
  const locationText =
    batch.location?.pathName ??
    batch.storageLocationSnapshot ??
    (batch.locationId ? '已指定仓位' : '仓库级库存');
  const extras = [
    batchStatusText,
    batch.expiryDate ? `有效期 ${batch.expiryDate}` : undefined,
    `库存 ${formatQty(batch.qty)}`,
    batch.warehouse?.name,
    locationText,
  ].filter(Boolean);

  return (
    <div style={{ lineHeight: 1.4 }}>
      <div>{batch.batchNo}</div>
      {extras.length > 0 ? (
        <div style={{ color: '#8c8c8c', fontSize: 12 }}>
          {extras.join(' · ')}
        </div>
      ) : null}
    </div>
  );
}

function isBatchVisible(
  batch: BatchSuggestionRecord,
  mode: BatchSuggestionMode,
): boolean {
  if (!batch.batchNo) return false;
  if (mode === 'inbound') return batch.status !== 'consumed';
  return (
    batch.status === 'available' &&
    (!batch.expiryDate || batch.expiryDate >= dayjs().format('YYYY-MM-DD'))
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain inventory
 * @sunxu-reason Retains MES batch visibility and scan matching while the host supplies batch records and status wording.
 */
export function BatchSuggestInput({
  materialId,
  warehouseId,
  ownerType,
  customerId,
  ownerRefId,
  value,
  onChange,
  onSelectBatch,
  placeholder = '优先选择或扫码已有批次',
  disabled = false,
  style,
  pageSize = 20,
  mode = 'outbound',
  sourceDocType,
}: BatchSuggestInputProps) {
  const capabilities = useMesBatchSuggestCapabilities();
  const [options, setOptions] = useState<BatchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanEnabled, setScanEnabled] = useState(false);
  const requestIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const fetchOptions = useCallback(
    async (keyword?: string): Promise<BatchSuggestionRecord[]> => {
      const listBatches = capabilities?.listBatches;
      if (!materialId || disabled || !listBatches) {
        setOptions([]);
        setLoading(false);
        return [];
      }

      const requestId = ++requestIdRef.current;
      setLoading(true);
      let visibleBatches: BatchSuggestionRecord[] = [];
      try {
        const result = await listBatches({
          page: 1,
          pageSize,
          keyword: keyword?.trim() || undefined,
          materialId,
          warehouseId: warehouseId || undefined,
          ownerType,
          customerId,
          ownerRefId,
          status: mode === 'outbound' ? 'available' : undefined,
          excludeExpired: mode === 'outbound',
          sourceDocType,
        });

        if (unmountedRef.current || requestId !== requestIdRef.current) {
          return [];
        }

        const batches = result?.list ?? [];
        visibleBatches = batches.filter((batch) => isBatchVisible(batch, mode));
        setOptions(
          visibleBatches.map((batch) => ({
            value: batch.batchNo,
            label: buildOptionLabel(batch, capabilities?.statusText),
            batch,
          })),
        );
      } finally {
        if (!unmountedRef.current && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
      return visibleBatches;
    },
    [
      capabilities,
      customerId,
      disabled,
      materialId,
      mode,
      ownerRefId,
      ownerType,
      pageSize,
      sourceDocType,
      warehouseId,
    ],
  );

  useEffect(() => {
    setOptions([]);
    if (materialId && value?.trim()) void fetchOptions(value);
  }, [fetchOptions, materialId, value, warehouseId]);

  const scheduleFetch = useCallback(
    (keyword: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void fetchOptions(keyword), 250);
    },
    [fetchOptions],
  );

  const handleChange = useCallback(
    (nextValue: string) => onChange?.(nextValue),
    [onChange],
  );

  const handleSearch = useCallback(
    (keyword: string) => scheduleFetch(keyword),
    [scheduleFetch],
  );

  const handleScan = useCallback(
    async (code: string) => {
      onChange?.(code);
      const batches = await fetchOptions(code);
      const matchedBatch = batches.find((batch) => batch.batchNo === code);
      if (matchedBatch) onSelectBatch?.(matchedBatch);
    },
    [fetchOptions, onChange, onSelectBatch],
  );

  useScanGun({
    enabled: scanEnabled && !disabled && Boolean(materialId),
    onScan: handleScan,
  });

  const notFoundContent = useMemo(() => {
    if (!materialId) return '请先选择物料';
    if (loading) {
      return (
        <div style={{ padding: '4px 0', textAlign: 'center' }}>
          <Spin size="small" />
        </div>
      );
    }
    return '未找到匹配批次，可继续手动输入';
  }, [loading, materialId]);

  return (
    <div data-scan-scope="batch-suggest-input" style={style}>
      <AutoComplete
        value={value ?? ''}
        options={options}
        style={{ width: '100%' }}
        allowClear
        disabled={disabled || !materialId}
        filterOption={false}
        notFoundContent={notFoundContent}
        onChange={handleChange}
        onSelect={(_, option) => {
          const selectedOption = option as BatchOption;
          onSelectBatch?.(selectedOption.batch);
        }}
        onSearch={handleSearch}
        placeholder={materialId ? placeholder : '请先选择物料'}
        suffix={loading ? <Spin size="small" /> : undefined}
        onFocus={() => {
          setScanEnabled(true);
          void fetchOptions(value);
        }}
        onBlur={() => setScanEnabled(false)}
      />
    </div>
  );
}
