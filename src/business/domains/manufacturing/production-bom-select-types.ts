import type { CSSProperties, ReactNode } from 'react';

export interface ProductionBomOption {
  label: string;
  value: string;
  sourceType?: string;
  raw?: unknown;
  [field: string]: unknown;
}

export interface ProductionBomOptionRequestParams {
  keyWords?: string;
  materialId?: string;
  saleOrderId?: string;
  saleOrderItemId?: string;
}

export interface ProductionBomFieldHelpProps {
  label: string;
  tooltip?: { title: ReactNode; styles?: { root?: CSSProperties } };
}

export interface ProductionBomConfigEntryLabelProps {
  children: ReactNode;
  target: 'bom';
  /** Compatibility signal from host; the current host label component ignores it. */
  show: boolean;
  onOpen: () => void;
}

/** BOM data, host field help and authorized configuration navigation stay in the host. */
export interface ProductionBomSelectCapabilities {
  requestOptions: (
    params: ProductionBomOptionRequestParams,
  ) => Promise<ProductionBomOption[]>;
  getFieldHelpProps: () => ProductionBomFieldHelpProps;
  renderConfigEntryFieldLabel: (
    props: ProductionBomConfigEntryLabelProps,
  ) => ReactNode;
}
