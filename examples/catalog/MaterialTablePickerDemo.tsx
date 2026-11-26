import { useMemo, useState } from 'react';
import { Segmented, Space, Switch, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  MaterialTablePicker,
  MesUiProvider,
  type MaterialCategoryNode,
  type MaterialPickerRecord,
  type MesMaterialTablePickerCapabilities,
  type MaterialTablePickerMode,
  type MaterialTablePickerSelection,
} from '../../src/business';

const demoMaterials: MaterialPickerRecord[] = [
  {
    id: 'material-alu-01',
    code: 'RM-AL-0081',
    name: '6061 铝型材',
    spec: '20 × 30 × 2 mm',
    unit: 'PC',
    currentStockQty: 245,
    thumbnailUrl:
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect width="40" height="40" rx="6" fill="%23e6f4ff"/%3E%3Cpath d="M8 29 18 12l5 8 5-5 5 14H8Z" fill="%231677ff"/%3E%3C/svg%3E',
  },
  {
    id: 'material-ss-02',
    code: 'RM-SS-0024',
    name: '不锈钢支架',
    spec: '厚 1.5 mm',
    unit: 'PC',
    currentStockQty: 88,
  },
  {
    id: 'material-box-03',
    code: 'PK-BOX-0003',
    name: '标准包装箱',
    spec: '600 × 400 × 300 mm',
    unit: 'EA',
    currentStockQty: 36,
  },
];

const demoCategories: MaterialCategoryNode[] = [
  {
    id: 'system-raw',
    name: '原材料',
    isSystem: true,
    baseType: 'raw',
    children: [
      { id: 'metal', name: '金属材料', children: [] },
      { id: 'polymer', name: '高分子材料', children: [] },
    ],
  },
  {
    id: 'system-package',
    name: '包装材料',
    isSystem: true,
    baseType: 'finished',
    children: [],
  },
];

export function createDemoMaterialTablePickerCapabilities():
  MesMaterialTablePickerCapabilities {
  return {
    async requestCategoryTree() {
      await new Promise((resolve) => window.setTimeout(resolve, 100));
      return demoCategories;
    },
    async requestMaterials(params) {
      await new Promise((resolve) => window.setTimeout(resolve, 120));
      const keyword = String(params.keyword ?? '').toLocaleLowerCase();
      const categoryId = String(params.categoryId ?? '');
      const baseType = String(params.baseType ?? '');
      const candidates = demoMaterials.filter((material) => {
        const keywordMatches =
          !keyword ||
          material.name?.toLocaleLowerCase().includes(keyword) ||
          material.code?.toLocaleLowerCase().includes(keyword);
        const categoryMatches = !categoryId
          ? true
          : categoryId === 'metal'
            ? material.id === 'material-alu-01' || material.id === 'material-ss-02'
            : material.id === 'material-box-03';
        const typeMatches =
          !baseType ||
          (baseType === 'raw'
            ? material.id !== 'material-box-03'
            : material.id === 'material-box-03');
        return keywordMatches && categoryMatches && typeMatches;
      });
      const page = Number(params.page ?? 1);
      const pageSize = Number(params.pageSize ?? 20);
      const start = (page - 1) * pageSize;
      return {
        list: candidates.slice(start, start + pageSize),
        total: candidates.length,
      };
    },
    async requestCustomerStockSummary({ materialIds }) {
      return {
        items: materialIds.map((materialId) => ({
          materialId,
          availableQty:
            demoMaterials.find((material) => material.id === materialId)
              ?.currentStockQty ?? 0,
        })),
      };
    },
    unitLabelMap: { PC: '件', EA: '个' },
    pagination: {
      defaultPageSize: 20,
      showSizeChanger: true,
      pageSizeOptions: [10, 20, 50, 100],
    },
  };
}

export function MaterialTablePickerDemo() {
  const [mode, setMode] = useState<MaterialTablePickerMode>('multiple');
  const [customerScope, setCustomerScope] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<MaterialPickerRecord[]>([]);
  const [receipt, setReceipt] = useState('尚未确认物料');
  const capabilities = useMemo(createDemoMaterialTablePickerCapabilities, []);

  const handleMultipleChange = (
    ids: string[],
    records: MaterialPickerRecord[],
    selections?: MaterialTablePickerSelection<MaterialPickerRecord>[],
  ) => {
    setSelectedIds(ids);
    setSelectedRecords(records);
    const quantities = selections?.map(
      (item) => `${item.material.name}: ${item.quantity}`,
    );
    setReceipt(
      records.length > 0
        ? `已确认 ${records.map((item) => item.code).join('、')}${quantities?.length ? `；数量 ${quantities.join('、')}` : ''}`
        : '已清空所选物料',
    );
  };

  return (
    <SectionCard title="物料表格弹窗选择器">
      <Typography.Paragraph type="secondary">
        保留左侧业务分类、名称/编码搜索、分页勾选、跨页记录、已选清单移除、数量录入、库存合计和图库预览；分类、物料、库存、单位字典及分页设置由宿主注入。
      </Typography.Paragraph>
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Space wrap size={12}>
          <Segmented
            aria-label="物料选择模式"
            value={mode}
            options={[
              { label: '单选', value: 'single' },
              { label: '多选并录入数量', value: 'multiple' },
            ]}
            onChange={(value) => {
              setMode(value as MaterialTablePickerMode);
              setSelectedId(undefined);
              setSelectedIds([]);
              setSelectedRecords([]);
            }}
          />
          <Space align="center" size={8}>
            <Switch
              checked={customerScope}
              aria-label="按客户货主汇总库存"
              onChange={setCustomerScope}
            />
            <Typography.Text>客户货主库存口径</Typography.Text>
          </Space>
        </Space>
        <MesUiProvider
          hasPermission={() => true}
          materialTablePickerCapabilities={capabilities}
        >
          <MaterialTablePicker<MaterialPickerRecord>
            mode={mode}
            value={selectedId}
            values={selectedIds}
            selectedRecords={selectedRecords}
            title="选择物料"
            quantityLabel={mode === 'multiple' ? '订购数量' : undefined}
            requestParams={{ isActive: true }}
            customerId={customerScope ? 'customer-demo-001' : undefined}
            onChange={(id, record) => {
              setSelectedId(id);
              setSelectedRecords(record ? [record] : []);
              setReceipt(record ? `已确认 ${record.code} - ${record.name}` : '已清空物料');
            }}
            onValuesChange={handleMultipleChange}
          />
        </MesUiProvider>
        <Typography.Text role="status" aria-live="polite">
          {receipt}
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}
