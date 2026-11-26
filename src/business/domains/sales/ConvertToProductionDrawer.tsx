import {
  ProFormDatePicker,
  ProFormDigit,
  type ProFormInstance,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DocumentModalForm } from '../documents/DocumentModalForm';
import { ResizableTable as Table } from '../shared/ResizableTable';
import type {
  ConvertItem,
  ConvertToProductionDrawerProps,
  ConvertToProductionValues,
  PlanQuantityMode,
  ProductionOption,
  SaleOrderConvertInfoItem,
  SaleOrderProductionPreparation,
} from '../manufacturing/convert-to-production-types';

function roundTo(value: number, places: number): number {
  const multiplier = 10 ** places;
  return Math.round(value * multiplier) / multiplier;
}

function ceilTo(value: number, places: number): number {
  const multiplier = 10 ** places;
  const scaled = value * multiplier;
  const epsilon = Number.EPSILON * Math.max(1, Math.abs(scaled));
  return Math.ceil(scaled - epsilon) / multiplier;
}

function derivePlannedQty(requiredQty: number, lossRate: number): number {
  return ceilTo(requiredQty * (1 + lossRate / 100), 4);
}

function derivePlannedLossRate(requiredQty: number, plannedQty: number): number {
  if (!(requiredQty > 0)) return 0;
  return roundTo((plannedQty / requiredQty - 1) * 100, 2);
}

const matchesRateDriven = (
  requiredQty: number,
  plannedQty: number,
  lossRate: number,
) =>
  derivePlannedQty(requiredQty, lossRate) ===
  roundTo(plannedQty, 4);

const mergeOptions = (...groups: ProductionOption[][]) => {
  const seen = new Set<string>();
  return groups.flat().filter((option) => {
    if (seen.has(option.value)) return false;
    seen.add(option.value);
    return true;
  });
};

const PREPARATION_CONCLUSION_TEXT: Record<
  SaleOrderProductionPreparation['conclusion'],
  string
> = {
  ready: '生产准备已满足',
  warning: '生产准备有提醒',
  blocking: '生产准备存在阻断',
};

const DOCUMENT_BOM_STATUS_TEXT: Record<string, string> = {
  draft: '草稿',
  confirmed: '已确认',
  frozen: '已冻结',
  changed: '已设变',
  obsolete: '已作废',
};

function usesDocumentBomProductionSource(
  row: Pick<SaleOrderConvertInfoItem, 'bomSourceType'>,
) {
  return row.bomSourceType === 'document_bom';
}

function inferQuantityMode(
  row: Pick<
    SaleOrderConvertInfoItem,
    | 'remainingRequiredQty'
    | 'suggestedProductionQty'
    | 'suggestedPlannedQty'
    | 'defaultLossRate'
  >,
): PlanQuantityMode {
  const defaultRequiredQty = Number(
    row.suggestedProductionQty ?? row.remainingRequiredQty ?? 0,
  );
  if (
    defaultRequiredQty > 0 &&
    matchesRateDriven(
      defaultRequiredQty,
      row.suggestedPlannedQty,
      row.defaultLossRate,
    )
  ) {
    return 'rate-driven';
  }
  return 'qty-driven';
}

function buildDefaults(rows: SaleOrderConvertInfoItem[]) {
  const requiredQty: Record<string, number> = {};
  const plannedLossRate: Record<string, number> = {};
  const plannedQty: Record<string, number> = {};
  const quantityMode: Record<string, PlanQuantityMode> = {};
  const bomHeaderId: Record<string, string | undefined> = {};
  const routeId: Record<string, string | undefined> = {};
  const bomOptions: Record<string, ProductionOption[]> = {};
  const routeOptions: Record<string, ProductionOption[]> = {};

  rows.forEach((row) => {
    const nextMode = inferQuantityMode(row);
    const usesDocumentBom = usesDocumentBomProductionSource(row);
    requiredQty[row.saleOrderItemId] = Number(
      row.suggestedProductionQty ?? row.remainingRequiredQty ?? 0,
    );
    plannedLossRate[row.saleOrderItemId] = Number(row.defaultLossRate ?? 0);
    plannedQty[row.saleOrderItemId] = Number(row.suggestedPlannedQty ?? 0);
    quantityMode[row.saleOrderItemId] = nextMode;
    const selectedBomHeaderId = usesDocumentBom
      ? undefined
      : (row.selectedBomHeaderId ?? row.defaultBomHeaderId ?? undefined);
    bomHeaderId[row.saleOrderItemId] = selectedBomHeaderId;
    routeId[row.saleOrderItemId] = row.defaultRouteId ?? undefined;
    bomOptions[row.saleOrderItemId] = selectedBomHeaderId
      ? [
          {
            label: row.defaultBomLabel ?? selectedBomHeaderId,
            value: selectedBomHeaderId,
          },
        ]
      : [];
    routeOptions[row.saleOrderItemId] = row.defaultRouteId
      ? [
          {
            label: row.defaultRouteLabel ?? row.defaultRouteId,
            value: row.defaultRouteId,
          },
        ]
      : [];
  });

  return {
    requiredQty,
    plannedLossRate,
    plannedQty,
    quantityMode,
    bomHeaderId,
    routeId,
    bomOptions,
    routeOptions,
  };
}

function buildStockNettingSnapshotFromRow(
  row: SaleOrderConvertInfoItem,
): Record<string, unknown> {
  return {
    materialId: row.materialId,
    materialName: row.materialName,
    materialCode: row.materialCode,
    grossDemandQty: row.grossDemandQty,
    currentStockQty: row.currentStockQty,
    safetyStockQty: row.safetyStockQty,
    stockOffsetQty: row.stockOffsetQty,
    suggestedProductionQty: row.suggestedProductionQty,
    source: row.source,
  };
}

function resolveStockNettingPayload(
  row: SaleOrderConvertInfoItem,
  requiredQty: number,
  stockNettingReason?: string,
): Pick<
  ConvertItem,
  | 'sourceDemandQty'
  | 'stockOffsetQty'
  | 'stockNettingMode'
  | 'stockNettingSnapshot'
  | 'stockNettingReason'
  | 'sourceDemandType'
> {
  const sourceDemandQty = Number(row.remainingRequiredQty ?? 0);
  const stockOffsetQty = Math.max(sourceDemandQty - requiredQty, 0);
  if (!(stockOffsetQty > 0)) {
    return {
      stockNettingMode: 'none',
    };
  }

  const suggestedProductionQty = Number(row.suggestedProductionQty ?? 0);
  const stockNettingMode =
    Math.abs(requiredQty - suggestedProductionQty) <= 0.0001
      ? 'accepted'
      : 'manual_override';
  return {
    sourceDemandQty,
    stockOffsetQty,
    stockNettingMode,
    stockNettingSnapshot: buildStockNettingSnapshotFromRow(row),
    stockNettingReason:
      stockNettingMode === 'manual_override'
        ? stockNettingReason?.trim()
        : undefined,
    sourceDemandType: 'sales_order',
  };
}

function isManualStockNetting(
  row: SaleOrderConvertInfoItem,
  requiredQty: number,
) {
  const sourceDemandQty = Number(row.remainingRequiredQty ?? 0);
  const stockOffsetQty = Math.max(sourceDemandQty - requiredQty, 0);
  if (!(stockOffsetQty > 0)) return false;
  return (
    Math.abs(requiredQty - Number(row.suggestedProductionQty ?? 0)) > 0.0001
  );
}

function configTextType(status?: string) {
  if (status === 'conflict') return 'danger' as const;
  if (status === 'missing') return 'warning' as const;
  return 'secondary' as const;
}

/**
 * @sunxu-layer business
 * @sunxu-domain sales and production conversion
 * @sunxu-reason Preserves sales-order production conversion planning, inventory netting, BOM/route selection and preparation feedback while the host supplies requests, field help, and notifications.
 */
export function ConvertToProductionDrawer({
  open,
  onOpenChange,
  order,
  onSuccess,
  autoCreateWorkOrder = false,
  capabilities,
}: ConvertToProductionDrawerProps) {
  const formRef = useRef<ProFormInstance<ConvertToProductionValues> | undefined>(
    undefined,
  );
  const capabilitiesRef = useRef(capabilities);
  useEffect(() => {
    capabilitiesRef.current = capabilities;
  }, [capabilities]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<SaleOrderConvertInfoItem[]>([]);
  const [previewPlanStartDate, setPreviewPlanStartDate] = useState('');
  const [requiredQtyMap, setRequiredQtyMap] = useState<Record<string, number>>(
    {},
  );
  const [plannedLossRateMap, setPlannedLossRateMap] = useState<
    Record<string, number>
  >({});
  const [plannedQtyMap, setPlannedQtyMap] = useState<Record<string, number>>(
    {},
  );
  const [quantityModeMap, setQuantityModeMap] = useState<
    Record<string, PlanQuantityMode>
  >({});
  const [stockNettingReasonMap, setStockNettingReasonMap] = useState<
    Record<string, string>
  >({});
  const [bomHeaderIdMap, setBomHeaderIdMap] = useState<
    Record<string, string | undefined>
  >({});
  const [routeIdMap, setRouteIdMap] = useState<
    Record<string, string | undefined>
  >({});
  const [bomOptionsMap, setBomOptionsMap] = useState<
    Record<string, ProductionOption[]>
  >({});
  const [routeOptionsMap, setRouteOptionsMap] = useState<
    Record<string, ProductionOption[]>
  >({});
  const [productionPreparation, setProductionPreparation] =
    useState<SaleOrderProductionPreparation | null>(null);

  const applyRows = useCallback(
    (nextRows: SaleOrderConvertInfoItem[]) => {
      const defaults = buildDefaults(nextRows);
      setRows(nextRows);
      setRequiredQtyMap(defaults.requiredQty);
      setPlannedLossRateMap(defaults.plannedLossRate);
      setPlannedQtyMap(defaults.plannedQty);
      setQuantityModeMap(defaults.quantityMode);
      setStockNettingReasonMap({});
      setBomHeaderIdMap(defaults.bomHeaderId);
      setRouteIdMap(defaults.routeId);
      setBomOptionsMap(defaults.bomOptions);
      setRouteOptionsMap(defaults.routeOptions);
    },
    [],
  );

  const loadConvertInfo = useCallback(
    async (planStartDate?: string, cancelledRef?: { cancelled: boolean }) => {
      setLoading(true);
      try {
        const result = await capabilitiesRef.current.getConvertInfo({
          saleOrderId: order.id,
          planStartDate: planStartDate || undefined,
        });
        if (cancelledRef?.cancelled) return;
        applyRows(result.items ?? []);
        setProductionPreparation(result.productionPreparation ?? null);
      } finally {
        if (!cancelledRef?.cancelled) setLoading(false);
      }
    },
    [applyRows, order.id],
  );

  useEffect(() => {
    if (!open) return;

    const cancelledRef = { cancelled: false };
    setPreviewPlanStartDate('');
    formRef.current?.setFieldsValue({
      planStartDate: undefined,
      planEndDate: undefined,
      priority: 5,
    });
    void loadConvertInfo(undefined, cancelledRef);

    return () => {
      cancelledRef.cancelled = true;
    };
  }, [loadConvertInfo, open]);

  const convertibleRows = useMemo(
    () => rows.filter((row) => Number(row.remainingRequiredQty ?? 0) > 0),
    [rows],
  );

  const resetDefaults = () => {
    const defaults = buildDefaults(rows);
    setRequiredQtyMap(defaults.requiredQty);
    setPlannedLossRateMap(defaults.plannedLossRate);
    setPlannedQtyMap(defaults.plannedQty);
    setQuantityModeMap(defaults.quantityMode);
    setStockNettingReasonMap({});
    setBomHeaderIdMap(defaults.bomHeaderId);
    setRouteIdMap(defaults.routeId);
    setBomOptionsMap(defaults.bomOptions);
    setRouteOptionsMap(defaults.routeOptions);
  };

  const handlePlanStartDateChange = (dateString: string | string[] | null) => {
    if (Array.isArray(dateString)) return;
    if (!dateString) {
      setPreviewPlanStartDate('');
      void loadConvertInfo(undefined);
      return;
    }
    setPreviewPlanStartDate(dateString);
    void loadConvertInfo(dateString);
  };

  const loadBomOptions = async (
    row: SaleOrderConvertInfoItem,
    keyword?: string,
  ) => {
    const options = await capabilities.requestBomOptions({
      keyWords: keyword,
      materialId: row.materialId,
      saleOrderId: order.id,
      saleOrderItemId: row.saleOrderItemId,
    });
    setBomOptionsMap((prev) => ({
      ...prev,
      [row.saleOrderItemId]: mergeOptions(
        prev[row.saleOrderItemId] ?? [],
        options,
      ),
    }));
  };

  const loadRouteOptions = async (
    row: SaleOrderConvertInfoItem,
    keyword?: string,
  ) => {
    const options = await capabilities.requestRouteOptions({
      keyWords: keyword,
      materialId: row.materialId,
      routeSelectionDate: previewPlanStartDate,
    });
    setRouteOptionsMap((prev) => ({
      ...prev,
      [row.saleOrderItemId]: mergeOptions(
        prev[row.saleOrderItemId] ?? [],
        options,
      ),
    }));
  };

  const handleRequiredQtyChange = (
    saleOrderItemId: string,
    value: number | null,
  ) => {
    const nextRequiredQty = Number(value ?? 0);
    setRequiredQtyMap((prev) => ({
      ...prev,
      [saleOrderItemId]: nextRequiredQty,
    }));

    const mode = quantityModeMap[saleOrderItemId] ?? 'rate-driven';
    if (mode === 'rate-driven') {
      const nextLossRate = Number(plannedLossRateMap[saleOrderItemId] ?? 0);
      setPlannedQtyMap((prev) => ({
        ...prev,
        [saleOrderItemId]:
          nextRequiredQty > 0
            ? derivePlannedQty(nextRequiredQty, nextLossRate)
            : 0,
      }));
      return;
    }

    const nextPlannedQty = Number(plannedQtyMap[saleOrderItemId] ?? 0);
    setPlannedLossRateMap((prev) => ({
      ...prev,
      [saleOrderItemId]:
        nextRequiredQty > 0 && nextPlannedQty > 0
          ? derivePlannedLossRate(nextRequiredQty, nextPlannedQty)
          : 0,
    }));
  };

  const handleModeChange = (
    saleOrderItemId: string,
    mode: PlanQuantityMode,
  ) => {
    setQuantityModeMap((prev) => ({ ...prev, [saleOrderItemId]: mode }));

    const requiredQty = Number(requiredQtyMap[saleOrderItemId] ?? 0);
    if (!(requiredQty > 0)) return;

    if (mode === 'rate-driven') {
      const nextLossRate = Number(plannedLossRateMap[saleOrderItemId] ?? 0);
      setPlannedQtyMap((prev) => ({
        ...prev,
        [saleOrderItemId]: derivePlannedQty(requiredQty, nextLossRate),
      }));
      return;
    }

    const nextPlannedQty = Number(plannedQtyMap[saleOrderItemId] ?? 0);
    setPlannedLossRateMap((prev) => ({
      ...prev,
      [saleOrderItemId]:
        nextPlannedQty > 0
          ? derivePlannedLossRate(requiredQty, nextPlannedQty)
          : 0,
    }));
  };

  const handleLossRateChange = (
    saleOrderItemId: string,
    value: number | null,
  ) => {
    const nextLossRate = Number(value ?? 0);
    setPlannedLossRateMap((prev) => ({
      ...prev,
      [saleOrderItemId]: nextLossRate,
    }));

    const requiredQty = Number(requiredQtyMap[saleOrderItemId] ?? 0);
    if (!(requiredQty > 0)) return;

    setPlannedQtyMap((prev) => ({
      ...prev,
      [saleOrderItemId]: derivePlannedQty(requiredQty, nextLossRate),
    }));
  };

  const handlePlannedQtyChange = (
    saleOrderItemId: string,
    value: number | null,
  ) => {
    const nextPlannedQty = Number(value ?? 0);
    setPlannedQtyMap((prev) => ({
      ...prev,
      [saleOrderItemId]: nextPlannedQty,
    }));

    const requiredQty = Number(requiredQtyMap[saleOrderItemId] ?? 0);
    if (!(requiredQty > 0) || !(nextPlannedQty > 0)) return;

    setPlannedLossRateMap((prev) => ({
      ...prev,
      [saleOrderItemId]: derivePlannedLossRate(requiredQty, nextPlannedQty),
    }));
  };

  return (
    <DocumentModalForm<ConvertToProductionValues>
      formRef={formRef}
      title={`${autoCreateWorkOrder ? '转工单' : '转生产计划'} · ${
        order.orderNo ?? ''
      }`.trim()}
      width="100vw"
      layout="vertical"
      open={open}
      onOpenChange={onOpenChange}
      modalProps={{
        destroyOnHidden: true,
        centered: false,
        mask: { closable: false },
        className: 'document-form-modal',
      }}
      dateFormatter="string"
      initialValues={{
        planStartDate: previewPlanStartDate || undefined,
        planEndDate: undefined,
        priority: 5,
      }}
      submitter={{
        searchConfig: {
          submitText: autoCreateWorkOrder ? '确认转工单' : '确认转生产',
        },
      }}
      onFinish={async (values) => {
        const items: ConvertItem[] = [];
        for (const row of convertibleRows) {
          const requiredQty = Number(requiredQtyMap[row.saleOrderItemId] ?? 0);
          const plannedLossRate = Number(
            plannedLossRateMap[row.saleOrderItemId] ?? 0,
          );
          const plannedQty = Number(plannedQtyMap[row.saleOrderItemId] ?? 0);

          if (!(requiredQty > 0)) continue;
          if (requiredQty > Number(row.remainingRequiredQty ?? 0)) {
            throw new Error(
              `【${row.materialName}】本次需求良品数不能超过剩余 ${row.remainingRequiredQty}`,
            );
          }
          if (plannedQty < requiredQty) {
            throw new Error(
              `【${row.materialName}】投产数量不能小于需求良品数量`,
            );
          }
          const manualStockNetting = isManualStockNetting(row, requiredQty);
          const stockNettingReason =
            stockNettingReasonMap[row.saleOrderItemId]?.trim();
          if (manualStockNetting && !stockNettingReason) {
            throw new Error(`【${row.materialName}】请填写手工指定净需求原因`);
          }

          items.push({
            saleOrderItemId: row.saleOrderItemId,
            requiredQty,
            plannedLossRate,
            plannedQty,
            bomHeaderId: usesDocumentBomProductionSource(row)
              ? undefined
              : bomHeaderIdMap[row.saleOrderItemId],
            routeId: routeIdMap[row.saleOrderItemId],
            ...resolveStockNettingPayload(row, requiredQty, stockNettingReason),
          });
        }

        if (items.length === 0) {
          capabilities.notify.warning('请至少选择一条转生产明细');
          return false;
        }

        try {
          const result = await capabilities.batchConvert({
            saleOrderId: order.id,
            planStartDate: values.planStartDate || undefined,
            planEndDate: values.planEndDate || undefined,
            priority: values.priority,
            description: values.description,
            items,
            autoCreateWorkOrder,
          });
          const warnings = result.warnings ?? [];
          const planCount = result.plans?.length ?? 0;
          if (autoCreateWorkOrder) {
            const workOrderCount = (result.plans ?? []).filter(
              (plan) => plan.workOrderId,
            ).length;
            const base = `${capabilities.messages.convertSuccess}，已生成 ${workOrderCount} 个工单`;
            capabilities.notify.success(
              warnings.length > 0
                ? `${base}（${planCount} 个生产计划，${warnings.length} 条提醒）`
                : `${base}（${planCount} 个生产计划）`,
            );
          } else {
            capabilities.notify.success(
              warnings.length > 0
                ? `${capabilities.messages.convertSuccess}，已创建 ${planCount} 个生产计划（${warnings.length} 条配置提醒）`
                : `${capabilities.messages.convertSuccess}，已创建 ${planCount} 个生产计划`,
            );
          }
          onSuccess(result);
          return true;
        } catch (error) {
          capabilities.notify.error(
            error instanceof Error
              ? error.message
              : autoCreateWorkOrder
                ? '转工单失败'
                : '转生产失败',
          );
          return false;
        }
      }}
    >
      <div className="document-form-layout">
        <section className="document-form-section">
          {autoCreateWorkOrder && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message="转换后将逐条确认生产计划并自动生成工单；若个别计划因审批或库存校验未能建单，会保留计划草稿并在结果提醒中列出，可到生产计划页手动确认建单。"
            />
          )}
          <Space style={{ marginBottom: 16 }}>
            <Typography.Text type="secondary">
              默认按当前可用库存抵扣后生成生产缺口；投产数量可按补量率自动计算，也可直接指定。将本次需求良品数填
              0 表示本次不生成生产计划。
            </Typography.Text>
            <Button htmlType="button" type="link" onClick={resetDefaults}>
              恢复默认值
            </Button>
          </Space>

          {productionPreparation && (
            <Alert
              type={
                productionPreparation.conclusion === 'blocking'
                  ? 'error'
                  : productionPreparation.conclusion === 'warning'
                    ? 'warning'
                    : 'success'
              }
              showIcon
              style={{ marginBottom: 16 }}
              message={
                PREPARATION_CONCLUSION_TEXT[productionPreparation.conclusion]
              }
              description={
                <Space orientation="vertical" size={4}>
                  <Typography.Text>
                    明细行图纸：
                    {productionPreparation.drawing.hasDrawing
                      ? `已关联 ${productionPreparation.drawing.itemDrawingCount} 份`
                      : '未关联'}
                    ；合同及订单头附件{' '}
                    {productionPreparation.drawing.orderAttachmentCount}{' '}
                    份（不会自动下传到工单） ；BOM：已确认激活{' '}
                    {productionPreparation.bom.activeConfirmedCount} / 关联{' '}
                    {productionPreparation.bom.totalCount}；路线：匹配{' '}
                    {productionPreparation.route.matchedCount}，缺失{' '}
                    {productionPreparation.route.missingCount}；待办：未完成{' '}
                    {productionPreparation.todo.unfinishedCount}，逾期{' '}
                    {productionPreparation.todo.overdueCount}
                  </Typography.Text>
                  {productionPreparation.blockers.length > 0 && (
                    <Typography.Text type="danger">
                      {productionPreparation.blockers.join('；')}
                    </Typography.Text>
                  )}
                  {productionPreparation.warnings.length > 0 && (
                    <Typography.Text type="warning">
                      {productionPreparation.warnings.join('；')}
                    </Typography.Text>
                  )}
                </Space>
              }
            />
          )}
        </section>

        <section className="document-form-section document-form-section-lines">
          <Table<SaleOrderConvertInfoItem>
            rowKey="saleOrderItemId"
            loading={loading}
            size="small"
            pagination={false}
            scroll={{ x: 2330 }}
            dataSource={rows}
            locale={{
              emptyText: '暂无可转生产的订单明细',
            }}
            columns={[
              {
                title: '物料名称',
                dataIndex: 'materialName',
                width: 200,
                fixed: 'left',
                render: (_, row) => (
                  <Space orientation="vertical" size={0}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      订单行 #{row.saleOrderItemLineNo}
                    </Typography.Text>
                    <Typography.Text>{row.materialName || '-'}</Typography.Text>
                  </Space>
                ),
              },
              {
                title: '物料编码',
                dataIndex: 'materialCode',
                width: 150,
                fixed: 'left',
                render: (_, row) => row.materialCode || '-',
              },
              {
                title: '订单图纸',
                dataIndex: 'drawingCount',
                width: 120,
                render: (_, row) =>
                  row.drawingCount > 0 ? (
                    <Tag color="green">{row.drawingCount} 份</Tag>
                  ) : (
                    <Typography.Text type="warning">未关联</Typography.Text>
                  ),
              },
              {
                title: '交货日期',
                dataIndex: 'deliveryDate',
                width: 120,
                render: (_, row) => row.deliveryDate || '-',
              },
              {
                title: '订单需求',
                dataIndex: 'orderQty',
                width: 100,
                align: 'right',
              },
              {
                title: '已转良品',
                dataIndex: 'convertedRequiredQty',
                width: 100,
                align: 'right',
              },
              {
                title: '剩余可转',
                dataIndex: 'remainingRequiredQty',
                width: 110,
                align: 'right',
              },
              {
                title: '可用库存',
                dataIndex: 'currentStockQty',
                width: 100,
                align: 'right',
              },
              {
                title: '库存抵扣',
                dataIndex: 'stockOffsetQty',
                width: 100,
                align: 'right',
              },
              {
                title: '建议生产',
                dataIndex: 'suggestedProductionQty',
                width: 100,
                align: 'right',
              },
              {
                title: capabilities.fieldHelp.productionLabel(
                  '本次需求良品数',
                  'requiredQty',
                ),
                key: 'requiredQty',
                width: 170,
                render: (_, row) => {
                  const disabled = Number(row.remainingRequiredQty ?? 0) <= 0;
                  return (
                    <InputNumber
                      min={0}
                      max={Number(row.remainingRequiredQty ?? 0)}
                      precision={4}
                      disabled={disabled}
                      value={requiredQtyMap[row.saleOrderItemId]}
                      onChange={(value) =>
                        handleRequiredQtyChange(row.saleOrderItemId, value)
                      }
                      style={{ width: '100%' }}
                    />
                  );
                },
              },
              {
                title: capabilities.fieldHelp.productionLabel(
                  '数量驱动方式',
                  'quantityMode',
                ),
                key: 'quantityMode',
                width: 180,
                render: (_, row) => {
                  const disabled = Number(row.remainingRequiredQty ?? 0) <= 0;
                  return (
                    <Radio.Group
                      size="small"
                      disabled={disabled}
                      value={
                        quantityModeMap[row.saleOrderItemId] ?? 'rate-driven'
                      }
                      onChange={(event) =>
                        handleModeChange(
                          row.saleOrderItemId,
                          event.target.value as PlanQuantityMode,
                        )
                      }
                    >
                      <Radio.Button value="rate-driven">按补量率</Radio.Button>
                      <Radio.Button value="qty-driven">按投产数</Radio.Button>
                    </Radio.Group>
                  );
                },
              },
              {
                title: capabilities.fieldHelp.productionLabel(
                  '补量率(%)',
                  'plannedLossRate',
                ),
                key: 'plannedLossRate',
                width: 130,
                align: 'right',
                render: (_, row) => {
                  const disabled =
                    Number(row.remainingRequiredQty ?? 0) <= 0 ||
                    quantityModeMap[row.saleOrderItemId] === 'qty-driven';
                  return (
                    <InputNumber
                      min={0}
                      precision={2}
                      disabled={disabled}
                      value={plannedLossRateMap[row.saleOrderItemId]}
                      onChange={(value) =>
                        handleLossRateChange(row.saleOrderItemId, value)
                      }
                      style={{ width: '100%' }}
                    />
                  );
                },
              },
              {
                title: capabilities.fieldHelp.productionLabel(
                  '投产数量',
                  'plannedQty',
                ),
                key: 'plannedQty',
                width: 130,
                align: 'right',
                render: (_, row) => {
                  const disabled =
                    Number(row.remainingRequiredQty ?? 0) <= 0 ||
                    quantityModeMap[row.saleOrderItemId] !== 'qty-driven';
                  return (
                    <InputNumber
                      min={0}
                      precision={4}
                      disabled={disabled}
                      value={plannedQtyMap[row.saleOrderItemId]}
                      onChange={(value) =>
                        handlePlannedQtyChange(row.saleOrderItemId, value)
                      }
                      style={{ width: '100%' }}
                    />
                  );
                },
              },
              {
                title: '手工原因',
                key: 'stockNettingReason',
                width: 220,
                render: (_, row) => {
                  const requiredQty = Number(
                    requiredQtyMap[row.saleOrderItemId] ?? 0,
                  );
                  if (!isManualStockNetting(row, requiredQty)) {
                    return (
                      <Typography.Text type="secondary">-</Typography.Text>
                    );
                  }
                  return (
                    <Input.TextArea
                      size="small"
                      autoSize={{ minRows: 1, maxRows: 3 }}
                      maxLength={500}
                      placeholder="说明手工调整原因"
                      value={stockNettingReasonMap[row.saleOrderItemId]}
                      onChange={(event) =>
                        setStockNettingReasonMap((prev) => ({
                          ...prev,
                          [row.saleOrderItemId]: event.target.value,
                        }))
                      }
                    />
                  );
                },
              },
              {
                title: '生产 BOM',
                key: 'bomHeaderId',
                width: 230,
                render: (_, row) => {
                  const disabled = Number(row.remainingRequiredQty ?? 0) <= 0;
                  if (usesDocumentBomProductionSource(row)) {
                    return (
                      <Space orientation="vertical" size={2}>
                        <Space size={6} wrap>
                          <Tag color="processing">本单 BOM</Tag>
                          <Typography.Text>
                            {row.documentBomStatus
                              ? (DOCUMENT_BOM_STATUS_TEXT[
                                  row.documentBomStatus
                                ] ?? row.documentBomStatus)
                              : '已带入'}
                          </Typography.Text>
                        </Space>
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 12 }}
                        >
                          由订单明细本单 BOM 带入，不从标准 BOM 列表选择
                        </Typography.Text>
                      </Space>
                    );
                  }
                  return (
                    <Space
                      orientation="vertical"
                      size={2}
                      style={{ width: '100%' }}
                    >
                      <Select
                        size="small"
                        showSearch
                        allowClear
                        filterOption={false}
                        disabled={disabled}
                        value={bomHeaderIdMap[row.saleOrderItemId]}
                        options={bomOptionsMap[row.saleOrderItemId] ?? []}
                        placeholder="系统默认"
                        onFocus={() => void loadBomOptions(row)}
                        onSearch={(keyword) =>
                          void loadBomOptions(row, keyword)
                        }
                        onChange={(value: string | undefined) =>
                          setBomHeaderIdMap((prev) => ({
                            ...prev,
                            [row.saleOrderItemId]: value,
                          }))
                        }
                        style={{ width: '100%' }}
                      />
                      {(row.defaultBomMessage || row.defaultBomLabel) && (
                        <Typography.Text
                          type={configTextType(row.defaultBomStatus)}
                          style={{ fontSize: 12 }}
                        >
                          {row.defaultBomMessage ?? row.defaultBomLabel}
                        </Typography.Text>
                      )}
                    </Space>
                  );
                },
              },
              {
                title: '工艺路线',
                key: 'routeId',
                width: 250,
                render: (_, row) => {
                  const disabled = Number(row.remainingRequiredQty ?? 0) <= 0;
                  return (
                    <Space
                      orientation="vertical"
                      size={2}
                      style={{ width: '100%' }}
                    >
                      <Select
                        size="small"
                        showSearch
                        allowClear
                        filterOption={false}
                        disabled={disabled}
                        value={routeIdMap[row.saleOrderItemId]}
                        options={routeOptionsMap[row.saleOrderItemId] ?? []}
                        placeholder="系统默认"
                        onFocus={() => void loadRouteOptions(row)}
                        onSearch={(keyword) =>
                          void loadRouteOptions(row, keyword)
                        }
                        onChange={(value: string | undefined) =>
                          setRouteIdMap((prev) => ({
                            ...prev,
                            [row.saleOrderItemId]: value,
                          }))
                        }
                        style={{ width: '100%' }}
                      />
                      {(row.defaultRouteMessage || row.defaultRouteLabel) && (
                        <Typography.Text
                          type={configTextType(row.defaultRouteStatus)}
                          style={{ fontSize: 12 }}
                        >
                          {row.defaultRouteMessage ?? row.defaultRouteLabel}
                          {row.defaultRouteVersionLabel
                            ? ` · ${row.defaultRouteVersionLabel}`
                            : ''}
                        </Typography.Text>
                      )}
                    </Space>
                  );
                },
              },
              {
                title: '配置状态',
                key: 'productionConfigStatus',
                width: 220,
                render: (_, row) => {
                  const warnings = row.warnings ?? [];
                  const hasConflict =
                    row.defaultBomStatus === 'conflict' ||
                    row.defaultRouteStatus === 'conflict' ||
                    row.compatibilityStatus === 'conflict';
                  if (hasConflict) {
                    return (
                      <Typography.Text type="danger">
                        {row.compatibilityMessage ??
                          row.defaultBomMessage ??
                          row.defaultRouteMessage ??
                          '生产配置冲突'}
                      </Typography.Text>
                    );
                  }
                  if (warnings.length > 0) {
                    return (
                      <Space orientation="vertical" size={2}>
                        {warnings.map((warning) => (
                          <Typography.Text type="warning" key={warning}>
                            {warning}
                          </Typography.Text>
                        ))}
                      </Space>
                    );
                  }
                  return (
                    <Typography.Text type="secondary">
                      {row.compatibilityStatus === 'matched'
                        ? 'BOM 与路线匹配'
                        : '可生成计划草稿'}
                    </Typography.Text>
                  );
                },
              },
              {
                title: '状态',
                key: 'status',
                width: 120,
                render: (_, row) => {
                  if (Number(row.remainingRequiredQty ?? 0) <= 0) {
                    return (
                      <Typography.Text type="success">
                        已全部占用
                      </Typography.Text>
                    );
                  }
                  if (
                    Number(row.stockOffsetQty ?? 0) > 0 &&
                    Number(row.suggestedProductionQty ?? 0) <= 0
                  ) {
                    return (
                      <Typography.Text type="secondary">
                        库存可覆盖
                      </Typography.Text>
                    );
                  }
                  return (
                    <Typography.Text type="secondary">
                      可继续转生产
                    </Typography.Text>
                  );
                },
              },
            ]}
          />
        </section>

        <section className="document-form-section">
          <div className="document-form-section-title">计划信息</div>
          <ProFormDatePicker
            name="planStartDate"
            {...capabilities.fieldHelp.productionProps(
              '计划开始日期',
              'planStartDate',
            )}
            fieldProps={{
              style: { width: '100%' },
              onChange: (
                _date: Dayjs | Dayjs[] | null,
                dateString: string | string[] | null,
              ) => handlePlanStartDateChange(dateString),
              placeholder: '不填则由系统排程计算',
            }}
          />
          <ProFormDatePicker
            name="planEndDate"
            {...capabilities.fieldHelp.productionProps(
              '计划完成日期',
              'planEndDate',
            )}
            fieldProps={{
              style: { width: '100%' },
              placeholder: '不填则由系统排程计算',
            }}
          />
          <ProFormDigit
            name="priority"
            {...capabilities.fieldHelp.automaticProps('优先级')}
            min={1}
            max={10}
            fieldProps={{ precision: 0, style: { width: '100%' } }}
          />
          <ProFormTextArea
            name="description"
            {...capabilities.fieldHelp.automaticProps('备注')}
            fieldProps={{ rows: 3 }}
          />
        </section>
      </div>
    </DocumentModalForm>
  );
}
