import { Alert, Select, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import type { ProductSerialPickerProps } from './sales-delivery-components-types';

/** @sunxu-component mes-specific @sunxu-domain sales @sunxu-reason Preserves shipment serial selection states while the host supplies eligible serials. */
export function ProductSerialPicker({
  materialId,
  warehouseId,
  batchNo,
  deliveryOrderId,
  quantity,
  value,
  onChange,
  capabilities,
}: ProductSerialPickerProps) {
  const [options, setOptions] = useState<Array<{ serialNo: string; batchNo?: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const normalizedBatchNo = batchNo?.trim();
    if (!materialId || !warehouseId || !normalizedBatchNo) {
      setOptions([]);
      setError(undefined);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    capabilities.listAvailableForShipment({
      materialId,
      warehouseId,
      batchNo: normalizedBatchNo,
      deliveryOrderId,
    })
      .then((result) => {
        if (!cancelled) setOptions(Array.isArray(result) ? [...result] : []);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : '可出库序列号加载失败');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [batchNo, capabilities.listAvailableForShipment, deliveryOrderId, materialId, warehouseId]);

  const prerequisitesReady = Boolean(materialId && warehouseId && batchNo?.trim());
  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <Typography.Text strong>成品序列号</Typography.Text>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
        已选择 {Number.isFinite(quantity) ? quantity : 0} 件，数量按所选序列号自动计算。
      </Typography.Text>
      {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 8 }} /> : null}
      <Select
        mode="multiple"
        showSearch
        optionFilterProp="label"
        placeholder={prerequisitesReady ? '扫码或搜索并选择该批号下的成品序列号' : '请先选择出库仓和批号'}
        disabled={!prerequisitesReady}
        loading={loading}
        notFoundContent={loading ? <Spin size="small" /> : '当前批号没有可出库序列号'}
        value={value}
        options={options.map((serial) => ({ value: serial.serialNo, label: serial.serialNo }))}
        onChange={(serialNumbers) => onChange(serialNumbers as string[])}
        maxTagCount="responsive"
        style={{ width: '100%' }}
      />
    </div>
  );
}
