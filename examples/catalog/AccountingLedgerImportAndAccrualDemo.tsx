import { Alert, App, Button, Space, Typography } from 'antd';
import { useState, type Key } from 'react';
import { SectionCard } from '../../src/components/SectionCard';
import { MesUiProvider } from '../../src/business/MesUiProvider';
import type { MesAccountingSelectorCapabilities } from '../../src/business/components/accounting-selector-types';
import {
  AccountImportModal,
  OpeningBalanceImportModal,
} from '../../src/business/components/AccountingImportComponents';
import {
  LedgerQueryContext,
  NarrativeSummaryTable,
  TrialBalanceButton,
} from '../../src/business/components/AccountingLedgerComponents';
import {
  PurchaseAccrualDetailDrawer,
  PurchaseAccrualPreviewDrawer,
} from '../../src/business/components/PurchaseAccrualComponents';
import type { StatusMap } from '../../src/components/StatusDisplay';
import type {
  AccountingAccountBalanceRow,
  AccountingNarrativeSummaryRow,
  AccountingTrialBalanceResult,
  LedgerRouteFilters,
} from '../../src/business/components/accounting-ledger-components-types';
import type { OpeningBalanceImportDetail } from '../../src/business/components/accounting-import-components-types';
import type {
  PurchaseAccrualDetail,
  PurchaseAccrualPreview,
} from '../../src/business/components/purchase-accrual-components-types';

const accountingSelectorCapabilities: MesAccountingSelectorCapabilities = {
  listAccountingBooks: async () => [
    { code: 'MAIN', name: '本位账簿', isPrimary: true },
  ],
  listAccountingOrganizations: async () => [
    { code: 'HQ', name: '总部核算组织' },
  ],
  listAccountingCurrencies: async () => [
    { code: 'CNY', name: '人民币' },
    { code: 'USD', name: '美元' },
  ],
  listFiscalPeriods: async () => [
    {
      periodCode: '2026-11',
      status: 'open',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
    },
  ],
  listVoucherWords: async () => [
    { code: '记', name: '记账凭证', createdAt: '2026-01-01' },
  ],
  listAccounts: async () => [
    { code: '6601', name: '销售费用' },
    { code: '6602', name: '管理费用' },
  ],
};

const accrualStatusEnum: StatusMap = {
  confirmed: { text: '已确认', status: 'Success' },
  reversed: { text: '已冲销', status: 'Error' },
};

const accrualLineStatusEnum: StatusMap = {
  open: { text: '未清算', status: 'Processing' },
  partial_cleared: { text: '部分清算', status: 'Warning' },
  cleared: { text: '已清算', status: 'Success' },
  reversed: { text: '已冲销', status: 'Error' },
};

const narrativeRows: AccountingNarrativeSummaryRow[] = [
  {
    accountingBookCode: 'MAIN',
    fiscalPeriod: '2026-11',
    summary: '原材料运输费',
    accountCode: '6601',
    accountName: '销售费用',
    currency: 'CNY',
    direction: '借',
    debitTotal: 1280,
    creditTotal: 0,
    netAmount: 1280,
  },
  {
    accountingBookCode: 'MAIN',
    fiscalPeriod: '2026-11',
    summary: '客户退货运费',
    accountCode: '6602',
    accountName: '管理费用',
    currency: 'CNY',
    direction: '借',
    debitTotal: 360,
    creditTotal: 0,
    netAmount: 360,
  },
];

const purchaseAccrualPreview: PurchaseAccrualPreview = {
  accountingBookCode: 'MAIN',
  fiscalPeriod: '2026-11',
  cutoffDate: '2026-11-30',
  result: {
    totalAccrualAmount: 2150,
    eligibleLineCount: 1,
    issueLineCount: 1,
    lines: [
      {
        sourceDocumentId: 'receipt-001',
        sourceDocumentNo: 'RK-2026-0018',
        sourceLineId: 'receipt-line-001',
        materialName: '6061 铝型材',
        materialCode: 'RM-AL-0061',
        supplierName: '示例供应商',
        receiptDate: '2026-11-18',
        receiptQuantity: 50,
        returnedQuantity: 0,
        invoicedQuantity: 10,
        existingAccrualQuantity: 0,
        accrualQuantity: 40,
        accrualAmount: 2150,
      },
      {
        sourceDocumentId: 'receipt-002',
        sourceDocumentNo: 'RK-2026-0021',
        sourceLineId: 'receipt-line-002',
        materialName: '不锈钢紧固件',
        materialCode: 'HW-SS-0012',
        supplierName: '示例五金厂',
        receiptDate: '2026-11-20',
        receiptQuantity: 200,
        returnedQuantity: 0,
        invoicedQuantity: 0,
        existingAccrualQuantity: 0,
        accrualQuantity: 200,
        accrualAmount: 0,
        issue: '缺少可靠估值依据',
      },
    ],
  },
};

const initialPurchaseAccrualDetail: PurchaseAccrualDetail = {
  run: {
    id: 'accrual-run-001',
    runNo: 'ZGS-2026-11-0001',
    status: 'confirmed',
    accountingBookCode: 'MAIN',
    fiscalPeriod: '2026-11',
    cutoffDate: '2026-11-30',
    totalAccrualAmount: 2150,
    lineCount: 1,
  },
  lines: [
    {
      id: 'accrual-run-line-001',
      sourceDocumentId: 'receipt-001',
      sourceDocumentNo: 'RK-2026-0018',
      materialName: '6061 铝型材',
      materialCode: 'RM-AL-0061',
      supplierName: '示例供应商',
      accrualQuantity: 40,
      accrualAmount: 2150,
      clearedQuantity: 10,
      clearedAmount: 537.5,
      remainingQuantity: 30,
      remainingAmount: 1612.5,
      status: 'partial_cleared',
    },
  ],
};

function DemoBody() {
  const { message } = App.useApp();
  const [filters, setFilters] = useState<LedgerRouteFilters>({
    accountingBookCode: 'MAIN',
    fiscalPeriod: '2026-11',
    accountCode: '6601',
    currency: 'CNY',
    summaryKeyword: '运输费',
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [detail, setDetail] = useState<PurchaseAccrualDetail>();
  const [selectedLineIds, setSelectedLineIds] = useState<Key[]>([
    'receipt-line-001',
  ]);
  const [openingBalanceBatch, setOpeningBalanceBatch] =
    useState<OpeningBalanceImportDetail>();

  const trialBalance: AccountingTrialBalanceResult = {
    accountingBookCode: 'MAIN',
    fiscalPeriod: '2026-11',
    debitTotal: 125000,
    creditTotal: 125000,
    balanced: true,
    rows: [
      {
        id: 'trial-row-001',
        accountCode: '1002',
        accountName: '银行存款',
        debitAmount: 80000,
        creditAmount: 0,
      },
      {
        id: 'trial-row-002',
        accountCode: '2202',
        accountName: '应付账款',
        debitAmount: 0,
        creditAmount: 125000,
      },
      {
        id: 'trial-row-003',
        accountCode: '6601',
        accountName: '销售费用',
        debitAmount: 45000,
        creditAmount: 0,
      },
    ] satisfies AccountingAccountBalanceRow[],
  };

  return (
    <>
      <SectionCard title="会计导入与账簿核对">
        <Space wrap>
          <AccountImportModal
            onDone={() => message.success('会计科目目录已刷新')}
            capabilities={{
              canManage: true,
              downloadTemplate: async () => undefined,
              importAccounts: async () => ({
                total: 3,
                imported: 0,
                rows: [
                  {
                    rowNo: 4,
                    code: '6601.01',
                    accountingBookCode: 'MAIN',
                    status: 'error',
                    message: '父级科目不存在',
                  },
                  {
                    rowNo: 7,
                    code: '2202.05',
                    accountingBookCode: 'MAIN',
                    status: 'error',
                    message: '科目编码重复',
                  },
                ],
              }),
              notifyError: (text) => message.error(text),
              notifySuccess: (text) => message.success(text),
            }}
          />
          <OpeningBalanceImportModal
            onImported={(imported) => {
              setOpeningBalanceBatch(imported);
              message.success(`已生成预检批次 ${imported.batch.batchNo}`);
            }}
            capabilities={{
              canManage: true,
              downloadTemplate: async () => undefined,
              importOpeningBalances: async (params) => ({
                batch: {
                  id: 'opening-batch-001',
                  createdAt: '2026-11-21T02:00:00.000Z',
                  updatedAt: '2026-11-21T02:00:00.000Z',
                  companyId: 'demo-company',
                  batchNo: 'QC-2026-001',
                  accountingBookCode: params.accountingBookCode,
                  fiscalPeriod: '2026-11',
                  openingDate: params.openingDate,
                  status: 'validated',
                  debitTotal: 125000,
                  creditTotal: 125000,
                  rowCount: 2,
                  errorCount: 0,
                },
                lines: [],
              }),
              notifyWarning: (text) => message.warning(text),
              notifyError: (text) => message.error(text),
              notifySuccess: (text) => message.success(text),
            }}
          />
          <TrialBalanceButton
            capabilities={{
              requestTrialBalance: async () => trialBalance,
              notifyWarning: (text) => message.warning(text),
            }}
          />
        </Space>
        {openingBalanceBatch ? (
          <Alert
            style={{ marginTop: 12 }}
            type="success"
            showIcon
            message={`预检批次 ${openingBalanceBatch.batch.batchNo}：借贷平衡，可进入确认流程`}
          />
        ) : null}
      </SectionCard>

      <SectionCard title="总账摘要范围">
        <LedgerQueryContext
          filters={filters}
          view="entries"
          onNavigate={(_view, nextFilters) => setFilters(nextFilters)}
        />
        <NarrativeSummaryTable
          filters={filters}
          onViewEntries={(row) =>
            setFilters({
              accountingBookCode: row.accountingBookCode,
              fiscalPeriod: row.fiscalPeriod,
              accountCode: row.accountCode,
              currency: row.currency,
              summaryKeyword: row.summary,
            })
          }
          onQueryChange={setFilters}
          pagination={{ defaultPageSize: 20, showSizeChanger: true }}
          capabilities={{
            requestRows: async (params) => {
              const matchingRows = narrativeRows.filter((row) =>
                params.summaryKeyword
                  ? row.summary.includes(params.summaryKeyword)
                  : true,
              );
              const offset = (params.page - 1) * params.pageSize;
              return {
                list: matchingRows.slice(offset, offset + params.pageSize),
                total: matchingRows.length,
              };
            },
          }}
        />
      </SectionCard>

      <SectionCard title="采购暂估">
        <Space wrap>
          <Button onClick={() => setPreviewOpen(true)}>打开暂估预览</Button>
          <Button onClick={() => setDetail(initialPurchaseAccrualDetail)}>
            查看暂估批次
          </Button>
        </Space>
      </SectionCard>

      <PurchaseAccrualPreviewDrawer
        preview={previewOpen ? purchaseAccrualPreview : undefined}
        selectedLineIds={selectedLineIds}
        confirming={false}
        canViewPurchaseReceipt
        onSelectedLineIdsChange={setSelectedLineIds}
        onOpenPurchaseReceipt={(id) => message.info(`打开采购入库单 ${id}`)}
        onClose={() => setPreviewOpen(false)}
        onConfirm={async () => {
          message.success('已生成采购暂估凭证草稿');
          setPreviewOpen(false);
        }}
      />
      <PurchaseAccrualDetailDrawer
        detail={detail}
        onClose={() => setDetail(undefined)}
        onReversed={(reversed) => setDetail(reversed)}
        capabilities={{
          canReverse: true,
          canViewPurchaseReceipt: true,
          statusEnum: accrualStatusEnum,
          lineStatusEnum: accrualLineStatusEnum,
          reverseRun: async () => ({
            ...initialPurchaseAccrualDetail,
            run: { ...initialPurchaseAccrualDetail.run, status: 'reversed' },
          }),
          onOpenPurchaseReceipt: (id) => message.info(`打开采购入库单 ${id}`),
          notifySuccess: (text) => message.success(text),
        }}
      />
    </>
  );
}

/**
 * Catalog example for accounting imports, ledger summaries, trial balance, and
 * purchase-accrual review with deterministic host adapters.
 */
export function AccountingLedgerImportAndAccrualDemo() {
  return (
    <App>
      <MesUiProvider
        hasPermission={() => true}
        accountingSelectorCapabilities={accountingSelectorCapabilities}
      >
        <Typography.Paragraph type="secondary">
          示例数据仅用于交互演示；真实权限、请求、文件下载与导航由宿主注入。
        </Typography.Paragraph>
        <DemoBody />
      </MesUiProvider>
    </App>
  );
}
