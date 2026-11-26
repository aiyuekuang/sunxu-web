import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Form,
  Space,
  Steps,
  Tag,
  Typography,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd/es/upload';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { ResizableTable as Table } from '../shared/ResizableTable';
import type {
  WorkOrderBatchOperation,
  WorkOrderBatchReportCapabilities,
  WorkOrderBatchReportDemandAllocation,
  WorkOrderBatchReportItemPayload,
} from './work-order-batch-report-types';
import { withKnownWorkOrderOptions } from './work-order-report-utils';

const EMPTY_DEMAND_ALLOCATIONS: WorkOrderBatchReportDemandAllocation[] = [];

/** @sunxu-layer business @sunxu-domain manufacturing @sunxu-reason Preserves the host multi-operation reporting wizard, upstream quantity gates, demand attribution, photo uploads and partial-result handling while the host supplies authorization, API and option services. */
export interface WorkOrderBatchReportModalProps {
  /** The host passes this true only after its batch-report permission gate succeeds. */
  open: boolean;
  workOrderId: string;
  orderNo: string;
  operations: WorkOrderBatchOperation[];
  demandAllocations?: WorkOrderBatchReportDemandAllocation[];
  unit: string;
  onClose: () => void;
  onSuccess: () => void;
  capabilities: WorkOrderBatchReportCapabilities;
}

interface BatchReportFormValues {
  demandLineId?: string;
  reporterId?: string;
  scheduleEntryId?: string;
  equipmentId?: string;
  occurredAt?: Dayjs;
  completedQty?: number;
  scrappedQty?: number;
  scrapReason?: string;
  remark?: string;
  isAuxiliary?: boolean;
}

interface BatchReportDraft {
  operationId: string;
  operationName: string;
  sequence: number;
  scheduleEntryId?: string;
  scheduleSlotLabel?: string;
  equipmentId?: string;
  occurredAt: string;
  completedQty: number;
  scrappedQty: number;
  scrapReason?: string;
  remark?: string;
  isAuxiliary?: boolean;
  scrapPhotoFileList: UploadFile[];
  photoFileList: UploadFile[];
}

interface OperationDependencyEdge {
  predecessorOperationId: string;
  transferBatchQty?: number;
  minGoodQty?: number;
}

interface BatchReportConstraint {
  maxQty: number;
  upstreamGoodQty: number | null;
  upstreamOperation: WorkOrderBatchOperation | null;
  transferGateOpen: boolean;
  transferBatchQty: number;
}

type OperationWithScheduleSlots = WorkOrderBatchOperation & {
  scheduleSlots?: WorkOrderBatchOperation['scheduleSlots'];
};

function toQty(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function formatQty(value: number): string {
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 4,
  }).format(value);
}

function getScheduleSlots(
  operation: WorkOrderBatchOperation,
): NonNullable<WorkOrderBatchOperation['scheduleSlots']> {
  return (operation as OperationWithScheduleSlots).scheduleSlots ?? [];
}

function getRemainingQty(operation: WorkOrderBatchOperation): number {
  return Math.max(0, toQty(operation.remainingQty));
}

function isBatchReportCandidate(operation: WorkOrderBatchOperation): boolean {
  return (
    operation.isOutsourced !== true &&
    operation.status !== 'skipped' &&
    getRemainingQty(operation) > 0 &&
    !operation.qualityBlockReason &&
    operation.readyState !== 'blocked_by_quality' &&
    operation.operationOutputMode !== 'non_output_execution' &&
    operation.operationOutputMode !== 'execution_quantity' &&
    operation.timeCaptureMode !== 'session_required'
  );
}

/**
 * 按工序依赖拓扑排序，保证批量请求的录入顺序与服务端执行顺序可读一致。
 * 环路/历史异常数据回退到工序序号，最终合法性仍以服务端状态机为准。
 */
function sortOperationsForBatchReport(
  operations: WorkOrderBatchOperation[],
): WorkOrderBatchOperation[] {
  const indexed = operations.map((operation, index) => ({ operation, index }));
  const byId = new Map(indexed.map((item) => [item.operation.id, item]));
  const inDegree = new Map<string, number>();
  const successors = new Map<string, string[]>();

  indexed.forEach(({ operation }) => {
    inDegree.set(operation.id, 0);
    successors.set(operation.id, []);
  });

  const edgeSet = new Set<string>();
  indexed.forEach(({ operation }) => {
    (operation.predecessorOperationIds ?? []).forEach((predecessorId) => {
      if (!byId.has(predecessorId)) return;
      const edgeKey = `${predecessorId}:${operation.id}`;
      if (edgeSet.has(edgeKey)) return;
      edgeSet.add(edgeKey);
      successors.get(predecessorId)?.push(operation.id);
      inDegree.set(operation.id, (inDegree.get(operation.id) ?? 0) + 1);
    });
  });

  const compare = (leftId: string, rightId: string) => {
    const left = byId.get(leftId);
    const right = byId.get(rightId);
    if (!left || !right) return 0;
    return (
      left.operation.sequence - right.operation.sequence ||
      left.index - right.index
    );
  };
  const queue = [...inDegree.entries()]
    .filter(([, degree]) => degree === 0)
    .map(([id]) => id)
    .sort(compare);
  const sortedIds: string[] = [];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) continue;
    sortedIds.push(currentId);
    (successors.get(currentId) ?? []).forEach((successorId) => {
      const nextDegree = (inDegree.get(successorId) ?? 0) - 1;
      inDegree.set(successorId, nextDegree);
      if (nextDegree === 0) {
        queue.push(successorId);
        queue.sort(compare);
      }
    });
  }

  if (sortedIds.length !== operations.length) {
    const sortedSet = new Set(sortedIds);
    indexed
      .filter(({ operation }) => !sortedSet.has(operation.id))
      .sort((left, right) => compare(left.operation.id, right.operation.id))
      .forEach(({ operation }) => {
        sortedIds.push(operation.id);
      });
  }

  return sortedIds
    .map((id) => byId.get(id)?.operation)
    .filter((operation): operation is WorkOrderBatchOperation =>
      Boolean(operation),
    );
}

function getDependencyEdges(
  operations: WorkOrderBatchOperation[],
  operation: WorkOrderBatchOperation,
) {
  const dependencies: OperationDependencyEdge[] =
    operation.predecessorDependencies?.map((dependency) => ({
      predecessorOperationId: dependency.predecessorOperationId,
      transferBatchQty: dependency.transferBatchQty ?? undefined,
      minGoodQty: dependency.minGoodQty ?? undefined,
    })) ??
    (operation.predecessorOperationIds ?? []).map((predecessorOperationId) => ({
      predecessorOperationId,
      transferBatchQty: operation.transferBatchQty ?? undefined,
    }));

  return dependencies
    .map((dependency) => {
      const predecessor = operations.find(
        (candidate) =>
          candidate.id === dependency.predecessorOperationId &&
          candidate.status !== 'skipped',
      );
      if (!predecessor) return null;
      return {
        operation: predecessor,
        transferBatchQty: Math.max(0, toQty(dependency.transferBatchQty)),
        minGoodQty: Math.max(0, toQty(dependency.minGoodQty)),
      };
    })
    .filter(
      (
        edge,
      ): edge is {
        operation: WorkOrderBatchOperation;
        transferBatchQty: number;
        minGoodQty: number;
      } => edge !== null,
    );
}

function getOperationEquipmentId(
  operation: WorkOrderBatchOperation,
): string | undefined {
  if (!('equipmentId' in operation)) return undefined;
  const equipmentId = operation.equipmentId;
  return typeof equipmentId === 'string' ? equipmentId : undefined;
}

function getEffectiveQty(operation: WorkOrderBatchOperation): number {
  const inputQty = toQty(operation.inputQty);
  return inputQty > 0 ? inputQty : toQty(operation.plannedQty);
}

function getBatchReportConstraint(
  operations: WorkOrderBatchOperation[],
  operation: WorkOrderBatchOperation,
  draftCompletedQtyByOperationId: Map<string, number>,
): BatchReportConstraint {
  const edges = getDependencyEdges(operations, operation);
  const backendMaxQty =
    operation.maxReportQty == null
      ? null
      : Math.max(0, toQty(operation.maxReportQty));
  const hasDraftQty = draftCompletedQtyByOperationId.size > 0;
  const fallbackConstraint = {
    upstreamGoodQty: edges[0] ? toQty(edges[0].operation.completedQty) : null,
    upstreamOperation: edges[0]?.operation ?? null,
    transferGateOpen: false,
    transferBatchQty: edges[0]
      ? Math.min(
          Math.max(edges[0].transferBatchQty, edges[0].minGoodQty),
          getEffectiveQty(edges[0].operation),
        )
      : 0,
  };

  if (
    operation.qualityBlockReason ||
    (operation.reportBlockReason && !hasDraftQty)
  ) {
    return { maxQty: 0, ...fallbackConstraint };
  }

  if (backendMaxQty !== null && !hasDraftQty) {
    return {
      ...fallbackConstraint,
      maxQty: backendMaxQty,
      transferGateOpen: true,
    };
  }

  const edgeStates = edges.map((edge) => {
    const configuredThreshold = Math.max(
      edge.transferBatchQty,
      edge.minGoodQty,
    );
    const effectiveQty = getEffectiveQty(edge.operation);
    const startThreshold =
      configuredThreshold > 0 && effectiveQty > 0
        ? Math.min(configuredThreshold, effectiveQty)
        : configuredThreshold;
    const upstreamGoodQty =
      toQty(edge.operation.completedQty) +
      toQty(draftCompletedQtyByOperationId.get(edge.operation.id));
    return {
      ...edge,
      startThreshold,
      upstreamGoodQty,
      upstreamRemaining: Math.max(
        0,
        upstreamGoodQty - toQty(operation.reportedQty),
      ),
    };
  });
  const blockedEdge = edgeStates.find(
    (edge) =>
      edge.startThreshold > 0 &&
      edge.operation.status !== 'completed' &&
      edge.upstreamGoodQty < edge.startThreshold,
  );
  if (blockedEdge) {
    return {
      maxQty: 0,
      upstreamGoodQty: blockedEdge.upstreamGoodQty,
      upstreamOperation: blockedEdge.operation,
      transferGateOpen: false,
      transferBatchQty: blockedEdge.startThreshold,
    };
  }

  if (edgeStates.length === 0) {
    return {
      maxQty: backendMaxQty ?? getRemainingQty(operation),
      upstreamGoodQty: null,
      upstreamOperation: null,
      transferGateOpen: true,
      transferBatchQty: 0,
    };
  }

  const limitingEdge = edgeStates.reduce((current, edge) =>
    edge.upstreamGoodQty < current.upstreamGoodQty ? edge : current,
  );
  return {
    maxQty: Math.min(
      getRemainingQty(operation),
      ...edgeStates.map((edge) => edge.upstreamRemaining),
    ),
    upstreamGoodQty: limitingEdge.upstreamGoodQty,
    upstreamOperation: limitingEdge.operation,
    transferGateOpen: true,
    transferBatchQty: Math.max(
      ...edgeStates.map((edge) => edge.startThreshold),
    ),
  };
}

/**
 * @sunxu-layer business
 * @sunxu-domain manufacturing
 * @sunxu-reason Presents reusable work order batch report modal behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function WorkOrderBatchReportModal({
  open,
  workOrderId,
  orderNo,
  operations,
  demandAllocations,
  unit,
  onClose,
  onSuccess,
  capabilities,
}: WorkOrderBatchReportModalProps) {
  const currentUserId = capabilities.currentUser?.id;
  const demandAllocationRows = demandAllocations ?? EMPTY_DEMAND_ALLOCATIONS;
  const [form] = Form.useForm<BatchReportFormValues>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stage, setStage] = useState<'input' | 'review'>('input');
  const [drafts, setDrafts] = useState<Map<string, BatchReportDraft>>(
    new Map(),
  );
  const [reporterId, setReporterId] = useState<string | undefined>();
  const [scrapPhotoFileList, setScrapPhotoFileList] = useState<UploadFile[]>(
    [],
  );
  const [photoFileList, setPhotoFileList] = useState<UploadFile[]>([]);
  const [currentSessionEquipmentId, setCurrentSessionEquipmentId] = useState<
    string | undefined
  >();
  const [submitting, setSubmitting] = useState(false);
  const demandSources = useMemo(() => {
    const unique = new Map<string, WorkOrderBatchReportDemandAllocation>();
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
    label: `${source.sourceOrderNo || '直接计划'} · 需求行 ${source.demandLineNo} · 分配投产 ${capabilities.ceilAllocatedQty(source.allocatedPlannedQty)}${source.customerName ? ` · ${source.customerName}` : ''}${source.sourceRemarkSnapshot ? ` · 来源备注 ${source.sourceRemarkSnapshot}` : ''}`,
  }));

  const sortedOperations = useMemo(
    () => sortOperationsForBatchReport(operations),
    [operations],
  );
  const reportableOperations = useMemo(
    () => sortedOperations.filter(isBatchReportCandidate),
    [sortedOperations],
  );
  const currentOperation = reportableOperations[currentIndex];
  const draftCompletedQtyByOperationId = useMemo(
    () =>
      new Map(
        [...drafts.values()].map((draft) => [
          draft.operationId,
          draft.completedQty,
        ]),
      ),
    [drafts],
  );
  const currentConstraint = useMemo(
    () =>
      currentOperation
        ? getBatchReportConstraint(
            sortedOperations,
            currentOperation,
            draftCompletedQtyByOperationId,
          )
        : null,
    [currentOperation, draftCompletedQtyByOperationId, sortedOperations],
  );
  const currentScheduleSlots = currentOperation
    ? getScheduleSlots(currentOperation)
    : [];
  const selectedScheduleEntryId = Form.useWatch('scheduleEntryId', form);
  const watchedDemandLineId = Form.useWatch('demandLineId', form);
  const selectedDemandSource = demandSources.find(
    (source) => source.demandLineId === watchedDemandLineId,
  );
  const completedQty = toQty(Form.useWatch('completedQty', form));
  const scrappedQty = toQty(Form.useWatch('scrappedQty', form));
  const totalQty = completedQty + scrappedQty;
  const maxQty = currentConstraint?.maxQty ?? 0;
  const completedMax = Math.max(0, maxQty - scrappedQty);
  const scrappedMax = Math.max(0, maxQty - completedQty);
  const selectedScheduleSlot = currentScheduleSlots.find(
    (slot) => slot.id === selectedScheduleEntryId,
  );
  const autoBoundScheduleSlot =
    currentScheduleSlots.length === 1 ? currentScheduleSlots[0] : undefined;

  useEffect(() => {
    if (!open) return;
    setCurrentIndex(0);
    setStage('input');
    setDrafts(new Map());
    setReporterId(currentUserId);
    setScrapPhotoFileList([]);
    setPhotoFileList([]);
    setSubmitting(false);
    form.resetFields();
    form.setFieldsValue({
      reporterId: currentUserId,
      demandLineId:
        demandSources.length === 1 ? demandSources[0].demandLineId : undefined,
    });
  }, [currentUserId, demandSources, form, open]);

  useEffect(() => {
    let cancelled = false;
    if (!open || !currentUserId) {
      setCurrentSessionEquipmentId(undefined);
      return () => {
        cancelled = true;
      };
    }

    void capabilities.loadCurrentEquipmentSession()
      .then((session) => {
        if (!cancelled) setCurrentSessionEquipmentId(session?.equipmentId);
      })
      .catch(() => {
        if (!cancelled) setCurrentSessionEquipmentId(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUserId, open]);

  useEffect(() => {
    if (!open || stage !== 'input' || !currentOperation) return;
    const saved = drafts.get(currentOperation.id);
    const scheduleSlots = getScheduleSlots(currentOperation);
    const slot = saved?.scheduleEntryId
      ? scheduleSlots.find((item) => item.id === saved.scheduleEntryId)
      : scheduleSlots.length === 1
        ? scheduleSlots[0]
        : undefined;
    const preferredEquipmentId =
      saved?.equipmentId ??
      slot?.equipmentId ??
      getOperationEquipmentId(currentOperation) ??
      (reporterId === currentUserId ? currentSessionEquipmentId : undefined);

    form.setFieldsValue({
      reporterId,
      scheduleEntryId: saved?.scheduleEntryId,
      equipmentId: preferredEquipmentId,
      occurredAt: saved?.occurredAt ? dayjs(saved.occurredAt) : dayjs(),
      completedQty: saved?.completedQty,
      scrappedQty: saved?.scrappedQty ?? 0,
      scrapReason: saved?.scrapReason,
      remark: saved?.remark,
      isAuxiliary: saved?.isAuxiliary ?? false,
    });
    setScrapPhotoFileList(saved?.scrapPhotoFileList ?? []);
    setPhotoFileList(saved?.photoFileList ?? []);
  }, [
    currentIndex,
    currentOperation,
    currentSessionEquipmentId,
    currentUserId,
    drafts,
    form,
    open,
    reporterId,
    stage,
  ]);

  const getCurrentValues = (): BatchReportFormValues => form.getFieldsValue();

  const saveCurrentDraft = (): boolean => {
    if (!currentOperation || !currentConstraint) return false;
    const values = getCurrentValues();
    const nextCompletedQty = toQty(values.completedQty);
    const nextScrappedQty = toQty(values.scrappedQty);
    const nextTotalQty = nextCompletedQty + nextScrappedQty;
    const scheduleSlots = getScheduleSlots(currentOperation);
    const scheduleSlot =
      scheduleSlots.find((slot) => slot.id === values.scheduleEntryId) ??
      (scheduleSlots.length === 1 ? scheduleSlots[0] : undefined);
    const occurredAt = values.occurredAt ? dayjs(values.occurredAt) : null;

    if (nextTotalQty <= 0) {
      capabilities.notify.info('请至少填写良品数量或报废数量');
      return false;
    }
    if (nextTotalQty > currentConstraint.maxQty) {
      capabilities.notify.info(
        `工序「${currentOperation.operationName}」最多可报 ${formatQty(
          currentConstraint.maxQty,
        )} ${unit}`,
      );
      return false;
    }
    if (!occurredAt?.isValid()) {
      capabilities.notify.info('请选择实际发生时间');
      return false;
    }
    if (scheduleSlots.length > 1 && !scheduleSlot) {
      capabilities.notify.info(
        `工序「${currentOperation.operationName}」请选择具体排产实例`,
      );
      return false;
    }
    const scrapReason = values.scrapReason?.trim() || undefined;
    if (nextScrappedQty > 0 && !scrapReason) {
      capabilities.notify.info(
        `工序「${currentOperation.operationName}」有报废数量时必须填写报废原因`,
      );
      return false;
    }

    const draft: BatchReportDraft = {
      operationId: currentOperation.id,
      operationName: currentOperation.operationName,
      sequence: currentOperation.sequence,
      scheduleEntryId: scheduleSlots.length > 1 ? scheduleSlot?.id : undefined,
      scheduleSlotLabel: scheduleSlot
        ? capabilities.formatScheduleSlotLabel(scheduleSlot)
        : undefined,
      equipmentId: values.equipmentId || scheduleSlot?.equipmentId || undefined,
      occurredAt: occurredAt.toISOString(),
      completedQty: nextCompletedQty,
      scrappedQty: nextScrappedQty,
      scrapReason,
      remark: values.remark?.trim() || undefined,
      isAuxiliary: values.isAuxiliary || undefined,
      scrapPhotoFileList: nextScrappedQty > 0 ? scrapPhotoFileList : [],
      photoFileList,
    };
    setDrafts((current) => {
      const next = new Map(current);
      next.set(draft.operationId, draft);
      return next;
    });
    return true;
  };

  const handleNext = () => {
    if (!saveCurrentDraft()) return;
    if (currentIndex + 1 < reportableOperations.length) {
      setCurrentIndex((value) => value + 1);
    } else {
      setStage('review');
    }
  };

  const handlePrevious = () => {
    if (stage === 'review') {
      setStage('input');
      return;
    }
    if (currentIndex > 0) setCurrentIndex((value) => value - 1);
  };

  const handleSkip = () => {
    if (currentOperation) {
      setDrafts((current) => {
        const next = new Map(current);
        next.delete(currentOperation.id);
        return next;
      });
    }
    if (currentIndex + 1 < reportableOperations.length) {
      setCurrentIndex((value) => value + 1);
    } else {
      setStage('review');
    }
  };

  const handleFillAll = () => {
    const nextDrafts = new Map<string, BatchReportDraft>();
    const completedByOperationId = new Map<string, number>();
    const occurredAt = dayjs().toISOString();

    reportableOperations.forEach((operation) => {
      const constraint = getBatchReportConstraint(
        sortedOperations,
        operation,
        completedByOperationId,
      );
      if (constraint.maxQty <= 0) return;
      const scheduleSlots = getScheduleSlots(operation);
      const slot = scheduleSlots.length === 1 ? scheduleSlots[0] : undefined;
      nextDrafts.set(operation.id, {
        operationId: operation.id,
        operationName: operation.operationName,
        sequence: operation.sequence,
        scheduleEntryId: scheduleSlots.length > 1 ? slot?.id : undefined,
        scheduleSlotLabel: slot ? capabilities.formatScheduleSlotLabel(slot) : undefined,
        equipmentId:
          slot?.equipmentId ??
          getOperationEquipmentId(operation) ??
          (reporterId === currentUserId
            ? currentSessionEquipmentId
            : undefined),
        occurredAt,
        completedQty: constraint.maxQty,
        scrappedQty: 0,
        scrapPhotoFileList: [],
        photoFileList: [],
      });
      completedByOperationId.set(operation.id, constraint.maxQty);
    });
    setDrafts(nextDrafts);
    setStage('review');
  };

  const reviewDrafts = reportableOperations
    .map((operation) => drafts.get(operation.id))
    .filter((draft): draft is BatchReportDraft => Boolean(draft));

  const focusDraft = (operationId: string) => {
    const index = reportableOperations.findIndex(
      (operation) => operation.id === operationId,
    );
    if (index < 0) return;
    setCurrentIndex(index);
    setStage('input');
  };

  const validateDrafts = (): boolean => {
    if (reviewDrafts.length === 0) {
      capabilities.notify.info('至少需要报工一个工序');
      return false;
    }

    const completedByOperationId = new Map<string, number>();
    for (const operation of reportableOperations) {
      const draft = drafts.get(operation.id);
      if (!draft) continue;
      const constraint = getBatchReportConstraint(
        sortedOperations,
        operation,
        completedByOperationId,
      );
      const total = draft.completedQty + draft.scrappedQty;
      const jumpBack = (text: string) => {
        focusDraft(operation.id);
        capabilities.notify.info(text);
      };
      if (total <= 0) {
        jumpBack(
          `工序「${operation.operationName}」请至少填写良品数量或报废数量`,
        );
        return false;
      }
      if (total > constraint.maxQty) {
        jumpBack(
          `工序「${operation.operationName}」的良品和报废合计不能超过 ${formatQty(
            constraint.maxQty,
          )} ${unit}`,
        );
        return false;
      }
      if (!draft.occurredAt) {
        jumpBack(`工序「${operation.operationName}」请选择实际发生时间`);
        return false;
      }
      if (getScheduleSlots(operation).length > 1 && !draft.scheduleEntryId) {
        jumpBack(`工序「${operation.operationName}」请选择具体排产实例`);
        return false;
      }
      if (draft.scrappedQty > 0 && !draft.scrapReason) {
        jumpBack(
          `工序「${operation.operationName}」有报废数量时必须填写报废原因`,
        );
        return false;
      }
      completedByOperationId.set(operation.id, draft.completedQty);
    }
    return true;
  };

  const handleConfirm = async () => {
    if (submitting || !validateDrafts()) return;
    const demandLineId =
      form.getFieldValue('demandLineId') ||
      (demandSources.length === 1 ? demandSources[0].demandLineId : undefined);
    if (
      reviewDrafts.some(
        (draft) => draft.completedQty + draft.scrappedQty > 0,
      ) &&
      demandSources.length > 1 &&
      !demandLineId
    ) {
      capabilities.notify.info('请选择本次报工对应的来源订单');
      return;
    }
    setSubmitting(true);
    try {
      const items: WorkOrderBatchReportItemPayload[] = await Promise.all(
        reviewDrafts.map(async (draft) => {
          const [scrapPhotoUrls, photoUrls] = await Promise.all([
            draft.scrappedQty > 0
              ? capabilities.uploadPhotos(draft.scrapPhotoFileList)
              : Promise.resolve([]),
            draft.photoFileList.length > 0
              ? capabilities.uploadPhotos(draft.photoFileList)
              : Promise.resolve([]),
          ]);
          return {
            operationId: draft.operationId,
            scheduleEntryId: draft.scheduleEntryId,
            equipmentId: draft.equipmentId,
            occurredAt: draft.occurredAt,
            completedQty: draft.completedQty,
            demandLineId,
            scrappedQty: draft.scrappedQty || undefined,
            scrapReason: draft.scrapReason,
            scrapPhotoUrls:
              scrapPhotoUrls.length > 0 ? scrapPhotoUrls : undefined,
            photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
            remark: draft.remark,
            isAuxiliary: draft.isAuxiliary,
            reporterId:
              reporterId && reporterId !== currentUserId
                ? reporterId
                : undefined,
          };
        }),
      );
      const result = await capabilities.batchReport(
        {
          workOrderId,
          items,
        },
      );
      const failedResults = result.results.filter((item) => !item.success);
      if (failedResults.length === 0) {
        capabilities.notify.success(`批量报工完成，共 ${result.summary.success} 道工序`);
      } else {
        const operationNameById = new Map(
          reportableOperations.map((operation) => [
            operation.id,
            operation.operationName,
          ]),
        );
        capabilities.showPartialFailure({
          success: result.summary.success,
          failed: result.summary.failed,
          failures: failedResults.map((item) => ({
            operationId: item.operationId,
            operationName: operationNameById.get(item.operationId) ?? item.operationId,
            error: item.error || '后端未返回失败原因',
          })),
        });
      }
      onSuccess();
    } catch (error) {
      capabilities.notify.error(capabilities.getErrorMessage(error, '批量报工失败'));
    } finally {
      setSubmitting(false);
    }
  };

  const currentConstraintHint = currentConstraint?.upstreamOperation
    ? currentConstraint.transferGateOpen
      ? `受前道「${currentConstraint.upstreamOperation.operationName}」累计良品 ${formatQty(
          currentConstraint.upstreamGoodQty ?? 0,
        )} ${unit} 限制`
      : `需前道「${currentConstraint.upstreamOperation.operationName}」累计良品达到 ${formatQty(
          currentConstraint.transferBatchQty,
        )} ${unit}`
    : undefined;
  const currentBlockReason =
    currentOperation?.qualityBlockReason ?? currentOperation?.reportBlockReason;
  const scheduleSlotOptions = currentScheduleSlots.map((slot) => ({
    label: capabilities.formatScheduleSlotLabel(slot),
    value: slot.id,
  }));
  const reporterKnownOptions = [
    {
      value: currentUserId ?? null,
      label:
        capabilities.currentUser?.realName ||
        capabilities.currentUser?.username ||
        null,
    },
  ];

  return (
    <ModalForm<BatchReportFormValues>
      title={`批量报工 — ${orderNo}`}
      open={open}
      form={form}
      onOpenChange={(visible) => {
        if (!visible) onClose();
      }}
      submitter={{
        render: () => {
          if (stage === 'review') {
            return [
              <Button key="back" disabled={submitting} onClick={handlePrevious}>
                返回录入
              </Button>,
              <Button
                key="submit"
                type="primary"
                loading={submitting}
                onClick={() => void handleConfirm()}
              >
                提交 {reviewDrafts.length} 道工序
              </Button>,
            ];
          }
          return [
            <Button
              key="fill-all"
              disabled={reportableOperations.length === 0 || submitting}
              onClick={handleFillAll}
            >
              一键填满可报数量
            </Button>,
            <Button
              key="previous"
              disabled={currentIndex === 0 || submitting}
              onClick={handlePrevious}
            >
              上一项
            </Button>,
            <Button
              key="skip"
              disabled={reportableOperations.length === 0 || submitting}
              onClick={handleSkip}
            >
              跳过
            </Button>,
            <Button
              key="next"
              type="primary"
              disabled={reportableOperations.length === 0 || submitting}
              onClick={handleNext}
            >
              {currentIndex + 1 >= reportableOperations.length
                ? '确认预览'
                : '保存并下一项'}
            </Button>,
          ];
        },
      }}
      modalProps={{
        destroyOnHidden: true,
        ...capabilities.scrollableModalProps,
        width: 860,
      }}
    >
      <Steps
        current={stage === 'review' ? 1 : 0}
        size="small"
        style={{ marginBottom: 20 }}
        items={[
          {
            title: '逐工序录入',
            description:
              reportableOperations.length > 0
                ? `${currentIndex + 1}/${reportableOperations.length}`
                : '无可报工序',
          },
          { title: '预览并提交', description: `${reviewDrafts.length} 道工序` },
        ]}
      />

      {reportableOperations.length === 0 ? (
        <Alert
          type="info"
          showIcon
          message="当前没有可批量报工的工序"
          description="批量报工只处理有剩余数量的厂内数量型工序；委外、跳过、质量阻断、加工计数和必须以上机会话采集的工序请走各自的执行路径。"
        />
      ) : (
        <>
          <ProFormSelect
            name="reporterId"
            {...capabilities.getReportFieldHelpProps('报工人', 'reporterId')}
            showSearch
            request={withKnownWorkOrderOptions(capabilities.requestReporterOptions, reporterKnownOptions)}
            fieldProps={{
              optionFilterProp: 'label',
              onChange: (value) =>
                setReporterId(typeof value === 'string' ? value : undefined),
            }}
            extra="统一用于本次所有工序；默认当前登录用户。"
          />

          {demandSources.length === 1 ? (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message={`本次报工来源：${demandSourceOptions[0].label}`}
              description={`下方每道工序的报工累计分别受该来源的工单投产分配量限制；计划完成按该来源计算。${
                demandSources[0].sourceRemarkSnapshot
                  ? ` 来源备注：${demandSources[0].sourceRemarkSnapshot}`
                  : ''
              }`}
            />
          ) : null}
          {demandSources.length > 1 ? (
            <ProFormSelect
              name="demandLineId"
              label="本次报工来源"
              rules={[
                { required: true, message: '请选择本次报工对应的来源订单' },
              ]}
              options={demandSourceOptions}
              showSearch
              fieldProps={{ optionFilterProp: 'label' }}
              extra={`下方每道工序的产出都归属所选来源计划，分别受该来源在工单中的投产分配量限制；计划完成按该来源累计。${
                selectedDemandSource?.sourceRemarkSnapshot
                  ? ` 来源备注：${selectedDemandSource.sourceRemarkSnapshot}`
                  : ''
              }`}
            />
          ) : null}

          {stage === 'input' && currentOperation ? (
            <>
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message={`工序 ${currentOperation.sequence} · ${currentOperation.operationName}`}
                description={
                  <Space orientation="vertical" size={2}>
                    <Typography.Text>
                      当前最多可报 {formatQty(maxQty)} {unit}；本次合计{' '}
                      {formatQty(totalQty)} {unit}，报后剩余{' '}
                      {formatQty(Math.max(0, maxQty - totalQty))} {unit}。
                    </Typography.Text>
                    {currentConstraintHint ? (
                      <Typography.Text type="secondary">
                        {currentConstraintHint}
                      </Typography.Text>
                    ) : null}
                  </Space>
                }
              />
              {currentBlockReason ? (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="当前工序存在报工限制"
                  description={`${currentBlockReason}。批量提交时后端会按最新依赖、质量和状态重新校验。`}
                />
              ) : null}
              {currentScheduleSlots.length > 1 ? (
                <ProFormSelect
                  name="scheduleEntryId"
                  {...capabilities.getReportFieldHelpProps(
                    '排产实例',
                    'scheduleEntryId',
                  )}
                  rules={[{ required: true, message: '请选择具体排产实例' }]}
                  options={scheduleSlotOptions}
                  showSearch
                  fieldProps={{ optionFilterProp: 'label' }}
                  extra="同一工序存在多条排产实例，报工时必须明确绑定设备/时间段。"
                />
              ) : autoBoundScheduleSlot ? (
                <Typography.Text
                  type="secondary"
                  style={{ display: 'block', marginBottom: 16 }}
                >
                  已自动绑定排产实例：
                  <Typography.Text strong>
                    {capabilities.formatScheduleSlotLabel(autoBoundScheduleSlot)}
                  </Typography.Text>
                  {capabilities.formatScheduleSlotHint(autoBoundScheduleSlot)
                    ? `（${capabilities.formatScheduleSlotHint(autoBoundScheduleSlot)}）`
                    : ''}
                </Typography.Text>
              ) : null}
              {selectedScheduleSlot && currentScheduleSlots.length > 1 ? (
                <Typography.Text
                  type="secondary"
                  style={{ display: 'block', marginBottom: 16 }}
                >
                  当前实例：{capabilities.formatScheduleSlotLabel(selectedScheduleSlot)}
                  {capabilities.formatScheduleSlotHint(selectedScheduleSlot)
                    ? `（${capabilities.formatScheduleSlotHint(selectedScheduleSlot)}）`
                    : ''}
                </Typography.Text>
              ) : null}
              <ProFormDateTimePicker
                name="occurredAt"
                {...capabilities.getReportFieldHelpProps(
                  '实际发生时间',
                  'occurredAt',
                )}
                rules={[{ required: true, message: '请选择实际发生时间' }]}
                fieldProps={{
                  format: 'YYYY-MM-DD HH:mm',
                  allowClear: false,
                }}
                extra="默认当前时间；补录或延迟报工请改为真实完成时刻。"
              />
              <ProFormSelect
                name="equipmentId"
                {...capabilities.getReportFieldHelpProps('使用设备', 'equipmentId')}
                showSearch
                request={async (params, requestProps) => {
                  const pageSize = currentOperation.allowedEquipmentIds?.length
                    ? Math.max(50, currentOperation.allowedEquipmentIds.length)
                    : 50;
                  const options =
                    await capabilities.requestAvailableEquipmentOptions({
                      ...params,
                      pageSize,
                      equipmentType: currentOperation.equipmentType,
                    }, requestProps);
                  return currentOperation.allowedEquipmentIds?.length
                    ? options.filter(
                        (option) =>
                          typeof option.value === 'string' &&
                          currentOperation.allowedEquipmentIds?.includes(
                            option.value,
                          ),
                      )
                    : options;
                }}
                fieldProps={{ optionFilterProp: 'label', allowClear: true }}
                extra="优先带出排产实例、工序或当前上机设备，可按实际情况修改。"
              />
              <ProFormDigit
                name="completedQty"
                {...capabilities.getReportFieldHelpProps('良品数量', 'completedQty')}
                min={0}
                max={completedMax}
                fieldProps={{ precision: 4 }}
                extra={`本次最多 ${formatQty(completedMax)} ${unit}`}
              />
              <ProFormDigit
                name="scrappedQty"
                {...capabilities.getReportFieldHelpProps('报废数量', 'scrappedQty')}
                min={0}
                max={scrappedMax}
                fieldProps={{ precision: 4 }}
                extra={`本次最多 ${formatQty(scrappedMax)} ${unit}`}
              />
              <ProFormSwitch
                name="isAuxiliary"
                {...capabilities.getReportFieldHelpProps('辅操报工', 'isAuxiliary')}
              />
              {scrappedQty > 0 ? (
                <>
                  <ProFormTextArea
                    name="scrapReason"
                    {...capabilities.getAutoFieldHelpProps('报废原因')}
                    rules={[{ required: true, message: '请填写报废原因' }]}
                    fieldProps={{ rows: 2, maxLength: 500 }}
                    extra="用于报废策略、质量追溯和后续处置；照片要求由后台策略最终校验。"
                  />
                  <Form.Item label="报废照片">
                    <Upload
                      accept="image/*"
                      listType="picture"
                      fileList={scrapPhotoFileList}
                      beforeUpload={() => false}
                      maxCount={5}
                      onChange={({ fileList }) =>
                        setScrapPhotoFileList(fileList)
                      }
                    >
                      <Button icon={<UploadOutlined />}>选择照片</Button>
                    </Upload>
                  </Form.Item>
                </>
              ) : null}
              <Form.Item
                label="现场照片"
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
              <ProFormTextArea
                name="remark"
                {...capabilities.getAutoFieldHelpProps('备注')}
                fieldProps={{ rows: 3, maxLength: 500 }}
              />
            </>
          ) : null}

          {stage === 'review' ? (
            <>
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message="提交时系统会重新校验权限、工单状态、质量、数量、排产实例及库存规则；部分失败时会返回每道工序的明确结果。"
              />
              <Table<BatchReportDraft>
                rowKey="operationId"
                size="small"
                pagination={false}
                dataSource={reviewDrafts}
                columns={[
                  {
                    title: '工序',
                    render: (_, draft) => (
                      <Space size={4}>
                        <Tag>{draft.sequence}</Tag>
                        <span>{draft.operationName}</span>
                      </Space>
                    ),
                  },
                  {
                    title: '良品 / 报废',
                    render: (_, draft) => (
                      <span>
                        {formatQty(draft.completedQty)} /{' '}
                        {formatQty(draft.scrappedQty)} {unit}
                      </span>
                    ),
                  },
                  {
                    title: '发生时间',
                    dataIndex: 'occurredAt',
                    render: (value: string) =>
                      dayjs(value).format('YYYY-MM-DD HH:mm'),
                  },
                  {
                    title: '排产实例',
                    dataIndex: 'scheduleSlotLabel',
                    render: (value?: string) => value || '—',
                  },
                  {
                    title: '备注',
                    dataIndex: 'remark',
                    render: (value?: string) => value || '—',
                  },
                  {
                    title: '操作',
                    key: 'actions',
                    dataIndex: 'actions',
                    valueType: 'option',
                    width: 120,
                    render: (_, draft) => (
                      <Space size={4}>
                        <Button
                          type="link"
                          size="small"
                          onClick={() => focusDraft(draft.operationId)}
                        >
                          编辑
                        </Button>
                        <Button
                          type="link"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            setDrafts((current) => {
                              const next = new Map(current);
                              next.delete(draft.operationId);
                              return next;
                            });
                          }}
                        >
                          删除
                        </Button>
                      </Space>
                    ),
                  },
                ]}
              />
            </>
          ) : null}
        </>
      )}
    </ModalForm>
  );
}
