import type { ProTableProps } from '@ant-design/pro-components';

export type LedgerView =
  | 'balances'
  | 'entries'
  | 'narrative-summary'
  | 'voucher-summary';

export interface LedgerRouteFilters {
  accountingBookCode?: string;
  fiscalPeriod?: string;
  accountCode?: string;
  currency?: string;
  summaryKeyword?: string;
}

export type LedgerQueryChange = (filters: LedgerRouteFilters) => void;

export interface LedgerQueryContextProps {
  filters: LedgerRouteFilters;
  view: LedgerView;
  onNavigate: (view: LedgerView, filters: LedgerRouteFilters) => void;
}

export interface AccountingNarrativeSummaryRow {
  accountingBookCode: string;
  fiscalPeriod: string;
  summary: string;
  accountCode: string;
  accountName: string;
  currency: string;
  direction: '借' | '贷' | '借贷' | '平';
  debitTotal: number;
  creditTotal: number;
  netAmount: number;
}

export interface AccountingNarrativeSummaryRequest {
  page: number;
  pageSize: number;
  accountingBookCode?: string;
  fiscalPeriod?: string;
  accountCode?: string;
  currency?: string;
  summaryKeyword?: string;
}

export interface AccountingNarrativeSummaryResponse {
  list: AccountingNarrativeSummaryRow[];
  total: number;
}

export interface NarrativeSummaryTableCapabilities {
  requestRows: (
    params: AccountingNarrativeSummaryRequest,
  ) => Promise<AccountingNarrativeSummaryResponse>;
}

export interface NarrativeSummaryTableProps {
  filters: LedgerRouteFilters;
  onViewEntries: (row: AccountingNarrativeSummaryRow) => void;
  onQueryChange: LedgerQueryChange;
  capabilities: NarrativeSummaryTableCapabilities;
  /** Host pagination policy, including its persisted page size behavior. */
  pagination: ProTableProps<AccountingNarrativeSummaryRow, Record<string, unknown>>['pagination'];
}

export interface AccountingAccountBalanceRow {
  id: string;
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
}

export interface AccountingTrialBalanceResult {
  accountingBookCode: string;
  fiscalPeriod: string;
  debitTotal: number;
  creditTotal: number;
  balanced: boolean;
  rows: AccountingAccountBalanceRow[];
}

export interface TrialBalanceButtonCapabilities {
  requestTrialBalance: (params: {
    accountingBookCode: string;
    fiscalPeriod: string;
  }) => Promise<AccountingTrialBalanceResult>;
  notifyWarning: (message: string) => void;
}

export interface TrialBalanceButtonProps {
  capabilities: TrialBalanceButtonCapabilities;
}
