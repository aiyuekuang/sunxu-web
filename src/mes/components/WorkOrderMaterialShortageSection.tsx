import {
  ModalForm,
  type ProColumns,
  ProFormDatePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DocumentCustomFieldPanel } from './DocumentCustomFieldPanel';
import { DocumentLineCustomFieldFormItems } from './DocumentLineCustomFieldFormItems';
import { ProductionBomSelect } from './ProductionBomSelect';
import { ResizableProTable as ProTable, ResizableTable as Table } from './ResizableTable';
import type { ResizableTableProps } from './ResizableTable';
import { StockBusinessDateField } from './StockBusinessDateField';
import type {
  MaterialReadinessItem,
  MaterialReadinessResult,
  MaterialShortageCapabilities,
  MaterialShortageCustomFieldCarrier,
  MaterialShortageProductionPlan,
  MaterialShortageRequirement,
  MaterialShortageRequirementRow,
  MaterialShortageSupplyItem,
  MaterialShortageSupplyOrder,
  MaterialShortageSupplyBizType,
  WorkOrderMaterialShortageDetail,
} from './work-order-material-shortage-types';

type WorkOrderDetailLike = WorkOrderMaterialShortageDetail;

type SupplyBizType = MaterialShortageSupplyBizType;

type MaterialReqRow = MaterialShortageRequirementRow;

const INLINE_SUPPLY_PAGE_SIZE = 20;

function RouteFieldResetter({ normalizeDatePickerValue }: { normalizeDatePickerValue: (value: unknown) => string | undefined }) {
  const form = Form.useFormInstance();
  const materialId = Form.useWatch('materialId', form);
  const customerId = Form.useWatch('customerId', form);
  const planStartDate = Form.useWatch('planStartDate', form);
  const dependencyKey = `${materialId ?? ''}|${customerId ?? ''}|${
    normalizeDatePickerValue(planStartDate) ?? ''
  }`;
  const previousKeyRef = useRef<string | null>(null);
  const previousMaterialIdRef = useRef<unknown>(undefined);

  useEffect(() => {
    if (previousKeyRef.current === null) {
      previousKeyRef.current = dependencyKey;
      previousMaterialIdRef.current = materialId;
      return;
    }
    if (previousKeyRef.current !== dependencyKey) {
      previousKeyRef.current = dependencyKey;
      const nextFields: { bomHeaderId?: undefined; routeId: undefined } = {
        routeId: undefined,
      };
      if (previousMaterialIdRef.current !== materialId) {
        nextFields.bomHeaderId = undefined;
      }
      previousMaterialIdRef.current = materialId;
      form.setFieldsValue(nextFields);
    }
  }, [dependencyKey, form, materialId]);

  return null;
}

/** @sunxu-component mes-specific @sunxu-domain manufacturing @sunxu-reason Preserves MES BOM readiness, line-side supply orders, requirement edits, supplier sourcing, plan linking and inventory reversal through typed host capabilities. */
export interface WorkOrderMaterialShortageSectionProps {
  detail: WorkOrderDetailLike;
  onSuccess: () => void;
  /** The host must also provide MesUiProvider BOM selection and document custom-field capabilities. */
  capabilities: MaterialShortageCapabilities;
}

interface LinkPlanFormValues {
  planId: string;
}

interface CreatePlanFormValues {
  materialId: string;
  materialDisplay: string;
  plannedQty: number;
  planStartDate?: string;
  planEndDate?: string;
  dueDate?: string;
  priority?: number;
  customerId?: string;
  bomHeaderId?: string;
  routeId?: string;
  description?: string;
}

interface CreateSupplyFormValues {
  plannedQty: number;
  batchNo?: string;
  remarks?: string;
  itemCustom?: MaterialShortageCustomFieldCarrier;
}

interface ExecuteSupplyFormValues {
  businessDate?: unknown;
  items?: Array<{
    itemId: string;
    actualQty?: number;
    batchNo?: string;
  } & MaterialShortageCustomFieldCarrier>;
}

interface ReverseSupplyFormValues {
  businessDate?: unknown;
  reason?: string;
}

const LINKABLE_PLAN_STATUSES: string[] = [
  'draft',
  'confirmed',
  'scheduled',
  'released',
  'in_progress',
];

const TERMINAL_WORK_ORDER_STATUSES = ['completed', 'closed', 'cancelled'];

const qty = (value?: number | string | null) => Number(value ?? 0);

const getPlanStatusLabel = (
  status: string | null | undefined,
  statusMap: MaterialShortageCapabilities['statusMaps']['plan'],
) => (status ? (statusMap[status]?.text ?? '未知状态') : '未知状态');

/**
 * 供应商版本/价格档展示：以等级（material_grade 字典）文案为准。
 * 车间「物料消耗」卡片只露版本，不露价格。
 */
const formatSourcingVersion = (
  record: MaterialShortageRequirement,
  gradeLabelMap: Record<string, string>,
): string => {
  if (record.requiredGrade) {
    return gradeLabelMap[record.requiredGrade] ?? record.requiredGrade;
  }
  return '未指定';
};

// 行级是否允许调整供应商版本/来源：与后端 overrideReq 校验口径一致
// （capabilities.canCustomize || canSubstitute）。
const canAdjustLineSource = (record: MaterialShortageRequirement): boolean => {
  const capabilities = record.lineCapabilities ?? {};
  return (
    Boolean(capabilities.canCustomize) || Boolean(capabilities.canSubstitute)
  );
};

const sortPlans = (
  plans: MaterialShortageProductionPlan[],
  customerId?: string | null,
) =>
  [...plans].sort((left, right) => {
    const leftCustomerRank =
      customerId && left.customerId === customerId ? 0 : 1;
    const rightCustomerRank =
      customerId && right.customerId === customerId ? 0 : 1;
    if (leftCustomerRank !== rightCustomerRank) {
      return leftCustomerRank - rightCustomerRank;
    }

    const leftStart = left.planStartDate
      ? dayjs(left.planStartDate).valueOf()
      : Number.MAX_SAFE_INTEGER;
    const rightStart = right.planStartDate
      ? dayjs(right.planStartDate).valueOf()
      : Number.MAX_SAFE_INTEGER;
    if (leftStart !== rightStart) {
      return leftStart - rightStart;
    }

    return Number(right.priority ?? 0) - Number(left.priority ?? 0);
  });

type ProductionSupplyItemWithCustomFields = MaterialShortageSupplyItem &
  MaterialShortageCustomFieldCarrier;

function ProductionSupplyItemsPanel({ orderId, capabilities }: { orderId: string; capabilities: MaterialShortageCapabilities }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ProductionSupplyItemWithCustomFields[]>(
    [],
  );
  const unitLabelMap = capabilities.unitLabelMap;
  const lineCustomFieldSchema = capabilities.customFieldSchema;
  const columns = useMemo<ColumnsType<ProductionSupplyItemWithCustomFields>>(
    () => [
      {
        title: '物料名称',
        width: 180,
        ellipsis: true,
        render: (_: unknown, record: ProductionSupplyItemWithCustomFields) =>
          record.material?.name || record.materialId,
      },
      {
        title: '物料编码',
        width: 150,
        ellipsis: true,
        render: (_: unknown, record: ProductionSupplyItemWithCustomFields) =>
          record.material?.code || '—',
      },
      {
        title: '规格型号',
        width: 160,
        ellipsis: true,
        render: (_: unknown, record: ProductionSupplyItemWithCustomFields) =>
          record.material?.spec || '—',
      },
      {
        title: '单位',
        width: 90,
        render: (_: unknown, record: ProductionSupplyItemWithCustomFields) =>
          capabilities.formatUnitLabel(record.material?.unit, unitLabelMap) || '—',
      },
      {
        title: '来源仓',
        width: 140,
        ellipsis: true,
        render: (_: unknown, record: ProductionSupplyItemWithCustomFields) =>
          record.sourceWarehouse?.name || '—',
      },
      {
        title: '线边仓',
        width: 140,
        ellipsis: true,
        render: (_: unknown, record: ProductionSupplyItemWithCustomFields) =>
          record.lineSideWarehouse?.name || '—',
      },
      {
        title: '计划数量',
        dataIndex: 'plannedQty',
        width: 110,
        align: 'right',
        render: (_: unknown, record: ProductionSupplyItemWithCustomFields) =>
          `${qty(record.plannedQty)} ${capabilities.formatUnitLabel(
            record.material?.unit,
            unitLabelMap,
          )}`.trim(),
      },
      {
        title: '已执行',
        dataIndex: 'actualQty',
        width: 110,
        align: 'right',
        render: (_: unknown, record: ProductionSupplyItemWithCustomFields) =>
          qty(record.actualQty),
      },
      {
        title: '批号',
        dataIndex: 'batchNo',
        width: 140,
        render: (_: unknown, record: ProductionSupplyItemWithCustomFields) =>
          record.batchNo || '—',
      },
      ...capabilities.requestSupplyLineCustomFieldColumns(lineCustomFieldSchema),
    ],
    [capabilities, lineCustomFieldSchema, unitLabelMap],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    capabilities.getProductionSupplyOrder({ id: orderId })
      .then((detail) => {
        if (!cancelled) {
          setItems(
            (detail.items ?? []) as ProductionSupplyItemWithCustomFields[],
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [capabilities, orderId]);

  return (
    <Table<ProductionSupplyItemWithCustomFields>
      rowKey="id"
      className="mes-expanded-detail-table"
      size="small"
      loading={loading}
      pagination={false}
      resizable={false}
      dataSource={items}
      columns={columns}
      scroll={{ x: 'max-content' }}
    />
  );
}

export function WorkOrderMaterialShortageSection({
  detail,
  onSuccess,
  capabilities,
}: WorkOrderMaterialShortageSectionProps) {
  const materialGradeLabelMap = capabilities.materialGradeLabelMap;
  const unitLabelMap = capabilities.unitLabelMap;
  const [readiness, setReadiness] =
    useState<MaterialReadinessResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [resolvingSourcing, setResolvingSourcing] = useState(false);
  const [overrideRow, setOverrideRow] = useState<MaterialReqRow | null>(null);
  const [linkPlanOpen, setLinkPlanOpen] = useState(false);
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [supplyOrders, setSupplyOrders] = useState<MaterialShortageSupplyOrder[]>(
    [],
  );
  const [supplyLoading, setSupplyLoading] = useState(false);
  const [supplyPage, setSupplyPage] = useState(1);
  const [supplyTotal, setSupplyTotal] = useState(0);
  const [selectedSupplyIds, setSelectedSupplyIds] = useState<string[]>([]);
  const [createSupplyContext, setCreateSupplyContext] = useState<{
    bizType: SupplyBizType;
    row: MaterialReqRow;
  } | null>(null);
  const [executeOrder, setExecuteOrder] =
    useState<MaterialShortageSupplyOrder | null>(null);
  const [executeDetail, setExecuteDetail] =
    useState<MaterialShortageSupplyOrder | null>(null);
  const [executeLoading, setExecuteLoading] = useState(false);
  const [executeSubmitting, setExecuteSubmitting] = useState(false);
  const [reverseSupplyOrder, setReverseSupplyOrder] =
    useState<MaterialShortageSupplyOrder | null>(null);
  const [executeForm] = Form.useForm<ExecuteSupplyFormValues>();
  const supplyItemCustomFieldSchema = capabilities.customFieldSchema;
  const hasBom = !!detail.bomHeaderId;

  const canViewSupply = capabilities.permissions.productionSupplyView;
  const canPrintSupply = canViewSupply && capabilities.permissions.printJobSubmit;
  const canViewSupplyPrintRecords = canViewSupply && capabilities.permissions.printJobView;
  const openPrintBatch = capabilities.openPrintBatch;
  const openRecords = capabilities.openPrintRecords;
  const printJobActionNode = capabilities.renderPrintActionNode;
  const canCreateSupply = capabilities.permissions.productionSupplyCreate;
  const canExecuteSupply = capabilities.permissions.productionSupplyExecute;
  const canCancelSupply = capabilities.permissions.productionSupplyCancel;
  const canReverseSupply = capabilities.permissions.productionSupplyReverse;
  const canOperateSupply =
    canCreateSupply &&
    !TERMINAL_WORK_ORDER_STATUSES.includes(detail.status ?? '');
  // 工单物料需求行的删除/改量能力（放开型：受 BOM 行可调整能力 + 权限双重控制）
  const canEditMaterialReq = capabilities.permissions.materialRequirementUpdate;
  const canDeleteMaterialReq = capabilities.permissions.materialRequirementDelete;
  const canAdjustMaterialReq =
    (canEditMaterialReq || canDeleteMaterialReq) &&
    !TERMINAL_WORK_ORDER_STATUSES.includes(detail.status ?? '');
  // 供应商价格档/版本：解算与按行覆盖能力
  const canResolveSourcing = capabilities.permissions.workOrderSourcingResolve;
  const canOverrideSourcing = capabilities.permissions.workOrderSourcingOverride;
  const canMutateSourcing = !TERMINAL_WORK_ORDER_STATUSES.includes(
    detail.status ?? '',
  );
  const [changeQtyRow, setChangeQtyRow] = useState<MaterialReqRow | null>(null);
  const [deletingReqId, setDeletingReqId] = useState<string | null>(null);
  const planId = detail.planId ?? detail.plan?.id;
  const planStatus = detail.plan?.status;
  const supplyBizTypeLabelMap: Record<SupplyBizType, string> = {
    replenish: capabilities.statusMaps.supplyBizType.replenish?.text ?? '补料',
    return: capabilities.statusMaps.supplyBizType.return?.text ?? '退回',
  };
  const canEditPlanRelation = ['draft', 'released'].includes(
    detail.status ?? '',
  );
  const canRunMrp = !!planId && capabilities.isMrpEligiblePlanStatus(planStatus);
  const shortageCount =
    readiness?.items?.filter((item) => !item.sufficient).length ?? 0;
  const shortageHint = !planId
    ? canEditPlanRelation
      ? '当前工单未关联生产计划，需先补关联后再处理物料缺口。'
      : '当前工单状态不支持补关联计划，请到生产计划侧处理缺料。'
    : canRunMrp
      ? '缺料已定位到关联计划，可从计划侧继续处理。'
      : `关联计划当前为「${getPlanStatusLabel(
        planStatus,
        capabilities.statusMaps.plan,
        )}」，需先在计划侧满足 MRP 条件。`;

  const materialDisplay = detail.material
    ? `${detail.material.code ? `${detail.material.code} - ` : ''}${
        detail.material.name
      }`
    : '—';

  const createInitialValues: CreatePlanFormValues = {
    materialId: detail.materialId ?? '',
    materialDisplay,
    plannedQty: Number(detail.plannedQty ?? 0) || 1,
    planStartDate: detail.planStartTime
      ? dayjs(detail.planStartTime).format('YYYY-MM-DD')
      : undefined,
    planEndDate: detail.planEndTime
      ? dayjs(detail.planEndTime).format('YYYY-MM-DD')
      : undefined,
    dueDate: detail.dueDate
      ? dayjs(detail.dueDate).format('YYYY-MM-DD')
      : undefined,
    priority: Number(detail.priority ?? 5),
    customerId: detail.customerId ?? detail.customer?.id ?? undefined,
    bomHeaderId: detail.bomHeaderId ?? detail.bomHeader?.id ?? undefined,
    routeId: detail.routeId ?? detail.route?.id ?? undefined,
    description: detail.description ?? undefined,
  };

  const loadReadiness = async ({
    showLoading = false,
    silentError = false,
  }: {
    showLoading?: boolean;
    silentError?: boolean;
  } = {}) => {
    if (showLoading) {
      setChecking(true);
    }
    try {
      const result = await capabilities.checkMaterialReadiness({
        workOrderId: detail.id,
      });
      setReadiness(result);
      return result;
    } catch (error) {
      if (!silentError) {
        capabilities.notify.error(capabilities.getErrorMessage(error, '齐套检查失败'));
      }
      return null;
    } finally {
      if (showLoading) {
        setChecking(false);
      }
    }
  };

  const loadSupplyOrders = async ({
    showLoading = false,
    silentError = false,
    page = 1,
  }: {
    showLoading?: boolean;
    silentError?: boolean;
    page?: number;
  } = {}) => {
    if (!canViewSupply) {
      setSupplyOrders([]);
      setSupplyPage(1);
      setSupplyTotal(0);
      return [];
    }
    if (showLoading) {
      setSupplyLoading(true);
    }
    try {
      const result = await capabilities.listProductionSupplyOrders({
        workOrderId: detail.id,
        page,
        pageSize: INLINE_SUPPLY_PAGE_SIZE,
      });
      const list = result?.list ?? [];
      setSupplyOrders(list);
      setSupplyPage(page);
      setSupplyTotal(Number(result?.total ?? list.length));
      return list;
    } catch (error) {
      if (!silentError) {
        capabilities.notify.error(capabilities.getErrorMessage(error, '加载供料单失败'));
      }
      return [];
    } finally {
      if (showLoading) {
        setSupplyLoading(false);
      }
    }
  };

  const refreshSupplyContext = async ({
    showLoading = false,
    silentError = false,
  }: {
    showLoading?: boolean;
    silentError?: boolean;
  } = {}) => {
    await Promise.all([
      loadReadiness({ showLoading, silentError }),
      loadSupplyOrders({ showLoading, silentError }),
    ]);
  };

  const refreshAfterMutation = async (successMessage: string) => {
    capabilities.notify.success(successMessage);
    await Promise.resolve(onSuccess());
    await refreshSupplyContext({ silentError: true });
  };

  useEffect(() => {
    if (!hasBom) {
      setReadiness(null);
      setSupplyOrders([]);
      setSupplyPage(1);
      setSupplyTotal(0);
      return;
    }
    void refreshSupplyContext({ silentError: true });
  }, [detail.id, canViewSupply, hasBom]);

  const readinessMap = useMemo(
    () =>
      new Map(
        (readiness?.items ?? []).map((item) => [item.materialReqId, item]),
      ),
    [readiness],
  );

  const handleDeleteReqLine = async (row: MaterialReqRow) => {
    setDeletingReqId(row.id);
    try {
      await capabilities.deleteRequirementLine({
        materialReqId: row.id,
      });
      capabilities.notify.success('需求行已删除');
      onSuccess?.();
    } finally {
      setDeletingReqId(null);
    }
  };

  const handleChangeReqQty = async (values: {
    requiredQty: number;
    reason?: string;
  }) => {
    if (!changeQtyRow) return false;
    await capabilities.changeRequirementQuantity({
      materialReqId: changeQtyRow.id,
      requiredQty: Number(values.requiredQty),
      reason: values.reason,
    });
    capabilities.notify.success('需求量已调整');
    setChangeQtyRow(null);
    onSuccess?.();
    return true;
  };

  const handleResolveSourcing = async () => {
    setResolvingSourcing(true);
    try {
      const result = await capabilities.resolveWorkOrderSourcing({
        workOrderId: detail.id,
      });
      capabilities.notify.success(`来源/版本已解算：共 ${result.total} 行，解算 ${result.resolved} 行，已领料跳过 ${result.skippedIssued} 行`);
      onSuccess?.();
    } finally {
      setResolvingSourcing(false);
    }
  };

  const handleOverrideSourcing = async (values: {
    requiredPriceTierId: string;
    reason: string;
  }) => {
    if (!overrideRow) return false;
    await capabilities.overrideWorkOrderSourcing({
      materialReqId: overrideRow.id,
      requiredPriceTierId: values.requiredPriceTierId,
      reason: values.reason,
    });
    capabilities.notify.success('供应商版本已指定');
    setOverrideRow(null);
    onSuccess?.();
    return true;
  };

  const requisitionRows = useMemo<MaterialReqRow[]>(
    () =>
      (detail.materialRequisitions ?? []).map((req) => {
        const readinessItem = readinessMap.get(req.id);
        const netRequired = Math.max(
          0,
          qty(readinessItem?.netRequired) ||
            qty(req.requiredQty) - qty(req.issuedQty) + qty(req.returnedQty),
        );
        const lineSideAvailable = qty(readinessItem?.lineSideAvailable);
        const pendingSupplyQty = qty(readinessItem?.pendingSupplyQty);
        const pendingReturnQty = qty(readinessItem?.pendingReturnQty);
        const netIssuedQty = Math.max(0, qty(req.requiredQty) - netRequired);

        return {
          ...req,
          readiness: readinessItem,
          netIssuedQty,
          replenishableQty:
            req.issueMode === 'staged'
              ? Math.max(0, netRequired - lineSideAvailable - pendingSupplyQty)
              : 0,
          returnableQty:
            req.issueMode === 'staged'
              ? Math.max(0, lineSideAvailable - pendingReturnQty)
              : 0,
        };
      }),
    [detail.materialRequisitions, readinessMap],
  );

  if (!hasBom) {
    return null;
  }

  const openExecuteModal = async (order: MaterialShortageSupplyOrder) => {
    setExecuteOrder(order);
    setExecuteDetail(null);
    setExecuteLoading(true);
    try {
      const fullOrder = await capabilities.getProductionSupplyOrder({
        id: order.id,
      });
      setExecuteDetail(fullOrder);
      executeForm.setFieldsValue({
        businessDate: dayjs(),
        items: (fullOrder.items ?? []).map((item) => ({
          itemId: item.id,
          actualQty: Math.max(0, qty(item.plannedQty) - qty(item.actualQty)),
          batchNo: item.batchNo ?? undefined,
        })),
      });
    } catch (error) {
      setExecuteOrder(null);
      capabilities.notify.error(capabilities.getErrorMessage(error, '加载供料单详情失败'));
    } finally {
      setExecuteLoading(false);
    }
  };

  const closeExecuteModal = () => {
    setExecuteOrder(null);
    setExecuteDetail(null);
    executeForm.resetFields();
  };

  const bannerActions: React.ReactNode[] = [];

  if (!readiness?.ready) {
    if (canRunMrp && capabilities.permissions.mrpListOrCalculate && planId) {
      bannerActions.push(
        <Button
          key="mrp"
          type="primary"
          onClick={() => capabilities.navigate(`/production/mrp?planId=${planId}`)}
        >
          运行 MRP
        </Button>,
      );
    }

    if (planId && capabilities.permissions.planView) {
      bannerActions.push(
        <Button
          key="view-plan"
          onClick={() => capabilities.navigate(`/production/plans/${planId}`)}
        >
          查看计划
        </Button>,
      );
    }

    if (!planId && canEditPlanRelation) {
      if (
        capabilities.permissions.workOrderUpdate &&
        capabilities.permissions.planList
      ) {
        bannerActions.push(
          <Button
            key="link-plan"
            type="primary"
            onClick={() => setLinkPlanOpen(true)}
            disabled={!detail.materialId}
          >
            关联计划
          </Button>,
        );
      }

      if (
        capabilities.permissions.workOrderUpdate &&
        capabilities.permissions.planCreate
      ) {
        bannerActions.push(
          <Button
            key="create-plan"
            onClick={() => setCreatePlanOpen(true)}
            disabled={!detail.materialId}
          >
            新增
          </Button>,
        );
      }
    }

    if (!planId && !canEditPlanRelation && capabilities.permissions.planList) {
      bannerActions.push(
        <Button
          key="plan-list"
          onClick={() => capabilities.navigate('/production/plans')}
        >
          去生产计划
        </Button>,
      );
    }
  }

  const requisitionColumns: ProColumns<MaterialReqRow>[] = [
    {
      title: '物料名称',
      dataIndex: ['material', 'name'],
      width: 180,
      ellipsis: true,
      render: (_, record) => record.material?.name || '—',
    },
    {
      title: '物料编码',
      dataIndex: ['material', 'code'],
      width: 140,
      render: (_, record) => record.material?.code || '—',
    },
    {
      title: '规格型号',
      dataIndex: ['material', 'spec'],
      width: 160,
      ellipsis: true,
      render: (_, record) => record.material?.spec ?? '—',
    },
    {
      title: '单位',
      dataIndex: ['material', 'unit'],
      width: 70,
      render: (_, record) =>
        capabilities.formatUnitLabel(record.material?.unit, unitLabelMap) || '—',
    },
    {
      title: '需求数量',
      dataIndex: 'requiredQty',
      width: 100,
      align: 'right',
      render: (_, record) => qty(record.requiredQty),
    },
    {
      title: '净已领',
      dataIndex: 'issuedQty',
      width: 100,
      align: 'right',
      render: (_, record) => qty(record.netIssuedQty),
    },
    {
      title: '主口径可用',
      width: 100,
      align: 'right',
      render: (_, record) =>
        record.readiness ? qty(record.readiness.sourceAvailable) : '—',
    },
    {
      title: '线边可用',
      width: 100,
      align: 'right',
      render: (_, record) =>
        record.issueMode === 'staged'
          ? record.readiness
            ? qty(record.readiness.lineSideAvailable)
            : '—'
          : '—',
    },
    {
      title: '待执行补料',
      width: 110,
      align: 'right',
      render: (_, record) =>
        record.issueMode === 'staged'
          ? record.readiness
            ? qty(record.readiness.pendingSupplyQty)
            : '—'
          : '—',
    },
    {
      title: '待执行退回',
      width: 110,
      align: 'right',
      render: (_, record) =>
        record.issueMode === 'staged'
          ? record.readiness
            ? qty(record.readiness.pendingReturnQty)
            : '—'
          : '—',
    },
    {
      title: '来源仓',
      dataIndex: ['warehouse', 'name'],
      width: 140,
      ellipsis: true,
      render: (_, record) => record.warehouse?.name || '—',
    },
    {
      title: '线边仓',
      dataIndex: ['lineSideWarehouse', 'name'],
      width: 140,
      ellipsis: true,
      render: (_, record) => record.lineSideWarehouse?.name || '—',
    },
    {
      title: '供料策略',
      dataIndex: 'issueMode',
      width: 110,
      render: (_, record) => (
        <Tag color={capabilities.statusColor(record.issueMode ?? 'direct', capabilities.statusMaps.issueMode)}>
          {capabilities.statusMaps.issueMode[record.issueMode ?? 'direct']?.text ?? '直接供料'}
        </Tag>
      ),
    },
    {
      title: '供应商版本/价格档',
      dataIndex: 'requiredGrade',
      width: 150,
      ellipsis: true,
      render: (_, record) => {
        const text = formatSourcingVersion(record, materialGradeLabelMap);
        return (
          <Typography.Text
            type={record.requiredGrade ? undefined : 'secondary'}
            title={text}
          >
            {text}
          </Typography.Text>
        );
      },
    },
    {
      title: '齐套判断',
      width: 120,
      render: (_, record) => {
        if (!record.readiness) {
          return <Tag>未检查</Tag>;
        }
        const meta = capabilities.statusMaps.materialReady[record.readiness.readyStatus];
        return (
          <Tag
            color={capabilities.statusColor(
              record.readiness.readyStatus,
              capabilities.statusMaps.materialReady,
            )}
          >
            {meta?.text ?? '未定义'}
          </Tag>
        );
      },
    },
    {
      title: '下一步',
      width: 240,
      ellipsis: true,
      render: (_, record) =>
        record.readiness ? (
          <Typography.Text
            type={record.readiness.nextActionHint ? undefined : 'secondary'}
          >
            {record.readiness.nextActionHint ?? '当前无需处理'}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">请先检查齐套</Typography.Text>
        ),
    },
    {
      title: '供料动作',
      key: 'supplyActions',
      dataIndex: '__supply_actions',
      valueType: 'option',
      width: 210,
      render: (_, record) => {
        if (record.issueMode !== 'staged') {
          return (
            <Typography.Text type="secondary">
              直接供料无需补退单
            </Typography.Text>
          );
        }
        if (!canCreateSupply) {
          return (
            <Typography.Text type="secondary">无补退单创建权限</Typography.Text>
          );
        }
        if (!canOperateSupply) {
          return (
            <Typography.Text type="secondary">
              工单已收尾，不能再创建补退单
            </Typography.Text>
          );
        }
        if (!record.readiness) {
          return (
            <Typography.Text type="secondary">请先检查齐套</Typography.Text>
          );
        }

        const actions: React.ReactNode[] = [];
        if (record.replenishableQty > 0) {
          actions.push(
            <Button
              key="replenish"
              size="small"
              type="link"
              onClick={() =>
                setCreateSupplyContext({ bizType: 'replenish', row: record })
              }
            >
              补料
            </Button>,
          );
        }
        if (record.returnableQty > 0) {
          actions.push(
            <Button
              key="return"
              size="small"
              type="link"
              onClick={() =>
                setCreateSupplyContext({ bizType: 'return', row: record })
              }
            >
              退回
            </Button>,
          );
        }

        return actions.length > 0 ? (
          <Space size={0} wrap>
            {actions}
          </Space>
        ) : (
          <Typography.Text type="secondary">当前无需补退</Typography.Text>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (_, record) =>
        qty(record.netIssuedQty) >= qty(record.requiredQty) ? (
          <Tag color="success">已满足</Tag>
        ) : (
          <Tag color="warning">不足</Tag>
        ),
    },
    {
      title: '需求调整',
      key: 'requirementActions',
      dataIndex: '__requirement_actions',
      valueType: 'option',
      width: 200,
      render: (_, record) => {
        const capabilities = record.lineCapabilities ?? {};
        const showChange =
          canAdjustMaterialReq &&
          canEditMaterialReq &&
          capabilities.canChangeQuantity;
        const showDelete =
          canAdjustMaterialReq &&
          canDeleteMaterialReq &&
          capabilities.canDelete;
        // 指定版本：固定行（不可定制/替代）禁用，与后端 override 校验一致
        const showOverride =
          canOverrideSourcing &&
          canMutateSourcing &&
          canAdjustLineSource(record);
        if (!showChange && !showDelete && !showOverride) {
          return canAdjustMaterialReq || canOverrideSourcing ? (
            <Typography.Text type="secondary">BOM 行固定</Typography.Text>
          ) : (
            <Typography.Text type="secondary">—</Typography.Text>
          );
        }
        return (
          <Space size={0} wrap>
            {showChange ? (
              <Button
                key="change-qty"
                size="small"
                type="link"
                onClick={() => setChangeQtyRow(record)}
              >
                改量
              </Button>
            ) : null}
            {showOverride ? (
              <Button
                key="override-source"
                size="small"
                type="link"
                onClick={() => setOverrideRow(record)}
              >
                指定版本
              </Button>
            ) : null}
            {showDelete ? (
              <Popconfirm
                key="delete-line"
                title="确认删除该需求行？"
                description="仅未领料的需求行可删除"
                okButtonProps={{ loading: deletingReqId === record.id }}
                onConfirm={() => handleDeleteReqLine(record)}
              >
                <Button size="small" type="link" danger>
                  删除
                </Button>
              </Popconfirm>
            ) : null}
          </Space>
        );
      },
    },
  ];

  const supplyColumns: ResizableTableProps<MaterialShortageSupplyOrder>['columns'] =
    [
      {
        title: '供料单号',
        dataIndex: 'supplyNo',
        width: 180,
      },
      {
        title: '供料类型',
        dataIndex: 'bizType',
        width: 100,
        render: (value: SupplyBizType) => (
          <Tag color={value === 'replenish' ? 'processing' : 'warning'}>
            {supplyBizTypeLabelMap[value] ?? value}
          </Tag>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 110,
        render: (value: string) => {
          const meta = capabilities.statusMaps.supplyStatus[value];
          return (
            <Tag color={capabilities.statusColor(value, capabilities.statusMaps.supplyStatus)}>
              {meta?.text ?? value}
            </Tag>
          );
        },
      },
      {
        title: '关联工序',
        width: 160,
        render: (_, record) =>
          record.operation
            ? `${record.operation.sequence}. ${record.operation.operationName}`
            : '整单通用',
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        ellipsis: true,
        render: (value) => value || '—',
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        width: 170,
        render: (value) => dayjs(value).format('YYYY-MM-DD HH:mm'),
      },
      {
        title: '操作',
        key: 'actions',
        dataIndex: '__actions',
        valueType: 'option',
        width: 260,
        render: (_, record) => {
          if (
            !canExecuteSupply &&
            !canCancelSupply &&
            !canReverseSupply &&
            !canPrintSupply &&
            !canViewSupplyPrintRecords
          ) {
            return '—';
          }
          const isExecutable =
            canExecuteSupply &&
            (record.availableActions ?? []).includes('execute');
          const isCancelable =
            canCancelSupply &&
            (record.availableActions ?? []).includes('cancel');
          const isReversible =
            canReverseSupply &&
            (record.availableActions ?? []).includes('reverse');
          return (
            <Space size={0}>
              {isExecutable ? (
                <Button
                  type="link"
                  size="small"
                  onClick={() => void openExecuteModal(record)}
                >
                  执行
                </Button>
              ) : null}
              {isCancelable ? (
                <Popconfirm
                  title="取消供料单"
                  description="取消后未执行部分的补料预留会释放，是否继续？"
                  onConfirm={async () => {
                    await capabilities.cancelProductionSupplyOrder({ id: record.id });
                    await refreshAfterMutation('供料单已取消');
                  }}
                >
                  <Button type="link" size="small" danger>
                    取消
                  </Button>
                </Popconfirm>
              ) : null}
              {isReversible ? (
                <Button
                  type="link"
                  size="small"
                  danger
                  onClick={() => {
                    setReverseSupplyOrder(record);
                  }}
                >
                  冲正
                </Button>
              ) : null}
              {!isExecutable &&
              !isCancelable &&
              !isReversible &&
              !canPrintSupply &&
              !canViewSupplyPrintRecords
                ? '—'
                : null}
              {canPrintSupply ? (
                <Button
                  type="link"
                  size="small"
                  onClick={() =>
                    void openPrintBatch([
                      {
                        businessType: 'production_supply',
                        businessId: record.id,
                        templateType: 'document_flow',
                      },
                    ])
                  }
                >
                  打印
                </Button>
              ) : null}
              {canViewSupplyPrintRecords ? (
                <Button
                  type="link"
                  size="small"
                  onClick={() =>
                    void openRecords({
                      businessType: 'production_supply',
                      businessId: record.id,
                      title: `供料单 ${record.supplyNo} 的打印记录`,
                    })
                  }
                >
                  打印记录
                </Button>
              ) : null}
            </Space>
          );
        },
      },
    ];

  const currentCreateMax =
    createSupplyContext?.bizType === 'replenish'
      ? createSupplyContext.row.replenishableQty
      : (createSupplyContext?.row.returnableQty ?? 0);

  return (
    <>
      <Card
        title="物料消耗"
        extra={
          <Space>
            {canResolveSourcing && canMutateSourcing ? (
              <Button loading={resolvingSourcing} onClick={() => void handleResolveSourcing()}>
                匹配未确定的供应来源
              </Button>
            ) : null}
            <Button
              loading={checking || supplyLoading}
              onClick={() =>
                void refreshSupplyContext({
                  showLoading: true,
                  silentError: false,
                })
              }
            >
              投入物料齐套检查
            </Button>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        {readiness ? (
          <Alert
            showIcon
            type={readiness.ready ? 'success' : 'warning'}
            message={
              readiness.ready
                ? '生产投入物料齐套'
                : readiness.message || `${shortageCount} 种生产投入物料不足`
            }
            description={
              readiness.ready
                ? '按本工单 BOM 投入物料及指定仓库可领用库存判断；本工单要生产的产出物料库存不参与齐套判断。'
                : shortageHint
            }
            action={
              bannerActions.length > 0 ? (
                <Space wrap>{bannerActions}</Space>
              ) : undefined
            }
            style={{ marginBottom: 16 }}
          />
        ) : null}

        {(requisitionRows.length ?? 0) > 0 ? (
          <ProTable<MaterialReqRow>
            rowKey="id"
            search={false}
            headerTitle={false}
            options={{
              reload: false,
              density: false,
              fullScreen: false,
              setting: true,
            }}
            size="small"
            pagination={false}
            scroll={{ x: 1980 }}
            columns={requisitionColumns}
            dataSource={requisitionRows}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无物料需求"
          />
        )}

        {canViewSupply ? (
          <div style={{ marginTop: 16 }}>
            <Space
              align="center"
              style={{
                width: '100%',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Typography.Text strong>线边补退料单</Typography.Text>
              <Typography.Text type="secondary">
                未完成状态会阻断工单完工、取消和结案
              </Typography.Text>
            </Space>
            {canPrintSupply ? (
              <Space style={{ marginBottom: 8 }}>
                <Button
                  type="link"
                  disabled={selectedSupplyIds.length === 0}
                  onClick={() => {
                    void openPrintBatch(
                      selectedSupplyIds.map((businessId) => ({
                        businessType: 'production_supply',
                        businessId,
                        templateType: 'document_flow',
                      })),
                    );
                    setSelectedSupplyIds([]);
                  }}
                >
                  批量打印（{selectedSupplyIds.length}）
                </Button>
              </Space>
            ) : null}
            <Table<MaterialShortageSupplyOrder>
              rowKey="id"
              size="small"
              loading={supplyLoading}
              rowSelection={
                canPrintSupply
                  ? {
                      preserveSelectedRowKeys: true,
                      selectedRowKeys: selectedSupplyIds,
                      onChange: (keys) =>
                        setSelectedSupplyIds(keys.map((key) => String(key))),
                    }
                  : undefined
              }
              pagination={{
                current: supplyPage,
                pageSize: INLINE_SUPPLY_PAGE_SIZE,
                total: supplyTotal,
                showSizeChanger: false,
                hideOnSinglePage: true,
                onChange: (page) => {
                  void loadSupplyOrders({ showLoading: true, page });
                },
              }}
              scroll={{ x: 980 }}
              columns={supplyColumns}
              dataSource={supplyOrders}
              expandable={{
                expandedRowRender: (record) => (
                  <Space
                    direction="vertical"
                    size={12}
                    style={{ width: '100%' }}
                  >
                    <DocumentCustomFieldPanel
                      objectType="production_supply"
                      objectId={record.id}
                      editable={canCreateSupply}
                    />
                    <ProductionSupplyItemsPanel orderId={record.id} capabilities={capabilities} />
                  </Space>
                ),
              }}
              locale={{ emptyText: '当前工单暂无线边补退料单' }}
            />
          </div>
        ) : null}
      </Card>

      {printJobActionNode}

      <ModalForm<LinkPlanFormValues>
        title="关联生产计划"
        open={linkPlanOpen}
        onOpenChange={setLinkPlanOpen}
        onFinish={async (values) => {
          await capabilities.updateWorkOrder({
            id: detail.id,
            planId: values.planId,
          });
          capabilities.notify.success('生产计划已关联');
          onSuccess();
          return true;
        }}
        modalProps={{ destroyOnHidden: true, width: 480 }}
      >
        <Typography.Text
          type="secondary"
          style={{ display: 'block', marginBottom: 16 }}
        >
          仅展示当前物料下仍可继续处理的生产计划，默认同客户优先。
        </Typography.Text>
        <ProFormSelect
          name="planId"
          {...capabilities.getAutoFieldHelpProps('生产计划')}
          rules={[{ required: true, message: '请选择生产计划' }]}
          showSearch
          debounceTime={300}
          request={async ({ keyWords }) => {
            const response = await capabilities.requestProductionPlanList({
              page: 1,
              pageSize: 50,
              keyword: keyWords,
              materialId: detail.materialId,
              statuses: LINKABLE_PLAN_STATUSES,
            });

            return sortPlans(
              response?.list ?? [],
              detail.customerId ?? detail.customer?.id,
            ).map((plan) => ({
              label: `${plan.planNo} · ${getPlanStatusLabel(plan.status, capabilities.statusMaps.plan)} · ${
                plan.planStartDate ?? '系统排程计算'
              }`,
              value: plan.id,
            }));
          }}
          fieldProps={{
            filterOption: false,
            placeholder: '默认显示前50条，可搜索更多',
          }}
        />
      </ModalForm>

      <ModalForm<CreatePlanFormValues>
        title="新增"
        open={createPlanOpen}
        onOpenChange={setCreatePlanOpen}
        dateFormatter="string"
        initialValues={createInitialValues}
        onFinish={async (values) => {
          if (!values.materialId) {
            capabilities.notify.warning('当前工单缺少产出物料档案，无法新建计划');
            return false;
          }

          const created = await capabilities.createProductionPlan({
            materialId: values.materialId,
            plannedQty: Number(values.plannedQty),
            planStartDate: values.planStartDate || undefined,
            planEndDate: values.planEndDate || undefined,
            dueDate: values.dueDate,
            priority: Number(values.priority ?? 5),
            customerId: values.customerId || undefined,
            bomHeaderId: values.bomHeaderId || undefined,
            routeId: values.routeId || undefined,
            description: values.description || undefined,
          });

          await capabilities.updateWorkOrder({
            id: detail.id,
            planId: created.id,
          });

          capabilities.notify.success('生产计划已创建并关联到当前工单');
          onSuccess();
          return true;
        }}
        modalProps={{
          destroyOnHidden: true,
          ...capabilities.scrollableModalProps,
          width: 560,
        }}
      >
        <Typography.Text
          type="secondary"
          style={{ display: 'block', marginBottom: 16 }}
        >
          将沿用当前工单的产品、数量与排期信息创建计划，创建成功后会自动回填关联。
        </Typography.Text>

        <RouteFieldResetter normalizeDatePickerValue={capabilities.normalizeDatePickerValue} />
        <ProFormText name="materialId" hidden />
        <ProFormText
          name="materialDisplay"
          {...capabilities.getAutoFieldHelpProps('产品物料档案')}
          readonly
          fieldProps={{ value: materialDisplay }}
        />
        <ProFormDigit
          name="plannedQty"
          {...capabilities.getAutoFieldHelpProps('计划数量')}
          min={1}
          rules={[{ required: true, message: '请输入计划数量' }]}
          fieldProps={{ precision: 0 }}
        />
        <ProFormDatePicker
          name="planStartDate"
          {...capabilities.getProductionFieldHelpProps('计划开始日期', 'planStartDate')}
          fieldProps={{
            style: { width: '100%' },
            placeholder: '不填则由系统排程计算',
          }}
        />
        <ProFormDatePicker
          name="planEndDate"
          {...capabilities.getProductionFieldHelpProps('计划结束日期', 'planEndDate')}
          fieldProps={{
            style: { width: '100%' },
            placeholder: '不填则由系统排程计算',
          }}
        />
        <ProFormSelect
          name="customerId"
          {...capabilities.getAutoFieldHelpProps('客户')}
          showSearch
          debounceTime={300}
          request={capabilities.requestCustomerOptions}
          fieldProps={{ filterOption: false, allowClear: true }}
        />
        <ProductionBomSelect
          saleOrderId={detail.plan?.saleOrderId}
          saleOrderItemId={detail.plan?.saleOrderItemId}
        />
        <ProFormSelect
          name="routeId"
          {...capabilities.getProductionFieldHelpProps('工艺路线', 'routeId')}
          showSearch
          dependencies={['materialId', 'customerId', 'planStartDate']}
          request={async ({ keyWords, materialId, planStartDate }) => {
            return capabilities.requestEffectiveRouteOptions({
              keyWords,
              materialId: materialId as string | undefined,
              routeSelectionDate: planStartDate,
            });
          }}
          fieldProps={{ filterOption: false, allowClear: true }}
        />
        <ProFormDigit
          name="priority"
          {...capabilities.getAutoFieldHelpProps('优先级')}
          min={1}
          max={10}
          fieldProps={{ precision: 0 }}
        />
        <ProFormDatePicker
          name="dueDate"
          {...capabilities.getProductionFieldHelpProps('交货期限', 'dueDate')}
          fieldProps={{ style: { width: '100%' } }}
        />
        <ProFormTextArea
          name="description"
          {...capabilities.getAutoFieldHelpProps('备注')}
          fieldProps={{ rows: 3 }}
        />
      </ModalForm>

      <ModalForm<CreateSupplyFormValues>
        key={
          createSupplyContext
            ? `${createSupplyContext.bizType}-${createSupplyContext.row.id}`
            : 'supply-create'
        }
        title={
          createSupplyContext
            ? `${supplyBizTypeLabelMap[createSupplyContext.bizType]}供料单`
            : '供料单'
        }
        open={!!createSupplyContext}
        onOpenChange={(open) => {
          if (!open) {
            setCreateSupplyContext(null);
          }
        }}
        modalProps={{ destroyOnHidden: true, width: 520 }}
        initialValues={{
          plannedQty: currentCreateMax > 0 ? currentCreateMax : undefined,
        }}
        onFinish={async (values) => {
          if (!createSupplyContext) return false;
          const itemPayload: MaterialShortageCustomFieldCarrier & { materialReqId: string; plannedQty: number; batchNo?: string } = {
            materialReqId: createSupplyContext.row.id,
            plannedQty: Number(values.plannedQty),
            batchNo: values.batchNo || undefined,
            ...(capabilities.buildCustomValuePayload(
              values.itemCustom,
              supplyItemCustomFieldSchema,
            ) ?? {}),
          };
          await capabilities.createProductionSupplyOrder({
            bizType: createSupplyContext.bizType,
            workOrderId: detail.id,
            items: [itemPayload],
            remarks: values.remarks || undefined,
          });
          setCreateSupplyContext(null);
          await refreshAfterMutation(
            `${
              supplyBizTypeLabelMap[createSupplyContext.bizType]
            }供料单已创建`,
          );
          return true;
        }}
      >
        {createSupplyContext ? (
          <div style={{ marginBottom: 16 }}>
            <Typography.Text strong style={{ display: 'block' }}>
              {createSupplyContext.row.material?.name}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ display: 'block' }}>
              来源仓：{createSupplyContext.row.warehouse?.name || '—'}，线边仓：
              {createSupplyContext.row.lineSideWarehouse?.name || '—'}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ display: 'block' }}>
              当前最多可
              {supplyBizTypeLabelMap[createSupplyContext.bizType]}：
              {currentCreateMax}{' '}
              {capabilities.formatUnitLabel(
                createSupplyContext.row.material?.unit,
                unitLabelMap,
              )}
            </Typography.Text>
          </div>
        ) : null}
        <ProFormDigit
          name="plannedQty"
          {...capabilities.getAutoFieldHelpProps('计划数量')}
          min={0.0001}
          rules={[
            { required: true, message: '请输入计划数量' },
            {
              validator: async (
                _: unknown,
                value: number | string | undefined,
              ) => {
                if (value == null || value === '') return;
                if (Number(value) > currentCreateMax) {
                  throw new Error(`数量不能超过当前允许值 ${currentCreateMax}`);
                }
              },
            },
          ]}
          fieldProps={{ precision: 4, style: { width: '100%' } }}
        />
        <ProFormText name="batchNo" {...capabilities.getAutoFieldHelpProps('投料批号')} />
        <Form.Item noStyle shouldUpdate>
          {() => (
            <Row gutter={12}>
              <DocumentLineCustomFieldFormItems
                schema={supplyItemCustomFieldSchema}
                namePrefix={['itemCustom']}
                colSpan={24}
              />
            </Row>
          )}
        </Form.Item>
        <ProFormTextArea
          name="remarks"
          {...capabilities.getAutoFieldHelpProps('备注')}
          fieldProps={{ rows: 3 }}
        />
      </ModalForm>

      <Modal
        destroyOnHidden
        title={
          executeOrder ? `执行供料单 ${executeOrder.supplyNo}` : '执行供料单'
        }
        open={!!executeOrder}
        width={640}
        confirmLoading={executeSubmitting}
        onCancel={closeExecuteModal}
        onOk={async () => {
          if (!executeDetail) return;
          try {
            const values = await executeForm.validateFields();
            const items =
              values.items
                ?.map((item) => ({
                  itemId: item.itemId,
                  actualQty: Number(item.actualQty ?? 0),
                  batchNo: item.batchNo || undefined,
                  ...(capabilities.buildCustomValuePayload(
                    item,
                    supplyItemCustomFieldSchema,
                  ) ?? {}),
                }))
                .filter((item) => item.actualQty > 0) ?? [];
            if (items.length === 0) {
              capabilities.notify.warning('请至少填写一条执行数量');
              return;
            }
            setExecuteSubmitting(true);
            await capabilities.executeProductionSupplyOrder({
              id: executeDetail.id,
              businessDate: capabilities.normalizeDateOnlyValue(values.businessDate),
              items,
            });
            closeExecuteModal();
            await refreshAfterMutation('供料单已执行');
          } finally {
            setExecuteSubmitting(false);
          }
        }}
      >
        {executeLoading || !executeDetail ? (
          <Typography.Text type="secondary">
            加载供料单明细中...
          </Typography.Text>
        ) : (
          <Form form={executeForm} layout="vertical">
            <StockBusinessDateField />
            {(executeDetail.items ?? []).map((item, index) => {
              const remainingQty = Math.max(
                0,
                qty(item.plannedQty) - qty(item.actualQty),
              );
              return (
                <div
                  key={item.id}
                  style={{
                    padding: 12,
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <Typography.Text strong style={{ display: 'block' }}>
                    {item.material?.name || item.material?.code || '-'}
                  </Typography.Text>
                  <Typography.Text
                    type="secondary"
                    style={{ display: 'block', marginBottom: 12 }}
                  >
                    来源仓：{item.sourceWarehouse?.name || '—'}，线边仓：
                    {item.lineSideWarehouse?.name || '—'}， 计划{' '}
                    {qty(item.plannedQty)}，已执行 {qty(item.actualQty)}，剩余{' '}
                    {remainingQty}
                  </Typography.Text>
                  <Form.Item name={['items', index, 'itemId']} hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item
                    {...capabilities.getAutoFieldHelpProps('本次执行数量')}
                    name={['items', index, 'actualQty']}
                    rules={[
                      {
                        validator: async (_, value) => {
                          if (value == null || value === '') return;
                          const actualQty = Number(value);
                          if (actualQty < 0) {
                            throw new Error('执行数量不能小于 0');
                          }
                          if (actualQty > remainingQty) {
                            throw new Error(
                              `执行数量不能超过剩余数量 ${remainingQty}`,
                            );
                          }
                        },
                      },
                    ]}
                  >
                    <Input
                      type="number"
                      min={0}
                      max={remainingQty}
                      step="0.0001"
                    />
                  </Form.Item>
                  <Form.Item
                    {...capabilities.getAutoFieldHelpProps('投料批号')}
                    name={['items', index, 'batchNo']}
                  >
                    <Input maxLength={128} />
                  </Form.Item>
                  <Row gutter={12}>
                    <DocumentLineCustomFieldFormItems
                      schema={supplyItemCustomFieldSchema}
                      namePrefix={['items', index]}
                      colSpan={24}
                    />
                  </Row>
                </div>
              );
            })}
          </Form>
        )}
      </Modal>

      <ModalForm<ReverseSupplyFormValues>
        key={`reverse-supply-${reverseSupplyOrder?.id ?? 'empty'}`}
        title={
          reverseSupplyOrder
            ? `冲正供料单 ${reverseSupplyOrder.supplyNo}`
            : '冲正供料单'
        }
        open={!!reverseSupplyOrder}
        modalProps={{ destroyOnHidden: true, okButtonProps: { danger: true } }}
        onOpenChange={(open) => {
          if (!open) setReverseSupplyOrder(null);
        }}
        initialValues={{ businessDate: dayjs() }}
        onFinish={async (values) => {
          if (!reverseSupplyOrder) return false;
          const reason = values.reason?.trim();
          if (!reason) {
            capabilities.notify.warning('请输入冲正原因');
            return false;
          }
          await capabilities.reverseProductionSupplyOrder({
            id: reverseSupplyOrder.id,
            businessDate: capabilities.normalizeDateOnlyValue(values.businessDate),
            reason,
          });
          setReverseSupplyOrder(null);
          await refreshAfterMutation('供料单已冲正，库存流水已生成反向事实');
          return true;
        }}
      >
        <Alert
          showIcon
          type="warning"
          message="冲正会生成反向库存流水"
          description="原供料单和原库存流水会保留。系统会校验目标库存可回退、来源仓可重新预留，无法回退时不会部分执行。"
          style={{ marginBottom: 16 }}
        />
        <StockBusinessDateField
          label="冲正业务日期"
          extra="按实际冲正日期记账；不能选择未来日期。"
        />
        <ProFormTextArea
          name="reason"
          label="冲正原因"
          rules={[
            { required: true, whitespace: true, message: '请输入冲正原因' },
          ]}
          fieldProps={{
            rows: 4,
            maxLength: 1000,
            showCount: true,
            placeholder: '请输入冲正原因',
          }}
        />
      </ModalForm>

      <ModalForm<{ requiredQty: number; reason?: string }>
        title="调整需求量"
        width={420}
        open={!!changeQtyRow}
        modalProps={{ destroyOnHidden: true }}
        onOpenChange={(open) => {
          if (!open) setChangeQtyRow(null);
        }}
        initialValues={
          changeQtyRow
            ? { requiredQty: Number(changeQtyRow.requiredQty ?? 0) }
            : undefined
        }
        onFinish={handleChangeReqQty}
      >
        <ProFormText
          name="materialDisplay"
          label="物料档案"
          readonly
          initialValue={
            changeQtyRow
              ? `${
                  changeQtyRow.material?.code
                    ? `${changeQtyRow.material.code} - `
                    : ''
                }${changeQtyRow.material?.name ?? ''}`
              : '—'
          }
        />
        <ProFormDigit
          name="requiredQty"
          label="调整后需求量"
          min={Number(changeQtyRow?.netIssuedQty ?? 0)}
          fieldProps={{ precision: 4 }}
          rules={[{ required: true, message: '请输入需求量' }]}
          extra={
            changeQtyRow && Number(changeQtyRow.netIssuedQty ?? 0) > 0
              ? `不能小于已净领料数量 ${Number(changeQtyRow.netIssuedQty ?? 0)}`
              : undefined
          }
        />
        <ProFormTextArea
          name="reason"
          label="调整原因"
          fieldProps={{ maxLength: 500, showCount: true }}
        />
      </ModalForm>

      <ModalForm<{ requiredPriceTierId: string; reason: string }>
        title="指定供应商价格档/版本"
        width={520}
        open={!!overrideRow}
        modalProps={{ destroyOnHidden: true }}
        onOpenChange={(open) => {
          if (!open) setOverrideRow(null);
        }}
        onFinish={handleOverrideSourcing}
      >
        <ProFormText
          name="materialDisplay"
          label="物料档案"
          readonly
          initialValue={
            overrideRow
              ? `${
                  overrideRow.material?.code
                    ? `${overrideRow.material.code} - `
                    : ''
                }${overrideRow.material?.name ?? ''}`
              : '—'
          }
        />
        <ProFormSelect
          name="requiredPriceTierId"
          {...capabilities.getAutoFieldHelpProps('供应商价格档')}
          rules={[{ required: true, message: '请选择供应商价格档' }]}
          showSearch
          debounceTime={300}
          dependencies={[]}
          request={async ({ keyWords }) => {
            if (!overrideRow?.materialId) return [];
            const response = await capabilities.listSupplierPriceTiers({
              page: 1,
              pageSize: 50,
              keyword: keyWords,
              materialId: overrideRow.materialId,
              supplierId: overrideRow.requiredSupplierId ?? undefined,
              status: 'active',
            });
            return (response?.list ?? []).map((tier) => {
              const gradeText = tier.grade
                ? (materialGradeLabelMap[tier.grade] ?? tier.grade)
                : '未分级';
              const supplierName = tier.supplier?.name ?? '';
              const supplierCode =
                tier.supplierModelCode ?? tier.supplierMaterialCode ?? '';
              return {
                label: [supplierName, gradeText, supplierCode]
                  .filter(Boolean)
                  .join(' · '),
                value: tier.id,
              };
            });
          }}
          fieldProps={{
            filterOption: false,
            placeholder: '默认显示前50条，可搜索更多',
          }}
        />
        <ProFormTextArea
          name="reason"
          label="覆盖原因"
          rules={[{ required: true, message: '请输入覆盖原因（必填留痕）' }]}
          fieldProps={{ maxLength: 500, showCount: true }}
        />
      </ModalForm>
    </>
  );
}
