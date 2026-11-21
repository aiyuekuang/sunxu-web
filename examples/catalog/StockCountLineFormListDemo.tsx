import { useMemo } from 'react';
import { Button, Form, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  MesUiProvider,
  StockCountLineFormList,
  type BatchMaterialRecord,
  type MesMaterialTablePickerCapabilities,
  type StockCountLineFormCapabilities,
  type StockCountLineFormRow,
} from '../../src/mes';

interface DemoStockCountLine extends StockCountLineFormRow {
  id?: string;
}

const demoMaterials: BatchMaterialRecord[] = [
  {
    id: 'material-al-6061',
    code: 'RM-AL-0061',
    name: '6061 铝型材',
    spec: '20 × 30 × 2 mm',
    unit: '根',
    hasBatchTracking: true,
  },
  {
    id: 'material-box-01',
    code: 'PK-BOX-0001',
    name: '标准包装箱',
    spec: '中号',
    unit: '个',
  },
];

export function StockCountLineFormListDemo() {
  const [form] = Form.useForm();
  const watchedLines = Form.useWatch('lines', form) as
    | DemoStockCountLine[]
    | undefined;
  const lines = watchedLines ?? [];

  const materialPickerCapabilities = useMemo<MesMaterialTablePickerCapabilities>(
    () => ({
      requestCategoryTree: async () => [],
      requestMaterials: async ({ page, pageSize }) => ({
        list: demoMaterials.slice((page - 1) * pageSize, page * pageSize),
        total: demoMaterials.length,
      }),
      requestCustomerStockSummary: async () => ({ items: [] }),
      pagination: { pageSize: 10, showSizeChanger: false },
    }),
    [],
  );

  const capabilities = useMemo<StockCountLineFormCapabilities<DemoStockCountLine>>(
    () => ({
      hasActiveMaterialOptions: async () => true,
      ownerTypes: {
        options: [
          { label: '公司', value: 'company' },
          { label: '客户', value: 'customer' },
          { label: '供应商', value: 'supplier' },
        ],
        customerValue: 'customer',
        supplierValue: 'supplier',
      },
      createRowFromMaterial: (material) => ({
        materialId: material.id,
        materialRecord: material,
        materialOption: {
          label: [material.code, material.name, material.spec]
            .filter(Boolean)
            .join(' - '),
          value: material.id,
        },
        ownerType: 'company',
      }),
      requestCustomerOwnerOptions: async () => [
        { label: '客户甲', value: 'customer-a' },
      ],
      requestSupplierOwnerOptions: async () => [
        { label: '供应商乙', value: 'supplier-b' },
      ],
      requestStockLocationOptions: async () => [
        { label: '原材料仓/A区/A-01', value: 'location-a01' },
      ],
      renderConfigEntryLabel: ({ children, show, onOpen }) => (
        <span>
          {children}
          {show ? (
            <Button type="link" size="small" onClick={onOpen}>
              去配置
            </Button>
          ) : null}
        </span>
      ),
      isEmptyRow: (line) => !line.materialId,
    }),
    [],
  );

  return (
    <SectionCard title="MES 盘点明细表单">
      <Typography.Paragraph type="secondary">
        表单保留物料、货主、仓位、批号、行备注和动态自定义字段；列表请求、空行构造与配置权限由 MES 宿主注入。
      </Typography.Paragraph>
      <MesUiProvider
        hasPermission={() => true}
        materialTablePickerCapabilities={materialPickerCapabilities}
      >
        <Form form={form} layout="vertical" initialValues={{ lines: [{}] }}>
          <StockCountLineFormList
            form={form}
            warehouseId="warehouse-raw"
            showLocationControl
            lineCustomFieldSchema={undefined}
            titlePrefix="盘点行"
            minLineCount={1}
            capabilities={capabilities}
          />
          <Space style={{ marginBlockStart: 12 }}>
            <Typography.Text type="secondary">
              当前明细：{lines.filter((line) => line.materialId).length} 行
            </Typography.Text>
          </Space>
        </Form>
      </MesUiProvider>
    </SectionCard>
  );
}
