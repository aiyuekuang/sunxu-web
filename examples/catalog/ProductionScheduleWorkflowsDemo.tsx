import { Button, Space, Tabs, Typography } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { AutoScheduleDrawer, ScheduleFromPlansDrawer } from '../../src/mes/components/ProductionScheduleExecutionDrawers';
import { BottleneckPanel, ScenarioCompare } from '../../src/mes/components/ProductionScheduleAnalysisWidgets';
import { EntryFormDrawer, EntryList } from '../../src/mes/components/ProductionScheduleEntryComponents';
import { ProductionScheduleGanttView } from '../../src/mes/components/ProductionScheduleGanttView';
import type {
  AutoScheduleCapabilities,
  BottleneckCapabilities,
  ScheduleEntryFormCapabilities,
  ScheduleFromPlansCapabilities,
  ScheduleStatus,
  ScenarioCompareCapabilities,
  ScheduleWorkOrderRow,
  SchedulePreviewResult,
} from '../../src/mes/components/production-schedule-workflows-types';
import type {
  CapacityBarCapabilities,
  GanttBarPresentation,
  GanttInspectorModel,
  GanttToolbarCapabilities,
  GanttViewState,
  UnscheduledWorkOrder,
} from '../../src/mes/components/production-schedule-planning-types';
import type { ScheduleHeatmapCapabilities } from '../../src/mes/components/production-schedule-widget-types';

const today = dayjs().startOf('day');
const scheduleState: GanttViewState = {
  startDate: today.format('YYYY-MM-DD'),
  endDate: today.add(6, 'day').format('YYYY-MM-DD'),
  zoom: 'day',
  groupBy: 'work_center',
  drillPath: [{ id: 'all', name: '全部工作中心' }],
};

const sampleWorkOrders: Array<ScheduleWorkOrderRow & UnscheduledWorkOrder> = [
  { id: 'wo-01', orderNo: 'WO-2026-0196', plannedQty: 300, planEndTime: today.add(2, 'day').format('YYYY-MM-DD'), status: 'released', executionState: 'unscheduled', routeId: 'route-assembly', material: { name: '不锈钢阀体', spec: 'DN25', unit: 'piece' } },
  { id: 'wo-02', orderNo: 'WO-2026-0197', plannedQty: 120, planEndTime: today.add(4, 'day').format('YYYY-MM-DD'), status: 'released', executionState: 'unscheduled', routeId: 'route-machining', material: { name: '连接法兰', spec: 'DN40', unit: 'piece' } },
];

const preview: SchedulePreviewResult = {
  total: 2,
  warnings: ['前置工序存在重叠风险，请核对工序顺序。'],
  appliedPolicy: { defaultBufferRatio: 0.1, allowBufferRatioOverride: true, setupRuleEnabled: true, preferSameSetupGroup: true, defaultRescheduleHorizonDays: 7, defaultRescheduleFreezeMinutes: 60, defaultRescheduleAllowAlternativeEquipment: false, defaultRescheduleAllowMoveConfirmed: false, defaultRescheduleMaxDelayMinutes: 240, defaultRescheduleMaxOverdueCount: 3, defaultRescheduleMaxReconfirmCount: 5, setupTransitionRules: [], setupStartRestriction: {}, bufferRatio: 0.1, source: 'company_default' },
  entries: [
    { workOrderId: 'wo-01', workOrderNo: 'WO-2026-0196', workOrderPlanEndTime: today.add(2, 'day').toISOString(), operationId: 'op-cut', operationName: '下料', workCenterId: 'wc-cut', workCenterName: '下料中心', equipmentId: 'eq-cut-01', equipmentName: '激光切割机 01', plannedStart: today.add(1, 'day').hour(8).toISOString(), plannedEnd: today.add(1, 'day').hour(12).toISOString(), durationMinutes: 240, isCritical: true },
    { workOrderId: 'wo-02', workOrderNo: 'WO-2026-0197', operationId: 'op-mill', operationName: '铣削', workCenterId: 'wc-mill', workCenterName: '机加工中心', plannedStart: today.add(1, 'day').hour(13).toISOString(), plannedEnd: today.add(1, 'day').hour(17).toISOString(), durationMinutes: 240, isOutsourced: false },
  ],
};

const orders = (query: { page: number; pageSize: number }): Promise<{ list: ScheduleWorkOrderRow[]; total: number }> => Promise.resolve({ list: sampleWorkOrders.slice((query.page - 1) * query.pageSize, query.page * query.pageSize), total: sampleWorkOrders.length });
const reportError = (error: unknown) => console.error(error);
const notify = (kind: 'success' | 'warning' | 'error', content: string) => {
  // The catalog leaves messaging at the host seam; replace with the application's notification service.
  console.info(kind, content);
};
const policy = { defaultBufferRatio: 0.1, allowBufferRatioOverride: true, setupRuleEnabled: true };

const autoCapabilities: AutoScheduleCapabilities = {
  canRun: true,
  loadPolicy: async () => policy,
  loadWorkOrders: async (query) => orders(query),
  preview: async () => preview,
  submit: async () => ({ total: preview.total, entries: preview.entries, appliedPolicy: preview.appliedPolicy }),
  reportError: (error) => reportError(error),
  notify,
};

const plansCapabilities: ScheduleFromPlansCapabilities = {
  ...autoCapabilities,
  canRun: true,
  loadPlans: async (query) => ({ list: [{ id: 'plan-01', planNo: 'PP-2026-0088', plannedQty: 300, priority: 8, dueDate: today.add(5, 'day').format('YYYY-MM-DD'), status: 'confirmed', material: { name: '不锈钢阀体' }, route: { code: 'ROUTE-A' }, workOrderCount: 0, activeWorkOrderCount: 0 }].filter((row) => !query.keyword || row.planNo.includes(query.keyword)), total: 1 }),
  loadPlanWorkOrders: async () => [],
  preview: async () => preview,
  submit: async () => ({ planCount: 1, workOrderCount: 1, entryCount: 2, warnings: [], appliedPolicy: preview.appliedPolicy }),
};

const bottleneckCapabilities: BottleneckCapabilities = {
  load: async (filters) => [{ workCenterId: 'wc-cut', workCenterName: '下料中心', avgUtilization: 0.82, avgOccupiedUtilization: 0.91, peakUtilization: 1.08, peakOccupiedUtilization: 1.13, peakDate: filters.endDate, occupiedPeakDate: filters.endDate, overloadDays: 1, occupiedOverloadDays: 2, totalEquipmentCount: 5, availableEquipmentCount: 4, unavailableEquipmentCount: 1, configuredConcurrency: 4, effectiveConcurrency: 3, capacityConstrainedByEquipment: true, availabilityRisk: true, scheduledWithoutCapacity: false, suggestions: ['将部分工序调整至机加工中心', '检查停机设备的维修计划'] }],
  reportError,
  getCapacityColor: (rate) => rate >= 1 ? '#cf1322' : rate >= 0.8 ? '#d48806' : '#389e0d',
};

const scenarioCapabilities: ScenarioCompareCapabilities = {
  canGenerate: true,
  canApply: true,
  loadPolicy: async () => policy,
  loadWorkOrders: async (query) => orders(query),
  preview: async () => preview,
  apply: async () => undefined,
  reportError: (error) => reportError(error),
  notify,
};

const entryFormCapabilities: ScheduleEntryFormCapabilities = {
  canCreate: true,
  canUpdate: true,
  loadPolicy: async () => policy,
  loadReleasedWorkOrders: async () => sampleWorkOrders.map((row) => ({ label: `${row.orderNo} — ${row.material?.name ?? ''}`, value: row.id })),
  resolveScannedWorkOrder: async (code) => ({ id: sampleWorkOrders.find((row) => row.orderNo === code)?.id ?? 'wo-01', status: 'released', label: 'WO-2026-0196 — 不锈钢阀体', routeId: 'route-assembly' }),
  loadWorkOrderDetail: async (id) => ({ id, orderNo: sampleWorkOrders.find((row) => row.id === id)?.orderNo ?? id, status: 'released', operations: [{ id: 'op-cut', sequence: 10, stageName: '机加工', operationName: '下料', status: 'pending', workCenterId: 'wc-cut', equipmentType: 'laser', allowedEquipmentIds: ['eq-cut-01'] }] }),
  loadWorkCenterTree: async () => [{ id: 'wc-cut', code: 'WC-CUT', name: '下料中心', isActive: true }],
  loadEquipment: async () => [{ label: '激光切割机 01', value: 'eq-cut-01' }],
  loadAssignees: async () => [{ label: '张工', value: 'user-01' }],
  create: async () => ({}), update: async () => ({}), serializeDateTime: (value) => dayjs(value).toISOString(),
  getCurrentUserId: () => 'user-01', reportError: (error) => reportError(error), notify,
};

const entryCapabilities = {
  load: async () => ({ list: [{ id: 'entry-01', status: 'scheduled' as const, workOrder: { orderNo: 'WO-2026-0196', planNo: 'PP-2026-0088', plannedQty: 300, material: { name: '不锈钢阀体', unit: 'piece' } }, operation: { operationName: '下料' }, workCenter: { name: '下料中心' }, equipment: { name: '激光切割机 01' }, assignee: { realName: '张工' }, plannedStart: today.add(1, 'day').hour(8).toISOString(), plannedEnd: today.add(1, 'day').hour(12).toISOString(), durationMinutes: 240, dependencyWarning: '前置工序即将完成' }], total: 1 }),
  confirm: async () => undefined, unconfirm: async () => undefined, unplan: async () => undefined, remove: async () => ({}),
  formatStatus: (status: ScheduleStatus) => ({ label: status === 'scheduled' ? '待确认' : status, color: status === 'scheduled' ? 'blue' : 'default' }),
  reportError: (error: unknown) => reportError(error), notify, formatUnit: (unit?: string) => unit ?? '',
  loadPolicy: async () => policy,
};

const demoEntry = { id: 'entry-01', status: 'scheduled' as const, workOrder: { orderNo: 'WO-2026-0196', planNo: 'PP-2026-0088', plannedQty: 300, material: { name: '不锈钢阀体', unit: 'piece' } }, operation: { operationName: '下料' }, workCenter: { name: '下料中心' }, equipment: { name: '激光切割机 01' }, plannedStart: today.add(1, 'day').hour(8).toISOString(), plannedEnd: today.add(1, 'day').hour(12).toISOString(), durationMinutes: 240 };
const barPresentation: GanttBarPresentation = {
  isBuffer: false, isCritical: true, isOutsourced: false, canMove: true, canResize: true, canEdit: true, hasDependencyConflict: false, hasDependencyWarning: false,
  execution: { label: '待开工', color: '#1677ff', backgroundColor: '#e6f4ff', borderColor: '#91caff', trackColor: '#69b1ff', progressColor: '#1677ff' },
  barBackgroundColor: '#e6f4ff', actualTrackColor: '#69b1ff', actualProgressColor: '#1677ff', setupBackground: 'rgba(217,130,43,.15)', setupBorderColor: '#ffd591', outsourcingColor: '#722ed1', outsourcingBackgroundColor: '#f9f0ff', criticalShadow: '0 0 0 1px rgba(212,160,23,.28)', bufferSuffix: '缓冲', scheduleStatus: { label: '待确认', color: 'blue' }, borderColor: '#91caff', borderStyle: 'solid', primaryLabel: '不锈钢阀体下料', compactPrimaryLabel: '阀体下料', secondaryLabel: '300 件 · 4小时 · 下料中心', compactSecondaryLabel: '300件 · 4时 · 下料中心', timeRangeLabel: '08:00 - 12:00', progressPercent: 0, setupFraction: 0.1, outsourcingLabel: '委外', ariaLabel: '排产条目 WO-2026-0196，下料，待确认',
};

const inspector: GanttInspectorModel = {
  kicker: '排产记录', title: 'WO-2026-0196', heroTitle: '不锈钢阀体 · 下料', heroSubtitle: '下料中心 / 激光切割机 01', status: { label: '待确认', color: 'blue' },
  sections: [{ key: 'time', title: '计划时间', fields: [{ key: 'start', label: '开始', value: dayjs(demoEntry.plannedStart).format('YYYY-MM-DD HH:mm') }, { key: 'end', label: '结束', value: dayjs(demoEntry.plannedEnd).format('YYYY-MM-DD HH:mm') }, { key: 'quantity', label: '数量', value: '300 件' }] }], footerActions: [{ key: 'edit', label: '编辑', type: 'primary' }], labels: { close: '关闭排产详情' },
};

const toolbarCapabilities: GanttToolbarCapabilities = {
  zoomOptions: [{ label: '日', value: 'day' }, { label: '周', value: 'week' }, { label: '月', value: 'month' }], groupByOptions: [{ label: '工作中心', value: 'work_center' }, { label: '设备', value: 'equipment' }], workCenterTypeOptions: [], workCenterTypeLoading: false, statusOptions: [], customerOptions: [],
  labels: { previousPeriod: '上一周期', nextPeriod: '下一周期', today: '今天', productionDate: (range) => range, dateRangeTitle: '生产日期', filters: '筛选', refresh: '刷新', export: '导出', exportTitle: '导出排产', fullscreen: '全屏', exitFullscreen: '退出全屏', unscheduled: '待排产工单', unscheduledSelected: '待排产工单', workCenterType: '工作中心类型', statusFilter: '排产状态', customer: '客户', keywordPlaceholder: '搜索工单、物料或资源', clearFilters: '清除筛选' },
  formatDateRange: (start, end) => `${start} ~ ${end}`, shiftDateWindow: (state, direction) => ({ startDate: dayjs(state.startDate).add(direction * 7, 'day').format('YYYY-MM-DD'), endDate: dayjs(state.endDate).add(direction * 7, 'day').format('YYYY-MM-DD') }), getTodayWindow: () => ({ startDate: today.format('YYYY-MM-DD'), endDate: today.add(6, 'day').format('YYYY-MM-DD') }), getZoomWindow: () => ({ startDate: today.format('YYYY-MM-DD'), endDate: today.add(6, 'day').format('YYYY-MM-DD') }),
};
const capacityCapabilities: CapacityBarCapabilities = {
  getDatePosition: (date) => dayjs(date).diff(today, 'day') * 120, getCapacityColor: (rate) => rate >= 1 ? '#cf1322' : rate >= .8 ? '#d48806' : '#389e0d', formatDuration: (minutes) => `${Math.round(minutes / 60)}小时`, warningThreshold: .8, maximumDisplayRate: 1.2,
  labels: { summaryTitle: '产能负荷', tooltipTitle: (date) => date, availableCapacity: '可用产能', plannedLoad: '计划负荷', actualOccupancy: '实际占用', noCapacityRisk: '无有效产能但存在排产', equipmentLaneNote: '设备按并发道展示', equipmentSnapshot: '设备可用', unavailableSuffix: (count) => `（${count} 台不可用）`, effectiveConcurrency: '有效并发' },
};
const heatmapCapabilities: ScheduleHeatmapCapabilities = { formatDuration: (minutes) => `${Math.round(minutes / 60)}小时`, getCapacityColor: capacityCapabilities.getCapacityColor, getHeatColor: (ratio) => ratio > .8 ? '#1677ff' : '#91caff' };

export default function ProductionScheduleWorkflowsDemo() {
  const [autoOpen, setAutoOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [ganttState, setGanttState] = useState(scheduleState);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const ganttRows = useMemo(() => [{ workCenter: { id: 'wc-cut', workCenterId: 'wc-cut', name: '下料中心', type: 'work_center' }, laneCount: 1, bars: [{ entry: demoEntry, id: demoEntry.id, left: 120, width: 480, actualWidth: 450, displayMinWidth: 64, lane: 0, color: '#1677ff', label: 'WO-2026-0196' }] }], []);
  return <Space direction="vertical" size="large" style={{ width: '100%' }}>
    <Typography.Title level={3}>生产排程组件组</Typography.Title>
    <Space wrap><Button type="primary" onClick={() => setAutoOpen(true)}>自动排产</Button><Button onClick={() => setPlansOpen(true)}>从计划排产</Button><Button onClick={() => setEntryOpen(true)}>手工排产</Button></Space>
    <Tabs items={[
      { key: 'analysis', label: '瓶颈与方案', children: <Space direction="vertical" style={{ width: '100%' }}><BottleneckPanel capabilities={bottleneckCapabilities} /><ScenarioCompare onApply={() => undefined} capabilities={scenarioCapabilities} /></Space> },
      { key: 'entries', label: '排产列表', children: <EntryList onEdit={() => setEntryOpen(true)} onRefresh={() => undefined} refreshKey={0} canUpdate canDelete capabilities={entryCapabilities} /> },
      { key: 'gantt', label: '甘特图', children: <div style={{ height: 560 }}><ProductionScheduleGanttView state={ganttState} onStateChange={(patch) => setGanttState((current) => ({ ...current, ...patch }))} refreshKey={0} loading={false} rows={ganttRows} cells={Array.from({ length: 7 }, (_, index) => { const date = today.add(index, 'day'); return { date: date.format('YYYY-MM-DD'), label: date.format('DD ddd'), isWeekend: date.day() === 0 || date.day() === 6, isToday: date.isSame(today, 'day') }; })} cellWidth={120} timelineWidth={840} timelineStart={today} timelineEnd={today.add(6, 'day').endOf('day')} selectedEntryId={selectedEntry} canUpdate onSelectEntry={(entry) => setSelectedEntry(entry?.id ?? null)} onEditEntry={() => setEntryOpen(true)} onRefresh={() => undefined} onExport={() => undefined} getBarPresentation={() => barPresentation} getTooltipModel={() => ({ kind: 'schedule', rows: [{ key: 'work-order', label: '工单号', value: 'WO-2026-0196' }, { key: 'operation', label: '工序', value: '下料' }] })} getInspectorModel={() => inspector} getContextMenuItems={() => [{ key: 'edit', label: '编辑' }]} onContextAction={() => setEntryOpen(true)} onInspectorAction={() => setEntryOpen(true)} capacityData={[{ date: today.format('YYYY-MM-DD'), totalMinutes: 2400, scheduledMinutes: 1960, occupiedMinutes: 2180, utilizationRate: .82, occupiedUtilizationRate: .91, configuredConcurrency: 4, effectiveConcurrency: 3, totalEquipmentCount: 5, availableEquipmentCount: 4, unavailableEquipmentCount: 1 }]} capacityCapabilities={capacityCapabilities} heatmapCapabilities={heatmapCapabilities} toolbarCapabilities={toolbarCapabilities} unscheduledCapabilities={{ loadWorkOrders: async () => sampleWorkOrders, beginScheduleDrag: () => undefined, formatUnit: (unit) => unit ?? '', formatDueDate: (date) => date, activateWorkOrder: () => setEntryOpen(true), reportLoadError: reportError, labels: { title: '待排产工单', searchPlaceholder: '搜索工单', empty: '没有待排产工单', sourceRemark: '来源备注', scheduleAction: '手工排产' } }} onDragStart={() => undefined} onDragCommit={() => undefined} onInteractionWarning={() => undefined} getDatePosition={(date) => dayjs(date).diff(today, 'hour') * 5} getDateAtPosition={(position) => today.add(Math.floor(position / 120), 'day').format('YYYY-MM-DD HH:mm')} getDroppedWorkOrderId={(transfer) => transfer.getData('text/plain')} restoreContextMenuFocus={() => undefined} /></div> },
    ]} />
    <AutoScheduleDrawer open={autoOpen} onClose={() => setAutoOpen(false)} onSuccess={() => setAutoOpen(false)} onViewResult={() => undefined} capabilities={autoCapabilities} />
    <ScheduleFromPlansDrawer open={plansOpen} onClose={() => setPlansOpen(false)} onSuccess={() => setPlansOpen(false)} capabilities={plansCapabilities} />
    <EntryFormDrawer open={entryOpen} onOpenChange={setEntryOpen} editingEntry={null} onSuccess={() => setEntryOpen(false)} capabilities={entryFormCapabilities} />
  </Space>;
}
