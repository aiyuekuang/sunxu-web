import { useMemo, useRef, useState } from 'react';
import {
  ProFormText,
  type ProFormSelectProps,
} from '@ant-design/pro-components';
import { App, Button, Space, Switch, Typography } from 'antd';
import type { ActionType } from '@ant-design/pro-components';
import {
  ClosingWipModal,
  OpeningWipModal,
} from '../../src/business/components/ProductCostWipModals';
import {
  InventoryOpeningBalancePanel,
  InventoryResultTable,
  InventoryStockSummaryTable,
} from '../../src/business/components/AccountingInventoryComponents';
import { ProductCostCollectionsPanel } from '../../src/business/components/ProductCostCollectionsPanel';
import type {
  InventoryCostResultRecord,
  InventoryOpeningBalanceRecord,
  InventoryPeriodQuery,
  InventoryResultFilter,
  InventoryStockSummaryRow,
} from '../../src/business/components/accounting-inventory-components-types';
import type {
  ProductCostExpenseCollectionRecord,
  ProductCostExpenseDraftRecord,
} from '../../src/business/components/product-cost-collection-types';
import type {
  ProductCostClosingWipRecord,
  ProductCostOpeningWipRecord,
} from '../../src/business/components/product-cost-wip-types';
import { PRODUCT_COST_ALLOCATION_BASIS_OPTIONS } from '../../src/business/components/accounting-options';
import type { StatusMap } from '../../src/components/StatusDisplay';

const period: InventoryPeriodQuery = {
  accountingBookCode: 'MAIN-CN',
  fiscalPeriod: '2026-10',
};

const materialOptions = [
  { label: 'AL-BR-018｜精密铝合金支架', value: 'material-001' },
  { label: 'CU-PL-002｜铜连接片', value: 'material-002' },
];

const warehouseOptions = [
  { label: 'WH-A｜原料仓', value: 'warehouse-001' },
  { label: 'WH-B｜成品仓', value: 'warehouse-002' },
];

const workOrderOptions = [
  { label: 'WO-2026-1088｜精密铝合金支架', value: 'work-order-001' },
  { label: 'WO-2026-1092｜铜连接片', value: 'work-order-002' },
];

const statusEnum: StatusMap = {
  calculated: { text: '已核算', status: 'Success' },
  pending_cost: { text: '待成本', status: 'Warning' },
  draft: { text: '草稿', status: 'Default' },
  confirmed: { text: '已确认', status: 'Success' },
  cancelled: { text: '已作废', status: 'Error' },
};

const openingSeed: InventoryOpeningBalanceRecord[] = [
  {
    id: 'opening-001',
    materialId: 'material-001',
    materialCode: 'AL-BR-018',
    materialName: '精密铝合金支架',
    warehouseId: 'warehouse-001',
    warehouseCode: 'WH-A',
    openingQuantity: 24,
    openingAmount: 16800,
    openingUnitCost: 700,
  },
];

const inventoryResultRows: InventoryCostResultRecord[] = [
  {
    id: 'result-001',
    materialCode: 'AL-BR-018',
    materialName: '精密铝合金支架',
    sourceType: 'purchase_receipt',
    sourceNo: 'PR-2026-0218',
    warehouseCode: 'WH-A',
    costDirection: 'receipt',
    quantity: 12,
    unitCost: 700,
    totalCost: 8400,
    status: 'calculated',
    voucherId: 'voucher-001',
    voucherNo: 'PV-2026-1018',
  },
  {
    id: 'result-002',
    materialCode: 'CU-PL-002',
    materialName: '铜连接片',
    sourceType: 'production_receipt',
    sourceNo: 'PRD-R-2026-0904',
    warehouseCode: 'WH-B',
    costDirection: 'receipt',
    quantity: 40,
    unitCost: 26.5,
    totalCost: 1060,
    status: 'pending_cost',
    lastErrorMessage: '来源生产报工尚未完成成本归集',
  },
];

const stockSummaryRows: InventoryStockSummaryRow[] = [
  {
    materialCode: 'AL-BR-018',
    materialName: '精密铝合金支架',
    warehouseCode: 'WH-A',
    openingQty: 24,
    openingAmount: 16800,
    receiptQty: 12,
    receiptAmount: 8400,
    issueQty: 8,
    issueAmount: 5600,
    endingQty: 28,
    endingAmount: 19600,
  },
];

const expenseDraftSeed: ProductCostExpenseDraftRecord[] = [
  {
    id: 'expense-draft-001',
    sourceObjectType: 'production_report',
    sourceObjectId: 'report-001',
    sourceObjectLabel: '生产报工 PR-2026-0904',
    expenseTypeCode: 'MFG-OVERHEAD',
    expenseTypeName: '制造费用',
    allocationBasis: 'output_quantity',
    amount: 3600,
    amountExcludingTax: 3600,
    lastResolvedAt: '2026-11-18T09:30:00+08:00',
  },
];

const collectionSeed: ProductCostExpenseCollectionRecord[] = [
  {
    id: 'collection-001',
    collectionNo: 'EC-2026-1018',
    accountingBookCode: period.accountingBookCode,
    fiscalPeriod: period.fiscalPeriod,
    businessDate: '2026-10-18',
    expenseTypeCode: 'MFG-OVERHEAD',
    expenseTypeName: '制造费用',
    allocationBasis: 'output_quantity',
    amount: 3600,
    status: 'draft',
    sourceLabel: '生产报工 PR-2026-0904',
  },
];

const openingWipRecord: ProductCostOpeningWipRecord = {
  id: 'opening-wip-001',
  accountingBookCode: period.accountingBookCode,
  fiscalPeriod: period.fiscalPeriod,
  workOrderId: 'work-order-001',
  workOrderNo: 'WO-2026-1088',
  materialName: '精密铝合金支架',
  materialCode: 'AL-BR-018',
  openingQuantity: 12,
  openingMaterialCost: 8400,
  openingLaborCost: 1500,
  openingOverheadCost: 900,
};

const closingWipRecord: ProductCostClosingWipRecord = {
  id: 'closing-wip-001',
  accountingBookCode: period.accountingBookCode,
  fiscalPeriod: period.fiscalPeriod,
  workOrderId: 'work-order-001',
  workOrderNo: 'WO-2026-1088',
  materialName: '精密铝合金支架',
  materialCode: 'AL-BR-018',
  wipQuantity: 7,
  completionRatePercent: 65,
  materialCompletionRatePercent: 80,
  laborCompletionRatePercent: 55,
  overheadCompletionRatePercent: 55,
};

function toPage<T>(rows: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return { list: rows.slice(start, start + pageSize), total: rows.length };
}

function normalizeDate(value: unknown): string | undefined {
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object' && value !== null && 'format' in value) {
    const format = value.format;
    if (typeof format === 'function') return format('YYYY-MM-DD');
  }
  return undefined;
}

const requestMaterials: NonNullable<ProFormSelectProps['request']> = async (
  params,
) => {
  const keyword = params.keyWords?.toLowerCase() ?? '';
  return materialOptions.filter((option) => option.label.toLowerCase().includes(keyword));
};

const requestWarehouses: NonNullable<ProFormSelectProps['request']> = async (
  params,
) => {
  const keyword = params.keyWords?.toLowerCase() ?? '';
  return warehouseOptions.filter((option) => option.label.toLowerCase().includes(keyword));
};

const requestWorkOrders: NonNullable<ProFormSelectProps['request']> = async (
  params,
) => {
  const keyword = params.keyWords?.toLowerCase() ?? '';
  return workOrderOptions.filter((option) => option.label.toLowerCase().includes(keyword));
};

function renderAccountingField({ name, label, required }: {
  name: 'accountingBookCode' | 'fiscalPeriod';
  label: '账簿编码' | '会计期间';
  disabled: true;
  required: true;
  width: 'md';
}) {
  return (
    <ProFormText
      name={name}
      label={label}
      disabled
      rules={required ? [{ required: true }] : undefined}
    />
  );
}

export function AccountingInventoryProductCostDemo() {
  const { message } = App.useApp();
  const inventoryActionRef = useRef<ActionType | null>(null);
  const [canManage, setCanManage] = useState(true);
  const [canViewVoucher, setCanViewVoucher] = useState(true);
  const [filter, setFilter] = useState<InventoryResultFilter>('all');
  const [openingBalances, setOpeningBalances] = useState(openingSeed);
  const [expenseDrafts, setExpenseDrafts] = useState(expenseDraftSeed);
  const [collections, setCollections] = useState(collectionSeed);
  const [openingModalOpen, setOpeningModalOpen] = useState(false);
  const [closingModalOpen, setClosingModalOpen] = useState(false);
  const [openingEditingRecord, setOpeningEditingRecord] =
    useState<ProductCostOpeningWipRecord | null>(null);
  const [closingEditingRecord, setClosingEditingRecord] =
    useState<ProductCostClosingWipRecord | null>(null);
  const [lastAction, setLastAction] = useState('尚未执行会计组件操作');

  const inventoryCapabilities = useMemo(
    () => ({
      listOpeningBalances: async () => openingBalances,
      removeOpeningBalance: async (id: string) => {
        setOpeningBalances((rows) => rows.filter((row) => row.id !== id));
      },
      saveOpeningBalance: async (values: {
        accountingBookCode: string;
        fiscalPeriod: string;
        materialId: string;
        warehouseId: string;
        openingQuantity: number;
        openingAmount: number;
      }) => {
        setOpeningBalances((rows) => {
          const existing = rows.find(
            (row) =>
              row.materialId === values.materialId &&
              row.warehouseId === values.warehouseId,
          );
          const material = materialOptions.find((option) => option.value === values.materialId);
          const warehouse = warehouseOptions.find((option) => option.value === values.warehouseId);
          const next: InventoryOpeningBalanceRecord = {
            id: existing?.id ?? `opening-${rows.length + 1}`,
            materialId: values.materialId,
            materialCode: material?.label.split('｜')[0],
            materialName: material?.label.split('｜')[1],
            warehouseId: values.warehouseId,
            warehouseCode: warehouse?.label.split('｜')[0],
            openingQuantity: values.openingQuantity,
            openingAmount: values.openingAmount,
            openingUnitCost: values.openingQuantity
              ? values.openingAmount / values.openingQuantity
              : 0,
          };
          return existing
            ? rows.map((row) => (row.id === existing.id ? next : row))
            : [...rows, next];
        });
      },
      requestMaterialOptions: requestMaterials,
      requestWarehouseOptions: requestWarehouses,
      renderCreateButton: ({ onClick }: { onClick: () => void }) => (
        <Button type="primary" onClick={onClick}>
          新增
        </Button>
      ),
      notifySuccess: (text: string) => message.success(text),
      formatMoney: (value: number) =>
        `¥${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      requestCostResults: async (params: {
        page: number;
        pageSize: number;
        direction?: 'receipt' | 'issue';
        status?: 'pending_cost';
      }) => {
        const rows = inventoryResultRows.filter((row) => {
          if (params.direction && row.costDirection !== params.direction) return false;
          if (params.status && row.status !== params.status) return false;
          return true;
        });
        return toPage(rows, params.page, params.pageSize);
      },
      sourceTypeEnum: {
        purchase_receipt: { text: '采购收货' },
        production_receipt: { text: '生产入库' },
      },
      directionEnum: {
        receipt: { text: '入库' },
        issue: { text: '出库' },
      },
      statusEnum,
      pagination: { defaultPageSize: 20, showSizeChanger: true },
      defaultPageSize: 20,
      navigateToVoucher: (voucherId: string) => {
        setLastAction(`已打开凭证 ${voucherId}`);
      },
      listStockSummary: async () => stockSummaryRows,
    }),
    [openingBalances, message],
  );

  const productCostCapabilities = useMemo(
    () => ({
      requestWorkOrderOptions: requestWorkOrders,
      renderAccountingBookField: renderAccountingField,
      renderFiscalPeriodField: renderAccountingField,
      createExpenseCollection: async (values: {
        businessDate: string;
        expenseTypeCode: string;
        allocationBasis?: 'output_quantity' | 'actual_labor_hours' | 'direct_material_amount' | 'manual';
        amount: number;
        sourceLabel?: string;
        remark?: string;
        accountingBookCode: string;
        fiscalPeriod: string;
        manualAllocations?: Array<{ workOrderId: string; allocatedAmount: number }>;
      }) => {
        const expenseType = [{ code: 'MFG-OVERHEAD', name: '制造费用' }].find(
          (item) => item.code === values.expenseTypeCode,
        );
        const row: ProductCostExpenseCollectionRecord = {
          id: `collection-${collections.length + 1}`,
          collectionNo: `EC-2026-${String(collections.length + 1018).padStart(4, '0')}`,
          accountingBookCode: values.accountingBookCode,
          fiscalPeriod: values.fiscalPeriod,
          businessDate: values.businessDate,
          expenseTypeCode: values.expenseTypeCode,
          expenseTypeName: expenseType?.name ?? values.expenseTypeCode,
          allocationBasis: values.allocationBasis ?? 'output_quantity',
          amount: values.amount,
          status: 'draft',
          sourceLabel: values.sourceLabel,
          remark: values.remark,
        };
        setCollections((rows) => [...rows, row]);
        setLastAction(`已新增费用归集单 ${row.collectionNo}`);
      },
      allocateExpenseCollection: async ({ id, businessDate, allocationBasis }: {
        id: string;
        businessDate: string;
        allocationBasis?: 'output_quantity' | 'actual_labor_hours' | 'direct_material_amount' | 'manual';
      }) => {
        setCollections((rows) => rows.map((row) =>
          row.id === id
            ? { ...row, businessDate, allocationBasis: allocationBasis ?? row.allocationBasis }
            : row,
        ));
      },
      normalizeDateOnlyValue: normalizeDate,
      notifySuccess: (text: string) => message.success(text),
      notifyError: (text: string) => message.error(text),
      requestExpenseDrafts: async ({ page, pageSize }: { page: number; pageSize: number }) =>
        toPage(expenseDrafts, page, pageSize),
      requestExpenseCollections: async ({ page, pageSize }: { page: number; pageSize: number }) =>
        toPage(collections, page, pageSize),
      requestExpenseCollectionDetail: async (id: string) => {
        const collection = collections.find((row) => row.id === id);
        if (!collection) throw new Error('未找到费用归集单');
        return {
          collection,
          manualAllocations: [{ workOrderId: 'work-order-001', allocatedAmount: collection.amount }],
        };
      },
      collectExpenseDrafts: async ({ draftIds }: { draftIds: string[] }) => {
        setExpenseDrafts((rows) => rows.filter((row) => !draftIds.includes(row.id)));
        setLastAction(`已下推 ${draftIds.length} 条生产费用草稿`);
      },
      confirmExpenseCollection: async (id: string) => {
        setCollections((rows) => rows.map((row) => row.id === id ? { ...row, status: 'confirmed' } : row));
      },
      cancelExpenseCollection: async (id: string) => {
        setCollections((rows) => rows.map((row) => row.id === id ? { ...row, status: 'cancelled' } : row));
      },
      formatMoney: (value: number) =>
        `¥${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      statusEnum,
      pagination: { defaultPageSize: 20, showSizeChanger: true },
      defaultPageSize: 20,
      allocationBasisOptions: PRODUCT_COST_ALLOCATION_BASIS_OPTIONS,
    }),
    [collections, expenseDrafts, message],
  );

  const wipCapabilities = useMemo(
    () => ({
      requestWorkOrderOptions: requestWorkOrders,
      renderAccountingBookField: renderAccountingField,
      renderFiscalPeriodField: renderAccountingField,
      saveOpeningWip: async () => setLastAction('已保存期初在产品'),
      saveClosingWip: async () => setLastAction('已保存月末在产品'),
      notifySuccess: (text: string) => message.success(text),
    }),
    [message],
  );

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <Space align="center" wrap>
        <Typography.Text>授权管理操作</Typography.Text>
        <Switch checked={canManage} onChange={setCanManage} />
        <Typography.Text>查看凭证</Typography.Text>
        <Switch checked={canViewVoucher} onChange={setCanViewVoucher} />
      </Space>

      <section>
        <Typography.Title level={4}>存货核算</Typography.Title>
        <Typography.Paragraph type="secondary">
          期初余额维护、按入库/出库/待成本筛选核算结果，以及本期收发存汇总。
        </Typography.Paragraph>
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <InventoryOpeningBalancePanel
            query={period}
            canManage={canManage}
            onChanged={async () => setLastAction('期初余额已刷新')}
            capabilities={inventoryCapabilities}
          />
          <InventoryResultTable
            actionRef={inventoryActionRef}
            query={period}
            canViewVoucher={canViewVoucher}
            filter={filter}
            onFilterChange={setFilter}
            overview={{ pendingCostCount: 1 }}
            capabilities={inventoryCapabilities}
          />
          <InventoryStockSummaryTable
            query={period}
            capabilities={inventoryCapabilities}
          />
        </Space>
      </section>

      <section>
        <Typography.Title level={4}>产品成本在产品与费用归集</Typography.Title>
        <Space wrap style={{ marginBottom: 12 }}>
          <Button
            onClick={() => {
              setOpeningEditingRecord(null);
              setOpeningModalOpen(true);
            }}
          >
            新增期初在产品
          </Button>
          <Button
            onClick={() => {
              setClosingEditingRecord(null);
              setClosingModalOpen(true);
            }}
          >
            新增月末在产品
          </Button>
        </Space>
        <ProductCostCollectionsPanel
          query={period}
          expenseTypes={[{ code: 'MFG-OVERHEAD', name: '制造费用' }]}
          canManage={canManage}
          canMaintainInput={canManage}
          onRefresh={async () => setLastAction('产品成本费用归集已刷新')}
          capabilities={productCostCapabilities}
        />
        <OpeningWipModal
          query={period}
          editingRecord={openingEditingRecord}
          open={openingModalOpen}
          onOpenChange={(open) => {
            setOpeningModalOpen(open);
            if (!open) setOpeningEditingRecord(null);
          }}
          onSuccess={async () => setLastAction('期初在产品已刷新')}
          capabilities={wipCapabilities}
        />
        <ClosingWipModal
          query={period}
          editingRecord={closingEditingRecord}
          open={closingModalOpen}
          onOpenChange={(open) => {
            setClosingModalOpen(open);
            if (!open) setClosingEditingRecord(null);
          }}
          onSuccess={async () => setLastAction('月末在产品已刷新')}
          capabilities={wipCapabilities}
        />
        <Space style={{ marginTop: 12 }}>
          <Button
            onClick={() => {
              setOpeningEditingRecord(openingWipRecord);
              setOpeningModalOpen(true);
            }}
          >
            编辑期初样例
          </Button>
          <Button
            onClick={() => {
              setClosingEditingRecord(closingWipRecord);
              setClosingModalOpen(true);
            }}
          >
            编辑月末样例
          </Button>
        </Space>
        <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
          {lastAction}
        </Typography.Paragraph>
      </section>
    </Space>
  );
}
