import {
  CheckCircleOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import type { ActionType, ParamsType, ProColumns } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  TreeSelect,
  Typography,
} from 'antd';
import type { TablePaginationConfig } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EntityThumbnail } from './EntityThumbnail';
import { ResizableProTable, type ResizableProTableProps } from './ResizableTable';
import type {
  EntryFormDrawerProps,
  EntryListProps,
  ScheduleEntryFormValues,
  ScheduleEntryRecord,
  ScheduleSelectOption,
  ScheduleStatus,
  ScheduleWorkCenterOptionNode,
  WorkOrderScheduleDetail,
} from './production-schedule-workflows-types';

const STATUS_TABS: Array<{ key: string; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'scheduled', label: '待确认' },
  { key: 'confirmed', label: '已确认' },
  { key: 'in_progress', label: '生产中' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];
const SERVER_SORT_DIRECTIONS: Array<'ascend' | 'descend'> = ['ascend', 'descend'];

type EntryListTableParams = ParamsType & {
  current?: number;
  pageSize?: number;
  entryId?: string;
  workOrderId?: string;
  operationId?: string;
  keyword?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  refreshKey?: number;
};

type EntryListRequest = NonNullable<
  ResizableProTableProps<ScheduleEntryRecord, EntryListTableParams>['request']
>;

function fieldRules(required: boolean, message: string) {
  return required ? [{ required: true, message }] : [];
}

type WorkCenterNode = ScheduleWorkCenterOptionNode;

interface WorkCenterTreeSelectNode {
  title: string;
  value: string;
  selectable: boolean;
  children?: WorkCenterTreeSelectNode[];
}

function workCenterTreeData(nodes: readonly WorkCenterNode[]): WorkCenterTreeSelectNode[] {
  return nodes.filter((node) => node.isActive).map((node) => {
    const children = node.children?.length ? workCenterTreeData(node.children) : undefined;
    return { title: `${node.code} - ${node.name}`, value: node.id, selectable: !children?.length, children };
  });
}

function dateValue(value?: string | null) {
  if (!value) return undefined;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : undefined;
}

export function EntryFormDrawer({
  open,
  onOpenChange,
  editingEntry,
  onSuccess,
  prefillWorkOrderId,
  prefillWorkCenterId,
  prefillPlannedStart,
  capabilities,
}: EntryFormDrawerProps) {
  const [form] = Form.useForm<ScheduleEntryFormValues>();
  const isEdit = !!editingEntry;
  const isConfirmedEdit = editingEntry?.status === 'confirmed';
  const workOrderId = Form.useWatch('workOrderId', form);
  const operationId = Form.useWatch('operationId', form);
  const workCenterId = Form.useWatch('workCenterId', form);
  const [detail, setDetail] = useState<WorkOrderScheduleDetail>();
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<unknown>();
  const [tree, setTree] = useState<readonly WorkCenterNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState(false);
  const [workOrderOptions, setWorkOrderOptions] = useState<ScheduleSelectOption[]>([]);
  const [workOrderLoading, setWorkOrderLoading] = useState(false);
  const [workOrderLoadFailed, setWorkOrderLoadFailed] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [workOrderRouteIds, setWorkOrderRouteIds] = useState<Record<string, string>>({});
  const [equipmentOptions, setEquipmentOptions] = useState<ScheduleSelectOption[]>([]);
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [assigneeOptions, setAssigneeOptions] = useState<ScheduleSelectOption[]>([]);
  const [assigneeLoading, setAssigneeLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (editingEntry) {
      form.setFieldsValue({
        plannedStart: dateValue(editingEntry.plannedStart),
        plannedEnd: dateValue(editingEntry.plannedEnd),
        assigneeId: editingEntry.assigneeId ?? undefined,
        workCenterId: editingEntry.workCenterId ?? undefined,
        equipmentId: editingEntry.equipmentId ?? undefined,
      });
    } else {
      form.setFieldsValue({
        workOrderId: prefillWorkOrderId,
        workCenterId: prefillWorkCenterId,
        plannedStart: dateValue(prefillPlannedStart),
        assigneeId: capabilities.getCurrentUserId?.(),
      });
    }
  }, [open, editingEntry, prefillWorkOrderId, prefillWorkCenterId, prefillPlannedStart, capabilities, form]);

  useEffect(() => {
    if (!open || !workOrderId || isEdit) { setDetail(undefined); setDetailError(undefined); return; }
    let active = true;
    setDetailLoading(true); setDetailError(undefined); setDetail(undefined);
    capabilities.loadWorkOrderDetail(workOrderId).then((next) => { if (active) setDetail(next); }).catch((error: unknown) => { if (active) setDetailError(error); }).finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [open, workOrderId, isEdit, capabilities]);

  useEffect(() => {
    if (!open || isEdit || !workOrderId) return;
    let active = true;
    setTreeLoading(true); setTreeError(false);
    capabilities.loadWorkCenterTree().then((nodes) => { if (active) setTree(nodes as readonly WorkCenterNode[]); }).catch((error: unknown) => { if (active) { setTreeError(true); capabilities.reportError(error, { operation: 'load-work-center-tree' }); } }).finally(() => { if (active) setTreeLoading(false); });
    return () => { active = false; };
  }, [open, isEdit, workOrderId, capabilities]);

  useEffect(() => {
    if (!open || !isEdit) { setEquipmentOptions([]); return; }
    let active = true; setEquipmentLoading(true);
    capabilities.loadEquipment({ workCenterId }).then((options) => { if (active) setEquipmentOptions(options); }).catch((error: unknown) => { if (active) capabilities.reportError(error, { operation: 'load-equipment-options' }); }).finally(() => { if (active) setEquipmentLoading(false); });
    return () => { active = false; };
  }, [open, isEdit, workCenterId, capabilities]);

  useEffect(() => {
    if (!open) return;
    let active = true; setAssigneeLoading(true);
    capabilities.loadAssignees({}).then((options) => { if (active) setAssigneeOptions(options); }).catch((error: unknown) => { if (active) capabilities.reportError(error, { operation: 'load-assignee-options' }); }).finally(() => { if (active) setAssigneeLoading(false); });
    return () => { active = false; };
  }, [open, capabilities]);

  const operations = detail?.operations ?? [];
  const hasWholeOrderSchedule = detail?.hasWholeOrderSchedule ?? !!detail?.scheduleSlots?.length;
  const availableOperations = hasWholeOrderSchedule
    ? []
    : operations.filter((operation) => operation.status === 'pending' && !(operation.scheduleSlots?.length));
  const selectedOperation = availableOperations.find((operation) => operation.id === operationId);
  const isOutsourced = selectedOperation?.isOutsourced === true;
  const equipmentType = selectedOperation?.equipmentType?.trim();
  const needsEquipment = !!equipmentType;
  const needsWorkCenter = !!selectedOperation && !isOutsourced && !equipmentType && !selectedOperation.workCenterId;
  const hasEquipmentWithoutType = !!selectedOperation?.allowedEquipmentIds?.length && !equipmentType;
  const operationMessage = hasWholeOrderSchedule
    ? '这张工单已有整单排产记录，请调整原记录后再安排工序。'
    : '这张工单当前没有可新建的待排工序，请调整原排产记录或检查工序状态。';

  const loadWorkOrders = async (keyword?: string) => {
    setWorkOrderLoading(true);
    setWorkOrderLoadFailed(false);
    try { const options = await capabilities.loadReleasedWorkOrders({ keyword, page: 1, pageSize: 50 }); setWorkOrderOptions(options); setWorkOrderRouteIds((current) => ({ ...current, ...Object.fromEntries(options.filter((option) => option.routeId).map((option) => [option.value, option.routeId!])) })); }
    catch (error) { setWorkOrderLoadFailed(true); capabilities.reportError(error, { operation: 'load-released-work-orders' }); setWorkOrderOptions([]); }
    finally { setWorkOrderLoading(false); }
  };

  const loadEquipmentOptions = async (keyword?: string) => {
    setEquipmentLoading(true);
    try { setEquipmentOptions(await capabilities.loadEquipment({ workCenterId: workCenterId || undefined, equipmentType, keyword })); }
    catch (error) { capabilities.reportError(error, { operation: 'load-equipment-options' }); }
    finally { setEquipmentLoading(false); }
  };

  const retryWorkOrderDetail = async () => {
    if (!workOrderId) return;
    setDetailLoading(true); setDetailError(undefined);
    try { setDetail(await capabilities.loadWorkOrderDetail(workOrderId)); }
    catch (error) { setDetailError(error); capabilities.reportError(error, { operation: 'load-work-order-detail' }); }
    finally { setDetailLoading(false); }
  };

  const handleScan = async (scanValue: string) => {
    if (!scanValue.trim()) return;
    setScanLoading(true);
    try {
      const scanned = await capabilities.resolveScannedWorkOrder(scanValue.trim());
      if (scanned.status !== 'released') { capabilities.notify('error', '只有已下达状态的工单才能手工排产'); return; }
      if (form.getFieldValue('workOrderId') !== scanned.id) {
        form.setFieldsValue({
          operationId: undefined,
          workCenterId: undefined,
          equipmentId: undefined,
        });
      }
      form.setFieldValue('workOrderId', scanned.id);
      if (scanned.routeId) setWorkOrderRouteIds((current) => ({ ...current, [scanned.id]: scanned.routeId! }));
      setWorkOrderOptions((options) => options.some((option) => option.value === scanned.id) ? options : [...options, { value: scanned.id, label: scanned.label }]);
    } catch (error) { capabilities.reportError(error, { operation: 'resolve-scanned-work-order' }); }
    finally { setScanLoading(false); }
  };

  const handleFinish = async (values: ScheduleEntryFormValues) => {
    if (isEdit ? !capabilities.canUpdate : !capabilities.canCreate) { capabilities.notify('error', '当前账号无权修改排产记录'); return false; }
    const startValue = values.plannedStart;
    const endValue = values.plannedEnd;
    if (!startValue || (!isConfirmedEdit && !endValue)) { capabilities.notify('error', '请填写开始和结束时间'); return; }
    const start = dayjs(startValue);
    const end = endValue ? dayjs(endValue) : undefined;
    if (!start.isValid() || start.isBefore(dayjs())) { capabilities.notify('error', '开始时间不能早于当前时间'); return; }
    if (!isConfirmedEdit && (!end?.isValid() || !end.isAfter(start))) { capabilities.notify('error', '结束时间必须晚于开始时间'); return; }
    if (!isEdit && !values.workOrderId) { capabilities.notify('error', '请先选择工单'); return; }
    setSaving(true);
    try {
      if (editingEntry) {
        const updated = await capabilities.update(editingEntry.id, {
          plannedStart: capabilities.serializeDateTime(start.toDate()),
          ...(isConfirmedEdit ? {} : { plannedEnd: capabilities.serializeDateTime(end!.toDate()) }),
          assigneeId: values.assigneeId,
          equipmentId: values.equipmentId,
        });
        capabilities.notify('success', '排产记录已更新');
        (updated.warnings ?? []).forEach((warning) => capabilities.notify('warning', warning));
      } else {
        const created = await capabilities.create({
          workOrderId: values.workOrderId!, operationId: values.operationId,
          workCenterId: isOutsourced ? undefined : values.workCenterId,
          equipmentId: isOutsourced ? undefined : values.equipmentId,
          plannedStart: capabilities.serializeDateTime(start.toDate()),
          plannedEnd: capabilities.serializeDateTime(end!.toDate()),
          assigneeId: values.assigneeId,
        });
        capabilities.notify('success', '排产记录已创建');
        const dependency = created.dependencyConflictReason ?? created.dependencyWarning;
        if (dependency) capabilities.notify('warning', dependency);
      }
      onSuccess(); return true;
    } catch (error) { const routeId = editingEntry?.workOrder?.routeId ?? (values.workOrderId ? workOrderRouteIds[values.workOrderId] : undefined); capabilities.reportError(error, { operation: isEdit ? 'update-schedule-entry' : 'create-schedule-entry', routeIds: routeId ? [routeId] : [] }); return false; }
    finally { setSaving(false); }
  };

  return (
    <Drawer
      title={isEdit ? '编辑排产' : '手工排产'}
      open={open}
      size={520}
      destroyOnHidden
      onClose={() => onOpenChange(false)}
      extra={<Button type="primary" loading={saving} disabled={isEdit ? !capabilities.canUpdate : !capabilities.canCreate} onClick={() => form.submit()}>{isEdit ? '保存' : '创建排产'}</Button>}
    >
      <Form form={form} layout="vertical" disabled={isEdit ? !capabilities.canUpdate : !capabilities.canCreate} onFinish={handleFinish}>
        {isEdit && editingEntry && <Descriptions column={1} size="small" style={{ marginBottom: 24 }}><Descriptions.Item label="工单号">{editingEntry.workOrder?.orderNo ?? '-'}</Descriptions.Item><Descriptions.Item label="工作中心">{editingEntry.workCenter?.name ?? '-'}</Descriptions.Item><Descriptions.Item label="工序名称">{editingEntry.operation?.operationName ?? '-'}</Descriptions.Item></Descriptions>}
        {!isEdit && <>
          <Form.Item name="workOrderId" label={<span>关联工单{capabilities.fieldHelp?.workOrderId}</span>} rules={fieldRules(true, '请选择工单')}>
            <Select showSearch allowClear filterOption={false} placeholder="搜索待排产工单" loading={workOrderLoading} options={workOrderOptions} onSearch={(keyword) => void loadWorkOrders(keyword)} onDropdownVisibleChange={(visible) => { if (visible && !workOrderOptions.length) void loadWorkOrders(); }} notFoundContent={workOrderLoading ? <Spin size="small" /> : workOrderLoadFailed ? <Button type="link" onClick={() => void loadWorkOrders()}>加载失败，重试</Button> : workOrderOptions.length ? '没有匹配的工单' : <Space orientation="vertical" align="center">暂无可选工单{capabilities.openConfiguration && <Button type="link" size="small" onClick={() => capabilities.openConfiguration?.('workOrders')}>配置工单</Button>}</Space>} onChange={() => form.setFieldsValue({ operationId: undefined, workCenterId: undefined, equipmentId: undefined })} />
          </Form.Item>
          <Input.Search placeholder="扫码工单条码" enterButton="读取" loading={scanLoading} onSearch={(value) => void handleScan(value)} />
          {workOrderId && <>
            {detailLoading && <Spin size="small" />}
            {detailError && <Alert type="error" showIcon message={detailError instanceof Error ? detailError.message : '读取工单工序失败'} action={<Button size="small" onClick={() => void retryWorkOrderDetail()}>重试</Button>} />}
            {!detailLoading && !detailError && detail && operations.length > 0 && <Form.Item name="operationId" label={<span>工序{capabilities.fieldHelp?.operationId}</span>} rules={fieldRules(true, availableOperations.length ? '请选择待排产工序' : operationMessage)}><Select placeholder={availableOperations.length ? '选择待排产工序' : '没有可排工序'} disabled={!availableOperations.length} options={availableOperations.map((operation) => ({ label: `${operation.sequence}${operation.stageName ? ` · ${operation.stageName}` : ''} · ${operation.operationName}`, value: operation.id }))} onChange={() => form.setFieldsValue({ workCenterId: undefined, equipmentId: undefined })} /></Form.Item>}
            {!detailLoading && !detailError && detail && operations.length > 0 && availableOperations.length === 0 && !hasWholeOrderSchedule && <Alert type="info" showIcon message={operationMessage} />}
            {!detailLoading && !detailError && detail && operations.length === 0 && <Alert type="info" showIcon message="该工单没有工序安排，按整张工单排产。" />}
            {hasWholeOrderSchedule && <Alert type="info" showIcon message={operationMessage} />}
            {treeError && <Alert type="error" showIcon message="工作中心加载失败" action={<Button size="small" onClick={() => void capabilities.loadWorkCenterTree().then((nodes) => { setTree(nodes as readonly WorkCenterNode[]); setTreeError(false); }).catch(() => setTreeError(true))}>重试</Button>} />}
            {detail && !detailError && !isOutsourced && <>
              <Form.Item name="workCenterId" label={<span>工作中心{capabilities.fieldHelp?.workCenterId}</span>} rules={fieldRules(needsWorkCenter, '请选择工作中心')}>
                <TreeSelect showSearch allowClear treeDefaultExpandAll treeNodeFilterProp="title" placeholder={needsWorkCenter ? '选择本工序的工作中心' : '可选工作中心'} loading={treeLoading} treeData={workCenterTreeData(tree)} notFoundContent={treeLoading ? <Spin size="small" /> : treeError ? <Button type="link" onClick={() => void capabilities.loadWorkCenterTree().then((nodes) => { setTree(nodes as readonly WorkCenterNode[]); setTreeError(false); }).catch(() => setTreeError(true))}>加载失败，重试</Button> : <Space orientation="vertical" align="center">暂无可用工作中心{capabilities.openConfiguration && <Button type="link" size="small" onClick={() => capabilities.openConfiguration?.('workCenter')}>配置工作中心</Button>}</Space>} onChange={() => form.setFieldValue('equipmentId', undefined)} />
              </Form.Item>
              {hasEquipmentWithoutType && <Alert type="warning" showIcon message="工序限定了设备，但没有设备类型；请先维护工艺路线。" />}
              {(needsEquipment || workCenterId || !selectedOperation) && <Form.Item name="equipmentId" label={<span>设备{capabilities.fieldHelp?.equipmentId}</span>} rules={fieldRules(needsEquipment, '设备型工序必须选择设备')}><Select showSearch allowClear placeholder={needsEquipment ? '选择符合工序要求的设备' : '可选，搜索设备'} loading={equipmentLoading} options={equipmentOptions.filter((option) => !selectedOperation?.allowedEquipmentIds?.length || selectedOperation.allowedEquipmentIds.includes(option.value))} notFoundContent={equipmentLoading ? <Spin size="small" /> : <Space orientation="vertical" align="center">暂无可选设备{capabilities.openConfiguration && !selectedOperation?.allowedEquipmentIds?.length && <Button type="link" size="small" onClick={() => capabilities.openConfiguration?.('equipment')}>配置设备</Button>}</Space>} onDropdownVisibleChange={(visible) => { if (visible && !equipmentOptions.length) void loadEquipmentOptions(); }} onSearch={(keyword) => void loadEquipmentOptions(keyword)} /></Form.Item>}
            </>}
            {isOutsourced && <Alert type="info" showIcon message={detail?.supplierName ? `委外工序不占用内部工作中心和设备，供应商：${detail.supplierName}` : '委外工序不占用内部工作中心和设备，供应商按工序中已维护的信息带出。'} />}
          </>}
        </>}
        {isEdit && <Form.Item name="equipmentId" label={<span>设备{capabilities.fieldHelp?.equipmentId}</span>}><Select allowClear showSearch placeholder="可选，更换设备" loading={equipmentLoading} options={equipmentOptions} notFoundContent={equipmentLoading ? <Spin size="small" /> : <Space orientation="vertical" align="center">暂无可选设备{capabilities.openConfiguration && <Button type="link" size="small" onClick={() => capabilities.openConfiguration?.('equipment')}>配置设备</Button>}</Space>} onDropdownVisibleChange={(visible) => { if (visible && !equipmentOptions.length) void loadEquipmentOptions(); }} onSearch={(keyword) => void loadEquipmentOptions(keyword)} /></Form.Item>}
        <Form.Item name="plannedStart" label={<span>计划开始时间{capabilities.fieldHelp?.plannedStart}</span>} rules={fieldRules(true, '请选择开始时间')}><DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="plannedEnd" label={<span>计划结束时间{capabilities.fieldHelp?.plannedEnd}</span>} rules={fieldRules(!isConfirmedEdit, '请选择结束时间')} extra={isConfirmedEdit ? '已确认排产调整关键字段后会自动回退为待确认，并按原工时重算结束时间' : undefined}><DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} disabled={isConfirmedEdit} /></Form.Item>
        <Form.Item name="assigneeId" label={<span>执行人{capabilities.fieldHelp?.assigneeId}</span>}><Select showSearch allowClear placeholder="可选，选择执行人" loading={assigneeLoading} options={assigneeOptions} onSearch={(keyword) => void capabilities.loadAssignees({ keyword }).then(setAssigneeOptions).catch((error: unknown) => capabilities.reportError(error, { operation: 'search-assignees' }))} /></Form.Item>
      </Form>
    </Drawer>
  );
}

export function EntryList({ onEdit, onRefresh, refreshKey, initialEntryId, initialWorkOrderId, initialOperationId, canUpdate, canDelete, capabilities }: EntryListProps) {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [error, setError] = useState<unknown>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState('all');
  const [entryId, setEntryId] = useState(initialEntryId);
  const [workOrderId, setWorkOrderId] = useState(initialWorkOrderId);
  const [operationId, setOperationId] = useState(initialOperationId);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [range, setRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<ScheduleEntryRecord[]>([]);

  useEffect(() => { setEntryId(initialEntryId); setWorkOrderId(initialWorkOrderId); setOperationId(initialOperationId); }, [initialEntryId, initialWorkOrderId, initialOperationId]);
  useEffect(() => { const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 300); return () => clearTimeout(timer); }, [keyword]);
  const tableParams = useMemo(() => ({
    entryId,
    workOrderId,
    operationId,
    keyword: debouncedKeyword || undefined,
    status: status === 'all' ? undefined : status,
    startDate: range[0]?.format('YYYY-MM-DD'),
    endDate: range[1]?.format('YYYY-MM-DD'),
    refreshKey,
  }), [entryId, workOrderId, operationId, debouncedKeyword, status, range, refreshKey]);
  const request = useCallback<EntryListRequest>(async (params, sort) => {
    setError(undefined);
    const activeSort = Object.entries(sort).find(([, direction]) => direction === 'ascend' || direction === 'descend');
    const rawField = activeSort?.[0];
    const orderBy = rawField === 'workOrder.orderNo' || rawField === 'workOrder,orderNo'
      ? 'orderNo'
      : rawField ?? 'plannedStart';
    try {
      const response = await capabilities.load({
        page: params.current ?? 1,
        pageSize: params.pageSize ?? 20,
        entryId: params.entryId,
        workOrderId: params.workOrderId,
        operationId: params.operationId,
        keyword: params.keyword,
        status: params.status,
        startDate: params.startDate,
        endDate: params.endDate,
        orderBy,
        orderDir: activeSort?.[1] === 'descend' ? 'DESC' : 'ASC',
      });
      const data = response.list ?? [];
      return { data, total: response.total ?? data.length, success: true };
    } catch (cause) {
      setError(cause);
      capabilities.reportError(cause, { operation: 'load-schedule-entry-list' });
      throw cause;
    }
  }, [capabilities]);

  const doAction = async (action: 'confirm' | 'unconfirm' | 'unplan', ids: string[]) => {
    try {
      if (action === 'confirm') await capabilities.confirm(ids);
      if (action === 'unconfirm') await capabilities.unconfirm(ids);
      if (action === 'unplan') await capabilities.unplan(ids, { reasonCode: 'manual_adjustment', reason: ids.length > 1 ? '排产列表批量撤排' : '排产列表手动撤排' });
      capabilities.notify('success', action === 'confirm' ? `已确认 ${ids.length} 条排产` : action === 'unconfirm' ? `已取消确认 ${ids.length} 条排产` : `已撤排 ${ids.length} 条排产`);
      setSelectedKeys([]); setSelectedRows([]); onRefresh();
    } catch (cause) { const byId = new Map(selectedRows.map((row) => [row.id, row])); const routeIds = ids.map((id) => byId.get(id)?.workOrder?.routeId).filter((id): id is string => !!id); capabilities.reportError(cause, { operation: `schedule-${action}`, routeIds }); throw cause; }
  };
  const confirmAction = (action: 'confirm' | 'unconfirm' | 'unplan', ids: string[], title: string, description: React.ReactNode, okText: string) => Modal.confirm({ title, content: description, okText, okType: action === 'unplan' ? 'danger' : 'primary', onOk: () => doAction(action, ids) });
  const removeEntry = (row: ScheduleEntryRecord) => Modal.confirm({ title: '移入已取消', content: '确定要将此排产记录移入已取消吗？它会从“全部”隐藏，可在“已取消”中查看；若关联工单未开工，将同时取消该工单。', okText: '移入已取消', okType: 'danger', onOk: async () => { try { const result = await capabilities.remove(row.id); capabilities.notify('success', result.cancelledWorkOrderNo ? `已移入已取消并取消工单 ${result.cancelledWorkOrderNo}` : '排产记录已移入已取消'); onRefresh(); } catch (cause) { capabilities.reportError(cause, { operation: 'cancel-schedule-entry', routeIds: row.workOrder?.routeId ? [row.workOrder.routeId] : [] }); throw cause; } } });
  const selectionSummary = <Space orientation="vertical" size={4}>{selectedRows.map((row) => <Typography.Text key={row.id}>{row.workOrder?.orderNo ?? row.id} · {row.workOrder?.material?.name ?? '-'} · {row.operation?.operationName ?? row.operationName ?? '-'}</Typography.Text>)}</Space>;
  const batchActions = status === 'scheduled' ? <Space><Button type="link" icon={<CheckCircleOutlined />} disabled={!selectedKeys.length} onClick={() => confirmAction('confirm', selectedKeys, '批量确认排产', <Space orientation="vertical"><Typography.Text>确定要确认选中的 {selectedKeys.length} 条排产记录吗？</Typography.Text>{selectionSummary}</Space>, '批量确认')}>批量确认 ({selectedKeys.length})</Button><Button type="link" danger disabled={!selectedKeys.length} onClick={() => confirmAction('unplan', selectedKeys, '批量撤排', <Space orientation="vertical"><Typography.Text>撤排只释放资源占位，不取消工单。</Typography.Text>{selectionSummary}</Space>, '批量撤排')}>批量撤排 ({selectedKeys.length})</Button></Space> : status === 'confirmed' ? <Space><Button type="link" icon={<RollbackOutlined />} disabled={!selectedKeys.length} onClick={() => confirmAction('unconfirm', selectedKeys, '批量取消确认排产', <Space orientation="vertical"><Typography.Text>取消确认后才可调整工时，确定继续吗？</Typography.Text>{selectionSummary}</Space>, '批量取消确认')}>批量取消确认 ({selectedKeys.length})</Button><Button type="link" danger disabled={!selectedKeys.length} onClick={() => confirmAction('unplan', selectedKeys, '批量撤排', <Space orientation="vertical"><Typography.Text>撤排只释放资源占位，不取消工单。</Typography.Text>{selectionSummary}</Space>, '批量撤排')}>批量撤排 ({selectedKeys.length})</Button></Space> : null;
  const columns: ProColumns<ScheduleEntryRecord>[] = [
    { title: '工单号', dataIndex: ['workOrder', 'orderNo'], width: 170, sorter: true, sortDirections: SERVER_SORT_DIRECTIONS, render: (_, row) => row.workOrder?.orderNo ? <Typography.Text copyable>{row.workOrder.orderNo}</Typography.Text> : '-' },
    { title: '计划号', width: 145, render: (_, row) => { const value = row.workOrder?.planNo ?? row.planNo; return value ? <Typography.Text copyable>{value}</Typography.Text> : '-'; } },
    { title: '物料名称', width: 170, ellipsis: true, render: (_, row) => row.workOrder?.material?.name ?? '-' },
    { title: '计划数量', width: 110, align: 'right', render: (_, row) => { const qty = row.workOrder?.plannedQty; return qty == null ? '-' : `${qty}${row.workOrder?.material?.unit ? ` ${capabilities.formatUnit?.(row.workOrder.material.unit) ?? row.workOrder.material.unit}` : ''}`; } },
    { title: '缩略图', width: 90, render: (_, row) => <EntityThumbnail thumbnailUrl={row.workOrder?.material?.thumbnailUrl} previewUrl={row.workOrder?.material?.primaryImageUrl} alt={row.workOrder?.material?.name} size={36} /> },
    { title: '工序名称', width: 125, render: (_, row) => <Space>{row.operation?.operationName ?? row.operationName ?? '-'}{row.isOutsourced && <Tag color="purple">委外</Tag>}</Space> },
    { title: '依赖检查', width: 180, ellipsis: true, render: (_, row) => row.dependencyConflictReason ? <Tag color="error" title={row.dependencyConflictReason}>依赖冲突</Tag> : row.dependencyWarning ? <Tag color="warning" title={row.dependencyWarning}>依赖提醒</Tag> : row.predecessorSummary ?? '-' },
    { title: '工作中心', width: 120, render: (_, row) => row.isOutsourced ? <Tag color="purple">委外加工</Tag> : row.workCenter?.name ?? '-' },
    { title: '设备', width: 110, render: (_, row) => row.isOutsourced ? '外部资源' : row.equipment?.name ?? '-' },
    { title: '计划开始', dataIndex: 'plannedStart', width: 160, sorter: true, sortDirections: SERVER_SORT_DIRECTIONS, render: (_, row) => row.plannedStart ? dayjs(row.plannedStart).format('YYYY-MM-DD HH:mm') : '-' },
    { title: '计划结束', dataIndex: 'plannedEnd', width: 160, sorter: true, sortDirections: SERVER_SORT_DIRECTIONS, render: (_, row) => row.plannedEnd ? dayjs(row.plannedEnd).format('YYYY-MM-DD HH:mm') : '-' },
    { title: '工时', width: 100, render: (_, row) => { const mins = row.durationMinutes; return !mins || mins <= 0 ? '-' : mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}min` : `${mins}min`; } },
    { title: '执行人', width: 100, render: (_, row) => row.assignee?.realName ?? row.assignee?.username ?? '-' },
    { title: '状态', dataIndex: 'status', width: 150, sorter: true, sortDirections: SERVER_SORT_DIRECTIONS, render: (_, row) => { const cfg = capabilities.formatStatus(row.status); return <Space wrap><Tag color={cfg.color}>{cfg.label}</Tag>{row.reconfirmRequired && <Tag color="warning">待重确认</Tag>}{row.derivedFromEntryId && <Tag color="processing">剩余量补排</Tag>}{row.splitGroup && <Tag>拆分并行</Tag>}</Space>; } },
    { title: '操作', fixed: 'right', width: 210, render: (_, row) => <Space wrap>{canUpdate && row.status === 'scheduled' && <Button type="link" size="small" onClick={() => confirmAction('confirm', [row.id], '确认排产', `确定要确认排产记录「${row.workOrder?.orderNo ?? row.id}」吗？`, '确认')}>确认</Button>}{canUpdate && row.status === 'confirmed' && <Button type="link" size="small" onClick={() => confirmAction('unconfirm', [row.id], '取消确认排产', '取消确认后才可调整工时，确定继续吗？', '取消确认')}>取消确认</Button>}{canUpdate && ['scheduled', 'confirmed'].includes(row.status) && <Button type="link" size="small" onClick={() => onEdit(row)}>编辑</Button>}{canUpdate && ['scheduled', 'confirmed'].includes(row.status) && <Button type="link" size="small" danger onClick={() => confirmAction('unplan', [row.id], '撤排', '撤排只释放资源占位，不取消工单。', '撤排')}>撤排</Button>}{canDelete && ['scheduled', 'confirmed'].includes(row.status) && <Button type="link" size="small" danger onClick={() => removeEntry(row)}>移入已取消</Button>}</Space> },
  ];
  const onTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1); setPageSize(pagination.pageSize ?? 20);
  };
  return <Space orientation="vertical" style={{ width: '100%' }} size="middle">
    <Space wrap><Typography.Title level={5} style={{ margin: 0 }}>排产列表</Typography.Title><Space.Compact>{STATUS_TABS.map((tab) => <Button key={tab.key} type={status === tab.key ? 'primary' : 'default'} onClick={() => { setStatus(tab.key); setPage(1); setSelectedKeys([]); setSelectedRows([]); }}>{tab.label}</Button>)}</Space.Compact></Space>
    <Space wrap>{entryId && <Tag closable onClose={(event) => { event.preventDefault(); setEntryId(undefined); }}>待办定位</Tag>}<Input.Search aria-label="搜索排产记录" allowClear value={keyword} onChange={(event) => setKeyword(event.target.value)} onSearch={() => setDebouncedKeyword(keyword.trim())} placeholder="搜索计划号/工单号/物料/工序/设备/执行人" style={{ width: 320 }} /><DatePicker.RangePicker aria-label="排产记录日期范围" presets={capabilities.dateRangePresets?.map((preset) => ({ label: preset.label, value: preset.value.map((value) => dayjs(value)) as [dayjs.Dayjs, dayjs.Dayjs] }))} value={range} onChange={(dates) => { setRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null]); setPage(1); }} allowClear /></Space>
    {batchActions}
    {Boolean(error) && <Alert type="error" showIcon message="排产列表加载失败" action={<Button size="small" onClick={() => actionRef.current?.reload()}>重试</Button>} />}
    <ResizableProTable<ScheduleEntryRecord, EntryListTableParams>
      actionRef={actionRef}
      rowKey="id"
      size="small"
      search={false}
      fitContainerHeight={false}
      showRowIndex={false}
      scroll={{ x: 2300 }}
      columns={columns}
      request={request}
      params={tableParams}
      materialColumnPriority="preserve"
      resizable={{ persistenceKey: 'production-schedule-entry-list', sortPersistenceKey: false }}
      options={{ reload: false, density: false, fullScreen: false, setting: true }}
      onChange={onTableChange}
      rowSelection={canUpdate && ['scheduled', 'confirmed'].includes(status) ? { selectedRowKeys: selectedKeys, preserveSelectedRowKeys: true, onChange: (keys, selected) => { const ids = keys.map(String); setSelectedKeys(ids); setSelectedRows((current) => { const byId = new Map(current.map((row) => [row.id, row])); selected.forEach((row) => byId.set(row.id, row)); return ids.flatMap((id) => { const row = byId.get(id); return row ? [row] : []; }); }); }, getCheckboxProps: (record) => ({ disabled: record.status !== status }) } : undefined}
      pagination={{ current: page, pageSize, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100] }}
    />
  </Space>;
}
