import type { ReactNode } from 'react';
import type { ProFormSelectProps } from '@ant-design/pro-components';

export type AccountingBookType = 'primary' | 'simulation' | 'comparison';
export type AccountingBookStatus = 'draft' | 'active' | 'inactive' | 'archived';

export interface AccountingBookRecord {
  id: string;
  code: string;
  name: string;
  accountingOrganizationCode: string;
  bookType: AccountingBookType;
  isPrimary?: boolean | null;
  baseCurrencyCode: string;
  status: AccountingBookStatus;
  remark?: string | null;
}

export interface AccountingBookFormValues {
  code: string;
  name: string;
  accountingOrganizationCode: string;
  bookType: AccountingBookType;
  isPrimary?: boolean;
  baseCurrencyCode: string;
  status?: AccountingBookStatus;
  remark?: string;
}

export interface AccountingBookSelectOption {
  label: string;
  value: string;
}

export type AccountingBookSelectRendererProps = Pick<
  ProFormSelectProps,
  'name' | 'label' | 'disabled' | 'tooltip' | 'rules' | 'fieldProps'
>;

export interface AccountingBookModalCapabilities {
  canManage: boolean;
  bookTypeOptions: readonly AccountingBookSelectOption[];
  statusOptions: readonly AccountingBookSelectOption[];
  /** Renders the host-configurable organization select with the supplied locked state. */
  renderOrganizationSelect: (props: {
    name: 'accountingOrganizationCode';
    label: '所属会计组织';
    disabled: boolean;
    tooltip: string;
    rules: NonNullable<ProFormSelectProps['rules']>;
    fieldProps: { showSearch: true; optionFilterProp: 'label' };
    request: NonNullable<ProFormSelectProps['request']>;
    configTarget: 'accountingOrganizations';
  }) => ReactNode;
  /** Renders the host-configurable currency select with the supplied locked state. */
  renderBaseCurrencySelect: (props: {
    name: 'baseCurrencyCode';
    label: '本位币';
    disabled: boolean;
    tooltip: string;
    rules: NonNullable<ProFormSelectProps['rules']>;
    fieldProps: { showSearch: true; optionFilterProp: 'label' };
    request: NonNullable<ProFormSelectProps['request']>;
    configTarget: 'accountingCurrencies';
  }) => ReactNode;
  requestOrganizationOptions: NonNullable<ProFormSelectProps['request']>;
  requestCurrencyOptions: NonNullable<ProFormSelectProps['request']>;
  create: (values: AccountingBookFormValues & { isPrimary: boolean }) => Promise<void>;
  update: (
    id: string,
    values: AccountingBookFormValues & { isPrimary: boolean },
  ) => Promise<void>;
  notifySuccess: (message: string) => void;
}

export interface BookModalProps {
  record?: AccountingBookRecord;
  onDone: () => void;
  capabilities: AccountingBookModalCapabilities;
}
