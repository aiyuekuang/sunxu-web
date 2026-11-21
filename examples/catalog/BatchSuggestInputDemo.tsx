import { useMemo, useState } from 'react';
import { Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  BatchSuggestInput,
  MesUiProvider,
  type BatchSuggestionMode,
  type BatchSuggestionRecord,
  type MesBatchSuggestCapabilities,
} from '../../src/mes';

const demoBatches: BatchSuggestionRecord[] = [
  {
    id: 'batch-available',
    batchNo: 'LOT-2026-0418',
    status: 'available',
    expiryDate: '2099-12-31',
    qty: 36,
    warehouse: { name: '原材料仓' },
    location: { pathName: 'A区 / 02排 / 03层' },
  },
  {
    id: 'batch-expired',
    batchNo: 'LOT-2020-0007',
    status: 'available',
    expiryDate: '2020-01-01',
    qty: 3,
    warehouse: { name: '原材料仓' },
    locationId: 'location-old',
  },
  {
    id: 'batch-consumed',
    batchNo: 'LOT-2025-0102',
    status: 'consumed',
    expiryDate: '2099-12-31',
    qty: 0,
    storageLocationSnapshot: '历史仓位快照',
  },
];

export function BatchSuggestInputDemo() {
  const [mode, setMode] = useState<BatchSuggestionMode>('outbound');
  const [batchNo, setBatchNo] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('尚未选择批次');
  const capabilities = useMemo<MesBatchSuggestCapabilities>(
    () => ({
      statusText: { available: '可用', consumed: '已耗用' },
      async listBatches(params) {
        await new Promise((resolve) => window.setTimeout(resolve, 160));
        const query = params.keyword?.trim().toLocaleLowerCase();
        return {
          list: demoBatches.filter(
            (batch) => !query || batch.batchNo.toLocaleLowerCase().includes(query),
          ),
        };
      },
    }),
    [],
  );

  return (
    <SectionCard title="批次联想与扫码选择">
      <Typography.Paragraph type="secondary">
        出库仅显示可用且未过期批次；入库可选非已耗用批次。扫码后按批号精确匹配，匹配成功时把完整批次记录回传宿主。
      </Typography.Paragraph>
      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
        <Segmented
          aria-label="批次选择模式"
          value={mode}
          options={[
            { label: '出库', value: 'outbound' },
            { label: '入库', value: 'inbound' },
          ]}
          onChange={(value) => setMode(value as BatchSuggestionMode)}
        />
        <MesUiProvider
          hasPermission={() => true}
          batchSuggestCapabilities={capabilities}
        >
          <BatchSuggestInput
            materialId="material-demo"
            warehouseId="warehouse-raw"
            mode={mode}
            value={batchNo}
            onChange={setBatchNo}
            onSelectBatch={(batch) => setSelectedBatch(batch.batchNo)}
          />
        </MesUiProvider>
        <Typography.Text type="secondary" aria-live="polite">
          当前批号：{batchNo || '空'}；选中记录：{selectedBatch}
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}
