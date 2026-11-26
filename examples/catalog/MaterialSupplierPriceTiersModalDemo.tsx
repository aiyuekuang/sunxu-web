import { useMemo, useState } from 'react';
import { Button, Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  MaterialSupplierPriceTiersModal,
  BusinessUiProvider,
  type SupplierPriceTierCapabilities,
  type SupplierPriceTierContext,
  type SupplierPriceTierRecord,
} from '../../src/business';

const supplierContext: SupplierPriceTierContext = {
  materialId: 'material-al-6061',
  supplierId: 'supplier-north',
  material: {
    id: 'material-al-6061',
    code: 'RM-AL-0081',
    name: '6061 铝型材',
    unit: 'kg',
  },
  supplier: {
    id: 'supplier-north',
    name: '北方金属材料',
    supplierCode: 'SUP-008',
  },
  supplierMaterialCode: 'SUP-AL-081',
  leadTimeDays: 7,
  minOrderQty: 10,
};

const initialTiers: SupplierPriceTierRecord[] = [
  {
    id: 'tier-a',
    materialId: supplierContext.materialId,
    supplierId: supplierContext.supplierId,
    grade: 'A',
    unitPrice: 12.5,
    priceUnit: 'kg',
    currency: 'CNY',
    taxRate: 13,
    priceIncludesTax: true,
    validFrom: '2026-01-01',
    minOrderQty: 10,
    maxOrderQty: 100,
    priority: 1,
    isDefault: true,
    status: 'active',
    supplierMaterialCode: 'SUP-AL-081',
    supplierModelCode: '6061-T6',
    supplierSpec: '标准挤压材',
    leadTimeDays: 7,
    quotaPercent: 60,
    remarks: '按季度协议价执行。',
  },
  {
    id: 'tier-b',
    materialId: supplierContext.materialId,
    supplierId: supplierContext.supplierId,
    grade: 'B',
    unitPrice: 11.8,
    currency: 'CNY',
    priceIncludesTax: false,
    validFrom: '2026-01-01',
    priority: 2,
    isDefault: false,
    status: 'inactive',
  },
];

export function MaterialSupplierPriceTiersModalDemo() {
  const [tiers, setTiers] = useState(initialTiers);
  const [context, setContext] = useState<SupplierPriceTierContext | null>(null);
  const [createImmediately, setCreateImmediately] = useState(false);
  const [permissions, setPermissions] = useState<'all' | 'read-only'>('all');
  const [showAmounts, setShowAmounts] = useState(false);

  const capabilities = useMemo<SupplierPriceTierCapabilities>(
    () => ({
      materialGradeOptions: [
        { label: '优等', value: 'A' },
        { label: '合格', value: 'B' },
        { label: '让步接收', value: 'C' },
      ],
      materialGradeLabelMap: {
        A: '优等',
        B: '合格',
        C: '让步接收',
      },
      currencyOptions: [
        { label: '人民币 CNY', value: 'CNY' },
        { label: '美元 USD', value: 'USD' },
      ],
      unitLabelMap: { kg: '千克', g: '克', ea: '件' },
      defaultCurrency: 'CNY',
      canCreate: permissions === 'all',
      canUpdate: permissions === 'all',
      canDelete: permissions === 'all',
      remarksTooltip: '补充价目背景；不参与价格匹配或计算。',
      async requestCurrencyOptions() {
        return [
          { label: '人民币 CNY', value: 'CNY' },
          { label: '美元 USD', value: 'USD' },
        ];
      },
      async requestPriceTiers() {
        await new Promise((resolve) => window.setTimeout(resolve, 100));
        return { list: tiers, total: tiers.length };
      },
      async requestUnitConversions() {
        return {
          list: [
            { unit: 'g', baseUnit: 'kg', factorToBase: 0.001 },
            { unit: 'ea', baseUnit: 'kg', factorToBase: 2.5 },
          ],
        };
      },
      async createPriceTier(input) {
        const nextTier: SupplierPriceTierRecord = {
          ...input,
          id: `tier-${Date.now()}`,
          materialId: input.materialId,
          supplierId: input.supplierId,
          currency: input.currency,
          validFrom: input.validFrom ?? new Date().toISOString().slice(0, 10),
          priceIncludesTax: input.priceIncludesTax ?? false,
          isDefault: input.isDefault ?? false,
          status: 'active',
        };
        setTiers((current) => [...current, nextTier]);
      },
      async updatePriceTier(input) {
        setTiers((current) =>
          current.map((tier) =>
            tier.id === input.id ? { ...tier, ...input } : tier,
          ),
        );
      },
      async removePriceTier({ id }) {
        setTiers((current) => current.filter((tier) => tier.id !== id));
      },
    }),
    [permissions, tiers],
  );

  return (
    <SectionCard title="供应商阶梯价维护">
      <Typography.Paragraph type="secondary">
        展示阶梯价列表、新增/编辑字段、权限控制和删除确认；目录用本地确定性服务模拟宿主请求，不连接真实接口。
      </Typography.Paragraph>
      <BusinessUiProvider
        hasPermission={() => permissions === 'all'}
        maskAmount={(amount) =>
          amount == null ? '-' : showAmounts ? String(amount) : '****'
        }
        supplierPriceTierCapabilities={capabilities}
      >
        <Space wrap size={8}>
          <Button onClick={() => setContext(supplierContext)}>
            打开价目表
          </Button>
          <Button
            type="primary"
            onClick={() => {
              setCreateImmediately(true);
              setContext(supplierContext);
            }}
          >
            直接新增价目
          </Button>
          <Segmented
            aria-label="价目维护权限"
            value={permissions}
            options={[
              { label: '可维护', value: 'all' },
              { label: '只读', value: 'read-only' },
            ]}
            onChange={(value) => setPermissions(value as typeof permissions)}
          />
          <Button onClick={() => setShowAmounts((value) => !value)}>
            {showAmounts ? '隐藏金额' : '显示金额'}
          </Button>
        </Space>
        <MaterialSupplierPriceTiersModal
          materialSupplier={context}
          createImmediately={createImmediately}
          onClose={() => {
            setContext(null);
            setCreateImmediately(false);
          }}
          onChanged={() => setTiers((current) => [...current])}
        />
      </BusinessUiProvider>
    </SectionCard>
  );
}
