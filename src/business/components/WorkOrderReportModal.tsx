import { CloseOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert, App, Button, Form, Tag, Typography, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload';
import dayjs, { type Dayjs } from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import type {
  EquipmentSession,
  OperationScheduleSlotDto,
  RecordOperationExecutionDto,
  ReportOperationDto,
  ReportTimeSource,
  Warehouse,
  WorkOrderDemandAllocationTraceDto,
  WorkOrderOperation,
  WorkOrderOperationExecutionCapabilityDto,
  WorkOrderReportCapabilities,
  WorkOrderReportResultVo,
} from './work-order-report-types';
import { ProductionBatchNoField } from './ProductionBatchNoField';
import { StockLocationSelectField } from './StockLocationSelectField';
import { WorkOrderAllocatedSerialsButton } from './WorkOrderAllocatedSerialsButton';
import {
  useWorkOrderScrapPolicyPreview,
  withKnownWorkOrderOptions,
} from './work-order-report-utils';

/** @sunxu-layer business @sunxu-domain manufacturing @sunxu-reason Preserves MES operation reporting fields, policy previews, attachments, traceability and session rules through injected host capabilities. */
export interface WorkOrderReportModalProps {
  open: boolean;
  op: WorkOrderOperation | null;
  operations?: WorkOrderOperation[];
  productUnit?: string | null;
  demandAllocations?: WorkOrderDemandAllocationTraceDto[];
  /** 工单产品物料ID（报废策略预检维度） */
  materialId?: string | null;
  traceabilityMode?: 'quantity' | 'batch' | 'serial' | null;
  /** 工单客户ID（报废策略预检维度） */
  customerId?: string | null;
  currentReceiptWarehouse?: Warehouse | null;
  receiptWarehouseCandidates?: Warehouse[];
  receiptWarehouseLocked?: boolean;
  canOverrideReceiptWarehouse?: boolean;
  onClose: () => void;
  onSuccess: () => void;
  capabilities: WorkOrderReportCapabilities;
}

interface ReportFormValues {
  demandLineId?: string;
  reporterId?: string;
  scheduleEntryId?: string;
  equipmentId?: string;
  occurredAt?: Dayjs;
  startedAt?: Dayjs;
  endedAt?: Dayjs;
  durationMinutes?: number;
  actualSetupMinutes?: number;
  timeSource?: ReportTimeSource;
  completedQty?: number;
  scrappedQty?: number;
  reportedOperationQty?: number;
  reportedOperationScrappedQty?: number;
  executionQty?: number;
  executionUnit?: string;
  zeroQuantityReason?: string;
  executionReason?: string;
  scrapReason?: string;
  batchNo?: string;
  remark?: string;
  isAuxiliary?: boolean;
  overrideReceiptWarehouseId?: string;
  receiptLocationId?: string;
  storageLocation?: string;
  receiptWarehouseChangeReason?: string;
  abnormalDurationConfirmed?: boolean;
  abnormalDurationNote?: string;
  scrappedSerialNumbers?: string;
}

type OperationScheduleSlot = OperationScheduleSlotDto;
type OperationWithScheduleSlots = WorkOrderOperation & {
  scheduleSlots?: OperationScheduleSlot[];
  /**
   * 来自后端 WorkOrderOperationDetailDto 的运行时能力摘要。
   * 当前弹窗可从多个工序查询入口打开，公共 API 类型仍以实体基类表示，
   * 因而在此补足详情查询实际返回的字段；不得在端侧重新推导其业务语义。
   */
  executionCapability?: WorkOrderOperationExecutionCapabilityDto;
};
type EquipmentAutoFillSource = 'slot' | 'session' | null;

function parseQtyValue(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/**
 * 计算本次将要提交的有效工时（分钟）：优先取手填的有效工时，
 * 否则在开始/结束时间都存在时按其时间差推导，与后端异常工时判定口径一致。
 */
function computeEffectiveReportMinutes(
  durationMinutes?: number | null,
  startedAt?: Dayjs | null,
  endedAt?: Dayjs | null,
): number {
  if (typeof durationMinutes === 'number' && Number.isFinite(durationMinutes)) {
    return durationMinutes;
  }
  if (startedAt && endedAt) {
    const diff = dayjs(endedAt).diff(dayjs(startedAt), 'minute', true);
    return diff > 0 ? diff : 0;
  }
  return 0;
}

function findSessionMatchedScheduleSlot(
  slots: OperationScheduleSlot[],
  equipmentId?: string | null,
): OperationScheduleSlot | null {
  if (!equipmentId || slots.length <= 1) return null;
  const matches = slots.filter((slot) => slot.equipmentId === equipmentId);
  return matches.length === 1 ? matches[0] : null;
}

const EMPTY_DEMAND_ALLOCATIONS: WorkOrderDemandAllocationTraceDto[] = [];

const WorkOrderReportModal: React.FC<WorkOrderReportModalProps> = ({
  open,
  op,
  productUnit = null,
  demandAllocations,
  materialId = null,
  traceabilityMode = 'quantity',
  customerId = null,
  currentReceiptWarehouse = null,
  receiptWarehouseCandidates = [],
  receiptWarehouseLocked = false,
  canOverrideReceiptWarehouse = false,
  onClose,
  onSuccess,
  capabilities,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<ReportFormValues>();
  const {
    currentUser,
    operationUnitOptions,
    operationUnitLabelMap,
    operationUnitLoading,
    materialUnitLabelMap,
  } = capabilities;
  const currentUserId = currentUser?.id;
  const demandAllocationRows = demandAllocations ?? EMPTY_DEMAND_ALLOCATIONS;
  const defaultReporterId = op?.assigneeId ?? currentUserId;
  const demandSources = useMemo(() => {
    const unique = new Map<string, WorkOrderDemandAllocationTraceDto>();
    for (const allocation of demandAllocationRows) {
      if (
        allocation.demandStatus === 'cancelled' ||
        allocation.demandStatus === 'closed'
      )
        continue;
      const existing = unique.get(allocation.demandLineId);
      unique.set(
        allocation.demandLineId,
        existing
          ? {
              ...existing,
              allocatedPlannedQty:
                Number(existing.allocatedPlannedQty) +
                Number(allocation.allocatedPlannedQty),
            }
          : allocation,
      );
    }
    return [...unique.values()];
  }, [demandAllocationRows]);
  const demandSourceOptions = demandSources.map((source) => ({
    value: source.demandLineId,
    label: `${source.sourceOrderNo || '直接计划'} · 需求行 ${source.demandLineNo} · 分配投产 ${source.allocatedPlannedQty}${source.customerName ? ` · ${source.customerName}` : ''}${source.sourceRemarkSnapshot ? ` · 来源备注 ${source.sourceRemarkSnapshot}` : ''}`,
  }));
  // 报工人候选由宿主提供（仅启用用户、最多 50 条）。
  // 当预选报工人（工序指派人 / 当前用户）已停用或不在前 50 名内时，选项命不中会裸显 UUID。
  // 用已知的姓名快照把这两个候选前置补进选项，保证回显姓名。
  const reporterKnownOptions = [
    {
      value: op?.assigneeId ?? null,
      label: op?.assignee?.realName || op?.assignee?.username || null,
    },
    {
      value: currentUserId ?? null,
      label:
        currentUser?.realName ||
        currentUser?.username ||
        null,
    },
  ];
  const [
    scheduleEntryAutoMatchedByCurrentUser,
    setScheduleEntryAutoMatchedByCurrentUser,
  ] = useState(false);
  const [receiptWarehouseEditorOpen, setReceiptWarehouseEditorOpen] =
    useState(false);
  const [scrapSerialEntryOpen, setScrapSerialEntryOpen] = useState(false);
  useEffect(() => {
    setReceiptWarehouseEditorOpen(false);
    setScrapSerialEntryOpen(false);
    form.setFieldsValue({
      overrideReceiptWarehouseId: undefined,
      receiptWarehouseChangeReason: undefined,
      scrappedSerialNumbers: undefined,
    });
  }, [form, open]);
  const [currentSession, setCurrentSession] =
    useState<EquipmentSession | null>(null);
  const [scrapPhotoFileList, setScrapPhotoFileList] = useState<UploadFile[]>(
    [],
  );
  const [photoFileList, setPhotoFileList] = useState<UploadFile[]>([]);
  const [batchOptionsLoading, setBatchOptionsLoading] = useState(false);
  const [equipmentAutoFillSource, setEquipmentAutoFillSource] =
    useState<EquipmentAutoFillSource>(null);

  const operationOutputMode = op?.operationOutputMode ?? 'quantity';
  const payMode = op?.payModeSnapshot ?? 'none';
  const timeCaptureMode = op?.timeCaptureMode ?? 'manual';
  const isNonOutputExecution = operationOutputMode === 'non_output_execution';
  const isExecutionQuantity = operationOutputMode === 'execution_quantity';
  const isExecutionRecord = isNonOutputExecution || isExecutionQuantity;
  const showQuantityFields = !isExecutionRecord;
  const showOperationReportQtyFields =
    showQuantityFields && op?.operationReportAffectsOutput !== false;
  const showExecutionQuantityFields = isExecutionQuantity;
  const showTimeFields =
    isExecutionQuantity ||
    isNonOutputExecution ||
    operationOutputMode === 'quantity_time' ||
    payMode === 'time' ||
    timeCaptureMode !== 'manual';
  const allowZeroQuantity =
    isNonOutputExecution || op?.allowZeroQuantityReport === true;
  const executionCapability = (op as OperationWithScheduleSlots | null)
    ?.executionCapability;
  const executionInputScale = executionCapability?.inputScale ?? 4;
  const canRecord = executionCapability?.canRecord ?? false;
  const recordBlockReason = executionCapability
    ? executionCapability.blockReason
    : '当前服务未返回工序执行能力摘要，请刷新工单后重试。';
  const maxQty =
    op && showQuantityFields
      ? (executionCapability?.maxAllowedQty ?? Number(op.maxReportQty ?? 0))
      : undefined;
  const maxExecutionQty = isExecutionQuantity
    ? (executionCapability?.maxAllowedQty ?? undefined)
    : undefined;
  const completedQty = parseQtyValue(Form.useWatch('completedQty', form));
  const scrappedQty = parseQtyValue(Form.useWatch('scrappedQty', form));
  const executionQty = parseQtyValue(Form.useWatch('executionQty', form));
  const reportedOperationQty = parseQtyValue(
    Form.useWatch('reportedOperationQty', form),
  );
  const reportedOperationScrappedQty = parseQtyValue(
    Form.useWatch('reportedOperationScrappedQty', form),
  );
  const convertedCompletedQty =
    op && showOperationReportQtyFields
      ? capabilities.convertOperationQtyToProductQty(reportedOperationQty, op)
      : completedQty;
  const convertedScrappedQty =
    op && showOperationReportQtyFields
      ? capabilities.convertOperationQtyToProductQty(reportedOperationScrappedQty, op)
      : scrappedQty;
  const totalQty = convertedCompletedQty + convertedScrappedQty;
  const scrapReasonWatch = Form.useWatch('scrapReason', form);
  // 报废策略实时预检（与后端报工拦截同源）：命中要求照片时在提交前驱动必填与提示
  const scrapPolicyPreview = useWorkOrderScrapPolicyPreview({
    enabled: open && showQuantityFields,
    materialId,
    customerId: customerId ?? undefined,
    operationId: op?.id ?? undefined,
    processOperationId: op?.processOperationId ?? undefined,
    scrapReason:
      typeof scrapReasonWatch === 'string'
        ? scrapReasonWatch.trim() || undefined
        : undefined,
    completedQty: convertedCompletedQty,
    scrappedQty: convertedScrappedQty,
    plannedQty: op?.plannedQty ?? undefined,
  }, capabilities.previewScrapPolicy);
  const scrapPhotoRequired = Boolean(scrapPolicyPreview?.requiresPhoto);
  const productUnitLabel = capabilities.formatUnitLabel(productUnit, materialUnitLabelMap);
  const operationReportUnit = op
    ? capabilities.getOperationReportUnitLabel(op, productUnit, {
        productUnitLabelMap: materialUnitLabelMap,
        operationUnitLabelMap,
      })
    : '工序单位';
  const executionUnitLabel = capabilities.formatUnitLabel(
    op?.executionUnit,
    operationUnitLabelMap,
  );
  const operationReportTotalQty =
    reportedOperationQty + reportedOperationScrappedQty;
  const operationReportMaxQty =
    op && showOperationReportQtyFields && maxQty != null
      ? capabilities.convertProductQtyToOperationQty(maxQty, op)
      : undefined;
  const operationReportRemainingAfter =
    operationReportMaxQty != null
      ? Math.max(0, operationReportMaxQty - operationReportTotalQty)
      : undefined;
  const remainingAfterReport =
    maxQty != null ? Math.max(0, maxQty - totalQty) : undefined;
  const completedMax =
    maxQty != null ? Math.max(0, maxQty - scrappedQty) : undefined;
  const scrappedMax =
    maxQty != null ? Math.max(0, maxQty - completedQty) : undefined;
  const reportBlockReason = executionCapability
    ? (executionCapability.blockReason ?? undefined)
    : recordBlockReason;
  const outputLimitHint =
    reportBlockReason && maxQty != null && maxQty <= 0
      ? reportBlockReason
      : `当前最多可报 ${
          maxQty ?? 0
        }。如实际多做成品，请先追加投产或补加工单；如果只是加工次数，请记录执行量。`;
  const isFinalOperation = executionCapability?.isTerminalOperation === true;
  const needsProductSerials =
    traceabilityMode === 'serial' && isFinalOperation && showQuantityFields;
  const requiresExecutionReason =
    isNonOutputExecution ||
    (isExecutionQuantity &&
      executionCapability?.reasonRequiredBeyond != null &&
      executionQty > executionCapability.reasonRequiredBeyond + 0.0001);
  const showReceiptWarehouseOverride =
    showQuantityFields && canOverrideReceiptWarehouse && isFinalOperation;
  const modalActionTitle = isExecutionQuantity
    ? '记录执行量'
    : isNonOutputExecution
      ? '记录执行'
      : '报工';
  const payPreviewText = capabilities.formatPayPreviewText(op?.payPreview, '');
  const currentReceiptWarehouseName = currentReceiptWarehouse?.name ?? '—';
  const receiptWarehouseOptions = receiptWarehouseCandidates.map(
    (warehouse) => ({
      label: warehouse.code
        ? `${warehouse.name}（${warehouse.code}）`
        : warehouse.name,
      value: warehouse.id,
    }),
  );
  const executionUnitOptions = React.useMemo(() => {
    const currentUnit = op?.executionUnit?.trim();
    if (
      !currentUnit ||
      operationUnitOptions.some((item) => item.value === currentUnit)
    ) {
      return operationUnitOptions;
    }
    return [
      { label: currentUnit, value: currentUnit },
      ...operationUnitOptions,
    ];
  }, [op?.executionUnit, operationUnitOptions]);
  const scheduleSlots = ((op as OperationWithScheduleSlots | null)
    ?.scheduleSlots ?? []) as OperationScheduleSlot[] | undefined;
  const autoBoundScheduleSlot =
    scheduleSlots?.length === 1 ? scheduleSlots[0] : undefined;
  const requiresScheduleEntrySelection = (scheduleSlots?.length ?? 0) > 1;
  const selectedScheduleEntryId = Form.useWatch('scheduleEntryId', form);
  const selectedEquipmentId = Form.useWatch('equipmentId', form);
  const reporterId = Form.useWatch('reporterId', form);
  const watchedDemandLineId = Form.useWatch('demandLineId', form);
  const selectedDemandSource = demandSources.find(
    (source) => source.demandLineId === watchedDemandLineId,
  );
  const overrideReceiptWarehouseId = Form.useWatch(
    'overrideReceiptWarehouseId',
    form,
  );
  const watchedDurationMinutes = Form.useWatch('durationMinutes', form);
  const watchedStartedAt = Form.useWatch('startedAt', form);
  const watchedEndedAt = Form.useWatch('endedAt', form);
  const effectiveReportMinutes = computeEffectiveReportMinutes(
    watchedDurationMinutes,
    watchedStartedAt,
    watchedEndedAt,
  );
  // 本次有效工时超过 24 小时：揭示异常工时确认/说明字段，口径与后端报工拦截同源
  const isAbnormalReportDuration =
    showTimeFields &&
    !isExecutionRecord &&
    effectiveReportMinutes > capabilities.reasonableReportMinutesMax;
  const selectedScheduleSlot =
    scheduleSlots?.find((slot) => slot.id === selectedScheduleEntryId) ??
    autoBoundScheduleSlot;
  const scheduleSlotOptions = (scheduleSlots ?? []).map((slot) => ({
    label: capabilities.formatScheduleSlotLabel(slot),
    value: slot.id,
  }));
  const effectiveReceiptWarehouseId =
    showQuantityFields && isFinalOperation
      ? overrideReceiptWarehouseId || currentReceiptWarehouse?.id
      : undefined;

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      reporterId: defaultReporterId,
      demandLineId:
        demandSources.length === 1 ? demandSources[0].demandLineId : undefined,
      occurredAt: dayjs(),
      startedAt: currentSession?.startedAt
        ? dayjs(currentSession.startedAt)
        : undefined,
      scrappedQty: 0,
      reportedOperationScrappedQty: 0,
      actualSetupMinutes: undefined,
      timeSource: currentSession?.id ? 'session' : 'manual',
      executionUnit: op?.executionUnit ?? undefined,
    });
    setScheduleEntryAutoMatchedByCurrentUser(false);
    setEquipmentAutoFillSource(null);
    setScrapPhotoFileList([]);
    setPhotoFileList([]);
  }, [currentSession, defaultReporterId, form, open, demandSources]);

  useEffect(() => {
    let cancelled = false;
    if (!open || !currentUserId) {
      setCurrentSession(null);
      return () => {
        cancelled = true;
      };
    }

    void capabilities.loadCurrentEquipmentSession()
      .then((session) => {
        if (cancelled) return;
        setCurrentSession(session ?? null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.warn(
          'Failed to preload current equipment session for report modal',
          error,
        );
        setCurrentSession(null);
      });

    return () => {
      cancelled = true;
    };
  }, [open, currentUserId, capabilities]);

  useEffect(() => {
    if (!open || selectedScheduleEntryId || !requiresScheduleEntrySelection)
      return;
    if (!reporterId || reporterId !== currentUserId) return;
    const matchedSlot = findSessionMatchedScheduleSlot(
      scheduleSlots ?? [],
      currentSession?.equipmentId,
    );
    if (matchedSlot) {
      form.setFieldsValue({ scheduleEntryId: matchedSlot.id });
      setScheduleEntryAutoMatchedByCurrentUser(true);
    }
  }, [
    open,
    selectedScheduleEntryId,
    requiresScheduleEntrySelection,
    reporterId,
    currentUserId,
    scheduleSlots,
    currentSession?.equipmentId,
    form,
  ]);

  useEffect(() => {
    if (!open) return;
    if (!reporterId || reporterId === currentUserId) return;
    if (scheduleEntryAutoMatchedByCurrentUser) {
      form.setFieldsValue({ scheduleEntryId: undefined });
      setScheduleEntryAutoMatchedByCurrentUser(false);
    }
    if (
      equipmentAutoFillSource === 'session' &&
      selectedEquipmentId &&
      selectedEquipmentId === currentSession?.equipmentId
    ) {
      form.setFieldsValue({ equipmentId: undefined });
      setEquipmentAutoFillSource(null);
    }
  }, [
    open,
    reporterId,
    currentUserId,
    currentSession?.equipmentId,
    scheduleEntryAutoMatchedByCurrentUser,
    selectedEquipmentId,
    equipmentAutoFillSource,
    form,
  ]);

  useEffect(() => {
    if (!open || equipmentAutoFillSource !== 'slot' || !selectedEquipmentId)
      return;
    if (selectedScheduleSlot?.equipmentId) return;
    form.setFieldsValue({ equipmentId: undefined });
    setEquipmentAutoFillSource(null);
  }, [
    open,
    equipmentAutoFillSource,
    selectedEquipmentId,
    selectedScheduleSlot?.equipmentId,
    form,
  ]);

  useEffect(() => {
    const preferredEquipmentSource = selectedScheduleSlot?.equipmentId
      ? 'slot'
      : reporterId === currentUserId && currentSession?.equipmentId
        ? 'session'
        : null;
    const preferredEquipmentId =
      selectedScheduleSlot?.equipmentId ??
      (reporterId === currentUserId ? currentSession?.equipmentId : null);
    if (!open || !preferredEquipmentId) return;
    if (selectedEquipmentId === preferredEquipmentId) return;
    if (selectedEquipmentId && !selectedScheduleSlot?.equipmentId) return;
    form.setFieldsValue({ equipmentId: preferredEquipmentId });
    setEquipmentAutoFillSource(preferredEquipmentSource);
  }, [
    open,
    selectedScheduleSlot,
    reporterId,
    currentUserId,
    currentSession?.equipmentId,
    selectedEquipmentId,
    equipmentAutoFillSource,
    form,
  ]);

  const handleSubmit = async (values: ReportFormValues) => {
    if (batchOptionsLoading) {
      message.info('正在读取生产批号规则，请稍后提交');
      return false;
    }
    if (!op) return false;
    if (!canRecord) {
      message.info(recordBlockReason || '当前工序暂不能录入执行');
      return false;
    }
    const currentCompletedQty = parseQtyValue(values.completedQty);
    const currentScrappedQty = parseQtyValue(values.scrappedQty);
    const currentReportedOperationQty = parseQtyValue(
      values.reportedOperationQty,
    );
    const currentReportedOperationScrappedQty = parseQtyValue(
      values.reportedOperationScrappedQty,
    );
    const currentConvertedCompletedQty =
      showOperationReportQtyFields && op
        ? capabilities.convertOperationQtyToProductQty(currentReportedOperationQty, op)
        : currentCompletedQty;
    const currentConvertedScrappedQty =
      showOperationReportQtyFields && op
        ? capabilities.convertOperationQtyToProductQty(
            currentReportedOperationScrappedQty,
            op,
          )
        : currentScrappedQty;
    const currentTotalQty =
      currentConvertedCompletedQty + currentConvertedScrappedQty;
    const parseSerialNumbers = (value?: string) =>
      (value ?? '')
        .split(/[\n,，;；\t ]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    const scrappedSerialNumbers =
      currentConvertedScrappedQty > 0
        ? parseSerialNumbers(values.scrappedSerialNumbers)
        : [];
    if (
      currentTotalQty > 0 &&
      demandSources.length > 1 &&
      !values.demandLineId
    ) {
      message.info('请选择本次报工对应的来源订单');
      return false;
    }
    const currentSessionMatches =
      !!currentSession?.id &&
      (!values.equipmentId ||
        values.equipmentId === currentSession.equipmentId);
    const equipmentSessionId = currentSessionMatches
      ? currentSession.id
      : undefined;
    const equipmentId =
      values.equipmentId || currentSession?.equipmentId || undefined;
    const startedAt = values.startedAt
      ? dayjs(values.startedAt).toISOString()
      : undefined;
    const endedAt = values.endedAt
      ? dayjs(values.endedAt).toISOString()
      : undefined;
    const timePayload = showTimeFields
      ? {
          durationMinutes: values.durationMinutes,
          equipmentSessionId,
          startedAt,
          endedAt,
          timeSource: values.timeSource,
        }
      : {};
    if (timeCaptureMode === 'session_required' && !equipmentSessionId) {
      message.info('该工序要求先上机，请先建立当前上机会话');
      return false;
    }

    const reporterId = values.reporterId;
    const occurredAt = values.occurredAt
      ? dayjs(values.occurredAt).toISOString()
      : undefined;

    if (isExecutionRecord) {
      const currentExecutionQty = parseQtyValue(values.executionQty);
      const executionReason = values.executionReason?.trim() || undefined;
      const remark = values.remark?.trim() || undefined;
      if (requiresExecutionReason && !executionReason && !remark) {
        message.info('请填写执行原因或备注');
        return false;
      }
      if (isExecutionQuantity && currentExecutionQty <= 0) {
        message.info('请填写大于 0 的执行数量');
        return false;
      }
      const executionUnit =
        values.executionUnit?.trim() || op.executionUnit?.trim() || undefined;
      if (isExecutionQuantity && !executionUnit) {
        message.info('加工计数工序必须填写执行单位');
        return false;
      }
      if (
        isExecutionQuantity &&
        maxExecutionQty != null &&
        currentExecutionQty > maxExecutionQty + 0.0001
      ) {
        message.info(`本次执行量最多可录入 ${maxExecutionQty}`);
        return false;
      }
      const scheduleEntryId = requiresScheduleEntrySelection
        ? values.scheduleEntryId
        : undefined;
      const payload: RecordOperationExecutionDto & {
        actualSetupMinutes?: number;
      } = {
        workOrderId: op.workOrderId,
        operationId: op.id,
        scheduleEntryId,
        equipmentId,
        workCenterId: op.workCenterId ?? undefined,
        reporterId:
          reporterId && reporterId !== currentUserId ? reporterId : undefined,
        occurredAt,
        executionReason,
        executionQty: isExecutionQuantity ? currentExecutionQty : undefined,
        executionUnit: isExecutionQuantity ? executionUnit : undefined,
        actualSetupMinutes: values.actualSetupMinutes,
        remark,
        ...timePayload,
      };
      try {
        await capabilities.recordOperationExecution(payload);
      } catch (error) {
        message.error(capabilities.getErrorMessage(error, '保存执行记录失败'));
        return false;
      }
      message.success(isExecutionQuantity ? '工作量已记录' : '执行记录已保存');
      onSuccess();
      return true;
    }

    if (currentTotalQty <= 0) {
      const zeroQuantityReason = values.zeroQuantityReason?.trim() || undefined;
      if (!allowZeroQuantity) {
        message.info('请至少填写良品数量或报废数量');
        return false;
      }
      if (!zeroQuantityReason) {
        message.info('零数量报工时必须填写原因');
        return false;
      }
    }
    if (maxQty != null && currentTotalQty > maxQty) {
      message.info(outputLimitHint);
      return false;
    }
    if (needsProductSerials) {
      if (
        !Number.isSafeInteger(currentConvertedScrappedQty) ||
        scrappedSerialNumbers.length > currentConvertedScrappedQty
      ) {
        message.info(
          `指定的报废序列号不能多于本次报废数量 ${currentConvertedScrappedQty}`,
        );
        return false;
      }
      if (
        new Set(scrappedSerialNumbers).size !== scrappedSerialNumbers.length
      ) {
        message.info('报废序列号不能重复');
        return false;
      }
    }
    const scrapReason = values.scrapReason?.trim() || undefined;
    if (currentConvertedScrappedQty > 0 && !scrapReason) {
      message.info('有报废数量时必须填写报废原因');
      return false;
    }
    // 异常工时确认：超过 24 小时时必须勾选确认（说明由表单 required 规则保证）
    const submitEffectiveMinutes = showTimeFields
      ? computeEffectiveReportMinutes(
          values.durationMinutes,
          values.startedAt,
          values.endedAt,
        )
      : 0;
    const submitIsAbnormalDuration =
      submitEffectiveMinutes > capabilities.reasonableReportMinutesMax;
    if (submitIsAbnormalDuration && !values.abnormalDurationConfirmed) {
      message.info(
        '本次工时超过 24 小时，若为跨日作业或事后补录请勾选「异常工时确认」并填写说明',
      );
      return false;
    }
    const overrideReceiptWarehouseId =
      values.overrideReceiptWarehouseId &&
      values.overrideReceiptWarehouseId !== currentReceiptWarehouse?.id
        ? values.overrideReceiptWarehouseId
        : undefined;
    const receiptWarehouseChangeReason =
      values.receiptWarehouseChangeReason?.trim() || undefined;
    if (receiptWarehouseChangeReason && !overrideReceiptWarehouseId) {
      message.info('选择新入库仓后再填写改仓原因');
      return false;
    }
    if (overrideReceiptWarehouseId && !receiptWarehouseChangeReason) {
      message.info('改入库仓时必须填写变更原因');
      return false;
    }
    const scheduleEntryId = requiresScheduleEntrySelection
      ? values.scheduleEntryId
      : undefined;
    // 命中报废策略要求照片时，提交前即拦截（与后端 blocking 同源），避免白填一单被打回
    const hasScrapPhoto = scrapPhotoFileList.some(
      (file) => Boolean(file.originFileObj) || Boolean(file.url),
    );
    if (
      currentConvertedScrappedQty > 0 &&
      scrapPhotoRequired &&
      !hasScrapPhoto
    ) {
      message.error(
        scrapPolicyPreview?.actionMessage
          ? `${scrapPolicyPreview.actionMessage}，请先上传报废照片`
          : '当前报废策略要求上传报废照片',
      );
      return false;
    }
    const [scrapPhotoUrls, photoUrls] = await Promise.all([
      currentConvertedScrappedQty > 0
        ? capabilities.uploadPhotos(scrapPhotoFileList)
        : Promise.resolve(undefined),
      photoFileList.length > 0
        ? capabilities.uploadPhotos(photoFileList)
        : Promise.resolve(undefined),
    ]);
    const payload: ReportOperationDto & {
      scheduleEntryId?: string;
      actualSetupMinutes?: number;
    } = {
      workOrderId: op.workOrderId,
      operationId: op.id,
      scheduleEntryId,
      equipmentId,
      occurredAt,
      completedQty: currentConvertedCompletedQty,
      scrappedQty: currentConvertedScrappedQty,
      actualSetupMinutes: values.actualSetupMinutes,
      demandLineId:
        values.demandLineId ||
        (demandSources.length === 1
          ? demandSources[0].demandLineId
          : undefined),
      reportedOperationQty: showOperationReportQtyFields
        ? currentReportedOperationQty
        : undefined,
      reportedOperationScrappedQty: showOperationReportQtyFields
        ? currentReportedOperationScrappedQty
        : undefined,
      zeroQuantityReason: values.zeroQuantityReason?.trim() || undefined,
      scrapReason,
      batchNo: values.batchNo?.trim() || undefined,
      scrapPhotoUrls:
        scrapPhotoUrls && scrapPhotoUrls.length > 0
          ? scrapPhotoUrls
          : undefined,
      photoUrls: photoUrls && photoUrls.length > 0 ? photoUrls : undefined,
      remark: values.remark,
      reporterId:
        reporterId && reporterId !== currentUserId ? reporterId : undefined,
      isAuxiliary: values.isAuxiliary || undefined,
      overrideReceiptWarehouseId,
      receiptLocationId: values.receiptLocationId,
      storageLocation: values.storageLocation?.trim() || undefined,
      receiptWarehouseChangeReason,
      abnormalDurationConfirmed: values.abnormalDurationConfirmed || undefined,
      abnormalDurationNote: values.abnormalDurationNote?.trim() || undefined,
      scrappedSerialNumbers: needsProductSerials
        ? scrappedSerialNumbers
        : undefined,
      ...timePayload,
    };
    let reportResult: WorkOrderReportResultVo;
    try {
      if (
        equipmentSessionId &&
        values.timeSource === 'session' &&
        endedAt &&
        showQuantityFields
      ) {
        reportResult = await capabilities.endSessionAndReportOperation({
          ...payload,
          equipmentSessionId,
        });
      } else {
        reportResult = await capabilities.reportOperation(payload);
      }
    } catch (error) {
      message.error(capabilities.getErrorMessage(error, '报工失败'));
      return false;
    }
    message.success(capabilities.reportSuccessMessage);
    if (reportResult.toolingLifeWarnings?.length) {
      message.warning({
        content: reportResult.toolingLifeWarnings
          .map((warning) => warning.message)
          .join('；'),
        duration: 8,
      });
    }
    setPhotoFileList([]);
    setScrapPhotoFileList([]);
    onSuccess();
    return true;
  };

  return (
    <ModalForm
      title={`${modalActionTitle} — ${op?.operationName ?? ''}`}
      open={open}
      form={form}
      onValuesChange={(changedValues) => {
        const scrapQtyReset = [
          'scrappedQty',
          'reportedOperationScrappedQty',
        ].some(
          (field) =>
            field in changedValues &&
            Number((changedValues as Record<string, unknown>)[field] ?? 0) <= 0,
        );
        if (scrapQtyReset) {
          setScrapSerialEntryOpen(false);
          form.setFieldsValue({ scrappedSerialNumbers: undefined });
        }
      }}
      onOpenChange={(v) => {
        if (!v) {
          setReceiptWarehouseEditorOpen(false);
          form.setFieldsValue({
            overrideReceiptWarehouseId: undefined,
            receiptWarehouseChangeReason: undefined,
          });
          onClose();
        }
      }}
      onFinish={handleSubmit}
      submitter={{ submitButtonProps: { disabled: batchOptionsLoading } }}
      modalProps={{
        destroyOnHidden: true,
        ...capabilities.scrollableModalProps,
        width: 480,
      }}
      initialValues={{
        reporterId: defaultReporterId,
        occurredAt: dayjs(),
        scrappedQty: 0,
        reportedOperationScrappedQty: 0,
        executionUnit: op?.executionUnit ?? undefined,
        timeSource: currentSession?.id ? 'session' : 'manual',
      }}
    >
      {op ? (
        <div style={{ marginBottom: 16 }}>
          <Tag
            color={capabilities.statusColor(operationOutputMode, capabilities.outputModeLabels)}
          >
            {capabilities.outputModeLabels[operationOutputMode]?.text ??
              operationOutputMode}
          </Tag>
          <Tag color={capabilities.statusColor(payMode, capabilities.payModeLabels)}>
            {capabilities.payModeLabels[payMode]?.text ?? payMode}
          </Tag>
          {showTimeFields ? (
            <Tag color={capabilities.statusColor(timeCaptureMode, capabilities.timeCaptureModeLabels)}>
              {capabilities.timeCaptureModeLabels[timeCaptureMode]?.text ?? timeCaptureMode}
            </Tag>
          ) : null}
          {payPreviewText ? (
            <Typography.Text
              type="secondary"
              style={{ display: 'block', marginTop: 8 }}
            >
              工价：{payPreviewText}
            </Typography.Text>
          ) : null}
        </div>
      ) : null}
      {maxQty != null && (
        <Typography.Text
          type="secondary"
          style={{ display: 'block', marginBottom: 16 }}
        >
          剩余可报产品数量：
          <Typography.Text strong>
            {maxQty} {productUnitLabel}
          </Typography.Text>
        </Typography.Text>
      )}
      {op && showOperationReportQtyFields ? (
        <div
          style={{
            border: '1px solid var(--ant-color-border-secondary)',
            borderRadius: 6,
            padding: 12,
            marginBottom: 16,
            background: 'var(--ant-color-fill-quaternary)',
          }}
        >
          <Typography.Text strong>
            {capabilities.buildOperationReportSummary(op, productUnit, {
              productUnitLabelMap: materialUnitLabelMap,
              operationUnitLabelMap,
            })}
          </Typography.Text>
          <Typography.Text
            type="secondary"
            style={{ display: 'block', marginTop: 6 }}
          >
            本工序目标 {op.operationReportTargetQtySnapshot ?? '—'}{' '}
            {operationReportUnit}，已报 {op.operationReportReportedQty ?? 0}{' '}
            {operationReportUnit}，剩余{' '}
            {op.operationReportRemainingQty ?? operationReportMaxQty ?? '—'}{' '}
            {operationReportUnit}
          </Typography.Text>
        </div>
      ) : null}
      {maxQty != null && (
        <Typography.Text
          type="secondary"
          style={{ display: 'block', marginBottom: 16 }}
        >
          {showOperationReportQtyFields
            ? `本次报 ${operationReportTotalQty} ${operationReportUnit}，折算产品 ${totalQty} ${
                productUnitLabel
              }`
            : `本次合计 ${totalQty}`}
          ，报后剩余 {remainingAfterReport} {productUnitLabel}
          {operationReportRemainingAfter !== undefined
            ? `；工序单位剩余 ${operationReportRemainingAfter} ${operationReportUnit}`
            : ''}
          。报废会占用本次可报数量，不会流转到下道工序。
        </Typography.Text>
      )}
      {reportBlockReason && (
        <Typography.Text
          type="warning"
          style={{ display: 'block', marginBottom: 16 }}
        >
          {reportBlockReason}
        </Typography.Text>
      )}
      {requiresScheduleEntrySelection ? (
        <ProFormSelect
          name="scheduleEntryId"
          {...capabilities.getReportFieldHelpProps('排产实例', 'scheduleEntryId')}
          rules={[{ required: true, message: '请选择具体排产实例' }]}
          options={scheduleSlotOptions}
          showSearch
          fieldProps={{
            optionFilterProp: 'label',
            onChange: () => setScheduleEntryAutoMatchedByCurrentUser(false),
          }}
          extra="同一工序存在多条排产实例，报工时必须明确选择设备/时间段。"
        />
      ) : scheduleSlots?.length === 1 ? (
        <Typography.Text
          type="secondary"
          style={{ display: 'block', marginBottom: 16 }}
        >
          已自动绑定排产实例：
          <Typography.Text strong>
            {capabilities.formatScheduleSlotLabel(scheduleSlots[0])}
          </Typography.Text>
          {capabilities.formatScheduleSlotHint(scheduleSlots[0]) ? (
            <> （{capabilities.formatScheduleSlotHint(scheduleSlots[0])}）</>
          ) : null}
        </Typography.Text>
      ) : null}
      {showQuantityFields && demandSources.length === 1 ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`本次报工来源：${demandSourceOptions[0].label}`}
          description={`当前工序累计报工不得超过该来源的工单投产分配量；计划完成按该来源计算。${
            demandSources[0].sourceRemarkSnapshot
              ? ` 来源备注：${demandSources[0].sourceRemarkSnapshot}`
              : ''
          }`}
        />
      ) : null}
      {showQuantityFields && demandSources.length > 1 ? (
        <ProFormSelect
          name="demandLineId"
          label="本次报工来源"
          rules={[{ required: true, message: '请选择本次报工对应的来源订单' }]}
          options={demandSourceOptions}
          showSearch
          fieldProps={{ optionFilterProp: 'label' }}
          extra={`本次产出归属所选来源计划，当前工序报工量不得超过该计划在工单中的投产分配量；计划完成按该来源累计。${
            selectedDemandSource?.sourceRemarkSnapshot
              ? ` 来源备注：${selectedDemandSource.sourceRemarkSnapshot}`
              : ''
          }`}
        />
      ) : null}
      {selectedScheduleSlot && requiresScheduleEntrySelection ? (
        <Typography.Text
          type="secondary"
          style={{ display: 'block', marginBottom: 16 }}
        >
          当前实例：
          <Typography.Text strong>
            {capabilities.formatScheduleSlotLabel(selectedScheduleSlot)}
          </Typography.Text>
          {capabilities.formatScheduleSlotHint(selectedScheduleSlot) ? (
            <> （{capabilities.formatScheduleSlotHint(selectedScheduleSlot)}）</>
          ) : null}
        </Typography.Text>
      ) : null}
      <ProFormDateTimePicker
        name="occurredAt"
        {...capabilities.getReportFieldHelpProps('实际发生时间', 'occurredAt')}
        rules={[{ required: true, message: '请选择实际发生时间' }]}
        fieldProps={{
          format: 'YYYY-MM-DD HH:mm',
          allowClear: false,
        }}
        extra="默认当前时间；如为补录/延迟报工，请改成真实完成时刻。"
      />
      {showQuantityFields && isFinalOperation ? (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <Typography.Text type="secondary">
              当前入库仓：
              <Typography.Text strong>
                {currentReceiptWarehouseName}
              </Typography.Text>
            </Typography.Text>
            {showReceiptWarehouseOverride &&
            !receiptWarehouseLocked &&
            currentReceiptWarehouse?.id ? (
              <Button
                type="link"
                size="small"
                icon={
                  receiptWarehouseEditorOpen ? (
                    <CloseOutlined />
                  ) : (
                    <EditOutlined />
                  )
                }
                aria-expanded={receiptWarehouseEditorOpen}
                onClick={() => {
                  if (receiptWarehouseEditorOpen) {
                    form.setFieldsValue({
                      overrideReceiptWarehouseId: undefined,
                      receiptWarehouseChangeReason: undefined,
                    });
                    setReceiptWarehouseEditorOpen(false);
                    return;
                  }
                  setReceiptWarehouseEditorOpen(true);
                }}
              >
                {receiptWarehouseEditorOpen ? '取消改仓' : '修改'}
              </Button>
            ) : null}
          </div>
          {showReceiptWarehouseOverride ? (
            receiptWarehouseLocked ? (
              <Typography.Text
                type="warning"
                style={{ display: 'block', marginBottom: 16 }}
              >
                已发生首笔完工入库，当前工单入库仓已锁定；如需调整请走库存调仓。
              </Typography.Text>
            ) : receiptWarehouseEditorOpen || !currentReceiptWarehouse?.id ? (
              <>
                <ProFormSelect
                  name="overrideReceiptWarehouseId"
                  {...capabilities.getReportFieldHelpProps(
                    '改入库仓',
                    'overrideReceiptWarehouseId',
                  )}
                  options={receiptWarehouseOptions}
                  showSearch
                  fieldProps={{
                    optionFilterProp: 'label',
                    disabled: receiptWarehouseOptions.length === 0,
                    onChange: () => {
                      form.setFieldsValue({
                        receiptWarehouseChangeReason: undefined,
                      });
                    },
                  }}
                  extra="提交后作为本工单后续完工入库仓；开始入库后如需调整请走库存调仓。"
                />
                {receiptWarehouseOptions.length === 0 ? (
                  <Typography.Text
                    type="secondary"
                    style={{ display: 'block', marginBottom: 16 }}
                  >
                    当前没有可改仓候选
                  </Typography.Text>
                ) : null}
                {overrideReceiptWarehouseId &&
                overrideReceiptWarehouseId !== currentReceiptWarehouse?.id ? (
                  <ProFormTextArea
                    name="receiptWarehouseChangeReason"
                    {...capabilities.getReportFieldHelpProps(
                      '改仓原因',
                      'receiptWarehouseChangeReason',
                    )}
                    fieldProps={{ rows: 2, maxLength: 500 }}
                    extra="改仓时必填"
                  />
                ) : null}
              </>
            ) : null
          ) : null}
        </>
      ) : null}
      {showQuantityFields && isFinalOperation ? (
        <StockLocationSelectField
          capabilities={capabilities.stockLocationCapabilities}
          name="receiptLocationId"
          textName="storageLocation"
          label="入库仓位"
          action="work-order/report"
          warehouseId={effectiveReceiptWarehouseId}
          requiredMessage="当前入库仓要求选择入库仓位"
        />
      ) : null}
      <ProFormSelect
        name="reporterId"
        {...capabilities.getReportFieldHelpProps('报工人', 'reporterId')}
        showSearch
        request={withKnownWorkOrderOptions(
          capabilities.requestReporterOptions,
          reporterKnownOptions,
        )}
        fieldProps={{ optionFilterProp: 'label' }}
        extra="工序指定人员优先，未指定则默认当前用户"
      />
      <ProFormSelect
        name="equipmentId"
        {...capabilities.getReportFieldHelpProps('使用设备', 'equipmentId')}
        showSearch
        request={async (params, requestProps) => {
          const pageSize = op?.allowedEquipmentIds?.length
            ? Math.max(50, op.allowedEquipmentIds.length)
            : 50;
          const options = await capabilities.requestAvailableEquipmentOptions({
            ...(params ?? {}),
            pageSize,
            equipmentType: op?.equipmentType ?? undefined,
          }, requestProps);
          return options.filter((equipment) => {
            if (!op?.allowedEquipmentIds?.length) return true;
            return (
              typeof equipment.value === 'string' &&
              op.allowedEquipmentIds.includes(equipment.value)
            );
          });
        }}
        fieldProps={{
          optionFilterProp: 'label',
          allowClear: true,
          onChange: () => setEquipmentAutoFillSource(null),
          filterOption: false,
          fetchDataOnSearch: true,
          placeholder: '默认显示前50条，输入关键词可搜索更多',
        }}
        extra="可选。系统会优先带出排产实例设备或你当前上机的设备，不对时可手动修改。"
      />
      {showTimeFields ? (
        <>
          <ProFormSelect
            name="timeSource"
            {...capabilities.getAutoFieldHelpProps('工时来源')}
            options={capabilities.reportTimeSourceOptions}
            extra={
              currentSession?.id
                ? '已识别到当前上机会话，可直接按会话关联工时。'
                : '没有当前上机会话时，可手填工时或开始/结束时间。'
            }
          />
          <ProFormDateTimePicker
            name="startedAt"
            {...capabilities.getAutoFieldHelpProps('工时开始')}
            fieldProps={{ format: 'YYYY-MM-DD HH:mm' }}
          />
          <ProFormDateTimePicker
            name="endedAt"
            {...capabilities.getAutoFieldHelpProps('工时结束')}
            fieldProps={{ format: 'YYYY-MM-DD HH:mm' }}
          />
          <ProFormDigit
            name="durationMinutes"
            {...capabilities.getAutoFieldHelpProps('有效工时(分钟)')}
            min={0}
            fieldProps={{ precision: 1 }}
            extra="填了有效工时则优先按该值计算计时工资；不填时后端按开始/结束或会话推导。"
          />
          {isAbnormalReportDuration ? (
            <>
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="本次工时超过 24 小时"
                description={`本次有效工时约 ${Math.round(
                  effectiveReportMinutes,
                )} 分钟（${capabilities.formatReportMinutesDaysHint(
                  effectiveReportMinutes,
                )}），超过单日合理范围。若为跨日作业或事后补录，请确认并填写说明后再提交。`}
              />
              <ProFormSwitch
                name="abnormalDurationConfirmed"
                {...capabilities.getAutoFieldHelpProps('异常工时确认（跨日作业 / 事后补录）')}
              />
              <ProFormTextArea
                name="abnormalDurationNote"
                {...capabilities.getAutoFieldHelpProps('跨日/补录工时说明')}
                rules={[{ required: true, message: '请填写跨日/补录工时说明' }]}
                fieldProps={{ rows: 2, maxLength: 500 }}
                extra="说明为何本次工时超过 24 小时，例如连续跨日作业或事后补录。"
              />
            </>
          ) : null}
        </>
      ) : null}
      {op ? (
        <ProFormDigit
          name="actualSetupMinutes"
          {...capabilities.getAutoFieldHelpProps('实测准备/换型工时(分钟)')}
          min={0}
          rules={[
            { type: 'number', min: 0, message: '请输入不小于 0 的分钟数' },
          ]}
          fieldProps={{ precision: 2 }}
          extra="可选；仅记录本次实测值，不从有效工时推算。"
        />
      ) : null}
      {showExecutionQuantityFields ? (
        <>
          <ProFormDigit
            name="executionQty"
            {...capabilities.getAutoFieldHelpProps('执行数量')}
            min={0.0001}
            max={maxExecutionQty}
            rules={[{ required: true, message: '请填写执行数量' }]}
            fieldProps={{ precision: executionInputScale }}
            extra={
              maxExecutionQty != null
                ? `本次最多可录入 ${maxExecutionQty}${executionUnitLabel}；${
                    op?.executionQtyTarget
                      ? `目标 ${op.executionQtyTarget}${executionUnitLabel}，已记录 ${op.executionQty ?? 0}${executionUnitLabel}`
                      : '记录加工次数、面数、遍数等工作量，不计入良品、库存和质检。'
                  }`
                : op?.executionQtyTarget
                  ? `目标 ${op.executionQtyTarget}${executionUnitLabel}，已记录 ${op.executionQty ?? 0}${executionUnitLabel}`
                  : '记录加工次数、面数、遍数等工作量，不计入良品、库存和质检。'
            }
          />
          <ProFormSelect
            name="executionUnit"
            {...capabilities.getAutoFieldHelpProps('执行单位')}
            rules={[{ required: true, message: '请填写执行单位' }]}
            options={executionUnitOptions}
            fieldProps={{ showSearch: true, loading: operationUnitLoading }}
          />
        </>
      ) : null}
      {isExecutionRecord ? (
        <ProFormTextArea
          name="executionReason"
          {...capabilities.getAutoFieldHelpProps('执行原因')}
          fieldProps={{ rows: 2, maxLength: 128 }}
          extra={
            isExecutionQuantity && requiresExecutionReason
              ? '本次执行量超过后端下发的免说明阈值，请填写执行原因或备注。'
              : isExecutionQuantity
                ? '如返修、复检、多面加工、多遍加工等；超额时应填写原因或备注。'
                : '如调机、试机、准备、清洁、返修辅助等，不计入产量进度。'
          }
        />
      ) : null}
      {showQuantityFields ? (
        <>
          <ProFormSwitch
            name="isAuxiliary"
            {...capabilities.getReportFieldHelpProps('辅操报工', 'isAuxiliary')}
          />
          {showOperationReportQtyFields ? (
            <>
              <ProFormDigit
                name="reportedOperationQty"
                {...capabilities.getAutoFieldHelpProps(`良品报工量(${operationReportUnit})`)}
                min={0}
                extra={
                  operationReportMaxQty != null
                    ? `最多约 ${operationReportMaxQty} ${operationReportUnit}`
                    : undefined
                }
                fieldProps={{ precision: executionInputScale }}
              />
              <ProFormDigit
                name="reportedOperationScrappedQty"
                {...capabilities.getAutoFieldHelpProps(`报废报工量(${operationReportUnit})`)}
                min={0}
                fieldProps={{ precision: executionInputScale }}
              />
              <Typography.Text
                type="secondary"
                style={{ display: 'block', marginBottom: 16 }}
              >
                折算良品 {convertedCompletedQty} {productUnitLabel}
                ，折算报废 {convertedScrappedQty} {productUnitLabel}
              </Typography.Text>
            </>
          ) : (
            <>
              <ProFormDigit
                name="completedQty"
                {...capabilities.getReportFieldHelpProps('良品数量', 'completedQty')}
                min={0}
                extra={
                  completedMax != null ? `最多 ${completedMax}` : undefined
                }
                fieldProps={{ precision: executionInputScale }}
              />
              <ProFormDigit
                name="scrappedQty"
                {...capabilities.getReportFieldHelpProps('报废数量', 'scrappedQty')}
                min={0}
                extra={scrappedMax != null ? `最多 ${scrappedMax}` : undefined}
                fieldProps={{ precision: executionInputScale }}
              />
            </>
          )}
          {allowZeroQuantity ? (
            <ProFormTextArea
              name="zeroQuantityReason"
              {...capabilities.getAutoFieldHelpProps('零数量原因')}
              fieldProps={{ rows: 2, maxLength: 128 }}
              extra="本次只记录工时但没有产量时填写。"
            />
          ) : null}
          {needsProductSerials ? (
            <>
              <Form.Item
                label="本次良品序列号"
                extra="系统按本次良品数量自动绑定待报工号码。"
              >
                {op ? (
                  <WorkOrderAllocatedSerialsButton
                    capabilities={capabilities.allocatedSerialCapabilities}
                    workOrderId={op.workOrderId}
                  />
                ) : null}
              </Form.Item>
              {convertedScrappedQty > 0 ? (
                <>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      const next = !scrapSerialEntryOpen;
                      setScrapSerialEntryOpen(next);
                      if (!next)
                        form.setFieldsValue({
                          scrappedSerialNumbers: undefined,
                        });
                    }}
                  >
                    {scrapSerialEntryOpen
                      ? '收起已贴码报废登记'
                      : '登记已贴码报废品'}
                  </Button>
                  {scrapSerialEntryOpen ? (
                    <ProFormTextArea
                      name="scrappedSerialNumbers"
                      label="已贴码报废品序列号"
                      fieldProps={{
                        rows: 2,
                        maxLength: 500000,
                        placeholder: '扫码或粘贴已贴在产品上的序列号',
                      }}
                      extra="没有贴码的报废品无需登记序列号。"
                    />
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
      {showQuantityFields && convertedScrappedQty > 0 ? (
        <>
          <ProFormTextArea
            name="scrapReason"
            {...capabilities.getAutoFieldHelpProps('报废原因')}
            rules={[{ required: true, message: '请填写报废原因' }]}
            fieldProps={{ rows: 2, maxLength: 500 }}
            extra="用于匹配报废策略、质量追溯和后续处置判定。"
          />
          <Form.Item
            {...capabilities.getAutoFieldHelpProps(
              scrapPhotoRequired ? '报废照片（必填）' : '报废照片',
            )}
            required={scrapPhotoRequired}
            extra={
              scrapPhotoRequired ? (
                <Typography.Text type="danger">
                  {`${
                    scrapPolicyPreview?.policyName
                      ? `命中报废策略「${scrapPolicyPreview.policyName}」，`
                      : ''
                  }本次报废需上传照片才能提交`}
                </Typography.Text>
              ) : (
                '选填；若命中的报废策略要求照片，未上传会被后端拦截。'
              )
            }
          >
            <Upload
              accept="image/*"
              listType="picture"
              fileList={scrapPhotoFileList}
              beforeUpload={() => false}
              maxCount={5}
              onChange={({ fileList }) => setScrapPhotoFileList(fileList)}
            >
              <Button icon={<UploadOutlined />}>选择照片</Button>
            </Upload>
          </Form.Item>
        </>
      ) : null}
      {!isExecutionRecord ? (
        <Form.Item
          {...capabilities.getAutoFieldHelpProps('现场照片（可选）')}
          extra="最多 5 张，用于记录本次现场情况；不替代报废照片。"
        >
          <Upload
            accept="image/*"
            listType="picture"
            fileList={photoFileList}
            beforeUpload={() => false}
            maxCount={5}
            onChange={({ fileList }) => setPhotoFileList(fileList)}
          >
            <Button icon={<UploadOutlined />}>选择照片</Button>
          </Upload>
        </Form.Item>
      ) : null}
      {showQuantityFields ? (
        <ProductionBatchNoField
          capabilities={capabilities.productionBatchNoCapabilities}
          workOrderId={op?.workOrderId}
          open={open}
          onLoadingChange={setBatchOptionsLoading}
        />
      ) : null}
      <ProFormTextArea
        name="remark"
        {...capabilities.getAutoFieldHelpProps('备注')}
        fieldProps={{ rows: 3 }}
      />
    </ModalForm>
  );
};

export { WorkOrderReportModal };
export default WorkOrderReportModal;
