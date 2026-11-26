import { ApartmentOutlined } from '@ant-design/icons';
import { ProFormTextArea } from '@ant-design/pro-components';
import { Alert, Button, DatePicker, InputNumber, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { type KeyboardEvent, useCallback, useEffect, useState } from 'react';
import { MesUiProvider } from '../MesUiProvider';
import { BatchMaterialAddButton, buildBatchMaterialOption } from './BatchMaterialAddButton';
import { DocumentModalForm } from './DocumentModalForm';
import {
  nextItemKey,
  OrderItemEditor,
  type OrderItemDraft,
} from './OrderItemEditor';
import { ResizableTable as Table } from './ResizableTable';
import { formatUnitLabel } from '../utils/qty-unit';
import type {
  FilterableSelectRequestFn,
} from './material-select-types';
import type {
  BomExpansionCreateModalProps,
  BomRequisitionInputItem,
  BomRequisitionPreviewItem,
  BomRequisitionPreviewResponse,
} from './bom-expansion-create-modal-types';

interface BomExpansionFormValues {
  remarks?: string;
}

function createEmptyItem(): OrderItemDraft {
  return {
    _key: nextItemKey(),
    materialId: '',
    qty: 1,
  };
}

function toDatePickerValue(value: string | undefined) {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

function stopDatePickerEnter(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  event.stopPropagation();
}

function warningTitle(warnings: NonNullable<BomRequisitionPreviewResponse['warnings']>) {
  return `BOM展开存在 ${warnings.length} 条提示`;
}

/**
 * @sunxu-layer business
 * @sunxu-domain purchase
 * @sunxu-reason Keeps BOM expansion preview and purchase-requisition creation behavior while injecting MES requests, permissions, dictionaries, field help, and feedback from the host.
 */
export function BomExpansionCreateModal<TResult>({
  open,
  onOpenChange,
  onSuccess,
  capabilities,
}: BomExpansionCreateModalProps<TResult>) {
  const [items, setItems] = useState<OrderItemDraft[]>([createEmptyItem()]);
  const [qtyErrors, setQtyErrors] = useState<Record<string, string>>({});
  const [maxDepth, setMaxDepth] = useState(8);
  const [preview, setPreview] =
    useState<BomRequisitionPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [suggestedPurchaseDate, setSuggestedPurchaseDate] = useState<
    string | undefined
  >();
  const [expectedArrivalDate, setExpectedArrivalDate] = useState<
    string | undefined
  >();
  const requestActiveMaterials = useCallback<FilterableSelectRequestFn>(
    (params) => capabilities.requestMaterials({ ...params, isActive: true }),
    [capabilities.requestMaterials],
  );

  useEffect(() => {
    if (!open) return;
    setItems([createEmptyItem()]);
    setQtyErrors({});
    setMaxDepth(8);
    setPreview(null);
    setSuggestedPurchaseDate(undefined);
    setExpectedArrivalDate(undefined);
  }, [open]);

  const buildPayloadItems = (): BomRequisitionInputItem[] | null => {
    const nextQtyErrors: Record<string, string> = {};
    const seenMaterialIds = new Set<string>();
    const validItems: BomRequisitionInputItem[] = [];

    for (const item of items) {
      if (!item.materialId) continue;
      const qtyValid =
        typeof item.qty === 'number' &&
        Number.isFinite(item.qty) &&
        item.qty > 0;
      if (!qtyValid) {
        nextQtyErrors[item._key] = '数量必须大于 0';
        continue;
      }
      if (seenMaterialIds.has(item.materialId)) {
        nextQtyErrors[item._key] = '物料不能重复';
        continue;
      }
      seenMaterialIds.add(item.materialId);
      validItems.push({ materialId: item.materialId, quantity: item.qty });
    }

    setQtyErrors(nextQtyErrors);
    if (Object.keys(nextQtyErrors).length > 0) {
      capabilities.notifyWarning('请修正展开物料中的数量或重复物料');
      return null;
    }
    if (validItems.length === 0) {
      capabilities.notifyWarning('请至少选择一个物料');
      return null;
    }
    return validItems;
  };

  const handlePreview = async () => {
    const payloadItems = buildPayloadItems();
    if (!payloadItems) return;

    setPreviewLoading(true);
    try {
      const result = await capabilities.previewFromBom({
        items: payloadItems,
        maxDepth,
      });
      setPreview(result);
    } finally {
      setPreviewLoading(false);
    }
  };

  const previewColumns: ColumnsType<BomRequisitionPreviewItem> = [
    {
      title: '物料名称',
      dataIndex: 'materialName',
      width: 180,
      ellipsis: true,
    },
    {
      title: '物料编码',
      dataIndex: 'materialCode',
      width: 150,
      fixed: 'left',
    },
    {
      title: '规格',
      dataIndex: 'materialSpec',
      width: 160,
      ellipsis: true,
      render: (value) => value || '-',
    },
    {
      title: '单位',
      dataIndex: 'materialUnit',
      width: 90,
      render: (value) =>
        formatUnitLabel(
          typeof value === 'string' ? value : undefined,
          capabilities.unitLabelMap,
        ) || '-',
    },
    {
      title: '需求数量',
      dataIndex: 'requiredQty',
      width: 130,
      align: 'right',
      render: (_, record) => capabilities.formatQuantity(record.requiredQty),
    },
    {
      title: '来源',
      dataIndex: 'sources',
      width: 360,
      render: (_, record) => {
        const sources = record.sources ?? [];
        const visibleSources = sources.slice(0, 2);
        return (
          <Space orientation="vertical" size={0}>
            {visibleSources.map((source) => (
              <Typography.Text key={`${source.path}-${source.rootMaterialId}`}>
                {source.rootMaterialCode} {source.rootMaterialName} x{' '}
                {capabilities.formatQuantity(source.rootQuantity)} / {source.path}
              </Typography.Text>
            ))}
            {sources.length > visibleSources.length ? (
              <Typography.Text type="secondary">
                还有 {sources.length - visibleSources.length} 条来源
              </Typography.Text>
            ) : null}
          </Space>
        );
      },
    },
  ];

  return (
    <MesUiProvider
      hasPermission={capabilities.hasPermission}
      materialSelectCapabilities={capabilities.materialSelectCapabilities}
      materialTablePickerCapabilities={capabilities.materialTablePickerCapabilities}
      orderItemEditorCapabilities={capabilities.orderItemEditorCapabilities}
    >
      <DocumentModalForm<BomExpansionFormValues>
        title="按BOM展开创建采购申请"
        open={open}
        width="100vw"
        layout="vertical"
        onOpenChange={(nextOpen) => {
          onOpenChange(nextOpen);
          if (!nextOpen) {
            setQtyErrors({});
            setPreview(null);
          }
        }}
        submitter={{
          searchConfig: {
            submitText: '生成申请',
            resetText: '取消',
          },
        }}
        onFinish={async (values) => {
          const payloadItems = buildPayloadItems();
          if (!payloadItems) return false;
          if (!preview) {
            capabilities.notifyWarning('请先点击展开预览，确认BOM需求后再生成申请');
            return false;
          }
          if ((preview.items ?? []).length === 0) {
            capabilities.notifyWarning('BOM展开后没有可生成采购申请的采购物料');
            return false;
          }

          const result = await capabilities.createFromBom({
            items: payloadItems,
            maxDepth,
            suggestedPurchaseDate,
            expectedArrivalDate,
            remarks: values.remarks,
          });
          capabilities.notifySuccess('创建成功');
          onSuccess?.(result);
          return true;
        }}
      >
        <div className="document-form-layout">
          <section className="document-form-section document-form-section-lines">
            <OrderItemEditor
              title={capabilities.renderFieldHelp('展开物料', 'requisitionItems')}
              items={items}
              onChange={(nextItems) => {
                setItems(nextItems);
                setPreview(null);
              }}
              required
              qtyRequired
              qtyErrors={qtyErrors}
              showPrice={false}
              qtyLabel="需求数量"
              layout="table"
              showRowIndex
              materialRequest={requestActiveMaterials}
              materialPlaceholder="搜索成品、半成品或物料"
              toolbarActions={
                <BatchMaterialAddButton
                  rows={items}
                  onRowsChange={(nextItems) => {
                    setItems(nextItems);
                    setPreview(null);
                  }}
                  getMaterialId={(item) => item.materialId || undefined}
                  isEmptyRow={(item) => !item.materialId && item.qty === 1}
                  quantityLabel="申请数量"
                  createRow={(material, quantity) => ({
                    ...createEmptyItem(),
                    materialId: material.id,
                    material,
                    materialOption: buildBatchMaterialOption(material),
                    qty: quantity,
                  })}
                />
              }
            />
          </section>

          <section className="document-form-section">
            <Space align="center" wrap>
              <span className="document-form-section-title">展开设置</span>
              <Typography.Text type="secondary">最大层级</Typography.Text>
              <InputNumber
                aria-label="最大层级"
                min={1}
                max={20}
                precision={0}
                value={maxDepth}
                onChange={(value) => {
                  setMaxDepth(Number(value ?? 8));
                  setPreview(null);
                }}
              />
              <Button
                icon={<ApartmentOutlined />}
                loading={previewLoading}
                onClick={handlePreview}
              >
                展开预览
              </Button>
              <Typography.Text type="secondary">建议采购日期</Typography.Text>
              <DatePicker
                aria-label="建议采购日期"
                value={toDatePickerValue(suggestedPurchaseDate)}
                onChange={(value) =>
                  setSuggestedPurchaseDate(value?.format('YYYY-MM-DD'))
                }
                onKeyDown={stopDatePickerEnter}
                placeholder="可选"
                allowClear
              />
              <Typography.Text type="secondary">期望到货日期</Typography.Text>
              <DatePicker
                aria-label="期望到货日期"
                value={toDatePickerValue(expectedArrivalDate)}
                onChange={(value) =>
                  setExpectedArrivalDate(value?.format('YYYY-MM-DD'))
                }
                onKeyDown={stopDatePickerEnter}
                placeholder="提交前补齐"
                allowClear
              />
            </Space>
          </section>

          {preview ? (
            <section className="document-form-section">
              <Space orientation="vertical" style={{ width: '100%' }} size={12}>
                {preview.warnings?.length ? (
                  <Alert
                    type="warning"
                    showIcon
                    message={warningTitle(preview.warnings)}
                    description={
                      <Space orientation="vertical" size={2}>
                        {preview.warnings.slice(0, 5).map((warning) => (
                          <Typography.Text key={`${warning.code}-${warning.path}`}>
                            {warning.message}
                          </Typography.Text>
                        ))}
                        {preview.warnings.length > 5 ? (
                          <Typography.Text type="secondary">
                            还有 {preview.warnings.length - 5} 条提示
                          </Typography.Text>
                        ) : null}
                      </Space>
                    }
                  />
                ) : null}
                <Table<BomRequisitionPreviewItem>
                  rowKey="materialId"
                  size="small"
                  columns={previewColumns}
                  dataSource={preview.items ?? []}
                  pagination={false}
                  scroll={{ x: 1070, y: 300 }}
                  summary={() => (
                    <Table.Summary fixed>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={4}>
                          合计
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="right">
                          {capabilities.formatQuantity(preview.totalRequiredQty)}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5}>
                          {preview.itemCount} 种物料
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              </Space>
            </section>
          ) : null}

          <section className="document-form-section">
            <div className="document-form-section-title">备注</div>
            <ProFormTextArea
              name="remarks"
              label={capabilities.renderFieldHelp('备注', 'remarks')}
              placeholder="请输入备注"
            />
          </section>
        </div>
      </DocumentModalForm>
    </MesUiProvider>
  );
}
