/** @sunxu-layer business @sunxu-domain inventory @sunxu-reason Keeps the host stock summary and preview states in the UI suite while query access, permission, quantity formatting, and copy remain host-owned. */
import { Alert, Space, Spin, Tag, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import type {
  StockBalancePreviewAlertType,
  StockBalancePreviewProps,
  StockBalancePreviewQuery,
  StockBalancePreviewSnapshot,
} from './stock-balance-preview-types';

function toFiniteNumber(value?: number | null): number | undefined {
  if (value === undefined || value === null) return undefined;
  return Number.isFinite(Number(value)) ? Number(value) : undefined;
}

function getAlertType(
  preview: StockBalancePreviewSnapshot,
): StockBalancePreviewAlertType {
  if (preview.blockers.length > 0) return 'error';
  if (
    preview.warnings.length > 0 ||
    preview.sufficient === false ||
    preview.batchSufficient === false
  ) {
    return 'warning';
  }
  return 'info';
}

/**
 * Displays a host-loaded stock balance summary without owning inventory access.
 * @sunxu-layer business
 * @sunxu-domain inventory
 * @sunxu-reason Preserves host stock preview composition and async states while the host supplies permission, query, unit formatting, and wording.
 */
export function StockBalancePreview({
  warehouseId,
  materialId,
  locationId,
  storageLocation,
  batchNo,
  requiredQty,
  adjustQty,
  mode = 'outbound',
  capabilities,
}: StockBalancePreviewProps) {
  const [preview, setPreview] =
    useState<StockBalancePreviewSnapshot | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const loadPreviewRef = useRef(capabilities.loadPreview);
  const formatErrorRef = useRef(capabilities.formatError);
  const errorFallbackRef = useRef(capabilities.copy.errorFallback);

  useEffect(() => {
    loadPreviewRef.current = capabilities.loadPreview;
    formatErrorRef.current = capabilities.formatError;
    errorFallbackRef.current = capabilities.copy.errorFallback;
  }, [
    capabilities.loadPreview,
    capabilities.formatError,
    capabilities.copy.errorFallback,
    capabilities.requestContextKey,
  ]);

  const normalizedBatchNo = batchNo?.trim() || undefined;
  const normalizedRequiredQty = toFiniteNumber(requiredQty);
  const normalizedAdjustQty = toFiniteNumber(adjustQty);

  useEffect(() => {
    if (!capabilities.canRead || !warehouseId || !materialId) {
      setPreview(null);
      setErrorMessage(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const query: StockBalancePreviewQuery = {
      warehouseId,
      materialId,
      locationId,
      storageLocation,
      batchNo: normalizedBatchNo,
      requiredQty: normalizedRequiredQty,
      adjustQty: normalizedAdjustQty,
    };

    setPreview(null);
    setLoading(true);
    setErrorMessage(null);

    const load = async () => {
      try {
        const result = await loadPreviewRef.current(query);
        if (!cancelled) {
          setPreview(result);
          setErrorMessage(null);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setPreview(null);
          setErrorMessage(
            formatErrorRef.current(error) || errorFallbackRef.current,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    capabilities.canRead,
    capabilities.requestContextKey,
    warehouseId,
    materialId,
    locationId,
    storageLocation,
    normalizedBatchNo,
    normalizedRequiredQty,
    normalizedAdjustQty,
  ]);

  if (!capabilities.canRead || !warehouseId || !materialId) return null;

  if (errorMessage) {
    return <Alert type="error" showIcon message={errorMessage} />;
  }

  if (loading && !preview) {
    return (
      <Space size={6}>
        <Spin size="small" />
        <Typography.Text type="secondary">
          {capabilities.copy.loading}
        </Typography.Text>
      </Space>
    );
  }

  if (!preview) return null;

  const detailItems: Array<{ key: string; label: string; value: number }> = [
    {
      key: 'bookQty',
      label: capabilities.copy.bookQty,
      value: preview.bookQty,
    },
    {
      key: 'availableQty',
      label: capabilities.copy.availableQty,
      value: preview.availableQty,
    },
  ];
  if (Number(preview.reservedQty) > 0) {
    detailItems.push({
      key: 'reservedQty',
      label: capabilities.copy.reservedQty,
      value: preview.reservedQty,
    });
  }
  if (Number(preview.frozenQty) > 0) {
    detailItems.push({
      key: 'frozenQty',
      label: capabilities.copy.frozenQty,
      value: preview.frozenQty,
    });
  }
  if (normalizedBatchNo && preview.batchAvailableQty != null) {
    detailItems.push({
      key: 'batchAvailableQty',
      label: capabilities.copy.batchAvailableQty,
      value: preview.batchAvailableQty,
    });
  }
  if (mode === 'adjust' && preview.bookQtyAfterAdjust != null) {
    detailItems.push({
      key: 'bookQtyAfterAdjust',
      label: capabilities.copy.adjustedQty,
      value: preview.bookQtyAfterAdjust,
    });
  }

  const descriptionTexts = [
    mode === 'outbound' && Number(preview.shortageQty) > 0
      ? capabilities.copy.outboundShortage
      : undefined,
    ...preview.blockers,
    ...preview.warnings,
  ].filter((text): text is string => Boolean(text));

  return (
    <Alert
      type={getAlertType(preview)}
      showIcon
      message={
        <Space size={[8, 4]} wrap>
          <Typography.Text strong>
            {capabilities.copy.currentStock}
          </Typography.Text>
          {detailItems.map((item) => (
            <Tag key={item.key} color="default" style={{ marginInlineEnd: 0 }}>
              {item.label} {capabilities.formatQuantity(item.value)}
            </Tag>
          ))}
          {preview.shortageQty != null && preview.shortageQty > 0 ? (
            <Tag color="red" style={{ marginInlineEnd: 0 }}>
              {capabilities.copy.shortageQty}{' '}
              {capabilities.formatQuantity(preview.shortageQty)}
            </Tag>
          ) : null}
          {preview.batchShortageQty != null &&
          preview.batchShortageQty > 0 ? (
            <Tag color="red" style={{ marginInlineEnd: 0 }}>
              {capabilities.copy.batchShortageQty}{' '}
              {capabilities.formatQuantity(preview.batchShortageQty)}
            </Tag>
          ) : null}
        </Space>
      }
      description={
        descriptionTexts.length > 0 ? descriptionTexts.join('；') : undefined
      }
    />
  );
}
