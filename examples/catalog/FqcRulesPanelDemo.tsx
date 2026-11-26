import { App, Button, Space, Switch, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { SectionCard } from '../../src';
import { BusinessUiProvider } from '../../src/business';
import { FqcRulesPanel } from '../../src/business/domains/quality/FqcRulesPanel';
import type {
  FqcControlRuleRecord,
  FqcRulesListQuery,
  FqcRulesPanelCapabilities,
  FqcRulesSelectOption,
} from '../../src/business/domains/quality/fqc-rules-panel-types';
import type { MaterialSelectCapabilities } from '../../src/business/domains/inventory/material-select-types';

const demoPermissions = {
  create: 'catalog.fqc-rule.create',
  update: 'catalog.fqc-rule.update',
  delete: 'catalog.fqc-rule.delete',
};

const materialOptions = [
  {
    label: 'RM-AL-001 · 6061 铝合金板',
    value: 'material-001',
    code: 'RM-AL-001',
    name: '6061 铝合金板',
    unit: 'kg',
  },
  {
    label: 'RM-SS-014 · 304 不锈钢管',
    value: 'material-014',
    code: 'RM-SS-014',
    name: '304 不锈钢管',
    unit: 'm',
  },
];

const familyOptions: FqcRulesSelectOption[] = [
  { label: 'RAW-AL · 铝合金材料', value: 'family-aluminum' },
  { label: 'RAW-SS · 不锈钢材料', value: 'family-stainless' },
];

const templateOptions: FqcRulesSelectOption[] = [
  { label: 'FQC-AL-01 · 铝合金成品检验', value: 'template-aluminum' },
  { label: 'FQC-SS-02 · 不锈钢成品检验', value: 'template-stainless' },
];

const initialRules: FqcControlRuleRecord[] = [
  {
    id: 'rule-demo-001',
    code: 'FQC-AL-001',
    name: '铝合金成品批次检验',
    materialId: materialOptions[0].value,
    material: {
      id: materialOptions[0].value,
      code: materialOptions[0].code,
      name: materialOptions[0].name,
    },
    templateId: 'template-aluminum',
    template: { id: 'template-aluminum', name: '铝合金成品检验' },
    lotFormationMode: 'output_batch',
    receiptGateMode: 'blocking',
    isActive: true,
  },
  {
    id: 'rule-demo-002',
    code: 'FQC-SS-002',
    name: '不锈钢材料系列检验',
    familyId: 'family-stainless',
    family: {
      id: 'family-stainless',
      code: 'RAW-SS',
      name: '不锈钢材料',
    },
    templateId: 'template-stainless',
    template: { id: 'template-stainless', name: '不锈钢成品检验' },
    lotFormationMode: 'work_order_completed',
    receiptGateMode: 'non_blocking',
    isActive: true,
  },
  {
    id: 'rule-demo-003',
    code: 'FQC-LEGACY-003',
    name: '历史停用规则',
    templateId: 'template-aluminum',
    template: { id: 'template-aluminum', name: '铝合金成品检验' },
    lotFormationMode: 'day',
    receiptGateMode: 'non_blocking',
    isActive: false,
  },
];

function getNameByValue(
  options: readonly FqcRulesSelectOption[],
  value?: string | null,
) {
  return options.find((option) => option.value === value);
}

function matchesKeyword(record: FqcControlRuleRecord, keyword: string) {
  if (!keyword) return true;
  const normalized = keyword.toLocaleLowerCase();
  return [
    record.code,
    record.name,
    record.material?.code,
    record.material?.name,
    record.family?.code,
    record.family?.name,
  ].some((value) => value?.toLocaleLowerCase().includes(normalized));
}

function filterRules(
  records: readonly FqcControlRuleRecord[],
  query: FqcRulesListQuery,
) {
  return records.filter((record) => {
    if (!matchesKeyword(record, query.keyword ?? '')) return false;
    if (query.materialId && record.materialId !== query.materialId) return false;
    if (query.familyId && record.familyId !== query.familyId) return false;
    if (
      query.lotFormationMode &&
      record.lotFormationMode !== query.lotFormationMode
    ) {
      return false;
    }
    if (query.receiptGateMode && record.receiptGateMode !== query.receiptGateMode) {
      return false;
    }
    if (query.isActive !== undefined && record.isActive !== query.isActive) {
      return false;
    }
    return true;
  });
}

export function FqcRulesPanelDemo() {
  const [rules, setRules] = useState(initialRules);
  const [familyManagementVisible, setFamilyManagementVisible] = useState(true);
  const [canCreate, setCanCreate] = useState(true);
  const [canUpdate, setCanUpdate] = useState(true);
  const [canDelete, setCanDelete] = useState(true);
  const [canConfigure, setCanConfigure] = useState(true);
  const [showHealthIssues, setShowHealthIssues] = useState(false);
  const [lastAction, setLastAction] = useState('示例数据已就绪');

  const renderConfigEntryLabel = useMemo<
    FqcRulesPanelCapabilities['renderConfigEntryLabel']
  >(
    () =>
      ({ target, children, show, onOpen }) => (
        <Space size={8}>
          <span>{children}</span>
          {show && canConfigure ? (
            <Button
              type="link"
              size="small"
              htmlType="button"
              onClick={() => {
                onOpen();
                setLastAction(
                  target === 'materialFamilies'
                    ? '宿主打开物料系列配置入口'
                    : '宿主打开质检模板配置入口',
                );
              }}
            >
              配置
            </Button>
          ) : null}
        </Space>
      ),
    [canConfigure],
  );

  const materialSelectCapabilities = useMemo<MaterialSelectCapabilities>(
    () => ({
      unitLabelMap: { kg: 'kg', m: 'm' },
      renderConfigEntryLabel: ({ children, show, onOpen }) => (
        <Space size={8}>
          <span>{children}</span>
          {show && canConfigure ? (
            <Button
              type="link"
              size="small"
              htmlType="button"
              onClick={() => {
                onOpen();
                setLastAction('宿主打开物料配置入口');
              }}
            >
              配置
            </Button>
          ) : null}
        </Space>
      ),
    }),
    [canConfigure],
  );

  const capabilities = useMemo<FqcRulesPanelCapabilities>(
    () => ({
      async requestRules(query) {
        const filtered = filterRules(rules, query);
        const from = (query.page - 1) * query.pageSize;
        return {
          list: filtered.slice(from, from + query.pageSize),
          total: filtered.length,
        };
      },
      async requestHealth() {
        return {
          healthy: !showHealthIssues,
          activeRuleCount: rules.filter((rule) => rule.isActive).length,
          uncoveredMaterialCount: showHealthIssues ? 1 : 0,
          issues: showHealthIssues
            ? [
                {
                  ruleId: rules[0]?.id ?? 'rule-demo-001',
                  ruleCode: rules[0]?.code ?? 'FQC-AL-001',
                  level: 'error',
                  message: '示例：存在未覆盖的有效物料',
                },
              ]
            : [],
        };
      },
      async createRule(payload) {
        const id = `rule-demo-${Date.now()}`;
        const material = materialOptions.find(
          (option) => option.value === payload.materialId,
        );
        const family = getNameByValue(familyOptions, payload.familyId);
        const template = getNameByValue(templateOptions, payload.templateId);
        setRules((current) => [
          {
            id,
            code: payload.code || `FQC-${String(current.length + 1).padStart(3, '0')}`,
            name: payload.name,
            materialId: payload.materialId,
            material: material
              ? {
                  id: material.value,
                  code: material.code,
                  name: material.name ?? material.label,
                }
              : undefined,
            familyId: payload.familyId,
            family: family
              ? {
                  id: family.value,
                  code: family.label.split(' · ')[0],
                  name: family.label.split(' · ')[1] ?? family.label,
                }
              : undefined,
            templateId: payload.templateId,
            template: template
              ? { id: template.value, name: template.label.split(' · ')[1] ?? template.label }
              : undefined,
            lotFormationMode: payload.lotFormationMode,
            receiptGateMode: payload.receiptGateMode,
            isActive: payload.isActive ?? true,
          },
          ...current,
        ]);
      },
      async updateRule(payload) {
        const material = materialOptions.find(
          (option) => option.value === payload.materialId,
        );
        const family = getNameByValue(familyOptions, payload.familyId);
        const template = getNameByValue(templateOptions, payload.templateId);
        setRules((current) =>
          current.map((rule) =>
            rule.id !== payload.id
              ? rule
              : {
                  ...rule,
                  ...payload,
                  material: material
                    ? {
                        id: material.value,
                        code: material.code,
                        name: material.name ?? material.label,
                      }
                    : undefined,
                  family: family
                    ? {
                        id: family.value,
                        code: family.label.split(' · ')[0],
                        name: family.label.split(' · ')[1] ?? family.label,
                      }
                    : undefined,
                  template: template
                    ? {
                        id: template.value,
                        name: template.label.split(' · ')[1] ?? template.label,
                      }
                    : undefined,
                },
          ),
        );
      },
      async removeRule({ id }) {
        setRules((current) => current.filter((rule) => rule.id !== id));
      },
      async requestMaterialOptions({ keyWords } = {}) {
        const keyword = keyWords?.trim().toLocaleLowerCase() ?? '';
        return materialOptions.filter((option) =>
          `${option.code} ${option.name}`.toLocaleLowerCase().includes(keyword),
        );
      },
      async requestFamilyOptions({ keyWords } = {}) {
        const keyword = keyWords?.trim().toLocaleLowerCase() ?? '';
        return familyOptions.filter((option) =>
          option.label.toLocaleLowerCase().includes(keyword),
        );
      },
      async requestTemplateOptions({ keyWords } = {}) {
        const keyword = keyWords?.trim().toLocaleLowerCase() ?? '';
        return templateOptions.filter((option) =>
          option.label.toLocaleLowerCase().includes(keyword),
        );
      },
      permissions: demoPermissions,
      familyManagementVisible,
      dictionaries: {
        lotFormationModes: [
          { label: '工单全部完成', value: 'work_order_completed', status: 'Default' },
          { label: '产出批号', value: 'output_batch', status: 'Processing' },
          { label: '班次', value: 'shift', status: 'Processing' },
          { label: '生产业务日', value: 'day', status: 'Processing' },
          { label: '每次报工', value: 'report', status: 'Warning' },
        ],
        receiptGateModes: [
          { label: '不阻断入库', value: 'non_blocking', status: 'Default' },
          { label: '合格后方可入库', value: 'blocking', status: 'Warning' },
        ],
        activeStates: [
          { label: '启用', value: true, status: 'Success' },
          { label: '停用', value: false, status: 'Default' },
        ],
      },
      notifySuccess: (action) =>
        setLastAction(action === 'create' ? '规则创建成功' : '规则更新成功'),
      messages: {
        deleteConfirmTitle: '确认删除这条FQC规则？',
        deleteSuccess: '规则删除成功',
      },
      renderConfigEntryLabel,
    }),
    [familyManagementVisible, renderConfigEntryLabel, rules, showHealthIssues],
  );

  return (
    <App>
      <SectionCard title="FQC 检验批规则">
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            服务端列表、健康检查、权限、字典、物料/系列/模板候选与配置入口均由宿主能力注入。
          </Typography.Paragraph>
          <Space wrap>
            <Space size={8}>
              <Switch
                checked={familyManagementVisible}
                aria-label="显示物料系列管理"
                onChange={setFamilyManagementVisible}
              />
              <Typography.Text>物料系列功能</Typography.Text>
            </Space>
            <Space size={8}>
              <Switch checked={canCreate} aria-label="允许新增规则" onChange={setCanCreate} />
              <Typography.Text>新增权限</Typography.Text>
            </Space>
            <Space size={8}>
              <Switch checked={canUpdate} aria-label="允许编辑规则" onChange={setCanUpdate} />
              <Typography.Text>编辑权限</Typography.Text>
            </Space>
            <Space size={8}>
              <Switch checked={canDelete} aria-label="允许删除规则" onChange={setCanDelete} />
              <Typography.Text>删除权限</Typography.Text>
            </Space>
            <Space size={8}>
              <Switch
                checked={canConfigure}
                aria-label="允许打开主数据配置"
                onChange={setCanConfigure}
              />
              <Typography.Text>配置入口权限</Typography.Text>
            </Space>
            <Button onClick={() => setShowHealthIssues((value) => !value)}>
              {showHealthIssues ? '恢复健康检查' : '模拟健康检查告警'}
            </Button>
          </Space>
          <BusinessUiProvider
            hasPermission={(permission) => {
              if (permission === demoPermissions.create) return canCreate;
              if (permission === demoPermissions.update) return canUpdate;
              if (permission === demoPermissions.delete) return canDelete;
              return canConfigure;
            }}
            materialSelectCapabilities={materialSelectCapabilities}
          >
            <FqcRulesPanel
              key={showHealthIssues ? 'health-issues' : 'health-healthy'}
              capabilities={capabilities}
              layout="embedded"
            />
          </BusinessUiProvider>
          <Typography.Text type="secondary" role="status">
            操作状态：{lastAction}；规则总数：{rules.length}
          </Typography.Text>
        </Space>
      </SectionCard>
    </App>
  );
}
