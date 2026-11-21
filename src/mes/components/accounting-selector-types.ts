import type { ReactNode } from 'react';

export type AccountingFiscalPeriodStatus =
  | 'not_opened'
  | 'open'
  | 'soft_closed'
  | 'closed'
  | 'locked';

export interface AccountingOption {
  label: string;
  value: string;
}

export interface AccountingSelectorBookRecord {
  code: string;
  name: string;
  isPrimary?: boolean;
}

export interface AccountingOrganizationRecord {
  code: string;
  name: string;
}

export interface AccountingCurrencyRecord {
  code: string;
  name: string;
}

export interface AccountingFiscalPeriodRecord {
  periodCode: string;
  status: AccountingFiscalPeriodStatus;
  startDate: string;
  endDate: string;
}

export interface AccountingVoucherWordRecord {
  code: string;
  name: string;
  createdAt: string;
}

export interface AccountingSelectorAccountRecord {
  code: string;
  name: string;
}

export interface AccountingAccountRequest {
  accountingBookCode: string;
  accountType?: string;
  allowPosting: boolean;
  isLeaf?: boolean;
  status: 'active';
  keyword?: string;
  pageSize: number;
}

export type AccountingConfigEntryTarget =
  | 'accountingBooks'
  | 'accountingFiscalPeriods'
  | 'accountingVoucherWords'
  | 'accountingAccounts';

export interface AccountingConfigEntryLabelProps {
  target: AccountingConfigEntryTarget;
  children: ReactNode;
  show: boolean;
  onOpen: () => void;
}

export interface MesAccountingSelectorCapabilities {
  listAccountingBooks: (params: {
    status: 'active';
    pageSize: number;
  }) => Promise<AccountingSelectorBookRecord[]>;
  listAccountingOrganizations: (params: {
    status: 'active';
    pageSize: number;
  }) => Promise<AccountingOrganizationRecord[]>;
  listAccountingCurrencies: (params: {
    status: 'active';
    pageSize: number;
  }) => Promise<AccountingCurrencyRecord[]>;
  listFiscalPeriods: (params: {
    accountingBookCode: string;
    pageSize: number;
  }) => Promise<AccountingFiscalPeriodRecord[]>;
  listVoucherWords: (params: {
    accountingBookCode: string;
    status: 'active';
    pageSize: number;
  }) => Promise<AccountingVoucherWordRecord[]>;
  listAccounts: (params: AccountingAccountRequest) => Promise<AccountingSelectorAccountRecord[]>;
  renderConfigEntryLabel?: (
    props: AccountingConfigEntryLabelProps,
  ) => ReactNode;
}
