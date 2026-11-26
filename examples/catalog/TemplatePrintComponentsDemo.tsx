import { useMemo, useState } from 'react';
import { ProForm } from '@ant-design/pro-components';
import { Segmented, Space } from 'antd';
import { SectionCard, Typography } from '../../src';
import { TemplateFieldSelector } from '../../src/business/domains/printing/TemplateFieldSelector';
import type {
  TemplateFieldSelectorCapabilities,
  TemplateLayoutPresetOption,
} from '../../src/business/domains/printing/template-print-types';
import { TemplateLayoutPresetSelect } from '../../src/business/domains/printing/TemplateLayoutPresetSelect';

type DemoTemplateType = 'label_compact' | 'document_flow' | 'continuous_fixed';

function isDemoTemplateType(value: string): value is DemoTemplateType {
  return ['label_compact', 'document_flow', 'continuous_fixed'].includes(value);
}

const layoutOptions: TemplateLayoutPresetOption[] = [
  { label: '左文右二维码', value: 'qr_right', description: '标签左侧字段，右侧二维码。', thumbnail: 'label-qr-right' },
  { label: '上方二维码', value: 'qr_top', description: '二维码置顶，字段置于下方。', thumbnail: 'label-qr-top' },
  { label: '下方一维条码', value: 'barcode_bottom', description: '条码横向放在标签底部。', thumbnail: 'label-barcode-bottom' },
  { label: '纯文本标签', value: 'text_only', description: '只打印字段，不放条码。', thumbnail: 'label-text-only' },
  { label: '标准明细单', value: 'standard_table', description: '页眉、明细表与签收区。', thumbnail: 'document-standard-table' },
  { label: '紧凑明细单', value: 'compact_table', description: '适合仓库和采购流转。', thumbnail: 'document-compact-table' },
  { label: '报告汇总单', value: 'report_with_summary', description: '明细后显示合计或结论。', thumbnail: 'document-report-summary' },
  { label: '右上码单据', value: 'header_qr_table', description: '单据右上角放二维码。', thumbnail: 'document-header-qr-table' },
  { label: '单联紧凑', value: 'compact_single', description: '单联连续纸紧凑表格。', thumbnail: 'continuous-compact-single' },
  { label: '三联连续纸', value: 'three_copy', description: '按客户、仓库、财务分联。', thumbnail: 'continuous-three-copy' },
  { label: '送货签收联', value: 'delivery_stub', description: '突出收货信息和签收区。', thumbnail: 'continuous-delivery-stub' },
  { label: '仓库交接联', value: 'warehouse_handover', description: '突出物料、数量和交接。', thumbnail: 'continuous-warehouse-handover' },
];

const fieldCapabilities: TemplateFieldSelectorCapabilities = {
  loadFields: async ({ businessType }) => [
    { fieldPath: 'docNo', fieldLabel: '单据编号', groupName: '单据', businessType, visible: true, isArray: false, requiredInTemplate: true },
    { fieldPath: 'docDate', fieldLabel: '单据日期', groupName: '单据', businessType, visible: true, isArray: false, requiredInTemplate: false },
    { fieldPath: 'customer.name', fieldLabel: '客户名称', groupName: '往来单位', businessType, visible: true, isArray: false, requiredInTemplate: false },
    { fieldPath: 'items[].materialName', fieldLabel: '物料名称', groupName: '明细', businessType, visible: true, isArray: true, requiredInTemplate: false },
    { fieldPath: 'items[].qty', fieldLabel: '数量', groupName: '明细', businessType, visible: true, isArray: true, requiredInTemplate: false },
    { fieldPath: 'barcode', fieldLabel: '条码内容', groupName: '编码', businessType, visible: true, isArray: false, requiredInTemplate: false },
    { fieldPath: 'serialNo', fieldLabel: '序列号', groupName: '编码', businessType, visible: true, isArray: false, requiredInTemplate: true },
  ],
  templateTypeValues: {
    compactLabel: 'label_compact',
    serialLabel: 'serial_label',
    documentFlow: 'document_flow',
  },
  businessTypeValues: { workOrder: 'work_order' },
  fieldPathValues: {
    barcode: 'barcode',
    serialBarcode: 'serialBarcode',
    serialNumber: 'serialNo',
  },
  preferredFieldPaths: [
    'docDate',
    'customer.name',
    'items[].materialName',
    'items[].qty',
  ],
  defaultSelectionLimits: { compactLabel: 6, workOrder: 16, other: 12 },
  isCodeLayout: (templateType, layoutPreset) =>
    (templateType === 'label_compact' || templateType === 'serial_label')
      ? ['qr_right', 'qr_top', 'barcode_bottom'].includes(layoutPreset ?? '')
      : templateType === 'document_flow' && layoutPreset === 'header_qr_table',
};

export function TemplatePrintComponentsDemo() {
  const [templateType, setTemplateType] = useState<DemoTemplateType>('document_flow');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const options = useMemo(
    () =>
      layoutOptions.filter((option) =>
        templateType === 'label_compact'
          ? ['qr_right', 'qr_top', 'barcode_bottom', 'text_only'].includes(option.value)
          : templateType === 'document_flow'
            ? ['standard_table', 'compact_table', 'report_with_summary', 'header_qr_table'].includes(option.value)
            : ['compact_single', 'three_copy', 'delivery_stub', 'warehouse_handover'].includes(option.value),
      ),
    [templateType],
  );

  return (
    <SectionCard title="打印模板字段与版式">
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Segmented
          aria-label="模板类型"
          value={templateType}
          options={[
            { label: '标签', value: 'label_compact' },
            { label: '单据', value: 'document_flow' },
            { label: '连续纸', value: 'continuous_fixed' },
          ]}
          onChange={(value) => {
            if (isDemoTemplateType(value)) setTemplateType(value);
          }}
        />
        <TemplateFieldSelector
          businessType="work_order"
          templateType={templateType}
          layoutPreset={options[0]?.value}
          value={selectedFields}
          onChange={setSelectedFields}
          capabilities={fieldCapabilities}
        />
        <ProForm
          key={templateType}
          layout="vertical"
          submitter={false}
          initialValues={{ layoutPreset: options[0]?.value }}
        >
          <TemplateLayoutPresetSelect
            templateType={templateType}
            options={options}
            formItemProps={{
              label: '模板版式',
              tooltip: '按打印场景选择布局，示意图只用于说明结构。',
            }}
          />
        </ProForm>
        <Typography.Text type="secondary">
          已选字段路径：{selectedFields.join('、') || '暂无'}
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}
