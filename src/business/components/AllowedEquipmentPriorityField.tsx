import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popover,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType, TableRowSelection } from 'antd/es/table/interface';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ResizableProTable as ProTable,
  ResizableTable as Table,
} from './ResizableTable';
import { useMesAllowedEquipmentPriorityCapabilities } from '../MesUiProvider';
import type {
  MesEquipmentOption,
  MesEquipmentTimeProfile,
  MesShiftCalendarOption,
} from './allowed-equipment-priority-types';

export type AllowedEquipmentPriorityFieldProps = {
  value?: string[] | null;
  onChange?: (ids: string[]) => void;
  equipmentType?: string;
  workCenterId?: string;
};

type SelectedEquipmentRow = {
  id: string;
  equipment?: MesEquipmentOption;
  unavailable: boolean;
  allowed: boolean;
  priorityIndex: number;
  profiles: Array<
    MesEquipmentTimeProfile
  >;
};

type ShiftOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type PageResult<T> = {
  list?: T[];
  total?: number;
};

async function listAllPages<T>(
  fetchPage: (page: number, pageSize: number) => Promise<PageResult<T>>,
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const result = await fetchPage(page, pageSize);
    const currentPage = result.list ?? [];
    if (currentPage.length === 0) break;
    items.push(...currentPage);
    if (
      currentPage.length < pageSize ||
      (result.total !== undefined && items.length >= result.total)
    ) {
      break;
    }
    page += 1;
  }

  return items;
}

function formatUnitRate(minutesPerPiece?: number | null): string | undefined {
  const minutes = Number(minutesPerPiece);
  if (!Number.isFinite(minutes) || minutes <= 0) return undefined;
  const rate = 1 / minutes;
  const formatted = Number(rate.toFixed(2)).toLocaleString('zh-CN');
  return `≈ ${formatted} 件/分钟`;
}

/**
 * @sunxu-layer business
 * @sunxu-domain scheduling
 * @sunxu-reason Preserves MES allowed-equipment scope, priority ordering, default/shift standard times, and inherited operation time while equipment, shift, dictionary, and pagination data stay host supplied.
 */
export function AllowedEquipmentPriorityField({
  value,
  onChange,
  equipmentType,
  workCenterId,
}: AllowedEquipmentPriorityFieldProps) {
  const { message } = App.useApp();
  const form = Form.useFormInstance();
  const capabilities = useMesAllowedEquipmentPriorityCapabilities();
  const equipmentTypeLabelMap = capabilities?.equipmentTypeLabels ?? {};
  const actionRef = useRef<ActionType>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const [keywordDraft, setKeywordDraft] = useState('');
  const [keyword, setKeyword] = useState('');
  const [equipmentById, setEquipmentById] = useState<
    Record<string, MesEquipmentOption>
  >({});
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [shiftOptions, setShiftOptions] = useState<ShiftOption[]>([]);
  const [shiftOptionsLoaded, setShiftOptionsLoaded] = useState(false);
  const [openShiftPopoverId, setOpenShiftPopoverId] = useState<string | null>(
    null,
  );
  const requestedDetailIdsRef = useRef(new Set<string>());

  const selectedIds = useMemo(
    () => [...new Set((value ?? []).filter(Boolean))],
    [value],
  );
  const equipmentTimeProfiles =
    (Form.useWatch('equipmentTimeProfiles', form) as
      | MesEquipmentTimeProfile[]
      | undefined) ?? [];
  const operationStandardTime = Form.useWatch('standardTime', form) as
    | number
    | string
    | null
    | undefined;
  const inheritedStandardTime = Number(operationStandardTime);

  const equipmentColumns = useMemo<ProColumns<MesEquipmentOption>[]>(
    () => [
      { title: '设备编号', dataIndex: 'code', width: 150 },
      { title: '设备名称', dataIndex: 'name', width: 180 },
      {
        title: '设备类型',
        dataIndex: 'equipmentType',
        width: 150,
        render: (_value, record) =>
          record.equipmentType
            ? (equipmentTypeLabelMap[record.equipmentType] ??
              record.equipmentType)
            : '-',
      },
      {
        title: '所属工作中心',
        dataIndex: 'workCenter',
        ellipsis: true,
        render: (_value, record) => record.workCenter?.name ?? '-',
      },
    ],
    [equipmentTypeLabelMap],
  );

  const cacheEquipment = useCallback((items: MesEquipmentOption[]) => {
    if (items.length === 0) return;
    setEquipmentById((current) => {
      const next = { ...current };
      items.forEach((item) => {
        next[item.id] = item;
      });
      return next;
    });
    setUnavailableIds((current) => {
      const next = new Set(current);
      items.forEach((item) => {
        next.delete(item.id);
      });
      return next;
    });
  }, []);

  useEffect(() => {
    const missingIds = [
      ...new Set([
        ...selectedIds,
        ...equipmentTimeProfiles.map((profile) => profile.equipmentId),
      ]),
    ].filter(
      (id) => !equipmentById[id] && !requestedDetailIdsRef.current.has(id),
    );
    if (missingIds.length === 0) return;
    if (!capabilities) return;
    missingIds.forEach((id) => {
      requestedDetailIdsRef.current.add(id);
    });

    void Promise.all(
      missingIds.map(async (id) => {
        try {
          return await capabilities.requestEquipmentDetail({ id });
        } catch {
          return null;
        }
      }),
    ).then((items) => {
      const loaded = items.filter(
        (item): item is MesEquipmentOption => item !== null,
      );
      const failedIds = missingIds.filter(
        (id) => !loaded.some((item) => item.id === id),
      );
      cacheEquipment(loaded);
      if (failedIds.length > 0) {
        setUnavailableIds((current) => new Set([...current, ...failedIds]));
        message.warning('部分已配置设备资料暂时无法读取，请移除后重新选择');
      }
    });
  }, [
    cacheEquipment,
    capabilities,
    equipmentById,
    equipmentTimeProfiles,
    message,
    selectedIds,
  ]);

  useEffect(() => {
    let active = true;
    setShiftOptionsLoaded(false);
    if (!capabilities) {
      setShiftOptionsLoaded(true);
      return;
    }
    void listAllPages<MesShiftCalendarOption>((page, pageSize) =>
      capabilities.requestShiftCalendars({ page, pageSize }),
    )
      .then((shifts) => {
        if (!active) return;
        setShiftOptions(
          shifts.map((shift) => ({
            label: `${shift.name}${shift.isActive ? '' : '（已停用）'}（${shift.startTime}-${shift.endTime}）`,
            value: shift.id,
            disabled: shift.isActive !== true,
          })),
        );
        setShiftOptionsLoaded(true);
      })
      .catch(() => {
        if (active) message.warning('班次列表读取失败，请刷新页面后重试');
      });
    return () => {
      active = false;
    };
  }, [capabilities, message]);

  const handleRequest = useCallback(
    async (params: { current?: number; pageSize?: number }) => {
      const requestParams = {
        page: params.current ?? 1,
        pageSize: params.pageSize ?? 20,
        keyword: keyword || undefined,
        equipmentType,
        workCenterId: workCenterId || undefined,
        includeChildWorkCenters: Boolean(workCenterId),
      };
      if (!capabilities) {
        message.error('设备排产服务未配置');
        return { data: [], success: false, total: 0 };
      }
      const response = await capabilities.requestEquipmentList(requestParams);
      const records = response.list ?? [];
      cacheEquipment(records);
      return {
        data: records,
        success: true,
        total: response.total ?? records.length,
      };
    },
    [cacheEquipment, capabilities, equipmentType, keyword, message, workCenterId],
  );

  const updateTimeProfile = useCallback(
    (
      equipmentId: string,
      shiftCalendarId: string | null,
      standardTime: number | null,
    ) => {
      const current = (form.getFieldValue('equipmentTimeProfiles') ??
        []) as Array<
        MesEquipmentTimeProfile
      >;
      const index = current.findIndex(
        (profile) =>
          profile.equipmentId === equipmentId &&
          (profile.shiftCalendarId || null) === shiftCalendarId,
      );
      const next = [...current];
      if (standardTime === null || !Number.isFinite(standardTime)) {
        if (index >= 0) next.splice(index, 1);
      } else if (index >= 0) {
        next[index] = { ...next[index], standardTime };
      } else {
        next.push({ equipmentId, shiftCalendarId, standardTime });
      }
      form.setFieldValue('equipmentTimeProfiles', next);
    },
    [form],
  );

  const updateAllowedEquipmentIds = (nextIds: string[]) => {
    const normalizedIds = [...new Set(nextIds)];
    if (normalizedIds.length > 0) {
      const nextAllowed = new Set(normalizedIds);
      const nextProfiles = equipmentTimeProfiles.filter((profile) =>
        nextAllowed.has(profile.equipmentId),
      );
      if (nextProfiles.length !== equipmentTimeProfiles.length) {
        form.setFieldValue('equipmentTimeProfiles', nextProfiles);
      }
    }
    onChange?.(normalizedIds);
  };

  const openPicker = () => {
    setDraftIds([...selectedIds]);
    setKeywordDraft('');
    setKeyword('');
    setPickerOpen(true);
  };

  const rowSelection = useMemo<TableRowSelection<MesEquipmentOption>>(
    () => ({
      selectedRowKeys: draftIds,
      preserveSelectedRowKeys: true,
      onSelect: (record, selected) => {
        cacheEquipment([record]);
        setDraftIds((current) =>
          selected
            ? current.includes(record.id)
              ? current
              : [...current, record.id]
            : current.filter((id) => id !== record.id),
        );
      },
      onSelectAll: (selected, _selectedRows, changedRows) => {
        cacheEquipment(changedRows);
        const changedIds = new Set(changedRows.map((item) => item.id));
        setDraftIds((current) =>
          selected
            ? [
                ...current,
                ...changedRows
                  .map((item) => item.id)
                  .filter((id) => !current.includes(id)),
              ]
            : current.filter((id) => !changedIds.has(id)),
        );
      },
    }),
    [cacheEquipment, draftIds],
  );

  const rowIds = useMemo(
    () =>
      [
        ...selectedIds,
        ...equipmentTimeProfiles.map((profile) => profile.equipmentId),
      ].filter((id, index, ids) => ids.indexOf(id) === index),
    [equipmentTimeProfiles, selectedIds],
  );
  const selectedRows = useMemo<SelectedEquipmentRow[]>(
    () =>
      rowIds.map((id) => ({
        id,
        equipment: equipmentById[id],
        unavailable: unavailableIds.has(id),
        allowed: selectedIds.length === 0 || selectedIds.includes(id),
        priorityIndex: selectedIds.indexOf(id),
        profiles: equipmentTimeProfiles.filter(
          (profile) => profile.equipmentId === id,
        ),
      })),
    [equipmentById, equipmentTimeProfiles, rowIds, selectedIds, unavailableIds],
  );

  const moveSelected = (id: string, offset: -1 | 1) => {
    const currentIndex = selectedIds.indexOf(id);
    const nextIndex = currentIndex + offset;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= selectedIds.length) {
      return;
    }
    const nextIds = [...selectedIds];
    [nextIds[currentIndex], nextIds[nextIndex]] = [
      nextIds[nextIndex],
      nextIds[currentIndex],
    ];
    updateAllowedEquipmentIds(nextIds);
  };

  const selectedColumns: ColumnsType<SelectedEquipmentRow> = [
    {
      title: '设备',
      dataIndex: 'id',
      render: (_value, record) => (
        <Space size={8}>
          <span>
            <Typography.Text strong>
              {record.equipment?.name ??
                (record.unavailable ? '设备资料不可用' : '正在读取设备资料')}
            </Typography.Text>
            {record.equipment?.code && (
              <Typography.Text type="secondary">
                {' '}
                · {record.equipment.code}
              </Typography.Text>
            )}
            {!record.equipment && record.unavailable && (
              <Typography.Text type="secondary" title={record.id}>
                {' '}
                （{record.id.slice(0, 8)}）
              </Typography.Text>
            )}
          </span>
          {record.profiles.length > 0 && !record.allowed && (
            <Tag color="warning">不在允许范围</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '设备优先级',
      width: 150,
      align: 'center',
      render: (_value, record) => {
        if (selectedIds.length === 0) return <Tag>全范围</Tag>;
        if (!record.allowed) return <Tag color="warning">不参与排产</Tag>;
        return (
          <Space size={4}>
            <Tag color={record.priorityIndex === 0 ? 'blue' : undefined}>
              {record.priorityIndex + 1}
            </Tag>
            <Button
              type="text"
              size="small"
              icon={<ArrowUpOutlined />}
              aria-label={`提高${record.equipment?.name ?? '设备'}的优先级`}
              disabled={record.priorityIndex === 0}
              onClick={() => moveSelected(record.id, -1)}
            />
            <Button
              type="text"
              size="small"
              icon={<ArrowDownOutlined />}
              aria-label={`降低${record.equipment?.name ?? '设备'}的优先级`}
              disabled={record.priorityIndex === selectedIds.length - 1}
              onClick={() => moveSelected(record.id, 1)}
            />
          </Space>
        );
      },
    },
    {
      title: '单件工时（分钟/件）',
      width: 250,
      render: (_value, record) => {
        const defaultProfile = record.profiles.find(
          (profile) => !profile.shiftCalendarId,
        );
        const defaultTime =
          defaultProfile?.standardTime == null
            ? undefined
            : Number(defaultProfile.standardTime);
        const inheritedHint =
          Number.isFinite(inheritedStandardTime) && inheritedStandardTime > 0
            ? `继承 ${inheritedStandardTime.toFixed(4)} 分钟/件${
                formatUnitRate(inheritedStandardTime)
                  ? `（${formatUnitRate(inheritedStandardTime)}）`
                  : ''
              }`
            : '留空时继承工序默认值';
        return (
          <Space orientation="vertical" size={2} style={{ width: '100%' }}>
            <InputNumber
              min={0.0001}
              max={999999.9999}
              precision={4}
              step={0.01}
              value={defaultTime}
              addonAfter="分/件"
              aria-label={`${record.equipment?.name ?? '设备'}的默认单件工时`}
              placeholder="继承默认"
              style={{ width: '100%' }}
              onChange={(next) =>
                updateTimeProfile(
                  record.id,
                  null,
                  typeof next === 'number' ? next : null,
                )
              }
            />
            <Typography.Text type="secondary">
              {defaultTime && formatUnitRate(defaultTime)
                ? formatUnitRate(defaultTime)
                : inheritedHint}
            </Typography.Text>
          </Space>
        );
      },
    },
    {
      title: '班次工时',
      width: 150,
      align: 'center',
      render: (_value, record) => {
        const shiftProfiles = record.profiles.filter((profile) =>
          Boolean(profile.shiftCalendarId),
        );
        const content = (
          <Space orientation="vertical" size={8} style={{ width: 390 }}>
            <Typography.Text type="secondary">
              班次工时覆盖该设备默认工时；留空的班次沿用设备默认值，再继承工序默认值。
            </Typography.Text>
            {shiftProfiles.map((profile) => {
              const usedShiftIds = new Set(
                shiftProfiles
                  .filter((item) => item !== profile)
                  .map((item) => item.shiftCalendarId)
                  .filter((id): id is string => Boolean(id)),
              );
              return (
                <Space
                  key={`${record.id}:${profile.shiftCalendarId}`}
                  align="start"
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    value={profile.shiftCalendarId ?? undefined}
                    placeholder="选择班次"
                    options={shiftOptions.filter(
                      (option) =>
                        (option.disabled !== true ||
                          option.value === profile.shiftCalendarId) &&
                        (!usedShiftIds.has(option.value) ||
                          option.value === profile.shiftCalendarId),
                    )}
                    loading={!shiftOptionsLoaded}
                    style={{ width: 170 }}
                    onChange={(shiftCalendarId) => {
                      const oldShiftId = profile.shiftCalendarId ?? null;
                      const current = equipmentTimeProfiles.filter(
                        (item) =>
                          !(
                            item.equipmentId === record.id &&
                            (item.shiftCalendarId || null) === oldShiftId
                          ),
                      );
                      form.setFieldValue('equipmentTimeProfiles', [
                        ...current,
                        {
                          ...profile,
                          shiftCalendarId,
                        },
                      ]);
                    }}
                  />
                  <Space orientation="vertical" size={2}>
                    <InputNumber
                      min={0.0001}
                      max={999999.9999}
                      precision={4}
                      step={0.01}
                      value={
                        profile.standardTime == null
                          ? undefined
                          : Number(profile.standardTime)
                      }
                      addonAfter="分/件"
                      placeholder="输入工时"
                      style={{ width: 175 }}
                      onChange={(next) =>
                        updateTimeProfile(
                          record.id,
                          profile.shiftCalendarId ?? null,
                          typeof next === 'number' ? next : null,
                        )
                      }
                    />
                    {typeof profile.standardTime === 'number' && (
                      <Typography.Text type="secondary">
                        {formatUnitRate(profile.standardTime)}
                      </Typography.Text>
                    )}
                  </Space>
                  <Button
                    aria-label="删除班次工时"
                    icon={<DeleteOutlined />}
                    type="text"
                    onClick={() =>
                      updateTimeProfile(
                        record.id,
                        profile.shiftCalendarId ?? null,
                        null,
                      )
                    }
                  />
                </Space>
              );
            })}
            <Button
              icon={<PlusOutlined />}
              size="small"
              type="dashed"
              disabled={!shiftOptionsLoaded}
              onClick={() => {
                const usedShiftIds = new Set(
                  shiftProfiles
                    .map((profile) => profile.shiftCalendarId)
                    .filter((id): id is string => Boolean(id)),
                );
                const nextShift = shiftOptions.find(
                  (option) =>
                    option.disabled !== true &&
                    !usedShiftIds.has(option.value),
                );
                if (!nextShift) {
                  message.info('没有可继续配置的班次');
                  return;
                }
                form.setFieldValue('equipmentTimeProfiles', [
                  ...equipmentTimeProfiles,
                  {
                    equipmentId: record.id,
                    shiftCalendarId: nextShift.value,
                    standardTime: null,
                  },
                ]);
              }}
            >
              添加班次工时
            </Button>
          </Space>
        );
        return (
          <Popover
            trigger="click"
            placement="bottomRight"
            open={openShiftPopoverId === record.id}
            onOpenChange={(open) =>
              setOpenShiftPopoverId(open ? record.id : null)
            }
            content={content}
          >
            <Button type="link" size="small">
              {shiftProfiles.length > 0
                ? `已设 ${shiftProfiles.length} 个班次`
                : '设置班次'}
            </Button>
          </Popover>
        );
      },
    },
  ];

  return (
    <>
      <Space>
        <Button onClick={openPicker}>
          {selectedIds.length > 0
            ? `调整允许设备（${selectedIds.length}）`
            : '选择允许设备'}
        </Button>
        <Typography.Text type="secondary">
          设备范围、优先级和单件工时在下表统一维护
        </Typography.Text>
      </Space>
      {selectedRows.length > 0 ? (
        <Table<SelectedEquipmentRow>
          size="small"
          rowKey="id"
          columns={selectedColumns}
          dataSource={selectedRows}
          pagination={false}
          style={{ marginTop: 8 }}
          locale={{ emptyText: '暂未配置设备' }}
        />
      ) : (
        <Typography.Paragraph type="secondary" style={{ margin: '8px 0 0' }}>
          未选择允许设备时，系统按设备类型和工作中心匹配设备，并使用工序默认单件工时。需要按设备配置工时，请先将设备加入允许设备；添加后仅表内设备参与排产。
        </Typography.Paragraph>
      )}
      <Typography.Text
        type="secondary"
        style={{ display: 'block', marginTop: 6 }}
      >
        单件工时按分钟/件填写，页面自动换算件/分钟；设备默认值为空时继承工序默认值，班次工时覆盖设备默认值。优先级
        1 最高。
      </Typography.Text>
      <Modal
        title="选择允许设备"
        open={pickerOpen}
        width={900}
        destroyOnHidden
        onCancel={() => setPickerOpen(false)}
        onOk={() => {
          updateAllowedEquipmentIds(draftIds);
          setPickerOpen(false);
        }}
        okText="确定"
        cancelText="取消"
      >
        <Input.Search
          allowClear
          placeholder="搜索设备名称或编号"
          aria-label="搜索设备名称或编号"
          value={keywordDraft}
          onChange={(event) => setKeywordDraft(event.target.value)}
          onSearch={(value) => {
            setKeyword(value.trim());
            actionRef.current?.reloadAndRest?.();
          }}
          style={{ maxWidth: 360, marginBottom: 12 }}
        />
        <ProTable<MesEquipmentOption>
          key={`${equipmentType ?? ''}-${workCenterId ?? ''}`}
          actionRef={actionRef}
          rowKey="id"
          columns={equipmentColumns}
          request={handleRequest}
          params={{ keyword, equipmentType, workCenterId }}
          rowSelection={rowSelection}
          tableAlertOptionRender={false}
          pagination={capabilities?.pagination ?? { defaultPageSize: 20, showSizeChanger: true }}
          search={false}
          options={false}
          cardBordered={false}
          dateFormatter="string"
          fitContainerHeight={{ bottomOffset: 0, maxBodyHeight: 360 }}
        />
        <Typography.Text type="secondary">
          已选择 {draftIds.length}{' '}
          台设备。系统先按可行时间和产能排程，条件相同时再按设备优先级取舍；选择工作中心时，列表包含该中心及其下级设备。
        </Typography.Text>
      </Modal>
    </>
  );
}
