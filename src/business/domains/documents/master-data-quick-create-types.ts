import type { ReactNode } from 'react';
import type { ProFormSelectProps } from '@ant-design/pro-components';

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

/** host-owned permissions, routes and create forms used by the shared selector. */
export interface MasterDataQuickCreateCapabilities {
  canCreate: (entity: MasterDataQuickCreateEntity) => boolean;
  renderDrawer: (props: MasterDataQuickCreateDrawerProps) => ReactNode;
  /** The host supplies its permission-aware configuration link and router policy. */
  renderConfigEntryLabel?: (
    props: MasterDataQuickCreateLabelProps,
  ) => ReactNode;
  /** Optional Sunxu host form services used by the migrated customer/supplier drawers. */
  forms?: MasterDataQuickCreateFormCapabilities;
}

export interface QuickCreateOption {
  label: string;
  value: string;
}

export interface QuickCreateCustomer {
  id: string;
  name: string;
  salesRepId?: string | null;
  paymentTerms?: string | null;
}

export interface QuickCreateSupplier {
  id: string;
  name: string;
}

export interface MasterDataQuickCreateFormCapabilities {
  createCustomer?: (values: Record<string, unknown>) => Promise<QuickCreateCustomer>;
  createSupplier?: (values: Record<string, unknown>) => Promise<QuickCreateSupplier>;
  requestDictionaryOptions?: (
    typeCode: string,
    params?: { keyWords?: string },
  ) => Promise<QuickCreateOption[]>;
  requestUserOptions?: (
    params?: { keyWords?: string },
  ) => Promise<QuickCreateOption[]>;
  /** Preserve host field-help catalog labels/tooltips while the field layout lives in Sunxu. */
  getFieldHelpProps?: (
    label: string,
    group?: 'common' | 'sales' | 'purchase',
    helpKey?: string,
  ) => Record<string, unknown>;
  /** Preserve the host dictionary configuration entry/link and its return refresh behavior. */
  renderDictionarySelect?: (
    props: Omit<ProFormSelectProps, 'label' | 'options' | 'request'> & {
      label: ReactNode;
      typeCode: string;
      dictEnabled?: boolean;
      showConfigEntry?: boolean;
      fieldHelpProps?: Record<string, unknown>;
    },
  ) => ReactNode;
}
