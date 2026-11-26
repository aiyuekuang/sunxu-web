import type { ReactNode } from 'react';
import type {
  BomExplosionChartRendererProps,
  BomExplosionNode,
  BomExplosionWarning,
} from './bom-explosion-tree-types';
import type {
  BomEffectiveHeader,
  BomEffectiveBomSelectorCapabilities,
} from './bom-effective-bom-selector-types';
import type { UnitLabelMap } from '../../utils/qty-unit';

export interface BomWorkspaceBomDetail extends BomEffectiveHeader {
  id: string;
  bomMasterId?: string | null;
  bomMaster?: { name?: string | null } | null;
  version?: string | null;
  status?: string | null;
  changeRemark?: string | null;
  material?: {
    code?: string | null;
    name?: string | null;
    spec?: string | null;
  } | null;
}

export interface BomWorkspaceExplosionNode extends BomExplosionNode {
  key: string;
  materialSpec?: string | null;
  children: BomWorkspaceExplosionNode[];
}

export interface BomWorkspaceExplosion {
  root: BomWorkspaceExplosionNode;
  summary: {
    totalNodes: number;
    maxLevel: number;
    leafNodes: number;
    missingChildBomCount: number;
    cycleCount: number;
  };
  warnings: BomExplosionWarning[];
}

export interface BomWorkspaceDetailCapabilities {
  requestDetail: (id: string) => Promise<BomWorkspaceBomDetail>;
  requestExplosion: (params: {
    id: string;
    maxDepth: 20;
  }) => Promise<BomWorkspaceExplosion>;
  exportExplosion: (params: {
    id: string;
    maxDepth: 20;
  }) => Promise<unknown>;
  canExpandBomDirectly: (detail: BomWorkspaceBomDetail) => boolean;
  bomResolutionCapabilities: BomEffectiveBomSelectorCapabilities;
  canExport: boolean;
  navigateToBom: (id: string) => void;
  renderChart: (props: BomExplosionChartRendererProps) => ReactNode;
  onExportError?: (error: unknown) => void;
  statusEnum?: Readonly<Record<string, { text: string; status?: string; color?: string }>>;
}

export interface BomWorkspaceDetailProps {
  bomId?: string;
  refreshKey: number;
  capabilities: BomWorkspaceDetailCapabilities;
  unitLabelMap?: UnitLabelMap;
}
