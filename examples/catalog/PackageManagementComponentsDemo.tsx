import { useMemo, useState } from 'react';
import { Button, Space, Typography, message } from 'antd';
import { SectionCard } from '../../src';
import { MesUiProvider } from '../../src/mes/MesUiProvider';
import { PackageSpecManager } from '../../src/mes/components/PackageSpecManager';
import { PackageUnitCreateDrawer } from '../../src/mes/components/PackageUnitCreateDrawer';
import type {
  MaterialPackageSpecRecord,
  PackageAvailableSourceRecord,
  PackageSpecManagerCapabilities,
  PackageUnitCreateCapabilities,
  PackageUnitRecord,
} from '../../src/mes/components/package-management-types';
import type { MesMaterialSelectCapabilities } from '../../src/mes/components/material-select-types';

const initialSpecs: MaterialPackageSpecRecord[] = [
  {
    id: 'spec-carton-01',
    createdAt: '2026-05-12T09:30:00.000Z',
    materialId: 'material-valve',
    material: { id: 'material-valve', code: 'FG-VALVE-001', name: '不锈钢球阀', spec: 'DN25', unit: '件' },
    packageType: 'carton',
    packageName: '标准纸箱',
    capacityQty: 12,
    minQty: 1,
    maxQty: 12,
    isDefault: true,
    isActive: true,
    sortOrder: 10,
    remarks: '标准出货装箱规格',
  },
  {
    id: 'spec-bag-02',
    createdAt: '2026-05-13T11:00:00.000Z',
    materialId: 'material-valve',
    material: { id: 'material-valve', code: 'FG-VALVE-001', name: '不锈钢球阀', spec: 'DN25', unit: '件' },
    packageType: 'bag',
    packageName: '维修备件袋',
    capacityQty: 4,
    minQty: 1,
    maxQty: 4,
    isDefault: false,
    isActive: false,
    sortOrder: 20,
  },
];

const sources: PackageAvailableSourceRecord[] = [
  {
    id: 'source-batch-001',
    sourceMode: 'batch',
    sourceKey: 'batch:batch-001',
    batchTracking: true,
    batchId: 'batch-001',
    batchNo: 'B-2026-0518',
    materialId: 'material-valve',
    materialCode: 'FG-VALVE-001',
    materialName: '不锈钢球阀',
    materialSpec: 'DN25',
    unit: 'piece',
    warehouseId: 'warehouse-fg',
    warehouseName: '成品仓',
    sourceQty: 36,
    packagedQty: 12,
    batchAvailableQty: 24,
    stockAvailableQty: 24,
    availableQty: 24,
    sourceWorkOrderId: 'work-order-001',
    sourceWorkOrderNo: 'MO-20260518001',
    sourceTransactionId: 'transaction-001',
    sourceReferenceNo: 'IN-20260518002',
    packageSpecId: 'spec-carton-01',
    packageType: 'carton',
    capacityQty: 12,
  },
  {
    id: 'source-stock-002',
    sourceMode: 'stock_balance',
    sourceKey: 'stock:warehouse-fg:material-valve',
    batchTracking: false,
    materialId: 'material-valve',
    materialCode: 'FG-VALVE-001',
    materialName: '不锈钢球阀',
    materialSpec: 'DN25',
    unit: 'piece',
    warehouseId: 'warehouse-fg',
    warehouseName: '成品仓',
    packagedQty: 0,
    stockAvailableQty: 8,
    availableQty: 8,
  },
];

const packageTypes = [
  { label: '纸箱', value: 'carton' },
  { label: '袋', value: 'bag' },
  { label: '盘', value: 'tray' },
  { label: '托', value: 'pallet' },
];
const packageTypeLabels = Object.fromEntries(packageTypes.map(({ label, value }) => [value, label]));

export function PackageManagementComponentsDemo() {
  const [specs, setSpecs] = useState(initialSpecs);
  const [unitRecords, setUnitRecords] = useState<PackageUnitRecord[]>([]);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [permissions, setPermissions] = useState(true);

  const materialSelectCapabilities = useMemo<MesMaterialSelectCapabilities>(() => ({
    unitLabelMap: { piece: '件' },
    baseTypeOptions: [
      { label: '半成品', value: 'semi' },
      { label: '成品', value: 'finished' },
    ],
  }), []);

  const packageSpecCapabilities = useMemo<PackageSpecManagerCapabilities>(() => ({
    packageTypeOptions: packageTypes,
    packageTypeLabels,
    canCreate: permissions,
    canUpdate: permissions,
    canDelete: permissions,
    requestMaterialOptions: async ({ keyWords }) => [
      {
        label: 'FG-VALVE-001 - 不锈钢球阀',
        value: 'material-valve',
        code: 'FG-VALVE-001',
        name: '不锈钢球阀',
        spec: 'DN25',
        unit: 'piece',
        baseType: 'finished',
      },
    ].filter((item) => !keyWords || `${item.code} ${item.name}`.toLowerCase().includes(keyWords.toLowerCase())),
    listSpecs: async (params) => {
      const keyword = String(params.keyword ?? '').toLowerCase();
      const list = specs.filter((item) =>
        !keyword || `${item.packageName ?? ''} ${item.material?.name ?? ''} ${item.material?.code ?? ''}`.toLowerCase().includes(keyword),
      );
      return { list, total: list.length };
    },
    getSpec: async (id) => specs.find((item) => item.id === id) ?? specs[0],
    createSpec: async (values) => {
      const material = {
        id: values.materialId,
        code: 'FG-VALVE-001',
        name: '不锈钢球阀',
        spec: 'DN25',
        unit: 'piece',
      };
      const next: MaterialPackageSpecRecord = {
        ...values,
        id: `spec-${Date.now()}`,
        createdAt: new Date().toISOString(),
        material,
        packageType: values.packageType ?? 'carton',
        capacityQty: Number(values.capacityQty),
        isDefault: Boolean(values.isDefault),
        isActive: values.isActive !== false,
        sortOrder: Number(values.sortOrder ?? 0),
      };
      setSpecs((current) => [...current, next]);
    },
    updateSpec: async (values) => {
      setSpecs((current) => current.map((item) => item.id === values.id ? {
        ...item,
        ...values,
        packageType: values.packageType ?? item.packageType,
        capacityQty: Number(values.capacityQty),
        isDefault: Boolean(values.isDefault),
        isActive: values.isActive !== false,
        sortOrder: Number(values.sortOrder ?? 0),
      } : item));
    },
    deleteSpec: async (id) => setSpecs((current) => current.filter((item) => item.id !== id)),
    notify: { success: (text) => message.success(text) },
    getFieldHelpProps: (label) => ({ label }),
    getAutoFieldHelpProps: (label) => ({ label }),
  }), [permissions, specs]);

  const packageUnitCapabilities = useMemo<PackageUnitCreateCapabilities>(() => ({
    packageTypeOptions: packageTypes,
    packageTypeLabels,
    unitLabelMap: { piece: '件' },
    requestPackableMaterialOptions: async (params = {}) => [{
          label: 'FG-VALVE-001 - 不锈钢球阀 / 成品',
          value: 'material-valve',
          code: 'FG-VALVE-001',
          name: '不锈钢球阀',
          baseType: 'finished',
          unit: 'piece',
        }].filter((option) => !params.keyWords || `${option.code} ${option.name}`.toLowerCase().includes(params.keyWords.toLowerCase())),
    requestWarehouseOptions: async () => [{ label: '成品仓', value: 'warehouse-fg' }],
    listAvailableSources: async (params) => {
      const list = sources.filter((source) =>
        (!params.warehouseId || source.warehouseId === params.warehouseId)
        && (!params.materialId || source.materialId === params.materialId)
        && (!params.batchNo || source.batchNo?.includes(String(params.batchNo)))
        && (!params.sourceWorkOrderId || source.sourceWorkOrderId === params.sourceWorkOrderId)
        && (!params.sourceReferenceNo || source.sourceReferenceNo?.includes(String(params.sourceReferenceNo))),
      );
      return { list, total: list.length };
    },
    listSpecs: async ({ materialId, isActive }) => ({
      list: specs.filter((item) => item.materialId === materialId && (!isActive || item.isActive)),
    }),
    previewSplit: async ({ totalQty, packageSpecId, capacityQty }) => {
      const capacity = Number(specs.find((item) => item.id === packageSpecId)?.capacityQty ?? capacityQty ?? totalQty);
      let remaining = totalQty;
      const items: Array<{ index: number; qty: number; isTail: boolean }> = [];
      while (remaining > 0) {
        const qty = Math.min(capacity, remaining);
        items.push({ index: items.length + 1, qty, isTail: qty < capacity });
        remaining = Number((remaining - qty).toFixed(4));
      }
      return { packageType: 'carton', capacityQty: capacity, totalQty, items };
    },
    createUnits: async (payload) => {
      const units = payload.packages.map((item, index): PackageUnitRecord => ({
        id: `unit-${Date.now()}-${index}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        companyId: 'demo-company',
        packageNo: `PKG-2026-${String(unitRecords.length + index + 1).padStart(4, '0')}`,
        warehouseId: payload.warehouseId ?? 'warehouse-fg',
        materialId: payload.materialId ?? 'material-valve',
        material: { id: 'material-valve', code: 'FG-VALVE-001', name: '不锈钢球阀', unit: 'piece' },
        batchId: payload.batchId,
        packageType: payload.packageType ?? 'carton',
        status: 'sealed',
        totalQty: item.qty,
        lineCount: 1,
        sourceType: 'production',
        reprintCount: 0,
        sourceWorkOrderId: payload.sourceWorkOrderId,
        sourceTransactionId: payload.sourceTransactionId,
        remarks: item.remarks ?? payload.remarks,
      }));
      setUnitRecords((current) => [...current, ...units]);
      return units;
    },
    notify: {
      success: (text) => message.success(text),
      warning: (text) => message.warning(text),
      info: (text) => message.info(text),
    },
    getFieldHelpProps: (label) => ({ label }),
    getAutoFieldHelpProps: (label) => ({ label }),
    renderConfigEntryLabel: ({ children }) => children,
    renderConfigEntryLink: ({ label, actionText, onOpen }) => (
      <Button type="link" size="small" onClick={onOpen}>{`${actionText}：${label}`}</Button>
    ),
  }), [specs, unitRecords.length]);

  return (
    <MesUiProvider
      hasPermission={() => permissions}
      materialSelectCapabilities={materialSelectCapabilities}
    >
      <SectionCard title="仓库包装组件">
        <Typography.Paragraph type="secondary">
          使用本地模拟的包装规格和可包装来源服务，覆盖权限开关、来源筛选、箱规拆分与创建回调。
        </Typography.Paragraph>
        <Space wrap>
          <Button onClick={() => setSpecsOpen(true)}>包装规格管理</Button>
          <Button type="primary" onClick={() => setCreateOpen(true)}>新增包装</Button>
          <Button onClick={() => setPermissions((current) => !current)}>
            {permissions ? '切换到只读权限' : '恢复维护权限'}
          </Button>
        </Space>
        {unitRecords.length ? (
          <Typography.Paragraph style={{ marginTop: 12 }}>
            本地已生成 {unitRecords.length} 个包装单元：{unitRecords.map((item) => item.packageNo).join('、')}
          </Typography.Paragraph>
        ) : null}
      </SectionCard>
      <PackageSpecManager open={specsOpen} onOpenChange={setSpecsOpen} capabilities={packageSpecCapabilities} />
      <PackageUnitCreateDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(units) => {
          setCreateOpen(false);
          message.success(`目录回调收到 ${units.length} 个单元`);
        }}
        capabilities={packageUnitCapabilities}
      />
    </MesUiProvider>
  );
}
