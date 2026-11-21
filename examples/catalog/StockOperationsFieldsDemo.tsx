import { useMemo, useState } from 'react';
import { ProForm } from '@ant-design/pro-components';
import { Alert, Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  ConfigHelpIcon,
  ConfigLabel,
  ConfigOptionText,
  ManufactureModeSelect,
  ManufactureModeTag,
  OperationConfigHelpProvider,
  SaleOrderFreeSampleSettlementNotice,
  SaleOrderFulfillmentScenarioField,
  SaleOrderSettlementModeField,
  StockBalancePreview,
  StockBusinessDateField,
  StockLocationDependencyField,
  StockLocationInlineSelector,
  type MesStockLocationSelectCapabilities,
  type SaleOrderFieldOption,
  type StockBalancePreviewCapabilities,
} from '../../src/mes';

const fulfillmentOptions: SaleOrderFieldOption[] = [
  { label: '正常销售', value: 'normal_sale' },
  { label: '客户样品', value: 'customer_sample' },
];

const settlementOptions: SaleOrderFieldOption[] = [
  { label: '正常收费', value: 'charged' },
  { label: '免费折让', value: 'free' },
];

const manufactureOptions: SaleOrderFieldOption[] = [
  { label: '标准生产', value: 'standard' },
  { label: '按单生产', value: 'make_to_order' },
  { label: '按单设计', value: 'engineer_to_order' },
  { label: '项目生产', value: 'project' },
];

const helpCopy = {
  warehouseLocations: {
    label: '仓位管理',
    description: '按仓库配置仓位控制方式、库存记录粒度和仓位必选规则。',
  },
  pickingPolicy: {
    label: '领料策略',
    description: '领料可用数量受仓库、物料、批号和库存归属共同约束。',
  },
};

const stockLocationCapabilities: MesStockLocationSelectCapabilities = {
  canAccessLocations: true,
  requestCacheScope: 'catalog-demo-user-tenant',
  requestPrecheck: async ({ action, warehouseId }) => ({
    action,
    warehouseId,
    locationControlMode: 'flexible',
    locationRequired: action === 'outbound',
    warnings: [],
    blockers: [],
  }),
  requestDistribution: async () => ({
    locations: [
      {
        locationId: 'loc-a01',
        locationCode: 'A-01',
        locationName: 'A区一层',
        locationPath: '原材料仓/A区/A-01',
        availableQty: 32,
      },
    ],
  }),
  requestLocationList: async () => ({
    list: [
      {
        id: 'loc-a01',
        name: 'A区一层',
        pathName: '原材料仓/A区/A-01',
        allowStock: true,
        isActive: true,
      },
    ],
  }),
  requestLocationTree: async () => [
    {
      id: 'loc-a01',
      name: 'A区一层',
      pathName: '原材料仓/A区/A-01',
      allowStock: true,
      isActive: true,
      children: [],
    },
  ],
  filterDisplayBlockers: (blockers) =>
    blockers.filter((item) => !item.includes('必须选择仓位')),
  renderConfigEntryFieldLabel: ({ children, show, onOpen }) => (
    <span>
      {children}
      {show ? (
        <Button type="link" size="small" onClick={onOpen}>
          仓位配置
        </Button>
      ) : null}
    </span>
  ),
};

const stockPreviewCapabilities: StockBalancePreviewCapabilities = {
  canRead: true,
  requestContextKey: 'catalog-demo-user-tenant',
  loadPreview: async () => ({
    bookQty: 42,
    reservedQty: 4,
    frozenQty: 2,
    availableQty: 36,
    batchAvailableQty: 18,
    shortageQty: 0,
    sufficient: true,
    batchShortageQty: 0,
    batchSufficient: true,
    warnings: [],
    blockers: [],
  }),
  formatQuantity: (value) => value.toLocaleString('zh-CN'),
  formatError: (error) =>
    error instanceof Error ? error.message : undefined,
  copy: {
    loading: '正在读取当前库存…',
    errorFallback: '库存余额读取失败',
    currentStock: '当前库存',
    bookQty: '账面',
    availableQty: '可用',
    reservedQty: '占用',
    frozenQty: '冻结',
    batchAvailableQty: '批号可用量',
    adjustedQty: '调整后',
    shortageQty: '库存缺口',
    batchShortageQty: '批号库存缺口',
    outboundShortage: '当前库存不足，可先保存草稿；确认出库前必须补足库存或调整本次数量。',
  },
};

export function StockOperationsFieldsDemo() {
  const [inlineLocation, setInlineLocation] = useState<{
    locationId?: string;
    storageLocation?: string;
  }>({});
  const [manufactureMode, setManufactureMode] = useState('make_to_order');
  const locationCapabilities = useMemo(
    () => stockLocationCapabilities,
    [],
  );

  return (
    <SectionCard title="MES 库存与订单业务字段">
      <Typography.Paragraph type="secondary">
        字段、策略提示和库存摘要由 MES UI 套件提供；查询、权限、选项、格式化和业务文案通过宿主能力注入。
      </Typography.Paragraph>
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <ProForm
          layout="vertical"
          submitter={false}
          initialValues={{ warehouseId: 'warehouse-raw', materialId: 'material-al' }}
        >
          <StockBusinessDateField />
          <StockLocationDependencyField
            capabilities={locationCapabilities}
            warehouseFieldName="warehouseId"
            materialFieldName="materialId"
            name="locationId"
            label="入库仓位"
            action="inbound"
          />
        </ProForm>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Typography.Text strong>行内仓位选择与库存预览</Typography.Text>
          <StockLocationInlineSelector
            capabilities={locationCapabilities}
            action="outbound"
            warehouseId="warehouse-raw"
            materialId="material-al"
            label="出库仓位"
            value={inlineLocation.locationId}
            storageLocation={inlineLocation.storageLocation}
            onChange={(patch) =>
              setInlineLocation((current) => ({ ...current, ...patch }))
            }
          />
          <StockBalancePreview
            warehouseId="warehouse-raw"
            materialId="material-al"
            batchNo="LOT-2026-001"
            requiredQty={12}
            capabilities={stockPreviewCapabilities}
          />
        </Space>
        <ProForm
          layout="vertical"
          submitter={false}
          initialValues={{ fulfillmentScenario: 'normal_sale', settlementMode: 'charged' }}
        >
          <SaleOrderFulfillmentScenarioField
            options={fulfillmentOptions}
            initialValue="normal_sale"
            onScenarioChange={(value, form) => {
              if (value !== 'customer_sample') {
                form.setFieldValue('settlementMode', 'charged');
              }
            }}
          />
          <SaleOrderSettlementModeField
            initialValue="charged"
            resolveFieldState={(scenario) => ({
              options:
                scenario === 'customer_sample'
                  ? settlementOptions
                  : settlementOptions.filter((item) => item.value === 'charged'),
              disabled: scenario !== 'customer_sample',
            })}
          />
          <SaleOrderFreeSampleSettlementNotice
            shouldShow={(scenario, settlement) =>
              scenario === 'customer_sample' && settlement === 'free'
            }
          />
        </ProForm>
        <Space wrap align="center">
          <ManufactureModeSelect
            aria-label="生产模式"
            value={manufactureMode}
            options={manufactureOptions}
            normalizeValue={(value) =>
              manufactureOptions.some((item) => item.value === value)
                ? String(value)
                : 'standard'
            }
            onChange={setManufactureMode}
            style={{ width: 160 }}
          />
          <ManufactureModeTag
            value={manufactureMode}
            normalizeValue={(value) =>
              manufactureOptions.some((item) => item.value === value)
                ? String(value)
                : 'standard'
            }
            labelForValue={(value) =>
              manufactureOptions.find((item) => item.value === value)?.label ?? value
            }
            colorForValue={(value) =>
              ({ standard: 'blue', make_to_order: 'cyan', engineer_to_order: 'orange', project: 'purple' })[
                value
              ] ?? 'default'
            }
          />
        </Space>
        <OperationConfigHelpProvider copyById={helpCopy}>
          <Space wrap align="center">
            <ConfigLabel id="warehouseLocations" />
            <ConfigHelpIcon id="pickingPolicy" />
            <ConfigOptionText id="pickingPolicy" />
          </Space>
        </OperationConfigHelpProvider>
        <Alert
          type="info"
          showIcon
          message="库位预检、库存余额与可见权限均由 MES 宿主实现。"
        />
      </Space>
    </SectionCard>
  );
}
