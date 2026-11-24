import { useState } from 'react';
import { Button, message } from 'antd';
import { SectionCard, Space, Typography } from '../../src';
import { BomWorkspaceDetail } from '../../src/mes/components/BomWorkspaceDetail';
import type { BomWorkspaceDetailCapabilities } from '../../src/mes/components/bom-workspace-detail-types';

const workspaceCapabilities: BomWorkspaceDetailCapabilities = {
  requestDetail: async (id) => ({
    id,
    bomMasterId: 'bom-master-motor',
    bomMaster: { name: '电机标准方案' },
    bomScope: 'product_base',
    familyId: 'family-motor',
    version: 'V3',
    status: 'active',
    changeRemark: '演示基础 BOM 解析和多级展开',
    material: { code: 'SERIES-MOTOR', name: '电机系列' },
  }),
  requestExplosion: async ({ id }) => ({
    root: {
      nodeType: 'root',
      level: 0,
      key: id,
      materialCode: 'FG-100',
      materialName: '电机组件 A',
      materialSpec: '220V',
      quantity: 1,
      effectiveQty: 1,
      cumulativeQty: 1,
      quantityCaliber: 'cumulative',
      bomVersion: 'V3',
      hasChildBom: true,
      missingChildBom: false,
      cycle: false,
      truncated: false,
      children: [
        {
          nodeType: 'item',
          level: 1,
          key: `${id}-bearing`,
          materialCode: 'RM-BRG-01',
          materialName: '深沟球轴承',
          materialSpec: '6202',
          quantity: 2,
          effectiveQty: 2,
          cumulativeQty: 2,
          quantityCaliber: 'cumulative',
          unit: 'piece',
          hasChildBom: false,
          missingChildBom: false,
          cycle: false,
          truncated: false,
          children: [],
        },
      ],
    },
    summary: {
      totalNodes: 2,
      maxLevel: 1,
      leafNodes: 1,
      missingChildBomCount: 0,
      cycleCount: 0,
    },
    warnings: [],
  }),
  exportExplosion: async () =>
    new Blob(['BOM explosion demo'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  canExpandBomDirectly: (detail) =>
    Boolean(
      detail.bomScope
        ? ['model_standard', 'model_effective'].includes(detail.bomScope)
        : detail.materialId,
    ),
  bomResolutionCapabilities: {
    requestMaterialOptions: async () => [
      {
        label: 'FG-100 · 电机组件 A',
        value: 'material-motor-a',
        code: 'FG-100',
        name: '电机组件 A',
        familyId: 'family-motor',
      },
    ],
    resolveBom: async ({ bomHeaderId }) => ({
      status: 'matched',
      bomHeaderId: bomHeaderId ?? 'bom-motor-v3',
      bom: {
        id: bomHeaderId ?? 'bom-motor-v3',
        bomScope: 'model_effective',
        materialId: 'material-motor-a',
        material: { code: 'FG-100', name: '电机组件 A' },
        version: 'V3',
      },
      candidates: [],
      messages: [],
    }),
  },
  canExport: true,
  navigateToBom: (id) => message.info(`宿主打开 BOM 详情：${id}`),
  renderChart: ({ ariaLabel, style }) => (
    <div
      role="img"
      aria-label={ariaLabel}
      style={{
        ...style,
        display: 'grid',
        placeItems: 'center',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        color: '#64748b',
      }}
    >
      宿主图表渲染器示例
    </div>
  ),
  onExportError: (error) =>
    message.error(error instanceof Error ? error.message : '导出失败'),
};

export function BomWorkspaceDetailDemo() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <SectionCard title="BOM 工作区详情">
      <Space orientation="vertical" size={10} style={{ width: '100%' }}>
        <Typography.Text type="secondary">
          BOM 明细、有效版本解析、多级展开、导出和导航分别由宿主能力提供。
        </Typography.Text>
        <Button onClick={() => setRefreshKey((value) => value + 1)}>
          刷新工作区
        </Button>
        <BomWorkspaceDetail
          bomId="bom-series-motor"
          refreshKey={refreshKey}
          capabilities={workspaceCapabilities}
          unitLabelMap={{ piece: '个' }}
        />
      </Space>
    </SectionCard>
  );
}
