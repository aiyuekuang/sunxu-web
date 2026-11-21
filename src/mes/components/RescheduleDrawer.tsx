import {
  CloseOutlined,
  ExclamationCircleFilled,
  HistoryOutlined,
  PushpinOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  type ActionType,
  type ProColumns,
  ProForm,
  ProFormDigit,
  type ProFormInstance,
  ProFormSelect,
  ProFormSwitch,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Checkbox,
  Descriptions,
  Divider,
  Drawer,
  Input,
  Modal,
  Select,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ResizableProTable as ProTable } from './ResizableTable';
import type {
  RescheduleCapabilities,
  RescheduleDisplayStatus,
  RescheduleDrawerProps,
  RescheduleFormValues,
  RescheduleImpactEntry,
  ReschedulePolicyDefaults,
  ReschedulePreview,
  RescheduleRun,
  RescheduleSourceRef,
} from './schedule-reschedule-types';

interface ProtectedWorkOrder {
  id: string;
  no: string;
}

interface ImpactFilter {
  action: string;
  reconfirmOnly: boolean;
  keyword: string;
  workOrderId?: string;
  workCenterId?: string;
  equipmentId?: string;
}

function createDefaultImpactFilter(allAction: string): ImpactFilter {
  return {
    action: allAction,
    reconfirmOnly: false,
    keyword: '',
    workOrderId: undefined,
    workCenterId: undefined,
    equipmentId: undefined,
  };
}

function isFormValidationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { errorFields?: unknown; outOfDate?: unknown };
  return Array.isArray(candidate.errorFields) || candidate.outOfDate === true;
}

function buildReschedulePolicyFields(
  policy: ReschedulePolicyDefaults,
  canMoveConfirmed: boolean,
): Pick<
  RescheduleFormValues,
  | 'horizonDays'
  | 'freezeMinutes'
  | 'allowAlternativeEquipment'
  | 'allowMoveConfirmed'
  | 'maxDelayMinutes'
  | 'maxOverdueCount'
  | 'maxReconfirmCount'
> {
  return {
    horizonDays: policy.defaultRescheduleHorizonDays,
    freezeMinutes: policy.defaultRescheduleFreezeMinutes,
    allowAlternativeEquipment:
      policy.defaultRescheduleAllowAlternativeEquipment,
    allowMoveConfirmed: canMoveConfirmed
      ? policy.defaultRescheduleAllowMoveConfirmed
      : false,
    maxDelayMinutes: policy.defaultRescheduleMaxDelayMinutes,
    maxOverdueCount: policy.defaultRescheduleMaxOverdueCount,
    maxReconfirmCount: policy.defaultRescheduleMaxReconfirmCount,
  };
}

function buildImpactKeyword(record: RescheduleImpactEntry) {
  return [
    record.workOrderId,
    record.workOrderNo,
    record.operationId,
    record.operationName,
    record.operationSequence?.toString(),
    record.oldWorkCenterId,
    record.oldWorkCenterName,
    record.newWorkCenterId,
    record.newWorkCenterName,
    record.oldEquipmentId,
    record.oldEquipmentName,
    record.newEquipmentId,
    record.newEquipmentName,
    record.reason,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function uniqueDisplayOptions(
  items: Array<{ value: string | null | undefined; label?: string | null }>,
) {
  const optionMap = new Map<string, string>();
  for (const item of items) {
    if (!item.value) continue;
    optionMap.set(item.value, item.label?.trim() || item.value);
  }
  return [...optionMap.entries()].map(([value, label]) => ({ label, value }));
}

function displayText(
  primary: string | null | undefined,
  fallback?: string | null,
) {
  return primary?.trim() || fallback?.trim() || '-';
}

function operationDisplay(record: RescheduleImpactEntry) {
  const name = record.operationName?.trim();
  if (
    record.operationSequence !== null &&
    record.operationSequence !== undefined &&
    name
  ) {
    return `${record.operationSequence} ${name}`;
  }
  return displayText(name, record.operationId);
}

function movementDisplay(params: {
  oldName?: string | null;
  oldId?: string | null;
  newName?: string | null;
  newId?: string | null;
}) {
  const oldLabel = displayText(params.oldName, params.oldId);
  const newLabel = displayText(params.newName, params.newId);
  if (oldLabel !== '-' && newLabel !== '-' && oldLabel !== newLabel) {
    return `${oldLabel} -> ${newLabel}`;
  }
  return newLabel !== '-' ? newLabel : oldLabel;
}

function buildThresholdGuide(
  preview: ReschedulePreview,
  thresholds: Pick<
    RescheduleFormValues,
    'maxDelayMinutes' | 'maxOverdueCount' | 'maxReconfirmCount'
  >,
  thresholdWarningMarker: string,
) {
  const thresholdWarnings = preview.warnings.filter((warning) =>
    warning.includes(thresholdWarningMarker),
  );
  if (preview.feasible || thresholdWarnings.length === 0) return null;
  const suggestions: string[] = [];
  if (preview.summary.maxDelayMinutes > (thresholds.maxDelayMinutes ?? 0)) {
    suggestions.push(`允许最大延迟 >= ${preview.summary.maxDelayMinutes} 分钟`);
  }
  if (preview.summary.overdueCount > (thresholds.maxOverdueCount ?? 0)) {
    suggestions.push(`允许新增逾期 >= ${preview.summary.overdueCount} 条`);
  }
  if (preview.summary.reconfirmCount > (thresholds.maxReconfirmCount ?? 0)) {
    suggestions.push(`允许重确认 >= ${preview.summary.reconfirmCount} 条`);
  }
  if (suggestions.length === 0) return null;
  return `本次预览超过提交门槛。如确认这些影响可以接受，请把 ${suggestions.join(
    '、',
  )}，然后重新生成预览再提交。`;
}

function isThresholdOnlyPreviewBlocked(
  preview: ReschedulePreview,
  dictionary: RescheduleCapabilities['dictionary'],
) {
  if (preview.feasible) return false;
  if (
    preview.materialReadiness ===
    dictionary.materialReadinessValues.blockedByShortage
  ) {
    return false;
  }
  if (preview.supplyRisk === dictionary.supplyRiskValues.blocked) return false;
  if (preview.insertedEntries.length + preview.shiftedEntries.length === 0) {
    return false;
  }
  return (
    preview.warnings.length > 0 &&
    preview.warnings.every((warning) =>
      warning.includes(dictionary.thresholdWarningMarker),
    )
  );
}

function statusTagProps(
  statuses: Readonly<Record<string, RescheduleDisplayStatus>>,
  value: string,
) {
  const status = statuses[value];
  return { color: status?.color ?? status?.status, text: status?.text ?? value };
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain production-schedule
 * @sunxu-reason Shares the complete reschedule preview, impact review, protection, history and commit workflow while host capabilities own API access, permissions, dictionaries, routing and feedback.
 */
export function RescheduleDrawer({
  open,
  onClose,
  onSuccess,
  capabilities,
  sourceType,
  sourceId,
  sourceLabel,
  initialReasonCode,
  followUpReplan = false,
  triggerMode,
  previousPriority,
  targetPriority,
  equipmentFaultRecovery = false,
}: RescheduleDrawerProps) {
  const { dictionary, permissions } = capabilities;
  const { sourceTypes, reasonCodes, triggerModes, impactActions } = dictionary;
  const formRef = useRef<ProFormInstance<RescheduleFormValues>>(undefined);
  const historyActionRef = useRef<ActionType>(null);
  const [currentSourceType, setCurrentSourceType] = useState(
    sourceType ?? sourceTypes.plan,
  );
  const [previewing, setPreviewing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [preview, setPreview] = useState<ReschedulePreview | null>(null);
  const [impactFilter, setImpactFilter] = useState(() =>
    createDefaultImpactFilter(impactActions.all),
  );
  const [historyFilter, setHistoryFilter] = useState<{
    sourceType: string;
    sourceId: string;
  } | null>(sourceType && sourceId ? { sourceType, sourceId } : null);
  const [selectedSource, setSelectedSource] = useState<{
    sourceType: string;
    sourceId: string;
  } | null>(sourceType && sourceId ? { sourceType, sourceId } : null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<{
    run: RescheduleRun;
    details: RescheduleImpactEntry[];
  } | null>(null);
  const [protectingWorkOrderId, setProtectingWorkOrderId] = useState<string>();
  const [unprotectingWorkOrderId, setUnprotectingWorkOrderId] =
    useState<string>();
  const [protectedWorkOrders, setProtectedWorkOrders] = useState<
    ProtectedWorkOrder[]
  >([]);
  const [policy, setPolicy] = useState<ReschedulePolicyDefaults | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const isFollowUpReplan =
    sourceType === sourceTypes.workOrder && followUpReplan;
  const isEquipmentFaultRecovery =
    equipmentFaultRecovery || sourceType === sourceTypes.equipmentFault;
  const sourceTypeOptions = isEquipmentFaultRecovery
    ? [...dictionary.sourceTypeOptions]
    : dictionary.sourceTypeOptions.filter(
        (option) => option.value !== sourceTypes.equipmentFault,
      );
  const canPreview = permissions.canPreview;
  const canCommit = permissions.canCommit;
  const defaultReasonCode = isEquipmentFaultRecovery
    ? reasonCodes.equipmentFault
    : isFollowUpReplan
      ? reasonCodes.manualAdjustment
      : reasonCodes.urgentOrder;

  useEffect(() => {
    if (!open) return;
    const nextSourceType = sourceType ?? sourceTypes.plan;
    setCurrentSourceType(nextSourceType);
    setPreview(null);
    setImpactFilter(createDefaultImpactFilter(impactActions.all));
    setDetail(null);
    setDetailOpen(false);
    setProtectedWorkOrders([]);
    setPolicy(null);
    setHistoryFilter(sourceType && sourceId ? { sourceType, sourceId } : null);
    setSelectedSource(sourceType && sourceId ? { sourceType, sourceId } : null);
    formRef.current?.setFieldsValue({
      sourceType: nextSourceType,
      sourceId,
      reasonCode: initialReasonCode ?? defaultReasonCode,
      triggerMode: triggerMode ?? triggerModes.manual,
      previousPriority,
      targetPriority,
      horizonDays: 7,
      freezeMinutes: isEquipmentFaultRecovery ? 0 : 480,
      protectConfirmed: true,
      allowMoveConfirmed: false,
      protectedWorkOrderIds: [],
      allowAlternativeEquipment: true,
      allowSplit: false,
      maxDelayMinutes: 1440,
      maxOverdueCount: 0,
      maxReconfirmCount: 0,
    });
    void (async () => {
      setPolicyLoading(true);
      try {
        const result = await capabilities.loadPolicy();
        setPolicy(result);
        formRef.current?.setFieldsValue({
          sourceType: nextSourceType,
          sourceId,
          reasonCode: initialReasonCode ?? defaultReasonCode,
          triggerMode: triggerMode ?? triggerModes.manual,
          previousPriority,
          targetPriority,
          protectedWorkOrderIds: [],
          allowSplit: false,
          ...buildReschedulePolicyFields(result, permissions.canMoveConfirmed),
          ...(isEquipmentFaultRecovery ? { freezeMinutes: 0 } : {}),
        });
      } catch (error) {
        capabilities.reportActionError(error, {
          stage: 'policy',
          fallback: '加载插单重排默认策略失败',
        });
      } finally {
        setPolicyLoading(false);
      }
    })();
  }, [
    capabilities.loadPolicy,
    capabilities.reportActionError,
    defaultReasonCode,
    impactActions.all,
    initialReasonCode,
    isEquipmentFaultRecovery,
    open,
    permissions.canMoveConfirmed,
    previousPriority,
    sourceId,
    sourceType,
    sourceTypes.plan,
    targetPriority,
    triggerModes.manual,
    triggerMode,
  ]);

  const allImpactRows = useMemo(
    () =>
      preview ? [...preview.insertedEntries, ...preview.shiftedEntries] : [],
    [preview],
  );

  const impactFilterOptions = useMemo(
    () => ({
      workOrders: uniqueDisplayOptions(
        allImpactRows.map((record) => ({
          value: record.workOrderId,
          label: record.workOrderNo,
        })),
      ),
      workCenters: uniqueDisplayOptions(
        allImpactRows.flatMap((record) => [
          { value: record.oldWorkCenterId, label: record.oldWorkCenterName },
          { value: record.newWorkCenterId, label: record.newWorkCenterName },
        ]),
      ),
      equipments: uniqueDisplayOptions(
        allImpactRows.flatMap((record) => [
          { value: record.oldEquipmentId, label: record.oldEquipmentName },
          { value: record.newEquipmentId, label: record.newEquipmentName },
        ]),
      ),
    }),
    [allImpactRows],
  );

  const impactRows = useMemo(() => {
    const keyword = impactFilter.keyword.trim().toLowerCase();
    return allImpactRows.filter((record) => {
      if (
        impactFilter.action !== impactActions.all &&
        record.action !== impactFilter.action
      ) {
        return false;
      }
      if (impactFilter.reconfirmOnly && !record.reconfirmRequired) return false;
      if (
        impactFilter.workOrderId &&
        record.workOrderId !== impactFilter.workOrderId
      ) {
        return false;
      }
      if (
        impactFilter.workCenterId &&
        ![record.oldWorkCenterId, record.newWorkCenterId].includes(
          impactFilter.workCenterId,
        )
      ) {
        return false;
      }
      if (
        impactFilter.equipmentId &&
        ![record.oldEquipmentId, record.newEquipmentId].includes(
          impactFilter.equipmentId,
        )
      ) {
        return false;
      }
      if (keyword && !buildImpactKeyword(record).includes(keyword)) return false;
      return true;
    });
  }, [allImpactRows, impactActions.all, impactFilter]);

  const thresholdGuide = useMemo(() => {
    if (!preview) return null;
    const thresholds = formRef.current?.getFieldsValue([
      'maxDelayMinutes',
      'maxOverdueCount',
      'maxReconfirmCount',
    ]);
    return buildThresholdGuide(
      preview,
      thresholds ?? {},
      dictionary.thresholdWarningMarker,
    );
  }, [dictionary.thresholdWarningMarker, preview]);

  const updateProtectedWorkOrders = (next: ProtectedWorkOrder[]) => {
    setProtectedWorkOrders(next);
    formRef.current?.setFieldValue(
      'protectedWorkOrderIds',
      next.map((workOrder) => workOrder.id),
    );
  };

  const handlePreview = async (
    nextProtectedWorkOrders = protectedWorkOrders,
  ) => {
    if (!canPreview) {
      capabilities.notify({
        type: 'warning',
        content: '当前账号没有插单重排预览权限',
      });
      return;
    }
    if (!policy) {
      capabilities.notify({
        type: 'warning',
        content: '排产策略未加载完成，请稍后再生成预览',
      });
      return;
    }
    let values: RescheduleFormValues | undefined;
    try {
      values = await formRef.current?.validateFields();
    } catch (error: unknown) {
      if (isFormValidationError(error)) return;
      capabilities.reportActionError(error, {
        stage: 'preview',
        fallback: '排产失败',
        routeAction: 'process-routes',
      });
      return;
    }
    if (!values) return;
    if (!permissions.canMoveConfirmed) values.allowMoveConfirmed = false;
    if (
      values.sourceId &&
      (!selectedSource ||
        selectedSource.sourceType !== values.sourceType ||
        selectedSource.sourceId !== values.sourceId)
    ) {
      capabilities.notify({
        type: 'warning',
        content: '来源类型已变化，请重新选择来源后再生成预览',
      });
      formRef.current?.setFieldValue('sourceId', undefined);
      setSelectedSource(null);
      setPreview(null);
      return;
    }
    const protectedWorkOrderIds = nextProtectedWorkOrders.map(
      (workOrder) => workOrder.id,
    );
    if (
      values.sourceType === sourceTypes.workOrder &&
      protectedWorkOrderIds.includes(values.sourceId)
    ) {
      capabilities.notify({
        type: 'warning',
        content: '本次保护工单不能选择插单来源工单',
      });
      return;
    }
    setPreviewing(true);
    try {
      const result = await capabilities.preview({
        ...values,
        protectedWorkOrderIds,
      });
      setPreview(result);
      setImpactFilter(createDefaultImpactFilter(impactActions.all));
      setHistoryFilter({
        sourceType: values.sourceType,
        sourceId: values.sourceId,
      });
      historyActionRef.current?.reload();
      if (result.feasible) {
        capabilities.notify({ type: 'success', content: '重排预览已生成' });
      }
    } catch (error) {
      capabilities.reportActionError(error, {
        stage: 'preview',
        fallback: '排产失败',
        routeAction: 'process-routes',
      });
    } finally {
      setPreviewing(false);
    }
  };

  const handleProtectImpactWorkOrder = async (
    record: RescheduleImpactEntry,
  ) => {
    const workOrderNo = displayText(record.workOrderNo, record.workOrderId);
    if (protectedWorkOrders.some((item) => item.id === record.workOrderId)) {
      return;
    }
    const next = [
      ...protectedWorkOrders,
      { id: record.workOrderId, no: workOrderNo },
    ];
    updateProtectedWorkOrders(next);
    setProtectingWorkOrderId(record.workOrderId);
    try {
      capabilities.notify({
        type: 'info',
        content: `已将 ${workOrderNo} 加入本次保护，正在重新预览`,
      });
      await handlePreview(next);
    } finally {
      setProtectingWorkOrderId(undefined);
    }
  };

  const handleRemoveProtectedWorkOrder = async (
    workOrder: ProtectedWorkOrder,
  ) => {
    const next = protectedWorkOrders.filter((item) => item.id !== workOrder.id);
    updateProtectedWorkOrders(next);
    setUnprotectingWorkOrderId(workOrder.id);
    try {
      capabilities.notify({
        type: 'info',
        content: `已取消 ${workOrder.no} 的本次保护，正在重新预览`,
      });
      await handlePreview(next);
    } finally {
      setUnprotectingWorkOrderId(undefined);
    }
  };

  const doCommit = async () => {
    if (!preview) return;
    if (!canCommit) {
      capabilities.notify({
        type: 'warning',
        content: '当前账号仅可生成预览，提交需要排产维护权限',
      });
      return;
    }
    setCommitting(true);
    try {
      const result = await capabilities.commit({
        previewToken: preview.previewToken,
      });
      capabilities.notify({
        type: 'success',
        content: `重排已提交，新增 ${result.summary.insertedEntryCount} 条，影响 ${result.summary.shiftedEntryCount} 条`,
      });
      setPreview(null);
      historyActionRef.current?.reload();
      onSuccess();
    } catch (error) {
      capabilities.reportActionError(error, {
        stage: 'commit',
        fallback: '排产失败',
        routeAction: 'process-routes',
      });
    } finally {
      setCommitting(false);
    }
  };

  const handleCommit = () => {
    if (!canCommit) {
      capabilities.notify({
        type: 'warning',
        content: '当前账号仅可生成预览，提交需要排产维护权限',
      });
      return;
    }
    if (!preview?.feasible) {
      capabilities.notify({ type: 'warning', content: '当前预览不可提交' });
      return;
    }
    const reconfirmCount = preview.summary.reconfirmCount;
    Modal.confirm({
      title: isEquipmentFaultRecovery
        ? '提交设备故障恢复'
        : isFollowUpReplan
          ? '提交后续排产'
          : '提交插单重排',
      icon: <ExclamationCircleFilled />,
      content:
        reconfirmCount > 0
          ? `本次会影响 ${reconfirmCount} 条已确认未开工排产，提交后这些条目会回到待确认并标记重确认。`
          : '提交后会正式写入排产时间，并记录重排审计。',
      okText: isEquipmentFaultRecovery
        ? '提交故障恢复'
        : isFollowUpReplan
          ? '提交后续排产'
          : '提交重排',
      onOk: doCommit,
    });
  };

  const showRunDetail = async (runId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const result = await capabilities.loadRunDetail(runId);
      setDetail(result);
    } finally {
      setDetailLoading(false);
    }
  };

  const currentRiskSource: RescheduleSourceRef | null = historyFilter;
  const goMaterialRisk = () => {
    if (currentRiskSource) capabilities.openMaterialRisk(currentRiskSource);
  };
  const goSupplyRisk = () => {
    if (currentRiskSource) capabilities.openSupplyRisk(currentRiskSource);
  };

  const historyColumns: ProColumns<RescheduleRun>[] = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 150,
      render: (_, record) => dayjs(record.createdAt).format('MM-DD HH:mm'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueEnum: { ...dictionary.runStatuses },
      width: 100,
    },
    {
      title: '原因',
      dataIndex: 'reasonCode',
      valueEnum: { ...dictionary.reasonLabels },
      width: 120,
    },
    { title: '新增', dataIndex: 'insertedEntryCount', width: 70 },
    { title: '影响', dataIndex: 'shiftedEntryCount', width: 70 },
    { title: '重确认', dataIndex: 'reconfirmCount', width: 80 },
    {
      title: '操作',
      key: 'actions',
      dataIndex: '__actions',
      valueType: 'option',
      width: 80,
      render: (_, record) => [
        <Button
          key="detail"
          type="link"
          size="small"
          onClick={() => {
            void showRunDetail(record.id);
          }}
        >
          明细
        </Button>,
      ],
    },
  ];

  const baseImpactColumns: ProColumns<RescheduleImpactEntry>[] = [
    {
      title: '动作',
      dataIndex: 'action',
      width: 100,
      render: (_, record) =>
        dictionary.impactActionLabels[record.action] ?? record.action,
    },
    {
      title: '工单',
      dataIndex: 'workOrderNo',
      width: 180,
      ellipsis: true,
      render: (_, record) => displayText(record.workOrderNo, record.workOrderId),
    },
    {
      title: '工序',
      dataIndex: 'operationName',
      width: 180,
      ellipsis: true,
      render: (_, record) => operationDisplay(record),
    },
    {
      title: '原开始',
      dataIndex: 'oldStart',
      width: 150,
      render: (_, record) =>
        record.oldStart ? dayjs(record.oldStart).format('MM-DD HH:mm') : '-',
    },
    {
      title: '新开始',
      dataIndex: 'newStart',
      width: 150,
      render: (_, record) =>
        record.newStart ? dayjs(record.newStart).format('MM-DD HH:mm') : '-',
    },
    {
      title: '新结束',
      dataIndex: 'newEnd',
      width: 150,
      render: (_, record) =>
        record.newEnd ? dayjs(record.newEnd).format('MM-DD HH:mm') : '-',
    },
    {
      title: '延迟',
      dataIndex: 'delayMinutes',
      width: 90,
      render: (_, record) =>
        record.delayMinutes > 0 ? `${record.delayMinutes} 分钟` : '-',
    },
    {
      title: '续作剩余量',
      dataIndex: 'remainingQty',
      width: 110,
      render: (_, record) => record.remainingQty ?? '-',
    },
    {
      title: '工作中心',
      dataIndex: 'newWorkCenterId',
      width: 210,
      ellipsis: true,
      render: (_, record) =>
        movementDisplay({
          oldName: record.oldWorkCenterName,
          oldId: record.oldWorkCenterId,
          newName: record.newWorkCenterName,
          newId: record.newWorkCenterId,
        }),
    },
    {
      title: '设备',
      dataIndex: 'newEquipmentId',
      width: 210,
      ellipsis: true,
      render: (_, record) =>
        movementDisplay({
          oldName: record.oldEquipmentName,
          oldId: record.oldEquipmentId,
          newName: record.newEquipmentName,
          newId: record.newEquipmentId,
        }),
    },
    {
      title: '重确认',
      dataIndex: 'reconfirmRequired',
      width: 90,
      render: (_, record) =>
        record.reconfirmRequired ? <Tag color="warning">需要</Tag> : '-',
    },
    { title: '原因', dataIndex: 'reason', width: 180, ellipsis: true },
  ];

  const impactColumns: ProColumns<RescheduleImpactEntry>[] = [
    ...(isEquipmentFaultRecovery
      ? baseImpactColumns
      : baseImpactColumns.filter(
          (column) => column.dataIndex !== 'remainingQty',
        )),
    {
      title: '本次保护',
      key: 'actions',
      dataIndex: '__actions',
      valueType: 'option',
      width: 140,
      fixed: 'right',
      render: (_, record) => {
        const protectedInPreview = protectedWorkOrders.some(
          (item) => item.id === record.workOrderId,
        );
        if (record.action !== impactActions.shifted) return '-';
        return [
          <Button
            key="protect"
            type="link"
            size="small"
            icon={<PushpinOutlined />}
            disabled={protectedInPreview}
            loading={protectingWorkOrderId === record.workOrderId}
            onClick={() => {
              void handleProtectImpactWorkOrder(record);
            }}
          >
            {protectedInPreview ? '已保护' : '保护不移动'}
          </Button>,
        ];
      },
    },
  ];

  const materialStatus = preview
    ? statusTagProps(dictionary.materialReadiness, preview.materialReadiness)
    : null;
  const supplyStatus = preview
    ? statusTagProps(dictionary.supplyRisk, preview.supplyRisk)
    : null;

  return (
    <>
      <Drawer
        title={
          isEquipmentFaultRecovery
            ? '设备故障恢复'
            : isFollowUpReplan
              ? '安排后续工序'
              : '插单重排'
        }
        open={open}
        onClose={onClose}
        width="min(1120px, calc(100vw - 48px))"
        destroyOnHidden
        extra={
          <Space wrap>
            <Button onClick={onClose}>关闭</Button>
            <Button
              icon={<ThunderboltOutlined />}
              loading={previewing || policyLoading}
              disabled={!policy || !canPreview}
              onClick={() => {
                void handlePreview();
              }}
            >
              生成预览
            </Button>
            <Button
              type="primary"
              loading={committing}
              disabled={!preview?.feasible || !canCommit}
              onClick={handleCommit}
            >
              确认提交
            </Button>
          </Space>
        }
      >
        {sourceLabel ? (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={`当前来源：${
              dictionary.sourceTypeLabels[sourceType ?? sourceTypes.plan] ??
              sourceType ??
              sourceTypes.plan
            } ${sourceLabel}`}
          />
        ) : null}
        {isFollowUpReplan ? (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="本次用于已开工工单的后续工序补排"
            description="请选择真实的重排原因。历史排产和已发生的执行记录不会被修改；系统会按当前工单的未完成工序、工艺依赖、资源和排产策略生成预览，提交后再确认新的排产。"
          />
        ) : null}
        {isEquipmentFaultRecovery ? (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="设备故障恢复：封存故障前执行段，按剩余量生成续作排程"
            description="系统只从工序既有设备约束中选择同工作中心、同设备类型或允许设备范围内的可用设备；提交后现场继续使用原有工序任务和报工入口，已发生的报工与故障前历史不会被覆盖。"
          />
        ) : null}
        {!canPreview ? (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="当前账号无法生成重排预览"
            description="如需查看资源调整建议，请联系管理员开通插单重排权限。"
          />
        ) : null}
        {canPreview && !canCommit ? (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="当前账号仅可预览"
            description="如需正式写入后续排产，请联系管理员开通排产维护权限。"
          />
        ) : null}
        {currentSourceType === sourceTypes.plan ? (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="计划来源会重排该计划下已经生成的已下达/生产中工单；如果计划还没有可重排工单，请先使用“从计划排产”生成工单和初始排产。"
          />
        ) : null}
        {triggerMode === triggerModes.priorityChange ? (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message={`本次由优先级调整触发：${previousPriority ?? '-'} -> ${
              targetPriority ?? '-'
            }。请先生成预览，确认临时保护工单、冻结窗口和影响阈值后再提交。`}
          />
        ) : null}
        {preview && !preview.feasible ? (
          <Alert
            type={
              isThresholdOnlyPreviewBlocked(preview, dictionary)
                ? 'warning'
                : 'error'
            }
            showIcon
            style={{ marginBottom: 16 }}
            message={
              isThresholdOnlyPreviewBlocked(preview, dictionary)
                ? '预览已生成，但超过当前允许影响范围'
                : '预览已生成，但当前不能直接提交'
            }
            description={
              isThresholdOnlyPreviewBlocked(preview, dictionary)
                ? '这不是重复点击造成的异常。当前设置不允许新增逾期或重确认，预览一旦产生这些影响就会被拦住；如确认可接受，请调整下方允许阈值、保护不允许移动的工单，或缩小重排窗口后重新生成预览。'
                : '请先按预览结果中的阻塞原因处理物料、供料、冻结窗口或无可移动排产等问题，再重新生成预览。'
            }
          />
        ) : null}

        <ProForm<RescheduleFormValues>
          formRef={formRef}
          submitter={false}
          layout="vertical"
          grid
          aria-label="插单重排条件"
        >
          <ProFormSelect
            name="sourceType"
            {...capabilities.fieldHelp('来源类型')}
            readonly={!!sourceType}
            initialValue={sourceType ?? sourceTypes.plan}
            options={[...sourceTypeOptions]}
            colProps={{ span: 8 }}
            fieldProps={{
              onChange: (value) => {
                const next = String(value);
                setCurrentSourceType(next);
                formRef.current?.setFieldValue('sourceId', undefined);
                setSelectedSource(null);
                updateProtectedWorkOrders([]);
                setPreview(null);
              },
            }}
            rules={[{ required: true, message: '请选择来源类型' }]}
          />
          <ProFormSelect
            key={currentSourceType}
            name="sourceId"
            {...capabilities.fieldHelp('来源')}
            readonly={!!sourceId}
            initialValue={sourceId}
            showSearch
            debounceTime={300}
            request={({ keyWords }) => {
              const selectedType = String(
                formRef.current?.getFieldValue('sourceType') ??
                  currentSourceType,
              );
              if (selectedType === sourceTypes.equipmentFault && sourceId) {
                return Promise.resolve([
                  {
                    label: sourceLabel ?? sourceId,
                    value: sourceId,
                  },
                ]);
              }
              return capabilities.loadSourceOptions({
                sourceType: selectedType,
                keyword: keyWords,
                page: 1,
                pageSize: 30,
                eligibleWorkOrderStatuses:
                  dictionary.eligibleWorkOrderStatuses.rescheduleSource,
              });
            }}
            fieldProps={{
              filterOption: false,
              onChange: (value) => {
                const nextSourceType = String(
                  formRef.current?.getFieldValue('sourceType') ??
                    currentSourceType,
                );
                setSelectedSource(
                  value !== undefined && value !== null && value !== ''
                    ? {
                        sourceType: nextSourceType,
                        sourceId: String(value),
                      }
                    : null,
                );
                updateProtectedWorkOrders([]);
                setPreview(null);
              },
            }}
            colProps={{ span: 16 }}
            rules={[{ required: true, message: '请选择重排来源' }]}
          />
          <ProFormSelect name="triggerMode" hidden />
          <ProFormDigit name="previousPriority" hidden />
          <ProFormDigit name="targetPriority" hidden />
          <ProFormSelect
            name="reasonCode"
            {...capabilities.fieldHelp('重排原因')}
            initialValue={defaultReasonCode}
            options={[...dictionary.reasonOptions]}
            colProps={{ span: 8 }}
            rules={[{ required: true, message: '请选择重排原因' }]}
          />
          <ProFormDigit
            name="horizonDays"
            {...capabilities.fieldHelp('重排窗口')}
            initialValue={7}
            min={1}
            max={30}
            tooltip="从当前时间向后纳入本次预览的排产范围，不是锁定天数。"
            fieldProps={{ precision: 0 }}
            colProps={{ span: 8 }}
          />
          <ProFormDigit
            name="freezeMinutes"
            {...capabilities.fieldHelp('冻结窗口')}
            initialValue={480}
            min={0}
            max={10080}
            tooltip="从当前时间往后保护已排任务，窗口内排产不会被插单自动移动。"
            fieldProps={{ precision: 0, addonAfter: '分钟' }}
            colProps={{ span: 8 }}
          />
          <ProFormDigit
            name="maxDelayMinutes"
            {...capabilities.fieldHelp('允许最大延迟')}
            initialValue={1440}
            min={0}
            tooltip="预览结果超过这个分钟数会被判为不可提交。"
            fieldProps={{ precision: 0, addonAfter: '分钟' }}
            colProps={{ span: 8 }}
          />
          <ProFormDigit
            name="maxOverdueCount"
            {...capabilities.fieldHelp('允许新增逾期')}
            initialValue={0}
            min={0}
            tooltip="允许本次重排新增逾期的条目数，超过后需要调高并重新预览。"
            fieldProps={{ precision: 0, addonAfter: '条' }}
            colProps={{ span: 8 }}
          />
          <ProFormDigit
            name="maxReconfirmCount"
            {...capabilities.fieldHelp('允许重确认')}
            initialValue={0}
            min={0}
            tooltip="允许本次移动已确认未开工排产的数量，超过后需要主管权限、调高并重新预览。"
            fieldProps={{ precision: 0, addonAfter: '条' }}
            colProps={{ span: 8 }}
          />
          <ProFormSwitch
            name="allowAlternativeEquipment"
            {...capabilities.fieldHelp('允许替代设备')}
            tooltip="开启后仅在同工作中心、同设备类型、工序允许设备范围内选择替代设备；关闭后优先沿用原设备或工序指定设备。"
            initialValue
            colProps={{ span: 8 }}
          />
          {permissions.canMoveConfirmed ? (
            <ProFormSwitch
              name="allowMoveConfirmed"
              {...capabilities.fieldHelp('移动已确认')}
              colProps={{ span: 8 }}
            />
          ) : null}
          <ProFormSelect
            name="protectedWorkOrderIds"
            {...capabilities.fieldHelp('本次保护工单')}
            tooltip="仅本次插单预览和提交不移动这些工单，不会写入正式排程锁。"
            mode="multiple"
            debounceTime={300}
            request={({ keyWords }) => {
              const values = formRef.current?.getFieldsValue([
                'sourceType',
                'sourceId',
              ]);
              const excludedWorkOrderIds =
                values?.sourceType === sourceTypes.workOrder && values.sourceId
                  ? [values.sourceId]
                  : [];
              return capabilities.loadProtectedWorkOrderOptions({
                keyword: keyWords,
                page: 1,
                pageSize: 30,
                statuses:
                  dictionary.eligibleWorkOrderStatuses.protectionCandidates,
                excludedWorkOrderIds,
              });
            }}
            colProps={{ span: 24 }}
            fieldProps={{
              filterOption: false,
              placeholder: '可搜索选择本次不允许移动的已下达/生产中工单',
              onChange: (_, options) => {
                const selectedOptions = Array.isArray(options) ? options : [];
                setProtectedWorkOrders(
                  selectedOptions
                    .map((option) => ({
                      id: String(option.value ?? ''),
                      no: String(option.label ?? option.value ?? ''),
                    }))
                    .filter((item) => item.id),
                );
                setPreview(null);
              },
            }}
          />
          <ProFormTextArea
            name="remark"
            {...capabilities.fieldHelp('说明')}
            colProps={{ span: 24 }}
            fieldProps={{ rows: 2, maxLength: 500, showCount: true }}
          />
        </ProForm>

        {preview ? (
          <>
            <Divider />
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Space wrap size={16}>
                <Statistic
                  title="新增排产"
                  value={preview.summary.insertedEntryCount}
                />
                <Statistic
                  title="影响条目"
                  value={preview.summary.shiftedEntryCount}
                />
                <Statistic
                  title="待重确认"
                  value={preview.summary.reconfirmCount}
                />
                <Statistic
                  title="新增逾期"
                  value={preview.summary.overdueCount}
                />
                <Statistic
                  title="最大延迟(分钟)"
                  value={preview.summary.maxDelayMinutes}
                />
                {materialStatus ? (
                  <Tag color={materialStatus.color}>{materialStatus.text}</Tag>
                ) : null}
                {supplyStatus ? (
                  <Tag color={supplyStatus.color}>{supplyStatus.text}</Tag>
                ) : null}
                {preview.materialReadiness !==
                dictionary.materialReadinessValues.ready ? (
                  <Button size="small" onClick={goMaterialRisk}>
                    处理物料风险
                  </Button>
                ) : null}
                {preview.supplyRisk !== dictionary.supplyRiskValues.none ? (
                  <Button size="small" onClick={goSupplyRisk}>
                    处理供料风险
                  </Button>
                ) : null}
              </Space>
              {preview.warnings.length > 0 ? (
                <Alert
                  type={preview.feasible ? 'warning' : 'error'}
                  showIcon
                  message={preview.warnings.join('；')}
                />
              ) : null}
              {thresholdGuide ? (
                <Alert type="info" showIcon message={thresholdGuide} />
              ) : null}
              {protectedWorkOrders.length > 0 ? (
                <Alert
                  type="info"
                  showIcon
                  message="本次临时保护的工单"
                  description={
                    <Space direction="vertical" size={8}>
                      <Typography.Text type="secondary">
                        这些工单只在当前插单预览和提交中保持原排产时间，不会写入正式排程锁。
                      </Typography.Text>
                      <Space wrap>
                        {protectedWorkOrders.map((workOrder) => (
                          <Space key={workOrder.id} size={4}>
                            <Tag color="processing">{workOrder.no}</Tag>
                            <Button
                              type="link"
                              size="small"
                              icon={<CloseOutlined />}
                              loading={
                                unprotectingWorkOrderId === workOrder.id
                              }
                              onClick={() => {
                                void handleRemoveProtectedWorkOrder(workOrder);
                              }}
                            >
                              取消保护并重算
                            </Button>
                          </Space>
                        ))}
                      </Space>
                    </Space>
                  }
                />
              ) : null}
              <Space wrap>
                <Select
                  allowClear
                  style={{ width: 220 }}
                  placeholder="按工单筛选"
                  value={impactFilter.workOrderId}
                  options={impactFilterOptions.workOrders}
                  onChange={(value) =>
                    setImpactFilter((previous) => ({
                      ...previous,
                      workOrderId: value,
                    }))
                  }
                />
                <Select
                  allowClear
                  style={{ width: 220 }}
                  placeholder="按工作中心筛选"
                  value={impactFilter.workCenterId}
                  options={impactFilterOptions.workCenters}
                  onChange={(value) =>
                    setImpactFilter((previous) => ({
                      ...previous,
                      workCenterId: value,
                    }))
                  }
                />
                <Select
                  allowClear
                  style={{ width: 220 }}
                  placeholder="按设备筛选"
                  value={impactFilter.equipmentId}
                  options={impactFilterOptions.equipments}
                  onChange={(value) =>
                    setImpactFilter((previous) => ({
                      ...previous,
                      equipmentId: value,
                    }))
                  }
                />
                <Select
                  style={{ width: 130 }}
                  value={impactFilter.action}
                  options={[...dictionary.impactActionOptions]}
                  onChange={(value) =>
                    setImpactFilter((previous) => ({
                      ...previous,
                      action: value,
                    }))
                  }
                />
                <Checkbox
                  checked={impactFilter.reconfirmOnly}
                  onChange={(event) =>
                    setImpactFilter((previous) => ({
                      ...previous,
                      reconfirmOnly: event.target.checked,
                    }))
                  }
                >
                  只看待重确认
                </Checkbox>
                <Input.Search
                  allowClear
                  style={{ width: 320 }}
                  placeholder="搜索工单、工序、工作中心、设备或原因"
                  value={impactFilter.keyword}
                  onChange={(event) =>
                    setImpactFilter((previous) => ({
                      ...previous,
                      keyword: event.target.value,
                    }))
                  }
                />
              </Space>
              <ProTable<RescheduleImpactEntry>
                rowKey={(record) =>
                  `${record.action}-${record.entryId ?? record.workOrderId}-${record.newStart}`
                }
                search={false}
                options={false}
                fitContainerHeight={false}
                pagination={{ pageSize: 8 }}
                columns={impactColumns}
                dataSource={impactRows}
                scroll={{ x: 1730 }}
              />
            </Space>
          </>
        ) : null}

        <Divider titlePlacement="start">
          <Space>
            <HistoryOutlined />
            重排历史
          </Space>
        </Divider>
        <ProTable<RescheduleRun>
          actionRef={historyActionRef}
          rowKey="id"
          search={false}
          options={false}
          resizable={{ serverSortFields: [], sortPersistenceKey: false }}
          columns={historyColumns}
          request={async (params) => {
            if (!historyFilter) {
              return { data: [], total: 0, success: true };
            }
            const result = await capabilities.loadHistory({
              page: params.current ?? 1,
              pageSize: params.pageSize ?? 10,
              sourceType: historyFilter.sourceType,
              sourceId: historyFilter.sourceId,
            });
            return {
              data: result.list ?? [],
              total: result.total ?? 0,
              success: true,
            };
          }}
          fitContainerHeight={false}
          pagination={{ pageSize: 10 }}
        />
      </Drawer>

      <Drawer
        title="重排影响明细"
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={900}
      >
        {detail?.run ? (
          <Descriptions
            size="small"
            column={2}
            bordered
            style={{ marginBottom: 16 }}
          >
            <Descriptions.Item label="状态">
              {dictionary.runStatuses[detail.run.status]?.text ??
                detail.run.status}
            </Descriptions.Item>
            <Descriptions.Item label="原因">
              {dictionary.reasonLabels[detail.run.reasonCode]?.text ??
                detail.run.reasonCode}
            </Descriptions.Item>
            <Descriptions.Item label="物料风险">
              {dictionary.materialReadiness[detail.run.materialReadiness]
                ?.text ?? detail.run.materialReadiness}
            </Descriptions.Item>
            <Descriptions.Item label="供料风险">
              {dictionary.supplyRisk[detail.run.supplyRisk]?.text ??
                detail.run.supplyRisk}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
        {detail?.run.warnings.length ? (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message={detail.run.warnings.join('；')}
          />
        ) : null}
        <Typography.Text type="secondary">
          正式提交后的记录用于追溯谁发起、为什么改、影响了哪些排产。
        </Typography.Text>
        <ProTable<RescheduleImpactEntry>
          loading={detailLoading}
          rowKey={(record) =>
            `${record.action}-${record.entryId ?? record.workOrderId}-${record.newStart}`
          }
          search={false}
          options={false}
          fitContainerHeight={false}
          pagination={{ pageSize: 10 }}
          columns={
            isEquipmentFaultRecovery
              ? baseImpactColumns
              : baseImpactColumns.filter(
                  (column) => column.dataIndex !== 'remainingQty',
                )
          }
          dataSource={detail?.details ?? []}
          scroll={{ x: 1280 }}
        />
      </Drawer>
    </>
  );
}
