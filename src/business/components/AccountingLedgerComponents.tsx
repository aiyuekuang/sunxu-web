import {
  ModalForm,
  type ProColumns,
  type ProTableProps,
} from '@ant-design/pro-components';
import { Alert, Button, Descriptions, Space, Tag } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { useMesAccountingSelectorCapabilities } from '../MesUiProvider';
import {
  AccountingBookField,
  createAccountingSelectorRequests,
  FiscalPeriodField,
} from './AccountingSelectorFields';
import {
  ResizableProTable as ProTable,
  ResizableTable as Table,
} from './ResizableTable';
import type {
  AccountingAccountBalanceRow,
  AccountingNarrativeSummaryRow,
  AccountingTrialBalanceResult,
  LedgerQueryContextProps,
  LedgerRouteFilters,
  NarrativeSummaryTableProps,
  TrialBalanceButtonProps,
} from './accounting-ledger-components-types';

function money(value: number | undefined | null): string {
  return Number(value ?? 0).toFixed(2);
}

function textValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function tablePageValue(value: unknown, defaultValue: number): number {
  return typeof value === 'number' ? value : defaultValue;
}

/**
 * @sunxu-layer business
 * @sunxu-domain accounting general ledger query context
 * @sunxu-reason Preserves the submitted ledger scope and its return paths while the MES host continues to own URL changes and view routing.
 *
 * Shows the active ledger filters and keeps balance, narrative-summary, and
 * entry navigation within the same accounting book and fiscal period.
 */
export function LedgerQueryContext({
  filters,
  view,
  onNavigate,
}: LedgerQueryContextProps) {
  const hasFilters = Object.values(filters).some(Boolean);
  if (!hasFilters) return null;

  const balanceFilters: LedgerRouteFilters = {
    accountingBookCode: filters.accountingBookCode,
    fiscalPeriod: filters.fiscalPeriod,
  };
  const narrativeSummaryFilters: LedgerRouteFilters = {
    ...balanceFilters,
    accountCode: filters.accountCode,
    currency: filters.currency,
    summaryKeyword: filters.summaryKeyword,
  };

  return (
    <Space size={8} style={{ marginBottom: 12 }} wrap>
      {filters.accountingBookCode ? (
        <Tag>账簿 {filters.accountingBookCode}</Tag>
      ) : null}
      {filters.fiscalPeriod ? <Tag>期间 {filters.fiscalPeriod}</Tag> : null}
      {filters.accountCode ? <Tag>科目 {filters.accountCode}</Tag> : null}
      {filters.currency ? <Tag>币别 {filters.currency}</Tag> : null}
      {filters.summaryKeyword ? <Tag>摘要 {filters.summaryKeyword}</Tag> : null}
      {view === 'entries' && filters.summaryKeyword ? (
        <Button
          type="link"
          onClick={() => onNavigate('narrative-summary', narrativeSummaryFilters)}
        >
          返回摘要汇总
        </Button>
      ) : null}
      {view === 'entries' && filters.accountCode && !filters.summaryKeyword ? (
        <Button
          type="link"
          onClick={() => onNavigate('balances', balanceFilters)}
        >
          返回科目余额
        </Button>
      ) : null}
      <Button type="link" onClick={() => onNavigate(view, {})}>
        清除筛选
      </Button>
    </Space>
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain accounting narrative summary
 * @sunxu-reason Keeps the submitted filters, result columns, currency/accounting selectors, row drilldown, and server pagination while MES supplies the query and selector services.
 *
 * Lists posted general-ledger activity grouped by narrative, account, and
 * currency. The host provides the authoritative data request.
 */
export function NarrativeSummaryTable({
  filters,
  onViewEntries,
  onQueryChange,
  capabilities,
  pagination,
}: NarrativeSummaryTableProps) {
  const accountingSelectorCapabilities = useMesAccountingSelectorCapabilities();
  const selectorRequests = useMemo(
    () =>
      accountingSelectorCapabilities
        ? createAccountingSelectorRequests(accountingSelectorCapabilities)
        : undefined,
    [accountingSelectorCapabilities],
  );

  const requestAccountingBooks = useCallback(async () => {
    if (!selectorRequests) {
      throw new Error('MES accounting selector capabilities are not configured');
    }
    return selectorRequests.requestAccountingBookOptions();
  }, [selectorRequests]);

  const requestFiscalPeriods = useCallback(
    async (params: Record<string, unknown>) => {
      if (!selectorRequests) {
        throw new Error('MES accounting selector capabilities are not configured');
      }
      return selectorRequests.requestFiscalPeriodOptions(
        textValue(params.accountingBookCode),
      );
    },
    [selectorRequests],
  );

  const requestCurrencies = useCallback(async () => {
    if (!selectorRequests) {
      throw new Error('MES accounting selector capabilities are not configured');
    }
    return selectorRequests.requestAccountingCurrencyOptions();
  }, [selectorRequests]);

  const columns: ProColumns<AccountingNarrativeSummaryRow>[] = [
    {
      title: '账簿',
      dataIndex: 'accountingBookCode',
      hideInTable: true,
      valueType: 'select',
      formItemProps: { rules: [{ required: true, message: '请选择账簿' }] },
      request: requestAccountingBooks,
      fieldProps: { showSearch: true, optionFilterProp: 'label' },
    },
    {
      title: '会计期间',
      dataIndex: 'fiscalPeriod',
      hideInTable: true,
      valueType: 'select',
      formItemProps: { rules: [{ required: true, message: '请选择会计期间' }] },
      dependencies: ['accountingBookCode'],
      request: requestFiscalPeriods,
      fieldProps: { showSearch: true, optionFilterProp: 'label' },
    },
    {
      title: '摘要',
      dataIndex: 'summaryKeyword',
      width: 220,
      fieldProps: { placeholder: '筛选摘要' },
      render: (_, row) => row.summary || '-',
    },
    { title: '科目编码', dataIndex: 'accountCode', width: 130 },
    {
      title: '科目名称',
      dataIndex: 'accountName',
      width: 160,
      search: false,
    },
    {
      title: '方向',
      dataIndex: 'direction',
      width: 80,
      search: false,
    },
    {
      title: '借方发生总额',
      dataIndex: 'debitTotal',
      width: 150,
      align: 'right',
      search: false,
      render: (_, row) => money(row.debitTotal),
    },
    {
      title: '贷方发生总额',
      dataIndex: 'creditTotal',
      width: 150,
      align: 'right',
      search: false,
      render: (_, row) => money(row.creditTotal),
    },
    {
      title: '区间发生净额',
      dataIndex: 'netAmount',
      width: 150,
      align: 'right',
      search: false,
      render: (_, row) => money(row.netAmount),
    },
    {
      title: '币别',
      dataIndex: 'currency',
      width: 110,
      valueType: 'select',
      request: requestCurrencies,
      fieldProps: { showSearch: true, optionFilterProp: 'label' },
      render: (_, row) => row.currency,
    },
    {
      title: '操作',
      dataIndex: '__actions',
      key: 'actions',
      valueType: 'option',
      width: 120,
      search: false,
      fixed: 'right',
      render: (_, row) => (
        <Button type="link" onClick={() => onViewEntries(row)}>
          查看明细
        </Button>
      ),
    },
  ];

  const request = useCallback<
    NonNullable<ProTableProps<AccountingNarrativeSummaryRow, Record<string, unknown>>['request']>
  >(
    async (params) => {
      const requestParams = params as Record<string, unknown>;
      const response = await capabilities.requestRows({
        page: tablePageValue(requestParams.current, 1),
        pageSize: tablePageValue(requestParams.pageSize, 20),
        accountingBookCode:
          filters.accountingBookCode ??
          textValue(requestParams.accountingBookCode),
        fiscalPeriod:
          filters.fiscalPeriod ?? textValue(requestParams.fiscalPeriod),
        summaryKeyword:
          filters.summaryKeyword ?? textValue(requestParams.summaryKeyword),
        accountCode: filters.accountCode ?? textValue(requestParams.accountCode),
        currency: filters.currency ?? textValue(requestParams.currency),
      });
      return {
        data: response.list,
        total: response.total,
        success: true,
      };
    },
    [capabilities, filters],
  );

  return (
    <ProTable<AccountingNarrativeSummaryRow>
      rowKey={(row) => `${row.summary}:${row.accountCode}:${row.currency}`}
      headerTitle="摘要汇总（已过账分录）"
      pagination={pagination}
      fitContainerHeight
      columns={columns}
      scroll={{ x: 1250 }}
      params={filters}
      onSubmit={(values) =>
        onQueryChange({
          accountingBookCode: textValue(values.accountingBookCode),
          fiscalPeriod: textValue(values.fiscalPeriod),
          accountCode: textValue(values.accountCode),
          currency: textValue(values.currency),
          summaryKeyword: textValue(values.summaryKeyword),
        })
      }
      onReset={() => onQueryChange({})}
      request={request}
    />
  );
}

/**
 * @sunxu-layer business
 * @sunxu-domain accounting general ledger trial balance
 * @sunxu-reason Preserves the read-only same-modal query/result flow and balance warning while the host owns trial-balance service access and notification delivery.
 *
 * Queries the selected book and period, then renders the debit/credit totals and
 * account-level trial-balance rows without navigating away from the ledger.
 */
export function TrialBalanceButton({
  capabilities,
}: TrialBalanceButtonProps) {
  const [result, setResult] = useState<AccountingTrialBalanceResult | null>(null);

  return (
    <ModalForm<{ accountingBookCode: string; fiscalPeriod: string }>
      title="试算平衡"
      width={880}
      trigger={<Button>试算平衡</Button>}
      modalProps={{ destroyOnHidden: true }}
      submitter={{ searchConfig: { submitText: '试算' } }}
      onFinish={async (values) => {
        const balance = await capabilities.requestTrialBalance(values);
        setResult(balance);
        if (!balance.balanced) {
          capabilities.notifyWarning('试算不平衡，请检查凭证过账');
        }
        return false;
      }}
    >
      <AccountingBookField />
      <FiscalPeriodField />
      {result ? (
        <>
          <Alert
            style={{ marginBottom: 12 }}
            type={result.balanced ? 'success' : 'error'}
            showIcon
            message={result.balanced ? '借贷平衡' : '借贷不平衡'}
            description={`借方合计 ${money(result.debitTotal)} / 贷方合计 ${money(
              result.creditTotal,
            )}`}
          />
          <Descriptions size="small" column={2} style={{ marginBottom: 8 }}>
            <Descriptions.Item label="账簿">
              {result.accountingBookCode}
            </Descriptions.Item>
            <Descriptions.Item label="会计期间">
              {result.fiscalPeriod}
            </Descriptions.Item>
          </Descriptions>
          <Table<AccountingAccountBalanceRow>
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ y: 320 }}
            dataSource={result.rows}
            columns={
              [
                { title: '科目编码', dataIndex: 'accountCode', width: 130 },
                { title: '科目名称', dataIndex: 'accountName' },
                {
                  title: '本期借方发生',
                  dataIndex: 'debitAmount',
                  align: 'right',
                  width: 130,
                  render: (_, row) => money(row.debitAmount),
                },
                {
                  title: '本期贷方发生',
                  dataIndex: 'creditAmount',
                  align: 'right',
                  width: 130,
                  render: (_, row) => money(row.creditAmount),
                },
              ] satisfies ProColumns<AccountingAccountBalanceRow>[]
            }
          />
        </>
      ) : null}
    </ModalForm>
  );
}
