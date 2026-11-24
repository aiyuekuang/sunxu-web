import { useState } from 'react';
import { ProFormSelect } from '@ant-design/pro-components';
import { Alert, Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import { QualityInspectionItemResultFields } from '../../src/mes/components/QualityInspectionItemResultFields';
import { QualityInspectionSubmitModal } from '../../src/mes/components/QualityInspectionSubmitModal';
import { QualityInspectionActionModals } from '../../src/mes/components/QualityInspectionActionModals';
import type {
  QualityInspectionItemResultFieldsCapabilities,
} from '../../src/mes/components/quality-inspection-item-result-fields-types';
import type {
  QualityInspectionDefectRecord,
  QualityInspectionDictionaryFieldProps,
  QualityInspectionHelpField,
  QualityInspectionItemRecord,
  QualityInspectionSubmitCapabilities,
} from '../../src/mes/components/quality-inspection-modal-types';

const items: QualityInspectionItemRecord[] = [
  {
    id: 'shaft-diameter',
    itemName: '轴径',
    resultType: 'numeric',
    requiredMeasurementCount: 2,
    photoRequired: false,
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
];
const actionInspection = { id: 'inspection-demo' };

const itemFieldCapabilities: QualityInspectionItemResultFieldsCapabilities = {
  formatInspectionStandard: (item) =>
    item.lowerLimit != null && item.upperLimit != null
      ? `${item.lowerLimit} ~ ${item.upperLimit} ${item.unit ?? ''}`.trim()
      : item.standard ?? '-',
  hasAutomaticInspectionJudgement: (item) =>
    (item.resultType === 'numeric' &&
      (item.lowerLimit != null || item.upperLimit != null)) ||
    (item.resultType === 'selection' && (item.acceptedValues?.length ?? 0) > 0),
  renderCustomFieldFormItems: () => null,
};

let nextDefectId = 1;

function dictionarySelect(props: QualityInspectionDictionaryFieldProps) {
  const options =
    props.field === 'defectCode'
      ? [
          { label: '尺寸偏差', value: 'dimension' },
          { label: '表面划伤', value: 'surface' },
        ]
      : [
          { label: '轻微', value: 'minor' },
          { label: '严重', value: 'major' },
        ];

  return (
    <ProFormSelect
      name={props.name}
      label={props.label}
      tooltip={props.fieldHelpProps.tooltip}
      placeholder={props.placeholder}
      options={options}
      rules={
        props.required
          ? [{ required: true, message: props.requiredMessage ?? '请选择' }]
          : undefined
      }
      fieldProps={{ showSearch: props.showSearch, optionFilterProp: 'label' }}
    />
  );
}

export function QualityInspectionWorkflowDemo() {
  const [open, setOpen] = useState(false);
  const [actionSubmitOpen, setActionSubmitOpen] = useState(false);
  const [actionDefectOpen, setActionDefectOpen] = useState(false);
  const [notice, setNotice] = useState('');

  const getFieldHelpProps = (field: QualityInspectionHelpField) => ({
    label: {
      defectCode: '缺陷编码',
      defectDescription: '缺陷描述',
      defectQty: '缺陷数量',
      defectSeverity: '严重程度',
      defectRemarks: '缺陷备注',
      sampleQty: '抽检数量',
      passQty: '合格数量',
      failQty: '不合格数量',
      conclusion: '检查结论',
      inspectionRemarks: '检查备注',
    }[field],
    tooltip: `目录示例字段帮助：${field}`,
  });

  const defectCapabilities = {
    inspectionQtyMin: 1,
    addDefect: async (payload: {
      inspectionId: string;
      defectCode?: string;
      description: string;
      qty: number;
      severity: string;
      remarks?: string;
    }): Promise<QualityInspectionDefectRecord> => ({
      id: `demo-defect-${nextDefectId++}`,
      qty: payload.qty,
    }),
    renderDictionarySelect: dictionarySelect,
    getFieldHelpProps,
    notifySuccess: setNotice,
  };

  const capabilities: QualityInspectionSubmitCapabilities = {
    inspectionQtyMin: 1,
    normalizeInspectionQty: (value) => {
      const number = Number(value);
      return Number.isFinite(number) ? number : undefined;
    },
    deriveInspectionQuantitiesFromPass: ({ sampleQty, passQty }) => {
      const sample = Number(sampleQty);
      const passed = Number(passQty);
      return Number.isFinite(sample) && Number.isFinite(passed)
        ? { failQty: Math.max(0, sample - passed) }
        : {};
    },
    isInspectionQtyClosed: (sampleQty, passQty, failQty) =>
      passQty + failQty === sampleQty,
    hasCompleteInspectionQuantities: ({ sampleQty, passQty, failQty }) =>
      sampleQty != null && passQty != null && failQty != null,
    deriveInspectionConclusion: ({ failQty, hasFailedItem }) =>
      failQty > 0 || hasFailedItem ? 'rejected' : 'passed',
    hasAutomaticInspectionJudgement: (item) =>
      (item.resultType === 'numeric' &&
        (item.lowerLimit != null || item.upperLimit != null)) ||
      (item.resultType === 'selection' && (item.acceptedValues?.length ?? 0) > 0),
    evaluateInspectionItem: (item, value) => {
      if (item.resultType === 'numeric' && typeof value === 'number') {
        return (
          (item.lowerLimit == null || value >= item.lowerLimit) &&
          (item.upperLimit == null || value <= item.upperLimit)
        );
      }
      if (item.resultType === 'selection' && typeof value === 'string') {
        return item.acceptedValues?.includes(value);
      }
      return undefined;
    },
    getRequiredMeasurementCount: (item) => item.requiredMeasurementCount || 1,
    summarizeDefectCoverage: (failQty, defects) => {
      const requiredQty = Number(failQty) || 0;
      const recordedQty = defects.reduce((sum, defect) => sum + defect.qty, 0);
      const missingQty = Math.max(0, requiredQty - recordedQty);
      return {
        requiredQty,
        recordedQty,
        missingQty,
        isCovered: missingQty === 0,
      };
    },
    isProcessRecordType: (value): value is 'first' | 'process' | 'last' | 'other' =>
      ['first', 'process', 'last', 'other'].includes(String(value)),
    uploadInspectionImages: async (files) => files.map((file) => `demo://${file.name}`),
    buildItemCustomValuePayload: (carrier) =>
      carrier && typeof carrier === 'object' && !Array.isArray(carrier)
        ? (carrier as Record<string, unknown>)
        : undefined,
    submitRecord: async (payload) => {
      setNotice(`已模拟提交 ${payload.sampleQty} 件抽检记录`);
    },
    requestUsers: async () => [{ label: '李检验员', value: 'user-demo' }],
    notifyError: setNotice,
    notifySuccess: setNotice,
    getFieldHelpProps,
    renderDictionarySelect: dictionarySelect,
    renderInspectionItemFields: (inspectionItems, schema) => (
      <QualityInspectionItemResultFields
        items={inspectionItems}
        lineCustomFieldSchema={schema}
        capabilities={itemFieldCapabilities}
      />
    ),
    inspectionTypeLabels: { iqc: '来料检验', ipqc: '过程检验', fqc: '成品检验', oqc: '出货检验' },
    conclusionEnum: {
      passed: { text: '合格', status: 'Success' },
      rejected: { text: '不合格', status: 'Error' },
    },
    scrollableModalProps: {
      centered: true,
      styles: { body: { maxHeight: '70vh', overflowY: 'auto' } },
    },
    defectModal: defectCapabilities,
  };

  return (
    <SectionCard title="MES 质量检验工作流">
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary">
          展示检验结果自动判定、抽检数量联动、缺陷覆盖提示和新增缺陷；服务与业务计算由此目录示例模拟。
        </Typography.Paragraph>
        <Space wrap>
          <Button type="primary" onClick={() => setOpen(true)}>
            打开检验记录
          </Button>
          <Button onClick={() => setActionSubmitOpen(true)}>读取详情后报工</Button>
          <Button onClick={() => setActionDefectOpen(true)}>读取详情后登记缺陷</Button>
        </Space>
        {notice ? <Alert type="info" showIcon message={notice} /> : null}
      </Space>
      <QualityInspectionSubmitModal
        open={open}
        onOpenChange={setOpen}
        inspectionId="inspection-demo"
        inspectionType="iqc"
        items={items}
        defects={[]}
        initialValues={{ sampleQty: 5, passQty: 4, failQty: 1 }}
        onDefectsChange={() => setNotice('缺陷记录已更新')}
        onSuccess={() => {
          setOpen(false);
          setNotice('检验记录已保存');
        }}
        capabilities={capabilities}
      />
      <QualityInspectionActionModals
        inspection={actionInspection}
        submitOpen={actionSubmitOpen}
        defectOpen={actionDefectOpen}
        onSubmitOpenChange={setActionSubmitOpen}
        onDefectOpenChange={setActionDefectOpen}
        onSuccess={() => setNotice('质检单已刷新')}
        capabilities={{
          loadDetail: async (inspectionId) => ({
            id: inspectionId,
            type: 'iqc',
            items,
            defects: [],
          }),
          submit: capabilities,
          defect: defectCapabilities,
        }}
      />
    </SectionCard>
  );
}
