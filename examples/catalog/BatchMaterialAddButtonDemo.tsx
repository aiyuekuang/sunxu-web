import { useMemo, useState } from 'react';
import { Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  BatchMaterialAddButton,
  BusinessUiProvider,
  type BatchMaterialRecord,
} from '../../src/business';
import { createDemoMaterialTablePickerCapabilities } from './MaterialTablePickerDemo';

interface DemoMaterialRow {
  key: string;
  materialId?: string;
  materialName?: string;
  quantity?: number;
}

const initialRows: DemoMaterialRow[] = [
  { key: 'line-1', materialId: 'material-alu-01', materialName: '6061 铝型材', quantity: 10 },
  { key: 'line-empty' },
];

export function BatchMaterialAddButtonDemo() {
  const [rows, setRows] = useState<DemoMaterialRow[]>(initialRows);
  const [receipt, setReceipt] = useState('尚未批量新增');
  const capabilities = useMemo(createDemoMaterialTablePickerCapabilities, []);

  return (
    <SectionCard title="明细批量新增物料">
      <Typography.Paragraph type="secondary">
        批量选料时跳过当前明细已有的物料，成功追加后移除空占位行，并遵守明细最大行数；数量、库存与物料候选由物料表格弹窗提供。
      </Typography.Paragraph>
      <BusinessUiProvider
        hasPermission={() => true}
        materialTablePickerCapabilities={capabilities}
      >
        <Space orientation="vertical" size={10} style={{ width: '100%' }}>
          <BatchMaterialAddButton<DemoMaterialRow>
            rows={rows}
            onRowsChange={setRows}
            createRow={(material: BatchMaterialRecord, quantity) => ({
              key: `line-${material.id}`,
              materialId: material.id,
              materialName: material.name ?? undefined,
              quantity,
            })}
            getMaterialId={(row) => row.materialId}
            isEmptyRow={(row) => !row.materialId}
            onAdded={(addedRows, materials, nextRows) => {
              setReceipt(
                `追加 ${addedRows.length} 行：${materials
                  .map((material) => material.code)
                  .join('、')}；当前有效行 ${nextRows.length} 行`,
              );
            }}
            maxRows={2}
            quantityLabel="调拨数量"
            requestParams={{ isActive: true }}
          />
          <Space orientation="vertical" size={4}>
            {rows.map((row) => (
              <Typography.Text key={row.key}>
                {row.materialId
                  ? `${row.materialName}：${row.quantity}`
                  : '空白占位行'}
              </Typography.Text>
            ))}
            <Typography.Text role="status" aria-live="polite">
              {receipt}
            </Typography.Text>
          </Space>
        </Space>
      </BusinessUiProvider>
    </SectionCard>
  );
}
