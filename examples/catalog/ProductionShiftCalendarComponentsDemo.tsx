import { Modal, Space, Typography, message } from 'antd';
import { ProFormSelect } from '@ant-design/pro-components';
import { useMemo, useRef, useState } from 'react';
import { ProductionShiftCalendar } from '../../src/mes/components/ProductionShiftCalendarComponents';
import type {
  CalendarExceptionRecord,
  CalendarExceptionType,
  CalendarSelectOption,
  CalendarShiftMessageSet,
  ProductionShiftCalendarCapabilities,
  ShiftCalendarRecord,
} from '../../src/mes/components/production-shift-calendar-types';
import type { CalendarAuditRecord } from '../../src/mes/components/schedule-reschedule-types';

const messageSet: CalendarShiftMessageSet = {
  shiftCreated: '创建成功',
  shiftUpdated: '更新成功',
  exceptionCreated: '创建成功',
  exceptionUpdated: '更新成功',
  deleted: '已删除',
  shiftNameRequired: '请输入班次名称',
  wageMultiplierRequired: '请填写计薪系数',
  scopeRequired: '请选择归属',
  workCenterRequired: '请选择工作中心',
  supplierRequired: '请选择供应商',
  startTimeRequired: '请选择开始时间',
  endTimeRequired: '请选择结束时间',
  workingDaysRequired: '请选择工作日',
  effectiveEndBeforeStart: '生效结束日期不能早于生效开始日期',
  startDateRequired: '请选择开始日期',
  endDateRequired: '请选择结束日期',
  dateRangeRequired: '请填写完整日期范围',
  typeRequired: '请选择类型',
  endDateBeforeStart: '结束日期不能早于开始日期',
  allDayTimeRequired: '非全天例外必须填写开始和结束时间',
  exceptionStartTimeRequired: '请填写开始时间',
  exceptionEndTimeRequired: '请填写结束时间',
  timeFormatInvalid: '时间格式必须为 HH:mm',
  timeRangeEqual: '开始时间不能与结束时间相同',
};

const scopeLabels = {
  company: '公司默认',
  workCenter: '工作中心',
  supplier: '供应商',
} as const;

const workingDayLabels = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
} as const;

const workCenters: readonly CalendarSelectOption[] = [
  { label: '装配中心（WC-ASM）', value: 'wc-assembly' },
  { label: '机加工中心（WC-MACH）', value: 'wc-machining' },
];

const suppliers: readonly CalendarSelectOption[] = [
  { label: '华东协作厂', value: 'supplier-east' },
  { label: '精工外协', value: 'supplier-precision' },
];

const labelMap: Record<string, string> = {
  code: '班次编码',
  name: '班次名称',
  shiftType: '班次类型',
  wageMultiplier: '计薪系数',
  resourceScope: '归属',
  workCenterId: '工作中心',
  supplierId: '供应商',
  startTime: '开始时间',
  endTime: '结束时间',
  crossDay: '跨天班次',
  breaks: '休息时段',
  workingDays: '工作日',
  effectiveFrom: '生效开始日期',
  effectiveTo: '生效结束日期',
  isActive: '启用状态',
  exceptionStartDate: '开始日期',
  exceptionEndDate: '结束日期',
  exceptionIsAllDay: '全天例外',
  exceptionStartTime: '开始时间',
  exceptionEndTime: '结束时间',
  exceptionType: '类型',
  exceptionWorkCenterId: '工作中心',
  exceptionSupplierId: '供应商',
  exceptionShiftCalendarId: '班次',
  remarks: '备注',
};

const helpMap: Record<string, string> = {
  workCenterId: '这个班次只对哪个工作中心生效；排产和报工按工作中心匹配班次。',
  supplierId: '选择该班次适用的委外供应商。',
  startTime: '班次的上班起点时间，工时、计薪和排产占用都从它起算。',
  endTime: '班次的下班终点时间，和开始时间一起圈定这个班次的可排时段。',
  crossDay: '如晚班 20:00 → 次日 08:00，请开启此开关。',
  breaks: '添加一个或多个休息时段；新增时默认 12:00 至 13:00。',
  workingDays: '选择此班次每周适用的日期。',
  isActive: '停用后不再作为有效班次参与排产。',
  exceptionStartDate: '例外生效的首日。',
  exceptionEndDate: '例外生效的最后一天，包含所选日期。',
  exceptionIsAllDay: '开启后全天生效；关闭后需填写 HH:mm 时段。',
  exceptionStartTime: '非全天例外的起始时刻，格式为 HH:mm。',
  exceptionEndTime: '非全天例外的结束时刻，格式为 HH:mm。',
  exceptionType: '类型值由排产规则固定：假日/维护/加班。',
  exceptionWorkCenterId: '此例外只对所选工作中心生效。',
  exceptionSupplierId: '此例外只对所选委外供应商生效。',
  exceptionShiftCalendarId: '不选择班次时，对该归属下所有班次生效。',
  remarks: '记录例外原因或处理说明。',
};

const fieldExtraMap: Record<string, string> = {
  code: '用于报表、工资公式和外部系统引用；创建时不填会自动生成。',
  shiftType: '选填，便于统计和工资公式区分不同班次。',
  wageMultiplier: '默认 1。晚班、夜班等需要加成时可填 1.2、1.5 等。',
  effectiveFrom: '换班制时填未来日期，排产到那天自动启用；留空表示从过去一直生效。',
  effectiveTo: '给旧班次封口时填最后生效日；留空表示长期有效。',
};

const exceptionLabels: Record<CalendarExceptionType, { label: string; color: string }> = {
  holiday: { label: '假日', color: '#FF3141' },
  maintenance: { label: '维护', color: '#FF8F1F' },
  overtime: { label: '加班', color: '#00B578' },
};

const initialShifts: ShiftCalendarRecord[] = [
  {
    id: 'shift-assembly-day',
    code: 'SHIFT000001',
    name: '装配日班',
    shiftType: '白班',
    wageMultiplier: 1,
    workCenterId: 'wc-assembly',
    workCenter: { id: 'wc-assembly', name: '装配中心', code: 'WC-ASM' },
    startTime: '08:00',
    endTime: '17:00',
    workingDays: [1, 2, 3, 4, 5],
    crossDay: false,
    breaks: [{ startTime: '12:00', endTime: '13:00' }],
    effectiveFrom: null,
    effectiveTo: null,
    isActive: true,
  },
  {
    id: 'shift-supplier-night',
    code: 'SHIFT000007',
    name: '外协夜班',
    shiftType: '夜班',
    wageMultiplier: 1.5,
    supplierId: 'supplier-east',
    supplier: { id: 'supplier-east', name: '华东协作厂' },
    startTime: '20:00',
    endTime: '08:00',
    workingDays: [1, 2, 3, 4, 5, 6],
    crossDay: true,
    breaks: [],
    effectiveFrom: '2026-11-01',
    effectiveTo: null,
    isActive: true,
  },
];

const initialExceptions: CalendarExceptionRecord[] = [
  {
    id: 'exception-maintenance',
    workCenterId: 'wc-assembly',
    workCenter: { id: 'wc-assembly', name: '装配中心' },
    startDate: '2026-11-22',
    endDate: '2026-11-22',
    isAllDay: true,
    type: 'maintenance',
    remarks: '周末设备保养',
  },
  {
    id: 'exception-overtime',
    supplierId: 'supplier-east',
    supplier: { id: 'supplier-east', name: '华东协作厂' },
    startDate: '2026-11-24',
    endDate: '2026-11-24',
    isAllDay: false,
    startTime: '18:00',
    endTime: '22:00',
    type: 'overtime',
    shiftCalendarId: 'shift-supplier-night',
    shiftCalendar: { id: 'shift-supplier-night', name: '外协夜班' },
    remarks: '订单交付加班',
  },
];

function matchesOwner(
  record: { workCenterId?: string | null; supplierId?: string | null },
  params: { workCenterId?: string; supplierId?: string },
) {
  return (!params.workCenterId || record.workCenterId === params.workCenterId)
    && (!params.supplierId || record.supplierId === params.supplierId);
}

/** Executable catalog example with all business effects supplied as host capabilities. */
export function ProductionShiftCalendarComponentsDemo() {
  const [shifts, setShifts] = useState(initialShifts);
  const [exceptions, setExceptions] = useState(initialExceptions);
  const nextId = useRef(1);
  const capabilities = useMemo<ProductionShiftCalendarCapabilities>(() => {
    const notifySuccess = (text: string) => message.success(text);
    const notifyError = (text: string) => message.error(text);
    const listShiftCalendars = async (params: {
      page: number;
      pageSize: number;
      workCenterId?: string;
      supplierId?: string;
      name?: string;
    }) => {
      const filtered = shifts.filter((record) =>
        matchesOwner(record, params)
        && (!params.name || record.name.includes(params.name)),
      );
      const start = (params.page - 1) * params.pageSize;
      return { list: filtered.slice(start, start + params.pageSize), total: filtered.length };
    };
    const makeConfirmation = (title: string, content: string) => ({
      title,
      content,
      okText: '删除',
      danger: true,
    });
    return {
      listShiftCalendars,
      listCalendarExceptions: async (params) => {
        const filtered = exceptions.filter((record) =>
          matchesOwner(record, params)
          && (!params.type || record.type === params.type),
        );
        const start = (params.page - 1) * params.pageSize;
        return { list: filtered.slice(start, start + params.pageSize), total: filtered.length };
      },
      createShiftCalendar: async (payload) => {
        setShifts((current) => [...current, {
          ...payload,
          id: `demo-shift-${nextId.current++}`,
          name: payload.name ?? '新班次',
          startTime: payload.startTime ?? '08:00',
          endTime: payload.endTime ?? '17:00',
          workCenter: workCenters.find((item) => item.value === payload.workCenterId)
            ? { id: payload.workCenterId!, name: workCenters.find((item) => item.value === payload.workCenterId)?.label }
            : undefined,
          supplier: suppliers.find((item) => item.value === payload.supplierId)
            ? { id: payload.supplierId!, name: suppliers.find((item) => item.value === payload.supplierId)?.label }
            : undefined,
        }]);
      },
      updateShiftCalendar: async (id, payload) => {
        setShifts((current) => current.map((record) => record.id === id ? { ...record, ...payload } : record));
      },
      deleteShiftCalendar: async (id) => setShifts((current) => current.filter((record) => record.id !== id)),
      createCalendarException: async (payload) => {
        setExceptions((current) => [...current, {
          ...payload,
          id: `demo-exception-${nextId.current++}`,
          type: payload.type,
          workCenter: workCenters.find((item) => item.value === payload.workCenterId)
            ? { id: payload.workCenterId!, name: workCenters.find((item) => item.value === payload.workCenterId)?.label }
            : undefined,
          supplier: suppliers.find((item) => item.value === payload.supplierId)
            ? { id: payload.supplierId!, name: suppliers.find((item) => item.value === payload.supplierId)?.label }
            : undefined,
        }]);
      },
      updateCalendarException: async (id, payload) => {
        setExceptions((current) => current.map((record) => record.id === id ? { ...record, ...payload } : record));
      },
      deleteCalendarException: async (id) => setExceptions((current) => current.filter((record) => record.id !== id)),
      confirmDelete: (confirmation) => new Promise((resolve) => {
        Modal.confirm({
          title: confirmation.title,
          content: confirmation.content,
          okText: confirmation.okText,
          okType: confirmation.danger ? 'danger' : 'primary',
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      }),
      notifySuccess,
      notifyError,
      permissions: { create: true, edit: true, delete: true, viewHistory: true },
      shiftPermissions: { create: true, edit: true, delete: true, viewHistory: true },
      exceptionPermissions: { create: true, edit: true, delete: true, viewHistory: true },
      workCenterOptions: workCenters,
      supplierOptions: suppliers,
      requestResourceOptions: async (target, keyword = '') => {
        const options = target === 'workCenter' ? workCenters : suppliers;
        const normalized = keyword.trim().toLocaleLowerCase();
        return options.filter((option) => option.label.toLocaleLowerCase().includes(normalized));
      },
      scopeLabels,
      workingDayLabels,
      exceptionTypeDisplay: exceptionLabels,
      messages: messageSet,
      getFieldHelpProps: (field) => ({
        label: labelMap[field],
        tooltip: helpMap[field],
        extra: fieldExtraMap[field],
      }),
      renderResourceSelect: ({ name, label, placeholder, options, requestOptions, fieldHelpProps, requiredMessage }) => (
        <ProFormSelect
          key={name}
          name={name}
          label={fieldHelpProps.label ?? label}
          tooltip={fieldHelpProps.tooltip}
          extra={fieldHelpProps.extra}
          placeholder={placeholder}
          options={[...options]}
          request={(params) => requestOptions(String(params.keyWords ?? ''))}
          rules={[{ required: true, message: requiredMessage }]}
          fieldProps={{ showSearch: true, filterOption: false }}
        />
      ),
      loadHistory: async ({ kind, resourceId }): Promise<{ list?: CalendarAuditRecord[]; total?: number }> => ({
        list: [{
          id: `history-${kind}-${resourceId}`,
          createdAt: '2026-11-20T08:30:00.000Z',
          action: 'update',
          userName: '计划员',
          description: kind === 'shift' ? '调整了班次生效日期' : '更新了日历例外时段',
        }],
        total: 1,
      }),
      historyActionLabels: { create: '新增', update: '修改', delete: '删除' },
      deleteConfirmation: (kind, record) => kind === 'shift'
        ? makeConfirmation('确认删除', `确定要删除班次「${(record as ShiftCalendarRecord).name}」吗？删除只适用于误建且尚未使用的班次；已产生上机、OEE或日历例外记录的班次请编辑后停用。`)
        : makeConfirmation('确认删除', '确定要删除该日历例外吗？'),
      defaultBreak: { startTime: '12:00', endTime: '13:00' },
    };
  }, [exceptions, shifts]);

  return (
    <Space orientation="vertical" size={12} style={{ display: 'flex', width: '100%' }}>
      <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
        班次与例外的 API、权限、选项、字段帮助、消息及变更记录均由此 Demo 的宿主能力提供。
      </Typography.Paragraph>
      <ProductionShiftCalendar capabilities={capabilities} />
    </Space>
  );
}

export default ProductionShiftCalendarComponentsDemo;
