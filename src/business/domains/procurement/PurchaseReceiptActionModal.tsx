import {
  ModalForm,
  ProFormDatePicker,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  type ProFormSelectProps,
} from '@ant-design/pro-components';
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type DocumentLineBatchOperations,
  type DocumentLineColumn,
  DocumentLineEditableTable,
  type DocumentLineRow,
} from '../documents/DocumentLineEditableTable';
import { WarehouseRemoteSelect } from '../inventory/WarehouseRemoteSelect';
import { GeneratePurchaseReceiptBatchNoButton } from './GeneratePurchaseReceiptBatchNoButton';
import { PurchaseReceiptCapacitySummary } from './PurchaseReceiptCapacitySummary';
import {
  requestStockLocationOptions,
  requestStockLocationPrecheck,
  StockLocationInlineSelector,
} from '../inventory/StockLocationSelectField';
import { formatUnitLabel } from '../../utils/qty-unit';
import type { UnitLabelMap } from '../../utils/qty-unit';
import type {
  PurchaseReceiptActionReceipt,
  PurchaseReceiptActionModalProps,
  PurchaseReceiptPreview,
  PurchaseReceiptSourcePreviewItem,
} from './purchase-receipt-action-modal-types';
import {
  applyDefaultWarehouseToInheritedLines,
  applyManualWarehousePatch,
  applyResolvedWarehouseToInheritedLines,
  formatReceiptQuantity as formatQty,
  getBatchReceiptWarehouseFamiliesByMaterialTypes,
  getEffectiveMaterialShelfLifeDays,
  getReceiptWarehouseFamiliesByMaterialType,
  normalizeReceiptDate as normalizeDateOnlyValue,
  requiresMaterialBatchNo,
  type DocumentLineWarehouseSource,
} from './purchase-receipt-action-modal-helpers';
import {
  findInvalidReceiptItem,
  getAcceptedReceiptQuantity,
  getDefaultReceiptQuantity,
  getReceiptSourceAllocation,
  selectSubmittedReceiptItems,
} from './purchase-receipt-action-modal.logic';

const SCROLLABLE_MODAL_PROPS = {
  centered: true,
  styles: {
    body: {
      maxHeight: 'calc(100vh - 200px)',
      overflowX: 'hidden' as const,
      overflowY: 'auto' as const,
    },
  },
};

type SourcePreviewItem = PurchaseReceiptSourcePreviewItem;

type ReceiptActionItem = DocumentLineRow & {
  purchaseOrderItemId: string;
  materialId: string;
  materialName: string;
  materialCode: string;
  materialSpec?: string;
  materialBaseType?: string;
  receiptUnit: string;
  recommendedQuantity: number;
  maxQuantity: number;
  arrivalReceiptQty: number;
  rejectedReceiptQty: number;
  incomingInspectionRequired: boolean;
  warehouseId?: string;
  warehouseName?: string;
  warehouseSource?: DocumentLineWarehouseSource;
  materialDefaultWarehouseId?: string;
  materialDefaultWarehouseName?: string;
  rejectReason?: string;
  batchNo?: string;
  supplierBatchNo?: string;
  productionDate?: string;
  expiryDate?: string;
  grade?: string;
  unitPrice?: number;
  remarks?: string;
  locationId?: string;
  storageLocation?: string;
  hasBatchTracking?: boolean;
  requiresBatchNo?: boolean;
  requiresShelfLifeDate?: boolean;
  orderedQty: number;
  receivedQty: number;
  outstandingQty: number;
  overReceiptPercent: number;
  baseUnit?: string | null;
};

type ReceiptActionFormValues = {
  defaultWarehouseId?: string;
  receiptDate?: string | dayjs.Dayjs;
  supplierDeliveryNo?: string;
  remarks?: string;
  items?: ReceiptActionItem[];
};

function createClientRequestId() {
  return globalThis.crypto?.randomUUID?.() ?? `purchase-receive-${Date.now()}`;
}

let receiptActionRowSequence = 0;

function createReceiptActionRowKey() {
  receiptActionRowSequence += 1;
  return `purchase-receipt-row-${receiptActionRowSequence}`;
}

function toActionItem(
  item: SourcePreviewItem,
  defaultWarehouseId?: string,
  defaultWarehouseName?: string,
): ReceiptActionItem {
  const source = item.purchaseOrderItem;
  const material = source.material;
  const incomingInspectionRequired = item.incomingInspectionRequired;
  const maxQuantity = Number(
    item.remainingReceiptCapacityReceiptQty ?? item.receivableReceiptQty ?? 0,
  );
  return {
    _key: createReceiptActionRowKey(),
    purchaseOrderItemId: source.id,
    materialId: source.materialId,
    materialName: material?.name ?? source.materialId,
    materialCode: material?.code ?? '-',
    materialSpec: material?.spec ?? undefined,
    materialBaseType: material?.baseType ?? undefined,
    receiptUnit:
      item.receiptUnit ||
      source.purchaseUnit ||
      source.baseUnit ||
      material?.unit ||
      '',
    recommendedQuantity: Number(item.receivableReceiptQty ?? 0),
    maxQuantity,
    arrivalReceiptQty: getDefaultReceiptQuantity(item.receivableReceiptQty),
    rejectedReceiptQty: 0,
    incomingInspectionRequired,
    warehouseId: incomingInspectionRequired
      ? undefined
      : (defaultWarehouseId ?? material?.defaultWarehouseId ?? undefined),
    warehouseName: incomingInspectionRequired
      ? undefined
      : defaultWarehouseId === undefined
        ? (material?.defaultWarehouse?.name ?? undefined)
        : defaultWarehouseName,
    warehouseSource: incomingInspectionRequired
      ? undefined
      : defaultWarehouseId
        ? 'header'
        : material?.defaultWarehouseId
          ? 'material'
          : undefined,
    materialDefaultWarehouseId: material?.defaultWarehouseId ?? undefined,
    materialDefaultWarehouseName: material?.defaultWarehouse?.name ?? undefined,
    grade: source.grade ?? undefined,
    unitPrice: source.unitPrice ?? undefined,
    remarks: source.remarks ?? undefined,
    hasBatchTracking: material?.hasBatchTracking ?? false,
    requiresBatchNo: requiresMaterialBatchNo(material),
    requiresShelfLifeDate: getEffectiveMaterialShelfLifeDays(material) > 0,
    orderedQty: Number(source.orderedQty ?? 0),
    receivedQty: Number(source.receivedQty ?? 0),
    outstandingQty: Number(item.outstandingQty ?? 0),
    overReceiptPercent: Number(source.overReceiptPercent ?? 0),
    baseUnit: source.baseUnit ?? material?.unit ?? null,
  };
}

function applyHeaderDefaultWarehouse(
  items: ReceiptActionItem[],
  defaultWarehouseId?: string,
): ReceiptActionItem[] {
  const immediateAcceptanceItems = items.filter(
    (item) => !item.incomingInspectionRequired,
  );
  const updatedItems = defaultWarehouseId
    ? applyDefaultWarehouseToInheritedLines(
        immediateAcceptanceItems,
        defaultWarehouseId,
        () => ({
          batchNo: '',
          productionDate: undefined,
          expiryDate: undefined,
          locationId: undefined,
          storageLocation: undefined,
        }),
      )
    : applyResolvedWarehouseToInheritedLines(
        immediateAcceptanceItems,
        (item) => ({
          warehouseId: item.materialDefaultWarehouseId,
          warehouseName: item.materialDefaultWarehouseName,
          warehouseSource: item.materialDefaultWarehouseId
            ? 'material'
            : undefined,
        }),
        () => ({
          batchNo: '',
          productionDate: undefined,
          expiryDate: undefined,
          locationId: undefined,
          storageLocation: undefined,
        }),
      );
  const updatedItemsByKey = new Map(
    updatedItems.map((item) => [item._key, item]),
  );
  return items.map((item) => updatedItemsByKey.get(item._key) ?? item);
}

/**
 * @sunxu-layer business
 * @sunxu-domain procurement
 * @sunxu-reason Presents reusable purchase receipt action modal behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function PurchaseReceiptActionModal<
  TReceipt extends PurchaseReceiptActionReceipt = PurchaseReceiptActionReceipt,
>({
  sourceItemIds,
  sourcePurchaseOrderId,
  onClose,
  onSuccess,
  onPrintReceipt,
  onOpenInspection,
  capabilities,
}: PurchaseReceiptActionModalProps<TReceipt>) {
  const [form] = Form.useForm<ReceiptActionFormValues>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [preview, setPreview] = useState<PurchaseReceiptPreview>();
  const requestIdRef = useRef<string | undefined>(undefined);
  const sourceKey = sourcePurchaseOrderId
    ? `purchase-order:${sourcePurchaseOrderId}`
    : (sourceItemIds?.join(',') ?? '');
  const items = Form.useWatch('items', { form, preserve: true }) ?? [];
  const defaultWarehouseId = Form.useWatch('defaultWarehouseId', form);
  const [showWarehouseConfigEntry, setShowWarehouseConfigEntry] = useState(false);
  const [warehouseOptionsRefreshVersion, setWarehouseOptionsRefreshVersion] = useState(0);
  const refreshWarehouseOptionsOnFocusRef = useRef(false);

  const unitLabelMap = capabilities.unitLabelMap;
  const materialGradeOptions = capabilities.materialGradeOptions;
  const materialGradeDictLoading = capabilities.materialGradeDictLoading;
  const materialGradeDictError = capabilities.materialGradeDictError;
  const retryMaterialGradeDictionary = capabilities.retryMaterialGradeDictionary;

  useEffect(() => {
    const refreshAfterConfig = () => {
      if (!refreshWarehouseOptionsOnFocusRef.current) return;
      refreshWarehouseOptionsOnFocusRef.current = false;
      setWarehouseOptionsRefreshVersion((version) => version + 1);
    };
    window.addEventListener('focus', refreshAfterConfig);
    return () => window.removeEventListener('focus', refreshAfterConfig);
  }, [form]);

  useEffect(() => {
    if (!sourceKey) {
      setPreview(undefined);
      form.resetFields();
      return;
    }
    let cancelled = false;
    setLoading(true);
    setPreview(undefined);
    requestIdRef.current = createClientRequestId();
    const previewRequest = sourcePurchaseOrderId
      ? capabilities.previewSource({
          purchaseOrderId: sourcePurchaseOrderId,
        }).then((result) => ({
          purchaseOrderIds: [result.purchaseOrderId],
          orderNos: [result.orderNo],
          supplierId: result.supplierId,
          supplier: result.supplier,
          items: result.items,
          warehouseRecommendation: result.warehouseRecommendation,
        }))
      : capabilities.previewBatchSource({
          ids: sourceItemIds ?? [],
        });
    void previewRequest
      .then((result) => {
        if (cancelled) return;
        setPreview(result);
        const recommendation = result.warehouseRecommendation;
        const recommendedWarehouseId =
          recommendation.status === 'resolved'
            ? (recommendation.warehouseId ?? undefined)
            : undefined;
        form.setFieldsValue({
          defaultWarehouseId: recommendedWarehouseId,
          receiptDate: dayjs(),
          items: result.items.map((item) =>
            toActionItem(
              item,
              recommendedWarehouseId,
              recommendation.warehouse?.name ?? undefined,
            ),
          ),
        });
      })
      .catch(() => {
        if (!cancelled) onClose();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [capabilities, form, onClose, sourceItemIds, sourceKey, sourcePurchaseOrderId]);

  const canSubmit = Boolean(preview && items.length > 0);
  const canExportPurchaseReceiptPrices = capabilities.permissions.canExportPrices;
  const hasImmediateAcceptanceItems = items.some(
    (item) => !item.incomingInspectionRequired,
  );
  const defaultWarehouseFamilies = useMemo(
    () =>
      getBatchReceiptWarehouseFamiliesByMaterialTypes(
        items
          .filter((item) => !item.incomingInspectionRequired)
          .map((item) => item.materialBaseType),
      ),
    [items],
  );
  const defaultWarehouseRequest = useMemo<NonNullable<ProFormSelectProps['request']>>(
    () => async (params) => {
      const keyWords = typeof params.keyWords === 'string' ? params.keyWords : undefined;
      const options = await capabilities.requestWarehouseOptions({
        keyWords,
        scope: 'nonLineSide',
        typeFamilies: defaultWarehouseFamilies,
      });
      setShowWarehouseConfigEntry(
        !keyWords?.trim() && !defaultWarehouseId && options.length === 0,
      );
      return options;
    },
    [capabilities, defaultWarehouseFamilies, defaultWarehouseId],
  );
  const columns = useMemo<DocumentLineColumn<ReceiptActionItem>[]>(
    () => [
      {
        key: 'materialName',
        title: '物料',
        width: 250,
        fixed: 'left',
        render: (item) => (
          <div>
            <Typography.Text strong>{item.materialName}</Typography.Text>
            <br />
            <Typography.Text type="secondary">
              {item.materialCode}
              {item.materialSpec ? ` · ${item.materialSpec}` : ''}
            </Typography.Text>
          </div>
        ),
      },
      {
        key: 'fulfillment',
        title: '订单履约',
        width: 150,
        render: (item) => (
          <PurchaseReceiptCapacitySummary
            orderedQty={item.orderedQty}
            receivedQty={item.receivedQty}
            outstandingQty={item.outstandingQty}
            baseUnit={item.baseUnit}
            unitLabelMap={unitLabelMap}
          />
        ),
      },
      {
        key: 'arrivalReceiptQty',
        title: '实际到货数量',
        width: 150,
        render: (item, _index, update) => {
          const sourceRowCount = items.filter(
            (current) =>
              current.purchaseOrderItemId === item.purchaseOrderItemId,
          ).length;
          const sourceAllocation = getReceiptSourceAllocation(
            items,
            item.purchaseOrderItemId,
          );
          const currentArrivalReceiptQty = Number(item.arrivalReceiptQty ?? 0);
          const sourceAllocationExcludingCurrent =
            sourceAllocation - currentArrivalReceiptQty;
          const arrivalMaxQuantity = Math.max(
            item.maxQuantity - sourceAllocationExcludingCurrent,
            0,
          );
          return (
            <Space orientation="vertical" size={2} style={{ width: '100%' }}>
              <InputNumber
                min={0}
                max={arrivalMaxQuantity}
                precision={4}
                placeholder="填写实际到货数量"
                style={{ width: '100%' }}
                value={item.arrivalReceiptQty}
                onChange={(value) =>
                  update({
                    arrivalReceiptQty: typeof value === 'number' ? value : 0,
                  })
                }
              />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                建议可收{' '}
                {formatQty(
                  item.recommendedQuantity,
                  formatUnitLabel(item.receiptUnit, unitLabelMap),
                )}
                ；最大{' '}
                {formatQty(
                  item.maxQuantity,
                  formatUnitLabel(item.receiptUnit, unitLabelMap),
                )}
                {item.overReceiptPercent > 0
                  ? `（含超收容差 ${item.overReceiptPercent}%）`
                  : ''}
                {sourceRowCount > 1
                  ? `；拆分合计 ${formatQty(
                      sourceAllocation,
                      formatUnitLabel(item.receiptUnit, unitLabelMap),
                    )}`
                  : ''}
              </Typography.Text>
            </Space>
          );
        },
      },
      {
        key: 'rejectedReceiptQty',
        title: '拒收数量',
        width: 130,
        render: (item, _index, update) => {
          const rejectedMaxQuantity = Math.max(
            Number(item.arrivalReceiptQty ?? 0),
            0,
          );
          return (
            <Space orientation="vertical" size={2} style={{ width: '100%' }}>
              <InputNumber
                min={0}
                max={rejectedMaxQuantity}
                precision={4}
                style={{ width: '100%' }}
                value={item.rejectedReceiptQty}
                onChange={(value) =>
                  update({
                    rejectedReceiptQty: typeof value === 'number' ? value : 0,
                  })
                }
              />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                不超过实际到货{' '}
                {formatQty(
                  rejectedMaxQuantity,
                  formatUnitLabel(item.receiptUnit, unitLabelMap),
                )}
              </Typography.Text>
            </Space>
          );
        },
      },
      {
        key: 'acceptedReceiptQty',
        title: '合格入库数量',
        width: 150,
        render: (item) => {
          const acceptedReceiptQty = getAcceptedReceiptQuantity(item);
          return item.incomingInspectionRequired ? (
            <Typography.Text type="secondary">待 IQC 处置</Typography.Text>
          ) : (
            <Typography.Text>
              {formatQty(
                acceptedReceiptQty ?? 0,
                formatUnitLabel(item.receiptUnit, unitLabelMap),
              )}
            </Typography.Text>
          );
        },
      },
      {
        key: 'warehouseId',
        title: '合格入库仓',
        width: 180,
        render: (item, _index, update) =>
          item.incomingInspectionRequired ? (
            <Typography.Text type="secondary">待质量放行后确定</Typography.Text>
          ) : (
            <WarehouseRemoteSelect
              value={item.warehouseId}
              currentOption={{
                value: item.warehouseId,
                label: item.warehouseName,
              }}
              typeFamilies={getReceiptWarehouseFamiliesByMaterialType(
                item.materialBaseType,
              )}
              placeholder="请选择合格入库仓"
              onChange={(warehouseId, warehouseName) =>
                update(
                  applyManualWarehousePatch(item, {
                    warehouseId,
                    warehouseName,
                    // 选回表头默认仓后恢复继承，后续表头修改仍会带动该行。
                    warehouseSource:
                      defaultWarehouseId && warehouseId === defaultWarehouseId
                        ? 'header'
                        : 'manual',
                  }),
                )
              }
            />
          ),
      },
      {
        key: 'locationId',
        title: '合格入库仓位',
        width: 220,
        render: (item, _index, update) =>
          item.incomingInspectionRequired ? (
            <Typography.Text type="secondary">待质量放行后确定</Typography.Text>
          ) : (
            <StockLocationInlineSelector
              capabilities={capabilities.stockLocation}
              label="合格入库仓位"
              action="stock/in"
              warehouseId={item.warehouseId}
              materialId={item.materialId}
              batchNo={item.batchNo}
              value={item.locationId}
              storageLocation={item.storageLocation}
              onChange={update}
            />
          ),
      },
      {
        key: 'batchNo',
        title: '系统批号',
        width: 160,
        render: (item, _index, update) => (
          <Space orientation="vertical" size={4} style={{ width: '100%' }}>
            {item.requiresBatchNo &&
            item.arrivalReceiptQty > item.rejectedReceiptQty ? (
              <GeneratePurchaseReceiptBatchNoButton
                materialId={item.materialId}
                batchNo={item.batchNo}
                onGenerated={(batchNo) => update({ batchNo })}
              />
            ) : null}
            <Input
              placeholder={item.requiresBatchNo ? '必填' : '可选'}
              value={item.batchNo}
              onChange={(event) =>
                update({
                  batchNo: event.target.value,
                  productionDate: undefined,
                  expiryDate: undefined,
                })
              }
            />
          </Space>
        ),
      },
      {
        key: 'supplierBatchNo',
        title: '供应商批号',
        width: 160,
        render: (item, _index, update) => (
          <Input
            allowClear
            placeholder="可选"
            value={item.supplierBatchNo}
            onChange={(event) =>
              update({ supplierBatchNo: event.target.value || undefined })
            }
          />
        ),
      },
      {
        key: 'batchDates',
        title: '批次日期',
        width: 250,
        render: (item, _index, update) =>
          item.requiresBatchNo ? (
            <Space orientation="vertical" size={4} style={{ width: '100%' }}>
              <DatePicker
                allowClear
                placeholder="生产日期（可选）"
                style={{ width: '100%' }}
                value={item.productionDate ? dayjs(item.productionDate) : null}
                onChange={(value) =>
                  update({
                    productionDate: value?.format('YYYY-MM-DD') || undefined,
                  })
                }
              />
              <DatePicker
                allowClear
                placeholder="有效期至（有标签时填写）"
                style={{ width: '100%' }}
                value={item.expiryDate ? dayjs(item.expiryDate) : null}
                onChange={(value) =>
                  update({
                    expiryDate: value?.format('YYYY-MM-DD') || undefined,
                  })
                }
              />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                保质期物料至少填写有效期或生产日期；供应商标签有效期优先
              </Typography.Text>
            </Space>
          ) : (
            <Typography.Text type="secondary">-</Typography.Text>
          ),
      },
      {
        key: 'grade',
        title: capabilities.renderConfigEntryLabel({
          target: 'dictionary',
          typeCode: 'material_grade',
          children: '入库品质等级',
          show:
            !materialGradeDictLoading &&
            !materialGradeDictError &&
            materialGradeOptions.length === 0 &&
            items.some((item) => !item.grade),
          onOpen: () =>
            window.addEventListener('focus', retryMaterialGradeDictionary, {
              once: true,
            }),
        }),
        width: 150,
        render: (item, _index, update) => (
          <Select
            allowClear
            options={materialGradeOptions}
            placeholder="请选择"
            style={{ width: '100%' }}
            value={item.grade}
            onChange={(grade) => update({ grade: grade || undefined })}
          />
        ),
      },
      ...(canExportPurchaseReceiptPrices
        ? [
            {
              key: 'unitPrice',
              title: '单价',
              width: 130,
              align: 'right' as const,
              render: (
                item: ReceiptActionItem,
                _index: number,
                update: (patch: Partial<ReceiptActionItem>) => void,
              ) => (
                <InputNumber
                  min={0}
                  precision={4}
                  style={{ width: '100%' }}
                  value={item.unitPrice}
                  onChange={(value) =>
                    update({
                      unitPrice: typeof value === 'number' ? value : undefined,
                    })
                  }
                />
              ),
            } satisfies DocumentLineColumn<ReceiptActionItem>,
          ]
        : []),
      {
        key: 'remarks',
        title: '行备注',
        width: 180,
        render: (item, _index, update) => (
          <Input
            allowClear
            maxLength={500}
            placeholder="可选"
            value={item.remarks}
            onChange={(event) =>
              update({ remarks: event.target.value || undefined })
            }
          />
        ),
      },
      {
        key: 'rejectReason',
        title: '拒收原因',
        width: 180,
        render: (item, _index, update) => (
          <Input
            allowClear
            placeholder="有拒收时填写"
            value={item.rejectReason}
            onChange={(event) =>
              update({ rejectReason: event.target.value || undefined })
            }
          />
        ),
      },
    ],
    [
      canExportPurchaseReceiptPrices,
      defaultWarehouseId,
      items,
      materialGradeDictError,
      materialGradeDictLoading,
      materialGradeOptions,
      retryMaterialGradeDictionary,
      unitLabelMap,
    ],
  );
  const batchOperations = useMemo<
    DocumentLineBatchOperations<ReceiptActionItem>
  >(
    () => ({
      enabled: true,
      allowCopy: true,
      fields: [
        {
          key: 'arrivalReceiptQty',
          label: '实际到货数量',
          type: 'number',
          min: 0,
          precision: 4,
          patch: (arrivalReceiptQty) => ({
            arrivalReceiptQty: arrivalReceiptQty ?? 0,
          }),
        },
        {
          key: 'locationId',
          label: '入库仓位',
          type: 'select',
          request: async ({ keyWords }, values) => {
            const warehouseId = values.warehouseId;
            if (typeof warehouseId !== 'string' || !warehouseId) return [];
            return requestStockLocationOptions(capabilities.stockLocation, {
              warehouseId,
              keyWords,
            });
          },
          patch: (locationId) => ({
            locationId,
            storageLocation: undefined,
          }),
        },
        {
          key: 'batchNo',
          label: '系统批号',
          type: 'text',
          maxLength: 128,
          patch: (batchNo) => ({ batchNo }),
        },
        {
          key: 'supplierBatchNo',
          label: '供应商批号',
          type: 'text',
          maxLength: 128,
          patch: (supplierBatchNo) => ({ supplierBatchNo }),
        },
        {
          key: 'grade',
          label: '入库品质等级',
          type: 'select',
          options: materialGradeOptions,
          patch: (grade) => ({ grade }),
        },
        ...(canExportPurchaseReceiptPrices
          ? [
              {
                key: 'unitPrice',
                label: '单价',
                type: 'number' as const,
                min: 0,
                precision: 4,
                patch: (unitPrice: number | undefined) => ({ unitPrice }),
              },
            ]
          : []),
        {
          key: 'remarks',
          label: '行备注',
          type: 'text',
          maxLength: 500,
          patch: (remarks) => ({ remarks }),
        },
      ],
      mapBatchPatch: (row, patch) => {
        if (
          row.incomingInspectionRequired &&
          ('warehouseId' in patch || 'locationId' in patch)
        ) {
          return row;
        }
        return applyManualWarehousePatch(row, patch);
      },
      canRemoveRows: (rowsToRemove, allRows) => {
        const removedRowKeys = new Set(rowsToRemove.map((item) => item._key));
        return allRows.every((row) => {
          if (!removedRowKeys.has(row._key)) return true;
          return allRows.some(
            (candidate) =>
              candidate.purchaseOrderItemId === row.purchaseOrderItemId &&
              !removedRowKeys.has(candidate._key),
          );
        });
      },
    }),
    [canExportPurchaseReceiptPrices, capabilities.stockLocation, materialGradeOptions],
  );

  return (
    <ModalForm<ReceiptActionFormValues>
      title="采购收货"
      open={Boolean(sourcePurchaseOrderId || sourceItemIds?.length)}
      form={form}
      width={1180}
      loading={loading || submitting}
      modalProps={{
        destroyOnHidden: true,
        ...SCROLLABLE_MODAL_PROPS,
        mask: { closable: false },
      }}
      onOpenChange={(open) => {
        if (!open && !submittingRef.current) onClose();
      }}
      submitter={{
        searchConfig: { submitText: '确认收货' },
        submitButtonProps: {
          disabled: !canSubmit || submitting,
          loading: submitting,
        },
      }}
      onFinish={async (values) => {
        if (submittingRef.current) return false;
        submittingRef.current = true;
        setSubmitting(true);
        try {
          if (!preview || (!sourceItemIds?.length && !sourcePurchaseOrderId)) {
            return false;
          }
          // 明细表直接写入 Form store，并非已注册的 Form.Item；ModalForm 的
          // onFinish 参数只包含已注册字段，因此必须从 store 读取当前明细。
          const receiptItems: ReceiptActionItem[] =
            form.getFieldValue('items') ?? [];
          const invalidItem = findInvalidReceiptItem(receiptItems);
          if (invalidItem) {
            capabilities.notifyWarning(
              invalidItem.reason === 'source_capacity_exceeded'
                ? '同一采购明细的拆分行实际到货数量不能超过最大可收数量'
                : invalidItem.reason === 'rejected_quantity_exceeds_arrival'
                  ? '拒收数量不能超过实际到货数量'
                  : invalidItem.reason === 'reject_reason_required'
                    ? '请填写拒收原因'
                    : invalidItem.reason === 'batch_required'
                      ? '按批号追溯的物料必须填写系统批号'
                      : invalidItem.reason === 'batch_date_required'
                        ? '保质期物料请填写生产日期或有效期'
                        : invalidItem.reason === 'warehouse_required'
                          ? '有合格入库数量的明细必须选择合格入库仓'
                          : invalidItem.reason === 'invalid_quantity'
                            ? '请输入有效的实际到货或拒收数量'
                            : '实际到货数量和拒收数量不能为负数',
            );
            return false;
          }
          const submittedItems = selectSubmittedReceiptItems(receiptItems);
          if (submittedItems.length === 0) {
            capabilities.notifyWarning('请至少填写一行实际到货或拒收数量');
            return false;
          }
          if (capabilities.permissions.canWarehouseLocations) {
            try {
              const warehouseIds = [
                ...new Set(
                  submittedItems
                    .filter(
                      (item) =>
                        (getAcceptedReceiptQuantity(item) ?? 0) > 0 &&
                        item.warehouseId,
                    )
                    .map((item) => item.warehouseId)
                    .filter((warehouseId): warehouseId is string => typeof warehouseId === 'string'),
                ),
              ];
              const prechecks = await Promise.all(
                warehouseIds.map(async (warehouseId) => ({
                  warehouseId,
                  result: await requestStockLocationPrecheck(
                    'stock/in',
                    warehouseId,
                    capabilities.stockLocation,
                  ),
                })),
              );
              for (const {
                warehouseId,
                result: locationPrecheck,
              } of prechecks) {
                if (!locationPrecheck.locationRequired) continue;
                const missingLocationItem = submittedItems.find(
                  (item) =>
                    (getAcceptedReceiptQuantity(item) ?? 0) > 0 &&
                    item.warehouseId === warehouseId &&
                    !item.locationId,
                );
                if (missingLocationItem) {
                  capabilities.notifyWarning('严格仓位仓库中，合格入库明细必须选择仓位');
                  return false;
                }
              }
            } catch (error: unknown) {
              capabilities.notifyError(
                error instanceof Error
                  ? error.message
                  : '仓位策略读取失败，请稍后重试',
              );
              return false;
            }
          }

          const result = await capabilities.receive({
            purchaseOrderId:
              preview.purchaseOrderIds.length === 1
                ? preview.purchaseOrderIds[0]
                : undefined,
            supplierId: preview.supplierId,
            receiptDate: normalizeDateOnlyValue(values.receiptDate),
            supplierDeliveryNo: values.supplierDeliveryNo?.trim() || undefined,
            remarks: values.remarks,
            clientRequestId: requestIdRef.current,
            items: submittedItems.map((item) => ({
              purchaseOrderItemId: item.purchaseOrderItemId,
              materialId: item.materialId,
              arrivalReceiptQty: item.arrivalReceiptQty,
              rejectedReceiptQty: item.rejectedReceiptQty || undefined,
              rejectReason: item.rejectReason?.trim() || undefined,
              receiptUnit: item.receiptUnit,
              warehouseId: item.incomingInspectionRequired
                ? undefined
                : item.warehouseId,
              batchNo: item.batchNo?.trim() || undefined,
              productionDate: normalizeDateOnlyValue(item.productionDate),
              expiryDate: normalizeDateOnlyValue(item.expiryDate),
              grade: item.grade?.trim() || undefined,
              supplierBatchNo: item.supplierBatchNo?.trim() || undefined,
              unitPrice: canExportPurchaseReceiptPrices
                ? item.unitPrice
                : undefined,
              remarks: item.remarks?.trim() || undefined,
              locationId: item.incomingInspectionRequired
                ? undefined
                : item.locationId,
              storageLocation: item.incomingInspectionRequired
                ? undefined
                : item.storageLocation?.trim() || undefined,
            })),
          });
          const successText =
            result.outcome === 'received'
              ? '已采购收货并入库'
              : result.outcome === 'pending_approval'
                ? '已记录采购收货，待审批后入库'
                : '已记录采购收货，待来料检验完成后入库';
          for (const warning of result.warnings) {
            capabilities.notifyWarning(warning);
          }
          capabilities.notifySuccess(
            onPrintReceipt ? (
              <Space size={4}>
                <span>{successText}</span>
                <Button
                  htmlType="button"
                  size="small"
                  type="link"
                  onClick={() => onPrintReceipt(result.receipt.id)}
                >
                  打印采购入库单
                </Button>
              </Space>
            ) : (
              successText
            ),
            onPrintReceipt ? 6 : 3,
          );
          onSuccess(result.receipt);
          if (result.outcome === 'pending_quality') {
            const inspectionId = capabilities.permissions.canViewInspection
              ? result.receipt.items.find((item) => item.qualityInspection?.id)
                  ?.qualityInspection?.id
              : undefined;
            if (inspectionId) {
              onOpenInspection?.(inspectionId);
            }
          }
          return true;
        } finally {
          submittingRef.current = false;
          setSubmitting(false);
        }
      }}
    >
      {hasImmediateAcceptanceItems &&
      preview?.warehouseRecommendation.status !== 'resolved' ? (
        <Alert
          showIcon
          type="warning"
          style={{ marginBottom: 16 }}
          message="未带出默认入库仓"
          description={`${preview?.warehouseRecommendation.reason ?? ''}请在每个有合格入库数量的明细选择合格入库仓。`}
        />
      ) : null}
      <Space wrap style={{ width: '100%', marginBottom: 12 }}>
        {hasImmediateAcceptanceItems ? (
          <ProFormSelect
            name="defaultWarehouseId"
            label={capabilities.renderConfigEntryLabel({
              target: 'warehouse',
              children: '默认合格入库仓',
              show: showWarehouseConfigEntry,
              onOpen: () => {
                refreshWarehouseOptionsOnFocusRef.current = true;
              },
            })}
            width="md"
            extra="修改后会立即带入仍继承默认值的明细；行内选回此仓即可恢复继承。"
            request={defaultWarehouseRequest}
            params={{ configEntryRefreshVersion: warehouseOptionsRefreshVersion }}
            showSearch
            debounceTime={300}
            fieldProps={{
              filterOption: false,
              onChange: (value) => {
                const nextWarehouseId =
                  typeof value === 'string' ? value : undefined;
                form.setFieldValue(
                  'items',
                  applyHeaderDefaultWarehouse(items, nextWarehouseId),
                );
              },
            }}
          />
        ) : null}
        <ProFormDatePicker
          name="receiptDate"
          label="收货日期"
          fieldProps={{
            format: 'YYYY-MM-DD',
            allowClear: false,
            disabledDate: (date: Dayjs) => date.isAfter(dayjs(), 'day'),
          }}
          rules={[{ required: true, message: '请选择收货日期' }]}
        />
        <ProFormText
          name="supplierDeliveryNo"
          label="供应商送货单号"
          width="md"
          fieldProps={{
            allowClear: true,
            maxLength: 128,
            placeholder: '按供应商纸质/电子送货单填写',
          }}
        />
      </Space>
      <Typography.Text
        type="secondary"
        style={{ display: 'block', marginBottom: 8 }}
      >
        供应商：{preview?.supplier?.name ?? '-'}；来源订单：
        {preview?.orderNos?.join('、') ?? '-'}
      </Typography.Text>
      <Alert
        showIcon
        type="info"
        style={{ marginBottom: 12 }}
        message="可合并同一供应商、相同付款条件的订单明细"
        description="实际到货数量和拒收数量必须按到货实物填写；非 IQC 明细的合格入库数量自动计算，命中 IQC 的合格入库数量待质检处置后产生。系统批号、合格入库仓和仓位以明细行为准，未填写实际到货数量的行不会提交。"
      />
      <DocumentLineEditableTable<ReceiptActionItem>
        rows={items}
        onRowsChange={(nextItems) => form.setFieldValue('items', nextItems)}
        columns={columns}
        createRow={() => ({
          _key: createReceiptActionRowKey(),
          purchaseOrderItemId: '',
          materialId: '',
          materialName: '',
          materialCode: '',
          receiptUnit: '',
          recommendedQuantity: 0,
          maxQuantity: 0,
          arrivalReceiptQty: 0,
          rejectedReceiptQty: 0,
          incomingInspectionRequired: false,
          orderedQty: 0,
          receivedQty: 0,
          outstandingQty: 0,
          overReceiptPercent: 0,
        })}
        cloneRow={(item) => ({
          ...item,
          _key: createReceiptActionRowKey(),
          arrivalReceiptQty: 0,
          rejectedReceiptQty: 0,
          rejectReason: undefined,
          batchNo: undefined,
          supplierBatchNo: undefined,
          productionDate: undefined,
          expiryDate: undefined,
          locationId: undefined,
          storageLocation: undefined,
        })}
        disableAdd
        disableCopy={false}
        hideAddButton
        minRows={0}
        batchOperations={batchOperations}
        scrollX={2300}
      />
      <ProFormTextArea
        name="remarks"
        label="备注"
        fieldProps={{ rows: 2, maxLength: 500, showCount: true }}
      />
    </ModalForm>
  );
}
