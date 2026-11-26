import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { Alert, Button, Space, Typography } from 'antd';
import { useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { SectionCard } from '../../src';
import { BatchReleaseModal } from '../../src/business/components/BatchReleaseModal';
import {
  CapacityBar,
  GanttBar,
  GanttContextMenu,
  GanttInspector,
  GanttToolbar,
  UnscheduledPanel,
} from '../../src/business/components/ProductionSchedulePlanningWidgets';
import type {
  BatchReleaseCapabilities,
  CapacityBarCapabilities,
  CapacitySummaryPoint,
  GanttBarLayout,
  GanttBarPresentation,
  GanttContextMenuCapabilities,
  GanttDragKind,
  GanttInspectorModel,
  GanttMenuAction,
  GanttToolbarCapabilities,
  GanttViewState,
  UnscheduledPanelCapabilities,
} from '../../src/business/components/production-schedule-planning-types';

interface DemoScheduleEntry {
  id: string;
  orderNo: string;
}

const initialState: GanttViewState = {
  startDate: '2026-11-16',
  endDate: '2026-11-22',
  zoom: 'day',
  groupBy: 'work_center',
  drillPath: [
    { id: 'root', name: '全部工作中心' },
    { id: 'wc-assembly', name: '装配车间' },
  ],
};

const sampleEntry: DemoScheduleEntry = {
  id: 'schedule-entry-01',
  orderNo: 'WO-2026-0196',
};

const demoBarLayout: GanttBarLayout<DemoScheduleEntry> = {
  entry: sampleEntry,
  id: sampleEntry.id,
  left: 120,
  width: 360,
  actualWidth: 330,
  displayMinWidth: 80,
  lane: 0,
  color: '#1677ff',
  label: '不锈钢阀体装配',
};

const demoBarPresentation: GanttBarPresentation = {
  isBuffer: false,
  isCritical: false,
  isOutsourced: false,
  canMove: true,
  canResize: true,
  canEdit: true,
  hasDependencyConflict: false,
  hasDependencyWarning: true,
  execution: {
    label: '待开工',
    color: '#1677ff',
    backgroundColor: '#e6f4ff',
    borderColor: '#91caff',
    trackColor: '#69b1ff',
    progressColor: '#1677ff',
  },
  barBackgroundColor: '#e6f4ff',
  actualTrackColor: '#69b1ff',
  actualProgressColor: '#1677ff',
  setupBackground:
    'repeating-linear-gradient(135deg, rgba(217,130,43,0.22) 0 5px, rgba(217,130,43,0.11) 5px 10px)',
  setupBorderColor: '#ffd591',
  outsourcingColor: '#722ed1',
  outsourcingBackgroundColor: '#f9f0ff',
  criticalShadow: '0 0 0 1px rgba(212,160,23,0.28), 0 4px 12px rgba(212,160,23,0.2)',
  bufferSuffix: '缓冲',
  scheduleStatus: { label: '待确认', color: '#1677ff' },
  borderColor: '#91caff',
  borderStyle: 'dashed',
  dependencyBadgeLabel: '依赖提醒',
  dependencyExplanation: '前置工序即将完成，请确认开始时间。',
  primaryLabel: '不锈钢阀体装配',
  compactPrimaryLabel: '不锈钢阀体',
  secondaryLabel: '300 件 · 8小时 · 装配线 A',
  compactSecondaryLabel: '300件 · 8时 · 装配线A',
  timeRangeLabel: '08:00 - 16:00',
  durationOrderLabel: 'WO-2026-0196',
  progressPercent: 42,
  setupFraction: 0.12,
  outsourcingLabel: '委外',
  ariaLabel: '排产条目 不锈钢阀体装配，待开工，排产待确认',
  title: '不锈钢阀体装配 · 待开工',
};

const demoTooltip = {
  kind: 'schedule' as const,
  rows: [
    { key: 'order', label: '工单号', value: 'WO-2026-0196' },
    { key: 'product', label: '产品', value: '不锈钢阀体（DN25）' },
    { key: 'quantity', label: '计划数量', value: '300 件' },
    { key: 'resource', label: '设备/中心', value: '装配线 A' },
    { key: 'time', label: '计划时间', value: '11/20 08:00 - 11/20 16:00' },
    { key: 'dependency', label: '依赖提醒', value: '前置工序即将完成，请确认开始时间。' },
    { key: 'progress', label: '完成进度', value: '42%' },
  ],
};

const capacityPoints: CapacitySummaryPoint[] = [
  {
    date: '2026-11-19',
    totalMinutes: 2400,
    scheduledMinutes: 1960,
    occupiedMinutes: 2180,
    utilizationRate: 0.82,
    occupiedUtilizationRate: 0.91,
    configuredConcurrency: 4,
    effectiveConcurrency: 3,
    totalEquipmentCount: 6,
    availableEquipmentCount: 5,
    unavailableEquipmentCount: 1,
  },
  {
    date: '2026-11-20',
    totalMinutes: 2200,
    scheduledMinutes: 2300,
    occupiedMinutes: 2460,
    utilizationRate: 1.05,
    occupiedUtilizationRate: 1.12,
    configuredConcurrency: 4,
    effectiveConcurrency: 3,
    totalEquipmentCount: 6,
    availableEquipmentCount: 4,
    unavailableEquipmentCount: 2,
  },
  {
    date: '2026-11-21',
    totalMinutes: 0,
    scheduledMinutes: 0,
    occupiedMinutes: 120,
    utilizationRate: 0,
    occupiedUtilizationRate: 0,
    configuredConcurrency: 0,
    effectiveConcurrency: 0,
    totalEquipmentCount: 0,
    availableEquipmentCount: 0,
    unavailableEquipmentCount: 0,
  },
];

const capacityCapabilities: CapacityBarCapabilities = {
  getDatePosition: (date) => {
    const day = Math.round(
      (Date.parse(`${date}T00:00:00Z`) - Date.parse('2026-11-16T00:00:00Z')) /
        86_400_000,
    );
    return day * 120;
  },
  getCapacityColor: (rate) =>
    rate >= 1
      ? '#cf1322'
      : rate >= 0.85
        ? '#d48806'
        : '#237804',
  formatDuration: (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder ? `${hours}小时${remainder}分` : `${hours}小时`;
  },
  warningThreshold: 0.85,
  maximumDisplayRate: 1.5,
  labels: {
    summaryTitle: '工作中心总负荷',
    tooltipTitle: (date) => `${date} · 工作中心汇总`,
    availableCapacity: '有效可用产能',
    plannedLoad: '计划负荷',
    actualOccupancy: '实际占用',
    noCapacityRisk: '风险：无有效产能但存在排产占用',
    equipmentLaneNote: '按工作中心汇总，不代表单台设备；单台设备请看设备泳道',
    equipmentSnapshot: '当前设备可用快照',
    unavailableSuffix: (count) => `（${count} 台不可用）`,
    effectiveConcurrency: '有效并发',
  },
};

const inspectorModel: GanttInspectorModel = {
  kicker: '排产详情',
  title: 'WO-2026-0196',
  heroTitle: '不锈钢阀体',
  heroSubtitle: '阀体装配',
  status: { label: '待确认', color: '#1677ff' },
  sections: [
    {
      key: 'time',
      title: '时间安排',
      fields: [
        { key: 'setup', label: '准备开始', value: '11/20 07:45' },
        { key: 'start', label: '加工开始', value: '11/20 08:00' },
        { key: 'end', label: '结束', value: '11/20 16:00' },
        { key: 'occupied', label: '设备占用', value: '11/20 07:45 ~ 16:00' },
        { key: 'duration', label: '工时', value: '8小时' },
        { key: 'setup-time', label: '准备工时', value: '15分钟' },
        { key: 'run-time', label: '加工工时', value: '7小时45分钟' },
      ],
    },
    {
      key: 'resources',
      title: '资源分配',
      fields: [
        { key: 'work-center', label: '工作中心', value: '装配车间' },
        { key: 'equipment', label: '设备', value: '装配线 A' },
        { key: 'assignee', label: '负责人', value: '张师傅' },
      ],
    },
    {
      key: 'business',
      title: '业务信息',
      fields: [
        { key: 'work-order-status', label: '工单状态', value: '待开工' },
        { key: 'schedule-status', label: '排产状态', value: '待确认' },
        { key: 'quantity', label: '数量', value: '300 件' },
        { key: 'buffer', label: '缓冲分钟', value: '30 分钟' },
        { key: 'buffer-ratio', label: '缓冲比例', value: '10%' },
        { key: 'version', label: '计划版本', value: 'V2' },
        { key: 'spec', label: '规格', value: 'DN25' },
      ],
    },
  ],
  dependency: {
    title: '依赖检查',
    fields: [
      { key: 'predecessor', label: '前置工序', value: '阀体粗加工 · 进行中' },
      { key: 'warning', label: '提醒', value: '前置工序计划结束时间接近当前开始时间。' },
    ],
    guidance: {
      type: 'warning',
      title: '建议确认前置工序完成时间',
      description: '可调整开始时间，或在确认前重新检查前置工序进度。',
      actions: [
        { key: 'edit', label: '编辑', icon: <EditOutlined /> },
        { key: 'unplan', label: '撤排', icon: <CloseCircleOutlined />, danger: true },
      ],
    },
  },
  footerActions: [
    { key: 'confirm', label: '确认排产', type: 'primary', icon: <CheckCircleOutlined /> },
    { key: 'unconfirm', label: '取消确认', danger: true, icon: <RollbackOutlined /> },
    { key: 'unplan', label: '撤排', danger: true, icon: <CloseCircleOutlined /> },
    { key: 'edit', label: '编辑', icon: <EditOutlined /> },
    { key: 'delete', label: '移入已取消', danger: true, icon: <DeleteOutlined /> },
    { key: 'close', label: '取消聚焦' },
  ],
  labels: { close: '关闭排产详情' },
};

const menuItems: readonly GanttMenuAction[] = [
  { key: 'confirm', label: '确认', icon: <CheckCircleOutlined /> },
  { key: 'edit', label: '编辑', icon: <EditOutlined /> },
  { key: 'unplan', label: '撤排', icon: <CloseCircleOutlined />, danger: true },
  { key: 'delete', label: '移入已取消', icon: <DeleteOutlined />, danger: true },
  { key: 'open-work-order', label: '查看工单', icon: <LinkOutlined /> },
];

export function ProductionScheduleComponentsDemo() {
  const [state, setState] = useState(initialState);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUnscheduled, setShowUnscheduled] = useState(true);
  const [selected, setSelected] = useState(true);
  const [message, setMessage] = useState('');
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    entry: DemoScheduleEntry | null;
  }>({ visible: false, x: 0, y: 0, entry: null });

  const toolbarCapabilities = useMemo<GanttToolbarCapabilities>(
    () => ({
      zoomOptions: [
        { label: '小时', value: 'hour' },
        { label: '天', value: 'day' },
        { label: '周', value: 'week' },
        { label: '月', value: 'month' },
      ],
      groupByOptions: [
        { label: '工作中心', value: 'work_center' },
        { label: '设备', value: 'equipment' },
      ],
      workCenterTypeOptions: [
        { label: '装配', value: 'assembly' },
        { label: '机加工', value: 'machining' },
      ],
      workCenterTypeLoading: false,
      statusOptions: [
        { label: '待排产', value: 'scheduled' },
        { label: '已确认', value: 'confirmed' },
        { label: '进行中', value: 'in_progress' },
        { label: '已完成', value: 'completed' },
      ],
      customerOptions: [
        { label: '华东精密', value: 'customer-01' },
        { label: '北方设备', value: 'customer-02' },
      ],
      labels: {
        previousPeriod: '上一周期',
        nextPeriod: '下一周期',
        today: '今天',
        productionDate: (range) => `生产日 ${range}`,
        dateRangeTitle: '生产日范围，按班次日历的班次开始日归属',
        filters: '筛选',
        refresh: '刷新',
        export: '导出排产明细',
        exportTitle: '导出排产明细（当前筛选 + 可见时间范围）',
        fullscreen: '全屏',
        exitFullscreen: '退出全屏',
        unscheduled: '待排产',
        unscheduledSelected: '隐藏待排产',
        workCenterType: '工作中心类型',
        statusFilter: '状态筛选',
        customer: '客户',
        keywordPlaceholder: '计划号/工单号/物料/客户',
        clearFilters: '清除',
      },
      formatDateRange: (start, end) => `${start.slice(5)} ~ ${end.slice(5)}`,
      shiftDateWindow: (current, direction) => {
        const shift = (date: string) => {
          const value = new Date(`${date}T00:00:00Z`);
          value.setUTCDate(value.getUTCDate() + 7 * direction);
          return value.toISOString().slice(0, 10);
        };
        return { startDate: shift(current.startDate), endDate: shift(current.endDate) };
      },
      getTodayWindow: () => ({ startDate: '2026-11-16', endDate: '2026-11-22' }),
      getZoomWindow: () => ({ startDate: '2026-11-16', endDate: '2026-11-22' }),
    }),
    [],
  );

  const capacityBarCapabilities = useMemo<CapacityBarCapabilities>(
    () => ({
      ...capacityCapabilities,
      getDatePosition: capacityCapabilities.getDatePosition,
    }),
    [],
  );

  const unscheduledCapabilities = useMemo<UnscheduledPanelCapabilities>(
    () => ({
      loadWorkOrders: async ({ keyword }) => {
        const records = [
          {
            id: 'wo-0198',
            orderNo: 'WO-2026-0198',
            plannedQty: 120,
            planEndTime: '2026-11-24T00:00:00',
            customer: { name: '华东精密' },
            material: { name: '不锈钢阀体', spec: 'DN25', unit: 'piece' },
            planNo: 'PLAN-2026-1108',
            sourceOrderNo: 'SO-2026-0792',
            customerMaterialCode: 'HD-VALVE-25',
            customerMaterialName: '阀体组件',
            customerMaterialSpec: 'DN25 / PN16',
            sourceRemark: '客户要求分批交付',
          },
          {
            id: 'wo-0201',
            orderNo: 'WO-2026-0201',
            plannedQty: 80,
            planEndTime: '2026-11-27T00:00:00',
            customer: { name: '北方设备' },
            material: { name: '定位支架', spec: 'M12', unit: 'piece' },
            planNo: 'PLAN-2026-1112',
            sourceOrderNo: 'SO-2026-0810',
          },
        ];
        return records.filter((record) =>
          `${record.orderNo} ${record.material.name}`
            .toLowerCase()
            .includes((keyword ?? '').toLowerCase()),
        );
      },
      beginScheduleDrag: (workOrder, event) => {
        setMessage(`已开始拖动 ${workOrder.orderNo}；宿主负责拖放计划和文本负载。`);
        event.dataTransfer.effectAllowed = 'copy';
      },
      formatUnit: (unit) => (unit === 'piece' ? '件' : unit ?? ''),
      formatDueDate: (date) => date.slice(5, 10),
      activateWorkOrder: (workOrder) =>
        setMessage(`已请求安排 ${workOrder.orderNo}；宿主打开排程编辑流程。`),
      reportLoadError: (error) => setMessage(`模拟加载错误：${String(error)}`),
      labels: {
        title: '待排产工单',
        searchPlaceholder: '搜索工单号/物料',
        empty: '暂无待排产工单',
        sourceRemark: '来源备注',
        scheduleAction: '安排',
      },
    }),
    [],
  );

  const batchReleaseCapabilities = useMemo<BatchReleaseCapabilities>(
    () => ({
      loadEditableDraftLines: async () => [
        { plannedQty: 300, dueDate: '2026-11-27' },
        { plannedQty: 200, dueDate: '2026-11-30' },
      ],
      saveDraftLines: async (_planId, lines) => {
        setMessage(`模拟保存 ${lines.length} 个计划批次。`);
      },
      serializeDate: (value) =>
        typeof value === 'string' ? value : value?.format('YYYY-MM-DD'),
      notifySaved: setMessage,
      minimumPlannedQuantity: 0.0001,
      labels: {
        title: (planNo) => `维护计划批次 — ${planNo}`,
        linesLabel: '批次（不添加则下达时按整单自动生成一批）',
        addLine: '添加批次',
        plannedQuantity: '投产数量',
        plannedQuantityRequired: '请输入投产数量',
        dueDate: '计划完成日期',
        saveSuccess: '计划批次已保存，可在计划详情点“下达批次”生成工单',
      },
    }),
    [],
  );

  const menuCapabilities = useMemo<GanttContextMenuCapabilities<DemoScheduleEntry>>(
    () => ({
      menuLabel: '排产条目操作',
      onAction: (_entry, action) => setMessage(`已选择菜单操作：${action}`),
      restoreFocus: () => menuTriggerRef.current?.focus(),
    }),
    [],
  );

  const barCapabilities = {
    onDragStart: (_event: MouseEvent, entry: DemoScheduleEntry, kind: GanttDragKind) =>
      setMessage(`${entry.orderNo}：宿主收到 ${kind} 拖动开始事件。`),
    onSelect: () => setSelected(true),
    onDoubleClick: () => setMessage('宿主打开排产编辑表单。'),
    onContextMenu: (event: MouseEvent, entry: DemoScheduleEntry) =>
      setMenu({ visible: true, x: event.clientX, y: event.clientY, entry }),
  };

  const openDemoMenu = () =>
    setMenu({ visible: true, x: 420, y: 240, entry: sampleEntry });
  const inspector: GanttInspectorModel = {
    ...inspectorModel,
    footerActions: inspectorModel.footerActions,
  };
  const menuActions = menuItems;

  return (
    <SectionCard title="生产排程组件">
      <Typography.Paragraph type="secondary">
        时间窗口、状态与资源字典、权限、请求、路由和提交均由宿主注入。可操作工具栏、条形、右键菜单、详情面板、待排产工单和批次编辑弹窗。
      </Typography.Paragraph>
      {message ? <Alert message={message} type="info" showIcon style={{ marginBottom: 16 }} /> : null}

      <section aria-labelledby="production-schedule-toolbar-heading">
        <Typography.Title level={5} id="production-schedule-toolbar-heading">
          排程工具栏与筛选
        </Typography.Title>
        <GanttToolbar
          state={state}
          onStateChange={(patch) => setState((current) => ({ ...current, ...patch }))}
          onRefresh={() => setMessage('已触发宿主刷新。')}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen((current) => !current)}
          showUnscheduled={showUnscheduled}
          onToggleUnscheduled={() => setShowUnscheduled((current) => !current)}
          onExport={() => setMessage('已请求导出当前筛选和时间范围。')}
          exporting={false}
          capabilities={toolbarCapabilities}
        />
      </section>

      <section aria-labelledby="production-schedule-gantt-heading" style={{ marginBlockStart: 20 }}>
        <Typography.Title level={5} id="production-schedule-gantt-heading">
          甘特条形与上下文菜单
        </Typography.Title>
        <div
          aria-label="生产排程甘特时间轴示例"
          role="region"
          style={{
            height: 90,
            maxWidth: '100%',
            overflowX: 'auto',
            position: 'relative',
            border: '1px solid var(--ant-color-border-secondary)',
            borderRadius: 6,
          }}
        >
          <GanttBar
            layout={demoBarLayout}
            presentation={demoBarPresentation}
            densityMetrics={{ barHeight: 52, barGap: 4, rowHeight: 82 }}
            selected={selected}
            dimmed={false}
            showProgress
            tooltipModel={demoTooltip}
            capabilities={barCapabilities}
          />
        </div>
        <Space style={{ marginBlockStart: 8 }} wrap>
          <Button ref={menuTriggerRef} onClick={openDemoMenu}>
            打开条目菜单
          </Button>
          <Button onClick={() => setSelected((current) => !current)}>
            {selected ? '取消选中' : '选中条目'}
          </Button>
          <Button onClick={() => setMessage('双击条形或选择“编辑”调用宿主编辑能力。')}>
            查看编辑说明
          </Button>
        </Space>
        <GanttContextMenu
          visible={menu.visible}
          x={menu.x}
          y={menu.y}
          entry={menu.entry}
          items={menuActions}
          onClose={() => setMenu((current) => ({ ...current, visible: false }))}
          capabilities={menuCapabilities}
        />
      </section>

      <section aria-labelledby="production-schedule-capacity-heading" style={{ marginBlockStart: 20 }}>
        <Typography.Title level={5} id="production-schedule-capacity-heading">
          产能负荷汇总
        </Typography.Title>
        <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
          <CapacityBar
            data={capacityPoints}
            resourcePanelWidth={200}
            timelineWidth={840}
            dayPixelWidth={120}
            capabilities={capacityBarCapabilities}
          />
        </div>
      </section>

      <section aria-labelledby="production-schedule-inspector-heading" style={{ marginBlockStart: 20 }}>
        <Typography.Title level={5} id="production-schedule-inspector-heading">
          排产详情与宿主动作
        </Typography.Title>
        {selected ? (
          <div style={{ display: 'flex', maxWidth: '100%', minHeight: 520, overflow: 'auto' }}>
            <GanttInspector
              entry={sampleEntry}
              model={inspector}
              onClose={() => setSelected(false)}
              capabilities={{
                onAction: (_entry, action) =>
                  action === 'close'
                    ? setSelected(false)
                    : setMessage(`宿主收到详情动作：${action}`),
              }}
            />
          </div>
        ) : (
          <Button onClick={() => setSelected(true)}>显示排产详情</Button>
        )}
      </section>

      <section aria-labelledby="production-schedule-unscheduled-heading" style={{ marginBlockStart: 20 }}>
        <Typography.Title level={5} id="production-schedule-unscheduled-heading">
          待排产工单
        </Typography.Title>
        {showUnscheduled ? (
          <UnscheduledPanel refreshKey={0} capabilities={unscheduledCapabilities} />
        ) : (
          <Button onClick={() => setShowUnscheduled(true)}>显示待排产工单</Button>
        )}
        <Typography.Text type="secondary">
          拖动工单卡片会调用宿主拖放能力；“安排”按钮提供单击入口。
        </Typography.Text>
      </section>

      <section aria-labelledby="production-schedule-batch-heading" style={{ marginBlockStart: 20 }}>
        <Typography.Title level={5} id="production-schedule-batch-heading">
          计划批次维护
        </Typography.Title>
        <BatchReleaseModal
          planId="plan-demo-01"
          planNo="PLAN-2026-1108"
          trigger={<Button type="primary">维护计划批次</Button>}
          onSaved={() => setMessage('宿主已刷新计划列表。')}
          capabilities={batchReleaseCapabilities}
        />
      </section>
    </SectionCard>
  );
}
