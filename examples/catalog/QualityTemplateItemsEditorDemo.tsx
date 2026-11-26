import { useState } from 'react';
import { Button, Form, Input, Select, Space, Typography } from 'antd';
import type { QualityTemplateItemFormValue } from '../../src/business/components/QualityTemplateItemsEditor';
import { SectionCard } from '../../src';
import { QualityTemplateItemsEditor } from '../../src/business';

const emptyItem: QualityTemplateItemFormValue = {
  name: '',
  resultType: 'numeric',
  standard: '',
  requiredMeasurementCount: 1,
  isRequired: true,
  photoRequired: false,
  spcEnabled: false,
};

const initialItems: QualityTemplateItemFormValue[] = [
  {
    ...emptyItem,
    name: '轴径',
    specType: 'dimension',
    unit: 'mm',
    standard: '使用千分尺测量轴径。',
    lowerLimit: 14.95,
    upperLimit: 15.05,
    spcEnabled: true,
  },
  {
    ...emptyItem,
    name: '表面状态',
    resultType: 'selection',
    specType: 'appearance',
    standard: '按外观样板目视检查。',
    options: ['无划痕', '轻微划痕', '明显损伤'],
    acceptedValues: ['无划痕'],
    spcEnabled: false,
  },
];

export function QualityTemplateItemsEditorDemo() {
  const [form] = Form.useForm<{ items: QualityTemplateItemFormValue[] }>();
  const [result, setResult] = useState('编辑并检查检验项配置。');

  return (
    <SectionCard title="质量模板检验项编辑器">
      <Typography.Paragraph type="secondary">
        展示数值/选择型检验项的动态字段、复制/删除、范围校验、SPC 与必拍选项；规格类型字典选项由宿主渲染。
      </Typography.Paragraph>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ items: initialItems }}
        onFinish={(values) =>
          setResult(`当前检验项：${values.items.map((item) => item.name).join('、')}`)
        }
      >
        <QualityTemplateItemsEditor
          emptyItem={emptyItem}
          renderSpecTypeField={({ name, label, rules }) => (
            <Form.Item name={name} label={label} rules={rules}>
              <Select
                options={[
                  { label: '尺寸', value: 'dimension' },
                  { label: '外观', value: 'appearance' },
                ]}
              />
            </Form.Item>
          )}
          renderItemExtraFields={({ itemIndex }) => (
            <Form.Item
              name={[itemIndex, 'hostCustomValue']}
              label="宿主扩展字段"
            >
              <Input placeholder="由宿主提供的每项扩展内容" />
            </Form.Item>
          )}
        />
        <Space orientation="vertical" size={8}>
          <Button type="primary" onClick={() => form.submit()}>
            校验并查看配置
          </Button>
          <Typography.Text type="secondary" aria-live="polite">
            {result}
          </Typography.Text>
        </Space>
      </Form>
    </SectionCard>
  );
}
