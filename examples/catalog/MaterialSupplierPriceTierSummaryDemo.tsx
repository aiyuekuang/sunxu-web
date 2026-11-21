import { useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  MaterialSupplierPriceTierSummary,
  MesUiProvider,
  type SupplierPriceTierSummaryRecord,
} from '../../src/mes';

const demoPriceTiers: SupplierPriceTierSummaryRecord[] = [
  {
    id: 'tier-a',
    grade: 'A',
    isDefault: true,
    priority: 1,
    currency: 'CNY',
    unitPrice: 12.5,
  },
  {
    id: 'tier-b',
    grade: 'B',
    isDefault: false,
    priority: 2,
    currency: 'CNY',
    unitPrice: 11.75,
  },
  {
    id: 'tier-c',
    grade: 'C',
    isDefault: false,
    priority: 3,
    currency: 'USD',
    unitPrice: 1.6,
  },
  {
    id: 'tier-d',
    grade: null,
    isDefault: false,
    priority: 4,
    currency: 'CNY',
    unitPrice: 10.25,
  },
];

export function MaterialSupplierPriceTierSummaryDemo() {
  const [showAmounts, setShowAmounts] = useState(false);
  return (
    <SectionCard title="供应商阶梯价摘要">
      <Typography.Paragraph type="secondary">
        按等级、默认标记和优先级排序，只显示前三项并折叠其余数量；等级字典、币种默认值和金额脱敏由 MES 宿主提供。
      </Typography.Paragraph>
      <MesUiProvider
        hasPermission={() => true}
        maskAmount={(amount) =>
          amount == null ? '-' : showAmounts ? String(amount) : '****'
        }
        supplierPriceTierCapabilities={{
          materialGradeLabelMap: { A: '优等', B: '合格', C: '让步接收' },
          defaultCurrency: 'CNY',
        }}
      >
        <Space orientation="vertical" size={8} style={{ width: '100%' }}>
          <MaterialSupplierPriceTierSummary priceTiers={demoPriceTiers} />
          <Button size="small" onClick={() => setShowAmounts((value) => !value)}>
            {showAmounts ? '隐藏价格' : '显示价格'}
          </Button>
        </Space>
      </MesUiProvider>
    </SectionCard>
  );
}
