import { DrawerForm, ProFormSelect, ProFormText } from '@ant-design/pro-components';
import type {
  SaleReturnStockConversionDrawerProps,
  SaleReturnStockConversionFormValues,
} from './sale-return-components-types';

/** @sunxu-layer business @sunxu-domain sales @sunxu-reason Keeps the return-to-conversion draft setup and disabled allocation choice while the host supplies warehouse search, conversion creation, dictionaries and feedback.*/
export function SaleReturnStockConversionDrawer({
  detail,
  open,
  onClose,
  onSuccess,
  capabilities,
}: SaleReturnStockConversionDrawerProps) {
  const costAllocationOptions = capabilities.costAllocationMethodOptions.map(
    (option) => ({
      ...option,
      disabled:
        option.disabled || option.value === 'by_weight_or_measure' || false,
    }),
  );

  return (
    <DrawerForm<SaleReturnStockConversionFormValues>
      title="创建库存转换草稿"
      open={open}
      width={520}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      onFinish={async (values) => {
        if (!detail) return false;
        const conversion = await capabilities.createFromSaleReturn({
          id: detail.id,
          conversionType: values.conversionType,
          conversionPurpose: values.conversionPurpose?.trim() || undefined,
          warehouseId: values.warehouseId,
          costAllocationMethod: values.costAllocationMethod,
          remarks: values.remarks?.trim() || undefined,
        });
        capabilities.notifySuccess(
          `已生成库存转换草稿 ${conversion.conversionNo}`,
        );
        onClose();
        await onSuccess?.(conversion);
        return true;
      }}
      initialValues={{
        conversionType: 'material_change',
        warehouseId: detail?.receiveWarehouseId ?? undefined,
        costAllocationMethod: 'by_qty',
      }}
      drawerProps={{ destroyOnHidden: true }}
    >
      <ProFormSelect
        name="conversionType"
        label="转换类型"
        options={[...capabilities.conversionTypeOptions]}
        rules={[{ required: true, message: '请选择转换类型' }]}
      />
      <ProFormText
        name="conversionPurpose"
        label="用途"
        placeholder="如出口 KD、拆包配件、换料号"
      />
      <ProFormSelect
        name="warehouseId"
        label="投入仓库"
        showSearch
        request={capabilities.requestWarehouses}
        debounceTime={300}
        fieldProps={{ filterOption: false, allowClear: true }}
        rules={
          detail?.receiveWarehouseId
            ? []
            : [{ required: true, message: '请选择投入仓库' }]
        }
      />
      <ProFormSelect
        name="costAllocationMethod"
        label="成本分摊"
        options={costAllocationOptions}
        rules={[{ required: true, message: '请选择成本分摊方式' }]}
      />
      <ProFormText name="remarks" label="备注" />
    </DrawerForm>
  );
}
