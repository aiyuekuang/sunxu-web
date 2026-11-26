import { useMemo, useState } from 'react';
import { Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  MesUiProvider,
  WarehouseRemoteSelect,
  type MesWarehouseRemoteSelectCapabilities,
  type WarehouseSelectOption,
} from '../../src/business';

const demoWarehouses: WarehouseSelectOption[] = [
  {
    label: '原材料仓',
    value: 'warehouse-raw',
    warehouseType: 'raw_material',
    sortOrder: 10,
    code: 'WH-RAW',
    name: '原材料仓',
  },
  {
    label: '线边仓',
    value: 'warehouse-line',
    warehouseType: 'line_side',
    sortOrder: 20,
    code: 'WH-LINE',
    name: '线边仓',
  },
  {
    label: '通用仓',
    value: 'warehouse-general',
    warehouseType: 'general',
    sortOrder: 30,
    code: 'WH-GEN',
    name: '通用仓',
  },
];

export function WarehouseRemoteSelectDemo() {
  const [warehouseId, setWarehouseId] = useState('warehouse-legacy');
  const [warehouseName, setWarehouseName] = useState('历史仓库名称');
  const capabilities = useMemo<MesWarehouseRemoteSelectCapabilities>(
    () => ({
      async requestOptions({ keyWords, scope, typeFamilies }) {
        await new Promise((resolve) => window.setTimeout(resolve, 120));
        const query = keyWords?.trim().toLocaleLowerCase();
        return demoWarehouses
          .filter(
            (option) =>
              scope !== 'nonLineSide' || option.warehouseType !== 'line_side',
          )
          .filter(
            (option) =>
              !typeFamilies?.length ||
              typeFamilies.includes(option.warehouseType),
          )
          .filter(
            (option) =>
              !query ||
              option.label.toLocaleLowerCase().includes(query) ||
              option.code?.toLocaleLowerCase().includes(query),
          )
          .sort((left, right) => left.sortOrder - right.sortOrder);
      },
    }),
    [],
  );

  return (
    <SectionCard title="仓库远程选择器">
      <Typography.Paragraph type="secondary">
        宿主提供仓库候选请求和类型族筛选；组件保留历史仓库名称回显，并在选择或清空时同时回传仓库 ID 与名称。
      </Typography.Paragraph>
      <MesUiProvider
        hasPermission={() => true}
        warehouseRemoteSelectCapabilities={capabilities}
      >
        <Space orientation="vertical" size={8} style={{ width: '100%' }}>
          <WarehouseRemoteSelect
            value={warehouseId}
            currentOption={{ value: warehouseId, label: warehouseName }}
            onChange={(id, name) => {
              setWarehouseId(id ?? '');
              setWarehouseName(name ?? '');
            }}
          />
          <Typography.Text type="secondary" aria-live="polite">
            当前值：{warehouseId || '空'} / {warehouseName || '无名称'}
          </Typography.Text>
          <WarehouseRemoteSelect
            value=""
            scope="all"
            typeFamilies={['raw_material', 'general']}
            placeholder="只搜索原材料仓或通用仓"
            onChange={() => undefined}
          />
        </Space>
      </MesUiProvider>
    </SectionCard>
  );
}
