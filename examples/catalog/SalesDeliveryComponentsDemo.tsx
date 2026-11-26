import { App, Button, Input, Modal, Select, Space, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { PackageUnitPickerModal } from '../../src/business/components/PackageUnitPickerModal';
import { ProductSerialPicker } from '../../src/business/components/ProductSerialPicker';
import { SaleDeliveryEditorModal } from '../../src/business/components/SaleDeliveryEditorModal';
import { SaleDeliveryItemsPanel } from '../../src/business/components/SaleDeliveryItemsPanel';
import { SaleOrderLineEditableTable } from '../../src/business/components/SaleOrderLineEditableTable';
import type { OrderItemDraft } from '../../src/business/components/OrderItemEditor';
import type { SalesDeliveryPackageUnitRecord } from '../../src/business/components/sales-delivery-components-types';
import type {
  SaleDeliveryDetailRecord,
  SaleDeliveryExecutionPayload,
  SaleDeliveryItemsPanelCapabilities,
  SaleOrderLineEditableTableCapabilities,
} from '../../src/business/components/sales-delivery-components-types';

const initialDelivery: SaleDeliveryDetailRecord = {
  id: 'delivery-demo',
  deliveryNo: 'XSCK-2026-018',
  status: 'draft',
  warehouseId: 'warehouse-demo',
  availableActions: ['update'],
  priceVisible: true,
  items: [
    {
      id: 'delivery-line-demo',
      saleOrderItemId: 'sale-order-line-demo',
      materialId: 'material-demo',
      quantity: 12,
      batchNo: 'LOT-2026-018',
      locationId: 'location-demo',
      storageLocationSnapshot: 'A-01-02',
      customerMaterialCode: 'CUS-BR-018',
      customerMaterialName: '客户支架',
      material: { code: 'AL-BR-018', name: '精密铝合金支架', spec: '120×40 mm', unit: 'pcs' },
      location: { pathName: '成品仓 / A区 / 01-02' },
      unitPrice: 18.5,
      amount: 222,
      totalAmount: 222,
      priceSnapshot: { currency: 'CNY', amountPolicySnapshot: { policyCode: 'default' } },
    },
  ],
};

const demoPackage: SalesDeliveryPackageUnitRecord = {
  id: 'package-demo',
  packageNo: 'PKG-2026-018',
  batchNo: 'LOT-2026-018',
  materialId: 'material-demo',
  totalQty: 12,
  packageType: 'carton',
  status: 'available',
  material: { name: '精密铝合金支架' },
  warehouse: { name: '成品仓' },
};

export function SalesDeliveryComponentsDemo() {
  const { message } = App.useApp();
  const [delivery, setDelivery] = useState(initialDelivery);
  const [packageOpen, setPackageOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [serials, setSerials] = useState<string[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemDraft[]>([
    {
      _key: 'order-line-demo',
      materialId: 'material-demo',
      materialOption: { value: 'material-demo', label: 'AL-BR-018 - 精密铝合金支架', code: 'AL-BR-018', name: '精密铝合金支架', unit: 'pcs', customerMaterialCode: 'CUS-BR-018', customerMaterialName: '客户支架' },
      material: { code: 'AL-BR-018', name: '精密铝合金支架', unit: 'pcs' },
      customerMaterialCode: 'CUS-BR-018',
      customerMaterialName: '客户支架',
      qty: 24,
      unitPrice: 18.5,
      currency: 'CNY',
      manufactureMode: 'standard',
      deliveryDate: '2026-12-05',
      remarks: '目录演示订单行',
    },
  ]);

  const deliveryCapabilities: SaleDeliveryItemsPanelCapabilities = useMemo(() => ({
    loadDetail: async () => delivery,
    updateExecution: async (payload: SaleDeliveryExecutionPayload) => {
      setDelivery((current) => ({
        ...current,
        items: current.items?.map((item) => {
          const patch = payload.items.find((candidate) => candidate.id === item.id);
          return patch ? { ...item, quantity: patch.quantity, batchNo: patch.batchNo, locationId: patch.locationId, storageLocationSnapshot: patch.storageLocation, remarks: patch.remarks, customValues: patch.customValues } : item;
        }),
      }));
    },
    canViewPrices: true,
    canUpdateExecution: true,
    unitLabelMap: { pcs: '件' },
    materialCustomFields: [],
    lineCustomFieldSchema: { schemaVersion: 1, fields: [] },
    maskAmount: (value) => String(value ?? ''),
    renderAmountPolicySnapshotTag: ({ priceSnapshot }) => priceSnapshot ? <Tag color="processing">默认规则</Tag> : <Typography.Text type="secondary">-</Typography.Text>,
    notify: { success: (copy) => message.success(copy) },
    stockLocationCapabilities: {
      canAccessLocations: true,
      requestCacheScope: 'catalog-demo',
      requestPrecheck: async ({ action, warehouseId }) => ({ action, warehouseId, locationControlMode: 'optional', locationRequired: false, warnings: [], blockers: [] }),
      requestDistribution: async () => ({ locations: [] }),
      requestLocationList: async () => ({ list: [] }),
      requestLocationTree: async () => [],
      filterDisplayBlockers: (blockers) => blockers,
      renderConfigEntryFieldLabel: ({ children }) => children,
    },
    renderStockLocationSelector: ({ value, onChange }) => (
      <Space wrap>
        <Select
          aria-label="出库仓位"
          value={value}
          placeholder="选择出库仓位"
          style={{ minWidth: 220 }}
          options={[{ label: '成品仓 / A区 / 01-02', value: 'location-demo' }]}
          onChange={(locationId) => onChange({ locationId, storageLocation: 'A-01-02' })}
        />
      </Space>
    ),
    renderStockBalancePreview: ({ requiredQty }) => <Typography.Text type="secondary">可用库存 40 件 · 本次需求 {requiredQty ?? '-'} 件</Typography.Text>,
    stockBalanceCapabilities: {
      canRead: true,
      requestContextKey: 'catalog-demo',
      loadPreview: async () => ({ warnings: [], blockers: [], bookQty: 40, reservedQty: 2, frozenQty: 0, availableQty: 38 }),
      formatQuantity: (value) => `${value} 件`,
      formatError: () => undefined,
      copy: { loading: '加载库存', errorFallback: '库存读取失败', currentStock: '当前库存', bookQty: '账面库存', availableQty: '可用库存', reservedQty: '已预留', frozenQty: '冻结库存', batchAvailableQty: '批号可用', adjustedQty: '调整后库存', shortageQty: '库存缺口', batchShortageQty: '批号缺口', outboundShortage: '库存不足' },
    },
    renderLineCustomFieldFormItems: () => null,
  }), [delivery, message]);

  const orderCapabilities: SaleOrderLineEditableTableCapabilities = useMemo(() => ({
    renderMaterialSelect: ({ value, placeholder, style, onChange }) => (
      <Select
        showSearch
        optionFilterProp="label"
        value={value}
        placeholder={placeholder}
        style={style}
        options={[{ label: 'AL-BR-018 - 精密铝合金支架', value: 'material-demo' }]}
        onChange={(nextValue) => onChange(nextValue, { label: 'AL-BR-018 - 精密铝合金支架', value: 'material-demo', code: 'AL-BR-018', name: '精密铝合金支架', unit: 'pcs', customerMaterialCode: 'CUS-BR-018', customerMaterialName: '客户支架' })}
      />
    ),
    requestCurrencyOptions: async () => [{ label: '人民币 CNY', value: 'CNY' }, { label: '美元 USD', value: 'USD' }],
    requestMaterialListCustomFields: async () => [],
    requestDocumentLineCustomFieldSchema: async () => ({ schemaVersion: 1, fields: [], systemFields: [] }),
    previewDocumentLineCustomFields: async ({ items }) => ({ items: items.map(() => ({ customComputedValues: {}, customComputedErrors: {} })) }),
    previewCommercialAmounts: async ({ systemValues }) => {
      const amount = Number(systemValues.quantity ?? 0) * Number(systemValues.unitPrice ?? 0);
      const discountRate = Number(systemValues.discountRate ?? 100);
      const taxRate = Number(systemValues.taxRate ?? 0);
      const discountedAmount = amount * discountRate / 100;
      const taxAmount = discountedAmount * taxRate / 100;
      return { amount, discountRate, discountAmount: amount - discountedAmount, discountedAmount, taxRate, taxAmount, totalAmount: discountedAmount + taxAmount };
    },
    requestBomOptions: async () => [{ label: 'AL-BR-018 标准 BOM V3', value: 'bom-demo-v3' }],
    renderDictionaryConfigEntry: ({ children, show, onOpen }) => show ? <Button type="link" htmlType="button" onClick={onOpen}>{children}配置</Button> : children,
    renderDrawingFiles: ({ value, onChange }) => <Button size="small" htmlType="button" onClick={() => onChange(value.length ? [] : ['drawing-demo.pdf'])}>{value.length ? `图纸 ${value.length} 份` : '添加图纸'}</Button>,
    renderDocumentBomButton: () => <Button size="small" htmlType="button" icon={<span>＋</span>}>上传/粘贴 BOM</Button>,
    renderBomCostSnapshotEditor: ({ value, onChange }) => <Button size="small" htmlType="button" onClick={() => onChange(value ? undefined : { source: 'catalog-demo' })}>{value ? 'BOM成本快照已选' : '预览 BOM 成本'}</Button>,
    renderFieldHelp: ({ label, content }) => <Typography.Text type="secondary" title={content}>{label}说明 ⓘ</Typography.Text>,
    manufactureModeOptions: [{ label: '标准', value: 'standard' }, { label: '非标', value: 'engineer_to_order' }],
    normalizeManufactureMode: (value) => value === 'make_to_order' || value === 'engineer_to_order' || value === 'project' || value === 'custom' ? 'engineer_to_order' : 'standard',
    lineCustomFieldSummaries: () => [],
    notify: { error: (copy) => message.error(copy) },
  }), [message]);

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <section>
        <Typography.Title level={4}>销售出库明细与执行调整</Typography.Title>
        <SaleDeliveryItemsPanel
          deliveryId={delivery.id}
          onActionSuccess={() => message.success('出库执行数据已更新')}
          onOpenFullEditor={() => setEditorOpen(true)}
          capabilities={deliveryCapabilities}
        />
      </section>

      <section>
        <Typography.Title level={4}>可出库成品序列号</Typography.Title>
        <ProductSerialPicker
          materialId="material-demo"
          warehouseId="warehouse-demo"
          batchNo="LOT-2026-018"
          deliveryOrderId={delivery.id}
          quantity={serials.length}
          value={serials}
          onChange={setSerials}
          capabilities={{ listAvailableForShipment: async () => [{ serialNo: 'SN-018-001' }, { serialNo: 'SN-018-002' }, { serialNo: 'SN-018-003' }] }}
        />
      </section>

      <section>
        <Typography.Title level={4}>包装单元选择</Typography.Title>
        <Button htmlType="button" onClick={() => setPackageOpen(true)}>选择包装箱</Button>
        <PackageUnitPickerModal
          open={packageOpen}
          onOpenChange={setPackageOpen}
          warehouseId="warehouse-demo"
          materialId="material-demo"
          batchNo="LOT-2026-018"
          deliveryOrderId={delivery.id}
          value={demoPackage.id}
          onSelect={(record) => message.success(`已选择 ${record.packageNo}`)}
          capabilities={{
            listAvailableForDelivery: async () => ({ list: [demoPackage], total: 1 }),
            packageTypeLabels: { carton: '纸箱' },
            packageStatus: { available: { text: '可用', color: 'green' } },
            notify: { warning: (copy) => message.warning(copy) },
          }}
        />
      </section>

      <section>
        <Typography.Title level={4}>销售订单明细编辑</Typography.Title>
        <SaleOrderLineEditableTable
          saleOrderId="sale-order-demo"
          items={orderItems}
          onItemsChange={setOrderItems}
          onItemsUpdate={(updater) => setOrderItems(updater)}
          materialRequest={async () => [{ label: 'AL-BR-018 - 精密铝合金支架', value: 'material-demo', code: 'AL-BR-018', name: '精密铝合金支架', unit: 'pcs' }]}
          showPrice
          showCurrency
          availableDrawingUrls={['drawing-demo.pdf']}
          costAsOfDate="2026-11-20"
          headerDeliveryDate="2026-12-05"
          capabilities={orderCapabilities}
        />
      </section>

      <SaleDeliveryEditorModal
        open={editorOpen}
        saleOrderId="sale-order-demo"
        onClose={() => setEditorOpen(false)}
        onSuccess={() => { setEditorOpen(false); message.success('销售出库单保存成功'); }}
        capabilities={{ renderEmbeddedEditor: ({ open, onClose, onSuccess }) => (
          <Modal title="销售出库单编辑器" open={open} onCancel={onClose} onOk={onSuccess}>
            <Input value="SO-2026-018" readOnly addonBefore="来源销售订单" />
          </Modal>
        ) }}
      />
    </Space>
  );
}
