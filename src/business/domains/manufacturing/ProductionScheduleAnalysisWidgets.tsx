import {
  CheckCircleOutlined,
  DeleteOutlined,
  ExperimentOutlined,
  PlusOutlined,
  SwapOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Divider,
  Empty,
  Modal,
  Progress,
  Radio,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  BottleneckCapabilities,
  BottleneckFilters,
  BottleneckItem,
  BottleneckPanelProps,
  ScenarioCompareProps,
  ScenarioRecord,
  SchedulePreviewEntry,
  ScheduleWorkOrderRow,
} from './production-schedule-workflows-types';

function compact(value: number, format?: (value: number) => string) {
  return format?.(value) ?? Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function bottleneckColumns(capabilities: BottleneckCapabilities): TableColumnsType<BottleneckItem> {
  const color = capabilities.getCapacityColor;
  return [
    { title: '工作中心', dataIndex: 'workCenterName', width: 160, render: (value) => <Typography.Text strong>{value}</Typography.Text> },
    { title: '计划平均负荷', dataIndex: 'avgUtilization', width: 160, sorter: (a, b) => a.avgUtilization - b.avgUtilization, defaultSortOrder: 'descend', render: (rate) => <Progress percent={Math.round(rate * 100)} size="small" strokeColor={color(rate)} format={(percent) => `${percent}%`} /> },
    { title: '实际平均占用', dataIndex: 'avgOccupiedUtilization', width: 160, render: (rate, row) => { const actual = rate ?? row.avgUtilization; return <Progress percent={Math.round(actual * 100)} size="small" strokeColor={color(actual)} format={(percent) => `${percent}%`} />; } },
    { title: '计划峰值', dataIndex: 'peakUtilization', width: 110, render: (rate) => <Tag color={color(rate)}>{Math.round(rate * 100)}%</Tag> },
    { title: '实际占用峰值', dataIndex: 'peakOccupiedUtilization', width: 120, render: (rate, row) => { const actual = rate ?? row.peakUtilization; return <Tag color={color(actual)}>{Math.round(actual * 100)}%</Tag>; } },
    { title: '计划峰值日期', dataIndex: 'peakDate', width: 120 },
    { title: '实际峰值日期', dataIndex: 'occupiedPeakDate', width: 120, render: (value, row) => value ?? row.peakDate },
    { title: '计划超载天数', dataIndex: 'overloadDays', width: 110, render: (days) => days > 0 ? <Tag color="error" icon={<WarningOutlined />}>{days} 天</Tag> : <Tag>0 天</Tag> },
    { title: '实际超载天数', dataIndex: 'occupiedOverloadDays', width: 110, render: (days, row) => { const actual = days ?? row.overloadDays; return actual > 0 ? <Tag color="error" icon={<WarningOutlined />}>{actual} 天</Tag> : <Tag>0 天</Tag>; } },
    { title: '设备可用', width: 125, render: (_, row) => <Tag color={row.unavailableEquipmentCount > 0 ? 'warning' : 'success'}>{row.availableEquipmentCount}/{row.totalEquipmentCount} 台</Tag> },
    { title: '有效并发', width: 120, render: (_, row) => <Tag color={row.capacityConstrainedByEquipment ? 'error' : 'processing'}>{row.effectiveConcurrency}/{row.configuredConcurrency}</Tag> },
    { title: '设备风险', width: 150, render: (_, row) => row.scheduledWithoutCapacity ? <Tag color="error">无产能仍有排产</Tag> : row.capacityConstrainedByEquipment ? <Tag color="error">故障压缩产能</Tag> : row.availabilityRisk ? <Tag color="warning">设备冗余下降</Tag> : <Tag color="success">正常</Tag> },
    { title: '优化建议', dataIndex: 'suggestions', width: 260, render: (suggestions: string[] = []) => suggestions.length ? <Space orientation="vertical" size={0}>{suggestions.map((suggestion) => <Typography.Text key={suggestion} type="secondary">• {suggestion}</Typography.Text>)}</Space> : <Typography.Text type="secondary">-</Typography.Text> },
  ];
}

function getRange(filters?: BottleneckFilters): [dayjs.Dayjs, dayjs.Dayjs] {
  if (filters?.startDate && filters?.endDate) return [dayjs(filters.startDate), dayjs(filters.endDate)];
  return [dayjs().startOf('day'), dayjs().add(6, 'day').endOf('day')];
}

/** @sunxu-layer business @sunxu-domain manufacturing @sunxu-reason Preserves planned and actual bottleneck metrics while date filters, fetching and capacity palette are supplied by the host.*/
export function BottleneckPanel({ filters, capabilities }: BottleneckPanelProps) {
  const controlled = !!filters;
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>(() => getRange(filters));
  const [data, setData] = useState<BottleneckItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<unknown>();
  useEffect(() => { if (filters) setRange(getRange(filters)); }, [filters?.startDate, filters?.endDate, filters?.zoom]);
  const query = useMemo<BottleneckFilters>(() => {
    if (!filters) return { startDate: range[0].format('YYYY-MM-DD'), endDate: range[1].format('YYYY-MM-DD') };
    return { ...filters, ...capabilities.getAnalysisRange?.(filters) };
  }, [capabilities, filters, range]);
  const load = useCallback(async () => {
    setLoading(true); setError(undefined);
    try { setData(await capabilities.load(query)); setLoaded(true); }
    catch (cause) { setError(cause); setLoaded(true); capabilities.reportError(cause); }
    finally { setLoading(false); }
  }, [capabilities, query]);
  useEffect(() => { void load(); }, [load]);
  if (!loaded && !loading) return null;
  const start = filters?.startDate ?? range[0].format('YYYY-MM-DD');
  const end = filters?.endDate ?? range[1].format('YYYY-MM-DD');
  const overload = data.filter((row) => row.peakUtilization > 1).length;
  const peak = data.reduce((value, row) => Math.max(value, row.peakUtilization), 0);
  const picker = <Space wrap><DatePicker.RangePicker presets={capabilities.presets?.map((preset) => ({ label: preset.label, value: preset.value.map((date) => dayjs(date)) as [dayjs.Dayjs, dayjs.Dayjs] }))} value={range} onChange={(dates) => { if (!controlled && dates?.[0] && dates[1]) setRange([dates[0], dates[1]]); }} disabled={controlled} allowClear={false} /><Button onClick={() => void load()} loading={loading}>刷新</Button></Space>;
  if (error && !data.length) return <Card title="瓶颈分析" extra={picker}><Alert type="error" showIcon message="瓶颈分析加载失败" action={<Button size="small" onClick={() => void load()}>重试</Button>} /></Card>;
  if (!data.length && !loading) return <Space orientation="vertical" style={{ width: '100%' }}><Space>{picker}</Space><Alert type="success" showIcon message="产能状况良好" description={`在 ${start} ~ ${end} 期间，所有工作中心利用率均在安全范围内。`} /></Space>;
  return <Card title={<Space><WarningOutlined style={{ color: '#fa541c' }} /><span>瓶颈分析</span><Tag color="warning">{data.length} 个工作中心需关注</Tag></Space>} extra={picker} style={{ marginTop: 16 }}>
    {Boolean(error) && <Alert type="warning" showIcon message="刷新失败，当前显示上次成功结果" style={{ marginBottom: 12 }} />}
    <Space size={32} wrap style={{ marginBottom: 16 }}><Statistic title="需关注" value={compact(data.length, capabilities.formatCompactNumber)} suffix="个工作中心" /><Statistic title="超载" value={compact(overload, capabilities.formatCompactNumber)} suffix="个工作中心" styles={{ content: { color: overload ? '#ff3141' : '#00b578' } }} />{data.length > 0 && <Statistic title="最高计划峰值" value={Math.round(peak * 100)} suffix="%" styles={{ content: { color: capabilities.getCapacityColor(peak) } }} />}</Space>
    <Table rowKey={(row) => row.workCenterId ?? `${row.workCenterName}-${row.peakDate}`} size="small" scroll={{ x: 1700 }} loading={loading} pagination={false} columns={bottleneckColumns(capabilities)} dataSource={data} />
  </Card>;
}

const algorithms = [
  { value: 'greedy' as const, label: '贪心算法' },
  { value: 'critical_path' as const, label: '关键路径法' },
];

function durationMinutes(entry: SchedulePreviewEntry) {
  if (Number.isFinite(entry.durationMinutes)) return entry.durationMinutes ?? 0;
  const start = dayjs(entry.plannedStart); const end = dayjs(entry.plannedEnd);
  return start.isValid() && end.isValid() && end.isAfter(start) ? Math.round(end.diff(start, 'minute')) : 0;
}

function durationLabel(minutes: number) {
  const safe = Math.max(0, Math.round(minutes));
  if (safe < 60) return `${safe}分钟`;
  const hours = Math.floor(safe / 60); const remain = safe % 60;
  if (hours < 24) return remain ? `${hours}小时${remain}分钟` : `${hours}小时`;
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return remainHours ? `${days}天${remainHours}小时` : `${days}天`;
}

function resourceKey(entry: SchedulePreviewEntry) { return entry.isOutsourced ? 'outsourcing' : entry.equipmentId ?? entry.workCenterId ?? null; }
function resourceLabel(entry: SchedulePreviewEntry) { return entry.isOutsourced ? '委外加工' : entry.equipmentName?.trim() || entry.workCenterName?.trim() || entry.equipmentId || entry.workCenterId || '未分配'; }
function operationLabel(entry: SchedulePreviewEntry) { return entry.isBuffer ? '尾部缓冲' : entry.operationName?.trim() || (entry.operationId ? `工序 ${entry.operationId.slice(0, 8)}` : '整单排产'); }

function scenarioMetrics(scenario: ScenarioRecord, baseline?: ScenarioRecord) {
  const workEntries = scenario.entries.filter((entry) => !entry.isBuffer);
  const resourceSet = new Set(workEntries.map(resourceKey).filter(Boolean));
  const totalMinutes = workEntries.reduce((sum, entry) => sum + durationMinutes(entry), 0);
  const latest = scenario.entries.map((entry) => dayjs(entry.plannedEnd)).filter((date) => date.isValid()).sort((a, b) => b.valueOf() - a.valueOf())[0];
  const byOrder = new Map<string, { end: number; due?: number }>();
  for (const entry of workEntries) {
    if (!entry.workOrderId) continue;
    const end = dayjs(entry.plannedEnd); if (!end.isValid()) continue;
    const existing = byOrder.get(entry.workOrderId);
    byOrder.set(entry.workOrderId, { end: Math.max(existing?.end ?? 0, end.valueOf()), due: existing?.due ?? (entry.workOrderPlanEndTime && dayjs(entry.workOrderPlanEndTime).isValid() ? dayjs(entry.workOrderPlanEndTime).valueOf() : undefined) });
  }
  const delays = [...byOrder.values()].filter((value) => value.due && value.end > value.due).map((value) => Math.round((value.end - value.due!) / 60000));
  const loads = new Map<string, number>(); workEntries.forEach((entry) => loads.set(resourceLabel(entry), (loads.get(resourceLabel(entry)) ?? 0) + durationMinutes(entry)));
  const top = [...loads].sort((a, b) => b[1] - a[1])[0];
  const sequence = (record: ScenarioRecord) => record.entries.filter((entry) => !entry.isBuffer).sort((a, b) => (dayjs(a.plannedStart).isValid() ? dayjs(a.plannedStart).valueOf() : 0) - (dayjs(b.plannedStart).isValid() ? dayjs(b.plannedStart).valueOf() : 0)).map((entry) => `${entry.workOrderId}:${entry.operationId ?? 'whole-order'}:${resourceKey(entry) ?? 'unassigned'}`);
  const baselineSeq = baseline ? sequence(baseline) : [];
  const currentSeq = sequence(scenario);
  const sequenceChanges = baseline && baseline.id !== scenario.id ? Array.from({ length: Math.max(baselineSeq.length, currentSeq.length) }, (_, i) => baselineSeq[i] === currentSeq[i] ? 0 : 1).reduce<number>((sum, n) => sum + n, 0) : null;
  const critical = workEntries.filter((entry) => entry.isCritical || (entry.operationId && scenario.criticalPath?.includes(entry.operationId)));
  const preview = [...workEntries].sort((a, b) => (dayjs(a.plannedStart).isValid() ? dayjs(a.plannedStart).valueOf() : 0) - (dayjs(b.plannedStart).isValid() ? dayjs(b.plannedStart).valueOf() : 0)).slice(0, 5);
  return { resources: resourceSet.size, totalMinutes, latest: latest?.format('MM/DD HH:mm') ?? '-', overdueCount: delays.length, maxDelay: Math.max(0, ...delays), topResource: top?.[0] ?? '-', topMinutes: top?.[1] ?? 0, criticalCount: scenario.criticalPath?.length || critical.length, criticalLabels: [...new Set(critical.map(operationLabel))].slice(0, 4), sequenceChanges, preview };
}

/**
 * @sunxu-layer business
 * @sunxu-domain manufacturing
 * @sunxu-reason Presents reusable scenario compare behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function ScenarioCompare({ onApply, capabilities }: ScenarioCompareProps) {
  const [rows, setRows] = useState<ScheduleWorkOrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<unknown>();
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [algorithm, setAlgorithm] = useState<'greedy' | 'critical_path'>('greedy');
  const [policy, setPolicy] = useState<Awaited<ReturnType<typeof capabilities.loadPolicy>> | null>(null);
  const [policyLoading, setPolicyLoading] = useState(true);
  const [scenarios, setScenarios] = useState<ScenarioRecord[]>([]);
  const [generating, setGenerating] = useState(false);
  const [routeIds, setRouteIds] = useState<Record<string, string>>({});
  const algorithmOptions = capabilities.algorithmOptions ?? algorithms;
  const loadPage = useCallback(async () => {
    setLoading(true); setListError(undefined);
    try { const result = await capabilities.loadWorkOrders({ page, pageSize: 5, status: 'released', executionState: 'unscheduled' }); setRows(result.list); setTotal(result.total); setRouteIds((current) => { const next = { ...current }; result.list.forEach((row) => { if (row.routeId) next[row.id] = row.routeId; else delete next[row.id]; }); return next; }); }
    catch (error) { setListError(error); capabilities.reportError(error, { operation: 'load-unscheduled-work-orders' }); }
    finally { setLoading(false); }
  }, [capabilities, page]);
  useEffect(() => { void loadPage(); }, [loadPage]);
  useEffect(() => {
    let active = true; setPolicyLoading(true);
    capabilities.loadPolicy().then((next) => { if (active) { setPolicy(next); if (next.setupRuleEnabled) setAlgorithm('greedy'); } }).catch((error: unknown) => { if (active) { setPolicy(null); capabilities.reportError(error, { operation: 'load-schedule-policy' }); capabilities.notify('error', '加载排产策略失败，请刷新后重试'); } }).finally(() => { if (active) setPolicyLoading(false); });
    return () => { active = false; };
  }, [capabilities]);
  const setupRules = policy?.setupRuleEnabled === true;
  const generate = async () => {
    if (!capabilities.canGenerate) return;
    if (!selectedIds.length) { capabilities.notify('warning', '请先选择要排产的工单'); return; }
    if (!policy || policyLoading) { capabilities.notify('warning', '排产策略加载中'); return; }
    setGenerating(true);
    try {
      const preview = await capabilities.preview({ workOrderIds: selectedIds, algorithm });
      const scenario: ScenarioRecord = { id: `scenario_${Date.now()}`, name: `${algorithmOptions.find((option) => option.value === algorithm)?.label ?? algorithm} · 设备级`, algorithm, createdAt: dayjs().format('HH:mm:ss'), entries: preview.entries ?? [], warnings: preview.warnings ?? [], criticalPath: preview.criticalPath ?? [] };
      setScenarios((current) => [...current, scenario]); capabilities.notify('success', `方案生成完成：${preview.total} 条排产记录`);
    } catch (error) { capabilities.reportError(error, { operation: 'preview-schedule-scenario', routeIds: selectedIds.map((id) => routeIds[id]).filter(Boolean) }); }
    finally { setGenerating(false); }
  };
  const applyScenario = (scenario: ScenarioRecord) => Modal.confirm({ title: '采纳此方案', content: `确定采纳「${scenario.name}」方案吗？这将创建 ${scenario.entries.length} 条排产记录。`, okText: '采纳', onOk: async () => { try { await capabilities.apply({ workOrderIds: selectedIds, algorithm: scenario.algorithm }); capabilities.notify('success', '方案已采纳'); setScenarios([]); onApply(); } catch (error) { capabilities.reportError(error, { operation: 'apply-schedule-scenario', routeIds: selectedIds.map((id) => routeIds[id]).filter(Boolean) }); throw error; } } });
  const columns: TableColumnsType<ScheduleWorkOrderRow> = [
    { title: '工单号', dataIndex: 'orderNo', width: 150 },
    { title: '产品', width: 150, render: (_, row) => row.material?.name ?? '-' },
    { title: '计划数量', dataIndex: 'plannedQty', width: 100, align: 'right' },
    { title: '交期', dataIndex: 'planEndTime', width: 120, render: (value) => value ? dayjs(value).format('YYYY-MM-DD') : '-' },
  ];
  return <Card title={<Space><ExperimentOutlined /><span>方案对比（What-If）</span></Space>} style={{ marginTop: 16 }}>
    <Card size="small" title={<Space><span>选择工单</span>{selectedIds.length > 0 && <Tag color="blue">已选 {selectedIds.length} 个</Tag>}</Space>} extra={<Space><Button size="small" onClick={() => setSelectedIds(rows.map((row) => row.id))}>全选当前页</Button><Button size="small" onClick={() => setSelectedIds([])}>清除</Button></Space>} style={{ marginBottom: 16 }}>
      {Boolean(listError) && <Alert type="error" showIcon message="待排产工单加载失败" action={<Button size="small" onClick={() => void loadPage()}>重试</Button>} style={{ marginBottom: 12 }} />}
      <Table rowKey="id" size="small" columns={columns} dataSource={rows} loading={loading} rowSelection={{ selectedRowKeys: selectedIds, preserveSelectedRowKeys: true, onChange: (keys) => setSelectedIds(keys.map(String)) }} pagination={{ current: page, pageSize: 5, total, showSizeChanger: false, onChange: setPage }} />
    </Card>
    <Space wrap style={{ marginBottom: 16 }}><Typography.Text type="secondary">算法：</Typography.Text><Radio.Group value={algorithm} onChange={(event) => { if (!(setupRules && event.target.value === 'critical_path')) setAlgorithm(event.target.value); }} optionType="button" size="small" options={algorithmOptions.map((option) => ({ ...option, disabled: setupRules && option.value === 'critical_path' }))} />{setupRules && <Alert type="info" showIcon message="已启用准备/换型规则，方案对比仅支持贪心算法" />}<Button icon={<PlusOutlined />} loading={generating} disabled={!selectedIds.length || policyLoading || !policy} onClick={() => void generate()}>生成方案</Button></Space>
    {scenarios.length === 0 ? <Empty description="暂无方案，选择工单后点击「生成方案」创建不同排产方案进行对比" /> : <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(scenarios.length, 3)}, minmax(260px, 1fr))`, gap: 16 }}>{scenarios.map((scenario) => {
      const stats = scenarioMetrics(scenario, scenarios[0]);
      return <Card key={scenario.id} title={<Space><SwapOutlined />{scenario.name}</Space>} extra={<Space><Button type="primary" size="small" disabled={!capabilities.canApply} icon={<CheckCircleOutlined />} onClick={() => applyScenario(scenario)}>采纳</Button><Button danger type="text" size="small" icon={<DeleteOutlined />} aria-label="移除方案" onClick={() => setScenarios((items) => items.filter((item) => item.id !== scenario.id))} /></Space>}>
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Space wrap><Statistic title="排产条目" value={compact(scenario.entries.length)} /><Statistic title="资源" value={compact(stats.resources)} /><Statistic title="总工时" value={`${stats.totalMinutes / 60 >= 100 ? (stats.totalMinutes / 60).toFixed(0) : (stats.totalMinutes / 60).toFixed(1)}h`} /></Space>
          <Descriptions size="small" column={1}><Descriptions.Item label="最晚完成">{stats.latest}</Descriptions.Item><Descriptions.Item label="延期工单"><Tag color={stats.overdueCount > 0 ? 'error' : 'success'}>{stats.overdueCount} 个</Tag></Descriptions.Item><Descriptions.Item label="最大延期">{durationLabel(stats.maxDelay)}</Descriptions.Item><Descriptions.Item label="顺序变化">{stats.sequenceChanges === null ? '基准方案' : `${stats.sequenceChanges} 处`}</Descriptions.Item><Descriptions.Item label="排产工时最多资源">{stats.topResource}{stats.topMinutes ? ` · ${durationLabel(stats.topMinutes)}` : ''}</Descriptions.Item><Descriptions.Item label="关键路径">{stats.criticalCount} 项 {stats.criticalLabels.length > 0 && <Space wrap>{stats.criticalLabels.map((label) => <Tag key={label} color="orange">{label}</Tag>)}</Space>}</Descriptions.Item><Descriptions.Item label="生成时间">{scenario.createdAt}</Descriptions.Item></Descriptions>
          {stats.preview.length > 0 && <><Divider style={{ margin: '8px 0' }} /><Typography.Text type="secondary">前序片段</Typography.Text>{stats.preview.map((entry, index) => <Space key={`${entry.workOrderId}-${entry.operationId}-${index}`} orientation="vertical" size={0} style={{ width: '100%' }}><Space style={{ width: '100%', justifyContent: 'space-between' }}><Typography.Text ellipsis title={`${entry.workOrderNo ?? ''} · ${operationLabel(entry)}`}>{index + 1}. {entry.workOrderNo ?? '-'} · {operationLabel(entry)}</Typography.Text><Typography.Text type="secondary" style={{ whiteSpace: 'nowrap' }}>{dayjs(entry.plannedStart).format('MM/DD HH:mm')}</Typography.Text></Space><Typography.Text type="secondary" style={{ fontSize: 12, paddingLeft: 24 }}>{resourceLabel(entry)}</Typography.Text></Space>)}</>}
          {scenario.warnings.length > 0 && <><Divider style={{ margin: '8px 0' }} />{scenario.warnings.map((warning) => <Alert key={warning} type="warning" showIcon icon={<WarningOutlined />} message={warning} />)}</>}
        </Space>
      </Card>;
    })}</div>}
  </Card>;
}
