import { useState } from 'react';
import { Button, Space, message } from 'antd';
import { SectionCard, Typography } from '../../src';
import { BomEffectiveBomSelector } from '../../src/mes/components/BomEffectiveBomSelector';
import type { BomEffectiveBomSelectorCapabilities } from '../../src/mes/components/bom-effective-bom-selector-types';
import { BomExplosionTree } from '../../src/mes/components/BomExplosionTree';
import type {
  BomExplosionChartRendererProps,
  BomExplosionData,
} from '../../src/mes/components/bom-explosion-tree-types';
import { BomItemSourcingModal } from '../../src/mes/components/BomItemSourcingModal';
import type { BomItemSourcingModalCapabilities } from '../../src/mes/components/bom-item-sourcing-modal-types';

type DemoTreeNode = {
  name: string;
  children?: DemoTreeNode[];
};

function readDemoTreeNode(value: unknown): DemoTreeNode | null {
  if (!isRecord(value) || typeof value.name !== 'string') return null;
  if (value.children === undefined) return { name: value.name };
  if (!Array.isArray(value.children)) return null;
  const children = value.children.map(readDemoTreeNode);
  if (children.some((child) => child === null)) return null;
  return {
    name: value.name,
    children: children.filter((child): child is DemoTreeNode => child !== null),
  };
}

const explosionData: BomExplosionData = {
  root: {
    nodeType: 'root',
    level: 0,
    materialCode: 'FG-100',
    materialName: '电机组件 A',
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
        materialCode: 'RM-BRG-01',
        materialName: '深沟球轴承',
        quantity: 2,
        effectiveQty: 2.1,
        cumulativeQty: 2.1,
        quantityCaliber: 'cumulative',
        unit: '个',
        procurementType: '采购',
        hasChildBom: false,
        missingChildBom: false,
        cycle: false,
        truncated: false,
        children: [],
      },
      {
        nodeType: 'item',
        level: 1,
        materialCode: 'RM-CASE-02',
        materialName: '电机外壳',
        quantity: 1,
        effectiveQty: 1,
        cumulativeQty: 1,
        quantityCaliber: 'cumulative',
        unit: '件',
        hasChildBom: true,
        missingChildBom: false,
        cycle: false,
        truncated: false,
        children: [
          {
            nodeType: 'item',
            level: 2,
            materialCode: 'RM-SCREW-08',
            materialName: '内六角螺钉',
            quantity: 4,
            effectiveQty: 4,
            cumulativeQty: 4,
            quantityCaliber: 'direct',
            unit: '个',
            hasChildBom: false,
            missingChildBom: false,
            cycle: false,
            truncated: false,
            children: [],
          },
        ],
      },
    ],
  },
  summary: {
    totalNodes: 4,
    maxLevel: 2,
    leafNodes: 2,
    missingChildBomCount: 0,
    cycleCount: 0,
  },
  warnings: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readDemoChartRoot(option: unknown): DemoTreeNode | null {
  if (!isRecord(option) || !Array.isArray(option.series)) return null;
  const firstSeries = option.series[0];
  if (!isRecord(firstSeries) || !Array.isArray(firstSeries.data)) return null;
  const root = firstSeries.data[0];
  return readDemoTreeNode(root);
}

function renderDemoTree(node: DemoTreeNode, key: string) {
  const children = node.children ?? [];
  return (
    <li key={key}>
      {children.length ? (
        <details open>
          <summary style={{ whiteSpace: 'pre-line' }}>{node.name}</summary>
          <ul>{children.map((child, index) => renderDemoTree(child, `${key}-${index}`))}</ul>
        </details>
      ) : (
        <span style={{ whiteSpace: 'pre-line' }}>{node.name}</span>
      )}
    </li>
  );
}

function renderDemoChart({
  option,
  style,
  ariaLabel,
}: BomExplosionChartRendererProps) {
  const root = readDemoChartRoot(option);
  if (!root) return <div role="img" aria-label={ariaLabel} style={style} />;
  return (
    <div
      role="tree"
      aria-label={ariaLabel}
      style={{
        ...style,
        overflow: 'auto',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 16,
      }}
    >
      <ul>{renderDemoTree(root, 'root')}</ul>
    </div>
  );
}

const materials = [
  {
    label: 'FG-100 · 电机组件 A',
    value: 'material-motor-a',
    code: 'FG-100',
    name: '电机组件 A',
    familyId: 'family-motor',
  },
  {
    label: 'FG-101 · 电机组件 B',
    value: 'material-motor-b',
    code: 'FG-101',
    name: '电机组件 B',
    familyId: 'family-motor',
  },
];

const effectiveBomCapabilities: BomEffectiveBomSelectorCapabilities = {
  requestMaterialOptions: async ({ keyWords }) =>
    materials.filter((material) =>
      keyWords
        ? `${material.code} ${material.name}`.toLowerCase().includes(keyWords.toLowerCase())
        : true,
    ),
  resolveBom: async ({ bomHeaderId }) => {
    if (!bomHeaderId) {
      return {
        status: 'conflict',
        candidates: [
          {
            bomMasterCode: 'BOM-MOTOR-STD',
            bomMasterName: '电机标准方案',
            bomHeaderId: 'bom-motor-v3',
            version: 'V3',
            isDefault: true,
          },
          {
            bomMasterCode: 'BOM-MOTOR-ECO',
            bomMasterName: '电机经济方案',
            bomHeaderId: 'bom-motor-v2',
            version: 'V2',
            isDefault: false,
          },
        ],
        messages: [],
      };
    }
    return {
      status: 'matched',
      bomHeaderId,
      candidates: [],
      messages: [],
    };
  },
};

const sourcingCapabilities: BomItemSourcingModalCapabilities = {
  loadOptions: async () => ({ options: [] }),
  loadPriceTiers: async () => ({
    list: [
      {
        id: 'tier-supplier-a',
        supplierId: 'supplier-a',
        supplier: { name: '精工供应商' },
        grade: 'A',
        unitPrice: 12.5,
        currency: 'CNY',
        status: 'active',
      },
      {
        id: 'tier-supplier-b',
        supplierId: 'supplier-b',
        supplier: { name: '宏达五金' },
        grade: 'B',
        unitPrice: 11.8,
        currency: 'CNY',
        status: 'active',
      },
    ],
  }),
  saveOptions: async () => undefined,
  notifyWarning: (copy) => message.warning(copy),
  notifySuccess: (copy) => message.success(copy),
};

export function BomComponentsDemo() {
  const [resolvedBomId, setResolvedBomId] = useState<string>();
  const [sourcingOpen, setSourcingOpen] = useState(false);

  return (
    <SectionCard title="MES BOM 领域组件">
      <Typography.Paragraph type="secondary">
        BOM 解析和采购价目查询由宿主注入；组件保留型号有效 BOM 选择、冲突候选处理与单个 BOM 行的供应来源配置。
      </Typography.Paragraph>
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <BomExplosionTree
          data={explosionData}
          unitLabelMap={{ piece: '个' }}
          renderChart={renderDemoChart}
        />
        <BomEffectiveBomSelector
          bom={{
            id: 'bom-product-base',
            bomScope: 'product_base',
            familyId: 'family-motor',
          }}
          resolvedBom={
            resolvedBomId
              ? {
                  id: resolvedBomId,
                  bomScope: 'model_effective',
                  materialId: 'material-motor-a',
                  material: { code: 'FG-100', name: '电机组件 A' },
                  version: 'V3',
                }
              : undefined
          }
          resolutionKey={1}
          capabilities={effectiveBomCapabilities}
          onResolved={(resolution) => {
            if (resolution.bomHeaderId) {
              setResolvedBomId(resolution.bomHeaderId);
            }
          }}
        />
        <Space orientation="vertical" size={4}>
          <Typography.Text strong>BOM 位供应来源</Typography.Text>
          <Typography.Text type="secondary">
            选择允许该 BOM 位使用的供应商价目、主选和优先级。
          </Typography.Text>
          <Button onClick={() => setSourcingOpen(true)}>配置供应来源</Button>
        </Space>
        <BomItemSourcingModal
          open={sourcingOpen}
          bomItemId="bom-item-motor-bearing"
          materialId="material-bearing-01"
          materialName="深沟球轴承"
          capabilities={sourcingCapabilities}
          onClose={() => setSourcingOpen(false)}
        />
      </Space>
    </SectionCard>
  );
}
