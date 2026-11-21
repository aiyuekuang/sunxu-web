import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ExclamationCircleFilled,
  SearchOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Input,
  Modal,
  Progress,
  Radio,
  Space,
  Spin,
  Steps,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { TableColumnsType, TablePaginationConfig } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import type {
  AutoScheduleDrawerProps,
  DispatchRule,
  ScheduleBufferPolicy,
  ScheduleAppliedPolicy,
  ScheduleDirection,
  ScheduleFromPlansDrawerProps,
  SchedulePlanRow,
  SchedulePlanWorkOrder,
  SchedulePreviewEntry,
  ScheduleWorkOrderRow,
} from './production-schedule-workflows-types';

const ALGORITHM_OPTIONS = [
  { value: 'greedy' as const, label: '贪心算法（按交期优先排产）', tip: '按交期从近到远逐个安排，简单高效，适合大多数场景' },
  { value: 'critical_path' as const, label: '关键路径法（CPM，优化多工序路线）', tip: '先分析工序之间的依赖关系，找出最影响总工期的关键路径，优先保障关键工序不延期' },
];
const BUFFER_OPTIONS = [
  { value: 0, label: '不加缓冲（理论最短工时）' },
  { value: 0.1, label: '10%（轻度缓冲）' },
  { value: 0.15, label: '15%（推荐，平衡效率与稳定性）' },
  { value: 0.2, label: '20%（充足缓冲，减少重排）' },
];
const DIRECTION_OPTIONS = [
  { value: 'forward' as const, label: '正排（从当前时间开始排）', tip: '从今天开始往后安排，先做的先排，适合产能充足时' },
  { value: 'backward' as const, label: '倒排（从交期往前排）', tip: '从交货日期往前推算，确保刚好按时完成，适合赶交期时' },
];
const DISPATCH_OPTIONS: { value: DispatchRule; label: string; tip: string }[] = [
  { value: 'edd', label: 'EDD — 最早交期优先', tip: '谁的交货日期最近就先做谁，避免延期交货。最常用' },
  { value: 'spt', label: 'SPT — 最短加工时间优先', tip: '哪个订单做得最快就先做哪个，能最快清掉积压的订单数量' },
  { value: 'cr', label: 'CR — 临界比率（综合考虑交期和工时）', tip: '综合考虑离交期还有多久和还要做多久，越紧急的越先做' },
  { value: 'wspt', label: 'WSPT — 加权最短加工时间（考虑优先级）', tip: '在快做完的基础上，优先级高的订单额外加权往前排' },
  { value: 'fifo', label: 'FIFO — 先进先出', tip: '谁先下单就先做谁，最公平，但不考虑紧急程度' },
];

function appliedPolicyLabel(policy?: ScheduleAppliedPolicy, formatter?: (value?: ScheduleAppliedPolicy) => string) {
  if (formatter) return formatter(policy);
  if (!policy) return '按公司排产缓冲策略';
  const sourceLabel = policy.source === 'company_default' ? '公司默认' : policy.source === 'manual_override' ? '手动覆盖' : policy.source === 'legacy_migration' ? '历史迁移' : policy.source;
  return `${Math.round(policy.bufferRatio * 100)}%${sourceLabel ? ` · ${sourceLabel}` : ''}`;
}

function mergeCurrentPageRouteIds<T extends { id: string; routeId?: string }>(current: Record<string, string>, rows: readonly T[]) {
  const next = { ...current };
  rows.forEach((row) => {
    if (row.routeId) next[row.id] = row.routeId;
    else delete next[row.id];
  });
  return next;
}

function BufferPolicyControls({
  policy,
  loading,
  useOverride,
  value,
  options,
  onUseOverride,
  onChange,
}: {
  policy: ScheduleBufferPolicy | null;
  loading: boolean;
  useOverride: boolean;
  value: number;
  options: readonly { value: number; label: string }[];
  onUseOverride: (value: boolean) => void;
  onChange: (value: number) => void;
}) {
  const canOverride = policy?.allowBufferRatioOverride === true;
  const effectiveOverride = canOverride && useOverride;
  const applied = policy ? (effectiveOverride ? value : policy.defaultBufferRatio) : value;
  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Typography.Text strong>
        当前采用：{loading ? '加载中…' : policy ? `${Math.round(applied * 100)}%（${effectiveOverride ? '本次覆盖' : '公司默认'}）` : '策略未加载'}
      </Typography.Text>
      <Typography.Text type="secondary">
        {loading ? '正在加载公司排产缓冲策略…' : policy ? `公司默认：${Math.round(policy.defaultBufferRatio * 100)}% · ${canOverride ? '允许本次临时覆盖' : '仅可使用公司默认'}` : '排产缓冲策略未加载'}
      </Typography.Text>
      {!loading && canOverride && (
        <Space>
          <Switch checked={effectiveOverride} onChange={onUseOverride} />
          <Typography.Text>本次临时覆盖</Typography.Text>
        </Space>
      )}
      {!loading && effectiveOverride && (
        <Radio.Group value={value} onChange={(event) => onChange(event.target.value)}>
          <Space direction="vertical">{options.map((option) => <Radio key={option.value} value={option.value}>{option.label}</Radio>)}</Space>
        </Radio.Group>
      )}
      {!loading && policy && !canOverride && <Typography.Text type="secondary">当前公司策略仅允许使用公司默认比例。</Typography.Text>}
      <Alert type="info" showIcon message="缓冲时间会追加到排产总工时末尾，用于吸收生产波动并减少频繁调整。" />
    </Space>
  );
}

function PreviewEntriesTable({ entries }: { entries: readonly SchedulePreviewEntry[] }) {
  const columns: TableColumnsType<SchedulePreviewEntry> = [
    { title: '计划号', dataIndex: 'planNo', width: 130, render: (value) => value ?? '-' },
    { title: '工单号', dataIndex: 'workOrderNo', width: 150, render: (value) => value ?? '-' },
    { title: '工序', dataIndex: 'operationName', width: 130, render: (value, row) => row.isBuffer ? '尾部缓冲' : value ?? '整单排产' },
    { title: '资源', width: 150, render: (_, row) => row.isOutsourced ? row.supplierName ?? '委外加工' : row.equipmentName ?? row.workCenterName ?? '未分配' },
    { title: '准备开始', dataIndex: 'setupStartTime', width: 155, render: (value, row) => dayjs(value ?? row.plannedStart).format('MM-DD HH:mm:ss') },
    { title: '加工开始', dataIndex: 'productionStartTime', width: 155, render: (value, row) => dayjs(value ?? row.plannedStart).format('MM-DD HH:mm:ss') },
    { title: '结束时间', dataIndex: 'plannedEnd', width: 155, render: (value) => dayjs(value).format('MM-DD HH:mm:ss') },
    { title: '工时(分)', dataIndex: 'durationMinutes', width: 90, align: 'right', render: (value) => value ?? '-' },
    { title: '关键路径', dataIndex: 'isCritical', width: 90, render: (value) => value ? <Tag color="red">关键</Tag> : '-' },
  ];
  return <Table rowKey={(row, index) => row.id ?? `${row.workOrderId ?? row.planId ?? 'entry'}-${index}`} size="small" scroll={{ x: 1120 }} pagination={{ pageSize: 20, showSizeChanger: false }} columns={columns} dataSource={[...entries]} />;
}

function BomOutsourcingTable({ rows, phase }: { rows: NonNullable<import('./production-schedule-workflows-types').SchedulePreviewResult['bomOutsourcing']>; phase: 'preview' | 'result' }) {
  const columns: TableColumnsType<(typeof rows)[number]> = [
    { title: '计划号', dataIndex: 'planNo', width: 120 },
    { title: '工单号', dataIndex: 'workOrderNo', width: 145 },
    { title: '委外物料', width: 210, render: (_, row) => <Space direction="vertical" size={0}><span>{[row.materialCode, row.materialName].filter(Boolean).join(' ') || '-'}</span>{row.materialSpec && <Typography.Text type="secondary">{row.materialSpec}</Typography.Text>}</Space> },
    { title: 'BOM需求', dataIndex: 'grossQty', align: 'right', render: (value, row) => `${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${row.unit}` },
    { title: '库存抵扣', dataIndex: 'stockOffsetQty', align: 'right', render: (value, row) => `${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${row.unit}` },
    { title: '需委外', dataIndex: 'outsourceQty', align: 'right', render: (value, row) => `${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${row.unit}` },
    { title: '委外单号', dataIndex: 'orderNo', width: 150, render: (value, row) => value ?? (row.outsourceQty <= 0 ? '无需委外' : phase === 'preview' ? '排产后生成' : '未生成委外单') },
  ];
  return <Table rowKey={(row) => `${row.workOrderId}:${row.materialId}`} size="small" scroll={{ x: 950 }} pagination={false} columns={columns} dataSource={[...rows]} />;
}

function usePagedRows<T>(open: boolean, keyword: string, loader: (query: { page: number; pageSize: number; keyword?: string; orderBy?: string; orderDir?: 'ASC' | 'DESC' }) => Promise<{ list: T[]; total: number }>, onError: (error: unknown) => void) {
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [orderBy, setOrderBy] = useState<string>();
  const [orderDir, setOrderDir] = useState<'ASC' | 'DESC'>();
  const reload = useCallback(async () => {
    setLoading(true); setError(undefined);
    try {
      const result = await loader({ page, pageSize, keyword: keyword || undefined, orderBy, orderDir });
      setRows(result.list ?? []); setTotal(result.total ?? result.list?.length ?? 0);
    } catch (cause) { setError(cause); onError(cause); }
    finally { setLoading(false); }
  }, [loader, onError, orderBy, orderDir, page, pageSize, keyword]);
  useEffect(() => { if (open) void reload(); }, [open, reload]);
  const onTableChange = (pagination: TablePaginationConfig, _filters: unknown, sorter: unknown) => {
    setPage(pagination.current ?? 1); setPageSize(pagination.pageSize ?? pageSize);
    const sort = Array.isArray(sorter) ? sorter[0] : sorter as { field?: string; order?: 'ascend' | 'descend' };
    setOrderBy(sort?.field); setOrderDir(sort?.order === 'ascend' ? 'ASC' : sort?.order === 'descend' ? 'DESC' : undefined);
  };
  return { rows, total, loading, error, page, pageSize, reload, onTableChange, setPage };
}

export function AutoScheduleDrawer({ open, onClose, onSuccess, onViewResult, capabilities }: AutoScheduleDrawerProps) {
  const [step, setStep] = useState<'select' | 'preview' | 'done'>('select');
  const [algorithm, setAlgorithm] = useState<'greedy' | 'critical_path'>('greedy');
  const [bufferRatio, setBufferRatio] = useState(0);
  const [useOverride, setUseOverride] = useState(false);
  const [policy, setPolicy] = useState<ScheduleBufferPolicy | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [queryKeyword, setQueryKeyword] = useState('');
  const [preview, setPreview] = useState<Awaited<ReturnType<AutoScheduleDrawerProps['capabilities']['preview']>> | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<AutoScheduleDrawerProps['capabilities']['submit']>> | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [routeIds, setRouteIds] = useState<Record<string, string>>({});
  const algorithmOptions = capabilities.algorithmOptions ?? ALGORITHM_OPTIONS;
  const bufferOptions = capabilities.bufferOptions ?? BUFFER_OPTIONS;
  const loadRows = useCallback((query: Omit<Parameters<typeof capabilities.loadWorkOrders>[0], 'status' | 'executionState'>) => capabilities.loadWorkOrders({ ...query, status: 'released', executionState: 'unscheduled' }), [capabilities]);
  const reportLoadError = useCallback((error: unknown) => capabilities.reportError(error, { operation: 'load-unscheduled-work-orders' }), [capabilities]);
  const page = usePagedRows(open && step === 'select', queryKeyword, loadRows, reportLoadError);

  useEffect(() => {
    if (!open) return;
    setStep('select'); setAlgorithm('greedy'); setBufferRatio(0); setUseOverride(false); setPolicy(null); setPolicyLoading(true); setSelected([]); setKeyword(''); setQueryKeyword(''); setPreview(null); setResult(null); setRouteIds({});
    let active = true;
    setPolicyLoading(true);
    capabilities.loadPolicy().then((next) => { if (active) { setPolicy(next); setBufferRatio(next.defaultBufferRatio); } }).catch((error: unknown) => { if (active) { setPolicy(null); capabilities.reportError(error, { operation: 'load-schedule-policy' }); capabilities.notify('error', '加载排产缓冲策略失败'); } }).finally(() => { if (active) setPolicyLoading(false); });
    return () => { active = false; };
  }, [open, capabilities]);
  useEffect(() => { setRouteIds((current) => mergeCurrentPageRouteIds(current, page.rows)); }, [page.rows]);
  const effectiveBuffer = policy && !(useOverride && policy.allowBufferRatioOverride) ? policy.defaultBufferRatio : bufferRatio;
  const selectedRouteIds = selected.map((id) => routeIds[id]).filter(Boolean);
  const handlePreview = async () => {
    if (!capabilities.canRun) return;
    if (!selected.length) { capabilities.notify('warning', '请至少选择一个工单'); return; }
    if (!policy || policyLoading) { capabilities.notify('warning', '排产缓冲策略加载中'); return; }
    setPreviewing(true);
    try { setPreview(await capabilities.preview({ workOrderIds: selected, algorithm, bufferRatio: effectiveBuffer })); setStep('preview'); }
    catch (error) { capabilities.reportError(error, { operation: 'preview-auto-schedule', routeIds: selectedRouteIds }); }
    finally { setPreviewing(false); }
  };
  const handleSubmit = async () => {
    if (!capabilities.canRun) return;
    setSubmitting(true);
    try {
      const next = await capabilities.submit({ workOrderIds: selected, algorithm, bufferRatio: effectiveBuffer });
      setResult(next); setStep('done');
      capabilities.notify('success', `自动排产完成，生成 ${next.total} 条排产记录 · ${appliedPolicyLabel(next.appliedPolicy, capabilities.formatAppliedPolicy)}`);
    } catch (error) { capabilities.reportError(error, { operation: 'submit-auto-schedule', routeIds: selectedRouteIds }); }
    finally { setSubmitting(false); }
  };
  const close = () => { if (result) onSuccess(); else onClose(); };
  const columns: TableColumnsType<ScheduleWorkOrderRow> = [
    { title: '工单号', dataIndex: 'orderNo', width: 150, sorter: true },
    { title: '产品名称', width: 150, render: (_, row) => row.material?.name ?? '-' },
    { title: '计划数量', dataIndex: 'plannedQty', width: 100, align: 'right', sorter: true },
    { title: '交期', dataIndex: 'planEndTime', width: 120, sorter: true, render: (value) => value ? dayjs(value).format('YYYY-MM-DD') : '-' },
  ];
  return (
    <Drawer title="自动排产" width={640} open={open} onClose={close} destroyOnHidden footer={step === 'done' ? null : <Space style={{ width: '100%', justifyContent: 'flex-end' }}>{step === 'preview' ? <><Button onClick={() => setStep('select')} icon={<ArrowLeftOutlined />}>返回修改</Button><Button type="primary" loading={submitting} disabled={!capabilities.canRun} icon={<ThunderboltOutlined />} onClick={handleSubmit}>确认排产</Button></> : <><Button onClick={close}>取消</Button><Button type="primary" icon={<ThunderboltOutlined />} loading={previewing} disabled={!capabilities.canRun || !selected.length || !policy || policyLoading} onClick={() => void handlePreview()}>预览排产 ({selected.length})</Button></>}</Space>}>
      {step === 'select' && (
        <Steps direction="vertical" current={-1} items={[
          { title: '选择算法', description: <Space direction="vertical" style={{ width: '100%', padding: '8px 0 16px' }}><Radio.Group value={algorithm} onChange={(event) => setAlgorithm(event.target.value)}><Space direction="vertical">{algorithmOptions.map((option) => <Radio key={option.value} value={option.value} disabled={policy?.setupRuleEnabled && option.value === 'critical_path'}>{option.label}</Radio>)}</Space></Radio.Group>{policy?.setupRuleEnabled && <Alert type="info" showIcon message="已启用准备/换型规则：本次只能使用贪心算法" description="换型工时依赖同一资源的实际前序顺序；关键路径法不建立该顺序，因此不可忽略规则。" />}{algorithmOptions.find((option) => option.value === algorithm)?.tip && <Typography.Text type="secondary">💡 {algorithmOptions.find((option) => option.value === algorithm)?.tip}</Typography.Text>}</Space> },
          { title: '缓冲时间', description: <div style={{ padding: '8px 0 16px' }}><BufferPolicyControls policy={policy} loading={policyLoading} useOverride={useOverride} value={bufferRatio} options={bufferOptions} onUseOverride={setUseOverride} onChange={setBufferRatio} /></div> },
          { title: '选择工单', description: <Space direction="vertical" style={{ width: '100%', paddingTop: 8 }}><Typography.Text type="secondary">仅显示已下达且待排产的工单。已有排产记录的工单请先调整或移除原排产。</Typography.Text><Space wrap><Input.Search placeholder="搜索工单号/物料名称" allowClear size="small" value={keyword} onChange={(event) => setKeyword(event.target.value)} onSearch={(value) => { setQueryKeyword(value.trim()); page.setPage(1); }} style={{ width: 260 }} /><Button size="small" onClick={() => setSelected(page.rows.map((row) => row.id))}>全选当前页</Button><Button size="small" onClick={() => setSelected([])}>清除选择</Button></Space>{Boolean(page.error) && <Alert type="error" showIcon message="工单列表加载失败" action={<Button size="small" onClick={() => void page.reload()}>重试</Button>} />}<Table rowKey="id" size="small" scroll={{ x: 520 }} columns={columns} dataSource={page.rows} loading={page.loading} onChange={page.onTableChange} rowSelection={{ selectedRowKeys: selected, preserveSelectedRowKeys: true, onChange: (keys) => setSelected(keys.map(String)) }} pagination={{ current: page.page, pageSize: page.pageSize, total: page.total, showSizeChanger: false }} /></Space> },
        ]} />
      )}
      {step === 'preview' && preview && <Space direction="vertical" size="middle" style={{ width: '100%' }}><Descriptions size="small" bordered column={{ xs: 1, sm: 2 }}><Descriptions.Item label="算法">{algorithmOptions.find((option) => option.value === algorithm)?.label ?? algorithm}</Descriptions.Item><Descriptions.Item label="粒度">{preview.entries.some((entry) => entry.isOutsourced) ? '设备级 / 委外时间段' : preview.entries.some((entry) => !entry.workCenterId && !entry.isOutsourced) ? '设备级 / 整单粗排' : '设备级'}</Descriptions.Item><Descriptions.Item label="缓冲策略">{appliedPolicyLabel(preview.appliedPolicy, capabilities.formatAppliedPolicy)}</Descriptions.Item><Descriptions.Item label="条目数">{preview.total}</Descriptions.Item></Descriptions>{preview.warnings.length > 0 && <Alert type="warning" showIcon message="注意事项" description={<ul>{preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>} />}<PreviewEntriesTable entries={preview.entries} /></Space>}
      {step === 'done' && result && <Alert type="success" showIcon message="排产完成" description={`成功生成 ${result.total} 条排产记录，可在排产列表或甘特图中查看。缓冲策略：${appliedPolicyLabel(result.appliedPolicy, capabilities.formatAppliedPolicy)}`} action={<Button type="primary" onClick={() => { const earliest = result.entries.map((entry) => entry.plannedStart).filter(Boolean).sort()[0]; onViewResult?.(earliest ? dayjs(earliest).format('YYYY-MM-DD') : undefined); close(); }}>查看结果</Button>} />}
      {step === 'preview' && !preview && <Alert type="warning" showIcon message="暂无预览数据" />}
    </Drawer>
  );
}

type SchedulePlanWorkOrderNode = SchedulePlanWorkOrder & {
  children: SchedulePlanWorkOrderNode[];
};
type SchedulePlanWorkOrderTree = SchedulePlanWorkOrder & {
  children?: SchedulePlanWorkOrderTree[];
};

function buildWorkOrderTree(items: readonly SchedulePlanWorkOrder[]) {
  const map = new Map<string, SchedulePlanWorkOrderNode>(
    items.map((item): [string, SchedulePlanWorkOrderNode] => [
      item.id,
      { ...item, children: [] },
    ]),
  );
  const roots: SchedulePlanWorkOrderNode[] = [];
  for (const item of items) {
    const current = map.get(item.id)!;
    const parent = item.parentWorkOrderId ? map.get(item.parentWorkOrderId) : undefined;
    if (parent) parent.children.push(current); else roots.push(current);
  }
  const prune = (
    nodes: readonly SchedulePlanWorkOrderNode[],
  ): SchedulePlanWorkOrderTree[] =>
    nodes.map(({ children, ...node }) => {
      const nested = prune(children);
      return nested.length ? { ...node, children: nested } : node;
    });
  return prune(roots);
}

export function ScheduleFromPlansDrawer({ open, onClose, onSuccess, initialKeyword, onViewResult, capabilities }: ScheduleFromPlansDrawerProps) {
  const [step, setStep] = useState<'select' | 'preview' | 'done'>('select');
  const [direction, setDirection] = useState<ScheduleDirection>('forward');
  const [dispatchRule, setDispatchRule] = useState<DispatchRule>('edd');
  const [bufferRatio, setBufferRatio] = useState(0);
  const [useOverride, setUseOverride] = useState(false);
  const [policy, setPolicy] = useState<ScheduleBufferPolicy | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [keyword, setKeyword] = useState(initialKeyword ?? '');
  const [queryKeyword, setQueryKeyword] = useState(initialKeyword ?? '');
  const [preview, setPreview] = useState<Awaited<ReturnType<ScheduleFromPlansDrawerProps['capabilities']['preview']>> | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<ScheduleFromPlansDrawerProps['capabilities']['submit']>> | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [routeIds, setRouteIds] = useState<Record<string, string>>({});
  const [planCounts, setPlanCounts] = useState<Record<string, { workOrderCount: number; activeWorkOrderCount: number }>>({});
  const [workOrderModal, setWorkOrderModal] = useState<SchedulePlanRow | null>(null);
  const [workOrders, setWorkOrders] = useState<SchedulePlanWorkOrder[]>([]);
  const [workOrderLoading, setWorkOrderLoading] = useState(false);
  const [workOrderError, setWorkOrderError] = useState(false);
  const directionOptions = capabilities.directionOptions ?? DIRECTION_OPTIONS;
  const ruleOptions = capabilities.dispatchRuleOptions ?? DISPATCH_OPTIONS;
  const bufferOptions = capabilities.bufferOptions ?? BUFFER_OPTIONS;
  const loadRows = useCallback((query: Omit<Parameters<typeof capabilities.loadPlans>[0], 'status'>) => capabilities.loadPlans({ ...query, status: 'confirmed' }), [capabilities]);
  const reportLoadError = useCallback((error: unknown) => capabilities.reportError(error, { operation: 'load-confirmed-production-plans' }), [capabilities]);
  const page = usePagedRows(open && step === 'select', queryKeyword, loadRows, reportLoadError);
  useEffect(() => {
    if (!open) return;
    setDirection('forward'); setDispatchRule('edd'); setBufferRatio(0); setUseOverride(false); setPolicy(null); setPolicyLoading(true); setSelected([]); setStep('select'); setPreview(null); setResult(null); setKeyword(initialKeyword ?? ''); setQueryKeyword(initialKeyword ?? ''); setRouteIds({}); setPlanCounts({});
    let active = true; setPolicyLoading(true);
    capabilities.loadPolicy().then((next) => { if (active) { setPolicy(next); setBufferRatio(next.defaultBufferRatio); } }).catch((error: unknown) => { if (active) { capabilities.reportError(error, { operation: 'load-schedule-policy' }); capabilities.notify('error', '加载排产缓冲策略失败'); } }).finally(() => { if (active) setPolicyLoading(false); });
    return () => { active = false; };
  }, [open, initialKeyword, capabilities]);
  useEffect(() => { const counts: Record<string, { workOrderCount: number; activeWorkOrderCount: number }> = {}; page.rows.forEach((row) => { counts[row.id] = { workOrderCount: row.workOrderCount ?? 0, activeWorkOrderCount: row.activeWorkOrderCount ?? 0 }; }); setRouteIds((current) => mergeCurrentPageRouteIds(current, page.rows)); setPlanCounts((current) => ({ ...current, ...counts })); }, [page.rows]);
  const effectiveBuffer = policy && !(useOverride && policy.allowBufferRatioOverride) ? policy.defaultBufferRatio : bufferRatio;
  const conflictPlanCount = selected.reduce((count, id) => count + ((planCounts[id]?.workOrderCount ?? 0) > 0 ? 1 : 0), 0);
  const conflictWorkOrderCount = selected.reduce((count, id) => count + (planCounts[id]?.workOrderCount ?? 0), 0);
  const input = (forceReplace?: boolean) => ({ planIds: selected, direction, dispatchRule, bufferRatio: effectiveBuffer, autoCreateWorkOrders: true as const, forceReplace });
  const getRouteIds = () => selected.map((id) => routeIds[id]).filter(Boolean);
  const doPreview = async (forceReplace?: boolean) => {
    if (!capabilities.canRun) return;
    setPreviewing(true);
    try { setPreview(await capabilities.preview(input(forceReplace))); setStep('preview'); }
    catch (error) { capabilities.reportError(error, { operation: 'preview-schedule-from-plans', routeIds: getRouteIds() }); }
    finally { setPreviewing(false); }
  };
  const handlePreview = () => {
    if (!selected.length) { capabilities.notify('warning', '请至少选择一个生产计划'); return; }
    if (!policy || policyLoading) { capabilities.notify('warning', '排产缓冲策略加载中'); return; }
    if (conflictPlanCount > 0) {
      Modal.confirm({ title: '部分计划已有工单', icon: <ExclamationCircleFilled />, content: `已选 ${selected.length} 个计划中有 ${conflictPlanCount} 个已关联共 ${conflictWorkOrderCount} 个工单。继续会取消草稿、审批中、已下达且未开工的旧工单并重新排产；已进入执行或终结状态的工单不会被取消。`, okText: '继续排产', cancelText: '返回修改', onOk: () => doPreview(true) });
      return;
    }
    void doPreview();
  };
  const doSubmit = async () => {
    if (!capabilities.canRun) return;
    setSubmitting(true);
    try { const next = await capabilities.submit(input(conflictPlanCount > 0 ? true : undefined)); setResult(next); setStep('done'); capabilities.notify('success', `排产完成：${next.planCount} 个计划 → ${next.workOrderCount} 个工单 → ${next.entryCount} 条排产 · ${appliedPolicyLabel(next.appliedPolicy, capabilities.formatAppliedPolicy)}`); }
    catch (error) { capabilities.reportError(error, { operation: 'submit-schedule-from-plans', routeIds: getRouteIds() }); }
    finally { setSubmitting(false); }
  };
  const close = () => { if (result) onSuccess(); else onClose(); };
  const showWorkOrders = async (plan: SchedulePlanRow) => {
    setWorkOrderModal(plan); setWorkOrderLoading(true); setWorkOrderError(false);
    try { setWorkOrders(await capabilities.loadPlanWorkOrders(plan.id)); } catch (error) { setWorkOrderError(true); capabilities.reportError(error, { operation: 'load-plan-work-orders', routeIds: plan.routeId ? [plan.routeId] : [] }); }
    finally { setWorkOrderLoading(false); }
  };
  const planColumns: TableColumnsType<SchedulePlanRow> = [
    { title: '计划号', dataIndex: 'planNo', width: 140, sorter: true },
    { title: '产品', width: 150, render: (_, row) => row.material?.name ?? '-' },
    { title: '计划数量', dataIndex: 'plannedQty', width: 95, align: 'right' },
    { title: '优先级', dataIndex: 'priority', width: 80, sorter: true, render: (value) => <Tag color={value >= 8 ? 'red' : value >= 5 ? 'orange' : 'default'}>{value}</Tag> },
    { title: '交期', dataIndex: 'dueDate', width: 120, sorter: true, render: (value, row) => value || row.planEndDate ? dayjs(value ?? row.planEndDate).format('YYYY-MM-DD') : '-' },
    { title: '路线', width: 90, render: (_, row) => row.route?.code ? <Tag color="blue">{row.route.code}</Tag> : <Typography.Text type="secondary">默认</Typography.Text> },
    { title: '工单', dataIndex: 'workOrderCount', width: 100, align: 'center', render: (value, row) => value ? <Button type="link" size="small" onClick={() => void showWorkOrders(row)}><Tag color={(row.activeWorkOrderCount ?? 0) > 0 ? 'red' : 'orange'} icon={(row.activeWorkOrderCount ?? 0) > 0 ? <ExclamationCircleFilled /> : <WarningOutlined />}>{value}</Tag></Button> : <Typography.Text type="secondary">0</Typography.Text> },
    { title: '限制', width: 180, render: (_, row) => (row.activeWorkOrderCount ?? 0) > 0 ? <Typography.Text type="danger">有执行或终结工单，不可排产</Typography.Text> : '-' },
  ];
  const workOrderColumns: TableColumnsType<SchedulePlanWorkOrder> = [
    { title: '工单号', dataIndex: 'workOrderNo', width: 220, render: (value, row) => <Space>{value}{capabilities.workOrderTypeLabels?.[row.workOrderType ?? 'normal'] && <Tag color={capabilities.workOrderTypeLabels[row.workOrderType ?? 'normal'].color}>{capabilities.workOrderTypeLabels[row.workOrderType ?? 'normal'].text}</Tag>}</Space> },
    { title: '物料档案', width: 190, render: (_, row) => <Space direction="vertical" size={0}>{row.materialName ?? '-'}{row.materialCode && <Typography.Text type="secondary">{row.materialCode}</Typography.Text>}</Space> },
    { title: '计划', dataIndex: 'plannedQty', width: 80, align: 'right' },
    { title: '完成', dataIndex: 'completedQty', width: 80, align: 'right' },
    { title: '进度', dataIndex: 'progress', width: 150, render: (value) => <Progress percent={value} size="small" status={value >= 100 ? 'success' : 'active'} /> },
  ];
  return (
    <Drawer title="从计划排产" width="min(1080px, 92vw)" open={open} onClose={close} destroyOnHidden footer={step === 'done' ? null : <Space style={{ width: '100%', justifyContent: 'space-between' }}><Typography.Text type="warning">{conflictPlanCount > 0 && <><WarningOutlined /> 已选 {conflictPlanCount} 个有关联工单的计划（共 {conflictWorkOrderCount} 个工单），排产时将取消可替换的旧工单</>}</Typography.Text><Space>{step === 'preview' ? <><Button onClick={() => setStep('select')} icon={<ArrowLeftOutlined />}>返回修改</Button><Button type="primary" icon={<CalendarOutlined />} loading={submitting} disabled={!capabilities.canRun} onClick={() => void doSubmit()}>确认排产</Button></> : <><Button onClick={close}>取消</Button><Button type="primary" icon={<CalendarOutlined />} loading={previewing} disabled={!capabilities.canRun || !selected.length || !policy || policyLoading} onClick={handlePreview}>预览排产 ({selected.length})</Button></>}</Space></Space>}>
      {step === 'select' && <Steps direction="vertical" current={-1} items={[
        { title: '排产方向', description: <Space direction="vertical" style={{ padding: '8px 0 16px' }}><Radio.Group value={direction} onChange={(event) => setDirection(event.target.value)}><Space direction="vertical">{directionOptions.map((option) => <Radio key={option.value} value={option.value}>{option.label}</Radio>)}</Space></Radio.Group><Typography.Text type="secondary">{directionOptions.find((option) => option.value === direction)?.tip}</Typography.Text></Space> },
        { title: '分派规则', description: <Space direction="vertical" style={{ padding: '8px 0 16px' }}><Radio.Group value={dispatchRule} onChange={(event) => setDispatchRule(event.target.value)}><Space direction="vertical">{ruleOptions.map((option) => <Radio key={option.value} value={option.value}>{option.label}</Radio>)}</Space></Radio.Group><Typography.Text type="secondary">{ruleOptions.find((option) => option.value === dispatchRule)?.tip}</Typography.Text></Space> },
        { title: '缓冲时间', description: <div style={{ padding: '8px 0 16px' }}><BufferPolicyControls policy={policy} loading={policyLoading} useOverride={useOverride} value={bufferRatio} options={bufferOptions} onUseOverride={setUseOverride} onChange={setBufferRatio} /></div> },
        { title: '选择生产计划', description: <Space direction="vertical" style={{ width: '100%', paddingTop: 8 }}><Input placeholder="搜索计划号/产品名称" allowClear size="small" prefix={<SearchOutlined />} value={keyword} onChange={(event) => { setKeyword(event.target.value); setQueryKeyword(event.target.value.trim()); page.setPage(1); }} /><Typography.Text type="secondary">仅显示已确认状态的计划。排产后将自动创建工单；若启用审批，工单会先进入审批流程。</Typography.Text>{Boolean(page.error) && <Alert type="error" showIcon message="生产计划加载失败" action={<Button size="small" onClick={() => void page.reload()}>重试</Button>} />}<Table rowKey="id" size="small" scroll={{ x: 1040 }} columns={planColumns} dataSource={page.rows} loading={page.loading} onChange={page.onTableChange} rowSelection={{ selectedRowKeys: selected, preserveSelectedRowKeys: true, onChange: (keys) => setSelected(keys.map(String)), getCheckboxProps: (row) => ({ disabled: (row.activeWorkOrderCount ?? 0) > 0 }) }} pagination={{ current: page.page, pageSize: page.pageSize, total: page.total, showSizeChanger: false }} /></Space> },
      ]} />}
      {step === 'preview' && preview && <Space direction="vertical" size="middle" style={{ width: '100%' }}><Descriptions size="small" bordered column={{ xs: 1, sm: 2, md: 3, lg: 5 }}><Descriptions.Item label="方向">{direction === 'forward' ? '正排' : '倒排'}</Descriptions.Item><Descriptions.Item label="规则">{ruleOptions.find((option) => option.value === dispatchRule)?.label.split('（')[0] ?? dispatchRule}</Descriptions.Item><Descriptions.Item label="粒度">{preview.entries.some((entry) => entry.isOutsourced) ? '设备级 / 委外时间段' : preview.entries.some((entry) => !entry.workCenterId && !entry.isOutsourced) ? '设备级 / 整单粗排' : '设备级'}</Descriptions.Item><Descriptions.Item label="缓冲策略">{appliedPolicyLabel(preview.appliedPolicy, capabilities.formatAppliedPolicy)}</Descriptions.Item><Descriptions.Item label="条目数">{preview.total}</Descriptions.Item></Descriptions>{preview.warnings.length > 0 && <Alert type="warning" showIcon message="注意事项" description={<ul>{preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>} />}<PreviewEntriesTable entries={preview.entries} />{preview.bomOutsourcing?.length ? <Space direction="vertical" style={{ width: '100%' }}><Typography.Text strong>BOM 委外件供料摘要</Typography.Text><Typography.Text type="secondary">按工单 BOM 和当前可用库存测算委外缺口；测算不会预留库存，正式排产时会按当时可用库存重新计算。</Typography.Text><BomOutsourcingTable rows={preview.bomOutsourcing} phase="preview" /></Space> : null}</Space>}
      {step === 'done' && result && <Space direction="vertical" size="middle" style={{ width: '100%' }}><Alert type="success" showIcon message="排产完成" description={`已排产 ${result.planCount} 个计划，自动创建 ${result.workOrderCount} 个工单、${result.entryCount} 条排产记录。若启用工单审批，工单先进入审批流程。缓冲策略：${appliedPolicyLabel(result.appliedPolicy, capabilities.formatAppliedPolicy)}`} action={<Button type="primary" onClick={() => { const earliest = (preview?.entries ?? []).map((entry) => entry.plannedStart).filter(Boolean).sort()[0]; onViewResult?.(earliest ? dayjs(earliest).format('YYYY-MM-DD') : undefined); close(); }}>查看结果</Button>} />{result.warnings.length > 0 && <Alert type="warning" showIcon message="注意事项" description={<ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>} />}{result.bomOutsourcing?.length ? <><Typography.Text strong>本次 BOM 委外件</Typography.Text><Typography.Text type="secondary">库存抵扣是排产时的测算记录，不代表库存已预留；备料时仍以实际库存为准。</Typography.Text><BomOutsourcingTable rows={result.bomOutsourcing} phase="result" /></> : null}</Space>}
      {!preview && step === 'preview' && <Alert type="warning" showIcon message="暂无预览数据" />}
      <Modal title={`关联工单 — ${workOrderModal?.planNo ?? ''}`} open={!!workOrderModal} onCancel={() => setWorkOrderModal(null)} footer={null} width={780}><Spin spinning={workOrderLoading}>{workOrderError ? <Alert type="error" showIcon message="关联工单加载失败" action={<Button onClick={() => workOrderModal && void showWorkOrders(workOrderModal)}>重试</Button>} /> : workOrders.length === 0 && !workOrderLoading ? <Typography.Text type="secondary">暂无关联工单</Typography.Text> : <Table rowKey="id" size="small" pagination={false} columns={workOrderColumns} dataSource={buildWorkOrderTree(workOrders)} expandable={{ childrenColumnName: 'children' }} />}</Spin></Modal>
    </Drawer>
  );
}
