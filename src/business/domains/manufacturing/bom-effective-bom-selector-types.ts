import type { MaterialFilteredSelectOption } from '../inventory/material-select-types';

export interface BomEffectiveMaterialRef {
  code?: string | null;
  name?: string | null;
}

export interface BomEffectiveHeader {
  id?: string | null;
  bomScope?: string | null;
  materialId?: string | null;
  familyId?: string | null;
  material?: BomEffectiveMaterialRef | null;
  version?: string | null;
}

export interface BomResolutionCandidate {
  bomMasterCode?: string | null;
  bomMasterName?: string | null;
  bomHeaderId: string;
  version: string;
  isDefault: boolean;
}

export interface BomResolutionResponse {
  status: 'matched' | 'manual' | 'missing' | 'conflict';
  bomHeaderId?: string | null;
  bom?: BomEffectiveHeader | null;
  candidates: BomResolutionCandidate[];
  messages: string[];
}

export interface BomEffectiveBomSelectorCapabilities {
  requestMaterialOptions: (params: {
    keyWords?: string;
    familyId?: string;
  } & Record<string, unknown>) => Promise<MaterialFilteredSelectOption[]>;
  resolveBom: (params: {
    materialId: string;
    bomHeaderId?: string;
    purpose: 'new_selection';
  }) => Promise<BomResolutionResponse>;
}

export interface BomEffectiveBomSelectorProps {
  bom?: BomEffectiveHeader | null;
  resolvedBom?: BomEffectiveHeader & { version: string };
  resolutionKey: number;
  capabilities: BomEffectiveBomSelectorCapabilities;
  onResolved: (
    resolution: BomResolutionResponse,
    context: { bomId: string; resolutionKey: number },
  ) => Promise<void> | void;
}
