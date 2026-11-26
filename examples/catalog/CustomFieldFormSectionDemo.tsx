import { useMemo, useState } from 'react';
import { ProForm } from '@ant-design/pro-components';
import { Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  CustomFieldFormSection,
  MesUiProvider,
  type MesCustomFieldFormCapabilities,
  type MesCustomFieldSchema,
  type CustomFieldFormRuntime,
} from '../../src/business';

type DemoMode = 'create' | 'update' | 'empty' | 'error';

const demoSchema: MesCustomFieldSchema = {
  schemaVersion: 7,
  fields: [
    {
      fieldKey: 'drawingRevision',
      label: '图纸版本',
      fieldKind: 'input',
      dataType: 'text',
      requiredPolicy: 'create',
      displayJson: { showInForm: true },
      validationJson: { maxLength: 24 },
    },
    {
      fieldKey: 'inspectionLevel',
      label: '检验等级',
      fieldKind: 'input',
      dataType: 'select',
      requiredPolicy: 'update',
      displayJson: { showInForm: true },
      optionsJson: {
        options: [
          { label: '常规', value: 'normal' },
          { label: '加严', value: 'strict' },
          { label: '停用选项', value: 'inactive', enabled: false },
        ],
      },
    },
    {
      fieldKey: 'sampleQty',
      label: '抽样数量',
      fieldKind: 'input',
      dataType: 'number',
      displayJson: { showInForm: true },
      validationJson: { min: 1, max: 50 },
    },
    {
      fieldKey: 'requiresPhoto',
      label: '要求留存照片',
      fieldKind: 'input',
      dataType: 'boolean',
      displayJson: { showInForm: true },
    },
    {
      fieldKey: 'internalNote',
      label: '内部检验说明',
      fieldKind: 'input',
      dataType: 'long_text',
      displayJson: { showInForm: true },
      validationJson: { maxLength: 120 },
    },
    {
      fieldKey: 'hidden',
      label: '隐藏字段',
      fieldKind: 'input',
      dataType: 'text',
      displayJson: { showInForm: false },
    },
    {
      fieldKey: 'computed',
      label: '公式字段',
      fieldKind: 'formula',
      dataType: 'number',
      displayJson: { showInForm: true },
    },
  ],
};

export function CustomFieldFormSectionDemo() {
  const [mode, setMode] = useState<DemoMode>('create');
  const [runtime, setRuntime] = useState<CustomFieldFormRuntime | null>(null);
  const [lastSubmitted, setLastSubmitted] = useState('尚未提交');
  const capabilities = useMemo<MesCustomFieldFormCapabilities>(
    () => ({
      async requestFormSchema() {
        await new Promise((resolve) => window.setTimeout(resolve, 120));
        if (mode === 'error') throw new Error('自定义字段服务暂不可用');
        if (mode === 'empty') return { schemaVersion: 7, fields: [] };
        return demoSchema;
      },
      async requestValueDetail() {
        await new Promise((resolve) => window.setTimeout(resolve, 100));
        return {
          customValues: {
            drawingRevision: 'REV-C',
            inspectionLevel: 'strict',
            sampleQty: 5,
            requiresPhoto: true,
            internalNote: '对关键尺寸增加抽检频次。',
          },
        };
      },
      getErrorMessage(error, fallback) {
        return error instanceof Error ? error.message : fallback;
      },
    }),
    [mode],
  );

  return (
    <SectionCard title="动态自定义字段表单">
      <Typography.Paragraph type="secondary">
        按字段 schema 生成不同类型的 ProForm 控件；创建/更新必填策略、数值范围、选项禁用、值回填、加载重试和运行时元数据均保留，schema/value 请求由宿主提供。
      </Typography.Paragraph>
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Segmented
          aria-label="自定义字段表单场景"
          value={mode}
          options={[
            { label: '创建', value: 'create' },
            { label: '编辑', value: 'update' },
            { label: '空 schema', value: 'empty' },
            { label: '加载错误', value: 'error' },
          ]}
          onChange={(value) => setMode(value as DemoMode)}
        />
        <MesUiProvider
          hasPermission={() => true}
          customFieldFormCapabilities={capabilities}
        >
          <ProForm
            key={mode === 'update' ? 'editing' : 'creating'}
            onFinish={async (values) => {
              setLastSubmitted(JSON.stringify(values));
              return true;
            }}
          >
            <CustomFieldFormSection
              objectType="purchase_receipt_item"
              objectId={mode === 'update' ? 'receipt-item-demo' : undefined}
              onRuntimeChange={setRuntime}
            />
          </ProForm>
        </MesUiProvider>
        <Typography.Text role="status" aria-live="polite">
          Schema：{runtime ? `v${runtime.schemaVersion}` : '未就绪'}；输入字段{' '}
          {runtime?.inputKeys.length ?? 0} 项，表单字段{' '}
          {runtime?.formFieldKeys.length ?? 0} 项。最近提交：{lastSubmitted}
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}
