import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject, ReactNode } from 'react';
import { Button, Form, Space, Switch, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  MaterialFilteredSelect,
  MaterialMultiSelectField,
  MaterialSelectField,
  MesUiProvider,
  type FilterableSelectRequestFn,
  type MaterialBarcodeRecord,
  type MaterialCategoryRecord,
  type MaterialFamilyRecord,
  type MaterialFilteredSelectOption,
  type MaterialSelectorCustomFieldDefinition,
} from '../../src/business';

const demoMaterials: MaterialFilteredSelectOption[] = [
  {
    label: 'RM-AL-0081 · 6061 铝型材',
    value: 'material-al-0081',
    code: 'RM-AL-0081',
    name: '6061 铝型材',
    spec: '20 × 30 × 2 mm',
    unit: 'M',
    baseType: 'raw',
    categoryId: 'cat-metal',
    categoryName: '金属材料',
    familyId: 'family-aluminum',
    familyLabel: '铝型材（F-AL）',
    customValues: { grade: '6061-T6', tags: ['挤压', '阳极氧化'] },
    customComputedValues: { density: 2.7 },
  },
  {
    label: 'RM-STEEL-0012 · 冷轧钢板',
    value: 'material-steel-0012',
    code: 'RM-STEEL-0012',
    name: '冷轧钢板',
    spec: '1.2 × 1000 mm',
    unit: 'KG',
    baseType: 'raw',
    categoryId: 'cat-metal',
    categoryName: '金属材料',
    familyId: 'family-steel',
    familyLabel: '冷轧钢（F-CR）',
    customValues: { grade: 'SPCC', tags: ['冷轧'] },
    customComputedErrors: { density: '缺少厚度换算参数' },
  },
  {
    label: 'FG-CASE-0003 · 成品机箱',
    value: 'material-case-0003',
    code: 'FG-CASE-0003',
    name: '成品机箱',
    spec: '420 × 320 × 180 mm',
    unit: 'EA',
    baseType: 'finished',
    categoryId: 'cat-enclosure',
    categoryName: '机箱组件',
    familyId: 'family-enclosure',
    familyLabel: '标准机箱（F-BOX）',
    customValues: { grade: 'SPCC', tags: ['喷粉', '装配'] },
    customComputedValues: { density: 1.8 },
  },
];

const demoFamilies: MaterialFamilyRecord[] = [
  { id: 'family-aluminum', name: '铝型材', code: 'F-AL', baseType: 'raw', categoryId: 'cat-metal' },
  { id: 'family-steel', name: '冷轧钢', code: 'F-CR', baseType: 'raw', categoryId: 'cat-metal' },
  { id: 'family-enclosure', name: '标准机箱', code: 'F-BOX', baseType: 'finished', categoryId: 'cat-enclosure' },
];

const demoCategories: MaterialCategoryRecord[] = [
  { id: 'cat-metal', name: '金属材料', displayName: '原材料 / 金属材料', baseType: 'raw', isSystem: false },
  { id: 'cat-enclosure', name: '机箱组件', displayName: '成品 / 机箱组件', baseType: 'finished', isSystem: false },
  { id: 'cat-system-raw', name: '原材料', displayName: '原材料', baseType: 'raw', isSystem: true },
];

const demoCustomFields: MaterialSelectorCustomFieldDefinition[] = [
  {
    fieldKey: 'grade',
    label: '牌号',
    dataType: 'select',
    optionsJson: { options: [{ value: '6061-T6', label: '6061-T6' }, { value: 'SPCC', label: 'SPCC' }] },
    sortOrder: 1,
    displayJson: { showInSelector: true, sortOrder: 1 },
  },
  {
    fieldKey: 'tags',
    label: '工艺',
    dataType: 'multi_select',
    optionsJson: { options: ['挤压', '阳极氧化', '冷轧', '喷粉', '装配'] },
    sortOrder: 2,
    displayJson: { showInSelector: true, sortOrder: 2 },
  },
  {
    fieldKey: 'density',
    label: '密度',
    dataType: 'number',
    sortOrder: 3,
    displayJson: { showInSelector: true, sortOrder: 3 },
  },
  {
    fieldKey: 'lastInspection',
    label: '最近检验日期',
    dataType: 'date',
    sortOrder: 4,
    displayJson: { showInSelector: true, sortOrder: 4 },
  },
];

function DemoScanBridge({
  handlersRef,
}: {
  handlersRef: MutableRefObject<Set<(code: string) => void>>;
}) {
  useEffect(() => {
    let buffer = '';
    let lastKeyAt = 0;
    let resetTimer: number | undefined;

    const reset = () => {
      buffer = '';
      lastKeyAt = 0;
      if (resetTimer !== undefined) {
        window.clearTimeout(resetTimer);
        resetTimer = undefined;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        handlersRef.current.size === 0 ||
        event.isComposing ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }

      if (event.key === 'Enter' || event.key === 'NumpadEnter' || event.key === 'Tab') {
        if (buffer.length >= 3) {
          event.preventDefault();
          const code = buffer.trim();
          reset();
          handlersRef.current.forEach((handler) => handler(code));
        } else {
          reset();
        }
        return;
      }
      if (event.key.length !== 1) return;

      const now = Date.now();
      if (lastKeyAt > 0 && now - lastKeyAt > 40) reset();
      lastKeyAt = now;
      buffer += event.key;
      if (resetTimer !== undefined) window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(reset, 200);
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      reset();
    };
  }, [handlersRef]);

  return null;
}

export function MaterialSelectorDemo() {
  const [form] = Form.useForm();
  const selectedMaterialId = Form.useWatch<string>('materialId', form);
  const selectedRelatedIds =
    Form.useWatch<string[]>('relatedMaterialIds', form) ?? [];
  const [simulateEmpty, setSimulateEmpty] = useState(false);
  const [canConfigureMaterials, setCanConfigureMaterials] = useState(true);
  const [filteredValue, setFilteredValue] = useState<string>();
  const [selectedFilteredOption, setSelectedFilteredOption] =
    useState<MaterialFilteredSelectOption>();
  const scanHandlersRef = useRef(new Set<(code: string) => void>());
  const selectedMaterialSummary = selectedMaterialId
    ? demoMaterials.find((material) => material.value === selectedMaterialId)
        ?.label ?? selectedMaterialId
    : '尚未选择';
  const selectedRelatedSummary = selectedRelatedIds.length
    ? selectedRelatedIds
        .map(
          (id) => demoMaterials.find((material) => material.value === id)?.code ?? id,
        )
        .join('、')
    : '尚未选择';

  const requestMaterials = useCallback<FilterableSelectRequestFn>(
    async (params = {}) => {
      await new Promise((resolve) => window.setTimeout(resolve, 160));
      if (simulateEmpty) return [];
      const keyword = String(params.keyWords ?? '').trim().toLocaleLowerCase();
      return demoMaterials.filter((material) => {
        if (
          keyword &&
          !`${material.code} ${material.name} ${material.label}`
            .toLocaleLowerCase()
            .includes(keyword)
        ) {
          return false;
        }
        if (params.baseType && material.baseType !== params.baseType) return false;
        if (params.categoryId && material.categoryId !== params.categoryId) return false;
        if (params.familyId && material.familyId !== params.familyId) return false;
        return true;
      });
    },
    [simulateEmpty],
  );

  const findMaterialByBarcode = useCallback(
    async ({ barcode }: { barcode: string }): Promise<MaterialBarcodeRecord> => {
      await new Promise((resolve) => window.setTimeout(resolve, 80));
      const record = demoMaterials.find(
        (material) => material.code === barcode || barcode === 'SCAN-AL001' && material.value === 'material-al-0081',
      );
      if (!record) throw new Error(`未匹配物料条码：${barcode}`);
      return {
        id: record.value,
        code: record.code,
        baseType: record.baseType,
        categoryId: record.categoryId,
        familyId: record.familyId,
      };
    },
    [],
  );

  const registerScanGun = useCallback((onScan: (code: string) => void) => {
    scanHandlersRef.current.add(onScan);
    return () => scanHandlersRef.current.delete(onScan);
  }, []);

  const materialSelectCapabilities = useMemo(
    () => ({
      baseTypeOptions: [
        { label: '原材料', value: 'raw' },
        { label: '成品', value: 'finished' },
      ],
      unitLabelMap: { M: '米', KG: '千克', EA: '个' },
      requestFamilies: async ({ baseType }: { baseType?: string }) =>
        demoFamilies.filter((family) => !baseType || family.baseType === baseType),
      requestCategories: async () => demoCategories,
      findMaterialByBarcode,
      registerScanGun,
      loadSelectorCustomFields: async () => demoCustomFields,
      renderConfigEntryLabel: ({ children, onOpen }: {
        children: ReactNode;
        onOpen: () => void;
      }) =>
        canConfigureMaterials ? (
          <Space size={6} align="center" wrap={false}>
            <span>{children}</span>
            <Typography.Link
              href="/"
              target="_blank"
              rel="noreferrer"
              aria-label="新标签页打开物料配置"
              onClick={(event) => {
                event.stopPropagation();
                onOpen();
              }}
              style={{ fontSize: 12, whiteSpace: 'nowrap' }}
            >
              去配置
            </Typography.Link>
          </Space>
        ) : (
          children
        ),
    }),
    [canConfigureMaterials, findMaterialByBarcode, registerScanGun],
  );

  return (
    <SectionCard title="物料选择器">
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Paragraph
          type="secondary"
          data-mes-selector-part="intro"
          style={{ marginBottom: 0 }}
        >
          搜索、筛选和扫码验证复用既有交互；候选、分类、字典、扫码枪与配置权限由宿主注入。
        </Typography.Paragraph>
        <div data-mes-selector-part="host-controls">
          <Space wrap size={12}>
            <Button size="small" onClick={() => setSimulateEmpty((value) => !value)}>
              {simulateEmpty ? '恢复示例候选' : '演示无物料候选'}
            </Button>
            <Space size={8}>
              <Switch
                checked={canConfigureMaterials}
                aria-label="允许进入物料配置"
                onChange={setCanConfigureMaterials}
              />
              <Typography.Text>宿主允许配置物料</Typography.Text>
            </Space>
            <Typography.Text type="secondary">
              扫码示例：聚焦物料选择框后快速输入 SCAN-AL001 并按 Enter。
            </Typography.Text>
          </Space>
        </div>
        <MesUiProvider
          hasPermission={() => canConfigureMaterials}
          materialSelectCapabilities={materialSelectCapabilities}
        >
          <DemoScanBridge handlersRef={scanHandlersRef} />
          <Form form={form} layout="vertical" data-mes-selector-part="form">
            <MaterialSelectField
              name="materialId"
              label="单选物料"
              request={requestMaterials}
              requestKey={simulateEmpty ? 'empty' : 'demo'}
              placeholder="搜索物料编码或名称"
              selectWidth="100%"
            />
            <MaterialMultiSelectField
              name="relatedMaterialIds"
              label="多选关联物料"
              request={requestMaterials}
              requestKey={simulateEmpty ? 'empty' : 'demo'}
              placeholder="搜索并选择多个物料"
              selectWidth="100%"
            />
          </Form>
          <Typography.Text
            type="secondary"
            role="status"
            data-mes-selector-part="form-status"
          >
            表单选中：单选 {selectedMaterialSummary}；多选 {selectedRelatedSummary}
          </Typography.Text>
          <div data-mes-selector-part="cascade">
            <Space orientation="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Text strong>带级联筛选的主数据场景</Typography.Text>
              <MaterialFilteredSelect
                request={requestMaterials}
                requestKey={simulateEmpty ? 'empty' : 'demo'}
                value={filteredValue}
                selectedOption={selectedFilteredOption}
                onChange={(value, option) => {
                  setFilteredValue(value);
                  setSelectedFilteredOption(option);
                }}
                filterMode="always"
                placeholder="搜索物料编码或名称"
              />
              <Typography.Text type="secondary" role="status">
                当前选择：{selectedFilteredOption?.label ?? '尚未选择'}
              </Typography.Text>
            </Space>
          </div>
        </MesUiProvider>
      </Space>
    </SectionCard>
  );
}
