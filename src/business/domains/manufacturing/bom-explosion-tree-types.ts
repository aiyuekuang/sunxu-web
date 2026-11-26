import type { CSSProperties, ReactNode } from 'react';
import type { UnitLabelMap } from '../../utils/qty-unit';

export interface BomExplosionNode {
  nodeType: 'root' | 'item';
  level: number;
  materialCode: string;
  materialName: string;
  procurementType?: string | null;
  quantity: number;
  effectiveQty: number;
  cumulativeQty: number;
  quantityCaliber: 'cumulative' | 'direct';
  unit?: string | null;
  bomVersion?: string | null;
  hasChildBom: boolean;
  missingChildBom: boolean;
  cycle: boolean;
  truncated: boolean;
  children: BomExplosionNode[];
}

export interface BomExplosionWarning {
  code: 'missing_child_bom' | 'cycle_detected' | 'max_depth_reached';
  message: string;
  level: number;
  path: string;
}

export interface BomExplosionData {
  root: BomExplosionNode;
  summary: {
    totalNodes: number;
    maxLevel: number;
    leafNodes: number;
    missingChildBomCount: number;
    cycleCount: number;
  };
  warnings: BomExplosionWarning[];
}

export interface BomExplosionChartRendererProps {
  option: unknown;
  style: CSSProperties;
  notMerge: true;
  lazyUpdate: true;
  showLoading: boolean;
  ariaLabel: string;
}

export interface BomExplosionTreeProps {
  data?: BomExplosionData | null;
  loading?: boolean;
  unitLabelMap?: UnitLabelMap;
  /** Host renderer adapter keeps ECharts optional while preserving the source chart option and controls. */
  renderChart: (props: BomExplosionChartRendererProps) => ReactNode;
}
