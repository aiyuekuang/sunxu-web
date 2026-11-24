import { useState } from 'react';
import { Alert, Space } from 'antd';
import { SectionCard } from '../../src';
import {
  MaterialScrapDeductionPolicySection,
  ScrapDeductionPolicySection,
  type ScrapDeductionPolicyCapabilities,
} from '../../src/mes';

export function ScrapDeductionPolicySectionsDemo() {
  const [notice, setNotice] = useState('');
  const capabilities: ScrapDeductionPolicyCapabilities = {
    loadCompanyPolicy: async () => ({
      scrapDeductionEnabled: true,
      scrapRateThreshold: 0.05,
      deductionMode: 'per_unit',
      deductionUnitAmount: 2.5,
      defaultSettleRoute: 'wage',
      autoSettle: false,
      deductionItemCode: 'SCRAP-01',
    }),
    updateCompanyPolicy: async () => undefined,
    notifyCompanyPolicySaved: () => setNotice('公司级报废扣款策略已保存'),
    loadMaterialPolicy: async () => ({
      hasOverride: true,
      scrapDeductionEnabled: true,
      scrapRateThreshold: 0.03,
      deductionMode: 'fixed',
      deductionFixedAmount: 8,
    }),
    updateMaterialPolicy: async () => undefined,
    notifyMaterialPolicySaved: () => setNotice('物料专属扣款规则已保存'),
  };

  return (
    <SectionCard title="报废扣款策略">
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        {notice ? <Alert type="success" showIcon message={notice} /> : null}
        <ScrapDeductionPolicySection
          canView
          canUpdate
          capabilities={capabilities}
        />
        <MaterialScrapDeductionPolicySection
          materialId="material-001"
          canEdit
          capabilities={capabilities}
        />
      </Space>
    </SectionCard>
  );
}
