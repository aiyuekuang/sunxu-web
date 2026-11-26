import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  Form,
  Space,
  Switch,
  Typography,
} from 'antd';
import { SectionCard } from '../../src';
import {
  AccountField,
  AccountingBookField,
  createAccountingSelectorRequests,
  FiscalPeriodField,
  getLocalBusinessDate,
  BusinessUiProvider,
  selectPreferredFiscalPeriod,
  VoucherWordField,
  type AccountingFiscalPeriodRecord,
  type AccountingSelectorCapabilities,
} from '../../src/business';

function monthCode(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
}

function periodForMonth(value: Date, status: AccountingFiscalPeriodRecord['status']) {
  const year = value.getFullYear();
  const monthIndex = value.getMonth();
  const code = monthCode(value);
  const startDate = `${code}-01`;
  const endDate = `${code}-${String(new Date(year, monthIndex + 1, 0).getDate()).padStart(2, '0')}`;
  return { periodCode: code, status, startDate, endDate };
}

function makeCapabilities(emptyBooks: boolean): AccountingSelectorCapabilities {
  return {
    async listAccountingBooks() {
      return emptyBooks
        ? []
        : [
        { code: 'MAIN', name: '主账簿', isPrimary: true },
        { code: 'COST', name: '成本账簿' },
          ];
    },
    async listAccountingOrganizations() {
      return [{ code: 'ORG-SH', name: '上海运营组织' }];
    },
    async listAccountingCurrencies() {
      return [
        { code: 'CNY', name: '人民币' },
        { code: 'USD', name: '美元' },
      ];
    },
    async listFiscalPeriods({ accountingBookCode }) {
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return accountingBookCode === 'MAIN'
        ? [
            periodForMonth(nextMonth, 'open'),
            periodForMonth(today, 'soft_closed'),
            periodForMonth(previousMonth, 'closed'),
          ]
        : [periodForMonth(today, 'open')];
    },
    async listVoucherWords({ accountingBookCode }) {
      return accountingBookCode === 'MAIN'
        ? [
            { code: 'PAY', name: '付款凭证', createdAt: '2024-01-02T00:00:00Z' },
            { code: 'GEN', name: '记账凭证', createdAt: '2024-01-01T00:00:00Z' },
          ]
        : [{ code: 'GEN', name: '记账凭证', createdAt: '2024-01-01T00:00:00Z' }];
    },
    async listAccounts({ keyword }) {
      const options = [
        { code: '1002', name: '银行存款' },
        { code: '1122', name: '应收账款' },
        { code: '2202', name: '应付账款' },
      ];
      return keyword
        ? options.filter((option) =>
            `${option.code}${option.name}`.includes(keyword),
          )
        : options;
    },
    renderConfigEntryLabel: ({ target, children, show, onOpen }) => (
      <Space size={6} align="center" wrap={false}>
        <span>{children}</span>
        {show ? (
          <Typography.Link
            href={`#${target}`}
            onClick={(event) => {
              event.preventDefault();
              onOpen();
            }}
          >
            去配置
          </Typography.Link>
        ) : null}
      </Space>
    ),
  };
}

function AccountingSelectorDemoForm({
  capabilities,
  autoDefault,
  disabled,
  emptyBooks,
}: {
  capabilities: AccountingSelectorCapabilities;
  autoDefault: boolean;
  disabled: boolean;
  emptyBooks: boolean;
}) {
  const [form] = Form.useForm();
  const [helperResult, setHelperResult] = useState('尚未调用');
  const values = Form.useWatch([], form) as Record<string, unknown> | undefined;
  const requests = useMemo(
    () => createAccountingSelectorRequests(capabilities),
    [capabilities],
  );
  const checkRequestHelpers = useCallback(async () => {
    const [books, organizations, currencies, periods, accounts, words, parents] =
      await Promise.all([
        requests.requestAccountingBookOptions(),
        requests.requestAccountingOrganizationOptions(),
        requests.requestAccountingCurrencyOptions(),
        requests.requestFiscalPeriodOptions('MAIN'),
        requests.requestAccountOptions({
          accountingBookCode: 'MAIN',
          keyWords: '1122',
        }),
        requests.requestVoucherWordOptions('MAIN'),
        requests.requestParentAccountOptions({
          accountingBookCode: 'MAIN',
          excludeCode: '1002',
        }),
      ]);
    setHelperResult(
      JSON.stringify({
        books: books.length,
        organizations: organizations.length,
        currencies: currencies.length,
        periods: periods.length,
        accounts: accounts.length,
        voucherWords: words.length,
        parentAccounts: parents.length,
        currentPreferredPeriod:
          selectPreferredFiscalPeriod(
            await capabilities.listFiscalPeriods({
              accountingBookCode: 'MAIN',
              pageSize: 100,
            }),
            getLocalBusinessDate(),
          )?.periodCode ?? null,
      }),
    );
  }, [capabilities, requests]);

  return (
    <BusinessUiProvider
      hasPermission={() => true}
      accountingSelectorCapabilities={capabilities}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <AccountingBookField autoDefault={autoDefault} disabled={disabled} />
        <FiscalPeriodField autoDefault={autoDefault} disabled={disabled} />
        <VoucherWordField autoDefault={autoDefault} disabled={disabled} />
        <AccountField disabled={disabled} />
      </Form>
      <Space wrap size={12}>
        <Button
          onClick={() =>
            form.setFieldsValue({
              accountingBookCode: undefined,
              fiscalPeriod: undefined,
              voucherWordCode: undefined,
              accountCode: undefined,
            })
          }
        >
          清空选择值
        </Button>
        <Button onClick={() => void checkRequestHelpers()}>
          验证候选请求 helper
        </Button>
        <Typography.Text type="secondary" role="status">
          当前表单值：{JSON.stringify(values ?? {})}
        </Typography.Text>
      </Space>
      <Typography.Text type="secondary" role="status">
        Helper 结果：{helperResult}
      </Typography.Text>
    </BusinessUiProvider>
  );
}

export function AccountingSelectorFieldsDemo() {
  const [autoDefault, setAutoDefault] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [emptyBooks, setEmptyBooks] = useState(false);
  const capabilities = useMemo(() => makeCapabilities(emptyBooks), [emptyBooks]);

  return (
    <SectionCard title="会计账簿与期间选择器">
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          账簿默认、会计期间与凭证字联动、科目搜索和空候选配置入口均按既有业务规则保留；列表请求与权限由宿主注入。
        </Typography.Paragraph>
        <Space wrap size={16}>
          <Space size={8}>
            <Typography.Text>自动默认</Typography.Text>
            <Switch checked={autoDefault} onChange={setAutoDefault} />
          </Space>
          <Space size={8}>
            <Typography.Text>禁用字段</Typography.Text>
            <Switch checked={disabled} onChange={setDisabled} />
          </Space>
          <Space size={8}>
            <Typography.Text>账簿无候选</Typography.Text>
            <Switch checked={emptyBooks} onChange={setEmptyBooks} />
          </Space>
        </Space>
        <AccountingSelectorDemoForm
          capabilities={capabilities}
          autoDefault={autoDefault}
          disabled={disabled}
          emptyBooks={emptyBooks}
        />
      </Space>
    </SectionCard>
  );
}
