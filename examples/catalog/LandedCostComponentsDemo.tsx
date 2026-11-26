import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Segmented, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  LandedCostDetailDrawer,
  LandedCostFormDrawer,
  LandedCostReceiptContextCard,
  MesUiProvider,
  type LandedCostAccountingSourceDocument,
  type LandedCostActionDocument,
  type LandedCostAllocationBasis,
  type LandedCostRecord,
  type LandedCostSelectRequest,
} from '../../src/business';

const statusEnum = {
  draft: { text: '草稿', status: 'Default' },
  submitted: { text: '已提交', status: 'Processing' },
  confirmed: { text: '已确认', status: 'Success' },
  reversed: { text: '已冲销', status: 'Warning' },
  cancelled: { text: '已取消', status: 'Error' },
};

const documentTypeEnum = {
  normal: { text: '正常单', status: 'Processing' },
  credit: { text: '红字冲销单', status: 'Warning' },
};

const allocationBasisEnum = {
  amount: { text: '按金额', status: 'Processing' },
  quantity: { text: '按数量', status: 'Success' },
  weight: { text: '按重量', status: 'Default' },
  manual: { text: '手工金额', status: 'Warning' },
};

const accountingSourceStatusEnum = {
  received: { text: '已接收', status: 'Default' },
  pending_account_rule: { text: '待配科目规则', status: 'Warning' },
  pending_amount: { text: '待补金额', status: 'Warning' },
  pending_tax_rule: { text: '待配税规则', status: 'Warning' },
  pending_exchange_rate: { text: '待补汇率', status: 'Warning' },
  pending_cost: { text: '待成本核算', status: 'Warning' },
  pending_period: { text: '待期间开启', status: 'Warning' },
  pending_template: { text: '待配模板', status: 'Warning' },
  voucher_draft: { text: '凭证草稿', status: 'Processing' },
  voucher_posted: { text: '已过账', status: 'Success' },
  posted: { text: '已入账', status: 'Success' },
  failed: { text: '失败', status: 'Error' },
  adjusted: { text: '已调整', status: 'Processing' },
  ignored: { text: '已忽略', status: 'Default' },
};

const demoActions = [
  {
    key: 'detail',
    label: '详情',
  },
  {
    key: 'edit',
    label: '编辑',
    permission: 'demo:landed-cost:update',
    requiredAvailableAction: 'update',
  },
  {
    key: 'submit',
    label: '提交',
    permission: 'demo:landed-cost:submit',
    requiredAvailableAction: 'submit',
  },
  {
    key: 'confirm',
    label: '确认',
    permission: 'demo:landed-cost:confirm',
    requiredAvailableAction: 'confirm',
  },
  {
    key: 'cancel',
    label: '取消',
    permission: 'demo:landed-cost:cancel',
    requiredAvailableAction: 'cancel',
    danger: true,
  },
  {
    key: 'reverse',
    label: '冲销',
    permission: 'demo:landed-cost:reverse',
    requiredAvailableAction: 'reverse',
    danger: true,
  },
] as const;

const initialLandedCost: LandedCostRecord = {
  id: 'landed-cost-1',
  availableActions: ['update', 'submit', 'confirm', 'cancel', 'reverse'],
  costNo: 'FC-2026-0018',
  documentType: 'normal',
  status: 'confirmed',
  expenseTypeId: 'expense-1',
  expenseType: {
    id: 'expense-1',
    code: 'LOG-001',
    name: '物流服务费',
    defaultAllocationBasis: 'amount',
    capitalizable: true,
  },
  expenseTypeNameSnapshot: '物流服务费',
  carrierId: 'supplier-1',
  carrier: { id: 'supplier-1', name: '华东物流有限公司' },
  carrierNameSnapshot: '华东物流有限公司',
  externalRefNo: 'WAYBILL-2026-0188',
  amount: 339,
  amountExcludingTax: 300,
  taxRate: 13,
  taxAmount: 39,
  currency: 'CNY',
  exchangeRate: 1,
  businessDate: '2026-11-20',
  allocationBasis: 'amount',
  financeInvoice: { invoiceNo: '应付-2026-0008' },
  confirmedAt: '2026-11-20T14:30:00+08:00',
  remark: '华东区域物流费',
  allocations: [
    {
      id: 'allocation-1',
      receiptItemId: 'receipt-item-1',
      receiptOrderId: 'receipt-1',
      receiptNoSnapshot: 'RK-2026-0382',
      batchNoSnapshot: 'BATCH-AL-91',
      receiptQuantitySnapshot: 24,
      allocationBase: 3000,
      allocatedAmount: 300,
      allocatedTaxAmount: 39,
      accountingSourceDocumentId: 'accounting-source-1',
      receiptItem: {
        material: {
          name: '6061 铝型材',
          code: 'MAT-AL-001',
          spec: '20 × 30 × 2 mm',
        },
      },
    },
  ],
};

const initialAccountingSource: LandedCostAccountingSourceDocument = {
  id: 'accounting-source-1',
  sourceNo: 'FC-2026-0018',
  status: 'failed',
  lastErrorMessage: '缺少当前账簿的物流费用科目映射',
};

function formatAmount(value: number | null | undefined): string {
  return value == null ? '-' : Number(value).toFixed(2);
}

function formatTaxRate(value: number | null | undefined): string {
  return value == null
    ? '-'
    : `${Number(value).toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}%`;
}

function readKeyword(params: Record<string, unknown>): string {
  for (const key of ['keyWords', 'keyword', 'search', 'searchText']) {
    const value = params[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function LandedCostComponentsDemo() {
  const [landedCost, setLandedCost] = useState(initialLandedCost);
  const [accountingSource, setAccountingSource] = useState(initialAccountingSource);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [canEdit, setCanEdit] = useState(true);
  const [canReadAccountingSource, setCanReadAccountingSource] = useState(true);
  const [emptyOptions, setEmptyOptions] = useState(false);
  const [lastAction, setLastAction] = useState('尚未触发操作');

  const requestExpenseTypeOptions = useMemo<LandedCostSelectRequest>(
    () => async (rawParams) => {
      const params = rawParams as Record<string, unknown>;
      if (emptyOptions) return [];
      const query = readKeyword(params).toLocaleLowerCase();
      return !query || '物流服务费 log-001'.includes(query)
        ? [{ value: 'expense-1', label: '物流服务费（LOG-001）' }]
        : [];
    },
    [emptyOptions],
  );
  const requestCarrierOptions = useMemo<LandedCostSelectRequest>(
    () => async (rawParams) => {
      const params = rawParams as Record<string, unknown>;
      if (emptyOptions) return [];
      const query = readKeyword(params).toLocaleLowerCase();
      return !query || '华东物流有限公司 SUP-001'.toLocaleLowerCase().includes(query)
        ? [{ value: 'supplier-1', label: '华东物流有限公司（SUP-001）' }]
        : [];
    },
    [emptyOptions],
  );
  const requestReceiptOptions = useMemo<LandedCostSelectRequest>(
    () => async (rawParams) => {
      const params = rawParams as Record<string, unknown>;
      if (emptyOptions) return [];
      const query = readKeyword(params).toLocaleLowerCase();
      return !query || 'rk-2026-0382 华东铝业'.toLocaleLowerCase().includes(query)
        ? [{ value: 'receipt-1', label: 'RK-2026-0382 / 华东铝业有限公司' }]
        : [];
    },
    [emptyOptions],
  );

  const landedCostActions = useMemo(
    () =>
      demoActions.map((action) => ({
        ...action,
        permission:
          action.key === 'detail'
            ? undefined
            : action.key === 'edit'
              ? 'demo:landed-cost:update'
              : `demo:landed-cost:${action.key}`,
      })),
    [],
  );
  const canPermission = useMemo(
    () => (permission: string) =>
      permission === 'demo:landed-cost:update' ? canEdit : true,
    [canEdit],
  );

  const detailCapabilities = useMemo(
    () => ({
      async loadDetail(_id: string) {
        await new Promise((resolve) => window.setTimeout(resolve, 120));
        return landedCost;
      },
      async loadAccountingSourceDetails(ids: readonly string[]) {
        await new Promise((resolve) => window.setTimeout(resolve, 120));
        return ids.includes(accountingSource.id) ? [accountingSource] : [];
      },
      async replayAccountingSource(id: string) {
        setAccountingSource((current) => ({ ...current, status: 'received', lastErrorMessage: undefined }));
        setLastAction(`已重放会计来源单 ${id}`);
      },
      canReadAccountingSource,
      canReplayAccountingSource: canReadAccountingSource,
      replayableAccountingSourceStatuses: new Set([
        'received',
        'failed',
        'pending_account_rule',
        'pending_amount',
        'pending_tax_rule',
        'pending_exchange_rate',
        'pending_cost',
        'pending_period',
        'pending_template',
      ]),
      statusEnum,
      documentTypeEnum,
      allocationBasisEnum,
      accountingSourceStatusEnum,
      actions: landedCostActions,
      notify(type: 'success' | 'warning', message: string) {
        setLastAction(`${type === 'success' ? '成功' : '提示'}：${message}`);
      },
      navigateAccountingSource(sourceId: string) {
        setLastAction(`宿主路由：/accounting/source-documents?sourceId=${sourceId}`);
      },
      formatAmount,
      formatTaxRate,
      formatDate: (value?: string | null) => value?.slice(0, 10) ?? '-',
      formatDateTime: (value?: string | null) => value?.replace('T', ' ').slice(0, 19) ?? '-',
    }),
    [accountingSource, canReadAccountingSource, landedCost, landedCostActions],
  );

  const formCapabilities = useMemo(
    () => ({
      async loadAllocationPolicy() {
        await new Promise((resolve) => window.setTimeout(resolve, 100));
        return {
          supportedAllocationBases: ['amount', 'quantity', 'manual'] as LandedCostAllocationBasis[],
          unavailableAllocationBases: [
            { basis: 'weight' as const, reason: '演示入库单没有重量基数' },
          ],
        };
      },
      async loadExpenseTypeDetail(id: string) {
        return {
          id,
          code: 'LOG-001',
          name: '物流服务费',
          defaultAllocationBasis: 'amount',
          capitalizable: true,
        };
      },
      async loadDetail(_id: string) {
        return landedCost;
      },
      async loadReceiptDetail(id: string) {
        return {
          id,
          receiptNo: 'RK-2026-0382',
          items: [
            {
              id: 'receipt-item-1',
              quantity: 24,
              amount: 3200,
              discountedAmount: 3000,
              batchNo: 'BATCH-AL-91',
              material: {
                name: '6061 铝型材',
                code: 'MAT-AL-001',
                spec: '20 × 30 × 2 mm',
              },
            },
            {
              id: 'receipt-item-2',
              quantity: 12,
              amount: 1800,
              discountedAmount: 1650,
              batchNo: 'BATCH-AL-92',
              material: {
                name: '6061 铝型材',
                code: 'MAT-AL-001',
                spec: '20 × 30 × 2 mm',
              },
            },
          ],
        };
      },
      requestExpenseTypeOptions,
      requestCarrierOptions,
      requestReceiptOptions,
      async create(payload: unknown) {
        setLastAction(`已模拟新建分摊单：${JSON.stringify(payload)}`);
      },
      async update(payload: unknown) {
        setLastAction(`已模拟更新分摊单：${JSON.stringify(payload)}`);
      },
      allocationBasisEnum,
      renderConfigEntryFieldLabel({
        target,
        label,
        show,
        onOpen,
      }: {
        target: string;
        label: ReactNode;
        show: boolean;
        onOpen: () => void;
      }) {
        return (
          <Space size={4}>
            {label}
            {show ? (
              <Button
                type="link"
                size="small"
                onClick={() => {
                  onOpen();
                  setLastAction(`打开 ${target} 配置`);
                }}
              >
                配置
              </Button>
            ) : null}
          </Space>
        );
      },
      notify(type: 'success' | 'warning', message: string) {
        setLastAction(`${type === 'success' ? '成功' : '提示'}：${message}`);
      },
    }),
    [
      landedCost,
      requestCarrierOptions,
      requestExpenseTypeOptions,
      requestReceiptOptions,
    ],
  );

  const receiptContextCapabilities = useMemo(
    () => ({
      async listByReceipt(receiptOrderId: string) {
        await new Promise((resolve) => window.setTimeout(resolve, 100));
        return receiptOrderId === 'receipt-1' ? [landedCost] : [];
      },
      async loadAccountingSourceDetails(ids: readonly string[]) {
        return ids.includes(accountingSource.id) ? [accountingSource] : [];
      },
      async replayAccountingSource(id: string) {
        setAccountingSource((current) => ({ ...current, status: 'received', lastErrorMessage: undefined }));
        setLastAction(`已重放会计来源单 ${id}`);
      },
      canReadAccountingSource,
      canReplayAccountingSource: canReadAccountingSource,
      replayableAccountingSourceStatuses: new Set([
        'received',
        'failed',
        'pending_account_rule',
        'pending_amount',
        'pending_tax_rule',
        'pending_exchange_rate',
        'pending_cost',
        'pending_period',
        'pending_template',
      ]),
      landedCostStatusEnum: statusEnum,
      accountingSourceStatusEnum,
      notify(type: 'success' | 'warning', message: string) {
        setLastAction(`${type === 'success' ? '成功' : '提示'}：${message}`);
      },
      formatAmount,
      formatDate: (value?: string | null) => value?.slice(0, 10) ?? '-',
    }),
    [accountingSource, canReadAccountingSource, landedCost],
  );

  const handleAction = (
    key: string,
    document: LandedCostActionDocument,
  ) => {
    if (key === 'edit') {
      setEditingId(document.id);
      setFormOpen(true);
      return;
    }
    setLastAction(`已触发宿主动作：${key} ${document.costNo}`);
  };

  return (
    <SectionCard title="采购附加费用分摊">
      <Typography.Paragraph type="secondary">
        新建/编辑分摊单按服务端策略预览成本分摊；详情和采购入库上下文展示冻结分摊结果及会计来源状态。数据、权限、选项、配置导航、格式和反馈由宿主注入。
      </Typography.Paragraph>
      <Space wrap style={{ marginBottom: 12 }}>
        <Button
          type="primary"
          onClick={() => {
            setEditingId(undefined);
            setFormOpen(true);
          }}
        >
          新增分摊单
        </Button>
        <Button onClick={() => setDetailOpen(true)}>打开分摊单详情</Button>
        <Button onClick={() => setCanEdit((value) => !value)}>
          {canEdit ? '关闭编辑动作权限' : '开启编辑动作权限'}
        </Button>
        <Button onClick={() => setCanReadAccountingSource((value) => !value)}>
          {canReadAccountingSource ? '隐藏会计来源权限' : '显示会计来源权限'}
        </Button>
        <Button onClick={() => setEmptyOptions((value) => !value)}>
          {emptyOptions ? '恢复候选项' : '模拟空候选配置入口'}
        </Button>
      </Space>
      <MesUiProvider hasPermission={canPermission}>
        <LandedCostReceiptContextCard
          receiptOrderId="receipt-1"
          onOpenLandedCost={() => setDetailOpen(true)}
          capabilities={receiptContextCapabilities}
        />
        <LandedCostFormDrawer
          open={formOpen}
          landedCostId={editingId}
          initialReceiptOrderId={editingId ? undefined : 'receipt-1'}
          onOpenChange={setFormOpen}
          onSuccess={() => {
            setLastAction('分摊单已保存，宿主已刷新');
          }}
          capabilities={formCapabilities}
        />
        <LandedCostDetailDrawer
          open={detailOpen}
          landedCostId={landedCost.id}
          onOpenChange={setDetailOpen}
          onAction={handleAction}
          capabilities={detailCapabilities}
        />
      </MesUiProvider>
      <Space style={{ marginTop: 12 }}>
        <Segmented
          aria-label="会计来源状态演示"
          value={accountingSource.status}
          options={[
            { label: '待处理失败', value: 'failed' },
            { label: '已接收', value: 'received' },
          ]}
          onChange={(value) =>
            setAccountingSource((current) => ({
              ...current,
              status: String(value),
              lastErrorMessage: value === 'failed' ? '缺少科目映射' : undefined,
            }))
          }
        />
        <Typography.Text type="secondary" aria-live="polite">
          {lastAction}
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}
