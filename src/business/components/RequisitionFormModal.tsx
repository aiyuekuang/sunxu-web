import {
  ProFormDatePicker,
  type ProFormRef,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  Button,
  DatePicker,
  Dropdown,
  Input,
  InputNumber,
  Typography,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BatchMaterialAddButton,
  buildBatchMaterialOption,
} from './BatchMaterialAddButton';
import { MaterialFilteredSelect } from './MaterialFilteredSelect';
import {
  type DocumentLineBatchOperations,
  DocumentLineEditableTable,
} from './DocumentLineEditableTable';
import { DocumentModalForm } from './DocumentModalForm';
import { nextItemKey } from './OrderItemEditor';
import type {
  MaterialFilteredSelectOption,
} from './material-select-types';
import type {
  RequisitionFormItem,
  RequisitionFormLineCustomFieldSchema,
  RequisitionFormMaterial,
  RequisitionFormModalProps,
  RequisitionFormResult,
  RequisitionOrderItemDraft,
} from './requisition-form-modal-types';
import {
  applyRequisitionCustomFieldPreview,
  buildRequisitionCustomFieldPreviewItems,
  buildRequisitionLineCustomValuePayload,
  createRequisitionLineCustomFieldColumns,
  sameRequisitionCustomFieldRuntime,
  sumRequisitionLineCustomFieldColumnWidths,
} from './requisition-line-custom-fields';

type RequisitionSubmitMode = 'draft' | 'submit';

interface RequisitionFormValues {
  documentDate?: Dayjs;
  remarks?: string;
}

function createEmptyRequisitionItem(): RequisitionOrderItemDraft {
  return {
    _key: nextItemKey(),
    materialId: '',
    qty: 1,
  };
}

function isEmptyRequisitionItem(item: RequisitionOrderItemDraft): boolean {
  return (
    !item.materialId &&
    item.qty === 1 &&
    !item.supplierId &&
    !item.supplierPriceTierId &&
    !item.grade &&
    !item.suggestedPurchaseDate &&
    !item.expectedArrivalDate &&
    !item.remarks
  );
}

function toDatePickerValue(value: unknown) {
  if (typeof value !== 'string' || !value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

function toPayloadDate(value: unknown): string | undefined {
  if (value == null) return undefined;
  const parsed = dayjs.isDayjs(value)
    ? value
    : dayjs(value as string | number | Date);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : undefined;
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pickMaterialCustomFieldRuntime(material: RequisitionFormMaterial | undefined) {
  const readRuntime = (value: unknown) =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  return {
    customValues: readRuntime(material?.customValues),
    customComputedValues: readRuntime(material?.customComputedValues),
    customComputedErrors: readRuntime(material?.customComputedErrors),
  };
}

function formatMaterialOption(
  material: RequisitionFormMaterial | undefined,
  materialId: string | undefined,
): MaterialFilteredSelectOption | undefined {
  const value = material?.id ?? materialId;
  if (!value) return undefined;
  const label = [material?.code, material?.name].filter(Boolean).join(' - ') || value;
  return {
    label,
    value,
    title: label,
    code: material?.code,
    name: material?.name,
    unit: material?.unit,
    familyId: material?.familyId,
    baseType: material?.baseType,
    categoryId: material?.categoryId,
    spec: material?.spec,
    procurementType: material?.procurementType,
    ...pickMaterialCustomFieldRuntime(material),
  };
}

function getSelectedMaterialOption(
  item: RequisitionOrderItemDraft,
): MaterialFilteredSelectOption | undefined {
  return item.materialOption?.value === item.materialId
    ? item.materialOption
    : undefined;
}

function getMaterialSpec(item: RequisitionOrderItemDraft): string | undefined {
  return getSelectedMaterialOption(item)?.spec || undefined;
}

function FieldError({ message: errorMessage }: { message?: string }) {
  if (!errorMessage) return null;
  return (
    <Typography.Text type="danger" style={{ fontSize: 12 }}>
      {errorMessage}
    </Typography.Text>
  );
}

function stopDatePickerEnter(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  event.stopPropagation();
}

function buildItemsFromRequisition(
  requisition?: RequisitionFormModalProps['requisition'],
): RequisitionOrderItemDraft[] {
  const items = (requisition?.items ?? []) as RequisitionFormItem[];
  if (items.length === 0) return [createEmptyRequisitionItem()];

  return items.map((item) => ({
    _key: nextItemKey(),
    id: item.id,
    materialId: item.materialId,
    material: item.material ?? undefined,
    materialOption: formatMaterialOption(item.material ?? undefined, item.materialId),
    qty: Number(item.requiredQty ?? 1),
    supplierId: item.supplierId ?? undefined,
    supplierPriceTierId: item.supplierPriceTierId ?? undefined,
    grade: item.grade ?? undefined,
    suggestedPurchaseDate: item.suggestedPurchaseDate ?? undefined,
    expectedArrivalDate: item.expectedArrivalDate ?? undefined,
    remarks: item.remarks ?? undefined,
    customFieldSchemaVersion: item.customFieldSchemaVersion,
    customValues: item.customValues,
    customComputedValues: item.customComputedValues,
    customComputedErrors: item.customComputedErrors,
  }));
}

function applyRuntimeValues(
  rows: RequisitionOrderItemDraft[],
  previews: Array<{
    customComputedValues?: Record<string, unknown>;
    customComputedErrors?: Record<string, unknown>;
  }>,
): RequisitionOrderItemDraft[] {
  return applyRequisitionCustomFieldPreview(rows, previews);
}

/** @sunxu-layer business @sunxu-domain purchase requisition @sunxu-reason Preserves requisition CRUD, approval submission, material lines, batch entry and dynamic line fields while the host supplies APIs, permissions, routing and notices. */
export function RequisitionFormModal({
  open,
  mode,
  requisition,
  canSubmit = false,
  onOpenChange,
  onSuccess,
  capabilities,
}: RequisitionFormModalProps) {
  const isEdit = mode === 'edit';
  const formRef = useRef<ProFormRef<RequisitionFormValues> | undefined>(undefined);
  const submitModeRef = useRef<RequisitionSubmitMode>('draft');
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<RequisitionOrderItemDraft[]>([
    createEmptyRequisitionItem(),
  ]);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onItemsChangeRef = useRef(setItems);
  onItemsChangeRef.current = setItems;
  const [qtyErrors, setQtyErrors] = useState<Record<string, string>>({});
  const [lineCustomFieldSchema, setLineCustomFieldSchema] = useState<RequisitionFormLineCustomFieldSchema | null>(null);

  useEffect(() => {
    let cancelled = false;
    capabilities.requestLineCustomFieldSchema({
      objectType: 'purchase_requisition_item',
    })
      .then((schema) => {
        if (!cancelled) setLineCustomFieldSchema(schema ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setLineCustomFieldSchema(null);
          capabilities.notifyError('加载明细自定义字段失败');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [capabilities.requestLineCustomFieldSchema, capabilities.notifyError]);

  useEffect(() => {
    if (!open) return;
    setQtyErrors({});
    setItems(isEdit ? buildItemsFromRequisition(requisition) : [createEmptyRequisitionItem()]);
  }, [isEdit, open, requisition]);

  useEffect(() => {
    setQtyErrors((previous) => {
      if (Object.keys(previous).length === 0) return previous;
      let changed = false;
      const nextErrors = { ...previous };
      const activeKeys = new Set(items.map((item) => item._key));
      for (const key of Object.keys(nextErrors)) {
        if (!activeKeys.has(key)) {
          delete nextErrors[key];
          changed = true;
        }
      }
      for (const item of items) {
        if (!nextErrors[item._key]) continue;
        const qtyValid = typeof item.qty === 'number' && Number.isFinite(item.qty) && item.qty > 0;
        if (qtyValid) {
          delete nextErrors[item._key];
          changed = true;
        }
      }
      return changed ? nextErrors : previous;
    });
  }, [items]);

  const lineCustomFieldScrollWidth = useMemo(
    () => sumRequisitionLineCustomFieldColumnWidths(lineCustomFieldSchema),
    [lineCustomFieldSchema],
  );
  const lineCustomFieldPreviewItems = useMemo(
    () => lineCustomFieldSchema
      ? buildRequisitionCustomFieldPreviewItems(items, lineCustomFieldSchema)
      : [],
    [items, lineCustomFieldSchema],
  );
  const hasFormulaFields = useMemo(
    () => (lineCustomFieldSchema?.fields ?? []).some(
      (field) =>
        field.isActive !== false &&
        field.fieldKind === 'formula' &&
        readObject(field.displayJson).showInForm === true,
    ),
    [lineCustomFieldSchema],
  );
  const previewSequenceRef = useRef(0);
  useEffect(() => {
    const sequence = ++previewSequenceRef.current;
    const schema = lineCustomFieldSchema;
    if (!schema || !hasFormulaFields || items.length === 0) return undefined;
    const timer = window.setTimeout(() => {
      capabilities.previewLineCustomFields({
        objectType: 'purchase_requisition_item',
        customFieldSchemaVersion: schema.schemaVersion,
        items: lineCustomFieldPreviewItems,
      })
        .then((result) => {
          if (previewSequenceRef.current !== sequence) return;
          const nextRows = applyRuntimeValues(itemsRef.current, result.items ?? []);
          if (!sameRequisitionCustomFieldRuntime(itemsRef.current, nextRows)) {
            onItemsChangeRef.current(nextRows);
          }
        })
        .catch(() => {
          if (previewSequenceRef.current === sequence) {
            capabilities.notifyError('预览明细计算属性失败');
          }
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      if (previewSequenceRef.current === sequence) previewSequenceRef.current += 1;
    };
  }, [
    capabilities.notifyError,
    capabilities.previewLineCustomFields,
    hasFormulaFields,
    items.length,
    lineCustomFieldPreviewItems,
    lineCustomFieldSchema,
  ]);

  const batchOperations = useMemo<DocumentLineBatchOperations<RequisitionOrderItemDraft>>(
    () => ({
      enabled: true,
      fields: [
        {
          key: 'qty',
          label: '申请数量',
          type: 'number',
          required: true,
          min: 0.0001,
          precision: 4,
          patch: (qty) => ({ qty: qty ?? 1 }),
        },
        {
          key: 'suggestedPurchaseDate',
          label: '建议采购日期',
          type: 'date',
          patch: (suggestedPurchaseDate) => ({ suggestedPurchaseDate }),
        },
        {
          key: 'expectedArrivalDate',
          label: '期望到货日期',
          type: 'date',
          patch: (expectedArrivalDate) => ({ expectedArrivalDate }),
        },
        {
          key: 'remarks',
          label: '明细备注',
          type: 'text',
          maxLength: 500,
          patch: (remarks) => ({ remarks }),
        },
      ],
    }),
    [],
  );

  return (
    <DocumentModalForm<RequisitionFormValues>
      key={isEdit ? `edit-${requisition?.id ?? 'empty'}` : 'create'}
      title={isEdit ? '编辑' : '新增'}
      open={open}
      width="100vw"
      layout="vertical"
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          submitModeRef.current = 'draft';
          submittingRef.current = false;
          setSubmitting(false);
          setQtyErrors({});
        }
      }}
      formRef={formRef}
      submitter={{
        render: () => {
          const cancelButton = (
            <Button
              key="cancel"
              htmlType="button"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              取消
            </Button>
          );
          if (!canSubmit) {
            return [
              cancelButton,
              <Button
                key="save"
                type="primary"
                htmlType="button"
                loading={submitting}
                disabled={submitting}
                onClick={() => {
                  submitModeRef.current = 'draft';
                  formRef.current?.submit();
                }}
              >
                保存草稿
              </Button>,
            ];
          }
          return [
            cancelButton,
            <Dropdown.Button
              key="save-and-submit"
              type="primary"
              htmlType="button"
              loading={submitting}
              disabled={submitting}
              onClick={() => {
                submitModeRef.current = 'submit';
                formRef.current?.submit();
              }}
              menu={{
                items: [{ key: 'draft', label: '仅保存草稿' }],
                onClick: () => {
                  submitModeRef.current = 'draft';
                  formRef.current?.submit();
                },
              }}
            >
              保存并提交审批
            </Dropdown.Button>,
          ];
        },
      }}
      initialValues={{
        documentDate: isEdit ? toDatePickerValue(requisition?.documentDate) : dayjs(),
        remarks: isEdit ? requisition?.remarks ?? undefined : undefined,
      }}
      onFinish={async (values) => {
        const submitMode = submitModeRef.current;
        if (submittingRef.current) return false;
        if (isEdit && !requisition?.id) {
          capabilities.notifyWarning('缺少采购申请，无法编辑');
          return false;
        }
        const nextQtyErrors: Record<string, string> = {};
        const validItems = items.filter((item) => {
          if (!item.materialId) return false;
          const qtyValid = typeof item.qty === 'number' && Number.isFinite(item.qty) && item.qty > 0;
          if (!qtyValid) nextQtyErrors[item._key] = '数量必须大于 0';
          return qtyValid;
        });
        setQtyErrors(nextQtyErrors);
        if (Object.keys(nextQtyErrors).length > 0) {
          capabilities.notifyWarning('请修正申请明细中的数量');
          return false;
        }
        if (validItems.length === 0) {
          capabilities.notifyWarning('请至少添加一个物料');
          return false;
        }
        const payloadItems = validItems.map((item) => ({
          id: item.id,
          materialId: item.materialId,
          supplierId: item.supplierId || undefined,
          supplierPriceTierId: item.supplierPriceTierId || undefined,
          grade: item.grade || undefined,
          requiredQty: item.qty,
          suggestedPurchaseDate: item.suggestedPurchaseDate || undefined,
          expectedArrivalDate: item.expectedArrivalDate || undefined,
          remarks: item.remarks?.trim() || undefined,
          ...(buildRequisitionLineCustomValuePayload(item, lineCustomFieldSchema) ?? {}),
        }));

        submittingRef.current = true;
        setSubmitting(true);
        try {
          const payload = {
            documentDate: toPayloadDate(values.documentDate),
            items: payloadItems,
            remarks: values.remarks,
          };
          const result: RequisitionFormResult = isEdit
            ? await capabilities.update({ id: requisition?.id ?? '', ...payload })
            : await capabilities.create(payload);
          let submittedResult = result;
          if (submitMode === 'submit') {
            try {
              submittedResult = await capabilities.submit({ id: result.id });
            } catch (error) {
              if (!isEdit && result.id) {
                onOpenChange(false);
                capabilities.onOpenCreated?.(result.id);
              }
              throw error;
            }
          }
          capabilities.notifySuccess(
            submitMode === 'submit'
              ? '已保存并提交审批'
              : isEdit
                ? '更新成功'
                : '创建成功',
          );
          onSuccess?.(submittedResult);
          onOpenChange(false);
          return true;
        } finally {
          submitModeRef.current = 'draft';
          submittingRef.current = false;
          setSubmitting(false);
        }
      }}
    >
      <div className="document-form-layout">
        <section className="document-form-section">
          <div className="document-form-section-title">单据信息</div>
          <ProFormDatePicker
            name="documentDate"
            label="制单日期"
            rules={[{ required: true, message: '请选择制单日期' }]}
            fieldProps={{ allowClear: false }}
          />
        </section>
        <section className="document-form-section document-form-section-lines">
          <div className="document-form-section-title">
            {capabilities.renderFieldHelp({
              label: '申请物料',
              helpKey: 'requisitionItems',
            })}
          </div>
          <DocumentLineEditableTable<RequisitionOrderItemDraft>
            rows={items}
            onRowsChange={setItems}
            createRow={createEmptyRequisitionItem}
            cloneRow={(item) => ({ ...item, _key: nextItemKey() })}
            minRows={1}
            addText="添加物料"
            batchOperations={batchOperations}
            toolbarActions={
              <BatchMaterialAddButton<RequisitionOrderItemDraft>
                rows={items}
                onRowsChange={setItems}
                getMaterialId={(item) => item.materialId || undefined}
                isEmptyRow={isEmptyRequisitionItem}
                quantityLabel="申请数量"
                createRow={(material, quantity) => {
                  const requisitionMaterial = material as RequisitionFormMaterial;
                  return {
                    ...createEmptyRequisitionItem(),
                    materialId: material.id,
                    material: requisitionMaterial,
                    materialOption: buildBatchMaterialOption(material),
                    qty: quantity,
                  };
                }}
              />
            }
            scrollX={1280 + lineCustomFieldScrollWidth}
            columns={[
              {
                key: 'materialCode',
                title: '物料编码',
                required: true,
                width: 260,
                fixed: 'left',
                render: (item, _index, update) => (
                  <MaterialFilteredSelect
                    request={capabilities.requestMaterials}
                    value={item.materialId || undefined}
                    selectedOption={getSelectedMaterialOption(item)}
                    onChange={(value, option) =>
                      update({
                        materialId: value ?? '',
                        materialOption: option,
                        material: undefined,
                      })
                    }
                    placeholder="搜索物料代码"
                    filterMode="hidden"
                    selectWidth="100%"
                  />
                ),
              },
              {
                key: 'materialName',
                title: '物料名称',
                required: true,
                width: 180,
                render: (item) => (
                  <Typography.Text ellipsis>
                    {getSelectedMaterialOption(item)?.name ?? '-'}
                  </Typography.Text>
                ),
              },
              {
                key: 'materialSpec',
                title: '物料规格',
                required: true,
                width: 180,
                render: (item) => {
                  if (!item.materialId) return <Typography.Text type="secondary">-</Typography.Text>;
                  const spec = getMaterialSpec(item);
                  return (
                    <Typography.Text type={spec ? undefined : 'warning'} ellipsis>
                      {spec ?? '未维护规格'}
                    </Typography.Text>
                  );
                },
              },
              {
                key: 'qty',
                title: '数量',
                required: true,
                width: 132,
                align: 'right',
                render: (item, _index, update) => (
                  <>
                    <InputNumber
                      aria-label={`${getSelectedMaterialOption(item)?.name ?? '物料'}申请数量`}
                      value={item.qty}
                      onChange={(value) => update({ qty: value ?? 1 })}
                      placeholder="数量"
                      style={{ width: '100%' }}
                      min={0.0001}
                      status={qtyErrors[item._key] ? 'error' : undefined}
                      controls={false}
                    />
                    <FieldError message={qtyErrors[item._key]} />
                  </>
                ),
              },
              {
                key: 'suggestedPurchaseDate',
                title: '建议采购日期',
                width: 160,
                render: (item, _index, update) => (
                  <DatePicker
                    aria-label={`${getSelectedMaterialOption(item)?.name ?? '物料'}建议采购日期`}
                    value={toDatePickerValue(item.suggestedPurchaseDate)}
                    onChange={(value) => update({ suggestedPurchaseDate: value?.format('YYYY-MM-DD') ?? undefined })}
                    onKeyDown={stopDatePickerEnter}
                    placeholder="建议采购日期"
                    style={{ width: '100%' }}
                    allowClear
                  />
                ),
              },
              {
                key: 'expectedArrivalDate',
                title: '期望到货日期',
                width: 160,
                render: (item, _index, update) => (
                  <DatePicker
                    aria-label={`${getSelectedMaterialOption(item)?.name ?? '物料'}期望到货日期`}
                    value={toDatePickerValue(item.expectedArrivalDate)}
                    onChange={(value) => update({ expectedArrivalDate: value?.format('YYYY-MM-DD') ?? undefined })}
                    onKeyDown={stopDatePickerEnter}
                    placeholder="提交前补齐"
                    style={{ width: '100%' }}
                    allowClear
                  />
                ),
              },
              {
                key: 'remarks',
                title: '备注',
                width: 220,
                render: (item, _index, update) => (
                  <Input
                    aria-label={`${getSelectedMaterialOption(item)?.name ?? '物料'}行备注`}
                    value={item.remarks ?? ''}
                    onChange={(event) => update({ remarks: event.target.value })}
                    placeholder="行备注"
                    maxLength={500}
                    allowClear
                  />
                ),
              },
              ...createRequisitionLineCustomFieldColumns(lineCustomFieldSchema),
            ]}
          />
        </section>
        <section className="document-form-section">
          <div className="document-form-section-title">备注</div>
          <ProFormTextArea
            name="remarks"
            label={capabilities.renderFieldHelp({
              label: '备注',
              helpKey: 'remarks',
            })}
            placeholder="请输入备注"
          />
        </section>
      </div>
    </DocumentModalForm>
  );
}
