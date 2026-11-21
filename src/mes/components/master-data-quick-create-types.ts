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

/** MES-owned permissions, routes and create forms used by the shared selector. */
export interface MesMasterDataQuickCreateCapabilities {
  canCreate: (entity: MasterDataQuickCreateEntity) => boolean;
  renderDrawer: (props: MasterDataQuickCreateDrawerProps) => ReactNode;
  /** The host supplies its permission-aware configuration link and router policy. */
  renderConfigEntryLabel?: (
    props: MasterDataQuickCreateLabelProps,
  ) => ReactNode;
  /** Optional Sunxu MES form services used by the migrated customer/supplier drawers. */
  forms?: MesMasterDataQuickCreateFormCapabilities;
}

export interface MesQuickCreateOption {
  label: string;
  value: string;
}

export interface MesQuickCreateCustomer {
  id: string;
  name: string;
  salesRepId?: string | null;
  paymentTerms?: string | null;
}

export interface MesQuickCreateSupplier {
  id: string;
  name: string;
}

export interface MesMasterDataQuickCreateFormCapabilities {
  createCustomer?: (values: Record<string, unknown>) => Promise<MesQuickCreateCustomer>;
  createSupplier?: (values: Record<string, unknown>) => Promise<MesQuickCreateSupplier>;
  requestDictionaryOptions?: (
    typeCode: string,
    params?: { keyWords?: string },
  ) => Promise<MesQuickCreateOption[]>;
  requestUserOptions?: (
    params?: { keyWords?: string },
  ) => Promise<MesQuickCreateOption[]>;
  /** Preserve MES field-help catalog labels/tooltips while the field layout lives in Sunxu. */
  getFieldHelpProps?: (
    label: string,
    group?: 'common' | 'sales' | 'purchase',
    helpKey?: string,
  ) => Record<string, unknown>;
  /** Preserve the MES dictionary configuration entry/link and its return refresh behavior. */
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
