import type { ReactNode } from 'react';

export type MasterDataQuickCreateEntity = 'customer' | 'supplier';

export interface MasterDataQuickCreateOption {
  value: string;
  label: string;
  /** Customer defaults consumed by the host's existing onChange logic. */
  salesRepId?: string | null;
  paymentTerms?: string | null;
}

export interface MasterDataQuickCreateDrawerProps {
  entity: MasterDataQuickCreateEntity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (
    option: MasterDataQuickCreateOption,
  ) => void | Promise<void>;
}

export interface MasterDataQuickCreateLabelProps {
  entity: MasterDataQuickCreateEntity;
  children: ReactNode;
  /** Retained source signal; the legacy label helper does not enforce it. */
  show: boolean;
  onOpen: () => void;
}

/** MES-owned permissions, routes and create forms used by the shared selector. */
export interface MesMasterDataQuickCreateCapabilities {
  canCreate: (entity: MasterDataQuickCreateEntity) => boolean;
  renderDrawer: (props: MasterDataQuickCreateDrawerProps) => ReactNode;
  /** The host supplies its permission-aware configuration link and router policy. */
  renderConfigEntryLabel?: (
    props: MasterDataQuickCreateLabelProps,
  ) => ReactNode;
}
