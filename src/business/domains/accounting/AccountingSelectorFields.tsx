import {
  ProFormSelect,
  type ProFormSelectProps,
} from '@ant-design/pro-components';
import { Form } from 'antd';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccountingSelectorCapabilities } from '../../providers/BusinessUiProvider';
import { selectPreferredFiscalPeriod } from './accounting-period-selection';
import type {
  AccountingConfigEntryTarget,
  AccountingFiscalPeriodRecord,
  AccountingOption,
  AccountingSelectorCapabilities,
} from './accounting-selector-types';

const ACCOUNTING_OPTIONS_PAGE_SIZE = 100;
const DEFAULT_ACCOUNT_SELECT_PAGE_SIZE = 50;

const PERIOD_STATUS_TEXT = {
  not_opened: '未启用',
  open: '已开启',
  soft_closed: '软关闭',
  closed: '已关闭',
  locked: '已锁定',
} as const;

type SelectRequest = NonNullable<ProFormSelectProps['request']>;
type SelectRequestParams = Parameters<SelectRequest>[0];

export interface AccountingAccountOptionRequest {
  accountingBookCode?: string;
  keyWords?: string;
}

export interface AccountingParentAccountOptionRequest {
  accountingBookCode?: string;
  accountType?: string;
  keyWords?: string;
  excludeCode?: string;
}

function toOptions<T extends { code: string; name: string }>(
  rows: readonly T[],
): AccountingOption[] {
  return rows.map((row) => ({
    label: `${row.code}｜${row.name}`,
    value: row.code,
  }));
}

/** host request adapters for accounting form and ProTable selectors. */
export function createAccountingSelectorRequests(
  capabilities: AccountingSelectorCapabilities,
) {
  return {
    async requestAccountingBookOptions() {
      return toOptions(
        await capabilities.listAccountingBooks({
          status: 'active',
          pageSize: ACCOUNTING_OPTIONS_PAGE_SIZE,
        }),
      );
    },
    async requestAccountingOrganizationOptions() {
      return toOptions(
        await capabilities.listAccountingOrganizations({
          status: 'active',
          pageSize: ACCOUNTING_OPTIONS_PAGE_SIZE,
        }),
      );
    },
    async requestAccountingCurrencyOptions() {
      return toOptions(
        await capabilities.listAccountingCurrencies({
          status: 'active',
          pageSize: ACCOUNTING_OPTIONS_PAGE_SIZE,
        }),
      );
    },
    async requestFiscalPeriodOptions(accountingBookCode?: string) {
      if (!accountingBookCode) return [];
      const periods = await capabilities.listFiscalPeriods({
        accountingBookCode,
        pageSize: ACCOUNTING_OPTIONS_PAGE_SIZE,
      });
      return periods
        .slice()
        .sort((left, right) =>
          right.periodCode.localeCompare(left.periodCode),
        )
        .map((period) => ({
          label: `${period.periodCode}（${PERIOD_STATUS_TEXT[period.status] ?? '未知状态'}）`,
          value: period.periodCode,
        }));
    },
    async requestAccountOptions(params: AccountingAccountOptionRequest) {
      const { accountingBookCode, keyWords } = params;
      if (!accountingBookCode) return [];
      const accounts = await capabilities.listAccounts({
        accountingBookCode,
        allowPosting: true,
        status: 'active',
        keyword: keyWords,
        pageSize: DEFAULT_ACCOUNT_SELECT_PAGE_SIZE,
      });
      return toOptions(accounts);
    },
    async requestVoucherWordOptions(accountingBookCode?: string) {
      if (!accountingBookCode) return [];
      const words = await capabilities.listVoucherWords({
        accountingBookCode,
        status: 'active',
        pageSize: ACCOUNTING_OPTIONS_PAGE_SIZE,
      });
      return words
        .slice()
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
        .map((word) => ({
          label: `${word.code}｜${word.name}`,
          value: word.code,
        }));
    },
    async requestParentAccountOptions(
      params: AccountingParentAccountOptionRequest,
    ) {
      const { accountingBookCode, accountType, keyWords, excludeCode } = params;
      if (!accountingBookCode) return [];
      const accounts = await capabilities.listAccounts({
        accountingBookCode,
        accountType,
        allowPosting: false,
        isLeaf: false,
        status: 'active',
        keyword: keyWords,
        pageSize: DEFAULT_ACCOUNT_SELECT_PAGE_SIZE,
      });
      return toOptions(accounts.filter((account) => account.code !== excludeCode));
    },
  };
}

function hasSearchKeyword(params: SelectRequestParams): boolean {
  const values = params as Record<string, unknown>;
  return ['keyWords', 'keyword', 'search', 'searchText'].some((key) => {
    const value = values[key];
    return typeof value === 'string' && value.trim().length > 0;
  });
}

function hasSelectedValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== '';
}

interface ConfigurableAccountingSelectProps
  extends Omit<ProFormSelectProps, 'label' | 'request'> {
  label: ReactNode;
  request: SelectRequest;
  configTarget: AccountingConfigEntryTarget;
  configWhen?: (params: SelectRequestParams) => boolean;
  emptyText?: ReactNode;
}

/** Replaces the host-owned ConfigEntryFieldLabel and keeps its empty/request lifecycle. */
function ConfigurableAccountingSelect({
  name,
  label,
  request: sourceRequest,
  configTarget,
  configWhen,
  emptyText = '暂无可选数据',
  disabled,
  readonly,
  messageVariables,
  fieldProps,
  ...rest
}: ConfigurableAccountingSelectProps) {
  const form = Form.useFormInstance();
  const currentValue = Form.useWatch(name, form);
  const capabilities = useAccountingSelectorCapabilities();
  const labelText = typeof label === 'string' ? label : '当前选项';
  const [showConfigEntry, setShowConfigEntry] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const requestIdRef = useRef(0);
  const probeRequestIdRef = useRef(0);
  const refreshAfterConfigRef = useRef(false);
  const sourceRequestRef = useRef(sourceRequest);
  const configWhenRef = useRef(configWhen);
  sourceRequestRef.current = sourceRequest;
  configWhenRef.current = configWhen;
  const paramsKey = JSON.stringify(
    (rest.params as Record<string, unknown> | undefined) ?? {},
  );

  useEffect(() => {
    if (
      hasSelectedValue(currentValue) ||
      disabled ||
      readonly ||
      fieldProps?.disabled
    ) {
      setShowConfigEntry(false);
      return;
    }

    const params = {
      ...((rest.params as Record<string, unknown> | undefined) ?? {}),
    };
    for (const key of ['keyWords', 'keyword', 'search', 'searchText']) {
      delete params[key];
    }
    if (
      configWhenRef.current &&
      !configWhenRef.current(params as SelectRequestParams)
    ) {
      setShowConfigEntry(false);
      return;
    }

    let active = true;
    const requestId = ++probeRequestIdRef.current;
    sourceRequestRef
      .current(params as SelectRequestParams, {})
      .then((options) => {
        if (!active || requestId !== probeRequestIdRef.current) return;
        setShowConfigEntry(Array.isArray(options) && options.length === 0);
      })
      .catch(() => {
        if (active && requestId === probeRequestIdRef.current) {
          setShowConfigEntry(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    currentValue,
    disabled,
    fieldProps?.disabled,
    paramsKey,
    readonly,
  ]);

  useEffect(() => {
    const refreshAfterReturn = () => {
      if (!refreshAfterConfigRef.current) return;
      refreshAfterConfigRef.current = false;
      setRefreshVersion((version) => version + 1);
    };
    window.addEventListener('focus', refreshAfterReturn);
    return () => window.removeEventListener('focus', refreshAfterReturn);
  }, []);

  const request = useCallback<SelectRequest>(
    async (...args) => {
      const requestId = ++requestIdRef.current;
      const params = args[0];
      try {
        const sourceParams = { ...(params as Record<string, unknown>) };
        delete sourceParams.configEntryRefreshVersion;
        const sourceArgs = [
          sourceParams,
          ...args.slice(1),
        ] as Parameters<SelectRequest>;
        const options = await sourceRequest(...sourceArgs);
        if (requestId === requestIdRef.current && !hasSearchKeyword(params)) {
          setShowConfigEntry(
            Array.isArray(options) &&
              options.length === 0 &&
              !hasSelectedValue(currentValue) &&
              !disabled &&
              !readonly &&
              !fieldProps?.disabled &&
              (configWhen ? configWhen(params) : true),
          );
        }
        return options;
      } catch (error) {
        if (requestId === requestIdRef.current) setShowConfigEntry(false);
        throw error;
      }
    },
    [
      configWhen,
      currentValue,
      disabled,
      fieldProps?.disabled,
      readonly,
      sourceRequest,
    ],
  );

  const renderedLabel = capabilities?.renderConfigEntryLabel
    ? capabilities.renderConfigEntryLabel({
        target: configTarget,
        children: label,
        show:
          showConfigEntry &&
          !disabled &&
          !readonly &&
          !fieldProps?.disabled &&
          !hasSelectedValue(currentValue),
        onOpen: () => {
          refreshAfterConfigRef.current = true;
        },
      })
    : label;

  return (
    <ProFormSelect
      {...rest}
      name={name}
      label={renderedLabel}
      messageVariables={{ ...messageVariables, label: labelText }}
      request={request}
      params={{
        ...((rest.params as Record<string, unknown> | undefined) ?? {}),
        configEntryRefreshVersion: refreshVersion,
      }}
      disabled={disabled}
      readonly={readonly}
      fieldProps={{
        ...fieldProps,
        notFoundContent: fieldProps?.notFoundContent ?? emptyText,
      }}
    />
  );
}

interface AccountingFieldProps {
  name?: string | (string | number)[];
  label?: string;
  tooltip?: string;
  required?: boolean;
  disabled?: boolean;
  /** Preserve existing values while editing; defaults when blank by default. */
  autoDefault?: boolean;
  width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/** Active accounting books; defaults a blank field to the primary or sole book. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable accounting book field behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function AccountingBookField(props: AccountingFieldProps) {
  const {
    name = 'accountingBookCode',
    label = '账簿编码',
    tooltip,
    required = true,
    disabled = false,
    autoDefault = true,
    width = 'md',
    ...rest
  } = props;
  const form = Form.useFormInstance();
  const capabilities = useAccountingSelectorCapabilities();
  const requestOptions = useCallback(async () => {
    if (!capabilities) {
      throw new Error('host accounting selector capabilities are not configured');
    }
    const books = await capabilities.listAccountingBooks({
      status: 'active',
      pageSize: ACCOUNTING_OPTIONS_PAGE_SIZE,
    });
    if (autoDefault && !form.getFieldValue(name)) {
      const primary =
        books.find((book) => book.isPrimary) ??
        (books.length === 1 ? books[0] : undefined);
      if (primary) form.setFieldValue(name, primary.code);
    }
    return toOptions(books);
  }, [autoDefault, capabilities, form, name]);

  return (
    <ConfigurableAccountingSelect
      {...rest}
      name={name}
      label={label}
      configTarget="accountingBooks"
      request={requestOptions}
      tooltip={tooltip}
      rules={required ? [{ required: true, message: `请选择${label}` }] : undefined}
      placeholder={`请选择${label}`}
      width={width}
      disabled={disabled}
      fieldProps={{ showSearch: true, optionFilterProp: 'label' }}
    />
  );
}

interface AccountingDependentFieldProps extends AccountingFieldProps {
  /** Root form field containing the selected accounting book code. */
  bookFieldName?: string;
}

/** Period options follow the book and default to the eligible period covering today. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable fiscal period field behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function FiscalPeriodField(props: AccountingDependentFieldProps) {
  const {
    name = 'fiscalPeriod',
    label = '会计期间',
    required = true,
    disabled = false,
    autoDefault = true,
    bookFieldName = 'accountingBookCode',
    width = 'md',
    ...rest
  } = props;
  const form = Form.useFormInstance();
  const capabilities = useAccountingSelectorCapabilities();
  const bookCode = Form.useWatch(bookFieldName, form) as string | undefined;
  const requestOptions = useCallback(
    async (params: { accountingBookCode?: string }) => {
      const requestedBookCode = params.accountingBookCode;
      if (!requestedBookCode) return [];
      if (!capabilities) {
        throw new Error('host accounting selector capabilities are not configured');
      }
      const periods = await capabilities.listFiscalPeriods({
        accountingBookCode: requestedBookCode,
        pageSize: ACCOUNTING_OPTIONS_PAGE_SIZE,
      });
      const list = periods
        .slice()
        .sort((left, right) => right.periodCode.localeCompare(left.periodCode));
      if (autoDefault) {
        const current = form.getFieldValue(name) as string | undefined;
        const stillValid = current && list.some((period) => period.periodCode === current);
        if (!stillValid && form.getFieldValue(bookFieldName) === requestedBookCode) {
          const preferred = selectPreferredFiscalPeriod(list);
          form.setFieldValue(name, preferred?.periodCode);
        }
      }
      return list.map((period) => ({
        label: `${period.periodCode}（${PERIOD_STATUS_TEXT[period.status] ?? '未知状态'}）`,
        value: period.periodCode,
      }));
    },
    [autoDefault, bookFieldName, capabilities, form, name],
  );

  return (
    <ConfigurableAccountingSelect
      {...rest}
      name={name}
      label={label}
      configTarget="accountingFiscalPeriods"
      configWhen={() => Boolean(bookCode)}
      request={requestOptions}
      params={{ accountingBookCode: bookCode }}
      rules={required ? [{ required: true, message: `请选择${label}` }] : undefined}
      placeholder={bookCode ? `请选择${label}` : '请先选择账簿'}
      width={width}
      disabled={disabled}
      fieldProps={{ showSearch: true, optionFilterProp: 'label' }}
    />
  );
}

/** Voucher words follow the selected book and default to the first enabled word. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable voucher word field behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function VoucherWordField(props: AccountingDependentFieldProps) {
  const {
    name = 'voucherWordCode',
    label = '凭证字',
    required = true,
    disabled = false,
    autoDefault = true,
    bookFieldName = 'accountingBookCode',
    width = 'sm',
    ...rest
  } = props;
  const form = Form.useFormInstance();
  const capabilities = useAccountingSelectorCapabilities();
  const bookCode = Form.useWatch(bookFieldName, form) as string | undefined;
  const requestOptions = useCallback(
    async (params: { accountingBookCode?: string }) => {
      const requestedBookCode = params.accountingBookCode;
      if (!requestedBookCode) return [];
      if (!capabilities) {
        throw new Error('host accounting selector capabilities are not configured');
      }
      const words = await capabilities.listVoucherWords({
        accountingBookCode: requestedBookCode,
        status: 'active',
        pageSize: ACCOUNTING_OPTIONS_PAGE_SIZE,
      });
      const list = words
        .slice()
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
        .map((word) => ({ label: `${word.code}｜${word.name}`, value: word.code }));
      if (autoDefault) {
        const current = form.getFieldValue(name) as string | undefined;
        if (
          (!current || !list.some((item) => item.value === current)) &&
          form.getFieldValue(bookFieldName) === requestedBookCode
        ) {
          form.setFieldValue(name, list[0]?.value);
        }
      }
      return list;
    },
    [autoDefault, bookFieldName, capabilities, form, name],
  );

  return (
    <ConfigurableAccountingSelect
      {...rest}
      name={name}
      label={label}
      configTarget="accountingVoucherWords"
      configWhen={() => Boolean(bookCode)}
      request={requestOptions}
      params={{ accountingBookCode: bookCode }}
      rules={required ? [{ required: true, message: `请选择${label}` }] : undefined}
      placeholder={bookCode ? `请选择${label}` : '请先选择账簿'}
      width={width}
      disabled={disabled}
      fieldProps={{ showSearch: true, optionFilterProp: 'label' }}
    />
  );
}

interface AccountFieldProps {
  name?: string | (string | number)[];
  label?: string;
  required?: boolean;
  width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  /** Root form field containing the selected accounting book code. */
  bookFieldName?: string;
}

/** Posting accounts filtered by the current book; supports use inside ProFormList. */
/**
 * @sunxu-layer business
 * @sunxu-domain accounting
 * @sunxu-reason Presents reusable account field behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function AccountField(props: AccountFieldProps) {
  const {
    name = 'accountCode',
    label = '科目',
    required = true,
    width = 'sm',
    bookFieldName = 'accountingBookCode',
    ...rest
  } = props;
  const form = Form.useFormInstance();
  const capabilities = useAccountingSelectorCapabilities();
  const bookCode = Form.useWatch(bookFieldName, form) as string | undefined;
  const requests = useMemo(
    () =>
      capabilities ? createAccountingSelectorRequests(capabilities) : undefined,
    [capabilities],
  );

  return (
    <ConfigurableAccountingSelect
      {...rest}
      name={name}
      label={label}
      configTarget="accountingAccounts"
      configWhen={() => Boolean(bookCode)}
      request={(params) => {
        if (!requests) {
          throw new Error('host accounting selector capabilities are not configured');
        }
        return requests.requestAccountOptions({
          accountingBookCode: bookCode,
          keyWords: (params as Record<string, unknown>).keyWords as string | undefined,
        });
      }}
      params={{ accountingBookCode: bookCode }}
      disabled={!bookCode}
      rules={required ? [{ required: true, message: `请选择${label}` }] : undefined}
      placeholder={bookCode ? `请选择${label}` : '请先选择账簿'}
      width={width}
      showSearch
      debounceTime={300}
      fieldProps={{ filterOption: false }}
    />
  );
}
