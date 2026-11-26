import { useMemo, useState } from 'react';
import {
  Button,
  Form,
  Segmented,
  Space,
  Typography,
} from 'antd';
import type {
  InspectionTemplateBinding,
  InspectionTemplateSummary,
  ProcessOperationInspectionRulesCapabilities,
  ProcessOperationInspectionTemplateListParams,
} from '../../src/business/domains/quality/process-operation-inspection-rules-types';
import type { MaterialSelectCapabilities } from '../../src/business/domains/inventory/MaterialFilteredSelect';
import { SectionCard } from '../../src';
import {
  BusinessUiProvider,
  ProcessOperationInspectionRulesForm,
} from '../../src/business';

const templates: InspectionTemplateSummary[] = [
  { id: 'template-default', code: 'IPQC-060', name: '前切过程检验' },
  { id: 'template-material', code: 'IPQC-AL', name: '铝型材尺寸检验' },
  { id: 'template-legacy', code: 'IPQC-HIS', name: '历史条件模板' },
];

const materials = [
  {
    value: 'material-al',
    label: 'MAT-AL-001 - 6061 铝型材',
    code: 'MAT-AL-001',
    name: '6061 铝型材',
    spec: '20 × 30 × 2 mm',
    unit: '支',
  },
  {
    value: 'material-steel',
    label: 'MAT-ST-002 - 冷轧钢板',
    code: 'MAT-ST-002',
    name: '冷轧钢板',
    spec: '1.5 mm',
    unit: '张',
  },
];

const initialBindings: InspectionTemplateBinding[] = [
  {
    routeApplicabilityId: 'historical-route-condition',
    templateId: 'template-legacy',
  },
  { templateId: 'template-default' },
  {
    materialId: 'material-al',
    material: {
      id: 'material-al',
      code: 'MAT-AL-001',
      name: '6061 铝型材',
      spec: '20 × 30 × 2 mm',
      unit: '支',
    },
    templateId: 'template-material',
  },
];

export function ProcessOperationInspectionRulesFormDemo() {
  const [form] = Form.useForm<{
    inspectionTemplateBindings: InspectionTemplateBinding[];
  }>();
  const [disabled, setDisabled] = useState(false);
  const [lastAction, setLastAction] = useState(
    '编辑路线工序的默认与物料专属 IPQC 模板。',
  );
  const [serializedBindings, setSerializedBindings] = useState(
    JSON.stringify(initialBindings, null, 2),
  );

  const materialSelectCapabilities = useMemo<MaterialSelectCapabilities>(
    () => ({
      baseTypeOptions: [
        { label: '原材料', value: 'raw_material' },
        { label: '半成品', value: 'semi_finished' },
      ],
      unitLabelMap: { pcs: '件', piece: '件' },
    }),
    [],
  );

  const capabilities = useMemo<ProcessOperationInspectionRulesCapabilities>(
    () => ({
      async listTemplates(params: ProcessOperationInspectionTemplateListParams) {
        const keyword = params.keyword.trim().toLocaleLowerCase();
        return {
          list: templates.filter((template) => {
            const searchable = `${template.code ?? ''} ${template.name ?? ''}`
              .toLocaleLowerCase();
            return !keyword || searchable.includes(keyword);
          }),
        };
      },
      async loadTemplateDetail(id: string) {
        return (
          templates.find((template) => template.id === id) ?? {
            id,
            code: id,
            name: '历史 IPQC 模板',
          }
        );
      },
      async requestMaterials(params) {
        const keyword = (params?.keyWords ?? '').trim().toLocaleLowerCase();
        return materials.filter((material) => {
          const searchable = `${material.code} ${material.name} ${material.spec}`
            .toLocaleLowerCase();
          return !keyword || searchable.includes(keyword);
        });
      },
      renderConfigEntryFieldLabel({ target, label, show, onOpen }) {
        return (
          <Space size={4}>
            <span>{label}</span>
            {show ? (
              <Button
                type="link"
                size="small"
                onClick={() => {
                  onOpen();
                  setLastAction(`打开 ${target} 主数据配置`);
                }}
              >
                配置
              </Button>
            ) : null}
          </Space>
        );
      },
      notifyError(message: string) {
        setLastAction(`校验提示：${message}`);
      },
    }),
    [],
  );

  return (
    <SectionCard title="工艺路线 IPQC 模板规则">
      <Typography.Paragraph type="secondary">
        默认模板可覆盖常规工序；物料专属模板优先命中。历史路线条件规则只读保留，修改后仍按宿主提交序列化结果。
      </Typography.Paragraph>
      <Space wrap style={{ marginBottom: 12 }}>
        <Button onClick={() => setDisabled((current) => !current)}>
          {disabled ? '启用编辑' : '禁用编辑'}
        </Button>
        <Button
          type="primary"
          onClick={() => form.submit()}
          disabled={disabled}
        >
          查看规则值
        </Button>
        <Segmented
          aria-label="检验规则演示状态"
          value={disabled ? '只读' : '编辑'}
          options={['编辑', '只读']}
          onChange={(value) => setDisabled(value === '只读')}
        />
      </Space>
      <BusinessUiProvider
        hasPermission={() => true}
        materialSelectCapabilities={materialSelectCapabilities}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ inspectionTemplateBindings: initialBindings }}
          onValuesChange={(values) => {
            const next = values.inspectionTemplateBindings;
            if (next) setSerializedBindings(JSON.stringify(next, null, 2));
          }}
          onFinish={(values) => {
            const next = values.inspectionTemplateBindings ?? [];
            setSerializedBindings(JSON.stringify(next, null, 2));
            setLastAction(`表单输出规则值，共 ${next.length} 条（含历史条件规则）。`);
          }}
        >
          <Form.Item name="inspectionTemplateBindings" noStyle>
            <ProcessOperationInspectionRulesForm
              disabled={disabled}
              capabilities={capabilities}
            />
          </Form.Item>
        </Form>
      </BusinessUiProvider>
  <Space
    orientation="vertical"
    size={6}
    style={{ marginTop: 12, width: '100%' }}
  >
        <Typography.Text type="secondary" aria-live="polite">
          {lastAction}
        </Typography.Text>
        <Typography.Text type="secondary">
          以下为组件输出的表单值；宿主在提交时负责过滤回显快照并组装 DTO。
        </Typography.Text>
        <pre style={{ maxHeight: 220, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
          {serializedBindings}
        </pre>
      </Space>
    </SectionCard>
  );
}
