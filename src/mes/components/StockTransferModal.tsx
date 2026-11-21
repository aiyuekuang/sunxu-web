import {
  ModalForm,
  ProFormDatePicker,
  ProFormDigit,
  ProFormGroup,
  ProFormList,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert, Form } from 'antd';
import dayjs from 'dayjs';
import {
  BatchMaterialAddButton,
  buildBatchMaterialOption,
} from './BatchMaterialAddButton';
import { MaterialSelectField } from './MaterialFilteredSelect';
import { StockLocationDependencyField } from './StockLocationSelectField';
import type {
  StockTransferModalProps,
  StockTransferOrderFormValues,
  StockTransferOrderItemFormValue,
  StockTransferOrderItemRecord,
  StockTransferOrderPayload,
  StockTransferMaterial,
} from './stock-transfer-types';

export type {
  StockTransferOrderFormValues,
  StockTransferOrderItemFormValue,
} from './stock-transfer-types';

export function createStockTransferItemFormValue(
  material: StockTransferMaterial,
  quantity: number,
): StockTransferOrderItemFormValue {
  return {
    materialId: material.id,
    materialOption: buildBatchMaterialOption(material),
    qty: quantity,
  };
}

/** Strip the local material-label snapshot and serialize the date at the host boundary. */
export function toStockTransferOrderPayload(
  values: StockTransferOrderFormValues,
  normalizeDateOnly: (value: unknown) => string | undefined,
): StockTransferOrderPayload {
  const { items, plannedDate, ...payload } = values;
  return {
    ...payload,
    plannedDate: normalizeDateOnly(plannedDate),
    items: items.map(({ materialOption: _materialOption, ...item }) => item),
  };
}

function toTransferOrderItemFormValue(
  item: StockTransferOrderItemRecord,
): StockTransferOrderItemFormValue {
  return {
    id: item.id,
    materialId: item.materialId,
    qty: item.qty,
    batchNo: item.batchNo ?? undefined,
    remarks: item.remarks ?? undefined,
    materialOption: item.material
      ? buildBatchMaterialOption(item.material)
      : undefined,
  };
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain warehouse stock transfer draft
 * @sunxu-reason Preserves transfer draft fields, material selection, location policy, date serialization, and 100-line validation while the host supplies warehouse/material requests, APIs, permissions, notifications, and stock-location capabilities.
 *
 * Edits a stock-transfer draft and delegates all inventory policy and mutations
 * to the MES host.
 */
export function StockTransferModal({
  open,
  onOpenChange,
  onSuccess,
  editingOrder,
  capabilities,
}: StockTransferModalProps) {
  const [form] = Form.useForm<StockTransferOrderFormValues>();
  const items = Form.useWatch('items', form) ?? [];
  const isEditing = editingOrder !== null;
  const initialValues = editingOrder
    ? {
        fromWarehouseId: editingOrder.fromWarehouseId,
        toWarehouseId: editingOrder.toWarehouseId,
        fromLocationId: editingOrder.fromLocationId ?? undefined,
        toLocationId: editingOrder.toLocationId ?? undefined,
        fromStorageLocation:
          editingOrder.fromStorageLocationSnapshot ?? undefined,
        toStorageLocation: editingOrder.toStorageLocationSnapshot ?? undefined,
        plannedDate: editingOrder.plannedDate
          ? dayjs(editingOrder.plannedDate)
          : undefined,
        remarks: editingOrder.remarks ?? undefined,
        items: editingOrder.items?.map(toTransferOrderItemFormValue) ?? [],
      }
    : { items: [{ qty: 1 }], plannedDate: dayjs() };

  return (
    <ModalForm<StockTransferOrderFormValues>
      key={`stock-transfer-order-${editingOrder?.id ?? 'new'}`}
      title={isEditing ? '编辑调拨草稿' : '新建调拨草稿'}
      width={1040}
      form={form}
      open={open}
      onOpenChange={onOpenChange}
      initialValues={initialValues}
      modalProps={{
        destroyOnHidden: true,
        centered: true,
        styles: {
          body: {
            maxHeight: 'calc(100vh - 200px)',
            overflowX: 'hidden',
            overflowY: 'auto',
          },
        },
      }}
      submitter={{
        searchConfig: { submitText: isEditing ? '保存修改' : '保存草稿' },
      }}
      onFinish={async (values) => {
        const payload = toStockTransferOrderPayload(
          values,
          capabilities.normalizeDateOnly,
        );
        if (editingOrder) {
          await capabilities.updateTransferOrder({
            id: editingOrder.id,
            ...payload,
          });
          capabilities.notifySuccess('调拨草稿已更新');
        } else {
          await capabilities.createTransferOrder(payload);
          capabilities.notifySuccess('调拨草稿已保存，库存尚未变更');
        }
        void onSuccess?.();
        return true;
      }}
    >
      <Alert
        showIcon
        type="info"
        message="保存草稿仅记录计划，不会扣减或增加库存；待实物实际调拨后，再执行确认调拨。"
        style={{ marginBottom: 16 }}
      />
      <ProFormGroup>
        <ProFormSelect
          name="fromWarehouseId"
          label="调出仓库"
          width="md"
          request={capabilities.requestWarehouses}
          showSearch
          debounceTime={300}
          fieldProps={{ filterOption: false }}
          rules={[{ required: true, message: '请选择调出仓库' }]}
        />
        <ProFormSelect
          name="toWarehouseId"
          label="调入仓库"
          width="md"
          request={capabilities.requestWarehouses}
          showSearch
          debounceTime={300}
          fieldProps={{ filterOption: false }}
          rules={[{ required: true, message: '请选择调入仓库' }]}
        />
      </ProFormGroup>

      <ProFormGroup>
        <ProFormDatePicker
          name="plannedDate"
          label="计划调拨日期"
          fieldProps={{ format: 'YYYY-MM-DD', allowClear: false }}
          extra="用于安排和提醒，可选择未来日期；保存草稿不会产生库存流水。"
        />
        <StockLocationDependencyField
          capabilities={capabilities.stockLocation}
          name="fromLocationId"
          textName="fromStorageLocation"
          label="调出仓位"
          action="stock/transfer-out"
          warehouseFieldName="fromWarehouseId"
        />
        <StockLocationDependencyField
          capabilities={capabilities.stockLocation}
          name="toLocationId"
          textName="toStorageLocation"
          label="调入仓位"
          action="stock/transfer-in"
          warehouseFieldName="toWarehouseId"
        />
      </ProFormGroup>

      <div
        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}
      >
        <BatchMaterialAddButton<StockTransferOrderItemFormValue>
          rows={items}
          maxRows={100}
          onRowsChange={(nextItems) => form.setFieldValue('items', nextItems)}
          getMaterialId={(item) => item.materialId || undefined}
          isEmptyRow={(item) =>
            !item.materialId && item.qty === 1 && !item.batchNo
          }
          quantityLabel="调拨数量"
          createRow={createStockTransferItemFormValue}
        />
      </div>
      <ProFormList
        name="items"
        label="调拨明细（最多 100 行）"
        min={1}
        max={100}
        creatorRecord={{ qty: 1 }}
        creatorButtonProps={{ creatorButtonText: '添加物料明细' }}
        copyIconProps={false}
        deleteIconProps={{ tooltipText: '移除明细' }}
        containerStyle={{ minWidth: 0, width: '100%' }}
        itemRender={({ listDom, action }) => (
          <div
            style={{
              alignItems: 'flex-start',
              display: 'flex',
              gap: 8,
              minWidth: 0,
              width: '100%',
            }}
          >
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>{listDom}</div>
            {action ? (
              <div style={{ flex: '0 0 auto', paddingTop: 30 }}>{action}</div>
            ) : null}
          </div>
        )}
        rules={[
          {
            validator: async (
              _,
              formItems: StockTransferOrderItemFormValue[],
            ) => {
              if (!formItems?.length) {
                throw new Error('请至少添加一条调拨明细');
              }
            },
          },
        ]}
      >
        {(_field, index, action) => (
          <ProFormGroup
            spaceProps={{
              style: { width: '100%' },
              wrap: true,
            }}
          >
            <MaterialSelectField
              name="materialId"
              label="物料（名称 / 编码 / 规格）"
              request={capabilities.requestMaterials}
              selectWidth={420}
              rules={[{ required: true, message: '请选择物料' }]}
              selectedOption={items[index]?.materialOption}
              onChange={(materialId, materialOption) =>
                action.setCurrentRowData({
                  ...action.getCurrentRowData(),
                  materialId,
                  materialOption,
                })
              }
            />
            <ProFormDigit
              name="qty"
              label="调拨数量"
              width="sm"
              min={0.0001}
              fieldProps={{ precision: 4 }}
              rules={[{ required: true, message: '请输入调拨数量' }]}
            />
            <ProFormText
              name="batchNo"
              label="批号"
              width="md"
              fieldProps={{ maxLength: 128 }}
              placeholder="按批号追溯的物料确认时必填"
            />
          </ProFormGroup>
        )}
      </ProFormList>

      <ProFormTextArea
        name="remarks"
        label="调拨备注"
        fieldProps={{ rows: 2, maxLength: 1000 }}
        placeholder="可填写调拨原因或用途"
      />
    </ModalForm>
  );
}
