import { useState } from 'react';
import { Button, Form, Row, Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  DocumentLineCustomFieldFormItems,
  type DocumentLineCustomFieldSchema,
} from '../../src/mes';

type DemoMode = 'fields' | 'empty';

const demoSchema: DocumentLineCustomFieldSchema = {
  schemaVersion: 3,
  fields: [
    {
      fieldKey: 'drawingRevision',
      label: '图纸版本',
      fieldKind: 'input',
      dataType: 'text',
      requiredPolicy: 'create',
      sortOrder: 20,
      displayJson: { showInForm: true, sortOrder: 1 },
    },
    {
      fieldKey: 'sampleQuantity',
      label: '抽样数量',
      fieldKind: 'input',
      dataType: 'number',
      requiredPolicy: 'none',
      sortOrder: 10,
      displayJson: { showInForm: true, sortOrder: 2 },
    },
    {
      fieldKey: 'unitPrice',
      label: '抽检单价',
      fieldKind: 'input',
      dataType: 'money',
      requiredPolicy: 'none',
      displayJson: { showInForm: true, sortOrder: 2.5 },
    },
    {
      fieldKey: 'inspectionRequired',
      label: '需要检验',
      fieldKind: 'input',
      dataType: 'boolean',
      requiredPolicy: 'none',
      displayJson: { showInForm: true, sortOrder: 3 },
    },
    {
      fieldKey: 'inspectionDate',
      label: '检验日期',
      fieldKind: 'input',
      dataType: 'date',
      requiredPolicy: 'none',
      displayJson: { showInForm: true, sortOrder: 4 },
    },
    {
      fieldKey: 'inspectionTimestamp',
      label: '检验时间',
      fieldKind: 'input',
      dataType: 'datetime',
      requiredPolicy: 'none',
      displayJson: { showInForm: true, sortOrder: 4.5 },
    },
    {
      fieldKey: 'inspectionLevel',
      label: '检验等级',
      fieldKind: 'input',
      dataType: 'select',
      requiredPolicy: 'none',
      displayJson: { showInForm: true, sortOrder: 5 },
      optionsJson: {
        options: [
          { label: '常规', value: 'normal' },
          { label: '加严', value: 'strict' },
          { label: '停用选项', value: 'inactive', enabled: false },
        ],
      },
    },
    {
      fieldKey: 'tags',
      label: '质量标签',
      fieldKind: 'input',
      dataType: 'multi_select',
      requiredPolicy: 'none',
      displayJson: { showInForm: true, sortOrder: 6 },
      optionsJson: { options: ['外观', '尺寸', '包装'] },
    },
    {
      fieldKey: 'note',
      label: '检验说明',
      fieldKind: 'input',
      dataType: 'long_text',
      requiredPolicy: 'none',
      displayJson: { showInForm: true, sortOrder: 7 },
    },
    {
      fieldKey: 'attachmentNote',
      label: '附件说明',
      fieldKind: 'input',
      dataType: 'file',
      requiredPolicy: 'none',
      displayJson: { showInForm: true, sortOrder: 8 },
    },
    {
      fieldKey: 'imageNote',
      label: '图片说明',
      fieldKind: 'input',
      dataType: 'image',
      requiredPolicy: 'none',
      displayJson: { showInForm: true, sortOrder: 9 },
    },
    {
      fieldKey: 'hiddenField',
      label: '不显示字段',
      fieldKind: 'input',
      dataType: 'text',
      displayJson: { showInForm: false },
    },
    {
      fieldKey: 'computedField',
      label: '公式字段',
      fieldKind: 'formula',
      dataType: 'number',
      displayJson: { showInForm: true },
    },
    {
      fieldKey: 'inactiveField',
      label: '停用字段',
      fieldKind: 'input',
      dataType: 'text',
      isActive: false,
      displayJson: { showInForm: true },
    },
  ],
};

export function DocumentLineCustomFieldFormItemsDemo() {
  const [mode, setMode] = useState<DemoMode>('fields');
  const [lastSubmitted, setLastSubmitted] = useState('尚未提交');
  const schema =
    mode === 'empty' ? { schemaVersion: 3, fields: [] } : demoSchema;

  return (
    <SectionCard title="单据行自定义字段表单项">
      <Typography.Paragraph type="secondary">
        按 showInForm、启用状态与字段顺序生成单据行表单项；保留 MES 的字段类型映射、必填策略、禁用选项和日期字符串序列化。
        字段数据由调用方传入，组件不请求接口或保存业务数据。
      </Typography.Paragraph>
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Segmented
          aria-label="单据行自定义字段场景"
          value={mode}
          options={[
            { label: '有可见字段', value: 'fields' },
            { label: '无可见字段', value: 'empty' },
          ]}
          onChange={(value) => setMode(value as DemoMode)}
        />
        <Form
          key={mode}
          layout="vertical"
          initialValues={{
            items: [
              {
                customValues: {
                  drawingRevision: 'REV-C',
                  sampleQuantity: 5,
                  inspectionRequired: true,
                  inspectionDate: '2026-11-20',
                  inspectionTimestamp: '2026-11-20T09:30:00.000Z',
                  inspectionLevel: 'strict',
                  tags: ['尺寸'],
                  note: '复核关键尺寸及包装状态。',
                },
              },
            ],
          }}
          onFinish={(values) => setLastSubmitted(JSON.stringify(values))}
        >
          <Row gutter={[12, 0]}>
            <DocumentLineCustomFieldFormItems
              schema={schema}
              namePrefix={['items', 0]}
            />
          </Row>
          <Button htmlType="submit" type="primary">
            提交示例
          </Button>
        </Form>
        <Typography.Text role="status" aria-live="polite">
          最近提交：{lastSubmitted}
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}
