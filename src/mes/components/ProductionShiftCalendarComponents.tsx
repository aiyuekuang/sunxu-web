import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  ProFormCheckbox,
  ProFormDependency,
  ProFormDigit,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Popconfirm,
  Space,
  Tag,
  TimePicker,
} from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChangeHistoryModal } from './ChangeHistoryModal';
import { ResizableProTable } from './ResizableTable';
import { ShiftBreakListField } from './ShiftBreakListField';
import type {
  CalendarExceptionFormModalProps,
  CalendarExceptionRecord,
  CalendarExceptionType,
  CalendarPage,
  CalendarResourceScope,
  CalendarTableProps,
  CalendarWeekday,
  ProductionShiftCalendarCapabilities,
  ProductionShiftCalendarProps,
  ShiftCalendarFormModalProps,
  ShiftCalendarListParams,
  ShiftCalendarRecord,
  ShiftCalendarUpsertPayload,
} from './production-shift-calendar-types';
import type { CalendarAuditRecord, CalendarHistoryTarget } from './schedule-reschedule-types';

const SHIFT_TIME_FORMAT = 'HH:mm';
const CALENDAR_DATE_FORMAT = 'YYYY-MM-DD';
const EXCEPTION_TYPE_VALUES: readonly CalendarExceptionType[] = [
  'holiday',
  'maintenance',
  'overtime',
];
const RESOURCE_SCOPE_VALUES: readonly CalendarResourceScope[] = [
  'company',
  'workCenter',
  'supplier',
];
const WEEKDAY_VALUES: readonly CalendarWeekday[] = [1, 2, 3, 4, 5, 6, 7];
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function getScopeOptions(capabilities: ProductionShiftCalendarCapabilities) {
  return RESOURCE_SCOPE_VALUES.map((value) => ({
    value,
    label: capabilities.scopeLabels[value],
  }));
}

function getWorkingDayOptions(capabilities: ProductionShiftCalendarCapabilities) {
  return WEEKDAY_VALUES.map((value) => ({
    value,
    label: capabilities.workingDayLabels[value],
  }));
}

function fieldProps(
  capabilities: ProductionShiftCalendarCapabilities,
  field: Parameters<ProductionShiftCalendarCapabilities['getFieldHelpProps']>[0],
): ReturnType<ProductionShiftCalendarCapabilities['getFieldHelpProps']> {
  return capabilities.getFieldHelpProps(field);
}

function toDayjsTime(value?: string | null, format = SHIFT_TIME_FORMAT) {
  if (!value) return undefined;
  const parsed = dayjs(value, format);
  return parsed.isValid() ? parsed : undefined;
}

function toDayjsDate(value?: string | null, format = CALENDAR_DATE_FORMAT) {
  if (!value) return undefined;
  const parsed = dayjs(value, format);
  return parsed.isValid() ? parsed : undefined;
}

function formatDateInput(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value.slice(0, 10);
  const parsed = dayjs(value as Date | Dayjs);
  return parsed.isValid() ? parsed.format(CALENDAR_DATE_FORMAT) : undefined;
}

function formatTime(value: Dayjs | undefined, format: string) {
  return value ? dayjs(value).format(format) : undefined;
}

function getResourceScope(
  workCenterId?: string | null,
  supplierId?: string | null,
  fixedSupplierId?: string,
): CalendarResourceScope {
  if (fixedSupplierId || supplierId) return 'supplier';
  if (workCenterId) return 'workCenter';
  return 'company';
}

function hasMatchingExceptionShiftScope(record: CalendarExceptionRecord) {
  if (!record.shiftCalendarId) return true;
  const shiftCalendar = record.shiftCalendar;
  if (!shiftCalendar) return false;
  return (
    (record.workCenterId ?? null) === (shiftCalendar.workCenterId ?? null) &&
    (record.supplierId ?? null) === (shiftCalendar.supplierId ?? null)
  );
}

function getScopePayload(
  scope: CalendarResourceScope,
  workCenterId?: string,
  supplierId?: string,
  fixedSupplierId?: string,
) {
  return {
    workCenterId: scope === 'workCenter' ? workCenterId ?? null : null,
    supplierId:
      scope === 'supplier'
        ? fixedSupplierId ?? supplierId ?? null
        : null,
  };
}

function toProTablePage<T>(page: CalendarPage<T>) {
  return {
    data: page.list ?? [],
    success: true,
    total: page.total ?? 0,
  };
}

function resolveHistoryName(record: CalendarExceptionRecord) {
  return (
    record.remarks ||
    record.startDate ||
    record.exceptionDate ||
    '日历例外'
  );
}

function useCalendarHistory(
  capabilities: ProductionShiftCalendarCapabilities,
) {
  return useMemo(
    () => ({
      loadHistory: capabilities.loadHistory,
      actionLabels: capabilities.historyActionLabels,
    }),
    [capabilities.historyActionLabels, capabilities.loadHistory],
  );
}

function ResourceSelect({
  capabilities,
  scope,
  name,
  exception = false,
}: {
  capabilities: ProductionShiftCalendarCapabilities;
  scope: 'workCenter' | 'supplier';
  name: 'workCenterId' | 'supplierId';
  exception?: boolean;
}) {
  const target = scope;
  const isWorkCenter = scope === 'workCenter';
  const label = isWorkCenter ? '工作中心' : '供应商';
  const helpField = exception
    ? isWorkCenter
      ? 'exceptionWorkCenterId'
      : 'exceptionSupplierId'
    : isWorkCenter
      ? 'workCenterId'
      : 'supplierId';
  const requiredMessage = isWorkCenter
    ? capabilities.messages.workCenterRequired
    : capabilities.messages.supplierRequired;
  const options = isWorkCenter
    ? capabilities.workCenterOptions
    : capabilities.supplierOptions;
  const help = fieldProps(capabilities, helpField);
  return capabilities.renderResourceSelect({
    name,
    target,
    label,
    placeholder: `请选择${label}`,
    options,
    requestOptions: (keyword) => capabilities.requestResourceOptions(target, keyword),
    fieldHelpProps: help,
    requiredMessage,
  });
}

function BreakField({
  capabilities,
}: {
  capabilities: ProductionShiftCalendarCapabilities;
}) {
  const timeFormat = SHIFT_TIME_FORMAT;
  const defaultBreak = capabilities.defaultBreak ?? {
    startTime: '12:00',
    endTime: '13:00',
  };
  return (
    <Form.Item
      {...fieldProps(capabilities, 'breaks')}
      name="breaks"
      trigger="onChange"
      valuePropName="value"
    >
      <ShiftBreakListField
        timeFormat={timeFormat}
        defaultBreak={{
          startTime: toDayjsTime(defaultBreak.startTime, timeFormat) ?? dayjs('12:00', timeFormat),
          endTime: toDayjsTime(defaultBreak.endTime, timeFormat) ?? dayjs('13:00', timeFormat),
        }}
      />
    </Form.Item>
  );
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain production-schedule
 * @sunxu-reason Keeps shift ownership, working-day, cross-day, break and effective-date rules while the MES host provides persistence, permissions, selectors, field help and messages.
 */
export function ShiftFormModal({
  open,
  onOpenChange,
  editingShift,
  fixedSupplierId,
  capabilities,
  onSuccess,
}: ShiftCalendarFormModalProps) {
  const isEditing = editingShift !== null;
  const scopeLocked = Boolean(fixedSupplierId);
  const timeFormat = SHIFT_TIME_FORMAT;
  const dateFormat = CALENDAR_DATE_FORMAT;
  const initialValues = useMemo(() => {
    if (!editingShift) {
      return {
        isActive: true,
        crossDay: false,
        wageMultiplier: 1,
        workingDays: [1, 2, 3, 4, 5],
        breaks: [],
        resourceScope: fixedSupplierId ? 'supplier' : 'company',
        supplierId: fixedSupplierId,
      };
    }
    return {
      code: editingShift.code ?? undefined,
      name: editingShift.name,
      shiftType: editingShift.shiftType ?? undefined,
      wageMultiplier: editingShift.wageMultiplier ?? 1,
      resourceScope: getResourceScope(
        editingShift.workCenterId,
        editingShift.supplierId,
        fixedSupplierId,
      ),
      workCenterId: editingShift.workCenterId || undefined,
      supplierId: editingShift.supplierId || fixedSupplierId || undefined,
      startTime: toDayjsTime(editingShift.startTime, timeFormat),
      endTime: toDayjsTime(editingShift.endTime, timeFormat),
      workingDays: editingShift.workingDays?.map(Number),
      crossDay: editingShift.crossDay ?? false,
      breaks: (editingShift.breaks ?? [])
        .filter((item) => Boolean(item.startTime && item.endTime))
        .map((item) => ({
          startTime: toDayjsTime(item.startTime, timeFormat) ?? dayjs('12:00', timeFormat),
          endTime: toDayjsTime(item.endTime, timeFormat) ?? dayjs('13:00', timeFormat),
        })),
      effectiveFrom: toDayjsDate(editingShift.effectiveFrom, dateFormat),
      effectiveTo: toDayjsDate(editingShift.effectiveTo, dateFormat),
      isActive: editingShift.isActive ?? true,
    };
  }, [dateFormat, editingShift, fixedSupplierId, timeFormat]);

  const handleFinish = async (values: {
    code?: string;
    name?: string;
    shiftType?: string;
    wageMultiplier?: number;
    resourceScope?: CalendarResourceScope;
    workCenterId?: string;
    supplierId?: string;
    startTime?: Dayjs;
    endTime?: Dayjs;
    workingDays?: number[];
    crossDay?: boolean;
    breaks?: Array<{ startTime: Dayjs; endTime: Dayjs }>;
    effectiveFrom?: Dayjs;
    effectiveTo?: Dayjs;
    isActive?: boolean;
  }) => {
    const scope = fixedSupplierId
      ? 'supplier'
      : (values.resourceScope ?? 'company');
    const payload: ShiftCalendarUpsertPayload = {
      code: values.code,
      name: values.name,
      shiftType: values.shiftType,
      wageMultiplier: values.wageMultiplier,
      ...getScopePayload(scope, values.workCenterId, values.supplierId, fixedSupplierId),
      startTime: formatTime(values.startTime, timeFormat),
      endTime: formatTime(values.endTime, timeFormat),
      workingDays: values.workingDays,
      crossDay: values.crossDay,
      breaks: (values.breaks ?? []).map((item) => ({
        startTime: dayjs(item.startTime).format(timeFormat),
        endTime: dayjs(item.endTime).format(timeFormat),
      })),
      // Blank effective bounds remain unbounded, matching the MES date contract.
      effectiveFrom: formatTime(values.effectiveFrom, dateFormat) ?? null,
      effectiveTo: formatTime(values.effectiveTo, dateFormat) ?? null,
      isActive: values.isActive,
    };
    if (editingShift) {
      await capabilities.updateShiftCalendar(editingShift.id, payload);
      capabilities.notifySuccess(capabilities.messages.shiftUpdated);
    } else {
      await capabilities.createShiftCalendar(payload);
      capabilities.notifySuccess(capabilities.messages.shiftCreated);
    }
    onSuccess();
    return true;
  };

  return (
    <ModalForm
      title={isEditing ? '编辑班次' : '新增班次'}
      width={480}
      open={open}
      onOpenChange={onOpenChange}
      modalProps={{
        destroyOnHidden: true,
        centered: true,
        styles: { body: { maxHeight: 'calc(100vh - 200px)', overflowX: 'hidden', overflowY: 'auto' } },
      }}
      initialValues={initialValues}
      onFinish={handleFinish}
    >
      <ProFormText
        name="code"
        {...fieldProps(capabilities, 'code')}
        placeholder="留空自动生成，如 SHIFT000001"
        fieldProps={{ maxLength: 64 }}
      />
      <ProFormText
        name="name"
        {...fieldProps(capabilities, 'name')}
        placeholder="请输入班次名称"
        rules={[{ required: true, message: capabilities.messages.shiftNameRequired }]}
      />
      <ProFormText
        name="shiftType"
        {...fieldProps(capabilities, 'shiftType')}
        placeholder="如：白班、晚班、加班"
        fieldProps={{ maxLength: 64 }}
      />
      <ProFormDigit
        name="wageMultiplier"
        {...fieldProps(capabilities, 'wageMultiplier')}
        min={0}
        fieldProps={{ precision: 4 }}
        rules={[{ required: true, message: capabilities.messages.wageMultiplierRequired }]}
      />
      {!scopeLocked ? (
        <>
          <ProFormRadio.Group
            name="resourceScope"
            {...fieldProps(capabilities, 'resourceScope')}
            options={getScopeOptions(capabilities)}
            rules={[{ required: true, message: capabilities.messages.scopeRequired }]}
          />
          <ProFormDependency name={['resourceScope']}>
            {({ resourceScope }) =>
              resourceScope === 'workCenter' ? (
                <ResourceSelect capabilities={capabilities} scope="workCenter" name="workCenterId" />
              ) : resourceScope === 'supplier' ? (
                <ResourceSelect capabilities={capabilities} scope="supplier" name="supplierId" />
              ) : null
            }
          </ProFormDependency>
        </>
      ) : null}
      <Form.Item
        name="startTime"
        {...fieldProps(capabilities, 'startTime')}
        rules={[{ required: true, message: capabilities.messages.startTimeRequired }]}
      >
        <TimePicker format={timeFormat} placeholder="请选择开始时间" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        name="endTime"
        {...fieldProps(capabilities, 'endTime')}
        rules={[{ required: true, message: capabilities.messages.endTimeRequired }]}
      >
        <TimePicker format={timeFormat} placeholder="请选择结束时间" style={{ width: '100%' }} />
      </Form.Item>
      <ProFormSwitch
        name="crossDay"
        {...fieldProps(capabilities, 'crossDay')}
      />
      <BreakField capabilities={capabilities} />
      <ProFormCheckbox.Group
        name="workingDays"
        {...fieldProps(capabilities, 'workingDays')}
        options={getWorkingDayOptions(capabilities)}
        rules={[{ required: true, message: capabilities.messages.workingDaysRequired }]}
      />
      <Form.Item
        name="effectiveFrom"
        {...fieldProps(capabilities, 'effectiveFrom')}
      >
        <DatePicker format={dateFormat} placeholder="留空表示从过去一直生效" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        name="effectiveTo"
        {...fieldProps(capabilities, 'effectiveTo')}
        dependencies={['effectiveFrom']}
        rules={[
          ({ getFieldValue }) => ({
            validator(_rule, value?: Dayjs) {
              const from = getFieldValue('effectiveFrom') as Dayjs | undefined;
              if (from && value && dayjs(value).isBefore(dayjs(from), 'day')) {
                return Promise.reject(new Error(capabilities.messages.effectiveEndBeforeStart));
              }
              return Promise.resolve();
            },
          }),
        ]}
      >
        <DatePicker format={dateFormat} placeholder="留空表示长期有效" style={{ width: '100%' }} />
      </Form.Item>
      <ProFormSwitch name="isActive" {...fieldProps(capabilities, 'isActive')} />
    </ModalForm>
  );
}

/** @sunxu-component mes-specific @sunxu-domain production-schedule @sunxu-reason Preserves the MES shift exception fields and date/time serialization while the host supplies API, ownership selectors, fixed exception metadata and field help. */
export function ExceptionFormModal({
  open,
  onOpenChange,
  editingException,
  fixedSupplierId,
  capabilities,
  onSuccess,
}: CalendarExceptionFormModalProps) {
  const isEditing = editingException !== null;
  const scopeLocked = Boolean(fixedSupplierId);
  const dateFormat = CALENDAR_DATE_FORMAT;
  const [form] = Form.useForm();
  const hasMismatchedShiftScope = Boolean(
    editingException?.shiftCalendarId &&
      !hasMatchingExceptionShiftScope(editingException),
  );
  const initialValues = useMemo(() => {
    if (!editingException) {
      return {
        isAllDay: true,
        resourceScope: fixedSupplierId ? 'supplier' : 'company',
        supplierId: fixedSupplierId,
      };
    }
    const startDate = editingException.startDate ?? editingException.exceptionDate;
    return {
      startDate: toDayjsDate(startDate?.slice(0, 10), dateFormat),
      endDate: toDayjsDate((editingException.endDate ?? startDate)?.slice(0, 10), dateFormat),
      isAllDay: editingException.isAllDay ?? true,
      startTime: editingException.startTime ?? undefined,
      endTime: editingException.endTime ?? undefined,
      type: editingException.type,
      resourceScope: getResourceScope(
        editingException.workCenterId,
        editingException.supplierId,
        fixedSupplierId,
      ),
      workCenterId: editingException.workCenterId || undefined,
      supplierId: editingException.supplierId || fixedSupplierId || undefined,
      shiftCalendarId: hasMismatchedShiftScope
        ? undefined
        : editingException.shiftCalendarId || undefined,
      remarks: editingException.remarks,
    };
  }, [dateFormat, editingException, fixedSupplierId, hasMismatchedShiftScope]);
  const ownerContextKey = `${open ? 'open' : 'closed'}:${editingException?.id ?? 'new'}:${fixedSupplierId ?? ''}`;
  const ownerValues = {
    resourceScope: initialValues.resourceScope as CalendarResourceScope | undefined,
    workCenterId: initialValues.workCenterId as string | undefined,
    supplierId: initialValues.supplierId as string | undefined,
  };
  const ownerValuesRef = useRef({ contextKey: ownerContextKey, values: ownerValues });
  if (ownerValuesRef.current.contextKey !== ownerContextKey) {
    ownerValuesRef.current = { contextKey: ownerContextKey, values: ownerValues };
  }
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(initialValues);
    ownerValuesRef.current = { contextKey: ownerContextKey, values: ownerValues };
  }, [form, initialValues, open, ownerContextKey]);

  const handleFinish = async (values: {
    resourceScope?: CalendarResourceScope;
    workCenterId?: string;
    supplierId?: string;
    startDate?: unknown;
    endDate?: unknown;
    isAllDay?: boolean;
    startTime?: string;
    endTime?: string;
    type?: CalendarExceptionType;
    shiftCalendarId?: string;
    remarks?: string;
  }) => {
    const startDate = formatDateInput(values.startDate);
    const endDate = formatDateInput(values.endDate) ?? startDate;
    const isAllDay = values.isAllDay ?? true;
    const startTime = values.startTime?.trim();
    const endTime = values.endTime?.trim();
    if (!startDate || !endDate) {
      capabilities.notifyError(capabilities.messages.dateRangeRequired);
      return false;
    }
    if (!values.type || !EXCEPTION_TYPE_VALUES.includes(values.type)) {
      capabilities.notifyError(capabilities.messages.typeRequired);
      return false;
    }
    if (endDate < startDate) {
      capabilities.notifyError(capabilities.messages.endDateBeforeStart);
      return false;
    }
    if (!isAllDay) {
      if (!startTime) {
        capabilities.notifyError(
          capabilities.messages.exceptionStartTimeRequired
            ?? capabilities.messages.allDayTimeRequired,
        );
        return false;
      }
      if (!endTime) {
        capabilities.notifyError(
          capabilities.messages.exceptionEndTimeRequired
            ?? capabilities.messages.allDayTimeRequired,
        );
        return false;
      }
      if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
        capabilities.notifyError(capabilities.messages.timeFormatInvalid);
        return false;
      }
      if (startTime === endTime) {
        capabilities.notifyError(capabilities.messages.timeRangeEqual);
        return false;
      }
    }

    const scope = fixedSupplierId
      ? 'supplier'
      : (values.resourceScope ?? 'company');
    const payload = {
      ...getScopePayload(scope, values.workCenterId, values.supplierId, fixedSupplierId),
      startDate,
      endDate,
      isAllDay,
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      // Kept for compatibility with the pre-range calendar-exception API.
      exceptionDate: startDate,
      type: values.type,
      shiftCalendarId: values.shiftCalendarId ?? null,
      remarks: values.remarks?.trim() ? values.remarks.trim() : null,
    };
    if (editingException) {
      await capabilities.updateCalendarException(editingException.id, payload);
      capabilities.notifySuccess(capabilities.messages.exceptionUpdated);
    } else {
      await capabilities.createCalendarException(payload);
      capabilities.notifySuccess(capabilities.messages.exceptionCreated);
    }
    onSuccess();
    return true;
  };

  const resolveShiftOptions = async (
    scope?: CalendarResourceScope,
    workCenterId?: string,
    supplierId?: string,
  ) => {
    const resolvedScope = fixedSupplierId ? 'supplier' : (scope ?? 'company');
    const targetSupplierId = fixedSupplierId ?? supplierId;
    const response = await capabilities.listShiftCalendars({
      page: 1,
      pageSize: 100,
      workCenterId: resolvedScope === 'workCenter' ? workCenterId : undefined,
      supplierId: resolvedScope === 'supplier' ? targetSupplierId : undefined,
    });
    return (response.list ?? [])
      .filter((shift) => {
        if (resolvedScope === 'company') return !shift.workCenterId && !shift.supplierId;
        if (resolvedScope === 'workCenter') return Boolean(workCenterId) && shift.workCenterId === workCenterId;
        return Boolean(targetSupplierId) && shift.supplierId === targetSupplierId;
      })
      .filter((shift) => shift.isActive !== false || shift.id === editingException?.shiftCalendarId)
      .map((shift) => ({
        label: shift.isActive === false ? `${shift.name}（已停用）` : shift.name,
        value: shift.id,
        disabled: shift.isActive === false,
      }));
  };

  const exceptionTypeOptions = EXCEPTION_TYPE_VALUES.map((value) => ({
    label: capabilities.exceptionTypeDisplay[value].label,
    value,
  }));

  return (
    <ModalForm
      title={isEditing ? '编辑日历例外' : '新增日历例外'}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onValuesChange={(changedValues, allValues) => {
        const nextOwnerValues = {
          resourceScope: allValues.resourceScope as CalendarResourceScope | undefined,
          workCenterId: allValues.workCenterId as string | undefined,
          supplierId: allValues.supplierId as string | undefined,
        };
        const ownerSelectionChanged = (
          ['resourceScope', 'workCenterId', 'supplierId'] as const
        ).some((field) => (
          field in changedValues
          && !Object.is(nextOwnerValues[field], ownerValuesRef.current.values[field])
        ));
        ownerValuesRef.current = { contextKey: ownerContextKey, values: nextOwnerValues };
        if (ownerSelectionChanged) {
          form.setFieldValue('shiftCalendarId', undefined);
        }
      }}
      modalProps={{
        destroyOnHidden: true,
        centered: true,
        styles: { body: { maxHeight: 'calc(100vh - 200px)', overflowX: 'hidden', overflowY: 'auto' } },
      }}
      initialValues={initialValues}
      onFinish={handleFinish}
    >
      <Form.Item
        name="startDate"
        {...fieldProps(capabilities, 'exceptionStartDate')}
        rules={[{ required: true, message: capabilities.messages.startDateRequired }]}
      >
        <DatePicker format={dateFormat} placeholder="请选择开始日期" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        name="endDate"
        {...fieldProps(capabilities, 'exceptionEndDate')}
        rules={[
          { required: true, message: capabilities.messages.endDateRequired },
          ({ getFieldValue }) => ({
            validator(_rule, value?: Dayjs | string) {
              const from = formatDateInput(getFieldValue('startDate'));
              const to = formatDateInput(value);
              if (from && to && to < from) {
                return Promise.reject(new Error(capabilities.messages.endDateBeforeStart));
              }
              return Promise.resolve();
            },
          }),
        ]}
      >
        <DatePicker format={dateFormat} placeholder="请选择结束日期" style={{ width: '100%' }} />
      </Form.Item>
      <ProFormSwitch
        name="isAllDay"
        {...fieldProps(capabilities, 'exceptionIsAllDay')}
      />
      <ProFormDependency name={['isAllDay']}>
        {({ isAllDay }) => isAllDay ? null : (
          <>
            <ProFormText
              name="startTime"
              {...fieldProps(capabilities, 'exceptionStartTime')}
              placeholder="例如 08:00"
              rules={[
                {
                  required: true,
                  message: capabilities.messages.exceptionStartTimeRequired
                    ?? capabilities.messages.allDayTimeRequired,
                },
                { pattern: TIME_REGEX, message: capabilities.messages.timeFormatInvalid },
              ]}
            />
            <ProFormText
              name="endTime"
              {...fieldProps(capabilities, 'exceptionEndTime')}
              placeholder="例如 20:00"
              rules={[
                {
                  required: true,
                  message: capabilities.messages.exceptionEndTimeRequired
                    ?? capabilities.messages.allDayTimeRequired,
                },
                { pattern: TIME_REGEX, message: capabilities.messages.timeFormatInvalid },
                ({ getFieldValue }) => ({
                  validator(_rule, value?: string) {
                    const startTime = String(getFieldValue('startTime') ?? '').trim();
                    const endTime = String(value ?? '').trim();
                    if (TIME_REGEX.test(startTime) && TIME_REGEX.test(endTime) && startTime === endTime) {
                      return Promise.reject(new Error(capabilities.messages.timeRangeEqual));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            />
          </>
        )}
      </ProFormDependency>
      <ProFormSelect
        name="type"
        {...fieldProps(capabilities, 'exceptionType')}
        placeholder="请选择类型"
        options={exceptionTypeOptions}
        rules={[{ required: true, message: capabilities.messages.typeRequired }]}
      />
      {!scopeLocked ? (
        <>
          <ProFormRadio.Group
            name="resourceScope"
            {...fieldProps(capabilities, 'resourceScope')}
            options={getScopeOptions(capabilities)}
            rules={[{ required: true, message: capabilities.messages.scopeRequired }]}
          />
          <ProFormDependency name={['resourceScope']}>
            {({ resourceScope }) => resourceScope === 'workCenter' ? (
              <ResourceSelect capabilities={capabilities} scope="workCenter" name="workCenterId" exception />
            ) : resourceScope === 'supplier' ? (
              <ResourceSelect capabilities={capabilities} scope="supplier" name="supplierId" exception />
            ) : null}
          </ProFormDependency>
        </>
      ) : null}
      <ProFormDependency name={['resourceScope', 'workCenterId', 'supplierId', 'shiftCalendarId']}>
        {({ resourceScope, workCenterId, supplierId, shiftCalendarId }) => (
          <>
            {hasMismatchedShiftScope && !shiftCalendarId ? (
              <Alert
                type="warning"
                showIcon
                message="原例外关联的班次与当前归属不一致"
                description="保存修改时会清除这条班次关联，使例外对当前归属下的所有班次生效；如需限定班次，请重新选择归属匹配的班次。"
                style={{ marginBottom: 16 }}
              />
            ) : null}
            <ProFormSelect
              key={`${resourceScope ?? 'company'}:${workCenterId ?? ''}:${supplierId ?? ''}`}
              name="shiftCalendarId"
              {...fieldProps(capabilities, 'exceptionShiftCalendarId')}
              placeholder="不选则对所有班次生效"
              showSearch
              fieldProps={{ allowClear: true }}
              request={() => resolveShiftOptions(
                resourceScope as CalendarResourceScope | undefined,
                workCenterId as string | undefined,
                supplierId as string | undefined,
              )}
            />
          </>
        )}
      </ProFormDependency>
      <ProFormTextArea
        name="remarks"
        {...fieldProps(capabilities, 'remarks')}
        placeholder="请输入备注"
        fieldProps={{ rows: 3 }}
      />
    </ModalForm>
  );
}

function CalendarHistory({
  target,
  capabilities,
  onClose,
}: {
  target: CalendarHistoryTarget | null;
  capabilities: ProductionShiftCalendarCapabilities;
  onClose: () => void;
}) {
  const historyCapabilities = useCalendarHistory(capabilities);
  return <ChangeHistoryModal target={target} onClose={onClose} capabilities={historyCapabilities} />;
}

function ownerText(record: { workCenter?: { name?: string | null } | null; workCenterId?: string | null; supplierId?: string | null }) {
  return record.workCenter?.name ?? (record.supplierId ? '—' : '公司默认');
}

function getActionItems(
  can: ProductionShiftCalendarCapabilities['permissions'],
  handlers: {
    history: () => void;
    edit: () => void;
    remove: () => void;
  },
) {
  const actions: ReactNode[] = [];
  if (can.viewHistory) actions.push(<Button key="history" type="link" size="small" onClick={handlers.history}>变更记录</Button>);
  if (can.edit) actions.push(<Button key="edit" type="link" size="small" onClick={handlers.edit}>编辑</Button>);
  if (can.delete) actions.push(<Button key="delete" type="link" size="small" danger onClick={handlers.remove}>删除</Button>);
  return actions.length > 0 ? actions : null;
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain production-schedule
 * @sunxu-reason Keeps server-filtered shift rows, pagination, refresh, permission-filtered actions, delete confirmation and injected audit history while the host provides MES APIs and dictionaries.
 */
export function ShiftTable({ capabilities, refreshKey, supplierId }: CalendarTableProps) {
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftCalendarRecord | null>(null);
  const [historyTarget, setHistoryTarget] = useState<CalendarHistoryTarget | null>(null);
  const can = capabilities.shiftPermissions ?? capabilities.permissions;
  const lastRefreshContext = useRef({ refreshKey, supplierId });
  const fixedSupplierId = supplierId;

  useEffect(() => {
    const previous = lastRefreshContext.current;
    lastRefreshContext.current = { refreshKey, supplierId };
    if (previous.refreshKey !== refreshKey || previous.supplierId !== supplierId) {
      actionRef.current?.reload();
    }
  }, [refreshKey, supplierId]);

  const handleDelete = async (record: ShiftCalendarRecord) => {
    const confirmed = await capabilities.confirmDelete(
      capabilities.deleteConfirmation('shift', record),
    );
    if (!confirmed) return;
    await capabilities.deleteShiftCalendar(record.id);
    capabilities.notifySuccess(capabilities.messages.deleted);
    actionRef.current?.reload();
  };

  const columns = useMemo<ProColumns<ShiftCalendarRecord>[]>(() => [
    {
      title: '工作中心',
      dataIndex: 'workCenterId',
      hideInTable: true,
      valueType: 'select',
      showSearch: true,
      debounceTime: 300,
      request: (params) => capabilities.requestResourceOptions('workCenter', String(params.keyWords ?? '')),
      fieldProps: { filterOption: false },
    },
    {
      title: '供应商',
      dataIndex: 'supplierId',
      hideInTable: true,
      valueType: 'select',
      showSearch: true,
      debounceTime: 300,
      request: (params) => capabilities.requestResourceOptions('supplier', String(params.keyWords ?? '')),
      fieldProps: { filterOption: false },
    },
    { title: '编码', dataIndex: 'code', width: 120, ellipsis: true, search: false },
    { title: '班次名称', dataIndex: 'name', width: 160 },
    { title: '类型', dataIndex: 'shiftType', width: 100, search: false, render: (_, record) => record.shiftType || '—' },
    {
      title: '计薪系数', dataIndex: 'wageMultiplier', width: 100, align: 'right', search: false,
      render: (_, record) => record.wageMultiplier != null ? Number(record.wageMultiplier).toFixed(4) : '1.0000',
    },
    { title: '工作中心', dataIndex: ['workCenter', 'name'], width: 140, search: false, render: (_, record) => ownerText(record) },
    { title: '供应商', dataIndex: ['supplier', 'name'], width: 160, search: false, render: (_, record) => record.supplier?.name ?? '—' },
    { title: '开始时间', dataIndex: 'startTime', width: 100, search: false },
    {
      title: '结束时间', dataIndex: 'endTime', width: 100, search: false,
      render: (_, record) => <span>{record.endTime}{record.crossDay ? <Tag color="purple" style={{ marginLeft: 4 }}>次日</Tag> : null}</span>,
    },
    {
      title: '休息时段', dataIndex: 'breaks', width: 200, search: false,
      render: (_, record) => {
        const breaks = (record.breaks ?? []).filter((item) => item.startTime && item.endTime);
        return breaks.length > 0 ? <span>{breaks.map((item) => <Tag key={`${item.startTime}-${item.endTime}`}>{item.startTime}~{item.endTime}</Tag>)}</span> : '—';
      },
    },
    {
      title: '工作日', dataIndex: 'workingDays', width: 260, search: false,
      render: (_, record) => <span>{(record.workingDays ?? []).map((day) => {
        const option = WEEKDAY_VALUES.find((value) => Number(value) === Number(day));
        return <Tag key={String(day)} color="blue">{option ? capabilities.workingDayLabels[option] : `第${day}天`}</Tag>;
      })}</span>,
    },
    {
      title: '生效起止', dataIndex: 'effectiveFrom', width: 210, search: false,
      render: (_, record) => record.effectiveFrom || record.effectiveTo
        ? <span>{record.effectiveFrom ?? '不限'} ~ {record.effectiveTo ?? '长期'}</span>
        : <span>长期有效</span>,
    },
    {
      title: '状态', dataIndex: 'isActive', width: 90, search: false,
      render: (_, record) => <Tag color={record.isActive ? 'success' : 'default'}>{record.isActive ? '启用' : '停用'}</Tag>,
    },
    {
      title: '', key: 'actions', dataIndex: '__actions', valueType: 'option', search: false, width: 48, resizable: false, fixed: false,
      render: (_, record) => getActionItems(can, {
        history: () => setHistoryTarget({ kind: 'shift', id: record.id, name: record.name }),
        edit: () => { setEditingShift(record); setModalOpen(true); },
        remove: () => { void handleDelete(record); },
      }),
    },
  ], [capabilities.requestResourceOptions, capabilities.workingDayLabels, can, handleDelete]);

  const request = async (params: Record<string, unknown>) => {
    const requestParams: ShiftCalendarListParams = {
      page: typeof params.current === 'number' ? params.current : 1,
      pageSize: typeof params.pageSize === 'number' ? params.pageSize : 10,
      workCenterId: typeof params.workCenterId === 'string' ? params.workCenterId : undefined,
      supplierId: fixedSupplierId ?? (typeof params.supplierId === 'string' ? params.supplierId : undefined),
      name: typeof params.name === 'string' ? params.name : undefined,
    };
    return toProTablePage(await capabilities.listShiftCalendars(requestParams));
  };

  return (
    <>
      <ResizableProTable<ShiftCalendarRecord>
        actionRef={actionRef}
        columns={columns}
        headerTitle="班次管理"
        rowKey="id"
        request={request}
        search={{ labelWidth: 'auto' }}
        resizable={{ serverSortFields: [], sortPersistenceKey: false }}
        pagination={{ defaultPageSize: 10, showSizeChanger: { getPopupContainer: (trigger) => trigger.ownerDocument.body } }}
        fitContainerHeight={false}
        scroll={{ x: 1420 }}
        toolBarRender={() => can.create ? [<Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => { setEditingShift(null); setModalOpen(true); }}>新增</Button>] : []}
      />
      <ShiftFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingShift={editingShift}
        fixedSupplierId={fixedSupplierId}
        capabilities={capabilities}
        onSuccess={() => actionRef.current?.reload()}
      />
      <CalendarHistory target={historyTarget} capabilities={capabilities} onClose={() => setHistoryTarget(null)} />
    </>
  );
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain production-schedule
 * @sunxu-reason Keeps server-filtered calendar exceptions, fixed HOLIDAY/MAINTENANCE/OVERTIME behavior, permission-controlled activation, pagination, refresh, and injected audit history.
 */
export function ExceptionTable({ capabilities, refreshKey, supplierId }: CalendarTableProps) {
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingException, setEditingException] = useState<CalendarExceptionRecord | null>(null);
  const [historyTarget, setHistoryTarget] = useState<CalendarHistoryTarget | null>(null);
  const [updatingExceptionId, setUpdatingExceptionId] = useState<string | null>(null);
  const can = capabilities.exceptionPermissions ?? capabilities.permissions;
  const lastRefreshContext = useRef({ refreshKey, supplierId });
  const fixedSupplierId = supplierId;

  useEffect(() => {
    const previous = lastRefreshContext.current;
    lastRefreshContext.current = { refreshKey, supplierId };
    if (previous.refreshKey !== refreshKey || previous.supplierId !== supplierId) {
      actionRef.current?.reload();
    }
  }, [refreshKey, supplierId]);

  const handleDelete = async (record: CalendarExceptionRecord) => {
    const confirmed = await capabilities.confirmDelete(
      capabilities.deleteConfirmation('exception', record),
    );
    if (!confirmed) return;
    await capabilities.deleteCalendarException(record.id);
    capabilities.notifySuccess(capabilities.messages.deleted);
    actionRef.current?.reload();
  };

  const handleToggleActive = async (record: CalendarExceptionRecord) => {
    const isActive = record.isActive === false;
    setUpdatingExceptionId(record.id);
    try {
      await capabilities.updateCalendarException(record.id, { isActive });
      capabilities.notifySuccess(isActive ? '日历例外已启用' : '日历例外已停用');
      actionRef.current?.reload();
    } catch (error) {
      capabilities.notifyError(error instanceof Error ? error.message : '更新日历例外状态失败');
    } finally {
      setUpdatingExceptionId(null);
    }
  };

  const columns = useMemo<ProColumns<CalendarExceptionRecord>[]>(() => [
    {
      title: '工作中心', dataIndex: 'workCenterId', hideInTable: true,
      valueType: 'select', showSearch: true, debounceTime: 300,
      request: (params) => capabilities.requestResourceOptions('workCenter', String(params.keyWords ?? '')),
      fieldProps: { filterOption: false },
    },
    {
      title: '供应商', dataIndex: 'supplierId', hideInTable: true,
      valueType: 'select', showSearch: true, debounceTime: 300,
      request: (params) => capabilities.requestResourceOptions('supplier', String(params.keyWords ?? '')),
      fieldProps: { filterOption: false },
    },
    {
      title: '日期范围', dataIndex: 'startDate', width: 180, search: false,
      render: (_, record) => {
        const start = record.startDate?.slice(0, 10) ?? record.exceptionDate?.slice(0, 10);
        const end = record.endDate?.slice(0, 10) ?? record.startDate?.slice(0, 10) ?? record.exceptionDate?.slice(0, 10);
        if (!start) return '-';
        return start === end ? start : `${start} ~ ${end}`;
      },
    },
    {
      title: '时段', dataIndex: 'isAllDay', width: 140, search: false,
      render: (_, record) => {
        if (record.isAllDay ?? (!record.startTime && !record.endTime)) return '全天';
        if (record.startTime && record.endTime) return `${record.startTime} ~ ${record.endTime}`;
        return '-';
      },
    },
    {
      title: '状态', dataIndex: 'isActive', width: 122, search: false,
      render: (_, record) => {
        const isActive = record.isActive !== false;
        return (
          <Space size={4}>
            <Tag color={isActive ? 'success' : 'default'}>{isActive ? '启用' : '停用'}</Tag>
            {can.edit ? (
              <Popconfirm
                title={isActive ? '停用后该例外不再参与排产和产能计算，确定停用吗？' : '启用后该例外将重新参与排产和产能计算，确定启用吗？'}
                onConfirm={() => handleToggleActive(record)}
              >
                <Button type="link" size="small" loading={updatingExceptionId === record.id}>
                  {isActive ? '停用' : '启用'}
                </Button>
              </Popconfirm>
            ) : null}
          </Space>
        );
      },
    },
    { title: '工作中心', dataIndex: ['workCenter', 'name'], width: 140, search: false, render: (_, record) => ownerText(record) },
    { title: '供应商', dataIndex: ['supplier', 'name'], width: 160, search: false, render: (_, record) => record.supplier?.name ?? '—' },
    {
      title: '类型', dataIndex: 'type', width: 100, valueType: 'select',
      valueEnum: Object.fromEntries(EXCEPTION_TYPE_VALUES.map((value) => [value, capabilities.exceptionTypeDisplay[value].label])),
      render: (_, record) => <Tag color={capabilities.exceptionTypeDisplay[record.type].color}>{capabilities.exceptionTypeDisplay[record.type].label}</Tag>,
    },
    { title: '班次', dataIndex: ['shiftCalendar', 'name'], width: 140, search: false, render: (_, record) => record.shiftCalendar?.name ?? '-' },
    { title: '备注', dataIndex: 'remarks', width: 200, search: false, ellipsis: true },
    {
      title: '', key: 'actions', dataIndex: '__actions', valueType: 'option', search: false, width: 48, resizable: false, fixed: false,
      render: (_, record) => getActionItems(can, {
        history: () => setHistoryTarget({ kind: 'exception', id: record.id, name: resolveHistoryName(record) }),
        edit: () => { setEditingException(record); setModalOpen(true); },
        remove: () => { void handleDelete(record); },
      }),
    },
  ], [capabilities.exceptionTypeDisplay, capabilities.requestResourceOptions, can, handleDelete, handleToggleActive, updatingExceptionId]);

  const request = async (params: Record<string, unknown>) => {
    const requestParams: ShiftCalendarListParams = {
      page: typeof params.current === 'number' ? params.current : 1,
      pageSize: typeof params.pageSize === 'number' ? params.pageSize : 10,
      workCenterId: typeof params.workCenterId === 'string' ? params.workCenterId : undefined,
      supplierId: fixedSupplierId ?? (typeof params.supplierId === 'string' ? params.supplierId : undefined),
      type: typeof params.type === 'string' && EXCEPTION_TYPE_VALUES.includes(params.type as CalendarExceptionType)
        ? params.type as CalendarExceptionType
        : undefined,
    };
    return toProTablePage(await capabilities.listCalendarExceptions(requestParams));
  };

  return (
    <>
      <ResizableProTable<CalendarExceptionRecord>
        actionRef={actionRef}
        columns={columns}
        headerTitle="日历例外"
        rowKey="id"
        materialColumnPriority="preserve"
        request={request}
        search={{ labelWidth: 'auto' }}
        resizable={{ serverSortFields: [], sortPersistenceKey: false }}
        pagination={{ defaultPageSize: 10, showSizeChanger: { getPopupContainer: (trigger) => trigger.ownerDocument.body } }}
        fitContainerHeight={false}
        scroll={{ x: 1260 }}
        toolBarRender={() => can.create ? [<Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => { setEditingException(null); setModalOpen(true); }}>新增</Button>] : []}
      />
      <ExceptionFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingException={editingException}
        fixedSupplierId={fixedSupplierId}
        capabilities={capabilities}
        onSuccess={() => actionRef.current?.reload()}
      />
      <CalendarHistory target={historyTarget} capabilities={capabilities} onClose={() => setHistoryTarget(null)} />
    </>
  );
}

/** @sunxu-component mes-specific @sunxu-domain production-schedule @sunxu-reason Combines the production shift and calendar-exception ledgers while all MES data, access checks, configuration help and side effects stay host supplied. */
export function ProductionShiftCalendar({ capabilities, refreshKey, supplierId }: ProductionShiftCalendarProps) {
  return (
    <Space orientation="vertical" size={16} style={{ display: 'flex', width: '100%' }}>
      <ShiftTable capabilities={capabilities} refreshKey={refreshKey} supplierId={supplierId} />
      <ExceptionTable capabilities={capabilities} refreshKey={refreshKey} supplierId={supplierId} />
    </Space>
  );
}
