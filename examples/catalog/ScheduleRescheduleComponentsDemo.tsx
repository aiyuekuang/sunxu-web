import { useMemo, useState } from 'react';
import { Alert, Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import { ChangeHistoryModal } from '../../src/mes/components/ChangeHistoryModal';
import { RescheduleDrawer } from '../../src/mes/components/RescheduleDrawer';
import type {
  CalendarAuditRecord,
  CalendarHistoryCapabilities,
  CalendarHistoryTarget,
  RescheduleCapabilities,
  RescheduleDrawerProps,
  RescheduleFormValues,
  RescheduleImpactEntry,
  ReschedulePreview,
  RescheduleRun,
  RescheduleRunDetail,
} from '../../src/mes/components/schedule-reschedule-types';

const demoShiftedEntries: RescheduleImpactEntry[] = [
  {
    entryId: 'entry-wo-102',
    action: 'shifted',
    workOrderId: 'wo-102',
    workOrderNo: 'WO-2026-0102',
    operationId: 'op-turn',
    operationSequence: 2,
    operationName: '精车外圆',
    oldStart: '2026-11-24T09:00:00+08:00',
    oldEnd: '2026-11-24T10:30:00+08:00',
    newStart: '2026-11-24T10:30:00+08:00',
    newEnd: '2026-11-24T12:00:00+08:00',
    oldWorkCenterId: 'wc-turning',
    oldWorkCenterName: '车削中心',
    newWorkCenterId: 'wc-turning',
    newWorkCenterName: '车削中心',
    oldEquipmentId: 'eq-lathe-01',
    oldEquipmentName: '数控车床 01',
    newEquipmentId: 'eq-lathe-02',
    newEquipmentName: '数控车床 02',
    durationMinutes: 90,
    delayMinutes: 90,
    reconfirmRequired: true,
    reason: '为紧急工单腾出设备时段',
  },
  {
    entryId: 'entry-wo-103',
    action: 'shifted',
    workOrderId: 'wo-103',
    workOrderNo: 'WO-2026-0103',
    operationId: 'op-inspect',
    operationSequence: 4,
    operationName: '终检',
    oldStart: '2026-11-24T13:00:00+08:00',
    oldEnd: '2026-11-24T14:00:00+08:00',
    newStart: '2026-11-24T14:00:00+08:00',
    newEnd: '2026-11-24T15:00:00+08:00',
    oldWorkCenterId: 'wc-quality',
    oldWorkCenterName: '质量中心',
    newWorkCenterId: 'wc-quality',
    newWorkCenterName: '质量中心',
    oldEquipmentId: 'eq-cmm-01',
    oldEquipmentName: '三坐标 01',
    newEquipmentId: 'eq-cmm-01',
    newEquipmentName: '三坐标 01',
    durationMinutes: 60,
    delayMinutes: 60,
    reconfirmRequired: false,
    reason: '前序工序顺延',
  },
];

const insertedEntry: RescheduleImpactEntry = {
  entryId: 'entry-wo-urgent',
  action: 'inserted',
  workOrderId: 'wo-urgent',
  workOrderNo: 'WO-2026-0199',
  operationId: 'op-turn',
  operationSequence: 2,
  operationName: '精车外圆',
  newStart: '2026-11-24T09:00:00+08:00',
  newEnd: '2026-11-24T10:30:00+08:00',
  newWorkCenterId: 'wc-turning',
  newWorkCenterName: '车削中心',
  newEquipmentId: 'eq-lathe-01',
  newEquipmentName: '数控车床 01',
  durationMinutes: 90,
  delayMinutes: 0,
  reconfirmRequired: false,
  reason: '紧急订单插入',
};

const demoRun: RescheduleRun = {
  id: 'run-demo-001',
  createdAt: '2026-11-21T08:30:00+08:00',
  status: 'committed',
  reasonCode: 'urgent_order',
  insertedEntryCount: 1,
  shiftedEntryCount: 2,
  reconfirmCount: 1,
  materialReadiness: 'ready',
  supplyRisk: 'none',
  warnings: ['1 条已确认未开工排产需要重新确认'],
};

const demoPreviews = new Map<string, ReschedulePreview>();

const rescheduleDictionary: RescheduleCapabilities['dictionary'] = {
  sourceTypes: {
    plan: 'plan',
    workOrder: 'work_order',
    scheduleEntry: 'schedule_entry',
    equipmentFault: 'equipment_fault',
  },
  sourceTypeOptions: [
    { label: '生产计划', value: 'plan' },
    { label: '工单', value: 'work_order' },
    { label: '设备故障', value: 'equipment_fault' },
  ],
  sourceTypeLabels: {
    plan: '生产计划',
    work_order: '工单',
    schedule_entry: '排产条目',
    equipment_fault: '设备故障',
  },
  eligibleWorkOrderStatuses: {
    rescheduleSource: ['released', 'in_progress', 'paused'],
    protectionCandidates: ['released', 'in_progress'],
  },
  reasonCodes: {
    urgentOrder: 'urgent_order',
    manualAdjustment: 'manual_adjustment',
    equipmentFault: 'equipment_fault',
  },
  reasonOptions: [
    { label: '急单插入', value: 'urgent_order' },
    { label: '交期提前', value: 'due_date_pull_in' },
    { label: '交期延后', value: 'due_date_push_out' },
    { label: '客户提级', value: 'customer_escalation' },
    { label: '返工插入', value: 'rework_insert' },
    { label: '质量补产', value: 'quality_replenishment' },
    { label: '物料恢复', value: 'material_recovered' },
    { label: '人工调整', value: 'manual_adjustment' },
    { label: '设备故障恢复', value: 'equipment_fault' },
  ],
  reasonLabels: {
    urgent_order: { text: '急单插入', status: 'Error', color: '#FF3141' },
    due_date_pull_in: { text: '交期提前', status: 'Warning', color: '#FF8F1F' },
    due_date_push_out: { text: '交期延后', status: 'Warning', color: '#FF8F1F' },
    customer_escalation: {
      text: '客户提级',
      status: 'Warning',
      color: '#FA541C',
    },
    rework_insert: {
      text: '返工插入',
      status: 'Processing',
      color: '#722ED1',
    },
    quality_replenishment: {
      text: '质量补产',
      status: 'Processing',
      color: '#1677FF',
    },
    material_recovered: {
      text: '物料恢复',
      status: 'Success',
      color: '#00B578',
    },
    manual_adjustment: {
      text: '人工调整',
      status: 'Default',
      color: '#999999',
    },
    equipment_fault: {
      text: '设备故障恢复',
      status: 'Error',
      color: '#D4380D',
    },
  },
  triggerModes: { manual: 'manual', priorityChange: 'priority_change' },
  impactActions: {
    inserted: 'inserted',
    shifted: 'shifted',
    unplanned: 'unplanned',
    all: 'all',
  },
  impactActionOptions: [
    { label: '全部动作', value: 'all' },
    { label: '新增', value: 'inserted' },
    { label: '顺延/移动', value: 'shifted' },
    { label: '撤排', value: 'unplanned' },
  ],
  impactActionLabels: {
    inserted: '新增',
    shifted: '顺延/移动',
    unplanned: '撤排',
  },
  runStatuses: {
    previewed: { text: '已预览', status: 'Processing' },
    committed: { text: '已提交', status: 'Success' },
    cancelled: { text: '已取消', status: 'Default' },
  },
  materialReadiness: {
    ready: { text: '物料可用', status: 'Success', color: '#00B578' },
    shortage_but_schedulable: {
      text: '缺料可排',
      status: 'Warning',
      color: '#FF8F1F',
    },
    line_side_pending_supply: {
      text: '待补料',
      status: 'Warning',
      color: '#FAAD14',
    },
    blocked_by_shortage: {
      text: '缺料阻塞',
      status: 'Error',
      color: '#FF3141',
    },
  },
  materialReadinessValues: {
    ready: 'ready',
    blockedByShortage: 'blocked_by_shortage',
  },
  supplyRisk: {
    none: { text: '无供料风险', status: 'Success', color: '#00B578' },
    pending_supply_orders: {
      text: '存在待补退',
      status: 'Warning',
      color: '#FF8F1F',
    },
    line_side_residuals: {
      text: '存在线边余料',
      status: 'Warning',
      color: '#FA541C',
    },
    blocked: { text: '供料阻塞', status: 'Error', color: '#FF3141' },
  },
  supplyRiskValues: { none: 'none', blocked: 'blocked' },
  thresholdWarningMarker: '超过阈值',
};

type DemoScenario = Omit<
  Partial<RescheduleDrawerProps>,
  'open' | 'onClose' | 'onSuccess' | 'capabilities'
>;

function buildDemoPreview(values: RescheduleFormValues): ReschedulePreview {
  const protectedIds = new Set(values.protectedWorkOrderIds ?? []);
  const shiftedEntries = demoShiftedEntries.filter(
    (entry) => !protectedIds.has(entry.workOrderId),
  );
  const reconfirmCount = shiftedEntries.filter(
    (entry) => entry.reconfirmRequired,
  ).length;
  const maxDelayMinutes = shiftedEntries.reduce(
    (maximum, entry) => Math.max(maximum, entry.delayMinutes),
    0,
  );
  const thresholdExceeded =
    maxDelayMinutes > (values.maxDelayMinutes ?? 0) ||
    reconfirmCount > (values.maxReconfirmCount ?? 0);
  const previewToken = `preview-${values.sourceId || 'demo'}-${[
    ...protectedIds,
  ]
    .sort()
    .join('-') || 'none'}`;
  return {
    feasible: !thresholdExceeded,
    runId: 'run-preview-demo',
    previewToken,
    warnings: thresholdExceeded
      ? ['本次重排影响超过阈值，请调整允许范围后重新生成预览']
      : reconfirmCount
        ? [`${reconfirmCount} 条已确认未开工排产需要重新确认`]
        : [],
    materialReadiness: 'shortage_but_schedulable',
    supplyRisk: 'pending_supply_orders',
    summary: {
      insertedEntryCount: 1,
      shiftedEntryCount: shiftedEntries.length,
      reconfirmCount,
      overdueCount: 0,
      maxDelayMinutes,
    },
    insertedEntries: [insertedEntry],
    shiftedEntries,
  };
}

export function ScheduleRescheduleComponentsDemo() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scenario, setScenario] = useState<DemoScenario>({});
  const [historyTarget, setHistoryTarget] =
    useState<CalendarHistoryTarget | null>(null);
  const [feedback, setFeedback] = useState<string>();

  const capabilities = useMemo<RescheduleCapabilities>(
    () => ({
      permissions: {
        canPreview: true,
        canCommit: true,
        canMoveConfirmed: true,
      },
      dictionary: rescheduleDictionary,
      fieldHelp: (label) => ({ label }),
      loadPolicy: async () => ({
        defaultRescheduleHorizonDays: 7,
        defaultRescheduleFreezeMinutes: 480,
        defaultRescheduleAllowAlternativeEquipment: true,
        defaultRescheduleAllowMoveConfirmed: true,
        defaultRescheduleMaxDelayMinutes: 1440,
        defaultRescheduleMaxOverdueCount: 1,
        defaultRescheduleMaxReconfirmCount: 2,
      }),
      loadSourceOptions: async ({ sourceType, keyword }) => {
        const sourceOptions =
          sourceType === 'plan'
            ? [
                { label: '生产计划 PLN-2026-041 · 12 个工单', value: 'plan-041' },
                { label: '生产计划 PLN-2026-042 · 暂无可重排工单', value: 'plan-042', disabled: true },
              ]
            : [
                { label: 'WO-2026-0102 · 车轴组件', value: 'wo-102' },
                { label: 'WO-2026-0103 · 轴承座', value: 'wo-103' },
                {
                  label: 'WO-2026-0104 · 排程已锁定，需先解除锁定',
                  value: 'wo-104-locked',
                  disabled: true,
                },
              ];
        const normalizedKeyword = (keyword ?? '').toLowerCase();
        return sourceOptions.filter((option) =>
          option.label.toLowerCase().includes(normalizedKeyword),
        );
      },
      loadProtectedWorkOrderOptions: async ({
        keyword,
        excludedWorkOrderIds,
      }) => {
        const available = [
          { label: 'WO-2026-0102 · 车轴组件', value: 'wo-102' },
          { label: 'WO-2026-0103 · 轴承座', value: 'wo-103' },
          { label: 'WO-2026-0105 · 传动轴', value: 'wo-105' },
        ];
        const excluded = new Set(excludedWorkOrderIds);
        const normalizedKeyword = (keyword ?? '').toLowerCase();
        return available.filter(
          (option) =>
            !excluded.has(option.value) &&
            option.label.toLowerCase().includes(normalizedKeyword),
        );
      },
      preview: async (values) => {
        const result = buildDemoPreview(values);
        demoPreviews.set(result.previewToken, result);
        return result;
      },
      commit: async ({ previewToken }) => {
        const result = demoPreviews.get(previewToken);
        return {
          summary: {
            insertedEntryCount: result?.summary.insertedEntryCount ?? 1,
            shiftedEntryCount: result?.summary.shiftedEntryCount ?? 0,
          },
        };
      },
      loadHistory: async () => ({ list: [demoRun], total: 1 }),
      loadRunDetail: async (): Promise<RescheduleRunDetail> => ({
        run: demoRun,
        details: [insertedEntry, ...demoShiftedEntries],
      }),
      notify: ({ type, content }) => setFeedback(`${type}：${content}`),
      reportActionError: (error, context) => {
        const detail = error instanceof Error ? error.message : context.fallback;
        setFeedback(`${context.fallback}：${detail}`);
      },
      openMaterialRisk: (source) =>
        setFeedback(`示例跳转物料风险：${source.sourceType}/${source.sourceId}`),
      openSupplyRisk: (source) =>
        setFeedback(`示例跳转供料风险：${source.sourceType}/${source.sourceId}`),
    }),
    [],
  );

  const historyCapabilities = useMemo<CalendarHistoryCapabilities>(
    () => ({
      actionLabels: { create: '新增', update: '修改', delete: '删除' },
      loadHistory: async ({ kind, resourceId, page, pageSize }) => {
        const records: CalendarAuditRecord[] = [
          {
            id: `${kind}-${resourceId}-audit-01`,
            createdAt: '2026-11-21T08:30:00+08:00',
            action: 'update',
            userName: '排产管理员',
            description:
              kind === 'shift'
                ? '白班休息时段由 12:00–12:30 调整为 12:00–13:00'
                : '设备检修例外时间由 14:00 调整为 15:00',
          },
          {
            id: `${kind}-${resourceId}-audit-02`,
            createdAt: '2026-11-18T14:10:00+08:00',
            action: 'create',
            userName: '生产主管',
            description:
              kind === 'shift'
                ? '创建白班日历，工作时间 08:00–17:00'
                : '创建设备检修日历例外',
          },
        ];
        const offset = (page - 1) * pageSize;
        return { list: records.slice(offset, offset + pageSize), total: records.length };
      },
    }),
    [],
  );

  const openScenario = (nextScenario: DemoScenario) => {
    setScenario(nextScenario);
    setDrawerOpen(true);
  };

  return (
    <SectionCard title="生产排程重排与日历历史">
      <Typography.Paragraph type="secondary">
        固定 mock 展示来源选择、策略加载、影响预览筛选、临时保护、历史明细及确认提交；班次与日历例外共用变更记录弹窗。
      </Typography.Paragraph>
      <Space wrap>
        <Button type="primary" onClick={() => openScenario({})}>
          插单重排
        </Button>
        <Button
          onClick={() =>
            openScenario({
              sourceType: 'work_order',
              sourceId: 'wo-103',
              sourceLabel: 'WO-2026-0103 · 轴承座',
              followUpReplan: true,
              initialReasonCode: 'manual_adjustment',
            })
          }
        >
          后续工序补排
        </Button>
        <Button
          onClick={() =>
            openScenario({
              sourceType: 'equipment_fault',
              sourceId: 'fault-08',
              sourceLabel: '数控车床 01 故障',
              equipmentFaultRecovery: true,
              initialReasonCode: 'equipment_fault',
            })
          }
        >
          设备故障恢复
        </Button>
        <Button
          onClick={() =>
            setHistoryTarget({
              kind: 'shift',
              id: 'shift-day',
              name: '白班日历',
            })
          }
        >
          查看班次变更记录
        </Button>
        <Button
          onClick={() =>
            setHistoryTarget({
              kind: 'exception',
              id: 'exception-lathe',
              name: '车床检修例外',
            })
          }
        >
          查看日历例外记录
        </Button>
      </Space>
      {feedback ? (
        <Alert
          type="info"
          showIcon
          role="status"
          style={{ marginBlockStart: 16 }}
          message={feedback}
          closable
          onClose={() => setFeedback(undefined)}
        />
      ) : null}
      <RescheduleDrawer
        {...scenario}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => setDrawerOpen(false)}
        capabilities={capabilities}
      />
      <ChangeHistoryModal
        target={historyTarget}
        onClose={() => setHistoryTarget(null)}
        capabilities={historyCapabilities}
      />
    </SectionCard>
  );
}
