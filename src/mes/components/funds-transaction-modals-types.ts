import type { ReactNode } from 'react';
import type { ModalProps, UploadFile } from 'antd';
import type { ProFormSelectProps } from '@ant-design/pro-components';

export type FundsDirection = 'in' | 'out';
export type FundsCounterpartyType = 'customer' | 'supplier' | 'employee' | 'other';
export type FundsConfigEntryTarget =
  | 'fundsAccounts'
  | 'fundsCategories'
  | 'customer'
  | 'supplier'
  | 'systemUsers';

export interface FundsTransactionSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface FundsAccountOptionRecord {
  id: string;
  name: string;
  code: string;
  currency: string;
}

export interface FundsCategoryOptionRecord {
  id: string;
  name: string;
  code?: string | null;
  costNature?: string | null;
}

export interface FundsTransactionImportRowResult {
  rowNo: number;
  externalTransactionNo?: string;
  status: 'valid' | 'error';
  message?: string;
}

export interface FundsTransactionImportResult {
  total: number;
  imported: number;
  rows: FundsTransactionImportRowResult[];
}

export interface FundsTransactionCreateFormValues {
  accountId: string;
  direction: FundsDirection;
  amount: number;
  categoryId?: string;
  bizDate: string;
  counterpartyType?: FundsCounterpartyType;
  counterpartyId?: string;
  counterpartyName?: string;
  remark?: string;
}

export interface FundsTransactionCreatePayload extends FundsTransactionCreateFormValues {
  counterpartyId?: string;
  counterpartyName?: string;
}

export interface FundsTransactionImportModalCapabilities {
  canCreate: boolean;
  importTransactions: (file: File) => Promise<FundsTransactionImportResult>;
  /** Fetches and validates the template Blob, then downloads it as the source filename. */
  downloadTemplate: () => Promise<void>;
  notifyError: (message: string) => void;
  notifySuccess: (message: string) => void;
}

export interface FundsTransactionImportModalProps {
  onDone: () => void;
  capabilities: FundsTransactionImportModalCapabilities;
}

export interface FundsTransactionConfigurableSelectProps {
  name: string;
  label: string;
  request: NonNullable<ProFormSelectProps['request']>;
  configTarget: FundsConfigEntryTarget;
  configWhen?: (params: Record<string, unknown>) => boolean;
  params?: Record<string, unknown>;
  tooltip?: string;
  rules?: NonNullable<ProFormSelectProps['rules']>;
  showSearch?: boolean;
  fieldProps?: ProFormSelectProps['fieldProps'];
  debounceTime?: number;
  placeholder?: string;
  /** Keeps source option components remounted when the counterparty family changes. */
  key?: string;
}

export interface FundsTransactionCreateModalCapabilities {
  canCreate: boolean;
  directionOptions: readonly FundsTransactionSelectOption[];
  counterpartyTypeOptions: readonly FundsTransactionSelectOption[];
  requestFundsAccounts: (params: {
    keyword?: string;
    pageSize: 100;
  }) => Promise<FundsAccountOptionRecord[]>;
  requestFundsCategories: (params: {
    direction: FundsDirection;
    isActive: true;
  }) => Promise<FundsCategoryOptionRecord[]>;
  requestCounterpartyOptions: (params: {
    type: Exclude<FundsCounterpartyType, 'other'>;
    keyWords?: string;
  }) => Promise<FundsTransactionSelectOption[]>;
  renderFundsAccountSelect: (
    props: FundsTransactionConfigurableSelectProps,
  ) => ReactNode;
  renderFundsCategorySelect: (
    props: FundsTransactionConfigurableSelectProps,
  ) => ReactNode;
  renderCounterpartySelect: (
    props: FundsTransactionConfigurableSelectProps,
  ) => ReactNode;
  createTransaction: (payload: FundsTransactionCreatePayload) => Promise<void>;
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
  scrollableModalProps: Pick<ModalProps, 'centered' | 'styles'>;
}

export interface CreateFundsTransactionModalProps {
  onDone: () => void;
  capabilities: FundsTransactionCreateModalCapabilities;
}

export interface FundsTransactionImportFormValues {
  file?: UploadFile[];
}
