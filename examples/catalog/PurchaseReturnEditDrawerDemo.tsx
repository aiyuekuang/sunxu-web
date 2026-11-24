import { useMemo, useState } from 'react';
import { App, Button, Form, Select, Space, Typography } from 'antd';
import { ProFormSelect } from '@ant-design/pro-components';
import { SectionCard } from '../../src';
import { PurchaseReturnEditDrawer } from '../../src/mes/components/PurchaseReturnEditDrawer';
import type {
  PurchaseReturnCommercialAmountInput,
  PurchaseReturnEditCapabilities,
  PurchaseReturnEditDetail,
  PurchaseReturnEditLineFormValue,
  PurchaseReturnUpdatePayload,
} from '../../src/mes/components/purchase-return-edit-drawer-types';
import type { DocumentLineCustomFieldSchema } from '../../src/mes/components/document-line-custom-field-types';
import type { MesStockLocationSelectCapabilities } from '../../src/mes/components/stock-location-select-field-types';
import type { StockBalancePreviewCapabilities } from '../../src/mes/components/stock-balance-preview-types';

const lineCustomFieldSchema: DocumentLineCustomFieldSchema = {
  schemaVersion: 3,
  fields: [
    {
      fieldKey: 'supplierLotCode',
      label: '供应商批次号',
      fieldKind: 'input',
      dataType: 'text',
      requiredPolicy: 'none',
      isActive: true,
      sortOrder: 1,
      displayJson: { showInForm: true },
    },
    {
      fieldKey: 'inspectionDate',
      label: '检验日期',
      fieldKind: 'input',
      dataType: 'date',
      requiredPolicy: 'none',
      isActive: true,
      sortOrder: 2,
      displayJson: { showInForm: true },
    },
  ],
};

const sourceLinkedReturn: PurchaseReturnEditDetail = {
  id: 'purchase-return-receipt-demo',
  sourceReceiptId: 'receipt-demo-001',
  sourceReceipt: { receiptDate: '2026-11-12' },
  supplierId: 'supplier-demo-001',
  sourcePurchaseOrderId: 'purchase-order-demo-001',
  outboundWarehouseId: 'warehouse-demo-001',
  returnType: 'physical_return',
  inspectionRequired: true,
  financialAction: 'payable_offset',
  returnDate: '2026-11-20',
  reasonCode: 'quality_issue',
  remarks: '来源入库单退货示例',
  priceVisible: true,
  items: [
    {
      id: 'return-item-receipt-001',
      materialId: 'material-demo-001',
      material: { name: '精密铝合金支架' },
      sourceReceiptItemId: 'receipt-item-demo-001',
      sourceReceiptItem: {
        amount: 2400,
        quantity: 120,
        material: { name: '精密铝合金支架' },
      },
      returnQty: 24,
      unitPriceSnapshot: 100,
      taxRateSnapshot: 13,
      priceIncludesTaxSnapshot: false,
      sourceSnapshot: { currency: 'CNY', exchangeRate: 1 },
      batchNo: 'LOT-2026-11-A',
      locationId: 'location-demo-a',
      storageLocationSnapshot: 'A 区 / 货架 03',
      remarks: '来源收货金额按退货数量比例计算',
      customFieldSchemaVersion: 3,
      customValues: { supplierLotCode: 'SUP-LOT-778' },
    },
  ],
  deductionLines: [
    {
      deductionItemCode: 'logistics_packaging',
      basis: '按退货相关物流、包装、搬运等费用协商扣减',
      amount: 120,
      remarks: '回运包装费',
    },
  ],
};

const independentReturn: PurchaseReturnEditDetail = {
  id: 'purchase-return-independent-demo',
  sourceReceiptId: null,
  supplierId: 'supplier-demo-002',
  sourcePurchaseOrderId: 'purchase-order-demo-002',
  outboundWarehouseId: 'warehouse-demo-001',
  returnType: 'physical_return',
  inspectionRequired: false,
  financialAction: 'payable_offset',
  returnDate: '2026-11-20',
  reasonCode: 'surplus_material',
  remarks: '按现存库存独立退料示例',
  priceVisible: true,
  items: [
    {
      id: 'return-item-independent-001',
      materialId: 'material-demo-002',
      material: { name: '不锈钢连接件' },
      returnQty: 10,
      unitPriceSnapshot: 18.5,
      taxRateSnapshot: 13,
      priceIncludesTaxSnapshot: false,
      sourceSnapshot: { currency: 'CNY', exchangeRate: 1 },
      batchNo: 'LOT-SS-2026-04',
      locationId: 'location-demo-b',
      storageLocationSnapshot: 'B 区 / 货架 01',
      remarks: '独立退料需要核对现存库存',
      customFieldSchemaVersion: 3,
      customValues: { supplierLotCode: 'SS-LOT-422' },
    },
  ],
  deductionLines: [
    {
      deductionItemCode: 'material_loss',
      basis: '按不可回用材料或材料损耗金额协商扣减',
      amount: 12,
      remarks: '协商扣除损耗',
    },
  ],
};

const deductionDefaultBasis: Record<string, string> = {
  material_loss: '按不可回用材料或材料损耗金额协商扣减',
  processing_fee: '按已投入加工工时、返工处理或人工成本协商扣减',
  design_mold_fee: '按已发生设计、开模、打样等专用成本协商扣减',
  logistics_packaging: '按退货相关物流、包装、搬运等费用协商扣减',
  penalty: '按合同条款或双方协商的违约补偿金额扣减',
};
const defaultDeductionBases = new Set(Object.values(deductionDefaultBasis));

function calculateDemoCommercialAmount(input: PurchaseReturnCommercialAmountInput) {
  const price =
    input.unitPrice === null || input.unitPrice === undefined || input.unitPrice === ''
      ? null
      : Number(input.unitPrice);
  if (price === null || !Number.isFinite(price)) return { totalAmount: null };
  const quantity = Number(input.quantity ?? 0);
  const amount = Math.round((quantity * price + Number.EPSILON) * 100) / 100;
  const rawRate = Number(input.taxRate ?? 0);
  const rate = rawRate > 0 && rawRate < 1 ? rawRate * 100 : rawRate;
  if (input.priceIncludesTax === true && rate > 0) {
    return { totalAmount: amount };
  }
  const totalAmount = Math.round((amount * (1 + rate / 100) + Number.EPSILON) * 100) / 100;
  return { totalAmount };
}

function buildDemoCustomValuePayload(
  item: PurchaseReturnEditLineFormValue,
  schema: DocumentLineCustomFieldSchema | null | undefined,
) {
  const fields = (schema?.fields ?? []).filter(
    (field) =>
      field.isActive !== false &&
      field.fieldKind === 'input' &&
      Boolean(
        field.displayJson &&
          typeof field.displayJson === 'object' &&
          'showInForm' in field.displayJson &&
          (field.displayJson as { showInForm?: unknown }).showInForm === true,
      ),
  );
  if (!schema || fields.length === 0) return undefined;
  const inputKeys = new Set(
    (schema.fields ?? [])
      .filter((field) => field.isActive !== false && field.fieldKind === 'input')
      .map((field) => field.fieldKey),
  );
  const values = item.customValues ?? {};
  const preserved = Object.fromEntries(
    Object.entries(values).filter(([key]) => inputKeys.has(key)),
  );
  const visible = Object.fromEntries(
    fields.flatMap((field) => {
      const hasValue = Object.hasOwn(values, field.fieldKey);
      const value = values[field.fieldKey];
      return hasValue || value != null ? [[field.fieldKey, value ?? null]] : [];
    }),
  );
  return {
    customFieldSchemaVersion: schema.schemaVersion,
    customValues: { ...preserved, ...visible },
  };
}

const stockLocationCapabilities: MesStockLocationSelectCapabilities = {
  canAccessLocations: true,
  requestCacheScope: 'purchase-return-demo',
  requestPrecheck: async ({ action, warehouseId }) => ({
    action,
    warehouseId,
    locationControlMode: 'required',
    locationRequired: false,
    warnings: [],
    blockers: [],
  }),
  requestDistribution: async () => ({
    locations: [
      {
        locationId: 'location-demo-a',
        locationCode: 'A-03',
        locationName: 'A 区货架 03',
        locationPath: 'A 区 / 货架 03',
        availableQty: 80,
      },
    ],
  }),
  requestLocationList: async () => ({
    list: [
      { id: 'location-demo-a', name: 'A 区货架 03', pathName: 'A 区 / 货架 03', allowStock: true, isActive: true },
      { id: 'location-demo-b', name: 'B 区货架 01', pathName: 'B 区 / 货架 01', allowStock: true, isActive: true },
    ],
  }),
  requestLocationTree: async () => [],
  filterDisplayBlockers: (blockers) => blockers,
  renderConfigEntryFieldLabel: ({ children, show, onOpen }) => (
    <Space size={6}>
      {children}
      {show ? (
        <Button type="link" size="small" onClick={onOpen}>
          配置仓位
        </Button>
      ) : null}
    </Space>
  ),
};

const stockBalancePreviewCapabilities: StockBalancePreviewCapabilities = {
  canRead: true,
  requestContextKey: 'purchase-return-demo',
  loadPreview: async (query) => {
    const availableQty = 82;
    const shortageQty = Math.max((query.requiredQty ?? 0) - availableQty, 0);
    const batchAvailableQty = 36;
    const batchShortageQty = Math.max((query.requiredQty ?? 0) - batchAvailableQty, 0);
    return {
      bookQty: 100,
      reservedQty: 12,
      frozenQty: 6,
      availableQty,
      batchAvailableQty,
      shortageQty,
      sufficient: shortageQty === 0,
      batchShortageQty,
      batchSufficient: batchShortageQty === 0,
      warnings: [],
      blockers: [],
    };
  },
  formatQuantity: (value) => value.toFixed(2),
  formatError: (error) => (error instanceof Error ? error.message : undefined),
  copy: {
    loading: '正在查询库存…',
    errorFallback: '库存预览暂不可用',
    currentStock: '当前库存',
    bookQty: '账面',
    availableQty: '可用',
    reservedQty: '预留',
    frozenQty: '冻结',
    batchAvailableQty: '批次可用',
    adjustedQty: '调整后',
    shortageQty: '库存不足',
    batchShortageQty: '批次不足',
    outboundShortage: '可用库存不足',
  },
};

export function PurchaseReturnEditDrawerDemo() {
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<PurchaseReturnEditDetail>(sourceLinkedReturn);
  const [lastAction, setLastAction] = useState('请选择来源退货或独立退料示例');

  const capabilities = useMemo<PurchaseReturnEditCapabilities>(
    () => ({
      update: async (payload: PurchaseReturnUpdatePayload) => {
        setLastAction(
          `已模拟保存 ${payload.items.length} 条退货明细、${payload.deductionLines?.length ?? 0} 条扣款行`,
        );
      },
      requestActiveSuppliers: async () => [
        { label: '华东精密材料 · SUP-001', value: 'supplier-demo-001' },
        { label: '新锐工业供应 · SUP-002', value: 'supplier-demo-002' },
      ],
      requestNonLineSideWarehouses: async () => [
        { label: '原材料主仓 · WH-RAW-01', value: 'warehouse-demo-001' },
        { label: '退货隔离仓 · WH-RTN-01', value: 'warehouse-demo-002' },
      ],
      requestPurchaseOrders: async ({ keyword }) => ({
        list: [
          { id: 'purchase-order-demo-001', orderNo: 'PO-2026-018', supplier: { name: '华东精密材料' } },
          { id: 'purchase-order-demo-002', orderNo: 'PO-2026-022', supplier: { name: '新锐工业供应' } },
        ].filter((order) => !keyword || `${order.orderNo} ${order.supplier?.name ?? ''}`.toLowerCase().includes(keyword.toLowerCase())),
      }),
      financialActionOptions: [
        { label: '不处理财务', value: 'none' },
        { label: '冲减应付', value: 'payable_offset' },
        { label: '退款', value: 'refund' },
      ],
      lineCustomFieldSchema,
      buildLineCustomValuePayload: buildDemoCustomValuePayload,
      getNextDeductionBasisForItem: (itemCode, currentBasis) => {
        const current = typeof currentBasis === 'string' ? currentBasis.trim() : '';
        const next = itemCode ? deductionDefaultBasis[itemCode] : undefined;
        const canReplace = !current || defaultDeductionBases.has(current);
        if (next && canReplace) return next;
        if (!next && defaultDeductionBases.has(current)) return null;
        return undefined;
      },
      normalizeDateOnlyValue: (value) => {
        if (typeof value === 'string') return value.slice(0, 10) || undefined;
        if (value && typeof value === 'object' && 'format' in value && typeof value.format === 'function') {
          const formatted = value.format('YYYY-MM-DD');
          return typeof formatted === 'string' ? formatted : undefined;
        }
        return undefined;
      },
      calculateCommercialLineAmounts: calculateDemoCommercialAmount,
      stockLocation: stockLocationCapabilities,
      stockBalancePreview: stockBalancePreviewCapabilities,
      canViewPrices: true,
      openConfigEntry: (target) => setLastAction(`已打开 ${target} 配置入口`),
      renderConfiguredSelect: ({ name, label, request, showSearch, debounceTime, fieldProps, rules, onOpenConfig }) => (
        <ProFormSelect
          name={name}
          label={
            <Space size={4}>
              <span>{label}</span>
              <Button type="link" size="small" onClick={onOpenConfig}>
                配置
              </Button>
            </Space>
          }
          request={request}
          showSearch={showSearch}
          debounceTime={debounceTime}
          fieldProps={fieldProps}
          rules={rules}
        />
      ),
      renderReasonField: ({ name, label, rules, onOpenConfig }) => (
        <ProFormSelect
          name={name}
          label={
            <Space size={4}>
              <span>{label}</span>
              <Button type="link" size="small" onClick={onOpenConfig}>
                配置
              </Button>
            </Space>
          }
          options={[
            { label: '质量异常', value: 'quality_issue' },
            { label: '多发退回', value: 'surplus_material' },
            { label: '采购计划调整', value: 'plan_change' },
          ]}
          rules={rules}
        />
      ),
      renderDictionaryFormItem: ({ name, label, showConfigEntry, rules, children, onOpenConfig }) => (
        <Form.Item
          name={name}
          label={
            showConfigEntry ? (
              <Space size={4}>
                <span>{label}</span>
                <Button type="link" size="small" onClick={onOpenConfig}>
                  配置
                </Button>
              </Space>
            ) : label
          }
          rules={rules}
        >
          {children}
        </Form.Item>
      ),
      notifyWarning: (text) => message.warning(text),
      notifySuccess: (text) => message.success(text),
      messages: {
        itemsRequired: '请至少保留一条退货明细',
        independentSupplierWarehouseRequired: '独立退料必须选择供应商和退库仓库',
        pricePermissionRequired: '缺少价格查看权限，不能编辑需处理财务的独立退料',
        financialItemPricesRequired: '独立退料在冲减应付或退款时，每条明细必须填写真实单价、币别、汇率、税率和含税口径',
        deductionExceedsReturn: '扣款合计不能超过退货金额',
        updateSuccess: '更新成功',
      },
    }),
    [message],
  );

  return (
    <SectionCard title="采购退货编辑">
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary">
          来源入库退货按收货行金额比例核算；独立退料展示供应商、仓库、订单、价格和库存检查。配置、服务、权限、字典和通知均通过宿主能力接入。
        </Typography.Paragraph>
        <Space wrap>
          <Button
            onClick={() => {
              setDetail(sourceLinkedReturn);
              setOpen(true);
            }}
          >
            编辑来源入库退货
          </Button>
          <Button
            onClick={() => {
              setDetail(independentReturn);
              setOpen(true);
            }}
          >
            编辑独立退料
          </Button>
          <Button
            onClick={() => {
              setDetail((current) => ({ ...current, priceVisible: !current.priceVisible }));
              setLastAction('已切换详情价格权限结果');
            }}
          >
            切换价格可见性
          </Button>
        </Space>
        <Typography.Text type="secondary" aria-live="polite">
          {lastAction} · 当前详情价格可见：{detail.priceVisible ? '是' : '否'}
        </Typography.Text>
        <PurchaseReturnEditDrawer
          detail={detail}
          open={open}
          onClose={() => setOpen(false)}
          onSuccess={async () => setLastAction('保存完成，宿主已刷新退货单')}
          capabilities={capabilities}
        />
      </Space>
    </SectionCard>
  );
}
