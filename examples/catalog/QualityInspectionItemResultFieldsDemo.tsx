import { Form, Typography } from 'antd';
import { SectionCard } from '../../src';
import { QualityInspectionItemResultFields } from '../../src/business/components/QualityInspectionItemResultFields';
import type {
  QualityInspectionItemResultFieldsCapabilities,
  QualityInspectionResultItem,
} from '../../src/business/components/quality-inspection-item-result-fields-types';

const demoItems: QualityInspectionResultItem[] = [
  {
    id: 'shaft-diameter',
    itemName: '轴径',
    resultType: 'numeric',
    requiredMeasurementCount: 2,
    photoRequired: true,
    isRequired: true,
    lowerLimit: 14.95,
    upperLimit: 15.05,
    unit: 'mm',
  },
  {
    id: 'surface-finish',
    itemName: '表面粗糙度',
    resultType: 'selection',
    photoRequired: false,
    isRequired: true,
    options: ['Ra 0.8', 'Ra 1.6', 'Ra 3.2'],
    acceptedValues: ['Ra 0.8', 'Ra 1.6'],
  },
  {
    id: 'visual-check',
    itemName: '外观检查',
    resultType: 'judgement',
    photoRequired: false,
    isRequired: false,
    standard: '无裂纹、明显划伤或变形',
  },
];

const capabilities: QualityInspectionItemResultFieldsCapabilities = {
  formatInspectionStandard(item) {
    const lower = item.lowerLimit;
    const upper = item.upperLimit;
    const unit = item.unit?.trim() ?? '';
    if (lower != null && upper != null) return `${lower} ~ ${upper} ${unit}`.trim();
    if (lower != null) return `>= ${lower} ${unit}`.trim();
    if (upper != null) return `<= ${upper} ${unit}`.trim();
    return item.standard?.trim() || '-';
  },
  hasAutomaticInspectionJudgement(item) {
    return (
      (item.resultType === 'numeric' &&
        (item.upperLimit != null || item.lowerLimit != null)) ||
      (item.resultType === 'selection' &&
        (item.acceptedValues?.length ?? 0) > 0)
    );
  },
  renderCustomFieldFormItems: () => null,
};

export function QualityInspectionItemResultFieldsDemo() {
  const [form] = Form.useForm();

  return (
    <SectionCard title="质量检验项结果录入">
      <Typography.Paragraph type="secondary">
        展示数值多次测量、选项判定、人工判定与必拍照片；模板规则及动态字段由宿主提供。
      </Typography.Paragraph>
      <Form form={form} layout="vertical">
        <QualityInspectionItemResultFields
          items={demoItems}
          capabilities={capabilities}
        />
      </Form>
    </SectionCard>
  );
}
