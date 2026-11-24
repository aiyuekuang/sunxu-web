import { SaveOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  DatePicker,
  InputNumber,
  Space,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { RemoteSelect } from '../../components/RemoteSelect';
import { formatUnitLabel } from '../utils/qty-unit';
import { DocumentModalForm } from './DocumentModalForm';
import { ResizableTable as Table } from './ResizableTable';
import type {
  ConvertToOrderDrawerProps,
  ConvertToOrderResolvedItem,
  ConvertToOrderRequisitionItem,
  ConvertToOrderSelectionItem,
  ConvertToOrderUnresolvedItem,
} from './convert-to-order-drawer-types';

type ConvertToOrderFormValues = Record<string, never>;

const SOURCE_LABEL: Record<string, string> = {
  selected: '本次指定',
  requisition: '申请行指定',
  material_default: '物料默认',
  material_supplier_default: '供应商物料默认',
  single_material_supplier: '唯一供应商',
};

function getRemainingQty(item: ConvertToOrderRequisitionItem): number {
  return Math.max(
    0,
    Number(item.requiredQty ?? 0) - Number(item.orderedQty ?? 0),
  );
}

function buildInitialQuantities(
  items: readonly ConvertToOrderRequisitionItem[] | null | undefined,
): Record<string, number> {
  return Object.fromEntries(
    (items ?? []).map((item) => [item.id, getRemainingQty(item)]),
  );
}

function toDatePickerValue(value: unknown) {
  if (typeof value !== 'string' || !value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

/** @sunxu-component mes-specific @sunxu-domain purchase requisition conversion @sunxu-reason Preserves sourcing preview, date completion, per-line quantity and supplier override workflow while the host supplies MES APIs, notifications and field guidance. */
export function ConvertToOrderDrawer({
  open,
  onOpenChange,
  requisition,
  onSuccess,
  onRequisitionUpdated,
  capabilities,
}: ConvertToOrderDrawerProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [arrivalDateDrafts, setArrivalDateDrafts] = useState<
    Record<string, string | undefined>
  >({});
  const [arrivalSaving, setArrivalSaving] = useState(false);
  const [supplierOverrides, setSupplierOverrides] = useState<
    Record<string, string | undefined>
  >({});
  const [supplierOptions, setSupplierOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [preview, setPreview] = useState<Awaited<
    ReturnType<typeof capabilities.preview>
  > | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuantities(buildInitialQuantities(requisition.items));
    setArrivalDateDrafts({});
    setSupplierOverrides({});
    setPreview(null);
  }, [open, requisition.id]);

  const remainingItems = useMemo(
    () => (requisition.items ?? []).filter((item) => getRemainingQty(item) > 0),
    [requisition],
  );

  const selectedItems = useMemo<ConvertToOrderSelectionItem[]>(
    () =>
      remainingItems
        .map((item) => ({
          requisitionItemId: item.id,
          orderedQty: Number(quantities[item.id] ?? 0),
          supplierId: supplierOverrides[item.id],
        }))
        .filter((item) => item.orderedQty > 0),
    [quantities, remainingItems, supplierOverrides],
  );

  const selectedMissingArrivalItems = useMemo(
    () =>
      remainingItems.filter(
        (item) =>
          Number(quantities[item.id] ?? 0) > 0 && !item.expectedArrivalDate,
      ),
    [quantities, remainingItems],
  );

  const missingArrivalDraftsComplete = useMemo(
    () =>
      selectedMissingArrivalItems.every((item) =>
        Boolean(arrivalDateDrafts[item.id]),
      ),
    [arrivalDateDrafts, selectedMissingArrivalItems],
  );

  const resolvedMap = useMemo(() => {
    const map = new Map<string, ConvertToOrderResolvedItem>();
    for (const group of preview?.groups ?? []) {
      for (const item of group.items ?? []) map.set(item.requisitionItemId, item);
    }
    return map;
  }, [preview]);

  const unresolvedMap = useMemo(() => {
    const map = new Map<string, ConvertToOrderUnresolvedItem>();
    for (const item of preview?.unresolvedItems ?? []) {
      map.set(item.requisitionItemId, item);
    }
    return map;
  }, [preview]);

  const loadSupplierOptions = async (keyword?: string) => {
    setSupplierOptions(await capabilities.requestSupplierOptions(keyword));
  };

  const handleSaveArrivalDates = async () => {
    if (selectedMissingArrivalItems.length === 0) return;
    if (!missingArrivalDraftsComplete) {
      capabilities.notifyWarning('请先补齐选中明细的期望到货日期');
      return;
    }

    setArrivalSaving(true);
    try {
      const nextRequisition = await capabilities.updateArrivalDates({
        id: requisition.id,
        items: selectedMissingArrivalItems.map((item) => ({
          requisitionItemId: item.id,
          expectedArrivalDate: arrivalDateDrafts[item.id] ?? '',
        })),
      });
      setArrivalDateDrafts({});
      onRequisitionUpdated?.(nextRequisition);
      capabilities.notifySuccess('到货日期已保存');
    } finally {
      setArrivalSaving(false);
    }
  };

  useEffect(() => {
    if (
      !open ||
      selectedItems.length === 0 ||
      selectedMissingArrivalItems.length > 0
    ) {
      setPreview(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const nextPreview = await capabilities.preview({
          id: requisition.id,
          items: selectedItems,
        });
        if (!cancelled) setPreview(nextPreview);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    capabilities,
    open,
    requisition.id,
    selectedItems,
    selectedMissingArrivalItems.length,
  ]);

  return (
    <DocumentModalForm<ConvertToOrderFormValues>
      title={`转采购订单 · ${requisition.prNo}`}
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
      submitter={{ searchConfig: { submitText: '确认转单' } }}
      onFinish={async () => {
        if (selectedItems.length === 0) {
          capabilities.notifyWarning('请至少选择一条转单明细');
          return false;
        }
        if (selectedMissingArrivalItems.length > 0) {
          capabilities.notifyWarning('请先补齐选中明细的期望到货日期');
          return false;
        }

        const result = await capabilities.convert({
          id: requisition.id,
          items: selectedItems,
          generateResolvedOnly: true,
        });
        const orders = result.orders ?? [];
        if (orders.length === 0) {
          capabilities.notifyWarning('没有可生成采购订单的明细，请先指定供应商');
          return false;
        }
        capabilities.notifySuccess(
          `转单成功 已生成 ${orders.length} 张采购订单${
            result.unresolvedCount ? `，${result.unresolvedCount} 条待处理` : ''
          }`,
        );
        onSuccess(orders);
        return true;
      }}
    >
      <div className="document-form-layout">
        <section className="document-form-section">
          <Space style={{ marginBottom: 16 }}>
            <Typography.Text type="secondary">
              仅支持转本次仍未下单的剩余数量；数量留空或填 0 表示本次不转。
            </Typography.Text>
            <Button
              htmlType="button"
              type="link"
              onClick={() => setQuantities(buildInitialQuantities(requisition.items))}
            >
              恢复全部剩余数量
            </Button>
          </Space>

          {preview && (
            <Alert
              style={{ marginBottom: 16 }}
              type={preview.unresolvedCount ? 'warning' : 'success'}
              showIcon
              message={`预计生成 ${preview.orderCount} 张采购订单，已确定 ${preview.resolvedCount} 行，待处理 ${preview.unresolvedCount} 行`}
              description={
                preview.unresolvedCount
                  ? '待处理行不会阻塞已确定供应商的明细生成采购订单；可在下方行内指定本次供应商后再次预览。'
                  : '所有选中明细都已确定供应商。'
              }
            />
          )}
          {selectedMissingArrivalItems.length > 0 && (
            <Alert
              style={{ marginBottom: 16 }}
              type="warning"
              showIcon
              message="选中明细缺少期望到货日期"
              description={
                <Space orientation="vertical" size={8}>
                  <Typography.Text>
                    采购申请行的期望到货日期会带入采购订单明细交货日期，请在下方行内补齐后再转单。
                  </Typography.Text>
                  <Button
                    htmlType="button"
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={arrivalSaving}
                    disabled={!missingArrivalDraftsComplete}
                    onClick={handleSaveArrivalDates}
                  >
                    保存到货日期
                  </Button>
                </Space>
              }
            />
          )}
        </section>
        <section className="document-form-section document-form-section-lines">
          <Table<ConvertToOrderRequisitionItem>
            rowKey="id"
            pagination={false}
            size="small"
            loading={previewLoading}
            dataSource={remainingItems}
            scroll={{ x: 1360 }}
            columns={[
              {
                title: '物料名称',
                key: 'materialName',
                width: 180,
                ellipsis: true,
                render: (_, item) => item.material?.name ?? '-',
              },
              {
                title: '物料编码',
                key: 'materialCode',
                width: 140,
                ellipsis: true,
                render: (_, item) => item.material?.code ?? '-',
              },
              {
                title: '规格',
                key: 'materialSpec',
                width: 160,
                ellipsis: true,
                render: (_, item) => item.material?.spec || '未维护规格',
              },
              {
                title: '单位',
                key: 'materialUnit',
                width: 90,
                render: (_, item) =>
                  formatUnitLabel(item.material?.unit, capabilities.unitLabelMap) || '-',
              },
              {
                title: '需求数量',
                dataIndex: 'requiredQty',
                width: 100,
                align: 'right',
              },
              {
                title: '已下单',
                dataIndex: 'orderedQty',
                width: 100,
                align: 'right',
              },
              {
                title: '剩余可转',
                key: 'remainingQty',
                width: 110,
                align: 'right',
                render: (_, item) => getRemainingQty(item),
              },
              {
                title: '行号',
                key: 'lineNo',
                width: 72,
                align: 'center',
                render: (_, item, index) =>
                  Number.isFinite(Number(item.sortOrder))
                    ? Number(item.sortOrder) + 1
                    : index + 1,
              },
              {
                title: '期望到货日期',
                dataIndex: 'expectedArrivalDate',
                width: 180,
                render: (value, item) => {
                  if (typeof value === 'string' && value) return value;
                  if (Number(quantities[item.id] ?? 0) <= 0) {
                    return <Tag color="red">未填写</Tag>;
                  }
                  return (
                    <DatePicker
                      aria-label={`${item.material?.name ?? '物料'}期望到货日期`}
                      size="small"
                      value={toDatePickerValue(arrivalDateDrafts[item.id])}
                      onChange={(date) =>
                        setArrivalDateDrafts((prev) => ({
                          ...prev,
                          [item.id]: date?.format('YYYY-MM-DD') ?? undefined,
                        }))
                      }
                      placeholder="选择到货日期"
                      style={{ width: '100%' }}
                    />
                  );
                },
              },
              {
                title: '供应商判定',
                key: 'supplier',
                width: 220,
                render: (_, item) => {
                  const resolved = resolvedMap.get(item.id);
                  const unresolved = unresolvedMap.get(item.id);
                  const candidateOptions =
                    unresolved?.candidateSuppliers?.map((supplier) => ({
                      label: supplier.name,
                      value: supplier.id,
                    })) ?? [];
                  const options =
                    candidateOptions.length > 0 ? candidateOptions : supplierOptions;
                  return (
                    <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                      <RemoteSelect<string>
                        allowClear
                        placeholder={
                          resolved
                            ? `${resolved.supplierName}（${
                                SOURCE_LABEL[resolved.source] ?? '已确定'
                              }）`
                            : '选择本次供应商'
                        }
                        value={supplierOverrides[item.id]}
                        options={options}
                        onDropdownVisibleChange={(visible) => {
                          if (visible && supplierOptions.length === 0) {
                            void loadSupplierOptions();
                          }
                        }}
                        onSearch={(value) => void loadSupplierOptions(value)}
                        onChange={(value) =>
                          setSupplierOverrides((prev) => ({
                            ...prev,
                            [item.id]: value,
                          }))
                        }
                        style={{ width: '100%' }}
                      />
                      {unresolved ? (
                        <Tag color="orange">{unresolved.reason}</Tag>
                      ) : resolved ? (
                        <Tag color="green">
                          {resolved.supplierName} ·{' '}
                          {SOURCE_LABEL[resolved.source] ?? '已确定'}
                        </Tag>
                      ) : null}
                    </Space>
                  );
                },
              },
              {
                title: capabilities.renderFieldHelp({
                  label: '本次转单数量',
                  helpKey: 'requisitionConvertQty',
                }),
                key: 'convertQty',
                width: 160,
                align: 'right',
                render: (_, item) => {
                  const maxQty = getRemainingQty(item);
                  return (
                    <InputNumber
                      aria-label={`${item.material?.name ?? '物料'}本次转单数量`}
                      min={0}
                      max={maxQty}
                      precision={4}
                      value={quantities[item.id]}
                      onChange={(value) =>
                        setQuantities((prev) => ({
                          ...prev,
                          [item.id]: Number(value ?? 0),
                        }))
                      }
                      style={{ width: '100%' }}
                    />
                  );
                },
              },
            ]}
          />
        </section>
      </div>
    </DocumentModalForm>
  );
}
