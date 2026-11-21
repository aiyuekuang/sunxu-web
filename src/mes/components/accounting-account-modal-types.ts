import type { ReactNode } from 'react';
import type { ModalProps } from 'antd';
import type { ProFormSelectProps } from '@ant-design/pro-components';
import type { AccountingBookSelectOption } from './accounting-book-modal-types';

export type AccountingAccountType =
  | 'asset'
  | 'liability'
  | 'equity'
  | 'revenue'
  | 'cost'
  | 'expense'
  | 'profit_loss'
  | 'off_balance';
export type AccountingAccountNormalBalance = 'debit' | 'credit';
export type AccountingAccountStatus = 'draft' | 'active' | 'suspended' | 'disabled';
export type AccountingDimensionRequirementValue = 'optional' | 'required';

export interface AccountingDimensionRequirement {
  dimensionType: string;
  requirement: AccountingDimensionRequirementValue;
}

export interface AccountingAccountRecord {
  id: string;
  code: string;
  name: string;
  accountingBookCode: string;
  parentCode?: string | null;
  accountType: AccountingAccountType;
  normalBalance: AccountingAccountNormalBalance;
  level: number;
  isLeaf?: boolean | null;
  allowPosting?: boolean | null;
  currencyCode?: string | null;
  dimensionRequirements?: Array<{
    dimensionType: string;
    requirement: 'none' | AccountingDimensionRequirementValue;
  }> | null;
  status: AccountingAccountStatus;
  remark?: string | null;
}

export interface AccountingAccountFormValues {
  code: string;
  name: string;
  accountingBookCode: string;
  parentCode?: string;
  accountType: AccountingAccountType;
  normalBalance: AccountingAccountNormalBalance;
  level: number;
  isLeaf?: boolean;
  allowPosting?: boolean;
  currencyCode?: string;
  dimensionRequirements?: AccountingDimensionRequirement[];
  status?: AccountingAccountStatus;
  remark?: string;
}

export type AccountingAccountSelectOption = AccountingBookSelectOption;

export interface AccountingAccountModalCapabilities {
  canManage: boolean;
  accountTypeOptions: readonly AccountingAccountSelectOption[];
  normalBalanceOptions: readonly AccountingAccountSelectOption[];
  statusOptions: readonly AccountingAccountSelectOption[];
  dimensionTypeOptions: readonly AccountingAccountSelectOption[];
  dimensionRequirementOptions: readonly AccountingAccountSelectOption[];
  /** Uses the host accounting selector adapter, config-entry flow, and current form context. */
  renderAccountingBookField: (props: {
    name: 'accountingBookCode';
    label: '账簿';
    disabled: boolean;
    required: boolean;
  }) => ReactNode;
  /** Uses the host's searchable, book/type-dependent parent account selector. */
  renderParentAccountSelect: (props: {
    name: 'parentCode';
    label: '上级科目';
    accountingBookCode?: string;
    accountType?: AccountingAccountType;
    excludeCode?: string;
    request: NonNullable<ProFormSelectProps['request']>;
    debounceTime: 300;
    configTarget: 'accountingAccounts';
    configWhen: () => boolean;
    disabled: boolean;
    placeholder: string;
    tooltip: string;
    fieldProps: { allowClear: true; showSearch: true; filterOption: false };
  }) => ReactNode;
  requestParentAccountOptions: (params: {
    accountingBookCode?: string;
    accountType?: AccountingAccountType;
    excludeCode?: string;
    keyWords?: string;
  }) => Promise<AccountingAccountSelectOption[]>;
  /** Uses the host's currency options and configuration entry. */
  renderCurrencySelect: (props: {
    name: 'currencyCode';
    label: '币种';
    request: NonNullable<ProFormSelectProps['request']>;
    configTarget: 'accountingCurrencies';
    fieldProps: { allowClear: true; showSearch: true; optionFilterProp: 'label' };
    placeholder: '留空取账簿本位币';
  }) => ReactNode;
  requestCurrencyOptions: NonNullable<ProFormSelectProps['request']>;
  scrollableModalProps: Pick<ModalProps, 'centered' | 'styles'>;
  create: (values: AccountingAccountFormValues) => Promise<void>;
  update: (id: string, values: AccountingAccountFormValues) => Promise<void>;
  notifyError: (message: string) => void;
  notifySuccess: (message: string) => void;
}

export interface AccountModalProps {
  record?: AccountingAccountRecord;
  onDone: () => void;
  capabilities: AccountingAccountModalCapabilities;
}
