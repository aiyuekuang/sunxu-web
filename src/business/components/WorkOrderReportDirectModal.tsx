import { CloseOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert, App, Button, Form, Typography, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload';
import dayjs, { type Dayjs } from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import type {
  OperationScheduleSlotDto,
  Warehouse,
  WorkOrderDemandAllocationTraceDto,
  WorkOrderDirectReportPayload,
  WorkOrderReportCapabilities,
} from './work-order-report-types';
import { ProductionBatchNoField } from './ProductionBatchNoField';
import { StockLocationSelectField } from './StockLocationSelectField';
import { WorkOrderAllocatedSerialsButton } from './WorkOrderAllocatedSerialsButton';
import {
  useWorkOrderScrapPolicyPreview,
  withKnownWorkOrderOptions,
} from './work-order-report-utils';

const EMPTY_DEMAND_ALLOCATIONS: WorkOrderDemandAllocationTraceDto[] = [];

/** @sunxu-layer business @sunxu-domain manufacturing @sunxu-reason Preserves MES direct work-order reporting, demand allocation, traceability and receipt-location behavior through injected host capabilities. */
export interface WorkOrderReportDirectModalProps {
  open: boolean;
  workOrderId: string;
  orderNo: string;
  remainQty: number;
  unit: string;
  /** 工单产品物料ID（报废策略预检维度） */
  materialId?: string | null;
  traceabilityMode?: 'quantity' | 'batch' | 'serial' | null;
  /** 工单客户ID（报废策略预检维度） */
  customerId?: string | null;
  demandAllocations?: WorkOrderDemandAllocationTraceDto[];
  scheduleSlots?: OperationScheduleSlotDto[];
  currentReceiptWarehouse?: Warehouse | null;
  receiptWarehouseCandidates?: Warehouse[];
  receiptWarehouseLocked?: boolean;
  canOverrideReceiptWarehouse?: boolean;
  onClose: () => void;
  onSuccess: () => void;
  capabilities: WorkOrderReportCapabilities;
}

interface ReportDirectFormValues {
  demandLineId?: string;
  reporterId?: string;
  scheduleEntryId?: string;
  equipmentId?: string;
  occurredAt?: Dayjs;
  completedQty?: number;
  scrappedQty?: number;
  scrapReason?: string;
  batchNo?: string;
  remark?: string;
  overrideReceiptWarehouseId?: string;
  receiptLocationId?: string;
  storageLocation?: string;
  receiptWarehouseChangeReason?: string;
  scrappedSerialNumbers?: string;
}

type EquipmentAutoFillSource = 'slot' | 'session' | null;

function parseQtyValue(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function findSessionMatchedScheduleSlot(
  slots: OperationScheduleSlotDto[],
  equipmentId?: string | null,
): OperationScheduleSlotDto | null {
  if (!equipmentId || slots.length <= 1) return null;
  const matches = slots.filter((slot) => slot.equipmentId === equipmentId);
  return matches.length === 1 ? matches[0] : null;
}

const WorkOrderReportDirectModal: React.FC<WorkOrderReportDirectModalProps> = ({
  open,
  workOrderId,
  orderNo,
  remainQty,
  unit,
  materialId = null,
  traceabilityMode = 'quantity',
  customerId = null,
  demandAllocations,
  scheduleSlots = [],
  currentReceiptWarehouse = null,
  receiptWarehouseCandidates = [],
  receiptWarehouseLocked = false,
  canOverrideReceiptWarehouse = false,
  onClose,
  onSuccess,
  capabilities,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<ReportDirectFormValues>();
  const { currentUser, materialUnitLabelMap } = capabilities;
  const unitLabel = capabilities.formatUnitLabel(unit, materialUnitLabelMap);
  const needsProductSerials = traceabilityMode === 'serial';
  const currentUserId = currentUser?.id;
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
  const [
    scheduleEntryAutoMatchedByCurrentUser,
    setScheduleEntryAutoMatchedByCurrentUser,
  ] = useState(false);
  const [currentSessionEquipmentId, setCurrentSessionEquipmentId] = useState<
    string | null
  >(null);
  const [scrapPhotoFileList, setScrapPhotoFileList] = useState<UploadFile[]>(
    [],
  );
  const [photoFileList, setPhotoFileList] = useState<UploadFile[]>([]);
  const [batchOptionsLoading, setBatchOptionsLoading] = useState(false);
  const [loadedDemandAllocations, setLoadedDemandAllocations] =
    useState<WorkOrderDemandAllocationTraceDto[]>();
  const [demandSourceLoadFailed, setDemandSourceLoadFailed] = useState(false);
  const [equipmentAutoFillSource, setEquipmentAutoFillSource] =
    useState<EquipmentAutoFillSource>(null);
  const currentReceiptWarehouseName = currentReceiptWarehouse?.name ?? '—';
  const autoBoundScheduleSlot =
    scheduleSlots.length === 1 ? scheduleSlots[0] : undefined;
  const requiresScheduleEntrySelection = scheduleSlots.length > 1;
  const resolvedDemandAllocations =
    demandAllocations ?? loadedDemandAllocations ?? EMPTY_DEMAND_ALLOCATIONS;
  const demandSources = useMemo(() => {
    const unique = new Map<string, WorkOrderDemandAllocationTraceDto>();
    for (const allocation of resolvedDemandAllocations) {
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
  }, [resolvedDemandAllocations]);
  const demandSourceOptions = demandSources.map((source) => ({
    value: source.demandLineId,
    label: `${source.sourceOrderNo || '直接计划'} · 需求行 ${source.demandLineNo} · 分配投产 ${source.allocatedPlannedQty}${source.customerName ? ` · ${source.customerName}` : ''}${source.sourceRemarkSnapshot ? ` · 来源备注 ${source.sourceRemarkSnapshot}` : ''}`,
  }));
  const demandSourcesReady =
    demandAllocations !== undefined || loadedDemandAllocations !== undefined;
  const selectedScheduleEntryId = Form.useWatch('scheduleEntryId', form);
  const selectedEquipmentId = Form.useWatch('equipmentId', form);
  const reporterId = Form.useWatch('reporterId', form);
  const watchedDemandLineId = Form.useWatch('demandLineId', form);
  const selectedDemandSource = demandSources.find(
    (source) => source.demandLineId === watchedDemandLineId,
  );
  const scrappedQty = parseQtyValue(Form.useWatch('scrappedQty', form));
  const completedQty = parseQtyValue(Form.useWatch('completedQty', form));
  const scrapReasonWatch = Form.useWatch('scrapReason', form);
  // 报废策略实时预检（与后端报工拦截同源）：整单报工无具体工序，operationId 传空
  const scrapPolicyPreview = useWorkOrderScrapPolicyPreview({
    enabled: open,
    materialId,
    customerId: customerId ?? undefined,
    operationId: undefined,
    processOperationId: undefined,
    scrapReason:
      typeof scrapReasonWatch === 'string'
        ? scrapReasonWatch.trim() || undefined
        : undefined,
    completedQty,
    scrappedQty,
    plannedQty: remainQty,
  }, capabilities.previewScrapPolicy);
  const scrapPhotoRequired = Boolean(scrapPolicyPreview?.requiresPhoto);
  const overrideReceiptWarehouseId = Form.useWatch(
    'overrideReceiptWarehouseId',
    form,
  );
  const selectedScheduleSlot =
    scheduleSlots.find((slot) => slot.id === selectedScheduleEntryId) ??
    autoBoundScheduleSlot;
  const scheduleSlotOptions = scheduleSlots.map((slot) => ({
    label: capabilities.formatScheduleSlotLabel(slot),
    value: slot.id,
  }));
  const receiptWarehouseOptions = receiptWarehouseCandidates.map(
    (warehouse) => ({
      label: warehouse.code
        ? `${warehouse.name}（${warehouse.code}）`
        : warehouse.name,
      value: warehouse.id,
    }),
  );
  const effectiveReceiptWarehouseId =
    overrideReceiptWarehouseId || currentReceiptWarehouse?.id;

  useEffect(() => {
    if (!open || demandAllocations !== undefined) return;
    let cancelled = false;
    setLoadedDemandAllocations(undefined);
    setDemandSourceLoadFailed(false);
    void capabilities.loadDemandAllocations(workOrderId)
      .then((sources) => {
        if (!cancelled) setLoadedDemandAllocations(sources ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setDemandSourceLoadFailed(true);
          message.error('来源需求加载失败，请关闭后重新打开报工');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [capabilities, demandAllocations, message, open, workOrderId]);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      reporterId: currentUserId,
      demandLineId:
        demandSources.length === 1 ? demandSources[0].demandLineId : undefined,
      occurredAt: dayjs(),
      scrappedQty: 0,
    });
    setScheduleEntryAutoMatchedByCurrentUser(false);
    setEquipmentAutoFillSource(null);
    setScrapPhotoFileList([]);
    setPhotoFileList([]);
  }, [currentUserId, demandSources, form, open]);

  useEffect(() => {
    let cancelled = false;
    if (!open || !currentUserId) {
      setCurrentSessionEquipmentId(null);
      return () => {
        cancelled = true;
      };
    }

    void capabilities.loadCurrentEquipmentSession()
      .then((session) => {
        if (cancelled) return;
        setCurrentSessionEquipmentId(session?.equipmentId ?? null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.warn(
          'Failed to preload current equipment session for direct report modal',
          error,
        );
        setCurrentSessionEquipmentId(null);
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
      scheduleSlots,
      currentSessionEquipmentId,
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
    currentSessionEquipmentId,
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
      selectedEquipmentId === currentSessionEquipmentId
    ) {
      form.setFieldsValue({ equipmentId: undefined });
      setEquipmentAutoFillSource(null);
    }
  }, [
    open,
    reporterId,
    currentUserId,
    currentSessionEquipmentId,
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
      : reporterId === currentUserId && currentSessionEquipmentId
        ? 'session'
        : null;
    const preferredEquipmentId =
      selectedScheduleSlot?.equipmentId ??
      (reporterId === currentUserId ? currentSessionEquipmentId : null);
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
    currentSessionEquipmentId,
    selectedEquipmentId,
    equipmentAutoFillSource,
    form,
  ]);

  const handleSubmit = async (values: ReportDirectFormValues) => {
    if (batchOptionsLoading) {
      message.info('正在读取生产批号规则，请稍后提交');
      return false;
    }
    if (!demandSourcesReady) {
      message.info('来源需求尚未加载完成，请稍后重试');
      return false;
    }
    const currentCompletedQty = parseQtyValue(values.completedQty);
    const currentScrappedQty = parseQtyValue(values.scrappedQty);
    const parseSerialNumbers = (value?: string) =>
      (value ?? '')
        .split(/[\n,，;；\t ]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    const scrappedSerialNumbers =
      currentScrappedQty > 0
        ? parseSerialNumbers(values.scrappedSerialNumbers)
        : [];
    if (currentCompletedQty + currentScrappedQty <= 0) {
      message.info('请至少填写良品数量或报废数量');
      return false;
    }
    if (currentCompletedQty + currentScrappedQty > remainQty) {
      message.info(`完成数量 + 报废数量不能超过 ${remainQty}`);
      return false;
    }
    if (demandSources.length > 1 && !values.demandLineId) {
      message.info('请选择本次报工对应的来源订单');
      return false;
    }
    const scrapReason = values.scrapReason?.trim() || undefined;
    if (currentScrappedQty > 0 && !scrapReason) {
      message.info('有报废数量时必须填写报废原因');
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
    const reporterId = values.reporterId;
    const occurredAt = values.occurredAt
      ? dayjs(values.occurredAt).toISOString()
      : undefined;
    const scheduleEntryId = requiresScheduleEntrySelection
      ? values.scheduleEntryId
      : undefined;
    // 命中报废策略要求照片时，提交前即拦截（与后端 blocking 同源），避免白填一单被打回
    const hasScrapPhoto = scrapPhotoFileList.some(
      (file) => Boolean(file.originFileObj) || Boolean(file.url),
    );
    if (currentScrappedQty > 0 && scrapPhotoRequired && !hasScrapPhoto) {
      message.error(
        scrapPolicyPreview?.actionMessage
          ? `${scrapPolicyPreview.actionMessage}，请先上传报废照片`
          : '当前报废策略要求上传报废照片',
      );
      return false;
    }
    const [scrapPhotoUrls, photoUrls] = await Promise.all([
      currentScrappedQty > 0
        ? capabilities.uploadPhotos(scrapPhotoFileList)
        : Promise.resolve(undefined),
      photoFileList.length > 0
        ? capabilities.uploadPhotos(photoFileList)
        : Promise.resolve(undefined),
    ]);
    const payload: WorkOrderDirectReportPayload & { equipmentId?: string } = {
      id: workOrderId,
      scheduleEntryId,
      equipmentId: values.equipmentId || undefined,
      occurredAt,
      completedQty: currentCompletedQty,
      scrappedQty: currentScrappedQty || 0,
      scrappedSerialNumbers: needsProductSerials
        ? scrappedSerialNumbers
        : undefined,
      demandLineId:
        values.demandLineId ||
        (demandSources.length === 1
          ? demandSources[0].demandLineId
          : undefined),
      scrapReason,
      scrapPhotoUrls:
        scrapPhotoUrls && scrapPhotoUrls.length > 0
          ? scrapPhotoUrls
          : undefined,
      photoUrls: photoUrls && photoUrls.length > 0 ? photoUrls : undefined,
      batchNo: values.batchNo || undefined,
      remark: values.remark || undefined,
      reporterId:
        reporterId && reporterId !== currentUserId ? reporterId : undefined,
      overrideReceiptWarehouseId,
      receiptLocationId: values.receiptLocationId,
      storageLocation: values.storageLocation?.trim() || undefined,
      receiptWarehouseChangeReason,
    };
    if (
      needsProductSerials &&
      (!Number.isSafeInteger(currentScrappedQty) ||
        scrappedSerialNumbers.length > currentScrappedQty)
    ) {
      message.info(
        `指定的报废序列号不能多于本次报废数量 ${currentScrappedQty}`,
      );
      return false;
    }
    if (new Set(scrappedSerialNumbers).size !== scrappedSerialNumbers.length) {
      message.info('报废序列号不能重复');
      return false;
    }
    await capabilities.reportDirect(payload);
    message.success(capabilities.reportSuccessMessage);
    setPhotoFileList([]);
    setScrapPhotoFileList([]);
    onSuccess();
    return true;
  };

  return (
    <ModalForm
      title={`整单报工 — ${orderNo}`}
      open={open}
      form={form}
      onValuesChange={(changedValues) => {
        if (
          'scrappedQty' in changedValues &&
          Number(changedValues.scrappedQty ?? 0) <= 0
        ) {
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
        reporterId: currentUserId,
        occurredAt: dayjs(),
        scrappedQty: 0,
      }}
    >
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
        {canOverrideReceiptWarehouse &&
        !receiptWarehouseLocked &&
        currentReceiptWarehouse?.id ? (
          <Button
            type="link"
            size="small"
            icon={
              receiptWarehouseEditorOpen ? <CloseOutlined /> : <EditOutlined />
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
      {!demandSourcesReady ? (
        <Alert
          type={demandSourceLoadFailed ? 'error' : 'info'}
          showIcon
          style={{ marginBottom: 16 }}
          message={
            demandSourceLoadFailed ? '来源需求加载失败' : '正在读取来源需求'
          }
          description={
            demandSourceLoadFailed
              ? '请关闭后重新打开报工，再确认本次产出对应的订单。'
              : '读取完成后会显示本工单对应的来源订单和需求行。'
          }
        />
      ) : null}
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
          extra="当前工单存在多条排产实例，整单报工时必须明确绑定设备/时间段。"
        />
      ) : scheduleSlots.length === 1 ? (
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
      {demandSources.length === 1 ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`本次报工来源：${demandSourceOptions[0].label}`}
          description={`本次报工累计不得超过该来源的工单投产分配量；计划完成按该来源计算。${
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
          rules={[{ required: true, message: '请选择本次报工对应的来源订单' }]}
          options={demandSourceOptions}
          showSearch
          fieldProps={{ optionFilterProp: 'label' }}
          extra={`本次产出归属所选来源计划，报工量不得超过该计划在工单中的投产分配量；计划完成按该来源累计。${
            selectedDemandSource?.sourceRemarkSnapshot
              ? ` 来源备注：${selectedDemandSource.sourceRemarkSnapshot}`
              : ''
          }`}
        />
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
      {canOverrideReceiptWarehouse ? (
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
      <StockLocationSelectField
        capabilities={capabilities.stockLocationCapabilities}
        name="receiptLocationId"
        textName="storageLocation"
        label="入库仓位"
        action="work-order/report-direct"
        warehouseId={effectiveReceiptWarehouseId}
        requiredMessage="当前入库仓要求选择入库仓位"
      />
      <ProFormSelect
        name="reporterId"
        {...capabilities.getReportFieldHelpProps('报工人', 'reporterId')}
        showSearch
        request={withKnownWorkOrderOptions(
          capabilities.requestReporterOptions,
          // 预选报工人默认是当前用户；停用或不在 findAllSimple 前 50 名时用名字快照兜底，避免裸显 UUID。
          [
            {
              value: currentUserId ?? null,
              label:
                currentUser?.realName ||
                currentUser?.username ||
                null,
            },
          ],
        )}
        fieldProps={{ optionFilterProp: 'label' }}
      />
      <ProFormSelect
        name="equipmentId"
        {...capabilities.getReportFieldHelpProps('使用设备', 'equipmentId')}
        showSearch
        request={capabilities.requestAvailableEquipmentOptions}
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
      <ProFormDigit
        name="completedQty"
        {...capabilities.getReportFieldHelpProps('完成数量', 'completedQty')}
        rules={[{ required: true, message: '请输入完成数量' }]}
        min={0}
        fieldProps={{ precision: 0 }}
        extra={`剩余可报工数量：${remainQty} ${unitLabel}`}
      />
      {needsProductSerials ? (
        <>
          <Form.Item
            label="本次良品序列号"
            extra="系统按本次良品数量自动绑定待报工号码。"
          >
            <WorkOrderAllocatedSerialsButton
              capabilities={capabilities.allocatedSerialCapabilities}
              workOrderId={workOrderId}
            />
          </Form.Item>
          {scrappedQty > 0 ? (
            <>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  const next = !scrapSerialEntryOpen;
                  setScrapSerialEntryOpen(next);
                  if (!next)
                    form.setFieldsValue({ scrappedSerialNumbers: undefined });
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
      <ProFormDigit
        name="scrappedQty"
        {...capabilities.getReportFieldHelpProps('报废数量', 'scrappedQty')}
        min={0}
        initialValue={0}
        fieldProps={{ precision: 0 }}
      />
      {scrappedQty > 0 ? (
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
      <ProductionBatchNoField
        capabilities={capabilities.productionBatchNoCapabilities}
        workOrderId={workOrderId}
        open={open}
        onLoadingChange={setBatchOptionsLoading}
      />
      <ProFormTextArea
        name="remark"
        {...capabilities.getAutoFieldHelpProps('备注')}
        fieldProps={{ rows: 3 }}
      />
    </ModalForm>
  );
};

export { WorkOrderReportDirectModal };
export default WorkOrderReportDirectModal;
