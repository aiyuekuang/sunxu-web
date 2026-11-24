import { App, Button, Card, Modal, Segmented, Space, Typography } from 'antd';
import { useMemo, useState } from 'react';
import {
  SaleDeliveryDetailLedger,
  SaleDeliveryDocumentActionDrawer,
  SaleOrderDetailLedger,
  SaleReturnDetailLedger,
} from '../../src/mes/components/SalesDetailLedgerComponents';
import type {
  SaleDeliveryActionDrawerModel,
  SaleDeliveryDetailLedgerCapabilities,
  SaleDeliveryDetailLedgerRow,
  SaleDeliveryDetailLedgerSummary,
  SaleOrderDetailLedgerCapabilities,
  SaleOrderDetailLedgerRow,
  SaleOrderDetailLedgerSummary,
  SaleReturnDetailLedgerCapabilities,
  SaleReturnDetailLedgerRow,
  SaleReturnDetailLedgerSummary,
  SaleReturnLedgerDocument,
  SalesDetailLedgerBaseCapabilities,
  SalesDetailLedgerQueryBase,
  SalesDetailLedgerResponse,
  SalesDetailLedgerFilterColumns,
} from '../../src/mes/components/sales-detail-ledger-types';
import type {
  SaleDeliveryDocumentActionsCapabilities,
} from '../../src/mes/components/sale-delivery-document-actions-dropdown-types';
import type {
  SaleDeliveryItemsPanelCapabilities,
} from '../../src/mes/components/sales-delivery-components-types';
import type {
  SaleReturnEditCapabilities,
  SaleReturnReceiveCapabilities,
  SaleReturnStockConversionCapabilities,
} from '../../src/mes/components/sale-return-components-types';
import type { MesStatusEnum } from '../../src/mes/components/StatusDisplay';
import type { ProColumns } from '@ant-design/pro-components';

type LedgerView = 'order' | 'delivery' | 'return';

const demoMaterial = {
  id: 'material-demo',
  code: 'AL-BR-018',
  name: '精密铝合金支架',
  spec: '120×40 mm',
  unit: 'pcs',
  thumbnailUrl: null,
  primaryImageUrl: null,
  customValues: {},
};

const demoOrder = {
  id: 'sale-order-demo',
  orderNo: 'XS-2026-018',
  status: 'confirmed',
  availableActions: ['update', 'confirm', 'createDelivery', 'cancel'],
  partnerNameSnapshot: '演示客户',
  customer: { id: 'customer-demo', name: '演示客户' },
  createdAt: '2026-11-18T09:30:00.000Z',
  updatedAt: '2026-11-20T14:20:00.000Z',
};

const demoDelivery = {
  id: 'sale-delivery-demo',
  deliveryNo: 'XSCK-2026-018',
  status: 'draft',
  availableActions: ['update', 'confirm', 'cancel', 'return'],
  saleOrder: demoOrder,
  customer: { id: 'customer-demo', name: '演示客户' },
  partnerNameSnapshot: '演示客户',
  warehouse: { name: '成品仓' },
};

const demoReturn: SaleReturnLedgerDocument = {
  id: 'sale-return-demo',
  returnNo: 'XSTH-2026-003',
  status: 'pending_receive',
  totalReceivedQty: 0,
  stockTransactions: [],
  sourceDeliveryId: demoDelivery.id,
  customerId: 'customer-demo',
  receiveWarehouseId: 'warehouse-demo',
  receiveDate: '2026-11-21',
  reasonCode: 'quality_issue',
  reasonLabelSnapshot: '质量问题',
  financialAction: 'none',
  remarks: '目录演示退货单',
  priceVisible: true,
  availableActions: ['update', 'submit', 'receive', 'withdraw'],
  partnerNameSnapshot: '演示客户',
  customer: { id: 'customer-demo', name: '演示客户' },
  sourceSaleOrder: demoOrder,
  sourceDelivery: demoDelivery,
  items: [
    {
      id: 'sale-return-line-demo',
      materialId: demoMaterial.id,
      material: demoMaterial,
      returnQty: 2,
      receivedQty: 0,
      batchNo: 'LOT-2026-018',
      storageLocationSnapshot: '成品仓 / A区 / 01-02',
      disposition: 'resellable',
      financialAction: 'none',
      unitPriceSnapshot: 18.5,
      customValues: {},
    },
  ],
  deductionLines: [],
};

const saleOrderRow: SaleOrderDetailLedgerRow = {
  id: 'sale-order-line-demo',
  order: demoOrder,
  material: demoMaterial,
  lineNo: 1,
  quantity: 24,
  shippedQty: 12,
  remainingQty: 12,
  returnedQty: 0,
  unitPrice: 18.5,
  amount: 444,
  discountRate: 100,
  discountAmount: 0,
  discountedAmount: 444,
  taxRate: 13,
  taxAmount: 57.72,
  totalAmount: 501.72,
  effectiveDeliveryDate: '2026-12-05',
  createdAt: demoOrder.createdAt,
  updatedAt: demoOrder.updatedAt,
  remarks: '目录演示订单行',
  customValues: {},
};

const saleDeliveryRow: SaleDeliveryDetailLedgerRow = {
  id: 'sale-delivery-line-demo',
  material: demoMaterial,
  deliveryOrder: demoDelivery,
  ledgerDate: '2026-11-20',
  originalQty: 12,
  reversedQty: 0,
  batchNo: 'LOT-2026-018',
  storageLocationSnapshot: '成品仓 / A区 / 01-02',
  ledgerAmount: 222,
  unitPrice: 18.5,
  amount: 222,
  discountRate: 100,
  discountAmount: 0,
  discountedAmount: 222,
  taxRate: 13,
  taxAmount: 28.86,
  totalAmount: 250.86,
  priceIncludesTax: false,
  priceSnapshot: { currency: 'CNY', amountPolicySnapshot: { policyCode: 'default' } },
  originalAmount: 222,
  createdAt: demoOrder.createdAt,
  updatedAt: demoOrder.updatedAt,
  remarks: '目录演示出库行',
  customValues: {},
};

const saleReturnRow: SaleReturnDetailLedgerRow = {
  id: 'sale-return-line-demo',
  returnOrderId: demoReturn.id,
  returnOrder: demoReturn,
  material: demoMaterial,
  returnQty: 2,
  receivedQty: 0,
  acceptedQty: 0,
  rejectedQty: 0,
  netRefundAmount: 37,
  reasonCode: 'quality_issue',
  returnType: 'customer_return',
  status: 'pending_receive',
  receiveDate: '2026-11-21',
  batchNo: 'LOT-2026-018',
  storageLocationSnapshot: '成品仓 / A区 / 01-02',
  createdAt: demoOrder.createdAt,
  updatedAt: demoOrder.updatedAt,
  remarks: '目录演示退货行',
  customValues: {},
};

const orderSummary: SaleOrderDetailLedgerSummary = {
  orderCount: 1,
  itemCount: 1,
  totalQty: 24,
  shippedQty: 12,
  amount: 444,
  discountAmount: 0,
  discountedAmount: 444,
  taxAmount: 57.72,
  totalAmount: 501.72,
  customFieldSummaries: [],
};

const deliverySummary: SaleDeliveryDetailLedgerSummary = {
  deliveryOrderCount: 1,
  itemCount: 1,
  originalQty: 12,
  reversedQty: 0,
  amount: 222,
  discountAmount: 0,
  discountedAmount: 222,
  taxAmount: 28.86,
  totalAmount: 250.86,
  customFieldSummaries: [],
};

const returnSummary: SaleReturnDetailLedgerSummary = {
  returnOrderCount: 1,
  itemCount: 1,
  totalReturnQty: 2,
  totalReceivedQty: 0,
  totalAcceptedQty: 0,
  totalRejectedQty: 0,
  amount: 37,
  discountAmount: 0,
  discountedAmount: 37,
  taxAmount: 0,
  totalAmount: 37,
  netRefundAmount: 37,
};

const orderStatusEnum: MesStatusEnum = {
  draft: { text: '草稿', status: 'Default' },
  confirmed: { text: '已确认', status: 'Success' },
};

const deliveryStatusEnum: MesStatusEnum = {
  draft: { text: '草稿', status: 'Default' },
  delivered: { text: '已出库', status: 'Success' },
};

const returnStatusEnum: MesStatusEnum = {
  pending_receive: { text: '待收货', status: 'Processing' },
  received: { text: '已收货', status: 'Success' },
};

const returnTypeEnum: MesStatusEnum = {
  customer_return: { text: '客户退货', status: 'Warning' },
  exchange: { text: '换货', status: 'Processing' },
};

function formatNumber(value: number | string | null | undefined): string {
  if (value == null || value === '') return '-';
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 4 }).format(numeric)
    : String(value);
}

function formatCurrency(value: number | string | null | undefined): string {
  if (value == null || value === '') return '-';
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
      }).format(numeric)
    : String(value);
}

function demoFilters<TRow extends object>(): SalesDetailLedgerFilterColumns<TRow> {
  const options = [{ label: '演示客户', value: 'customer-demo' }];
  const materialOptions = [{ label: 'AL-BR-018 - 精密铝合金支架', value: 'material-demo' }];
  const warehouseOptions = [{ label: '成品仓', value: 'warehouse-demo' }];
  const select = <T extends object>(): Partial<ProColumns<T>> => ({
    valueType: 'select',
    fieldProps: { options },
  });
  return {
    customer: select<TRow>(),
    material: {
      valueType: 'select',
      fieldProps: { options: materialOptions },
    },
    warehouse: {
      valueType: 'select',
      fieldProps: { options: warehouseOptions },
    },
  };
}

function demoBaseCapabilities<
  TRow extends object,
  TQuery extends SalesDetailLedgerQueryBase,
  TSummary,
>(
  rows: TRow[],
  summary: TSummary,
  amountsMasked: boolean,
  setAmountMasked: (masked: boolean) => void,
): SalesDetailLedgerBaseCapabilities<
  TRow,
  TQuery,
  SalesDetailLedgerResponse<TRow, TSummary>
> {
  return {
    requestList: async () => ({ list: rows, total: rows.length, priceVisible: true, summary }),
    exportExcel: async () => new Blob(['MES component catalog demo'], { type: 'text/plain' }),
    canCreate: true,
    canExport: true,
    createPermission: 'catalog.demo.create',
    exportPermission: 'catalog.demo.export',
    exportFileNamePrefix: 'sales-detail-ledger-demo',
    resizable: { enabled: false, persistenceKey: false },
    serverSortFields: [],
    statusEnum: orderStatusEnum,
    filterColumns: demoFilters<TRow>(),
    materialCustomFields: [],
    lineCustomFieldSchema: { schemaVersion: 1, fields: [] },
    formatCurrency,
    formatNumber,
    formatDate: (value) => value ? value.slice(0, 10) : '-',
    formatUnitLabel: (value, unitLabelMap) => value ? unitLabelMap[value] ?? value : '',
    unitLabelMap: { pcs: '件' },
    maskAmount: (value, priceAllowed) =>
      priceAllowed ? (amountsMasked ? '••••' : String(value ?? '-')) : '••••',
    renderAmountVisibilityToggle: (priceAllowed) => (
      <Button
        size="small"
        disabled={!priceAllowed}
        onClick={() => setAmountMasked(!amountsMasked)}
      >
        {amountsMasked ? '显示金额' : '隐藏金额'}
      </Button>
    ),
  };
}

/** Static catalog fixtures keep service, permission, route, dictionary, and print effects inside host capabilities. */
export function SalesDetailLedgerComponentsDemo() {
  const { message } = App.useApp();
  const [activeView, setActiveView] = useState<LedgerView>('order');
  const [deliveryDrawerOpen, setDeliveryDrawerOpen] = useState(false);
  const [amountsMasked, setAmountsMasked] = useState(false);

  const orderCapabilities = useMemo<SaleOrderDetailLedgerCapabilities>(() => ({
    ...demoBaseCapabilities<SaleOrderDetailLedgerRow, SalesDetailLedgerQueryBase, SaleOrderDetailLedgerSummary>(
      [saleOrderRow], orderSummary, amountsMasked, setAmountsMasked,
    ),
    permissions: {
      canViewOrder: true,
      canCreateDelivery: true,
      canViewDelivery: true,
      canCreateProcurementDemand: true,
      canCreateProductionPlan: true,
      canCreateWorkOrder: true,
      canCopy: true,
      canPrint: true,
      canPrintRecords: true,
      canCancel: true,
      canCloseRemaining: true,
      canUpdate: true,
      canConfirm: true,
    },
    permissionCodes: {
      update: 'sale_order.update',
      confirm: 'sale_order.confirm',
      createDelivery: 'sale_delivery.create',
      viewDelivery: 'sale_delivery.view',
      procurementDemand: 'purchase_requisition.create',
      convertToProductionPlan: 'production_plan.create',
      convertToWorkOrder: 'work_order.create',
      viewProductionPlans: 'production_plan.view',
      copy: 'sale_order.copy',
      print: 'print_job.submit',
      printRecords: 'print_job.view',
      cancel: 'sale_order.cancel',
      closeRemaining: 'sale_order.update',
    },
    navigateToOrder: () => message.info('目录演示：宿主负责路由跳转'),
    getOrderPath: (id) => `/sales/orders/${id}`,
    loadOrderDetail: async () => demoOrder,
    navigateToDeliveryLedger: () => message.info('目录演示：打开销售出库台账'),
    navigateToProcurementDemand: () => message.info('目录演示：打开采购需求'),
    navigateToProductionPlans: () => message.info('目录演示：打开生产计划'),
    shipActionCapabilities: {
      renderDeliveryEditor: ({ open, saleOrderId, onClose, onSuccess }) => (
        <Modal
          title="创建销售出库单"
          open={open}
          onCancel={onClose}
          footer={[
            <Button key="cancel" onClick={onClose}>取消</Button>,
            <Button key="confirm" type="primary" onClick={onSuccess}>完成演示</Button>,
          ]}
        >
          订单 {saleOrderId} 的出库编辑器由 MES 宿主提供。
        </Modal>
      ),
    },
  }), [amountsMasked, message]);

  const returnEditCapabilities = useMemo<SaleReturnEditCapabilities>(() => ({
    update: async () => undefined,
    financialActionOptions: [
      { label: '不处理财务', value: 'none' },
      { label: '生成贷项', value: 'credit_note' },
    ],
    renderReasonField: ({ label }) => <span>{label}（宿主字典）</span>,
    renderDeductionItemField: ({ label }) => <span>{label}（宿主字典）</span>,
    buildLineCustomValuePayload: () => undefined,
    getNextDeductionBasisForItem: () => undefined,
    notifyWarning: (copy) => message.warning(copy),
    notifySuccess: (copy) => message.success(copy),
    messages: {
      itemsRequired: '请保留至少一条退货明细',
      manualCreditUnitPriceRequired: '手工贷项需要维护单价',
      deductionRequiresCredit: '扣款要求选择生成贷项',
      deductionExceedsReturn: '扣款金额不能超过退货金额',
      updateSuccess: '退货单已更新',
    },
  }), [message]);

  const returnReceiveCapabilities = useMemo<SaleReturnReceiveCapabilities>(() => ({
    receive: async () => undefined,
    dispositionOptions: [
      { label: '可再销售', value: 'resellable' },
      { label: '待处理', value: 'pending' },
    ],
    notifySuccess: (copy) => message.success(copy),
    receiveSuccessMessage: '退货收货完成',
  }), [message]);

  const returnStockConversionCapabilities = useMemo<SaleReturnStockConversionCapabilities>(() => ({
    createFromSaleReturn: async (payload) => ({
      id: `conversion-${payload.id}`,
      conversionNo: 'KCDH-DEMO-001',
    }),
    requestWarehouses: async () => [{ label: '演示仓库', value: 'warehouse-demo' }],
    conversionTypeOptions: [
      { label: '拆解', value: 'disassemble' },
      { label: '重包', value: 'repack' },
    ],
    costAllocationMethodOptions: [
      { label: '按数量', value: 'by_qty' },
      { label: '手工金额', value: 'manual_amount' },
    ],
    notifySuccess: (copy) => message.success(copy),
  }), [message]);

  const returnCapabilities = useMemo<SaleReturnDetailLedgerCapabilities>(() => ({
    ...demoBaseCapabilities<SaleReturnDetailLedgerRow, SalesDetailLedgerQueryBase, SaleReturnDetailLedgerSummary>(
      [saleReturnRow], returnSummary, amountsMasked, setAmountsMasked,
    ),
    statusEnum: returnStatusEnum,
    returnTypeEnum,
    reasonLabelMap: { quality_issue: '质量问题' },
    permissions: {
      canViewReturn: true,
      canViewSaleOrder: true,
      canViewSaleDelivery: true,
      canPrint: true,
    },
    permissionCodes: {
      update: 'sale_return.update',
      submit: 'sale_return.submit',
      receive: 'sale_return.receive',
      stockConversion: 'stock_conversion.create',
      cancel: 'sale_return.cancel',
      reverse: 'sale_return.reverse',
      print: 'print_job.submit',
      printRecords: 'print_job.view',
    },
    navigateToReturn: () => message.info('目录演示：宿主负责路由跳转'),
    getReturnPath: (id) => `/sales/returns/${id}`,
    navigateToSaleOrder: () => message.info('目录演示：打开销售订单'),
    navigateToSaleDelivery: () => message.info('目录演示：打开销售出库单'),
    requestReturnDetail: async () => demoReturn,
    batchPrint: {
      canPrint: true,
      actions: [{
        label: '批量打印',
        getPrintParams: (row) => ({ businessType: 'sale_return', businessId: row.returnOrderId }),
      }],
      openPrintBatch: (requests) => message.success(`已提交 ${requests.length} 张演示退货单打印`),
    },
    editCapabilities: returnEditCapabilities,
    receiveCapabilities: returnReceiveCapabilities,
    stockConversionCapabilities: returnStockConversionCapabilities,
  }), [amountsMasked, message, returnEditCapabilities, returnReceiveCapabilities, returnStockConversionCapabilities]);

  const deliveryActions = useMemo<SaleDeliveryDocumentActionsCapabilities>(() => ({
    permissions: {
      loadApprovalStatus: false,
      edit: true,
      confirm: true,
      submitApproval: false,
      recallApproval: false,
      print: true,
      printRecords: true,
      cancel: true,
      reverse: true,
      createSaleReturn: true,
    },
    loadDetail: async () => ({
      id: demoDelivery.id,
      deliveryNo: demoDelivery.deliveryNo,
      status: demoDelivery.status,
      availableActions: demoDelivery.availableActions,
      items: [{ unitPrice: 18.5 }],
    }),
    loadApprovalStatus: async () => null,
    cancelDelivery: async () => undefined,
    confirmDelivery: async () => undefined,
    reverseDelivery: async () => undefined,
    submitApproval: async () => undefined,
    recallApproval: async () => undefined,
    createSaleReturnFromDelivery: async () => ({ id: demoReturn.id }),
    returnReasonOptions: [{ label: '质量问题', value: 'quality_issue' }],
    returnReasonLoading: false,
    openPrint: () => message.info('打印模板与打印任务由宿主提供'),
    openPrintRecords: () => {
      message.info('打印记录由宿主提供');
    },
    navigateToSaleReturn: () => message.info('目录演示：打开销售退货单'),
    getErrorCode: () => undefined,
    getErrorMessage: (_error, fallback) => fallback ?? '演示操作失败',
    notifySuccess: (copy) => message.success(copy),
    notifyError: (copy) => message.error(copy),
    notifyWarning: (copy) => message.warning(copy),
    messages: {
      createSuccess: '销售退货单已创建',
      confirmSuccess: '销售出库单已确认',
      submitApprovalSuccess: '已提交审批',
      recallApprovalSuccess: '已撤回审批',
      cancelSuccess: '销售出库单已取消',
      reverseSuccess: '销售出库单已冲正',
    },
  }), [message]);

  const deliveryDetail: SaleDeliveryActionDrawerModel = useMemo(() => ({
    ...demoDelivery,
    warehouseId: 'warehouse-demo',
    deliveryDate: '2026-11-20',
    remarks: '目录演示销售出库单',
    attachmentUrls: [],
    items: [
      {
        id: saleDeliveryRow.id,
        materialId: demoMaterial.id,
        quantity: 12,
        batchNo: 'LOT-2026-018',
        storageLocationSnapshot: '成品仓 / A区 / 01-02',
        unitPrice: 18.5,
        amount: 222,
        totalAmount: 250.86,
        taxRate: 13,
        taxAmount: 28.86,
        priceSnapshot: saleDeliveryRow.priceSnapshot,
        material: demoMaterial,
      },
    ],
  }), []);

  const deliveryItemsCapabilities = useMemo<SaleDeliveryItemsPanelCapabilities>(() => ({
    loadDetail: async () => deliveryDetail,
    updateExecution: async () => undefined,
    canViewPrices: true,
    canUpdateExecution: true,
    unitLabelMap: { pcs: '件' },
    materialCustomFields: [],
    lineCustomFieldSchema: { schemaVersion: 1, fields: [] },
    maskAmount: (value) => String(value ?? '-'),
    renderAmountPolicySnapshotTag: ({ priceSnapshot }) => priceSnapshot
      ? <span>演示金额规则</span>
      : <span>-</span>,
    notify: { success: (copy) => message.success(copy) },
    stockLocationCapabilities: {
      canAccessLocations: true,
      requestCacheScope: 'catalog-demo',
      requestPrecheck: async ({ action, warehouseId }) => ({
        action, warehouseId, locationControlMode: 'optional', locationRequired: false, warnings: [], blockers: [],
      }),
      requestDistribution: async () => ({ locations: [] }),
      requestLocationList: async () => ({ list: [] }),
      requestLocationTree: async () => [],
      filterDisplayBlockers: (blockers) => blockers,
      renderConfigEntryFieldLabel: ({ children }) => children,
    },
    renderStockLocationSelector: ({ value, onChange }) => (
      <Button
        size="small"
        onClick={() => onChange({ locationId: value ? undefined : 'location-demo', storageLocation: 'A-01-02' })}
      >
        {value ? '清除演示仓位' : '设置演示仓位'}
      </Button>
    ),
    renderStockBalancePreview: ({ requiredQty }) => <span>演示可用库存 40 件 · 本次需求 {requiredQty ?? '-'} 件</span>,
    stockBalanceCapabilities: {
      canRead: true,
      requestContextKey: 'catalog-demo',
      loadPreview: async () => ({ warnings: [], blockers: [], bookQty: 40, reservedQty: 2, frozenQty: 0, availableQty: 38 }),
      formatQuantity: (value) => `${value} 件`,
      formatError: () => undefined,
      copy: {
        loading: '加载库存',
        errorFallback: '库存读取失败',
        currentStock: '当前库存',
        bookQty: '账面库存',
        availableQty: '可用库存',
        reservedQty: '已预留',
        frozenQty: '冻结库存',
        batchAvailableQty: '批号可用',
        adjustedQty: '调整后库存',
        shortageQty: '库存缺口',
        batchShortageQty: '批号缺口',
        outboundShortage: '库存不足',
      },
    },
    renderLineCustomFieldFormItems: () => null,
  }), [deliveryDetail, message]);

  const deliveryCapabilities = useMemo<SaleDeliveryDetailLedgerCapabilities>(() => ({
    ...demoBaseCapabilities<SaleDeliveryDetailLedgerRow, SalesDetailLedgerQueryBase, SaleDeliveryDetailLedgerSummary>(
      [saleDeliveryRow], deliverySummary, amountsMasked, setAmountsMasked,
    ),
    statusEnum: deliveryStatusEnum,
    permissions: { canViewDelivery: true, canViewSaleOrder: true },
    navigateToDelivery: () => message.info('目录演示：打开销售出库单'),
    navigateToDeliveryEditor: () => message.info('目录演示：打开销售出库编辑器'),
    navigateToSaleOrder: () => message.info('目录演示：打开销售订单'),
    documentActions: deliveryActions,
  }), [amountsMasked, deliveryActions, message]);

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Card size="small">
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>MES 销售明细台账</Typography.Title>
            <Typography.Text type="secondary">使用固定目录数据展示订单交期、出库日期、退货明细和单击展开的行操作菜单。</Typography.Text>
          </div>
          <Segmented<LedgerView>
            value={activeView}
            onChange={setActiveView}
            options={[
              { label: '销售订单', value: 'order' },
              { label: '销售出库', value: 'delivery' },
              { label: '销售退货', value: 'return' },
            ]}
          />
        </Space>
      </Card>

      {activeView === 'order' ? (
        <SaleOrderDetailLedger
          capabilities={orderCapabilities}
          onCreate={() => message.info('新增订单表单由宿主打开')}
        />
      ) : null}
      {activeView === 'delivery' ? (
        <>
          <Button onClick={() => setDeliveryDrawerOpen(true)}>打开销售出库单动作抽屉</Button>
          <SaleDeliveryDetailLedger
            capabilities={deliveryCapabilities}
            onCreate={() => message.info('新增销售出库表单由宿主打开')}
          />
        </>
      ) : null}
      {activeView === 'return' ? (
        <SaleReturnDetailLedger
          capabilities={returnCapabilities}
          onCreate={() => message.info('新增销售退货表单由宿主打开')}
        />
      ) : null}

      <SaleDeliveryDocumentActionDrawer
        open={deliveryDrawerOpen}
        deliveryId={demoDelivery.id}
        onClose={() => setDeliveryDrawerOpen(false)}
        onActionSuccess={() => message.success('演示出库单已刷新')}
        onOpenFullEditor={() => message.info('完整编辑器由宿主打开')}
        capabilities={{
          loadDetail: async () => deliveryDetail,
          statusEnum: deliveryStatusEnum,
          canEditCustomFields: true,
          actions: deliveryActions,
          items: deliveryItemsCapabilities,
        }}
      />
    </Space>
  );
}
