import { useMemo, useState } from 'react';
import { App, Button, Modal, Space, Typography } from 'antd';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import drawingPdfUrl from './fixtures/mes-drawing-sample.pdf?url&no-inline';
import { SectionCard } from '../../src';
import { MesUiProvider } from '../../src/business';
import { CreateInquiryDrawer } from '../../src/business/components/CreateInquiryDrawer';
import type {
  CreateInquiryDrawerCapabilities,
  InquiryRequisition,
} from '../../src/business/components/create-inquiry-drawer-types';
import { ConvertToOrderDrawer } from '../../src/business/components/ConvertToOrderDrawer';
import type {
  ConvertToOrderDrawerCapabilities,
  ConvertToOrderRequisition,
} from '../../src/business/components/convert-to-order-drawer-types';
import {
  PurchaseOrderViewSwitch,
} from '../../src/business/components/PurchaseOrderViewSwitch';
import type { PurchaseOrderViewMode } from '../../src/business/components/purchase-order-view-switch-types';
import { RequisitionFormModal } from '../../src/business/components/RequisitionFormModal';
import type {
  RequisitionFormModalCapabilities,
  RequisitionFormRecord,
} from '../../src/business/components/requisition-form-modal-types';
import {
  SendPurchaseOrderModal,
} from '../../src/business/components/SendPurchaseOrderModal';
import type { PurchaseOrderSendCapabilities } from '../../src/business/components/send-action-modal-types';
import {
  PurchaseReceiptActionModal,
} from '../../src/business/components/PurchaseReceiptActionModal';
import type {
  PurchaseReceiptActionCapabilities,
  PurchaseReceiptActionReceipt,
} from '../../src/business/components/purchase-receipt-action-modal-types';
import type { MesUiProviderProps } from '../../src/business/MesUiProvider';
import type { MesStockLocationSelectCapabilities } from '../../src/business/components/stock-location-select-field-types';
import type { MesWarehouseRemoteSelectCapabilities } from '../../src/business/components/warehouse-remote-select-types';
import type { MesPurchaseReceiptCapabilities } from '../../src/business/components/purchase-receipt-types';
import type { MesMaterialTablePickerCapabilities } from '../../src/business/components/material-table-picker-types';
import type { MesMaterialSelectCapabilities } from '../../src/business/components/material-select-types';

async function fetchDemoPdf() {
  const response = await fetch(drawingPdfUrl);
  if (!response.ok) throw new Error('读取采购订单示例 PDF 失败');
  return response.blob();
}

const inquiryRequisition: InquiryRequisition = {
  id: 'requisition-demo-001',
  items: [
    {
      id: 'requisition-item-1',
      requiredQty: 24,
      orderedQty: 4,
      material: { code: 'AL-BR-018', name: '精密铝合金支架' },
    },
    {
      id: 'requisition-item-2',
      requiredQty: 12,
      orderedQty: 0,
      material: { code: 'PK-BOX-004', name: '出口包装箱' },
    },
  ],
};

const conversionRequisition: ConvertToOrderRequisition = {
  id: 'requisition-convert-demo-001',
  prNo: 'PR-2026-018',
  items: [
    {
      id: 'convert-item-1',
      materialId: 'material-demo-1',
      material: {
        name: '精密铝合金支架',
        code: 'AL-BR-018',
        spec: '160 × 80 × 12 mm',
        unit: 'piece',
      },
      requiredQty: 24,
      orderedQty: 4,
      sortOrder: 0,
      expectedArrivalDate: '2026-12-10',
    },
    {
      id: 'convert-item-2',
      materialId: 'material-demo-2',
      material: {
        name: '出口包装箱',
        code: 'PK-BOX-004',
        spec: '600 × 400 × 350 mm',
        unit: 'piece',
      },
      requiredQty: 12,
      orderedQty: 0,
      sortOrder: 1,
    },
  ],
};

const requisitionRecord: RequisitionFormRecord = {
  id: 'requisition-form-demo-001',
  prNo: 'PR-2026-019',
  documentDate: '2026-11-20',
  remarks: '采购工作流组件演示',
  items: [
    {
      id: 'requisition-form-item-1',
      materialId: 'material-demo-1',
      material: {
        id: 'material-demo-1',
        code: 'AL-BR-018',
        name: '精密铝合金支架',
        unit: 'piece',
        spec: '160 × 80 × 12 mm',
      },
      requiredQty: 24,
      expectedArrivalDate: '2026-12-10',
      customValues: { deliveryCode: 'D-018' },
    },
  ],
};

const stockLocationCapabilities: MesStockLocationSelectCapabilities = {
  canAccessLocations: false,
  requestCacheScope: 'purchase-workflow-demo',
  requestPrecheck: async ({ action, warehouseId }) => ({
    action,
    warehouseId,
    locationControlMode: 'none',
    locationRequired: false,
    warnings: [],
    blockers: [],
  }),
  requestDistribution: async () => ({ locations: [] }),
  requestLocationList: async () => ({ list: [] }),
  requestLocationTree: async () => [],
  filterDisplayBlockers: (blockers) => blockers,
  renderConfigEntryFieldLabel: ({ children }) => children,
};

const warehouseRemoteSelectCapabilities: MesWarehouseRemoteSelectCapabilities = {
  requestOptions: async () => [
    {
      label: '原材料主仓',
      value: 'warehouse-main',
      name: '原材料主仓',
      code: 'WH-RAW-01',
      warehouseType: 'raw_material',
      sortOrder: 1,
    },
  ],
};

const materialTablePickerCapabilities: MesMaterialTablePickerCapabilities = {
  requestCategoryTree: async () => [],
  requestMaterials: async () => ({ list: [], total: 0 }),
  requestCustomerStockSummary: async () => ({ items: [] }),
  pagination: false,
};

const materialSelectCapabilities: MesMaterialSelectCapabilities = {
  loadSelectorCustomFields: async () => [],
};

function PurchaseWorkflowDemoContent() {
  const { message } = App.useApp();
  const [view, setView] = useState<PurchaseOrderViewMode>('orders');
  const [sendOpen, setSendOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [lastAction, setLastAction] = useState('尚未执行采购工作流操作');

  const sendCapabilities = useMemo<PurchaseOrderSendCapabilities>(
    () => ({
      fetchOptions: async () => ({
        options: [
          {
            channel: 'email',
            label: '发送至采购联系人',
            target: 'supplier@example.test',
            canDirectSend: true,
          },
          {
            channel: 'share',
            label: '复制并系统分享',
            target: '采购订单 PO-2026-018',
            canDirectSend: false,
          },
          { channel: 'copy', label: '复制采购订单全文', canDirectSend: false },
          { channel: 'manual', label: '仅记录手动发送', canDirectSend: false },
        ],
        messageContent: '采购订单 PO-2026-018\n精密铝合金支架：24 件',
        emailSubject: '采购订单 PO-2026-018',
        attachmentFilename: 'PO-2026-018-采购订单.pdf',
        attachmentPreviewable: true,
      }),
      send: async (_payload, channel) => {
        setLastAction(`发送方式：${channel}`);
      },
      fetchAttachmentPdf: fetchDemoPdf,
      downloadAttachment: (value, filename) => {
        if (!(value instanceof Blob)) {
          message.error('示例附件无效');
          return;
        }
        const url = URL.createObjectURL(value);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      },
      notifications: {
        error: (text) => message.error(text),
        success: (text) => message.success(text),
        warning: (text) => message.warning(text),
        info: (text) => message.info(text),
      },
    }),
    [message],
  );
  const inquiryCapabilities = useMemo<CreateInquiryDrawerCapabilities>(
    () => ({
      createFromRequisition: async (input) => {
        setLastAction(`询价单已创建，包含 ${input.items.length} 条明细`);
        return { id: 'inquiry-demo-018' };
      },
      requestSupplierOptions: async () => [
        { label: '华东铝材有限公司', value: 'supplier-east' },
        { label: '迅达包装材料', value: 'supplier-package' },
      ],
      notifyWarning: (text) => message.warning(text),
      notifySuccess: (text) => message.success(text),
    }),
    [message],
  );
  const receiptCapabilities = useMemo<PurchaseReceiptActionCapabilities>(
    () => ({
      previewSource: async ({ purchaseOrderId }) => ({
        purchaseOrderId,
        orderNo: 'PO-2026-018',
        supplierId: 'supplier-east',
        supplier: { name: '华东铝材有限公司' },
        warehouseRecommendation: {
          status: 'resolved',
          warehouseId: 'warehouse-main',
          warehouse: { name: '原材料主仓' },
        },
        items: [
          {
            purchaseOrderItem: {
              id: 'purchase-order-item-1',
              materialId: 'material-demo-1',
              material: {
                id: 'material-demo-1',
                name: '精密铝合金支架',
                code: 'AL-BR-018',
                spec: '160 × 80 × 12 mm',
                baseType: 'raw',
                unit: 'piece',
                defaultWarehouseId: 'warehouse-main',
                defaultWarehouse: { name: '原材料主仓' },
              },
              purchaseUnit: 'piece',
              baseUnit: 'piece',
              orderedQty: 24,
              receivedQty: 0,
              overReceiptPercent: 5,
              unitPrice: 13.5,
            },
            receiptUnit: 'piece',
            receivableReceiptQty: 24,
            remainingReceiptCapacityReceiptQty: 25.2,
            outstandingQty: 24,
            incomingInspectionRequired: false,
          },
          {
            purchaseOrderItem: {
              id: 'purchase-order-item-2',
              materialId: 'material-demo-3',
              material: {
                id: 'material-demo-3',
                name: '铝合金连接件',
                code: 'AL-JOIN-002',
                spec: 'M8',
                baseType: 'raw',
                unit: 'piece',
              },
              purchaseUnit: 'piece',
              baseUnit: 'piece',
              orderedQty: 10,
              receivedQty: 0,
            },
            receiptUnit: 'piece',
            receivableReceiptQty: 10,
            remainingReceiptCapacityReceiptQty: 10,
            outstandingQty: 10,
            incomingInspectionRequired: true,
          },
        ],
      }),
      previewBatchSource: async ({ ids }) => ({
        purchaseOrderIds: ids,
        orderNos: ['PO-2026-018'],
        supplierId: 'supplier-east',
        supplier: { name: '华东铝材有限公司' },
        items: [],
        warehouseRecommendation: { status: 'resolved' },
      }),
      receive: async (input) => {
        setLastAction(`已记录采购收货：${input.items.length} 条入库明细`);
        return {
          id: 'receipt-result-demo-001',
          outcome: 'pending_quality',
          warnings: [],
          receipt: {
            id: 'receipt-demo-001',
            items: [{ qualityInspection: { id: 'inspection-demo-001' } }],
          },
        };
      },
      notifyWarning: (text) => message.warning(text),
      notifyError: (text) => message.error(text),
      notifySuccess: (content, duration) =>
        message.success({ content, duration }),
      requestWarehouseOptions: async () => [
        {
          label: '原材料主仓',
          value: 'warehouse-main',
          warehouseType: 'raw_material',
          sortOrder: 1,
        },
      ],
      stockLocation: stockLocationCapabilities,
      permissions: {
        canExportPrices: true,
        canWarehouseLocations: false,
        canViewInspection: true,
      },
      unitLabelMap: {},
      materialGradeOptions: [
        { label: 'A 级', value: 'A' },
        { label: 'B 级', value: 'B' },
      ],
      materialGradeDictLoading: false,
      materialGradeDictError: false,
      retryMaterialGradeDictionary: () => undefined,
      renderConfigEntryLabel: ({ children }) => children,
    }),
    [message],
  );
  const convertCapabilities = useMemo<ConvertToOrderDrawerCapabilities>(
    () => ({
      preview: async () => ({
        orderCount: 1,
        resolvedCount: 1,
        unresolvedCount: 1,
        groups: [{ items: [{ requisitionItemId: 'convert-item-1', supplierName: '华东铝材有限公司', source: 'material_default' }] }],
        unresolvedItems: [{
          requisitionItemId: 'convert-item-2',
          reason: '采购申请行尚未指定供应商',
          candidateSuppliers: [
            { id: 'supplier-package', name: '迅达包装材料' },
            { id: 'supplier-east', name: '华东铝材有限公司' },
          ],
        }],
      }),
      convert: async ({ items }) => {
        setLastAction(`采购订单已生成，包含 ${items.length} 条申请明细`);
        return { orders: [{ id: 'converted-order-demo-001' }], unresolvedCount: 1 };
      },
      updateArrivalDates: async () => conversionRequisition,
      requestSupplierOptions: async () => [
        { label: '华东铝材有限公司', value: 'supplier-east' },
        { label: '迅达包装材料', value: 'supplier-package' },
      ],
      notifyWarning: (text) => message.warning(text),
      notifySuccess: (text) => message.success(text),
      renderFieldHelp: ({ label }) => label,
      unitLabelMap: {},
    }),
    [message],
  );
  const requisitionCapabilities = useMemo<RequisitionFormModalCapabilities>(
    () => ({
      requestMaterials: async () => [
        {
          label: 'AL-BR-018 - 精密铝合金支架',
          value: 'material-demo-1',
          code: 'AL-BR-018',
          name: '精密铝合金支架',
          unit: 'piece',
          spec: '160 × 80 × 12 mm',
        },
      ],
      create: async (payload) => {
        const result = { ...requisitionRecord, id: 'requisition-created-demo-001', ...payload };
        setLastAction(`采购申请草稿已创建，${payload.items.length} 条明细`);
        return result;
      },
      update: async (payload) => ({ ...requisitionRecord, ...payload }),
      submit: async ({ id }) => ({ ...requisitionRecord, id }),
      requestLineCustomFieldSchema: async () => ({
        schemaVersion: 1,
        systemFields: [{ key: 'quantity' }],
        fields: [
          {
            fieldKey: 'deliveryCode',
            label: '交付标识',
            fieldKind: 'input',
            dataType: 'text',
            requiredPolicy: 'none',
            displayJson: { showInForm: true, sortOrder: 1, listWidth: 150 },
          },
          {
            fieldKey: 'doubleQuantity',
            label: '数量校验值',
            fieldKind: 'formula',
            dataType: 'number',
            requiredPolicy: 'none',
            displayJson: { showInForm: true, sortOrder: 2, listWidth: 150 },
          },
        ],
      }),
      previewLineCustomFields: async ({ items }) => ({
        items: items.map((item) => ({
          customComputedValues: {
            doubleQuantity: Number(item.quantity ?? 0) * 2,
          },
          customComputedErrors: {},
        })),
      }),
      notifyWarning: (text) => message.warning(text),
      notifySuccess: (text) => message.success(text),
      notifyError: (text) => message.error(text),
      onOpenCreated: (id) => setLastAction(`打开新建采购申请：${id}`),
      renderFieldHelp: ({ label }) => label,
    }),
    [message],
  );

  const drawingFilesCapabilities = useMemo(
    () => ({ pdfWorkerSrc: pdfWorkerUrl, fetchFileBlob: fetchDemoPdf }),
    [],
  );
  const quickCreateCapabilities = useMemo<NonNullable<MesUiProviderProps['masterDataQuickCreateCapabilities']>>(
    () => ({
      canCreate: (entity) => entity === 'supplier',
      renderDrawer: ({ entity, open, onOpenChange, onCreated }) => (
        <Modal
          title={entity === 'supplier' ? '新增供应商' : '新增客户'}
          open={open}
          onCancel={() => onOpenChange(false)}
          footer={null}
          destroyOnHidden
        >
          <Button
            htmlType="button"
            type="primary"
            onClick={() => {
              void onCreated({ value: 'supplier-demo-new', label: '示例供应商' });
              onOpenChange(false);
            }}
          >
            创建示例供应商
          </Button>
        </Modal>
      ),
    }),
    [],
  );
  const purchaseReceiptProviderCapabilities = useMemo<MesPurchaseReceiptCapabilities>(
    () => ({ generateSystemBatchNo: async () => ({ batchNo: 'PR-LOT-2026-018' }) }),
    [],
  );

  return (
    <MesUiProvider
      hasPermission={() => true}
      drawingFilesCapabilities={drawingFilesCapabilities}
      masterDataQuickCreateCapabilities={quickCreateCapabilities}
      purchaseReceiptCapabilities={purchaseReceiptProviderCapabilities}
      warehouseRemoteSelectCapabilities={warehouseRemoteSelectCapabilities}
      materialTablePickerCapabilities={materialTablePickerCapabilities}
      materialSelectCapabilities={materialSelectCapabilities}
    >
      <SectionCard title="采购订单视图切换与发送">
        <Space orientation="vertical" size={12}>
          <PurchaseOrderViewSwitch value={view} onChange={setView} />
          <Typography.Text type="secondary">当前视图：{view === 'orders' ? '单据' : '明细'}</Typography.Text>
          <Space wrap>
            <Button type="primary" onClick={() => setSendOpen(true)}>发送采购单</Button>
            <Button onClick={() => setReceiptOpen(true)}>采购收货</Button>
          </Space>
          <Typography.Text role="status">{lastAction}</Typography.Text>
        </Space>
      </SectionCard>
      <SectionCard title="采购申请与转单">
        <Space wrap>
          <Button type="primary" onClick={() => setCreateOpen(true)}>新建采购申请</Button>
          <Button onClick={() => setEditOpen(true)}>编辑采购申请</Button>
          <Button onClick={() => setConvertOpen(true)}>转采购订单</Button>
          <Button onClick={() => setInquiryOpen(true)}>从申请发起询价</Button>
        </Space>
      </SectionCard>
      <SendPurchaseOrderModal
        open={sendOpen}
        orderId="purchase-order-demo-018"
        orderNo="PO-2026-018"
        onOpenChange={setSendOpen}
        onSuccess={() => setLastAction('采购订单发送记录已保存')}
        capabilities={sendCapabilities}
      />
      <PurchaseReceiptActionModal<PurchaseReceiptActionReceipt>
        sourcePurchaseOrderId={receiptOpen ? 'purchase-order-demo-018' : undefined}
        onClose={() => setReceiptOpen(false)}
        onSuccess={(receipt) => setLastAction(`采购收货已保存：${receipt.id}`)}
        onPrintReceipt={(id) => setLastAction(`打印采购入库单：${id}`)}
        onOpenInspection={(id) => setLastAction(`打开来料检验：${id}`)}
        capabilities={receiptCapabilities}
      />
      <RequisitionFormModal
        open={createOpen}
        mode="create"
        canSubmit
        onOpenChange={setCreateOpen}
        onSuccess={(result) => setLastAction(`采购申请已保存：${result.id}`)}
        capabilities={requisitionCapabilities}
      />
      <RequisitionFormModal
        open={editOpen}
        mode="edit"
        requisition={requisitionRecord}
        canSubmit
        onOpenChange={setEditOpen}
        onSuccess={(result) => setLastAction(`采购申请已更新：${result.id}`)}
        capabilities={requisitionCapabilities}
      />
      <ConvertToOrderDrawer
        open={convertOpen}
        requisition={conversionRequisition}
        onOpenChange={setConvertOpen}
        onSuccess={(orders) => setLastAction(`生成 ${orders.length} 张采购订单`)}
        onRequisitionUpdated={() => setLastAction('采购申请到货日期已更新')}
        capabilities={convertCapabilities}
      />
      <CreateInquiryDrawer
        open={inquiryOpen}
        requisition={inquiryRequisition}
        onOpenChange={setInquiryOpen}
        onSuccess={() => setLastAction('采购申请询价流程已完成')}
        onOpenCreated={(id) => setLastAction(`打开询价单：${id}`)}
        capabilities={inquiryCapabilities}
      />
    </MesUiProvider>
  );
}

export function PurchaseWorkflowComponentsDemo() {
  return <PurchaseWorkflowDemoContent />;
}
