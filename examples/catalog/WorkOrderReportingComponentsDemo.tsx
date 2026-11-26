import { App as AntdApp, Button, Card, Space, Typography } from 'antd';
import { useState } from 'react';
import { MesUiProvider } from '../../src/business/MesUiProvider';
import { WorkOrderFormDrawer } from '../../src/business/components/WorkOrderFormDrawer';
import {
  WorkOrderRiskTags,
  WorkOrderListProgress,
} from '../../src/business/components/WorkOrderListExecutionSummary';
import { WorkOrderReportDirectModal } from '../../src/business/components/WorkOrderReportDirectModal';
import { WorkOrderReportModal } from '../../src/business/components/WorkOrderReportModal';
import type { MesBomCostSnapshotCapabilities } from '../../src/business/components/bom-cost-types';
import type { MesDrawingFilesCapabilities } from '../../src/business/components/drawing-files-types';
import type { MesMaterialSelectCapabilities } from '../../src/business/components/material-select-types';
import type { MesProductionBomSelectCapabilities } from '../../src/business/components/production-bom-select-types';
import type { WorkOrderFormDrawerCapabilities } from '../../src/business/components/work-order-form-types';
import type {
  WorkOrderDemandAllocation,
  WorkOrderOperation,
  WorkOrderReportCapabilities,
  WorkOrderReportScheduleSlot,
  WorkOrderSelectRequest,
} from '../../src/business/components/work-order-report-types';

const demandAllocations: WorkOrderDemandAllocation[] = [
  {
    allocationId: 'allocation-demo-1',
    demandLineId: 'demand-demo-1',
    demandLineNo: 1,
    sourceType: 'sale_order',
    sourceOrderNo: 'SO-2026-0018',
    sourceRemarkSnapshot: '首批优先交付',
    saleOrderId: 'sale-demo-1',
    saleOrderItemId: 'sale-item-demo-1',
    customerMaterialCode: 'CUS-PART-018',
    customerMaterialName: '定位支架',
    materialCode: 'PART-018',
    materialName: '定位支架',
    drawingUrls: [],
    customerId: 'customer-demo-1',
    customerName: '示例客户',
    dueDate: '2026-11-30',
    demandStatus: 'active',
    productionRequiredQty: 120,
    allocatedRequiredQty: 80,
    allocatedPlannedQty: 80,
    completedGoodQty: 12,
    scrappedQty: 1,
    fulfilledQty: 13,
    createdAt: '2026-11-10T02:00:00.000Z',
  },
  {
    allocationId: 'allocation-demo-2',
    demandLineId: 'demand-demo-2',
    demandLineNo: 2,
    sourceType: 'sale_order',
    sourceOrderNo: 'SO-2026-0021',
    saleOrderId: 'sale-demo-2',
    saleOrderItemId: 'sale-item-demo-2',
    materialCode: 'PART-018',
    materialName: '定位支架',
    drawingUrls: [],
    customerId: 'customer-demo-2',
    customerName: '另一示例客户',
    dueDate: '2026-12-04',
    demandStatus: 'active',
    productionRequiredQty: 40,
    allocatedRequiredQty: 40,
    allocatedPlannedQty: 40,
    completedGoodQty: 0,
    scrappedQty: 0,
    fulfilledQty: 0,
    createdAt: '2026-11-11T02:00:00.000Z',
  },
];

const scheduleSlots: WorkOrderReportScheduleSlot[] = [
  {
    id: 'schedule-demo-1',
    plannedStart: '2026-11-20T01:00:00.000Z',
    plannedEnd: '2026-11-20T05:00:00.000Z',
    status: 'scheduled',
    runtimeStatus: 'planned',
    equipmentId: 'equipment-demo-1',
    equipmentName: '数控车床 01',
    splitQty: 60,
    durationMinutes: 240,
    isFirm: true,
  },
  {
    id: 'schedule-demo-2',
    plannedStart: '2026-11-20T05:00:00.000Z',
    plannedEnd: '2026-11-20T09:00:00.000Z',
    status: 'scheduled',
    runtimeStatus: 'planned',
    equipmentId: 'equipment-demo-2',
    equipmentName: '数控车床 02',
    splitQty: 60,
    durationMinutes: 240,
    isFirm: false,
    reconfirmRequired: true,
    firmReason: '请确认设备和人员安排',
  },
];

const operation: WorkOrderOperation & { scheduleSlots: WorkOrderReportScheduleSlot[] } = {
  id: 'operation-demo-1',
  workOrderId: 'work-order-demo-1',
  sequence: 1,
  operationName: '车削加工',
  processOperationId: 'process-operation-demo-1',
  assigneeId: 'user-demo-1',
  assignee: { id: 'user-demo-1', realName: '李师傅' },
  plannedQty: 120,
  completedQty: 12,
  scrappedQty: 1,
  operationOutputMode: 'quantity_time',
  operationReportAffectsOutput: true,
  operationReportUnit: 'piece',
  operationReportBaseProductQty: 1,
  operationReportTargetQty: 120,
  operationReportRemainingQty: 107,
  operationReportReportedQty: 13,
  payModeSnapshot: 'piece',
  payPreview: { amount: 240, unit: '件' },
  timeCaptureMode: 'session_optional',
  allowZeroQuantityReport: false,
  maxReportQty: 120,
  workCenterId: 'turning-center-demo',
  equipmentType: 'lathe',
  allowedEquipmentIds: ['equipment-demo-1', 'equipment-demo-2'],
  scheduleSlots,
  executionCapability: {
    canRecord: true,
    maxAllowedQty: 60,
    inputScale: 2,
    isTerminalOperation: false,
  },
};

const knownUsers = [
  { label: '李师傅', value: 'user-demo-1' },
  { label: '当前用户（示例）', value: 'user-demo-2' },
];
const knownEquipment = [
  { label: '数控车床 01（LATHE-01）', value: 'equipment-demo-1' },
  { label: '数控车床 02（LATHE-02）', value: 'equipment-demo-2' },
];

const requestUsers: WorkOrderSelectRequest = async () => knownUsers;
const requestEquipment: WorkOrderSelectRequest = async () => knownEquipment;

const reportCapabilities: WorkOrderReportCapabilities = {
  currentUser: { id: 'user-demo-2', realName: '示例操作员' },
  operationUnitOptions: [
    { label: '件', value: 'piece' },
    { label: '公斤', value: 'kg' },
  ],
  operationUnitLoading: false,
  operationUnitLabelMap: { piece: '件', kg: '公斤' },
  materialUnitLabelMap: { piece: '件', kg: '公斤' },
  outputModeLabels: {
    quantity: { text: '产量报工', color: 'blue' },
    quantity_time: { text: '产量与工时', color: 'cyan' },
    execution_quantity: { text: '执行量记录', color: 'purple' },
    non_output_execution: { text: '非产量执行', color: 'default' },
  },
  payModeLabels: {
    none: { text: '不计件', color: 'default' },
    piece: { text: '计件', color: 'green' },
    time: { text: '计时', color: 'gold' },
  },
  timeCaptureModeLabels: {
    manual: { text: '手工填写', color: 'default' },
    session_optional: { text: '关联上机会话', color: 'blue' },
    session_required: { text: '必须上机', color: 'orange' },
    iot: { text: '设备采集', color: 'purple' },
  },
  reportTimeSourceOptions: [
    { label: '手工填写', value: 'manual' },
    { label: '当前上机会话', value: 'session' },
    { label: '设备采集', value: 'iot' },
    { label: '系统推导', value: 'derived' },
  ],
  formatUnitLabel: (unit, labels) =>
    (unit && labels?.[unit]) || unit || '件',
  convertOperationQtyToProductQty: (qty) => qty,
  convertProductQtyToOperationQty: (qty) => qty,
  getOperationReportUnitLabel: (item, productUnit, maps) =>
    maps?.operationUnitLabelMap[item.operationReportUnit ?? ''] ??
    item.operationReportUnit ??
    (productUnit && maps?.productUnitLabelMap[productUnit]) ??
    productUnit ??
    '件',
  buildOperationReportSummary: (item, productUnit) =>
    `目标 ${item.operationReportTargetQty ?? item.plannedQty ?? 0} ${productUnit ?? '件'}`,
  formatPayPreviewText: (value) =>
    value && typeof value === 'object' ? '预计计件金额 ¥240' : '—',
  formatScheduleSlotLabel: (slot) =>
    `${slot.equipmentName ?? '设备'} · ${slot.plannedStart.slice(11, 16)}–${slot.plannedEnd.slice(11, 16)}`,
  formatScheduleSlotHint: (slot) => slot.firmReason ?? '',
  formatReportMinutesDaysHint: (minutes) =>
    minutes >= 1440 ? `${Math.floor(minutes / 1440)} 天` : `${Math.ceil(minutes / 60)} 小时`,
  reasonableReportMinutesMax: 1440,
  statusColor: (value, map) => map[value]?.color ?? map[value]?.status ?? 'default',
  toStatusOptions: (map) =>
    Object.entries(map).map(([value, item]) => ({ label: item.text, value })),
  getAutoFieldHelpProps: (label) => ({ label }),
  getReportFieldHelpProps: (label) => ({ label }),
  scrollableModalProps: { destroyOnHidden: true, mask: { closable: false } },
  requestReporterOptions: requestUsers,
  requestAvailableEquipmentOptions: requestEquipment,
  loadCurrentEquipmentSession: async () => ({
    id: 'session-demo-1',
    equipmentId: 'equipment-demo-1',
    startedAt: '2026-11-20T01:00:00.000Z',
  }),
  loadDemandAllocations: async () => demandAllocations,
  reportOperation: async () => ({ toolingLifeWarnings: [{ message: '刀具寿命接近阈值' }] }),
  endSessionAndReportOperation: async () => ({ toolingLifeWarnings: [] }),
  recordOperationExecution: async () => undefined,
  reportDirect: async () => undefined,
  uploadPhotos: async (files) => files.map((file) => file.url ?? 'https://demo.invalid/scrap-photo.jpg'),
  previewScrapPolicy: async ({ scrappedQty }) =>
    scrappedQty > 0
      ? {
          matched: true,
          policyName: '示例报废取证策略',
          requiresPhoto: true,
          requiresQualityJudgement: false,
          requiresRootCause: false,
          holdBatch: false,
          actionMessage: '本次报废需要留存照片',
        }
      : null,
  getErrorMessage: (_error, fallback) => fallback,
  reportSuccessMessage: '报工已保存（示例）',
  stockLocationCapabilities: {
    canAccessLocations: true,
    requestCacheScope: 'work-order-report-demo',
    requestPrecheck: async ({ action, warehouseId }) => ({
      action,
      warehouseId,
      locationControlMode: 'required',
      locationRequired: true,
      warnings: [],
      blockers: [],
    }),
    requestDistribution: async () => ({
      locations: [{ locationId: 'location-demo-1', locationCode: 'A-01-02', locationName: '货架 A-01-02', availableQty: 50 }],
    }),
    requestLocationList: async () => ({
      list: [{ id: 'location-demo-1', name: '货架 A-01-02', pathName: '成品仓 / A区 / A-01-02', allowStock: true, isActive: true }],
    }),
    requestLocationTree: async () => [
      { id: 'location-demo-1', name: '货架 A-01-02', pathName: '成品仓 / A区 / A-01-02', allowStock: true, isActive: true },
    ],
    filterDisplayBlockers: (blockers) => blockers,
    renderConfigEntryFieldLabel: ({ children, show, onOpen }) =>
      show ? <Button type="link" size="small" onClick={onOpen}>{children}</Button> : children,
  },
  productionBatchNoCapabilities: {
    loadOptions: async () => ({
      batchRequired: true,
      suggestedBatchNo: 'BATCH-2026-1120',
      options: [
        { batchNo: 'BATCH-2026-1120', source: 'current', reportedQty: 12, hasOutput: true },
        { batchNo: 'BATCH-2026-1119', source: 'inherited', sourceWorkOrderNo: 'WO-2026-0008', reportedQty: 20, hasOutput: true },
      ],
    }),
    choosePreferredBatchNo: (options) => options.suggestedBatchNo,
    getErrorMessage: (_error, fallback) => fallback,
    getFieldHelpProps: (label) => ({ label }),
    maxBatchNoLength: 64,
  },
  allocatedSerialCapabilities: {
    listSerialsForWorkOrder: async () => [
      { id: 'serial-demo-1', serialNo: 'SN-000018', status: 'pending', batchNo: 'BATCH-2026-1120' },
      { id: 'serial-demo-2', serialNo: 'SN-000019', status: 'pending', batchNo: 'BATCH-2026-1120' },
    ],
    getErrorMessage: (_error, fallback) => fallback,
    statusLabels: {
      pending: { label: '待报工', color: 'blue' },
      reported: { label: '已报工', color: 'green' },
      scrapped: { label: '已报废', color: 'red' },
    },
    allocatedStatus: 'pending',
  },
};

const materialSelectCapabilities: MesMaterialSelectCapabilities = {
  baseTypeOptions: [{ label: '成品', value: 'finished' }],
  unitLabelMap: { piece: '件' },
  requestFamilies: async () => [],
  requestCategories: async () => [],
  findMaterialByBarcode: async ({ barcode }) => ({ id: barcode, code: barcode }),
  registerScanGun: () => () => undefined,
  loadSelectorCustomFields: async () => [],
  renderConfigEntryLabel: ({ children, show, onOpen }) =>
    show ? <Button type="link" size="small" onClick={onOpen}>{children}</Button> : children,
};

const productionBomSelectCapabilities: MesProductionBomSelectCapabilities = {
  requestOptions: async () => [{ label: 'BOM-018 · 当前版本', value: 'bom-demo-1' }],
  getFieldHelpProps: () => ({ label: 'BOM 版本' }),
  renderConfigEntryFieldLabel: ({ children, show, onOpen }) =>
    show ? <Button type="link" size="small" onClick={onOpen}>{children}</Button> : children,
};

const bomCostSnapshotCapabilities: MesBomCostSnapshotCapabilities = {
  requestCostPreview: async () => ({ snapshot: { lines: [] } }),
  unitLabelMap: { piece: '件' },
};

const drawingFilesCapabilities: MesDrawingFilesCapabilities = {
  uploadFiles: async () => ({ urls: ['https://demo.invalid/work-order-drawing.pdf'] }),
  fetchFileBlob: async () => new Blob(),
  downloadUrl: async () => undefined,
  resolveFileDisplayNames: async (urls) =>
    Object.fromEntries(urls.map((url) => [url, '工单专用图纸.pdf'])),
  downloadBlob: () => undefined,
};

const formDrawerCapabilities: WorkOrderFormDrawerCapabilities = {
  currentUser: { id: 'user-demo-2', realName: '示例操作员' },
  requirePlanStartTimeOnManualCreate: false,
  getAutoFieldHelpProps: (label) => ({ label }),
  getProductionFieldHelpProps: (label) => ({ label }),
  requestMaterialOptions: async () => [
    { label: 'PART-018 - 定位支架', value: 'material-demo-1', code: 'PART-018', name: '定位支架', unit: 'piece' },
  ],
  requestRouteOptions: async () => [{ label: '定位支架加工路线', value: 'route-demo-1' }],
  requestCustomerOptions: async () => [
    { label: '示例客户（CUS-01）', value: 'customer-demo-1' },
    { label: '另一示例客户（CUS-02）', value: 'customer-demo-2' },
  ],
  requestUserOptions: requestUsers,
  requestReceiptWarehouseOptions: async () => [
    { label: '成品仓（FG-01）', value: 'warehouse-demo-1' },
  ],
  renderConfigEntryFieldLabel: ({ children, show, onOpen }) =>
    show ? <Button type="link" size="small" onClick={onOpen}>{children}</Button> : children,
  openConfiguration: () => undefined,
  createWorkOrder: async () => ({ id: 'work-order-created-demo' }),
  updateWorkOrder: async () => undefined,
  getWorkOrderDetailsHref: (id) => `/demo/work-orders/${id}`,
  openWorkOrderDetails: (id) => console.info('打开示例工单', id),
  getErrorMessage: (_error, fallback) => fallback,
};

const demoRecord = {
  id: 'work-order-demo-1',
  status: 'draft',
  materialId: 'material-demo-1',
  material: { id: 'material-demo-1' },
  plannedQty: 120,
  priority: 7,
  planStartTime: '2026-11-20T00:00:00.000Z',
  planEndTime: '2026-11-27T00:00:00.000Z',
  routeId: 'route-demo-1',
  bomHeaderId: 'bom-demo-1',
  assigneeId: 'user-demo-1',
  assignee: { id: 'user-demo-1', realName: '李师傅' },
  customerId: 'customer-demo-1',
  customer: { id: 'customer-demo-1' },
  receiptWarehouseId: 'warehouse-demo-1',
  dueDate: '2026-11-30',
  drawingUrls: [],
  description: '示例工单，用于展示草稿编辑态。',
  plan: { saleOrderId: 'sale-demo-1', saleOrderItemId: 'sale-item-demo-1' },
};

function WorkOrderReportingComponentsDemoContent() {
  const { message } = AntdApp.useApp();
  const [reportOpen, setReportOpen] = useState(false);
  const [directReportOpen, setDirectReportOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  return (
    <MesUiProvider
      hasPermission={() => true}
      materialSelectCapabilities={materialSelectCapabilities}
      drawingFilesCapabilities={drawingFilesCapabilities}
      productionBomSelectCapabilities={productionBomSelectCapabilities}
      bomCostSnapshotCapabilities={bomCostSnapshotCapabilities}
    >
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        <Typography.Title level={4}>工单报工与表单</Typography.Title>
        <Card title="工单列表摘要">
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            <WorkOrderRiskTags
              record={{
                isOverdue: true,
                riskSummary: {
                  tags: ['overdue', 'material_shortage', 'schedule_unconfirmed'],
                  overdueMinutes: 1760,
                  dueInMinutes: -1760,
                },
              }}
            />
            <WorkOrderListProgress
              record={{
                overallProgress: 34,
                progressSummary: {
                  overallPercent: 34,
                  completedOperationCount: 1,
                  operationCount: 4,
                  currentOperationIds: ['operation-demo-1'],
                  nodes: [
                    { operationId: 'operation-demo-1', operationName: '车削加工', sequence: 1, percent: 34, reportedQty: 40, plannedQty: 120, status: 'in_progress' },
                    { operationId: 'operation-demo-2', operationName: '去毛刺', sequence: 2, percent: 0, reportedQty: 0, plannedQty: 120, status: 'pending' },
                    { operationId: 'operation-demo-3', operationName: '清洗', sequence: 3, percent: 0, reportedQty: 0, plannedQty: 120, status: 'blocked' },
                    { operationId: 'operation-demo-4', operationName: '检验', sequence: 4, percent: 0, reportedQty: 0, plannedQty: 120, status: 'skipped' },
                  ],
                },
              }}
            />
          </Space>
        </Card>
        <Card title="打开示例交互">
          <Space wrap>
            <Button type="primary" onClick={() => setReportOpen(true)}>工序报工</Button>
            <Button onClick={() => setDirectReportOpen(true)}>整单报工</Button>
            <Button onClick={() => setCreateDrawerOpen(true)}>新建工单</Button>
            <Button onClick={() => setEditDrawerOpen(true)}>编辑草稿工单</Button>
          </Space>
        </Card>
      </Space>
      <WorkOrderReportModal
        open={reportOpen}
        op={operation}
        operations={[operation]}
        productUnit="piece"
        demandAllocations={demandAllocations}
        materialId="material-demo-1"
        traceabilityMode="batch"
        customerId="customer-demo-1"
        currentReceiptWarehouse={{ id: 'warehouse-demo-1', name: '成品仓', code: 'FG-01' }}
        receiptWarehouseCandidates={[{ id: 'warehouse-demo-1', name: '成品仓', code: 'FG-01' }]}
        onClose={() => setReportOpen(false)}
        onSuccess={() => {
          setReportOpen(false);
          void message.success('工序报工示例已完成');
        }}
        capabilities={reportCapabilities}
      />
      <WorkOrderReportDirectModal
        open={directReportOpen}
        workOrderId="work-order-demo-1"
        orderNo="WO-2026-0018"
        remainQty={107}
        unit="piece"
        materialId="material-demo-1"
        traceabilityMode="serial"
        customerId="customer-demo-1"
        demandAllocations={demandAllocations}
        scheduleSlots={scheduleSlots}
        currentReceiptWarehouse={{ id: 'warehouse-demo-1', name: '成品仓', code: 'FG-01' }}
        receiptWarehouseCandidates={[{ id: 'warehouse-demo-1', name: '成品仓', code: 'FG-01' }]}
        onClose={() => setDirectReportOpen(false)}
        onSuccess={() => {
          setDirectReportOpen(false);
          void message.success('整单报工示例已完成');
        }}
        capabilities={reportCapabilities}
      />
      <WorkOrderFormDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        record={null}
        onSuccess={() => void message.success('新建工单示例已完成')}
        capabilities={formDrawerCapabilities}
      />
      <WorkOrderFormDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        record={demoRecord}
        onSuccess={() => void message.success('工单编辑示例已完成')}
        capabilities={formDrawerCapabilities}
      />
    </MesUiProvider>
  );
}

/** @sunxu-layer business @sunxu-domain manufacturing @sunxu-reason Demonstrates injected work-order report, form, risk, and progress interactions without services. */
export function WorkOrderReportingComponentsDemo() {
  return (
    <AntdApp>
      <WorkOrderReportingComponentsDemoContent />
    </AntdApp>
  );
}
