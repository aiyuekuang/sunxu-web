import { App as AntdApp, Button, Card, Space } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { BusinessUiProvider } from '../../src/business/providers/BusinessUiProvider';
import { WorkOrderBatchReportModal } from '../../src/business/domains/manufacturing/WorkOrderBatchReportModal';
import { WorkOrderMaterialShortageSection } from '../../src/business/domains/manufacturing/WorkOrderMaterialShortageSection';
import { buildTemporaryReportPortalUrl, canPrintTemporaryReportQr } from '../../src/business/domains/manufacturing/WorkOrderTemporaryReportQrPrint';
import type { MaterialShortageCapabilities, MaterialShortageSupplyOrder, WorkOrderMaterialShortageDetail } from '../../src/business/domains/manufacturing/work-order-material-shortage-types';
import type { WorkOrderBatchOperation, WorkOrderBatchReportCapabilities } from '../../src/business/domains/manufacturing/work-order-batch-report-types';
import type { WorkOrderReportScheduleSlot } from '../../src/business/domains/manufacturing/work-order-report-types';

const slot: WorkOrderReportScheduleSlot = {
  id: 'schedule-demo-1',
  plannedStart: '2026-11-21T01:00:00.000Z',
  plannedEnd: '2026-11-21T05:00:00.000Z',
  equipmentId: 'equipment-demo-1',
  equipmentName: '数控车床 01',
  splitQty: 10,
};

const operations: WorkOrderBatchOperation[] = [
  {
    id: 'operation-demo-1',
    workOrderId: 'work-order-demo-1',
    sequence: 1,
    operationName: '车削加工',
    plannedQty: 10,
    completedQty: 0,
    reportedQty: 0,
    remainingQty: 10,
    maxReportQty: 10,
    status: 'in_progress',
    operationOutputMode: 'quantity',
    timeCaptureMode: 'manual',
    equipmentType: 'lathe',
    allowedEquipmentIds: ['equipment-demo-1'],
    scheduleSlots: [slot],
  },
  {
    id: 'operation-demo-2',
    workOrderId: 'work-order-demo-1',
    sequence: 2,
    operationName: '去毛刺',
    plannedQty: 10,
    completedQty: 0,
    reportedQty: 0,
    remainingQty: 10,
    maxReportQty: 10,
    status: 'pending',
    predecessorOperationIds: ['operation-demo-1'],
    predecessorDependencies: [
      { predecessorOperationId: 'operation-demo-1', transferBatchQty: 5 },
    ],
    operationOutputMode: 'quantity',
    timeCaptureMode: 'manual',
  },
];

const shortageDetail: WorkOrderMaterialShortageDetail = {
  id: 'work-order-demo-1',
  status: 'released',
  bomHeaderId: 'bom-demo-1',
  materialId: 'material-demo-1',
  material: { id: 'material-demo-1', code: 'PART-1001', name: '安装支架', unit: 'piece' },
  plannedQty: 100,
  planStartTime: '2026-11-21T01:00:00.000Z',
  dueDate: '2026-11-30',
  priority: 5,
  customerId: 'customer-demo-1',
  customer: { id: 'customer-demo-1', name: '示例客户' },
  materialRequisitions: [
    {
      id: 'material-req-demo-1',
      materialId: 'material-demo-2',
      material: { id: 'material-demo-2', code: 'RAW-2001', name: '铝型材', spec: '20×20', unit: 'piece' },
      requiredQty: 100,
      issuedQty: 20,
      returnedQty: 0,
      issueMode: 'staged',
      warehouse: { id: 'warehouse-main', name: '原料仓' },
      lineSideWarehouse: { id: 'warehouse-line', name: '一号线边仓' },
      requiredGrade: 'A',
      requiredSupplierId: 'supplier-demo-1',
      lineCapabilities: { canChangeQuantity: true, canDelete: true, canCustomize: true },
    },
  ],
};

const supplyOrder: MaterialShortageSupplyOrder = {
  id: 'supply-demo-1',
  supplyNo: 'PS-2026-0018',
  bizType: 'replenish' as const,
  status: 'pending',
  remarks: '首批缺料补充',
  createdAt: '2026-11-20T06:30:00.000Z',
  availableActions: ['execute', 'cancel', 'reverse'],
  items: [
    {
      id: 'supply-item-demo-1',
      materialId: 'material-demo-2',
      material: { id: 'material-demo-2', code: 'RAW-2001', name: '铝型材', unit: 'piece' },
      sourceWarehouse: { id: 'warehouse-main', name: '原料仓' },
      lineSideWarehouse: { id: 'warehouse-line', name: '一号线边仓' },
      plannedQty: 20,
      actualQty: 0,
      batchNo: 'BATCH-2411',
    },
  ],
};

function WorkOrderProductionComponentsDemoContent() {
  const { message } = AntdApp.useApp();
  const [batchOpen, setBatchOpen] = useState(false);
  const batchCapabilities = useMemo<WorkOrderBatchReportCapabilities>(() => ({
    currentUser: { id: 'user-demo-1', realName: '示例操作员' },
    requestReporterOptions: async () => [{ label: '示例操作员', value: 'user-demo-1' }],
    requestAvailableEquipmentOptions: async () => [{ label: '数控车床 01（LATHE-01）', value: 'equipment-demo-1' }],
    loadCurrentEquipmentSession: async () => ({ id: 'session-demo-1', equipmentId: 'equipment-demo-1', startedAt: new Date().toISOString() }),
    uploadPhotos: async (files) => files.map((file) => file.url ?? '').filter(Boolean),
    batchReport: async ({ items }) => ({ summary: { success: items.length, failed: 0 }, results: items.map((item) => ({ operationId: item.operationId, success: true })) }),
    getAutoFieldHelpProps: (label) => ({ label }),
    getReportFieldHelpProps: (label) => ({ label }),
    formatScheduleSlotLabel: (value) => `${value.equipmentName ?? '设备'} · ${dayjs(value.plannedStart).format('MM-DD HH:mm')}–${dayjs(value.plannedEnd).format('HH:mm')}`,
    formatScheduleSlotHint: () => '计划排产实例',
    ceilAllocatedQty: (value) => Math.ceil(value),
    scrollableModalProps: { centered: true },
    getErrorMessage: (error, fallback) => error instanceof Error ? error.message : fallback,
    notify: {
      info: (text) => message.info(text),
      success: (text) => message.success(text),
      error: (text) => message.error(text),
    },
    showPartialFailure: ({ failed }) => message.warning(`示例批报有 ${failed} 道工序未完成`),
  }), [message]);

  const materialCapabilities = useMemo<MaterialShortageCapabilities>(() => ({
    permissions: {
      productionSupplyView: true,
      printJobSubmit: true,
      printJobView: true,
      productionSupplyCreate: true,
      productionSupplyExecute: true,
      productionSupplyCancel: true,
      productionSupplyReverse: true,
      materialRequirementUpdate: true,
      materialRequirementDelete: true,
      workOrderSourcingResolve: true,
      workOrderSourcingOverride: true,
      mrpListOrCalculate: true,
      planView: true,
      workOrderUpdate: true,
      planList: true,
      planCreate: true,
    },
    materialGradeLabelMap: { A: 'A级' },
    unitLabelMap: { piece: '件' },
    customFieldSchema: { schemaVersion: 1, fields: [] },
    scrollableModalProps: { centered: true },
    statusMaps: {
      plan: { released: { text: '已下达', color: 'blue' }, draft: { text: '草稿', color: 'default' } },
      issueMode: { staged: { text: '线边供料', color: 'processing' }, direct: { text: '直接供料', color: 'default' } },
      materialReady: { sufficient: { text: '已齐套', color: 'success' }, insufficient: { text: '缺料', color: 'warning' } },
      supplyStatus: { pending: { text: '待执行', color: 'warning' }, completed: { text: '已完成', color: 'success' } },
      supplyBizType: { replenish: { text: '补料' }, return: { text: '退回' } },
    },
    isMrpEligiblePlanStatus: () => true,
    statusColor: (value, map) => map[value]?.color ?? 'default',
    formatUnitLabel: (unit, labels) => (unit ? labels?.[unit] ?? unit : ''),
    normalizeDateOnlyValue: (value) => { const parsed = dayjs(value as string | Date); return parsed.isValid() ? parsed.format('YYYY-MM-DD') : undefined; },
    normalizeDatePickerValue: (value) => { const parsed = dayjs(value as string | Date); return parsed.isValid() ? parsed.format('YYYY-MM-DD') : undefined; },
    requestEffectiveRouteOptions: async () => [{ label: '标准工艺路线', value: 'route-demo-1' }],
    requestCustomerOptions: async () => [{ label: '示例客户', value: 'customer-demo-1' }],
    requestProductionPlanList: async () => ({ list: [{ id: 'plan-demo-1', planNo: 'PP-2026-0042', status: 'released', customerId: 'customer-demo-1', planStartDate: '2026-11-22', priority: 5 }] }),
    createProductionPlan: async () => ({ id: 'plan-demo-new' }),
    updateWorkOrder: async () => undefined,
    checkMaterialReadiness: async () => ({ ready: false, message: '1 种生产投入物料不足', items: [{ materialReqId: 'material-req-demo-1', sufficient: false, netRequired: 80, sourceAvailable: 18, lineSideAvailable: 4, pendingSupplyQty: 0, pendingReturnQty: 0, readyStatus: 'insufficient', nextActionHint: '线边可补料 76 件' }] }),
    listProductionSupplyOrders: async () => ({ list: [supplyOrder], total: 1 }),
    getProductionSupplyOrder: async () => supplyOrder,
    createProductionSupplyOrder: async () => undefined,
    executeProductionSupplyOrder: async () => undefined,
    cancelProductionSupplyOrder: async () => undefined,
    reverseProductionSupplyOrder: async () => undefined,
    deleteRequirementLine: async () => undefined,
    changeRequirementQuantity: async () => undefined,
    resolveWorkOrderSourcing: async () => ({ total: 1, resolved: 1, skippedIssued: 0 }),
    overrideWorkOrderSourcing: async () => undefined,
    listSupplierPriceTiers: async () => ({ list: [{ id: 'tier-demo-1', grade: 'A', supplierModelCode: 'AL-20', supplier: { name: '示例供应商' } }] }),
    requestSupplyLineCustomFieldColumns: () => [],
    buildCustomValuePayload: (carrier) => carrier?.customValues ? carrier : null,
    renderPrintActionNode: null,
    openPrintBatch: async () => undefined,
    openPrintRecords: async () => undefined,
    navigate: (path) => message.info(`示例导航：${path}`),
    getAutoFieldHelpProps: (label) => ({ label }),
    getProductionFieldHelpProps: (label) => ({ label }),
    getErrorMessage: (error, fallback) => error instanceof Error ? error.message : fallback,
    notify: {
      success: (text) => message.success(text),
      warning: (text) => message.warning(text),
      error: (text) => message.error(text),
    },
  }), [message]);

  return (
    <BusinessUiProvider
      hasPermission={() => true}
      productionBomSelectCapabilities={{
        requestOptions: async () => [{ label: 'BOM 版本 A', value: 'bom-demo-1' }],
        getFieldHelpProps: () => ({ label: 'BOM版本' }),
        renderConfigEntryFieldLabel: ({ children }) => children,
      }}
    >
      <Space orientation="vertical" size={16} style={{ display: 'flex' }}>
        <Card title="批量报工组件">
          <Button type="primary" onClick={() => setBatchOpen(true)}>打开批量报工</Button>
        </Card>
        <Card title="临时报工码打印资格">
          <div>工序 1 · 车削加工：{canPrintTemporaryReportQr(operations[0], 'released') ? '允许打印' : '当前不可打印'}</div>
          <div>扫码地址：{buildTemporaryReportPortalUrl({ token: 'demo-token', expiresAt: '2026-11-30T00:00:00.000Z' }, 'https://mes.example.com')}</div>
        </Card>
        <WorkOrderMaterialShortageSection
          detail={shortageDetail}
          onSuccess={() => message.success('示例工单已刷新')}
          capabilities={materialCapabilities}
        />
        <WorkOrderBatchReportModal
          open={batchOpen}
          workOrderId="work-order-demo-1"
          orderNo="WO-2026-0042"
          operations={operations}
          unit="件"
          onClose={() => setBatchOpen(false)}
          onSuccess={() => message.success('示例批量报工完成')}
          capabilities={batchCapabilities}
        />
      </Space>
    </BusinessUiProvider>
  );
}

export default function WorkOrderProductionComponentsDemoPage() {
  return (
    <AntdApp>
      <WorkOrderProductionComponentsDemoContent />
    </AntdApp>
  );
}
