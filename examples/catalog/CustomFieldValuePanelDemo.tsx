import { useMemo, useState } from 'react';
import { Button, Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  CustomFieldValuePanel,
  BusinessUiProvider,
  type CustomFieldFormCapabilities,
  type CustomFieldSchema,
  type CustomFieldValueDetail,
} from '../../src/business';

type DemoMode = 'filled' | 'empty' | 'error';

const schema: CustomFieldSchema = {
  schemaVersion: 12,
  fields: [
    {
      fieldKey: 'supplierGrade',
      label: '供应商等级',
      fieldKind: 'input',
      dataType: 'select',
      requiredPolicy: 'update',
      displayJson: { showInForm: true, showInDetail: true },
      optionsJson: { options: [{ label: '战略', value: 'strategic' }, { label: '合格', value: 'qualified' }] },
    },
    {
      fieldKey: 'auditDate',
      label: '最近审核日',
      fieldKind: 'input',
      dataType: 'date',
      displayJson: { showInForm: true, showInDetail: true },
    },
    {
      fieldKey: 'annualSpend',
      label: '年度采购额',
      fieldKind: 'formula',
      dataType: 'number',
      displayJson: { showInDetail: true },
    },
    {
      fieldKey: 'qualityNote',
      label: '质量备注',
      fieldKind: 'input',
      dataType: 'long_text',
      displayJson: { showInForm: true, showInDetail: false },
    },
  ],
};

export function CustomFieldValuePanelDemo() {
  const [mode, setMode] = useState<DemoMode>('filled');
  const [editable, setEditable] = useState(true);
  const [lastSave, setLastSave] = useState('尚未保存');
  const [values, setValues] = useState<CustomFieldValueDetail>({
    customValues: {
      supplierGrade: 'qualified',
      auditDate: '2026-10-15',
      qualityNote: '质量稳定，按季度复核。',
    },
    customComputedValues: { annualSpend: 1245000 },
    customComputedErrors: {},
  });

  const capabilities = useMemo<CustomFieldFormCapabilities>(
    () => ({
      async requestFormSchema() {
        if (mode === 'error') throw new Error('自定义字段服务暂不可用');
        return mode === 'empty' ? { schemaVersion: 12, fields: [] } : schema;
      },
      async requestValueDetail() {
        return values;
      },
      async saveValues(body) {
        setValues((current) => ({ ...current, customValues: body.customValues }));
        setLastSave(`已保存 schema v${body.customFieldSchemaVersion}`);
      },
      getErrorMessage(error, fallback) {
        return error instanceof Error ? error.message : fallback;
      },
    }),
    [mode, values],
  );

  return (
    <SectionCard title="自定义字段详情与编辑">
      <Typography.Paragraph type="secondary">
        详情字段、公式值/异常、空态与编辑抽屉沿用业务规则；schema/value 保存 API 由宿主注入。
      </Typography.Paragraph>
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Space wrap>
          <Segmented
            aria-label="自定义字段详情场景"
            value={mode}
            options={[
              { label: '有字段', value: 'filled' },
              { label: '空字段', value: 'empty' },
              { label: '加载错误', value: 'error' },
            ]}
            onChange={(value) => setMode(value as DemoMode)}
          />
          <Button onClick={() => setEditable((current) => !current)}>
            {editable ? '切换为只读' : '切换为可编辑'}
          </Button>
        </Space>
        <BusinessUiProvider hasPermission={() => true} customFieldFormCapabilities={capabilities}>
          <CustomFieldValuePanel
            key={mode}
            objectType="supplier"
            objectId="supplier-demo"
            editable={editable}
            title="供应商扩展信息"
            emptyExtra={<Button size="small">打开字段配置</Button>}
          />
        </BusinessUiProvider>
        <Typography.Text role="status" aria-live="polite">{lastSave}</Typography.Text>
      </Space>
    </SectionCard>
  );
}
