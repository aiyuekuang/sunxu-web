import { useState } from 'react';
import { Input, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  DocumentBomOpenButton,
  MesUiProvider,
  type MesDocumentBomOpenCapabilities,
} from '../../src/mes';

const demoDocumentBom = {
  id: 'bom-demo',
  documentType: 'sale_order_item' as const,
  documentId: 'sale-order-line-demo',
  versionNo: 'BOM-03',
  status: 'confirmed',
  manufactureMode: 'make',
  lines: [
    {
      id: 'bom-line-1',
      lineNo: 1,
      lineState: 'active' as const,
      itemSource: 'material' as const,
      materialId: 'material-1',
      material: {
        id: 'material-1',
        code: 'RM-AL-0081',
        name: '6061 铝型材',
        unit: '件',
        spec: '20 × 30 × 2 mm',
      },
      quantity: 2,
      unit: '件',
      lossRate: 0.03,
      partType: 'purchased' as const,
      issueRequirementMode: 'required' as const,
      materialConsumptionMode: 'manual_issue' as const,
    },
  ],
};

const capabilities: MesDocumentBomOpenCapabilities = {
  canView: () => true,
  canUpdate: () => false,
  drawerCapabilities: {
    api: {
      current: async () => demoDocumentBom,
      ensure: async () => demoDocumentBom,
      updateLines: async () => demoDocumentBom,
      parseExcel: async () => ({ rows: [] }),
      downloadImportTemplate: async () => new Blob(),
      searchMaterials: async () => [],
    },
    dictionaries: {
      unitOptions: [{ label: '件', value: '件' }],
      unitLabelMap: { 件: '件' },
    },
    customFields: { materialFields: [], documentLineSchema: null },
    routes: { requestEffectiveRouteOptions: async () => [] },
    files: { renderDrawingFiles: () => null },
    materials: {
      renderSelector: ({ value, onChange }) => (
        <Input
          aria-label="物料选择器示例"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ),
    },
    messages: { error: () => {}, warning: () => {}, success: () => {} },
    downloadBlob: () => {},
    configuration: {
      editableDocumentTypes: [],
      isEditableStatus: (status) => status === 'draft',
      resolveDocumentLineItemSource: (line) =>
        line.itemSource === 'temporary' ? 'temporary' : 'material',
      resolveLoadedIssueRequirementMode: (mode) => mode ?? 'required',
      resolveLoadedLineState: (state) => state ?? 'active',
      isManualRouteSelectableLine: () => false,
      resolveDefaultPartTypeFromProcurement: () => 'purchased',
      resolveImportDefaults: ({ row }) => ({
        partType: 'purchased',
        quantity: row.quantity ?? 1,
        issueRequirementMode: 'required',
        lineState: 'active',
      }),
      createNewLineDefaults: () => ({
        itemSource: 'material',
        unit: '件',
        partType: 'purchased',
        lineState: 'active',
        issueRequirementMode: 'required',
        materialConsumptionMode: 'manual_issue',
      }),
      resolveItemSourceSwitchDefaults: (_itemSource, previous) => ({
        partType: 'purchased',
        issueRequirementMode: previous.issueRequirementMode ?? 'required',
        materialConsumptionMode: previous.materialConsumptionMode,
      }),
      isTemporaryLineSaveable: () => true,
      isIssueRequirementGenerated: (mode) => mode === 'required',
      resolveIssueRequirementModeFromToggle: (checked) =>
        checked ? 'required' : 'not_required',
      resolveLineSubmissionDefaults: (input) => ({
        issueRequirementMode: input.issueRequirementMode ?? 'required',
        materialConsumptionMode: input.materialConsumptionMode,
      }),
      parseIssueRequirementMode: (value) =>
        value === 'required' || value === 'not_required' ? value : undefined,
      parseMaterialConsumptionMode: (value) =>
        value === 'manual_issue' || value === 'backflush_on_report'
          ? value
          : undefined,
      documentBomStatusLabels: { confirmed: '已确认' },
      documentBomStatusColors: { confirmed: '#028759' },
      lineStateLabels: { active: '生效', excluded: '已排除' },
      lineStateColors: { active: '#028759', excluded: '#86909c' },
      partTypeLabels: { purchased: '外购' },
      partTypeColors: { purchased: '#1671f1' },
      partTypeOptions: [{ label: '外购', value: 'purchased' }],
      temporaryPartTypeOptions: [{ label: '外购', value: 'purchased' }],
      itemSourceLabels: { material: '物料', temporary: '临时件' },
      itemSourceColors: { material: '#1671f1', temporary: '#b06317' },
      itemSourceOptions: [
        { label: '物料', value: 'material' },
        { label: '临时件', value: 'temporary' },
      ],
      issueRequirementModeDisplay: {
        required: { label: '需要领料', color: '#1671f1' },
        not_required: { label: '无需领料', color: '#86909c' },
      },
      materialConsumptionModeOptions: [
        { label: '手工领料', value: 'manual_issue' },
        { label: '报工倒冲', value: 'backflush_on_report' },
      ],
      materialConsumptionModeDisplay: {
        manual_issue: { label: '手工领料', color: '#1671f1' },
        backflush_on_report: { label: '报工倒冲', color: '#028759' },
      },
      manufactureModeLabels: { make: '自制' },
      formatBomQuantityRounding: () => undefined,
      materialColumnWidth: 260,
      viewTableScrollWidth: 1120,
      editTableScrollWidth: 1680,
      importTemplateHeaders: ['物料编码', '数量', '单位'],
      importPlaceholder: '导入单据 BOM 明细',
      importTemplateFileName: '单据BOM导入模板.xlsx',
      saveReason: '更新单据 BOM',
      parentLinkSaveReason: '修正单据 BOM 父子关系',
      temporaryItemFallbackLabel: '临时件',
      unfilledTemporaryItemLabel: '未填写临时件名称',
      unselectedMaterialLabel: '未选择物料',
      standardBomFallbackLabel: '标准 BOM',
      routeByMaterialRuleLabel: '按物料规则自动选择',
      unknownStatusLabel: '未知状态',
    },
  },
};

export function DocumentBomOpenButtonDemo() {
  const [lastSaved, setLastSaved] = useState('暂无保存记录');

  return (
    <SectionCard title="单据 BOM 入口与抽屉">
      <Space wrap>
        <MesUiProvider hasPermission={() => true} documentBomOpenCapabilities={capabilities}>
          <DocumentBomOpenButton
            documentType="sale_order_item"
            documentId="sale-order-line-demo"
            initialEdit
            initialImport
            onSaved={() => setLastSaved('宿主已收到保存回调')}
          >
            查看单据 BOM
          </DocumentBomOpenButton>
        </MesUiProvider>
        <Typography.Text role="status" aria-live="polite">
          {lastSaved}
        </Typography.Text>
      </Space>
      <Typography.Paragraph type="secondary" style={{ margin: '8px 0 0' }}>
        抽屉、层级明细和只读状态由 Sunxu MES 套件提供；请求、权限、字典与物料选择器由宿主注入。
      </Typography.Paragraph>
    </SectionCard>
  );
}
