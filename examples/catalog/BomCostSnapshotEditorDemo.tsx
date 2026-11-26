import { useMemo, useState } from 'react';
import { Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  BomCostSnapshotEditor,
  BusinessUiProvider,
  type BomCostPreviewSnapshot,
  type BomCostSnapshotCapabilities,
} from '../../src/business';

const initialSnapshot: BomCostPreviewSnapshot = {
  lines: [
    {
      bomItemId: 'bom-line-1',
      materialId: 'mat-1',
      materialCode: 'RM-AL-0081',
      materialName: '6061 铝型材',
      unit: 'piece',
      requiredQty: 12,
      computedQty: 10,
      availableQty: 8,
      stockQty: 14,
      reservedQty: 4,
      frozenQty: 2,
      shortageQty: 4,
      currency: 'CNY',
      unitPrice: 18.5,
      lineCost: 222,
      selectedPriceTierId: 'tier-1',
      candidates: [
        { priceTierId: 'tier-1', supplierId: 'supplier-1', supplierName: '甲供应商', unitPrice: 18.5, currency: 'CNY', isPreferred: true, isDefault: true },
        { priceTierId: 'tier-2', supplierId: 'supplier-2', supplierName: '乙供应商', unitPrice: 19.1, currency: 'CNY', grade: 'A' },
      ],
      approvedSubstitutes: [
        { substituteMaterialId: 'mat-alt', substituteMaterialCode: 'RM-AL-0082', substituteMaterialName: '6063 铝型材', conversionFactor: 1 },
      ],
      lineCapabilities: { canChangeQuantity: true, canDelete: true, canSubstitute: true },
    },
    {
      bomItemId: 'bom-line-2',
      materialId: 'mat-2',
      materialCode: 'PK-BOX-0003',
      materialName: '标准包装箱',
      unit: 'piece',
      requiredQty: 2,
      computedQty: 2,
      availableQty: 20,
      stockQty: 20,
      reservedQty: 0,
      frozenQty: 0,
      shortageQty: 0,
      currency: 'CNY',
      unitPrice: 4.2,
      lineCost: 8.4,
      candidates: [],
      approvedSubstitutes: [],
      lineCapabilities: { canChangeQuantity: false, canDelete: false, canSubstitute: false },
    },
  ],
  totalMaterialCost: 230.4,
  hasUnpriced: false,
  warnings: ['替代料调整仅作用于当前单据 BOM 快照。'],
};

export function BomCostSnapshotEditorDemo() {
  const [variant, setVariant] = useState<'cost' | 'inventory'>('cost');
  const [snapshot, setSnapshot] = useState<BomCostPreviewSnapshot>();
  const capabilities = useMemo<BomCostSnapshotCapabilities>(
    () => ({
      unitLabelMap: { piece: '件' },
      async requestCostPreview(params) {
        return { snapshot: params.bomCostSnapshot ?? initialSnapshot };
      },
    }),
    [],
  );

  return (
    <SectionCard title="BOM 成本与库存快照">
      <Typography.Paragraph type="secondary">
        支持按行能力改数量、删除/恢复、选择批准替代料与供应商价目；成本预览和单位字典由宿主提供。
      </Typography.Paragraph>
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Segmented
          aria-label="BOM 快照展示模式"
          value={variant}
          options={[
            { label: '成本模式', value: 'cost' },
            { label: '库存模式', value: 'inventory' },
          ]}
          onChange={(value) => setVariant(value as typeof variant)}
        />
        <BusinessUiProvider hasPermission={() => false} bomCostSnapshotCapabilities={capabilities}>
          <BomCostSnapshotEditor
            key={variant}
            bomHeaderId="bom-demo"
            productQty={12}
            asOfDate="2026-11-20"
            variant={variant}
            value={snapshot}
            onChange={setSnapshot}
          />
        </BusinessUiProvider>
      </Space>
    </SectionCard>
  );
}
