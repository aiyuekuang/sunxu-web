import { useState } from 'react';
import { Button, Space } from 'antd';
import { SectionCard } from '../../src';
import { TraceTimelineDrawer } from '../../src/business';
import type {
  TraceGraph,
  TraceTimelineCapabilities,
  TraceIdentifierType,
} from '../../src/business';

const demoStatuses = {
  pending: { text: '待处理', status: 'Warning' },
  in_progress: { text: '进行中', status: 'Processing' },
  completed: { text: '已完成', status: 'Success' },
  pass: { text: '合格', status: 'Success' },
  visual: { text: '外观检验', status: 'Default' },
  submitted: { text: '已提交', status: 'Processing' },
  inbound: { text: '入库', status: 'Success' },
} as const;

const demoGraph: TraceGraph = {
  root: {
    id: 'batch:lot-2026-018',
    type: 'batch',
    title: 'LOT-2026-018',
    status: 'completed',
    occurredAt: '2026-11-19T08:30:00+08:00',
    qty: 64,
    unit: '件',
  },
  nodes: [
    {
      id: 'batch:lot-2026-018',
      type: 'batch',
      title: 'LOT-2026-018',
      status: 'completed',
      occurredAt: '2026-11-19T08:30:00+08:00',
      qty: 64,
      unit: '件',
    },
    {
      id: 'work-order:wo-2026-081',
      type: 'work_order',
      title: 'WO-2026-081',
      status: 'completed',
      occurredAt: '2026-11-18T09:00:00+08:00',
      context: {
        man: [{ role: 'operator', label: '张师傅' }],
        machine: [{ role: 'equipment', label: 'CNC-04' }],
      },
    },
    {
      id: 'quality:inspection-018',
      type: 'quality_inspection',
      title: '首件检验',
      subtitle: 'visual',
      status: 'pass',
      occurredAt: '2026-11-18T10:15:00+08:00',
      remarks: '外观和关键尺寸符合图纸要求。',
      context: {
        measurement: [{ label: '长度', measuredValue: '120', unit: 'mm', passed: true }],
      },
    },
  ],
  edges: [
    { from: 'work-order:wo-2026-081', to: 'batch:lot-2026-018', label: '产出' },
    { from: 'quality:inspection-018', to: 'batch:lot-2026-018', label: '检验' },
  ],
  summary: { batchCount: 1, workOrderCount: 1, qualityCount: 1, customerCount: 0 },
  warnings: [],
};

const traceCapabilities: TraceTimelineCapabilities = {
  loadBatchByNumber: async ({ batchNo }) => ({
    id: 'batch:lot-2026-018',
    batchNo,
    status: 'completed',
    qty: 64,
    material: { name: '精密铝合金支架', code: 'AL-BR-018', spec: '120 × 40 mm', unit: '件' },
    warehouse: { name: '成品仓' },
  }),
  loadBatchGraph: async () => demoGraph,
  loadSerialTrace: async ({ serialNo }) => ({
    serialNo,
    status: 'inbound',
    batchId: 'batch:lot-2026-018',
    batchNo: 'LOT-2026-018',
    material: { name: '精密铝合金支架', code: 'AL-BR-018', spec: '120 × 40 mm', unit: '件' },
    workOrder: { orderNo: 'WO-2026-081' },
    warehouse: { name: '成品仓' },
    sourceDemand: { sourceType: 'sales_order', sourceOrderNo: 'SO-2026-061', demandLineNo: 2 },
    productionReport: {
      reportLogId: 'report-log:018',
      occurredAt: '2026-11-18T09:30:00+08:00',
      operationName: '精加工',
      scrappedQty: 0,
      equipmentName: 'CNC-04',
      remarks: '尺寸复核完成。',
    },
    productionReceipt: { receiptNo: 'PR-2026-028', confirmedAt: '2026-11-19T08:30:00+08:00' },
    shipments: [],
    movements: [
      {
        id: 'movement:018',
        movementType: 'received',
        fromStatus: 'produced',
        toStatus: 'inbound',
        referenceType: 'production_receipt_order',
        referenceId: 'PR-2026-028',
        batchNo: 'LOT-2026-018',
        createdAt: '2026-11-19T08:30:00+08:00',
      },
      {
        id: 'movement:017',
        movementType: 'produced',
        toStatus: 'produced',
        referenceType: 'work_order_report_log',
        referenceId: 'report-log:018',
        batchNo: 'LOT-2026-018',
        createdAt: '2026-11-18T09:30:00+08:00',
      },
    ],
  }),
  dictionaries: {
    status: {
      batch: demoStatuses,
      workOrder: demoStatuses,
      operation: demoStatuses,
      inspection: demoStatuses,
      disposal: demoStatuses,
      productionScrap: demoStatuses,
      packageUnit: demoStatuses,
      saleDelivery: demoStatuses,
      inspectionType: demoStatuses,
      disposalType: demoStatuses,
      packageType: demoStatuses,
    },
    eventLabels: { received: '生产入库', produced: '生产报工', scrapped: '生产报废' },
    serialStatusLabels: { inbound: '已入库', produced: '已生产' },
    reportLogTypeLabels: { completed: '报工完成' },
    serialReferenceLabels: {
      production_receipt_order: '生产入库单',
      work_order_report_log: '报工记录',
    },
    batchGraphEventTypes: new Set(['batch', 'work_order', 'quality_inspection']),
    unknownStatus: '未知状态',
    unknownType: '未知类型',
    unknownInspectionType: '未知检验类型',
    unknownDisposalType: '未知处置类型',
    unknownPackageType: '未知包装类型',
    unknownReference: '未知来源',
    pendingDisposalLabel: '待判定处置',
  },
  formatDateTimeSeconds: (value) => new Date(value).toLocaleString('zh-CN', { hour12: false }),
  formatUnitLabel: (unit) => unit ?? '件',
};

export function TraceTimelineDrawerDemo() {
  const [open, setOpen] = useState(false);
  const [identifierType, setIdentifierType] = useState<TraceIdentifierType>('batch');

  const showTrace = (type: TraceIdentifierType) => {
    setIdentifierType(type);
    setOpen(true);
  };

  return (
    <>
      <SectionCard title="批号与成品追溯">
        <Space wrap>
          <Button type="primary" onClick={() => showTrace('batch')}>
            查看批号追溯
          </Button>
          <Button onClick={() => showTrace('serial')}>
            查看成品序列号追溯
          </Button>
        </Space>
      </SectionCard>
      <TraceTimelineDrawer
        open={open}
        initialIdentifierType={identifierType}
        initialIdentifier={identifierType === 'batch' ? 'LOT-2026-018' : 'SN-2026-018'}
        onClose={() => setOpen(false)}
        capabilities={traceCapabilities}
      />
    </>
  );
}
